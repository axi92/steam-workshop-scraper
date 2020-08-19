const scrapeIt = require("scrape-it");
const moment = require('moment');




class SteamWorkshopScraper {
  constructor(lang, timezoneOffset) {
    moment.locale(lang);
    this.scrapeItHeader = {
      "Accept-Language": lang
      // TODO: find fix for timezoneOffset automation
      // Cookie: "timezoneOffset=7200,0"
    };
    this.workShopUrl = 'https://steamcommunity.com/sharedfiles/filedetails/?id=';
    this.scrapPathLastUpdateTime = 'div.detailsStatRight:nth-last-of-type(1)'
  }

  GetLastUpdateTimestamp(id) {
    console.log(this.workShopUrl + id.toString());
    this.Scrape(this.workShopUrl + id.toString(), this.scrapPathLastUpdateTime)
  }

  Scrape(url, parse){
    scrapeIt({
      url: url,
      headers: this.scrapeItHeader
    }, {
      updateDate: parse
    }).then(({
      data,
      response
    }) => {
      // TODO: handle status code and error messages
      // console.log(`Status Code: ${response.statusCode}`)
      if (response.statusCode == 200) {
        // console.log(response);
        console.log(data.updateDate);
        let date = data.updateDate
        this.ParseSteamTime(date);
      }
    });
  }

  ParseSteamTime(string) {
    if (string.match('[0-9]{4}')) {
      return moment(string, 'DD MMM YYYY hh:mm').format("dddd, MMMM Do YYYY, HH:mm");
    } else {
      return moment(string, 'DD. MMM hh:mm').format("dddd, MMMM Do YYYY, HH:mm");
    }
  }
}

var sws = new SteamWorkshopScraper('de');

sws.GetLastUpdateTimestamp(670764308); //up to date 18. Aug. um 16:18 Uhr
// sws.GetLastUpdateTimestamp(1384657523); //old mod
// sws.GetLastUpdateTimestamp(589205263); //never updated