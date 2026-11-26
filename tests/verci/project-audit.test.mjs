import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {webcrypto} from 'node:crypto';
import {JSDOM} from 'jsdom';
const source=p=>fs.readFileSync(p,'utf8');
test('audit covers exactly the registered apps with real implementation paths',()=>{
 const registry=source('src/core/system-state.js').split('window.AETHER_MODULE_REGISTRY = {')[1].split('\n};')[0];
 const ids=[...registry.matchAll(/^    (\w+):\s*\{/gm)].map(m=>m[1]);
 const audit=JSON.parse(source('assets/app-audit.json'));
 assert.equal(audit.apps.length,48);assert.deepEqual(audit.apps.map(a=>a.id).sort(),ids.sort());
 for(const app of audit.apps){assert.ok(fs.existsSync(app.file),app.file);assert.ok(app.mechanism&&app.limitations);}
});
test('About validates real commit identity and rejects unsafe history URLs',()=>{
 const dom=new JSDOM('<main id="about-panel-content"></main>',{runScripts:'outside-only'});
 dom.window.eval(source('src/ui/about-system.js'));
 const valid=dom.window.AetherAbout.safeCommit({sha:'a'.repeat(40),date:'2026-01-01',title:'<script>bad</script>',url:'javascript:bad'});
 assert.ok(valid.url.startsWith('https://github.com/MeYashverma/AetherOS-Prod/commit/'));
 assert.equal(dom.window.AetherAbout.safeCommit({sha:'oops',date:'bad',title:'x'}),null);dom.window.close();
});
test('privacy curtain hashes passphrases, hides background and restores focus',async()=>{
 const dom=new JSDOM('<button id="before">Open</button><div id="lock-screen-overlay"><input id="lock-pin-input"><div id="lock-pin-wrap"></div><button id="lock-submit-btn"></button><button id="lock-instant-btn"></button><p id="lock-pin-error"></p></div>',{runScripts:'outside-only',url:'https://example.test'});
 const w=dom.window;Object.defineProperty(w,'crypto',{value:webcrypto});w.TextEncoder=TextEncoder;
 w.SystemState={settings:{lock_pin:'',active_space:1},windows:{},saveNow(){}};
 w.os={};w.extendOS=methods=>Object.assign(w.os,methods);
 w.eval(source('src/services/workspace-lock.js'));
 await w.os.setLockPassphrase('correct horse');
 const saved=w.SystemState.settings.lock_verifier;assert.equal(saved.algorithm,'PBKDF2-SHA256');assert.equal(saved.hash.length,64);assert.equal(w.SystemState.settings.lock_pin,'');
 assert.notEqual(saved.hash,'correct horse');
 w.document.getElementById('before').focus();w.os.lockScreen();assert.equal(w.os.isScreenLocked,true);assert.equal(w.document.getElementById('before').inert,true);
 w.document.getElementById('lock-pin-input').value='wrong pass';assert.equal(await w.os.unlockScreen(),false);
 w.document.getElementById('lock-pin-input').value='correct horse';assert.equal(await w.os.unlockScreen(),true);assert.equal(w.document.activeElement.id,'before');assert.equal(w.document.getElementById('before').getAttribute('aria-hidden'),null);
 dom.window.close();
});
test('editor bridges reject broad origin matching and sandbox console is bounded',()=>{
 const editors=source('src/modules/opensource-webapps-suite.js');assert.ok(!editors.includes("e.origin.includes("));assert.ok(editors.includes("event.origin!=='https://www.photopea.com'||event.source!==frame?.contentWindow"));assert.ok(editors.includes("event.origin!=='https://embed.diagrams.net'||event.source!==frame?.contentWindow"));
 const sandbox=source('src/modules/dev-workbench.js');assert.ok(sandbox.includes('host.children.length>200'));assert.ok(sandbox.includes('d.text.slice(0,8000)'));
});
test('every sourced icon has a dark presentation variant and preserved provenance',()=>{
 const icons=JSON.parse(source('assets/app-icons/SOURCES.json')).icons;
 const provenance=JSON.parse(source('assets/app-icons/dark/SOURCES.json'));
 for(const id of Object.keys(icons)){
   const svg=source(`assets/app-icons/dark/${id}.svg`);
   assert.ok(svg.includes('darkTile'));assert.ok(provenance.files[`${id}.svg`]);
   assert.ok(!svg.includes('filter="invert'),'original color artwork is not destructively inverted');
 }
});
test('icon appearance changes existing and newly rendered icons consistently',()=>{
 const dom=new JSDOM('<div id="host"></div>',{runScripts:'outside-only'}),w=dom.window;
 w.SystemState={settings:{icon_appearance:'dark'},save(){}};
 w.eval(source('src/ui/desktop-design.js'));const api=w.AetherDesign;
 w.document.getElementById('host').innerHTML=api.appIcon('weather');
 assert.ok(w.document.querySelector('img').src.includes('/dark/'));
 api.setIconAppearance('color');assert.ok(!w.document.querySelector('img').src.includes('/dark/'));
 assert.equal(w.SystemState.settings.icon_appearance,'color');assert.ok(!api.iconMarkup('weather').includes('/dark/'));
 api.setIconAppearance('glass');assert.equal(w.document.querySelectorAll('.glass-icon-tile').length,1);api.refreshIconAppearance();assert.equal(w.document.querySelectorAll('.glass-icon-tile').length,1);assert.equal(api.iconTone(),'glass');assert.equal(w.document.querySelector('img').dataset.iconTone,'glass');assert.ok(!w.document.querySelector('img').src.includes('/dark/'));
 api.setIconAppearance('invalid');assert.equal(w.SystemState.settings.icon_appearance,'glass');dom.window.close();
});
test('app details validates registry, escapes external content and provides safe embed links',async()=>{
 const dom=new JSDOM('<button id="trigger"></button><div id="win-demo"><iframe src="https://example.org/tool"></iframe></div>',{runScripts:'outside-only',url:'https://example.test'}),w=dom.window;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.os={isScreenLocked:false};w.AETHER_MODULE_REGISTRY={demo:{}};
 w.fetch=async()=>({ok:true,json:async()=>({apps:[{id:'demo',mode:'embed',label:'<b>unsafe</b>',mechanism:'<img onerror=bad>',limitations:'Network required',file:'src/demo.js'}]})});
 w.eval(source('src/ui/app-details.js'));w.document.getElementById('trigger').focus();await w.AetherAppDetails.show('demo');
 assert.equal(w.document.querySelector('#app-details-title').textContent,'<b>unsafe</b>');assert.equal(w.document.querySelector('dialog section img'),null);
 const external=w.document.querySelector('dialog a[href="https://example.org/tool"]');assert.ok(external);assert.equal(external.rel,'noopener noreferrer');
 w.AetherAppDetails.close();assert.equal(w.document.activeElement.id,'trigger');
 w.os.isScreenLocked=true;await w.AetherAppDetails.show('demo');assert.equal(w.document.querySelector('dialog'),null);dom.window.close();
});
test('camera and shader lifecycle fixes are present and performance claims removed',()=>{
 const camera=source('src/modules/native-media-studios.js');assert.ok(camera.includes('request!==os.pbState.cameraRequest'));assert.ok(!camera.includes('FaceTime HD Webcam Active'));
 const shader=source('src/modules/iconic-web-universes.js');assert.ok(!shader.includes('Running at 60fps'));assert.ok(shader.includes('gl.deleteProgram'));assert.ok(shader.includes('gl.deleteBuffer'));assert.ok(shader.includes('if(vs)gl.deleteShader(vs)'));
 const creator=source('src/ui/about-system.js');assert.ok(creator.includes("Hi, I'm Yash Verma."));assert.ok(!creator.includes('Yash describes himself'));
});
test('glass icons use dedicated sourced filled glyphs, not bleached color artwork',()=>{
 const metadata=JSON.parse(source('assets/app-icons/glass/SOURCES.json'));
 const inventory=JSON.parse(source('assets/app-audit.json'));
 for(const app of inventory.apps){
  assert.ok(metadata.icons[app.id],app.id);
  const svg=source(`assets/app-icons/glass/${app.id}.svg`);
  assert.ok(svg.includes('fill="#eef1f5"'));assert.ok(!svg.includes('linearGradient'));
 }
 const design=source('src/ui/desktop-design.js');assert.ok(design.includes("tone==='glass'?'glass/':''"));
 const css=source('styles/project-and-lock.css');assert.ok(css.includes('aspect-ratio:1'));assert.ok(css.includes('finder-app-icon:has(>.glass-icon-tile)::after'));assert.ok(!css.includes('grayscale(1) brightness(2.3)'));
});
