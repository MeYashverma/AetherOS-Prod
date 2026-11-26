import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
function setup(){
 const dom=new JSDOM('<main id="companion-chat-log"></main>',{runScripts:'outside-only',url:'https://aether.test'}),w=dom.window;
 const replies=[];w.os={companionChatAppend:(role,text)=>replies.push({role,text}),companionSetThinking(){},openWindow(){}};w.SystemState={windows:{terminal:{title:'Terminal'}},settings:{}};
 w.eval(fs.readFileSync('src/services/ai-assistant.js','utf8').replace('  function bootWhenReady(){','  window.__testedAssistant=assistant;\n  function bootWhenReady(){'));
 const ai=w.__testedAssistant;ai.booted=true;w.os.aiAssistant=ai;
 ai.renderStatus=()=>{};ai.renderCommandChips=()=>{};ai.maybeSpeakResponse=()=>{};ai.persistMessage=()=>new Promise(()=>{});
 return {w,ai,replies,close:()=>dom.window.close()};
}
test('greeting returns immediately without model loading, legacy network fallback or waiting for persistence',async()=>{
 const {ai,replies,close}=setup();ai.ensureEngine=()=>{throw Error('must not load');};await ai.handleUserMessage('hi');assert.equal(replies.length,2);assert.equal(replies[1].text,'Hi! What would you like to do?');assert.equal(ai.state.busy,false);close();
});
test('unknown free-form text gives honest local help without starting imports or downloads',async()=>{
 const {ai,replies,close}=setup();ai.buildRetrievedContext=()=>({hits:[]});ai.ensureEngine=()=>{throw Error('must not load');};await ai.handleUserMessage('explain quantum computing');assert.match(replies[1].text,/Load local model/);assert.match(replies[1].text,/No model is running/);assert.equal(ai.state.busy,false);close();
});
test('direct command stays fast even if browser message persistence never resolves',async()=>{
 const {ai,replies,close}=setup();ai.maybeDirectCommand=async()=>({reply:'Opening Terminal.',actions:[{action:'openModule',target:'terminal'}]});let executions=0;ai.executeAction=async()=>{executions++;return {ok:true};};ai.renderExecutionSummary=()=>{throw Error('successful commands need no debug row');};await ai.handleUserMessage('open terminal');assert.equal(executions,1);assert.equal(replies[1].text,'Opening Terminal.');assert.equal(ai.state.busy,false);close();
});
test('model loading is explicit and concurrent Load clicks share the same initialization',async()=>{
 const {ai,close}=setup();let resolve,calls=0;ai.ensureEngine=()=>{calls++;return new Promise(r=>resolve=r);};const first=ai.loadModel(),second=ai.loadModel();assert.equal(first,second);assert.equal(calls,1);assert.equal(ai.state.modelLoading,true);resolve({});await first;assert.equal(ai.state.modelLoading,false);close();
});
test('already loaded model is reused without embedding rerank or re-initialization',async()=>{
 const {ai,replies,close}=setup();ai.maybeDirectCommand=async()=>null;ai.ensureEngine=()=>{throw Error('must reuse');};ai.buildRetrievedContextAsync=()=>{throw Error('no per-turn embedding pass');};ai.buildRetrievedContext=()=>({hits:[],text:''});ai.buildSystemContext=()=>({});ai.buildHistoryForModel=()=>[];ai.shouldUsePlanner=()=>false;ai.buildAssistantPrompt=()=> 'Context';const output=[];ai.createStreamingRow=()=>({set:text=>output.push(text),finish(){}});ai.engine={chat:{completions:{create:async()=>({async *[Symbol.asyncIterator](){yield {choices:[{delta:{content:'Actual '}}]};yield {choices:[{delta:{content:'answer'}}]};}})}}};await ai.handleUserMessage('Explain a concept');assert.equal(output.at(-1),'Actual answer');assert.equal(ai.state.busy,false);close();
});
test('runTurn shares the no-implicit-download local-help path',async()=>{
 const {ai,close}=setup();ai.buildRetrievedContext=()=>({hits:[]});ai.ensureEngine=()=>{throw Error('must not load');};const greeting=await ai.runTurn('hello');assert.match(greeting.text,/Hi!/);const reply=await ai.runTurn('Something complex');assert.match(reply.text,/Load local model/);close();
});
test('basic arithmetic does not retrieve unrelated workspace documentation or execute code',async()=>{const {ai,replies,close}=setup();ai.buildRetrievedContext=()=>{throw Error('no retrieval');};for(const [q,answer] of [['2+2','4'],['12 / 4','3'],['-3 * 2','-6'],['1/0','That calculation is undefined.']]){await ai.handleUserMessage(q);assert.equal(replies.at(-1).text,answer);}close();});
test('vague follow-ups apologize rather than returning a spurious local reference',async()=>{const {ai,replies,close}=setup();ai.buildRetrievedContext=()=>({hits:[{score:1,title:'WikiBoard',text:'irrelevant'}]});await ai.handleUserMessage('what?');assert.match(replies.at(-1).text,/unclear/);const reply=ai.quickLocalReply('explain quantum computing');assert.doesNotMatch(reply,/WikiBoard/);close();});
test('compact models are advertised only when their runtime record exists',()=>{const {ai,close}=setup();ai.module={prebuiltAppConfig:{model_list:[{model_id:'Qwen3.5-0.8B-q4f16_1-MLC'}]}};const catalog=ai.buildModelCatalog();assert.equal(catalog.find(m=>m.key==='qwen35_08b').available,true);assert.equal(catalog.find(m=>m.key==='smol_135m').available,false);close();});
test('why follows the last calculation and does not repeat model setup instructions',async()=>{const {ai,replies,close}=setup();await ai.handleUserMessage('2+2');await ai.handleUserMessage('why?');assert.match(replies.at(-1).text,/adding 2 and 2/);assert.doesNotMatch(replies.at(-1).text,/Load local model/);await ai.handleUserMessage('hello');await ai.handleUserMessage('why?');assert.doesNotMatch(replies.at(-1).text,/adding 2/);close();});
test('music questions use real station metadata without claiming to identify its song',async()=>{const {w,ai,replies,close}=setup();w.os.audioStream={src:'https://radio.test',paused:false};w.os._rbNowPlaying={name:'Jazz FM'};await ai.handleUserMessage("what's playing?");assert.match(replies.at(-1).text,/Jazz FM/);assert.match(replies.at(-1).text,/not the current song title/);close();});
