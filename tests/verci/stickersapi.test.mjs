import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { STICKERS_API, cleanMedia, normalizeMedia, mediaURL, listMedia, moodMedia, renderMediaImage } from '../../src/vendor/verci/providers/stickersapi.js';

const sticker = normalizeMedia('sticker',{slug:'71189-love',name:'Love',type:'png',image:'https://cdn.stickers.gg/stickers/71189-love.png'});
assert.equal(mediaURL(sticker),`${STICKERS_API}/sticker/71189-love/preview`);
assert.equal(mediaURL(sticker,'download'),`${STICKERS_API}/sticker/71189-love/download`);
assert.deepEqual(cleanMedia(sticker),sticker);
assert.equal(normalizeMedia('sticker',{slug:'../bad',type:'png'}),null);
assert.equal(normalizeMedia('sticker',{slug:'xx',type:'svg'}),null);
assert.equal(normalizeMedia('pfp',{slug:'x?track=1'}),null);
assert.equal(normalizeMedia('banner',{slug:'foo/../bar'}),null);
assert.equal(mediaURL({kind:'sticker',slug:'safe',image:'https://evil.test/malware.png'}),`${STICKERS_API}/sticker/safe/preview`);
assert.equal(mediaURL({kind:'pfp',slug:'11334-cat'}),`${STICKERS_API}/pfp/11334-cat/preview`);
assert.equal(mediaURL({kind:'banner',slug:'8879-guitar'}),`${STICKERS_API}/banner/8879-guitar/preview`);
assert.equal(mediaURL({kind:'emote',id:'123',source:'evil'}),null);
assert.equal(normalizeMedia('emote',{source:'7tv',id:'123',type:'svg',animated:false}),null, 'unsupported emote previews are ignored');
assert.equal(mediaURL(normalizeMedia('emote',{source:'ffz',id:'720510',type:null,name:'ffzRainbow',animated:false})),`${STICKERS_API}/emote/ffz/720510/preview`, 'FFZ does not always include a media type');
const emote=normalizeMedia('emote',{source:'7tv',id:'01GAZ199Z8000FEWHS6AT5QZV0',name:'peepoHappy',type:'webp',animated:false});
assert.equal(mediaURL(emote),`${STICKERS_API}/emote/7tv/01GAZ199Z8000FEWHS6AT5QZV0/preview`);
const telegram=normalizeMedia('telegram',{fileId:'FILE_a-123',thumbnailFileId:'THUMB_b-456',emoji:'😂',isAnimated:true});
assert.equal(mediaURL(telegram),`${STICKERS_API}/telegram/file/THUMB_b-456/preview`);
assert.equal(mediaURL(telegram,'download'),`${STICKERS_API}/telegram/file/FILE_a-123/download`);
assert.equal(mediaURL({...telegram,previewId:'../bad'}),null);

