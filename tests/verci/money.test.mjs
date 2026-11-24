import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<div id="stage"></div>');
globalThis.document = dom.window.document;
globalThis.window = dom.window;
const { Money } = await import('../../src/vendor/verci/viz/native.js');
const { parseLRC } = await import('../../src/vendor/verci/lrc.js');
const { frameState } = await import('../../src/vendor/verci/viz/core.js');

test('wallet is simulated, interactive, and playback driven across seeks and gaps', () => {
  const lyrics = parseLRC('[00:02]Hello world\n[00:06]Sing it again');
  const root = document.querySelector('#stage');
  const m = new Money(root, { lyrics, song: { title: '<Song>', artist: 'Artist' } }).mount();
  const q = s => m.ph.querySelector(s);
  const frame = t => m.frame(frameState(lyrics, t), .016);
  frame(0); assert.equal(m.total.textContent, '$0.00');
  assert.match(m.ph.textContent, /NOT A PAYMENT SERVICE/);
  assert.ok(m.ph.textContent.includes('<Song>'));
  q('.card-reveal').click(); assert.equal(q('.card-number').textContent, 'DEMO · 0000 0429');
  q('.card-reveal').click(); assert.equal(q('.card-number').textContent, '•••• 0429');
  q('.money-freeze').click(); assert.equal(q('.money-freeze').getAttribute('aria-pressed'), 'true');
  frame(7); assert.ok(m.sent >= 2); assert.equal(m.rows[0].line, lyrics.lines[1]);
  assert.ok(q('.money-card').classList.contains('frozen'));
  q('.money-details').click(); assert.match(q('.money-notice').textContent, /No bank/);
  q('.money-activity').click(); assert.match(q('.money-notice').textContent, /follows playback/);
  frame(3); assert.equal(m.rows.length, 1); assert.equal(m.rows[0].idx, 0);
  frame(0); assert.equal(m.total.textContent, '$0.00'); assert.equal(m.rows.length, 0);
  m.destroy(); assert.equal(root.children.length, 0);
});

test('TTML wallet retains row timelines for per-word highlighting', () => {
  const lyrics = parseLRC('[00:00]One two\n[00:05]Three four'); lyrics.format = 'TTML';
  const m = new Money(document.querySelector('#stage'), { lyrics, song: {} }).mount();
  m.frame(frameState(lyrics, 1), .016); m.frame(frameState(lyrics, 6), .016);
  assert.equal(m.rows.length, 2);
  assert.ok(m.rows.every(r => r.line.tokens.length === 2));
  m.destroy();
});
