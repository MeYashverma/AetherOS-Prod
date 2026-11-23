// The "imagined city" for the Map style, built as a genuinely irregular street network (not a warped grid):
//   - Sites are scattered on a jittered lattice; a Delaunay triangulation (Bowyer-Watson) gives their Voronoi cells.
//   - Every Voronoi cell is a city BLOCK (an irregular convex polygon with 4-8 sides); its edges are the STREETS, so
//     junctions are Y/T shaped (degree 3) with all kinds of angles, and street lengths vary.
//   - Hierarchy: where smooth wavy fields change sign between two neighbouring cells, the street between them is an
//     arterial / collector, which makes continuous winding avenues; the rest are local streets, a few of which are
//     dropped (blocks merge, dead ends appear). Smooth highways cut across the mesh, and a river with bridges and a
//     railway cross it.
//   - Blocks are filled by their polygon: houses along the frontage, towers, offices, warehouses, parks, schools,
//     hospitals, malls and car parks.
//   - The route walks this street graph (like geo.City does for real OpenStreetMap data).
// Same interface as geo.City: query(bbox), seg(k), start, label, attrib.
import { rnd } from './core.js';

const HW = [4.5, 6.5, 8.5, 12], SUF = [['St', 'Way', 'Ln', 'Ct', 'Row'], ['Ave', 'Rd', 'Dr'], ['Blvd', 'Pkwy'], ['Hwy']];
const S = 72, T = 1000, MARGIN = 4;                         // lattice spacing, tile size (m), margin in cells
const cap = w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
const sgn = v => v > 0 ? 1 : -1;
const F1 = (x, y) => Math.sin(x / 1300 + 1.1) + Math.sin(y / 1100 + 0.4) + 0.8 * Math.sin((x + y) / 900 + 2);
const F2 = (x, y) => Math.sin(x / 620 + 0.3) + Math.sin(y / 540 + 2.2) + 0.8 * Math.sin((x - y) / 470 + 1);
const ZONE = (x, y) => Math.sin(x / 900 + 0.5) + Math.sin(y / 800 + 1.7) + 0.7 * Math.sin((x + y) / 560);
const bb = pts => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const [x, y] of pts) { if (x < a) a = x; if (y < b) b = y; if (x > c) c = x; if (y > d) d = y; } return [a, b, c, d]; };
const hit = (a, b) => !(a[2] < b[0] || a[0] > b[2] || a[3] < b[1] || a[1] > b[3]);

