import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const story=(id='one',extra={})=>({id,cat:'devto',source:'DEV',title:'A real story '+id,subtitle:'Summary',link:'https://dev.to/'+id,...extra});
function setup(){
 const dom=new JSDOM('',{runScripts:'outside-only',url:'https://example.test'}),w=dom.window;
 w.os={};w.SystemState={settings:{}};w.WindowContents={};w.extendOS=x=>Object.assign(w.os,x);
 const template=fs.readFileSync('src/ui/templates/network-workspace-templates.js','utf8');w.eval('WindowContents.feed = '+template.slice(template.indexOf('    feed: `')+10,template.indexOf('    floor796: `')).trim().replace(/,$/,''));
 w.document.body.innerHTML=w.WindowContents.feed;w.eval(fs.readFileSync('src/modules/web-and-feeds.js','utf8'));return {dom,w,os:w.os};
}
const response=data=>({ok:true,json:async()=>data});
test('malformed saved data does not crash, unsafe saved URLs are rejected',()=>{
 const {dom,w,os}=setup();w.localStorage.setItem('aether_feed_saved_v1','{}');assert.equal(os._feedLoadSaved().length,0);os._feedSaved=null;w.localStorage.setItem('aether_feed_saved_v1',JSON.stringify([story(),story('bad',{link:'javascript:alert(1)'})]));assert.equal(os._feedLoadSaved().length,1);assert.equal(os.feedSafeLink('https://user:secret@example.org'),null);dom.window.close();
});
test('bookmark storage failures are disclosed and 100-entry limit is enforced in memory',()=>{
 const {dom,w,os}=setup();os._feedItems=[story()];os._feedSaved=[];Object.defineProperty(w,'localStorage',{get(){throw Error('denied');}});os.feedToggleSave('one');assert.equal(os._feedSaved.length,1);assert.match(w.document.getElementById('feed-status').textContent,/session-only/);os._feedSaved=Array.from({length:100},(_,i)=>story(String(i)));os.feedToggleSave('one');assert.equal(os._feedSaved.length,100);assert.match(w.document.getElementById('feed-status').textContent,/limit/);dom.window.close();
});
test('story cards are keyboard buttons and hostile titles/links do not execute',async()=>{
 const {dom,w,os}=setup();os._feedItems=[story('one',{title:'<img src=x onerror=alert(1)>',link:'javascript:alert(1)'})];os.feedRenderList();assert.equal(w.document.querySelector('#signal-stream-container img'),null);assert.equal(w.document.querySelector('.news-story-open').tagName,'BUTTON');await os.feedOpenItem('one');assert.equal(w.document.querySelector('#feed-reader-pane a'),null);assert.match(w.document.querySelector('#feed-reader-pane h2').textContent,/<img/);dom.window.close();
});
test('read/unread filtering and source switches clear stale readers without automatic article requests',async()=>{
 const {dom,w,os}=setup();os._feedItems=[story()];let calls=0;w.fetch=async()=>{calls++;throw Error('unexpected');};os.feedSetSource('devto');assert.equal(calls,0);await os.feedOpenItem('one');assert.equal(os._feedRead.has('one'),true);os.feedToggleUnread(w.document.getElementById('feed-unread'));assert.equal(w.document.querySelectorAll('.news-story-open').length,0);assert.equal(os._feedSelectedId,null);assert.match(w.document.getElementById('feed-reader-pane').textContent,/Choose a story/);dom.window.close();
});
test('late DEV detail responses cannot overwrite a newly selected story',async()=>{
 const {dom,w,os}=setup();os._feedItems=[story('slow',{devtoId:123}),story('next')];let resolve;w.fetch=async()=>await new Promise(r=>resolve=r);const slow=os.feedOpenItem('slow');await os.feedOpenItem('next');resolve(response({body_markdown:'OLD CONTENT'}));await slow;assert.doesNotMatch(w.document.getElementById('feed-reader-body').textContent,/OLD CONTENT/);assert.match(w.document.querySelector('#feed-reader-pane h2').textContent,/next/);dom.window.close();
});
test('failed providers preserve only their cached stories with explicit stale status, successful empty provider clears its old stories',async()=>{
 const {dom,w,os}=setup();os._feedItems=[story('cache',{cat:'hn',source:'Hacker News'}),story('old')];w.fetch=async url=>{if(url.startsWith('https://dev.to/'))return response([]);throw Error('offline');};await os.fetchSignals(true);assert.equal(os._feedItems.length,1);assert.equal(os._feedItems[0].id,'cache');assert.equal(os._feedItems[0].stale,true);assert.equal(os._feedSourceStatus.hn.state,'cached');assert.equal(os._feedSourceStatus.devto.state,'updated');assert.equal(os._feedSourceStatus.devto.count,0);assert.equal(os._feedSourceStatus.github.state,'failed');dom.window.close();
});
test('clip saves await failure/result and report session-only persistence',async()=>{
 const {dom,w,os}=setup();os._feedItems=[story()];await os.feedOpenItem('one');let resolve;w.AetherVFS={saveClipperItem:()=>new Promise(r=>resolve=r)};const pending=os.feedClip(story());assert.equal(w.document.getElementById('feed-clip-btn').disabled,true);resolve({persistence:'session-only'});await pending;assert.match(w.document.getElementById('feed-status').textContent,/Session-only/);w.AetherVFS.saveClipperItem=async()=>{throw Error('disk failed');};await os.feedClip(story());assert.match(w.document.getElementById('feed-status').textContent,/Clip failed/);assert.equal(w.document.getElementById('feed-clip-btn').disabled,false);dom.window.close();
});
test('close aborts pending source/detail requests and invalidates result publication',async()=>{
 const {dom,w,os}=setup();os._feedItems=[story('slow',{devtoId:123})];let resolve,signal;w.fetch=async(url,options)=>{signal=options.signal;return await new Promise(r=>resolve=r);};const pending=os.feedOpenItem('slow');os.feedDispose();assert.equal(signal.aborted,true);resolve(response({body_markdown:'LATE'}));await pending;assert.doesNotMatch(w.document.getElementById('feed-reader-body').textContent,/LATE/);dom.window.close();
});
