// AetherOS — Offline-Capable Service Worker (Network-First Shell + Offline Cache Fallback)
const CACHE_NAME = 'aetheros-shell-v58';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './styles/core.css',
  './styles/modules-and-overlays.css',
  './styles/liquid-glass.css?v=desktop-7',
  './styles/system-glass.css?v=desktop-7',
  './src/ui/desktop-design.js?v=desktop-7',
  './src/ui/web-wallpapers.js?v=desktop-7',
  './src/ui/window-surfaces.js?v=desktop-7',
  './assets/wallpapers/online-catalog.json',
  './assets/app-icons/finder.svg?v=fluent-1',
  './assets/app-icons/settings.svg?v=fluent-1',
  './assets/app-icons/about.svg?v=fluent-1',
  './assets/app-icons/terminal.svg?v=fluent-1',
  './assets/app-icons/filemanager.svg?v=fluent-1',
  './assets/app-icons/wikiboard.svg?v=fluent-1',
  './assets/app-icons/browser.svg?v=fluent-1',
  './assets/app-icons/media.svg?v=fluent-1',
  './assets/app-icons/stickers.svg?v=fluent-1',
  './assets/app-icons/radiobrowser.svg?v=fluent-1',
  './assets/app-icons/weather.svg?v=fluent-1',
  './assets/app-icons/feed.svg?v=fluent-1',
  './assets/app-icons/sysmon.svg?v=fluent-1',
  './assets/app-icons/taskmanager.svg?v=fluent-1',
  './assets/app-icons/focus.svg?v=fluent-1',
  './assets/app-icons/devpad.svg?v=fluent-1',
  './assets/app-icons/kanban.svg?v=fluent-1',
  './assets/app-icons/photobooth.svg?v=fluent-1',
  './assets/app-icons/synthstudio.svg?v=fluent-1',
  './assets/app-icons/photopea.svg?v=fluent-1',
  './assets/app-icons/whiteboard.svg?v=fluent-1',
  './assets/app-icons/chiptune.svg?v=fluent-1',
  './assets/app-icons/worldmuseums.svg?v=fluent-1',
  './assets/app-icons/gutendex.svg?v=fluent-1',
  './assets/app-icons/earthpulse.svg?v=fluent-1',
  './assets/app-icons/spacexhub.svg?v=fluent-1',
  './assets/app-icons/stellarium.svg?v=fluent-1',
  './assets/app-icons/georadar.svg?v=fluent-1',
  './assets/app-icons/worldfactbook.svg?v=fluent-1',
  './assets/app-icons/wayback.svg?v=fluent-1',
  './assets/app-icons/winamp.svg?v=fluent-1',
  './assets/app-icons/ossradar.svg?v=fluent-1',
  './assets/app-icons/shadertoy.svg?v=fluent-1',
  './assets/app-icons/codeplay.svg?v=fluent-1',
  './assets/app-icons/aetherbridge.svg?v=fluent-1',
  './assets/app-icons/aetherlink.svg?v=fluent-1',
  './assets/app-icons/presence.svg?v=fluent-1',
  './assets/app-icons/iss.svg?v=fluent-1',
  './assets/app-icons/nasa.svg?v=fluent-1',
  './assets/app-icons/globe.svg?v=fluent-1',
  './assets/app-icons/market.svg?v=fluent-1',
  './assets/app-icons/games.svg?v=fluent-1',
  './assets/app-icons/ytchtv.svg?v=fluent-1',
  './assets/app-icons/memes.svg?v=fluent-1',
  './assets/app-icons/anime.svg?v=fluent-1',
  './assets/app-icons/manga.svg?v=fluent-1',
  './assets/app-icons/entityscanner.svg?v=fluent-1',
  './assets/app-icons/floor796.svg?v=fluent-1',
  './assets/app-icons/wplace.svg?v=fluent-1',
  './assets/app-icons/notes.svg?v=fluent-1',
  './assets/wallpapers/aurora.svg',
  './assets/wallpapers/dune.svg',
  './assets/wallpapers/ocean.svg',
  './assets/wallpapers/iris.svg',
  './styles/verci-stage.css?v=native-map-7',
  './styles/music-theater.css?v=stickersapi-31',
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
      Promise.all(keys.filter((k) => k.startsWith('aetheros-shell-') && k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // Live API and proxied images must never become cached shell HTML fallbacks.
  if (new URL(req.url).pathname.startsWith('/api/')) return;
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
