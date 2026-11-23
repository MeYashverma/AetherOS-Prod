// "Native Design" family: the song as real-looking phone screens. These keep their own colours.
import { $, esc, clamp, lerp, rnd, Viz, wordsHTML, light } from './core.js';
import { Phone } from './phone.js';

/* iPhone 17 lock screen: Dynamic Island, big clock, glass notification stack, media player, flashlight and camera. */
export class Notifications extends Phone {
  pcls = 'nd-ios';
  build() {
    const s = this.ctx.song;
    this.ph.innerHTML = `<div class="wall"></div><div class="shade"></div>
      <div class="island"></div>
      <div class="sbar"><span>Verci</span><span class="rt"><svg viewBox="0 0 20 12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg viewBox="0 0 28 12"><rect x=".5" y=".5" width="24" height="11" rx="3.5" fill="none" stroke="currentColor" opacity=".45"/><rect x="2" y="2" width="19" height="8" rx="2.2"/><rect x="26" y="4" width="1.8" height="4" rx=".9" opacity=".5"/></svg></span></div>
      <div class="lock"><svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg></div>
      <div class="date"></div><div class="clock"></div>
      <div class="nstack"></div>
      <div class="player"><img alt="" src="${esc(s.artwork)}"><div class="pm"><b>${esc(s.title)}</b><span>${esc(s.artist)}</span></div><i class="bar"><u></u></i>
        <div class="pc"><svg viewBox="0 0 24 24"><path d="M6 6v12M18 6l-9 6 9 6z"/></svg><svg viewBox="0 0 24 24" class="pp"><path d="M8 5v14M16 5v14"/></svg><svg viewBox="0 0 24 24"><path d="M18 6v12M6 6l9 6-9 6z"/></svg></div></div>
      <div class="fl"><svg viewBox="0 0 24 24"><path d="M8 3h8l-1 6 2 3v9H7v-9l2-3z"/></svg></div>
      <div class="cam"><svg viewBox="0 0 24 24"><path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13.5" r="3.5"/></svg></div>
      <div class="home"></div>`;
    this.ph.querySelector('.wall').style.backgroundImage = this.art();
    this.stack = this.ph.querySelector('.nstack'); this.cards = []; this.bar = this.ph.querySelector('.bar u');
    this.clock = this.ph.querySelector('.clock'); this.date = this.ph.querySelector('.date');
  }
  card(line) {
    const c = $('div', 'n', `<i class="ico"><svg viewBox="0 0 24 24"><path d="M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/></svg></i>
      <div class="nb"><header><b>${esc(this.ctx.song.artist)}</b><em>now</em></header><strong>${esc(this.ctx.song.title)}</strong><p>${wordsHTML(line.tokens)}</p></div>`);
    return c;
  }
  onLine(S) {
    if (!S.line || S.gap) return;
    if (S.jump) { this.stack.innerHTML = ''; this.cards = []; }
    if (this.cards[0]) this.full(this.cards[0].el);
    const el = this.card(S.line); this.stack.prepend(el);
    this.cards.unshift({ el, spans: [...el.querySelectorAll('.w')] });
    this.cards.slice(4).forEach(c => c.el.remove()); this.cards.length = Math.min(4, this.cards.length);
    this.cards.forEach((c, i) => c.el.style.setProperty('--a', i));
    requestAnimationFrame(() => { el.classList.add('in'); this.stack.style.setProperty('--h', el.offsetHeight + 'px'); });
  }
  tick(S) {
    if (this.cards[0] && S.line) light(this.cards[0].spans, S.gap ? 99 : S.pos);
    const d = new Date(), k = Math.floor(d.getTime() / 1000);
    if (k !== this.k) {
      this.k = k;
      this.clock.textContent = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false }).replace(/^0/, '');
      this.date.textContent = d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
      const dur = this.ctx.duration(); this.bar.style.width = (dur ? clamp(S.t / dur) * 100 : 0) + '%';
    }
  }
}

