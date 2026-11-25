import { createPredictor } from './chat-predictions.js';
import { localChatTime, messageTime } from './chat-clock.js';
import { splitChatAsides } from './chat-asides.js';
// "Native Design" family: the song as real-looking phone screens. These keep their own colours.
import { $, esc, clamp, lerp, rnd, Viz, wordsHTML, light } from './core.js';
import { wordPos } from '../lrc.js';
// A cached provider module would still inject the old sticker credit.
import { cleanupStickerJobs } from '../providers/automatic-stickers.js?v=stickersapi-31';
import { cleanMedia, mediaURL, renderMediaImage } from '../providers/stickersapi.js?v=stickersapi-31';
import { ChatInteractions } from './chat-interactions.js';
import { listenerReplyFor, listenerTiming } from './listener-replies.js';
import { resolveSingerNames } from '../singer-names.js';
import { addConversation } from './chat-conversation.js';
import { addChatReaction } from './chat-reactions.js?v=stickersapi-31';
import { Phone } from './phone.js';

/* iPhone 17 lock screen: Dynamic Island, big clock, glass notification stack, media player, flashlight and camera. */
export class Notifications extends Phone {
  pcls = 'nd-ios';
  build() {
    const s = this.ctx.song, L = this.ctx.lyrics;
    if (L.format === 'TTML' && !L.originalSpeakers) {
      L.originalSpeakers = [...(L.speakers || [])];
      const resolved = resolveSingerNames(L,s); L.speakers=resolved.names; L.inferredSpeakers=resolved.inferred;
    }
    this.predict=createPredictor(L.lines);
    const P = planTurns(L, s.artist); this.P = P;
    const title = P.group || P.two ? s.title : P.names[0], sub = (P.group || P.two ? P.names.join(', ') : 'online · visual turns');
    const art=s.artwork||'';
    const avatar=art?`<img alt="" src="${esc(art)}" onerror="this.style.display='none'">`:`<span class="chat-avatar-fallback" aria-hidden="true">${esc((title||"?").trim()[0]||"?")}</span>`;
    this.ph.innerHTML = `<div class="sb"><span class="chat-clock">${localChatTime()}</span><span class="ios-status" aria-hidden="true"><svg viewBox="0 0 48 16"><path d="M1 13V10h3v3zm5 0V7h3v6zm5 0V4h3v9zm5 0V1h3v12z" fill="currentColor"/><path d="M24 5q7-6 14 0m-11 3q4-4 8 0m-5 3h2" fill="none" stroke="currentColor" stroke-width="2"/></svg><i></i></span></div>
      <header><svg viewBox="0 0 24 24" class="bk"><path d="M15 5l-7 7 7 7"/></svg>${avatar}<div><b>${esc(title)}</b><small>${esc(sub)}</small></div>
      <svg viewBox="0 0 24 24"><rect x="3" y="7" width="12" height="10" rx="2.5"/><path d="M15 11l6-3v8l-6-3"/></svg><svg viewBox="0 0 24 24"><path d="M6 4l3 4-2 2c1 3 3 5 6 6l2-2 4 3-1 3c-9 1-16-6-14-14z"/></svg></header>
      <div class="thread"><div class="inner"><div class="chip">TODAY</div></div></div>
      <footer><svg viewBox="0 0 24 24" class="composer-plus"><path d="M12 3v18M3 12h18"/></svg><span class="inp"><em>Message</em></span><svg class="composer-camera" viewBox="0 0 24 24"><path d="M3 7h4l2-3h6l2 3h4v14H3z"/><circle cx="12" cy="13" r="4"/></svg><b class="snd" data-k="send"><svg viewBox="0 0 24 24"><path d="M4 12l16-8-6 16-3-7z"/></svg></b></footer>
      <div class="kbw"><div class="kb">${KB}</div></div>`;
    this.inner = this.ph.querySelector('.inner'); this.sub = this.ph.querySelector('header small'); this.rows = []; this.typing = null;
    this.kbw = this.ph.querySelector('.kbw'); this.inp = this.ph.querySelector('.inp'); this.plans = new Map(); this.down = [];
    this.keys = {}; this.ph.querySelectorAll('[data-k]').forEach(e => this.keys[e.dataset.k] = e);
    this.predictionText='';
  }
  card(line) {
    const c = $('div', 'n', `<i class="ico"><svg viewBox="0 0 24 24"><path d="M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/></svg></i>
      <div class="nb"><header><b>${esc(this.ctx.song.artist)}</b><em>now</em></header><strong>${esc(this.ctx.song.title)}</strong><p>${wordsHTML(line.tokens)}</p></div>`);
    return c;
  }
  onLine(S) {
    if (!S.line || S.gap) return;
    if (S.jump) { if(this.stack) this.stack.innerHTML = ''; this.cards = []; }
    if (this.cards[0]) this.full(this.cards[0].el);
    const el = this.card(S.line); if(this.stack) this.stack.prepend(el);
    this.cards.unshift({ el, spans: [...el.querySelectorAll('.w')] });
    this.cards.slice(4).forEach(c => c.el.remove()); this.cards.length = Math.min(4, this.cards.length);
    if(this.cards) this.cards.forEach((c, i) => { if(c.el) c.el.style.setProperty('--a', i); });
    requestAnimationFrame(() => { if(el) el.classList.add('in'); if(this.stack) this.stack.style.setProperty('--h', (el?.offsetHeight||0) + 'px'); });
  }
  tick(S) {
    if (this.cards[0] && S.line) light(this.cards[0].spans, S.gap ? 99 : S.pos);
    const d = new Date(), k = Math.floor(d.getTime() / 1000);
    if (k !== this.k) {
      this.k = k;
      if(this.clock) this.clock.textContent = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false }).replace(/^0/, '');
      if(this.date) this.date.textContent = d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
      const dur = this.ctx.duration(); if(this.bar && this.bar.style) this.bar.style.width = (dur ? clamp(S.t / dur) * 100 : 0) + '%';
    }
  }
}

