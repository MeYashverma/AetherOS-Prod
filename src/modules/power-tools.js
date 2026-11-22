// AetherOS — Power Workstation Apps: Kanban Project Board, Clipboard & Snippets Vault, and Capture & Sketch Studio
(function () {
    const esc = (v) => String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    window.WindowContents = window.WindowContents || {};

    // ═══════════════════════════════════════════════════════════════════════
    //  1. KANBAN PROJECT BOARD (kanban)
    // ═══════════════════════════════════════════════════════════════════════
    const KANBAN_COLS = [
        { id: 'todo',  label: 'Backlog',     dot: 'bg-sky-400' },
        { id: 'doing', label: 'In Progress', dot: 'bg-amber-400' },
        { id: 'done',  label: 'Shipped',     dot: 'bg-emerald-400' }
    ];

    const TAG_STYLES = {
        Urgent:   'bg-red-500/15 text-red-300 border-red-400/30',
        Feature:  'bg-sky-500/15 text-sky-300 border-sky-400/30',
        Design:   'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-400/30',
        Research: 'bg-violet-500/15 text-violet-300 border-violet-400/30',
        Chore:    'bg-gray-500/15 text-gray-300 border-white/15'
    };

    window.WindowContents.kanban = `
        <div class="h-full flex flex-col bg-[#07080d]/95 text-xs overflow-hidden select-none" id="kanban-root">
            <!-- Top Bar: Board Switcher + Search + Export -->
            <div class="px-4 py-2.5 border-b border-white/[0.07] bg-black/40 flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-1.5 overflow-x-auto" id="kanban-boards-bar"></div>
                <div class="flex items-center gap-2">
                    <div class="relative">
                        <i data-lucide="search" class="w-3 h-3 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2"></i>
                        <input id="kanban-filter-input" type="text" placeholder="Filter cards..." oninput="os.kanbanSetFilter(this.value)"
                            class="w-36 sm:w-44 pl-7 pr-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-[11px] text-white outline-none focus:border-white/25">
                    </div>
                    <button type="button" onclick="os.kanbanExportToDevPad()" class="px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/30 text-[11px] text-indigo-200 hover-target cursor-none flex items-center gap-1.5" title="Open board as Markdown in Dev Studio">
                        <i data-lucide="file-code" class="w-3 h-3"></i><span>To Markdown</span>
                    </button>
                </div>
            </div>

            <!-- Quick Add Task Bar -->
            <form onsubmit="event.preventDefault();os.kanbanAddCard()" class="px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.015] flex flex-wrap items-center gap-2">
                <input id="kanban-new-title" type="text" placeholder="Add a task, feature, or milestone..."
                    class="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg bg-black/45 border border-white/10 text-xs text-white outline-none focus:border-white/30">
                <select id="kanban-new-tag" class="px-2.5 py-1.5 rounded-lg bg-black/55 border border-white/10 text-[11px] text-gray-200 outline-none">
                    <option value="Feature">Feature</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Design">Design</option>
                    <option value="Research">Research</option>
                    <option value="Chore">Chore</option>
                </select>
                <select id="kanban-new-col" class="px-2.5 py-1.5 rounded-lg bg-black/55 border border-white/10 text-[11px] text-gray-200 outline-none">
                    <option value="todo">→ Backlog</option>
                    <option value="doing">→ In Progress</option>
                    <option value="done">→ Shipped</option>
                </select>
                <button type="submit" class="px-3.5 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-gray-200 transition hover-target cursor-none">Add Card</button>
            </form>

            <!-- 3-Column Drag & Drop Stage -->
            <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 p-4 min-h-0 overflow-y-auto" id="kanban-columns-grid"></div>
        </div>
    `;

    function loadKanbanState() {
        try {
            const parsed = JSON.parse(localStorage.getItem('AetherOS_Kanban_v1') || 'null');
            if (parsed && Array.isArray(parsed.boards) && parsed.boards.length) return parsed;
        } catch (_) {}
        return {
            activeBoardId: 'kb-main',
            filter: '',
            boards: [
                {
                    id: 'kb-main',
                    name: 'Workspace Sprint',
                    cards: [
                        { id: 'kc-1', col: 'doing', tag: 'Feature',  title: 'Organize multi-space workflow across Spaces 1 · 2 · 3', created: 'Today' },
                        { id: 'kc-2', col: 'todo',  tag: 'Design',   title: 'Customize 3-color Mesh Gradient backdrop in Appearance', created: 'Today' },
                        { id: 'kc-3', col: 'done',  tag: 'Chore',    title: 'Declutter default workspace & enable modular packs', created: 'Done' }
                    ]
                },
                {
                    id: 'kb-ideas',
                    name: 'Ideas & Notes',
                    cards: [
                        { id: 'kc-4', col: 'todo', tag: 'Research', title: 'Clip articles from Signal Feed into File Explorer', created: 'Idea' }
                    ]
                }
            ]
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  2. CLIPBOARD HISTORY & SNIPPETS VAULT (clipboard — Ctrl/Cmd+Shift+V)
    // ═══════════════════════════════════════════════════════════════════════
    window.WindowContents.clipboard = `
        <div class="h-full flex flex-col bg-[#07080d]/95 text-xs overflow-hidden" id="clipboard-root">
            <div class="px-4 py-2.5 border-b border-white/[0.07] bg-black/40 flex flex-wrap items-center justify-between gap-2">
                <div class="os-segmented">
                    <button type="button" data-clip-tab="all" onclick="os.clipboardSetTab('all')" class="os-seg-btn active hover-target cursor-none">All</button>
                    <button type="button" data-clip-tab="pinned" onclick="os.clipboardSetTab('pinned')" class="os-seg-btn hover-target cursor-none">Pinned Snippets</button>
                    <button type="button" data-clip-tab="history" onclick="os.clipboardSetTab('history')" class="os-seg-btn hover-target cursor-none">Copied History</button>
                </div>
                <div class="flex items-center gap-2">
                    <input id="clipboard-search" type="text" placeholder="Search clips & snippets..." oninput="os.clipboardSetQuery(this.value)"
                        class="w-40 sm:w-48 px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-[11px] text-white outline-none focus:border-white/25">
                    <button type="button" onclick="os.clipboardClearUnpinned()" class="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-red-500/20 border border-white/10 text-[11px] text-gray-300 hover:text-red-200 hover-target cursor-none">Clear History</button>
                </div>
            </div>

            <!-- Add Reusable Snippet Form -->
            <form onsubmit="event.preventDefault();os.clipboardAddSnippet()" class="px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.015] flex flex-col sm:flex-row gap-2">
                <input id="clip-new-title" type="text" placeholder="Snippet label (optional)"
                    class="sm:w-44 px-2.5 py-1.5 rounded-lg bg-black/45 border border-white/10 text-[11px] text-white outline-none focus:border-white/30">
                <input id="clip-new-body" type="text" placeholder="Paste or type reusable snippet, command, or prompt..."
                    class="flex-1 px-2.5 py-1.5 rounded-lg bg-black/45 border border-white/10 text-[11px] text-white font-mono outline-none focus:border-white/30">
                <button type="submit" class="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 font-medium text-[11px] hover-target cursor-none shrink-0">Pin Snippet</button>
            </form>

            <div id="clipboard-items-list" class="flex-1 overflow-y-auto p-3.5 space-y-2"></div>

            <div class="px-4 py-1.5 border-t border-white/[0.05] bg-black/30 flex items-center justify-between text-[10px] font-mono text-gray-500">
                <span>Shortcut: <kbd class="px-1 py-0.5 rounded bg-white/10 text-gray-300">⌘⇧V</kbd></span>
                <span>Auto-captures text copied inside AetherOS</span>
            </div>
        </div>
    `;

    function loadClipboardState() {
        try {
            const parsed = JSON.parse(localStorage.getItem('AetherOS_Clipboard_v1') || 'null');
            if (parsed && Array.isArray(parsed.items)) return parsed;
        } catch (_) {}
        return {
            tab: 'all',
            query: '',
            items: [
                { id: 'cb-seed-1', title: 'Git Clean Status Summary', text: 'git status --short --branch && git log -n 5 --oneline', pinned: true, source: 'Snippet', time: 'Pinned' },
                { id: 'cb-seed-2', title: 'Markdown Meeting Template', text: '## Sync Notes\n- **Context**: \n- **Decisions**: \n- **Next Steps**:\n  - [ ] ', pinned: true, source: 'Snippet', time: 'Pinned' },
                { id: 'cb-seed-3', title: 'ISO UTC Timestamp', text: new Date().toISOString(), pinned: false, source: 'System', time: 'Ready' }
            ]
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  3. CAPTURE & SKETCH STUDIO (capture — Screen Recorder + Whiteboard)
    // ═══════════════════════════════════════════════════════════════════════
    window.WindowContents.capture = `
        <div class="h-full flex flex-col bg-[#07080d]/95 text-xs overflow-hidden select-none" id="capture-root">
            <div class="px-4 py-2.5 border-b border-white/[0.07] bg-black/40 flex flex-wrap items-center justify-between gap-2">
                <div class="os-segmented">
                    <button type="button" data-cap-mode="sketch" onclick="os.captureSetMode('sketch')" class="os-seg-btn active hover-target cursor-none">Sketch &amp; Diagram Pad</button>
                    <button type="button" data-cap-mode="screen" onclick="os.captureSetMode('screen')" class="os-seg-btn hover-target cursor-none">Screen &amp; Camera Recorder</button>
                </div>
                <span id="capture-rec-badge" style="display:none" class="px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-400/40 text-red-200 font-mono text-[10.5px] items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                    <span id="capture-rec-timer">REC 00:00</span>
                </span>
            </div>

            <!-- Mode A: Quick Sketch & Diagram Whiteboard -->
            <div id="capture-sketch-pane" class="flex-1 flex flex-col min-h-0">
                <div class="px-3.5 py-2 border-b border-white/[0.06] bg-white/[0.02] flex flex-wrap items-center justify-between gap-2">
                    <div class="flex flex-wrap items-center gap-1.5">
                        <button type="button" data-sk-tool="pen" onclick="os.sketchSetTool('pen')" class="px-2.5 py-1 rounded-lg bg-white/15 text-white text-[11px] hover-target cursor-none">Pen</button>
                        <button type="button" data-sk-tool="glow" onclick="os.sketchSetTool('glow')" class="px-2.5 py-1 rounded-lg bg-white/[0.04] text-gray-400 text-[11px] hover-target cursor-none">Neon</button>
                        <button type="button" data-sk-tool="line" onclick="os.sketchSetTool('line')" class="px-2.5 py-1 rounded-lg bg-white/[0.04] text-gray-400 text-[11px] hover-target cursor-none">Line</button>
                        <button type="button" data-sk-tool="rect" onclick="os.sketchSetTool('rect')" class="px-2.5 py-1 rounded-lg bg-white/[0.04] text-gray-400 text-[11px] hover-target cursor-none">Box</button>
                        <button type="button" data-sk-tool="eraser" onclick="os.sketchSetTool('eraser')" class="px-2.5 py-1 rounded-lg bg-white/[0.04] text-gray-400 text-[11px] hover-target cursor-none">Eraser</button>
                        <div class="h-4 w-px bg-white/10 mx-1"></div>
                        <div class="flex items-center gap-1" id="sketch-color-swatches"></div>
                        <input id="sketch-size-slider" type="range" min="2" max="18" value="4" oninput="os.sketchState.size=Number(this.value)" class="w-16 accent-sky-400 ml-1" title="Brush size">
                    </div>
                    <div class="flex items-center gap-1.5">
                        <button type="button" onclick="os.sketchUndo()" class="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/12 border border-white/10 text-[11px] text-gray-200 hover-target cursor-none">Undo</button>
                        <button type="button" onclick="os.sketchClear()" class="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/12 border border-white/10 text-[11px] text-gray-300 hover-target cursor-none">Clear</button>
                        <button type="button" onclick="os.sketchSaveToVFS(true)" class="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-[11px] text-sky-200 hover-target cursor-none">Set Wallpaper</button>
                        <button type="button" onclick="os.sketchSaveToVFS(false)" class="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-[11px] text-emerald-200 hover-target cursor-none">Save to Files</button>
                        <button type="button" onclick="os.sketchDownload()" class="px-2.5 py-1 rounded-lg bg-white text-black font-semibold text-[11px] hover-target cursor-none">PNG</button>
                    </div>
                </div>
                <div class="flex-1 relative bg-[#090b12] overflow-hidden" id="sketch-canvas-wrap" style="background-image:radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px);background-size:20px 20px;">
                    <canvas id="sketch-canvas" class="w-full h-full block touch-none"></canvas>
                </div>
            </div>

            <!-- Mode B: Screen & Camera Recorder -->
            <div id="capture-screen-pane" class="hidden flex-1 flex flex-col p-4 gap-3 min-h-0 overflow-y-auto">
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex flex-wrap items-center gap-2">
                        <button type="button" onclick="os.captureStartStream('screen')" class="px-3.5 py-1.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-gray-200 transition hover-target cursor-none flex items-center gap-1.5">
                            <i data-lucide="monitor" class="w-3.5 h-3.5"></i><span>Share Screen / Window</span>
                        </button>
                        <button type="button" onclick="os.captureStartStream('camera')" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs transition hover-target cursor-none flex items-center gap-1.5">
                            <i data-lucide="camera" class="w-3.5 h-3.5"></i><span>Webcam</span>
                        </button>
                        <button type="button" id="capture-rec-btn" onclick="os.captureToggleRecording()" class="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-400/35 text-red-200 text-xs font-medium transition hover-target cursor-none">Start Recording (.webm)</button>
                        <button type="button" onclick="os.captureGrabFrame()" class="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-sky-200 text-xs transition hover-target cursor-none">Snap Frame (.png)</button>
                    </div>
                    <button type="button" onclick="os.captureStopStream()" class="px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-gray-300 text-[11px] hover-target cursor-none">Stop Stream</button>
                </div>

                <div class="flex-1 min-h-[240px] rounded-2xl border border-white/10 bg-black/70 relative overflow-hidden flex items-center justify-center">
                    <video id="capture-live-video" autoplay muted playsinline class="max-h-full max-w-full object-contain hidden"></video>
                    <div id="capture-empty-hint" class="text-center p-6 space-y-2 max-w-md">
                        <i data-lucide="video" class="w-8 h-8 text-sky-400 mx-auto"></i>
                        <div class="text-sm font-semibold text-white">Screen, Tab &amp; Camera Capture</div>
                        <div class="text-[11px] text-gray-400 leading-relaxed">Share any browser tab, window, or display to record crisp <code class="text-gray-200">.webm</code> video or snap full-resolution <code class="text-gray-200">.png</code> screenshots straight into File Explorer.</div>
                    </div>
                </div>

                <div id="capture-output-tray" class="hidden p-3 rounded-xl bg-white/[0.04] border border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <div class="text-xs text-gray-200 font-medium" id="capture-output-label">Captured clip ready</div>
                    <div class="flex items-center gap-2">
                        <button type="button" onclick="os.captureSaveLastToVFS()" class="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 text-[11px] hover-target cursor-none">Save to File Explorer</button>
                        <button type="button" onclick="os.captureDownloadLast()" class="px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-[11px] hover-target cursor-none">Download</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const SKETCH_COLORS = ['#ffffff', '#38bdf8', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#f87171'];

    window.extendOS({
        kanbanState: loadKanbanState(),
        clipboardState: loadClipboardState(),
        sketchState: {
            mode: 'sketch',
            tool: 'pen',
            color: '#38bdf8',
            size: 4,
            drawing: false,
            startX: 0,
            startY: 0,
            snapshot: null,
            undoStack: []
        },
        captureRuntime: {
            stream: null,
            recorder: null,
            chunks: [],
            recStart: 0,
            recTimer: null,
            lastAsset: null
        },

        // ── Kanban Methods ──
        saveKanban: () => {
            localStorage.setItem('AetherOS_Kanban_v1', JSON.stringify({
                activeBoardId: os.kanbanState.activeBoardId,
                boards: os.kanbanState.boards
            }));
        },

        initKanban: () => {
            os.kanbanRender();
        },

        kanbanActiveBoard: () => {
            const boards = os.kanbanState.boards || [];
            return boards.find((b) => b.id === os.kanbanState.activeBoardId) || boards[0];
        },

        kanbanSelectBoard: (id) => {
            os.kanbanState.activeBoardId = id;
            os.saveKanban();
            os.kanbanRender();
        },

        kanbanNewBoard: () => {
            const name = window.prompt('New board name:', 'Sprint ' + ((os.kanbanState.boards?.length || 1) + 1));
            if (!name || !name.trim()) return;
            const id = 'kb-' + Date.now();
            os.kanbanState.boards.push({ id, name: name.trim(), cards: [] });
            os.kanbanState.activeBoardId = id;
            os.saveKanban();
            os.kanbanRender();
        },

        kanbanSetFilter: (q) => {
            os.kanbanState.filter = String(q || '').trim().toLowerCase();
            os.kanbanRenderColumns();
        },

        kanbanAddCard: (customTitle, customTag = 'Feature', customCol = 'todo') => {
            const board = os.kanbanActiveBoard();
            if (!board) return;
            const titleEl = document.getElementById('kanban-new-title');
            const tagEl = document.getElementById('kanban-new-tag');
            const colEl = document.getElementById('kanban-new-col');
            const title = (typeof customTitle === 'string' ? customTitle : (titleEl ? titleEl.value : '')).trim();
            if (!title) return;
            const tag = typeof customTitle === 'string' ? customTag : (tagEl ? tagEl.value : 'Feature');
            const col = typeof customTitle === 'string' ? customCol : (colEl ? colEl.value : 'todo');

            board.cards.unshift({
                id: 'kc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
                col,
                tag,
                title,
                created: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })
            });
            if (titleEl && typeof customTitle !== 'string') titleEl.value = '';
            os.saveKanban();
            os.kanbanRenderColumns();
        },

        kanbanMoveCard: (cardId, nextCol) => {
            const board = os.kanbanActiveBoard();
            if (!board) return;
            const card = board.cards.find((c) => c.id === cardId);
            if (!card) return;
            card.col = nextCol;
            os.saveKanban();
            os.kanbanRenderColumns();
        },

        kanbanDeleteCard: (cardId) => {
            const board = os.kanbanActiveBoard();
            if (!board) return;
            board.cards = board.cards.filter((c) => c.id !== cardId);
            os.saveKanban();
            os.kanbanRenderColumns();
        },

        kanbanExportToDevPad: () => {
            const board = os.kanbanActiveBoard();
            if (!board) return;
            const md = [`# ${board.name}`, ''];
            KANBAN_COLS.forEach((col) => {
                md.push(`## ${col.label}`);
                const cards = board.cards.filter((c) => c.col === col.id);
                if (!cards.length) md.push('_No items_');
                cards.forEach((c) => {
                    md.push(`- [${col.id === 'done' ? 'x' : ' '}] **[${c.tag}]** ${c.title}`);
                });
                md.push('');
            });
            if (!os.isModuleEnabled('devpad')) os.setModuleEnabled('devpad', true, { silent: true });
            os.openWindow('devpad');
            setTimeout(() => {
                os.devpadOpenExternalFile && os.devpadOpenExternalFile({
                    title: `${board.name.replace(/\s+/g, '-')}.md`,
                    content: md.join('\n')
                });
            }, 40);
        },

        kanbanRender: () => {
            const bar = document.getElementById('kanban-boards-bar');
            if (bar) {
                const boards = os.kanbanState.boards || [];
                bar.innerHTML = boards.map((b) => {
                    const active = b.id === os.kanbanState.activeBoardId;
                    return `<button type="button" onclick="os.kanbanSelectBoard('${b.id}')" class="px-3 py-1 rounded-lg border text-[11px] font-medium transition hover-target cursor-none ${active ? 'bg-white/15 border-white/30 text-white' : 'bg-white/[0.04] border-white/10 text-gray-400 hover:text-white'}">${esc(b.name)}</button>`;
                }).join('') + `<button type="button" onclick="os.kanbanNewBoard()" class="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/12 text-gray-300 text-[11px] hover-target cursor-none">+ Board</button>`;
            }
            os.kanbanRenderColumns();
            const root = document.getElementById('kanban-root');
            if (root && window.lucide) lucide.createIcons({ root });
        },

        kanbanRenderColumns: () => {
            const grid = document.getElementById('kanban-columns-grid');
            const board = os.kanbanActiveBoard();
            if (!grid || !board) return;
            const q = os.kanbanState.filter || '';

            grid.innerHTML = KANBAN_COLS.map((col, colIdx) => {
                const cards = board.cards.filter((c) => c.col === col.id && (!q || (c.title + ' ' + c.tag).toLowerCase().includes(q)));
                const prevCol = KANBAN_COLS[colIdx - 1]?.id;
                const nextCol = KANBAN_COLS[colIdx + 1]?.id;

                const cardsHtml = cards.length ? cards.map((c) => `
                    <div draggable="true" ondragstart="os._kbDragId='${c.id}'"
                        class="p-3 rounded-xl bg-white/[0.045] hover:bg-white/[0.075] border border-white/[0.08] space-y-2 transition group">
                        <div class="flex items-center justify-between gap-2">
                            <span class="px-2 py-0.5 rounded-md border text-[9.5px] font-medium ${TAG_STYLES[c.tag] || TAG_STYLES.Feature}">${esc(c.tag)}</span>
                            <button type="button" onclick="os.kanbanDeleteCard('${c.id}')" class="opacity-60 hover:opacity-100 text-gray-500 hover:text-red-300 text-xs hover-target cursor-none" title="Delete card">×</button>
                        </div>
                        <div class="text-xs text-gray-100 leading-snug select-text">${esc(c.title)}</div>
                        <div class="flex items-center justify-between pt-1 text-[10px] text-gray-500 font-mono">
                            <span>${esc(c.created || '')}</span>
                            <div class="flex items-center gap-1">
                                ${prevCol ? `<button type="button" onclick="os.kanbanMoveCard('${c.id}','${prevCol}')" class="px-1.5 py-0.5 rounded bg-white/[0.06] hover:bg-white/15 text-gray-300 hover-target cursor-none" title="Move left">←</button>` : ''}
                                ${nextCol ? `<button type="button" onclick="os.kanbanMoveCard('${c.id}','${nextCol}')" class="px-1.5 py-0.5 rounded bg-white/[0.06] hover:bg-white/15 text-gray-300 hover-target cursor-none" title="Move right">→</button>` : ''}
                            </div>
                        </div>
                    </div>
                `).join('') : `<div class="py-8 text-center text-[11px] text-gray-600 border border-dashed border-white/[0.06] rounded-xl">Drop cards here</div>`;

                return `
                    <div class="rounded-2xl bg-black/35 border border-white/[0.07] p-3 flex flex-col gap-2.5 min-h-[220px]"
                        ondragover="event.preventDefault()"
                        ondrop="event.preventDefault();if(os._kbDragId){os.kanbanMoveCard(os._kbDragId,'${col.id}');os._kbDragId=null;}">
                        <div class="flex items-center justify-between px-1">
                            <div class="flex items-center gap-2 text-xs font-semibold text-white">
                                <span class="w-2 h-2 rounded-full ${col.dot}"></span>
                                <span>${esc(col.label)}</span>
                            </div>
                            <span class="px-2 py-0.5 rounded-full bg-white/[0.07] text-[10px] font-mono text-gray-300">${cards.length}</span>
                        </div>
                        <div class="space-y-2 flex-1 overflow-y-auto pr-0.5">${cardsHtml}</div>
                    </div>
                `;
            }).join('');
        },

        // ── Clipboard & Snippets Methods ──
        saveClipboard: () => {
            localStorage.setItem('AetherOS_Clipboard_v1', JSON.stringify({
                tab: os.clipboardState.tab,
                items: (os.clipboardState.items || []).slice(0, 45)
            }));
        },

        initClipboardManager: () => {
            os.clipboardRender();
        },

        recordClipboardItem: (text, source = 'Copied', title = '', pinned = false) => {
            const clean = String(text || '').trim();
            if (!clean) return null;
            const existingIdx = (os.clipboardState.items || []).findIndex((i) => i.text === clean);
            if (existingIdx >= 0) {
                const existing = os.clipboardState.items[existingIdx];
                if (pinned) existing.pinned = true;
                if (title) existing.title = title;
                os.clipboardState.items.splice(existingIdx, 1);
                os.clipboardState.items.unshift(existing);
            } else {
                os.clipboardState.items.unshift({
                    id: 'cb-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
                    title: title || '',
                    text: clean.slice(0, 20000),
                    pinned: Boolean(pinned),
                    source,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
                });
            }
            if (os.clipboardState.items.length > 45) {
                os.clipboardState.items = os.clipboardState.items.filter((it, idx) => it.pinned || idx < 35);
            }
            os.saveClipboard();
            if (document.getElementById('clipboard-root')) os.clipboardRender();
            return os.clipboardState.items[0];
        },

        clipboardAddSnippet: () => {
            const tEl = document.getElementById('clip-new-title');
            const bEl = document.getElementById('clip-new-body');
            if (!bEl || !bEl.value.trim()) return;
            os.recordClipboardItem(bEl.value, 'Snippet', tEl ? tEl.value.trim() : '', true);
            if (tEl) tEl.value = '';
            bEl.value = '';
            window.Notifications && window.Notifications.push('SNIPPET PINNED', 'Saved to Clipboard & Snippets Vault');
        },

        clipboardCopyItem: (id) => {
            const item = (os.clipboardState.items || []).find((i) => i.id === id);
            if (!item) return;
            navigator.clipboard && navigator.clipboard.writeText(item.text).catch(() => {});
            window.Notifications && window.Notifications.push('CLIPBOARD', 'Copied to system clipboard');
        },

        clipboardTogglePin: (id) => {
            const item = (os.clipboardState.items || []).find((i) => i.id === id);
            if (!item) return;
            item.pinned = !item.pinned;
            os.saveClipboard();
            os.clipboardRender();
        },

        clipboardDeleteItem: (id) => {
            os.clipboardState.items = (os.clipboardState.items || []).filter((i) => i.id !== id);
            os.saveClipboard();
            os.clipboardRender();
        },

        clipboardClearUnpinned: () => {
            os.clipboardState.items = (os.clipboardState.items || []).filter((i) => i.pinned);
            os.saveClipboard();
            os.clipboardRender();
        },

        clipboardSetTab: (tab) => {
            os.clipboardState.tab = tab;
            os.clipboardRender();
        },

        clipboardSetQuery: (q) => {
            os.clipboardState.query = String(q || '').trim().toLowerCase();
            os.clipboardRender();
        },

        clipboardOpenInDevPad: (id) => {
            const item = (os.clipboardState.items || []).find((i) => i.id === id);
            if (!item) return;
            if (!os.isModuleEnabled('devpad')) os.setModuleEnabled('devpad', true, { silent: true });
            os.openWindow('devpad');
            setTimeout(() => {
                os.devpadOpenExternalFile && os.devpadOpenExternalFile({
                    title: (item.title || 'Snippet').replace(/[^\w\s-]/g, '').trim() + '.md',
                    content: item.text
                });
            }, 40);
        },

        clipboardRender: () => {
            const list = document.getElementById('clipboard-items-list');
            if (!list) return;
            const tab = os.clipboardState.tab || 'all';
            const q = os.clipboardState.query || '';

            document.querySelectorAll('[data-clip-tab]').forEach((b) => {
                b.classList.toggle('active', b.getAttribute('data-clip-tab') === tab);
            });

            const filtered = (os.clipboardState.items || []).filter((item) => {
                if (tab === 'pinned' && !item.pinned) return false;
                if (tab === 'history' && item.pinned) return false;
                if (q && !(item.title + ' ' + item.text + ' ' + item.source).toLowerCase().includes(q)) return false;
                return true;
            });

            if (!filtered.length) {
                list.innerHTML = `<div class="py-12 text-center text-gray-500">No matching clips or snippets yet. Copy any text or pin a reusable snippet above.</div>`;
                return;
            }

            list.innerHTML = filtered.map((it) => `
                <div class="p-3 rounded-xl bg-white/[0.035] hover:bg-white/[0.06] border ${it.pinned ? 'border-emerald-400/25' : 'border-white/[0.07]'} space-y-1.5 transition">
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2 min-w-0">
                            ${it.pinned ? '<span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono uppercase">Pinned</span>' : '<span class="px-1.5 py-0.5 rounded bg-white/10 text-gray-400 text-[9px] font-mono uppercase">Clip</span>'}
                            <span class="text-xs font-semibold text-white truncate">${esc(it.title || it.text.split('\n')[0].slice(0, 48))}</span>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0">
                            <button type="button" onclick="os.clipboardCopyItem('${it.id}')" class="px-2.5 py-1 rounded-md bg-white text-black font-semibold text-[10.5px] hover-target cursor-none">Copy</button>
                            <button type="button" onclick="os.clipboardOpenInDevPad('${it.id}')" class="px-2 py-1 rounded-md bg-white/[0.07] hover:bg-white/14 text-gray-200 text-[10.5px] hover-target cursor-none" title="Open in Markdown Studio">Edit</button>
                            <button type="button" onclick="os.clipboardTogglePin('${it.id}')" class="px-2 py-1 rounded-md bg-white/[0.06] hover:bg-white/14 text-[10.5px] ${it.pinned ? 'text-emerald-300' : 'text-gray-400'} hover-target cursor-none">${it.pinned ? 'Unpin' : 'Pin'}</button>
                            <button type="button" onclick="os.clipboardDeleteItem('${it.id}')" class="px-1.5 py-1 rounded-md text-gray-500 hover:text-red-300 hover-target cursor-none">×</button>
                        </div>
                    </div>
                    <pre class="text-[11px] font-mono text-gray-300 whitespace-pre-wrap break-all max-h-24 overflow-y-auto bg-black/40 rounded-lg p-2 select-text">${esc(it.text)}</pre>
                </div>
            `).join('');
        },

        // ── Capture & Sketch Studio Methods ──
        initCaptureStudio: () => {
            os.captureRenderSwatches();
            os.captureSetMode(os.sketchState.mode || 'sketch');
            setTimeout(() => os.sketchInitCanvas(), 30);
        },

        captureSetMode: (mode) => {
            os.sketchState.mode = mode === 'screen' ? 'screen' : 'sketch';
            const sk = document.getElementById('capture-sketch-pane');
            const sc = document.getElementById('capture-screen-pane');
            if (sk) sk.classList.toggle('hidden', os.sketchState.mode !== 'sketch');
            if (sc) sc.classList.toggle('hidden', os.sketchState.mode !== 'screen');
            document.querySelectorAll('[data-cap-mode]').forEach((b) => {
                b.classList.toggle('active', b.getAttribute('data-cap-mode') === os.sketchState.mode);
            });
            if (os.sketchState.mode === 'sketch') setTimeout(() => os.sketchInitCanvas(), 20);
            const root = document.getElementById('capture-root');
            if (root && window.lucide) lucide.createIcons({ root });
        },

        captureRenderSwatches: () => {
            const host = document.getElementById('sketch-color-swatches');
            if (!host) return;
            host.innerHTML = SKETCH_COLORS.map((c) => `
                <button type="button" onclick="os.sketchSetColor('${c}')"
                    class="w-5 h-5 rounded-full border ${os.sketchState.color === c ? 'border-white scale-110' : 'border-white/25'} transition hover-target cursor-none"
                    style="background:${c}"></button>
            `).join('');
        },

        sketchSetTool: (tool) => {
            os.sketchState.tool = tool;
            document.querySelectorAll('[data-sk-tool]').forEach((b) => {
                const on = b.getAttribute('data-sk-tool') === tool;
                b.className = `px-2.5 py-1 rounded-lg text-[11px] hover-target cursor-none ${on ? 'bg-white/15 text-white' : 'bg-white/[0.04] text-gray-400 hover:text-white'}`;
            });
        },

        sketchSetColor: (c) => {
            os.sketchState.color = c;
            if (os.sketchState.tool === 'eraser') os.sketchSetTool('pen');
            os.captureRenderSwatches();
        },

        sketchInitCanvas: () => {
            const canvas = document.getElementById('sketch-canvas');
            const wrap = document.getElementById('sketch-canvas-wrap');
            if (!canvas || !wrap) return;
            const rect = wrap.getBoundingClientRect();
            const targetW = Math.max(480, Math.floor(rect.width || 760));
            const targetH = Math.max(300, Math.floor(rect.height || 420));

            if (canvas.width !== targetW || canvas.height !== targetH) {
                const ctx = canvas.getContext('2d');
                let prev = null;
                if (canvas.width > 0 && canvas.height > 0) {
                    try { prev = ctx.getImageData(0, 0, canvas.width, canvas.height); } catch (_) {}
                }
                canvas.width = targetW;
                canvas.height = targetH;
                ctx.fillStyle = '#090b12';
                ctx.fillRect(0, 0, targetW, targetH);
                if (prev) {
                    try { ctx.putImageData(prev, 0, 0); } catch (_) {}
                }
            }

            if (canvas.dataset.bound === '1') return;
            canvas.dataset.bound = '1';

            const getPos = (e) => {
                const r = canvas.getBoundingClientRect();
                const cx = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
                const cy = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
                return { x: cx - r.left, y: cy - r.top };
            };

            canvas.addEventListener('pointerdown', (e) => {
                const ctx = canvas.getContext('2d');
                const p = getPos(e);
                os.sketchState.drawing = true;
                os.sketchState.startX = p.x;
                os.sketchState.startY = p.y;
                try {
                    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    os.sketchState.snapshot = snap;
                    os.sketchState.undoStack.push(snap);
                    if (os.sketchState.undoStack.length > 10) os.sketchState.undoStack.shift();
                } catch (_) {}
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
            });

            canvas.addEventListener('pointermove', (e) => {
                if (!os.sketchState.drawing) return;
                const ctx = canvas.getContext('2d');
                const p = getPos(e);
                const tool = os.sketchState.tool;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.lineWidth = tool === 'eraser' ? os.sketchState.size * 3 : os.sketchState.size;
                ctx.strokeStyle = tool === 'eraser' ? '#090b12' : os.sketchState.color;
                ctx.shadowBlur = tool === 'glow' ? 14 : 0;
                ctx.shadowColor = tool === 'glow' ? os.sketchState.color : 'transparent';

                if (tool === 'line' || tool === 'rect') {
                    if (os.sketchState.snapshot) ctx.putImageData(os.sketchState.snapshot, 0, 0);
                    ctx.beginPath();
                    if (tool === 'line') {
                        ctx.moveTo(os.sketchState.startX, os.sketchState.startY);
                        ctx.lineTo(p.x, p.y);
                        ctx.stroke();
                    } else {
                        ctx.strokeRect(
                            os.sketchState.startX,
                            os.sketchState.startY,
                            p.x - os.sketchState.startX,
                            p.y - os.sketchState.startY
                        );
                    }
                } else {
                    ctx.lineTo(p.x, p.y);
                    ctx.stroke();
                }
            });

            const endDraw = () => {
                os.sketchState.drawing = false;
                const ctx = canvas.getContext('2d');
                ctx.shadowBlur = 0;
            };
            canvas.addEventListener('pointerup', endDraw);
            canvas.addEventListener('pointerleave', endDraw);
        },

        sketchUndo: () => {
            const canvas = document.getElementById('sketch-canvas');
            if (!canvas || !os.sketchState.undoStack.length) return;
            const prev = os.sketchState.undoStack.pop();
            if (prev) canvas.getContext('2d').putImageData(prev, 0, 0);
        },

        sketchClear: () => {
            const canvas = document.getElementById('sketch-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#090b12';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        },

        sketchDownload: () => {
            const canvas = document.getElementById('sketch-canvas');
            if (!canvas) return;
            const a = document.createElement('a');
            a.href = canvas.toDataURL('image/png');
            a.download = `aether-sketch-${Date.now()}.png`;
            a.click();
        },

        sketchSaveToVFS: async (asWallpaper = false) => {
            const canvas = document.getElementById('sketch-canvas');
            if (!canvas || !window.AetherVFS) return;
            const dataUrl = canvas.toDataURL('image/png');
            const rec = await AetherVFS.putFile({
                name: `Sketch-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.png`,
                mime: 'image/png',
                kind: 'image',
                icon: 'image',
                folder: 'User Uploads',
                dataUrl,
                imageUrl: dataUrl,
                content: 'Created in AetherOS Capture & Sketch Studio',
                tags: ['sketch', 'diagram']
            });
            if (asWallpaper) {
                await AetherVFS.applyFileAsWallpaper(rec.id);
            } else if (window.Notifications) {
                window.Notifications.push('SKETCH SAVED', `"${rec.name}" saved to File Explorer`);
            }
        },

        // ── Screen & Camera Stream / Recorder ──
        captureStartStream: async (source = 'screen') => {
            try {
                os.captureStopStream();
                if (!navigator.mediaDevices) throw new Error('MediaDevices unavailable in this browser');
                const stream = source === 'camera'
                    ? await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                    : await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                os.captureRuntime.stream = stream;
                const video = document.getElementById('capture-live-video');
                const hint = document.getElementById('capture-empty-hint');
                if (video) {
                    video.srcObject = stream;
                    video.classList.remove('hidden');
                }
                if (hint) hint.classList.add('hidden');
                stream.getVideoTracks()[0]?.addEventListener('ended', () => os.captureStopStream());
            } catch (err) {
                window.Notifications && window.Notifications.push('CAPTURE', err.message || 'Capture permission cancelled');
            }
        },

        captureStopStream: () => {
            if (os.captureRuntime.recorder && os.captureRuntime.recorder.state !== 'inactive') {
                os.captureRuntime.recorder.stop();
            }
            if (os.captureRuntime.stream) {
                os.captureRuntime.stream.getTracks().forEach((t) => t.stop());
                os.captureRuntime.stream = null;
            }
            const video = document.getElementById('capture-live-video');
            const hint = document.getElementById('capture-empty-hint');
            if (video) { video.srcObject = null; video.classList.add('hidden'); }
            if (hint) hint.classList.remove('hidden');
        },

        captureToggleRecording: async () => {
            if (os.captureRuntime.recorder && os.captureRuntime.recorder.state === 'recording') {
                os.captureRuntime.recorder.stop();
                return;
            }
            if (!os.captureRuntime.stream) {
                await os.captureStartStream('screen');
                if (!os.captureRuntime.stream) return;
            }
            if (typeof MediaRecorder === 'undefined') {
                window.Notifications && window.Notifications.push('RECORDER', 'MediaRecorder not supported in this browser');
                return;
            }
            os.captureRuntime.chunks = [];
            const rec = new MediaRecorder(os.captureRuntime.stream);
            os.captureRuntime.recorder = rec;
            rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) os.captureRuntime.chunks.push(e.data); };
            rec.onstop = () => {
                clearInterval(os.captureRuntime.recTimer);
                const badge = document.getElementById('capture-rec-badge');
                const btn = document.getElementById('capture-rec-btn');
                if (badge) badge.style.display = 'none';
                if (btn) btn.textContent = 'Start Recording (.webm)';

                const blob = new Blob(os.captureRuntime.chunks, { type: 'video/webm' });
                const reader = new FileReader();
                reader.onload = () => {
                    os.captureRuntime.lastAsset = {
                        name: `ScreenCapture-${Date.now()}.webm`,
                        mime: 'video/webm',
                        kind: 'video',
                        dataUrl: String(reader.result || ''),
                        sizeBytes: blob.size
                    };
                    const tray = document.getElementById('capture-output-tray');
                    const lbl = document.getElementById('capture-output-label');
                    if (tray) tray.classList.remove('hidden');
                    if (lbl) lbl.textContent = `Recorded ${os.captureRuntime.lastAsset.name} (${Math.round(blob.size / 1024)} KB)`;
                };
                reader.readAsDataURL(blob);
            };

            rec.start();
            os.captureRuntime.recStart = Date.now();
            const badge = document.getElementById('capture-rec-badge');
            const timerEl = document.getElementById('capture-rec-timer');
            const btn = document.getElementById('capture-rec-btn');
            if (badge) badge.style.display = 'inline-flex';
            if (btn) btn.textContent = 'Stop Recording';
            clearInterval(os.captureRuntime.recTimer);
            os.captureRuntime.recTimer = setInterval(() => {
                const sec = Math.floor((Date.now() - os.captureRuntime.recStart) / 1000);
                const mm = String(Math.floor(sec / 60)).padStart(2, '0');
                const ss = String(sec % 60).padStart(2, '0');
                if (timerEl) timerEl.textContent = `REC ${mm}:${ss}`;
            }, 500);
        },

        captureGrabFrame: () => {
            const video = document.getElementById('capture-live-video');
            if (!video || !os.captureRuntime.stream || !video.videoWidth) {
                window.Notifications && window.Notifications.push('CAPTURE', 'Start Screen or Webcam stream first to snap a frame.');
                return;
            }
            const c = document.createElement('canvas');
            c.width = video.videoWidth;
            c.height = video.videoHeight;
            c.getContext('2d').drawImage(video, 0, 0);
            const dataUrl = c.toDataURL('image/png');
            os.captureRuntime.lastAsset = {
                name: `Snapshot-${Date.now()}.png`,
                mime: 'image/png',
                kind: 'image',
                dataUrl,
                imageUrl: dataUrl,
                sizeBytes: dataUrl.length
            };
            const tray = document.getElementById('capture-output-tray');
            const lbl = document.getElementById('capture-output-label');
            if (tray) tray.classList.remove('hidden');
            if (lbl) lbl.textContent = `Frame captured (${c.width}×${c.height}) — ${os.captureRuntime.lastAsset.name}`;
        },

        captureSaveLastToVFS: async () => {
            const asset = os.captureRuntime.lastAsset;
            if (!asset || !window.AetherVFS) return;
            await AetherVFS.putFile({
                name: asset.name,
                mime: asset.mime,
                kind: asset.kind,
                icon: asset.kind === 'image' ? 'image' : 'film',
                folder: 'User Uploads',
                dataUrl: asset.dataUrl,
                imageUrl: asset.imageUrl || '',
                sizeBytes: asset.sizeBytes || 0,
                content: `Captured via AetherOS Capture Studio (${asset.mime})`,
                tags: ['capture', asset.kind]
            });
            window.Notifications && window.Notifications.push('SAVED TO FILES', `"${asset.name}" stored in /Archive/User Uploads`);
        },

        captureDownloadLast: () => {
            const asset = os.captureRuntime.lastAsset;
            if (!asset) return;
            const a = document.createElement('a');
            a.href = asset.dataUrl;
            a.download = asset.name;
            a.click();
        }
    });

    // Global Copy Listener & Ctrl/Cmd+Shift+V Shortcut for Clipboard Vault
    window.addEventListener('DOMContentLoaded', () => {
        document.addEventListener('copy', () => {
            try {
                const sel = window.getSelection && String(window.getSelection()).trim();
                if (sel && window.os && os.recordClipboardItem) {
                    os.recordClipboardItem(sel, 'Selection');
                }
            } catch (_) {}
        });

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
                const tag = (e.target && e.target.tagName || '').toLowerCase();
                if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
                e.preventDefault();
                if (window.os) {
                    if (!os.isModuleEnabled('clipboard')) os.setModuleEnabled('clipboard', true, { silent: true });
                    os.openWindow('clipboard');
                }
            }
        });
    });
})();
