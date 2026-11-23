import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { parseLRC } from '../../src/vendor/verci/lrc.js';
import { frameState } from '../../src/vendor/verci/viz/core.js';
import { splitChatAsides } from '../../src/vendor/verci/viz/chat-asides.js';
import { Messages } from '../../src/vendor/verci/viz/native.js';
import { parseTTML } from '../../src/vendor/verci/ttml.js';

const L = parseLRC('[00:00]Hello world\n[00:04](Ah) Your skin, oh, yeah, your skin and bones\n[00:08](Ooh) Turn into something beautiful\n[00:12](Ah) And you know, you know I love you so\n[00:16](Oh)');
assert.deepEqual(L.speakers, [], 'repeated (Ah) / (Ooh) remain lyrics rather than false LRC singer tags');
assert.equal(L.lines[1].text, '(Ah) Your skin, oh, yeah, your skin and bones');
assert.equal(splitChatAsides(L.lines[0]), null, 'ordinary lyrics are unchanged');
const segments = splitChatAsides(L.lines[1]);
assert.deepEqual(segments.map(({ aside, text }) => [aside, text]), [
  [true, 'Ah'], [false, 'Your skin, oh, yeah, your skin and bones']
]);
assert.equal(segments[0].tokens[0].t0, L.lines[1].tokens[0].t0, 'whole parenthetical word keeps its lyric timing');
assert.equal(segments[0].tokens[0].t1, L.lines[1].tokens[0].t1);
assert.equal(L.lines[1].tokens[0].text, '(Ah)', 'splitting never mutates the shared lyric tokens');
assert.deepEqual(splitChatAsides(L.lines[4]).map(p => [p.aside, p.text]), [[true, 'Oh']], 'a parenthetical-only line still speaks');
assert.equal(splitChatAsides(parseLRC('[00:00](Chorus) Sing along').lines[0]), null, 'stage directions are not attributed to another user');
assert.equal(splitChatAsides(parseLRC('[00:00](Alice) Sing along').lines[0], ['Alice']), null, 'known singer tags are not vocal asides');
assert.equal(splitChatAsides(parseLRC('[00:00]((Ah)) Sing along').lines[0]), null, 'nested parentheses do not produce orphan punctuation');
assert.deepEqual(splitChatAsides(parseLRC('[00:00]Hey (oh, oh) I see you (yeah)').lines[0]).map(p => [p.aside, p.text]), [
  [false, 'Hey'], [true, 'oh, oh'], [false, 'I see you'], [true, 'yeah']
], 'multiple and inline asides preserve their order');
assert.deepEqual(splitChatAsides(parseLRC('[00:00](Ah), Your skin').lines[0]).map(p => [p.aside, p.text]), [
  [true, 'Ah,'], [false, 'Your skin']
], 'punctuation after an ad-lib cannot start the main message');
assert.equal(splitChatAsides(parseLRC('[00:00](x2) Repeat').lines[0]), null, 'repeat notation is not spoken');
const joined = { text:'(Ah)Your', t:1, tokens:[{ text:'(Ah)Your', t0:1, t1:2, estimated:false }] };
const within = splitChatAsides(joined);
assert.deepEqual(within.map(p => p.text), ['Ah','Your']);
assert.ok(within[0].tokens[0].t0 >= 1 && within[1].tokens[0].t1 <= 2, 'a shared TTML span is split within its original interval');
assert.ok(within.every(p => p.tokens[0].estimated), 'partial-token timing is labelled estimated');
assert.equal(joined.tokens[0].text, '(Ah)Your');
const tagged = parseLRC('[00:00](Alice) Hello\n[00:02](Bob) There\n[00:04](Alice) Again');
assert.deepEqual(tagged.speakers, ['Alice','Bob'], 'genuine singer labels remain supported');

const dom = new JSDOM('<div id="stage"></div>');
globalThis.document = dom.window.document;
globalThis.DOMParser = dom.window.DOMParser;
globalThis.requestAnimationFrame = fn => { fn(); return 1; };
L.speakers = ['Coldplay', 'Another singer'];
L.lines.forEach((line, i) => line.speaker = i % 2);
const root = document.getElementById('stage');
const ctx = { song:{ title:'Yellow',artist:'Coldplay',artwork:'' }, lyrics:L, duration:()=>180,
  opts:{ listenerReplies:()=>false, gifs:()=>false, stickers:()=>false, emojis:()=>false, textReactions:()=>false } };
