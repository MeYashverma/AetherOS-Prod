// AetherOS — Open-Source Projects & Native WebApp Desktop Integrations:
// 1. Photopea Studio (Official window.postMessage ArrayBuffer VFS Load/Save Bridge)
// 2. OpenCanvas Board (Excalidraw + Official Draw.io Dark JSON VFS Sync + tldraw)
// 3. Webamp + SomaFM Deck (SomaFM Live Channels API + captbaritone/webamp Winamp 2.9 Desktop Engine)
(function () {
    const esc = (v) => String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

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
    const SOMAFM_FALLBACK = [
        { id: 'groovesalad', title: 'Groove Salad',     genre: 'Ambient / Downtempo', listeners: 1840, stream: 'https://ice2.somafm.com/groovesalad-128-mp3', lastPlaying: 'Boards of Canada — Olson' },
        { id: 'defcon',      title: 'DEF CON Radio',    genre: 'Hacker / Electronic', listeners: 620,  stream: 'https://ice2.somafm.com/defcon-128-mp3',      lastPlaying: 'Perturbator — Future Club' },
        { id: 'vaporwaves',  title: 'Vaporwaves',       genre: 'Vaporwave / Future Funk', listeners: 490, stream: 'https://ice2.somafm.com/vaporwaves-128-mp3', lastPlaying: 'SAINT PEPSI — Enjoy Yourself' },
        { id: 'deepspaceone',title: 'Deep Space One',   genre: 'Deep Space Ambient',  listeners: 710,  stream: 'https://ice2.somafm.com/deepspaceone-128-mp3',lastPlaying: 'Stellardrone — Red Giant' },
        { id: 'secretagent', title: 'Secret Agent',     genre: 'Lounge / Spy Jazz',   listeners: 540,  stream: 'https://ice2.somafm.com/secretagent-128-mp3', lastPlaying: 'Lalo Schifrin — Mission' },
        { id: 'u80s',        title: 'Underground 80s',  genre: 'Synthpop / New Wave', listeners: 660,  stream: 'https://ice2.somafm.com/u80s-128-mp3',        lastPlaying: 'New Order — Blue Monday' }
    ];

    window.WindowContents.winamp = `
        <div class="h-full flex flex-col bg-[#0a0c13] text-white text-xs select-none overflow-hidden" id="winamp-root">
            <div class="p-3.5 bg-gradient-to-r from-emerald-950/50 via-black/60 to-amber-950/40 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2.5">
                <div>
                    <div class="font-semibold text-sm text-white flex items-center gap-2">
                        <span>SomaFM Live + Open-Source Webamp 2.9</span>
                        <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">LIVE STREAMS</span>
                    </div>
                    <div class="text-[11px] text-gray-400 mt-0.5">Stream commercial-free SomaFM channels or launch floating classic Winamp 2.9 on your desktop</div>
                </div>
                <button type="button" id="webamp-launch-btn" onclick="os.launchDesktopWebamp()"
                    class="px-4 py-2 rounded-xl bg-amber-400 text-black font-bold text-xs hover:bg-amber-300 shadow-lg transition hover-target cursor-none">
                    ⚡ Spawn Classic Winamp 2.9 on Desktop
                </button>
            </div>

            <!-- Live Channel Cards -->
            <div id="somafm-grid" class="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto"></div>

            <!-- Built-in Zero-Latency Stream Bar -->
            <div class="p-3.5 bg-black/75 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div class="min-w-0 flex-1">
                    <div id="somafm-now-title" class="font-semibold text-white truncate">Select a SomaFM station above to stream live</div>
                    <div id="somafm-now-track" class="text-[11px] font-mono text-emerald-300 truncate">Ready</div>
                </div>
                <audio id="somafm-audio" controls class="h-8 w-64 max-w-full"></audio>
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

        // ── SomaFM Live API + Open-Source Webamp 2.9 Desktop Engine ──
        winampState: {
            channels: SOMAFM_FALLBACK,
            activeId: null,
            webampInstance: null
        },

        initWinamp: () => {
            os.somafmFetchChannels();
        },

        killWinamp: () => {
            const aud = document.getElementById('somafm-audio');
            if (aud) aud.pause();
        },

        somafmFetchChannels: async () => {
            try {
                const res = await fetch('https://somafm.com/channels.json');
                const data = await res.json();
                if (Array.isArray(data?.channels) && data.channels.length) {
                    os.winampState.channels = data.channels.slice(0, 14).map((c) => ({
                        id: c.id,
                        title: c.title,
                        genre: c.genre || 'Electronic / Ambient',
                        listeners: Number(c.listeners || 0),
                        lastPlaying: c.lastPlaying || '',
                        image: c.image || '',
                        stream: `https://ice2.somafm.com/${c.id}-128-mp3`
                    }));
                }
            } catch (_) {}
            os.somafmRenderGrid();
        },

        somafmRenderGrid: () => {
            const grid = document.getElementById('somafm-grid');
            if (!grid) return;
            grid.innerHTML = os.winampState.channels.map((ch) => {
                const active = os.winampState.activeId === ch.id;
                return `
                    <button type="button" onclick="os.somafmPlay('${esc(ch.id)}')"
                        class="text-left p-3.5 rounded-2xl border transition flex items-start justify-between gap-3 hover-target cursor-none ${active ? 'bg-emerald-500/15 border-emerald-400/45' : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/10'}">
                        <div class="min-w-0">
                            <div class="font-semibold text-sm text-white truncate">${esc(ch.title)}</div>
                            <div class="text-[10.5px] text-amber-300 font-mono mt-0.5">${esc(ch.genre)}</div>
                            <div class="text-[11px] text-gray-400 truncate mt-1.5">♪ ${esc(ch.lastPlaying || 'Live Broadcast')}</div>
                        </div>
                        <span class="px-2 py-0.5 rounded-full bg-black/50 border border-white/10 font-mono text-[10px] text-emerald-300 shrink-0">${ch.listeners} listening</span>
                    </button>
                `;
            }).join('');
        },

        somafmPlay: (id) => {
            const ch = os.winampState.channels.find((c) => c.id === id);
            if (!ch) return;
            os.winampState.activeId = id;
            os.somafmRenderGrid();
            const aud = document.getElementById('somafm-audio');
            const t = document.getElementById('somafm-now-title');
            const tr = document.getElementById('somafm-now-track');
            if (t) t.textContent = `${ch.title} — ${ch.genre}`;
            if (tr) tr.textContent = `Now Playing: ${ch.lastPlaying || 'Live Stream'}`;
            if (aud) {
                aud.src = ch.stream;
                aud.play().catch(() => {});
            }
        },

        launchDesktopWebamp: async () => {
            const btn = document.getElementById('webamp-launch-btn');
            if (os.winampState.webampInstance) {
                window.Notifications && window.Notifications.push('WEBAMP 2.9', 'Winamp 2.9 is already active on your desktop!');
                return;
            }
            if (btn) btn.textContent = 'Loading Webamp Engine...';

            if (!window.Webamp) {
                await new Promise((resolve, reject) => {
                    const s = document.createElement('script');
                    s.src = 'https://unpkg.com/webamp@1.5.0/built/webamp.bundle.min.js';
                    s.onload = resolve;
                    s.onerror = reject;
                    document.head.appendChild(s);
                }).catch(() => {});
            }

            if (!window.Webamp) {
                if (btn) btn.textContent = '⚡ Spawn Classic Winamp 2.9 on Desktop';
                window.Notifications && window.Notifications.push('WEBAMP', 'Could not load Webamp CDN — use built-in SomaFM player below.');
                return;
            }

            let host = document.getElementById('webamp-desktop-mount');
            if (!host) {
                host = document.createElement('div');
                host.id = 'webamp-desktop-mount';
                host.style.cssText = 'position:fixed;z-index:9100;top:90px;left:120px;';
                document.body.appendChild(host);
            }

            // Pause embedded audio so streams don't double-play
            const aud = document.getElementById('somafm-audio');
            if (aud) aud.pause();

            const tracks = os.winampState.channels.slice(0, 6).map((c) => ({
                metaData: { artist: 'SomaFM Live', title: `${c.title} (${c.genre})` },
                url: c.stream
            }));

            const webamp = new window.Webamp({ initialTracks: tracks });
            webamp.onClose(() => {
                webamp.dispose();
                os.winampState.webampInstance = null;
                if (btn) btn.textContent = '⚡ Spawn Classic Winamp 2.9 on Desktop';
            });
            await webamp.renderWhenReady(host);
            os.winampState.webampInstance = webamp;
            if (btn) btn.textContent = '✓ Winamp 2.9 Active on Desktop';
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
