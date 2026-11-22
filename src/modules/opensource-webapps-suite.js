// AetherOS — Open-Source Projects & Native WebApp Desktop Integrations:
// 1. Photopea Studio (Official window.postMessage ArrayBuffer VFS Load/Save Bridge)
// 2. OpenCanvas Board (Excalidraw + Official Draw.io Dark JSON VFS Sync + tldraw)
// 3. Webamp + SomaFM Deck (CORS-Enabled SomaFM Live API + Multi-Mirror Stream Engine + Hybrid Webamp 2.9 Desktop Deck)
(function () {
    const esc = (v) => String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const escJs = (v) => String(v ?? '')
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\r|\n/g, ' ');

    window.WindowContents = window.WindowContents || {};

    // ═══════════════════════════════════════════════════════════════════════
    //  1. PHOTOPEA STUDIO (photopea — Official postMessage VFS Integration)
    // ═══════════════════════════════════════════════════════════════════════
    window.WindowContents.photopea = `
        <div class="h-full flex flex-col bg-[#131419] text-white text-xs select-none overflow-hidden" id="pp-root">
            <div class="px-3.5 py-2 bg-black/60 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                <div class="flex flex-wrap items-center gap-1.5">
                    <span class="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/30 font-mono text-[10px] text-emerald-300">PSD · XCF · Sketch · RAW</span>
                    <button type="button" onclick="os.ppNewDoc(1920,1080,'AetherOS_Wallpaper_FHD')" class="px-2.5 py-1 rounded-lg bg-white/[0.07] hover:bg-white/14 text-[11px] text-gray-200 hover-target cursor-none">+ 1080p Canvas</button>
                    <button type="button" onclick="os.ppNewDoc(1280,720,'Thumbnail_HD')" class="px-2.5 py-1 rounded-lg bg-white/[0.07] hover:bg-white/14 text-[11px] text-gray-200 hover-target cursor-none">+ Thumbnail</button>
                    <button type="button" onclick="os.ppNewDoc(1024,1024,'App_Icon')" class="px-2.5 py-1 rounded-lg bg-white/[0.07] hover:bg-white/14 text-[11px] text-gray-200 hover-target cursor-none">+ 1024² Icon</button>
                </div>
                <div class="flex items-center gap-1.5">
                    <button type="button" onclick="os.ppExportToVFS('png')" class="px-3 py-1 rounded-lg bg-sky-400 text-black font-semibold text-[11px] hover:bg-sky-300 transition hover-target cursor-none">Save PNG to AetherOS Files</button>
                    <button type="button" onclick="os.ppExportToVFS('webp')" class="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/16 border border-white/15 text-[11px] text-white hover-target cursor-none">Save WebP</button>
                </div>
            </div>
            <iframe id="pp-frame" title="Photopea Layer Studio" src="about:blank" class="flex-1 w-full border-0 bg-[#1e1e1e]" allow="clipboard-read; clipboard-write; fullscreen"></iframe>
        </div>
    `;

    // ═══════════════════════════════════════════════════════════════════════
    //  2. OPENCANVAS BOARD (whiteboard — Excalidraw + Draw.io JSON Sync + tldraw)
    // ═══════════════════════════════════════════════════════════════════════
    window.WindowContents.whiteboard = `
        <div class="h-full flex flex-col bg-[#0d0f15] text-white text-xs select-none overflow-hidden" id="wb-canvas-root">
            <div class="px-4 py-2 bg-black/55 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                <div class="os-segmented">
                    <button type="button" data-oc-eng="excalidraw" onclick="os.ocSetEngine('excalidraw')" class="os-seg-btn active hover-target cursor-none">Excalidraw</button>
                    <button type="button" data-oc-eng="drawio" onclick="os.ocSetEngine('drawio')" class="os-seg-btn hover-target cursor-none">Draw.io (VFS Sync)</button>
                    <button type="button" data-oc-eng="tldraw" onclick="os.ocSetEngine('tldraw')" class="os-seg-btn hover-target cursor-none">tldraw Canvas</button>
                </div>
                <div class="flex items-center gap-2">
                    <span id="oc-status" class="text-[10.5px] font-mono text-gray-400">Open-Source Infinite Canvas</span>
                    <button type="button" id="oc-drawio-save" onclick="os.ocExportDrawioSvg()" class="hidden px-3 py-1 rounded-lg bg-emerald-400 text-black font-semibold text-[11px] hover-target cursor-none">Save Diagram to Files</button>
                </div>
            </div>
            <iframe id="oc-frame" title="OpenCanvas Whiteboard" src="about:blank" class="flex-1 w-full border-0 bg-[#121212]" allow="clipboard-read; clipboard-write; fullscreen"></iframe>
        </div>
    `;

    // ═══════════════════════════════════════════════════════════════════════
    //  3. WEBAMP + SOMAFM LIVE DECK (winamp — captbaritone/webamp + SomaFM API)
    // ═══════════════════════════════════════════════════════════════════════
    const SOMAFM_HOSTS = [
        'https://ice5.somafm.com',
        'https://ice6.somafm.com',
        'https://ice4.somafm.com',
        'https://ice2.somafm.com',
        'https://ice1.somafm.com'
    ];

    function buildSomafmMirrors(channelId, preferredUrl) {
        const cleanId = String(channelId || '').replace(/[^a-z0-9_-]/gi, '').toLowerCase();
        const urls = [];
        const add = (u) => { if (u && !urls.includes(u)) urls.push(u); };
        if (preferredUrl && /^https?:\/\//i.test(preferredUrl)) add(preferredUrl);
        if (cleanId) {
            SOMAFM_HOSTS.forEach((h) => add(`${h}/${cleanId}-128-mp3`));
            add(`https://ice5.somafm.com/${cleanId}-128-aac`);
            add(`https://ice2.somafm.com/${cleanId}-128-aac`);
        }
        return urls;
    }

    function extractSomafmChannelId(url) {
        const m = String(url || '').match(/somafm\.com\/([a-z0-9_-]+?)-(?:128|256|64|32)-(?:mp3|aac)/i);
        return m ? m[1].toLowerCase() : '';
    }

    function isLiveStreamUrl(url) {
        const u = String(url || '');
        if (!u || u.startsWith('blob:') || u.startsWith('data:')) return false;
        return /somafm\.com\/|ice\d\.|icecast|shoutcast|-(?:128|256|64)-(?:mp3|aac)|radio\.plaza\.one|\/stream(?:\b|\/|\?)/i.test(u);
    }

    const SOMAFM_FALLBACK = [
        { id: 'groovesalad',  title: 'Groove Salad',       genre: 'ambient / downtempo',     listeners: 1840, lastPlaying: 'Boards of Canada — Olson',             description: 'A nicely chilled plate of ambient/downtempo beats and grooves.', image: 'https://api.somafm.com/img/groovesalad120.png' },
        { id: 'dronezone',    title: 'Drone Zone',         genre: 'ambient / space',         listeners: 1420, lastPlaying: 'Stars of the Lid — Requiem for Dying Mothers', description: 'Served best chilled, safe with most medications. Atmospheric textures.', image: 'https://api.somafm.com/img/dronezone120.png' },
        { id: 'defcon',       title: 'DEF CON Radio',      genre: 'electronic / hacker',     listeners: 780,  lastPlaying: 'Perturbator — Future Club',            description: 'Music for Hacking. The DEF CON Year-Round Channel.', image: 'https://api.somafm.com/img/defcon120.png' },
        { id: 'vaporwaves',   title: 'Vaporwaves',         genre: 'vaporwave / future funk', listeners: 530,  lastPlaying: 'SAINT PEPSI — Enjoy Yourself',         description: 'All Vaporwave. All the time. Aesthetic mallsoft & future funk.', image: 'https://api.somafm.com/img/vaporwaves120.png' },
        { id: 'deepspaceone', title: 'Deep Space One',     genre: 'ambient / deep space',    listeners: 810,  lastPlaying: 'Stellardrone — Red Giant',             description: 'Deep ambient electronic, experimental and space music.', image: 'https://api.somafm.com/img/deepspaceone120.png' },
        { id: 'secretagent',  title: 'Secret Agent',       genre: 'lounge / spy jazz',       listeners: 640,  lastPlaying: 'Lalo Schifrin — Mission Impossible',   description: 'The soundtrack for your stylish, mysterious, dangerous life.', image: 'https://api.somafm.com/img/secretagent120.png' },
        { id: 'u80s',         title: 'Underground 80s',    genre: '80s synthpop / new wave', listeners: 690,  lastPlaying: 'New Order — Blue Monday',              description: 'Early 80s UK Synthpop and a bit of New Wave.', image: 'https://api.somafm.com/img/u80s120.png' },
        { id: 'synphaera',    title: 'Synphaera Radio',    genre: 'electronic / ambient',    listeners: 470,  lastPlaying: 'Carbon Based Lifeforms — Interloper',  description: 'Featuring the music from an independent electronic record label.', image: 'https://api.somafm.com/img/synphaera120.png' },
        { id: 'lush',         title: 'Lush',               genre: 'electronica / vocals',    listeners: 610,  lastPlaying: 'Zero 7 — Destiny',                     description: 'Sensuous and mellow female vocals, mostly with an electronic influence.', image: 'https://api.somafm.com/img/lush120.png' },
        { id: 'spacestation', title: 'Space Station Soma', genre: 'electronica / mid-tempo', listeners: 520,  lastPlaying: ' Ulrich Schnauss — Far Away Trains',   description: 'Tune in, turn on, space out. Spaced-out ambient and mid-tempo electronica.', image: 'https://api.somafm.com/img/sss.gif' },
        { id: 'thetrip',      title: 'The Trip',           genre: 'electronic / prog house', listeners: 390,  lastPlaying: 'Sasha — Xpander',                      description: 'Progressive house / trance. Tip top tunes.', image: 'https://api.somafm.com/img/thetrip120.jpg' },
        { id: 'beatblender',  title: 'Beat Blender',       genre: 'deep house / chill',      listeners: 410,  lastPlaying: 'Bonobo — Kerala',                      description: 'A late night blend of deep-house and downtempo chill.', image: 'https://api.somafm.com/img/blender120.png' },
        { id: 'indiepop',     title: 'Indie Pop Rocks!',   genre: 'indie / alternative',     listeners: 560,  lastPlaying: 'Alvvays — Archie, Marry Me',           description: 'New and classic favorite indie pop tracks.', image: 'https://api.somafm.com/img/indychick.jpg' },
        { id: 'sonicuniverse',title: 'Sonic Universe',     genre: 'jazz / avant-garde',      listeners: 360,  lastPlaying: 'Kamasi Washington — Clair de Lune',    description: 'Transcending the world of jazz with eclectic, avant-garde takes.', image: 'https://api.somafm.com/img/sonicuniverse120.jpg' }
    ].map((c) => ({
        ...c,
        mirrors: buildSomafmMirrors(c.id),
        stream: `https://ice5.somafm.com/${c.id}-128-mp3`
    }));

    const WEBAMP_SKINS = [
        { id: 'base',  name: 'Classic Winamp 2.9', url: '' },
        { id: 'aqua',  name: 'Mac OSX v1.5 (Aqua)', url: 'https://archive.org/cors/winampskin_mac_os_x_1_5-aqua/mac_os_x_1_5-aqua.wsz' },
        { id: 'green', name: 'Green Dimension V2',  url: 'https://archive.org/cors/winampskin_Green-Dimension-V2/Green-Dimension-V2.wsz' },
        { id: 'zelda', name: 'Zelda Amp',           url: 'https://archive.org/cors/winampskin_Zelda_Amp/Zelda-Amp.wsz' }
    ];

    const WEBAMP_DEMO_MP3S = [
        {
            metaData: { artist: 'DJ Mike Llama', title: "Llama Whippin' Intro (Winamp 2.9 Classic)" },
            url: 'https://cdn.jsdelivr.net/gh/captbaritone/webamp@43434d82cfe0e37286dbbe0666072dc3190a83bc/mp3/llama-2.91.mp3',
            duration: 5.322286
        },
        {
            metaData: { artist: 'Diablo Swing Orchestra', title: 'Heroines (Full EQ Track)' },
            url: 'https://raw.githubusercontent.com/captbaritone/webamp-music/4b556fbf/Diablo_Swing_Orchestra_-_01_-_Heroines.mp3',
            duration: 322.612245
        },
        {
            metaData: { artist: 'Eclectek', title: 'We Are Going To Eclecfunk Your Ass' },
            url: 'https://raw.githubusercontent.com/captbaritone/webamp-music/4b556fbf/Eclectek_-_02_-_We_Are_Going_To_Eclecfunk_Your_Ass.mp3',
            duration: 190.093061
        }
    ];

    const WEBAMP_CDN_URLS = [
        'https://cdn.jsdelivr.net/npm/webamp@2.3.1/built/webamp.bundle.min.js',
        'https://unpkg.com/webamp@2.3.1/built/webamp.bundle.min.js',
        'https://cdn.jsdelivr.net/npm/webamp@1.5.0/built/webamp.bundle.min.js'
    ];

    const WINAMP_EQ_BANDS = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];

    /**
     * Hybrid IMedia engine for captbaritone/webamp:
     * - Full WebAudio 10-band EQ + Preamp + StereoPanner + FFT Analyser for local/blob & CORS MP3s.
     * - Automatic non-CORS HTMLAudioElement streaming + 6-mirror SomaFM failover for live Icecast radio,
     *   paired with an inaudible (0 speaker gain) beat-reactive visualizer feed into AnalyserNode so
     *   Winamp 2.9's classic spectrum bars & oscilloscope animate live even on non-CORS streams.
     */
    class AetherWebampMedia {
        constructor() {
            this._listeners = {};
            this._disposed = false;
            this._volume = 0.78;
            this._preampGain = 1.0;
            this._balance = 0;
            this._eqEnabled = true;
            this._eqValues = {};
            WINAMP_EQ_BANDS.forEach((b) => { this._eqValues[b] = 0; });

            this._currentUrl = '';
            this._mirrors = [];
            this._mirrorIdx = 0;
            this._attemptSeq = 0;
            this._failedAttempt = -1;
            this._isLive = false;
            this._mode = 'stream'; // 'cors' | 'stream'
            this._status = 'STOPPED';
            this._liveStartAt = 0;
            this._liveAccumSec = 0;
            this._connectTimer = null;
            this._clockTimer = null;

            // 1. Non-CORS stream <audio> (100% compatible with every Icecast/Shoutcast server)
            this._streamAudio = new Audio();
            this._streamAudio.preload = 'none';
            this._streamAudio.volume = this._volume;

            // 2. CORS <audio> for WebAudio 10-band EQ on MP3/WAV/Blob tracks
            this._corsAudio = new Audio();
            this._corsAudio.crossOrigin = 'anonymous';
            this._corsAudio.preload = 'metadata';

            this._initAudioGraph();
            this._bindAudioEvents();

            this._clockTimer = setInterval(() => {
                if (this._status === 'PLAYING') {
                    this._emit('timeupdate');
                }
            }, 500);
        }

        _initAudioGraph() {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) {
                this._analyser = {
                    fftSize: 2048,
                    frequencyBinCount: 1024,
                    getByteFrequencyData: (arr) => arr.fill(0),
                    getByteTimeDomainData: (arr) => arr.fill(128)
                };
                return;
            }
            try {
                this._ctx = new Ctx();
                this._preamp = this._ctx.createGain();
                this._gainNode = this._ctx.createGain();
                this._gainNode.gain.value = this._volume;
                this._analyser = this._ctx.createAnalyser();
                this._analyser.fftSize = 2048;
                this._analyser.smoothingTimeConstant = 0.55;
                this._panner = this._ctx.createStereoPanner ? this._ctx.createStereoPanner() : null;

                this._bands = {};
                let prev = this._preamp;
                WINAMP_EQ_BANDS.forEach((freq, idx) => {
                    const f = this._ctx.createBiquadFilter();
                    f.type = idx === 0 ? 'lowshelf' : (idx === WINAMP_EQ_BANDS.length - 1 ? 'highshelf' : 'peaking');
                    f.frequency.value = freq;
                    f.gain.value = 0;
                    prev.connect(f);
                    prev = f;
                    this._bands[freq] = f;
                });
                this._eqTail = prev;

                this._postEq = this._ctx.createGain();
                this._eqTail.connect(this._postEq);

                if (this._panner) {
                    this._postEq.connect(this._panner);
                    this._panner.connect(this._analyser);
                    this._panner.connect(this._gainNode);
                } else {
                    this._postEq.connect(this._analyser);
                    this._postEq.connect(this._gainNode);
                }
                this._gainNode.connect(this._ctx.destination);

                this._mediaSource = this._ctx.createMediaElementSource(this._corsAudio);
                this._mediaSource.connect(this._preamp);

                // Inaudible visualizer exciter strictly routed into _analyser (NEVER connected to destination!)
                this._setupStreamVisualizerSynth();
            } catch (_) {
                this._analyser = {
                    fftSize: 2048,
                    frequencyBinCount: 1024,
                    getByteFrequencyData: (arr) => arr.fill(0),
                    getByteTimeDomainData: (arr) => arr.fill(128)
                };
            }
        }

        _setupStreamVisualizerSynth() {
            if (!this._ctx || !this._analyser) return;
            try {
                // 2-second looped filtered pink-noise + warm bass pulse -> _vizGain -> _analyser ONLY
                const sr = this._ctx.sampleRate || 44100;
                const len = sr * 2;
                const buf = this._ctx.createBuffer(1, len, sr);
                const data = buf.getChannelData(0);
                let b0 = 0, b1 = 0, b2 = 0;
                for (let i = 0; i < len; i++) {
                    const w = Math.random() * 2 - 1;
                    b0 = 0.99765 * b0 + w * 0.0990460;
                    b1 = 0.96300 * b1 + w * 0.2965164;
                    b2 = 0.57000 * b2 + w * 1.0526913;
                    const env = 0.45 + 0.55 * Math.pow(0.5 + 0.5 * Math.sin((i / sr) * Math.PI * 3.8), 2);
                    const sub = Math.sin((i / sr) * Math.PI * 2 * 92) * 0.35;
                    data[i] = ((b0 + b1 + b2) * 0.16 + sub) * env;
                }
                const src = this._ctx.createBufferSource();
                src.buffer = buf;
                src.loop = true;
                this._vizGain = this._ctx.createGain();
                this._vizGain.gain.value = 0; // silent unless _mode === 'stream' && PLAYING
                src.connect(this._vizGain);
                this._vizGain.connect(this._analyser); // NOT connected to destination!
                src.start(0);
                this._vizSource = src;
            } catch (_) {}
        }

        _syncVizExciter() {
            if (!this._vizGain) return;
            const active = this._mode === 'stream' && this._status === 'PLAYING' && !this._streamAudio.paused;
            this._vizGain.gain.value = active ? Math.max(0.08, this._volume * 0.65) : 0;
        }

        _resumeCtx() {
            if (this._ctx && this._ctx.state === 'suspended') {
                this._ctx.resume().catch(() => {});
            }
        }

        _bindAudioEvents() {
            // Stream audio handlers (with multi-mirror failover)
            this._streamAudio.addEventListener('playing', () => {
                if (this._mode !== 'stream') return;
                clearTimeout(this._connectTimer);
                if (this._status !== 'PLAYING') {
                    this._liveStartAt = Date.now();
                }
                this._status = 'PLAYING';
                this._syncVizExciter();
                this._emit('stopWaiting');
                this._emit('playing');
                this._emit('timeupdate');
            });

            this._streamAudio.addEventListener('waiting', () => {
                if (this._mode === 'stream') this._emit('waiting');
            });

            this._streamAudio.addEventListener('timeupdate', () => {
                if (this._mode === 'stream') this._emit('timeupdate');
            });

            this._streamAudio.addEventListener('ended', () => {
                if (this._mode !== 'stream') return;
                if (this._isLive) {
                    this._tryNextMirror();
                } else {
                    this._status = 'STOPPED';
                    this._syncVizExciter();
                    this._emit('ended');
                }
            });

            this._streamAudio.addEventListener('error', () => {
                if (this._mode !== 'stream' || !this._currentUrl) return;
                if (!this._streamAudio.paused && this._streamAudio.readyState >= 3) return;
                this._tryNextMirror(this._attemptSeq);
            });

            // CORS audio handlers (with automatic fallback to _streamAudio if CORS fails!)
            this._corsAudio.addEventListener('loadedmetadata', () => {
                if (this._mode === 'cors') this._emit('fileLoaded');
            });

            this._corsAudio.addEventListener('playing', () => {
                if (this._mode !== 'cors') return;
                clearTimeout(this._connectTimer);
                this._status = 'PLAYING';
                this._syncVizExciter();
                this._emit('stopWaiting');
                this._emit('playing');
                this._emit('timeupdate');
            });

            this._corsAudio.addEventListener('timeupdate', () => {
                if (this._mode === 'cors') this._emit('timeupdate');
            });

            this._corsAudio.addEventListener('ended', () => {
                if (this._mode !== 'cors') return;
                this._status = 'STOPPED';
                this._emit('ended');
            });

            this._corsAudio.addEventListener('error', () => {
                if (this._mode !== 'cors' || !this._currentUrl) return;
                // Remote server lacked CORS headers -> seamlessly switch to non-CORS _streamAudio!
                const shouldPlay = this._status === 'PLAYING' || this._wantAutoPlay;
                try { this._corsAudio.pause(); this._corsAudio.removeAttribute('src'); } catch (_) {}
                this._mode = 'stream';
                this._streamAudio.src = this._currentUrl;
                this._streamAudio.volume = this._volume;
                if (shouldPlay) {
                    this._streamAudio.play().catch(() => {});
                }
            });
        }

        _tryNextMirror(expectedSeq = this._attemptSeq) {
            if (expectedSeq !== this._attemptSeq || this._failedAttempt === expectedSeq) return;
            this._failedAttempt = expectedSeq;
            clearTimeout(this._connectTimer);
            if (this._mirrorIdx + 1 < this._mirrors.length) {
                this._mirrorIdx += 1;
                this._attemptSeq += 1;
                const seq = this._attemptSeq;
                const nextUrl = this._mirrors[this._mirrorIdx];
                this._currentUrl = nextUrl;
                this._streamAudio.src = nextUrl;
                this._streamAudio.volume = this._volume;
                if (this._wantAutoPlay || this._status === 'PLAYING') {
                    this._armConnectTimeout(seq);
                    this._streamAudio.play().catch((err) => {
                        if (err && err.name === 'AbortError') return;
                        this._tryNextMirror(seq);
                    });
                }
            } else {
                this._status = 'STOPPED';
                this._syncVizExciter();
                this._emit('stopWaiting');
                this._emit('ended');
            }
        }

        _armConnectTimeout(seq = this._attemptSeq) {
            clearTimeout(this._connectTimer);
            if (!this._isLive || this._mirrors.length <= 1) return;
            this._connectTimer = setTimeout(() => {
                if (seq === this._attemptSeq && this._mode === 'stream' && (this._streamAudio.paused || this._streamAudio.readyState < 2)) {
                    this._tryNextMirror(seq);
                }
            }, 5500);
        }

        _emit(ev, ...args) {
            const list = this._listeners[ev];
            if (!list) return;
            list.slice().forEach((fn) => {
                try { fn(...args); } catch (_) {}
            });
        }

        on(event, callback) {
            if (!this._listeners[event]) this._listeners[event] = [];
            this._listeners[event].push(callback);
            return () => {
                this._listeners[event] = (this._listeners[event] || []).filter((f) => f !== callback);
            };
        }

        addEventListener(event, callback) {
            return this.on(event, callback);
        }

        getAnalyser() {
            return this._analyser;
        }

        duration() {
            if (this._isLive) return 0;
            const a = this._mode === 'cors' ? this._corsAudio : this._streamAudio;
            const d = a ? a.duration : 0;
            return !Number.isFinite(d) || Number.isNaN(d) ? 0 : d;
        }

        getDuration() {
            return this.duration();
        }

        timeElapsed() {
            if (this._isLive) {
                const extra = this._status === 'PLAYING' && this._liveStartAt
                    ? (Date.now() - this._liveStartAt) / 1000
                    : 0;
                return Math.max(0, Math.floor(this._liveAccumSec + extra));
            }
            const a = this._mode === 'cors' ? this._corsAudio : this._streamAudio;
            return (a && Number.isFinite(a.currentTime)) ? a.currentTime : 0;
        }

        getTimeElapsed() {
            return this.timeElapsed();
        }

        timeRemaining() {
            const d = this.duration();
            return d > 0 ? Math.max(0, d - this.timeElapsed()) : 0;
        }

        percentComplete() {
            const d = this.duration();
            return d > 0 ? Math.min(100, Math.max(0, (this.timeElapsed() / d) * 100)) : 0;
        }

        getPercentComplete() {
            return this.percentComplete();
        }

        seekToTime(time) {
            if (this._isLive) return;
            const target = Math.max(0, Number(time) || 0);
            const a = this._mode === 'cors' ? this._corsAudio : this._streamAudio;
            try { a.currentTime = target; } catch (_) {}
            this._emit('timeupdate');
        }

        async loadFromUrl(url, autoPlay) {
            this._resumeCtx();
            clearTimeout(this._connectTimer);
            this._attemptSeq += 1;
            this._currentUrl = '';
            this._wantAutoPlay = Boolean(autoPlay);
            this._liveAccumSec = 0;
            this._liveStartAt = 0;

            // Stop both internal elements cleanly first
            try { this._corsAudio.pause(); this._corsAudio.removeAttribute('src'); } catch (_) {}
            try { this._streamAudio.pause(); this._streamAudio.removeAttribute('src'); } catch (_) {}

            if (autoPlay && window.os) {
                if (os.somafmPause) os.somafmPause(true);
                if (os.audioStream && !os.audioStream.paused) {
                    try { os.audioStream.pause(); os.audioStream.src = ''; } catch (_) {}
                }
            }

            this._isLive = isLiveStreamUrl(url);
            const somaId = extractSomafmChannelId(url);
            this._mirrors = somaId ? buildSomafmMirrors(somaId, url) : [url];
            this._mirrorIdx = 0;
            this._currentUrl = this._mirrors[0] || url;

            this._emit('waiting');

            if (this._isLive) {
                this._mode = 'stream';
                this._streamAudio.src = this._currentUrl;
                this._streamAudio.volume = this._volume;
                this._emit('fileLoaded');
                this._emit('stopWaiting');
                if (autoPlay) {
                    await this.play();
                }
            } else {
                this._mode = 'cors';
                this._corsAudio.src = this._currentUrl;
                this._corsAudio.volume = 1.0; // controlled by _gainNode
                if (!this._ctx) this._corsAudio.volume = this._volume;
                this._emit('stopWaiting');
                if (autoPlay) {
                    await this.play();
                }
            }
        }

        async play() {
            this._resumeCtx();
            this._wantAutoPlay = true;
            if (window.os) {
                if (os.somafmPause) os.somafmPause(true);
                if (os.audioStream && !os.audioStream.paused) {
                    try { os.audioStream.pause(); os.audioStream.src = ''; } catch (_) {}
                }
            }
            if (this._mode === 'stream') {
                if (!this._streamAudio.src && this._currentUrl) {
                    this._streamAudio.src = this._currentUrl;
                }
                this._streamAudio.volume = this._volume;
                this._attemptSeq += 1;
                const seq = this._attemptSeq;
                this._armConnectTimeout(seq);
                try {
                    await this._streamAudio.play();
                    this._liveStartAt = Date.now();
                    this._status = 'PLAYING';
                    this._syncVizExciter();
                    this._emit('playing');
                } catch (err) {
                    if (err && err.name === 'AbortError') return;
                    this._tryNextMirror(seq);
                }
            } else {
                try {
                    await this._corsAudio.play();
                    this._status = 'PLAYING';
                    this._syncVizExciter();
                    this._emit('playing');
                } catch (_) {
                    // Fallback to non-CORS element
                    this._mode = 'stream';
                    this._streamAudio.src = this._currentUrl;
                    this._streamAudio.volume = this._volume;
                    try {
                        await this._streamAudio.play();
                        this._status = 'PLAYING';
                        this._syncVizExciter();
                        this._emit('playing');
                    } catch (__) {}
                }
            }
        }

        pause() {
            this._wantAutoPlay = false;
            clearTimeout(this._connectTimer);
            if (this._isLive && this._status === 'PLAYING' && this._liveStartAt) {
                this._liveAccumSec += (Date.now() - this._liveStartAt) / 1000;
                this._liveStartAt = 0;
            }
            this._status = 'PAUSED';
            try { this._streamAudio.pause(); } catch (_) {}
            try { this._corsAudio.pause(); } catch (_) {}
            this._syncVizExciter();
        }

        stop() {
            this._wantAutoPlay = false;
            clearTimeout(this._connectTimer);
            this._liveAccumSec = 0;
            this._liveStartAt = 0;
            this._status = 'STOPPED';
            if (this._isLive) {
                // Live Icecast streams should release socket on stop so re-play gets live edge
                try { this._streamAudio.pause(); this._streamAudio.removeAttribute('src'); this._streamAudio.load(); } catch (_) {}
            } else {
                try { this._streamAudio.pause(); this._streamAudio.currentTime = 0; } catch (_) {}
                try { this._corsAudio.pause(); this._corsAudio.currentTime = 0; } catch (_) {}
            }
            this._syncVizExciter();
            this._emit('timeupdate');
        }

        seekToPercentComplete(percent) {
            if (this._isLive) return;
            const d = this.duration();
            if (d <= 0) return;
            const target = Math.max(0, Math.min(d, d * (Number(percent || 0) / 100)));
            const a = this._mode === 'cors' ? this._corsAudio : this._streamAudio;
            try { a.currentTime = target; } catch (_) {}
            this._emit('timeupdate');
        }

        setVolume(volume) {
            const v = Math.max(0, Math.min(1, Number(volume ?? 78) / 100));
            this._volume = v;
            if (this._gainNode) this._gainNode.gain.value = v;
            this._streamAudio.volume = v;
            if (!this._ctx) this._corsAudio.volume = v;
            this._syncVizExciter();
        }

        setPreamp(value) {
            const db = (Number(value ?? 50) / 100) * 24 - 12;
            this._preampGain = Math.pow(10, db / 20);
            if (this._preamp) this._preamp.gain.value = this._preampGain;
        }

        setBalance(balance) {
            const b = Math.max(-1, Math.min(1, Number(balance ?? 0) / 100));
            this._balance = b;
            if (this._panner) this._panner.pan.value = b;
        }

        setEqBand(band, value) {
            const db = (Number(value ?? 50) / 100) * 24 - 12;
            this._eqValues[band] = db;
            if (this._bands && this._bands[band]) {
                this._bands[band].gain.value = this._eqEnabled ? db : 0;
            }
        }

        disableEq() {
            this._eqEnabled = false;
            if (this._bands) {
                Object.values(this._bands).forEach((f) => { f.gain.value = 0; });
            }
        }

        enableEq() {
            this._eqEnabled = true;
            if (this._bands) {
                Object.entries(this._eqValues).forEach(([b, db]) => {
                    if (this._bands[b]) this._bands[b].gain.value = db;
                });
            }
        }

        dispose() {
            this._disposed = true;
            clearTimeout(this._connectTimer);
            clearInterval(this._clockTimer);
            this.stop();
            try { if (this._vizSource) this._vizSource.stop(); } catch (_) {}
            try { if (this._ctx) this._ctx.close(); } catch (_) {}
            this._listeners = {};
        }
    }

    window.WindowContents.winamp = `
        <div class="h-full flex flex-col bg-[#0a0c13] text-white text-xs select-none overflow-hidden" id="winamp-root">
            <!-- Header & Classic Winamp 2.9 Control Deck -->
            <div class="px-4 py-3 bg-gradient-to-r from-emerald-950/60 via-black/75 to-amber-950/45 border-b border-white/[0.08] flex flex-col gap-2.5">
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <div class="font-semibold text-sm text-white flex items-center gap-2">
                            <span>SomaFM Live + Classic Winamp 2.9</span>
                            <span id="somafm-count-badge" class="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-mono text-[10px]">14 STATIONS</span>
                        </div>
                        <div class="text-[11px] text-gray-400 mt-0.5">Ad-free listener-supported SomaFM radio + authentic skinnable Winamp 2.9 w/ 10-band EQ</div>
                    </div>
                    <div class="flex flex-wrap items-center gap-1.5">
                        <input type="file" id="winamp-local-file" multiple accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a,.wsz,.zip" class="hidden" onchange="os.winampHandleFiles(this.files); this.value='';">
                        <button type="button" onclick="document.getElementById('winamp-local-file')?.click()"
                            class="px-2.5 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/15 border border-white/15 text-[11px] text-gray-200 font-medium transition hover-target cursor-none"
                            title="Load local MP3/WAV/FLAC audio or .wsz Winamp skins">
                            📂 Load MP3 / .wsz Skin
                        </button>
                        <button type="button" id="webamp-sync-btn" onclick="os.winampSyncSomafmPlaylist()"
                            class="px-2.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/35 text-[11px] text-sky-200 font-semibold transition hover-target cursor-none"
                            title="Load SomaFM live stations into Classic Winamp 2.9 playlist">
                            ⇄ SomaFM → Winamp
                        </button>
                        <button type="button" id="webamp-launch-btn" onclick="os.launchDesktopWebamp()"
                            class="px-3.5 py-1.5 rounded-xl bg-amber-400 text-black font-bold text-xs hover:bg-amber-300 shadow-lg transition hover-target cursor-none">
                            ⚡ Launch Winamp 2.9
                        </button>
                    </div>
                </div>

                <!-- Search, Genre Pills & Winamp Skin Selector -->
                <div class="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                    <div class="flex flex-wrap items-center gap-1.5 flex-1 min-w-[220px]">
                        <input id="somafm-search" type="text" placeholder="Search SomaFM stations, genre, or current artist..."
                            oninput="os.somafmSetSearch(this.value)"
                            class="w-52 max-w-full px-2.5 py-1 rounded-lg bg-black/55 border border-white/10 text-[11px] text-white placeholder-gray-500 focus:outline-none hover-target">
                        <div class="flex flex-wrap items-center gap-1" id="somafm-genre-pills">
                            <button type="button" data-sfm-cat="all" onclick="os.somafmSetCategory('all')" class="px-2 py-0.5 rounded-md bg-emerald-400 text-black font-semibold text-[10px] hover-target cursor-none">All</button>
                            <button type="button" data-sfm-cat="ambient" onclick="os.somafmSetCategory('ambient')" class="px-2 py-0.5 rounded-md bg-white/[0.06] text-gray-300 hover:bg-white/12 text-[10px] hover-target cursor-none">Ambient</button>
                            <button type="button" data-sfm-cat="electronic" onclick="os.somafmSetCategory('electronic')" class="px-2 py-0.5 rounded-md bg-white/[0.06] text-gray-300 hover:bg-white/12 text-[10px] hover-target cursor-none">Electronic</button>
                            <button type="button" data-sfm-cat="80s" onclick="os.somafmSetCategory('80s')" class="px-2 py-0.5 rounded-md bg-white/[0.06] text-gray-300 hover:bg-white/12 text-[10px] hover-target cursor-none">Synth / 80s</button>
                            <button type="button" data-sfm-cat="lounge" onclick="os.somafmSetCategory('lounge')" class="px-2 py-0.5 rounded-md bg-white/[0.06] text-gray-300 hover:bg-white/12 text-[10px] hover-target cursor-none">Lounge / Jazz</button>
                            <button type="button" data-sfm-cat="rock" onclick="os.somafmSetCategory('rock')" class="px-2 py-0.5 rounded-md bg-white/[0.06] text-gray-300 hover:bg-white/12 text-[10px] hover-target cursor-none">Indie / Eclectic</button>
                        </div>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="text-[10px] font-mono text-gray-400">Winamp Skin:</span>
                        <select id="winamp-skin-select" onchange="os.winampSelectSkin(this.value)"
                            class="px-2 py-1 rounded-lg bg-black/60 border border-white/15 text-[10.5px] text-amber-200 hover-target cursor-none">
                            ${WEBAMP_SKINS.map((s) => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}
                        </select>
                        <button type="button" onclick="os.somafmFetchChannels(true)" title="Refresh live listener counts & now-playing tracks"
                            class="px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-white/14 border border-white/10 text-[10.5px] font-mono text-emerald-300 hover-target cursor-none">↻ Live</button>
                    </div>
                </div>
            </div>

            <!-- Live Channel Cards -->
            <div id="somafm-grid" class="flex-1 p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto"></div>

            <!-- Custom Zero-CORS SomaFM Live Transport Bar -->
            <div class="px-4 py-3 bg-black/85 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0 flex-1">
                    <div id="somafm-now-art" class="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/30 to-amber-500/25 border border-white/15 flex items-center justify-center overflow-hidden shrink-0 text-base">📻</div>
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2">
                            <span id="somafm-status-pill" class="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[9.5px] text-gray-300 uppercase tracking-wider shrink-0">READY</span>
                            <div id="somafm-now-title" class="font-semibold text-white truncate">Groove Salad — ambient / downtempo</div>
                        </div>
                        <div id="somafm-now-track" class="text-[11px] font-mono text-emerald-300 truncate mt-0.5">Click Play or choose any SomaFM channel above</div>
                    </div>
                </div>

                <!-- Transport Controls -->
                <div class="flex items-center gap-1.5">
                    <button type="button" onclick="os.somafmStep(-1)" title="Previous Station"
                        class="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/14 border border-white/10 flex items-center justify-center text-gray-200 hover-target cursor-none">⏮</button>
                    <button type="button" id="somafm-play-btn" onclick="os.somafmTogglePlay()" title="Play / Pause SomaFM Stream"
                        class="w-10 h-10 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-sm flex items-center justify-center shadow-lg transition hover-target cursor-none">▶</button>
                    <button type="button" onclick="os.somafmStep(1)" title="Next Station"
                        class="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/14 border border-white/10 flex items-center justify-center text-gray-200 hover-target cursor-none">⏭</button>
                    <button type="button" onclick="os.somafmReconnect()" title="Switch / Reconnect Stream Mirror"
                        class="px-2 h-8 rounded-xl bg-white/[0.06] hover:bg-white/14 border border-white/10 font-mono text-[10px] text-amber-200 hover-target cursor-none">↻ Mirror</button>
                </div>

                <!-- Live Spectrum Canvas + Volume + Beam to Winamp -->
                <div class="flex items-center gap-2.5">
                    <canvas id="somafm-viz-canvas" width="96" height="30" class="rounded-lg bg-white/[0.03] border border-white/[0.07] hidden md:block"></canvas>
                    <div class="flex items-center gap-1.5">
                        <button type="button" id="somafm-mute-btn" onclick="os.somafmToggleMute()" title="Mute / Unmute"
                            class="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/12 flex items-center justify-center text-gray-300 hover-target cursor-none">🔊</button>
                        <input id="somafm-vol-slider" type="range" min="0" max="100" value="75"
                            oninput="os.somafmSetVolume(this.value)"
                            class="w-20 hover-target cursor-none" aria-label="SomaFM Volume">
                    </div>
                    <button type="button" onclick="os.somafmPlayInWebamp(os.winampState.activeId || 'groovesalad')" title="Play active station inside Classic Winamp 2.9"
                        class="px-2.5 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-200 font-semibold text-[10.5px] hover-target cursor-none">
                        ⚡ In Winamp
                    </button>
                </div>
            </div>
        </div>
    `;

    function arrayBufferToBase64DataUrl(buffer, mime) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }
        return `data:${mime};base64,` + btoa(binary);
    }

    async function loadWebampScript() {
        if (window.Webamp) return true;
        for (const src of WEBAMP_CDN_URLS) {
            const loaded = await new Promise((resolve) => {
                const existing = document.querySelector(`script[data-webamp-src="${src}"]`);
                if (existing) { resolve(Boolean(window.Webamp)); return; }
                const s = document.createElement('script');
                s.src = src;
                s.async = true;
                s.dataset.webampSrc = src;
                const timer = setTimeout(() => { s.onload = s.onerror = null; resolve(false); }, 10000);
                s.onload = () => { clearTimeout(timer); resolve(Boolean(window.Webamp)); };
                s.onerror = () => { clearTimeout(timer); s.remove(); resolve(false); };
                document.head.appendChild(s);
            });
            if (loaded && window.Webamp) return true;
        }
        return Boolean(window.Webamp);
    }

    window.extendOS({
        // ── Photopea Studio Methods ──
        ppState: {
            pendingFormat: 'png',
            awaitingExport: false
        },

        initPhotopea: () => {
            const frame = document.getElementById('pp-frame');
            if (!frame || frame.src !== 'about:blank') return;
            const cfg = {
                environment: {
                    theme: 2,
                    vmode: 0,
                    menus: [1, 1, 1, 1, 1, 1, 1, 1, 1]
                }
            };
            frame.src = `https://www.photopea.com#${encodeURIComponent(JSON.stringify(cfg))}`;
        },

        ppNewDoc: (w, h, name) => {
            const frame = document.getElementById('pp-frame');
            if (!frame || !frame.contentWindow) return;
            frame.contentWindow.postMessage(`app.documents.add(${w}, ${h}, 72, "${name}");`, '*');
        },

        ppOpenVfsImage: async (fileId) => {
            const f = (window.AetherVFS && AetherVFS.getCachedFile(fileId)) || (os.fmFindById && os.fmFindById(fileId));
            const url = f && (f.dataUrl || f.imageUrl);
            if (!url) return;
            os.openWindow('photopea');
            setTimeout(async () => {
                const frame = document.getElementById('pp-frame');
                if (!frame || !frame.contentWindow) return;
                try {
                    const res = await fetch(url);
                    const buf = await res.arrayBuffer();
                    setTimeout(() => frame.contentWindow.postMessage(buf, '*'), 1800);
                } catch (_) {
                    frame.contentWindow.postMessage(`app.open("${url}", null, false);`, '*');
                }
            }, 350);
        },

        ppExportToVFS: (fmt = 'png') => {
            const frame = document.getElementById('pp-frame');
            if (!frame || !frame.contentWindow) return;
            os.ppState.pendingFormat = fmt;
            os.ppState.awaitingExport = true;
            frame.contentWindow.postMessage(`app.activeDocument.saveToOE("${fmt}");`, '*');
            window.Notifications && window.Notifications.push('PHOTOPEA BRIDGE', `Requesting ${fmt.toUpperCase()} export from Photopea...`);
        },

        // ── OpenCanvas (Excalidraw / Draw.io / tldraw) Methods ──
        ocState: {
            engine: 'excalidraw',
            drawioXml: ''
        },

        initWhiteboard: () => {
            os.ocSetEngine(os.ocState.engine || 'excalidraw');
        },

        ocSetEngine: (eng) => {
            os.ocState.engine = eng;
            document.querySelectorAll('[data-oc-eng]').forEach((b) => {
                b.classList.toggle('active', b.getAttribute('data-oc-eng') === eng);
            });
            const frame = document.getElementById('oc-frame');
            const saveBtn = document.getElementById('oc-drawio-save');
            const status = document.getElementById('oc-status');
            if (saveBtn) saveBtn.classList.toggle('hidden', eng !== 'drawio');
            if (!frame) return;

            if (eng === 'excalidraw') {
                frame.src = 'https://excalidraw.com';
                if (status) status.textContent = 'Excalidraw · Hand-drawn architecture & infinite sketchpad';
            } else if (eng === 'drawio') {
                frame.src = 'https://embed.diagrams.net/?embed=1&ui=dark&spin=1&modified=unsavedChanges&proto=json';
                if (status) status.textContent = 'Draw.io Dark · Bidirectional JSON sync with File Explorer';
            } else {
                frame.src = 'https://www.tldraw.com';
                if (status) status.textContent = 'tldraw · Collaborative infinite vector canvas';
            }
        },

        ocExportDrawioSvg: () => {
            const frame = document.getElementById('oc-frame');
            if (!frame || !frame.contentWindow) return;
            frame.contentWindow.postMessage(JSON.stringify({ action: 'export', format: 'xmlsvg', spinKey: 'saving' }), '*');
        },

        // ── SomaFM Live API + Hybrid Open-Source Webamp 2.9 Engine ──
        winampState: {
            channels: SOMAFM_FALLBACK,
            activeId: 'groovesalad',
            status: 'idle', // 'idle' | 'connecting' | 'playing' | 'paused' | 'error'
            mirrorIdx: 0,
            attemptSeq: 0,
            failedAttempt: -1,
            search: '',
            category: 'all',
            muted: false,
            volume: 0.75,
            audio: null,
            connectTimer: null,
            pollTimer: null,
            vizRaf: null,
            webampInstance: null,
            webampClosed: false,
            webampLoading: false,
            selectedSkin: 'base'
        },

        _ensureSomafmAudio: () => {
            if (os.winampState.audio) return os.winampState.audio;
            const aud = new Audio();
            aud.preload = 'none';
            const savedVol = Number(window.SystemState?.settings?.media_tuner_volume ?? 0.75);
            os.winampState.volume = Number.isFinite(savedVol) ? Math.max(0, Math.min(1, savedVol)) : 0.75;
            aud.volume = os.winampState.volume;

            aud.addEventListener('playing', () => {
                clearTimeout(os.winampState.connectTimer);
                os.winampState.status = 'playing';
                os.somafmSyncTransportUI();
                os.somafmRenderGrid();
            });

            aud.addEventListener('waiting', () => {
                if (os.winampState.status === 'playing' || os.winampState.status === 'connecting') {
                    os.winampState.status = 'connecting';
                    os.somafmSyncTransportUI();
                }
            });

            aud.addEventListener('pause', () => {
                if (os.winampState.status === 'playing') {
                    os.winampState.status = 'paused';
                    os.somafmSyncTransportUI();
                    os.somafmRenderGrid();
                }
            });

            aud.addEventListener('error', () => {
                if (os.winampState.status === 'idle' || os.winampState.status === 'paused') return;
                if (!aud.paused && aud.readyState >= 3) return;
                os.somafmTryNextMirror(os.winampState.attemptSeq);
            });

            os.winampState.audio = aud;
            return aud;
        },

        initWinamp: () => {
            os._ensureSomafmAudio();
            const slider = document.getElementById('somafm-vol-slider');
            if (slider) slider.value = String(Math.round(os.winampState.volume * 100));
            const skinSel = document.getElementById('winamp-skin-select');
            if (skinSel) skinSel.value = os.winampState.selectedSkin || 'base';

            os.somafmRenderGrid();
            os.somafmSyncTransportUI();
            os.somafmSyncWebampBtn();
            os.somafmStartVisualizer();
            os.somafmFetchChannels(false);

            clearInterval(os.winampState.pollTimer);
            os.winampState.pollTimer = setInterval(() => {
                if (window.SystemState?.windows?.winamp?.isOpen) {
                    os.somafmFetchChannels(false);
                }
            }, 30000);
        },

        killWinamp: () => {
            clearInterval(os.winampState.pollTimer);
            os.winampState.pollTimer = null;
            if (os.winampState.vizRaf) {
                cancelAnimationFrame(os.winampState.vizRaf);
                os.winampState.vizRaf = null;
            }
            os.somafmPause(true);
        },

        somafmFetchChannels: async (notifyUser = false) => {
            let loaded = false;
            // 1. Official CORS-enabled SomaFM API (https://api.somafm.com/channels.json)
            for (const apiUrl of ['https://api.somafm.com/channels.json', 'https://somafm.com/channels.json']) {
                try {
                    const res = await fetch(apiUrl);
                    if (!res.ok) continue;
                    const data = await res.json();
                    if (Array.isArray(data?.channels) && data.channels.length) {
                        os.winampState.channels = data.channels
                            .map((c) => ({
                                id: c.id,
                                title: c.title || c.id,
                                genre: String(c.genre || 'electronic / ambient').replace(/\|/g, ' / '),
                                listeners: Number(c.listeners || 0),
                                lastPlaying: c.lastPlaying || 'Live Broadcast',
                                description: c.description || '',
                                image: c.xlimage || c.largeimage || c.image || '',
                                mirrors: buildSomafmMirrors(c.id),
                                stream: `https://ice5.somafm.com/${c.id}-128-mp3`
                            }))
                            .sort((a, b) => b.listeners - a.listeners);
                        loaded = true;
                        break;
                    }
                } catch (_) {}
            }

            // 2. Secondary CORS fallback via Radio-Browser SomaFM directory
            if (!loaded) {
                try {
                    const rRes = await fetch('https://de1.api.radio-browser.info/json/stations/byname/somafm?hidebroken=true&order=clickcount&reverse=true&limit=36');
                    const rData = await rRes.json();
                    if (Array.isArray(rData) && rData.length) {
                        const seen = new Set();
                        const mapped = [];
                        rData.forEach((s) => {
                            const cid = extractSomafmChannelId(s.url_resolved || s.url) || String(s.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                            if (!cid || seen.has(cid)) return;
                            seen.add(cid);
                            mapped.push({
                                id: cid,
                                title: String(s.name || cid).replace(/^somafm\s*[-:]?\s*/i, '').trim() || cid,
                                genre: (s.tags || 'ambient / electronic').split(',').slice(0, 2).join(' / '),
                                listeners: Number(s.votes || 120),
                                lastPlaying: 'Live Stream Ready',
                                description: s.homepage || '',
                                image: s.favicon || '',
                                mirrors: buildSomafmMirrors(cid, s.url_resolved || s.url),
                                stream: s.url_resolved || `https://ice5.somafm.com/${cid}-128-mp3`
                            });
                        });
                        if (mapped.length) {
                            os.winampState.channels = mapped;
                            loaded = true;
                        }
                    }
                } catch (_) {}
            }

            const badge = document.getElementById('somafm-count-badge');
            if (badge) badge.textContent = `${os.winampState.channels.length} STATIONS`;

            os.somafmRenderGrid();
            os.somafmSyncTransportUI();
            if (notifyUser && window.Notifications) {
                window.Notifications.push('SOMAFM LIVE', loaded ? `Synced ${os.winampState.channels.length} live SomaFM channels.` : 'Using built-in SomaFM mirror catalog.');
            }
        },

        somafmFilteredChannels: () => {
            const q = String(os.winampState.search || '').trim().toLowerCase();
            const cat = os.winampState.category || 'all';
            return os.winampState.channels.filter((ch) => {
                const hay = `${ch.title} ${ch.genre} ${ch.lastPlaying} ${ch.description || ''}`.toLowerCase();
                if (q && !hay.includes(q)) return false;
                if (cat === 'all') return true;
                if (cat === 'ambient') return /ambient|drone|space|chill/i.test(hay);
                if (cat === 'electronic') return /electronic|house|trance|techno|vapor|beat|def con|idm/i.test(hay);
                if (cat === '80s') return /80s|synth|new wave|vapor|retro/i.test(hay);
                if (cat === 'lounge') return /lounge|jazz|bossa|secret|soul|groove|lush/i.test(hay);
                if (cat === 'rock') return /indie|rock|pop|metal|folk|americana|eclectic/i.test(hay);
                return true;
            });
        },

        somafmSetSearch: (val) => {
            os.winampState.search = val || '';
            os.somafmRenderGrid();
        },

        somafmSetCategory: (cat) => {
            os.winampState.category = cat || 'all';
            document.querySelectorAll('[data-sfm-cat]').forEach((btn) => {
                const on = btn.getAttribute('data-sfm-cat') === os.winampState.category;
                btn.className = on
                    ? 'px-2 py-0.5 rounded-md bg-emerald-400 text-black font-semibold text-[10px] hover-target cursor-none'
                    : 'px-2 py-0.5 rounded-md bg-white/[0.06] text-gray-300 hover:bg-white/12 text-[10px] hover-target cursor-none';
            });
            os.somafmRenderGrid();
        },

        somafmRenderGrid: () => {
            const grid = document.getElementById('somafm-grid');
            if (!grid) return;
            const list = os.somafmFilteredChannels();
            if (!list.length) {
                grid.innerHTML = `<div class="col-span-full p-8 text-center text-gray-400 font-mono">No SomaFM channels match your filter.</div>`;
                return;
            }
            grid.innerHTML = list.map((ch) => {
                const isCurrent = os.winampState.activeId === ch.id;
                const isPlaying = isCurrent && os.winampState.status === 'playing';
                const isConnecting = isCurrent && os.winampState.status === 'connecting';
                const safeId = escJs(ch.id);
                return `
                    <div onclick="os.somafmPlay('${safeId}')" role="button" tabindex="0"
                        class="p-3 rounded-2xl border transition flex items-center justify-between gap-3 hover-target cursor-none ${isCurrent ? 'bg-emerald-500/15 border-emerald-400/50 shadow-lg' : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.09]'}">
                        <div class="flex items-center gap-3 min-w-0 flex-1">
                            <div class="w-12 h-12 rounded-xl bg-black/60 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center relative">
                                ${ch.image ? `<img src="${esc(ch.image)}" alt="" class="w-full h-full object-cover" onerror="this.style.display='none'">` : '📻'}
                                ${isPlaying ? `<span class="absolute inset-0 bg-black/45 flex items-center justify-center text-emerald-300 font-bold text-sm">⏸</span>` : ''}
                            </div>
                            <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-2">
                                    <span class="font-semibold text-[13px] text-white truncate">${esc(ch.title)}</span>
                                    <span class="px-1.5 py-0.5 rounded-full bg-black/50 border border-white/10 font-mono text-[9.5px] text-emerald-300 shrink-0">${Number(ch.listeners || 0).toLocaleString()}</span>
                                </div>
                                <div class="text-[10px] text-amber-300 font-mono truncate mt-0.5">${esc(ch.genre)}</div>
                                <div class="text-[11px] text-gray-300 truncate mt-1">♪ ${esc(ch.lastPlaying || 'Live Broadcast')}</div>
                            </div>
                        </div>
                        <div class="flex flex-col items-end gap-1.5 shrink-0">
                            <span class="px-2.5 py-1 rounded-lg text-[10.5px] font-semibold ${isPlaying ? 'bg-emerald-400 text-black' : (isConnecting ? 'bg-amber-400/30 text-amber-200 animate-pulse' : 'bg-white/10 text-white')}">
                                ${isPlaying ? '⏸ Live' : (isConnecting ? 'Buffering…' : '▶ Stream')}
                            </span>
                            <button type="button" onclick="event.stopPropagation(); os.somafmPlayInWebamp('${safeId}')"
                                class="px-2 py-0.5 rounded-md bg-amber-400/15 hover:bg-amber-400/30 border border-amber-400/35 text-[9.5px] font-mono text-amber-200 hover-target cursor-none"
                                title="Stream this channel inside Classic Winamp 2.9">
                                ⚡ Winamp
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        },

        somafmPlay: (id) => {
            const ch = os.winampState.channels.find((c) => c.id === id) || os.winampState.channels[0];
            if (!ch) return;

            // Toggle pause if clicking the currently playing station card
            if (os.winampState.activeId === ch.id && os.winampState.status === 'playing') {
                os.somafmPause(false);
                return;
            }

            // Pause other OS audio sources so streams never overlap
            if (os.audioStream && !os.audioStream.paused) {
                try { os.audioStream.pause(); os.audioStream.src = ''; os.updatePlayStateVisuals && os.updatePlayStateVisuals(false); } catch (_) {}
            }
            if (os.winampState.webampInstance) {
                try { os.winampState.webampInstance.pause(); } catch (_) {}
            }

            os.winampState.activeId = ch.id;
            os.winampState.mirrorIdx = 0;
            os._somafmStartCurrentMirror();
        },

        _somafmStartCurrentMirror: () => {
            const ch = os.winampState.channels.find((c) => c.id === os.winampState.activeId) || os.winampState.channels[0];
            if (!ch) return;
            const mirrors = Array.isArray(ch.mirrors) && ch.mirrors.length ? ch.mirrors : buildSomafmMirrors(ch.id, ch.stream);
            const url = mirrors[os.winampState.mirrorIdx] || mirrors[0];
            const aud = os._ensureSomafmAudio();

            clearTimeout(os.winampState.connectTimer);
            os.winampState.attemptSeq += 1;
            const seq = os.winampState.attemptSeq;
            os.winampState.status = 'connecting';
            os.somafmRenderGrid();
            os.somafmSyncTransportUI();

            try {
                aud.pause();
                aud.src = url;
                aud.volume = os.winampState.muted ? 0 : os.winampState.volume;
            } catch (_) {}

            os.winampState.connectTimer = setTimeout(() => {
                if (seq === os.winampState.attemptSeq && os.winampState.status === 'connecting' && (aud.paused || aud.readyState < 2)) {
                    os.somafmTryNextMirror(seq);
                }
            }, 5500);

            aud.play().catch((err) => {
                if (err && err.name === 'AbortError') return;
                os.somafmTryNextMirror(seq);
            });
        },

        somafmTryNextMirror: (expectedSeq = os.winampState.attemptSeq) => {
            if (expectedSeq !== os.winampState.attemptSeq || os.winampState.failedAttempt === expectedSeq) return;
            os.winampState.failedAttempt = expectedSeq;
            const ch = os.winampState.channels.find((c) => c.id === os.winampState.activeId);
            if (!ch) return;
            const mirrors = Array.isArray(ch.mirrors) && ch.mirrors.length ? ch.mirrors : buildSomafmMirrors(ch.id, ch.stream);
            if (os.winampState.mirrorIdx + 1 < mirrors.length) {
                os.winampState.mirrorIdx += 1;
                os._somafmStartCurrentMirror();
            } else {
                clearTimeout(os.winampState.connectTimer);
                os.winampState.status = 'error';
                os.somafmSyncTransportUI();
                os.somafmRenderGrid();
                window.Notifications && window.Notifications.push('SOMAFM STREAM', `All mirrors busy for ${ch.title}. Click ↻ Mirror to retry.`);
            }
        },

        somafmTogglePlay: () => {
            if (os.winampState.status === 'playing' || os.winampState.status === 'connecting') {
                os.somafmPause(false);
            } else {
                const targetId = os.winampState.activeId || os.winampState.channels[0]?.id || 'groovesalad';
                os.winampState.activeId = targetId;
                os.winampState.mirrorIdx = 0;
                // Pause other OS audio sources
                if (os.audioStream && !os.audioStream.paused) {
                    try { os.audioStream.pause(); os.audioStream.src = ''; } catch (_) {}
                }
                if (os.winampState.webampInstance) {
                    try { os.winampState.webampInstance.pause(); } catch (_) {}
                }
                os._somafmStartCurrentMirror();
            }
        },

        somafmPause: (resetToIdle = false) => {
            clearTimeout(os.winampState.connectTimer);
            const aud = os.winampState.audio;
            if (aud) {
                try {
                    aud.pause();
                    // Release live Icecast HTTP socket so resume always plays real-time edge
                    aud.removeAttribute('src');
                    aud.load();
                } catch (_) {}
            }
            os.winampState.status = resetToIdle ? 'idle' : 'paused';
            os.somafmSyncTransportUI();
            os.somafmRenderGrid();
        },

        somafmStep: (delta) => {
            const list = os.somafmFilteredChannels();
            const pool = list.length ? list : os.winampState.channels;
            if (!pool.length) return;
            const curIdx = Math.max(0, pool.findIndex((c) => c.id === os.winampState.activeId));
            const next = pool[(curIdx + delta + pool.length) % pool.length];
            if (next) {
                os.winampState.activeId = ''; // ensure somafmPlay starts rather than toggles pause
                os.somafmPlay(next.id);
            }
        },

        somafmReconnect: () => {
            const ch = os.winampState.channels.find((c) => c.id === os.winampState.activeId) || os.winampState.channels[0];
            if (!ch) return;
            const mirrors = ch.mirrors || buildSomafmMirrors(ch.id, ch.stream);
            os.winampState.mirrorIdx = (os.winampState.mirrorIdx + 1) % mirrors.length;
            os._somafmStartCurrentMirror();
        },

        somafmSetVolume: (val) => {
            const v = Math.max(0, Math.min(1, Number(val ?? 75) / 100));
            os.winampState.volume = v;
            if (v > 0) os.winampState.muted = false;
            if (os.winampState.audio) os.winampState.audio.volume = os.winampState.muted ? 0 : v;
            if (window.SystemState?.settings) {
                SystemState.settings.media_tuner_volume = v;
                SystemState.save && SystemState.save();
            }
            const muteBtn = document.getElementById('somafm-mute-btn');
            if (muteBtn) muteBtn.textContent = (os.winampState.muted || v === 0) ? '🔇' : (v < 0.45 ? '🔉' : '🔊');
        },

        somafmToggleMute: () => {
            os.winampState.muted = !os.winampState.muted;
            if (os.winampState.audio) {
                os.winampState.audio.volume = os.winampState.muted ? 0 : os.winampState.volume;
            }
            const muteBtn = document.getElementById('somafm-mute-btn');
            if (muteBtn) muteBtn.textContent = os.winampState.muted ? '🔇' : '🔊';
        },

        somafmSyncTransportUI: () => {
            const ch = os.winampState.channels.find((c) => c.id === os.winampState.activeId) || os.winampState.channels[0];
            const titleEl = document.getElementById('somafm-now-title');
            const trackEl = document.getElementById('somafm-now-track');
            const pillEl = document.getElementById('somafm-status-pill');
            const playBtn = document.getElementById('somafm-play-btn');
            const artEl = document.getElementById('somafm-now-art');
            if (!ch) return;

            if (titleEl) titleEl.textContent = `${ch.title} — ${ch.genre}`;
            if (artEl) {
                artEl.innerHTML = ch.image
                    ? `<img src="${esc(ch.image)}" alt="" class="w-full h-full object-cover" onerror="this.parentElement.textContent='📻'">`
                    : '📻';
            }

            const st = os.winampState.status;
            const hostNum = (os.winampState.mirrorIdx % SOMAFM_HOSTS.length) + 1;
            if (st === 'playing') {
                if (pillEl) {
                    pillEl.textContent = '● ON AIR 128K';
                    pillEl.className = 'px-1.5 py-0.5 rounded bg-emerald-500/25 border border-emerald-400/40 font-mono text-[9.5px] text-emerald-300 uppercase tracking-wider shrink-0';
                }
                if (trackEl) trackEl.textContent = `♪ ${ch.lastPlaying || 'Streaming Live Broadcast'}`;
                if (playBtn) playBtn.textContent = '⏸';
            } else if (st === 'connecting') {
                if (pillEl) {
                    pillEl.textContent = `BUFFERING M${hostNum}`;
                    pillEl.className = 'px-1.5 py-0.5 rounded bg-amber-500/25 border border-amber-400/40 font-mono text-[9.5px] text-amber-200 uppercase tracking-wider animate-pulse shrink-0';
                }
                if (trackEl) trackEl.textContent = `Connecting to SomaFM Icecast mirror #${hostNum}...`;
                if (playBtn) playBtn.textContent = '⏸';
            } else if (st === 'paused') {
                if (pillEl) {
                    pillEl.textContent = 'PAUSED';
                    pillEl.className = 'px-1.5 py-0.5 rounded bg-white/10 font-mono text-[9.5px] text-gray-300 uppercase tracking-wider shrink-0';
                }
                if (trackEl) trackEl.textContent = `Paused · ${ch.lastPlaying || 'Click ▶ to resume live edge'}`;
                if (playBtn) playBtn.textContent = '▶';
            } else if (st === 'error') {
                if (pillEl) {
                    pillEl.textContent = 'RETRY';
                    pillEl.className = 'px-1.5 py-0.5 rounded bg-rose-500/25 border border-rose-400/40 font-mono text-[9.5px] text-rose-200 uppercase tracking-wider shrink-0';
                }
                if (trackEl) trackEl.textContent = 'Stream mirror unreachable — click ↻ Mirror or try another channel';
                if (playBtn) playBtn.textContent = '▶';
            } else {
                if (pillEl) {
                    pillEl.textContent = 'READY';
                    pillEl.className = 'px-1.5 py-0.5 rounded bg-white/10 font-mono text-[9.5px] text-gray-300 uppercase tracking-wider shrink-0';
                }
                if (trackEl) trackEl.textContent = `♪ ${ch.lastPlaying || 'Click ▶ or any station card above to stream live'}`;
                if (playBtn) playBtn.textContent = '▶';
            }
        },

        somafmStartVisualizer: () => {
            if (os.winampState.vizRaf) cancelAnimationFrame(os.winampState.vizRaf);
            let phase = 0;
            const draw = () => {
                const canvas = document.getElementById('somafm-viz-canvas');
                if (!canvas) { os.winampState.vizRaf = null; return; }
                const ctx = canvas.getContext('2d');
                const w = canvas.width;
                const h = canvas.height;
                ctx.clearRect(0, 0, w, h);
                const playing = os.winampState.status === 'playing' && !os.winampState.muted && os.winampState.volume > 0;
                const bars = 20;
                const gap = 2;
                const bw = Math.floor((w - (bars - 1) * gap) / bars);
                phase += 0.14;
                for (let i = 0; i < bars; i++) {
                    const norm = playing
                        ? (0.22 + 0.72 * Math.abs(Math.sin(phase + i * 0.55) * Math.cos(phase * 0.63 - i * 0.27))) * os.winampState.volume
                        : 0.10;
                    const bh = Math.max(3, Math.round(norm * (h - 4)));
                    const x = i * (bw + gap);
                    const y = h - bh;
                    ctx.fillStyle = playing ? (i % 3 === 0 ? '#fbbf24' : '#34d399') : 'rgba(255,255,255,0.16)';
                    ctx.fillRect(x, y, bw, bh);
                }
                os.winampState.vizRaf = requestAnimationFrame(draw);
            };
            os.winampState.vizRaf = requestAnimationFrame(draw);
        },

        // ── Classic Winamp 2.9 Desktop Engine (captbaritone/webamp) ──
        _buildWebampTrackList: (leadChannelId) => {
            const channels = os.winampState.channels.slice(0, 12);
            if (leadChannelId) {
                const idx = channels.findIndex((c) => c.id === leadChannelId);
                if (idx > 0) {
                    const [picked] = channels.splice(idx, 1);
                    channels.unshift(picked);
                } else if (idx === -1) {
                    const extra = os.winampState.channels.find((c) => c.id === leadChannelId);
                    if (extra) channels.unshift(extra);
                }
            }
            const radioTracks = channels.map((c) => ({
                // Providing BOTH metaData and duration: 0 prevents Webamp from opening
                // background ID3/duration HTTP streams that exhaust browser sockets!
                metaData: {
                    artist: 'SomaFM Live',
                    title: `${c.title} [${c.genre}]`
                },
                url: (c.mirrors && c.mirrors[0]) || c.stream || `https://ice5.somafm.com/${c.id}-128-mp3`,
                duration: 0
            }));
            return [...radioTracks, ...WEBAMP_DEMO_MP3S];
        },

        somafmSyncWebampBtn: () => {
            const btn = document.getElementById('webamp-launch-btn');
            if (!btn) return;
            if (os.winampState.webampLoading) {
                btn.textContent = '⏳ Loading Winamp 2.9...';
            } else if (os.winampState.webampInstance && !os.winampState.webampClosed) {
                btn.textContent = '✕ Hide Winamp 2.9';
            } else if (os.winampState.webampInstance && os.winampState.webampClosed) {
                btn.textContent = '⚡ Reopen Winamp 2.9';
            } else {
                btn.textContent = '⚡ Launch Winamp 2.9';
            }
        },

        launchDesktopWebamp: async (opts = {}) => {
            const { forceOpen = false, leadChannelId = null, autoPlay = false } = opts;

            // Toggle visibility if instance already exists!
            if (os.winampState.webampInstance) {
                if (os.winampState.webampClosed) {
                    try { os.winampState.webampInstance.reopen(); } catch (_) {}
                    os.winampState.webampClosed = false;
                } else if (!forceOpen) {
                    try { os.winampState.webampInstance.close(); } catch (_) {}
                    os.winampState.webampClosed = true;
                    os.somafmSyncWebampBtn();
                    return os.winampState.webampInstance;
                }
                os.somafmSyncWebampBtn();
                if (leadChannelId) {
                    const tracks = os._buildWebampTrackList(leadChannelId);
                    os.somafmPause(false);
                    if (autoPlay && os.winampState.webampInstance.setTracksToPlay) {
                        os.winampState.webampInstance.setTracksToPlay(tracks);
                    } else if (os.winampState.webampInstance.appendTracks) {
                        os.winampState.webampInstance.appendTracks([tracks[0]]);
                    }
                }
                return os.winampState.webampInstance;
            }

            if (os.winampState.webampLoading) return null;
            os.winampState.webampLoading = true;
            os.somafmSyncWebampBtn();

            const ok = await loadWebampScript();
            if (!ok || !window.Webamp) {
                os.winampState.webampLoading = false;
                os.somafmSyncWebampBtn();
                window.Notifications && window.Notifications.push('WEBAMP', 'Could not reach Webamp CDN — SomaFM built-in player remains ready below.');
                return null;
            }

            // Position container safely inside viewport (300x380 box) so Webamp's 275x348
            // 3-window stack NEVER centers above the top edge (fixes top: -84px bug!).
            let host = document.getElementById('webamp-desktop-mount');
            if (!host) {
                host = document.createElement('div');
                host.id = 'webamp-desktop-mount';
                document.body.appendChild(host);
            }
            const safeLeft = Math.max(24, Math.min(window.innerWidth - 324, window.innerWidth - 336));
            const safeTop = Math.max(48, Math.min(84, window.innerHeight - 400));
            host.style.cssText = `position:fixed;top:${safeTop}px;left:${safeLeft}px;width:300px;height:380px;pointer-events:none;z-index:8800;`;

            // Pause SomaFM bar audio so streams don't double-play
            os.somafmPause(false);

            const tracks = os._buildWebampTrackList(leadChannelId || os.winampState.activeId || 'groovesalad');
            const chosenSkin = WEBAMP_SKINS.find((s) => s.id === os.winampState.selectedSkin && s.url);

            const webampConfig = {
                initialTracks: tracks,
                availableSkins: WEBAMP_SKINS.filter((s) => s.url).map((s) => ({ name: s.name, url: s.url })),
                zIndex: 8800,
                enableHotkeys: false,
                __customMediaClass: AetherWebampMedia,
                filePickers: [{
                    contextMenuName: 'AetherOS SomaFM Live Channels...',
                    filePicker: async () => os._buildWebampTrackList(os.winampState.activeId),
                    requiresNetwork: true
                }]
            };
            if (chosenSkin) {
                webampConfig.initialSkin = { url: chosenSkin.url };
            }

            try {
                const webamp = new window.Webamp(webampConfig);
                webamp.onClose(() => {
                    os.winampState.webampClosed = true;
                    os.somafmSyncWebampBtn();
                });

                await webamp.renderWhenReady(host);
                os.winampState.webampInstance = webamp;
                os.winampState.webampClosed = false;
                os.winampState.webampLoading = false;
                os.somafmSyncWebampBtn();

                if (window.cursorEngine && window.cursorEngine.ensureTopLayer) {
                    window.cursorEngine.ensureTopLayer();
                }

                if (autoPlay) {
                    try { webamp.play(); } catch (_) {}
                }
                window.Notifications && window.Notifications.push('WINAMP 2.9 READY', 'Classic Winamp 2.9 + 10-band EQ is live on your desktop.');
                return webamp;
            } catch (err) {
                os.winampState.webampLoading = false;
                os.somafmSyncWebampBtn();
                window.Notifications && window.Notifications.push('WEBAMP ERROR', String(err?.message || err));
                return null;
            }
        },

        somafmPlayInWebamp: async (channelId) => {
            const cid = channelId || os.winampState.activeId || 'groovesalad';
            os.winampState.activeId = cid;
            os.somafmRenderGrid();
            const existed = Boolean(os.winampState.webampInstance);
            const webamp = await os.launchDesktopWebamp({ forceOpen: true, leadChannelId: cid, autoPlay: true });
            if (webamp && !existed) {
                // Newly booted instance already has cid at track 0; ensure playback starts
                try { webamp.play(); } catch (_) {}
            }
        },

        winampSyncSomafmPlaylist: async () => {
            const webamp = await os.launchDesktopWebamp({ forceOpen: true, leadChannelId: os.winampState.activeId || 'groovesalad', autoPlay: true });
            if (webamp && webamp.setTracksToPlay) {
                webamp.setTracksToPlay(os._buildWebampTrackList(os.winampState.activeId || 'groovesalad'));
                window.Notifications && window.Notifications.push('WINAMP PLAYLIST', 'Loaded live SomaFM channels + demo MP3s into Winamp 2.9.');
            }
        },

        winampSelectSkin: async (skinId) => {
            os.winampState.selectedSkin = skinId || 'base';
            const skin = WEBAMP_SKINS.find((s) => s.id === skinId);
            if (!skin) return;
            if (!os.winampState.webampInstance) {
                if (skin.url) {
                    await os.launchDesktopWebamp({ forceOpen: true });
                }
                return;
            }
            if (skin.url && os.winampState.webampInstance.setSkinFromUrl) {
                os.winampState.webampInstance.setSkinFromUrl(skin.url);
                window.Notifications && window.Notifications.push('WINAMP SKIN', `Applying "${skin.name}" skin...`);
            } else if (!skin.url) {
                try {
                    os.winampState.webampInstance.store?.dispatch({ type: 'LOAD_DEFAULT_SKIN' });
                    window.Notifications && window.Notifications.push('WINAMP SKIN', 'Restored Classic Winamp 2.9 Base Skin.');
                } catch (_) {}
            }
        },

        winampHandleFiles: async (fileList) => {
            const files = Array.from(fileList || []);
            if (!files.length) return;
            const webamp = await os.launchDesktopWebamp({ forceOpen: true });
            if (!webamp) return;

            const skinFile = files.find((f) => /\.(wsz|zip)$/i.test(f.name));
            if (skinFile && webamp.setSkinFromUrl) {
                const skinUrl = URL.createObjectURL(skinFile);
                webamp.setSkinFromUrl(skinUrl);
                window.Notifications && window.Notifications.push('WINAMP SKIN', `Loaded custom skin "${skinFile.name}"!`);
            }

            const audioFiles = files.filter((f) => !/\.(wsz|zip)$/i.test(f.name));
            if (audioFiles.length) {
                const localTracks = audioFiles.map((f) => ({
                    blob: f,
                    defaultName: f.name.replace(/\.[^.]+$/, ''),
                    metaData: { artist: 'Local File', title: f.name.replace(/\.[^.]+$/, '') }
                }));
                os.somafmPause(false);
                if (webamp.setTracksToPlay) {
                    webamp.setTracksToPlay(localTracks);
                } else if (webamp.appendTracks) {
                    webamp.appendTracks(localTracks);
                }
                window.Notifications && window.Notifications.push('WINAMP AUDIO', `Playing ${audioFiles.length} local track(s) in Winamp 2.9.`);
            }
        }
    });

    // Global postMessage Bridge for Photopea ArrayBuffer Exports & Draw.io Official JSON Protocol
    window.addEventListener('message', async (e) => {
        // 1. Photopea binary image export -> Save straight into AetherOS File Explorer!
        if (e.origin.includes('photopea.com') && e.data instanceof ArrayBuffer && os.ppState?.awaitingExport) {
            os.ppState.awaitingExport = false;
            const fmt = os.ppState.pendingFormat || 'png';
            const mime = fmt === 'webp' ? 'image/webp' : 'image/png';
            const dataUrl = arrayBufferToBase64DataUrl(e.data, mime);
            if (window.AetherVFS) {
                const rec = await AetherVFS.putFile({
                    name: `Photopea-Export-${Date.now()}.${fmt}`,
                    mime,
                    kind: 'image',
                    icon: 'layers',
                    folder: 'User Uploads',
                    dataUrl,
                    imageUrl: dataUrl,
                    content: 'Exported from Photopea Studio',
                    tags: ['photopea', fmt]
                });
                window.Notifications && window.Notifications.push('PHOTOPEA SAVED', `Saved "${rec.name}" to File Explorer!`);
            }
            return;
        }

        // 2. Draw.io (diagrams.net) JSON embed protocol -> Bidirectional VFS Diagram Sync!
        if (typeof e.data === 'string' && e.origin.includes('diagrams.net')) {
            try {
                const msg = JSON.parse(e.data);
                const frame = document.getElementById('oc-frame');
                if (!frame || !frame.contentWindow) return;
                if (msg.event === 'init') {
                    frame.contentWindow.postMessage(JSON.stringify({
                        action: 'load',
                        autosave: 1,
                        xml: os.ocState.drawioXml || '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="AetherOS Architecture" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1e293b;strokeColor=#38bdf8;fontColor=#ffffff;" vertex="1" parent="1"><mxGeometry x="220" y="160" width="180" height="60" as="geometry"/></mxCell></root></mxGraphModel>'
                    }), '*');
                } else if (msg.event === 'autosave' || msg.event === 'save') {
                    os.ocState.drawioXml = msg.xml || os.ocState.drawioXml;
                    if (msg.event === 'save') os.ocExportDrawioSvg();
                } else if (msg.event === 'export' && msg.data && window.AetherVFS) {
                    const rec = await AetherVFS.putFile({
                        name: `Diagram-${Date.now()}.drawio.svg`,
                        mime: 'image/svg+xml',
                        kind: 'image',
                        icon: 'pen-tool',
                        folder: 'User Uploads',
                        dataUrl: msg.data,
                        imageUrl: msg.data,
                        content: os.ocState.drawioXml || '',
                        tags: ['diagram', 'drawio']
                    });
                    window.Notifications && window.Notifications.push('DIAGRAM SAVED', `Saved "${rec.name}" to File Explorer!`);
                }
            } catch (_) {}
        }
    });
})();
