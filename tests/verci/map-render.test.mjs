// Exercise the mounted phone and actual canvas draw calls with no map service,
// network response, mock city fixture or browser geolocation.
import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { JSDOM } = require(process.env.JSDOM_PATH || 'jsdom');
const dom = new JSDOM('<div id="stage"></div>', { url: 'https://aether.test' });
for (const name of ['window', 'document', 'HTMLElement', 'HTMLCanvasElement']) globalThis[name] = dom.window[name];
globalThis.devicePixelRatio = 1;
globalThis.matchMedia = () => ({ matches: false });
let network = 0;
globalThis.fetch = () => { network++; throw Error('Lyric City must not make a network request'); };
const calls = [];
const gradient = { addColorStop() {} };
const ctx = new Proxy({
  measureText: text => ({ width: String(text).length * 7 }),
  createLinearGradient: () => gradient, createRadialGradient: () => gradient,
  fillRect(...args) { calls.push({ method: 'fillRect', args }); },
  stroke() { calls.push({ method: 'stroke', color: ctx.strokeStyle }); },
  fillText(text) { calls.push({ method: 'fillText', text }); }
}, { get: (o, key) => o[key] ?? (() => {}), set: (o, key, value) => (o[key] = value, true) });
dom.window.HTMLCanvasElement.prototype.getContext = () => ctx;
dom.window.HTMLElement.prototype.getBoundingClientRect = () => ({ width: 352, height: 764, left: 0, top: 0 });
const { MapStyle } = await import('../../src/vendor/verci/viz/map.js');
const { ProcWorld, songSeed } = await import('../../src/vendor/verci/viz/mapworld.js?v=native-map-6');
const { parseLRC } = await import('../../src/vendor/verci/lrc.js');
const { frameState } = await import('../../src/vendor/verci/viz/core.js');
const lyrics = parseLRC('[00:00.00]Take me home tonight\n[00:05.00]Find the streets\n[00:10.00]Hear the city sing');
const song = { title: 'A road of our own', artist: 'Example Artist' };
const root = document.getElementById('stage');
const create = (L = lyrics) => new MapStyle(root, { song, lyrics: L, duration: () => 15 }).mount();
const frame = (viz, time) => { calls.length = 0; viz.frame(frameState(viz.ctx.lyrics, time), 0.016); };

test('mounts a clearly fictional local city with no hometown, manual place UI, tiles or fetches', () => {
  const viz = create();
  assert.ok(viz.world instanceof ProcWorld);
  assert.equal(viz.seed, songSeed(song));
  assert.equal(viz.ph.dataset.mapSource, 'procedural');
  assert.match(viz.ph.textContent, /GENERATED FOR THIS SONG/);
  assert.match(viz.ph.textContent, /NOT REAL-WORLD DIRECTIONS/);
  assert.doesNotMatch(viz.ph.textContent, /artist origin|hometown|map unavailable|search for place|estimated arrival/i);
  assert.equal(viz.ph.querySelectorAll('img, .map-tiles, .place-search, .attr, .retry').length, 0);
  assert.equal(viz.ptxt.textContent, viz.world.label);
  assert.ok(viz.psub.textContent);
  frame(viz, 0);
  assert.ok(calls.some(c => c.method === 'fillRect'), 'daylight city paints directly to canvas');
  assert.ok(calls.some(c => c.method === 'stroke' && c.color === '#1677ef'), 'blue lyric route is drawn over local streets');
  assert.ok(viz.lastPaint.buildings > 100 && viz.lastPaint.roads > 80, 'extruded buildings and streets render');
  assert.equal(viz.ph.dataset.mapView, '3d');
  assert.ok(calls.some(c => c.method === 'fillText'), 'world labels are drawn');
  assert.equal(network, 0, 'even the initial viewport does not use a map API');
  viz.destroy(); assert.equal(root.children.length, 0);
});

