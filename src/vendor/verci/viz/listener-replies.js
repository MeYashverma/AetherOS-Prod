import { analyzeLyric, reactionHash } from './reaction-intelligence.js';
const REPLIES={
 love:['That sounds like someone who means a lot to you.','Some feelings really stay with you.'],
 heartbreak:['That sounds painful. Take your time.','Letting go can be the hardest part.'],
 sad:['You don’t have to carry every feeling alone.','It’s okay to sit with that for a moment.'],
 longing:['Missing someone can make time feel so slow.','Sounds like they’re still on your mind.'],
 anger:['I hear the frustration in that.','Sometimes you need a moment to cool down.'],
 confidence:['Okay, that’s the energy.','Sounds like you’re finding your footing.'],
 dance:['This needs to go on the playlist.','Okay, turning this one up.'],
 joy:['That’s a feeling worth holding onto.','Love this energy.'],
 nostalgia:['Some memories never really leave.','That sounds like a whole chapter of your life.'],
 anxiety:['One breath at a time.','You don’t have to figure it all out right now.'],
 ghosting:['Waiting for a reply is its own kind of loud.','The silence can say a lot.'],
 healing:['Small steps still count.','Give yourself a little room to heal.'],
 regret:['You can’t undo it, but you can learn from it.','Sounds like you’ve been replaying that moment.'],
 apology:['Owning your part isn’t easy.','Sometimes being honest is the first step.'],
 determination:['Keep that energy. One step at a time.','Sounds like you’re not giving up.'],
 tired:['Maybe it’s time to give yourself a break.','You don’t have to run on empty.'],
 dream:['Hold onto that thought.','Sounds like there’s something worth chasing.'],
 flirt:['Okay, smooth.','Someone’s got your attention.'],
 crush:['Sounds like butterflies to me.','That feeling is hard to hide.']
};
export function listenerReplyFor(lyrics,plan,index,seed='') {
 if(index<2)return null;
 const who=plan.T[index]?.who;if(who===undefined)return null;
 // Reply after three consecutive lines from one voice, then leave breathing room.
 let streak=0;
 for(let i=index;i>=0&&plan.T[i]?.who===who;i--)streak++;
 if(streak<3||streak%4!==3)return null;
 const line=lyrics.lines[index],prev=lyrics.lines[index-1];
 if(!line?.text||!prev||line.t-prev.t>20)return null;
 const context=[line.text,prev.text,lyrics.lines[index-2]?.text||''].join(' ');
 const special=/\b(?:blame|my fault|crossed a line|hurt (?:you|my ?self))\b/i.test(context)
   ? ['Sounds like you’re being hard on yourself.','Owning your part matters. So does giving yourself room to grow.']
   : /\b(?:lose my mind|losing my mind|runnin.? out of time|running out of time)\b/i.test(context)
   ? ['That sounds overwhelming. One breath at a time.'] : null;
 if(special)return special[reactionHash(`${seed}:${index}:listener`)%special.length];
 const info=analyzeLyric(line.text)||analyzeLyric(prev.text)||analyzeLyric(lyrics.lines[index-2]?.text||'');
 const pool=REPLIES[info?.mood];if(!pool)return null;
 return pool[reactionHash(`${seed}:${index}:listener`)%pool.length];
}
