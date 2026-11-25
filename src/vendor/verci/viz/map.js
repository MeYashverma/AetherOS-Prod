// A song-synced journey through an entirely fictional, daylight 3D city.
// No artist location, real-world map provider or network map request exists.
import { $, clamp, lerp, wordsHTML, light } from './core.js';
import { Phone } from './phone.js';
import { ProcWorld, songSeed } from './mapworld.js?v=native-map-7';
import { mapCamera } from './mapcamera.js?v=native-map-7';
import { paintMap } from './mapart.js?v=native-map-7';

const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 5 11h4v11h6V11h4z"/></svg>';
const PIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6-5.5-6-10a6 6 0 0 1 12 0c0 4.5-6 10-6 10Z"/><circle cx="12" cy="11" r="2"/></svg>';
const fmtTime = time => `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`;
const fmtDistance = metres => metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${Math.max(10, Math.round(metres / 10) * 10)} m`;
const angleDelta = (a, b) => ((a - b + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
const STOP_WORDS = new Set(['about', 'again', 'away', 'because', 'could', 'every', 'going', 'have', 'just', 'like', 'love', 'never', 'really', 'there', 'these', 'think', 'this', 'those', 'through', 'tonight', 'where', 'would', 'your']);
export class MapStyle extends Phone {
  pcls = 'nd-map';
  build() {
    this.ph.innerHTML = `<div class="cvwrap"></div><div class="map-shade" aria-hidden="true"></div>
      <div class="map-status" aria-hidden="true"><span class="map-clock">9:41</span><span class="map-island"></span><span class="map-signal">▂▄▆ <svg viewBox="0 0 18 14"><path d="M1 5q8-8 16 0M4 8q5-5 10 0M7 11q2-2 4 0"/></svg> ▰</span></div>
      <div class="map-head"><div class="map-brand"><span class="brand-mark">✦</span> LYRIC CITY <span class="brand-generated">GENERATED FOR THIS SONG</span><button class="reroll" type="button" aria-label="Generate a different city" title="Generate a different city"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M19.5 12a7.5 7.5 0 1 1-2-5.2L20 9"/></svg></button></div>
        <div class="nav"><div class="turn-callout"><i class="arrow">${ARROW}</i><b class="turn-dist">—</b></div><div class="nav-copy"><small class="instruction">Waiting for the first lyric…</small><b class="street"></b><span class="road-name"></span></div></div>
        <div class="map-meta"><div class="place">${PIN}<div class="place-copy"><b class="ptxt"></b><small class="psub"></small></div></div><span class="map-perspective">3D · GENERATIVE</span></div></div>
      <div class="map-tools"><button class="explore-toggle" type="button" aria-label="Explore generated landmarks" title="Explore generated landmarks">✦</button><button class="tilt-toggle" type="button" aria-label="Switch to 2D map" aria-pressed="false" title="Switch to 2D map">2D</button><button class="compass" type="button" aria-label="Switch to north-up map" aria-pressed="false" title="Switch to north-up map"><span>N</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 17 19l-5-4-5 4z"/></svg></button></div>
      <div class="explore-head" hidden><button class="back-route" type="button">‹ <span>Lyrics route</span></button><span>FICTIONAL · GENERATED LANDMARK</span></div>
      <div class="landmark-sheet" hidden><div class="sheet-handle" aria-hidden="true"></div><small class="sheet-kicker">DISCOVER · GENERATED CITY</small><b class="landmark-title"></b><p class="landmark-description"></p><div class="sheet-actions"><span class="landmark-position"></span><button class="previous-landmark" type="button" aria-label="Previous landmark">‹</button><button class="next-landmark" type="button" aria-label="Next landmark">›</button></div><small class="sheet-disclaimer">FICTIONAL PLACE · NO REAL-WORLD MAP DATA</small></div>
      <div class="eta"><div class="sheet-handle" aria-hidden="true"></div><div class="trip-stats"><div><small>SONG LEFT</small><b class="left">0:00</b></div><div><small>SONG ENDS</small><b class="arr">--:--</b></div><div><small>LINES AHEAD</small><b class="stops">0</b></div></div>
        <div class="song-progress" aria-hidden="true"><span></span></div><div class="map-footnote">GENERATED CITY · NOT REAL-WORLD DIRECTIONS</div></div>`;
    const q = selector => this.ph.querySelector(selector);
    this.cvh = q('.cvwrap'); this.cv = $('canvas', 'cv'); this.cvh.append(this.cv);
    this.g = this.cv.getContext('2d');
    this.small = q('.instruction'); this.street = q('.street'); this.roadName = q('.road-name');
    this.arrow = q('.arrow'); this.turnDist = q('.turn-dist'); this.compass = q('.compass');
    this.ptxt = q('.ptxt'); this.psub = q('.psub'); this.clock = q('.map-clock');
    this.left = q('.left'); this.arr = q('.arr'); this.stops = q('.stops'); this.progress = q('.song-progress span');
    this.navHead = q('.map-head'); this.mapTools = q('.map-tools'); this.eta = q('.eta');
    this.exploreHead = q('.explore-head'); this.landmarkSheet = q('.landmark-sheet');
    this.landmarkTitle = q('.landmark-title'); this.landmarkDescription = q('.landmark-description');
    this.landmarkPosition = q('.landmark-position'); this.tiltToggle = q('.tilt-toggle');
    this.spans = []; this.infos = new Map(); this.bearing = null; this.variant = 0;
    this.northUp = false; this.flat = false; this.mode = 'navigate'; this.landmarkIndex = 0;
    this.reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.reduced) {
      this.compass.disabled = true;
      this.compass.setAttribute('aria-label', 'North-up map (reduced motion)');
      this.compass.title = 'North-up map (reduced motion)';
    }
    this.names = [...new Set((this.ctx.lyrics.flat || []).map(w => w.text.replace(/[^\p{L}]/gu, '')).filter(w =>
      w.length >= 4 && w.length <= 12 && !STOP_WORDS.has(w.toLowerCase())).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()))].slice(0, 5);
    this.seed = songSeed(this.ctx.song);
    // Instrumental timestamps are not destinations. Map actual lyric lines to
    // consecutive graph segments so a gap cannot silently teleport the car.
    this.lyricCount = 0;
    this.ordinals = this.ctx.lyrics.lines.map(line => line.text ? this.lyricCount++ : Math.max(0, this.lyricCount - 1));
    this.hasLyrics = this.lyricCount > 0;
    this.regenerate();
    q('.reroll').addEventListener('click', () => { this.variant++; this.regenerate(); });
    q('.explore-toggle').addEventListener('click', () => this.setMode('explore', 0));
    q('.back-route').addEventListener('click', () => this.setMode('navigate'));
    q('.next-landmark').addEventListener('click', () => this.setMode('explore', this.landmarkIndex + 1));
    q('.previous-landmark').addEventListener('click', () => this.setMode('explore', this.landmarkIndex - 1));
    this.tiltToggle.addEventListener('click', () => {
      this.flat = !this.flat;
      this.tiltToggle.textContent = this.flat ? '3D' : '2D';
      this.tiltToggle.setAttribute('aria-pressed', String(this.flat));
      this.tiltToggle.setAttribute('aria-label', `Switch to ${this.flat ? '3D' : '2D'} map`);
      this.tiltToggle.title = this.tiltToggle.getAttribute('aria-label');
      q('.map-perspective').textContent = `${this.flat ? '2D' : '3D'} · GENERATIVE`;
      this.ph.dataset.mapView = this.flat ? '2d' : '3d';
    });
    this.compass.addEventListener('click', () => {
      this.northUp = !this.northUp; this.bearing = null;
      this.compass.setAttribute('aria-pressed', String(this.northUp));
      this.compass.setAttribute('aria-label', `Switch to ${this.northUp ? 'heading-up' : 'north-up'} map`);
      this.compass.title = this.compass.getAttribute('aria-label');
    });
  }
  setMode(mode, index = this.landmarkIndex) {
    this.mode = mode;
    const explore = mode === 'explore';
    this.navHead.hidden = explore; this.mapTools.hidden = explore; this.eta.hidden = explore;
    this.exploreHead.hidden = !explore; this.landmarkSheet.hidden = !explore;
    this.ph.classList.toggle('exploring', explore);
    if (explore) {
      this.landmarkIndex = (index % this.world.landmarks.length + this.world.landmarks.length) % this.world.landmarks.length;
      const landmark = this.world.landmarks[this.landmarkIndex];
      this.world.ensure(landmark.x, landmark.y);
      this.landmarkTitle.textContent = landmark.name;
      this.landmarkDescription.textContent = landmark.description;
      this.landmarkPosition.textContent = `${this.landmarkIndex + 1} / ${this.world.landmarks.length} · ${this.world.label}`;
    } else this.bearing = null; // resume at the current lyric, not the old camera frame
  }
  regenerate() {
    // Same song + variant gives the same city, regardless of seeks/remounts.
    const seed = (this.seed ^ Math.imul(this.variant, 0x9e3779b9)) >>> 0;
    this.world = new ProcWorld({ seed, names: this.names });
    this.infos.clear(); this.bearing = null;
    this.ptxt.textContent = this.world.label;
    this.psub.textContent = this.world.districtAt(this.world.start.x, this.world.start.y);
    this.ph.dataset.mapSource = 'procedural';
    this.ph.dataset.mapView = this.flat ? '2d' : '3d';
    if (this.mode === 'explore') this.setMode('explore', this.landmarkIndex);
  }
  info(index) {
    if (this.infos.has(index)) return this.infos.get(index);
    const pts = this.world.seg(index), cum = [0];
    for (let j = 1; j < pts.length; j++) cum.push(cum[j - 1] + Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]));
    const info = { pts, cum, L: cum[cum.length - 1] };
    this.infos.set(index, info); return info;
  }
  streetAt(index, distance) {
    const steps = this.world.segs[index].steps;
    for (const step of steps) {
      if (distance <= step.length) return step.name;
      distance -= step.length;
    }
    return steps.at(-1)?.name || 'LYRIC ROUTE';
  }
  at(index, distance) {
    for (let guard = 0; guard < 8; guard++) {
      const f = this.info(index);
      if (distance <= f.L || guard === 7) {
        const s = clamp(distance, 0, f.L); let j = 1;
        while (j < f.cum.length - 1 && f.cum[j] < s) j++;
        const a = f.pts[j - 1], b = f.pts[j];
        const t = clamp((s - f.cum[j - 1]) / Math.max(1e-6, f.cum[j] - f.cum[j - 1]));
        return { x: lerp(a[0], b[0], t), y: lerp(a[1], b[1], t) };
      }
      distance -= f.L; index++;
    }
  }
  resize() {
    const r = this.cvh.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
    this.cw = r.width; this.ch = r.height;
    this.cv.width = Math.max(1, Math.round(this.cw * d));
    this.cv.height = Math.max(1, Math.round(this.ch * d));
    this.g.setTransform(d, 0, 0, d, 0, 0);
  }
  onLine(S) {
    if (!S.line || S.gap) return;
    this.street.innerHTML = wordsHTML(S.line.tokens);
    this.spans = [...this.street.querySelectorAll('.w')];
    if (S.jump) this.bearing = null;
  }
  tick(S, dt) {
    if (!this.cw) this.resize(); if (!this.cw || !this.ch) return;
    if (S.line && !S.gap) light(this.spans, S.pos);
    const active = S.idx >= 0 && Boolean(S.line?.text);
    const i = active ? this.ordinals[S.idx] : 0, f = this.info(i);
    const distance = active ? (S.gap ? 1 : S.p) * f.L : 0;
    const last = !this.ctx.lyrics.lines.slice(active ? S.idx + 1 : 0).some(line => line.text);
    const me = this.at(i, distance);
    const ahead = this.at(i, last ? Math.min(f.L, distance + 16) : distance + 16);
    const behind = this.at(i, Math.max(0, distance - 16));
    const stationary = ahead.x === me.x && ahead.y === me.y;
    const direction = Math.atan2(stationary ? me.y - behind.y : ahead.y - me.y,
      stationary ? me.x - behind.x : ahead.x - me.x);
    const target = this.northUp || this.reduced ? 0 : -Math.PI / 2 - direction;
    if (this.bearing == null || S.jump || this.reduced) this.bearing = target;
    else this.bearing += angleDelta(target, this.bearing) * (1 - Math.exp(-Math.max(0, dt) * 4));
    this.compass.querySelector('svg').style.transform = `rotate(${(this.bearing * 180 / Math.PI).toFixed(1)}deg)`;
    if (!this.hasLyrics || !active) {
      this.small.textContent = this.hasLyrics ? 'Waiting for the first lyric…' : 'No timed lyrics available';
      this.street.textContent = this.hasLyrics ? 'The route begins with the lyrics' : 'Explore a city made for this song';
      this.roadName.textContent = ''; this.turnDist.textContent = '—';
    } else if (last) {
      this.small.textContent = S.gap ? 'Instrumental · lyric route complete' : 'Final lyric · follow the light';
      this.turnDist.textContent = 'END';
    } else {
      const e1 = this.at(i, Math.max(0, f.L - 13)), e2 = this.at(i, f.L);
      const n1 = this.at(i + 1, 0), n2 = this.at(i + 1, 13);
      const deg = angleDelta(Math.atan2(n2.y - n1.y, n2.x - n1.x), Math.atan2(e2.y - e1.y, e2.x - e1.x)) * 180 / Math.PI;
      const turn = Math.abs(deg) < 27 ? 'continue' : `${Math.abs(deg) < 60 ? 'bear' : 'turn'} ${deg > 0 ? 'right' : 'left'}`;
      this.small.textContent = turn === 'continue' ? 'Continue to the next lyric' : `${turn[0].toUpperCase() + turn.slice(1)} at the next lyric`;
      this.turnDist.textContent = Math.max(0, f.L - distance) < 8 ? 'NOW' : fmtDistance(f.L - distance);
      this.arrow.style.transform = `rotate(${Math.abs(deg) < 27 ? 0 : Math.sign(deg) * (Math.abs(deg) < 60 ? 45 : 90)}deg)`;
    }
    if (active) this.roadName.textContent = this.streetAt(i, distance);
    const district = this.world.districtAt(me.x, me.y);
    if (district !== this.psub.textContent) this.psub.textContent = district;
    const duration = this.ctx.duration(), remaining = duration ? Math.max(0, duration - S.t) : 0;
    this.progress.style.width = `${(duration ? clamp(S.t / duration) : 0) * 100}%`;
    const second = Math.floor(S.t);
    if (second !== this.second) {
      this.second = second;
      const now = new Date();
      this.clock.textContent = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
      this.left.textContent = fmtTime(remaining);
      this.arr.textContent = duration ? new Date(Date.now() + remaining * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--';
      this.stops.textContent = this.ctx.lyrics.lines.slice(active ? S.idx + 1 : 0).filter(line => line.text).length;
    }
    this.draw(me, i, distance, direction, S.t);
  }
  draw(me, index, distance, direction, time = 0) {
    const feature = this.mode === 'explore' ? this.world.landmarks[this.landmarkIndex] : null;
    const center = feature ? { x: feature.x, y: feature.y } : me;
    const bearing = feature ? (feature.type === 'wheel' ? 0.09 : -0.34) : this.bearing;
    const camera = mapCamera({ width: this.cw, height: this.ch, center, bearing,
      explore: Boolean(feature), flat: this.flat && !feature,
      // Keep the wheel above its sheet; lift the riverside citadel so its
      // facade and the water can both remain visible on a narrow screen.
      anchor: feature ? (feature.type === 'wheel' ? 0.79 : 0.61) : 0.73 });
    let pathData = null;
    if (this.hasLyrics && !feature) {
      const done = [], ahead = [[me.x, me.y]], stops = [];
      for (let k = Math.max(0, index - 7); k < index; k++) done.push(...this.info(k).pts);
      const f = this.info(index); let cut = 1;
      while (cut < f.cum.length - 1 && f.cum[cut] < distance) cut++;
      done.push(...f.pts.slice(0, cut), [me.x, me.y]);
      ahead.push(...f.pts.slice(cut));
      for (let k = index + 1; k <= Math.min(index + 2, this.lyricCount - 1); k++)
        ahead.push(...this.info(k).pts);
      for (let k = index; k <= Math.min(index + 2, this.lyricCount - 1); k++)
        stops.push(this.info(k).pts.at(-1));
      pathData = { me, done, ahead, stops, bearing, direction, time };
    }
    this.camera = camera;
    this.lastPaint = paintMap(this.g, this.world, camera, { mode: feature ? 'explore' : 'navigate',
      pathData, selected: feature?.type, flat: this.flat && !feature, time, reduced: this.reduced });
  }
}
