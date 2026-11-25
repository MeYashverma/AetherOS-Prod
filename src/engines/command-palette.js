// AetherOS — Raycast-Style Command Palette v2 (Inline Calculator, App/System Actions & Deep File/Note Search)
(function () {
    const esc = (v) => String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    function tryEvaluateMath(raw) {
        const cleaned = String(raw || '').trim().replace(/^=\s*/, '');
        if (!cleaned || cleaned.length > 80) return null;

        // "X% of Y" helper
        const pctMatch = cleaned.match(/^(-?\d+(?:\.\d+)?)\s*%\s+of\s+(-?\d+(?:\.\d+)?)$/i);
        if (pctMatch) {
            const val = ( parseFloat(pctMatch[1]) / 100 ) * parseFloat(pctMatch[2]);
            return Number.isFinite(val) ? Number(val.toFixed(6)) : null;
        }

        // Strict whitelist: digits, operators, parens, decimal, whitespace, and basic Math identifiers
        const expr = cleaned
            .replace(/\bsqrt\s*\(/gi, 'Math.sqrt(')
            .replace(/\babs\s*\(/gi, 'Math.abs(')
            .replace(/\bround\s*\(/gi, 'Math.round(')
            .replace(/\bpi\b/gi, 'Math.PI')
            .replace(/\^/g, '**');

        const stripped = expr.replace(/Math\.(sqrt|abs|round|PI)/g, '');
        if (!/[0-9]/.test(stripped) || !/[+\-*/%]|Math\./.test(expr)) return null;
        if (!/^[0-9+\-*/%.()\s,]+$/.test(stripped)) return null;

        try {
            const fn = new Function(`"use strict"; return (${expr});`);
            const out = fn();
            if (typeof out === 'number' && Number.isFinite(out)) {
                return Number(out.toFixed(8));
            }
        } catch (_) {}
        return null;
    }

    function tryEvaluateConversion(raw) {
        const s = String(raw || '').trim();
        if (!s || s.length > 64) return null;
        const lower = s.toLowerCase();

        // 1. Live Unix Epoch / Timestamp
        if (lower === 'unix' || lower === 'epoch' || lower === 'timestamp' || lower === 'unix now') {
            const sec = Math.floor(Date.now() / 1000);
            return { display: `${sec}  (${new Date().toISOString()})`, copy: String(sec), swatch: '' };
        }

        // 2. Hex Color (#RGB or #RRGGBB) -> RGB & HSL
        const hexColor = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})(?:\s+(?:to|in)\s+(?:rgb|hsl))?$/i);
        if (hexColor) {
            let h = hexColor[1];
            if (h.length === 3) h = h.split('').map((c) => c + c).join('');
            const r = parseInt(h.slice(0, 2), 16);
            const g = parseInt(h.slice(2, 4), 16);
            const b = parseInt(h.slice(4, 6), 16);
            const rf = r / 255, gf = g / 255, bf = b / 255;
            const max = Math.max(rf, gf, bf), min = Math.min(rf, gf, bf);
            const l = (max + min) / 2;
            let hue = 0, sat = 0;
            if (max !== min) {
                const d = max - min;
                sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case rf: hue = ((gf - bf) / d + (gf < bf ? 6 : 0)) / 6; break;
                    case gf: hue = ((bf - rf) / d + 2) / 6; break;
                    default: hue = ((rf - gf) / d + 4) / 6; break;
                }
            }
            const rgbStr = `rgb(${r}, ${g}, ${b})`;
            const hslStr = `hsl(${Math.round(hue * 360)}, ${Math.round(sat * 100)}%, ${Math.round(l * 100)}%)`;
            return { display: `${rgbStr}  ·  ${hslStr}`, copy: rgbStr, swatch: `#${h}` };
        }

        // 3. Number Base conversions (e.g. "255 to hex", "42 to bin", "0xff to dec")
        const baseMatch = lower.match(/^(0x[0-9a-f]+|0b[01]+|\d+)\s+(?:to|in)\s+(hex|bin|binary|dec|decimal)$/i);
        if (baseMatch) {
            const rawNum = baseMatch[1];
            const target = baseMatch[2];
            const n = rawNum.startsWith('0x') ? parseInt(rawNum.slice(2), 16)
                    : rawNum.startsWith('0b') ? parseInt(rawNum.slice(2), 2)
                    : parseInt(rawNum, 10);
            if (!Number.isFinite(n)) return null;
            if (target === 'hex') return { display: '0x' + n.toString(16).toUpperCase(), copy: '0x' + n.toString(16).toUpperCase(), swatch: '' };
            if (target.startsWith('bin')) return { display: '0b' + n.toString(2), copy: '0b' + n.toString(2), swatch: '' };
            return { display: String(n), copy: String(n), swatch: '' };
        }

        // 4. Physical Units, Temperatures & Digital Storage ("100 km to mi", "72 f to c", "4096 mb to gb")
        const unitMatch = lower.match(/^(-?\d+(?:\.\d+)?)\s*([a-z°]+)\s+(?:to|in)\s+([a-z°]+)$/i);
        if (unitMatch) {
            const val = parseFloat(unitMatch[1]);
            const from = unitMatch[2].replace('°', '');
            const to = unitMatch[3].replace('°', '');

            // Temperature
            if (['c', 'f', 'k'].includes(from) && ['c', 'f', 'k'].includes(to)) {
                const celsius = from === 'c' ? val : from === 'f' ? (val - 32) * 5 / 9 : val - 273.15;
                const res = to === 'c' ? celsius : to === 'f' ? (celsius * 9 / 5 + 32) : celsius + 273.15;
                const unitLbl = to === 'k' ? 'K' : `°${to.toUpperCase()}`;
                const formatted = `${Number(res.toFixed(2))} ${unitLbl}`;
                return { display: formatted, copy: formatted, swatch: '' };
            }

            const GROUPS = [
                // Length (meters base)
                { km: 1000, m: 1, cm: 0.01, mm: 0.001, mi: 1609.344, ft: 0.3048, in: 0.0254, yd: 0.9144 },
                // Mass (kg base)
                { kg: 1, g: 0.001, mg: 0.000001, lb: 0.45359237, lbs: 0.45359237, oz: 0.02834952 },
                // Volume (liters base)
                { l: 1, ml: 0.001, gal: 3.78541178, ozfl: 0.0295735 },
                // Digital Storage (bytes base, binary 1024)
                { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3, tb: 1024 ** 4 }
            ];
            for (const g of GROUPS) {
                if (g[from] !== undefined && g[to] !== undefined) {
                    const out = (val * g[from]) / g[to];
                    const cleanNum = Number(out.toFixed(4));
                    const unitOut = ['b', 'kb', 'mb', 'gb', 'tb'].includes(to) ? to.toUpperCase() : to;
                    const formatted = `${cleanNum} ${unitOut}`;
                    return { display: formatted, copy: formatted, swatch: '' };
                }
            }
        }
        return null;
    }

    const QUICK_ACTIONS = [
        { cmd: 'open:shadertoy',    icon: 'flame',       label: 'GPU: Launch 60fps WebGL GLSL Shader Studio', tag: 'WebGL' },
        { cmd: 'open:stellarium',   icon: 'orbit',       label: 'Space: Fly NASA 3D Solar System & Planetarium', tag: '3D' },
        { cmd: 'open:worldmuseums', icon: 'landmark',    label: 'Art: Browse Met & Chicago IIIF Masterpieces', tag: 'API' },
        { cmd: 'open:georadar',     icon: 'compass',     label: 'World: Open GeoRadar 10km Wikipedia Explorer', tag: 'API' },
        { cmd: 'act:pin-win',       icon: 'pin',         label: 'Window: Pin Active Window Always-on-Top', tag: 'Sticky' },
        { cmd: 'act:focus-toggle',  icon: 'timer',       label: 'Focus: Start / Pause Pomodoro Timer', tag: 'Focus' },
        { cmd: 'act:tile-split',    icon: 'columns-2',   label: 'Window: Tile Top 2 Windows 50/50',    tag: 'Split' },
        { cmd: 'act:calendar',      icon: 'calendar',    label: 'Workspace: Open Calendar & World Clocks', tag: 'Agenda' },
        { cmd: 'act:sound-rain',    icon: 'cloud-rain',  label: 'Soundscape: Toggle Soft Rain',        tag: 'Audio' },
        { cmd: 'act:sound-brown',   icon: 'waves',       label: 'Soundscape: Toggle Warm Brown Noise', tag: 'Audio' },
        { cmd: 'act:snap-left',     icon: 'panel-left',  label: 'Window: Snap Active Window Left 50%', tag: 'Alt+←' },
        { cmd: 'act:snap-right',    icon: 'panel-right', label: 'Window: Snap Active Window Right 50%',tag: 'Alt+→' },
        { cmd: 'act:snap-max',      icon: 'maximize-2',  label: 'Window: Maximize Active Window',      tag: 'Alt+↑' },
        { cmd: 'act:mission',       icon: 'layers',      label: 'Workspace: Open Mission Control',     tag: 'Ctrl+↑' },
        { cmd: 'act:space-1',       icon: 'monitor',     label: 'Workspace: Switch to Space 01',       tag: 'Ctrl+1' },
        { cmd: 'act:space-2',       icon: 'monitor',     label: 'Workspace: Switch to Space 02',       tag: 'Ctrl+2' },
        { cmd: 'act:space-3',       icon: 'monitor',     label: 'Workspace: Switch to Space 03',       tag: 'Ctrl+3' },
        { cmd: 'act:upload-files',  icon: 'upload',      label: 'Files: Upload Local Files to Archive',tag: 'VFS' },
        { cmd: 'act:backup-export', icon: 'download',    label: 'Backup: Export .aether Workspace Snapshot', tag: 'Backup' },
        { cmd: 'act:backup-import', icon: 'folder-up',   label: 'Backup: Import .aether Workspace Snapshot', tag: 'Restore' },
        { cmd: 'act:lock',          icon: 'lock',        label: 'System: Lock Screen',                 tag: '⌘L' },
        { cmd: 'act:modules',       icon: 'blocks',      label: 'Settings: Manage App Modules & Packs',tag: 'Settings' },
        { cmd: 'theme:midnight',    icon: 'palette',     label: 'Theme: Apply Midnight Glass',         tag: 'Theme' },
        { cmd: 'theme:aurora',      icon: 'palette',     label: 'Theme: Apply Aurora Teal',            tag: 'Theme' },
        { cmd: 'theme:synthwave',   icon: 'palette',     label: 'Theme: Apply Synthwave Neon',         tag: 'Theme' },
        { cmd: 'theme:ice',         icon: 'palette',     label: 'Theme: Apply Arctic Ice',             tag: 'Theme' },
        { cmd: 'theme:solar',       icon: 'palette',     label: 'Theme: Apply Solar Gold',             tag: 'Theme' },
        { cmd: 'theme:ocean',       icon: 'palette',     label: 'Theme: Apply Ocean Depth',            tag: 'Theme' }
    ];

    class CommandPalette {
        constructor() {
            this.el = document.getElementById('cmd-palette');
            this.input = document.getElementById('cmd-input');
            this.resultsEl = document.getElementById('cmd-results');
            this.isOpen = false;
            this.selectedIndex = 0;

            this._ensureRegistryItems();

            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                    e.preventDefault();
                    this.toggle();
                    return;
                }
                if (e.key === 'Escape') {
                    if (window.os && os.finderOpen) { os.closeFinder(); return; }
                    if (this.isOpen) { e.preventDefault(); this.close(); return; }
                }
                if (this.isOpen) {
                    const visible = this._visibleItems();
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        if (visible.length) {
                            this.selectedIndex = (this.selectedIndex + 1) % visible.length;
                            this._highlightSelection(visible);
                        }
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        if (visible.length) {
                            this.selectedIndex = (this.selectedIndex - 1 + visible.length) % visible.length;
                            this._highlightSelection(visible);
                        }
                    } else if (e.key === 'Enter') {
                        e.preventDefault();
                        const targetItem = visible[this.selectedIndex] || visible[0];
                        if (targetItem) {
                            this.execute(targetItem.getAttribute('data-cmd'));
                        }
                    }
                }
            });

            if (this.el) {
                this.el.addEventListener('click', (e) => {
                    if (e.target === this.el) this.close();
                });
            }

            if (this.input) {
                this.input.addEventListener('input', () => {
                    this.filter(this.input.value);
                });
            }

            if (this.resultsEl) {
                this.resultsEl.addEventListener('click', (e) => {
                    const item = e.target && e.target.closest && e.target.closest('.cmd-item');
                    if (item) this.execute(item.getAttribute('data-cmd'));
                });
                this.resultsEl.addEventListener('mousemove', (e) => {
                    const item = e.target && e.target.closest && e.target.closest('.cmd-item');
                    if (!item) return;
                    const visible = this._visibleItems();
                    const idx = visible.indexOf(item);
                    if (idx >= 0 && idx !== this.selectedIndex) {
                        this.selectedIndex = idx;
                        this._highlightSelection(visible);
                    }
                });
            }
        }

        _ensureRegistryItems() {
            if (!this.resultsEl) return;
            const reg = window.AETHER_MODULE_REGISTRY || {};
            const existingMap = new Map();
            Array.from(this.resultsEl.querySelectorAll('.cmd-item')).forEach((el) => {
                const cmd = el.getAttribute('data-cmd');
                if (!cmd) return;
                existingMap.set(cmd, el);
                if (cmd.startsWith('open:')) {
                    const modId = cmd.slice(5);
                    const m = reg[modId];
                    if (m) {
                        el.innerHTML = `${window.AetherDesign?.appIcon(m.id, 20) || ''} ${esc(m.label)}`;
                    }
                }
            });

            // Ensure any newly registered modules exist
            Object.values(reg).forEach((m) => {
                const cmd = `open:${m.id}`;
                if (existingMap.has(cmd)) return;
                const row = document.createElement('div');
                row.className = 'cmd-item flex items-center justify-between p-3 rounded hover:bg-white/5 cursor-none hover-target transition-colors';
                row.setAttribute('data-cmd', cmd);
                row.innerHTML = `<div class="flex items-center gap-3">${window.AetherDesign?.appIcon(m.id, 22) || ''}<span class="text-white">${esc(m.label)}</span></div><span class="text-[10px] font-mono text-gray-500">App</span>`;
                this.resultsEl.insertBefore(row, this.resultsEl.firstChild);
                existingMap.set(cmd, row);
            });

            QUICK_ACTIONS.forEach((a) => {
                if (existingMap.has(a.cmd)) return;
                const row = document.createElement('div');
                row.className = 'cmd-item flex items-center justify-between p-3 rounded hover:bg-white/5 cursor-none hover-target transition-colors';
                row.setAttribute('data-cmd', a.cmd);
                row.setAttribute('data-quick-action', '1');
                row.innerHTML = `<div class="flex items-center gap-3"><i data-lucide="${esc(a.icon)}" class="w-4 h-4 text-sky-400"></i><span class="text-gray-200">${esc(a.label)}</span></div><span class="text-[10px] font-mono text-gray-500">${esc(a.tag)}</span>`;
                this.resultsEl.appendChild(row);
            });

            let dynHost = document.getElementById('cmd-dynamic-results');
            if (!dynHost) {
                dynHost = document.createElement('div');
                dynHost.id = 'cmd-dynamic-results';
                this.resultsEl.insertBefore(dynHost, this.resultsEl.firstChild);
            }
            if (window.lucide) lucide.createIcons({ root: this.resultsEl });
        }

        _renderDynamicResults(rawQuery) {
            const dynHost = document.getElementById('cmd-dynamic-results');
            if (!dynHost) return;
            const q = String(rawQuery || '').trim();
            const lower = q.toLowerCase();
            if (!q) {
                dynHost.innerHTML = '';
                return;
            }

            let html = '';

            // 1. Live Inline Calculator & Smart Unit/Color/Base Converter
            const conv = tryEvaluateConversion(q);
            if (conv) {
                html += `
                    <div class="cmd-item flex items-center justify-between p-3 mb-1 rounded-xl bg-sky-500/12 border border-sky-400/25 cursor-none hover-target" data-cmd="copy:${esc(conv.copy)}">
                        <div class="flex items-center gap-3">
                            ${conv.swatch ? `<span class="w-4 h-4 rounded-md border border-white/30 shrink-0" style="background:${esc(conv.swatch)}"></span>` : `<i data-lucide="arrow-left-right" class="w-4 h-4 text-sky-400"></i>`}
                            <div>
                                <div class="text-white font-mono font-semibold text-sm">${esc(conv.display)}</div>
                                <div class="text-[10px] text-sky-300/75">Press Enter to copy ${esc(conv.copy)}</div>
                            </div>
                        </div>
                        <span class="text-[10px] font-mono text-sky-300">COPY</span>
                    </div>
                `;
            }

            const mathVal = !conv ? tryEvaluateMath(q) : null;
            if (mathVal !== null) {
                html += `
                    <div class="cmd-item flex items-center justify-between p-3 mb-1 rounded-xl bg-emerald-500/12 border border-emerald-400/25 cursor-none hover-target" data-cmd="copy:${esc(String(mathVal))}">
                        <div class="flex items-center gap-3">
                            <i data-lucide="calculator" class="w-4 h-4 text-emerald-400"></i>
                            <div>
                                <div class="text-white font-mono font-semibold text-sm">= ${esc(String(mathVal))}</div>
                                <div class="text-[10px] text-emerald-300/75">Press Enter to copy result</div>
                            </div>
                        </div>
                        <span class="text-[10px] font-mono text-emerald-300">COPY</span>
                    </div>
                `;
            }

            // 2. Enable disabled optional modules directly from Command Palette
            if (q.length >= 2) {
                const enableSearch = lower.replace(/^enable\s+/, '');
                const reg = window.AETHER_MODULE_REGISTRY || {};
                Object.values(reg)
                    .filter((m) => window.os && os.isModuleEnabled && !os.isModuleEnabled(m.id))
                    .filter((m) => m.label.toLowerCase().includes(enableSearch) || m.id.toLowerCase().includes(enableSearch))
                    .slice(0, 3)
                    .forEach((m) => {
                        html += `
                            <div class="cmd-item flex items-center justify-between p-3 rounded hover:bg-white/5 cursor-none hover-target" data-cmd="enableopen:${m.id}">
                                <div class="flex items-center gap-3">
                                    ${window.AetherDesign?.appIcon(m.id, 22) || ''}
                                    <span class="text-gray-200">Enable &amp; Open <strong class="text-white">${esc(m.label)}</strong></span>
                                </div>
                                <span class="text-[10px] font-mono text-amber-300">OPTIONAL MODULE</span>
                            </div>
                        `;
                    });

                // 3. Deep Search inside Markdown Studio Tabs
                if (window.os && os.devpadState && Array.isArray(os.devpadState.tabs)) {
                    os.devpadState.tabs
                        .filter((t) => (t.title + ' ' + t.content).toLowerCase().includes(lower))
                        .slice(0, 3)
                        .forEach((t) => {
                            html += `
                                <div class="cmd-item flex items-center justify-between p-3 rounded hover:bg-white/5 cursor-none hover-target" data-cmd="devdoc:${esc(t.id)}">
                                    <div class="flex items-center gap-3">
                                        <i data-lucide="file-code" class="w-4 h-4 text-violet-400"></i>
                                        <span class="text-gray-200">Markdown Tab: <strong class="text-white">${esc(t.title)}</strong></span>
                                    </div>
                                    <span class="text-[10px] font-mono text-gray-500">DEVPAD</span>
                                </div>
                            `;
                        });
                }

                // 4. Deep Search inside File Explorer & IndexedDB VFS
                if (window.os && os.fmFlatten && os.isModuleEnabled && os.isModuleEnabled('filemanager')) {
                    os.fmFlatten()
                        .filter((n) => n.kind !== 'folder' && ((n.name || '') + ' ' + (n.content || '')).toLowerCase().includes(lower))
                        .slice(0, 4)
                        .forEach((f) => {
                            html += `
                                <div class="cmd-item flex items-center justify-between p-3 rounded hover:bg-white/5 cursor-none hover-target" data-cmd="fmfile:${esc(f.id)}">
                                    <div class="flex items-center gap-3">
                                        <i data-lucide="${esc(f.icon || 'file')}" class="w-4 h-4 text-cyan-400"></i>
                                        <span class="text-gray-200">File: <strong class="text-white">${esc(f.name)}</strong></span>
                                    </div>
                                    <span class="text-[10px] font-mono text-gray-500">ARCHIVE</span>
                                </div>
                            `;
                        });
                }
                // 5. Deep Search inside Kanban Project Boards
                if (window.os && os.kanbanState && Array.isArray(os.kanbanState.boards)) {
                    os.kanbanState.boards.forEach((b) => {
                        (b.cards || [])
                            .filter((c) => (c.title + ' ' + c.tag).toLowerCase().includes(lower))
                            .slice(0, 2)
                            .forEach((c) => {
                                html += `
                                    <div class="cmd-item flex items-center justify-between p-3 rounded hover:bg-white/5 cursor-none hover-target" data-cmd="kbboard:${esc(b.id)}">
                                        <div class="flex items-center gap-3">
                                            <i data-lucide="kanban" class="w-4 h-4 text-amber-400"></i>
                                            <span class="text-gray-200">Board Task: <strong class="text-white">${esc(c.title)}</strong></span>
                                        </div>
                                        <span class="text-[10px] font-mono text-gray-500">${esc(b.name.toUpperCase())}</span>
                                    </div>
                                `;
                            });
                    });
                }
            }

            dynHost.innerHTML = html;
            if (html && window.lucide) lucide.createIcons({ root: dynHost });
        }

        _visibleItems() {
            if (!this.el) return [];
            return Array.from(this.el.querySelectorAll('.cmd-item')).filter((el) => el.style.display !== 'none');
        }

        _highlightSelection(visible = this._visibleItems()) {
            if (!this.el) return;
            this.el.querySelectorAll('.cmd-item').forEach((el) => el.classList.remove('cmd-selected'));
            const active = visible[this.selectedIndex];
            if (active) {
                active.classList.add('cmd-selected');
                active.scrollIntoView({ block: 'nearest' });
            }
        }

        filter(rawQuery) {
            if (!this.el) return;
            this._renderDynamicResults(rawQuery);
            const q = String(rawQuery || '').trim().toLowerCase();

            Array.from(this.resultsEl.children).forEach((el) => {
                if (el.id === 'cmd-dynamic-results') return;
                const rawCmd = el.getAttribute('data-cmd') || '';
                if (rawCmd.startsWith('open:')) {
                    const modId = rawCmd.slice(5);
                    if (window.os && window.os.isModuleEnabled && !window.os.isModuleEnabled(modId)) {
                        el.style.display = 'none';
                        return;
                    }
                }
                // Keep quick actions tidy when query is empty (show top apps first, show quick actions when searching or top 6)
                if (!q && el.getAttribute('data-quick-action') === '1') {
                    const showDefault = ['act:focus-toggle', 'act:mission', 'act:upload-files', 'act:backup-export', 'act:lock'].includes(rawCmd);
                    el.style.display = showDefault ? 'flex' : 'none';
                    return;
                }
                const cmd = rawCmd.toLowerCase();
                const txt = (el.textContent || '').toLowerCase();
                const show = !q || txt.includes(q) || cmd.includes(q);
                el.style.display = show ? 'flex' : 'none';
            });

            this.selectedIndex = 0;
            this._highlightSelection();
        }

        toggle() {
            this.isOpen ? this.close() : this.open();
        }

        open() {
            if (window.os && os.finderOpen) os.closeFinder();
            this._ensureRegistryItems();
            this.isOpen = true;
            this.el.style.display = 'flex';
            this.input.value = '';
            this.filter('');
            if (window.gsap) {
                gsap.fromTo(this.el, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: 'power2.out' });
                gsap.fromTo(this.el.firstElementChild, { scale: 0.95, y: -12, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.24, ease: 'power2.out' });
            }
            this.input.focus();
        }

        close() {
            this.isOpen = false;
            if (window.gsap) {
                gsap.to(this.el, {
                    opacity: 0,
                    duration: 0.14,
                    ease: 'power2.in',
                    onComplete: () => { this.el.style.display = 'none'; }
                });
                gsap.to(this.el.firstElementChild, { scale: 0.96, y: -8, duration: 0.14, ease: 'power2.in' });
            } else {
                this.el.style.display = 'none';
            }
        }

        execute(cmd) {
            if (!cmd) return;
            const idx = cmd.indexOf(':');
            const action = idx >= 0 ? cmd.slice(0, idx) : cmd;
            const target = idx >= 0 ? cmd.slice(idx + 1) : '';

            if (action === 'open') {
                window.os.openWindow(target);
            } else if (action === 'enableopen') {
                window.os.setModuleEnabled(target, true);
                window.os.openWindow(target);
            } else if (action === 'copy') {
                navigator.clipboard && navigator.clipboard.writeText(target).catch(() => {});
                window.os && os.recordClipboardItem && os.recordClipboardItem(target, '⌘K');
                window.Notifications && window.Notifications.push('CLIPBOARD', `Copied ${target.slice(0, 48)}`);
            } else if (action === 'kbboard') {
                window.os.openWindow('kanban');
                setTimeout(() => window.os.kanbanSelectBoard && window.os.kanbanSelectBoard(target), 30);
            } else if (action === 'devdoc') {
                window.os.openWindow('devpad');
                setTimeout(() => window.os.devpadSelectTab && window.os.devpadSelectTab(target), 30);
            } else if (action === 'fmfile') {
                window.os.openWindow('filemanager');
                setTimeout(() => window.os.fmOpenFile && window.os.fmOpenFile(target), 30);
            } else if (action === 'theme') {
                window.os.applyTheme && window.os.applyTheme(target);
            } else if (action === 'act') {
                if (target === 'pin-win') {
                    const top = Object.entries(SystemState.windows || {}).filter(([, w]) => w.isOpen && !w.isMinimized).sort((a, b) => (b[1].zIndex || 0) - (a[1].zIndex || 0))[0];
                    if (top && window.winManager) window.winManager.togglePinWindow(top[0]);
                }
                else if (target === 'focus-toggle') { window.os.openWindow('focus'); setTimeout(() => os.focusToggleTimer && os.focusToggleTimer(), 30); }
                else if (target === 'tile-split') { setTimeout(() => os.tileSideBySide && os.tileSideBySide(), 30); }
                else if (target === 'calendar') { setTimeout(() => os.toggleCalendarPopover && os.toggleCalendarPopover(true), 40); }
                else if (target === 'sound-rain') { os.focusToggleSound && os.focusToggleSound('rain'); }
                else if (target === 'sound-brown') { os.focusToggleSound && os.focusToggleSound('brown'); }
                else if (target === 'snap-left') { os.snapActiveWindow && os.snapActiveWindow('left'); }
                else if (target === 'snap-right') { os.snapActiveWindow && os.snapActiveWindow('right'); }
                else if (target === 'snap-max') { os.snapActiveWindow && os.snapActiveWindow('maximize'); }
                else if (target === 'mission') { setTimeout(() => os.toggleMissionControl && os.toggleMissionControl(true), 40); }
                else if (target.startsWith('space-')) { os.switchSpace && os.switchSpace(Number(target.slice(6))); }
                else if (target === 'upload-files') { window.AetherVFS && window.AetherVFS.triggerUploadDialog(); }
                else if (target === 'backup-export') { window.AetherBackup && window.AetherBackup.triggerExportUI(); }
                else if (target === 'backup-import') { window.AetherBackup && window.AetherBackup.triggerImportUI(); }
                else if (target === 'lock') { setTimeout(() => os.lockScreen && os.lockScreen(), 40); }
                else if (target === 'modules') { os.openSettingsSection && os.openSettingsSection('modules'); }
            } else if (action === 'sys' && target === 'reset') {
                window.os.confirmFactoryReset ? window.os.confirmFactoryReset() : SystemState.reset();
            }
            this.close();
        }
    }

    window.CommandPalette = CommandPalette;
    window.CommandPaletteClass = CommandPalette;
})();