/* Payments feed: every lyric line is a payment, $1 per word. The total counts words sung so far. */
export class Money extends Phone {
  pcls = 'nd-money';
  build() {
    this.ph.innerHTML = `<div class="money-status" aria-hidden="true"><span>9:41</span><i></i><span>▂▄▆ ▰</span></div>
      <div class="money-scroll"><header class="money-heading"><div><small>LYRIC WALLET</small><b class="money-total">$0.00</b><span>Simulated · $1 for every word</span></div><span class="money-demo">DEMO</span></header>
      <div class="money-card"><div class="card-top"><span class="card-orbit">◈</span><span>LYRIC / DIGITAL</span><span>)))</span></div><div class="card-bottom"><div><small>Virtual lyric card</small><b class="card-number">•••• 0429</b></div><span class="card-circles" aria-hidden="true"><i></i><i></i></span></div></div>
      <button class="card-reveal" type="button" aria-pressed="false">◉ Show demo card details</button>
      <div class="money-actions"><button class="money-freeze" type="button" aria-pressed="false"><b>❄</b><span>Freeze card</span></button><button class="money-details" type="button"><b>▤</b><span>Card info</span></button><button class="money-activity" type="button"><b>↗</b><span>Activity</span></button></div>
      <div class="money-notice" role="status">A wallet for your words. No real money moves.</div>
      <section class="money-account"><span class="account-icon">♫</span><div><b>Linked to this song</b><small>${esc(this.ctx.song.title || 'Untitled')} · ${esc(this.ctx.song.artist || 'Unknown artist')}</small></div><span>✓</span></section>
      <section class="money-transactions"><div class="transactions-heading"><h3>Transactions</h3><span>LYRIC ACTIVITY</span></div><p class="money-empty">Your first lyric starts the story.</p><div class="feed"></div></section></div>
      <footer class="money-footer"><span>SIMULATED WALLET · NOT A PAYMENT SERVICE</span><i></i></footer>`;
    const q = s => this.ph.querySelector(s);
    this.feed = q('.feed'); this.total = q('.money-total'); this.rows = [];
    const notice = text => { q('.money-notice').textContent = text; };
    q('.card-reveal').addEventListener('click', () => {
      const shown = q('.card-reveal').getAttribute('aria-pressed') !== 'true';
      q('.card-reveal').setAttribute('aria-pressed', String(shown));
      q('.card-reveal').textContent = shown ? '◉ Hide demo card details' : '◉ Show demo card details';
      q('.card-number').textContent = shown ? 'DEMO · 0000 0429' : '•••• 0429';
    });
    q('.money-freeze').addEventListener('click', () => {
      this.frozen = !this.frozen; q('.money-freeze').setAttribute('aria-pressed', String(this.frozen));
      q('.money-freeze span').textContent = this.frozen ? 'Unfreeze' : 'Freeze card';
      q('.money-card').classList.toggle('frozen', this.frozen);
      notice(this.frozen ? 'Demo card frozen. Lyrics and playback continue.' : 'Demo card active. No real money moves.');
    });
    q('.money-details').addEventListener('click', () => notice('Demo card • 0429. Each sung word adds $1 in fictional value. No bank or payment account is connected.'));
    q('.money-activity').addEventListener('click', () => { q('.money-transactions').scrollIntoView?.({ behavior: 'auto', block: 'nearest' }); notice('Activity follows playback. Seek the song to revisit a lyric.'); });
  }
  row(i, line) {
    const hue = Math.floor(rnd(i, 3) * 360), n = line.tokens.length;
    const m = Math.floor(line.t / 60) + ':' + String(Math.floor(line.t % 60)).padStart(2, '0');
    const r = $('div', 'tx', `<i style="--h:${hue}">${esc((line.text || '♪')[0].toUpperCase())}</i><div><p>${wordsHTML(line.tokens)}</p><small>In progress · ${m}</small></div><b>+$${n}.00</b>`);
    r.dataset.m = m; return r;
  }
  paid(el) { this.full(el); el.classList.add('paid'); el.querySelector('small').textContent = 'Completed · ' + el.dataset.m; }
  onLine(S) {
    if (S.jump) { this.feed.innerHTML = ''; this.rows = []; }
    this.ph.querySelector('.money-empty').hidden = !!S.line;
    if (!S.line || S.gap) return;
    if (this.rows[0]) this.paid(this.rows[0].el);
    const el = this.row(S.idx, S.line); this.feed.prepend(el);
    this.rows.unshift({ el, line: S.line, spans: [...el.querySelectorAll('.w')], idx: S.idx });
    this.rows.slice(9).forEach(r => r.el.remove()); this.rows.length = Math.min(9, this.rows.length);
    el.classList.add('in');
  }
  tick(S) {
    const r = this.rows[0];
    if (r && S.line) {
      if (this.ctx.lyrics.format === 'TTML') {
        for (const row of this.rows) light(row.spans, wordPos(row.line.tokens, S.t));
      } else light(r.spans, S.gap ? 99 : S.pos);
      if (S.gap) this.paid(r.el);
    }
    const L = this.ctx.lyrics; let sent = 0;
    for (let i = 0; i < S.idx; i++) sent += L.lines[i].tokens.length;
    if (S.line) sent += Math.min(S.line.tokens.length, Math.floor(Math.max(0, S.pos)));
    if (sent !== this.sent) { this.sent = sent; this.total.textContent = '$' + sent.toLocaleString('en-US', { minimumFractionDigits: 2 }); }
  }
}

