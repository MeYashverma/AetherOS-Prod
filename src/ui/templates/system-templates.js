// AetherOS — Window DOM Templates (system-templates)
Object.assign(WindowContents, {
    about: `
      <div class="about-shell">
        <aside id="about-tab-list" aria-label="About sections">
          <div class="about-brand"><span class="glass-project-mark" aria-hidden="true"><img src="assets/apple-logo.svg" alt="" width="23" height="29"></span><span>AetherOS<small>Project &amp; provenance</small></span></div>
          ${[['overview','Overview'],['creator','About me'],['architecture','Architecture'],['features','App guide'],['metrics','This browser'],['roadmap','Changelog'],['credits','Sources & limits']].map(([id,label])=>`<button type="button" id="tab-about-${id}" class="about-tab" onclick="os.switchAboutTab('${id}')" aria-pressed="${id==='overview'}">${label}</button>`).join('')}
          <label class="about-search-label" for="about-search-input">Search app guide</label>
          <input type="search" id="about-search-input" class="os-input" maxlength="160" placeholder="Name, source or limitation" oninput="os.aboutSearch(this.value)">
          <p class="about-nav-note">A browser workspace.<br>Not your operating system.</p>
        </aside>
        <main id="about-panel-content" aria-label="Project information"></main>
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
                    <span class="settings-nav-badge" id="settings-modules-badge">32/47</span>
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

    terminal: `
        <div class="h-full bg-[#06080e] text-xs overflow-hidden relative flex flex-col" id="terminal-out">
            <canvas id="terminal-matrix-canvas" class="hidden absolute inset-0 w-full h-full opacity-20 pointer-events-none"></canvas>
            <header class="studio-app-heading"><div><span class="studio-eyebrow">LOCAL COMMAND WORKSPACE</span><h2>Browser Console</h2><p>Work with the archive and app windows. Not a system shell; no host command execution.</p></div></header>

            <div class="os-toolbar relative z-10">
                <div class="flex items-center gap-2 flex-wrap">
                    <div class="os-segmented">
                        <button type="button" data-term-tab="shell" onclick="os.terminalSetTab('shell')" class="os-seg-btn active hover-target cursor-none">Commands</button>
                        <button type="button" data-term-tab="syslog" onclick="os.terminalSetTab('syslog')" class="os-seg-btn hover-target cursor-none">System Log <span id="term-syslog-count" class="ml-1 text-[10px] opacity-70">0</span></button>
                    </div>
                    <span id="terminal-cwd-badge" class="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] font-mono text-[10.5px] text-sky-300">/Archive</span>
                </div>
                <div class="flex items-center gap-1.5 flex-wrap">
                    <button type="button" onclick="os.terminalRunCommand('neofetch')" class="os-btn hover-target cursor-none">neofetch</button>
                    <button type="button" onclick="os.terminalRunCommand('ls')" class="os-btn hover-target cursor-none">ls</button>
                    <button type="button" onclick="os.terminalRunCommand('ps')" class="os-btn hover-target cursor-none">ps</button>
                    <button type="button" onclick="os.terminalRunCommand('help')" class="os-btn hover-target cursor-none">help</button>
                    <button type="button" id="term-matrix-btn" onclick="os.terminalToggleMatrix()" class="os-btn hover-target cursor-none" title="Toggle subtle Matrix backdrop">Matrix</button>
                    <button type="button" onclick="os.terminalCopyOutput()" class="os-btn hover-target cursor-none" title="Copy session output">Copy</button>
                    <button type="button" onclick="os.terminalRunCommand('clear')" class="os-btn hover-target cursor-none text-rose-300">Clear</button>
                </div>
            </div>

            <!-- Interactive Shell Output -->
            <div id="terminal-shell-pane" class="relative z-10 flex-1 flex flex-col min-h-0">
                <div id="terminal-feed" onclick="document.getElementById('terminal-cli')?.focus()" class="flex-1 overflow-y-auto p-4 space-y-1.5 font-mono text-[12px] leading-relaxed text-gray-200 select-text"></div>
                <div class="border-t border-white/[0.08] bg-black/65 px-4 py-2.5 flex items-center gap-2 shrink-0 font-mono text-[12px]">
                    <span class="text-emerald-400 font-semibold">user@aetheros</span><span class="text-gray-500">:</span><span id="terminal-prompt-path" class="text-sky-300">/Archive</span><span class="text-gray-400">$</span>
                    <input type="text" id="terminal-cli" aria-label="Browser console command" maxlength="4000" spellcheck="false" autocomplete="off"
                        class="bg-transparent border-none outline-none text-white flex-1 cursor-text"
                        placeholder="Type a command (help, ls, cd, cat, touch, mkdir, ps, open, curl, ping, calc)... Tab to autocomplete">
                </div>
            </div>

            <!-- Real System Event Log Pane (Quietly collects OS module events without polluting shell) -->
            <div id="terminal-syslog-pane" class="hidden relative z-10 flex-1 flex flex-col min-h-0">
                <div class="px-4 py-2 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-[11px] text-gray-400">
                    <span>Real-time application &amp; API events</span>
                    <button type="button" onclick="os.terminalClearSyslog()" class="text-gray-400 hover:text-white hover-target cursor-none">Clear Log</button>
                </div>
                <div id="terminal-syslog-feed" class="flex-1 overflow-y-auto p-3.5 space-y-1 font-mono text-[11px] text-gray-300 select-text"></div>
            </div>
        </div>
    `,

    taskmanager: `
        <div class="tm-studio" id="taskmanager-root">
            <header class="studio-app-heading"><div><span class="studio-eyebrow">WORKSPACE / RUNTIME</span><h2>See what’s open.</h2><p>Your AetherOS windows and measured browser-page activity. Not an operating-system process manager.</p></div></header>
            <div id="tm-summary" class="tm-summary"></div>
            <div class="tm-toolbar"><div class="os-segmented"><button type="button" onclick="os.tmSwitchTab('processes')" id="tm-tab-proc" class="os-seg-btn active" aria-pressed="true">Windows</button><button type="button" onclick="os.tmSwitchTab('performance')" id="tm-tab-perf" class="os-seg-btn" aria-pressed="false">Runtime history</button></div><input id="tm-filter-input" aria-label="Filter windows and apps" placeholder="Filter windows…" oninput="os._tmFilter=this.value;os.tmRefreshData()"><button type="button" id="tm-pause" class="os-btn" aria-pressed="false" onclick="os.tmTogglePause()">Pause sampling</button><button type="button" class="os-btn" onclick="os.tmRefresh()">Refresh</button><button type="button" class="os-btn" onclick="os.tmExport()">Export JSON</button><button type="button" class="os-btn tm-close-all" onclick="os.tmCloseAllWindows()">Close others</button></div>
            <p class="tm-status" id="tm-status" role="status">Samples every two seconds while visible · history stays in this tab</p>
            <main id="taskmanager-content" tabindex="0" aria-label="Windows and runtime details"></main>
        </div>
    `,

    sysmon: `
        <div class="flex flex-col h-full bg-[#07090f]/95 text-xs select-none" id="sysmon-root">
            <div class="os-toolbar">
                <div class="os-segmented">
                    <button type="button" onclick="os.switchSysmonView('perf')" id="tab-sysmon-perf" class="os-seg-btn active hover-target cursor-none">Performance &amp; Hardware</button>
                    <button type="button" onclick="os.switchSysmonView('speed')" id="tab-sysmon-speed" class="os-seg-btn hover-target cursor-none">Network Speed Test</button>
                </div>
                <div class="flex items-center gap-2 text-[11px] text-emerald-300 font-medium">
                    <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Live Metrics</span>
                </div>
            </div>
            <div id="sysmon-content" class="flex-1 p-4 overflow-hidden"></div>
        </div>
    `
});

const SysmonViews = window.SysmonViews = {
    perf: `
        <div class="h-full overflow-y-auto no-scrollbar p-0 text-xs" id="sysmon-enhanced-root">
            <div class="grid grid-cols-12 gap-3 min-h-full">
                <div class="col-span-12 lg:col-span-7 os-card p-3.5 overflow-hidden">
                    <div class="flex justify-between items-center mb-2.5">
                        <span class="text-xs font-semibold text-white">Frame Pacing &amp; Main Thread</span>
                        <span class="flex gap-3 font-mono text-[11px] text-gray-300 tabular-nums">
                            <b id="sysmon-fps" class="text-emerald-300">-- FPS</b>
                            <b id="sysmon-frame-ms" class="text-white">-- ms</b>
                            <b id="sysmon-loop-lag" class="text-amber-300">-- lag</b>
                        </span>
                    </div>
                    <div class="h-44 relative bg-[#04060b] rounded-xl border border-white/[0.07] overflow-hidden">
                        <canvas id="sysmon-canvas" class="absolute inset-0 w-full h-full"></canvas>
                    </div>
                    <div class="grid grid-cols-4 gap-2 mt-3">
                        <div class="bg-white/[0.03] border border-white/[0.06] rounded-lg p-2.5"><div class="text-gray-400 text-[10px]">Long Tasks</div><div id="sysmon-longtasks" class="text-white font-semibold font-mono text-sm mt-0.5 tabular-nums">0</div></div>
                        <div class="bg-white/[0.03] border border-white/[0.06] rounded-lg p-2.5"><div class="text-gray-400 text-[10px]">DOM Nodes</div><div id="sysmon-dom-nodes" class="text-white font-semibold font-mono text-sm mt-0.5 tabular-nums">--</div></div>
                        <div class="bg-white/[0.03] border border-white/[0.06] rounded-lg p-2.5"><div class="text-gray-400 text-[10px]">Resources</div><div id="sysmon-resource-count" class="text-white font-semibold font-mono text-sm mt-0.5 tabular-nums">--</div></div>
                        <div class="bg-white/[0.03] border border-white/[0.06] rounded-lg p-2.5"><div class="text-gray-400 text-[10px]">Boot Load</div><div id="sysmon-load-time" class="text-white font-semibold font-mono text-sm mt-0.5 tabular-nums">--</div></div>
                    </div>
                </div>

                <div class="col-span-12 lg:col-span-5 grid grid-cols-2 gap-3">
                    <div class="col-span-1 os-card p-3.5">
                        <div class="text-[11px] font-semibold text-gray-300 mb-2">Battery</div>
                        <div class="flex items-center gap-3">
                            <div class="relative w-14 h-14 flex items-center justify-center border border-white/15 rounded-full bg-black/40"><span class="text-xs font-bold font-mono text-white tabular-nums" id="sysmon-bat-pct">--%</span></div>
                            <div class="min-w-0"><div class="text-white font-semibold text-xs" id="sysmon-bat-status">Checking...</div><div class="text-gray-400 text-[11px] mt-0.5" id="sysmon-bat-time">--</div></div>
                        </div>
                    </div>
                    <div class="col-span-1 os-card p-3.5">
                        <div class="text-[11px] font-semibold text-gray-300 mb-2">Connection</div>
                        <div class="space-y-1.5 text-[11px]">
                            <div class="flex justify-between"><span class="text-gray-400">Downlink</span><b id="sysmon-net-speed" class="text-white font-mono tabular-nums">--</b></div>
                            <div class="flex justify-between"><span class="text-gray-400">RTT</span><b id="sysmon-ping-jitter" class="text-white font-mono tabular-nums">--</b></div>
                            <div class="flex justify-between"><span class="text-gray-400">Profile</span><b id="sysmon-net-type" class="text-white font-mono uppercase">--</b></div>
                            <div class="flex justify-between"><span class="text-gray-400">Data Saver</span><b id="sysmon-net-save" class="text-white font-mono">--</b></div>
                        </div>
                    </div>
                    <div class="col-span-2 os-card p-3.5">
                        <div class="flex justify-between text-[11px] mb-2"><span class="font-semibold text-gray-300">JS Heap Memory</span><span id="sysmon-mem-pct" class="font-mono text-emerald-300 tabular-nums">--%</span></div>
                        <div class="flex items-end gap-3">
                            <div class="flex-1 space-y-2 text-[11px]">
                                <div class="flex justify-between text-gray-400"><span>Allocated</span><b id="sysmon-mem-used" class="text-white font-mono tabular-nums">-- MB</b></div>
                                <div class="w-full h-2 bg-black/60 rounded-full overflow-hidden relative"><div id="sysmon-mem-bar" class="absolute left-0 top-0 bottom-0 bg-emerald-400 transition-all duration-300 w-0"></div></div>
                                <div class="flex justify-between text-gray-500"><span>Heap Limit</span><span id="sysmon-mem-limit" class="font-mono tabular-nums">-- MB</span></div>
                            </div>
                            <canvas id="sysmon-mem-canvas" class="w-28 h-16 bg-black/40 rounded-lg border border-white/[0.07]"></canvas>
                        </div>
                    </div>
                </div>

                <div class="col-span-12 lg:col-span-4 os-card p-3.5">
                    <div class="text-[11px] font-semibold text-gray-300 mb-2">Origin Storage Quota</div>
                    <div class="flex items-center gap-3">
                        <canvas id="sysmon-storage-canvas" width="96" height="96" class="w-24 h-24"></canvas>
                        <div class="flex-1 space-y-1 text-[11px]"><div id="sysmon-quota-val" class="text-white font-semibold font-mono tabular-nums">Calculating...</div><div id="sysmon-storage-pct" class="text-gray-400 font-mono">-- used</div><div class="text-gray-500 leading-relaxed text-[10.5px]">IndexedDB files + LocalStorage workspace state.</div></div>
                    </div>
                </div>

                <div class="col-span-12 lg:col-span-4 os-card p-3.5">
                    <div class="text-[11px] font-semibold text-gray-300 mb-2">Host Hardware</div>
                    <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                        <span class="text-gray-400">Logical Cores</span><b id="sysmon-device-cores" class="text-white font-mono tabular-nums">--</b>
                        <span class="text-gray-400">Device RAM</span><b id="sysmon-device-memory" class="text-white font-mono tabular-nums">--</b>
                        <span class="text-gray-400">Pixel Ratio</span><b id="sysmon-dpr" class="text-white font-mono tabular-nums">--</b>
                        <span class="text-gray-400">Viewport</span><b id="sysmon-viewport" class="text-white font-mono tabular-nums">--</b>
                        <span class="text-gray-400">Platform</span><b id="sysmon-platform" class="text-white truncate">--</b>
                        <span class="text-gray-400">Status</span><b id="sysmon-online" class="text-emerald-300 font-medium">--</b>
                    </div>
                    <div id="sysmon-core-bars" class="h-12 mt-3 flex items-end gap-1 overflow-hidden"></div>
                </div>

                <div class="col-span-12 lg:col-span-4 os-card p-3.5 flex flex-col justify-between">
                    <div>
                        <div class="text-[11px] font-semibold text-gray-300 mb-2">Session Snapshot</div>
                        <div class="space-y-1.5 text-[11px]">
                            <div class="flex justify-between"><span class="text-gray-400">Open Windows</span><b id="sysmon-windows-open" class="text-white font-mono tabular-nums">--</b></div>
                            <div class="flex justify-between"><span class="text-gray-400">Saved Config</span><b id="sysmon-state-size" class="text-white font-mono tabular-nums">--</b></div>
                            <div class="flex justify-between"><span class="text-gray-400">Browser</span><b id="sysmon-agent" class="text-white truncate max-w-[160px] text-right">--</b></div>
                        </div>
                    </div>
                    <button type="button" onclick="os.sysmonCopyReport()" class="mt-3 w-full os-btn hover-target cursor-none py-2">Copy System Report (JSON)</button>
                </div>

                <div class="col-span-12 os-card p-3.5">
                    <div class="flex justify-between items-center mb-2.5">
                        <div class="text-[11px] font-semibold text-gray-300">Loaded Network Assets by Type</div>
                        <button type="button" onclick="os.updateTrueSystemStats()" class="os-btn hover-target cursor-none">Refresh</button>
                    </div>
                    <div id="sysmon-resource-bars" class="grid grid-cols-2 md:grid-cols-4 gap-2"></div>
                </div>
            </div>
        </div>
    `,
    speed: `
        <div class="flex flex-col h-full justify-between overflow-hidden">
            <div class="flex-1 grid grid-cols-12 gap-4 overflow-hidden">
                <div class="col-span-12 md:col-span-5 os-card p-5 flex flex-col justify-between items-center relative overflow-hidden">
                    <div class="text-xs font-semibold text-gray-300 self-start w-full flex justify-between items-center">
                        <span>Cloudflare Speed Test</span>
                        <span id="speedtest-phase" class="os-badge text-emerald-300">Ready</span>
                    </div>
                    <div class="relative w-44 h-44 flex items-center justify-center my-auto">
                        <svg class="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                            <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.06)" stroke-width="7" fill="transparent" />
                            <circle id="gauge-progress" cx="80" cy="80" r="70" stroke="#34d399" stroke-width="7" stroke-dasharray="440" stroke-dashoffset="440" fill="transparent" class="transition-all duration-200" stroke-linecap="round"/>
                        </svg>
                        <div class="absolute text-center flex flex-col justify-center">
                            <span class="text-4xl font-display font-bold text-white leading-none tabular-nums" id="speed-meter-val">0.0</span>
                            <span class="text-[11px] text-gray-400 font-mono mt-1">Mbps</span>
                        </div>
                    </div>
                    <button type="button" onclick="os.runSpeedTest()" id="speedtest-btn" class="w-full py-2.5 os-btn-primary text-xs hover-target cursor-none">
                        Run Speed Test
                    </button>
                </div>

                <div class="col-span-12 md:col-span-7 flex flex-col justify-between gap-3 overflow-y-auto">
                    <div class="os-card p-3.5 space-y-2 text-xs">
                        <div class="flex justify-between border-b border-white/[0.06] pb-2">
                            <span class="text-gray-400">Public IP</span>
                            <span class="text-white font-mono font-medium" id="speed-client-ip">Click Run to check</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Cloudflare Edge</span>
                            <span class="text-white font-mono" id="speed-client-loc">--</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div class="os-card p-3.5 flex flex-col justify-between">
                            <span class="text-[11px] text-gray-400">Ping Latency</span>
                            <div class="text-xl font-semibold text-white mt-1 font-mono tabular-nums" id="speed-ping-val">-- <span class="text-[11px] text-gray-500">ms</span></div>
                        </div>
                        <div class="os-card p-3.5 flex flex-col justify-between">
                            <span class="text-[11px] text-gray-400">Jitter</span>
                            <div class="text-xl font-semibold text-white mt-1 font-mono tabular-nums" id="speed-jitter-val">-- <span class="text-[11px] text-gray-500">ms</span></div>
                        </div>
                        <div class="os-card p-3.5 flex flex-col justify-between">
                            <span class="text-[11px] text-gray-400">Download</span>
                            <div class="text-xl font-semibold text-emerald-300 mt-1 font-mono tabular-nums" id="speed-dl-val">-- <span class="text-[11px] text-gray-500">Mbps</span></div>
                        </div>
                        <div class="os-card p-3.5 flex flex-col justify-between">
                            <span class="text-[11px] text-gray-400">Upload</span>
                            <div class="text-xl font-semibold text-sky-300 mt-1 font-mono tabular-nums" id="speed-ul-val">-- <span class="text-[11px] text-gray-500">Mbps</span></div>
                        </div>
                    </div>

                    <div class="os-card p-3.5 flex-1 flex flex-col justify-between min-h-[96px]">
                        <div class="text-[11px] text-gray-400 mb-2">Throughput Samples</div>
                        <div class="h-12 w-full flex items-end gap-1 overflow-hidden" id="speed-chart-curve"></div>
                    </div>
                </div>
            </div>
        </div>
    `
};
