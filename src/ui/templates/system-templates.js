// AetherOS — Window DOM Templates (system-templates)
Object.assign(WindowContents, {
    about: `
                <div class="flex h-full text-gray-300 font-mono text-xs select-none">
                    <!-- Navigation Sidebar -->
                    <div class="w-44 bg-black/45 border-r border-white/5 p-3 flex flex-col gap-1 shrink-0" id="about-tab-list">
                        <div class="text-[8px] text-cyan-400 uppercase tracking-[0.2em] px-2 py-1 mb-1 font-bold">Encyclopedia</div>
                        <button onclick="os.switchAboutTab('overview')" id="tab-about-overview" class="about-tab active w-full text-left px-2.5 py-1.5 rounded text-white bg-white/10 hover-target cursor-none transition-all flex items-center gap-1.5"><i data-lucide="info" class="w-3.5 h-3.5 text-cyan-400"></i> Overview</button>
                        <button onclick="os.switchAboutTab('architecture')" id="tab-about-architecture" class="about-tab w-full text-left px-2.5 py-1.5 rounded text-gray-500 hover:text-white hover:bg-white/5 transition-all hover-target cursor-none flex items-center gap-1.5"><i data-lucide="network" class="w-3.5 h-3.5"></i> Architecture</button>
                        <button onclick="os.switchAboutTab('features')" id="tab-about-features" class="about-tab w-full text-left px-2.5 py-1.5 rounded text-gray-500 hover:text-white hover:bg-white/5 transition-all hover-target cursor-none flex items-center gap-1.5"><i data-lucide="grid" class="w-3.5 h-3.5"></i> Feature Wiki</button>
                        <button onclick="os.switchAboutTab('metrics')" id="tab-about-metrics" class="about-tab w-full text-left px-2.5 py-1.5 rounded text-gray-500 hover:text-white hover:bg-white/5 transition-all hover-target cursor-none flex items-center gap-1.5"><i data-lucide="activity" class="w-3.5 h-3.5"></i> Stats & Tech</button>
                        <button onclick="os.switchAboutTab('roadmap')" id="tab-about-roadmap" class="about-tab w-full text-left px-2.5 py-1.5 rounded text-gray-500 hover:text-white hover:bg-white/5 transition-all hover-target cursor-none flex items-center gap-1.5"><i data-lucide="milestone" class="w-3.5 h-3.5"></i> Evolution</button>
                        <button onclick="os.switchAboutTab('credits')" id="tab-about-credits" class="about-tab w-full text-left px-2.5 py-1.5 rounded text-gray-500 hover:text-white hover:bg-white/5 transition-all hover-target cursor-none flex items-center gap-1.5"><i data-lucide="heart" class="w-3.5 h-3.5"></i> Credits</button>
                        
                        <!-- Search Box in Sidebar -->
                        <div class="mt-auto pt-3 border-t border-white/5">
                            <div class="relative">
                                <input type="text" id="about-search-input" oninput="os.aboutSearch(this.value)" placeholder="Search wiki..." class="w-full bg-black/60 border border-white/10 rounded px-2.5 py-1.5 text-[10px] text-white focus:outline-none focus:border-cyan-500/30 cursor-text" autocomplete="off">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Content Panel -->
                    <div class="flex-1 p-5 overflow-y-auto no-scrollbar relative bg-os-950/20" id="about-panel-content">
                        <!-- Content is injected dynamically -->
                    </div>
                </div>
            `,

    settings: `
                <div class="settings-shell">
                    <aside class="settings-sidebar" id="settings-tab-list">
                        <div class="settings-search-box">
                            <i data-lucide="search" class="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                            <input type="text" id="settings-search-input" placeholder="Search settings..." autocomplete="off" oninput="os.filterSettingsSearch(this.value)" class="hover-target cursor-none">
                            <button type="button" id="settings-search-clear" onclick="const i=document.getElementById('settings-search-input');if(i){i.value='';os.filterSettingsSearch('');}" class="hidden absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                                <i data-lucide="x" class="w-3 h-3"></i>
                            </button>
                        </div>

                        <div class="settings-nav-section">Workspace</div>
                        <button type="button" data-settings-tab="general" onclick="os.switchSettingsTab('general')" class="settings-nav-btn active hover-target cursor-none">
                            <span class="flex items-center gap-2.5"><i data-lucide="sliders-horizontal" class="w-3.5 h-3.5"></i> General</span>
                        </button>
                        <button type="button" data-settings-tab="appearance" onclick="os.switchSettingsTab('appearance')" class="settings-nav-btn hover-target cursor-none">
                            <span class="flex items-center gap-2.5"><i data-lucide="palette" class="w-3.5 h-3.5"></i> Appearance</span>
                        </button>
                        <button type="button" data-settings-tab="voice" onclick="os.switchSettingsTab('voice')" class="settings-nav-btn hover-target cursor-none">
                            <span class="flex items-center gap-2.5"><i data-lucide="volume-2" class="w-3.5 h-3.5"></i> Sound &amp; Voice</span>
                        </button>

                        <div class="settings-nav-section">Extensions</div>
                        <button type="button" data-settings-tab="modules" onclick="os.switchSettingsTab('modules')" class="settings-nav-btn hover-target cursor-none">
                            <span class="flex items-center gap-2.5"><i data-lucide="layout-grid" class="w-3.5 h-3.5"></i> App Modules</span>
                            <span class="settings-nav-badge" id="settings-modules-badge">13/35</span>
                        </button>
                        <button type="button" data-settings-tab="extras" onclick="os.switchSettingsTab('extras')" class="settings-nav-btn hover-target cursor-none">
                            <span class="flex items-center gap-2.5"><i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Desktop Extras</span>
                        </button>
                        <button type="button" data-settings-tab="api" onclick="os.switchSettingsTab('api')" class="settings-nav-btn hover-target cursor-none">
                            <span class="flex items-center gap-2.5"><i data-lucide="key" class="w-3.5 h-3.5"></i> Integrations</span>
                        </button>

                        <div class="settings-nav-section">System</div>
                        <button type="button" data-settings-tab="system" onclick="os.switchSettingsTab('system')" class="settings-nav-btn hover-target cursor-none">
                            <span class="flex items-center gap-2.5"><i data-lucide="cpu" class="w-3.5 h-3.5"></i> System &amp; Reset</span>
                        </button>
                    </aside>
                    <div class="settings-pane" id="settings-panel-content"></div>
                </div>
            `,

    nosleep: `
                <div class="h-full bg-[#050506] text-xs font-mono relative overflow-hidden" id="nosleep-root">
                    <div class="absolute inset-0 pointer-events-none opacity-25" style="background:radial-gradient(circle at 50% 25%,rgba(34,197,94,.14),transparent 45%),linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px);background-size:auto,100% 4px;"></div>
                    <div class="relative z-10 h-full grid grid-cols-[190px_1fr] gap-4 p-4">
                        <div class="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-black/45 shadow-os-recessed">
                            <div class="nosleep-orb" id="nosleep-orb">
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <i data-lucide="sun" class="w-12 h-12 text-green-300/80 drop-shadow-[0_0_18px_rgba(34,197,94,.45)]"></i>
                                </div>
                            </div>
                            <div class="text-center">
                                <div class="text-white font-display text-lg uppercase tracking-widest">NoSleep</div>
                                <div class="text-[9px] text-gray-500 uppercase tracking-[0.2em]">screen wake lock</div>
                            </div>
                        </div>
                        <div class="flex flex-col min-w-0 gap-3">
                            <div class="rounded-2xl border border-white/10 bg-black/45 p-4 shadow-os-recessed">
                                <div class="flex items-center justify-between mb-3">
                                    <div>
                                        <div class="text-[9px] text-os-accent uppercase tracking-widest">Wake Status</div>
                                        <div class="text-white text-xl font-display uppercase tracking-widest flex items-center gap-2 mt-1"><span class="nosleep-status-dot" id="nosleep-dot"></span><span id="nosleep-status-label">STANDBY</span></div>
                                    </div>
                                    <div class="text-right text-[9px] text-gray-500">
                                        <div>MODE</div>
                                        <div class="text-white font-bold" id="nosleep-mode-label">--</div>
                                    </div>
                                </div>
                                <p class="text-gray-400 leading-relaxed text-[11px] select-text">
                                    Keeps this workstation awake while AetherOS is visible. Uses the native Screen Wake Lock API when available, then falls back to a tiny in-page media keep-awake loop inspired by <span class="text-white">nosleep.page</span>. If the browser blocks both, open nosleep.page as an external helper.
                                </p>
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <button onclick="os.enableWakeLock()" class="nosleep-btn primary hover-target">Enable Keep Awake</button>
                                <button onclick="os.disableWakeLock()" class="nosleep-btn danger hover-target">Disable</button>
                                <button onclick="os.toggleWakeLock()" class="nosleep-btn hover-target">Toggle</button>
                                <button onclick="os.openNoSleepPage()" class="nosleep-btn external hover-target">Open nosleep.page ↗</button>
                            </div>
                            <div class="rounded-xl border border-white/5 bg-black/35 p-3 text-[10px] text-gray-500 space-y-1">
                                <div class="flex justify-between"><span>Native API</span><span id="nosleep-native-support" class="text-white">--</span></div>
                                <div class="flex justify-between"><span>Fallback video</span><span id="nosleep-fallback-support" class="text-white">--</span></div>
                                <div class="flex justify-between"><span>Visibility</span><span id="nosleep-visibility" class="text-white">VISIBLE</span></div>
                            </div>
                            <div class="text-[9px] text-gray-600 leading-relaxed">
                                Note: Browsers may require a click/tap before a wake lock can start. Battery saver, OS policy, or hidden tabs can release it; AetherOS will re-acquire when visible.
                            </div>
                        </div>
                    </div>
                </div>
            `,

    terminal: `
                <div class="h-full bg-[#030304] text-xs font-mono overflow-hidden relative" id="terminal-out">
                    <div class="absolute inset-0 opacity-[0.10] pointer-events-none" style="background-image:linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:22px 22px;"></div>
                    <canvas id="terminal-matrix-canvas" class="absolute inset-0 w-full h-full opacity-35 pointer-events-none"></canvas>
                    <div class="relative z-10 h-full flex flex-col">
                        <div class="h-11 border-b border-white/10 bg-black/55 backdrop-blur px-4 flex items-center justify-between flex-shrink-0">
                            <div class="flex items-center gap-3"><span class="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_12px_rgba(74,222,128,.9)]"></span><span class="text-white font-display tracking-widest uppercase">Data Stream Cortex</span><span class="text-[9px] text-gray-600">AETHEROS://KERNEL/TAP</span></div>
                            <div class="flex gap-2 text-[9px] uppercase"><button onclick="os.terminalRunCommand('matrix')" class="px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 cursor-none hover-target">Matrix</button><button onclick="os.terminalRunCommand('scan')" class="px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 cursor-none hover-target">Scan</button><button onclick="os.terminalRunCommand('clear')" class="px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 cursor-none hover-target">Clear</button></div>
                        </div>
                        <div class="grid grid-cols-4 gap-2 p-3 border-b border-white/5 bg-black/25 flex-shrink-0">
                            <div class="rounded-lg bg-white/[0.035] border border-white/10 p-2"><div class="text-gray-500 uppercase text-[8px]">Packets</div><div id="term-packets" class="text-white text-lg font-bold">0000</div></div>
                            <div class="rounded-lg bg-white/[0.035] border border-white/10 p-2"><div class="text-gray-500 uppercase text-[8px]">Errors</div><div id="term-errors" class="text-red-300 text-lg font-bold">00</div></div>
                            <div class="rounded-lg bg-white/[0.035] border border-white/10 p-2"><div class="text-gray-500 uppercase text-[8px]">Latency</div><div id="term-latency" class="text-cyan-200 text-lg font-bold">--ms</div></div>
                            <div class="rounded-lg bg-white/[0.035] border border-white/10 p-2"><div class="text-gray-500 uppercase text-[8px]">Entropy</div><div id="term-entropy" class="text-green-300 text-lg font-bold">0.00</div></div>
                        </div>
                        <div class="flex-1 min-h-0 grid grid-cols-5 gap-3 p-3">
                            <div class="col-span-3 rounded-xl border border-white/10 bg-black/60 backdrop-blur overflow-hidden flex flex-col">
                                <div class="px-3 py-2 border-b border-white/5 flex justify-between text-[9px] text-os-accent uppercase tracking-widest"><span>Live Event Bus</span><span id="terminal-stream-state" class="text-green-400">STREAMING</span></div>
                                <div id="terminal-feed" class="flex-1 overflow-y-auto p-3 space-y-1 text-green-300/90 select-text"></div>
                            </div>
                            <div class="col-span-2 rounded-xl border border-white/10 bg-black/45 overflow-hidden flex flex-col">
                                <div class="px-3 py-2 border-b border-white/5 text-[9px] text-os-accent uppercase tracking-widest">Signal Analyzer</div>
                                <canvas id="terminal-wave-canvas" class="h-32 w-full border-b border-white/5"></canvas>
                                <div id="terminal-sidecar" class="p-3 space-y-2 text-[10px]"></div>
                            </div>
                        </div>
                        <div class="border-t border-white/10 bg-black/70 px-3 py-2 flex items-center gap-2 flex-shrink-0">
                            <span class="text-green-400">root@aether</span><span class="text-gray-600">:</span><span class="text-cyan-300">~</span><span class="text-white">$</span>
                            <input type="text" class="bg-transparent border-none outline-none text-white w-full cursor-text" placeholder="try: help, scan, weather, iss, apis, matrix, clear" id="terminal-cli">
                        </div>
                    </div>
                </div>
            `,

    taskmanager: `
                <div class="flex flex-col h-full bg-[#070709] text-xs font-mono" id="taskmanager-root">
                    <div class="h-9 border-b border-white/5 px-3 flex items-center justify-between flex-shrink-0">
                        <div class="flex gap-3 text-[10px] text-os-accent uppercase">
                            <button onclick="os.tmSwitchTab('processes')" id="tm-tab-proc" class="hover-target cursor-none text-white font-bold border-b border-white pb-0.5">Processes</button>
                            <button onclick="os.tmSwitchTab('performance')" id="tm-tab-perf" class="hover-target cursor-none text-gray-500 hover:text-white transition">Performance</button>
                        </div>
                        <button onclick="os.tmRefresh()" class="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-none hover-target transition"><i data-lucide="refresh-cw" class="w-3 h-3"></i></button>
                    </div>
                    <div class="flex-1 overflow-hidden" id="taskmanager-content"></div>
                </div>
            `,

    sysmon: `
                <div class="flex flex-col h-full bg-os-900 text-xs font-mono" id="sysmon-root">
                    <div class="h-10 border-b border-white/5 px-4 flex justify-between items-center text-[10px] font-mono text-os-accent uppercase">
                        <div class="flex gap-4">
                            <button onclick="os.switchSysmonView('perf')" id="tab-sysmon-perf" class="hover-target cursor-none text-white font-semibold border-b border-white pb-0.5">System Performance</button>
                            <button onclick="os.switchSysmonView('speed')" id="tab-sysmon-speed" class="hover-target cursor-none text-gray-500 hover:text-white">Network Uplink (Speed Test)</button>
                        </div>
                        <span class="text-green-500 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> SYSTEM_HEALTH_OK</span>
                    </div>
                    <div id="sysmon-content" class="flex-1 p-4 overflow-hidden"></div>
                </div>
            `,

    storage: `
                <div class="flex flex-col h-full bg-[#050607] text-xs font-mono overflow-hidden" id="storage-root">
                    <div class="p-3 border-b border-white/5 bg-black/40 flex items-center gap-2 flex-shrink-0">
                        <button onclick="os.storageRender()" class="px-3 py-1.5 bg-white/10 rounded cursor-none hover-target">Refresh</button>
                        <button onclick="os.storageExport()" class="px-3 py-1.5 bg-blue-500/15 border border-blue-500/25 text-blue-200 rounded cursor-none hover-target">Export JSON</button>
                        <button onclick="os.storageDeleteSelected()" class="px-3 py-1.5 bg-red-500/15 border border-red-500/25 text-red-200 rounded cursor-none hover-target">Delete Selected</button>
                        <span id="storage-summary" class="ml-auto text-gray-500"></span>
                    </div>
                    <div id="storage-list" class="flex-1 overflow-y-auto p-3 space-y-2"></div>
                </div>
            `,

    errorconsole: `
                <div class="flex flex-col h-full bg-[#070505] text-xs font-mono overflow-hidden" id="error-root">
                    <div class="p-3 border-b border-white/5 bg-black/40 flex items-center gap-2 flex-shrink-0">
                        <button onclick="os.errorConsoleRender()" class="px-3 py-1.5 bg-white/10 rounded cursor-none hover-target">Refresh</button>
                        <button onclick="os.errorConsoleClear()" class="px-3 py-1.5 bg-red-500/15 border border-red-500/25 text-red-200 rounded cursor-none hover-target">Clear</button>
                        <button onclick="setTimeout(()=>{throw new Error('AetherOS test error')},0)" class="px-3 py-1.5 bg-yellow-500/15 border border-yellow-500/25 text-yellow-200 rounded cursor-none hover-target">Test Error</button>
                        <span class="ml-auto text-gray-500">Runtime errors + unhandled promises</span>
                    </div>
                    <div id="error-list" class="flex-1 overflow-y-auto p-3 space-y-2"></div>
                </div>
            `,

    apistatus: `
                <div class="flex flex-col h-full bg-[#040706] text-xs font-mono overflow-hidden" id="api-status-root">
                    <div class="p-3 border-b border-white/5 bg-black/40 flex items-center gap-2 flex-shrink-0">
                        <button onclick="os.apiStatusRun()" class="px-3 py-1.5 bg-green-500/15 border border-green-500/25 text-green-200 rounded cursor-none hover-target">Run All Tests</button>
                        <span class="text-gray-500">Tests: Open-Meteo, Radio Browser, Wikipedia, NASA, CoinGecko, Jikan, USGS</span>
                    </div>
                    <div id="api-status-list" class="flex-1 overflow-y-auto p-3 grid grid-cols-1 md:grid-cols-2 gap-3 content-start"></div>
                </div>
            `,

    packetviz: `
                <div class="flex flex-col h-full bg-[#020408] text-xs font-mono overflow-hidden" id="packet-root">
                    <div class="p-3 border-b border-white/5 bg-black/40 flex items-center gap-2 flex-shrink-0">
                        <button onclick="os.packetVizRender()" class="px-3 py-1.5 bg-cyan-500/15 border border-cyan-500/25 text-cyan-200 rounded cursor-none hover-target">Scan Resource Timing</button>
                        <button onclick="performance.clearResourceTimings(); os.packetVizRender()" class="px-3 py-1.5 bg-white/10 rounded cursor-none hover-target">Clear Timing Buffer</button>
                        <span id="packet-summary" class="ml-auto text-gray-500"></span>
                    </div>
                    <div class="flex-1 overflow-y-auto p-4">
                        <div id="packet-hosts" class="space-y-3"></div>
                    </div>
                </div>
            `
});

