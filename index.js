const scrapeIt = require("scrape-it");
const moment = require('moment');

// Promise interface
scrapeIt("https://steamcommunity.com/sharedfiles/filedetails/?id=670764308", {
  updateDate: "div.detailsStatRight:nth-last-of-type(1)",
}).then(({
  data,
  response
}) => {
  console.log(`Status Code: ${response.statusCode}`)
  if (response.statusCode == 200) {
    console.log(data.updateDate);
    let date = data.updateDate
    // console.log(moment(date, [DD MMM ]));
  }
})


// old mod
// scrapeIt("https://steamcommunity.com/sharedfiles/filedetails/?id=1384657523", {
//   updateDate: "div.detailsStatRight:nth-last-of-type(1)",
// }).then(({
//   data,
//   response
// }) => {
//   console.log(`Status Code: ${response.statusCode}`)
//   if (response.statusCode == 200) {
//     console.log(data.updateDate);
//     // console.log(moment(data.updateDate));
//   }
// })


// without update
// scrapeIt("https://steamcommunity.com/sharedfiles/filedetails/?id=589205263", {
//   updateDate: "div.detailsStatRight:nth-last-of-type(1)",
// }).then(({
//   data,
//   response
// }) => {
//   console.log(`Status Code: ${response.statusCode}`)
//   if (response.statusCode == 200) {
//     console.log(data.updateDate);
//     // console.log(moment(data.updateDate));
//   }
// })
