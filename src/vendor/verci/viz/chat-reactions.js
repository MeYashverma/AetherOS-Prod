// Decorative reactions, not lyric replacements or singer metadata.
import { attachAutomaticSticker } from '../providers/automatic-stickers.js';
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
  if(viz.ctx.lyrics?.lines) {
    if(!viz.reactionPlan || viz.reactionDensity!==density) {
      viz.reactionPlan=buildReactionPlan(viz.ctx.lyrics,viz.ctx.song.title,density);viz.reactionDensity=density;
    }
  }
  const reaction=viz.reactionPlan?.[index] ?? (viz.ctx.lyrics?.lines ? null : lyricReaction(text,index,viz.ctx.song.title));
  if(!reaction) return;
  const reduced=typeof matchMedia==='function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(options.emojis?.()!==false && reaction.emoji) {
    const emoji=document.createElement('span'); emoji.className='chat-emoji';
    emoji.textContent=reaction.emoji; emoji.setAttribute('aria-label','Decorative reaction');
    bubble.querySelector('p').append(' ',emoji);
  }
  if(options.stickers?.()!==false && reaction.sticker) {
    const sticker=document.createElement('div');sticker.className='chat-sticker';
    sticker.dataset.mood=reaction.sticker.mood;sticker.setAttribute('aria-label','Decorative reaction sticker');
    const icon=document.createElement('span');icon.textContent=reaction.sticker.emoji;
    const caption=document.createElement('strong');caption.textContent=reaction.sticker.caption;
    sticker.append(icon,caption);bubble.append(sticker);
    attachAutomaticSticker(viz,sticker,reaction.sticker,options,index,hash(viz.ctx.song.title || ''),reduced);
  }
  const connection=globalThis.navigator?.connection;
  if(options.gifs?.()===false || reduced || connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '') || !reaction.gif) return;
  const slot=document.createElement('div'); slot.className='chat-gif'; slot.hidden=true; bubble.append(slot);
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
