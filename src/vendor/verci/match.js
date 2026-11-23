// Pure helpers for matching a track to LRCLIB entries. The uploader/channel name is never used as a
// search term: YouTube channel names ("XYZ - Topic", "ArtistVEVO", random uploaders) broke matching.

export function cleanText(s) {
  return String(s || '')
    .replace(/[\(\[【][^)\]】]*[\)\]】]/g, ' ')
    .replace(/\b(feat|ft|featuring)\b\.?.*$/i, ' ')
    .replace(/\s[-–—]\s*(topic|remaster(ed)?.*|live.*|single.*|radio.*|mono|stereo|official.*|\d{4}.*)$/i, ' ')
    .replace(/\b(official|lyrics?|lyric video|music video|audio|video|visuali[sz]er|hd|4k|mv)\b/gi, ' ')
    .replace(/vevo\b/gi, ' ').replace(/["“”‘’]/g, '').replace(/\s+/g, ' ').trim();
}
const norm = s => cleanText(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
const toks = s => new Set(norm(s).split(' ').filter(Boolean));
export function sim(a, b) {
  const A = toks(a), B = toks(b); if (!A.size || !B.size) return 0;
  let i = 0; for (const t of A) if (B.has(t)) i++;
  return i / (A.size + B.size - i);
}

// Possible song titles for a track: the stored title plus both halves of "Artist - Title" raw video titles.
export function titleCandidates(t) {
  const out = [], add = s => { s = cleanText(s); if (s && !out.some(x => x.toLowerCase() === s.toLowerCase())) out.push(s); };
  add(t.title);
  if (t.raw) { const m = t.raw.match(/^(.+?)\s+[-–—|]\s+(.+)$/); if (m) { add(m[2]); add(m[1]); } add(t.raw); }
  return out.slice(0, 4);
}

// Choose the best LRCLIB entry. Artist agreement is a bonus only (never a requirement), because the
// artist we hold may really be an uploader. Titles must resemble one of the candidates.
export function pickBest(list, t) {
  const titles = titleCandidates(t), dur = t.durationSec || 0, hay = [t.artist, t.raw].filter(Boolean).join(' ');
  let best = null, bs = -1;
  for (const x of list) {
    if (!x || !(x.syncedLyrics || x.plainLyrics || x.instrumental)) continue;
    const ts = Math.max(...titles.map(c => sim(c, x.trackName)));
    if (ts < 0.5) continue;
    const as = Math.max(sim(hay, x.artistName), norm(hay).includes(norm(x.artistName)) && norm(x.artistName) ? 1 : 0);
    const dd = dur && x.duration ? Math.abs(dur - x.duration) : null;
    const score = ts * 3 + as * 1.2 + (x.syncedLyrics ? 0.8 : 0) + (dd == null ? 0 : dd <= 2 ? 1.2 : dd <= 6 ? 0.5 : dd > 20 ? -1.5 : -0.3);
    if (score > bs) { bs = score; best = x; }
  }
  return best;
}

// Does a result from a free-text search actually look like what was typed? Playable-only catalogues (Jamendo, Audius)
// return fuzzy hits; those are dropped unless most query words appear in the title or artist.
export function relevant(query, t) {
  const q = toks(query); if (!q.size) return true;
  const hay = toks(`${t.title} ${t.artist}`); let hit = 0; for (const w of q) if (hay.has(w)) hit++;
  return hit / q.size >= 0.6 || sim(query, t.title) >= 0.5;
}
