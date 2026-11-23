import { discordCatalogue, pickDiscordSticker, renderDiscordSticker } from './discord-stickers.js';
import { attachStickerly } from './stickerly.js';
export function cleanupStickerJobs(viz,all=false){
 for(const job of viz.stickerJobs||[])if(all||!job.element.isConnected){job.controller.abort();viz.stickerJobs.delete(job);}
}
export function attachAutomaticSticker(viz,sticker,reaction,options,index,seed,reduced){
 const source=options.stickerSource?.() || 'local';
 const connection=globalThis.navigator?.connection;
 if(source==='local'||connection?.saveData||/(^|-)2g$/.test(connection?.effectiveType||''))return;
 const fallback=()=>attachStickerly(sticker,reaction,{...options,stickerSource:()=>source==='auto'||source==='stickerly'?'stickerly':'local'},index,seed,reduced);
 if(source==='stickerly'){fallback();return;}
 const controller=new AbortController();const job={element:sticker,controller};
 viz.stickerJobs ||= new Set();viz.stickerJobs.add(job);
 discordCatalogue().then(async list=>{
  if(controller.signal.aborted||!sticker.isConnected)return;
  const item=pickDiscordSticker(list,reaction.mood,seed+index,reduced);
  if(!item){fallback();return;}
  const media=document.createElement('div');media.className='chat-discord-media';media.hidden=true;sticker.append(media);
  const loaded=await renderDiscordSticker(media,item,controller.signal,reduced);
  if(loaded&&!controller.signal.aborted&&sticker.isConnected){media.hidden=false;sticker.classList.add('has-discord-sticker');}
  else{media.remove();if(!controller.signal.aborted)fallback();}
 }).catch(()=>{if(!controller.signal.aborted&&sticker.isConnected)fallback();});
}
