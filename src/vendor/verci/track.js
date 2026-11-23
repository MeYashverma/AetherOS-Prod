// The one track model every provider maps into, plus recording-version detection.
// Versions (live, remix, acoustic, ...) must agree between a wanted track and a candidate: a remix is never
// silently substituted for the original.
const MARKS = [['live', /\blive\b|\bunplugged\b/i], ['remix', /\bremix\b|\brework\b|\bflip\b|\bvip\b|\bbootleg\b/i], ['acoustic', /\bacoustic\b/i],
  ['instrumental', /\binstrumental\b/i], ['karaoke', /\bkaraoke\b/i], ['cover', /\bcover(ed)?\b|\btribute\b/i], ['sped up', /\bsped[ -]?up\b|\bspeed(ed)?[ -]?up\b|\bnightcore\b/i],
  ['slowed', /\bslowed\b|\breverb\b/i], ['8d', /\b8d\b/i], ['mashup', /\bmashup\b/i], ['extended', /\bextended\b/i], ['demo', /\bdemo\b/i], ['clean', /\bclean\b/i]];
export const versionsOf = s => MARKS.filter(([, re]) => re.test(String(s || ''))).map(([k]) => k);

export function makeTrack(o) {
  return {
    provider: o.provider, providerId: String(o.providerId), key: `${o.provider}:${o.providerId}`,
    title: o.title || '', artist: o.artist || '', album: o.album || '', artwork: o.artwork || '',
    durationMs: o.durationMs || 0, explicit: o.explicit ?? null,
    // playback: { capability: 'full' | 'needs-auth' | 'none', engine: 'audio' | 'youtube' | 'musickit', ... }
    playback: o.playback ? { kind: 'full', ...o.playback } : { capability: 'none' },
    availability: o.availability || 'unknown',
    versions: versionsOf(o.title), url: o.url || '', meta: o.meta || {},
    // legacy aliases the UI and lyrics matcher already use
    source: o.provider, raw: o.raw, channel: o.channel, videoId: o.videoId, streamUrl: o.streamUrl
  };
}
