import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { parseLRC } from '../../src/vendor/verci/lrc.js';
import { parseTTML } from '../../src/vendor/verci/ttml.js';
import { frameState } from '../../src/vendor/verci/viz/core.js';
import { Messages } from '../../src/vendor/verci/viz/native.js';

const dom = new JSDOM('<main id="stage"></main>');
globalThis.document = dom.window.document;
globalThis.DOMParser = dom.window.DOMParser;
globalThis.requestAnimationFrame = fn => { fn(); return 1; };
const root = document.getElementById('stage');
const opts = { listenerReplies:()=>false, emojis:()=>false, gifs:()=>false, stickers:()=>false, textReactions:()=>false };
const ctx = lyrics => ({ song:{title:'Long song',artist:'Singer',artwork:''}, lyrics, opts, duration:()=>180 });
const src = Array.from({length:40}, (_,i) => {
  const t=i*3, stamp=`[${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}]`;
  return `${stamp}${i && i % 5 === 0 ? '(Ah) ' : ''}Line ${i} stays in the chat`;
});
// A gap line must not erase anything, including on a seek directly into it.
src.push('[00:34.50]');
const L = parseLRC(src.join('\n'));
const lyricIndex = n => L.lines.findIndex(line => line.text.includes(`Line ${n} stays`));
const expectedRows = index => L.lines.slice(0,index+1).filter(line => line.text).length;
const expectedBubbles = index => L.lines.slice(0,index+1).reduce((count,line) => count + (line.text ? 1 + Number(line.text.startsWith('(Ah)')) : 0),0);
let viz = new Messages(root, ctx(L)).mount();
for (let i=0;i<40;i++) viz.frame(frameState(L,i*3+.2),.016);
assert.equal(viz.rows.length,40,'every lyric line stays, not just the last nine');
assert.equal(viz.inner.querySelectorAll(':scope > .b').length,expectedBubbles(L.lines.length-1),'both main lyrics and extracted asides remain in order');
assert.equal(viz.inner.querySelector('.b p').textContent,'Line 0 stays in the chat');
assert.deepEqual(viz.rows.map(r=>r.index).slice(0,3),[lyricIndex(39),lyricIndex(38),lyricIndex(37)]);
const first = viz.rows.at(-1).el;
viz.chatInteractions.record(0).reaction = '❤️';
viz.chatInteractions.refresh(0);
assert.ok(first.querySelector('.chat-reaction-pill'),'an early lyric keeps its reaction');
const before = viz.rows[0].el.querySelector('time').textContent;
const early = lyricIndex(17);
viz.frame(frameState(L,L.lines[early].t+.2),.016);
assert.equal(viz.rows.length,expectedRows(early),'rewinding drops only future lines');
assert.equal(viz.rows.at(-1).el,first,'rewinding does not discard earlier DOM or its reactions');
assert.ok(first.querySelector('.chat-reaction-pill'));
assert.equal(viz.inner.querySelectorAll(':scope > .b').length,expectedBubbles(early));
viz.frame(frameState(L,L.lines[lyricIndex(39)].t+.2),.016);
assert.equal(viz.rows.length,40,'replaying forward fills the missing portion exactly once');
assert.equal(viz.inner.querySelectorAll(':scope > .b').length,expectedBubbles(L.lines.length-1));
assert.equal(viz.rows.at(-1).el,first,'earlier messages survive replay');
assert.equal(viz.rows[0].el.querySelector('time').textContent,before,'resending a lyric does not change its wall-clock timestamp');
assert.equal(new Set(viz.rows.map(row=>row.index)).size,40,'one group per lyric after seeks');
viz.frame(frameState(L,-1),.016);
assert.equal(viz.rows.length,0,'seeking before the first lyric does not show future messages');
assert.ok(viz.inner.querySelector('.chip'),'chat shell remains after seeking to the start');
viz.frame(frameState(L,35),.016);
const gapIndex = lyricIndex(11);
assert.equal(viz.rows.length,expectedRows(gapIndex),'seeking into an instrumental gap reconstructs earlier chat');
assert.equal(viz.inner.querySelectorAll(':scope > .b').length,expectedBubbles(gapIndex));
viz.destroy();

