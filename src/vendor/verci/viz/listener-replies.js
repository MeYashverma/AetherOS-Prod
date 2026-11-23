import { analyzeLyric, reactionHash } from './reaction-intelligence.js';
const BANKS={
 love:['oh so we’re down BAD bad 😭','not me smiling at my phone','🫠🫶','okay romcom protagonist','the heart has left the group chat','cute. disgustingly cute. continue.','brb kicking my feet','this is aggressively adorable'],
 heartbreak:['the playlist is about to get PERSONAL','💔🫠','who approved this emotional damage','heart.exe has stopped working','not the deluxe heartbreak package 😭','well there goes my waterproof mascara','the plot did NOT need this twist','putting this feeling in rice'],
 longing:['your screen time on their chat must be criminal','the yearning has its own postcode','🫠📱','oh we’re in the staring-at-the-ceiling era','missing them like an unpaid full-time job','not the emotional long-distance plan','your heart said refresh refresh refresh','one more sigh and the window will fog up'],
 anger:['okay caps lock, breathe 😭','😤🍿','the group chat is getting screenshots tonight','someone put this energy in a power bank','not the villain origin story','the attitude has entered before you','your patience really clocked out','okay thunderstorm in human form'],
 confidence:['save some main-character energy for the rest of us','😎💅','the confidence has its own security team','okay walking highlight reel','humble has left the building','your entrance needs a smoke machine','not a crumb of hesitation','the mirror just asked for your autograph'],
 dance:['my knees did not agree to this but okay','🕺🪩','the floor has filed a noise complaint','suddenly i have choreography','volume button fighting for its life','this beat pays rent in my head','terrible dancer. excellent enthusiasm.','the neighbours are learning the chorus too'],
 joy:['that smile needs a brightness warning','🥹✨','okay serotonin delivery service','the vibes have passed inspection','this is going in my tiny happiness folder','not me grinning like i won something'],
 nostalgia:['the memories came in 4K for no reason','🥹📼','who opened the emotional archives','that era needs a reunion episode','my brain really kept the directors cut','the past called. i let it ring. mostly.'],
 ghosting:['last seen: in a different dimension','👻📱','their reply is coming by carrier pigeon apparently','the typing dots were a limited edition','not the free trial of communication','even my parcel gives more updates','they put the conversation on airplane mode','your message has become a historical document'],
 flirt:['okay smooth operator 😏','👀🫦','is this flirting or should i update my software','that line came with mood lighting','excuse me this is a public conversation','not you turning the charm up to illegal','i was NOT prepared to blush today','okay who gave you that much rizz'],
 crush:['the butterflies are paying rent now','🦋🫠','you have a crush. your punctuation told me.','not the smiling-at-a-notification disease','the delusion is wearing perfume today','your heart just did a cartwheel','this is a crush with a marketing budget','okay but did they like your story'],
 tired:['battery: 1%. drama: unlimited.','🪫🛌','even your yawn needs a nap','the bed has a very convincing argument','running on vibes and one cold coffee','do not disturb but as a personality'],
 money:['your wallet just stood up and applauded','💸👀','okay finance department','that flex needs its own tax return','my bank app looked away respectfully','rich in confidence. balance pending.'],
 fashion:['the outfit has better plans than i do','💅🪞','okay walking mood board','the mirror asked for an encore','this look has its own fan club','subtlety was not invited'],
 surprise:['sorry my eyebrows just left the room','😳🍿','PARDON the plot twist??','i need subtitles for what just happened','my last two brain cells are buffering','well that was not on my bingo card'],
 humor:['jail. immediately. 😭','💀💀','i laughed and now i owe an apology','my last brain cell enjoyed that','not me snorting at my phone','that was so unserious'],
 dream:['okay imagination with a premium subscription','☁️🚀','your daydream has a bigger budget than my life','manifesting department is OPEN','the plot is ambitious. i respect it.','dream big. nap bigger.'],
 determination:['okay comeback season 👟','locked in like you forgot the password','🫡🔥','the training montage starts NOW','obstacles found unemployed','your to-do list is scared of you'],
 peace:['finally. the drama is on mute.','🍃😌','this is my emotional out-of-office reply','the calm has excellent taste','no thoughts. just premium peace.','the group chat can wait'],
 apology:['okay accountability arc 👀','character development? in THIS economy?','the apology has entered the chat','growth looks suspiciously good on you','the plot finally found some self-awareness','🫣🤝'],
 healing:['the comeback is loading. no rushing it.','🌱🫶','tiny steps still get you out of the scene','new chapter. same excellent soundtrack.','soft launch of a better day','your peace deserves the VIP section']
};
const SAFE=['i’m here 🫶','one moment at a time 🤍','🫂','you don’t have to hold all of that alone'];
const aliases={romance:'love',devotion:'love',friendship:'love',breakup:'heartbreak',rejection:'heartbreak',betrayal:'heartbreak',jealousy:'longing',celebration:'dance',music:'dance',defiance:'confidence',freedom:'confidence',awkward:'humor',chaos:'humor',awe:'surprise',hope:'dream',gratitude:'joy',loyalty:'love',travel:'dream',speed:'determination',fire:'confidence',regret:'apology'};
export function listenerAnalysis(lyrics,index){
 const current=lyrics.lines[index]?.text||'';
 const previous=[lyrics.lines[index-1]?.text||'',lyrics.lines[index-2]?.text||''];
 const context=[current,...previous].join(' ').replace(/[’]/g,"'");
 // Serious distress never gets a roast, including when it occurs in recent context.
 if(/\b(?:hurt my ?self|kill my ?self|suicid\w*|want to die|abuse|panic|can't breathe|cannot breathe)\b/i.test(context))return {mood:'care',pool:SAFE};
 const rules=[
  [/\b(?:ghost|left (?:me )?on read|no reply|not text|seen at)\b/i,'ghosting'],
  [/\b(?:lose my mind|losing my mind)\b/i,'overthinking'],
  [/\b(?:running|runnin.?) out of time\b/i,'time'],
  [/\b(?:blame|my fault|crossed a line)\b/i,'apology']
 ];
 const specials={overthinking:['your brain has 47 tabs open and one is playing music','🧠🌀','mind gone. left no forwarding address.','okay brain, maybe fewer side quests'],time:['even the clock needs to chill','⏳🏃','your calendar just asked for a holiday','racing time with 3% battery is bold']};
 for(const [re,mood] of rules)if(re.test(current))return {mood,pool:specials[mood]||BANKS[mood]};
 // Current line carries most weight; nearby lines resolve weak/ambiguous cues.
 const scores=new Map();
 [current,...previous].forEach((text,i)=>{const info=analyzeLyric(text,i===0?previous[0]:'');if(info){const mood=aliases[info.mood]||info.mood;scores.set(mood,(scores.get(mood)||0)+info.score*[1,.38,.15][i]);}});
 const mood=[...scores].filter(([m])=>BANKS[m]||['sad','anxiety'].includes(m)).sort((a,b)=>b[1]-a[1])[0]?.[0];
 if(mood==='sad'||mood==='anxiety')return {mood,pool:SAFE};
 return mood?{mood,pool:BANKS[mood]}:null;
}
export function listenerReplyFor(lyrics,plan,index,seed='') {
 if(index<2)return null;
 const who=plan.T[index]?.who;if(who===undefined)return null;
 let streak=0;for(let i=index;i>=0&&plan.T[i]?.who===who;i--)streak++;
 if(streak<3||streak%4!==3)return null;
 const line=lyrics.lines[index],prev=lyrics.lines[index-1];
 if(!line?.text||!prev||line.t-prev.t>20)return null;
 const info=listenerAnalysis(lyrics,index);if(!info)return null;
 // Rotate within each mood bank: repeated choruses don't repeat the same response.
 let occurrence=0;
 for(let i=2;i<index;i++)if((index-i)%4===0 && listenerAnalysis(lyrics,i)?.mood===info.mood)occurrence++;
 return info.pool[(reactionHash(`${seed}:${info.mood}`)+occurrence)%info.pool.length];
}
export function listenerTiming(line,text){
 const start=line.t+.55, duration=Math.min(3.4,Math.max(.9,Array.from(text).length*.043));
 return {start,end:start+duration};
}
