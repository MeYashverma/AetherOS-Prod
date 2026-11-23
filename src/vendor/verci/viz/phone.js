import { $, Viz } from './core.js';

export class Phone extends Viz {
  init() {
    this.wrap = $('div', 'phone-wrap'); this.ph = $('div', 'phone ' + this.pcls);
    this.wrap.append(this.ph); this.el.append(this.wrap); this.build();
  }
  art() { return this.ctx.song.artwork ? `url('${this.ctx.song.artwork.replace(/'/g, '%27')}')` : 'none'; }
  full(el) { el.querySelectorAll('.w').forEach(s => { s.dataset.s = 2; s._s = 2; }); }
}
