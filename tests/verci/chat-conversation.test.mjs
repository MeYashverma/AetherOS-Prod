import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { addConversation, replyTarget, textReactionFor } from '../../src/vendor/verci/viz/chat-conversation.js';
import { Messages, planTurns } from '../../src/vendor/verci/viz/native.js';
import { parseLRC } from '../../src/vendor/verci/lrc.js';
const dom=new JSDOM('<div id="stage"></div>');
globalThis.document=dom.window.document;globalThis.requestAnimationFrame=()=>1;
const L=parseLRC('[00:00]Hello\n[00:04]I love you\n[00:08]Hell no\n[00:12]VA next');
L.speakers=['First singer','Second singer'];L.lines.forEach((l,i)=>l.speaker=i%2);
const P=planTurns(L,'Duet');
assert.equal(replyTarget(L,P,2),1);
assert.equal(replyTarget(L,P,0),null);
let sought=-1;
const viz=new Messages(document.getElementById('stage'),{lyrics:L,song:{title:'Duet',artist:'Two',artwork:''},seek:t=>sought=t,opts:{emojis:()=>false,gifs:()=>false,stickers:()=>false}}).mount();
for(let i=0;i<L.lines.length;i++) {
 const bubble=viz.bubble(i,L.lines[i]);
 assert.equal(bubble.classList.contains('big'),false,'short lines stay normal-sized');
 assert.ok(bubble.querySelector('time'),'short lines retain timestamps');
 assert.equal(bubble.querySelector('p').textContent,L.lines[i].text);
 if(i===2){const quote=bubble.querySelector('.chat-quote');assert.ok(quote);assert.match(quote.textContent,/I love you/);quote.click();assert.equal(sought,4);}
 if(i===1)assert.ok(bubble.querySelector('.chat-text-reaction'));
}
const b=document.createElement('div');b.innerHTML='<p>Hell no</p>';
addConversation({ctx:{lyrics:L,song:{title:'Duet'},opts:{replies:()=>false,textReactions:()=>false}},P},b,L.lines[2],2);
assert.equal(b.children.length,1,'off switches remove decorations');
assert.equal(textReactionFor('Unfamiliar neutral sentence',1),null);
assert.equal(textReactionFor('I love you',1,'seed'),textReactionFor('I love you',1,'seed'));
assert.ok(!readFileSync('styles/verci-stage.css','utf8').includes('.nd-wa .b.big'),'no oversized short-line rule remains');
assert.ok(!readFileSync('src/vendor/verci/viz/chat-reactions.js','utf8').includes("credit.textContent"),'no visible GIF credit injection');
viz.destroy();
console.log('Short lyric bubbles, text reactions, quoted replies, seek and off switches verified.');

assert.ok(readFileSync('styles/verci-stage.css','utf8').includes('.chat-gif>:not(img){display:none!important}'), 'cached GIF captions are hidden too');
