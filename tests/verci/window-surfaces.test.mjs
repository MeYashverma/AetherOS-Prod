import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
const code = fs.readFileSync(new URL('../../src/ui/window-surfaces.js', import.meta.url), 'utf8');
test('glass windows frost structural surfaces while keeping text, controls and media intact', async () => {
  const dom = new JSDOM(`<div class="os-window" id="win-terminal"><header></header><div><main style="background:rgb(8,12,20)"><section style="background:rgba(0,0,0,.9)"><span>Readable text</span><button style="background:red">Run</button><div class="verci-stage"><section id="art" style="background:black"></section></div><canvas style="background:black"></canvas></section></main></div></div>`, { runScripts: 'outside-only' });
  const w = dom.window; w.eval(code); const api = w.AetherWindowSurfaces;
  const el = w.document.querySelector('.os-window'); api.mount(el);
  assert.ok(el.classList.contains('liquid-app-window'));
  assert.ok(el.querySelector('main').classList.contains('liquid-app-surface'));
  assert.ok(el.querySelector('section').classList.contains('liquid-app-surface'));
  assert.equal(el.querySelector('#art').classList.contains('liquid-app-surface'), false);
  assert.equal(el.querySelector('button').style.background, 'red');
  assert.equal(el.querySelector('span').style.opacity, '');
  const dynamic = w.document.createElement('section'); dynamic.style.background = 'black';
  el.children[1].append(dynamic); await new Promise(r => setTimeout(r, 150));
  assert.ok(dynamic.classList.contains('liquid-app-surface'));
  api.unmount('terminal');
  const after = w.document.createElement('section'); after.style.background = 'black';
  el.children[1].append(after); await new Promise(r => setTimeout(r, 150));
  assert.equal(after.classList.contains('liquid-app-surface'), false);
  w.close();
});
test('application identity surfaces consistently call the shared Fluent artwork helper', () => {
  for (const path of ['src/engines/window-manager.js', 'src/engines/window-snap-and-spaces.js', 'src/engines/command-palette.js', 'src/modules/diagnostics-and-tasks.js', 'src/ui/settings-tabs.js']) {
    const source = fs.readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
    assert.match(source, /AetherDesign\?\.appIcon\(/, path);
  }
  const sw = fs.readFileSync(new URL('../../sw.js', import.meta.url), 'utf8');
  assert.match(sw, /pathname\.startsWith\('\/api\/'\)/, 'live API is excluded from the shell fallback cache');
});

test('nested gradients, layout-less dark wrappers and late class/style changes do not hide the backdrop', async () => {
  const dom = new JSDOM(`<div id="win-nested"><header></header><main><div><div id="gradient" style="background:linear-gradient(rgb(3,5,9),rgb(12,15,20))"></div><div id="plain" style="background:rgb(10,12,18)"></div><div id="late"></div><div id="color" style="background:rgb(220,30,40)"></div><img id="photo" style="background:black"></div></main></div>`, {runScripts:'outside-only'});
  const w=dom.window;w.eval(code); w.AetherWindowSurfaces.mount(w.document.querySelector('#win-nested'));
  for(const id of ['gradient','plain'])assert.ok(w.document.getElementById(id).classList.contains('liquid-app-surface'),id);
  for(const id of ['color','photo'])assert.equal(w.document.getElementById(id).classList.contains('liquid-app-surface'),false,id);
  const late=w.document.getElementById('late');late.style.background='rgb(15,15,20)';
  await new Promise(r=>setTimeout(r,240));assert.ok(late.classList.contains('liquid-app-surface'));
  w.AetherWindowSurfaces.unmount('nested');w.close();
});

test('system surfaces include static menus and dynamically inserted toasts without restyling media', async () => {
  const dom=new JSDOM(`<div id="control-center-panel"><div style="background:rgb(8,10,16)"><button>Toggle</button><img id="media"></div></div><div id="right-utility-panel"><section style="background:rgb(10,10,20)">Utilities</section></div><div id="aether-toast-stack"></div><div id="art" data-preserve-surface><div class="api-panel"></div></div>`,{runScripts:'outside-only'});
  const w=dom.window;w.eval(code);const api=w.AetherWindowSurfaces;api.startShell();
  for(const id of ['control-center-panel','right-utility-panel'])assert.ok(w.document.getElementById(id).classList.contains('liquid-shell-panel'),id);
  assert.ok(w.document.querySelector('#control-center-panel > div').classList.contains('liquid-app-surface'));
  assert.equal(w.document.querySelector('#media').classList.length,0);
  assert.equal(w.document.querySelector('#art .api-panel').classList.contains('liquid-shell-panel'),false);
  const toast=w.document.createElement('div');toast.textContent='Saved';w.document.getElementById('aether-toast-stack').append(toast);
  await new Promise(r=>setTimeout(r,240));assert.ok(toast.classList.contains('liquid-shell-panel'));
  toast.remove();await new Promise(r=>setTimeout(r,130));
  api.stopShell();
  const late=w.document.createElement('div');w.document.getElementById('aether-toast-stack').append(late);
  await new Promise(r=>setTimeout(r,140));assert.equal(late.classList.contains('liquid-shell-panel'),false);w.close();
});

test('system material is loaded last, precached and has accessible/performance fallbacks',()=>{
  const html=fs.readFileSync(new URL('../../index.html',import.meta.url),'utf8');
  assert.ok(html.indexOf('styles/system-glass.css')>html.indexOf('styles/music-theater.css'));
  const css=fs.readFileSync(new URL('../../styles/system-glass.css',import.meta.url),'utf8');
  for(const marker of ['prefers-reduced-transparency','prefers-reduced-motion','forced-colors','focus-visible','html.perf-eco','--material-blur','#control-center-panel','#right-utility-panel','.settings-card','.app-switcher-strip','#calendar-popover'])assert.ok(css.includes(marker),marker);
  assert.equal(/(^|\})\s*(button|input|\*)\s*\{/m.test(css),false,'no destructive global control reset');
  const sw=fs.readFileSync(new URL('../../sw.js',import.meta.url),'utf8');assert.match(sw,/system-glass\.css\?v=desktop-7/);
});
