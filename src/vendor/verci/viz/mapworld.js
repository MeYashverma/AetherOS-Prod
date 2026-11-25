// A deterministic, entirely local city for the lyric-map scene. Voronoi blocks
// form an irregular but connected street graph; every highlighted route segment
// is made from one of those drawable street edges. No artist location or network
// service is involved.
import { rnd } from './core.js';

const CELL = 80;                // approximate distance between block centres
const TILE = 920;               // generation unit, not a raster/image tile
const MARGIN = 5;               // extra sites keep Voronoi edges stable at seams
const WIDTH = [6, 8, 11, 15];
const FALLBACK_NAMES = ['Crescent', 'Juniper', 'Lumen', 'Willow', 'Atlas', 'Vesper', 'Iris', 'Marina'];
const CITY = ['Lumen', 'Vesper', 'Meridian', 'Halcyon', 'Aster', 'Solace', 'Cinder', 'Juniper'];
const DISTRICT = ['Lantern Quarter', 'Harbor Ward', 'The Commons', 'Crescent Heights', 'Mosaic Row', 'Foundry District', 'Garden Ward', 'Old Arcade'];
const SUFFIX = [['St', 'Lane', 'Way'], ['Ave', 'Road'], ['Boulevard', 'Drive'], ['Parkway']];
const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
export const songSeed = song => hash(`${song?.artist || ''}\u0000${song?.title || ''}`);
const box = points => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of points) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return [x0, y0, x1, y1];
};
const intersects = (a, b) => a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
const signedArea = poly => poly.reduce((n, p, i) => { const q = poly[(i + 1) % poly.length]; return n + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
const centre = poly => poly.reduce(([x, y], p) => [x + p[0] / poly.length, y + p[1] / poly.length], [0, 0]);
const shrink = (poly, c, f) => poly.map(([x, y]) => [c[0] + (x - c[0]) * f, c[1] + (y - c[1]) * f]);
const within = (poly, [x, y]) => poly.every((a, i) => { const b = poly[(i + 1) % poly.length]; return (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]) >= -0.01; });

// Clip a convex polygon to the inside of one edge, then repeat to create a
// setback. The city retains empty space between its streets and buildings.
function clip(poly, a, normal, distance) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    const u = (p[0] - a[0]) * normal[0] + (p[1] - a[1]) * normal[1] - distance;
    const v = (q[0] - a[0]) * normal[0] + (q[1] - a[1]) * normal[1] - distance;
    if (u >= 0) out.push(p);
    if ((u >= 0) !== (v >= 0)) {
      const t = u / (u - v);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return out;
}
function inset(poly, distances) {
  let out = poly;
  for (let i = 0; i < poly.length && out.length >= 3; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
    if (len < 1) return null;
    out = clip(out, a, [-dy / len, dx / len], distances[i]);
  }
  return out.length >= 3 && Math.abs(signedArea(out)) >= 90 ? out : null;
}
function rectangle(poly, c, length = 0.8, depth = 0.65) {
  let longest = [1, 0], n = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], size = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (size > n) { n = size; longest = [(b[0] - a[0]) / size, (b[1] - a[1]) / size]; }
  }
  const u = longest, v = [-u[1], u[0]];
  const ext = poly.map(p => [(p[0] - c[0]) * u[0] + (p[1] - c[1]) * u[1], (p[0] - c[0]) * v[0] + (p[1] - c[1]) * v[1]]);
  const x = [Math.min(...ext.map(p => p[0])), Math.max(...ext.map(p => p[0]))];
  const y = [Math.min(...ext.map(p => p[1])), Math.max(...ext.map(p => p[1]))];
  for (let f = 0.75; f >= 0.3; f -= 0.09) {
    const corners = [[x[0] * length, y[0] * depth], [x[1] * length, y[0] * depth], [x[1] * length, y[1] * depth], [x[0] * length, y[1] * depth]]
      .map(([a, b]) => [c[0] + f * (u[0] * a + v[0] * b), c[1] + f * (u[1] * a + v[1] * b)]);
    if (corners.every(p => within(poly, p))) return corners;
  }
  return null;
}
function frontage(poly, width, depth, seed, max = 18) {
  const buildings = [];
  for (let edge = 0; edge < poly.length && buildings.length < max; edge++) {
    const a = poly[edge], b = poly[(edge + 1) % poly.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < 25) continue;
    const u = [(b[0] - a[0]) / len, (b[1] - a[1]) / len], v = [-u[1], u[0]];
    for (let s = 5, k = 0; s < len - 7 && buildings.length < max; k++) {
      const w = width * (0.78 + rnd(seed, edge * 67 + k, 1) * 0.48);
      const d = depth * (0.8 + rnd(seed, edge * 67 + k, 2) * 0.4);
      if (s + w > len - 5) break;
      const pts = [[s, 4], [s + w, 4], [s + w, 4 + d], [s, 4 + d]]
        .map(([x, y]) => [a[0] + u[0] * x + v[0] * y, a[1] + u[1] * x + v[1] * y]);
      if (pts.every(p => within(poly, p))) buildings.push(pts);
      s += w + 3 + rnd(seed, edge * 67 + k, 3) * 4;
    }
  }
  return buildings;
}

