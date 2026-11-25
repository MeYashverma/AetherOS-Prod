// Daylight 2.5D rendering for the fictional lyric city. Every roof, park,
// bridge, wheel spoke and citadel tower is drawn from local geometry; there
// are no Apple tiles, photos, 3D models, trademarks or geographic lookups.
const WIDTH = [6, 8, 11, 15];
const GROUND = {
  sidewalk: '#e9ece8', downtown: '#eeeae0', commercial: '#f3f1ea',
  residential: '#f4f3ec', industrial: '#e7e8e3', park: '#bfe3ae',
  school: '#d6e8ba', civic: '#e9e8de', parking: '#e7e9e5', 'rail-yard': '#e4e7e3'
};
const BUILDING = {
  tower: ['#f7f8f5', '#d7dad7', '#e5e6e3'],
  office: ['#f5f4f0', '#d4d7d4', '#e4e5e1'],
  house: ['#f9f7f2', '#dbdbd5', '#eae8e1'],
  warehouse: ['#eeefeb', '#cdd2d0', '#dce0dc'],
  school: ['#f4f2e7', '#d6d8c8', '#e5e5d8'],
  civic: ['#f7f5e9', '#d7d6c6', '#eae8d9']
};
const ROAD = ['#fafbf8', '#fffdf7', '#f8f7f1', '#f5f1e6'];
const POI = {
  park: ['#469457', '✿'], school: ['#9b7952', 'S'], hospital: ['#c86b64', '+'],
  station: ['#4b79b7', 'T'], market: ['#ae784f', 'M'],
  wheel: ['#7066dc', '✦'], citadel: ['#7066dc', '◆'],
  conservatory: ['#438c7f', '❋'], museum: ['#b47855', 'M'], observatory: ['#667dc4', '★']
};
const midpoint = points => points.reduce(([x, y], p) => [x + p[0] / points.length, y + p[1] / points.length], [0, 0]);
function path(g, points, close = false) {
  if (!points.length) return false;
  g.beginPath();
  points.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y));
  if (close) g.closePath();
  return true;
}
function polygon(g, points, color, outline = null, lineWidth = 1) {
  if (points.length < 3 || !path(g, points, true)) return;
  g.fillStyle = color; g.fill();
  if (outline) { g.lineWidth = lineWidth; g.strokeStyle = outline; g.stroke(); }
}
function stroke(g, points, color, width, dash = null) {
  if (points.length < 2 || !path(g, points)) return;
  g.strokeStyle = color; g.lineWidth = width;
  if (dash) g.setLineDash(dash);
  g.stroke();
  if (dash) g.setLineDash([]);
}
function disk(g, x, y, r, color, outline = null, lineWidth = 1) {
  g.beginPath(); g.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2);
  g.fillStyle = color; g.fill();
  if (outline) { g.strokeStyle = outline; g.lineWidth = lineWidth; g.stroke(); }
}
function ellipse(g, x, y, rx, ry, color) {
  g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
  g.fillStyle = color; g.fill();
}
function scaledRect(x, y, w, h) {
  return [[x - w / 2, y - h / 2], [x + w / 2, y - h / 2],
    [x + w / 2, y + h / 2], [x - w / 2, y + h / 2]];
}
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
function building(g, b, cam, flat) {
  const P = cam.project, ground = b.pts.map(p => P(p, b.base || 0));
  const palette = b.kind === 'tower' ? [BUILDING.tower, ['#e4f0f1', '#9ebdc6', '#c1d5da'],
    ['#f1eade', '#c9bba7', '#e0d5c4']][Math.abs(b.id || 0) % 3] : BUILDING[b.kind] || BUILDING.office;
  const [top, dark, pale] = palette;
  const visible = flat ? ground : ground.concat(b.pts.map(p => P(p, b.ht)));
  if (visible.every(p => p[0] < -20) || visible.every(p => p[0] > cam.width + 20) ||
    visible.every(p => p[1] < (cam.contentTop ?? 0) - 20) || visible.every(p => p[1] > (cam.contentBottom ?? cam.height) + 20)) return;
  if (flat) { polygon(g, ground, top, '#ced5d1', 1); return; }
  const roof = b.pts.map(p => P(p, b.ht));
  const depth = cam.depth(midpoint(b.pts)), s = cam.scaleAt(depth);
  polygon(g, ground.map(([x, y]) => [x + Math.min(9, b.ht * s * 0.14), y + Math.min(11, b.ht * s * 0.18)]),
    'rgba(93,114,118,.16)');
  for (let i = 0; i < ground.length; i++) {
    const j = (i + 1) % ground.length, a = ground[i], c = ground[j];
    if (c[0] >= a[0]) continue; // Back faces cannot be seen with a vertically extruded camera.
    const face = [a, c, roof[j], roof[i]];
    const tone = c[0] - a[0] > 0 ? dark : pale;
    polygon(g, face, tone, 'rgba(185,194,190,.42)', Math.max(0.5, s * 0.65));
    // Screen-space LOD: detailed near facades, quiet distant skyline.
    const span = Math.hypot(c[0] - a[0], c[1] - a[1]);
    if (s > .9 && span > 20 && b.ht > 12) {
      const floors = Math.min(9, Math.floor((b.ht - (b.base || 0)) / 5));
      const columns = Math.min(7, Math.max(2, Math.floor(span / 7)));
      for (let floor = 1; floor <= floors; floor++) {
        const t = floor / (floors + 1), l = mix(a, roof[i], t), r = mix(c, roof[j], t);
        for (let col = 0; col < columns; col++) {
          stroke(g, [mix(l, r, (col + .22) / columns), mix(l, r, (col + .72) / columns)],
            b.kind === 'tower' ? '#91b3bd' : '#a0b1b0', Math.max(.65, Math.min(2.1, s * 1.3)));
        }
      }
    }
  }
  polygon(g, roof, top, 'rgba(177,189,185,.72)', Math.max(0.6, s * 0.85));
  if (b.ht > 31 && roof.length >= 4 && s > 0.5) {
    const c = midpoint(roof);
    stroke(g, roof.map(([x, y]) => [c[0] + (x - c[0]) * 0.76, c[1] + (y - c[1]) * 0.76]).concat([
      [c[0] + (roof[0][0] - c[0]) * 0.76, c[1] + (roof[0][1] - c[1]) * 0.76]]),
    'rgba(183,192,189,.6)', Math.max(.6, s * .75));
  }
  if (s > .85 && roof.length === 4) {
    const c = midpoint(roof), variant = Math.abs(b.id || 0) % 5;
    if (b.kind === 'house') {
      const ridgeA = mix(roof[0], roof[3], .5), ridgeB = mix(roof[1], roof[2], .5);
      ridgeA[1] -= 3 * s; ridgeB[1] -= 3 * s;
      polygon(g, [roof[0], roof[1], ridgeB, ridgeA], ['#c2b3a0','#a8b8b4','#c5b6b1'][variant % 3]);
      polygon(g, [ridgeA, ridgeB, roof[2], roof[3]], '#ded5c5');
    } else {
      const inset = roof.map(p => mix(c, p, .54));
      if (variant === 0 || b.kind === 'warehouse') {
        polygon(g, inset, '#7899a4', '#c3d7dc', .7);
        for (let k = 1; k < 4; k++) stroke(g, [mix(inset[0], inset[1], k / 4), mix(inset[3], inset[2], k / 4)], '#c1d1d4', .65);
      } else if (variant === 1) {
        polygon(g, inset, '#b4cf9d');
        disk(g, c[0], c[1], Math.max(1, 2 * s), '#7ea16e');
      } else {
        polygon(g, inset.slice(0, 3).map(p => mix(c, p, .7)), '#c2cdca', '#a2b2b1', .7);
      }
      if (b.kind === 'tower' && variant === 2) {
        stroke(g, [c, [c[0], c[1] - 11 * s]], '#8c9fa2', Math.max(.7, s));
        disk(g, c[0], c[1] - 11 * s, 1.2, '#d89d78');
      }
    }
  }
}
function tree(g, item, cam) {
  const p = item.pts[0], d = cam.depth(p), s = cam.scaleAt(d), [x, y] = cam.project(p);
  if (x < -20 || x > cam.width + 20 || y < -25 || y > cam.height + 25) return;
  const r = Math.max(1.7, item.r * s * .92);
  ellipse(g, x + r * .6, y + r * .65, r * 1.25, r * .42, 'rgba(94,128,95,.13)');
  const top = cam.project(p, item.r * 2.4);
  stroke(g, [[x, y], top], '#81977d', Math.max(.8, s * 1.2));
  disk(g, top[0], top[1], r * 1.1, '#74af71');
  disk(g, top[0] - r * .25, top[1] - r * .32, r * .67, '#a3d599');
}
function wheel(g, feature, cam, time, reduced) {
  const x = feature.x, y = feature.y, R = 49, height = 63;
  const s = cam.scaleAt(cam.depth([x, y])), base = cam.project([x, y]);
  if (s < .20) return;
  ellipse(g, base[0] + 8 * s, base[1] + 5 * s, 50 * s, 15 * s, 'rgba(92,113,116,.22)');
  const axis = t => [x + Math.cos(t) * R * .96, y + Math.cos(t) * R * .26];
  const rim = t => cam.project(axis(t), height + Math.sin(t) * R);
  const hub = cam.project([x, y], height);
  const left = cam.project([x - 27, y + 14]), right = cam.project([x + 27, y + 14]);
  const lback = cam.project([x - 16, y - 15]), rback = cam.project([x + 16, y - 15]);
  stroke(g, [lback, hub, rback], '#9eacae', Math.max(1.5, 4.3 * s));
  stroke(g, [left, hub, right], '#bfc8c7', Math.max(2, 5.7 * s));
  const phase = reduced ? 0 : time * 0.055;
  const points = Array.from({ length: 49 }, (_, i) => rim(i * Math.PI * 2 / 48 + phase));
  points.push(points[0]);
  stroke(g, points, 'rgba(130,146,149,.35)', Math.max(3, 10 * s));
  stroke(g, points, '#dbe1df', Math.max(2, 6 * s));
  stroke(g, points, '#f8faf8', Math.max(1, 1.7 * s));
  for (let i = 0; i < 20; i++) {
    const t = i * Math.PI * 2 / 20 + phase, end = rim(t);
    stroke(g, [hub, end], '#b3c0c0', Math.max(.65, 1.35 * s));
    if (i % 2 === 0 && s > .7) {
      const cabin = cam.project(axis(t), height + Math.sin(t) * R - 4);
      polygon(g, [[cabin[0] - 3.4 * s, cabin[1] - 3 * s], [cabin[0] + 3.4 * s, cabin[1] - 3 * s],
        [cabin[0] + 2.8 * s, cabin[1] + 3 * s], [cabin[0] - 2.8 * s, cabin[1] + 3 * s]],
      '#f8faf8', '#9faeb0', Math.max(.7, s * .8));
    }
  }
  disk(g, hub[0], hub[1], Math.max(2, 4 * s), '#f8faf9', '#9aaeb0', Math.max(.8, s));
}
function citadel(g, feature, cam, flat) {
  const x = feature.x, y = feature.y, P = cam.project;
  const model = (dx, dy, w, h, ht) =>
    building(g, { pts: scaledRect(x + dx, y + dy, w, h), ht, kind: 'civic' }, cam, flat);
  const base = P([x, y]), s = cam.scaleAt(cam.depth([x, y]));
  ellipse(g, base[0] + 8 * s, base[1] + 12 * s, 61 * s, 26 * s, 'rgba(99,118,109,.16)');
  // A small original palace, built as separate 3D wings and an open portico.
  // Its footprint stays inside the reserved civic parcel near the riverbank.
  model(0, 1, 96, 60, 5);
  model(-35, -3, 24, 35, 19);
  model(35, -3, 24, 35, 19);
  model(0, -10, 58, 34, 32);
  model(0, 17, 42, 18, 15);
  const towers = [[-41, -21, 39], [41, -21, 46], [-41, 22, 32], [41, 22, 36]];
  for (const [dx, dy, ht] of towers) model(dx, dy, 17, 17, ht);
  if (flat) return;
  const rear = [[x - 29, y - 27], [x + 29, y - 27]].map(p => P(p, 32));
  const front = [[x - 29, y + 7], [x + 29, y + 7]].map(p => P(p, 32));
  const ridge = [[x - 29, y - 10], [x + 29, y - 10]].map(p => P(p, 42));
  polygon(g, [rear[0], rear[1], ridge[1], ridge[0]], '#e1e2d8', '#bdc4bd', s * .7);
  polygon(g, [ridge[0], ridge[1], front[1], front[0]], '#f4f3e9', '#bfc9c3', s * .8);
  stroke(g, ridge, '#fdfdf6', Math.max(1, s * 1.3));
  // Tall, slender windows and colonnade distinguish this from nearby offices.
  for (const dx of [-20, -10, 10, 20]) {
    stroke(g, [P([x + dx, y + 7], 21), P([x + dx, y + 7], 27)], '#a8b8b6', Math.max(1, s * 1.3));
  }
  for (const dx of [-15, -7, 7, 15]) {
    stroke(g, [P([x + dx, y + 26], 5), P([x + dx, y + 26], 14)], '#aebcb8', Math.max(1, s * 1.5));
  }
  for (const [dx, dy, ht] of towers) {
    const corners = scaledRect(x + dx, y + dy, 19, 19);
    const cap = corners.map(p => P(p, ht + 2));
    polygon(g, cap, '#f8f8f0', '#b5c0bc', Math.max(.7, s));
    if (ht > 35) {
      const tip = P([x + dx, y + dy], ht + 11);
      stroke(g, [P([x + dx, y + dy], ht + 2), tip], '#98aaa9', Math.max(1, s * 1.1));
    }
  }
}
// Original destination architecture, all contained in compact reserved grounds.
function attraction(g, feature, cam, flat) {
  const { x, y, type } = feature, P = cam.project;
  const s = cam.scaleAt(cam.depth([x, y]));
  const model = (dx, dy, w, d, ht, kind = 'civic') => building(g,
    { pts: scaledRect(x + dx, y + dy, w, d), ht, kind, id: 3 }, cam, flat);
  const ring = (rx, ry, z = 0) => Array.from({ length: 33 }, (_, i) => {
    const t = i * Math.PI / 16;
    return P([x + Math.cos(t) * rx, y + Math.sin(t) * ry], z);
  });
  polygon(g, ring(49, 38), '#e6e1d2', '#f9faf1', 2);
  if (type === 'conservatory') {
    model(-30, 0, 22, 40, 13); model(30, 0, 22, 40, 13);
    model(0, 0, 40, 55, 10);
    if (!flat) {
      const arch = (dy, offset = 0) => Array.from({ length: 17 }, (_, i) => {
        const t = i * Math.PI / 16;
        return P([x + Math.cos(t) * 21, y + dy], 10 + Math.sin(t) * 27 + offset);
      });
      polygon(g, [...arch(-27), ...arch(27).reverse()], '#a4cfd0', '#7aaba9', 1);
      for (let dy = -27; dy <= 27; dy += 9) stroke(g, arch(dy), '#e1f1e6', Math.max(.7, s));
      for (let i = 0; i <= 8; i++) {
        const t = i * Math.PI / 8, dx = Math.cos(t) * 21, z = 10 + Math.sin(t) * 27;
        stroke(g, [P([x + dx, y - 27], z), P([x + dx, y + 27], z)], '#d3e8dd', Math.max(.7, s * .8));
      }
    }
  } else if (type === 'museum') {
    model(-25, -5, 27, 56, 22); model(19, -15, 47, 27, 31);
    model(8, 23, 61, 17, 12);
    for (let dx = -16; dx <= 16; dx += 8) {
      stroke(g, [P([x + dx, y + 3]), P([x + dx, y + 3], flat ? 0 : 19)], '#b29279', Math.max(1, 2 * s));
    }
    const sculpture = [[x - 8, y + 3], [x, y + 10], [x + 8, y + 3], [x, y - 4]];
    polygon(g, sculpture.map((p, j) => P(p, flat ? 0 : j % 2 ? 15 : 26)), '#cf976f', '#ad7859', 1);
  } else {
    model(0, -7, 55, 44, 19); model(-32, 10, 13, 32, 11);
    if (!flat) {
      // Layered projected latitude rings make a true domed silhouette.
      for (let j = 0; j <= 14; j++) {
        const t = j / 14 * Math.PI / 2, r = Math.cos(t) * 23;
        polygon(g, ring(r, r, 19 + Math.sin(t) * 25), j % 3 ? '#b7cbd7' : '#dce6eb', '#9bafb9', .55);
      }
      stroke(g, [P([x, y - 20], 30), P([x, y], 44), P([x, y + 20], 30)], '#718d9f', Math.max(1, 2 * s));
    }
    polygon(g, scaledRect(x + 9, y + 28, 44, 9).map(p => P(p)), '#9acfd4', '#f9faf0', 2);
  }
  // Approach steps and planted forecourt.
  for (let k = 0; k < 3; k++) stroke(g, [P([x - 17, y + 35 + k * 2]), P([x + 17, y + 35 + k * 2])], '#c7c4b7', Math.max(.6, s));
}
function roads(g, list, cam, bridge) {
  for (let cls = 0; cls < 4; cls++) for (const road of list) {
    if (road.c !== cls || Boolean(road.bridge) !== bridge) continue;
    const pts = road.pts.map(p => cam.project(p));
    const s = cam.scaleAt(cam.depth(road.pts[road.pts.length >> 1]));
    const w = Math.max(1, WIDTH[cls] * s), extra = bridge ? 5 : 3;
    stroke(g, pts, bridge ? '#cad8d7' : '#d5dad6', w + extra * s);
    stroke(g, pts, bridge ? '#fbfdf9' : ROAD[cls], w);
    if (cls >= 2) stroke(g, pts, 'rgba(198,199,184,.8)', Math.max(.65, 1.05 * s), [5 * s, 7 * s]);
  }
}
function labels(g, Q, cam, { explore, route, selected }) {
  const { width: w, height: h } = cam;
  const occupied = [], top = h * (explore ? .14 : .31), bottom = h * (explore ? .77 : .85);
  const reserve = (x, y, rx, ry = 12) => {
    if (x - rx < 12 || x + rx > w - 12 || y - ry < top || y + ry > bottom ||
      occupied.some(b => Math.abs(x - b.x) < rx + b.rx && Math.abs(y - b.y) < ry + b.ry)) return false;
    occupied.push({ x, y, rx, ry }); return true;
  };
  const text = (value, x, y, font, fill, outline = 'rgba(255,255,255,.96)') => {
    g.font = font; g.strokeStyle = outline; g.lineWidth = 3.4;
    g.strokeText(value, x, y); g.fillStyle = fill; g.fillText(value, x, y);
  };
  const nearRoute = ([x, y]) => route?.ahead?.some((b, j) => {
    if (!j) return false;
    const a = route.ahead[j - 1], dx = b[0] - a[0], dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / Math.max(1, dx * dx + dy * dy)));
    return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy) < 16;
  });
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const named = Q.roads.filter(r => r.name && r.pts.length >= 2).sort((a, b) => b.c - a.c);
  const seen = new Set(); let count = 0;
  for (const road of named) {
    if (seen.has(road.name) || count >= 11) continue;
    const pts = road.pts.map(p => cam.project(p)), i = pts.length >> 1;
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const x = (a[0] + b[0]) / 2, y = (a[1] + b[1]) / 2;
    if (Q.landmarks.some(f => {
      const p = cam.project([f.x, f.y]);
      return Math.abs(x - p[0]) < 58 * cam.zoom && y > p[1] - 100 * cam.zoom && y < p[1] + 38 * cam.zoom;
    })) continue;
    let angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const size = road.c >= 2 ? 11 : 9.5;
    g.font = `600 ${size}px system-ui`;
    const length = g.measureText(road.name).width;
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < Math.max(36, length * .7) ||
      nearRoute([x, y]) || !reserve(x, y, length / 2 + 5, 10)) continue;
    if (angle > Math.PI / 2 || angle < -Math.PI / 2) angle += Math.PI;
    g.save(); g.translate(x, y); g.rotate(angle);
    text(road.name, 0, 0, g.font, road.c >= 2 ? '#636965' : '#7c8580');
    g.restore(); seen.add(road.name); count++;
  }
  for (const poi of Q.pois.filter(p => POI[p.type])) {
    if (explore && poi.type === selected) {
      const [px, py] = cam.project([poi.x, poi.y], poi.type === 'wheel' ? 78 : 67);
      const x = poi.type === 'wheel' ? Math.min(w - 32, px + 79) : px, y = py - 10;
      disk(g, x + 1, y + 3, 20, 'rgba(88,73,156,.16)');
      disk(g, x, y, 18, '#7066dc', '#fff', 2);
      text(POI[poi.type][1], x, y, '700 16px system-ui', '#fff', '#7066dc');
      text(poi.name, x, y + 28, '650 10px system-ui', '#333942');
      continue;
    }
    const pos = cam.project([poi.x, poi.y], poi.type === 'wheel' ? 25 : 0);
    const [x, y] = pos, [color, symbol] = POI[poi.type];
    const special = Q.landmarks.some(f => f.type === poi.type);
    g.font = `600 ${special ? 10 : 9}px system-ui`;
    const labelWidth = Math.min(77, g.measureText(poi.name).width / 2 + 8);
    if (!reserve(x, y + 15, labelWidth, 18) || nearRoute(pos) && !special) continue;
    disk(g, x, y, special ? 12 : 8, special ? color : '#fff',
      special ? '#fff' : color, special ? 2 : 1.5);
    text(symbol, x, y + .2, `700 ${special ? 12 : 10}px system-ui`, special ? '#fff' : color,
      special ? color : '#fff');
    text(poi.name.slice(0, 22), x, y + 18, '600 9.5px system-ui', '#323c3d');
  }
}
function route(g, cam, pathData, reduced) {
  const P = cam.project, ahead = pathData.ahead.map(p => P(p, 1.6));
  const done = pathData.done.map(p => P(p, 1.1));
  const [x, y] = P([pathData.me.x, pathData.me.y], 1.6);
  if (done.length > 1) stroke(g, done, 'rgba(70,150,232,.43)', Math.max(2.5, 4.5 * cam.zoom));
  if (ahead.length > 1) {
    stroke(g, ahead, 'rgba(79,110,141,.22)', Math.max(8, 18 * cam.zoom));
    stroke(g, ahead, '#fff', Math.max(7, 12 * cam.zoom));
    stroke(g, ahead, '#1677ef', Math.max(5, 8 * cam.zoom));
    stroke(g, ahead, '#68bcff', Math.max(1, 2 * cam.zoom));
  }
  for (const [i, stop] of pathData.stops.entries()) {
    const [sx, sy] = P(stop, 2);
    if (sx < 15 || sx > cam.width - 15 || sy < cam.height * .27 || sy > cam.height - 115 ||
      Math.hypot(sx - x, sy - y) < 20) continue;
    disk(g, sx, sy, i ? 5 : 7, '#fff', '#1677ef', 2);
    disk(g, sx, sy, 2, '#1677ef');
  }
  // Current lyric position: an unmistakable blue navigation puck and arrow.
  disk(g, x, y, 20 + (reduced ? 0 : Math.sin(pathData.time * 2.5) * 1.3), 'rgba(22,119,239,.15)');
  disk(g, x, y, 11, '#1677ef', '#fff', 2.5);
  g.save(); g.translate(x, y);
  g.rotate(pathData.bearing + pathData.direction + Math.PI / 2);
  polygon(g, [[0, -8], [5.4, 6.2], [0, 3], [-5.4, 6.2]], '#fff');
  g.restore();
  return { done, ahead };
}

