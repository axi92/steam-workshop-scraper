const scrapeIt = require("scrape-it");
const moment = require('moment');
const momentTZ = require('moment-timezone');
const events = require('events');
const async = require("async");
const schedule = require('node-schedule');

class SteamWorkshopScraper {
  constructor() {
    this.workshopItems = {};
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
    this.Event = new events.EventEmitter();
    // var that = this;
    // this.schedule = schedule.scheduleJob('*/10 * * * * *', async function () {
    //   async.forEachOf(that.ids, function (value, key) {
    //     // console.log(value);
    //     that.GetInfo(value).then(function (data) {
    //       // console.log('Info:', data);
    //       // console.log(that.ids[`${value}`].timeUpdated.length);
    //       console.log(`${value}`);
    //       console.log(that.ids[1384657523]);
    //       console.log(that.ids[`${value}`]);
    //       // if (that.ids[`${value}`].timeUpdated.length === '0') {

    //       //   let newArray = {};
    //       //   newArray["title"] = value.title;
    //       //   newArray["size"] = value.size;
    //       //   newArray["timePublished"] = value.timePublished;
    //       //   newArray["timeUpdated"] = value.timeUpdated;
    //       //   newArray["image"] = value.image;
    //       //   that.ids[`${value}`].push(newArray);
    //       //   console.log(that.ids);
    //       //   // modList.[]
    //       // }
    //       // console.log(moment(data.timeUpdated).format());
    //     });
    //   });
    // });
  }

  GetInfo(id) {
    return this.Scrape(this.workShopUrlInfo + id.toString(), this.parseSettingsInfo);
  }

  GetChangeLog(id) {
    return this.Scrape(this.workShopUrlChangelog + id.toString(), this.parseSettingsChangeLog);
  }

  WatchForUpdates(ids) {
    if (Array.isArray(ids) === false) {
      throw new Error('Provided ids are not an array!');
    }
    this.ids = this.ids.concat(ids);
    this.ids = [...new Set(this.ids)];
    // console.log(this.ids);


    // this.Event.emit('update', this.ids);
  }

  // RemoveFromUpdates(ids) {
  //   if (Array.isArray(ids) === false) {
  //     throw new Error('Provided ids are not an array!')
  //   }
  //   this.ids = this.ids.filter(x => !ids.includes(x));
  // }

  Scrape(url, parse) {
    return scrapeIt({
      url: url
    }, parse).then(({
      data,
      response
    }) => {
      // TODO: handle status code and error messages
      // console.log(`Status Code: ${response.statusCode}`)
      if (response.statusCode == 200) {
        return data;
      }
    });
  }

  ParseSteamTime(string) {
    if (string.match('[0-9]{4}')) {
      let parsed = moment(string, 'DD MMM, YYYY @ h:mma').format('YYYY-MM-DD HH:mm');
      let a = momentTZ.tz(parsed, 'America/Los_Angeles');
      if (a.isValid()) {
        var time = moment(a).local();
      } else {
        console.error('not valid date2');
      }
    } else {
      let parsed = moment(string, 'DD MMM @ h:mma').format('YYYY-MM-DD HH:mm');
      let a = momentTZ.tz(parsed, 'America/Los_Angeles');
      if (a.isValid()) {
        var time = moment(a).local();
      } else {
        console.error('not valid date2');
      }
    }
    return time.toISOString(true);
  }
}

module.exports = SteamWorkshopScraper;