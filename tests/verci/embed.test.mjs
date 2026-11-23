import assert from 'node:assert/strict';
import { makeTrack } from '../../src/vendor/verci/track.js';
import { resolveFull } from '../../src/vendor/verci/providers/registry.js';
let n = 0; const t = async (m, f) => { await f(); n++; console.log('ok -', m); };
const want = { title: 'Blinding Lights', artist: 'The Weeknd', durationMs: 200000 };
const yt = (id, title, ch, dur = 200000) => makeTrack({ provider: 'youtube', providerId: id, title, artist: 'The Weeknd', raw: title, channel: ch, durationMs: dur, videoId: id, playback: { capability: 'full', engine: 'youtube', videoId: id, label: 'Full song · YouTube' } });
await t('a non-embeddable official upload loses to an embeddable one', async () => {
  const known = [yt('blocked0001', 'Blinding Lights', 'The Weeknd - Topic'), yt('okay0000001', 'The Weeknd - Blinding Lights (Official Audio)', 'TheWeekndVEVO')];
  const r = await resolveFull(want, known, { embeddable: async id => id !== 'blocked0001' });
  assert.equal(r.best.track.videoId, 'okay0000001'); assert.ok(r.confident); assert.equal(r.blocked, 1);
});
await t('unknown embeddability (null) does not penalise', async () => {
  const r = await resolveFull(want, [yt('unknown0001', 'Blinding Lights', 'The Weeknd - Topic')], { embeddable: async () => null });
  assert.ok(r.confident);
});
await t('when every match is blocked it is not confident and says so', async () => {
  const r = await resolveFull(want, [yt('blocked0001', 'Blinding Lights', 'The Weeknd - Topic')], { embeddable: async () => false });
  assert.equal(r.confident, false); assert.equal(r.blocked, 1);
});
console.log(n + ' tests passed');
