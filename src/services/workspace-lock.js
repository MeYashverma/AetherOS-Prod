// Local privacy curtain only. Same-origin scripts/devtools can bypass it.
// A verifier protects the stored passphrase from casual plaintext disclosure;
// it does not encrypt VFS/settings or authenticate the operating-system user.
(() => {
  const rounds=210000, encoder=new TextEncoder();
  let previousFocus=null, failures=0, blockedUntil=0, unlocking=false, migration=null;
  const background=new Map();
  let lastActivity=Date.now(), idleTimer=null, displayDark=false;
  function activity(){lastActivity=Date.now();}
  function scheduleIdle(){
    clearInterval(idleTimer);
    if(!Number(SystemState.settings.lock_idle_minutes))return;
    idleTimer=setInterval(()=>{
      if(!os.isScreenLocked && Date.now()-lastActivity>=Number(SystemState.settings.lock_idle_minutes)*60000)os.lockScreen();
    },5000);
  }
  function syncWallpaper(){
    const target=document.getElementById('lock-wallpaper');if(!target)return;
    const wallpaper=document.getElementById('lg-wallpaper'),gif=document.getElementById('gif-wallpaper');
    const image=gif&&getComputedStyle(gif).display!=='none'&&getComputedStyle(gif).backgroundImage!=='none'?getComputedStyle(gif).backgroundImage:wallpaper?getComputedStyle(wallpaper).backgroundImage:'none';
    target.style.backgroundImage=image==='none'?'url("assets/wallpapers/aurora.svg")':image;
  }
  function resetInput(){
    const input=document.getElementById('lock-pin-input');if(input){input.type='password';input.value='';}
    const reveal=document.getElementById('lock-reveal-btn');if(reveal){reveal.setAttribute('aria-pressed','false');reveal.setAttribute('aria-label','Show passphrase');}
    const caps=document.getElementById('lock-caps-warning');if(caps)caps.hidden=true;
  }
  const hex=bytes=>[...bytes].map(n=>n.toString(16).padStart(2,'0')).join('');
  const unhex=value=>Uint8Array.from(value.match(/../g)||[],s=>parseInt(s,16));
  function configured(){return Boolean(SystemState.settings.lock_verifier || SystemState.settings.lock_pin);}
  function valid(value){return value?.algorithm==='PBKDF2-SHA256' && value.iterations===rounds && /^[a-f0-9]{32}$/.test(value.salt) && /^[a-f0-9]{64}$/.test(value.hash);}
  async function derive(pass,salt){
    if(!window.crypto?.subtle)throw Error('Passphrase protection requires a secure browser context');
    const key=await crypto.subtle.importKey('raw',encoder.encode(pass),'PBKDF2',false,['deriveBits']);
    return hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:unhex(salt),iterations:rounds,hash:'SHA-256'},key,256)));
  }
  async function verifier(pass){const salt=hex(crypto.getRandomValues(new Uint8Array(16)));return {algorithm:'PBKDF2-SHA256',iterations:rounds,salt,hash:await derive(pass,salt)};}
  async function migrate(){
    const legacy=String(SystemState.settings.lock_pin||'').trim();if(!legacy)return;
    migration ||= (async()=>{SystemState.settings.lock_verifier=await verifier(legacy);SystemState.settings.lock_pin='';SystemState.saveNow?.();})();
    try{await migration;}catch(e){migration=null;throw e;}
  }
  function error(text){const el=document.getElementById('lock-pin-error');if(el)el.textContent=text;}
  function inert(node){
    if(!(node instanceof HTMLElement)||node.id==='lock-screen-overlay'||['SCRIPT','STYLE','LINK'].includes(node.tagName)||background.has(node))return;
    background.set(node,{inert:node.inert,hidden:node.getAttribute('aria-hidden')});node.inert=true;node.setAttribute('aria-hidden','true');
  }
  function restore(){for(const [node,old] of background){node.inert=old.inert;if(old.hidden===null)node.removeAttribute('aria-hidden');else node.setAttribute('aria-hidden',old.hidden);}background.clear();}
  const focusables=()=>[...document.querySelectorAll('#lock-screen-overlay button,#lock-screen-overlay input,#lock-screen-overlay summary')].filter(el=>!el.disabled&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');
  function focusLock(){const el=configured()?document.getElementById('lock-pin-input'):document.getElementById('lock-instant-btn');el?.focus();}
  window.extendOS({
    setLockPreference:(key,value)=>{
      if(key==='lock_display_name')SystemState.settings[key]=String(value||'My workspace').trim().slice(0,40)||'My workspace';
      else if(key==='lock_idle_minutes'&&[0,1,5,15,30].includes(Number(value)))SystemState.settings[key]=Number(value);
      else if(key==='lock_when_hidden')SystemState.settings[key]=Boolean(value);
      else return;
      activity();scheduleIdle();SystemState.saveNow?.();
    },
    toggleLockPassphraseVisibility:()=>{
      const input=document.getElementById('lock-pin-input'),button=document.getElementById('lock-reveal-btn');if(!input)return;
      const reveal=input.type==='password';input.type=reveal?'text':'password';button?.setAttribute('aria-pressed',String(reveal));button?.setAttribute('aria-label',reveal?'Hide passphrase':'Show passphrase');input.focus();
    },
    blankLockDisplay:()=>{if(!os.isScreenLocked)return;displayDark=true;const wake=document.getElementById('lock-wake-display');if(wake){wake.hidden=false;wake.focus();}},
    wakeLockDisplay:()=>{displayDark=false;const wake=document.getElementById('lock-wake-display');if(wake)wake.hidden=true;focusLock();},
    setLockPassphrase:async value=>{
      const status=document.getElementById('lock-setting-status'), input=document.getElementById('lock-setting-input');
      try{
        const pass=String(value||'');
        if(pass.length<6||pass.length>128)throw Error('Use a passphrase of 6–128 characters');
        const result=await verifier(pass);SystemState.settings.lock_verifier=result;SystemState.settings.lock_pin='';SystemState.saveNow?.();
        if(input)input.value='';if(status)status.textContent='Passphrase verifier saved locally. This does not encrypt your files.';
      }catch(e){if(status)status.textContent=e.message;}
    },
    clearLockPassphrase:()=>{
      if(configured()&&!window.confirm('Remove the local workspace passphrase? This does not change your device password.'))return;
      SystemState.settings.lock_verifier=null;SystemState.settings.lock_pin='';SystemState.saveNow?.();
      const status=document.getElementById('lock-setting-status');if(status)status.textContent='Passphrase removed. The privacy curtain can be resumed without a passphrase.';
    },
    lockScreen:()=>{
      const el=document.getElementById('lock-screen-overlay');if(!el||os.isScreenLocked)return;
      window.AetherAppDetails?.close();
      previousFocus=document.activeElement;
      os.closeTopBarMenus?.();os.toggleMissionControl?.(false);os.toggleMobileUtilityPanel?.(false);
      const finder=document.getElementById('finder-overlay');if(finder?.classList.contains('finder-open'))os.toggleFinder();
      SystemState.saveNow?.();
      os.isScreenLocked=true;el.style.display='flex';el.setAttribute('aria-hidden','false');syncWallpaper();resetInput();
      const title=document.getElementById('lock-title');if(title)title.textContent=SystemState.settings.lock_display_name||'My workspace';
      for(const node of document.body.children)inert(node);
      const has=configured(),wrap=document.getElementById('lock-pin-wrap'),instant=document.getElementById('lock-instant-btn');
      if(wrap)wrap.style.display=has?'flex':'none';if(instant)instant.style.display=has?'none':'inline-flex';
      const input=document.getElementById('lock-pin-input');if(input)input.value='';error('');os._updateLockScreenClock();focusLock();
      if(SystemState.settings.lock_pin)migrate().catch(()=>error('Legacy passphrase migration unavailable. Use a secure browser context; your existing PIN is retained.'));
    },
    unlockScreen:async()=>{
      if(!os.isScreenLocked||unlocking)return false;
      if(Date.now()<blockedUntil){error(`Too many attempts. Try again in ${Math.ceil((blockedUntil-Date.now())/1000)} seconds.`);return false;}
      unlocking=true;const submit=document.getElementById('lock-submit-btn');if(submit)submit.disabled=true;
      try{
        if(configured()){
          await migrate();const saved=SystemState.settings.lock_verifier;
          if(!valid(saved))throw Error('Stored verifier is invalid. Workspace data remains accessible to this browser; restore settings from a trusted backup.');
          const input=document.getElementById('lock-pin-input'),candidate=await derive(input?.value||'',saved.salt);
          let difference=0;for(let i=0;i<candidate.length;i++)difference|=candidate.charCodeAt(i)^saved.hash.charCodeAt(i);
          if(difference){failures++;if(failures>=5){blockedUntil=Date.now()+30000;failures=0;}error(blockedUntil>Date.now()?'Too many attempts. Wait 30 seconds.':'Passphrase did not match. Try again.');if(input){input.value='';input.focus();}return false;}
        }
        failures=0;blockedUntil=0;os.isScreenLocked=false;
        const el=document.getElementById('lock-screen-overlay');if(el){el.style.display='none';el.setAttribute('aria-hidden','true');}
        resetInput();os.wakeLockDisplay();activity();restore();
        if(previousFocus?.isConnected)previousFocus.focus();return true;
      }catch(e){error(e.message);return false;}
      finally{unlocking=false;if(submit)submit.disabled=false;}
    },
    _updateLockScreenClock:()=>{
      const now=new Date(),time=document.getElementById('lock-clock-time'),date=document.getElementById('lock-clock-date'),meta=document.getElementById('lock-status-meta');
      if(time){
        const parts=new Intl.DateTimeFormat([],{hour:'numeric',minute:'2-digit'}).formatToParts(now);
        time.textContent=parts.filter(p=>p.type!=='dayPeriod').map(p=>p.value).join('').trim();
        const period=parts.find(p=>p.type==='dayPeriod');if(period){const small=document.createElement('small');small.textContent=period.value;time.appendChild(small);}
        time.dateTime=now.toISOString();
      }
      if(date)date.textContent=now.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'});
      const network=document.getElementById('lock-connection-status');if(network)network.textContent=navigator.onLine?'':'Offline';
      if(meta)meta.textContent=`Workspace ${Number(SystemState.settings.active_space)||1} · ${Object.values(SystemState.windows).filter(w=>w.isOpen).length} open windows`;
    }
  });
  // Capture before existing global shortcuts; only the modal can receive input.
  document.addEventListener('keydown',e=>{
    if(!os.isScreenLocked)return;
    e.stopImmediatePropagation();
    if(displayDark){e.preventDefault();os.wakeLockDisplay();return;}
    const caps=document.getElementById('lock-caps-warning');if(caps)caps.hidden=!e.getModifierState?.('CapsLock');
    if(e.key==='Tab'){
      const items=focusables(),index=items.indexOf(document.activeElement),next=items[(index+(e.shiftKey?-1:1)+items.length)%items.length];
      e.preventDefault();next?.focus();
    }else if(e.key==='Enter' && !e.target.matches?.('button,summary')){e.preventDefault();os.unlockScreen();}
    else if(!e.target.closest?.('#lock-screen-overlay')){e.preventDefault();focusLock();}
  },true);
  document.addEventListener('focusin',e=>{if(os.isScreenLocked&&!e.target.closest?.('#lock-screen-overlay'))focusLock();},true);
  new MutationObserver(records=>{if(os.isScreenLocked)for(const record of records)for(const node of record.addedNodes)inert(node);}).observe(document.body,{childList:true});
  document.addEventListener('DOMContentLoaded',()=>{if(SystemState.settings.lock_pin)migrate().catch(()=>{});},{once:true});
  for(const event of ['pointerdown','pointermove','keydown','touchstart','wheel'])document.addEventListener(event,activity,{passive:true,capture:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden && SystemState.settings.lock_when_hidden)os.lockScreen();});
  document.addEventListener('DOMContentLoaded',scheduleIdle,{once:true});
  window.AetherWorkspaceLock={configured,valid,verifier,derive};
})();
