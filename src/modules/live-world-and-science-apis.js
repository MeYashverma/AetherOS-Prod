// AetherOS — Live World, Spaceflight, Culture & Literature Public-API Native Suite:
// 1. World Museum Gallery (Art Institute of Chicago IIIF API + Desktop Wallpaper & Photopea Bridge)
// 2. Orbital Launch Control (The Space Devs Launch Library 2 Rocket Countdowns + Live Astronauts in Space)
// 3. World Factbook & FX Atlas (REST Countries v3.1 + World Bank GDP API + Frankfurter ECB Live FX)
// 4. Open Bookshelf E-Reader (Gutendex 70,000+ Project Gutenberg Books API + Built-in Sepia/OLED Reader)
(function () {
    const esc = (v) => String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    window.WindowContents = window.WindowContents || {};

    // ═══════════════════════════════════════════════════════════════════════
    //  1. WORLD MUSEUM GALLERY (worldmuseums — Art Institute IIIF API)
    // ═══════════════════════════════════════════════════════════════════════
    window.WindowContents.worldmuseums = `
      <div id="wm-root" class="discovery-studio museum-studio">
        <form class="discovery-toolbar" onsubmit="event.preventDefault();os.wmSearch(document.getElementById('wm-query').value)"><input id="wm-query" aria-label="Search museum artworks or artists" placeholder="Search museum online…" maxlength="200"><button type="submit" class="os-btn">Search</button><select aria-label="Explore museum collection" onchange="if(this.value)os.wmSearch(this.value);this.value=''"><option value="">Explore…</option><option value="hokusai">Ukiyo-e</option><option value="monet">Impressionism</option><option value="armor">Armour</option><option value="nocturne">Nocturnes</option></select><button type="button" class="os-btn" onclick="os.wmUseIncluded()">Included art</button><button type="button" class="os-btn" id="wm-saved-btn" aria-pressed="false" onclick="os.wmShowSaved()">My collection</button><button type="button" class="os-btn" onclick="os.wmExportCollection()">Export links</button><button type="button" class="os-btn" onclick="os.wmRetryImages()">Retry images</button><div class="discovery-pages"><button type="button" id="wm-prev" class="os-btn" aria-label="Previous artwork page" onclick="os.wmPage(-1)">←</button><span id="wm-page-label">1</span><button type="button" id="wm-next" class="os-btn" aria-label="Next artwork page" onclick="os.wmPage(1)">→</button></div></form>
        <div class="museum-workspace"><section id="wm-grid" class="museum-grid" tabindex="0" aria-label="Artwork results"></section><section id="wm-inspector" class="museum-inspector" aria-label="Selected artwork"></section></div>
        <footer class="discovery-status"><span id="wm-status" role="status">Art Institute of Chicago · images remain online</span><a href="https://www.artic.edu/collection" target="_blank" rel="noopener noreferrer">Museum collection ↗</a></footer>
      </div>
    `;

    // ═══════════════════════════════════════════════════════════════════════
    //  2. ORBITAL LAUNCH & ASTRONAUT CONTROL (spacexhub — Launch Library 2 API)
    // ═══════════════════════════════════════════════════════════════════════
    window.WindowContents.spacexhub = `
      <div id="sxh-root" class="discovery-studio launch-studio">
        <div class="discovery-toolbar"><div class="launch-tabs"><button type="button" class="os-btn" data-sxh-tab="launches" aria-pressed="true" onclick="os.sxhSetTab('launches')">Launch schedule</button><button type="button" class="os-btn" data-sxh-tab="astronauts" aria-pressed="false" onclick="os.sxhSetTab('astronauts')">In-space crew</button></div><button type="button" class="os-btn" onclick="os.sxhRefresh()">Refresh</button><select id="sxh-timezone" aria-label="Launch time zone" onchange="os.sxhState.utc=this.value==='utc';os.sxhRenderLaunches()"><option value="local">Local time</option><option value="utc">UTC</option></select><span id="sxh-countdown-pill" class="launch-toolbar-note">Times are estimates, not flight telemetry</span></div>
        <div id="sxh-pane-launches" class="launch-workspace"><section id="sxh-launch-list" class="launch-list" tabindex="0" aria-label="Upcoming launches"></section><section id="sxh-launch-detail" class="launch-detail" aria-label="Selected mission"></section></div>
        <section id="sxh-pane-astronauts" class="launch-crew" aria-label="Astronauts reported in space" hidden></section>
        <footer class="discovery-status"><span id="sxh-status" role="status">Launch Library 2 · schedule changes are common</span><a href="https://thespacedevs.com/llapi" target="_blank" rel="noopener noreferrer">Provider ↗</a></footer>
      </div>
    `;

    // ═══════════════════════════════════════════════════════════════════════
    //  3. WORLD FACTBOOK, GDP & LIVE FX ATLAS (worldfactbook)
    // ═══════════════════════════════════════════════════════════════════════
    window.WindowContents.worldfactbook = `
        <div class="h-full flex flex-col bg-[#060910] text-white text-xs select-none overflow-hidden" id="wfb-root">
            <div class="p-3 bg-black/55 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-1.5">
                    <select id="wfb-region" onchange="os.wfbFilter()" class="px-2.5 py-1.5 rounded-xl bg-white/[0.07] border border-white/15 text-xs text-sky-300 outline-none">
                        <option value="">All Continents (250)</option>
                        <option value="Asia">Asia</option>
                        <option value="Europe">Europe</option>
                        <option value="Americas">Americas</option>
                        <option value="Africa">Africa</option>
                        <option value="Oceania">Oceania</option>
                    </select>
                    <input id="wfb-search" type="text" oninput="os.wfbFilter()" placeholder="Filter country, capital, or ISO code..."
                        class="w-56 px-3 py-1.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white outline-none">
                </div>
                <span id="wfb-fx-status" class="text-[10.5px] font-mono text-emerald-300">REST Countries v3.1 · World Bank · ECB FX</span>
            </div>

            <div class="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
                <div id="wfb-list" class="md:col-span-4 overflow-y-auto divide-y divide-white/[0.05] border-b md:border-b-0 md:border-r border-white/[0.08] bg-[#080c15]"></div>
                <div id="wfb-detail" class="md:col-span-8 p-5 overflow-y-auto bg-[#05070e]"></div>
            </div>
        </div>
    `;

    // ═══════════════════════════════════════════════════════════════════════
    //  4. OPEN BOOKSHELF & GUTENBERG E-READER (gutendex)
    // ═══════════════════════════════════════════════════════════════════════
    window.WindowContents.gutendex = `
      <div class="books-studio" id="gd-root">
        <header class="studio-app-heading"><div><span class="studio-eyebrow">THE OPEN LIBRARY</span><h2>A world between the lines.</h2><p>Discover Project Gutenberg books · availability and copyright vary by country.</p></div><span id="gd-status" role="status">Your next chapter starts here</span></header>
        <form class="books-toolbar" onsubmit="event.preventDefault();os.gdSearch(document.getElementById('gd-query').value)"><input id="gd-query" aria-label="Search book title or author" placeholder="Title, author, or subject…" maxlength="200"><button type="submit" class="os-btn">Search library</button><button type="button" class="os-btn" id="gd-prev" onclick="os.gdPage(-1)">Previous</button><span id="gd-page-label">Page 1</span><button type="button" class="os-btn" id="gd-next" onclick="os.gdPage(1)">Next</button></form>
        <div class="books-workspace"><section class="books-shelf" id="gd-list" tabindex="0" aria-label="Book search results"></section><section id="gd-reader-wrap" class="books-reader"><div class="books-reader-tools"><select id="gd-theme" aria-label="Reading color theme" onchange="os.gdSetTheme(this.value)"><option value="system">System glass</option><option value="sepia">Warm sepia</option><option value="oled">Night ink</option></select><button type="button" class="os-btn" aria-label="Decrease reader font size" onclick="os.gdAdjustFont(-1)">A−</button><button type="button" class="os-btn" aria-label="Increase reader font size" onclick="os.gdAdjustFont(1)">A+</button><label class="books-import os-btn">Open .txt<input type="file" accept=".txt,text/plain" aria-label="Open local text file" onchange="os.gdImportText(this.files[0]);this.value=''"></label><button type="button" class="os-btn" onclick="os.gdDownloadText()">Download text</button></div><div id="gd-book-bar" class="books-book-bar">Select a book to begin</div><div id="gd-reader-body" class="books-reader-body" tabindex="0" role="region" aria-label="Book text, scroll to read" onscroll="os.gdReadingProgress()"><div class="books-empty"><span class="books-empty-art" aria-hidden="true">❧</span><h3>Find your next chapter.</h3><p>Choose a book from the shelf. Online text is fetched directly from Gutenberg, never through a public relay. If the provider blocks access, open its edition or import a .txt file.</p></div></div><footer class="books-progress"><span id="gd-progress-label">No book open</span><progress id="gd-progress" max="100" value="0" aria-label="Book reading progress"></progress></footer></section></div>
      </div>
    `;

    const plain=(value,max=500)=>typeof value==='string'?value.slice(0,max):'';
    const safeHTTPS=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}};
    const validDate=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
    async function discoveryJSON(url,signal){
        const res=await fetch(url,{signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!res.ok)throw Error(res.status===429?'Provider rate limit · try later':'Provider HTTP '+res.status);
        const limit=3*1024*1024;let text='';
        if(res.body?.getReader){const reader=res.body.getReader(),decoder=new TextDecoder();let total=0;try{while(true){const {value,done}=await reader.read();if(done)break;total+=value.byteLength;if(total>limit){await reader.cancel();throw Error('Provider response exceeds 3 MiB');}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();}finally{reader.releaseLock();}}
        else{text=await res.text();if(new TextEncoder().encode(text).byteLength>limit)throw Error('Provider response exceeds 3 MiB');}
        return JSON.parse(text);
    }
    // Real, attributed public-domain reproductions served with the app, not API search results.
    const INCLUDED_MUSEUM=[
        {id:27992,image_id:'2d484387-2509-5e8e-2c43-22f9981972eb',title:'A Sunday on La Grande Jatte — 1884',artist_display:'Georges Seurat (French, 1859–1891)',date_display:'1884–86, border added 1888–89',medium_display:'Oil on canvas',place_of_origin:'France',is_public_domain:true,included:true,file:'assets/museum/seurat-grande-jatte.webp'},
        {id:14655,image_id:'3a608f55-d76e-fa96-d0b1-0789fbc48f1e',title:'Two Sisters (On the Terrace)',artist_display:'Pierre-Auguste Renoir (French, 1841–1919)',date_display:'1881',medium_display:'Oil on canvas',place_of_origin:'France',is_public_domain:true,included:true,file:'assets/museum/renoir-two-sisters.webp'},
        {id:24645,image_id:'b3974542-b9b4-7568-fc4b-966738f61d78',title:'Under the Wave off Kanagawa (The Great Wave)',artist_display:'Katsushika Hokusai (Japanese, 1760–1849)',date_display:'1830/33',medium_display:'Color woodblock print; oban',place_of_origin:'Japan',is_public_domain:true,included:true,file:'assets/museum/hokusai-great-wave.webp'}
    ];
    const museumItem=a=>{
        if(!Number.isSafeInteger(a?.id)||a.id<1||typeof a.image_id!=='string'||!/^[-a-zA-Z0-9]{8,100}$/.test(a.image_id))return null;
        return {id:a.id,included:a.included===true&&INCLUDED_MUSEUM.some(it=>it.id===a.id&&it.image_id===a.image_id),image_id:a.image_id,title:plain(a.title,240)||'Untitled',artist_display:plain(a.artist_display,600)||'Artist not supplied',date_display:plain(a.date_display,100),medium_display:plain(a.medium_display,500),place_of_origin:plain(a.place_of_origin,150),is_public_domain:a.is_public_domain===true,thumbnail:{lqip:typeof a.thumbnail?.lqip==='string'&&a.thumbnail.lqip.length<12000&&/^data:image\/(gif|png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(a.thumbnail.lqip)?a.thumbnail.lqip:'',alt_text:plain(a.thumbnail?.alt_text,700)}};
    };
    const museumRemoteImage=(item,width=843)=>'https://www.artic.edu/iiif/2/'+encodeURIComponent(item.image_id)+'/full/'+width+',/0/default.jpg';
    const museumImage=(item,width=843)=>item.included?(INCLUDED_MUSEUM.find(it=>it.id===item.id)?.file||museumRemoteImage(item,width)):museumRemoteImage(item,width);
    const museumLink=item=>'https://www.artic.edu/artworks/'+item.id;

    window.extendOS({
        // ── Museum collection: real provider records and explicitly saved references ──
        wmState:{items:[],selected:null,query:'landscape',page:1,hasNext:false,token:0,saved:[],savedView:false,zoom:100},
        wmStatus: text=>{const el=document.getElementById('wm-status');if(el)el.textContent=text;},
        initWorldMuseums: () => {
            try{const saved=JSON.parse(localStorage.getItem('aether-museum-collection-v1')||'[]');os.wmState.saved=Array.isArray(saved)?saved.map(museumItem).filter(Boolean).slice(0,50):[];}catch{os.wmStatus('Collection storage unavailable · current session only');}
            if(os.wmState.items.length){os.wmRenderGrid();os.wmRenderInspector();os.wmControls();os.wmStatus(os.wmState.includedView?'Included collection · 3 real public-domain works stored with this app':os.wmState.savedView?'Saved artwork references · online images require museum access':'Previously fetched museum records · search online to refresh');}else os.wmUseIncluded();
        },
        killWorldMuseums: () => {os.wmState.token++;os.wmState.controller?.abort();clearTimeout(os.wmState.timer);os.wmState.busy=false;for(const timer of os.wmState.imageTimers||[])clearTimeout(timer);os.wmState.imageTimers=new Set();},
        wmControls: () => {const s=os.wmState;for(const [id,disabled] of [['wm-prev',s.busy||s.savedView||s.includedView||s.page<=1],['wm-next',s.busy||s.savedView||s.includedView||!s.hasNext]]){const el=document.getElementById(id);if(el)el.disabled=!!disabled;}const label=document.getElementById('wm-page-label');if(label)label.textContent=s.savedView?'Saved':s.includedView?'Included':String(s.page);document.getElementById('wm-saved-btn')?.setAttribute('aria-pressed',String(s.savedView));},
        wmSearch: async (query='landscape',page=1) => {
            const s=os.wmState,token=++s.token;s.controller?.abort();clearTimeout(s.timer);s.controller=new AbortController();const controller=s.controller;
            s.query=String(query||'landscape').trim().slice(0,200)||'landscape';s.page=Number.isInteger(page)?Math.min(100,Math.max(1,page)):1;s.savedView=false;s.includedView=false;s.busy=true;s.items=[];s.selected=null;s.hasNext=false;os.wmControls();os.wmRenderGrid();os.wmRenderInspector();os.wmStatus('Searching Art Institute of Chicago…');const input=document.getElementById('wm-query');if(input)input.value=s.query;
            s.timer=setTimeout(()=>controller.abort(),12000);
            try{const data=await discoveryJSON('https://api.artic.edu/api/v1/artworks/search?q='+encodeURIComponent(s.query)+'&fields=id,title,artist_display,date_display,medium_display,image_id,thumbnail,place_of_origin,is_public_domain&limit=24&page='+s.page,controller.signal);if(token!==s.token)return;if(controller.signal.aborted)throw Error('Request timed out');if(!Array.isArray(data.data))throw Error('Invalid museum response');s.items=data.data.map(museumItem).filter(Boolean).slice(0,24);s.selected=s.items[0]||null;s.hasNext=Number(data.pagination?.current_page)<Number(data.pagination?.total_pages)&&s.page<100;os.wmStatus(s.items.length?s.items.length+' artworks · Art Institute of Chicago · images remain online':'No image-bearing artworks on this page · try another search or page');}
            catch(error){if(token!==s.token)return;s.items=INCLUDED_MUSEUM.map(museumItem);s.selected=s.items[0];s.includedView=true;s.hasNext=false;os.wmStatus('Online museum search unavailable ('+(error.name==='AbortError'?'request timed out':error.message)+') · showing 3 included works, NOT search results');}
            finally{if(token===s.token){clearTimeout(s.timer);s.busy=false;os.wmRenderGrid();os.wmRenderInspector();os.wmControls();}}
        },
        wmPage: delta=>{const s=os.wmState;if(s.busy||s.savedView||s.includedView||![-1,1].includes(delta)||delta<0&&s.page<=1||delta>0&&!s.hasNext)return;os.wmSearch(s.query,s.page+delta);},
        wmRenderGrid: () => {
            const grid=document.getElementById('wm-grid');if(!grid)return;const top=grid.scrollTop,s=os.wmState;
            grid.innerHTML=s.items.length?s.items.map((it,i)=>`<button type="button" class="museum-card" aria-pressed="${s.selected?.id===it.id}" onclick="os.wmSelect(${i})"><div class="museum-thumbnail" data-preserve-surface><img src="${museumImage(it,843)}" alt="${esc(it.title)}" loading="lazy" referrerpolicy="no-referrer"></div><div><strong>${esc(it.title)}</strong><small>${esc(it.artist_display)}</small></div></button>`).join(''):'<div class="discovery-empty">'+(s.busy?'Searching the collection…':s.savedView?'No saved artworks yet. Save a reference from any artwork.':'No artworks to display. Search above to explore the collection.')+'</div>';
            grid.querySelectorAll('img').forEach((img,index)=>os.wmWireImage(img,s.items[index]));grid.scrollTop=top;
        },
        wmSelect: index=>{if(!Number.isInteger(index)||!os.wmState.items[index])return;os.wmState.selected=os.wmState.items[index];os.wmState.zoom=100;document.querySelectorAll('.museum-card').forEach((el,i)=>el.setAttribute('aria-pressed',String(index===i)));os.wmRenderInspector();},
        wmRenderInspector: () => {
            const el=document.getElementById('wm-inspector'),it=os.wmState.selected;if(!el)return;if(!it){el.innerHTML='<div class="discovery-empty"><span class="museum-empty-glyph" aria-hidden="true">◈</span><h3>Art deserves a closer look.</h3><p>Select a work to see its full composition and museum attribution. Saved collections contain links, not offline images.</p></div>';return;}
            const saved=os.wmState.saved.some(item=>item.id===it.id);
            el.innerHTML=`<div class="museum-view-tools"><span>${it.included?'INCLUDED REPRODUCTION / LOCAL FILE':'ART INSTITUTE OF CHICAGO'}</span><label>Zoom <select aria-label="Artwork zoom" onchange="os.wmZoom(this.value)"><option value="100">Fit</option><option value="150">150%</option><option value="200">200%</option></select></label></div><div class="museum-art-stage" tabindex="0" aria-label="Artwork viewport, scroll when zoomed" data-preserve-surface><img src="${museumImage(it,843)}" alt="${esc(it.title)}" referrerpolicy="no-referrer"></div><div class="museum-caption"><h2>${esc(it.title)}</h2><p class="museum-artist">${esc(it.artist_display)}</p><p>${esc([it.date_display,it.place_of_origin].filter(Boolean).join(' · '))}</p><p>${esc(it.medium_display)}</p><span class="museum-rights">${it.is_public_domain?'Public domain according to museum metadata':'Rights not confirmed as public domain · check museum terms before reuse'}</span><div class="museum-actions"><button type="button" class="os-btn" aria-pressed="${saved}" onclick="os.wmToggleSaved()">${saved?'Remove from collection':'Add to collection'}</button><button type="button" class="os-btn" onclick="os.wmSaveToVFS()">Save reference to Files</button><a class="os-btn" href="${museumLink(it)}" target="_blank" rel="noopener noreferrer">Museum record ↗</a><a class="os-btn" href="${museumRemoteImage(it,1686)}" target="_blank" rel="noopener noreferrer">Museum image (online) ↗</a></div><p class="discovery-fineprint">${it.included?'Included public-domain reproduction; source details in assets/museum/SOURCES.md. This local copy is not a live search result and may be lower-resolution.':'Attribution: Art Institute of Chicago. Links and image availability depend on the museum.'} Saving a reference does not download the artwork.</p></div>`;
            os.wmWireImage(el.querySelector('.museum-art-stage img'),it);
        },
        wmWireImage: (img,item) => {
            const s=os.wmState,token=s.token;if(!img||!item)return;
            s.imageTimers=s.imageTimers||new Set();let timer,attempt=0,finished=false;
            const clear=()=>{clearTimeout(timer);s.imageTimers.delete(timer);};
            const note=text=>{let label=img.parentElement.querySelector('.museum-image-note');if(!label){label=document.createElement('span');label.className='museum-image-note';img.parentElement.append(label);}label.textContent=text;};
            const fail=()=>{
                clear();if(finished||token!==s.token||!img.isConnected)return;
                if(attempt===0&&!item.included){attempt++;img.src='https://www.artic.edu/iiif/2/'+encodeURIComponent(item.image_id)+'/full/!843,843/0/default.jpg';arm();return;}
                finished=true;img.onerror=null;img.onload=null;
                if(item.thumbnail?.lqip){img.src=item.thumbnail.lqip;img.classList.add('museum-low-resolution');note('Low-resolution museum preview · full image unavailable');}
                else{img.hidden=true;note('Museum image unavailable · retry or open its museum record');}
                os.wmStatus('Some museum images could not load · Retry images or open the museum record');
            };
            const arm=()=>{timer=setTimeout(fail,15000);s.imageTimers.add(timer);};
            img.onerror=fail;img.onload=()=>{clear();finished=true;};
            if(img.complete){if(img.naturalWidth>0){finished=true;return;}fail();}else arm();
        },
        wmRetryImages: () => {for(const timer of os.wmState.imageTimers||[])clearTimeout(timer);os.wmState.imageTimers=new Set();os.wmRenderGrid();os.wmRenderInspector();os.wmStatus('Retrying museum image requests · open the museum record if access is blocked');},
        wmUseIncluded: () => {
            os.killWorldMuseums();const s=os.wmState;s.includedView=true;s.savedView=false;s.items=INCLUDED_MUSEUM.map(museumItem);s.selected=s.items[0];s.hasNext=false;
            os.wmRenderGrid();os.wmRenderInspector();os.wmControls();os.wmStatus('Included collection · 3 real public-domain works stored with this app · search online for more');
        },
        wmZoom: value=>{const zoom=Number(value);if(![100,150,200].includes(zoom))return;os.wmState.zoom=zoom;const img=document.querySelector('.museum-art-stage img');if(img){img.style.width=zoom+'%';img.style.height=zoom+'%';}},
        wmToggleSaved: () => {
            const s=os.wmState,it=s.selected;if(!it)return;const found=s.saved.some(item=>item.id===it.id);if(!found&&s.saved.length>=50){os.wmStatus('Collection holds 50 references · export links or remove an item first');return;}s.saved=found?s.saved.filter(item=>item.id!==it.id):[it,...s.saved];
            try{localStorage.setItem('aether-museum-collection-v1',JSON.stringify(s.saved));os.wmStatus(found?'Reference removed from collection':'Reference saved in this browser · images remain online');}catch{os.wmStatus('Collection is session-only · browser storage failed; export links as a backup');}
            if(s.savedView){s.items=[...s.saved];s.selected=s.items[0]||null;os.wmRenderGrid();}os.wmRenderInspector();
        },
        wmShowSaved: () => {const s=os.wmState;if(s.savedView){if(s.previousIncluded)os.wmUseIncluded();else os.wmSearch(s.query);return;}s.previousIncluded=!!s.includedView;os.killWorldMuseums();s.savedView=true;s.includedView=false;s.items=[...s.saved];s.selected=s.items[0]||null;os.wmRenderGrid();os.wmRenderInspector();os.wmControls();os.wmStatus(s.saved.length+' saved references · select My collection again to return to search');},
        wmExportCollection: () => {const items=os.wmState.saved.map(it=>({...it,museumURL:museumLink(it),imageURL:museumRemoteImage(it)}));os.discoveryDownload(JSON.stringify({format:'aether-museum-links',version:1,attribution:'Art Institute of Chicago',items},null,2),'museum-collection.json','application/json');os.wmStatus('Collection links exported · artwork images are not included');},
        wmSaveToVFS: async () => {
            const it=os.wmState.selected,token=os.wmState.token;if(!it)return;try{if(!window.AetherVFS)throw Error('Files unavailable');const rec=await AetherVFS.putFile({name:it.title.replace(/[^a-z0-9]+/gi,'_').slice(0,60)+'.txt',mime:'text/plain',kind:'note',icon:'image',folder:'User Uploads',content:[it.title,it.artist_display,it.date_display,it.medium_display,'Art Institute of Chicago',museumLink(it),museumRemoteImage(it),'Reference links only; image not downloaded.'].join('\n'),sourceUrl:museumLink(it),tags:['museum','reference']});if(token!==os.wmState.token||os.wmState.selected?.id!==it.id)return;os.wmStatus(rec?.persistence==='indexeddb'?'Artwork reference saved to Files · image remains online':'Session-only reference · export collection links as a backup');}catch(error){if(token===os.wmState.token)os.wmStatus('Reference not saved: '+error.message);}
        },
        discoveryDownload: (content,name,mime)=>{const url=URL.createObjectURL(new Blob([content],{type:mime})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},

        // ── Launch Library 2: no synthetic launches, crew or flight telemetry ──
        sxhState:{tab:'launches',launches:[],astronauts:[],selectedIdx:0,timer:null,requests:{},utc:false},
        sxhStatus: text=>{const el=document.getElementById('sxh-status');if(el)el.textContent=text;},
        initSpaceXHub: () => {os.sxhSetTab(os.sxhState.tab,false);os.sxhRefresh();clearInterval(os.sxhState.timer);os.sxhState.timer=setInterval(os.sxhTickCountdown,1000);},
        killSpaceXHub: () => {clearInterval(os.sxhState.timer);os.sxhState.timer=null;for(const request of Object.values(os.sxhState.requests)){request.controller.abort();clearTimeout(request.timer);}os.sxhState.requests={};},
        sxhSetTab: (tab,load=true)=>{if(!['launches','astronauts'].includes(tab))return;os.sxhState.tab=tab;document.querySelectorAll('[data-sxh-tab]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.sxhTab===tab)));document.getElementById('sxh-pane-launches')?.toggleAttribute('hidden',tab!=='launches');document.getElementById('sxh-pane-astronauts')?.toggleAttribute('hidden',tab!=='astronauts');if(load)os.sxhRefresh();},
        sxhRefresh: ()=>os.sxhState.tab==='astronauts'?os.sxhFetchAstronauts():os.sxhFetchLaunches(),
        sxhRequest: async (key,url,normalize)=>{
            const s=os.sxhState;s.requests[key]?.controller.abort();clearTimeout(s.requests[key]?.timer);const request={controller:new AbortController()};s.requests[key]=request;request.timer=setTimeout(()=>request.controller.abort(),12000);os.sxhStatus('Checking Launch Library 2 '+(key==='launches'?'schedule':'in-space crew')+'…');if(key==='launches')os.sxhRenderLaunches();else{const pane=document.getElementById('sxh-pane-astronauts');if(pane&&!s.astronauts.length)pane.innerHTML='<div class="discovery-empty">Checking in-space crew…</div>';}
            try{const data=await discoveryJSON(url,request.controller.signal);if(s.requests[key]!==request)return;if(request.controller.signal.aborted)throw Error('Request timed out');if(!Array.isArray(data.results))throw Error('Invalid provider response');s[key]=data.results.map(normalize).filter(Boolean).slice(0,20);s[key+'Checked']=new Date().toLocaleTimeString();s[key+'Error']='';if(s.tab===(key==='launches'?'launches':'astronauts'))os.sxhStatus(s[key].length+' '+(key==='launches'?'launches':'crew records')+' shown · checked '+s[key+'Checked']+' · schedules and manifests can change');}
            catch(error){if(s.requests[key]!==request)return;s[key+'Error']=error.name==='AbortError'?'Request timed out':error.message;if(s.tab===(key==='launches'?'launches':'astronauts'))os.sxhStatus('Provider unavailable: '+s[key+'Error']+(s[key].length?' · previously fetched records shown as stale':' · no substitute records shown'));}
            finally{if(s.requests[key]===request){clearTimeout(request.timer);delete s.requests[key];if(key==='launches'){s.selectedIdx=Math.min(s.selectedIdx,Math.max(0,s.launches.length-1));os.sxhRenderLaunches();}else os.sxhRenderAstronauts();}}
        },
        sxhFetchLaunches: ()=>os.sxhRequest('launches','https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=20&mode=detailed',l=>{
            if(typeof l?.id!=='string'||!plain(l.name))return null;
            const lat=Number(l.pad?.latitude),lon=Number(l.pad?.longitude),coords=l.pad?.latitude!=null&&l.pad?.longitude!=null&&Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180;
            return {id:l.id.slice(0,100),name:plain(l.name,240),status:plain(l.status?.name,100)||'Status not supplied',net:validDate(l.net)?l.net:null,precision:plain(l.net_precision?.name,100)||'Precision not supplied',provider:plain(l.launch_service_provider?.name,180)||'Provider not supplied',rocket:plain(l.rocket?.configuration?.full_name,200)||'Rocket not supplied',pad:[plain(l.pad?.name,200),plain(l.pad?.location?.name,200)].filter(Boolean).join(' · ')||'Pad not supplied',lat:coords?lat:null,lon:coords?lon:null,orbit:plain(l.mission?.orbit?.name,100)||'Orbit not supplied',mission:plain(l.mission?.description,6000)||'Mission description not supplied.',image:safeHTTPS(typeof l.image==='string'?l.image:l.image?.image_url),webcast:safeHTTPS(l.vidURLs?.[0]?.url)};
        }),
        sxhDate: value=>validDate(value)?new Date(value).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short',...(os.sxhState.utc?{timeZone:'UTC'}:{})})+(os.sxhState.utc?' UTC':' local'):'Time not supplied',
        sxhSelect: index=>{if(!Number.isInteger(index)||!os.sxhState.launches[index])return;os.sxhState.selectedIdx=index;os.sxhRenderLaunches();},
        sxhRenderLaunches: ()=>{
            const s=os.sxhState,list=document.getElementById('sxh-launch-list'),detail=document.getElementById('sxh-launch-detail');const current=s.launches[s.selectedIdx];
            if(list){const top=list.scrollTop;list.innerHTML=s.launches.length?s.launches.map((l,i)=>`<button type="button" class="launch-list-item" aria-pressed="${i===s.selectedIdx}" onclick="os.sxhSelect(${i})"><span class="launch-list-orbit" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><span><small>${esc(l.provider)}</small><strong>${esc(l.name)}</strong><time>${esc(os.sxhDate(l.net))}</time><span class="launch-status-tag">${esc(l.status)}</span></span></button>`).join(''):'<div class="discovery-empty">'+(s.requests.launches?'Checking the launch schedule…':s.launchesError?'Schedule unavailable. Refresh to retry.':'No upcoming launch records returned.')+'</div>';list.scrollTop=top;}
            if(detail){if(!current){detail.innerHTML='<div class="discovery-empty"><span class="launch-empty-orbit" aria-hidden="true">◎</span><h3>Waiting for a real mission.</h3><p>No simulated launch countdowns or aircraft-style telemetry. Refresh to check the provider.</p></div>';os.sxhTickCountdown();return;}
                detail.innerHTML=`${s.launchesError?'<div class="launch-stale" role="status">STALE · latest refresh failed · last success '+esc(s.launchesChecked||'unknown')+'</div>':''}<div class="launch-mission-visual" data-preserve-surface>${current.image?`<img src="${esc(current.image)}" alt="${esc(current.name)}" referrerpolicy="no-referrer">`:'<div class="launch-orbit-art" aria-hidden="true"><i></i><i></i><i></i></div>'}<div class="launch-mission-overlay"><span>${esc(current.provider)}</span><h2>${esc(current.name)}</h2><span>${esc(current.rocket)}</span></div></div><div class="launch-info"><span class="discovery-eyebrow">NO EARLIER THAN / ESTIMATE</span><div id="sxh-countdown" class="launch-countdown">Waiting for schedule</div><p>${esc(os.sxhDate(current.net))} · ${esc(current.precision)}</p><div class="launch-facts"><div><small>STATUS</small><strong>${esc(current.status)}</strong></div><div><small>ORBIT</small><strong>${esc(current.orbit)}</strong></div><div><small>LAUNCH PAD</small><strong>${esc(current.pad)}</strong></div></div><p class="launch-mission-copy">${esc(current.mission)}</p><div class="launch-actions"><button type="button" class="os-btn" ${current.net?'':'disabled'} onclick="os.sxhExportCalendar()">Calendar reminder</button><button type="button" class="os-btn" ${current.lat===null?'disabled':''} onclick="os.sxhOpenPad()">View pad on Atlas</button>${current.webcast?`<a class="os-btn" href="${esc(current.webcast)}" target="_blank" rel="noopener noreferrer">Provider video link ↗</a>`:''}</div><p class="discovery-fineprint">This is a provider schedule, not flight confirmation. Verify time, status and video availability before relying on a reminder.</p></div>`;
                detail.querySelector('img')?.addEventListener('error',event=>{event.target.hidden=true;},{once:true});}
            os.sxhTickCountdown();
        },
        sxhTickCountdown: ()=>{const s=os.sxhState,l=s.launches[s.selectedIdx],el=document.getElementById('sxh-countdown'),pill=document.getElementById('sxh-countdown-pill');let text='Time not supplied';if(l?.net){const diff=Date.parse(l.net)-Date.now();if(diff<=0)text='Scheduled time passed · verify status';else{const seconds=Math.floor(diff/1000),d=Math.floor(seconds/86400),h=Math.floor(seconds/3600)%24,m=Math.floor(seconds/60)%60;text=d+'d '+String(h).padStart(2,'0')+'h '+String(m).padStart(2,'0')+'m '+String(seconds%60).padStart(2,'0')+'s';}}if(el)el.textContent=text;if(pill)pill.textContent=s.launchesError?'Stale schedule · last refresh failed':'NET estimate · not flight telemetry';},
        sxhOpenPad: ()=>{const l=os.sxhState.launches[os.sxhState.selectedIdx];if(l?.lat===null||!l)return;if(os.geoJump)os.geoJump(l.lat,l.lon,l.pad);else os.sxhStatus('Atlas is unavailable in this session');},
        sxhExportCalendar: ()=>{
            const l=os.sxhState.launches[os.sxhState.selectedIdx];if(!l?.net)return;
            const clean=value=>String(value).replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
            const stamp=value=>new Date(value).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
            const start=Date.parse(l.net),ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//AetherOS//Launch reminders//EN','BEGIN:VEVENT','UID:'+encodeURIComponent(l.id)+'@aetheros','DTSTAMP:'+stamp(Date.now()),'DTSTART:'+stamp(start),'DTEND:'+stamp(start+3600000),'SUMMARY:'+clean(l.name+' (NET estimate)'),'DESCRIPTION:'+clean('Verify provider schedule before use. '+l.status),'LOCATION:'+clean(l.pad),'END:VEVENT','END:VCALENDAR',''].map(line=>{const folded=[];let part='';for(const char of line){if(new TextEncoder().encode(part+char).byteLength>73){folded.push(part);part=' '+char;}else part+=char;}folded.push(part);return folded.join('\r\n');}).join('\r\n');
            os.discoveryDownload(ics,'launch-reminder.ics','text/calendar');os.sxhStatus('Calendar reminder downloaded · estimated time, not an automatically updated subscription');
        },
        sxhFetchAstronauts: ()=>os.sxhRequest('astronauts','https://ll.thespacedevs.com/2.2.0/astronaut/?in_space=true&limit=20',a=>plain(a?.name)?{name:plain(a.name,200),agency:plain(a.agency?.name,180)||'Agency not supplied',nationality:plain(a.nationality,150),photo:safeHTTPS(a.profile_image_thumbnail||a.profile_image),bio:plain(a.bio,3000)||'Biography not supplied.'}:null),
        sxhRenderAstronauts: ()=>{const s=os.sxhState,pane=document.getElementById('sxh-pane-astronauts');if(!pane)return;pane.innerHTML=(s.astronautsError?'<div class="launch-stale">'+(s.astronauts.length?'STALE crew records':'Crew unavailable')+' · '+esc(s.astronautsError)+'</div>':'')+(s.astronauts.length?s.astronauts.map(a=>`<article class="launch-crew-card">${a.photo?`<img src="${esc(a.photo)}" alt="${esc(a.name)}" loading="lazy" referrerpolicy="no-referrer">`:'<div class="launch-crew-monogram" aria-hidden="true">'+esc(a.name.slice(0,1))+'</div>'}<div><h3>${esc(a.name)}</h3><small>${esc([a.agency,a.nationality].filter(Boolean).join(' · '))}</small><p>${esc(a.bio)}</p></div></article>`).join(''):'<div class="discovery-empty">No in-space crew records returned. This does not mean nobody is in space.</div>');pane.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>img.hidden=true,{once:true}));},

        // ── 3. World Factbook, GDP & Live FX Atlas ──
        wfbState: { all: [], filtered: [], fx: {}, selectedCca3: 'IND' },

        initWorldFactbook: async () => {
            if (!os.wfbState.all.length) {
                try {
                    const [cRes, fxRes] = await Promise.all([
                        fetch('https://restcountries.com/v3.1/all?fields=name,cca2,cca3,flags,capital,region,subregion,population,area,currencies,languages,latlng,timezones,borders'),
                        fetch('https://api.frankfurter.app/latest?from=USD').catch(() => null)
                    ]);
                    if (!cRes.ok) throw new Error('Countries HTTP ' + cRes.status);
                    const countries = await cRes.json();
                    if (!Array.isArray(countries)) throw new Error('Invalid country data');
                    if (Array.isArray(countries)) {
                        countries.sort((a, b) => (b.population || 0) - (a.population || 0));
                        os.wfbState.all = countries;
                    }
                    if (fxRes && fxRes.ok) {
                        const fxData = await fxRes.json();
                        os.wfbState.fx = fxData?.rates || {};
                        os.wfbState.fxDate = fxData.date || 'date not supplied';
                    }
                } catch (_) {
                    os.wfbState.all = [];
                    const detail = document.getElementById('wfb-detail');
                    if (detail) detail.textContent = 'Country service unavailable. Retry to load real country records; no sample statistics are substituted.';
                }
            }
            os.wfbFilter();
            os.wfbSelect(os.wfbState.selectedCca3 || 'IND');
        },

        wfbFilter: () => {
            const reg = document.getElementById('wfb-region')?.value || '';
            const q = (document.getElementById('wfb-search')?.value || '').trim().toLowerCase();
            os.wfbState.filtered = os.wfbState.all.filter((c) => {
                if (reg && c.region !== reg) return false;
                if (!q) return true;
                const name = (c.name?.common || '').toLowerCase();
                const cap = (c.capital?.[0] || '').toLowerCase();
                return name.includes(q) || cap.includes(q) || (c.cca3 || '').toLowerCase().includes(q);
            });
            const list = document.getElementById('wfb-list');
            if (!list) return;
            list.innerHTML = os.wfbState.filtered.map((c) => `
                <button type="button" onclick="os.wfbSelect('${esc(c.cca3)}')"
                    class="w-full text-left px-3.5 py-2.5 flex items-center gap-2.5 transition hover-target cursor-none ${os.wfbState.selectedCca3 === c.cca3 ? 'bg-white/10' : 'hover:bg-white/[0.04]'}">
                    ${c.flags?.svg ? `<img src="${esc(c.flags.svg)}" class="w-6 h-4 object-cover rounded-sm shrink-0" alt="">` : '<span class="text-sm">🌐</span>'}
                    <div class="min-w-0 flex-1">
                        <div class="font-medium text-white truncate">${esc(c.name?.common)}</div>
                        <div class="text-[10px] font-mono text-gray-400 truncate">${esc(c.capital?.[0] || '—')} · ${(Number(c.population || 0) / 1e6).toFixed(1)}M</div>
                    </div>
                </button>
            `).join('') || 'No countries match. Clear the filter or retry the country service.';
        },

        wfbSelect: async (cca3) => {
            const request = os.wfbState.request = (os.wfbState.request || 0) + 1;
            const c = os.wfbState.all.find((x) => x.cca3 === cca3) || os.wfbState.all[0];
            if (!c) return;
            os.wfbState.selectedCca3 = c.cca3;
            os.wfbFilter();
            const det = document.getElementById('wfb-detail');
            if (!det) return;

            const currCode = Object.keys(c.currencies || {})[0] || 'USD';
            const currObj = (c.currencies || {})[currCode] || {};
            const fxRate = currCode === 'USD' ? 1 : os.wfbState.fx[currCode];
            const langs = Object.values(c.languages || {}).join(', ') || '—';
            const [lat, lon] = c.latlng || [20, 77];

            det.innerHTML = `
                <div class="space-y-4">
                    <div class="flex flex-wrap items-center gap-4">
                        ${c.flags?.svg ? `<img src="${esc(c.flags.svg)}" class="w-20 h-14 object-cover rounded-xl border border-white/15 shadow-lg" alt="">` : ''}
                        <div>
                            <h2 class="text-xl font-bold text-white">${esc(c.name?.common)}</h2>
                            <div class="text-xs text-gray-400">${esc(c.name?.official)} · <span class="font-mono text-sky-300">${esc(c.cca2)} / ${esc(c.cca3)}</span></div>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div class="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                            <div class="text-[10px] font-mono text-gray-400">CAPITAL</div>
                            <div class="font-semibold text-white mt-0.5">${esc(c.capital?.[0] || '—')}</div>
                        </div>
                        <div class="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                            <div class="text-[10px] font-mono text-gray-400">POPULATION</div>
                            <div class="font-semibold text-white mt-0.5">${Number(c.population || 0).toLocaleString()}</div>
                        </div>
                        <div class="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                            <div class="text-[10px] font-mono text-gray-400">AREA</div>
                            <div class="font-semibold text-white mt-0.5">${Number(c.area || 0).toLocaleString()} km²</div>
                        </div>
                        <div class="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/25">
                            <div class="text-[10px] font-mono text-emerald-300">FX · ${esc(os.wfbState.fxDate || 'date unavailable')} (${esc(currCode)})</div>
                            <div class="font-semibold text-white mt-0.5">${fxRate ? `1 USD = ${fxRate.toFixed(2)} ${esc(currCode)}` : `${esc(currObj.symbol || '')} ${esc(currCode)}`}</div>
                        </div>
                    </div>

                    <div class="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-1.5 text-xs">
                        <div><span class="text-gray-400">Region:</span> <span class="text-white">${esc(c.region)} — ${esc(c.subregion || '')}</span></div>
                        <div><span class="text-gray-400">Languages:</span> <span class="text-white">${esc(langs)}</span></div>
                        <div><span class="text-gray-400">Timezones:</span> <span class="font-mono text-gray-300">${esc((c.timezones || []).slice(0, 4).join(', '))}</span></div>
                    </div>

                    <div id="wfb-gdp-box" class="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
                        <div class="text-[10px] font-mono text-sky-300 uppercase">World Bank Historical GDP (USD)</div>
                        <div id="wfb-gdp-bars" class="mt-2 text-[11px] font-mono text-gray-400">Loading World Bank indicator...</div>
                    </div>

                    ${(c.borders && c.borders.length) ? `
                        <div>
                            <div class="text-[10px] font-mono text-gray-400 uppercase mb-1.5">Land Borders (Click to Hop)</div>
                            <div class="flex flex-wrap gap-1.5">
                                ${c.borders.map((b) => `<button type="button" onclick="os.wfbSelect('${esc(b)}')" class="px-2.5 py-1 rounded-lg bg-white/[0.07] hover:bg-white/15 font-mono text-[11px] text-amber-200 hover-target cursor-none">${esc(b)} →</button>`).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <div>
                        <button type="button" onclick="os.geoJump && os.geoJump(${lat}, ${lon}, '${esc(c.capital?.[0] || c.name?.common)}')"
                            class="px-3.5 py-2 rounded-xl bg-sky-400 text-black font-semibold text-xs hover-target cursor-none">Explore ${esc(c.capital?.[0] || c.name?.common)} on GeoRadar →</button>
                    </div>
                </div>
            `;

            // Fetch World Bank GDP series
            try {
                const gRes = await fetch(`https://api.worldbank.org/v2/country/${encodeURIComponent(c.cca2)}/indicator/NY.GDP.MKTP.CD?format=json&per_page=6`);
                if (!gRes.ok) throw new Error('GDP service unavailable');
                const gJson = await gRes.json();
                if (request !== os.wfbState.request || !det.isConnected) return;
                const rows = (Array.isArray(gJson?.[1]) ? gJson[1] : []).filter((r) => r.value != null).reverse();
                const barsEl = document.getElementById('wfb-gdp-bars');
                if (barsEl && rows.length) {
                    const maxV = Math.max(...rows.map((r) => r.value), 1);
                    barsEl.innerHTML = `<div class="grid gap-2 items-end h-24 pt-2" style="grid-template-columns:repeat(${rows.length},minmax(0,1fr))">` + rows.map((r) => {
                        const pct = Math.max(12, Math.round((r.value / maxV) * 100));
                        const trillions = r.value >= 1e12 ? `$${(r.value / 1e12).toFixed(2)}T` : `$${(r.value / 1e9).toFixed(0)}B`;
                        return `<div class="flex flex-col items-center gap-1 h-full justify-end">
                            <span class="text-[9.5px] text-emerald-300">${trillions}</span>
                            <div class="w-full rounded-t bg-sky-400/70" style="height:${pct}%"></div>
                            <span class="text-[9.5px] text-gray-500">${esc(r.date)}</span>
                        </div>`;
                    }).join('') + `</div>`;
                } else if (barsEl) {
                    barsEl.textContent = 'World Bank series unavailable for this territory.';
                }
            } catch (_) {
                if (request === os.wfbState.request && det.isConnected) {
                    const bars = document.getElementById('wfb-gdp-bars');
                    if (bars) bars.textContent = 'World Bank unavailable. Retry by selecting this country again.';
                }
            }
        },

        // ── Open Bookshelf: public catalog, direct bounded text, local reading ──
        gdState: {books:[],fontSize:17,theme:'system',page:1,query:'',hasNext:false,searchID:0,readID:0,controllers:{},positions:{},text:'',activeID:null},
        gdStatus: message => {const el=document.getElementById('gd-status');if(el)el.textContent=message;},
        gdSafeURL: value => {try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&(url.hostname==='gutenberg.org'||url.hostname.endsWith('.gutenberg.org'))?url.href:null;}catch(_){return null;}},
        gdRequest: async (url,channel,asText=false) => {
            os.gdState.controllers[channel]?.abort();const controller=new AbortController();os.gdState.controllers[channel]=controller;const timer=setTimeout(()=>controller.abort(),12000);
            try{const response=await fetch(url,{signal:controller.signal,credentials:'omit'});if(!response.ok)throw Error('Provider HTTP '+response.status);return asText?await os.gdReadText(response):await response.json();}
            finally{clearTimeout(timer);if(os.gdState.controllers[channel]===controller)delete os.gdState.controllers[channel];}
        },
        gdReadText: async response => {
            const max=2097152;if(Number(response.headers?.get('content-length'))>max)throw Error('Text exceeds the 2 MiB reader limit');
            if(response.body?.getReader){const reader=response.body.getReader(),decoder=new TextDecoder('utf-8',{fatal:true});let total=0,text='';try{for(;;){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>max)throw Error('Text exceeds the 2 MiB reader limit');text+=decoder.decode(value,{stream:true});}return text+decoder.decode();}catch(error){try{await reader.cancel();}catch(_){}throw error;}finally{reader.releaseLock?.();}}
            const text=await response.text();if(new TextEncoder().encode(text).length>max)throw Error('Text exceeds the 2 MiB reader limit');return text;
        },
        initGutendex: () => {
            if(!os.gdState.loaded){os.gdState.loaded=true;try{const positions=JSON.parse(localStorage.getItem('aether_book_positions_v1')||'{}');if(positions&&typeof positions==='object'&&!Array.isArray(positions))for(const [id,fraction]of Object.entries(positions).slice(-100))if(/^\d+$/.test(id)&&typeof fraction==='number'&&Number.isFinite(fraction)&&fraction>=0&&fraction<=1)os.gdState.positions[id]=fraction;}catch(_){os.gdStatus('Reading positions may not persist · browser storage unavailable');}}
            os.gdSetTheme(os.gdState.theme);os.gdAdjustFont(0);
            const query=document.getElementById('gd-query');if(query)query.value=os.gdState.query;
            if(os.gdState.books.length)os.gdRenderShelf();else os.gdSearch('');
            if(os.gdState.text)os.gdShowText(os.gdState.text,os.gdState.title,os.gdState.activeID);
        },
        gdDispose: () => {
            os.gdSavePosition();os.gdState.searchID++;os.gdState.readID++;for(const controller of Object.values(os.gdState.controllers))controller.abort();os.gdState.controllers={};clearTimeout(os.gdState.saveTimer);clearTimeout(os.gdState.restoreTimer);os.gdState.restoring=false;
        },
        gdSetTheme: theme => {if(!['system','sepia','oled'].includes(theme))return;os.gdState.theme=theme;const wrap=document.getElementById('gd-reader-wrap');if(wrap)wrap.dataset.readingTheme=theme;const select=document.getElementById('gd-theme');if(select)select.value=theme;},
        gdAdjustFont: delta => {
            const body=document.getElementById('gd-reader-body'),max=body?body.scrollHeight-body.clientHeight:0,fraction=max>0?body.scrollTop/max:os.gdState.positions[os.gdState.activeID]||0;
            os.gdState.fontSize=Math.max(14,Math.min(28,os.gdState.fontSize+delta));if(body){body.style.fontSize=os.gdState.fontSize+'px';body.scrollTop=fraction*Math.max(0,body.scrollHeight-body.clientHeight);os.gdReadingProgress(false);}
        },
        gdSearch: async (query='',page=1) => {
            os.gdState.query=String(query||'').trim();os.gdState.page=page;const id=++os.gdState.searchID,host=document.getElementById('gd-list');if(host)host.textContent='Finding books in the Gutenberg catalog…';os.gdStatus('Searching catalog…');
            for(const key of ['gd-prev','gd-next']){const button=document.getElementById(key);if(button)button.disabled=true;}
            try{
                const data=await os.gdRequest('https://gutendex.com/books/?search='+encodeURIComponent(os.gdState.query)+'&page='+page,'search');if(id!==os.gdState.searchID)return;
                if(!Array.isArray(data.results))throw Error('Unexpected catalog response');
                os.gdState.books=data.results.filter(book=>Number.isSafeInteger(book.id)&&book.id>0&&typeof book.title==='string');os.gdState.hasNext=!!data.next;os.gdRenderShelf();os.gdStatus(os.gdState.books.length+' books shown · Gutendex catalog');
            }catch(error){if(id!==os.gdState.searchID)return;os.gdState.books=[];os.gdState.hasNext=false;if(host)host.textContent='Catalog unavailable: '+(error.name==='AbortError'?'request cancelled or timed out':error.message)+'. Try Search again, or open a local .txt file.';os.gdStatus('Catalog could not be loaded · not the same as no matches');}
            finally{if(id===os.gdState.searchID)os.gdUpdatePagination();}
        },
        gdUpdatePagination: () => {const prev=document.getElementById('gd-prev'),next=document.getElementById('gd-next'),label=document.getElementById('gd-page-label');if(prev)prev.disabled=os.gdState.page<=1;if(next)next.disabled=!os.gdState.hasNext;if(label)label.textContent='Page '+os.gdState.page;},
        gdPage: delta => {if(delta!==1&&delta!==-1)return;if(delta<0&&os.gdState.page<=1||delta>0&&!os.gdState.hasNext)return;return os.gdSearch(os.gdState.query,os.gdState.page+delta);},
        gdRenderShelf: () => {
            const host=document.getElementById('gd-list');if(!host)return;host.replaceChildren();os.gdUpdatePagination();
            if(!os.gdState.books.length){host.textContent='No books match. Try a title, an author, or an empty search for popular downloads.';return;}
            for(const [index,book]of os.gdState.books.entries()){
                const button=document.createElement('button');button.type='button';button.className='books-shelf-card';button.setAttribute('aria-pressed',String(book.id===os.gdState.activeID));
                const jacket=document.createElement('span');jacket.className='books-jacket';jacket.dataset.preserveSurface='';
                const cover=os.gdSafeURL(book.formats?.['image/jpeg']);
                const initials=document.createElement('span');initials.textContent=book.title.slice(0,1);jacket.append(initials);
                if(cover){const image=document.createElement('img');image.src=cover;image.alt='';image.loading='lazy';image.referrerPolicy='no-referrer';image.addEventListener('error',()=>image.remove(),{once:true});jacket.append(image);}
                const details=document.createElement('div'),title=document.createElement('strong'),author=document.createElement('span'),downloads=document.createElement('small');title.textContent=book.title;author.textContent=(book.authors||[]).map(a=>a.name).filter(Boolean).join(', ')||'Author not provided';downloads.textContent=(typeof book.download_count==='number'?book.download_count.toLocaleString()+' downloads':'Download count unavailable')+(os.gdState.positions[book.id]>0?' · Resume '+Math.round(os.gdState.positions[book.id]*100)+'%':'');details.append(title,author,downloads);button.append(jacket,details);button.addEventListener('click',()=>os.gdOpenBook(index));host.append(button);
            }
        },
        gdOpenBook: async index => {
            const book=os.gdState.books[index];if(!book)return;os.gdSavePosition();clearTimeout(os.gdState.restoreTimer);clearTimeout(os.gdState.saveTimer);os.gdState.restoring=false;const token=++os.gdState.readID;os.gdState.text='';os.gdState.activeID=book.id;os.gdState.title=book.title;os.gdRenderShelf();
            const bar=document.getElementById('gd-book-bar'),body=document.getElementById('gd-reader-body');if(!body)return;
            os.gdSetBookBar(book.title,book.id);body.textContent='Opening the text of “'+book.title+'”…';os.gdStatus('Loading text directly from Project Gutenberg…');
            const formats=book.formats||{},url=os.gdSafeURL(formats['text/plain; charset=utf-8']||formats['text/plain; charset=us-ascii']||formats['text/plain'])||'https://www.gutenberg.org/cache/epub/'+book.id+'/pg'+book.id+'.txt';
            try{const text=await os.gdRequest(url,'book',true);if(token!==os.gdState.readID)return;if(!text.trim())throw Error('Provider returned empty text');if(/^\s*<(?:!doctype|html)/i.test(text))throw Error('Provider returned an HTML page, not book text');os.gdShowText(text,book.title,book.id);os.gdStatus('Text loaded · reading position saved in this browser when available');}
            catch(error){if(token!==os.gdState.readID)return;body.textContent='Online text unavailable: '+(error.name==='AbortError'?'request cancelled or timed out':error.message)+'\n\nUse “Gutenberg edition” above, or download a text edition and open it with “Open .txt”. No public relay is contacted and no text is silently truncated.';os.gdStatus('Unable to load book text · catalog metadata is not a full book');}
        },
        gdSetBookBar: (title,id) => {
            const bar=document.getElementById('gd-book-bar');if(!bar)return;bar.replaceChildren();const label=document.createElement('strong');label.textContent=title;bar.append(label);
            if(Number.isSafeInteger(id)&&id>0){const link=document.createElement('a');link.href='https://www.gutenberg.org/ebooks/'+id;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Gutenberg edition ↗';bar.append(link);}
        },
        gdShowText: (text,title,id) => {
            const body=document.getElementById('gd-reader-body');if(!body)return;clearTimeout(os.gdState.restoreTimer);clearTimeout(os.gdState.saveTimer);os.gdState.restoring=true;os.gdState.text=text;os.gdState.title=title;os.gdState.activeID=id;os.gdSetBookBar(title,id);body.textContent=text;body.style.fontSize=os.gdState.fontSize+'px';
            os.gdState.restoreTimer=setTimeout(()=>{if(body.isConnected){body.scrollTop=(os.gdState.positions[id]||0)*Math.max(0,body.scrollHeight-body.clientHeight);os.gdState.restoring=false;os.gdReadingProgress(false);}});
        },
        gdReadingProgress: (save=true) => {
            const body=document.getElementById('gd-reader-body');if(!body||!os.gdState.text)return;const max=body.scrollHeight-body.clientHeight,fraction=max>0?Math.min(1,Math.max(0,body.scrollTop/max)):0;
            const label=document.getElementById('gd-progress-label'),bar=document.getElementById('gd-progress');if(label)label.textContent=Math.round(fraction*100)+'% through loaded text · '+os.gdState.fontSize+'px';if(bar)bar.value=fraction*100;
            if(save&&!os.gdState.restoring){clearTimeout(os.gdState.saveTimer);os.gdState.saveTimer=setTimeout(os.gdSavePosition,200);}
        },
        gdSavePosition: () => {
            const body=document.getElementById('gd-reader-body'),id=os.gdState.activeID;if(!body||!os.gdState.text||os.gdState.restoring)return;
            const max=body.scrollHeight-body.clientHeight,fraction=max>0?Math.min(1,Math.max(0,body.scrollTop/max)):0;
            os.gdState.positions[id]=fraction;if(!Number.isSafeInteger(id))return;
            try{const entries=Object.entries(os.gdState.positions).filter(([key])=>/^\d+$/.test(key)).slice(-100);localStorage.setItem('aether_book_positions_v1',JSON.stringify(Object.fromEntries(entries)));}
            catch(_){os.gdStatus('Position kept for this tab only · browser storage unavailable');}
        },
        gdImportText: async file => {
            if(!file)return;os.gdState.controllers.book?.abort();const token=++os.gdState.readID;
            try{if(file.size>2097152)throw Error('File exceeds 2 MiB');const text=await file.text();if(token!==os.gdState.readID)return;if(new TextEncoder().encode(text).length>2097152||text.includes('\0'))throw Error('Not a supported UTF-8 text file (maximum 2 MiB)');os.gdSavePosition();os.gdState.positions.local=0;os.gdShowText(text,file.name,'local');os.gdStatus('Local text opened in this tab · file is not uploaded or saved as a backup');}
            catch(error){if(token===os.gdState.readID)os.gdStatus('Could not open text: '+error.message);}
        },
        gdDownloadText: () => {
            if(!os.gdState.text){os.gdStatus('Open a book text first');return;}const url=URL.createObjectURL(new Blob([os.gdState.text],{type:'text/plain;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='gutenberg-'+(os.gdState.activeID||'text')+'.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);os.gdStatus('Text download requested');
        }
    });
})();
