const scrapeIt = require("scrape-it");
const moment = require('moment');
const momentTZ = require('moment-timezone');



class SteamWorkshopScraper {
  constructor(lang) {
    // this.lang = lang || 'en';
    // moment.locale(this.lang);
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
  }

  GetInfo(id) {
    return new Promise((resolve, reject) => {
      resolve(this.Scrape(this.workShopUrlInfo + id.toString(), this.parseSettingsInfo));
    });
  }

  GetChangeLog(id) {
    // var that = this;
    return new Promise((resolve, reject) => {
      resolve(this.Scrape(this.workShopUrlChangelog + id.toString(), this.parseSettingsChangeLog));
    });
  }

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
        // console.log(response);
        // console.log(data.updateDate);
        return data;
        // return this.ParseSteamTime(date);
      } else {
        console.error(response.statusCode, ' response status code');
      }
    });
  }

  ParseSteamTime(string) {
    // moment.locale('en'); // Set language to default steam site language
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
    // moment.locale(this.lang); // set global language back
    // time.locale(this.lang);
    return time.toISOString(true);
    // return time.format("dd DD.MM.YYYY HH:mm");
  }
}

// var sws = new SteamWorkshopScraper();

// sws.GetInfo(670764308).then(function (data) {
//   console.log('data', data);
// }); //up to date 18. Aug. um 16:18 Uhr
// sws.GetInfo(1384657523); //old mod original date 18 May, 2018 @ 2:39pm
// sws.GetInfo(589205263); //never updated


// sws.GetChangeLog(670764308).then(function (data) {
//   console.log('data', data.data[0]);
// }); //up to date 18. Aug. um 16:18 Uhr


module.exports = SteamWorkshopScraper;