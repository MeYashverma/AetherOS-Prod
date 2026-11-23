// Public, read-only StickersAPI: https://stickerapi.sbs/docs
// No keys, proxy or user account. Only explicit searches or *mood labels* leave the browser;
// song titles, lyrics, local replies and profile information are never sent.
export const STICKERS_API = 'https://stickerapi.sbs/api';
const SLUG = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;
const ID = /^[A-Za-z0-9_-]{1,200}$/;
const SOURCES = new Set(['7tv', 'bttv', 'ffz']);
const TYPES = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'apng']);
const LABELS = { sticker: 'Sticker', emote: 'Emote', telegram: 'Telegram sticker', pfp: 'Profile image', banner: 'Banner' };
const safeName = (value, fallback) => String(value || fallback).replace(/[\u0000-\u001f]/g, '').slice(0, 80);

// Rebuild preview/download URLs from validated IDs. Never put API-provided image/page
// URLs into the DOM; a compromised catalogue cannot point our browser at another host.
export function mediaURL(item, action = 'preview') {
  if (!item || !['preview', 'download'].includes(action)) return null;
  const { kind } = item;
  if (['sticker', 'pfp', 'banner'].includes(kind) && SLUG.test(item.slug || ''))
    return `${STICKERS_API}/${kind}/${item.slug}/${action}`;
  if (kind === 'emote' && SOURCES.has(item.source) && ID.test(item.id || ''))
    return `${STICKERS_API}/emote/${item.source}/${item.id}/${action}`;
  if (kind === 'telegram' && ID.test(item.fileId || '')) {
    const id = action === 'preview' ? item.previewId || item.fileId : item.fileId;
    return ID.test(id) ? `${STICKERS_API}/telegram/file/${id}/${action}` : null;
  }
  return null;
}
export function cleanMedia(item) {
  if (!item || !LABELS[item.kind] || !mediaURL(item)) return null;
  return {
    kind: item.kind, name: safeName(item.name, LABELS[item.kind]), animated: !!item.animated,
    ...(item.kind === 'emote' ? { source: item.source, id: item.id } : {}),
    ...(item.kind === 'telegram' ? { fileId: item.fileId, previewId: item.previewId || item.fileId } : {}),
    ...(['sticker', 'pfp', 'banner'].includes(item.kind) ? { slug: item.slug } : {})
  };
}
export function normalizeMedia(kind, raw) {
  if (!raw || typeof raw !== 'object') return null;
  const type = String(raw.type || '').toLowerCase();
  if (kind === 'sticker' && !TYPES.has(type)) return null;
  const item = {
    kind, name: raw.name || (kind === 'telegram' ? raw.emoji : ''),
    animated: kind === 'sticker' ? ['gif', 'apng'].includes(type)
      : kind === 'emote' ? raw.animated === true
      : kind === 'telegram' ? !!(raw.isAnimated || raw.isVideo)
      : /\.gif(?:$|\?)/i.test(String(raw.image || '')),
    slug: raw.slug, source: raw.source, id: raw.id,
    fileId: raw.fileId, previewId: raw.thumbnailFileId || raw.fileId
  };
  return cleanMedia(item);
}

