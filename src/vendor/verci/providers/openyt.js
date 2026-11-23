// Keyless YouTube SEARCH through community instances of Piped (and, as a fallback, Invidious).
// What we use: song metadata and videoIds only. What we never use: their audio/video stream URLs. Playback of the
// chosen videoId still happens only in YouTube's official IFrame player.
// Honest caveats: these are volunteer-run, unofficial services. YouTube blocks them often, and the public Invidious
// network has shrunk to a handful of hosts, so this tier is best-effort and rotates/cools down instances.
export const PIPED_FALLBACK = ['https://pipedapi.kavin.rocks', 'https://pipedapi.leptons.xyz', 'https://pipedapi.nosebs.ru', 'https://pipedapi-libre.kavin.rocks',
  'https://piped-api.privacy.com.de', 'https://pipedapi.adminforge.de', 'https://api.piped.yt', 'https://pipedapi.drgns.space', 'https://pipedapi.owo.si',
  'https://pipedapi.ducks.party', 'https://piped-api.codespace.cz', 'https://pipedapi.reallyaweso.me', 'https://api.piped.private.coffee', 'https://pipedapi.darkness.services', 'https://pipedapi.orangenet.cc'];

const idOf = u => (/[?&]v=([\w-]{11})/.exec(u || '') || [])[1] || null;
// Piped /search?filter=music_songs -> items { url:"/watch?v=ID", title, uploaderName, duration(sec), thumbnail }
export function normalizePiped(json, musicSongs) {
  return (json?.items || []).map(v => ({ videoId: idOf(v.url), title: v.title || '', artist: (v.uploaderName || '').replace(/\s-\s*Topic$/i, ''),
    channel: musicSongs ? `${(v.uploaderName || '').replace(/\s-\s*Topic$/i, '')} - Topic` : (v.uploaderName || ''), // music_songs entries are YouTube Music catalogue uploads
    durationMs: Math.max(0, v.duration || 0) * 1000, thumbnail: v.thumbnail || '', musicSong: !!musicSongs })).filter(v => v.videoId && v.title && v.durationMs > 0 !== false);
}
// Invidious /api/v1/search -> [{ videoId, title, author, lengthSeconds, videoThumbnails }]
export function normalizeInvidious(list) {
  return (Array.isArray(list) ? list : []).filter(v => v.videoId && v.title).map(v => ({ videoId: v.videoId, title: v.title, artist: (v.author || '').replace(/\s-\s*Topic$/i, ''), channel: v.author || '',
    durationMs: (v.lengthSeconds || 0) * 1000, thumbnail: v.videoThumbnails?.find(t => t.quality === 'high')?.url || v.videoThumbnails?.[0]?.url || '', musicSong: false }));
}

const COOL = 10 * 60e3;
function memStore() { const m = {}; return { get: k => m[k], set: (k, v) => { m[k] = v; } }; }
const lsStore = () => { try { return { get: k => JSON.parse(localStorage.getItem(k) || 'null'), set: (k, v) => localStorage.setItem(k, JSON.stringify(v)) }; } catch { return memStore(); } };

async function timed(fetchImpl, url, ms = 4500) {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), ms);
  try { const r = await fetchImpl(url, { signal: ac.signal }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); } finally { clearTimeout(t); }
}
// Try up to `width` healthy instances at once; the first valid answer wins; failures are put on a cool-down.
async function race(fetchImpl, store, hosts, make, width = 3) {
  const bad = store.get('verci.openyt.bad') || {}, now = Date.now(), ok = hosts.filter(h => !(bad[h] > now));
  const pool = (ok.length ? ok : hosts).slice().sort(() => Math.random() - 0.5), errs = [];
  for (let i = 0; i < pool.length && i < 9; i += width) {
    const batch = pool.slice(i, i + width);
    try {
      return await Promise.any(batch.map(async h => { try { const r = await make(h); return { host: h, items: r }; /* empty = valid "no results", not an instance failure */ } catch (e) { bad[h] = Date.now() + COOL; store.set('verci.openyt.bad', bad); throw e; } }));
    } catch (e) { errs.push(...(e.errors || [e]).map(x => x.message)); }
  }
  throw new Error('no community instance answered');
}

export async function openYouTubeSearch(q, { fetchImpl = (u, o) => fetch(u, o), store = lsStore(), hosts = PIPED_FALLBACK, invidious = true } = {}) {
  const enc = encodeURIComponent(q);
  try { // 1. Piped, YouTube-Music songs first (clean title/artist/duration), then plain videos
    const r = await race(fetchImpl, store, hosts, async h => { const songs = normalizePiped(await timed(fetchImpl, `${h}/search?q=${enc}&filter=music_songs`), true);
      if (songs.length >= 5) return songs;
      // Few catalogue songs: add plain videos (official audio / lyric uploads) so more candidates are embeddable
      const vids = normalizePiped(await timed(fetchImpl, `${h}/search?q=${enc}+audio&filter=videos`), false), ids = new Set(songs.map(x => x.videoId));
      return songs.concat(vids.filter(x => !ids.has(x.videoId)).slice(0, 8)); });
    return { ...r, via: 'piped' };
  } catch (e1) {
    if (!invidious) throw e1;
    // 2. Invidious (officially published instance list; only hosts that advertise api + cors)
    const list = await timed(fetchImpl, 'https://api.invidious.io/instances.json?sort_by=health');
    const inv = list.filter(([, i]) => i.api && i.cors && i.type === 'https').map(([, i]) => i.uri.replace(/\/$/, ''));
    if (!inv.length) throw e1;
    const r = await race(fetchImpl, store, inv, async h => normalizeInvidious(await timed(fetchImpl, `${h}/api/v1/search?q=${enc}&type=video&fields=videoId,title,author,lengthSeconds,videoThumbnails`)), 2);
    return { ...r, via: 'invidious' };
  }
}
