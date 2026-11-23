// AetherOS — Runtime Error Collector, Boot Materialization & Background Schedulers
window.aetherErrorLog = window.aetherErrorLog || [];

(function(){
            const push = (type, message, stack) => {
                window.aetherErrorLog = window.aetherErrorLog || [];
                window.aetherErrorLog.push({ type, message: String(message || ''), stack: String(stack || ''), time: new Date().toLocaleTimeString() });
                if (window.aetherErrorLog.length > 150) window.aetherErrorLog.shift();
                try { if (window.os && document.getElementById('error-list')) window.os.errorConsoleRender(); } catch(_) {}
            };
            window.addEventListener('error', e => push('JS Error', e.message, e.error && e.error.stack));
            window.addEventListener('unhandledrejection', e => push('Unhandled Promise', e.reason && (e.reason.message || e.reason), e.reason && e.reason.stack));
        })();

window.onload = () => {
            SystemState.init();
            os.syncSystemPerformanceEngine();
            os.initSpeechSynthesis && os.initSpeechSynthesis();
            os.initCompanion && os.initCompanion();
            document.addEventListener('visibilitychange', () => os.handleWakeVisibilityChange && os.handleWakeVisibilityChange(), { passive: true });
            os.updateNoSleepUI && os.updateNoSleepUI();
            
            window.bgEngine = new BackgroundEngine();
            window.cursorEngine = new CursorEngine();
            window.winManager = new WindowManager();
            const CmdPaletteCtor = window.CommandPaletteClass || window.CommandPalette;
            window.cmdPalette = window.CommandPalette = new CmdPaletteCtor();

            window.winManager.init();
            os.syncFeatureGates && os.syncFeatureGates();
            window.AetherVFS && window.AetherVFS.init && window.AetherVFS.init();
            os.syncVirtualSpaces && os.syncVirtualSpaces();
            os.focusSyncTopbarPill && os.focusSyncTopbarPill();

            const bootSplash = document.getElementById('apple-boot-splash');
            if (bootSplash) {
                setTimeout(() => {
                    bootSplash.style.opacity = '0';
                    bootSplash.style.pointerEvents = 'none';
                    setTimeout(() => bootSplash.remove(), 460);
                }, 720);
            }

            // ══════════════════════════════════════════════════════════
            //  APPLE LIQUID GLASS ENGINE — Boot + Physics Interactions
            // ══════════════════════════════════════════════════════════
            (() => {
                if (!window.gsap) return;

                // ── 1. Boot Materialization ──────────────────────────
                const osLayer = document.getElementById('os-layer');
                const dock    = document.getElementById('dock');
                const header  = document.querySelector('#os-layer header');

                gsap.set(osLayer, { opacity: 0 });
                gsap.set(dock,    { opacity: 0, y: 24, scale: 0.94 });
                gsap.set(header,  { opacity: 0, y: -10 });

                const tl = gsap.timeline({ delay: 0.06 });
                tl.to(osLayer, { opacity: 1, duration: 0.38, ease: 'power2.out' })
                  .to(header,  { opacity: 1, y: 0, duration: 0.34, ease: 'power3.out' }, '-=0.24')
                  .to(dock,    { opacity: 1, y: 0, scale: 1, duration: 0.46,
                                 ease: 'back.out(1.5)' }, '-=0.20');

                // ── 2. Subtle Wallpaper Parallax (Cinematic Mode Only, RAF-gated) ──
                const wall = document.getElementById('lg-wallpaper');
                if (wall) {
                    let wallPending = false, lastX = 0, lastY = 0;
                    document.addEventListener('mousemove', e => {
                        if (SystemState.settings.performance_mode !== 'cinematic') return;
                        lastX = e.clientX;
                        lastY = e.clientY;
                        if (wallPending) return;
                        wallPending = true;
                        requestAnimationFrame(() => {
                            wallPending = false;
                            const nx = (lastX / window.innerWidth  - 0.5) * 14;
                            const ny = (lastY / window.innerHeight - 0.5) * 10;
                            gsap.to(wall, {
                                x: nx, y: ny, duration: 1.8,
                                ease: 'power1.out', overwrite: 'auto'
                            });
                        });
                    }, { passive: true });
                }
            })();

            const runIdle = window.requestIdleCallback || ((fn) => setTimeout(fn, 800));
            if (os.isModuleEnabled('presence') && SystemState.settings.api_discord) {
                runIdle(() => os.initLanyardPresence());
            }

            window._aetherIntervals = window._aetherIntervals || [];
            window._aetherIntervals.push(setInterval(() => {
                if (!document.hidden && os.isModuleEnabled('media') && SystemState.settings.media_tuner_station === 'lastfm' && SystemState.settings.api_lastfm_user) {
                    os.fetchLastFmData();
                }
                if (os.sysMonitorCanvas) os.updateTrueSystemStats();
            }, 15000));

            window._aetherIntervals.push(setInterval(() => {
                if (!document.hidden && os.isModuleEnabled('feed')) os.fetchSignals();
            }, 45000));
            if (os.isModuleEnabled('feed')) {
                runIdle(() => os.fetchSignals());
            } 

            window._aetherIntervals.push(setInterval(() => {
                const clock = document.getElementById('sys-clock');
                if (clock) {
                    const d = new Date();
                    clock.innerText = d.toLocaleTimeString('en-US', { hour12: false });
                }
            }, 1000));

            // ── Real Network IO Engine using Resource Timing API + navigator.connection ──
            const _netConn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

            // Build mini chart bars
            const chart = document.getElementById('mini-chart');
            const netBars = [];
            for(let i = 0; i < 28; i++) {
                const bar = document.createElement('div');
                bar.style.cssText = 'flex:1;background:rgba(34,197,94,0.35);height:100%;transform:scaleY(0.12);transform-origin:bottom;border-radius:1px 1px 0 0;will-change:transform,background;transition:transform 0.25s ease-out,background 0.25s ease-out';
                chart && chart.appendChild(bar);
                netBars.push(bar);
            }
            const netHistory = Array(28).fill(0.12);
            // Activity signal from frame delta (browser busy = network-like activity)
            let _lastNetFrame = performance.now();
            let _netFrameAccum = 0;

            // Live connection info from navigator.connection
            const _netUpdateConn = () => {
                const typeEl = document.getElementById('net-io-type');
                const rttEl  = document.getElementById('net-io-rtt');
                const dlEl   = document.getElementById('net-io-dl');
                // Mini summary bar elements
                const typeMini = document.getElementById('net-io-type-mini');
                const rttMini  = document.getElementById('net-io-rtt-mini');
                const dlMini   = document.getElementById('net-io-dl-mini');
                if (_netConn) {
                    const etype = (_netConn.effectiveType || _netConn.type || '--').toUpperCase();
                    const rtt = _netConn.rtt != null ? _netConn.rtt + 'ms' : '--ms';
                    const dl = _netConn.downlink != null ? _netConn.downlink + ' Mbps' : '-- Mbps';
                    if (typeEl) typeEl.innerText = etype;
                    if (rttEl)  rttEl.innerText  = rtt;
                    if (dlEl)   dlEl.innerText   = dl;
                    if (typeMini) typeMini.innerText = etype;
                    if (rttMini)  rttMini.innerText  = rtt;
                    if (dlMini)   dlMini.innerText   = dl;
                } else {
                    if (typeEl) typeEl.innerText = 'UNKNOWN';
                    if (typeMini) typeMini.innerText = 'UNKNOWN';
                }
            };
            _netUpdateConn();
            if (_netConn) _netConn.addEventListener('change', _netUpdateConn);

            // Resource Timing scanner — real transferred bytes + request count + avg latency
            let _rtLastCount = 0;
            window._aetherIntervals.push(setInterval(() => {
                if (document.hidden) return;

                // Live connection refresh
                _netUpdateConn();

                // Resource Timing API — read real page resource data
                const entries = typeof performance.getEntriesByType === 'function' ? performance.getEntriesByType('resource') : [];
                const totalReqs = entries.length;
                const newReqs = totalReqs - _rtLastCount;
                _rtLastCount = totalReqs;

                // Calculate total transferred bytes and avg latency from timing entries
                let totalBytes = 0, totalDuration = 0, countWithDuration = 0;
                entries.forEach(e => {
                    if (e.transferSize) totalBytes += e.transferSize;
                    if (e.duration > 0) { totalDuration += e.duration; countWithDuration++; }
                });
                const avgLatency = countWithDuration ? Math.round(totalDuration / countWithDuration) : 0;
                const transferredKB = (totalBytes / 1024).toFixed(1);

                // Update DOM
                const reqsEl      = document.getElementById('net-io-reqs');
                const transferEl  = document.getElementById('net-io-transferred');
                const latencyEl   = document.getElementById('net-io-avglatency');
                const ulEl        = document.getElementById('net-io-ul');
                if (reqsEl)     reqsEl.innerText     = totalReqs + ' total';
                const transferText = transferredKB > 1024 ? (transferredKB/1024).toFixed(2) + ' MB' : transferredKB + ' KB';
                if (transferEl) transferEl.innerText = transferText;
                if (latencyEl)  latencyEl.innerText  = avgLatency + 'ms';
                if (ulEl)       ulEl.innerText       = `+${newReqs} new req${newReqs !== 1 ? 's' : ''}`;
                // Update mini summary
                const transferMini = document.getElementById('net-io-transferred-mini');
                if (transferMini) transferMini.innerText = transferText;

                // Bar chart: blend real new-requests with frame-delta activity proxy
                const now = performance.now();
                const frameDelta = now - _lastNetFrame;
                _lastNetFrame = now;
                _netFrameAccum = _netFrameAccum * 0.7 + Math.min(50, Math.max(0, frameDelta - 16)) * 0.3;
                const busySignal = Math.min(1, _netFrameAccum / 20);
                const reqSignal = Math.min(1, newReqs / 4);
                const load = Math.max(reqSignal, busySignal * 0.6);
                const barVal = Math.max(0.08, Math.min(1, load));
                netHistory.shift();
                netHistory.push(barVal);
                netBars.forEach((bar, i) => {
                    const v = netHistory[i];
                    bar.style.transform = `scaleY(${v})`;
                    bar.style.background = v > 0.7 ? 'rgba(255,255,255,0.9)' : v > 0.45 ? 'rgba(74,222,128,0.85)' : v > 0.25 ? 'rgba(34,197,94,0.65)' : 'rgba(34,197,94,0.35)';
                });
            }, 1000));

            const updateNetworkStatus = () => {
                const uplinkEl = document.getElementById('sys-uplink-status');
                if (uplinkEl) {
                    if (navigator.onLine) {
                        uplinkEl.innerHTML = `<i data-lucide="wifi" class="w-3 h-3 text-green-500"></i> <span class="text-green-500">UPLINK_OK</span>`;
                    } else {
                        uplinkEl.innerHTML = `<i data-lucide="wifi-off" class="w-3 h-3 text-red-500"></i> <span class="text-red-500">OFFLINE</span>`;
                    }
                    lucide.createIcons({root: uplinkEl});
                }
            };
            window.addEventListener('online', updateNetworkStatus);
            window.addEventListener('offline', updateNetworkStatus);
            updateNetworkStatus();

            if (document.getElementById('terminal-out')) os.initDataStream();

            document.querySelectorAll('img').forEach(img => {
                img.loading = img.loading || 'lazy';
                img.decoding = img.decoding || 'async';
            });
            lucide.createIcons();
            

        };
