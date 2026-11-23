// Jamendo: free, Creative-Commons music with full streams. Needs a (free) client id in js/config.js.
import { CONFIG } from '../config.js';
import { makeTrack } from '../track.js';
export const jamendo = {
  id: 'jamendo', name: 'Jamendo', plays: true,
  enabled: () => !!CONFIG.jamendoClientId, reason: () => 'Add a Jamendo client id in js/config.js to enable.',
  async search(q) {
    const r = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${encodeURIComponent(CONFIG.jamendoClientId)}&format=json&limit=20&audioformat=mp32&imagesize=500&search=${encodeURIComponent(q)}`);
    if (!r.ok) throw new Error('Jamendo answered ' + r.status);
    return ((await r.json()).results || []).filter(t => t.audio).map(t => makeTrack({ provider: 'jamendo', providerId: t.id, title: t.name, artist: t.artist_name, album: t.album_name, artwork: t.image, durationMs: (t.duration || 0) * 1000, availability: 'available', url: t.shareurl,
      playback: { capability: 'full', engine: 'audio', url: t.audio, label: 'Full track · Jamendo', seekable: true, rate: true } }));
  }
};
