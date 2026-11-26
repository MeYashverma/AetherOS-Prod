// Live activities from actual browser/app events; no simulated telemetry or alerts.
(() => {
  const root=document.getElementById('aether-island');if(!root)return;
  const $=id=>document.getElementById(id), toggle=$('island-toggle'),panel=$('island-panel');
  const state={events:[],current:null,assistant:{},expanded:false,view:'assistant',sequence:0};
  let alertTimer,metricsFrame,frames=0,started=0,rafActive=false,timer;
  let expression='curious',expressionUntil=0;
  const locked=()=>!!window.os?.isScreenLocked;
  function setText(id,value){const el=$(id);if(el&&el.textContent!==value)el.textContent=value;}
  function updateDeck(){
    const focus=window.os?.focusState;
    const remaining=Math.max(0,Number(focus?.remainingSec)||0),total=Math.max(1,Number(focus?.totalSec)||1500);
    const progress=focus?Math.max(0,Math.min(1,1-remaining/total)):0;
    const time=focus?(window.os.focusFormatTime?.(remaining)||Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0')):'25:00';
    setText('island-deck-time',time);setText('island-deck-state',focus?.running?'Session in progress':focus&&remaining<total?'Paused · your time is safe':'Ready to focus');
    $('island-focus-dial')?.style.setProperty('--focus-progress',progress+'turn');
    $('island-focus-satellite')?.style.setProperty('--focus-progress',progress+'turn');
    const sat=$('island-focus-satellite');if(sat){sat.classList.toggle('running',!!focus?.running);const label=sat.querySelector('.satellite-label');if(label)label.textContent=focus?.running?time:'Focus';}
    setText('island-start-focus',focus?.running?'Pause session':focus&&remaining<total?'Resume session':'Start 25 min');
    const music=window.AetherMusic?.getActivity?.(),modern=music?.active,audio=modern?{paused:!music.playing,volume:music.volume}:window.os?.audioStream,available=modern||!!audio?.src;
    if($('island-audio-deck')){$('island-audio-deck').hidden=!available;$('island-audio-deck').classList.toggle('playing',available&&!audio.paused);}
    if(available){setText('island-deck-track',modern?music.title:os._rbNowPlaying?.name||'Current audio');setText('island-audio-toggle',audio.paused?'Play':'Pause');if(document.activeElement!==$('island-volume'))$('island-volume').value=String(audio.volume);}
  }
  function display(){
    const face=$('companion-face'),portrait=!locked()&&state.expanded&&state.view==='assistant';
    const faceHome=portrait?$('companion-face-slot'):toggle;
    if(face&&faceHome&&face.parentElement!==faceHome)faceHome.prepend(face);
    face?.classList.toggle('portrait-face',portrait);
    if(locked()){window.AetherIsland?.experience?.update();document.documentElement.dataset.islandExpanded='true';close();$('island-label').textContent='Aether · locked';root.dataset.state='idle';return;}
    window.AetherIsland?.experience?.update();
    updateDeck();
    const ai=state.assistant,focus=window.os?.focusState,music=window.AetherMusic?.getActivity?.();
    let label='Ask Aether',trailing='✦',kind='idle';
    if(state.current){label=state.current.title;trailing='●';kind='alert';}
    else if(ai.loading){label='Loading local model';trailing='↓';kind='loading';}
    else if(ai.busy){label='Aether is working';trailing='···';kind='thinking';}
    else if(/listening|ptt/i.test(ai.voice||'')){label='Listening · microphone active';trailing='◉';kind='listening';}
    else if(root.dataset.speech==='speaking'||(root.dataset.speech!=='paused'&&window.speechSynthesis?.speaking)){label='Aether is speaking';trailing='♫';kind='speaking';}
    else if(focus?.running){label='Focus · '+(window.os.focusFormatTime?.(focus.remainingSec)||focus.remainingSec+'s');trailing='◷';kind='focus';}
    else if(music?.active&&music.playing){label=music.title;trailing='♫';kind='media';}
    else if(window.os?.audioStream&&!os.audioStream.paused){label=os._rbNowPlaying?.name||'Audio playing';trailing='♫';kind='media';}
    const focusRow=$('island-focus-activity'),audioRow=$('island-audio-activity');
    if(focusRow){focusRow.hidden=!focus?.running;if(focus?.running)$('island-focus-time').textContent=label.startsWith('Focus')?label:'Focus · '+(os.focusFormatTime?.(focus.remainingSec)||focus.remainingSec+'s');}
    if(audioRow){audioRow.hidden=!(music?.active&&music.playing)&&(!window.os?.audioStream||os.audioStream.paused);if(!audioRow.hidden)$('island-audio-title').textContent=music?.active?music.title:os._rbNowPlaying?.name||'Audio playing';}
    document.documentElement.dataset.islandExpanded=String(state.expanded);
    document.documentElement.dataset.islandAlert=String(!!state.current);
    const mood=ai.busy?'thinking':ai.loading?'patient':kind==='listening'?'listening':kind==='speaking'?'talking':kind==='focus'?'focused':kind==='media'?'grooving':Date.now()<expressionUntil?expression:'curious';
    root.dataset.mood=mood;
    const moods={thinking:'Thinking · connecting the dots',patient:'Patient · downloading local intelligence',listening:'Listening · go ahead',talking:'Talking · here’s what I found',focused:'Focused · one thing at a time',grooving:'Grooving · enjoying your soundtrack',happy:'Happy · done',concerned:'Concerned · something needs attention',curious:'Curious · ready when you are'};
    setText('companion-mood',moods[mood]);
    if(state.expanded&&state.view==='assistant'&&!ai.busy&&!ai.loading){label='Aether';trailing='';}
    $('island-label').textContent=label;$('island-trailing').textContent=trailing;root.dataset.state=kind;
    toggle.title=state.current?state.current.title+' · '+state.current.message:'Open Aether Assistant and live activity';
  }
  function renderEvents(){
    const list=$('island-events');list.replaceChildren();$('island-event-count').textContent=String(state.events.length);
    if(!state.events.length){const li=document.createElement('li');li.className='island-empty';li.textContent='No events yet. Network changes, Focus notifications and app alerts will appear here.';list.append(li);}
    for(const event of state.events){const li=document.createElement('li'),head=document.createElement('div'),title=document.createElement('strong'),time=document.createElement('time'),message=document.createElement('p');title.textContent=event.title;time.dateTime=new Date(event.time).toISOString();time.textContent=new Date(event.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});message.textContent=event.message;head.append(title,time);li.append(head,message);list.append(li);}
    $('island-dismiss').disabled=!state.current;
    if($('island-alert-peek')){$('island-alert-peek').hidden=!state.current||state.expanded;setText('island-alert-message',state.current?.message||'');}
    root.classList.toggle('has-alert',!!state.current);
  }
  function notify(detail){
    if(locked())return;
    const title=String(detail?.title||'System').slice(0,120),message=String(detail?.message||'').slice(0,1400),now=Date.now();
    const previous=state.events[0];if(previous?.title===title&&previous.message===message&&now-previous.time<2000)return;
    const from=!state.expanded?beginMorph():null;
    const event={id:++state.sequence,title,message,time:now};state.events.unshift(event);state.events.length=Math.min(30,state.events.length);state.current=event;
    root.classList.remove('event-arrived');void root.offsetWidth;root.classList.add('event-arrived');
    $('island-announcer').textContent=title+': '+message;renderEvents();display();if(from)animateShell(from);clearTimeout(alertTimer);alertTimer=setTimeout(dismiss,8000);
  }
  function dismiss(){const from=state.current&&!state.expanded&&!locked()?beginMorph():null;clearTimeout(alertTimer);state.current=null;$('island-announcer').textContent='';renderEvents();display();if(from)animateShell(from);}
  let morph=null, fade=null, motionID=0;
  const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||window.SystemState?.settings?.motion_intensity==='off';
  function animateShell(from,onFinish){
    const turn=++motionID;
    const target=root.getBoundingClientRect();
    if(reduced()||!root.animate||!from.width||!target.width){onFinish?.();return;}
    // Animate actual shell bounds, not scale the text. Cancel/restart at its
    // current visual bounds on rapid clicks, so no stale finish hides a reopen.
    panel.style.width=Math.max(0,target.width-2)+'px';
    const opening=state.expanded;
    morph=root.animate([
      {width:from.width+'px',height:from.height+'px',borderRadius:opening?'22px':'26px'},
      {offset:.78,width:(target.width+(opening?5:-2))+'px',height:(target.height+(opening?3:0))+'px',borderRadius:opening?'29px':'22px'},
      {width:target.width+'px',height:target.height+'px',borderRadius:opening?'26px':'22px'}
    ],{duration:opening?480:320,easing:'cubic-bezier(.2,.75,.25,1)',fill:'none'});
    if(opening)fade=panel.animate?.([{opacity:0,transform:'translateY(-7px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,delay:80,fill:'backwards',easing:'ease-out'});
    morph.onfinish=()=>{if(turn!==motionID)return;morph=null;panel.style.width='';onFinish?.();};
  }
  function beginMorph(){const rect=root.getBoundingClientRect();motionID++;morph?.cancel();fade?.cancel();morph=null;fade=null;panel.style.width='';panel.style.position='';panel.style.top='';if(!state.expanded)panel.hidden=true;return rect;}
  function open(view='assistant'){
    if(locked())return;
    const from=beginMorph();
    state.expanded=true;state.view=['activity','actions'].includes(view)?view:'assistant';panel.hidden=false;panel.inert=false;panel.removeAttribute('aria-hidden');toggle.setAttribute('aria-expanded','true');root.classList.add('expanded');
    $('island-assistant-view').hidden=state.view!=='assistant';$('island-activity-view').hidden=state.view!=='activity';if($('island-actions-view'))$('island-actions-view').hidden=state.view!=='actions';
    renderEvents();display();
    root.querySelectorAll('[data-island-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.islandTab===state.view)));
    animateShell(from);
    if(state.view==='actions'&&!reduced())root.querySelectorAll('.island-focus-deck,.island-launch-grid button').forEach((item,i)=>item.animate?.([{opacity:0,transform:'translateY(9px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:260,delay:90+i*28,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'}));
    if(state.view==='assistant')$('companion-chat-input')?.focus({preventScroll:true});else if(state.view==='actions')$('island-start-focus')?.focus({preventScroll:true});else $('island-clear').focus({preventScroll:true});
  }
  function close(focus=false){
    if(!state.expanded)return;
    const from=beginMorph();state.expanded=false;panel.inert=true;panel.setAttribute('aria-hidden','true');panel.hidden=true;toggle.setAttribute('aria-expanded','false');root.classList.remove('expanded','model-open');$('island-model-toggle')?.setAttribute('aria-expanded','false');
    renderEvents();display();
    animateShell(from,()=>{if(!state.expanded){panel.hidden=true;panel.style.position='';panel.style.top='';}});
    if(!reduced()&&root.animate&&from.width){
      // Keep the real, inert content visible inside the shrinking shell. It is
      // clipped/faded, not abruptly removed or duplicated into a screenshot.
      panel.hidden=false;panel.style.position='absolute';panel.style.top='31px';panel.style.width=Math.max(0,from.width-2)+'px';
      fade=panel.animate?.([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-8px)'}],{duration:140,easing:'ease-out',fill:'forwards'});
    }
    if(focus)toggle.focus({preventScroll:true});
  }
  function clear(){state.events=[];dismiss();}
  toggle.addEventListener('click',()=>state.expanded?close():open(state.current?'activity':'assistant'));
  $('island-focus-pause')?.addEventListener('click',()=>{window.os?.focusPauseTimer?.();display();});
  $('island-audio-pause')?.addEventListener('click',()=>{if(window.AetherMusic?.getActivity?.()?.active){window.AetherMusic.player.pause();display();return;}window.os?.audioStream?.pause();window.os?.updatePlayStateVisuals?.(false);display();});
  $('island-model-toggle')?.addEventListener('click',()=>{const from=beginMorph();const visible=root.classList.toggle('model-open');$('island-model-toggle').setAttribute('aria-expanded',String(visible));animateShell(from);});
  $('island-new-chat')?.addEventListener('click',()=>{window.os?.companionChatClear?.();open('assistant');});
  $('island-close').addEventListener('click',()=>close(true));$('island-clear').addEventListener('click',clear);$('island-dismiss').addEventListener('click',dismiss);
  root.querySelectorAll('[data-island-tab]').forEach(b=>b.addEventListener('click',()=>open(b.dataset.islandTab)));
  function launchApp(id){if(locked())return;prepareLaunch(id);window.os?.openWindow?.(id);}

  $('island-actions-satellite')?.addEventListener('click',()=>open('actions'));
  $('island-alert-peek')?.addEventListener('click',()=>open('activity'));
  $('island-start-focus')?.addEventListener('click',()=>{
    if(locked()||!window.os?.focusState)return;
    const focus=os.focusState;if(!focus.running&&focus.remainingSec===focus.totalSec)os.focusSetMode('focus25');os.focusToggleTimer();display();
  });
  $('island-start-break')?.addEventListener('click',()=>{
    if(locked()||!window.os?.focusState)return;
    if((os.focusState.running||os.focusState.remainingSec<os.focusState.totalSec)&&!window.confirm('Replace the current session with a five-minute break?'))return;
    os.focusSetMode('break5');os.focusToggleTimer();display();
  });
  $('island-open-focus')?.addEventListener('click',()=>launchApp('focus'));
  root.querySelectorAll('[data-island-launch]').forEach(b=>b.addEventListener('click',()=>launchApp(b.dataset.islandLaunch)));
  $('island-open-launcher')?.addEventListener('click',()=>{if(locked())return;close();window.os?.toggleFinder?.();});
  $('island-audio-toggle')?.addEventListener('click',async()=>{
    if(locked())return;if(window.AetherMusic?.getActivity?.()?.active){window.AetherMusic.player.toggle();display();return;}
    const audio=window.os?.audioStream;if(!audio?.src)return;
    try{if(audio.paused)await audio.play();else audio.pause();window.os?.updatePlayStateVisuals?.(false);display();}catch(error){notify({title:'Playback unavailable',message:error.message||'The source could not be played.'});}
  });
  $('island-volume')?.addEventListener('input',e=>{if(locked())return;const volume=Math.max(0,Math.min(1,Number(e.target.value)));if(window.AetherMusic?.getActivity?.()?.active)window.AetherMusic.player.setVolume(volume);else if(window.os?.rbAdjustVolume)os.rbAdjustVolume(volume);else if(window.os?.audioStream)os.audioStream.volume=volume;});
  root.querySelectorAll('[data-island-agent]').forEach(button=>button.addEventListener('click',async()=>{
    if(locked()||state.agentRunning)return;
    const steps=button.dataset.islandAgent==='write'?['devpad','focus']:['browser','wikiboard','devpad'];
    if(!window.confirm('Run this workspace agent?\n'+steps.map((id,i)=>(i+1)+'. Open '+id).join('\n')+'\nNo files will be changed.'))return;
    state.agentRunning=true;
    try{for(const [i,id] of steps.entries()){if(locked())throw Error('Workspace locked; remaining steps stopped');if(!window.SystemState?.windows?.[id])throw Error('App unavailable: '+id);if(typeof window.os?.openWindow!=='function')throw Error('Workspace unavailable');await os.openWindow(id);setText('island-agent-status',`Completed ${i+1}/${steps.length}: opened ${id}`);}expression='happy';expressionUntil=Date.now()+6000;}
    catch(error){setText('island-agent-status','Stopped: '+error.message);expression='concerned';expressionUntil=Date.now()+6000;}
    finally{state.agentRunning=false;display();}
  }));
  new MutationObserver(records=>{for(const record of records)for(const row of record.addedNodes){if(row.nodeType!==1||!/^AETHER:/.test(row.textContent))continue;expression=/unavailable|failed|error|no model|sorry/i.test(row.textContent)?'concerned':'happy';expressionUntil=Date.now()+6000;}display();}).observe($('companion-chat-log'),{childList:true});
  root.addEventListener('pointermove',e=>{if(reduced()||e.pointerType==='touch')return;const r=root.getBoundingClientRect();root.style.setProperty('--gaze-x',Math.max(-3,Math.min(3,(e.clientX-r.x-r.width/2)/45))+'px');root.style.setProperty('--gaze-y',Math.max(-2,Math.min(2,(e.clientY-r.y-18)/50))+'px');});
  root.addEventListener('pointerleave',()=>{root.style.setProperty('--gaze-x','0px');root.style.setProperty('--gaze-y','0px');});
  document.addEventListener('keydown',e=>{if(locked()||!e.altKey||e.ctrlKey||e.metaKey)return;if(e.key.toLowerCase()==='a'||e.key==='.'){e.preventDefault();const view=e.key==='.'?'actions':'assistant';if(state.expanded&&state.view===view)close(true);else open(view);}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.expanded){close(true);e.stopPropagation();}});
  document.addEventListener('pointerdown',e=>{if(state.expanded&&!root.contains(e.target))close();});
  window.addEventListener('aether:notification',e=>{if(!locked()){notify(e.detail);e.preventDefault();}});
  window.addEventListener('aether:music-notice',e=>notify(e.detail));
  window.addEventListener('aether:music-activity',()=>display());
  window.addEventListener('aether:companion-reaction',e=>{expression=e.detail?.mood||'happy';expressionUntil=Date.now()+8000;});
  window.addEventListener('aether:assistant-status',e=>{state.assistant=e.detail||{};display();});
  window.addEventListener('online',()=>notify({title:'Network available',message:'Your browser reports online. Individual services may still be unavailable.'}));
  window.addEventListener('offline',()=>notify({title:'You’re offline',message:'Local tools still work. Network-dependent content may be unavailable.'}));
  // One measured RAF rate, real JS heap when exposed, and observed resource count.
  function tick(now){
    if(!rafActive)return;
    if(!started){started=now;frames=0;}else frames++;
    if(now-started>=1000){
      const fps=Math.round(frames*1000/(now-started)),mem=performance.memory;
      const heap=Number.isFinite(mem?.usedJSHeapSize)?Math.round(mem.usedJSHeapSize/1048576)+' MB heap':'Heap N/A';
      const resources=performance.getEntriesByType('resource').length;
      const el=$('top-performance-summary');if(el)el.textContent=`${fps} fps · ${heap}`;
      const button=$('top-performance');if(button)button.title=`Browser page: ${fps} measured frames/s · ${heap} · ${resources} observed resource entries (not all requests). Not device CPU or RAM.`;
      started=now;frames=0;
    }
    metricsFrame=requestAnimationFrame(tick);
  }
  function startMetrics(){if(rafActive||document.hidden)return;rafActive=true;started=0;metricsFrame=requestAnimationFrame(tick);}
  function stopMetrics(){rafActive=false;cancelAnimationFrame(metricsFrame);started=0;frames=0;}
  document.addEventListener('visibilitychange',()=>{document.documentElement.dataset.islandHidden=String(document.hidden);if(document.hidden){stopMetrics();const el=$('top-performance-summary');if(el)el.textContent='Sampling paused';}else startMetrics();});
  let wasLocked=locked();timer=setInterval(()=>{const isLocked=locked();if(isLocked&&!wasLocked){clear();state.assistant={};}wasLocked=isLocked;display();},1000);
  window.addEventListener('pagehide',()=>{stopMetrics();clearInterval(timer);clearTimeout(alertTimer);});
  window.addEventListener('pageshow',e=>{if(e.persisted){startMetrics();timer=setInterval(display,1000);}});
  let launch=null;
  function prepareLaunch(id){if(!state.expanded||locked())return;const r=toggle.getBoundingClientRect();launch={id,time:performance.now(),rect:{x:r.x,y:r.y,width:r.width,height:r.height}};close();}
  function consumeLaunchRect(id){if(!launch||launch.id!==id||performance.now()-launch.time>1500)return null;const r=launch.rect;launch=null;return r;}
  window.AetherIsland={open,close,notify,clear,startMetrics,stopMetrics,state,prepareLaunch,consumeLaunchRect};renderEvents();display();startMetrics();
})();