// Direct initial seeks build every elapsed message; a new song starts a new log.
// jsdom has no ResizeObserver, so invoke its callback to model a late reply/GIF
// or keyboard resize without relying on a new playback frame.
const nativeResizeObserver = globalThis.ResizeObserver;
let observer;
globalThis.ResizeObserver = class {
  constructor(callback) { this.callback = callback; this.elements = []; observer = this; }
  observe(element) { this.elements.push(element); }
  notify() { this.callback([]); }
  disconnect() { this.disconnected = true; }
};
viz = new Messages(root,ctx(L)).mount();
assert.deepEqual(observer.elements,[viz.inner,viz.thread],'both message growth and keyboard resizing keep the latest message visible');
let geometryReads=0;
viz.el.getBoundingClientRect=()=>{geometryReads++;return {width:320,height:640};};
viz.frame(frameState(L,L.lines[early].t+.2),.016);
assert.equal(viz.rows.length,expectedRows(early));
assert.equal(viz.inner.querySelector('.b p').textContent,'Line 0 stays in the chat');
assert.ok(viz.inner.querySelector('.chat-reaction-pill'),'an earlier local reaction remains visible after remount');
const thread = viz.thread;
assert.equal(thread.tabIndex,0,'history can receive keyboard scrolling focus');
assert.equal(thread.getAttribute('aria-label'),'Lyric chat history');
// jsdom has no layout. Simulate a tall scroll region to verify follow/pause rules.
let scrollTop=0, scrollHeight=600, heightReads=0, topWrites=0;
Object.defineProperty(thread,'clientHeight',{value:100,configurable:true});
Object.defineProperty(thread,'clientWidth',{value:200,configurable:true});
Object.defineProperty(thread,'scrollHeight',{get:()=>{heightReads++;return scrollHeight;},configurable:true});
Object.defineProperty(thread,'scrollTop',{get:()=>scrollTop,set:n=>{topWrites++;scrollTop=Math.max(0,Math.min(n,scrollHeight-100));},configurable:true});
viz.scrollToLatest();assert.equal(scrollTop,500,'the newest lyric stays in view during playback');
scrollHeight=650;
thread.dispatchEvent(new dom.window.Event('scroll'));
assert.equal(viz.following,true,'a layout-driven scroll event cannot silently disable auto-follow');
observer.notify();assert.equal(scrollTop,550,'a late GIF or listener reply scrolls to the new bottom without another playback frame');
const writesBefore=topWrites,readsBefore=heightReads;
for(let i=0;i<80;i++)viz.frame(frameState(L,L.lines[early].t+.2),.016);
assert.equal(topWrites,writesBefore,'unchanged frames never write scrollTop (which forces full-history layout)');
assert.equal(heightReads,readsBefore,'unchanged frames never measure the entire history');
assert.equal(geometryReads,0,'CSS-only chat frames never force layout by measuring the stage');
// Updating the animated composer must not measure the retained conversation
// for each typed character; its ResizeObserver handles actual size changes.
const typingIndex=L.lines.findIndex((line,i)=>i>early && i<39 && viz.outgoing(viz.P.T[i+1]));
assert.ok(typingIndex>early,'fixture contains a later outgoing typing interval');
viz.frame(frameState(L,L.lines[typingIndex].t+.7),.016);
const typingReads=heightReads,typingWrites=topWrites;
const composers=[];
for(const t of [1,1.3,1.6,1.9,2.2,2.5]){
  viz.frame(frameState(L,L.lines[typingIndex].t+t),.016);
  composers.push(viz.shown);
}
assert.ok(new Set(composers).size>1,'the outgoing composer still types');
assert.equal(topWrites,typingWrites,'typing text alone never forces a full-history scroll with ResizeObserver');
assert.equal(heightReads,typingReads,'typing text alone never measures the chat height');
assert.equal(geometryReads,0,'typing text does not force a stage measurement either');
scrollHeight+=40;observer.notify();
assert.equal(scrollTop,scrollHeight-100,'a composer size change still follows through ResizeObserver');
thread.dispatchEvent(new dom.window.WheelEvent('wheel',{deltaY:-80,bubbles:true}));
scrollTop=70;thread.dispatchEvent(new dom.window.Event('scroll'));
assert.equal(viz.following,false,'deliberately scrolling to old messages pauses auto-follow');
scrollHeight=700;
viz.frame(frameState(L,L.lines[lyricIndex(39)].t+.2),.016);
assert.equal(viz.rows.length,40,'fast-forward fills the entire history while the user reads earlier messages');
assert.equal(viz.following,false,'a forward jump or skipped lyric must not re-enable auto-follow');
observer.notify();assert.equal(scrollTop,70,'late content must not drag the user away from older history');
scrollTop=596;thread.dispatchEvent(new dom.window.Event('scroll'));
assert.equal(viz.following,true,'returning near the bottom resumes auto-follow');
assert.equal(viz.userScrollUntil,0,'an old browse gesture cannot later stop a resumed feed');
scrollHeight=800;observer.notify();assert.equal(scrollTop,700,'keyboard height changes still follow the bottom');
thread.dispatchEvent(new dom.window.WheelEvent('wheel',{deltaY:40,bubbles:true}));
scrollHeight=830;thread.dispatchEvent(new dom.window.Event('scroll'));
assert.equal(viz.following,true,'scrolling down must not mistake a keyboard resize for a request to pause playback');
observer.notify();assert.equal(scrollTop,730);
thread.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'PageUp',bubbles:true}));
scrollTop=200;thread.dispatchEvent(new dom.window.Event('scroll'));
assert.equal(viz.following,false,'keyboard browsing also pauses auto-follow');
scrollHeight=850;observer.notify();assert.equal(scrollTop,200);
scrollTop=750;thread.dispatchEvent(new dom.window.Event('scroll'));
assert.equal(viz.following,true,'keyboard users can resume by returning to the bottom');
const touch = (type,y) => {
  const event = new dom.window.Event(type,{bubbles:true});
  Object.defineProperty(event,'touches',{value:[{clientY:y}]});
  thread.dispatchEvent(event);
};
touch('touchstart',100);touch('touchmove',125);
scrollTop=350;thread.dispatchEvent(new dom.window.Event('scroll'));
assert.equal(viz.following,false,'swiping down to read history pauses auto-follow on touchscreens');
scrollHeight=900;observer.notify();assert.equal(scrollTop,350);
scrollTop=800;thread.dispatchEvent(new dom.window.Event('scroll'));
assert.equal(viz.following,true,'touch users can resume by returning to the bottom');
viz.destroy();
assert.equal(observer.disconnected,true,'the resize watcher is removed with the stage');
if (nativeResizeObserver === undefined) delete globalThis.ResizeObserver;
else globalThis.ResizeObserver = nativeResizeObserver;
const newLyrics=parseLRC('[00:00]An entirely different song');
viz=new Messages(root,ctx(newLyrics)).mount();viz.frame(frameState(newLyrics,.2),.016);
assert.equal(viz.inner.querySelectorAll(':scope > .b').length,1,'a different song starts with its own conversation');
assert.equal(viz.inner.querySelector('.b p').textContent,'An entirely different song');
if(!nativeResizeObserver){
  let fallbackReads=0;
  Object.defineProperty(viz.thread,'scrollHeight',{get:()=>{fallbackReads++;return 200;},configurable:true});
  viz.frame(frameState(newLyrics,.3),.016);
  assert.ok(fallbackReads>0,'without ResizeObserver, legacy frame following still works');
}
viz.destroy();

