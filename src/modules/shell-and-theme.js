// AetherOS — Shell Controls, Topbar Telemetry, Finder, Dock Pinning, Themes, Wallpaper & WakeLock
window.extendOS({
    escapeHtml: (v) => window.escapeAetherHtml(v),

    toggleAetherMenu: (ev) => {
                if (ev && ev.stopPropagation) ev.stopPropagation();
                const el = document.getElementById('aether-menu-dropdown');
                if (!el) return;
                const isOpen = el.style.display === 'block';
                os.closeTopBarMenus();
                if (!isOpen) {
                    const perfLbl = document.getElementById('am-perf-label');
                    if (perfLbl) perfLbl.textContent = (SystemState.settings.performance_mode === 'cinematic') ? 'Switch to Eco Mode' : 'Switch to Cinematic Mode';
                    el.style.display = 'block';
                    if (window.lucide) lucide.createIcons({ root: el });
                    gsap.fromTo(el,
                        { opacity: 0, scale: 0.94, y: -8 },
                        { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: 'power2.out' }
                    );
                }
            },

    toggleControlCenter: (ev) => {
                if (ev && ev.stopPropagation) ev.stopPropagation();
                const el = document.getElementById('control-center-panel');
                if (!el) return;
                const isOpen = el.style.display === 'block';
                os.closeTopBarMenus();
                if (!isOpen) {
                    os.syncControlCenterUI();
                    el.style.display = 'block';
                    if (window.lucide) lucide.createIcons({ root: el });
                    gsap.fromTo(el,
                        { opacity: 0, scale: 0.94, y: -8 },
                        { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: 'power2.out' }
                    );
                }
            },

    toggleNotificationCenter: (ev) => {
                if (ev && ev.stopPropagation) ev.stopPropagation();
                if (window.NotificationCenter) window.NotificationCenter.toggle();
            },

    syncControlCenterUI: () => {
                const s = SystemState.settings || {};
                const setTile = (id, active, sub) => {
                    const btn = document.getElementById(id);
                    if (!btn) return;
                    btn.classList.toggle('bg-white/15', !!active);
                    btn.classList.toggle('border-white/25', !!active);
                    btn.classList.toggle('text-white', !!active);
                    const subEl = btn.querySelector('[data-cc-sub]');
                    if (subEl && sub !== undefined) subEl.textContent = sub;
                };
                setTile('cc-btn-perf', s.performance_mode === 'cinematic', s.performance_mode === 'cinematic' ? 'Cinematic' : 'Eco');
                setTile('cc-btn-awake', !!(os.wakeLock && os.wakeLock.enabled), (os.wakeLock && os.wakeLock.enabled) ? 'Active' : 'Standby');
                setTile('cc-btn-tts', s.speech_synthesis === 'on', s.speech_synthesis === 'on' ? 'Enabled' : 'Muted');
                setTile('cc-btn-sakura', s.sakura_petals === 'on', s.sakura_petals === 'on' ? 'Falling' : 'Off');
                const volSlider = document.getElementById('cc-volume-slider');
                const volLabel = document.getElementById('cc-volume-val');
                const volPct = Math.round(Number(s.media_tuner_volume ?? 0.7) * 100);
                if (volSlider) volSlider.value = String(volPct);
                if (volLabel) volLabel.textContent = `${volPct}%`;
                document.querySelectorAll('[data-cc-theme]').forEach(pill => {
                    const active = pill.getAttribute('data-cc-theme') === (s.active_theme || 'midnight');
                    pill.classList.toggle('ring-2', active);
                    pill.classList.toggle('ring-white/70', active);
                });
            },

    toggleMobileUtilityPanel: (forceState) => {
                const panel = document.getElementById('utility-sidebar');
                const backdrop = document.getElementById('mobile-panel-backdrop');
                if (!panel) return;
                const nextOpen = typeof forceState === 'boolean' ? forceState : !panel.classList.contains('mobile-open');
                panel.classList.toggle('mobile-open', nextOpen);
                if (backdrop) backdrop.classList.toggle('visible', nextOpen);
            },

    closeTopBarMenus: () => {
                ['aether-menu-dropdown','control-center-panel','notification-center'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el && el.style.display === 'block') {
                        gsap.to(el, {
                            opacity: 0, scale: 0.95, y: -6, duration: 0.12, ease: 'power2.in',
                            onComplete: () => { el.style.display = 'none'; el.style.opacity = ''; el.style.transform = ''; }
                        });
                    } else if (el) {
                        el.style.display = 'none';
                    }
                });
            },

    toggleSidebarSection: (header) => { header.parentElement.classList.toggle('expanded'); if(window.lucide) lucide.createIcons();
            
 },

    _netIOExpanded: false,

    toggleNetIO: () => {
                os._netIOExpanded = !os._netIOExpanded;
                const details = document.getElementById('net-io-details');
                const summary = document.getElementById('net-io-summary');
                const chevron = document.getElementById('net-io-chevron');
                if (details) details.classList.toggle('hidden', !os._netIOExpanded);
                if (summary) summary.classList.toggle('hidden', os._netIOExpanded);
                if (chevron) chevron.style.transform = os._netIOExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
            },

    initTopBarTelemetry: () => {
                if (os._topBarTelemetryActive) return;
                os._topBarTelemetryActive = true;
                const HISTORY = 40;
                const data = { fps: Array(HISTORY).fill(60), cpu: Array(HISTORY).fill(5), ram: Array(HISTORY).fill(5) };
                let lastFrame = performance.now();
                let frameCount = 0;
                let fps = 60;
                let cpuLoad = 5;
                let ramLoad = 5;

                const drawLineChart = (canvasId, labelId, arr, color, maxVal, suffix, isFps) => {
                    const canvas = document.getElementById(canvasId);
                    const label = document.getElementById(labelId);
                    if (!canvas) return;
                    const ctx = canvas.getContext('2d');
                    const w = canvas.width;
                    const h = canvas.height;
                    const pad = 3;
                    const gw = w - pad * 2;
                    const gh = h - pad * 2;

                    ctx.clearRect(0, 0, w, h);

                    // Dark glass background
                    ctx.fillStyle = 'rgba(0,0,0,0.15)';
                    ctx.fillRect(0, 0, w, h);

                    // Subtle grid lines
                    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    for (let i = 1; i < 4; i++) {
                        const y = pad + (gh / 4) * i;
                        ctx.moveTo(pad, y);
                        ctx.lineTo(w - pad, y);
                    }
                    ctx.stroke();

                    // Grid vertical
                    ctx.beginPath();
                    for (let i = 1; i < 6; i++) {
                        const x = pad + (gw / 6) * i;
                        ctx.moveTo(x, pad);
                        ctx.lineTo(x, h - pad);
                    }
                    ctx.stroke();

                    // Build path points
                    const points = arr.map((val, i) => {
                        const x = pad + (i / (arr.length - 1)) * gw;
                        const y = pad + gh - (val / maxVal) * gh;
                        return { x, y };
                    });

                    // Fill area under curve with gradient
                    const gradient = ctx.createLinearGradient(0, pad, 0, h - pad);
                    gradient.addColorStop(0, color.replace(')', ', 0.45)').replace('rgb', 'rgba'));
                    gradient.addColorStop(1, color.replace(')', ', 0.02)').replace('rgb', 'rgba'));

                    ctx.beginPath();
                    ctx.moveTo(points[0].x, h - pad);
                    for (let i = 0; i < points.length; i++) {
                        ctx.lineTo(points[i].x, points[i].y);
                    }
                    ctx.lineTo(points[points.length - 1].x, h - pad);
                    ctx.closePath();
                    ctx.fillStyle = gradient;
                    ctx.fill();

                    // Smooth line stroke
                    ctx.beginPath();
                    ctx.moveTo(points[0].x, points[0].y);
                    for (let i = 1; i < points.length; i++) {
                        const prev = points[i - 1];
                        const curr = points[i];
                        const cpX = (prev.x + curr.x) / 2;
                        ctx.quadraticCurveTo(prev.x, prev.y, cpX, (prev.y + curr.y) / 2);
                    }
                    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1.5;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.stroke();

                    // Glow dot at latest point
                    const last = points[points.length - 1];
                    ctx.beginPath();
                    ctx.arc(last.x, last.y, 2, 0, Math.PI * 2);
                    ctx.fillStyle = color;
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(last.x, last.y, 5, 0, Math.PI * 2);
                    ctx.fillStyle = color.replace(')', ', 0.2)').replace('rgb', 'rgba');
                    ctx.fill();

                    // Update text label
                    if (label) {
                        const current = arr[arr.length - 1];
                        const display = isFps ? Math.round(current) + suffix : Math.round(current) + suffix;
                        label.textContent = display;
                        label.style.color = color;
                    }
                };

                let cachedDomNodes = document.getElementsByTagName('*').length;
                let lastDomCountAt = performance.now();

                const tick = (now) => {
                    if (!os._topBarTelemetryActive) return;
                    if (document.hidden) {
                        setTimeout(() => requestAnimationFrame(tick), 500);
                        return;
                    }
                    const dt = now - lastFrame;
                    lastFrame = now;
                    frameCount++;
                    if (dt > 0) {
                        const instantFps = 1000 / dt;
                        fps = fps * 0.85 + Math.min(144, instantFps) * 0.15;
                    }
                    if (now - lastDomCountAt > 2000) {
                        cachedDomNodes = document.getElementsByTagName('*').length;
                        lastDomCountAt = now;
                    }
                    const frameLag = Math.max(0, dt - 16.67);
                    const openWins = Object.values(SystemState.windows || {}).filter(w => w && w.isOpen).length;
                    const cpuRaw = Math.min(100, frameLag * 2.2 + openWins * 4.5 + cachedDomNodes / 220);
                    cpuLoad = cpuLoad * 0.85 + cpuRaw * 0.15;
                    let ramRaw = 32;
                    if (performance.memory && performance.memory.jsHeapSizeLimit > 0) {
                        ramRaw = Math.min(100, (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100);
                    } else {
                        ramRaw = Math.min(100, openWins * 6 + cachedDomNodes / 120);
                    }
                    ramLoad = ramLoad * 0.85 + ramRaw * 0.15;

                    const sampleEvery = SystemState.settings.performance_mode === 'eco' ? 12 : 6;
                    if (frameCount % sampleEvery === 0) {
                        data.fps.push(Math.max(0, Math.min(144, fps))); data.fps.shift();
                        data.cpu.push(Math.max(0, Math.min(100, cpuLoad))); data.cpu.shift();
                        data.ram.push(Math.max(0, Math.min(100, ramLoad))); data.ram.shift();

                        drawLineChart('top-fps-canvas', 'top-fps-label', data.fps, 'rgb(52,211,153)', 144, '', true);
                        drawLineChart('top-cpu-canvas', 'top-cpu-label', data.cpu, 'rgb(251,191,36)', 100, '%', false);
                        drawLineChart('top-ram-canvas', 'top-ram-label', data.ram, 'rgb(96,165,250)', 100, '%', false);
                        const sysLoad = document.getElementById('sys-load');
                        if (sysLoad) sysLoad.textContent = `${Math.round(cpuLoad)}%`;
                    }
                    requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
            },

    _lastTopWeatherFetch: 0,

    updateSystemIndicators: async (forceWeather = false) => {
                // Battery - real API (register listeners once)
                if (navigator.getBattery && !os._batteryBound) {
                    try {
                        os._batteryBound = true;
                        const b = await navigator.getBattery();
                        const iconEl = document.getElementById('top-battery-icon');
                        const val = document.getElementById('top-battery-val');
                        const wrap = document.getElementById('top-battery');
                        const updateBattery = () => {
                            const pct = Math.round(b.level * 100);
                            const lvl = b.charging ? 'battery-charging' : (pct <= 15 ? 'battery-low' : (pct <= 40 ? 'battery-medium' : 'battery'));
                            if (iconEl) iconEl.setAttribute('data-lucide', lvl);
                            if (val) val.innerText = pct + '%';
                            if (wrap) {
                                wrap.title = b.charging ? `Battery: ${pct}% (Charging)` : `Battery: ${pct}%`;
                                val && (val.className = 'text-[9px] font-mono hidden sm:inline ' + (pct <= 15 ? 'text-red-400' : pct <= 40 ? 'text-yellow-400' : 'text-gray-400'));
                                if (window.lucide) lucide.createIcons({root: wrap});
                            }
                        };
                        b.onlevelchange = updateBattery;
                        b.onchargingchange = updateBattery;
                        updateBattery();
                    } catch(_) { os._batteryBound = false; }
                }

                // WiFi - real connection info
                const wifiWrap = document.getElementById('top-wifi');
                const wifiIcon = document.getElementById('top-wifi-icon');
                const wifiSsid = document.getElementById('top-wifi-ssid');
                if (wifiWrap) {
                    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
                    const online = navigator.onLine;
                    if (wifiIcon) {
                        wifiIcon.setAttribute('data-lucide', online ? (conn && conn.downlink > 5 ? 'wifi' : 'wifi-low') : 'wifi-off');
                        wifiIcon.className = 'w-3.5 h-3.5 ' + (online ? 'text-green-400' : 'text-red-400');
                    }
                    if (wifiSsid) {
                        if (!online) {
                            wifiSsid.textContent = 'OFFLINE';
                            wifiSsid.className = wifiSsid.className.replace('text-green-400', 'text-red-400');
                        } else if (conn) {
                            const etype = (conn.effectiveType || conn.type || 'wifi').toUpperCase();
                            const dl = conn.downlink != null ? conn.downlink : 0;
                            wifiSsid.textContent = etype + (dl ? ' ' + dl + 'M' : '');
                            wifiSsid.className = wifiSsid.className.replace('text-red-400', 'text-green-400');
                        } else {
                            wifiSsid.textContent = 'WiFi';
                            wifiSsid.className = wifiSsid.className.replace('text-red-400', 'text-green-400');
                        }
                    }
                    if (conn) {
                        const rtt = conn.rtt != null ? conn.rtt + 'ms RTT' : '';
                        const dl = conn.downlink != null ? conn.downlink + ' Mbps downlink' : '';
                        wifiWrap.title = [conn.effectiveType || 'WiFi', dl, rtt].filter(Boolean).join(' \u2022 ');
                    } else {
                        wifiWrap.title = online ? 'Connected' : 'Offline';
                    }
                    if (window.lucide) lucide.createIcons({root: wifiWrap});
                }

                // Bluetooth - check availability and show status
                const btWrap = document.getElementById('top-bluetooth');
                const btIcon = document.getElementById('top-bt-icon');
                const btName = document.getElementById('top-bt-name');
                if (btWrap) {
                    const btAvailable = !!navigator.bluetooth;
                    if (btIcon) {
                        btIcon.setAttribute('data-lucide', 'bluetooth');
                        btIcon.className = 'w-3.5 h-3.5 ' + (btAvailable ? 'text-blue-400' : 'text-gray-600');
                    }
                    if (btName) {
                        if (btAvailable) {
                            btName.textContent = 'BT';
                            btName.className = 'text-[9px] font-mono hidden md:inline text-blue-400';
                        } else {
                            btName.textContent = 'BT';
                            btName.className = 'text-[9px] font-mono hidden md:inline text-gray-600';
                        }
                    }
                    btWrap.title = btAvailable ? 'Bluetooth: Available' : 'Bluetooth: Not available';
                    if (window.lucide) lucide.createIcons({root: btWrap});
                }

                // NoSleep / Screen Awake status in top bar
                const awakeWidget = document.getElementById('topbar-awake-widget');
                const awakeIcon = document.getElementById('top-awake-icon');
                const awakeStatus = document.getElementById('top-awake-status');
                if (awakeWidget && window.os) {
                    const isAwake = os.wakeLock && os.wakeLock.enabled;
                    const mode = os.wakeLock ? os.wakeLock.mode : 'STANDBY';
                    if (awakeIcon) {
                        awakeIcon.setAttribute('data-lucide', isAwake ? 'sun' : 'moon');
                        awakeIcon.className = (isAwake ? 'w-3 h-3 text-green-400' : 'w-3 h-3 text-gray-600');
                    }
                    if (awakeStatus) {
                        awakeStatus.textContent = isAwake ? 'AWAKE' : 'SLEEP';
                        awakeStatus.className = 'text-[8px] font-mono hidden md:inline ' + (isAwake ? 'text-green-400' : 'text-gray-600');
                    }
                    awakeWidget.className = 'topbar-item p-1 gap-0.5' + (isAwake ? ' awake-on' : '');
                    awakeWidget.title = isAwake ? 'Screen Awake: ON (' + mode + ')' : 'Screen Awake: OFF';
                    if (window.lucide) lucide.createIcons({root: awakeWidget});
                }

                // Weather in top bar (cached for 15 minutes to avoid API rate-limit storms)
                const nowMs = Date.now();
                if (!forceWeather && os._lastTopWeatherFetch && (nowMs - os._lastTopWeatherFetch < 900000)) {
                    return;
                }
                os._lastTopWeatherFetch = nowMs;
                try {
                    let lat = os._cachedGeo?.lat ?? 28.6139;
                    let lon = os._cachedGeo?.lon ?? 77.2090;
                    if (!os._cachedGeo) {
                        try {
                            const ctrl1 = new AbortController(); setTimeout(() => ctrl1.abort(), 4000);
                            const g = await fetch('https://ipwho.is/', { signal: ctrl1.signal });
                            const d = await g.json();
                            if (d && d.latitude) { lat = d.latitude; lon = d.longitude; os._cachedGeo = { lat, lon }; }
                        } catch { try {
                            const ctrl2 = new AbortController(); setTimeout(() => ctrl2.abort(), 4000);
                            const g2 = await fetch('https://ipapi.co/json/', { signal: ctrl2.signal });
                            const d2 = await g2.json();
                            if (d2 && d2.latitude) { lat = d2.latitude; lon = d2.longitude; os._cachedGeo = { lat, lon }; }
                        } catch(_) {} }
                    }
                    const ctrl3 = new AbortController(); setTimeout(() => ctrl3.abort(), 6000);
                    const wr = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&forecast_days=1`, { signal: ctrl3.signal });
                    if (wr.ok) {
                        const wd = await wr.json();
                        const c = wd.current || {};
                        const code = c.weather_code ?? c.weathercode ?? 0;
                        const wmoLucide = {0:'sun',1:'cloud-sun',2:'cloud-sun',3:'cloud',45:'cloud-fog',51:'cloud-drizzle',61:'cloud-rain',65:'cloud-rain',71:'snowflake',80:'cloud-rain',95:'cloud-lightning'};
                        const wmoLbl = {0:'Clear',1:'Clear',2:'Cloudy',3:'Overcast',45:'Foggy',51:'Drizzle',61:'Rain',65:'Heavy Rain',71:'Snow',80:'Showers',95:'Thunderstorm'};
                        const lucideName = wmoLucide[code] || 'cloud-sun';
                        const lbl = wmoLbl[code] || 'Clear';
                        const tbIcon = document.getElementById('topbar-weather-icon');
                        const tbTemp = document.getElementById('topbar-weather-temp');
                        const tbDesc = document.getElementById('topbar-weather-desc');
                        const wrap = document.getElementById('top-weather-wrap');
                        if (tbIcon) tbIcon.innerHTML = `<i data-lucide="${lucideName}" class="w-3.5 h-3.5 text-sky-300"></i>`;
                        if (tbTemp) tbTemp.textContent = Math.round(c.temperature_2m) + '\u00B0C';
                        if (tbDesc) tbDesc.textContent = lbl;
                        if (wrap) {
                            wrap.title = `Weather: ${lbl}, ${c.temperature_2m}\u00B0C`;
                            if (window.lucide) lucide.createIcons({root: wrap});
                        }
                    }
                } catch(_) {}
            },

    wakeLock: { enabled: false, sentinel: null, mode: 'STANDBY', video: null, canvas: null, stream: null, pulseTimer: null, busy: false },

    initNoSleepPanel: () => {
                os.updateNoSleepUI();
            },

    toggleWakeLock: () => {
                if (os.wakeLock?.enabled) os.disableWakeLock();
                else os.enableWakeLock();
            },

    enableWakeLock: async () => {
                if (!os.wakeLock) os.wakeLock = { enabled:false, sentinel:null, mode:'STANDBY' };
                if (os.wakeLock.busy) return;
                os.wakeLock.busy = true;
                os.wakeLock.enabled = true;
                SystemState.settings.screen_awake_enabled = 'on';
                SystemState.save();
                os.updateNoSleepUI('REQUESTING');
                let ok = await os._requestNativeWakeLock();
                if (!ok) ok = await os._startNoSleepFallback();
                if (!ok) {
                    os.wakeLock.mode = 'EXTERNAL_NOSLEEP.PAGE';
                    os.logTerminal('NoSleep: local wake lock blocked; use external nosleep.page helper.');
                    Notifications.push('NOSLEEP', 'Local lock blocked — opening nosleep.page helper');
                    os.openNoSleepPage();
                } else {
                    Notifications.push('NOSLEEP', 'Screen keep-awake is active');
                }
                os.wakeLock.busy = false;
                os.updateNoSleepUI();
            },

    disableWakeLock: async () => {
                if (!os.wakeLock) return;
                os.wakeLock.enabled = false;
                SystemState.settings.screen_awake_enabled = 'off';
                SystemState.save();
                try {
                    if (os.wakeLock.sentinel) await os.wakeLock.sentinel.release();
                } catch(e) {}
                os.wakeLock.sentinel = null;
                os._stopNoSleepFallback();
                os.wakeLock.mode = 'STANDBY';
                os.logTerminal('NoSleep: screen wake lock released.');
                Notifications.push('NOSLEEP', 'Screen keep-awake disabled');
                os.updateNoSleepUI();
            },

    _requestNativeWakeLock: async () => {
                if (!('wakeLock' in navigator) || !navigator.wakeLock?.request || document.hidden) return false;
                try {
                    if (os.wakeLock.sentinel) return true;
                    const sentinel = await navigator.wakeLock.request('screen');
                    os.wakeLock.sentinel = sentinel;
                    os.wakeLock.mode = 'WAKE_LOCK_API';
                    sentinel.addEventListener('release', () => {
                        os.wakeLock.sentinel = null;
                        if (os.wakeLock.enabled && !document.hidden) {
                            setTimeout(async () => {
                                if (!os.wakeLock.enabled || os.wakeLock.sentinel) return;
                                const reacquired = await os._requestNativeWakeLock();
                                if (!reacquired) await os._startNoSleepFallback();
                                os.updateNoSleepUI();
                            }, 450);
                        } else {
                            os.updateNoSleepUI();
                        }
                    });
                    os.logTerminal('NoSleep: native Screen Wake Lock API acquired.');
                    return true;
                } catch(e) {
                    os.logTerminal(`NoSleep: native wake lock unavailable (${e.name || e.message}).`);
                    return false;
                }
            },

    _startNoSleepFallback: async () => {
                try {
                    os._stopNoSleepFallback();
                    const canvas = document.createElement('canvas');
                    canvas.width = 2; canvas.height = 2;
                    const ctx = canvas.getContext('2d');
                    let flip = false;
                    const paint = () => {
                        flip = !flip;
                        ctx.fillStyle = flip ? '#000' : '#010101';
                        ctx.fillRect(0,0,2,2);
                    };
                    paint();
                    os.wakeLock.pulseTimer = setInterval(paint, 15000);
                    const video = document.createElement('video');
                    video.setAttribute('playsinline', '');
                    video.setAttribute('webkit-playsinline', '');
                    video.muted = true;
                    video.loop = true;
                    video.autoplay = true;
                    video.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px;top:-9999px;';
                    const stream = canvas.captureStream ? canvas.captureStream(1) : null;
                    if (!stream) throw new Error('captureStream unavailable');
                    video.srcObject = stream;
                    document.body.appendChild(video);
                    await video.play();
                    os.wakeLock.canvas = canvas;
                    os.wakeLock.video = video;
                    os.wakeLock.stream = stream;
                    os.wakeLock.mode = 'MEDIA_FALLBACK';
                    os.logTerminal('NoSleep: media fallback loop engaged.');
                    return true;
                } catch(e) {
                    os.logTerminal(`NoSleep: media fallback failed (${e.message}).`);
                    os._stopNoSleepFallback();
                    return false;
                }
            },

    _stopNoSleepFallback: () => {
                try { if (os.wakeLock?.pulseTimer) clearInterval(os.wakeLock.pulseTimer); } catch(e) {}
                try { if (os.wakeLock?.video) { os.wakeLock.video.pause(); os.wakeLock.video.srcObject = null; os.wakeLock.video.remove(); } } catch(e) {}
                try { if (os.wakeLock?.stream) os.wakeLock.stream.getTracks().forEach(t => t.stop()); } catch(e) {}
                if (os.wakeLock) {
                    os.wakeLock.pulseTimer = null;
                    os.wakeLock.video = null;
                    os.wakeLock.canvas = null;
                    os.wakeLock.stream = null;
                }
            },

    openNoSleepPage: () => {
                window.open('https://nosleep.page/', '_blank', 'noopener,noreferrer');
                os.logTerminal('NoSleep: opened external nosleep.page helper.');
            },

    updateNoSleepUI: (overrideLabel) => {
                const active = !!(os.wakeLock?.enabled && (os.wakeLock?.sentinel || os.wakeLock?.video || os.wakeLock?.mode === 'EXTERNAL_NOSLEEP.PAGE'));
                const mode = os.wakeLock?.mode || 'STANDBY';
                const top = document.getElementById('topbar-awake-widget');
                const state = document.getElementById('awake-state');
                if (top) top.classList.toggle('awake-on', active);
                if (state) state.innerText = active ? 'ON' : (overrideLabel === 'REQUESTING' ? 'REQ' : 'OFF');
                // Update top bar NoSleep indicator
                const awakeIcon = document.getElementById('top-awake-icon');
                const awakeStatus = document.getElementById('top-awake-status');
                if (awakeIcon) {
                    awakeIcon.setAttribute('data-lucide', active ? 'sun' : 'moon');
                    awakeIcon.className = active ? 'w-3 h-3 text-green-400' : 'w-3 h-3 text-gray-600';
                }
                if (awakeStatus) {
                    awakeStatus.textContent = active ? 'AWAKE' : (overrideLabel === 'REQUESTING' ? 'REQ...' : 'SLEEP');
                    awakeStatus.className = 'text-[8px] font-mono hidden md:inline ' + (active ? 'text-green-400' : 'text-gray-600');
                }
                if (top) top.title = active ? 'Screen Awake: ON (' + mode + ')' : 'Screen Awake: OFF';
                const orb = document.getElementById('nosleep-orb');
                if (orb) orb.classList.toggle('active', active);
                const dot = document.getElementById('nosleep-dot');
                if (dot) dot.classList.toggle('active', active);
                const label = document.getElementById('nosleep-status-label');
                if (label) label.innerText = overrideLabel || (active ? 'AWAKE_LOCKED' : 'STANDBY');
                const modeEl = document.getElementById('nosleep-mode-label');
                if (modeEl) modeEl.innerText = mode;
                const nativeEl = document.getElementById('nosleep-native-support');
                if (nativeEl) nativeEl.innerText = ('wakeLock' in navigator) ? 'SUPPORTED' : 'UNAVAILABLE';
                const fallbackEl = document.getElementById('nosleep-fallback-support');
                if (fallbackEl) fallbackEl.innerText = HTMLCanvasElement.prototype.captureStream ? 'SUPPORTED' : 'LIMITED';
                const visEl = document.getElementById('nosleep-visibility');
                if (visEl) visEl.innerText = document.hidden ? 'HIDDEN' : 'VISIBLE';
                if (window.lucide) lucide.createIcons({ root: document.getElementById('nosleep-root') || document.body });
            },

    handleWakeVisibilityChange: async () => {
                os.updateNoSleepUI();
                if (!os.wakeLock?.enabled) return;
                if (document.hidden) return;
                if (!os.wakeLock.sentinel && !os.wakeLock.video) {
                    const ok = await os._requestNativeWakeLock();
                    if (!ok) await os._startNoSleepFallback();
                    os.updateNoSleepUI();
                }
            },

    openWindow: (id) => window.winManager.open(id),

    getPinnedDock: () => {
                try { return JSON.parse(localStorage.getItem('AetherOS_PinnedDock') || '[]'); } catch(e) { return []; }
            },

    savePinnedDock: (pins) => {
                localStorage.setItem('AetherOS_PinnedDock', JSON.stringify(pins));
            },

    pinToDock: (id) => {
                const pins = os.getPinnedDock();
                if (!pins.includes(id)) {
                    pins.push(id);
                    os.savePinnedDock(pins);
                    os.logTerminal(`Dock: Pinned "${id}" to dock.`);
                    if (window.winManager) window.winManager.renderDock();
                    os.renderFinderGrid(document.getElementById('finder-search-bar')?.value || '');
                }
            },

    unpinFromDock: (id) => {
                let pins = os.getPinnedDock();
                pins = pins.filter(p => p !== id);
                os.savePinnedDock(pins);
                os.logTerminal(`Dock: Unpinned "${id}" from dock.`);
                if (window.winManager) window.winManager.renderDock();
                os.renderFinderGrid(document.getElementById('finder-search-bar')?.value || '');
            },

    togglePinDock: (id) => {
                const pins = os.getPinnedDock();
                if (pins.includes(id)) os.unpinFromDock(id);
                else os.pinToDock(id);
            },

    showDockContextMenu: (e, id, type) => {
                const menu = document.getElementById('dock-context-menu');
                if (!menu) return;
                const isPinned = os.getPinnedDock().includes(id);
                const mod = os.finderModules.find(m => m.id === id) || os.finderExtraActions.find(m => m.id === id);
                const label = mod ? mod.label : id;
                const isOpen = SystemState.windows[id] && SystemState.windows[id].isOpen;

                let html = `<div class="dock-ctx-item" style="pointer-events:none;color:rgba(255,255,255,0.35);font-size:10px;text-transform:uppercase;letter-spacing:1px;">${label}</div>`;
                html += '<div class="dock-ctx-sep"></div>';

                if (type === 'pinned' && !isOpen) {
                    html += `<div class="dock-ctx-item hover-target" onclick="os.launchFromFinder('${id}');os.hideDockContextMenu()"><i data-lucide="play" class="w-3.5 h-3.5"></i> Open</div>`;
                }
                if (isOpen) {
                    html += `<div class="dock-ctx-item hover-target" onclick="os.openWindow('${id}');os.hideDockContextMenu()"><i data-lucide="maximize-2" class="w-3.5 h-3.5"></i> Show Window</div>`;
                    html += `<div class="dock-ctx-item hover-target" onclick="window.winManager.closeWindow('${id}');os.hideDockContextMenu()"><i data-lucide="x" class="w-3.5 h-3.5"></i> Close Window</div>`;
                    html += `<div class="dock-ctx-item ctx-danger hover-target" onclick="os.forceKillApp('${id}');os.hideDockContextMenu()"><i data-lucide="zap-off" class="w-3.5 h-3.5"></i> Force Kill</div>`;
                    html += '<div class="dock-ctx-sep"></div>';
                }

                if (isPinned) {
                    html += `<div class="dock-ctx-item ctx-danger hover-target" onclick="os.unpinFromDock('${id}');os.hideDockContextMenu()"><i data-lucide="pin-off" class="w-3.5 h-3.5"></i> Unpin from Dock</div>`;
                } else {
                    html += `<div class="dock-ctx-item hover-target" onclick="os.pinToDock('${id}');os.hideDockContextMenu()"><i data-lucide="pin" class="w-3.5 h-3.5"></i> Pin to Dock</div>`;
                }

                menu.innerHTML = html;
                menu.style.display = 'block';
                menu.style.opacity = '0';
                menu.style.transform = 'scale(0.92) translateY(4px)';

                // Position near click, but keep on screen
                const mw = 200, mh = menu.offsetHeight || 140;
                let mx = e.clientX, my = e.clientY - mh - 10;
                if (my < 8) my = e.clientY + 8;
                if (mx + mw > window.innerWidth - 8) mx = window.innerWidth - mw - 8;
                menu.style.left = mx + 'px';
                menu.style.top = my + 'px';

                lucide.createIcons({ root: menu });

                // Premium entrance animation
                gsap.to(menu, { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: 'back.out(1.5)', clearProps: 'transform' });

                // Close on outside click
                setTimeout(() => document.addEventListener('mousedown', os._ctxOutsideClick), 30);
            },

    hideDockContextMenu: () => {
                const menu = document.getElementById('dock-context-menu');
                if (menu && menu.style.display !== 'none') {
                    gsap.to(menu, {
                        opacity: 0, scale: 0.94, y: 4, duration: 0.14, ease: 'power2.in',
                        onComplete: () => { menu.style.display = 'none'; }
                    });
                }
                document.removeEventListener('mousedown', os._ctxOutsideClick);
            },

    _ctxOutsideClick: (e) => {
                const menu = document.getElementById('dock-context-menu');
                if (menu && !menu.contains(e.target)) os.hideDockContextMenu();
            },

    finderOpen: false,

    finderModules: [
                { id: 'about',          label: 'About AetherOS',        icon: 'info',         category: 'System' },
                { id: 'settings',       label: 'System Config',         icon: 'sliders',      category: 'System' },
                { id: 'terminal',       label: 'Data Stream',           icon: 'terminal',     category: 'System' },
                { id: 'sysmon',         label: 'System Diagnostics',    icon: 'cpu',          category: 'System' },
                { id: 'nosleep',       label: 'NoSleep Screen Lock',    icon: 'sun',          category: 'System' },
                { id: 'notes',          label: 'Memory Scratchpad',     icon: 'lock',         category: 'System' },
                { id: 'media',          label: 'Media Console',         icon: 'radio',        category: 'Media' },
                { id: 'radiobrowser',   label: 'Global Radio',          icon: 'radio-tower',  category: 'Media' },
                { id: 'ytchtv',         label: 'Retro TV',              icon: 'tv',           category: 'Media' },
                { id: 'presence',       label: 'Uplink Presence',       icon: 'user',         category: 'Network' },
                { id: 'feed',           label: 'Signal Feed',           icon: 'rss',          category: 'Network' },
                { id: 'browser',        label: 'Web Proxy',             icon: 'globe',        category: 'Network' },
                { id: 'wplace',         label: 'Wplace Live Canvas',     icon: 'paintbrush',   category: 'Network' },
                { id: 'floor796',       label: 'Floor796 Explorer',      icon: 'building-2',   category: 'Content' },
                { id: 'globe',          label: 'Airspace Radar',        icon: 'plane',        category: 'Intelligence' },
                { id: 'market',         label: 'Market Matrix',         icon: 'trending-up',  category: 'Intelligence' },
                { id: 'entityscanner',  label: 'Entity Scanner',        icon: 'scan',         category: 'Intelligence' },
                { id: 'surveillance',   label: 'Optics Node',           icon: 'camera',       category: 'Intelligence' },
                { id: 'memes',          label: 'Memetic Intel',         icon: 'smile',        category: 'Content' },
                { id: 'filemanager',    label: 'Living Archive',        icon: 'folder-tree',  category: 'Content' },
                { id: 'wikiboard',      label: 'WikiBoard',             icon: 'network',      category: 'Content' },
                { id: 'weather',        label: 'Weather Station',       icon: 'cloud-rain',   category: 'Live APIs' },
                { id: 'nasa',           label: 'NASA Deep Space',       icon: 'telescope',    category: 'Live APIs' },
                { id: 'taskmanager',    label: 'Task Manager',          icon: 'list-x',       category: 'System' },
                { id: 'games',          label: 'Game Vault',            icon: 'gamepad-2',    category: 'Media' },
                { id: 'youtubeambient', label: 'YouTube Ambient',       icon: 'youtube',      category: 'Media' },
                { id: 'anime',          label: 'Anime Discovery',       icon: 'sparkles',     category: 'Content' },
                { id: 'manga',          label: 'Manga Launcher',        icon: 'book-open',    category: 'Content' },
                { id: 'iss',            label: 'ISS Tracker',           icon: 'satellite',    category: 'Live APIs' },
                { id: 'apistatus',      label: 'API Status Board',      icon: 'activity',     category: 'Live APIs' },
                { id: 'storage',        label: 'Storage Inspector',     icon: 'database',     category: 'System' },
                { id: 'errorconsole',   label: 'Error Console',         icon: 'bug',          category: 'System' },
                { id: 'packetviz',      label: 'Packet Visualizer',     icon: 'network',      category: 'Network' },
                { id: 'aetherbridge',   label: 'Aether Bridge',         icon: 'radio-tower',  category: 'Network' },
                { id: 'aetherlink',     label: 'Aether Link',           icon: 'link-2',       category: 'Network' },
            ],

    finderExtraActions: [],

    toggleFinder: () => {
                os.finderOpen = !os.finderOpen;
                const overlay = document.getElementById('finder-overlay');
                if (!overlay) return;

                if (os.finderOpen) {
                    os.renderFinderGrid();
                    overlay.classList.add('finder-open');
                    gsap.fromTo(overlay,
                        { opacity: 0, scale: 0.88, y: 18 },
                        { opacity: 1, scale: 1, y: 0, duration: 0.38, ease: 'back.out(1.5)' }
                    );
                    // Stagger app items in
                    setTimeout(() => {
                        const items = overlay.querySelectorAll('.finder-app-item');
                        gsap.fromTo(items,
                            { opacity: 0, y: 8, scale: 0.94 },
                            { opacity: 1, y: 0, scale: 1, duration: 0.22, stagger: 0.018, ease: 'power2.out' }
                        );
                    }, 60);
                    const searchBar = document.getElementById('finder-search-bar');
                    if (searchBar) { searchBar.value = ''; setTimeout(() => searchBar.focus(), 80); }
                    setTimeout(() => {
                        document.addEventListener('mousedown', os._finderOutsideClick);
                    }, 50);
                } else {
                    os.closeFinder();
                }
            },

    closeFinder: () => {
                os.finderOpen = false;
                const overlay = document.getElementById('finder-overlay');
                if (!overlay) return;
                document.removeEventListener('mousedown', os._finderOutsideClick);
                gsap.to(overlay, {
                    opacity: 0, scale: 0.90, y: 14, duration: 0.2, ease: 'power3.in',
                    onComplete: () => overlay.classList.remove('finder-open')
                });
            },

    _finderOutsideClick: (e) => {
                const overlay = document.getElementById('finder-overlay');
                const trigger = document.getElementById('dock-finder-trigger');
                if (overlay && !overlay.contains(e.target) && trigger && !trigger.contains(e.target)) {
                    os.closeFinder();
                }
            },

    renderFinderGrid: (filter = '') => {
                const grid = document.getElementById('finder-grid');
                if (!grid) return;

                const q = filter.toLowerCase();
                const categories = {};

                // Group modules by category
                os.finderModules.forEach(mod => {
                    if (q && !mod.label.toLowerCase().includes(q) && !mod.id.toLowerCase().includes(q) && !mod.category.toLowerCase().includes(q)) return;
                    if (!categories[mod.category]) categories[mod.category] = [];
                    categories[mod.category].push(mod);
                });

                // Add extra actions
                os.finderExtraActions.forEach(mod => {
                    if (q && !mod.label.toLowerCase().includes(q) && !mod.category.toLowerCase().includes(q)) return;
                    if (!categories[mod.category]) categories[mod.category] = [];
                    categories[mod.category].push(mod);
                });

                let html = '';
                const catOrder = ['System', 'Media', 'Network', 'Intelligence', 'Content', 'Live APIs'];
                catOrder.forEach(cat => {
                    const mods = categories[cat];
                    if (!mods || mods.length === 0) return;
                    html += `<div class="finder-section-label">${cat}</div>`;
                    const pinned = os.getPinnedDock();
                    mods.forEach(mod => {
                        const isWindow = SystemState.windows[mod.id];
                        const isRunning = isWindow && isWindow.isOpen;
                        const isPinned = pinned.includes(mod.id);
                        html += `<div class="finder-app-item hover-target ${isRunning ? 'finder-running' : ''}" onclick="os.launchFromFinder('${mod.id}')" title="${mod.label}" oncontextmenu="event.preventDefault();os.togglePinDock('${mod.id}')">
                            <button class="finder-pin-btn ${isPinned ? 'pinned' : ''} hover-target" onclick="event.stopPropagation();os.togglePinDock('${mod.id}')" title="${isPinned ? 'Unpin from Dock' : 'Pin to Dock'}"><i data-lucide="${isPinned ? 'pin-off' : 'pin'}" class="w-3 h-3"></i></button>
                            <div class="finder-app-icon"><i data-lucide="${mod.icon}" class="w-5 h-5 text-gray-300"></i></div>
                            <div class="finder-app-label">${mod.label}</div>
                        </div>`;
                    });
                    html += `<div class="finder-separator"></div>`;
                });

                if (!html) {
                    html = '<div style="grid-column:1/-1;text-align:center;padding:40px 0;color:rgba(255,255,255,0.3);font-size:12px;">No modules match your search</div>';
                }

                grid.innerHTML = html;
                lucide.createIcons({ root: grid });
            },

    filterFinderApps: (query) => {
                os.renderFinderGrid(query);
            },

    launchFromFinder: (id) => {
                // Check if it's a special action (starts with _)
                const extra = os.finderExtraActions.find(a => a.id === id);
                if (extra && extra.action) {
                    extra.action();
                    os.closeFinder();
                    return;
                }
                // Otherwise open the window. Capture the actual dock icon first so
                // Genie opening originates from the clicked pinned icon (or Finder if
                // the app is not pinned yet), not from a random/re-rendered position.
                if (window.winManager) {
                    const anchorEl = document.getElementById(`dock-item-${id}`) || document.getElementById('dock-finder-trigger');
                    window.winManager._captureDockAnchor(id, anchorEl);
                }
                os.openWindow(id);
                os.closeFinder();
            },

    currentLyricsTheme: 'default',

    setLyricsTheme: (theme) => {
                os.currentLyricsTheme = theme;
                SystemState.settings.lyrics_theme = theme;
                SystemState.save();
                const scroller = document.getElementById('media-lyric-scroller');
                if (scroller) {
                    scroller.setAttribute('data-lyrics-theme', theme);
                    // Dynamic background theme: set ambient bg color from cover art
                    if (theme === 'dynbg') {
                        const ambientBg = document.getElementById('media-ambient-bg');
                        if (ambientBg) {
                            scroller.style.background = 'transparent';
                        }
                    } else {
                        scroller.style.background = '';
                    }
                }
                // Re-highlight active line if lyrics are loaded
                if (os.entityscannerActiveLyricLine != null && os.mediaLyricsParsed) {
                    const lines = scroller ? scroller.getElementsByClassName('lyric-line') : [];
                    if (lines.length) {
                        const idx = Math.min(os.entityscannerActiveLyricLine, lines.length - 1);
                        os.scrollAndHighlightLyricLine(lines[idx]);
                    }
                }
                os.logTerminal('Lyrics: Theme set to "' + theme + '"');
            },

    mediaView: 'stream',

    setMediaView: (view) => {
                os.mediaView = view;
                os.renderMediaDashboard();
            },

    clearMusicHistory: () => {
                SystemState.history = [];
                SystemState.save();
                os.renderMediaDashboard();
                os.logTerminal('Media Console: Cleared local history logs.');
            },

    sysmonView: 'perf',

    sysMonitorLoopId: null,

    sysMonitorCanvas: null,

    sysMonitorCtx: null,

    sysmonResizeObserver: null,

    lanyardSocket: null,

    lanyardHeartbeat: null,

    audioStream: null,

    radioMetaPollTimer: null,

    signalFeed: {
                buffer: [],
                renderedIds: new Set(),
                isLooping: false
            },

    latLongToVector3: (lat, lon, radius) => {
                const phi = (90 - lat) * (Math.PI / 180);
                const theta = (lon + 180) * (Math.PI / 180);
                const x = -(radius * Math.sin(phi) * Math.cos(theta));
                const z = (radius * Math.sin(phi) * Math.sin(theta));
                const y = (radius * Math.cos(phi));
                return new THREE.Vector3(x, y, z);
            },

    switchSettingsTab: (tabId) => {
                const panel = document.getElementById('settings-panel-content');
                if (!panel) return;

                panel.innerHTML = SettingsTabs[tabId] || '';
                
                const buttons = document.querySelectorAll('#settings-tab-list button');
                buttons.forEach(btn => {
                    btn.className = "settings-tab w-full text-left px-3 py-2 rounded text-gray-500 hover:text-white hover:bg-white/5 transition-all hover-target cursor-none flex items-center gap-2";
                });

                const tabIndexMap = { api: 0, appearance: 1, themes: 2, system: 3 };
                const activeBtn = buttons[tabIndexMap[tabId]];
                if (activeBtn) {
                    activeBtn.className = "settings-tab active w-full text-left px-3 py-2 rounded bg-white/10 text-white hover-target cursor-none transition-all flex items-center gap-2";
                }

                if (tabId === 'api') {
                    const _sv = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
                    _sv('set-lastfm-user', SystemState.settings.api_lastfm_user || '');
                    _sv('set-lastfm-key',  SystemState.settings.api_lastfm || '');
                    _sv('set-discord',     SystemState.settings.api_discord || '');
                    _sv('set-github',      SystemState.settings.api_github || '');
                    _sv('set-rss',         SystemState.settings.api_rss || '');
                    _sv('set-subreddits',  SystemState.settings.api_custom_subreddits || '');
                } else if (tabId === 'appearance') {
                    os.updatePerformanceUIVisuals();
                    const acc = document.getElementById('opt-color-accent');
                    if (acc) acc.value = SystemState.settings.theme_accent || '#ffffff';
                } else if (tabId === 'themes') {
                    // Highlight active theme
                    const activeThemeEl = document.getElementById('active-theme-name');
                    const activeAccentEl = document.getElementById('active-theme-accent');
                    if (activeThemeEl) activeThemeEl.innerText = SystemState.settings.active_theme || 'Midnight';
                    if (activeAccentEl) {
                        activeAccentEl.innerText = SystemState.settings.theme_accent || '#ffffff';
                        activeAccentEl.style.color = SystemState.settings.theme_accent || '#ffffff';
                    }
                    // Mark active theme button
                    const curTheme = SystemState.settings.active_theme || 'midnight';
                    document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('theme-active'));
                    const activeThemeBtn = document.getElementById('theme-btn-' + curTheme);
                    if (activeThemeBtn) activeThemeBtn.classList.add('theme-active');
                    lucide.createIcons({ root: panel });
                } else if (tabId === 'system') {
                    os.updatePerformanceUIVisuals();
                    // Populate dynamic values
                    const openWins = document.getElementById('settings-open-wins');
                    if (openWins) openWins.innerText = Object.values(SystemState.windows).filter(w=>w.isOpen).length;
                    const stateSize = document.getElementById('settings-state-size');
                    if (stateSize) {
                        try {
                            const s = localStorage.getItem('AetherOS_State') || '';
                            stateSize.innerText = (s.length / 1024).toFixed(1) + ' KB';
                        } catch(e) { stateSize.innerText = '--'; }
                    }
                    const diagPower = document.getElementById('sys-diagnostic-power');
                    if (diagPower) diagPower.innerText = SystemState.settings.performance_mode === 'eco' ? 'ECO_BATTERY' : 'MAX_PERF';
                    const memSnap = document.getElementById('settings-mem-snapshot');
                    if (memSnap) {
                        if (performance.memory) {
                            const used = (performance.memory.usedJSHeapSize / 1048576).toFixed(1);
                            const total = (performance.memory.jsHeapSizeLimit / 1048576).toFixed(0);
                            const pct = Math.round((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100);
                            memSnap.innerHTML = `<div class="flex justify-between mb-1"><span class="text-gray-500">Heap Used</span><span class="text-white font-bold">${used} MB / ${total} MB</span></div><div class="w-full h-1.5 bg-os-900 rounded overflow-hidden"><div class="h-full bg-white/50 rounded" style="width:${pct}%"></div></div><div class="text-gray-600 mt-1">${pct}% heap utilization</div>`;
                        } else {
                            memSnap.innerHTML = '<span class="text-gray-600">JS heap API unavailable in this browser.</span>';
                        }
                    }
                }
                lucide.createIcons({ root: document.getElementById('settings-tab-list') });
            },

    updatePerformanceUIVisuals: () => {
                const activeModeId = SystemState.settings.performance_mode === 'eco' ? 'opt-perf-eco' : 'opt-perf-cinematic';
                const activeBtn = document.getElementById(activeModeId);
                
                const deactiveModeId = SystemState.settings.performance_mode === 'eco' ? 'opt-perf-cinematic' : 'opt-perf-eco';
                const deactiveBtn = document.getElementById(deactiveModeId);

                if (activeBtn) activeBtn.className = "flex-1 p-2 bg-white/20 text-white border border-white/30 text-xs font-mono uppercase rounded transition hover-target cursor-none";
                if (deactiveBtn) deactiveBtn.className = "flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded text-gray-400 transition hover-target cursor-none";

                const activeMotionId = SystemState.settings.motion_intensity === 'low' ? 'opt-motion-low' : 'opt-motion-high';
                const activeMotionBtn = document.getElementById(activeMotionId);
                
                const deactiveMotionId = SystemState.settings.motion_intensity === 'low' ? 'opt-motion-high' : 'opt-motion-low';
                const deactiveMotionBtn = document.getElementById(deactiveMotionId);

                if (activeMotionBtn) activeMotionBtn.className = "flex-1 p-2 bg-white/20 text-white border border-white/30 text-xs font-mono uppercase rounded transition hover-target cursor-none";
                if (deactiveMotionBtn) deactiveMotionBtn.className = "flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded text-gray-400 transition hover-target cursor-none";

                // Wallpaper Engine Buttons
                const activeWallId = SystemState.settings.wallpaper_mode === 'gif' ? 'opt-wall-gif' : 'opt-wall-default';
                const activeWallBtn = document.getElementById(activeWallId);
                
                const deactiveWallId = SystemState.settings.wallpaper_mode === 'gif' ? 'opt-wall-default' : 'opt-wall-gif';
                const deactiveWallBtn = document.getElementById(deactiveWallId);

                if (activeWallBtn) activeWallBtn.className = "flex-1 p-2 bg-white/20 text-white border border-white/30 text-xs font-mono uppercase rounded transition hover-target cursor-none";
                if (deactiveWallBtn) deactiveWallBtn.className = "flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded text-gray-400 transition hover-target cursor-none";

                // Anime Quotes Buttons
                if (document.getElementById('opt-quote-on')) {
                    const activeQuoteId = SystemState.settings.anime_quotes === 'on' ? 'opt-quote-on' : 'opt-quote-off';
                    const activeQuoteBtn = document.getElementById(activeQuoteId);
                    
                    const deactiveQuoteId = SystemState.settings.anime_quotes === 'on' ? 'opt-quote-off' : 'opt-quote-on';
                    const deactiveQuoteBtn = document.getElementById(deactiveQuoteId);

                    if (activeQuoteBtn) activeQuoteBtn.className = "flex-1 p-2 bg-white/20 text-white border border-white/30 text-xs font-mono uppercase rounded transition hover-target cursor-none";
                    if (deactiveQuoteBtn) deactiveQuoteBtn.className = "flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded text-gray-400 transition hover-target cursor-none";
                }
                // Quote Background Buttons
                if (document.getElementById('opt-quote-bg-none')) {
                    const bgMode = SystemState.settings.quote_bg_mode || 'none';
                    ['none','static','gif'].forEach(id => {
                        const btnId = id === 'none' ? 'opt-quote-bg-none' : id === 'static' ? 'opt-quote-bg-static' : 'opt-quote-bg-gif';
                        const btn = document.getElementById(btnId);
                        if (!btn) return;
                        btn.className = id === bgMode
                            ? "flex-1 p-2 bg-white/20 text-white border border-white/30 text-xs font-mono uppercase rounded transition hover-target cursor-none"
                            : "flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded text-gray-400 transition hover-target cursor-none";
                    });
                }
                // Quote Position Buttons
                if (document.getElementById('opt-quote-pos-tl')) {
                    const pos = SystemState.settings.quote_position || 'top-left';
                    const posMap = { 'top-left':'tl', 'top-right':'tr', 'bottom-left':'bl', 'bottom-right':'br', 'center':'c' };
                    Object.keys(posMap).forEach(k => {
                        const btn = document.getElementById('opt-quote-pos-' + posMap[k]);
                        if (!btn) return;
                        btn.className = k === pos
                            ? "flex-1 p-2 bg-white/20 text-white border border-white/30 text-xs font-mono uppercase rounded transition hover-target cursor-none min-w-[5rem]"
                            : "flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded text-gray-400 transition hover-target cursor-none min-w-[5rem]";
                    });
                }

                // Cursor Theme Buttons
                if (document.getElementById('cursor-theme-grid')) {
                    const activeCursor = SystemState.settings.cursor_theme || 'aether';
                    ['aether','minimal','neon','comet','cursorly','ripple','sparkle','binary','crosshair','gold','void','nyan'].forEach(id => {
                        const btn = document.getElementById('opt-cursor-' + id);
                        if (!btn) return;
                        btn.className = id === activeCursor
                            ? "p-2 bg-white/20 text-white border border-white/30 text-xs font-mono uppercase rounded transition hover-target cursor-none"
                            : "p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded text-gray-400 transition hover-target cursor-none";
                    });
                }
                if (document.getElementById('opt-nyan-standard-on')) {
                    const on = SystemState.settings.cursor_nyan_standard === 'on';
                    const onBtn = document.getElementById('opt-nyan-standard-on');
                    const offBtn = document.getElementById('opt-nyan-standard-off');
                    if (onBtn) onBtn.className = on ? "flex-1 p-1.5 bg-white/20 text-white border border-white/30 text-[10px] font-mono uppercase rounded transition hover-target cursor-none" : "flex-1 p-1.5 bg-white/5 border border-white/10 text-[10px] font-mono uppercase rounded text-gray-400 transition hover-target cursor-none";
                    if (offBtn) offBtn.className = !on ? "flex-1 p-1.5 bg-white/20 text-white border border-white/30 text-[10px] font-mono uppercase rounded transition hover-target cursor-none" : "flex-1 p-1.5 bg-white/5 border border-white/10 text-[10px] font-mono uppercase rounded text-gray-400 transition hover-target cursor-none";
                }

                if (document.getElementById('opt-oneko-on')) {
                    const on = SystemState.settings.cursor_oneko === 'on';
                    const onBtn = document.getElementById('opt-oneko-on');
                    const offBtn = document.getElementById('opt-oneko-off');
                    if (onBtn) onBtn.className = on ? "flex-1 p-2 bg-white/20 text-white border border-white/30 text-xs font-mono uppercase rounded transition hover-target cursor-none" : "flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded text-gray-400 transition hover-target cursor-none";
                    if (offBtn) offBtn.className = !on ? "flex-1 p-2 bg-white/20 text-white border border-white/30 text-xs font-mono uppercase rounded transition hover-target cursor-none" : "flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded text-gray-400 transition hover-target cursor-none";
                    const ballOn = SystemState.settings.cursor_oneko_ball === 'on';
                    const ballOnBtn = document.getElementById('opt-oneko-ball-on');
                    const ballOffBtn = document.getElementById('opt-oneko-ball-off');
                    if (ballOnBtn) ballOnBtn.className = ballOn ? "flex-1 p-2 bg-white/20 text-white border border-white/30 text-xs font-mono uppercase rounded transition hover-target cursor-none" : "flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded text-gray-400 transition hover-target cursor-none";
                    if (ballOffBtn) ballOffBtn.className = !ballOn ? "flex-1 p-2 bg-white/20 text-white border border-white/30 text-xs font-mono uppercase rounded transition hover-target cursor-none" : "flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded text-gray-400 transition hover-target cursor-none";
                    const activeVariant = SystemState.settings.cursor_oneko_variant || 'classic';
                    ['classic','dog','tora','maia','vaporwave'].forEach(v => {
                        const btn = document.getElementById('opt-oneko-variant-' + v);
                        if (!btn) return;
                        btn.className = v === activeVariant
                            ? "p-2 bg-white/20 text-white border border-white/30 text-[10px] font-mono uppercase rounded transition hover-target cursor-none"
                            : "p-2 bg-white/5 border border-white/10 text-[10px] font-mono uppercase rounded text-gray-400 transition hover-target cursor-none";
                    });
                    const variantSelect = document.getElementById('oneko-variant-select');
                    if (variantSelect) variantSelect.value = activeVariant;
                }
                if (document.getElementById('opt-sakura-on')) {
                    const sakuraOn = SystemState.settings.sakura_petals === 'on';
                    const onBtn = document.getElementById('opt-sakura-on');
                    const offBtn = document.getElementById('opt-sakura-off');
                    if (onBtn) onBtn.className = sakuraOn ? "flex-1 p-2 bg-white/20 text-white border border-white/30 text-xs font-mono uppercase rounded transition hover-target cursor-none" : "flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded text-gray-400 transition hover-target cursor-none";
                    if (offBtn) offBtn.className = !sakuraOn ? "flex-1 p-2 bg-white/20 text-white border border-white/30 text-xs font-mono uppercase rounded transition hover-target cursor-none" : "flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded text-gray-400 transition hover-target cursor-none";
                    const activeSakura = SystemState.settings.sakura_intensity || 'normal';
                    ['light','normal','storm'].forEach(v => {
                        const btn = document.getElementById('opt-sakura-' + v);
                        if (!btn) return;
                        btn.className = v === activeSakura
                            ? "p-2 bg-white/20 text-white border border-white/30 text-[10px] font-mono uppercase rounded transition hover-target cursor-none"
                            : "p-2 bg-white/5 border border-white/10 text-[10px] font-mono uppercase rounded text-gray-400 transition hover-target cursor-none";
                    });
                }

                // Speech Synthesis API Buttons
                if (document.getElementById('opt-speech-on')) {
                    const activeSpeechId = SystemState.settings.speech_synthesis === 'on' ? 'opt-speech-on' : 'opt-speech-off';
                    const activeSpeechBtn = document.getElementById(activeSpeechId);
                    const deactiveSpeechId = SystemState.settings.speech_synthesis === 'on' ? 'opt-speech-off' : 'opt-speech-on';
                    const deactiveSpeechBtn = document.getElementById(deactiveSpeechId);
                    if (activeSpeechBtn) activeSpeechBtn.className = "flex-1 p-2 bg-white/20 text-white border border-white/30 text-xs font-mono uppercase rounded transition hover-target cursor-none";
                    if (deactiveSpeechBtn) deactiveSpeechBtn.className = "flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded text-gray-400 transition hover-target cursor-none";
                    const support = document.getElementById('speech-api-support');
                    if (support) {
                        support.innerText = os.speechSupported && os.speechSupported() ? 'SUPPORTED' : 'UNAVAILABLE';
                        support.className = os.speechSupported && os.speechSupported() ? 'text-green-400' : 'text-red-400';
                    }
                    os.populateSpeechVoiceSelect && os.populateSpeechVoiceSelect();
                    os.updateSpeechTuningUI && os.updateSpeechTuningUI();
                }
                // Aether Companion Chatter buttons
                if (document.getElementById('opt-companion-on')) {
                    const activeCompanionId = SystemState.settings.speech_companion === 'on' ? 'opt-companion-on' : 'opt-companion-off';
                    const activeCompanionBtn = document.getElementById(activeCompanionId);
                    const deactiveCompanionId = SystemState.settings.speech_companion === 'on' ? 'opt-companion-off' : 'opt-companion-on';
                    const deactiveCompanionBtn = document.getElementById(deactiveCompanionId);
                    if (activeCompanionBtn) activeCompanionBtn.className = "flex-1 p-2 bg-white/20 text-white border border-white/30 text-xs font-mono uppercase rounded transition hover-target cursor-none";
                    if (deactiveCompanionBtn) deactiveCompanionBtn.className = "flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded text-gray-400 transition hover-target cursor-none";
                }
                // Aether Avatar Emotion Mode buttons
                if (document.getElementById('opt-emo-gif')) {
                    const activeEmoId = (SystemState.settings.companion_emotion_mode || 'gif') === 'emo' ? 'opt-emo-oled' : 'opt-emo-gif';
                    const activeEmoBtn = document.getElementById(activeEmoId);
                    const deactiveEmoId = (SystemState.settings.companion_emotion_mode || 'gif') === 'emo' ? 'opt-emo-gif' : 'opt-emo-oled';
                    const deactiveEmoBtn = document.getElementById(deactiveEmoId);
                    if (activeEmoBtn) activeEmoBtn.className = "flex-1 p-2 bg-white/20 text-white border border-white/30 text-xs font-mono uppercase rounded transition hover-target cursor-none";
                    if (deactiveEmoBtn) deactiveEmoBtn.className = "flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded text-gray-400 transition hover-target cursor-none";
                }
            },

    setOption: (key, val) => {
                SystemState.settings[key] = val;
                SystemState.save();
                os.syncSystemPerformanceEngine();
                os.logTerminal(`State mutation: appearance.${key} set to '${val}'`);
                if (key === 'performance_mode' || key === 'motion_intensity' || key === 'wallpaper_mode' || key === 'anime_quotes' || key === 'quote_bg_mode' || key === 'quote_position' || key === 'speech_synthesis' || key === 'speech_companion' || key === 'cursor_theme' || key === 'cursor_oneko' || key === 'cursor_oneko_variant' || key === 'cursor_oneko_ball' || key === 'sakura_petals' || key === 'sakura_intensity' || key === 'cursor_nyan_standard' || key === 'companion_emotion_mode') {
                    os.updatePerformanceUIVisuals();
                }
                if (key === 'cursor_theme') {
                    if (window.cursorEngine) window.cursorEngine.applyTheme(val);
                    Notifications.push('CURSOR ENGINE', `Mouse theme set to ${val}`);
                }
                if (key === 'cursor_nyan_standard') {
                    if (window.cursorEngine) window.cursorEngine.applyTheme(SystemState.settings.cursor_theme);
                    Notifications.push('NYAN CURSOR', `Standard overlay set to ${val}`);
                }
                if (key === 'cursor_oneko') {
                    if (window.cursorEngine) window.cursorEngine.applyOneko(val === 'on');
                    Notifications.push('ONEKO', val === 'on' ? 'Cat companion enabled' : 'Cat companion disabled');
                }
                if (key === 'cursor_oneko_variant') {
                    if (window.cursorEngine) window.cursorEngine.setOnekoVariant(val);
                    Notifications.push('ONEKO', `Variant set to ${val}`);
                }
                if (key === 'cursor_oneko_ball') {
                    os.syncOnekoBall && os.syncOnekoBall();
                    Notifications.push('ONEKO BALL', val === 'on' ? 'Physics ball enabled' : 'Physics ball disabled');
                }
                if (key === 'sakura_petals' || key === 'sakura_intensity' || key === 'cursor_nyan_standard') {
                    os.syncSakuraPetals && os.syncSakuraPetals();
                    Notifications.push('SAKURA', SystemState.settings.sakura_petals === 'on' ? `Petal overlay ${SystemState.settings.sakura_intensity || 'normal'}` : 'Petal overlay disabled');
                }
                if (key === 'quote_bg_mode') {
                    os.refreshQuoteBackground();
                    Notifications.push('ANIME QUOTES', `Background set to ${val}`);
                }
                if (key === 'quote_position') {
                    os.updateQuotePosition();
                    Notifications.push('ANIME QUOTES', `Position set to ${val.replace('-', ' ')}`);
                }
                if (key === 'speech_synthesis') {
                    if (val === 'on') {
                        os.speak('AetherOS voice alerts enabled.', { force: true, interrupt: true });
                        Notifications.push('VOICE CORE', 'Speech Synthesis API enabled');
                    } else {
                        os.stopSpeech && os.stopSpeech();
                        Notifications.push('VOICE CORE', 'Speech Synthesis API muted');
                    }
                }
                if (key === 'speech_companion') {
                    if (val === 'on') {
                        os.companionSay('Jarvis mode online. I am observing, listening, and quietly assisting from the background.', { force: true });
                    } else {
                        Notifications.push('AETHER COMPANION', 'Jarvis-style chatter disabled');
                        os.logTerminal('Aether Companion: chatter disabled.');
                    }
                }
                if (key === 'companion_emotion_mode') {
                    if (val === 'emo') {
                        if (!os.emoFaceEngine) os.initEmoFace();
                        if (os.emoFaceEngine) os.emoFaceEngine.start();
                        // Hide GIF
                        const gifEl = document.getElementById('aether-avatar-gif');
                        if (gifEl) { gifEl.classList.add('hidden'); gifEl.src = ''; }
                        Notifications.push('AVATAR ENGINE', 'Emo OLED pixel-art face activated');
                    } else {
                        if (os.emoFaceEngine) os.emoFaceEngine.stop();
                        Notifications.push('AVATAR ENGINE', 'GIF Reaction mode activated');
                    }
                }
            },

    applyTheme: (name) => {
                const themes = {
                    midnight: {
                        accent: '#ffffff', accentSecondary: '#a0a0a0', accentGlow: 'rgba(255,255,255,0.6)',
                        bodyBg: '#050505',
                        wallpaper: 'radial-gradient(ellipse 80% 60% at 20% 15%, rgba(99,102,241,0.75) 0%, transparent 55%), radial-gradient(ellipse 70% 55% at 80% 25%, rgba(236,72,153,0.65) 0%, transparent 50%), radial-gradient(ellipse 65% 65% at 60% 75%, rgba(20,184,166,0.60) 0%, transparent 52%), radial-gradient(ellipse 75% 50% at 10% 80%, rgba(59,130,246,0.55) 0%, transparent 50%), radial-gradient(ellipse 90% 80% at 50% 50%, rgba(139,92,246,0.35) 0%, transparent 70%), linear-gradient(135deg, #0d0f2b 0%, #1a0e2e 35%, #0e1f2e 65%, #0d1a1f 100%)',
                        ambient: 'rgba(0,0,0,0.08)',
                        glassBg: 'rgba(255,255,255,0.07)', glassTint: 'rgba(255,255,255,0.08)', glassBorder: 'rgba(255,255,255,0.28)', glassRimTop: 'rgba(255,255,255,0.90)',
                        dockBg: 'rgba(255,255,255,0.08)', dockBorder: 'rgba(255,255,255,0.30)', dockShadow: '0 8px 32px rgba(0,0,0,0.30), 0 2px 8px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.48)',
                        dockItemBg: 'rgba(255,255,255,0.12)', dockItemBorder: 'rgba(255,255,255,0.28)', dockItemHoverBg: 'rgba(255,255,255,0.20)',
                        windowBg: 'rgba(255,255,255,0.07)', windowBorder: 'rgba(255,255,255,0.22)', windowShadow: '0 2px 6px rgba(0,0,0,0.20), 0 12px 40px rgba(0,0,0,0.28), 0 32px 72px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(255,255,255,0.28), inset 0 1px 0 rgba(255,255,255,0.42)',
                        headerBg: 'rgba(255,255,255,0.06)', headerBorder: '0.5px solid rgba(255,255,255,0.18)',
                        panelBg: 'rgba(255,255,255,0.09)', panelBorder: 'rgba(255,255,255,0.26)',
                        notificationBg: 'rgba(255,255,255,0.10)', notificationBorder: 'rgba(255,255,255,0.28)',
                        textPrimary: 'rgba(255,255,255,0.95)', textSecondary: 'rgba(255,255,255,0.65)', textMuted: 'rgba(255,255,255,0.35)',
                        eqColor: 'rgba(255,255,255,0.6)',
                        particleColor: 'rgba(255,255,255,0.38)',
                        cursorColor: '#ffffff', cursorGlow: 'rgba(255,255,255,0.95)',
                        wallpaperHue: '0deg'
                    },
                    aurora: {
                        accent: '#14ffb4', accentSecondary: '#0dd48a', accentGlow: 'rgba(20,255,180,0.6)',
                        bodyBg: '#020c0f',
                        wallpaper: 'radial-gradient(ellipse 80% 60% at 20% 15%, rgba(20,255,180,0.65) 0%, transparent 55%), radial-gradient(ellipse 70% 55% at 80% 25%, rgba(0,200,150,0.55) 0%, transparent 50%), radial-gradient(ellipse 65% 65% at 60% 75%, rgba(0,255,200,0.50) 0%, transparent 52%), radial-gradient(ellipse 75% 50% at 10% 80%, rgba(0,180,140,0.45) 0%, transparent 50%), radial-gradient(ellipse 90% 80% at 50% 50%, rgba(10,220,160,0.25) 0%, transparent 70%), linear-gradient(135deg, #020c0f 0%, #031a12 35%, #051f18 65%, #021510 100%)',
                        ambient: 'radial-gradient(ellipse at 50% -5%, rgba(20,255,180,0.12) 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(0,200,150,0.08) 0%, transparent 45%), radial-gradient(ellipse at 0% 100%, rgba(0,180,140,0.06) 0%, transparent 40%), rgba(2,12,15,0.92)',
                        glassBg: 'rgba(4,28,22,0.88)', glassTint: 'rgba(20,255,180,0.06)', glassBorder: 'rgba(20,255,180,0.22)', glassRimTop: 'rgba(20,255,180,0.80)',
                        dockBg: 'rgba(4,28,22,0.85)', dockBorder: 'rgba(20,255,180,0.25)', dockShadow: '0 8px 32px rgba(0,0,0,0.30), 0 2px 8px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(20,255,180,0.12), inset 0 1px 0 rgba(20,255,180,0.35)',
                        dockItemBg: 'rgba(20,255,180,0.10)', dockItemBorder: 'rgba(20,255,180,0.22)', dockItemHoverBg: 'rgba(20,255,180,0.18)',
                        windowBg: 'rgba(4,28,22,0.88)', windowBorder: 'rgba(20,255,180,0.18)', windowShadow: '0 2px 6px rgba(0,0,0,0.20), 0 12px 40px rgba(0,0,0,0.28), 0 32px 72px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(20,255,180,0.18), inset 0 1px 0 rgba(20,255,180,0.28)',
                        headerBg: 'rgba(4,28,22,0.85)', headerBorder: '0.5px solid rgba(20,255,180,0.14)',
                        panelBg: 'rgba(4,28,22,0.88)', panelBorder: 'rgba(20,255,180,0.22)',
                        notificationBg: 'rgba(4,28,22,0.90)', notificationBorder: 'rgba(20,255,180,0.25)',
                        textPrimary: 'rgba(240,255,250,0.95)', textSecondary: 'rgba(180,255,230,0.65)', textMuted: 'rgba(140,255,210,0.35)',
                        eqColor: 'rgba(20,255,180,0.6)',
                        particleColor: 'rgba(20,255,180,0.38)',
                        cursorColor: '#14ffb4', cursorGlow: 'rgba(20,255,180,0.95)',
                        wallpaperHue: '120deg'
                    },
                    synthwave: {
                        accent: '#c084fc', accentSecondary: '#a855f7', accentGlow: 'rgba(192,132,252,0.6)',
                        bodyBg: '#0a0412',
                        wallpaper: 'radial-gradient(ellipse 80% 60% at 20% 15%, rgba(192,132,252,0.70) 0%, transparent 55%), radial-gradient(ellipse 70% 55% at 80% 25%, rgba(168,85,247,0.60) 0%, transparent 50%), radial-gradient(ellipse 65% 65% at 60% 75%, rgba(139,92,246,0.55) 0%, transparent 52%), radial-gradient(ellipse 75% 50% at 10% 80%, rgba(124,58,237,0.50) 0%, transparent 50%), radial-gradient(ellipse 90% 80% at 50% 50%, rgba(167,139,250,0.25) 0%, transparent 70%), linear-gradient(135deg, #0a0412 0%, #16083a 35%, #1a0e3e 65%, #0d0620 100%)',
                        ambient: 'radial-gradient(ellipse at 50% -5%, rgba(192,132,252,0.12) 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(139,92,246,0.08) 0%, transparent 45%), radial-gradient(ellipse at 0% 100%, rgba(124,58,237,0.06) 0%, transparent 40%), rgba(10,4,18,0.92)',
                        glassBg: 'rgba(22,8,58,0.88)', glassTint: 'rgba(192,132,252,0.06)', glassBorder: 'rgba(168,85,247,0.22)', glassRimTop: 'rgba(192,132,252,0.80)',
                        dockBg: 'rgba(22,8,58,0.85)', dockBorder: 'rgba(168,85,247,0.25)', dockShadow: '0 8px 32px rgba(0,0,0,0.30), 0 2px 8px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(168,85,247,0.12), inset 0 1px 0 rgba(192,132,252,0.35)',
                        dockItemBg: 'rgba(192,132,252,0.10)', dockItemBorder: 'rgba(168,85,247,0.22)', dockItemHoverBg: 'rgba(192,132,252,0.18)',
                        windowBg: 'rgba(22,8,58,0.88)', windowBorder: 'rgba(168,85,247,0.18)', windowShadow: '0 2px 6px rgba(0,0,0,0.20), 0 12px 40px rgba(0,0,0,0.28), 0 32px 72px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(168,85,247,0.18), inset 0 1px 0 rgba(192,132,252,0.28)',
                        headerBg: 'rgba(22,8,58,0.85)', headerBorder: '0.5px solid rgba(168,85,247,0.14)',
                        panelBg: 'rgba(22,8,58,0.88)', panelBorder: 'rgba(168,85,247,0.22)',
                        notificationBg: 'rgba(22,8,58,0.90)', notificationBorder: 'rgba(168,85,247,0.25)',
                        textPrimary: 'rgba(250,245,255,0.95)', textSecondary: 'rgba(220,190,255,0.65)', textMuted: 'rgba(180,150,255,0.35)',
                        eqColor: 'rgba(192,132,252,0.6)',
                        particleColor: 'rgba(192,132,252,0.38)',
                        cursorColor: '#c084fc', cursorGlow: 'rgba(192,132,252,0.95)',
                        wallpaperHue: '270deg'
                    },
                    ember: {
                        accent: '#fb923c', accentSecondary: '#f97316', accentGlow: 'rgba(251,146,60,0.6)',
                        bodyBg: '#0c0603',
                        wallpaper: 'radial-gradient(ellipse 80% 60% at 20% 15%, rgba(251,146,60,0.70) 0%, transparent 55%), radial-gradient(ellipse 70% 55% at 80% 25%, rgba(249,115,22,0.60) 0%, transparent 50%), radial-gradient(ellipse 65% 65% at 60% 75%, rgba(234,88,12,0.55) 0%, transparent 52%), radial-gradient(ellipse 75% 50% at 10% 80%, rgba(255,160,50,0.50) 0%, transparent 50%), radial-gradient(ellipse 90% 80% at 50% 50%, rgba(255,180,80,0.25) 0%, transparent 70%), linear-gradient(135deg, #0c0603 0%, #1a0a02 35%, #1e0e05 65%, #0f0502 100%)',
                        ambient: 'radial-gradient(ellipse at 50% -5%, rgba(251,146,60,0.12) 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(249,115,22,0.08) 0%, transparent 45%), radial-gradient(ellipse at 0% 100%, rgba(234,88,12,0.06) 0%, transparent 40%), rgba(12,6,3,0.92)',
                        glassBg: 'rgba(26,10,2,0.88)', glassTint: 'rgba(251,146,60,0.06)', glassBorder: 'rgba(251,146,60,0.22)', glassRimTop: 'rgba(251,146,60,0.80)',
                        dockBg: 'rgba(26,10,2,0.85)', dockBorder: 'rgba(251,146,60,0.25)', dockShadow: '0 8px 32px rgba(0,0,0,0.30), 0 2px 8px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(251,146,60,0.12), inset 0 1px 0 rgba(251,146,60,0.35)',
                        dockItemBg: 'rgba(251,146,60,0.10)', dockItemBorder: 'rgba(251,146,60,0.22)', dockItemHoverBg: 'rgba(251,146,60,0.18)',
                        windowBg: 'rgba(26,10,2,0.88)', windowBorder: 'rgba(251,146,60,0.18)', windowShadow: '0 2px 6px rgba(0,0,0,0.20), 0 12px 40px rgba(0,0,0,0.28), 0 32px 72px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(251,146,60,0.18), inset 0 1px 0 rgba(251,146,60,0.28)',
                        headerBg: 'rgba(26,10,2,0.85)', headerBorder: '0.5px solid rgba(251,146,60,0.14)',
                        panelBg: 'rgba(26,10,2,0.88)', panelBorder: 'rgba(251,146,60,0.22)',
                        notificationBg: 'rgba(26,10,2,0.90)', notificationBorder: 'rgba(251,146,60,0.25)',
                        textPrimary: 'rgba(255,248,240,0.95)', textSecondary: 'rgba(255,210,170,0.65)', textMuted: 'rgba(255,180,130,0.35)',
                        eqColor: 'rgba(251,146,60,0.6)',
                        particleColor: 'rgba(251,146,60,0.38)',
                        cursorColor: '#fb923c', cursorGlow: 'rgba(251,146,60,0.95)',
                        wallpaperHue: '30deg'
                    },
                    ice: {
                        accent: '#60a5fa', accentSecondary: '#3b82f6', accentGlow: 'rgba(96,165,250,0.6)',
                        bodyBg: '#020810',
                        wallpaper: 'radial-gradient(ellipse 80% 60% at 20% 15%, rgba(96,165,250,0.70) 0%, transparent 55%), radial-gradient(ellipse 70% 55% at 80% 25%, rgba(59,130,246,0.60) 0%, transparent 50%), radial-gradient(ellipse 65% 65% at 60% 75%, rgba(37,99,235,0.55) 0%, transparent 52%), radial-gradient(ellipse 75% 50% at 10% 80%, rgba(147,197,253,0.50) 0%, transparent 50%), radial-gradient(ellipse 90% 80% at 50% 50%, rgba(191,219,254,0.25) 0%, transparent 70%), linear-gradient(135deg, #020810 0%, #071428 35%, #091a30 65%, #030d1a 100%)',
                        ambient: 'radial-gradient(ellipse at 50% -5%, rgba(96,165,250,0.12) 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(59,130,246,0.08) 0%, transparent 45%), radial-gradient(ellipse at 0% 100%, rgba(37,99,235,0.06) 0%, transparent 40%), rgba(2,8,16,0.92)',
                        glassBg: 'rgba(7,20,40,0.88)', glassTint: 'rgba(96,165,250,0.06)', glassBorder: 'rgba(96,165,250,0.22)', glassRimTop: 'rgba(147,197,253,0.80)',
                        dockBg: 'rgba(7,20,40,0.85)', dockBorder: 'rgba(96,165,250,0.25)', dockShadow: '0 8px 32px rgba(0,0,0,0.30), 0 2px 8px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(96,165,250,0.12), inset 0 1px 0 rgba(147,197,253,0.35)',
                        dockItemBg: 'rgba(96,165,250,0.10)', dockItemBorder: 'rgba(96,165,250,0.22)', dockItemHoverBg: 'rgba(96,165,250,0.18)',
                        windowBg: 'rgba(7,20,40,0.88)', windowBorder: 'rgba(96,165,250,0.18)', windowShadow: '0 2px 6px rgba(0,0,0,0.20), 0 12px 40px rgba(0,0,0,0.28), 0 32px 72px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(96,165,250,0.18), inset 0 1px 0 rgba(147,197,253,0.28)',
                        headerBg: 'rgba(7,20,40,0.85)', headerBorder: '0.5px solid rgba(96,165,250,0.14)',
                        panelBg: 'rgba(7,20,40,0.88)', panelBorder: 'rgba(96,165,250,0.22)',
                        notificationBg: 'rgba(7,20,40,0.90)', notificationBorder: 'rgba(96,165,250,0.25)',
                        textPrimary: 'rgba(245,250,255,0.95)', textSecondary: 'rgba(180,210,255,0.65)', textMuted: 'rgba(140,180,255,0.35)',
                        eqColor: 'rgba(96,165,250,0.6)',
                        particleColor: 'rgba(96,165,250,0.38)',
                        cursorColor: '#60a5fa', cursorGlow: 'rgba(96,165,250,0.95)',
                        wallpaperHue: '210deg'
                    },
                    rose: {
                        accent: '#f472b6', accentSecondary: '#ec4899', accentGlow: 'rgba(244,114,182,0.6)',
                        bodyBg: '#0c0208',
                        wallpaper: 'radial-gradient(ellipse 80% 60% at 20% 15%, rgba(244,114,182,0.70) 0%, transparent 55%), radial-gradient(ellipse 70% 55% at 80% 25%, rgba(236,72,153,0.60) 0%, transparent 50%), radial-gradient(ellipse 65% 65% at 60% 75%, rgba(219,39,119,0.55) 0%, transparent 52%), radial-gradient(ellipse 75% 50% at 10% 80%, rgba(255,150,200,0.50) 0%, transparent 50%), radial-gradient(ellipse 90% 80% at 50% 50%, rgba(255,180,210,0.25) 0%, transparent 70%), linear-gradient(135deg, #0c0208 0%, #200510 35%, #240a18 65%, #13050c 100%)',
                        ambient: 'radial-gradient(ellipse at 50% -5%, rgba(244,114,182,0.12) 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(236,72,153,0.08) 0%, transparent 45%), radial-gradient(ellipse at 0% 100%, rgba(219,39,119,0.06) 0%, transparent 40%), rgba(12,2,8,0.92)',
                        glassBg: 'rgba(32,5,16,0.88)', glassTint: 'rgba(244,114,182,0.06)', glassBorder: 'rgba(244,114,182,0.22)', glassRimTop: 'rgba(255,150,200,0.80)',
                        dockBg: 'rgba(32,5,16,0.85)', dockBorder: 'rgba(244,114,182,0.25)', dockShadow: '0 8px 32px rgba(0,0,0,0.30), 0 2px 8px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(244,114,182,0.12), inset 0 1px 0 rgba(255,150,200,0.35)',
                        dockItemBg: 'rgba(244,114,182,0.10)', dockItemBorder: 'rgba(244,114,182,0.22)', dockItemHoverBg: 'rgba(244,114,182,0.18)',
                        windowBg: 'rgba(32,5,16,0.88)', windowBorder: 'rgba(244,114,182,0.18)', windowShadow: '0 2px 6px rgba(0,0,0,0.20), 0 12px 40px rgba(0,0,0,0.28), 0 32px 72px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(244,114,182,0.18), inset 0 1px 0 rgba(255,150,200,0.28)',
                        headerBg: 'rgba(32,5,16,0.85)', headerBorder: '0.5px solid rgba(244,114,182,0.14)',
                        panelBg: 'rgba(32,5,16,0.88)', panelBorder: 'rgba(244,114,182,0.22)',
                        notificationBg: 'rgba(32,5,16,0.90)', notificationBorder: 'rgba(244,114,182,0.25)',
                        textPrimary: 'rgba(255,245,250,0.95)', textSecondary: 'rgba(255,190,220,0.65)', textMuted: 'rgba(255,160,200,0.35)',
                        eqColor: 'rgba(244,114,182,0.6)',
                        particleColor: 'rgba(244,114,182,0.38)',
                        cursorColor: '#f472b6', cursorGlow: 'rgba(244,114,182,0.95)',
                        wallpaperHue: '330deg'
                    },
                    solar: {
                        accent: '#facc15', accentSecondary: '#f59e0b', accentGlow: 'rgba(250,204,21,0.6)',
                        bodyBg: '#0d0800',
                        wallpaper: 'radial-gradient(ellipse 80% 60% at 20% 15%, rgba(250,204,21,0.70) 0%, transparent 55%), radial-gradient(ellipse 70% 55% at 80% 25%, rgba(245,158,11,0.60) 0%, transparent 50%), radial-gradient(ellipse 65% 65% at 60% 75%, rgba(234,179,8,0.55) 0%, transparent 52%), radial-gradient(ellipse 75% 50% at 10% 80%, rgba(255,220,50,0.50) 0%, transparent 50%), radial-gradient(ellipse 90% 80% at 50% 50%, rgba(255,180,0,0.22) 0%, transparent 70%), linear-gradient(135deg, #0d0800 0%, #1e1200 35%, #261800 65%, #130c00 100%)',
                        ambient: 'radial-gradient(ellipse at 50% -5%, rgba(250,204,21,0.12) 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(245,158,11,0.08) 0%, transparent 45%), radial-gradient(ellipse at 0% 100%, rgba(234,179,8,0.06) 0%, transparent 40%), rgba(13,8,0,0.92)',
                        glassBg: 'rgba(30,18,0,0.88)', glassTint: 'rgba(250,204,21,0.06)', glassBorder: 'rgba(250,204,21,0.22)', glassRimTop: 'rgba(255,230,80,0.80)',
                        dockBg: 'rgba(30,18,0,0.85)', dockBorder: 'rgba(250,204,21,0.25)', dockShadow: '0 8px 32px rgba(0,0,0,0.30), 0 2px 8px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(250,204,21,0.12), inset 0 1px 0 rgba(255,230,80,0.35)',
                        dockItemBg: 'rgba(250,204,21,0.10)', dockItemBorder: 'rgba(250,204,21,0.22)', dockItemHoverBg: 'rgba(250,204,21,0.18)',
                        windowBg: 'rgba(30,18,0,0.88)', windowBorder: 'rgba(250,204,21,0.18)', windowShadow: '0 2px 6px rgba(0,0,0,0.20), 0 12px 40px rgba(0,0,0,0.28), 0 32px 72px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(250,204,21,0.18), inset 0 1px 0 rgba(255,230,80,0.28)',
                        headerBg: 'rgba(30,18,0,0.85)', headerBorder: '0.5px solid rgba(250,204,21,0.14)',
                        panelBg: 'rgba(30,18,0,0.88)', panelBorder: 'rgba(250,204,21,0.22)',
                        notificationBg: 'rgba(30,18,0,0.90)', notificationBorder: 'rgba(250,204,21,0.25)',
                        textPrimary: 'rgba(255,252,240,0.95)', textSecondary: 'rgba(255,230,140,0.65)', textMuted: 'rgba(255,210,80,0.35)',
                        eqColor: 'rgba(250,204,21,0.6)',
                        particleColor: 'rgba(250,204,21,0.38)',
                        cursorColor: '#facc15', cursorGlow: 'rgba(250,204,21,0.95)',
                        wallpaperHue: '45deg'
                    },
                    hacker: {
                        accent: '#4ade80', accentSecondary: '#22c55e', accentGlow: 'rgba(74,222,128,0.6)',
                        bodyBg: '#000a00',
                        wallpaper: 'radial-gradient(ellipse 80% 60% at 20% 15%, rgba(74,222,128,0.60) 0%, transparent 55%), radial-gradient(ellipse 70% 55% at 80% 25%, rgba(34,197,94,0.50) 0%, transparent 50%), radial-gradient(ellipse 65% 65% at 60% 75%, rgba(21,128,61,0.45) 0%, transparent 52%), radial-gradient(ellipse 75% 50% at 10% 80%, rgba(74,222,128,0.40) 0%, transparent 50%), radial-gradient(ellipse 90% 80% at 50% 50%, rgba(20,83,45,0.22) 0%, transparent 70%), linear-gradient(135deg, #000a00 0%, #001400 35%, #001e00 65%, #000d00 100%)',
                        ambient: 'radial-gradient(ellipse at 50% -5%, rgba(74,222,128,0.10) 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(34,197,94,0.06) 0%, transparent 45%), radial-gradient(ellipse at 0% 100%, rgba(21,128,61,0.04) 0%, transparent 40%), rgba(0,10,0,0.94)',
                        glassBg: 'rgba(0,20,4,0.90)', glassTint: 'rgba(74,222,128,0.05)', glassBorder: 'rgba(74,222,128,0.22)', glassRimTop: 'rgba(74,222,128,0.72)',
                        dockBg: 'rgba(0,20,4,0.88)', dockBorder: 'rgba(74,222,128,0.25)', dockShadow: '0 8px 32px rgba(0,0,0,0.40), 0 2px 8px rgba(0,0,0,0.22), 0 0 0 0.5px rgba(74,222,128,0.12), inset 0 1px 0 rgba(74,222,128,0.32)',
                        dockItemBg: 'rgba(74,222,128,0.08)', dockItemBorder: 'rgba(74,222,128,0.20)', dockItemHoverBg: 'rgba(74,222,128,0.16)',
                        windowBg: 'rgba(0,20,4,0.90)', windowBorder: 'rgba(74,222,128,0.18)', windowShadow: '0 2px 6px rgba(0,0,0,0.30), 0 12px 40px rgba(0,0,0,0.40), 0 32px 72px rgba(0,0,0,0.28), 0 0 0 0.5px rgba(74,222,128,0.18), inset 0 1px 0 rgba(74,222,128,0.28)',
                        headerBg: 'rgba(0,16,2,0.92)', headerBorder: '0.5px solid rgba(74,222,128,0.14)',
                        panelBg: 'rgba(0,20,4,0.90)', panelBorder: 'rgba(74,222,128,0.22)',
                        notificationBg: 'rgba(0,20,4,0.92)', notificationBorder: 'rgba(74,222,128,0.25)',
                        textPrimary: 'rgba(220,255,235,0.95)', textSecondary: 'rgba(134,239,172,0.65)', textMuted: 'rgba(74,222,128,0.38)',
                        eqColor: 'rgba(74,222,128,0.6)',
                        particleColor: 'rgba(74,222,128,0.38)',
                        cursorColor: '#4ade80', cursorGlow: 'rgba(74,222,128,0.95)',
                        wallpaperHue: '140deg'
                    },
                    neonvoid: {
                        accent: '#818cf8', accentSecondary: '#6366f1', accentGlow: 'rgba(129,140,248,0.6)',
                        bodyBg: '#000008',
                        wallpaper: 'radial-gradient(ellipse 80% 60% at 15% 20%, rgba(99,102,241,0.75) 0%, transparent 55%), radial-gradient(ellipse 70% 55% at 85% 20%, rgba(244,114,182,0.65) 0%, transparent 50%), radial-gradient(ellipse 65% 65% at 60% 80%, rgba(139,92,246,0.55) 0%, transparent 52%), radial-gradient(ellipse 75% 50% at 10% 80%, rgba(99,102,241,0.50) 0%, transparent 50%), radial-gradient(ellipse 90% 80% at 50% 50%, rgba(67,56,202,0.25) 0%, transparent 70%), linear-gradient(135deg, #000008 0%, #060014 35%, #0a0020 65%, #050010 100%)',
                        ambient: 'radial-gradient(ellipse at 50% -5%, rgba(99,102,241,0.12) 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(244,114,182,0.08) 0%, transparent 45%), radial-gradient(ellipse at 0% 100%, rgba(139,92,246,0.06) 0%, transparent 40%), rgba(0,0,8,0.93)',
                        glassBg: 'rgba(6,0,20,0.88)', glassTint: 'rgba(129,140,248,0.06)', glassBorder: 'rgba(129,140,248,0.24)', glassRimTop: 'rgba(165,180,252,0.80)',
                        dockBg: 'rgba(6,0,20,0.85)', dockBorder: 'rgba(129,140,248,0.26)', dockShadow: '0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.20), 0 0 0 0.5px rgba(129,140,248,0.14), inset 0 1px 0 rgba(165,180,252,0.38)',
                        dockItemBg: 'rgba(129,140,248,0.10)', dockItemBorder: 'rgba(129,140,248,0.22)', dockItemHoverBg: 'rgba(129,140,248,0.18)',
                        windowBg: 'rgba(6,0,20,0.88)', windowBorder: 'rgba(129,140,248,0.20)', windowShadow: '0 2px 6px rgba(0,0,0,0.25), 0 12px 40px rgba(0,0,0,0.35), 0 32px 72px rgba(0,0,0,0.22), 0 0 0 0.5px rgba(129,140,248,0.20), inset 0 1px 0 rgba(165,180,252,0.32)',
                        headerBg: 'rgba(4,0,16,0.90)', headerBorder: '0.5px solid rgba(129,140,248,0.16)',
                        panelBg: 'rgba(6,0,20,0.88)', panelBorder: 'rgba(129,140,248,0.24)',
                        notificationBg: 'rgba(6,0,20,0.92)', notificationBorder: 'rgba(129,140,248,0.28)',
                        textPrimary: 'rgba(245,243,255,0.95)', textSecondary: 'rgba(199,210,254,0.65)', textMuted: 'rgba(165,180,252,0.38)',
                        eqColor: 'rgba(129,140,248,0.6)',
                        particleColor: 'rgba(129,140,248,0.38)',
                        cursorColor: '#818cf8', cursorGlow: 'rgba(129,140,248,0.95)',
                        wallpaperHue: '250deg'
                    },
                    sakura: {
                        accent: '#fbb6ce', accentSecondary: '#f9a8d4', accentGlow: 'rgba(251,182,206,0.6)',
                        bodyBg: '#0e0508',
                        wallpaper: 'radial-gradient(ellipse 80% 60% at 20% 15%, rgba(251,182,206,0.70) 0%, transparent 55%), radial-gradient(ellipse 70% 55% at 80% 25%, rgba(249,168,212,0.60) 0%, transparent 50%), radial-gradient(ellipse 65% 65% at 60% 75%, rgba(236,72,153,0.45) 0%, transparent 52%), radial-gradient(ellipse 75% 50% at 10% 80%, rgba(253,200,220,0.50) 0%, transparent 50%), radial-gradient(ellipse 90% 80% at 50% 50%, rgba(255,210,230,0.20) 0%, transparent 70%), linear-gradient(135deg, #0e0508 0%, #1e0a10 35%, #280e15 65%, #160508 100%)',
                        ambient: 'radial-gradient(ellipse at 50% -5%, rgba(251,182,206,0.10) 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(249,168,212,0.07) 0%, transparent 45%), radial-gradient(ellipse at 0% 100%, rgba(236,72,153,0.05) 0%, transparent 40%), rgba(14,5,8,0.92)',
                        glassBg: 'rgba(30,8,14,0.88)', glassTint: 'rgba(251,182,206,0.06)', glassBorder: 'rgba(251,182,206,0.22)', glassRimTop: 'rgba(255,210,225,0.80)',
                        dockBg: 'rgba(30,8,14,0.85)', dockBorder: 'rgba(251,182,206,0.24)', dockShadow: '0 8px 32px rgba(0,0,0,0.30), 0 2px 8px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(251,182,206,0.12), inset 0 1px 0 rgba(255,210,225,0.35)',
                        dockItemBg: 'rgba(251,182,206,0.10)', dockItemBorder: 'rgba(251,182,206,0.22)', dockItemHoverBg: 'rgba(251,182,206,0.18)',
                        windowBg: 'rgba(30,8,14,0.88)', windowBorder: 'rgba(251,182,206,0.18)', windowShadow: '0 2px 6px rgba(0,0,0,0.20), 0 12px 40px rgba(0,0,0,0.28), 0 32px 72px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(251,182,206,0.18), inset 0 1px 0 rgba(255,210,225,0.28)',
                        headerBg: 'rgba(25,6,12,0.90)', headerBorder: '0.5px solid rgba(251,182,206,0.14)',
                        panelBg: 'rgba(30,8,14,0.88)', panelBorder: 'rgba(251,182,206,0.22)',
                        notificationBg: 'rgba(30,8,14,0.90)', notificationBorder: 'rgba(251,182,206,0.25)',
                        textPrimary: 'rgba(255,248,252,0.95)', textSecondary: 'rgba(255,210,228,0.65)', textMuted: 'rgba(251,182,206,0.38)',
                        eqColor: 'rgba(251,182,206,0.6)',
                        particleColor: 'rgba(251,182,206,0.38)',
                        cursorColor: '#fbb6ce', cursorGlow: 'rgba(251,182,206,0.95)',
                        wallpaperHue: '345deg'
                    },
                    carbon: {
                        accent: '#94a3b8', accentSecondary: '#64748b', accentGlow: 'rgba(148,163,184,0.5)',
                        bodyBg: '#0a0a0a',
                        wallpaper: 'radial-gradient(ellipse 80% 60% at 20% 15%, rgba(100,116,139,0.50) 0%, transparent 55%), radial-gradient(ellipse 70% 55% at 80% 25%, rgba(71,85,105,0.45) 0%, transparent 50%), radial-gradient(ellipse 65% 65% at 60% 75%, rgba(51,65,85,0.40) 0%, transparent 52%), radial-gradient(ellipse 75% 50% at 10% 80%, rgba(100,116,139,0.38) 0%, transparent 50%), radial-gradient(ellipse 90% 80% at 50% 50%, rgba(30,41,59,0.20) 0%, transparent 70%), linear-gradient(135deg, #0a0a0a 0%, #121212 35%, #1a1a1a 65%, #0d0d0d 100%)',
                        ambient: 'radial-gradient(ellipse at 50% -5%, rgba(148,163,184,0.08) 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(100,116,139,0.05) 0%, transparent 45%), rgba(10,10,10,0.94)',
                        glassBg: 'rgba(18,18,20,0.90)', glassTint: 'rgba(148,163,184,0.04)', glassBorder: 'rgba(148,163,184,0.16)', glassRimTop: 'rgba(226,232,240,0.65)',
                        dockBg: 'rgba(16,16,18,0.90)', dockBorder: 'rgba(148,163,184,0.18)', dockShadow: '0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.25), 0 0 0 0.5px rgba(148,163,184,0.10), inset 0 1px 0 rgba(226,232,240,0.28)',
                        dockItemBg: 'rgba(148,163,184,0.08)', dockItemBorder: 'rgba(148,163,184,0.15)', dockItemHoverBg: 'rgba(148,163,184,0.14)',
                        windowBg: 'rgba(16,16,18,0.92)', windowBorder: 'rgba(148,163,184,0.14)', windowShadow: '0 2px 6px rgba(0,0,0,0.30), 0 12px 40px rgba(0,0,0,0.45), 0 32px 72px rgba(0,0,0,0.28), 0 0 0 0.5px rgba(148,163,184,0.14), inset 0 1px 0 rgba(226,232,240,0.18)',
                        headerBg: 'rgba(12,12,14,0.95)', headerBorder: '0.5px solid rgba(148,163,184,0.10)',
                        panelBg: 'rgba(16,16,18,0.92)', panelBorder: 'rgba(148,163,184,0.14)',
                        notificationBg: 'rgba(18,18,20,0.94)', notificationBorder: 'rgba(148,163,184,0.18)',
                        textPrimary: 'rgba(248,250,252,0.95)', textSecondary: 'rgba(203,213,225,0.65)', textMuted: 'rgba(148,163,184,0.38)',
                        eqColor: 'rgba(148,163,184,0.6)',
                        particleColor: 'rgba(148,163,184,0.30)',
                        cursorColor: '#94a3b8', cursorGlow: 'rgba(148,163,184,0.85)',
                        wallpaperHue: '0deg'
                    },
                    ocean: {
                        accent: '#38bdf8', accentSecondary: '#0ea5e9', accentGlow: 'rgba(56,189,248,0.6)',
                        bodyBg: '#00050f',
                        wallpaper: 'radial-gradient(ellipse 80% 60% at 20% 15%, rgba(56,189,248,0.70) 0%, transparent 55%), radial-gradient(ellipse 70% 55% at 80% 25%, rgba(14,165,233,0.60) 0%, transparent 50%), radial-gradient(ellipse 65% 65% at 60% 75%, rgba(34,211,238,0.55) 0%, transparent 52%), radial-gradient(ellipse 75% 50% at 10% 80%, rgba(103,232,249,0.45) 0%, transparent 50%), radial-gradient(ellipse 90% 80% at 50% 50%, rgba(8,145,178,0.22) 0%, transparent 70%), linear-gradient(135deg, #00050f 0%, #001030 35%, #001840 65%, #000c20 100%)',
                        ambient: 'radial-gradient(ellipse at 50% -5%, rgba(56,189,248,0.12) 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(34,211,238,0.08) 0%, transparent 45%), radial-gradient(ellipse at 0% 100%, rgba(14,165,233,0.06) 0%, transparent 40%), rgba(0,5,15,0.93)',
                        glassBg: 'rgba(0,16,38,0.88)', glassTint: 'rgba(56,189,248,0.06)', glassBorder: 'rgba(56,189,248,0.22)', glassRimTop: 'rgba(103,232,249,0.80)',
                        dockBg: 'rgba(0,16,38,0.86)', dockBorder: 'rgba(56,189,248,0.26)', dockShadow: '0 8px 32px rgba(0,0,0,0.32), 0 2px 8px rgba(0,0,0,0.20), 0 0 0 0.5px rgba(56,189,248,0.14), inset 0 1px 0 rgba(103,232,249,0.38)',
                        dockItemBg: 'rgba(56,189,248,0.10)', dockItemBorder: 'rgba(56,189,248,0.22)', dockItemHoverBg: 'rgba(56,189,248,0.18)',
                        windowBg: 'rgba(0,16,38,0.88)', windowBorder: 'rgba(56,189,248,0.18)', windowShadow: '0 2px 6px rgba(0,0,0,0.22), 0 12px 40px rgba(0,0,0,0.32), 0 32px 72px rgba(0,0,0,0.20), 0 0 0 0.5px rgba(56,189,248,0.20), inset 0 1px 0 rgba(103,232,249,0.30)',
                        headerBg: 'rgba(0,12,30,0.92)', headerBorder: '0.5px solid rgba(56,189,248,0.14)',
                        panelBg: 'rgba(0,16,38,0.88)', panelBorder: 'rgba(56,189,248,0.22)',
                        notificationBg: 'rgba(0,16,38,0.92)', notificationBorder: 'rgba(56,189,248,0.26)',
                        textPrimary: 'rgba(240,249,255,0.95)', textSecondary: 'rgba(186,230,253,0.65)', textMuted: 'rgba(125,211,252,0.38)',
                        eqColor: 'rgba(56,189,248,0.6)',
                        particleColor: 'rgba(56,189,248,0.38)',
                        cursorColor: '#38bdf8', cursorGlow: 'rgba(56,189,248,0.95)',
                        wallpaperHue: '200deg'
                    }
                };
                const t = themes[name];
                if (!t) return;
                const html = document.documentElement;
                
                // Apply all theme CSS variables atomically
                html.style.setProperty('--theme-accent', t.accent);
                html.style.setProperty('--theme-accent-secondary', t.accentSecondary);
                html.style.setProperty('--theme-accent-glow', t.accentGlow);
                html.style.setProperty('--theme-body-bg', t.bodyBg);
                html.style.setProperty('--theme-wallpaper', t.wallpaper);
                html.style.setProperty('--theme-ambient', t.ambient);
                html.style.setProperty('--theme-glass-bg', t.glassBg);
                html.style.setProperty('--theme-glass-tint', t.glassTint);
                html.style.setProperty('--theme-glass-border', t.glassBorder);
                html.style.setProperty('--theme-glass-rim-top', t.glassRimTop);
                html.style.setProperty('--theme-dock-bg', t.dockBg);
                html.style.setProperty('--theme-dock-border', t.dockBorder);
                html.style.setProperty('--theme-dock-shadow', t.dockShadow);
                html.style.setProperty('--theme-dock-item-bg', t.dockItemBg);
                html.style.setProperty('--theme-dock-item-border', t.dockItemBorder);
                html.style.setProperty('--theme-dock-item-hover-bg', t.dockItemHoverBg);
                html.style.setProperty('--theme-window-bg', t.windowBg);
                html.style.setProperty('--theme-window-border', t.windowBorder);
                html.style.setProperty('--theme-window-shadow', t.windowShadow);
                html.style.setProperty('--theme-header-bg', t.headerBg);
                html.style.setProperty('--theme-header-border', t.headerBorder);
                html.style.setProperty('--theme-panel-bg', t.panelBg);
                html.style.setProperty('--theme-panel-border', t.panelBorder);
                html.style.setProperty('--theme-notification-bg', t.notificationBg);
                html.style.setProperty('--theme-notification-border', t.notificationBorder);
                html.style.setProperty('--theme-text-primary', t.textPrimary);
                html.style.setProperty('--theme-text-secondary', t.textSecondary);
                html.style.setProperty('--theme-text-muted', t.textMuted);
                html.style.setProperty('--theme-eq-color', t.eqColor);
                html.style.setProperty('--theme-particle-color', t.particleColor);
                html.style.setProperty('--theme-cursor-color', t.cursorColor);
                html.style.setProperty('--theme-cursor-glow', t.cursorGlow);
                html.style.setProperty('--theme-wallpaper-hue', t.wallpaperHue);
                
                // Legacy accent support
                html.style.setProperty('--os-accent-custom', t.accent);
                html.style.setProperty('--os-theme-bg', t.bodyBg);
                document.body.style.backgroundColor = t.bodyBg;
                
                // Update wallpaper element if it exists
                const wallEl = document.getElementById('lg-wallpaper');
                if (wallEl) {
                    wallEl.style.background = t.wallpaper;
                }
                
                // Update cursor engine if available
                if (window.cursorEngine) {
                    if (window.cursorEngine.dot) {
                        window.cursorEngine.dot.style.background = t.cursorColor;
                        window.cursorEngine.dot.style.boxShadow = `0 0 10px ${t.cursorGlow}`;
                    }
                    if (window.cursorEngine.ring) {
                        window.cursorEngine.ring.style.borderColor = t.cursorColor;
                    }
                }
                
                SystemState.settings.theme_accent = t.accent;
                SystemState.settings.active_theme = name;
                SystemState.save();
                os.logTerminal(`Theme: Applied "${name}" — accent ${t.accent}`);
                Notifications.push('THEME ENGINE', `Applied "${name.charAt(0).toUpperCase()+name.slice(1)}" theme`);
                if (os.companion && os.companion.observeEvent) {
                    os.companion.observeEvent('theme_change', { theme: name });
                }
                
                // Refresh theme display if still on themes tab
                const activeThemeEl = document.getElementById('active-theme-name');
                const activeAccentEl = document.getElementById('active-theme-accent');
                if (activeThemeEl) activeThemeEl.innerText = name.charAt(0).toUpperCase()+name.slice(1);
                if (activeAccentEl) { activeAccentEl.innerText = t.accent; activeAccentEl.style.color = t.accent; }
                // Update theme button active states
                document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('theme-active'));
                const activeBtn = document.getElementById('theme-btn-' + name);
                if (activeBtn) activeBtn.classList.add('theme-active');
            },

    onekoBallEngine: null,

    syncOnekoBall: () => {
                if (!os.onekoBallEngine) os.onekoBallEngine = new OnekoBallEngine();
                os.onekoBallEngine.setEnabled(SystemState.settings.cursor_oneko_ball === 'on');
            },

    sakuraInstance: null,

    syncSakuraPetals: () => {
                const layer = document.getElementById('sakura-layer');
                if (!layer) return;
                const enabled = SystemState.settings.sakura_petals === 'on';
                if (!enabled) {
                    if (os.sakuraInstance) { os.sakuraInstance.stop(false); os.sakuraInstance = null; }
                    layer.innerHTML = '';
                    return;
                }
                const mode = SystemState.settings.sakura_intensity || 'normal';
                const config = {
                    light: { delay: 720, fallSpeed: 1.25, minSize: 8, maxSize: 12, lifeTime: 24000 },
                    normal:{ delay: 360, fallSpeed: 1.0, minSize: 9, maxSize: 14, lifeTime: 26000 },
                    storm: { delay: 140, fallSpeed: .82, minSize: 8, maxSize: 16, lifeTime: 28000 }
                }[mode] || { delay: 360, fallSpeed: 1.0, minSize: 9, maxSize: 14, lifeTime: 26000 };
                if (SystemState.settings.performance_mode === 'eco' && mode === 'storm') config.delay = 220;
                if (os.sakuraInstance) { os.sakuraInstance.stop(false); os.sakuraInstance = null; }
                layer.innerHTML = '';
                os.sakuraInstance = new Sakura('#sakura-layer', config);
            },

    syncSystemPerformanceEngine: () => {
                const html = document.documentElement;
                const topInd = document.getElementById('top-perf-indicator');
                
                if (SystemState.settings.performance_mode === 'eco') {
                    html.classList.remove('perf-cinematic');
                    html.classList.add('perf-eco');
                    if (topInd) topInd.innerText = 'v1.0.0 [ECO]';
                } else {
                    html.classList.remove('perf-eco');
                    html.classList.add('perf-cinematic');
                    if (topInd) topInd.innerText = 'v1.0.0 [CINEMATIC]';
                }

                if (SystemState.settings.theme_accent) {
                    html.style.setProperty('--os-accent-custom', SystemState.settings.theme_accent);
                }
                // Restore full theme if saved
                if (SystemState.settings.active_theme && SystemState.settings.active_theme !== 'midnight') {
                    os.applyTheme(SystemState.settings.active_theme);
                } else if (!SystemState.settings.active_theme || SystemState.settings.active_theme === 'midnight') {
                    os.applyTheme('midnight');
                }

                if (SystemState.settings.wallpaper_mode === 'gif') {
                    const wallEl = document.getElementById('gif-wallpaper');
                    if (wallEl && wallEl.classList.contains('hidden')) {
                        os.fetchWallpaperGif();
                    }
                } else {
                    const wallEl = document.getElementById('gif-wallpaper');
                    if (wallEl) {
                        wallEl.classList.add('hidden');
                    }
                }

                os.syncSakuraPetals && os.syncSakuraPetals();
                os.syncOnekoBall && os.syncOnekoBall();

                if (window.cursorEngine) {
                    window.cursorEngine.applyTheme(SystemState.settings.cursor_theme || 'aether');
                    window.cursorEngine.applyOneko(SystemState.settings.cursor_oneko === 'on');
                }

                // Sync Desktop Anime Quotes Widget
                if (SystemState.settings.anime_quotes === 'on') {
                    const quoteWidget = document.getElementById('desktop-quote-widget');
                    if (quoteWidget) {
                        quoteWidget.classList.remove('hidden');
                        if (quoteWidget.dataset.loaded !== 'true') {
                            os.fetchAnimeQuote();
                        }
                    }
                    os.updateQuotePosition();
                    os.refreshQuoteBackground();
                } else {
                    const quoteWidget = document.getElementById('desktop-quote-widget');
                    if (quoteWidget) {
                        quoteWidget.classList.add('hidden');
                    }
                }
            },

    fetchWallpaperGif: async () => {
                const wallEl = document.getElementById('gif-wallpaper');
                if (!wallEl) return;

                try {
                    const gifTypes = ['dance', 'happy', 'smile', 'laugh', 'pat', 'hug'];
                    const randomType = gifTypes[Math.floor(Math.random() * gifTypes.length)];
                    const res = await fetch(`https://nekos.best/api/v2/${randomType}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.results && data.results.length > 0) {
                            const url = data.results[0].url;
                            const img = new Image();
                            img.onload = () => {
                                wallEl.style.backgroundImage = `url('${url}')`;
                                wallEl.classList.remove('hidden');
                                os.logTerminal(`System: Dynamic GIF wallpaper updated.`);
                            };
                            img.src = url;
                        }
                    }
                } catch(e) { console.warn("Failed to fetch GIF wallpaper", e); }
            },

    fetchAnimeQuote: async () => {
                const quoteText = document.getElementById('desktop-quote-text');
                const quoteChar = document.getElementById('desktop-quote-character');
                const quoteAnime = document.getElementById('desktop-quote-anime');
                const quoteWidget = document.getElementById('desktop-quote-widget');

                if (!quoteText || !quoteChar || !quoteAnime) return;

                quoteText.innerText = "Tuning receiver to Animechan...";
                quoteChar.innerText = "--";
                quoteAnime.innerText = "--";

                const fallbackQuotes = [
                    { content: "If you don't like your destiny, don't accept it. Instead, have the courage to change it the way you want it to be.", character: "Naruto Uzumaki", anime: "Naruto" },
                    { content: "Whatever you lose, you'll find it again. But what you throw away you'll never get back.", character: "Kenshin Himura", anime: "Rurouni Kenshin" },
                    { content: "Fear is not evil. It tells you what your weakness is. And once you know your weakness, you can become stronger as well as kinder.", character: "Gildarts Clive", anime: "Fairy Tail" },
                    { content: "To know sorrow is not more than to fear. What is most important is to learn from it.", character: "Saitama", anime: "One Punch Man" },
                    { content: "Arrogance destroys the footholds of victory.", character: "Byakuya Kuchiki", anime: "Bleach" },
                    { content: "It's not always easy to stand up, but if you take just one small step, you'll find that you can keep going.", character: "Kamina", anime: "Tengen Toppa Gurren Lagann" },
                    { content: "An artificial flower cannot replace a real one, but it is still beautiful in its own way.", character: "Violet Evergarden", anime: "Violet Evergarden" },
                    { content: "If you don't take risks, you can't create a future.", character: "Monkey D. Luffy", anime: "One Piece" },
                    { content: "We don't have to change who we are. We just have to change how we live.", character: "Shogo Makishima", anime: "Psycho-Pass" },
                    { content: "If you want to make people dream, you've got to start by believing in that dream yourself!", character: "Seiya", anime: "Saint Seiya" },
                    { content: "Hard work is worthless for those who don't believe in themselves.", character: "Naruto Uzumaki", anime: "Naruto" },
                    { content: "The world isn't perfect. But it's there for us, doing the best it can... that's what makes it so damn beautiful.", character: "Roy Mustang", anime: "Fullmetal Alchemist" },
                    { content: "A person can change, at the moment when the person wishes to change.", character: "Haruhi Suzumiya", anime: "The Melancholy of Haruhi Suzumiya" },
                    { content: "If you can't find a reason to fight, then you shouldn't be fighting.", character: "Akame", anime: "Akame ga Kill!" },
                    { content: "Being weak is nothing to be ashamed of... staying weak is!", character: "Fuegoleon Vermillion", anime: "Black Clover" }
                ];

                const useFallback = () => {
                    const index = Math.floor(Math.random() * fallbackQuotes.length);
                    const q = fallbackQuotes[index];
                    quoteText.innerText = `"${q.content}"`;
                    quoteChar.innerText = q.character;
                    quoteAnime.innerText = q.anime;
                    if (quoteWidget) quoteWidget.dataset.loaded = 'true';
                    os.refreshQuoteBackground(q.anime, q.character);
                };

                try {
                    // Try the primary modern animechan.io API first
                    const res = await fetch('https://api.animechan.io/v1/quotes/random', { signal: AbortSignal.timeout(5000) });
                    if (res.ok) {
                        const json = await res.json();
                        if (json.status === 'success' && json.data) {
                            quoteText.innerText = `"${json.data.content}"`;
                            quoteChar.innerText = json.data.character?.name || "--";
                            quoteAnime.innerText = json.data.anime?.name || "--";
                            if (quoteWidget) quoteWidget.dataset.loaded = 'true';
                            os.logTerminal('System: Synced random quote from Animechan API.');
                            os.refreshQuoteBackground(json.data.anime?.name || '', json.data.character?.name || '');
                            return;
                        }
                    }
                    
                    // Try older animechan.xyz API as secondary fallback
                    const resOld = await fetch('https://animechan.xyz/api/random', { signal: AbortSignal.timeout(5000) });
                    if (resOld.ok) {
                        const json = await resOld.json();
                        if (json.quote) {
                            quoteText.innerText = `"${json.quote}"`;
                            quoteChar.innerText = json.character || "--";
                            quoteAnime.innerText = json.anime || "--";
                            if (quoteWidget) quoteWidget.dataset.loaded = 'true';
                            os.logTerminal('System: Synced random quote from Animechan backup API.');
                            os.refreshQuoteBackground(json.anime || '', json.character || '');
                            return;
                        }
                    }

                    useFallback();
                } catch(e) {
                    os.logTerminal('System: Animechan request blocked or limited, resolving with stored memory fallback.');
                    useFallback();
                }
                // refreshQuoteBackground is called inside useFallback below
            },

    updateQuotePosition: () => {
                const widget = document.getElementById('desktop-quote-widget');
                if (!widget) return;
                const pos = SystemState.settings.quote_position || 'top-left';
                widget.style.top = '';
                widget.style.bottom = '';
                widget.style.left = '';
                widget.style.right = '';
                widget.style.transform = '';
                switch(pos) {
                    case 'top-left':     widget.style.top = '16px'; widget.style.left = '16px'; break;
                    case 'top-right':    widget.style.top = '16px'; widget.style.right = '16px'; break;
                    case 'bottom-left':  widget.style.bottom = '16px'; widget.style.left = '16px'; break;
                    case 'bottom-right': widget.style.bottom = '16px'; widget.style.right = '16px'; break;
                    case 'center':       widget.style.top = '50%'; widget.style.left = '50%'; widget.style.transform = 'translate(-50%, -50%)'; break;
                    default:             widget.style.top = '16px'; widget.style.left = '16px'; break;
                }
            },

    refreshQuoteBackground: async () => {
                const layer = document.getElementById('quote-bg-layer');
                const img = document.getElementById('quote-bg-img');
                if (!layer || !img) return;
                const mode = SystemState.settings.quote_bg_mode || 'none';
                if (mode === 'none') {
                    layer.style.display = 'none';
                    img.src = '';
                    img.className = '';
                    return;
                }
                const animeName = (document.getElementById('desktop-quote-anime')?.textContent || '').trim().replace(/^--$/, '');
                const charName = (document.getElementById('desktop-quote-character')?.textContent || '').trim().replace(/^--$/, '');
                if (!animeName && !charName) {
                    layer.style.display = 'none';
                    img.src = '';
                    img.className = '';
                    return;
                }
                let imageUrl = '';
                const tryFetch = async (url, timeoutMs) => {
                    const ctrl = new AbortController();
                    const t = setTimeout(() => ctrl.abort(), timeoutMs);
                    try {
                        const res = await fetch(url, { signal: ctrl.signal });
                        clearTimeout(t);
                        if (res.ok) return res;
                    } catch(e) { clearTimeout(t); }
                    return null;
                };
                // ── GIF MODE: fetch actual animated GIFs of the character/anime ──
                if (mode === 'gif') {
                    const klipyKey = SystemState.settings.quote_gif_api_key || '';
                    const searchTerm = charName && animeName ? `${charName} ${animeName}` : charName || animeName;
                    // 1. Try klipy.com search API (character-specific GIFs)
                    if (klipyKey && searchTerm) {
                        try {
                            const res = await tryFetch(`https://api.klipy.com/api/v1/${encodeURIComponent(klipyKey)}/gifs/search?q=${encodeURIComponent(searchTerm)}&per_page=1&locale=en`, 10000);
                            if (res) {
                                const data = await res.json();
                                const items = data?.data || [];
                                if (items.length > 0) {
                                    const files = items[0].file || {};
                                    imageUrl = files?.hd?.gif?.url || files?.gif?.url || '';
                                    if (imageUrl) {
                                        os.logTerminal(`System: Klipy GIF resolved for "${searchTerm}".`);
                                    }
                                }
                            }
                        } catch(e) { console.warn('Klipy search failed', e); }
                    }
                    // 2. Fallback: generic anime GIFs (nekos.best, catboys)
                    if (!imageUrl) {
                        const gifActions = ['hug', 'kiss', 'dance', 'happy', 'wink', 'pat', 'poke', 'slap', 'bonk', 'laugh', 'cry', 'blush', 'thumbsup', 'wave', 'bite', 'stare', 'yawn', 'sleep', 'highfive'];
                        const shuffled = gifActions.slice().sort(() => Math.random() - 0.5);
                        for (const action of shuffled.slice(0, 5)) {
                            try {
                                const res = await tryFetch(`https://nekos.best/api/v2/${action}?amount=1`, 6000);
                                if (res) {
                                    const data = await res.json();
                                    if (data?.results?.length > 0) {
                                        const url = data.results[0].url;
                                        if (url) { imageUrl = url; break; }
                                    }
                                }
                            } catch(e) {}
                        }
                    }
                    if (!imageUrl) {
                        try {
                            const res = await tryFetch('https://api.catboys.com/img', 6000);
                            if (res) {
                                const data = await res.json();
                                if (data?.url) imageUrl = data.url;
                            }
                        } catch(e) {}
                    }
                }
                // ── STATIC MODE: fetch actual cover/portrait image ──
                else if (mode === 'static') {
                    // 1. Try AniList GraphQL for anime cover
                    if (animeName) {
                        try {
                            const res = await fetch('https://graphql.anilist.co', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                                signal: (new AbortController()).signal,
                                body: JSON.stringify({ query: `query($search:String){Media(search:$search,type:ANIME){coverImage{large}}}`, variables: { search: animeName } })
                            });
                            if (res && res.ok) {
                                const aniData = await res.json();
                                if (aniData?.data?.Media?.coverImage?.large) imageUrl = aniData.data.Media.coverImage.large;
                            }
                        } catch(e) {}
                    }
                    // 2. Try Jikan v4 anime search
                    if (!imageUrl && animeName) {
                        try {
                            const res = await tryFetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(animeName)}&limit=1&sfw=true`, 6000);
                            if (res) {
                                const data = await res.json();
                                if (data?.data?.length > 0) {
                                    imageUrl = data.data[0].images?.jpg?.large_image_url || data.data[0].images?.jpg?.image_url || '';
                                }
                            }
                        } catch(e) {}
                    }
                    // 3. Try Jikan v4 character search
                    if (!imageUrl && charName) {
                        try {
                            const res = await tryFetch(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(charName)}&limit=1`, 6000);
                            if (res) {
                                const data = await res.json();
                                if (data?.data?.length > 0) {
                                    imageUrl = data.data[0].images?.jpg?.image_url || '';
                                }
                            }
                        } catch(e) {}
                    }
                    // 4. Try Kitsu anime search
                    if (!imageUrl && animeName) {
                        try {
                            const res = await tryFetch(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(animeName)}&page[limit]=1`, 6000);
                            if (res) {
                                const data = await res.json();
                                if (data?.data?.length > 0) {
                                    imageUrl = data.data[0].attributes?.posterImage?.original || data.data[0].attributes?.posterImage?.large || '';
                                }
                            }
                        } catch(e) {}
                    }
                    // 5. Fallback: nekos.best static image
                    if (!imageUrl) {
                        try {
                            const types = ['neko', 'waifu', 'kitsune'];
                            const type = types[Math.floor(Math.random() * types.length)];
                            const res = await tryFetch(`https://nekos.best/api/v2/${type}?amount=1`, 6000);
                            if (res) {
                                const data = await res.json();
                                if (data?.results?.length > 0) imageUrl = data.results[0].url;
                            }
                        } catch(e) {}
                    }
                }
                if (imageUrl) {
                    const preload = new Image();
                    preload.onload = () => {
                        img.src = imageUrl;
                        img.className = '';
                        layer.style.display = '';
                        os.logTerminal(`System: Quote ${mode === 'gif' ? 'GIF' : 'background'} loaded.`);
                    };
                    preload.onerror = () => {
                        layer.style.display = 'none';
                        img.src = '';
                        img.className = '';
                        console.warn('Quote background failed to load:', imageUrl);
                    };
                    preload.src = imageUrl;
                } else {
                    layer.style.display = 'none';
                    img.src = '';
                    img.className = '';
                }
            },

    saveSettings: () => {
                SystemState.settings.api_lastfm_user = (document.getElementById('set-lastfm-user')?.value || '').trim();
                SystemState.settings.api_lastfm = (document.getElementById('set-lastfm-key')?.value || '').trim();
                SystemState.settings.api_discord = (document.getElementById('set-discord')?.value || '').trim();
                SystemState.settings.api_github = (document.getElementById('set-github')?.value || '').trim();
                SystemState.settings.api_rss = (document.getElementById('set-rss')?.value || '').trim();
                SystemState.settings.api_custom_subreddits = (document.getElementById('set-subreddits')?.value || '').trim();
                SystemState.settings.quote_gif_api_key = (document.getElementById('set-quote-gif-key')?.value || '').trim();
                SystemState.save();
                
                os.logTerminal(`State saved. Connected User: "${SystemState.settings.api_lastfm_user || 'none'}"`);
                os.renderMediaDashboard();
                const runIdle = window.requestIdleCallback || ((fn) => setTimeout(fn, 800));
            runIdle(() => os.initLanyardPresence()); 
                if (SystemState.windows.memes && SystemState.windows.memes.isOpen) os.renderMemeButtons();

                const btn = document.querySelector('#settings-panel-content button');
                if (btn) {
                const oldText = btn.innerText;
                btn.innerText = 'STATE SYNCED ✓';
                btn.classList.remove('bg-white');
                btn.classList.add('bg-green-500', 'text-black');
                setTimeout(() => {
                    btn.innerText = oldText;
                    btn.classList.remove('bg-green-500', 'text-black');
                    btn.classList.add('bg-white');
                }, 2000);
                }
            }
});
