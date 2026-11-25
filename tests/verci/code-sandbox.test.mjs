import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
function setup(){
 const dom=new JSDOM('',{runScripts:'outside-only',url:'https://example.test'}),w=dom.window;
 w.os={};w.extendOS=x=>Object.assign(w.os,x);w.confirm=()=>true;
 w.eval(fs.readFileSync('src/modules/dev-workbench.js','utf8'));w.document.body.innerHTML=w.WindowContents.codeplay;
 return {dom,w,os:w.os};
}
test('starts without running code; tab validation and keyboard editing preserve source',()=>{
 const {dom,w,os}=setup();os.initCodePlay();assert.equal(os.codeplayState.autoRun,false);assert.match(w.document.getElementById('codeplay-iframe').srcdoc,/Preview stopped/);
 os.codeplaySetTab('__proto__');assert.equal(os.codeplayState.tab,'html');os.codeplaySetTab('js');const ed=w.document.getElementById('codeplay-editor');ed.value='xy';ed.setSelectionRange(1,1);os.codeplayEditorKey({key:'Tab',target:ed,preventDefault(){}});assert.equal(os.codeplayState.js,'x  y');assert.equal(ed.getAttribute('aria-label'),'JS source code');dom.window.close();
});
test('preview uses restrictive policy and isolated frame while export has no parent bridge',()=>{
 const {dom,w,os}=setup();os.initCodePlay();os.codeplayRun();const frame=w.document.getElementById('codeplay-iframe');assert.equal(frame.getAttribute('sandbox'),'allow-scripts');assert.match(frame.srcdoc,/connect-src 'none'/);assert.match(frame.srcdoc,/form-action 'none'/);assert.match(frame.srcdoc,/parent.postMessage/);const exported=os.codeplayBuildHtml();assert.doesNotMatch(exported,/parent.postMessage|Content-Security-Policy/);os.codeplayStop();assert.doesNotMatch(frame.srcdoc,/Ready to build/);dom.window.close();
});
test('auto-run disabling cancels a queued run',async()=>{
 const {dom,w,os}=setup();let runs=0;os.codeplayRun=()=>runs++;os.codeplaySetAutoRun(true);os.codeplayOnInput('edited');os.codeplaySetAutoRun(false);await new Promise(r=>setTimeout(r,450));assert.equal(runs,0);assert.equal(os.codeplayState.html,'edited');dom.window.close();
});
test('draft roundtrip and denied storage report truthful state',()=>{
 const {dom,w,os}=setup();os.codeplayState.html='draft';os.codeplaySaveDraft();assert.match(w.document.getElementById('codeplay-status').textContent,/Draft saved/);os.codeplayState.html='other';os.initCodePlay();assert.equal(os.codeplayState.html,'draft');Object.defineProperty(w,'localStorage',{get(){throw Error('denied');}});os.codeplaySaveDraft();assert.match(w.document.getElementById('codeplay-status').textContent,/could not be saved/);assert.equal(os.codeplayState.html,'draft');dom.window.close();
});
test('import validates all fields, never executes, disables auto-run and preserves source on failure',async()=>{
 const {dom,w,os}=setup();os.codeplayState.autoRun=true;
 await os.codeplayImportProject({size:30,text:async()=>JSON.stringify({version:1,html:'<h1>Imported</h1>',css:'body{}',js:'throw Error("no run")'})});assert.equal(os.codeplayState.html,'<h1>Imported</h1>');assert.equal(os.codeplayState.autoRun,false);assert.match(w.document.getElementById('codeplay-iframe').srcdoc,/Preview stopped/);
 await os.codeplayImportProject({size:1,text:async()=>'{}'});assert.equal(os.codeplayState.html,'<h1>Imported</h1>');assert.match(w.document.getElementById('codeplay-status').textContent,/Import failed/);await os.codeplayImportProject({size:3000000});assert.match(w.document.getElementById('codeplay-status').textContent,/too large/);dom.window.close();
});
test('file save waits for result, blocks duplicate saves, reports failure and session-only copies',async()=>{
 const {dom,w,os}=setup();let resolve,calls=0;w.AetherVFS={putFile:()=>{calls++;return new Promise(r=>resolve=r);}};const pending=os.codeplaySaveToVFS();assert.equal(w.document.getElementById('codeplay-save').disabled,true);await os.codeplaySaveToVFS();assert.equal(calls,1);resolve({persistence:'session-only'});await pending;assert.match(w.document.getElementById('codeplay-status').textContent,/Session-only/);assert.equal(w.document.getElementById('codeplay-save').disabled,false);
 w.AetherVFS.putFile=async()=>{throw Error('disk failed');};await os.codeplaySaveToVFS();assert.match(w.document.getElementById('codeplay-status').textContent,/Save failed.*source kept/);dom.window.close();
});
test('console only accepts current frame messages and treats text as text, with bounded output',()=>{
 const {dom,w,os}=setup();os.codeplayRun();const frame=w.document.getElementById('codeplay-iframe'),host=w.document.getElementById('codeplay-console');const send=(source,text)=>w.dispatchEvent(new w.MessageEvent('message',{source,data:{__aetherSandbox:true,level:'log',text}}));send(w,'untrusted');assert.equal(host.children.length,0);send(frame.contentWindow,'<img src=x>');assert.equal(host.querySelector('img'),null);assert.match(host.textContent,/<img/);for(let i=0;i<205;i++)send(frame.contentWindow,String(i));assert.equal(host.children.length,200);os.codeplayStop();send(frame.contentWindow,'late log');assert.doesNotMatch(host.textContent,/late log/);dom.window.close();
});
