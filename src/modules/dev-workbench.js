// AetherOS — Live Code Sandbox (codeplay — Sandboxed HTML/CSS/JS + Captured Console)
(function () {
    window.WindowContents = window.WindowContents || {};

    const CODE_PRESETS = {
        particles: {
            label: 'Interactive Gravity Canvas',
            html: `<div class="hud">\n  <h2>Orbital Particle Field</h2>\n  <p>Move cursor to attract · Click to pulse</p>\n</div>\n<canvas id="c"></canvas>`,
            css: `body { margin: 0; background: #060812; overflow: hidden; font-family: system-ui, sans-serif; color: #fff; }\n.hud { position: fixed; top: 14px; left: 16px; pointer-events: none; z-index: 2; }\nh2 { margin: 0; font-size: 15px; letter-spacing: -0.02em; }\np { margin: 4px 0 0; font-size: 11px; color: #94a3b8; }\ncanvas { display: block; width: 100vw; height: 100vh; }`,
            js: `const canvas = document.getElementById('c');\nconst ctx = canvas.getContext('2d');\nlet w = canvas.width = innerWidth, h = canvas.height = innerHeight;\naddEventListener('resize', () => { w = canvas.width = innerWidth; h = canvas.height = innerHeight; });\n\nconst mouse = { x: w / 2, y: h / 2, boost: 1 };\naddEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });\naddEventListener('pointerdown', () => { mouse.boost = -4; setTimeout(() => mouse.boost = 1, 260); console.log('Pulse wave triggered at', Math.round(mouse.x), Math.round(mouse.y)); });\n\nconst pts = Array.from({ length: 110 }, (_, i) => ({\n  x: Math.random() * w, y: Math.random() * h,\n  vx: (Math.random() - 0.5) * 1.6, vy: (Math.random() - 0.5) * 1.6,\n  hue: 185 + (i % 55)\n}));\nconsole.log('Initialized', pts.length, 'particles');\n\nfunction loop() {\n  ctx.fillStyle = 'rgba(6, 8, 18, 0.22)';\n  ctx.fillRect(0, 0, w, h);\n  for (const p of pts) {\n    const dx = mouse.x - p.x, dy = mouse.y - p.y;\n    const dist = Math.hypot(dx, dy) + 24;\n    const force = (42 / dist) * mouse.boost;\n    p.vx = (p.vx + (dx / dist) * force * 0.08) * 0.985;\n    p.vy = (p.vy + (dy / dist) * force * 0.08) * 0.985;\n    p.x = (p.x + p.vx + w) % w;\n    p.y = (p.y + p.vy + h) % h;\n    ctx.fillStyle = \`hsl(\${p.hue}, 90%, 65%)\`;\n    ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2); ctx.fill();\n  }\n  requestAnimationFrame(loop);\n}\nloop();`
        },
        glasscard: {
            label: 'Glass Metric Card UI',
            html: `<div class="card">\n  <div class="row">\n    <span class="badge">LIVE REVENUE</span>\n    <span class="delta" id="delta">+18.4%</span>\n  </div>\n  <div class="val" id="val">$48,920</div>\n  <svg id="spark" viewBox="0 0 240 60"></svg>\n  <button id="btn">Simulate Spike</button>\n</div>`,
            css: `body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: radial-gradient(circle at 30% 20%, #1e1b4b, #05070e 70%); font-family: system-ui, sans-serif; color: #f8fafc; }\n.card { width: 290px; padding: 22px; border-radius: 22px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14); backdrop-filter: blur(20px); box-shadow: 0 24px 60px rgba(0,0,0,0.45); }\n.row { display: flex; justify-content: space-between; align-items: center; font-size: 11px; }\n.badge { color: #94a3b8; letter-spacing: 0.1em; font-weight: 600; }\n.delta { color: #34d399; background: rgba(52,211,153,0.14); padding: 2px 8px; border-radius: 99px; font-weight: 600; }\n.val { font-size: 32px; font-weight: 700; margin: 10px 0 14px; letter-spacing: -0.03em; }\nsvg { width: 100%; height: 56px; overflow: visible; }\nbutton { margin-top: 14px; width: 100%; padding: 10px; border-radius: 12px; border: none; background: #38bdf8; color: #020617; font-weight: 700; cursor: pointer; }`,
            js: `let series = [18, 25, 22, 34, 31, 44, 41, 53, 58];\nfunction draw() {\n  const max = Math.max(...series), min = Math.min(...series);\n  const pts = series.map((v, i) => \`\${(i / (series.length - 1)) * 240},\${52 - ((v - min) / (max - min || 1)) * 44}\`).join(' ');\n  document.getElementById('spark').innerHTML = \`<polyline fill="none" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="\${pts}"/>\`;\n}\ndraw();\ndocument.getElementById('btn').onclick = () => {\n  const next = Math.round(30 + Math.random() * 55);\n  series = [...series.slice(1), next];\n  document.getElementById('val').textContent = '$' + (42000 + next * 210).toLocaleString();\n  console.log('Updated sparkline series ->', series.join(', '));\n  draw();\n};`
        },
        benchmark: {
            label: 'JS Algorithm Benchmark',
            html: `<div style="padding:18px;font-family:monospace;color:#e2e8f0">\n  <h3>JS Engine Micro-Benchmark</h3>\n  <p>Check the captured Console below for timing breakdown.</p>\n  <button id="run" style="padding:8px 14px;border-radius:8px;border:none;background:#34d399;color:#022c22;font-weight:bold;cursor:pointer">Re-run 100,000 Item Sort</button>\n</div>`,
            css: `body { margin: 0; background: #090d16; }`,
            js: `function runBench() {\n  const arr = Float64Array.from({ length: 100000 }, () => Math.random());\n  const t0 = performance.now();\n  arr.sort();\n  const dt = (performance.now() - t0).toFixed(2);\n  console.log(\`Sorted 100,000 Float64 items in \${dt} ms (min=\${arr[0].toFixed(5)}, max=\${arr[arr.length-1].toFixed(5)})\`);\n}\nrunBench();\ndocument.getElementById('run').onclick = runBench;`
        }
    };

    window.WindowContents.codeplay = `
        <div class="h-full flex flex-col bg-[#07080d]/95 text-xs overflow-hidden" id="codeplay-root">
            <div class="px-3.5 py-2 border-b border-white/[0.07] bg-black/45 flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-1.5">
                    <div class="os-segmented">
                        <button type="button" data-cp-tab="html" onclick="os.codeplaySetTab('html')" class="os-seg-btn active hover-target cursor-none">HTML</button>
                        <button type="button" data-cp-tab="css" onclick="os.codeplaySetTab('css')" class="os-seg-btn hover-target cursor-none">CSS</button>
                        <button type="button" data-cp-tab="js" onclick="os.codeplaySetTab('js')" class="os-seg-btn hover-target cursor-none">JS</button>
                    </div>
                    <select onchange="if(this.value){os.codeplayLoadPreset(this.value);this.value='';}" class="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-[11px] text-gray-200 outline-none">
                        <option value="">Load Starter...</option>
                        <option value="particles">Interactive Gravity Canvas</option>
                        <option value="glasscard">Glass Metric Card UI</option>
                        <option value="benchmark">JS Algorithm Benchmark</option>
                    </select>
                </div>
                <div class="flex items-center gap-1.5">
                    <label class="flex items-center gap-1.5 text-[11px] text-gray-400 mr-1">
                        <input type="checkbox" id="codeplay-autorun" checked onchange="os.codeplayState.autoRun=this.checked" class="accent-emerald-400">
                        <span>Auto-run</span>
                    </label>
                    <button type="button" onclick="os.codeplayRun()" class="px-3 py-1 rounded-lg bg-emerald-500 text-black font-semibold text-[11px] hover:bg-emerald-400 transition hover-target cursor-none">▶ Run</button>
                    <button type="button" onclick="os.codeplaySaveToVFS()" class="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/12 border border-white/10 text-[11px] text-gray-200 hover-target cursor-none">Save to Files</button>
                    <button type="button" onclick="os.codeplayExportHtml()" class="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/12 border border-white/10 text-[11px] text-gray-200 hover-target cursor-none">Export .html</button>
                </div>
            </div>

            <div class="flex-1 grid grid-cols-1 md:grid-cols-2 min-h-0">
                <div class="flex flex-col min-h-0 border-b md:border-b-0 md:border-r border-white/[0.07]">
                    <textarea id="codeplay-editor" spellcheck="false" oninput="os.codeplayOnInput(this.value)"
                        onkeydown="if((event.metaKey||event.ctrlKey)&&event.key==='Enter'){event.preventDefault();os.codeplayRun();}"
                        class="flex-1 w-full p-3.5 bg-[#05060b] text-gray-100 font-mono text-[11.5px] leading-relaxed outline-none resize-none"
                        placeholder="Write code here..."></textarea>
                </div>

                <div class="flex flex-col min-h-0 bg-black/50">
                    <iframe id="codeplay-iframe" sandbox="allow-scripts" title="Live Sandbox Preview" class="flex-1 w-full bg-[#090b12] border-0"></iframe>
                    <div class="h-32 border-t border-white/[0.08] bg-[#040509] flex flex-col shrink-0">
                        <div class="px-3 py-1 border-b border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-gray-400">
                            <span>SANDBOX CONSOLE</span>
                            <button type="button" onclick="os.codeplayClearConsole()" class="text-gray-500 hover:text-white hover-target cursor-none">Clear</button>
                        </div>
                        <div id="codeplay-console" class="flex-1 overflow-y-auto p-2.5 space-y-1 font-mono text-[11px] text-gray-300 select-text"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    let codeplayDebounce = null;

    window.extendOS({
        codeplayState: {
            tab: 'html',
            autoRun: true,
            html: CODE_PRESETS.particles.html,
            css: CODE_PRESETS.particles.css,
            js: CODE_PRESETS.particles.js
        },

        initCodePlay: () => {
            os.codeplaySetTab(os.codeplayState.tab || 'html');
            os.codeplayRun();
        },

        codeplaySetTab: (tab) => {
            os.codeplayState.tab = tab;
            const ed = document.getElementById('codeplay-editor');
            if (ed) ed.value = os.codeplayState[tab] || '';
            document.querySelectorAll('[data-cp-tab]').forEach((b) => {
                b.classList.toggle('active', b.getAttribute('data-cp-tab') === tab);
            });
        },

        codeplayLoadPreset: (key) => {
            const p = CODE_PRESETS[key];
            if (!p) return;
            os.codeplayState.html = p.html;
            os.codeplayState.css = p.css;
            os.codeplayState.js = p.js;
            os.codeplaySetTab(os.codeplayState.tab);
            os.codeplayRun();
        },

        codeplayOnInput: (val) => {
            os.codeplayState[os.codeplayState.tab] = val;
            if (os.codeplayState.autoRun) {
                clearTimeout(codeplayDebounce);
                codeplayDebounce = setTimeout(() => os.codeplayRun(), 380);
            }
        },

        codeplayBuildHtml: () => {
            const { html, css, js } = os.codeplayState;
            const bridge = `<script>(function(){
                const send = (level, args) => {
                    try {
                        parent.postMessage({ __aetherSandbox: true, level, text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
                    } catch (_) {}
                };
                ['log','info','warn','error'].forEach(fn => {
                    const orig = console[fn];
                    console[fn] = function(...args){ send(fn, args); orig && orig.apply(console, args); };
                });
                window.addEventListener('error', e => send('error', [e.message + (e.lineno ? ' (line ' + e.lineno + ')' : '')]));
                window.addEventListener('unhandledrejection', e => send('error', ['Unhandled Promise: ' + (e.reason?.message || e.reason)]));
            })();<\/script>`;
            return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style>${bridge}</head><body>${html}<script>${js}<\/script></body></html>`;
        },

        codeplayRun: () => {
            const ifr = document.getElementById('codeplay-iframe');
            if (!ifr) return;
            os.codeplayClearConsole();
            ifr.srcdoc = os.codeplayBuildHtml();
        },

        codeplayClearConsole: () => {
            const c = document.getElementById('codeplay-console');
            if (c) c.innerHTML = '';
        },

        codeplayExportHtml: () => {
            const blob = new Blob([os.codeplayBuildHtml()], { type: 'text/html;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `aether-sandbox-${Date.now()}.html`;
            a.click();
        },

        codeplaySaveToVFS: async () => {
            if (!window.AetherVFS) return;
            const rec = await AetherVFS.putFile({
                name: `Sandbox-${Date.now()}.html`,
                mime: 'text/html',
                kind: 'code',
                icon: 'file-code',
                folder: 'User Uploads',
                content: os.codeplayBuildHtml(),
                tags: ['sandbox', 'html']
            });
            window.Notifications && window.Notifications.push('SANDBOX SAVED', `"${rec.name}" saved to File Explorer`);
        }
    });

    window.addEventListener('message', (e) => {
        const d = e.data;
        if (!d || !d.__aetherSandbox) return;
        const host = document.getElementById('codeplay-console');
        if (!host) return;
        const color = d.level === 'error' ? 'text-rose-400' : d.level === 'warn' ? 'text-amber-300' : 'text-emerald-300';
        const row = document.createElement('div');
        row.className = `${color} border-b border-white/[0.04] pb-0.5`;
        row.textContent = `[${d.level.toUpperCase()}] ${d.text}`;
        host.appendChild(row);
        host.scrollTop = host.scrollHeight;
    });
})();
