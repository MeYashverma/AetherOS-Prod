// Compact workspaces for the remaining app fleet. No availability inference from
// navigator.onLine or iframe load: remote editors keep their own content surface.
(() => {
  const profiles = {
    settings: ['system', 'Preferences stay in this browser. Keep backups of important settings.'],
    about: ['system', 'Project guide, creator profile and source-backed build information.'],
    wikiboard: ['canvas', 'Research canvas · Wikipedia requests run only for the cards you add.'],
    media: ['audio', 'Audio playback requires your interaction; availability depends on the source.'],
    stickers: ['library', 'Search external media · Check the source licence before reuse.'],
    radiobrowser: ['audio', 'Radio Browser directory · Streams can be offline or blocked by the broadcaster.'],
    sysmon: ['system', 'Browser-page measurements, not whole-device CPU or memory usage.'],
    chiptune: ['embed', 'External creative studio · Save your project inside the selected editor.'],
    earthpulse: ['map', 'USGS / NASA observations · Not an emergency warning service.'],
    stellarium: ['embed', 'NASA Eyes / Stellarium · Remote 3D viewers may require WebGL and allow framing.'],
    georadar: ['map', 'OpenStreetMap / Wikipedia · Geographic context, not live surveillance.'],
    worldfactbook: ['library', 'REST Countries / World Bank · Reference statistics have different reporting years.'],
    wayback: ['embed', 'Internet Archive · A closest snapshot may differ from the requested date.'],
    winamp: ['audio', 'SomaFM / Webamp · Unknown listener and track metadata are not estimates.'],
    aetherbridge: ['network', 'Transfers require the signaling service and a reachable peer; keep this window open.'],
    aetherlink: ['network', 'Peer connection state, not room creation, confirms connectivity.'],
    presence: ['network', 'Lanyard public presence · Webhook URLs are secrets; do not share them.'],
    iss: ['map', 'WhereTheISS observations · A missing trajectory is not replaced by a simulated orbit.'],
    nasa: ['library', 'NASA imagery · API limits and image availability depend on NASA.'],
    globe: ['map', 'ADS-B coverage is incomplete. This is not an air-traffic control instrument.'],
    market: ['chart', 'Provider market candles · Informational only, not trading advice.'],
    games: ['embed', 'External games · Their own storage, cookies and keyboard controls apply.'],
    ytchtv: ['embed', 'Video providers may restrict playback, embeds, regions or sign-in.'],
    memes: ['library', 'Reddit image feeds · Content belongs to its original creators.'],
    anime: ['library', 'Jikan / MyAnimeList · Select a result to view details; trailers use external playback.'],
    manga: ['library', 'Jikan / MangaDex · Chapter availability and licensing vary by title.'],
    entityscanner: ['library', 'Character API reference · Battles are a randomized local mini-game, not canon.'],
    floor796: ['embed', 'External panorama · Open the source site if the embedded viewer is blocked.'],
    wplace: ['embed', 'External collaborative canvas · Access and editing are controlled by the source site.']
  };
  const sources = {
    chiptune:'https://www.beepbox.co/', stellarium:'https://stellarium-web.org/', earthpulse:'https://earthquake.usgs.gov/',
    georadar:'https://www.openstreetmap.org/', worldfactbook:'https://data.worldbank.org/', wayback:'https://archive.org/',
    winamp:'https://somafm.com/', radiobrowser:'https://www.radio-browser.info/', iss:'https://wheretheiss.at/',
    nasa:'https://apod.nasa.gov/', anime:'https://myanimelist.net/', manga:'https://mangadex.org/',
    floor796:'https://floor796.com/', wplace:'https://wplace.live/', games:'https://itch.io/games/html5',ytchtv:'https://www.youtube.com/'
  };
  const exportLabels = {wikiboard:'Export board', radiobrowser:'Export favorites', earthpulse:'Export observations',worldfactbook:'Export country',winamp:'Export directory',sysmon:'Export report',market:'Export candles',entityscanner:'Export character',manga:'Export reading list'};
  const fields = (value,keys) => Object.fromEntries(keys.filter(key=>value?.[key]!==undefined).map(key=>[key,value[key]]));
  function snapshot(id) {
    const os=window.os;
    switch(id){
      case 'wikiboard': {
        const board=os.wikiboard?.engine;
        if(!board)throw Error('Board is not initialized.');
        return {v:2,pan:board.pan,zoom:board.zoom,nextId:board.nextId,connections:board.connections,cards:[...board.cards.values()].map(card=>fields(card,['id','type','x','y','width','height','title','data','parentId','minimized']))};
      }
      case 'radiobrowser': os.loadRadioFavorites();return os._radioFavorites;
      case 'earthpulse': return {mode:os.epState.mode,error:os.epState.error||null,events:os.epState.events};
      case 'worldfactbook': {const c=os.wfbState.all.find(c=>c.cca3===os.wfbState.selectedCca3);if(!c)throw Error('No country loaded.');return {country:c,fxDate:os.wfbState.fxDate||null,fx:os.wfbState.fx};}
      case 'winamp': return os.winampState.channels;
      case 'sysmon': if(!os.sysmonTelemetry?.lastReport)throw Error('Wait for a measurement.');return os.sysmonTelemetry.lastReport;
      case 'market': return {candles:os.marketData||[],note:'Provider data currently loaded in this session; not a complete history.'};
      case 'entityscanner': if(!os.entityscanner.currentEntity)throw Error('Select a character first.');return os.entityscanner.currentEntity;
      case 'manga': return JSON.parse(localStorage.getItem('AetherOS_Manga_List')||'[]');
      default: throw Error('No export is available.');
    }
  }
  function download(id){
    const data=snapshot(id);
    if(data==null)throw Error('No data loaded yet.');
    const blob=new Blob([JSON.stringify(id==='wikiboard'?data:{app:id,exportedAt:new Date().toISOString(),data},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`aether-${id}-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function sourceURL(el,id){
    for(const frame of el.querySelectorAll('iframe[src]')){
      try {const url=new URL(frame.src);if(url.protocol==='https:'&&!url.username&&!url.password)return url.href;}catch{}
    }
    return sources[id]||null;
  }
  function mount(el,id){
    if(!profiles[id]||el.querySelector('.fleet-tools'))return;
    const body=el.children[1];if(!body)return;
    el.dataset.workspace=id;el.dataset.workspaceKind=profiles[id][0];
    body.classList.add('fleet-workspace');
    const bar=document.createElement('nav');bar.className='fleet-tools';bar.setAttribute('aria-label','Workspace tools');
    const note=document.createElement('span');note.className='fleet-note';note.textContent=profiles[id][1];note.title=profiles[id][1];bar.append(note);
    const announce=document.createElement('span');announce.className='fleet-announcement';announce.setAttribute('role','status');
    function button(label,action){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>{try{action(b);}catch(error){announce.textContent=error.message;}});bar.append(b);return b;}
    if(exportLabels[id])button(exportLabels[id],()=>{download(id);announce.textContent='JSON download requested.';});
    if(sources[id])button('Source ↗',()=>{const url=sourceURL(el,id);if(url)window.open(url,'_blank','noopener,noreferrer');});
    if(profiles[id][0]==='embed'){
      button('Reload viewer',()=>{const frames=[...el.querySelectorAll('iframe')].filter(f=>/^https:\/\//.test(f.src));if(!frames.length)throw Error('Choose a viewer first.');frames.forEach(f=>{f.src=f.src;});announce.textContent='Reload requested. Provider availability is not verified.';});
      button('Stop',()=>{el.querySelectorAll('iframe').forEach(f=>{if(/^https:\/\//.test(f.src)){f.dataset.resumeURL=f.src;f.src='about:blank';}});announce.textContent='Embedded content stopped. Choose a viewer or use Resume.';});
      button('Resume',()=>{[...el.querySelectorAll('iframe')].filter(f=>f.dataset.resumeURL).forEach(f=>{f.src=f.dataset.resumeURL;delete f.dataset.resumeURL;});announce.textContent='Viewer request resumed.';});
    }
    button('Details',()=>window.AetherAppDetails?.show(id));
    bar.append(announce);body.prepend(bar);
    bar.addEventListener('click',()=>{clearTimeout(bar._noticeTimer);bar._noticeTimer=setTimeout(()=>{announce.textContent='';},6000);});
  }
  window.AetherFleetWorkspaces={mount,profiles,snapshot,sourceURL};
})();
