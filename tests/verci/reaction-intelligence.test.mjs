import assert from 'node:assert/strict';
import { analyzeLyric, buildReactionPlan } from '../../src/vendor/verci/viz/reaction-intelligence.js';
import { reactionGif } from '../../src/vendor/verci/viz/chat-reactions.js';
assert.equal(analyzeLyric('I do not love you anymore').mood,'heartbreak');
assert.equal(analyzeLyric("I don't love you").mood,'heartbreak');
assert.equal(analyzeLyric('I am not sad'),null);
assert.equal(analyzeLyric('not sad but happy').mood,'joy');
assert.equal(analyzeLyric('a lovely computer'),null,'no substring matches');
assert.equal(analyzeLyric('unknown words beyond the lexicon'),null);
assert.equal(analyzeLyric('miss you').mood,'longing');
assert.equal(analyzeLyric('dil mein ishq aur pyar').mood,'love');
assert.equal(analyzeLyric('दिल में प्यार').mood,'love');
assert.equal(analyzeLyric('I am crying with tears').mood,'sad');
assert.equal(analyzeLyric('I love you but I am lonely').mixed,true);
assert.ok(analyzeLyric('I love you','my heart loves you').confidence > analyzeLyric('I love you').confidence);
const short={lines:Array.from({length:3},(_,i)=>({t:i*3,text:'I love you',speaker:0}))};
for(const title of ['Love Song','Song','My Song','Taylor']) for(const density of ['subtle','balanced','expressive']) {
 const plan=buildReactionPlan(short,title,density);
 assert.equal(plan[0]?.sticker?.mood,'love',`${title}/${density} must offer an API-eligible sticker, not spend the only slot on a GIF`);
 assert.equal(plan.filter(r=>r?.gif || r?.sticker).length,1,'the short-song guarantee still respects media density');
}
assert.ok(buildReactionPlan({lines:[{t:0,text:'Ordinary unrelated sentence'}]},'Song')[0]===null,'no unrelated mood is invented');
const gifOnly=buildReactionPlan(short,'Love Song','balanced',{stickers:false,gifs:true});
assert.equal(gifOnly[0]?.gif,'hug','disabling stickers keeps the first eligible GIF slot');
assert.ok(gifOnly.every(r=>!r?.sticker));
assert.ok(buildReactionPlan(short,'Love Song','balanced',{stickers:false,gifs:false}).every(r=>!r?.sticker&&!r?.gif));
const lyrics={lines:Array.from({length:100},(_,i)=>({t:i*5,text:['I love my heart baby','happy smile','crying alone','dance party','boss winning'][i%5],speaker:i%2}))};
for(const density of ['subtle','balanced','expressive']) {
 const plan=buildReactionPlan(lyrics,'Song',density);
 assert.deepEqual(plan,buildReactionPlan(lyrics,'Song',density));
 const min={subtle:12,balanced:8,expressive:5}[density];
 const seconds={subtle:35,balanced:24,expressive:16}[density];
 let previous=-100,time=-100;
 plan.forEach((r,i)=>{if(r?.gif || r?.sticker){assert.ok(i-previous>=min);assert.ok(lyrics.lines[i].t-time>=seconds);previous=i;time=lyrics.lines[i].t;assert.ok(!(r.gif && r.sticker));}});
}
const count=d=>buildReactionPlan(lyrics,'Song',d).filter(r=>r?.emoji).length;
assert.ok(count('expressive')>count('balanced'));assert.ok(count('balanced')>count('subtle'));
assert.ok(buildReactionPlan(lyrics,'Song','expressive').some(r=>r?.sticker),'sticker planning is active');
assert.ok(buildReactionPlan(lyrics,'Song','balanced').slice(1).some(r=>r?.gif),'longer songs still get occasional GIFs');
const calls=[];
const fallback=await reactionGif('dance',new AbortController().signal,async url=>{
 calls.push(url);
 if(url.includes('nekos.best'))return {ok:false};
 return {ok:true,json:async()=>({url:'https://i.waifu.pics/test.gif'})};
},2);
assert.equal(fallback.provider,'waifu.pics');assert.equal(calls.length,2);
assert.ok(calls.every(u=>!u.includes('Song')&&!u.includes('love')));
console.log('Context/negation, Unicode, spacing, density, stickers and GIF fallback verified.');

const { REACTION_DICTIONARY, REACTION_DICTIONARY_STATS: stats } = await import('../../src/vendor/verci/viz/reaction-dictionary.js');
assert.ok(stats.moods>=40 && stats.phrases>=800 && stats.stickerCaptions>=150 && stats.emoji>=90);
assert.equal(new Set(REACTION_DICTIONARY.map(r=>r[0])).size,REACTION_DICTIONARY.length);
for(const [mood,emoji,gif,captions,phrases] of REACTION_DICTIONARY) {
 assert.ok(emoji && phrases.length && captions, mood+' is complete');
 assert.equal(new Set(phrases).size,phrases.length,mood+' has no duplicate phrases');
 assert.ok(!gif || ['hug','cry','dance','smile','angry','sleep'].includes(gif));
 assert.ok(captions.split('|').every(c=>c.length<=40),'readable sticker captions');
}
for(const [text,mood] of [
 ['caught in 4k','awkward'],['left on read','ghosting'],['dead inside','sad'],
 ['I am dead','humor'],['rizz detected','flirt'],['no cap','confidence'],
 ['dil toot gaya','heartbreak'],['hanju','sad'],['yaari','friendship'],
 ['ate and left no crumbs','confidence'],['दर्द','sad'],['ठुमका','dance'],
 ['मैं सुकून चाहता हूँ','peace'],['ਸੋਹਣਾ','none'],['social battery','tired'],
 ['math ain’t mathing','suspicion'],['मेरी गलती','apology'],['take me back','nostalgia']
]) assert.equal(analyzeLyric(text)?.mood || 'none',mood,text);
assert.equal(analyzeLyric('scattered bands of clouds'),null,'ambiguous dictionary changes require explicit evidence');
