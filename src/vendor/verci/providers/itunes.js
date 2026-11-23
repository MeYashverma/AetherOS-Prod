// iTunes Search API: identity and metadata only. It exposes 30-second previews, which this app never plays.
import { itunesSearch } from '../services.js';
import { makeTrack } from '../track.js';
export const itunes = {
  id: 'itunes', name: 'iTunes catalogue', plays: false,
  enabled: () => true, reason: () => '',
  async search(q) {
    return (await itunesSearch(q, 30)).map(t => makeTrack({ provider: 'itunes', providerId: t.id.split(':')[1], title: t.title, artist: t.artist, album: t.album, artwork: t.artwork, durationMs: t.durationMs, explicit: t.explicit, availability: 'unknown', playback: { capability: 'none' } }));
  }
};
