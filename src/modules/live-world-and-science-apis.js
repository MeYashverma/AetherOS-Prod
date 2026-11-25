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
      <div class="books-studio" id="gd-root">
        <header class="studio-app-heading"><div><span class="studio-eyebrow">THE OPEN LIBRARY</span><h2>A world between the lines.</h2><p>Discover Project Gutenberg books · availability and copyright vary by country.</p></div><span id="gd-status" role="status">Your next chapter starts here</span></header>
        <form class="books-toolbar" onsubmit="event.preventDefault();os.gdSearch(document.getElementById('gd-query').value)"><input id="gd-query" aria-label="Search book title or author" placeholder="Title, author, or subject…" maxlength="200"><button type="submit" class="os-btn">Search library</button><button type="button" class="os-btn" id="gd-prev" onclick="os.gdPage(-1)">Previous</button><span id="gd-page-label">Page 1</span><button type="button" class="os-btn" id="gd-next" onclick="os.gdPage(1)">Next</button></form>
        <div class="books-workspace"><section class="books-shelf" id="gd-list" tabindex="0" aria-label="Book search results"></section><section id="gd-reader-wrap" class="books-reader"><div class="books-reader-tools"><select id="gd-theme" aria-label="Reading color theme" onchange="os.gdSetTheme(this.value)"><option value="system">System glass</option><option value="sepia">Warm sepia</option><option value="oled">Night ink</option></select><button type="button" class="os-btn" aria-label="Decrease reader font size" onclick="os.gdAdjustFont(-1)">A−</button><button type="button" class="os-btn" aria-label="Increase reader font size" onclick="os.gdAdjustFont(1)">A+</button><label class="books-import os-btn">Open .txt<input type="file" accept=".txt,text/plain" aria-label="Open local text file" onchange="os.gdImportText(this.files[0]);this.value=''"></label><button type="button" class="os-btn" onclick="os.gdDownloadText()">Download text</button></div><div id="gd-book-bar" class="books-book-bar">Select a book to begin</div><div id="gd-reader-body" class="books-reader-body" tabindex="0" role="region" aria-label="Book text, scroll to read" onscroll="os.gdReadingProgress()"><div class="books-empty"><span class="books-empty-art" aria-hidden="true">❧</span><h3>Find your next chapter.</h3><p>Choose a book from the shelf. Online text is fetched directly from Gutenberg, never through a public relay. If the provider blocks access, open its edition or import a .txt file.</p></div></div><footer class="books-progress"><span id="gd-progress-label">No book open</span><progress id="gd-progress" max="100" value="0" aria-label="Book reading progress"></progress></footer></section></div>
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
