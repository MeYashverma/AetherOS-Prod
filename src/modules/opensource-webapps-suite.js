// AetherOS — Open-Source Projects & Native WebApp Desktop Integrations:
// 1. Photopea Studio (Official window.postMessage ArrayBuffer VFS Load/Save Bridge)
// 2. Whiteboard Studio (explicit Excalidraw / diagrams.net / tldraw connections; editable XML bridge)
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
    const OC_ENGINES={
        excalidraw:{name:'Excalidraw',url:'https://excalidraw.com',description:'Sketch an idea',detail:'Freehand diagrams and hand-drawn shapes. Save and export using the editor’s own controls.',symbol:'sketch'},
        drawio:{name:'diagrams.net',url:'https://embed.diagrams.net/?embed=1&ui=dark&spin=1&proto=json',description:'Connect the dots',detail:'Structured diagrams. Import, download or save editable diagram XML through this workspace.',symbol:'nodes'},
        tldraw:{name:'tldraw',url:'https://www.tldraw.com',description:'Think without edges',detail:'A spatial canvas for notes and shapes. Account and collaboration features belong to the provider.',symbol:'canvas'}
    };
    const EMPTY_DIAGRAM='<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>';
    window.WindowContents.photopea = `
      <div id="pp-root" class="creative-studio">
        <div class="creative-toolbar" aria-label="Photopea controls"><button type="button" class="os-btn" onclick="os.ppStart()">Load / reload</button><label class="creative-import os-btn">Open file<input type="file" accept="image/*,.psd,.xcf,.sketch" aria-label="Open file in Photopea" onchange="os.ppImportFile(this.files[0]);this.value=''"></label><select class="creative-preset-select os-btn" aria-label="New canvas" data-pp-ready disabled onchange="const p=this.selectedOptions[0];if(p.dataset.width)os.ppNewDoc(Number(p.dataset.width),Number(p.dataset.height),p.dataset.name);this.value=''"><option value="">New canvas…</option>${[[1920,1080,'Wallpaper'],[1280,720,'Thumbnail'],[1024,1024,'Icon']].map(([w,h,n])=>`<option value="${n}" data-width="${w}" data-height="${h}" data-name="${n}">${n} · ${w} × ${h}</option>`).join('')}</select><a class="os-btn creative-external" href="https://www.photopea.com" target="_blank" rel="noopener noreferrer">Open Photopea ↗</a></div>
        <div class="creative-editor-space"><div class="creative-empty" id="pp-empty"><span class="creative-empty-mark" aria-hidden="true">↗</span><h3>Photopea Studio</h3><p>Third-party image editor. Files you open are shared with Photopea and follow its terms and privacy policy. AetherOS cannot inspect its canvas or guarantee availability.</p><button type="button" class="os-btn" onclick="os.ppStart()">Load Photopea</button></div><iframe id="pp-frame" title="Photopea third-party image editor" src="about:blank" hidden referrerpolicy="no-referrer" allow="clipboard-read; clipboard-write; fullscreen" data-preserve-surface></iframe></div>
        <footer class="creative-footer"><button type="button" class="os-btn" data-pp-ready disabled onclick="os.ppExportToVFS('png')">Export PNG to Files</button><button type="button" class="os-btn" data-pp-ready disabled onclick="os.ppExportToVFS('webp')">Export WebP to Files</button><a id="pp-download" class="os-btn" hidden>Download last export</a><span id="pp-status" role="status">Third-party editor not loaded · no files shared</span></footer>
      </div>
    `;
    window.WindowContents.whiteboard = `
      <div id="wb-canvas-root" class="creative-studio">
        <div class="creative-toolbar" aria-label="Whiteboard controls"><div class="creative-engine-tabs" aria-label="Choose a third-party editor">${Object.entries(OC_ENGINES).map(([id,e])=>`<button type="button" class="creative-engine os-btn" data-oc-eng="${id}" aria-pressed="false" title="${e.description}" onclick="os.ocSetEngine('${id}')">${e.name}</button>`).join('')}</div><button type="button" class="os-btn" onclick="os.ocReload()">Reload</button><a id="oc-external" class="os-btn creative-external" href="https://excalidraw.com" target="_blank" rel="noopener noreferrer">Open Excalidraw ↗</a></div>
        <div class="creative-editor-space"><div class="creative-empty" id="oc-empty"><span class="creative-empty-mark" aria-hidden="true">✳</span><h3>Whiteboard Studio</h3><p id="oc-provider-note">Select an editor above to connect to its site. Switching or reloading can discard unsaved work. Excalidraw and tldraw use their own save/export controls.</p></div><iframe id="oc-frame" title="Third-party whiteboard editor" src="about:blank" hidden referrerpolicy="no-referrer" allow="clipboard-read; clipboard-write; fullscreen" data-preserve-surface></iframe></div>
        <footer class="creative-footer" id="oc-diagram-tools"><label class="creative-import os-btn">Import diagram XML<input type="file" accept=".drawio,.xml" aria-label="Import diagrams.net XML" onchange="os.ocImportDiagram(this.files[0]);this.value=''"></label><button type="button" class="os-btn" id="oc-drawio-save" disabled onclick="os.ocSaveDiagram()">Save diagram to Files</button><button type="button" class="os-btn" id="oc-download" disabled onclick="os.ocDownloadDiagram()">Download diagram</button><span id="oc-status" role="status">Choose an editor · XML tools are diagrams.net only</span></footer>
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
        { id: 'groovesalad',  title: 'Groove Salad',       genre: 'ambient / downtempo',     listeners: null, lastPlaying: 'Track metadata unavailable',             description: 'A nicely chilled plate of ambient/downtempo beats and grooves.', image: 'https://api.somafm.com/img/groovesalad120.png' },
        { id: 'dronezone',    title: 'Drone Zone',         genre: 'ambient / space',         listeners: null, lastPlaying: 'Track metadata unavailable', description: 'Served best chilled, safe with most medications. Atmospheric textures.', image: 'https://api.somafm.com/img/dronezone120.png' },
        { id: 'defcon',       title: 'DEF CON Radio',      genre: 'electronic / hacker',     listeners: null, lastPlaying: 'Track metadata unavailable',            description: 'Music for Hacking. The DEF CON Year-Round Channel.', image: 'https://api.somafm.com/img/defcon120.png' },
        { id: 'vaporwaves',   title: 'Vaporwaves',         genre: 'vaporwave / future funk', listeners: null, lastPlaying: 'Track metadata unavailable',         description: 'All Vaporwave. All the time. Aesthetic mallsoft & future funk.', image: 'https://api.somafm.com/img/vaporwaves120.png' },
        { id: 'deepspaceone', title: 'Deep Space One',     genre: 'ambient / deep space',    listeners: null, lastPlaying: 'Track metadata unavailable',             description: 'Deep ambient electronic, experimental and space music.', image: 'https://api.somafm.com/img/deepspaceone120.png' },
        { id: 'secretagent',  title: 'Secret Agent',       genre: 'lounge / spy jazz',       listeners: null, lastPlaying: 'Track metadata unavailable',   description: 'The soundtrack for your stylish, mysterious, dangerous life.', image: 'https://api.somafm.com/img/secretagent120.png' },
        { id: 'u80s',         title: 'Underground 80s',    genre: '80s synthpop / new wave', listeners: null, lastPlaying: 'Track metadata unavailable',              description: 'Early 80s UK Synthpop and a bit of New Wave.', image: 'https://api.somafm.com/img/u80s120.png' },
        { id: 'synphaera',    title: 'Synphaera Radio',    genre: 'electronic / ambient',    listeners: null, lastPlaying: 'Track metadata unavailable',  description: 'Featuring the music from an independent electronic record label.', image: 'https://api.somafm.com/img/synphaera120.png' },
        { id: 'lush',         title: 'Lush',               genre: 'electronica / vocals',    listeners: null, lastPlaying: 'Track metadata unavailable',                     description: 'Sensuous and mellow female vocals, mostly with an electronic influence.', image: 'https://api.somafm.com/img/lush120.png' },
        { id: 'spacestation', title: 'Space Station Soma', genre: 'electronica / mid-tempo', listeners: null, lastPlaying: 'Track metadata unavailable',   description: 'Tune in, turn on, space out. Spaced-out ambient and mid-tempo electronica.', image: 'https://api.somafm.com/img/sss.gif' },
        { id: 'thetrip',      title: 'The Trip',           genre: 'electronic / prog house', listeners: null, lastPlaying: 'Track metadata unavailable',                      description: 'Progressive house / trance. Tip top tunes.', image: 'https://api.somafm.com/img/thetrip120.jpg' },
        { id: 'beatblender',  title: 'Beat Blender',       genre: 'deep house / chill',      listeners: null, lastPlaying: 'Track metadata unavailable',                      description: 'A late night blend of deep-house and downtempo chill.', image: 'https://api.somafm.com/img/blender120.png' },
        { id: 'indiepop',     title: 'Indie Pop Rocks!',   genre: 'indie / alternative',     listeners: null, lastPlaying: 'Track metadata unavailable',           description: 'New and classic favorite indie pop tracks.', image: 'https://api.somafm.com/img/indychick.jpg' },
        { id: 'sonicuniverse',title: 'Sonic Universe',     genre: 'jazz / avant-garde',      listeners: null, lastPlaying: 'Track metadata unavailable',    description: 'Transcending the world of jazz with eclectic, avant-garde takes.', image: 'https://api.somafm.com/img/sonicuniverse120.jpg' }
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
        // ── Explicit third-party editor connections and bounded file bridges ──
        ppState: {ready:false,loading:false,busy:false,awaitingExport:false,token:0,pending:null},
        ppStatus: text => {const el=document.getElementById('pp-status');if(el)el.textContent=text;},
        ppControls: () => {document.querySelectorAll('[data-pp-ready]').forEach(el=>el.disabled=!os.ppState.ready||os.ppState.busy);},
        initPhotopea: () => {os.ppControls();},
        ppStart: () => {
            const frame=document.getElementById('pp-frame');if(!frame)return;
            if((os.ppState.ready||os.ppState.loading)&&!window.confirm('Reload Photopea? Unsaved editor work may be lost.'))return;
            os.killPhotopea(false);const state=os.ppState;state.loading=true;frame.hidden=false;document.getElementById('pp-empty').hidden=true;
            const cfg={environment:{theme:2,vmode:0}};frame.src='https://www.photopea.com#'+encodeURIComponent(JSON.stringify(cfg));
            os.ppControls();os.ppStatus('Connecting to Photopea · waiting for its ready message');
            state.loadTimer=setTimeout(()=>{if(state.loading)os.ppStatus('No ready response from Photopea · it may be slow or blocked; try its external link');},20000);
        },
        killPhotopea: (unload=true) => {
            const s=os.ppState;s.token++;clearTimeout(s.loadTimer);clearTimeout(s.exportTimer);s.ready=false;s.loading=false;s.busy=false;s.awaitingExport=false;s.pending=null;
            if(s.downloadURL){URL.revokeObjectURL(s.downloadURL);s.downloadURL=null;}const download=document.getElementById('pp-download');if(download){download.hidden=true;download.removeAttribute('href');}
            const frame=document.getElementById('pp-frame');if(frame&&unload){frame.src='about:blank';frame.hidden=true;}os.ppControls();
        },
        ppSend: data => {const frame=document.getElementById('pp-frame');if(!frame?.contentWindow||!os.ppState.ready||os.ppState.busy)return false;frame.contentWindow.postMessage(data,'https://www.photopea.com');return true;},
        ppNewDoc: (width,height,name) => {
            const w=Number(width),h=Number(height);if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>16000000){os.ppStatus('Canvas must be positive whole pixels and at most 16 megapixels');return;}
            if(os.ppSend('app.documents.add('+w+','+h+',72,'+JSON.stringify(String(name||'Untitled').slice(0,120))+');'))os.ppStatus('Canvas request sent · confirm it in Photopea');else os.ppStatus('Wait for Photopea to be ready before creating a canvas');
        },
        ppQueueBuffer: buffer => {
            if(!(buffer instanceof ArrayBuffer)||!buffer.byteLength||buffer.byteLength>25*1024*1024)throw Error('Choose a non-empty file up to 25 MiB');
            if(os.ppState.busy)throw Error('Wait for the current export before opening a file');
            if(os.ppState.ready){os.ppSend(buffer);os.ppStatus('File sent to Photopea · use its own save controls to preserve layers');}
            else if(os.ppState.loading){os.ppState.pending=buffer;os.ppStatus('File queued in this tab · it will be shared once Photopea is ready');}
            else throw Error('Load Photopea before opening a file');
        },
        ppImportFile: async file => {
            if(!file)return;const token=os.ppState.token;
            try{if(!os.ppState.ready&&!os.ppState.loading)throw Error('Load Photopea first, then choose your file');if(file.size>25*1024*1024||!file.size)throw Error('Choose a non-empty file up to 25 MiB');const buffer=await file.arrayBuffer();if(token!==os.ppState.token)return;os.ppQueueBuffer(buffer);}catch(error){if(token===os.ppState.token)os.ppStatus('File not opened: '+error.message);}
        },
        ppOpenVfsImage: async id => {
            os.openWindow('photopea');const file=window.AetherVFS?.getCachedFile(id)||os.fmFindById?.(id);const url=file?.dataUrl;
            if(typeof url!=='string'||!/^data:image\/(png|jpeg|webp);base64,/i.test(url)||url.length>35*1024*1024){os.ppStatus('Open a local PNG, JPEG or WebP from Files, or download the remote image and use Open local file');return;}
            if(!os.ppState.ready&&!os.ppState.loading)os.ppStart();
            try{const bytes=atob(url.slice(url.indexOf(',')+1)),buffer=new Uint8Array(bytes.length);for(let i=0;i<bytes.length;i++)buffer[i]=bytes.charCodeAt(i);os.ppQueueBuffer(buffer.buffer);}catch(error){os.ppStatus('File not opened: '+error.message);}
        },
        ppExportToVFS: (fmt='png') => {
            const state=os.ppState;if(!['png','webp'].includes(fmt))return;if(!state.ready||state.busy){os.ppStatus('Wait for Photopea to be ready and finish its current export');return;}
            state.pendingFormat=fmt;state.awaitingExport=true;
            os.ppSend('app.activeDocument.saveToOE('+JSON.stringify(fmt)+');');state.busy=true;os.ppControls();os.ppStatus('Waiting for '+fmt.toUpperCase()+' export · an active document is required');
            state.exportTimer=setTimeout(()=>{state.awaitingExport=false;state.busy=false;state.ready=false;os.ppControls();os.ppStatus('No export received · preserve work using Photopea’s controls, then reload the editor before retrying');},20000);
        },
        ppReceive: async event => {
            const s=os.ppState,frame=document.getElementById('pp-frame');if(event.origin!=='https://www.photopea.com'||event.source!==frame?.contentWindow)return;
            if(event.data==='done'&&s.loading){s.loading=false;s.ready=true;clearTimeout(s.loadTimer);os.ppControls();os.ppStatus('Photopea ready · files opened here are shared with its editor');if(s.pending){const buffer=s.pending;s.pending=null;os.ppQueueBuffer(buffer);}return;}
            if(!(event.data instanceof ArrayBuffer)||!s.awaitingExport)return;
            s.awaitingExport=false;clearTimeout(s.exportTimer);const token=s.token;
            try{
                if(!event.data.byteLength||event.data.byteLength>25*1024*1024)throw Error('Export exceeds the 25 MiB limit or is empty');
                const fmt=s.pendingFormat,mime='image/'+fmt,bytes=new Uint8Array(event.data);
                if(fmt==='png'&&!(bytes.length>=8&&bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10)||fmt==='webp'&&!(String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP'))throw Error('Export did not match the requested image format');
                if(s.downloadURL)URL.revokeObjectURL(s.downloadURL);s.downloadURL=URL.createObjectURL(new Blob([event.data],{type:mime}));const name='Photopea-'+Date.now()+'.'+fmt,download=document.getElementById('pp-download');if(download){download.href=s.downloadURL;download.download=name;download.hidden=false;}
                if(!window.AetherVFS)throw Error('Files service unavailable');const dataUrl=arrayBufferToBase64DataUrl(event.data,mime);
                const rec=await AetherVFS.putFile({name,mime,sizeBytes:event.data.byteLength,kind:'image',icon:'layers',folder:'User Uploads',dataUrl,imageUrl:dataUrl,content:'Exported from Photopea',tags:['photopea',fmt]});
                if(token===s.token)os.ppStatus(rec?.persistence==='indexeddb'?'Export saved to Files · PNG/WebP does not preserve editable layers':'Session-only file copy · download the export as a backup');
            }catch(error){if(token===s.token)os.ppStatus('Export not saved: '+error.message+(s.downloadURL?' · Download last export is still available':''));}
            finally{if(token===s.token){s.busy=false;os.ppControls();}}
        },

        ocState: {engine:null,ready:false,drawioXml:'',token:0},
        ocStatus: text => {const el=document.getElementById('oc-status');if(el)el.textContent=text;},
        initWhiteboard: () => {os.ocControls();},
        ocControls: () => {for(const id of ['oc-drawio-save','oc-download']){const el=document.getElementById(id);if(el)el.disabled=os.ocState.engine!=='drawio'||!os.ocState.drawioXml||os.ocState.saving;}},
        killWhiteboard: () => {const s=os.ocState;s.token++;s.importToken=(s.importToken||0)+1;s.ready=false;s.engine=null;s.saving=false;clearTimeout(s.timer);const frame=document.getElementById('oc-frame');if(frame){frame.onload=null;frame.src='about:blank';frame.hidden=true;}},
        ocSetEngine: (engine,reload=false) => {
            if(!Object.hasOwn(OC_ENGINES,engine))return;const s=os.ocState;if(s.engine===engine&&!reload)return;
            if(s.engine&&!window.confirm('Switch or reload editor? Unsaved work inside the editor may be lost. Download or export it first.'))return;
            const frame=document.getElementById('oc-frame');if(!frame)return;clearTimeout(s.timer);s.token++;s.saving=false;s.importToken=(s.importToken||0)+1;s.ready=false;s.engine=engine;const turn=s.token,e=OC_ENGINES[engine];
            document.querySelectorAll('[data-oc-eng]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.ocEng===engine)));
            document.getElementById('oc-external').href=e.url;document.getElementById('oc-external').textContent='Open '+e.name+' ↗';document.getElementById('oc-provider-note').textContent=e.detail;
            document.getElementById('oc-empty').hidden=true;frame.hidden=false;frame.onload=()=>{if(turn===s.token&&!s.ready)os.ocStatus(e.name+' frame loaded · editor readiness and saving are not verified');};frame.src=e.url;os.ocControls();os.ocStatus('Connecting to '+e.name+' · third-party editor');
            s.timer=setTimeout(()=>{if(turn===s.token&&!s.ready)os.ocStatus('Cannot confirm '+e.name+' is ready · use Open selected editor if blank or blocked');},20000);
        },
        ocReload: () => {if(os.ocState.engine)os.ocSetEngine(os.ocState.engine,true);else os.ocStatus('Choose an editor first');},
        ocValidateXml: xml => {
            if(typeof xml!=='string'||!xml.trim()||xml.length>2*1024*1024||/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('Use diagram XML up to 2 MiB, without a document type or external entities');
            const doc=new DOMParser().parseFromString(xml,'application/xml');if(doc.querySelector('parsererror')||!['mxfile','mxGraphModel'].includes(doc.documentElement.nodeName))throw Error('Expected a diagrams.net mxfile or mxGraphModel document');return xml;
        },
        ocImportDiagram: async file => {
            if(!file)return;const s=os.ocState,turn=s.token,request=s.importToken=(s.importToken||0)+1;
            try{if(s.engine!=='drawio')throw Error('Select diagrams.net before importing');if(file.size>2*1024*1024)throw Error('Diagram must be at most 2 MiB');const xml=os.ocValidateXml(await file.text());if(turn!==s.token||request!==s.importToken)return;
                if(s.drawioXml&&!window.confirm('Replace the current diagram with this file?'))return;s.drawioXml=xml;if(s.ready)document.getElementById('oc-frame').contentWindow.postMessage(JSON.stringify({action:'load',autosave:1,xml}),'https://embed.diagrams.net');os.ocControls();os.ocStatus(s.ready?'Diagram sent to editor · download or save a backup':'Diagram queued in this tab · waiting for diagrams.net');
            }catch(error){if(turn===s.token&&request===s.importToken)os.ocStatus('Diagram not imported: '+error.message);}
        },
        ocDownloadDiagram: () => {
            try{const xml=os.ocValidateXml(os.ocState.drawioXml),url=URL.createObjectURL(new Blob([xml],{type:'application/xml'}));const a=document.createElement('a');a.href=url;a.download='AetherOS-diagram.drawio';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);os.ocStatus('Diagram XML downloaded · keep this editable backup');}catch(error){os.ocStatus(error.message);}
        },
        ocSaveDiagram: async () => {
            const s=os.ocState;if(s.engine!=='drawio'||s.saving)return;const turn=s.token;
            try{const xml=os.ocValidateXml(s.drawioXml);s.saving=true;os.ocControls();if(!window.AetherVFS)throw Error('Files service unavailable');const rec=await AetherVFS.putFile({name:'Diagram-'+Date.now()+'.drawio',mime:'application/xml',kind:'note',icon:'pen-tool',folder:'User Uploads',content:xml,tags:['diagram','drawio']});if(turn===s.token)os.ocStatus(rec?.persistence==='indexeddb'?(s.drawioXml===xml?'Editable diagram saved to Files':'Earlier diagram snapshot saved · newer edits still need saving'):'Session-only file copy · download XML as a backup');}catch(error){if(turn===s.token)os.ocStatus('Save failed: '+error.message+' · diagram remains downloadable');}finally{if(turn===s.token){s.saving=false;os.ocControls();}}
        },
        ocExportDrawioSvg: () => os.ocSaveDiagram(),
        ocReceive: async event => {
            const s=os.ocState,frame=document.getElementById('oc-frame');if(s.engine!=='drawio'||event.origin!=='https://embed.diagrams.net'||event.source!==frame?.contentWindow||typeof event.data!=='string'||event.data.length>2*1024*1024+65536)return;
            try{const msg=JSON.parse(event.data);if(msg.event==='init'){s.ready=true;clearTimeout(s.timer);frame.contentWindow.postMessage(JSON.stringify({action:'load',autosave:1,xml:s.drawioXml||EMPTY_DIAGRAM}),'https://embed.diagrams.net');os.ocStatus('diagrams.net connected · edits are session-only until saved or downloaded');}
                else if((msg.event==='autosave'||msg.event==='save')&&s.ready){s.drawioXml=os.ocValidateXml(msg.xml);s.importToken=(s.importToken||0)+1;os.ocControls();os.ocStatus('Diagram updated in session · save or download a backup');if(msg.event==='save')await os.ocSaveDiagram();}
            }catch(error){os.ocStatus('Diagram update rejected: '+error.message);}
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
                                listeners: null,
                                lastPlaying: 'Track metadata unavailable',
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
                                    <span class="px-1.5 py-0.5 rounded-full bg-black/50 border border-white/10 font-mono text-[9.5px] text-emerald-300 shrink-0">${Number.isFinite(ch.listeners) ? ch.listeners.toLocaleString() + ' listeners' : 'Listeners unknown'}</span>
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

    // Only expected source windows and exact origins are accepted by each bridge.
    window.addEventListener('message',event=>{os.ppReceive(event);os.ocReceive(event);});
})();
