const moment = require('moment');
const momentTZ = require('moment-timezone');



// 18 Aug @ 7:18am
// 22 Apr, 2016 @ 12:43pm

// US/Pacific
// America/Los_Angeles
// console.log(momentTZ.tz.guess());
console.log(momentTZ.tz('18 Aug @ 7:18am', 'US/Pacific')); // , 'DD MMM H:mma'
// moment.locale('de');
// console.log(moment('18. Aug. um 16:18 Uhr', 'DD. MMM. hh:mm').format("dddd, MMMM Do YYYY, HH:mm"));


// console.log(moment('18. Mai 2018 um 23:39 Uhr', 'DD. MMM. YYYY hh:mm').format("dddd, MMMM Do YYYY, HH:mm"));

// +9h