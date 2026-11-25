// Opt-in multi-provider wallpapers with fixed-host validation and a static-host fallback.
(() => {
  const topics = { landscape: 'mountain landscape', coast: 'coast ocean sunset', space: 'nebula astronomy' };
  const storageKey = 'aether.web-wallpaper.v2';
  let generation = 0, request = null, activeKey = '', current = null, currentPage = null, currentTopic = '', currentNonce = 0, retryAt = 0, nextAt = 0, lastError = '', retryKey = '', statusText = '';
  const plain = value => new DOMParser().parseFromString(String(value || ''), 'text/html').body.textContent.trim().slice(0, 240);
  const allowedURL = (value, host, path = '/') => {
    try { const u = new URL(value); return u.protocol === 'https:' && u.hostname === host && !u.username && !u.password && u.pathname.startsWith(path) ? u.href : ''; } catch { return ''; }
  };
  function normalize(page) {
    const i = page.imageinfo?.[0], m = i?.extmetadata || {};
    if (!i || !['image/jpeg', 'image/png', 'image/webp'].includes(i.mime) || i.width < 3840 || i.height < 2160 || i.width / i.height < 1.4 || i.width / i.height > 16 / 9 + .001) return null;
    if (!i.thumburl && (!Number.isFinite(i.size) || i.size > 25 * 1024 * 1024)) return null;
    const image = allowedURL(i.thumburl || i.url, 'upload.wikimedia.org', '/wikipedia/commons/');
    const source = allowedURL(i.descriptionurl, 'commons.wikimedia.org', '/wiki/File:');
    const license = plain(m.LicenseShortName?.value);
    // Public-domain/CC0 only: no uncertain share-alike or bespoke license parsing.
    if (!image || !source || !/^(CC0(?: 1\.0)?|Public domain|PDM(?: 1\.0)?)$/i.test(license)) return null;
    return { image, source, title: plain(page.title).replace(/^File:/, ''), artist: plain(m.Artist?.value) || 'See source for creator', license };
  }
  function normalizeWallhaven(item, settings) {
    const quality = settings.wallpaper_online_quality || 'hd', minimum = quality === 'hd' ? [1920, 1080] : [3840, 2160];
    if (!item || !Number.isFinite(item.width) || !Number.isFinite(item.height) || item.purity !== 'sfw' || !/^[a-z0-9]{6}$/.test(item.id) || !['jpg', 'png', 'webp'].includes(item.ext) || item.width < minimum[0] || item.height < minimum[1]) return null;
    const source = allowedURL(item.source, 'wallhaven.cc', '/w/');
    if (!source || new URL(source).pathname !== '/w/' + item.id) return null;
    return { image: `/api/wallpaper-image?id=${item.id}&ext=${item.ext}`, source, title: `Wallhaven ${item.id}`,
      artist: 'Artist details on source page', license: 'See source for usage rights', provider: 'Wallhaven', width: item.width, height: item.height };
  }
  const githubImages = new Map();
  let catalogPromise;
  const batches = new Map();
  let serverAvailable = null, capabilitiesRequest = null;
  async function githubCandidates(settings, key, signal) {
    // Metadata ships locally: one public GitHub blob request per new image,
    // no backend, CORS proxy, search request, token or exposed credential.
    catalogPromise ||= fetch('assets/wallpapers/online-catalog.json', { credentials: 'omit' }).then(r => {
      if (!r.ok) throw new Error('Wallpaper catalog could not load');
      return r.json();
    }).catch(e => { catalogPromise = null; throw e; });
    const catalog = await catalogPromise;
    if (catalog.repository !== 'dharmx/walls' || !/^[a-f0-9]{40}$/.test(catalog.revision)) throw new Error('Invalid wallpaper catalog');
    const minimum = settings.wallpaper_online_quality === '4k' ? [3840,2160] : [1920,1080];
    let items = (catalog.topics[settings.wallpaper_online_topic || 'abstract'] || []).filter(i =>
      /^[a-f0-9]{40}$/.test(i.sha) && /^[a-z0-9_/. -]+\.(jpg|jpeg|png)$/i.test(i.path) && !i.path.includes('..') && i.width >= minimum[0] && i.height >= minimum[1]);
    const offset = [...key].reduce((n,c) => n + c.charCodeAt(0),0) % Math.max(1,items.length);
    items = items.slice(offset).concat(items.slice(0,offset));
    return items.map(item => ({ page: { github: item }, photo: {
      image: '', githubSHA: item.sha, width: item.width, height: item.height, provider: 'GitHub collection',
      source: `https://github.com/dharmx/walls/blob/${catalog.revision}/${item.path}`,
      title: item.path.split('/').pop().replace(/_/g,' '), artist: 'See repository for source / artist', license: 'See source for usage rights'
    } }));
  }
  async function githubImage(sha, signal) {
    if (githubImages.has(sha)) return githubImages.get(sha);
    let disk;
    try {
      if (window.caches) {
        disk = await caches.open('aether-wallpaper-images-v1');
        const saved = await disk.match(new URL(`assets/wallpapers/cache-${sha}`, document.baseURI).href);
        if (saved) { const url = URL.createObjectURL(await saved.blob()); rememberImage(sha,url); return url; }
      }
    } catch {}
    const response = await fetch(`https://api.github.com/repos/dharmx/walls/git/blobs/${sha}`, { signal, credentials: 'omit', headers: { Accept: 'application/vnd.github+json' } });
    if (!response.ok) throw new Error(`GitHub wallpaper HTTP ${response.status}${response.status === 403 || response.status === 429 ? ' (public API limit; try again later)' : ''}`);
    const data = await response.json();
    if (data.sha !== sha || data.encoding !== 'base64' || typeof data.content !== 'string' || data.content.length > 16000000 || data.size > 10000000) throw new Error('Invalid wallpaper image response');
    const raw = atob(data.content.replace(/\s/g,''));
    const bytes = Uint8Array.from(raw, c => c.charCodeAt(0));
    const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
    if (!png && !(bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)) throw new Error('Wallpaper is not a JPEG/PNG');
    const url = URL.createObjectURL(new Blob([bytes], { type: png ? 'image/png' : 'image/jpeg' }));
    rememberImage(sha,url);
    if (disk) try {
      await disk.put(new URL(`assets/wallpapers/cache-${sha}`, document.baseURI).href, new Response(new Blob([bytes], {type: png ? 'image/png' : 'image/jpeg'})));
      const keys = await disk.keys(); for (const old of keys.slice(0, Math.max(0,keys.length-6))) await disk.delete(old);
    } catch {}
    return url;
  }
  function rememberImage(sha,url) {
    githubImages.set(sha,url);
    while (githubImages.size > 6) {
      const first = [...githubImages.keys()].find(key => githubImages.get(key) !== current?.image && key !== sha);
      if (!first) break;
      URL.revokeObjectURL(githubImages.get(first)); githubImages.delete(first);
    }
  }
  const imageHosts = { unsplash: ['images.unsplash.com'], pexels: ['images.pexels.com'], pixabay: [], nexwall: ['nexwall.kodnextech.com','img.kodnextech.com'] };
  const sourceHosts = { unsplash: 'unsplash.com', pexels: 'www.pexels.com', pixabay: 'pixabay.com', nexwall: 'nexwall.kodnextech.com' };
  const providerNames = { unsplash: 'Unsplash', pexels: 'Pexels', pixabay: 'Pixabay', nexwall: 'NexWall' };
  function normalizeProvider(item, settings) {
    const id = item?.providerId;
    if (!Object.hasOwn(imageHosts,id)) return null;
    const w=item.width,h=item.height, quality=settings.wallpaper_online_quality || 'hd';
    if (!Number.isFinite(w) || !Number.isFinite(h)) return null;
    if (quality === 'screen' ? Math.min(w,h)<720 || Math.max(w,h)<1280 : w < (quality==='4k'?3840:1920) || h < (quality==='4k'?2160:1080)) return null;
    const source=allowedURL(item.source,sourceHosts[id]);
    const image=id==='pixabay' ? (/^\/api\/wallpapers\/image\?token=[a-f0-9]{64}$/.test(item.image) ? item.image : '') : imageHosts[id].map(host=>allowedURL(item.image,host)).find(Boolean);
    if (!image || !source || (id==='unsplash' && !/^[a-f0-9]{64}$/.test(item.selectionToken))) return null;
    return { image, source, providerId:id, provider:providerNames[id], title:plain(item.title), artist:plain(item.artist), license:plain(item.license), width:w,height:h,selectionToken:id==='unsplash'?item.selectionToken:'' };
  }
  async function boundedFetch(url, options={}, milliseconds=6000) {
    const controller=new AbortController(), parent=options.signal;
    const cancel=()=>controller.abort();
    if(parent?.aborted)cancel();else parent?.addEventListener('abort',cancel,{once:true});
    const timer=setTimeout(cancel,milliseconds);
    try { return await fetch(url,{...options,signal:controller.signal}); }
    finally { clearTimeout(timer);parent?.removeEventListener('abort',cancel); }
  }
  async function providerCandidates(settings, key, signal) {
    const provider=settings.wallpaper_online_provider || 'auto';
    const cacheKey=JSON.stringify([provider,settings.wallpaper_online_topic || 'abstract',settings.wallpaper_online_quality || 'hd',settings.wallpaper_online_search || '']);
    let batch=batches.get(cacheKey);
    if (!batch || Date.now()-batch.time>15*60000) {
      const params=new URLSearchParams({provider,topic:settings.wallpaper_online_topic || 'abstract',quality:settings.wallpaper_online_quality || 'hd',search:settings.wallpaper_online_search || ''});
      let records=[], problem='';
      if (serverAvailable !== false) {
        try {
          const response=await boundedFetch(`/api/wallpapers?${params}`,{signal,credentials:'omit'},8000);
          if (response.status===404 || response.headers?.get('content-type')?.includes('text/html')) { serverAvailable=false; throw new Error('Start scripts/serve.py to use server-configured providers'); }
          const data=await response.json();
          serverAvailable=true;
          if (!response.ok) throw new Error(data.error || `Wallpaper API HTTP ${response.status}`);
          serverAvailable=true; records=data.data || [];
        } catch(error) { if(signal.aborted) throw error; problem=error.message; }
      }
      if (!records.length && serverAvailable!==true && (provider==='auto' || provider==='nexwall')) {
        try {
          const params=new URLSearchParams({per_page:'10',search:settings.wallpaper_online_search || ({amoled:'black minimal',coast:'ocean',gaming:'video games',meme:'memes'}[settings.wallpaper_online_topic] || settings.wallpaper_online_topic || 'abstract'),sort:'popular'});
          const response=await boundedFetch(`https://nexwall.kodnextech.com/api/developer/v1/demo/wallpapers?${params}`,{signal,credentials:'omit'},4000);
          if (!response.ok) throw new Error(`NexWall demo HTTP ${response.status}`);
          const data=await response.json();
          records=(data.data || []).filter(i=>i.type==='image').map(i=>({providerId:'nexwall',image:i.image_url,source:'https://nexwall.kodnextech.com/wallpaper-api',width:i.width,height:i.height,title:i.tags,artist:'NexWall',license:i.license}));
        } catch(error) { if(signal.aborted)throw error; problem=error.message; }
      }
      const valid=records.map(i=>normalizeProvider(i,settings)).filter(Boolean);
      if (!valid.length && provider==='auto' && !settings.wallpaper_online_search) {
        return githubCandidates(settings,key,signal);
      }
      if (!valid.length) throw new Error(problem || 'No images at this resolution. Try Screen-fit for NexWall portraits, another search, or another provider');
      batch={time:Date.now(),photos:valid};batches.set(cacheKey,batch);
      while(batches.size>16)batches.delete(batches.keys().next().value);
    }
    const rotationKey=key.slice(0,key.lastIndexOf(':'));
    const offset=([...rotationKey].reduce((n,c)=>n+c.charCodeAt(0),0)+(Number(settings.wallpaper_online_next)||0))%batch.photos.length;
    return batch.photos.slice(offset).concat(batch.photos.slice(0,offset)).map(photo=>({photo,page:null}));
  }
  function providerStatus() {
    const el=document.getElementById('wallpaper-provider-setup');if(!el)return;
    if (!capabilitiesRequest) capabilitiesRequest=boundedFetch('/api/wallpapers/providers',{credentials:'omit'},4000).then(async r=>{
      if(!r.ok || r.headers?.get('content-type')?.includes('text/html'))throw new Error('No API server');
      const data=await r.json();return data.providers;
    }).catch(()=>null);
    capabilitiesRequest.then(items=>{
      if(!el.isConnected)return;
      el.textContent=Array.isArray(items) ? items.map(p=>`${providerNames[p.id] || p.id}: ${p.ready?(p.mode==='demo'?'limited demo':'ready'):p.reason}`).join(' · ') : 'Static hosting: GitHub collection and NexWall demo can work without a backend. Start scripts/serve.py for keyed providers.';
    });
  }
  function credit(photo, message = '') {
    const status = document.getElementById('wallpaper-online-status');
    statusText = message || (photo ? `${photo.title} — ${photo.artist} · ${photo.license}` : 'Using the local 4K fallback.');
    if (status) status.textContent = statusText;
    let link = document.getElementById('wallpaper-photo-credit');
    if (!photo) { link?.remove(); return; }
    if (!link) { link = document.createElement('a'); link.id = 'wallpaper-photo-credit'; document.body.append(link); }
    link.href = photo.source; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.textContent = photo.provider ? `${photo.provider} · ${photo.artist} · ${photo.width}×${photo.height} ↗` : `Photo: ${photo.artist} · ${photo.license} ↗`;
    link.title = `${photo.title} — ${photo.provider || 'Wikimedia Commons'}. Cropped to fit. View source, artist and usage details.`;
  }
  function apply(photo, settings) {
    const el = document.getElementById('lg-wallpaper'); if (!el || settings.wallpaper_mode !== 'online') return;
    const dim = Math.min(85, Math.max(0, Number(settings.wallpaper_dim ?? 25))) / 100;
    el.style.backgroundImage = `linear-gradient(rgba(4,6,12,${dim}),rgba(4,6,12,${dim})), url("${photo.image}")`;
    el.style.backgroundSize = 'cover'; el.style.backgroundPosition = 'center'; el.style.backgroundRepeat = 'no-repeat';
    credit(photo);
  }
  function loadImage(url, settings) {
    const minimum = settings.wallpaper_online_quality === '4k' ? [3840, 2160] : [1920, 1080];
    return new Promise((resolve, reject) => {
      const image = new Image(); let timer;
      const done = error => { clearTimeout(timer); image.onload = image.onerror = null; error ? reject(error) : resolve(); };
      timer = setTimeout(() => done(new Error('Image timed out')), 15000);
      image.referrerPolicy = 'no-referrer';
      image.onload = () => done((settings.wallpaper_online_quality === 'screen' ? Math.min(image.naturalWidth,image.naturalHeight)>=720 && Math.max(image.naturalWidth,image.naturalHeight)>=1280 : image.naturalWidth >= minimum[0] && image.naturalHeight >= minimum[1]) ? null : new Error('Image is below the selected resolution'));
      image.onerror = () => done(new Error('Image failed to load')); image.src = url;
    });
  }
  function bucket(settings, date = new Date()) {
    const day = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const cadence = settings.wallpaper_rotation || 'daily';
    return `${settings.wallpaper_online_provider || 'auto'}:${settings.wallpaper_online_quality || 'hd'}:${settings.wallpaper_online_topic || 'abstract'}:${settings.wallpaper_online_search || ''}:${cadence === 'off' ? 'paused' : day + (cadence === 'hourly' ? ':' + date.getHours() : '')}:${settings.wallpaper_online_next || 0}`;
  }
  function stop() {
    generation++; request?.abort(); request = null; activeKey = ''; credit(null);
  }
  async function sync(settings) {
    if (settings.wallpaper_mode !== 'online') { stop(); return; }
    const previousStatus = statusText;
    if (current) apply(current, settings);
    const key = bucket(settings);
    const topic = `${settings.wallpaper_online_provider || 'auto'}:${settings.wallpaper_online_quality || 'hd'}:${settings.wallpaper_online_topic || 'abstract'}:${settings.wallpaper_online_search || ''}`, nonce = Number(settings.wallpaper_online_next) || 0;
    if (settings.wallpaper_rotation === 'off' && current && currentTopic === topic && currentNonce === nonce && activeKey !== key) {
      generation++; request?.abort(); activeKey = key;
      try { localStorage.setItem(storageKey, JSON.stringify({ key, page: currentPage })); } catch {}
      return;
    }
    if (activeKey === key) {
      if (previousStatus) credit(current, previousStatus);
      return;
    }
    if (Date.now() < retryAt && retryKey === key) { credit(current, lastError); return; }
    request?.abort(); const controller = new AbortController(); request = controller; const signal = controller.signal, ticket = ++generation;
    activeKey = key;
    const provider = settings.wallpaper_online_provider || 'auto';
    credit(current, provider === 'github' ? 'Loading online collection from GitHub…' : ['auto','unsplash','pexels','pixabay','nexwall'].includes(provider) ? 'Finding wallpapers from available providers…' : provider === 'wallhaven' ? 'Finding a SFW wallpaper through the server…' : 'Finding a public-domain photograph on Wikimedia Commons…');
    let timeout;
    try {
      let saved;
      try { saved = JSON.parse(localStorage.getItem(storageKey)); } catch {}
      // Treat storage as untrusted too. Re-run the exact provider validation.
      const cached = provider === 'commons' && saved?.key === key && normalize(saved.page);
      let candidates = cached ? [{ photo: cached, page: saved.page }] : [];
      if (['auto','unsplash','pexels','pixabay','nexwall'].includes(provider)) {
        timeout=setTimeout(()=>controller.abort(),18000);
        candidates=await providerCandidates(settings,key,signal);
      } else if (provider === 'github') {
        timeout = setTimeout(() => controller.abort(), 30000);
        candidates = await githubCandidates(settings, key, signal);
      } else if (!candidates.length && provider === 'wallhaven') {
        const params = new URLSearchParams({ topic: settings.wallpaper_online_topic || 'abstract', quality: settings.wallpaper_online_quality || 'hd', seed: key, search: settings.wallpaper_online_search || '' });
        timeout = setTimeout(() => controller.abort(), 20000);
        const response = await fetch(`/api/wallpapers?${params}`, { signal, credentials: 'omit' });
        if (response.status === 404 || response.headers?.get('content-type')?.includes('text/html')) throw new Error('Online wallpapers need the API server: python3 scripts/serve.py --port 4174');
        const data = await response.json(); clearTimeout(timeout);
        if (!response.ok) throw new Error(data.error || `Wallpaper API HTTP ${response.status}`);
        candidates = (data.data || []).map(item => ({ page: { wallhaven: item }, photo: normalizeWallhaven(item, settings) })).filter(c => c.photo);
        const offset=(Number(settings.wallpaper_online_next)||0)%Math.max(1,candidates.length);
        candidates=candidates.slice(offset).concat(candidates.slice(0,offset));
      } else if (!candidates.length) {
        const params = new URLSearchParams({ action: 'query', format: 'json', origin: '*', generator: 'search', gsrnamespace: '6', gsrlimit: '40',
          gsrsearch: `${settings.wallpaper_online_search || topics[settings.wallpaper_online_topic] || settings.wallpaper_online_topic || topics.landscape} filetype:bitmap ("CC0" OR "public domain")`, prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '3840', maxlag: '5' });
        timeout = setTimeout(() => controller.abort(), 12000);
        const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
        if (!response.ok) throw new Error(`Commons HTTP ${response.status}`);
        const data = await response.json(); clearTimeout(timeout); if (data.error) throw new Error('Commons is temporarily unavailable');
        candidates = Object.values(data.query?.pages || {}).map(page => ({ page, photo: normalize(page) })).filter(c => c.photo);
        // Rotate the result order daily and when Next is pressed; never use random retry loops.
        const offset = [...key].reduce((n, c) => n + c.charCodeAt(0), 0) % Math.max(1, candidates.length);
        candidates = candidates.slice(offset).concat(candidates.slice(0, offset));
      }
      let chosen;
      for (const candidate of candidates.slice(0, 3)) {
        if (ticket !== generation || signal.aborted || settings.wallpaper_mode !== 'online') return;
        try {
          if (candidate.photo.githubSHA) candidate.photo.image = await githubImage(candidate.photo.githubSHA, signal);
          await loadImage(candidate.photo.image, settings); chosen = candidate; break;
        } catch (error) {
          if (candidate === candidates.slice(0, 3).at(-1)) throw error;
        }
      }
      if (!chosen) {
        if (cached) { try { localStorage.removeItem(storageKey); } catch {} }
        throw new Error('No wallpaper at the selected resolution. Choose Allow HD or another theme.');
      }
      if (ticket !== generation || signal.aborted || settings.wallpaper_mode !== 'online') return;
      if (chosen.photo.selectionToken) {
        const tracked=await fetch('/api/wallpapers/select',{method:'POST',signal,credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:chosen.photo.selectionToken})});
        if(!tracked.ok)throw new Error('Could not record Unsplash selection; retry');
        if(ticket!==generation || settings.wallpaper_mode!=='online')return;
      }
      current = chosen.photo; currentPage = chosen.page; currentTopic = topic; currentNonce = nonce; apply(current, settings); retryAt = 0; lastError = '';
      try { localStorage.setItem(storageKey, JSON.stringify({ key, page: chosen.page })); } catch {}
    } catch (error) {
      if (ticket !== generation) return;
      retryAt = Date.now() + 10 * 60000; retryKey = key; activeKey = '';
      lastError = `${error.message}. ${current ? 'Keeping the previous photograph.' : 'Using the local 4K fallback.'} Retry available in 10 minutes.`;
      credit(current, lastError);
    } finally { clearTimeout(timeout); }
  }
  function next() {
    if (typeof SystemState === 'undefined' || SystemState.settings.wallpaper_mode !== 'online') return;
    if (Date.now() < nextAt || (Date.now() < retryAt && retryKey === bucket(SystemState.settings))) {
      credit(current, 'Please wait before requesting another photograph.'); return;
    }
    nextAt = Date.now() + 1500;
    SystemState.settings.wallpaper_online_next = (Number(SystemState.settings.wallpaper_online_next) || 0) + 1;
    SystemState.save(); sync(SystemState.settings);
  }
  function retry() {
    if (typeof SystemState === 'undefined' || Date.now() < nextAt) return;
    batches.clear(); serverAvailable=null; capabilitiesRequest=null; providerStatus();
    nextAt = Date.now() + 15000; retryAt = 0; activeKey = ''; sync(SystemState.settings);
  }
  function refreshStatus() {
    providerStatus();
    const status = document.getElementById('wallpaper-online-status');
    if (status && statusText) status.textContent = statusText;
  }
  window.AetherWebWallpapers = { refreshStatus, sync, stop, next, retry, normalize, normalizeWallhaven, normalizeProvider, bucket };
})();
