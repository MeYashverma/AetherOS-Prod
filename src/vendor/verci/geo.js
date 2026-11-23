// "Where is the artist from?" -> a real map of that place, from open data.
//   MusicBrainz  artist -> hometown (begin-area) and country
//   Nominatim    place name -> latitude/longitude
//   Overpass     OpenStreetMap roads, buildings, water, parks, rails, points of interest around that point
// All three are free, keyless and public; they are shared community services, so results are cached and every map
// shows "© OpenStreetMap contributors". None of this was reachable from the build sandbox: it is tested with
// fixtures only (pure parsing / routing logic is unit-tested), not against the live services.
import { rnd } from './viz/core.js';

const norm = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
export const primaryArtist = a => String(a || '').split(/\s+(?:feat\.?|ft\.?|featuring|with|x|&|and)\s+|,|\s\/\s/i)[0].trim();

// MusicBrainz search result -> { place, country, label } or null (pure, tested)
export function pickHometown(json, name) {
  const want = norm(primaryArtist(name));
  const a = (json?.artists || []).find(x => (x.score ?? 0) >= 85 && norm(x.name) === want) || (json?.artists || []).find(x => (x.score ?? 0) >= 95 && (x['begin-area'] || x.area));
  if (!a) return null;
  const city = a['begin-area']?.name || null, area = a.area?.name || null, areaIsCountry = !!a.area?.['iso-3166-1-codes'];
  const place = city || area; if (!place) return null; const country = city && areaIsCountry ? area : '';
  return { place, country, label: country ? `${place}, ${country}` : place, mbid: a.id };
}

async function getJson(fetchImpl, url, opts, ms = 12000) {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), ms);
  try { const r = await fetchImpl(url, { ...opts, signal: ac.signal, headers: { Accept: 'application/json', ...(opts?.headers || {}) } }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); } finally { clearTimeout(t); }
}
const lsGet = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export async function hometown(artist, fetchImpl = (u, o) => fetch(u, o)) {
  const key = 'verci.home.' + norm(primaryArtist(artist)), c = lsGet(key); if (c && Date.now() - c.at < 30 * 864e5) return c.v;
  const mb = await getJson(fetchImpl, `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent('artist:"' + primaryArtist(artist) + '"')}&fmt=json&limit=5`);
  const h = pickHometown(mb, artist); if (!h) { lsSet(key, { at: Date.now(), v: null }); return null; }
  const geo = await getJson(fetchImpl, `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(h.label)}`);
  const v = geo?.[0] ? { ...h, lat: +geo[0].lat, lon: +geo[0].lon } : null; lsSet(key, { at: Date.now(), v }); return v;
}