/* Chat: a WhatsApp-style thread (with Instagram-round bubbles and Discord-style names in groups).
   Who talks follows the lyrics: real singer tags when the file has them, otherwise turns of one to four
   lines (short and long) that sometimes stay with one person and sometimes alternate. */
const KB = '<div class="kb-suggestions"><span>I</span><span>yeah</span><span>I’m</span></div>' + ['qwertyuiop', 'asdfghjkl'].map((r, i) => `<div class="kr${i ? ' r2' : ''}">${[...r].map(c => `<i data-k="${c}">${c}</i>`).join('')}</div>`).join('')
  + `<div class="kr"><i class="sp" data-k="shift">⇧</i>${[...'zxcvbnm'].map(c => `<i data-k="${c}">${c}</i>`).join('')}<i class="sp" data-k="back">⌫</i></div>`
  + `<div class="kr"><i class="sp w2" data-k="sym">123</i><i class="space" data-k="space">space</i><i class="sp w2 go" data-k="go">return</i></div><div class="kb-bottom"><span>☻</span><span>♩</span></div><div class="home-indicator"></div>`;
const NAME_COL = ['#53bdeb', '#e9a23b', '#ff7eb6', '#7fd67a', '#c39bff', '#ff8a65'];
export function planTurns(L, artist) {
  const key=JSON.stringify([L.speakers,artist]);
  if (L._turns && L._turnsKey===key) return L._turns;
  L._turnsKey=key;
  const T = [], sp = L.speakers || [], two = sp.length === 2, group = sp.length > 2;
  let side = 0, left = 0, prevT = -9, prevText = true, turn = 0, first = true, prevWho = -1;
  L.lines.forEach((l, i) => {
    if (!l.text) { T[i] = null; prevText = false; return; }
    let who, fresh;
    if (sp.length) { who = Number.isInteger(l.speaker) && l.speaker >= 0 ? l.speaker : sp.length; fresh = first || who !== prevWho || !prevText; }
    else {
      const gap = l.t - prevT > 3.2;
      if (first || left <= 0 || gap || !prevText) { if (!first) side ^= 1; left = [1, 2, 3, 1, 2, 4, 2][Math.floor(rnd(turn++, 11) * 7)]; fresh = true; } else fresh = false;
      left--; who = side;
    }
    const words = l.tokens.length;
    T[i] = { who, fresh, big: words <= 2 && l.text.length <= 11 };
    prevT = l.t; prevText = true; first = false; prevWho = who;
  });
  L._turns = { T, names: sp.length ? [...sp, ...(L.lines.some(l => !Number.isInteger(l.speaker) || l.speaker < 0) ? ['Unspecified voice'] : [])] : [artist, 'You'], two, group };
  return L._turns;
}
// Human-looking typing timeline for one line: uneven rhythm, longer pauses at spaces and punctuation, and the
// occasional slip on a neighbouring key that is noticed and backspaced. Deterministic, so seeking always agrees.
const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const near = (c, r) => { for (const row of ROWS) { const i = row.indexOf(c); if (i >= 0) return row[clamp(i + (r < 0.5 ? -1 : 1), 0, row.length - 1)]; } return c; };
export function typingPlan(text, seed) {
  const ev = [];
  [...text].forEach((ch, i) => {
    const lo = ch.toLowerCase(), letter = /[a-z]/.test(lo);
    if (letter && i > 0 && rnd(seed, i, 31) < 0.07) { const w = near(lo, rnd(seed, i, 32)); if (w !== lo) { ev.push({ t: 'c', ch: w, w: 0.9 }); ev.push({ t: 'b', w: 1.7 }); } }
    ev.push({ t: 'c', ch, w: ch === ' ' ? 1.25 : /[,.!?;]/.test(ch) ? 1.9 : 0.65 + rnd(seed, i, 33) * 0.95, shift: ch !== lo });
  });
  let c = 0; ev.forEach(e => { c += e.w; e.c = c; }); ev.forEach(e => e.u = e.c / (c || 1));
  return ev;
}
export function typedAt(ev, p) { // text so far and the last key event at progress p (0..1)
  let str = '', last = null;
  for (const e of ev) { if (e.u > p + 1e-9) break; if (e.t === 'c') str += e.ch; else str = str.slice(0, -1); last = e; }
  return { str, last };
}

