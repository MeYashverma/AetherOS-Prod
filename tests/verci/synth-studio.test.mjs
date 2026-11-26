import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
function setup(){
 const dom=new JSDOM('',{runScripts:'dangerously',url:'https://aether.test',pretendToBeVisual:true});const w=dom.window;
 w.os={};w.SystemState={windows:{synthstudio:{id:'synthstudio',isOpen:true,zIndex:10}}};w.extendOS=x=>Object.assign(w.os,x);
 w.eval(fs.readFileSync('src/modules/native-media-studios.js','utf8'));w.document.body.innerHTML=w.WindowContents.synthstudio;
 w.os.synthRenderKeys();w.os.synthRenderSequencer();
 return {dom,w,os:w.os,close:()=>{w.os.killSynthStudio();dom.window.close();}};
}
function audio(w){
 const events=[];const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(value){this.value=value;}});
 const node=()=>({gain:param(),frequency:param(),detune:param(),connect(){},disconnect(){},start(time){events.push(['start',time]);},stop(){events.push(['stop']);},getByteTimeDomainData(buf){buf.fill(128);}});
 const ctx={currentTime:1,sampleRate:48000,state:'running',destination:{},createGain:node,createAnalyser:node,createDynamicsCompressor:node,createBiquadFilter:node,createOscillator:node,createBufferSource:node,createBuffer:(channels,length)=>({getChannelData:()=>new Float32Array(length)})};
 w.AudioContext=function(){return ctx;};w._aetherStudioCtx=ctx;return {ctx,events};
}
test('starts with an empty editable pattern, accessible cells, and touch/keyboard piano buttons',()=>{
 const {w,os,close}=setup();assert.equal(os.synthState.grid.flat().reduce((a,b)=>a+b,0),0);assert.equal(w.document.querySelectorAll('[data-seq-cell]').length,64);
 const cell=w.document.querySelector('[data-seq-cell="0-0"]');assert.equal(cell.getAttribute('aria-label'),'Kick step 1');cell.click();assert.equal(os.synthState.grid[0][0],1);assert.equal(cell.getAttribute('aria-pressed'),'true');assert.equal(w.document.querySelector('[data-piano-midi]').hasAttribute('onmousedown'),false);close();
});
test('presets are explicitly chosen and independent; clear resets all 64 cells',()=>{
 const {os,close}=setup();os.synthLoadGroove('house');const original=os.synthState.grid[0][0];os.synthToggleCell(0,0);os.synthLoadGroove('house');assert.equal(os.synthState.grid[0][0],original);os.synthClearPattern();assert.equal(os.synthState.grid.flat().some(Boolean),false);close();
});
test('control inputs are finite and bounded; invalid grid indices are ignored',()=>{
 const {os,close}=setup();os.synthSetBpm(500);assert.equal(os.synthState.bpm,200);os.synthSetBpm('bad');assert.equal(os.synthState.bpm,200);os.synthSetVolume(400);assert.equal(os.synthState.volume,.8);os.synthSetCutoff(-1);assert.equal(os.synthState.cutoff,300);os.synthShiftOctave(30);assert.equal(os.synthState.octaveOffset,2);os.synthShiftOctave(NaN);assert.equal(os.synthState.octaveOffset,2);os.synthToggleCell(-1,0);os.synthToggleCell(0,16);os.synthSetPatch('fake');assert.equal(os.synthState.patch,'rhodes');close();
});
test('pattern import validates atomically and does not alias input arrays',()=>{
 const {os,close}=setup();os.synthLoadGroove('trap');const pattern=os.synthPattern();const before=JSON.stringify(pattern);assert.throws(()=>os.synthApplyPattern({...pattern,bpm:Infinity}),/valid/);assert.throws(()=>os.synthApplyPattern({...pattern,patch:'__proto__'}),/valid/);os.synthLoadGroove('constructor');assert.equal(JSON.stringify(os.synthPattern()),before);assert.throws(()=>os.synthApplyPattern({...pattern,grid:[[1]]}),/valid/);os.synthApplyPattern(pattern);pattern.grid[0][0]=9;assert.notEqual(os.synthState.grid[0][0],9);assert.equal(os.synthState.playing,false);close();
});
test('save/load round-trip handles missing and blocked storage honestly',()=>{
 const {w,os,close}=setup();os.synthRestorePattern();assert.match(w.document.getElementById('synth-status').textContent,/No saved pattern/);os.synthLoadGroove('house');os.synthSavePattern();os.synthClearPattern();os.synthRestorePattern();assert.equal(os.synthState.grid[0][0],1);w.Storage.prototype.setItem=()=>{throw Error('blocked');};os.synthSavePattern();assert.match(w.document.getElementById('synth-status').textContent,/session-only/);close();
});
test('imports enforce size and discard late results after close',async()=>{
 const {w,os,close}=setup();await os.synthImportPattern({size:32769});assert.match(w.document.getElementById('synth-status').textContent,/32 KiB/);let resolve;const pending=os.synthImportPattern({size:10,text:()=>new Promise(r=>resolve=r)});const pattern=os.synthPattern();pattern.bpm=180;os.killSynthStudio();resolve(JSON.stringify(pattern));await pending;assert.equal(os.synthState.bpm,96);close();
});
test('Web Audio scheduler uses audio timestamps and does not catch up missed background beats',()=>{
 const {w,os,close}=setup();const {ctx}=audio(w);const hits=[];os.synthPlayDrum=(row,time)=>hits.push([row,time]);os.synthLoadGroove('house');os.synthToggleSequencer();assert.equal(os.synthState.playing,true);assert.ok(hits.length>0);assert.equal(hits[0][1],1.02);ctx.currentTime=100;const count=hits.length;os.synthSchedule();assert.ok(hits.length-count<=4);assert.ok(os.synthState.nextTime>=100);os.synthToggleSequencer();assert.equal(os.synthState.seqTimer,null);assert.equal(os.synthState.timers.size,0);close();
});
test('notes and drums feed the volume-controlled graph; panic stops tracked nodes',()=>{
 const {w,os,close}=setup();const {events}=audio(w);os.synthPlayNote(60);os.synthPlayDrum(0,2);assert.equal(os.synthState.sources.size,3);assert.equal(os.synthState.master.gain.value,.35);assert.ok(events.some(e=>e[0]==='start'&&e[1]===2));os.synthSetVolume(20);assert.equal(os.synthState.master.gain.value,.2);os.synthPanic();assert.equal(os.synthState.sources.size,0);assert.ok(events.filter(e=>e[0]==='stop').length>=6);close();
});
test('unsupported audio does not put transport into a false playing state',()=>{
 const {w,os,close}=setup();os.synthToggleSequencer();assert.equal(os.synthState.playing,false);assert.match(w.document.getElementById('synth-status').textContent,/unavailable/);close();
});
test('focused native controls do not double-trigger musical typing or the Space transport',()=>{
 const {w,os,close}=setup();let calls=0;os.synthToggleSequencer=()=>calls++;w.document.getElementById('synth-seq-btn').dispatchEvent(new w.KeyboardEvent('keydown',{key:' ',bubbles:true}));assert.equal(calls,0);w.document.body.dispatchEvent(new w.KeyboardEvent('keydown',{key:' ',bubbles:true}));assert.equal(calls,1);close();
});