const SysmonViews = window.SysmonViews = {

            perf: `
                <div class="h-full overflow-y-auto no-scrollbar p-0 text-[10px] font-mono" id="sysmon-enhanced-root">
                    <div class="grid grid-cols-12 gap-3 min-h-full">
                        <div class="col-span-12 lg:col-span-7 bg-black/50 border border-white/5 rounded-lg p-3 shadow-os-recessed overflow-hidden">
                            <div class="flex justify-between items-center mb-2 text-[10px] text-os-accent uppercase tracking-wider">
                                <span>Realtime Frame / Event Loop Telemetry</span>
                                <span class="flex gap-3 text-gray-400"><b id="sysmon-fps" class="text-white">-- FPS</b><b id="sysmon-frame-ms" class="text-white">-- MS</b><b id="sysmon-loop-lag" class="text-yellow-400">-- LAG</b></span>
                            </div>
                            <div class="h-44 relative bg-[#020202] rounded border border-white/5 overflow-hidden">
                                <canvas id="sysmon-canvas" class="absolute inset-0 w-full h-full"></canvas>
                            </div>
                            <div class="grid grid-cols-4 gap-2 mt-3">
                                <div class="bg-white/[0.03] border border-white/5 rounded p-2"><div class="text-gray-500 uppercase text-[8px]">Long Tasks</div><div id="sysmon-longtasks" class="text-white font-bold">0</div></div>
                                <div class="bg-white/[0.03] border border-white/5 rounded p-2"><div class="text-gray-500 uppercase text-[8px]">DOM Nodes</div><div id="sysmon-dom-nodes" class="text-white font-bold">--</div></div>
                                <div class="bg-white/[0.03] border border-white/5 rounded p-2"><div class="text-gray-500 uppercase text-[8px]">Resources</div><div id="sysmon-resource-count" class="text-white font-bold">--</div></div>
                                <div class="bg-white/[0.03] border border-white/5 rounded p-2"><div class="text-gray-500 uppercase text-[8px]">Load Time</div><div id="sysmon-load-time" class="text-white font-bold">--</div></div>
                            </div>
                        </div>

                        <div class="col-span-12 lg:col-span-5 grid grid-cols-2 gap-3">
                            <div class="col-span-1 bg-black/30 border border-white/5 rounded-lg p-3 shadow-os-recessed">
                                <div class="text-[9px] text-os-accent uppercase mb-2">Battery</div>
                                <div class="flex items-center gap-3">
                                    <div class="relative w-14 h-14 flex items-center justify-center border border-white/10 rounded-full bg-black/50"><span class="text-xs font-bold text-white" id="sysmon-bat-pct">--%</span></div>
                                    <div class="min-w-0"><div class="text-white uppercase font-bold" id="sysmon-bat-status">LOADING...</div><div class="text-gray-500" id="sysmon-bat-time">--</div></div>
                                </div>
                            </div>
                            <div class="col-span-1 bg-black/30 border border-white/5 rounded-lg p-3 shadow-os-recessed">
                                <div class="text-[9px] text-os-accent uppercase mb-2">Network</div>
                                <div class="space-y-1"><div class="flex justify-between"><span class="text-gray-500">Downlink</span><b id="sysmon-net-speed" class="text-white">--</b></div><div class="flex justify-between"><span class="text-gray-500">RTT</span><b id="sysmon-ping-jitter" class="text-white">--</b></div><div class="flex justify-between"><span class="text-gray-500">Type</span><b id="sysmon-net-type" class="text-white uppercase">--</b></div><div class="flex justify-between"><span class="text-gray-500">SaveData</span><b id="sysmon-net-save" class="text-white">--</b></div></div>
                            </div>
                            <div class="col-span-2 bg-black/30 border border-white/5 rounded-lg p-3 shadow-os-recessed">
                                <div class="flex justify-between text-[9px] text-os-accent mb-2 uppercase"><span>JS Heap Memory</span><span id="sysmon-mem-pct">--%</span></div>
                                <div class="flex items-end gap-3">
                                    <div class="flex-1 space-y-2">
                                        <div class="flex justify-between text-gray-400"><span>Used</span><b id="sysmon-mem-used" class="text-white">-- MB</b></div>
                                        <div class="w-full h-2 bg-os-900 rounded overflow-hidden relative"><div id="sysmon-mem-bar" class="absolute left-0 top-0 bottom-0 bg-white/50 transition-all duration-300 w-0"></div></div>
                                        <div class="flex justify-between text-gray-500"><span>Limit</span><span id="sysmon-mem-limit">-- MB</span></div>
                                    </div>
                                    <canvas id="sysmon-mem-canvas" class="w-28 h-16 bg-black/40 rounded border border-white/5"></canvas>
                                </div>
                            </div>
                        </div>

                        <div class="col-span-12 lg:col-span-4 bg-black/30 border border-white/5 rounded-lg p-3 shadow-os-recessed">
                            <div class="text-[9px] text-os-accent uppercase mb-2">Storage Quota</div>
                            <div class="flex items-center gap-3">
                                <canvas id="sysmon-storage-canvas" width="96" height="96" class="w-24 h-24"></canvas>
                                <div class="flex-1 space-y-1"><div id="sysmon-quota-val" class="text-white font-bold uppercase">FETCHING...</div><div id="sysmon-storage-pct" class="text-gray-500">-- used</div><div class="text-gray-600 leading-relaxed">Uses navigator.storage + localStorage snapshot.</div></div>
                            </div>
                        </div>

                        <div class="col-span-12 lg:col-span-4 bg-black/30 border border-white/5 rounded-lg p-3 shadow-os-recessed">
                            <div class="text-[9px] text-os-accent uppercase mb-2">Device Capability</div>
                            <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]"><span class="text-gray-500">CPU cores</span><b id="sysmon-device-cores" class="text-white">--</b><span class="text-gray-500">Device RAM</span><b id="sysmon-device-memory" class="text-white">--</b><span class="text-gray-500">DPR</span><b id="sysmon-dpr" class="text-white">--</b><span class="text-gray-500">Viewport</span><b id="sysmon-viewport" class="text-white">--</b><span class="text-gray-500">Platform</span><b id="sysmon-platform" class="text-white truncate">--</b><span class="text-gray-500">Online</span><b id="sysmon-online" class="text-white">--</b></div>
                            <div id="sysmon-core-bars" class="h-12 mt-3 flex items-end gap-1 overflow-hidden"></div>
                        </div>

                        <div class="col-span-12 lg:col-span-4 bg-black/30 border border-white/5 rounded-lg p-3 shadow-os-recessed">
                            <div class="text-[9px] text-os-accent uppercase mb-2">Application State</div>
                            <div class="space-y-1"><div class="flex justify-between"><span class="text-gray-500">Open windows</span><b id="sysmon-windows-open" class="text-white">--</b></div><div class="flex justify-between"><span class="text-gray-500">Saved state</span><b id="sysmon-state-size" class="text-white">--</b></div><div class="flex justify-between"><span class="text-gray-500">User Agent</span><b id="sysmon-agent" class="text-white truncate max-w-[150px] text-right">--</b></div></div>
                            <button onclick="os.sysmonCopyReport()" class="mt-3 w-full py-1.5 bg-white/10 border border-white/10 rounded text-white hover:bg-white/15 cursor-none hover-target uppercase tracking-wider">Copy Diagnostic Report</button>
                        </div>

                        <div class="col-span-12 bg-black/30 border border-white/5 rounded-lg p-3 shadow-os-recessed">
                            <div class="flex justify-between items-center mb-2"><div class="text-[9px] text-os-accent uppercase">Resource Type Distribution</div><button onclick="os.updateTrueSystemStats()" class="px-2 py-1 bg-white/5 border border-white/10 rounded text-gray-300 hover:text-white cursor-none hover-target">Refresh Audit</button></div>
                            <div id="sysmon-resource-bars" class="grid grid-cols-2 md:grid-cols-4 gap-2"></div>
                        </div>
                    </div>
                </div>
            `,
            speed: `
                <div class="flex flex-col h-full justify-between overflow-hidden">
                    <div class="flex-1 grid grid-cols-12 gap-4 mb-3 overflow-hidden">
                        <div class="col-span-5 bg-black/50 border border-white/5 rounded-lg p-4 flex flex-col justify-between items-center relative shadow-os-recessed overflow-hidden">
                            <div class="text-[9px] text-os-accent uppercase self-start w-full flex justify-between">
                                <span>Bandwidth Gauge</span>
                                <span id="speedtest-phase" class="text-green-500 font-semibold">Ready</span>
                            </div>
                            <div class="relative w-40 h-40 flex items-center justify-center my-auto">
                                <svg class="w-full h-full transform -rotate-90 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]">
                                    <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.05)" stroke-width="6" fill="transparent" />
                                    <circle cx="80" cy="80" r="60" stroke="rgba(255,255,255,0.02)" stroke-width="1" fill="transparent" stroke-dasharray="2 4"/>
                                    <circle id="gauge-progress" cx="80" cy="80" r="70" stroke="var(--os-accent-custom)" stroke-width="6" stroke-dasharray="440" stroke-dashoffset="440" fill="transparent" class="transition-all duration-200" stroke-linecap="round"/>
                                </svg>
                                <div class="absolute text-center flex flex-col justify-center">
                                    <span class="text-3xl font-display font-bold text-white leading-none tracking-wide text-glow" id="speed-meter-val">0.0</span>
                                    <span class="text-[9px] text-os-accent font-mono uppercase tracking-wider mt-1">Mbps</span>
                                </div>
                            </div>
                            <button onclick="os.runSpeedTest()" id="speedtest-btn" class="w-full py-3 bg-white text-black font-semibold text-xs font-mono uppercase tracking-widest rounded hover:bg-gray-200 transition hover-target cursor-none shadow-os-btn">
                                Initialize Uplink Test
                            </button>
                        </div>

                        <div class="col-span-7 flex flex-col justify-between gap-3 overflow-y-auto">
                            <!-- Network Topology Diagnostics -->
                            <div class="bg-black/30 border border-white/5 rounded-lg p-3 shadow-os-recessed flex flex-col justify-between text-[10px] font-mono">
                                <div class="flex justify-between border-b border-white/5 pb-1 mb-1">
                                    <span class="text-os-accent">CLIENT IP</span>
                                    <span class="text-white font-semibold" id="speed-client-ip">AWAITING SCAN...</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-os-accent">ROUTING NODE</span>
                                    <span class="text-white" id="speed-client-loc">--</span>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-3">
                                <div class="bg-black/30 border border-white/5 rounded-lg p-3 shadow-os-recessed flex flex-col justify-between">
                                    <span class="text-[9px] text-os-accent uppercase">Latency / Ping</span>
                                    <div class="text-lg font-semibold text-white mt-1" id="speed-ping-val">-- <span class="text-[10px] text-gray-500">ms</span></div>
                                </div>
                                <div class="bg-black/30 border border-white/5 rounded-lg p-3 shadow-os-recessed flex flex-col justify-between">
                                    <span class="text-[9px] text-os-accent uppercase">Latency Jitter</span>
                                    <div class="text-lg font-semibold text-white mt-1" id="speed-jitter-val">-- <span class="text-[10px] text-gray-500">ms</span></div>
                                </div>
                                <div class="bg-black/30 border border-white/5 rounded-lg p-3 shadow-os-recessed flex flex-col justify-between">
                                    <span class="text-[9px] text-os-accent uppercase">Download Max</span>
                                    <div class="text-lg font-semibold text-white mt-1" id="speed-dl-val">-- <span class="text-[10px] text-gray-500">Mbps</span></div>
                                </div>
                                <div class="bg-black/30 border border-white/5 rounded-lg p-3 shadow-os-recessed flex flex-col justify-between">
                                    <span class="text-[9px] text-os-accent uppercase">Upload Max</span>
                                    <div class="text-lg font-semibold text-white mt-1" id="speed-ul-val">-- <span class="text-[10px] text-gray-500">Mbps</span></div>
                                </div>
                            </div>

                            <div class="bg-black/30 border border-white/5 rounded-lg p-3 flex-1 flex flex-col justify-between shadow-os-recessed">
                                <div class="text-[9px] text-os-accent uppercase mb-2">Realtime Rate Curve</div>
                                <div class="h-10 w-full flex items-end gap-1 overflow-hidden" id="speed-chart-curve"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `
        };
