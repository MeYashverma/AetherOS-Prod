// AetherOS — Native macOS Experience Suite I: Calculator (Standard + Scientific + Tape), 4-Tab Clock, and Floating Desktop Stickies
(function () {
    const esc = (v) => String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    window.WindowContents = window.WindowContents || {};

    // Shared synthesized Apple-style chime / click helper
    function playNativeChime(kind = 'chime') {
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            const ctx = window._aetherNativeAudioCtx || (window._aetherNativeAudioCtx = new AC());
            if (ctx.state === 'suspended') ctx.resume();
            const now = ctx.currentTime;
            if (kind === 'tap') {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(520, now);
                osc.frequency.exponentialRampToValueAtTime(180, now + 0.025);
                g.gain.setValueAtTime(0.05, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.028);
                osc.connect(g); g.connect(ctx.destination);
                osc.start(now); osc.stop(now + 0.03);
                return;
            }
            // Melodic 4-note Apple Radar-inspired marimba chime
            [587.33, 880, 1174.66, 1318.51].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = 'sine';
                const t = now + idx * 0.13;
                osc.frequency.setValueAtTime(freq, t);
                g.gain.setValueAtTime(0.001, t);
                g.gain.linearRampToValueAtTime(0.16, t + 0.015);
                g.gain.exponentialRampToValueAtTime(0.0008, t + 0.42);
                osc.connect(g); g.connect(ctx.destination);
                osc.start(t); osc.stop(t + 0.45);
            });
        } catch (_) {}
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  1. NATIVE macOS CALCULATOR (Standard + Scientific + Paper Tape)
    // ═══════════════════════════════════════════════════════════════════════
    window.WindowContents.calculator = `
        <div class="h-full flex flex-col bg-[#1c1c1e]/95 text-white select-none overflow-hidden" id="calc-root">
            <!-- Mode & Tape Toolbar -->
            <div class="px-3.5 pt-2.5 pb-1 flex items-center justify-between text-[11px]">
                <div class="flex items-center gap-1.5">
                    <button type="button" id="calc-sci-toggle" onclick="os.calcToggleScientific()" class="px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/15 text-gray-200 font-medium transition hover-target cursor-none">Scientific</button>
                    <span id="calc-angle-badge" class="hidden px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px]">DEG</span>
                </div>
                <button type="button" onclick="os.calcToggleTape()" class="px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/15 text-gray-300 transition hover-target cursor-none flex items-center gap-1">
                    <i data-lucide="scroll-text" class="w-3 h-3"></i><span>Tape</span>
                </button>
            </div>

            <!-- Paper Tape Drawer -->
            <div id="calc-tape-drawer" class="hidden mx-3 mb-1.5 max-h-28 overflow-y-auto rounded-xl bg-black/55 border border-white/10 p-2.5 space-y-1 font-mono text-[11px]"></div>

            <!-- Main Display -->
            <div class="px-5 pt-2 pb-3 flex flex-col items-end justify-end min-h-[96px]">
                <div id="calc-expr" class="text-xs text-gray-400 font-mono h-4 truncate max-w-full"></div>
                <div id="calc-display" class="text-5xl font-light tracking-tight text-white tabular-nums truncate max-w-full leading-tight">0</div>
            </div>

            <!-- Keypad Area -->
            <div class="flex-1 px-3.5 pb-3.5 flex gap-2.5 min-h-0">
                <!-- Scientific Left Wing -->
                <div id="calc-sci-pad" class="hidden flex-1 grid grid-cols-5 gap-1.5">
                    <button type="button" onclick="os.calcSci('sq')" class="calc-btn-sci hover-target cursor-none">x²</button>
                    <button type="button" onclick="os.calcSci('cube')" class="calc-btn-sci hover-target cursor-none">x³</button>
                    <button type="button" onclick="os.calcOp('pow')" class="calc-btn-sci hover-target cursor-none">xʸ</button>
                    <button type="button" onclick="os.calcSci('exp')" class="calc-btn-sci hover-target cursor-none">eˣ</button>
                    <button type="button" onclick="os.calcSci('pow10')" class="calc-btn-sci hover-target cursor-none">10ˣ</button>

                    <button type="button" onclick="os.calcSci('inv')" class="calc-btn-sci hover-target cursor-none">1/x</button>
                    <button type="button" onclick="os.calcSci('sqrt')" class="calc-btn-sci hover-target cursor-none">√x</button>
                    <button type="button" onclick="os.calcSci('cbrt')" class="calc-btn-sci hover-target cursor-none">∛x</button>
                    <button type="button" onclick="os.calcSci('ln')" class="calc-btn-sci hover-target cursor-none">ln</button>
                    <button type="button" onclick="os.calcSci('log10')" class="calc-btn-sci hover-target cursor-none">log₁₀</button>

                    <button type="button" onclick="os.calcSci('fact')" class="calc-btn-sci hover-target cursor-none">x!</button>
                    <button type="button" onclick="os.calcSci('sin')" class="calc-btn-sci hover-target cursor-none">sin</button>
                    <button type="button" onclick="os.calcSci('cos')" class="calc-btn-sci hover-target cursor-none">cos</button>
                    <button type="button" onclick="os.calcSci('tan')" class="calc-btn-sci hover-target cursor-none">tan</button>
                    <button type="button" onclick="os.calcConst('e')" class="calc-btn-sci hover-target cursor-none">e</button>

                    <button type="button" onclick="os.calcToggleRad()" id="calc-rad-btn" class="calc-btn-sci hover-target cursor-none">Rad</button>
                    <button type="button" onclick="os.calcSci('sinh')" class="calc-btn-sci hover-target cursor-none">sinh</button>
                    <button type="button" onclick="os.calcSci('cosh')" class="calc-btn-sci hover-target cursor-none">cosh</button>
                    <button type="button" onclick="os.calcSci('tanh')" class="calc-btn-sci hover-target cursor-none">tanh</button>
                    <button type="button" onclick="os.calcConst('pi')" class="calc-btn-sci hover-target cursor-none">π</button>

                    <button type="button" onclick="os.calcMem('mc')" class="calc-btn-sci hover-target cursor-none">mc</button>
                    <button type="button" onclick="os.calcMem('m+')" class="calc-btn-sci hover-target cursor-none">m+</button>
                    <button type="button" onclick="os.calcMem('m-')" class="calc-btn-sci hover-target cursor-none">m−</button>
                    <button type="button" onclick="os.calcMem('mr')" class="calc-btn-sci hover-target cursor-none">mr</button>
                    <button type="button" onclick="os.calcConst('rand')" class="calc-btn-sci hover-target cursor-none">Rand</button>
                </div>

                <!-- Standard 4x5 Apple Keypad -->
                <div class="w-full max-w-[320px] mx-auto grid grid-cols-4 gap-2">
                    <button type="button" id="calc-ac-btn" onclick="os.calcClear()" class="calc-btn calc-btn-fn hover-target cursor-none">AC</button>
                    <button type="button" onclick="os.calcNegate()" class="calc-btn calc-btn-fn hover-target cursor-none">+/−</button>
                    <button type="button" onclick="os.calcPercent()" class="calc-btn calc-btn-fn hover-target cursor-none">%</button>
                    <button type="button" data-calc-op="/" onclick="os.calcOp('/')" class="calc-btn calc-btn-op hover-target cursor-none">÷</button>

                    <button type="button" onclick="os.calcDigit('7')" class="calc-btn calc-btn-num hover-target cursor-none">7</button>
                    <button type="button" onclick="os.calcDigit('8')" class="calc-btn calc-btn-num hover-target cursor-none">8</button>
                    <button type="button" onclick="os.calcDigit('9')" class="calc-btn calc-btn-num hover-target cursor-none">9</button>
                    <button type="button" data-calc-op="*" onclick="os.calcOp('*')" class="calc-btn calc-btn-op hover-target cursor-none">×</button>

                    <button type="button" onclick="os.calcDigit('4')" class="calc-btn calc-btn-num hover-target cursor-none">4</button>
                    <button type="button" onclick="os.calcDigit('5')" class="calc-btn calc-btn-num hover-target cursor-none">5</button>
                    <button type="button" onclick="os.calcDigit('6')" class="calc-btn calc-btn-num hover-target cursor-none">6</button>
                    <button type="button" data-calc-op="-" onclick="os.calcOp('-')" class="calc-btn calc-btn-op hover-target cursor-none">−</button>

                    <button type="button" onclick="os.calcDigit('1')" class="calc-btn calc-btn-num hover-target cursor-none">1</button>
                    <button type="button" onclick="os.calcDigit('2')" class="calc-btn calc-btn-num hover-target cursor-none">2</button>
                    <button type="button" onclick="os.calcDigit('3')" class="calc-btn calc-btn-num hover-target cursor-none">3</button>
                    <button type="button" data-calc-op="+" onclick="os.calcOp('+')" class="calc-btn calc-btn-op hover-target cursor-none">+</button>

                    <button type="button" onclick="os.calcDigit('0')" class="calc-btn calc-btn-num col-span-2 !justify-start pl-6 hover-target cursor-none">0</button>
                    <button type="button" onclick="os.calcDigit('.')" class="calc-btn calc-btn-num hover-target cursor-none">.</button>
                    <button type="button" onclick="os.calcEquals()" class="calc-btn calc-btn-op hover-target cursor-none">=</button>
                </div>
            </div>
        </div>
    `;

    // ═══════════════════════════════════════════════════════════════════════
    //  2. NATIVE macOS 4-TAB CLOCK APP (World Clock, Alarms, Stopwatch, Timers)
    // ═══════════════════════════════════════════════════════════════════════
    const CLOCK_CITIES = [
        { id: 'cupertino', city: 'Cupertino',  tz: 'America/Los_Angeles', country: 'USA' },
        { id: 'newyork',   city: 'New York',   tz: 'America/New_York',    country: 'USA' },
        { id: 'london',    city: 'London',     tz: 'Europe/London',       country: 'UK' },
        { id: 'paris',     city: 'Paris',      tz: 'Europe/Paris',        country: 'France' },
        { id: 'delhi',     city: 'New Delhi',  tz: 'Asia/Kolkata',        country: 'India' },
        { id: 'tokyo',     city: 'Tokyo',      tz: 'Asia/Tokyo',          country: 'Japan' },
        { id: 'sydney',    city: 'Sydney',     tz: 'Australia/Sydney',    country: 'Australia' },
        { id: 'dubai',     city: 'Dubai',      tz: 'Asia/Dubai',          country: 'UAE' }
    ];

    window.WindowContents.clockapp = `
        <div class="h-full flex flex-col bg-[#121318]/95 text-white text-xs select-none overflow-hidden" id="clockapp-root">
            <div class="px-4 py-2.5 border-b border-white/[0.08] bg-black/40 flex items-center justify-center">
                <div class="os-segmented">
                    <button type="button" data-clk-tab="world" onclick="os.clockSetTab('world')" class="os-seg-btn active hover-target cursor-none">World Clock</button>
                    <button type="button" data-clk-tab="alarm" onclick="os.clockSetTab('alarm')" class="os-seg-btn hover-target cursor-none">Alarms</button>
                    <button type="button" data-clk-tab="stopwatch" onclick="os.clockSetTab('stopwatch')" class="os-seg-btn hover-target cursor-none">Stopwatch</button>
                    <button type="button" data-clk-tab="timer" onclick="os.clockSetTab('timer')" class="os-seg-btn hover-target cursor-none">Timers</button>
                </div>
            </div>

            <!-- Tab 1: World Clock with Analog Day/Night Faces -->
            <div id="clk-pane-world" class="flex-1 p-5 overflow-y-auto">
                <div id="clk-world-grid" class="grid grid-cols-2 md:grid-cols-3 gap-3.5"></div>
            </div>

            <!-- Tab 2: Alarms -->
            <div id="clk-pane-alarm" class="hidden flex-1 p-5 flex flex-col gap-4 overflow-y-auto">
                <form onsubmit="event.preventDefault();os.clockAddAlarm()" class="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex flex-wrap items-center gap-2.5">
                    <input id="clk-alarm-time" type="time" value="08:00" required class="px-3 py-2 rounded-xl bg-black/60 border border-white/15 font-mono text-sm text-amber-300 outline-none">
                    <input id="clk-alarm-label" type="text" placeholder="Alarm label (e.g. Morning Standup)" class="flex-1 min-w-[180px] px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white outline-none">
                    <button type="submit" class="px-4 py-2 rounded-xl bg-[#ff9f0a] text-black font-semibold text-xs hover:brightness-110 transition hover-target cursor-none">+ Add Alarm</button>
                </form>
                <div id="clk-alarm-list" class="grid grid-cols-1 sm:grid-cols-2 gap-3"></div>
            </div>

            <!-- Tab 3: Stopwatch with Fastest/Slowest Lap Splits -->
            <div id="clk-pane-stopwatch" class="hidden flex-1 p-6 flex flex-col items-center justify-between min-h-0">
                <div class="flex flex-col items-center my-auto">
                    <div id="clk-sw-display" class="text-6xl sm:text-7xl font-extralight font-mono tracking-tight tabular-nums text-white">00:00.00</div>
                    <div class="flex items-center gap-8 mt-6">
                        <button type="button" id="clk-sw-lap-btn" onclick="os.clockSwLapOrReset()" class="w-16 h-16 rounded-full bg-white/10 hover:bg-white/16 border border-white/15 text-xs font-medium text-gray-200 transition hover-target cursor-none">Lap</button>
                        <button type="button" id="clk-sw-start-btn" onclick="os.clockSwToggle()" class="w-16 h-16 rounded-full bg-emerald-500/25 hover:bg-emerald-500/35 border border-emerald-400/40 text-xs font-semibold text-emerald-300 transition hover-target cursor-none">Start</button>
                    </div>
                </div>
                <div id="clk-sw-laps" class="w-full max-w-md h-40 overflow-y-auto border-t border-white/10 pt-2 font-mono text-xs space-y-1"></div>
            </div>

            <!-- Tab 4: Circular Ring Timer -->
            <div id="clk-pane-timer" class="hidden flex-1 p-6 flex flex-col items-center justify-center gap-5">
                <div class="relative w-52 h-52 flex items-center justify-center">
                    <svg class="w-full h-full -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="6"/>
                        <circle id="clk-tmr-ring" cx="60" cy="60" r="52" fill="none" stroke="#ff9f0a" stroke-width="6" stroke-linecap="round" stroke-dasharray="326.73" stroke-dashoffset="0"/>
                    </svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                        <div id="clk-tmr-display" class="text-4xl font-light font-mono tabular-nums text-white">05:00</div>
                        <div id="clk-tmr-sub" class="text-[10px] font-mono text-gray-400 mt-1">READY</div>
                    </div>
                </div>
                <div class="flex flex-wrap items-center justify-center gap-1.5">
                    <button type="button" onclick="os.clockTimerPreset(60)" class="px-3 py-1 rounded-full bg-white/[0.07] hover:bg-white/14 text-[11px] text-gray-200 hover-target cursor-none">1 min</button>
                    <button type="button" onclick="os.clockTimerPreset(180)" class="px-3 py-1 rounded-full bg-white/[0.07] hover:bg-white/14 text-[11px] text-gray-200 hover-target cursor-none">3 min</button>
                    <button type="button" onclick="os.clockTimerPreset(300)" class="px-3 py-1 rounded-full bg-white/[0.07] hover:bg-white/14 text-[11px] text-gray-200 hover-target cursor-none">5 min</button>
                    <button type="button" onclick="os.clockTimerPreset(600)" class="px-3 py-1 rounded-full bg-white/[0.07] hover:bg-white/14 text-[11px] text-gray-200 hover-target cursor-none">10 min</button>
                    <button type="button" onclick="os.clockTimerPreset(900)" class="px-3 py-1 rounded-full bg-white/[0.07] hover:bg-white/14 text-[11px] text-gray-200 hover-target cursor-none">15 min</button>
                    <button type="button" onclick="os.clockTimerPreset(1800)" class="px-3 py-1 rounded-full bg-white/[0.07] hover:bg-white/14 text-[11px] text-gray-200 hover-target cursor-none">30 min</button>
                </div>
                <div class="flex items-center gap-4">
                    <button type="button" onclick="os.clockTimerReset()" class="px-5 py-2 rounded-full bg-white/10 hover:bg-white/16 text-gray-200 font-medium hover-target cursor-none">Cancel</button>
                    <button type="button" id="clk-tmr-start-btn" onclick="os.clockTimerToggle()" class="px-6 py-2 rounded-full bg-[#ff9f0a] text-black font-semibold hover:brightness-110 hover-target cursor-none">Start</button>
                </div>
            </div>
        </div>
    `;

    // ═══════════════════════════════════════════════════════════════════════
    //  3. NATIVE macOS STICKIES (App Manager + Floating Desktop Sticky Notes)
    // ═══════════════════════════════════════════════════════════════════════
    const STICKY_THEMES = {
        yellow: { label: 'Canary',   bg: '#fef08a', hdr: '#fde047', text: '#1c1917' },
        pink:   { label: 'Rose',     bg: '#fbcfe8', hdr: '#f9a8d4', text: '#1f2937' },
        blue:   { label: 'Sky',      bg: '#bae6fd', hdr: '#7dd3fc', text: '#0f172a' },
        mint:   { label: 'Mint',     bg: '#bbf7d0', hdr: '#86efac', text: '#064e3b' },
        purple: { label: 'Lavender', bg: '#ddd6fe', hdr: '#c4b5fd', text: '#1e1b4b' },
        glass:  { label: 'Glass',    bg: 'rgba(20,24,36,0.88)', hdr: 'rgba(255,255,255,0.10)', text: '#f8fafc' }
    };
    const STICKY_KEY = 'AetherOS_Stickies_v1';

    window.WindowContents.stickies = `
        <div class="h-full flex flex-col bg-[#14151c]/95 text-white text-xs select-none overflow-hidden" id="stickies-root">
            <div class="px-4 py-3 border-b border-white/[0.08] bg-black/40 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <div class="font-semibold text-sm text-white">Desktop Stickies</div>
                    <div class="text-[11px] text-gray-400">Pin translucent pastel notes right onto your desktop wallpaper</div>
                </div>
                <div class="flex items-center gap-2">
                    <button type="button" onclick="os.stickiesAdd('yellow')" class="px-3.5 py-1.5 rounded-xl bg-[#fef08a] text-black font-semibold text-xs hover:brightness-105 transition hover-target cursor-none">+ New Sticky Note</button>
                    <button type="button" id="stickies-vis-btn" onclick="os.stickiesToggleDesktop()" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-gray-200 text-xs hover-target cursor-none">Hide Desktop Notes</button>
                </div>
            </div>
            <div id="stickies-manager-list" class="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto"></div>
        </div>
    `;

    function loadStickies() {
        try {
            const raw = localStorage.getItem(STICKY_KEY);
            if (raw) return JSON.parse(raw);
        } catch (_) {}
        return [
            {
                id: 'stk-welcome',
                color: 'yellow',
                x: 44,
                y: 66,
                collapsed: false,
                pinnedOnDesktop: true,
                text: 'Welcome to AetherOS!\n• Drag me anywhere on the desktop\n• Double-click my top bar to shade\n• Try Photo Booth, GaragePad & Clock in the Dock!'
            }
        ];
    }

    function saveStickies(list) {
        try { localStorage.setItem(STICKY_KEY, JSON.stringify(list)); } catch (_) {}
    }

    window.extendOS({
        // ── Calculator State & Logic ──
        calcState: {
            display: '0',
            prev: null,
            op: null,
            waitingNext: false,
            expr: '',
            scientific: false,
            radians: false,
            mem: 0,
            tape: [],
            tapeOpen: false
        },

        initCalculator: () => {
            os.calcRender();
            const root = document.getElementById('calc-root');
            if (root && window.lucide) lucide.createIcons({ root });
        },

        calcRender: () => {
            const disp = document.getElementById('calc-display');
            const expr = document.getElementById('calc-expr');
            const ac = document.getElementById('calc-ac-btn');
            if (disp) {
                const s = String(os.calcState.display);
                disp.style.fontSize = s.length > 12 ? '1.65rem' : s.length > 9 ? '2.2rem' : '2.85rem';
                disp.textContent = s;
            }
            if (expr) expr.textContent = os.calcState.expr || '';
            if (ac) ac.textContent = (os.calcState.display !== '0' && !os.calcState.waitingNext) ? 'C' : 'AC';
            document.querySelectorAll('[data-calc-op]').forEach((btn) => {
                btn.classList.toggle('armed', os.calcState.waitingNext && btn.getAttribute('data-calc-op') === os.calcState.op);
            });
        },

        calcDigit: (d) => {
            playNativeChime('tap');
            const st = os.calcState;
            if (st.waitingNext) {
                st.display = d === '.' ? '0.' : d;
                st.waitingNext = false;
            } else {
                if (d === '.' && st.display.includes('.')) return;
                st.display = st.display === '0' && d !== '.' ? d : (st.display.length < 16 ? st.display + d : st.display);
            }
            os.calcRender();
        },

        calcClear: () => {
            playNativeChime('tap');
            const st = os.calcState;
            if (st.display !== '0' && !st.waitingNext) {
                st.display = '0';
            } else {
                st.display = '0';
                st.prev = null;
                st.op = null;
                st.expr = '';
                st.waitingNext = false;
            }
            os.calcRender();
        },

        calcNegate: () => {
            const v = parseFloat(os.calcState.display);
            if (!Number.isNaN(v) && v !== 0) os.calcState.display = String(-v);
            os.calcRender();
        },

        calcPercent: () => {
            const v = parseFloat(os.calcState.display);
            if (!Number.isNaN(v)) os.calcState.display = String(Number((v / 100).toPrecision(12)));
            os.calcRender();
        },

        _calcEvalPair: (a, b, op) => {
            if (op === '+') return a + b;
            if (op === '-') return a - b;
            if (op === '*') return a * b;
            if (op === '/') return b === 0 ? NaN : a / b;
            if (op === 'pow') return Math.pow(a, b);
            return b;
        },

        calcOp: (nextOp) => {
            playNativeChime('tap');
            const st = os.calcState;
            const cur = parseFloat(st.display);
            const sym = nextOp === '*' ? '×' : nextOp === '/' ? '÷' : nextOp === '-' ? '−' : nextOp === 'pow' ? '^' : '+';
            if (st.prev !== null && st.op && !st.waitingNext) {
                const res = os._calcEvalPair(st.prev, cur, st.op);
                st.display = Number.isFinite(res) ? String(Number(res.toPrecision(12))) : 'Error';
                st.prev = Number.isFinite(res) ? res : null;
            } else {
                st.prev = cur;
            }
            st.op = nextOp;
            st.waitingNext = true;
            st.expr = `${st.prev} ${sym}`;
            os.calcRender();
        },

        calcEquals: () => {
            playNativeChime('tap');
            const st = os.calcState;
            if (st.op === null || st.prev === null) return;
            const cur = parseFloat(st.display);
            const sym = st.op === '*' ? '×' : st.op === '/' ? '÷' : st.op === '-' ? '−' : st.op === 'pow' ? '^' : '+';
            const res = os._calcEvalPair(st.prev, cur, st.op);
            const formatted = Number.isFinite(res) ? String(Number(res.toPrecision(12))) : 'Error';
            const line = `${st.prev} ${sym} ${cur} = ${formatted}`;
            st.tape.unshift({ expr: line, val: formatted });
            if (st.tape.length > 30) st.tape.pop();
            st.expr = `${st.prev} ${sym} ${cur} =`;
            st.display = formatted;
            st.prev = null;
            st.op = null;
            st.waitingNext = true;
            os.calcRender();
            os.calcRenderTape();
        },

        calcToggleScientific: () => {
            const st = os.calcState;
            st.scientific = !st.scientific;
            const pad = document.getElementById('calc-sci-pad');
            const badge = document.getElementById('calc-angle-badge');
            const btn = document.getElementById('calc-sci-toggle');
            if (pad) pad.classList.toggle('hidden', !st.scientific);
            if (badge) badge.classList.toggle('hidden', !st.scientific);
            if (btn) btn.classList.toggle('bg-[#ff9f0a]', st.scientific);
            if (btn) btn.classList.toggle('text-black', st.scientific);
            const winEl = document.getElementById('win-calculator');
            const winData = SystemState.windows.calculator;
            if (winEl && winData) {
                const nextW = st.scientific ? 650 : 340;
                winData.width = nextW;
                winEl.style.width = `${nextW}px`;
            }
        },

        calcToggleRad: () => {
            os.calcState.radians = !os.calcState.radians;
            const badge = document.getElementById('calc-angle-badge');
            const btn = document.getElementById('calc-rad-btn');
            if (badge) badge.textContent = os.calcState.radians ? 'RAD' : 'DEG';
            if (btn) btn.textContent = os.calcState.radians ? 'Deg' : 'Rad';
        },

        calcSci: (fn) => {
            playNativeChime('tap');
            const x = parseFloat(os.calcState.display);
            if (Number.isNaN(x)) return;
            const rad = os.calcState.radians ? x : (x * Math.PI) / 180;
            let out = x;
            if (fn === 'sq') out = x * x;
            else if (fn === 'cube') out = x * x * x;
            else if (fn === 'exp') out = Math.exp(x);
            else if (fn === 'pow10') out = Math.pow(10, x);
            else if (fn === 'inv') out = 1 / x;
            else if (fn === 'sqrt') out = Math.sqrt(x);
            else if (fn === 'cbrt') out = Math.cbrt(x);
            else if (fn === 'ln') out = Math.log(x);
            else if (fn === 'log10') out = Math.log10(x);
            else if (fn === 'sin') out = Math.sin(rad);
            else if (fn === 'cos') out = Math.cos(rad);
            else if (fn === 'tan') out = Math.tan(rad);
            else if (fn === 'sinh') out = Math.sinh(x);
            else if (fn === 'cosh') out = Math.cosh(x);
            else if (fn === 'tanh') out = Math.tanh(x);
            else if (fn === 'fact') {
                if (x < 0 || x > 170 || Math.floor(x) !== x) out = NaN;
                else { out = 1; for (let i = 2; i <= x; i++) out *= i; }
            }
            const formatted = Number.isFinite(out) ? String(Number(out.toPrecision(12))) : 'Error';
            os.calcState.expr = `${fn}(${x})`;
            os.calcState.display = formatted;
            os.calcState.waitingNext = true;
            os.calcRender();
        },

        calcConst: (c) => {
            os.calcState.display = c === 'pi' ? String(Number(Math.PI.toPrecision(12)))
                                 : c === 'e'  ? String(Number(Math.E.toPrecision(12)))
                                 : String(Number(Math.random().toFixed(8)));
            os.calcState.waitingNext = false;
            os.calcRender();
        },

        calcMem: (m) => {
            const v = parseFloat(os.calcState.display) || 0;
            if (m === 'mc') os.calcState.mem = 0;
            else if (m === 'm+') os.calcState.mem += v;
            else if (m === 'm-') os.calcState.mem -= v;
            else if (m === 'mr') { os.calcState.display = String(os.calcState.mem); os.calcRender(); }
        },

        calcToggleTape: () => {
            os.calcState.tapeOpen = !os.calcState.tapeOpen;
            const d = document.getElementById('calc-tape-drawer');
            if (d) d.classList.toggle('hidden', !os.calcState.tapeOpen);
            os.calcRenderTape();
        },

        calcRenderTape: () => {
            const d = document.getElementById('calc-tape-drawer');
            if (!d) return;
            if (!os.calcState.tape.length) {
                d.innerHTML = `<div class="text-gray-500 text-center py-2">No calculations yet</div>`;
                return;
            }
            d.innerHTML = os.calcState.tape.map((t, idx) => `
                <button type="button" onclick="os.calcState.display='${esc(t.val)}';os.calcRender()"
                    class="w-full text-right px-2 py-1 rounded hover:bg-white/10 text-gray-200 block truncate hover-target cursor-none">${esc(t.expr)}</button>
            `).join('');
        },

        // ── 4-Tab macOS Clock App Logic ──
        clockState: {
            tab: 'world',
            alarms: [
                { id: 'al-1', time: '08:30', label: 'Morning Focus Sprint', enabled: true },
                { id: 'al-2', time: '18:00', label: 'Evening Wrap-Up', enabled: false }
            ],
            lastTriggeredMinute: '',
            swRunning: false,
            swStartMs: 0,
            swAccumMs: 0,
            swLastLapMs: 0,
            swLaps: [],
            swRaf: null,
            tmrTotalSec: 300,
            tmrRemainSec: 300,
            tmrRunning: false,
            tmrInterval: null
        },

        initClockApp: () => {
            os.clockSetTab(os.clockState.tab || 'world');
            if (!os._clockTickInterval) {
                os._clockTickInterval = setInterval(() => {
                    if (SystemState.windows.clockapp?.isOpen && os.clockState.tab === 'world') {
                        os.clockRenderWorld();
                    }
                    os.clockCheckAlarms();
                }, 1000);
            }
        },

        clockSetTab: (tab) => {
            os.clockState.tab = tab;
            ['world', 'alarm', 'stopwatch', 'timer'].forEach((t) => {
                const p = document.getElementById(`clk-pane-${t}`);
                if (p) p.classList.toggle('hidden', t !== tab);
            });
            document.querySelectorAll('[data-clk-tab]').forEach((b) => {
                b.classList.toggle('active', b.getAttribute('data-clk-tab') === tab);
            });
            if (tab === 'world') os.clockRenderWorld();
            if (tab === 'alarm') os.clockRenderAlarms();
            if (tab === 'stopwatch') os.clockRenderSw();
            if (tab === 'timer') os.clockRenderTimer();
        },

        clockRenderWorld: () => {
            const grid = document.getElementById('clk-world-grid');
            if (!grid) return;
            const now = new Date();
            grid.innerHTML = CLOCK_CITIES.map((c) => {
                let h = 12, m = 0, s = 0, timeStr = '--:--';
                try {
                    const parts = new Intl.DateTimeFormat('en-US', {
                        timeZone: c.tz, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
                    }).formatToParts(now);
                    h = Number(parts.find((p) => p.type === 'hour')?.value || 0) % 24;
                    m = Number(parts.find((p) => p.type === 'minute')?.value || 0);
                    s = Number(parts.find((p) => p.type === 'second')?.value || 0);
                    timeStr = new Intl.DateTimeFormat([], { timeZone: c.tz, hour: '2-digit', minute: '2-digit' }).format(now);
                } catch (_) {}

                const isDay = h >= 6 && h < 18;
                const hDeg = ((h % 12) + m / 60) * 30;
                const mDeg = (m + s / 60) * 6;
                const sDeg = s * 6;
                const dialBg = isDay ? '#f8fafc' : '#1e2029';
                const handCol = isDay ? '#0f172a' : '#f8fafc';

                return `
                    <div class="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-3.5">
                        <svg width="62" height="62" viewBox="0 0 64 64" class="shrink-0 drop-shadow-md">
                            <circle cx="32" cy="32" r="30" fill="${dialBg}" stroke="rgba(255,255,255,0.16)" stroke-width="1.5"/>
                            ${Array.from({ length: 12 }, (_, i) => {
                                const a = (i * 30 * Math.PI) / 180;
                                return `<line x1="${32 + Math.sin(a) * 24}" y1="${32 - Math.cos(a) * 24}" x2="${32 + Math.sin(a) * 27}" y2="${32 - Math.cos(a) * 27}" stroke="${isDay ? '#64748b' : '#94a3b8'}" stroke-width="1.4"/>`;
                            }).join('')}
                            <line x1="32" y1="32" x2="${32 + Math.sin((hDeg * Math.PI) / 180) * 14}" y2="${32 - Math.cos((hDeg * Math.PI) / 180) * 14}" stroke="${handCol}" stroke-width="2.6" stroke-linecap="round"/>
                            <line x1="32" y1="32" x2="${32 + Math.sin((mDeg * Math.PI) / 180) * 21}" y2="${32 - Math.cos((mDeg * Math.PI) / 180) * 21}" stroke="${handCol}" stroke-width="1.9" stroke-linecap="round"/>
                            <line x1="32" y1="32" x2="${32 + Math.sin((sDeg * Math.PI) / 180) * 23}" y2="${32 - Math.cos((sDeg * Math.PI) / 180) * 23}" stroke="#ff9f0a" stroke-width="1.1" stroke-linecap="round"/>
                            <circle cx="32" cy="32" r="2.3" fill="#ff9f0a"/>
                        </svg>
                        <div class="min-w-0">
                            <div class="text-[10px] text-gray-400">${isDay ? '☀ Day' : '☾ Night'} · ${esc(c.country)}</div>
                            <div class="font-semibold text-sm text-white truncate">${esc(c.city)}</div>
                            <div class="font-mono text-base text-amber-300 mt-0.5">${esc(timeStr)}</div>
                        </div>
                    </div>
                `;
            }).join('');
        },

        clockRenderAlarms: () => {
            const list = document.getElementById('clk-alarm-list');
            if (!list) return;
            list.innerHTML = os.clockState.alarms.map((a) => `
                <div class="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between">
                    <div>
                        <div class="text-3xl font-light font-mono ${a.enabled ? 'text-white' : 'text-gray-500'}">${esc(a.time)}</div>
                        <div class="text-[11px] text-gray-400 mt-0.5">${esc(a.label || 'Alarm')}</div>
                    </div>
                    <div class="flex items-center gap-2.5">
                        <button type="button" onclick="os.clockToggleAlarm('${esc(a.id)}')"
                            class="w-11 h-6 rounded-full p-0.5 transition ${a.enabled ? 'bg-emerald-500' : 'bg-white/15'} hover-target cursor-none">
                            <span class="block w-5 h-5 rounded-full bg-white shadow transition-transform ${a.enabled ? 'translate-x-5' : 'translate-x-0'}"></span>
                        </button>
                        <button type="button" onclick="os.clockDeleteAlarm('${esc(a.id)}')" class="text-gray-500 hover:text-rose-400 text-xs hover-target cursor-none">✕</button>
                    </div>
                </div>
            `).join('');
        },

        clockAddAlarm: () => {
            const t = document.getElementById('clk-alarm-time')?.value || '08:00';
            const l = document.getElementById('clk-alarm-label')?.value.trim() || 'Alarm';
            os.clockState.alarms.unshift({ id: 'al-' + Date.now(), time: t, label: l, enabled: true });
            const lEl = document.getElementById('clk-alarm-label');
            if (lEl) lEl.value = '';
            os.clockRenderAlarms();
        },

        clockToggleAlarm: (id) => {
            const a = os.clockState.alarms.find((x) => x.id === id);
            if (a) a.enabled = !a.enabled;
            os.clockRenderAlarms();
        },

        clockDeleteAlarm: (id) => {
            os.clockState.alarms = os.clockState.alarms.filter((x) => x.id !== id);
            os.clockRenderAlarms();
        },

        clockCheckAlarms: () => {
            const now = new Date();
            const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            if (os.clockState.lastTriggeredMinute === hhmm) return;
            const hit = os.clockState.alarms.find((a) => a.enabled && a.time === hhmm);
            if (hit) {
                os.clockState.lastTriggeredMinute = hhmm;
                playNativeChime('chime');
                window.Notifications && window.Notifications.push('ALARM · ' + hhmm, hit.label);
            }
        },

        // Stopwatch
        _fmtSw: (ms) => {
            const totalCs = Math.floor(ms / 10);
            const cs = String(totalCs % 100).padStart(2, '0');
            const sec = String(Math.floor(totalCs / 100) % 60).padStart(2, '0');
            const min = String(Math.floor(totalCs / 6000)).padStart(2, '0');
            return `${min}:${sec}.${cs}`;
        },

        clockSwToggle: () => {
            const st = os.clockState;
            if (!st.swRunning) {
                st.swRunning = true;
                st.swStartMs = performance.now();
                const tick = () => {
                    if (!st.swRunning) return;
                    os.clockRenderSw();
                    st.swRaf = requestAnimationFrame(tick);
                };
                st.swRaf = requestAnimationFrame(tick);
            } else {
                st.swAccumMs += performance.now() - st.swStartMs;
                st.swRunning = false;
                if (st.swRaf) cancelAnimationFrame(st.swRaf);
                os.clockRenderSw();
            }
        },

        clockSwLapOrReset: () => {
            const st = os.clockState;
            const cur = st.swAccumMs + (st.swRunning ? performance.now() - st.swStartMs : 0);
            if (st.swRunning) {
                const split = cur - st.swLastLapMs;
                st.swLastLapMs = cur;
                st.swLaps.unshift({ num: st.swLaps.length + 1, split });
            } else {
                st.swAccumMs = 0;
                st.swLastLapMs = 0;
                st.swLaps = [];
            }
            os.clockRenderSw();
        },

        clockRenderSw: () => {
            const st = os.clockState;
            const cur = st.swAccumMs + (st.swRunning ? performance.now() - st.swStartMs : 0);
            const disp = document.getElementById('clk-sw-display');
            const startBtn = document.getElementById('clk-sw-start-btn');
            const lapBtn = document.getElementById('clk-sw-lap-btn');
            const lapsEl = document.getElementById('clk-sw-laps');
            if (disp) disp.textContent = os._fmtSw(cur);
            if (startBtn) {
                startBtn.textContent = st.swRunning ? 'Stop' : 'Start';
                startBtn.className = st.swRunning
                    ? 'w-16 h-16 rounded-full bg-rose-500/25 border border-rose-400/40 text-xs font-semibold text-rose-300 transition hover-target cursor-none'
                    : 'w-16 h-16 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-xs font-semibold text-emerald-300 transition hover-target cursor-none';
            }
            if (lapBtn) lapBtn.textContent = st.swRunning || cur === 0 ? 'Lap' : 'Reset';
            if (lapsEl) {
                const splits = st.swLaps.map((l) => l.split);
                const minS = splits.length >= 2 ? Math.min(...splits) : -1;
                const maxS = splits.length >= 2 ? Math.max(...splits) : -1;
                lapsEl.innerHTML = st.swLaps.map((l) => {
                    const col = l.split === minS ? 'text-emerald-400' : l.split === maxS ? 'text-rose-400' : 'text-gray-200';
                    return `<div class="flex justify-between py-1 border-b border-white/[0.05] ${col}"><span>Lap ${l.num}</span><span>${os._fmtSw(l.split)}</span></div>`;
                }).join('');
            }
        },

        // Timer
        clockTimerPreset: (sec) => {
            os.clockTimerReset();
            os.clockState.tmrTotalSec = sec;
            os.clockState.tmrRemainSec = sec;
            os.clockRenderTimer();
        },

        clockTimerToggle: () => {
            const st = os.clockState;
            if (!st.tmrRunning) {
                if (st.tmrRemainSec <= 0) st.tmrRemainSec = st.tmrTotalSec;
                st.tmrRunning = true;
                st.tmrInterval = setInterval(() => {
                    st.tmrRemainSec = Math.max(0, st.tmrRemainSec - 1);
                    os.clockRenderTimer();
                    if (st.tmrRemainSec <= 0) {
                        clearInterval(st.tmrInterval);
                        st.tmrRunning = false;
                        playNativeChime('chime');
                        window.Notifications && window.Notifications.push('TIMER COMPLETE', 'Countdown finished!');
                        os.clockRenderTimer();
                    }
                }, 1000);
            } else {
                st.tmrRunning = false;
                clearInterval(st.tmrInterval);
            }
            os.clockRenderTimer();
        },

        clockTimerReset: () => {
            clearInterval(os.clockState.tmrInterval);
            os.clockState.tmrRunning = false;
            os.clockState.tmrRemainSec = os.clockState.tmrTotalSec;
            os.clockRenderTimer();
        },

        clockRenderTimer: () => {
            const st = os.clockState;
            const disp = document.getElementById('clk-tmr-display');
            const sub = document.getElementById('clk-tmr-sub');
            const ring = document.getElementById('clk-tmr-ring');
            const btn = document.getElementById('clk-tmr-start-btn');
            const m = String(Math.floor(st.tmrRemainSec / 60)).padStart(2, '0');
            const s = String(st.tmrRemainSec % 60).padStart(2, '0');
            if (disp) disp.textContent = `${m}:${s}`;
            if (sub) sub.textContent = st.tmrRunning ? 'COUNTING DOWN' : 'PAUSED';
            if (btn) btn.textContent = st.tmrRunning ? 'Pause' : 'Start';
            if (ring) {
                const pct = st.tmrTotalSec > 0 ? st.tmrRemainSec / st.tmrTotalSec : 0;
                ring.setAttribute('stroke-dashoffset', String(326.73 * (1 - pct)));
            }
        },

        // ── Native Floating Desktop Stickies ──
        stickiesState: {
            notes: loadStickies(),
            desktopVisible: true
        },

        initStickies: () => {
            os.stickiesRenderManager();
            os.stickiesRenderDesktop();
        },

        stickiesAdd: (color = 'yellow') => {
            const n = {
                id: 'stk-' + Date.now(),
                color: STICKY_THEMES[color] ? color : 'yellow',
                x: 60 + ((os.stickiesState.notes.length * 28) % 240),
                y: 74 + ((os.stickiesState.notes.length * 24) % 180),
                collapsed: false,
                pinnedOnDesktop: true,
                text: ''
            };
            os.stickiesState.notes.unshift(n);
            os.stickiesState.desktopVisible = true;
            saveStickies(os.stickiesState.notes);
            os.stickiesRenderManager();
            os.stickiesRenderDesktop();
        },

        stickiesUpdateText: (id, text) => {
            const n = os.stickiesState.notes.find((x) => x.id === id);
            if (!n) return;
            n.text = text;
            saveStickies(os.stickiesState.notes);
        },

        stickiesSetColor: (id, color) => {
            const n = os.stickiesState.notes.find((x) => x.id === id);
            if (!n || !STICKY_THEMES[color]) return;
            n.color = color;
            saveStickies(os.stickiesState.notes);
            os.stickiesRenderManager();
            os.stickiesRenderDesktop();
        },

        stickiesToggleCollapse: (id) => {
            const n = os.stickiesState.notes.find((x) => x.id === id);
            if (!n) return;
            n.collapsed = !n.collapsed;
            saveStickies(os.stickiesState.notes);
            os.stickiesRenderDesktop();
        },

        stickiesDelete: (id) => {
            os.stickiesState.notes = os.stickiesState.notes.filter((x) => x.id !== id);
            saveStickies(os.stickiesState.notes);
            os.stickiesRenderManager();
            os.stickiesRenderDesktop();
        },

        stickiesToggleDesktop: () => {
            os.stickiesState.desktopVisible = !os.stickiesState.desktopVisible;
            const btn = document.getElementById('stickies-vis-btn');
            if (btn) btn.textContent = os.stickiesState.desktopVisible ? 'Hide Desktop Notes' : 'Show Desktop Notes';
            os.stickiesRenderDesktop();
        },

        stickiesRenderManager: () => {
            const el = document.getElementById('stickies-manager-list');
            if (!el) return;
            el.innerHTML = os.stickiesState.notes.map((n) => {
                const th = STICKY_THEMES[n.color] || STICKY_THEMES.yellow;
                return `
                    <div class="rounded-2xl p-3 shadow-lg flex flex-col gap-2 border border-white/15" style="background:${th.bg};color:${th.text}">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-1">
                                ${Object.keys(STICKY_THEMES).map((c) => `
                                    <button type="button" onclick="os.stickiesSetColor('${esc(n.id)}','${c}')"
                                        class="w-3.5 h-3.5 rounded-full border border-black/25 hover-target cursor-none"
                                        style="background:${c === 'glass' ? '#1e293b' : STICKY_THEMES[c].bg}"></button>
                                `).join('')}
                            </div>
                            <button type="button" onclick="os.stickiesDelete('${esc(n.id)}')" class="text-xs opacity-60 hover:opacity-100 hover-target cursor-none">✕</button>
                        </div>
                        <textarea rows="4" oninput="os.stickiesUpdateText('${esc(n.id)}', this.value);os.stickiesRenderDesktop()"
                            placeholder="Write a sticky note..."
                            class="w-full bg-transparent resize-none outline-none text-xs leading-relaxed font-medium">${esc(n.text)}</textarea>
                    </div>
                `;
            }).join('');
        },

        stickiesRenderDesktop: () => {
            const canvas = document.getElementById('window-canvas');
            if (!canvas) return;
            let host = document.getElementById('desktop-stickies-layer');
            if (!host) {
                host = document.createElement('div');
                host.id = 'desktop-stickies-layer';
                host.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:2;';
                canvas.insertBefore(host, canvas.firstChild);
            }
            if (!os.stickiesState.desktopVisible) {
                host.innerHTML = '';
                return;
            }

            host.innerHTML = os.stickiesState.notes.filter((n) => n.pinnedOnDesktop !== false).map((n) => {
                const th = STICKY_THEMES[n.color] || STICKY_THEMES.yellow;
                return `
                    <div data-sticky-id="${esc(n.id)}"
                        style="position:absolute;left:${n.x}px;top:${n.y}px;width:215px;pointer-events:auto;background:${th.bg};color:${th.text};backdrop-filter:blur(16px);"
                        class="rounded-xl shadow-2xl border border-black/15 overflow-hidden select-none">
                        <div data-sticky-drag="${esc(n.id)}" ondblclick="os.stickiesToggleCollapse('${esc(n.id)}')"
                            style="background:${th.hdr};height:22px;"
                            class="px-2.5 flex items-center justify-between cursor-grab">
                            <div class="flex items-center gap-1">
                                ${['yellow', 'pink', 'blue', 'mint', 'glass'].map((c) => `
                                    <button type="button" onclick="event.stopPropagation();os.stickiesSetColor('${esc(n.id)}','${c}')"
                                        class="w-2.5 h-2.5 rounded-full border border-black/20 hover-target cursor-none"
                                        style="background:${c === 'glass' ? '#0f172a' : STICKY_THEMES[c].bg}"></button>
                                `).join('')}
                            </div>
                            <button type="button" onclick="event.stopPropagation();os.stickiesDelete('${esc(n.id)}')" class="text-[10px] opacity-60 hover:opacity-100 leading-none hover-target cursor-none">✕</button>
                        </div>
                        ${n.collapsed ? '' : `
                            <textarea rows="5" oninput="os.stickiesUpdateText('${esc(n.id)}', this.value)"
                                placeholder="Type a note..."
                                class="w-full p-2.5 bg-transparent resize-none outline-none text-[11.5px] leading-snug font-medium cursor-text select-text">${esc(n.text)}</textarea>
                        `}
                    </div>
                `;
            }).join('');

            // Wire lightweight pointer drag on sticky headers
            host.querySelectorAll('[data-sticky-drag]').forEach((hdr) => {
                hdr.onmousedown = (e) => {
                    if (e.target.tagName === 'BUTTON') return;
                    const id = hdr.getAttribute('data-sticky-drag');
                    const card = hdr.parentElement;
                    const note = os.stickiesState.notes.find((x) => x.id === id);
                    if (!card || !note) return;
                    const startX = e.clientX - note.x;
                    const startY = e.clientY - note.y;
                    const onMove = (ev) => {
                        note.x = Math.max(8, Math.min(window.innerWidth - 225, ev.clientX - startX));
                        note.y = Math.max(8, Math.min(window.innerHeight - 120, ev.clientY - startY));
                        card.style.left = `${note.x}px`;
                        card.style.top = `${note.y}px`;
                    };
                    const onUp = () => {
                        saveStickies(os.stickiesState.notes);
                        document.removeEventListener('mousemove', onMove);
                        document.removeEventListener('mouseup', onUp);
                    };
                    document.addEventListener('mousemove', onMove);
                    document.addEventListener('mouseup', onUp);
                };
            });
        }
    });

    // Render initial floating sticky note on desktop boot & bind physical numpad keys for Calculator
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.os && os.stickiesRenderDesktop && os.stickiesRenderDesktop();
        }, 120);

        document.addEventListener('keydown', (e) => {
            if (!window.SystemState || !SystemState.windows?.calculator?.isOpen || SystemState.windows?.calculator?.isMinimized) return;
            const tag = (e.target?.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
            const topWin = Object.values(SystemState.windows)
                .filter((w) => w && w.isOpen && !w.isMinimized)
                .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))[0];
            if (!topWin || topWin.id !== 'calculator') return;

            if (/^[0-9.]$/.test(e.key)) { e.preventDefault(); os.calcDigit(e.key); }
            else if (['+', '-', '*', '/'].includes(e.key)) { e.preventDefault(); os.calcOp(e.key); }
            else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); os.calcEquals(); }
            else if (e.key === 'Escape') { e.preventDefault(); os.calcClear(); }
            else if (e.key === '%') { e.preventDefault(); os.calcPercent(); }
            else if (e.key === 'Backspace') {
                e.preventDefault();
                const s = os.calcState.display;
                os.calcState.display = s.length > 1 ? s.slice(0, -1) : '0';
                os.calcRender();
            }
        });
    });
})();