// Bowyer-Watson triangulation. Voronoi vertices are circumcentres of adjacent
// triangles: streets run along cell edges, making Y/T junctions instead of a grid.
function triangulate(points) {
  const n = points.length, big = 1e6;
  const all = points.concat([[-big, -big], [big, -big], [0, big]]);
  const circumcircle = (a, b, c) => {
    const [ax, ay] = all[a], [bx, by] = all[b], [cx, cy] = all[c];
    const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
    if (Math.abs(d) < 1e-9) return { x: 0, y: 0, r2: -1 };
    const ar = ax * ax + ay * ay, br = bx * bx + by * by, cr = cx * cx + cy * cy;
    const x = (ar * (by - cy) + br * (cy - ay) + cr * (ay - by)) / d;
    const y = (ar * (cx - bx) + br * (ax - cx) + cr * (bx - ax)) / d;
    return { x, y, r2: (ax - x) ** 2 + (ay - y) ** 2 };
  };
  let tris = [{ v: [n, n + 1, n + 2], c: circumcircle(n, n + 1, n + 2) }];
  for (let i = 0; i < n; i++) {
    const holes = new Map(), next = [];
    for (const tri of tris) {
      const dx = points[i][0] - tri.c.x, dy = points[i][1] - tri.c.y;
      if (dx * dx + dy * dy >= tri.c.r2) { next.push(tri); continue; }
      for (let edge = 0; edge < 3; edge++) {
        const a = tri.v[edge], b = tri.v[(edge + 1) % 3];
        const key = a < b ? `${a},${b}` : `${b},${a}`;
        const existing = holes.get(key);
        if (existing) existing.count++; else holes.set(key, { a, b, count: 1 });
      }
    }
    for (const edge of holes.values()) if (edge.count === 1)
      next.push({ v: [edge.a, edge.b, i], c: circumcircle(edge.a, edge.b, i) });
    tris = next;
  }
  return tris.filter(t => t.v.every(i => i < n) && Number.isFinite(t.c.r2));
}