// ---- geometry helpers (convex polygons in CCW order)
function clipHalf(poly, a, n, d) { // keep points p with (p-a)·n >= d
  const out = []; for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length], sp = (p[0] - a[0]) * n[0] + (p[1] - a[1]) * n[1] - d, sq = (q[0] - a[0]) * n[0] + (q[1] - a[1]) * n[1] - d;
    if (sp >= 0) out.push(p); if ((sp >= 0) !== (sq >= 0)) { const t = sp / (sp - sq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); } } return out;
}
function inset(poly, d) { // d: offset per edge i (edge poly[i] -> poly[i+1])
  let out = poly; for (let i = 0; i < poly.length && out.length > 2; i++) { const A = poly[i], B = poly[(i + 1) % poly.length], dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy) || 1; out = clipHalf(out, A, [-dy / l, dx / l], d[i]); } return out.length > 2 ? out : null;
}
const inside = (poly, p) => { for (let i = 0; i < poly.length; i++) { const A = poly[i], B = poly[(i + 1) % poly.length]; if ((B[0] - A[0]) * (p[1] - A[1]) - (B[1] - A[1]) * (p[0] - A[0]) < 0) return false; } return true; };
const centroid = poly => { let x = 0, y = 0; for (const p of poly) { x += p[0]; y += p[1]; } return [x / poly.length, y / poly.length]; };
const area = poly => { let a = 0; for (let i = 0; i < poly.length; i++) { const A = poly[i], B = poly[(i + 1) % poly.length]; a += A[0] * B[1] - B[0] * A[1]; } return Math.abs(a) / 2; };
const shrink = (poly, c, f) => poly.map(p => [c[0] + (p[0] - c[0]) * f, c[1] + (p[1] - c[1]) * f]);
function longestEdge(poly) { let bi = 0, bl = 0; for (let i = 0; i < poly.length; i++) { const A = poly[i], B = poly[(i + 1) % poly.length], l = Math.hypot(B[0] - A[0], B[1] - A[1]); if (l > bl) { bl = l; bi = i; } } const A = poly[bi], B = poly[(bi + 1) % poly.length]; return { u: [(B[0] - A[0]) / bl, (B[1] - A[1]) / bl], A, B, len: bl }; }
function orientedRect(poly, c, fw, fd) { // a rectangle aligned with the longest edge, shrunk until it fits inside the block
  const { u } = longestEdge(poly), n = [-u[1], u[0]]; let ext = [0, 0, 0, 0]; for (const p of poly) { const a = (p[0] - c[0]) * u[0] + (p[1] - c[1]) * u[1], b = (p[0] - c[0]) * n[0] + (p[1] - c[1]) * n[1]; ext = [Math.min(ext[0], a), Math.max(ext[1], a), Math.min(ext[2], b), Math.max(ext[3], b)]; }
  for (let k = 0; k < 6; k++) { const f = 0.8 - k * 0.08, q = [[ext[0] * f * fw, ext[2] * f * fd], [ext[1] * f * fw, ext[2] * f * fd], [ext[1] * f * fw, ext[3] * f * fd], [ext[0] * f * fw, ext[3] * f * fd]].map(([a, b]) => [c[0] + u[0] * a + n[0] * b, c[1] + u[1] * a + n[1] * b]); if (q.every(p => inside(poly, p))) return q; } return null;
}
function frontage(poly, w0, w1, d0, d1, seed, maxN = 26) { // buildings along every street frontage, rotated with the street
  const out = []; for (let i = 0; i < poly.length && out.length < maxN; i++) { const A = poly[i], B = poly[(i + 1) % poly.length], L = Math.hypot(B[0] - A[0], B[1] - A[1]), u = [(B[0] - A[0]) / L, (B[1] - A[1]) / L], n = [-u[1], u[0]];
    for (let s = 5, k = 0; s < L - 5 && out.length < maxN; k++) { const w = w0 + rnd(seed, i * 31 + k, 1) * (w1 - w0), d = d0 + rnd(seed, i * 31 + k, 2) * (d1 - d0), a = s, b = s + w; if (b > L - 4) break;
      const q = [[a, 3], [b, 3], [b, 3 + d], [a, 3 + d]].map(([x, y]) => [A[0] + u[0] * x + n[0] * y, A[1] + u[1] * x + n[1] * y]); if (q.every(p => inside(poly, p))) out.push(q); s = b + 2 + rnd(seed, i * 31 + k, 3) * 4; } } return out;
}
function delaunay(P) { // Bowyer-Watson; P = [[x,y]...]; returns triangles as index triples
  const n = P.length, big = 1e5, pts = P.concat([[-big, -big], [big, -big], [0, big]]), cc = (a, b, c) => { const ax = pts[a][0], ay = pts[a][1], bx = pts[b][0], by = pts[b][1], cx = pts[c][0], cy = pts[c][1], d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by)), ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d, uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d; return { x: ux, y: uy, r2: (ax - ux) ** 2 + (ay - uy) ** 2 }; };
  let tris = [{ v: [n, n + 1, n + 2], c: cc(n, n + 1, n + 2) }];
  for (let i = 0; i < n; i++) { const bad = [], keep = []; for (const t of tris) ((pts[i][0] - t.c.x) ** 2 + (pts[i][1] - t.c.y) ** 2 < t.c.r2 ? bad : keep).push(t); const cnt = new Map();
    for (const t of bad) for (let e = 0; e < 3; e++) { const a = t.v[e], b = t.v[(e + 1) % 3], k = a < b ? a + ',' + b : b + ',' + a; cnt.set(k, (cnt.get(k) || 0) + 1); }
    for (const t of bad) for (let e = 0; e < 3; e++) { const a = t.v[e], b = t.v[(e + 1) % 3], k = a < b ? a + ',' + b : b + ',' + a; if (cnt.get(k) === 1) keep.push({ v: [a, b, i], c: cc(a, b, i) }); } tris = keep; }
  return tris.filter(t => t.v.every(v => v < n)).map(t => ({ v: t.v, c: t.c }));
}

