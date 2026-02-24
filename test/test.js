const SteamWorkshopScraper = require('../index.js');
const sws = new SteamWorkshopScraper('Universal');
var assert = require('assert');
const {
  DateTime
} = require("luxon");

// Tests are taking forever because steam is rate limiting the requests so we have to wait between the requests to not get a 429 response.

describe('SteamWorkshopScraper', function () {
  it('should show 2 entries', async function () {
    await sws.GetCollection(3672359286).then(function (collection) {
      sws.AddToUpdates(collection.data);
      // console.log(sws.workshopMap);
      assert.equal(collection.data.length, 2);
    });
  });

  it('have map updated', function () {
    assert.equal(sws.workshopMap.size, 2);
  });

  it('register event', function () {
    tempObject = {
      title: 'TXM: Turret Expansion Mod',
      size: '0.036 MB',
      timePublished: '2015-09-14T03:52:00.000+02:00',
      timeUpdated: '2015-09-14T03:52:00.000+02:00',
      image: 'https://steamuserimages-a.akamaihd.net/ugc/421440386976795132/B34EDDA953337D1CD05DBE82BAAA397B0520AB50/?imw=268&imh=268&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=true'
    }
    sws.Event.on('update', function (data) {
      assert.equal(data, tempObject);
    });
    sws.Event.emit('update', tempObject);
  });

  it('AddToUpdates', function (done) {
    sws.AddToUpdates([670764308]);
    done();
  });

  it('AddToUpdates array', function (done) {
    sws.AddToUpdates([1384657523, 670764308]);
    done();
  });

  it('RemoveFromUpdates array', function (done) {
    sws.RemoveFromUpdates([670764308, 1384657523]);
    assert.equal(sws.workshopMap.size, 2);
    done();
  });

  it('TriggerUpdate and check title from one item', async function () {
    await sws.TriggerUpdate().then(function () {
      assert.equal(sws.workshopMap.get(2228258035).title, 'HTTPLocation aka. Livemap (discontinued)');
    });
  }).timeout(20000);

  it('GetChangeLog check text and timePosted', async function () {
    await sws.GetChangeLog(2228258035).then(function (data) { // very old mod
      assert.equal(data.data[0].text, '- Admins can access range menu');
      assert.equal(data.data[0].timePosted, '2021-06-26T00:02:00.000+00:00');
    });
  }).timeout(20000);

  it('GetInfo mod', async function () {
    await sws.GetInfo(2228258035).then(function (data) {
      assert.equal(data.title, 'HTTPLocation aka. Livemap (discontinued)');
      assert.equal(data.size, '187.269 KB');
      assert.equal(data.timePublished, '2020-09-13T19:49:00.000+00:00');
      assert.equal(data.timeUpdated, '2021-06-26T00:02:00.000+00:00');
      assert.equal(data.image, 'https://images.steamusercontent.com/ugc/1638703839725745812/94DD04A9719BB0311E4218F8480F773833D3AE2F/?imw=268&imh=268&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=true');

    });
  }).timeout(20000);

  it('Timezone', async function () {
    const swsTZ = new SteamWorkshopScraper('Europe/Vienna');
    await swsTZ.GetInfo(518030553).then(function (data) {
      assert.equal(data.title, 'TXM: Turret Expansion Mod');
      assert.equal(data.size, '38.108 KB');
      assert.equal(data.timePublished, '2015-09-14T03:52:00.000+02:00');
      assert.equal(data.timeUpdated, '2015-09-14T03:52:00.000+02:00');
      assert.equal(data.image, 'https://images.steamusercontent.com/ugc/421440386976795132/B34EDDA953337D1CD05DBE82BAAA397B0520AB50/?imw=268&imh=268&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=true');
    });
  }).timeout(20000);

  it('GetInfo on collection', async function () {
    await sws.GetInfo(3672359286).then(function (data) {
      assert.equal(data.title, 'test');
      assert.equal(data.data.length, 2);
    });
  }).timeout(20000);

});
