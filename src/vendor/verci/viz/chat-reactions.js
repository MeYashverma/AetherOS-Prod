// Decorative reactions, not lyric replacements or singer metadata.
const RULES = [
  { re: /\b(?:heartbreak|broken|goodbye|alvida|bewafa|dhokha|judai)\b/iu, emoji: ['💔','🥀'], gif:'cry' },
  { re: /\b(?:cry|crying|tears|sad|lonely|alone|aansu|tanha|udaas|rona|roye)\b|आँसू|उदास|तन्हा/iu, emoji:['🥺','😢'], gif:'cry' },
  { re: /\b(?:love|heart|kiss|baby|darling|pyaar|pyar|ishq|mohabbat|dil|jaan|sajna|sohneya)\b|प्यार|दिल|इश्क/iu, emoji:['❤️','🥰','🫶'], gif:'hug' },
  { re: /\b(?:dance|dancing|party|nach|nachdi|bhangra|jashn)\b|नाच/iu, emoji:['💃','🕺','✨'], gif:'dance' },
  { re: /\b(?:smile|laugh|laughing|happy|happiness|hassi|hasi|khushi|muskur)\b|खुशी|हँस/iu, emoji:['😊','😂','✨'], gif:'smile' },
  { re: /\b(?:angry|anger|hate|gussa|nafrat)\b|गुस्सा|नफ़रत/iu, emoji:['😤','🔥'], gif:'angry' },
  { re: /\b(?:sleep|sleeping|dream|dreams|neend|sapne|khwab)\b|नींद|सपने/iu, emoji:['😴','💭','🌙'], gif:'sleep' },
  { re: /\b(?:rain|raining|baarish|barish|barsaat)\b|बारिश/iu, emoji:['🌧️','☔'], gif:null },
  { re: /\b(?:moon|stars|night|chaand|chand|taare|raat)\b|चाँद|रात/iu, emoji:['🌙','✨'], gif:null },
  { re: /\b(?:fire|burn|burning|aag)\b|आग/iu, emoji:['🔥'], gif:null }
];
function hash(text) { let n=2166136261; for(const c of text) n=Math.imul(n^c.codePointAt(0),16777619); return n>>>0; }
export function lyricReaction(text, index, seed='') {
  const rule=RULES.find(r=>r.re.test(text));
  if(!rule) return null;
  const n=hash(`${seed}:${index}:${text}`);
  return { emoji: n%3 !== 0 ? rule.emoji[n%rule.emoji.length] : null,
    // One eligible slot per eight lines; deterministic randomness keeps seeking stable.
    gif: index%8===3 && n%3!==0 ? rule.gif : null };
}
const cache=new Map();
export async function reactionGif(category, signal, fetchImpl=fetch) {
  if(!['hug','cry','dance','smile','angry','sleep'].includes(category)) return null;
  if(cache.has(category)) return cache.get(category);
  const response=await fetchImpl(`https://nekos.best/api/v2/${category}`, {signal:AbortSignal.any([signal,AbortSignal.timeout(7000)]),referrerPolicy:'no-referrer'});
  if(!response.ok) throw Error('Reaction service unavailable');
  const item=(await response.json()).results?.[0];
  let url; try { url=new URL(item?.url); } catch { return null; }
  if(url.protocol!=='https:' || url.hostname!=='nekos.best' || !url.pathname.endsWith('.gif')) return null;
  const result={url:url.href,alt:`${category} reaction (anime GIF)`,provider:'nekos.best'};
  cache.set(category,result); return result;
}
export function addChatReaction(viz, bubble, text, index) {
  const options=viz.ctx.opts || {};
  const reaction=lyricReaction(text,index,viz.ctx.song.title);
  if(!reaction) return;
  const reduced=typeof matchMedia==='function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(options.emojis?.()!==false && reaction.emoji) {
    const emoji=document.createElement('span'); emoji.className='chat-emoji';
    emoji.textContent=reaction.emoji; emoji.setAttribute('aria-label','Decorative reaction');
    bubble.querySelector('p').append(' ',emoji);
  }
  if(options.gifs?.()===false || reduced || !reaction.gif) return;
  const slot=document.createElement('div'); slot.className='chat-gif'; slot.hidden=true; bubble.append(slot);
  viz.reactionAbort ||= new AbortController();
  // Fixed reaction category only: no title, artist, lyric text or API key leaves the app.
  reactionGif(reaction.gif,viz.reactionAbort.signal).then(item=>{
    if(!item || viz.reactionAbort.signal.aborted || !bubble.isConnected) return;
    const img=document.createElement('img'); img.alt=item.alt; img.referrerPolicy='no-referrer';
    img.onload=()=>{ if(!viz.reactionAbort.signal.aborted) { slot.hidden=false; const credit=document.createElement('small'); credit.textContent='GIF · '+item.provider;slot.append(credit); } };
    img.onerror=()=>slot.remove(); img.src=item.url;slot.append(img);
  }).catch(()=>slot.remove());
}
