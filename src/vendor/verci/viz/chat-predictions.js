// Small offline word-completion / bigram predictor, scoped to this song.
const WORD=/[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu;
const BASE="I you we they it that this love like miss want know think feel really just so much okay yeah maybe tonight tomorrow always never here there now with me my your heart time can will be have are the a and to for not but i'm you're don't can't good cute funny thank thanks";
const PAIRS=['i love you','i miss you','i think so','i feel like','you are so cute','thank you so much','that is so funny','see you soon','good night','love you too','okay but why','i don’t know','are you okay','this is so good'];
const words=text=>String(text||'').match(WORD)||[];
export function createPredictor(lines=[]) {
 const counts=new Map(),next=new Map(),forms=new Map();
 for(const text of [BASE,...PAIRS,...lines.map(l=>typeof l==='string'?l:l.text||'')]){
  const tokens=words(text);tokens.forEach((word,i)=>{const key=word.toLocaleLowerCase().replace(/’/g,"'");counts.set(key,(counts.get(key)||0)+1);if(!forms.has(key))forms.set(key,word);
   if(i){const prev=tokens[i-1].toLocaleLowerCase().replace(/’/g,"'");if(!next.has(prev))next.set(prev,new Map());const map=next.get(prev);map.set(key,(map.get(key)||0)+1);}
  });
 }
 return text=>{
  text=String(text||'');const tokens=words(text),partial=/[\p{L}\p{N}'’]$/u.test(text)?tokens.at(-1)||'':'';
  const prefix=partial.toLocaleLowerCase().replace(/’/g,"'");
  const previous=tokens.at(partial?-2:-1)?.toLocaleLowerCase().replace(/’/g,"'");
  const pairs=next.get(previous);
  return [...counts].filter(([word])=>!prefix||word.startsWith(prefix)).sort((a,b)=>((pairs?.get(b[0])||0)*20+b[1])-((pairs?.get(a[0])||0)*20+a[1])||a[0].localeCompare(b[0])).slice(0,3).map(([key])=>forms.get(key));
 };
}
export function applyPrediction(text,suggestion,selectionStart=text.length,selectionEnd=selectionStart){
 const left=text.slice(0,selectionStart),right=text.slice(selectionEnd);
 const prefix=/[\p{L}\p{N}]+(?:['’][\p{L}]*)?$/u.exec(left);
 const start=prefix?selectionStart-prefix[0].length:selectionStart;
 const before=text.slice(0,start);
 const separator=before&&!/\s$/.test(before)&&!prefix?' ':'';
 const inserted=before+separator+suggestion+(/^\s/.test(right)?'':' ');
 return {text:inserted+right,caret:inserted.length};
}
export function predictionBar(predict,input){
 const bar=document.createElement('div');bar.className='kb-suggestions chat-live-predictions';bar.setAttribute('aria-label','Word suggestions');
 const update=()=>{
  bar.replaceChildren();
  for(const word of predict(input.value.slice(0,input.selectionStart??input.value.length))){
   const button=document.createElement('button');button.type='button';button.textContent=word;button.setAttribute('aria-label',`Insert suggestion ${word}`);
   button.onmousedown=e=>e.preventDefault();
   button.onclick=()=>{const result=applyPrediction(input.value,word,input.selectionStart,input.selectionEnd);input.value=result.text.slice(0,input.maxLength>0?input.maxLength:Infinity);input.focus();input.setSelectionRange(Math.min(result.caret,input.value.length),Math.min(result.caret,input.value.length));input.dispatchEvent(new input.ownerDocument.defaultView.Event('input',{bubbles:true}));};bar.append(button);
  }
 };
 input.addEventListener('input',update);input.addEventListener('click',update);input.addEventListener('keyup',update);update();return bar;
}