export function paintMap(g, world, cam, { mode = 'navigate', pathData = null, selected = null,
  time = 0, reduced = false, flat = false } = {}) {
  const Q = world.query(cam.bounds()), { width: w, height: h } = cam;
  g.lineJoin = 'round'; g.lineCap = 'round';
  const backdrop = g.createLinearGradient(0, 0, 0, h);
  backdrop.addColorStop(0, '#e5eceb'); backdrop.addColorStop(.65, '#eef1ef'); backdrop.addColorStop(1, '#f2f3ef');
  g.fillStyle = backdrop; g.fillRect(0, 0, w, h);
  for (const area of Q.areas) polygon(g, area.pts.map(p => cam.project(p)),
    GROUND[area.kind] || GROUND.residential, area.kind === 'park' ? '#b4d5a6' : 'rgba(210,220,214,.55)', .75);
  for (const water of Q.water) {
    const fill = g.createLinearGradient(0, h * .15, 0, h * .8);
    fill.addColorStop(0, '#a4e2ef'); fill.addColorStop(1, '#83d3ee');
    polygon(g, water.pts.map(p => cam.project(p)), fill, '#f5faf9', 2);
  }
  for (const rail of Q.rails) {
    const pts = rail.pts.map(p => cam.project(p));
    stroke(g, pts, '#c2c8c6', 4 * cam.zoom);
    stroke(g, pts, '#f9faf7', 1.3 * cam.zoom, [3 * cam.zoom, 6 * cam.zoom]);
  }
  for (const walkway of Q.paths) {
    const c = walkway.kind === 'riverwalk' ? '#f5f9f7' : walkway.kind === 'park' ? '#f1f3dc' : '#d8dfd9';
    stroke(g, walkway.pts.map(p => cam.project(p)), c, Math.max(.8, 1.7 * cam.zoom),
      walkway.kind === 'riverwalk' ? [4, 5] : null);
  }
  roads(g, Q.roads, cam, false);
  roads(g, Q.roads, cam, true);
  // Painter's order by ground depth lets nearer roofs occlude more distant
  // ones without WebGL, remote meshes or a blocking image-download phase.
  const features = [
    ...Q.bld.map(item => ({ item, type: 'building', v: cam.depth(midpoint(item.pts)) })),
    ...Q.landmarks.map(item => ({ item, type: item.type, v: cam.depth([item.x, item.y]) })),
    ...Q.trees.map(item => ({ item, type: 'tree', v: cam.depth(item.pts[0]) }))
  ].sort((a, b) => a.v - b.v);
  for (const f of features) {
    if (f.type === 'building') {
      building(g, f.item, cam, flat);
      if (!flat && f.item.kind === 'tower' && Math.abs(f.item.id) % 4 === 0) {
        const c = midpoint(f.item.pts);
        building(g, { ...f.item, pts: f.item.pts.map(p => mix(c, p, .62)), base: f.item.ht, ht: f.item.ht + 13 }, cam, flat);
      }
    }
    else if (f.type === 'tree') tree(g, f.item, cam);
    else if (f.type === 'wheel') wheel(g, f.item, cam, time, reduced);
    else if (f.type === 'citadel') citadel(g, f.item, cam, flat);
    else attraction(g, f.item, cam, flat);
  }
  let projected = null;
  if (mode === 'navigate' && pathData) projected = route(g, cam, pathData, reduced);
  labels(g, Q, cam, { explore: mode === 'explore', route: projected, selected });
  return { buildings: Q.bld.length, landmarks: Q.landmarks.map(item => item.type), roads: Q.roads.length };
}
