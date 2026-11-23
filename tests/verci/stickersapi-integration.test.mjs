import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { parseLRC } from '../../src/vendor/verci/lrc.js';
import { frameState } from '../../src/vendor/verci/viz/core.js';

const dom=new JSDOM('<div id="stage"></div>',{url:'https://aether.test',runScripts:'outside-only'});
globalThis.window=dom.window;
globalThis.document=dom.window.document;
globalThis.matchMedia=()=>({matches:false});
globalThis.requestAnimationFrame=()=>1;
const saved=[];
window.SystemState={settings:{chat_media_avatar:null,chat_media_banner:null},save:()=>saved.push({...window.SystemState.settings})};
dom.window.eval(readFileSync('src/core/primitives.js','utf8'));
dom.window.eval(readFileSync('src/ui/templates/media-space-templates.js','utf8'));
document.body.insertAdjacentHTML('beforeend',window.WindowContents.stickers);
assert.ok(document.querySelector('#stickers-library-panel [data-media-open="telegram"]'));
assert.ok(document.querySelector('#stickers-library-panel [data-media-profile="pfp"]'));

const { Messages }=await import('../../src/vendor/verci/viz/native.js');
const { attachAutomaticSticker }=await import('../../src/vendor/verci/providers/automatic-stickers.js');
const { openLibraryPicker, setChatProfile, renderLibrary }=await import('../../src/modules/media-library.js');
const { STICKERS_API }=await import('../../src/vendor/verci/providers/stickersapi.js');
const lyrics=parseLRC('[00:00]I love you\n[00:03]You sing too\n[00:06](Ah) And you know I love you');
const opts={listenerReplies:()=>false,emojis:()=>false,gifs:()=>false,stickers:()=>false,textReactions:()=>false,
  lyricMediaEnabled:()=>false, // Manual picker and selected emotes work even with automatic StickersAPI lyrics off.
  avatar:()=>window.SystemState.settings.chat_media_avatar,banner:()=>window.SystemState.settings.chat_media_banner};
const context=L=>({song:{title:'A song',artist:'Singer',artwork:'https://aether.test/art.png'},lyrics:L,opts,duration:()=>60});
let viz=new Messages(document.getElementById('stage'),context(lyrics)).mount();
window.AetherMusic={state:{viz}};
viz.frame(frameState(lyrics,4),.016);
assert.equal(viz.rows.length,2);
const countBefore=viz.inner.querySelectorAll(':scope > .b').length;
assert.ok(viz.ph.querySelector('footer .chat-media-launch[aria-label]'),'composer has an accessible media button');

// A selected image is a separate local outgoing message, never spliced into lyrics.
assert.equal(viz.chatInteractions.addMedia(0,{kind:'sticker',slug:'71189-love',name:'Love',image:'https://evil.test/asset.png'}),true);
let media=viz.inner.querySelector('.chat-local-media');
assert.equal(media.previousElementSibling.dataset.messageIndex,'0');
assert.equal(media.nextElementSibling.dataset.messageIndex,'1');
assert.match(media.getAttribute('aria-label'),/not a lyric/);
assert.equal(media.querySelector('img').src,`${STICKERS_API}/sticker/71189-love/preview`);
assert.equal(media.querySelector('img').referrerPolicy,'no-referrer');
media.querySelector('img').onload();await Promise.resolve();
assert.equal(media.querySelector('.chat-local-media-preview span'),null,'loaded media replaces the placeholder');
assert.equal(viz.inner.querySelectorAll(':scope > .b').length,countBefore+1);
assert.equal(viz.chatInteractions.addMedia(0,{kind:'sticker',slug:'../unsafe',name:'Unsafe'}),false);
assert.equal(viz.chatInteractions.addMedia(0,{kind:'pfp',slug:'11334-cat'}),false,'PFPs are not lyric messages');

