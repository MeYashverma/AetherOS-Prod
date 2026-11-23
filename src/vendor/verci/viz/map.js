// Native Design Map: night-time turn-by-turn navigation. The map turns so your heading is always up, buildings are
// extruded, and every lyric line is a stretch of road you drive. Two worlds feed the same renderer:
//   - the artist's HOMETOWN, from real OpenStreetMap data (geo.js), when it can be found and loaded
//   - an IMAGINED city (mapworld.js): organic, curving and zigzag streets, a river with bridges, a railway, parks,
//     schools, hospitals, car parks, and street names taken from the lyrics. Used while loading and as the fallback.
// Time left, arrival time and stops left are real playback numbers.
import { $, esc, clamp, lerp, rnd, wordsHTML, light } from './core.js';
import { Phone } from './phone.js';
import { ProcWorld } from './mapworld.js';
import { hometown, fetchOsm, City, primaryArtist } from '../geo.js';

const HW = [4.5, 6.5, 8.5, 12];
const ROAD = [{ casing: '#12141b', fill: '#434b60' }, { casing: '#12141b', fill: '#505873' }, { casing: '#2a2316', fill: '#7a6a3a' }, { casing: '#3a2a12', fill: '#b3873a' }];
const POI = { school: ['#f0883e', 'S'], hospital: ['#ff5c5c', '+'], parking: ['#4a8cff', 'P'], mall: ['#b77bff', 'M'], church: ['#c9b27a', 'C'], station: ['#3ddc84', 'T'], park: ['#3ddc84', ''] };
const PAL = { tower: ['#2c3650', '#232b42', '#1d2338', '#42507a'], office: ['#2d3446', '#262c3b', '#1f2430', '#3d465d'], house: ['#3a3340', '#2f2a35', '#27222d', '#5a4a5c'], wh: ['#2a2f3b', '#242833', '#1e222c', '#363c4c'], inst: ['#3c3a35', '#33312c', '#2a2824', '#58544a'], mall: ['#363047', '#2d283b', '#26212f', '#4b4264'] };
const cap = w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
const fmtT = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
const ARROW = '<svg viewBox="0 0 24 24"><path d="M12 3l-6 8h4v10h4V11h4z"/></svg>';
const PIN = '<svg viewBox="0 0 24 24"><path d="M12 21s-6-5.6-6-10a6 6 0 0 1 12 0c0 4.4-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>';

