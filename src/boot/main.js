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
