// AetherOS — Live Public APIs & Archive Suite:
// 1. Earth Pulse Radar (USGS Live Earthquakes GeoJSON + NASA EONET Disasters + Windy Global Particle Radar)
// 2. Archive & DOS Vault (Wayback Machine API + Playable Internet Archive MS-DOS Classics + Archive.org Search)
// 3. Open-Source Radar (GitHub Breakout Repos API + Live Repo File-Tree/Code Explorer + HN Algolia Pulse)
(function () {
    const esc = (v) => String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    window.WindowContents = window.WindowContents || {};

    // ═══════════════════════════════════════════════════════════════════════
    //  1. EARTH PULSE RADAR (earthpulse — USGS + NASA EONET + Windy Embed)
    // ═══════════════════════════════════════════════════════════════════════
    window.WindowContents.earthpulse = `
        <div class="h-full flex flex-col bg-[#060911] text-white text-xs select-none overflow-hidden" id="ep-root">
            <!-- Top Telemetry Mode Bar -->
            <div class="px-4 py-2.5 bg-black/55 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                <div class="os-segmented">
                    <button type="button" data-ep-mode="quakes" onclick="os.epSetMode('quakes')" class="os-seg-btn active hover-target cursor-none">USGS Live Quakes</button>
                    <button type="button" data-ep-mode="eonet" onclick="os.epSetMode('eonet')" class="os-seg-btn hover-target cursor-none">NASA Volcanoes &amp; Fires</button>
                    <button type="button" data-ep-mode="windy" onclick="os.epSetMode('windy')" class="os-seg-btn hover-target cursor-none">Windy Live Storm Radar</button>
                </div>

                <div id="ep-quakes-controls" class="flex items-center gap-1.5">
                    <select id="ep-quake-feed" onchange="os.epFetchQuakes(this.value)" class="px-2.5 py-1 rounded-lg bg-white/[0.07] border border-white/15 text-[11px] text-sky-300 outline-none">
                        <option value="2.5_day">M2.5+ Past 24 Hours</option>
                        <option value="4.5_week">M4.5+ Past 7 Days</option>
                        <option value="significant_month">Significant (30 Days)</option>
                    </select>
                    <button type="button" onclick="os.epRefreshActive()" class="px-2.5 py-1 rounded-lg bg-white/[0.07] hover:bg-white/14 text-[11px] text-gray-200 hover-target cursor-none">↻ Sync</button>
                </div>

                <div id="ep-windy-controls" class="hidden flex items-center gap-1.5">
                    <button type="button" onclick="os.epSetWindyLayer('wind')" class="px-2.5 py-1 rounded-lg bg-sky-500/20 border border-sky-400/30 text-[11px] text-sky-200 hover-target cursor-none">Wind</button>
                    <button type="button" onclick="os.epSetWindyLayer('rain')" class="px-2.5 py-1 rounded-lg bg-white/[0.07] hover:bg-white/14 text-[11px] text-gray-200 hover-target cursor-none">Rain/Thunder</button>
                    <button type="button" onclick="os.epSetWindyLayer('temp')" class="px-2.5 py-1 rounded-lg bg-white/[0.07] hover:bg-white/14 text-[11px] text-gray-200 hover-target cursor-none">Temp</button>
                    <button type="button" onclick="os.epSetWindyLayer('waves')" class="px-2.5 py-1 rounded-lg bg-white/[0.07] hover:bg-white/14 text-[11px] text-gray-200 hover-target cursor-none">Waves</button>
                </div>
            </div>

            <!-- Tactical Map + Event Feed Pane -->
            <div id="ep-map-pane" class="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
                <div class="md:col-span-8 flex flex-col bg-[#04070e] relative min-h-[260px] border-b md:border-b-0 md:border-r border-white/[0.07]">
                    <canvas id="ep-map-canvas" width="760" height="420" onclick="os.epClickMap(event)" class="w-full flex-1 object-contain cursor-crosshair"></canvas>
                    <!-- Selected Event Bottom HUD -->
                    <div id="ep-selected-bar" class="px-4 py-2.5 bg-black/70 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span class="text-gray-400 font-mono">Click any pulsing seismic/planetary node to inspect coordinates &amp; jump Windy radar.</span>
                    </div>
                </div>
                <div class="md:col-span-4 flex flex-col min-h-0 bg-[#080c16]">
                    <div class="px-3.5 py-2 border-b border-white/[0.07] flex items-center justify-between text-[10.5px] font-mono text-gray-400">
                        <span id="ep-feed-title">LIVE TELEMETRY STREAM</span>
                        <span id="ep-feed-count" class="text-emerald-400">--</span>
                    </div>
                    <div id="ep-event-list" class="flex-1 overflow-y-auto divide-y divide-white/[0.05]"></div>
                </div>
            </div>

            <!-- Windy Live Global Particle Radar Embed -->
            <div id="ep-windy-pane" class="hidden flex-1 relative bg-black">
                <iframe id="ep-windy-frame" title="Windy Global Radar" src="about:blank" class="absolute inset-0 w-full h-full border-0" allow="fullscreen"></iframe>
            </div>
        </div>
    `;

    // ═══════════════════════════════════════════════════════════════════════
    //  2. ARCHIVE & DOS VAULT (wayback — Wayback API + MS-DOS + Archive.org)
    // ═══════════════════════════════════════════════════════════════════════
    const DOS_CLASSICS = [
        { id: 'msdos_DOOM_1993',                 title: 'DOOM (1993)',              genre: 'id Software · FPS',       year: '1993' },
        { id: 'msdos_Prince_of_Persia_1990',     title: 'Prince of Persia',         genre: 'Brøderbund · Platformer', year: '1990' },
        { id: 'msdos_Oregon_Trail_The_1990',     title: 'The Oregon Trail',         genre: 'MECC · Adventure',        year: '1990' },
        { id: 'msdos_SimCity_1989',              title: 'SimCity Classic',          genre: 'Maxis · City Sim',        year: '1989' },
        { id: 'msdos_Wolfenstein_3D_1992',       title: 'Wolfenstein 3D',           genre: 'id Software · Action',    year: '1992' },
        { id: 'msdos_Pac-Man_1983',              title: 'Pac-Man PC',               genre: 'Atarisoft · Arcade',      year: '1983' },
        { id: 'msdos_Lemmings_1991',             title: 'Lemmings',                 genre: 'Psygnosis · Puzzle',      year: '1991' },
        { id: 'msdos_Street_Fighter_II_1992',    title: 'Street Fighter II',        genre: 'Capcom · Arcade Fighter', year: '1992' }
    ];

    window.WindowContents.wayback = `
        <div class="h-full flex flex-col bg-[#08090f] text-white text-xs select-none overflow-hidden" id="wb-root">
            <div class="px-4 py-2.5 bg-black/55 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                <div class="os-segmented">
                    <button type="button" data-wb-tab="dos" onclick="os.wbSetTab('dos')" class="os-seg-btn active hover-target cursor-none">MS-DOS Arcade Vault</button>
                    <button type="button" data-wb-tab="timemachine" onclick="os.wbSetTab('timemachine')" class="os-seg-btn hover-target cursor-none">Wayback Time Machine</button>
                    <button type="button" data-wb-tab="library" onclick="os.wbSetTab('library')" class="os-seg-btn hover-target cursor-none">Archive.org Media &amp; Zines</button>
                </div>
                <span id="wb-status-pill" class="text-[10.5px] font-mono text-amber-300">Powered by Internet Archive Open APIs</span>
            </div>

            <!-- Tab 1: Playable Internet Archive MS-DOS Vault -->
            <div id="wb-pane-dos" class="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
                <div class="md:col-span-4 p-3 border-b md:border-b-0 md:border-r border-white/[0.08] overflow-y-auto space-y-1.5 bg-[#0b0d15]">
                    <div class="text-[10px] font-mono uppercase tracking-wider text-gray-400 px-1 pb-1">Select Cartridge (EM-DOSBox)</div>
                    <div id="wb-dos-list" class="space-y-1.5"></div>
                </div>
                <div class="md:col-span-8 flex flex-col bg-black relative min-h-[300px]">
                    <iframe id="wb-dos-frame" title="Internet Archive DOS Emulator" src="about:blank" class="flex-1 w-full border-0 bg-black" allow="fullscreen; autoplay; gamepad"></iframe>
                    <div class="px-3.5 py-1.5 bg-[#10121b] border-t border-white/[0.08] flex items-center justify-between text-[10.5px] text-gray-400 font-mono">
                        <span id="wb-dos-now">Click a classic DOS title on the left to boot live in-browser emulation</span>
                        <a id="wb-dos-ext" href="https://archive.org/details/softwarelibrary_msdos_games" target="_blank" rel="noopener" class="text-sky-300 hover:underline hover-target cursor-none">Archive Page ↗</a>
                    </div>
                </div>
            </div>

            <!-- Tab 2: Wayback Time Machine -->
            <div id="wb-pane-timemachine" class="hidden flex-1 flex flex-col min-h-0">
                <form onsubmit="event.preventDefault();os.wbLookupSnapshot()" class="p-3 bg-[#0c0e17] border-b border-white/[0.08] flex flex-wrap items-center gap-2">
                    <input id="wb-url-input" type="text" value="apple.com" placeholder="apple.com, spacejam.com, youtube.com..."
                        class="flex-1 min-w-[200px] px-3 py-1.5 rounded-xl bg-black/60 border border-white/15 font-mono text-xs text-white outline-none">
                    <select id="wb-year-select" class="px-2.5 py-1.5 rounded-xl bg-black/60 border border-white/15 font-mono text-xs text-amber-300 outline-none">
                        <option value="1997">1997</option>
                        <option value="2000">2000</option>
                        <option value="2004" selected>2004</option>
                        <option value="2007">2007</option>
                        <option value="2011">2011</option>
                        <option value="2015">2015</option>
                        <option value="2020">2020</option>
                    </select>
                    <button type="submit" class="px-4 py-1.5 rounded-xl bg-amber-400 text-black font-semibold text-xs hover:bg-amber-300 transition hover-target cursor-none">Time Travel</button>
                    <a id="wb-snap-ext" href="https://web.archive.org" target="_blank" rel="noopener" class="px-2.5 py-1.5 rounded-xl bg-white/[0.07] hover:bg-white/14 text-[11px] text-gray-200 hover-target cursor-none">Pop Out ↗</a>
                </form>
                <div class="px-3.5 py-1.5 bg-black/50 border-b border-white/[0.06] flex flex-wrap items-center gap-1.5 text-[10.5px]">
                    <span class="text-gray-500">Quick Eras:</span>
                    <button type="button" onclick="os.wbQuickJump('apple.com','2001')" class="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/12 text-gray-300 hover-target cursor-none">Apple 2001 (iPod)</button>
                    <button type="button" onclick="os.wbQuickJump('apple.com','2007')" class="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/12 text-gray-300 hover-target cursor-none">Apple 2007 (iPhone)</button>
                    <button type="button" onclick="os.wbQuickJump('spacejam.com','1997')" class="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/12 text-gray-300 hover-target cursor-none">Space Jam 1997</button>
                    <button type="button" onclick="os.wbQuickJump('google.com','1999')" class="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/12 text-gray-300 hover-target cursor-none">Google 1999</button>
                    <button type="button" onclick="os.wbQuickJump('youtube.com','2006')" class="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/12 text-gray-300 hover-target cursor-none">YouTube 2006</button>
                </div>
                <iframe id="wb-tm-frame" title="Wayback Machine Snapshot" src="about:blank" class="flex-1 w-full border-0 bg-white"></iframe>
            </div>

            <!-- Tab 3: Archive.org Live Media, Concerts & Retro Magazines Search -->
            <div id="wb-pane-library" class="hidden flex-1 flex flex-col min-h-0">
                <form onsubmit="event.preventDefault();os.wbSearchLibrary()" class="p-3 bg-[#0c0e17] border-b border-white/[0.08] flex flex-wrap items-center gap-2">
                    <input id="wb-lib-query" type="text" value="synthwave OR byte magazine" placeholder="Search Archive.org movies, concerts, vintage computer magazines..."
                        class="flex-1 min-w-[200px] px-3 py-1.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white outline-none">
                    <select id="wb-lib-media" class="px-2.5 py-1.5 rounded-xl bg-black/60 border border-white/15 text-xs text-sky-300 outline-none">
                        <option value="all">All Media</option>
                        <option value="movies">Classic Cinema &amp; Sci-Fi</option>
                        <option value="audio">Live Concerts &amp; Audio</option>
                        <option value="texts">Vintage Tech Magazines</option>
                    </select>
                    <button type="submit" class="px-4 py-1.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-gray-200 hover-target cursor-none">Search Archive</button>
                </form>
                <div class="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
                    <div id="wb-lib-results" class="md:col-span-5 p-3 overflow-y-auto space-y-2 border-b md:border-b-0 md:border-r border-white/[0.08]"></div>
                    <div class="md:col-span-7 bg-black flex flex-col min-h-[260px]">
                        <iframe id="wb-lib-embed" title="Archive.org Media Player" src="about:blank" class="flex-1 w-full border-0" allow="fullscreen; autoplay"></iframe>
                    </div>
                </div>
            </div>
        </div>
    `;

    // ═══════════════════════════════════════════════════════════════════════
    //  3. OPEN-SOURCE RADAR & GITHUB REPO EXPLORER (ossradar)
    // ═══════════════════════════════════════════════════════════════════════
    window.WindowContents.ossradar = `
        <div class="h-full flex flex-col  text-white text-xs select-none overflow-hidden" id="oss-root" data-design-version="glass-workspace-2">
            <header class="studio-app-heading"><div><span class="studio-eyebrow">DISCOVER / READ / EXPLORE</span><h2>Explore the source.</h2><p>Live repositories. Real source. Your own reading space.</p></div><span class="oss-build-label">GLASS WORKSPACE / 02</span><span id="oss-status" role="status">Unauthenticated API limits apply</span></header>
            <div class="p-3  border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                <div class="flex flex-wrap items-center gap-1.5">
                    <select id="oss-lang" aria-label="Repository language" onchange="os.ossFetchTrending()" class="px-2.5 py-1.5 rounded-xl bg-white/[0.07] border border-white/15 text-xs text-emerald-300 outline-none">
                        <option value="">All Languages</option>
                        <option value="typescript">TypeScript</option>
                        <option value="javascript">JavaScript</option>
                        <option value="rust">Rust</option>
                        <option value="python">Python</option>
                        <option value="go">Go</option>
                        <option value="c++">C++</option>
                    </select>
                    <select id="oss-window" aria-label="Repository creation period" onchange="os.ossFetchTrending()" class="px-2.5 py-1.5 rounded-xl bg-white/[0.07] border border-white/15 text-xs text-sky-300 outline-none">
                        <option value="month">Created in last 30 days</option>
                        <option value="year">Created in last 365 days</option>
                        <option value="legends">All time · 25k+ stars</option>
                    </select>
                </div>

                <form onsubmit="event.preventDefault();os.ossSearchOrInspect()" class="flex items-center gap-1.5 flex-1 max-w-sm">
                    <input id="oss-query" aria-label="Search GitHub or enter owner/repository" type="text" maxlength="256" placeholder="Search repos or owner/repo (e.g. mrdoob/three.js)"
                        class="flex-1 px-3 py-1.5 rounded-xl  border border-white/15 font-mono text-[11px] text-white outline-none">
                    <button type="submit" class="px-3 py-1.5 rounded-xl bg-emerald-400 text-black font-semibold text-xs hover-target cursor-none">Go</button>
                </form>
            </div>

            <div class="oss-reading-tools"><label>Branch / tag / commit <input id="oss-ref" aria-label="Git ref" placeholder="Default branch" maxlength="200"></label><button type="button" class="os-btn" onclick="os.ossChangeRef()">Load ref</button><button type="button" class="os-btn" onclick="os.ossRefresh()">Refresh</button><button type="button" class="os-btn" onclick="os.ossCopySource()">Copy source</button><span id="oss-file-label" role="status">No file selected</span></div>
            <div class="oss-workspace flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
                <!-- Left: Trending / Search Repo List -->
                <div id="oss-repo-list" class="md:col-span-5 overflow-y-auto divide-y divide-white/[0.06] border-b md:border-b-0 md:border-r border-white/[0.08] "></div>

                <!-- Right: Live Repo File-Tree & Source / README Viewer -->
                <div class="md:col-span-7 flex flex-col min-h-0 ">
                    <div id="oss-repo-header" class="p-3.5 border-b border-white/[0.08]  flex flex-wrap items-center justify-between gap-2">
                        <span class="text-gray-400 font-mono text-[11px]">Select any open-source project to browse its live code tree &amp; README</span>
                    </div>
                    <div class="oss-source-workspace flex-1 grid grid-cols-1 sm:grid-cols-12 min-h-0">
                        <div id="oss-file-tree" class="sm:col-span-4 border-b sm:border-b-0 sm:border-r border-white/[0.07] overflow-y-auto p-2 space-y-0.5 font-mono text-[11px]"></div>
                        <section class="oss-source-pane"><div class="oss-source-toolbar"><input id="oss-source-find" aria-label="Find in source" placeholder="Find in source…" oninput="os.ossFindSource(this.value)"><span id="oss-find-count" role="status"></span><button type="button" class="os-btn" aria-pressed="false" onclick="os.ossToggleWrap(this)">Wrap</button><button type="button" class="os-btn" aria-pressed="false" onclick="os.ossFocusSource(this)">Focus</button><button type="button" class="os-btn" onclick="os.ossDownloadSource()">Download</button></div><pre id="oss-code-viewer" tabindex="0" role="region" aria-label="Selected file source, scrollable" class="sm:col-span-8 p-3.5 overflow-auto font-mono text-[11px] text-gray-200 whitespace-pre-wrap select-text leading-relaxed"></pre></section>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Simplified coastline polylines [lon, lat] so the tactical Earth map looks crisp & unmistakable offline or online!
    const CONTINENT_OUTLINES = [
        [[-165,65],[-130,70],[-80,62],[-60,48],[-80,25],[-95,18],[-80,9],[-105,20],[-122,37],[-140,60],[-165,65]], // N America
        [[-80,9],[-62,10],[-35,-6],[-48,-28],[-68,-54],[-75,-42],[-71,-18],[-80,0],[-80,9]], // S America
        [[-10,36],[-9,43],[-4,48],[8,54],[25,70],[45,68],[60,55],[30,42],[14,38],[-10,36]], // Europe
        [[-17,15],[-5,35],[12,33],[32,31],[50,12],[40,-15],[20,-34],[12,-18],[8,4],[-8,5],[-17,15]], // Africa
        [[45,68],[100,72],[170,66],[142,45],[122,31],[104,1],[90,22],[77,8],[68,24],[48,30],[35,36],[45,68]], // Asia
        [[114,-22],[132,-12],[153,-28],[146,-38],[130,-32],[115,-34],[114,-22]] // Australia
    ];

    window.extendOS({
        // ── Earth Pulse State & Methods ──
        epState: {
            mode: 'quakes',
            events: [],
            selected: null,
            raf: null,
            windyLayer: 'wind',
            windyLat: 26.5,
            windyLon: 78.0,
            windyZoom: 4
        },

        initEarthPulse: () => {
            os.epStartMapLoop();
            os.epSetMode(os.epState.mode || 'quakes');
        },

        killEarthPulse: () => {
            if (os.epState.raf) { cancelAnimationFrame(os.epState.raf); os.epState.raf = null; }
            const f = document.getElementById('ep-windy-frame');
            if (f) f.src = 'about:blank';
        },

        epSetMode: (mode) => {
            os.epState.mode = mode;
            document.querySelectorAll('[data-ep-mode]').forEach((b) => {
                b.classList.toggle('active', b.getAttribute('data-ep-mode') === mode);
            });
            const mp = document.getElementById('ep-map-pane');
            const wp = document.getElementById('ep-windy-pane');
            const qc = document.getElementById('ep-quakes-controls');
            const wc = document.getElementById('ep-windy-controls');
            if (mp) mp.classList.toggle('hidden', mode === 'windy');
            if (wp) wp.classList.toggle('hidden', mode !== 'windy');
            if (qc) qc.classList.toggle('hidden', mode !== 'quakes');
            if (wc) wc.classList.toggle('hidden', mode !== 'windy');

            if (mode === 'quakes') os.epFetchQuakes(document.getElementById('ep-quake-feed')?.value || '2.5_day');
            else if (mode === 'eonet') os.epFetchEonet();
            else if (mode === 'windy') os.epLoadWindy();
        },

        epRefreshActive: () => {
            if (os.epState.mode === 'quakes') os.epFetchQuakes(document.getElementById('ep-quake-feed')?.value || '2.5_day');
            else if (os.epState.mode === 'eonet') os.epFetchEonet();
        },

        epFetchQuakes: async (feed = '2.5_day') => {
            const title = document.getElementById('ep-feed-title');
            if (title) title.textContent = 'USGS SEISMIC STREAM';
            try {
                const res = await fetch(`https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${feed}.geojson`);
                const data = await res.json();
                const feats = Array.isArray(data?.features) ? data.features : [];
                os.epState.events = feats.slice(0, 60).map((f) => ({
                    id: f.id,
                    title: f.properties?.place || 'Tectonic Event',
                    mag: Number(f.properties?.mag || 0),
                    time: f.properties?.time ? new Date(f.properties.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                    tsunami: Boolean(f.properties?.tsunami),
                    url: f.properties?.url || 'https://earthquake.usgs.gov',
                    lon: Number(f.geometry?.coordinates?.[0] || 0),
                    lat: Number(f.geometry?.coordinates?.[1] || 0),
                    depthKm: Number(f.geometry?.coordinates?.[2] || 0),
                    kind: 'quake'
                }));
            } catch (_) {
                os.epState.events = [
                    { id: 'q1', title: '42 km E of Honshu, Japan', mag: 5.4, time: 'LIVE', lon: 142.4, lat: 38.2, depthKm: 34, kind: 'quake', url: 'https://earthquake.usgs.gov' },
                    { id: 'q2', title: 'Southern Alaska Trench', mag: 4.8, time: 'LIVE', lon: -151.8, lat: 59.4, depthKm: 21, kind: 'quake', url: 'https://earthquake.usgs.gov' },
                    { id: 'q3', title: 'Atacama Region, Chile', mag: 5.1, time: 'LIVE', lon: -70.5, lat: -26.8, depthKm: 48, kind: 'quake', url: 'https://earthquake.usgs.gov' }
                ];
            }
            os.epState.selected = os.epState.events[0] || null;
            os.epRenderEventList();
            os.epRenderSelectedBar();
        },

        epFetchEonet: async () => {
            const title = document.getElementById('ep-feed-title');
            if (title) title.textContent = 'NASA EONET ACTIVE EVENTS';
            try {
                const res = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=40');
                const data = await res.json();
                const evs = Array.isArray(data?.events) ? data.events : [];
                os.epState.events = evs.map((ev) => {
                    const g = ev.geometry && ev.geometry[ev.geometry.length - 1];
                    const coords = Array.isArray(g?.coordinates) ? g.coordinates : [0, 0];
                    const cat = ev.categories?.[0]?.title || 'Natural Event';
                    return {
                        id: ev.id,
                        title: ev.title,
                        category: cat,
                        mag: cat.includes('Volcano') ? 6.0 : cat.includes('Storm') ? 5.5 : 4.2,
                        time: g?.date ? g.date.slice(0, 10) : 'ACTIVE',
                        lon: Number(coords[0] || 0),
                        lat: Number(coords[1] || 0),
                        url: ev.sources?.[0]?.url || 'https://eonet.gsfc.nasa.gov',
                        kind: 'eonet'
                    };
                }).filter((x) => Number.isFinite(x.lon) && Number.isFinite(x.lat));
            } catch (_) {
                os.epState.events = [
                    { id: 'e1', title: 'Kilauea Volcano Thermal Anomaly', category: 'Volcanoes', mag: 6.0, time: 'ACTIVE', lon: -155.28, lat: 19.42, kind: 'eonet', url: 'https://eonet.gsfc.nasa.gov' },
                    { id: 'e2', title: 'Mount Etna Plume Activity', category: 'Volcanoes', mag: 5.8, time: 'ACTIVE', lon: 14.99, lat: 37.75, kind: 'eonet', url: 'https://eonet.gsfc.nasa.gov' }
                ];
            }
            os.epState.selected = os.epState.events[0] || null;
            os.epRenderEventList();
            os.epRenderSelectedBar();
        },

        epRenderEventList: () => {
            const list = document.getElementById('ep-event-list');
            const cnt = document.getElementById('ep-feed-count');
            if (cnt) cnt.textContent = `${os.epState.events.length} LIVE`;
            if (!list) return;
            list.innerHTML = os.epState.events.map((ev, idx) => {
                const badgeCol = ev.mag >= 5.5 ? 'bg-rose-500/20 text-rose-300 border-rose-400/35'
                               : ev.mag >= 4.0 ? 'bg-amber-500/20 text-amber-300 border-amber-400/35'
                               : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/35';
                const badgeTxt = ev.kind === 'quake' ? `M${ev.mag.toFixed(1)}` : (ev.category || 'EVENT').slice(0, 7).toUpperCase();
                const isSel = os.epState.selected && os.epState.selected.id === ev.id;
                return `
                    <button type="button" onclick="os.epSelectIndex(${idx})"
                        class="w-full text-left p-3 transition flex items-start gap-2.5 hover-target cursor-none ${isSel ? 'bg-white/10' : 'hover:bg-white/[0.04]'}">
                        <span class="px-2 py-0.5 rounded-md border font-mono text-[10px] font-bold shrink-0 ${badgeCol}">${esc(badgeTxt)}</span>
                        <div class="min-w-0 flex-1">
                            <div class="font-medium text-white truncate">${esc(ev.title)}</div>
                            <div class="text-[10px] font-mono text-gray-400 mt-0.5">${ev.lat.toFixed(2)}°, ${ev.lon.toFixed(2)}° · ${esc(ev.time)}</div>
                        </div>
                    </button>
                `;
            }).join('');
        },

        epSelectIndex: (idx) => {
            const ev = os.epState.events[idx];
            if (!ev) return;
            os.epState.selected = ev;
            os.epRenderEventList();
            os.epRenderSelectedBar();
        },

        epRenderSelectedBar: () => {
            const bar = document.getElementById('ep-selected-bar');
            const ev = os.epState.selected;
            if (!bar || !ev) return;
            const detail = ev.kind === 'quake'
                ? `Magnitude ${ev.mag.toFixed(1)} · Depth ${ev.depthKm.toFixed(1)} km${ev.tsunami ? ' · TSUNAMI WATCH' : ''}`
                : `${ev.category || 'Active Event'} · ${ev.lat.toFixed(2)}°, ${ev.lon.toFixed(2)}°`;
            bar.innerHTML = `
                <div class="min-w-0">
                    <div class="font-semibold text-white truncate">${esc(ev.title)}</div>
                    <div class="text-[10px] font-mono text-sky-300">${esc(detail)}</div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <button type="button" onclick="os.epJumpWindy(${ev.lat}, ${ev.lon})" class="px-3 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/35 text-sky-200 font-medium text-[11px] hover-target cursor-none">Inspect in Windy Radar →</button>
                    <a href="${esc(ev.url)}" target="_blank" rel="noopener" class="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/16 text-gray-200 text-[11px] hover-target cursor-none">Source ↗</a>
                </div>
            `;
        },

        epClickMap: (e) => {
            const c = document.getElementById('ep-map-canvas');
            if (!c || !os.epState.events.length) return;
            const r = c.getBoundingClientRect();
            const mx = ((e.clientX - r.left) / (r.width || 1)) * c.width;
            const my = ((e.clientY - r.top) / (r.height || 1)) * c.height;
            let best = null, bestD = 9999;
            os.epState.events.forEach((ev) => {
                const x = ((ev.lon + 180) / 360) * c.width;
                const y = ((90 - ev.lat) / 180) * c.height;
                const d = Math.hypot(mx - x, my - y);
                if (d < bestD) { bestD = d; best = ev; }
            });
            if (best && bestD < 42) {
                os.epState.selected = best;
                os.epRenderEventList();
                os.epRenderSelectedBar();
            }
        },

        epStartMapLoop: () => {
            if (os.epState.raf) cancelAnimationFrame(os.epState.raf);
            const draw = (ts) => {
                const c = document.getElementById('ep-map-canvas');
                if (!c) return;
                const ctx = c.getContext('2d');
                const w = c.width, h = c.height;
                ctx.fillStyle = '#040812';
                ctx.fillRect(0, 0, w, h);

                // Latitude / Longitude tactical grid
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
                ctx.lineWidth = 1;
                for (let lon = -150; lon <= 150; lon += 30) {
                    const x = ((lon + 180) / 360) * w;
                    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
                }
                for (let lat = -60; lat <= 60; lat += 30) {
                    const y = ((90 - lat) / 180) * h;
                    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
                }

                // Vector continent outlines
                ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
                ctx.fillStyle = 'rgba(30, 41, 59, 0.45)';
                ctx.lineWidth = 1.2;
                CONTINENT_OUTLINES.forEach((poly) => {
                    ctx.beginPath();
                    poly.forEach(([lon, lat], i) => {
                        const x = ((lon + 180) / 360) * w;
                        const y = ((90 - lat) / 180) * h;
                        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                    });
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                });

                // Pulsing seismic / natural event nodes
                const phase = ((ts || performance.now()) % 1800) / 1800;
                os.epState.events.forEach((ev) => {
                    const x = ((ev.lon + 180) / 360) * w;
                    const y = ((90 - ev.lat) / 180) * h;
                    const baseR = Math.max(3, Math.min(11, (ev.mag || 3) * 1.35));
                    const col = ev.mag >= 5.5 ? '#fb7185' : ev.mag >= 4.0 ? '#fbbf24' : '#34d399';
                    const isSel = os.epState.selected && os.epState.selected.id === ev.id;

                    if (isSel || ev.mag >= 4.8) {
                        ctx.strokeStyle = col;
                        ctx.lineWidth = isSel ? 1.8 : 1;
                        ctx.beginPath();
                        ctx.arc(x, y, baseR + phase * 18, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    ctx.fillStyle = col;
                    ctx.beginPath();
                    ctx.arc(x, y, baseR, 0, Math.PI * 2);
                    ctx.fill();

                    if (isSel) {
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 1.4;
                        ctx.strokeRect(x - 14, y - 14, 28, 28);
                    }
                });

                os.epState.raf = requestAnimationFrame(draw);
            };
            os.epState.raf = requestAnimationFrame(draw);
        },

        epJumpWindy: (lat, lon) => {
            os.epState.windyLat = lat;
            os.epState.windyLon = lon;
            os.epState.windyZoom = 6;
            os.epSetMode('windy');
        },

        epSetWindyLayer: (layer) => {
            os.epState.windyLayer = layer;
            os.epLoadWindy();
        },

        epLoadWindy: () => {
            const f = document.getElementById('ep-windy-frame');
            if (!f) return;
            const { windyLat, windyLon, windyZoom, windyLayer } = os.epState;
            f.src = `https://embed.windy.com/embed2.html?lat=${windyLat.toFixed(2)}&lon=${windyLon.toFixed(2)}&zoom=${windyZoom}&level=surface&overlay=${encodeURIComponent(windyLayer)}&product=ecmwf&menu=&message=true&marker=true&calendar=now&type=map&location=coordinates&metricWind=km%2Fh&metricTemp=%C2%B0C`;
        },

        // ── Archive & DOS Vault Methods ──
        wbState: {
            tab: 'dos',
            activeDosId: null
        },

        initWayback: () => {
            os.wbRenderDosList();
            os.wbSetTab(os.wbState.tab || 'dos');
        },

        killWayback: () => {
            ['wb-dos-frame', 'wb-tm-frame', 'wb-lib-embed'].forEach((id) => {
                const el = document.getElementById(id);
                if (el) el.src = 'about:blank';
            });
        },

        wbSetTab: (tab) => {
            os.wbState.tab = tab;
            ['dos', 'timemachine', 'library'].forEach((t) => {
                const p = document.getElementById(`wb-pane-${t}`);
                if (p) p.classList.toggle('hidden', t !== tab);
            });
            document.querySelectorAll('[data-wb-tab]').forEach((b) => {
                b.classList.toggle('active', b.getAttribute('data-wb-tab') === tab);
            });
            if (tab === 'dos' && !os.wbState.activeDosId) {
                os.wbBootDos(DOS_CLASSICS[1].id); // Prince of Persia ready to play
            } else if (tab === 'timemachine') {
                const f = document.getElementById('wb-tm-frame');
                if (f && f.src === 'about:blank') os.wbLookupSnapshot();
            } else if (tab === 'library') {
                const r = document.getElementById('wb-lib-results');
                if (r && !r.children.length) os.wbSearchLibrary();
            }
        },

        wbRenderDosList: () => {
            const el = document.getElementById('wb-dos-list');
            if (!el) return;
            el.innerHTML = DOS_CLASSICS.map((g) => `
                <button type="button" onclick="os.wbBootDos('${esc(g.id)}')"
                    class="w-full text-left p-2.5 rounded-xl border transition hover-target cursor-none ${os.wbState.activeDosId === g.id ? 'bg-amber-400/15 border-amber-400/40 text-white' : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.08] text-gray-200'}">
                    <div class="font-semibold text-xs">${esc(g.title)}</div>
                    <div class="text-[10px] font-mono text-gray-400 mt-0.5">${esc(g.genre)}</div>
                </button>
            `).join('');
        },

        wbBootDos: (id) => {
            os.wbState.activeDosId = id;
            os.wbRenderDosList();
            const game = DOS_CLASSICS.find((g) => g.id === id);
            const f = document.getElementById('wb-dos-frame');
            const now = document.getElementById('wb-dos-now');
            const ext = document.getElementById('wb-dos-ext');
            if (f) f.src = `https://archive.org/embed/${encodeURIComponent(id)}`;
            if (now && game) now.textContent = `Loaded: ${game.title} (${game.year}) — Click inside viewport to start`;
            if (ext) ext.href = `https://archive.org/details/${encodeURIComponent(id)}`;
        },

        wbQuickJump: (domain, year) => {
            const u = document.getElementById('wb-url-input');
            const y = document.getElementById('wb-year-select');
            if (u) u.value = domain;
            if (y) y.value = year;
            os.wbLookupSnapshot();
        },

        wbLookupSnapshot: async () => {
            const rawUrl = (document.getElementById('wb-url-input')?.value || 'apple.com').trim().replace(/^https?:\/\//i, '');
            const year = document.getElementById('wb-year-select')?.value || '2004';
            const pill = document.getElementById('wb-status-pill');
            const frame = document.getElementById('wb-tm-frame');
            const ext = document.getElementById('wb-snap-ext');
            if (pill) pill.textContent = `Querying Wayback CDX for ${rawUrl} (${year})...`;

            let snapUrl = `https://web.archive.org/web/${year}0615if_/http://${rawUrl}`;
            try {
                const res = await fetch(`https://archive.org/wayback/available?url=${encodeURIComponent(rawUrl)}&timestamp=${year}0615`);
                const data = await res.json();
                const closest = data?.archived_snapshots?.closest;
                if (closest?.timestamp) {
                    snapUrl = `https://web.archive.org/web/${closest.timestamp}if_/http://${rawUrl}`;
                    if (pill) pill.textContent = `Snapshot: ${closest.timestamp.slice(0, 4)}-${closest.timestamp.slice(4, 6)}-${closest.timestamp.slice(6, 8)} · HTTP ${closest.status || 200}`;
                }
            } catch (_) {
                if (pill) pill.textContent = `Loaded ${year} Time-Machine route for ${rawUrl}`;
            }
            if (frame) frame.src = snapUrl;
            if (ext) ext.href = snapUrl.replace('if_/', '/');
        },

        wbSearchLibrary: async () => {
            const q = (document.getElementById('wb-lib-query')?.value || 'synthwave').trim();
            const media = document.getElementById('wb-lib-media')?.value || 'all';
            const list = document.getElementById('wb-lib-results');
            if (!list) return;
            list.innerHTML = `<div class="text-gray-400 font-mono p-4">Searching Archive.org...</div>`;

            const mediaClause = media !== 'all' ? ` AND mediatype:(${media})` : ' AND mediatype:(movies OR audio OR texts)';
            try {
                const api = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q + mediaClause)}&fl[]=identifier&fl[]=title&fl[]=mediatype&fl[]=year&fl[]=creator&sort[]=downloads+desc&rows=18&page=1&output=json`;
                const res = await fetch(api);
                const data = await res.json();
                const docs = data?.response?.docs || [];
                if (!docs.length) {
                    list.innerHTML = `<div class="text-gray-500 p-4">No public-domain items matched "${esc(q)}".</div>`;
                    return;
                }
                list.innerHTML = docs.map((d) => `
                    <button type="button" onclick="os.wbPlayArchiveItem('${esc(d.identifier)}')"
                        class="w-full text-left p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/[0.07] transition hover-target cursor-none">
                        <div class="font-semibold text-white truncate">${esc(d.title || d.identifier)}</div>
                        <div class="text-[10px] font-mono text-sky-300 mt-0.5">${esc((d.mediatype || 'item').toUpperCase())} · ${esc(d.year || 'Archive')} · ${esc(d.creator || 'Public Domain')}</div>
                    </button>
                `).join('');
                os.wbPlayArchiveItem(docs[0].identifier);
            } catch (_) {
                list.innerHTML = `<div class="text-rose-300 p-4 font-mono">Archive.org search offline — check connection.</div>`;
            }
        },

        wbPlayArchiveItem: (identifier) => {
            const f = document.getElementById('wb-lib-embed');
            if (f) f.src = `https://archive.org/embed/${encodeURIComponent(identifier)}`;
        },

        // ── GitHub Explorer: real search data, bounded API source reads ──
        ossState: {repos:[],activeRepo:'MeYashverma/AetherOS-Prod',tree:[],ref:'',path:'',source:'',searchID:0,readID:0,controllers:{}},
        ossStatus: (message) => {const el=document.getElementById('oss-status');if(el)el.textContent=message;},
        ossValidRepo: (name) => typeof name==='string' && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(name) && !name.split('/').some(part=>part==='.'||part==='..'),
        ossDispose: () => {
            os.ossState.searchID++;os.ossState.readID++;
            Object.values(os.ossState.controllers).forEach(controller=>controller.abort());
            os.ossState.controllers={};
        },
        ossRequest: async (path, channel) => {
            os.ossState.controllers[channel]?.abort();
            const controller=new AbortController();os.ossState.controllers[channel]=controller;
            const timer=setTimeout(()=>controller.abort(),12000);
            try{
                const response=await fetch('https://api.github.com/'+path,{signal:controller.signal,credentials:'omit',headers:{Accept:'application/vnd.github+json'}});
                if(!response.ok){
                    const remaining=response.headers?.get('x-ratelimit-remaining'),reset=Number(response.headers?.get('x-ratelimit-reset'));
                    if(response.status===429||response.status===403&&remaining==='0')throw Error('GitHub rate limit reached'+(reset?' · retry after '+new Date(reset*1000).toLocaleTimeString():' · try again later'));
                    if(response.status===404)throw Error('Repository, ref or path not found (or not public)');
                    throw Error('GitHub request failed · HTTP '+response.status);
                }
                return await response.json();
            }catch(error){if(error.name==='AbortError')throw Error('Request cancelled or timed out');throw error;}
            finally{clearTimeout(timer);if(os.ossState.controllers[channel]===controller)delete os.ossState.controllers[channel];}
        },
        initOssRadar: () => {os.ossFetchTrending();os.ossInspectRepo(os.ossState.activeRepo);},
        ossFetchTrending: () => {
            const lang=document.getElementById('oss-lang')?.value||'',period=document.getElementById('oss-window')?.value||'month';
            const date=new Date();date.setUTCDate(date.getUTCDate()-(period==='month'?30:365));
            const query=[period==='legends'?'stars:>25000':'created:>'+date.toISOString().slice(0,10),lang?'language:'+lang:''].filter(Boolean).join(' ');
            return os.ossSearch(query);
        },
        ossSearchOrInspect: () => {
            const query=(document.getElementById('oss-query')?.value||'').trim();
            if(!query)return os.ossFetchTrending();
            return os.ossValidRepo(query)?os.ossInspectRepo(query):os.ossSearch(query);
        },
        ossSearch: async (query) => {
            const id=++os.ossState.searchID,list=document.getElementById('oss-repo-list');
            if(list)list.textContent='Searching public GitHub repositories…';
            try{
                const data=await os.ossRequest('search/repositories?q='+encodeURIComponent(query)+'&sort=stars&order=desc&per_page=24','search');
                if(id!==os.ossState.searchID)return;
                if(!Array.isArray(data.items))throw Error('Unexpected GitHub response');
                os.ossState.repos=data.items.filter(repo=>os.ossValidRepo(repo.full_name));
                os.ossRenderRepoList();os.ossStatus(os.ossState.repos.length+' results shown · sorted by stars'+(data.incomplete_results?' · GitHub reports incomplete results':''));
            }catch(error){if(id!==os.ossState.searchID)return;os.ossState.repos=[];if(list)list.textContent=error.message+' · use Refresh or change your search. No sample results are substituted.';os.ossStatus('Search unavailable');}
        },
        ossRenderRepoList: () => {
            const host=document.getElementById('oss-repo-list');if(!host)return;host.replaceChildren();
            if(!os.ossState.repos.length){host.textContent='No repositories match this search. Try a broader query or another creation period.';return;}
            for(const repo of os.ossState.repos){
                const button=document.createElement('button');button.type='button';button.className='oss-repo-card';button.setAttribute('aria-pressed',String(repo.full_name===os.ossState.activeRepo));
                const title=document.createElement('strong'),description=document.createElement('p'),meta=document.createElement('span');
                title.textContent=repo.full_name;description.textContent=repo.description||'No description provided';
                const count=value=>Number.isFinite(value)?value.toLocaleString():'—';
                meta.textContent=`★ ${count(repo.stargazers_count)} · forks ${count(repo.forks_count)} · ${repo.language||'Unspecified language'}`;
                button.append(title,description,meta);button.addEventListener('click',()=>os.ossInspectRepo(repo.full_name));host.append(button);
            }
        },
        ossInspectRepo: async (name) => {
            if(!os.ossValidRepo(name)){os.ossStatus('Enter a valid owner/repository');return;}
            os.ossState.activeRepo=name;os.ossState.ref='';os.ossState.source='';
            const ref=document.getElementById('oss-ref');if(ref)ref.value='';
            os.ossRenderRepoList();
            const header=document.getElementById('oss-repo-header');
            if(header){
                header.replaceChildren();const title=document.createElement('strong');title.textContent=name;header.append(title);
                const copy=document.createElement('button');copy.className='os-btn';copy.type='button';copy.textContent='Copy git clone';copy.addEventListener('click',()=>os.ossCopy('git clone https://github.com/'+name+'.git','Clone command'));header.append(copy);
                const link=document.createElement('a');link.href='https://github.com/'+name;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open on GitHub ↗';header.append(link);
            }
            return os.ossOpenPath(name,'','dir');
        },
        ossChangeRef: () => {
            os.ossState.ref=(document.getElementById('oss-ref')?.value||'').trim();
            return os.ossOpenPath(os.ossState.activeRepo,'','dir');
        },
        ossRefresh: () => {
            const query=(document.getElementById('oss-query')?.value||'').trim();
            if(query&&!os.ossValidRepo(query))os.ossSearch(query);else os.ossFetchTrending();
            return os.ossOpenPath(os.ossState.activeRepo,os.ossState.path||'','dir');
        },
        ossCopy: async (text,label) => {
            try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(text);os.ossStatus(label+' copied');}
            catch(_){os.ossStatus('Copy unavailable or denied · select the source text manually');}
        },
        ossCopySource: () => os.ossState.source?os.ossCopy(os.ossState.source,'Source'):os.ossStatus('Open a text file first'),
        ossToggleWrap: (button) => {
            const code=document.getElementById('oss-code-viewer');if(!code)return;
            const enabled=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(enabled));code.classList.toggle('oss-wrap',enabled);
        },
        ossFocusSource: (button) => {
            const root=document.getElementById('oss-root');if(!root)return;
            const enabled=root.classList.toggle('oss-source-focus');button.setAttribute('aria-pressed',String(enabled));button.textContent=enabled?'Exit focus':'Focus';
        },
        ossFindSource: (query) => {
            const code=document.getElementById('oss-code-viewer'),counter=document.getElementById('oss-find-count'),source=os.ossState.source;
            if(!code)return;if(!source){if(counter)counter.textContent='Open a file first';return;}
            code.replaceChildren();if(!query){code.textContent=source;if(counter)counter.textContent='';return;}
            const lower=source.toLowerCase(),needle=query.toLowerCase();let offset=0,count=0,index;
            while(count<1000&&(index=lower.indexOf(needle,offset))!==-1){
                code.append(document.createTextNode(source.slice(offset,index)));const mark=document.createElement('mark');mark.textContent=source.slice(index,index+query.length);code.append(mark);offset=index+query.length;count++;
            }
            code.append(document.createTextNode(source.slice(offset)));if(counter)counter.textContent=count+(count===1000?'+':'')+' matches';
        },
        ossDownloadSource: () => {
            if(!os.ossState.source){os.ossStatus('Open a nonempty text file first');return;}
            const url=URL.createObjectURL(new Blob([os.ossState.source],{type:'text/plain;charset=utf-8'})),link=document.createElement('a');
            link.href=url;link.download=os.ossState.fileName||'source.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
            os.ossStatus('Source download requested');
        },
        ossOpenPath: async (repo,path,type) => {
            if(!os.ossValidRepo(repo)||repo!==os.ossState.activeRepo||typeof path!=='string'||path.split('/').some(part=>part==='.'||part==='..'))return;
            const id=++os.ossState.readID,ref=os.ossState.ref,tree=document.getElementById('oss-file-tree'),code=document.getElementById('oss-code-viewer'),label=document.getElementById('oss-file-label');
            os.ossState.source='';if(label)label.textContent=path||'/';
            if(code)code.textContent=type==='dir'?'Loading directory…':'Loading source…';
            if(type==='dir'&&tree)tree.textContent='Loading directory…';
            try{
                const url='repos/'+repo.split('/').map(encodeURIComponent).join('/')+'/contents/'+path.split('/').map(encodeURIComponent).join('/')+(ref?'?ref='+encodeURIComponent(ref):'');
                const data=await os.ossRequest(url,'contents');if(id!==os.ossState.readID)return;
                if(type==='dir'){
                    if(!Array.isArray(data))throw Error('Expected a directory listing');
                    os.ossState.path=path;os.ossState.tree=data;
                    if(tree){
                        tree.replaceChildren();
                        const add=(text,target,kind)=>{const button=document.createElement('button');button.type='button';button.className='oss-tree-item';button.textContent=text;button.addEventListener('click',()=>os.ossOpenPath(repo,target,kind));tree.append(button);};
                        if(path)add('← Parent directory',path.includes('/')?path.slice(0,path.lastIndexOf('/')):'','dir');
                        const items=[...data].sort((a,b)=>Number(b.type==='dir')-Number(a.type==='dir')||String(a.name).localeCompare(String(b.name)));
                        for(const item of items)if(['dir','file'].includes(item.type)&&typeof item.path==='string')add((item.type==='dir'?'▸ ':'')+item.name,item.path,item.type);
                        if(!data.length)tree.textContent='This directory is empty.';
                    }
                    if(code)code.textContent='Select a file to read its source. Files are displayed as text, never executed. GitHub limits directory listings to 1,000 entries.';
                    os.ossStatus((path||'/')+' · '+data.length+' entries · '+(ref||'default branch'));
                }else{
                    if(!data||data.type!=='file')throw Error('This item is not a regular file');
                    if(data.size>262144)throw Error('File exceeds the 256 KiB preview limit · open on GitHub');
                    if(data.encoding!=='base64'||typeof data.content!=='string')throw Error('Source unavailable in Contents API · open on GitHub');
                    const bytes=Uint8Array.from(atob(data.content.replace(/\s/g,'')),char=>char.charCodeAt(0));
                    if(bytes.length>262144||bytes.includes(0))throw Error('Binary or oversized file · preview is text-only');
                    let source;try{source=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch(_){throw Error('Not UTF-8 text · preview unavailable');}
                    os.ossState.source=source;os.ossState.fileName=path.split('/').pop();if(code)code.textContent=source||'(Empty file)';
                    const find=document.getElementById('oss-source-find');if(find?.value)os.ossFindSource(find.value);
                    if(label)label.textContent=path+' · '+bytes.length.toLocaleString()+' bytes';
                    os.ossStatus('Source loaded · '+(ref||'default branch')+' · not executed');
                }
            }catch(error){if(id!==os.ossState.readID)return;if(code)code.textContent=error.message;if(type==='dir'&&tree)tree.textContent='Directory unavailable · check ref or use Refresh.';os.ossStatus('Could not load '+(path||repo));}
        }
    });
})();
