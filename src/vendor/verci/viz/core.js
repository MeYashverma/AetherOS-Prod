// Shared helpers for the 13 lyric styles. Each style is a class extending Viz; the app calls
// frame(S, dt) every animation frame with the real playback-synced lyric state S.
import { activeIndex, wordPos } from '../lrc.js';

export const $ = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = t => 1 - Math.pow(1 - clamp(t), 3);
export function rnd(a, b = 0, c = 0) {
  let n = (Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(c | 0, 83492791)) >>> 0;
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b) >>> 0; n = Math.imul(n ^ (n >>> 16), 0x45d9f3b) >>> 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

// Build the per-frame lyric state from parsed lyrics and the (offset-corrected) playback time.
export function frameState(L, t) {
  if (!L._prev) {
    L._prev = []; L._f0 = []; let last = -1, c = 0;
    L.lines.forEach((l, i) => { if (l.text) last = i; L._prev[i] = last; L._f0[i] = c; c += l.tokens.length; });
  }
  const idx = activeIndex(L.lines, t);
  if (idx < 0) return { t, idx: -1, line: null, gap: true, pos: -1, p: 0, fpos: 0, tokens: [] };
  const gap = !L.lines[idx].text || t > L.lines[idx].end + 0.2 && idx === L.lines.length - 1;
  const ci = L._prev[idx] >= 0 ? L._prev[idx] : idx;
  const line = L.lines[ci];
  const pos = L.lines[idx].text && !gap ? wordPos(line.tokens, t) : line.tokens.length;
  const p = gap ? 1 : clamp((t - line.t) / Math.max(0.1, line.end - line.t));
  return { t, idx: ci, line, gap, pos, p, fpos: L._f0[ci] + Math.max(0, pos), tokens: line.tokens };
}

export class Viz {
  // Subclass class-fields (cls, pcls, icons) are only assigned after the base constructor returns,
  // so DOM creation is deferred to mount(), which the app calls right after `new`.
  constructor(root, ctx) { this.ctx = ctx; this.root = root; this.key = -9; this.w = 0; this.h = 0; }
  mount() { this.el = $('div', 'viz ' + (this.cls || '')); this.root.append(this.el); this.init(); return this; }
  frame(S, dt) {
    const r = this.el.getBoundingClientRect();
    if (r.width !== this.w || r.height !== this.h) { this.w = r.width; this.h = r.height; this.resize?.(); }
    S.jump = S.idx !== this.key && S.idx !== this.key + 1;
    S.changed = S.idx !== this.key || S.gap !== this.gap;
    if (S.changed) { this.onLine(S); this.key = S.idx; this.gap = S.gap; }
    this.tick(S, dt);
  }
  init() {} onLine() {} tick() {}
  destroy() { this.el.remove(); }
}

export const wordsHTML = tokens => tokens.map(w => `<span class="w" data-s="0">${esc(w.text)}</span>`).join(' ');
// Mark words as unsung(0) / being sung(1) / sung(2); expose progress of the current word as --p.
export function light(spans, pos) {
  const cur = Math.floor(pos);
  for (let i = 0; i < spans.length; i++) {
    const s = i < cur ? 2 : i === cur ? 1 : 0, sp = spans[i];
    if (sp._s !== s) { sp.dataset.s = s; if (s === 1) { sp.classList.remove('hit'); void sp.offsetWidth; sp.classList.add('hit'); } sp._s = s; }
    if (s === 1) sp.style.setProperty('--p', (pos - cur).toFixed(3));
  }
}

