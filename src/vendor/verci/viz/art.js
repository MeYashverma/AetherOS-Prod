// Original styles inspired by kinetic-typography and lyric-edit videos. I could not watch the referenced videos,
// so these are interpretations of their descriptions, not copies.
import { $, esc, clamp, lerp, rnd, backOut, ease, Viz, light, wordsHTML, iconFor, canvasFor } from './core.js';

const flatIdx = (L, S) => L._f0[S.idx] + clamp(Math.floor(S.pos), 0, S.tokens.length - 1);

/* Kinetic: full-bleed, one word per cut. The word is scaled to fill the frame on a flat colour block, with the
   same word echoing behind it, hard cuts, shakes, stretches, 90-degree turns and glitch slices. */
const PAL = [['#ff2a6d', '#fff'], ['#ffe600', '#111'], ['#00e5ff', '#111'], ['#111', '#fff'], ['#fff', '#111'], ['#ff6b00', '#111'], ['#7cff01', '#111'], ['#5b2bff', '#fff']];
export class Kinetic extends Viz {
  cls = 'k-mia';
  init() { this.last = -1; this.cv = document.createElement('canvas').getContext('2d'); this.shake = 0; this.cap = $('div', 'cap'); this.el.append(this.cap); this.stage = $('div', 'cut'); this.el.prepend(this.stage); }
  fit(word, vertical) {
    const fam = getComputedStyle(this.el).fontFamily; this.cv.font = `900 100px ${fam}`; const wpx = Math.max(1, this.cv.measureText(word.toUpperCase()).width);
    const W = vertical ? this.h : this.w, H = vertical ? this.w : this.h;
    return clamp(Math.min(W * 0.94 / wpx * 100, H * 0.62), 24, 900);
  }
  onLine(S) { // caption of the whole line, the sung word highlighted
    if (!S.line || S.gap) { this.cap.innerHTML = ''; this.spans = []; return; }
    this.cap.innerHTML = wordsHTML(S.tokens); this.spans = [...this.cap.querySelectorAll('.w')];
  }
  tick(S, dt) {
    if (S.idx < 0 || !S.tokens.length) return;
    const L = this.ctx.lyrics, cur = flatIdx(L, S);
    if (this.spans?.length) light(this.spans, S.gap ? 99 : S.pos);
    if (cur !== this.last) {
      this.last = cur; const word = L.flat[cur].text.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '') || L.flat[cur].text, [bg, fg] = PAL[(cur * 3 + Math.floor(rnd(cur, 1) * 3)) % PAL.length];
      const vertical = word.length <= 6 && this.h > this.w * 0.8 && rnd(cur, 2) < 0.3, v = Math.floor(rnd(cur, 3) * 5), fs = this.fit(word, vertical);
      this.stage.style.background = bg; this.stage.style.setProperty('--fg', fg); this.stage.dataset.v = v;
      const echo = Array.from({ length: 7 }, (_, k) => `<i style="--k:${k};--d:${k % 2 ? -1 : 1}">${esc(word)} ${esc(word)} ${esc(word)}</i>`).join('');
      this.stage.innerHTML = `<div class="echo" style="font-size:${(fs * 0.34).toFixed(0)}px">${echo}</div><div class="mw${vertical ? ' vert' : ''}" style="font-size:${fs.toFixed(0)}px"><span>${esc(word)}</span>${v === 4 ? `<span class="sl">${esc(word)}</span>` : ''}</div>`;
      this.shake = 1; this.stage.classList.remove('cut-in'); void this.stage.offsetWidth; this.stage.classList.add('cut-in');
    }
    this.shake = Math.max(0, this.shake - dt * 5); const s = this.shake * this.shake * 10;
    this.stage.style.transform = s > 0.2 ? `translate(${((Math.random() - 0.5) * s).toFixed(1)}px,${((Math.random() - 0.5) * s).toFixed(1)}px)` : '';
  }
}

/* Chrome Dream: liquid chrome type floating over drifting colour blobs and a glowing perspective grid.
   Each sung word squashes and stretches into place and throws sparkles. */
