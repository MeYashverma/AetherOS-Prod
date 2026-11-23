import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { JSDOM } = require(process.env.JSDOM_PATH || 'jsdom');
const dom = new JSDOM('<div id="media-console-panel"></div><div id="stage"></div>', { url: 'https://aether.test', runScripts: 'outside-only' });
for (const k of ['window', 'document', 'localStorage', 'sessionStorage', 'HTMLElement', 'HTMLCanvasElement', 'getComputedStyle', 'EventTarget', 'CustomEvent', 'Event']) globalThis[k] = k === 'window' ? dom.window : dom.window[k];
globalThis.devicePixelRatio = 1;
globalThis.matchMedia = () => ({ matches: true });
globalThis.requestAnimationFrame = () => 1;
globalThis.cancelAnimationFrame = () => {};
globalThis.fetch = async () => { throw Error('Offline test'); };
const gradient = { addColorStop() {} };
const ctx = new Proxy({ measureText: t => ({ width: String(t).length * 8 }), createLinearGradient: () => gradient, createRadialGradient: () => gradient, createImageData: (w,h) => ({ data: new Uint8ClampedArray(w*h*4) }), getImageData: () => ({ data: new Uint8ClampedArray(96*96*4) }) }, { get: (o,k) => o[k] ?? (() => {}), set: (o,k,v) => (o[k]=v,true) });
dom.window.HTMLCanvasElement.prototype.getContext = () => ctx;
dom.window.HTMLElement.prototype.getBoundingClientRect = () => ({ width: 640, height: 400, left: 0, top: 0 });
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
const { parseLRC, estimatePlain } = await import('../../src/vendor/verci/lrc.js');
const { STYLES } = await import('../../src/vendor/verci/viz/index.js');
const { frameState } = await import('../../src/vendor/verci/viz/core.js');
const L = parseLRC('[00:00.00]Hello world\n[00:03.00]Love the moon\n[00:06.00]Sing to the stars');
assert.equal(STYLES.length,17);
for (const style of STYLES) {
 const root = document.getElementById('stage');
 const viz = new style.make(root, { song:{ title:'Test',artist:'Test artist',artwork:'' }, lyrics:L, theme:{hi:'#fff',sec:'#aaa',scale:1}, duration:()=>180, opts:{hometown:()=>false} }).mount();
 for (const t of [0,1,4,7,1]) viz.frame(frameState(L,t), 0.016);
 assert.ok(root.children.length, style.id);
 viz.destroy(); assert.equal(root.children.length,0,style.id+' cleans up');
}
const E = estimatePlain('Hello world\nAnother line\nA final chorus', 150);
assert.equal(E.estimated,true); assert.equal(E.synced,false); assert.equal(E.lines.at(-1).end,150);
assert.ok(E.flat.every(w => w.estimated && w.t1 >= w.t0));
assert.equal(estimatePlain('',120).lines.length,0);
// Exercise real module registration, Finder canonical labels and title.
for (const p of ['src/core/primitives.js','src/core/system-state.js','src/modules/shell-and-theme.js']) dom.window.eval(readFileSync(p,'utf8'));
assert.equal(dom.window.os.finderModules.length,Object.keys(dom.window.AETHER_MODULE_REGISTRY).length);
for (const m of dom.window.os.finderModules) assert.equal(m.label,dom.window.AETHER_MODULE_REGISTRY[m.id].label,m.id);
assert.match(readFileSync('index.html','utf8'),/<title>AetherOS<\/title>/);
assert.equal(JSON.parse(readFileSync('manifest.json')).name,'AetherOS');
console.log('All 17 scenes mount, frame, seek and destroy; estimates, names and title verified.');
// Import the actual desktop adapter with a deterministic media engine.
const audio = () => {
 const a = new dom.window.EventTarget();
 Object.assign(a,{ preload:'', volume:1, playbackRate:1, currentTime:0, duration:180, paused:true, ended:false, src:'', play(){this.paused=false;this.dispatchEvent(new dom.window.Event('play'));return Promise.resolve();}, pause(){this.paused=true;},load(){},removeAttribute(){this.src='';} });
 return a;
};
globalThis.Audio = function(){return audio();};
const originalInterval = globalThis.setInterval;
globalThis.setInterval = () => 1;
dom.window.os.updatePlayStateVisuals = () => {};
dom.window.os.stopRadioBrowser = () => {};
dom.window.os.adjustVolume = () => {};
dom.window.SystemState.windows.media.isOpen = true;
await import('../../src/modules/music-theater.js');
globalThis.setInterval = originalInterval;
assert.equal(document.querySelectorAll('#music-style option').length,18);
assert.ok(document.getElementById('music-search-form'));
const P = dom.window.AetherMusic.player;
await P.load({engine:'audio',url:'https://example.test/full.mp3'});
P.audio.currentTime = 42;
assert.equal(P.time,42); P.pause(); assert.equal(P.playing,false);
P.seek(73); assert.equal(P.time,73); P.setVolume(.3); assert.equal(P.audio.volume,.3);
P.stop(); assert.equal(P.mode,null);
dom.window.AetherMusic.state.lyrics = E;
dom.window.AetherMusic.state.song = {title:'Hello',artist:'World'};
dom.window.os.renderMediaDashboard();
assert.match(document.getElementById('music-sync').textContent,/Estimated/);
dom.window.os.pauseVerciVisualStage();
assert.equal(dom.window.AetherMusic.state.viz,null);
console.log('Desktop adapter renders all 18 options; real clock, pause, seek, volume and stage cleanup verified.');

