// Live companion speech and music projection. No generated lyrics or pretend audio analysis.
(() => {
  const $=id=>document.getElementById(id),root=$('aether-island');
  if(!root||!window.AetherIsland)return;
  const supported=!!(window.speechSynthesis&&window.SpeechSynthesisUtterance);
  let enabled=window.SystemState?.settings?.speech_synthesis==='on',lastReply='',speaking=false,utterance=null;
  let savedVoice=null;try{savedVoice=localStorage.getItem('aether-companion-voice');}catch(_){}
  let voiceChosen=savedVoice!==null;
  let voices=[],voiceURI=savedVoice||'',trackKey='',lyricIndex=0,lastFocus=null,reactionUntil=0,lastReaction=0;
  const locked=()=>!!window.os?.isScreenLocked;
  const text=(id,value)=>{const el=$(id);if(el&&el.textContent!==value)el.textContent=value;};
  function status(message){text('companion-voice-status',message);}
  function syncVoice(){
    const toggle=$('companion-voice-toggle');toggle.disabled=!supported;toggle.setAttribute('aria-pressed',String(enabled));toggle.textContent=enabled?'Voice on':'Voice off';
    $('companion-replay').disabled=!supported||!lastReply;$('companion-stop').disabled=!speaking;
    $('companion-voice-select').disabled=!supported;
  }
  function speechVisual(active,message=''){
    root.dataset.speech=active?'speaking':'idle';root.dataset.mouth='rest';
    $('companion-speech-caption').hidden=!active;
    if(!active){root.style.removeProperty('--mouth-width');root.style.removeProperty('--mouth-height');}
    else text('companion-spoken-words',message.slice(0,110));
  }
  function stop(){speechVisual(false);utterance=null;if(speaking)window.speechSynthesis?.cancel();speaking=false;syncVoice();}
  function say(value,explicit=false){
    if(locked()||document.hidden||(!enabled&&!explicit))return false;
    if(!supported){status('Speech is unavailable in this browser. Text replies still work.');return false;}
    const message=String(value||'').replace(/<[^>]*>/g,' ').trim().slice(0,1800);if(!message)return false;
    stop();const u=new SpeechSynthesisUtterance(message);utterance=u;
    u.voice=voices.find(v=>v.voiceURI===voiceURI)||null;u.rate=1;u.pitch=1.05;u.volume=.85;
    u.onstart=()=>{if(utterance!==u)return;speaking=true;speechVisual(true,message);
      root.dataset.visual=/\d\s*[+*/=−-]\s*\d|calculat|adding|subtracting/i.test(message)?'calculate':/music|song|track|radio|lyrics/i.test(message)?'music':/open|launch|workspace/i.test(message)?'workspace':'conversation';
status('Speaking · Stop silences me immediately');syncVoice();};
    u.onboundary=e=>{
      if(utterance!==u||!speaking)return;
      const index=Math.max(0,Number(e.charIndex)||0),word=message.slice(index).match(/^\S+/)?.[0]||'';
      root.dataset.mouth=/^[ou]/i.test(word)?'round':/^[mbp]/i.test(word)?'closed':'wide';
      const target=$('companion-spoken-words');target.replaceChildren();
      target.append(document.createTextNode(message.slice(Math.max(0,index-35),index)));
      const mark=document.createElement('mark');mark.textContent=word;target.append(mark,document.createTextNode(message.slice(index+word.length,index+word.length+65)));
    };
    u.onpause=()=>{if(utterance===u)root.dataset.speech='paused';};
    u.onresume=()=>{if(utterance===u)root.dataset.speech='speaking';};
    u.onend=()=>{if(utterance!==u)return;speechVisual(false);utterance=null;speaking=false;status(enabled?'Voice ready · replies will be spoken':'Read aloud finished');syncVoice();};
    u.onerror=e=>{if(utterance!==u)return;speechVisual(false);utterance=null;speaking=false;status('Could not speak'+(e.error?' ('+e.error+')':'')+'. Try Read reply or another browser voice.');syncVoice();};
    try{speaking=true;syncVoice();window.speechSynthesis.speak(u);return true;}catch(error){speechVisual(false);utterance=null;speaking=false;status('Speech unavailable: '+error.message);syncVoice();return false;}
  }
  function loadVoices(){
    voices=window.speechSynthesis?.getVoices?.()||[];
    const select=$('companion-voice-select');select.replaceChildren(new Option('System default',''));
    voices.forEach(v=>select.add(new Option(v.name+' · '+v.lang,v.voiceURI)));
    if(!voiceChosen){voiceURI=voices.find(v=>/maisie.*online/i.test(v.name))?.voiceURI||'';}
    if(voices.some(v=>v.voiceURI===voiceURI))select.value=voiceURI;
    else{select.value='';if(!voiceChosen)voiceURI='';}
    select.options[0].textContent=voiceURI&&!voices.some(v=>v.voiceURI===voiceURI)?'Preferred voice unavailable · system default':!voiceChosen&&!voiceURI?'Maisie unavailable · system default':'System default';
  }
  $('companion-voice-toggle').addEventListener('click',()=>{
    if(locked()||!supported)return;enabled=!enabled;syncVoice();
    if(enabled)say('Hey, I’m here. I’ll read my replies aloud. You can mute me anytime.',true);
    else{stop();status('Muted · replies stay on screen');}
  });
  $('companion-replay').addEventListener('click',()=>say(lastReply,true));
  $('companion-stop').addEventListener('click',()=>{stop();status('Stopped · press Read reply to hear it again');});
  $('companion-voice-select').addEventListener('change',e=>{voiceURI=e.target.value;voiceChosen=true;try{localStorage.setItem('aether-companion-voice',voiceURI);}catch(_){}stop();status('Voice changed · press Read reply to preview');});
  window.speechSynthesis?.addEventListener?.('voiceschanged',loadVoices);
  function react(message,mood='happy',force=false){
    const now=Date.now();if(locked()||document.hidden||(!force&&now-lastReaction<12000))return;
    lastReaction=now;reactionUntil=now+8000;text('companion-reaction',message);$('companion-reaction').hidden=false;
    window.dispatchEvent(new CustomEvent('aether:companion-reaction',{detail:{mood}}));
    // Reactions are deliberately quiet: no unsolicited spoken notifications over songs.
  }
  function update(){
    if(locked()){stop();$('companion-soundstage').hidden=true;$('companion-reaction').hidden=true;return;}
    if(Date.now()>reactionUntil)$('companion-reaction').hidden=true;
    const os=window.os||{},modern=window.AetherMusic?.getActivity?.();
    const live=modern?.active?modern:null;
    const track=live?{track:live.title,artist:live.artist}:os._currentTrackAudio,audio=os.audioStream;
    const radio=!track&&audio?.src?os._rbNowPlaying:null;
    const key=track?track.artist+' / '+track.track:radio?.name||'';
    const playing=live?live.playing:track?!!(audio?.src&&!audio.paused):!!(radio&&!audio.paused);
    // Embedded players don't expose playback state. Do not call them live or synchronized.
    const stage=$('companion-soundstage');stage.hidden=!key;
    const cover=$('companion-track-art');let art='';try{const url=new URL(live?.artwork||'');if(url.protocol==='https:'&&!url.username&&!url.password)art=url.href;}catch(_){}
    if(cover.getAttribute('src')!==art){if(art)cover.src=art;else cover.removeAttribute('src');}cover.hidden=!art||cover.dataset.failedArt===art;
    const transport=$('companion-music-toggle');transport.hidden=!live;transport.textContent=playing?'Ⅱ':'▶';transport.setAttribute('aria-label',playing?'Pause music':'Play music');
    const progress=$('companion-music-progress');progress.hidden=!live?.duration;if(live?.duration){progress.max=live.duration;progress.value=live.time;}

    root.classList.toggle('music-vibing',playing);
    if(key){
      if(key!==trackKey){trackKey=key;lyricIndex=0;let hash=0;for(const char of key)hash=(hash*31+char.charCodeAt(0))|0;stage.style.setProperty('--song-hue',Math.abs(hash)%360);react(track?'New soundtrack: '+track.track+'. I’m here for it.':'Tuned in to '+radio.name+'. Keeping you company.');}
      stage.classList.toggle('is-playing',playing);text('companion-track',track?track.track:key);
      text('companion-music-kind',live?`${live.playing?'PLAYING':live.phase==='resolving'?'CONNECTING':live.phase==='ended'?'FINISHED':'PAUSED'} · ${live.artist||'MUSIC'}`:track?(track.artist||'MUSIC'):(playing?'LIVE RADIO':'RADIO · PAUSED'));
      const identity=os.mediaLyricsIdentity;
      const matching=track&&identity?.track===track.track&&identity?.artist===track.artist;
      const lines=live?live.lines:matching?os.mediaLyricsParsed||[]:[];
      const timed=live?!!(lines.length&&live.clock):!!(lines.length&&/SYNC/.test(os.mediaLyricSource||'')&&audio?.src&&Number.isFinite(audio.duration)&&audio.duration>0);
      if(timed){const t=live?live.time+live.offset:audio.currentTime+(os.mediaLyricOffset||0);lyricIndex=-1;for(let i=0;i<lines.length;i++){if(Number(lines[i].t??lines[i].time)>t)break;lyricIndex=i;}}
      const current=lines[lyricIndex]?.text|| (lines.length?'The lyrics are about to begin…':track?'No lyrics available for this recording.':'This stream shares a station name, not song lyrics.');
      text('companion-lyric',current);text('companion-lyric-next',lines[lyricIndex+1]?.text||'');
      text('companion-lyrics-source',lines.length?(timed?(live?.estimated?'Estimated lyrics · player time':'Synced · player time'):'Lyrics · browse manually; timing unavailable'):track?'Open Music to load lyrics':'Radio metadata only');
      for(const id of ['companion-lyric-prev','companion-lyric-forward'])$(id).hidden=!lines.length||timed;
    }else{trackKey='';lyricIndex=0;}
    const focus=os.focusState;
    if(focus&&lastFocus?.running&&!focus.running&&focus.remainingSec===0)react('Session complete. Unclench your shoulders—you earned a breather.','happy',true);
    else if(focus?.running&&!lastFocus?.running)react('One thing at a time. I’ll keep you company, quietly.','focused');
    lastFocus=focus?{running:focus.running}:null;
  }
  $('companion-lyric-prev').addEventListener('click',()=>{if(locked())return;lyricIndex=Math.max(0,lyricIndex-1);update();});
  $('companion-lyric-forward').addEventListener('click',()=>{if(locked())return;lyricIndex=Math.min(Math.max(0,(window.AetherMusic?.getActivity?.()?.active?window.AetherMusic.getActivity().lines.length:window.os?.mediaLyricsParsed?.length||1)-1),lyricIndex+1);update();});
  $('companion-track-art').addEventListener('error',e=>{e.target.dataset.failedArt=e.target.getAttribute('src')||'';e.target.hidden=true;});
  $('companion-music-toggle').addEventListener('click',()=>{if(locked())return;if(window.AetherMusic?.getActivity?.()?.active)window.AetherMusic.player.toggle();update();});
  $('companion-open-media').addEventListener('click',()=>{if(locked())return;window.AetherIsland.prepareLaunch('media');window.os?.openWindow?.('media');});
  window.addEventListener('aether:music-activity',()=>update());
  window.addEventListener('aether:notification',e=>{if(/saved|complete|success/i.test(e.detail?.title||''))react('A little win: '+e.detail.title);});
  window.addEventListener('offline',()=>react('Connection dropped. I’m still here; local tools are available.','concerned',true));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  window.addEventListener('pagehide',stop);
  window.AetherIsland.speakReply=value=>{lastReply=String(value||'');syncVoice();return say(lastReply);};
  window.AetherIsland.experience={update,stop,get voiceEnabled(){return enabled;}};
  loadVoices();syncVoice();if(!supported)status('Speech is unavailable in this browser. Text replies still work.');update();
})();
