// YouTube: search through your Worker (key stays server-side) or a user-supplied key; playback ONLY through the
// official IFrame Player. It is an embed, not an audio file: it cannot feed the HTML audio engine.
import { CONFIG, userSetting } from '../config.js';
import { splitTitle, youtubeSearch } from '../services.js';
import { makeTrack } from '../track.js';
import { openYouTubeSearch } from './openyt.js';
const play = id => ({ capability: 'full', engine: 'youtube', videoId: id, label: 'Full song · YouTube', seekable: true, rate: true });
export const youtube = {
  id: 'youtube', name: 'YouTube', plays: true,
  lastVia: '',
  openOn: () => { try { return JSON.parse(localStorage.getItem('verci2') || '{}').openSearch !== false; } catch { return true; } },
  enabled() { return !!(CONFIG.workerUrl || userSetting('ytKey') || this.openOn()); },
  reason: () => 'Turn on community search in Settings, deploy the Worker, or add a YouTube API key.',
  async search(q) {
    let items;
    if (CONFIG.workerUrl) {
      const r = await fetch(`${CONFIG.workerUrl.replace(/\/$/, '')}/yt/search?q=${encodeURIComponent(q)}`);
      if (!r.ok) throw new Error('Worker answered ' + r.status);
      items = (await r.json()).items.map(v => splitTitle(v.title, v.channel, { raw: v.title, channel: v.channel, videoId: v.videoId, artwork: v.thumbnail, durationMs: v.durationMs, album: '' }));
    } else if (userSetting('ytKey')) items = await youtubeSearch(q, userSetting('ytKey'));
    else { const r = await openYouTubeSearch(q); this.lastVia = r.via + ' · ' + new URL(r.host).hostname; items = r.items.map(v => ({ ...v, raw: v.musicSong ? `${v.artist} - ${v.title}` : v.title, videoId: v.videoId, artwork: v.thumbnail })); }
    return items.map(v => makeTrack({ provider: 'youtube', providerId: v.videoId, title: v.title, artist: v.artist, artwork: v.artwork, durationMs: v.durationMs, availability: 'available', raw: v.raw, channel: v.channel, videoId: v.videoId, playback: play(v.videoId) }));
  },
  fromLink(info) { return makeTrack({ provider: 'youtube', providerId: info.videoId, title: info.title, artist: info.artist, artwork: info.artwork, raw: info.raw, channel: info.channel, videoId: info.videoId, availability: 'available', playback: play(info.videoId) }); }
};