export class ProcWorld {
  constructor(names) {
    this.names = names; this.label = 'Imagined city'; this.attrib = ''; this.tiles = new Map(); this.nodes = new Map(); this.edges = new Map(); this.segs = [];
    this.ensure(0, 0); let best = null, bd = 1e12; for (const n of this.nodes.values()) { const d = Math.hypot(n.x, n.y); if (d < bd) { bd = d; best = n; } } this.startNode = best; this.start = { x: best.x, y: best.y };
  }
  river = x => -900 + 360 * Math.sin(x / 1250) + 110 * Math.sin(x / 380 + 1.7); rail = x => -330 + 90 * Math.sin(x / 800 + 0.5);
  hwyE = (k, x) => k * 2700 + 420 * Math.sin(x / 1900 + k * 1.7) + 90 * Math.sin(x / 640 + k); hwyN = (k, y) => k * 2900 - 700 + 380 * Math.sin(y / 1700 + k * 2.3) + 80 * Math.sin(y / 590 + k);
  inWater = (x, y, m = 6) => Math.abs(y - this.river(x)) < 85 + m;
  // sites thin out with the district: dense downtown, sparse industrial, so blocks differ greatly in size
  site(cx, cy) { const x = (cx + 0.12 + rnd(cx, cy, 71) * 0.76) * S, y = (cy + 0.12 + rnd(cx, cy, 72) * 0.76) * S, z = ZONE(x, y), keep = z > 1.35 ? 0.92 : z > 0.25 ? 0.62 : z > -1.0 ? 0.4 : 0.26; return rnd(cx, cy, 73) < keep ? [x, y] : null; }
  roadName(c, key) { if (c === 3) return 'Hwy ' + (Math.abs(key) % 90 + 5); const h = Math.abs(key | 0); return this.names[h % this.names.length] + ' ' + SUF[c][(h >> 3) % SUF[c].length]; }

