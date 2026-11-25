import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
const read=p=>fs.readFileSync(p,'utf8');
function setup(file){const dom=new JSDOM('<main></main>',{runScripts:'outside-only',url:'https://example.test'});const w=dom.window;w.os={};w.extendOS=x=>Object.assign(w.os,x);w.eval(read(file));return {dom,w,os:w.os};}
test('focus counts elapsed wall time, completes once and pauses without interval drift',()=>{
 const {dom,w,os}=setup('src/modules/focus-and-devpad.js');let now=10000;w.Date.now=()=>now;
 os.focusState.remainingSec=10;os.focusToggleTimer();assert.equal(os.focusState.deadline,20000);
 now=17200;os.focusTick();assert.equal(os.focusState.remainingSec,3);
 os.focusPauseTimer();now=30000;assert.equal(os.focusState.remainingSec,3);
 os.focusToggleTimer();now=34000;os.focusTick();assert.equal(os.focusState.remainingSec,0);assert.equal(os.focusState.sessionsCompleted,1);
 os.focusTick();assert.equal(os.focusState.sessionsCompleted,1);assert.equal(os.focusState.running,false);dom.window.close();
});
test('developer tools do not misrepresent JWT verification or UUID format',()=>{
 const {dom,w,os}=setup('src/modules/focus-and-devpad.js');w.document.body.innerHTML='<pre id="dt-jwt-out"></pre>';
 const enc=x=>Buffer.from(JSON.stringify(x)).toString('base64url');os.dtRunJwt(enc({alg:'none'})+'.'+enc({exp:4102444800})+'.');
 assert.match(w.document.querySelector('pre').textContent,/SIGNATURE NOT VERIFIED/);assert.ok(!w.document.querySelector('pre').textContent.includes('(VALID)'));
 for(let i=0;i<10;i++)assert.match(os.dtGenerateUuid(),/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
 dom.window.close();
});
test('regex worker bounds output and returns syntax errors as data',()=>{
 let response;const context={self:{postMessage:x=>response=x}};vm.runInNewContext(read('src/workers/regex-runner.js'),context);
 context.self.onmessage({data:{pattern:'a',flags:'g',text:'aaa'}});assert.match(response.text,/#3 \[2\]/);
 context.self.onmessage({data:{pattern:'.',flags:'g',text:'x'.repeat(900)}});assert.match(response.text,/Stopped at 500/);
 context.self.onmessage({data:{pattern:'[',flags:'g',text:'x'}});assert.match(response.text,/Regex error/);
});
test('regex does not execute without worker support and clears stale results',()=>{
 const {dom,w,os}=setup('src/modules/focus-and-devpad.js');w.document.body.innerHTML='<input id="dt-rx-pat" value="(a+)+$"><input id="dt-rx-flags" value="g"><textarea id="dt-rx-text">aaaa!</textarea><pre id="dt-rx-out"></pre>';
 os.dtRunRegex();assert.match(w.document.querySelector('pre').textContent,/requires Web Worker/);
 w.document.getElementById('dt-rx-pat').value='';os.dtRunRegex();assert.match(w.document.querySelector('pre').textContent,/Enter a pattern/);dom.window.close();
});
test('kanban starts empty, edits and moves real cards, and supports undo deletion',()=>{
 const {dom,w,os}=setup('src/modules/power-tools.js');w.document.body.innerHTML=w.WindowContents.kanban;os.initKanban();
 assert.equal(os.kanbanActiveBoard().cards.length,0);os.kanbanAddCard('Real work','Feature','todo');const card=os.kanbanActiveBoard().cards[0];
 os.kanbanEditCard(card.id,'Updated work');assert.equal(card.title,'Updated work');os.kanbanMoveCard(card.id,'doing');assert.equal(card.col,'doing');os.kanbanMoveCard(card.id,'bogus');assert.equal(card.col,'doing');
 assert.equal(w.document.querySelectorAll('article.kanban-task-card').length,1);os.kanbanDeleteCard(card.id);assert.equal(os.kanbanActiveBoard().cards.length,0);os.kanbanUndoDelete();assert.equal(os.kanbanActiveBoard().cards[0].title,'Updated work');dom.window.close();
});
test('storage failures retain data in memory and show session-only status',()=>{
 const {dom,w,os}=setup('src/modules/power-tools.js');w.document.body.innerHTML=w.WindowContents.kanban;
 w.Storage.prototype.setItem=()=>{throw new Error('quota');};os.kanbanAddCard('Unsaved','Design','todo');
 assert.equal(os.kanbanActiveBoard().cards.length,1);assert.match(w.document.getElementById('kanban-save-status').textContent,/Session only/);dom.window.close();
});
