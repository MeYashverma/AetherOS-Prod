// Motion scenes: the words draw a picture as they go.
import { $, esc, clamp, lerp, rnd, ease, backOut, Viz, light, iconFor, canvasFor } from './core.js';

/* Codestyle: one terminal window that changes what it is. Every few lines it cuts (with a CRT glitch) between an
   editor, a shell session and a git diff, so the lyric is never typed the same way for long. */
const EDITOR = [
  l => `<b class="kw">say</b>(<span class="str">"${l}"</span>);`,
  (l, n) => `<b class="kw">const</b> <span class="var">verse${n}</span> <span class="op">=</span> <span class="str">"${l}"</span>;`,
  l => `<b class="kw">await</b> <span class="fn">sing</span>(<span class="str">\`${l}\`</span>);`,
  l => `<span class="cm">// ${l}</span>`,
  l => `<b class="kw">yield</b> <span class="str">'${l}'</span>;`,
  (l, n) => `<span class="fn">emit</span>({ <span class="var">line</span>: <span class="num">${n}</span>, <span class="var">text</span>: <span class="str">"${l}"</span> });`
];
const MODES = ['editor', 'term', 'diff'], TITLES = { editor: n => n + '.ts', term: () => 'zsh — 80×24', diff: () => 'git diff HEAD~1' };
export class Codestyle extends Viz {
  cls = 'code'; icons = false;
  init() {
    const s = this.ctx.song, name = s.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 22) || 'song';
    this.name = name; this.mode = null; this.prevText = '';
    this.el.innerHTML = `<div class="win"><div class="tb"><i></i><i></i><i></i><span class="ttl"></span></div>
      <div class="body"><aside><small>EXPLORER</small><u>▾ ${esc(s.artist.slice(0, 18))}</u><u class="on">  ${esc(name)}.ts</u><u>  chorus.ts</u><u>  verse.ts</u><u>  bridge.ts</u><u>▸ node_modules</u></aside>
        <div class="main"><div class="tabs"><span class="on">${esc(name)}.ts</span><span>chorus.ts</span></div><div class="ed"><div class="lines"></div></div>
          <div class="term"><small>TERMINAL</small><div class="log"></div></div></div><div class="mini"></div></div>
      <div class="status"><span class="mode"></span><span class="pos"></span></div></div>`;
    this.win = this.el.querySelector('.win'); this.lines = this.el.querySelector('.lines'); this.ed = this.el.querySelector('.ed'); this.log = this.el.querySelector('.log'); this.mini = this.el.querySelector('.mini');
    this.ttl = this.el.querySelector('.ttl'); this.posEl = this.el.querySelector('.pos'); this.modeEl = this.el.querySelector('.mode'); this.rows = [];
  }
  scene(S) { return MODES[(Math.floor(S.idx / 5) + Math.floor(rnd(Math.floor(S.idx / 5), 4) * 3)) % 3]; }
  setMode(m) {
    this.mode = m; this.win.className = 'win m-' + m; this.ttl.textContent = this.name === '' ? '' : TITLES[m](this.name);
    this.lines.innerHTML = ''; this.rows = []; this.log.innerHTML = ''; this.mini.innerHTML = '';
    if (m === 'editor') this.lines.innerHTML = `<div class="cl hd"><u>1</u><code><b class="kw">export default async function</b> <span class="fn">${esc(this.name)}</span>() {</code></div>`;
    if (m === 'term') this.lines.innerHTML = `<div class="cl"><code><span class="dim">Last login: ${new Date().toDateString()} on ttys001</span></code></div>`;
    if (m === 'diff') this.lines.innerHTML = `<div class="cl"><code><span class="dim">diff --git a/${esc(this.name)}.lyrics b/${esc(this.name)}.lyrics</span></code></div><div class="cl"><code><span class="dim">--- a/${esc(this.name)}.lyrics</span></code></div><div class="cl"><code><span class="dim">+++ b/${esc(this.name)}.lyrics</span></code></div>`;
    this.win.classList.remove('glitch'); void this.win.offsetWidth; this.win.classList.add('glitch');
    this.modeEl.textContent = this.ctx.lyrics.wordLevel ? 'word-level sync' : this.ctx.lyrics.wordCoverage > 0 ? 'partly word-level sync' : 'line sync · words estimated';
  }
  words(line) { return line.tokens.map(w => `<span class="w" data-s="0">${esc(w.text)}${this.icons ? iconFor(w.text) : ''}</span>`).join(' '); }
  mk(i, line) {
    const r = $('div', 'cl'), body = `<span class="txt">${this.words(line)}</span>`, n = i + 1;
    if (this.mode === 'editor') r.innerHTML = `<u>${i + 2}</u><code>  ${EDITOR[i % EDITOR.length](body, n)}<i class="cur"></i></code>`;
    else if (this.mode === 'term') r.innerHTML = `<code><span class="pr">❯</span> <span class="fn">verci</span> sing <span class="op">--line</span> <span class="num">${n}</span> <span class="op">--at</span> <span class="num">${Math.floor(line.t / 60)}:${String(Math.floor(line.t % 60)).padStart(2, '0')}</span><br><span class="ok">✓</span> ${body}<i class="cur"></i></code>`;
    else r.innerHTML = `<code><span class="hunk">@@ -${n},1 +${n},1 @@</span><br>${this.prevText ? `<span class="del">- ${esc(this.prevText)}</span><br>` : ''}<span class="add">+ ${body}</span><i class="cur"></i></code>`;
    return r;
  }
  onLine(S) {
    if (!S.line || S.gap) return;
    const m = this.scene(S); if (m !== this.mode || S.jump) this.setMode(m);
    if (this.rows[0]) { this.rows[0].el.classList.remove('live'); this.rows[0].spans.forEach(s => { s.dataset.s = 2; s._s = 2; }); }
    const el = this.mk(S.idx, S.line); el.classList.add('live'); this.lines.append(el); this.prevText = S.line.text;
    this.rows.unshift({ el, spans: [...el.querySelectorAll('.w')] });
    while (this.rows.length > 14) this.rows.pop().el.remove();
    const mm = Math.floor(S.line.t / 60) + ':' + String(Math.floor(S.line.t % 60)).padStart(2, '0');
    this.log.append($('div', 'lg', `<b>[${mm}]</b> ♪ ${esc(S.line.text.length > 46 ? S.line.text.slice(0, 45) + '…' : S.line.text)}`));
    while (this.log.children.length > 4) this.log.firstChild.remove();
    const bar = $('i'); bar.style.width = clamp(S.line.text.length * 2.2, 6, 100) + '%'; bar.style.opacity = 0.35 + rnd(S.idx, 2) * 0.5; this.mini.append(bar);
    while (this.mini.children.length > 40) this.mini.firstChild.remove();
  }
  tick(S) {
    const r = this.rows[0]; if (!r || !S.line) return;
    light(r.spans, S.gap ? 99 : S.pos);
    this.posEl.textContent = this.mode === 'term' ? 'zsh' : this.mode === 'diff' ? 'git · 1 file changed' : `Ln ${S.idx + 2}, Col ${S.line.text.length + 14}   TypeScript`;
    this.lines.style.transform = `translateY(${-Math.max(0, this.lines.scrollHeight - this.ed.clientHeight)}px)`;
  }
}
export class CodestyleVisual extends Codestyle { icons = true; }

