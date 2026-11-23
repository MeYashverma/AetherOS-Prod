// Curated context dictionary; popular slang, not a live trends feed.
const CORE = [
 ['heartbreak','💔 🥀 😔','cry','HEART = BROKEN', ['heartbreak','broken heart','goodbye','alvida','bewafa','dhokha','judai','छोड़ गया']],
 ['sad','🥺 😢','cry','IN MY FEELINGS', ['cry','crying','tears','sad','lonely','alone','aansu','tanha','udaas','rona','roye','आँसू','उदास','तन्हा']],
 ['love','❤️ 🥰 🫶','hug','ALL THE FEELS', ['love','heart','kiss','baby','darling','pyaar','pyar','ishq','mohabbat','dil','jaan','sajna','sohneya','प्यार','दिल','इश्क']],
 ['dance','💃 🕺 ✨','dance','MAIN CHARACTER ENERGY', ['dance','dancing','party','nach','nachdi','bhangra','jashn','नाच']],
 ['joy','😊 😂 ✨','smile','PURE GOOD VIBES', ['smile','laugh','laughing','happy','happiness','hassi','hasi','khushi','muskur','haha','hahaha','lol','lmao','खुशी','हँस']],
 ['anger','😤 🔥','angry','NOT TODAY', ['angry','anger','hate','gussa','nafrat','गुस्सा','नफ़रत']],
 ['dream','😴 💭 🌙','sleep','DREAM MODE', ['sleep','sleeping','dream','dreams','neend','sapne','khwab','नींद','सपने']],
 ['rain','🌧️ ☔',null,'RAINY DAY MOOD', ['rain','raining','baarish','barish','barsaat','बारिश']],
 ['night','🌙 ✨',null,'LATE NIGHT THOUGHTS', ['moon','stars','night','chaand','chand','taare','raat','चाँद','रात']],
 ['fire','🔥',null,'ABSOLUTE FIRE', ['fire','burn','burning','aag','आग']],
 ['confidence','😎 👑 💅','smile','UNBOTHERED', ['boss','queen','king','winning','unstoppable','champion','slay','unbothered','jeet','badshah','sher','जीत']],
 ['money','💸 🤑 💎',null,'BIG ENERGY', ['money','cash','rich','dollar','paisa','paise','daulat','पैसा']],
 ['surprise','😳 🤯 👀',null,'WAIT… WHAT?', ['wow','shocked','unbelievable','surprise','bruh','oh my god','kya baat']],
 ['longing','🥺 💭','cry','MISS YOU HOURS', ['miss you','missing you','yaad','intezaar','याद','इंतज़ार']]
];

