import { discordCatalogue, pickDiscordSticker, renderDiscordSticker } from './discord-stickers.js';
import { attachStickerly } from './stickerly.js';
import { moodMedia, renderMediaImage } from './stickersapi.js';

export function cleanupStickerJobs(viz,all=false){
 for(const job of viz.stickerJobs||[])if(all||!job.element.isConnected){job.controller.abort();viz.stickerJobs.delete(job);}
}
export function attachAutomaticSticker(viz,sticker,reaction,options,index,seed,reduced){
 const source=options.stickerSource?.() || 'local';
 const connection=globalThis.navigator?.connection;
 if(source==='local'||connection?.saveData||/(^|-)2g$/.test(connection?.effectiveType||''))return;
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
  if(source==='auto'||source==='stickerapi'){
   const item=await moodMedia('sticker',reaction.mood,seed+index,reduced);
   if(!active())return;
   if(item&&await renderMediaImage(sticker,item,controller.signal)&&active()){
    sticker.classList.add('has-stickersapi-image');
    const credit=document.createElement('small');credit.className='chat-sticker-credit';
    credit.textContent='StickersAPI';sticker.append(credit);
    return;
   }
  }
  if(!active())return;
  try{if(await discord())return;}catch{} // Network/CORS/content failure; preserve the local tile.
  if(active())fallback();
 })().catch(()=>{if(active())fallback();}).finally(()=>viz.stickerJobs?.delete(job));
}
