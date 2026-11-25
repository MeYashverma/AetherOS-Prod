// Original vanilla-JS styling inspired by React Bits' Dock and flowing backgrounds.
// No React runtime or third-party component source is bundled.
(() => {
  const wallpapers = [
    { id: 'aurora', name: 'Aurora Current' }, { id: 'dune', name: 'Solar Dunes' },
    { id: 'ocean', name: 'Midnight Tide' }, { id: 'iris', name: 'Iris Silk' }
  ];
  const hueFor = id => {
    const known = { music: 340, terminal: 155, settings: 215, globe: 195, finder: 225, notes: 38, browser: 205 };
    if (Object.hasOwn(known, id)) return known[id];
    return [...String(id)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);
  };
  const iconStyle = id => `--app-hue:${hueFor(id)}`;
  // Vendored Microsoft Fluent UI System Icons (Color), MIT; see assets/app-icons/SOURCES.json.
  const iconIDs = new Set(["finder", "settings", "about", "terminal", "filemanager", "wikiboard", "browser", "media", "stickers", "radiobrowser", "weather", "feed", "sysmon", "taskmanager", "focus", "devpad", "kanban", "photobooth", "synthstudio", "photopea", "whiteboard", "chiptune", "worldmuseums", "gutendex", "earthpulse", "spacexhub", "stellarium", "georadar", "worldfactbook", "wayback", "winamp", "ossradar", "shadertoy", "codeplay", "aetherbridge", "aetherlink", "presence", "iss", "nasa", "globe", "market", "games", "ytchtv", "memes", "anime", "manga", "entityscanner", "floor796", "wplace", "notes"]);
  function iconMarkup(id) {
    const key = id === 'music' ? 'media' : id;
    return iconIDs.has(key) ? `<img class="native-app-art" src="assets/app-icons/${key}.svg?v=fluent-1" alt="" draggable="false">` : '';
  }
  function appIcon(id, size = 18) {
    const pixels = Math.max(12, Math.min(64, Number(size) || 18));
    return `<span class="app-identity-icon" style="--app-icon-size:${pixels}px" aria-hidden="true">${iconMarkup(id) || iconMarkup('finder')}</span>`;
  }
  function hydrateAppIcons(root = document) {
    root.querySelectorAll('[data-app-icon]').forEach(node => {
      node.outerHTML = appIcon(node.dataset.appIcon, 20);
    });
  }
  function selected(settings, now = new Date()) {
    const base = Math.max(0, wallpapers.findIndex(w => w.id === settings.wallpaper_collection));
    const cadence = settings.wallpaper_rotation || 'daily';
    // Local calendar dates keep the daily image stable through DST changes.
    const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
    const step = cadence === 'hourly' ? day * 24 + now.getHours() : cadence === 'off' ? 0 : day;
    return wallpapers[(base + step) % wallpapers.length];
  }
  let timer = null;
  function syncWallpaper(settings) {
    clearTimeout(timer); timer = null;
    const el = document.getElementById('lg-wallpaper');
    if (!el) return;
    if (!['gallery', 'online'].includes(settings.wallpaper_mode)) {
      window.AetherWebWallpapers?.stop();
      delete el.dataset.collection;
      return;
    }
    const current = selected(settings);
    const dim = Math.min(85, Math.max(0, Number(settings.wallpaper_dim ?? 25))) / 100;
    el.style.backgroundImage = `linear-gradient(rgba(4,6,12,${dim}),rgba(4,6,12,${dim})), url("assets/wallpapers/${current.id}.svg")`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.filter = '';
    el.dataset.collection = current.id;
    if (settings.wallpaper_mode === 'online') window.AetherWebWallpapers?.sync(settings);
    else window.AetherWebWallpapers?.stop();
    if (settings.wallpaper_mode === 'online' || (settings.wallpaper_rotation || 'daily') !== 'off') {
      timer = setTimeout(() => syncWallpaper(settings), 60000);
    }
  }
  function decorateDock(dock) {
    dock.setAttribute('role', 'toolbar'); dock.setAttribute('aria-label', 'Application dock');
    dock.querySelectorAll('.dock-item,.dock-minimized-thumb').forEach(item => {
      const id = item.id.replace('dock-item-', '').replace('dock-finder-trigger', 'finder');
      item.style.setProperty('--app-hue', hueFor(id));
      if (item.matches('.dock-item')) {
        item.classList.add('app-icon-tile');
        const artwork = iconMarkup(id), glyph = item.querySelector('i[data-lucide],svg');
        if (artwork && glyph) glyph.outerHTML = artwork;
      }
      item.setAttribute('role', 'button'); item.tabIndex = 0;
      item.setAttribute('aria-label', item.title || id);
      item.onkeydown = e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const items = [...dock.querySelectorAll('.dock-item,.dock-minimized-thumb')], index = items.indexOf(item);
          items[(index + (e.key === 'ArrowRight' ? 1 : items.length - 1)) % items.length].focus();
        }
      };
    });
    fitDock(dock);
  }
  function fitDock(dock) {
    dock.classList.toggle('dock-overflow', dock.scrollWidth > window.innerWidth - 28);
  }
  window.addEventListener('resize', () => {
    const dock = document.getElementById('dock');
    if (dock) fitDock(dock);
  }, { passive: true });
  window.AetherDesign = { wallpapers, hueFor, iconStyle, iconMarkup, appIcon, hydrateAppIcons, selected, syncWallpaper, decorateDock };
  hydrateAppIcons();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && typeof SystemState !== 'undefined') syncWallpaper(SystemState.settings);
  });
})();
