// Apple Music via MusicKit JS. Catalogue search works with just a developer token; full-length playback needs the
// listener to sign in with an Apple Music subscription. The developer token is signed by your Worker (/apple/token);
// the private key never reaches the browser.
import { CONFIG } from '../config.js';
import { makeTrack } from '../track.js';
let inst = null, loading = null;
async function getToken() {
  const r = await fetch(`${CONFIG.workerUrl.replace(/\/$/, '')}/apple/token`);
  if (!r.ok) throw new Error('Worker could not sign an Apple Music token (' + r.status + ')');
  return (await r.json()).token;
}
export function ensureMusicKit() {
  if (inst) return Promise.resolve(inst);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const ready = async () => {
      try { await MusicKit.configure({ developerToken: await getToken(), app: { name: 'Verci 2', build: '1' } }); inst = MusicKit.getInstance(); resolve(inst); } catch (e) { loading = null; reject(e); }
    };
    if (window.MusicKit) return ready();
    document.addEventListener('musickitloaded', ready, { once: true });
    const s = document.createElement('script'); s.src = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js'; s.async = true;
    s.onerror = () => { loading = null; reject(new Error('MusicKit JS could not be loaded.')); }; document.head.appendChild(s);
  });
  return loading;
}
const art = (a, n = 600) => (a?.url || '').replace('{w}', n).replace('{h}', n);
export const musickit = {
  id: 'musickit', name: 'Apple Music', plays: true,
  enabled: () => !!CONFIG.workerUrl, reason: () => 'Deploy the Worker with your Apple Music key (worker/README.md).',
  get authorized() { return !!inst?.isAuthorized; },
  async connect() { const m = await ensureMusicKit(); await m.authorize(); return m.isAuthorized; },
  async disconnect() { if (inst) await inst.unauthorize(); },
  async search(q) {
    const m = await ensureMusicKit();
    const res = await m.api.music(`/v1/catalog/${CONFIG.appleStorefront}/search`, { term: q, types: 'songs', limit: 15 });
    const songs = res?.data?.results?.songs?.data || [];
    return songs.map(s => makeTrack({ provider: 'musickit', providerId: s.id, title: s.attributes.name, artist: s.attributes.artistName, album: s.attributes.albumName, artwork: art(s.attributes.artwork), durationMs: s.attributes.durationInMillis, explicit: s.attributes.contentRating === 'explicit', url: s.attributes.url,
      availability: inst.isAuthorized ? 'available' : 'unknown',
      playback: { capability: inst.isAuthorized ? 'full' : 'needs-auth', engine: 'musickit', songId: s.id, label: 'Full song · Apple Music', seekable: true, rate: false } }));
  }
};
