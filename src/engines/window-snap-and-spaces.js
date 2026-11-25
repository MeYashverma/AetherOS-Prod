// AetherOS — Window Snap Tiling, Virtual Spaces (1·2·3), Mission Control & Liquid Glass Lock Screen
(function () {
    const SNAP_MARGIN_X = 26;
    const SNAP_MARGIN_Y = 22;
    const CORNER_SIZE = 90;

    function getCanvasRect() {
        const canvas = document.getElementById('window-canvas');
        if (!canvas) return { left: 0, top: 36, width: window.innerWidth, height: window.innerHeight - 104 };
        const r = canvas.getBoundingClientRect();
        // Reserve ~76px at bottom for floating dock breathing room unless narrow screen
        const dockPad = window.innerHeight > 560 ? 74 : 48;
        return {
            left: r.left,
            top: r.top,
            width: Math.max(320, r.width),
            height: Math.max(240, r.height - dockPad)
        };
    }

    function computeSnapZone(clientX, clientY) {
        const c = getCanvasRect();
        const rx = clientX - c.left;
        const ry = clientY - c.top;
        if (rx < -20 || rx > c.width + 20 || ry < -40 || ry > c.height + 90) return null;

        const nearLeft = rx <= SNAP_MARGIN_X;
        const nearRight = rx >= c.width - SNAP_MARGIN_X;
        const nearTop = ry <= SNAP_MARGIN_Y;
        const nearBottom = ry >= c.height - SNAP_MARGIN_Y;

        if (nearLeft && ry <= CORNER_SIZE) return 'top-left';
        if (nearRight && ry <= CORNER_SIZE) return 'top-right';
        if (nearLeft && (ry >= c.height - CORNER_SIZE || nearBottom)) return 'bottom-left';
        if (nearRight && (ry >= c.height - CORNER_SIZE || nearBottom)) return 'bottom-right';
        if (nearLeft) return 'left';
        if (nearRight) return 'right';
        if (nearTop) return 'maximize';
        return null;
    }

    function zoneToBounds(zone) {
        const c = getCanvasRect();
        const pad = 8;
        const halfW = Math.floor((c.width - pad * 3) / 2);
        const halfH = Math.floor((c.height - pad * 3) / 2);
        const fullW = c.width - pad * 2;
        const fullH = c.height - pad * 2;

        switch (zone) {
            case 'left':         return { x: pad, y: pad, width: halfW, height: fullH };
            case 'right':        return { x: pad * 2 + halfW, y: pad, width: halfW, height: fullH };
            case 'maximize':     return { x: pad, y: pad, width: fullW, height: fullH };
            case 'top-left':     return { x: pad, y: pad, width: halfW, height: halfH };
            case 'top-right':    return { x: pad * 2 + halfW, y: pad, width: halfW, height: halfH };
            case 'bottom-left':  return { x: pad, y: pad * 2 + halfH, width: halfW, height: halfH };
            case 'bottom-right': return { x: pad * 2 + halfW, y: pad * 2 + halfH, width: halfW, height: halfH };
            default:             return null;
        }
    }

    const WindowSnapManager = window.WindowSnapManager = {
        activeZone: null,

        showPreview(zone) {
            const el = document.getElementById('window-snap-preview');
            if (!el) return;
            if (!zone) {
                this.hidePreview();
                return;
            }
            const b = zoneToBounds(zone);
            if (!b) return;
            this.activeZone = zone;
            el.style.display = 'block';
            el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
            el.style.width = `${b.width}px`;
            el.style.height = `${b.height}px`;
            el.classList.add('visible');
        },

        hidePreview() {
            this.activeZone = null;
            const el = document.getElementById('window-snap-preview');
            if (el) {
                el.classList.remove('visible');
                el.style.display = 'none';
            }
        },

        onWindowDragMove(winId, pointerEvent) {
            if (!pointerEvent) return;
            const x = pointerEvent.clientX ?? (pointerEvent.touches && pointerEvent.touches[0]?.clientX);
            const y = pointerEvent.clientY ?? (pointerEvent.touches && pointerEvent.touches[0]?.clientY);
            if (typeof x !== 'number' || typeof y !== 'number') return;
            const zone = computeSnapZone(x, y);
            this.showPreview(zone);
        },

        onWindowDragEnd(winId) {
            const zone = this.activeZone;
            this.hidePreview();
            if (zone) {
                this.snapWindow(winId, zone);
                return true;
            }
            const winData = SystemState.windows[winId];
            if (winData) delete winData._snappedZone;
            return false;
        },

        snapWindow(winId, zone) {
            const winData = SystemState.windows[winId];
            const el = document.getElementById(`win-${winId}`);
            if (!winData || !el) return false;

            if (zone === 'restore') {
                const prev = winData._preSnapBounds;
                if (!prev) return false;
                delete winData._snappedZone;
                this._applyBounds(winData, el, prev);
                return true;
            }

            const target = zoneToBounds(zone);
            if (!target) return false;

            if (!winData._snappedZone) {
                winData._preSnapBounds = {
                    x: winData.x || 80,
                    y: winData.y || 50,
                    width: winData.width || 720,
                    height: winData.height || 520
                };
            }
            winData._snappedZone = zone;
            this._applyBounds(winData, el, target);
            return true;
        },

        _applyBounds(winData, el, bounds) {
            winData.x = bounds.x;
            winData.y = bounds.y;
            winData.width = bounds.width;
            winData.height = bounds.height;
            SystemState.save();

            el.style.width = `${bounds.width}px`;
            el.style.height = `${bounds.height}px`;
            if (window.gsap) {
                gsap.to(el, {
                    x: bounds.x,
                    y: bounds.y,
                    scale: 1,
                    duration: 0.24,
                    ease: 'power3.out',
                    overwrite: true,
                    onComplete: () => {
                        try {
                            const d = window.Draggable && Draggable.get(el);
                            if (d && d.update) d.update();
                        } catch (_) {}
                    }
                });
            } else {
                el.style.transform = `translate3d(${bounds.x}px, ${bounds.y}px, 0)`;
            }
        }
    };

    function getTopActiveWindowId() {
        const curSpace = Number(SystemState.settings.active_space || 1);
        const candidates = Object.values(SystemState.windows || {})
            .filter((w) => w.isOpen && !w.isMinimized && Number(w.space || 1) === curSpace)
            .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
        return candidates[0] ? candidates[0].id : null;
    }

    window.extendOS({
        missionControlOpen: false,
        isScreenLocked: false,

        snapActiveWindow: (zone) => {
            const topId = getTopActiveWindowId();
            if (!topId) return false;
            return WindowSnapManager.snapWindow(topId, zone);
        },

        switchSpace: (spaceNum) => {
            const target = Math.min(3, Math.max(1, Number(spaceNum) || 1));
            SystemState.settings.active_space = target;
            SystemState.save();
            os.syncVirtualSpaces();
            if (os.missionControlOpen) os.renderMissionControl();
        },

        moveWindowToSpace: (winId, spaceNum) => {
            const w = SystemState.windows[winId];
            if (!w) return;
            const target = Math.min(3, Math.max(1, Number(spaceNum) || 1));
            w.space = target;
            SystemState.save();
            os.syncVirtualSpaces();
            if (os.missionControlOpen) os.renderMissionControl();
            window.Notifications && window.Notifications.push('VIRTUAL SPACES', `Moved "${w.title}" to Space ${target}`);
        },

        syncVirtualSpaces: () => {
            const cur = Number(SystemState.settings.active_space || 1);
            Object.values(SystemState.windows || {}).forEach((w) => {
                if (!w.space) w.space = 1;
                const el = document.getElementById(`win-${w.id}`);
                if (!el) return;
                if (!w.isOpen || w.isMinimized) return;
                const inSpace = Boolean(w.pinned) || Number(w.space) === cur;
                el.style.display = inSpace ? 'flex' : 'none';
            });

            document.querySelectorAll('[data-space-btn]').forEach((btn) => {
                const n = Number(btn.getAttribute('data-space-btn'));
                const hasWins = Object.values(SystemState.windows || {}).some((w) => w.isOpen && Number(w.space || 1) === n);
                btn.classList.toggle('active', n === cur);
                btn.classList.toggle('has-windows', hasWins);
            });

            if (window.winManager && window.winManager.updateTopBarAppInfo) {
                window.winManager.updateTopBarAppInfo();
            }
        },

        toggleMissionControl: (forceState) => {
            const overlay = document.getElementById('mission-control-overlay');
            if (!overlay) return;
            const next = typeof forceState === 'boolean' ? forceState : !os.missionControlOpen;
            os.missionControlOpen = next;
            if (next) {
                os.closeFinder && os.closeFinder();
                os.closeTopBarMenus && os.closeTopBarMenus();
                os.renderMissionControl();
                overlay.style.display = 'flex';
                if (window.gsap) {
                    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: 'power2.out' });
                }
            } else {
                overlay.style.display = 'none';
            }
        },

        renderMissionControl: () => {
            const overlay = document.getElementById('mission-control-overlay');
            if (!overlay) return;
            const cur = Number(SystemState.settings.active_space || 1);
            const allOpen = Object.values(SystemState.windows || {}).filter((w) => w.isOpen);

            const spaceTabs = [1, 2, 3].map((n) => {
                const count = allOpen.filter((w) => Number(w.space || 1) === n).length;
                return `
                    <button type="button" onclick="os.switchSpace(${n})"
                        class="px-4 py-2 rounded-xl border text-xs font-medium transition hover-target cursor-none flex items-center gap-2.5 ${cur === n ? 'bg-white/16 border-white/35 text-white shadow-lg' : 'bg-white/[0.04] border-white/10 text-gray-400 hover:text-white'}">
                        <i data-lucide="monitor" class="w-3.5 h-3.5"></i>
                        <span>Workspace 0${n}</span>
                        <span class="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] font-mono">${count}</span>
                    </button>
                `;
            }).join('');

            const spaceWins = allOpen.filter((w) => Number(w.space || 1) === cur);
            const esc = window.escapeAetherHtml || ((s) => String(s));

            const cards = spaceWins.length ? spaceWins.map((w) => `
                <div class="mc-card rounded-2xl border border-white/12 bg-white/[0.05] hover:bg-white/[0.08] p-4 flex flex-col justify-between gap-4 transition shadow-xl">
                    <div class="flex items-start justify-between gap-3">
                        <button type="button" onclick="os.toggleMissionControl(false);os.openWindow('${w.id}')" class="flex items-center gap-2.5 text-left hover-target cursor-none min-w-0">
                            <span class="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                                ${window.AetherDesign?.appIcon(w.id, 25) || ''}
                            </span>
                            <span class="min-w-0">
                                <span class="block text-sm font-semibold text-white truncate">${esc(w.title)}</span>
                                <span class="block text-[10px] font-mono text-gray-400">${w.isMinimized ? 'Minimized' : `${Math.round(w.width)}×${Math.round(w.height)}`}</span>
                            </span>
                        </button>
                        <button type="button" onclick="window.winManager && window.winManager.closeWindow('${w.id}');os.renderMissionControl()"
                            class="p-1.5 rounded-lg bg-white/[0.05] hover:bg-red-500/25 text-gray-400 hover:text-red-300 transition hover-target cursor-none" title="Close window">
                            <i data-lucide="x" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                    <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.07] text-[10.5px]">
                        <div class="flex items-center gap-1">
                            <span class="text-gray-500 mr-1">Snap:</span>
                            <button type="button" onclick="os.toggleMissionControl(false);os.openWindow('${w.id}');WindowSnapManager.snapWindow('${w.id}','left')" class="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/15 text-gray-300 hover-target cursor-none">Left</button>
                            <button type="button" onclick="os.toggleMissionControl(false);os.openWindow('${w.id}');WindowSnapManager.snapWindow('${w.id}','maximize')" class="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/15 text-gray-300 hover-target cursor-none">Full</button>
                            <button type="button" onclick="os.toggleMissionControl(false);os.openWindow('${w.id}');WindowSnapManager.snapWindow('${w.id}','right')" class="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/15 text-gray-300 hover-target cursor-none">Right</button>
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="text-gray-500 mr-1">Space:</span>
                            ${[1, 2, 3].map((sNum) => `
                                <button type="button" onclick="os.moveWindowToSpace('${w.id}', ${sNum})"
                                    class="w-5 h-5 rounded font-mono text-[10px] ${Number(w.space || 1) === sNum ? 'bg-white text-black font-bold' : 'bg-white/[0.06] text-gray-400 hover:text-white'} hover-target cursor-none">${sNum}</button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `).join('') : `
                <div class="col-span-full py-16 text-center text-gray-400 text-sm">
                    No open windows in Workspace 0${cur}. Launch an app from the Dock or press <kbd class="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs">⌘K</kbd>.
                </div>
            `;

            overlay.innerHTML = `
                <div class="mc-panel w-full max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6 max-h-full overflow-y-auto" onclick="event.stopPropagation()">
                    <div class="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <div class="text-lg font-semibold text-white tracking-tight">Mission Control</div>
                            <div class="text-xs text-gray-400">Switch virtual workspaces, snap windows, or move apps across spaces.</div>
                        </div>
                        <div class="flex items-center gap-2">${spaceTabs}</div>
                        <button type="button" onclick="os.toggleMissionControl(false)" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white hover-target cursor-none">Done (Esc)</button>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">${cards}</div>
                </div>
            `;
            if (window.lucide) lucide.createIcons({ root: overlay });
        },

        // ── Liquid Glass Lock Screen (Ctrl/Cmd + L) ──
        lockScreen: () => {
            const el = document.getElementById('lock-screen-overlay');
            if (!el) return;
            os.isScreenLocked = true;
            os.closeTopBarMenus && os.closeTopBarMenus();
            os.toggleMissionControl && os.toggleMissionControl(false);
            os._updateLockScreenClock();
            const pinWrap = document.getElementById('lock-pin-wrap');
            const unlockBtn = document.getElementById('lock-instant-btn');
            const pinInput = document.getElementById('lock-pin-input');
            const errEl = document.getElementById('lock-pin-error');
            const hasPin = Boolean((SystemState.settings.lock_pin || '').trim());
            if (pinWrap) pinWrap.style.display = hasPin ? 'flex' : 'none';
            if (unlockBtn) unlockBtn.style.display = hasPin ? 'none' : 'inline-flex';
            if (errEl) errEl.textContent = '';
            el.style.display = 'flex';
            if (hasPin && pinInput) {
                pinInput.value = '';
                setTimeout(() => pinInput.focus(), 60);
            }
        },

        unlockScreen: () => {
            const el = document.getElementById('lock-screen-overlay');
            if (!el) return;
            const requiredPin = (SystemState.settings.lock_pin || '').trim();
            if (requiredPin) {
                const pinInput = document.getElementById('lock-pin-input');
                const errEl = document.getElementById('lock-pin-error');
                if (!pinInput || pinInput.value.trim() !== requiredPin) {
                    if (errEl) errEl.textContent = 'Incorrect PIN / Passphrase';
                    if (pinInput) pinInput.value = '';
                    return false;
                }
            }
            os.isScreenLocked = false;
            el.style.display = 'none';
            return true;
        },

        _updateLockScreenClock: () => {
            const timeEl = document.getElementById('lock-clock-time');
            const dateEl = document.getElementById('lock-clock-date');
            const metaEl = document.getElementById('lock-status-meta');
            const now = new Date();
            if (timeEl) timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            if (dateEl) dateEl.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
            if (metaEl) {
                const weather = document.getElementById('topbar-weather-temp')?.textContent || '--°C';
                const focusPill = document.getElementById('topbar-focus-label')?.textContent || '';
                metaEl.textContent = focusPill ? `${weather}  ·  Focus ${focusPill}` : `${weather}  ·  Workspace 0${SystemState.settings.active_space || 1}`;
            }
        }
    });

    window.addEventListener('DOMContentLoaded', () => {
        setInterval(() => {
            if (window.os && os.isScreenLocked) os._updateLockScreenClock();
        }, 2000);

        document.addEventListener('keydown', (e) => {
            if (window.os && os.isScreenLocked) {
                if (e.key === 'Enter' && !(SystemState.settings.lock_pin || '').trim()) {
                    e.preventDefault();
                    os.unlockScreen();
                }
                return;
            }

            // Lock Screen shortcut: Ctrl/Cmd + L (when not typing in URL bar)
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'l') {
                const tag = (e.target && e.target.tagName || '').toLowerCase();
                if (tag !== 'input' && tag !== 'textarea') {
                    e.preventDefault();
                    window.os && os.lockScreen();
                    return;
                }
            }

            // Virtual Spaces: Ctrl + 1 / 2 / 3 & Mission Control: Ctrl + ArrowUp
            if (e.ctrlKey && !e.metaKey && !e.altKey) {
                if (e.key === '1' || e.key === '2' || e.key === '3') {
                    e.preventDefault();
                    window.os && os.switchSpace(Number(e.key));
                    return;
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    window.os && os.toggleMissionControl();
                    return;
                }
            }

            // Window Tiling & App Switcher: Alt + ArrowKeys / Alt + Q
            if (e.altKey && !e.ctrlKey && !e.metaKey) {
                const tag = (e.target && e.target.tagName || '').toLowerCase();
                if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
                if (e.key === 'ArrowLeft')  { e.preventDefault(); window.os && os.snapActiveWindow('left'); }
                if (e.key === 'ArrowRight') { e.preventDefault(); window.os && os.snapActiveWindow('right'); }
                if (e.key === 'ArrowUp')    { e.preventDefault(); window.os && os.snapActiveWindow('maximize'); }
                if (e.key === 'ArrowDown')  { e.preventDefault(); window.os && os.snapActiveWindow('restore'); }
                if (e.key.toLowerCase() === 'q') { e.preventDefault(); window.os && os.cycleAppSwitcher && os.cycleAppSwitcher(); }
            }

            if (e.key === 'Escape' && window.os) {
                if (os.missionControlOpen) os.toggleMissionControl(false);
                if (os._switcherOpen) os.closeAppSwitcher && os.closeAppSwitcher(false);
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'Alt' && window.os && os._switcherOpen) {
                os.closeAppSwitcher && os.closeAppSwitcher(true);
            }
        });
    });

    window.extendOS({
        _switcherOpen: false,
        _switcherIdx: 0,
        _switcherList: [],

        cycleAppSwitcher: () => {
            let hud = document.getElementById('app-switcher-hud');
            if (!hud) {
                hud = document.createElement('div');
                hud.id = 'app-switcher-hud';
                document.body.appendChild(hud);
            }
            if (!os._switcherOpen) {
                os._switcherList = Object.values(SystemState.windows || {})
                    .filter((w) => w.isOpen)
                    .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
                if (!os._switcherList.length) return;
                os._switcherOpen = true;
                os._switcherIdx = os._switcherList.length > 1 ? 1 : 0;
            } else {
                os._switcherIdx = (os._switcherIdx + 1) % os._switcherList.length;
            }

            const esc = window.escapeAetherHtml || ((s) => String(s));
            hud.classList.add('active');
            hud.style.display = 'flex';
            hud.innerHTML = `<div class="app-switcher-strip">` + os._switcherList.map((w, idx) => `
                <button type="button" onclick="os._switcherIdx=${idx};os.closeAppSwitcher(true)"
                    class="app-switcher-item hover-target cursor-none ${idx === os._switcherIdx ? 'selected' : ''}">
                    <span class="app-switcher-icon">
                        ${window.AetherDesign?.appIcon(w.id, 38) || ''}
                    </span>
                    <span class="app-switcher-lbl">${esc(w.title)}</span>
                    <span class="text-[9px] font-mono text-gray-400">Space ${w.space || 1}${w.pinned ? ' · 📌' : ''}</span>
                </button>
            `).join('') + `</div>`;
            if (window.lucide) lucide.createIcons({ root: hud });
        },

        closeAppSwitcher: (commitFocus = true) => {
            const hud = document.getElementById('app-switcher-hud');
            if (hud) {
                hud.classList.remove('active');
                hud.style.display = 'none';
            }
            if (commitFocus && os._switcherOpen && os._switcherList[os._switcherIdx]) {
                const chosen = os._switcherList[os._switcherIdx];
                os.openWindow(chosen.id);
            }
            os._switcherOpen = false;
        }
    });
})();
