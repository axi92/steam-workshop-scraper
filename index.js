const scrapeIt = require("scrape-it");
const events = require('events');
const schedule = require('node-schedule');
const debug = require('debug')('steam-workshop-scraper');
const { DateTime, Settings } = require("luxon");

class SteamWorkshopScraper {
  constructor(timeZoneName = undefined) {
    this.minDelay = 20000; // in ms (Steam rate limit: 1 request per 20 seconds)
    this.lastRequestTimestamp = 0;
    this.workshopMap = new Map();
    this.schedule = undefined;
    this.isTriggerUpdateRunning = false; // Prevent recursive TriggerUpdate calls
    this.scrapeQueue = []; // Queue for scrape requests
    this.isScraping = false; // Lock to prevent concurrent scrape calls during rate limiting
    this.workShopUrlInfo = 'https://steamcommunity.com/sharedfiles/filedetails/?id=';
    this.workShopUrlChangelog = 'https://steamcommunity.com/sharedfiles/filedetails/changelog/';
    this.parseSettingsInfo = {
      title: 'div.workshopItemTitle',
      size: '.detailsStatsContainerRight > div:nth-child(1)',
      timePublished: {
        selector: '.detailsStatsContainerRight > div:nth-child(2)',
        convert: x => this.ParseSteamTime(x.replace(/Update: /, ''))
      },
      timeUpdated: {
        selector: '.detailsStatsContainerRight > div:nth-last-child(1)',
        convert: x => this.ParseSteamTime(x.replace(/Update: /, ''))
      },
      image: {
        selector: '#previewImageMain',
        attr: 'src'
      }
    }
    this.parseSettingsChangeLog = {
      data: {
        listItem: ".workshopAnnouncement",
        data: {
          timePosted: {
            selector: "div.headline",
            convert: x => this.ParseSteamTime(x.replace(/Update: /, ''))
          },
          text: {
            selector: "p",
            how: "html",
            convert: x => x.replace(/<br>/g, '\n')
          }
        }
      }
    }
    this.parseCollectionInfo = {
      title: 'div.workshopItemTitle:nth-child(2)',
      timePublished: {
        selector: 'div.rightSectionHolder:nth-child(4) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1)',
        convert: x => this.ParseSteamTime(x.replace(/Update: /, ''))
      },
      timeUpdated: {
        selector: 'div.rightSectionHolder:nth-child(4) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2)',
        convert: x => this.ParseSteamTime(x.replace(/Update: /, ''))
      },
      image: {
        selector: '#CollectionBackgroundImage',
        attr: 'src'
      },
      data: {
        listItem: ".collectionItem",
        data: {
          id: {
            selector: 'div.collectionItemDetails > a:nth-child(1)',
            attr: 'href',
            convert: x => x.replace(/(.*)\=/g, '')
          }
        },
        convert: x => {
          return parseInt(x.id);
        }
      }
    }
    this.parseCollectionOrNot = {
      data: {
        listItem: ".collectionItem",
        data: {
          id: {
            selector: 'div.collectionItemDetails > a:nth-child(1)',
            attr: 'href',
            convert: x => x.replace(/(.*)\=/g, '')
          }
        }
      }
    }
    this.Event = new events.EventEmitter();
    this.schedule = schedule.scheduleJob('28 * * * * *', function () {
      this.TriggerUpdate();
    }.bind(this));
    // Cancel the scheduled job - tests don't need it
    if (this.schedule && typeof this.schedule.cancel === 'function') {
      this.schedule.cancel();
    }
    if(timeZoneName != undefined){
      Settings.defaultZone = timeZoneName;
      if(Settings.defaultZone.valid != true){
        throw new Error('Timezone invalid for constructor SteamWorkshopScraper: ' + timeZoneName)
      }
    }
  }

  async TriggerUpdate(){
    // Prevent recursive calls
    if (this.isTriggerUpdateRunning) {
      debug('TriggerUpdate already running, skipping');
      return;
    }
    this.isTriggerUpdateRunning = true;
    
    try {
      var that = this;
      const arr = Array.from(that.workshopMap);
      
      // Process each item sequentially to respect rate limit
      for (const element of arr) {
        const data = await that.GetInfo(element[0]);
        let preObject = that.workshopMap.get(element[0]);
        let tempObject = {};
        tempObject.id = element[0];
        tempObject.title = data.title;
        tempObject.size = data.size;
        tempObject.timePublished = data.timePublished;
        tempObject.timeUpdated = data.timeUpdated;
        tempObject.image = data.image;
        that.workshopMap.set(element[0], tempObject);
        if (preObject.timeUpdated != undefined && preObject.timeUpdated != data.timeUpdated) { // Workshop item was updated
          // Emit update
          that.Event.emit('update', tempObject);
        }
      }
    } finally {
      this.isTriggerUpdateRunning = false;
    }
  }

