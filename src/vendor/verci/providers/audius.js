import { audiusSearch } from '../services.js';
import { makeTrack } from '../track.js';
export const audius = {
  id: 'audius', name: 'Audius', plays: true,
  enabled: () => true, reason: () => '',
  async search(q) {
    return (await audiusSearch(q, 25)).filter(t => t.durationMs > 20000).map(t => makeTrack({ provider: 'audius', providerId: t.id.split(':')[1], title: t.title, artist: t.artist, artwork: t.artwork, durationMs: t.durationMs, availability: 'available', streamUrl: t.streamUrl,
      playback: { capability: 'full', engine: 'audio', url: t.streamUrl, label: 'Full track · Audius', seekable: true, rate: true } }));
  }
};