const viz = new Messages(root, ctx).mount();
viz.onLine({ ...frameState(L, 4.4), jump:true });
let bubbles = [...root.querySelectorAll('.inner > .b')];
assert.equal(bubbles.length, 2);
assert.deepEqual(bubbles.map(b => [b.classList.contains('out'), b.querySelector('p').textContent]), [
  [false, 'Ah'], [true, 'Your skin, oh, yeah, your skin and bones']
], 'ad-lib is an incoming bubble, main lyric is still outgoing without parentheses');
assert.equal(bubbles[0].querySelector('.chat-reaction-pill'), null, 'the split aside is not an invented reaction');
assert.equal(bubbles[1].querySelectorAll('.w').length, L.lines[1].tokens.length - 1);
assert.equal(bubbles[0].querySelector('time').textContent, bubbles[1].querySelector('time').textContent, 'both parts retain the source lyric timestamp');
viz.tick(frameState(L, 4.6));
assert.equal(viz.rows[0].parts[0].spans[0].dataset.s, '2', 'aside highlights at its own original word time');
assert.notEqual(viz.rows[0].parts[1].spans[0].dataset.s, '2', 'main lyric does not prematurely highlight');
viz.onLine({ ...frameState(L, 8.2), jump:false });
bubbles = [...root.querySelectorAll('.inner > .b')];
assert.deepEqual(bubbles.slice(-2).map(b => [b.classList.contains('out'), b.querySelector('p').textContent]), [
  [true, 'Ooh'], [false, 'Turn into something beautiful']
], 'incoming main lyric gives its aside to the outgoing participant');
viz.onLine({ ...frameState(L, 4.2), jump:true });
assert.equal(root.querySelectorAll('.inner > .b').length, 2, 'seeking backward does not duplicate either part');
viz.onLine({ ...frameState(L, 0.2), jump:true });
viz.tick(frameState(L, 3.5));
assert.ok(viz.kbw.classList.contains('open'), 'outgoing lyric still types on the keyboard');
assert.ok(!viz.inp.textContent.includes('Ah'), 'keyboard types the main lyric, not the other participant’s ad-lib');
viz.onLine({ ...frameState(L, 16.1), jump:true });
assert.deepEqual([...root.querySelectorAll('.inner > .b')].map(b => b.querySelector('p').textContent), ['Oh'], 'aside-only lyric has no empty original bubble');
assert.equal(root.querySelector('.chat-aside').tabIndex, 0, 'aside-only lyric remains interactive');
assert.match(root.querySelector('.chat-aside').getAttribute('aria-label'), /^Oh, lyric/, 'assistive tech hears the extracted lyric');
assert.equal(L.lines[2].text, '(Ooh) Turn into something beautiful', 'rendering does not rewrite the canonical lyrics');
viz.destroy();

const xml = `<tt xmlns="http://www.w3.org/ns/ttml" xmlns:ttm="http://www.w3.org/ns/ttml#metadata"><head><metadata><ttm:agent xml:id="v1"><ttm:name>Coldplay</ttm:name></ttm:agent></metadata></head><body><div>
<p begin="1s" end="3s" ttm:agent="v1"><span begin="1s" end="1.4s">(Ah) </span><span begin="1.4s" end="2s">Your </span><span begin="2s" end="3s">skin</span></p>
</div></body></tt>`;
const T = parseTTML(xml);
const tv = new Messages(root, { ...ctx, lyrics:T }).mount();
tv.frame(frameState(T, 1.5), 0.016);
assert.deepEqual([...root.querySelectorAll('.inner > .b')].map(b => b.querySelector('p').textContent), ['Ah','Your skin']);
assert.equal(tv.rows[0].parts[0].spans[0].dataset.s, '2', 'TTML aside uses its own genuine timing');
assert.equal(tv.rows[0].parts[1].spans[0].dataset.s, '1', 'TTML main lyric lights independently');
tv.frame(frameState(T, 2.5), 0.016);
assert.equal(tv.rows[0].parts[1].spans[1].dataset.s, '1');
tv.onLine({ ...frameState(T, 1.5), jump:true });
assert.equal(root.querySelectorAll('.inner > .b').length, 2, 'TTML seek rebuilds the two-sided lyric exactly once');
tv.destroy();
const outside = parseTTML(xml.replace('<span begin="1s" end="1.4s">(Ah) </span>', '(<span begin="1s" end="1.4s">Ah</span>) '));
assert.equal(outside.lines[0].tokens[0].text, 'Ah', 'TTML may place parentheses outside timed spans');
assert.deepEqual(splitChatAsides(outside.lines[0]).map(p => p.text), ['Ah','Your skin']);
const ov = new Messages(root, { ...ctx, lyrics:outside }).mount();
ov.frame(frameState(outside, 1.5), 0.016);
assert.deepEqual([...root.querySelectorAll('.inner > .b')].map(b => b.querySelector('p').textContent), ['Ah','Your skin']);
assert.equal(outside.lines[0].tokens[0].text, 'Ah', 'restoring untimed brackets cannot mutate canonical TTML tokens');
ov.destroy();
const artistTag = parseLRC('[00:00](Coldplay) Sing along');
const artistViz = new Messages(root, { ...ctx, lyrics:artistTag }).mount();
artistViz.onLine({ ...frameState(artistTag, .1), jump:true });
assert.deepEqual([...root.querySelectorAll('.inner > .b')].map(b => b.querySelector('p').textContent), ['(Coldplay) Sing along'], 'the artist’s own label is not assigned to the other participant');
artistViz.destroy();
console.log('Parenthetical vocal asides, opposite-side messages, timing and seek verified.');
