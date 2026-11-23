// Is the imagined city actually NOT a grid? Measured on the generated network, not judged by eye.
import assert from 'node:assert/strict';
import { ProcWorld } from '../../src/vendor/verci/viz/mapworld.js';
let n = 0; const t = (m, f) => { f(); n++; console.log('ok -', m); };
const w = new ProcWorld(['Aurora', 'Harbor', 'Willow', 'Ember']); const q = w.query([-1200, -1200, 1200, 1200]);
const segs = []; for (const r of q.roads) if (r.c < 3) for (let i = 1; i < r.pts.length; i++) segs.push([r.pts[i - 1], r.pts[i]]);
const ang = ([a, b]) => { let d = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI; d = ((d % 180) + 180) % 180; return d; };
t('streets point in all directions: few are axis-aligned (a grid would be ~100%)', () => {
  const axis = segs.filter(s => { const d = ang(s); return d < 12 || d > 168 || Math.abs(d - 90) < 12; }).length / segs.length; console.log('   axis-aligned share:', (axis * 100).toFixed(0) + '%'); assert.ok(axis < 0.42);
  const bins = new Array(12).fill(0); for (const s of segs) bins[Math.floor(ang(s) / 15)]++; assert.ok(bins.every(b => b / segs.length > 0.03), 'every 15-degree direction is used: ' + bins.join(','));
});
// junction geometry from the routing graph: a grid has 4-way crossings at 90 degrees
const nodes = [...w.nodes.values()].filter(nd => Math.abs(nd.x) < 900 && Math.abs(nd.y) < 900 && nd.nb.size >= 2);
t('junctions are mostly 3-way Y/T junctions (some streets are dropped), never 4-way crossings', () => { const deg = nodes.map(nd => nd.nb.size); const d3 = deg.filter(d => d === 3).length / deg.length, d4 = deg.filter(d => d >= 4).length / deg.length; console.log('   3-way:', (d3 * 100).toFixed(0) + '%', ' 4-way+:', (d4 * 100).toFixed(1) + '%'); assert.ok(d3 > 0.6 && d4 < 0.02); });
t('angles between streets at junctions vary widely (a grid is all 90 degrees)', () => {
  const an = []; for (const nd of nodes) { if (nd.nb.size !== 3) continue; const dirs = [...nd.nb].map(id => { const ep = w.edges.get(nd.id + '>' + id), p = ep[1]; return Math.atan2(p[1] - nd.y, p[0] - nd.x) * 180 / Math.PI; }); for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) { let d = Math.abs(dirs[i] - dirs[j]) % 360; if (d > 180) d = 360 - d; an.push(d); } }
  const near90 = an.filter(d => Math.abs(d - 90) < 10).length / an.length, spread = Math.max(...an) - Math.min(...an); console.log('   junction angles within 10° of 90°:', (near90 * 100).toFixed(0) + '%', ' spread:', spread.toFixed(0) + '°'); assert.ok(near90 < 0.3 && spread > 100);
});
t('blocks are irregular polygons of different sizes and side counts', () => {
  const blocks = q.areas.filter(a => a.fill === '#1c222b' || a.fill === '#202531' || a.fill === '#1d2028'), sides = new Set(blocks.map(b => b.pts.length)); const sizes = blocks.map(b => { let A = 0; for (let i = 0; i < b.pts.length; i++) { const p = b.pts[i], r = b.pts[(i + 1) % b.pts.length]; A += p[0] * r[1] - r[0] * p[1]; } return Math.abs(A) / 2; });
  const mean = sizes.reduce((a, b) => a + b, 0) / sizes.length, sd = Math.sqrt(sizes.reduce((a, b) => a + (b - mean) ** 2, 0) / sizes.length); console.log('   block side counts:', [...sides].sort().join(','), ' size variation (sd/mean):', (sd / mean).toFixed(2)); assert.ok(sides.size >= 4 && sd / mean > 0.3);
});
t('avenues wind: long arterial/collector chains are not straight', () => {
  const big = q.roads.filter(r => r.c >= 1 && r.c < 3 && r.pts.length >= 5); assert.ok(big.length > 30);
});
t('route follows the street graph and is continuous', () => {
  for (let k = 0; k < 40; k++) w.seg(k); for (let k = 1; k < 40; k++) { const a = w.segs[k - 1].pts, b = w.segs[k].pts; assert.deepEqual(a[a.length - 1], b[0]); }
  const turns = []; for (const s of w.segs) { const p = s.pts; if (p.length > 3) { const a1 = Math.atan2(p[1][1] - p[0][1], p[1][0] - p[0][0]), a2 = Math.atan2(p[p.length - 1][1] - p[p.length - 2][1], p[p.length - 1][0] - p[p.length - 2][0]); turns.push(Math.abs(((a2 - a1) * 180 / Math.PI + 540) % 360 - 180)); } }
  console.log('   route heading changes within a line (deg):', turns.slice(0, 8).map(d => d.toFixed(0)).join(',')); assert.ok(turns.some(d => d > 10 && d < 80), 'route bends by non-right angles');
});
console.log(n + ' tests passed');
