// Consistent, source-backed capability help for all registered windows.
(() => {
  const esc=window.escapeAetherHtml|| (s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
  let manifest=null, dialog=null, previousFocus=null, request=0;
  const labels={local:'Local browser tool',network:'Network service client',hybrid:'Local + network features',embed:'Third-party embedded app'};
  function close(){request++;if(dialog){dialog.close();dialog.remove();dialog=null;}if(previousFocus?.isConnected)previousFocus.focus();}
  function externalFrames(id){
    return [...document.querySelectorAll(`#win-${id} iframe[src]`)].flatMap(frame=>{
      try{const url=new URL(frame.src);return url.protocol==='https:'?[{url:url.href,host:url.hostname}]:[];}catch{return [];}
    }).filter((x,i,all)=>all.findIndex(y=>y.url===x.url)===i);
  }
  async function show(id){
    if(os.isScreenLocked || !Object.hasOwn(window.AETHER_MODULE_REGISTRY||{},id))return;
    close();previousFocus=document.activeElement;const turn=++request;
    dialog=document.createElement('dialog');dialog.className='app-details-dialog';dialog.setAttribute('aria-labelledby','app-details-title');
    dialog.innerHTML='<p role="status">Loading app details…</p><button type="button" data-app-details-close>Close</button>';
    document.body.appendChild(dialog);dialog.showModal();dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
    dialog.addEventListener('click',e=>{if(e.target.closest('[data-app-details-close]'))close();});
    try{
      if(!manifest){const response=await fetch('assets/app-audit.json');if(!response.ok)throw Error('Inventory unavailable');manifest=await response.json();}
      if(turn!==request||!dialog)return;
      const app=manifest.apps.find(a=>a.id===id);if(!app)throw Error('App review not available');
      const frames=externalFrames(id),networked=app.mode!=='local';
      dialog.innerHTML=`<header><div>${window.AetherDesign?.appIcon(id,44)||''}<div><span class="app-details-eyebrow">${esc(labels[app.mode]||app.mode)}</span><h2 id="app-details-title">${esc(app.label)}</h2></div></div><button type="button" data-app-details-close aria-label="Close app details">×</button></header><section><h3>What this app actually does</h3><p>${esc(app.mechanism)}</p><h3>Limits & data boundaries</h3><p>${esc(app.limitations)}</p>${networked?`<p class="app-details-network">${navigator.onLine?'Your browser reports online. This does not confirm provider availability.':'Your browser reports offline. Remote content may not be available.'}</p>`:'<p class="app-details-network">Runs locally in this browser. Export important data; browser storage is not a backup.</p>'}${frames.length?`<h3>Having trouble with the embed?</h3><p>Third-party sites may refuse framing or require sign-in. Try their own site; this opens a separate tab.</p><div class="app-details-links">${frames.map(f=>`<a href="${esc(f.url)}" target="_blank" rel="noopener noreferrer">Open ${esc(f.host)} ↗</a>`).join('')}</div>`:''}</section><footer><a href="https://github.com/MeYashverma/AetherOS-Prod/blob/main/${esc(app.file)}" target="_blank" rel="noopener noreferrer">View implementation ↗</a><button type="button" data-app-details-close>Back to app</button></footer>`;
      dialog.querySelector('[data-app-details-close]')?.focus();
    }catch(error){if(turn===request&&dialog){dialog.firstElementChild.textContent=error.message;}}
  }
  window.AetherAppDetails={show,close};
})();
