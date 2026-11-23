// Real image URLs featured on https://sticker.ly/ (Hearts pack by Killthislove).
// No private API, scraping proxy, catalogue-search or trending-feed claims.
import { REACTION_DICTIONARY } from '../viz/reaction-dictionary.js';
export const STICKER_MOODS=REACTION_DICTIONARY.map(r=>r[0]);
const HEART_ROOT='https://stickerly.pstatic.net/sticker_pack/HfFQeOuK9eRC8qmM2VMqEg/U2VF7G/1/';
export const FEATURED_STICKERS=[
 'e4536a9d-9f4f-4720-9f82-6189488f5bd0','97f9461d-9c1a-4dfd-ba11-9904400637c2',
 '208dd9f5-2e2e-4e2b-a5a0-0e4c1efe4187','39f50e5b-cbc0-41b8-be8a-98961761d626',
 '0d10c4fe-a1cd-44ad-ad23-ae248e4e5861','9364cc56-5da8-4440-ba10-0b7b39b4a831',
 'f88de415-5e13-454d-96ac-2d6f87405c32','a45011cc-03ba-47bd-b451-07a144b9cb2f',
 '4fc68bdb-fe04-40f6-88cd-55fa5870cab1'
].map(id=>({url:HEART_ROOT+id+'.png',mood:'love',name:'Hearts',creator:'Killthislove',source:'https://sticker.ly/',animated:false}));
export function stickerlyURL(value){
 try{
  if(typeof value!=='string'||value.length>1600)return null;
  const u=new URL(value);
  if(u.protocol!=='https:'||u.hostname!=='stickerly.pstatic.net'||u.port||u.username||u.password||u.search||u.hash)return null;
  if(!/^\/sticker_pack\/[A-Za-z0-9_./-]+\.(png|webp|gif)$/.test(u.pathname))return null;
  return u.href;
 }catch{return null;}
}
export function cleanSticker(item){
 const url=stickerlyURL(item?.url);
 if(!url||!STICKER_MOODS.includes(item?.mood))return null;
 return {url,mood:item.mood,name:String(item.name||'My Sticker.ly sticker').slice(0,80),creator:String(item.creator||'').slice(0,80),animated:!url.endsWith('.png'),source:'https://sticker.ly/'};
}
export function customStickers(items){return Array.isArray(items)?items.slice(0,50).map(cleanSticker).filter(Boolean):[];}
export function pickStickerly(mood,seed=0,custom=[],staticOnly=false){
 const mine=customStickers(custom).filter(s=>s.mood===mood&&(!staticOnly||!s.animated));
 // Only explicitly tagged moods are used; a heart is not a generic sad/angry reaction.
 const pool=mine.length?mine:FEATURED_STICKERS.filter(s=>s.mood===mood);
 return pool.length?pool[(seed>>>0)%pool.length]:null;
}
export function attachStickerly(sticker,reaction,options,index,seed,reduced){
 const connection=globalThis.navigator?.connection;
 if(options.stickerSource?.()!=='stickerly'||connection?.saveData||/(^|-)2g$/.test(connection?.effectiveType||''))return;
 const item=pickStickerly(reaction.mood,seed+index,options.customStickers?.(),reduced);
 if(!item)return;
 const img=document.createElement('img');img.className='chat-stickerly-image';img.alt=`${item.name}${item.creator?' by '+item.creator:''} (Sticker.ly)`;
 img.referrerPolicy='no-referrer';img.decoding='async';img.hidden=true;
 img.onload=()=>{if(sticker.isConnected){img.hidden=false;sticker.classList.add('has-stickerly-image');}};
 img.onerror=()=>{img.remove();sticker.classList.remove('has-stickerly-image');};
 img.src=item.url;sticker.append(img);
}
