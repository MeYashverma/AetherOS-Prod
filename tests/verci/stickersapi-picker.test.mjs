import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { openMediaPicker } from '../../src/vendor/verci/viz/stickersapi-picker.js';
import { STICKERS_API } from '../../src/vendor/verci/providers/stickersapi.js';

const dom=new JSDOM('<button id="launch">Browse media</button>',{pretendToBeVisual:true,url:'https://aether.test'});
globalThis.document=dom.window.document;
globalThis.matchMedia=()=>({matches:false});
document.getElementById('launch').focus();
const calls=[];
const fake=async(url,options)=>{
  calls.push({url,options});
  const data=url.includes('/emotes?')?{items:[{source:'7tv',id:'01GAZ199Z8000FEWHS6AT5QZV0',name:'peepoHappy',type:'webp'}]}:
    url.includes('/telegram/stickers/')?{stickers:[{fileId:'FILE_a-123',thumbnailFileId:'THUMB_b-456',emoji:'😂',isAnimated:true}]}:
    url.includes('/pfps?')?{items:[{slug:'11334-cat',name:'cat',image:'https://evil.test/cat.png'}],nextPage:2}:
    url.includes('/banners?')?{items:[{slug:'8879-guitar',name:'guitar'}]}:
    {items:[{slug:'71189-love',name:'Love <img src=x onerror=alert(1)>',type:'png',image:'https://evil.test/evil.png'}]};
  return {ok:true,json:async()=>data};
};
const flush=()=>new Promise(resolve=>setTimeout(resolve,0));
let p=openMediaPicker({fetchImpl:fake});await flush();
assert.equal(document.querySelectorAll('[role=dialog]').length,1);
assert.equal(p.dialog.getAttribute('aria-modal'),'true');
assert.equal(p.dialog.querySelectorAll('[role=tab]').length,5);
assert.equal(p.dialog.querySelectorAll('.aether-media-item').length,1);
assert.equal(p.dialog.querySelector('.aether-media-item img').src,`${STICKERS_API}/sticker/71189-love/preview`,'third-party URLs are never inserted into DOM');
assert.equal(p.dialog.querySelector('.aether-media-item img').referrerPolicy,'no-referrer');
assert.equal(p.dialog.querySelector('.aether-media-item img').getAttribute('onerror'),null,'names remain plain text');
assert.equal(p.dialog.querySelectorAll('.aether-media-item img[src="x"]').length,0,'malicious names cannot create elements');
assert.match(p.dialog.querySelector('.aether-media-item').textContent,/Love <img/);
p.dialog.querySelector('.aether-media-item').click();
assert.equal(p.dialog.querySelector('.aether-media-details input').value,`${STICKERS_API}/sticker/71189-love/preview`);
assert.equal(p.dialog.querySelector('.aether-media-details a').href,`${STICKERS_API}/sticker/71189-love/download`);
const tabs=p.dialog.querySelectorAll('[role=tab]');
tabs[1].click();await flush();
assert.match(calls.at(-1).url,/\/emotes\?source=all&limit=24&q=happy$/);
assert.equal(p.dialog.querySelector('.aether-media-search select').hidden,false);
p.dialog.querySelector('.aether-media-search select').value='7tv';
p.dialog.querySelector('.aether-media-search select').dispatchEvent(new dom.window.Event('change'));await flush();
assert.match(calls.at(-1).url,/source=7tv/);
const form=p.dialog.querySelector('form'),input=p.dialog.querySelector('input[type=search]');
input.value='dance & joy';const count=calls.length;
form.dispatchEvent(new dom.window.Event('submit',{cancelable:true,bubbles:true}));await flush();
assert.equal(calls.length,count+1,'one request per submitted search');
assert.match(calls.at(-1).url,/q=dance%20%26%20joy/);
tabs[2].click();await flush();
assert.match(calls.at(-1).url,/\/telegram\/stickers\/UtyaDuck$/);
assert.equal(p.dialog.querySelector('.aether-media-item img').src,`${STICKERS_API}/telegram/file/THUMB_b-456/preview`);
tabs[3].click();await flush();
assert.equal(p.dialog.querySelector('.aether-media-item img').src,`${STICKERS_API}/pfp/11334-cat/preview`);
assert.equal(p.dialog.querySelector('.aether-media-pages').hidden,false);
p.dialog.querySelector('.aether-media-pages button:last-child').click();await flush();
assert.match(calls.at(-1).url,/page=2$/);
tabs[4].click();await flush();
assert.equal(p.dialog.querySelector('.aether-media-item img').src,`${STICKERS_API}/banner/8879-guitar/preview`);
p.dialog.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
assert.equal(document.querySelector('[role=dialog]'),null);
assert.equal(document.activeElement,document.getElementById('launch'),'closing restores launch focus');

