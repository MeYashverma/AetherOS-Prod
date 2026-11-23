import { createPredictor, predictionBar } from './chat-predictions.js';
import { messageTime } from './chat-clock.js';
// Per-song, in-memory chat state. Replies are local notes, never singer dialogue.
const sessions=new WeakMap();
export class ChatInteractions {
 constructor(viz) {
  this.viz=viz;const lyrics=viz.ctx.lyrics;
  if(!sessions.has(lyrics))sessions.set(lyrics,new Map());
  this.messages=sessions.get(lyrics);this.timers=new Set();this.panel=null;
 }
 record(index){if(!this.messages.has(index))this.messages.set(index,{reaction:undefined,replies:[]});return this.messages.get(index);}
 button(text,cls,fn){const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=text;b.onclick=e=>{e.stopPropagation();fn();};return b;}
 attach(bubble,index){
  bubble.dataset.messageIndex=index;const auto=bubble.querySelector('.chat-emoji');
  bubble.dataset.autoReaction=auto?.textContent || '';auto?.remove();
  bubble.tabIndex=0;
  bubble.setAttribute('aria-label','Lyric message; right-click or hold to react or reply');
  bubble.addEventListener('keydown',e=>{
   if(e.target!==bubble)return;
   if(e.key==='ContextMenu'||(e.shiftKey&&e.key==='F10')){e.preventDefault();this.open(index);}
  });
  bubble.addEventListener('contextmenu',e=>{if(e.target.closest('.chat-quote,.chat-reply-count'))return;e.preventDefault();this.open(index);});
  let timer,startX=0,startY=0;
  const clear=()=>{clearTimeout(timer);this.timers.delete(timer);};
  bubble.addEventListener('pointerdown',e=>{
   if(e.button!==0 || e.target.closest('button,input,textarea'))return;
   startX=e.clientX;startY=e.clientY;
   timer=setTimeout(()=>{this.timers.delete(timer);if(bubble.isConnected)this.open(index);},450);this.timers.add(timer);
  });
  for(const ev of ['pointerup','pointercancel','pointerleave'])bubble.addEventListener(ev,clear);
  bubble.addEventListener('pointermove',e=>{if(Math.abs(e.clientX-startX)>10 || Math.abs(e.clientY-startY)>10)clear();});
  this.update(bubble,index);
 }
 update(bubble,index,animate=false){
  bubble.querySelectorAll('.chat-reaction-pill,.chat-reply-count').forEach(e=>e.remove());
  const record=this.record(index),emoji=record.reaction===undefined?bubble.dataset.autoReaction:record.reaction;
  bubble.classList.toggle('has-chat-reaction',!!emoji);
  if(emoji){
   const pill=this.button(emoji,'chat-reaction-pill chat-emoji',()=>this.open(index));
   pill.setAttribute('aria-label',`${record.reaction===undefined?'Suggested':'Your'} reaction ${emoji}; change reaction`);pill.title=record.reaction===undefined?'Suggested contextual reaction':'Your local reaction';
   if(animate||record.presentedEmoji!==emoji)pill.classList.add('reaction-arrival');
   bubble.append(pill);
  }
  record.presentedEmoji=emoji;
  if(record.replies.length){const count=this.button(`↪ ${record.replies.length} ${record.replies.length===1?'reply':'replies'}`,'chat-reply-count',()=>this.openThread(index));bubble.append(count);}
 }
 refresh(index){this.viz.ph.querySelectorAll(`[data-message-index="${index}"]`).forEach(b=>this.update(b,index,true));}
 close(){this.panel?.remove();this.panel=null;if(this.focusReturn?.isConnected)this.focusReturn.focus({preventScroll:true});}
 shell(title){
  this.close();this.focusReturn=document.activeElement;
  const panel=document.createElement('section');panel.className='chat-interaction-panel';panel.tabIndex=-1;
  panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label',title);
  const head=document.createElement('div');head.className='chat-interaction-head';
  const label=document.createElement('strong');label.textContent=title;
  head.append(label,this.button('×','chat-panel-close',()=>this.close()));panel.append(head);
  panel.addEventListener('keydown',e=>{
   e.stopPropagation();
   if(e.key==='Escape'){e.preventDefault();this.close();}
   if(e.key==='Tab'){
    const targets=[...panel.querySelectorAll('button,textarea')].filter(n=>!n.disabled);
    const first=targets[0],last=targets.at(-1);
    if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
   }
  });
  this.viz.ph.append(panel);this.panel=panel;panel.focus();return panel;
 }
 quote(index){const q=document.createElement('blockquote');q.className='chat-selected-lyric';q.textContent=this.viz.ctx.lyrics.lines[index].text;return q;}
 open(index,expanded=false){
  const panel=this.shell('React to lyric');panel.append(this.quote(index));
  const picker=document.createElement('div');picker.className='chat-reaction-picker';picker.setAttribute('aria-label','Choose reaction');
  const emojis=expanded?['👍','❤️','😂','😮','😢','🙏','🔥','💀','😭','🫶','🥹','💅','👀','🤯','😎','💔','🫠','✨','🤝','🥰','😤','🦋','💯','🙌']:['👍','❤️','😂','😮','😢','🙏'];
  const record=this.record(index);
  for(const emoji of emojis){
   const b=this.button(emoji,'chat-picker-emoji',()=>{record.reaction=record.reaction===emoji?'':emoji;this.refresh(index);this.close();});
   b.setAttribute('aria-label',`React ${emoji}`);b.setAttribute('aria-pressed',String(record.reaction===emoji));picker.append(b);
  }
  if(!expanded)picker.append(this.button('+','chat-picker-more',()=>this.open(index,true)));
  panel.append(picker,this.button('Reply','chat-menu-action',()=>this.openThread(index,true)));
  if(record.replies.length)panel.append(this.button(`View thread (${record.replies.length})`,'chat-menu-action',()=>this.openThread(index)));
  if(record.reaction!==undefined || this.viz.ph.querySelector(`[data-message-index="${index}"]`)?.dataset.autoReaction)panel.append(this.button('Remove reaction','chat-menu-action',()=>{record.reaction='';this.refresh(index);this.close();}));
 }
 openThread(index,focusInput=false){
  const panel=this.shell('Lyric replies');panel.classList.add('chat-reply-sheet');
  const hint=document.createElement('small');hint.className='chat-local-note';hint.textContent='Local notes · not lyrics · not sent to anyone';panel.append(hint);
  const list=document.createElement('div');list.className='chat-local-thread';list.setAttribute('role','log');list.setAttribute('aria-live','polite');
  const draw=(animate=false)=>{
   list.replaceChildren();
   this.record(index).replies.forEach((reply,i)=>{const row=document.createElement('div');row.className='chat-local-reply';if(animate&&i===this.record(index).replies.length-1)row.classList.add('message-arrival');const who=document.createElement('small');who.textContent='You · local reply';const text=document.createElement('p');text.textContent=reply;const time=document.createElement('time');time.textContent=messageTime(this.viz.ctx.lyrics,`manual:${index}:${i}`);row.append(who,text,time);list.append(row);});
   if(!list.children.length){const empty=document.createElement('p');empty.textContent='No replies yet. Add your thoughts below.';list.append(empty);}
   list.scrollTop=list.scrollHeight;
  };draw();panel.append(list);
  const form=document.createElement('form');form.className='chat-reply-form';
  const input=document.createElement('textarea');input.maxLength=280;input.rows=2;input.placeholder='Reply to this lyric…';input.setAttribute('aria-label','Your local reply');
  const send=document.createElement('button');send.type='submit';send.textContent='Send';
  send.disabled=this.record(index).replies.length>=50;
  form.append(predictionBar(this.viz.predict || createPredictor(this.viz.ctx.lyrics.lines),input),input,send);form.onsubmit=e=>{e.preventDefault();const text=input.value.trim();const record=this.record(index);if(!text || record.replies.length>=50)return;record.replies.push(text.slice(0,280));input.value='';draw(true);this.refresh(index);send.disabled=record.replies.length>=50;input.focus();};
  input.onkeydown=e=>{if(e.key==='Enter' && !e.shiftKey){e.preventDefault();form.requestSubmit();}};
  panel.append(form);if(focusInput)input.focus();
 }
 destroy(){for(const timer of this.timers)clearTimeout(timer);this.timers.clear();this.close();}
}
