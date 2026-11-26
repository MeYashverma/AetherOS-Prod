import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
function setup(){
 const dom=new JSDOM('',{runScripts:'outside-only',url:'https://aether.test'}),w=dom.window;
 w.os={};w.extendOS=x=>Object.assign(w.os,x);w.SystemState={settings:{}};w.confirm=()=>true;w.matchMedia=()=>({matches:false});let frames=0;w.requestAnimationFrame=()=>++frames;w.cancelAnimationFrame=()=>{};
 w.eval(fs.readFileSync('src/modules/iconic-web-universes.js','utf8'));w.document.body.innerHTML=w.WindowContents.shadertoy;
 const calls={draws:0,deletedPrograms:[],deletedBuffers:[],deletedShaders:[],sources:[]};let id=0;
 const gl={VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,ARRAY_BUFFER:5,STATIC_DRAW:6,FLOAT:7,TRIANGLES:8,
 createShader:type=>({type,id:++id}),shaderSource:(shader,source)=>{shader.source=source;calls.sources.push(source);},compileShader(){},getShaderParameter:shader=>!shader.source.includes('BROKEN'),getShaderInfoLog:()=> 'ERROR: 0:3: Invalid token\nERROR: 0:4: Second error',deleteShader:shader=>calls.deletedShaders.push(shader),createProgram:()=>({id:++id}),attachShader(){},linkProgram(){},getProgramParameter:()=>true,getProgramInfoLog:()=>'',deleteProgram:program=>calls.deletedPrograms.push(program),createBuffer:()=>({id:++id}),deleteBuffer:buffer=>calls.deletedBuffers.push(buffer),bindBuffer(){},bufferData(){},getAttribLocation:()=>0,getUniformLocation:(_,name)=>name,enableVertexAttribArray(){},vertexAttribPointer(){},viewport(){},useProgram(){},uniform3f(){},uniform1f(){},uniform4f(){},uniform1i(){},drawArrays(){calls.draws++;}};
 const canvas=w.document.getElementById('st-gl-canvas');canvas.getContext=()=>gl;canvas.toDataURL=()=> 'data:image/png;base64,test';canvas.getBoundingClientRect=()=>({width:800,height:500,left:0,top:0,bottom:500});
 return {w,os:w.os,canvas,gl,calls,close:()=>{w.os.killShadertoy();dom.window.close();}};
}
test('built-in shader renders locally and exposes only supported uniforms without a remote iframe request',()=>{
 const {w,os,calls,close}=setup();os.initShadertoy();assert.equal(os.stState.valid,true);assert.equal(os.stState.paused,false);assert.ok(calls.draws>0);assert.equal(w.document.getElementById('st-embed-frame').src,'about:blank');assert.match(calls.sources[1],/uniform vec4 iMouse/);assert.match(calls.sources[1],/#line 1/);assert.equal(w.document.querySelector('.studio-app-heading'),null);close();
});
test('restored user draft is not compiled or animated automatically',()=>{
 const {w,os,calls,close}=setup();w.localStorage.setItem('aether-shader-draft-v1','BROKEN');os.initShadertoy();assert.equal(calls.sources.length,0);assert.equal(os.stState.paused,true);assert.equal(w.document.getElementById('st-glsl-editor').value,'BROKEN');assert.match(w.document.getElementById('st-compile-status').textContent,/not running/);close();
});
test('failed compile keeps the last valid program/output and displays a full escaped error log',()=>{
 const {w,os,calls,close}=setup();os.initShadertoy();const previous=os.stState.program,buffer=os.stState.buffer;w.document.getElementById('st-glsl-editor').value='BROKEN';assert.equal(os.stCompile(),false);assert.equal(os.stState.program,previous);assert.equal(os.stState.buffer,buffer);assert.equal(os.stState.valid,true);assert.equal(calls.deletedPrograms.includes(previous),false);assert.match(w.document.getElementById('st-errors').textContent,/Second error/);assert.equal(w.document.getElementById('st-errors').hidden,false);close();
});
test('successful recompiles free replaced resources; close frees current program, buffer and RAF',()=>{
 const {os,calls,close}=setup();os.initShadertoy();const old=os.stState.program;os.stCompile();assert.ok(calls.deletedPrograms.includes(old));assert.equal(calls.deletedShaders.length,4);os.killShadertoy();assert.equal(os.stState.raf,null);assert.equal(os.stState.program,null);assert.equal(os.stState.buffer,null);assert.equal(calls.deletedPrograms.length,2);assert.equal(calls.deletedBuffers.length,2);close();
});
test('time controls pause, validate bounds and preserve user time during normal draws',()=>{
 const {w,os,close}=setup();os.initShadertoy();os.stSetTime(42.5);assert.equal(os.stState.paused,true);assert.equal(os.stState.elapsed,42.5);assert.equal(w.document.getElementById('st-time-label').textContent,'42.5s');os.stSetTime(NaN);os.stSetTime(1000);assert.equal(os.stState.elapsed,42.5);os.stTogglePause();assert.equal(os.stState.paused,false);close();
});
test('render buffers have a pixel budget and half-scale reduces dimensions',()=>{
 const {os,canvas,close}=setup();canvas.getBoundingClientRect=()=>({width:5000,height:4000});os.stResize();assert.ok(canvas.width*canvas.height<=921600);assert.ok(canvas.width<=2048);canvas.getBoundingClientRect=()=>({width:800,height:500});os.stState.quality=.5;os.stResize();assert.equal(canvas.width,400);assert.equal(canvas.height,250);close();
});
test('context loss prevents frame capture, restoration requires an explicit recompile',()=>{
 const {w,os,canvas,close}=setup();os.initShadertoy();canvas.dispatchEvent(new w.Event('webglcontextlost',{cancelable:true}));assert.equal(os.stState.lost,true);assert.equal(os.stState.valid,false);assert.throws(()=>os.stFrameData(),/Render/);canvas.dispatchEvent(new w.Event('webglcontextrestored'));assert.equal(os.stState.gl,null);assert.equal(os.stState.program,null);assert.match(w.document.getElementById('st-compile-status').textContent,/press Compile/);close();
});
test('source imports are bounded, explicit-run and discard late file reads after new edits or close',async()=>{
 const {w,os,calls,close}=setup();os.initShadertoy();const count=calls.sources.length;await os.stImportSource({size:10,text:async()=> 'void mainImage(out vec4 c,in vec2 p){c=vec4(1.);}' });assert.equal(calls.sources.length,count);assert.match(w.document.getElementById('st-compile-status').textContent,/not compiled/);await os.stImportSource({size:65537});assert.match(w.document.getElementById('st-compile-status').textContent,/64 KiB/);let resolve;const pending=os.stImportSource({size:10,text:()=>new Promise(r=>resolve=r)});w.document.getElementById('st-glsl-editor').value='newer edit';os.stEditSource();resolve('old file');await pending;assert.equal(w.document.getElementById('st-glsl-editor').value,'newer edit');close();
});
test('source saving reports storage failure instead of pretending durability',()=>{
 const {w,os,close}=setup();os.initShadertoy();os.stSaveSource();assert.ok(w.localStorage.getItem('aether-shader-draft-v1'));w.Storage.prototype.setItem=()=>{throw Error('quota');};os.stSaveSource();assert.match(w.document.getElementById('st-compile-status').textContent,/session-only/);close();
});
test('frame save awaits Files result and failures retain PNG capture ability',async()=>{
 const {w,os,close}=setup();os.initShadertoy();let resolve;w.AetherVFS={putFile:()=>new Promise(r=>resolve=r)};const pending=os.stSaveFrame();resolve({persistence:'session-only'});await pending;assert.match(w.document.getElementById('st-compile-status').textContent,/Session-only/);w.AetherVFS.putFile=async()=>{throw Error('quota');};await os.stSaveFrame();assert.match(w.document.getElementById('st-compile-status').textContent,/quota.*Download PNG/);assert.match(os.stFrameData(),/^data:image\/png/);close();
});
test('external mode is opt-in and allowlists official shader IDs without claiming readiness',()=>{
 const {w,os,close}=setup();os.initShadertoy();os.stSetMode('embed');const iframe=w.document.getElementById('st-embed-frame');assert.equal(iframe.src,'about:blank');os.stLoadEmbedId('https://evil.test/view/XsXXDn');assert.equal(iframe.src,'about:blank');os.stLoadEmbedId('https://www.shadertoy.com/view/XsXXDn');assert.match(iframe.src,/^https:\/\/www.shadertoy.com\/embed\/XsXXDn/);assert.match(w.document.getElementById('st-compile-status').textContent,/not verified/);os.stSetMode('studio');assert.equal(iframe.src,'about:blank');assert.equal(os.stState.paused,true);close();
});
test('WebGL unavailable leaves source editing useful and blocks false frame saves',()=>{
 const {w,os,canvas,close}=setup();canvas.getContext=()=>null;os.initShadertoy();assert.equal(os.stState.program,null);assert.equal(os.stState.valid,false);assert.match(w.document.getElementById('st-compile-status').textContent,/WebGL unavailable/);assert.throws(()=>os.stFrameData(),/Render/);close();
});
test('reduced-motion preference starts compiled built-ins as a static frame',()=>{
 const {w,os,close}=setup();w.matchMedia=()=>({matches:true});os.initShadertoy();assert.equal(os.stState.valid,true);assert.equal(os.stState.paused,true);assert.equal(os.stState.raf,null);assert.match(w.document.getElementById('st-compile-status').textContent,/reduced motion/);close();
});
test('cancelled preset replacement preserves dirty source, and backgrounding pauses the preview',()=>{
 const {w,os,close}=setup();os.initShadertoy();const ed=w.document.getElementById('st-glsl-editor');ed.value='my unsaved source';os.stEditSource();w.confirm=()=>false;os.stLoadPreset('aurora');assert.equal(ed.value,'my unsaved source');assert.equal(w.document.getElementById('st-preset-sel').value,'custom');Object.defineProperty(w.document,'hidden',{value:true});w.document.dispatchEvent(new w.Event('visibilitychange'));assert.equal(os.stState.paused,true);assert.equal(os.stState.raf,null);close();
});
