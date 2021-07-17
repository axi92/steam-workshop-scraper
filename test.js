const SteamWorkshopScraper = require('./index.js');
const sws = new SteamWorkshopScraper();

sws.GetCollection(1942048407).then(function (data) { // up to date mod
  // console.log(data);
  sws.AddToUpdates(data);
  console.log(sws.workshopMap);
});


sws.Event.on('update', function(data){
  console.log('data on update:', data);
});

// sws.AddToUpdates([670764308]);
sws.AddToUpdates([1384657523, 670764308, 589205263]);
// sws.RemoveFromUpdates([670764308, 1384657523]);
console.log(sws.workshopMap); // All workshop items and informations, needs some time to update. Those are empty on AddToUpdates() and get populated after max. 10s


sws.GetChangeLog(670764308).then(function (data) { // up to date mod
  console.log('data', data.data);
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