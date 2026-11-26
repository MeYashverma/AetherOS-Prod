// About is a live inventory, not a pretend hardware specification sheet.
(() => {
  const repo='https://github.com/MeYashverma/AetherOS-Prod';
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const link=(url,text)=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(text)} ↗</a>`;
  let manifest=null,metadata=null,query='',active='overview',ticket=0;
  const tabs={overview:'Overview',creator:'About me',architecture:'Architecture',features:'App guide',metrics:'This browser',roadmap:'Changelog',credits:'Sources & limits'};
  const safeCommit=c=>{
    const sha=c?.sha,date=c?.date || c?.commit?.committer?.date,title=c?.title || c?.commit?.message?.split('\n')[0];
    return /^[a-f0-9]{40}$/.test(sha) && Number.isFinite(Date.parse(date)) && typeof title==='string' ? {sha,date,title:title.slice(0,300),url:`${repo}/commit/${sha}`} : null;
  };
  async function inventory(){
    const [audit,build]=await Promise.all([
      manifest?Promise.resolve(manifest):fetch('assets/app-audit.json').then(r=>{if(!r.ok)throw Error('App inventory unavailable');return r.json();}),
      metadata?Promise.resolve(metadata):fetch('assets/project-metadata.json').then(r=>{if(!r.ok)throw Error('Build metadata unavailable');return r.json();})
    ]);
    if(!Array.isArray(audit.apps)||audit.schemaVersion!==1||build.schemaVersion!==1)throw Error('Unsupported project metadata');
    manifest=audit;metadata=build;return {audit,build};
  }
  const heading=(eyebrow,title,body)=>`<header class="about-heading"><span>${esc(eyebrow)}</span><h1>${esc(title)}</h1><p>${esc(body)}</p></header>`;
  const card=(title,body)=>`<section class="about-card"><h2>${esc(title)}</h2>${body}</section>`;
  function appGuide(){
    const registry=window.AETHER_MODULE_REGISTRY||{};
    const rows=manifest.apps.filter(a=>registry[a.id]&&`${a.label} ${a.id} ${a.mode} ${a.mechanism} ${a.limitations}`.toLowerCase().includes(query));
    return heading('Source-backed inventory',`${Object.keys(registry).length} apps. Different capabilities.`, 'Local tools, API clients and third-party embeds are labelled separately. Source-reviewed does not mean every external service is currently reachable.')+
      `<p role="status">${rows.length} matching apps · use the sidebar search to filter</p><div class="about-app-grid">`+rows.map(a=>`<article class="about-card" data-app-review="${esc(a.id)}"><div class="about-app-title">${window.AetherDesign?.appIcon(a.id,28)||''}<h2>${esc(a.label)}</h2><span class="about-badge">${esc(a.mode)}</span></div><p>${esc(a.mechanism)}</p><p class="about-limit">${esc(a.limitations)}</p><div class="about-links">${link(`${repo}/blob/main/${a.file}`,'Implementation')}<button type="button" class="os-btn" data-about-launch="${esc(a.id)}">${os.isModuleEnabled?.(a.id)===false?'Enable in Settings':'Open app'}</button></div></article>`).join('')+'</div>';
  }
  function render(tab){
    const count=Object.keys(window.AETHER_MODULE_REGISTRY||{}).length;
    if(tab==='overview')return heading('AetherOS · browser-native workspace','A place for useful experiments.','A modular JavaScript desktop by Yash Verma. It runs inside your browser—not as an operating-system kernel, a secure VM or a replacement for your device’s login screen.')+
      `<div class="about-stat-grid"><div><b>${count}</b><span>registered apps</span></div><div><b>${Object.values(SystemState.windows).filter(w=>w.isOpen).length}</b><span>open windows</span></div><div><b>${esc(metadata.revision.slice(0,7))}</b><span>bundled source snapshot</span></div></div>`+
      card('Built to connect tools, not pretend to be hardware','<p>Local editors, browser storage, WebAudio and WebGL share a window manager with API-driven explorers and embedded creative tools. Unsupported browser metrics are reported as unavailable.</p>')+
      card('Know where your data lives','<p>Preferences live in localStorage; Files use IndexedDB with a session-only fallback. Third-party requests, embeds, optional AI downloads and wallpaper providers have their own availability and privacy boundaries. Export important files and backups.</p>')+
      `<div class="about-links">${link(repo,'Source repository')}${link('docs/app-audit.md','App-by-app audit')}<button class="os-btn" data-about-tab="creator">Meet the creator</button></div>`;
    if(tab==='creator')return `<article class="creator-editorial">
      <header class="creator-masthead"><span>01 / THE PERSON BEHIND THE PIXELS</span><a href="https://meyashverma.github.io/yashverma-dev/" target="_blank" rel="noopener noreferrer">My corner of the internet ↗</a></header>
      <div class="creator-intro"><div><span class="creator-kicker">Hi, I'm Yash Verma.</span><h1>I build systems<br>that <em>shouldn’t</em><br>exist on free infra.</h1><p class="creator-deck">Systems, widgets &amp; weird automation.</p></div><figure class="creator-portrait"><div class="creator-portrait-frame"><img src="assets/creator/yash-halftone-cutout.webp" alt="Lime-green halftone portrait of Yash Verma" width="720" height="964" decoding="async"></div><figcaption><span>YASH VERMA</span><span>ENGINEERING × DESIGN</span></figcaption></figure></div>
      <div class="creator-essay"><span class="creator-margin">A LITTLE ABOUT ME</span><div><p class="creator-lead">I'm originally from Churu, Rajasthan. Most days, I'm balancing work, studies, and an ever-growing list of side projects that seemed like a good idea at 2 AM.</p><p>I work as a GRC Analyst at HCLTech and I'm pursuing Design &amp; Computing at BITS Pilani. Outside those titles, I'm someone who loves understanding how things work—and imagining how they could work better.</p><p>I turn GitHub Actions into workers, wire APIs together until they misbehave less, and build Discord widgets, real-time data pipelines and browser experiments. Constraints are part of the design, not something to hide behind a loading animation.</p><p>Music is a huge part of my life. So are internet rabbit holes: cybersecurity, AI, space missions, aviation, operating systems, and whatever strange API I discovered five minutes ago.</p><p>Apple, Stripe, Linear and Vercel influence how I think about software: simple on the surface, powerful underneath, and designed with intention.</p><p class="creator-signoff">And sometimes, I spend far too much time trying to make a browser tab behave like an operating system.<br><span>— Yash</span></p></div></div>
      <div class="creator-project-strip"><span>THINGS I MAKE</span>${link('https://github.com/MeYashverma','Widgets & experiments')}${link(repo,'AetherOS')}${link('https://meyashverma.github.io/yashverma-dev/#work','Selected work')}</div>
      <footer class="creator-footer">${link('https://meyashverma.github.io/yashverma-dev/','Read my full story')}${link('https://github.com/MeYashverma/yashverma-dev','Portfolio source')}<small>Adapted from my portfolio; role and study details reflect that source.</small></footer>
    </article>`;
    if(tab==='architecture')return heading('Implementation, not a fictional stack','How this workspace actually fits together.','Classic scripts extend a shared os object; ES modules power the music subsystem. This is not process isolation.')+
      `<ol class="about-architecture">${[
        ['1 · Shell & lifecycle','src/engines/window-manager.js','Window DOM, focus, bounds, Dock state and per-app cleanup. GSAP handles animation/dragging; virtual spaces group windows.'],
        ['2 · State & files','src/core/system-state.js','A single module registry and persisted settings. src/services/vfs-and-backup.js owns IndexedDB files and explicit session-only fallback.'],
        ['3 · App implementations','src/modules/','Local WebAudio/canvas tools, REST clients and external iframe applications. App guide identifies which is which.'],
        ['4 · Media modules','src/modules/music-theater.js','Player adapters, lyrics, reaction rendering and seek lifecycle. Fictional listener reactions are presentation, not other real users.'],
        ['5 · Materials & accessibility','styles/system-glass.css','Shared surface tokens and scoped structural transparency, plus focus, reduced-motion and reduced-transparency fallbacks.'],
        ['6 · Delivery & optional server','sw.js','Network-first same-origin shell with offline cache fallback. scripts/serve.py supplies optional fixed-host wallpaper adapters; static hosting cannot supply secret-backed API routes.']
      ].map(([title,path,text])=>`<li>${card(title,`<code>${link(`${repo}/blob/main/${path}`,path)}</code><p>${esc(text)}</p>`)}</li>`).join('')}</ol>`;
    if(tab==='features')return appGuide();
    if(tab==='metrics'){
      const mem=performance.memory;
      const stats=[['Registered modules',count],['Logical processors reported',navigator.hardwareConcurrency||'Unavailable'],['Approximate device memory',navigator.deviceMemory?`${navigator.deviceMemory} GB (rounded browser hint)`:'Unavailable'],['JS heap, whole page',mem?`${(mem.usedJSHeapSize/1048576).toFixed(1)} MB`:'Unavailable in this browser'],['Page uptime',`${Math.floor(performance.now()/60000)} minutes`],['Viewport',`${innerWidth} × ${innerHeight} CSS pixels`],['Browser reports network',navigator.onLine?'Online (not a reachability test)':'Offline'],['VFS write status',window.AetherVFS?.storageStatus?.mode||'Not yet written'],['Secure context',window.isSecureContext?'Yes':'No'],['Bundled revision',metadata.revision.slice(0,12)]];
      return heading('Observed capabilities','This browser, right now.','Snapshot taken when this view opens. Device-memory hints are rounded; the page cannot report host CPU usage, real installed RAM, or per-app process memory.')+`<dl class="about-observations">${stats.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><button class="os-btn" data-about-tab="metrics">Refresh snapshot</button>`;
    }
    if(tab==='roadmap')return heading('Automatic project history','What actually changed.','Commit subjects and dates from this repository—not a hand-written release timeline or a claim that each commit is deployed.')+'<p id="about-history-status" role="status">Bundled Git snapshot · checking GitHub for newer main-branch commits…</p><div id="about-history"></div><button class="os-btn" id="about-history-refresh">Check GitHub again</button>';
    return heading('Attribution & boundaries','Built on real open-source work.','AetherOS is independent software. It is not macOS or an Apple product; visual inspiration is not an affiliation.')+
      card('Libraries & artwork',`<p>GSAP, Three.js, Lucide and the vendored music subsystem support the UI. Microsoft Fluent Color icons are vendored with their MIT notice and provenance. Embedded tools—including Photopea, Webamp and Excalidraw—retain their own ownership and terms.</p><div class="about-links">${link(`${repo}/tree/main/assets/app-icons`,'Icon licenses & provenance')}${link(`${repo}/tree/main/src/vendor`,'Vendored source')}</div>`)+
      card('Limits worth knowing','<p>The workspace lock is a local privacy curtain, not device authentication or encrypted storage. API data can be delayed, rate-limited or unavailable. Procedural skies, soundscapes, visualizations and game simulations are creative content, not sensor measurements.</p><p>Client-side API keys and exported backups should be treated as sensitive. A service worker can cache files, but cannot make cross-origin services work offline.</p>');
  }
  function historyList(records, status){
    const host=document.getElementById('about-history');if(!host)return;
    const commits=records.map(safeCommit).filter(Boolean).slice(0,30);
    host.innerHTML=commits.length?`<ol class="about-history-list">${commits.map(c=>`<li><time datetime="${esc(c.date)}">${esc(new Date(c.date).toLocaleDateString())}</time><div>${link(c.url,c.title)}<code>${c.sha.slice(0,7)}</code></div></li>`).join('')}</ol>`:'<p>No verified commit history available.</p>';
    const label=document.getElementById('about-history-status');if(label)label.textContent=status;
  }
  async function history(force=false){
    const turn=ticket,key='aether.repo-history.v1';let saved;
    try{saved=JSON.parse(localStorage.getItem(key));}catch{}
    const usable=Array.isArray(saved?.commits)&&Number.isFinite(saved.time)&&Date.now()-saved.time<24*3600000;
    historyList(usable?saved.commits:metadata.commits||[],usable?'Cached GitHub history · checking freshness':'Bundled Git snapshot · checking GitHub');
    if(!force&&usable&&Date.now()-saved.time<15*60000){historyList(saved.commits,`GitHub history cached at ${new Date(saved.time).toLocaleString()}`);return;}
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);
    try{
      const response=await fetch('https://api.github.com/repos/MeYashverma/AetherOS-Prod/commits?sha=main&per_page=30',{signal:controller.signal,credentials:'omit',headers:{Accept:'application/vnd.github+json'}});
      if(!response.ok)throw Error(`GitHub HTTP ${response.status}`);
      const body=await response.json();if(!Array.isArray(body))throw Error('Unexpected history response');
      const commits=body.map(safeCommit).filter(Boolean);if(!commits.length)throw Error('No valid commits');
      const value={time:Date.now(),commits};try{localStorage.setItem(key,JSON.stringify(value));}catch{}
      if(turn===ticket&&active==='roadmap')historyList(commits,`GitHub main · checked ${new Date().toLocaleTimeString()}`);
    }catch(error){if(turn===ticket&&active==='roadmap')historyList(usable?saved.commits:metadata.commits||[],`${error.message}. Showing ${usable?'cached GitHub history':'bundled Git snapshot'}; freshness not guaranteed.`);}
    finally{clearTimeout(timer);}
  }
  async function show(tab='overview'){
    if(!Object.hasOwn(tabs,tab))tab='overview'; active=tab;const turn=++ticket;
    const host=document.getElementById('about-panel-content');if(!host)return;
    document.querySelectorAll('.about-tab').forEach(b=>{const selected=b.id==='tab-about-'+tab;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
    host.setAttribute('aria-busy','true');host.innerHTML='<p role="status">Loading project inventory…</p>';
    try{await inventory();if(turn!==ticket||!host.isConnected)return;host.innerHTML=render(tab);if(tab==='roadmap')history();}
    catch(error){if(turn===ticket)host.textContent=error.message+' · Open the repository for project details.';}
    finally{if(turn===ticket)host.setAttribute('aria-busy','false');}
  }
  function search(value){query=String(value||'').trim().toLowerCase().slice(0,160);show('features');}
  function showApp(id){os.openWindow('about');const input=document.getElementById('about-search-input');if(input)input.value=id;search(id);}
  document.addEventListener('click',e=>{
    const tab=e.target.closest('[data-about-tab]');if(tab)show(tab.dataset.aboutTab);
    const launch=e.target.closest('[data-about-launch]');if(launch){const id=launch.dataset.aboutLaunch;if(os.isModuleEnabled?.(id)===false)os.openSettingsSection('modules');else os.openWindow(id);}
    if(e.target.closest('#about-history-refresh'))history(true);
  });
  window.AetherAbout={show,search,showApp,safeCommit};
})();
