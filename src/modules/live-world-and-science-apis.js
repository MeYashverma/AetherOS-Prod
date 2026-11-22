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
        <div class="h-full flex flex-col bg-[#08090d] text-white text-xs select-none overflow-hidden" id="wm-root">
            <div class="p-3 bg-black/55 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                <div class="flex flex-wrap items-center gap-1.5">
                    <button type="button" onclick="os.wmSearch('ukiyo-e hokusai hiroshige')" class="px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/14 text-[11px] text-amber-200 hover-target cursor-none">Japanese Ukiyo-e</button>
                    <button type="button" onclick="os.wmSearch('van gogh monet impressionism')" class="px-2.5 py-1 rounded-lg bg-white/[0.07] hover:bg-white/14 text-[11px] text-sky-200 hover-target cursor-none">Impressionism</button>
                    <button type="button" onclick="os.wmSearch('samurai armor ancient egypt')" class="px-2.5 py-1 rounded-lg bg-white/[0.07] hover:bg-white/14 text-[11px] text-emerald-200 hover-target cursor-none">Ancient &amp; Armor</button>
                    <button type="button" onclick="os.wmSearch('night cityscape nocturne')" class="px-2.5 py-1 rounded-lg bg-white/[0.07] hover:bg-white/14 text-[11px] text-purple-200 hover-target cursor-none">Nocturnes</button>
                </div>
                <form onsubmit="event.preventDefault();os.wmSearch(document.getElementById('wm-query').value)" class="flex items-center gap-1.5">
                    <input id="wm-query" type="text" placeholder="Search masterpieces, artists, eras..."
                        class="w-52 px-3 py-1.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white outline-none">
                    <button type="submit" class="px-3 py-1.5 rounded-xl bg-amber-400 text-black font-semibold text-xs hover-target cursor-none">Curate</button>
                </form>
            </div>

            <div class="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
                <div id="wm-grid" class="md:col-span-7 p-3.5 grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto border-b md:border-b-0 md:border-r border-white/[0.08] content-start"></div>
                <div id="wm-inspector" class="md:col-span-5 p-4 flex flex-col justify-between overflow-y-auto bg-[#05060a]">
                    <div class="text-gray-500 font-mono text-[11px] m-auto">Select an artwork to inspect high-resolution IIIF plate &amp; apply as wallpaper.</div>
                </div>
            </div>
        </div>
    `;

    // ═══════════════════════════════════════════════════════════════════════
    //  2. ORBITAL LAUNCH & ASTRONAUT CONTROL (spacexhub — Launch Library 2 API)
    // ═══════════════════════════════════════════════════════════════════════
    window.WindowContents.spacexhub = `
        <div class="h-full flex flex-col bg-[#050811] text-white text-xs select-none overflow-hidden" id="sxh-root">
            <div class="px-4 py-2.5 bg-black/60 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                <div class="os-segmented">
                    <button type="button" data-sxh-tab="launches" onclick="os.sxhSetTab('launches')" class="os-seg-btn active hover-target cursor-none">Upcoming Rocket Launches</button>
                    <button type="button" data-sxh-tab="astronauts" onclick="os.sxhSetTab('astronauts')" class="os-seg-btn hover-target cursor-none">Humans Currently in Orbit</button>
                </div>
                <div id="sxh-countdown-pill" class="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/35 font-mono text-[11px] text-emerald-300">T-MINUS SYNCING...</div>
            </div>

            <!-- Launches Pane -->
            <div id="sxh-pane-launches" class="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
                <div id="sxh-launch-list" class="md:col-span-5 overflow-y-auto divide-y divide-white/[0.06] border-b md:border-b-0 md:border-r border-white/[0.08] bg-[#080c17]"></div>
                <div id="sxh-launch-detail" class="md:col-span-7 p-5 overflow-y-auto bg-[#04070f]"></div>
            </div>

            <!-- Astronauts in Orbit Pane -->
            <div id="sxh-pane-astronauts" class="hidden flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto content-start"></div>
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
        <div class="h-full flex flex-col bg-[#0b0a09] text-white text-xs select-none overflow-hidden" id="gd-root">
            <div class="p-3 bg-black/60 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                <form onsubmit="event.preventDefault();os.gdSearch(document.getElementById('gd-query').value)" class="flex items-center gap-1.5">
                    <input id="gd-query" type="text" value="sherlock holmes" placeholder="Search 70,000+ free books (sci-fi, philosophy, mystery...)"
                        class="w-60 px-3 py-1.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white outline-none">
                    <button type="submit" class="px-3 py-1.5 rounded-xl bg-amber-300 text-black font-semibold text-xs hover-target cursor-none">Search Books</button>
                </form>
                <div class="flex items-center gap-1.5">
                    <button type="button" onclick="os.gdSetTheme('oled')" class="px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/15 text-[11px] text-gray-200 hover-target cursor-none">OLED</button>
                    <button type="button" onclick="os.gdSetTheme('sepia')" class="px-2.5 py-1 rounded-lg bg-[#f4ecd8] text-[#3b2f2f] font-medium text-[11px] hover-target cursor-none">Sepia</button>
                    <button type="button" onclick="os.gdAdjustFont(-1)" class="px-2 py-1 rounded-lg bg-white/10 text-[11px] hover-target cursor-none">A-</button>
                    <button type="button" onclick="os.gdAdjustFont(1)" class="px-2 py-1 rounded-lg bg-white/10 text-[11px] hover-target cursor-none">A+</button>
                </div>
            </div>

            <div class="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
                <div id="gd-list" class="md:col-span-4 p-3 overflow-y-auto space-y-2 border-b md:border-b-0 md:border-r border-white/[0.08] bg-[#0e0d0c]"></div>
                <div id="gd-reader-wrap" class="md:col-span-8 flex flex-col min-h-0 bg-[#101114] text-gray-200 transition-colors">
                    <div id="gd-book-bar" class="px-4 py-2 border-b border-black/15 bg-black/25 flex items-center justify-between text-[11px] font-mono">
                        <span>Select a classic from the shelf to read full text</span>
                    </div>
                    <div id="gd-reader-body" class="flex-1 p-6 overflow-y-auto leading-relaxed select-text font-serif text-[15px] whitespace-pre-wrap"></div>
                </div>
            </div>
        </div>
    `;

    const MUSEUM_FALLBACK = [
        { id: 27992, title: 'A Sunday on La Grande Jatte', artist_display: 'Georges Seurat', date_display: '1884–1886', medium_display: 'Oil on canvas', place_of_origin: 'France', imageUrl: 'https://www.artic.edu/iiif/2/2d484387-2509-5e8e-2c43-22f9981972eb/full/843,/0/default.jpg' },
        { id: 24645, title: 'Under the Wave off Kanagawa (The Great Wave)', artist_display: 'Katsushika Hokusai', date_display: '1831', medium_display: 'Color woodblock print', place_of_origin: 'Japan', imageUrl: 'https://www.artic.edu/iiif/2/b3974942-b9b1-7568-fc4b-966738f61d78/full/843,/0/default.jpg' },
        { id: 111628, title: 'Nighthawks', artist_display: 'Edward Hopper', date_display: '1942', medium_display: 'Oil on canvas', place_of_origin: 'United States', imageUrl: 'https://www.artic.edu/iiif/2/831a05de-d3f6-f4fa-a460-23008dd58dda/full/843,/0/default.jpg' }
    ];

    const LAUNCH_FALLBACK = [
        {
            id: 'f9-starlink', name: 'Falcon 9 Block 5 | Orbital Mission', status: 'Go for Launch',
            net: new Date(Date.now() + 1000 * 60 * 185).toISOString(),
            provider: 'SpaceX', rocket: 'Falcon 9 Block 5', pad: 'SLC-40, Cape Canaveral, FL',
            lat: 28.5619, lon: -80.5772, orbit: 'Low Earth Orbit (LEO)',
            mission: 'Reusable two-stage orbital launch vehicle delivering next-generation spacecraft to Low Earth Orbit.',
            image: '', webcast: 'https://www.spacex.com/launches/'
        }
    ];

    window.extendOS({
        // ── 1. World Museum Gallery ──
        wmState: { items: [], selected: null },

        initWorldMuseums: () => {
            if (!os.wmState.items.length) os.wmSearch('ukiyo-e hokusai nighthawks');
            else { os.wmRenderGrid(); os.wmRenderInspector(); }
        },

        wmSearch: async (query = 'impressionism') => {
            const q = String(query || 'masterpiece').trim();
            const grid = document.getElementById('wm-grid');
            if (grid) grid.innerHTML = `<div class="col-span-full text-gray-400 font-mono p-4">Curating IIIF museum plates for "${esc(q)}"...</div>`;
            try {
                const url = `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(q)}&fields=id,title,artist_display,date_display,medium_display,image_id,place_of_origin,style_title&limit=18`;
                const res = await fetch(url);
                const data = await res.json();
                const baseIiif = data?.config?.iiif_url || 'https://www.artic.edu/iiif/2';
                const items = (data?.data || [])
                    .filter((a) => a.image_id)
                    .map((a) => ({
                        id: a.id,
                        title: a.title || 'Untitled',
                        artist_display: a.artist_display || 'Unknown Master',
                        date_display: a.date_display || '',
                        medium_display: a.medium_display || 'Fine Art',
                        place_of_origin: a.place_of_origin || '',
                        imageUrl: `${baseIiif}/${a.image_id}/full/843,/0/default.jpg`
                    }));
                os.wmState.items = items.length ? items : MUSEUM_FALLBACK;
            } catch (_) {
                os.wmState.items = MUSEUM_FALLBACK;
            }
            os.wmState.selected = os.wmState.items[0] || null;
            os.wmRenderGrid();
            os.wmRenderInspector();
        },

        wmRenderGrid: () => {
            const grid = document.getElementById('wm-grid');
            if (!grid) return;
            grid.innerHTML = os.wmState.items.map((it, i) => `
                <button type="button" onclick="os.wmSelect(${i})"
                    class="group text-left rounded-2xl overflow-hidden border transition hover-target cursor-none ${os.wmState.selected?.id === it.id ? 'border-amber-400/60 bg-white/10' : 'border-white/10 bg-white/[0.03] hover:border-white/25'}">
                    <div class="aspect-[4/3] bg-black overflow-hidden">
                        <img src="${esc(it.imageUrl)}" alt="${esc(it.title)}" loading="lazy" referrerpolicy="no-referrer" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                    </div>
                    <div class="p-2.5">
                        <div class="font-semibold text-white truncate text-[11.5px]">${esc(it.title)}</div>
                        <div class="text-[10px] text-gray-400 truncate mt-0.5">${esc(it.artist_display)}</div>
                    </div>
                </button>
            `).join('');
        },

        wmSelect: (idx) => {
            os.wmState.selected = os.wmState.items[idx] || null;
            os.wmRenderGrid();
            os.wmRenderInspector();
        },

        wmRenderInspector: () => {
            const el = document.getElementById('wm-inspector');
            const it = os.wmState.selected;
            if (!el || !it) return;
            el.innerHTML = `
                <div class="space-y-3">
                    <div class="rounded-2xl overflow-hidden border border-white/15 bg-black shadow-2xl">
                        <img src="${esc(it.imageUrl)}" alt="${esc(it.title)}" referrerpolicy="no-referrer" class="w-full max-h-72 object-contain mx-auto">
                    </div>
                    <div>
                        <h3 class="text-base font-semibold text-white leading-snug">${esc(it.title)}</h3>
                        <div class="text-xs text-amber-300 mt-1">${esc(it.artist_display)}</div>
                        <div class="text-[11px] font-mono text-gray-400 mt-1">${esc(it.date_display)} · ${esc(it.place_of_origin)}</div>
                        <p class="text-[11px] text-gray-300 mt-2">${esc(it.medium_display)}</p>
                    </div>
                </div>
                <div class="pt-4 mt-4 border-t border-white/10 flex flex-wrap gap-2">
                    <button type="button" onclick="os.wmSetWallpaper()" class="px-3.5 py-2 rounded-xl bg-amber-400 text-black font-semibold text-xs hover:bg-amber-300 transition hover-target cursor-none">Set as Desktop Wallpaper</button>
                    <button type="button" onclick="os.wmSaveToVFS()" class="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/16 border border-white/15 text-xs text-white hover-target cursor-none">Save to Files</button>
                </div>
            `;
        },

        wmSetWallpaper: async () => {
            const it = os.wmState.selected;
            if (!it || !window.AetherVFS) return;
            const rec = await AetherVFS.putFile({
                name: `${it.title.replace(/[^a-z0-9]+/gi, '_').slice(0, 36)}.jpg`,
                mime: 'image/jpeg',
                kind: 'media',
                icon: 'image',
                folder: 'User Uploads',
                dataUrl: it.imageUrl,
                imageUrl: it.imageUrl,
                tags: ['museum', 'wallpaper']
            });
            AetherVFS.applyFileAsWallpaper && AetherVFS.applyFileAsWallpaper(rec.id);
        },

        wmSaveToVFS: async () => {
            const it = os.wmState.selected;
            if (!it || !window.AetherVFS) return;
            const rec = await AetherVFS.putFile({
                name: `${it.title.replace(/[^a-z0-9]+/gi, '_').slice(0, 36)}.jpg`,
                mime: 'image/jpeg',
                kind: 'media',
                icon: 'image',
                folder: 'User Uploads',
                dataUrl: it.imageUrl,
                imageUrl: it.imageUrl,
                tags: ['museum', 'art']
            });
            window.Notifications && Notifications.push('MUSEUM ARCHIVE', `Saved "${rec.name}" to File Explorer`);
        },

        // ── 2. Orbital Launch & Astronaut Control ──
        sxhState: { tab: 'launches', launches: [], astronauts: [], selectedIdx: 0, timer: null },

        initSpaceXHub: () => {
            os.sxhFetchLaunches();
            if (os.sxhState.timer) clearInterval(os.sxhState.timer);
            os.sxhState.timer = setInterval(os.sxhTickCountdown, 1000);
        },

        killSpaceXHub: () => {
            if (os.sxhState.timer) { clearInterval(os.sxhState.timer); os.sxhState.timer = null; }
        },

        sxhSetTab: (tab) => {
            os.sxhState.tab = tab;
            document.querySelectorAll('[data-sxh-tab]').forEach((b) => b.classList.toggle('active', b.getAttribute('data-sxh-tab') === tab));
            document.getElementById('sxh-pane-launches')?.classList.toggle('hidden', tab !== 'launches');
            document.getElementById('sxh-pane-astronauts')?.classList.toggle('hidden', tab !== 'astronauts');
            if (tab === 'astronauts' && !os.sxhState.astronauts.length) os.sxhFetchAstronauts();
        },

        sxhFetchLaunches: async () => {
            const list = document.getElementById('sxh-launch-list');
            if (list) list.innerHTML = `<div class="p-4 font-mono text-gray-400">Syncing global launch pads...</div>`;
            try {
                const res = await fetch('https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=14&mode=detailed');
                if (!res.ok) throw new Error('rate');
                const data = await res.json();
                const items = (data?.results || []).map((l) => ({
                    id: l.id,
                    name: l.name,
                    status: l.status?.name || 'Scheduled',
                    net: l.net,
                    provider: l.launch_service_provider?.name || 'Orbital Agency',
                    rocket: l.rocket?.configuration?.full_name || l.name,
                    pad: `${l.pad?.name || 'Launch Complex'} · ${l.pad?.location?.name || ''}`,
                    lat: parseFloat(l.pad?.latitude || 28.56),
                    lon: parseFloat(l.pad?.longitude || -80.57),
                    orbit: l.mission?.orbit?.name || 'Orbital Trajectory',
                    mission: l.mission?.description || 'Scheduled orbital spaceflight mission.',
                    image: l.image || '',
                    webcast: (l.vidURLs && l.vidURLs[0]?.url) || 'https://nextspaceflight.com'
                }));
                os.sxhState.launches = items.length ? items : LAUNCH_FALLBACK;
            } catch (_) {
                os.sxhState.launches = LAUNCH_FALLBACK;
            }
            os.sxhState.selectedIdx = 0;
            os.sxhRenderLaunches();
            os.sxhTickCountdown();
        },

        sxhRenderLaunches: () => {
            const list = document.getElementById('sxh-launch-list');
            const det = document.getElementById('sxh-launch-detail');
            if (list) {
                list.innerHTML = os.sxhState.launches.map((l, i) => `
                    <button type="button" onclick="os.sxhState.selectedIdx=${i};os.sxhRenderLaunches();os.sxhTickCountdown()"
                        class="w-full text-left p-3.5 transition hover-target cursor-none ${os.sxhState.selectedIdx === i ? 'bg-white/10' : 'hover:bg-white/[0.04]'}">
                        <div class="flex items-center justify-between gap-2">
                            <span class="text-[10px] font-mono text-sky-300 uppercase truncate">${esc(l.provider)}</span>
                            <span class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono text-[9.5px] shrink-0">${esc(l.status)}</span>
                        </div>
                        <div class="font-semibold text-white mt-1 line-clamp-1">${esc(l.name)}</div>
                        <div class="text-[10px] font-mono text-gray-400 mt-1">${new Date(l.net).toUTCString().slice(0, 22)} UTC</div>
                    </button>
                `).join('');
            }
            const cur = os.sxhState.launches[os.sxhState.selectedIdx];
            if (det && cur) {
                det.innerHTML = `
                    <div class="space-y-4">
                        ${cur.image ? `<div class="rounded-2xl overflow-hidden border border-white/10 bg-black h-48"><img src="${esc(cur.image)}" class="w-full h-full object-cover" alt=""></div>` : ''}
                        <div>
                            <div class="text-[10.5px] font-mono text-sky-300 uppercase tracking-wider">${esc(cur.provider)} · ${esc(cur.orbit)}</div>
                            <h2 class="text-lg font-bold text-white mt-0.5">${esc(cur.name)}</h2>
                            <div class="text-xs text-gray-400 font-mono mt-1">📍 ${esc(cur.pad)}</div>
                        </div>
                        <p class="text-xs text-gray-300 leading-relaxed bg-white/[0.03] border border-white/[0.07] rounded-2xl p-3.5">${esc(cur.mission)}</p>
                        <div class="flex flex-wrap gap-2">
                            <button type="button" onclick="os.geoJump && os.geoJump(${cur.lat || 28.56}, ${cur.lon || -80.57}, '${esc(cur.pad)}')"
                                class="px-3.5 py-2 rounded-xl bg-sky-500/20 border border-sky-400/35 text-sky-200 font-semibold text-xs hover-target cursor-none">Inspect Launch Pad on GeoRadar →</button>
                            <a href="${esc(cur.webcast)}" target="_blank" rel="noopener"
                                class="px-3.5 py-2 rounded-xl bg-emerald-400 text-black font-semibold text-xs hover-target cursor-none">Mission Stream / Info ↗</a>
                        </div>
                    </div>
                `;
            }
        },

        sxhTickCountdown: () => {
            const pill = document.getElementById('sxh-countdown-pill');
            const cur = os.sxhState.launches[os.sxhState.selectedIdx];
            if (!pill || !cur) return;
            const diff = Math.max(0, new Date(cur.net).getTime() - Date.now());
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            const pad2 = (n) => String(n).padStart(2, '0');
            pill.textContent = diff > 0 ? `T- ${pad2(d)}d ${pad2(h)}h ${pad2(m)}m ${pad2(s)}s` : 'LIFTOFF / IN FLIGHT';
        },

        sxhFetchAstronauts: async () => {
            const pane = document.getElementById('sxh-pane-astronauts');
            if (pane) pane.innerHTML = `<div class="col-span-full p-4 font-mono text-gray-400">Querying active orbital crew manifest...</div>`;
            try {
                const res = await fetch('https://ll.thespacedevs.com/2.2.0/astronaut/?in_space=true&limit=18');
                const data = await res.json();
                os.sxhState.astronauts = (data?.results || []).map((a) => ({
                    name: a.name,
                    agency: a.agency?.abbrev || a.agency?.name || 'Space Agency',
                    nationality: a.nationality || '',
                    photo: a.profile_image_thumbnail || a.profile_image || '',
                    bio: a.bio || 'Active orbital crewmember.'
                }));
            } catch (_) {}
            if (!os.sxhState.astronauts.length) {
                os.sxhState.astronauts = [
                    { name: 'Expedition Crew (ISS)', agency: 'NASA / Roscosmos / JAXA / ESA', nationality: 'Low Earth Orbit · 408 km', photo: '', bio: 'Permanent human presence aboard the International Space Station.' }
                ];
            }
            if (pane) {
                pane.innerHTML = os.sxhState.astronauts.map((a) => `
                    <div class="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-start gap-3">
                        ${a.photo ? `<img src="${esc(a.photo)}" class="w-12 h-12 rounded-xl object-cover shrink-0 bg-black" alt="">` : `<div class="w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center text-lg shrink-0">🧑‍🚀</div>`}
                        <div class="min-w-0">
                            <div class="font-semibold text-white truncate">${esc(a.name)}</div>
                            <div class="text-[10px] font-mono text-emerald-300 mt-0.5">${esc(a.agency)} · ${esc(a.nationality)}</div>
                            <p class="text-[11px] text-gray-400 line-clamp-2 mt-1">${esc(a.bio)}</p>
                        </div>
                    </div>
                `).join('');
            }
        },

        // ── 3. World Factbook, GDP & Live FX Atlas ──
        wfbState: { all: [], filtered: [], fx: {}, selectedCca3: 'IND' },

        initWorldFactbook: async () => {
            if (!os.wfbState.all.length) {
                try {
                    const [cRes, fxRes] = await Promise.all([
                        fetch('https://restcountries.com/v3.1/all?fields=name,cca2,cca3,flags,capital,region,subregion,population,area,currencies,languages,latlng,timezones,borders'),
                        fetch('https://api.frankfurter.app/latest?from=USD').catch(() => null)
                    ]);
                    const countries = await cRes.json();
                    if (Array.isArray(countries)) {
                        countries.sort((a, b) => (b.population || 0) - (a.population || 0));
                        os.wfbState.all = countries;
                    }
                    if (fxRes && fxRes.ok) {
                        const fxData = await fxRes.json();
                        os.wfbState.fx = fxData?.rates || {};
                    }
                } catch (_) {
                    os.wfbState.all = [
                        { name: { common: 'India', official: 'Republic of India' }, cca2: 'IN', cca3: 'IND', flags: { svg: '' }, capital: ['New Delhi'], region: 'Asia', subregion: 'Southern Asia', population: 1428627663, area: 3287590, currencies: { INR: { name: 'Indian rupee', symbol: '₹' } }, languages: { eng: 'English', hin: 'Hindi' }, latlng: [20, 77], timezones: ['UTC+05:30'], borders: ['BTN', 'NPL', 'BGD'] }
                    ];
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
            list.innerHTML = os.wfbState.filtered.slice(0, 120).map((c) => `
                <button type="button" onclick="os.wfbSelect('${esc(c.cca3)}')"
                    class="w-full text-left px-3.5 py-2.5 flex items-center gap-2.5 transition hover-target cursor-none ${os.wfbState.selectedCca3 === c.cca3 ? 'bg-white/10' : 'hover:bg-white/[0.04]'}">
                    ${c.flags?.svg ? `<img src="${esc(c.flags.svg)}" class="w-6 h-4 object-cover rounded-sm shrink-0" alt="">` : '<span class="text-sm">🌐</span>'}
                    <div class="min-w-0 flex-1">
                        <div class="font-medium text-white truncate">${esc(c.name?.common)}</div>
                        <div class="text-[10px] font-mono text-gray-400 truncate">${esc(c.capital?.[0] || '—')} · ${(Number(c.population || 0) / 1e6).toFixed(1)}M</div>
                    </div>
                </button>
            `).join('');
        },

        wfbSelect: async (cca3) => {
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
                            <div class="text-[10px] font-mono text-emerald-300">LIVE FX (${esc(currCode)})</div>
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
                const gJson = await gRes.json();
                const rows = (Array.isArray(gJson?.[1]) ? gJson[1] : []).filter((r) => r.value != null).reverse();
                const barsEl = document.getElementById('wfb-gdp-bars');
                if (barsEl && rows.length) {
                    const maxV = Math.max(...rows.map((r) => r.value), 1);
                    barsEl.innerHTML = `<div class="grid grid-cols-${rows.length} gap-2 items-end h-24 pt-2">` + rows.map((r) => {
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
            } catch (_) {}
        },

        // ── 4. Open Bookshelf & Classic E-Reader ──
        gdState: { books: [], fontSize: 15, theme: 'oled' },

        initGutendex: () => {
            if (!os.gdState.books.length) os.gdSearch('sherlock holmes');
        },

        gdSetTheme: (theme) => {
            os.gdState.theme = theme;
            const wrap = document.getElementById('gd-reader-wrap');
            if (!wrap) return;
            if (theme === 'sepia') {
                wrap.style.background = '#f4ecd8';
                wrap.style.color = '#2c221e';
            } else {
                wrap.style.background = '#101114';
                wrap.style.color = '#e5e7eb';
            }
        },

        gdAdjustFont: (delta) => {
            os.gdState.fontSize = Math.max(12, Math.min(24, (os.gdState.fontSize || 15) + delta));
            const body = document.getElementById('gd-reader-body');
            if (body) body.style.fontSize = `${os.gdState.fontSize}px`;
        },

        gdSearch: async (query = 'science fiction') => {
            const q = String(query || 'classic').trim();
            const list = document.getElementById('gd-list');
            if (list) list.innerHTML = `<div class="p-4 font-mono text-gray-400">Searching Project Gutenberg for "${esc(q)}"...</div>`;
            try {
                const res = await fetch(`https://gutendex.com/books?search=${encodeURIComponent(q)}`);
                const data = await res.json();
                os.gdState.books = (data?.results || []).slice(0, 18);
            } catch (_) {
                os.gdState.books = [];
            }
            if (!list) return;
            if (!os.gdState.books.length) {
                list.innerHTML = `<div class="p-4 text-gray-500">No books matched "${esc(q)}".</div>`;
                return;
            }
            list.innerHTML = os.gdState.books.map((b, i) => {
                const author = b.authors?.[0]?.name || 'Classic Author';
                const cover = b.formats?.['image/jpeg'] || '';
                return `
                    <button type="button" onclick="os.gdOpenBook(${i})"
                        class="w-full text-left p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/[0.07] flex items-start gap-2.5 transition hover-target cursor-none">
                        ${cover ? `<img src="${esc(cover)}" class="w-10 h-14 object-cover rounded shrink-0 bg-black" alt="">` : `<div class="w-10 h-14 rounded bg-amber-500/20 flex items-center justify-center shrink-0">📖</div>`}
                        <div class="min-w-0 flex-1">
                            <div class="font-semibold text-white line-clamp-2 text-[11.5px]">${esc(b.title)}</div>
                            <div class="text-[10px] text-amber-300 truncate mt-0.5">${esc(author)}</div>
                            <div class="text-[9.5px] font-mono text-gray-500 mt-0.5">↓ ${Number(b.download_count || 0).toLocaleString()} reads</div>
                        </div>
                    </button>
                `;
            }).join('');
            os.gdOpenBook(0);
        },

        gdOpenBook: async (idx) => {
            const b = os.gdState.books[idx];
            if (!b) return;
            const bar = document.getElementById('gd-book-bar');
            const body = document.getElementById('gd-reader-body');
            const txtUrl = b.formats?.['text/plain; charset=utf-8'] || b.formats?.['text/plain; charset=us-ascii'] || b.formats?.['text/plain'] || `https://www.gutenberg.org/cache/epub/${b.id}/pg${b.id}.txt`;
            const htmlUrl = b.formats?.['text/html'] || `https://www.gutenberg.org/ebooks/${b.id}`;

            if (bar) {
                bar.innerHTML = `
                    <span class="truncate font-semibold">${esc(b.title)}</span>
                    <a href="${esc(htmlUrl)}" target="_blank" rel="noopener" class="underline shrink-0 ml-2 hover-target cursor-none">Gutenberg Edition ↗</a>
                `;
            }
            if (body) body.textContent = `Opening "${b.title}"...`;

            try {
                // Direct or CORS-friendly Gutenberg mirror
                const mirrorUrl = `https://www.gutenberg.org/cache/epub/${b.id}/pg${b.id}.txt`;
                let text = '';
                for (const candidate of [txtUrl, `https://api.allorigins.win/raw?url=${encodeURIComponent(mirrorUrl)}`]) {
                    try {
                        const r = await fetch(candidate);
                        if (r.ok) { text = await r.text(); if (text.length > 400) break; }
                    } catch (_) {}
                }
                if (body) {
                    body.textContent = text
                        ? text.slice(0, 140000)
                        : `${b.title}\nby ${b.authors?.[0]?.name || 'Unknown'}\n\nSubjects:\n• ${(b.subjects || []).join('\n• ')}\n\nClick "Gutenberg Edition ↗" above to read the full illustrated HTML volume.`;
                    body.scrollTop = 0;
                }
            } catch (_) {}
        }
    });
})();