test('playback, lyric words, remaining song time, seeking, road and line count stay synchronized', () => {
  const viz = create();
  frame(viz, 3);
  assert.match(viz.street.textContent, /Take me home tonight/);
  assert.equal(viz.left.textContent, '0:12');
  assert.equal(viz.stops.textContent, '2');
  assert.equal(viz.progress.style.width, '20%');
  assert.equal(viz.roadName.textContent, viz.streetAt(0, viz.info(0).L * frameState(lyrics, 3).p));
  assert.ok(viz.spans.length === 4);
  const start = viz.at(0, 0);
  frame(viz, 8);
  assert.match(viz.street.textContent, /Find the streets/);
  assert.equal(viz.left.textContent, '0:07');
  assert.equal(viz.stops.textContent, '1');
  assert.equal(viz.progress.style.width, `${8 / 15 * 100}%`);
  assert.ok(viz.at(1, viz.info(1).L * 0.6).x !== start.x || viz.at(1, viz.info(1).L * 0.6).y !== start.y);
  frame(viz, 13);
  assert.match(viz.small.textContent, /Final lyric/);
  assert.equal(viz.stops.textContent, '0');
  frame(viz, 3);
  assert.match(viz.street.textContent, /Take me home tonight/);
  assert.equal(viz.left.textContent, '0:12');
  assert.deepEqual(viz.at(0, 0), start, 'backward seek returns to the same connected route');
  assert.ok(viz.cv.width > 0 && viz.cv.height > 0);
  viz.destroy();
  const again = create();
  frame(again, 3);
  assert.equal(again.ptxt.textContent, viz.ptxt.textContent);
  assert.deepEqual(again.info(0).pts, viz.info(0).pts, 'same song remounts the same geometry');
  again.destroy();
  assert.equal(network, 0);
});

test('reroll changes only the generated world; compass offers a real north-up toggle', () => {
  const viz = create(); frame(viz, 6);
  const before = viz.info(1).pts;
  const played = viz.left.textContent;
  const city = viz.world;
  viz.ph.querySelector('.reroll').click();
  assert.notEqual(viz.world, city);
  assert.equal(viz.variant, 1);
  assert.equal(viz.infos.size, 0, 'cached route lengths are invalidated with the city');
  assert.notDeepEqual(viz.info(1).pts, before);
  frame(viz, 6);
  assert.equal(viz.left.textContent, played);
  assert.equal(viz.ph.dataset.mapSource, 'procedural');
  viz.compass.click(); frame(viz, 6);
  assert.equal(viz.northUp, true);
  assert.equal(viz.bearing, 0);
  assert.equal(viz.compass.getAttribute('aria-pressed'), 'true');
  assert.match(viz.compass.getAttribute('aria-label'), /heading-up/);
  viz.compass.click(); frame(viz, 6);
  assert.equal(viz.northUp, false);
  assert.equal(viz.compass.getAttribute('aria-pressed'), 'false');
  assert.notEqual(viz.bearing, 0);
  assert.equal(network, 0);
  viz.destroy(); assert.equal(root.children.length, 0);
});

test('2D/3D and landmark controls switch scenes without interrupting the lyric clock or fetching maps', () => {
  const viz = create(); frame(viz, 3);
  assert.equal(viz.ph.dataset.mapView, '3d');
  assert.ok(viz.camera.pitch < 1);
  viz.tiltToggle.click(); frame(viz, 3);
  assert.equal(viz.ph.dataset.mapView, '2d');
  assert.equal(viz.camera.pitch, 1);
  assert.equal(viz.tiltToggle.getAttribute('aria-pressed'), 'true');
  assert.match(viz.tiltToggle.getAttribute('aria-label'), /3D/);
  viz.tiltToggle.click(); frame(viz, 3);
  assert.equal(viz.ph.dataset.mapView, '3d');
  assert.ok(viz.camera.pitch < 1);
  const first = viz.left.textContent;
  viz.ph.querySelector('.explore-toggle').click(); frame(viz, 8);
  assert.equal(viz.mode, 'explore');
  assert.equal(viz.navHead.hidden, true);
  assert.equal(viz.eta.hidden, true);
  assert.equal(viz.mapTools.hidden, true);
  assert.equal(viz.landmarkSheet.hidden, false);
  assert.match(viz.landmarkTitle.textContent, /Wheel$/);
  assert.match(viz.landmarkPosition.textContent, /1 \/ 2/);
  assert.match(viz.ph.textContent, /FICTIONAL · GENERATED LANDMARK/);
  assert.ok(viz.lastPaint.landmarks.includes('wheel'));
  assert.ok(calls.some(c => c.method === 'fillText' && c.text === viz.landmarkTitle.textContent),
    'wheel has a matching landmark label on the generated canvas');
  viz.ph.querySelector('.next-landmark').click(); frame(viz, 8);
  assert.match(viz.landmarkTitle.textContent, /Citadel$/);
  assert.match(viz.landmarkPosition.textContent, /2 \/ 2/);
  assert.ok(viz.lastPaint.landmarks.includes('citadel'));
  viz.ph.querySelector('.previous-landmark').click(); frame(viz, 8);
  assert.match(viz.landmarkTitle.textContent, /Wheel$/);
  viz.ph.querySelector('.back-route').click(); frame(viz, 3);
  assert.equal(viz.mode, 'navigate');
  assert.equal(viz.navHead.hidden, false);
  assert.equal(viz.eta.hidden, false);
  assert.equal(viz.landmarkSheet.hidden, true);
  assert.equal(viz.left.textContent, first, 'return to lyrics uses the current playback clock');
  assert.ok(calls.some(c => c.method === 'stroke' && c.color === '#1677ef'));
  assert.equal(network, 0);
  viz.destroy(); assert.equal(root.children.length, 0);
});

