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
        if (window._aetherStudioCtx.state === 'suspended') window._aetherStudioCtx.resume().catch(()=>{if(window.os?.synthStatus)os.synthStatus('Audio blocked · interact with the app to enable playback');});
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
        { id: 'thermal', label: 'Thermal look' },
        { id: 'popart',  label: 'Pop Art' },
        { id: 'mirror',  label: 'Mirror' },
        { id: 'xray',    label: 'X-ray look' },
        { id: 'noir',    label: 'Film Noir' },
        { id: 'sepia',   label: 'Vintage' },
        { id: 'neon',    label: 'Cyber Glow' },
        { id: 'emerald', label: 'Green glow' }
    ];

    window.WindowContents.photobooth = `
      <div class="pb-studio" id="pb-root">
        <header class="studio-app-heading"><div><span class="studio-eyebrow">LIGHT / COLOUR / A MOMENT</span><h2>Make it a keeper.</h2><p>Local camera, your image, or a clearly labelled demo. Nothing is uploaded.</p></div><span id="pb-status" role="status">Captures stay in this tab until downloaded or saved to Files</span></header>
        <div class="pb-toolbar"><span id="pb-cam-dot" data-source="demo"></span><strong id="pb-cam-status">Procedural demo · camera off</strong><button type="button" id="pb-cam-btn" class="os-btn" onclick="os.pbToggleWebcam()">Enable camera</button><label class="pb-import os-btn">Open image<input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Open local image" onchange="os.pbImportImage(this.files[0]);this.value=''"></label><button type="button" class="os-btn" onclick="os.pbUseDemo()">Demo scene</button></div>
        <div class="pb-workspace"><div class="pb-viewfinder" data-preserve-surface><video id="pb-video" playsinline muted hidden></video><canvas id="pb-canvas" width="720" height="460" onclick="os.pbCanvasClick(event)" aria-label="Photo preview. Choose effects using the buttons beside it."></canvas><span id="pb-source-label" class="pb-source-label">DEMO / NOT A CAMERA</span><div id="pb-flash" class="pb-flash" aria-hidden="true"></div><div id="pb-countdown" class="pb-countdown hidden" aria-live="polite"></div></div><aside class="pb-effects"><span class="pb-eyebrow">COLOUR LAB</span><h3>Find your look.</h3><p>Creative filters, not thermal, medical X-ray or night-vision imaging.</p><div class="pb-effect-list">${PB_EFFECTS.map(fx=>`<button type="button" data-pb-effect="${fx.id}" class="pb-effect-btn" aria-pressed="${fx.id==='normal'}" onclick="os.pbSetEffect('${fx.id}')"><span class="pb-effect-swatch pb-swatch-${fx.id}" aria-hidden="true"></span>${fx.label}</button>`).join('')}</div><label class="pb-mirror"><input id="pb-mirror" type="checkbox" checked onchange="os.pbState.mirror=this.checked"> Mirror camera / image</label><button type="button" id="pb-grid-btn" class="os-btn" aria-pressed="false" onclick="os.pbToggleGrid()">Compare all effects</button></aside></div>
        <div class="pb-capture-bar"><div class="os-segmented"><button type="button" data-pb-mode="single" aria-pressed="true" class="os-seg-btn active" onclick="os.pbSetShotMode('single')">Single</button><button type="button" data-pb-mode="strip" aria-pressed="false" class="os-seg-btn" onclick="os.pbSetShotMode('strip')">Four-pose strip</button></div><button type="button" id="pb-shutter-btn" class="pb-shutter" aria-label="Capture photo" onclick="os.pbTriggerCapture()"><i data-lucide="camera" aria-hidden="true"></i></button><label>Timer <select id="pb-timer" aria-label="Capture countdown"><option value="3">3 seconds</option><option value="0">Off</option></select></label><button type="button" id="pb-cancel" class="os-btn" disabled onclick="os.pbCancelCapture()">Cancel</button></div>
        <div class="pb-tray-heading"><span>SESSION GALLERY / LAST 12</span><span>Download or save before reloading · removing a thumbnail does not delete Files copies</span></div><div id="pb-strip-tray" class="pb-strip-tray" tabindex="0" aria-label="Captured photos, scroll horizontally"></div>
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
      <div id="synth-root" class="synth-studio">
        <header class="studio-app-heading"><div><span class="studio-eyebrow">OSCILLATE / SEQUENCE / EXPLORE</span><h2>A little room for sound.</h2><p>Browser-synthesised instruments. Start at a low volume.</p></div><span id="synth-status" role="status">Audio starts only when you play · pattern stays in this tab until saved</span></header>
        <div class="synth-rack"><label>Instrument<select id="synth-patch" onchange="os.synthSetPatch(this.value)">${Object.entries(SYNTH_PATCHES).map(([id,p])=>`<option value="${id}">${p.label}</option>`).join('')}</select></label><label>Low-pass cutoff <output id="synth-cutoff-lbl">3800 Hz</output><input id="synth-cutoff" aria-label="Low-pass cutoff" type="range" min="300" max="7500" value="3800" oninput="os.synthSetCutoff(this.value)"></label><label>Output <output id="synth-volume-lbl">35%</output><input id="synth-volume" aria-label="Output volume" type="range" min="0" max="80" value="35" oninput="os.synthSetVolume(this.value)"></label><button class="os-btn" type="button" onclick="os.synthPanic()">All sound off</button></div>
        <div class="synth-signal"><div><span class="synth-eyebrow">LIVE OUTPUT / TIME DOMAIN</span><p id="synth-signal-label">Silence is a perfectly good starting point.</p></div><canvas id="synth-scope" data-preserve-surface width="680" height="100" aria-label="Actual synthesiser output waveform"></canvas></div>
        <section class="synth-machine" aria-label="Sixteen step drum sequencer"><div class="synth-transport"><button type="button" id="synth-seq-btn" class="os-btn" aria-pressed="false" onclick="os.synthToggleSequencer()">Play beat</button><label><output id="synth-bpm-lbl">96 BPM</output><input id="synth-bpm" aria-label="Tempo" type="range" min="40" max="200" value="96" oninput="os.synthSetBpm(this.value)"></label><span id="synth-step-label">16 STEPS / 4 BEATS</span><div class="synth-presets"><span>Try a pattern</span>${['lofi','house','trap'].map(id=>`<button type="button" class="os-btn" onclick="os.synthLoadGroove('${id}')">${id==='lofi'?'Lo-Fi':id==='house'?'House':'Trap'}</button>`).join('')}<button type="button" class="os-btn" onclick="os.synthClearPattern()">Clear</button></div></div><div class="synth-grid-scroll" tabindex="0" aria-label="Scroll the drum sequencer horizontally"><div id="synth-seq-grid"></div></div></section>
        <section class="synth-piano"><div class="synth-piano-heading"><div><span class="synth-eyebrow">PLAY / MUSICAL TYPING</span><p>Use A W S E D F T G Y H U J K O L, or tap the keys. Notes are short one-shots.</p></div><div class="synth-octave"><button type="button" class="os-btn" aria-label="Lower octave" onclick="os.synthShiftOctave(-1)">−</button><span id="synth-oct-lbl">C4</span><button type="button" class="os-btn" aria-label="Higher octave" onclick="os.synthShiftOctave(1)">+</button><button type="button" class="os-btn" onclick="os.synthPlayChordDemo()">Play chord</button></div></div><div class="synth-key-scroll"><div id="synth-keys-host" data-preserve-surface></div></div></section>
        <footer class="synth-project"><button type="button" class="os-btn" onclick="os.synthSavePattern()">Save in browser</button><button type="button" class="os-btn" onclick="os.synthRestorePattern()">Load saved</button><button type="button" class="os-btn" onclick="os.synthExportPattern()">Export pattern</button><label class="synth-import os-btn">Import pattern<input type="file" accept=".json,application/json" aria-label="Import SynthPad pattern" onchange="os.synthImportPattern(this.files[0]);this.value=''"></label><span>Pattern JSON, not an audio recording · closing stops playback</span></footer>
      </div>
    `;

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
            busy: false, mirror:true, captureID:0, image:null, requesting:false
        },

        initPhotoBooth: () => {
            if (!os.pbState.offscreen) {
                const c = document.createElement('canvas');
                c.width = 720; c.height = 460;
                os.pbState.offscreen = c;
            }
            os.pbState.busy=false;os.pbState.requesting=false;os.pbState.frameSource=null;os.pbSourceUI();os.pbSetEffect(os.pbState.effect);os.pbSetShotMode(os.pbState.shotMode);
            const mirror=document.getElementById('pb-mirror');if(mirror)mirror.checked=os.pbState.mirror;
            os.pbRenderTray();
            os.pbStartLoop();
            const root = document.getElementById('pb-root');
            if (root && window.lucide) lucide.createIcons({ root });
        },

        pbStatus: message => {const el=document.getElementById('pb-status');if(el)el.textContent=message;},
        pbSourceUI: () => {
            const state=os.pbState,source=state.webcamStream?'camera':state.image?'image':'demo',status=document.getElementById('pb-cam-status'),button=document.getElementById('pb-cam-btn'),dot=document.getElementById('pb-cam-dot'),label=document.getElementById('pb-source-label');
            if(status)status.textContent=state.requesting?'Waiting for camera permission…':source==='camera'?'Camera active · local preview':source==='image'?'Local image · camera off':'Procedural demo · camera off';
            if(button)button.textContent=state.requesting?'Cancel camera request':source==='camera'?'Stop camera':'Enable camera';
            if(dot)dot.dataset.source=state.requesting?'pending':source;if(label)label.textContent=source==='camera'?'LOCAL CAMERA':source==='image'?'LOCAL IMAGE / NOT LIVE':'DEMO / NOT A CAMERA';
            const shutter=document.getElementById('pb-shutter-btn');if(shutter)shutter.disabled=state.requesting||state.busy;
        },
        pbCancelCapture: (report=true) => {
            os.pbState.captureID++;clearTimeout(os.pbState.waitTimer);os.pbState.waitResolve?.(false);os.pbState.waitResolve=null;os.pbState.busy=false;
            const countdown=document.getElementById('pb-countdown');if(countdown)countdown.classList.add('hidden');const cancel=document.getElementById('pb-cancel');if(cancel)cancel.disabled=true;
            os.pbSourceUI();if(report)os.pbStatus('Capture cancelled · no new photo saved');
        },
        pbStopCamera: () => {
            os.pbState.cameraRequest=(os.pbState.cameraRequest||0)+1;os.pbState.requesting=false;
            os.pbState.webcamStream?.getTracks().forEach(track=>track.stop());os.pbState.webcamStream=null;os.pbState.frameSource=null;
            const video=document.getElementById('pb-video');if(video){video.pause();video.srcObject=null;}os.pbSourceUI();
        },
        killPhotoBooth: () => {
            os.pbCancelCapture(false);os.pbStopCamera();if(os.pbState.raf)cancelAnimationFrame(os.pbState.raf);os.pbState.raf=null;
            os.pbState.imageRequest=(os.pbState.imageRequest||0)+1;
        },
        pbToggleWebcam: async () => {
            os.pbState.imageRequest=(os.pbState.imageRequest||0)+1;os.pbCancelCapture(false);
            if(os.pbState.webcamStream||os.pbState.requesting){os.pbStopCamera();return;}
            if(!navigator.mediaDevices?.getUserMedia){os.pbStatus('Camera unavailable · use an image or the labelled demo');return;}
            const request=os.pbState.cameraRequest=(os.pbState.cameraRequest||0)+1;os.pbState.requesting=true;os.pbSourceUI();
            try{
                const stream=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:1280},height:{ideal:720}},audio:false});
                if(request!==os.pbState.cameraRequest||!document.getElementById('pb-video')||!SystemState.windows.photobooth?.isOpen){stream.getTracks().forEach(t=>t.stop());return;}
                os.pbState.webcamStream=stream;const video=document.getElementById('pb-video');video.srcObject=stream;await video.play();
                if(request!==os.pbState.cameraRequest){stream.getTracks().forEach(t=>t.stop());return;}
                os.pbState.requesting=false;os.pbSourceUI();os.pbStatus('Camera frames stay local · microphone is never requested');
            }catch(error){if(request!==os.pbState.cameraRequest)return;os.pbStopCamera();os.pbStatus(error.name==='NotAllowedError'?'Camera permission denied · no camera is active':'Camera could not start · no camera is active');}
        },
        pbUseDemo: () => {os.pbCancelCapture(false);os.pbStopCamera();os.pbState.imageRequest=(os.pbState.imageRequest||0)+1;os.pbState.image?.close?.();os.pbState.image=null;os.pbSourceUI();os.pbStatus('Procedural demo selected · captures are not camera photographs');},
        pbImportImage: async file => {
            if(!file)return;os.pbCancelCapture(false);const token=os.pbState.imageRequest=(os.pbState.imageRequest||0)+1;
            try{
                if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10485760)throw Error('Choose a PNG, JPEG or WebP up to 10 MiB');
                if(!window.createImageBitmap)throw Error('Image import is unavailable in this browser');
                const image=await createImageBitmap(file);
                if(token!==os.pbState.imageRequest||!document.getElementById('pb-canvas')){image.close();return;}
                if(image.width*image.height>16000000){image.close();throw Error('Image exceeds 16 megapixels');}
                os.pbStopCamera();os.pbState.image?.close?.();os.pbState.image=image;os.pbSourceUI();os.pbStatus('Local image loaded · centre-cropped to the capture frame · nothing uploaded');
            }catch(error){if(token===os.pbState.imageRequest)os.pbStatus('Image not opened: '+error.message);}
        },
        pbDrawSource: (ctx,source,width,height) => {
            const sw=source.videoWidth||source.width,sh=source.videoHeight||source.height,scale=Math.max(width/sw,height/sh),cropW=width/scale,cropH=height/scale;
            ctx.save();if(os.pbState.mirror){ctx.translate(width,0);ctx.scale(-1,1);}ctx.drawImage(source,(sw-cropW)/2,(sh-cropH)/2,cropW,cropH,0,0,width,height);ctx.restore();
        },
        pbSetEffect: id => {
            if(os.pbState.busy)return;
            if(!PB_EFFECTS.some(effect=>effect.id===id))return;os.pbState.effect=id;os.pbState.gridMode=false;
            for(const button of document.querySelectorAll('[data-pb-effect]'))button.setAttribute('aria-pressed',String(button.dataset.pbEffect===id));
            const compare=document.getElementById('pb-grid-btn');if(compare)compare.setAttribute('aria-pressed','false');
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
                    os.pbDrawSource(octx,video,off.width,off.height);
                } else if(os.pbState.image) {
                    os.pbDrawSource(octx,os.pbState.image,off.width,off.height);
                } else {
                    // Vivid animated procedural scene so all 9 Photo Booth filters shine immediately!
                    const t = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?0:(ts || performance.now()) * 0.0014;
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

                os.pbState.frameSource=os.pbState.webcamStream&&video?.readyState>=2?'camera':os.pbState.image?'image':'demo';
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
            if(os.pbState.busy)return;
            os.pbState.gridMode = !os.pbState.gridMode;
            const btn = document.getElementById('pb-grid-btn');
            if(btn)btn.setAttribute('aria-pressed',String(os.pbState.gridMode));
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
            if(picked)os.pbSetEffect(picked.id);
        },

        pbSetShotMode: (mode) => {
            if(os.pbState.busy)return;
            os.pbState.shotMode = mode === 'strip' ? 'strip' : 'single';
            document.querySelectorAll('[data-pb-mode]').forEach((b) => {
                b.classList.toggle('active', b.getAttribute('data-pb-mode') === os.pbState.shotMode);
                b.setAttribute('aria-pressed',String(b.getAttribute('data-pb-mode')===os.pbState.shotMode));
            });
        },

        pbSnapFrame: (effect=os.pbState.effect) => {
            const state=os.pbState,video=document.getElementById('pb-video');
            if(state.webcamStream){
                if(!video||video.readyState<2||state.webcamStream.getTracks().some(track=>track.readyState==='ended'))throw Error('Camera frame unavailable; no demo was captured in its place');
                os.pbDrawSource(state.offscreen.getContext('2d'),video,720,460);
            }else if(state.image){os.pbDrawSource(state.offscreen.getContext('2d'),state.image,720,460);}
            const flash = document.getElementById('pb-flash');
            if (flash) {
                flash.style.opacity = '1';
                setTimeout(() => { flash.style.opacity = '0'; }, 140);
            }
            playShutterSound('shutter');
            const out = document.createElement('canvas');
            out.width = 720; out.height = 460;
            drawPbEffectTile(out.getContext('2d'), os.pbState.offscreen, effect, 0, 0, 720, 460);
            return out;
        },

        pbWait: (ms,token) => new Promise(resolve=>{os.pbState.waitResolve=resolve;os.pbState.waitTimer=setTimeout(()=>{os.pbState.waitResolve=null;resolve(token===os.pbState.captureID);},ms);}),
        pbTriggerCapture: async () => {
            const state=os.pbState;if(state.busy||state.requesting||!state.offscreen)return;
            const expected=state.webcamStream?'camera':state.image?'image':'demo';if(state.frameSource!==expected){os.pbStatus('Waiting for a fresh '+expected+' preview frame');return;}
            const video=document.getElementById('pb-video');if(state.webcamStream&&(!video||video.readyState<2)){os.pbStatus('Camera is not ready · wait for the live preview');return;}
            const token=++state.captureID,effect=state.effect,mode=state.shotMode,source=state.webcamStream?'camera':state.image?'image':'demo';state.busy=true;state.gridMode=false;os.pbSourceUI();
            const cancel=document.getElementById('pb-cancel');if(cancel)cancel.disabled=false;
            const countdown=document.getElementById('pb-countdown'),useTimer=document.getElementById('pb-timer')?.value!=='0';
            const count=async()=>{if(!useTimer)return true;if(countdown)countdown.classList.remove('hidden');for(let n=3;n>0;n--){if(countdown)countdown.textContent=String(n);if(!await os.pbWait(1000,token))return false;}if(countdown)countdown.classList.add('hidden');return token===state.captureID;};
            try{
                let output;
                if(mode==='strip'){
                    output=document.createElement('canvas');output.width=380;output.height=980;const ctx=output.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,380,980);
                    for(let i=0;i<4;i++){os.pbStatus('Pose '+(i+1)+' / 4 · '+source);if(!await count())return;if(i>0&&!useTimer&&!await os.pbWait(800,token))return;if(token!==state.captureID)return;ctx.drawImage(os.pbSnapFrame(effect),20,20+i*235,340,220);}
                }else{if(!await count()||token!==state.captureID)return;output=os.pbSnapFrame(effect);}
                if(token!==state.captureID)return;
                const item={id:'pb-'+(window.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)),dataUrl:output.toDataURL('image/png'),effect,source,mode,time:new Date().toLocaleTimeString()};
                state.photos.unshift(item);state.photos=state.photos.slice(0,12);os.pbRenderTray();os.pbStatus((source==='demo'?'Demo image captured':source==='image'?'Image effect captured':'Photo captured')+' · download or save to Files · gallery holds the last 12');
            }catch(error){if(token===state.captureID)os.pbStatus('Capture failed: '+error.message);}
            finally{if(token===state.captureID){state.busy=false;if(cancel)cancel.disabled=true;if(countdown)countdown.classList.add('hidden');os.pbSourceUI();}}
        },
        pbSavePhoto: async id => {
            const item=os.pbState.photos.find(photo=>photo.id===id);if(!item||item.saving||item.saved)return;item.saving=true;os.pbRenderTray();
            try{if(!window.AetherVFS)throw Error('Files service unavailable');const record=await AetherVFS.putFile({name:item.id+'.png',mime:'image/png',kind:'image',icon:'aperture',folder:'User Uploads',dataUrl:item.dataUrl,imageUrl:item.dataUrl,content:'Photo Booth '+item.source+' capture · '+item.effect,tags:['photobooth',item.source,item.effect]});if(!record)throw Error('No file record returned');item.saved=record.persistence==='indexeddb';os.pbStatus(item.saved?'Image saved to Files':'Session-only file copy · download a backup');}
            catch(error){os.pbStatus('Save failed: '+error.message+' · the capture is still available to download');}
            finally{item.saving=false;os.pbRenderTray();}
        },
        pbRenderTray: () => {
            const tray=document.getElementById('pb-strip-tray');if(!tray)return;const left=tray.scrollLeft;tray.replaceChildren();
            if(!os.pbState.photos.length){const empty=document.createElement('p');empty.className='pb-gallery-empty';empty.textContent='Your session gallery is empty. Capture a photo, an imported image effect, or the labelled demo.';tray.append(empty);return;}
            for(const photo of os.pbState.photos){
                const card=document.createElement('article');card.className='pb-photo-card';const image=document.createElement('img');image.src=photo.dataUrl;image.alt=photo.source+' · '+photo.effect+' · '+photo.mode;const caption=document.createElement('p');caption.textContent=photo.source+' / '+photo.effect+' · '+photo.time;const actions=document.createElement('div');
                const download=document.createElement('a');download.href=photo.dataUrl;download.download=photo.id+'.png';download.textContent='Download';download.className='os-btn';
                const save=document.createElement('button');save.type='button';save.className='os-btn';save.textContent=photo.saving?'Saving…':photo.saved?'Saved':'Save to Files';save.disabled=!!(photo.saving||photo.saved);save.addEventListener('click',()=>os.pbSavePhoto(photo.id));
                const remove=document.createElement('button');remove.type='button';remove.className='os-btn';remove.textContent='Remove';remove.setAttribute('aria-label','Remove '+photo.source+' capture from session gallery');remove.addEventListener('click',()=>{os.pbState.photos=os.pbState.photos.filter(item=>item.id!==photo.id);os.pbRenderTray();});actions.append(download,save,remove);card.append(image,caption,actions);tray.append(card);
            }tray.scrollLeft=left;
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
            volume: .35, sources: new Set(), timers: new Set(), nextTime:0,
            grid: Array.from({length:4},()=>Array(16).fill(0))
        },

        synthStatus: message => {const el=document.getElementById('synth-status');if(el)el.textContent=message;},
        initSynthStudio: () => {os.synthSyncControls();os.synthRenderKeys();os.synthRenderSequencer();os.synthStartScope();},
        synthSyncControls: () => {
            const s=os.synthState;for(const [id,value] of Object.entries({'synth-patch':s.patch,'synth-cutoff':s.cutoff,'synth-volume':Math.round(s.volume*100),'synth-bpm':s.bpm})){const el=document.getElementById(id);if(el)el.value=value;}
            for(const [id,text] of Object.entries({'synth-cutoff-lbl':s.cutoff+' Hz','synth-volume-lbl':Math.round(s.volume*100)+'%','synth-bpm-lbl':s.bpm+' BPM','synth-oct-lbl':'C'+(4+s.octaveOffset)})){const el=document.getElementById(id);if(el)el.textContent=text;}
        },
        killSynthStudio: () => {os.synthState.importToken=(os.synthState.importToken||0)+1;os.synthPanic(false);if(os.synthState.scopeRaf)cancelAnimationFrame(os.synthState.scopeRaf);os.synthState.scopeRaf=null;},
        synthStopBeat: () => {
            const s=os.synthState;clearInterval(s.seqTimer);s.seqTimer=null;s.playing=false;s.step=0;
            for(const timer of s.timers)clearTimeout(timer);s.timers.clear();
            const button=document.getElementById('synth-seq-btn');if(button){button.textContent='Play beat';button.setAttribute('aria-pressed','false');}
            document.querySelectorAll('[data-seq-cell]').forEach(el=>el.classList.remove('is-current'));
            const label=document.getElementById('synth-step-label');if(label)label.textContent='16 STEPS / 4 BEATS';
        },
        synthPanic: (report=true) => {
            os.synthStopBeat();for(const source of os.synthState.sources){try{source.stop();}catch{}}os.synthState.sources.clear();
            if(report)os.synthStatus('All sound stopped · pattern kept');
        },
        synthTrackSource: (source,nodes=[]) => {const s=os.synthState;s.sources.add(source);source.onended=()=>{s.sources.delete(source);try{source.disconnect();nodes.forEach(node=>node.disconnect());}catch{}};},
        _synthEnsureMaster: () => {
            try{
                const ctx=getAudioCtx();if(!ctx)throw Error('Web Audio is unavailable');
                if(!os.synthState.analyser){const an=ctx.createAnalyser(),gain=ctx.createGain(),limiter=ctx.createDynamicsCompressor();an.fftSize=256;gain.gain.value=os.synthState.volume;gain.connect(limiter);limiter.connect(an);an.connect(ctx.destination);os.synthState.analyser=an;os.synthState.master=gain;}
                if(ctx.state==='suspended')os.synthStatus('Audio is resuming · press play again if it stays silent');
                return {ctx,out:os.synthState.master};
            }catch(error){os.synthStatus('Audio unavailable: '+error.message);return null;}
        },
        synthSetPatch: value => {if(Object.hasOwn(SYNTH_PATCHES,value))os.synthState.patch=value;},
        synthSetCutoff: value => {const n=Number(value);if(!Number.isFinite(n))return;os.synthState.cutoff=Math.max(300,Math.min(7500,n));os.synthSyncControls();},
        synthSetVolume: value => {const n=Number(value);if(!Number.isFinite(n))return;os.synthState.volume=Math.max(0,Math.min(.8,n/100));if(os.synthState.master)os.synthState.master.gain.setTargetAtTime(os.synthState.volume,getAudioCtx().currentTime,.015);os.synthSyncControls();},
        synthPattern: () => {const s=os.synthState;return {format:'aether-synth-pattern',version:1,patch:s.patch,bpm:s.bpm,cutoff:s.cutoff,octaveOffset:s.octaveOffset,grid:s.grid.map(row=>[...row])};},
        synthApplyPattern: data => {
            if(data?.format!=='aether-synth-pattern'||data.version!==1||!Object.hasOwn(SYNTH_PATCHES,data.patch)||!Number.isFinite(data.bpm)||data.bpm<40||data.bpm>200||!Number.isFinite(data.cutoff)||data.cutoff<300||data.cutoff>7500||!Number.isInteger(data.octaveOffset)||Math.abs(data.octaveOffset)>2||!Array.isArray(data.grid)||data.grid.length!==4||!data.grid.every(row=>Array.isArray(row)&&row.length===16&&row.every(n=>n===0||n===1)))throw Error('Not a valid SynthPad v1 pattern');
            os.synthState.importToken=(os.synthState.importToken||0)+1;os.synthPanic(false);Object.assign(os.synthState,{patch:data.patch,bpm:data.bpm,cutoff:data.cutoff,octaveOffset:data.octaveOffset,grid:data.grid.map(row=>[...row])});os.synthSyncControls();os.synthRenderSequencer();os.synthStatus('Pattern loaded · playback stopped');
        },
        synthSavePattern: () => {try{localStorage.setItem('aether-synth-pattern-v1',JSON.stringify(os.synthPattern()));os.synthStatus('Pattern saved in this browser · export a backup');}catch{os.synthStatus('Storage unavailable · pattern is session-only; export a backup');}},
        synthRestorePattern: () => {try{const raw=localStorage.getItem('aether-synth-pattern-v1');if(!raw)throw Error('No saved pattern in this browser');os.synthApplyPattern(JSON.parse(raw));}catch(error){os.synthStatus('Pattern not loaded: '+error.message);}},
        synthExportPattern: () => {const url=URL.createObjectURL(new Blob([JSON.stringify(os.synthPattern(),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='synthpad-pattern.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);os.synthStatus('Pattern exported as JSON · this is not an audio recording');},
        synthImportPattern: async file => {if(!file)return;const token=os.synthState.importToken=(os.synthState.importToken||0)+1;try{if(file.size>32768)throw Error('Pattern must be under 32 KiB');const data=JSON.parse(await file.text());if(token!==os.synthState.importToken||!document.getElementById('synth-root'))return;os.synthApplyPattern(data);}catch(error){if(token===os.synthState.importToken)os.synthStatus('Import failed: '+error.message);}},
        synthClearPattern: () => {os.synthState.importToken=(os.synthState.importToken||0)+1;os.synthState.grid=Array.from({length:4},()=>Array(16).fill(0));os.synthRenderSequencer();os.synthStatus('Pattern cleared · export before closing if needed');},

        synthPlayNote: (midi) => {
            if(!Number.isInteger(midi)||midi<0||midi>127)return;
            if(os.synthState.sources.size>40)return;
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
            os.synthTrackSource(o1);os.synthTrackSource(o2,[flt,gain]);
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
            [60,64,67,71,74].forEach(m=>os.synthPlayNote(m));
        },

        synthShiftOctave: (delta) => {
            if(!Number.isInteger(delta))return;
            os.synthState.octaveOffset = Math.max(-2, Math.min(2, os.synthState.octaveOffset + delta));
            const lbl = document.getElementById('synth-oct-lbl');
            if (lbl) lbl.textContent = `C${4 + os.synthState.octaveOffset}`;
        },

        synthPlayDrum: (row,when) => {
            if(!Number.isInteger(row)||row<0||row>3)return;
            const m = os._synthEnsureMaster();
            if (!m) return;
            const { ctx, out } = m;
            const now = when??ctx.currentTime;
            if (row === 0) {
                // Punchy 808 Kick
                const o = ctx.createOscillator(), g = ctx.createGain();
                o.frequency.setValueAtTime(145, now);
                o.frequency.exponentialRampToValueAtTime(38, now + 0.16);
                g.gain.setValueAtTime(0.45, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
                o.connect(g); g.connect(out);
                os.synthTrackSource(o,[g]);o.start(now); o.stop(now + 0.25);
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
                os.synthTrackSource(src,[flt,g]);src.start(now);
            }
        },

        synthRenderKeys: () => {
            const host = document.getElementById('synth-keys-host');
            if (!host) return;
            const whites = PIANO_NOTES.filter((n) => !n.black);
            let html = whites.map((w) => `
                <button type="button" data-piano-midi="${w.midi}" onclick="os.synthPlayNote(${w.midi})" aria-label="Play ${w.note}"
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
                    <button type="button" data-piano-midi="${n.midi}" onclick="os.synthPlayNote(${n.midi})" aria-label="Play ${n.note}"
                        style="left:${leftPct}%;width:${(0.62 / whites.length) * 100}%;height:60%"
                        class="absolute top-0 z-10 rounded-b-lg bg-gradient-to-b from-[#1f2430] to-black border border-white/15 shadow-xl text-[9px] font-mono text-gray-400 flex items-end justify-center pb-2 hover-target cursor-none">
                        ${n.key.toUpperCase()}
                    </button>
                `;
            });
            host.innerHTML = html;
        },

        synthRenderSequencer: () => {
            const host=document.getElementById('synth-seq-grid');if(!host)return;
            const labels=['Kick','Snare','Hi-hat','Clap'];
            host.innerHTML='<div class="synth-step-numbers"><span>DRUMS</span>'+Array.from({length:16},(_,i)=>'<span>'+(i+1)+'</span>').join('')+'</div>'+os.synthState.grid.map((row,r)=>`<div class="synth-drum-row" data-drum="${r}"><button type="button" class="synth-drum-label" onclick="os.synthPlayDrum(${r})" aria-label="Preview ${labels[r]}">${labels[r]}</button>${row.map((on,c)=>`<button type="button" data-seq-cell="${r}-${c}" aria-label="${labels[r]} step ${c+1}" aria-pressed="${!!on}" class="synth-cell ${c%4===0?'beat-start':''}" onclick="os.synthToggleCell(${r},${c})"></button>`).join('')}</div>`).join('');
        },
        synthToggleCell: (r,c) => {
            if(!Number.isInteger(r)||!Number.isInteger(c)||r<0||r>3||c<0||c>15)return;
            const s=os.synthState;s.grid[r][c]=s.grid[r][c]?0:1;
            const cell=document.querySelector(`[data-seq-cell="${r}-${c}"]`);if(cell)cell.setAttribute('aria-pressed',String(!!s.grid[r][c]));
        },
        synthLoadGroove: name => {if(!Object.hasOwn(DRUM_GROOVES,name))return;os.synthState.importToken=(os.synthState.importToken||0)+1;os.synthState.grid=DRUM_GROOVES[name].map(row=>[...row]);os.synthRenderSequencer();os.synthStatus('Example '+name+' pattern loaded · edit any step');},
        synthSetBpm: value => {const n=Number(value);if(!Number.isFinite(n))return;os.synthState.bpm=Math.max(40,Math.min(200,Math.round(n)));os.synthSyncControls();},
        synthSchedule: () => {
            const s=os.synthState;if(!s.playing)return;const ctx=getAudioCtx();if(!ctx)return;
            // Do not replay missed beats after a background-tab timer stall.
            if(s.nextTime<ctx.currentTime-.1)s.nextTime=ctx.currentTime;
            while(s.nextTime<ctx.currentTime+.1){
                const col=s.step,time=s.nextTime;
                for(let r=0;r<4;r++)if(s.grid[r][col])os.synthPlayDrum(r,time);
                const timer=setTimeout(()=>{s.timers.delete(timer);if(!s.playing)return;document.querySelectorAll('[data-seq-cell]').forEach(el=>el.classList.toggle('is-current',el.dataset.seqCell.endsWith('-'+col)));const label=document.getElementById('synth-step-label');if(label)label.textContent='STEP '+String(col+1).padStart(2,'0')+' / 16';},Math.max(0,(time-ctx.currentTime)*1000));s.timers.add(timer);
                s.step=(col+1)%16;s.nextTime+=60/s.bpm/4;
            }
        },
        synthToggleSequencer: () => {
            const s=os.synthState;if(s.playing){os.synthPanic(false);os.synthStatus('Playback stopped · pattern kept');return;}
            const master=os._synthEnsureMaster();if(!master)return;
            s.playing=true;s.step=0;s.nextTime=master.ctx.currentTime+.02;
            const button=document.getElementById('synth-seq-btn');if(button){button.textContent='Stop beat';button.setAttribute('aria-pressed','true');}
            os.synthSchedule();s.seqTimer=setInterval(os.synthSchedule,25);os.synthStatus('Playing · Web Audio look-ahead clock · may pause in background tabs');
        },

        synthStartScope: () => {
            if (os.synthState.scopeRaf) cancelAnimationFrame(os.synthState.scopeRaf);
            const buf = new Uint8Array(128);
            const draw = () => {
                const c = document.getElementById('synth-scope');
                if (!c) return;
                const ctx = c.getContext('2d');
                ctx.clearRect(0, 0, c.width, c.height);
                ctx.strokeStyle = '#b4decf';
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                if (os.synthState.analyser) {
                    os.synthState.analyser.getByteTimeDomainData(buf);
                    const label=document.getElementById('synth-signal-label');if(label){const peak=Math.max(...buf.map(n=>Math.abs(n-128)));label.textContent=peak>1?'Your sound, drawn in real time.':'Output is quiet · play a key or start a pattern.';}
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

        // ═══════════════════════════════════════════════════════════════════
        //  3. NATIVE macOS SPACEBAR QUICK LOOK MODAL (File Explorer Preview)
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

    document.addEventListener('visibilitychange',()=>{if(document.hidden&&window.os?.synthState?.playing){os.synthPanic(false);os.synthStatus('Playback stopped while tab is hidden · press Play to resume');}});

    // Global keyboard bindings for GaragePad Piano + File Explorer Spacebar Quick Look
    const KEY_TO_MIDI = {};
    PIANO_NOTES.forEach((n) => { KEY_TO_MIDI[n.key] = n.midi; });

    document.addEventListener('keydown', (e) => {
        if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
        const tag = (e.target?.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'button' || e.target?.isContentEditable) return;

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
