// Credit order is a useful display hint, not proof of vocal attribution.
const generic = name => /^(?:voice|singer|v)\s*\d+$/i.test(name || '');
const split = value => String(value || '').split(/\s*(?:,|;|&|\+|\bfeat\.?\s+|\bft\.?\s+|\bfeaturing\s+|\bwith\s+|\band\s+|\s+x\s+)\s*/i).map(s=>s.replace(/^[\s([\]-]+|[\s)\]]+$/g,'').trim()).filter(s=>s && s.length<=100 && !/^(unknown|various artists|.* - topic)$/i.test(s));
export function resolveSingerNames(lyrics,song={},saved={}) {
 const original=lyrics.originalSpeakers || lyrics.speakers || [];
 const credits=[...split(song.artist),...split((/\b(?:feat\.?|ft\.?|featuring)\s+([^\])]+)/i.exec(song.title||'')||[])[1])];
 const unique=[...new Map(credits.map(s=>[s.toLocaleLowerCase(),s])).values()];
 const inferred=[];
 // Only map a complete credit list to simple v1/v2-style references, never joint agents.
 const order=(lyrics.speakerIds||[]).map(id=>/^v([1-9]\d*)$/i.exec(id)?.[1]).map(n=>n?Number(n)-1:-1);
 const usable=unique.length===original.length && order.length===original.length && order.every(i=>i>=0&&i<unique.length)&&new Set(order).size===order.length;
 const names=original.map((name,i)=>{
  const id=lyrics.speakerIds?.[i]||String(i);
  if(saved[id])return saved[id];
  if(!generic(name))return name;
  // Explicit repeated [Singer: ...] lyric tags can establish the agent's name.
  const tags=[...new Set(lyrics.lines.filter(l=>l.speaker===i).map(l=>/^\s*\[([^\]\n:]{1,80}):?\]\s*/.exec(l.text)?.[1]).filter(n=>n&&unique.some(c=>c.toLowerCase()===n.toLowerCase())))];
  if(tags.length===1)return tags[0];
  if(usable){inferred.push(i);return unique[order[i]];}
  return name;
 });
 return {names,inferred};
}