test('the route is lazy through far seeks; reduced motion suppresses map rotation', () => {
  const many = parseLRC(Array.from({ length: 42 }, (_, i) => `[${String(i * 3 / 60 | 0).padStart(2, '0')}:${String(i * 3 % 60).padStart(2, '0')}.00]Line number ${i}`).join('\n'));
  const viz = create(many);
  frame(viz, 112);
  assert.equal(viz.key, 37);
  assert.equal(viz.world.segs.length, 40, 'current segment plus only two upcoming stops generated');
  frame(viz, 0);
  assert.equal(viz.key, 0);
  assert.equal(viz.world.segs.length, 40, 'rewinding reuses the city, not another randomized route');
  viz.destroy();
  globalThis.matchMedia = () => ({ matches: true });
  const reduced = create();
  frame(reduced, 7);
  assert.equal(reduced.bearing, 0);
  assert.equal(reduced.reduced, true);
  assert.equal(reduced.compass.disabled, true);
  assert.match(reduced.compass.getAttribute('aria-label'), /reduced motion/);
  reduced.destroy();
  globalThis.matchMedia = () => ({ matches: false });
  assert.equal(network, 0);
  assert.equal(root.children.length, 0);
});

test('instrumental breaks keep the car at the preceding lyric and never insert hidden route hops', () => {
  const withBreak = parseLRC('[00:00.00]Follow my voice\n[00:03.00]\n[00:06.00]Find the bridge\n[00:09.00]Stay beside me');
  const viz = create(withBreak);
  let car;
  const draw = viz.draw;
  viz.draw = function (me, ...rest) { car = me; return draw.call(this, me, ...rest); };
  frame(viz, 4);
  assert.deepEqual(car, viz.at(0, viz.info(0).L), 'break holds the first lyric endpoint');
  assert.equal(viz.stops.textContent, '2');
  frame(viz, 6);
  assert.deepEqual(car, viz.at(1, 0), 'next lyric begins at the same graph junction');
  assert.deepEqual(viz.info(0).pts.at(-1), viz.info(1).pts[0]);
  assert.match(viz.street.textContent, /Find the bridge/);
  assert.equal(viz.lyricCount, 3);
  viz.destroy(); assert.equal(root.children.length, 0);
});

test('a musical intro waits at the starting street, and empty lyrics never show a fabricated lyric route', () => {
  const intro = parseLRC('[00:08.00]First words arrive\n[00:11.00]Now follow the light');
  const viz = create(intro);
  const draw = viz.draw;
  let current;
  viz.draw = function (me, ...rest) { current = me; return draw.call(this, me, ...rest); };
  frame(viz, 0);
  assert.deepEqual(current, viz.at(0, 0), 'intro never jumps to the end of the first line');
  assert.match(viz.small.textContent, /Waiting for the first lyric/);
  assert.equal(viz.stops.textContent, '2');
  frame(viz, 8);
  assert.match(viz.street.textContent, /First words arrive/);
  viz.destroy();
  const blankIntro = create(parseLRC('[00:00.00]\n[00:08.00]The first lyric'));
  frame(blankIntro, 3);
  assert.match(blankIntro.small.textContent, /Waiting for the first lyric/);
  assert.equal(blankIntro.stops.textContent, '1');
  blankIntro.destroy();
  const empty = create(parseLRC(''));
  frame(empty, 3);
  assert.match(empty.small.textContent, /No timed lyrics available/);
  assert.match(empty.street.textContent, /Explore a city made for this song/);
  assert.equal(empty.stops.textContent, '0');
  assert.ok(!calls.some(c => c.method === 'stroke' && c.color === '#1677ef'), 'no lyric line means no highlighted route');
  assert.equal(network, 0);
  empty.destroy(); assert.equal(root.children.length, 0);
});
