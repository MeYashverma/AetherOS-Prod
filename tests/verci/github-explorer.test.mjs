import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
function setup(){
 const dom=new JSDOM('',{runScripts:'outside-only',url:'https://example.test'}),w=dom.window;
 w.os={};w.extendOS=x=>Object.assign(w.os,x);w.TextDecoder=TextDecoder;
 w.eval(fs.readFileSync('src/modules/api-earth-archive-oss.js','utf8'));w.document.body.innerHTML=w.WindowContents.ossradar;
 return {dom,w,os:w.os};
}
const response=data=>({ok:true,json:async()=>data});
test('empty searches stay empty and rate limits never substitute invented statistics',async()=>{
 const {dom,w,os}=setup();w.fetch=async()=>response({items:[]});await os.ossSearch('empty');assert.equal(os.ossState.repos.length,0);assert.match(w.document.getElementById('oss-repo-list').textContent,/No repositories/);
 w.fetch=async()=>({ok:false,status:403,headers:{get:key=>key==='x-ratelimit-remaining'?'0':null}});await os.ossSearch('limited');assert.equal(os.ossState.repos.length,0);assert.match(w.document.getElementById('oss-repo-list').textContent,/rate limit reached/);dom.window.close();
});
test('later searches win even if an earlier server ignores cancellation',async()=>{
 const {dom,w,os}=setup();let resolve;w.fetch=async url=>url.includes('first')?await new Promise(r=>resolve=r):response({items:[{full_name:'new/repo',stargazers_count:4}]});
 const first=os.ossSearch('first');await os.ossSearch('second');resolve(response({items:[{full_name:'old/repo'}]}));await first;assert.equal(os.ossState.repos[0].full_name,'new/repo');assert.match(w.document.getElementById('oss-repo-list').textContent,/new\/repo/);dom.window.close();
});
test('repository and file API values are text, never injected event handlers',async()=>{
 const {dom,w,os}=setup();os.ossState.repos=[{full_name:'safe/repo',description:'<img src=x onerror=alert(1)>',stargazers_count:2}];os.ossRenderRepoList();assert.equal(w.document.querySelector('#oss-repo-list img'),null);
 w.fetch=async()=>response([{type:'file',name:"a'\"<img>.js",path:"a'\"<img>.js"}]);await os.ossInspectRepo('safe/repo');assert.equal(w.document.querySelector('#oss-file-tree img'),null);assert.match(w.document.getElementById('oss-file-tree').textContent,/<img>/);assert.equal(os.ossValidRepo('../repo'),false);assert.equal(os.ossValidRepo('bad/repo\');alert(1)'),false);dom.window.close();
});
test('ref and special paths are encoded and UTF-8 contents are displayed without execution',async()=>{
 const {dom,w,os}=setup();os.ossState.activeRepo='safe/repo';os.ossState.ref='feature/a#b';let url;
 const source='const name = "नमस्ते"; <img src=x>';
 w.fetch=async u=>{url=u;return response({type:'file',size:Buffer.byteLength(source),encoding:'base64',content:Buffer.from(source).toString('base64')});};
 await os.ossOpenPath('safe/repo',"src/it's #1.js",'file');assert.match(url,/src\/it.*%20%231.js\?ref=feature%2Fa%23b/);assert.equal(os.ossState.source,source);assert.equal(w.document.getElementById('oss-code-viewer').textContent,source);assert.equal(w.document.querySelector('#oss-code-viewer img'),null);dom.window.close();
});
test('oversized/binary sources and missing refs show errors rather than stale file text',async()=>{
 const {dom,w,os}=setup();os.ossState.activeRepo='safe/repo';os.ossState.source='old';w.fetch=async()=>response({type:'file',size:300000,encoding:'base64',content:''});await os.ossOpenPath('safe/repo','large.bin','file');assert.equal(os.ossState.source,'');assert.match(w.document.getElementById('oss-code-viewer').textContent,/256 KiB/);
 w.fetch=async()=>response({type:'file',size:3,encoding:'base64',content:'YQBi'});await os.ossOpenPath('safe/repo','binary','file');assert.match(w.document.getElementById('oss-code-viewer').textContent,/Binary/);
 w.fetch=async()=>({ok:false,status:404,headers:{get(){return null;}}});await os.ossOpenPath('safe/repo','','dir');assert.match(w.document.getElementById('oss-code-viewer').textContent,/not found/);dom.window.close();
});
test('navigation changes suppress stale file responses; close aborts active requests',async()=>{
 const {dom,w,os}=setup();os.ossState.activeRepo='safe/repo';let resolve,signal;
 w.fetch=async(url,options)=>{signal=options.signal;return await new Promise(r=>resolve=r);};const first=os.ossOpenPath('safe/repo','slow.txt','file');os.ossDispose();assert.equal(signal.aborted,true);resolve(response({type:'file',size:3,encoding:'base64',content:'b2xk'}));await first;assert.equal(os.ossState.source,'');dom.window.close();
});
test('clipboard denial never reports successful copying',async()=>{
 const {dom,w,os}=setup();Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async()=>{throw Error('denied');}}});await os.ossCopy('source','Source');assert.match(w.document.getElementById('oss-status').textContent,/denied/);dom.window.close();
});
test('source find highlights literal text safely; wrap and focus toggle real layout state',()=>{
 const {dom,w,os}=setup();os.ossState.source='<img> hello HELLO';os.ossFindSource('hello');assert.equal(w.document.querySelectorAll('#oss-code-viewer mark').length,2);assert.equal(w.document.querySelector('#oss-code-viewer img'),null);assert.match(w.document.getElementById('oss-find-count').textContent,/2 matches/);
 const button=w.document.createElement('button');os.ossToggleWrap(button);assert.equal(w.document.getElementById('oss-code-viewer').classList.contains('oss-wrap'),true);os.ossFocusSource(button);assert.equal(w.document.getElementById('oss-root').classList.contains('oss-source-focus'),true);os.ossFindSource('');assert.equal(w.document.getElementById('oss-code-viewer').textContent,os.ossState.source);dom.window.close();
});
test('entrypoint and offline cache request the same versioned Explorer implementation and explicit glass stylesheet',()=>{
 const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
 for(const asset of ['src/modules/api-earth-archive-oss.js?v=fleet-1','styles/github-workspace.css?v=glass-scroll-3']){assert.ok(html.includes(asset));assert.ok(sw.includes(asset));}
 const css=fs.readFileSync('styles/github-workspace.css','utf8');assert.match(css,/#oss-root #oss-file-tree/);assert.match(css,/prefers-reduced-transparency/);assert.match(css,/data-glass-clarity=solid/);
});
test('selected-source region is keyboard focusable and its layout chain allows internal scrolling',()=>{
 const {dom,w}=setup(),viewer=w.document.getElementById('oss-code-viewer');assert.equal(viewer.tabIndex,0);assert.equal(viewer.getAttribute('role'),'region');assert.match(viewer.getAttribute('aria-label'),/scrollable/);
 const css=fs.readFileSync('styles/github-workspace.css','utf8');
 assert.match(css,/#oss-root \.oss-source-workspace\{flex:1 1 0;min-height:0;min-width:0;grid-template-rows:minmax\(0,1fr\);overflow:hidden\}/);
 assert.match(css,/#oss-root #oss-code-viewer\{flex:1 1 0;min-height:0;min-width:0;max-height:100%;overflow:auto;/);
 dom.window.close();
});
