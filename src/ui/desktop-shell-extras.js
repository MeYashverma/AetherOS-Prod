// AetherOS — Desktop Right-Click Context Menu, 50/50 Window Auto-Tiler & Interactive Calendar / World Clock Popover
(function () {
    const esc = (v) => String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const WORLD_ZONES = [
        { label: 'UTC',       tz: 'UTC' },
        { label: 'New York',  tz: 'America/New_York' },
        { label: 'London',    tz: 'Europe/London' },
        { label: 'India IST', tz: 'Asia/Kolkata' },
        { label: 'Tokyo',     tz: 'Asia/Tokyo' }
    ];

    function toIsoDate(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function loadAgendaState() {
        try {
            const parsed = JSON.parse(localStorage.getItem('AetherOS_Agenda_v1') || 'null');
            if (parsed && typeof parsed === 'object') return parsed;
        } catch (_) {}
        const today = toIsoDate(new Date());
        return {
            [today]: [
                { id: 'ag-1', text: 'Review Workspace Sprint board', done: false }
            ]
        };
    }

    window.extendOS({
        calendarOpen: false,
        calendarCursor: new Date(),
        calendarSelectedDate: toIsoDate(new Date()),
        agendaByDate: loadAgendaState(),

        saveAgenda: () => {
            localStorage.setItem('AetherOS_Agenda_v1', JSON.stringify(os.agendaByDate || {}));
        },

        // ── 1-Click 50/50 Side-by-Side Window Auto-Tiler ──
        tileSideBySide: () => {
            const curSpace = Number(SystemState.settings.active_space || 1);
            const openWins = Object.values(SystemState.windows || {})
                .filter((w) => w.isOpen && !w.isMinimized && Number(w.space || 1) === curSpace)
                .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

            if (!openWins.length) {
                window.Notifications && window.Notifications.push('WINDOW TILER', 'Open two windows first to tile side-by-side.');
                return false;
            }
            if (openWins.length === 1) {
                window.WindowSnapManager && WindowSnapManager.snapWindow(openWins[0].id, 'maximize');
                return true;
            }
            if (window.WindowSnapManager) {
                WindowSnapManager.snapWindow(openWins[0].id, 'left');
                WindowSnapManager.snapWindow(openWins[1].id, 'right');
                window.Notifications && window.Notifications.push('WINDOW TILER', `Tiled "${openWins[0].title}" & "${openWins[1].title}" 50/50`);
                return true;
            }
            return false;
        },

        cycleNextTheme: () => {
            const themes = ['midnight', 'aurora', 'synthwave', 'ice', 'solar', 'ocean', 'ember', 'rose', 'sakura', 'carbon'];
            const cur = SystemState.settings.active_theme || 'midnight';
            const next = themes[(themes.indexOf(cur) + 1) % themes.length];
            os.applyTheme && os.applyTheme(next);
            window.Notifications && window.Notifications.push('APPEARANCE', `Switched to ${next.charAt(0).toUpperCase() + next.slice(1)} theme`);
        },

        // ── Desktop Right-Click Context Menu ──
        openDesktopContextMenu: (clientX, clientY) => {
            const menu = document.getElementById('desktop-context-menu');
            if (!menu) return;
            os.closeTopBarMenus && os.closeTopBarMenus();
            os.toggleCalendarPopover && os.toggleCalendarPopover(false);
            os.hideDockContextMenu && os.hideDockContextMenu();

            menu.style.display = 'block';
            const menuW = 232;
            const menuH = 310;
            const x = Math.max(8, Math.min(window.innerWidth - menuW - 8, clientX));
            const y = Math.max(42, Math.min(window.innerHeight - menuH - 12, clientY));
            menu.style.left = `${x}px`;
            menu.style.top = `${y}px`;
            if (window.lucide) lucide.createIcons({ root: menu });
            if (window.gsap) {
                gsap.fromTo(menu, { opacity: 0, scale: 0.95, y: -4 }, { opacity: 1, scale: 1, y: 0, duration: 0.15, ease: 'power2.out' });
            }
        },

        closeDesktopContextMenu: () => {
            const menu = document.getElementById('desktop-context-menu');
            if (menu) menu.style.display = 'none';
        },

        // ── Interactive Calendar, World Clocks & Daily Agenda Popover ──
        toggleCalendarPopover: (forceState) => {
            const pop = document.getElementById('calendar-popover');
            if (!pop) return;
            const next = typeof forceState === 'boolean' ? forceState : !os.calendarOpen;
            if (next) {
                os.closeTopBarMenus && os.closeTopBarMenus();
                os.closeDesktopContextMenu && os.closeDesktopContextMenu();
            }
            os.calendarOpen = next;
            if (next) {
                os.renderCalendarPopover();
                pop.style.display = 'block';
                if (window.gsap) {
                    gsap.fromTo(pop, { opacity: 0, scale: 0.96, y: -8 }, { opacity: 1, scale: 1, y: 0, duration: 0.18, ease: 'power2.out' });
                }
            } else {
                pop.style.display = 'none';
            }
        },

        calendarShiftMonth: (delta) => {
            if (delta === 0) {
                os.calendarCursor = new Date();
                os.calendarSelectedDate = toIsoDate(new Date());
            } else {
                const c = os.calendarCursor || new Date();
                os.calendarCursor = new Date(c.getFullYear(), c.getMonth() + delta, 1);
            }
            os.renderCalendarPopover();
        },

        calendarSelectDate: (iso) => {
            os.calendarSelectedDate = iso;
            os.renderCalendarPopover();
        },

        calendarAddAgenda: () => {
            const inp = document.getElementById('calendar-agenda-input');
            if (!inp || !inp.value.trim()) return;
            const iso = os.calendarSelectedDate || toIsoDate(new Date());
            os.agendaByDate[iso] = os.agendaByDate[iso] || [];
            os.agendaByDate[iso].push({
                id: 'ag-' + Date.now(),
                text: inp.value.trim(),
                done: false
            });
            inp.value = '';
            os.saveAgenda();
            os.renderCalendarPopover();
        },

        calendarToggleAgenda: (iso, id) => {
            const list = os.agendaByDate[iso] || [];
            const item = list.find((x) => x.id === id);
            if (item) item.done = !item.done;
            os.saveAgenda();
            os.renderCalendarPopover();
        },

        calendarDeleteAgenda: (iso, id) => {
            os.agendaByDate[iso] = (os.agendaByDate[iso] || []).filter((x) => x.id !== id);
            if (!os.agendaByDate[iso].length) delete os.agendaByDate[iso];
            os.saveAgenda();
            os.renderCalendarPopover();
        },

        renderCalendarPopover: () => {
            const pop = document.getElementById('calendar-popover');
            if (!pop) return;

            const cursor = os.calendarCursor || new Date();
            const year = cursor.getFullYear();
            const month = cursor.getMonth();
            const monthLabel = cursor.toLocaleDateString([], { month: 'long', year: 'numeric' });
            const todayIso = toIsoDate(new Date());
            const selectedIso = os.calendarSelectedDate || todayIso;

            const firstWeekday = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            let cellsHtml = '';
            for (let i = 0; i < firstWeekday; i++) {
                cellsHtml += `<div class="h-7"></div>`;
            }
            for (let day = 1; day <= daysInMonth; day++) {
                const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = iso === todayIso;
                const isSel = iso === selectedIso;
                const hasEvents = (os.agendaByDate[iso] || []).length > 0;

                cellsHtml += `
                    <button type="button" onclick="os.calendarSelectDate('${iso}')"
                        class="relative h-7 rounded-lg text-[11px] font-mono flex items-center justify-center transition hover-target cursor-none ${
                            isToday
                                ? 'bg-sky-500 text-black font-bold shadow'
                                : isSel
                                ? 'bg-white/18 text-white border border-white/30'
                                : 'text-gray-300 hover:bg-white/10'
                        }">
                        <span>${day}</span>
                        ${hasEvents ? `<span class="w-1 h-1 rounded-full ${isToday ? 'bg-black' : 'bg-cyan-400'} absolute bottom-1"></span>` : ''}
                    </button>
                `;
            }

            const now = new Date();
            const worldHtml = WORLD_ZONES.map((z) => {
                let formatted = '--:--';
                try {
                    formatted = new Intl.DateTimeFormat([], {
                        timeZone: z.tz,
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    }).format(now);
                } catch (_) {}
                return `
                    <div class="px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-between text-[10.5px]">
                        <span class="text-gray-400 truncate">${esc(z.label)}</span>
                        <span class="font-mono text-white font-medium ml-1.5">${esc(formatted)}</span>
                    </div>
                `;
            }).join('');

            const agendaItems = os.agendaByDate[selectedIso] || [];
            const agendaHtml = agendaItems.length ? agendaItems.map((a) => `
                <div class="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                    <button type="button" onclick="os.calendarToggleAgenda('${selectedIso}','${a.id}')" class="flex items-center gap-2 text-left min-w-0 flex-1 hover-target cursor-none">
                        <span class="w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] shrink-0 ${a.done ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200' : 'border-white/25'}">${a.done ? '✓' : ''}</span>
                        <span class="text-[11px] truncate ${a.done ? 'line-through text-gray-500' : 'text-gray-200'}">${esc(a.text)}</span>
                    </button>
                    <button type="button" onclick="os.calendarDeleteAgenda('${selectedIso}','${a.id}')" class="text-gray-500 hover:text-red-300 text-xs hover-target cursor-none">×</button>
                </div>
            `).join('') : `<div class="text-[11px] text-gray-500 py-2 text-center">No reminders for ${esc(selectedIso)}</div>`;

            pop.innerHTML = `
                <div class="space-y-3 text-xs select-none" onclick="event.stopPropagation()">
                    <!-- Month Header -->
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-semibold text-white">${esc(monthLabel)}</span>
                        <div class="flex items-center gap-1">
                            <button type="button" onclick="os.calendarShiftMonth(-1)" class="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/14 text-gray-300 hover-target cursor-none">‹</button>
                            <button type="button" onclick="os.calendarShiftMonth(0)" class="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/14 text-[10px] text-gray-300 hover-target cursor-none">Today</button>
                            <button type="button" onclick="os.calendarShiftMonth(1)" class="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/14 text-gray-300 hover-target cursor-none">›</button>
                        </div>
                    </div>

                    <!-- Weekday Grid -->
                    <div>
                        <div class="grid grid-cols-7 gap-1 text-[9.5px] font-mono text-gray-500 text-center mb-1">
                            <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                        </div>
                        <div class="grid grid-cols-7 gap-1">${cellsHtml}</div>
                    </div>

                    <!-- Selected Date Agenda -->
                    <div class="pt-2 border-t border-white/10 space-y-2">
                        <div class="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-gray-400">
                            <span>Agenda · ${esc(selectedIso)}</span>
                            <span>${agendaItems.length} item${agendaItems.length === 1 ? '' : 's'}</span>
                        </div>
                        <form onsubmit="event.preventDefault();os.calendarAddAgenda()" class="flex gap-1.5">
                            <input id="calendar-agenda-input" type="text" placeholder="Add reminder..."
                                class="flex-1 px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-[11px] text-white outline-none focus:border-white/30">
                            <button type="submit" class="px-2.5 py-1 rounded-lg bg-white text-black font-semibold text-[10.5px] hover-target cursor-none">Add</button>
                        </form>
                        <div class="space-y-1 max-h-28 overflow-y-auto pr-0.5">${agendaHtml}</div>
                    </div>

                    <!-- World Clocks -->
                    <div class="pt-2 border-t border-white/10 space-y-1.5">
                        <div class="text-[10px] font-mono uppercase tracking-wider text-gray-400">World Clocks</div>
                        <div class="grid grid-cols-2 gap-1.5">${worldHtml}</div>
                    </div>
                </div>
            `;
        }
    });

    window.addEventListener('DOMContentLoaded', () => {
        const canvas = document.getElementById('window-canvas');
        if (canvas) {
            canvas.addEventListener('contextmenu', (e) => {
                const t = e.target;
                if (t && t.closest && (t.closest('.os-window') || t.closest('input') || t.closest('textarea'))) {
                    return;
                }
                e.preventDefault();
                window.os && os.openDesktopContextMenu(e.clientX, e.clientY);
            });
        }

        document.addEventListener('mousedown', (e) => {
            const t = e.target;
            if (!t) return;
            const ctxMenu = document.getElementById('desktop-context-menu');
            if (ctxMenu && ctxMenu.style.display === 'block' && !(t.closest && t.closest('#desktop-context-menu'))) {
                os.closeDesktopContextMenu();
            }
            const cal = document.getElementById('calendar-popover');
            if (cal && cal.style.display === 'block' && !(t.closest && (t.closest('#calendar-popover') || t.closest('#sys-clock')))) {
                os.toggleCalendarPopover(false);
            }
        }, { passive: true });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && window.os) {
                os.closeDesktopContextMenu && os.closeDesktopContextMenu();
                os.toggleCalendarPopover && os.toggleCalendarPopover(false);
            }
        });
    });
})();