export class Y2K extends Viz {
  cls = 'k-y2k';
  init() {
    canvasFor(this); this.box = $('div', 'chrome'); this.el.append(this.box); this.spans = []; this.sp = []; this.last = -1; this.t0 = performance.now();
    this.blobs = Array.from({ length: 7 }, (_, i) => ({ x: rnd(i, 1), y: rnd(i, 2) * 0.7, r: 0.22 + rnd(i, 3) * 0.2, ph: rnd(i, 4) * 6.28, sp: 0.06 + rnd(i, 5) * 0.1, c: ['255,95,210', '106,92,255', '53,224,255', '255,179,107', '190,120,255'][i % 5] }));
    this.stars = Array.from({ length: 40 }, (_, i) => ({ x: rnd(i, 6), y: rnd(i, 7) * 0.62, s: 2 + rnd(i, 8) * 5, ph: rnd(i, 9) * 6.28 }));
  }
  resize() { this.fit(); }
  onLine(S) {
    if (!S.line || S.gap) return;
    this.box.innerHTML = S.tokens.map((w, i) => `<span class="cw" data-s="0" style="--r:${((rnd(S.idx, i, 4) - 0.5) * 6).toFixed(1)}deg">${esc(w.text)}</span>`).join(' ');
    this.spans = [...this.box.children]; this.box.style.setProperty('--fs', `min(${(17 / Math.sqrt(Math.max(1, S.tokens.length / 2.6))).toFixed(1)}cqw, ${(34 / Math.max(1, S.tokens.length / 2.4)).toFixed(1)}cqh)`);
  }
  star(g, x, y, r, rot) { g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); g.moveTo(0, -r); g.quadraticCurveTo(0, 0, r, 0); g.quadraticCurveTo(0, 0, 0, r); g.quadraticCurveTo(0, 0, -r, 0); g.quadraticCurveTo(0, 0, 0, -r); g.fill(); g.restore(); }
  tick(S, dt) {
    const g = this.g, W = this.w, H = this.h, t = (performance.now() - this.t0) / 1000, hz = H * 0.66;
    // sky
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#0d0626'); sky.addColorStop(0.6, '#2a0f55'); sky.addColorStop(1, '#12072e'); g.globalCompositeOperation = 'source-over'; g.fillStyle = sky; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    for (const b of this.blobs) { const x = (b.x + Math.sin(t * b.sp + b.ph) * 0.18) * W, y = (b.y + Math.cos(t * b.sp * 1.3 + b.ph) * 0.14) * H, r = b.r * Math.max(W, H) * 0.7, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${b.c},.5)`); gr.addColorStop(1, `rgba(${b.c},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    g.globalCompositeOperation = 'source-over';
    // sun with scanlines
    const sx = W / 2, sr = Math.min(W, H) * 0.2; g.save(); g.beginPath(); g.arc(sx, hz - sr * 0.15, sr, 0, 6.3); g.clip(); const sg = g.createLinearGradient(0, hz - sr * 1.15, 0, hz + sr * 0.85); sg.addColorStop(0, '#ffe9a8'); sg.addColorStop(0.5, '#ff7ac8'); sg.addColorStop(1, '#7a4dff'); g.fillStyle = sg; g.fillRect(0, 0, W, H);
    g.fillStyle = '#2a0f55'; for (let k = 0; k < 7; k++) { const yy = hz - sr * 0.15 + sr * (0.1 + k * 0.13), hh = sr * (0.015 + k * 0.012); g.fillRect(sx - sr, yy, sr * 2, hh); } g.restore();
    // stars
    g.fillStyle = '#fff'; for (const s of this.stars) { g.globalAlpha = 0.35 + 0.55 * Math.abs(Math.sin(t * 1.4 + s.ph)); this.star(g, s.x * W, s.y * H, s.s, t * 0.3 + s.ph); } g.globalAlpha = 1;
    // perspective grid
    const gg = g.createLinearGradient(0, hz, 0, H); gg.addColorStop(0, 'rgba(255,120,230,0)'); gg.addColorStop(1, 'rgba(255,120,230,.22)'); g.fillStyle = gg; g.fillRect(0, hz, W, H - hz);
    g.strokeStyle = 'rgba(255,140,240,.7)'; g.lineWidth = 1.2; g.shadowColor = '#ff6ad5'; g.shadowBlur = 8;
    for (let k = -16; k <= 16; k++) { g.beginPath(); g.moveTo(sx + k * W * 0.02, hz); g.lineTo(sx + k * W * 0.34, H); g.stroke(); }
    const off = (t * 0.4) % 1; for (let k = 0; k < 14; k++) { const u = (k + off) / 14, y = hz + (H - hz) * u * u; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.shadowBlur = 0;
    // words: sparkles on every new word
    if (S.idx >= 0 && S.tokens.length) {
      const cur = Math.floor(S.gap ? 99 : S.pos); this.spans.forEach((sp, i) => { const s = i < cur ? 2 : i === cur ? 1 : 0; if (sp._s !== s) { sp.dataset.s = s; if (s === 1) { sp.classList.remove('hit'); void sp.offsetWidth; sp.classList.add('hit'); const r = sp.getBoundingClientRect(), o = this.el.getBoundingClientRect(); for (let k = 0; k < 16; k++) this.sp.push({ x: r.left - o.left + r.width * Math.random(), y: r.top - o.top + r.height * Math.random(), vx: (Math.random() - 0.5) * 160, vy: -40 - Math.random() * 120, l: 0, s: 3 + Math.random() * 7, c: ['#fff', '#ffb3f0', '#9ff0ff'][k % 3] }); } sp._s = s; } });
    }
    this.sp = this.sp.filter(p => { p.l += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 140 * dt; const a = 1 - p.l / 1.1; if (a <= 0) return false; g.globalAlpha = a; g.fillStyle = p.c; this.star(g, p.x, p.y, p.s * a + 1, p.l * 4); return true; }); g.globalAlpha = 1;
  }
}