export class Messages extends Phone {
  pcls = 'nd-wa';
  // All phone sizing is CSS-driven; the chat never consumes Viz.w/h or resize().
  measureFrameRect = false;
  constructor(ph, ctx) {
    super(ph, ctx);
    this.inner = null;
  }
  build() {
    const s = this.ctx.song, L = this.ctx.lyrics;
    if (L.format === 'TTML' && !L.originalSpeakers) {
      L.originalSpeakers = [...(L.speakers || [])];
      const resolved = resolveSingerNames(L,s); L.speakers=resolved.names; L.inferredSpeakers=resolved.inferred;
    }
    this.predict=createPredictor(L.lines);
    const P = planTurns(L, s.artist); this.P = P;
    this.asides = new Map();
    const title = P.group || P.two ? s.title : P.names[0], sub = (P.group || P.two ? P.names.join(', ') : 'online · visual turns');
    const art=s.artwork||'';
    const avatar=`<span class="chat-avatar" aria-hidden="true"><span class="chat-avatar-fallback">${esc((title||"?").trim()[0]||"?")}</span>${art?`<img alt="" src="${esc(art)}" onerror="this.remove()">`:''}</span>`;
    this.ph.innerHTML = `<div class="sb"><span class="chat-clock">${localChatTime()}</span><span class="ios-status" aria-hidden="true"><svg viewBox="0 0 48 16"><path d="M1 13V10h3v3zm5 0V7h3v6zm5 0V4h3v9zm5 0V1h3v12z" fill="currentColor"/><path d="M24 5q7-6 14 0m-11 3q4-4 8 0m-5 3h2" fill="none" stroke="currentColor" stroke-width="2"/></svg><i></i></span></div>
      <header class="chat-topbar"><svg viewBox="0 0 24 24" class="bk"><path d="M15 5l-7 7 7 7"/></svg>${avatar}
      <div class="chat-contact"><b>${esc(title)}</b><small>${esc(sub)}</small></div>
      <div class="nav-trailing"><svg viewBox="0 0 24 24"><rect x="3" y="7" width="12" height="10" rx="2.5"/><path d="M15 11l6-3v8l-6-3"/></svg><svg viewBox="0 0 24 24"><path d="M6 4l3 4-2 2c1 3 3 5 6 6l2-2 4 3-1 3c-9 1-16-6-14-14z"/></svg></div></header>
      <div class="thread"><div class="inner"><div class="chip">TODAY</div></div></div>
      <footer><button type="button" class="chat-media-launch" aria-label="Add sticker or emote to lyric chat" title="Browse stickers and emotes"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M3 12h18"/></svg></button><span class="inp"><em>Message</em></span><svg class="composer-camera" viewBox="0 0 24 24"><path d="M3 7h4l2-3h6l2 3h4v14H3z"/><circle cx="12" cy="13" r="4"/></svg><b class="snd" data-k="send"><svg viewBox="0 0 24 24"><path d="M4 12l16-8-6 16-3-7z"/></svg></b></footer>
      <div class="kbw"><div class="kb">${KB}</div></div>
      <div class="phone-home" aria-hidden="true"><span class="home-indicator"></span></div>`;
    this.inner = this.ph.querySelector(".inner"); this.sub = this.ph.querySelector("header small"); this.rows = []; this.typing = null;
    this.thread = this.ph.querySelector('.thread'); this.following = true;
    this.thread.tabIndex = 0;
    this.thread.setAttribute('role', 'region');
    this.thread.setAttribute('aria-label', 'Lyric chat history');
    // Scrolling caused by layout, a new lyric, or setting scrollTop is not a
    // request to browse history. Only a deliberate gesture pauses auto-follow.
    this.userScrollUntil = 0;
    this.lastScrollTop = 0;
    const userScroll = () => { this.userScrollUntil = Date.now() + 750; };
    const scrollable = () => this.thread.scrollHeight > this.thread.clientHeight + 8;
    const browseHistory = () => { if (scrollable()) { userScroll(); this.following = false; } };
    this.thread.addEventListener('wheel', e => { if (e.deltaY < 0) browseHistory(); }, { passive: true });
    this.thread.addEventListener('touchstart', e => { this.touchY = e.touches[0]?.clientY; }, { passive: true });
    this.thread.addEventListener('touchmove', e => {
      const y = e.touches[0]?.clientY;
      if (y != null && this.touchY != null && y > this.touchY + 2) browseHistory();
      this.touchY = y;
    }, { passive: true });
    this.thread.addEventListener('pointermove', e => { if (e.buttons) userScroll(); }, { passive: true });
    this.thread.addEventListener('keydown', e => {
      if (e.target.closest('button,input,textarea,[contenteditable="true"]')) return;
      if (['ArrowUp', 'PageUp', 'Home'].includes(e.key) || e.key === ' ' && e.shiftKey) browseHistory();
      else if (e.key === 'Tab') userScroll();
    });
    this.thread.addEventListener('scroll', () => {
      const top = this.thread.scrollTop;
      if (this.atLatest()) { this.following = true; this.userScrollUntil = 0; }
      else if (Date.now() < this.userScrollUntil && top < this.lastScrollTop - 1) this.following = false;
      this.lastScrollTop = top;
    }, { passive: true });
    // Replies, GIFs and the keyboard can grow after the lyric frame has run.
    // Keep the last bubble visible even when playback is paused or frames stall.
    if (typeof ResizeObserver !== 'undefined') {
      this.chatResizeObserver = new ResizeObserver(() => this.scrollToLatest());
      this.chatResizeObserver.observe(this.inner);
      this.chatResizeObserver.observe(this.thread);
    }
    this.kbw = this.ph.querySelector(".kbw"); this.inp = this.ph.querySelector(".inp"); this.plans = new Map(); this.down = [];
    this.keys = {}; this.ph.querySelectorAll("[data-k]").forEach(e => this.keys[e.dataset.k] = e);
    this.predictionText = ""; this.shown = ""; this.kbo = false;
    this.clock = this.ph.querySelector(".chat-clock");
    this.ph.querySelector('.chat-media-launch').onclick=()=>{
      this.chatInteractions ||= new ChatInteractions(this);
      const index=this.rows[0]?.index ?? L.lines.findIndex(line=>line.text);
      if(index>=0)this.chatInteractions.openMedia(index);
    };
    this.applyProfileMedia();
  }
  applyProfileMedia() {
    const header=this.ph.querySelector('header.chat-topbar'), avatar=header?.querySelector('.chat-avatar');
    if(!header||!avatar)return;
    avatar.querySelector('.chat-custom-avatar')?.remove();
    const reduced=typeof matchMedia==='function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const chosen=cleanMedia(this.ctx.opts?.avatar?.());
    if(chosen?.kind==='pfp' && (!reduced||!chosen.animated)){
      const img=document.createElement('img');img.className='chat-custom-avatar';img.alt='';
      img.referrerPolicy='no-referrer';img.onerror=()=>img.remove();
      img.src=mediaURL(chosen);avatar.append(img);
    }
    const banner=cleanMedia(this.ctx.opts?.banner?.());
    const url=banner?.kind==='banner' && (!reduced||!banner.animated)?mediaURL(banner):null;
    header.classList.toggle('has-chat-banner',!!url);
    header.style.backgroundImage=url?`linear-gradient(#10212dbb,#10212dcc),url("${url}")`:'';
  }
  atLatest() {
    const thread = this.thread;
    return !thread || thread.scrollHeight - thread.clientHeight - thread.scrollTop <= Math.max(8, thread.clientWidth * .04);
  }
  scrollToLatest() {
    if (this.following && this.thread) {
      this.thread.scrollTop = this.thread.scrollHeight;
      this.lastScrollTop = this.thread.scrollTop;
    }
  }
  outgoing(turn) { return !!turn && !this.P.group && turn.who === 1; }
  lyricSegments(i, line) {
    if (!this.asides.has(i)) {
      const singers = [...(this.ctx.lyrics.speakers || []), this.ctx.song.artist];
      this.asides.set(i, splitChatAsides(line, singers));
    }
    return this.asides.get(i);
  }
  bubble(i, line) {
    const t = this.P.T[i], P = this.P; if (!t) return null;
    const out = this.outgoing(t), mm = messageTime(this.ctx.lyrics,`lyric:${i}`);
    const nm = (P.group || P.two) && t.fresh ? `<s style="color:${NAME_COL[t.who % 6]}">${esc(P.names[t.who] || '')}</s>` : '';
    const b = $('div', `b ${out ? 'out' : 'in'}${t.fresh ? ' tail' : ''}`, `${nm}<p>${wordsHTML(line.tokens)}</p><time>${mm}${out ? '<svg viewBox="0 0 18 10"><path d="M1 5l3 3 6-7M7 8l1 1 7-8"/></svg>' : ''}</time>`);

    // Ensure this.inner exists for tests that call bubble() before build().
    if (!this.inner) this.inner = this.ph.querySelector('.inner');

    addChatReaction(this, b, line.text, i);
    addConversation(this, b, line, i);
    this.chatInteractions ||= new ChatInteractions(this);
    this.chatInteractions.attach(b, i);
    return b;
  }
  lyricBubbles(i, line) {
    const segments = this.lyricSegments(i, line);
    if (!segments) {
      const el = this.bubble(i, line);
      return { el, parts: [{ el, line, spans: [...el.querySelectorAll('.w')] }] };
    }
    // Keep the source line intact. Only this chat view splits a sung aside from
    // its main lyric; merged main tokens still light at their original times.
    const mainTokens = segments.filter(s => !s.aside).flatMap(s => s.tokens);
    const mainLine = { ...line, text: mainTokens.map(t => t.text).join(' ').trim(), tokens: mainTokens };
    const out = this.outgoing(this.P.T[i]);
    const parts = [];
    let main = null;
    for (const segment of segments) {
      let el, partLine;
      if (segment.aside) {
        partLine = { ...line, text: segment.text, tokens: segment.tokens };
        const mm = messageTime(this.ctx.lyrics, `lyric:${i}`);
        el = $('div', `b ${out ? 'in' : 'out'} tail chat-aside`, `<p>${wordsHTML(segment.tokens)}</p><time>${mm}${out ? '' : '<svg viewBox="0 0 18 10"><path d="M1 5l3 3 6-7M7 8l1 1 7-8"/></svg>'}</time>`);
        el.setAttribute('aria-label', `${segment.text}, lyric from the other participant`);
      } else if (!main && mainTokens.length) {
        partLine = mainLine;
        el = main = this.bubble(i, mainLine);
      } else continue;
      parts.push({ el, line: partLine, spans: [...el.querySelectorAll('.w')] });
    }
    // A line consisting only of a sung aside is still a lyric users can react to.
    if (!main && parts.length) {
      this.chatInteractions ||= new ChatInteractions(this);
      this.chatInteractions.attach(parts[0].el, i);
      parts[0].el.setAttribute('aria-label', `${parts[0].line.text}, lyric from the other participant; right-click or hold to react or reply`);
    }
    return { el: main || parts[0]?.el, parts };
  }
  appendListener(index,line,el) {
    if(this.ctx.opts?.listenerReplies?.()===false)return null;
    const text=listenerReplyFor(this.ctx.lyrics,this.P,index,this.ctx.song.title);
    if(!text)return null;
    const reply=document.createElement('div');reply.className=`b chat-fictional-reply ${el.classList.contains('out')?'listener-left':'out'}`;
    reply.setAttribute('aria-label','Generated listener reply');
    const body=document.createElement('p');body.textContent=text;
    const time=document.createElement('time');
    const timing=listenerTiming(line,text);
    reply.listener={text,...timing,plan:typingPlan(text,index+1701),body,time,state:'pending'};
    reply.dataset.clockKey=`listener:${index}`;
    reply.hidden=true;
    reply.append(body,time);if(!this.inner) this.inner=this.ph.querySelector('.inner'); if(this.inner) this.inner.append(reply); return reply;
  }
  manualMediaBubble(index,item,number){
    const b=document.createElement('div');b.className='b out in tail chat-local-media';
    b.setAttribute('aria-label',`Your local ${item.kind}: ${item.name} (not a lyric)`);
    const label=document.createElement('small');label.textContent='You · local media';
    const preview=document.createElement('div');preview.className='chat-local-media-preview';
    const placeholder=document.createElement('span');placeholder.textContent='Loading media…';preview.append(placeholder);
    const time=document.createElement('time');time.textContent=messageTime(this.ctx.lyrics,`manual:${index}:media:${number}`);
    b.append(label,preview,time);
    const controller=new AbortController(),job={element:b,controller};
    this.stickerJobs ||= new Set();this.stickerJobs.add(job);
    renderMediaImage(preview,item,controller.signal,'chat-local-media-image').then(ok=>{
      if(ok && b.isConnected)placeholder.remove();
      else if(!controller.signal.aborted && b.isConnected)placeholder.textContent='Image unavailable';
    }).finally(()=>this.stickerJobs?.delete(job));
    return b;
  }
  refreshManualMedia(index){
    const row=this.rows.find(r=>r.index===index);
    if(!row)return;
    const items=this.chatInteractions?.record(index).media || [];
    row.media ||= [];
    while(row.media.length>items.length)row.media.pop().remove();
    cleanupStickerJobs(this);
    let anchor=row.media.at(-1)||row.reply||row.parts.at(-1)?.el;
    for(let i=row.media.length;i<items.length;i++){
      const b=this.manualMediaBubble(index,items[i],i);
      anchor.after(b);anchor=b;row.media.push(b);
    }
    this.scrollToLatest();
  }
  listenerFrame(t) {
    let active=null;
    this.listenerLayoutChanged=false;
    for(const row of this.rows){
      const el=row.reply,data=el?.listener;if(!data)continue;
      const state=t<data.start?'pending':t<data.end?'typing':'sent';
      if(state!==data.state){
        this.listenerLayoutChanged=true;
        const old=data.state;data.state=state;
        el.classList.remove('typing','listener-arrival');
        if(state==='typing'&&!el.classList.contains('out')){
          el.replaceChildren(...Array.from({length:3},()=>document.createElement('i')));el.classList.add('typing','in');el.hidden=false;
        }else if(state==='sent'){
          data.time.textContent=messageTime(this.ctx.lyrics,el.dataset.clockKey);
          el.replaceChildren(data.body,data.time);el.hidden=false;el.classList.add('in');
          if(old==='typing')el.classList.add('listener-arrival');
        }else {el.hidden=true;el.classList.remove('in');}
      }
      if(state==='typing')active={el,data};
    }
    return active;
  }
  destroy() { this.chatResizeObserver?.disconnect(); cleanupStickerJobs(this,true); this.chatInteractions?.destroy(); this.reactionAbort?.abort(); super.destroy(); }
  onLine(S) {
    const previous = this.rows[0]?.index ?? -1;
    const rewinding = S.idx < previous;
    // A seek restores the conversation up to that point, rather than clearing
    // everything except the current line. Ordinary playback never evicts rows.
    if (rewinding) this.following = true;
    if (rewinding) {
      while (this.rows.length && this.rows[0].index > S.idx) {
        const row = this.rows.shift();
        row.parts.forEach(part => part.el.remove());
        row.reply?.remove();row.media?.forEach(media=>media.remove());
      }
      cleanupStickerJobs(this);
    }
    this.typing?.remove(); this.typing = null;
    if (!S.line || S.idx < 0) { this.scrollToLatest(); return; }
    const last = this.rows[0]?.index ?? -1;
    if (last >= S.idx) { this.scrollToLatest(); return; }
    this.sendFlash = S.t;
    if (this.rows[0]) for (const part of this.rows[0].parts) this.full(part.el);
    // Fill skipped lines on a forward seek, including simultaneous TTML agents.
    // Only a newly arriving, adjacent lyric animates; history is already sent.
    for (let i = last + 1; i <= S.idx; i++) {
      const line = this.ctx.lyrics.lines[i];
      if (!line?.text) continue;
      const row = this.lyricBubbles(i, line);
      for (const part of row.parts) this.inner.append(part.el);
      const reply = this.appendListener(i, line, row.el);
      const media=(this.chatInteractions?.record(i).media || []).map((item,n)=>this.manualMediaBubble(i,item,n));
      this.inner.append(...media);
      this.rows.unshift({ ...row, index: i, line, reply, media });
      const animate = i === S.idx && !S.jump && i === last + 1;
      if (animate) requestAnimationFrame(() => {
        for (const part of row.parts) if (part.el.isConnected) {
          part.el.classList.add('in', 'message-arrival');
        }
      });
      else for (const part of row.parts) {
        part.el.classList.add('in');
        if (i !== S.idx) this.full(part.el);
      }
    }
    this.scrollToLatest();
  }
  tick(S) {
    if (!this.down) this.down = [];
    if (!this.kbw) this.kbw = this.ph?.querySelector('.kbw');
    if (!this.inp) this.inp = this.ph?.querySelector('.inp');
    if (!this.predictionText) this.predictionText = '';
    if (!this.shown) this.shown = '';
    if (!this.kbo) this.kbo = false;
    if (!this.plans) this.plans = new Map();
    if (!this.kbw) this.kbw = this.ph?.querySelector('.kbw');
    if (!this.inp) this.inp = this.ph?.querySelector('.inp');
    if (!this.predictionText) this.predictionText = '';
    if (!this.shown) this.shown = '';
    if (!this.kbo) this.kbo = false;
    cleanupStickerJobs(this);
    const clock=this.clock || this.ph.querySelector('.chat-clock'), now=localChatTime();
    if(clock && clock.textContent!==now)clock.textContent=now;
    const listener=this.listenerFrame(S.t);
    const r = this.rows[0];
    if (!r || !S.line) return;
    const litRows = this.ctx.lyrics.format === 'TTML' ? this.rows : [r];
    for (const row of litRows) for (const part of row.parts) {
      light(part.spans, S.gap && row === r ? 99 : wordPos(part.line.tokens, S.t));
    }
    const L = this.ctx.lyrics; let ni = S.idx + 1; while (L.lines[ni] && !L.lines[ni].text) ni++;
    const nx = L.lines[ni], nt = this.P.T[ni], out = this.outgoing(nt);
    const nextParts = nx && this.lyricSegments(ni, nx);
    const nextMain = nextParts ? nextParts.filter(part => !part.aside).map(part => part.text).join(' ').trim() : nx?.text;
    // Only type the words assigned to this participant, never an extracted aside.
    let kb = false, typed = '', last = null, p = 0;
    if (nx && out && nextMain) {
      const dur = clamp(nextMain.length * 0.065 + 0.5, 0.9, 2.8), start = Math.max(nx.t - dur, S.line.t + 0.35), d = nx.t - start;
      if (d > 0.3 && S.t >= start - 0.5) {
        kb = true; p = clamp((S.t - start) / d);
        let pl = this.plans.get(ni); if (!pl) this.plans.set(ni, pl = typingPlan(nextMain, ni));
        ({ str: typed, last } = typedAt(pl, p)); this.dur = d; this.ev = last && last.u * d;
      }
    }
    if(listener?.el.classList.contains('out')){
      const data=listener.data;kb=true;p=clamp((S.t-data.start)/(data.end-data.start));
      ({str:typed,last}=typedAt(data.plan,p));this.dur=data.end-data.start;this.ev=last&&last.u*this.dur;
    }
    const keyboardChanged=kb!==this.kbo;
    if(this.kbw) this.kbw.classList.toggle('open', kb); if(this.ph) this.ph.classList.toggle('kbopen', kb);
    const predictionText=kb?typed:'';
    if(predictionText!==this.predictionText){
      this.predictionText=predictionText;
    if(this.ph){const bar=this.ph.querySelector('.kb-suggestions');if(bar)bar.replaceChildren();}
      if(this.ph && this.predict){const bar=this.ph.querySelector('.kb-suggestions');if(bar)for(const word of this.predict(predictionText)){const item=document.createElement('span');item.textContent=word;bar.append(item);}}
    }
    const shown = typed.length > 90 ? '…' + typed.slice(-88) : typed;
    const composerChanged=shown!==(this.shown||'');
    if (composerChanged || keyboardChanged) { this.shown = shown; this.kbo = kb; if(this.inp) this.inp.innerHTML = kb ? `${esc(shown)}<u></u>` : '<em>Message</em>'; if(this.ph) this.ph.classList.toggle('hastext', kb && !!shown); }
    if(Array.isArray(this.down)) { for (const k of this.down) { if(k) k.classList.remove('down'); } } this.down = [];
    if (kb && last && p * this.dur - this.ev < 0.13 && p < 1) {
    const hit = k => { const e = this.keys?.[k]; if (e) { e.classList.add('down'); if(Array.isArray(this.down)) this.down.push(e); } };
      if (last.t === 'b') hit('back'); else { const c = last.ch.toLowerCase(); if (last.shift) hit('shift'); hit(c === ' ' ? 'space' : /[a-z]/.test(c) ? c : 'sym'); }
    }
    if (kb && p >= 0.985) { const g = this.keys.go; g.classList.add('down'); this.down.push(g); }
    const want = !!(!listener && nx && nt && !out && nextMain && S.t > nx.t - 1.5);
    const typingChanged=want!==!!this.typing;
    if (want && !this.typing) {
      this.typing = $('div', 'b typing in' + (nt.fresh ? ' tail' : ''), '<i></i><i></i><i></i>'); if(this.inner) this.inner.append(this.typing); requestAnimationFrame(() => this.typing?.classList.add('in'));
      this.sub.textContent = this.P.group ? (this.P.names[nt.who] || '') + ' is typing…' : 'typing…';
    }
    if (!want && this.typing) { this.typing.remove(); this.typing = null; this.sub.textContent = this.P.group ? this.P.names.join(', ') : 'online'; }
    // Measuring scrollHeight after every unchanged frame or typed character
    // forces layout of the entire retained chat. Newly visible replies and
    // typing scroll here; ResizeObserver follows composer/keyboard size changes
    // and late images. Older browsers without it retain legacy frame following.
    if(!this.chatResizeObserver || this.listenerLayoutChanged || keyboardChanged || typingChanged) this.scrollToLatest();
  }
}

export { MapStyle } from './map.js?v=native-map-7';
