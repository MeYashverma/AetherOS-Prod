import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

test('About me renders the original portrait as a seamless transparent halftone without changing biography',async()=>{
 const dom=new JSDOM('<div id="about-panel-content"></div>',{runScripts:'outside-only',url:'https://aether.test'});
 const w=dom.window;
 w.os={};w.SystemState={windows:{}};w.AETHER_MODULE_REGISTRY={};
 w.fetch=async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(String(url),'utf8'))});
 w.eval(fs.readFileSync('src/ui/about-system.js','utf8'));
 await w.AetherAbout.show('creator');
 const portrait=w.document.querySelector('.creator-portrait');
 assert.ok(portrait);
 const img=portrait.querySelector('.creator-portrait-frame > img');
 assert.equal(img.getAttribute('src'),'assets/creator/yash-halftone-cutout.webp');
 assert.equal(img.getAttribute('width'),'720');assert.equal(img.getAttribute('height'),'964');
 assert.match(img.alt,/Yash Verma/);
 assert.equal(portrait.querySelectorAll('figcaption span').length,2);
 assert.match(w.document.body.textContent,/I'm originally from Churu/);
 dom.window.close();
});

test('portrait styling preserves colour and full aspect ratio with accessible fallbacks',()=>{
 const css=fs.readFileSync('styles/project-and-lock.css','utf8');
 const rule=css.match(/\.creator-intro \.creator-portrait img\{([^}]+)\}/)?.[1];
 assert.match(rule,/filter:none/);assert.match(rule,/object-fit:contain/);assert.match(rule,/max-height:none/);assert.match(rule,/background:transparent/);assert.match(rule,/border-radius:0/);
 assert.match(css,/@media\(forced-colors:active\).*creator-portrait-frame/s);
 assert.match(css,/@media\(prefers-reduced-transparency:reduce\).*creator-portrait-frame/s);
 for(const path of ['index.html','sw.js']){
  const text=fs.readFileSync(path,'utf8');
  assert.match(text,/project-and-lock\.css\?v=portrait-6/);
  assert.match(text,/about-system\.js\?v=portrait-4/);
 }
});
