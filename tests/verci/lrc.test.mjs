import assert from 'node:assert/strict';
import { parseLRC, parsePlain, activeIndex, wordPos, tokenize } from '../../src/vendor/verci/lrc.js';

let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok -', name); };

t('parses timestamps, sorts and handles multiple stamps per line', () => {
  const r = parseLRC('[00:12.50]second line\n[00:05.00]first line\n[00:20.00][00:40.00]chorus');
  assert.equal(r.lines.length, 4);
  assert.deepEqual(r.lines.map(l => l.text), ['first line', 'second line', 'chorus', 'chorus']);
  assert.equal(r.lines[0].t, 5); assert.equal(r.lines[1].t, 12.5);
  assert.equal(r.synced, true); assert.equal(r.wordLevel, false);
});
t('applies [offset:] in milliseconds', () => {
  const r = parseLRC('[offset: 500]\n[00:10.00]hello');
  assert.equal(r.lines[0].t, 10.5);
});
t('ignores metadata tags and blank input', () => {
  assert.equal(parseLRC('[ar:Someone]\n[ti:Title]').lines.length, 0);
  assert.equal(parseLRC('').lines.length, 0);
  assert.equal(parseLRC(null).lines.length, 0);
});
t('keeps empty timestamped lines as instrumental breaks', () => {
  const r = parseLRC('[00:01.00]a b\n[00:05.00]\n[00:09.00]c d');
  assert.equal(r.lines[1].text, ''); assert.equal(r.lines[1].tokens.length, 0);
});
t('enhanced word tags give genuine word timing', () => {
  const r = parseLRC('[00:10.00]<00:10.00>one <00:10.50>two <00:11.20>three\n[00:13.00]x');
  assert.equal(r.wordLevel, false);            // only half the lines carry word tags
  assert.equal(r.wordCoverage, 0.5);
  assert.equal(parseLRC('[00:01.00]<00:01.00>a <00:01.50>b').wordLevel, true);
  const tk = r.lines[0].tokens;
  assert.deepEqual(tk.map(w => w.text), ['one', 'two', 'three']);
  assert.deepEqual(tk.map(w => w.t0), [10, 10.5, 11.2]);
  assert.ok(tk.every(w => w.estimated === false));
  assert.equal(r.lines[0].text, 'one two three');
});
t('line-only lyrics yield estimated, monotonic, in-line word times', () => {
  const r = parseLRC('[00:10.00]we are the words today\n[00:16.00]next');
  const tk = r.lines[0].tokens;
  assert.equal(tk.length, 5); assert.ok(tk.every(w => w.estimated));
  for (let i = 0; i < tk.length; i++) {
    assert.ok(tk[i].t1 > tk[i].t0);
    if (i) assert.ok(Math.abs(tk[i].t0 - tk[i - 1].t1) < 1e-9);
  }
  assert.ok(tk[0].t0 === 10 && tk[4].t1 <= 16);
});
t('activeIndex finds the current line', () => {
  const r = parseLRC('[00:05.00]a\n[00:10.00]b\n[00:15.00]c');
  assert.equal(activeIndex(r.lines, 0), -1);
  assert.equal(activeIndex(r.lines, 5), 0);
  assert.equal(activeIndex(r.lines, 14.99), 1);
  assert.equal(activeIndex(r.lines, 999), 2);
});
t('wordPos is continuous across words', () => {
  const r = parseLRC('[00:00.00]aa bb\n[00:04.00]x');
  const tk = r.lines[0].tokens;
  assert.ok(wordPos(tk, -1) < 0);
  const mid = (tk[0].t0 + tk[0].t1) / 2;
  assert.ok(Math.abs(wordPos(tk, mid) - 0.5) < 1e-6);
  assert.ok(wordPos(tk, tk[1].t1 + 5) >= 1.99);
});
t('plain lyrics are flagged unsynced', () => {
  const r = parsePlain('\nline one\nline two\n\n');
  assert.equal(r.synced, false); assert.equal(r.lines.length, 2);
});
t('multi-singer tags are detected, stripped, and carried to following lines', () => {
  const r = parseLRC('[00:01.00]Ann: hello there\n[00:03.00]Bob: hi back\n[00:05.00]still bob\n[00:07.00]Ann: bye now\n[00:09.00]Bob: ok');
  assert.deepEqual(r.speakers, ['Ann', 'Bob']);
  assert.deepEqual(r.lines.map(l => l.text), ['hello there', 'hi back', 'still bob', 'bye now', 'ok']);
  assert.deepEqual(r.lines.map(l => l.speaker), [0, 1, 1, 0, 1]);
});
t('a stray colon in ordinary lyrics is not a singer', () => {
  const r = parseLRC('[00:01.00]Note: this is a line\n[00:03.00]plain line\n[00:05.00]another line\n[00:07.00]more lines');
  assert.deepEqual(r.speakers, []); assert.equal(r.lines[0].text, 'Note: this is a line');
});
t('bracket and <v:> forms work', () => {
  const r = parseLRC('[00:01.00]<v:A> one\n[00:02.00]<v:B> two\n[00:03.00]<v:A> three\n[00:04.00]<v:B> four');
  assert.deepEqual(r.speakers, ['A', 'B']);
});
console.log(`\n${n} tests passed`);
