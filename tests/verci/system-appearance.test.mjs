import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const read=p=>fs.readFileSync(p,'utf8');
function setup(){
 const dom=new JSDOM('<p id="system-appearance-status"></p>',{runScripts:'outside-only'}),w=dom.window;
 const queries=new Map();w.matchMedia=q=>{if(!queries.has(q))queries.set(q,{matches:false,listeners:[],addEventListener(_,fn){this.listeners.push(fn);}});return queries.get(q);};
 let saves=0;w.SystemState={settings:{system_appearance:'auto',glass_clarity:'balanced'},save(){saves++;}};
 w.eval(read('src/ui/system-appearance.js'));return {dom,w,queries,saves:()=>saves};
}
test('Day/Night/Auto applies live and persists validated appearance changes',()=>{
 const {dom,w,queries,saves}=setup();const root=w.document.documentElement;
 assert.equal(root.dataset.systemMode,'day');w.AetherAppearance.set('system_appearance','night');assert.equal(root.dataset.systemMode,'night');assert.ok(root.classList.contains('dark'));
 w.AetherAppearance.set('system_appearance','auto');const media=queries.get('(prefers-color-scheme: dark)');media.matches=true;media.listeners.forEach(fn=>fn());assert.equal(root.dataset.systemMode,'night');
 w.AetherAppearance.set('glass_clarity','clear');assert.equal(root.dataset.glassClarity,'clear');w.AetherAppearance.set('glass_clarity','invalid');assert.equal(root.dataset.glassClarity,'clear');assert.equal(saves(),3);dom.window.close();
});
test('reduced-transparency preference overrides clarity without erasing user choice',()=>{
 const {dom,w,queries}=setup();w.AetherAppearance.set('glass_clarity','clear');const media=queries.get('(prefers-reduced-transparency: reduce)');media.matches=true;media.listeners.forEach(fn=>fn());assert.equal(w.document.documentElement.dataset.glassClarity,'solid');assert.equal(w.SystemState.settings.glass_clarity,'clear');media.matches=false;media.listeners.forEach(fn=>fn());assert.equal(w.document.documentElement.dataset.glassClarity,'clear');dom.window.close();
});
test('light and dark structural backgrounds adapt; artwork and theme previews are preserved',()=>{
 const dom=new JSDOM('<div id="win-fixture"><header></header><main><section id="light" style="background:rgb(245,245,245);color:rgb(24,24,24)"><div id="text" style="color:rgb(255,255,255)">Text</div></section><div class="theme-btn" style="background:black"><span style="color:white" id="preview">Theme</span></div><canvas style="background:black" id="canvas"></canvas><iframe id="frame"></iframe></main></div>',{runScripts:'outside-only'}),w=dom.window;
 w.eval(read('src/ui/window-surfaces.js'));w.AetherWindowSurfaces.mount(w.document.getElementById('win-fixture'));
 assert.ok(w.document.getElementById('light').classList.contains('liquid-app-surface'));assert.equal(w.document.getElementById('text').dataset.adaptiveInk,'primary');assert.equal(w.document.getElementById('preview').dataset.adaptiveInk,undefined);assert.ok(!w.document.getElementById('canvas').classList.contains('liquid-app-surface'));assert.equal(w.document.getElementById('frame').getAttribute('src'),null);dom.window.close();
});
