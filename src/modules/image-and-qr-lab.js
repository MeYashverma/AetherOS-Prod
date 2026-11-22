// AetherOS — Image Compressor, Format Converter, Pixel Eyedropper & Offline ISO-18004 QR Code Studio (imagelab)
(function () {
    const esc = (v) => String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    window.WindowContents = window.WindowContents || {};

    window.WindowContents.imagelab = `
        <div class="h-full flex flex-col bg-[#07080d]/95 text-xs overflow-hidden select-none" id="imagelab-root">
            <div class="px-4 py-2.5 border-b border-white/[0.07] bg-black/45 flex flex-wrap items-center justify-between gap-2">
                <div class="os-segmented">
                    <button type="button" data-il-mode="image" onclick="os.imageLabSetMode('image')" class="os-seg-btn active hover-target cursor-none">Image Convert &amp; Compress</button>
                    <button type="button" data-il-mode="qr" onclick="os.imageLabSetMode('qr')" class="os-seg-btn hover-target cursor-none">Offline QR Code Studio</button>
                </div>
                <div id="imagelab-Savings-badge" class="text-[11px] font-mono text-emerald-300">100% Local GPU/Canvas Processing</div>
            </div>

            <!-- Mode 1: Image Compressor, Converter, Resizer & Pixel Eyedropper -->
            <div id="il-pane-image" class="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
                <!-- Controls Sidebar -->
                <div class="md:col-span-5 p-3.5 border-b md:border-b-0 md:border-r border-white/[0.07] flex flex-col gap-3 overflow-y-auto">
                    <div class="flex items-center gap-2">
                        <button type="button" onclick="os.imageLabTriggerOpen()" class="flex-1 py-2 px-3 rounded-xl bg-white text-black font-semibold text-xs hover:bg-gray-200 transition hover-target cursor-none flex items-center justify-center gap-1.5">
                            <i data-lucide="upload" class="w-3.5 h-3.5"></i><span>Open Image</span>
                        </button>
                        <button type="button" onclick="os.imageLabResetAdjustments()" class="py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/12 border border-white/10 text-gray-300 text-xs hover-target cursor-none">Reset</button>
                    </div>

                    <!-- Format & Quality -->
                    <div class="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-2.5">
                        <div class="flex items-center justify-between">
                            <span class="text-[11px] text-gray-300 font-medium">Output Format</span>
                            <select id="il-format" onchange="os.imageLabRender()" class="px-2.5 py-1 rounded-lg bg-black/60 border border-white/15 font-mono text-[11px] text-sky-300 outline-none">
                                <option value="image/webp">WebP (Smallest)</option>
                                <option value="image/jpeg">JPEG</option>
                                <option value="image/png">PNG (Lossless)</option>
                            </select>
                        </div>
                        <label class="block space-y-1">
                            <div class="flex justify-between text-[10.5px] text-gray-400">
                                <span>Quality</span>
                                <span id="il-quality-lbl" class="font-mono text-white">82%</span>
                            </div>
                            <input id="il-quality" type="range" min="5" max="100" value="82" oninput="document.getElementById('il-quality-lbl').textContent=this.value+'%';os.imageLabRender()" class="w-full accent-sky-400">
                        </label>
                    </div>

                    <!-- Dimensions & Transform -->
                    <div class="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-2.5">
                        <div class="flex items-center justify-between text-[11px] text-gray-300 font-medium">
                            <span>Resize (px)</span>
                            <label class="flex items-center gap-1 text-[10px] text-gray-400">
                                <input id="il-lock-ratio" type="checkbox" checked class="accent-emerald-400"> Lock Ratio
                            </label>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <input id="il-width" type="number" min="16" max="4096" value="800" oninput="os.imageLabOnDimChange('w')" class="px-2.5 py-1.5 rounded-lg bg-black/55 border border-white/10 font-mono text-xs text-white outline-none" placeholder="Width">
                            <input id="il-height" type="number" min="16" max="4096" value="500" oninput="os.imageLabOnDimChange('h')" class="px-2.5 py-1.5 rounded-lg bg-black/55 border border-white/10 font-mono text-xs text-white outline-none" placeholder="Height">
                        </div>
                        <div class="grid grid-cols-3 gap-1.5 pt-1">
                            <button type="button" onclick="os.imageLabRotate()" class="py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/12 text-[11px] text-gray-200 hover-target cursor-none">Rotate 90°</button>
                            <button type="button" onclick="os.imageLabFlip('h')" class="py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/12 text-[11px] text-gray-200 hover-target cursor-none">Flip H</button>
                            <button type="button" onclick="os.imageLabFlip('v')" class="py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/12 text-[11px] text-gray-200 hover-target cursor-none">Flip V</button>
                        </div>
                    </div>

                    <!-- Tone Adjustments -->
                    <div class="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-2 text-[10.5px] text-gray-400">
                        <label class="flex items-center justify-between gap-2"><span>Brightness</span><input id="il-bright" type="range" min="40" max="180" value="100" oninput="os.imageLabRender()" class="w-28 accent-sky-400"></label>
                        <label class="flex items-center justify-between gap-2"><span>Contrast</span><input id="il-contrast" type="range" min="40" max="180" value="100" oninput="os.imageLabRender()" class="w-28 accent-sky-400"></label>
                        <label class="flex items-center justify-between gap-2"><span>Saturation</span><input id="il-saturate" type="range" min="0" max="200" value="100" oninput="os.imageLabRender()" class="w-28 accent-sky-400"></label>
                    </div>

                    <!-- Eyedropper Readout -->
                    <div class="p-2.5 rounded-xl bg-black/45 border border-white/10 flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                            <span id="il-picked-swatch" class="w-6 h-6 rounded-lg border border-white/25 bg-[#38bdf8] shrink-0"></span>
                            <div>
                                <div class="text-[9.5px] text-gray-500 uppercase font-mono">Click Canvas to Sample Pixel</div>
                                <div id="il-picked-hex" class="font-mono text-[11px] text-white">#38BDF8 · rgb(56, 189, 248)</div>
                            </div>
                        </div>
                    </div>

                    <!-- Export Actions -->
                    <div class="flex items-center gap-2 mt-auto pt-1">
                        <button type="button" onclick="os.imageLabSaveToVFS()" class="flex-1 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 font-medium text-xs hover-target cursor-none">Save to Files</button>
                        <button type="button" onclick="os.imageLabDownload()" class="flex-1 py-2 rounded-xl bg-sky-400 text-black font-semibold text-xs hover:bg-sky-300 hover-target cursor-none">Download</button>
                    </div>
                </div>

                <!-- Live Canvas Preview -->
                <div class="md:col-span-7 p-4 flex flex-col items-center justify-center bg-[#040509] relative overflow-auto">
                    <canvas id="il-canvas" onclick="os.imageLabSamplePixel(event)" class="max-w-full max-h-full rounded-xl border border-white/10 shadow-2xl cursor-crosshair"></canvas>
                    <div id="il-stats-bar" class="mt-3 text-[11px] font-mono text-gray-400"></div>
                </div>
            </div>

            <!-- Mode 2: Offline ISO-18004 QR Code Generator -->
            <div id="il-pane-qr" class="hidden flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
                <div class="md:col-span-6 p-4 border-b md:border-b-0 md:border-r border-white/[0.07] flex flex-col gap-3 overflow-y-auto">
                    <div class="os-segmented self-start">
                        <button type="button" data-qr-type="text" onclick="os.qrSetType('text')" class="os-seg-btn active hover-target cursor-none">URL / Text</button>
                        <button type="button" data-qr-type="wifi" onclick="os.qrSetType('wifi')" class="os-seg-btn hover-target cursor-none">Wi-Fi Login QR</button>
                    </div>

                    <div id="qr-text-fields" class="space-y-2">
                        <label class="text-[11px] text-gray-300 font-medium">Destination URL or Text (up to 180 chars)</label>
                        <textarea id="qr-input-text" rows="3" oninput="os.qrRender()" placeholder="https://github.com/MeYashverma/AetherOS-Prod"
                            class="w-full p-3 rounded-xl bg-black/55 border border-white/12 font-mono text-xs text-white outline-none">https://github.com/MeYashverma/AetherOS-Prod</textarea>
                    </div>

                    <div id="qr-wifi-fields" class="hidden space-y-2">
                        <input id="qr-wifi-ssid" type="text" placeholder="Wi-Fi Network Name (SSID)" oninput="os.qrRender()"
                            class="w-full px-3 py-2 rounded-xl bg-black/55 border border-white/12 text-xs text-white outline-none">
                        <input id="qr-wifi-pass" type="text" placeholder="Wi-Fi Password" oninput="os.qrRender()"
                            class="w-full px-3 py-2 rounded-xl bg-black/55 border border-white/12 font-mono text-xs text-white outline-none">
                        <select id="qr-wifi-enc" onchange="os.qrRender()" class="w-full px-3 py-2 rounded-xl bg-black/55 border border-white/12 text-xs text-gray-200 outline-none">
                            <option value="WPA">WPA / WPA2 / WPA3</option>
                            <option value="WEP">WEP</option>
                            <option value="nopass">Open Network (No Password)</option>
                        </select>
                    </div>

                    <div class="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-between">
                        <div class="flex items-center gap-3 text-[11px] text-gray-300">
                            <label class="flex items-center gap-1.5"><span>Foreground</span><input id="qr-fg" type="color" value="#080a12" onchange="os.qrRender()" class="w-7 h-7 rounded bg-transparent border border-white/20"></label>
                            <label class="flex items-center gap-1.5"><span>Background</span><input id="qr-bg" type="color" value="#ffffff" onchange="os.qrRender()" class="w-7 h-7 rounded bg-transparent border border-white/20"></label>
                        </div>
                        <span class="text-[10px] font-mono text-emerald-300">100% Offline ISO-18004</span>
                    </div>

                    <div class="flex items-center gap-2 mt-auto">
                        <button type="button" onclick="os.qrSaveToVFS()" class="flex-1 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 font-medium text-xs hover-target cursor-none">Save to Files</button>
                        <button type="button" onclick="os.qrDownload('svg')" class="py-2 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs hover-target cursor-none">SVG</button>
                        <button type="button" onclick="os.qrDownload('png')" class="py-2 px-4 rounded-xl bg-white text-black font-semibold text-xs hover-target cursor-none">PNG</button>
                    </div>
                </div>

                <div class="md:col-span-6 p-6 flex flex-col items-center justify-center bg-[#040509] gap-3">
                    <div id="qr-svg-host" class="p-4 rounded-2xl bg-white shadow-2xl"></div>
                    <div id="qr-meta-lbl" class="text-[10.5px] font-mono text-gray-400"></div>
                </div>
            </div>
        </div>
    `;

    // ═══════════════════════════════════════════════════════════════════════
    //  PURE-JS ISO/IEC 18004 QR CODE ENCODER (Versions 1..8, Byte Mode, Level L)
    // ═══════════════════════════════════════════════════════════════════════
    const QR_V_TABLE = [
        null,
        { total: 26,  ecPerBlock: 7,  blocks: 1, align: [] },
        { total: 44,  ecPerBlock: 10, blocks: 1, align: [6, 18] },
        { total: 70,  ecPerBlock: 15, blocks: 1, align: [6, 22] },
        { total: 100, ecPerBlock: 20, blocks: 1, align: [6, 26] },
        { total: 134, ecPerBlock: 26, blocks: 1, align: [6, 30] },
        { total: 172, ecPerBlock: 18, blocks: 2, align: [6, 34] },
        { total: 196, ecPerBlock: 20, blocks: 2, align: [6, 22, 38] },
        { total: 242, ecPerBlock: 24, blocks: 2, align: [6, 24, 42] }
    ];

    const GF_EXP = new Uint8Array(512);
    const GF_LOG = new Uint8Array(256);
    (function initGF() {
        let x = 1;
        for (let i = 0; i < 255; i++) {
            GF_EXP[i] = x;
            GF_LOG[x] = i;
            x <<= 1;
            if (x & 0x100) x ^= 0x11d;
        }
        for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
    })();

    function gfMul(a, b) {
        return (a === 0 || b === 0) ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]];
    }

    function rsCompute(dataBytes, ecLen) {
        let gen = [1];
        for (let i = 0; i < ecLen; i++) {
            const next = new Array(gen.length + 1).fill(0);
            for (let j = 0; j < gen.length; j++) {
                next[j] ^= gen[j];
                next[j + 1] ^= gfMul(gen[j], GF_EXP[i]);
            }
            gen = next;
        }
        const msg = new Uint8Array(dataBytes.length + ecLen);
        msg.set(dataBytes, 0);
        for (let i = 0; i < dataBytes.length; i++) {
            const coef = msg[i];
            if (coef !== 0) {
                for (let j = 0; j < gen.length; j++) {
                    msg[i + j] ^= gfMul(gen[j], coef);
                }
            }
        }
        return msg.slice(dataBytes.length);
    }

    function encodeQrMatrix(text) {
        const utf8 = Array.from(new TextEncoder().encode(String(text || 'AetherOS')));
        let ver = 1;
        while (ver <= 8) {
            const info = QR_V_TABLE[ver];
            const dataCap = info.total - info.ecPerBlock * info.blocks;
            if (utf8.length + 2 <= dataCap) break;
            ver++;
        }
        if (ver > 8) return null; // > 192 UTF-8 bytes

        const info = QR_V_TABLE[ver];
        const dataCap = info.total - info.ecPerBlock * info.blocks;
        const bits = [];
        const pushBits = (val, len) => {
            for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
        };

        pushBits(0b0100, 4); // Byte mode
        pushBits(utf8.length, 8);
        utf8.forEach((b) => pushBits(b, 8));
        for (let i = 0; i < 4 && bits.length < dataCap * 8; i++) bits.push(0);
        while (bits.length % 8 !== 0) bits.push(0);

        const dataCodewords = [];
        for (let i = 0; i < bits.length; i += 8) {
            let byte = 0;
            for (let b = 0; b < 8; b++) byte = (byte << 1) | bits[i + b];
            dataCodewords.push(byte);
        }
        let padIdx = 0;
        while (dataCodewords.length < dataCap) {
            dataCodewords.push(padIdx % 2 === 0 ? 0xec : 0x11);
            padIdx++;
        }

        // Split into blocks & interleave
        const blockDataLen = dataCap / info.blocks;
        const dBlocks = [], eBlocks = [];
        for (let b = 0; b < info.blocks; b++) {
            const slice = Uint8Array.from(dataCodewords.slice(b * blockDataLen, (b + 1) * blockDataLen));
            dBlocks.push(slice);
            eBlocks.push(rsCompute(slice, info.ecPerBlock));
        }
        const finalBytes = [];
        for (let i = 0; i < blockDataLen; i++) for (let b = 0; b < info.blocks; b++) finalBytes.push(dBlocks[b][i]);
        for (let i = 0; i < info.ecPerBlock; i++) for (let b = 0; b < info.blocks; b++) finalBytes.push(eBlocks[b][i]);

        const size = 17 + ver * 4;
        const grid = Array.from({ length: size }, () => new Int8Array(size).fill(-1));
        const reserved = Array.from({ length: size }, () => new Uint8Array(size));

        const setMod = (r, c, val, isFunc = true) => {
            if (r < 0 || c < 0 || r >= size || c >= size) return;
            grid[r][c] = val ? 1 : 0;
            if (isFunc) reserved[r][c] = 1;
        };

        const placeFinder = (r0, c0) => {
            for (let dr = -1; dr <= 7; dr++) {
                for (let dc = -1; dc <= 7; dc++) {
                    const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
                    const onBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
                    const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
                    setMod(r0 + dr, c0 + dc, inOuter && (onBorder || inInner), true);
                }
            }
        };
        placeFinder(0, 0);
        placeFinder(0, size - 7);
        placeFinder(size - 7, 0);

        for (let i = 8; i < size - 8; i++) {
            setMod(6, i, i % 2 === 0, true);
            setMod(i, 6, i % 2 === 0, true);
        }

        const aPos = info.align;
        for (let i = 0; i < aPos.length; i++) {
            for (let j = 0; j < aPos.length; j++) {
                const r = aPos[i], c = aPos[j];
                if (reserved[r][c]) continue;
                for (let dr = -2; dr <= 2; dr++) {
                    for (let dc = -2; dc <= 2; dc++) {
                        setMod(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1, true);
                    }
                }
            }
        }

        // Reserve format & dark module
        for (let i = 0; i < 9; i++) {
            if (!reserved[8][i]) reserved[8][i] = 1;
            if (!reserved[i][8]) reserved[i][8] = 1;
        }
        for (let i = 0; i < 8; i++) {
            reserved[8][size - 1 - i] = 1;
            reserved[size - 1 - i][8] = 1;
        }
        setMod(size - 8, 8, 1, true);

        if (ver >= 7) {
            let rem = ver;
            for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
            const vBits = (ver << 12) | rem;
            for (let i = 0; i < 18; i++) {
                const bit = (vBits >>> i) & 1;
                const a = size - 11 + (i % 3), b = Math.floor(i / 3);
                setMod(b, a, bit, true);
                setMod(a, b, bit, true);
            }
        }

        // Place data bits upward/downward in 2-col zig-zag with Mask 0 ((r + c) % 2 === 0)
        const streamBits = [];
        finalBytes.forEach((byte) => {
            for (let b = 7; b >= 0; b--) streamBits.push((byte >>> b) & 1);
        });

        let bitIdx = 0;
        let upward = true;
        for (let right = size - 1; right >= 1; right -= 2) {
            if (right === 6) right = 5;
            for (let vert = 0; vert < size; vert++) {
                const r = upward ? (size - 1 - vert) : vert;
                for (let j = 0; j < 2; j++) {
                    const c = right - j;
                    if (!reserved[r][c]) {
                        const rawBit = bitIdx < streamBits.length ? streamBits[bitIdx++] : 0;
                        const masked = rawBit ^ (((r + c) % 2 === 0) ? 1 : 0);
                        grid[r][c] = masked;
                    }
                }
            }
            upward = !upward;
        }

        // Format info for Level L (01) + Mask 0 (000) -> 0x77c4
        const fmt = 0x77c4;
        const fmtBits = Array.from({ length: 15 }, (_, i) => (fmt >>> i) & 1);
        for (let i = 0; i <= 5; i++) setMod(8, i, fmtBits[14 - i], true);
        setMod(8, 7, fmtBits[8], true);
        setMod(8, 8, fmtBits[7], true);
        setMod(7, 8, fmtBits[6], true);
        for (let i = 9; i < 15; i++) setMod(14 - i, 8, fmtBits[14 - i], true);

        for (let i = 0; i < 8; i++) setMod(8, size - 1 - i, fmtBits[i], true);
        for (let i = 8; i < 15; i++) setMod(size - 15 + i, 8, fmtBits[i], true);

        return { ver, size, grid };
    }

    function createDemoCanvasSource() {
        const c = document.createElement('canvas');
        c.width = 800;
        c.height = 500;
        const ctx = c.getContext('2d');
        const g = ctx.createLinearGradient(0, 0, 800, 500);
        g.addColorStop(0, '#0f172a');
        g.addColorStop(0.5, '#1e1b4b');
        g.addColorStop(1, '#0d9488');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 800, 500);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.beginPath(); ctx.arc(240, 210, 140, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(244, 114, 182, 0.32)';
        ctx.beginPath(); ctx.arc(560, 280, 150, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px Inter, system-ui, sans-serif';
        ctx.fillText('AetherOS Image Lab — Drop Any Image', 140, 255);
        return c;
    }

    window.extendOS({
        imageLabState: {
            mode: 'image',
            qrType: 'text',
            sourceEl: null,
            origBytes: 184320,
            origName: 'sample-card.png',
            aspect: 800 / 500,
            rotation: 0,
            flipH: 1,
            flipV: 1,
            lastDataUrl: '',
            lastMime: 'image/webp',
            lastQrSvg: ''
        },

        initImageLab: () => {
            if (!os.imageLabState.sourceEl) {
                os.imageLabState.sourceEl = createDemoCanvasSource();
            }
            os.imageLabSetMode(os.imageLabState.mode || 'image');
        },

        imageLabSetMode: (mode) => {
            os.imageLabState.mode = mode === 'qr' ? 'qr' : 'image';
            const im = document.getElementById('il-pane-image');
            const qr = document.getElementById('il-pane-qr');
            if (im) im.classList.toggle('hidden', os.imageLabState.mode !== 'image');
            if (qr) qr.classList.toggle('hidden', os.imageLabState.mode !== 'qr');
            document.querySelectorAll('[data-il-mode]').forEach((b) => {
                b.classList.toggle('active', b.getAttribute('data-il-mode') === os.imageLabState.mode);
            });
            if (os.imageLabState.mode === 'image') os.imageLabRender();
            else os.qrRender();
            const root = document.getElementById('imagelab-root');
            if (root && window.lucide) lucide.createIcons({ root });
        },

        imageLabTriggerOpen: () => {
            let inp = document.getElementById('imagelab-file-input');
            if (!inp) {
                inp = document.createElement('input');
                inp.type = 'file';
                inp.accept = 'image/*';
                inp.id = 'imagelab-file-input';
                inp.style.display = 'none';
                inp.onchange = (e) => {
                    const f = e.target.files && e.target.files[0];
                    if (f) os.imageLabLoadBrowserFile(f);
                    inp.value = '';
                };
                document.body.appendChild(inp);
            }
            inp.click();
        },

        imageLabLoadBrowserFile: (file) => {
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    os.imageLabState.sourceEl = img;
                    os.imageLabState.origBytes = file.size || 0;
                    os.imageLabState.origName = file.name || 'image.png';
                    os.imageLabState.aspect = (img.naturalWidth || 800) / (img.naturalHeight || 500);
                    os.imageLabState.rotation = 0;
                    os.imageLabState.flipH = 1;
                    os.imageLabState.flipV = 1;
                    const wEl = document.getElementById('il-width');
                    const hEl = document.getElementById('il-height');
                    if (wEl) wEl.value = img.naturalWidth;
                    if (hEl) hEl.value = img.naturalHeight;
                    os.imageLabSetMode('image');
                };
                img.src = String(reader.result || '');
            };
            reader.readAsDataURL(file);
        },

        imageLabOpenVfsFile: (id) => {
            const f = (window.AetherVFS && AetherVFS.getCachedFile(id)) || (os.fmFindById && os.fmFindById(id));
            const url = f && (f.imageUrl || f.dataUrl);
            if (!url) return;
            os.openWindow('imagelab');
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                os.imageLabState.sourceEl = img;
                os.imageLabState.origBytes = f.sizeBytes || Math.round(url.length * 0.75);
                os.imageLabState.origName = f.name || 'archive-image.png';
                os.imageLabState.aspect = (img.naturalWidth || 800) / (img.naturalHeight || 500);
                const wEl = document.getElementById('il-width');
                const hEl = document.getElementById('il-height');
                if (wEl) wEl.value = img.naturalWidth;
                if (hEl) hEl.value = img.naturalHeight;
                os.imageLabSetMode('image');
            };
            img.src = url;
        },

        imageLabOnDimChange: (axis) => {
            const lock = document.getElementById('il-lock-ratio')?.checked;
            const wEl = document.getElementById('il-width');
            const hEl = document.getElementById('il-height');
            if (lock && wEl && hEl && os.imageLabState.aspect) {
                if (axis === 'w') hEl.value = Math.max(16, Math.round(Number(wEl.value) / os.imageLabState.aspect));
                else wEl.value = Math.max(16, Math.round(Number(hEl.value) * os.imageLabState.aspect));
            }
            os.imageLabRender();
        },

        imageLabRotate: () => {
            os.imageLabState.rotation = (os.imageLabState.rotation + 90) % 360;
            os.imageLabRender();
        },

        imageLabFlip: (dir) => {
            if (dir === 'h') os.imageLabState.flipH *= -1;
            else os.imageLabState.flipV *= -1;
            os.imageLabRender();
        },

        imageLabResetAdjustments: () => {
            os.imageLabState.rotation = 0;
            os.imageLabState.flipH = 1;
            os.imageLabState.flipV = 1;
            ['il-bright', 'il-contrast', 'il-saturate'].forEach((id) => {
                const el = document.getElementById(id);
                if (el) el.value = 100;
            });
            os.imageLabRender();
        },

        imageLabRender: () => {
            const canvas = document.getElementById('il-canvas');
            const src = os.imageLabState.sourceEl;
            if (!canvas || !src) return;

            const w = Math.max(16, Math.min(4096, Number(document.getElementById('il-width')?.value || 800)));
            const h = Math.max(16, Math.min(4096, Number(document.getElementById('il-height')?.value || 500)));
            const rot = os.imageLabState.rotation % 360;
            const swapped = rot === 90 || rot === 270;

            canvas.width = swapped ? h : w;
            canvas.height = swapped ? w : h;

            const ctx = canvas.getContext('2d');
            const br = document.getElementById('il-bright')?.value || 100;
            const ct = document.getElementById('il-contrast')?.value || 100;
            const st = document.getElementById('il-saturate')?.value || 100;
            ctx.filter = `brightness(${br}%) contrast(${ct}%) saturate(${st}%)`;

            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rot * Math.PI) / 180);
            ctx.scale(os.imageLabState.flipH, os.imageLabState.flipV);
            ctx.drawImage(src, -w / 2, -h / 2, w, h);
            ctx.restore();
            ctx.filter = 'none';

            const mime = document.getElementById('il-format')?.value || 'image/webp';
            const quality = Math.max(0.05, Math.min(1, Number(document.getElementById('il-quality')?.value || 82) / 100));
            const dataUrl = canvas.toDataURL(mime, quality);
            os.imageLabState.lastDataUrl = dataUrl;
            os.imageLabState.lastMime = mime;

            const outBytes = Math.max(64, Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75));
            const orig = os.imageLabState.origBytes || outBytes;
            const pct = orig > 0 ? Math.round((1 - outBytes / orig) * 100) : 0;

            const stats = document.getElementById('il-stats-bar');
            const badge = document.getElementById('imagelab-Savings-badge');
            const summary = `${canvas.width}×${canvas.height}px · ${(orig / 1024).toFixed(1)} KB → ${(outBytes / 1024).toFixed(1)} KB (${pct >= 0 ? '-' + pct + '% saved' : '+' + Math.abs(pct) + '%'})`;
            if (stats) stats.textContent = summary;
            if (badge) badge.textContent = summary;
        },

        imageLabSamplePixel: (e) => {
            const canvas = document.getElementById('il-canvas');
            if (!canvas) return;
            const r = canvas.getBoundingClientRect();
            const x = Math.floor(((e.clientX - r.left) / (r.width || 1)) * canvas.width);
            const y = Math.floor(((e.clientY - r.top) / (r.height || 1)) * canvas.height);
            const d = canvas.getContext('2d').getImageData(Math.max(0, x), Math.max(0, y), 1, 1).data;
            const hex = '#' + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
            const rgb = `rgb(${d[0]}, ${d[1]}, ${d[2]})`;
            const sw = document.getElementById('il-picked-swatch');
            const lbl = document.getElementById('il-picked-hex');
            if (sw) sw.style.background = hex;
            if (lbl) lbl.textContent = `${hex} · ${rgb}`;
            navigator.clipboard && navigator.clipboard.writeText(hex).catch(() => {});
            os.recordClipboardItem && os.recordClipboardItem(hex, 'Eyedropper', `Sampled Color ${hex}`);
            window.Notifications && window.Notifications.push('EYEDROPPER', `Copied ${hex} (${rgb})`);
        },

        imageLabDownload: () => {
            if (!os.imageLabState.lastDataUrl) os.imageLabRender();
            const ext = os.imageLabState.lastMime === 'image/png' ? 'png' : os.imageLabState.lastMime === 'image/jpeg' ? 'jpg' : 'webp';
            const base = (os.imageLabState.origName || 'image').replace(/\.[^.]+$/, '');
            const a = document.createElement('a');
            a.href = os.imageLabState.lastDataUrl;
            a.download = `${base}-optimized.${ext}`;
            a.click();
        },

        imageLabSaveToVFS: async () => {
            if (!window.AetherVFS) return;
            if (!os.imageLabState.lastDataUrl) os.imageLabRender();
            const ext = os.imageLabState.lastMime === 'image/png' ? 'png' : os.imageLabState.lastMime === 'image/jpeg' ? 'jpg' : 'webp';
            const base = (os.imageLabState.origName || 'image').replace(/\.[^.]+$/, '');
            const rec = await AetherVFS.putFile({
                name: `${base}-optimized.${ext}`,
                mime: os.imageLabState.lastMime,
                kind: 'image',
                icon: 'image',
                folder: 'User Uploads',
                dataUrl: os.imageLabState.lastDataUrl,
                imageUrl: os.imageLabState.lastDataUrl,
                content: `Optimized via Image Lab (${os.imageLabState.lastMime})`,
                tags: ['imagelab', ext]
            });
            window.Notifications && window.Notifications.push('IMAGE LAB', `Saved "${rec.name}" to File Explorer`);
        },

        // ── Offline QR Studio Methods ──
        qrSetType: (t) => {
            os.imageLabState.qrType = t === 'wifi' ? 'wifi' : 'text';
            const tf = document.getElementById('qr-text-fields');
            const wf = document.getElementById('qr-wifi-fields');
            if (tf) tf.classList.toggle('hidden', os.imageLabState.qrType !== 'text');
            if (wf) wf.classList.toggle('hidden', os.imageLabState.qrType !== 'wifi');
            document.querySelectorAll('[data-qr-type]').forEach((b) => {
                b.classList.toggle('active', b.getAttribute('data-qr-type') === os.imageLabState.qrType);
            });
            os.qrRender();
        },

        qrBuildPayload: () => {
            if (os.imageLabState.qrType === 'wifi') {
                const ssid = (document.getElementById('qr-wifi-ssid')?.value || 'MyNetwork').replace(/([\\;,:])/g, '\\$1');
                const pass = (document.getElementById('qr-wifi-pass')?.value || '').replace(/([\\;,:])/g, '\\$1');
                const enc = document.getElementById('qr-wifi-enc')?.value || 'WPA';
                return `WIFI:T:${enc};S:${ssid};P:${pass};;`;
            }
            return (document.getElementById('qr-input-text')?.value || 'https://aetheros.local').trim();
        },

        qrRender: () => {
            const host = document.getElementById('qr-svg-host');
            const meta = document.getElementById('qr-meta-lbl');
            if (!host) return;

            const payload = os.qrBuildPayload();
            const fg = document.getElementById('qr-fg')?.value || '#080a12';
            const bg = document.getElementById('qr-bg')?.value || '#ffffff';
            const encoded = encodeQrMatrix(payload);

            if (!encoded) {
                host.innerHTML = `<div class="p-6 text-xs text-red-600 font-mono">Text exceeds offline QR capacity (190 UTF-8 bytes max).</div>`;
                return;
            }

            const { ver, size, grid } = encoded;
            const quiet = 3;
            const total = size + quiet * 2;
            let paths = '';
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (grid[r][c] === 1) {
                        paths += `M${c + quiet},${r + quiet}h1v1h-1z`;
                    }
                }
            }
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="228" height="228" shape-rendering="crispEdges"><rect width="${total}" height="${total}" fill="${esc(bg)}"/><path d="${paths}" fill="${esc(fg)}"/></svg>`;
            os.imageLabState.lastQrSvg = svg;
            host.style.background = bg;
            host.innerHTML = svg;
            if (meta) meta.textContent = `QR Version ${ver} (${size}×${size}) · EC Level L · ${payload.length} chars`;
        },

        qrDownload: (fmt = 'svg') => {
            if (!os.imageLabState.lastQrSvg) os.qrRender();
            if (fmt === 'svg') {
                const blob = new Blob([os.imageLabState.lastQrSvg], { type: 'image/svg+xml' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `aether-qr-${Date.now()}.svg`;
                a.click();
                return;
            }
            const img = new Image();
            img.onload = () => {
                const c = document.createElement('canvas');
                c.width = 512; c.height = 512;
                c.getContext('2d').drawImage(img, 0, 0, 512, 512);
                const a = document.createElement('a');
                a.href = c.toDataURL('image/png');
                a.download = `aether-qr-${Date.now()}.png`;
                a.click();
            };
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(os.imageLabState.lastQrSvg)));
        },

        qrSaveToVFS: async () => {
            if (!window.AetherVFS) return;
            if (!os.imageLabState.lastQrSvg) os.qrRender();
            const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(os.imageLabState.lastQrSvg)));
            const rec = await AetherVFS.putFile({
                name: `QR-${Date.now()}.svg`,
                mime: 'image/svg+xml',
                kind: 'image',
                icon: 'qr-code',
                folder: 'User Uploads',
                dataUrl,
                imageUrl: dataUrl,
                content: os.qrBuildPayload(),
                tags: ['qr', 'svg']
            });
            window.Notifications && window.Notifications.push('QR SAVED', `"${rec.name}" saved to File Explorer`);
        }
    });
})();
