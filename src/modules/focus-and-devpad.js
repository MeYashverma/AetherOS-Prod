// AetherOS — Focus & Soundscapes Studio + Multi-Tab Markdown & Developer Toolkit
(function () {
    const esc = (v) => String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    window.WindowContents = window.WindowContents || {};

    window.WindowContents.focus = `
        <div class="h-full flex flex-col md:flex-row bg-[#07080c]/90 text-xs overflow-hidden" id="focus-studio-root">
            <!-- Left: Pomodoro Timer & Session Checklist -->
            <div class="flex-1 p-5 flex flex-col gap-4 overflow-y-auto border-b md:border-b-0 md:border-r border-white/[0.07]">
                <div class="flex items-center justify-between gap-2">
                    <div class="os-segmented">
                        <button type="button" onclick="os.focusSetMode('focus25')" data-focus-mode="focus25" class="os-seg-btn active hover-target cursor-none">Focus 25m</button>
                        <button type="button" onclick="os.focusSetMode('deep50')" data-focus-mode="deep50" class="os-seg-btn hover-target cursor-none">Deep 50m</button>
                        <button type="button" onclick="os.focusSetMode('break5')" data-focus-mode="break5" class="os-seg-btn hover-target cursor-none">Break 5m</button>
                        <button type="button" onclick="os.focusSetMode('break15')" data-focus-mode="break15" class="os-seg-btn hover-target cursor-none">Rest 15m</button>
                    </div>
                    <span class="text-[11px] font-mono text-emerald-400" id="focus-streak-badge">0 sessions</span>
                </div>

                <!-- Circular Timer Display -->
                <div class="flex flex-col items-center justify-center py-3">
                    <div class="relative w-44 h-44 flex items-center justify-center">
                        <svg class="w-full h-full -rotate-90" viewBox="0 0 160 160">
                            <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="6"></circle>
                            <circle id="focus-ring-progress" cx="80" cy="80" r="70" fill="none" stroke="#34d399" stroke-width="6"
                                stroke-linecap="round" stroke-dasharray="439.82" stroke-dashoffset="0" style="transition:stroke-dashoffset 0.4s ease"></circle>
                        </svg>
                        <div class="absolute inset-0 flex flex-col items-center justify-center">
                            <div id="focus-time-display" class="text-4xl font-semibold tracking-tight text-white font-mono">25:00</div>
                            <div id="focus-status-label" class="text-[10.5px] text-gray-400 uppercase tracking-widest mt-1">Ready</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2.5 mt-3">
                        <button type="button" id="focus-toggle-btn" onclick="os.focusToggleTimer()"
                            class="px-5 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-gray-200 transition hover-target cursor-none">Start Focus</button>
                        <button type="button" onclick="os.focusResetTimer()"
                            class="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/12 border border-white/10 text-gray-300 text-xs transition hover-target cursor-none">Reset</button>
                    </div>
                </div>

                <!-- Focus Checklist -->
                <div class="space-y-2 mt-auto">
                    <div class="flex items-center justify-between text-[10.5px] uppercase tracking-wider text-gray-400 font-semibold">
                        <span>Session Tasks</span>
                        <button type="button" onclick="os.focusClearDoneTasks()" class="text-[10px] text-gray-500 hover:text-white hover-target cursor-none">Clear Done</button>
                    </div>
                    <form onsubmit="event.preventDefault();os.focusAddTask()" class="flex gap-2">
                        <input type="text" id="focus-task-input" placeholder="Add a focus objective..."
                            class="flex-1 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-xs text-white outline-none focus:border-white/25">
                        <button type="submit" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs hover-target cursor-none">Add</button>
                    </form>
                    <div id="focus-task-list" class="space-y-1.5 max-h-36 overflow-y-auto pr-1"></div>
                </div>
            </div>

            <!-- Right: Procedural WebAudio Soundscape Mixer -->
            <div class="w-full md:w-72 p-5 flex flex-col gap-3 bg-black/30 overflow-y-auto">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-xs font-semibold text-white">Ambient Soundscapes</div>
                        <div class="text-[10.5px] text-gray-400">Synthesized locally via WebAudio</div>
                    </div>
                    <button type="button" onclick="os.focusStopAllSounds()" class="px-2 py-1 rounded-md bg-white/[0.05] hover:bg-white/10 text-[10px] text-gray-300 hover-target cursor-none">Mute All</button>
                </div>
                <div id="focus-sound-channels" class="space-y-2.5 mt-1"></div>
            </div>
        </div>
    `;

    window.WindowContents.devpad = `
        <div class="h-full flex flex-col bg-[#07080c]/95 text-xs overflow-hidden" id="devpad-root">
            <!-- Top Mode & Tab Bar -->
            <div class="px-3 py-2 border-b border-white/[0.07] bg-black/40 flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-1.5 min-w-0 overflow-x-auto" id="devpad-tabs-bar"></div>
                <div class="flex items-center gap-2 shrink-0">
                    <div class="os-segmented">
                        <button type="button" data-devpad-mode="markdown" onclick="os.devpadSetSuite('markdown')" class="os-seg-btn active hover-target cursor-none">Markdown</button>
                        <button type="button" data-devpad-mode="devtools" onclick="os.devpadSetSuite('devtools')" class="os-seg-btn hover-target cursor-none">Dev Tools</button>
                    </div>
                </div>
            </div>

            <!-- Markdown Workspace -->
            <div id="devpad-markdown-pane" class="flex-1 flex flex-col min-h-0">
                <div class="px-3.5 py-2 border-b border-white/[0.05] flex flex-wrap items-center justify-between gap-2 bg-white/[0.015]">
                    <input type="text" id="devpad-doc-title" oninput="os.devpadRenameActive(this.value)"
                        class="bg-transparent text-xs font-semibold text-white outline-none border-b border-transparent focus:border-white/25 px-1 py-0.5 w-52" placeholder="Document.md">
                    <div class="flex items-center gap-1.5">
                        <div class="os-segmented">
                            <button type="button" data-md-layout="split" onclick="os.devpadSetLayout('split')" class="os-seg-btn active hover-target cursor-none">Split</button>
                            <button type="button" data-md-layout="edit" onclick="os.devpadSetLayout('edit')" class="os-seg-btn hover-target cursor-none">Editor</button>
                            <button type="button" data-md-layout="preview" onclick="os.devpadSetLayout('preview')" class="os-seg-btn hover-target cursor-none">Preview</button>
                        </div>
                        <button type="button" onclick="os.devpadSaveToFiles()" class="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/12 border border-white/10 text-[11px] text-gray-200 hover-target cursor-none">Save to Files</button>
                        <button type="button" onclick="os.devpadExportMd()" class="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/12 border border-white/10 text-[11px] text-gray-200 hover-target cursor-none">Export .md</button>
                    </div>
                </div>
                <div class="flex-1 grid grid-cols-1 md:grid-cols-2 min-h-0" id="devpad-editor-grid">
                    <textarea id="devpad-editor" oninput="os.devpadOnInput(this.value)" spellcheck="false"
                        class="w-full h-full p-4 bg-transparent text-gray-100 font-mono text-xs leading-relaxed outline-none resize-none border-b md:border-b-0 md:border-r border-white/[0.06]"
                        placeholder="# Write Markdown here..."></textarea>
                    <div id="devpad-preview" class="w-full h-full p-5 overflow-y-auto prose-invert space-y-2.5 text-gray-200 leading-relaxed select-text"></div>
                </div>
                <div class="px-3.5 py-1.5 border-t border-white/[0.05] bg-black/30 flex items-center justify-between text-[10.5px] font-mono text-gray-500">
                    <span id="devpad-stats">0 words · 0 chars</span>
                    <span>Auto-saved locally</span>
                </div>
            </div>

            <!-- Developer Micro-Tools Suite -->
            <div id="devpad-devtools-pane" class="hidden flex-1 flex flex-col min-h-0 p-4 gap-3 overflow-y-auto">
                <div class="flex flex-wrap items-center gap-1.5">
                    <button type="button" data-dt-tool="json" onclick="os.devpadSelectTool('json')" class="px-3 py-1.5 rounded-lg bg-white/15 text-white text-[11px] font-medium hover-target cursor-none">JSON Format / Validate</button>
                    <button type="button" data-dt-tool="codec" onclick="os.devpadSelectTool('codec')" class="px-3 py-1.5 rounded-lg bg-white/[0.04] text-gray-400 hover:text-white text-[11px] font-medium hover-target cursor-none">Base64 &amp; URL</button>
                    <button type="button" data-dt-tool="jwt" onclick="os.devpadSelectTool('jwt')" class="px-3 py-1.5 rounded-lg bg-white/[0.04] text-gray-400 hover:text-white text-[11px] font-medium hover-target cursor-none">JWT Inspector</button>
                    <button type="button" data-dt-tool="regex" onclick="os.devpadSelectTool('regex')" class="px-3 py-1.5 rounded-lg bg-white/[0.04] text-gray-400 hover:text-white text-[11px] font-medium hover-target cursor-none">Regex Tester</button>
                    <button type="button" data-dt-tool="hash" onclick="os.devpadSelectTool('hash')" class="px-3 py-1.5 rounded-lg bg-white/[0.04] text-gray-400 hover:text-white text-[11px] font-medium hover-target cursor-none">SHA-256 &amp; UUID</button>
                </div>
                <div id="devpad-tool-stage" class="flex-1 flex flex-col gap-3 min-h-0"></div>
            </div>
        </div>
    `;

    // ── Procedural WebAudio Soundscape Synthesizer ──
    const SOUNDSCAPES = [
        { id: 'rain',  label: 'Soft Rain',        icon: 'cloud-rain', desc: 'Filtered pink rain & canopy mist' },
        { id: 'brown', label: 'Warm Brown Noise', icon: 'waves',      desc: 'Deep low-frequency focus blanket' },
        { id: 'vinyl', label: 'Analog Vinyl',     icon: 'disc-3',     desc: 'Warm room tone & subtle crackle' },
        { id: 'drone', label: 'Alpha Calm Pad',   icon: 'sparkles',   desc: 'Gentle 10 Hz binaural harmonic pad' }
    ];

    let audioCtx = null;
    const activeNodes = {};

    function ensureAudioCtx() {
        if (!audioCtx) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return null;
            audioCtx = new Ctx();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        return audioCtx;
    }

    function createChannelGraph(ctx, id, gainVal) {
        const master = ctx.createGain();
        master.gain.value = gainVal;
        master.connect(ctx.destination);

        if (id === 'drone') {
            const oscL = ctx.createOscillator();
            const oscR = ctx.createOscillator();
            const filter = ctx.createBiquadFilter();
            oscL.type = 'sine';
            oscR.type = 'sine';
            oscL.frequency.value = 216;
            oscR.frequency.value = 226;
            filter.type = 'lowpass';
            filter.frequency.value = 480;
            const subGain = ctx.createGain();
            subGain.gain.value = 0.18;
            oscL.connect(filter);
            oscR.connect(filter);
            filter.connect(subGain);
            subGain.connect(master);
            oscL.start();
            oscR.start();
            return { master, stop: () => { try { oscL.stop(); oscR.stop(); master.disconnect(); } catch (_) {} } };
        }

        const bufLen = ctx.sampleRate * 3;
        const buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, lastOut = 0;

        for (let i = 0; i < bufLen; i++) {
            const white = Math.random() * 2 - 1;
            if (id === 'brown') {
                lastOut = (lastOut + 0.02 * white) / 1.02;
                data[i] = lastOut * 2.4;
            } else if (id === 'vinyl') {
                lastOut = (lastOut + 0.03 * white) / 1.03;
                const crackle = Math.random() > 0.9988 ? (Math.random() * 0.65) : 0;
                data[i] = lastOut * 0.7 + crackle;
            } else {
                // Pinkish rain texture
                b0 = 0.99765 * b0 + white * 0.099046;
                b1 = 0.96300 * b1 + white * 0.2965164;
                b2 = 0.57000 * b2 + white * 1.0526913;
                data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.08;
            }
        }

        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = id === 'brown' ? 'lowpass' : 'bandpass';
        filter.frequency.value = id === 'brown' ? 280 : id === 'vinyl' ? 1400 : 1050;
        filter.Q.value = id === 'rain' ? 0.65 : 0.9;

        src.connect(filter);
        filter.connect(master);
        src.start();

        return { master, stop: () => { try { src.stop(); master.disconnect(); } catch (_) {} } };
    }

    function playGentleChime() {
        const ctx = ensureAudioCtx();
        if (!ctx) return;
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const t0 = ctx.currentTime + idx * 0.14;
            g.gain.setValueAtTime(0.001, t0);
            g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.04);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);
            osc.connect(g);
            g.connect(ctx.destination);
            osc.start(t0);
            osc.stop(t0 + 0.95);
        });
    }

    // ── Lightweight Safe Markdown Renderer ──
    function renderMarkdownHtml(md) {
        const lines = String(md || '').replace(/\r\n/g, '\n').split('\n');
        let html = '';
        let inCode = false;
        let codeBuf = [];

        const inlineFmt = (s) => esc(s)
            .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-white/10 text-emerald-300 font-mono text-[11px]">$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em class="italic text-gray-300">$1</em>')
            .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-sky-400 underline">$1</a>');

        for (const line of lines) {
            if (line.trim().startsWith('```')) {
                if (inCode) {
                    html += `<pre class="p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-emerald-200 overflow-x-auto"><code>${esc(codeBuf.join('\n'))}</code></pre>`;
                    codeBuf = [];
                    inCode = false;
                } else {
                    inCode = true;
                }
                continue;
            }
            if (inCode) {
                codeBuf.push(line);
                continue;
            }
            if (/^###\s+/.test(line)) {
                html += `<h3 class="text-sm font-semibold text-white pt-2">${inlineFmt(line.replace(/^###\s+/, ''))}</h3>`;
            } else if (/^##\s+/.test(line)) {
                html += `<h2 class="text-base font-semibold text-white pt-2 border-b border-white/10 pb-1">${inlineFmt(line.replace(/^##\s+/, ''))}</h2>`;
            } else if (/^#\s+/.test(line)) {
                html += `<h1 class="text-lg font-bold text-white pt-1">${inlineFmt(line.replace(/^#\s+/, ''))}</h1>`;
            } else if (/^-\s+\[( |x|X)\]\s+/.test(line)) {
                const done = /^-\s+\[(x|X)\]/.test(line);
                const txt = line.replace(/^-\s+\[( |x|X)\]\s+/, '');
                html += `<div class="flex items-center gap-2 text-xs ${done ? 'line-through text-gray-500' : 'text-gray-200'}"><span class="w-3.5 h-3.5 rounded border border-white/25 inline-flex items-center justify-center text-[9px] ${done ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200' : ''}">${done ? '✓' : ''}</span><span>${inlineFmt(txt)}</span></div>`;
            } else if (/^[-*]\s+/.test(line)) {
                html += `<div class="flex items-start gap-2 pl-1 text-xs"><span class="text-gray-500">•</span><span>${inlineFmt(line.replace(/^[-*]\s+/, ''))}</span></div>`;
            } else if (/^>\s+/.test(line)) {
                html += `<blockquote class="pl-3 border-l-2 border-sky-400/50 text-gray-400 italic">${inlineFmt(line.replace(/^>\s+/, ''))}</blockquote>`;
            } else if (/^---+$/.test(line.trim())) {
                html += `<hr class="border-white/10 my-2">`;
            } else if (!line.trim()) {
                html += `<div class="h-1.5"></div>`;
            } else {
                html += `<p class="text-xs leading-relaxed text-gray-200">${inlineFmt(line)}</p>`;
            }
        }
        if (inCode && codeBuf.length) {
            html += `<pre class="p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-emerald-200 overflow-x-auto"><code>${esc(codeBuf.join('\n'))}</code></pre>`;
        }
        return html;
    }

    function loadFocusState() {
        try {
            const parsed = JSON.parse(localStorage.getItem('AetherOS_Focus_v1') || 'null');
            if (parsed && typeof parsed === 'object') return parsed;
        } catch (_) {}
        return {
            sessionsCompleted: 0,
            tasks: [
                { id: 'ft-1', text: 'Ship clean workspace focus block', done: false }
            ],
            volumes: { rain: 0.45, brown: 0.4, vinyl: 0.35, drone: 0.3 }
        };
    }

    function loadDevPadState() {
        try {
            const parsed = JSON.parse(localStorage.getItem('AetherOS_DevPad_v1') || 'null');
            if (parsed && Array.isArray(parsed.tabs) && parsed.tabs.length) return parsed;
        } catch (_) {}
        return {
            activeTabId: 'doc-welcome',
            layout: 'split',
            suite: 'markdown',
            activeTool: 'json',
            tabs: [
                {
                    id: 'doc-welcome',
                    title: 'Workspace Notes.md',
                    content: `# AetherOS Markdown Studio\n\nWrite **clean Markdown** with instant side-by-side preview, or switch to **Dev Tools** in the top-right for local JSON, Base64, JWT, Regex, and SHA-256 utilities.\n\n## Quick Checklist\n- [x] Decluttered workspace & Settings\n- [ ] Try Window Snap (\`Alt + Left / Right\`)\n- [ ] Drop any local file onto the desktop`
                }
            ]
        };
    }

    const MODE_DURATIONS = { focus25: 25 * 60, deep50: 50 * 60, break5: 5 * 60, break15: 15 * 60 };

    window.extendOS({
        focusState: {
            ...loadFocusState(),
            mode: 'focus25',
            totalSec: 25 * 60,
            remainingSec: 25 * 60,
            running: false,
            timerId: null,
            activeSounds: {}
        },

        devpadState: loadDevPadState(),

        saveFocusState: () => {
            localStorage.setItem('AetherOS_Focus_v1', JSON.stringify({
                sessionsCompleted: os.focusState.sessionsCompleted || 0,
                tasks: os.focusState.tasks || [],
                volumes: os.focusState.volumes || {}
            }));
        },

        initFocusStudio: () => {
            os.focusRenderUI();
        },

        focusFormatTime: (sec) => {
            const m = Math.floor(Math.max(0, sec) / 60);
            const s = Math.max(0, sec) % 60;
            return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        },

        focusSetMode: (mode) => {
            const dur = MODE_DURATIONS[mode] || 1500;
            os.focusPauseTimer();
            os.focusState.mode = mode;
            os.focusState.totalSec = dur;
            os.focusState.remainingSec = dur;
            os.focusRenderUI();
            os.focusSyncTopbarPill();
        },

        focusToggleTimer: () => {
            if (os.focusState.running) {
                os.focusPauseTimer();
            } else {
                os.focusState.running = true;
                clearInterval(os.focusState.timerId);
                os.focusState.timerId = setInterval(() => {
                    os.focusState.remainingSec = Math.max(0, os.focusState.remainingSec - 1);
                    if (os.focusState.remainingSec <= 0) {
                        os.focusPauseTimer();
                        if (os.focusState.mode.startsWith('focus') || os.focusState.mode.startsWith('deep')) {
                            os.focusState.sessionsCompleted = (os.focusState.sessionsCompleted || 0) + 1;
                            os.saveFocusState();
                        }
                        playGentleChime();
                        window.Notifications && window.Notifications.push('FOCUS COMPLETE', 'Session finished! Take a breather.');
                        os.focusState.remainingSec = os.focusState.totalSec;
                    }
                    os.focusUpdateTimerDOM();
                    os.focusSyncTopbarPill();
                }, 1000);
            }
            os.focusUpdateTimerDOM();
            os.focusSyncTopbarPill();
        },

        focusPauseTimer: () => {
            os.focusState.running = false;
            clearInterval(os.focusState.timerId);
            os.focusState.timerId = null;
            os.focusUpdateTimerDOM();
            os.focusSyncTopbarPill();
        },

        focusResetTimer: () => {
            os.focusPauseTimer();
            os.focusState.remainingSec = os.focusState.totalSec;
            os.focusUpdateTimerDOM();
            os.focusSyncTopbarPill();
        },

        focusSyncTopbarPill: () => {
            const pill = document.getElementById('topbar-focus-pill');
            const lbl = document.getElementById('topbar-focus-label');
            if (!pill || !lbl) return;
            const anySound = Object.keys(activeNodes).length > 0;
            const show = os.focusState.running || anySound;
            pill.style.display = show ? 'inline-flex' : 'none';
            if (show) {
                lbl.textContent = os.focusState.running ? os.focusFormatTime(os.focusState.remainingSec) : 'Ambient';
            }
        },

        focusUpdateTimerDOM: () => {
            const disp = document.getElementById('focus-time-display');
            const status = document.getElementById('focus-status-label');
            const btn = document.getElementById('focus-toggle-btn');
            const ring = document.getElementById('focus-ring-progress');
            const streak = document.getElementById('focus-streak-badge');

            if (disp) disp.textContent = os.focusFormatTime(os.focusState.remainingSec);
            if (status) status.textContent = os.focusState.running ? 'Focusing' : 'Paused / Ready';
            if (btn) btn.textContent = os.focusState.running ? 'Pause' : 'Start Focus';
            if (streak) streak.textContent = `${os.focusState.sessionsCompleted || 0} session${os.focusState.sessionsCompleted === 1 ? '' : 's'}`;
            if (ring) {
                const circ = 439.82;
                const pct = os.focusState.totalSec ? (os.focusState.remainingSec / os.focusState.totalSec) : 1;
                ring.style.strokeDashoffset = String(circ * (1 - pct));
            }
            document.querySelectorAll('[data-focus-mode]').forEach((b) => {
                b.classList.toggle('active', b.getAttribute('data-focus-mode') === os.focusState.mode);
            });
        },

        focusToggleSound: (id) => {
            if (activeNodes[id]) {
                activeNodes[id].stop();
                delete activeNodes[id];
            } else {
                const ctx = ensureAudioCtx();
                if (!ctx) return;
                const vol = os.focusState.volumes?.[id] ?? 0.4;
                activeNodes[id] = createChannelGraph(ctx, id, vol);
            }
            os.focusRenderSounds();
            os.focusSyncTopbarPill();
        },

        focusSetSoundVolume: (id, val) => {
            const v = Math.max(0, Math.min(1, Number(val)));
            os.focusState.volumes = os.focusState.volumes || {};
            os.focusState.volumes[id] = v;
            if (activeNodes[id] && activeNodes[id].master) {
                activeNodes[id].master.gain.value = v;
            }
            os.saveFocusState();
        },

        focusStopAllSounds: () => {
            Object.keys(activeNodes).forEach((id) => {
                activeNodes[id].stop();
                delete activeNodes[id];
            });
            os.focusRenderSounds();
            os.focusSyncTopbarPill();
        },

        focusRenderSounds: () => {
            const host = document.getElementById('focus-sound-channels');
            if (!host) return;
            host.innerHTML = SOUNDSCAPES.map((ch) => {
                const on = Boolean(activeNodes[ch.id]);
                const vol = Math.round(((os.focusState.volumes && os.focusState.volumes[ch.id]) ?? 0.4) * 100);
                return `
                    <div class="p-3 rounded-xl border transition ${on ? 'bg-emerald-500/10 border-emerald-400/30' : 'bg-white/[0.03] border-white/[0.07]'}">
                        <div class="flex items-center justify-between gap-2">
                            <div class="flex items-center gap-2 min-w-0">
                                <i data-lucide="${ch.icon}" class="w-3.5 h-3.5 ${on ? 'text-emerald-300' : 'text-gray-400'} shrink-0"></i>
                                <div class="min-w-0">
                                    <div class="text-xs font-medium text-white truncate">${esc(ch.label)}</div>
                                    <div class="text-[10px] text-gray-500 truncate">${esc(ch.desc)}</div>
                                </div>
                            </div>
                            <button type="button" onclick="os.focusToggleSound('${ch.id}')"
                                class="os-switch hover-target cursor-none" data-on="${on}" aria-label="Toggle ${esc(ch.label)}"></button>
                        </div>
                        <div class="mt-2 flex items-center gap-2">
                            <input type="range" min="0" max="100" value="${vol}"
                                oninput="os.focusSetSoundVolume('${ch.id}', this.value/100)"
                                class="w-full accent-emerald-400 cursor-none hover-target">
                        </div>
                    </div>
                `;
            }).join('');
            if (window.lucide) lucide.createIcons({ root: host });
        },

        focusAddTask: () => {
            const inp = document.getElementById('focus-task-input');
            if (!inp || !inp.value.trim()) return;
            os.focusState.tasks.unshift({ id: 'ft-' + Date.now(), text: inp.value.trim(), done: false });
            inp.value = '';
            os.saveFocusState();
            os.focusRenderTasks();
        },

        focusToggleTask: (id) => {
            const t = (os.focusState.tasks || []).find((item) => item.id === id);
            if (t) t.done = !t.done;
            os.saveFocusState();
            os.focusRenderTasks();
        },

        focusClearDoneTasks: () => {
            os.focusState.tasks = (os.focusState.tasks || []).filter((t) => !t.done);
            os.saveFocusState();
            os.focusRenderTasks();
        },

        focusRenderTasks: () => {
            const list = document.getElementById('focus-task-list');
            if (!list) return;
            const tasks = os.focusState.tasks || [];
            if (!tasks.length) {
                list.innerHTML = '<div class="text-[11px] text-gray-500 py-2">No session objectives yet.</div>';
                return;
            }
            list.innerHTML = tasks.map((t) => `
                <button type="button" onclick="os.focusToggleTask('${t.id}')"
                    class="w-full px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] flex items-center gap-2.5 text-left hover-target cursor-none">
                    <span class="w-4 h-4 rounded border flex items-center justify-center text-[10px] shrink-0 ${t.done ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200' : 'border-white/20'}">${t.done ? '✓' : ''}</span>
                    <span class="truncate ${t.done ? 'line-through text-gray-500' : 'text-gray-200'}">${esc(t.text)}</span>
                </button>
            `).join('');
        },

        focusRenderUI: () => {
            os.focusUpdateTimerDOM();
            os.focusRenderTasks();
            os.focusRenderSounds();
        },

        // ═══════════════════════════════════════════════════════
        //  MARKDOWN & DEVELOPER STUDIO (devpad)
        // ═══════════════════════════════════════════════════════
        saveDevPadState: () => {
            localStorage.setItem('AetherOS_DevPad_v1', JSON.stringify(os.devpadState));
        },

        initDevPad: () => {
            os.devpadRenderAll();
        },

        devpadActiveDoc: () => {
            const tabs = os.devpadState.tabs || [];
            return tabs.find((t) => t.id === os.devpadState.activeTabId) || tabs[0];
        },

        devpadSetSuite: (suite) => {
            os.devpadState.suite = suite === 'devtools' ? 'devtools' : 'markdown';
            os.saveDevPadState();
            os.devpadRenderAll();
        },

        devpadSetLayout: (layout) => {
            os.devpadState.layout = layout;
            os.saveDevPadState();
            os.devpadApplyLayout();
        },

        devpadApplyLayout: () => {
            const grid = document.getElementById('devpad-editor-grid');
            const editor = document.getElementById('devpad-editor');
            const preview = document.getElementById('devpad-preview');
            if (!grid || !editor || !preview) return;
            const l = os.devpadState.layout || 'split';
            grid.className = l === 'split' ? 'flex-1 grid grid-cols-1 md:grid-cols-2 min-h-0' : 'flex-1 grid grid-cols-1 min-h-0';
            editor.style.display = l === 'preview' ? 'none' : 'block';
            preview.style.display = l === 'edit' ? 'none' : 'block';
            document.querySelectorAll('[data-md-layout]').forEach((b) => {
                b.classList.toggle('active', b.getAttribute('data-md-layout') === l);
            });
        },

        devpadNewTab: (title = 'Untitled.md', content = '# Untitled\n\n') => {
            const id = 'doc-' + Date.now();
            os.devpadState.tabs.push({ id, title, content });
            os.devpadState.activeTabId = id;
            os.devpadState.suite = 'markdown';
            os.saveDevPadState();
            os.devpadRenderAll();
        },

        devpadOpenExternalFile: ({ title, content }) => {
            const existing = (os.devpadState.tabs || []).find((t) => t.title === title);
            if (existing) {
                existing.content = content;
                os.devpadState.activeTabId = existing.id;
            } else {
                os.devpadNewTab(title || 'Imported.md', content || '');
                return;
            }
            os.devpadState.suite = 'markdown';
            os.saveDevPadState();
            os.devpadRenderAll();
        },

        devpadSelectTab: (id) => {
            os.devpadState.activeTabId = id;
            os.devpadState.suite = 'markdown';
            os.saveDevPadState();
            os.devpadRenderAll();
        },

        devpadCloseTab: (id) => {
            if (os.devpadState.tabs.length <= 1) return;
            os.devpadState.tabs = os.devpadState.tabs.filter((t) => t.id !== id);
            if (os.devpadState.activeTabId === id) {
                os.devpadState.activeTabId = os.devpadState.tabs[0].id;
            }
            os.saveDevPadState();
            os.devpadRenderAll();
        },

        devpadRenameActive: (val) => {
            const doc = os.devpadActiveDoc();
            if (!doc) return;
            doc.title = val || 'Untitled.md';
            os.saveDevPadState();
            os.devpadRenderTabsBar();
        },

        devpadOnInput: (val) => {
            const doc = os.devpadActiveDoc();
            if (!doc) return;
            doc.content = val;
            os.saveDevPadState();
            os.devpadUpdatePreviewAndStats();
        },

        devpadUpdatePreviewAndStats: () => {
            const doc = os.devpadActiveDoc();
            const preview = document.getElementById('devpad-preview');
            const stats = document.getElementById('devpad-stats');
            if (!doc) return;
            if (preview) preview.innerHTML = renderMarkdownHtml(doc.content);
            if (stats) {
                const words = (doc.content.trim().match(/\S+/g) || []).length;
                const readMin = Math.max(1, Math.ceil(words / 200));
                stats.textContent = `${words} words · ${doc.content.length} chars · ~${readMin} min read`;
            }
        },

        devpadSaveToFiles: async () => {
            const doc = os.devpadActiveDoc();
            if (!doc || !window.AetherVFS) return;
            const name = doc.title.endsWith('.md') ? doc.title : `${doc.title}.md`;
            await window.AetherVFS.putFile({
                name,
                mime: 'text/markdown',
                kind: 'note',
                icon: 'file-text',
                folder: 'Saved Clipper',
                content: doc.content,
                tags: ['markdown', 'devpad']
            });
            window.Notifications && window.Notifications.push('SAVED TO FILES', `"${name}" stored in File Explorer.`);
        },

        devpadExportMd: () => {
            const doc = os.devpadActiveDoc();
            if (!doc) return;
            const blob = new Blob([doc.content || ''], { type: 'text/markdown;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = doc.title.endsWith('.md') ? doc.title : `${doc.title}.md`;
            a.click();
        },

        devpadRenderTabsBar: () => {
            const bar = document.getElementById('devpad-tabs-bar');
            if (!bar) return;
            const tabsHtml = (os.devpadState.tabs || []).map((t) => {
                const active = t.id === os.devpadState.activeTabId && os.devpadState.suite === 'markdown';
                return `
                    <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] transition ${active ? 'bg-white/14 border-white/25 text-white' : 'bg-white/[0.03] border-white/[0.07] text-gray-400 hover:text-white'}">
                        <button type="button" onclick="os.devpadSelectTab('${t.id}')" class="truncate max-w-[130px] hover-target cursor-none">${esc(t.title)}</button>
                        ${os.devpadState.tabs.length > 1 ? `<button type="button" onclick="os.devpadCloseTab('${t.id}')" class="text-gray-500 hover:text-red-300 hover-target cursor-none">×</button>` : ''}
                    </div>
                `;
            }).join('');
            bar.innerHTML = `${tabsHtml}<button type="button" onclick="os.devpadNewTab()" class="px-2 py-1 rounded-lg bg-white/[0.05] hover:bg-white/12 text-gray-300 text-xs hover-target cursor-none" title="New Markdown Tab">+</button>`;
        },

        devpadSelectTool: (tool) => {
            os.devpadState.activeTool = tool;
            os.saveDevPadState();
            os.devpadRenderToolStage();
        },

        devpadRenderToolStage: () => {
            const stage = document.getElementById('devpad-tool-stage');
            if (!stage) return;
            const tool = os.devpadState.activeTool || 'json';
            document.querySelectorAll('[data-dt-tool]').forEach((b) => {
                const on = b.getAttribute('data-dt-tool') === tool;
                b.className = `px-3 py-1.5 rounded-lg text-[11px] font-medium transition hover-target cursor-none ${on ? 'bg-white/15 text-white border border-white/20' : 'bg-white/[0.04] text-gray-400 hover:text-white border border-transparent'}`;
            });

            if (tool === 'json') {
                stage.innerHTML = `
                    <textarea id="dt-json-in" rows="7" placeholder='{"hello":"aether","items":[1,2,3]}'
                        class="w-full p-3 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-white outline-none"></textarea>
                    <div class="flex items-center gap-2">
                        <button type="button" onclick="os.dtRunJson('pretty')" class="px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover-target cursor-none">Format (2 spaces)</button>
                        <button type="button" onclick="os.dtRunJson('minify')" class="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs hover-target cursor-none">Minify</button>
                        <span id="dt-json-status" class="text-[11px] font-mono text-gray-400 ml-2"></span>
                    </div>
                    <pre id="dt-json-out" class="flex-1 p-3 rounded-xl bg-black/60 border border-white/[0.07] font-mono text-xs text-emerald-300 overflow-auto select-text"></pre>
                `;
            } else if (tool === 'codec') {
                stage.innerHTML = `
                    <textarea id="dt-codec-in" rows="5" placeholder="Enter plain text, Base64, or URL-encoded text..."
                        class="w-full p-3 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-white outline-none"></textarea>
                    <div class="flex flex-wrap gap-2">
                        <button type="button" onclick="os.dtRunCodec('b64enc')" class="px-3 py-1.5 rounded-lg bg-white/12 text-white text-xs hover-target cursor-none">Base64 Encode</button>
                        <button type="button" onclick="os.dtRunCodec('b64dec')" class="px-3 py-1.5 rounded-lg bg-white/12 text-white text-xs hover-target cursor-none">Base64 Decode</button>
                        <button type="button" onclick="os.dtRunCodec('urlenc')" class="px-3 py-1.5 rounded-lg bg-white/12 text-white text-xs hover-target cursor-none">URL Encode</button>
                        <button type="button" onclick="os.dtRunCodec('urldec')" class="px-3 py-1.5 rounded-lg bg-white/12 text-white text-xs hover-target cursor-none">URL Decode</button>
                    </div>
                    <pre id="dt-codec-out" class="flex-1 p-3 rounded-xl bg-black/60 border border-white/[0.07] font-mono text-xs text-sky-300 overflow-auto select-text whitespace-pre-wrap"></pre>
                `;
            } else if (tool === 'jwt') {
                stage.innerHTML = `
                    <input id="dt-jwt-in" type="text" placeholder="Paste eyJ... JWT token (decoded 100% locally)"
                        oninput="os.dtRunJwt(this.value)"
                        class="w-full p-3 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-white outline-none">
                    <pre id="dt-jwt-out" class="flex-1 p-3 rounded-xl bg-black/60 border border-white/[0.07] font-mono text-xs text-amber-200 overflow-auto select-text">Waiting for JWT token...</pre>
                `;
            } else if (tool === 'regex') {
                stage.innerHTML = `
                    <div class="flex gap-2">
                        <input id="dt-rx-pat" type="text" placeholder="Pattern e.g. (\\w+)@(\\w+\\.\\w+)" oninput="os.dtRunRegex()"
                            class="flex-1 p-2.5 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-white outline-none">
                        <input id="dt-rx-flags" type="text" value="gi" oninput="os.dtRunRegex()"
                            class="w-20 p-2.5 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-white outline-none text-center">
                    </div>
                    <textarea id="dt-rx-text" rows="5" placeholder="Test string..." oninput="os.dtRunRegex()"
                        class="w-full p-3 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-white outline-none"></textarea>
                    <pre id="dt-rx-out" class="flex-1 p-3 rounded-xl bg-black/60 border border-white/[0.07] font-mono text-xs text-emerald-300 overflow-auto select-text"></pre>
                `;
            } else {
                const uuid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : ('id-' + Math.random().toString(36).slice(2));
                stage.innerHTML = `
                    <div class="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-2">
                        <div>
                            <div class="text-[10px] text-gray-400 uppercase font-mono">Fresh UUID v4</div>
                            <div id="dt-uuid-val" class="font-mono text-xs text-white select-text mt-0.5">${uuid}</div>
                        </div>
                        <button type="button" onclick="document.getElementById('dt-uuid-val').textContent=(crypto.randomUUID?crypto.randomUUID():Date.now())"
                            class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white hover-target cursor-none">Regenerate</button>
                    </div>
                    <textarea id="dt-hash-in" rows="4" placeholder="Type text to compute SHA-256 hex digest..." oninput="os.dtRunSha256(this.value)"
                        class="w-full p-3 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-white outline-none"></textarea>
                    <div class="p-3 rounded-xl bg-black/60 border border-white/[0.07] font-mono text-xs text-cyan-300 break-all select-text" id="dt-hash-out">SHA-256 digest will appear here...</div>
                `;
            }
        },

        dtRunJson: (mode) => {
            const inp = document.getElementById('dt-json-in')?.value || '';
            const out = document.getElementById('dt-json-out');
            const st = document.getElementById('dt-json-status');
            try {
                const parsed = JSON.parse(inp);
                if (out) out.textContent = mode === 'minify' ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
                if (st) { st.textContent = 'Valid JSON ✓'; st.className = 'text-[11px] font-mono text-emerald-400 ml-2'; }
            } catch (e) {
                if (st) { st.textContent = e.message; st.className = 'text-[11px] font-mono text-red-400 ml-2'; }
            }
        },

        dtRunCodec: (op) => {
            const inp = document.getElementById('dt-codec-in')?.value || '';
            const out = document.getElementById('dt-codec-out');
            if (!out) return;
            try {
                if (op === 'b64enc') out.textContent = btoa(unescape(encodeURIComponent(inp)));
                else if (op === 'b64dec') out.textContent = decodeURIComponent(escape(atob(inp.trim())));
                else if (op === 'urlenc') out.textContent = encodeURIComponent(inp);
                else out.textContent = decodeURIComponent(inp);
            } catch (e) {
                out.textContent = 'Error: ' + e.message;
            }
        },

        dtRunJwt: (token) => {
            const out = document.getElementById('dt-jwt-out');
            if (!out) return;
            const parts = String(token || '').trim().split('.');
            if (parts.length < 2) { out.textContent = 'Enter a 3-part JWT (header.payload.signature)'; return; }
            try {
                const dec = (s) => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))));
                const header = dec(parts[0]);
                const payload = dec(parts[1]);
                const expInfo = payload.exp ? `\nExpires: ${new Date(payload.exp * 1000).toISOString()} (${payload.exp * 1000 > Date.now() ? 'VALID' : 'EXPIRED'})` : '';
                out.textContent = `// HEADER\n${JSON.stringify(header, null, 2)}\n\n// PAYLOAD${expInfo}\n${JSON.stringify(payload, null, 2)}`;
            } catch (e) {
                out.textContent = 'Could not decode JWT: ' + e.message;
            }
        },

        dtRunRegex: () => {
            const pat = document.getElementById('dt-rx-pat')?.value || '';
            const flags = document.getElementById('dt-rx-flags')?.value || 'g';
            const txt = document.getElementById('dt-rx-text')?.value || '';
            const out = document.getElementById('dt-rx-out');
            if (!out || !pat) return;
            try {
                const rx = new RegExp(pat, flags.includes('g') ? flags : flags + 'g');
                const matches = [...txt.matchAll(rx)];
                out.textContent = matches.length
                    ? matches.map((m, i) => `#${i + 1} [${m.index}]: ${JSON.stringify(m[0])}${m.length > 1 ? '  groups: ' + JSON.stringify(m.slice(1)) : ''}`).join('\n')
                    : '0 matches';
            } catch (e) {
                out.textContent = 'Regex error: ' + e.message;
            }
        },

        dtRunSha256: async (txt) => {
            const out = document.getElementById('dt-hash-out');
            if (!out || !window.crypto || !crypto.subtle) return;
            const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt || ''));
            out.textContent = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
        },

        devpadRenderAll: () => {
            const mdPane = document.getElementById('devpad-markdown-pane');
            const dtPane = document.getElementById('devpad-devtools-pane');
            if (!mdPane || !dtPane) return;

            const isDt = os.devpadState.suite === 'devtools';
            mdPane.classList.toggle('hidden', isDt);
            dtPane.classList.toggle('hidden', !isDt);
            document.querySelectorAll('[data-devpad-mode]').forEach((b) => {
                b.classList.toggle('active', b.getAttribute('data-devpad-mode') === (isDt ? 'devtools' : 'markdown'));
            });

            os.devpadRenderTabsBar();
            if (isDt) {
                os.devpadRenderToolStage();
            } else {
                const doc = os.devpadActiveDoc();
                const titleInp = document.getElementById('devpad-doc-title');
                const editor = document.getElementById('devpad-editor');
                if (doc && titleInp) titleInp.value = doc.title;
                if (doc && editor && editor.value !== doc.content) editor.value = doc.content;
                os.devpadApplyLayout();
                os.devpadUpdatePreviewAndStats();
            }
            const root = document.getElementById('devpad-root');
            if (root && window.lucide) lucide.createIcons({ root });
        }
    });
})();
