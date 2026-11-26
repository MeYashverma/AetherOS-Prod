import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
function setup(){
 const dom=new JSDOM('',{runScripts:'outside-only',url:'https://example.test',pretendToBeVisual:true}),w=dom.window;
 w.os={};w.SystemState={windows:{photobooth:{isOpen:true}}};w.extendOS=x=>Object.assign(w.os,x);w.HTMLMediaElement.prototype.play=async()=>{};w.HTMLMediaElement.prototype.pause=()=>{};
 w.eval(fs.readFileSync('src/modules/native-media-studios.js','utf8'));w.document.body.innerHTML=w.WindowContents.photobooth;w.os.pbState.offscreen={};w.os.pbState.frameSource='demo';w.os.pbSnapFrame=()=>({toDataURL:()=> 'data:image/png;base64,QA'});
 return {dom,w,os:w.os};
}
test('camera is opt-in and demo status is explicit; effect controls are keyboard buttons',()=>{
 const {dom,w,os}=setup();os.pbSourceUI();assert.match(w.document.getElementById('pb-cam-status').textContent,/demo.*camera off/);assert.equal(w.document.querySelectorAll('button[data-pb-effect]').length,9);os.pbSetEffect('noir');assert.equal(w.document.querySelector('[data-pb-effect=noir]').getAttribute('aria-pressed'),'true');os.pbSetEffect('bad');assert.equal(os.pbState.effect,'noir');dom.window.close();
});
test('capture is session-only until explicitly saved and gallery is bounded at 12',async()=>{
 const {dom,w,os}=setup();w.document.getElementById('pb-timer').value='0';let saves=0;w.AetherVFS={putFile:async()=>saves++};for(let i=0;i<14;i++)await os.pbTriggerCapture();assert.equal(saves,0);assert.equal(os.pbState.photos.length,12);assert.equal(os.pbState.photos[0].source,'demo');assert.equal(os.pbState.busy,false);assert.equal(w.document.querySelectorAll('.pb-photo-card a[download]').length,12);assert.match(w.document.getElementById('pb-status').textContent,/Demo image/);dom.window.close();
});
test('timer uses full seconds and cancellation discards a pending shot',async()=>{
 const {dom,w,os}=setup();let delay;w.setTimeout=(fn,ms)=>{delay=ms;return 1;};w.clearTimeout=()=>{};const pending=os.pbTriggerCapture();assert.equal(delay,1000);assert.equal(os.pbState.busy,true);os.pbCancelCapture();await pending;assert.equal(os.pbState.photos.length,0);assert.equal(os.pbState.busy,false);assert.equal(w.document.getElementById('pb-cancel').disabled,true);dom.window.close();
});
test('capture failures release busy state and report errors without false saving',async()=>{
 const {dom,w,os}=setup();w.document.getElementById('pb-timer').value='0';os.pbSnapFrame=()=>{throw Error('canvas failed');};await os.pbTriggerCapture();assert.equal(os.pbState.busy,false);assert.equal(os.pbState.photos.length,0);assert.match(w.document.getElementById('pb-status').textContent,/Capture failed/);dom.window.close();
});
test('Files save awaits results and retains a downloadable photo after failure or session-only copy',async()=>{
 const {dom,w,os}=setup();w.document.getElementById('pb-timer').value='0';await os.pbTriggerCapture();const photo=os.pbState.photos[0];let resolve;w.AetherVFS={putFile:()=>new Promise(r=>resolve=r)};const pending=os.pbSavePhoto(photo.id);assert.equal(photo.saving,true);resolve({persistence:'session-only'});await pending;assert.equal(photo.saved,false);assert.match(w.document.getElementById('pb-status').textContent,/Session-only/);w.AetherVFS.putFile=async()=>{throw Error('quota');};await os.pbSavePhoto(photo.id);assert.equal(photo.saving,false);assert.ok(w.document.querySelector('a[download]'));assert.match(w.document.getElementById('pb-status').textContent,/Save failed/);dom.window.close();
});
test('late camera permission after cancellation stops tracks; microphone is not requested',async()=>{
 const {dom,w,os}=setup();let resolve,options,stops=0;Object.defineProperty(w.navigator,'mediaDevices',{value:{getUserMedia:async value=>{options=value;return await new Promise(r=>resolve=r);}}});const pending=os.pbToggleWebcam();assert.equal(os.pbState.requesting,true);await os.pbToggleWebcam();resolve({getTracks:()=>[{stop(){stops++;}}]});await pending;assert.equal(stops,1);assert.equal(options.audio,false);assert.equal(os.pbState.webcamStream,null);assert.equal(os.pbState.requesting,false);dom.window.close();
});
test('permission denial is honest and unsupported imported files keep the current source',async()=>{
 const {dom,w,os}=setup();Object.defineProperty(w.navigator,'mediaDevices',{value:{getUserMedia:async()=>{const error=Error();error.name='NotAllowedError';throw error;}}});await os.pbToggleWebcam();assert.match(w.document.getElementById('pb-status').textContent,/permission denied/);await os.pbImportImage({type:'image/svg+xml',size:2});assert.equal(os.pbState.image,null);assert.match(w.document.getElementById('pb-status').textContent,/PNG, JPEG or WebP/);dom.window.close();
});
test('image decode is bounded and late decodes cannot replace a newer source choice',async()=>{
 const {dom,w,os}=setup();let resolve,closed=0;w.createImageBitmap=async()=>await new Promise(r=>resolve=r);const pending=os.pbImportImage({type:'image/png',size:20});os.pbUseDemo();resolve({width:100,height:100,close(){closed++;}});await pending;assert.equal(os.pbState.image,null);assert.equal(closed,1);w.createImageBitmap=async()=>({width:5000,height:5000,close(){closed++;}});await os.pbImportImage({type:'image/png',size:20});assert.equal(closed,2);assert.match(w.document.getElementById('pb-status').textContent,/16 megapixels/);dom.window.close();
});
test('capture requires a fresh frame matching the selected source',async()=>{
 const {dom,w,os}=setup();os.pbState.image={};os.pbState.frameSource='demo';await os.pbTriggerCapture();assert.equal(os.pbState.photos.length,0);assert.match(w.document.getElementById('pb-status').textContent,/fresh image/);dom.window.close();
});
test('switching sources invalidates the previous frame even for the same source type',async()=>{
 const {dom,os}=setup();os.pbUseDemo();assert.equal(os.pbState.frameSource,null);await os.pbTriggerCapture();assert.equal(os.pbState.photos.length,0);dom.window.close();
});