export class MapStyle extends Phone {
  pcls = 'nd-map';
  build() {
    this.ph.innerHTML = `<div class="cvwrap"></div><div class="nav"><i class="arrow">${ARROW}</i><div><small></small><b class="street"></b></div></div>
      <div class="place">${PIN}<span class="ptxt"></span></div><div class="compass"><svg viewBox="0 0 24 24"><path d="M12 3l4 9H8z" fill="#ff453a" stroke="none"/><path d="M12 21l-4-9h8z" fill="#cfd5e6" stroke="none"/></svg></div>
      <div class="attr"></div><div class="eta"><div><b class="left">0:00</b><small>left</small></div><div><b class="arr">--:--</b><small>arrive</small></div><div><b class="stops">0</b><small>stops</small></div></div>`;
    const q = s => this.ph.querySelector(s);
    this.cvh = q('.cvwrap'); this.cv = $('canvas', 'cv'); this.cvh.append(this.cv); this.g = this.cv.getContext('2d');
    this.small = q('.nav small'); this.street = q('.street'); this.arrow = q('.arrow'); this.compass = q('.compass'); this.ptxt = q('.ptxt'); this.attr = q('.attr');
    this.left = q('.left'); this.arr = q('.arr'); this.stopsEl = q('.stops'); this.spans = []; this.phi = null; this.t0 = performance.now(); this.infos = new Map();
    const words = [...new Set(this.ctx.lyrics.flat.map(w => w.text.replace(/[^\p{L}]/gu, '')).filter(w => w.length > 3))].map(cap);
    this.world = new ProcWorld(words.length ? words : ['Verci', 'Aurora', 'Harbor', 'Willow']); this.ptxt.textContent = 'Imagined city';
    if (this.ctx.opts?.hometown?.() !== false) this.loadHome();
  }
  async loadHome() {
    const artist = primaryArtist(this.ctx.song.artist); this.ptxt.textContent = `Finding ${artist}’s hometown…`;
    try {
      const h = await hometown(artist); if (this.dead) return; if (!h) { this.ptxt.textContent = 'Imagined city'; return; }
      this.ptxt.textContent = `Loading ${h.label}…`; const json = await fetchOsm(h.lat, h.lon); if (this.dead) return;
      const city = new City(json, h.lat, h.lon, h.label); if (city.nodes.size < 20) throw new Error('too little road data');
      this.world = city; this.infos = new Map(); this.phi = null; this.ptxt.textContent = h.label; this.attr.textContent = city.attrib; this.cvh.classList.remove('swap'); void this.cvh.offsetWidth; this.cvh.classList.add('swap');
    } catch { if (!this.dead) this.ptxt.textContent = 'Imagined city'; }
  }
  destroy() { this.dead = true; super.destroy(); }
  info(k) { let r = this.infos.get(k); if (r) return r; const pts = this.world.seg(k), cum = [0]; for (let n = 1; n < pts.length; n++) cum.push(cum[n - 1] + Math.hypot(pts[n][0] - pts[n - 1][0], pts[n][1] - pts[n - 1][1])); r = { pts, cum, L: cum[cum.length - 1] || 1 }; this.infos.set(k, r); return r; }
  at(k, s) { // a point s metres along line k's road, continuing onto the following lines
    for (let guard = 0; guard < 6; guard++) { const f = this.info(k); if (s <= f.L || guard === 5) { s = clamp(s, 0, f.L); let n = 1; while (n < f.cum.length - 1 && f.cum[n] < s) n++; const a = f.pts[n - 1], b = f.pts[n], u = (s - f.cum[n - 1]) / Math.max(1e-6, f.cum[n] - f.cum[n - 1]); return { x: lerp(a[0], b[0], clamp(u)), y: lerp(a[1], b[1], clamp(u)) }; } s -= f.L; k++; }
  }
  resize() { const r = this.cvh.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); this.cv.width = r.width * d; this.cv.height = r.height * d; this.cw = r.width; this.ch = r.height; this.g.setTransform(d, 0, 0, d, 0, 0); }
  onLine(S) {
    if (!S.line || S.gap) return;
    this.street.innerHTML = wordsHTML(S.line.tokens); this.spans = [...this.street.querySelectorAll('.w')]; if (S.jump) this.phi = null;
  }
  tick(S, dt) {
    if (!this.cw) this.resize(); if (!this.cw) return;
    const i = Math.max(0, S.idx), f = this.info(i), q = S.gap ? 1 : S.p, s = q * f.L, me = this.at(i, s), ahead = this.at(i, s + 16);
    if (S.line && !S.gap) light(this.spans, S.pos);
    const target = -Math.PI / 2 - Math.atan2(ahead.y - me.y, ahead.x - me.x);
    if (this.phi == null) this.phi = target; const d = ((target - this.phi + Math.PI * 3) % (Math.PI * 2)) - Math.PI; this.phi += d * (1 - Math.exp(-dt * 6));
    const e1 = this.at(i, Math.max(0, f.L - 12)), e2 = this.at(i, f.L), n1 = this.at(i + 1, 0), n2 = this.at(i + 1, 12);
    let turn = Math.atan2(n2.y - n1.y, n2.x - n1.x) - Math.atan2(e2.y - e1.y, e2.x - e1.x); turn = ((turn + Math.PI * 3) % (Math.PI * 2)) - Math.PI; const deg = turn * 180 / Math.PI, ft = Math.max(0, Math.round((f.L - s) * 3.281 / 10) * 10);
    this.arrow.style.transform = `rotate(${Math.abs(deg) < 22 ? 0 : Math.abs(deg) < 60 ? Math.sign(deg) * 45 : Math.sign(deg) * 90}deg)`; this.compass.style.transform = `rotate(${(this.phi * 180 / Math.PI).toFixed(1)}deg)`;
    this.small.textContent = (ft > 0 ? `In ${ft} ft · ` : 'Now · ') + (Math.abs(deg) < 22 ? 'Continue' : (Math.abs(deg) < 60 ? 'Bear ' : 'Turn ') + (deg > 0 ? 'right' : 'left'));
    const dur = this.ctx.duration(), rem = dur ? Math.max(0, dur - S.t) : 0, k = Math.floor(S.t);
    if (k !== this.k) { this.k = k; this.left.textContent = fmtT(rem); this.arr.textContent = new Date(Date.now() + rem * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }); this.stopsEl.textContent = this.ctx.lyrics.lines.slice(i + 1).filter(l => l.text).length; }
    this.draw(me, i, s);
  }

  draw(me, i, s) {
    const g = this.g, w = this.cw, h = this.ch, z = clamp(w / 270, 0.8, 1.25), ax = w / 2, ay = h * 0.68, cp = Math.cos(this.phi), sp = Math.sin(this.phi), t = (performance.now() - this.t0) / 1000;
    const P = (x, y) => { const dx = x - me.x, dy = y - me.y; return [ax + (dx * cp - dy * sp) * z, ay + (dx * sp + dy * cp) * z]; };
    const poly = (pts, fill, stroke) => { g.beginPath(); pts.forEach(([x, y], n) => n ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.stroke(); } };
    const cs = [[0, 0], [w, 0], [w, h], [0, h]].map(([sx, sy]) => { const dx = (sx - ax) / z, dy = (sy - ay) / z; return [me.x + dx * cp + dy * sp, me.y - dx * sp + dy * cp]; });
    const bb = [Math.min(...cs.map(c => c[0])) - 50, Math.min(...cs.map(c => c[1])) - 50, Math.max(...cs.map(c => c[0])) + 50, Math.max(...cs.map(c => c[1])) + 50], Q = this.world.query(bb);
    g.fillStyle = '#161922'; g.fillRect(0, 0, w, h); g.lineJoin = 'round'; g.lineCap = 'round';
    const strokeS = (arr, wd, col, dash) => { if (!arr.length) return; g.beginPath(); for (const r of arr) r._s.forEach(([x, y], n) => n ? g.lineTo(x, y) : g.moveTo(x, y)); g.strokeStyle = col; g.lineWidth = wd * z; g.setLineDash(dash ? dash.map(d => d * z) : []); g.stroke(); g.setLineDash([]); };
    // ground: blocks, parks, ponds, car parks, fields (in draw order), then water
    for (const a of Q.areas) poly(a.pts.map(p => P(p[0], p[1])), a.fill);
    if (z > 0.8 && Q.lines?.length) { g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 0.8; g.beginPath(); for (const [a, b] of Q.lines) { const p = P(a[0], a[1]), q = P(b[0], b[1]); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); } g.stroke(); }
    for (const wt of Q.water) { const sp2 = wt.pts.map(p => P(p[0], p[1])); poly(sp2, '#12304c', '#2a5f8f'); }
    for (const l of Q.wlines) { l._s = l.pts.map(p => P(p[0], p[1])); strokeS([l], l.w, '#12304c'); }
    // roads by class; bridges get a lighter deck with guard rails
    for (const r of Q.roads) r._s = r.pts.map(p => P(p[0], p[1]));
    for (const c of [-1, 0, 1, 2, 3]) {
      const arr = Q.roads.filter(r => r.c === c && !r.bridge && !r.tunnel); if (!arr.length) continue; const hw = c < 0 ? 1.3 : HW[c];
      if (c < 0) { strokeS(arr, 1.8, 'rgba(120,135,170,.35)', [3, 3]); continue; }
      strokeS(arr, hw * 2 + 3, ROAD[c].casing); strokeS(arr, hw * 2, ROAD[c].fill);
      if (c >= 1) strokeS(arr, c === 3 ? 1.6 : 1, c === 3 ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.16)', [7, 9]);
    }
    const br = Q.roads.filter(r => r.bridge && !r.tunnel && r.c >= 0); if (br.length) { for (const c of [0, 1, 2, 3]) { const a = br.filter(r => r.c === c); if (!a.length) continue; strokeS(a, HW[c] * 2 + 7, '#0c0e14'); strokeS(a, HW[c] * 2 + 3.5, 'rgba(205,215,240,.55)'); strokeS(a, HW[c] * 2, c === 3 ? ROAD[3].fill : '#4a5166'); } }
    for (const rl of Q.rails) { rl._s = rl.pts.map(p => P(p[0], p[1])); strokeS([rl], 8, '#20232d'); strokeS([rl], 5.5, '#8a90a2', [1.8, 5]); strokeS([rl], 1.1, '#c5cadb'); }
    // buildings: extruded, far to near, with sides lit from the left
    const list = []; for (const b of Q.bld) { const sc = b.pts.map(p => P(p[0], p[1])); if (sc.length < 3) continue; let sy = 0; for (const p of sc) sy += p[1]; list.push({ b, sc, sy: sy / sc.length }); } list.sort((p, q) => p.sy - q.sy);
    g.lineWidth = 0.6;
    for (const { b, sc } of list) {
      const ht = b.ht * z * 0.62, pal = PAL[b.kind] || PAL.office, up = p => [p[0], p[1] - ht]; let ar = 0; for (let n = 0; n < sc.length; n++) { const A = sc[n], B = sc[(n + 1) % sc.length]; ar += A[0] * B[1] - B[0] * A[1]; }
      for (let n = 0; n < sc.length; n++) { const A = sc[n], B = sc[(n + 1) % sc.length], dx = B[0] - A[0], dy = B[1] - A[1], nx = ar > 0 ? dy : -dy, ny = ar > 0 ? -dx : dx, len = Math.hypot(nx, ny) || 1; if (ny / len > 0.05) poly([A, B, up(B), up(A)], nx / len < -0.25 ? pal[1] : nx / len > 0.25 ? pal[2] : pal[0], 'rgba(0,0,0,.3)'); }
      const roof = sc.map(up); poly(roof, pal[3], 'rgba(255,255,255,.07)');
      if (b.kind === 'tower' && sc.length === 4) { const gr = g.createLinearGradient(roof[0][0], roof[0][1], roof[2][0], roof[2][1]); gr.addColorStop(0, 'rgba(160,190,255,.22)'); gr.addColorStop(1, 'rgba(160,190,255,0)'); poly(roof, gr); }
    }
    for (const tr of Q.trees) { const [sx, sy] = P(tr.pts[0][0], tr.pts[0][1]), r = tr.r; g.fillStyle = '#10241b'; g.beginPath(); g.arc(sx, sy - 3 * z, r * z, 0, 6.3); g.fill(); g.fillStyle = '#245239'; g.beginPath(); g.arc(sx - r * 0.2 * z, sy - 4.4 * z, r * 0.62 * z, 0, 6.3); g.fill(); }
    // route over the city: driven part dim, the road ahead bright with chevrons
    const done = [], ahead = [[...P(me.x, me.y)]]; for (let k = Math.max(0, i - 30); k < i; k++) for (const p of this.info(k).pts) done.push(P(p[0], p[1]));
    const f = this.info(i); for (let n = 0; n < f.pts.length; n++) { if (f.cum[n] <= s) done.push(P(f.pts[n][0], f.pts[n][1])); else ahead.push(P(f.pts[n][0], f.pts[n][1])); } done.push(ahead[0]);
    for (let k = i + 1; k <= i + 4; k++) for (const p of this.info(k).pts) ahead.push(P(p[0], p[1]));
    const stroke = (pp, col, wd, dash) => { g.beginPath(); pp.forEach(([x, y], n) => n ? g.lineTo(x, y) : g.moveTo(x, y)); g.strokeStyle = col; g.lineWidth = wd * z; g.setLineDash(dash ? dash.map(d => d * z) : []); g.stroke(); g.setLineDash([]); };
    stroke(done, '#3a5ea0', 7); stroke(ahead, 'rgba(255,255,255,.95)', 12); g.shadowColor = '#3d8bff'; g.shadowBlur = 14 * z; stroke(ahead, '#2f7bff', 8.5); g.shadowBlur = 0; stroke(ahead, 'rgba(255,255,255,.75)', 2, [2, 14]);
    // labels: street names set along the road, highway shields, then points of interest
    g.textAlign = 'center'; g.textBaseline = 'middle'; const placed = [], free = (x, y, r) => placed.every(([px, py]) => Math.hypot(px - x, py - y) > r) && placed.push([x, y]);
    const halo = (txt, x, y, col, size, wt = 600) => { g.font = `${wt} ${size}px -apple-system,Inter,system-ui`; g.lineWidth = 3; g.strokeStyle = 'rgba(14,16,22,.9)'; g.lineJoin = 'round'; g.strokeText(txt, x, y); g.fillStyle = col; g.fillText(txt, x, y); };
    for (const r of Q.roads) {
      if (!r.name && !r.ref) continue; if (r.c < 0 || (r.c === 0 && z < 1.0) || r._s.length < 2) continue; const n = r._s.length, m = 1 + Math.floor((n - 1 - 0.01) * rnd(r.id || 1, 3, 1)), A = r._s[m - 1], B = r._s[m];
      const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, len = Math.hypot(B[0] - A[0], B[1] - A[1]); if (mx < 18 || mx > w - 18 || my < h * 0.2 || my > h * 0.88) continue;
      if (r.c === 3) { const ref = r.ref || (r.name || '').replace('Hwy ', ''); if (!ref || !free(mx, my, 70)) continue; g.fillStyle = '#1f6fdb'; g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.beginPath(); g.roundRect(mx - 11 * z, my - 8 * z, 22 * z, 16 * z, 5 * z); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.font = `700 ${9 * z}px Inter,system-ui`; g.fillText(ref.slice(0, 4), mx, my + 0.5); continue; }
      if (!r.name || len < 28 || !free(mx, my, 66)) continue; let ang = Math.atan2(B[1] - A[1], B[0] - A[0]); if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI;
      g.save(); g.translate(mx, my); g.rotate(ang); halo(r.name, 0, 0, r.c >= 2 ? '#e8d8a8' : '#aeb6cc', (r.c >= 2 ? 8.4 : 7.4) * z); g.restore();
    }
    for (const p of Q.pois) { const [sx, sy] = P(p.x, p.y); if (sx < 14 || sx > w - 14 || sy < h * 0.2 || sy > h * 0.86 || !free(sx, sy, 38 * z / 1.2)) continue; const [col, ch] = POI[p.type] || ['#999', '']; if (!POI[p.type]) continue;
      if (ch) { g.fillStyle = col; g.beginPath(); g.arc(sx, sy, 6.4 * z, 0, 6.3); g.fill(); g.fillStyle = p.type === 'church' ? '#222' : '#fff'; g.font = `800 ${7.6 * z}px Inter,system-ui`; g.fillText(ch, sx, sy + 0.4); } else { g.fillStyle = col; g.globalAlpha = 0.9; g.beginPath(); g.arc(sx, sy, 3 * z, 0, 6.3); g.fill(); g.globalAlpha = 1; }
      if (z > 0.75) halo(p.name, sx, sy + 10.5 * z, p.type === 'park' ? '#7fd7a0' : '#cfd5e6', 6.8 * z); }
    // upcoming stops, then you
    for (let k = i; k <= i + 2; k++) { const pts = this.info(k).pts, e = pts[pts.length - 1], [x, y] = P(e[0], e[1]), big = k === i; g.fillStyle = big ? '#ff453a' : 'rgba(255,69,58,.45)'; g.beginPath(); g.arc(x, y - 15 * z, (big ? 8.5 : 6) * z, 0, 6.3); g.fill(); g.beginPath(); g.moveTo(x - 4.5 * z, y - 10 * z); g.lineTo(x, y); g.lineTo(x + 4.5 * z, y - 10 * z); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y - 15 * z, 3 * z, 0, 6.3); g.fill(); }
    const pulse = 14 + 5 * Math.sin(t * 3); g.fillStyle = 'rgba(61,139,255,.2)'; g.beginPath(); g.arc(ax, ay, pulse * z, 0, 6.3); g.fill();
    const cone = g.createLinearGradient(0, ay, 0, ay - 52 * z); cone.addColorStop(0, 'rgba(61,139,255,.55)'); cone.addColorStop(1, 'rgba(61,139,255,0)'); g.fillStyle = cone; g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax - 22 * z, ay - 52 * z); g.lineTo(ax + 22 * z, ay - 52 * z); g.closePath(); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(ax, ay, 9 * z, 0, 6.3); g.fill(); g.fillStyle = '#2f7bff'; g.beginPath(); g.arc(ax, ay, 6.4 * z, 0, 6.3); g.fill();
  }
}