// Pipe-separated phrases keep editorial updates readable; emoji are complete Unicode sequences.
const EXTENDED = [
 ['heartbreak','💔 🥀 😔','cry','HEART = BROKEN|LOVE LEFT THE CHAT|EMOTIONAL DAMAGE', 'fell out of love|you broke my heart|break my heart|dil toot gaya|toota dil|dil tod diya|dil tod ke|bewafai|judaa|bichhad gaye|chhod ke|chhod diya|chad ke|छोड़ दिया|दिल टूट गया|टूटा दिल'],
 ['sad','🥺 😢','cry','IN MY FEELINGS|SAD HOURS|NEED A MINUTE', 'feeling low|down bad|dead inside|empty inside|all cried out|cry myself to sleep|dard|tadap|tadpe|gham|gam mein|dukhi|dukhiya|hanju|hanjua|rona aaya|रोना|दर्द|तड़प|ग़म'],
 ['love','❤️ 🥰 🫶','hug','ALL THE FEELS|HEART EYES ONLY|SOFT ERA', 'in love with you|head over heels|my person|my soulmate|love of my life|ishq mein|pyaar mein|meri jaan|mere dil|tera dil|tu hi tu|mahi|mahiya|ve mahi|soniye|sohniye|jind jaan|tenu pyar|tere naal|मेरी जान|मोहब्बत|प्यार में'],
 ['dance','💃 🕺 ✨','dance','MAIN CHARACTER ENERGY|ON REPEAT|DANCE FLOOR ERA', 'turn up the music|hit the dance floor|move your body|dance all night|nach le|nachna|nachde|nachdi phire|gidda|giddha|balle balle|dhol|dholki|thumka|thumke|jhumka|jhoom|झूम|ठुमका|भांगड़ा'],
 ['joy','😊 😂 ✨','smile','PURE GOOD VIBES|HAPPY CORE|THIS IS THE MOOD', 'good vibes|feeling good|best day ever|so happy|made my day|khush|khushiyan|muskurana|muskura|hassdi|hasdi|hassda|hansna|hansi|मुस्कान|खुशियाँ|हँसी'],
 ['anger','😤 🔥','angry','NOT TODAY|PATIENCE LEFT THE CHAT|DO NOT DISTURB', 'fed up|had enough|leave me alone|back off|so mad|gusse|gusse mein|nafratein|jalta hai|gussa aaya|नफरत|गुस्से'],
 ['dream','😴 💭 🌙','sleep','DREAM MODE|DO NOT WAKE ME|DREAMING IN HD', 'daydream|daydreaming|sweet dreams|half asleep|khwaab|khwaabon|khwabon|sapna|sapno|khwaban|supne|supna|nind|neendan|नींदों|ख्वाब|ख़्वाब|सपना'],
 ['rain','🌧️ ☔',null,'RAINY DAY MOOD|MONSOON FEELS|RAIN ON REPEAT', 'pouring rain|rain on me|raindrops|thunderstorm|monsoon|bheegi|bheega|bheegi raat|boondein|rimjhim|sawan|saawan|बरसात|बूँदें|सावन'],
 ['night','🌙 ✨',null,'LATE NIGHT THOUGHTS|AFTER HOURS|MIDNIGHT MOOD', 'midnight|after midnight|late night|starry sky|under the moon|raat bhar|raaton|raton|chandni|taaron|tareyan|taareyan|चांदनी|तारे|रातों'],
 ['confidence','😎 👑 💅','smile','UNBOTHERED|BUILT DIFFERENT|ATE AND LEFT NO CRUMBS|MAIN CHARACTER', 'built different|main character|ate and left no crumbs|understood the assignment|on my own terms|know my worth|self made|self-made|no cap|i ate|king energy|queen energy|boss mode|sherni|jatt|jatti|sardari|raaj|raaj kare|sher da|jeet gaya|जीत गया'],
 ['money','💸 🤑 💎',null,'BIG ENERGY|SECURING THE BAG|PAID IN FULL|BAG SECURED', 'secure the bag|securing the bag|getting paid|payday|big checks|big cheques|making money|millionaire|billionaire|racks|cash flow|flex money|paisa hi paisa|notan|pese|peseyan|daulatan|ameer|अमीर|दौलत|नोट'],
 ['surprise','😳 🤯 👀',null,'WAIT… WHAT?|PLOT TWIST|DID THAT JUST HAPPEN?', 'plot twist|did not see that coming|didn’t see that coming|mind blown|no way|what just happened|excuse me|hain ji|hain kya|kya hua|hairan|हैरान|क्या बात'],
 ['longing','🥺 💭','cry','MISS YOU HOURS|COME BACK ONLINE|STILL THINKING OF YOU', 'wish you were here|want you back|come back to me|missing you tonight|thinking of you|yaadon|yaadon mein|teri yaad|yaad aati|yaad teri|yaad aundi|udeek|udik|intezar|intazaar|taras|यादों|तेरी याद|इंतजार'],
 ['humor','😂 🤣 💀 😭','smile','I CANNOT|HELP 😭|NOT ME LAUGHING|WHEEZING', 'im dead|i’m dead|i am dead|dead laughing|dying laughing|cant stop laughing|can’t stop laughing|laugh out loud|rofl|lmfao|ijbol|im crying laughing|you crack me up|has has ke|hass hass ke|pet dard haske'],
 ['flirt','😉 😏 🫦 🫣','smile','RIZZ DETECTED|SMOOTH OPERATOR|RESPECTFULLY…|SHOOTING MY SHOT', 'rizz|rizzler|flirting|flirt|shoot my shot|shooting my shot|hey cutie|hey pretty|you look fine|come closer|come here baby|nain matakka|nain lad gaye|ankh maare|akh maare|akh ladi|nakhra|nakhray|नैन मटक्का'],
 ['crush','🫣 🥹 💘 🦋','hug','BUTTERFLIES ACTIVATED|CRUSH ERA|OH NO THEY ARE CUTE', 'crush on you|got a crush|butterflies in my stomach|make me blush|blushing|stole my heart|you caught my eye|pehli nazar|pehli dafa|dil churaya|dil chura|nazar mili|pehli vari|पहली नज़र'],
 ['devotion','🫶 🥹 🤍','hug','MY SAFE PLACE|RIDE OR DIE|YOU ARE HOME', 'ride or die|safe with you|you are my home|always by your side|through thick and thin|never let you go|never leave you|stand by you|saath nibhana|saath rahenge|hamesha tere|tere vaaste|tere vaste|janam janam|rab ne banaya|साथ निभाना'],
 ['ghosting','👻 📵 🫠',null,'LEFT ON READ|GHOST MODE|SEEN. NO REPLY.|LAST SEEN: NEVER', 'left on read|left me on read|left on seen|blue ticks|double tick|no reply|ghosted|ghosting|you disappeared|seen zone|seen-zoned|reply nahi|jawab nahi|phone nahi uthaya|block kar diya|ब्लॉक कर दिया'],
 ['breakup','💔 🚪 ✌️','cry','WE ARE DONE|NEW CHAPTER LOADING|CLOSURE NOT FOUND', 'we are done|we’re done|its over between us|it’s over between us|break up|broke up|breaking up|walk away from you|let you go|moving on from you|rishta khatam|rishta tod|alag raaste|रिश्ता खत्म'],
 ['healing','❤️‍🩹 🌱 🫂','hug','HEALING ERA|ONE DAY AT A TIME|SOFT RESET|WE GROW FROM HERE', 'healing|heal my heart|getting better|learning to let go|picking up the pieces|starting over|new beginning|new chapter|better days ahead|found myself|khud se pyaar|nayi shuruaat|phir se jeena|नई शुरुआत'],
 ['nostalgia','🥹 📼 🕰️',null,'CORE MEMORY|TAKE ME BACK|THE LORE RUNS DEEP|MEMORY UNLOCKED', 'take me back|remember when|back in the day|good old days|childhood|nostalgia|those were the days|old memories|bachpan|purane din|beete din|woh din|yaad hai woh|बचपन|पुराने दिन'],
 ['friendship','🫂 🤝 🫶','hug','BESTIE ENERGY|THE REAL ONES|SQUAD CHECK|DAY ONES', 'bestie|best friend|best friends|homies|my squad|day ones|the real ones|friends forever|yaari|yaaran|yaar mere|mere yaar|dosti|dost|mitran|mitra|veere|यारी|दोस्ती|दोस्त'],
 ['betrayal','🐍 💔 😒','cry','TRUST ISSUES UNLOCKED|SNAKE ALERT|THE SWITCH UP', 'backstab|backstabbed|two faced|two-faced|fake friends|fake love|you lied|liar|betrayed|betrayal|trust issues|switched up|dhokebaaz|jhoothe vaade|jhootha pyar|nakli yaar|झूठे वादे|धोखेबाज़'],
 ['jealousy','🙄 😒 👀',null,'SIDE EYE|JEALOUS MUCH?|THE AUDACITY', 'jealous|jealousy|green with envy|side eye|side-eye|who is she|who is he|you with somebody else|jalte log|jaldi duniya|duniya jaldi|hasad|jalan|जलन'],
 ['anxiety','😵‍💫 🫠 😮‍💨',null,'OVERTHINKING AGAIN|BRAIN HAS 47 TABS|SPIRAL MODE|NEED TO LOG OFF', 'overthinking|overthink|anxious|anxiety|panic|racing thoughts|mind wont stop|mind won’t stop|cant breathe|can’t breathe|losing my mind|too much pressure|ghabrahat|bechain|bechaini|pareshan|बेचैनी|घबराहट'],
 ['tired','😮‍💨 🫠 🪫','sleep','BATTERY AT 1%|SOCIAL BATTERY: EMPTY|LOW POWER MODE|I NEED A NAP', 'burnt out|burned out|exhausted|so tired|running on empty|no energy|need a nap|social battery|thak gaya|thak gayi|thak ke|thakaan|थक गया|थक गई'],
 ['peace','🧘 🍃 🤍',null,'PEACE OVER DRAMA|IN MY PEACE ERA|DO NOT DISTURB', 'peace of mind|inner peace|at peace|peaceful|serenity|calm down|breathe in|breathe out|sukoon|sukun|chain mila|shaanti|shanti|aram|सुकून|शांति'],
 ['hope','🌅 🕯️ ✨',null,'BETTER DAYS LOADING|STILL GOT HOPE|LIGHT AT THE END', 'hope|hopeful|keep the faith|light at the end|sun will rise|tomorrow is brighter|never give up|dont give up|don’t give up|hold on tight|umeed|ummeed|aas hai|roshni hogi|उम्मीद|आशा'],
 ['determination','💪 🏆 🔥','smile','LOCKED IN|COMEBACK SEASON|TRUST THE PROCESS|LETS GET IT', 'locked in|lock in|comeback|grind|grinding|hustle|hustling|work hard|working hard|never back down|prove them wrong|against all odds|mehnat|hausla|himmat|kar ke dikha|मेहनत|हौसला|हिम्मत'],
 ['freedom','🕊️ 🦋 🌍',null,'FREE AT LAST|NO STRINGS ATTACHED|MY LIFE MY RULES', 'freedom|set me free|break free|flying free|spread my wings|cant cage me|can’t cage me|no strings attached|azadi|azaadi|aazaad|udne do|khuli hawa|आज़ादी|आजाद'],
 ['travel','✈️ 🧳 🌍',null,'CATCH FLIGHTS|OUT OF OFFICE|NEW CITY NEW ME|ADVENTURE MODE', 'catch flights|road trip|take a flight|on a plane|pack my bags|passport|new city|travel the world|safar|musafir|pardes|pardesi|shehar se door|सफ़र|मुसाफिर|परदेस'],
 ['speed','🏎️ 💨 🏁',null,'FAST LANE ENERGY|FULL SEND|NO BRAKES', 'fast lane|full throttle|pedal to the metal|no brakes|racing through|speeding|highway|gaddi|gaadi|gadi|car di|lambo|ferrari|porsche|गाड़ी'],
 ['fashion','💅 🕶️ ✨',null,'FIT CHECK|DRIP TOO HARD|SERVING LOOKS|THE FIT ATE', 'fit check|drip|dripping|dressed to kill|outfit|designer|fresh kicks|red bottoms|black suit|kaala suit|kala suit|patiala suit|jhanjar|paranda|surma|kajal|झांझर|काजल'],
 ['music','🎧 🎶 🔁',null,'ON REPEAT|THIS PART RIGHT HERE|VOLUME UP|CERTIFIED EARWORM', 'on repeat|favorite song|favourite song|turn it up|volume up|headphones|melody|rhythm|sing along|sing with me|geet|gaana|gaane|sangeet|dhun|गीत|गाना|धुन'],
 ['celebration','🎉 🥳 🥂','dance','WE DID IT|BIG W ENERGY|CELEBRATION MODE|THIS CALLS FOR CONFETTI', 'we did it|big win|celebrate|celebration|birthday|cheers to us|raise a toast|shaadi|shadi|viah|vyaah|mubarak|badhai|शादी|बधाई|मुबारक'],
 ['apology','🥺 🙏 ❤️‍🩹',null,'MY BAD BESTIE|CAN WE RESET?|SORRY HOURS', 'im sorry|i’m sorry|i am sorry|forgive me|my mistake|my bad|i messed up|second chance|maaf kar|maafi|galti meri|meri galti|माफ़ कर|मेरी गलती'],
 ['gratitude','🙏 🥹 🤍',null,'GRATEFUL ERA|FEELING BLESSED|THANK YOU FOR EXISTING', 'thank you|thanks for everything|grateful|gratitude|blessed|count my blessings|shukriya|shukrana|dhanyavaad|rab da shukar|शुक्रिया|धन्यवाद'],
 ['chaos','🤪 🫠 🌪️',null,'CHAOS BUT MAKE IT CUTE|UNHINGED HOURS|WHAT IS THE PLOT?', 'unhinged|chaotic|chaos|hot mess|lost the plot|going crazy|crazy night|what a mess|pagalpan|pagalpanti|deewanapan|पागलपन'],
 ['awkward','🫣 😬 🫠',null,'I SHOULD LOG OFF|AWKWARD…|HIDE ME|SOCIAL SKILLS LEFT THE CHAT', 'awkward|embarrassed|embarrassing|cringe|cringey|caught in 4k|caught me staring|sharam aa|sharma gayi|sharma gaya|शर्म आ गई'],
 ['suspicion','🤨 🧐 👀',null,'SUS DETECTED|MATH IS NOT MATHING|HOLD UP|SOMETHING IS OFF', 'suspicious|acting sus|thats sus|that’s sus|something is off|doesnt add up|doesn’t add up|math aint mathing|math ain’t mathing|i know your secret|daal mein kala|दाल में काला'],
 ['rejection','🙅 ✋ 🚫',null,'HARD PASS|NOPE ERA|ACCESS DENIED|NOT MY VIBE', 'hard pass|not interested|leave me be|dont want you|don’t want you|not my type|not my vibe|stay away|door reh|dur reh|mujhe nahi chahiye|दूर रह'],
 ['romance','💋 🌹 🕯️','hug','ROMCOM MOMENT|SO THIS IS LOVE|CINEMATIC FEELS', 'candlelight|hold me close|hold my hand|slow dance|kiss me|kiss you|in your arms|baahon mein|bahon mein|honthon|hothon|zulfon|zulf|बाहों में|होंठों'],
 ['loyalty','🤞 🫡 🤝',null,'REAL ONES ONLY|TEN TOES DOWN|LOYALTY CHECK', 'loyal|loyalty|ten toes down|never switch up|keep it real|stood by me|got your back|wafa|wafadar|yaar pakke|pakki yaari|वफ़ा'],
 ['defiance','😤 🖤 ✊',null,'WATCH ME|NOT TAKING THE L|SAY LESS', 'watch me now|cant stop me|can’t stop me|you cant control me|you can’t control me|break the rules|i wont bow|i won’t bow|jhukega nahi|jhukna nahi|rok sake|झुकेगा नहीं'],
 ['awe','🥹 ✨ 😍',null,'ACTUALLY ETHEREAL|A WHOLE VIBE|NO WORDS', 'breathtaking|beautiful soul|so beautiful|ethereal|out of this world|heaven on earth|khoobsurat|khubsurat|haseen|husn|noor|नूर|हसीन|खूबसूरत']
];

export const REACTION_DICTIONARY = CORE.map(row => {
 const extra=EXTENDED.find(e=>e[0]===row[0]);
 return extra ? [row[0],row[1],row[2],extra[3], [...new Set([...row[4],...extra[4].split('|')])]] : row;
}).concat(EXTENDED.filter(e=>!CORE.some(c=>c[0]===e[0])).map(e=>[...e.slice(0,4),e[4].split('|')]));
export const REACTION_DICTIONARY_STATS = Object.freeze({
 moods:REACTION_DICTIONARY.length,
 phrases:REACTION_DICTIONARY.reduce((n,r)=>n+r[4].length,0),
 stickerCaptions:REACTION_DICTIONARY.reduce((n,r)=>n+r[3].split('|').length,0),
 emoji: new Set(REACTION_DICTIONARY.flatMap(r=>r[1].split(' '))).size
});
