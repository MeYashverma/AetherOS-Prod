// Official public Discord pack catalogue. No bot/user token or private guild access.
export const DISCORD_STICKER_API='https://discord.com/api/v10/sticker-packs';
const TERMS={
 love:['love','heart','hug','kiss','affection'],heartbreak:['heartbreak','broken heart'],sad:['sad','cry','crying','tears'],
 dance:['dance','dancing','party'],joy:['happy','smile','joy','grin'],anger:['angry','rage','mad','frustrated'],
 dream:['sleep','sleepy','dream'],rain:['rain','rainy'],night:['night','moon','stars'],fire:['fire','flame'],
 confidence:['cool','confident','proud','sunglasses'],money:['rich','money','cash'],surprise:['surprised','shock','shocked','wow','omg'],
 longing:['miss you','lonely','waiting'],humor:['laugh','laughing','lol','lmao'],flirt:['wink','winking','flirt'],crush:['blush','blushing','love'],
 devotion:['hug','love'],ghosting:['waiting','ghost'],breakup:['heartbreak','goodbye'],healing:['hug','comfort'],nostalgia:['thinking','remember'],
 friendship:['friends','friendship','high five'],betrayal:['betrayal','liar'],jealousy:['jealous','eye roll'],anxiety:['nervous','anxiety','anxious','sweat'],
 tired:['tired','sleepy','yawn'],peace:['relax','relaxed','chill'],hope:['hope','wish'],determination:['determined','strong','flex','muscle'],
 freedom:['free','fly'],travel:['travel','vacation'],speed:['run','running','fast'],fashion:['cool','sunglasses','fancy'],music:['music','sing','singing'],
 celebration:['celebrate','celebration','party','excited'],apology:['sorry','apologize'],gratitude:['thanks','thank you','grateful'],chaos:['chaos','crazy'],
 awkward:['awkward','oops','embarrassed'],suspicion:['suspicious','eyebrow','hmm'],rejection:['no','nope','stop'],romance:['kiss','love'],
 loyalty:['friends','trust'],defiance:['angry','fight'],awe:['amazed','amazing','wow']
};
let cached=null,expires=0,pending=null,coolUntil=0;
export function normalizeDiscordPacks(data){
 if(!Array.isArray(data?.sticker_packs))throw Error('Discord returned an invalid sticker catalogue.');
 return data.sticker_packs.slice(0,300).flatMap(pack=>(Array.isArray(pack.stickers)?pack.stickers:[]).slice(0,200).filter(s=>/^\d{15,22}$/.test(s.id)&&[1,2,3,4].includes(s.format_type)&&s.available!==false).map(s=>({
  id:s.id,name:String(s.name||'Sticker').slice(0,100),pack:String(pack.name||'Discord').slice(0,100),tags:String(s.tags||'').slice(0,2000),format:s.format_type,
  url:`https://cdn.discordapp.com/stickers/${s.id}.${s.format_type===3?'json':s.format_type===4?'gif':'png'}`,
  animated:s.format_type!==1
 })));
}
export async function discordCatalogue(fetchImpl=fetch){
 if(cached&&Date.now()<expires)return cached;
 if(pending)return pending;
 if(Date.now()<coolUntil)throw Error('Discord stickers are cooling down after a failed request. Try again in a minute.');
 pending=(async()=>{
  const response=await fetchImpl(DISCORD_STICKER_API,{signal:AbortSignal.timeout(10000),credentials:'omit',referrerPolicy:'no-referrer'});
  if(!response.ok)throw Error(`Discord sticker API HTTP ${response.status}`);
  const list=normalizeDiscordPacks(await response.json());if(!list.length)throw Error('Discord returned no supported stickers.');
  cached=list;expires=Date.now()+3600000;return list;
 })().catch(e=>{coolUntil=Date.now()+60000;throw e;}).finally(()=>{pending=null;});
 return pending;
}
export function pickDiscordSticker(list,mood,seed=0,staticOnly=false){
 const terms=TERMS[mood];if(!terms)return null;
 const matches=list.filter(s=>!staticOnly||!s.animated).map(s=>{
  const hay=`${s.name},${s.tags}`.toLowerCase();
  if(mood==='money' && /broke|poor|no money|empty wallet/.test(hay))return {...s,score:0};
  const score=terms.reduce((n,t)=>n+(new RegExp(`(^|[^a-z])${t}([^a-z]|$)`,'i').test(hay)?(s.name.toLowerCase()===t?4:1):0),0);
  return {...s,score};
 }).filter(s=>s.score>0).sort((a,b)=>b.score-a.score);
 const pool=matches.filter(s=>s.score>=Math.max(1,(matches[0]?.score||0)-1)).slice(0,12);
 return pool.length?pool[(seed>>>0)%pool.length]:null;
}
let playerLoad;
function lottiePlayer(){
 if(window.lottie)return Promise.resolve(window.lottie);
 if(playerLoad)return playerLoad;
 playerLoad=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=new URL('../../lottie/lottie_light.min.js',import.meta.url).href;
  const timer=setTimeout(()=>{playerLoad=null;reject(Error('Sticker renderer timed out.'));},10000);
  script.onload=()=>{clearTimeout(timer);if(window.lottie)resolve(window.lottie);else {playerLoad=null;reject(Error('Sticker renderer unavailable.'));}};
  script.onerror=()=>{clearTimeout(timer);playerLoad=null;script.remove();reject(Error('Sticker renderer unavailable.'));};document.head.append(script);
 });return playerLoad;
}
export async function renderDiscordSticker(container,item,signal,staticOnly=false){
 if(signal?.aborted)return false;
 if(item.format!==3){
  return new Promise(resolve=>{
   const img=document.createElement('img');img.className='chat-discord-image';img.alt=`${item.name} (${item.pack}, Discord)`;img.referrerPolicy='no-referrer';
   let done=false;
   const finish=ok=>{if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);if(!ok)img.remove();resolve(ok);};
   const abort=()=>{img.removeAttribute('src');finish(false);};const timer=setTimeout(abort,10000);
   signal?.addEventListener('abort',abort,{once:true});img.onload=()=>finish(true);img.onerror=()=>finish(false);img.src=item.url;container.append(img);
  });
 }
 try{
  const [player,res]=await Promise.all([lottiePlayer(),fetch(item.url,{signal:AbortSignal.any([...(signal?[signal]:[]),AbortSignal.timeout(9000)]),credentials:'omit',referrerPolicy:'no-referrer'})]);
  if(!res.ok)throw Error('Sticker media unavailable');
  const raw=await res.text();if(raw.length>1500000)throw Error('Sticker animation too large');
  const data=JSON.parse(raw);
  if(!Array.isArray(data.layers)||data.layers.length>1000||(data.assets||[]).length>500||!Number.isFinite(data.op)||!Number.isFinite(data.fr)||data.fr<=0||data.fr>120||data.op/data.fr>60)throw Error('Unsupported animation');
  // Light renderer omits expressions. Reject external image/font assets entirely.
  if((data.assets||[]).some(a=>a.p||a.u)||(data.fonts?.list||[]).some(f=>f.fPath))throw Error('External sticker assets are not supported');
  if(signal?.aborted)return false;
  const stage=document.createElement('div');stage.className='chat-discord-lottie';stage.setAttribute('role','img');stage.setAttribute('aria-label',`${item.name} (${item.pack}, Discord)`);container.append(stage);
  return await new Promise(resolve=>{
   let done=false;
   const animation=player.loadAnimation({container:stage,renderer:'svg',loop:!staticOnly,autoplay:false,animationData:data,rendererSettings:{progressiveLoad:true}});
   const clean=()=>{animation.destroy();stage.remove();};
   const abort=()=>{clean();finish(false);};
   const finish=ok=>{if(done)return;done=true;clearTimeout(timer);if(!ok){signal?.removeEventListener('abort',abort);clean();}resolve(ok);};
   const timer=setTimeout(()=>finish(false),10000);
   signal?.addEventListener('abort',abort,{once:true});
   animation.addEventListener('DOMLoaded',()=>{if(signal?.aborted){abort();return;}if(staticOnly)animation.goToAndStop(0,true);else animation.play();finish(true);});
   animation.addEventListener('data_failed',()=>finish(false));
  });
 }catch{return false;}
}
