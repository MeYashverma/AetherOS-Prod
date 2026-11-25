import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
function setup(){
 const dom=new JSDOM('',{runScripts:'outside-only',url:'https://example.test'}),w=dom.window;
 w.os={};w.SystemState={windows:{taskmanager:{id:'taskmanager',title:'Task Manager',isOpen:true},a:{id:'a',title:'Editor',isOpen:true,space:2},b:{id:'b',title:'Browser',isOpen:false}}};w.WindowContents={};w.extendOS=x=>Object.assign(w.os,x);
 const template=fs.readFileSync('src/ui/templates/system-templates.js','utf8');w.eval('WindowContents.taskmanager = '+template.slice(template.indexOf('    taskmanager: `')+17,template.indexOf('    sysmon: `')).trim().replace(/,$/,''));
 w.document.body.innerHTML=w.WindowContents.taskmanager;w.eval(fs.readFileSync('src/modules/diagnostics-and-tasks.js','utf8'));return {dom,w,os:w.os};
}
test('snapshot counts windows honestly and unsupported heap remains unavailable',()=>{
 const {dom,w,os}=setup();w.SystemState.windows.a.isMinimized=true;const snap=os.tmSnapshot();assert.equal(snap.open,2);assert.equal(snap.minimized,1);assert.equal(snap.registered,3);assert.equal(snap.heapUsed,null);assert.ok(snap.domNodes>0);os.tmRefreshData();assert.match(w.document.getElementById('tm-summary').textContent,/Unavailable/);assert.doesNotMatch(w.document.getElementById('taskmanager-content').textContent,/Idle/);dom.window.close();
});
test('window filtering and refresh preserve unchanged action focus and list DOM',()=>{
 const {dom,w,os}=setup();os.tmRefreshData();const button=w.document.querySelector('[data-tm-action="a-Focus"]');button.focus();os.tmRefreshData();assert.equal(w.document.activeElement,button);assert.equal(w.document.querySelector('[data-tm-action="a-Focus"]'),button);os._tmFilter='browser';os.tmRefreshData();assert.match(w.document.getElementById('taskmanager-content').textContent,/Browser/);assert.equal(w.document.querySelector('[data-tm-action="a-Focus"]'),null);dom.window.close();
});
test('close actions require confirmation and never close Task Manager via close-others',()=>{
 const {dom,w,os}=setup();const closed=[];os.forceKillApp=id=>{closed.push(id);w.SystemState.windows[id].isOpen=false;};w.confirm=()=>false;os.tmCloseWindow('a');os.tmCloseAllWindows();assert.equal(closed.length,0);w.confirm=()=>true;os.tmCloseAllWindows();assert.deepEqual(closed,['a']);assert.equal(w.SystemState.windows.taskmanager.isOpen,true);dom.window.close();
});
test('untrusted window titles are text, not injected handlers',()=>{
 const {dom,w,os}=setup();w.SystemState.windows.a.title='<img src=x onerror=alert(1)>';os.tmRefreshData();assert.equal(w.document.querySelector('#taskmanager-content img'),null);assert.match(w.document.getElementById('taskmanager-content').textContent,/<img/);dom.window.close();
});
test('history contains bounded measured samples and never seeds fictional data',()=>{
 const {dom,w,os}=setup();assert.equal(os._tmHistory.length,0);assert.match(os.tmChart('heapUsed','Heap','MiB'),/unavailable/);for(let i=0;i<65;i++)os.tmSample();assert.equal(os._tmHistory.length,60);assert.equal(os._tmHistory[0].heapUsed,null);assert.equal(os._tmHistory[0].callbackDelay,null);assert.match(os.tmChart('domNodes','Elements','nodes'),/60 measured samples/);dom.window.close();
});
test('initialization is idempotent and dispose stops sampling; pause labels expose state',()=>{
 const {dom,w,os}=setup();let active=new Set(),id=0;w.setInterval=fn=>{active.add(++id);return id;};w.clearInterval=id=>active.delete(id);os.initTaskManager();os.initTaskManager();assert.equal(active.size,1);os.tmTogglePause();assert.equal(os._tmPaused,true);assert.equal(w.document.getElementById('tm-pause').getAttribute('aria-pressed'),'true');os.tmDispose();assert.equal(active.size,0);assert.equal(os._tmRefreshInterval,null);dom.window.close();
});
test('runtime graphs have accessible descriptions and no CPU attribution',()=>{
 const {dom,w,os}=setup();os.tmSample();os.tmSwitchTab('performance');assert.equal(w.document.querySelectorAll('#taskmanager-content svg[role="img"]').length,1);assert.match(w.document.getElementById('taskmanager-content').textContent,/not CPU utilization/);assert.match(w.document.getElementById('taskmanager-content').textContent,/Measurement unavailable/);dom.window.close();
});
