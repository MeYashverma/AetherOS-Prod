import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { parseTTML, ttmlTime } from '../../src/vendor/verci/ttml.js';
import { communityMatch } from '../../src/vendor/verci/providers/ttml-community.js';
import { planTurns, Messages } from '../../src/vendor/verci/viz/native.js';
import { frameState } from '../../src/vendor/verci/viz/core.js';
const dom = new JSDOM('<div id="stage"></div>');
globalThis.DOMParser=dom.window.DOMParser;
globalThis.document=dom.window.document;
globalThis.requestAnimationFrame=fn=>{fn();return 1;};
const xml=`<tt xmlns="http://www.w3.org/ns/ttml" xmlns:ttm="http://www.w3.org/ns/ttml#metadata"><head><metadata>
<ttm:agent xml:id="v1"><ttm:name>Alice</ttm:name></ttm:agent><ttm:agent xml:id="v2"><ttm:name>Bob</ttm:name></ttm:agent>
</metadata></head><body><div>
<p begin="0s" end="2s" ttm:agent="v1"><span begin="0s" end="1s">Hello </span><span begin="1s" end="2s">world</span><span ttm:role="x-translation">Translation</span></p>
<p begin="0s" end="3s" ttm:agent="v2"><span begin="0s" end="3s">Together</span><span ttm:role="x-roman">Romanization</span></p>
<p begin="4s" end="6s" ttm:agent="v2">Another line</p>
<p begin="7s" end="8s">No attribution</p>
</div></body></tt>`;
const L=parseTTML(xml);
assert.deepEqual(L.speakers,['Alice','Bob']);
assert.equal(L.lines.length,4);
const unnamed = parseTTML(xml.replace('<ttm:name>Alice</ttm:name>', '').replace('<ttm:name>Bob</ttm:name>', ''));
assert.deepEqual(unnamed.speakers, ['Voice 1', 'Voice 2']);
assert.equal(L.lines[0].text,'Hello world');
assert.equal(L.lines[0].tokens[1].t0,1);
assert.equal(L.lines[0].tokens[1].estimated,false);
assert.equal(L.lines[1].speaker,1);
assert.equal(L.lines[2].tokens[0].estimated,true);
assert.equal(L.lines[3].speaker,-1);
assert.equal(ttmlTime('01:02.500'),62.5);
assert.equal(ttmlTime('00:01:02:15',30),62.5);
assert.equal(ttmlTime('250ms'),.25);
assert.throws(()=>parseTTML('<tt><bad></tt>'),/Invalid/);
assert.throws(()=>parseTTML('<!DOCTYPE tt><tt/>'),/declarations/);
const P=planTurns(L,'Various artists');
assert.equal(P.T[0].who,0); assert.equal(P.T[1].who,1);
assert.equal(P.names[P.T[3].who],'Unspecified voice');
const root=document.getElementById('stage');
const viz=new Messages(root,{song:{title:'Duet',artist:'Alice & Bob',artwork:''},lyrics:L}).mount();
viz.onLine({...frameState(L,.5),changed:true,jump:true});
assert.equal(root.querySelectorAll('.b').length,2,'both simultaneous singers appear');
assert.match(root.textContent,/Alice/); assert.match(root.textContent,/Bob/);
viz.tick(frameState(L,1.5));
viz.onLine({...frameState(L,4.5),jump:false});
viz.onLine({...frameState(L,.5),jump:true});
assert.equal(root.querySelectorAll('.b').length,2,'backward seek reconstructs duet');
viz.destroy(); assert.equal(root.children.length,0);
const entries=[{metadata:[['musicName',['Song']],['artists',['Alice']]],rawLyricFile:'test.ttml'}];
assert.ok(communityMatch(entries,{title:'Song',artist:'Alice'}));
assert.equal(communityMatch(entries,{title:'Different',artist:'Alice'}),null);
assert.equal(communityMatch(entries,{title:'Song',artist:'Bob'}),null);
assert.equal(communityMatch(entries,{title:'Song',artist:''}),null);
assert.equal(communityMatch(entries,{title:'Song',artist:'Malice'}),null);
assert.ok(communityMatch(entries,{title:'Song',artist:'Alice & Bob'}));
console.log('TTML timing, agents, simultaneous duet chat, import safety and catalogue identity verified.');