// Both a chat-launched picker and the Finder window use the exact same library.
let searches=0;
globalThis.fetch=async(url,options)=>{
  searches++;
  assert.equal(options.credentials,'omit');
  const data=url.includes('/telegram/stickers/')?{stickers:[{fileId:'FILE_123',thumbnailFileId:'THUMB_456',emoji:'✨'}]}:
    url.includes('/pfps?')?{items:[{slug:'11334-cat',name:'Cat face',image:'https://evil.test/cat.png'}]}:
    url.includes('/banners?')?{items:[{slug:'8879-music',name:'Music night'}]}:
    {items:[{slug:'81191-music',name:'Music reaction',type:'png'}]};
  return {ok:true,json:async()=>data};
};
const flush=()=>new Promise(r=>setTimeout(r,0));
viz.ph.querySelector('.chat-media-launch').click();await flush();
let picker=document.querySelector('.aether-media-picker');
assert.equal(picker.querySelectorAll('[role=tab]').length,5);
picker.querySelector('[role=tab]:nth-child(3)').click();await flush();
assert.equal(picker.querySelector('.aether-media-item img').src,`${STICKERS_API}/telegram/file/THUMB_456/preview`);
picker.querySelector('.aether-media-item').click();
assert.equal(document.querySelector('.aether-media-picker'),null);
assert.equal(viz.chatInteractions.record(1).media[0].kind,'telegram');
assert.equal(viz.inner.querySelectorAll('.chat-local-media').length,2);
assert.equal(viz.rows.find(row=>row.index===1).media[0].querySelector('img').src,`${STICKERS_API}/telegram/file/THUMB_456/preview`);

renderLibrary();
document.querySelector('[data-media-open="pfps"]').click();await flush();
picker=document.querySelector('.aether-media-picker');
assert.equal(picker.querySelector('input[type=search]').value,'music');
picker.querySelector('.aether-media-item').click();
assert.ok(picker.querySelector('.aether-media-use'));
picker.querySelector('.aether-media-use').click();
assert.equal(window.SystemState.settings.chat_media_avatar.slug,'11334-cat');
assert.equal(document.querySelector('[data-media-profile="pfp"] img').src,`${STICKERS_API}/pfp/11334-cat/preview`);
assert.equal(viz.ph.querySelector('.chat-custom-avatar').src,`${STICKERS_API}/pfp/11334-cat/preview`);
assert.equal(viz.ph.querySelectorAll('header.chat-topbar').length,1,'changing avatar keeps the compact header');
assert.equal(setChatProfile('pfp',{kind:'banner',slug:'bad'}),false);
assert.equal(window.SystemState.settings.chat_media_avatar.slug,'11334-cat','wrong profile type is not saved');
const banner={kind:'banner',slug:'8879-music',name:'Music night',image:'https://evil.test/banner.png'};
assert.equal(setChatProfile('banner',banner),true);
assert.match(viz.ph.querySelector('header.chat-topbar').style.backgroundImage,/banner\/8879-music\/preview/);
assert.doesNotMatch(viz.ph.querySelector('header.chat-topbar').style.backgroundImage,/evil\.test/);
assert.equal(window.SystemState.settings.chat_media_banner.image,undefined,'only validated IDs, not external URLs, are saved');
assert.ok(saved.length>=2);
assert.equal(setChatProfile('pfp',null),true);
assert.equal(setChatProfile('banner',null),true);
assert.equal(viz.ph.querySelector('.chat-custom-avatar'),null);
assert.ok(viz.ph.querySelector('.chat-avatar img[src="https://aether.test/art.png"]'));
assert.ok(!viz.ph.querySelector('header.chat-topbar').classList.contains('has-chat-banner'));
const choose=document.querySelector('[data-media-profile="pfp"] button');
choose.focus();choose.click();await flush();
picker=document.querySelector('.aether-media-picker');
picker.querySelector('.aether-media-item').click();picker.querySelector('.aether-media-use').click();
assert.ok(document.activeElement.matches('[data-media-open]'),'replaced profile chooser restores focus to a surviving launcher');
setChatProfile('pfp',null);

