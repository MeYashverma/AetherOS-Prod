// AetherOS — Window DOM Templates (media-space-templates)
Object.assign(WindowContents, {
    media: `
        <div class="flex flex-col h-full bg-[#07090f] relative overflow-hidden" id="media-console-panel"></div>
    `,

    radiobrowser: `
        <div class="grid h-full bg-[#07090f] text-xs relative overflow-hidden rb-deck-shell select-none" id="rb-root" style="grid-template-columns:minmax(310px,41%) minmax(360px,59%);">
            <!-- LEFT: Now Playing / Turntable / Visualizer -->
            <section class="relative min-w-0 border-r border-white/[0.08] bg-black/35 p-4 flex flex-col gap-3 overflow-hidden">
                <div class="flex items-center justify-between shrink-0">
                    <div>
                        <div class="text-[10.5px] text-sky-300 font-semibold">World Radio</div>
                        <div class="text-white font-display font-bold text-lg leading-tight">Now Playing</div>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-gray-600" id="rb-live-dot"></span>
                        <span class="text-[11px] text-gray-400 font-medium" id="rb-live-lbl">Idle</span>
                    </div>
                </div>

                <div class="rb-gif-stage flex-1 min-h-[175px] max-h-[245px] rounded-xl overflow-hidden border border-white/[0.08]">
                    <div id="rb-gif-bg" class="${SystemState.settings.radio_gif_enabled === 'off' ? 'hidden' : ''}"></div>
                    <div class="absolute inset-0 z-10 p-2.5 flex flex-col justify-between pointer-events-none">
                        <div class="flex justify-between items-start">
                            <span id="rb-gif-badge" class="text-[10px] text-emerald-300 bg-black/55 backdrop-blur-md border border-white/10 rounded-full px-2.5 py-0.5 max-w-[160px] truncate">Ambient Backdrop</span>
                            <button type="button" onclick="event.stopPropagation();os.rbToggleSettingsMenu()" id="rb-settings-toggle" class="pointer-events-auto os-btn px-2 py-1 text-[10.5px] cursor-none hover-target" title="Visualizer & Backdrop Settings"><i data-lucide="sliders-horizontal" class="w-3 h-3"></i> Visuals</button>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-4 shrink-0">
                    <div class="rb-turntable shrink-0">
                        <div id="rb-vinyl" class="rb-vinyl">
                            <div class="rb-vinyl-label" id="rb-now-playing-icon"><i data-lucide="radio" class="w-7 h-7 text-sky-300/75"></i></div>
                            <div class="rb-spindle"></div>
                        </div>
                        <div class="rb-tonearm-assembly hover-target" id="rb-tonearm">
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

                    <div class="min-w-0 flex-1 space-y-2.5">
                        <div>
                            <div id="rb-now-playing-name" class="text-white font-semibold text-sm truncate">Select a station</div>
                            <div id="rb-now-playing-tags" class="text-[11px] text-gray-400 truncate mt-0.5">30,000+ community streams worldwide</div>
                            <div class="flex flex-wrap items-center gap-1.5 mt-1">
                                <span id="rb-bitrate-lbl" class="text-[10.5px] font-mono text-sky-300"></span>
                                <span id="rb-viz-mode-lbl" class="text-[10.5px] text-gray-500">Spectrum Ready</span>
                            </div>
                        </div>

                        <div class="relative">
                            <canvas id="rb-visualizer-canvas" width="420" height="84" class="rounded-lg"></canvas>
                            <div id="rb-settings-menu" class="rb-settings-pop hidden">
                                <div class="rb-settings-title">Visualizer Style</div>
                                <div class="rb-settings-grid mb-2">
                                    <button type="button" onclick="os.rbSetVizLook('apple')" data-rb-viz-look="apple" class="rb-setting-btn hover-target">Wave</button>
                                    <button type="button" onclick="os.rbSetVizLook('nts')" data-rb-viz-look="nts" class="rb-setting-btn hover-target">Bars</button>
                                    <button type="button" onclick="os.rbSetVizLook('vinylring')" data-rb-viz-look="vinylring" class="rb-setting-btn hover-target">Ring</button>
                                    <button type="button" onclick="os.rbSetVizLook('broadcast')" data-rb-viz-look="broadcast" class="rb-setting-btn hover-target">Broadcast</button>
                                    <button type="button" onclick="os.rbSetVizLook('particles')" data-rb-viz-look="particles" class="rb-setting-btn hover-target">Particles</button>
                                    <button type="button" onclick="os.rbSetVizLook('circular')" data-rb-viz-look="circular" class="rb-setting-btn hover-target">Circular</button>
                                    <button type="button" onclick="os.rbSetVizLook('horizon')" data-rb-viz-look="horizon" class="rb-setting-btn hover-target">Horizon</button>
                                    <button type="button" onclick="os.rbSetVizLook('vu')" data-rb-viz-look="vu" class="rb-setting-btn hover-target">VU Meter</button>
                                    <button type="button" onclick="os.rbSetVizLook('thin')" data-rb-viz-look="thin" class="rb-setting-btn hover-target">Minimal</button>
                                    <button type="button" onclick="os.rbSetVizLook('glass')" data-rb-viz-look="glass" class="rb-setting-btn hover-target">Liquid</button>
                                </div>
                                <div class="rb-settings-title">Color Theme</div>
                                <div class="rb-settings-grid mb-2">
                                    <button type="button" onclick="os.rbSetVizColor('palette')" data-rb-viz-color="palette" class="rb-setting-btn active hover-target">Dynamic</button>
                                    <button type="button" onclick="os.rbSetVizColor('neon')" data-rb-viz-color="neon" class="rb-setting-btn hover-target">Cyan</button>
                                    <button type="button" onclick="os.rbSetVizColor('matrix')" data-rb-viz-color="matrix" class="rb-setting-btn hover-target">Emerald</button>
                                    <button type="button" onclick="os.rbSetVizColor('mono')" data-rb-viz-color="mono" class="rb-setting-btn hover-target">Clean White</button>
                                </div>
                                <div class="rb-settings-title">Backdrop</div>
                                <button type="button" onclick="os.rbToggleGif()" id="rb-gif-toggle" data-rb-gif-toggle="1" class="rb-setting-btn hover-target w-full ${SystemState.settings.radio_gif_enabled === 'off' ? '' : 'active'}">Animated Backdrop</button>
                            </div>
                        </div>

                        <div class="flex items-center gap-2">
                            <i data-lucide="volume-2" class="w-3.5 h-3.5 text-gray-400"></i>
                            <input id="rb-volume-slider" type="range" min="0" max="1" step="0.01" value="${SystemState.settings.media_tuner_volume || 0.7}" oninput="os.rbAdjustVolume(this.value)" class="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-none hover-target">
                            <span id="rb-volume-readout" class="text-[11px] font-mono text-gray-300 w-9 text-right tabular-nums">${Math.round((SystemState.settings.media_tuner_volume || 0.7) * 100)}%</span>
                        </div>

                        <div class="flex gap-2">
                            <button type="button" onclick="os.rbToggleFavNowPlaying()" id="rb-fav-now-btn" class="flex-1 os-btn justify-center py-1.5 hover-target cursor-none">☆ Favorite</button>
                            <button type="button" onclick="os.stopRadioBrowser()" class="os-btn text-rose-300 px-3.5 py-1.5 hover-target cursor-none"><i data-lucide="square" class="w-3 h-3 fill-current"></i> Stop</button>
                        </div>
                    </div>
                </div>
            </section>

            <!-- RIGHT: Station Directory -->
            <section class="relative min-w-0 flex flex-col bg-black/20 overflow-hidden">
                <div class="os-toolbar">
                    <div class="os-segmented">
                        <button type="button" onclick="os.rbSwitchTab('search')" id="rb-tab-search" class="os-seg-btn active hover-target cursor-none">Browse</button>
                        <button type="button" onclick="os.rbSwitchTab('trending')" id="rb-tab-trend" class="os-seg-btn hover-target cursor-none">Top Voted</button>
                        <button type="button" onclick="os.rbSwitchTab('favorites')" id="rb-tab-favs" class="os-seg-btn hover-target cursor-none">★ Saved</button>
                    </div>
                    <button type="button" onclick="os.searchRadioBrowser(document.getElementById('rb-search-input')?.value || '')" class="os-btn hover-target cursor-none" title="Refresh stations"><i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i></button>
                </div>

                <div id="rb-search-bar" class="p-2.5 border-b border-white/[0.06] flex gap-1.5 items-center bg-black/25 shrink-0 flex-wrap">
                    <div class="flex-1 min-w-[140px] relative">
                        <i data-lucide="search" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"></i>
                        <input type="text" id="rb-search-input" class="w-full os-input py-1.5 pl-8 pr-2.5 text-xs cursor-text" placeholder="Search station or city..." onkeydown="if(event.key === 'Enter') os.searchRadioBrowser(this.value)">
                    </div>
                    <select id="rb-genre-select" onchange="os.searchRadioBrowser(document.getElementById('rb-search-input')?.value || '')" class="os-input py-1.5 px-2 text-xs cursor-none hover-target">
                        <option value="">All Genres</option>
                        <option value="lofi">Lo-Fi</option>
                        <option value="jazz">Jazz</option>
                        <option value="electronic">Electronic</option>
                        <option value="ambient">Ambient</option>
                        <option value="rock">Rock</option>
                        <option value="pop">Pop</option>
                        <option value="classical">Classical</option>
                        <option value="synthwave">Synthwave</option>
                        <option value="news">News</option>
                    </select>
                    <select id="rb-country-select" onchange="os.searchRadioBrowser(document.getElementById('rb-search-input')?.value || '')" class="os-input py-1.5 px-2 text-xs cursor-none hover-target">
                        <option value="">All Countries</option>
                        <option value="US">USA</option>
                        <option value="GB">UK</option>
                        <option value="JP">Japan</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                        <option value="IN">India</option>
                        <option value="CA">Canada</option>
                        <option value="BR">Brazil</option>
                    </select>
                    <button type="button" onclick="os.searchRadioBrowser(document.getElementById('rb-search-input').value)" class="os-btn-primary px-3 py-1.5 text-xs cursor-none hover-target">Search</button>
                </div>

                <div class="flex-1 overflow-y-auto p-2.5 space-y-1.5" id="rb-results">
                    <div class="p-6 text-center text-gray-400 text-xs">Loading world radio directory...</div>
                </div>
            </section>
        </div>
    `,

    ytchtv: `
        <div class="flex flex-col h-full bg-[#06080e] overflow-hidden text-xs select-none" id="ytchtv-root">
            <div class="os-toolbar">
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span class="text-white font-semibold">Retro TV</span>
                    <span class="text-gray-500">·</span>
                    <span class="text-gray-400" id="ytch-mode-lbl">Curated Channels</span>
                </div>
                <div class="os-segmented">
                    <button type="button" onclick="os.ytchSwitchSource('embed')" id="ytch-btn-embed" class="os-seg-btn active hover-target cursor-none">Curated Channels</button>
                    <button type="button" onclick="os.ytchSwitchSource('direct')" id="ytch-btn-direct" class="os-seg-btn hover-target cursor-none">YTCH.TV</button>
                    <button type="button" onclick="os.ytchSwitchSource('proxy')" id="ytch-btn-proxy" class="os-seg-btn hover-target cursor-none">YTCH Mirror</button>
                </div>
            </div>

            <div class="flex-1 relative bg-black flex overflow-hidden min-h-0">
                <div class="flex-1 h-full relative" id="ytchtv-screen-container">
                    <div id="ytchtv-static" class="absolute inset-0 pointer-events-none z-20 bg-cover bg-center opacity-0 transition-opacity duration-200 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI24pIiBvcGFjaXR5PSIwLjE1Ii8+PC9zdmc+')]"></div>

                    <iframe id="ytchtv-iframe"
                        class="w-full h-full border-0 absolute inset-0 z-0 hidden"
                        src="about:blank"
                        allow="autoplay; encrypted-media; picture-in-picture"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
                        referrerpolicy="no-referrer"></iframe>

                    <div id="ytchtv-custom-embed" class="absolute inset-0 z-0 bg-[#05060a] flex flex-col justify-between">
                        <div class="flex-1 relative flex items-center justify-center bg-black">
                            <iframe id="ytchtv-custom-youtube-player"
                                class="w-full h-full border-0"
                                src=""
                                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"></iframe>
                        </div>
                        <div class="bg-[#090c14] border-t border-white/[0.08] px-3.5 py-2 flex justify-between items-center gap-3 text-xs shrink-0 flex-wrap">
                            <div class="flex items-center gap-2">
                                <span class="os-badge text-emerald-300 font-mono" id="ytchtv-custom-chan-num">CH 01</span>
                                <span class="text-white font-medium" id="ytchtv-custom-chan-name">Lofi Hip Hop Radio</span>
                            </div>
                            <div class="flex items-center gap-1.5 flex-1 max-w-xs">
                                <input id="ytchtv-custom-url-input" type="text" placeholder="Paste YouTube URL or Video ID..."
                                    class="flex-1 os-input py-1 px-2.5 text-[11px] font-mono cursor-text"
                                    onkeydown="if(event.key==='Enter') os.ytchtvPlayCustomUrl && os.ytchtvPlayCustomUrl(this.value)">
                                <button type="button" onclick="os.ytchtvPlayCustomUrl && os.ytchtvPlayCustomUrl(document.getElementById('ytchtv-custom-url-input').value)" class="os-btn hover-target cursor-none">Tune</button>
                            </div>
                            <div class="flex items-center gap-1.5" id="ytchtv-custom-video-info">
                                <span class="text-gray-500 text-[11px]">ID:</span>
                                <span class="text-gray-300 font-mono text-[11px]" id="ytchtv-custom-video-id">--</span>
                                <button type="button" onclick="os.ytchtvCopyVideoId()" class="p-1 hover:text-white text-gray-400 transition cursor-none hover-target" title="Copy YouTube link">
                                    <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="w-52 bg-[#080b12] border-l border-white/[0.08] p-3 flex flex-col justify-between shrink-0 text-xs">
                    <div class="space-y-3 min-h-0 flex-1 flex flex-col">
                        <div class="os-card p-3 flex flex-col items-center shrink-0">
                            <div class="text-[11px] font-semibold text-gray-300 mb-2">Channel Dial</div>
                            <div class="w-16 h-16 rounded-full border border-white/15 relative bg-gradient-to-br from-slate-800 to-black flex items-center justify-center shadow-inner" id="ytchtv-rotary-dial">
                                <div class="absolute w-1 h-6 bg-sky-400 top-1.5 left-1/2 -translate-x-1/2 rounded origin-bottom transition-transform duration-300" id="ytchtv-dial-hand" style="transform: rotate(0deg); transform-origin: 50% 100%;"></div>
                                <div class="w-5 h-5 rounded-full bg-slate-700 border border-white/15 flex items-center justify-center z-10">
                                    <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
                                </div>
                            </div>
                            <div class="mt-2.5 flex gap-1.5 justify-center w-full">
                                <button type="button" onclick="os.ytchtvPrevChannel()" class="os-btn flex-1 justify-center hover-target cursor-none">◀ Prev</button>
                                <button type="button" onclick="os.ytchtvNextChannel()" class="os-btn flex-1 justify-center hover-target cursor-none">Next ▶</button>
                            </div>
                        </div>

                        <div class="os-card p-2 flex-1 min-h-0 flex flex-col overflow-hidden">
                            <div class="text-[10.5px] text-gray-400 font-semibold mb-1.5 px-1">Live Channels</div>
                            <div id="ytchtv-channels-list" class="space-y-0.5 overflow-y-auto flex-1 pr-0.5"></div>
                        </div>
                    </div>

                    <div class="space-y-1.5 border-t border-white/[0.07] pt-2.5 mt-2.5 text-[11px] text-gray-400 shrink-0">
                        <div class="flex justify-between"><span>Source</span><span class="text-white font-medium" id="ytch-mode-lbl-sub">YouTube</span></div>
                        <div class="flex justify-between"><span>Channel</span><span class="text-emerald-300 font-mono font-semibold" id="ytch-active-ch-lbl">CH 01</span></div>
                        <span id="ytch-sig-lbl" class="hidden">Online</span>
                    </div>
                </div>
            </div>
        </div>
    `,

    anime: `
        <div class="flex h-full bg-[#07090f] text-xs overflow-hidden" id="anime-root">
            <div class="w-[38%] min-w-[290px] border-r border-white/[0.08] flex flex-col bg-black/25">
                <div class="p-3 border-b border-white/[0.07] bg-black/35 flex gap-2 shrink-0">
                    <input id="anime-search" class="flex-1 os-input px-3 py-1.5 text-xs cursor-text" placeholder="Search anime..." onkeydown="if(event.key==='Enter') os.animeSearch()">
                    <button type="button" onclick="os.animeSearch()" class="os-btn-primary px-3 py-1.5 text-xs cursor-none hover-target">Search</button>
                </div>
                <div class="px-3 py-2 border-b border-white/[0.06] flex gap-1.5">
                    <button type="button" onclick="os.animeTrending()" class="os-btn text-pink-300 cursor-none hover-target">Top Airing</button>
                    <button type="button" onclick="os.animeSeasonal()" class="os-btn cursor-none hover-target">This Season</button>
                    <button type="button" onclick="os.animeRecommendations()" class="os-btn cursor-none hover-target">Recommended</button>
                </div>
                <div id="anime-results" class="flex-1 overflow-y-auto p-2.5 space-y-2"></div>
            </div>
            <div class="flex-1 min-w-0 flex flex-col relative">
                <div id="anime-detail" class="flex-1 overflow-y-auto select-text">
                    <div class="h-full flex items-center justify-center text-center text-gray-400 p-6">
                        <div class="max-w-xs space-y-2">
                            <div class="text-3xl">🎬</div>
                            <div class="text-white font-display font-bold text-base">Anime Hub</div>
                            <div class="text-xs text-gray-500 leading-relaxed">Select a series to view trailers, episode counts, studios, cast, and streaming links.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,

    manga: `
        <div class="flex h-full bg-[#07090f] text-xs overflow-hidden" id="manga-root">
            <div class="w-[35%] min-w-[280px] border-r border-white/[0.08] flex flex-col bg-black/25">
                <div class="p-3 border-b border-white/[0.07] bg-black/35 flex gap-2 shrink-0">
                    <input id="manga-search" class="flex-1 os-input px-3 py-1.5 text-xs cursor-text" placeholder="Search manga..." onkeydown="if(event.key==='Enter') os.mangaSearch()">
                    <button type="button" onclick="os.mangaSearch()" class="os-btn-primary px-3 py-1.5 text-xs cursor-none hover-target">Search</button>
                </div>
                <div class="px-3 py-2 border-b border-white/[0.06] flex gap-1.5">
                    <button type="button" onclick="os.mangaTrending()" class="os-btn text-emerald-300 cursor-none hover-target">Top Rated</button>
                    <button type="button" onclick="os.mangaRenderList()" class="os-btn cursor-none hover-target">Reading List</button>
                </div>
                <div id="manga-results" class="flex-1 overflow-y-auto p-2.5 space-y-2"></div>
            </div>
            <div class="flex-1 min-w-0 flex flex-col">
                <div id="manga-detail" class="flex-1 overflow-y-auto select-text">
                    <div class="h-full flex items-center justify-center text-center text-gray-400 p-6">
                        <div class="max-w-xs space-y-2">
                            <div class="text-3xl">📖</div>
                            <div class="text-white font-display font-bold text-base">Manga Reader</div>
                            <div class="text-xs text-gray-500 leading-relaxed">Browse top manga, save titles to your reading list, and read available MangaDex chapters inline.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,

    memes: `
        <div class="flex flex-col h-full bg-[#07090f] text-xs relative select-none" id="memes-root">
            <div class="os-toolbar">
                <div class="flex gap-1.5 overflow-x-auto no-scrollbar items-center" id="memes-source-buttons"></div>
                <div class="flex items-center gap-1.5 shrink-0">
                    <div class="relative">
                        <span class="text-gray-500 font-mono text-[11px] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">r/</span>
                        <input id="memes-custom-sub" type="text" placeholder="earthporn, cats..."
                            class="os-input pl-6 pr-2.5 py-1 w-32 text-xs cursor-text"
                            onkeydown="if(event.key==='Enter' && this.value.trim()) os.setMemeSubreddit(this.value.trim().replace(/^r\\//i,''))">
                    </div>
                    <select id="memes-sort-select" onchange="os.setMemeSort && os.setMemeSort(this.value)" class="os-input py-1 px-2 text-xs cursor-none hover-target">
                        <option value="hot">Hot</option>
                        <option value="top">Top Today</option>
                        <option value="new">New</option>
                    </select>
                    <button type="button" onclick="os.fetchMemes()" id="btn-meme-refresh" class="os-btn hover-target cursor-none" title="Refresh gallery">
                        <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto p-4 relative" id="memes-scroll-area">
                <div class="columns-2 md:columns-3 gap-3.5 space-y-3.5" id="memes-container">
                    <div class="col-span-2 text-center text-gray-400 py-10 text-xs">Loading Reddit image gallery...</div>
                </div>
            </div>

            <div id="memes-lightbox" onclick="this.classList.add('hidden');this.classList.remove('flex')" class="hidden absolute inset-0 z-50 bg-black/85 backdrop-blur-md items-center justify-center p-6 cursor-pointer">
                <img id="memes-lightbox-img" src="" class="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/15">
            </div>
        </div>
    `,

    games: `
        <div class="flex flex-col h-full bg-[#07090f] text-xs select-none" id="games-root">
            <div class="os-toolbar">
                <span class="text-white font-semibold flex items-center gap-2"><i data-lucide="gamepad-2" class="w-3.5 h-3.5 text-violet-400"></i> Retro Arcade</span>
                <span class="text-[11px] text-gray-400">Playable HTML5 &amp; Open-Source Classics</span>
            </div>
            <div class="flex flex-col flex-1 overflow-hidden">
                <div id="games-library" class="flex-1 overflow-y-auto p-3.5 grid grid-cols-2 sm:grid-cols-3 gap-3 content-start"></div>
                <div id="games-frame-container" class="hidden flex-1 flex-col relative">
                    <div class="flex items-center gap-2 px-3.5 py-2 border-b border-white/[0.07] bg-black/50 shrink-0">
                        <button type="button" onclick="os.gamesBack()" class="os-btn hover-target cursor-none">← Library</button>
                        <span id="games-frame-title" class="text-white font-semibold text-xs flex-1 truncate"></span>
                        <button type="button" onclick="os.gamesFullscreen()" class="os-btn hover-target cursor-none">⛶ Fullscreen</button>
                    </div>
                    <iframe id="games-iframe" class="flex-1 w-full border-0 bg-black" allowfullscreen sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups"></iframe>
                </div>
            </div>
        </div>
    `,

    weather: `
        <div class="flex flex-col h-full relative overflow-hidden bg-[#07090f]" id="weather-root">
            <div id="weather-bg-gif" class="absolute inset-0 z-0 bg-cover bg-center opacity-20 transition-all duration-1000"></div>
            <div class="absolute inset-0 z-0 bg-gradient-to-b from-black/65 via-[#07090f]/75 to-[#07090f]/95"></div>
            <div class="relative z-10 flex flex-col h-full p-4 text-xs overflow-y-auto" id="weather-content">
                <div class="text-gray-400 text-xs text-center mt-20">Loading local forecast &amp; air quality...</div>
            </div>
        </div>
    `,

    nasa: `
        <div class="flex flex-col h-full bg-[#060810] text-xs relative overflow-hidden select-none" id="nasa-root">
            <div class="os-toolbar">
                <div class="os-segmented" id="nasa-tabs">
                    <button type="button" data-nasa-tab="apod" onclick="os.nasaLoadAPOD()" class="os-seg-btn active hover-target cursor-none">Picture of the Day</button>
                    <button type="button" data-nasa-tab="epic" onclick="os.nasaLoadEPIC()" class="os-seg-btn hover-target cursor-none">Earth EPIC</button>
                    <button type="button" data-nasa-tab="mars" onclick="os.nasaLoadMars()" class="os-seg-btn hover-target cursor-none">Mars Rover</button>
                    <button type="button" data-nasa-tab="donki" onclick="os.nasaLoadDONKI()" class="os-seg-btn hover-target cursor-none">Solar Weather</button>
                </div>
                <div class="flex items-center gap-1.5">
                    <input type="date" id="nasa-apod-date" max="2026-11-22" min="1995-06-16"
                        onchange="os.nasaLoadAPOD(this.value)"
                        class="os-input py-1 px-2 text-[11px] font-mono cursor-pointer" title="Pick APOD archive date">
                </div>
            </div>
            <div class="flex-1 overflow-y-auto p-4 space-y-3 select-text" id="nasa-content">
                <div class="text-center text-gray-400 mt-10 text-xs">Loading NASA Astronomy Picture of the Day...</div>
            </div>
        </div>
    `,

    iss: `
        <div class="flex flex-col h-full bg-black text-xs overflow-hidden select-none" id="iss-root">
            <div class="os-toolbar bg-black/85 backdrop-blur z-10">
                <span class="text-white font-semibold flex items-center gap-2">
                    <i data-lucide="satellite" class="w-3.5 h-3.5 text-sky-400"></i> ISS 3D Orbital Tracker
                </span>
                <button type="button" onclick="os.initISS(true)" class="os-btn hover-target cursor-none"><i data-lucide="refresh-cw" class="w-3 h-3"></i> Refresh Orbit</button>
            </div>
            <div id="iss-content" class="flex-1 overflow-hidden relative bg-black">
                <div class="absolute inset-0 flex items-center justify-center text-gray-400 text-xs z-0" id="iss-loading">Loading 3D Earth &amp; live ISS coordinates...</div>
            </div>
        </div>
    `
});
