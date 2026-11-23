// AetherOS — Window DOM Templates (network-workspace-templates)
Object.assign(WindowContents, {
    presence: `
        <div class="flex flex-col h-full bg-[#07090f]/95 relative overflow-hidden p-4 text-xs select-none" id="presence-console-panel"></div>
    `,

    feed: `
        <div class="flex flex-col h-full bg-[#07090f]/95 text-xs select-none" id="signal-feed-root">
            <div class="os-toolbar">
                <div class="os-segmented flex-wrap" id="feed-source-tabs">
                    <button type="button" data-feed-src="all" onclick="os.feedSetSource('all')" class="os-seg-btn active hover-target cursor-none">All</button>
                    <button type="button" data-feed-src="hn" onclick="os.feedSetSource('hn')" class="os-seg-btn hover-target cursor-none">Hacker News</button>
                    <button type="button" data-feed-src="devto" onclick="os.feedSetSource('devto')" class="os-seg-btn hover-target cursor-none">Dev.to</button>
                    <button type="button" data-feed-src="github" onclick="os.feedSetSource('github')" class="os-seg-btn hover-target cursor-none">GitHub</button>
                    <button type="button" data-feed-src="reddit" onclick="os.feedSetSource('reddit')" class="os-seg-btn hover-target cursor-none">Reddit</button>
                    <button type="button" data-feed-src="saved" onclick="os.feedSetSource('saved')" class="os-seg-btn hover-target cursor-none">Saved <span id="feed-saved-count" class="ml-0.5 opacity-70">0</span></button>
                </div>
                <div class="flex items-center gap-1.5">
                    <div class="relative">
                        <i data-lucide="search" class="w-3 h-3 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                        <input id="feed-search-input" type="text" placeholder="Filter stories..." oninput="os.feedSetSearch(this.value)"
                            class="os-input pl-7 pr-2.5 py-1 w-40 text-[11px]">
                    </div>
                    <button type="button" onclick="os.initSignalFeed(true)" class="os-btn hover-target cursor-none" title="Refresh feeds"><i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i></button>
                </div>
            </div>

            <div class="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[360px_1fr] overflow-hidden">
                <div class="border-r border-white/[0.07] overflow-y-auto p-2.5 space-y-1.5 bg-black/25" id="signal-stream-container">
                    <div class="py-10 text-center text-gray-400 text-xs">Loading stories from Hacker News, Dev.to, GitHub &amp; Reddit...</div>
                </div>
                <div class="hidden md:flex flex-col min-h-0 overflow-y-auto p-5 bg-[#090c14]/70 select-text" id="feed-reader-pane">
                    <div class="m-auto text-center text-gray-500 max-w-xs space-y-2">
                        <i data-lucide="newspaper" class="w-8 h-8 mx-auto text-gray-600"></i>
                        <div class="text-sm font-medium text-gray-300">Select a story to read</div>
                        <div class="text-xs text-gray-500 leading-relaxed">Read full Dev.to articles, inspect Hacker News top comments, or clip stories straight to Files.</div>
                    </div>
                </div>
            </div>

            <div class="border-t border-white/[0.07] px-3.5 py-1.5 bg-black/45 text-[11px] text-gray-400 flex justify-between items-center shrink-0">
                <span id="signal-sources-lbl">Connecting to feeds...</span>
                <span id="signal-buffer-count" class="font-mono text-gray-300 tabular-nums">0 stories</span>
            </div>
        </div>
    `,

    floor796: `
                <div class="h-full flex flex-col bg-[#060607] overflow-hidden relative" id="floor796-root">
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
                <div class="h-full flex flex-col bg-[#050507] overflow-hidden relative" id="wplace-root">
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
        <div class="flex flex-col h-full bg-[#07090f] overflow-hidden text-xs" id="browser-root">
            <div class="flex items-center gap-1.5 px-3 py-2 border-b border-white/[0.07] bg-black/50 shrink-0">
                <button type="button" onclick="os.browserNav('back')" id="browser-btn-back" title="Back"
                    class="os-btn px-2 py-1.5 hover-target cursor-none disabled:opacity-35">
                    <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
                </button>
                <button type="button" onclick="os.browserNav('forward')" id="browser-btn-fwd" title="Forward"
                    class="os-btn px-2 py-1.5 hover-target cursor-none disabled:opacity-35">
                    <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                </button>
                <button type="button" onclick="os.browserShowHome()" title="Start Page"
                    class="os-btn px-2 py-1.5 hover-target cursor-none">
                    <i data-lucide="home" class="w-3.5 h-3.5"></i>
                </button>

                <div class="flex-1 relative flex items-center">
                    <i data-lucide="globe" class="absolute left-3 w-3.5 h-3.5 text-gray-400 pointer-events-none"></i>
                    <input id="browser-url-input" type="text"
                        class="w-full os-input pl-9 pr-16 py-1.5 text-xs font-mono cursor-text"
                        placeholder="Search Wikipedia / DuckDuckGo or enter a URL..."
                        onkeydown="if(event.key==='Enter') os.browserGo()">
                    <button type="button" onclick="os.browserGo()"
                        class="absolute right-1 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[11px] font-medium text-white transition cursor-none hover-target">
                        Go
                    </button>
                </div>

                <button type="button" onclick="os.browserToggleFav()" id="browser-btn-fav" title="Bookmark page"
                    class="os-btn px-2 py-1.5 hover-target cursor-none">
                    <i data-lucide="star" class="w-3.5 h-3.5"></i>
                </button>
                <button type="button" onclick="os.browserClipToVFS && os.browserClipToVFS()" title="Save Reader Clip to Files"
                    class="os-btn px-2.5 py-1.5 hover-target cursor-none">
                    <i data-lucide="bookmark-plus" class="w-3.5 h-3.5"></i> Clip
                </button>
                <button type="button" onclick="os.browserOpenExternal()" title="Open in host browser tab"
                    class="os-btn px-2 py-1.5 hover-target cursor-none">
                    <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                </button>
            </div>

            <div class="flex items-center gap-1 px-2.5 pt-1.5 pb-0 border-b border-white/[0.06] bg-black/30 shrink-0 overflow-x-auto no-scrollbar" id="browser-tabs-row"></div>

            <div class="flex-1 overflow-hidden relative">
                <div id="browser-home" class="absolute inset-0 overflow-y-auto p-5 space-y-5">
                    <div class="max-w-2xl mx-auto space-y-5">
                        <div class="flex gap-2 mt-1">
                            <div class="flex-1 relative">
                                <i data-lucide="search" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"></i>
                                <input id="browser-search-big" type="text"
                                    class="w-full os-input pl-10 pr-4 py-2.5 text-sm cursor-text"
                                    placeholder="Search the web or Wikipedia..."
                                    onkeydown="if(event.key==='Enter') os.browserSearch(this.value)">
                            </div>
                            <button type="button" onclick="os.browserSearch(document.getElementById('browser-search-big').value)"
                                class="px-4 py-2.5 os-btn-primary text-xs cursor-none hover-target">
                                Search
                            </button>
                        </div>

                        <div>
                            <div class="text-[11px] font-semibold text-gray-400 mb-2.5">Speed Dial</div>
                            <div class="grid grid-cols-4 gap-2.5" id="browser-quicklaunch"></div>
                        </div>

                        <div id="browser-bookmarks-section" class="hidden">
                            <div class="text-[11px] font-semibold text-gray-400 mb-2 flex items-center justify-between">
                                <span>Bookmarks</span>
                                <button type="button" onclick="os.browserClearBookmarks()" class="text-rose-400/80 hover:text-rose-300 text-[11px] cursor-none hover-target">Clear all</button>
                            </div>
                            <div class="space-y-1" id="browser-bookmarks-list"></div>
                        </div>

                        <div id="browser-history-section" class="hidden">
                            <div class="text-[11px] font-semibold text-gray-400 mb-2 flex items-center justify-between">
                                <span>Recent History</span>
                                <button type="button" onclick="os.browserClearHistory()" class="text-rose-400/80 hover:text-rose-300 text-[11px] cursor-none hover-target">Clear</button>
                            </div>
                            <div class="space-y-0.5" id="browser-history-list"></div>
                        </div>
                    </div>
                </div>

                <div id="browser-preview" class="absolute inset-0 hidden flex-col">
                    <div class="flex items-center justify-between px-3.5 py-1.5 bg-black/55 border-b border-white/[0.07] shrink-0 gap-2">
                        <div class="flex items-center gap-2 text-xs min-w-0">
                            <span class="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                            <span class="text-gray-200 font-medium shrink-0" id="browser-preview-domain">--</span>
                            <span class="text-gray-600">·</span>
                            <span class="text-gray-400 truncate" id="browser-preview-title">--</span>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0">
                            <div class="os-segmented">
                                <button type="button" id="browser-mode-reader" onclick="os.browserSetRenderMode('reader')" class="os-seg-btn active hover-target cursor-none">Reader View</button>
                                <button type="button" id="browser-mode-embed" onclick="os.browserSetRenderMode('embed')" class="os-seg-btn hover-target cursor-none">Live Embed</button>
                            </div>
                            <button type="button" onclick="os.browserOpenExternal()" class="os-btn hover-target cursor-none">
                                <i data-lucide="external-link" class="w-3 h-3"></i> New Tab
                            </button>
                        </div>
                    </div>

                    <div class="flex-1 overflow-y-auto p-5 no-scrollbar select-text" id="browser-preview-content"></div>
                    <iframe id="browser-iframe-view" title="Live Web View" src="about:blank" class="hidden flex-1 w-full border-0 bg-white" referrerpolicy="no-referrer"></iframe>
                </div>
            </div>

            <div class="flex items-center justify-between px-3.5 py-1 border-t border-white/[0.06] bg-black/45 shrink-0 text-[11px] text-gray-400">
                <span id="browser-status">Ready</span>
                <span class="text-gray-500">Reader Mode + Live Embed</span>
            </div>
        </div>
    `,

    globe: `
        <div class="w-full h-full bg-[#07090f] relative overflow-hidden flex text-xs text-gray-300 select-none" id="globe-root">
            <div class="w-64 bg-[#080a11] border-r border-white/[0.07] flex flex-col z-20 shrink-0 h-full overflow-hidden">
                <div class="p-2.5 border-b border-white/[0.07] bg-black/35 space-y-2">
                    <div class="relative">
                        <i data-lucide="search" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500"></i>
                        <input type="text" id="flight-radar-search"
                            class="w-full os-input py-1.5 pl-8 pr-2.5 text-xs cursor-text"
                            placeholder="Callsign, country, ICAO..."
                            oninput="os.filterFlights(this.value)">
                    </div>
                    <div class="flex items-center justify-between">
                        <button type="button" onclick="os.fetchGlobeData()" id="globe-refresh-btn" class="os-btn hover-target cursor-none">
                            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Refresh
                        </button>
                        <span id="globe-flight-count" class="text-[11px] text-emerald-300 font-mono font-semibold tabular-nums">0 aircraft</span>
                    </div>
                </div>

                <div id="radar-detail-panel" class="border-b border-white/[0.07] bg-black/30 hidden">
                    <div id="radar-detail-embed-note" class="hidden px-2.5 py-1.5 text-[10px] text-amber-200 bg-amber-500/10 border-b border-amber-500/20">
                        Embed view active — switch back to Live Map for live aircraft selection.
                    </div>
                    <div class="relative h-20 bg-black overflow-hidden">
                        <div id="radar-aircraft-img" class="absolute inset-0 bg-cover bg-center opacity-65"></div>
                        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent"></div>
                        <div class="absolute bottom-1.5 left-2.5 right-2.5 flex justify-between items-end z-10">
                            <div>
                                <div class="text-white font-bold text-sm font-mono" id="rd-callsign">THY171</div>
                                <div class="text-[10px] text-gray-400 font-mono" id="rd-icao">4BB199</div>
                            </div>
                            <button type="button" onclick="os.deselectFlight()" class="text-[10px] bg-white/10 hover:bg-rose-500/30 text-gray-200 px-1.5 py-0.5 rounded cursor-none hover-target">✕</button>
                        </div>
                    </div>
                    <div class="p-2.5 space-y-1.5 text-[11px]">
                        <div class="grid grid-cols-2 gap-x-2 gap-y-1">
                            <span class="text-gray-400">Groundspeed</span><span class="text-white font-mono font-semibold text-right tabular-nums" id="rd-speed">-- kt</span>
                            <span class="text-gray-400">Baro Alt</span><span class="text-amber-300 font-mono font-semibold text-right tabular-nums" id="rd-baro">-- ft</span>
                            <span class="text-gray-400">Geo Alt</span><span class="text-white font-mono text-right tabular-nums" id="rd-geoalt">-- ft</span>
                            <span class="text-gray-400">Climb Rate</span><span class="text-right font-mono tabular-nums" id="rd-vrate">-- ft/min</span>
                            <span class="text-gray-400">Heading</span><span class="text-white font-mono text-right tabular-nums" id="rd-track">--°</span>
                            <span class="text-gray-400">Coords</span><span class="text-emerald-300 text-right font-mono text-[10px] tabular-nums" id="rd-pos">--, --</span>
                            <span class="text-gray-400">Source</span><span class="text-sky-300 font-medium text-right" id="rd-source">ADS-B</span>
                            <span class="text-gray-400">Squawk</span><span class="text-amber-300 font-mono text-right" id="rd-squawk">----</span>
                            <span class="text-gray-400">Country</span><span class="text-white text-right truncate" id="rd-country">--</span>
                            <span class="text-gray-400">ICAO24</span><span class="text-gray-300 font-mono text-right" id="rd-icao24">------</span>
                            <span class="text-gray-400">Reg / Type</span><span class="text-white text-right truncate"><span id="rd-reg">--</span> · <span id="rd-type">--</span></span>
                            <span class="text-gray-400">Status</span><span class="text-right"><span id="rd-route" class="hidden">--</span><span id="rd-ground">--</span></span>
                        </div>
                        <button type="button" onclick="os.fetchAndDrawVesselTrail(os.selectedFlight)" class="w-full mt-1.5 os-btn justify-center hover-target cursor-none">
                            <i data-lucide="route" class="w-3 h-3"></i> Show Flight Trail
                        </button>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto p-1.5 space-y-0.5 no-scrollbar" id="flight-manifest-list">
                    <div class="text-center text-gray-400 py-8 text-xs">Loading live ADS-B traffic...</div>
                </div>

                <div class="border-t border-white/[0.07] p-2.5 bg-black/40 shrink-0">
                    <div class="text-[10px] text-gray-400 mb-1">Altitude (ft)</div>
                    <div class="flex h-2 rounded-full overflow-hidden w-full">
                        <div class="flex-1" style="background:#ef4444"></div>
                        <div class="flex-1" style="background:#f97316"></div>
                        <div class="flex-1" style="background:#eab308"></div>
                        <div class="flex-1" style="background:#84cc16"></div>
                        <div class="flex-1" style="background:#10b981"></div>
                        <div class="flex-1" style="background:#06b6d4"></div>
                        <div class="flex-1" style="background:#3b82f6"></div>
                        <div class="flex-1" style="background:#8b5cf6"></div>
                    </div>
                    <div class="flex justify-between text-[10px] font-mono text-gray-500 mt-1">
                        <span>0</span><span>10k</span><span>25k</span><span>40k+</span>
                    </div>
                </div>
            </div>

            <div class="flex-1 relative" id="radar-map-wrapper">
                <div class="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 flex-wrap">
                    <div class="os-segmented bg-black/80 backdrop-blur-md">
                        <button type="button" id="radar-mode-leaflet-btn" onclick="os.switchRadarView('leaflet')" class="os-seg-btn active hover-target cursor-none">Live Map</button>
                        <button type="button" id="radar-mode-embed-btn" onclick="os.switchRadarView('embed')" class="os-seg-btn hover-target cursor-none">ADS-B Exchange</button>
                    </div>
                    <div class="hidden lg:flex items-center gap-1 bg-black/75 backdrop-blur-md border border-white/10 rounded-lg p-0.5 text-[10.5px]">
                        <button type="button" onclick="os.radarJumpRegion && os.radarJumpRegion(20,0,2)" class="px-2 py-0.5 rounded hover:bg-white/10 text-gray-200 cursor-none hover-target">World</button>
                        <button type="button" onclick="os.radarJumpRegion && os.radarJumpRegion(50,10,4)" class="px-2 py-0.5 rounded hover:bg-white/10 text-gray-200 cursor-none hover-target">Europe</button>
                        <button type="button" onclick="os.radarJumpRegion && os.radarJumpRegion(39,-96,4)" class="px-2 py-0.5 rounded hover:bg-white/10 text-gray-200 cursor-none hover-target">N. America</button>
                        <button type="button" onclick="os.radarJumpRegion && os.radarJumpRegion(22,79,4)" class="px-2 py-0.5 rounded hover:bg-white/10 text-gray-200 cursor-none hover-target">India</button>
                        <button type="button" onclick="os.radarJumpRegion && os.radarJumpRegion(35,136,4)" class="px-2 py-0.5 rounded hover:bg-white/10 text-gray-200 cursor-none hover-target">E. Asia</button>
                    </div>
                </div>

                <div id="radar-leaflet-map" class="absolute inset-0" style="z-index:1; cursor:grab;"></div>
                <div id="radar-embed-shell" class="absolute inset-0 hidden bg-black" style="z-index:1;">
                    <iframe id="radar-embed-frame" class="w-full h-full border-0" referrerpolicy="no-referrer"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"></iframe>
                </div>
                <div id="radar-embed-warning" class="hidden absolute top-12 left-2.5 z-10 bg-amber-500/15 border border-amber-500/35 text-amber-200 rounded-lg px-2.5 py-1 text-[11px]">
                    External ADS-B map view
                </div>

                <div class="absolute top-2.5 right-2.5 z-10 pointer-events-none">
                    <div class="bg-black/80 backdrop-blur-md border border-white/10 rounded-xl px-3 py-1.5 text-[11px] text-right">
                        <div class="text-white font-semibold" id="globe-event-title">Connecting ADS-B...</div>
                        <div class="text-emerald-300 font-mono text-[10.5px] tabular-nums" id="globe-event-mag">--</div>
                        <div class="text-gray-400 font-mono text-[10px]" id="globe-event-time">--</div>
                    </div>
                </div>
            </div>
        </div>
    `,

    market: `
        <div class="flex flex-col h-full bg-[#07090f] text-xs select-none overflow-hidden" id="market-root">
            <div class="os-toolbar">
                <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold font-mono text-xs" id="market-coin-badge">₿</div>
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="text-white font-semibold text-sm" id="market-symbol-title">BTC / USDT</span>
                            <span class="os-badge text-[10px]" id="market-status-lbl">Connecting...</span>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-2 flex-wrap">
                    <div class="os-segmented" id="market-tf-group">
                        <button type="button" data-mkt-tf="1m" onclick="os.marketSetInterval('1m')" class="os-seg-btn active hover-target cursor-none">1m</button>
                        <button type="button" data-mkt-tf="15m" onclick="os.marketSetInterval('15m')" class="os-seg-btn hover-target cursor-none">15m</button>
                        <button type="button" data-mkt-tf="1h" onclick="os.marketSetInterval('1h')" class="os-seg-btn hover-target cursor-none">1h</button>
                        <button type="button" data-mkt-tf="4h" onclick="os.marketSetInterval('4h')" class="os-seg-btn hover-target cursor-none">4h</button>
                        <button type="button" data-mkt-tf="1d" onclick="os.marketSetInterval('1d')" class="os-seg-btn hover-target cursor-none">1D</button>
                    </div>
                    <div class="os-segmented">
                        <button type="button" id="mkt-style-candles" onclick="os.marketSetChartStyle('candles')" class="os-seg-btn active hover-target cursor-none">Candles</button>
                        <button type="button" id="mkt-style-area" onclick="os.marketSetChartStyle('area')" class="os-seg-btn hover-target cursor-none">Area</button>
                    </div>
                </div>

                <div class="text-right">
                    <div id="market-price" class="text-lg font-mono font-bold text-white leading-none tabular-nums">--</div>
                    <div id="market-change" class="text-[11px] font-mono text-gray-400 mt-0.5 tabular-nums">--</div>
                </div>
            </div>

            <div class="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[200px_1fr] overflow-hidden">
                <aside class="border-r border-white/[0.07] bg-black/30 p-2 overflow-y-auto space-y-1" id="market-watchlist"></aside>

                <div class="flex flex-col min-h-0 p-3 gap-2.5">
                    <div class="flex items-center justify-between px-2 text-[11px] font-mono text-gray-400 tabular-nums" id="market-ohlc-bar">
                        <span>Hover chart to inspect candle OHLC</span>
                        <span id="market-24h-range">24h High/Low: --</span>
                    </div>
                    <div class="flex-1 relative w-full border border-white/[0.07] rounded-xl bg-[#04060b] overflow-hidden">
                        <canvas id="market-canvas" class="absolute inset-0 w-full h-full"></canvas>
                    </div>
                    <div class="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs flex-wrap">
                        <div class="flex items-center gap-2">
                            <span class="text-gray-400 text-[11px]">Quick Convert:</span>
                            <input id="market-conv-coin" type="number" step="any" value="1" oninput="os.marketConvert('coin')" class="os-input w-24 py-1 px-2 text-xs font-mono tabular-nums">
                            <span id="market-conv-sym" class="text-gray-300 font-mono font-semibold text-[11px]">BTC</span>
                            <span class="text-gray-500">=</span>
                            <span class="text-gray-400 font-mono">$</span>
                            <input id="market-conv-usd" type="number" step="any" oninput="os.marketConvert('usd')" class="os-input w-32 py-1 px-2 text-xs font-mono tabular-nums">
                            <span class="text-gray-400 font-mono text-[11px]">USD</span>
                        </div>
                        <span class="text-[11px] text-gray-500" id="market-feed-note">Binance Vision REST + Live WebSocket</span>
                    </div>
                </div>
            </div>
        </div>
    `,

    entityscanner: `
        <div class="flex flex-col h-full bg-[#07090f] text-xs relative overflow-hidden select-none" id="entityscanner-root">
            <div class="os-toolbar">
                <div class="os-segmented">
                    <button type="button" onclick="os.switchScannerTab('stats')" id="scan-tab-stats" class="os-seg-btn active hover-target cursor-none">Stats &amp; Lore</button>
                    <button type="button" onclick="os.switchScannerTab('evolution')" id="scan-tab-evolution" class="os-seg-btn hover-target cursor-none">Evolutions &amp; Forms</button>
                    <button type="button" onclick="os.switchScannerTab('combat')" id="scan-tab-combat" class="os-seg-btn hover-target cursor-none">1v1 Arena</button>
                    <button type="button" onclick="os.switchScannerTab('intercepts')" id="scan-tab-intercepts" class="os-seg-btn hover-target cursor-none">Favorites &amp; Recent</button>
                </div>
                <div class="flex items-center gap-1.5">
                    <button type="button" onclick="os.scannerRandomEntity && os.scannerRandomEntity()" class="os-btn hover-target cursor-none" title="Random Pokémon or Anime Character">
                        <i data-lucide="shuffle" class="w-3.5 h-3.5"></i> Random
                    </button>
                </div>
            </div>

            <div class="flex-1 flex overflow-hidden min-h-0">
                <div class="w-[38%] min-w-[240px] border-r border-white/[0.07] bg-black/30 p-4 flex flex-col justify-between shrink-0">
                    <div class="space-y-2.5">
                        <div class="flex gap-1.5">
                            <div class="flex-1 relative">
                                <i data-lucide="search" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"></i>
                                <input type="text" id="scanner-search-input" class="w-full os-input py-1.5 pl-8 pr-2 text-xs cursor-text" placeholder="Pokémon, Dragon Ball, or Anime hero..." onkeydown="if(event.key==='Enter') os.runEntityScan()">
                            </div>
                            <button type="button" onclick="os.runEntityScan()" class="os-btn-primary px-3 py-1.5 text-xs cursor-none hover-target">Search</button>
                        </div>
                        <div class="flex gap-1 flex-wrap">
                            <button type="button" onclick="os.setScannerPreset('charizard')" class="px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-white/10 text-[10.5px] text-gray-300 cursor-none hover-target">Charizard</button>
                            <button type="button" onclick="os.setScannerPreset('mewtwo')" class="px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-white/10 text-[10.5px] text-gray-300 cursor-none hover-target">Mewtwo</button>
                            <button type="button" onclick="os.setScannerPreset('gengar')" class="px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-white/10 text-[10.5px] text-gray-300 cursor-none hover-target">Gengar</button>
                            <button type="button" onclick="os.setScannerPreset('pikachu')" class="px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-white/10 text-[10.5px] text-gray-300 cursor-none hover-target">Pikachu</button>
                            <button type="button" onclick="os.setScannerPreset('goku')" class="px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-white/10 text-[10.5px] text-gray-300 cursor-none hover-target">Goku</button>
                            <button type="button" onclick="os.setScannerPreset('vegeta')" class="px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-white/10 text-[10.5px] text-gray-300 cursor-none hover-target">Vegeta</button>
                        </div>
                    </div>

                    <div class="my-auto py-3 flex flex-col items-center justify-center">
                        <div class="w-44 h-44 rounded-2xl bg-gradient-to-b from-white/[0.05] to-black/40 border border-white/[0.08] flex items-center justify-center relative overflow-hidden">
                            <img id="scanner-entity-img" class="w-full h-full object-contain p-3 transition-transform duration-300 hover:scale-105" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png" alt="Character Artwork">
                            <span class="absolute top-2 left-2 os-badge text-[10px]" id="scanner-lock-lbl">PokéAPI</span>
                        </div>
                        <div class="flex items-center gap-1.5 mt-3">
                            <button type="button" id="scanner-shiny-btn" onclick="os.scannerToggleShiny && os.scannerToggleShiny()" class="hidden os-btn hover-target cursor-none text-amber-300">✦ Shiny</button>
                            <button type="button" id="scanner-cry-btn" onclick="os.scannerPlayCry && os.scannerPlayCry()" class="hidden os-btn hover-target cursor-none text-sky-300">🔊 Cry</button>
                            <button type="button" id="scanner-fav-btn" onclick="os.scannerToggleFavorite && os.scannerToggleFavorite()" class="os-btn hover-target cursor-none">☆ Favorite</button>
                        </div>
                    </div>

                    <div class="border-t border-white/[0.07] pt-3 space-y-1.5 text-[11px] text-gray-400">
                        <div class="flex justify-between"><span>Universe</span><span class="text-white font-medium" id="scanner-spectral-lbl">Pokémon</span></div>
                        <div class="flex justify-between"><span>Types / Role</span><span class="text-sky-300 font-medium" id="scanner-sig-pct">Fire · Flying</span></div>
                        <div class="flex justify-between"><span>Tier</span><span class="text-amber-300 font-semibold" id="scanner-rating-lbl">S-Tier</span></div>
                    </div>
                </div>

                <div class="flex-1 p-5 overflow-y-auto relative flex flex-col justify-between select-text">
                    <div id="scanner-tab-view-stats" class="space-y-4 flex-1">
                        <div class="flex justify-between items-start border-b border-white/[0.07] pb-3">
                            <div>
                                <h3 class="text-white font-display font-bold text-lg" id="scanner-name">Charizard</h3>
                                <div class="text-xs text-gray-400 mt-0.5" id="scanner-meta-affiliation">#006 · Flame Pokémon · Fire / Flying</div>
                            </div>
                            <span class="os-badge text-amber-300" id="scanner-danger-class">BST 534</span>
                        </div>

                        <div class="grid grid-cols-2 gap-2.5" id="scanner-stat-matrix"></div>

                        <div class="space-y-1.5">
                            <div class="text-[11px] text-gray-400 font-semibold">Pokédex / Biographical Entry</div>
                            <p class="text-gray-300 leading-relaxed text-xs" id="scanner-assessment">
                                Spits fire that is hot enough to melt boulders. Known to cause forest fires unintentionally.
                            </p>
                        </div>
                    </div>

                    <div id="scanner-tab-view-evolution" class="space-y-4 flex-1 hidden">
                        <div class="border-b border-white/[0.07] pb-2.5">
                            <h3 class="text-white font-semibold text-sm">Evolution Line &amp; Alternate Forms</h3>
                            <div class="text-[11px] text-gray-400">Click any stage to inspect stats &amp; artwork</div>
                        </div>
                        <div class="space-y-2" id="scanner-evolution-chain"></div>
                    </div>

                    <div id="scanner-tab-view-combat" class="space-y-4 flex-1 hidden">
                        <div class="border-b border-white/[0.07] pb-2.5 flex justify-between items-center">
                            <div>
                                <h3 class="text-white font-semibold text-sm">1v1 Stat Arena</h3>
                                <div class="text-[11px] text-gray-400">Turn-based matchup simulator using real base stats</div>
                            </div>
                            <button type="button" onclick="os.toggleCombatScaling()" id="btn-combat-scale" class="os-btn text-emerald-300 cursor-none hover-target">Mode: Balanced</button>
                        </div>

                        <div class="grid grid-cols-11 gap-2 items-center">
                            <div class="col-span-5 os-card p-2.5">
                                <div class="text-[10px] text-gray-400 font-medium mb-1">Challenger 1</div>
                                <select id="combat-fighter-left" class="w-full os-input p-1.5 text-xs cursor-none hover-target" onchange="os.updateCombatFighter('left')"></select>
                            </div>
                            <div class="col-span-1 text-center font-display text-gray-400 font-bold text-xs">VS</div>
                            <div class="col-span-5 os-card p-2.5">
                                <div class="text-[10px] text-gray-400 font-medium mb-1">Challenger 2</div>
                                <select id="combat-fighter-right" class="w-full os-input p-1.5 text-xs cursor-none hover-target" onchange="os.updateCombatFighter('right')"></select>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-1">
                                <div class="flex justify-between text-xs"><span id="combat-left-name" class="text-white font-semibold truncate">--</span><span id="combat-left-hp-readout" class="text-gray-400 font-mono tabular-nums">100/100</span></div>
                                <div class="w-full h-2.5 bg-black/50 rounded-full overflow-hidden relative border border-white/[0.07]">
                                    <div id="combat-left-hp-bar" class="absolute right-0 top-0 bottom-0 bg-emerald-400 w-full transition-all duration-150"></div>
                                </div>
                            </div>
                            <div class="space-y-1">
                                <div class="flex justify-between text-xs"><span id="combat-right-hp-readout" class="text-gray-400 font-mono tabular-nums">100/100</span><span id="combat-right-name" class="text-white font-semibold truncate">--</span></div>
                                <div class="w-full h-2.5 bg-black/50 rounded-full overflow-hidden relative border border-white/[0.07]">
                                    <div id="combat-right-hp-bar" class="absolute left-0 top-0 bottom-0 bg-emerald-400 w-full transition-all duration-150"></div>
                                </div>
                            </div>
                        </div>

                        <div class="bg-black/50 border border-white/[0.07] rounded-xl p-3 h-36 overflow-y-auto font-mono text-[11px] text-gray-200 space-y-1" id="combat-feed-log">
                            <div class="text-center text-gray-500 py-8 text-xs font-sans">Pick two characters above and start the match.</div>
                        </div>

                        <button type="button" onclick="os.engageScouterCombat()" id="btn-engage-combat" class="w-full py-2.5 os-btn-primary text-xs hover-target cursor-none">
                            Start 1v1 Match
                        </button>
                    </div>

                    <div id="scanner-tab-view-intercepts" class="space-y-3 flex-1 hidden">
                        <div class="border-b border-white/[0.07] pb-2.5 flex justify-between items-center">
                            <div>
                                <h3 class="text-white font-semibold text-sm">Saved Favorites &amp; Recent Lookups</h3>
                                <div class="text-[11px] text-gray-400">Click any entry to load immediately</div>
                            </div>
                        </div>
                        <div class="space-y-2 overflow-y-auto pr-1" id="scanner-intercepts-stream"></div>
                    </div>

                    <div class="border-t border-white/[0.07] pt-2.5 mt-4 text-[11px] text-gray-500 flex justify-between items-center shrink-0">
                        <span id="scouter-last-update-time">Data: PokéAPI v2 · Dragon Ball API · Jikan v4</span>
                        <span class="text-gray-400">Character Dex</span>
                    </div>
                </div>
            </div>
        </div>
    `,

    filemanager: `
        <div class="fm-shell flex flex-col h-full bg-[#07090f] text-xs overflow-hidden relative select-none" id="filemanager-root">
            <div class="os-toolbar">
                <div class="flex items-center gap-1.5 min-w-0 flex-1">
                    <button type="button" onclick="os.fmGoBack()" class="os-btn px-2 py-1.5 hover-target cursor-none" title="Back"><i data-lucide="arrow-left" class="w-3.5 h-3.5"></i></button>
                    <button type="button" onclick="os.fmOpenPath('/Archive')" class="os-btn px-2 py-1.5 hover-target cursor-none" title="Home"><i data-lucide="home" class="w-3.5 h-3.5"></i></button>
                    <div id="fm-breadcrumbs" class="flex items-center gap-1 text-gray-300 overflow-hidden whitespace-nowrap px-1.5"></div>
                </div>
                <div class="flex items-center gap-1.5 flex-wrap">
                    <div class="w-56 relative">
                        <i data-lucide="search" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"></i>
                        <input id="fm-search-input" oninput="os.fmSearch(this.value)" onkeydown="if(event.key==='Enter' && this.value.trim()){os.fmWikiSearch(this.value)}" placeholder="Filter files or Enter for Wiki..." class="w-full os-input pl-8 pr-2.5 py-1.5 text-xs cursor-text">
                    </div>
                    <button type="button" onclick="os.fmPromptNewFile && os.fmPromptNewFile()" class="os-btn hover-target cursor-none" title="Create new text/markdown file"><i data-lucide="file-plus" class="w-3.5 h-3.5 text-sky-300"></i> New File</button>
                    <button type="button" onclick="os.fmPromptNewFolder && os.fmPromptNewFolder()" class="os-btn hover-target cursor-none" title="Create new folder"><i data-lucide="folder-plus" class="w-3.5 h-3.5 text-amber-300"></i> New Folder</button>
                    <button type="button" onclick="window.AetherVFS && AetherVFS.triggerUploadDialog()" class="os-btn hover-target cursor-none text-emerald-300"><i data-lucide="upload" class="w-3.5 h-3.5"></i> Upload</button>
                    <button type="button" onclick="os.fmWikiSearch(document.getElementById('fm-search-input').value)" class="os-btn hover-target cursor-none" title="Import Wikipedia article into Files"><i data-lucide="book-open" class="w-3.5 h-3.5"></i> Import Wiki</button>
                </div>
            </div>

            <div class="h-8 shrink-0 border-b border-white/[0.06] bg-black/35 flex items-center justify-between px-3 relative z-10">
                <div class="flex items-center gap-1 overflow-x-auto no-scrollbar" id="fm-tabs"></div>
                <div class="flex items-center gap-3 text-[11px] text-gray-400 shrink-0">
                    <span id="fm-status-live" class="text-emerald-300 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> IndexedDB Ready</span>
                    <span id="fm-count-label" class="font-mono tabular-nums">0 items</span>
                </div>
            </div>

            <div class="flex-1 min-h-0 grid grid-cols-[200px_minmax(280px,1fr)_320px] relative z-10">
                <aside class="border-r border-white/[0.07] bg-black/30 flex flex-col min-h-0">
                    <div class="p-3 border-b border-white/[0.06]">
                        <div class="text-[10.5px] font-semibold text-gray-400 mb-2">Locations</div>
                        <div id="fm-sidebar" class="space-y-1"></div>
                    </div>
                    <div class="p-3 border-b border-white/[0.06] min-h-0 flex-1 overflow-hidden flex flex-col">
                        <div class="text-[10.5px] font-semibold text-gray-400 mb-2">Folders</div>
                        <div id="fm-tree" class="space-y-1 overflow-y-auto flex-1 pr-1"></div>
                    </div>
                    <div class="p-3 bg-black/20">
                        <div class="text-[10.5px] font-semibold text-gray-400 mb-1.5">Recent</div>
                        <div id="fm-history" class="space-y-1 max-h-24 overflow-y-auto pr-1"></div>
                    </div>
                </aside>

                <main class="flex flex-col min-w-0 min-h-0 bg-[#090c14]/60">
                    <div class="grid grid-cols-[30px_1fr_86px_86px_74px] gap-2 px-3 py-2 border-b border-white/[0.06] text-[10.5px] font-medium text-gray-400 bg-black/25">
                        <span></span><span>Name</span><span>Kind</span><span>Source</span><span>Size</span>
                    </div>
                    <div id="fm-file-list" class="flex-1 overflow-y-auto p-2 space-y-1"></div>
                </main>

                <aside class="border-l border-white/[0.07] bg-black/35 min-h-0 flex flex-col">
                    <div id="fm-preview" class="flex-1 min-h-0 overflow-y-auto select-text"></div>
                    <div class="h-32 border-t border-white/[0.06] bg-black/40 p-3 shrink-0">
                        <div class="text-[10.5px] font-semibold text-gray-400 mb-2">Related Items</div>
                        <div id="fm-recommendations" class="grid grid-cols-2 gap-1.5"></div>
                    </div>
                </aside>
            </div>

            <div id="fm-hover-preview" class="hidden absolute z-40 w-64 p-3 rounded-xl fm-glass pointer-events-none text-xs text-gray-200"></div>
            <div id="fm-quicklook-modal" class="hidden absolute inset-0 z-50 bg-black/75 backdrop-blur-sm items-center justify-center p-6">
                <div class="w-full max-w-2xl max-h-full rounded-2xl fm-glass overflow-hidden shadow-2xl border border-white/10">
                    <div class="h-11 border-b border-white/10 flex items-center justify-between px-4 bg-black/60">
                        <div class="flex items-center gap-2 text-white font-semibold text-xs"><i data-lucide="eye" class="w-4 h-4 text-sky-400"></i><span id="fm-ql-title">Quick Look</span></div>
                        <button type="button" onclick="os.fmCloseQuickLook()" class="text-gray-400 hover:text-white cursor-none hover-target"><i data-lucide="x" class="w-4 h-4"></i></button>
                    </div>
                    <div id="fm-ql-body" class="p-5 overflow-y-auto max-h-[70vh] select-text"></div>
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
                        <span>WikiBoard Canvas</span>
                        <span style="color:#333">|</span>
                        <span>Scroll canvas to zoom · Scroll card to read · Drag to pan · Click minimap to jump</span>
                        <span style="margin-left:auto;" id="wb-status-msg">Ready</span>
                    </div>
                </div>
            `,

    aetherbridge: `
                <div class="h-full flex text-xs text-gray-300 overflow-hidden" style="background:linear-gradient(135deg,rgba(7,9,15,0.98),rgba(10,13,22,0.98));position:relative">
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
                                        <label class="flex items-center gap-2 cursor-none"><input type="checkbox" id="ab-sync-devpad" class="accent-emerald-400"><span class="text-[9px] text-white/50">DevPad &amp; Markdown</span></label>
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
                <div class="h-full flex text-xs text-gray-300 overflow-hidden" style="background:linear-gradient(135deg,rgba(7,9,16,0.98),rgba(11,9,22,0.98));position:relative">
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