// Regression: app chrome must not style headers/footers inside native lyric scenes.
const musicCSS = readFileSync('styles/music-theater.css','utf8');
assert.ok(!/\.music-app (?:header|footer|nav)\b/.test(musicCSS));
assert.ok(!/\.music-body (?:aside|main)\b/.test(musicCSS));
for (const file of ['styles/liquid-glass.css','styles/modules-and-overlays.css']) {
 assert.ok(!readFileSync(file,'utf8').includes('#os-layer header'), file+' scopes menu bar to its direct child');
}
assert.ok(document.getElementById('music-video-slot'), 'video reserves space in sidebar');
assert.ok(document.getElementById('music-video-dock').hidden, 'no detached video overlay without YouTube playback');
console.log('UI regressions: isolated app chrome and reserved video slot verified.');

const frameCSS = readFileSync('styles/verci-stage.css', 'utf8');
assert.ok(!/border-radius:(?:50|54)px/.test(frameCSS), 'no capsule-like native phone overrides');
assert.match(frameCSS, /\.phone\.nd-ios\{[^}]*border-radius:15% \/ 7%/, 'template corner radius is relative to the phone, never the stage');
assert.doesNotMatch(frameCSS, /\.phone(?:\.nd-wa|\.nd-ios)?\{[^}]*border-radius:\d+cqw/, 'cqw on the phone itself resolves against the stage and clips the corners');
assert.match(frameCSS, /\.nd-wa \.sb\{[^}]*height:15\.9cqw/, '62pt status bar');
assert.match(frameCSS, /header \.nav-actions\{height:11\.3cqw/, '44pt action row');
assert.match(frameCSS, /header \.nav-title\{height:15\.6cqw/, '61pt title row');
assert.match(frameCSS, /header:has\(> \.bk\)\{display:grid;[^}]*grid-template-rows:11\.3cqw 15\.6cqw/, 'cached flat header DOM still lays out in action/title rows');
assert.match(frameCSS, /\.nd-wa \.b\{[^}]*font-size:4\.1cqw/, 'message text scales with the phone instead of inheriting the desktop font');
assert.match(frameCSS, /\.nd-wa \.b\.in\.tail::before\{[^}]*clip-path:/, 'incoming bubbles retain a shaped tail');
assert.match(frameCSS, /\.nd-wa \.kr i:not\(\.sp\):not\(\.space\)\.down::after\{[^}]*top:-1cqw/, 'pressed key stays below the suggestions');
assert.match(frameCSS, /\.nd-wa footer\{height:15\.9cqw/, '62pt composer');
assert.match(frameCSS, /\.nd-wa \.phone-home\{height:8\.7cqw/, '34pt home safe area');
assert.match(frameCSS, /\.phone\.nd-wa:not\(:has\(> \.phone-home\)\)\{padding-bottom:8\.7cqw/, 'cached renderers without a home element still reserve its safe area');
const Messages = STYLES.find(style => style.id === 'native-messages').make;
const chat = new Messages(document.getElementById('stage'), {song:{title:'Test',artist:'Artist'},lyrics:L}).mount();
assert.ok(chat.ph.querySelector('header > .nav-actions'), 'navigation actions have their own row');
assert.ok(chat.ph.querySelector('header > .nav-title .chat-contact'), 'navigation title has its own row');
assert.equal(chat.ph.querySelector('.phone-home').previousElementSibling, chat.kbw, 'home safe area stays visible when the keyboard is closed');
assert.ok(chat.ph.querySelector('.phone-home .home-indicator'), 'home indicator is outside the hidden keyboard');
chat.destroy();