/* Branches: a cherry tree leaning over a still pond at night. The boughs curve and sway, blossoms cluster along the
   twigs and fill in as the song goes, each new word opens a cluster and hangs on a swinging paper tag, petals drift
   onto the water, and the whole scene is reflected in the pond. */
export class Branches extends Viz {
  init() {
    canvasFor(this); this.last = -1; this.born = 0; this.petals = []; this.t0 = performance.now(); this.rip = [];
    this.sky = Array.from({ length: 80 }, (_, i) => ({ x: rnd(i, 1), y: rnd(i, 2) * 0.55, r: rnd(i, 3) * 1.2 + 0.3, s: rnd(i, 4) * 6 }));
    this.flies = Array.from({ length: 14 }, (_, i) => ({ x: rnd(i, 5), y: 0.45 + rnd(i, 6) * 0.4, ph: rnd(i, 7) * 6.28, sp: 0.2 + rnd(i, 8) * 0.4 }));
  }
  resize() { this.fit(); this.build(); }
  build() {
    const W = this.w, H = this.h, segs = [], anchors = [];
    this.pondY = H * 0.84;
    const grow = (p, ang, len, depth, wd, seed) => {
      const i = segs.length, bend = (rnd(seed, depth, 1) - 0.5) * 0.7; segs.push({ p, ang, len, depth, wd, seed, bend });
      if (depth >= 4) for (let k = 0; k < (depth >= 6 ? 2 : 2); k++) anchors.push({ seg: i, t: depth >= 6 ? 0.6 + 0.4 * k : 0.4 + k * 0.45, s: 0.8 + rnd(seed, k, 9) * 0.6, seed: seed + k });
      if (depth >= 6) return;
      const n = depth === 2 ? 3 : 2, spread = 0.3 + rnd(seed, depth, 2) * 0.4;
      for (let k = 0; k < n; k++) { const off = (k - (n - 1) / 2) * spread * 1.6 + (rnd(seed, depth, 3 + k) - 0.5) * 0.35 + 0.05; grow(i, ang + off, len * (0.66 + rnd(seed, depth, 6 + k) * 0.16), depth + 1, wd * 0.62, seed * 3 + k + depth * 7); }
    };
    grow(-1, -Math.PI / 2 + 0.34, Math.min(H * 0.185, W * 0.24), 0, Math.max(10, W * 0.022), 11);
    this.segs = segs; this.anchors = anchors.filter(a => segs[a.seg].depth >= 5).sort((a, b) => rnd(a.seed, 3) - rnd(b.seed, 3)); this.amb = anchors.filter(a => segs[a.seg].depth === 4);
  }
  calc(t) { // swayed geometry: start, control, end per segment
    const W = this.w, H = this.h, out = [];
    for (const s of this.segs) {
      const st = s.p < 0 ? [W * 0.2, this.pondY + 6] : out[s.p].e, a = s.ang + Math.sin(t * 0.6 + s.seed * 0.7) * 0.014 * (s.depth + 1) * 0.55 + Math.sin(t * 1.7 + s.seed) * 0.004 * s.depth;
      const ex = st[0] + Math.cos(a) * s.len, ey = st[1] + Math.sin(a) * s.len, nx = -Math.sin(a), ny = Math.cos(a), c = [(st[0] + ex) / 2 + nx * s.bend * s.len * 0.5, (st[1] + ey) / 2 + ny * s.bend * s.len * 0.5];
      out.push({ st, c, e: [ex, ey], a });
    }
    return out;
  }
  sprite(col) { // one pre-rendered blossom per colour: thousands of gradient petals per frame would stall the browser
    if (this._sp?.col === col) return this._sp.c; const c = document.createElement('canvas'); c.width = c.height = 96; this.flower(c.getContext('2d'), 48, 48, 44, col, 0, 1); this._sp = { col, c }; return c;
  }
  blob(g, x, y, r, rot, a, col) { const c = this.sprite(col); g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(rot); g.drawImage(c, -r, -r, r * 2, r * 2); g.restore(); }
  at(G, an) { const s = G[an.seg], t = an.t, u = 1 - t; return [u * u * s.st[0] + 2 * u * t * s.c[0] + t * t * s.e[0], u * u * s.st[1] + 2 * u * t * s.c[1] + t * t * s.e[1]]; }
  flower(g, x, y, r, col, rot, a) {
    g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha *= a;
    for (let k = 0; k < 5; k++) { g.rotate(1.2566); const gr = g.createRadialGradient(0, -r * 0.2, r * 0.05, 0, -r * 0.6, r * 0.8); gr.addColorStop(0, '#fff'); gr.addColorStop(0.55, col); gr.addColorStop(1, col); g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-r * 0.62, -r * 0.35, -r * 0.5, -r * 1.05, -r * 0.1, -r * 0.98); g.lineTo(0, -r * 0.84); g.lineTo(r * 0.1, -r * 0.98); g.bezierCurveTo(r * 0.5, -r * 1.05, r * 0.62, -r * 0.35, 0, 0); g.fill(); }
    g.strokeStyle = 'rgba(210,70,110,.7)'; g.lineWidth = Math.max(0.5, r * 0.05); for (let k = 0; k < 6; k++) { g.rotate(1.0472); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -r * 0.3); g.stroke(); }
    g.fillStyle = '#ffd86b'; for (let k = 0; k < 5; k++) { g.rotate(1.2566); g.beginPath(); g.arc(0, -r * 0.22, r * 0.045, 0, 6.3); g.fill(); }
    g.restore();
  }
  tick(S, dt) {
    const g = this.g, th = this.ctx.theme, W = this.w, H = this.h, L = this.ctx.lyrics, now = performance.now(), t = (now - this.t0) / 1000, pY = this.pondY; g.clearRect(0, 0, W, H);
    if (!this.segs) this.build();
    // night sky, moon, stars, distant hills and mist
    const sky = g.createLinearGradient(0, 0, 0, pY); sky.addColorStop(0, '#070412'); sky.addColorStop(0.55, '#1a0e2e'); sky.addColorStop(1, '#3a1d44'); g.fillStyle = sky; g.fillRect(0, 0, W, pY);
    for (const s of this.sky) { g.globalAlpha = 0.2 + 0.5 * Math.abs(Math.sin(t * 0.5 + s.s)); g.fillStyle = '#fff'; g.beginPath(); g.arc(s.x * W, s.y * H, s.r, 0, 6.3); g.fill(); } g.globalAlpha = 1;
    const mx = W * 0.78, my = H * 0.2, mr = Math.min(W, H) * 0.07, halo = g.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 5); halo.addColorStop(0, 'rgba(255,240,210,.35)'); halo.addColorStop(1, 'rgba(255,240,210,0)'); g.fillStyle = halo; g.fillRect(mx - mr * 5, my - mr * 5, mr * 10, mr * 10);
    g.fillStyle = '#fff4d8'; g.beginPath(); g.arc(mx, my, mr, 0, 6.3); g.fill(); g.fillStyle = 'rgba(200,180,160,.35)'; for (const [dx, dy, r] of [[-0.3, -0.2, 0.22], [0.25, 0.15, 0.16], [-0.1, 0.35, 0.12]]) { g.beginPath(); g.arc(mx + dx * mr, my + dy * mr, r * mr, 0, 6.3); g.fill(); }
    for (const [yb, amp, col] of [[0.7, 0.07, '#1d1030'], [0.77, 0.05, '#150a24']]) { g.fillStyle = col; g.beginPath(); g.moveTo(0, pY); for (let x = 0; x <= W; x += 20) g.lineTo(x, H * yb - Math.sin(x / (W * 0.13) + yb * 9) * H * amp - Math.sin(x / (W * 0.05)) * H * 0.012); g.lineTo(W, pY); g.closePath(); g.fill(); }
    const mist = g.createLinearGradient(0, pY - H * 0.14, 0, pY); mist.addColorStop(0, 'rgba(170,140,200,0)'); mist.addColorStop(1, 'rgba(170,140,200,.18)'); g.fillStyle = mist; g.fillRect(0, pY - H * 0.14, W, H * 0.14);
    // tree: curved boughs, bark grain, moon-side rim light
    const G = this.calc(t); g.lineCap = 'round'; g.lineJoin = 'round';
    for (const pass of [0, 1, 2]) for (let i = 0; i < this.segs.length; i++) { const s = this.segs[i], c = G[i]; if (pass === 2 && s.wd < 5) continue;
      g.beginPath(); g.moveTo(c.st[0] + (pass === 1 ? s.wd * 0.18 : pass === 2 ? -s.wd * 0.12 : 0), c.st[1]); g.quadraticCurveTo(c.c[0] + (pass === 1 ? s.wd * 0.18 : pass === 2 ? -s.wd * 0.12 : 0), c.c[1], c.e[0] + (pass === 1 ? s.wd * 0.18 : pass === 2 ? -s.wd * 0.12 : 0), c.e[1]);
      g.strokeStyle = pass === 0 ? '#190f16' : pass === 1 ? 'rgba(255,225,200,.16)' : 'rgba(0,0,0,.35)'; g.lineWidth = pass === 0 ? s.wd : pass === 1 ? Math.max(1, s.wd * 0.22) : Math.max(0.8, s.wd * 0.08); g.stroke(); }
    // blossoms: ambient clusters on every twig, brighter and fuller for words already sung
    const col = th.hi, cur = S.idx >= 0 && S.tokens.length ? L._f0[S.idx] + clamp(Math.floor(S.pos), 0, S.tokens.length - 1) : -1;
    if (cur !== this.last && cur >= 0) { this.last = cur; this.born = now; const an = this.anchors[cur % this.anchors.length], [tx, ty] = this.at(G, an); for (let k = 0; k < 9; k++) this.petals.push({ x: tx, y: ty, vx: (Math.random() - 0.5) * 60, vy: -30 - Math.random() * 30, r: 3 + Math.random() * 3.5, a: Math.random() * 6, life: 0 }); }
    const age = (now - this.born) / 1000, R = Math.max(7, W / 62);
    for (const an of this.amb) { const [x, y] = this.at(G, an); for (let k = 0; k < 2; k++) this.blob(g, x + (rnd(an.seed, k, 1) - 0.5) * R * 2.6, y + (rnd(an.seed, k, 2) - 0.5) * R * 2.2, R * 0.7 * an.s, an.seed + k, 0.4, col); }
    const bloomed = new Set(); if (cur >= 0) for (let i = Math.max(0, cur - 90); i <= cur; i++) bloomed.add(i % this.anchors.length);
    this.anchors.forEach((an, idx) => { const [x, y] = this.at(G, an), on = bloomed.has(idx), isCur = cur >= 0 && cur % this.anchors.length === idx, k = isCur ? backOut(age / 0.55) : 1;
      for (let q = 0; q < (on ? 3 : 1); q++) this.blob(g, x + (rnd(an.seed, q, 3) - 0.5) * R * 3, y + (rnd(an.seed, q, 4) - 0.5) * R * 2.6, R * an.s * (on ? 1 : 0.6) * (isCur ? k * 1.25 : 1), an.seed * 2 + q, on ? 0.96 : 0.35, col); });
    // pond with the reflection of everything above, ripples and drifting petals
    g.fillStyle = '#06101f'; g.fillRect(0, pY, W, H - pY);
    g.save(); g.beginPath(); g.rect(0, pY, W, H - pY); g.clip(); g.translate(0, 2 * pY); g.scale(1, -1); g.globalAlpha = 0.3; g.drawImage(this.cv, 0, 0, this.cv.width, this.cv.height, 0, 0, W, H); g.restore();
    const wg = g.createLinearGradient(0, pY, 0, H); wg.addColorStop(0, 'rgba(10,20,45,.2)'); wg.addColorStop(1, 'rgba(4,8,18,.8)'); g.fillStyle = wg; g.fillRect(0, pY, W, H - pY);
    g.strokeStyle = 'rgba(255,240,210,.14)'; g.lineWidth = 1; for (let k = 0; k < 6; k++) { const yy = pY + (k + 1) * (H - pY) / 7 + Math.sin(t + k) * 2; g.beginPath(); g.moveTo(mx - mr * (1.4 - k * 0.12), yy); g.lineTo(mx + mr * (1.4 - k * 0.12), yy); g.stroke(); }
    g.fillStyle = '#0a0612'; g.beginPath(); g.moveTo(0, pY + 2); for (let x = 0; x <= W * 0.4; x += 6) g.lineTo(x, pY - 2 - rnd(x | 0, 1) * 9 * (1 - x / (W * 0.4))); g.lineTo(W * 0.4, pY + 6); g.lineTo(0, H * 0.99); g.closePath(); g.fill();
    // petals
    if (Math.random() < dt * 4) this.petals.push({ x: Math.random() * W * 0.8, y: -8, vx: 10 + Math.random() * 25, vy: 14 + Math.random() * 16, r: 2.5 + Math.random() * 2.5, a: Math.random() * 6, life: 0 });
    this.petals = this.petals.filter(p => { p.life += dt; p.vy = Math.min(p.vy + 26 * dt, 55); p.x += (p.vx + Math.sin(t * 2 + p.a) * 22) * dt; p.y += p.vy * dt;
      if (p.y >= pY + (H - pY) * rnd(p.a * 100 | 0, 3) * 0.7 + 4) { this.rip.push({ x: p.x, y: p.y, l: 0 }); return false; }
      p.a += dt * 2; g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = col; g.globalAlpha = 0.9; g.beginPath(); g.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, 6.3); g.fill(); g.restore(); return true; });
    this.rip = this.rip.filter(r => { r.l += dt; if (r.l > 2) return false; g.globalAlpha = 0.4 * (1 - r.l / 2); g.strokeStyle = col; g.lineWidth = 1; g.beginPath(); g.ellipse(r.x, r.y, 4 + r.l * 26, (4 + r.l * 26) * 0.3, 0, 0, 6.3); g.stroke(); return true; }); g.globalAlpha = 1;
    // hanging paper tags with the words (swing like a pendulum)
    if (cur >= 0) { const fam = getComputedStyle(this.el).fontFamily;
      for (let a = 5; a >= 0; a--) { const i = cur - a; if (i < 0) continue; const an = this.anchors[i % this.anchors.length], [x, y] = this.at(G, an), cu = a === 0, fs = Math.max(20, Math.min(W * 0.05, 42)) * (cu ? 1 : 0.62) * (th.scale || 1), word = L.flat[i].text;
        g.font = `${cu ? 800 : 600} ${fs}px ${fam}`; const tw = g.measureText(word).width + fs * 0.9, th_ = fs * 1.55, sl = fs * 1.2 + 14, sw = Math.sin(t * 1.4 + i) * 0.1 * (cu ? 1 + Math.exp(-age * 2) * 2 : 1) + 0.04, al = 1 - a / 7;
        g.save(); g.globalAlpha = al; g.translate(x, y); g.rotate(sw); g.strokeStyle = 'rgba(255,230,210,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, sl); g.stroke();
        g.translate(0, sl); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 10; g.fillStyle = '#f6ead6'; g.beginPath(); g.roundRect(-tw / 2, 0, tw, th_, fs * 0.16); g.fill(); g.shadowBlur = 0; g.strokeStyle = 'rgba(160,90,100,.5)'; g.lineWidth = 1.2; g.stroke();
        g.fillStyle = '#6a2a3c'; g.beginPath(); g.arc(0, fs * 0.2, fs * 0.07, 0, 6.3); g.fill(); g.fillStyle = '#2a1420'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(word, 0, th_ * 0.6); g.restore(); } }
    // fireflies
    for (const f of this.flies) { const x = (f.x + Math.sin(t * f.sp + f.ph) * 0.06) * W, y = (f.y + Math.cos(t * f.sp * 1.3 + f.ph) * 0.04) * H, a = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.6 + f.ph)), gr = g.createRadialGradient(x, y, 0, x, y, 9); gr.addColorStop(0, `rgba(255,236,150,${a})`); gr.addColorStop(1, 'rgba(255,236,150,0)'); g.fillStyle = gr; g.fillRect(x - 9, y - 9, 18, 18); }
    g.globalAlpha = 1; g.textBaseline = 'alphabetic';
  }
}