/* Payments feed: every lyric line is a payment, $1 per word. The total counts words sung so far. */
export class Money extends Phone {
  pcls = 'nd-money';
  build() {
    this.ph.innerHTML = `<div class="head"><small>Lyrics sent</small><b>$0</b><span>$1 for every word</span></div><div class="feed"></div>`;
    this.feed = this.ph.querySelector('.feed'); this.total = this.ph.querySelector('.head b'); this.rows = [];
  }
  row(i, line) {
    const hue = Math.floor(rnd(i, 3) * 360), n = line.tokens.length;
    const m = Math.floor(line.t / 60) + ':' + String(Math.floor(line.t % 60)).padStart(2, '0');
    const r = $('div', 'tx', `<i style="--h:${hue}">${esc(line.text[0].toUpperCase())}</i><div><p>${wordsHTML(line.tokens)}</p><small>Sending</small></div><b>−$${n}</b>`);
    r.dataset.m = m; return r;
  }
  paid(el) { this.full(el); el.classList.add('paid'); el.querySelector('small').textContent = 'Paid · ' + el.dataset.m; }
  onLine(S) {
    if (!S.line || S.gap) return;
    if (S.jump) { this.feed.innerHTML = ''; this.rows = []; }
    if (this.rows[0]) this.paid(this.rows[0].el);
    const el = this.row(S.idx, S.line); this.feed.prepend(el);
    this.rows.unshift({ el, spans: [...el.querySelectorAll('.w')], idx: S.idx });
    this.rows.slice(9).forEach(r => r.el.remove()); this.rows.length = Math.min(9, this.rows.length);
    requestAnimationFrame(() => el.classList.add('in'));
  }
  tick(S) {
    const r = this.rows[0]; if (!r || !S.line) return;
    light(r.spans, S.gap ? 99 : S.pos);
    const L = this.ctx.lyrics; let sent = 0;
    for (let i = 0; i < S.idx; i++) sent += L.lines[i].tokens.length;
    sent += Math.floor(Math.max(0, S.pos));
    if (sent !== this.sent) { this.sent = sent; this.total.textContent = '$' + sent; }
  }
}

/* Chat: a WhatsApp-style thread (with Instagram-round bubbles and Discord-style names in groups).
   Who talks follows the lyrics: real singer tags when the file has them, otherwise turns of one to four
   lines (short and long) that sometimes stay with one person and sometimes alternate. */
const KB = ['qwertyuiop', 'asdfghjkl'].map((r, i) => `<div class="kr${i ? ' r2' : ''}">${[...r].map(c => `<i data-k="${c}">${c}</i>`).join('')}</div>`).join('')
  + `<div class="kr"><i class="sp" data-k="shift">⇧</i>${[...'zxcvbnm'].map(c => `<i data-k="${c}">${c}</i>`).join('')}<i class="sp" data-k="back">⌫</i></div>`
  + `<div class="kr"><i class="sp w2" data-k="sym">123</i><i class="sp" data-k="emo">☺</i><i class="space" data-k="space">space</i><i class="sp w2 go" data-k="go">send</i></div>`;
