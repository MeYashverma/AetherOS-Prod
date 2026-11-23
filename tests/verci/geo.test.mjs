import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pickHometown, primaryArtist, toLocal, City } from '../../src/vendor/verci/geo.js';
import { ProcWorld } from '../../src/vendor/verci/viz/mapworld.js';
let n = 0; const t = (m, f) => { f(); n++; console.log('ok -', m); };
const osm = JSON.parse(readFileSync(new URL('./fixtures/osm.json', import.meta.url)));

t('artist name is reduced to the primary artist', () => { assert.equal(primaryArtist('Dua Lipa feat. Elton John'), 'Dua Lipa'); assert.equal(primaryArtist('A & B'), 'A'); });
t('MusicBrainz result -> hometown and country; weak or wrong matches are rejected', () => {
  const mb = { artists: [{ id: 'x', name: 'Test Artist', score: 100, area: { name: 'Testland', 'iso-3166-1-codes': ['TL'] }, 'begin-area': { name: 'Testville' } }] };
  assert.deepEqual(pickHometown(mb, 'Test Artist'), { place: 'Testville', country: 'Testland', label: 'Testville, Testland', mbid: 'x' });
  assert.equal(pickHometown({ artists: [{ name: 'Someone Else', score: 70, area: { name: 'X' } }] }, 'Test Artist'), null);
  assert.equal(pickHometown({ artists: [] }, 'Test Artist'), null);
  assert.equal(pickHometown({ artists: [{ name: 'Solo', score: 100, area: { name: 'Berlin' } }] }, 'Solo').label, 'Berlin');
});
t('coordinates project to metres around the centre (north is up the screen)', () => {
  const [x, y] = toLocal(35.001, -99.999, 35, -100); assert.ok(x > 80 && x < 100); assert.ok(y < -100 && y > -120);
});
const city = new City(osm, 35.0, -100.0, 'Testville, Testland');
t('OSM data becomes roads, buildings, water, parks and a routable graph', () => {
  assert.ok(city.roads.length >= 14); assert.ok(city.nodes.size > 100);
  const q = city.query([-400, -400, 400, 400]); assert.ok(q.roads.length > 10 && q.bld.length > 10 && q.areas.length >= 1 && q.pois.some(p => p.type === 'school' && p.name === 'Testville Elementary'));
  assert.ok(q.bld.every(b => b.ht >= 5 && b.ht <= 95));
});
t('roads from real data are curved, not straight', () => {
  const r = city.roads.find(x => x.pts.length > 12), [a, b] = [r.pts[0], r.pts[r.pts.length - 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const dev = Math.max(...r.pts.map(p => Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / L)); assert.ok(dev > 8, 'max deviation ' + dev);
});
t('route follows real streets: continuous, each step a real neighbour, deterministic', () => {
  const c2 = new City(osm, 35.0, -100.0); for (let k = 0; k < 40; k++) c2.seg(k);
  for (let k = 1; k < 40; k++) { const a = c2.segs[k - 1].pts, b = c2.segs[k].pts; assert.deepEqual(a[a.length - 1], b[0]); assert.ok(b.length >= 2); }
  const byXY = new Map([...c2.nodes.values()].map(nd => [nd.x + ',' + nd.y, nd])); let steps = 0;
  for (const s of c2.segs) for (let k = 1; k < s.pts.length; k++) { const A = byXY.get(s.pts[k - 1].join(',')), B = byXY.get(s.pts[k].join(',')); assert.ok(A && B && A.nb.has(B.id), 'step is a real road link'); steps++; }
  const c3 = new City(osm, 35.0, -100.0); for (let k = 0; k < 40; k++) c3.seg(k); assert.deepEqual(c3.segs.map(s => s.pts), c2.segs.map(s => s.pts)); assert.ok(steps > 60);
});
t('imagined city has the expected layers and a continuous route (its non-grid geometry is measured in mapgrid.test.mjs)', () => {
  const w = new ProcWorld(['Aurora', 'Harbor', 'Willow', 'Ember']), q = w.query([-600, -600, 600, 600]);
  assert.ok(q.roads.length > 20 && q.bld.length > 30 && q.areas.length > 20 && q.water.length === 1 && q.rails.length === 1);
  for (let k = 0; k < 30; k++) w.seg(k); for (let k = 1; k < 30; k++) { const a = w.segs[k - 1].pts, b = w.segs[k].pts; assert.deepEqual(a[a.length - 1], b[0]); }
});
console.log(n + ' tests passed');
