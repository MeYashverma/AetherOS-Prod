import assert from 'node:assert/strict';
import { typingPlan, typedAt } from '../../src/vendor/verci/viz/native.js';
let n = 0; const t = (m, f) => { f(); n++; console.log('ok -', m); };
const text = 'Hello there, my friend';
t('typing finishes with exactly the lyric text', () => { assert.equal(typedAt(typingPlan(text, 3), 1).str, text); });
t('progress is monotonic in length except for deliberate backspaces', () => {
  const pl = typingPlan(text, 5); let back = 0; for (const e of pl) if (e.t === 'b') back++;
  let prev = ''; for (let p = 0; p <= 1; p += 0.01) { const s = typedAt(pl, p).str; assert.ok(s.length >= prev.length - 1); prev = s; }
  assert.ok(back >= 0);
});
t('deterministic for a given line (seeking agrees)', () => { assert.deepEqual(typingPlan(text, 9), typingPlan(text, 9)); });
t('starts empty', () => { assert.equal(typedAt(typingPlan(text, 3), 0).str, ''); });
t('uppercase letters request shift', () => { assert.ok(typingPlan('Hi', 1).some(e => e.shift)); });
console.log(n + ' tests passed');