/* Cinema: a typographic film edit. Letterbox, grain, flicker, big serif words that resolve out of a blur,
   one key word in red italic, and a running timecode. */
export class Cinema extends Viz {
  cls = 'k-cin';
  init() {
    this.el.innerHTML = `<div class="film"><div class="poster"></div></div><i class="bar t"></i><i class="bar b"></i><canvas class="grain"></canvas><div class="vig"></div><div class="tc"><span></span><span></span></div>`;
    this.poster = this.el.querySelector('.poster'); this.grain = this.el.querySelector('.grain'); this.g = this.grain.getContext('2d'); this.grain.width = this.grain.height = 96; this.tcEls = this.el.querySelectorAll('.tc span');
    this.tcEls[1].textContent = this.ctx.song.title; this.spans = []; this.gt = 0;
  }
  onLine(S) {
    if (!S.line || S.gap) return;
    const toks = S.tokens, key = toks.reduce((b, w, i) => w.text.replace(/\W/g, '').length > toks[b].text.replace(/\W/g, '').length ? i : b, 0), rows = toks.length > 6 ? 3 : toks.length > 3 ? 2 : 1, per = Math.ceil(toks.length / rows), al = ['left', 'center', 'right'];
    let html = ''; for (let r = 0; r < rows; r++) { const part = toks.slice(r * per, (r + 1) * per), a = al[(S.idx + r * 2) % 3];
      html += `<div class="rw ${a}" style="--s:${(r === 0 ? 1 : 0.62 + rnd(S.idx, r, 1) * 0.3).toFixed(2)}">` + part.map((w, k) => { const i = r * per + k; return `<span class="cw${i === key ? ' key' : ''}" data-s="0">${esc(w.text)}</span>`; }).join(' ') + '</div>'; }
    this.poster.innerHTML = html; this.spans = [...this.poster.querySelectorAll('.cw')];
    this.poster.style.setProperty('--fs', `min(${(15 / Math.sqrt(Math.max(1, rows))).toFixed(1)}cqw, ${(24 / rows).toFixed(1)}cqh)`);
    this.poster.classList.remove('in'); void this.poster.offsetWidth; this.poster.classList.add('in');
  }
  tick(S, dt) {
    const cur = Math.floor(S.gap ? 99 : S.pos);
    this.spans.forEach((sp, i) => { const s = i < cur ? 2 : i === cur ? 1 : 0; if (sp._s !== s) { sp.dataset.s = s; sp._s = s; } });
    this.gt += dt; if (this.gt > 0.08) { this.gt = 0; const im = this.g.createImageData(96, 96), d = im.data; for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 40; } this.g.putImageData(im, 0, 0); }
    const t = S.t, f = Math.floor(t * 24) % 24; this.tcEls[0].textContent = `00:${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
    this.el.style.setProperty('--fl', (0.96 + Math.random() * 0.04).toFixed(3));
  }
}

/* Collage: a mixed-media board. Every word is cut from a different place and stamped on one by one. */
const KINDS = ['serif', 'heavy', 'type', 'outline', 'mark', 'label', 'circle', 'script'];
export class Collage extends Viz {
  cls = 'k-col';
  onLine(S) {
    this.el.innerHTML = '';
    if (!S.line || S.gap) { this.spans = []; return; }
    const toks = S.tokens, wrap = $('div', 'board');
    wrap.innerHTML = toks.map((w, i) => { const k = KINDS[Math.floor(rnd(S.idx, i, 5) * KINDS.length)]; return `<span class="cw ${k}" data-s="0" style="--r:${((rnd(S.idx, i, 6) - 0.5) * 8).toFixed(1)}deg;--z:${(0.8 + rnd(S.idx, i, 7) * 0.6).toFixed(2)};--c:${Math.floor(rnd(S.idx, i, 8) * 4)}">${esc(w.text)}</span>`; }).join(' ');
    wrap.style.setProperty('--fs', `min(${(17 / Math.sqrt(Math.max(1, toks.length / 3))).toFixed(1)}cqw, ${(36 / Math.max(1.2, toks.length / 3)).toFixed(1)}cqh)`);
    this.el.append(wrap); this.spans = [...wrap.children];
  }
  tick(S) {
    if (!this.spans.length) return;
    const cur = Math.floor(S.gap ? 99 : S.pos);
    for (let i = 0; i < this.spans.length; i++) {
      const s = i < cur ? 2 : i === cur ? 1 : 0, sp = this.spans[i];
      if (sp._s !== s) { sp.dataset.s = s; if (s === 1) { sp.classList.remove('hit'); void sp.offsetWidth; sp.classList.add('hit'); } sp._s = s; }
    }
  }
}