export const osmQuery = (lat, lon, R = 1100, Rb = 650) => `[out:json][timeout:25];
(way["highway"](around:${R},${lat},${lon}););out geom 2600;
(way["building"](around:${Rb},${lat},${lon}););out geom 3200;
(way["natural"="water"](around:${R},${lat},${lon});way["waterway"~"river|stream|canal"](around:${R},${lat},${lon});way["leisure"~"park|garden|pitch|playground"](around:${R},${lat},${lon});way["landuse"~"grass|forest|recreation_ground|cemetery"](around:${R},${lat},${lon});way["natural"="wood"](around:${R},${lat},${lon});way["railway"~"^(rail|light_rail)$"](around:${R},${lat},${lon}););out geom 900;
(node["amenity"~"school|hospital|place_of_worship|university|library"](around:${R},${lat},${lon});way["amenity"~"school|hospital|parking|university"](around:${R},${lat},${lon});node["railway"="station"](around:${R},${lat},${lon}););out center 320;`;
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
export async function fetchOsm(lat, lon, fetchImpl = (u, o) => fetch(u, o)) {
  const key = `https://verci.local/osm/${lat.toFixed(3)},${lon.toFixed(3)}`;
  try { const c = await caches.open('verci-osm'), hit = await c.match(key); if (hit) return await hit.json(); } catch {}
  let err; for (const ep of OVERPASS) { try {
    const j = await getJson(fetchImpl, ep, { method: 'POST', body: 'data=' + encodeURIComponent(osmQuery(lat, lon)), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, 28000);
    if (!j.elements?.length) throw new Error('no map data here');
    try { const c = await caches.open('verci-osm'); await c.put(key, new Response(JSON.stringify(j))); } catch {}
    return j; } catch (e) { err = e; } }
  throw err;
}

// ---------- OSM -> a drawable, routable city ----------
const CLS = { motorway: 3, trunk: 3, primary: 2, secondary: 2, tertiary: 1, unclassified: 1, motorway_link: 2, trunk_link: 2, primary_link: 1, secondary_link: 1, tertiary_link: 0, residential: 0, living_street: 0, service: 0 };
const WALK = new Set(['footway', 'path', 'cycleway', 'pedestrian', 'steps', 'track', 'bridleway']);
const DRIVE = new Set(['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'living_street', 'primary_link', 'secondary_link', 'tertiary_link']);
export const toLocal = (lat, lon, lat0, lon0) => [(lon - lon0) * 111320 * Math.cos(lat0 * Math.PI / 180), -(lat - lat0) * 110540];
const bboxOf = pts => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const [x, y] of pts) { if (x < a) a = x; if (y < b) b = y; if (x > c) c = x; if (y > d) d = y; } return [a, b, c, d]; };

export class City {
  constructor(json, lat0, lon0, label = '') {
    this.label = label; this.attrib = '© OpenStreetMap contributors'; this.cell = 250; this.grid = new Map(); this.roads = []; this.nodes = new Map(); this.segs = []; this.pois = [];
    const P = g => g.map(p => toLocal(p.lat, p.lon, lat0, lon0)), add = (kind, item) => { const [a, b, c, d] = item.bb; for (let cx = Math.floor(a / this.cell); cx <= Math.floor(c / this.cell); cx++) for (let cy = Math.floor(b / this.cell); cy <= Math.floor(d / this.cell); cy++) { const k = cx + ',' + cy; let e = this.grid.get(k); if (!e) this.grid.set(k, e = { road: [], bld: [], area: [], water: [], wline: [], rail: [], poi: [] }); e[kind].push(item); } };
    let id = 0;
    for (const e of json.elements || []) {
      const t = e.tags || {};
      if (e.type === 'way' && e.geometry?.length > 1) {
        const pts = P(e.geometry), bb = bboxOf(pts), base = { id: id++, pts, bb, name: t.name || '' };
        if (t.highway) { const walk = WALK.has(t.highway), c = walk ? -1 : (CLS[t.highway] ?? 0), road = { ...base, c, ref: t.ref || '', bridge: t.bridge && t.bridge !== 'no', tunnel: !!t.tunnel, drive: DRIVE.has(t.highway), nodes: e.nodes || [] }; this.roads.push(road); add('road', road);
          if (road.drive && e.nodes) for (let k = 0; k < e.nodes.length; k++) { const n = this.node(e.nodes[k], pts[k]); if (k) { this.link(e.nodes[k - 1], e.nodes[k]); } } }
        else if (t.building) add('bld', { ...base, ht: this.height(t, base.id), kind: /commercial|office|retail|apartments|hotel/.test(t.building) ? 'office' : /industrial|warehouse|garage/.test(t.building) ? 'wh' : /school|hospital|church|university|public/.test(t.building) ? 'inst' : 'house' });
        else if (t.natural === 'water' || t.landuse === 'reservoir') add('water', base);
        else if (t.waterway) add('wline', { ...base, w: t.waterway === 'river' ? 26 : t.waterway === 'canal' ? 16 : 6 });
        else if (t.railway) add('rail', base);
        else if (t.leisure || t.landuse || t.natural === 'wood') add('area', { ...base, fill: /cemetery/.test(t.landuse || '') ? '#1d2d27' : t.leisure === 'pitch' ? '#1f4a35' : '#173629' });
        else if (t.amenity === 'parking') add('area', { ...base, fill: '#262b37' });
        if (e.center && t.amenity) this.pushPoi(e, t, toLocal(e.center.lat, e.center.lon, lat0, lon0));
      } else if (e.type === 'node' && t.name) this.pushPoi(e, t, toLocal(e.lat, e.lon, lat0, lon0));
      else if ((e.type === 'way' || e.type === 'relation') && e.center && t.name) this.pushPoi(e, t, toLocal(e.center.lat, e.center.lon, lat0, lon0));
    }
    this.start = this.pickStart();
  }
  height(t, id) { const h = parseFloat(t.height), lv = parseFloat(t['building:levels']); const m = isFinite(h) ? h : isFinite(lv) ? lv * 3.2 : 6 + rnd(id, 1, 5) * 7; return Math.max(5, Math.min(95, m * 1.1)); }
  node(id, p) { let n = this.nodes.get(id); if (!n) this.nodes.set(id, n = { id, x: p[0], y: p[1], nb: new Set() }); return n; }
  link(a, b) { const A = this.nodes.get(a), B = this.nodes.get(b); if (A && B && a !== b) { A.nb.add(b); B.nb.add(a); } }
  pushPoi(e, t, [x, y]) {
    const a = t.amenity, type = /school|university|library/.test(a || '') ? 'school' : a === 'hospital' ? 'hospital' : a === 'parking' ? 'parking' : a === 'place_of_worship' ? 'church' : t.railway === 'station' ? 'station' : t.shop === 'mall' ? 'mall' : null;
    if (!type || (!t.name && type !== 'parking')) return; const poi = { x, y, type, name: t.name || 'Parking', bb: [x, y, x, y] };
    this.add2(poi);
  }
  add2(poi) { const k = Math.floor(poi.x / this.cell) + ',' + Math.floor(poi.y / this.cell); let e = this.grid.get(k); if (!e) this.grid.set(k, e = { road: [], bld: [], area: [], water: [], wline: [], rail: [], poi: [] }); e.poi.push(poi); this.pois.push(poi); }
  pickStart() { let best = null, bd = 1e12; for (const n of this.nodes.values()) { if (n.nb.size < 2) continue; const d = Math.hypot(n.x, n.y) - (n.nb.size >= 3 ? 40 : 0); if (d < bd) { bd = d; best = n; } } return best || { id: 0, x: 0, y: 0, nb: new Set() }; }
  query(b) {
    const out = { roads: [], bld: [], areas: [], water: [], wlines: [], rails: [], pois: [], trees: [] }, seen = new Set(), map = { road: 'roads', bld: 'bld', area: 'areas', water: 'water', wline: 'wlines', rail: 'rails', poi: 'pois' };
    for (let cx = Math.floor(b[0] / this.cell); cx <= Math.floor(b[2] / this.cell); cx++) for (let cy = Math.floor(b[1] / this.cell); cy <= Math.floor(b[3] / this.cell); cy++) {
      const e = this.grid.get(cx + ',' + cy); if (!e) continue;
      for (const k in map) for (const it of e[k]) { if (seen.has(it)) continue; seen.add(it); if (it.bb[2] < b[0] || it.bb[0] > b[2] || it.bb[3] < b[1] || it.bb[1] > b[3]) continue; out[map[k]].push(it); }
    }
    return out;
  }
  // route: lyric line k follows real streets from the end of line k-1 to the next junction (or ~220 m)
  seg(k) {
    while (this.segs.length <= k) {
      const n0 = this.segs.length, last = this.segs[n0 - 1], cur = last ? last.end : this.start, prev = last ? last.prev : null; let node = cur, from = prev, pts = [[node.x, node.y]], len = 0, dirx = last ? last.dir[0] : 0, diry = last ? last.dir[1] : -1, steps = 0;
      while (steps++ < 60) {
        const opts = [...node.nb].map(i => this.nodes.get(i)).filter(Boolean); if (!opts.length) break;
        const fwd = opts.filter(o => o.id !== from?.id), pool = fwd.length ? fwd : opts; let best = null, bs = -9;
        for (const o of pool) { const dx = o.x - node.x, dy = o.y - node.y, l = Math.hypot(dx, dy) || 1, s = (dx * dirx + dy * diry) / l + rnd(n0, node.id % 977, 7) * 0.7 * (pool.length > 1 ? 1 : 0); if (s > bs) { bs = s; best = o; } }
        const dx = best.x - node.x, dy = best.y - node.y, l = Math.hypot(dx, dy); if (l > 0.5) { dirx = dx / l; diry = dy / l; } len += l; from = node; node = best; pts.push([node.x, node.y]);
        if ((node.nb.size >= 3 && len >= 45) || len >= 220) break;
      }
      if (pts.length < 2) pts.push([pts[0][0] + dirx * 20, pts[0][1] + diry * 20]);
      this.segs.push({ pts, end: node, prev: from, dir: [dirx, diry] });
    }
    return this.segs[k].pts;
  }
}
