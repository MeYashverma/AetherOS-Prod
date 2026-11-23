// Kinetic type family: the words themselves move.
import { $, esc, clamp, lerp, rnd, smooth, Viz, wordsHTML, light, iconFor, glyphFor } from './core.js';

/* Visual: a centred stack of the current line, one word per row, an icon beside every word that has one. */
export class Visual extends Viz {
  cls = 'k-visual';
  onLine(S) {
    this.el.innerHTML = '';
    if (!S.line || S.gap) { this.spans = []; return; }
    const n = S.tokens.length, cols = n > 7 ? 2 : 1, rows = Math.ceil(n / cols);
    const wrap = $('div', 'stack'); wrap.style.setProperty('--cols', cols);
    wrap.style.setProperty('--fs', `min(${(82 / (rows + 0.6)).toFixed(1)}cqh, ${(cols > 1 ? 11 : 20)}cqw)`);
    wrap.innerHTML = S.tokens.map(w => `<div class="r" data-s="0">${iconFor(w.text)}<span>${esc(w.text)}</span></div>`).join('');
    this.el.append(wrap); this.spans = [...wrap.children];
  }
  tick(S) { if (this.spans.length) light(this.spans, S.gap ? 99 : S.pos); }
}

/* Fisheye: a tight stack of three words bulging through a lens. The sung word is big in the middle,
   the one before it small above, the one after it a small highlighted chip below. A spring gives each step a bounce. */
export class Fisheye extends Viz {
  cls = 'k-fish'; icons = false;
  init() { this.pool = new Map(); this.f = null; this.v = 0; this.fs = 0; }
  tick(S, dt) {
    const L = this.ctx.lyrics; if (S.idx < 0 || !S.tokens.length) return;
    const n = S.tokens.length, cur = L._f0[S.idx] + Math.floor(clamp(S.pos, 0, n - 1)), flat = L.flat;
    if (this.f == null || Math.abs(cur - this.f) > 4) { this.f = cur; this.v = 0; }
    for (let k = 0; k < 3; k++) { const h = Math.min(dt, 0.05) / 3; this.v += (240 * (cur - this.f) - 17 * this.v) * h; this.f += this.v * h; }
    const f = this.f, W = this.w, H = this.h, len = flat[cur].text.length;
    const want = Math.min(W * 0.16, H * 0.2, (W * 0.84) / (Math.max(4, len) * 0.6)) * (this.ctx.theme.scale || 1);
    this.fs = this.fs ? this.fs + (want - this.fs) * Math.min(1, dt * 10) : want;
    const keep = new Set();
    for (let i = Math.max(0, Math.floor(f) - 2); i <= Math.min(flat.length - 1, Math.ceil(f) + 2); i++) {
      const d = i - f, ad = Math.abs(d); if (ad > 1.7) continue; keep.add(i);
      let e = this.pool.get(i);
      if (!e) {
        const ic = this.icons ? glyphFor(flat[i].text, i) : '';
        e = $('div', 'fw', `<i class="l">${ic}</i><span class="t">${esc(flat[i].text)}</span><i class="r">${ic}</i>`);
        e._l = e.firstChild; e._r = e.lastChild; e._has = !!ic; this.el.append(e); this.pool.set(i, e);
      }
      const sc = ad <= 1 ? 1 - 0.58 * ad : 0.42 * (1 - (ad - 1) / 0.7), y = d * this.fs * 0.92;
      const chip = d > 0 ? smooth(0.2, 0.85, d) * (1 - smooth(1.1, 1.6, d)) : 0, cw = clamp(1 - ad * 1.7);
      const o = ad <= 1 ? 1 : 1 - (ad - 1) / 0.7;
      e.style.cssText = `--c:${chip.toFixed(3)};font-size:${this.fs.toFixed(1)}px;opacity:${(o * (d < 0 ? 0.88 : 1)).toFixed(3)};transform:translate(-50%,-50%) translateY(${y.toFixed(1)}px) scale(${((1 + 0.1 * (1 - Math.min(ad, 1))) * sc).toFixed(3)},${sc.toFixed(3)}) rotate(${(-3 * chip).toFixed(2)}deg)`;
      if (e._has) { e._l.style.opacity = cw.toFixed(2); e._r.style.opacity = (1 - cw).toFixed(2); }
    }
    for (const [i, e] of this.pool) if (!keep.has(i)) { e.remove(); this.pool.delete(i); }
  }
  destroy() { this.pool.clear(); super.destroy(); }
}
export class FisheyeVisual extends Fisheye { icons = true; cls = 'k-fish vis'; }

/* Ship: words land one by one on a wall that drifts in 3D. */
export class Ship extends Viz {
  cls = 'k-ship';
  init() {
    this.scene = $('div', 'scene'); this.wall = $('div', 'wall3d'); this.scene.append(this.wall); this.el.append(this.scene);
    this.placed = new Map(); this.rx = 0; this.ry = 0; this.px = 0; this.py = 0; this.t0 = performance.now();
  }
  pos(li, wi, n) {
    // Words of one line run along a drifting row; lines step down the wall with jitter.
    const cols = Math.min(n, 5), row = Math.floor(wi / cols), col = wi % cols, per = Math.min(cols, n - row * cols);
    const x = (col - (per - 1) / 2) * 190 + (rnd(li, wi, 1) - 0.5) * 60;
    const y = ((li % 6) - 2.5) * 150 + row * 110 + (rnd(li, wi, 2) - 0.5) * 36;
    return { x, y, z: (rnd(li, wi, 3) - 0.5) * 360, r: (rnd(li, wi, 4) - 0.5) * 16 };
  }
  tick(S, dt) {
    const fs = Math.max(28, Math.min(this.w * 0.075, 80));
    this.scene.style.setProperty('--fs', fs + 'px');
    if (S.line && !S.gap) {
      const L = this.ctx.lyrics, n = S.tokens.length, cur = Math.floor(S.pos);
      for (let i = 0; i < n; i++) {
        const key = S.idx * 100 + i, lit = i <= cur;
        let e = this.placed.get(key);
        if (lit && !e) {
          const p = this.pos(S.idx, i, n);
          e = $('div', 'sw', esc(S.tokens[i].text)); e._p = p; e._born = performance.now(); e._line = S.idx;
          e.style.setProperty('--x', p.x + 'px'); e.style.setProperty('--y', p.y + 'px'); e.style.setProperty('--z', p.z + 'px'); e.style.setProperty('--r', p.r + 'deg');
          this.wall.append(e); this.placed.set(key, e);
        }
      }
      this.focus = this.placed.get(S.idx * 100 + Math.min(cur, n - 1)) || this.focus;
      for (const [k, e] of this.placed) {
        const age = S.idx - e._line;
        if (age > 3 || age < 0) { e.remove(); this.placed.delete(k); } else e.style.opacity = age === 0 ? 1 : age === 1 ? 0.55 : 0.22;
      }
    }
    const t = (performance.now() - this.t0) / 1000, tgt = this.focus?._p || { x: 0, y: 0, z: 0 }, k = 1 - Math.exp(-dt * 2.2);
    this.px += (-tgt.x - this.px) * k; this.py += (-tgt.y - this.py) * k;
    this.ry = Math.sin(t * 0.21) * 14 + (this.px * -0.012); this.rx = Math.cos(t * 0.17) * 7 + (this.py * 0.01);
    this.wall.style.transform = `translate3d(${this.px.toFixed(1)}px,${this.py.toFixed(1)}px,0) rotateX(${this.rx.toFixed(2)}deg) rotateY(${this.ry.toFixed(2)}deg)`;
  }
}
