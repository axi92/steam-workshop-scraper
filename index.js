const scrapeIt = require("scrape-it");
const events = require('events');
const schedule = require('node-schedule');
const debug = require('debug')('steam-workshop-scraper');
const { DateTime, Settings } = require("luxon");

class SteamWorkshopScraper {
  constructor(timeZoneName = undefined) {
    this.workshopMap = new Map();
    this.schedule = undefined;
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
    if(timeZoneName != undefined){
      Settings.defaultZone = timeZoneName;
      if(Settings.defaultZone.valid != true){
        throw new Error('Timezone invalid for constructor SteamWorkshopScraper: ' + timeZoneName)
      }
    }
  }

  async TriggerUpdate(){
    var that = this;
    const arr = Array.from(that.workshopMap, function (entry) {
      return { key: entry[0], value: entry[1] };
    });
    return Promise.all(arr.map(async (element) => {
      element = element.value;
      await that.GetInfo(element.id).then(function (data) {
        let preObject = that.workshopMap.get(element.id);
        let tempObject = {};
        tempObject.id = element.id;
        tempObject.title = data.title;
        tempObject.size = data.size;
        tempObject.timePublished = data.timePublished;
        tempObject.timeUpdated = data.timeUpdated;
        tempObject.image = data.image;
        that.workshopMap.set(element.id, tempObject);
        if (preObject.timeUpdated != undefined && preObject.timeUpdated != data.timeUpdated) { // Workshop item was updated
          // Emit update
          that.Event.emit('update', tempObject);
        }
      });
    }));
  }

  async GetInfo(id) {
    let checkCollection = await this.Scrape(this.workShopUrlInfo + id.toString(), this.parseCollectionOrNot)
    if(checkCollection.data.length > 0){ // is collection
      return this.Scrape(this.workShopUrlInfo + id.toString(), this.parseCollectionInfo);
    } else { // is single mod
      return this.Scrape(this.workShopUrlInfo + id.toString(), this.parseSettingsInfo);
    }
  }

  GetChangeLog(id) {
    return this.Scrape(this.workShopUrlChangelog + id.toString(), this.parseSettingsChangeLog);
  }

  GetCollection(id) {
    let that = this;
    return new Promise(async function(resolve, reject) {
      let data = await that.Scrape(that.workShopUrlInfo + id.toString(), that.parseCollectionInfo);
      resolve(data);
    });
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

  Scrape(url, parse) {
    return scrapeIt({
      url: url
    }, parse).then(({
      data
    }) => {
      // TODO: handle status code and error messages
      // console.log(`Status Code: ${data}`)
      // console.log(data)
      if (data != undefined) {
        return data;
      } else {
        console.error('Scrape failed with status code:', response.statusCode);
      }
    });
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
}

module.exports = SteamWorkshopScraper;