const tt = Array.from({length:22},(_,i)=>`<p begin="${Math.floor(i/2)*2}s" end="${Math.floor(i/2)*2+1.8}s" ttm:agent="v${1+i%2}">Voice ${i} sings</p>`).join('');
const T=parseTTML(`<tt xmlns="http://www.w3.org/ns/ttml" xmlns:ttm="http://www.w3.org/ns/ttml#metadata"><head><metadata><ttm:agent xml:id="v1"><ttm:name>Alice</ttm:name></ttm:agent><ttm:agent xml:id="v2"><ttm:name>Bob</ttm:name></ttm:agent></metadata></head><body><div>${tt}</div></body></tt>`);
const duet = new Messages(root,ctx(T)).mount();
for(let t=0;t<=20;t+=2) duet.frame(frameState(T,t+.2),.016);
assert.equal(duet.rows.length,22,'simultaneous TTML singers retain the complete duet, not a nine-line window');
assert.equal(duet.inner.querySelectorAll(':scope > .b').length,22);
const firstDuet=duet.rows.at(-1).el;
duet.frame(frameState(T,8.2),.016);
assert.equal(duet.rows.length,10,'backward seek only removes later TTML turns');
assert.equal(duet.rows.at(-1).el,firstDuet);
duet.frame(frameState(T,20.2),.016);
assert.equal(duet.rows.length,22,'forward TTML seek restores missing turns without duplicates');
assert.equal(duet.rows.at(-1).el,firstDuet);
duet.destroy();

const css=readFileSync('styles/verci-stage.css','utf8');
assert.match(css,/\.nd-wa \.thread\{[^}]*overflow-y:auto;[^}]*scrollbar-width:none/,'chat history is natively scrollable while keeping the wallpaper');
assert.match(css,/\.nd-wa \.inner\{position:relative;[^}]*transform:none!important/,'old translated strips cannot clip the retained history');
console.log('Full lyric history, seeks, TTML duets, scroll-up pause and auto-follow verified.');
