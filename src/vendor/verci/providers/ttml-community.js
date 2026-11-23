// Public, keyless community catalogue. Read through GitHub's CORS-enabled API.
// Better Lyrics' authenticated service is deliberately not impersonated or bypassed.
import { parseTTML } from '../ttml.js';
import { versionsOf } from '../track.js';
import { cleanText } from '../match.js';
const ROOT='https://api.github.com/repos/amll-dev/amll-ttml-db';
let catalogue=null;
async function file(path) {
  const get=async url => {
    const r=await fetch(url,{signal:AbortSignal.timeout(9000),headers:{Accept:'application/vnd.github+json'}});
    if(!r.ok) throw Error(`Community TTML: HTTP ${r.status}`);
    return r.json();
  };
  let data=await get(`${ROOT}/contents/${path}`);
  if(!data.content && data.git_url) data=await get(data.git_url);
  if(!data.content) throw Error('Community TTML content unavailable.');
  return new TextDecoder().decode(Uint8Array.from(atob(data.content.replace(/\s/g,'')),c=>c.charCodeAt(0)));
}
const norm=s=>cleanText(String(s||'')).normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,'');
export function communityMatch(entries,song) {
  const title=norm(song.title),artist=norm(song.artist);
  const credits=String(song.artist || '').split(/[,;&]|\s+(?:feat\.?|ft\.?|with|and|x)\s+/i).map(norm).filter(Boolean);
  if(!title || !artist) return null;
  return entries.filter(e=> {
    const m=Object.fromEntries(e.metadata || []);
    return (m.musicName || []).some(n=>norm(n)===title && versionsOf(n).join()===versionsOf(song.title).join()) && (m.artists || []).some(a=>norm(a) && (artist===norm(a) || credits.includes(norm(a))));
  }).at(-1) || null;
}
export async function findCommunityTTML(song) {
  if(!catalogue) catalogue=file('metadata/raw-lyrics-index.jsonl').then(s=>s.split('\n').filter(Boolean).map(l=>JSON.parse(l))).catch(e=>{catalogue=null;throw e;});
  const match=communityMatch(await catalogue,song);
  if(!match || !/^[\w.-]+\.ttml$/.test(match.rawLyricFile)) return null;
  const lyrics=parseTTML(await file(`raw-lyrics/${match.rawLyricFile}`));
  if(!lyrics.lines.length) return null;
  const last=lyrics.lines.at(-1).end, duration=song.durationMs/1000;
  if(duration && last>duration+8) return null;
  lyrics.source='AMLL community TTML';
  lyrics.sourceUrl=`https://github.com/amll-dev/amll-ttml-db/blob/main/raw-lyrics/${match.rawLyricFile}`;
  return lyrics;
}
