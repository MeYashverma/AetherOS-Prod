// Decorative reactions, not lyric replacements or singer metadata.
import { attachAutomaticSticker } from '../providers/automatic-stickers.js';
import { moodMedia, renderMediaImage } from '../providers/stickersapi.js';
import { analyzeLyric, buildReactionPlan, reactionHash as hash } from './reaction-intelligence.js';
export function lyricReaction(text,index,seed='') {
  const info=analyzeLyric(text);if(!info)return null;
  const n=hash(`${seed}:${index}:${text}`);
  return {...info,emoji:n%3!==0?info.emojis[n%info.emojis.length]:null,gif:index%8===3&&n%3!==0?info.gif:null};
}
const cache=new Map(), cooldown=new Map();
const CATEGORIES=['hug','cry','dance','smile','angry','sleep'];
export async function reactionGif(category, signal, fetchImpl=fetch, variant=0) {
  if(!CATEGORIES.includes(category))return null;
  const key=`${category}:${variant%3}`,old=cache.get(key);
  if(old && Date.now()-old.at<300000)return old.item;
  const alternatives={hug:'hug',cry:'cry',dance:'dance',smile:'happy'};
  const sources=[{name:'nekos.best',endpoint:`https://nekos.best/api/v2/${category}`,host:'nekos.best',read:d=>d.results?.[0]?.url}];
  if(alternatives[category])sources.push({name:'waifu.pics',endpoint:`https://api.waifu.pics/sfw/${alternatives[category]}`,host:'i.waifu.pics',read:d=>d.url});
  for(const source of sources) {
    if(signal?.aborted)throw new DOMException('Aborted','AbortError');
    if(cooldown.get(source.name)>Date.now())continue;
    try {
      const response=await fetchImpl(source.endpoint,{signal:AbortSignal.any([...(signal?[signal]:[]),AbortSignal.timeout(7000)]),referrerPolicy:'no-referrer'});
      if(!response.ok)throw Error('Reaction service unavailable');
      let url;try{url=new URL(source.read(await response.json()));}catch{return null;}
      if(url.protocol!=='https:'||url.hostname!==source.host||!url.pathname.endsWith('.gif'))return null;
      const item={url:url.href,alt:`${category} reaction (anime GIF)`,provider:source.name};
      cache.set(key,{at:Date.now(),item});return item;
    } catch(e) {if(signal?.aborted)throw e;cooldown.set(source.name,Date.now()+30000);}
  }
  return null;
}
export function addChatReaction(viz, bubble, text, index) {
  const options=viz.ctx.opts || {};
  const density=options.density?.() || 'balanced';
  const reduced=typeof matchMedia==='function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const connection=globalThis.navigator?.connection;
  const stickersEnabled=options.stickers?.()!==false;
  const gifsEnabled=options.gifs?.()!==false && !reduced && !connection?.saveData && !/(^|-)2g$/.test(connection?.effectiveType || '');
  const mediaKey=`${stickersEnabled}:${gifsEnabled}`;
  if(viz.ctx.lyrics?.lines) {
    if(!viz.reactionPlan || viz.reactionDensity!==density || (viz.reactionMedia && viz.reactionMedia!==mediaKey)) {
      viz.reactionPlan=buildReactionPlan(viz.ctx.lyrics,viz.ctx.song.title,density,{stickers:stickersEnabled,gifs:gifsEnabled});
      viz.reactionDensity=density;viz.reactionMedia=mediaKey;
    }
  }
  const reaction=viz.reactionPlan?.[index] ?? (viz.ctx.lyrics?.lines ? null : lyricReaction(text,index,viz.ctx.song.title));
  if(!reaction) return;
  // Keep the sticker/emote inside its lyric bubble, above the message time.
  const insertMedia=el=>{const time=bubble.querySelector(':scope > time');if(time)time.before(el);else bubble.append(el);};
  if(options.emojis?.()!==false && reaction.emoji) {
    const emoji=document.createElement('span'); emoji.className='chat-emoji';
    emoji.textContent=reaction.emoji; emoji.setAttribute('aria-label','Decorative reaction');
    bubble.querySelector('p').append(' ',emoji);
  }
  if(stickersEnabled && reaction.sticker) {
    const sticker=document.createElement('div');sticker.className='chat-sticker';
    sticker.dataset.mood=reaction.sticker.mood;sticker.setAttribute('aria-label','Decorative reaction sticker');
    const icon=document.createElement('span');icon.textContent=reaction.sticker.emoji;
    const caption=document.createElement('strong');caption.textContent=reaction.sticker.caption;
    sticker.append(icon,caption);insertMedia(sticker);
    attachAutomaticSticker(viz,sticker,reaction.sticker,options,index,hash(viz.ctx.song.title || ''),reduced);
  }
  if(!gifsEnabled || !reaction.gif) return;
  const slot=document.createElement('div'); slot.className='chat-gif'; slot.hidden=true; insertMedia(slot);
  if(['auto','stickerapi'].includes(options.stickerSource?.() || '')){
    const controller=new AbortController(),job={element:slot,controller};
    viz.stickerJobs ||= new Set();viz.stickerJobs.add(job);
    moodMedia('emote',reaction.mood,hash(`${viz.ctx.song.title}:${index}`),reduced).then(async item=>{
      if(!item||controller.signal.aborted||!slot.isConnected)return false;
      if(await renderMediaImage(slot,item,controller.signal)){
        if(!controller.signal.aborted&&slot.isConnected){slot.hidden=false;return true;}
      }
      return false;
    }).then(loaded=>{if(!loaded&&!controller.signal.aborted&&slot.isConnected)attachLegacyGif();})
      .catch(()=>{if(!controller.signal.aborted&&slot.isConnected)attachLegacyGif();})
      .finally(()=>viz.stickerJobs?.delete(job));
    return;
  }
  attachLegacyGif();
  function attachLegacyGif(){
    // Initial bubble construction happens before insertion into the chat DOM.
    // Async fallback callers already verify isConnected; do not skip explicit
    // Discord/Sticker.ly/local modes here or their legacy GIFs disappear.
    viz.reactionAbort ||= new AbortController();
    // Fixed reaction category only: no title, artist, lyric text or API key leaves the app.
    // Deduplicate concurrent requests when TTML reconstructs bubbles during seeks.
    viz.reactionRequests ||= new Map();
    const key=`${reaction.gif}:${index%3}`;
    if(!viz.reactionRequests.has(key)) viz.reactionRequests.set(key,reactionGif(reaction.gif,viz.reactionAbort.signal,fetch,index));
    viz.reactionRequests.get(key).then(item=>{
      if(!item || viz.reactionAbort.signal.aborted || !bubble.isConnected) return;
      const img=document.createElement('img'); img.alt=item.alt; img.referrerPolicy='no-referrer';
      img.onload=()=>{ if(!viz.reactionAbort.signal.aborted) slot.hidden=false; };
      img.onerror=()=>slot.remove(); img.src=item.url;slot.append(img);
    }).catch(()=>slot.remove());
  }
}
