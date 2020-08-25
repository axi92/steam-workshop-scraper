<h1 align="center">Welcome to steam-workshop-scraper 👋</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-0.0.2-blue.svg?cacheSeconds=2592000" />
  <img src="https://img.shields.io/badge/npm-%3E%3D6.14.6-blue.svg" />
  <img src="https://img.shields.io/badge/node-%3E%3D12.13.1-blue.svg" />
  <a href="https://github.com/axi92/steam-workshop-scraper#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/axi92/steam-workshop-scraper/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/axi92/steam-workshop-scraper/blob/master/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/github/license/axi92/steam-workshop-scraper" />
  </a>
</p>

> Gets data about Steam workshop mods/assets

## Prerequisites

- npm >=6.14.6
- node >=12.13.1

## Install

```sh
npm install steam-workshop-scraper
```

## Useage

```javascript
const SteamWorkshopScraper = require('steam-workshop-scraper');
var sws = new SteamWorkshopScraper();

sws.GetChangeLog(670764308).then(function (data) {
  console.log('Last entry in changelog:', data.data[0]);
});

sws.GetInfo(670764308).then(function (data) {
  console.log('Info:', data);
});
```

## Run tests

```sh
npm run test
```

## Author

👤 **axi92**

* Github: [@axi92](https://github.com/axi92)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/axi92/steam-workshop-scraper/issues).

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2020 [axi92](https://github.com/axi92).<br />
This project is [MIT](https://github.com/axi92/steam-workshop-scraper/blob/master/LICENSE) licensed.

***
_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_