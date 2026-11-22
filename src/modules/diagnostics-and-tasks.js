// AetherOS — Data Stream Terminal, System Monitor, Cloudflare Speed Test, Task Manager & Diagnostics
window.extendOS({
    logTerminal: (txt) => {
                const feed = document.getElementById('terminal-feed');
                const stamp = new Date().toLocaleTimeString();
                const msg = String(txt || '');
                if (feed) {
                    const line = document.createElement('div');
                    const critical = /error|fail|denied|corrupt/i.test(msg);
                    const good = /ok|sync|connected|success|online/i.test(msg);
                    line.className = `group grid grid-cols-[72px_54px_1fr] gap-2 items-start px-2 py-1.5 rounded border ${critical?'bg-red-950/20 border-red-500/20 text-red-200':good?'bg-green-950/10 border-green-500/15 text-green-200':'bg-white/[0.025] border-white/5 text-green-300/90'} hover:bg-white/[0.055] transition-colors`;
                    const tag = critical ? 'ALERT' : good ? 'SYNC' : 'EVT';
                    line.innerHTML = `<span class="text-gray-500">${stamp}</span><span class="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-os-accent text-center">${tag}</span><span class="select-text break-words">${os._html ? os._html(msg) : msg}</span>`;
                    feed.appendChild(line);
                    while(feed.children.length > 160) feed.firstChild.remove();
                    feed.scrollTop = feed.scrollHeight;
                }
                os._terminalStats = os._terminalStats || { packets:0, errors:0, entropy:0, latency:0 };
                os._terminalStats.packets += 1;
                if (/error|fail/i.test(msg)) os._terminalStats.errors += 1;
                if (os._terminalUpdateStats) os._terminalUpdateStats();
            },

    _terminalStats: { packets:0, errors:0, entropy:0, latency:0 },

    _terminalIntervals: [],

    initDataStream: () => {
                const root = document.getElementById('terminal-out');
                if (!root) return;
                if (root.dataset.ready === '1') return;
                (os._terminalIntervals||[]).forEach(clearInterval); os._terminalIntervals = [];
                root.dataset.ready = '1';
                const cliInput = document.getElementById('terminal-cli');
                os._terminalHistory = os._terminalHistory || [];
                os._terminalHistIdx = -1;
                if (cliInput) {
                    cliInput.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' && cliInput.value.trim() !== '') {
                            const val = cliInput.value.trim();
                            os._terminalHistory.unshift(val);
                            if (os._terminalHistory.length > 50) os._terminalHistory.pop();
                            os._terminalHistIdx = -1;
                            os.terminalRunCommand(val);
                            cliInput.value = '';
                        } else if (e.key === 'ArrowUp' && os._terminalHistory.length) {
                            e.preventDefault();
                            os._terminalHistIdx = Math.min(os._terminalHistory.length - 1, os._terminalHistIdx + 1);
                            cliInput.value = os._terminalHistory[os._terminalHistIdx] || '';
                        } else if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            os._terminalHistIdx = Math.max(-1, os._terminalHistIdx - 1);
                            cliInput.value = os._terminalHistIdx >= 0 ? (os._terminalHistory[os._terminalHistIdx] || '') : '';
                        }
                    });
                }
                const side = document.getElementById('terminal-sidecar');
                if (side) side.innerHTML = ['OPEN_METEO','JIKAN','NASA','COINGECKO','WIKIPEDIA'].map((n,i)=>`<div class="flex items-center justify-between p-2 rounded bg-white/[0.035] border border-white/5"><span class="text-gray-400">${n}</span><span class="text-green-400">${i%2?'SYNC':'IDLE'}</span></div>`).join('');
                ['AetherOS Kernel v1.0.0 initializing...','Loading modules [OK]','Mounting local storage [OK]','Packet tap attached to Resource Timing API','Neural command parser online'].forEach(x=>os.logTerminal(x));
                os._terminalIntervals.push(setInterval(()=>{
                    if (!document.getElementById('terminal-out')) return;
                    const samples=['API pulse received','Resource timing delta mapped','Window compositor heartbeat','LocalStorage journal clean','ISS orbital packet cached','Media telemetry normalized','Entropy pool stirred','UI thread frame budget stable'];
                    if (Math.random() > .45) os.logTerminal(samples[Math.floor(Math.random()*samples.length)]);
                    os._terminalStats.packets += Math.floor(8+Math.random()*40);
                    os._terminalStats.latency = Math.floor(12+Math.random()*140);
                    os._terminalStats.entropy = Math.random()*9.99;
                    if (Math.random()>.92) os._terminalStats.errors++;
                    os._terminalUpdateStats();
                }, 1800));
                os._terminalAnimate();
            },

    _terminalUpdateStats: () => {
                const s=os._terminalStats;
                const p=document.getElementById('term-packets'), e=document.getElementById('term-errors'), l=document.getElementById('term-latency'), en=document.getElementById('term-entropy');
                if(p)p.textContent=String(s.packets).padStart(4,'0'); if(e)e.textContent=String(s.errors).padStart(2,'0'); if(l)l.textContent=s.latency+'ms'; if(en)en.textContent=s.entropy.toFixed(2);
            },

    _terminalAnimate: () => {
                const matrix=document.getElementById('terminal-matrix-canvas'), wave=document.getElementById('terminal-wave-canvas');
                if(!matrix || !wave) return;
                const mctx=matrix.getContext('2d'), wctx=wave.getContext('2d');
                const resize=()=>{ const r=matrix.parentElement.getBoundingClientRect(); matrix.width=r.width; matrix.height=r.height; const wr=wave.getBoundingClientRect(); wave.width=Math.max(250,wr.width); wave.height=128; };
                resize();
                const cols=()=>Math.floor(matrix.width/14); let drops=Array.from({length:cols()},()=>Math.random()*matrix.height/14);
                const loop=()=>{
                    if(!document.getElementById('terminal-matrix-canvas')) return;
                    if(drops.length!==cols()) drops=Array.from({length:cols()},()=>Math.random()*matrix.height/14);
                    mctx.fillStyle='rgba(0,0,0,.09)'; mctx.fillRect(0,0,matrix.width,matrix.height); mctx.font='12px JetBrains Mono, monospace';
                    for(let i=0;i<drops.length;i++){ const txt='01AETHEROS◇λΔ'[Math.floor(Math.random()*12)]; mctx.fillStyle=Math.random()>.985?'rgba(255,255,255,.9)':'rgba(74,222,128,.55)'; mctx.fillText(txt,i*14,drops[i]*14); if(drops[i]*14>matrix.height&&Math.random()>.975)drops[i]=0; drops[i]+=.45; }
                    wctx.clearRect(0,0,wave.width,wave.height); wctx.strokeStyle='rgba(255,255,255,.7)'; wctx.lineWidth=1.5; wctx.beginPath();
                    const t=performance.now()/360; for(let x=0;x<wave.width;x++){ const y=64+Math.sin(x*.035+t)*22+Math.sin(x*.09+t*1.7)*8+(Math.random()-.5)*4; x? wctx.lineTo(x,y):wctx.moveTo(x,y); } wctx.stroke();
                    wctx.strokeStyle='rgba(74,222,128,.25)'; for(let y=18;y<128;y+=18){wctx.beginPath();wctx.moveTo(0,y);wctx.lineTo(wave.width,y);wctx.stroke();}
                    requestAnimationFrame(loop);
                };
                window.addEventListener('resize', resize, {passive:true}); loop();
            },

    terminalRunCommand: (cmd) => {
                const raw = String(cmd || '').trim();
                const c = raw.toLowerCase();
                os.logTerminal('EXEC: ' + raw);
                if (c === 'clear') { const f = document.getElementById('terminal-feed'); if (f) f.innerHTML = ''; return; }
                if (c === 'help') {
                    os.logTerminal('SHELL: neofetch | ls [path] | cat <file> | ps | kill <app> | open <app>');
                    os.logTerminal('WM:    space <1-3> | snap <left|right|max|split> | theme <name> | lock | backup');
                    os.logTerminal('TOOLS: curl <url> | qr <url/text> | calc <expr> | date | uptime | clear');
                } else if (c === 'neofetch' || c === 'sysinfo') {
                    const reg = window.AETHER_MODULE_REGISTRY || {};
                    const totalMods = Object.keys(reg).length;
                    const enabledMods = Object.keys(reg).filter((id) => os.isModuleEnabled && os.isModuleEnabled(id)).length;
                    const openWins = Object.values(SystemState.windows || {}).filter((w) => w.isOpen).length;
                    const upSec = Math.floor(performance.now() / 1000);
                    [
                        '   /\\      AetherOS Liquid Glass v2.0',
                        '  /  \\     --------------------------',
                        ` / /\\ \\    Theme:   ${SystemState.settings.active_theme || 'midnight'} (${SystemState.settings.performance_mode || 'eco'})`,
                        `/ ____ \\   Space:   Workspace 0${SystemState.settings.active_space || 1} (${openWins} open windows)`,
                        `/_/    \\_\\ Modules: ${enabledMods}/${totalMods} active`,
                        `           Host:    ${navigator.hardwareConcurrency || '?'} threads · ${navigator.deviceMemory ? navigator.deviceMemory + ' GB RAM' : 'Web Runtime'} · up ${Math.floor(upSec / 60)}m ${upSec % 60}s`
                    ].forEach((line) => os.logTerminal(line));
                } else if (c === 'ls' || c.startsWith('ls ')) {
                    const targetPath = raw.slice(2).trim() || '/Archive';
                    const items = os.fmChildrenForPath ? os.fmChildrenForPath(targetPath) : [];
                    if (!items.length) os.logTerminal(`(empty or unknown path: ${targetPath})`);
                    else os.logTerminal(items.map((n) => n.kind === 'folder' ? `[DIR] ${n.name}/` : `${n.name} (${n.size || n.kind})`).join('  ·  '));
                } else if (c.startsWith('cat ')) {
                    const q = raw.slice(4).trim().toLowerCase();
                    const found = os.fmFlatten && os.fmFlatten().find((n) => n.kind !== 'folder' && (n.name || '').toLowerCase().includes(q));
                    if (!found) os.logTerminal(`cat: no file matching "${q}"`);
                    else String(found.content || '(binary / image asset)').split('\n').slice(0, 18).forEach((ln) => os.logTerminal(ln));
                } else if (c === 'ps' || c === 'top') {
                    const open = Object.values(SystemState.windows || {}).filter((w) => w.isOpen);
                    if (!open.length) os.logTerminal('No active user windows.');
                    else open.forEach((w) => os.logTerminal(`[${w.id}] Space:${w.space || 1}  ${Math.round(w.width)}x${Math.round(w.height)}  "${w.title}"`));
                } else if (c.startsWith('kill ')) {
                    const id = c.slice(5).trim();
                    if (window.winManager && SystemState.windows[id]?.isOpen) { window.winManager.closeWindow(id); os.logTerminal(`Terminated window [${id}].`); }
                    else os.logTerminal(`kill: window [${id}] is not open.`);
                } else if (c.startsWith('space ')) {
                    const n = Number(c.slice(6).trim());
                    if (os.switchSpace && n >= 1 && n <= 3) { os.switchSpace(n); os.logTerminal(`Switched to Workspace 0${n}.`); }
                    else os.logTerminal('Usage: space <1|2|3>');
                } else if (c.startsWith('snap ')) {
                    const mode = c.slice(5).trim();
                    if (mode === 'split') { os.tileSideBySide && os.tileSideBySide(); os.logTerminal('Tiled top 2 windows 50/50.'); }
                    else {
                        const z = mode === 'max' ? 'maximize' : mode;
                        os.snapActiveWindow && os.snapActiveWindow(z);
                        os.logTerminal(`Snapped active window -> ${z}`);
                    }
                } else if (c.startsWith('theme ')) {
                    const t = c.slice(6).trim();
                    os.applyTheme && os.applyTheme(t);
                    os.logTerminal(`Applied theme: ${t}`);
                } else if (c.startsWith('calc ')) {
                    const expr = raw.slice(5).trim();
                    if (/^[0-9+\-*/%.()\s]+$/.test(expr)) {
                        try { os.logTerminal('= ' + Function(`"use strict";return (${expr})`)()); } catch (e) { os.logTerminal('Math error'); }
                    } else os.logTerminal('Usage: calc 480 * 1.18');
                } else if (c === 'date') os.logTerminal(new Date().toString());
                else if (c === 'whoami') os.logTerminal('operator@aetheros-workstation');
                else if (c === 'uptime') { const s = Math.floor(performance.now() / 1000); os.logTerminal(`Session uptime: ${Math.floor(s / 60)}m ${s % 60}s`); }
                else if (c === 'lock') { os.lockScreen && os.lockScreen(); }
                else if (c === 'backup') { window.AetherBackup && AetherBackup.triggerExportUI(); }
                else if (c === 'scan') { os.openWindow('taskmanager'); os.logTerminal('Launching Task & Network Manager...'); }
                else if (c === 'weather') os.openWindow('weather');
                else if (c === 'iss') os.openWindow('iss');
                else if (c === 'space') os.openWindow('spacexhub');
                else if (c === 'museums') os.openWindow('worldmuseums');
                else if (c === 'countries') os.openWindow('worldfactbook');
                else if (c === 'books') os.openWindow('gutendex');
                else if (c === 'shader') os.openWindow('shadertoy');
                else if (c === 'stars') os.openWindow('stellarium');
                else if (c === 'geo') os.openWindow('georadar');
                else if (c === 'apis') os.openWindow('sysmon');
                else if (c === 'matrix') { os._terminalStats.entropy = 9.99; os.logTerminal('MATRIX INTENSITY BOOSTED // entropy maxed'); }
                else if (c.startsWith('wiki ')) {
                    const query = raw.substring(5).trim();
                    os.openWindow('wikiboard');
                    setTimeout(() => {
                        if (os.wikiboard.engine) os.wikiboard.engine.searchAndSpawn(query);
                    }, 800);
                    os.logTerminal('Launching WikiBoard exploration for [' + query + ']...');
                }
                else if (c.startsWith('curl ')) {
                    const url = raw.slice(5).trim();
                    os.logTerminal(`Fetching ${url}...`);
                    fetch(url).then((r) => r.text()).then((t) => os.logTerminal(t.slice(0, 260))).catch((e) => os.logTerminal('curl error: ' + e.message));
                }
                else if (c.startsWith('open ')) {
                    const appId = c.replace('open ', '').trim();
                    if (SystemState.windows[appId]) {
                        if (os.isModuleEnabled && !os.isModuleEnabled(appId)) os.setModuleEnabled(appId, true, { silent: true });
                        os.openWindow(appId);
                    } else os.logTerminal(`Unknown module "${appId}".`);
                }
                else os.logTerminal('Unknown opcode. Type help.');
            },

    switchSysmonView: (viewId) => {
                os.sysmonView = viewId;
                const container = document.getElementById('sysmon-content');
                if (!container) return;

                container.innerHTML = SysmonViews[viewId] || '';

                const tabPerf = document.getElementById('tab-sysmon-perf');
                const tabSpeed = document.getElementById('tab-sysmon-speed');

                if (viewId === 'perf') {
                    if (tabPerf) tabPerf.className = "hover-target cursor-none text-white font-semibold border-b border-white pb-0.5";
                    if (tabSpeed) tabSpeed.className = "hover-target cursor-none text-gray-500 hover:text-white";
                    os.initSysMonitor();
                } else {
                    if (tabPerf) tabPerf.className = "hover-target cursor-none text-gray-500 hover:text-white";
                    if (tabSpeed) tabSpeed.className = "hover-target cursor-none text-white font-semibold border-b border-white pb-0.5";
                    os.killSysMonitor();
                    os.initSpeedTestUI();
                }
                lucide.createIcons({root: container});
            },

    sysmonTelemetry: { frames: [], heap: [], longTasks: 0, lastReport: {} },

    initSysMonitor: () => {
                os.killSysMonitor();
                os.sysMonitorCanvas = document.getElementById('sysmon-canvas');
                if (!os.sysMonitorCanvas) return;
                os.sysMonitorCtx = os.sysMonitorCanvas.getContext('2d');
                os.sysmonTelemetry = os.sysmonTelemetry || { frames: [], heap: [], longTasks: 0, lastReport: {} };
                os.sysmonTelemetry.frames = Array(160).fill(16.6);
                os.sysmonTelemetry.heap = Array(80).fill(0);
                os.resizeSysMonitorCanvas();
                const root = document.getElementById('sysmon-enhanced-root') || os.sysMonitorCanvas.parentNode;
                if (window.ResizeObserver && !os.sysmonResizeObserver) {
                    os.sysmonResizeObserver = new ResizeObserver(() => os.resizeSysMonitorCanvas());
                    os.sysmonResizeObserver.observe(root);
                }
                if (window.PerformanceObserver) {
                    try {
                        os.sysmonLongTaskObserver = new PerformanceObserver((list) => {
                            os.sysmonTelemetry.longTasks += list.getEntries().length;
                            const el = document.getElementById('sysmon-longtasks');
                            if (el) el.innerText = os.sysmonTelemetry.longTasks;
                        });
                        os.sysmonLongTaskObserver.observe({ entryTypes: ['longtask'] });
                    } catch(e) {}
                }
                let lastFrameTime = performance.now();
                let frameCount = 0;
                let fpsTimer = 0;
                const loop = (timestamp) => {
                    if (!os.sysMonitorCanvas) return;
                    const delta = Math.max(0, timestamp - lastFrameTime);
                    lastFrameTime = timestamp;
                    frameCount++;
                    fpsTimer += delta;
                    os.sysmonTelemetry.frames.push(delta);
                    if (os.sysmonTelemetry.frames.length > 160) os.sysmonTelemetry.frames.shift();
                    if (performance.memory) {
                        os.sysmonTelemetry.heap.push(performance.memory.usedJSHeapSize / 1048576);
                        if (os.sysmonTelemetry.heap.length > 80) os.sysmonTelemetry.heap.shift();
                    }
                    if (fpsTimer >= 1000) {
                        const fps = Math.round((frameCount * 1000) / fpsTimer);
                        const avg = os.sysmonTelemetry.frames.reduce((a,b)=>a+b,0) / os.sysmonTelemetry.frames.length;
                        const lag = Math.max(0, Math.round(avg - 16.6));
                        const fpsDisplay = document.getElementById('sysmon-fps');
                        const frameEl = document.getElementById('sysmon-frame-ms');
                        const lagEl = document.getElementById('sysmon-loop-lag');
                        if (fpsDisplay) fpsDisplay.innerText = `${fps} FPS`;
                        if (frameEl) frameEl.innerText = `${avg.toFixed(1)} MS`;
                        if (lagEl) lagEl.innerText = `${lag} MS LAG`;
                        frameCount = 0;
                        fpsTimer = 0;
                    }
                    os.drawOscilloscopeWaveform(os.sysmonTelemetry.frames);
                    os.drawSysmonMemoryChart();
                    os.sysMonitorLoopId = requestAnimationFrame(loop);
                };
                os.sysMonitorLoopId = requestAnimationFrame(loop);
                os.updateTrueSystemStats();
                os.sysMonitorStatsInterval = setInterval(os.updateTrueSystemStats, 1500);
                if (navigator.getBattery) {
                    navigator.getBattery().then(battery => {
                        const updateBattery = () => {
                            const pct = Math.round(battery.level * 100);
                            const batPct = document.getElementById('sysmon-bat-pct');
                            const batStatus = document.getElementById('sysmon-bat-status');
                            const batTime = document.getElementById('sysmon-bat-time');
                            if (batPct) batPct.innerText = `${pct}%`;
                            if (batStatus) batStatus.innerText = battery.charging ? 'CHARGING' : 'DISCHARGING';
                            if (batTime) batTime.innerText = battery.charging ? (battery.chargingTime === Infinity ? 'PLUGGED IN' : `${Math.round(battery.chargingTime/60)}M TO FULL`) : (battery.dischargingTime === Infinity ? 'CALCULATING...' : `${Math.round(battery.dischargingTime/60)}M LEFT`);
                        };
                        updateBattery();
                        battery.addEventListener('levelchange', updateBattery);
                        battery.addEventListener('chargingchange', updateBattery);
                    });
                } else {
                    const batStatus = document.getElementById('sysmon-bat-status');
                    if (batStatus) batStatus.innerText = 'UNAVAILABLE';
                }
            },

    killSysMonitor: () => {
                if (os.sysMonitorLoopId) cancelAnimationFrame(os.sysMonitorLoopId);
                os.sysMonitorLoopId = null;
                if (os.sysMonitorStatsInterval) clearInterval(os.sysMonitorStatsInterval);
                os.sysMonitorStatsInterval = null;
                if (os.sysmonResizeObserver) { os.sysmonResizeObserver.disconnect(); os.sysmonResizeObserver = null; }
                if (os.sysmonLongTaskObserver) { try { os.sysmonLongTaskObserver.disconnect(); } catch(e) {} os.sysmonLongTaskObserver = null; }
                os.sysMonitorCanvas = null;
                os.sysMonitorCtx = null;
            },

    resizeSysMonitorCanvas: () => {
                if (os.sysMonitorCanvas && os.sysMonitorCanvas.parentNode) {
                    const rect = os.sysMonitorCanvas.parentNode.getBoundingClientRect();
                    const ratio = window.devicePixelRatio || 1;
                    os.sysMonitorCanvas.width = Math.max(1, Math.floor(rect.width * ratio));
                    os.sysMonitorCanvas.height = Math.max(1, Math.floor(rect.height * ratio));
                    os.sysMonitorCanvas.style.width = rect.width + 'px';
                    os.sysMonitorCanvas.style.height = rect.height + 'px';
                    os.sysMonitorCtx = os.sysMonitorCanvas.getContext('2d');
                    if (os.sysMonitorCtx) os.sysMonitorCtx.setTransform(ratio,0,0,ratio,0,0);
                }
                const memCanvas = document.getElementById('sysmon-mem-canvas');
                if (memCanvas) { memCanvas.width = memCanvas.clientWidth || 112; memCanvas.height = memCanvas.clientHeight || 64; }
            },

    drawOscilloscopeWaveform: (data) => {
                const canvas = os.sysMonitorCanvas;
                const ctx = os.sysMonitorCtx;
                if (!canvas || !ctx) return;
                const w = canvas.clientWidth || canvas.width;
                const h = canvas.clientHeight || canvas.height;
                ctx.clearRect(0,0,w,h);
                ctx.fillStyle = '#020202'; ctx.fillRect(0,0,w,h);
                ctx.strokeStyle = 'rgba(255,255,255,0.035)'; ctx.lineWidth = 1;
                for (let x=0; x<w; x+=32) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
                for (let y=0; y<h; y+=28) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
                const maxMs = 80;
                const slice = w / Math.max(1, data.length-1);
                const drawLine = (color, width, mapper) => { ctx.strokeStyle=color; ctx.lineWidth=width; ctx.beginPath(); data.forEach((v,i)=>{ const x=i*slice; const y=mapper(v); i?ctx.lineTo(x,y):ctx.moveTo(x,y); }); ctx.stroke(); };
                drawLine('rgba(255,255,255,0.18)', 1, v => h - Math.min(maxMs,v)/maxMs*h);
                drawLine('rgba(34,197,94,0.9)', 1.6, v => h - Math.min(40,v)/40*h);
                ctx.strokeStyle = 'rgba(250,204,21,0.25)'; ctx.setLineDash([4,4]); ctx.beginPath(); const target = h - 16.6/40*h; ctx.moveTo(0,target); ctx.lineTo(w,target); ctx.stroke(); ctx.setLineDash([]);
            },

    drawSysmonMemoryChart: () => {
                const canvas = document.getElementById('sysmon-mem-canvas');
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                const data = os.sysmonTelemetry?.heap || [];
                const w = canvas.width = canvas.clientWidth || 112;
                const h = canvas.height = canvas.clientHeight || 64;
                ctx.clearRect(0,0,w,h);
                ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0,0,w,h);
                if (!data.length) return;
                const max = Math.max(16, ...data);
                ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.5; ctx.beginPath();
                data.forEach((v,i)=>{ const x = i/(data.length-1)*w; const y = h - (v/max)*h; i?ctx.lineTo(x,y):ctx.moveTo(x,y); }); ctx.stroke();
            },

    drawSysmonStorageDonut: (pct) => {
                const canvas = document.getElementById('sysmon-storage-canvas');
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                const w = canvas.width, h = canvas.height, cx=w/2, cy=h/2, r=34;
                ctx.clearRect(0,0,w,h);
                ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
                ctx.strokeStyle = pct > 80 ? '#ef4444' : pct > 55 ? '#facc15' : '#22c55e'; ctx.beginPath(); ctx.arc(cx,cy,r,-Math.PI/2,-Math.PI/2 + Math.PI*2*(pct/100)); ctx.stroke();
                ctx.fillStyle = '#fff'; ctx.font = 'bold 14px JetBrains Mono, monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(`${Math.round(pct)}%`, cx, cy);
            },

    renderSysmonBars: (id, data) => {
                const el = document.getElementById(id); if (!el) return;
                el.innerHTML = data.map(d => `<div class="bg-white/[0.03] border border-white/5 rounded p-2 min-w-0"><div class="flex justify-between text-[8px] uppercase text-gray-500 mb-1"><span class="truncate">${d.label}</span><span>${d.value}</span></div><div class="h-1.5 bg-os-900 rounded overflow-hidden"><div class="h-full bg-white/50" style="width:${Math.max(2, Math.min(100, d.pct))}%"></div></div></div>`).join('');
            },

    updateTrueSystemStats: async () => {
                const report = {};
                if (performance.memory) {
                    const mem = performance.memory;
                    const used = Math.round(mem.usedJSHeapSize / 1048576);
                    const total = Math.round(mem.totalJSHeapSize / 1048576);
                    const limit = Math.round(mem.jsHeapSizeLimit / 1048576);
                    const pct = Math.round((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100);
                    report.heap = { usedMB: used, totalMB: total, limitMB: limit, pct };
                    const memUsedEl = document.getElementById('sysmon-mem-used');
                    const memLimitEl = document.getElementById('sysmon-mem-limit');
                    const memBarEl = document.getElementById('sysmon-mem-bar');
                    const memPctEl = document.getElementById('sysmon-mem-pct');
                    if (memUsedEl) memUsedEl.innerText = `${used} MB / ${total} MB`;
                    if (memLimitEl) memLimitEl.innerText = `${limit} MB`;
                    if (memBarEl) memBarEl.style.width = `${pct}%`;
                    if (memPctEl) memPctEl.innerText = `${pct}%`;
                } else {
                    const memUsedEl = document.getElementById('sysmon-mem-used'); if (memUsedEl) memUsedEl.innerText = 'NO HEAP API';
                }
                if (navigator.storage && navigator.storage.estimate) {
                    try {
                        const estimate = await navigator.storage.estimate();
                        const quotaMB = Math.round((estimate.quota || 0) / 1048576);
                        const usedMB = ((estimate.usage || 0) / 1048576).toFixed(2);
                        const pct = estimate.quota ? (estimate.usage / estimate.quota) * 100 : 0;
                        report.storage = { usedMB, quotaMB, pct: Math.round(pct) };
                        const quotaEl = document.getElementById('sysmon-quota-val'); if (quotaEl) quotaEl.innerText = `${usedMB}MB / ${quotaMB}MB`;
                        const pctEl = document.getElementById('sysmon-storage-pct'); if (pctEl) pctEl.innerText = `${pct.toFixed(3)}% used`;
                        os.drawSysmonStorageDonut(pct);
                    } catch(e) {}
                }
                const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                if (conn) {
                    report.network = { downlink: conn.downlink, rtt: conn.rtt, effectiveType: conn.effectiveType, saveData: conn.saveData };
                    const netSpeedEl = document.getElementById('sysmon-net-speed'); if (netSpeedEl) netSpeedEl.innerText = `${conn.downlink || '--'} Mbps`;
                    const jitterEl = document.getElementById('sysmon-ping-jitter'); if (jitterEl) jitterEl.innerText = `${conn.rtt || '--'} ms`;
                    const typeEl = document.getElementById('sysmon-net-type'); if (typeEl) typeEl.innerText = conn.effectiveType || 'unknown';
                    const saveEl = document.getElementById('sysmon-net-save'); if (saveEl) saveEl.innerText = conn.saveData ? 'ON' : 'OFF';
                }
                const navEntry = performance.getEntriesByType('navigation')[0];
                const loadMs = navEntry ? Math.round(navEntry.loadEventEnd || navEntry.domComplete || performance.now()) : Math.round(performance.now());
                const resources = performance.getEntriesByType('resource');
                const byType = resources.reduce((acc, r) => { const t = r.initiatorType || 'other'; acc[t] = (acc[t]||0)+1; return acc; }, {});
                os.renderSysmonBars('sysmon-resource-bars', Object.entries(byType).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([label,value]) => ({label,value,pct: resources.length ? value/resources.length*100 : 0})));
                const cores = navigator.hardwareConcurrency || 1;
                const avgFrameMs = (os.sysmonTelemetry?.frames?.length)
                    ? (os.sysmonTelemetry.frames.reduce((a, b) => a + b, 0) / os.sysmonTelemetry.frames.length)
                    : 16.6;
                const estThreadBusyPct = Math.max(4, Math.min(98, Math.round((Math.max(0, avgFrameMs - 14) / 34) * 100 + Object.values(SystemState.windows).filter(w => w.isOpen).length * 4)));
                os.renderSysmonBars('sysmon-core-bars', Array.from({length: Math.min(16, cores)}, (_, i) => ({
                    label: `T${i + 1}`,
                    value: i === 0 ? `${estThreadBusyPct}%` : 'HW',
                    pct: i === 0 ? estThreadBusyPct : Math.max(6, Math.round(estThreadBusyPct * (0.45 + ((i % 3) * 0.12))))
                })));
                const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
                set('sysmon-device-cores', `${cores}`);
                set('sysmon-device-memory', navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'API N/A');
                set('sysmon-dpr', `${(window.devicePixelRatio || 1).toFixed(2)}x`);
                set('sysmon-viewport', `${window.innerWidth}×${window.innerHeight}`);
                set('sysmon-platform', navigator.platform || 'unknown');
                set('sysmon-online', navigator.onLine ? 'ONLINE' : 'OFFLINE');
                set('sysmon-dom-nodes', document.getElementsByTagName('*').length.toLocaleString());
                set('sysmon-resource-count', resources.length.toString());
                set('sysmon-load-time', `${loadMs} ms`);
                set('sysmon-windows-open', Object.values(SystemState.windows).filter(w => w.isOpen).length.toString());
                const state = localStorage.getItem('AetherOS_State') || '';
                set('sysmon-state-size', `${(state.length/1024).toFixed(1)} KB`);
                set('sysmon-agent', (navigator.userAgent || '').replace(/^Mozilla\//,'').slice(0,42));
                report.browser = { platform:navigator.platform, userAgent:navigator.userAgent, language:navigator.language, online:navigator.onLine, cookieEnabled:navigator.cookieEnabled };
                report.viewport = { width:window.innerWidth, height:window.innerHeight, dpr:window.devicePixelRatio || 1 };
                report.performance = { loadMs, resourceCount: resources.length, domNodes: document.getElementsByTagName('*').length, longTasks: os.sysmonTelemetry?.longTasks || 0 };
                report.app = { openWindows: Object.values(SystemState.windows).filter(w => w.isOpen).length, savedStateKB: Number((state.length/1024).toFixed(1)) };
                os.sysmonTelemetry.lastReport = report;
            },

    sysmonCopyReport: () => {
                const report = os.sysmonTelemetry?.lastReport || {};
                const lines = [
                    '=== AetherOS Diagnostic Report ===',
                    `Timestamp: ${new Date().toISOString()}`,
                    `UA: ${navigator.userAgent}`,
                    `Platform: ${navigator.platform || '--'}`,
                    `Online: ${navigator.onLine}`,
                    `CPU Cores: ${navigator.hardwareConcurrency || '--'}`,
                    `Device RAM: ${navigator.deviceMemory ? navigator.deviceMemory + ' GB' : '--'}`,
                    `Viewport: ${window.innerWidth}×${window.innerHeight} @${window.devicePixelRatio}x`,
                    `Heap: ${report.heap ? report.heap.usedMB + ' / ' + report.heap.limitMB + ' MB (' + report.heap.pct + '%)' : 'N/A'}`,
                    `Storage: ${report.storage ? report.storage.usedMB + ' MB / ' + report.storage.quotaMB + ' MB' : 'N/A'}`,
                    `Network: ${report.network ? report.network.effectiveType + ' @' + report.network.downlink + 'Mbps RTT ' + report.network.rtt + 'ms' : 'N/A'}`,
                    `Open Windows: ${report.app?.openWindows ?? '--'}`,
                    `Saved State: ${report.app?.savedStateKB ?? '--'} KB`,
                    `Load Time: ${report.performance?.loadMs ?? '--'} ms`,
                    `DOM Nodes: ${report.performance?.domNodes ?? '--'}`,
                    `Resources: ${report.performance?.resourceCount ?? '--'}`,
                    `Long Tasks: ${report.performance?.longTasks ?? '--'}`,
                    '=== Raw JSON ===',
                    JSON.stringify(report, null, 2)
                ];
                const text = lines.join('\n');
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(text).then(() => {
                        Notifications.push('DIAGNOSTICS', 'Report copied to clipboard');
                    });
                }
                os.logTerminal('System Diagnostics: Full telemetry report copied to clipboard.');
            },

    forceKillApp: (id) => {
                if (window.winManager) window.winManager.closeWindow(id);
                // Stop audio if it's a media/radio window
                if ((id === 'media' || id === 'radiobrowser') && os.audioStream) {
                    try { os.audioStream.pause(); os.audioStream.src = ''; } catch(e){}
                }
                // Clear intervals tagged to this module
                if (os._moduleIntervals && os._moduleIntervals[id]) {
                    os._moduleIntervals[id].forEach(i => clearInterval(i));
                    delete os._moduleIntervals[id];
                }
                os.logTerminal(`Task Manager: Force killed module [${id}]`);
                Notifications.push('TASK MGR', `Force killed: ${id}`);
            },

    _tmTab: 'processes',

    initTaskManager: () => {
                if (os._tmRefreshInterval) clearInterval(os._tmRefreshInterval);
                os.tmSwitchTab('processes');
                os._tmRefreshInterval = setInterval(() => {
                    if (document.getElementById('taskmanager-content')) os.tmRefreshData();
                }, 2000);
            },

    tmSwitchTab: (tab) => {
                os._tmTab = tab;
                const btns = { processes: 'tm-tab-proc', performance: 'tm-tab-perf' };
                Object.entries(btns).forEach(([t, id]) => {
                    const el = document.getElementById(id);
                    if (!el) return;
                    if (t === tab) el.className = 'hover-target cursor-none text-white font-bold border-b border-white pb-0.5';
                    else el.className = 'hover-target cursor-none text-gray-500 hover:text-white transition';
                });
                os.tmRefreshData();
            },

    tmRefresh: () => os.tmRefreshData(),

    tmRefreshData: () => {
                const root = document.getElementById('taskmanager-content');
                if (!root) return;
                if (os._tmTab === 'processes') {
                    const wins = Object.values(SystemState.windows);
                    const open = wins.filter(w => w.isOpen);
                    const closed = wins.filter(w => !w.isOpen);
                    const mem = performance.memory;
                    const totalMB = mem ? (mem.usedJSHeapSize / 1048576).toFixed(1) : '--';

                    root.innerHTML = `
                        <div class="p-3 h-full overflow-y-auto">
                            <div class="grid grid-cols-4 gap-1 text-[9px] text-gray-500 uppercase tracking-wider font-mono px-2 pb-1 border-b border-white/5 mb-1">
                                <span class="col-span-2">Process</span><span>Status</span><span class="text-right">Action</span>
                            </div>
                            ${open.map(w => `
                                <div class="grid grid-cols-4 gap-1 items-center px-2 py-1.5 rounded hover:bg-white/5 group">
                                    <div class="col-span-2 flex items-center gap-2 overflow-hidden">
                                        <i data-lucide="${w.icon || 'box'}" class="w-3 h-3 text-gray-400 flex-shrink-0"></i>
                                        <span class="text-[10px] text-white font-mono truncate">${os.escapeHtml(w.title)}</span>
                                    </div>
                                    <span class="text-[9px] font-mono text-green-400">RUNNING</span>
                                    <div class="flex justify-end gap-1">
                                        <button onclick="os.openWindow('${w.id}')" class="px-1.5 py-0.5 bg-white/5 hover:bg-white/15 rounded text-[8px] text-gray-300 cursor-none hover-target transition">Focus</button>
                                        <button onclick="os.forceKillApp('${w.id}')" class="px-1.5 py-0.5 bg-red-500/10 hover:bg-red-500/30 rounded text-[8px] text-red-400 cursor-none hover-target transition">Kill</button>
                                    </div>
                                </div>`).join('')}
                            ${closed.length ? `<div class="text-[9px] text-gray-600 uppercase tracking-widest font-mono px-2 py-2 mt-1">Inactive Processes (${closed.length})</div>` : ''}
                            ${closed.slice(0,8).map(w => `
                                <div class="grid grid-cols-4 gap-1 items-center px-2 py-1 opacity-40">
                                    <div class="col-span-2 flex items-center gap-2 overflow-hidden">
                                        <i data-lucide="${w.icon || 'box'}" class="w-3 h-3 text-gray-600 flex-shrink-0"></i>
                                        <span class="text-[10px] text-gray-500 font-mono truncate">${os.escapeHtml(w.title)}</span>
                                    </div>
                                    <span class="text-[9px] font-mono text-gray-600">IDLE</span>
                                    <div class="flex justify-end">
                                        <button onclick="os.openWindow('${w.id}')" class="px-1.5 py-0.5 bg-white/5 hover:bg-white/10 rounded text-[8px] text-gray-500 cursor-none hover-target transition">Launch</button>
                                    </div>
                                </div>`).join('')}
                            <div class="mt-2 pt-2 border-t border-white/5 text-[9px] font-mono text-gray-500 px-2">
                                JS Heap: <span class="text-white">${totalMB} MB</span> · Open: <span class="text-green-400">${open.length}</span> · Total: ${wins.length}
                            </div>
                        </div>`;
                    lucide.createIcons({root});
                } else {
                    const mem = performance.memory;
                    const heapUsed = mem ? (mem.usedJSHeapSize / 1048576).toFixed(1) : '--';
                    const heapTotal = mem ? (mem.jsHeapSizeLimit / 1048576).toFixed(0) : '--';
                    const heapPct = mem ? Math.round(mem.usedJSHeapSize / mem.jsHeapSizeLimit * 100) : 0;
                    const conn = navigator.connection || {};
                    const nodes = document.querySelectorAll('*').length;
                    root.innerHTML = `
                        <div class="p-3 space-y-3 overflow-y-auto h-full">
                            <div class="p-3 bg-white/3 border border-white/5 rounded-lg font-mono text-[10px]">
                                <div class="text-[9px] text-os-accent uppercase tracking-widest mb-2">Memory</div>
                                <div class="flex justify-between mb-1"><span class="text-gray-400">JS Heap Used</span><span class="text-white font-bold">${heapUsed} MB / ${heapTotal} MB</span></div>
                                <div class="w-full h-2 bg-black/60 rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r from-green-500 to-yellow-500 rounded-full" style="width:${heapPct}%"></div></div>
                                <div class="text-gray-600 mt-1">${heapPct}% utilization</div>
                            </div>
                            <div class="p-3 bg-white/3 border border-white/5 rounded-lg font-mono text-[10px]">
                                <div class="text-[9px] text-os-accent uppercase tracking-widest mb-2">Network</div>
                                <div class="flex justify-between"><span class="text-gray-400">Type</span><span class="text-white">${(conn.effectiveType || conn.type || '--').toUpperCase()}</span></div>
                                <div class="flex justify-between mt-1"><span class="text-gray-400">Downlink</span><span class="text-green-400">${conn.downlink ?? '--'} Mbps</span></div>
                                <div class="flex justify-between mt-1"><span class="text-gray-400">RTT</span><span class="text-white">${conn.rtt ?? '--'} ms</span></div>
                            </div>
                            <div class="p-3 bg-white/3 border border-white/5 rounded-lg font-mono text-[10px]">
                                <div class="text-[9px] text-os-accent uppercase tracking-widest mb-2">DOM</div>
                                <div class="flex justify-between"><span class="text-gray-400">Total Nodes</span><span class="text-white font-bold">${nodes.toLocaleString()}</span></div>
                                <div class="flex justify-between mt-1"><span class="text-gray-400">CPU Cores</span><span class="text-white">${navigator.hardwareConcurrency || '--'}</span></div>
                                <div class="flex justify-between mt-1"><span class="text-gray-400">Device RAM</span><span class="text-white">${navigator.deviceMemory ? navigator.deviceMemory + ' GB' : '--'}</span></div>
                            </div>
                        </div>`;
                }
            },

    initSpeedTestUI: () => {
                const curve = document.getElementById('speed-chart-curve');
                if (!curve) return;
                curve.innerHTML = '';
                for (let i = 0; i < 30; i++) {
                    const bar = document.createElement('div');
                    bar.className = 'flex-1 bg-white/10 h-full transition-transform duration-100';
                    bar.style.transform = 'scaleY(0.05)';
                    bar.style.transformOrigin = 'bottom';
                    curve.appendChild(bar);
                }
            },

    updateSpeedTestCurve: (speedMbps) => {
                const curve = document.getElementById('speed-chart-curve');
                if (!curve) return;
                const bars = curve.children;
                if (bars.length === 0) return;

                for (let i = 0; i < bars.length - 1; i++) {
                    bars[i].style.transform = bars[i + 1].style.transform;
                }
                const maxExpectedMbps = 500; 
                const scalingFactor = Math.min(1, speedMbps / maxExpectedMbps);
                bars[bars.length - 1].style.transform = `scaleY(${Math.max(0.05, scalingFactor)})`;
            },

    updateGaugeArc: (value, maxVal = 500) => {
                const progressCircle = document.getElementById('gauge-progress');
                if (!progressCircle) return;
                const radius = progressCircle.r.baseVal.value;
                const circumference = 2 * Math.PI * radius;
                
                const percentage = Math.min(value / maxVal, 1);
                const offset = circumference - (percentage * circumference);
                progressCircle.style.strokeDashoffset = offset;
            },

    runSpeedTest: async () => {
                const startBtn = document.getElementById('speedtest-btn');
                const phaseLabel = document.getElementById('speedtest-phase');
                const speedVal = document.getElementById('speed-meter-val');
                const pingVal = document.getElementById('speed-ping-val');
                const jitterVal = document.getElementById('speed-jitter-val');
                const dlVal = document.getElementById('speed-dl-val');
                const ulVal = document.getElementById('speed-ul-val');
                const ipVal = document.getElementById('speed-client-ip');
                const locVal = document.getElementById('speed-client-loc');

                if (!startBtn || startBtn.disabled) return;
                startBtn.disabled = true;
                startBtn.innerText = "TESTING ACTIVE...";
                startBtn.classList.add('opacity-50');

                pingVal.innerHTML = `-- <span class="text-[10px] text-gray-500">ms</span>`;
                jitterVal.innerHTML = `-- <span class="text-[10px] text-gray-500">ms</span>`;
                dlVal.innerHTML = `-- <span class="text-[10px] text-gray-500">Mbps</span>`;
                ulVal.innerHTML = `-- <span class="text-[10px] text-gray-500">Mbps</span>`;
                os.updateGaugeArc(0, 500);
                os.initSpeedTestUI();

                os.logTerminal("SpeedTest: Initiating real Cloudflare diagnostic sequence...");

                const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
                const maxScale = 500;

                // Phase 0: Topology Scanning
                phaseLabel.innerText = "SCANNING TOPOLOGY";
                try {
                    const traceRes = await fetch('https://cloudflare.com/cdn-cgi/trace', { cache: 'no-store', signal: AbortSignal.timeout(6000) });
                    if (!traceRes.ok) throw new Error(`HTTP ${traceRes.status}`);
                    const traceText = await traceRes.text();
                    const lines = traceText.split('\n');
                    let ip = 'UNKNOWN', loc = 'UNKNOWN', colo = 'UNKNOWN';
                    lines.forEach(line => {
                        if (line.startsWith('ip=')) ip = line.split('=')[1];
                        if (line.startsWith('loc=')) loc = line.split('=')[1];
                        if (line.startsWith('colo=')) colo = line.split('=')[1];
                    });
                    ipVal.innerText = ip;
                    locVal.innerText = `${colo} DATA CENTER (${loc})`;
                } catch(e) {
                    ipVal.innerText = "RESTRICTED / CORS";
                    locVal.innerText = navigator.onLine ? "TRACE ENDPOINT BLOCKED" : "OFFLINE";
                }

                // Phase 1: Latency Analysis (real HTTP RTT probes only)
                phaseLabel.innerText = "LATENCY ANALYSIS";
                os.updateGaugeArc(20, maxScale);

                const pings = [];
                const pingUrl = 'https://speed.cloudflare.com/__down?bytes=0';
                for (let i = 0; i < 5; i++) {
                    const start = performance.now();
                    try {
                        const r = await fetch(`${pingUrl}&_=${Date.now()}_${i}`, { mode: 'cors', cache: 'no-store', signal: AbortSignal.timeout(4000) });
                        if (r.ok) pings.push(performance.now() - start);
                    } catch (e) {}
                    await new Promise(r => setTimeout(r, 50));
                }

                if (pings.length > 0) {
                    pings.sort((a,b) => a-b);
                    const bestPings = pings.slice(0, Math.min(4, pings.length));
                    const avgPing = bestPings.reduce((a,b) => a+b, 0) / bestPings.length;
                    let jitterSum = 0;
                    for (let i = 1; i < bestPings.length; i++) {
                        jitterSum += Math.abs(bestPings[i] - bestPings[i-1]);
                    }
                    const avgJitter = bestPings.length > 1 ? jitterSum / (bestPings.length - 1) : 0;
                    pingVal.innerHTML = `${avgPing.toFixed(1)} <span class="text-[10px] text-gray-500">ms</span>`;
                    jitterVal.innerHTML = `${avgJitter.toFixed(1)} <span class="text-[10px] text-gray-500">ms</span>`;
                } else if (conn && typeof conn.rtt === 'number' && conn.rtt > 0) {
                    pingVal.innerHTML = `${conn.rtt} <span class="text-[10px] text-gray-500">ms (nav)</span>`;
                    jitterVal.innerHTML = `N/A`;
                } else {
                    pingVal.innerHTML = `<span class="text-yellow-400 text-xs">BLOCKED</span>`;
                    jitterVal.innerHTML = `N/A`;
                }

                // Phase 2: Downlink Stress (real stream measurement; honest fallback if blocked)
                phaseLabel.innerText = "DOWNLINK PROBE";
                let dlSpeed = null;
                try {
                    const dlBytesTarget = 10000000;
                    const dlUrl = `https://speed.cloudflare.com/__down?bytes=${dlBytesTarget}&_=${Date.now()}`;
                    const start = performance.now();
                    const response = await fetch(dlUrl, { cache: 'no-store', signal: AbortSignal.timeout(12000) });
                    if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
                    const reader = response.body.getReader();
                    let receivedLength = 0;
                    let lastTick = performance.now();
                    let bytesSinceLastTick = 0;

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        receivedLength += value.length;
                        bytesSinceLastTick += value.length;

                        const now = performance.now();
                        const tickDuration = (now - lastTick) / 1000;
                        if (tickDuration > 0.1) {
                            const instSpeed = ((bytesSinceLastTick * 8) / tickDuration) / 1000000;
                            speedVal.innerText = instSpeed.toFixed(1);
                            os.updateGaugeArc(instSpeed, maxScale);
                            os.updateSpeedTestCurve(instSpeed);
                            lastTick = now;
                            bytesSinceLastTick = 0;
                        }
                    }
                    const totalDuration = Math.max(0.001, (performance.now() - start) / 1000);
                    if (receivedLength > 0) {
                        dlSpeed = ((receivedLength * 8) / totalDuration) / 1000000;
                        speedVal.innerText = dlSpeed.toFixed(1);
                        os.updateGaugeArc(dlSpeed, maxScale);
                    }
                } catch (e) {
                    dlSpeed = null;
                }

                if (dlSpeed !== null) {
                    dlVal.innerHTML = `${dlSpeed.toFixed(1)} <span class="text-[10px] text-gray-500">Mbps</span>`;
                } else if (conn && typeof conn.downlink === 'number' && conn.downlink > 0) {
                    dlVal.innerHTML = `${conn.downlink.toFixed(1)} <span class="text-[10px] text-gray-500">Mbps (nav)</span>`;
                } else {
                    dlVal.innerHTML = `<span class="text-yellow-400 text-xs">BLOCKED</span>`;
                }

                await new Promise(r => setTimeout(r, 300));
                os.initSpeedTestUI();

                // Phase 3: Uplink Probe (real POST measurement; honest fallback if blocked)
                phaseLabel.innerText = "UPLINK PROBE";
                let ulSpeed = null;
                try {
                    const uploadSize = 4000000;
                    const uploadBlob = new Blob([new Uint8Array(uploadSize)]);
                    const start = performance.now();
                    const upRes = await fetch('https://speed.cloudflare.com/__up', {
                        method: 'POST',
                        body: uploadBlob,
                        cache: 'no-store',
                        signal: AbortSignal.timeout(10000)
                    });
                    if (!upRes.ok) throw new Error(`HTTP ${upRes.status}`);
                    const duration = Math.max(0.001, (performance.now() - start) / 1000);
                    ulSpeed = ((uploadSize * 8) / duration) / 1000000;
                    speedVal.innerText = ulSpeed.toFixed(1);
                    os.updateGaugeArc(ulSpeed, maxScale);
                    os.updateSpeedTestCurve(ulSpeed);
                } catch (e) {
                    ulSpeed = null;
                }

                if (ulSpeed !== null) {
                    ulVal.innerHTML = `${ulSpeed.toFixed(1)} <span class="text-[10px] text-gray-500">Mbps</span>`;
                    phaseLabel.innerText = "DIAGNOSTICS COMPLETE";
                } else {
                    ulVal.innerHTML = `<span class="text-yellow-400 text-xs">BLOCKED</span>`;
                    phaseLabel.innerText = dlSpeed !== null ? "PARTIAL DIAGNOSTICS COMPLETE" : "PROBE BLOCKED BY NETWORK / CORS";
                }

                setTimeout(() => {
                    speedVal.innerText = "0.0";
                    os.updateGaugeArc(0, maxScale);
                }, 2000);

                startBtn.disabled = false;
                startBtn.innerText = "INITIALIZE UPLINK TEST";
                startBtn.classList.remove('opacity-50');
            }
});
