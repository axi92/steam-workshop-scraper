const SteamWorkshopScraper = require('./index.js');

var sws = new SteamWorkshopScraper();

sws.GetChangeLog(670764308).then(function (data) { // up to date mod
  console.log('data', data.data[0]);
}); //up to date 18. Aug. um 16:18 Uhr
sws.GetInfo(670764308).then(function (data) {
  console.log('data', data);
}); //up to date 18. Aug. um 16:18 Uhr




sws.GetChangeLog(1384657523).then(function (data) { // Old mod 1384657523
  console.log('data', data.data[0]);
});
sws.GetInfo(1384657523).then(function (data) {
  console.log('data', data);
});



sws.GetChangeLog(589205263).then(function (data) { // Never updated mod 589205263
  console.log('data', data.data[0]);
});
sws.GetInfo(589205263).then(function (data) {
  console.log('data', data);
});