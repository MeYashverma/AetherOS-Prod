import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
function setup(){
 const dom=new JSDOM('',{runScripts:'outside-only',url:'https://aether.test'}),w=dom.window;
 w.os={};w.extendOS=x=>Object.assign(w.os,x);w.confirm=()=>true;w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};
 w.eval(fs.readFileSync('src/modules/opensource-webapps-suite.js','utf8'));
 w.document.body.innerHTML=w.WindowContents.photopea+w.WindowContents.whiteboard;
 const pp=w.document.getElementById('pp-frame'),oc=w.document.getElementById('oc-frame'),sent=[];
 Object.defineProperty(pp,'contentWindow',{value:{postMessage:(data,origin)=>sent.push({kind:'pp',data,origin})}});Object.defineProperty(oc,'contentWindow',{value:{postMessage:(data,origin)=>sent.push({kind:'oc',data,origin})}});
 const photo=data=>({origin:'https://www.photopea.com',source:pp.contentWindow,data});const diagram=data=>({origin:'https://embed.diagrams.net',source:oc.contentWindow,data:JSON.stringify(data)});
 const ready=async()=>{w.os.ppStart();await w.os.ppReceive(photo('done'));};
 return {dom,w,os:w.os,pp,oc,sent,photo,diagram,ready,close:()=>{w.os.killPhotopea();w.os.killWhiteboard();dom.window.close();}};
}
test('both apps start disconnected with explicit third-party disclosures and preserved editor surfaces',()=>{
 const {w,os,pp,oc,close}=setup();os.initPhotopea();os.initWhiteboard();assert.equal(pp.src,'about:blank');assert.equal(oc.src,'about:blank');assert.ok(pp.hidden&&oc.hidden);assert.match(w.document.getElementById('pp-root').textContent,/third-party/i);assert.equal(w.document.querySelectorAll('.creative-engine').length,3);assert.ok(pp.hasAttribute('data-preserve-surface'));close();
});
test('Photopea readiness requires exact source/origin rather than an iframe load event',async()=>{
 const {os,pp,photo,close}=setup();os.ppStart();await os.ppReceive({...photo('done'),origin:'https://evil.test'});assert.equal(os.ppState.ready,false);await os.ppReceive({...photo('done'),source:null});assert.equal(os.ppState.ready,false);pp.dispatchEvent(new pp.ownerDocument.defaultView.Event('load'));assert.equal(os.ppState.ready,false);await os.ppReceive(photo('done'));assert.equal(os.ppState.ready,true);close();
});
test('Photopea queues bounded files only during a connection and sends them on readiness',async()=>{
 const {w,os,sent,photo,close}=setup();const buffer=new w.ArrayBuffer(10);assert.throws(()=>os.ppQueueBuffer(buffer),/Load Photopea/);os.ppStart();os.ppQueueBuffer(buffer);assert.equal(sent.length,0);await os.ppReceive(photo('done'));assert.equal(sent[0].data,buffer);assert.equal(sent[0].origin,'https://www.photopea.com');assert.throws(()=>os.ppQueueBuffer(new w.ArrayBuffer(0)),/non-empty/);close();
});
test('new canvas sizes are bounded and names are encoded as script string literals',async()=>{
 const {os,sent,ready,close}=setup();await ready();os.ppNewDoc(9000,9000,'bad');assert.equal(sent.length,0);os.ppNewDoc(100,100,'name";bad()');assert.equal(sent.length,1);assert.match(sent[0].data,/name\\";bad/);close();
});
test('Photopea export is gated, ignores unsolicited/wrong-source data, and reports awaited save results',async()=>{
 const {w,os,sent,photo,ready,close}=setup();await ready();let resolve,saves=0;w.AetherVFS={putFile:()=>{saves++;return new Promise(r=>resolve=r);}};const buffer=new w.Uint8Array([137,80,78,71,13,10,26,10]).buffer;
 await os.ppReceive(photo(buffer));assert.equal(saves,0);os.ppExportToVFS('png');assert.equal(os.ppState.busy,true);const count=sent.length;os.ppExportToVFS('webp');assert.equal(sent.length,count);await os.ppReceive({...photo(buffer),source:null});assert.equal(saves,0);
 const pending=os.ppReceive(photo(buffer));assert.equal(saves,1);assert.equal(os.ppState.busy,true);resolve({persistence:'session-only'});await pending;assert.equal(os.ppState.busy,false);assert.match(w.document.getElementById('pp-status').textContent,/Session-only/);assert.equal(w.document.getElementById('pp-download').hidden,false);close();
});
test('export failures leave a download; malformed buffers cannot become files',async()=>{
 const {w,os,photo,ready,close}=setup();await ready();w.AetherVFS={putFile:async()=>{throw Error('quota');}};os.ppExportToVFS('png');await os.ppReceive(photo(new w.Uint8Array([137,80,78,71,13,10,26,10]).buffer));assert.match(w.document.getElementById('pp-status').textContent,/quota.*Download last export/);assert.equal(w.document.getElementById('pp-download').hidden,false);os.ppExportToVFS('webp');await os.ppReceive(photo(new w.Uint8Array([1,2,3]).buffer));assert.match(w.document.getElementById('pp-status').textContent,/format/);assert.equal(os.ppState.busy,false);close();
});
test('Photopea close invalidates late local reads and export replies',async()=>{
 const {w,os,photo,ready,close}=setup();await ready();let resolve;const pending=os.ppImportFile({size:4,arrayBuffer:()=>new Promise(r=>resolve=r)});os.killPhotopea();resolve(new w.ArrayBuffer(4));await pending;assert.equal(os.ppState.pending,null);assert.equal(os.ppState.ready,false);assert.equal(os.ppState.awaitingExport,false);await os.ppReceive(photo('done'));assert.equal(os.ppState.ready,false);close();
});
test('whiteboard engine changes are allowlisted and cancellation preserves the current frame',()=>{
 const {w,os,oc,close}=setup();os.ocSetEngine('constructor');assert.equal(oc.src,'about:blank');os.ocSetEngine('drawio');const src=oc.src;w.confirm=()=>false;os.ocSetEngine('tldraw');assert.equal(oc.src,src);assert.equal(os.ocState.engine,'drawio');assert.equal(w.document.querySelector('[data-oc-eng=drawio]').getAttribute('aria-pressed'),'true');close();
});
test('drawio handshake loads a genuinely empty document and rejects wrong origins/sources',async()=>{
 const {os,sent,diagram,close}=setup();os.ocSetEngine('drawio');await os.ocReceive({...diagram({event:'init'}),origin:'https://evil.test'});assert.equal(sent.length,0);await os.ocReceive(diagram({event:'init'}));const load=JSON.parse(sent[0].data);assert.equal(load.action,'load');assert.doesNotMatch(load.xml,/AetherOS Architecture/);assert.equal(os.ocState.ready,true);close();
});
test('diagram XML validation rejects entities, non-diagrams, malformed and oversized input atomically',()=>{
 const {os,close}=setup();assert.throws(()=>os.ocValidateXml('<!DOCTYPE x><mxfile/>'),/entities/);assert.throws(()=>os.ocValidateXml('<svg/>'),/mxfile/);assert.throws(()=>os.ocValidateXml('<mxfile>'),/Expected/);assert.throws(()=>os.ocValidateXml('x'.repeat(2*1024*1024+1)),/2 MiB/);assert.equal(os.ocValidateXml('<mxfile/>'),'<mxfile/>');close();
});
test('diagram autosave is session-only; durable save is awaited and failures keep XML available',async()=>{
 const {w,os,diagram,close}=setup();os.ocSetEngine('drawio');await os.ocReceive(diagram({event:'init'}));await os.ocReceive(diagram({event:'autosave',xml:'<mxfile/>'}));assert.equal(os.ocState.drawioXml,'<mxfile/>');assert.match(w.document.getElementById('oc-status').textContent,/session/);let resolve;w.AetherVFS={putFile:()=>new Promise(r=>resolve=r)};const pending=os.ocSaveDiagram();assert.equal(os.ocState.saving,true);resolve({persistence:'indexeddb'});await pending;assert.match(w.document.getElementById('oc-status').textContent,/saved to Files/);w.AetherVFS.putFile=async()=>{throw Error('quota');};await os.ocSaveDiagram();assert.match(w.document.getElementById('oc-status').textContent,/quota.*downloadable/);assert.equal(os.ocState.drawioXml,'<mxfile/>');close();
});
test('late diagram imports cannot overwrite a newer engine choice or newer autosave',async()=>{
 const {os,diagram,close}=setup();os.ocSetEngine('drawio');let resolve;const pending=os.ocImportDiagram({size:10,text:()=>new Promise(r=>resolve=r)});os.ocSetEngine('excalidraw');resolve('<mxfile/>');await pending;assert.equal(os.ocState.drawioXml,'');os.ocSetEngine('drawio');await os.ocReceive(diagram({event:'init'}));const next=os.ocImportDiagram({size:10,text:()=>new Promise(r=>resolve=r)});await os.ocReceive(diagram({event:'autosave',xml:'<mxGraphModel/>'}));resolve('<mxfile/>');await next;assert.equal(os.ocState.drawioXml,'<mxGraphModel/>');close();
});
test('Photopea export timeout disables the bridge until reload, ignoring late buffers',async()=>{
 const {w,os,photo,ready,close}=setup();await ready();let timeout;w.setTimeout=(fn,ms)=>{if(ms===20000)timeout=fn;return 1;};os.ppExportToVFS('png');timeout();assert.equal(os.ppState.ready,false);assert.equal(os.ppState.awaitingExport,false);let saves=0;w.AetherVFS={putFile:async()=>saves++};await os.ppReceive(photo(new w.Uint8Array([137,80,78,71,13,10,26,10]).buffer));assert.equal(saves,0);assert.match(w.document.getElementById('pp-status').textContent,/reload/);close();
});
test('saving an older diagram snapshot never claims newer edits are saved',async()=>{
 const {w,os,diagram,close}=setup();os.ocSetEngine('drawio');await os.ocReceive(diagram({event:'init'}));await os.ocReceive(diagram({event:'autosave',xml:'<mxfile/>'}));let resolve;w.AetherVFS={putFile:()=>new Promise(r=>resolve=r)};const pending=os.ocSaveDiagram();await os.ocReceive(diagram({event:'autosave',xml:'<mxGraphModel/>'}));resolve({persistence:'indexeddb'});await pending;assert.match(w.document.getElementById('oc-status').textContent,/Earlier.*newer edits/);close();
});
test('creative workspaces keep chrome compact: a single top toolbar, inline presets/tabs, footer status',()=>{
 const {w,close}=setup();for(const id of ['pp-root','wb-canvas-root']){const root=w.document.getElementById(id);assert.equal(root.querySelectorAll('.studio-app-heading,.creative-starters,.creative-engine-cards').length,0);assert.equal(root.firstElementChild.className,'creative-toolbar');assert.ok(root.querySelector('.creative-footer [role=status]'));}
 assert.equal(w.document.querySelectorAll('select[aria-label="New canvas"] option[data-width]').length,3);assert.equal(w.document.querySelectorAll('.creative-engine-tabs button').length,3);close();
});