// Seeking drops only later DOM; in-memory selections return on replay/remount.
viz.frame(frameState(lyrics,0.2),.016);
assert.equal(viz.inner.querySelectorAll('.chat-local-media').length,1);
viz.frame(frameState(lyrics,-1),.016);
assert.equal(viz.inner.querySelectorAll('.chat-local-media').length,0);
viz.frame(frameState(lyrics,6.2),.016);
assert.equal(viz.inner.querySelectorAll('.chat-local-media').length,2);
assert.ok(viz.inner.querySelector('.chat-aside p').textContent==='Ah','parenthetical aside is still owned by the other participant');
viz.chatInteractions.open(0);
const remove=[...viz.ph.querySelectorAll('.chat-menu-action')].find(b=>b.textContent.includes('Remove last local media'));
assert.ok(remove);remove.click();
assert.equal(viz.inner.querySelectorAll('.chat-local-media').length,1,'manual media can be removed without deleting lyrics');
assert.equal(viz.inner.querySelectorAll('[data-message-index]').length,3,'every lyric/aside is retained');
viz.ph.querySelector('.chat-media-launch').click();await flush();
assert.ok(document.querySelector('.aether-media-picker'));
viz.destroy();
assert.equal(document.querySelector('.aether-media-picker'),null,'stage teardown closes its chat picker');
viz=new Messages(document.getElementById('stage'),context(lyrics)).mount();window.AetherMusic.state.viz=viz;
viz.frame(frameState(lyrics,6.2),.016);
assert.equal(viz.inner.querySelectorAll('.chat-local-media').length,1,'selection survives stage remount');
viz.destroy();
const other=parseLRC('[00:00]A different song');
viz=new Messages(document.getElementById('stage'),context(other)).mount();viz.frame(frameState(other,0.2),.016);
assert.equal(viz.inner.querySelectorAll('.chat-local-media').length,0,'another song never inherits selected media');
assert.equal(viz.chatInteractions.addMedia(0,{kind:'emote',source:'7tv',id:'01GAZ199Z8000FEWHS6AT5QZV0',name:'peepoHappy'}),true);
assert.equal(viz.inner.querySelector('.chat-local-media img').src,`${STICKERS_API}/emote/7tv/01GAZ199Z8000FEWHS6AT5QZV0/preview`,'manually selected emotes still render in chat');
viz.frame(frameState(other,-1),.016);
viz.frame(frameState(other,0.2),.016);
assert.equal(viz.inner.querySelector('.chat-local-media img').src,`${STICKERS_API}/emote/7tv/01GAZ199Z8000FEWHS6AT5QZV0/preview`,'manual emotes survive seeking');
viz.destroy();
assert.ok(searches>=2);

// Automatic source order: StickersAPI, then Discord, then Sticker.ly/local.
let urls=[];
globalThis.fetch=async(url)=>{
  urls.push(url);
  if(url.startsWith(STICKERS_API)&&url.includes('q=happy'))return {ok:true,json:async()=>({items:[{slug:'82222-happy',name:'Happy',type:'png'}]})};
  if(url.startsWith(STICKERS_API))return {ok:false,status:503};
  if(url.includes('discord.com/api/'))return {ok:true,json:async()=>({sticker_packs:[{name:'Test',stickers:[{id:'123456789012345678',name:'Sad',tags:'sad crying',format_type:1,available:true}]}]})};
  throw Error('Unexpected request '+url);
};
function tile(){const sticker=document.createElement('div');sticker.innerHTML='<span>🙂</span><strong>Local</strong>';document.body.append(sticker);return sticker;}
let sticker=tile(), host={stickerJobs:new Set()};
attachAutomaticSticker(host,sticker,{mood:'joy'}, {stickerSource:()=> 'auto'},0,0,false);
await flush();
assert.ok(urls[0].includes('/search?q=happy'),'StickersAPI searches a mood label, not lyric text');
assert.ok(!urls.some(url=>url.includes('discord.com')),'Discord is not fetched after a successful StickersAPI match');
let image=sticker.querySelector('.chat-stickersapi-image');assert.ok(image);image.onload();await flush();
assert.ok(sticker.classList.contains('has-stickersapi-image'));
assert.equal(host.stickerJobs.size,0,'completed jobs are released to avoid unbounded growth');

