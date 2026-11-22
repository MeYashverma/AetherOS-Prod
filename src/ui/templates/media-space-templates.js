// AetherOS — Window DOM Templates (media-space-templates)
Object.assign(WindowContents, {
    media: `
                <div class="flex flex-col h-full bg-[#050505] relative overflow-hidden" id="media-console-panel"></div>
            `,

    radiobrowser: `
                <div class="grid h-full bg-[#050505] text-xs font-mono relative overflow-hidden rb-deck-shell" id="rb-root" style="grid-template-columns:minmax(320px,42%) minmax(360px,58%);">
                    <!-- LEFT: now playing / GIF / vinyl / visualizer deck -->
                    <section class="relative min-w-0 border-r border-white/10 bg-black/35 p-4 flex flex-col gap-3 overflow-hidden">
                        <div class="flex items-center justify-between shrink-0">
                            <div>
                                <div class="text-[9px] text-os-accent uppercase tracking-[0.22em]">Global Radio Node</div>
                                <div class="text-white font-display text-xl uppercase tracking-widest leading-tight">Now Playing</div>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="w-1.5 h-1.5 rounded-full bg-gray-600" id="rb-live-dot"></span>
                                <span class="text-[8px] text-gray-600" id="rb-live-lbl">STANDBY</span>
                            </div>
                        </div>

                        <div class="rb-gif-stage flex-1 min-h-[190px] max-h-[260px]">
                            <div id="rb-gif-bg" class="${SystemState.settings.radio_gif_enabled === 'off' ? 'hidden' : ''}"></div>
                            <div class="absolute inset-0 z-10 p-3 flex flex-col justify-between pointer-events-none">
                                <div class="flex justify-between items-start">
                                    <span id="rb-gif-badge" class="text-[8px] text-green-300/80 bg-black/45 border border-white/10 rounded-full px-2 py-0.5 max-w-[140px] truncate">GIF AMBIENCE</span>
                                    <button onclick="event.stopPropagation();os.rbToggleSettingsMenu()" id="rb-settings-toggle" class="pointer-events-auto flex items-center gap-1 px-2 py-1 rounded bg-black/45 border border-white/10 text-[8px] text-gray-300 hover:text-white hover:bg-white/10 cursor-none hover-target transition" title="Radio visual settings"><i data-lucide="settings-2" class="w-3 h-3"></i> SET</button>
                                </div>
                                <div class="text-[8px] text-gray-400 bg-black/45 border border-white/10 rounded-lg px-2 py-1 self-start">NEKOS.BEST LIVE MOOD LAYER</div>
                            </div>
                        </div>

                        <div class="flex items-center gap-4 shrink-0">
                            <div class="rb-turntable shrink-0">
                                <div id="rb-vinyl" class="rb-vinyl">
                                    <div class="rb-vinyl-label" id="rb-now-playing-icon"><i data-lucide="radio" class="w-7 h-7 text-green-300/65"></i></div>
                                    <div class="rb-spindle"></div>
                                </div>
                                <div class="rb-tonearm-assembly hover-target" id="rb-tonearm" title="Enable Tonearm Edit in settings to drag/rotate">
                                    <div class="rb-tonearm-pivot"></div>
                                    <svg class="rb-tonearm-svg" viewBox="0 0 196 178" aria-hidden="true">
                                        <defs><linearGradient id="rbArmGrad" x1="0" x2="1"><stop offset="0" stop-color="rgba(255,255,255,.82)"/><stop offset="1" stop-color="rgba(255,255,255,.24)"/></linearGradient></defs>
                                        <path class="arm-shadow" d="M160 34 C145 42 129 57 105 77"/>
                                        <path class="arm-main" d="M160 34 C145 42 129 57 105 77"/>
                                        <polygon class="headshell" points="96,73 110,78 104,91 91,85"/>
                                        <line class="stylus" x1="96" y1="86" x2="91" y2="97"/>
                                    </svg>
                                </div>
                            </div>
                            <div class="min-w-0 flex-1 space-y-3">
                                <div>
                                    <div id="rb-now-playing-name" class="text-white font-bold text-[15px] truncate uppercase tracking-wide">NO STATION SELECTED</div>
                                    <div id="rb-now-playing-tags" class="text-[9px] text-gray-500 truncate uppercase tracking-wider mt-1">Select a station from the browser deck</div>
                                    <div class="flex flex-wrap items-center gap-1.5 mt-1"><span id="rb-bitrate-lbl" class="text-[8px] text-os-accent"></span><span id="rb-viz-mode-lbl" class="text-[8px] text-gray-600">ANALYSER: STANDBY</span><button onclick="os.rbToggleSettingsMenu()" class="rb-viz-mode-btn hover-target cursor-none" title="Visualizer/GIF settings">CUSTOMIZE</button></div>
                                </div>
                                <div class="relative">
                                    <canvas id="rb-visualizer-canvas" width="420" height="90"></canvas>
                                    <div id="rb-settings-menu" class="rb-settings-pop hidden">
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
                </div>
                <div class="rb-settings-title">Color Source</div>
                                        <div class="rb-settings-grid mb-2">
                                            <button onclick="os.rbSetVizColor('palette')" data-rb-viz-color="palette" class="rb-setting-btn active hover-target">IMG/GIF</button>
                                            <button onclick="os.rbSetVizColor('neon')" data-rb-viz-color="neon" class="rb-setting-btn hover-target">Neon</button>
                                            <button onclick="os.rbSetVizColor('matrix')" data-rb-viz-color="matrix" class="rb-setting-btn hover-target">Matrix</button>
                                            <button onclick="os.rbSetVizColor('mono')" data-rb-viz-color="mono" class="rb-setting-btn hover-target">Mono</button>
                                        </div>
                                        <div class="rb-settings-title">Ambience</div>
                                        <button onclick="os.rbToggleGif()" id="rb-gif-toggle" data-rb-gif-toggle="1" class="rb-setting-btn hover-target w-full ${SystemState.settings.radio_gif_enabled === 'off' ? '' : 'active'}">GIF Mood Layer</button>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <i data-lucide="volume-2" class="w-3.5 h-3.5 text-os-accent"></i>
                                    <input id="rb-volume-slider" type="range" min="0" max="1" step="0.01" value="${SystemState.settings.media_tuner_volume || 0.7}" oninput="os.rbAdjustVolume(this.value)" class="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-none hover-target">
                                    <span id="rb-volume-readout" class="text-[9px] text-white w-8 text-right">${Math.round((SystemState.settings.media_tuner_volume || 0.7) * 100)}%</span>
                                </div>
                                <div class="flex gap-2">
                                    <button onclick="os.rbToggleFavNowPlaying()" id="rb-fav-now-btn" class="flex-1 py-2 rounded bg-white/5 hover:bg-yellow-500/15 text-gray-400 hover:text-yellow-300 border border-white/10 transition cursor-none hover-target">☆ Favorite</button>
                                    <button onclick="os.stopRadioBrowser()" class="px-4 py-2 rounded bg-red-500/15 text-red-300 border border-red-500/20 hover:bg-red-500/25 transition cursor-none hover-target flex items-center gap-2"><i data-lucide="square" class="w-3.5 h-3.5 fill-current"></i> Stop</button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- RIGHT: station discovery / search / favorites / trending -->
                    <section class="relative min-w-0 flex flex-col bg-black/20 overflow-hidden">
                        <div class="flex items-center gap-1 border-b border-white/5 bg-black/45 shrink-0 p-2">
                            <button onclick="os.rbSwitchTab('search')" id="rb-tab-search" class="rb-tab-btn px-3 py-2 rounded-lg border border-transparent text-[10px] uppercase tracking-wider text-white hover-target cursor-none transition">Search</button>
                            <button onclick="os.rbSwitchTab('favorites')" id="rb-tab-favs" class="rb-tab-btn px-3 py-2 rounded-lg border border-transparent text-[10px] uppercase tracking-wider text-gray-500 hover:text-white hover-target cursor-none transition">★ Favorites</button>
                            <button onclick="os.rbSwitchTab('trending')" id="rb-tab-trend" class="rb-tab-btn px-3 py-2 rounded-lg border border-transparent text-[10px] uppercase tracking-wider text-gray-500 hover:text-white hover-target cursor-none transition">Trending</button>
                            <button onclick="os.searchRadioBrowser('')" class="ml-auto px-2 py-1.5 rounded bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 cursor-none hover-target" title="Refresh"><i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i></button>
                        </div>
                        <div id="rb-search-bar" class="p-3 border-b border-white/5 flex gap-2 items-center bg-black/20 shrink-0">
                            <div class="flex-1 relative">
                                <i data-lucide="search" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500"></i>
                                <input type="text" id="rb-search-input" class="w-full bg-os-900 border border-white/10 rounded-lg py-2 pl-8 pr-3 text-white focus:outline-none focus:border-white/30 cursor-none hover-target text-[11px]" placeholder="Search global stations..." onkeydown="if(event.key === 'Enter') os.searchRadioBrowser(this.value)">
                            </div>
                            <select id="rb-genre-select" class="bg-os-900 border border-white/10 rounded-lg py-2 px-2 text-gray-300 text-[10px] outline-none cursor-none hover-target">
                                <option value="">All Genres</option>
                                <option value="pop">Pop</option><option value="rock">Rock</option><option value="jazz">Jazz</option>
                                <option value="classical">Classical</option><option value="electronic">Electronic</option>
                                <option value="hip-hop">Hip Hop</option><option value="lofi">Lo-Fi</option><option value="anime">Anime</option>
                                <option value="news">News</option><option value="talk">Talk</option>
                            </select>
                            <button onclick="os.searchRadioBrowser(document.getElementById('rb-search-input').value)" class="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white cursor-none hover-target transition-colors">Scan</button>
                        </div>
                        <div class="flex-1 overflow-y-auto p-3 space-y-1.5" id="rb-results">
                            <div class="p-6 text-center text-gray-500">Initializing global radio indices...</div>
                        </div>
                    </section>
                </div>
            `,

    ytchtv: `
                <div class="flex flex-col h-full bg-[#030304] overflow-hidden font-mono text-xs" id="ytchtv-root">
                    <div class="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-black/60 shrink-0">
                        <div class="flex items-center gap-2">
                            <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            <span class="text-gray-400">YTCH.TV CATHODE TRANSMISSION</span>
                            <span class="text-gray-600">·</span>
                            <span class="text-gray-500" id="ytch-mode-lbl">DIRECT</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="os.ytchSwitchSource('direct')" id="ytch-btn-direct"
                                class="px-2 py-0.5 bg-white/20 border border-white/15 rounded text-[9px] text-white hover:bg-white/15 transition cursor-none hover-target animate-pulse">
                                YTCH.TV DIRECT
                            </button>
                            <button onclick="os.ytchSwitchSource('proxy')" id="ytch-btn-proxy"
                                class="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-gray-400 hover:text-white hover:bg-white/10 transition cursor-none hover-target">
                                YTCH.XYZ MIRROR
                            </button>
                            <button onclick="os.ytchSwitchSource('embed')" id="ytch-btn-embed"
                                class="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-gray-400 hover:text-white hover:bg-white/10 transition cursor-none hover-target">
                                RETRO INTERFACE
                            </button>
                        </div>
                    </div>

                    <div class="flex-1 relative bg-black flex overflow-hidden">
                        <div class="flex-1 h-full relative" id="ytchtv-screen-container">
                            <div id="ytchtv-static" class="absolute inset-0 pointer-events-none z-20 bg-cover bg-center opacity-0 transition-opacity duration-300 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI24pIiBvcGFjaXR5PSIwLjE1Ii8+PC9zdmc+')]"></div>
                            <div class="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(to_bottom,rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]"></div>

                            <iframe id="ytchtv-iframe" 
                                class="w-full h-full border-0 absolute inset-0 z-0" 
                                src="https://ytch.tv" 
                                allow="autoplay; encrypted-media; picture-in-picture" 
                                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
                                referrerpolicy="no-referrer"></iframe>

                            <div id="ytchtv-custom-embed" class="absolute inset-0 z-0 hidden bg-[#050505] flex flex-col justify-between">
                                <div class="flex-1 relative flex items-center justify-center bg-black">
                                    <iframe id="ytchtv-custom-youtube-player"
                                        class="w-full h-full border-0"
                                        src=""
                                        allow="autoplay; encrypted-media; picture-in-picture"
                                        sandbox="allow-scripts allow-same-origin allow-forms"></iframe>
                                </div>
                                <div class="bg-os-900 border-t border-white/5 p-3 flex justify-between items-center text-[10px] shrink-0">
                                    <div class="flex items-center gap-2">
                                        <span class="text-green-500 font-bold" id="ytchtv-custom-chan-num">CH 01</span>
                                        <span class="text-gray-400" id="ytchtv-custom-chan-name">Science & Tech</span>
                                    </div>
                                    <div class="flex items-center gap-1.5" id="ytchtv-custom-video-info">
                                        <span class="text-gray-600">VIDEO_ID:</span>
                                        <span class="text-white font-mono" id="ytchtv-custom-video-id">--</span>
                                        <button onclick="os.ytchtvCopyVideoId()" class="p-1 hover:text-white text-gray-500 transition cursor-none hover-target">
                                            <i data-lucide="copy" class="w-3 h-3"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="w-48 bg-[#0b0b0d] border-l border-white/5 p-3 flex flex-col justify-between shrink-0 font-mono text-[10px]">
                            <div class="space-y-4">
                                <div class="text-[9px] text-os-accent tracking-widest uppercase">CONTROL PANEL</div>
                                
                                <div class="bg-black/40 border border-white/5 rounded-lg p-2.5 flex flex-col items-center">
                                    <div class="text-center font-bold text-white uppercase text-[9px] mb-2">Tuning Dial</div>
                                    <div class="w-20 h-20 rounded-full border border-white/10 relative bg-gradient-to-br from-os-700 to-black flex items-center justify-center shadow-lg" id="ytchtv-rotary-dial">
                                        <div class="absolute w-1 h-8 bg-white/60 top-1 left-1/2 -translate-x-1/2 rounded origin-bottom transition-transform duration-300" id="ytchtv-dial-hand" style="transform: rotate(0deg); transform-origin: 50% 100%;"></div>
                                        <div class="w-6 h-6 rounded-full bg-os-600 border border-white/10 flex items-center justify-center z-10">
                                            <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
                                        </div>
                                    </div>
                                    <div class="mt-3 flex gap-2 justify-center w-full">
                                        <button onclick="os.ytchtvPrevChannel()" class="px-2 py-1 bg-white/5 border border-white/10 rounded text-gray-300 hover:text-white hover:bg-white/10 transition cursor-none hover-target text-[9px] flex-1">PREV</button>
                                        <button onclick="os.ytchtvNextChannel()" class="px-2 py-1 bg-white/5 border border-white/10 rounded text-gray-300 hover:text-white hover:bg-white/10 transition cursor-none hover-target text-[9px] flex-1">NEXT</button>
                                    </div>
                                </div>

                                <div class="bg-black/30 border border-white/5 rounded-lg p-2 max-h-[190px] overflow-y-auto no-scrollbar space-y-1">
                                    <div class="text-[8px] text-os-accent tracking-wider uppercase mb-1.5 px-1 font-bold">Sub-channels</div>
                                    <div id="ytchtv-channels-list" class="space-y-0.5"></div>
                                </div>
                            </div>

                            <div class="space-y-2 border-t border-white/5 pt-3">
                                <div class="text-[8px] text-os-accent uppercase">DIAGNOSTICS</div>
                                <div class="space-y-1 text-[9px] text-gray-500">
                                    <div class="flex justify-between"><span>TUBE SIG:</span><span class="text-green-500 font-bold" id="ytch-sig-lbl">LOCKED_OK</span></div>
                                    <div class="flex justify-between"><span>FREQ MODE:</span><span class="text-white" id="ytch-mode-lbl-sub">DIRECT</span></div>
                                    <div class="flex justify-between"><span>CH SELECT:</span><span class="text-white font-bold" id="ytch-active-ch-lbl">CH 01</span></div>
                                </div>
                                <button onclick="os.ytchtvTriggerStatic()" class="w-full py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-center text-white font-semibold uppercase tracking-wider transition cursor-none hover-target text-[9px] mt-1">
                                    Degauss Tube
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `,

    anime: `
                <div class="flex h-full bg-[#050509] text-xs font-mono overflow-hidden" id="anime-root">
                    <div class="w-[38%] min-w-[300px] border-r border-white/5 flex flex-col bg-black/25">
                        <div class="p-3 border-b border-white/5 bg-black/45 flex gap-2 flex-shrink-0">
                            <input id="anime-search" class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none text-white cursor-text" placeholder="Search anime..." onkeydown="if(event.key==='Enter') os.animeSearch()">
                            <button onclick="os.animeSearch()" class="px-3 py-2 bg-white/10 rounded-lg cursor-none hover-target">Search</button>
                        </div>
                        <div class="px-3 py-2 border-b border-white/5 flex gap-2 text-[9px] uppercase tracking-widest"><button onclick="os.animeTrending()" class="px-2 py-1 rounded bg-pink-500/15 border border-pink-500/20 text-pink-200 cursor-none hover-target">Trending</button><button onclick="os.animeSeasonal()" class="px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-300 cursor-none hover-target">Seasonal</button><button onclick="os.animeRecommendations()" class="px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-300 cursor-none hover-target">Recs</button></div>
                        <div id="anime-results" class="flex-1 overflow-y-auto p-3 space-y-2"></div>
                    </div>
                    <div class="flex-1 min-w-0 flex flex-col relative">
                        <div id="anime-detail" class="flex-1 overflow-y-auto"><div class="h-full flex items-center justify-center text-center text-gray-500"><div><div class="text-5xl mb-3">✨</div><div class="text-white font-display uppercase tracking-widest">Anime Discovery Console</div><div class="mt-2">Select a title to view trailer, episodes, streaming links, characters and full metadata.</div></div></div></div>
                    </div>
                </div>
            `,

    manga: `
                <div class="flex h-full bg-[#060605] text-xs font-mono overflow-hidden" id="manga-root">
                    <div class="w-[34%] min-w-[300px] border-r border-white/5 flex flex-col bg-black/25">
                        <div class="p-3 border-b border-white/5 bg-black/45 flex gap-2 flex-shrink-0">
                            <input id="manga-search" class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none text-white cursor-text" placeholder="Search manga / MangaDex..." onkeydown="if(event.key==='Enter') os.mangaSearch()">
                            <button onclick="os.mangaSearch()" class="px-3 py-2 bg-white/10 rounded-lg cursor-none hover-target">Search</button>
                        </div>
                        <div class="px-3 py-2 border-b border-white/5 flex gap-2 text-[9px] uppercase tracking-widest"><button onclick="os.mangaTrending()" class="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-500/20 text-emerald-200 cursor-none hover-target">Top</button><button onclick="os.mangaRenderList()" class="px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-300 cursor-none hover-target">Reading List</button></div>
                        <div id="manga-results" class="flex-1 overflow-y-auto p-3 space-y-2"></div>
                    </div>
                    <div class="flex-1 min-w-0 flex flex-col">
                        <div id="manga-detail" class="flex-1 overflow-y-auto"><div class="h-full flex items-center justify-center text-center text-gray-500"><div><div class="text-5xl mb-3">📖</div><div class="text-white font-display uppercase tracking-widest">Manga Launcher</div><div class="mt-2">Search titles, inspect metadata, resolve MangaDex chapters, and read legal scanlation pages when available.</div></div></div></div>
                    </div>
                </div>
            `,

    memes: `
                <div class="flex flex-col h-full bg-[#050505] text-xs font-mono relative">
                    <div class="h-10 border-b border-white/5 bg-black/40 flex justify-between items-center px-4 shrink-0 z-10 shadow-os-recessed">
                        <div class="flex gap-2 overflow-x-auto no-scrollbar max-w-[70%]" id="memes-source-buttons">
                            <!-- Injected dynamically via JS -->
                        </div>
                        <div class="flex items-center gap-3 shrink-0">
                            <span class="text-[9px] text-os-accent tracking-widest uppercase hidden sm:inline">AUTO-SYNC: 60s</span>
                            <button onclick="os.fetchMemes()" id="btn-meme-refresh" class="flex items-center gap-1 text-gray-500 hover:text-white transition-colors cursor-none hover-target p-1 rounded">
                                <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                            </button>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto p-4 relative bg-[#08080a]" id="memes-scroll-area">
                        <!-- Masonry grid -->
                        <div class="columns-2 gap-4 space-y-4" id="memes-container">
                            <div class="col-span-2 text-center text-yellow-500 py-10 animate-pulse tracking-widest uppercase text-[10px]">DECRYPTING MEMETIC PAYLOADS...</div>
                        </div>
                    </div>
                </div>
            `,

    games: `
                <div class="flex flex-col h-full bg-[#060608] font-mono text-xs" id="games-root">
                    <div class="h-9 border-b border-white/5 px-4 flex items-center justify-between flex-shrink-0">
                        <span class="text-os-accent uppercase tracking-widest text-[10px] flex items-center gap-2"><i data-lucide="gamepad-2" class="w-3 h-3"></i> Game Vault</span>
                        <span class="text-[9px] text-gray-600">Powered by Internet Archive & Open-Source Engines</span>
                    </div>
                    <div class="flex flex-col h-full overflow-hidden">
                        <div id="games-library" class="flex-1 overflow-y-auto p-3 grid grid-cols-3 gap-3 content-start"></div>
                        <div id="games-frame-container" class="hidden flex-1 flex-col relative">
                            <div class="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-black/50 flex-shrink-0">
                                <button onclick="os.gamesBack()" class="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-white text-[10px] cursor-none hover-target transition">← Back</button>
                                <span id="games-frame-title" class="text-white font-bold text-[11px] flex-1 truncate"></span>
                                <button onclick="os.gamesFullscreen()" class="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-gray-400 text-[10px] cursor-none hover-target transition">⛶ Fullscreen</button>
                            </div>
                            <iframe id="games-iframe" class="flex-1 w-full border-0 bg-black" allowfullscreen sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups"></iframe>
                        </div>
                    </div>
                </div>
            `,

    weather: `
                <div class="flex flex-col h-full relative overflow-hidden" id="weather-root">
                    <div id="weather-bg-gif" class="absolute inset-0 z-0 bg-cover bg-center opacity-20 transition-all duration-1000"></div>
                    <div class="absolute inset-0 z-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80"></div>
                    <div class="relative z-10 flex flex-col h-full p-4 font-mono overflow-y-auto" id="weather-content">
                        <div class="text-white/40 text-xs animate-pulse text-center mt-20">Acquiring atmospheric telemetry...</div>
                    </div>
                </div>
            `,

    nasa: `
                <div class="flex flex-col h-full bg-[#020208] text-xs font-mono relative overflow-hidden" id="nasa-root">
                    <div class="h-9 border-b border-white/5 px-4 flex justify-between items-center text-[10px] text-os-accent uppercase flex-shrink-0">
                        <span class="flex items-center gap-2"><i data-lucide="telescope" class="w-3 h-3"></i> NASA Uplink</span>
                        <span class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> LIVE</span>
                    </div>
                    <div class="flex gap-2 px-3 pt-2 pb-1 border-b border-white/5 flex-shrink-0">
                        <button onclick="os.nasaLoadAPOD()" class="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white cursor-none hover-target transition text-[10px] uppercase tracking-wider">APOD</button>
                        <button onclick="os.nasaLoadEPIC()" class="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white cursor-none hover-target transition text-[10px] uppercase tracking-wider">Earth EPIC</button>
                        <button onclick="os.nasaLoadMars()" class="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white cursor-none hover-target transition text-[10px] uppercase tracking-wider">Mars Rover</button>
                        <button onclick="os.nasaLoadDONKI()" class="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white cursor-none hover-target transition text-[10px] uppercase tracking-wider">Solar Events</button>
                    </div>
                    <div class="flex-1 overflow-y-auto p-3 space-y-3" id="nasa-content">
                        <div class="text-center text-gray-500 mt-10 animate-pulse">SELECT A DEEP SPACE FEED...</div>
                    </div>
                </div>
            `,

    iss: `
                <div class="flex flex-col h-full bg-black text-xs font-mono overflow-hidden" id="iss-root">
                    <div class="h-10 border-b border-white/[0.08] px-4 flex items-center justify-between flex-shrink-0 bg-black/85 backdrop-blur z-10">
                        <span class="text-white/70 uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
                            <i data-lucide="satellite" class="w-3 h-3 text-white/50"></i> ISS Orbital Tracker
                        </span>
                        <button onclick="os.initISS(true)" class="px-3 py-1 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] rounded text-white/70 hover:text-white text-[10px] transition">Refresh</button>
                    </div>
                    <div id="iss-content" class="flex-1 overflow-hidden relative bg-black">
                        <div class="absolute inset-0 flex items-center justify-center text-white/20 text-xs uppercase tracking-[0.3em] z-0" id="iss-loading">INITIALIZING ORBITAL TRACKING...</div>
                    </div>
                </div>
            `
});