globalThis.matchMedia=()=>({matches:true});
p=openMediaPicker({fetchImpl:async()=>({ok:true,json:async()=>({items:[{slug:'happy-gif',name:'Happy animated',type:'gif'}]})})});await flush();
assert.equal(p.dialog.querySelectorAll('.aether-media-item').length,0,'reduced motion filters animated sticker tiles');
assert.match(p.dialog.querySelector('[role=status]').textContent,/No matching media/);
p.close();globalThis.matchMedia=()=>({matches:false});

let selected;
p=openMediaPicker({types:['stickers','emotes','telegram'],initialType:'telegram',fetchImpl:fake,onSelect:item=>{selected=item;}});await flush();
assert.equal(p.dialog.querySelectorAll('[role=tab]').length,3);
p.dialog.querySelector('.aether-media-item').click();
assert.equal(selected.kind,'telegram');assert.equal(document.querySelector('[role=dialog]'),null,'chat picker closes after a choice');
let avatar,banner;
p=openMediaPicker({initialType:'pfps',fetchImpl:fake,onAvatar:item=>{avatar=item;},onBanner:item=>{banner=item;}});await flush();
p.dialog.querySelector('.aether-media-item').click();p.dialog.querySelector('.aether-media-use').click();
assert.equal(avatar.slug,'11334-cat');assert.equal(document.querySelector('[role=dialog]'),null);
p=openMediaPicker({initialType:'banners',fetchImpl:fake,onAvatar:item=>{avatar=item;},onBanner:item=>{banner=item;}});await flush();
p.dialog.querySelector('.aether-media-item').click();p.dialog.querySelector('.aether-media-use').click();
assert.equal(banner.slug,'8879-guitar');

// In chat mode, profile assets open the Use as avatar/banner action instead
// of silently inserting a profile photo as a lyric reaction.
let chatSelection;
p=openMediaPicker({initialType:'pfps',fetchImpl:fake,onSelect:item=>{chatSelection=item;},onAvatar:item=>{avatar=item;}});await flush();
p.dialog.querySelector('.aether-media-item').click();
assert.equal(chatSelection,undefined);
assert.equal(p.dialog.querySelector('.aether-media-use').textContent,'Use as chat avatar');
p.dialog.querySelector('.aether-media-use').click();
assert.equal(avatar.kind,'pfp');

// Switching tabs or closing a picker aborts in-flight searches.
const stalled=[];
const slow=(url,opts)=>{stalled.push(opts.signal);return new Promise(()=>{});};
p=openMediaPicker({fetchImpl:slow});await flush();
p.dialog.querySelectorAll('[role=tab]')[1].click();await flush();
assert.equal(stalled[0].aborted,true);
assert.equal(stalled[1].aborted,false);
p.close();assert.equal(stalled[1].aborted,true);
assert.equal(document.querySelector('.aether-media-overlay'),null);
assert.throws(()=>openMediaPicker({types:['constructor','__proto__'],fetchImpl:fake}),/No media categories/);
console.log('App-wide picker search, five tabs, safe previews, local selection, focus and abort verified.');