urls=[];sticker=tile();host={stickerJobs:new Set()};
attachAutomaticSticker(host,sticker,{mood:'sad'},{stickerSource:()=> 'auto'},1,0,false);
await flush();
assert.ok(urls.some(url=>url.includes('discord.com/api/')),'Discord remains a fallback after API 503');
image=sticker.querySelector('.chat-discord-image');assert.ok(image);image.onload();await flush();
assert.ok(sticker.classList.contains('has-discord-sticker'));

urls=[];sticker=tile();host={stickerJobs:new Set()};
const custom={url:'https://stickerly.pstatic.net/sticker_pack/Own/pic.png',name:'Own',mood:'devotion'};
attachAutomaticSticker(host,sticker,{mood:'devotion'},{stickerSource:()=> 'auto',customStickers:()=>[custom]},2,0,false);
await flush();
assert.ok(urls.some(url=>url.includes('stickerapi.sbs')));
image=sticker.querySelector('.chat-stickerly-image');assert.ok(image,'Sticker.ly follows an unmatched Discord catalogue');
image.onerror();
assert.ok(sticker.querySelector('strong').textContent==='Local','failed remote images keep the built-in sticker');
sticker.remove();

// GIF slots use the existing GIF providers in every source mode, never
// StickersAPI emotes. The bubble is not yet in the DOM when the fetch starts.
const { addChatReaction }=await import('../../src/vendor/verci/viz/chat-reactions.js');
const reaction=(mood,gif,source,index)=>{
  const bubble=document.createElement('div');bubble.innerHTML='<p>Lyric stays untouched</p>';
  const plan=[];plan[index]={mood,gif,sticker:null,emoji:null};
  const viz={ctx:{song:{title:'Song'},lyrics:{lines:[]},opts:{density:()=> 'balanced',gifs:()=>true,stickers:()=>false,emojis:()=>false,stickerSource:()=>source}},
    reactionPlan:plan,reactionDensity:'balanced'};
  addChatReaction(viz,bubble,'Lyric stays untouched',index);
  document.body.append(bubble);
  return {bubble,viz};
};
urls=[];
globalThis.fetch=async(url)=>{
  urls.push(url);
  if(url.includes('nekos.best'))return {ok:true,json:async()=>({results:[{url:'https://nekos.best/img/joy.gif'}]})};
  throw Error('Unexpected GIF request '+url);
};
let example=reaction('joy','smile','discord',0);await flush();
assert.deepEqual(urls,['https://nekos.best/api/v2/smile'],'explicit Discord mode keeps the previous GIF provider');
let gif=example.bubble.querySelector('.chat-gif img');assert.ok(gif);gif.onload();
assert.equal(example.bubble.querySelector('.chat-gif').hidden,false);
example.bubble.remove();example.viz.reactionAbort.abort();

urls=[];example=reaction('joy','smile','auto',1);await flush();
assert.deepEqual(urls,['https://nekos.best/api/v2/smile'],'automatic GIF slots no longer request StickersAPI emotes');
assert.equal(example.bubble.querySelector('.chat-stickersapi-image'),null);
gif=example.bubble.querySelector('.chat-gif img');assert.equal(gif.src,'https://nekos.best/img/joy.gif');
gif.onload();await flush();assert.equal(example.bubble.querySelector('.chat-gif').hidden,false);
example.bubble.remove();example.viz.reactionAbort.abort();

urls=[];
globalThis.fetch=async(url)=>{
  urls.push(url);
  if(url.includes('nekos.best'))return {ok:false,status:503};
  if(url.includes('api.waifu.pics/sfw/cry'))return {ok:true,json:async()=>({url:'https://i.waifu.pics/cry.gif'})};
  throw Error('Unexpected GIF request '+url);
};
example=reaction('sad','cry','auto',2);await flush();
assert.deepEqual(urls,['https://nekos.best/api/v2/cry','https://api.waifu.pics/sfw/cry'],'GIF provider fallback works without an emote search');
gif=example.bubble.querySelector('.chat-gif img');assert.equal(gif.src,'https://i.waifu.pics/cry.gif');
gif.onload();assert.equal(example.bubble.querySelector('.chat-gif').hidden,false);
example.bubble.remove();example.viz.reactionAbort.abort();
console.log('Finder, manual emotes, chat media, seeks, privacy, stickers and GIF fallbacks verified.');
