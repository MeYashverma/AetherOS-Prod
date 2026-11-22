// AetherOS — Window DOM Templates (network-workspace-templates)
Object.assign(WindowContents, {
    presence: `
                <div class="flex flex-col h-full bg-gradient-to-br from-os-800 to-black relative overflow-hidden p-4 text-xs font-mono" id="presence-console-panel">
                    <!-- Loaded dynamically via os.renderPresenceDashboard() -->
                </div>
            `,

    feed: `
                <div class="flex flex-col h-full bg-os-900 text-xs font-mono" id="signal-feed-root">
                    <div class="h-10 border-b border-white/5 px-4 flex justify-between items-center text-[10px] font-mono text-os-accent uppercase">
                        <span>Global Signal Intercept</span>
                        <span class="text-green-500 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> LIVE_STREAM</span>
                    </div>
                    <div class="flex-1 p-3 overflow-y-hidden relative bg-black/20">
                        <div class="absolute inset-0 opacity-10 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]"></div>
                        <div class="h-full overflow-y-auto space-y-2 pr-1 relative z-10" id="signal-stream-container">
                            <div class="py-6 text-center text-gray-500 text-[10px] animate-pulse">
                                TUNING EXTERNAL FREQUENCIES...
                            </div>
                        </div>
                    </div>
                    <div class="border-t border-white/5 p-2 bg-black/40 text-[9px] text-gray-500 flex justify-between items-center">
                        <span id="signal-sources-lbl">SOURCES: AWAITING UPLINK...</span>
                        <span id="signal-buffer-count" class="font-bold text-white">BUFFER: 0</span>
                    </div>
                </div>
            `,

    floor796: `
                <div class="h-full flex flex-col bg-[#060607] overflow-hidden font-mono relative" id="floor796-root">
                    <div class="absolute inset-0 pointer-events-none opacity-30" style="background:radial-gradient(circle at 10% 8%,rgba(250,204,21,.12),transparent 32%),radial-gradient(circle at 85% 0%,rgba(59,130,246,.13),transparent 36%),linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);background-size:auto,auto,28px 28px,28px 28px;"></div>
                    <div class="relative z-10 h-12 px-3 border-b border-white/10 bg-black/60 flex items-center gap-2 shrink-0">
                        <div class="flex items-center gap-2 pr-3 border-r border-white/10"><span class="w-2 h-2 rounded-full bg-yellow-300 shadow-[0_0_12px_rgba(250,204,21,.9)] animate-pulse"></span><span class="text-white font-display uppercase tracking-widest text-sm">Floor796 Explorer</span><span id="floor796-status" class="text-[9px] text-gray-500 uppercase">BRIDGE READY</span></div>
                        <button onclick="os.floor796LoadBlobBridge()" class="px-2.5 py-1.5 rounded bg-yellow-400 text-black font-bold text-[10px] uppercase hover:bg-yellow-300 cursor-none hover-target transition"><i data-lucide="download-cloud" class="inline w-3 h-3 mr-1"></i>Blob Bridge</button>
                        <button onclick="os.floor796PickLocalMirror()" class="px-2.5 py-1.5 rounded bg-green-500/15 border border-green-500/25 text-green-100 text-[10px] uppercase hover:bg-green-500/25 cursor-none hover-target transition"><i data-lucide="upload" class="inline w-3 h-3 mr-1"></i>Upload HTML</button>
                        <button onclick="os.floor796LoadSavedMirror()" class="px-2.5 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-100 text-[10px] uppercase hover:bg-emerald-500/20 cursor-none hover-target transition"><i data-lucide="hard-drive" class="inline w-3 h-3 mr-1"></i>Saved</button>
                        <button onclick="os.floor796LaunchNativeRuntime()" class="px-2.5 py-1.5 rounded bg-purple-500/15 border border-purple-500/25 text-purple-100 text-[10px] uppercase hover:bg-purple-500/25 cursor-none hover-target transition"><i data-lucide="panel-top-open" class="inline w-3 h-3 mr-1"></i>Native</button>
                        <button onclick="os.floor796LoadLiveRewrite()" class="px-2.5 py-1.5 rounded bg-cyan-500/15 border border-cyan-500/25 text-cyan-100 text-[10px] uppercase hover:bg-cyan-500/25 cursor-none hover-target transition"><i data-lucide="wand-sparkles" class="inline w-3 h-3 mr-1"></i>Live Rewrite</button>
                        <input id="floor796-file-input" type="file" accept=".html,.htm,text/html" class="hidden" onchange="os.floor796LoadLocalMirror(this.files && this.files[0]); this.value=''">
                        <button onclick="os.floor796TryIframe()" class="px-2.5 py-1.5 rounded bg-white/10 border border-white/10 text-white text-[10px] uppercase hover:bg-white/15 cursor-none hover-target transition"><i data-lucide="scan-eye" class="inline w-3 h-3 mr-1"></i>Probe iframe</button>
                        <button onclick="os.floor796LoadIntel()" class="px-2.5 py-1.5 rounded bg-blue-500/15 border border-blue-500/25 text-blue-100 text-[10px] uppercase hover:bg-blue-500/25 cursor-none hover-target transition"><i data-lucide="radar" class="inline w-3 h-3 mr-1"></i>Intel</button>
                        <button onclick="os.floor796ToggleGuide()" class="px-2.5 py-1.5 rounded bg-white/5 border border-white/10 text-gray-300 text-[10px] uppercase hover:bg-white/10 cursor-none hover-target transition"><i data-lucide="info" class="inline w-3 h-3 mr-1"></i>Guide</button>
                        <div class="ml-auto w-44 h-1.5 bg-white/10 rounded overflow-hidden hidden md:block"><div id="floor796-progress" class="h-full w-0 bg-yellow-300 transition-all"></div></div>
                    </div>
                    <div class="relative z-10 flex-1 min-h-0 grid grid-cols-[1fr_270px] bg-black/35">
                        <div class="relative min-w-0">
                            <iframe id="floor796-frame" title="Floor796 Blob Bridge" src="about:blank" class="absolute inset-0 w-full h-full border-0 bg-[#101014]" style="pointer-events:auto!important;cursor:auto!important;" allow="fullscreen; autoplay; clipboard-read; clipboard-write" referrerpolicy="no-referrer-when-downgrade"></iframe>
                            <div id="floor796-guide" class="absolute left-4 top-4 w-[360px] max-w-[calc(100%-2rem)] rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-os-panel p-4 text-[10px] text-gray-400 space-y-3">
                                <div class="flex items-start justify-between gap-3"><div><div class="text-yellow-200 font-display uppercase tracking-widest text-base">Iframe Workaround</div><div class="text-gray-600 uppercase tracking-[0.2em] text-[8px]">floor796.com blocks normal embedding</div></div><button onclick="os.floor796ToggleGuide(false)" class="text-gray-500 hover:text-white cursor-none hover-target"><i data-lucide="x" class="w-4 h-4"></i></button></div>
                                <p class="leading-relaxed select-text">Floor796 sends <span class="text-white">frame-ancestors 'self'</span>, so a normal iframe is expected to fail. Best first try: <span class="text-cyan-200">Live Rewrite</span>, which fetches the small live shell and rewrites it into a same-frame srcdoc app. Use Upload/Saved for the huge offline mirror.</p>
                                <div class="rounded-lg bg-yellow-400/10 border border-yellow-400/20 p-2 text-yellow-100/80">The online mirror is huge (~180 MB). Uploading your local copy avoids the long network download. AetherOS stores it in IndexedDB, so after refresh use Saved (or it auto-restores when possible).</div>
                                <div class="grid grid-cols-2 gap-2"><button onclick="os.floor796LoadLiveRewrite()" class="py-2 rounded bg-cyan-300 text-black font-bold uppercase text-[10px] cursor-none hover-target">Live Rewrite</button><button onclick="os.floor796PickLocalMirror()" class="py-2 rounded bg-green-400 text-black font-bold uppercase text-[10px] cursor-none hover-target">Upload Local</button><button onclick="os.floor796LoadBlobBridge()" class="py-2 rounded bg-yellow-300 text-black font-bold uppercase text-[10px] cursor-none hover-target">Download Bridge</button><button onclick="os.floor796LoadIntel()" class="py-2 rounded bg-white/10 border border-white/10 text-white uppercase text-[10px] cursor-none hover-target">Load Intel</button></div>
                            </div>
                            <div id="floor796-stuck-panel" class="hidden absolute right-4 bottom-4 w-80 rounded-2xl border border-red-400/20 bg-black/85 backdrop-blur-xl shadow-os-panel p-4 text-[10px] text-gray-300 space-y-3">
                                <div class="text-red-200 font-display uppercase tracking-widest text-sm">Loader Watchdog</div>
                                <p class="text-gray-400 leading-relaxed">The embedded runtime appears stuck after reaching 100%. This is a known limitation of Floor796's giant offline runtime inside nested frames. Try the native runtime or force-hide the loader.</p>
                                <div class="grid grid-cols-2 gap-2"><button onclick="os.floor796LoadLiveRewrite()" class="py-2 rounded bg-cyan-400 text-black font-bold uppercase cursor-none hover-target">Live Rewrite</button><button onclick="os.floor796ForceHideLoader()" class="py-2 rounded bg-white/10 border border-white/10 text-white uppercase cursor-none hover-target">Hide Loader</button><button onclick="os.floor796LaunchNativeRuntime()" class="py-2 rounded bg-purple-400 text-black font-bold uppercase cursor-none hover-target">Native</button><button onclick="os.floor796LoadSavedMirror()" class="py-2 rounded bg-emerald-500/15 border border-emerald-500/25 text-emerald-100 uppercase cursor-none hover-target">Saved</button></div>
                            </div>
                        </div>
                        <div class="border-l border-white/10 bg-black/50 flex flex-col min-w-0">
                            <div class="p-3 border-b border-white/10"><div class="text-yellow-200 uppercase tracking-widest text-[9px]">Scene Intel</div><div id="floor796-intel-summary" class="text-gray-500 text-[10px] mt-1">Awaiting changelog scan...</div></div>
                            <div class="p-2 border-b border-white/5"><input id="floor796-search" oninput="os.floor796RenderIntel(this.value)" class="w-full bg-black/60 border border-white/10 rounded px-2 py-1.5 text-[10px] text-white outline-none cursor-text" placeholder="Filter updates / refs..."></div>
                            <div id="floor796-intel-list" class="flex-1 overflow-y-auto p-2 space-y-2 text-[10px]"><div class="text-gray-600 p-3 text-center">Press Intel to load recent updates.</div></div>
                        </div>
                    </div>
                </div>
            `,

    wplace: `
                <div class="h-full flex flex-col bg-[#050507] overflow-hidden font-mono relative" id="wplace-root">
                    <div class="absolute inset-0 pointer-events-none opacity-25" style="background:radial-gradient(circle at 12% 0%,rgba(79,70,229,.18),transparent 35%),radial-gradient(circle at 88% 10%,rgba(236,72,153,.14),transparent 34%),linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px);background-size:auto,auto,32px 32px,32px 32px;"></div>
                    <div class="relative z-10 h-12 px-3 border-b border-white/10 bg-black/55 flex items-center gap-2 shrink-0">
                        <div class="flex items-center gap-2 pr-3 border-r border-white/10"><span class="w-2 h-2 rounded-full bg-fuchsia-400 shadow-[0_0_12px_rgba(232,121,249,.9)] animate-pulse"></span><span class="text-white font-display uppercase tracking-widest text-sm">Wplace Live</span><span id="wplace-status" class="text-[9px] text-gray-500 uppercase">EMBED READY</span></div>
                        <button onclick="os.wplaceLoad()" class="px-2.5 py-1.5 rounded bg-white/10 border border-white/10 text-white text-[10px] uppercase hover:bg-white/15 cursor-none hover-target transition"><i data-lucide="refresh-cw" class="inline w-3 h-3 mr-1"></i>Reload</button>
                        <button onclick="os.wplaceOpenExternal()" class="px-2.5 py-1.5 rounded bg-fuchsia-500/15 border border-fuchsia-500/25 text-fuchsia-100 text-[10px] uppercase hover:bg-fuchsia-500/25 cursor-none hover-target transition"><i data-lucide="external-link" class="inline w-3 h-3 mr-1"></i>Open Live</button>
                        <button onclick="os.wplaceToggleOverlay()" class="px-2.5 py-1.5 rounded bg-white/5 border border-white/10 text-gray-300 text-[10px] uppercase hover:bg-white/10 cursor-none hover-target transition"><i data-lucide="info" class="inline w-3 h-3 mr-1"></i>Guide</button>
                        <div class="ml-auto text-[9px] text-gray-500 uppercase tracking-widest hidden md:block">global pixel canvas / iframe bridge</div>
                    </div>
                    <div class="relative z-10 flex-1 min-h-0 bg-black/35">
                        <iframe id="wplace-frame" title="Wplace Live" src="about:blank" class="absolute inset-0 w-full h-full border-0 bg-black" allow="clipboard-read; clipboard-write; fullscreen; geolocation; web-share" referrerpolicy="no-referrer-when-downgrade"></iframe>
                        <div id="wplace-overlay" class="absolute left-4 top-4 w-80 max-w-[calc(100%-2rem)] rounded-2xl border border-white/10 bg-black/75 backdrop-blur-xl shadow-os-panel p-4 text-[10px] text-gray-400 space-y-3">
                            <div class="flex items-start justify-between gap-3"><div><div class="text-fuchsia-200 font-display uppercase tracking-widest text-base">Wplace Bridge</div><div class="text-gray-600 uppercase tracking-[0.2em] text-[8px]">https://wplace.live/</div></div><button onclick="os.wplaceToggleOverlay(false)" class="text-gray-500 hover:text-white cursor-none hover-target"><i data-lucide="x" class="w-4 h-4"></i></button></div>
                            <p class="leading-relaxed select-text">This module embeds Wplace Live as an interactive external canvas. If the site or browser blocks iframe embedding, use <span class="text-white">Open Live</span>; the module still keeps a launcher/status panel inside AetherOS.</p>
                            <div class="grid grid-cols-2 gap-2"><div class="rounded-lg bg-white/[0.04] border border-white/5 p-2"><div class="text-gray-600 uppercase text-[8px]">Mode</div><div class="text-white">Live iframe</div></div><div class="rounded-lg bg-white/[0.04] border border-white/5 p-2"><div class="text-gray-600 uppercase text-[8px]">Fallback</div><div class="text-white">External launch</div></div></div>
                            <div class="flex gap-2"><button onclick="os.wplaceLoad()" class="flex-1 py-2 rounded bg-white text-black font-bold uppercase text-[10px] cursor-none hover-target">Start Embed</button><button onclick="os.wplaceOpenExternal()" class="flex-1 py-2 rounded bg-white/10 border border-white/10 text-white uppercase text-[10px] cursor-none hover-target">Open Tab</button></div>
                        </div>
                    </div>
                </div>
            `,

    browser: `
                <div class="flex flex-col h-full bg-[#08080a] overflow-hidden font-mono" id="browser-root">

                    <!-- Toolbar -->
                    <div class="flex items-center gap-1.5 px-2 py-2 border-b border-white/5 bg-black/50 shrink-0">
                        <button onclick="os.browserNav('back')" id="browser-btn-back" title="Back"
                            class="p-1.5 rounded hover:bg-white/10 transition text-gray-500 hover:text-white cursor-none hover-target disabled:opacity-30">
                            <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
                        </button>
                        <button onclick="os.browserNav('forward')" id="browser-btn-fwd" title="Forward"
                            class="p-1.5 rounded hover:bg-white/10 transition text-gray-500 hover:text-white cursor-none hover-target">
                            <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                        </button>

                        <!-- URL bar -->
                        <div class="flex-1 relative flex items-center">
                            <i data-lucide="globe" class="absolute left-2.5 w-3 h-3 text-gray-500 pointer-events-none"></i>
                            <input id="browser-url-input" type="text"
                                class="w-full bg-black/60 border border-white/10 rounded pl-8 pr-24 py-1.5 text-[11px] text-white font-mono focus:outline-none focus:border-white/25 transition cursor-none hover-target"
                                placeholder="Search or enter URL..."
                                onkeydown="if(event.key==='Enter') os.browserGo()">
                            <button onclick="os.browserGo()"
                                class="absolute right-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded text-[9px] text-white uppercase tracking-wider transition cursor-none hover-target">
                                GO
                            </button>
                        </div>

                        <button onclick="os.browserOpenExternal()" title="Open in new tab" aria-label="Open in new tab"
                            class="p-1.5 rounded hover:bg-white/10 transition text-gray-500 hover:text-white cursor-none hover-target">
                            <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                        </button>
                        <button onclick="os.browserToggleFav()" id="browser-btn-fav"
                            class="p-1.5 rounded hover:bg-white/10 transition text-gray-500 hover:text-yellow-400 cursor-none hover-target">
                            <i data-lucide="star" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>

                    <!-- Tabs row -->
                    <div class="flex gap-1 px-2 pt-1.5 pb-0 border-b border-white/5 shrink-0 overflow-x-auto no-scrollbar" id="browser-tabs-row"></div>

                    <!-- Content area — two views: home / preview -->
                    <div class="flex-1 overflow-hidden relative">

                        <!-- HOME VIEW: shown when no active page -->
                        <div id="browser-home" class="absolute inset-0 overflow-y-auto p-4 space-y-5">

                            <!-- Search bar (big) -->
                            <div class="flex gap-2 mt-1">
                                <div class="flex-1 relative">
                                    <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"></i>
                                    <input id="browser-search-big" type="text"
                                        class="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/25 cursor-none hover-target"
                                        placeholder="Search DuckDuckGo..."
                                        onkeydown="if(event.key==='Enter') os.browserSearch(this.value)">
                                </div>
                                <button onclick="os.browserSearch(document.getElementById('browser-search-big').value)"
                                    class="px-4 py-2.5 bg-white/8 border border-white/10 rounded-lg text-sm text-white hover:bg-white/15 transition cursor-none hover-target">
                                    Search
                                </button>
                            </div>

                            <!-- Quick launch tiles -->
                            <div>
                                <div class="text-[9px] text-gray-500 uppercase tracking-widest mb-2">QUICK LAUNCH</div>
                                <div class="grid grid-cols-4 gap-2" id="browser-quicklaunch"></div>
                            </div>

                            <!-- Bookmarks -->
                            <div id="browser-bookmarks-section" class="hidden">
                                <div class="text-[9px] text-gray-500 uppercase tracking-widest mb-2 flex items-center justify-between">
                                    <span>BOOKMARKS</span>
                                    <button onclick="os.browserClearBookmarks()" class="text-red-500/60 hover:text-red-400 text-[8px] cursor-none hover-target">CLEAR ALL</button>
                                </div>
                                <div class="space-y-1" id="browser-bookmarks-list"></div>
                            </div>

                            <!-- Session history -->
                            <div id="browser-history-section" class="hidden">
                                <div class="text-[9px] text-gray-500 uppercase tracking-widest mb-2 flex items-center justify-between">
                                    <span>SESSION HISTORY</span>
                                    <button onclick="os.browserClearHistory()" class="text-red-500/60 hover:text-red-400 text-[8px] cursor-none hover-target">CLEAR</button>
                                </div>
                                <div class="space-y-0.5" id="browser-history-list"></div>
                            </div>
                        </div>

                        <!-- PREVIEW VIEW: shown when a page is "loaded" -->
                        <div id="browser-preview" class="absolute inset-0 hidden flex-col">

                            <!-- Preview meta bar -->
                            <div class="flex items-center justify-between px-3 py-1.5 bg-black/60 border-b border-white/5 shrink-0">
                                <div class="flex items-center gap-2 text-[10px]">
                                    <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                    <span class="text-gray-400" id="browser-preview-domain">--</span>
                                    <span class="text-gray-600">·</span>
                                    <span class="text-gray-500" id="browser-preview-title">--</span>
                                </div>
                                <div class="flex gap-1.5">
                                    <button onclick="os.browserOpenExternal()"
                                        class="flex items-center gap-1 px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-white hover:bg-white/15 transition cursor-none hover-target">
                                        <i data-lucide="external-link" class="w-3 h-3"></i> OPEN IN BROWSER
                                    </button>
                                    <button onclick="os.browserShowHome()"
                                        class="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-gray-400 hover:text-white hover:bg-white/10 transition cursor-none hover-target">
                                        HOME
                                    </button>
                                </div>
                            </div>

                            <!-- Fetch content area -->
                            <div class="flex-1 overflow-y-auto p-4 no-scrollbar" id="browser-preview-content"></div>
                        </div>

                    </div>

                    <!-- Status bar -->
                    <div class="flex items-center justify-between px-3 py-1 border-t border-white/5 bg-black/40 shrink-0 text-[9px] text-gray-600">
                        <span id="browser-status">READY</span>
                        <span class="text-gray-700">AETHEROS WEBPROXY v2 · TABS OPEN IN HOST BROWSER</span>
                    </div>
                </div>
            `,

    globe: `
                <div class="w-full h-full bg-[#0a0a0c] relative overflow-hidden flex font-mono text-[11px] text-gray-400" id="globe-root">

                    <!-- LEFT PANEL: Detail sidebar -->
                    <div class="w-60 bg-[#08080a] border-r border-white/5 flex flex-col z-20 shrink-0 h-full overflow-hidden">

                        <!-- Search + refresh bar -->
                        <div class="p-2 border-b border-white/5 bg-black/40 space-y-2">
                            <div class="relative">
                                <i data-lucide="search" class="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500"></i>
                                <input type="text" id="flight-radar-search"
                                    class="w-full bg-black/60 border border-white/10 rounded py-1.5 pl-7 pr-2 text-[10px] text-white focus:outline-none focus:border-white/30 cursor-none hover-target"
                                    placeholder="Search callsign / ICAO..."
                                    oninput="os.filterFlights(this.value)">
                            </div>
                            <div class="flex items-center justify-between">
                                <button onclick="os.fetchGlobeData()" id="globe-refresh-btn"
                                    class="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] text-white hover:bg-white/10 transition cursor-none hover-target">
                                    <i data-lucide="refresh-cw" class="w-3 h-3"></i> REFRESH
                                </button>
                                <span id="globe-flight-count" class="text-[9px] text-green-400 font-bold tracking-wider">0 LIVE</span>
                            </div>
                        </div>

                        <!-- Selected flight detail panel (shown when a flight is clicked) -->
                        <div id="radar-detail-panel" class="border-b border-white/5 bg-black/30 hidden">
                            <div id="radar-detail-embed-note" class="hidden px-2 py-1 text-[9px] text-yellow-300 bg-yellow-500/10 border-b border-yellow-500/20">
                                EMBED VIEW active: selected-flight telemetry is paused; switch to LIVE FEED to re-enable.
                            </div>

                            <!-- Aircraft image strip -->
                            <div class="relative h-20 bg-black overflow-hidden">
                                <div id="radar-aircraft-img" class="absolute inset-0 bg-cover bg-center opacity-60"></div>
                                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                                <div class="absolute bottom-1.5 left-2 right-2 flex justify-between items-end z-10">
                                    <div>
                                        <div class="text-white font-bold text-sm tracking-wider" id="rd-callsign">THY171</div>
                                        <div class="text-[9px] text-gray-400" id="rd-icao">4BB199</div>
                                    </div>
                                    <button onclick="os.deselectFlight()"
                                        class="text-[9px] bg-red-900/50 border border-red-500/30 text-red-400 px-1.5 py-0.5 rounded cursor-none hover-target">✕</button>
                                </div>
                            </div>

                            <!-- Metadata grid -->
                            <div class="p-2 space-y-1 text-[10px]">
                                <!-- SPATIAL section -->
                                <div class="text-[8px] text-os-accent tracking-widest uppercase border-b border-white/5 pb-0.5 mb-1">SPATIAL</div>
                                <div class="grid grid-cols-2 gap-x-2 gap-y-0.5">
                                    <span class="text-gray-500">Groundspeed</span><span class="text-white font-bold text-right" id="rd-speed">-- kt</span>
                                    <span class="text-gray-500">Baro. alt.</span><span class="text-yellow-400 font-bold text-right" id="rd-baro">-- ft</span>
                                    <span class="text-gray-500">Geo. alt.</span><span class="text-white text-right" id="rd-geoalt">-- ft</span>
                                    <span class="text-gray-500">Vert. Rate</span><span class="text-right" id="rd-vrate">-- ft/min</span>
                                    <span class="text-gray-500">Track</span><span class="text-white text-right" id="rd-track">--°</span>
                                    <span class="text-gray-500">Position</span><span class="text-green-400 text-right font-mono text-[9px]" id="rd-pos">--, --</span>
                                </div>

                                <!-- SIGNAL section -->
                                <div class="text-[8px] text-os-accent tracking-widest uppercase border-b border-white/5 pb-0.5 mb-1 mt-2">SIGNAL</div>
                                <div class="grid grid-cols-2 gap-x-2 gap-y-0.5">
                                    <span class="text-gray-500">Source</span><span class="text-blue-400 font-bold text-right" id="rd-source">ADS-B</span>
                                    <span class="text-gray-500">Squawk</span><span class="text-orange-400 font-bold text-right" id="rd-squawk">----</span>
                                    <span class="text-gray-500">Country</span><span class="text-white text-right truncate" id="rd-country">--</span>
                                    <span class="text-gray-500">ICAO24</span><span class="text-green-400 font-mono text-right" id="rd-icao24">------</span>
                                </div>

                                <!-- FLIGHT section -->
                                <div class="text-[8px] text-os-accent tracking-widest uppercase border-b border-white/5 pb-0.5 mb-1 mt-2">FLIGHT INFO</div>
                                <div class="grid grid-cols-2 gap-x-2 gap-y-0.5">
                                    <span class="text-gray-500">Reg.</span><span class="text-white text-right" id="rd-reg">--</span>
                                    <span class="text-gray-500">Type</span><span class="text-white text-right" id="rd-type">--</span>
                                    <span class="text-gray-500">Route</span><span class="text-white text-right font-bold" id="rd-route">--</span>
                                    <span class="text-gray-500">On Ground</span><span class="text-right" id="rd-ground">--</span>
                                </div>

                                <!-- Track history button -->
                                <button onclick="os.fetchAndDrawVesselTrail(os.selectedFlight)"
                                    class="w-full mt-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] text-white hover:bg-white/10 transition cursor-none hover-target flex items-center justify-center gap-1">
                                    <i data-lucide="route" class="w-3 h-3"></i> LOAD FLIGHT PATH
                                </button>
                            </div>
                        </div>

                        <!-- Flight list -->
                        <div class="flex-1 overflow-y-auto p-1.5 space-y-0.5 no-scrollbar" id="flight-manifest-list">
                            <div class="text-center text-gray-500 py-6 text-[10px] animate-pulse uppercase tracking-widest">Scanning airspace...</div>
                        </div>

                        <!-- Altitude color legend (matches OpenSky map) -->
                        <div class="border-t border-white/5 p-2 bg-black/40 shrink-0">
                            <div class="text-[8px] text-gray-500 uppercase tracking-widest mb-1">Altitude (ft)</div>
                            <div class="flex h-2.5 rounded overflow-hidden w-full">
                                <div class="flex-1" style="background:#ff0000"></div>
                                <div class="flex-1" style="background:#ff4400"></div>
                                <div class="flex-1" style="background:#ff8800"></div>
                                <div class="flex-1" style="background:#ffcc00"></div>
                                <div class="flex-1" style="background:#aaff00"></div>
                                <div class="flex-1" style="background:#00ff88"></div>
                                <div class="flex-1" style="background:#00ffff"></div>
                                <div class="flex-1" style="background:#0099ff"></div>
                                <div class="flex-1" style="background:#0044ff"></div>
                                <div class="flex-1" style="background:#8800ff"></div>
                            </div>
                            <div class="flex justify-between text-[8px] text-gray-600 mt-0.5">
                                <span>0</span><span>10k</span><span>20k</span><span>40k+</span>
                            </div>
                        </div>
                    </div>

                    <!-- MAIN MAP AREA -->
                    <div class="flex-1 relative" id="radar-map-wrapper">
                        <!-- Radar header controls -->
                        <div class="absolute top-2 left-2 z-10 flex items-center gap-1">
                            <button id="radar-mode-leaflet-btn" onclick="os.switchRadarView('leaflet')"
                                class="bg-black/70 border border-white/20 rounded px-2 py-1 text-[9px] text-white hover:bg-white/10 transition cursor-none hover-target">LIVE FEED</button>
                            <button id="radar-mode-embed-btn" onclick="os.switchRadarView('embed')"
                                class="bg-black/70 border border-white/10 rounded px-2 py-1 text-[9px] text-gray-400 hover:text-white hover:bg-white/10 transition cursor-none hover-target">EMBED VIEW</button>
                        </div>

                        <!-- Leaflet map fills this -->
                        <div id="radar-leaflet-map" class="absolute inset-0" style="z-index:1; cursor:crosshair;"></div>
                        <div id="radar-embed-shell" class="absolute inset-0 hidden bg-black" style="z-index:1;">
                            <iframe id="radar-embed-frame"
                                class="w-full h-full border-0"
                                referrerpolicy="no-referrer"
                                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"></iframe>
                        </div>
                        <div id="radar-embed-warning" class="hidden absolute top-12 left-2 z-10 bg-yellow-500/15 border border-yellow-500/40 text-yellow-300 rounded px-2 py-1 text-[9px]">
                            proxied view; availability depends on relay
                        </div>

                        <!-- Top-right HUD overlay -->
                        <div class="absolute top-2 right-2 z-10 pointer-events-none space-y-1">
                            <div class="bg-black/70 border border-white/10 rounded px-2 py-1 text-[9px] font-mono text-right">
                                <div class="text-white font-bold" id="globe-event-title">RADAR OFFLINE</div>
                                <div class="text-yellow-400" id="globe-event-mag">-- VECTORS</div>
                                <div class="text-gray-400" id="globe-event-time">--</div>
                            </div>
                        </div>

                        <!-- Map controls overlay (pointer-events: auto) -->
                        <div class="absolute top-16 left-2 z-10 flex flex-col gap-1">
                            <button onclick="os.radarMap && os.radarMap.setView([20, 0], 2)"
                                class="bg-black/70 border border-white/10 rounded px-2 py-1 text-[9px] text-white hover:bg-white/10 transition cursor-none hover-target">⊕ RESET</button>
                        </div>
                    </div>
                </div>
            `,

    market: `
                <div class="flex flex-col h-full bg-[#050505] relative overflow-hidden p-4">
                    <div class="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500 flex items-center justify-center">
                                <i data-lucide="bitcoin" class="w-5 h-5 text-yellow-500"></i>
                            </div>
                            <div>
                                <div class="text-white font-display text-lg leading-none tracking-wide">BTC/USDT</div>
                                <div class="text-[9px] font-mono text-gray-500 uppercase mt-0.5" id="market-status-lbl">BINANCE WSS STREAM (1M)</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div id="market-price" class="text-2xl font-mono font-bold text-white leading-none tracking-tight">--</div>
                            <div id="market-change" class="text-[10px] font-mono text-gray-500 uppercase mt-1">--</div>
                        </div>
                    </div>
                    <div class="flex-1 relative w-full border border-white/5 rounded bg-[#020202] overflow-hidden shadow-os-recessed">
                        <canvas id="market-canvas" class="absolute inset-0 w-full h-full"></canvas>
                        <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0),rgba(255,255,255,0)50%,rgba(0,0,0,0.2)50%,rgba(0,0,0,0.2))] bg-[length:100%_4px] pointer-events-none"></div>
                    </div>
                </div>
            `,

    surveillance: `
                <div class="flex h-full bg-black relative overflow-hidden font-mono text-[10px]" id="optic-root">
                    <div class="flex-1 relative overflow-hidden bg-black">
                        <video id="surveillance-video" autoplay playsinline muted class="hidden"></video>
                        <canvas id="optic-canvas" class="absolute inset-0 w-full h-full bg-black"></canvas>
                        <canvas id="optic-analysis-canvas" class="hidden"></canvas>
                        <div id="optic-filter-overlay" class="absolute inset-0 pointer-events-none mix-blend-screen opacity-50"></div>
                        <div class="absolute inset-0 pointer-events-none optic-reticle opacity-55"></div>
                        <canvas id="optic-hud-canvas" class="absolute inset-0 w-full h-full pointer-events-none"></canvas>
                        <div class="absolute inset-0 pointer-events-none border border-green-500/15 m-4"></div>
                        <div class="absolute top-4 left-4 z-20 flex items-center gap-2 text-red-500 font-bold drop-shadow-[0_0_5px_rgba(255,0,0,0.8)]"><span class="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span> REC <span id="optic-mode-label" class="text-green-400 ml-2">NIGHT</span></div>
                        <div class="absolute bottom-4 left-4 z-20 text-green-400 drop-shadow-[0_0_3px_rgba(0,255,0,0.8)]">CAM_01 // SECURE_OPTICS // <span id="surveillance-time"></span><br><span id="optic-resolution">--</span> // STAB:<span id="optic-stab-state">OFF</span> // MOTION:<span id="optic-motion-readout">0%</span></div>
                        <div class="absolute top-4 right-4 z-20 text-green-400/80 text-right drop-shadow-[0_0_3px_rgba(0,255,0,0.8)]"><div>UPLINK: ENCRYPTED</div><div id="surveillance-status">AWAITING LOCAL HARDWARE...</div><div id="optic-ai-status" class="text-gray-400">AI VISION: STANDBY</div></div>
                        <div id="optic-alert" class="hidden absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded bg-red-950/80 border border-red-500/40 text-red-300 font-bold tracking-widest animate-pulse">MOTION ALERT</div>
                    </div>
                    <aside class="w-72 border-l border-white/10 bg-[#050506]/95 flex flex-col z-30">
                        <div class="p-3 border-b border-white/10">
                            <div class="text-os-accent uppercase tracking-widest text-[9px] mb-2">Optic Modes</div>
                            <div class="grid grid-cols-2 gap-1" id="optic-mode-buttons">
                                <button class="optic-btn active hover-target cursor-none" onclick="os.survSetMode('night')">Night Vision</button>
                                <button class="optic-btn hover-target cursor-none" onclick="os.survSetMode('thermal')">Thermal</button>
                                <button class="optic-btn hover-target cursor-none" onclick="os.survSetMode('vhs')">VHS</button>
                                <button class="optic-btn hover-target cursor-none" onclick="os.survSetMode('infrared')">Infrared</button>
                                <button class="optic-btn hover-target cursor-none" onclick="os.survSetMode('cinematic')">Cinematic</button>
                                <button class="optic-btn hover-target cursor-none" onclick="os.survSetMode('normal')">Normal</button>
                            </div>
                        </div>
                        <div class="p-3 border-b border-white/10">
                            <div class="text-os-accent uppercase tracking-widest text-[9px] mb-2">Utilities</div>
                            <div class="grid grid-cols-2 gap-1">
                                <button id="optic-btn-ai" onclick="os.survToggle('ai')" class="optic-btn hover-target cursor-none">AI Detect</button>
                                <button id="optic-btn-motion" onclick="os.survToggle('motion')" class="optic-btn hover-target cursor-none">Motion</button>
                                <button id="optic-btn-ocr" onclick="os.survRunOCR()" class="optic-btn hover-target cursor-none">OCR Scan</button>
                                <button id="optic-btn-qr" onclick="os.survRunBarcodeScan(true)" class="optic-btn hover-target cursor-none">QR/Code</button>
                                <button id="optic-btn-gesture" onclick="os.survToggle('gesture')" class="optic-btn hover-target cursor-none">Gesture</button>
                                <button id="optic-btn-audio" onclick="os.survToggleAudio()" class="optic-btn hover-target cursor-none">Audio FX</button>
                                <button id="optic-btn-stabilize" onclick="os.survToggle('stabilize')" class="optic-btn hover-target cursor-none col-span-2">Body Stabilization</button>
                                <button id="optic-btn-mirror" onclick="os.survToggleMirror()" class="optic-btn hover-target cursor-none">Mirror Fix</button>
                                <button onclick="os.survSwitchCamera()" class="optic-btn hover-target cursor-none">Switch Cam</button>
                                <button onclick="os.survSnapshot()" class="optic-btn hover-target cursor-none col-span-2 bg-white/10 text-white">Screenshot Intelligence</button>
                            </div>
                        </div>
                        <div class="p-3 border-b border-white/10 space-y-2">
                            <div class="text-os-accent uppercase tracking-widest text-[9px]">Telemetry</div>
                            <div class="grid grid-cols-2 gap-2"><div class="optic-chip"><div class="text-gray-500">Brightness</div><b id="optic-brightness" class="text-white">--</b></div><div class="optic-chip"><div class="text-gray-500">Contrast</div><b id="optic-contrast" class="text-white">--</b></div><div class="optic-chip"><div class="text-gray-500">Objects</div><b id="optic-object-count" class="text-white">0</b></div><div class="optic-chip"><div class="text-gray-500">Audio</div><b id="optic-audio-level" class="text-white">--</b></div></div>
                        </div>
                        <div class="p-3 border-b border-white/10 min-h-0 flex-1">
                            <div class="text-os-accent uppercase tracking-widest text-[9px] mb-2">Detection Feed</div>
                            <div id="optic-feed" class="space-y-1 overflow-y-auto max-h-44 pr-1 no-scrollbar text-gray-400"></div>
                        </div>
                        <div class="p-3 h-32 shrink-0">
                            <div class="text-os-accent uppercase tracking-widest text-[9px] mb-2">Snapshots</div>
                            <div id="optic-shots" class="flex gap-2 overflow-x-auto no-scrollbar h-20"></div>
                        </div>
                    </aside>
                </div>
            `,

    notes: `
                <div class="flex flex-col h-full bg-[#0a0a0c] font-mono text-xs relative" id="notes-root">
                    <div class="h-10 border-b border-white/5 px-4 flex justify-between items-center text-[10px] text-os-accent uppercase bg-black/40 flex-shrink-0">
                        <span class="flex items-center gap-2"><i data-lucide="shield-check" class="w-3 h-3 text-green-500"></i> AES-GCM Encrypted</span>
                        <span id="notes-status" class="text-white font-bold tracking-wider">LOCKED</span>
                    </div>
                    
                    <!-- Unlock Modal -->
                    <div id="notes-unlock-overlay" class="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 mt-10">
                        <div class="w-full max-w-xs bg-os-900 border border-white/10 rounded-lg p-5 shadow-os-panel text-center">
                            <i data-lucide="lock" class="w-8 h-8 text-white mx-auto mb-3"></i>
                            <div class="text-white font-bold mb-1 uppercase tracking-widest">Decrypt Scratchpad</div>
                            <div class="text-[9px] text-gray-500 mb-4 uppercase">Enter passkey to access memory</div>
                            <input type="password" id="notes-password" class="w-full bg-black border border-white/10 rounded py-2 px-3 text-center text-white mb-3 focus:border-white/30 outline-none cursor-none hover-target tracking-[0.3em]" placeholder="••••••••" onkeydown="if(event.key==='Enter') os.unlockNotes()">
                            <button onclick="os.unlockNotes()" class="w-full py-2 bg-white text-black font-bold uppercase rounded cursor-none hover-target hover:bg-gray-200 transition text-[10px] tracking-widest shadow-os-btn">Decrypt Volatile Memory</button>
                        </div>
                    </div>

                    <textarea id="notes-textarea" class="flex-1 w-full bg-transparent border-none p-4 text-green-500 focus:outline-none resize-none leading-relaxed cursor-none hover-target shadow-inner" placeholder="> Begin secure log..." oninput="os.autoSaveNotes()"></textarea>
                </div>
            `,

    entityscanner: `
                <div class="flex flex-col h-full bg-[#050505] text-xs font-mono relative overflow-hidden" id="entityscanner-root">
                    <div class="h-10 border-b border-white/5 bg-black/60 px-4 flex justify-between items-center shrink-0 z-10 shadow-os-recessed">
                        <div class="flex items-center gap-2">
                            <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            <span class="text-green-500 font-bold tracking-widest text-[10px]">OS_SCOUTER // RADAR_MATRIX</span>
                        </div>
                        <div class="flex gap-4">
                            <button onclick="os.switchScannerTab('stats')" id="scan-tab-stats" class="hover-target cursor-none text-white font-semibold border-b border-white pb-0.5 uppercase tracking-wider text-[9px]">DIAGNOSTICS</button>
                            <button onclick="os.switchScannerTab('evolution')" id="scan-tab-evolution" class="hover-target cursor-none text-gray-500 hover:text-white uppercase tracking-wider text-[9px]">PROG_CHAINS</button>
                            <button onclick="os.switchScannerTab('combat')" id="scan-tab-combat" class="hover-target cursor-none text-gray-500 hover:text-white uppercase tracking-wider text-[9px]">COMBAT_SIM</button>
                            <button onclick="os.switchScannerTab('intercepts')" id="scan-tab-intercepts" class="hover-target cursor-none text-gray-500 hover:text-white uppercase tracking-wider text-[9px]">SIGNAL_LOG</button>
                        </div>
                    </div>

                    <div class="flex-1 flex overflow-hidden">
                        <div class="w-[40%] border-r border-white/5 bg-[#030304] p-4 flex flex-col justify-between relative overflow-hidden shrink-0">
                            <div class="absolute inset-0 pointer-events-none z-10 flex items-center justify-center opacity-30">
                                <div class="w-36 h-36 rounded-full border border-dashed border-green-500/50 animate-spin" style="animation-duration: 10s;"></div>
                                <div class="absolute w-48 h-48 rounded-full border border-green-500/20"></div>
                                <div class="absolute w-full h-px bg-green-500/10"></div>
                                <div class="absolute h-full w-px bg-green-500/10"></div>
                            </div>
                            
                            <div class="relative z-20 space-y-2">
                                <div class="text-[8px] text-os-accent tracking-widest uppercase">Entity Query Intercept</div>
                                <div class="flex gap-1.5">
                                    <div class="flex-1 relative">
                                        <i data-lucide="search" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500"></i>
                                        <input type="text" id="scanner-search-input" class="w-full bg-black/60 border border-white/10 rounded py-1.5 pl-8 pr-2 text-[11px] text-white focus:outline-none focus:border-green-500/40 cursor-none hover-target" placeholder="Goku, Vegeta, Mewtwo..." onkeydown="if(event.key==='Enter') os.runEntityScan()">
                                    </div>
                                    <button onclick="os.runEntityScan()" class="px-3 bg-green-950/40 border border-green-500/30 rounded text-green-400 font-bold hover:bg-green-900/40 transition-all cursor-none hover-target text-[10px]">SCAN</button>
                                </div>
                                <div class="flex gap-1">
                                    <button onclick="os.setScannerPreset('goku')" class="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[8px] text-gray-500 hover:text-white hover:border-white/15 cursor-none hover-target">GOKU</button>
                                    <button onclick="os.setScannerPreset('vegeta')" class="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[8px] text-gray-500 hover:text-white hover:border-white/15 cursor-none hover-target">VEGETA</button>
                                    <button onclick="os.setScannerPreset('mewtwo')" class="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[8px] text-gray-500 hover:text-white hover:border-white/15 cursor-none hover-target">MEWTWO</button>
                                    <button onclick="os.setScannerPreset('pikachu')" class="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[8px] text-gray-500 hover:text-white hover:border-white/15 cursor-none hover-target">PIKACHU</button>
                                </div>
                            </div>

                            <div class="my-auto py-4 flex flex-col items-center justify-center relative z-20">
                                <div class="w-40 h-40 rounded bg-black/40 border border-green-500/20 flex items-center justify-center relative overflow-hidden shadow-inner group">
                                    <div class="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(34,197,94,0)_50%,rgba(34,197,94,0.15)_50%)] bg-[length:100%_4px] pointer-events-none z-10 animate-pulse"></div>
                                    <div class="absolute left-0 right-0 h-0.5 bg-green-400 opacity-60 z-10" id="scanner-sweep-bar" style="top: 0%;"></div>
                                    
                                    <img id="scanner-entity-img" class="w-full h-full object-contain p-2 relative z-0 transition-all duration-300" src="https://dragonball-api.com/characters/goku_normal.webp" alt="Scanned Vessel">
                                    <div class="absolute bottom-2 left-2 px-1.5 py-0.5 bg-green-950/80 border border-green-500/40 text-[8px] text-green-400 font-bold tracking-widest uppercase rounded" id="scanner-lock-lbl">LOCK_ACQUIRED</div>
                                </div>
                            </div>

                            <div class="border-t border-white/5 pt-3 relative z-20 space-y-1.5 font-mono text-[9px] text-gray-400">
                                <div class="flex justify-between"><span>SIGNAL_STRENGTH:</span><span class="text-white font-bold" id="scanner-sig-pct">98.4%</span></div>
                                <div class="flex justify-between"><span>SPECTRAL_INDEX:</span><span class="text-green-500 font-bold" id="scanner-spectral-lbl">BIO_ENERGY_OK</span></div>
                                <div class="flex justify-between"><span>ENTITY_RATING:</span><span class="text-red-400 font-bold" id="scanner-rating-lbl">CLASS SSS</span></div>
                            </div>
                        </div>

                        <div class="flex-1 bg-[#08080a] p-4 overflow-y-auto relative flex flex-col justify-between">
                            <div id="scanner-tab-view-stats" class="space-y-4 flex-1">
                                <div class="flex justify-between items-start border-b border-white/5 pb-2">
                                    <div>
                                        <h3 class="text-white font-bold text-sm tracking-wider uppercase" id="scanner-name">Goku</h3>
                                        <div class="text-[9px] text-os-accent uppercase font-mono mt-0.5" id="scanner-meta-affiliation">Z Fighter // Saiyan</div>
                                    </div>
                                    <div class="text-right">
                                        <span class="text-[9px] bg-red-950/40 border border-red-500/30 text-red-400 font-bold px-2 py-0.5 rounded tracking-widest uppercase" id="scanner-danger-class">PLANET BUSTER</span>
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-3" id="scanner-stat-matrix"></div>

                                <div class="space-y-2">
                                    <div class="text-[8px] text-os-accent tracking-widest uppercase font-bold">Threat & Combat Assessment</div>
                                    <p class="text-gray-400 leading-relaxed text-[10px]" id="scanner-assessment">
                                        Entity emits extreme, non-standard biomorphic Ki waves. Scanning registers zero malicious intent but unmatched combat output potential. Recommended protocols: Hostility suppression, standard diplomatic links.
                                    </p>
                                </div>
                            </div>

                            <div id="scanner-tab-view-evolution" class="space-y-4 flex-1 hidden">
                                <div class="border-b border-white/5 pb-2">
                                    <h3 class="text-white font-bold text-xs tracking-wider uppercase">Metamorphic Transformation Progression</h3>
                                    <div class="text-[8px] text-os-accent uppercase">Dynamic bio-energy scaling paths</div>
                                </div>
                                <div class="space-y-2" id="scanner-evolution-chain"></div>
                            </div>

                            <div id="scanner-tab-view-combat" class="space-y-4 flex-1 hidden">
                                <div class="border-b border-white/5 pb-2 flex justify-between items-center">
                                    <div>
                                        <h3 class="text-white font-bold text-xs tracking-wider uppercase">High-Fidelity Battle Matrix</h3>
                                        <div class="text-[8px] text-os-accent uppercase">Weighted statistical fight simulator</div>
                                    </div>
                                    <div class="flex items-center gap-1.5">
                                        <span class="text-[8px] text-gray-500 uppercase">Scale Mode:</span>
                                        <button onclick="os.toggleCombatScaling()" id="btn-combat-scale" class="px-1.5 py-0.5 bg-green-500/10 border border-green-500/30 rounded text-[8px] text-green-400 font-mono font-bold cursor-none hover-target">BALANCED</button>
                                    </div>
                                </div>

                                <div class="grid grid-cols-11 gap-2 items-center">
                                    <div class="col-span-5 bg-black/40 border border-white/5 p-2 rounded relative">
                                        <div class="text-[8px] text-os-accent uppercase font-bold mb-1">Left Combatant</div>
                                        <select id="combat-fighter-left" class="w-full bg-os-900 border border-white/10 rounded p-1 text-white text-[10px] focus:outline-none focus:border-green-500/40 cursor-none hover-target" onchange="os.updateCombatFighter('left')"></select>
                                    </div>
                                    <div class="col-span-1 text-center font-display text-white font-bold opacity-40 text-sm">VS</div>
                                    <div class="col-span-5 bg-black/40 border border-white/5 p-2 rounded relative">
                                        <div class="text-[8px] text-os-accent uppercase font-bold mb-1">Right Combatant</div>
                                        <select id="combat-fighter-right" class="w-full bg-os-900 border border-white/10 rounded p-1 text-white text-[10px] focus:outline-none focus:border-green-500/40 cursor-none hover-target" onchange="os.updateCombatFighter('right')"></select>
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-4">
                                    <div class="space-y-1">
                                        <div class="flex justify-between text-[9px]"><span id="combat-left-name" class="text-white font-bold truncate">--</span><span id="combat-left-hp-readout" class="text-gray-400 font-mono">100/100</span></div>
                                        <div class="w-full h-2 bg-os-900 rounded overflow-hidden relative border border-white/5">
                                            <div id="combat-left-hp-bar" class="absolute right-0 top-0 bottom-0 bg-green-500 w-full transition-all duration-150"></div>
                                        </div>
                                    </div>
                                    <div class="space-y-1">
                                        <div class="flex justify-between text-[9px]"><span id="combat-right-hp-readout" class="text-gray-400 font-mono">100/100</span><span id="combat-right-name" class="text-white font-bold truncate">--</span></div>
                                        <div class="w-full h-2 bg-os-900 rounded overflow-hidden relative border border-white/5">
                                            <div id="combat-right-hp-bar" class="absolute left-0 top-0 bottom-0 bg-green-500 w-full transition-all duration-150"></div>
                                        </div>
                                    </div>
                                </div>

                                <div class="bg-black/60 border border-white/5 rounded-lg p-3 h-32 overflow-y-auto font-mono text-[9px] text-green-400/80 space-y-1 no-scrollbar" id="combat-feed-log">
                                    <div class="text-center text-gray-500 py-6 uppercase tracking-widest text-[8px] animate-pulse">Waiting for combat initialization...</div>
                                </div>

                                <button onclick="os.engageScouterCombat()" id="btn-engage-combat" class="w-full py-2.5 bg-green-600/20 border border-green-500/30 text-green-400 font-semibold text-xs uppercase tracking-widest rounded hover:bg-green-600/40 transition hover-target cursor-none shadow-os-btn">
                                    Engage Scouter Battle Matrix
                                </button>
                            </div>

                            <div id="scanner-tab-view-intercepts" class="space-y-4 flex-1 hidden">
                                <div class="border-b border-white/5 pb-2 flex justify-between items-center">
                                    <div>
                                        <h3 class="text-white font-bold text-xs tracking-wider uppercase">Scouter Signal Intercept Stream</h3>
                                        <div class="text-[8px] text-os-accent uppercase">Live cross-universe sensor logs</div>
                                    </div>
                                    <span class="text-green-500 text-[8px] flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> SCANNING...</span>
                                </div>
                                <div class="space-y-2 h-64 overflow-y-auto pr-1 no-scrollbar" id="scanner-intercepts-stream"></div>
                            </div>

                            <div class="border-t border-white/5 pt-3 mt-4 text-[9px] text-os-accent flex justify-between items-center shrink-0">
                                <span id="scouter-last-update-time">UPLINK: ACTIVE // 2026-05-24</span>
                                <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> SC_NODE_ONLINE</span>
                            </div>
                        </div>
                    </div>
                </div>
            `,

    filemanager: `
                <div class="fm-shell flex flex-col h-full bg-[#050506] text-[11px] font-mono overflow-hidden relative" id="filemanager-root">
                    <div class="absolute inset-0 pointer-events-none opacity-30 fm-scanlines"></div>
                    <div class="h-12 shrink-0 border-b border-white/5 bg-black/55 flex items-center gap-2 px-3 relative z-10">
                        <button onclick="os.fmGoBack()" class="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white cursor-none hover-target" title="Back"><i data-lucide="arrow-left" class="w-4 h-4"></i></button>
                        <button onclick="os.fmOpenPath('/Archive')" class="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white cursor-none hover-target" title="Root"><i data-lucide="home" class="w-4 h-4"></i></button>
                        <div class="flex-1 min-w-0">
                            <div class="text-[8px] uppercase tracking-[0.25em] text-os-accent mb-0.5">Archive Pathway</div>
                            <div id="fm-breadcrumbs" class="flex items-center gap-1 text-gray-400 overflow-hidden whitespace-nowrap"></div>
                        </div>
                        <div class="w-72 relative shrink-0">
                            <i data-lucide="search" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500"></i>
                            <input id="fm-search-input" oninput="os.fmSearch(this.value)" onkeydown="if(event.key==='Enter'){os.fmWikiSearch(this.value)}" placeholder="Search Wikipedia — e.g. Tony Stark (Marvel Cinematic Universe)" class="w-full bg-black/70 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-[11px] text-white focus:outline-none focus:border-white/25 cursor-none hover-target">
                        </div>
                        <button onclick="window.AetherVFS && AetherVFS.triggerUploadDialog()" class="px-3 py-2 rounded bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/25 cursor-none hover-target flex items-center gap-2"><i data-lucide="upload" class="w-3.5 h-3.5"></i>Upload</button>
                        <button onclick="os.fmWikiSearch(document.getElementById('fm-search-input').value)" class="px-3 py-2 rounded bg-white/10 border border-white/10 text-white hover:bg-white/15 cursor-none hover-target flex items-center gap-2"><i data-lucide="download-cloud" class="w-3.5 h-3.5"></i>Fetch Wiki</button>
                        <button onclick="os.fmQuickLook()" class="px-3 py-2 rounded bg-white/10 border border-white/10 text-white hover:bg-white/15 cursor-none hover-target flex items-center gap-2"><i data-lucide="eye" class="w-3.5 h-3.5"></i>Quick Look</button>
                    </div>
                    <div class="h-9 shrink-0 border-b border-white/5 bg-[#070709]/90 flex items-center justify-between px-3 relative z-10">
                        <div class="flex items-center gap-1" id="fm-tabs"></div>
                        <div class="flex items-center gap-3 text-[9px] text-gray-500 uppercase tracking-wider">
                            <span id="fm-status-live" class="text-green-400 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> index synchronized</span>
                            <span id="fm-count-label">0 objects</span>
                        </div>
                    </div>
                    <div class="flex-1 min-h-0 grid grid-cols-[220px_minmax(300px,1fr)_330px] relative z-10">
                        <aside class="border-r border-white/5 bg-black/35 flex flex-col min-h-0">
                            <div class="p-3 border-b border-white/5">
                                <div class="text-[9px] uppercase tracking-widest text-os-accent mb-2">Navigation</div>
                                <div id="fm-sidebar" class="space-y-1"></div>
                            </div>
                            <div class="p-3 border-b border-white/5 min-h-0 flex-1">
                                <div class="text-[9px] uppercase tracking-widest text-os-accent mb-2">Folder Tree</div>
                                <div id="fm-tree" class="space-y-1 overflow-y-auto h-full pr-1"></div>
                            </div>
                            <div class="p-3 bg-black/25">
                                <div class="text-[9px] uppercase tracking-widest text-os-accent mb-2">Recent / History</div>
                                <div id="fm-history" class="space-y-1 max-h-24 overflow-y-auto pr-1"></div>
                            </div>
                        </aside>
                        <main class="flex flex-col min-w-0 min-h-0 bg-[#08080a]/70">
                            <div class="grid grid-cols-[34px_1fr_95px_90px_82px] gap-2 px-3 py-2 border-b border-white/5 text-[8px] uppercase tracking-widest text-gray-500 bg-black/25">
                                <span></span><span>Name</span><span>Kind</span><span>Signal</span><span>Links</span>
                            </div>
                            <div id="fm-file-list" class="flex-1 overflow-y-auto p-2 space-y-1"></div>
                        </main>
                        <aside class="border-l border-white/5 bg-black/40 min-h-0 flex flex-col">
                            <div id="fm-preview" class="flex-1 min-h-0 overflow-y-auto"></div>
                            <div class="h-36 border-t border-white/5 bg-[#060607] p-3 shrink-0">
                                <div class="text-[9px] uppercase tracking-widest text-os-accent mb-2">Smart Recommendations</div>
                                <div id="fm-recommendations" class="grid grid-cols-2 gap-2"></div>
                            </div>
                        </aside>
                    </div>
                    <div id="fm-hover-preview" class="hidden absolute z-40 w-64 p-3 rounded-lg fm-glass pointer-events-none text-[10px] text-gray-300"></div>
                    <div id="fm-quicklook-modal" class="hidden absolute inset-0 z-50 bg-black/75 backdrop-blur-sm items-center justify-center p-8">
                        <div class="w-full max-w-2xl max-h-full rounded-2xl fm-glass overflow-hidden shadow-2xl">
                            <div class="h-11 border-b border-white/10 flex items-center justify-between px-4 bg-black/50">
                                <div class="flex items-center gap-2 text-white font-bold uppercase tracking-wider"><i data-lucide="eye" class="w-4 h-4"></i><span id="fm-ql-title">Quick Look</span></div>
                                <button onclick="os.fmCloseQuickLook()" class="text-gray-500 hover:text-white cursor-none hover-target"><i data-lucide="x" class="w-5 h-5"></i></button>
                            </div>
                            <div id="fm-ql-body" class="p-5 overflow-y-auto max-h-[70vh]"></div>
                        </div>
                    </div>
                </div>
            `,

    wikiboard: `
                <div class="flex flex-col h-full bg-[#050505] relative overflow-hidden" id="wikiboard-root">
                    <div class="wb-toolbar">
                        <div class="wb-toolbar-search">
                            <span class="wb-toolbar-search-icon">&#x1F50D;</span>
                            <input type="text" id="wb-search-input" placeholder="Search Wikipedia article..." onkeydown="if(event.key==='Enter'){os.wikiboard.engine.searchAndSpawn(this.value);this.value='';}">
                        </div>
                        <button onclick="os.wikiboard.engine.addTextNote()" class="wb-toolbar-btn" title="Create a persistent note card">+ Note</button>
                        <button onclick="os.wikiboard.engine.addUrlCard()" class="wb-toolbar-btn" title="Preview any website URL">+ URL</button>
                        <button onclick="os.wikiboard.engine.addYoutubeCard()" class="wb-toolbar-btn" title="Embed a live streaming video card">+ YT</button>
                        <button onclick="os.wikiboard.engine.addImageFromUrl()" class="wb-toolbar-btn" title="Load an external image">+ IMG</button>
                        <div class="wb-toolbar-sep"></div>
                        <button onclick="os.wikiboard.engine.zoomIn()" class="wb-toolbar-btn" title="Zoom In">+</button>
                        <button onclick="os.wikiboard.engine.zoomOut()" class="wb-toolbar-btn" title="Zoom Out">−</button>
                        <button onclick="os.wikiboard.engine.fitAll()" class="wb-toolbar-btn" title="Fit all elements on canvas">Fit</button>
                        <button onclick="os.wikiboard.engine.resetView()" class="wb-toolbar-btn" title="Reset pan and zoom to default">Reset</button>
                        <div class="wb-toolbar-right">
                            <span id="wb-zoom-display">100%</span>
                            <span id="wb-card-count">0 cards</span>
                            <button onclick="os.wikiboard.engine.exportBoard()" class="wb-toolbar-btn" title="Export this canvas state to a JSON file">Export</button>
                            <button onclick="os.wikiboard.engine.importBoard()" class="wb-toolbar-btn" title="Import a previously saved JSON canvas file">Import</button>
                            <button onclick="os.wikiboard.engine.clearBoard()" class="wb-toolbar-btn" style="color:#f44;border-color:rgba(255,60,60,0.15);" title="Purge and clear all cards on this board">&#x2715; Clear</button>
                            <span id="wb-save-indicator" style="color:#3a3;font-size:9px;transition:opacity 0.5s;opacity:0;">&#x2713; SAVED</span>
                        </div>
                    </div>
                    <div id="wb-viewport">
                        <div id="wb-canvas-layer">
                            <svg id="wb-svg-connections" style="position:absolute;top:0;left:0;width:1px;height:1px;overflow:visible;pointer-events:none;"></svg>
                        </div>
                    </div>
                    <div id="wb-minimap" title="Minimap — click to navigate">
                        <canvas id="wb-minimap-canvas"></canvas>
                        <div id="wb-minimap-label">MAP</div>
                    </div>
                    <div class="wb-status-bar">
                        <span>WIKIBOARD // INFINITE CANVAS</span>
                        <span style="color:#333">|</span>
                        <span>SCROLL ON CANVAS → ZOOM &nbsp;·&nbsp; SCROLL ON CARD → SCROLL &nbsp;·&nbsp; DRAG → PAN &nbsp;·&nbsp; MINIMAP → NAVIGATE</span>
                        <span style="margin-left:auto;" id="wb-status-msg">Ready</span>
                    </div>
                </div>
            `,

    aetherbridge: `
                <div class="h-full flex text-xs font-mono text-gray-300 overflow-hidden" style="background:linear-gradient(135deg,rgba(3,3,8,0.97),rgba(5,5,15,0.97));position:relative">
                    <div class="w-56 shrink-0 flex flex-col border-r border-white/5" style="background:rgba(0,0,0,0.45)">
                        <div class="px-3 py-2.5 border-b border-white/5 flex items-center gap-2">
                            <i data-lucide="radio-tower" class="w-3.5 h-3.5 text-emerald-400"></i>
                            <span class="text-[10px] font-bold tracking-widest uppercase text-emerald-400">Aether Bridge</span>
                        </div>
                        <div class="px-3 py-2 border-b border-white/[0.04]">
                            <div class="text-[8px] text-white/25 uppercase tracking-[0.18em] mb-2">This Device</div>
                            <div id="ab-host-status" class="flex items-center gap-2 mb-2">
                                <div id="ab-host-dot" class="w-2 h-2 rounded-full bg-white/20 shrink-0"></div>
                                <span id="ab-host-label" class="text-white/40 text-[9px]">Not Hosting</span>
                            </div>
                            <button onclick="os.abToggleHost()" id="ab-host-btn" class="w-full py-1.5 text-[9px] font-bold uppercase tracking-wider rounded border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/10 text-white/60 hover:text-emerald-300 transition-all hover-target cursor-none">Start Hosting</button>
                            <div id="ab-host-info" class="hidden mt-2 space-y-1">
                                <div class="text-[8px] text-white/35">Connect Code <span class="text-white/15">(send this to the other device)</span></div>
                                <div id="ab-host-url" class="text-emerald-400 font-bold text-[9px] break-all">—</div>
                                <button onclick="window.AetherBridgeAPI.copyHostId()" class="mt-1 w-full py-1 text-[8px] border border-white/8 rounded hover:bg-white/5 text-white/40 hover:text-white hover-target cursor-none transition-all flex items-center justify-center gap-1.5"><i data-lucide="copy" class="w-2.5 h-2.5"></i>Copy Code</button>
                                <button onclick="os.abShowQR()" class="w-full py-1 text-[8px] border border-white/8 rounded hover:bg-white/5 text-white/40 hover:text-white hover-target cursor-none transition-all flex items-center justify-center gap-1.5"><i data-lucide="qr-code" class="w-2.5 h-2.5"></i>Show QR</button>
                                <button onclick="document.getElementById('ab-sync-modal').classList.remove('hidden')" class="w-full py-1 text-[8px] border border-white/8 rounded hover:bg-white/5 text-white/40 hover:text-white hover-target cursor-none transition-all flex items-center justify-center gap-1.5"><i data-lucide="refresh-cw" class="w-2.5 h-2.5"></i>Sync Settings</button>
                            </div>
                        </div>
                        <div class="px-3 py-2 border-b border-white/[0.04]">
                            <div class="text-[8px] text-white/25 uppercase tracking-[0.18em] mb-2">Connect to Device</div>
                            <div class="text-[7px] text-white/25 mb-1.5 leading-relaxed">Enter the connect code shown on the other device's "Start Hosting" panel</div>
                            <input id="ab-connect-ip" type="text" placeholder="e.g. ab-93a012c6170b" class="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-[9px] text-white focus:outline-none focus:border-emerald-500/40 cursor-text mb-1.5" autocomplete="off">
                            <input id="ab-connect-name" type="text" placeholder="Device name (optional)" class="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-[9px] text-white focus:outline-none focus:border-emerald-500/40 cursor-text mb-1.5" autocomplete="off">
                            <button onclick="os.abConnectToDevice()" class="w-full py-1.5 text-[9px] font-bold uppercase tracking-wider rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition-all hover-target cursor-none">Connect</button>
                        </div>
                        <div class="flex-1 overflow-y-auto no-scrollbar px-3 py-2">
                            <div class="text-[8px] text-white/25 uppercase tracking-[0.18em] mb-2">Paired Devices</div>
                            <div id="ab-device-list" class="space-y-1">
                                <div class="text-[9px] text-white/20 py-3 text-center">No devices paired</div>
                            </div>
                        </div>
                        <div class="px-3 py-2 border-t border-white/5" id="ab-transfer-panel" style="display:none">
                            <div class="text-[8px] text-white/25 uppercase tracking-[0.18em] mb-1.5">Active Transfers</div>
                            <div id="ab-transfer-list" class="space-y-1.5"></div>
                        </div>
                    </div>
                    <div class="flex-1 flex flex-col overflow-hidden">
                        <div class="flex items-center gap-2 px-3 py-2 border-b border-white/5 shrink-0" style="background:rgba(0,0,0,0.3)">
                            <button onclick="os.abNavBack()" class="p-1.5 rounded hover:bg-white/8 text-white/35 hover:text-white transition hover-target cursor-none"><i data-lucide="arrow-left" class="w-3 h-3"></i></button>
                            <button onclick="os.abNavForward()" class="p-1.5 rounded hover:bg-white/8 text-white/35 hover:text-white transition hover-target cursor-none"><i data-lucide="arrow-right" class="w-3 h-3"></i></button>
                            <button onclick="os.abNavUp()" class="p-1.5 rounded hover:bg-white/8 text-white/35 hover:text-white transition hover-target cursor-none"><i data-lucide="arrow-up" class="w-3 h-3"></i></button>
                            <div class="flex-1 flex items-center gap-1.5 bg-black/50 border border-white/8 rounded px-2 py-1">
                                <i data-lucide="hard-drive" class="w-2.5 h-2.5 text-white/30 shrink-0"></i>
                                <span class="text-[9px] text-white/40 truncate" id="ab-path-display">No device selected</span>
                            </div>
                            <div class="relative">
                                <i data-lucide="search" class="w-3 h-3 text-white/30 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                                <input id="ab-search" type="text" placeholder="Search…" oninput="os.abSearch(this.value)" class="bg-black/50 border border-white/8 rounded pl-6 pr-2 py-1 text-[9px] text-white focus:outline-none focus:border-emerald-500/30 w-28 cursor-text">
                            </div>
                            <select id="ab-sort" onchange="os.abSort(this.value)" class="bg-black/50 border border-white/8 rounded px-1.5 py-1 text-[9px] text-white/60 focus:outline-none cursor-none">
                                <option value="name">Name</option><option value="size">Size</option><option value="type">Type</option><option value="modified">Modified</option>
                            </select>
                            <button onclick="os.abRefresh()" class="p-1.5 rounded hover:bg-white/8 text-white/35 hover:text-white transition hover-target cursor-none"><i data-lucide="refresh-cw" class="w-3 h-3"></i></button>
                        </div>
                        <div class="flex-1 overflow-y-auto no-scrollbar p-3" id="ab-file-grid">
                            <div id="ab-empty-state" class="h-full flex flex-col items-center justify-center gap-4 text-white/20">
                                <div class="w-20 h-20 rounded-full flex items-center justify-center" style="background:linear-gradient(135deg,rgba(52,211,153,0.08),rgba(16,185,129,0.04));border:1px solid rgba(52,211,153,0.12)">
                                    <i data-lucide="radio-tower" class="w-9 h-9 text-emerald-500/40"></i>
                                </div>
                                <div class="text-center">
                                    <div class="text-sm font-bold text-white/30 mb-1">No Device Connected</div>
                                    <div class="text-[10px] text-white/18 leading-relaxed">Start hosting or connect to a device<br>to browse its files remotely</div>
                                </div>
                                <button onclick="os.abShowQR()" class="px-4 py-2 rounded border border-emerald-500/25 text-emerald-400/60 text-[9px] uppercase tracking-wider hover:border-emerald-500/50 hover:text-emerald-300 transition hover-target cursor-none">Generate QR Code</button>
                            </div>
                            <div id="ab-files-container" class="hidden grid grid-cols-5 gap-2"></div>
                        </div>
                        <div class="px-3 py-1.5 border-t border-white/5 flex items-center gap-3 shrink-0" style="background:rgba(0,0,0,0.3)">
                            <span id="ab-status-text" class="text-[8px] text-white/30 flex-1">Ready</span>
                            <span id="ab-file-count" class="text-[8px] text-white/20">—</span>
                            <div class="flex items-center gap-1.5">
                                <div id="ab-conn-dot" class="w-1.5 h-1.5 rounded-full bg-white/15"></div>
                                <span id="ab-conn-label" class="text-[8px] text-white/25">Offline</span>
                            </div>
                        </div>
                    </div>
                    <div id="ab-qr-modal" class="hidden" style="position:absolute;inset:0;z-index:50;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.75);backdrop-filter:blur(12px)">
                        <div class="rounded-2xl border border-white/10 p-6 text-center" style="background:rgba(8,8,14,0.97);box-shadow:0 24px 80px rgba(0,0,0,0.8);max-width:280px">
                            <div class="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4">Scan to Connect</div>
                            <div style="background:#fff;padding:10px;border-radius:10px;display:inline-block">
                                <canvas id="ab-qr-canvas" width="220" height="220" style="display:block"></canvas>
                            </div>
                            <div id="ab-qr-url" class="mt-3 text-[9px] text-emerald-400/70 font-mono break-all px-2"></div>
                            <div class="mt-1 text-[8px] text-white/30">Scan with another Aether Bridge device, or copy the ID below</div>
                            <div class="grid grid-cols-2 gap-2 mt-4">
                                <button onclick="window.AetherBridgeAPI.copyQRPayload()" class="px-3 py-1.5 rounded border border-emerald-500/25 text-emerald-400/70 text-[9px] hover:border-emerald-500/50 hover:text-emerald-300 transition hover-target cursor-none flex items-center justify-center gap-1.5"><i data-lucide="copy" class="w-2.5 h-2.5"></i>Copy</button>
                                <button onclick="document.getElementById('ab-qr-modal').style.display='none'" class="px-3 py-1.5 rounded border border-white/10 text-[9px] text-white/40 hover:text-white hover:border-white/25 transition hover-target cursor-none">Close</button>
                            </div>
                        </div>
                    </div>
                    <div id="ab-preview-modal" class="hidden" style="position:absolute;inset:0;z-index:50;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);backdrop-filter:blur(16px)">
                        <div class="rounded-2xl border border-white/10 overflow-hidden flex flex-col" style="background:rgba(8,8,14,0.97);max-width:80%;max-height:85%;box-shadow:0 32px 100px rgba(0,0,0,0.9);min-width:360px;min-height:240px">
                            <div class="flex items-center justify-between px-4 py-2.5 border-b border-white/8">
                                <span id="ab-preview-title" class="text-[10px] font-bold text-white/70 truncate flex-1 mr-4"></span>
                                <div class="flex gap-2">
                                    <button onclick="os.abDownloadPreviewFile()" class="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[8px] uppercase tracking-wider hover:bg-emerald-500/25 transition hover-target cursor-none">Download</button>
                                    <button onclick="document.getElementById('ab-preview-modal').style.display='none'" class="p-1 rounded hover:bg-white/8 text-white/40 hover:text-white transition hover-target cursor-none"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
                                </div>
                            </div>
                            <div id="ab-preview-body" class="flex-1 overflow-auto p-4 flex items-center justify-center"></div>
                        </div>
                    </div>
                    <div id="ab-sync-modal" style="position:absolute;inset:0;z-index:50;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.8);backdrop-filter:blur(10px)">
                        <div class="rounded-2xl border border-white/10 p-5 w-72" style="background:rgba(8,8,14,0.97);box-shadow:0 24px 80px rgba(0,0,0,0.8)">
                            <div class="text-xs font-bold text-white/70 uppercase tracking-widest mb-4 flex items-center gap-2"><i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-emerald-400"></i>Sync Settings</div>
                            <div class="space-y-3">
                                <div>
                                    <div class="text-[8px] text-white/30 uppercase tracking-wider mb-1.5">Sync Mode</div>
                                    <div class="grid grid-cols-3 gap-1">
                                        <button onclick="os.abSetSyncMode('manual')" class="ab-sync-mode-btn py-1.5 text-[8px] rounded border border-white/10 text-white/40 hover:border-emerald-500/40 hover:text-emerald-300 transition hover-target cursor-none" data-mode="manual">Manual</button>
                                        <button onclick="os.abSetSyncMode('realtime')" class="ab-sync-mode-btn py-1.5 text-[8px] rounded border border-white/10 text-white/40 hover:border-emerald-500/40 hover:text-emerald-300 transition hover-target cursor-none" data-mode="realtime">Real-time</button>
                                        <button onclick="os.abSetSyncMode('scheduled')" class="ab-sync-mode-btn py-1.5 text-[8px] rounded border border-white/10 text-white/40 hover:border-emerald-500/40 hover:text-emerald-300 transition hover-target cursor-none" data-mode="scheduled">Scheduled</button>
                                    </div>
                                </div>
                                <div>
                                    <div class="text-[8px] text-white/30 uppercase tracking-wider mb-1.5">Sync Folders</div>
                                    <div class="space-y-1">
                                        <label class="flex items-center gap-2 cursor-none"><input type="checkbox" id="ab-sync-downloads" class="accent-emerald-400"><span class="text-[9px] text-white/50">Downloads</span></label>
                                        <label class="flex items-center gap-2 cursor-none"><input type="checkbox" id="ab-sync-documents" class="accent-emerald-400"><span class="text-[9px] text-white/50">Documents</span></label>
                                        <label class="flex items-center gap-2 cursor-none"><input type="checkbox" id="ab-sync-photos" class="accent-emerald-400"><span class="text-[9px] text-white/50">Photos</span></label>
                                        <label class="flex items-center gap-2 cursor-none"><input type="checkbox" id="ab-sync-notes" class="accent-emerald-400"><span class="text-[9px] text-white/50">Notes App</span></label>
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-2 pt-2">
                                    <button onclick="os.abStartSync()" class="py-1.5 rounded bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[9px] uppercase tracking-wider hover:bg-emerald-500/25 transition hover-target cursor-none">Start Sync</button>
                                    <button onclick="document.getElementById('ab-sync-modal').style.display='none';document.getElementById('ab-sync-modal').classList.remove('open')" class="py-1.5 rounded border border-white/10 text-white/40 text-[9px] hover:border-white/25 hover:text-white transition hover-target cursor-none">Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `,

    aetherlink: `
                <div class="h-full flex text-xs font-mono text-gray-300 overflow-hidden" style="background:linear-gradient(135deg,rgba(3,3,10,0.98),rgba(6,3,18,0.98));position:relative">
                    <div class="w-52 shrink-0 flex flex-col border-r border-white/5" style="background:rgba(0,0,0,0.5)">
                        <div class="px-3 py-2.5 border-b border-white/5 flex items-center gap-2">
                            <i data-lucide="link-2" class="w-3.5 h-3.5 text-violet-400"></i>
                            <span class="text-[10px] font-bold tracking-widest uppercase text-violet-400">Aether Link</span>
                        </div>
                        <div class="px-3 py-2 border-b border-white/[0.04]">
                            <div class="text-[8px] text-white/25 uppercase tracking-[0.18em] mb-2">Your Session Code</div>
                            <div id="al-my-code" class="text-violet-300 font-bold text-base tracking-[0.25em] mb-2 text-center py-1.5 rounded" style="background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.18)">——</div>
                            <div class="grid grid-cols-2 gap-1 mb-2">
                                <button onclick="os.alGenerateCode()" class="py-1.5 text-[8px] rounded border border-white/10 hover:border-violet-500/40 hover:text-violet-300 text-white/40 transition hover-target cursor-none">Generate</button>
                                <button onclick="os.alCopyCode()" class="py-1.5 text-[8px] rounded border border-white/10 hover:border-violet-500/40 hover:text-violet-300 text-white/40 transition hover-target cursor-none flex items-center justify-center gap-1"><i data-lucide="copy" class="w-2.5 h-2.5"></i>Copy</button>
                            </div>
                            <div class="text-[8px] text-white/25 mb-1">Join with code</div>
                            <div class="flex gap-1">
                                <input id="al-join-code" type="text" maxlength="9" placeholder="XXXX-XXXX" class="flex-1 bg-black/60 border border-white/10 rounded px-2 py-1 text-[9px] text-white focus:outline-none focus:border-violet-500/40 cursor-text font-bold tracking-widest uppercase text-center" autocomplete="off">
                                <button onclick="os.alJoinSession()" class="px-2 py-1 rounded bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[8px] hover:bg-violet-500/25 transition hover-target cursor-none">Join</button>
                            </div>
                        </div>
                        <div class="px-3 py-2 border-b border-white/[0.04]">
                            <div class="text-[8px] text-white/25 uppercase tracking-[0.18em] mb-2">Connected Peers</div>
                            <div id="al-peer-list" class="space-y-1">
                                <div class="text-[9px] text-white/20 text-center py-2">No connections</div>
                            </div>
                        </div>
                        <div class="px-3 py-2 border-b border-white/[0.04]">
                            <div class="text-[8px] text-white/25 uppercase tracking-[0.18em] mb-2">My Status</div>
                            <div class="space-y-0.5">
                                <button onclick="os.alSetStatus('online')" class="al-status-btn w-full flex items-center gap-2 py-1 px-2 rounded hover:bg-white/5 text-white/50 hover:text-white transition hover-target cursor-none text-[9px]" data-status="online"><div class="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></div>Online</button>
                                <button onclick="os.alSetStatus('away')" class="al-status-btn w-full flex items-center gap-2 py-1 px-2 rounded hover:bg-white/5 text-white/40 hover:text-white transition hover-target cursor-none text-[9px]" data-status="away"><div class="w-2 h-2 rounded-full bg-yellow-400 shrink-0"></div>Away</button>
                                <button onclick="os.alSetStatus('busy')" class="al-status-btn w-full flex items-center gap-2 py-1 px-2 rounded hover:bg-white/5 text-white/40 hover:text-white transition hover-target cursor-none text-[9px]" data-status="busy"><div class="w-2 h-2 rounded-full bg-red-400 shrink-0"></div>Busy</button>
                            </div>
                        </div>
                        <div class="px-3 py-2 flex-1">
                            <div class="text-[8px] text-white/25 uppercase tracking-[0.18em] mb-2">Modules</div>
                            <div class="space-y-0.5">
                                <button onclick="os.alSwitchTab('chat')" class="al-mod-btn w-full flex items-center gap-2 py-1.5 px-2 rounded text-[9px] text-white/50 hover:text-white hover:bg-white/5 transition hover-target cursor-none" data-tab="chat"><i data-lucide="message-square" class="w-3 h-3"></i>Chat</button>
                                <button onclick="os.alSwitchTab('presence')" class="al-mod-btn w-full flex items-center gap-2 py-1.5 px-2 rounded text-[9px] text-white/40 hover:text-white hover:bg-white/5 transition hover-target cursor-none" data-tab="presence"><i data-lucide="eye" class="w-3 h-3"></i>Live Presence</button>
                                <button onclick="os.alSwitchTab('whiteboard')" class="al-mod-btn w-full flex items-center gap-2 py-1.5 px-2 rounded text-[9px] text-white/40 hover:text-white hover:bg-white/5 transition hover-target cursor-none" data-tab="whiteboard"><i data-lucide="pen-tool" class="w-3 h-3"></i>Whiteboard</button>
                                <button onclick="os.alSwitchTab('transfer')" class="al-mod-btn w-full flex items-center gap-2 py-1.5 px-2 rounded text-[9px] text-white/40 hover:text-white hover:bg-white/5 transition hover-target cursor-none" data-tab="transfer"><i data-lucide="send" class="w-3 h-3"></i>File Transfer</button>
                                <button onclick="os.alSwitchTab('activity')" class="al-mod-btn w-full flex items-center gap-2 py-1.5 px-2 rounded text-[9px] text-white/40 hover:text-white hover:bg-white/5 transition hover-target cursor-none" data-tab="activity"><i data-lucide="activity" class="w-3 h-3"></i>Activity Feed</button>
                                <button onclick="os.alSwitchTab('miniapps')" class="al-mod-btn w-full flex items-center gap-2 py-1.5 px-2 rounded text-[9px] text-white/40 hover:text-white hover:bg-white/5 transition hover-target cursor-none" data-tab="miniapps"><i data-lucide="grid-2x2" class="w-3 h-3"></i>Mini Apps</button>
                                <button onclick="os.alSwitchTab('screenshare')" class="al-mod-btn w-full flex items-center gap-2 py-1.5 px-2 rounded text-[9px] text-white/40 hover:text-white hover:bg-white/5 transition hover-target cursor-none" data-tab="screenshare"><i data-lucide="monitor-up" class="w-3 h-3"></i>Screen Share</button>
                                <button onclick="os.alSwitchTab('voice')" class="al-mod-btn w-full flex items-center gap-2 py-1.5 px-2 rounded text-[9px] text-white/40 hover:text-white hover:bg-white/5 transition hover-target cursor-none" data-tab="voice"><i data-lucide="radio" class="w-3 h-3"></i>Voice / Walkie-Talkie</button>
                            </div>
                        </div>
                    </div>
                    <div class="flex-1 flex flex-col overflow-hidden">
                        <div id="al-tab-header" class="flex items-center gap-3 px-4 py-2 border-b border-white/5 shrink-0" style="background:rgba(0,0,0,0.3)">
                            <i data-lucide="message-square" class="w-3.5 h-3.5 text-violet-400" id="al-header-icon"></i>
                            <span class="text-[10px] font-bold text-white/70 uppercase tracking-widest" id="al-header-title">Chat</span>
                            <div id="al-voice-indicator" onclick="os.alSwitchTab('voice')" class="hidden items-center gap-1.5 px-2 py-0.5 rounded-full cursor-none hover-target" style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3)">
                                <i data-lucide="radio" class="w-2.5 h-2.5 text-violet-300"></i>
                                <span id="al-voice-indicator-label" class="text-[8px] font-bold text-violet-300">VOICE LIVE</span>
                            </div>
                            <div class="ml-auto flex items-center gap-1.5">
                                <div id="al-conn-dot" class="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                                <span id="al-conn-text" class="text-[8px] text-white/25">Disconnected</span>
                            </div>
                        </div>
                        <div id="al-tab-chat" class="al-tab flex-1 flex flex-col overflow-hidden">
                            <div class="px-3 py-1.5 border-b border-white/[0.04] flex items-center gap-2 shrink-0">
                                <span class="text-[8px] text-white/30">To:</span>
                                <select id="al-chat-peer" class="flex-1 bg-black/50 border border-white/8 rounded px-2 py-1 text-[9px] text-white/70 focus:outline-none cursor-none"><option value="">— Select peer —</option></select>
                                <button onclick="os.alClearChat()" class="p-1 rounded hover:bg-white/5 text-white/25 hover:text-white/50 transition hover-target cursor-none"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
                            </div>
                            <div class="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2" id="al-chat-messages">
                                <div class="flex flex-col items-center justify-center h-full gap-3 text-white/20">
                                    <i data-lucide="message-square-dashed" class="w-10 h-10 text-violet-500/30"></i>
                                    <div class="text-center"><div class="text-xs text-white/25 mb-1">No messages yet</div><div class="text-[9px] text-white/15">Connect to a workstation to begin</div></div>
                                </div>
                            </div>
                            <div id="al-typing-indicator" class="px-3 py-1 text-[8px] text-white/30 italic hidden"></div>
                            <div class="flex items-end gap-2 px-3 py-2 border-t border-white/5 shrink-0">
                                <div class="flex-1 bg-black/50 border border-white/8 rounded-xl px-3 py-2 flex items-end gap-2">
                                    <textarea id="al-chat-input" rows="1" placeholder="Send a message…" class="flex-1 bg-transparent text-[10px] text-white resize-none focus:outline-none cursor-text" style="max-height:80px" oninput="os.alChatInputChange(this)" onkeydown="os.alChatKeydown(event)"></textarea>
                                    <button onclick="os.alToggleEmoji()" class="text-white/30 hover:text-yellow-300 transition hover-target cursor-none"><i data-lucide="smile" class="w-3.5 h-3.5"></i></button>
                                    <button onclick="os.alAttachFile()" class="text-white/30 hover:text-violet-300 transition hover-target cursor-none"><i data-lucide="paperclip" class="w-3.5 h-3.5"></i></button>
                                </div>
                                <button onclick="os.alSendMessage()" class="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style="background:rgba(139,92,246,0.25);border:1px solid rgba(139,92,246,0.4)">
                                    <i data-lucide="send" class="w-3.5 h-3.5 text-violet-300"></i>
                                </button>
                            </div>
                        </div>
                        <div id="al-tab-presence" class="al-tab hidden flex-1 overflow-y-auto no-scrollbar p-4">
                            <div id="al-presence-grid" class="grid grid-cols-1 gap-3">
                                <div class="col-span-1 text-center text-white/20 py-8">
                                    <i data-lucide="users" class="w-8 h-8 text-violet-500/25 mx-auto mb-2"></i>
                                    <div class="text-xs">No peers connected</div>
                                    <div class="text-[9px] mt-1 text-white/15">Peer presence will appear here when connected</div>
                                </div>
                            </div>
                        </div>
                        <div id="al-tab-whiteboard" class="al-tab hidden flex-1 flex flex-col overflow-hidden">
                            <div class="flex items-center gap-2 px-3 py-1.5 border-b border-white/5 shrink-0" style="background:rgba(0,0,0,0.3)">
                                <button onclick="os.alWbTool('pen')" class="al-wb-tool p-1.5 rounded hover:bg-white/8 text-white/50 hover:text-white transition hover-target cursor-none" data-tool="pen" title="Pen"><i data-lucide="pen" class="w-3 h-3"></i></button>
                                <button onclick="os.alWbTool('eraser')" class="al-wb-tool p-1.5 rounded hover:bg-white/8 text-white/40 hover:text-white transition hover-target cursor-none" data-tool="eraser" title="Eraser"><i data-lucide="eraser" class="w-3 h-3"></i></button>
                                <button onclick="os.alWbTool('rect')" class="al-wb-tool p-1.5 rounded hover:bg-white/8 text-white/40 hover:text-white transition hover-target cursor-none" data-tool="rect"><i data-lucide="square" class="w-3 h-3"></i></button>
                                <button onclick="os.alWbTool('circle')" class="al-wb-tool p-1.5 rounded hover:bg-white/8 text-white/40 hover:text-white transition hover-target cursor-none" data-tool="circle"><i data-lucide="circle" class="w-3 h-3"></i></button>
                                <button onclick="os.alWbTool('sticky')" class="al-wb-tool p-1.5 rounded hover:bg-white/8 text-white/40 hover:text-white transition hover-target cursor-none" data-tool="sticky" title="Sticky Note"><i data-lucide="sticky-note" class="w-3 h-3"></i></button>
                                <div class="w-px h-4 bg-white/10"></div>
                                <input type="color" id="al-wb-color" value="#a78bfa" onchange="os.alWbColorChange(this.value)" class="w-6 h-6 rounded cursor-none border border-white/10 overflow-hidden">
                                <select id="al-wb-size" onchange="os.alWbSizeChange(this.value)" class="bg-black/50 border border-white/8 rounded px-1.5 py-0.5 text-[8px] text-white/60 focus:outline-none cursor-none">
                                    <option value="2">Thin</option><option value="4" selected>Normal</option><option value="8">Thick</option><option value="16">Bold</option>
                                </select>
                                <div class="w-px h-4 bg-white/10"></div>
                                <button onclick="os.alWbClear()" class="p-1.5 rounded hover:bg-red-500/15 text-white/30 hover:text-red-400 transition hover-target cursor-none"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
                                <button onclick="os.alWbExport()" class="p-1.5 rounded hover:bg-white/8 text-white/30 hover:text-white transition hover-target cursor-none"><i data-lucide="download" class="w-3 h-3"></i></button>
                                <div class="ml-auto flex items-center gap-1.5">
                                    <div class="w-2 h-2 rounded-full bg-white/20" id="al-wb-remote-dot"></div>
                                    <span class="text-[8px] text-white/30" id="al-wb-remote-label">No collaborators</span>
                                </div>
                            </div>
                            <div class="flex-1 relative overflow-hidden" style="background:#080810">
                                <canvas id="al-wb-canvas" class="absolute inset-0" style="cursor:crosshair;touch-action:none"></canvas>
                                <canvas id="al-wb-remote-canvas" class="absolute inset-0 pointer-events-none" style="opacity:0.7"></canvas>
                            </div>
                        </div>
                        <div id="al-tab-transfer" class="al-tab hidden flex-1 flex flex-col overflow-hidden">
                            <div id="al-drop-zone" class="m-3 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 py-6 transition-all shrink-0" ondragover="event.preventDefault();this.style.borderColor='rgba(139,92,246,0.5)'" ondragleave="this.style.borderColor=''" ondrop="os.alDropFiles(event)">
                                <i data-lucide="upload-cloud" class="w-8 h-8 text-violet-500/40"></i>
                                <div class="text-[10px] text-white/30">Drag files here to send to peer</div>
                                <button onclick="os.alPickFiles()" class="px-3 py-1.5 rounded border border-violet-500/25 text-violet-400/60 text-[9px] hover:border-violet-500/50 hover:text-violet-300 transition hover-target cursor-none">Browse Files</button>
                                <input type="file" id="al-file-input" class="hidden" multiple onchange="os.alFilesSelected(this)">
                            </div>
                            <div class="flex-1 overflow-y-auto no-scrollbar px-3 pb-3">
                                <div class="text-[8px] text-white/25 uppercase tracking-[0.18em] mb-2">Transfer History</div>
                                <div id="al-transfer-list" class="space-y-2"><div class="text-[9px] text-white/20 text-center py-4">No transfers yet</div></div>
                            </div>
                        </div>
                        <div id="al-tab-activity" class="al-tab hidden flex-1 overflow-y-auto no-scrollbar p-3">
                            <div class="text-[8px] text-white/25 uppercase tracking-[0.18em] mb-3">Live Activity Feed</div>
                            <div id="al-activity-feed" class="space-y-2"><div class="text-[9px] text-white/20 text-center py-6">Activity appears here when connected</div></div>
                        </div>
                        <div id="al-tab-miniapps" class="al-tab hidden flex-1 flex flex-col overflow-hidden p-3">
                            <div class="text-[8px] text-white/25 uppercase tracking-[0.18em] mb-3">Multiplayer Mini Apps</div>
                            <div class="grid grid-cols-2 gap-2 mb-3">
                                <button onclick="os.alLaunchMiniApp('chess')" class="flex flex-col items-center gap-2 py-4 rounded-xl border border-white/8 hover:border-violet-500/30 hover:bg-violet-500/8 transition hover-target cursor-none">
                                    <i data-lucide="crown" class="w-6 h-6 text-white/30"></i><span class="text-[9px] text-white/40">Chess</span>
                                </button>
                                <button onclick="os.alLaunchMiniApp('pixelart')" class="flex flex-col items-center gap-2 py-4 rounded-xl border border-white/8 hover:border-violet-500/30 hover:bg-violet-500/8 transition hover-target cursor-none">
                                    <i data-lucide="grid-3x3" class="w-6 h-6 text-white/30"></i><span class="text-[9px] text-white/40">Pixel Art</span>
                                </button>
                                <button onclick="os.alLaunchMiniApp('notes')" class="flex flex-col items-center gap-2 py-4 rounded-xl border border-white/8 hover:border-violet-500/30 hover:bg-violet-500/8 transition hover-target cursor-none">
                                    <i data-lucide="file-text" class="w-6 h-6 text-white/30"></i><span class="text-[9px] text-white/40">Shared Notes</span>
                                </button>
                                <button onclick="os.alLaunchMiniApp('todo')" class="flex flex-col items-center gap-2 py-4 rounded-xl border border-white/8 hover:border-violet-500/30 hover:bg-violet-500/8 transition hover-target cursor-none">
                                    <i data-lucide="check-square" class="w-6 h-6 text-white/30"></i><span class="text-[9px] text-white/40">Shared To-Do</span>
                                </button>
                            </div>
                            <div id="al-mini-app-container" class="flex-1 rounded-xl border border-white/8 overflow-hidden hidden" style="background:rgba(0,0,0,0.5)"></div>
                        </div>

                        <!-- ── SCREEN SHARE TAB ── -->
                        <div id="al-tab-screenshare" class="al-tab hidden flex-1 flex flex-col overflow-hidden p-3">
                            <div class="text-[8px] text-white/25 uppercase tracking-[0.18em] mb-3">Screen Sharing</div>

                            <div id="al-ss-idle" class="flex-1 flex flex-col items-center justify-center gap-4 text-white/20">
                                <i data-lucide="monitor-up" class="w-10 h-10 text-violet-500/30"></i>
                                <div class="text-center">
                                    <div class="text-xs text-white/30 mb-1">No active screen share</div>
                                    <div class="text-[9px] text-white/15">Share your screen with a connected peer<br>over a real WebRTC video stream</div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <select id="al-ss-peer-select" class="bg-black/50 border border-white/8 rounded px-2 py-1.5 text-[9px] text-white/70 focus:outline-none cursor-none">
                                        <option value="">— Select peer —</option>
                                    </select>
                                    <button onclick="os.alStartScreenShare()" class="px-3 py-1.5 rounded text-[9px] uppercase tracking-wider hover-target cursor-none transition" style="background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.35);color:rgba(167,139,250,1)">Share My Screen</button>
                                </div>
                            </div>

                            <div id="al-ss-active" class="hidden flex-1 flex flex-col">
                                <div class="flex items-center justify-between mb-2 shrink-0">
                                    <div class="flex items-center gap-2">
                                        <div class="w-2 h-2 rounded-full bg-red-500" style="animation:indicatorPulse 1.5s infinite"></div>
                                        <span id="al-ss-status-label" class="text-[9px] font-bold text-white/70">Sharing your screen</span>
                                    </div>
                                    <button onclick="os.alStopScreenShare()" class="px-3 py-1 rounded text-[8px] uppercase tracking-wider hover-target cursor-none border border-red-500/30 text-red-400 hover:bg-red-500/10 transition">Stop Sharing</button>
                                </div>
                                <div class="flex-1 rounded-lg overflow-hidden flex items-center justify-center" style="background:#000">
                                    <video id="al-ss-video" autoplay playsinline class="max-w-full max-h-full"></video>
                                </div>
                            </div>
                        </div>

                        <!-- ── VOICE / WALKIE-TALKIE TAB ── -->
                        <div id="al-tab-voice" class="al-tab hidden flex-1 flex flex-col overflow-hidden p-4">
                            <div class="text-[8px] text-white/25 uppercase tracking-[0.18em] mb-3">Voice Chat</div>

                            <!-- Mode selector -->
                            <div class="grid grid-cols-2 gap-2 mb-4 shrink-0">
                                <button id="al-voice-mode-open" onclick="os.alSetVoiceMode('open')" class="al-voice-mode-btn py-2 rounded-lg border border-white/10 text-[9px] text-white/50 hover:border-violet-500/30 hover:text-violet-300 transition hover-target cursor-none flex flex-col items-center gap-1">
                                    <i data-lucide="mic" class="w-4 h-4"></i>
                                    Open Mic (Duplex)
                                </button>
                                <button id="al-voice-mode-walkie" onclick="os.alSetVoiceMode('walkie')" class="al-voice-mode-btn py-2 rounded-lg border border-white/10 text-[9px] text-white/50 hover:border-violet-500/30 hover:text-violet-300 transition hover-target cursor-none flex flex-col items-center gap-1">
                                    <i data-lucide="radio" class="w-4 h-4"></i>
                                    Walkie-Talkie (PTT)
                                </button>
                            </div>

                            <div id="al-voice-idle" class="flex-1 flex flex-col items-center justify-center gap-3 text-white/20">
                                <i data-lucide="radio" class="w-10 h-10 text-violet-500/30"></i>
                                <div class="text-center">
                                    <div class="text-xs text-white/30 mb-1">Voice chat not active</div>
                                    <div class="text-[9px] text-white/15">Pick a mode above to start a real<br>WebRTC audio session with connected peers</div>
                                </div>
                            </div>

                            <div id="al-voice-active" class="hidden flex-1 flex flex-col">
                                <div class="flex items-center justify-between mb-3 shrink-0">
                                    <div class="flex items-center gap-2">
                                        <div id="al-voice-status-dot" class="w-2 h-2 rounded-full bg-emerald-400"></div>
                                        <span id="al-voice-status-label" class="text-[9px] font-bold text-white/70">Voice connected</span>
                                    </div>
                                    <button onclick="os.alLeaveVoice()" class="px-3 py-1 rounded text-[8px] uppercase tracking-wider hover-target cursor-none border border-red-500/30 text-red-400 hover:bg-red-500/10 transition">Leave Voice</button>
                                </div>
                                <div id="al-voice-participants" class="space-y-1.5 mb-4"></div>

                                <div id="al-voice-open-controls" class="hidden flex items-center justify-center gap-3 mt-auto">
                                    <button id="al-voice-mute-btn" onclick="os.alToggleMute()" class="w-12 h-12 rounded-full flex items-center justify-center border transition hover-target cursor-none" style="background:rgba(139,92,246,0.15);border-color:rgba(139,92,246,0.3)">
                                        <i data-lucide="mic" id="al-voice-mute-icon" class="w-5 h-5 text-violet-300"></i>
                                    </button>
                                    <span class="text-[9px] text-white/30">Click to mute / unmute your mic</span>
                                </div>

                                <div id="al-voice-ptt-controls" class="hidden flex flex-col items-center gap-3 mt-auto">
                                    <button id="al-voice-ptt-btn"
                                        onmousedown="os.alPTTStart()" onmouseup="os.alPTTEnd()" onmouseleave="os.alPTTEnd()"
                                        ontouchstart="event.preventDefault();os.alPTTStart()" ontouchend="event.preventDefault();os.alPTTEnd()"
                                        class="w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all hover-target cursor-none select-none"
                                        style="background:rgba(139,92,246,0.12);border-color:rgba(139,92,246,0.3)">
                                        <i data-lucide="radio" class="w-8 h-8 text-violet-300"></i>
                                    </button>
                                    <span class="text-[9px] text-white/30">Hold to talk · Release to listen</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="al-ss-incoming-modal" style="display:none;position:absolute;inset:0;z-index:50;align-items:center;justify-content:center;background:rgba(0,0,0,0.8);backdrop-filter:blur(14px)">
                        <div class="rounded-2xl border border-white/10 p-6 w-72 text-center" style="background:rgba(8,8,18,0.97);box-shadow:0 24px 80px rgba(0,0,0,0.9),0 0 0 1px rgba(139,92,246,0.15)">
                            <div class="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style="background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.25)">
                                <i data-lucide="monitor-up" class="w-6 h-6 text-violet-400"></i>
                            </div>
                            <div class="text-xs font-bold text-white/80 mb-1">Screen Share Request</div>
                            <div id="al-ss-incoming-msg" class="text-[10px] text-white/45 mb-4">A peer wants to share their screen with you</div>
                            <div class="grid grid-cols-2 gap-2">
                                <button onclick="os.alAcceptScreenShare()" class="py-2 rounded-lg text-violet-300 text-[10px] font-bold uppercase tracking-wider transition hover-target cursor-none" style="background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.35)">Accept</button>
                                <button onclick="os.alDeclineScreenShare()" class="py-2 rounded-lg border border-white/10 text-white/40 text-[10px] uppercase tracking-wider hover:border-white/25 hover:text-white transition hover-target cursor-none">Decline</button>
                            </div>
                        </div>
                    </div>
                    <div id="al-pair-modal" style="display:none;position:absolute;inset:0;z-index:50;align-items:center;justify-content:center;background:rgba(0,0,0,0.8);backdrop-filter:blur(14px)">
                        <div class="rounded-2xl border border-white/10 p-6 w-72 text-center" style="background:rgba(8,8,18,0.97);box-shadow:0 24px 80px rgba(0,0,0,0.9),0 0 0 1px rgba(139,92,246,0.15)">
                            <div class="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style="background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.25)">
                                <i data-lucide="link-2" class="w-6 h-6 text-violet-400"></i>
                            </div>
                            <div class="text-xs font-bold text-white/80 mb-1" id="al-pair-title">Pair Request</div>
                            <div class="text-[10px] text-white/45 mb-4" id="al-pair-msg">A workstation wants to connect</div>
                            <div class="grid grid-cols-2 gap-2">
                                <button onclick="os.alAcceptPair()" class="py-2 rounded-lg text-violet-300 text-[10px] font-bold uppercase tracking-wider transition hover-target cursor-none" style="background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.35)">Accept</button>
                                <button onclick="os.alRejectPair()" class="py-2 rounded-lg border border-white/10 text-white/40 text-[10px] uppercase tracking-wider hover:border-white/25 hover:text-white transition hover-target cursor-none">Decline</button>
                            </div>
                        </div>
                    </div>
                    <div id="al-emoji-picker" class="rounded-xl border border-white/10 p-2" style="display:none;position:absolute;z-index:50;right:16px;bottom:90px;width:220px;background:rgba(8,8,18,0.97);box-shadow:0 12px 40px rgba(0,0,0,0.7)">
                        <div id="al-emoji-grid" class="grid grid-cols-8 gap-0.5 text-sm"></div>
                    </div>
                </div>
            `
});
