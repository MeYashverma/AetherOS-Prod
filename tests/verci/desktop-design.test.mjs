import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
const source = fs.readFileSync(new URL('../../src/ui/desktop-design.js', import.meta.url), 'utf8');
function setup() {
  const dom = new JSDOM('<div id="lg-wallpaper"></div><div id="dock"><div class="dock-item" id="dock-item-music" title="Music"></div><div class="dock-item" id="dock-finder-trigger" title="Finder"></div></div>', { runScripts: 'outside-only' });
  let timers = 0;
  dom.window.setTimeout = () => ++timers; dom.window.clearTimeout = () => {};
  vm.runInContext(source, dom.getInternalVMContext());
  return { dom, api: dom.window.AetherDesign, timers: () => timers };
}
test('wallpaper rotation is stable, advances on local date/hour boundaries, and can be paused', () => {
  const { api } = setup(); const st = { wallpaper_rotation: 'daily' };
  const a = new Date(2026, 10, 22, 1), b = new Date(2026, 10, 22, 22), c = new Date(2026, 10, 23, 1);
  assert.equal(api.selected(st, a).id, api.selected(st, b).id);
  assert.notEqual(api.selected(st, a).id, api.selected(st, c).id);
  st.wallpaper_rotation = 'hourly'; assert.notEqual(api.selected(st, a).id, api.selected(st, new Date(2026, 10, 22, 2)).id);
  st.wallpaper_rotation = 'off'; st.wallpaper_collection = 'iris';
  assert.equal(api.selected(st, c).id, 'iris');
  st.wallpaper_collection = 'invalid'; assert.equal(api.selected(st, c).id, 'aurora');
});
test('gallery uses only local assets, schedules one refresh, and leaves custom wallpaper alone', () => {
  const { api, dom, timers } = setup(); const el = dom.window.document.querySelector('#lg-wallpaper');
  api.syncWallpaper({ wallpaper_mode: 'gallery', wallpaper_rotation: 'daily' });
  assert.match(el.style.background, /assets\/wallpapers/); assert.equal(timers(), 1);
  el.style.background = 'red'; api.syncWallpaper({ wallpaper_mode: 'custom' });
  assert.equal(el.style.background, 'red'); assert.equal(el.dataset.collection, undefined);
  api.syncWallpaper({ wallpaper_mode: 'gallery', wallpaper_rotation: 'off', wallpaper_collection: 'dune' });
  assert.equal(el.dataset.collection, 'dune'); assert.equal(timers(), 1);
});
test('dock tiles get stable colors, accessible names, keyboard activation and arrow navigation', () => {
  const { api, dom } = setup(); const dock = dom.window.document.querySelector('#dock');
  api.decorateDock(dock); const [music, finder] = dock.children; let clicks = 0; music.onclick = () => clicks++;
  assert.equal(music.getAttribute('aria-label'), 'Music'); assert.equal(music.tabIndex, 0);
  music.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter' })); assert.equal(clicks, 1);
  music.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight' })); assert.equal(dom.window.document.activeElement, finder);
  assert.equal(api.hueFor('music'), api.hueFor('music')); assert.notEqual(api.hueFor('music'), api.hueFor('finder'));
});
test('every collection wallpaper has native 4K dimensions and is precached', () => {
  const { api } = setup(); const sw = fs.readFileSync(new URL('../../sw.js', import.meta.url), 'utf8');
  for (const w of api.wallpapers) {
    const svg = fs.readFileSync(new URL(`../../assets/wallpapers/${w.id}.svg`, import.meta.url), 'utf8');
    assert.match(svg, /width="3840" height="2160"/); assert.ok(sw.includes(`assets/wallpapers/${w.id}.svg`));
  }
});

test('sourced artwork is local, allowlisted, and precached with a safe glyph fallback', () => {
  const { api } = setup();
  const sw = fs.readFileSync(new URL('../../sw.js', import.meta.url), 'utf8');
  for (const id of ['finder','media','filemanager','browser','notes','weather','globe','focus','feed','sysmon','terminal','settings']) {
    assert.match(api.iconMarkup(id), /class="native-app-art"/);
    assert.ok(sw.includes(`assets/app-icons/${id}.svg`));
    assert.ok(fs.existsSync(new URL(`../../assets/app-icons/${id}.svg`, import.meta.url)));
  }
  assert.equal(api.iconMarkup('unknown'), '');
  assert.equal(api.iconMarkup('"><img onerror=alert(1)>'), '');
});

test('all registered apps use verified, licensed Fluent Color source assets', async () => {
  const { createHash } = await import('node:crypto');
  const { api } = setup();
  const manifest = JSON.parse(fs.readFileSync(new URL('../../assets/app-icons/SOURCES.json', import.meta.url), 'utf8'));
  const registry = fs.readFileSync(new URL('../../src/core/system-state.js', import.meta.url), 'utf8')
    .split('const AETHER_MODULE_REGISTRY')[1].split('function buildDefaultEnabledModules')[0];
  const sw = fs.readFileSync(new URL('../../sw.js', import.meta.url), 'utf8');
  for (const [, id] of registry.matchAll(/^\s*(\w+):\s*\{/gm)) assert.ok(api.iconMarkup(id), `registered app ${id} has detailed artwork`);
  assert.equal(manifest.license, 'MIT'); assert.equal(Object.keys(manifest.icons).length, 50);
  for (const [app, info] of Object.entries(manifest.icons)) {
    const svg = fs.readFileSync(new URL(`../../assets/app-icons/${app}.svg`, import.meta.url));
    assert.equal(createHash('sha256').update(svg).digest('hex'), info.sha256, `${app} is unchanged from upstream`);
    assert.match(info.file, /_color\.svg$/);
    assert.ok(sw.includes(`assets/app-icons/${app}.svg`));
  }
  assert.match(fs.readFileSync(new URL('../../assets/app-icons/LICENSE.txt', import.meta.url), 'utf8'), /Microsoft Corporation/);
});