/* Web: a macro photograph of a dew-covered orb web at dawn. A true spiral thread with scalloped sag, glossy dew drops,
   soft bokeh behind, and each new word caught inside a big glass droplet. The spider rappels down on silk to it and
   the whole web shivers on impact. */
export class Web extends Viz {
  init() {
    canvasFor(this); this.last = -1; this.born = 0; this.prev = null; this.t0 = performance.now();
    this.bok = Array.from({ length: 26 }, (_, i) => ({ x: rnd(i, 1), y: rnd(i, 2), r: 0.025 + rnd(i, 3) * 0.07, c: ['255,205,140', '140,200,255', '255,160,200', '170,255,220'][i % 4], ph: rnd(i, 4) * 6.28, sp: 0.02 + rnd(i, 5) * 0.04 }));
    const c = document.createElement('canvas'); c.width = c.height = 40; const g = c.getContext('2d'); // glossy dew drop sprite
    const b = g.createRadialGradient(20, 20, 2, 20, 20, 18); b.addColorStop(0, 'rgba(255,255,255,.15)'); b.addColorStop(0.7, 'rgba(180,215,255,.35)'); b.addColorStop(1, 'rgba(255,255,255,.85)'); g.fillStyle = b; g.beginPath(); g.arc(20, 20, 18, 0, 6.3); g.fill();
    const h = g.createRadialGradient(14, 13, 0, 14, 13, 9); h.addColorStop(0, 'rgba(255,255,255,.95)'); h.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = h; g.beginPath(); g.arc(14, 13, 9, 0, 6.3); g.fill();
    g.fillStyle = 'rgba(255,230,190,.55)'; g.beginPath(); g.ellipse(24, 27, 6, 3.4, -0.7, 0, 6.3); g.fill(); this.drop = c;
  }
  resize() { this.fit(); const W = this.w, H = this.h; this.cx = W < H ? W / 2 : W * 0.6; this.cy = H * 0.47; this.R = Math.min(W < H ? W * 0.5 : W * 0.42, H * 0.5); this.rot = -0.4; }
  node(i) { const u = ((i * 0.381966) % 1) * 0.78 + 0.16, th = u * Math.PI * 10 + this.rot, r = this.R * u * (1 - 0.04 * Math.abs(Math.sin(th * 7 - this.rot * 7))); return { x: this.cx + Math.cos(th) * r, y: this.cy + Math.sin(th) * r * 0.92, u }; }
  tick(S, dt) {
    const g = this.g, th = this.ctx.theme, W = this.w, H = this.h, L = this.ctx.lyrics, now = performance.now(), t = (now - this.t0) / 1000; if (!this.R) this.resize();
    // dawn backdrop and bokeh
    const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#07131f'); bg.addColorStop(0.55, '#0d2233'); bg.addColorStop(1, '#2a1a2e'); g.globalCompositeOperation = 'source-over'; g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter'; for (const b of this.bok) { const x = (b.x + Math.sin(t * b.sp + b.ph) * 0.03) * W, y = (b.y + Math.cos(t * b.sp + b.ph) * 0.03) * H, r = b.r * Math.max(W, H), gr = g.createRadialGradient(x, y, r * 0.5, x, y, r); gr.addColorStop(0, `rgba(${b.c},.16)`); gr.addColorStop(0.85, `rgba(${b.c},.11)`); gr.addColorStop(1, `rgba(${b.c},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    const ray = g.createLinearGradient(W * 0.9, 0, W * 0.3, H); ray.addColorStop(0, 'rgba(255,225,170,.22)'); ray.addColorStop(1, 'rgba(255,225,170,0)'); g.fillStyle = ray; g.beginPath(); g.moveTo(W * 0.82, 0); g.lineTo(W * 1.02, 0); g.lineTo(W * 0.55, H); g.lineTo(W * 0.2, H); g.closePath(); g.fill();
    g.globalCompositeOperation = 'source-over';
    if (S.idx < 0 || !S.tokens.length) return;
    const cur = L._f0[S.idx] + clamp(Math.floor(S.pos), 0, S.tokens.length - 1);
    if (cur !== this.last) { this.prev = this.last >= 0 ? this.node(this.last) : null; this.last = cur; this.born = now; }
    const age = (now - this.born) / 1000, amp = age > 0.55 ? Math.exp(-3.4 * (age - 0.55)) : 0, cx = this.cx, cy = this.cy, R = this.R, SP = 14;
    const wob = r => 1 + 0.014 * amp * Math.sin(t * 24 - r * 0.05);
    // frame threads out to the edges, then spokes, then the spiral (a soft glow pass and a crisp pass)
    g.lineCap = 'round'; g.lineJoin = 'round'; const warm = th.hi;
    const draw = (wd, a) => {
      g.strokeStyle = warm; g.globalAlpha = a; g.lineWidth = wd;
      g.beginPath(); for (let k = 0; k < SP; k++) { const a0 = k * Math.PI * 2 / SP + this.rot; g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a0) * R * 1.02 * wob(R), cy + Math.sin(a0) * R * 0.94 * wob(R)); } g.stroke();
      g.beginPath(); for (const [ex, ey, k] of [[0, 0, 5], [W, 0, 1], [W, H, 8], [0, H, 11], [W * 0.5, 0, 3], [0, H * 0.5, 13]]) { const a0 = k * Math.PI * 2 / SP + this.rot; g.moveTo(cx + Math.cos(a0) * R * 1.02, cy + Math.sin(a0) * R * 0.94); g.lineTo(ex, ey); } g.stroke();
      g.beginPath(); for (let a1 = 0.3, n = 0; a1 < Math.PI * 9.6; a1 += 0.07, n++) { const u = a1 / (Math.PI * 10), r = R * u * (1 - 0.04 * Math.abs(Math.sin(a1 * 7))) * wob(R * u), x = cx + Math.cos(a1 + this.rot) * r, y = cy + Math.sin(a1 + this.rot) * r * 0.92; n ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    };
    draw(5, 0.1); draw(1.1, 0.7);
    // dew drops strung along the spiral
    g.globalAlpha = 0.95; for (let a1 = 0.5, n = 0; a1 < Math.PI * 9.6; a1 += 0.42 + rnd(n++, 3) * 0.3) { const u = a1 / (Math.PI * 10), r = R * u * (1 - 0.04 * Math.abs(Math.sin(a1 * 7))), x = cx + Math.cos(a1 + this.rot) * r, y = cy + Math.sin(a1 + this.rot) * r * 0.92, d = 4 + rnd(n, 5) * 6 + u * 4; g.drawImage(this.drop, x - d, y - d, d * 2, d * 2); }
    g.globalAlpha = 1;
    // words: the current one inside a big glass droplet, earlier ones as small drops with a label
    const fam = getComputedStyle(this.el).fontFamily, big = Math.max(24, Math.min(W * 0.055, 52)) * (th.scale || 1), N = 5;
    for (let i = Math.max(0, cur - N); i <= cur; i++) {
      const a = cur - i, nd = this.node(i), al = 1 - a / (N + 1); if (a === 0 && age < 0.55) continue;
      const word = L.flat[i].text, pop = a === 0 ? backOut((age - 0.55) / 0.4) : 1; g.globalAlpha = al;
      if (a === 0) { g.font = `800 ${big}px ${fam}`; const tw = g.measureText(word).width, r = clamp(tw / 2 + big * 0.6, 34, W * 0.3) * pop, x = clamp(nd.x, r + 6, W - r - 6), y = clamp(nd.y, r + 6, H - r - 6);
        g.save(); g.shadowColor = warm; g.shadowBlur = 36; g.drawImage(this.drop, x - r, y - r, r * 2, r * 2); g.restore();
        g.fillStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.arc(x, y, r * 0.86, 0, 6.3); g.fill(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.save(); g.translate(x, y); g.scale(1 + 0.12 * pop, 1 + 0.12 * pop); g.lineWidth = big * 0.12; g.strokeStyle = 'rgba(8,20,36,.6)'; g.lineJoin = 'round'; g.strokeText(word, 0, 0); g.fillStyle = '#fff'; g.fillText(word, 0, 0); g.restore(); }
      else { const d = 7 + 4 / a; g.drawImage(this.drop, nd.x - d, nd.y - d, d * 2, d * 2); const fs = big * (a === 1 ? 0.62 : 0.46); g.font = `600 ${fs}px ${fam}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const tw = g.measureText(word).width, x = clamp(nd.x, tw / 2 + 8, W - tw / 2 - 8); g.lineWidth = fs * 0.2; g.strokeStyle = 'rgba(6,14,24,.85)'; g.lineJoin = 'round'; g.strokeText(word, x, nd.y + d + fs * 0.75); g.fillStyle = warm; g.fillText(word, x, nd.y + d + fs * 0.75); }
    }
    g.globalAlpha = 1; g.textBaseline = 'alphabetic';
    // spider on silk: climbs the old thread, then drops onto the new word
    const nd = this.node(cur); let sx = nd.x, sy = nd.y, ax = nd.x;
    if (age < 0.55) { const pv = this.prev || { x: nd.x, y: -30 }; if (age < 0.22) { const k = ease(age / 0.22); sx = pv.x; sy = lerp(pv.y, -14, k); ax = pv.x; } else { const k = ease((age - 0.22) / 0.33); sx = nd.x; sy = lerp(-14, nd.y, k); ax = nd.x; } }
    g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(ax, 0); g.lineTo(sx, sy); g.stroke();
    if (age < 0.9) { g.fillStyle = '#0b0d12'; g.strokeStyle = '#0b0d12'; g.lineWidth = 1.7; const sw = Math.sin(t * 26) * 3; for (let l = 0; l < 4; l++) for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + sd * (8 + l * 2), sy + (l - 1.5) * 4 + sw); g.lineTo(sx + sd * (15 + l * 2), sy + (l - 1.5) * 7 + sw * 1.5); g.stroke(); } g.beginPath(); g.ellipse(sx, sy + 2, 5, 7, 0, 0, 6.3); g.fill(); g.beginPath(); g.arc(sx, sy - 5, 3.4, 0, 6.3); g.fill(); }
  }
}

/* Constellation: every word becomes a four-point star joined to the one before it. The word being sung is
   large and pops in; earlier words shrink into small labels and the oldest fade away. */
export class Constellation extends Viz {
  init() { canvasFor(this); this.last = -1; this.born = performance.now(); }
  resize() { this.fit(); }
  at(i) { // deterministic spot: consecutive words visit different cells of a 5x3 grid, so recent stars never overlap
    // snake through the grid (left→right, right→left, ...) so the path flows; every 5th hop jumps across for a long link
    const m = i % 15, row = Math.floor(m / 5), col = row % 2 ? 4 - (m % 5) : m % 5;
    const hop = (i % 5 === 4) ? (col + 2) % 5 : col, cx = hop, cy = row;
    return { x: this.w * (0.1 + 0.8 * (cx + 0.5 + (rnd(i, 2) - 0.5) * 0.55) / 5), y: this.h * (0.17 + 0.62 * (cy + 0.5 + (rnd(i, 3) - 0.5) * 0.55) / 3) };
  }
  spark(g, x, y, R) {
    g.beginPath(); g.moveTo(x, y - R);
    g.quadraticCurveTo(x, y, x + R, y); g.quadraticCurveTo(x, y, x, y + R);
    g.quadraticCurveTo(x, y, x - R, y); g.quadraticCurveTo(x, y, x, y - R); g.fill();
  }
  tick(S) {
    const g = this.g, th = this.ctx.theme, W = this.w, H = this.h, L = this.ctx.lyrics; g.clearRect(0, 0, W, H);
    if (S.idx < 0 || !S.tokens.length) return;
    const cur = L._f0[S.idx] + clamp(Math.floor(S.pos), 0, S.tokens.length - 1);
    if (cur !== this.last) { this.last = cur; this.born = performance.now(); }
    const t = (performance.now() - this.born) / 1000, N = 10, start = Math.max(0, cur - N), TAB = [1, 0.5, 0.3, 0.24];
    const fac = a => TAB[Math.min(a, 3)], size = a => a === 0 ? 1 : lerp(fac(a - 1), fac(a), ease(t / 0.3));
    const big = Math.max(30, Math.min(W * 0.075, 66)) * (th.scale || 1), fam = getComputedStyle(this.el).fontFamily;
    g.lineCap = 'round'; g.strokeStyle = th.hi; g.fillStyle = th.hi;
    for (let i = start + 1; i <= cur; i++) {
      const a = cur - i, al = Math.max(0, 1 - a / (N + 1)), p = this.at(i - 1), q = this.at(i), k = a === 0 ? ease(t / 0.28) : 1;
      g.globalAlpha = al * 0.55; g.lineWidth = 1.3; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + (q.x - p.x) * k, p.y + (q.y - p.y) * k); g.stroke();
    }
    g.textAlign = 'center';
    for (let i = start; i <= cur; i++) {
      const a = cur - i, al = a <= 6 ? 1 : Math.max(0, 1 - (a - 6) / 5), sz = size(a), pop = a === 0 ? backOut(t / 0.38) : 1;
      const P = this.at(i), R = (4 + 15 * sz) * pop * (th.scale || 1), fs = big * sz * (a === 0 ? pop : 1);
      g.globalAlpha = al; g.shadowColor = th.hi; g.shadowBlur = a === 0 ? 22 : 6; this.spark(g, P.x, P.y, R); g.shadowBlur = 0;
      g.font = `${a < 2 ? 800 : 600} ${fs.toFixed(1)}px ${fam}`;
      const word = L.flat[i].text, w = g.measureText(word).width, x = Math.min(W - w / 2 - 10, Math.max(w / 2 + 10, P.x));
      g.fillText(word, x, P.y + R + fs * 0.95);
    }
    g.globalAlpha = 1;
  }
}
