import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const book=(id=1)=>({id,title:'Book '+id,authors:[{name:'Author'}],download_count:123,formats:{'text/plain':'https://www.gutenberg.org/book-'+id+'.txt'}});
function setup(){
 const dom=new JSDOM('',{runScripts:'outside-only',url:'https://example.test',pretendToBeVisual:true}),w=dom.window;
 w.os={};w.SystemState={settings:{}};w.WindowContents={};w.extendOS=x=>Object.assign(w.os,x);w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;
 w.eval(fs.readFileSync('src/modules/live-world-and-science-apis.js','utf8'));w.document.body.innerHTML=w.WindowContents.gutendex;return {dom,w,os:w.os};
}
const json=data=>({ok:true,json:async()=>data});
const text=value=>({ok:true,text:async()=>value});
test('catalog does not auto-open books, counts downloads not reads, and safe covers are restricted',async()=>{
 const {dom,w,os}=setup();let calls=0;w.fetch=async()=>{calls++;return json({results:[book()],next:null});};await os.gdSearch('author');assert.equal(calls,1);assert.match(w.document.getElementById('gd-list').textContent,/123 downloads/);assert.equal(os.gdState.activeID,null);assert.equal(os.gdSafeURL('https://gutenberg.org.evil.test/book'),null);assert.equal(os.gdSafeURL('https://u:p@www.gutenberg.org/x'),null);dom.window.close();
});
test('empty search differs from failed provider and pagination cannot follow arbitrary next URLs',async()=>{
 const {dom,w,os}=setup();let url;w.fetch=async u=>{url=u;return json({results:[],next:'https://evil.test/page'});};await os.gdSearch('a & b');assert.match(w.document.getElementById('gd-list').textContent,/No books match/);await os.gdPage(1);assert.match(url,/^https:\/\/gutendex.com\/books\/\?search=a%20%26%20b&page=2$/);w.fetch=async()=>{throw Error('offline');};await os.gdSearch('test');assert.match(w.document.getElementById('gd-list').textContent,/Catalog unavailable/);dom.window.close();
});
test('stale catalog and book results cannot replace newer selections',async()=>{
 const {dom,w,os}=setup();let resolve;w.fetch=async url=>url.includes('slow')?await new Promise(r=>resolve=r):json({results:[book(2)]});const old=os.gdSearch('slow');await os.gdSearch('fast');resolve(json({results:[book(1)]}));await old;assert.equal(os.gdState.books[0].id,2);
 os.gdState.books=[book(1),book(2)];w.fetch=async url=>url.includes('book-1')?await new Promise(r=>resolve=r):text('NEW TEXT');const first=os.gdOpenBook(0);await os.gdOpenBook(1);resolve(text('OLD TEXT'));await first;assert.equal(w.document.getElementById('gd-reader-body').textContent,'NEW TEXT');dom.window.close();
});
test('book fetch failure never contacts public relays or substitutes metadata as full text',async()=>{
 const {dom,w,os}=setup();os.gdState.books=[book()];const urls=[];w.fetch=async url=>{urls.push(url);throw Error('blocked');};await os.gdOpenBook(0);assert.equal(urls.length,1);assert.match(urls[0],/^https:\/\/www.gutenberg.org/);assert.match(w.document.getElementById('gd-reader-body').textContent,/No public relay/);assert.equal(os.gdState.text,'');dom.window.close();
});
test('reader refuses oversize streams and cancels them rather than silently truncating',async()=>{
 const {dom,os}=setup();let cancelled=false;const response={body:{getReader:()=>({read:async()=>({value:new Uint8Array(2097153),done:false}),cancel:async()=>cancelled=true,releaseLock(){}})}};
 await assert.rejects(os.gdReadText(response),/2 MiB/);assert.equal(cancelled,true);await assert.rejects(os.gdReadText({headers:{get:()=>3000000}}),/2 MiB/);dom.window.close();
});
test('font limits, theme validation, and hostile text stay safe',()=>{
 const {dom,w,os}=setup();os.gdShowText('<img src=x onerror=alert(1)>','<script>','local');assert.equal(w.document.querySelector('#gd-reader-body img'),null);assert.equal(w.document.querySelector('#gd-book-bar script'),null);os.gdAdjustFont(100);assert.equal(os.gdState.fontSize,28);os.gdAdjustFont(-100);assert.equal(os.gdState.fontSize,14);os.gdSetTheme('sepia');os.gdSetTheme('bad');assert.equal(w.document.getElementById('gd-reader-wrap').dataset.readingTheme,'sepia');dom.window.close();
});
test('reading progress saves a fraction and storage denial is explicitly session-only',()=>{
 const {dom,w,os}=setup();os.gdState.activeID=1;os.gdState.text='text';const body=w.document.getElementById('gd-reader-body');Object.defineProperties(body,{scrollHeight:{value:1000},clientHeight:{value:200}});body.scrollTop=400;os.gdSavePosition();assert.equal(JSON.parse(w.localStorage.getItem('aether_book_positions_v1'))['1'],.5);Object.defineProperty(w,'localStorage',{get(){throw Error('denied');}});body.scrollTop=600;os.gdSavePosition();assert.equal(os.gdState.positions[1],.75);assert.match(w.document.getElementById('gd-status').textContent,/this tab only/);dom.window.close();
});
test('local import is bounded, does not upload, and rejected files retain the loaded text',async()=>{
 const {dom,w,os}=setup();let calls=0;w.fetch=async()=>{calls++;};await os.gdImportText({name:'note.txt',size:5,text:async()=>'HELLO'});assert.equal(calls,0);assert.equal(os.gdState.text,'HELLO');await os.gdImportText({name:'big.txt',size:3000000});assert.equal(os.gdState.text,'HELLO');assert.match(w.document.getElementById('gd-status').textContent,/2 MiB/);dom.window.close();
});
test('close aborts online requests and prevents late text publication',async()=>{
 const {dom,w,os}=setup();os.gdState.books=[book()];let resolve,signal;w.fetch=async(url,options)=>{signal=options.signal;return await new Promise(r=>resolve=r);};const pending=os.gdOpenBook(0);os.gdDispose();assert.equal(signal.aborted,true);resolve(text('LATE'));await pending;assert.notEqual(w.document.getElementById('gd-reader-body').textContent,'LATE');dom.window.close();
});
test('loaded text restores the saved fraction after layout without depending on animation frames',async()=>{
 const {dom,w,os}=setup(),body=w.document.getElementById('gd-reader-body');Object.defineProperties(body,{scrollHeight:{value:1000},clientHeight:{value:200}});os.gdState.positions[1]=.5;os.gdShowText('READER TEXT','Book',1);await new Promise(resolve=>setTimeout(resolve,20));assert.equal(body.scrollTop,400);assert.equal(os.gdState.restoring,false);assert.match(w.document.getElementById('gd-progress-label').textContent,/50%/);dom.window.close();
});
