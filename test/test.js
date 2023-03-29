const SteamWorkshopScraper = require('../index.js');
const sws = new SteamWorkshopScraper('Universal');
var assert = require('assert');


describe('SteamWorkshopScraper', function () {
  it('should show 18 entries', async function () {
    await sws.GetCollection(1608290482).then(function (data) { // old collection, hope nobody will ever change this collection
      sws.AddToUpdates(data);
      // console.log(sws.workshopMap);
      assert.equal(data.length, 18);
    });
  });

  it('have map updated', function () {
    assert.equal(sws.workshopMap.size, 18);
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
    sws.AddToUpdates([1384657523, 670764308, 589205263]);
    done();
  });

  it('RemoveFromUpdates array', function (done) {
    sws.RemoveFromUpdates([670764308, 1384657523]);
    assert.equal(sws.workshopMap.size, 19);
    done();
  });

  it('TriggerUpdate and check title from one item', async function () {
    await sws.TriggerUpdate().then(function () {
      assert.equal(sws.workshopMap.get('1999447172').title, 'Super Structures');
    });
  });

  it('GetChangeLog check text and timePosted', async function () {
    await sws.GetChangeLog(478528785).then(function (data) { // very old mod
      // console.log('data', data.data[0].text);
      assert.equal(data.data[0].text, 'Version 1.0');
      assert.equal(data.data[0].timePosted, '2015-07-09T21:59:00.000+00:00');
    });
  });

  it('GetInfo never updated mod', async function () {
    await sws.GetInfo(518030553).then(function (data) {
      // console.log(data);
      assert.equal(data.title, 'TXM: Turret Expansion Mod');
      assert.equal(data.size, '0.036 MB');
      assert.equal(data.timePublished, '2015-09-14T01:52:00.000+00:00');
      assert.equal(data.timeUpdated, '2015-09-14T01:52:00.000+00:00');
      assert.equal(data.image, 'https://steamuserimages-a.akamaihd.net/ugc/421440386976795132/B34EDDA953337D1CD05DBE82BAAA397B0520AB50/?imw=268&imh=268&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=true');
    });
  });

  it('Timezone', async function () {
    const swsTZ = new SteamWorkshopScraper('Europe/Vienna');
    await swsTZ.GetInfo(518030553).then(function (data) {
      // console.log(data);
      assert.equal(data.title, 'TXM: Turret Expansion Mod');
      assert.equal(data.size, '0.036 MB');
      assert.equal(data.timePublished, '2015-09-14T03:52:00.000+02:00');
      assert.equal(data.timeUpdated, '2015-09-14T03:52:00.000+02:00');
      assert.equal(data.image, 'https://steamuserimages-a.akamaihd.net/ugc/421440386976795132/B34EDDA953337D1CD05DBE82BAAA397B0520AB50/?imw=268&imh=268&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=true');
    });
  });
});
