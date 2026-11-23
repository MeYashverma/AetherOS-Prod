// Automatic StickersAPI media for every lyric style. The WhatsApp view renders
// inside its own bubbles; other styles get a small, non-interactive stage badge.
// Only nearby, on-device mood cues are searched. Preview images are warmed in a
// sliding window, never downloaded for the whole song or stored in app settings.
import { automaticMediaAllowed } from '../providers/automatic-stickers.js?v=stickersapi-31';
import { mediaURL, moodMedia, renderMediaImage } from '../providers/stickersapi.js?v=stickersapi-31';
import { buildReactionPlan, reactionHash } from './reaction-intelligence.js';

const AHEAD = 3; // current cue and the next two, not every cue in the song
const IN_FLIGHT = 2; // catalogue + image work combined
const IMAGE_LIMIT = 4;

export class LyricMedia {
  constructor(root, { lyrics, song, style, opts = {} }) {
    this.root = root;
    this.jobs = new Map();
    this.images = new Map();
    this.warmed = new Map();
    this.failures = new Map();
    this.queue = [];
    this.index = -2;
    this.chat = style === 'native-messages';
    this.enabled = opts.lyricMediaEnabled?.() !== false && automaticMediaAllowed() && !!lyrics?.lines?.length;
    if (!this.enabled) return;

    const title = song?.title || '';
    this.reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.density = opts.density?.() || 'balanced';
    const stickers = !this.chat || opts.stickers?.() !== false;
    this.plan = buildReactionPlan(lyrics, title, this.density, {
      stickers, gifs: this.chat && opts.gifs?.() !== false && !this.reduced
    });
    const chatSource = opts.stickerSource?.() || 'auto';
    this.cues = this.plan.flatMap((reaction, index) => {
      if (!reaction?.sticker || (this.chat && !['auto', 'stickerapi'].includes(chatSource))) return [];
      return [{ index, emoji: reaction.sticker.emoji, targets: [{
        kind: 'sticker', mood: reaction.sticker.mood, seed: reactionHash(title) + index
      }] }];
    });
    this.cueByIndex = new Map(this.cues.map(cue => [cue.index, cue]));
    if (!this.chat) {
      this.overlay = document.createElement('div');
      this.overlay.className = 'lyric-api-reactions';
      this.overlay.setAttribute('aria-hidden', 'true');
      this.overlay.hidden = true;
      root.append(this.overlay);
    }
  }

  update(state) {
    if (!this.enabled || this.destroyed || this.index === state.idx && this.gap === state.gap) return;
    this.index = state.idx;
    this.gap = state.gap;
    if (this.overlay) this.show(state);
    this.warm(state.idx);
  }

  show(state) {
    this.display?.abort();
    this.overlay.replaceChildren();
    this.overlay.hidden = true;
    const cue = !state.gap && this.cueByIndex.get(state.idx);
    if (!cue) return;
    const controller = new AbortController();
    this.display = controller;
    this.overlay.hidden = false;
    const sticker = document.createElement('span');
    sticker.className = 'lyric-api-sticker';
    const fallback = document.createElement('span');
    fallback.className = 'lyric-api-fallback';
    fallback.textContent = cue.emoji || '✦';
    sticker.append(fallback);
    this.overlay.append(sticker);
    const target = cue.targets[0];
    moodMedia('sticker', target.mood, target.seed, this.reduced).then(async item => {
      if (!item || controller.signal.aborted || !sticker.isConnected) return;
      const loaded = await renderMediaImage(sticker, item, controller.signal, 'lyric-api-image');
      if (loaded && !controller.signal.aborted && sticker.isConnected) fallback.hidden = true;
    }).catch(() => {}); // The local glyph remains when the API/image fails.
  }

  warm(index) {
    const needed = this.cues.filter(cue => cue.index >= index).slice(0, AHEAD)
      .flatMap(cue => cue.targets.map(target => ({ ...target, key: `${target.kind}:${target.mood}:${target.seed}` })));
    const keys = new Set(needed.map(target => target.key));
    for (const [key, job] of this.jobs) if (!keys.has(key)) job.controller.abort();
    this.queue = needed.filter(target => !this.jobs.has(target.key) &&
      !(this.warmed.has(target.key) && this.images.has(this.warmed.get(target.key))) &&
      (this.failures.get(target.key) || 0) < Date.now());
    this.drain();
  }

  drain() {
    while (!this.destroyed && this.jobs.size < IN_FLIGHT && this.queue.length) {
      const target = this.queue.shift();
      if (this.jobs.has(target.key)) continue;
      const controller = new AbortController();
      const job = { controller, image: null };
      this.jobs.set(target.key, job);
      (async () => {
        const item = await moodMedia(target.kind, target.mood, target.seed, this.reduced);
        if (controller.signal.aborted || !item) return !!item;
        const url = mediaURL(item);
        if (!url || this.images.has(url)) {
          if (url) this.warmed.set(target.key, url);
          return !!url;
        }
        const ok = await this.preload(url, job);
        if (ok && !controller.signal.aborted) this.warmed.set(target.key, url);
        return ok;
      })().then(ok => {
        if (!controller.signal.aborted && !ok) this.failures.set(target.key, Date.now() + 60000);
      }).catch(() => {
        if (!controller.signal.aborted) this.failures.set(target.key, Date.now() + 60000);
      }).finally(() => {
        if (this.jobs.get(target.key) === job) this.jobs.delete(target.key);
        if (!this.destroyed) this.drain();
      });
    }
  }

  preload(url, job) {
    return new Promise(resolve => {
      const img = document.createElement('img');
      job.image = img; // Keep the off-DOM image alive until load or cancellation.
      img.referrerPolicy = 'no-referrer';
      img.decoding = 'async';
      let done = false;
      const finish = ok => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        job.controller.signal.removeEventListener('abort', abort);
        img.onload = img.onerror = null;
        if (ok && !this.destroyed && !job.controller.signal.aborted) {
          this.images.set(url, img);
          while (this.images.size > IMAGE_LIMIT) this.images.delete(this.images.keys().next().value);
        } else img.removeAttribute('src');
        resolve(ok);
      };
      const abort = () => finish(false);
      const timer = setTimeout(abort, 9000);
      job.controller.signal.addEventListener('abort', abort, { once: true });
      img.onload = () => finish(true);
      img.onerror = abort;
      img.src = url;
    });
  }

  destroy() {
    this.destroyed = true;
    this.display?.abort();
    for (const job of this.jobs.values()) job.controller.abort();
    this.jobs.clear();
    this.queue = [];
    this.images.clear();
    this.overlay?.remove();
  }
}
