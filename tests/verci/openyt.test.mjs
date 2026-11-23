import assert from 'node:assert/strict';
import { normalizePiped, normalizeInvidious, openYouTubeSearch } from '../../src/vendor/verci/providers/openyt.js';
let n = 0; const t = async (m, f) => { await f(); n++; console.log('ok -', m); };
const mem = () => { const m = {}; return { get: k => m[k], set: (k, v) => { m[k] = v; } }; };
const piped = { items: [{ url: '/watch?v=abcdefghijk', title: 'Blinding Lights', uploaderName: 'The Weeknd - Topic', duration: 200, thumbnail: 'u' }, { url: '/channel/xyz', title: 'x' }] };
await t('Piped music_songs items are normalised (id, artist, duration) and non-videos dropped', () => {
  const r = normalizePiped(piped, true); assert.equal(r.length, 1);
  assert.deepEqual([r[0].videoId, r[0].artist, r[0].durationMs, r[0].musicSong], ['abcdefghijk', 'The Weeknd', 200000, true]);
});
await t('Invidious items are normalised', () => {
  const r = normalizeInvidious([{ videoId: 'abcdefghijk', title: 'T', author: 'A - Topic', lengthSeconds: 100, videoThumbnails: [{ quality: 'high', url: 'h' }] }]);
  assert.deepEqual([r[0].artist, r[0].durationMs, r[0].thumbnail], ['A', 100000, 'h']);
});
const resp = (o, ok = true) => ({ ok, status: ok ? 200 : 503, json: async () => o });
await t('rotates past dead instances and returns the first that answers', async () => {
  const calls = []; const f = async u => { calls.push(u); if (u.includes('dead')) throw new Error('down'); return resp(piped); };
  const r = await openYouTubeSearch('x', { fetchImpl: f, store: mem(), hosts: ['https://dead1', 'https://dead2', 'https://good'], invidious: false });
  assert.equal(r.host, 'https://good'); assert.equal(r.items[0].videoId, 'abcdefghijk'); assert.equal(r.via, 'piped');
});
await t('failed instances go on cool-down and are skipped next time', async () => {
  const store = mem(), calls = []; const f = async u => { calls.push(u); if (u.includes('dead')) throw new Error('down'); return resp(piped); };
  await openYouTubeSearch('x', { fetchImpl: f, store, hosts: ['https://dead', 'https://good'], invidious: false });
  calls.length = 0; await openYouTubeSearch('y', { fetchImpl: f, store, hosts: ['https://dead', 'https://good'], invidious: false });
  assert.ok(!calls.some(u => u.startsWith('https://dead')));
});
await t('falls back to Invidious when every Piped host is down', async () => {
  const f = async u => { if (u.includes('api.invidious.io')) return resp([['inv.test', { api: true, cors: true, type: 'https', uri: 'https://inv.test' }]]); if (u.startsWith('https://inv.test')) return resp([{ videoId: 'abcdefghijk', title: 'T', author: 'A', lengthSeconds: 90 }]); throw new Error('down'); };
  const r = await openYouTubeSearch('x', { fetchImpl: f, store: mem(), hosts: ['https://dead'] }); assert.equal(r.via, 'invidious');
});
await t('throws a clear error when nothing answers', async () => { await assert.rejects(() => openYouTubeSearch('x', { fetchImpl: async () => { throw new Error('down'); }, store: mem(), hosts: ['https://a'], invidious: false }), /no community instance/); });
console.log(n + ' tests passed');
