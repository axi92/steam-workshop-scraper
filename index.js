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
        convert: x => this.ParseSteamTime(x.replace(/Update: /), '')
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

  GetInfo(id) {
    // console.log('Getinfo', id)
    return this.Scrape(this.workShopUrlInfo + id.toString(), this.parseSettingsInfo);
  }

  GetChangeLog(id) {
    return this.Scrape(this.workShopUrlChangelog + id.toString(), this.parseSettingsChangeLog);
  }

  GetCollection(id) {
    let that = this;
    return new Promise(async function(resolve, reject) {
      let data = await that.Scrape(that.workShopUrlInfo + id.toString(), that.parseCollectionInfo);
      // console.log(data)
      data =  data.data;
      let dataArray = [];
      for (var i = 0; i < data.length; i++) {
        dataArray.push(data[i].id);
      }
      resolve(dataArray);
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
    if (string.match('[0-9]{4}')) { // check if year is with 4 digits
      let aaa = DateTime.fromFormat(string, "d MMM, yyyy @ h:ma", { locale: 'en', zone: steamDefaultTimezone });
      if (aaa.isValid) {
        time = aaa.setZone(Settings.defaultZone);
      } else {
        console.error('not valid date2');
      }
    } else {
      let aaa = DateTime.fromFormat(string, "d MMM @ h:ma", { locale: 'en', zone: steamDefaultTimezone });
      try {
        if (aaa.isValid) {
          time = aaa.setZone(Settings.defaultZone);
        } else {
          console.error('not valid date2');
        }
      } catch (error) {
        debug('var a is:');
        debug(a);
        console.error('try catch error:', error);
      }
    }
    return time.toString(true);
  }
}

module.exports = SteamWorkshopScraper;