const NAME_COL = ['#53bdeb', '#e9a23b', '#ff7eb6', '#7fd67a', '#c39bff', '#ff8a65'];
export function planTurns(L, artist) {
  if (L._turns) return L._turns;
  const T = [], sp = L.speakers || [], two = sp.length === 2, group = sp.length > 2;
  let side = 0, left = 0, prevT = -9, prevText = true, turn = 0, first = true, prevWho = -1;
  L.lines.forEach((l, i) => {
    if (!l.text) { T[i] = null; prevText = false; return; }
    let who, fresh;
    if (sp.length) { who = l.speaker < 0 ? 0 : l.speaker; fresh = first || who !== prevWho || !prevText; }
    else {
      const gap = l.t - prevT > 3.2;
      if (first || left <= 0 || gap || !prevText) { if (!first) side ^= 1; left = [1, 2, 3, 1, 2, 4, 2][Math.floor(rnd(turn++, 11) * 7)]; fresh = true; } else fresh = false;
      left--; who = side;
    }
    const words = l.tokens.length;
    T[i] = { who, fresh, big: words <= 2 && l.text.length <= 11 };
    prevT = l.t; prevText = true; first = false; prevWho = who;
  });
  L._turns = { T, names: sp.length ? sp : [artist, 'You'], two, group };
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
  build() {
    const s = this.ctx.song, P = planTurns(this.ctx.lyrics, s.artist); this.P = P;
    const title = P.group ? s.title : P.names[0], sub = P.group ? P.names.join(', ') : 'online';
    this.ph.innerHTML = `<div class="sb"><span>9:41</span><span>●●●</span></div>
      <header><svg viewBox="0 0 24 24" class="bk"><path d="M15 5l-7 7 7 7"/></svg><img alt="" src="${esc(s.artwork)}"><div><b>${esc(title)}</b><small>${esc(sub)}</small></div>
      <svg viewBox="0 0 24 24"><rect x="3" y="7" width="12" height="10" rx="2.5"/><path d="M15 11l6-3v8l-6-3"/></svg><svg viewBox="0 0 24 24"><path d="M6 4l3 4-2 2c1 3 3 5 6 6l2-2 4 3-1 3c-9 1-16-6-14-14z"/></svg></header>
      <div class="thread"><div class="inner"><div class="chip">TODAY</div></div></div>
      <footer><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M8.5 14c1 1.7 2 2.3 3.5 2.3s2.5-.6 3.5-2.3M9 10v.01M15 10v.01"/></svg><span class="inp"><em>Message</em></span><svg class="mic" viewBox="0 0 24 24"><path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4"/></svg><b class="snd" data-k="send"><svg viewBox="0 0 24 24"><path d="M4 12l16-8-6 16-3-7z"/></svg></b></footer>
      <div class="kbw"><div class="kb">${KB}</div></div>`;
    this.inner = this.ph.querySelector('.inner'); this.sub = this.ph.querySelector('header small'); this.rows = []; this.typing = null;
    this.kbw = this.ph.querySelector('.kbw'); this.inp = this.ph.querySelector('.inp'); this.plans = new Map(); this.down = [];
    this.keys = {}; this.ph.querySelectorAll('[data-k]').forEach(e => this.keys[e.dataset.k] = e);
  }
  bubble(i, line) {
    const t = this.P.T[i], P = this.P; if (!t) return null;
    const out = P.two ? t.who === 1 : P.group ? false : t.who === 1, mm = Math.floor(line.t / 60) + ':' + String(Math.floor(line.t % 60)).padStart(2, '0');
    const nm = (P.group || (P.two && t.fresh)) && !out && t.fresh ? `<s style="color:${NAME_COL[t.who % 6]}">${esc(P.names[t.who] || '')}</s>` : '';
    const b = $('div', `b ${out ? 'out' : 'in'}${t.fresh ? ' tail' : ''}${t.big ? ' big' : ''}`, `${nm}<p>${wordsHTML(line.tokens)}</p><time>${mm}${out ? '<svg viewBox="0 0 18 10"><path d="M1 5l3 3 6-7M7 8l1 1 7-8"/></svg>' : ''}</time>`);
    return b;
  }
  onLine(S) {
    if (!S.line || S.gap) return;
    const t = this.P.T[S.idx]; if (!t) return;
    if (S.jump) { this.inner.querySelectorAll('.b').forEach(e => e.remove()); this.rows = []; this.typing = null; }
    this.sendFlash = S.t;
    if (this.rows[0]) this.full(this.rows[0].el);
    this.typing?.remove(); this.typing = null;
    const el = this.bubble(S.idx, S.line); this.inner.append(el);
    this.rows.unshift({ el, spans: [...el.querySelectorAll('.w')] });
    while (this.rows.length > 9) this.rows.pop().el.remove();
    requestAnimationFrame(() => el.classList.add('in'));
  }
  tick(S) {
    const r = this.rows[0]; if (!r || !S.line) return;
    light(r.spans, S.gap ? 99 : S.pos);
    const L = this.ctx.lyrics; let ni = S.idx + 1; while (L.lines[ni] && !L.lines[ni].text) ni++;
    const nx = L.lines[ni], nt = this.P.T[ni], out = !!nt && (this.P.two ? nt.who === 1 : this.P.group ? false : nt.who === 1);
    // Green (outgoing) lines are typed on a real-looking keyboard that rises just before the bubble is sent.
    let kb = false, typed = '', last = null, p = 0;
    if (nx && out) {
      const dur = clamp(nx.text.length * 0.065 + 0.5, 0.9, 2.8), start = Math.max(nx.t - dur, S.line.t + 0.35), d = nx.t - start;
      if (d > 0.3 && S.t >= start - 0.5) {
        kb = true; p = clamp((S.t - start) / d);
        let pl = this.plans.get(ni); if (!pl) this.plans.set(ni, pl = typingPlan(nx.text, ni));
        ({ str: typed, last } = typedAt(pl, p)); this.dur = d; this.ev = last && last.u * d;
      }
    }
    this.kbw.classList.toggle('open', kb); this.ph.classList.toggle('kbopen', kb);
    const shown = typed.length > 90 ? '…' + typed.slice(-88) : typed;
    if (shown !== this.shown || kb !== this.kbo) { this.shown = shown; this.kbo = kb; this.inp.innerHTML = kb ? `${esc(shown)}<u></u>` : '<em>Message</em>'; this.ph.classList.toggle('hastext', kb && !!shown); }
    for (const k of this.down) k.classList.remove('down'); this.down = [];
    if (kb && last && p * this.dur - this.ev < 0.13 && p < 1) {
      const hit = k => { const e = this.keys[k]; if (e) { e.classList.add('down'); this.down.push(e); } };
      if (last.t === 'b') hit('back'); else { const c = last.ch.toLowerCase(); if (last.shift) hit('shift'); hit(c === ' ' ? 'space' : /[a-z]/.test(c) ? c : 'sym'); }
    }
    if (kb && p >= 0.985) { const g = this.keys.go; g.classList.add('down'); this.down.push(g); }
    const want = nx && nt && !out && S.t > nx.t - 1.5;
    if (want && !this.typing) {
      this.typing = $('div', 'b typing in' + (nt.fresh ? ' tail' : ''), '<i></i><i></i><i></i>'); this.inner.append(this.typing); requestAnimationFrame(() => this.typing?.classList.add('in'));
      this.sub.textContent = this.P.group ? (this.P.names[nt.who] || '') + ' is typing…' : 'typing…';
    }
    if (!want && this.typing) { this.typing.remove(); this.typing = null; this.sub.textContent = this.P.group ? this.P.names.join(', ') : 'online'; }
    this.inner.style.transform = `translateY(${-Math.max(0, this.inner.scrollHeight - this.inner.parentElement.clientHeight)}px)`;
  }
}

export { MapStyle } from './map.js';
