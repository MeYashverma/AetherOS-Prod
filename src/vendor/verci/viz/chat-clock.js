// Message timestamps are wall-clock send times, never positions in the recording.
const clocks=new WeakMap();
export function localChatTime(date=new Date()) {
 return `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
}
export function messageTime(lyrics,key,date=new Date()) {
 let times=clocks.get(lyrics);if(!times){times=new Map();clocks.set(lyrics,times);}
 if(!times.has(key))times.set(key,localChatTime(date));
 return times.get(key);
}
