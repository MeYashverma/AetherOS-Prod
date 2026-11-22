// AetherOS — Native macOS Experience Suite II: Photo Booth (9 Live FX + 3x3 Grid + Strips), GaragePad Synth & Beat Studio, Voice Memos, and Spacebar Quick Look
(function () {
    const esc = (v) => String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    window.WindowContents = window.WindowContents || {};

    function getAudioCtx() {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        if (!window._aetherStudioCtx) window._aetherStudioCtx = new AC();
        if (window._aetherStudioCtx.state === 'suspended') window._aetherStudioCtx.resume();
        return window._aetherStudioCtx;
    }

    function playShutterSound(type = 'shutter') {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const now = ctx.currentTime;
        if (type === 'beep') {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.frequency.setValueAtTime(880, now);
            g.gain.setValueAtTime(0.08, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
            o.connect(g); g.connect(ctx.destination);
            o.start(now); o.stop(now + 0.1);
            return;
        }
        // Crisp two-curtain mechanical SLR camera shutter sound
        const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.09), ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) {
            const env = i < d.length * 0.3 ? Math.exp(-i / 280) : (i > d.length * 0.55 ? Math.exp(-(i - d.length * 0.55) / 320) : 0.02);
            d[i] = (Math.random() * 2 - 1) * env;
        }
        const src = ctx.createBufferSource();
        const g = ctx.createGain();
        src.buffer = buf;
        g.gain.value = 0.32;
        src.connect(g); g.connect(ctx.destination);
        src.start(now);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  1. PHOTO BOOTH (photobooth — Live Webcam / Shader + 9 FX + 3x3 Grid)
    // ═══════════════════════════════════════════════════════════════════════
    const PB_EFFECTS = [
        { id: 'normal',  label: 'Normal' },
        { id: 'thermal', label: 'Thermal' },
        { id: 'popart',  label: 'Pop Art' },
        { id: 'mirror',  label: 'Mirror' },
        { id: 'xray',    label: 'X-Ray' },
        { id: 'noir',    label: 'Film Noir' },
        { id: 'sepia',   label: 'Vintage' },
        { id: 'neon',    label: 'Cyber Glow' },
        { id: 'emerald', label: 'Night Vision' }
    ];

    window.WindowContents.photobooth = `
        <div class="h-full flex flex-col bg-[#111216] text-white text-xs select-none overflow-hidden relative" id="pb-root">
            <!-- Flash Overlay & Countdown -->
            <div id="pb-flash" class="pointer-events-none absolute inset-0 bg-white opacity-0 transition-opacity duration-150 z-30"></div>
            <div id="pb-countdown" class="hidden pointer-events-none absolute inset-0 z-20 flex items-center justify-center text-8xl font-bold text-white drop-shadow-[0_6px_30px_rgba(0,0,0,0.85)]">3</div>

            <!-- Top Camera Bar -->
            <div class="px-4 py-2 bg-black/55 border-b border-white/[0.08] flex items-center justify-between gap-2 z-10">
                <div class="flex items-center gap-2">
                    <span id="pb-cam-dot" class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
                    <span id="pb-cam-status" class="text-[11px] text-gray-300 font-medium">Live Shader Preview (Click Enable Webcam for Real Camera)</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <button type="button" id="pb-cam-btn" onclick="os.pbToggleWebcam()" class="px-3 py-1 rounded-full bg-white/12 hover:bg-white/20 border border-white/15 text-[11px] font-medium text-white transition hover-target cursor-none flex items-center gap-1.5">
                        <i data-lucide="camera" class="w-3.5 h-3.5 text-emerald-400"></i><span>Enable Webcam</span>
                    </button>
                    <label class="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.06] text-[10.5px] text-gray-300">
                        <input id="pb-timer-chk" type="checkbox" checked class="accent-rose-500"> 3s Timer
                    </label>
                </div>
            </div>

            <!-- Main Viewfinder / 3x3 Effects Grid -->
            <div class="flex-1 relative bg-black flex items-center justify-center overflow-hidden min-h-0">
                <video id="pb-video" playsinline muted class="hidden"></video>
                <canvas id="pb-canvas" width="720" height="460" onclick="os.pbCanvasClick(event)" class="max-w-full max-h-full object-contain cursor-pointer"></canvas>
            </div>

            <!-- Filmstrip Tray -->
            <div id="pb-strip-tray" class="h-20 px-3 py-1.5 bg-[#18191f] border-t border-white/[0.07] flex items-center gap-2 overflow-x-auto shrink-0">
                <div class="text-[11px] text-gray-500 italic px-2">Captured photos &amp; 4-pose strips appear here...</div>
            </div>

            <!-- Authentic macOS Photo Booth Bottom Control Bar -->
            <div class="px-5 py-2.5 bg-[#202127] border-t border-white/[0.09] flex items-center justify-between z-10 shrink-0">
                <div class="os-segmented">
                    <button type="button" data-pb-mode="single" onclick="os.pbSetShotMode('single')" class="os-seg-btn active hover-target cursor-none" title="Single Photo">1-Shot</button>
                    <button type="button" data-pb-mode="strip" onclick="os.pbSetShotMode('strip')" class="os-seg-btn hover-target cursor-none" title="4-Pose Photo Strip">4-Strip</button>
                </div>

                <!-- Iconic Red Shutter Button -->
                <button type="button" id="pb-shutter-btn" onclick="os.pbTriggerCapture()"
                    class="w-13 h-13 p-1 rounded-full bg-white/90 shadow-xl hover:scale-105 active:scale-95 transition hover-target cursor-none flex items-center justify-center" style="width:52px;height:52px" title="Take Photo">
                    <span class="w-full h-full rounded-full bg-[#ff3b30] flex items-center justify-center">
                        <i data-lucide="camera" class="w-5 h-5 text-white"></i>
                    </span>
                </button>

                <button type="button" id="pb-grid-btn" onclick="os.pbToggleGrid()"
                    class="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/18 border border-white/15 font-medium text-xs text-white transition hover-target cursor-none">
                    Effects (9)
                </button>
            </div>
        </div>
    `;

    // ═══════════════════════════════════════════════════════════════════════
    //  2. GARAGEPAD STUDIO (synthstudio — Polyphonic Piano + 16-Step Drum Pad)
    // ═══════════════════════════════════════════════════════════════════════
    const SYNTH_PATCHES = {
        rhodes: { label: 'Electric Rhodes', osc1: 'sine',     osc2: 'triangle', attack: 0.01, release: 0.65, detune: 5 },
        pad:    { label: 'Warm Analog Pad', osc1: 'sawtooth', osc2: 'triangle', attack: 0.14, release: 1.15, detune: 12 },
        pluck:  { label: 'Crystal Pluck',   osc1: 'triangle', osc2: 'square',   attack: 0.005, release: 0.36, detune: 3 },
        bass:   { label: '808 Sub Synth',   osc1: 'sine',     osc2: 'sawtooth', attack: 0.01, release: 0.45, detune: 2 },
        bell:   { label: 'Glass Bell',      osc1: 'sine',     osc2: 'sine',     attack: 0.004, release: 0.95, detune: 24 }
    };

    const PIANO_NOTES = [
        { note: 'C4',  midi: 60, black: false, key: 'a' },
        { note: 'C#4', midi: 61, black: true,  key: 'w' },
        { note: 'D4',  midi: 62, black: false, key: 's' },
        { note: 'D#4', midi: 63, black: true,  key: 'e' },
        { note: 'E4',  midi: 64, black: false, key: 'd' },
        { note: 'F4',  midi: 65, black: false, key: 'f' },
        { note: 'F#4', midi: 66, black: true,  key: 't' },
        { note: 'G4',  midi: 67, black: false, key: 'g' },
        { note: 'G#4', midi: 68, black: true,  key: 'y' },
        { note: 'A4',  midi: 69, black: false, key: 'h' },
        { note: 'A#4', midi: 70, black: true,  key: 'u' },
        { note: 'B4',  midi: 71, black: false, key: 'j' },
        { note: 'C5',  midi: 72, black: false, key: 'k' },
        { note: 'C#5', midi: 73, black: true,  key: 'o' },
        { note: 'D5',  midi: 74, black: false, key: 'l' },
        { note: 'D#5', midi: 75, black: true,  key: 'p' },
        { note: 'E5',  midi: 76, black: false, key: ';' },
        { note: 'F5',  midi: 77, black: false, key: "'" }
    ];

    const DRUM_GROOVES = {
        lofi: [
            [1,0,0,0, 0,0,0,1, 1,0,0,0, 0,0,0,0], // Kick
            [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], // Snare
            [1,0,1,0, 1,0,1,1, 1,0,1,0, 1,0,1,0], // Hat
            [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,1]  // Clap
        ],
        house: [
            [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
            [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
            [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
            [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,1,0]
        ],
        trap: [
            [1,0,0,1, 0,0,1,0, 0,0,1,0, 0,1,0,0],
            [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
            [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
            [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0]
        ]
    };

    window.WindowContents.synthstudio = `
        <div class="h-full flex flex-col bg-[#0d0f17] text-white text-xs select-none overflow-hidden" id="synth-root">
            <!-- Top Synth Rack Header -->
            <div class="px-4 py-2.5 bg-black/55 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2.5">
                <div class="flex items-center gap-2">
                    <span class="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">Instrument</span>
                    <select id="synth-patch" onchange="os.synthState.patch=this.value" class="px-3 py-1.5 rounded-xl bg-white/[0.08] border border-white/15 text-xs text-white outline-none">
                        <option value="rhodes">Electric Rhodes Piano</option>
                        <option value="pad">Warm Analog Synth Pad</option>
                        <option value="pluck">Crystal Pluck Harp</option>
                        <option value="bass">808 Sub Synth</option>
                        <option value="bell">Glass FM Bell</option>
                    </select>
                    <div class="flex items-center gap-1 ml-1">
                        <button type="button" onclick="os.synthShiftOctave(-1)" class="px-2 py-1 rounded-lg bg-white/[0.07] hover:bg-white/14 font-mono text-[11px] hover-target cursor-none">Oct −</button>
                        <span id="synth-oct-lbl" class="px-2 font-mono text-[11px] text-sky-300">C4</span>
                        <button type="button" onclick="os.synthShiftOctave(1)" class="px-2 py-1 rounded-lg bg-white/[0.07] hover:bg-white/14 font-mono text-[11px] hover-target cursor-none">Oct +</button>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <label class="flex items-center gap-1.5 text-[11px] text-gray-300">
                        <span>Cutoff</span>
                        <input type="range" min="300" max="7500" value="3800" oninput="os.synthState.cutoff=Number(this.value)" class="w-20 accent-amber-400">
                    </label>
                    <canvas id="synth-scope" width="150" height="34" class="rounded-lg bg-black/70 border border-white/10"></canvas>
                </div>
            </div>

            <!-- Middle: 16-Step Beat Machine -->
            <div class="p-4 border-b border-white/[0.08] bg-[#121521] flex flex-col gap-2.5">
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                        <button type="button" id="synth-seq-btn" onclick="os.synthToggleSequencer()"
                            class="px-4 py-1.5 rounded-full bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition hover-target cursor-none">▶ Play Beat</button>
                        <button type="button" onclick="os.synthLoadGroove('lofi')" class="px-2.5 py-1 rounded-full bg-white/[0.07] hover:bg-white/14 text-[11px] text-gray-200 hover-target cursor-none">Lo-Fi</button>
                        <button type="button" onclick="os.synthLoadGroove('house')" class="px-2.5 py-1 rounded-full bg-white/[0.07] hover:bg-white/14 text-[11px] text-gray-200 hover-target cursor-none">House</button>
                        <button type="button" onclick="os.synthLoadGroove('trap')" class="px-2.5 py-1 rounded-full bg-white/[0.07] hover:bg-white/14 text-[11px] text-gray-200 hover-target cursor-none">Trap 808</button>
                    </div>
                    <label class="flex items-center gap-2 font-mono text-[11px] text-gray-300">
                        <span id="synth-bpm-lbl">96 BPM</span>
                        <input type="range" min="68" max="156" value="96" oninput="os.synthSetBpm(Number(this.value))" class="w-24 accent-emerald-400">
                    </label>
                </div>
                <div id="synth-seq-grid" class="space-y-1.5"></div>
            </div>

            <!-- Bottom: Playable Polyphonic Piano Keyboard -->
            <div class="flex-1 p-4 flex flex-col justify-between bg-gradient-to-b from-[#0b0d14] to-[#06070b] min-h-[190px]">
                <div class="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                    <span>Play chords with mouse or keyboard keys <code class="text-sky-300 font-mono">A W S E D F T G Y H U J K O L</code></span>
                    <button type="button" onclick="os.synthPlayChordDemo()" class="px-3 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-amber-200 text-[11px] hover-target cursor-none">♪ Play Lush Chord</button>
                </div>
                <div id="synth-keys-host" class="relative flex-1 flex select-none rounded-xl overflow-hidden border border-white/15 shadow-2xl min-h-[135px]"></div>
            </div>
        </div>
    `;

    // ═══════════════════════════════════════════════════════════════════════
    //  3. VOICE MEMOS (voicememos — Native macOS Audio Recorder & Waveform)
    // ═══════════════════════════════════════════════════════════════════════
    window.WindowContents.voicememos = `
        <div class="h-full grid grid-cols-1 md:grid-cols-12 bg-[#14151a] text-white text-xs select-none overflow-hidden" id="vm-root">
            <!-- Sidebar List -->
            <div class="md:col-span-5 border-b md:border-b-0 md:border-r border-white/[0.08] bg-black/35 flex flex-col min-h-0">
                <div class="p-3.5 border-b border-white/[0.07] flex items-center justify-between">
                    <span class="font-semibold text-sm">All Recordings</span>
                    <button type="button" onclick="os.vmCreateDemoMemo()" class="px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/15 text-[10.5px] text-sky-300 hover-target cursor-none">+ Synth Memo</button>
                </div>
                <div id="vm-list" class="flex-1 overflow-y-auto divide-y divide-white/[0.06]"></div>
            </div>

            <!-- Right Waveform & Record Stage -->
            <div class="md:col-span-7 p-5 flex flex-col justify-between bg-[#0e0f14] min-h-0">
                <div>
                    <input id="vm-active-title" type="text" value="New Recording" onchange="os.vmRenameActive(this.value)"
                        class="bg-transparent text-lg font-semibold text-white outline-none border-b border-transparent focus:border-white/25 w-full">
                    <div id="vm-active-meta" class="text-[11px] font-mono text-gray-400 mt-0.5">Ready to record</div>
                </div>

                <!-- Live Red Waveform Canvas -->
                <div class="my-4 p-3 rounded-2xl bg-black/65 border border-white/[0.07] flex flex-col items-center gap-2">
                    <canvas id="vm-wave-canvas" width="420" height="120" class="w-full h-28"></canvas>
                    <div id="vm-timer-lbl" class="text-3xl font-extralight font-mono tabular-nums text-white">00:00.0</div>
                </div>

                <!-- Playback & Record Controls -->
                <div class="flex flex-col gap-3">
                    <audio id="vm-audio-el" class="w-full h-8"></audio>
                    <div class="flex items-center justify-between pt-2 border-t border-white/[0.08]">
                        <div class="flex items-center gap-1.5">
                            <button type="button" onclick="os.vmSkip(-15)" class="px-2.5 py-1.5 rounded-lg bg-white/[0.07] hover:bg-white/14 font-mono text-[11px] hover-target cursor-none">↺ 15s</button>
                            <button type="button" onclick="os.vmSkip(15)" class="px-2.5 py-1.5 rounded-lg bg-white/[0.07] hover:bg-white/14 font-mono text-[11px] hover-target cursor-none">15s ↻</button>
                            <select onchange="os.vmSetSpeed(Number(this.value))" class="px-2 py-1.5 rounded-lg bg-white/[0.07] border border-white/10 font-mono text-[11px] text-gray-200 outline-none">
                                <option value="1">1.0×</option>
                                <option value="1.25">1.25×</option>
                                <option value="1.5">1.5×</option>
                                <option value="2">2.0×</option>
                                <option value="0.75">0.75×</option>
                            </select>
                        </div>

                        <!-- Tactile macOS Red Record Button -->
                        <button type="button" id="vm-rec-btn" onclick="os.vmToggleRecord()"
                            class="w-12 h-12 rounded-full p-1 border-2 border-white/80 flex items-center justify-center hover:scale-105 transition hover-target cursor-none" title="Record Microphone">
                            <span id="vm-rec-inner" class="w-full h-full bg-[#ff3b30] rounded-full transition-all"></span>
                        </button>

                        <button type="button" onclick="os.vmDownloadActive()" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/16 text-gray-200 text-xs hover-target cursor-none">Export</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Helper: generate a real playable 2.2s stereo WAV DataURL chord memo so Voice Memos works even without mic hardware
    function synthesizeDemoWavDataUrl() {
        const sr = 22050;
        const dur = 2.2;
        const n = Math.floor(sr * dur);
        const buf = new ArrayBuffer(44 + n * 2);
        const view = new DataView(buf);
        const writeStr = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
        writeStr(0, 'RIFF');
        view.setUint32(4, 36 + n * 2, true);
        writeStr(8, 'WAVEfmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sr, true);
        view.setUint32(28, sr * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeStr(36, 'data');
        view.setUint32(40, n * 2, true);

        const freqs = [261.63, 329.63, 392.0, 493.88]; // Cmaj7 warm chord
        for (let i = 0; i < n; i++) {
            const t = i / sr;
            const env = Math.min(1, t * 14) * Math.exp(-t * 1.15);
            let sample = 0;
            for (let f of freqs) sample += Math.sin(2 * Math.PI * f * t);
            const s16 = Math.max(-1, Math.min(1, (sample / freqs.length) * env * 0.65));
            view.setInt16(44 + i * 2, s16 * 32767, true);
        }
        const bytes = new Uint8Array(buf);
        let bin = '';
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        return 'data:audio/wav;base64,' + btoa(bin);
    }

    // Apply Photo Booth filter on 2D context / pixel buffer
    function drawPbEffectTile(ctx, srcCanvas, effectId, dx, dy, dw, dh) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(dx, dy, dw, dh);
        ctx.clip();

        if (effectId === 'popart') {
            const hw = dw / 2, hh = dh / 2;
            const tints = [
                ['hue-rotate(0deg) saturate(260%) contrast(135%)', dx, dy],
                ['hue-rotate(95deg) saturate(280%) contrast(135%)', dx + hw, dy],
                ['hue-rotate(190deg) saturate(280%) contrast(135%)', dx, dy + hh],
                ['hue-rotate(290deg) saturate(280%) contrast(135%)', dx + hw, dy + hh]
            ];
            tints.forEach(([flt, qx, qy]) => {
                ctx.filter = flt;
                ctx.drawImage(srcCanvas, qx, qy, hw, hh);
            });
        } else if (effectId === 'mirror') {
            ctx.filter = 'none';
            ctx.drawImage(srcCanvas, 0, 0, srcCanvas.width / 2, srcCanvas.height, dx, dy, dw / 2, dh);
            ctx.save();
            ctx.translate(dx + dw, dy);
            ctx.scale(-1, 1);
            ctx.drawImage(srcCanvas, 0, 0, srcCanvas.width / 2, srcCanvas.height, 0, 0, dw / 2, dh);
            ctx.restore();
        } else {
            const filters = {
                normal:  'none',
                thermal: 'invert(100%) hue-rotate(175deg) saturate(320%) contrast(145%)',
                xray:    'invert(100%) grayscale(40%) contrast(140%)',
                noir:    'grayscale(100%) contrast(155%) brightness(95%)',
                sepia:   'sepia(95%) contrast(115%) brightness(102%)',
                neon:    'saturate(280%) hue-rotate(245deg) contrast(135%)',
                emerald: 'grayscale(100%) sepia(100%) hue-rotate(82deg) saturate(320%) contrast(130%)'
            };
            ctx.filter = filters[effectId] || 'none';
            ctx.drawImage(srcCanvas, dx, dy, dw, dh);
        }
        ctx.filter = 'none';
        ctx.restore();
    }

    window.extendOS({
        // ── Photo Booth Methods ──
        pbState: {
            effect: 'normal',
            gridMode: false,
            shotMode: 'single',
            webcamStream: null,
            raf: null,
            offscreen: null,
            photos: [],
            busy: false
        },

        initPhotoBooth: () => {
            if (!os.pbState.offscreen) {
                const c = document.createElement('canvas');
                c.width = 640; c.height = 420;
                os.pbState.offscreen = c;
            }
            os.pbRenderTray();
            os.pbStartLoop();
            const root = document.getElementById('pb-root');
            if (root && window.lucide) lucide.createIcons({ root });
        },

        killPhotoBooth: () => {
            if (os.pbState.raf) { cancelAnimationFrame(os.pbState.raf); os.pbState.raf = null; }
            if (os.pbState.webcamStream) {
                os.pbState.webcamStream.getTracks().forEach((t) => t.stop());
                os.pbState.webcamStream = null;
            }
        },

        pbToggleWebcam: async () => {
            if (os.pbState.webcamStream) {
                os.pbState.webcamStream.getTracks().forEach((t) => t.stop());
                os.pbState.webcamStream = null;
                const st = document.getElementById('pb-cam-status');
                const btn = document.getElementById('pb-cam-btn');
                if (st) st.textContent = 'Live Shader Preview';
                if (btn) btn.innerHTML = `<i data-lucide="camera" class="w-3.5 h-3.5 text-emerald-400"></i><span>Enable Webcam</span>`;
                if (window.lucide) lucide.createIcons();
                return;
            }
            if (!navigator.mediaDevices?.getUserMedia) {
                window.Notifications && window.Notifications.push('PHOTO BOOTH', 'Camera API unavailable in this browser; using Live Shader scene.');
                return;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
                os.pbState.webcamStream = stream;
                const v = document.getElementById('pb-video');
                if (v) { v.srcObject = stream; await v.play().catch(() => {}); }
                const st = document.getElementById('pb-cam-status');
                const btn = document.getElementById('pb-cam-btn');
                if (st) st.textContent = 'FaceTime HD Webcam Active';
                if (btn) btn.innerHTML = `<i data-lucide="video-off" class="w-3.5 h-3.5 text-rose-400"></i><span>Stop Webcam</span>`;
                if (window.lucide) lucide.createIcons();
            } catch (_) {
                window.Notifications && window.Notifications.push('PHOTO BOOTH', 'Camera permission declined — enjoying Live Interactive Shader mode!');
            }
        },

        pbStartLoop: () => {
            if (os.pbState.raf) cancelAnimationFrame(os.pbState.raf);
            const render = (ts) => {
                const canvas = document.getElementById('pb-canvas');
                if (!canvas) return;
                const off = os.pbState.offscreen;
                const octx = off.getContext('2d');
                const video = document.getElementById('pb-video');

                if (os.pbState.webcamStream && video && video.readyState >= 2) {
                    octx.save();
                    octx.translate(off.width, 0);
                    octx.scale(-1, 1); // Mirror natural selfie camera
                    octx.drawImage(video, 0, 0, off.width, off.height);
                    octx.restore();
                } else {
                    // Vivid animated procedural scene so all 9 Photo Booth filters shine immediately!
                    const t = (ts || performance.now()) * 0.0014;
                    const g = octx.createLinearGradient(0, 0, off.width, off.height);
                    g.addColorStop(0, '#0f172a');
                    g.addColorStop(0.5, '#311042');
                    g.addColorStop(1, '#0c4a6e');
                    octx.fillStyle = g;
                    octx.fillRect(0, 0, off.width, off.height);

                    for (let i = 0; i < 4; i++) {
                        const cx = off.width * (0.25 + 0.5 * Math.sin(t + i * 1.6));
                        const cy = off.height * (0.5 + 0.3 * Math.cos(t * 1.3 + i * 2.1));
                        octx.fillStyle = ['#38bdf8', '#f472b6', '#fbbf24', '#34d399'][i] + '88';
                        octx.beginPath();
                        octx.arc(cx, cy, 85 + i * 16, 0, Math.PI * 2);
                        octx.fill();
                    }
                    // Friendly stylized portrait silhouette in center
                    octx.fillStyle = '#f8fafc';
                    octx.beginPath();
                    octx.arc(off.width / 2, off.height * 0.42, 48, 0, Math.PI * 2);
                    octx.fill();
                    octx.beginPath();
                    octx.arc(off.width / 2, off.height * 0.88, 95, Math.PI, 0);
                    octx.fill();
                }

                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                if (os.pbState.gridMode) {
                    const cw = canvas.width / 3;
                    const ch = canvas.height / 3;
                    PB_EFFECTS.forEach((fx, idx) => {
                        const col = idx % 3, row = Math.floor(idx / 3);
                        const x = col * cw, y = row * ch;
                        drawPbEffectTile(ctx, off, fx.id, x + 2, y + 2, cw - 4, ch - 4);
                        ctx.fillStyle = 'rgba(0,0,0,0.58)';
                        ctx.fillRect(x + 8, y + ch - 26, cw - 16, 20);
                        ctx.fillStyle = fx.id === os.pbState.effect ? '#fbbf24' : '#ffffff';
                        ctx.font = '600 11px Inter, system-ui, sans-serif';
                        ctx.fillText(fx.label, x + 16, y + ch - 12);
                    });
                } else {
                    drawPbEffectTile(ctx, off, os.pbState.effect, 0, 0, canvas.width, canvas.height);
                }

                os.pbState.raf = requestAnimationFrame(render);
            };
            os.pbState.raf = requestAnimationFrame(render);
        },

        pbToggleGrid: () => {
            os.pbState.gridMode = !os.pbState.gridMode;
            const btn = document.getElementById('pb-grid-btn');
            if (btn) btn.classList.toggle('bg-[#ff9f0a]', os.pbState.gridMode);
            if (btn) btn.classList.toggle('text-black', os.pbState.gridMode);
        },

        pbCanvasClick: (e) => {
            if (!os.pbState.gridMode) return;
            const canvas = document.getElementById('pb-canvas');
            if (!canvas) return;
            const r = canvas.getBoundingClientRect();
            const col = Math.min(2, Math.max(0, Math.floor(((e.clientX - r.left) / (r.width || 1)) * 3)));
            const row = Math.min(2, Math.max(0, Math.floor(((e.clientY - r.top) / (r.height || 1)) * 3)));
            const picked = PB_EFFECTS[row * 3 + col];
            if (picked) {
                os.pbState.effect = picked.id;
                os.pbState.gridMode = false;
                const btn = document.getElementById('pb-grid-btn');
                if (btn) { btn.classList.remove('bg-[#ff9f0a]', 'text-black'); btn.textContent = `FX: ${picked.label}`; }
            }
        },

        pbSetShotMode: (mode) => {
            os.pbState.shotMode = mode === 'strip' ? 'strip' : 'single';
            document.querySelectorAll('[data-pb-mode]').forEach((b) => {
                b.classList.toggle('active', b.getAttribute('data-pb-mode') === os.pbState.shotMode);
            });
        },

        pbSnapFrame: () => {
            const flash = document.getElementById('pb-flash');
            if (flash) {
                flash.style.opacity = '1';
                setTimeout(() => { flash.style.opacity = '0'; }, 140);
            }
            playShutterSound('shutter');
            const out = document.createElement('canvas');
            out.width = 720; out.height = 460;
            drawPbEffectTile(out.getContext('2d'), os.pbState.offscreen, os.pbState.effect, 0, 0, 720, 460);
            return out;
        },

        pbTriggerCapture: async () => {
            if (os.pbState.busy) return;
            os.pbState.busy = true;
            os.pbState.gridMode = false;

            const useTimer = document.getElementById('pb-timer-chk')?.checked;
            const cdEl = document.getElementById('pb-countdown');
            const waitCount = async () => {
                if (!useTimer || !cdEl) return;
                cdEl.classList.remove('hidden');
                for (let n = 3; n >= 1; n--) {
                    cdEl.textContent = String(n);
                    playShutterSound('beep');
                    await new Promise((r) => setTimeout(r, 550));
                }
                cdEl.classList.add('hidden');
            };

            let dataUrl = '';
            if (os.pbState.shotMode === 'strip') {
                const strip = document.createElement('canvas');
                strip.width = 380; strip.height = 980;
                const sctx = strip.getContext('2d');
                sctx.fillStyle = '#ffffff';
                sctx.fillRect(0, 0, strip.width, strip.height);
                for (let i = 0; i < 4; i++) {
                    await waitCount();
                    const shot = os.pbSnapFrame();
                    sctx.drawImage(shot, 20, 20 + i * 235, 340, 220);
                }
                dataUrl = strip.toDataURL('image/png');
            } else {
                await waitCount();
                dataUrl = os.pbSnapFrame().toDataURL('image/png');
            }

            const item = { id: 'pb-' + Date.now(), dataUrl, effect: os.pbState.effect, time: new Date().toLocaleTimeString() };
            os.pbState.photos.unshift(item);
            if (window.AetherVFS) {
                await AetherVFS.putFile({
                    name: `PhotoBooth-${Date.now()}.png`,
                    mime: 'image/png',
                    kind: 'image',
                    icon: 'aperture',
                    folder: 'User Uploads',
                    dataUrl,
                    imageUrl: dataUrl,
                    content: `Captured in Photo Booth (${os.pbState.effect})`,
                    tags: ['photobooth', os.pbState.effect]
                });
            }
            os.pbRenderTray();
            os.pbState.busy = false;
        },

        pbRenderTray: () => {
            const tray = document.getElementById('pb-strip-tray');
            if (!tray) return;
            if (!os.pbState.photos.length) return;
            tray.innerHTML = os.pbState.photos.map((p) => `
                <div class="relative group shrink-0 h-16 w-24 rounded-lg overflow-hidden border border-white/20 bg-black">
                    <img src="${p.dataUrl}" alt="Snap" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                        <a href="${p.dataUrl}" download="photobooth-${esc(p.id)}.png" class="px-2 py-0.5 rounded bg-white text-black text-[10px] font-semibold hover-target cursor-none">Save</a>
                    </div>
                </div>
            `).join('');
        },

        // ── GaragePad Synth & 16-Step Beat Studio Methods ──
        synthState: {
            patch: 'rhodes',
            octaveOffset: 0,
            cutoff: 3800,
            bpm: 96,
            playing: false,
            step: 0,
            seqTimer: null,
            scopeRaf: null,
            analyser: null,
            grid: DRUM_GROOVES.lofi.map((row) => [...row])
        },

        initSynthStudio: () => {
            os.synthRenderKeys();
            os.synthRenderSequencer();
            os.synthStartScope();
        },

        killSynthStudio: () => {
            if (os.synthState.seqTimer) { clearInterval(os.synthState.seqTimer); os.synthState.seqTimer = null; }
            os.synthState.playing = false;
            if (os.synthState.scopeRaf) { cancelAnimationFrame(os.synthState.scopeRaf); os.synthState.scopeRaf = null; }
        },

        _synthEnsureMaster: () => {
            const ctx = getAudioCtx();
            if (!ctx) return null;
            if (!os.synthState.analyser) {
                const an = ctx.createAnalyser();
                an.fftSize = 256;
                an.connect(ctx.destination);
                os.synthState.analyser = an;
            }
            return { ctx, out: os.synthState.analyser };
        },

        synthPlayNote: (midi) => {
            const m = os._synthEnsureMaster();
            if (!m) return;
            const { ctx, out } = m;
            const patch = SYNTH_PATCHES[os.synthState.patch] || SYNTH_PATCHES.rhodes;
            const freq = 440 * Math.pow(2, (midi + os.synthState.octaveOffset * 12 - 69) / 12);
            const now = ctx.currentTime;

            const o1 = ctx.createOscillator();
            const o2 = ctx.createOscillator();
            const flt = ctx.createBiquadFilter();
            const gain = ctx.createGain();

            o1.type = patch.osc1;
            o2.type = patch.osc2;
            o1.frequency.setValueAtTime(freq, now);
            o2.frequency.setValueAtTime(freq, now);
            o2.detune.setValueAtTime(patch.detune, now);

            flt.type = 'lowpass';
            flt.frequency.setValueAtTime(os.synthState.cutoff, now);

            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.linearRampToValueAtTime(0.18, now + patch.attack);
            gain.gain.exponentialRampToValueAtTime(0.0008, now + patch.attack + patch.release);

            o1.connect(flt); o2.connect(flt);
            flt.connect(gain); gain.connect(out);
            o1.start(now); o2.start(now);
            o1.stop(now + patch.attack + patch.release + 0.04);
            o2.stop(now + patch.attack + patch.release + 0.04);

            const keyEl = document.querySelector(`[data-piano-midi="${midi}"]`);
            if (keyEl) {
                keyEl.classList.add('ring-2', 'ring-sky-400', 'brightness-90');
                setTimeout(() => keyEl.classList.remove('ring-2', 'ring-sky-400', 'brightness-90'), 210);
            }
        },

        synthPlayChordDemo: () => {
            [60, 64, 67, 71, 74].forEach((m, i) => setTimeout(() => os.synthPlayNote(m), i * 55));
        },

        synthShiftOctave: (delta) => {
            os.synthState.octaveOffset = Math.max(-2, Math.min(2, os.synthState.octaveOffset + delta));
            const lbl = document.getElementById('synth-oct-lbl');
            if (lbl) lbl.textContent = `C${4 + os.synthState.octaveOffset}`;
        },

        synthPlayDrum: (row) => {
            const m = os._synthEnsureMaster();
            if (!m) return;
            const { ctx, out } = m;
            const now = ctx.currentTime;
            if (row === 0) {
                // Punchy 808 Kick
                const o = ctx.createOscillator(), g = ctx.createGain();
                o.frequency.setValueAtTime(145, now);
                o.frequency.exponentialRampToValueAtTime(38, now + 0.16);
                g.gain.setValueAtTime(0.45, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
                o.connect(g); g.connect(out);
                o.start(now); o.stop(now + 0.25);
            } else {
                // Snare / Hi-Hat / Clap filtered noise burst
                const dur = row === 2 ? 0.045 : 0.14;
                const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
                const d = buf.getChannelData(0);
                for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.35));
                const src = ctx.createBufferSource();
                const flt = ctx.createBiquadFilter();
                const g = ctx.createGain();
                src.buffer = buf;
                flt.type = row === 2 ? 'highpass' : 'bandpass';
                flt.frequency.value = row === 2 ? 6800 : row === 1 ? 1600 : 2400;
                g.gain.value = row === 2 ? 0.16 : 0.28;
                src.connect(flt); flt.connect(g); g.connect(out);
                src.start(now);
            }
        },

        synthRenderKeys: () => {
            const host = document.getElementById('synth-keys-host');
            if (!host) return;
            const whites = PIANO_NOTES.filter((n) => !n.black);
            let html = whites.map((w) => `
                <button type="button" data-piano-midi="${w.midi}" onmousedown="os.synthPlayNote(${w.midi})"
                    class="flex-1 bg-gradient-to-b from-white to-gray-200 border-r border-gray-300 text-gray-800 flex flex-col items-center justify-end pb-2.5 transition hover:from-sky-50 hover-target cursor-none">
                    <span class="text-[10px] font-bold">${w.note}</span>
                    <span class="text-[9px] font-mono text-gray-400 uppercase">${w.key}</span>
                </button>
            `).join('');

            // Position black keys accurately across white key slots
            let whiteIdx = -1;
            PIANO_NOTES.forEach((n) => {
                if (!n.black) { whiteIdx++; return; }
                const leftPct = ((whiteIdx + 0.68) / whites.length) * 100;
                html += `
                    <button type="button" data-piano-midi="${n.midi}" onmousedown="event.stopPropagation();os.synthPlayNote(${n.midi})"
                        style="left:${leftPct}%;width:${(0.62 / whites.length) * 100}%;height:60%"
                        class="absolute top-0 z-10 rounded-b-lg bg-gradient-to-b from-[#1f2430] to-black border border-white/15 shadow-xl text-[9px] font-mono text-gray-400 flex items-end justify-center pb-2 hover-target cursor-none">
                        ${n.key.toUpperCase()}
                    </button>
                `;
            });
            host.innerHTML = html;
        },

        synthRenderSequencer: () => {
            const host = document.getElementById('synth-seq-grid');
            if (!host) return;
            const labels = ['808 Kick', 'Snare', 'Hi-Hat', 'Clap'];
            const colors = ['bg-amber-400', 'bg-rose-400', 'bg-sky-400', 'bg-emerald-400'];
            host.innerHTML = os.synthState.grid.map((row, rIdx) => `
                <div class="flex items-center gap-1.5">
                    <button type="button" onclick="os.synthPlayDrum(${rIdx})" class="w-16 text-left text-[10.5px] font-mono text-gray-300 hover:text-white shrink-0 hover-target cursor-none">${labels[rIdx]}</button>
                    <div class="flex-1 grid grid-cols-16 gap-1" style="grid-template-columns:repeat(16,minmax(0,1fr))">
                        ${row.map((on, cIdx) => `
                            <button type="button" data-seq-cell="${rIdx}-${cIdx}" onclick="os.synthToggleCell(${rIdx},${cIdx})"
                                class="h-6 rounded-md border transition hover-target cursor-none ${on ? colors[rIdx] + ' border-white/40 shadow' : (cIdx % 4 === 0 ? 'bg-white/[0.08] border-white/10' : 'bg-white/[0.03] border-white/[0.05]')}"></button>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        },

        synthToggleCell: (r, c) => {
            os.synthState.grid[r][c] = os.synthState.grid[r][c] ? 0 : 1;
            os.synthRenderSequencer();
        },

        synthLoadGroove: (name) => {
            if (!DRUM_GROOVES[name]) return;
            os.synthState.grid = DRUM_GROOVES[name].map((r) => [...r]);
            os.synthRenderSequencer();
        },

        synthSetBpm: (bpm) => {
            os.synthState.bpm = bpm;
            const lbl = document.getElementById('synth-bpm-lbl');
            if (lbl) lbl.textContent = `${bpm} BPM`;
            if (os.synthState.playing) {
                os.synthToggleSequencer();
                os.synthToggleSequencer();
            }
        },

        synthToggleSequencer: () => {
            const st = os.synthState;
            const btn = document.getElementById('synth-seq-btn');
            if (st.playing) {
                clearInterval(st.seqTimer);
                st.seqTimer = null;
                st.playing = false;
                if (btn) { btn.textContent = '▶ Play Beat'; btn.className = 'px-4 py-1.5 rounded-full bg-emerald-500 text-black font-bold text-xs hover-target cursor-none'; }
                return;
            }
            st.playing = true;
            if (btn) { btn.textContent = '■ Stop Beat'; btn.className = 'px-4 py-1.5 rounded-full bg-rose-500 text-white font-bold text-xs hover-target cursor-none'; }
            const stepMs = (60 / st.bpm / 4) * 1000;
            st.seqTimer = setInterval(() => {
                const col = st.step % 16;
                for (let r = 0; r < 4; r++) {
                    if (st.grid[r][col]) os.synthPlayDrum(r);
                }
                document.querySelectorAll('[data-seq-cell]').forEach((el) => {
                    el.classList.toggle('ring-1', el.getAttribute('data-seq-cell').endsWith(`-${col}`));
                    el.classList.toggle('ring-white', el.getAttribute('data-seq-cell').endsWith(`-${col}`));
                });
                st.step = (st.step + 1) % 16;
            }, stepMs);
        },

        synthStartScope: () => {
            if (os.synthState.scopeRaf) cancelAnimationFrame(os.synthState.scopeRaf);
            const buf = new Uint8Array(128);
            const draw = () => {
                const c = document.getElementById('synth-scope');
                if (!c) return;
                const ctx = c.getContext('2d');
                ctx.clearRect(0, 0, c.width, c.height);
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                if (os.synthState.analyser) {
                    os.synthState.analyser.getByteTimeDomainData(buf);
                    for (let i = 0; i < buf.length; i++) {
                        const x = (i / (buf.length - 1)) * c.width;
                        const y = (buf[i] / 255) * c.height;
                        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                    }
                } else {
                    ctx.moveTo(0, c.height / 2);
                    ctx.lineTo(c.width, c.height / 2);
                }
                ctx.stroke();
                os.synthState.scopeRaf = requestAnimationFrame(draw);
            };
            os.synthState.scopeRaf = requestAnimationFrame(draw);
        },

        // ── Voice Memos Methods ──
        vmState: {
            memos: [],
            activeId: null,
            recording: false,
            mediaRecorder: null,
            chunks: [],
            recStart: 0,
            waveRaf: null
        },

        initVoiceMemos: () => {
            if (!os.vmState.memos.length) {
                os.vmCreateDemoMemo(true);
            } else {
                os.vmRenderList();
            }
            os.vmDrawStaticWave();
        },

        killVoiceMemos: () => {
            if (os.vmState.recording && os.vmState.mediaRecorder) {
                try { os.vmState.mediaRecorder.stop(); } catch (_) {}
            }
            if (os.vmState.waveRaf) cancelAnimationFrame(os.vmState.waveRaf);
        },

        vmCreateDemoMemo: async (silent = false) => {
            const url = synthesizeDemoWavDataUrl();
            const memo = {
                id: 'vm-' + Date.now(),
                title: `Warm Chord Idea ${os.vmState.memos.length + 1}`,
                date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                duration: '00:02.2',
                dataUrl: url
            };
            os.vmState.memos.unshift(memo);
            os.vmSelectMemo(memo.id);
            if (!silent && window.AetherVFS) {
                await AetherVFS.putFile({
                    name: `${memo.title}.wav`,
                    mime: 'audio/wav',
                    kind: 'audio',
                    icon: 'mic',
                    folder: 'MediaCaptures',
                    dataUrl: url,
                    audioUrl: url,
                    content: 'Voice Memo Audio',
                    tags: ['voicememo']
                });
            }
        },

        vmSelectMemo: (id) => {
            const m = os.vmState.memos.find((x) => x.id === id);
            if (!m) return;
            os.vmState.activeId = id;
            const tEl = document.getElementById('vm-active-title');
            const metaEl = document.getElementById('vm-active-meta');
            const aud = document.getElementById('vm-audio-el');
            const tmr = document.getElementById('vm-timer-lbl');
            if (tEl) tEl.value = m.title;
            if (metaEl) metaEl.textContent = `${m.date} · ${m.duration}`;
            if (aud) aud.src = m.dataUrl;
            if (tmr) tmr.textContent = m.duration;
            os.vmRenderList();
            os.vmDrawStaticWave();
        },

        vmRenameActive: (name) => {
            const m = os.vmState.memos.find((x) => x.id === os.vmState.activeId);
            if (m && name.trim()) {
                m.title = name.trim();
                os.vmRenderList();
            }
        },

        vmRenderList: () => {
            const list = document.getElementById('vm-list');
            if (!list) return;
            list.innerHTML = os.vmState.memos.map((m) => `
                <button type="button" onclick="os.vmSelectMemo('${esc(m.id)}')"
                    class="w-full text-left p-3.5 transition hover-target cursor-none ${m.id === os.vmState.activeId ? 'bg-white/10' : 'hover:bg-white/[0.04]'}">
                    <div class="font-semibold text-white truncate">${esc(m.title)}</div>
                    <div class="flex justify-between text-[10.5px] font-mono text-gray-400 mt-1">
                        <span>${esc(m.date)}</span>
                        <span>${esc(m.duration)}</span>
                    </div>
                </button>
            `).join('');
        },

        vmDrawStaticWave: () => {
            const c = document.getElementById('vm-wave-canvas');
            if (!c) return;
            const ctx = c.getContext('2d');
            ctx.clearRect(0, 0, c.width, c.height);
            const bars = 64;
            const bw = c.width / bars;
            for (let i = 0; i < bars; i++) {
                const h = 10 + Math.abs(Math.sin(i * 0.37) * Math.cos(i * 0.19)) * (c.height * 0.72);
                ctx.fillStyle = i % 3 === 0 ? '#ff453a' : 'rgba(255, 69, 58, 0.55)';
                ctx.fillRect(i * bw + 1, (c.height - h) / 2, Math.max(2, bw - 3), h);
            }
        },

        vmToggleRecord: async () => {
            const st = os.vmState;
            const inner = document.getElementById('vm-rec-inner');
            if (st.recording && st.mediaRecorder) {
                st.mediaRecorder.stop();
                return;
            }
            if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
                await os.vmCreateDemoMemo(false);
                window.Notifications && window.Notifications.push('VOICE MEMOS', 'No mic detected — created synthesized memo!');
                return;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                st.chunks = [];
                st.recording = true;
                st.recStart = performance.now();
                if (inner) inner.className = 'w-5 h-5 bg-[#ff3b30] rounded-sm transition-all';

                const mr = new MediaRecorder(stream);
                st.mediaRecorder = mr;
                mr.ondataavailable = (e) => { if (e.data.size > 0) st.chunks.push(e.data); };
                mr.onstop = () => {
                    stream.getTracks().forEach((t) => t.stop());
                    st.recording = false;
                    if (inner) inner.className = 'w-full h-full bg-[#ff3b30] rounded-full transition-all';
                    const blob = new Blob(st.chunks, { type: mr.mimeType || 'audio/webm' });
                    const reader = new FileReader();
                    reader.onload = async () => {
                        const sec = ((performance.now() - st.recStart) / 1000).toFixed(1);
                        const memo = {
                            id: 'vm-' + Date.now(),
                            title: `Voice Memo ${st.memos.length + 1}`,
                            date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            duration: `00:${String(sec).padStart(4, '0')}`,
                            dataUrl: String(reader.result)
                        };
                        st.memos.unshift(memo);
                        os.vmSelectMemo(memo.id);
                        if (window.AetherVFS) {
                            await AetherVFS.putFile({
                                name: `${memo.title}.webm`,
                                mime: blob.type || 'audio/webm',
                                kind: 'audio',
                                icon: 'mic',
                                folder: 'MediaCaptures',
                                dataUrl: memo.dataUrl,
                                audioUrl: memo.dataUrl,
                                content: 'Recorded Voice Memo',
                                tags: ['voicememo']
                            });
                        }
                    };
                    reader.readAsDataURL(blob);
                };
                mr.start();
            } catch (_) {
                await os.vmCreateDemoMemo(false);
                window.Notifications && window.Notifications.push('VOICE MEMOS', 'Mic permission declined — added demo audio memo!');
            }
        },

        vmSkip: (sec) => {
            const aud = document.getElementById('vm-audio-el');
            if (aud) aud.currentTime = Math.max(0, (aud.currentTime || 0) + sec);
        },

        vmSetSpeed: (rate) => {
            const aud = document.getElementById('vm-audio-el');
            if (aud) aud.playbackRate = rate;
        },

        vmDownloadActive: () => {
            const m = os.vmState.memos.find((x) => x.id === os.vmState.activeId);
            if (!m) return;
            const a = document.createElement('a');
            a.href = m.dataUrl;
            a.download = `${m.title.replace(/\s+/g, '-')}.wav`;
            a.click();
        },

        // ═══════════════════════════════════════════════════════════════════
        //  4. NATIVE macOS SPACEBAR QUICK LOOK MODAL (File Explorer Preview)
        // ═══════════════════════════════════════════════════════════════════
        quickLookOpen: false,

        openQuickLook: (fileId) => {
            const f = (os.fmFindById && os.fmFindById(fileId || os.filemanager?.activeFileId)) ||
                      (window.AetherVFS && AetherVFS.getCachedFile(fileId));
            if (!f || f.kind === 'folder') return;

            let modal = document.getElementById('quicklook-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'quicklook-modal';
                modal.style.cssText = 'position:fixed;inset:0;z-index:9750;display:flex;align-items:center;justify-content:center;background:rgba(4,6,12,0.62);backdrop-filter:blur(18px);';
                modal.onclick = (e) => { if (e.target === modal) os.closeQuickLook(); };
                document.body.appendChild(modal);
            }

            const bodyHtml = f.imageUrl
                ? `<img src="${esc(f.imageUrl)}" alt="${esc(f.name)}" class="max-h-[62vh] max-w-full object-contain rounded-xl mx-auto shadow-2xl">`
                : f.audioUrl
                ? `<div class="py-12 px-8 flex flex-col items-center gap-4"><i data-lucide="music" class="w-14 h-14 text-sky-400"></i><audio controls autoplay src="${esc(f.audioUrl)}" class="w-80"></audio></div>`
                : `<pre class="max-h-[58vh] overflow-auto p-4 rounded-xl bg-black/70 border border-white/10 font-mono text-xs text-gray-200 whitespace-pre-wrap select-text">${esc(f.content || f.summary || 'No text preview available.')}</pre>`;

            modal.style.display = 'flex';
            modal.innerHTML = `
                <div class="w-[min(760px,92vw)] rounded-2xl bg-[#141722]/95 border border-white/20 shadow-[0_32px_90px_rgba(0,0,0,0.8)] overflow-hidden text-white select-none">
                    <div class="px-4 py-2.5 bg-white/[0.05] border-b border-white/10 flex items-center justify-between">
                        <div class="flex items-center gap-2 min-w-0">
                            <button type="button" onclick="os.closeQuickLook()" class="w-3 h-3 rounded-full bg-[#ff5f57] hover-target cursor-none" title="Close (Space / Esc)"></button>
                            <span class="font-semibold text-xs truncate ml-1">${esc(f.name)}</span>
                            <span class="text-[10px] font-mono text-gray-400">${esc(f.size || f.kind || '')}</span>
                        </div>
                        <span class="text-[10px] font-mono text-gray-400">Press Space to close</span>
                    </div>
                    <div class="p-5">${bodyHtml}</div>
                </div>
            `;
            os.quickLookOpen = true;
            if (window.lucide) lucide.createIcons({ root: modal });
        },

        closeQuickLook: () => {
            const modal = document.getElementById('quicklook-modal');
            if (modal) {
                modal.querySelectorAll('audio,video').forEach((m) => m.pause && m.pause());
                modal.style.display = 'none';
            }
            os.quickLookOpen = false;
        }
    });

    // Global keyboard bindings for GaragePad Piano + File Explorer Spacebar Quick Look
    const KEY_TO_MIDI = {};
    PIANO_NOTES.forEach((n) => { KEY_TO_MIDI[n.key] = n.midi; });

    document.addEventListener('keydown', (e) => {
        if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
        const tag = (e.target?.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) return;

        // Spacebar Quick Look toggle when File Explorer is frontmost (or Quick Look is already open)
        if (e.key === ' ' && window.os) {
            if (os.quickLookOpen) {
                e.preventDefault();
                os.closeQuickLook();
                return;
            }
            const topWin = Object.values(window.SystemState?.windows || {})
                .filter((w) => w && w.isOpen && !w.isMinimized)
                .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))[0];
            if (topWin && topWin.id === 'filemanager' && os.filemanager?.activeFileId) {
                e.preventDefault();
                os.openQuickLook(os.filemanager.activeFileId);
                return;
            }
            if (topWin && topWin.id === 'synthstudio') {
                e.preventDefault();
                os.synthToggleSequencer();
                return;
            }
        }

        if (e.key === 'Escape' && window.os?.quickLookOpen) {
            os.closeQuickLook();
            return;
        }

        // Musical typing when GaragePad Studio is active
        const topWin = Object.values(window.SystemState?.windows || {})
            .filter((w) => w && w.isOpen && !w.isMinimized)
            .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))[0];
        if (topWin && topWin.id === 'synthstudio') {
            const midi = KEY_TO_MIDI[e.key.toLowerCase()];
            if (midi) {
                e.preventDefault();
                os.synthPlayNote(midi);
            }
        }
    });
})();
