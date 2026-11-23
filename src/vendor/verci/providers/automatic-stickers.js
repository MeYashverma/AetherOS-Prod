import { discordCatalogue, pickDiscordSticker, renderDiscordSticker } from './discord-stickers.js';
import { attachStickerly } from './stickerly.js';
import { moodMedia, renderMediaImage } from './stickersapi.js';

export function automaticMediaAllowed() {
 const connection=globalThis.navigator?.connection;
 return !connection?.saveData && !/(^|-)2g$/.test(connection?.effectiveType||'');
}

export function cleanupStickerJobs(viz,all=false){
 for(const job of viz.stickerJobs||[])if(all||!job.element.isConnected){job.controller.abort();viz.stickerJobs.delete(job);}
}
export function attachAutomaticSticker(viz,sticker,reaction,options,index,seed,reduced){
 const source=options.stickerSource?.() || 'local';
 if(source==='local'||!automaticMediaAllowed())return;
 const fallback=()=>attachStickerly(sticker,reaction,{...options,stickerSource:()=>['auto','stickerapi','stickerly'].includes(source)?'stickerly':'local'},index,seed,reduced);
 if(source==='stickerly'){fallback();return;}
 const controller=new AbortController();const job={element:sticker,controller};
 viz.stickerJobs ||= new Set();viz.stickerJobs.add(job);
 const active=()=>!controller.signal.aborted&&sticker.isConnected;
 const discord=async()=>{
  const list=await discordCatalogue();
  if(!active())return false;
  const item=pickDiscordSticker(list,reaction.mood,seed+index,reduced);
  if(!item)return false;
  const media=document.createElement('div');media.className='chat-discord-media';media.hidden=true;sticker.append(media);
  const loaded=await renderDiscordSticker(media,item,controller.signal,reduced);
  if(loaded&&active()){media.hidden=false;sticker.classList.add('has-discord-sticker');return true;}
  media.remove();return false;
 };
 (async()=>{
  if(options.lyricMediaEnabled?.()!==false && (source==='auto'||source==='stickerapi')){
   const item=await moodMedia('sticker',reaction.mood,seed+index,reduced);
   if(!active())return;
   if(item&&await renderMediaImage(sticker,item,controller.signal)&&active()){
    sticker.classList.add('has-stickersapi-image');return;
   }
  }
  if(!active())return;
  try{if(await discord())return;}catch{} // Network/CORS/content failure; preserve the local tile.
  if(active())fallback();
 })().catch(()=>{if(active())fallback();}).finally(()=>viz.stickerJobs?.delete(job));
}

// A separate, smaller emote beside a sticker. A missing emote never replaces
// the sticker or its local emoji fallback, and teardown/seek aborts the preview.
export function attachAutomaticEmote(viz,sticker,mood,seed,reduced){
 const slot=document.createElement('span');slot.className='chat-emote';slot.hidden=true;sticker.append(slot);
 const controller=new AbortController(),job={element:slot,controller};
 viz.stickerJobs ||= new Set();viz.stickerJobs.add(job);
 moodMedia('emote',mood,seed,reduced).then(async item=>{
  if(!item||controller.signal.aborted||!slot.isConnected)return;
  const loaded=await renderMediaImage(slot,item,controller.signal,'chat-stickersapi-emote-image');
  if(loaded&&!controller.signal.aborted&&slot.isConnected)slot.hidden=false;
 }).catch(()=>{}).finally(()=>viz.stickerJobs?.delete(job));
}
