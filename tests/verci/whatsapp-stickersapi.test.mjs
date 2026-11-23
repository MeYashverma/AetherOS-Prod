import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { parseLRC } from '../../src/vendor/verci/lrc.js';
import { frameState } from '../../src/vendor/verci/viz/core.js';
import { buildReactionPlan } from '../../src/vendor/verci/viz/reaction-intelligence.js';
import { STICKERS_API } from '../../src/vendor/verci/providers/stickersapi.js';
import { Messages } from '../../src/vendor/verci/viz/native.js';

// Exercise the actual WhatsApp-style lyric renderer, not the standalone picker
// or an already-created sticker tile. jsdom cannot load network images: onload
// and onerror below represent the two browser outcomes, not a live API check.
const dom = new JSDOM('<div id="stage" class="verci-stage"></div>', { url: 'https://aether.test' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.matchMedia = () => ({ matches: false });
globalThis.requestAnimationFrame = () => 1;
const flush = () => new Promise(resolve => setTimeout(resolve, 0));
const opts = { emojis: () => false, gifs: () => true, stickers: () => true,
  stickerSource: () => 'auto', density: () => 'balanced', listenerReplies: () => false,
  textReactions: () => false };
const mount = (lyrics, title, options = opts) => new Messages(document.getElementById('stage'), {
  lyrics, song: { title, artist: 'Singer' }, opts: options, duration: () => 60
}).mount();

// Previously this short song's only media slot was a GIF, so the actual lyric
// chat never even searched StickersAPI for a sticker.
const lyrics = parseLRC('[00:00]I love you\n[00:03]I love you\n[00:06]I love you');
const plan = buildReactionPlan(lyrics, 'Love Song', 'balanced');
assert.equal(plan[0]?.sticker?.mood, 'love', 'first eligible lyric prioritizes a sticker, not a GIF');
assert.equal(plan.filter(row => row?.sticker || row?.gif).length, 1, 'short songs do not spam media');
const urls = [];
globalThis.fetch = async (url, init) => {
  urls.push(url);
  assert.equal(init.credentials, 'omit');
  assert.equal(init.referrerPolicy, 'no-referrer');
  assert.ok(url.includes('/search?q=love'), 'only the local mood label goes to StickersAPI');
  return { ok: true, json: async () => ({ items: [{ slug: '71189-love', name: 'Love', type: 'png', image: 'https://evil.test/image.png' }] }) };
};
let viz = mount(lyrics, 'Love Song');
viz.frame(frameState(lyrics, 0.2), .016);
const bubble = viz.inner.querySelector('.b[data-message-index="0"]');
assert.ok(bubble, 'lyric was sent inside WhatsApp chat');
const sticker = bubble.querySelector('.chat-sticker');
assert.ok(sticker, 'automatic sticker is inside the lyric bubble, not a separate manual media message');
assert.equal(bubble.querySelector('.chat-local-media'), null);
assert.ok(sticker.nextElementSibling.matches('time'), 'timestamp follows lyric and sticker media');
assert.equal(bubble.querySelector('p').textContent.trim(), 'I love you', 'the timed lyric is unchanged');
await flush();
assert.deepEqual(urls, [`${STICKERS_API}/search?q=love&limit=24`]);
const image = sticker.querySelector('.chat-stickersapi-image');
assert.ok(image, 'the actual chat bubble requests a StickersAPI image');
assert.equal(image.src, `${STICKERS_API}/sticker/71189-love/preview`, 'untrusted URLs are not rendered');
assert.equal(image.referrerPolicy, 'no-referrer');
assert.equal(image.hidden, true, 'local sticker remains visible while loading');
image.onload(); await flush();
assert.equal(image.hidden, false);
assert.ok(sticker.classList.contains('has-stickersapi-image'));
assert.equal(sticker.querySelector('.chat-sticker-credit'), null, 'no provider credit is shown inside the lyric bubble');
assert.equal(bubble.querySelector('p').textContent.trim(), 'I love you');
assert.equal(viz.stickerJobs.size, 0, 'finished image jobs are cleaned up');
viz.frame(frameState(lyrics, -1), .016);
assert.equal(viz.inner.querySelector('.chat-sticker'), null, 'rewinding removes later lyric bubbles');
viz.frame(frameState(lyrics, 0.2), .016);
assert.ok(viz.inner.querySelector('.chat-sticker'), 'replay reconstructs the planned sticker');
await flush();
const replayImage = viz.inner.querySelector('.chat-stickersapi-image');
assert.ok(replayImage);
replayImage.onload(); await flush();
assert.equal(urls.length, 1, 'replay uses the cached mood search');
viz.destroy();

// A valid JSON search does not mean its preview can load. A broken image must
// retain the local sticker and try the established Discord fallback instead.
globalThis.fetch = async (url) => {
  if (url.startsWith(STICKERS_API)) return { ok: true, json: async () => ({ items: [{ slug: '82222-happy', name: 'Happy', type: 'png' }] }) };
  if (url.includes('discord.com/api/')) return { ok: true, json: async () => ({ sticker_packs: [{ name: 'Public', stickers: [{ id: '123456789012345678', name: 'Happy', tags: 'happy', format_type: 1, available: true }] }] }) };
  throw Error(`Unexpected URL: ${url}`);
};
const joy = parseLRC('[00:00]I am happy');
viz = mount(joy, 'Joyful Song'); viz.frame(frameState(joy, 0.2), .016); await flush();
let tile = viz.inner.querySelector('.chat-sticker');
let preview = tile.querySelector('.chat-stickersapi-image');
assert.ok(preview);
preview.onerror(); await flush();
assert.equal(tile.querySelector('.chat-sticker-credit'), null);
assert.ok(!tile.classList.contains('has-stickersapi-image'));
const discord = tile.querySelector('.chat-discord-image');
assert.ok(discord, 'Discord is still tried when the API preview fails');
discord.onload(); await flush();
assert.ok(tile.classList.contains('has-discord-sticker'));
assert.equal(viz.inner.querySelector('p').textContent.trim(), 'I am happy');
viz.destroy();

// Offline: no broken image replaces the lyric or the device-rendered sticker.
globalThis.fetch = async () => { throw Error('offline'); };
const sad = parseLRC('[00:00]I am sad');
viz = mount(sad, 'Sad Song'); viz.frame(frameState(sad, 0.2), .016); await flush();
tile = viz.inner.querySelector('.chat-sticker');
assert.ok(tile.querySelector('span') && tile.querySelector('strong'), 'built-in sticker remains available offline');
assert.equal(tile.querySelector('.chat-sticker-credit'), null);
assert.equal(viz.inner.querySelector('p').textContent.trim(), 'I am sad');
viz.destroy();

// The first-sticker guarantee must not steal the GIF-only user's first slot.
const gifRequests = [];
globalThis.fetch = async url => { gifRequests.push(url); return { ok: false }; };
viz = mount(lyrics, 'Love Song', { ...opts, stickers: () => false, stickerSource: () => 'local' });
viz.frame(frameState(lyrics, 0.2), .016);
assert.equal(viz.inner.querySelector('.chat-sticker'), null);
assert.ok(viz.inner.querySelector('.chat-gif'), 'GIF-only mode still has a media slot');
await flush();
assert.ok(gifRequests.some(url => url.includes('nekos.best/api/v2/hug')));
assert.ok(!gifRequests.some(url => url.includes('stickerapi.sbs')));
viz.destroy();

console.log('WhatsApp lyric bubble, API image, no visible credit, GIF-only preference, replay, broken preview and offline fallback verified with mocked images.');
