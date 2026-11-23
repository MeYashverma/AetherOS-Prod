// Ranking of "full version" candidates (Audius / YouTube) for a track we know from iTunes, so the app can
// pick the right one automatically. Pure functions (tested in tests/rank.test.mjs).
import { cleanText, sim } from './match.js';
import { versionsOf } from './track.js';

const BAD = ['live', 'cover', 'remix', 'sped up', 'speed up', 'slowed', 'reverb', 'karaoke', 'instrumental', 'nightcore', '8d', 'mashup', 'acoustic', 'tutorial', 'reaction', 'piano version', 'lofi', 'lo-fi', 'bass boosted', 'extended', 'loop'];
const has = (s, w) => new RegExp('(^|[^a-z])' + w.replace(' ', '[ -]?') + '([^a-z]|$)', 'i').test(s);

export function scoreCandidate(t, c) {
  const want = (t.title + ' ' + (t.album || '')).toLowerCase(), ct = String(c.title || '').toLowerCase();
  const ts = Math.max(sim(t.title, c.title), sim(`${t.artist} ${t.title}`, c.title), sim(t.title, cleanText(c.title.split(/\s[-–—|]\s/).pop())));
  const hay = `${c.artist || ''} ${c.channel || ''} ${c.title}`;
  const as = Math.max(sim(t.artist, c.artist || ''), hay.toLowerCase().includes(cleanText(t.artist).toLowerCase()) && t.artist ? 1 : 0);
  let sc = ts * 3 + as * 1.5;
  if (t.durationMs && c.durationMs) { const d = Math.abs(t.durationMs - c.durationMs) / 1000; sc += d <= 2 ? 1.4 : d <= 5 ? 0.7 : d <= 12 ? -0.4 : -2; }
  // Recording versions must agree in BOTH directions (as in BitChord's matcher): a remix is not the original,
  // and the original is not the remix someone asked for.
  const wv = new Set(versionsOf(t.title)), cv = new Set(versionsOf(c.title));
  for (const v of cv) if (!wv.has(v)) sc -= 1.8;
  for (const v of wv) if (!cv.has(v)) sc -= 2.2;
  for (const w of BAD) if (has(ct, w) && !has(want, w) && !cv.has(w)) sc -= 1.2;
  if (/ - topic$/i.test(c.channel || '')) sc += 0.9;
  if (/vevo$/i.test(c.channel || '') || (as >= 0.5 && /official/i.test(c.title))) sc += 0.4;
  if (/official (audio|music video|video)/i.test(c.title)) sc += 0.2;
  return { score: sc, ts, as };
}

export function isConfident(t, top) {
  const durOk = !t.durationMs || !top?.durationMs || Math.abs(t.durationMs - top.durationMs) <= 6000;
  return !!top && top.ts >= 0.7 && top.as >= 0.34 && durOk && top.score >= 4.1;
}
// Returns the ranked list; `confident` means safe to switch to automatically.
export function rankFull(t, cands) {
  const ranked = cands.map(c => ({ ...c, ...scoreCandidate(t, c) })).sort((a, b) => b.score - a.score);
  return { ranked, best: ranked[0] || null, confident: isConfident(t, ranked[0]) };
}
