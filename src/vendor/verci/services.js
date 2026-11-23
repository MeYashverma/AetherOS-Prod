// Network services. Every call goes to a real public endpoint; nothing is mocked or invented.
// All of them are free, keyless and CORS-enabled for browsers, except YouTube search (optional user key).

const APP = 'verci-web';
const j = async (url, opts) => {
  const r = await fetch(url, { signal: AbortSignal.timeout(12000), ...opts });
  if (!r.ok) throw new Error(`${new URL(url).hostname} answered ${r.status}`);
  return r.json();
};
const cache = (k, ttl, fn) => async (...a) => {
  const key = k + ':' + JSON.stringify(a);
  try { const c = JSON.parse(sessionStorage.getItem(key) || 'null'); if (c && Date.now() - c.at < ttl) return c.v; } catch {}
  const v = await fn(...a);
  if (v != null && !(Array.isArray(v) && !v.length)) try { sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), v })); } catch {}
  return v;
};

/* ---------- iTunes Search: metadata, artwork, 30-second previews ---------- */
export const itunesSearch = cache('it', 6e5, async (q, limit = 30) => {
  const d = await j(`https://itunes.apple.com/search?media=music&entity=song&limit=${limit}&term=${encodeURIComponent(q)}`);
  return d.results.filter(r => r.kind === 'song' || r.wrapperType === 'track').map(r => ({
    id: 'itunes:' + r.trackId, source: 'itunes',
    title: r.trackName, artist: r.artistName, album: r.collectionName || '',
    artwork: (r.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
    durationMs: r.trackTimeMillis || 0, previewUrl: r.previewUrl || '', explicit: r.trackExplicitness === 'explicit'
  }));
});

/* ---------- Apple Music marketing RSS: "popular right now" ---------- */
export const trending = cache('tr', 36e5, async () => {
  const d = await j('https://rss.applemarketingtools.com/api/v2/us/music/most-played/24/songs.json');
  return d.feed.results.map(r => ({
    id: 'rss:' + r.id, source: 'rss', title: r.name, artist: r.artistName,
    artwork: (r.artworkUrl100 || '').replace('100x100bb', '600x600bb'), album: '', durationMs: 0
  }));
});

/* ---------- Audius: full-length streams, free, no key ---------- */
let audiusHost = null;
async function audius() {
  if (audiusHost) return audiusHost;
  const d = await j('https://api.audius.co');
  const hosts = d.data || [];
  if (!hosts.length) throw new Error('No Audius host available');
  return (audiusHost = hosts[Math.floor(Math.random() * hosts.length)]);
}
export const audiusSearch = cache('au', 6e5, async (q, limit = 25) => {
  const host = await audius();
  const d = await j(`${host}/v1/tracks/search?query=${encodeURIComponent(q)}&limit=${limit}&app_name=${APP}`);
  return (d.data || []).filter(t => t.is_streamable !== false && !t.is_delete).map(t => ({
    id: 'audius:' + t.id, source: 'audius', title: t.title, artist: t.user?.name || 'Unknown artist',
    album: '', artwork: t.artwork?.['480x480'] || t.artwork?.['150x150'] || '',
    durationMs: (t.duration || 0) * 1000, streamUrl: `${host}/v1/tracks/${t.id}/stream?app_name=${APP}`
  }));
});

/* ---------- YouTube: optional Data API search + oEmbed for pasted links ---------- */
export function youtubeId(s) {
  s = (s || '').trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1, 12);
    if (/youtube\.com$/.test(u.hostname)) return u.searchParams.get('v') || (u.pathname.match(/\/(?:embed|shorts)\/([\w-]{11})/) || [])[1] || null;
  } catch {}
  return null;
}
const isoSec = d => { const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(d || ''); return m ? ((+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0)) : 0; };
export async function youtubeSearch(q, key) {
  const d = await j(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&videoCategoryId=10&maxResults=15&q=${encodeURIComponent(q)}&key=${encodeURIComponent(key)}`);
  const dec = s => { const e = document.createElement('textarea'); e.innerHTML = s; return e.value; };
  let dur = {};
  try { const v = await j(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${d.items.map(i => i.id.videoId).join(',')}&key=${encodeURIComponent(key)}`); v.items.forEach(i => dur[i.id] = isoSec(i.contentDetails.duration) * 1000); } catch {}
  return d.items.map(v => splitTitle(dec(v.snippet.title), dec(v.snippet.channelTitle), {
    raw: dec(v.snippet.title), channel: dec(v.snippet.channelTitle), id: 'yt:' + v.id.videoId, source: 'youtube', videoId: v.id.videoId, album: '',
    artwork: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.default?.url || '', durationMs: dur[v.id.videoId] || 0
  }));
}
export async function youtubeInfo(videoId) {
  const d = await j(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent('https://www.youtube.com/watch?v=' + videoId)}`);
  return splitTitle(d.title, d.author_name, { raw: d.title, id: 'yt:' + videoId, source: 'youtube', videoId, album: '', artwork: d.thumbnail_url, durationMs: 0 });
}
// "Artist - Title (Official Audio)" → {artist,title}. Falls back to channel name (minus " - Topic").
export function splitTitle(raw, channel, base) {
  const clean = s => s.replace(/\s*[\(\[][^)\]]*(official|video|audio|lyrics?|visuali[sz]er|hd|4k|remaster)[^)\]]*[\)\]]/gi, '').trim();
  const m = raw.match(/^(.+?)\s+[-–—]\s+(.+)$/);
  if (m) return { ...base, artist: clean(m[1]), title: clean(m[2]) };
  return { ...base, artist: channel.replace(/\s*-\s*Topic$/i, '').replace(/VEVO$/i, ''), title: clean(raw) };
}

/* ---------- LRCLIB: lyrics (synced LRC when available) ---------- */
import { cleanText, titleCandidates, pickBest } from './match.js';
const LR = 'https://lrclib.net/api';
export const lrclibFind = cache('lr2', 36e5, async t => {
  const titles = titleCandidates(t), pool = new Map(), artist = cleanText(t.artist);
  const add = l => (Array.isArray(l) ? l : [l]).forEach(x => x && x.id != null && pool.set(x.id, x));
  // 1. Exact signature (needs a trustworthy artist and duration; skipped for uploaders).
  if (t.durationSec && t.source !== 'youtube' && artist) {
    try { add(await j(`${LR}/get?${new URLSearchParams({ track_name: titles[0], artist_name: artist, ...(t.album ? { album_name: cleanText(t.album) } : {}), duration: Math.round(t.durationSec) })}`)); } catch {}
  }
  const hit = () => pickBest([...pool.values()], t);
  if (hit()?.syncedLyrics && pool.size) return hit();
  // 2. Title-only searches first (artist is only a ranking bonus), then title + artist.
  const qs = [];
  if (artist && t.source !== 'youtube' && titles[0].split(/\s+/).length <= 2) qs.push(new URLSearchParams({ q: `${artist} ${titles[0]}` }));
  for (const ti of titles) qs.push(new URLSearchParams({ track_name: ti }));
  if (artist && t.source !== 'youtube') qs.push(new URLSearchParams({ q: `${artist} ${titles[0]}` }));
  qs.push(new URLSearchParams({ q: titles[0] }));
  for (const q of qs) {
    try { add(await j(`${LR}/search?${q}`)); } catch {}
    const b = hit(); if (b?.syncedLyrics) return b;
  }
  return hit();
});
export async function lrclibSearch(q) { return j(`${LR}/search?q=${encodeURIComponent(q)}`); }
export { cleanText } from './match.js';

// Is this YouTube video allowed to be embedded? YouTube's official oEmbed endpoint answers 401 for videos whose owner
// disabled embedding. Returns true / false, or null when we cannot tell (network or CORS). Cached for a day.
export async function ytEmbeddable(videoId, fetchImpl = fetch) {
  const key = 'emb:' + videoId;
  try { const c = JSON.parse(localStorage.getItem(key) || 'null'); if (c && Date.now() - c.at < 864e5) return c.v; } catch {}
  let v = null;
  try {
    const ac = new AbortController(), t = setTimeout(() => ac.abort(), 3500);
    const r = await fetchImpl(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent('https://www.youtube.com/watch?v=' + videoId)}`, { signal: ac.signal }); clearTimeout(t);
    v = r.ok ? true : (r.status === 401 || r.status === 403 || r.status === 404) ? false : null;
  } catch { v = null; }
  if (v !== null) try { localStorage.setItem(key, JSON.stringify({ at: Date.now(), v })); } catch {}
  return v;
}
