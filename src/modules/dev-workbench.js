// AetherOS — Real-Engine Developer Workbench: Live Code Sandbox (codeplay), HTTP API Client (apiclient), and Diff/CSV/Cron Lab (datatools)
(function () {
    const esc = (v) => String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    window.WindowContents = window.WindowContents || {};

    // ═══════════════════════════════════════════════════════════════════════
    //  1. LIVE CODE SANDBOX (codeplay — Sandboxed HTML/CSS/JS + Console)
    // ═══════════════════════════════════════════════════════════════════════
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
                <!-- Left: Code Editor -->
                <div class="flex flex-col min-h-0 border-b md:border-b-0 md:border-r border-white/[0.07]">
                    <textarea id="codeplay-editor" spellcheck="false" oninput="os.codeplayOnInput(this.value)"
                        onkeydown="if((event.metaKey||event.ctrlKey)&&event.key==='Enter'){event.preventDefault();os.codeplayRun();}"
                        class="flex-1 w-full p-3.5 bg-[#05060b] text-gray-100 font-mono text-[11.5px] leading-relaxed outline-none resize-none"
                        placeholder="Write code here..."></textarea>
                </div>

                <!-- Right: Sandboxed Live Preview + Captured Console -->
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

    // ═══════════════════════════════════════════════════════════════════════
    //  2. HTTP & REST API CLIENT (apiclient — Local Postman / Hoppscotch)
    // ═══════════════════════════════════════════════════════════════════════
    const API_SAMPLES = {
        spacex:  { method: 'GET',  url: 'https://api.spacexdata.com/v5/launches/latest', headers: 'Accept: application/json', body: '' },
        hn:      { method: 'GET',  url: 'https://hacker-news.firebaseio.com/v0/item/8863.json', headers: 'Accept: application/json', body: '' },
        meteo:   { method: 'GET',  url: 'https://api.open-meteo.com/v1/forecast?latitude=35.68&longitude=139.76&current_weather=true', headers: 'Accept: application/json', body: '' },
        postecho:{ method: 'POST', url: 'https://jsonplaceholder.typicode.com/posts', headers: 'Content-Type: application/json', body: '{\n  "title": "AetherOS Telemetry Ping",\n  "status": "nominal",\n  "space": 1\n}' }
    };

    window.WindowContents.apiclient = `
        <div class="h-full flex flex-col bg-[#07080d]/95 text-xs overflow-hidden" id="apiclient-root">
            <!-- URL & Method Bar -->
            <form onsubmit="event.preventDefault();os.apiClientSend()" class="p-3 border-b border-white/[0.07] bg-black/45 flex flex-wrap items-center gap-2">
                <select id="apic-method" onchange="os.apiClientState.method=this.value" class="px-2.5 py-2 rounded-xl bg-white/[0.07] border border-white/15 font-mono font-bold text-xs text-sky-300 outline-none">
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                    <option value="HEAD">HEAD</option>
                </select>
                <input id="apic-url" type="text" value="https://api.spacexdata.com/v5/launches/latest"
                    placeholder="https://api.example.com/v1/resource"
                    class="flex-1 min-w-[220px] px-3 py-2 rounded-xl bg-black/55 border border-white/12 font-mono text-xs text-white outline-none focus:border-sky-400/45">
                <button type="submit" id="apic-send-btn" class="px-4 py-2 rounded-xl bg-sky-400 text-black font-semibold text-xs hover:bg-sky-300 transition hover-target cursor-none">Send</button>
                <select onchange="if(this.value){os.apiClientLoadSample(this.value);this.value='';}" class="px-2.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-[11px] text-gray-300 outline-none">
                    <option value="">Presets...</option>
                    <option value="spacex">GET SpaceX Latest Launch</option>
                    <option value="hn">GET HackerNews Story JSON</option>
                    <option value="meteo">GET Open-Meteo Tokyo</option>
                    <option value="postecho">POST JSONPlaceholder Echo</option>
                </select>
            </form>

            <!-- Split Request / Response -->
            <div class="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
                <!-- Request Config -->
                <div class="md:col-span-5 flex flex-col min-h-0 border-b md:border-b-0 md:border-r border-white/[0.07] p-3 gap-2.5 overflow-y-auto">
                    <div class="flex items-center justify-between">
                        <div class="os-segmented">
                            <button type="button" data-apic-req="headers" onclick="os.apiClientSetReqTab('headers')" class="os-seg-btn active hover-target cursor-none">Headers</button>
                            <button type="button" data-apic-req="params" onclick="os.apiClientSetReqTab('params')" class="os-seg-btn hover-target cursor-none">Query</button>
                            <button type="button" data-apic-req="body" onclick="os.apiClientSetReqTab('body')" class="os-seg-btn hover-target cursor-none">Body</button>
                            <button type="button" data-apic-req="history" onclick="os.apiClientSetReqTab('history')" class="os-seg-btn hover-target cursor-none">History</button>
                        </div>
                        <button type="button" onclick="os.apiClientCopyCurl()" class="px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-white/12 border border-white/10 text-[10.5px] font-mono text-gray-200 hover-target cursor-none">Copy cURL</button>
                    </div>

                    <textarea id="apic-headers" rows="6" spellcheck="false" placeholder="Accept: application/json&#10;Authorization: Bearer <token>"
                        class="flex-1 w-full p-2.5 rounded-xl bg-black/50 border border-white/10 font-mono text-[11px] text-gray-200 outline-none resize-none">Accept: application/json</textarea>
                    <textarea id="apic-params" rows="6" spellcheck="false" placeholder="limit=10&#10;sort=desc"
                        class="hidden flex-1 w-full p-2.5 rounded-xl bg-black/50 border border-white/10 font-mono text-[11px] text-gray-200 outline-none resize-none"></textarea>
                    <textarea id="apic-body" rows="6" spellcheck="false" placeholder='{"key": "value"}'
                        class="hidden flex-1 w-full p-2.5 rounded-xl bg-black/50 border border-white/10 font-mono text-[11px] text-gray-200 outline-none resize-none"></textarea>
                    <div id="apic-history" class="hidden flex-1 overflow-y-auto space-y-1.5"></div>
                </div>

                <!-- Response Viewer -->
                <div class="md:col-span-7 flex flex-col min-h-0 p-3 gap-2 bg-[#05060a]">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                        <div class="flex items-center gap-2 font-mono text-[11px]">
                            <span id="apic-status-pill" class="px-2 py-0.5 rounded-md bg-white/[0.06] text-gray-400">READY</span>
                            <span id="apic-time-pill" class="text-gray-400">-- ms</span>
                            <span id="apic-size-pill" class="text-gray-500">-- B</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <div class="os-segmented">
                                <button type="button" data-apic-res="body" onclick="os.apiClientSetResTab('body')" class="os-seg-btn active hover-target cursor-none">Body</button>
                                <button type="button" data-apic-res="headers" onclick="os.apiClientSetResTab('headers')" class="os-seg-btn hover-target cursor-none">Headers</button>
                            </div>
                            <button type="button" onclick="os.apiClientSaveResponse()" class="px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-white/12 border border-white/10 text-[10.5px] text-gray-200 hover-target cursor-none">Save</button>
                        </div>
                    </div>
                    <pre id="apic-res-body" class="flex-1 p-3 rounded-xl bg-black/65 border border-white/[0.07] font-mono text-[11px] text-emerald-300 overflow-auto select-text whitespace-pre-wrap">Click Send to inspect live HTTP status, timing, headers, and formatted JSON payload.</pre>
                    <pre id="apic-res-headers" class="hidden flex-1 p-3 rounded-xl bg-black/65 border border-white/[0.07] font-mono text-[11px] text-sky-300 overflow-auto select-text whitespace-pre-wrap"></pre>
                </div>
            </div>
        </div>
    `;

    // ═══════════════════════════════════════════════════════════════════════
    //  3. DIFF, CSV & CRON WORKBENCH (datatools)
    // ═══════════════════════════════════════════════════════════════════════
    window.WindowContents.datatools = `
        <div class="h-full flex flex-col bg-[#07080d]/95 text-xs overflow-hidden" id="datatools-root">
            <div class="px-4 py-2.5 border-b border-white/[0.07] bg-black/45 flex flex-wrap items-center justify-between gap-2">
                <div class="os-segmented">
                    <button type="button" data-dw-tab="diff" onclick="os.dataToolsSetTab('diff')" class="os-seg-btn active hover-target cursor-none">Line Diff Checker</button>
                    <button type="button" data-dw-tab="csv" onclick="os.dataToolsSetTab('csv')" class="os-seg-btn hover-target cursor-none">CSV ↔ JSON Table Explorer</button>
                    <button type="button" data-dw-tab="cron" onclick="os.dataToolsSetTab('cron')" class="os-seg-btn hover-target cursor-none">Cron Schedule Solver</button>
                </div>
                <span id="datatools-summary" class="text-[11px] font-mono text-gray-400"></span>
            </div>

            <!-- Tab 1: Real LCS Line-by-Line Diff Checker -->
            <div id="dw-pane-diff" class="flex-1 flex flex-col p-3.5 gap-3 min-h-0">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5 h-44 shrink-0">
                    <textarea id="dw-diff-a" spellcheck="false" oninput="os.dataToolsRunDiff()" placeholder="Original text / code..."
                        class="w-full h-full p-2.5 rounded-xl bg-black/50 border border-white/10 font-mono text-[11px] text-gray-200 outline-none resize-none">const config = {\n  mode: "eco",\n  maxWindows: 12,\n  sync: false\n};</textarea>
                    <textarea id="dw-diff-b" spellcheck="false" oninput="os.dataToolsRunDiff()" placeholder="Modified text / code..."
                        class="w-full h-full p-2.5 rounded-xl bg-black/50 border border-white/10 font-mono text-[11px] text-gray-200 outline-none resize-none">const config = {\n  mode: "cinematic",\n  maxWindows: 24,\n  spaces: 3,\n  sync: true\n};</textarea>
                </div>
                <div id="dw-diff-out" class="flex-1 rounded-xl bg-[#05060b] border border-white/[0.08] overflow-auto font-mono text-[11px] select-text"></div>
            </div>

            <!-- Tab 2: CSV <-> JSON Interactive Table & Column Analytics -->
            <div id="dw-pane-csv" class="hidden flex-1 flex flex-col p-3.5 gap-2.5 min-h-0">
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-1.5">
                        <button type="button" onclick="os.dataToolsParseTable()" class="px-3 py-1 rounded-lg bg-white text-black font-semibold text-[11px] hover-target cursor-none">Render Table</button>
                        <button type="button" onclick="os.dataToolsConvert('to-json')" class="px-2.5 py-1 rounded-lg bg-white/[0.07] hover:bg-white/14 border border-white/10 text-[11px] text-sky-200 hover-target cursor-none">CSV → JSON</button>
                        <button type="button" onclick="os.dataToolsConvert('to-csv')" class="px-2.5 py-1 rounded-lg bg-white/[0.07] hover:bg-white/14 border border-white/10 text-[11px] text-emerald-200 hover-target cursor-none">JSON → CSV</button>
                    </div>
                    <input id="dw-csv-filter" type="text" placeholder="Filter rows..." oninput="os.dataToolsRenderTable()"
                        class="w-44 px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-[11px] text-white outline-none">
                </div>
                <textarea id="dw-csv-in" rows="4" spellcheck="false"
                    class="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 font-mono text-[11px] text-gray-200 outline-none shrink-0">service,region,latency_ms,requests\nedge-gateway,ap-south,18,14200\nauth-core,eu-west,42,8900\nstorage-vfs,us-east,29,11350\nrealtime-sync,ap-south,14,19400</textarea>
                <div id="dw-csv-stats" class="flex flex-wrap gap-2 text-[10.5px] font-mono text-gray-300"></div>
                <div id="dw-csv-table-wrap" class="flex-1 rounded-xl border border-white/[0.08] bg-black/45 overflow-auto"></div>
            </div>

            <!-- Tab 3: Cron Schedule Explainer & Next-5-Runs Solver -->
            <div id="dw-pane-cron" class="hidden flex-1 flex flex-col p-4 gap-3.5 min-h-0 overflow-y-auto">
                <div class="flex flex-wrap items-center gap-2">
                    <input id="dw-cron-in" type="text" value="*/15 9-17 * * 1-5" oninput="os.dataToolsRunCron()"
                        class="flex-1 min-w-[220px] px-3.5 py-2 rounded-xl bg-black/55 border border-white/15 font-mono text-sm text-emerald-300 outline-none focus:border-emerald-400/50">
                    <button type="button" onclick="document.getElementById('dw-cron-in').value='0 0 * * *';os.dataToolsRunCron()" class="px-2.5 py-1.5 rounded-lg bg-white/[0.06] text-[11px] text-gray-300 hover-target cursor-none">Daily Midnight</button>
                    <button type="button" onclick="document.getElementById('dw-cron-in').value='*/5 * * * *';os.dataToolsRunCron()" class="px-2.5 py-1.5 rounded-lg bg-white/[0.06] text-[11px] text-gray-300 hover-target cursor-none">Every 5m</button>
                    <button type="button" onclick="document.getElementById('dw-cron-in').value='30 8 * * 1-5';os.dataToolsRunCron()" class="px-2.5 py-1.5 rounded-lg bg-white/[0.06] text-[11px] text-gray-300 hover-target cursor-none">Weekdays 08:30</button>
                </div>
                <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/25">
                    <div class="text-[10px] font-mono uppercase tracking-wider text-emerald-300/80 mb-1">Human Schedule</div>
                    <div id="dw-cron-human" class="text-sm font-semibold text-white"></div>
                </div>
                <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                    <div class="text-[10px] font-mono uppercase tracking-wider text-gray-400">Next 5 Scheduled Runs (Local Time)</div>
                    <div id="dw-cron-runs" class="space-y-1.5 font-mono text-xs text-sky-200"></div>
                </div>
            </div>
        </div>
    `;

    // ── Helper Algorithms: LCS Diff, RFC-4180 CSV, Cron Matcher ──
    function computeLineDiff(textA, textB) {
        const a = String(textA || '').split('\n');
        const b = String(textB || '').split('\n');
        const n = a.length, m = b.length;
        // Cap DP matrix at 600x600 for instant UI responsiveness
        if (n * m > 360000) {
            return a.map((line, i) => ({ type: line === b[i] ? 'same' : 'chg', aLine: i + 1, bLine: i + 1, text: line }));
        }
        const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
        for (let i = n - 1; i >= 0; i--) {
            for (let j = m - 1; j >= 0; j--) {
                dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
            }
        }
        const out = [];
        let i = 0, j = 0;
        while (i < n && j < m) {
            if (a[i] === b[j]) {
                out.push({ type: 'same', aNum: i + 1, bNum: j + 1, text: a[i] });
                i++; j++;
            } else if (dp[i + 1][j] >= dp[i][j + 1]) {
                out.push({ type: 'del', aNum: i + 1, bNum: '', text: a[i] });
                i++;
            } else {
                out.push({ type: 'add', aNum: '', bNum: j + 1, text: b[j] });
                j++;
            }
        }
        while (i < n) { out.push({ type: 'del', aNum: i + 1, bNum: '', text: a[i++] }); }
        while (j < m) { out.push({ type: 'add', aNum: '', bNum: j + 1, text: b[j++] }); }
        return out;
    }

    function parseCsvRows(csvText) {
        const rows = [];
        let cur = [], field = '', inQuotes = false;
        const s = String(csvText || '').trim();
        for (let i = 0; i < s.length; i++) {
            const ch = s[i];
            if (inQuotes) {
                if (ch === '"' && s[i + 1] === '"') { field += '"'; i++; }
                else if (ch === '"') inQuotes = false;
                else field += ch;
            } else {
                if (ch === '"') inQuotes = true;
                else if (ch === ',') { cur.push(field); field = ''; }
                else if (ch === '\n' || ch === '\r') {
                    if (ch === '\r' && s[i + 1] === '\n') i++;
                    cur.push(field); rows.push(cur); cur = []; field = '';
                } else field += ch;
            }
        }
        cur.push(field);
        if (cur.length > 1 || cur[0] !== '') rows.push(cur);
        if (!rows.length) return { headers: [], records: [] };
        const headers = rows[0];
        const records = rows.slice(1).map((r) => {
            const obj = {};
            headers.forEach((h, idx) => { obj[h] = r[idx] ?? ''; });
            return obj;
        });
        return { headers, records };
    }

    function parseCronField(expr, min, max) {
        const set = new Set();
        for (const part of String(expr).split(',')) {
            const stepParts = part.split('/');
            const step = stepParts[1] ? Math.max(1, parseInt(stepParts[1], 10)) : 1;
            const range = stepParts[0];
            let start = min, end = max;
            if (range !== '*') {
                if (range.includes('-')) {
                    const [a, b] = range.split('-').map((x) => parseInt(x, 10));
                    start = a; end = b;
                } else {
                    start = parseInt(range, 10);
                    end = stepParts[1] ? max : start;
                }
            }
            if (Number.isNaN(start) || Number.isNaN(end)) return null;
            for (let v = start; v <= end; v += step) {
                if (v >= min && v <= max) set.add(v === 7 && max === 6 ? 0 : v);
            }
        }
        return set.size ? set : null;
    }

    let codeplayDebounce = null;

    window.extendOS({
        codeplayState: {
            tab: 'html',
            autoRun: true,
            html: CODE_PRESETS.particles.html,
            css: CODE_PRESETS.particles.css,
            js: CODE_PRESETS.particles.js
        },

        apiClientState: {
            method: 'GET',
            reqTab: 'headers',
            resTab: 'body',
            lastResponseText: '',
            history: []
        },

        dataToolsState: {
            tab: 'diff',
            headers: [],
            records: [],
            sortCol: '',
            sortAsc: true
        },

        // ── Live Code Sandbox Methods ──
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
        },

        // ── HTTP & REST API Client Methods ──
        initApiClient: () => {
            os.apiClientRenderHistory();
        },

        apiClientSetReqTab: (tab) => {
            os.apiClientState.reqTab = tab;
            ['headers', 'params', 'body', 'history'].forEach((t) => {
                const el = document.getElementById(`apic-${t}`);
                if (el) el.classList.toggle('hidden', t !== tab);
            });
            document.querySelectorAll('[data-apic-req]').forEach((b) => {
                b.classList.toggle('active', b.getAttribute('data-apic-req') === tab);
            });
        },

        apiClientSetResTab: (tab) => {
            os.apiClientState.resTab = tab;
            const b = document.getElementById('apic-res-body');
            const h = document.getElementById('apic-res-headers');
            if (b) b.classList.toggle('hidden', tab !== 'body');
            if (h) h.classList.toggle('hidden', tab !== 'headers');
            document.querySelectorAll('[data-apic-res]').forEach((btn) => {
                btn.classList.toggle('active', btn.getAttribute('data-apic-res') === tab);
            });
        },

        apiClientLoadSample: (key) => {
            const s = API_SAMPLES[key];
            if (!s) return;
            const m = document.getElementById('apic-method');
            const u = document.getElementById('apic-url');
            const h = document.getElementById('apic-headers');
            const b = document.getElementById('apic-body');
            if (m) m.value = s.method;
            if (u) u.value = s.url;
            if (h) h.value = s.headers;
            if (b) b.value = s.body;
            os.apiClientSetReqTab(s.body ? 'body' : 'headers');
        },

        _apiClientBuildRequest: () => {
            const method = (document.getElementById('apic-method')?.value || 'GET').toUpperCase();
            let url = (document.getElementById('apic-url')?.value || '').trim();
            const paramsRaw = (document.getElementById('apic-params')?.value || '').trim();
            const headersRaw = (document.getElementById('apic-headers')?.value || '').trim();
            const bodyRaw = document.getElementById('apic-body')?.value || '';

            if (paramsRaw) {
                const u = new URL(url, location.origin);
                paramsRaw.split('\n').forEach((line) => {
                    const idx = line.indexOf('=');
                    if (idx > 0) u.searchParams.set(line.slice(0, idx).trim(), line.slice(idx + 1).trim());
                });
                url = u.toString();
            }

            const headers = {};
            headersRaw.split('\n').forEach((line) => {
                const idx = line.indexOf(':');
                if (idx > 0) headers[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
            });

            return { method, url, headers, body: ['GET', 'HEAD'].includes(method) ? undefined : bodyRaw };
        },

        apiClientCopyCurl: () => {
            try {
                const req = os._apiClientBuildRequest();
                const hdrFlags = Object.entries(req.headers).map(([k, v]) => `-H '${k}: ${v}'`).join(' ');
                const bodyFlag = req.body ? `--data-raw '${req.body.replace(/'/g, "'\\''")}'` : '';
                const curl = `curl -X ${req.method} ${hdrFlags} ${bodyFlag} '${req.url}'`.replace(/\s+/g, ' ').trim();
                navigator.clipboard && navigator.clipboard.writeText(curl).catch(() => {});
                os.recordClipboardItem && os.recordClipboardItem(curl, 'API Client', `cURL ${req.method}`);
                window.Notifications && window.Notifications.push('API CLIENT', 'Copied cURL command to clipboard');
            } catch (e) {
                window.Notifications && window.Notifications.push('API CLIENT', 'Enter a valid URL first');
            }
        },

        apiClientSend: async () => {
            const statusPill = document.getElementById('apic-status-pill');
            const timePill = document.getElementById('apic-time-pill');
            const sizePill = document.getElementById('apic-size-pill');
            const resBody = document.getElementById('apic-res-body');
            const resHeaders = document.getElementById('apic-res-headers');
            const sendBtn = document.getElementById('apic-send-btn');

            let req;
            try {
                req = os._apiClientBuildRequest();
            } catch (e) {
                if (resBody) resBody.textContent = 'Invalid URL: ' + e.message;
                return;
            }

            if (sendBtn) sendBtn.textContent = '...';
            if (statusPill) { statusPill.textContent = 'SENDING'; statusPill.className = 'px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300'; }

            const t0 = performance.now();
            try {
                const res = await fetch(req.url, {
                    method: req.method,
                    headers: req.headers,
                    body: req.body
                });
                const dt = Math.round(performance.now() - t0);
                const rawText = await res.text();
                let formatted = rawText;
                try { formatted = JSON.stringify(JSON.parse(rawText), null, 2); } catch (_) {}

                os.apiClientState.lastResponseText = formatted;
                if (resBody) resBody.textContent = formatted || '(empty response body)';
                if (resHeaders) {
                    const hdrLines = [];
                    if (res.headers && res.headers.forEach) {
                        res.headers.forEach((v, k) => hdrLines.push(`${k}: ${v}`));
                    }
                    resHeaders.textContent = hdrLines.join('\n') || '(no CORS-exposed response headers)';
                }
                if (statusPill) {
                    const ok = res.status >= 200 && res.status < 300;
                    statusPill.textContent = `${res.status} ${res.statusText || (ok ? 'OK' : '')}`.trim();
                    statusPill.className = `px-2 py-0.5 rounded-md font-bold ${ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`;
                }
                if (timePill) timePill.textContent = `${dt} ms`;
                if (sizePill) sizePill.textContent = `${rawText.length.toLocaleString()} B`;

                os.apiClientState.history.unshift({ method: req.method, url: req.url, status: res.status, ms: dt });
                os.apiClientState.history = os.apiClientState.history.slice(0, 15);
                os.apiClientRenderHistory();
            } catch (err) {
                const dt = Math.round(performance.now() - t0);
                if (statusPill) { statusPill.textContent = 'NETWORK / CORS ERR'; statusPill.className = 'px-2 py-0.5 rounded-md bg-red-500/20 text-red-300'; }
                if (timePill) timePill.textContent = `${dt} ms`;
                if (resBody) resBody.textContent = `Request failed: ${err.message}\n\nTip: Target server must allow browser CORS requests (or test with SpaceX / Open-Meteo / JSONPlaceholder presets).`;
            } finally {
                if (sendBtn) sendBtn.textContent = 'Send';
            }
        },

        apiClientRenderHistory: () => {
            const el = document.getElementById('apic-history');
            if (!el) return;
            const list = os.apiClientState.history || [];
            if (!list.length) {
                el.innerHTML = '<div class="text-gray-500 py-4 text-center">No requests sent in this session yet.</div>';
                return;
            }
            el.innerHTML = list.map((item, idx) => `
                <button type="button" onclick="document.getElementById('apic-method').value='${esc(item.method)}';document.getElementById('apic-url').value='${esc(item.url)}';os.apiClientSetReqTab('headers')"
                    class="w-full p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-between gap-2 text-left font-mono text-[10.5px] hover-target cursor-none">
                    <span class="text-sky-300 font-bold shrink-0">${esc(item.method)}</span>
                    <span class="text-gray-300 truncate flex-1">${esc(item.url)}</span>
                    <span class="text-emerald-300 shrink-0">${item.status} · ${item.ms}ms</span>
                </button>
            `).join('');
        },

        apiClientSaveResponse: async () => {
            if (!os.apiClientState.lastResponseText || !window.AetherVFS) return;
            const rec = await AetherVFS.putFile({
                name: `API-Response-${Date.now()}.json`,
                mime: 'application/json',
                kind: 'code',
                icon: 'file-json',
                folder: 'Saved Clipper',
                content: os.apiClientState.lastResponseText,
                tags: ['api', 'json']
            });
            window.Notifications && window.Notifications.push('SAVED TO FILES', `"${rec.name}" saved to File Explorer`);
        },

        // ── Diff, CSV & Cron Workbench Methods ──
        initDataTools: () => {
            os.dataToolsSetTab(os.dataToolsState.tab || 'diff');
        },

        dataToolsOpenVfsFile: (id) => {
            const f = (window.AetherVFS && AetherVFS.getCachedFile(id)) || (os.fmFindById && os.fmFindById(id));
            if (!f || !f.content) return;
            os.openWindow('datatools');
            setTimeout(() => {
                os.dataToolsSetTab('csv');
                const inp = document.getElementById('dw-csv-in');
                if (inp) inp.value = f.content;
                os.dataToolsParseTable();
            }, 30);
        },

        dataToolsSetTab: (tab) => {
            os.dataToolsState.tab = tab;
            ['diff', 'csv', 'cron'].forEach((t) => {
                const p = document.getElementById(`dw-pane-${t}`);
                if (p) p.classList.toggle('hidden', t !== tab);
            });
            document.querySelectorAll('[data-dw-tab]').forEach((b) => {
                b.classList.toggle('active', b.getAttribute('data-dw-tab') === tab);
            });
            if (tab === 'diff') os.dataToolsRunDiff();
            if (tab === 'csv') os.dataToolsParseTable();
            if (tab === 'cron') os.dataToolsRunCron();
        },

        dataToolsRunDiff: () => {
            const a = document.getElementById('dw-diff-a')?.value ?? '';
            const b = document.getElementById('dw-diff-b')?.value ?? '';
            const out = document.getElementById('dw-diff-out');
            const sum = document.getElementById('datatools-summary');
            if (!out) return;

            const diff = computeLineDiff(a, b);
            const adds = diff.filter((d) => d.type === 'add').length;
            const dels = diff.filter((d) => d.type === 'del').length;
            if (sum) sum.textContent = `+${adds} additions · -${dels} deletions`;

            out.innerHTML = diff.map((row) => {
                const cls = row.type === 'add' ? 'bg-emerald-500/15 text-emerald-200'
                          : row.type === 'del' ? 'bg-rose-500/15 text-rose-200'
                          : 'text-gray-400';
                const sym = row.type === 'add' ? '+' : row.type === 'del' ? '-' : ' ';
                return `<div class="grid grid-cols-[38px_38px_18px_1fr] px-2 py-0.5 border-b border-white/[0.03] ${cls}">
                    <span class="text-gray-600 select-none">${row.aNum}</span>
                    <span class="text-gray-600 select-none">${row.bNum}</span>
                    <span class="select-none font-bold">${sym}</span>
                    <span class="whitespace-pre-wrap break-all">${esc(row.text)}</span>
                </div>`;
            }).join('');
        },

        dataToolsParseTable: () => {
            const raw = (document.getElementById('dw-csv-in')?.value || '').trim();
            if (!raw) return;
            try {
                if (raw.startsWith('[')) {
                    const arr = JSON.parse(raw);
                    const headers = Array.from(new Set(arr.flatMap((o) => Object.keys(o || {}))));
                    os.dataToolsState.headers = headers;
                    os.dataToolsState.records = arr;
                } else {
                    const parsed = parseCsvRows(raw);
                    os.dataToolsState.headers = parsed.headers;
                    os.dataToolsState.records = parsed.records;
                }
                os.dataToolsRenderTable();
            } catch (e) {
                const wrap = document.getElementById('dw-csv-table-wrap');
                if (wrap) wrap.innerHTML = `<div class="p-4 text-red-300 font-mono">Parse error: ${esc(e.message)}</div>`;
            }
        },

        dataToolsSortBy: (col) => {
            if (os.dataToolsState.sortCol === col) os.dataToolsState.sortAsc = !os.dataToolsState.sortAsc;
            else { os.dataToolsState.sortCol = col; os.dataToolsState.sortAsc = true; }
            os.dataToolsRenderTable();
        },

        dataToolsRenderTable: () => {
            const wrap = document.getElementById('dw-csv-table-wrap');
            const statsEl = document.getElementById('dw-csv-stats');
            const sum = document.getElementById('datatools-summary');
            if (!wrap) return;
            const { headers, records, sortCol, sortAsc } = os.dataToolsState;
            const q = (document.getElementById('dw-csv-filter')?.value || '').trim().toLowerCase();

            let rows = records.filter((r) => !q || headers.some((h) => String(r[h] ?? '').toLowerCase().includes(q)));
            if (sortCol) {
                rows = [...rows].sort((a, b) => {
                    const va = a[sortCol], vb = b[sortCol];
                    const na = parseFloat(va), nb = parseFloat(vb);
                    const cmp = (!Number.isNaN(na) && !Number.isNaN(nb)) ? (na - nb) : String(va ?? '').localeCompare(String(vb ?? ''));
                    return sortAsc ? cmp : -cmp;
                });
            }

            if (sum) sum.textContent = `${rows.length} rows × ${headers.length} columns`;

            // Numeric column stats
            if (statsEl) {
                const statPills = [];
                headers.forEach((h) => {
                    const nums = rows.map((r) => parseFloat(r[h])).filter((n) => Number.isFinite(n));
                    if (nums.length && nums.length === rows.length) {
                        const total = nums.reduce((a, b) => a + b, 0);
                        const avg = total / nums.length;
                        statPills.push(`<span class="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10"><strong>${esc(h)}</strong>: sum=${Number(total.toFixed(2))} · avg=${Number(avg.toFixed(2))}</span>`);
                    }
                });
                statsEl.innerHTML = statPills.join('');
            }

            wrap.innerHTML = `
                <table class="w-full text-left border-collapse font-mono text-[11px]">
                    <thead>
                        <tr class="border-b border-white/10 bg-white/[0.04] text-sky-300">
                            ${headers.map((h) => `<th onclick="os.dataToolsSortBy('${esc(h)}')" class="px-3 py-2 cursor-pointer hover:bg-white/10 select-none">${esc(h)} ${sortCol === h ? (sortAsc ? '↑' : '↓') : ''}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map((r) => `<tr class="border-b border-white/[0.04] hover:bg-white/[0.03]">${headers.map((h) => `<td class="px-3 py-1.5 text-gray-200">${esc(r[h] ?? '')}</td>`).join('')}</tr>`).join('')}
                    </tbody>
                </table>
            `;
        },

        dataToolsConvert: (dir) => {
            const inp = document.getElementById('dw-csv-in');
            if (!inp) return;
            os.dataToolsParseTable();
            const { headers, records } = os.dataToolsState;
            if (dir === 'to-json') {
                inp.value = JSON.stringify(records, null, 2);
            } else {
                const escCsv = (v) => {
                    const s = String(v ?? '');
                    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
                };
                const lines = [headers.map(escCsv).join(',')];
                records.forEach((r) => lines.push(headers.map((h) => escCsv(r[h])).join(',')));
                inp.value = lines.join('\n');
            }
        },

        dataToolsRunCron: () => {
            const raw = (document.getElementById('dw-cron-in')?.value || '').trim();
            const humanEl = document.getElementById('dw-cron-human');
            const runsEl = document.getElementById('dw-cron-runs');
            if (!humanEl || !runsEl) return;

            const parts = raw.split(/\s+/);
            if (parts.length !== 5) {
                humanEl.textContent = 'Enter a standard 5-field cron expression: minute hour day-of-month month day-of-week';
                runsEl.innerHTML = '';
                return;
            }

            const [mExp, hExp, domExp, monExp, dowExp] = parts;
            const mSet = parseCronField(mExp, 0, 59);
            const hSet = parseCronField(hExp, 0, 23);
            const domSet = parseCronField(domExp, 1, 31);
            const monSet = parseCronField(monExp, 1, 12);
            const dowSet = parseCronField(dowExp, 0, 6);

            if (!mSet || !hSet || !domSet || !monSet || !dowSet) {
                humanEl.textContent = 'Invalid cron syntax in one or more fields.';
                runsEl.innerHTML = '';
                return;
            }

            const descMin = mExp === '*' ? 'Every minute' : mExp.startsWith('*/') ? `Every ${mExp.slice(2)} minutes` : `At minute ${mExp}`;
            const descHr  = hExp === '*' ? 'of every hour' : `during hour ${hExp}`;
            const descDow = dowExp === '*' ? 'every day' : dowExp === '1-5' ? 'Monday through Friday' : `on weekday [${dowExp}]`;
            humanEl.textContent = `${descMin} ${descHr}, ${descDow} (${raw})`;

            // Compute exact next 5 matching execution timestamps
            const runs = [];
            const probe = new Date();
            probe.setSeconds(0, 0);
            probe.setMinutes(probe.getMinutes() + 1);

            let guard = 0;
            while (runs.length < 5 && guard < 525600) {
                guard++;
                if (
                    monSet.has(probe.getMonth() + 1) &&
                    domSet.has(probe.getDate()) &&
                    dowSet.has(probe.getDay()) &&
                    hSet.has(probe.getHours()) &&
                    mSet.has(probe.getMinutes())
                ) {
                    runs.push(new Date(probe.getTime()));
                }
                probe.setMinutes(probe.getMinutes() + 1);
            }

            runsEl.innerHTML = runs.length
                ? runs.map((d, idx) => `<div class="px-3 py-1.5 rounded-lg bg-black/45 border border-white/[0.06] flex items-center justify-between"><span>#${idx + 1}  ${esc(d.toLocaleString())}</span><span class="text-gray-500 text-[10.5px]">${esc(d.toISOString())}</span></div>`).join('')
                : '<div class="text-amber-300">No matching date within the next 12 months.</div>';
        }
    });

    // Listen for Sandboxed Iframe Console postMessages
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
