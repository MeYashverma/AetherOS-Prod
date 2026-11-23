// TTML/Apple lyric agent metadata → the shared Verci timeline. No singer inference.
import { tokenize } from './lrc.js';
const attr = (el, name) => [...el.attributes].find(a => a.localName === name)?.value || '';
const nodes = (el, name) => [...el.getElementsByTagName('*')].filter(n => n.localName === name);
export function ttmlTime(value, frameRate = 30) {
  if (!value) return NaN;
  const unit = /^(\d+(?:\.\d+)?)(h|m|s|ms|f)$/.exec(value);
  if (unit) return +unit[1] * ({ h: 3600, m: 60, s: 1, ms: .001, f: 1 / frameRate }[unit[2]]);
  const p = value.split(':').map(Number);
  if (p.some(n => !Number.isFinite(n))) return NaN;
  if (p.length === 4) return p[0]*3600+p[1]*60+p[2]+p[3]/frameRate;
  if (p.length === 3) return p[0]*3600+p[1]*60+p[2];
  if (p.length === 2) return p[0]*60+p[1];
  return NaN;
}
export function parseTTML(src) {
  if (/<!DOCTYPE|<!ENTITY/i.test(src)) throw Error('TTML document declarations are not supported.');
  const doc = new DOMParser().parseFromString(src, 'application/xml');
  if (nodes(doc, 'parsererror').length || doc.documentElement.localName !== 'tt') throw Error('Invalid TTML file.');
  const rate = Number(attr(doc.documentElement, 'frameRate')) || 30;
  const time = s => ttmlTime(s, rate);
  const agents = new Map();
  for (const agent of nodes(doc, 'agent')) {
    const id = attr(agent, 'id');
    if (id) agents.set(id, nodes(agent, 'name')[0]?.textContent.trim() || `Voice ${agents.size + 1}`);
  }
  const speakers = [], ids = [];
  function speaker(id) {
    if (!id) return -1;
    // Joint agent references stay a distinct participant, not an invented soloist.
    if (!ids.includes(id)) { ids.push(id); speakers.push(id.split(/\s+/).map(k => agents.get(k) || `Voice ${ids.length}`).join(' + ')); }
    return ids.indexOf(id);
  }
  const excluded = el => /translation|roman|x-bg/.test(attr(el, 'role'));
  function text(el) {
    if (el.nodeType === 3) return el.textContent;
    if (el.nodeType !== 1 || excluded(el)) return '';
    if (el.localName === 'br') return ' ';
    return [...el.childNodes].map(text).join('');
  }
  const lines = [];
  for (const p of nodes(doc, 'p')) {
    const t = time(attr(p, 'begin'));
    if (!Number.isFinite(t)) continue;
    let end = time(attr(p, 'end'));
    if (!Number.isFinite(end)) end = t + time(attr(p, 'dur'));
    const words = nodes(p, 'span').filter(s => {
      let parent = s; while (parent && parent !== p) { if (excluded(parent)) return false; parent = parent.parentElement; }
      return attr(s, 'begin') && !nodes(s, 'span').some(n => attr(n, 'begin'));
    }).map(s => {
      const t0 = time(attr(s, 'begin')); let t1 = time(attr(s, 'end'));
      if (!Number.isFinite(t1)) t1 = t0 + time(attr(s, 'dur'));
      return { text: text(s).trim(), t0, t1, estimated: false };
    }).filter(w => w.text && Number.isFinite(w.t0));
    lines.push({ t, end, text: text(p).replace(/\s+/g, ' ').trim(), tokens: words, speaker: speaker(attr(p, 'agent') || attr(p.parentElement, 'agent')) });
  }
  lines.sort((a,b) => a.t-b.t);
  for (let i=0;i<lines.length;i++) {
    const l=lines[i]; if (!Number.isFinite(l.end) || l.end < l.t) l.end=lines[i+1]?.t ?? l.t+4;
    if (!l.tokens.length) l.tokens=tokenize(l, { t:l.end });
    l.tokens.forEach((w,j) => { if (!Number.isFinite(w.t1) || w.t1<w.t0) w.t1=l.tokens[j+1]?.t0 ?? l.end; });
  }
  const flat=lines.flatMap((l,li) => l.tokens.map((w,wi) => ({...w,li,wi})));
  const coverage=flat.length ? flat.filter(w=>!w.estimated).length/flat.length : 0;
  return { lines, flat, speakers, synced:true, wordLevel:coverage>=.8, wordCoverage:coverage, format:'TTML', speakerSource: speakers.length ? 'TTML agents' : null };
}
