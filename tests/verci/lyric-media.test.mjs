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
  assert.ok(url.startsWith(STICKERS_API));
  assert.equal(options.credentials, 'omit');
  assert.equal(options.referrerPolicy, 'no-referrer');
  assert.ok(!url.includes('Secret') && !url.includes('Private') && !url.includes('I%20am'));
  const mood = new URL(url).searchParams.get('q');
  const items = url.includes('/emotes?')
    ? [{ source: '7tv', id: mood === 'happy' ? '01GAZ199Z8000FEWHS6AT5QZV0' : '01GAZ4SBX80007YCE2RXBT44B2', name: `peepo${mood === 'happy' ? 'Happy' : 'Sad'}`, type: 'webp', animated: false }]
    : [{ slug: `500-${mood}`, name: mood, type: 'png' }];
  return { ok: true, json: async () => ({ items }) };
};

const media = new LyricMedia(stage, { song, lyrics, style: 'ship', opts });
assert.ok(media.enabled);
assert.ok(media.cues.length >= 3, 'sparse cues are selected on device');
assert.equal(media.cues[0].index, 0);
assert.deepEqual(media.cues[0].targets.map(t => t.kind), ['sticker', 'emote'], 'both are planned at the first cue');
media.update({ idx: -1, gap: true }); // warm before the first lyric is displayed
await flush();
assert.equal(media.overlay.hidden, true);
assert.ok(media.jobs.size > 0 && media.jobs.size <= 2, 'preloads are bounded even with a long song');
assert.ok(requests.some(url => url.includes('/search?q=happy')));
assert.ok(requests.some(url => url.includes('/emotes?source=all&limit=24&q=happy')));
assert.ok([...media.jobs.values()].every(job => job.image?.src.startsWith(STICKERS_API) && !job.image.isConnected));
assert.ok([...media.jobs.values()].every(job => job.image.referrerPolicy === 'no-referrer'));
assert.equal(document.querySelector('#original').textContent, 'The lyric remains here');
// Completing the first two off-DOM loads advances the sliding window.
for (const job of [...media.jobs.values()]) job.image.onload();
await flush();
assert.ok(media.images.size <= 4);
assert.ok(media.jobs.size <= 2);
assert.ok(requests.length <= 4, 'only the current and nearby cues are fetched, never the whole song');

media.update({ idx: 0, gap: false });
await flush();
let sticker = stage.querySelector('.lyric-api-sticker'), emote = stage.querySelector('.lyric-api-emote');
assert.equal(media.overlay.hidden, false);
assert.ok(sticker.querySelector('.lyric-api-fallback'), 'offline/loading glyph remains visible');
assert.equal(sticker.querySelector('strong'), null, 'no sticker caption is added');
assert.equal(emote.hidden, true, 'emote does not occupy space until its image is loaded');
const stickerImage = sticker.querySelector('img'), emoteImage = emote.querySelector('img');
assert.equal(stickerImage.src, `${STICKERS_API}/sticker/500-happy/preview`);
assert.equal(emoteImage.src, `${STICKERS_API}/emote/7tv/01GAZ199Z8000FEWHS6AT5QZV0/preview`);
stickerImage.onload(); emoteImage.onload(); await flush();
assert.equal(sticker.querySelector('.lyric-api-fallback').hidden, true);
assert.equal(emote.hidden, false, 'an emote appears alongside the sticker');
assert.equal(stage.querySelector('#original').textContent, 'The lyric remains here');
media.update({ idx: 1, gap: false });
assert.equal(media.overlay.hidden, true, 'media only accompanies its lyric cue');
media.update({ idx: media.cues[1].index, gap: false });
await flush();
assert.equal(media.overlay.hidden, false, 'a later seek displays its own mood');
const obsolete = [...media.jobs.values()];
assert.ok(obsolete.length, 'another near-future preview is still warming');
media.update({ idx: media.cues.at(-1).index, gap: false });
assert.ok(obsolete.every(job => job.controller.signal.aborted), 'seeking drops obsolete preloads');
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
  assert.equal(view.cues[0].targets.length, 2);
  view.destroy();
}

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { connection: { saveData: true } } });
const limited = new LyricMedia(stage, { song, lyrics, style: 'ship', opts });
limited.update({ idx: 0, gap: false });
assert.equal(limited.enabled, false, 'Save-Data skips remote preloading and automatic previews');
limited.destroy();
if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
else delete globalThis.navigator;
assert.equal(requests.length, before);
console.log('All lyric styles, explicit switch, nearby image warming, emotes beside stickers, cue/seek cleanup and privacy verified.');
