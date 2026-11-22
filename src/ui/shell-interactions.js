// AetherOS — Notification Center, Delegated Cursor Hover & Global Menu Dismissal
// ===== AETHEROS SHELL INTERACTIONS & NOTIFICATION CENTER =====
window.NotificationCenter = {
    _items: [],
    _unread: 0,
    _record(title, message) {
        const entry = {
            id: 'nc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
            title: String(title || 'System'),
            message: String(message || ''),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
        };
        this._items.unshift(entry);
        if (this._items.length > 40) this._items.pop();
        const panel = document.getElementById('notification-center');
        const isOpen = panel && panel.style.display === 'block';
        if (!isOpen) this._unread++;
        this._updateDot();
        if (isOpen) this.render();
    },
    _updateDot() {
        const dot = document.getElementById('notif-unread-dot');
        if (dot) dot.classList.toggle('hidden', this._unread <= 0);
    },
    render() {
        const list = document.getElementById('notif-center-list');
        const countEl = document.getElementById('notif-center-count');
        if (countEl) countEl.textContent = `${this._items.length}`;
        if (!list) return;
        if (!this._items.length) {
            list.innerHTML = '<div class="py-10 text-center text-[11px] text-gray-500 font-mono">No recent system notifications</div>';
            return;
        }
        const esc = window.escapeAetherHtml || ((s) => String(s));
        list.innerHTML = this._items.map(item => `
            <div class="notification-item p-3 space-y-1">
                <div class="flex items-center justify-between text-[9px] font-mono">
                    <span class="text-cyan-400 font-bold uppercase tracking-wider">${esc(item.title)}</span>
                    <span class="text-gray-500">${esc(item.time)}</span>
                </div>
                <div class="text-[11px] text-gray-200 leading-snug break-words">${esc(item.message)}</div>
            </div>
        `).join('');
    },
    clear() {
        this._items = [];
        this._unread = 0;
        this._updateDot();
        this.render();
    },
    toggle() {
        const el = document.getElementById('notification-center');
        if (!el || !window.os) return;
        const isOpen = el.style.display === 'block';
        os.closeTopBarMenus();
        if (!isOpen) {
            this._unread = 0;
            this._updateDot();
            this.render();
            el.style.display = 'block';
            if (window.lucide) lucide.createIcons({ root: el });
            if (window.gsap) {
                gsap.fromTo(el, { opacity: 0, scale: 0.94, y: -8 }, { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: 'power2.out' });
            }
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    const dock = document.getElementById('dock');
    if (dock) dock.classList.add('reactive-dock');

    // Event-delegated cursor hover grow for dynamic .hover-target nodes
    const _ring = document.getElementById('cursor-ring');
    if (_ring) {
        document.body.addEventListener('mouseenter', (e) => {
            const target = e.target && e.target.closest && e.target.closest('.hover-target');
            if (target) _ring.classList.add('cursor-hover-grow');
        }, true);
        document.body.addEventListener('mouseleave', (e) => {
            const target = e.target && e.target.closest && e.target.closest('.hover-target');
            if (target) _ring.classList.remove('cursor-hover-grow');
        }, true);
    }

    // Outside-click dismissal for topbar menus, Notification Center, and Dock context menu
    document.addEventListener('mousedown', (e) => {
        const t = e.target;
        if (!t) return;
        const inMenu = t.closest && (
            t.closest('#aether-menu-dropdown') ||
            t.closest('#control-center-panel') ||
            t.closest('#notification-center') ||
            t.closest('#system-bar')
        );
        if (!inMenu && window.os && os.closeTopBarMenus) {
            os.closeTopBarMenus();
        }
        const ctxMenu = document.getElementById('dock-context-menu');
        if (ctxMenu && ctxMenu.style.display === 'block' && !(t.closest && t.closest('#dock-context-menu'))) {
            ctxMenu.style.display = 'none';
        }
    }, { passive: true });

    // Global Escape key dismissal for menus, popovers, Finder, and Command Palette
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (window.os && os.closeTopBarMenus) os.closeTopBarMenus();
        const ctxMenu = document.getElementById('dock-context-menu');
        if (ctxMenu) ctxMenu.style.display = 'none';
        const finder = document.getElementById('finder-overlay');
        if (finder && finder.classList.contains('finder-open') && window.os && os.toggleFinder) {
            os.toggleFinder();
        }
        if (window.CommandPalette && window.CommandPalette.isOpen) {
            window.CommandPalette.close();
        }
        if (window.os && os.toggleMobileUtilityPanel) {
            os.toggleMobileUtilityPanel(false);
        }
    });
});
