// AetherOS — Iconic Interactive WebApps, 3D Space Suites, GLSL GPU Shaders & Live GeoRadar:
// 1. Shader Studio & Shadertoy (60fps WebGL Shadertoy-compatible GLSL IDE + Official Shadertoy Embed)
// 2. NASA Eyes 3D & Stellarium Planetarium (Official NASA JPL 3D Solar System/Asteroids/Earth + Stellarium Web)
// 3. Retro & 3D Makers Suite (BeepBox Chiptune DAW + Blockbench 3D Low-Poly Studio + JSPaint Classic)
// 4. GeoRadar Landmark Explorer (OpenStreetMap Live Map + Wikipedia GeoSearch & Summary REST APIs)
(function () {
    const esc = (v) => String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    window.WindowContents = window.WindowContents || {};

    // ═══════════════════════════════════════════════════════════════════════
    //  1. SHADER STUDIO & SHADERTOY (shadertoy)
    // ═══════════════════════════════════════════════════════════════════════
    const GLSL_PRESETS = {
        neonGrid: {
            label: 'Cyberpunk Synth Grid',
            code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    vec3 col = vec3(0.02, 0.01, 0.06);
    float sun = smoothstep(0.26, 0.24, length(uv - vec2(0.0, 0.16)));
    float stripes = step(0.35, fract((uv.y - 0.16) * 26.0 + iTime * 0.4));
    col += sun * mix(vec3(1.0, 0.18, 0.55), vec3(1.0, 0.85, 0.2), clamp((uv.y + 0.1) * 2.5, 0.0, 1.0)) * mix(1.0, stripes, step(uv.y, 0.16));
    if (uv.y < -0.02) {
        vec2 p = vec2(uv.x / abs(uv.y), 1.0 / abs(uv.y) + iTime * 2.4);
        float g = max(smoothstep(0.92, 1.0, cos(p.x * 3.14159)), smoothstep(0.92, 1.0, cos(p.y * 3.14159)));
        col += g * vec3(0.1, 0.85, 1.0) * exp(uv.y * 2.2);
    }
    col += 0.04 / (abs(uv.y + 0.02) + 0.02) * vec3(0.95, 0.2, 0.8);
    fragColor = vec4(col, 1.0);
}`
        },
        blackHole: {
            label: 'Black Hole Accretion',
            code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    float r = length(uv);
    float a = atan(uv.y, uv.x);
    float warp = 0.075 / max(r, 0.04);
    float swirl = sin(a * 5.0 - iTime * 2.6 + warp * 8.0) * 0.5 + 0.5;
    float disk = exp(-abs(r - 0.22) * 18.0) * (0.65 + 0.65 * swirl);
    disk += exp(-abs(uv.y * 4.5) * 3.2) * exp(-r * 3.5) * 0.9;
    vec3 col = disk * mix(vec3(1.0, 0.42, 0.12), vec3(0.45, 0.78, 1.0), r * 2.0);
    col *= smoothstep(0.11, 0.145, r);
    col += 0.004 / max(abs(r - 0.135), 0.003) * vec3(1.0, 0.88, 0.7);
    fragColor = vec4(col, 1.0);
}`
        },
        plasma: {
            label: 'Iridescent Liquid Silk',
            code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);
    for (float i = 1.0; i < 6.0; i++) {
        uv.x += 0.35 / i * cos(i * 2.2 * uv.y + iTime * 0.9);
        uv.y += 0.35 / i * sin(i * 1.8 * uv.x + iTime * 1.1);
    }
    vec3 col = 0.5 + 0.5 * cos(iTime * 0.6 + uv.xyx * 1.8 + vec3(0.0, 2.1, 4.2));
    col /= (0.65 + 0.55 * abs(sin(uv.x + uv.y)));
    fragColor = vec4(col * 0.75, 1.0);
}`
        },
        aurora: {
            label: 'Aurora Borealis',
            code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec3 col = mix(vec3(0.01, 0.02, 0.06), vec3(0.02, 0.07, 0.14), uv.y);
    for (float i = 0.0; i < 4.0; i++) {
        float w = sin(uv.x * (5.0 + i * 2.0) + iTime * (0.5 + i * 0.2) + sin(uv.x * 11.0 - iTime)) * 0.08;
        float band = exp(-abs(uv.y - (0.52 + i * 0.06) + w) * 22.0);
        col += band * mix(vec3(0.1, 0.95, 0.55), vec3(0.45, 0.25, 1.0), i / 3.0) * 0.65;
    }
    fragColor = vec4(col, 1.0);
}`
        }
    };

    window.WindowContents.shadertoy = `
        <div class="h-full flex flex-col bg-[#07080d] text-white text-xs select-none overflow-hidden" id="st-root">
            <div class="px-4 py-2 bg-black/60 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                <div class="os-segmented">
                    <button type="button" data-st-mode="studio" onclick="os.stSetMode('studio')" class="os-seg-btn active hover-target cursor-none">Native WebGL GLSL Studio</button>
                    <button type="button" data-st-mode="embed" onclick="os.stSetMode('embed')" class="os-seg-btn hover-target cursor-none">Shadertoy.com Live Player</button>
                </div>
                <div id="st-studio-bar" class="flex flex-wrap items-center gap-1.5">
                    <select id="st-preset-sel" onchange="os.stLoadPreset(this.value)" class="px-2.5 py-1 rounded-lg bg-white/[0.07] border border-white/15 text-[11px] text-emerald-300 outline-none">
                        <option value="neonGrid">Cyberpunk Synth Grid</option>
                        <option value="blackHole">Black Hole Accretion</option>
                        <option value="plasma">Iridescent Liquid Silk</option>
                        <option value="aurora">Aurora Borealis</option>
                    </select>
                    <button type="button" onclick="os.stCompile()" class="px-3 py-1 rounded-lg bg-emerald-400 text-black font-semibold text-[11px] hover-target cursor-none">▶ Compile GLSL</button>
                    <button type="button" onclick="os.stSaveWallpaper()" class="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/16 text-[11px] text-white hover-target cursor-none">Set Frame as Wallpaper</button>
                </div>
            </div>

            <!-- Native WebGL Studio -->
            <div id="st-pane-studio" class="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
                <div class="md:col-span-7 bg-black flex flex-col relative min-h-[260px] border-b md:border-b-0 md:border-r border-white/[0.08]">
                    <canvas id="st-gl-canvas" width="960" height="540" class="w-full flex-1 object-cover"></canvas>
                    <div id="st-compile-status" class="px-3.5 py-1.5 bg-black/75 border-t border-white/[0.08] font-mono text-[10.5px] text-emerald-300">WebGL GPU Ready · Shadertoy mainImage() compatible</div>
                </div>
                <div class="md:col-span-5 flex flex-col min-h-0 bg-[#0b0d14]">
                    <textarea id="st-glsl-editor" spellcheck="false" onkeydown="if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();os.stCompile();}"
                        class="flex-1 w-full p-3.5 bg-transparent font-mono text-[11.5px] text-sky-100 outline-none resize-none leading-relaxed select-text"></textarea>
                </div>
            </div>

            <!-- Official Shadertoy Embed -->
            <div id="st-pane-embed" class="hidden flex-1 flex flex-col min-h-0">
                <form onsubmit="event.preventDefault();os.stLoadEmbedId(document.getElementById('st-embed-id').value)" class="p-2.5 bg-[#0c0e16] border-b border-white/[0.08] flex flex-wrap items-center gap-2">
                    <span class="text-[11px] text-gray-400 font-mono">Shadertoy ID:</span>
                    <input id="st-embed-id" type="text" value="XsXXDn" placeholder="XsXXDn, MdX3zr, lscczl..."
                        class="w-40 px-2.5 py-1 rounded-lg bg-black/60 border border-white/15 font-mono text-xs text-white outline-none">
                    <button type="submit" class="px-3 py-1 rounded-lg bg-sky-400 text-black font-semibold text-xs hover-target cursor-none">Load Shader</button>
                    <button type="button" onclick="os.stLoadEmbedId('XsXXDn')" class="px-2 py-1 rounded bg-white/[0.06] text-[10.5px] hover-target cursor-none">Creation (Silexars)</button>
                    <button type="button" onclick="os.stLoadEmbedId('MdX3zr')" class="px-2 py-1 rounded bg-white/[0.06] text-[10.5px] hover-target cursor-none">Flame Raymarch</button>
                </form>
                <iframe id="st-embed-frame" title="Shadertoy Official Player" src="about:blank" class="flex-1 w-full border-0 bg-black" allow="fullscreen"></iframe>
            </div>
        </div>
    `;

    // ═══════════════════════════════════════════════════════════════════════
    //  2. NASA EYES 3D & STELLARIUM PLANETARIUM (stellarium)
    // ═══════════════════════════════════════════════════════════════════════
    window.WindowContents.stellarium = `
        <div class="h-full flex flex-col bg-[#03050a] text-white text-xs select-none overflow-hidden" id="stel-root">
            <div class="px-4 py-2 bg-black/70 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                <div class="os-segmented">
                    <button type="button" data-stel-view="solarsystem" onclick="os.stelSetView('solarsystem')" class="os-seg-btn active hover-target cursor-none">NASA 3D Solar System</button>
                    <button type="button" data-stel-view="asteroids" onclick="os.stelSetView('asteroids')" class="os-seg-btn hover-target cursor-none">NASA 3D Asteroids</button>
                    <button type="button" data-stel-view="earth" onclick="os.stelSetView('earth')" class="os-seg-btn hover-target cursor-none">NASA 3D Earth Fleet</button>
                    <button type="button" data-stel-view="sky" onclick="os.stelSetView('sky')" class="os-seg-btn hover-target cursor-none">Stellarium Night Sky</button>
                </div>
                <a id="stel-ext-link" href="https://eyes.nasa.gov/apps/solar-system/" target="_blank" rel="noopener" class="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/16 text-[11px] text-sky-200 hover-target cursor-none">Open Fullscreen Tab ↗</a>
            </div>
            <iframe id="stel-frame" title="3D Space & Planetarium" src="about:blank" class="flex-1 w-full border-0 bg-black" allow="fullscreen; geolocation"></iframe>
        </div>
    `;

    // ═══════════════════════════════════════════════════════════════════════
    //  3. OPEN-SOURCE RETRO & 3D CREATORS HUB (chiptune)
    // ═══════════════════════════════════════════════════════════════════════
    window.WindowContents.chiptune = `
        <div class="h-full flex flex-col bg-[#0a0b10] text-white text-xs select-none overflow-hidden" id="chip-root">
            <div class="px-4 py-2 bg-black/60 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                <div class="os-segmented">
                    <button type="button" data-chip-app="beepbox" onclick="os.chipSetApp('beepbox')" class="os-seg-btn active hover-target cursor-none">BeepBox Chiptune DAW</button>
                    <button type="button" data-chip-app="blockbench" onclick="os.chipSetApp('blockbench')" class="os-seg-btn hover-target cursor-none">Blockbench 3D Studio</button>
                    <button type="button" data-chip-app="jspaint" onclick="os.chipSetApp('jspaint')" class="os-seg-btn hover-target cursor-none">JSPaint Classic 98</button>
                </div>
                <span id="chip-desc" class="text-[10.5px] font-mono text-amber-300">Open-Source Browser Creative Engines</span>
            </div>
            <iframe id="chip-frame" title="Open-Source Creative Studio" src="about:blank" class="flex-1 w-full border-0 bg-[#141418]" allow="fullscreen; clipboard-read; clipboard-write; midi"></iframe>
        </div>
    `;

    // ═══════════════════════════════════════════════════════════════════════
    //  4. GEORADAR & WIKIPEDIA LANDMARK EXPLORER (georadar)
    // ═══════════════════════════════════════════════════════════════════════
    const GEO_PRESETS = [
        { label: 'Shibuya, Tokyo',       lat: 35.6595, lon: 139.7004 },
        { label: 'Pyramids of Giza',     lat: 29.9792, lon: 31.1342  },
        { label: 'CERN Collider',        lat: 46.2330, lon: 6.0557   },
        { label: 'Hawa Mahal, Jaipur',   lat: 26.9239, lon: 75.8267  },
        { label: 'Rome Colosseum',       lat: 41.8902, lon: 12.4922  },
        { label: 'Machu Picchu',         lat: -13.1631, lon: -72.5450 }
    ];

    window.WindowContents.georadar = `
        <div class="h-full flex flex-col bg-[#060910] text-white text-xs select-none overflow-hidden" id="geo-root">
            <div class="p-2.5 bg-black/60 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                <div id="geo-preset-row" class="flex flex-wrap items-center gap-1.5"></div>
                <form onsubmit="event.preventDefault();os.geoSearchPlace(document.getElementById('geo-place-input').value)" class="flex items-center gap-1.5">
                    <input id="geo-place-input" type="text" placeholder="Search any city or wonder..."
                        class="w-48 px-3 py-1 rounded-xl bg-black/60 border border-white/15 text-xs text-white outline-none">
                    <button type="submit" class="px-3 py-1 rounded-xl bg-emerald-400 text-black font-semibold text-xs hover-target cursor-none">Fly To</button>
                </form>
            </div>

            <div class="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
                <div class="md:col-span-7 flex flex-col bg-black min-h-[260px] border-b md:border-b-0 md:border-r border-white/[0.08]">
                    <iframe id="geo-osm-frame" title="OpenStreetMap Live" src="about:blank" class="flex-1 w-full border-0"></iframe>
                    <div id="geo-coord-bar" class="px-3.5 py-1.5 bg-[#0a0e18] border-t border-white/[0.08] font-mono text-[10.5px] text-sky-300">Ready</div>
                </div>
                <div class="md:col-span-5 flex flex-col min-h-0 bg-[#080b14]">
                    <div class="px-3.5 py-2 border-b border-white/[0.07] font-mono text-[10.5px] text-amber-300">WIKIPEDIA LANDMARKS WITHIN 10 KM</div>
                    <div id="geo-wiki-list" class="flex-1 overflow-y-auto divide-y divide-white/[0.06]"></div>
                    <div id="geo-wiki-card" class="p-3.5 bg-black/55 border-t border-white/[0.08] max-h-48 overflow-y-auto text-[11.5px] text-gray-300">Click a nearby landmark above to read its live Wikipedia dossier.</div>
                </div>
            </div>
        </div>
    `;

    window.extendOS({
        // ── 1. Shader Studio & Shadertoy ──
        stState: { mode: 'studio', gl: null, program: null, raf: null, startTime: 0 },

        initShadertoy: () => {
            const ed = document.getElementById('st-glsl-editor');
            if (ed && !ed.value) ed.value = GLSL_PRESETS.neonGrid.code;
            os.stSetMode(os.stState.mode || 'studio');
        },

        killShadertoy: () => {
            if (os.stState.raf) { cancelAnimationFrame(os.stState.raf); os.stState.raf = null; }
            const gl=os.stState.gl;
            if(gl){if(os.stState.program)gl.deleteProgram(os.stState.program);if(os.stState.buffer)gl.deleteBuffer(os.stState.buffer);}
            os.stState.program=null;os.stState.buffer=null;
            const f = document.getElementById('st-embed-frame');
            if (f) f.src = 'about:blank';
        },

        stSetMode: (mode) => {
            os.stState.mode = mode;
            document.querySelectorAll('[data-st-mode]').forEach((b) => b.classList.toggle('active', b.getAttribute('data-st-mode') === mode));
            document.getElementById('st-pane-studio')?.classList.toggle('hidden', mode !== 'studio');
            document.getElementById('st-studio-bar')?.classList.toggle('hidden', mode !== 'studio');
            document.getElementById('st-pane-embed')?.classList.toggle('hidden', mode !== 'embed');
            if (mode === 'studio') os.stCompile();
            else {
                if (os.stState.raf) { cancelAnimationFrame(os.stState.raf); os.stState.raf = null; }
                const f = document.getElementById('st-embed-frame');
                if (f && f.src === 'about:blank') os.stLoadEmbedId('XsXXDn');
            }
        },

        stLoadPreset: (key) => {
            const p = GLSL_PRESETS[key];
            const ed = document.getElementById('st-glsl-editor');
            if (p && ed) { ed.value = p.code; os.stCompile(); }
        },

        stCompile: () => {
            const canvas = document.getElementById('st-gl-canvas');
            const ed = document.getElementById('st-glsl-editor');
            const status = document.getElementById('st-compile-status');
            if (!canvas || !ed) return;

            const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
            if (!gl || typeof gl.createShader !== 'function') {
                // Graceful 2D fallback for headless environments without WebGL
                if (status) status.textContent = 'WebGL unavailable. Shader has not been compiled or rendered.';
                return;
            }

            const vsSrc = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;
            const fsSrc = `precision highp float;
uniform vec3 iResolution;
uniform float iTime;
${ed.value}
void main(){ mainImage(gl_FragColor, gl_FragCoord.xy); }`;

            const compile = (type, src) => {
                const sh = gl.createShader(type);
                gl.shaderSource(sh, src);
                gl.compileShader(sh);
                if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
                    const err = gl.getShaderInfoLog(sh);
                    gl.deleteShader(sh);
                    throw new Error(err || 'GLSL syntax error');
                }
                return sh;
            };

            let vs=null,fs=null,prog=null,buf=null,installed=false;
            try {
                vs = compile(gl.VERTEX_SHADER, vsSrc);
                fs = compile(gl.FRAGMENT_SHADER, fsSrc);
                prog = gl.createProgram();
                gl.attachShader(prog, vs);
                gl.attachShader(prog, fs);
                gl.linkProgram(prog);
                if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));

                buf = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, buf);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
                const loc = gl.getAttribLocation(prog, 'aPos');
                gl.enableVertexAttribArray(loc);
                gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

                if(os.stState.program)gl.deleteProgram(os.stState.program);
                if(os.stState.buffer)gl.deleteBuffer(os.stState.buffer);
                os.stState.gl = gl;
                os.stState.program = prog;os.stState.buffer=buf;installed=true;
                os.stState.startTime = performance.now();
                if (status) { status.textContent = '✓ Compiled · WebGL rendering active (frame rate varies)'; status.className = 'px-3.5 py-1.5 bg-black/75 border-t border-white/[0.08] font-mono text-[10.5px] text-emerald-300'; }

                if (os.stState.raf) cancelAnimationFrame(os.stState.raf);
                const loop = () => {
                    if (!document.getElementById('st-gl-canvas') || os.stState.mode !== 'studio') return;
                    gl.viewport(0, 0, canvas.width, canvas.height);
                    gl.useProgram(prog);
                    gl.uniform3f(gl.getUniformLocation(prog, 'iResolution'), canvas.width, canvas.height, 1.0);
                    gl.uniform1f(gl.getUniformLocation(prog, 'iTime'), (performance.now() - os.stState.startTime) * 0.001);
                    gl.drawArrays(gl.TRIANGLES, 0, 6);
                    os.stState.raf = requestAnimationFrame(loop);
                };
                os.stState.raf = requestAnimationFrame(loop);
            } catch (err) {
                if (status) {
                    status.textContent = String(err.message || err).split('\n')[0];
                    status.className = 'px-3.5 py-1.5 bg-rose-950/70 border-t border-rose-500/30 font-mono text-[10.5px] text-rose-300';
                }
            } finally {
                if(vs)gl.deleteShader(vs);if(fs)gl.deleteShader(fs);
                if(!installed){if(prog)gl.deleteProgram(prog);if(buf)gl.deleteBuffer(buf);}
            }
        },

        stSaveWallpaper: async () => {
            const c = document.getElementById('st-gl-canvas');
            if (!c || !window.AetherVFS) return;
            const dataUrl = c.toDataURL('image/png');
            const rec = await AetherVFS.putFile({
                name: `Shader-Wallpaper-${Date.now()}.png`,
                mime: 'image/png',
                kind: 'media',
                icon: 'sparkles',
                folder: 'User Uploads',
                dataUrl,
                imageUrl: dataUrl,
                tags: ['shader', 'wallpaper']
            });
            AetherVFS.applyFileAsWallpaper && AetherVFS.applyFileAsWallpaper(rec.id);
        },

        stLoadEmbedId: (rawId) => {
            const id = String(rawId || 'XsXXDn').trim().replace(/^.*\/view\//i, '').split(/[?#]/)[0];
            const f = document.getElementById('st-embed-frame');
            if (f && id) f.src = `https://www.shadertoy.com/embed/${encodeURIComponent(id)}?gui=true&t=10&paused=false&muted=true`;
        },

        // ── 2. NASA Eyes 3D & Stellarium Planetarium ──
        stelState: { view: 'solarsystem' },

        initStellarium: () => {
            os.stelSetView(os.stelState.view || 'solarsystem');
        },

        killStellarium: () => {
            const f = document.getElementById('stel-frame');
            if (f) f.src = 'about:blank';
        },

        stelSetView: (view) => {
            os.stelState.view = view;
            document.querySelectorAll('[data-stel-view]').forEach((b) => b.classList.toggle('active', b.getAttribute('data-stel-view') === view));
            const urls = {
                solarsystem: 'https://eyes.nasa.gov/apps/solar-system/#/home?embed=true',
                asteroids:   'https://eyes.nasa.gov/apps/asteroids/#/home?embed=true',
                earth:       'https://eyes.nasa.gov/apps/earth/#/?embed=true',
                sky:         'https://stellarium-web.org/'
            };
            const target = urls[view] || urls.solarsystem;
            const f = document.getElementById('stel-frame');
            const ext = document.getElementById('stel-ext-link');
            if (f) f.src = target;
            if (ext) ext.href = target.replace('?embed=true', '');
        },

        // ── 3. Open-Source Creative Makers (BeepBox / Blockbench / JSPaint) ──
        chipState: { app: 'beepbox' },

        initChiptune: () => {
            os.chipSetApp(os.chipState.app || 'beepbox');
        },

        killChiptune: () => {
            const f = document.getElementById('chip-frame');
            if (f) f.src = 'about:blank';
        },

        chipSetApp: (app) => {
            os.chipState.app = app;
            document.querySelectorAll('[data-chip-app]').forEach((b) => b.classList.toggle('active', b.getAttribute('data-chip-app') === app));
            const map = {
                beepbox:    { url: 'https://www.beepbox.co/',       desc: 'BeepBox · Open-source chiptune & synth sequencer' },
                blockbench: { url: 'https://web.blockbench.net/',   desc: 'Blockbench · Open-source low-poly 3D & voxel modeler' },
                jspaint:    { url: 'https://jspaint.app/',          desc: 'JSPaint · Faithful open-source classic pixel art editor' }
            };
            const cur = map[app] || map.beepbox;
            const f = document.getElementById('chip-frame');
            const d = document.getElementById('chip-desc');
            if (f) f.src = cur.url;
            if (d) d.textContent = cur.desc;
        },

        // ── 4. GeoRadar & Wikipedia Landmark Explorer ──
        geoState: { lat: 35.6595, lon: 139.7004, label: 'Shibuya, Tokyo' },

        initGeoRadar: () => {
            const row = document.getElementById('geo-preset-row');
            if (row && !row.children.length) {
                row.innerHTML = GEO_PRESETS.map((p) => `
                    <button type="button" onclick="os.geoLoadCoords(${p.lat}, ${p.lon}, '${esc(p.label)}')"
                        class="px-2.5 py-1 rounded-lg bg-white/[0.07] hover:bg-white/15 text-[11px] text-gray-200 hover-target cursor-none">${esc(p.label)}</button>
                `).join('');
            }
            os.geoLoadCoords(os.geoState.lat, os.geoState.lon, os.geoState.label);
        },

        geoJump: (lat, lon, label = 'Target Coordinates') => {
            os.geoState.lat = Number(lat) || 35.6595;
            os.geoState.lon = Number(lon) || 139.7004;
            os.geoState.label = label;
            if (os.isModuleEnabled && !os.isModuleEnabled('georadar')) os.setModuleEnabled('georadar', true, { silent: true });
            os.openWindow('georadar');
            setTimeout(() => os.geoLoadCoords(os.geoState.lat, os.geoState.lon, os.geoState.label), 60);
        },

        geoSearchPlace: async (query) => {
            const q = String(query || '').trim();
            if (!q) return;
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`);
                const arr = await res.json();
                if (Array.isArray(arr) && arr[0]) {
                    os.geoLoadCoords(parseFloat(arr[0].lat), parseFloat(arr[0].lon), arr[0].display_name.split(',').slice(0, 2).join(','));
                }
            } catch (_) {}
        },

        geoLoadCoords: async (lat, lon, label) => {
            os.geoState = { lat, lon, label };
            const frame = document.getElementById('geo-osm-frame');
            const bar = document.getElementById('geo-coord-bar');
            const list = document.getElementById('geo-wiki-list');
            const d = 0.035;
            if (frame) {
                frame.src = `https://www.openstreetmap.org/export/embed.html?bbox=${(lon - d).toFixed(4)}%2C${(lat - d).toFixed(4)}%2C${(lon + d).toFixed(4)}%2C${(lat + d).toFixed(4)}&layer=mapnik&marker=${lat.toFixed(4)}%2C${lon.toFixed(4)}`;
            }
            if (bar) bar.textContent = `📍 ${label} · ${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
            if (list) list.innerHTML = `<div class="p-4 font-mono text-gray-400">Scanning Wikipedia GeoSearch...</div>`;

            try {
                const api = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=10000&gslimit=18&format=json&origin=*`;
                const res = await fetch(api);
                const data = await res.json();
                const places = data?.query?.geosearch || [];
                if (!list) return;
                if (!places.length) {
                    list.innerHTML = `<div class="p-4 text-gray-500">No geotagged Wikipedia articles within 10 km.</div>`;
                    return;
                }
                list.innerHTML = places.map((p) => `
                    <button type="button" onclick="os.geoInspectWiki('${esc(p.title)}')"
                        class="w-full text-left p-3 hover:bg-white/[0.06] flex items-center justify-between gap-2 transition hover-target cursor-none">
                        <span class="font-medium text-white truncate">${esc(p.title)}</span>
                        <span class="font-mono text-[10px] text-emerald-300 shrink-0">${(Number(p.dist || 0) / 1000).toFixed(2)} km</span>
                    </button>
                `).join('');
                os.geoInspectWiki(places[0].title);
            } catch (_) {
                if (list) list.innerHTML = `<div class="p-4 text-gray-500">Wikipedia GeoSearch unavailable offline.</div>`;
            }
        },

        geoInspectWiki: async (title) => {
            const card = document.getElementById('geo-wiki-card');
            if (!card) return;
            card.textContent = `Loading "${title}"...`;
            try {
                const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
                const d = await res.json();
                card.innerHTML = `
                    <div class="flex items-start gap-3">
                        ${d.thumbnail?.source ? `<img src="${esc(d.thumbnail.source)}" class="w-16 h-16 rounded-xl object-cover shrink-0 bg-black" alt="">` : ''}
                        <div class="min-w-0 flex-1">
                            <div class="font-semibold text-white">${esc(d.title || title)}</div>
                            <p class="text-[11px] text-gray-300 mt-1 leading-relaxed line-clamp-4">${esc(d.extract || '')}</p>
                            ${d.content_urls?.desktop?.page ? `<a href="${esc(d.content_urls.desktop.page)}" target="_blank" rel="noopener" class="inline-block mt-1.5 text-[10.5px] text-sky-300 underline hover-target cursor-none">Read Full Article ↗</a>` : ''}
                        </div>
                    </div>
                `;
            } catch (_) {
                card.textContent = title;
            }
        }
    });
})();
