// Small, explainable on-device sentiment engine. No remote lyric analysis.
import { REACTION_DICTIONARY as MOODS } from './reaction-dictionary.js';
export function reactionHash(text) { let n=2166136261; for(const c of text) n=Math.imul(n^c.codePointAt(0),16777619); return n>>>0; }
const normalized=s=>String(s||'').normalize('NFKC').toLocaleLowerCase().replace(/[’‘]/g,"'");
const matchers=new Map();
const SORTED_MOODS=MOODS.map(row=>[...row.slice(0,4),[...new Set(row[4].map(normalized))].sort((a,b)=>b.length-a.length)]);
function hits(text,phrase) {
 if(!text.includes(phrase)) return [];
 let re=matchers.get(phrase);
 if(!re) { re=new RegExp(`(?<![\\p{L}\\p{N}])${phrase.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?![\\p{L}\\p{N}])`,'gu');matchers.set(phrase,re); }
 re.lastIndex=0;
 return [...text.matchAll(re)];
}
export function analyzeLyric(text, previous='') {
 const line=normalized(text), context=normalized(previous), scored=[];
 for(const [mood,emojis,gif,caption,phrases] of SORTED_MOODS) {
  let score=0, evidence=[], occupied=[];
  // Match longer phrases first; one phrase must not also score all its component words.
  for(const phrase of phrases) for(const match of hits(line,phrase)) {
   const end=match.index+match[0].length;
   if(occupied.some(([a,b])=>match.index<b && end>a))continue;
   const before=line.slice(Math.max(0,match.index-45),match.index).split(/\b(?:but|yet|however|lekin|magar)\b|[.!?;,]/u).at(-1);
   if(/(?:\b(?:no|not|never|without|don't|dont|can't|cant|nahi|nahin|na)\b|नहीं)\s+(?:\w+\s+){0,2}$/u.test(before)) continue;
   score+=phrase.includes(' ')?3:1.5; evidence.push(phrase);occupied.push([match.index,end]);
  }
  if(score && phrases.some(p=>hits(context,p).length)) score+=.45;
  if(score) scored.push({mood,emojis:emojis.split(' '),gif,caption:caption.split('|')[0],captions:caption.split('|'),score,evidence});
 }
 // Explicit rejection of love must not become a celebratory heart.
 if(/\b(?:don't|dont|never|no longer|not)\s+(?:\w+\s+){0,2}love\b/u.test(line)) scored.push({mood:'heartbreak',emojis:['💔','🥀'],gif:'cry',caption:'HEART = BROKEN',score:4,evidence:['rejected love']});
 scored.sort((a,b)=>b.score-a.score);
 return scored.length?{...scored[0],confidence:Math.min(.98,.5+scored[0].score*.1),mixed:scored.length>1 && scored[1].score>=scored[0].score*.8}:null;
}
export function buildReactionPlan(lyrics,seed='',density='balanced',media={}) {
 const limits={subtle:{emoji:4,media:12,seconds:35},balanced:{emoji:2,media:8,seconds:24},expressive:{emoji:1,media:5,seconds:16}};
 const cfg=limits[density]||limits.balanced;
 const allowSticker=media?.stickers!==false,allowGif=media?.gifs!==false;
 let lastEmoji=-99,lastMedia=-99,lastTime=-999,lastMood='',lastGlyph='',placedMedia=false;
 return lyrics.lines.map((line,i)=>{
  const previous=lyrics.lines[i-1];
  const info=analyzeLyric(line.text, previous && previous.speaker===line.speaker?previous.text:'');
  if(!info || !line.text) return null;
  const n=reactionHash(`${seed}:${i}:${line.text}`);
  let emoji=null;
  if(i-lastEmoji>=cfg.emoji && (n%5!==0 || info.score>=3)) {
   const choices=info.emojis.filter(e=>e!==lastGlyph);emoji=(choices.length?choices:info.emojis)[n%(choices.length||info.emojis.length)];lastGlyph=emoji;lastEmoji=i;
  }
  let gif=null,sticker=null;
  if(i-lastMedia>=cfg.media && line.t-lastTime>=cfg.seconds && (!placedMedia || n%3!==0) && !(info.mixed && info.score<3)) {
   // Short songs may have only one slot: prioritize the enabled sticker source
   // there. Respect a GIF-only preference; later slots keep the sparse mix.
   if(info.mood!==lastMood || i-lastMedia>=cfg.media*2) {
    if(allowGif && info.gif && (!allowSticker || (placedMedia && n%2===0))) gif=info.gif;
    else if(allowSticker) sticker={emoji:info.emojis[n%info.emojis.length],caption:(info.captions || [info.caption])[(n>>>8)%(info.captions?.length || 1)],mood:info.mood};
    if(gif||sticker){placedMedia=true;lastMedia=i;lastTime=line.t;lastMood=info.mood;}
   }
  }
  return {...info,emoji,gif,sticker};
 });
}