async function request(path, signal, fetchImpl) {
  const timeout = AbortSignal.timeout(9000);
  const res = await fetchImpl(`${STICKERS_API}${path}`, {
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    credentials: 'omit', referrerPolicy: 'no-referrer', headers: { Accept: 'application/json' }
  });
  if (!res.ok) throw Error(`StickersAPI HTTP ${res.status}`);
  return res.json();
}
export async function listMedia(type, { query = '', source = 'all', set = 'UtyaDuck', page = 1, signal } = {}, fetchImpl = fetch) {
  const q = String(query).trim().slice(0, 100);
  const p = Math.max(1, Math.min(500, Math.floor(Number(page)) || 1));
  let path, kind;
  switch (type) {
    case 'stickers':
      kind = 'sticker'; path = q ? `/search?q=${encodeURIComponent(q)}&limit=24` : '/stickers/random?count=24'; break;
    case 'emotes':
      kind = 'emote'; path = `/emotes?source=${SOURCES.has(source) ? source : 'all'}&limit=24${q ? `&q=${encodeURIComponent(q)}` : ''}`; break;
    case 'telegram':
      kind = 'telegram';
      if (!/^[A-Za-z0-9_]{1,64}$/.test(set)) throw Error('Enter a public Telegram sticker set name (letters, numbers or _).');
      path = `/telegram/stickers/${set}`; break;
    case 'pfps': case 'banners':
      kind = type === 'pfps' ? 'pfp' : 'banner';
      if (q && !/^[A-Za-z0-9_-]{1,40}$/.test(q)) throw Error('Use a single PFP/banner tag (for example music or cats).');
      path = `/${type}?tag=${encodeURIComponent(q || 'music')}&sort=featured&page=${p}`; break;
    default: throw Error('Unsupported media category.');
  }
  const data = await request(path, signal, fetchImpl);
  const rows = type === 'telegram' ? data?.stickers : data?.items;
  if (!Array.isArray(rows)) throw Error('Unexpected StickersAPI response.');
  return {
    items: rows.slice(0, 40).map(raw => normalizeMedia(kind, raw)).filter(Boolean),
    nextPage: ['pfps', 'banners'].includes(type) && Number.isInteger(data.nextPage) && data.nextPage > p ? data.nextPage : null,
    page: p, unavailable: Array.isArray(data.unavailable) ? data.unavailable.slice(0, 3) : []
  };
}

const MOODS = {
  heartbreak: ['broken heart', 'sad'], sad: ['sad', 'sad'], love: ['love', 'heart'],
  dance: ['dance', 'dance'], joy: ['happy', 'happy'], humor: ['laugh', 'laugh'],
  anger: ['angry', 'angry'], dream: ['sleep', 'sleep'], rain: ['rain', 'rain'],
  night: ['night', 'night'], fire: ['fire', 'fire'], surprise: ['surprised', 'wow'],
  confidence: ['confident', 'cool'], money: ['money', 'money'], longing: ['miss you', 'sad']
};
const cache = new Map(), pending = new Map(), cooldown = new Map();
// Moods are local classification labels, never raw lyric text. Cache/inflight
// deduplication prevents one network request per chat bubble or seek.
export async function moodMedia(kind, mood, seed = 0, reduced = false, fetchImpl = fetch) {
  if (!['sticker', 'emote'].includes(kind) || !/^[a-z]{2,24}$/.test(mood)) return null;
  const term = MOODS[mood]?.[kind === 'sticker' ? 0 : 1] || mood;
  const key = `${kind}:${term}`;
  if (Date.now() < (cooldown.get(key) || 0)) return null;
  let entry = cache.get(key);
  if (!entry || entry.until < Date.now()) {
    if (!pending.has(key)) pending.set(key, listMedia(kind === 'sticker' ? 'stickers' : 'emotes', { query: term }, fetchImpl)
      .then(result => { cache.set(key, { items: result.items, until: Date.now() + 600000 }); return result.items; })
      .catch(() => { cooldown.set(key, Date.now() + 60000); return []; })
      .finally(() => pending.delete(key)));
    entry = { items: await pending.get(key) };
  }
  // Match only named moods: avoid displaying unrelated search hits as an automatic reaction.
  const words = term.toLowerCase().split(/\s+/);
  const matching = entry.items.filter(item => words.some(w => item.name.toLowerCase().includes(w)) && (!reduced || !item.animated));
  return matching.length ? matching[(seed >>> 0) % Math.min(12, matching.length)] : null;
}

export function renderMediaImage(container, item, signal, className = 'chat-stickersapi-image') {
  const url = mediaURL(item);
  if (!url || signal?.aborted) return Promise.resolve(false);
  return new Promise(resolve => {
    const img = document.createElement('img');
    img.className = className;
    img.alt = `${item.name} (${LABELS[item.kind]}, StickersAPI)`;
    img.referrerPolicy = 'no-referrer'; img.decoding = 'async'; img.hidden = true;
    let done = false;
    const finish = ok => {
      if (done) return; done = true; clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      if (!ok) img.remove(); else img.hidden = false;
      resolve(ok);
    };
    const abort = () => { img.removeAttribute('src'); finish(false); };
    const timer = setTimeout(abort, 9000);
    signal?.addEventListener('abort', abort, { once: true });
    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    container.append(img); img.src = url;
  });
}
