import assert from 'node:assert/strict';
import { cleanText, titleCandidates, pickBest, sim } from '../../src/vendor/verci/match.js';
let n = 0; const t = (m, f) => { f(); n++; console.log('ok -', m); };
t('cleanText strips noise but keeps the song name', () => {
  assert.equal(cleanText('Sugar & Brownies (Official Lyric Video) [HD]'), 'Sugar & Brownies');
  assert.equal(cleanText('Rude - Topic'), 'Rude');
  assert.equal(cleanText('Song Name feat. Someone Else'), 'Song Name');
  assert.equal(cleanText('Artist - Song - 2011 Remaster'), 'Artist - Song');
});
t('uploader/channel is not part of the title candidates', () => {
  const c = titleCandidates({ title: 'Sugar & Brownies', artist: 'Random Uploader 123', raw: 'DHARIA - Sugar & Brownies (Official Video)' });
  assert.ok(c.includes('Sugar & Brownies')); assert.ok(!c.join('|').includes('Uploader'));
});
t('pickBest survives a wrong artist (uploader) and uses duration + synced', () => {
  const list = [
    { id: 1, trackName: 'Sugar & Brownies', artistName: 'DHARIA', duration: 150, syncedLyrics: '[00:01.00]x', plainLyrics: 'x' },
    { id: 2, trackName: 'Sugar and Brownies (Sped Up)', artistName: 'Other', duration: 120, syncedLyrics: null, plainLyrics: 'y' },
    { id: 3, trackName: 'Totally Different', artistName: 'Random Uploader 123', duration: 150, syncedLyrics: '[00:01.00]z' }];
  const b = pickBest(list, { title: 'Sugar & Brownies', artist: 'Random Uploader 123', raw: 'DHARIA - Sugar & Brownies', durationSec: 150 });
  assert.equal(b.id, 1);
});
t('pickBest rejects unrelated titles instead of guessing', () => {
  assert.equal(pickBest([{ id: 9, trackName: 'Nothing Alike', artistName: 'X', syncedLyrics: '[00:01.00]a' }], { title: 'Sugar & Brownies', artist: 'Y' }), null);
});
t('sim is symmetric and bounded', () => { assert.equal(sim('a b', 'b a'), 1); assert.equal(sim('a', 'z'), 0); });
console.log(`${n} tests passed`);
import { relevant } from '../../src/vendor/verci/match.js';
t('relevance filter drops fuzzy hits and keeps real ones', () => {
  assert.ok(relevant('blinding lights weeknd', { title: 'Blinding Lights', artist: 'The Weeknd' }));
  assert.ok(!relevant('blinding lights weeknd', { title: 'Sunrise Meditation', artist: 'Calm Cloud' }));
  assert.ok(relevant('blinding lights', { title: 'Blinding Lights (Remix)', artist: 'Someone' }));
});
console.log('relevance tests ok');