  tile(ix, iy) {
    const k = ix + ',' + iy, hit0 = this.tiles.get(k); if (hit0) return hit0; if (this.tiles.size > 60) this.tiles.clear();
    const x0 = ix * T, y0 = iy * T, x1 = x0 + T, y1 = y0 + T, c0 = Math.floor(x0 / S) - MARGIN, c1 = Math.ceil(x1 / S) + MARGIN, r0 = Math.floor(y0 / S) - MARGIN, r1 = Math.ceil(y1 / S) + MARGIN;
    const sites = [], ids = []; for (let cx = c0; cx <= c1; cx++) for (let cy = r0; cy <= r1; cy++) { const st = this.site(cx, cy); if (st) { sites.push(st); ids.push(cx + ':' + cy); } }
    const tris = delaunay(sites), inc = sites.map(() => []); tris.forEach((t, ti) => t.v.forEach(v => inc[v].push(ti)));
    const out = { roads: [], bld: [], areas: [], water: [], wlines: [], rails: [], pois: [], trees: [], lines: [], graph: [] }, tileBB = [x0 - 60, y0 - 60, x1 + 60, y1 + 60];
    const push = (kind, it) => { it.bb = it.bb || bb(it.pts); out[kind].push(it); return it; };
    const vkey = t => [ids[t.v[0]], ids[t.v[1]], ids[t.v[2]]].sort().join('|');
    sites.forEach((s, si) => {
      if (s[0] < x0 || s[0] >= x1 || s[1] < y0 || s[1] >= y1) return;
      const around = inc[si].map(ti => tris[ti]).sort((a, b) => Math.atan2(a.c.y - s[1], a.c.x - s[0]) - Math.atan2(b.c.y - s[1], b.c.x - s[0])); if (around.length < 3) return;
      const poly = around.map(t => [t.c.x, t.c.y]), m = poly.length, cls = [], eoff = [], drop = [], nbs = [];
      for (let i = 0; i < m; i++) { // edge i joins vertex i and i+1: it separates this site from the shared neighbour
        const a = around[i], b = around[(i + 1) % m], nb = a.v.find(v => v !== si && b.v.includes(v)); nbs.push(nb); const B = sites[nb];
        let c = 0; if (sgn(F1(s[0], s[1])) !== sgn(F1(B[0], B[1]))) c = 2; else if (sgn(F2(s[0], s[1])) !== sgn(F2(B[0], B[1]))) c = 1;
        const pk = ids[si] < ids[nb] ? ids[si] + '~' + ids[nb] : ids[nb] + '~' + ids[si], h = rnd((pk.length * 131 + pk.charCodeAt(0) * 17 + pk.charCodeAt(pk.length - 1) * 7) | 0, pk.charCodeAt(2) | 0, 5), dropped = c === 0 && h < 0.13;
        cls.push(c); drop.push(dropped); eoff.push(dropped ? 1.2 : HW[c] + 0.5);
        if (ids[si] < ids[nb]) { // each street is emitted exactly once, by the lower-id cell
          const p = poly[i], q = poly[(i + 1) % m], L = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, nx = -(q[1] - p[1]) / L, ny = (q[0] - p[0]) / L, pts = [p];
          for (let j = 1; j < 4; j++) { const f = j / 4, off = (rnd(h * 1e4 | 0, j, 9) - 0.5) * 0.16 * L * Math.sin(Math.PI * f); pts.push([p[0] + (q[0] - p[0]) * f + nx * off, p[1] + (q[1] - p[1]) * f + ny * off]); } pts.push(q);
          if (!dropped) { const wet = this.inWater(...centroid([p, q]), 8); if (!(wet && c === 0)) { const id = (h * 1e6) | 0, road = push('roads', { c, pts, name: this.roadName(c, c === 0 ? id : Math.floor((p[0] + p[1]) / 700) * 7 + c), ref: '', bridge: wet, id }); out.graph.push({ a: vkey(a), b: vkey(b), pa: pts[0], pb: pts[pts.length - 1], pts, c, road }); } }
        }
      }
      const gx = s[0], gy = s[1]; if (this.inWater(gx, gy, 40)) return;
      // block: the cell inset by half a street on every side
      const side = inset(poly, cls.map((c, i) => Math.max(0, eoff[i] - 2.5))), bp = inset(poly, eoff); if (!side || !bp || area(bp) < 140) { if (side) push('areas', { pts: side, fill: '#272c39' }); return; }
      push('areas', { pts: side, fill: '#272c39' }); const cn = centroid(bp), z = ZONE(cn[0], cn[1]), zone = z > 1.35 ? 'down' : z > 0.25 ? 'com' : z > -1.0 ? 'res' : 'ind', r = rnd(Math.round(gx), Math.round(gy), 3), seed = (Math.round(gx) * 7 + Math.round(gy) * 13) | 0, nm = this.names[Math.abs(seed) % this.names.length];
      const ground = (fill) => push('areas', { pts: bp, fill }), B = (q, ht, kind) => q && push('bld', { pts: q, ht, kind, id: seed + out.bld.length });
      const tree = (n, poly2 = bp) => { for (let q = 0; q < n * 3 && n > 0; q++) { const t = [cn[0] + (rnd(seed, q, 20) - 0.5) * 2 * 60, cn[1] + (rnd(seed, q, 21) - 0.5) * 2 * 60]; if (inside(poly2, t)) { push('trees', { pts: [t], r: 4 + rnd(seed, q, 22) * 4, bb: [t[0], t[1], t[0], t[1]] }); n--; } } };
      const near = (px, py) => Math.abs(py - this.rail(px)) < 20; if (near(cn[0], cn[1])) { ground('#1d2028'); return; }
      const poi = type => out.pois.push({ type, name: type === 'parking' ? 'Parking' : type === 'park' ? nm + ' Park' : type === 'school' ? nm + (rnd(seed, 1, 8) < 0.5 ? ' Elementary School' : ' High School') : type === 'hospital' ? nm + ' Hospital' : type === 'mall' ? nm + ' Mall' : nm + ' Chapel', x: cn[0], y: cn[1], bb: [cn[0], cn[1], cn[0], cn[1]] });
      if (r < 0.11) { ground('#173629'); tree(12); poi('park'); if (rnd(seed, 2, 6) < 0.4) push('areas', { pts: shrink(bp, cn, 0.33), fill: '#133a58' }); }
      else if (r < 0.17 && zone !== 'down') { ground('#1c222b'); const f = shrink(bp, cn, 0.55); if (area(f) > 500) push('areas', { pts: f, fill: '#1f4a35' }); for (const q of frontage(bp, 46, 60, 14, 18, seed, 1)) B(q, 14, 'inst'); tree(5); poi('school'); }
      else if (r < 0.185 && (zone === 'com' || zone === 'down')) { ground('#202531'); B(orientedRect(bp, cn, 0.8, 0.55), 40, 'inst'); poi('hospital'); }
      else if (r < 0.27) { push('areas', { pts: shrink(bp, cn, 0.96), fill: '#262b37' }); const { u } = longestEdge(bp), n2 = [-u[1], u[0]], lot = shrink(bp, cn, 0.88); for (let a1 = -100; a1 <= 100; a1 += 9) for (const b1 of [-20, 20]) { const p = [cn[0] + u[0] * a1 + n2[0] * (b1 - 9), cn[1] + u[1] * a1 + n2[1] * (b1 - 9)], q = [cn[0] + u[0] * a1 + n2[0] * (b1 + 9), cn[1] + u[1] * a1 + n2[1] * (b1 + 9)]; if (inside(lot, p) && inside(lot, q)) out.lines.push([p, q]); } tree(4); poi('parking'); }
      else if (r < 0.3 && zone === 'com') { ground('#1c222b'); B(orientedRect(bp, cn, 0.9, 0.4), 16, 'mall'); poi('mall'); }
      else if (r < 0.33 && zone === 'res') { ground('#1c222b'); B(orientedRect(bp, cn, 0.4, 0.4), 20, 'inst'); tree(8); poi('church'); }
      else if (zone === 'down') { ground('#202531'); const fr = frontage(bp, 24, 44, 16, 28, seed, 9); if (fr.length) fr.forEach((q, i) => B(q, 28 + rnd(seed, 4 + i, 12) * 62, 'tower')); else B(shrink(bp, cn, 0.55), 40 + rnd(seed, 4, 12) * 40, 'tower'); }
      else if (zone === 'com') { ground('#1c222b'); for (const q of frontage(bp, 22, 40, 16, 26, seed, 8)) B(q, 12 + rnd(seed, 5, 14) * 26, 'office'); }
      else if (zone === 'ind') { ground('#1d2028'); B(orientedRect(bp, cn, 0.92, 0.7), 9 + rnd(seed, 6, 15) * 6, 'wh'); }
      else { ground('#1c222b'); for (const q of frontage(bp, 11, 19, 9, 14, seed)) B(q, 6 + rnd(seed, 7, 16) * 7, 'house'); tree(6); }
    });
    this.tiles.set(k, out); for (const g of out.graph) this.addEdge(g); return out;
  }
  addEdge(g) {
    const A = this.nodes.get(g.a) || (this.nodes.set(g.a, { id: g.a, x: g.pa[0], y: g.pa[1], nb: new Set() }), this.nodes.get(g.a)), B = this.nodes.get(g.b) || (this.nodes.set(g.b, { id: g.b, x: g.pb[0], y: g.pb[1], nb: new Set() }), this.nodes.get(g.b));
    A.nb.add(g.b); B.nb.add(g.a); this.edges.set(g.a + '>' + g.b, g.pts); this.edges.set(g.b + '>' + g.a, g.pts.slice().reverse());
  }
  ensure(x, y) { const ix = Math.floor(x / T), iy = Math.floor(y / T); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) this.tile(ix + a, iy + b); }

  query(b) {
    const out = { roads: [], bld: [], areas: [], water: [], wlines: [], rails: [], pois: [], trees: [], lines: [] };
    for (let ix = Math.floor(b[0] / T); ix <= Math.floor(b[2] / T); ix++) for (let iy = Math.floor(b[1] / T); iy <= Math.floor(b[3] / T); iy++) { const t = this.tile(ix, iy); for (const k of ['roads', 'bld', 'areas', 'pois', 'trees']) for (const it of t[k]) if (hit(it.bb, b)) out[k].push(it); for (const l of t.lines) if (hit(bb(l), b)) out.lines.push(l); }
    const e = 60, x0 = b[0] - e, x1 = b[2] + e, up = [], dn = []; for (let x = x0; x <= x1 + 40; x += 40) { up.push([x, this.river(x) - 85]); dn.push([x, this.river(x) + 85]); } out.water.push({ pts: up.concat(dn.reverse()) });
    const rl = []; for (let x = x0; x <= x1 + 40; x += 40) rl.push([x, this.rail(x)]); out.rails.push({ pts: rl });
    for (let sx = Math.floor(x0 / 1700) * 1700; sx < x1; sx += 1700) out.pois.push({ type: 'station', name: this.names[Math.abs(sx / 1700 | 0) % this.names.length] + ' Station', x: sx, y: this.rail(sx) - 26 });
    // smooth highways (east-west and north-south families) laid over the mesh; bridges where they meet the river
    const hw = (pts, name) => { let run = [], wet = false; const flush = () => { if (run.length > 1) out.roads.push({ c: 3, pts: run, name, ref: name.replace('Hwy ', ''), bridge: wet, id: out.roads.length + 9e6 }); run = []; };
      for (const p of pts) { const w = this.inWater(p[0], p[1], 14); if (run.length && w !== wet) { run.push(p); flush(); } if (!run.length) wet = w; run.push(p); } flush(); };
    for (let k = Math.floor(b[1] / 2700) - 2; k <= Math.ceil(b[3] / 2700) + 2; k++) { const pts = []; for (let x = x0; x <= x1 + 30; x += 30) pts.push([x, this.hwyE(k, x)]); if (pts.some(p => p[1] > b[1] - 80 && p[1] < b[3] + 80)) hw(pts, 'Hwy ' + (Math.abs(k * 11 + 5) % 90 + 5)); }
    for (let k = Math.floor(b[0] / 2900) - 2; k <= Math.ceil(b[2] / 2900) + 2; k++) { const pts = []; for (let y = b[1] - e; y <= b[3] + e + 30; y += 30) pts.push([this.hwyN(k, y), y]); if (pts.some(p => p[0] > b[0] - 80 && p[0] < b[2] + 80)) hw(pts, 'Hwy ' + (Math.abs(k * 13 + 9) % 90 + 5)); }
    for (const r of out.roads) r.bb = r.bb || bb(r.pts); out.roads = out.roads.filter(r => hit(r.bb, b));
    return out;
  }

  // route: walk the street graph, mostly keeping straight, sometimes turning; each lyric line ends at a junction or ~90 m
  seg(k) {
    while (this.segs.length <= k) {
      const n0 = this.segs.length, last = this.segs[n0 - 1]; let node = last ? last.end : this.startNode, from = last ? last.prev : null, dirx = last ? last.dir[0] : 0, diry = last ? last.dir[1] : -1, pts = [[node.x, node.y]], len = 0, steps = 0;
      while (steps++ < 40) {
        this.ensure(node.x, node.y); const opts = [...node.nb].map(i => this.nodes.get(i)).filter(Boolean); if (!opts.length) break; const fwd = opts.filter(o => o.id !== from?.id), pool = fwd.length ? fwd : opts; let best = null, bs = -9;
        for (const o of pool) { const ep = this.edges.get(node.id + '>' + o.id), p1 = ep[Math.min(1, ep.length - 1)], dx = p1[0] - node.x, dy = p1[1] - node.y, l = Math.hypot(dx, dy) || 1, sc = (dx * dirx + dy * diry) / l + rnd(n0, steps * 31 + (node.x | 0), 7) * 0.8; if (sc > bs) { bs = sc; best = o; } }
        const ep = this.edges.get(node.id + '>' + best.id); for (let i = 1; i < ep.length; i++) { len += Math.hypot(ep[i][0] - ep[i - 1][0], ep[i][1] - ep[i - 1][1]); pts.push(ep[i]); }
        const a = ep[ep.length - 2], z = ep[ep.length - 1], l2 = Math.hypot(z[0] - a[0], z[1] - a[1]) || 1; dirx = (z[0] - a[0]) / l2; diry = (z[1] - a[1]) / l2; from = node; node = best; if (len >= 90) break;
      }
      this.segs.push({ pts: pts.length > 1 ? pts : [pts[0], [pts[0][0] + dirx * 20, pts[0][1] + diry * 20]], end: node, prev: from, dir: [dirx, diry] });
    }
    return this.segs[k].pts;
  }
}
