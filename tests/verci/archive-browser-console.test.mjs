import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const read=p=>fs.readFileSync(p,'utf8');
function setup(file,html=''){
 const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://example.test'}),w=dom.window;
 w.SystemState={settings:{},windows:{}};w.os={};w.extendOS=x=>Object.assign(w.os,x);w.TextEncoder=TextEncoder;
 w.lucide={createIcons(){}};w.eval(read(file));return {dom,w,os:w.os};
}
test('browser navigation is per-tab, supports forward and truncates only the forward branch',()=>{
 const {dom,w,os}=setup('src/modules/web-and-feeds.js','<input id="browser-url-input"><button id="browser-btn-back"></button><button id="browser-btn-fwd"></button>');
 os.browserFetchPreview=()=>{};os.browserRenderTabs=()=>{};os.browserRenderHistory=()=>{};
 os.browserLoadURL('https://example.org/a');os.browserLoadURL('https://example.org/b');os.browserLoadURL('https://example.org/c');assert.equal(os.browser.tabs.length,1);
 os.browserNav('back');assert.equal(os.browser.tabs[0].url,'https://example.org/b');assert.equal(w.document.getElementById('browser-btn-fwd').disabled,false);
 os.browserNav('forward');assert.equal(os.browser.tabs[0].url,'https://example.org/c');os.browserNav('back');os.browserLoadURL('https://example.org/d');
 assert.deepEqual(Array.from(os.browser.tabs[0].entries),['https://example.org/a','https://example.org/b','https://example.org/d']);assert.equal(w.document.getElementById('browser-btn-fwd').disabled,true);
 dom.window.close();
});
test('browser rejects executable and credential URLs; malformed saved history does not crash init',()=>{
 const {dom,w,os}=setup('src/modules/web-and-feeds.js');assert.equal(os.browserSafeURL('javascript:alert(1)'),null);assert.equal(os.browserSafeURL('https://user:secret@example.org'),null);
 w.localStorage.setItem('aetheros_bhistory','{bad');w.localStorage.setItem('aetheros_bookmarks','{}');os.initBrowser();assert.equal(os.browser.history.length,0);dom.window.close();
});
test('general reader does not send a URL to public proxies without consent',async()=>{
 const {dom,w,os}=setup('src/modules/web-and-feeds.js','<div id="browser-preview-content"></div>');
 let calls=0;w.fetch=async()=>{calls++;throw Error('network should not be used');};os.escapeHtml=x=>String(x);os.browserShowLaunchCard=()=>{};os.browser.tabs=[{id:'one'}];os.browser.activeTab='one';
 await os.browserFetchPreview('https://example.org/private-link','one','Example');assert.equal(calls,0);assert.equal(os.browser._relayAllowedUrl,undefined);dom.window.close();
});
test('closing an active browser tab loads the surviving tab rather than leaving stale content',()=>{
 const {dom,os}=setup('src/modules/web-and-feeds.js');os.browser.tabs=[{id:'a',url:'https://a.test'},{id:'b',url:'https://b.test'}];os.browser.activeTab='b';let switched;
 os.browserSwitchTab=id=>switched=id;os.browserRenderTabs=()=>{};os.browserUpdateNav=()=>{};os.browserCloseTab('b');assert.equal(switched,'a');dom.window.close();
});
test('files await persistence and report session-only copies truthfully',async()=>{
 const {dom,w,os}=setup('src/modules/workspace-apps.js','<input id="fm-inline-name" value="renamed.md"><textarea id="fm-inline-body">new text</textarea><button id="fm-edit-save"></button><div id="fm-status-live"></div>');
 const file={id:'one',name:'old.md',path:'/Archive/old.md',content:'old'};os.fmFindById=()=>file;os.fmChildrenForPath=()=>[file];os.fmRender=()=>{};
 let complete;w.AetherVFS={putFile:()=>new Promise(resolve=>complete=resolve)};
 const pending=os.fmSaveInlineEdit('one');assert.equal(os.filemanager.editingId,null);assert.equal(file.name,'old.md');assert.equal(w.document.getElementById('fm-edit-save').disabled,true);
 complete({persistence:'session-only'});await pending;assert.equal(file.name,'renamed.md');assert.match(w.document.getElementById('fm-status-live').textContent,/Session-only/);dom.window.close();
});
test('failed file edits keep editor contents and do not mutate the file record',async()=>{
 const {dom,w,os}=setup('src/modules/workspace-apps.js','<input id="fm-inline-name" value="new.md"><textarea id="fm-inline-body">unsaved</textarea><div id="fm-status-live"></div>');
 const file={id:'one',name:'old.md',path:'/Archive/old.md',content:'old'};os.fmFindById=()=>file;os.fmChildrenForPath=()=>[];w.AetherVFS={putFile:async()=>{throw Error('storage failed');}};os.filemanager.editingId='one';
 await os.fmSaveInlineEdit('one');assert.equal(file.content,'old');assert.equal(os.filemanager.editingId,'one');assert.equal(w.document.getElementById('fm-inline-body').value,'unsaved');dom.window.close();
});
test('terminal labels opaque HTTP timing honestly rather than fabricating ICMP replies',async()=>{
 const {dom,w,os}=setup('src/modules/diagnostics-and-tasks.js');const messages=[];os.terminalWrite=x=>messages.push(x);os._terminalResolvePath=x=>x;
 w.fetch=async()=>({type:'opaque',status:0});w.AbortSignal.timeout=()=>undefined;
 os.terminalRunCommand('ping https://example.org');await new Promise(resolve=>setTimeout(resolve,0));
 assert.match(messages.join('\n'),/not ICMP/);assert.match(messages.join('\n'),/cannot be verified/);assert.ok(!messages.join('\n').includes('64 bytes'));dom.window.close();
});
test('VFS mounts nested user folders and preserves edited built-in document IDs',async()=>{
 const {dom,w,os}=setup('src/modules/workspace-apps.js');
 w.eval(read('src/services/vfs-and-backup.js'));
 await w.AetherVFS.putFile({id:'nested-file',name:'note.md',folder:'Projects/Research',content:'actual content',kind:'note'});
 let file=os.fmFindById('nested-file');assert.equal(file.path,'/Archive/Projects/Research/note.md');assert.equal(file.content,'actual content');
 await w.AetherVFS.putFile({id:'doc-welcome',name:'Welcome edited.md',folder:'Documents',content:'edited guide',kind:'note'});
 assert.equal(os.fmFlatten().filter(n=>n.id==='doc-welcome').length,1);assert.equal(os.fmFindById('doc-welcome').content,'edited guide');
 await w.AetherVFS.setMeta('archive-folders-v1',['/Archive/Empty Project']);w.AetherVFS.syncToFileManager();assert.equal(os.fmFindByPath('/Archive/Empty Project').kind,'folder');
 await w.AetherVFS.deleteFile('nested-file');assert.equal(os.fmFindById('nested-file'),undefined);dom.window.close();
});
