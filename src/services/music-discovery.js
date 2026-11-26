// Public catalogue discovery. Music chart entries are metadata, never playback URLs.
export function safeMediaURL(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}}
export function normalizeDiscovery(items,kind,chart=false){
 const seen=new Set();return (Array.isArray(items)?items:[]).flatMap(t=>{
  const title=String((chart?t.name:t.trackName)||'').slice(0,240),artist=String((chart?t.artistName:(kind==='podcasts'?t.collectionName:t.artistName))||'').slice(0,240);
  const key=String(t.id||t.trackId||title+'|'+artist);if(!title||seen.has(key))return [];seen.add(key);
  return [{id:key,title,artist,artwork:safeMediaURL(t.artworkUrl600||t.artworkUrl100||t.artworkUrl60),album:String(t.collectionName||''),episodeUrl:kind==='podcasts'&&!chart?safeMediaURL(t.episodeUrl):'',show:kind==='podcasts'&&chart,durationMs:Number(t.trackTimeMillis)||0,date:String(t.releaseDate||'').slice(0,10),label:kind==='podcasts'?(chart?'Podcast · explore episodes':'Full episode'):'Find full-track source'}];
 }).slice(0,30);
}
export async function fetchDiscovery({kind='music',market='in',query='',signal,fetcher=fetch}={}){
 kind=kind==='podcasts'?'podcasts':'music';market=/^(in|us|gb|au|ca)$/.test(market)?market:'in';
 const request=async url=>{const r=await fetcher(url,{signal});if(!r.ok)throw Error('Directory HTTP '+r.status);return r.json();};
 if(!query){try{
  const d=await request(`https://rss.marketingtools.apple.com/api/v2/${market}/${kind}/${kind==='music'?'most-played':'top'}/30/${kind==='music'?'songs':'podcasts'}.json`);
  const items=normalizeDiscovery(d.feed?.results,kind,true);if(items.length)return {items,source:'Apple '+(kind==='music'?'Music most-played':'Podcasts top shows'),chart:true};
 }catch(e){if(signal?.aborted)throw e;}}
 const term=query||(kind==='music'?'Bollywood':'technology');
 const d=await request(`https://itunes.apple.com/search?country=${market}&media=${kind==='music'?'music':'podcast'}&entity=${kind==='music'?'song':'podcastEpisode'}&limit=30&term=${encodeURIComponent(term)}`);
 return {items:normalizeDiscovery(d.results,kind),source:`Apple catalogue · ${term}`,chart:false};
}
