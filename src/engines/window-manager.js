// AetherOS — Window Compositor, Genie Mesh Animation, Dock Physics & Previews
class WindowManager {
            constructor() {
                this.canvas = document.getElementById('window-canvas');
                this.dock = document.getElementById('dock');
                this.DOMWindows = {};
                this._genieAnims = {};
                this._lastDockAnchors = {};
            }

            init() {
                gsap.registerPlugin(Draggable);
                this.renderDock();
                Object.values(SystemState.windows).forEach(win => {
                    if (win.isOpen && !win.isMinimized) {
                        this.createWindowDOM(win);
                    }
                });
                this.renderDock();
                this.updateTopBarAppInfo();
                lucide.createIcons();
                window._topHealthHistory = { cpu: Array(12).fill(2), ram: Array(12).fill(5) };
                os.initTopBarTelemetry();
                os.updateSystemIndicators(true);
                // Refresh battery/network state every 30s; weather inside updateSystemIndicators is cached for 15 min
                setInterval(() => {
                    this.updateTopBarAppInfo();
                    os.updateSystemIndicators(false);
                }, 30000);
                let resizeFrame=null;
                const resize=()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>this.clampAllOpenWindows());};
                window.addEventListener('resize',resize,{passive:true});
                window.visualViewport?.addEventListener('resize',resize,{passive:true});
            }

            updateTopBarAppInfo() {
                const openWins = Object.values(SystemState.windows).filter(w => w && w.isOpen).length;
                const winCountEl = document.getElementById('window-count');
                if (winCountEl) winCountEl.innerText = `${openWins} Window${openWins === 1 ? '' : 's'}`;
                const topWin = Object.values(SystemState.windows)
                    .filter(w => w && w.isOpen && !w.isMinimized)
                    .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))[0];
                const activeAppEl = document.getElementById('active-app-name');
                if (activeAppEl) {
                    activeAppEl.innerText = topWin ? topWin.title : 'AetherOS';
                    let icon = document.getElementById('active-app-icon');
                    if (!icon) { icon = document.createElement('span'); icon.id = 'active-app-icon'; activeAppEl.before(icon); }
                    icon.innerHTML = window.AetherDesign?.appIcon(topWin?.id || 'finder', 19, 'plain') || '';
                }
            }

            _computeClampedBounds(winData) {
                const rect = this.canvas?.getBoundingClientRect?.() || { width: window.innerWidth, height: window.innerHeight - 38 };
                const availW = Math.max(280, Math.min(rect.width || window.innerWidth,window.visualViewport?.width||window.innerWidth));
                const dockClearance = window.innerWidth < 768 ? 72 : 84;
                const availH = Math.max(220, (rect.height || (window.innerHeight - 38)) - dockClearance);
                const pad = window.innerWidth < 640 ? 6 : 12;
                const w = Math.min(Math.max(280, winData.width || 650), Math.max(280, availW - pad * 2));
                const h = Math.min(Math.max(200, winData.height || 500), Math.max(200, availH - pad));
                const maxX = Math.max(pad, availW - w - pad);
                const maxY = Math.max(6, availH - h);
                const x = Math.min(Math.max(pad, Number.isFinite(winData.x) ? winData.x : pad), maxX);
                const y = Math.min(Math.max(6, Number.isFinite(winData.y) ? winData.y : 12), maxY);
                return { x, y, width: w, height: h };
            }

            clampAllOpenWindows() {
                Object.values(SystemState.windows).forEach(win => {
                    if (!win || !win.isOpen || win.isMinimized) return;
                    const el = this.DOMWindows[win.id];
                    if (!el) return;
                    if (el.dataset.maximized === 'true') {
                        const rect = this.canvas?.getBoundingClientRect?.() || { width: window.innerWidth, height: window.innerHeight - 38 };
                        const dockClearance = window.innerWidth < 768 ? 70 : 82;
                        el.style.width = `${Math.max(280, Math.min(rect.width,window.innerWidth) - 12)}px`;
                        el.style.height = `${Math.max(220, rect.height - dockClearance)}px`;
                        gsap.set(el, { x: 6, y: 6 });
                        return;
                    }
                    const b = this._computeClampedBounds(win);
                    el.style.width = `${b.width}px`;
                    el.style.height = `${b.height}px`;
                    gsap.set(el, { x: b.x, y: b.y });
                });
            }

            toggleMaximizeWindow(id) {
                const el = this.DOMWindows[id];
                const winData = SystemState.windows[id];
                if (!el || !winData) return;
                this.bringToFront(id);
                const rect = this.canvas?.getBoundingClientRect?.() || { width: window.innerWidth, height: window.innerHeight - 38 };
                const dockClearance = window.innerWidth < 768 ? 70 : 82;
                if (el.dataset.maximized === 'true') {
                    el.dataset.maximized = 'false';
                    const restore = winData._restoreRect || { x: winData.x, y: winData.y, width: winData.width, height: winData.height };
                    const b = this._computeClampedBounds(restore);
                    winData.x = b.x;
                    winData.y = b.y;
                    winData.width = restore.width || b.width;
                    winData.height = restore.height || b.height;
                    gsap.to(el, { x: b.x, y: b.y, width: b.width, height: b.height, duration: 0.24, ease: 'power2.out' });
                } else {
                    winData._restoreRect = {
                        x: Number(gsap.getProperty(el, 'x')) || winData.x,
                        y: Number(gsap.getProperty(el, 'y')) || winData.y,
                        width: parseInt(el.style.width, 10) || winData.width,
                        height: parseInt(el.style.height, 10) || winData.height
                    };
                    el.dataset.maximized = 'true';
                    const targetW = Math.max(280, Math.min(rect.width,window.innerWidth) - 12);
                    const targetH = Math.max(220, rect.height - dockClearance);
                    gsap.to(el, { x: 6, y: 6, width: targetW, height: targetH, duration: 0.24, ease: 'power2.out' });
                }
                SystemState.save();
            }

            createWindowDOM(winData) {
                const existing = document.getElementById(`win-${winData.id}`);
                if (existing) {
                    if (this._genieAnims[winData.id]?.closing) {
                        this._cancelGenie(winData.id);
                        const d = Draggable.get(existing);
                        if (d) d.kill();
                        existing.remove();
                        delete this.DOMWindows[winData.id];
                        this._killWindowProcesses(winData.id);
                    } else {
                        return;
                    }
                }

                const bounds = this._computeClampedBounds(winData);
                const el = document.createElement('div');
                el.id = `win-${winData.id}`;
                el.className = `os-window tactile-panel shadow-os-panel`;
                el.setAttribute('role', 'dialog');
                el.setAttribute('aria-label', winData.title || winData.id);
                el.style.width = `${bounds.width}px`;
                el.style.height = `${bounds.height}px`;
                el.style.visibility = 'hidden';
                el.style.left = '0px';
                el.style.top = '0px';
                gsap.set(el, { x: bounds.x, y: bounds.y, zIndex: winData.zIndex });

                el.innerHTML = `
                    <div class="window-header border-b flex items-center justify-between px-4 hover-target" style="height:42px;flex-shrink:0;position:relative">
                        <!-- Traffic Lights -->
                        <div class="flex items-center gap-[7px]" style="position:relative;z-index:2">
                            <button type="button" class="win-btn-close hover-target cursor-none" style="border-radius:50%;border:none;display:block;transition:filter .12s,transform .12s" title="Close" aria-label="Close ${window.escapeAetherHtml(winData.title)}"></button>
                            <button type="button" class="win-btn-min hover-target cursor-none" style="border-radius:50%;border:none;display:block;transition:filter .12s,transform .12s" title="Minimize" aria-label="Minimize ${window.escapeAetherHtml(winData.title)}"></button>
                            <button type="button" class="win-btn-max hover-target cursor-none" style="border-radius:50%;border:none;display:block;transition:filter .12s,transform .12s" title="Maximize / Restore" aria-label="Maximize ${window.escapeAetherHtml(winData.title)}"></button>
                        </div>
                        <!-- Centered Title -->
                        <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;align-items:center;gap:7px;pointer-events:none;z-index:1;max-width:calc(100% - 130px)">
                            ${window.AetherDesign?.appIcon(winData.id, 19, 'plain') || ''}
                            <span style="font:500 12px/1 'Inter',sans-serif;letter-spacing:-0.02em;color:rgba(255,255,255,0.78);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 3px rgba(0,0,0,0.4)">${window.escapeAetherHtml(winData.title)}</span>
                        </div>
                        <!-- Source-backed app guide and window controls -->
                        <div class="flex items-center justify-end gap-1 win-header-tools" style="width:90px;position:relative;z-index:2">
                            <button type="button" class="win-hdr-action hover-target" onclick="window.AetherAppDetails?.show('${winData.id}')" title="App sources and limitations" aria-label="Sources and limitations for ${window.escapeAetherHtml(winData.title)}"><i data-lucide="info" style="width:11px;height:11px"></i></button>
                            <button type="button" class="win-hdr-action win-btn-snap-l hover-target cursor-none" title="Snap Left 50% (Alt+←)" aria-label="Snap Left"><i data-lucide="panel-left" style="width:11px;height:11px"></i></button>
                            <button type="button" class="win-hdr-action win-btn-snap-r hover-target cursor-none" title="Snap Right 50% (Alt+→)" aria-label="Snap Right"><i data-lucide="panel-right" style="width:11px;height:11px"></i></button>
                            <button type="button" class="win-hdr-action win-btn-pin ${winData.pinned ? 'pinned' : ''} hover-target cursor-none" title="Always on Top across Spaces" aria-label="Pin Always on Top"><i data-lucide="pin" style="width:11px;height:11px"></i></button>
                        </div>
                    </div>
                    <div class="flex-1 relative overflow-hidden" style="background:rgba(5,5,10,0.92)">
                        ${WindowContents[winData.content] || ''}
                    </div>
                    <div class="win-resize-edge win-resize-e" data-resize="e"></div>
                    <div class="win-resize-edge win-resize-s" data-resize="s"></div>
                    <div class="win-resize-edge win-resize-w" data-resize="w"></div>
                    <div class="win-resize-edge win-resize-sw" data-resize="sw"></div>
                    <div class="window-resizer hover-target" data-resize="se"></div>
                `;

                this.canvas.appendChild(el);
                window.AetherFleetWorkspaces?.mount(el, winData.id);
                window.AetherWindowSurfaces?.mount(el);
                this.DOMWindows[winData.id] = el;
                if (winData.pinned) el.style.zIndex = 5000 + (winData.zIndex || 1);

                el.addEventListener('mousedown', () => this.bringToFront(winData.id), {passive: true});
                el.querySelector('.win-btn-close').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.closeWindow(winData.id);
                });
                el.querySelector('.win-btn-min').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.minimizeWindow(winData.id);
                });
                el.querySelector('.win-btn-max').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleMaximizeWindow(winData.id);
                });
                el.querySelector('.win-btn-snap-l').addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.WindowSnapManager && WindowSnapManager.snapWindow(winData.id, 'left');
                });
                el.querySelector('.win-btn-snap-r').addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.WindowSnapManager && WindowSnapManager.snapWindow(winData.id, 'right');
                });
                el.querySelector('.win-btn-pin').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.togglePinWindow(winData.id);
                });
                el.querySelector('.window-header').addEventListener('dblclick', (e) => {
                    if (e.target.closest('button')) return;
                    this.toggleMaximizeWindow(winData.id);
                });

                // Multi-Edge & Corner Window Resizing Logic (e, s, w, sw, se)
                el.querySelectorAll('[data-resize]').forEach((handle) => {
                    handle.addEventListener('mousedown', (e) => {
                        const dir = handle.getAttribute('data-resize') || 'se';
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const startWidth = parseInt(document.defaultView.getComputedStyle(el).width, 10) || winData.width || 640;
                        const startHeight = parseInt(document.defaultView.getComputedStyle(el).height, 10) || winData.height || 460;
                        const startWinX = Number(gsap.getProperty(el, 'x')) || winData.x || 0;

                        e.stopPropagation();
                        e.preventDefault();
                        document.querySelectorAll('iframe').forEach(ifr => ifr.style.pointerEvents = 'none');

                        const doDrag = (dragEvent) => {
                            const dx = dragEvent.clientX - startX;
                            const dy = dragEvent.clientY - startY;

                            if (dir.includes('e')) {
                                el.style.width = `${Math.max(320, startWidth + dx)}px`;
                            }
                            if (dir.includes('s')) {
                                el.style.height = `${Math.max(220, startHeight + dy)}px`;
                            }
                            if (dir.includes('w')) {
                                const nextW = Math.max(320, startWidth - dx);
                                const actualDelta = startWidth - nextW;
                                el.style.width = `${nextW}px`;
                                gsap.set(el, { x: startWinX + actualDelta });
                            }
                        };

                        const stopDrag = () => {
                            document.removeEventListener('mousemove', doDrag);
                            document.removeEventListener('mouseup', stopDrag);
                            document.querySelectorAll('iframe').forEach(ifr => ifr.style.pointerEvents = 'auto');

                            SystemState.windows[winData.id].width = parseInt(el.style.width, 10);
                            SystemState.windows[winData.id].height = parseInt(el.style.height, 10);
                            SystemState.windows[winData.id].x = Number(gsap.getProperty(el, 'x')) || SystemState.windows[winData.id].x;
                            delete SystemState.windows[winData.id]._snappedZone;
                            SystemState.save();
                            try {
                                const d = window.Draggable && Draggable.get(el);
                                if (d && d.update) d.update();
                            } catch (_) {}
                        };

                        document.addEventListener('mousemove', doDrag);
                        document.addEventListener('mouseup', stopDrag);
                    });
                });

                Draggable.create(el, {
                    type: "x,y",
                    trigger: el.querySelector('.window-header'),
                    bounds: { minY: 0, maxY: 9999, minX: -9999, maxX: 9999 },
                    edgeResistance: 0.65,
                    force3D: true, 
                    onPress: () => this.bringToFront(winData.id),
                    onDragStart: function() {
                        // Lift window on drag start
                        gsap.to(el, {
                            scale: 1.008,
                            duration: 0.18,
                            ease: 'power2.out',
                            overwrite: true
                        });
                        el.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.10), 0 8px 16px rgba(0,0,0,0.4), 0 32px 80px rgba(0,0,0,0.65), 0 60px 120px rgba(0,0,0,0.4)';
                    },
                    onDrag: function() {
                        if (window.WindowSnapManager) {
                            window.WindowSnapManager.onWindowDragMove(winData.id, this.pointerEvent);
                        }
                    },
                    onDragEnd: function() {
                        el.style.boxShadow = '';
                        if (window.WindowSnapManager && window.WindowSnapManager.onWindowDragEnd(winData.id)) {
                            return;
                        }
                        SystemState.windows[winData.id].x = this.x;
                        SystemState.windows[winData.id].y = this.y;
                        SystemState.save();
                        // Land window gently
                        gsap.to(el, {
                            scale: 1,
                            duration: 0.35,
                            ease: 'back.out(1.2)',
                            overwrite: true
                        });
                    }
                });

                this._genieIn(el, winData.id, winData);

                lucide.createIcons({root: el});
                
                if (winData.id === 'settings') {
                    os.switchSettingsTab(os._activeSettingsTab || 'general');
                } else if (winData.id === 'terminal') {
                    os.initDataStream();
                } else if (winData.id === 'media') {
                    os.renderMediaDashboard();
                } else if (winData.id === 'stickers') {
                    window.AetherMedia?.renderLibrary();
                } else if (winData.id === 'radiobrowser') {
                    os.initRadioBrowser();
                } else if (winData.id === 'sysmon') {
                    os.switchSysmonView('perf');
                } else if (winData.id === 'presence') {
                    os.renderPresenceDashboard();
                } else if (winData.id === 'feed') {
                    os.initSignalFeed();
                } else if (winData.id === 'globe') {
                    os.initGlobe();
                } else if (winData.id === 'browser') {
                    os.initBrowser();
                } else if (winData.id === 'wplace') {
                    os.initWplace();
                } else if (winData.id === 'floor796') {
                    os.initFloor796();
                } else if (winData.id === 'market') {
                    os.initMarket();
                } else if (winData.id === 'memes') {
                    os.initMemes();
                } else if (winData.id === 'ytchtv') {
                    os.initYtchtv();
                } else if (winData.id === 'entityscanner') {
                    os.initEntityScanner();
                } else if (winData.id === 'filemanager') {
                    os.initFileManager();
                } else if (winData.id === 'wikiboard') {
                    os.initWikiBoard();
                } else if (winData.id === 'about') {
                    os.switchAboutTab('overview');
                } else if (winData.id === 'weather') {
                    os.initWeatherStation();
                } else if (winData.id === 'nasa') {
                    os.nasaLoadAPOD();
                } else if (winData.id === 'taskmanager') {
                    os.initTaskManager();
                } else if (winData.id === 'games') {
                    os.initGames();
                } else if (winData.id === 'iss') {
                    os.initISS();
                } else if (winData.id === 'anime') {
                    os.animeTrending();
                } else if (winData.id === 'manga') {
                    os.initManga();
                } else if (winData.id === 'aetherbridge') {
                    if (window.AetherBridgeAPI) AetherBridgeAPI.init();
                    if (window.lucide) setTimeout(() => lucide.createIcons(), 60);
                } else if (winData.id === 'aetherlink') {
                    if (window.AetherLinkAPI) AetherLinkAPI.init();
                    if (window.lucide) setTimeout(() => lucide.createIcons(), 60);
                } else if (winData.id === 'focus') {
                    os.initFocusStudio && os.initFocusStudio();
                } else if (winData.id === 'devpad') {
                    os.initDevPad && os.initDevPad();
                } else if (winData.id === 'kanban') {
                    os.initKanban && os.initKanban();
                } else if (winData.id === 'codeplay') {
                    os.initCodePlay && os.initCodePlay();
                } else if (winData.id === 'photobooth') {
                    os.initPhotoBooth && os.initPhotoBooth();
                } else if (winData.id === 'synthstudio') {
                    os.initSynthStudio && os.initSynthStudio();
                } else if (winData.id === 'earthpulse') {
                    os.initEarthPulse && os.initEarthPulse();
                } else if (winData.id === 'wayback') {
                    os.initWayback && os.initWayback();
                } else if (winData.id === 'ossradar') {
                    os.initOssRadar && os.initOssRadar();
                } else if (winData.id === 'photopea') {
                    os.initPhotopea && os.initPhotopea();
                } else if (winData.id === 'whiteboard') {
                    os.initWhiteboard && os.initWhiteboard();
                } else if (winData.id === 'winamp') {
                    os.initWinamp && os.initWinamp();
                } else if (winData.id === 'worldmuseums') {
                    os.initWorldMuseums && os.initWorldMuseums();
                } else if (winData.id === 'spacexhub') {
                    os.initSpaceXHub && os.initSpaceXHub();
                } else if (winData.id === 'worldfactbook') {
                    os.initWorldFactbook && os.initWorldFactbook();
                } else if (winData.id === 'gutendex') {
                    os.initGutendex && os.initGutendex();
                } else if (winData.id === 'shadertoy') {
                    os.initShadertoy && os.initShadertoy();
                } else if (winData.id === 'stellarium') {
                    os.initStellarium && os.initStellarium();
                } else if (winData.id === 'chiptune') {
                    os.initChiptune && os.initChiptune();
                } else if (winData.id === 'georadar') {
                    os.initGeoRadar && os.initGeoRadar();
                }
            }

            togglePinWindow(id) {
                const winData = SystemState.windows[id];
                if (!winData) return false;
                winData.pinned = !winData.pinned;
                const el = this.DOMWindows[id];
                if (el) {
                    const btn = el.querySelector('.win-btn-pin');
                    if (btn) btn.classList.toggle('pinned', winData.pinned);
                    el.style.zIndex = (winData.pinned ? 5000 : 0) + (winData.zIndex || SystemState.activeZIndex);
                }
                SystemState.save();
                if (window.Notifications) {
                    window.Notifications.push('WINDOW PIN', winData.pinned ? `"${winData.title}" pinned Always-on-Top across Spaces` : `"${winData.title}" unpinned`);
                }
                return winData.pinned;
            }

            bringToFront(id) {
                if (!SystemState.windows[id]) return;
                SystemState.activeZIndex++;
                SystemState.windows[id].zIndex = SystemState.activeZIndex;
                const el = this.DOMWindows[id];
                if (el) {
                    el.style.zIndex = (SystemState.windows[id].pinned ? 5000 : 0) + SystemState.activeZIndex;
                }
                SystemState.save();
                this.updateTopBarAppInfo();
                this.renderDock();
            }


            _captureDockAnchor(id, elementOrRect) {
                if (!id || !elementOrRect) return null;
                const canvasRect = this.canvas.getBoundingClientRect();
                const r = (typeof elementOrRect.getBoundingClientRect === 'function') ? elementOrRect.getBoundingClientRect() : elementOrRect;
                if (!r || !isFinite(r.left) || !isFinite(r.top)) return null;
                const anchor = {
                    x: r.left + r.width / 2 - canvasRect.left,
                    y: r.top + r.height / 2 - canvasRect.top,
                    w: Math.max(24, r.width || 36),
                    h: Math.max(24, r.height || 36),
                    t: performance.now()
                };
                this._lastDockAnchors[id] = anchor;
                return anchor;
            }

            _genieTargetRect(id, opts = {}) {
                const canvasRect = this.canvas.getBoundingClientRect();
                const now = performance.now();
                const stored = this._lastDockAnchors && this._lastDockAnchors[id];
                // A freshly clicked dock icon is the most accurate target. This fixes the
                // previous behaviour where opening could originate from a re-rendered dock
                // position instead of the actual icon the user pressed.
                if (stored && (opts.forceStored || now - stored.t < 1400)) {
                    return { x: stored.x, y: stored.y, w: stored.w, h: stored.h };
                }

                const icon = document.getElementById(`dock-item-${id}`) ||
                             document.getElementById(`dock-pin-${id}`) ||
                             document.getElementById('dock-finder-trigger');
                if (icon) {
                    const r = icon.getBoundingClientRect();
                    return {
                        x: r.left + r.width / 2 - canvasRect.left,
                        y: r.top + r.height / 2 - canvasRect.top,
                        w: Math.max(28, r.width),
                        h: Math.max(28, r.height)
                    };
                }
                const dockRect = this.dock?.getBoundingClientRect?.();
                if (dockRect) {
                    return {
                        x: dockRect.left + dockRect.width / 2 - canvasRect.left,
                        y: dockRect.top + dockRect.height / 2 - canvasRect.top,
                        w: 36,
                        h: 36
                    };
                }
                return { x: canvasRect.width / 2, y: canvasRect.height - 28, w: 36, h: 36 };
            }

            _killWindowProcesses(id) {
                window.AetherWindowSurfaces?.unmount(id);
                if (id === 'gutendex') os.gdDispose?.();
                if (id === 'weather') os.weatherDispose?.();
                if (id === 'ossradar') os.ossDispose?.();
                if (id === 'codeplay') os.codeplayStop?.(false);
                if (id === 'terminal') {
                    if (os.terminalStreamInterval) { clearInterval(os.terminalStreamInterval); os.terminalStreamInterval = null; }
                }
                if (id === 'taskmanager') os.tmDispose?.();
                if (id === 'media') {
                    if (os.spectrographInterval) { clearInterval(os.spectrographInterval); os.spectrographInterval = null; }
                    if (os.playbackTimerInterval) { clearInterval(os.playbackTimerInterval); os.playbackTimerInterval = null; }
                    if (os._spotifyGifCycleTimer) { clearInterval(os._spotifyGifCycleTimer); os._spotifyGifCycleTimer = null; }
                    if (os._spotifyCanvasRaf) { cancelAnimationFrame(os._spotifyCanvasRaf); os._spotifyCanvasRaf = null; }
                    if (os.pauseVerciVisualStage) os.pauseVerciVisualStage();
                }
                if (id === 'radiobrowser') {
                    if (os._rbVizRaf) { cancelAnimationFrame(os._rbVizRaf); os._rbVizRaf = null; }
                }
                if (id === 'presence') {
                    if (os.lanyardHeartbeat) { clearInterval(os.lanyardHeartbeat); os.lanyardHeartbeat = null; }
                    if (os.lanyardSocket && os.lanyardSocket.readyState <= 1) {
                        try { os.lanyardSocket._closingCleanly = true; os.lanyardSocket.close(); } catch(e) {}
                    }
                    os.lanyardSocket = null;
                }
                if (id === 'feed') {
                    os.feedDispose?.();
                    if (os.feedInterval) { clearInterval(os.feedInterval); os.feedInterval = null; }
                }
                if (id === 'devpad' && os.killDevPad) os.killDevPad();
                if (id === 'sysmon' && os.killSysMonitor) os.killSysMonitor();
                if (id === 'globe' && os.killGlobe) os.killGlobe();
                if (id === 'market' && os.killMarket) os.killMarket();
                if (id === 'memes' && os.killMemes) os.killMemes();
                if (id === 'iss' && os.killISS) os.killISS();
                if (id === 'ytchtv' && os.killYtchtv) os.killYtchtv();
                if (id === 'entityscanner' && os.killEntityScanner) os.killEntityScanner();
                if (id === 'wikiboard' && os.killWikiBoard) os.killWikiBoard();
                if (id === 'photobooth' && os.killPhotoBooth) os.killPhotoBooth();
                if (id === 'synthstudio' && os.killSynthStudio) os.killSynthStudio();
                if (id === 'photopea' && os.killPhotopea) os.killPhotopea();
                if (id === 'whiteboard' && os.killWhiteboard) os.killWhiteboard();
                if (id === 'earthpulse' && os.killEarthPulse) os.killEarthPulse();
                if (id === 'wayback' && os.killWayback) os.killWayback();
                if (id === 'winamp' && os.killWinamp) os.killWinamp();
                if (id === 'spacexhub' && os.killSpaceXHub) os.killSpaceXHub();
                if (id === 'worldmuseums' && os.killWorldMuseums) os.killWorldMuseums();
                if (id === 'shadertoy' && os.killShadertoy) os.killShadertoy();
                if (id === 'stellarium' && os.killStellarium) os.killStellarium();
                if (id === 'chiptune' && os.killChiptune) os.killChiptune();
                if (id === 'filemanager' && os.killFileManager) os.killFileManager();
                if (id === 'aetherlink' && window.AetherLinkAPI && typeof window.AetherLinkAPI.suspendUI === 'function') {
                    window.AetherLinkAPI.suspendUI();
                }
            }

            _clamp01(v) { return Math.max(0, Math.min(1, v)); }
            _lerp(a, b, t) { return a + (b - a) * t; }
            _smoothstep(a, b, x) {
                const t = this._clamp01((x - a) / Math.max(0.0001, b - a));
                return t * t * (3 - 2 * t);
            }
            _cubicBezier(x1, y1, x2, y2) {
                // x-to-y cubic bezier solver. Used by the custom RAF engine so the
                // deformation remains velocity-aware instead of relying on a generic scale tween.
                const cx = 3 * x1;
                const bx = 3 * (x2 - x1) - cx;
                const ax = 1 - cx - bx;
                const cy = 3 * y1;
                const by = 3 * (y2 - y1) - cy;
                const ay = 1 - cy - by;
                const sampleX = t => ((ax * t + bx) * t + cx) * t;
                const sampleY = t => ((ay * t + by) * t + cy) * t;
                return x => {
                    x = this._clamp01(x);
                    let lo = 0, hi = 1, t = x;
                    for (let i = 0; i < 10; i++) {
                        t = (lo + hi) * 0.5;
                        if (sampleX(t) < x) lo = t; else hi = t;
                    }
                    return sampleY(t);
                };
            }
            _springOut(t, stiffness = 9.8, damping = 6.6) {
                // Underdamped spring response with a mild overshoot, normalized at t=1.
                t = this._clamp01(t);
                const raw = 1 - Math.exp(-damping * t) * Math.cos(stiffness * t);
                const end = 1 - Math.exp(-damping) * Math.cos(stiffness);
                return raw / end;
            }

            _sanitizeGenieClone(clone) {
                clone.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
                clone.querySelectorAll('script').forEach(n => n.remove());
                clone.querySelectorAll('iframe, video, canvas').forEach(node => {
                    const ph = document.createElement('div');
                    ph.className = 'genie-media-placeholder';
                    ph.textContent = node.tagName.toLowerCase() === 'canvas' ? 'Live Canvas' : 'Live Surface';
                    const rect = node.getBoundingClientRect?.();
                    if (rect && rect.height) ph.style.minHeight = Math.min(Math.max(rect.height, 70), 260) + 'px';
                    node.replaceWith(ph);
                });
                clone.style.pointerEvents = 'none';
                clone.style.animationPlayState = 'paused';
                clone.querySelectorAll('*').forEach(n => {
                    n.style.pointerEvents = 'none';
                    n.style.animationPlayState = 'paused';
                });
                return clone;
            }

            _makeGenieLightContent(winData, w, h, top) {
                // Performance-critical: do NOT clone the full application DOM for every
                // mesh strip. The previous version duplicated iframes/canvases/large module
                // trees 12-22 times, which caused dropped frames. This lightweight visual
                // proxy preserves the premium window silhouette while the mesh deformation
                // remains the star of the effect.
                const shell = document.createElement('div');
                shell.className = 'genie-slice-content genie-light-window';
                shell.style.width = `${w}px`;
                shell.style.height = `${h}px`;
                shell.style.transform = `translate3d(0, ${-top}px, 0)`;
                shell.innerHTML = `
                    <div class="genie-light-header"><span class="genie-light-dot"></span><span>${(winData?.title || '').replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}</span></div>
                    <div class="genie-light-body"></div>
                `;
                return shell;
            }

            _makeGenieMesh(el, id) {
                const winData = SystemState.windows[id];
                const x = Number(gsap.getProperty(el, 'x')) || winData.x || 0;
                const y = Number(gsap.getProperty(el, 'y')) || winData.y || 0;
                const w = Math.max(1, el.offsetWidth || winData.width || 640);
                const h = Math.max(1, el.offsetHeight || winData.height || 420);
                const cinematic = SystemState.settings.performance_mode !== 'eco';
                // Lightweight proxy strips: zero full-DOM cloning and zero per-strip backdrop-filter
                const rows = cinematic ? 26 : 16;
                const sliceH = h / rows;
                const overlap = cinematic ? 2.5 : 1.75;
                const stage = document.createElement('div');
                stage.className = 'genie-mesh-stage';
                Object.assign(stage.style, {
                    width: `${w}px`,
                    height: `${h}px`,
                    zIndex: String((winData.zIndex || SystemState.activeZIndex || 50) + 3000),
                    opacity: '1'
                });

                const frag = document.createDocumentFragment();
                const slices = [];
                for (let i = 0; i < rows; i++) {
                    const s = document.createElement('div');
                    s.className = 'genie-mesh-slice';
                    const top = Math.max(0, i * sliceH - (i ? overlap * 0.5 : 0));
                    const visualH = Math.min(h - top, sliceH + overlap);
                    Object.assign(s.style, {
                        width: `${w}px`,
                        height: `${Math.ceil(visualH + 1)}px`,
                        clipPath: `inset(0 0 0 0 round ${i === 0 ? 12 : 0}px ${i === 0 ? 12 : 0}px ${i === rows - 1 ? 12 : 0}px ${i === rows - 1 ? 12 : 0}px)`
                    });
                    const light = this._makeGenieLightContent(winData, w, h, top);
                    s.appendChild(light);
                    frag.appendChild(s);
                    slices.push({ el: s, top, mid: top + visualH / 2, v: (i + 0.5) / rows, h: visualH, baseH: sliceH });
                }
                stage.appendChild(frag);
                this.canvas.appendChild(stage);
                return { stage, slices, x, y, w, h, rows, sliceH, overlap };
            }

            _cancelGenie(id) {
                const running = this._genieAnims && this._genieAnims[id];
                if (running) {
                    cancelAnimationFrame(running.raf);
                    running.mesh?.stage?.remove();
                    if (running.el) {
                        running.el.style.visibility = '';
                        running.el.style.pointerEvents = '';
                    }
                    delete this._genieAnims[id];
                }
            }

            _renderGenieMesh(mesh, target, fraction, global, opts = {}) {
                // Harshil Shah-inspired keyframed mesh model:
                // 1) bottom edge shears / shrinks toward the final dock rect while the
                //    top edge initially remains fixed;
                // 2) translation starts slightly before shearing finishes;
                // 3) every horizontal row samples left/right curved funnel paths.
                const f = this._clamp01(fraction);
                const dir = (target.x - (mesh.x + mesh.w / 2)) >= 0 ? 1 : -1;
                const slideEnd = 0.52;
                const translateStart = 0.38;
                const slideProgress = this._smoothstep(0, 1, this._clamp01(f / slideEnd));
                const translateProgress = (opts.translateEase || (x => this._smoothstep(0, 1, x)))(this._clamp01((f - translateStart) / (1 - translateStart)));

                const initialLeft = mesh.x;
                const initialRight = mesh.x + mesh.w;
                const initialTop = mesh.y;
                const initialBottom = mesh.y + mesh.h;

                const finalWBase = Math.max(18, Math.min((target.w || 42) * 0.90, mesh.w * 0.135));
                const finalHBase = Math.max(14, Math.min((target.h || 42) * 0.76, mesh.h * 0.095));
                const lateOvershoot = Math.sin(this._smoothstep(0.76, 1, global) * Math.PI) * (opts.reverse ? -4 : 7);
                const finalCenterX = target.x + dir * lateOvershoot;
                const finalCenterY = target.y + Math.sin(this._smoothstep(0.82, 1, global) * Math.PI) * (opts.reverse ? -2 : 4);
                const finalLeft = finalCenterX - finalWBase / 2;
                const finalRight = finalCenterX + finalWBase / 2;
                const finalTop = finalCenterY - finalHBase / 2;
                const finalBottom = finalCenterY + finalHBase / 2;

                const verticalDistance = finalTop - initialTop;
                const translation = translateProgress * verticalDistance;
                const topEdgeY = initialTop + translation;
                // Bottom moves/compresses faster than the top. This preserves the
                // blog's visual idea of the bottom edge arriving first, while staying
                // robust even if a user drags a window close to/over the dock.
                const bottomProgress = this._smoothstep(0, 1, this._clamp01(translateProgress * 1.34));
                const bottomEdgeY = this._lerp(initialBottom, finalBottom, bottomProgress);

                const leftBezierTopX = initialLeft;
                const rightBezierTopX = initialRight;
                const leftBezierBottomX = initialLeft + slideProgress * (finalLeft - initialLeft);
                const rightBezierBottomX = initialRight + slideProgress * (finalRight - initialRight);
                const bezierTopY = initialTop;
                const bezierBottomY = finalTop;
                const bezierHeight = Math.max(1, bezierBottomY - bezierTopY);
                const qEase = (p) => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
                const leftBezierX = (y) => {
                    if (y <= bezierTopY) return leftBezierTopX;
                    if (y >= bezierBottomY) return leftBezierBottomX;
                    const p = qEase((y - bezierTopY) / bezierHeight);
                    return this._lerp(leftBezierTopX, leftBezierBottomX, p);
                };
                const rightBezierX = (y) => {
                    if (y <= bezierTopY) return rightBezierTopX;
                    if (y >= bezierBottomY) return rightBezierBottomX;
                    const p = qEase((y - bezierTopY) / bezierHeight);
                    return this._lerp(rightBezierTopX, rightBezierBottomX, p);
                };

                const opacityCompression = this._smoothstep(0.78, 1, f);
                const windowOvershoot = opts.windowOvershoot || 0;
                for (let i = 0; i < mesh.slices.length; i++) {
                    const slice = mesh.slices[i];
                    const v0 = i / mesh.rows;
                    const v1 = (i + 1) / mesh.rows;
                    const y0 = this._lerp(topEdgeY, bottomEdgeY, v0);
                    const y1 = this._lerp(topEdgeY, bottomEdgeY, v1);
                    const l0 = leftBezierX(y0), r0 = rightBezierX(y0);
                    const l1 = leftBezierX(y1), r1 = rightBezierX(y1);
                    const c0 = (l0 + r0) * 0.5;
                    const c1 = (l1 + r1) * 0.5;
                    const w0 = Math.max(1, r0 - l0);
                    const w1 = Math.max(1, r1 - l1);
                    const rowW = Math.max(0.8, (w0 + w1) * 0.5) * (1 + windowOvershoot * (1 - f));
                    const rawRowH = Math.max(0.75, y1 - y0);
                    const rowH = rawRowH + (mesh.overlap || 0) * (1 - this._smoothstep(0.92, 1, f) * 0.55);
                    const cx = (c0 + c1) * 0.5;
                    const cy = (y0 + y1) * 0.5;
                    const sx = rowW / mesh.w;
                    const sy = rowH / slice.h;
                    const centerSlope = (c1 - c0) / Math.max(1, rowH);
                    const widthSlope = ((w1 - w0) / Math.max(1, rowH)) * 0.16;
                    const skew = Math.max(-26, Math.min(26, Math.atan(centerSlope + widthSlope * dir) * 180 / Math.PI));
                    const rot = Math.max(-4.5, Math.min(4.5, Math.atan(centerSlope) * 180 / Math.PI * 0.11));
                    slice.el.style.opacity = String(this._lerp(1, opts.endOpacity ?? 0.10, opacityCompression));
                    slice.el.style.transform = `translate3d(${(cx - mesh.w / 2).toFixed(3)}px, ${(cy - slice.h / 2).toFixed(3)}px, 0) rotateZ(${rot.toFixed(3)}deg) skewX(${skew.toFixed(3)}deg) scale3d(${sx.toFixed(5)}, ${sy.toFixed(5)}, 1)`;
                }
            }

            _animateGenie(el, id, direction = 'out', opts = {}) {
                if (!el || !SystemState.windows[id]) return null;
                this._cancelGenie(id);

                const winData = SystemState.windows[id];
                const reducedMotion = SystemState.settings.motion_intensity === 'off' ||
                    (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

                if (reducedMotion) {
                    el.style.visibility = '';
                    el.style.pointerEvents = '';
                    opts.onComplete && opts.onComplete();
                    return null;
                }

                const target = opts.target || this._genieTargetRect(id);
                const mesh = this._makeGenieMesh(el, id);
                const previousPointerEvents = el.style.pointerEvents;
                el.style.visibility = 'hidden';
                el.style.pointerEvents = 'none';

                const duration = opts.duration || (direction === 'in' ? 380 : (opts.close ? 300 : 340));
                const genieCompressEase = this._cubicBezier(0.52, 0.00, 0.86, 0.36);
                const genieTranslateEase = this._cubicBezier(0.18, 0.82, 0.22, 1.00);
                const start = performance.now();
                const controller = { raf: 0, mesh, el, closing: !!opts.close };
                this._genieAnims[id] = controller;

                const finish = () => {
                    mesh.stage.remove();
                    const b = this._computeClampedBounds(winData);
                    el.style.visibility = '';
                    el.style.pointerEvents = previousPointerEvents || '';
                    if (!opts.close) {
                        gsap.set(el, {
                            x: el.dataset.maximized === 'true' ? 6 : b.x,
                            y: el.dataset.maximized === 'true' ? 6 : b.y,
                            scaleX: 1,
                            scaleY: 1,
                            opacity: 1,
                            rotationX: 0,
                            rotationY: 0,
                            rotationZ: 0,
                            skewX: 0,
                            clearProps: 'willChange,filter,clipPath'
                        });
                    }
                    delete this._genieAnims[id];
                    opts.onComplete && opts.onComplete();
                };

                const frame = (now) => {
                    const u = this._clamp01((now - start) / duration);
                    if (direction === 'out') {
                        const fraction = genieCompressEase(u);
                        this._renderGenieMesh(mesh, target, fraction, u, {
                            endOpacity: opts.close ? 0 : 0.07,
                            translateEase: genieTranslateEase
                        });
                        mesh.stage.style.opacity = String(1 - this._smoothstep(0.84, 1, u) * (opts.close ? 0.85 : 0.45));
                    } else {
                        const springClock = Math.pow(u, 1.25);
                        const spring = this._springOut(springClock, 9.2, 6.6);
                        const expansion = this._smoothstep(0, 1, this._clamp01(spring));
                        const overshoot = Math.max(0, spring - 1);
                        const fraction = 1 - expansion;
                        this._renderGenieMesh(mesh, target, fraction, u, {
                            endOpacity: 0.08,
                            reverse: true,
                            translateEase: genieTranslateEase,
                            windowOvershoot: Math.min(0.04, overshoot * 0.08)
                        });
                        mesh.stage.style.opacity = String(this._smoothstep(0.01, 0.14, u));
                    }

                    if (u < 1) {
                        controller.raf = requestAnimationFrame(frame);
                    } else {
                        finish();
                    }
                };
                frame(start);
                return controller;
            }

            _genieIn(el, id, winData) {
                gsap.killTweensOf(el);
                const b = this._computeClampedBounds(winData);
                gsap.set(el, {
                    display: 'flex',
                    x: b.x,
                    y: b.y,
                    scaleX: 1,
                    scaleY: 1,
                    opacity: 1,
                    rotationX: 0,
                    rotationY: 0,
                    skewX: 0
                });
                const islandOrigin = window.AetherIsland?.consumeLaunchRect?.(id);
                const reduced = SystemState.settings.motion_intensity === 'off' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
                if (islandOrigin && !reduced) {
                    // Animate the real glass window from the companion bar;
                    // avoid cloned strip meshes and their extra layout work.
                    this._cancelGenie(id);
                    gsap.set(el, {visibility:'visible',transformOrigin:'50% 0%'});
                    return gsap.fromTo(el, {
                        x:islandOrigin.x+islandOrigin.width/2-b.width/2,
                        y:islandOrigin.y,
                        scaleX:Math.max(.08,islandOrigin.width/b.width),
                        scaleY:Math.max(.04,islandOrigin.height/b.height),
                        opacity:.2,borderRadius:30
                    }, {x:b.x,y:b.y,scaleX:1,scaleY:1,opacity:1,borderRadius:22,
                        duration:.46,ease:'power3.out',onComplete:()=>gsap.set(el,{clearProps:'borderRadius,transformOrigin'})});
                }
                return this._animateGenie(el, id, 'in', {
                    target: this._genieTargetRect(id),
                    duration: 380
                });
            }

            _genieOut(el, id, opts = {}) {
                gsap.killTweensOf(el);
                return this._animateGenie(el, id, 'out', {
                    target: opts.target || this._genieTargetRect(id),
                    close: !!opts.close,
                    duration: opts.duration || (opts.close ? 300 : 340),
                    onComplete: opts.onComplete
                });
            }

            closeWindow(id) {
                if (!SystemState.windows[id]) return;
                if (os.companion && os.companion.observeEvent) {
                    os.companion.observeEvent('window_close', { id });
                }
                const el = this.DOMWindows[id];
                const genieTarget = this._genieTargetRect(id);
                SystemState.windows[id].isOpen = false;
                SystemState.windows[id].isMinimized = false;
                SystemState.save();
                this.updateTopBarAppInfo();
                this.renderDock();

                if (el) {
                    this._genieOut(el, id, {
                        target: genieTarget,
                        close: true,
                        duration: 300,
                        onComplete: () => {
                            const d = Draggable.get(el);
                            if (d) d.kill();
                            el.remove();
                            if (this.DOMWindows[id] === el) delete this.DOMWindows[id];
                            this._killWindowProcesses(id);
                        }
                    });
                } else {
                    this._killWindowProcesses(id);
                }
            }

            minimizeWindow(id) {
                if (id === 'media') os.pauseVerciVisualStage?.();
                if (os.companion && os.companion.observeEvent) {
                    os.companion.observeEvent('window_minimize', { id });
                }
                const el = this.DOMWindows[id];
                if (!el) return;

                const genieTarget = this._genieTargetRect(id);
                SystemState.windows[id].isMinimized = true;
                SystemState.save();
                this.updateTopBarAppInfo();
                this.renderDock();

                this._genieOut(el, id, {
                    target: genieTarget,
                    onComplete: () => {
                        el.style.display = 'none';
                        const winData = SystemState.windows[id];
                        const b = this._computeClampedBounds(winData);
                        gsap.set(el, {
                            x: b.x,
                            y: b.y,
                            scaleX: 1,
                            scaleY: 1,
                            opacity: 1,
                            rotationX: 0,
                            rotationY: 0,
                            skewX: 0
                        });
                        if (id === 'sysmon') os.killSysMonitor();
                        if (id === 'memes') os.killMemes();
                        if (id === 'ytchtv') os.killYtchtv();
                        if (id === 'entityscanner') os.killEntityScanner();
                        if (id === 'wikiboard') os.killWikiBoard();
                        if (id === 'taskmanager') os.tmDispose?.();
                    }
                });
            }

            restoreWindow(id) {
                if (!SystemState.windows[id]) return;
                if (os.companion && os.companion.observeEvent) {
                    os.companion.observeEvent('window_restore', { id });
                }
                SystemState.windows[id].isMinimized = false;
                SystemState.windows[id].isOpen = true;
                this.bringToFront(id);
                SystemState.save();
                this.updateTopBarAppInfo();
                this.renderDock();

                let el = this.DOMWindows[id];
                if (!el) {
                    this.createWindowDOM(SystemState.windows[id]);
                    return;
                }

                const winData = SystemState.windows[id];
                const b = this._computeClampedBounds(winData);
                el.style.width = `${b.width}px`;
                el.style.height = `${b.height}px`;
                el.style.visibility = 'hidden';
                el.style.display = 'flex';
                this._genieIn(el, id, winData);

                if (id === 'sysmon') os.initSysMonitor();
                if (id === 'memes') os.initMemes();
                if (id === 'ytchtv') os.initYtchtv();
                if (id === 'entityscanner') os.initEntityScanner();
                if (id === 'wikiboard') os.initWikiBoard();
                if (id === 'filemanager') os.initFileManager();
                if (id === 'wplace') os.initWplace();
                if (id === 'floor796') os.initFloor796();
                if (id === 'taskmanager') os.initTaskManager();
                if (id === 'aetherbridge') { if(window.AetherBridgeAPI) AetherBridgeAPI.init(); if(window.lucide) lucide.createIcons({root: el}); }
                if (id === 'aetherlink') { if(window.AetherLinkAPI) AetherLinkAPI.init(); if(window.lucide) lucide.createIcons({root: el}); }
            }

            renderDock() {
                this.dock.innerHTML = '';
                this.dock.style.display = 'inline-flex';
                this.dock.style.width = 'auto';

                // Finder icon (always first)
                const finderBtn = document.createElement('div');
                finderBtn.id = 'dock-finder-trigger';
                finderBtn.className = 'dock-item dock-finder-btn hover-target cursor-none';
                finderBtn.innerHTML = window.AetherDesign?.iconMarkup('finder') || '';
                finderBtn.onclick = (e) => {
                    this._captureDockAnchor('__finder__', e.currentTarget);
                    os.toggleFinder();
                    // Bounce animation
                    if (window.gsap) {
                        gsap.fromTo(finderBtn, { scale: 0.75 }, { scale: 1, duration: 0.45, ease: 'elastic.out(1.2, 0.4)' });
                    }
                };
                finderBtn.title = 'Finder';
                this._attachDockItemBehavior(finderBtn, 'Finder');
                this.dock.appendChild(finderBtn);

                // Separator after Finder
                const sep1 = document.createElement('div');
                sep1.className = 'dock-separator';
                this.dock.appendChild(sep1);

                // Pinned items (not currently running)
                const pinned = os.getPinnedDock();
                const openIds = new Set(Object.values(SystemState.windows).filter(w => w.isOpen).map(w => w.id));
                let hasPinned = false;
                pinned.forEach(pinId => {
                    if (openIds.has(pinId)) return;
                    if (os.isModuleEnabled && !os.isModuleEnabled(pinId)) return;
                    const mod = os.finderModules.find(m => m.id === pinId) || os.finderExtraActions.find(m => m.id === pinId);
                    if (!mod) return;
                    hasPinned = true;
                    const item = document.createElement('div');
                    item.id = `dock-item-${mod.id}`;
                    item.className = 'dock-item dock-pinned hover-target cursor-none';
                    item.innerHTML = `${window.AetherDesign?.iconMarkup(mod.id) || ''}<span class="pin-dot"></span>`;
                    item.title = mod.label;
                    item.onclick = (e) => {
                        this._captureDockAnchor(mod.id, e.currentTarget);
                        os.launchFromFinder(mod.id);
                        // Launch bounce animation
                        if (window.gsap) {
                            gsap.fromTo(item, { scale: 0.72 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1.2, 0.4)' });
                        }
                    };
                    item.oncontextmenu = (e) => { e.preventDefault(); os.showDockContextMenu(e, mod.id, 'pinned'); };
                    this._attachDockItemBehavior(item, mod.label);
                    this.dock.appendChild(item);
                });

                const hasRunning = Object.values(SystemState.windows).some(w => w.isOpen);
                if (hasPinned && hasRunning) {
                    const sep2 = document.createElement('div');
                    sep2.className = 'dock-separator';
                    this.dock.appendChild(sep2);
                }

                // Running windows
                Object.values(SystemState.windows).forEach(win => {
                    if (!win.isOpen) return;
                    const isPinned = pinned.includes(win.id);
                    if (win.isMinimized) {
                        // Minimized window: show as live thumbnail in dock
                        const thumb = document.createElement('div');
                        thumb.id = `dock-item-${win.id}`;
                        thumb.className = 'dock-minimized-thumb hover-target';
                        const thumbInfo = this._buildDockMinimizedThumb(win);
                        thumb.innerHTML = `
                            <div class="thumb-shell">
                                <div class="thumb-header">
                                    <span class="thumb-dot"></span><span class="thumb-dot"></span><span class="thumb-dot"></span>
                                </div>
                                <div class="thumb-title">${window.AetherDesign?.appIcon(win.id, 16) || ''}${win.title || 'Window'}</div>
                                <div class="thumb-content"></div>
                                <div class="thumb-reflection"></div>
                                <div class="thumb-placeholder">${thumbInfo.placeholder}</div>
                            </div>
                        `;
                        thumb.onclick = (e) => {
                            this._captureDockAnchor(win.id, e.currentTarget);
                            this.restoreWindow(win.id);
                            if (window.gsap) {
                                gsap.fromTo(thumb, { scale: 0.88 }, { scale: 1, duration: 0.45, ease: 'elastic.out(1.2, 0.4)' });
                            }
                        };
                        thumb.oncontextmenu = (e) => { e.preventDefault(); os.showDockContextMenu(e, win.id, 'running'); };
                        this._attachDockItemBehavior(thumb, win.title, win.id);
                        this.dock.appendChild(thumb);
                        // Inject live content after append so we can query
                        requestAnimationFrame(() => this._injectDockThumbContent(win, thumb));
                    } else {
                        const item = document.createElement('div');
                        item.id = `dock-item-${win.id}`;
                        item.className = `dock-item hover-target cursor-none active`;
                        const iconColor = 'var(--theme-text-primary, rgba(255,255,255,0.88))';
                        item.innerHTML = `${window.AetherDesign?.iconMarkup(win.id) || ''}${isPinned ? '<span class="pin-dot"></span>' : ''}`;
                        item.onclick = (e) => {
                            this._captureDockAnchor(win.id, e.currentTarget);
                            this.minimizeWindow(win.id);
                            // Minimize squeeze animation
                            if (window.gsap) {
                                gsap.to(item, { scale: 0.85, duration: 0.15, ease: 'power2.in', yoyo: true, repeat: 1 });
                            }
                        };
                        item.oncontextmenu = (e) => { e.preventDefault(); os.showDockContextMenu(e, win.id, 'running'); };
                        this._attachDockItemBehavior(item, win.title, win.id);
                        this.dock.appendChild(item);
                    }
                });
                window.AetherDesign?.decorateDock(this.dock);
                lucide.createIcons({root: this.dock});

                // Re-init macOS-level magnification with spring physics
                this._initDockMagnification();
            }

            _attachDockItemBehavior(item, label, winId = null) {
                item.title = label || '';
                const tooltip = document.getElementById('dock-tooltip');
                const preview = document.getElementById('dock-preview');
                item.addEventListener('mouseenter', () => {
                    if (tooltip) {
                        const r = item.getBoundingClientRect();
                        tooltip.textContent = label || '';
                        tooltip.style.left = (r.left + r.width / 2) + 'px';
                        tooltip.style.bottom = '90px';
                        tooltip.classList.add('visible');
                    }
                    if (winId && preview) {
                        this._showDockPreview(item, winId);
                    }
                }, {passive: true});
                item.addEventListener('mouseleave', () => {
                    if (tooltip) tooltip.classList.remove('visible');
                    if (preview) this._hideDockPreview();
                }, {passive: true});
                // Premium click bounce with spring physics
                item.addEventListener('mousedown', () => {
                    if (window.gsap) {
                        gsap.killTweensOf(item);
                        gsap.to(item, { scale: 0.78, duration: 0.08, ease: 'power2.in' });
                    }
                }, {passive: true});
                item.addEventListener('mouseup', () => {
                    if (window.gsap) {
                        gsap.killTweensOf(item);
                        gsap.to(item, { scale: 1, duration: 0.55, ease: 'elastic.out(1.2, 0.4)' });
                    }
                }, {passive: true});
                item.addEventListener('mouseleave', () => {
                    if (window.gsap) {
                        gsap.killTweensOf(item);
                        gsap.to(item, { scale: 1, duration: 0.35, ease: 'elastic.out(1.1, 0.5)' });
                    }
                }, {passive: true});
            }

            _initDockMagnification() {
                const dockEl = this.dock;
                const items = () => Array.from(dockEl.querySelectorAll('.dock-item'));
                const baseSize = 52; // px
                const maxScale = 1.42;
                const neighborFalloff = 120; // px distance for neighbour effect
                
                // Physics state for spring interpolation (WeakMap avoids leaking detached dock items)
                if (!dockEl._dockPhysics) dockEl._dockPhysics = new WeakMap();
                
                const onMove = (e) => {
                    if (dockEl.classList.contains('dock-overflow') || e.pointerType === 'touch' || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || SystemState.settings.motion_intensity === 'off') return;
                    const all = items();
                    const dockRect = dockEl.getBoundingClientRect();
                    const mouseX = e.clientX - dockRect.left;
                    
                    all.forEach((item) => {
                        const itemRect = item.getBoundingClientRect();
                        const itemCenter = itemRect.left + itemRect.width / 2 - dockRect.left;
                        const dist = Math.abs(mouseX - itemCenter);
                        
                        // Fish-eye proximity calculation
                        let scale = 1;
                        let yOffset = 0;
                        
                        if (dist < neighborFalloff) {
                            const t = 1 - (dist / neighborFalloff);
                            // Quadratic ease for smooth curve (macOS-style)
                            const curve = t * t * (3 - 2 * t); // smoothstep
                            scale = 1 + (maxScale - 1) * curve;
                            yOffset = -12 * curve;
                        }
                        
                        // Store target for spring interpolation
                        if (!dockEl._dockPhysics.has(item)) {
                            dockEl._dockPhysics.set(item, { currentScale: 1, currentY: 0, targetScale: scale, targetY: yOffset });
                        } else {
                            const state = dockEl._dockPhysics.get(item);
                            state.targetScale = scale;
                            state.targetY = yOffset;
                        }
                    });
                    
                    // Start spring loop if not running
                    if (!dockEl._springRunning) {
                        dockEl._springRunning = true;
                        requestAnimationFrame(this._springTick.bind(this, dockEl, all));
                    }
                };
                
                const onLeave = () => {
                    const all = items();
                    all.forEach(item => {
                        const state = dockEl._dockPhysics.get(item);
                        if (state) {
                            state.targetScale = 1;
                            state.targetY = 0;
                        }
                    });
                    if (!dockEl._springRunning) {
                        dockEl._springRunning = true;
                        requestAnimationFrame(this._springTick.bind(this, dockEl, all));
                    }
                };
                
                dockEl.removeEventListener('mousemove', dockEl._magnifyMoveHandler);
                dockEl.removeEventListener('mouseleave', dockEl._magnifyLeaveHandler);
                dockEl._magnifyMoveHandler = onMove;
                dockEl._magnifyLeaveHandler = onLeave;
                dockEl.addEventListener('mousemove', onMove, {passive: true});
                dockEl.addEventListener('mouseleave', onLeave, {passive: true});
            }
            
            _initDockAutoHide() {
                return;
            }

            _showDockPreview(item, winId) {
                const preview = document.getElementById('dock-preview');
                if (!preview) return;
                const win = SystemState.windows[winId];
                if (!win) return;
                const r = item.getBoundingClientRect();
                preview.style.left = (r.left + r.width / 2) + 'px';
                preview.innerHTML = this._buildDockPreview(win);
                // Inject live DOM capture into the preview shell
                this._injectLiveDockContent(win, preview);
                requestAnimationFrame(() => {
                    preview.classList.add('visible');
                    lucide.createIcons({root: preview});
                });
            }
            _hideDockPreview() {
                const preview = document.getElementById('dock-preview');
                if (!preview) return;
                preview.classList.remove('visible');
            }
            _buildDockPreview(win) {
                const isActive = !win.isMinimized;
                const statusText = isActive ? 'Active' : 'Minimized';
                const statusClass = isActive ? 'active' : '';
                const dims = `${win.width || 800}×${win.height || 600}`;
                return `<div class="dock-preview-window">
                    <div class="dock-preview-header">
                        <div class="dock-preview-lights"><span></span><span></span><span></span></div>
                        <div class="dock-preview-title">
                            ${window.AetherDesign?.appIcon(win.id, 16) || ''}
                            <span>${win.title || 'Window'}</span>
                        </div>
                    </div>
                    <div class="dock-preview-content" id="dock-preview-content-slot">
                        <div class="dock-preview-reflection"></div>
                        <div class="dock-preview-live-mount" id="dock-preview-live-mount"></div>
                        <div class="dock-preview-placeholder" id="dock-preview-fallback">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                            <span>Loading preview...</span>
                        </div>
                        ${isActive ? '<div class="dock-preview-live-dot" title="Live window"></div>' : ''}
                    </div>
                </div>
                <div class="dock-preview-meta">
                    <span class="dock-preview-status ${statusClass}">${statusText}</span>
                    <span class="dock-preview-dims">${dims}</span>
                </div>`;
            }
            _buildDockMinimizedThumb(win) {
                const label = window.AETHER_MODULE_REGISTRY?.[win.id]?.label || win.title || 'App';
                return { placeholder: `${window.AetherDesign?.appIcon(win.id, 22) || ''}<span>${os.escapeHtml(label)}</span>` };
            }
            _injectDockThumbContent(win, thumbEl) {
                if (SystemState.settings.performance_mode === 'eco') return;
                const contentSlot = thumbEl.querySelector('.thumb-content');
                if (!contentSlot) return;
                const winEl = document.getElementById(`win-${win.id}`);
                if (!winEl) return;
                const contentArea = winEl.querySelector('.flex-1.relative.overflow-hidden');
                if (!contentArea || contentArea.children.length === 0) return;
                try {
                    const clone = contentArea.cloneNode(true);
                    clone.querySelectorAll('iframe').forEach(el => { el.style.display = 'none'; el.removeAttribute('src'); });
                    clone.querySelectorAll('video').forEach(el => { el.pause(); el.removeAttribute('src'); el.load(); el.remove(); });
                    clone.querySelectorAll('audio').forEach(el => { el.pause(); el.removeAttribute('src'); el.load(); el.remove(); });
                    clone.querySelectorAll('canvas').forEach(el => { el.style.opacity = '0.15'; });
                    clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
                    const winW = win.width || 800;
                    const winH = win.height || 600;
                    const thumbW = 92;
                    const thumbH = 44; // 58 - 14 header
                    const scale = Math.min(thumbW / winW, thumbH / winH, 1);
                    clone.style.cssText = `width:${winW}px;height:${winH}px;transform:scale(${scale.toFixed(4)}) translateZ(0);transform-origin:top left;overflow:hidden;position:relative;background:transparent;`;
                    contentSlot.innerHTML = '';
                    contentSlot.appendChild(clone);
                } catch (e) {}
            }
            _injectLiveDockContent(win, preview) {
                const mount = preview.querySelector('#dock-preview-live-mount');
                const fallback = preview.querySelector('#dock-preview-fallback');
                if (!mount) return;
                if (SystemState.settings.performance_mode === 'eco') {
                    this._setDockPreviewFallback(win, mount, fallback);
                    return;
                }
                const winEl = document.getElementById(`win-${win.id}`);
                if (!winEl) {
                    this._setDockPreviewFallback(win, mount, fallback);
                    return;
                }
                const contentArea = winEl.querySelector('.flex-1.relative.overflow-hidden');
                if (!contentArea || contentArea.children.length === 0) {
                    this._setDockPreviewFallback(win, mount, fallback);
                    return;
                }
                // Clone the live content area
                try {
                    const clone = contentArea.cloneNode(true);
                    // Strip out iframes and canvases (they don't clone pixel data well)
                    clone.querySelectorAll('iframe').forEach(el => {
                        el.style.display = 'none';
                        el.removeAttribute('src');
                    });
                    clone.querySelectorAll('video').forEach(el => { el.pause(); el.removeAttribute('src'); el.load(); el.remove(); });
                    clone.querySelectorAll('audio').forEach(el => { el.pause(); el.removeAttribute('src'); el.load(); el.remove(); });
                    clone.querySelectorAll('canvas').forEach(el => {
                        el.style.opacity = '0.15';
                    });
                    // Remove IDs to avoid DOM conflicts
                    clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
                    // Compute scale to fit 240×130 preview content area
                    const previewW = 240;
                    const previewH = 130;
                    const winW = win.width || 800;
                    const winH = win.height || 600;
                    const scale = Math.min(previewW / winW, previewH / winH, 1);
                    // Wrap in scaled container
                    mount.style.cssText = `width:${winW}px;height:${winH}px;transform:scale(${scale.toFixed(4)});transform-origin:top left;position:absolute;top:0;left:0;overflow:hidden;z-index:2;`;
                    clone.style.cssText = `width:100%;height:100%;overflow:hidden;position:relative;background:transparent;`;
                    mount.innerHTML = '';
                    mount.appendChild(clone);
                    if (fallback) fallback.style.display = 'none';
                } catch (e) {
                    this._setDockPreviewFallback(win, mount, fallback);
                }
            }
            _setDockPreviewFallback(win, mount, fallback) {
                if (mount) mount.innerHTML = '';
                if (!fallback) return;
                const contentMap = {
                    'filemanager': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg><span>File System</span>`,
                    'settings': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg><span>System Config</span>`,
                    'youtube': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg><span>Media Engine</span>`,
                    'browser': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg><span>Web Browser</span>`,
                    'nasa': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9"/></svg><span>NASA Explorer</span>`,
                    'anime': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg><span>Anime Database</span>`,
                    'rss': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg><span>RSS Feed</span>`,
                    'media': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg><span>Media Dashboard</span>`,
                    'memes': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg><span>Meme Console</span>`,
                    'terminal': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg><span>Terminal</span>`,
                    'notes': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg><span>Notes</span>`,
                    'sysinfo': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg><span>System Telemetry</span>`
                };
                fallback.innerHTML = (contentMap[win.content] || `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg><span>Window</span>`);
                const label = window.AETHER_MODULE_REGISTRY?.[win.id]?.label;
                const labelEl = fallback.querySelector('span');
                if (label && labelEl) labelEl.textContent = label;
                fallback.style.display = 'flex';
            }

            _springTick(dockEl, items) {
                let stillAnimating = false;
                const springStrength = 0.18;
                const friction = 0.75;
                
                items.forEach(item => {
                    const state = dockEl._dockPhysics.get(item);
                    if (!state) return;
                    
                    const scaleDiff = state.targetScale - state.currentScale;
                    const yDiff = state.targetY - state.currentY;
                    
                    state.currentScale += scaleDiff * springStrength;
                    state.currentY += yDiff * springStrength;
                    
                    // Apply dampening for settle
                    state.currentScale += (state.targetScale - state.currentScale) * (1 - friction) * 0.15;
                    state.currentY += (state.targetY - state.currentY) * (1 - friction) * 0.15;
                    
                    const scaleSnap = Math.abs(state.targetScale - state.currentScale) < 0.002;
                    const ySnap = Math.abs(state.targetY - state.currentY) < 0.1;
                    
                    if (!scaleSnap || !ySnap) stillAnimating = true;
                    
                    item.style.transform = `scale(${state.currentScale.toFixed(4)}) translateY(${state.currentY.toFixed(2)}px)`;
                });
                
                if (stillAnimating) {
                    requestAnimationFrame(this._springTick.bind(this, dockEl, items));
                } else {
                    dockEl._springRunning = false;
                }
            }

            open(id, opts = {}) {
                if (!SystemState.windows[id]) return false;
                if (!opts?.bypassGate && window.os && window.os.isModuleEnabled && !window.os.isModuleEnabled(id)) {
                    const label = (window.AETHER_MODULE_REGISTRY && window.AETHER_MODULE_REGISTRY[id]?.label) || SystemState.windows[id].title || id;
                    if (window.Notifications) {
                        window.Notifications.push('MODULE DISABLED', `"${label}" is off. Enable it in Settings → App Modules.`);
                    }
                    return false;
                }
                if (os.companion && os.companion.observeEvent) {
                    os.companion.observeEvent('window_open', { id });
                }
                const activeSpace = Number(SystemState.settings.active_space || 1);
                if (SystemState.windows[id].isOpen && !this._genieAnims[id]?.closing) {
                    if (Number(SystemState.windows[id].space || 1) !== activeSpace && os.switchSpace) {
                        os.switchSpace(Number(SystemState.windows[id].space || 1));
                    }
                    if (SystemState.windows[id].isMinimized) {
                        this.restoreWindow(id);
                    } else {
                        this.bringToFront(id);
                    }
                } else {
                    SystemState.windows[id].isOpen = true;
                    SystemState.windows[id].isMinimized = false;
                    SystemState.windows[id].space = activeSpace;
                    SystemState.activeZIndex++;
                    SystemState.windows[id].zIndex = SystemState.activeZIndex;
                    SystemState.save();
                    this.updateTopBarAppInfo();
                    this.renderDock();
                    this.createWindowDOM(SystemState.windows[id]);
                    os.syncVirtualSpaces && os.syncVirtualSpaces();
                }
            }
        }
window.WindowManager = WindowManager;