export class ProcWorld {
  constructor({ seed = 1, names = [] } = {}) {
    this.seed = seed >>> 0;
    this.names = [...new Set([...names, ...FALLBACK_NAMES].map(n => String(n).replace(/[^\p{L}\p{N}]/gu, '').slice(0, 14)).filter(n => n.length > 2))].slice(0, 14);
    this.label = CITY[this.seed % CITY.length] + ' City';
    this.tiles = new Map(); this.nodes = new Map(); this.edges = new Map();
    this.segs = []; this.visits = new Map();
    this.phaseX = (this.seed & 1023) - 512; this.phaseY = ((this.seed >>> 10) & 1023) - 512;
    this.landmarks = this.placeLandmarks();
    this.ensure(0, 0);
    const near = [...this.nodes.values()].filter(n => n.nb.size >= 2).sort((a, b) =>
      Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y));
    if (!near.length) throw new Error('City generation produced no connected streets');
    this.startNode = near[0]; this.start = { x: near[0].x, y: near[0].y };
    // Open with a navigable waterfront crossing rather than circling the same
    // blocks. This is a BFS through *actual* dry junctions plus one bridge;
    // afterwards the organic route planner takes over. The plan is decided
    // now, before viewport queries can load extra tiles in a different order.
    this.scenicPlan = this.waterfrontPlan(); this.scenicIndex = 0;
  }
  waterfrontPlan() {
    const bridges = [], seen = new Set();
    for (const [id, edge] of this.edges) {
      if (!edge.road.bridge || seen.has(edge.key)) continue;
      seen.add(edge.key);
      const [a, b] = id.split('>').map(key => this.nodes.get(key));
      const near = a.y > b.y ? a : b, far = a.y > b.y ? b : a;
      bridges.push({ near, far, distance: Math.hypot(near.x - this.start.x, near.y - this.start.y) });
    }
    bridges.sort((a, b) => a.distance - b.distance);
    for (const bridge of bridges) {
      const prev = new Map([[this.startNode.id, null]]), queue = [this.startNode.id];
      for (let i = 0; i < queue.length && !prev.has(bridge.near.id); i++) {
        const current = this.nodes.get(queue[i]);
        for (const id of current.nb) {
          if (prev.has(id) || this.edges.get(`${current.id}>${id}`)?.road.bridge) continue;
          prev.set(id, current.id); queue.push(id);
        }
      }
      if (!prev.has(bridge.near.id)) continue;
      const path = [];
      for (let id = bridge.near.id; id != null; id = prev.get(id)) path.push(id);
      path.reverse(); path.push(bridge.far.id);
      return path;
    }
    return []; // a city can still be explored if this particular local component is isolated
  }
  r(a, b, c) { return rnd((a | 0) ^ this.seed, b, c); }
  river(x) { return -335 + 105 * Math.sin((x + this.phaseX) / 590) + 38 * Math.sin((x - this.phaseY) / 210); }
  riverHalf(x) { return 46 + 9 * Math.sin((x + this.phaseY) / 430); }
  rail(x) { return 430 + 74 * Math.sin((x + this.phaseY) / 810); }
  inWater(x, y, margin = 0) { return Math.abs(y - this.river(x)) < this.riverHalf(x) + margin; }
  placeLandmarks() {
    // Pick real blocks *within this invented graph*. The selected site ID is
    // independent of tile/query order; adjacent parcels become open grounds.
    const wheelX = 300 + (this.r(3, 7, 81) - 0.5) * 230;
    const keepX = -330 + (this.r(4, 8, 82) - 0.5) * 260;
    const wishes = [
      { type: 'wheel', name: `${this.names[this.seed % this.names.length]} Wheel`,
        description: 'Observation wheel · generated landmark', x: wheelX,
        y: this.river(wheelX) + this.riverHalf(wheelX) + 175 },
      { type: 'citadel', name: `${this.names[(this.seed >>> 8) % this.names.length]} Citadel`,
        description: 'Riverside citadel · generated landmark', x: keepX,
        y: this.river(keepX) - this.riverHalf(keepX) - 50 },
      { type: 'conservatory', name: `${this.names[0]} Conservatory`,
        description: 'Glass garden · tropical palms and a vaulted greenhouse', x: 820, y: 430 },
      { type: 'museum', name: `${this.names[1]} Art Museum`,
        description: 'Sculpture court · contemporary art pavilion', x: -850, y: 380 },
      { type: 'observatory', name: `${this.names[2]} Observatory`,
        description: 'Sky terrace · domed observatory and reflecting pool', x: 130, y: 740 }
    ];
    const taken = new Set();
    return wishes.map(wish => {
      const cx = Math.floor(wish.x / CELL), cy = Math.floor(wish.y / CELL);
      const candidates = [];
      for (let dx = -5; dx <= 5; dx++) for (let dy = -5; dy <= 5; dy++) {
        const id = `${cx + dx}:${cy + dy}`, p = this.site(cx + dx, cy + dy);
        if (!p || taken.has(id) || this.inWater(p[0], p[1], wish.type === 'citadel' ? 35 : 75) ||
          Math.abs(p[1] - this.rail(p[0])) < 45) continue;
        candidates.push({ id, p, distance: Math.hypot(p[0] - wish.x, p[1] - wish.y) });
      }
      candidates.sort((a, b) => a.distance - b.distance || a.id.localeCompare(b.id));
      const chosen = candidates[0];
      if (!chosen) throw new Error('Unable to place procedural landmark');
      taken.add(chosen.id);
      return { ...wish, siteId: chosen.id, targetX: chosen.p[0], targetY: chosen.p[1],
        x: chosen.p[0], y: chosen.p[1] };
    });
  }
  field(x, y, k) {
    const a = x + this.phaseX, b = y + this.phaseY;
    if (k === 3) return y - 95 * Math.sin(a / 610 + 0.2);
    if (k === 2) return Math.sin(a / 1100 + 1.1) + Math.sin(b / 900 + 0.4) + 0.7 * Math.sin((a + b) / 840);
    return Math.sin(a / 570 + 0.3) + Math.sin(b / 520 + 2.2) + 0.75 * Math.sin((a - b) / 470);
  }
  zone(x, y) {
    const d = Math.hypot(x - this.phaseX * 0.35, y - this.phaseY * 0.35);
    return 0.65 * (Math.sin((x + this.phaseX) / 760) + Math.sin((y + this.phaseY) / 810 + 1.1)) + 1.75 * Math.exp(-((d / 750) ** 2));
  }
  site(cx, cy) {
    let x = (cx + 0.12 + this.r(cx, cy, 71) * 0.76) * CELL;
    let y = (cy + 0.12 + this.r(cx, cy, 72) * 0.76) * CELL;
    x += 16 * Math.sin((y + this.phaseY) / 280);
    y += 17 * Math.sin((x + this.phaseX) / 330);
    const z = this.zone(x, y), density = z > 1.3 ? 0.9 : z > 0.35 ? 0.7 : z > -0.6 ? 0.5 : 0.32;
    return this.r(cx, cy, 73) < density ? [x, y] : null;
  }
  roadName(cls, key) {
    const h = hash(`${key}:${this.seed}:${cls}`), word = this.names[h % this.names.length];
    return `${word} ${SUFFIX[cls][(h >>> 5) % SUFFIX[cls].length]}`;
  }
  districtAt(x, y) {
    if (this.inWater(x, y, 120)) return 'Riverside';
    if (this.zone(x, y) > 1.6) return 'Central Quarter';
    return DISTRICT[hash(`${Math.floor(x / 680)},${Math.floor(y / 680)},${this.seed}`) % DISTRICT.length];
  }

  tile(ix, iy) {
    const key = `${ix},${iy}`;
    if (this.tiles.has(key)) {
      const cached = this.tiles.get(key); this.tiles.delete(key); this.tiles.set(key, cached);
      return cached;
    }
    const x0 = ix * TILE, y0 = iy * TILE, x1 = x0 + TILE, y1 = y0 + TILE;
    const sites = [], ids = [];
    for (let cx = Math.floor(x0 / CELL) - MARGIN; cx <= Math.ceil(x1 / CELL) + MARGIN; cx++)
      for (let cy = Math.floor(y0 / CELL) - MARGIN; cy <= Math.ceil(y1 / CELL) + MARGIN; cy++) {
        const p = this.site(cx, cy);
        if (p) { sites.push(p); ids.push(`${cx}:${cy}`); }
      }
    const tris = triangulate(sites), incident = sites.map(() => []);
    tris.forEach(t => t.v.forEach(v => incident[v].push(t)));
    const out = { roads: [], bld: [], areas: [], pois: [], trees: [], paths: [], landmarks: [], graph: [] };
    const add = (kind, item) => { item.bb ??= box(item.pts); out[kind].push(item); return item; };
    const reserveLandmark = (feature, pts) => {
      const c = centre(pts);
      feature.x = c[0];
      // Some irregular parcels lean over the shore even when their site is
      // dry. Keep the citadel's full footprint clear of the generated river.
      feature.y = feature.type === 'citadel'
        ? Math.min(c[1], this.river(c[0]) - this.riverHalf(c[0]) - 50) : c[1];
      add('areas', { pts, kind: feature.type === 'wheel' ? 'park' : 'civic' });
      add('landmarks', { type: feature.type, name: feature.name, x: feature.x, y: feature.y,
        pts, id: feature.siteId });
      out.pois.push({ type: feature.type, name: feature.name, x: feature.x, y: feature.y,
        bb: [feature.x, feature.y, feature.x, feature.y] });
    };
    const vertexKey = t => t.v.map(i => ids[i]).sort().join('|');
    sites.forEach(([sx, sy], si) => {
      if (sx < x0 || sx >= x1 || sy < y0 || sy >= y1) return;
      const focal = this.landmarks.find(point => point.siteId === ids[si]);
      const smallFocal = () => {
        if (focal) reserveLandmark(focal, [[sx - 20, sy - 20], [sx + 20, sy - 20],
          [sx + 20, sy + 20], [sx - 20, sy + 20]]);
      };
      const around = incident[si].sort((a, b) =>
        Math.atan2(a.c.y - sy, a.c.x - sx) - Math.atan2(b.c.y - sy, b.c.x - sx));
      if (around.length < 3) { smallFocal(); return; }
      const poly = around.map(t => [t.c.x, t.c.y]);
      if (!poly.every(p => p.every(Number.isFinite)) || signedArea(poly) < 90) { smallFocal(); return; }
      const offsets = [];
      for (let i = 0; i < poly.length; i++) {
        const a = around[i], b = around[(i + 1) % around.length];
        const nb = a.v.find(v => v !== si && b.v.includes(v));
        if (nb == null) { offsets.push(5); continue; }
        const other = sites[nb], shared = ids[si] < ids[nb] ? `${ids[si]}~${ids[nb]}` : `${ids[nb]}~${ids[si]}`;
        const h = hash(shared), r = this.r(h, 5, 7);
        let cls = 0;
        if (this.field(sx, sy, 3) * this.field(...other, 3) < 0) cls = 3;
        else if (this.field(sx, sy, 2) * this.field(...other, 2) < 0) cls = 2;
        else if (this.field(sx, sy, 1) * this.field(...other, 1) < 0) cls = 1;
        const dropped = cls === 0 && r < 0.08;
        offsets.push(dropped ? 2 : WIDTH[cls] + 1);
        if (ids[si] >= ids[nb] || dropped) continue;
        const p = poly[i], q = poly[(i + 1) % poly.length];
        const length = Math.hypot(q[0] - p[0], q[1] - p[1]);
        if (length < 3) continue;
        const normal = [-(q[1] - p[1]) / length, (q[0] - p[0]) / length];
        const pts = [p];
        for (let step = 1; step < 4; step++) {
          const f = step / 4, bend = (this.r(h, step, 9) - 0.5) * Math.min(11, length * 0.12) * Math.sin(Math.PI * f);
          pts.push([p[0] + (q[0] - p[0]) * f + bend * normal[0], p[1] + (q[1] - p[1]) * f + bend * normal[1]]);
        }
        pts.push(q);
        // Ordinary streets stop before the river. Never let a route travel
        // beneath the water just because its (dry) endpoints are connected.
        // Purpose-built bridge edges below are the only crossings.
        if (pts.some(([x, y]) => this.inWater(x, y, 3))) continue;
        const road = add('roads', { c: cls, pts, bridge: false, name: this.roadName(cls, cls === 0 ? shared : Math.floor((sx + sy) / 600)), id: h });
        out.graph.push({ a: vertexKey(a), b: vertexKey(b), pts, road, key: shared });
      }
      if (this.inWater(sx, sy, 30)) { smallFocal(); return; }
      const sidewalk = inset(poly, offsets.map(n => Math.max(2, n - 3)));
      const lot = inset(poly, offsets);
      if (!sidewalk) { smallFocal(); return; }
      add('areas', { pts: sidewalk, kind: 'sidewalk' });
      if (!lot || Math.abs(signedArea(lot)) < 180) { smallFocal(); return; }
      const c = centre(lot), z = this.zone(c[0], c[1]);
      const zone = z > 1.55 ? 'downtown' : z > 0.55 ? 'commercial' : z > -0.6 ? 'residential' : 'industrial';
      const blockSeed = hash(ids[si]) ^ this.seed, chance = this.r(blockSeed, 3, 15);
      const name = this.names[this.r(blockSeed, 4, 16) * this.names.length | 0];
      const ground = kind => add('areas', { pts: lot, kind });
      const building = (pts, kind, ht) => { if (pts) add('bld', { pts, kind, ht, id: blockSeed + out.bld.length }); };
      const landmark = (type, title) => out.pois.push({ type, name: title, x: c[0], y: c[1], bb: [c[0], c[1], c[0], c[1]] });
      const trees = count => {
        for (let attempt = 0; count > 0 && attempt < count * 6 + 30; attempt++) {
          const p = [c[0] + (this.r(blockSeed, attempt, 20) - 0.5) * 140,
            c[1] + (this.r(blockSeed, attempt, 21) - 0.5) * 140];
          if (within(lot, p)) { add('trees', { pts: [p], r: 3.5 + this.r(blockSeed, attempt, 22) * 3 }); count--; }
        }
      };
      if (focal) {
        reserveLandmark(focal, lot);
        trees(focal.type === 'wheel' ? 5 : 3);
        return;
      }
      const grounds = this.landmarks.find(point =>
        Math.hypot(sx - point.targetX, sy - point.targetY) < (point.type === 'wheel' ? 145 : 165));
      if (grounds) {
        ground('park'); trees(7);
        const path = shrink(lot, c, 0.48);
        if (Math.abs(signedArea(path)) > 240) add('paths', { pts: path.concat([path[0]]), kind: 'park' });
        return;
      }
      if (Math.abs(c[1] - this.rail(c[0])) < 22) { ground('rail-yard'); return; }
      if (chance < 0.12) {
        ground('park'); trees(12);
        const path = shrink(lot, c, 0.55);
        if (Math.abs(signedArea(path)) > 240) add('paths', { pts: path.concat([path[0]]), kind: 'park' });
        landmark('park', `${name} Gardens`);
      } else if (chance < 0.18 && zone !== 'downtown') {
        ground('school'); building(rectangle(lot, c, 0.85, 0.45), 'school', 15);
        trees(4); landmark('school', `${name} School`);
      } else if (chance < 0.205 && zone !== 'industrial') {
        ground('civic'); building(rectangle(lot, c, 0.8, 0.6), 'civic', 26);
        landmark('hospital', `${name} Medical`);
      } else if (chance < 0.26) {
        ground('parking'); trees(2);
        const u = [lot[1][0] - lot[0][0], lot[1][1] - lot[0][1]], len = Math.hypot(...u) || 1;
        const axis = [u[0] / len, u[1] / len], normal = [-axis[1], axis[0]];
        for (let offset = -55; offset <= 55; offset += 9) {
          const p = [c[0] + axis[0] * offset - normal[0] * 20, c[1] + axis[1] * offset - normal[1] * 20];
          const q = [p[0] + normal[0] * 9, p[1] + normal[1] * 9];
          if (within(lot, p) && within(lot, q)) add('paths', { pts: [p, q], kind: 'parking' });
        }
      } else if (chance < 0.29 && zone === 'commercial') {
        ground('commercial'); building(rectangle(lot, c, 0.9, 0.45), 'office', 22);
        landmark('market', `${name} Market`);
      } else if (zone === 'downtown') {
        ground('downtown');
        const rows = frontage(lot, 28, 23, blockSeed, 8);
        if (rows.length) rows.forEach((p, k) => building(p, 'tower', 28 + this.r(blockSeed, k, 30) * 42));
        else building(rectangle(lot, c, 0.8, 0.65), 'tower', 40);
      } else if (zone === 'commercial') {
        ground('commercial');
        frontage(lot, 26, 20, blockSeed, 9).forEach((p, k) => building(p, 'office', 13 + this.r(blockSeed, k, 31) * 18));
      } else if (zone === 'industrial') {
        ground('industrial'); building(rectangle(lot, c, 0.95, 0.8), 'warehouse', 12);
      } else {
        ground('residential');
        frontage(lot, 16, 12, blockSeed, 16).forEach((p, k) => building(p, 'house', 7 + this.r(blockSeed, k, 32) * 6));
        trees(3);
      }
    });
    // A bridge is a deliberate graph link between two *existing* waterfront
    // junctions, not a painted stripe or a route through submerged streets.
    // River y is always in generation row -1; the fixed world-space spacing
    // makes bridges independent of viewport size and tile creation order.
    if (iy === -1) {
      const shore = new Map();
      for (const edge of out.graph) {
        shore.set(edge.a, edge.pts[0]); shore.set(edge.b, edge.pts.at(-1));
      }
      for (let k = Math.floor((x0 - 100) / 780); k <= Math.ceil((x1 + 100) / 780); k++) {
        const x = k * 780 + (this.r(k, 7, 21) - 0.5) * 110;
        if (x < x0 || x >= x1) continue;
        const y = this.river(x), width = this.riverHalf(x);
        const nearest = side => [...shore].map(([id, [vx, vy]]) => {
          const limit = this.river(vx) + side * (this.riverHalf(vx) + 10);
          if (Math.abs(vx - x) > 200 || side * (vy - limit) < 0) return null;
          return { id, x: vx, y: vy, score: (vx - x) ** 2 + 0.75 * (vy - limit) ** 2 };
        }).filter(Boolean).sort((a, b) => a.score - b.score)[0];
        const north = nearest(-1), south = nearest(1);
        if (!north || !south) continue;
        const rampN = [x + (north.x - x) * 0.2, y - width - 9];
        const rampS = [x + (south.x - x) * 0.2, y + width + 9];
        const pts = [[north.x, north.y], rampN, [x, y], rampS, [south.x, south.y]];
        const name = `${this.names[hash(`${k}:${this.seed}`) % this.names.length]} Bridge`;
        const road = add('roads', { c: 2, pts, bridge: true, name, id: hash(`bridge:${k}:${this.seed}`) });
        out.graph.push({ a: north.id, b: south.id, pts, road, key: `bridge:${k}` });
      }
    }
    this.tiles.set(key, out);
    for (const edge of out.graph) this.addEdge(edge);
    while (this.tiles.size > 48) this.tiles.delete(this.tiles.keys().next().value);
    return out;
  }
  addEdge({ a, b, pts, road, key }) {
    if (a === b || this.edges.has(`${a}>${b}`)) return;
    const node = (id, p) => {
      if (!this.nodes.has(id)) this.nodes.set(id, { id, x: p[0], y: p[1], nb: new Set() });
      return this.nodes.get(id);
    };
    const A = node(a, pts[0]), B = node(b, pts[pts.length - 1]);
    A.nb.add(b); B.nb.add(a);
    const line = pts.map(p => [...p]);
    line[0] = [A.x, A.y]; line[line.length - 1] = [B.x, B.y];
    road.pts = line;
    const length = line.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - line[i][0], p[1] - line[i][1]), 0);
    this.edges.set(`${a}>${b}`, { pts: line, length, road, key });
    this.edges.set(`${b}>${a}`, { pts: line.slice().reverse(), length, road, key });
  }
  ensure(x, y) {
    // Generate a neighbouring tile only when an edge can actually cross its
    // boundary. This cuts initial work from nine full meshes to four at (0,0).
    const ix = Math.floor(x / TILE), iy = Math.floor(y / TILE);
    const px = x - ix * TILE, py = y - iy * TILE, near = 4 * CELL;
    const xs = [0], ys = [0];
    if (px < near) xs.push(-1); if (px > TILE - near) xs.push(1);
    if (py < near) ys.push(-1); if (py > TILE - near) ys.push(1);
    for (const dx of xs) for (const dy of ys) this.tile(ix + dx, iy + dy);
  }
  query(b) {
    const out = { roads: [], bld: [], areas: [], water: [], rails: [], pois: [], trees: [], paths: [], landmarks: [] };
    const pad = 3 * CELL;
    for (let ix = Math.floor((b[0] - pad) / TILE); ix <= Math.floor((b[2] + pad) / TILE); ix++)
      for (let iy = Math.floor((b[1] - pad) / TILE); iy <= Math.floor((b[3] + pad) / TILE); iy++) {
        const tile = this.tile(ix, iy);
        for (const kind of ['roads', 'bld', 'areas', 'pois', 'trees', 'paths', 'landmarks'])
          for (const item of tile[kind]) if (intersects(item.bb, b)) out[kind].push(item);
      }
    const x0 = b[0] - 45, x1 = b[2] + 45, north = [], south = [], bankN = [], bankS = [];
    for (let x = x0; x <= x1 + 35; x += 35) {
      const y = this.river(x), half = this.riverHalf(x);
      north.push([x, y - half]); south.push([x, y + half]);
      bankN.push([x, y - half - 13]); bankS.push([x, y + half + 13]);
    }
    const river = north.concat(south.reverse());
    if (intersects(box(river), b)) {
      out.water.push({ pts: river });
      out.paths.push({ pts: bankN, kind: 'riverwalk' }, { pts: bankS, kind: 'riverwalk' });
    }
    const rail = [];
    for (let x = x0; x <= x1 + 35; x += 35) rail.push([x, this.rail(x)]);
    if (intersects(box(rail), b)) out.rails.push({ pts: rail });
    for (let x = Math.floor(x0 / 1100) * 1100; x <= x1; x += 1100) {
      const y = this.rail(x) - 22;
      if (x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3])
        out.pois.push({ x, y, name: `${this.names[hash(`${x}:${this.seed}`) % this.names.length]} Station`, type: 'station' });
    }
    return out;
  }
  // Route generation is lazy, deterministic, and follows ONLY actual edges in
  // this procedural graph. Penalise recent/repeated links to avoid oscillation.
  seg(index) {
    while (this.segs.length <= index) {
      const n = this.segs.length, last = this.segs[n - 1];
      let current = last ? last.end : this.startNode;
      let previous = last?.prev || null, heading = last?.dir || [0, -1];
      const pts = [[current.x, current.y]], links = [], steps = [];
      let length = 0, firstStreet = '';
      for (let step = 0; step < 32; step++) {
        this.ensure(current.x, current.y);
        const choices = [...current.nb].map(id => this.nodes.get(id)).filter(Boolean);
        if (!choices.length) break;
        let best = null, bestScore = -Infinity;
        const planned = this.scenicPlan[this.scenicIndex] === current.id ? this.scenicPlan[this.scenicIndex + 1] : null;
        if (planned && current.nb.has(planned)) {
          const next = this.nodes.get(planned), edge = this.edges.get(`${current.id}>${planned}`);
          if (next && edge) best = { next, edge };
        }
        if (!best) for (const next of choices) {
          const edge = this.edges.get(`${current.id}>${next.id}`);
          if (!edge || edge.length < 1) continue;
          const p = edge.pts[Math.min(1, edge.pts.length - 1)];
          const dx = p[0] - current.x, dy = p[1] - current.y, unit = Math.hypot(dx, dy) || 1;
          const visits = this.visits.get(edge.key) || 0;
          const recent = links.includes(edge.key) ? 2 : 0;
          const turn = (dx * heading[0] + dy * heading[1]) / unit;
          const score = turn * 1.3 - visits * 0.65 - recent - (next.id === previous?.id && choices.length > 1 ? 2.1 : 0) -
            (next.nb.size === 1 ? 0.18 : 0) + (edge.road.c >= 2 ? 0.14 : 0) + this.r(hash(current.id), n * 41 + step, hash(next.id)) * 0.36;
          if (score > bestScore) { bestScore = score; best = { next, edge }; }
        }
        if (!best) break;
        const { next, edge } = best;
        if (next.id === planned) this.scenicIndex++;
        if (!firstStreet) firstStreet = edge.road.name;
        pts.push(...edge.pts.slice(1)); links.push(edge.key);
        steps.push({ name: edge.road.name, length: edge.length });
        length += edge.length; this.visits.set(edge.key, (this.visits.get(edge.key) || 0) + 1);
        const a = edge.pts[edge.pts.length - 2], b = edge.pts[edge.pts.length - 1];
        const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        heading = [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
        previous = current; current = next;
        if (length >= 110 && current.nb.size >= 3 || length >= 185) break;
      }
      if (pts.length < 2 || length < 1) throw new Error('Procedural route has no connected street');
      this.segs.push({ pts, end: current, prev: previous, dir: heading, length, street: firstStreet, links, steps });
    }
    return this.segs[index].pts;
  }
}
