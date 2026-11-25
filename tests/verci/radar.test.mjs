import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source = fs.readFileSync(new URL('../../src/modules/radar-and-optics.js', import.meta.url), 'utf8');
function setup(fetch, zoom = 2) {
  const os = { redrawMarkers() {}, renderFlightManifest() {} };
  vm.runInNewContext(source, { window: { extendOS: o => Object.assign(os, o) }, os,
    document: { getElementById: () => null }, fetch, AbortSignal, console, Date });
  os._leafletLoaded = true;
  os.radarMap = { getZoom: () => zoom, getCenter: () => ({ lat: 28, lng: 77 }) };
  os.redrawMarkers = () => {}; os.renderFlightManifest = () => {};
  return os;
}
test('flight radar uses an attributed keyless basemap rather than CARTO tiles', () => {
  assert.match(source, /https:\/\/tile.openstreetmap.org\/\{z\}\/\{x\}\/\{y\}.png/);
  assert.match(source, /openstreetmap.org\/copyright/);
  assert.doesNotMatch(source, /basemaps.cartocdn.com/);
});
test('flight radar exposes provider HTTP errors instead of implying a missing basemap key', async () => {
  const os = setup(async url => ({ ok: false, status: url.includes('opensky') ? 401 : 429 }));
  await os.fetchGlobeData();
  assert.match(os._radarLastError, /OpenSky: HTTP 401 \(access denied\)/);
  assert.match(os._radarLastError, /Airplanes.live: HTTP 429 \(rate limited\)/);
});
test('empty OpenSky results fall back to regional traffic and clear old errors', async () => {
  let requests = 0;
  const os = setup(async url => {
    requests++;
    return { ok: true, json: async () => url.includes('opensky') ? { states: [[null, null, null, null, null, null, null, null]] } :
      { ac: [{ hex: 'abc123', lat: 28, lon: 77, alt_baro: 10000, flight: 'TEST1' }] } };
  });
  os._radarLastError = 'old failure';
  await os.fetchGlobeData();
  assert.equal(requests, 5);
  assert.equal(os.activeFlights.length, 1);
  assert.equal(os._radarLastError, '');
});
test('regional no-aircraft response is not reported as both services being unreachable', async () => {
  const os = setup(async () => ({ ok: true, json: async () => ({ ac: [] }) }), 5);
  await os.fetchGlobeData();
  assert.match(os._radarLastError, /no aircraft for this area/);
});
