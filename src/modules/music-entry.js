// Own the media window from the beginning: never silently fall back to the retired UI.
(() => {
  const os=window.os;if(!os)return;
  const state={phase:'loading',error:''};
  let timer;
  function render(){
    if(window.AetherMusic?.render){window.AetherMusic.render();return;}
    const panel=document.getElementById('media-console-panel');if(!panel)return;
    panel.replaceChildren();
    const shell=document.createElement('section');shell.className='music-startup';shell.setAttribute('role','status');
    const eyebrow=document.createElement('small');eyebrow.textContent='AETHER / LISTEN';
    const heading=document.createElement('h2');heading.textContent=state.phase==='loading'?'Opening Music & Podcasts…':state.phase==='slow'?'Music is taking longer to load':'Music & Podcasts couldn’t load';
    const description=document.createElement('p');description.textContent=state.phase==='loading'?'Loading the player, discovery feed and lyric scenes.':state.phase==='slow'?'A player dependency is still loading. You can wait or reload; your saved workspace will not be cleared.':'The current player did not start. The old Nightwave interface has not been substituted. Reload to retry; your saved workspace will not be cleared.';
    shell.append(eyebrow,heading,description);
    if(state.error){const detail=document.createElement('details'),summary=document.createElement('summary'),message=document.createElement('pre');summary.textContent='Technical details';message.textContent=state.error;detail.append(summary,message);shell.append(detail);}
    if(state.phase!=='loading'){const retry=document.createElement('button');retry.type='button';retry.textContent='Reload player';retry.onclick=()=>window.location.reload();shell.append(retry);}
    panel.append(shell);
  }
  window.AetherMusicBoot={state,render};
  os.renderMediaDashboard=render;
  render();
  timer=setTimeout(()=>{state.phase='slow';render();},20000);
  const ready=import('./music-theater.js?v=discovery-6').then(()=>{
    clearTimeout(timer);if(!window.AetherMusic?.render)throw Error('Music player did not register its renderer.');state.phase='ready';render();
  }).catch(error=>{clearTimeout(timer);state.phase='error';state.error=String(error?.message||error);render();console.error('Music player startup failed:',error);});
  window.AetherMusicBoot.ready=ready;
})();
