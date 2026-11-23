// AetherOS — Offline-Capable Service Worker (Network-First Shell + Offline Cache Fallback)
const CACHE_NAME = 'aetheros-shell-v32';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './styles/core.css',
  './styles/modules-and-overlays.css',
  './styles/liquid-glass.css',
  './styles/verci-stage.css?v=ios-layout-20',
  './styles/music-theater.css',
  './assets/whatsapp-chat-doodles.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Only cache same-origin static assets & shell scripts/styles
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
  );
});
