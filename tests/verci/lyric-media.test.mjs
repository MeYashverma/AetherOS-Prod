import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { parseLRC } from '../../src/vendor/verci/lrc.js';
import { STYLES } from '../../src/vendor/verci/viz/index.js';
import { LyricMedia } from '../../src/vendor/verci/viz/lyric-media.js';
import { STICKERS_API } from '../../src/vendor/verci/providers/stickersapi.js';

const dom = new JSDOM('<div id="stage" class="verci-stage"><p id="original">The lyric remains here</p></div>', { url: 'https://aether.test' });
globalThis.document = dom.window.document;
globalThis.matchMedia = () => ({ matches: false });
const stage = document.getElementById('stage');
const flush = () => new Promise(resolve => setTimeout(resolve, 0));
const lyrics = parseLRC(Array.from({ length: 70 }, (_, i) => {
  const seconds = i * 5;
  return `[${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}]I am ${i % 2 ? 'sad' : 'happy'}`;
}).join('\n'));
const opts = { lyricMediaEnabled: () => true, density: () => 'expressive',
  stickers: () => true, gifs: () => true, stickerSource: () => 'auto' };
const song = { title: 'Secret Song Title', artist: 'Private Singer' };
const requests = [];
globalThis.fetch = async (url, options) => {
  requests.push(url);
  assert.ok(url.startsWith(`${STICKERS_API}/search?q=`), 'only sticker catalogues are searched automatically');
  assert.equal(options.credentials, 'omit');
  assert.equal(options.referrerPolicy, 'no-referrer');
  assert.ok(!url.includes('Secret') && !url.includes('Private') && !url.includes('I%20am'));
  const mood = new URL(url).searchParams.get('q');
  return { ok: true, json: async () => ({ items: [{ slug: `500-${mood}`, name: mood, type: 'png' }] }) };
};

const media = new LyricMedia(stage, { song, lyrics, style: 'ship', opts });
assert.ok(media.enabled);
assert.ok(media.cues.length >= 3, 'sparse cues are selected on device');
assert.equal(media.cues[0].index, 0);
assert.deepEqual(media.cues[0].targets.map(t => t.kind), ['sticker'], 'only a sticker is planned at each cue');
media.update({ idx: -1, gap: true }); // warm before the first lyric is displayed
await flush();
assert.equal(media.overlay.hidden, true);
assert.ok(media.jobs.size > 0 && media.jobs.size <= 2, 'preloads are bounded even with a long song');
assert.ok(requests.some(url => url.includes('/search?q=happy')));
assert.ok(requests.every(url => url.includes('/search?q=')), 'preloading never requests emotes');
assert.ok([...media.jobs.values()].every(job => job.image?.src.startsWith(STICKERS_API) && !job.image.isConnected));
assert.ok([...media.jobs.values()].every(job => job.image.referrerPolicy === 'no-referrer'));
const obsolete = [...media.jobs.values()];
media.update({ idx: media.cues.at(-1).index, gap: false });
assert.ok(obsolete.every(job => job.controller.signal.aborted), 'seeking drops obsolete preloads');
await flush();
media.update({ idx: -1, gap: true });
await flush();
assert.equal(document.querySelector('#original').textContent, 'The lyric remains here');
// Completing the first two off-DOM loads advances the sliding window.
for (const job of [...media.jobs.values()]) job.image.onload();
await flush();
assert.ok(media.images.size <= 4);
assert.ok(media.jobs.size <= 2);
assert.ok(requests.length <= 3, 'only the current and next two sticker cues are fetched, never the whole song');

media.update({ idx: 0, gap: false });
await flush();
const sticker = stage.querySelector('.lyric-api-sticker');
assert.equal(media.overlay.hidden, false);
assert.equal(media.overlay.childElementCount, 1, 'only a sticker slot is shown');
assert.equal(stage.querySelector('.lyric-api-emote'), null, 'no automatic emote badge exists');
assert.ok(sticker.querySelector('.lyric-api-fallback'), 'offline/loading glyph remains visible');
assert.equal(sticker.querySelector('strong'), null, 'no sticker caption is added');
const stickerImage = sticker.querySelector('img');
assert.equal(stickerImage.src, `${STICKERS_API}/sticker/500-happy/preview`);
stickerImage.onload(); await flush();
assert.equal(sticker.querySelector('.lyric-api-fallback').hidden, true);
assert.ok(requests.every(url => url.includes('/search?q=')), 'displaying a warmed cue also avoids emote requests');
assert.equal(stage.querySelector('#original').textContent, 'The lyric remains here');
media.update({ idx: 1, gap: false });
assert.equal(media.overlay.hidden, true, 'media only accompanies its lyric cue');
media.update({ idx: media.cues[1].index, gap: false });
await flush();
assert.equal(media.overlay.hidden, false, 'a later seek displays its own mood');
media.update({ idx: media.cues.at(-1).index, gap: false });
await flush();
const failedPreview = media.overlay.querySelector('.lyric-api-sticker img');
assert.ok(failedPreview);
failedPreview.onerror(); await flush();
assert.equal(media.overlay.querySelector('.lyric-api-fallback').hidden, false, 'a broken preview retains the local glyph');
const unfinished = [...media.jobs.values()].map(job => job.image).filter(Boolean);
media.destroy();
assert.equal(stage.querySelector('.lyric-api-reactions'), null, 'stage teardown removes its badge');
assert.ok(unfinished.every(image => !image.hasAttribute('src')), 'stage teardown aborts pending image preloads');
assert.equal(media.jobs.size, 0);

const before = requests.length;
const off = new LyricMedia(stage, { song, lyrics, style: 'ship', opts: { ...opts, lyricMediaEnabled: () => false } });
off.update({ idx: 0, gap: false });
assert.equal(off.enabled, false);
assert.equal(stage.querySelector('.lyric-api-reactions'), null);
assert.equal(requests.length, before, 'the off switch never searches automatically');
off.destroy();

// The same overlay belongs to the lyrics stage in every visual style, including
// Classic Scroll. Chat does not get an overlay on top of its phone.
for (const style of ['scroll', ...STYLES.map(item => item.id)]) {
  const view = new LyricMedia(stage, { song, lyrics, style, opts });
  assert.equal(!!view.overlay, style !== 'native-messages', `${style} has the correct lyric-only presentation`);
  assert.deepEqual(view.cues[0].targets.map(t => t.kind), ['sticker'], `${style} never preloads an emote`);
  view.destroy();
}
const gifOnly = new LyricMedia(stage, { song, lyrics, style: 'native-messages', opts: { ...opts, stickers: () => false } });
assert.ok(gifOnly.plan.some(row => row?.gif), 'chat still plans GIF-only reactions');
assert.equal(gifOnly.cues.length, 0, 'GIF-only chat never warms an emote or sticker');
gifOnly.update({ idx: 0, gap: false });
assert.equal(gifOnly.jobs.size, 0);
gifOnly.destroy();

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { connection: { saveData: true } } });
const limited = new LyricMedia(stage, { song, lyrics, style: 'ship', opts });
limited.update({ idx: 0, gap: false });
assert.equal(limited.enabled, false, 'Save-Data skips remote preloading and automatic previews');
limited.destroy();
if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
else delete globalThis.navigator;
assert.equal(requests.length, before);
console.log('All lyric styles, sticker-only cues, bounded preview warming, seek cleanup, switch and privacy verified.');