// Small stroke icon set. Words that map to an icon get one in the "Visual" styles; others get none.
const P = {
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1',
  fire: 'M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z',
  drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  cloud: 'M7 18a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 9a4.5 4.5 0 0 1 0 9z',
  bolt: 'M13 2L5 14h6l-1 8 8-12h-6z',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  music: 'M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z',
  home: 'M4 11l8-7 8 7v9H4zM10 20v-6h4v6',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  key: 'M8 11a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM11 12l9-9M16 7l3 3',
  lock: 'M5 11h14v10H5zM8 11V8a4 4 0 0 1 8 0v3',
  car: 'M3 16v-4l2-5h14l2 5v4zM6 16v3M18 16v3M3 12h18',
  plane: 'M2 13l20-8-8 16-3-7z',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  flower: 'M12 10c-2-4-1-6 0-7 1 1 2 3 0 7M12 14c2 4 1 6 0 7-1-1-2-3 0-7M10 12c-4 2-6 1-7 0 1-1 3-2 7 0M14 12c4-2 6-1 7 0-1 1-3 2-7 0',
  bird: 'M2 10c4-1 7 1 10 5 3-4 6-6 10-5-1 5-5 9-10 10C7 19 3 15 2 10z',
  crown: 'M3 8l4 4 5-7 5 7 4-4-2 11H5z',
  dollar: 'M12 3v18M16 7.5c-1-1.5-8-2-8 1.5s8 2 8 5.5-7 3-8 1',
  phone: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 11c.6.5 1 1.2 1 2h5c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z',
  snow: 'M12 2v20M4 7l16 10M20 7L4 17',
  wave: 'M2 12c3-3 5 3 8 0s5 3 8 0 3-2 4-1M2 18c3-3 5 3 8 0s5 3 8 0',
  tree: 'M12 21v-6M12 15c-4 0-6-3-4-6-2-3 1-6 4-6s6 3 4 6c2 3 0 6-4 6z',
  smile: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 14c1 2 7 2 8 0M9 9.5v.5M15 9.5v.5',
  mic: 'M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4',
  kiss: 'M3 12c3-4 6-3 9-1 3-2 6-3 9 1-3 5-6 6-9 6s-6-1-9-6z',
  diamond: 'M6 4h12l4 6-10 11L2 10z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0z',
  ask: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8M12 17v.01'
};
const WORDS = {
  heart: 'love loves loved loving heart hearts lover babe baby', star: 'star stars', moon: 'moon moonlight night nights midnight', sun: 'sun sunshine sunrise sunset sunny day days morning',
  fire: 'fire burn burning burned flame flames hot', drop: 'rain tears tear cry crying water drown drowning', cloud: 'cloud clouds sky heaven dream dreams', bolt: 'lightning thunder electric storm',
  eye: 'eye eyes see seen look looking watch watching', music: 'song songs sing singing music melody dance dancing', home: 'home house', clock: 'time clock hours minutes late tonight',
  key: 'key keys', lock: 'lock locked', car: 'car cars drive driving road', plane: 'fly flying plane', globe: 'world earth', flower: 'flower flowers rose roses', bird: 'bird birds wings wing',
  crown: 'king queen crown', dollar: 'money cash dollar dollars rich paid', phone: 'phone call calling', bulb: 'light lights idea', snow: 'cold snow winter ice freeze', wave: 'sea ocean waves',
  tree: 'tree trees', user: 'you your youre yours yourself me my myself', ask: 'ask asked asking question why what wonder', smile: 'smile smiling happy', mic: 'voice mic', kiss: 'kiss kisses lips', diamond: 'diamond diamonds gold earring earrings jewel jewels ring rings'
};
const MAP = {}; for (const k in WORDS) for (const w of WORDS[k].split(' ')) MAP[w] = k;
export function iconFor(word) {
  const k = MAP[word.toLowerCase().replace(/[^a-z']/g, '')];
  return k ? `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[k]}"/></svg>` : '';
}

export const canvasFor = (viz, hi = true) => {
  const c = $('canvas', 'cv'); viz.el.append(c);
  viz.cv = c; viz.g = c.getContext('2d');
  viz.fit = () => {
    const d = hi ? Math.min(2, devicePixelRatio || 1) : 1;
    c.width = Math.max(1, viz.w * d); c.height = Math.max(1, viz.h * d); viz.dpr = d;
    viz.g.setTransform(d, 0, 0, d, 0, 0);
  };
};

// Decorative sparkle glyphs for words with no meaningful icon (about half of them), like Verci's Visual styles.
const GLYPH = ['M12 2c.6 5 2.6 7.4 8 10-5.4 2.6-7.4 5-8 10-.6-5-2.6-7.4-8-10 5.4-2.6 7.4-5 8-10z', 'M12 3l7 9-7 9-7-9z', 'M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9'];
export function glyphFor(word, idx) {
  const ic = iconFor(word); if (ic) return ic;
  if (word.replace(/[^\w]/g, '').length < 3 || rnd(idx, 5) > 0.45) return '';
  const k = Math.floor(rnd(idx, 6) * 3);
  return `<svg class="ic${k < 2 ? ' fill' : ''}" viewBox="0 0 24 24" aria-hidden="true"><path d="${GLYPH[k]}"/></svg>`;
}
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const backOut = t => { t = clamp(t); const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
