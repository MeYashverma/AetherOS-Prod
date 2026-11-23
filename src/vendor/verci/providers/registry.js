// Provider registry, unified search, de-duplication, and cross-provider resolution of a playable source.
import { itunes } from './itunes.js';
import { musickit } from './musickit.js';
import { audius } from './audius.js';
import { jamendo } from './jamendo.js';
import { youtube } from './youtube.js';
import { cleanText, relevant } from '../match.js';
import { rankFull, isConfident } from '../rank.js';
import { ytEmbeddable } from '../services.js';

export const providers = [musickit, itunes, audius, jamendo, youtube];
export const byId = id => providers.find(p => p.id === id);
const IDENT = { musickit: 0, itunes: 1, audius: 2, jamendo: 3, youtube: 4 }; // who names the song best

const norm = s => cleanText(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const primary = a => norm(a).split(/\s(?:feat|ft|x|and|with)\s|,|&/)[0].trim();
const sameRecording = (a, b) => norm(a.title) === norm(b.title) && primary(a.artist) === primary(b.artist)
  && a.versions.join() === b.versions.join() && (!a.durationMs || !b.durationMs || Math.abs(a.durationMs - b.durationMs) <= 8000);

// Merge the same recording found by several providers into one row.
export function groupTracks(tracks) {
  const groups = [];
  for (const t of tracks) {
    let g = groups.find(x => sameRecording(x.identity, t));
    if (!g) { g = { id: t.key, identity: t, tracks: [] }; groups.push(g); }
    g.tracks.push(t);
    if ((IDENT[t.provider] ?? 9) < (IDENT[g.identity.provider] ?? 9)) g.identity = t;
  }
  for (const g of groups) { g.playables = g.tracks.filter(t => t.playback.capability === 'full'); g.providers = [...new Set(g.tracks.map(t => t.provider))]; }
  return groups;
}

export async function searchAll(q) {
  const active = providers.filter(p => p.enabled()), errors = {}, tracks = [];
  const keep = (p, t) => !p.plays || p.id === 'musickit' || relevant(q, t); // fuzzy playable-only hits must resemble the query
  await Promise.all(active.map(p => p.search(q).then(r => tracks.push(...r.filter(t => keep(p, t)).map(t => ({ ...t, _o: IDENT[p.id] })))).catch(e => { errors[p.id] = e.message; })));
  tracks.sort((a, b) => a._o - b._o);
  return { groups: groupTracks(tracks), errors, skipped: providers.filter(p => !p.enabled()).map(p => p.id) };
}

// Find the best full-length source for a wanted recording. Candidates from every playing provider are ranked on
// title, artist, duration and version markers. YouTube candidates are then probed with the official oEmbed endpoint:
// a video whose owner disabled embedding is pushed down so a playable upload (often the "Topic"/audio one) wins.
export async function resolveFull(want, known = [], { embeddable = ytEmbeddable } = {}) {
  const q = `${cleanText(want.artist)} ${cleanText(want.title)}`.trim(), cands = [];
  const add = t => t.playback.capability === 'full' && cands.push({ id: t.key, title: t.raw || t.title, artist: t.artist, channel: t.channel || t.artist, durationMs: t.durationMs, track: t });
  known.forEach(add);
  const errors = {};
  await Promise.all(providers.filter(p => p.plays && p.enabled() && !known.some(k => k.provider === p.id)).map(p => p.search(q).then(r => r.forEach(add)).catch(e => { errors[p.id] = e.message; })));
  let r = rankFull({ ...want, title: want.title, artist: want.artist }, cands);
  const seen = new Set(); r.ranked = r.ranked.filter(c => !seen.has(c.id) && seen.add(c.id));
  const yt = r.ranked.filter(c => c.track.provider === 'youtube' && c.ts >= 0.6).slice(0, 8);
  await Promise.all(yt.map(async c => { c.embed = await embeddable(c.track.videoId); if (c.embed === false) c.score -= 6; else if (c.embed === true) c.score += 0.3; }));
  r.ranked.sort((a, b) => b.score - a.score); r.best = r.ranked[0] || null; r.confident = isConfident(want, r.best);
  r.blocked = yt.filter(c => c.embed === false).length;
  return { ...r, errors, needsAuth: providers.some(p => p.id === 'musickit' && p.enabled() && !p.authorized) };
}