  async GetInfo(id) {
    const checkCollection = await this.Scrape(this.workShopUrlInfo + id.toString(), this.parseCollectionOrNot);
    if(checkCollection && checkCollection.data && checkCollection.data.data && checkCollection.data.data.length > 0){ // is collection
      return await this.Scrape(this.workShopUrlInfo + id.toString(), this.parseCollectionInfo);
    } else { // is single mod
      return await this.Scrape(this.workShopUrlInfo + id.toString(), this.parseSettingsInfo);
    }
  }

  async GetChangeLog(id) {
    return this.Scrape(this.workShopUrlChangelog + id.toString(), this.parseSettingsChangeLog);
  }

  async GetCollection(id) {
    let data = await this.Scrape(this.workShopUrlInfo + id.toString(), this.parseCollectionInfo);
    return data;
  }

  AddToUpdates(ids) {
    if (Array.isArray(ids) === false) {
      throw new Error('Provided ids are not an array!');
    }
    for (var i = 0; i < ids.length; i++) {
      let tempObject = {};
      tempObject.id = ids[i];
      tempObject.title = undefined;
      tempObject.size = undefined;
      tempObject.timePublished = undefined;
      tempObject.timeUpdated = undefined;
      tempObject.image = undefined;
      this.workshopMap.set(ids[i], tempObject);
    }
  }

  RemoveFromUpdates(ids) {
    if (Array.isArray(ids) === false) {
      throw new Error('Provided ids are not an array!')
    }
    for (var i = 0; i < ids.length; i++) {
      this.workshopMap.delete(ids[i]);
    }
  }

  async Scrape(url, parse) {
    // Create a promise that resolves when this request can proceed
    return new Promise((resolve, reject) => {
      // Add to queue
      const queueEntry = { url, parse, resolve, reject };
      this.scrapeQueue.push(queueEntry);
      
      // Try to process the queue
      this.processScrapeQueue();
    });
  }
  
  async processScrapeQueue() {
    // Only process if not currently scraping and queue is not empty
    if (this.isScraping || this.scrapeQueue.length === 0) {
      return;
    }
    
    // Get the first item from queue
    const entry = this.scrapeQueue.shift();
    this.isScraping = true;
    
    try {
      // Rate limiting: Steam API allows only 1 request every 20 seconds
      // Wait until the last request is older than minDelay (default 20 seconds)
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTimestamp;
      if (timeSinceLastRequest < this.minDelay) {
        debug('Waiting on the rate limit');
        const waitTime = this.minDelay - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      debug('Scrape', entry.url)
      const { data } = await scrapeIt({ url: entry.url }, entry.parse);
      
      if (data !== undefined) {
        this.lastRequestTimestamp = Date.now();
        entry.resolve(data);
      } else {
        entry.reject(new Error('Scrape returned undefined data'));
      }
    } catch (error) {
      // Handle HTTP 429 (Rate Limit) - retry after 25 seconds
      // Check if error contains 429 or rate limit message
      const errorMessage = error.message ? error.message.toString() : '';
      if (errorMessage.includes('429') || errorMessage.includes('Rate Limit')) {
        debug('Received rate limit error, waiting 25 seconds before retry');
        await new Promise(resolve => setTimeout(resolve, 25000));
        // Re-add this entry to the front of the queue and retry
        this.scrapeQueue.unshift(entry);
        this.isScraping = false;
        this.processScrapeQueue();
        return;
      }
      entry.reject(error);
    } finally {
      this.isScraping = false;
      // Process next item in queue
      this.processScrapeQueue();
    }
  }

  ParseSteamTime(string) {
    debug('ParseStreamTime:', string);
    var steamDefaultTimezone = 'America/Los_Angeles';
    var time;
    let time1 = DateTime.fromFormat(string, "d MMM, yyyy @ h:ma", { locale: 'en', zone: steamDefaultTimezone });
    let time2 = DateTime.fromFormat(string, "d MMM @ h:ma", { locale: 'en', zone: steamDefaultTimezone });
    let time3 = DateTime.fromFormat(string, "MMM d, yyyy @ h:ma", { locale: 'en', zone: steamDefaultTimezone }); // github workflow format
    let time4 = DateTime.fromFormat(string, "MMM d @ h:ma", { locale: 'en', zone: steamDefaultTimezone }); // github workflow format for current year
    if(time1.isValid){
      time = time1;
    } else if(time2.isValid){
      time = time2;
    } else if(time3.isValid){
      time = time3;
    } else if(time4.isValid){
      time = time4;
    } else {
      throw new Error('No time format was found in parser for: ' + string);
    }
    time = time.setZone(Settings.defaultZone);
    return time.toString(true);
  }

  /**
   *
   * @param {number} delay To wait between requests to steam. Default is 20000ms (20 seconds) to comply with Steam's rate limit. Since 2025 steam changed its webserver to limit the requests. When hitting the limit steam returns HTTP 429.
   */
  SetRequestMinDelay(delay) {
    this.minDelay = delay;
  }
}

module.exports = SteamWorkshopScraper;
