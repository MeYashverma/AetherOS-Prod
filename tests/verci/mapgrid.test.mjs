// The generated city is structurally richer than a grid or a random backdrop.
// Measure its actual drawing and routing data rather than a hand-picked screenshot.
import assert from 'node:assert/strict';
import test from 'node:test';
import { ProcWorld, songSeed } from '../../src/vendor/verci/viz/mapworld.js';

const seed = songSeed({ title: 'Midnight Streets', artist: 'Test Singer' });
const world = new ProcWorld({ seed, names: ['Midnight', 'Garden', 'Glass'] });
const viewport = [-1200, -1200, 1200, 1200];
const city = world.query(viewport);
const angle = ([a, b]) => ((Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI % 180) + 180) % 180;
const area = polygon => Math.abs(polygon.reduce((sum, p, i) => {
  const q = polygon[(i + 1) % polygon.length]; return sum + p[0] * q[1] - q[0] * p[1];
}, 0) / 2);

test('song seed and city stay stable across remounts and seeks, but change with the song or variant', () => {
  assert.equal(seed, songSeed({ title: 'Midnight Streets', artist: 'Test Singer' }));
  assert.notEqual(seed, songSeed({ title: 'Midnight Streets', artist: 'Another Singer' }));
  const same = new ProcWorld({ seed, names: ['Midnight', 'Garden', 'Glass'] });
  const another = new ProcWorld({ seed: seed ^ 0x9e3779b9, names: ['Midnight', 'Garden', 'Glass'] });
  assert.equal(same.label, world.label);
  assert.deepEqual(same.query(viewport).roads.slice(0, 12), city.roads.slice(0, 12));
  assert.notDeepEqual(another.query(viewport).roads.slice(0, 4), city.roads.slice(0, 4));
  assert.ok(world.names.includes('Midnight'), 'only local lyric keywords and synthetic street names are used');
});

test('streets run in many directions, with mostly three-way rather than grid junctions', () => {
  const segments = city.roads.flatMap(road => road.pts.slice(1).map((p, i) => [road.pts[i], p]));
  const axis = segments.filter(s => { const d = angle(s); return d < 12 || d > 168 || Math.abs(d - 90) < 12; }).length / segments.length;
  const bins = new Array(12).fill(0);
  segments.forEach(s => bins[Math.floor(angle(s) / 15)]++);
  assert.ok(segments.length > 2000);
  assert.ok(axis < 0.43, `grid-aligned share: ${axis}`);
  assert.ok(bins.every(n => n / segments.length > 0.03), 'streets span every 15-degree direction');
  const nodes = [...world.nodes.values()].filter(n => Math.abs(n.x) < 800 && Math.abs(n.y) < 800 && n.nb.size >= 2);
  assert.ok(nodes.filter(n => n.nb.size === 3).length / nodes.length > 0.65);
  assert.ok(nodes.filter(n => n.nb.size >= 4).length / nodes.length < 0.02);
  const turns = nodes.filter(n => n.nb.size === 3).flatMap(n => {
    const dirs = [...n.nb].map(id => {
      const p = world.edges.get(`${n.id}>${id}`).pts[1];
      return Math.atan2(p[1] - n.y, p[0] - n.x) * 180 / Math.PI;
    });
    return dirs.flatMap((v, i) => dirs.slice(i + 1).map(u => Math.min(Math.abs(v - u), 360 - Math.abs(v - u))));
  });
  assert.ok(turns.filter(a => Math.abs(a - 90) < 10).length / turns.length < 0.32);
  assert.ok(Math.max(...turns) - Math.min(...turns) > 100);
});

test('blocks vary in footprint; the city has distinct districts, landmarks and drawn infrastructure', () => {
  const blocks = city.areas.filter(a => a.kind !== 'sidewalk'), sizes = blocks.map(b => area(b.pts));
  const mean = sizes.reduce((a, b) => a + b) / sizes.length;
  const cv = Math.sqrt(sizes.reduce((a, b) => a + (b - mean) ** 2, 0) / sizes.length) / mean;
  assert.ok(new Set(blocks.map(b => b.pts.length)).size >= 4, 'different polygon side counts');
  assert.ok(cv > 0.3, 'blocks have visibly different sizes');
  assert.ok(city.bld.length > 400, 'buildings have individual, oriented footprints');
  assert.ok(city.trees.length > 50);
  assert.ok(city.areas.some(a => a.kind === 'park'));
  assert.ok(city.pois.some(p => p.type === 'station'));
  assert.ok(city.pois.some(p => p.type === 'school'));
  assert.ok(city.water.length && city.rails.length && city.roads.some(r => r.bridge));
  for (const road of city.roads) {
    if (road.bridge) {
      assert.equal(world.inWater(...road.pts[2]), true, 'bridge actually crosses the river');
      assert.equal(world.inWater(...road.pts[0]), false, 'north landing is dry');
      assert.equal(world.inWater(...road.pts.at(-1)), false, 'south landing is dry');
      assert.ok([...world.edges.values()].some(edge => edge.road === road), 'bridge belongs to the graph');
    } else assert.ok(road.pts.every(([x, y]) => !world.inWater(x, y)), 'street does not vanish under the river');
  }
  assert.deepEqual(new Set(city.roads.map(r => r.c)), new Set([0, 1, 2, 3]));
  const bank = world.river(0);
  assert.equal(world.inWater(0, bank), true);
  assert.ok(world.districtAt(0, bank));
  assert.ok(new Set([[0, 0], [-1300, -900], [950, 700], [1600, -1700]]
    .map(([x, y]) => world.districtAt(x, y))).size > 1);
});

