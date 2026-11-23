// Chat decorations never become lyric tokens or imply that a singer authored a response.
import { reactionHash, analyzeLyric } from './reaction-intelligence.js';
const TEXT_REACTIONS={
 love:['♡','(づ｡◕‿‿◕｡)づ','all the feels 🫶'],sad:[':(','felt that 🥺','(╥﹏╥)'],
 heartbreak:['</3','ouch 💔','(｡•́︿•̀｡)'],humor:['LOL 💀',':D','(≧▽≦)'],
 joy:[':D','ヽ(•‿•)ノ','same energy ✨'],dance:['♪┏(・o･)┛♪','vibing 🎶','on repeat 🔁'],
 confidence:['(⌐■_■)','slay 💅','big mood 😎'],longing:['miss u hours 🥺',':’(','(｡•́‿•̀｡)'],
 surprise:[':O','wait what 👀','(⊙_⊙)'],anger:['>:(','(ง •̀_•́)ง','not today 😤'],
 tired:['(-_-) zZ','battery low 🪫',':/'],peace:['(˘‿˘)','peace mode 🍃','breathe 😮‍💨'],
 flirt:[';)','smooth 😏','(｡•̀ᴗ-)✧'],crush:['>///<','butterflies 🦋','(⁄ ⁄•⁄ω⁄•⁄ ⁄)'],
 dream:['(-_-) zZ','dream mode 💭'],nostalgia:['core memory 🥹','take me back 📼'],
 ghosting:['seen 👀','…','(・_・;)'],healing:['one day at a time 🌱','♡'],
 awkward:[':S','(・・;)','hide me 🫣'],determination:['locked in 💪','(ง •̀_•́)ง']
};
export function textReactionFor(text,index,seed='') {
 const info=analyzeLyric(text);if(!info)return null;
 const choices=TEXT_REACTIONS[info.mood];if(!choices)return null;
 return choices[reactionHash(`${seed}:${index}:text-reaction`)%choices.length];
}
export function addConversation(viz,bubble,line,index) {
 const options=viz.ctx.opts || {};
 if(options.textReactions?.()!==false && index%4===1) {
  const text=textReactionFor(line.text,index,viz.ctx.song.title);if(!text)return;
  const badge=document.createElement('div');badge.className='chat-text-reaction';
  badge.setAttribute('aria-label','Decorative text reaction, not a lyric');
  badge.title='Decorative reaction · not part of the lyrics';badge.textContent=text;
  bubble.append(badge);
 }
}
