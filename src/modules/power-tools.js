// AetherOS — Kanban Sprint & Project Board (kanban)
(function () {
    const esc = (v) => String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    window.WindowContents = window.WindowContents || {};

    const KANBAN_COLS = [
        { id: 'todo',  label: 'Backlog',     dot: 'bg-sky-400' },
        { id: 'doing', label: 'In Progress', dot: 'bg-amber-400' },
        { id: 'done',  label: 'Done',     dot: 'bg-emerald-400' }
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
            <header class="studio-app-heading"><div><span class="studio-eyebrow">PLAN / DO / FINISH</span><h2>A clearer view of your work.</h2><p>Local boards with editable cards. Drag or use the move buttons.</p></div><span id="kanban-save-status" role="status">Stored in this browser</span></header>
            <div class="px-4 py-2.5 border-b border-white/[0.07] bg-black/40 flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-1.5 overflow-x-auto" id="kanban-boards-bar"></div>
                <div class="flex items-center gap-2">
                    <div class="relative">
                        <i data-lucide="search" class="w-3 h-3 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2"></i>
                        <input id="kanban-filter-input" aria-label="Filter board cards" type="text" placeholder="Filter cards..." oninput="os.kanbanSetFilter(this.value)"
                            class="w-36 sm:w-44 pl-7 pr-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-[11px] text-white outline-none focus:border-white/25">
                    </div>
                    <button type="button" onclick="os.kanbanExportToDevPad()" class="px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/30 text-[11px] text-indigo-200 hover-target cursor-none flex items-center gap-1.5" title="Open board as Markdown in Dev Studio">
                        <i data-lucide="file-code" class="w-3 h-3"></i><span>To Markdown</span>
                    </button>
                </div>
            </div>

            <form onsubmit="event.preventDefault();os.kanbanAddCard()" class="px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.015] flex flex-wrap items-center gap-2">
                <input id="kanban-new-title" aria-label="New card title" maxlength="240" type="text" placeholder="Add a task, feature, or milestone..."
                    class="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg bg-black/45 border border-white/10 text-xs text-white outline-none focus:border-white/30">
                <select id="kanban-new-tag" aria-label="New card category" class="px-2.5 py-1.5 rounded-lg bg-black/55 border border-white/10 text-[11px] text-gray-200 outline-none">
                    <option value="Feature">Feature</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Design">Design</option>
                    <option value="Research">Research</option>
                    <option value="Chore">Chore</option>
                </select>
                <select id="kanban-new-col" aria-label="New card column" class="px-2.5 py-1.5 rounded-lg bg-black/55 border border-white/10 text-[11px] text-gray-200 outline-none">
                    <option value="todo">→ Backlog</option>
                    <option value="doing">→ In Progress</option>
                    <option value="done">→ Done</option>
                </select>
                <button type="submit" class="px-3.5 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-gray-200 transition hover-target cursor-none">Add Card</button>
            </form>

            <div id="kanban-undo-status" class="studio-undo" role="status"></div>
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
                    cards: []
                }
            ]
        };
    }

    window.extendOS({
        kanbanState: loadKanbanState(),

        saveKanban: () => {
            const status=document.getElementById('kanban-save-status');
            try{localStorage.setItem('AetherOS_Kanban_v1',JSON.stringify({activeBoardId:os.kanbanState.activeBoardId,boards:os.kanbanState.boards}));if(status)status.textContent='Saved on this browser';return true;}
            catch(_){if(status)status.textContent='Session only — storage unavailable. Export before closing.';return false;}
        },
        kanbanEditCard: (id,title) => {
            const card=os.kanbanActiveBoard()?.cards.find(c=>c.id===id),value=String(title||'').trim().slice(0,240);
            if(!card||!value)return;card.title=value;os.saveKanban();os.kanbanRenderColumns();
        },
        kanbanUndoDelete: () => {
            const deleted=os._kbDeleted;if(!deleted)return;
            const board=os.kanbanState.boards.find(b=>b.id===deleted.boardId);if(!board)return;
            board.cards.splice(Math.min(deleted.index,board.cards.length),0,deleted.card);os._kbDeleted=null;
            os.saveKanban();os.kanbanRenderColumns();const status=document.getElementById('kanban-undo-status');if(status)status.textContent='Card restored.';
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
            if (!title || title.length>240) return;
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
            if (!card || !KANBAN_COLS.some(c=>c.id===nextCol)) return;
            card.col = nextCol;
            os.saveKanban();
            os.kanbanRenderColumns();
        },

        kanbanDeleteCard: (cardId) => {
            const board = os.kanbanActiveBoard();
            if (!board) return;
            const index=board.cards.findIndex(c=>c.id===cardId);if(index<0)return;
            os._kbDeleted={boardId:board.id,index,card:board.cards[index]};
            board.cards.splice(index,1);
            const status=document.getElementById('kanban-undo-status');if(status)status.innerHTML='Card deleted. <button type="button" onclick="os.kanbanUndoDelete()">Undo</button>';
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
                    <article draggable="true" ondragend="os._kbDragId=null" ondragstart="os._kbDragId='${c.id}'"
                        class="kanban-task-card p-3 rounded-xl bg-white/[0.045] hover:bg-white/[0.075] border border-white/[0.08] space-y-2 transition group">
                        <div class="flex items-center justify-between gap-2">
                            <span class="px-2 py-0.5 rounded-md border text-[9.5px] font-medium ${TAG_STYLES[c.tag] || TAG_STYLES.Feature}">${esc(c.tag)}</span>
                            <button type="button" onclick="os.kanbanDeleteCard('${c.id}')" class="opacity-60 hover:opacity-100 text-gray-500 hover:text-red-300 text-xs hover-target cursor-none" aria-label="Delete card: ${esc(c.title)}" title="Delete card">×</button>
                        </div>
                        <div class="text-xs text-gray-100 leading-snug select-text">${esc(c.title)}</div>
                        <details class="kanban-card-editor"><summary>Edit title</summary><form onsubmit="event.preventDefault();os.kanbanEditCard('${c.id}',this.elements.title.value)"><input name="title" aria-label="Edit card title" value="${esc(c.title)}" maxlength="240" required><button type="submit">Save</button></form></details>
                        <div class="flex items-center justify-between pt-1 text-[10px] text-gray-500 font-mono">
                            <span>${esc(c.created || '')}</span>
                            <div class="flex items-center gap-1">
                                ${prevCol ? `<button type="button" onclick="os.kanbanMoveCard('${c.id}','${prevCol}')" class="px-1.5 py-0.5 rounded bg-white/[0.06] hover:bg-white/15 text-gray-300 hover-target cursor-none" aria-label="Move to ${esc(KANBAN_COLS[colIdx-1]?.label)}" title="Move left">←</button>` : ''}
                                ${nextCol ? `<button type="button" onclick="os.kanbanMoveCard('${c.id}','${nextCol}')" class="px-1.5 py-0.5 rounded bg-white/[0.06] hover:bg-white/15 text-gray-300 hover-target cursor-none" aria-label="Move to ${esc(KANBAN_COLS[colIdx+1]?.label)}" title="Move right">→</button>` : ''}
                            </div>
                        </div>
                    </article>
                `).join('') : `<div class="py-8 text-center text-[11px] text-gray-600 border border-dashed border-white/[0.06] rounded-xl">${q?'No matching cards. Try another filter.':'No cards yet. Add a task above or move a card here.'}</div>`;

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
        }
    });
})();
