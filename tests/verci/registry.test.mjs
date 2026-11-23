import assert from 'node:assert/strict';
import { makeTrack } from '../../src/vendor/verci/track.js';
import { groupTracks } from '../../src/vendor/verci/providers/registry.js';
let n = 0; const t = (m, f) => { f(); n++; console.log('ok -', m); };
const T = (provider, id, title, artist, durationMs, cap = 'none') => makeTrack({ provider, providerId: id, title, artist, durationMs, playback: cap === 'full' ? { capability: 'full', engine: 'audio', url: 'u' } : { capability: 'none' } });
t('same recording from two providers becomes one row, identity from the catalogue', () => {
  const g = groupTracks([T('itunes', 1, 'Blinding Lights', 'The Weeknd', 200000), T('audius', 2, 'Blinding Lights', 'The Weeknd', 201000, 'full')]);
  assert.equal(g.length, 1); assert.equal(g[0].identity.provider, 'itunes'); assert.equal(g[0].playables.length, 1);
});
t('different songs are never merged', () => {
  assert.equal(groupTracks([T('itunes', 1, 'Second Song', 'A', 100000), T('audius', 2, 'Indie Tone', 'B', 100000, 'full')]).length, 2);
});
t('a remix is a different recording from the original', () => {
  assert.equal(groupTracks([T('itunes', 1, 'Song', 'A', 200000), T('audius', 2, 'Song (Remix)', 'A', 200000, 'full')]).length, 2);
});
t('same title, different artist stays separate', () => {
  assert.equal(groupTracks([T('itunes', 1, 'Intro', 'A', 100000), T('itunes', 2, 'Intro', 'B', 100000)]).length, 2);
});
t('very different length is a different recording', () => {
  assert.equal(groupTracks([T('itunes', 1, 'Song', 'A', 200000), T('audius', 2, 'Song', 'A', 330000, 'full')]).length, 2);
});
console.log(n + ' tests passed');
