const moment = require('moment');
const tz = require('moment-timezone');

// console.log(moment('18 Aug @ 7:18am PDT', 'DD MMM @ h:mm').add(9, 'hours'));
console.log(tz('18 Aug @ 7:18am', 'PDT'));

// +9h