const requests=[];
const fake = async (url, opts) => {
  requests.push({url,opts});
  assert.equal(opts.credentials,'omit'); assert.equal(opts.referrerPolicy,'no-referrer');
  assert.ok(opts.signal); assert.equal(opts.headers.Accept,'application/json');
  const data = url.includes('/emotes?') ? { items:[{source:'bttv',id:'abcdef',name:':tf:',type:'png',animated:false}], unavailable:['ffz'] }
    : url.includes('/telegram/stickers/') ? {stickers:[{fileId:'FILE_a-123',thumbnailFileId:'THUMB_b-456',emoji:'😂',isAnimated:true}]}
    : url.includes('/pfps?') ? {items:[{slug:'11334-cat',name:'cat',image:'https://evil.test/not-loaded.png'}],nextPage:4}
    : url.includes('/banners?') ? {items:[{slug:'8879-guitar',name:'Guitar'}]}
    : {items:[{slug:'71189-love',name:'Love',type:'png',image:'https://evil.test/not-loaded.svg'},{slug:'bad',type:'svg'}]};
  return {ok:true,json:async()=>data};
};
assert.equal((await listMedia('stickers',{query:'I love & you'},fake)).items[0].slug,'71189-love');
assert.match(requests.at(-1).url,/q=I%20love%20%26%20you&limit=24$/);
assert.equal((await listMedia('emotes',{query:'happy',source:'unknown'},fake)).items[0].name,':tf:');
assert.match(requests.at(-1).url,/\/emotes\?source=all&limit=24&q=happy$/);
assert.equal((await listMedia('telegram',{set:'UtyaDuck'},fake)).items[0].previewId,'THUMB_b-456');
assert.equal((await listMedia('pfps',{query:'cats',page:3},fake)).nextPage,4);
assert.match(requests.at(-1).url,/\/pfps\?tag=cats&sort=featured&page=3$/);
assert.equal((await listMedia('banners',{query:'music'},fake)).items[0].kind,'banner');
assert.equal(requests.length,5);
await assert.rejects(listMedia('telegram',{set:'../token'},fake),/public Telegram sticker set/);
await assert.rejects(listMedia('pfps',{query:'music/../../private'},fake),/single PFP\/banner tag/);
assert.equal(requests.length,5,'invalid paths never issue a request');
await assert.rejects(listMedia('stickers',{},async()=>({ok:false,status:429})),/HTTP 429/);
await assert.rejects(listMedia('stickers',{},async()=>({ok:true,json:async()=>({})})),/Unexpected/);

let moodCalls=0;
const moodFetch=async()=>{moodCalls++;return {ok:true,json:async()=>({items:[
  {slug:'fun-happy',type:'png',name:'Happy'}, {slug:'fun-happy-gif',type:'gif',name:'Happy animated'},
  {slug:'totally-unrelated',type:'png',name:'unrelated'}
]})};};
const [a,b]=await Promise.all([moodMedia('sticker','joy',0,false,moodFetch),moodMedia('sticker','joy',1,false,moodFetch)]);
assert.deepEqual([a.slug,b.slug],['fun-happy','fun-happy-gif']);
assert.equal((await moodMedia('sticker','joy',1,true,moodFetch)).slug,'fun-happy','reduced motion excludes GIFs');
assert.equal(moodCalls,1,'concurrent/successive moods share cached requests');
assert.equal(await moodMedia('sticker','not/valid',0,false,moodFetch),null);
let positiveMoodURL;
const positiveEmote=await moodMedia('emote','love',0,false,async url=>{
  positiveMoodURL=url;
  return {ok:true,json:async()=>({items:[{source:'7tv',id:'01GAZ199Z8000FEWHS6AT5QZV0',name:'peepoHappy',type:'webp',animated:false}]})};
});
assert.equal(positiveEmote?.name,'peepoHappy');
assert.match(positiveMoodURL,/\/emotes\?source=all&limit=24&q=happy$/, 'a broad positive mood can show a real emote even without a love-named item');

const dom=new JSDOM('<div id="slot"></div>');globalThis.document=dom.window.document;
const slot=document.getElementById('slot');
const controller=new AbortController();
let done=renderMediaImage(slot,sticker,controller.signal);
let img=slot.querySelector('img');
assert.equal(img.hidden,true,'the local fallback remains visible until a thumbnail loads');
assert.equal(img.referrerPolicy,'no-referrer');
assert.equal(img.src,mediaURL(sticker));
img.onload();assert.equal(await done,true);assert.equal(img.hidden,false);
done=renderMediaImage(slot,sticker,controller.signal);img=slot.querySelectorAll('img')[1];img.onerror();
assert.equal(await done,false);assert.equal(slot.querySelectorAll('img').length,1,'broken images do not replace the fallback');
done=renderMediaImage(slot,telegram,controller.signal);img=slot.querySelectorAll('img')[1];controller.abort();
assert.equal(await done,false);assert.equal(slot.querySelectorAll('img').length,1,'stage teardown aborts outstanding media');
assert.equal(await renderMediaImage(slot,{kind:'sticker',slug:'../unsafe'}),false);
console.log('StickersAPI source endpoints, no-key requests, safe URLs, fallback, motion and deduplication verified.');