test('the view is lazy, bounded, and stable on either side of generation-tile seams', () => {
  const small = new ProcWorld({ seed: 602 });
  const near = small.query([880, -65, 960, 65]);
  assert.ok(near.roads.length > 1, 'streets remain visible through the tile boundary');
  const again = new ProcWorld({ seed: 602 });
  again.query([-2400, -2200, 2400, 2200]);
  const after = again.query([880, -65, 960, 65]);
  const signature = list => list.roads.map(r => `${r.id}:${JSON.stringify(r.pts)}`).sort();
  assert.deepEqual(signature(near), signature(after), 'query order does not affect the seams');
  assert.ok(again.tiles.size <= 48, 'map tile cache has a hard bound');
  assert.equal(small.tiles.has('12,12'), false, 'far-away scenery is not eagerly drawn');
});

test('all five attractions occupy real, dry parcels regardless of landmark-query order', () => {
  for (let i = 0; i < 32; i++) {
    const sample = Math.imul(i + 1, 0x9e3779b1) >>> 0;
    const a = new ProcWorld({ seed: sample }), b = new ProcWorld({ seed: sample });
    for (const f of a.landmarks) a.ensure(f.x, f.y);
    for (const f of [...b.landmarks].reverse()) b.ensure(f.x, f.y);
    assert.deepEqual(a.landmarks, b.landmarks, `landmarks for seed ${sample} are deterministic`);
    assert.deepEqual(a.landmarks.map(f => f.type), ['wheel', 'citadel', 'conservatory', 'museum', 'observatory']);
    assert.equal(new Set(a.landmarks.map(f => f.siteId)).size, 5);
    for (const f of a.landmarks) {
      const q = a.query([f.x - 130, f.y - 130, f.x + 130, f.y + 130]);
      assert.equal(q.landmarks.filter(l => l.type === f.type && l.id === f.siteId).length, 1);
      assert.ok(q.areas.some(area => area.kind === (f.type === 'wheel' ? 'park' : 'civic')));
      assert.ok(!a.inWater(f.x, f.y, f.type === 'citadel' ? 35 : 25), `${f.type} stays off the river`);
      assert.ok(q.pois.some(p => p.type === f.type && p.name === f.name));
    }
    assert.ok(a.landmarks[0].name.endsWith('Wheel') && a.landmarks[1].name.endsWith('Citadel'));
    assert.ok(a.river(a.landmarks[1].x) - a.riverHalf(a.landmarks[1].x) - a.landmarks[1].y < 170,
      'citadel remains on the riverfront rather than an unrelated district');
  }
});

test('the opening route reaches a real bridge soon, even after remote scenery was queried', () => {
  for (let i = 0; i < 28; i++) {
    const sample = Math.imul(i + 40, 0x9e3779b1) >>> 0;
    const a = new ProcWorld({ seed: sample }), b = new ProcWorld({ seed: sample });
    assert.ok(a.scenicPlan.length > 1, `seed ${sample} has a connected waterfront route`);
    assert.ok(a.scenicPlan.slice(1).every((id, j) => a.edges.has(`${a.scenicPlan[j]}>${id}`)),
      'the plan is made of actual navigable graph edges');
    b.query([-900, -1200, 900, 850]);
    for (let line = 0; line < 11; line++) assert.deepEqual(a.seg(line), b.seg(line),
      `seed ${sample} line ${line} does not depend on painting the city first`);
    const first = a.segs.findIndex(seg => seg.links.some(key => key.startsWith('bridge:')));
    assert.ok(first >= 0 && first <= 9, `seed ${sample}: crossing appears by lyric ten`);
  }
});

test('even after distant seeks, every route step follows a real continuous street edge', () => {
  for (let i = 0; i < 90; i++) world.seg(i);
  const fragments = new Set([...world.edges.values()].flatMap(e => e.pts.slice(1).map((p, j) => JSON.stringify([e.pts[j], p]))));
  const used = new Set(world.segs.flatMap(s => s.links));
  assert.ok(used.size > 140, 'route explores instead of oscillating along one block');
  for (const [i, segment] of world.segs.entries()) {
    if (i) assert.deepEqual(segment.pts[0], world.segs[i - 1].pts.at(-1), `line ${i} joins the previous`);
    assert.ok(segment.length > 0 && segment.links.length > 0);
    for (let j = 1; j < segment.pts.length; j++)
      assert.ok(fragments.has(JSON.stringify([segment.pts[j - 1], segment.pts[j]])), `line ${i}: route deviates from graph`);
  }
  const same = new ProcWorld({ seed, names: ['Midnight', 'Garden', 'Glass'] });
  for (let i = 0; i < 90; i++) assert.deepEqual(world.seg(i), same.seg(i), `route ${i} is deterministic independent of query order`);
});
