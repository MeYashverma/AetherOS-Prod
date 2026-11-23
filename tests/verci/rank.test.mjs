import assert from 'node:assert/strict';
import { rankFull } from '../../src/vendor/verci/rank.js';
let n = 0; const t = (m, f) => { f(); n++; console.log('ok -', m); };
const track = { title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', durationMs: 200000 };
const yt = [
  { id: 'a', title: 'The Weeknd - Blinding Lights (Official Audio)', channel: 'TheWeekndVEVO', artist: 'The Weeknd', durationMs: 201000 },
  { id: 'b', title: 'Blinding Lights (Sped Up)', channel: 'Speedy', artist: 'Speedy', durationMs: 150000 },
  { id: 'c', title: 'Blinding Lights - Live at Stadium', channel: 'The Weeknd', artist: 'The Weeknd', durationMs: 262000 },
  { id: 'd', title: 'Blinding Lights', channel: 'The Weeknd - Topic', artist: 'The Weeknd', durationMs: 200000 }];
t('picks the studio/Topic version over live, sped up and mismatched durations', () => {
  const r = rankFull(track, yt); assert.ok(['a', 'd'].includes(r.best.id)); assert.ok(r.confident);
  assert.ok(r.ranked.findIndex(x => x.id === 'b') > 1 && r.ranked.findIndex(x => x.id === 'c') > 1);
});
t('does not auto-pick when nothing matches', () => {
  const r = rankFull(track, [{ id: 'z', title: 'Something Else Entirely', channel: 'Random', artist: 'Random', durationMs: 200000 }]);
  assert.equal(r.confident, false);
});
t('same title by a different artist is not confident', () => {
  const r = rankFull(track, [{ id: 'q', title: 'Blinding Lights', channel: 'Cover Guy', artist: 'Cover Guy', durationMs: 200000 }]);
  assert.equal(r.confident, false);
});
t('wrong duration blocks auto-pick', () => {
  const r = rankFull(track, [{ id: 'l', title: 'Blinding Lights', channel: 'The Weeknd - Topic', artist: 'The Weeknd', durationMs: 330000 }]);
  assert.equal(r.confident, false);
});
t('a requested remix is allowed', () => {
  const r = rankFull({ ...track, title: 'Blinding Lights (Remix)' }, [{ id: 'r', title: 'Blinding Lights (Remix)', channel: 'The Weeknd - Topic', artist: 'The Weeknd', durationMs: 200000 }]);
  assert.ok(r.confident);
});
console.log(`${n} tests passed`);
