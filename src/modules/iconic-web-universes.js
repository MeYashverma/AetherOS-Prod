// AetherOS — Iconic Interactive WebApps, 3D Space Suites, GLSL GPU Shaders & Live GeoRadar:
// 1. Shader Studio & Shadertoy (Local WebGL GLSL workbench + optional third-party Shadertoy player)
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
    float sun = 1.0 - smoothstep(0.24, 0.26, length(uv - vec2(0.0, 0.16)));
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
      <div id="st-root" class="shader-studio">
        <div class="shader-toolbar"><div class="shader-modes"><button type="button" class="os-btn" data-st-mode="studio" aria-pressed="true" onclick="os.stSetMode('studio')">Local GLSL</button><button type="button" class="os-btn" data-st-mode="embed" aria-pressed="false" onclick="os.stSetMode('embed')">Shadertoy ↗</button></div><div id="st-studio-bar"><select id="st-preset-sel" aria-label="Built-in shader" onchange="os.stLoadPreset(this.value)"><option value="custom" disabled>Custom source</option>${Object.entries(GLSL_PRESETS).map(([id,p])=>`<option value="${id}">${p.label}</option>`).join('')}</select><button type="button" class="os-btn" onclick="os.stCompile()">Compile</button><button type="button" id="st-pause" class="os-btn" aria-pressed="false" onclick="os.stTogglePause()">Pause</button><button type="button" class="os-btn" onclick="os.stSetTime(0)">Reset time</button><select id="st-quality" aria-label="Preview render scale" onchange="os.stState.quality=Number(this.value);os.stResize();os.stDraw()"><option value="1">1× preview</option><option value="0.5">½× preview</option></select></div></div>
        <div id="st-pane-studio" class="shader-workspace"><section class="shader-preview" aria-label="Shader preview"><div class="shader-canvas-wrap"><canvas id="st-gl-canvas" width="960" height="540" aria-label="WebGL shader output; pointer position is exposed as iMouse" data-preserve-surface></canvas><span id="st-preview-label">LOCAL WEBGL / GLSL ES 1.00</span></div><div class="shader-timebar"><label>Time <input id="st-time" type="range" min="0" max="120" step="0.1" value="0" aria-label="Preview time in seconds" oninput="os.stSetTime(this.value)"></label><output id="st-time-label">0.0s</output><span id="st-resolution">Not rendered</span></div></section><section class="shader-code"><div class="shader-code-tools"><span>FRAGMENT / mainImage</span><button type="button" class="os-btn" onclick="os.stSaveSource()">Save draft</button><label class="shader-import os-btn">Open .frag<input type="file" accept=".frag,.glsl,.txt,text/plain" aria-label="Import GLSL source" onchange="os.stImportSource(this.files[0]);this.value=''"></label><button type="button" class="os-btn" onclick="os.stExportSource()">Export GLSL</button></div><textarea id="st-glsl-editor" aria-label="GLSL fragment shader source" spellcheck="false" oninput="os.stEditSource()" onkeydown="if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();os.stCompile();}"></textarea><pre id="st-errors" class="shader-errors" role="log" aria-label="Shader compiler errors" hidden></pre><details class="shader-help"><summary>Uniforms &amp; safety</summary><p>mainImage(out vec4, in vec2), iResolution, iTime, iMouse, iFrame and iTimeDelta. No textures, sound, buffers or multipass support. Ctrl/⌘ Enter compiles. Only run trusted GLSL: expensive or looping GPU code can freeze the tab; Pause is not an isolation boundary. Built-in scenes are creative visuals, not scientific simulations.</p></details></section></div>
        <div id="st-pane-embed" class="shader-embed" hidden><form class="shader-toolbar" onsubmit="event.preventDefault();os.stLoadEmbedId(document.getElementById('st-embed-id').value)"><input id="st-embed-id" aria-label="Shadertoy shader ID or URL" placeholder="Shader ID or shadertoy.com/view/…" maxlength="160"><button type="submit" class="os-btn">Load external shader</button><a id="st-external-link" class="os-btn" href="https://www.shadertoy.com" target="_blank" rel="noopener noreferrer">Open site ↗</a><span>Third-party player · may be blocked · no local source sync</span></form><iframe id="st-embed-frame" title="Shadertoy third-party player" src="about:blank" allow="fullscreen" referrerpolicy="no-referrer" data-preserve-surface></iframe></div>
        <footer class="shader-footer"><span id="st-compile-status" role="status">Built-in previews work locally · compile imported code only if trusted</span><button type="button" class="os-btn" onclick="os.stCapturePNG()">Download PNG</button><button type="button" class="os-btn" onclick="os.stSaveFrame()">Save frame to Files</button></footer>
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
        // ── Local shader workspace; imported source is never auto-executed ──
        stState:{mode:'studio',gl:null,program:null,buffer:null,raf:null,elapsed:0,paused:false,quality:1,frame:0,mouse:[0,0,0,0],source:'',dirty:false,valid:false,token:0},
        stStatus: message=>{const el=document.getElementById('st-compile-status');if(el)el.textContent=message;},
        initShadertoy: ()=>{
            const s=os.stState,ed=document.getElementById('st-glsl-editor'),canvas=document.getElementById('st-gl-canvas');if(!ed||!canvas)return;
            let restored=false;if(!s.source){try{const saved=localStorage.getItem('aether-shader-draft-v1');if(saved!==null&&saved.length<=65536){s.source=saved;restored=true;}}catch{os.stStatus('Draft storage unavailable');}}else restored=true;
            ed.value=restored?s.source:GLSL_PRESETS.neonGrid.code;s.preset=restored?'custom':'neonGrid';document.getElementById('st-preset-sel').value=s.preset;s.source=ed.value;s.mode='studio';s.paused=true;s.frame=0;s.mouse=[0,0,0,0];s.lost=false;
            canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();s.lost=true;s.valid=false;os.stPause(true);os.stStatus('WebGL context lost · output unavailable; restore then Compile again');});
            canvas.addEventListener('webglcontextrestored',()=>{s.gl=null;s.program=null;s.buffer=null;s.lost=false;s.valid=false;os.stStatus('WebGL context restored · press Compile to render again');});
            const pointer=event=>{const r=canvas.getBoundingClientRect();s.mouse[0]=Math.max(0,Math.min(canvas.width,(event.clientX-r.left)/r.width*canvas.width));s.mouse[1]=Math.max(0,Math.min(canvas.height,(r.bottom-event.clientY)/r.height*canvas.height));if(s.paused)os.stDraw();};
            canvas.addEventListener('pointerdown',event=>{pointer(event);s.mouse[2]=s.mouse[0];s.mouse[3]=s.mouse[1];canvas.setPointerCapture?.(event.pointerId);if(s.paused)os.stDraw();});canvas.addEventListener('pointermove',pointer);const release=()=>{s.mouse[2]=-Math.abs(s.mouse[2]);s.mouse[3]=-Math.abs(s.mouse[3]);if(s.paused)os.stDraw();};canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
            if(window.ResizeObserver){s.observer?.disconnect();s.observer=new ResizeObserver(()=>{os.stResize();if(s.paused)os.stDraw();});s.observer.observe(canvas);}
            os.stSetMode('studio');if(restored){os.stStatus('Draft restored, not running · Compile only if you trust this GLSL');os.stPause(true);}else{os.stCompile();}
        },
        killShadertoy: ()=>{
            const s=os.stState;s.token++;os.stPause(true);s.observer?.disconnect();s.observer=null;const ed=document.getElementById('st-glsl-editor');if(ed)s.source=ed.value;
            const gl=s.gl;if(gl){if(s.program)gl.deleteProgram(s.program);if(s.buffer)gl.deleteBuffer(s.buffer);}s.program=null;s.buffer=null;s.gl=null;s.valid=false;
            const frame=document.getElementById('st-embed-frame');if(frame)frame.src='about:blank';
        },
        stSetMode: mode=>{
            if(!['studio','embed'].includes(mode))return;const s=os.stState;s.mode=mode;
            document.querySelectorAll('[data-st-mode]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.stMode===mode)));
            for(const id of ['st-pane-studio','st-studio-bar'])document.getElementById(id)?.toggleAttribute('hidden',mode!=='studio');document.getElementById('st-pane-embed')?.toggleAttribute('hidden',mode!=='embed');
            os.stPause(true);if(mode==='studio'){const frame=document.getElementById('st-embed-frame');if(frame)frame.src='about:blank';os.stResize();os.stDraw();}else os.stStatus('External player not loaded · choose a shader ID to connect to Shadertoy');
        },
        stEditSource: ()=>{const ed=document.getElementById('st-glsl-editor');if(!ed)return;os.stState.token++;os.stState.source=ed.value;os.stState.dirty=true;os.stState.preset='custom';document.getElementById('st-preset-sel').value='custom';os.stStatus('Source changed · preview still uses the last compiled shader');},
        stLoadPreset: key=>{
            if(!Object.hasOwn(GLSL_PRESETS,key))return;const ed=document.getElementById('st-glsl-editor');if(!ed)return;
            if(os.stState.dirty&&!window.confirm('Replace the current source with a built-in preset? Save or export first.')){document.getElementById('st-preset-sel').value=os.stState.preset||'custom';return;}
            os.stState.token++;os.stState.preset=key;document.getElementById('st-preset-sel').value=key;ed.value=GLSL_PRESETS[key].code;os.stState.source=ed.value;os.stState.dirty=true;os.stCompile();
        },
        stResize: ()=>{
            const canvas=document.getElementById('st-gl-canvas');if(!canvas)return;const s=os.stState,rect=canvas.getBoundingClientRect(),q=s.quality===.5?.5:1;
            let w=Math.max(2,Math.round((rect.width||960)*q)),h=Math.max(2,Math.round((rect.height||540)*q));const scale=Math.min(1,Math.sqrt(921600/(w*h)),2048/w,2048/h);w=Math.max(2,Math.floor(w*scale));h=Math.max(2,Math.floor(h*scale));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
            const label=document.getElementById('st-resolution');if(label)label.textContent=w+' × '+h+' px';
        },
        stPause: paused=>{const s=os.stState;s.paused=!!paused;if(s.raf)cancelAnimationFrame(s.raf);s.raf=null;const button=document.getElementById('st-pause');if(button){button.textContent=s.paused?'Play':'Pause';button.setAttribute('aria-pressed',String(s.paused));}if(!s.paused&&s.program&&s.mode==='studio'){s.lastTick=performance.now();s.raf=requestAnimationFrame(os.stLoop);}},
        stTogglePause: ()=>{if(!os.stState.program){os.stStatus('Compile a valid shader first');return;}os.stPause(!os.stState.paused);os.stStatus(os.stState.paused?'Preview paused · time and pointer controls still work':'Rendering local shader · Pause stops animation, not expensive GPU work');},
        stSetTime: value=>{const n=Number(value);if(!Number.isFinite(n)||n<0||n>120)return;os.stPause(true);os.stState.elapsed=n;os.stState.frame=0;os.stDraw();},
        stLoop: now=>{const s=os.stState;s.raf=null;if(s.paused||s.mode!=='studio'||s.lost||!document.getElementById('st-gl-canvas'))return;const delta=Math.min(.1,Math.max(0,(now-s.lastTick)/1000));s.lastTick=now;s.elapsed+=delta;os.stDraw(delta);s.raf=requestAnimationFrame(os.stLoop);},
        stDraw: (delta=0)=>{
            const s=os.stState,gl=s.gl,canvas=document.getElementById('st-gl-canvas');if(!gl||!s.program||!canvas||s.mode!=='studio'||s.lost)return;
            gl.viewport(0,0,canvas.width,canvas.height);gl.useProgram(s.program);gl.bindBuffer(gl.ARRAY_BUFFER,s.buffer);gl.enableVertexAttribArray(s.attribute);gl.vertexAttribPointer(s.attribute,2,gl.FLOAT,false,0,0);
            gl.uniform3f(s.uniforms.resolution,canvas.width,canvas.height,1);gl.uniform1f(s.uniforms.time,s.elapsed);gl.uniform4f(s.uniforms.mouse,...s.mouse);gl.uniform1i(s.uniforms.frame,s.frame++);gl.uniform1f(s.uniforms.delta,delta);gl.drawArrays(gl.TRIANGLES,0,6);
            const output=document.getElementById('st-time-label'),slider=document.getElementById('st-time');if(output)output.textContent=s.elapsed.toFixed(1)+'s';if(slider)slider.value=Math.min(120,s.elapsed);s.valid=true;
        },
        stCompile: ()=>{
            const s=os.stState,canvas=document.getElementById('st-gl-canvas'),ed=document.getElementById('st-glsl-editor'),errors=document.getElementById('st-errors');if(!canvas||!ed||s.mode!=='studio')return false;
            if(ed.value.length>65536){os.stStatus('Source exceeds the 64 Ki-character limit');return false;}if(s.lost){os.stStatus('WebGL context is lost · wait for restoration');return false;}
            let gl;try{gl=canvas.getContext('webgl',{preserveDrawingBuffer:true,alpha:false,antialias:false});}catch{}if(!gl||typeof gl.createShader!=='function'){os.stStatus('WebGL unavailable · source editing and GLSL export still work');return false;}
            const vsSrc='attribute vec2 aPos; void main(){ gl_Position=vec4(aPos,0.0,1.0); }',fsSrc='precision highp float;\nuniform vec3 iResolution;\nuniform float iTime;\nuniform vec4 iMouse;\nuniform int iFrame;\nuniform float iTimeDelta;\n#line 1\n'+ed.value+'\nvoid main(){ mainImage(gl_FragColor,gl_FragCoord.xy); }';
            const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error(message||'GLSL compilation failed');}return shader;};
            let vs=null,fs=null,program=null,buffer=null,installed=false;
            try{
                vs=compile(gl.VERTEX_SHADER,vsSrc);fs=compile(gl.FRAGMENT_SHADER,fsSrc);program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program)||'Shader link failed');
                buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
                const attribute=gl.getAttribLocation(program,'aPos'),uniforms={resolution:gl.getUniformLocation(program,'iResolution'),time:gl.getUniformLocation(program,'iTime'),mouse:gl.getUniformLocation(program,'iMouse'),frame:gl.getUniformLocation(program,'iFrame'),delta:gl.getUniformLocation(program,'iTimeDelta')};
                os.stPause(true);if(s.program)gl.deleteProgram(s.program);if(s.buffer)gl.deleteBuffer(s.buffer);Object.assign(s,{gl,program,buffer,attribute,uniforms,elapsed:0,frame:0,source:ed.value,valid:false});installed=true;os.stResize();os.stDraw();
                if(errors){errors.hidden=true;errors.textContent='';}const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;os.stPause(!!reduced);os.stStatus(reduced?'Compiled · static preview for reduced motion · Play to animate':'Compiled locally · rendering preview · Ctrl/⌘ Enter recompiles');return true;
            }catch(error){if(errors){errors.textContent=String(error.message||error).slice(0,8000);errors.hidden=false;}os.stStatus('Compile failed · '+(s.program?'last working shader kept':'no shader rendered')+' · see compiler log');return false;}
            finally{if(vs)gl.deleteShader(vs);if(fs)gl.deleteShader(fs);if(!installed){if(program)gl.deleteProgram(program);if(buffer)gl.deleteBuffer(buffer);}}
        },
        stSaveSource: ()=>{const ed=document.getElementById('st-glsl-editor');if(!ed)return;if(ed.value.length>65536){os.stStatus('Draft exceeds 64 Ki characters');return;}os.stState.source=ed.value;try{localStorage.setItem('aether-shader-draft-v1',ed.value);os.stState.dirty=false;os.stStatus('GLSL draft saved in this browser · export a backup');}catch{os.stStatus('Storage failed · source is session-only; export GLSL as a backup');}},
        stDownload: (content,mime,name)=>{const url=URL.createObjectURL(new Blob([content],{type:mime})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},
        stExportSource: ()=>{const ed=document.getElementById('st-glsl-editor');if(!ed)return;os.stDownload(ed.value,'text/plain','aether-shader.frag');os.stStatus('GLSL exported · imported or edited code is not automatically run');},
        stImportSource: async file=>{if(!file)return;const token=++os.stState.token;try{if(file.size>65536)throw Error('File exceeds 64 KiB');const text=await file.text();if(token!==os.stState.token||!document.getElementById('st-glsl-editor'))return;if(text.length>65536||text.includes('\0'))throw Error('Choose a text GLSL source up to 64 Ki characters');if(os.stState.dirty&&!window.confirm('Replace current source? Export or save your draft first.'))return;const ed=document.getElementById('st-glsl-editor');ed.value=text;os.stEditSource();os.stStatus('GLSL loaded, not compiled · run only code you trust');}catch(error){if(token===os.stState.token)os.stStatus('Source not imported: '+error.message);}},
        stFrameData: ()=>{const s=os.stState,canvas=document.getElementById('st-gl-canvas');if(!canvas||!s.valid||s.lost||s.mode!=='studio')throw Error('Render a local shader before capturing a frame');os.stDraw();return canvas.toDataURL('image/png');},
        stCapturePNG: ()=>{try{const data=os.stFrameData(),a=document.createElement('a');a.href=data;a.download='shader-frame.png';a.click();os.stStatus('PNG downloaded at preview resolution · GLSL source is separate');}catch(error){os.stStatus('Capture failed: '+error.message);}},
        stSaveFrame: async ()=>{const token=os.stState.token;try{const data=os.stFrameData();if(!window.AetherVFS)throw Error('Files service unavailable');const rec=await AetherVFS.putFile({name:'Shader-'+Date.now()+'.png',mime:'image/png',sizeBytes:Math.floor((data.length-data.indexOf(',')-1)*3/4)-(data.endsWith('==')?2:data.endsWith('=')?1:0),kind:'image',icon:'sparkles',folder:'User Uploads',dataUrl:data,imageUrl:data,content:'Shader preview frame; GLSL source not included',tags:['shader','frame']});if(token===os.stState.token)os.stStatus(rec?.persistence==='indexeddb'?'Preview frame saved to Files':'Session-only frame copy · Download PNG as a backup');}catch(error){if(token===os.stState.token)os.stStatus('Frame not saved: '+error.message+' · Download PNG remains available');}},
        stSaveWallpaper: ()=>os.stSaveFrame(),
        stLoadEmbedId: raw=>{
            let id=String(raw||'').trim();if(/^https:\/\//i.test(id)){try{const url=new URL(id);if(url.hostname!=='www.shadertoy.com'&&url.hostname!=='shadertoy.com')throw Error();id=url.pathname.match(/^\/view\/([a-zA-Z0-9]{6})\/?$/)?.[1]||'';}catch{id='';}}
            if(!/^[a-zA-Z0-9]{6}$/.test(id)){os.stStatus('Enter a six-character Shadertoy ID or an official /view/ URL');return;}
            const frame=document.getElementById('st-embed-frame');if(frame&&os.stState.mode==='embed'){frame.src='https://www.shadertoy.com/embed/'+id+'?gui=true&paused=false&muted=true';document.getElementById('st-external-link').href='https://www.shadertoy.com/view/'+id;os.stStatus('External player requested · readiness not verified; open the site if blocked');}
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
            os.geoState.lat = Number.isFinite(Number(lat)) ? Math.max(-90, Math.min(90, Number(lat))) : 35.6595;
            os.geoState.lon = Number.isFinite(Number(lon)) ? Math.max(-180, Math.min(180, Number(lon))) : 139.7004;
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
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&window.os?.stState){os.stPause(true);os.stStatus('Preview paused while tab is hidden · Play to resume');}});
})();
