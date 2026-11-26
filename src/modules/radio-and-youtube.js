// AetherOS — Global Radio Browser v3 & Station Favorites
window.extendOS({
    _radioFavorites: [],

    loadRadioFavorites: () => {
                try { os._radioFavorites = JSON.parse(localStorage.getItem('AetherOS_RadioFavs') || '[]'); } catch { os._radioFavorites = []; }
            },

    saveRadioFavorites: () => {
                try { localStorage.setItem('AetherOS_RadioFavs', JSON.stringify(os._radioFavorites)); return true; } catch { Notifications.push('RADIO', 'Favorites could not be saved. Browser storage may be full or blocked.'); return false; }
            },

    toggleRadioFav: (station) => {
                os.loadRadioFavorites();
                const idx = os._radioFavorites.findIndex(s => s.stationuuid === station.stationuuid || s.url_resolved === station.url_resolved);
                if (idx >= 0) { os._radioFavorites.splice(idx, 1); Notifications.push('RADIO', `Removed: ${station.name}`); }
                else { os._radioFavorites.unshift(station); Notifications.push('RADIO', `Favorited: ${station.name}`); }
                os.saveRadioFavorites();
                os._rbRenderFavStar(station.stationuuid || station.url_resolved);
            },

    _rbRenderFavStar: (uuid) => {
                os.loadRadioFavorites();
                const isFav = os._radioFavorites.some(s => s.stationuuid === uuid || s.url_resolved === uuid);
                const sel = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(uuid) : String(uuid).replace(/"/g, '\\"');
                const btn = document.querySelector(`[data-rb-fav="${sel}"]`);
                if (btn) {
                    btn.innerHTML = `<i data-lucide="star" class="w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}"></i>`;
                    btn.className = (isFav ? 'text-yellow-400 ' : 'text-gray-600 hover:text-yellow-400 ') + 'p-1 cursor-none hover-target transition-colors flex-shrink-0';
                    if (window.lucide) lucide.createIcons({ root: btn });
                }
            },

    initRadioBrowser: () => {
                os.loadRadioFavorites();
                os.rbSwitchTab('trending');
                setTimeout(() => { os.rbSyncVolumeUI && os.rbSyncVolumeUI(); os.rbDrawIdleVisualizer && os.rbDrawIdleVisualizer(); os.rbApplyTonearmTransform && os.rbApplyTonearmTransform(); os.rbInitTonearmDrag && os.rbInitTonearmDrag(); os.rbRestoreNowPlayingUI && os.rbRestoreNowPlayingUI(); }, 50);
            },

    rbSwitchTab: (tab) => {
        os._rbCurrentTab = tab;
        os._rbRequest = (os._rbRequest || 0) + 1;
        const tabs = { search: 'rb-tab-search', favorites: 'rb-tab-favs', trending: 'rb-tab-trend' };
        Object.entries(tabs).forEach(([t, id]) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.className = `os-seg-btn hover-target cursor-none ${t === tab ? 'active' : ''}`;
        });
        const searchBar = document.getElementById('rb-search-bar');
        if (searchBar) searchBar.style.display = tab === 'favorites' ? 'none' : 'flex';
        if (tab === 'favorites') os.rbRenderFavorites();
        else if (tab === 'trending') os.searchRadioBrowser('');
        else os.searchRadioBrowser(document.getElementById('rb-search-input')?.value || '');
    },

    rbRenderFavorites: () => {
        os.loadRadioFavorites();
        const container = document.getElementById('rb-results');
        if (!container) return;
        if (!os._radioFavorites.length) {
            container.innerHTML = '<div class="p-8 text-center text-gray-400 text-xs flex flex-col items-center gap-2"><i data-lucide="star" class="w-5 h-5 text-gray-500"></i><div>No saved stations yet.<br>Star any station while browsing to save it here.</div></div>';
            if (window.lucide) lucide.createIcons({ root: container });
            return;
        }
        os._rbRenderStations(container, os._radioFavorites);
    },

    toggleRadioFavByIndex: (idx) => {
        const station = os._rbRenderedStations && os._rbRenderedStations[idx];
        if (station) os.toggleRadioFav(station);
    },

    playRadioStationByIndex: (idx) => {
        const station = os._rbRenderedStations && os._rbRenderedStations[idx];
        if (!station) return;
        const uuid = station.stationuuid || station.url_resolved || '';
        const tagsStr = (station.tags ? station.tags.split(',').slice(0, 3).join(' · ') : '') || station.country || 'World';
        os.playRadioBrowserStation(station.url_resolved || '', station.name || 'Radio Station', station.favicon || '', tagsStr, station.bitrate || 0, uuid);
    },

    _rbRenderStations: (container, data) => {
        container.innerHTML = '';
        os._rbRenderedStations = Array.isArray(data) ? data : [];
        if (!os._rbRenderedStations.length) {
            container.innerHTML = '<div class="p-6 text-center text-gray-400 text-xs">No matching stations found.</div>';
            return;
        }
        os.loadRadioFavorites();
        os._rbRenderedStations.forEach((station, idx) => {
            const el = document.createElement('div');
            el.className = 'flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all group cursor-none hover-target';
            const uuid = station.stationuuid || station.url_resolved || '';
            const isFav = os._radioFavorites.some((s) => (s.stationuuid || s.url_resolved) === uuid);
            const safeFavicon = station.favicon ? os.escapeHtml(station.favicon) : '';
            const iconHtml = safeFavicon ? `<img src="${safeFavicon}" class="w-full h-full object-cover rounded-lg" onerror="this.style.display='none'">` : '';
            const tagsStr = (station.tags ? station.tags.split(',').slice(0, 3).join(' · ') : '') || station.country || 'World';
            el.innerHTML = `
                <div class="flex items-center gap-2.5 overflow-hidden flex-1" onclick="os.playRadioStationByIndex(${idx})">
                    <div class="w-9 h-9 rounded-lg bg-black/60 shrink-0 flex items-center justify-center border border-white/10 overflow-hidden relative">
                        ${iconHtml}
                        <i data-lucide="radio" class="w-3.5 h-3.5 text-gray-500 absolute" style="${safeFavicon ? 'opacity:0' : ''}"></i>
                    </div>
                    <div class="truncate">
                        <div class="text-white text-xs font-medium truncate">${os.escapeHtml(station.name || 'Radio Station')}</div>
                        <div class="text-[11px] text-gray-400 truncate mt-0.5">${os.escapeHtml(tagsStr)}${station.country ? ' · ' + os.escapeHtml(station.country) : ''}</div>
                    </div>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                    <span class="text-[10.5px] font-mono text-gray-400 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">${Number(station.bitrate) > 0 ? Number(station.bitrate) + 'k' : 'Unknown bitrate'}</span>
                    <button type="button" data-rb-fav="${os.escapeHtml(uuid)}" onclick="event.stopPropagation();os.toggleRadioFavByIndex(${idx})" class="${isFav ? 'text-amber-300 ' : 'text-gray-500 hover:text-amber-300 '}p-1 cursor-none hover-target transition-colors" aria-label="Toggle favorite"><i data-lucide="star" class="w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}"></i></button>
                    <button type="button" onclick="os.playRadioStationByIndex(${idx})" class="w-8 h-8 bg-white/[0.06] rounded-lg flex items-center justify-center group-hover:bg-sky-400 group-hover:text-slate-950 transition-all cursor-none hover-target" aria-label="Play station">
                        <i data-lucide="play" class="w-3.5 h-3.5 fill-current ml-0.5"></i>
                    </button>
                </div>`;
            container.appendChild(el);
        });
        if (window.lucide) lucide.createIcons({ root: container });
    },

    searchRadioBrowser: async (query) => {
        const request = os._rbRequest = (os._rbRequest || 0) + 1;
        const container = document.getElementById('rb-results');
        if (!container) return;
        container.innerHTML = '<div class="p-6 text-center text-gray-400 text-xs">Loading stations...</div>';
        const genre = document.getElementById('rb-genre-select')?.value || '';
        const country = document.getElementById('rb-country-select')?.value || '';
        const mirrors = [
            'https://de1.api.radio-browser.info',
            'https://nl1.api.radio-browser.info',
            'https://fi1.api.radio-browser.info',
            'https://at1.api.radio-browser.info'
        ];
        let lastErr = null;
        for (const host of mirrors) {
            try {
                let url = `${host}/json/stations/search?limit=60&order=clickcount&reverse=true&hidebroken=true`;
                if (query) url += `&name=${encodeURIComponent(query)}`;
                if (genre) url += `&tag=${encodeURIComponent(genre)}`;
                if (country) url += `&countrycode=${encodeURIComponent(country)}`;
                const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const data = await res.json();
                if (request !== os._rbRequest || !container.isConnected) return;
                os._rbRenderStations(container, data);
                return;
            } catch (e) {
                if (request !== os._rbRequest || !container.isConnected) return;
                lastErr = e;
            }
        }
        container.innerHTML = `<div class="p-6 text-center text-rose-300 text-xs">Radio directory unavailable (${os.escapeHtml(lastErr?.message || 'network error')})</div>`;
    },

    playRadioBrowserStation: (url, name, favicon, tags, bitrate, uuid) => {
                try { const stream = new URL(url); if (!['https:', 'http:'].includes(stream.protocol) || stream.username || stream.password) throw new Error(); } catch { Notifications.push('RADIO', 'Invalid stream URL. Choose another station.'); return; }
                os.stopFullTrackPlayback?.();
                os.initAudioEngine();
                if(os.audioStream) { try { os.audioStream.pause(); os.audioStream.src = ''; } catch(e){} }
                os._rbNowPlaying = { url_resolved: url, stationuuid: uuid, name, favicon, tags, bitrate };
                os.rbApplyPalette(os.rbHashPalette(`${name} ${tags}`));
                if (favicon) os.rbExtractPalette(favicon, `${name} ${tags}`);
                os.audioStream.src = url;
                os.audioStream.volume = Math.max(0, Math.min(1, Number(SystemState.settings.media_tuner_volume ?? 0.7)));
                os.rbSyncVolumeUI && os.rbSyncVolumeUI();
                os.audioStream.play().then(() => {
                    if (os.companion && os.companion.observeEvent) {
                        os.companion.observeEvent('radio_play', { name, tags });
                    }
                    const nameEl = document.getElementById('rb-now-playing-name');
                    const tagsEl = document.getElementById('rb-now-playing-tags');
                    const iconEl = document.getElementById('rb-now-playing-icon');
                    const dotEl  = document.getElementById('rb-live-dot');
                    const lblEl  = document.getElementById('rb-live-lbl');
                    const bitrateEl = document.getElementById('rb-bitrate-lbl');
                    const favBtn = document.getElementById('rb-fav-now-btn');
                    if(nameEl) nameEl.innerText = name;
                    if(tagsEl) tagsEl.innerText = tags || 'LIVE STREAM';
                    if(bitrateEl) bitrateEl.innerText = bitrate ? bitrate+'kbps' : '';
                    if(dotEl) dotEl.className = 'w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse';
                    if(lblEl) { lblEl.innerText = 'ON AIR'; lblEl.className = 'text-[8px] text-green-400'; }
                    if(iconEl) iconEl.innerHTML = favicon ? `<img src="${os.escapeHtml(favicon)}" class="w-full h-full object-cover" onerror="this.style.display='none'">` : '<i data-lucide="radio" class="w-4 h-4 text-green-400 animate-pulse"></i>';
                    os.loadRadioFavorites();
                    const isFav = os._radioFavorites.some(s => (s.stationuuid||s.url_resolved) === uuid);
                    if(favBtn) { favBtn.innerHTML = isFav ? '★ Favorited' : '☆ Favorite'; }
                    const vinyl = document.getElementById('rb-vinyl');
                    const tonearm = document.getElementById('rb-tonearm');
                    if (vinyl) vinyl.classList.add('playing');
                    if (tonearm) tonearm.classList.add('playing');
                    os.rbStartAudioVisualizer && os.rbStartAudioVisualizer();
                    const sidebarName = document.getElementById('sidebar-radio-name');
                    const sidebarTags = document.getElementById('sidebar-radio-tags');
                    const sidebarIcon = document.getElementById('sidebar-radio-icon');
                    const sidebarFallback = document.getElementById('sidebar-radio-fallback');
                    const sidebarStatus = document.getElementById('sidebar-radio-status');
                    if(sidebarName) sidebarName.innerText = name;
                    if(sidebarTags) sidebarTags.innerText = tags || 'LIVE STREAM';
                    if(sidebarStatus) sidebarStatus.className = 'w-2 h-2 rounded-full bg-green-500 animate-pulse';
                    if(favicon) { if(sidebarIcon) { sidebarIcon.src=favicon; sidebarIcon.classList.remove('hidden'); } if(sidebarFallback) sidebarFallback.classList.add('hidden'); }
                    else { if(sidebarIcon) sidebarIcon.classList.add('hidden'); if(sidebarFallback) sidebarFallback.classList.remove('hidden'); }
                    SystemState.settings.media_tuner_station = 'external';
                    os.updatePlayStateVisuals(false);
                    os.logTerminal(`Radio Browser: Uplink ▶ ${name}`);
                    os.rbFetchStationGif(os._rbNowPlaying);
                    lucide.createIcons({root: document.getElementById('win-radiobrowser')});
                }).catch(e => os.logTerminal(`Radio Browser Error: ${e.message}`));
            },

    rbApplyTonearmTransform: () => {
                const arm = document.getElementById('rb-tonearm');
                if (!arm) return;
                const x = Number(SystemState.settings.radio_tonearm_x || 0);
                const y = Number(SystemState.settings.radio_tonearm_y || 0);
                const rot = Number(SystemState.settings.radio_tonearm_rot || 0);
                arm.style.setProperty('--arm-x', x + 'px');
                arm.style.setProperty('--arm-y', y + 'px');
                arm.style.setProperty('--arm-rot', rot + 'deg');
                const editing = SystemState.settings.radio_tonearm_edit === 'on';
                arm.classList.toggle('tonearm-edit', editing);
                arm.title = editing ? 'Drag to reposition · mouse wheel to rotate · double-click to reset' : 'Tonearm locked · enable Tonearm Edit in settings';
                os.rbSyncSettingsMenu && os.rbSyncSettingsMenu();
            },

    rbSaveTonearm: (x, y, rot) => {
                SystemState.settings.radio_tonearm_x = Math.max(-48, Math.min(48, Number(x) || 0));
                SystemState.settings.radio_tonearm_y = Math.max(-42, Math.min(42, Number(y) || 0));
                SystemState.settings.radio_tonearm_rot = Math.max(-45, Math.min(45, Number(rot) || 0));
                SystemState.save();
                os.rbApplyTonearmTransform();
            },

    rbResetTonearm: () => {
                os.rbSaveTonearm(0, 0, 0);
                os.logTerminal && os.logTerminal('Radio Browser: tonearm alignment reset.');
            },

    rbSetTonearmEdit: (enabled) => {
                SystemState.settings.radio_tonearm_edit = enabled ? 'on' : 'off';
                SystemState.save();
                os.rbApplyTonearmTransform();
                os.rbSyncSettingsMenu && os.rbSyncSettingsMenu();
                os.logTerminal && os.logTerminal(`Radio Browser: tonearm edit ${enabled ? 'enabled' : 'locked'}.`);
            },

    rbToggleTonearmEdit: () => {
                os.rbSetTonearmEdit(SystemState.settings.radio_tonearm_edit !== 'on');
            },

    rbDisableTonearmEdit: () => {
                os.rbSetTonearmEdit(false);
            },

    rbInitTonearmDrag: () => {
                const arm = document.getElementById('rb-tonearm');
                if (!arm || arm.dataset.dragReady === '1') return;
                arm.dataset.dragReady = '1';
                let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
                arm.addEventListener('pointerdown', (e) => {
                    if (SystemState.settings.radio_tonearm_edit !== 'on') return;
                    dragging = true;
                    sx = e.clientX; sy = e.clientY;
                    ox = Number(SystemState.settings.radio_tonearm_x || 0);
                    oy = Number(SystemState.settings.radio_tonearm_y || 0);
                    arm.classList.add('dragging');
                    try { arm.setPointerCapture(e.pointerId); } catch(_) {}
                    e.preventDefault(); e.stopPropagation();
                });
                arm.addEventListener('pointermove', (e) => {
                    if (!dragging) return;
                    const nx = ox + (e.clientX - sx);
                    const ny = oy + (e.clientY - sy);
                    os.rbSaveTonearm(nx, ny, SystemState.settings.radio_tonearm_rot || 0);
                });
                const stop = (e) => {
                    if (!dragging) return;
                    dragging = false;
                    arm.classList.remove('dragging');
                    os.logTerminal && os.logTerminal(`Radio Browser: tonearm adjusted x=${Math.round(SystemState.settings.radio_tonearm_x || 0)}, y=${Math.round(SystemState.settings.radio_tonearm_y || 0)}, rot=${Math.round(SystemState.settings.radio_tonearm_rot || 0)}°.`);
                };
                arm.addEventListener('pointerup', stop);
                arm.addEventListener('pointercancel', stop);
                arm.addEventListener('wheel', (e) => {
                    if (SystemState.settings.radio_tonearm_edit !== 'on') return;
                    const cur = Number(SystemState.settings.radio_tonearm_rot || 0);
                    os.rbSaveTonearm(SystemState.settings.radio_tonearm_x || 0, SystemState.settings.radio_tonearm_y || 0, cur + (e.deltaY > 0 ? 2 : -2));
                    e.preventDefault(); e.stopPropagation();
                }, { passive:false });
                arm.addEventListener('dblclick', (e) => { if (SystemState.settings.radio_tonearm_edit === 'on') os.rbResetTonearm(); e.preventDefault(); e.stopPropagation(); });
                os.rbApplyTonearmTransform();
            },

    rbHashPalette: (seed='radio') => {
                let h = 0; for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
                const hue = h % 360;
                return [`hsl(${hue}, 82%, 62%)`, `hsl(${(hue+42)%360}, 90%, 66%)`, `hsl(${(hue+196)%360}, 86%, 64%)`, `hsl(${(hue+300)%360}, 92%, 72%)`];
            },

    rbApplyPalette: (colors) => {
                os._rbPalette = (colors && colors.length ? colors : ['#22c55e','#38bdf8','#f472b6','#facc15']).slice(0,5);
                const active = document.querySelector('[data-rb-viz-color].active');
                if (active && os._rbPalette[0]) active.style.borderColor = os._rbPalette[0];
            },

    rbExtractPalette: (url='', seed='radio') => {
                const fallback = os.rbHashPalette(seed || url || 'radio');
                if (!url) { os.rbApplyPalette(fallback); return; }
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    try {
                        const c = document.createElement('canvas'); c.width = 28; c.height = 28;
                        const ctx = c.getContext('2d', { willReadFrequently: true });
                        ctx.drawImage(img, 0, 0, c.width, c.height);
                        const data = ctx.getImageData(0,0,c.width,c.height).data;
                        const buckets = {};
                        for (let i=0;i<data.length;i+=4) {
                            const r=data[i], g=data[i+1], b=data[i+2], a=data[i+3];
                            if (a<180) continue;
                            const max=Math.max(r,g,b), min=Math.min(r,g,b), sat=max-min, lum=(r+g+b)/3;
                            if (lum < 28 || lum > 238 || sat < 22) continue;
                            const key = `${Math.round(r/28)*28},${Math.round(g/28)*28},${Math.round(b/28)*28}`;
                            buckets[key] = (buckets[key] || 0) + sat * 1.8 + (128 - Math.abs(lum-128)) * .42;
                        }
                        const colors = Object.entries(buckets).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k]) => `rgb(${k})`);
                        os.rbApplyPalette(colors.length ? colors : fallback);
                    } catch(e) { os.rbApplyPalette(fallback); }
                };
                img.onerror = () => os.rbApplyPalette(fallback);
                img.src = url;
                setTimeout(() => { if (!os._rbPalette) os.rbApplyPalette(fallback); }, 1600);
            },

    rbSettingsMenuHTML: () => `
                <div class="rb-settings-title">Visualizer Look</div>
                <div class="rb-settings-grid mb-2">
                    <button onclick="os.rbSetVizLook('apple')" data-rb-viz-look="apple" class="rb-setting-btn hover-target">Apple Wave</button>
                    <button onclick="os.rbSetVizLook('nts')" data-rb-viz-look="nts" class="rb-setting-btn hover-target">NTS Bars</button>
                    <button onclick="os.rbSetVizLook('vinylring')" data-rb-viz-look="vinylring" class="rb-setting-btn hover-target">Vinyl Ring</button>
                    <button onclick="os.rbSetVizLook('broadcast')" data-rb-viz-look="broadcast" class="rb-setting-btn hover-target">Broadcast</button>
                    <button onclick="os.rbSetVizLook('particles')" data-rb-viz-look="particles" class="rb-setting-btn hover-target">Particles</button>
                    <button onclick="os.rbSetVizLook('circular')" data-rb-viz-look="circular" class="rb-setting-btn hover-target">Circular</button>
                    <button onclick="os.rbSetVizLook('horizon')" data-rb-viz-look="horizon" class="rb-setting-btn hover-target">Horizon</button>
                    <button onclick="os.rbSetVizLook('vu')" data-rb-viz-look="vu" class="rb-setting-btn hover-target">VU Meters</button>
                    <button onclick="os.rbSetVizLook('thin')" data-rb-viz-look="thin" class="rb-setting-btn hover-target">Thin Line</button>
                    <button onclick="os.rbSetVizLook('glass')" data-rb-viz-look="glass" class="rb-setting-btn hover-target">Glass Liquid</button>
                    <button onclick="os.rbSetVizLook('led')" data-rb-viz-look="led" class="rb-setting-btn hover-target">LED Analyzer</button>
                    <button onclick="os.rbSetVizLook('obs')" data-rb-viz-look="obs" class="rb-setting-btn hover-target">OBS Meter</button>
                </div>
                <div class="rb-settings-title">Color Source</div>
                <div class="rb-settings-grid mb-2">
                    <button onclick="os.rbSetVizColor('palette')" data-rb-viz-color="palette" class="rb-setting-btn hover-target">IMG/GIF</button>
                    <button onclick="os.rbSetVizColor('neon')" data-rb-viz-color="neon" class="rb-setting-btn hover-target">Neon</button>
                    <button onclick="os.rbSetVizColor('matrix')" data-rb-viz-color="matrix" class="rb-setting-btn hover-target">Matrix</button>
                    <button onclick="os.rbSetVizColor('mono')" data-rb-viz-color="mono" class="rb-setting-btn hover-target">Mono</button>
                </div>
                <div class="rb-settings-title">Ambience</div>
                <div class="rb-settings-grid mb-2">
                    <button onclick="os.rbToggleGif()" data-rb-gif-toggle="1" class="rb-setting-btn hover-target">GIF Mood Layer</button>
                    <button onclick="os.rbToggleTonearmEdit()" data-rb-tonearm-edit="1" class="rb-setting-btn hover-target">Tonearm Edit</button>
                    <button onclick="os.rbResetTonearm()" class="rb-setting-btn hover-target">Reset Tonearm</button>
                    <button onclick="os.rbDisableTonearmEdit()" class="rb-setting-btn hover-target">Lock Tonearm</button>
                </div>
                <div class="rb-settings-title">GIF Provider</div>
                <div class="rb-settings-grid">
                    <button onclick="os.rbSetGifProvider('nekos')" data-rb-gif-provider="nekos" class="rb-setting-btn hover-target">Nekos Anime</button>
                    <button onclick="os.rbSetGifProvider('giphy')" data-rb-gif-provider="giphy" class="rb-setting-btn hover-target">Giphy Public</button>
                    <button onclick="os.rbSetGifProvider('tenor')" data-rb-gif-provider="tenor" class="rb-setting-btn hover-target">Tenor Public</button>
                    <button onclick="os.rbSetGifProvider('mixed')" data-rb-gif-provider="mixed" class="rb-setting-btn hover-target">Mixed Auto</button>
                </div>
            `,

    rbEnsureSettingsPortal: () => {
                let menu = document.getElementById('rb-settings-menu-portal');
                if (!menu) {
                    menu = document.createElement('div');
                    menu.id = 'rb-settings-menu-portal';
                    menu.className = 'rb-settings-pop hidden';
                    document.body.appendChild(menu);
                }
                menu.innerHTML = os.rbSettingsMenuHTML();
                return menu;
            },

    rbPositionSettingsPortal: () => {
                const menu = os.rbEnsureSettingsPortal();
                const root = document.getElementById('win-radiobrowser') || document.getElementById('rb-root');
                const rect = root ? root.getBoundingClientRect() : { right: window.innerWidth - 16, top: 64 };
                const width = Math.min(430, window.innerWidth - 18);
                const estimatedHeight = Math.min(520, window.innerHeight - 18);
                const left = Math.max(9, Math.min(window.innerWidth - width - 9, rect.right - width - 18));
                const top = Math.max(9, Math.min(window.innerHeight - estimatedHeight - 9, rect.top + 48));
                menu.style.width = width + 'px';
                menu.style.left = left + 'px';
                menu.style.top = top + 'px';
                os.rbSyncSettingsMenu();
                if (window.lucide) lucide.createIcons({ root: menu });
                requestAnimationFrame(() => {
                    const r = menu.getBoundingClientRect();
                    if (r.bottom > window.innerHeight - 9) menu.style.top = Math.max(9, window.innerHeight - r.height - 9) + 'px';
                    if (r.right > window.innerWidth - 9) menu.style.left = Math.max(9, window.innerWidth - r.width - 9) + 'px';
                });
            },

    rbSyncSettingsMenu: () => {
                const look = os._rbVizLook || 'apple';
                const color = os._rbVizColorMode || 'palette';
                document.querySelectorAll('[data-rb-viz-look]').forEach(btn => btn.classList.toggle('active', btn.dataset.rbVizLook === look));
                document.querySelectorAll('[data-rb-viz-color]').forEach(btn => btn.classList.toggle('active', btn.dataset.rbVizColor === color));
                document.querySelectorAll('[data-rb-gif-toggle]').forEach(btn => btn.classList.toggle('active', SystemState.settings.radio_gif_enabled !== 'off'));
                document.querySelectorAll('[data-rb-tonearm-edit]').forEach(btn => btn.classList.toggle('active', SystemState.settings.radio_tonearm_edit === 'on'));
                document.querySelectorAll('[data-rb-gif-provider]').forEach(btn => btn.classList.toggle('active', btn.dataset.rbGifProvider === (SystemState.settings.radio_gif_provider || 'nekos')));
            },

    rbToggleSettingsMenu: () => {
                const embedded = document.getElementById('rb-settings-menu');
                if (embedded) embedded.classList.add('hidden');
                const menu = os.rbEnsureSettingsPortal();
                const willShow = menu.classList.contains('hidden');
                if (willShow) {
                    os.rbPositionSettingsPortal();
                    menu.classList.remove('hidden');
                    setTimeout(() => {
                        const close = (e) => {
                            const portal = document.getElementById('rb-settings-menu-portal');
                            const radioWin = document.getElementById('win-radiobrowser');
                            if (portal && !portal.contains(e.target) && !(radioWin && radioWin.contains(e.target) && e.target.closest('[onclick*="rbToggleSettingsMenu"]'))) {
                                portal.classList.add('hidden');
                                document.removeEventListener('mousedown', close);
                            }
                        };
                        document.addEventListener('mousedown', close);
                    }, 30);
                } else {
                    menu.classList.add('hidden');
                }
            },

    rbSetVizLook: (look='led') => {
                os._rbVizLook = look;
                document.querySelectorAll('[data-rb-viz-look]').forEach(btn => btn.classList.toggle('active', btn.dataset.rbVizLook === look));
                os.rbSyncSettingsMenu && os.rbSyncSettingsMenu();
                os.logTerminal && os.logTerminal(`Radio Browser: visualizer look set to ${look.toUpperCase()}.`);
            },

    rbSetVizColor: (mode='palette') => {
                os._rbVizColorMode = mode;
                document.querySelectorAll('[data-rb-viz-color]').forEach(btn => btn.classList.toggle('active', btn.dataset.rbVizColor === mode));
                os.rbSyncSettingsMenu && os.rbSyncSettingsMenu();
                os.logTerminal && os.logTerminal(`Radio Browser: spectrum color source set to ${mode.toUpperCase()}.`);
            },

    rbSetVizTheme: (theme='led') => {
                // Back-compat shim: older buttons mapped look+color together.
                if (['led','obs','spectrum','scope'].includes(theme)) os.rbSetVizLook(theme);
                else os.rbSetVizColor(theme);
            },

    rbCycleVizMode: () => {
                const looks = ['apple','nts','vinylring','broadcast','particles','circular','horizon','vu','thin','glass','led','obs','spectrum','scope'];
                const cur = os._rbVizLook || 'apple';
                os.rbSetVizLook(looks[(looks.indexOf(cur)+1) % looks.length]);
            },

    rbRestoreNowPlayingUI: () => {
                const st = os._rbNowPlaying;
                if (!st) return;
                const nameEl = document.getElementById('rb-now-playing-name');
                const tagsEl = document.getElementById('rb-now-playing-tags');
                const iconEl = document.getElementById('rb-now-playing-icon');
                const bitrateEl = document.getElementById('rb-bitrate-lbl');
                if (nameEl) nameEl.innerText = st.name || 'RADIO STREAM';
                if (tagsEl) tagsEl.innerText = st.tags || 'LIVE STREAM';
                if (bitrateEl) bitrateEl.innerText = st.bitrate ? st.bitrate + 'kbps' : '';
                if (iconEl) iconEl.innerHTML = st.favicon ? `<img src="${st.favicon}" class="w-full h-full object-cover" onerror="this.style.display='none'">` : '<i data-lucide="radio" class="w-7 h-7 text-green-300/65"></i>';
                const playing = os.audioStream && !os.audioStream.paused && os.audioStream.src;
                const vinyl = document.getElementById('rb-vinyl'); if (vinyl) vinyl.classList.toggle('playing', !!playing);
                const dotEl = document.getElementById('rb-live-dot'); if (dotEl) dotEl.className = playing ? 'w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse' : 'w-1.5 h-1.5 rounded-full bg-gray-600';
                const lblEl = document.getElementById('rb-live-lbl'); if (lblEl) { lblEl.innerText = playing ? 'ON AIR' : 'STANDBY'; lblEl.className = playing ? 'text-[8px] text-green-400' : 'text-[8px] text-gray-600'; }
                if (playing) os.rbStartAudioVisualizer && os.rbStartAudioVisualizer();
                if (SystemState.settings.radio_gif_enabled !== 'off') os.rbFetchStationGif(st);
                if (window.lucide) lucide.createIcons({ root: document.getElementById('win-radiobrowser') || document.body });
            },

    rbDrawIdleVisualizer: () => {
                const canvas = document.getElementById('rb-visualizer-canvas');
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                const w = canvas.width = canvas.clientWidth || 420;
                const h = canvas.height = canvas.clientHeight || 90;
                ctx.clearRect(0,0,w,h);
                ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0,0,w,h);
                ctx.strokeStyle = 'rgba(255,255,255,.045)'; ctx.lineWidth = 1;
                for (let x=0; x<w; x+=18) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
                for (let y=0; y<h; y+=18) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
                ctx.strokeStyle = 'rgba(34,197,94,.22)';
                ctx.beginPath(); ctx.moveTo(0,h*.62); ctx.lineTo(w,h*.62); ctx.stroke();
                ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.font = '10px JetBrains Mono, monospace'; ctx.textAlign='center';
                ctx.fillText('AUDIO ANALYSER STANDBY', w/2, h/2);
            },

    rbStartAudioVisualizer: () => {
                const canvas = document.getElementById('rb-visualizer-canvas');
                if (!canvas || !os.audioStream) return;
                if (os._rbVizRaf) cancelAnimationFrame(os._rbVizRaf);
                os.rbSetVizLook(os._rbVizLook || 'apple');
                os.rbSetVizColor(os._rbVizColorMode || 'palette');
                try {
                    os._rbAudioCtx = os._rbAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
                    if (os._rbAudioCtx.state === 'suspended') os._rbAudioCtx.resume().catch(()=>{});
                    if (!os._rbMediaSource) os._rbMediaSource = os._rbAudioCtx.createMediaElementSource(os.audioStream);
                    os._rbAnalyser = os._rbAnalyser || os._rbAudioCtx.createAnalyser();
                    os._rbAnalyser.fftSize = 512;
                    os._rbAnalyser.smoothingTimeConstant = 0.74;
                    try { os._rbMediaSource.connect(os._rbAnalyser); } catch(e) {}
                    try { os._rbAnalyser.connect(os._rbAudioCtx.destination); } catch(e) {}
                    const lbl = document.getElementById('rb-viz-mode-lbl'); if (lbl) lbl.innerText = 'ANALYSER: LIVE';
                } catch(e) {
                    const lbl = document.getElementById('rb-viz-mode-lbl'); if (lbl) lbl.innerText = 'ANALYSER: SIM FALLBACK';
                    os._rbAnalyser = null;
                }
                const ctx = canvas.getContext('2d');
                const freq = new Uint8Array(256);
                const time = new Uint8Array(256);
                os._rbVizPeaks = os._rbVizPeaks || [];
                os._rbParticles = os._rbParticles || Array.from({length:70}, () => ({x:Math.random(), y:Math.random(), s:.4+Math.random()*1.8, v:.15+Math.random()*.9, a:.18+Math.random()*.8}));
                const hsl = (h,s,l,a=1) => `hsla(${h},${s}%,${l}%,${a})`;
                const palAt = (i, a=1) => {
                    const mode = os._rbVizColorMode || 'palette';
                    const pal = os._rbPalette || ['#f8fafc','#22c55e','#38bdf8','#f472b6','#facc15'];
                    if (mode === 'matrix') return `rgba(34,197,94,${a})`;
                    if (mode === 'mono') return `rgba(255,255,255,${a})`;
                    if (mode === 'neon') return hsl((i*41 + performance.now()*0.018)%360, 92, 66, a);
                    const c = pal[Math.abs(i) % pal.length];
                    if (/^hsl/.test(c)) return c.replace('hsl', 'hsla').replace(')', `, ${a})`);
                    if (/^rgb/.test(c)) return c.replace('rgb', 'rgba').replace(')', `, ${a})`);
                    return c + Math.round(a*255).toString(16).padStart(2,'0');
                };
                const avgRange = (arr, a, b) => {
                    a=Math.max(0,Math.floor(a)); b=Math.min(arr.length,Math.ceil(b));
                    let sum=0, n=0; for(let i=a;i<b;i++){sum+=arr[i]||0;n++;}
                    return n ? sum/n : 0;
                };
                const pathWave = (w,h, amp=1, smooth=false) => {
                    ctx.beginPath();
                    for (let i=0;i<time.length;i++) {
                        const x = i/(time.length-1)*w;
                        const y = h*.5 + ((time[i]-128)/128)*h*.34*amp;
                        if (i===0) ctx.moveTo(x,y); else if (smooth) {
                            const px = (i-.5)/(time.length-1)*w;
                            ctx.quadraticCurveTo(px, y, x, y);
                        } else ctx.lineTo(x,y);
                    }
                };
                const loop = (now=0) => {
                    if (!document.getElementById('rb-visualizer-canvas')) return;
                    const w = canvas.width = Math.max(260, canvas.clientWidth || 420);
                    const h = canvas.height = Math.max(72, canvas.clientHeight || 90);
                    const theme = os._rbVizLook || 'apple';
                    const colorMode = os._rbVizColorMode || 'palette';
                    if (os._rbAnalyser) { os._rbAnalyser.getByteFrequencyData(freq); os._rbAnalyser.getByteTimeDomainData(time); }
                    else {
                        freq.fill(0); time.fill(128);
                        canvas.setAttribute('aria-label', 'Audio analysis unavailable; flat display, not measured audio.');
                    }
                    const bass = avgRange(freq,0,18), mid = avgRange(freq,18,90), high = avgRange(freq,90,210);
                    const energy = (bass*1.25 + mid + high*.62)/3;
                    ctx.clearRect(0,0,w,h);
                    ctx.fillStyle = theme === 'apple' || theme === 'glass' ? 'rgba(0,0,0,.18)' : 'rgba(0,0,0,.42)';
                    ctx.fillRect(0,0,w,h);
                    // subtle grid only for technical themes
                    if (['led','obs','spectrum','nts'].includes(theme)) { ctx.strokeStyle='rgba(255,255,255,.035)'; for(let y=18;y<h;y+=18){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();} }

                    if (theme === 'apple') {
                        const grad = ctx.createLinearGradient(0,0,0,h); grad.addColorStop(0,'rgba(255,255,255,.04)'); grad.addColorStop(.5,palAt(0,.32)); grad.addColorStop(1,'rgba(255,255,255,.02)');
                        ctx.fillStyle = grad;
                        ctx.beginPath();
                        for(let i=0;i<96;i++){ const x=i/95*w; const f=freq[Math.floor(Math.pow(i/95,1.6)*180)]/255; const y=h*.5 - (Math.sin(i*.28+now*.002)*.08+f*.48)*h; i?ctx.lineTo(x,y):ctx.moveTo(x,y); }
                        for(let i=95;i>=0;i--){ const x=i/95*w; const f=freq[Math.floor(Math.pow(i/95,1.6)*180)]/255; const y=h*.5 + (Math.sin(i*.28+now*.002)*.08+f*.48)*h; ctx.lineTo(x,y); }
                        ctx.closePath(); ctx.shadowColor=palAt(1,.8); ctx.shadowBlur=18; ctx.fill(); ctx.shadowBlur=0;
                        ctx.strokeStyle='rgba(255,255,255,.68)'; ctx.lineWidth=1.1; pathWave(w,h,.34,true); ctx.stroke();
                    } else if (theme === 'nts') {
                        const count=84, bw=Math.max(1.5,w/count*.45), step=w/count;
                        for(let i=0;i<count;i++){ const idx=Math.floor(Math.pow(i/count,1.55)*freq.length); const v=Math.pow((freq[idx]||0)/255,1.25); const bh=Math.max(2,v*(h*.72)); const x=i*step; const y=h*.58-bh/2; ctx.fillStyle=i%7===0?'rgba(255,255,255,.92)':'rgba(255,255,255,.62)'; ctx.fillRect(x,y,bw,bh); }
                    } else if (theme === 'vinylring') {
                        const cx=w/2, cy=h/2, base=Math.min(w,h)*.22;
                        ctx.strokeStyle='rgba(255,255,255,.10)'; ctx.lineWidth=.7;
                        for(let r=base*.65;r<base*2.2;r+=5){ctx.beginPath();ctx.ellipse(cx,cy,r*1.95,r*.56,0,0,Math.PI*2);ctx.stroke();}
                        const bars=110; ctx.strokeStyle=palAt(0,.82); ctx.lineWidth=1;
                        for(let i=0;i<bars;i++){ const a=i/bars*Math.PI*2; const v=(freq[Math.floor(i/bars*150)]||0)/255; const r=base*(1.35+v*.75); const x1=cx+Math.cos(a)*base*1.55, y1=cy+Math.sin(a)*base*.44; const x2=cx+Math.cos(a)*r*1.65, y2=cy+Math.sin(a)*r*.50; ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke(); }
                        ctx.fillStyle='rgba(255,255,255,.9)'; ctx.fillRect(cx-1,cy-1,2,2);
                    } else if (theme === 'broadcast' || theme === 'scope') {
                        ctx.strokeStyle=theme==='broadcast'?'rgba(255,255,255,.82)':palAt(1,.9); ctx.lineWidth=1.25; pathWave(w,h,theme==='broadcast'?.72:1,true); ctx.stroke();
                        ctx.strokeStyle='rgba(255,255,255,.10)'; ctx.beginPath(); ctx.moveTo(0,h*.5); ctx.lineTo(w,h*.5); ctx.stroke();
                    } else if (theme === 'particles') {
                        const e=Math.min(1,energy/170); ctx.fillStyle='rgba(255,255,255,.06)'; ctx.fillRect(0,0,w,h);
                        os._rbParticles.forEach((p,i)=>{ p.x += (p.v*.0009 + e*.0018); if(p.x>1.05){p.x=-.05;p.y=Math.random();} const y=p.y*h + Math.sin(now*.001+i)*e*16; const size=p.s*(.7+e*1.8); ctx.fillStyle=palAt(i, .25+p.a*.55); ctx.beginPath(); ctx.arc(p.x*w,y,size,0,Math.PI*2); ctx.fill(); });
                    } else if (theme === 'circular') {
                        const cx=w/2, cy=h/2, r=Math.min(w,h)*.23, bars=96; ctx.strokeStyle='rgba(255,255,255,.10)'; ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
                        for(let i=0;i<bars;i++){ const a=i/bars*Math.PI*2-Math.PI/2; const v=Math.pow((freq[Math.floor(i/bars*180)]||0)/255,1.25); const inner=r, outer=r+v*Math.min(w,h)*.22; ctx.strokeStyle=palAt(i,.35+v*.65); ctx.lineWidth=1; ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*inner,cy+Math.sin(a)*inner);ctx.lineTo(cx+Math.cos(a)*outer,cy+Math.sin(a)*outer);ctx.stroke(); }
                    } else if (theme === 'horizon') {
                        ctx.strokeStyle='rgba(255,255,255,.25)'; ctx.beginPath(); ctx.moveTo(0,h*.70); ctx.lineTo(w,h*.70); ctx.stroke();
                        const grad=ctx.createLinearGradient(0,h*.15,0,h); grad.addColorStop(0,palAt(0,.42)); grad.addColorStop(1,'rgba(255,255,255,.02)'); ctx.fillStyle=grad; ctx.beginPath(); ctx.moveTo(0,h*.72); for(let i=0;i<110;i++){const x=i/109*w; const v=(freq[Math.floor(Math.pow(i/109,1.8)*170)]||0)/255; ctx.lineTo(x,h*.72-v*h*.48-Math.sin(i*.35+now*.003)*5);} ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.fill(); ctx.strokeStyle='rgba(255,255,255,.68)'; ctx.stroke();
                    } else if (theme === 'vu') {
                        const drawVU=(x,y,W,H,label,offset)=>{ ctx.fillStyle='rgba(255,255,255,.55)'; ctx.font='10px JetBrains Mono, monospace'; ctx.fillText(label,x,y+H*.52); const val=Math.min(1,(avgRange(freq,offset,offset+60)/190)); const segs=24; for(let i=0;i<segs;i++){ const on=i/segs<val; ctx.fillStyle=on?(i>18?'rgba(251,146,60,.92)':'rgba(255,255,255,.85)'):'rgba(255,255,255,.13)'; ctx.fillRect(x+24+i*(W-30)/segs,y+H*.35,(W-36)/segs,H*.28);} } ; drawVU(8,10,w/2-14,h*.7,'L',0); drawVU(w/2+4,10,w/2-14,h*.7,'R',40);
                    } else if (theme === 'thin') {
                        ctx.strokeStyle='rgba(255,255,255,.32)'; ctx.setLineDash([1,7]); ctx.beginPath();ctx.moveTo(0,h*.5);ctx.lineTo(w,h*.5);ctx.stroke();ctx.setLineDash([]); ctx.strokeStyle=palAt(0,.9); for(let i=0;i<24;i++){ const idx=i*8; const v=(freq[idx]||0)/255; if(v>.38){const x=i/23*w; ctx.beginPath();ctx.moveTo(x,h*.5-v*h*.42);ctx.lineTo(x,h*.5+v*h*.42);ctx.stroke();}}
                    } else if (theme === 'glass') {
                        const grad=ctx.createLinearGradient(0,0,w,h); grad.addColorStop(0,'rgba(255,255,255,.08)'); grad.addColorStop(.35,palAt(0,.26)); grad.addColorStop(1,'rgba(255,255,255,.02)'); ctx.fillStyle=grad; ctx.beginPath(); for(let i=0;i<100;i++){const x=i/99*w; const v=(freq[Math.floor(Math.pow(i/99,1.65)*180)]||0)/255; const y=h*.58-Math.sin(i*.22+now*.002)*h*.08-v*h*.34; i?ctx.lineTo(x,y):ctx.moveTo(x,y);} for(let i=99;i>=0;i--){const x=i/99*w; const v=(freq[Math.floor(Math.pow(i/99,1.65)*180)]||0)/255; const y=h*.68+Math.sin(i*.28+now*.002)*h*.06+v*h*.16; ctx.lineTo(x,y);} ctx.closePath(); ctx.shadowColor='rgba(255,255,255,.35)';ctx.shadowBlur=14;ctx.fill();ctx.shadowBlur=0; ctx.strokeStyle='rgba(255,255,255,.55)'; pathWave(w,h,.28,true); ctx.stroke();
                    } else if (theme === 'led' || theme === 'obs' || theme === 'spectrum') {
                        const count = theme === 'obs' ? 72 : 56, gap=theme==='led'?3:2, bw=Math.max(theme==='led'?4:2.5,(w-(count-1)*gap)/count);
                        for(let i=0;i<count;i++){ const t=i/(count-1); const idx=Math.min(freq.length-1,Math.floor(Math.pow(t,1.82)*(freq.length-1))); const val=((freq[idx]||0)+(freq[Math.min(freq.length-1,idx+1)]||0)+(freq[Math.max(0,idx-1)]||0))/3; const norm=Math.min(1,Math.pow(val/230,1.16)); const bh=Math.max(2,norm*(h-18)); const x=i*(bw+gap), y=h-bh-7; os._rbVizPeaks[i]=Math.max((os._rbVizPeaks[i]||h-8)-(theme==='led'?1.2:1.8),y); if(theme==='led'){const segH=4,segGap=2,segs=Math.floor(bh/(segH+segGap)); for(let s=0;s<segs;s++){const sy=h-8-(s+1)*(segH+segGap);ctx.fillStyle=sy/h<.25?'rgba(239,68,68,.92)':sy/h<.48?'rgba(250,204,21,.90)':'rgba(34,197,94,.88)';ctx.fillRect(x,sy,bw,segH);} } else {ctx.fillStyle=theme==='obs'?`rgba(${Math.round(80+norm*170)},${Math.round(190+norm*50)},${Math.round(220-norm*100)},.86)`:palAt(i,.85);ctx.fillRect(x,y,bw,bh);} ctx.fillStyle='rgba(255,255,255,.70)';ctx.fillRect(x,os._rbVizPeaks[i],bw,1.2); }
                    }
                    if (!['nts','particles','vinylring','circular','vu','thin'].includes(theme)) { ctx.lineWidth=1.2; ctx.strokeStyle=colorMode==='matrix'?'rgba(74,222,128,.55)':colorMode==='mono'?'rgba(255,255,255,.46)':'rgba(255,255,255,.34)'; pathWave(w,h,.34,true); ctx.stroke(); }
                    os._rbVizRaf = requestAnimationFrame(loop);
                };
                loop();
            },

    rbStopAudioVisualizer: () => {
                if (os._rbVizRaf) cancelAnimationFrame(os._rbVizRaf);
                os._rbVizRaf = null;
                const lbl = document.getElementById('rb-viz-mode-lbl'); if (lbl) lbl.innerText = 'ANALYSER: STANDBY';
                os.rbDrawIdleVisualizer && os.rbDrawIdleVisualizer();
                const vinyl = document.getElementById('rb-vinyl'); if (vinyl) vinyl.classList.remove('playing');
                const tonearm = document.getElementById('rb-tonearm'); if (tonearm) tonearm.classList.remove('playing');
            },

    rbGifCategoryForStation: (station={}) => {
                const raw = `${station.name || ''} ${station.tags || ''}`.toLowerCase();
                if (/lofi|chill|ambient|sleep|relax|jazz|classical/.test(raw)) return 'sleep';
                if (/dance|edm|electro|house|techno|club|pop|hits/.test(raw)) return 'dance';
                if (/rock|metal|punk|guitar/.test(raw)) return 'happy';
                if (/anime|japan|j-pop|kpop/.test(raw)) return 'smile';
                if (/news|talk|speech|podcast/.test(raw)) return 'wave';
                if (/love|romance|slow/.test(raw)) return 'hug';
                return ['dance','happy','smile','wave','sleep'][Math.floor(Math.random()*5)];
            },

    rbSetGifUI: (gifUrl='', label='GIF AMBIENCE') => {
                const bg = document.getElementById('rb-gif-bg');
                if (bg && gifUrl) {
                    bg.style.backgroundImage = `url('${gifUrl}')`;
                    bg.classList.toggle('hidden', SystemState.settings.radio_gif_enabled === 'off');
                    os.rbExtractPalette && os.rbExtractPalette(gifUrl, label);
                }
                const badge = document.getElementById('rb-gif-badge');
                if (badge) badge.innerText = label;
            },

    rbSetGifProvider: (provider='nekos') => {
                SystemState.settings.radio_gif_provider = provider;
                SystemState.save();
                os.rbSyncSettingsMenu && os.rbSyncSettingsMenu();
                os.logTerminal && os.logTerminal(`Radio Browser: GIF provider set to ${provider.toUpperCase()}.`);
                if (SystemState.settings.radio_gif_enabled !== 'off' && os._rbNowPlaying) os.rbFetchStationGif(os._rbNowPlaying);
            },

    rbGifSearchTerm: (station={}, category='dance') => {
                const raw = `${station.name || ''} ${station.tags || ''}`.toLowerCase();
                if (/lofi|chill|ambient|sleep|relax/.test(raw)) return 'anime chill aesthetic gif';
                if (/jazz|classical/.test(raw)) return 'music aesthetic calm gif';
                if (/rock|metal|punk/.test(raw)) return 'rock concert anime gif';
                if (/news|talk|podcast/.test(raw)) return 'retro radio broadcast gif';
                if (/anime|japan|j-pop|kpop/.test(raw)) return 'anime music gif';
                if (/dance|edm|electro|house|techno|club|pop|hits/.test(raw)) return 'anime dance music gif';
                return `${category} music aesthetic gif`;
            },

    rbFetchGifFromProvider: async (provider, station={}, category='dance') => {
                const term = os.rbGifSearchTerm(station, category);
                if (provider === 'nekos') {
                    const r = await fetch(`https://nekos.best/api/v2/${encodeURIComponent(category)}?amount=3`, { signal: AbortSignal.timeout(7000) });
                    if (!r.ok) throw new Error('nekos failed');
                    const j = await r.json();
                    const list = (j.results || []).filter(x => x && x.url).map(x => ({ url:x.url, label:`NEKOS/${category.toUpperCase()}` }));
                    if (!list.length) throw new Error('nekos empty');
                    return list[Math.floor(Math.random()*list.length)];
                }
                if (provider === 'giphy') {
                    // Public beta key commonly used in Giphy docs/examples; no user API key needed.
                    const key = 'dc6zaTOxFJmzC';
                    const r = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(term)}&limit=12&rating=pg-13`, { signal: AbortSignal.timeout(8000) });
                    if (!r.ok) throw new Error('giphy failed');
                    const j = await r.json();
                    const list = (j.data || []).map(g => g.images?.downsized_medium?.url || g.images?.original?.url || g.images?.fixed_height?.url).filter(Boolean).map(url => ({ url, label:'GIPHY' }));
                    if (!list.length) throw new Error('giphy empty');
                    return list[Math.floor(Math.random()*list.length)];
                }
                if (provider === 'tenor') {
                    // Public Tenor demo key used by examples. If it is rate-limited, Mixed will fall back.
                    const key = 'LIVDSRZULELA';
                    const r = await fetch(`https://g.tenor.com/v1/search?q=${encodeURIComponent(term)}&key=${key}&limit=12&media_filter=minimal&contentfilter=medium`, { signal: AbortSignal.timeout(8000) });
                    if (!r.ok) throw new Error('tenor failed');
                    const j = await r.json();
                    const list = (j.results || []).map(g => g.media?.[0]?.gif?.url || g.media?.[0]?.mediumgif?.url || g.media?.[0]?.tinygif?.url).filter(Boolean).map(url => ({ url, label:'TENOR' }));
                    if (!list.length) throw new Error('tenor empty');
                    return list[Math.floor(Math.random()*list.length)];
                }
                throw new Error('unknown provider');
            },

    rbFetchStationGif: async (station={}) => {
                if (SystemState.settings.radio_gif_enabled === 'off') return;
                const token = Date.now();
                os._rbGifToken = token;
                const category = os.rbGifCategoryForStation(station);
                const selected = SystemState.settings.radio_gif_provider || 'nekos';
                const providers = selected === 'mixed' ? ['nekos','giphy','tenor'] : [selected, 'nekos', 'giphy', 'tenor'];
                const categories = [category, 'dance', 'happy', 'smile'];
                for (const provider of [...new Set(providers)]) {
                    for (const cat of categories) {
                        try {
                            const pick = await os.rbFetchGifFromProvider(provider, station, cat);
                            if (os._rbGifToken !== token) return;
                            os.rbSetGifUI(pick.url, pick.label || provider.toUpperCase());
                            os.logTerminal && os.logTerminal(`Radio Browser: GIF ambience synced via ${pick.label || provider}.`);
                            return;
                        } catch(e) {}
                    }
                }
                os.logTerminal && os.logTerminal('Radio Browser: all GIF providers failed for this station.');
            },

    rbToggleGif: () => {
                SystemState.settings.radio_gif_enabled = SystemState.settings.radio_gif_enabled === 'off' ? 'on' : 'off';
                SystemState.save();
                const enabled = SystemState.settings.radio_gif_enabled !== 'off';
                const bg = document.getElementById('rb-gif-bg');
                if (bg) bg.classList.toggle('hidden', !enabled);
                document.querySelectorAll('[data-rb-gif-toggle]').forEach(btn => btn.classList.toggle('active', enabled));
                os.rbSyncSettingsMenu && os.rbSyncSettingsMenu();
                if (enabled && os._rbNowPlaying) os.rbFetchStationGif(os._rbNowPlaying);
                os.logTerminal && os.logTerminal(`Radio Browser: GIF ambience ${enabled ? 'enabled' : 'disabled'}.`);
            },

    rbSyncVolumeUI: () => {
                const vol = Math.max(0, Math.min(1, Number(SystemState.settings.media_tuner_volume ?? 0.7)));
                const slider = document.getElementById('rb-volume-slider');
                const label = document.getElementById('rb-volume-readout');
                if (slider) slider.value = String(vol);
                if (label) label.innerText = Math.round(vol * 100) + '%';
                if (os.audioStream) os.audioStream.volume = vol;
            },

    rbAdjustVolume: (vol) => {
                const v = Math.max(0, Math.min(1, parseFloat(vol) || 0));
                SystemState.settings.media_tuner_volume = v;
                SystemState.save();
                if (os.audioStream) os.audioStream.volume = v;
                const label = document.getElementById('rb-volume-readout');
                if (label) label.innerText = Math.round(v * 100) + '%';
                const mediaVol = document.querySelector('#media-console-panel input[type="range"]');
                // Keep global hardware gain concept consistent without forcing a media re-render.
                os.logTerminal && os.logTerminal(`Radio Browser: output gain set to ${Math.round(v * 100)}%.`);
            },

    rbToggleFavNowPlaying: () => {
                if (!os._rbNowPlaying) return;
                os.toggleRadioFav(os._rbNowPlaying);
                const favBtn = document.getElementById('rb-fav-now-btn');
                if (!favBtn) return;
                os.loadRadioFavorites();
                const isFav = os._radioFavorites.some(s => (s.stationuuid||s.url_resolved) === (os._rbNowPlaying.stationuuid||os._rbNowPlaying.url_resolved));
                if(favBtn) favBtn.innerHTML = isFav ? '★' : '☆';
            },

    stopRadioBrowser: () => {
                if(os.audioStream && SystemState.settings.media_tuner_station === 'external') {
                    os.audioStream.pause();
                    os.audioStream.src = '';
                }
                const nameEl = document.getElementById('rb-now-playing-name');
                const tagsEl = document.getElementById('rb-now-playing-tags');
                const iconEl = document.getElementById('rb-now-playing-icon');
                const dotEl  = document.getElementById('rb-live-dot');
                const lblEl  = document.getElementById('rb-live-lbl');
                if(nameEl) nameEl.innerText = 'NO STATION SELECTED';
                if(tagsEl) tagsEl.innerText = '--';
                if(iconEl) iconEl.innerHTML = `<i data-lucide="radio" class="w-7 h-7 text-green-300/65"></i>`;
                os.rbStopAudioVisualizer && os.rbStopAudioVisualizer();
                const favNow = document.getElementById('rb-fav-now-btn'); if (favNow) favNow.innerHTML = '☆ Favorite';
                if(dotEl) dotEl.className = 'w-1.5 h-1.5 rounded-full bg-gray-600';
                if(lblEl) { lblEl.innerText = 'STANDBY'; lblEl.className = 'text-[8px] text-gray-600'; }
                const gifBadge = document.getElementById('rb-gif-badge'); if (gifBadge) gifBadge.innerText = '';
                const sidebarName = document.getElementById('sidebar-radio-name');
                const sidebarTags = document.getElementById('sidebar-radio-tags');
                const sidebarIcon = document.getElementById('sidebar-radio-icon');
                const sidebarFallback = document.getElementById('sidebar-radio-fallback');
                const sidebarStatus = document.getElementById('sidebar-radio-status');
                if(sidebarName) sidebarName.innerText = 'Offline';
                if(sidebarTags) sidebarTags.innerText = 'Awaiting tuning...';
                if(sidebarStatus) sidebarStatus.className = 'w-2 h-2 rounded-full bg-gray-600';
                if(sidebarIcon) sidebarIcon.classList.add('hidden');
                if(sidebarFallback) sidebarFallback.classList.remove('hidden');
                os.logTerminal("Radio Browser: Uplink terminated.");
                const rbRoot = document.getElementById('win-radiobrowser');
                if (rbRoot) lucide.createIcons({root: rbRoot});
            }
});
