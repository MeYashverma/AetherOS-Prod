// LRC parsing and lyric timing helpers. Pure functions, no DOM, covered by tests/lrc.test.mjs.
// Nothing here invents timestamps: word times are only "genuine" when the file carries
// enhanced <mm:ss.xx> tags. Otherwise words are *estimated* inside the line and flagged as such.

const TS = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
const WTS = /<(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?>/g;

const sec = (m, s, f) => (+m) * 60 + (+s) + (f ? +f / Math.pow(10, f.length) : 0);

export function parseLRC(src) {
  const rows = [];
  let offset = 0;
  for (const raw of String(src || '').split(/\r?\n/)) {
    const off = raw.match(/^\[offset:\s*(-?\d+)\s*\]/i);
    if (off) { offset = +off[1] / 1000; continue; }
    const stamps = [...raw.matchAll(TS)];
    if (!stamps.length) continue;
    let body = raw.replace(TS, '').trim();
    let words = null;
    if (WTS.test(body)) {
      WTS.lastIndex = 0;
      words = [];
      const parts = body.split(/<\d{1,3}:\d{2}(?:[.:]\d{1,3})?>/);
      const tags = [...body.matchAll(WTS)].map(m => sec(m[1], m[2], m[3]));
      // parts[0] is text before first tag (usually empty), parts[i+1] follows tag i
      for (let i = 0; i < tags.length; i++) {
        const txt = (parts[i + 1] || '').trim();
        if (txt) words.push({ t: tags[i], text: txt });
      }
      body = body.replace(WTS, '').replace(/\s+/g, ' ').trim();
      if (!words.length) words = null;
    }
    WTS.lastIndex = 0;
    for (const st of stamps) rows.push({ t: sec(st[1], st[2], st[3]) + offset, text: body, words });
  }
  rows.sort((a, b) => a.t - b.t);
  const lines = rows.map(r => ({ ...r, t: Math.max(0, r.t) }));
  const speakers = detectSpeakers(lines);
  const out = finalize(lines, true); out.speakers = speakers; return out;
}

// Multi-singer metadata that some LRC files carry: "<v:Name> text", "[Name] text", "Name: text" or "(Name) text".
// Only accepted when at least two different names appear on a meaningful share of lines, so a lyric that
// merely contains a colon is never mistaken for a singer tag. Returns the singer names (or []).
const SPK = [/^<v\d*:\s*([^>]{1,24})>\s*/i, /^\[([^\]\d][^\]]{0,23})\]\s*/, /^\(([A-Z][^)]{0,23})\)\s+/, /^([A-Z][\w.'&\- ]{0,22}):\s+/];
// (Ah) and (Ooh) are sung ad-libs, not singer names, even if every LRC line
// begins with one. Leave them in the lyric for the chat's opposite-side bubble.
const ADLIB_TAG = /^(?:a+h+|o+h+|o+oh+|wo+o+|yeah+|hey+|huh+|uh+|hmm+|mm+|la+|na+|ha+|whoa+)[!?.]*$/i;
export function detectSpeakers(lines) {
  const hits = lines.map(l => { for (const re of SPK) { const m = l.text.match(re); if (m && (re !== SPK[2] || !ADLIB_TAG.test(m[1].trim()))) return { name: m[1].trim(), rest: l.text.slice(m[0].length) }; } return null; });
  const texted = lines.filter(l => l.text).length, tagged = hits.filter(Boolean);
  const names = [...new Set(tagged.map(h => h.name.toLowerCase()))];
  if (names.length < 2 || names.length > 6 || tagged.length < Math.max(3, texted * 0.3)) return [];
  const order = [], canon = {};
  tagged.forEach(h => { const k = h.name.toLowerCase(); if (!(k in canon)) { canon[k] = order.length; order.push(h.name); } });
  let last = -1;
  lines.forEach((l, i) => {
    const h = hits[i];
    if (h) { l.text = h.rest; if (l.words && l.words[0]) l.words[0].text = l.words[0].text.replace(h.rest ? /^.*?:\s*/ : /^$/, ''); last = canon[h.name.toLowerCase()]; }
    l.speaker = l.text ? last : -1;   // untagged lines continue the previous singer
  });
  return order;
}

export function parsePlain(src) {
  const lines = String(src || '').split(/\r?\n/).map(t => ({ t: null, text: t.trim(), words: null }));
  while (lines.length && !lines[0].text) lines.shift();
  while (lines.length && !lines[lines.length - 1].text) lines.pop();
  return { lines, synced: false, wordLevel: false, wordCoverage: 0, flat: [], speakers: [] };
}

function finalize(lines, synced) {
  // Share of lyric lines that carry genuine per-word timestamps. Word-level only if (almost) all do.
  const texted = lines.filter(l => l.text), withWords = texted.filter(l => l.words && l.words.length > 1);
  const wordCoverage = texted.length ? withWords.length / texted.length : 0;
  const out = { lines, synced, wordLevel: wordCoverage >= 0.8, wordCoverage, flat: [] };
  lines.forEach((l, i) => {
    const next = lines[i + 1];
    l.end = next ? next.t : l.t + 4;
    l.tokens = tokenize(l, next);
    l.tokens.forEach((w, wi) => out.flat.push({ ...w, li: i, wi }));
  });
  return out;
}

// Build word tokens for a line: genuine timestamps if present, else estimated.
export function tokenize(line, next) {
  const text = line.text;
  if (!text) return [];
  if (line.words && line.words.length > 1) {
    return line.words.map((w, i) => ({
      text: w.text, t0: w.t,
      t1: line.words[i + 1] ? line.words[i + 1].t : Math.min(line.end ?? w.t + 1, w.t + 1.2),
      estimated: false
    }));
  }
  const words = text.split(/\s+/).filter(Boolean);
  const gap = next ? next.t - line.t : 4;
  const chars = text.length;
  // Singing rarely fills a long gap: cap the span so words do not crawl through instrumental breaks.
  const span = Math.max(0.5, Math.min(gap * 0.94, chars * 0.075 + 0.8));
  const weights = words.map(w => w.length + 1.5);
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  return words.map((w, i) => {
    const t0 = line.t + (acc / total) * span;
    acc += weights[i];
    return { text: w, t0, t1: line.t + (acc / total) * span, estimated: true };
  });
}

// Index of the last line whose start time <= t (-1 before the first line).
export function activeIndex(lines, t) {
  let lo = 0, hi = lines.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].t <= t) { ans = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return ans;
}

// Continuous word position: integer part = index of the word being sung, fraction = progress through it.
export function wordPos(tokens, t) {
  if (!tokens.length || t < tokens[0].t0) return -0.0001;
  for (let i = 0; i < tokens.length; i++) {
    const w = tokens[i];
    if (t < w.t1 || i === tokens.length - 1) {
      const p = Math.min(1, Math.max(0, (t - w.t0) / Math.max(0.05, w.t1 - w.t0)));
      return i + p;
    }
  }
  return tokens.length;
}

export function fmtTime(s) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return m + ':' + String(r).padStart(2, '0');
}

// AetherOS: explicitly estimated timing for plain lyrics. Never label this as synced LRC.
export function estimatePlain(src, duration = 180) {
  const rows = parsePlain(src).lines;
  const total = rows.reduce((n, l) => n + Math.max(2, l.text.length), 0);
  const span = Number.isFinite(duration) && duration > 0 ? duration : 180;
  let elapsed = 0;
  const lines = rows.map(l => { const t = elapsed; elapsed += span * Math.max(2, l.text.length) / (total || 1); return { ...l, t }; });
  const out = finalize(lines, false);
  if (lines.length) {
    const last = lines.at(-1); last.end = span; last.tokens = tokenize(last, { t: span });
    out.flat = lines.flatMap((l, li) => l.tokens.map((w, wi) => ({ ...w, li, wi })));
  }
  out.estimated = true; out.speakers = []; return out;
}
