// Frost app structure, not the content: text/media keep full opacity.
(() => {
  const mounted = new Map();
  const structure = 'div,main,section,aside,header,footer,nav,article';
  const preserve = '.verci-stage,.phone,canvas,video,img,iframe,svg,[data-preserve-surface]';
  function frost(node, body) {
    if (!(node instanceof HTMLElement) || node.closest(preserve)) return;
    if (!node.matches(structure)) return;
    const style = getComputedStyle(node);
    const values = style.backgroundColor.match(/[\d.]+/g)?.map(Number) || [];
    const [r = 0, g = 0, b = 0, alpha = 1] = values;
    const dark = (r * .2126 + g * .7152 + b * .0722) < 135;
    const neutral = Math.max(r,g,b) - Math.min(r,g,b) < 65;
    const gradient = style.backgroundImage.includes('gradient') && !style.backgroundImage.includes('url(');
    const gradientColors = [...style.backgroundImage.matchAll(/rgba?\(([^)]+)\)/g)].map(m => m[1].split(',').map(Number));
    const darkGradient = gradientColors.length > 0 && gradientColors.every(([r,g,b]) => Math.max(r,g,b) < 140);
    const layout = node === body || node.parentElement === body || node.matches('main,aside,section,header,footer,nav') || /(?:shell|sidebar|panel|h-full|flex-1|overflow-|flex-col)/.test(node.className);
    // Nested cards and layout-less wrappers also occlude the backdrop. Do not
    // add another alpha tint at every depth: the frame owns the glass tint.
    if ((values.length >= 3 && dark && neutral && alpha > .15) || (gradient && (layout || darkGradient))) {
      if (!node.classList.contains('liquid-app-surface')) node.classList.add('liquid-app-surface');
    }
  }

  function scan(node, body) {
    frost(node, body);
    if (!(node instanceof HTMLElement) || node.closest(preserve)) return;
    for (const child of [...node.querySelectorAll(structure)].slice(0, 800)) frost(child, body);
  }
  function unmount(id) {
    const key = mounted.has(id) ? id : `win-${id}`, state = mounted.get(key);
    if (!state) return;
    state.observer.disconnect(); clearTimeout(state.timer); mounted.delete(key);
  }
  let shellID = 0;
  function mount(el, shell = false) {
    if (!el.id) el.id = `liquid-shell-${++shellID}`;
    unmount(el.id);
    const body = shell ? el : el.children[1]; if (!body) return;
    el.classList.add(shell ? 'liquid-shell-panel' : 'liquid-app-window');
    if (!shell) body.classList.add('aether-window-body');
    scan(body, body);
    const pending = new Set(), state = { timer: null };
    state.observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'attributes') pending.add(record.target);
        else for (const node of record.addedNodes) if (node instanceof HTMLElement) pending.add(node);
      }
      if (!pending.size || state.timer) return;
      state.timer = setTimeout(() => {
        state.timer = null;
        if (!el.isConnected) { unmount(el.id); return; }
        for (const node of pending) if (node.isConnected) scan(node, body);
        pending.clear();
      }, 100);
    });
    state.observer.observe(body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    state.element = el;
    mounted.set(el.id, state);
  }
  const shellRoots = '#right-utility-panel,#finder-overlay,#aether-menu-dropdown,#control-center-panel,#notification-center,#desktop-context-menu,#dock-context-menu,#calendar-popover,#dock-preview,#cmd-palette > div,.app-switcher-strip,.mc-panel,.api-panel,#aether-toast-stack > div';
  let discovery = null, discoveryTimer = null;
  const additions = new Set();
  function discover(root) {
    if (!(root instanceof HTMLElement)) return;
    const panels = root.matches(shellRoots) ? [root] : [];
    panels.push(...root.querySelectorAll(shellRoots));
    for (const panel of panels) {
      if (panel.closest('.os-window,[data-preserve-surface]') || mounted.has(panel.id)) continue;
      // Do not add a second backdrop-filter for an already frosted parent.
      if (panel.parentElement?.closest('.liquid-shell-panel')) continue;
      mount(panel, true);
    }
  }
  function startShell() {
    if (discovery || !document.body) return;
    discover(document.body);
    discovery = new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) if (node instanceof HTMLElement) additions.add(node);
      if (discoveryTimer) return;
      discoveryTimer = setTimeout(() => {
        discoveryTimer = null;
        for (const [key,state] of mounted) if (!state.element.isConnected) unmount(key);
        for (const node of additions) if (node.isConnected && !node.closest('.os-window,.liquid-shell-panel')) discover(node);
        additions.clear();
      }, 100);
    });
    discovery.observe(document.body, {childList:true,subtree:true});
  }
  function stopShell() {
    discovery?.disconnect(); discovery = null;
    clearTimeout(discoveryTimer); discoveryTimer = null; additions.clear();
    for (const [key,state] of mounted) if (state.element.classList.contains('liquid-shell-panel')) unmount(key);
  }
  window.AetherWindowSurfaces = { mount, unmount, startShell, stopShell };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startShell, {once:true});
  else startShell();
})();
