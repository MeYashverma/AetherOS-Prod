// AetherOS — Core Event Bus, Lifecycle, Notifications, RenderScheduler & Namespace Helpers
window.escapeAetherHtml = function(val) {
    return String(val ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));
};

window.os = window.os || {};
window.extendOS = function extendOS(defs) {
    Object.defineProperties(window.os, Object.getOwnPropertyDescriptors(defs));
    return window.os;
};

const SignalCore = window.SignalCore = {
    events: {},
    on(event, cb){
        if(!this.events[event]) this.events[event] = [];
        this.events[event].push(cb);
    },
    emit(event, data={}){
        (this.events[event] || []).forEach(cb => {
            try { cb(data); } catch(e){ console.error(e); }
        });
    }
};

const ModuleLifecycle = window.ModuleLifecycle = {
    suspended: new Set(),
    suspend(id){ this.suspended.add(id); SignalCore.emit('MODULE_SUSPEND',{id}); },
    resume(id){ this.suspended.delete(id); SignalCore.emit('MODULE_RESUME',{id}); },
    isSuspended(id){ return this.suspended.has(id); }
};

const Notifications = window.Notifications = {
    _ensureStack() {
        let stack = document.getElementById('aether-toast-stack');
        if (!stack) {
            stack = document.createElement('div');
            stack.id = 'aether-toast-stack';
            stack.setAttribute('aria-live', 'polite');
            stack.style.cssText = 'position:fixed;right:16px;bottom:92px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;max-width:calc(100vw - 32px);';
            document.body.appendChild(stack);
        }
        return stack;
    },
    push(title, message) {
        const safeTitle = window.escapeAetherHtml(title || 'System');
        const safeMsg = window.escapeAetherHtml(message || '');
        if (window.NotificationCenter && typeof window.NotificationCenter._record === 'function') {
            window.NotificationCenter._record(String(title || 'System'), String(message || ''));
        }
        const stack = this._ensureStack();
        while (stack.children.length >= 4) {
            stack.firstElementChild.remove();
        }
        const el = document.createElement('div');
        el.style.cssText = `
            position:relative;
            background:rgba(12,12,16,0.94);
            border:0.5px solid rgba(255,255,255,0.16);
            border-radius:14px; padding:12px 14px;
            backdrop-filter:blur(var(--lg-blur, 20px)) saturate(150%);
            -webkit-backdrop-filter:blur(var(--lg-blur, 20px)) saturate(150%);
            box-shadow: 0 0 0 0.5px rgba(255,255,255,0.05), 0 10px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.16);
            min-width:250px; max-width:320px;
            pointer-events:auto; cursor:none;
        `;
        el.innerHTML = `
            <div style="display:flex;align-items:flex-start;gap:10px">
                <div style="width:30px;height:30px;border-radius:8px;background:rgba(255,255,255,0.08);border:0.5px solid rgba(255,255,255,0.14);flex-shrink:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.88)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5L21 20.5H16.9L14.9 16.2H9.1L7.1 20.5H3L12 2.5ZM12 8.2L10.3 12.6H13.7L12 8.2Z"/></svg>
                </div>
                <div style="flex:1;min-width:0">
                    <div style="font:600 11.5px 'Inter',sans-serif;color:rgba(255,255,255,0.94);letter-spacing:-0.01em;margin-bottom:2px">${safeTitle}</div>
                    <div style="font:400 11px/1.4 'Inter',sans-serif;color:rgba(255,255,255,0.62);word-break:break-word">${safeMsg}</div>
                </div>
            </div>
        `;
        el.onclick = () => el.remove();
        stack.appendChild(el);
        try {
            if (window.os && typeof window.os.speakSystemNotification === 'function') {
                window.os.speakSystemNotification(title, message);
            }
        } catch(_) {}

        if (window.gsap) {
            gsap.fromTo(el, { y: 12, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.26, ease: 'power2.out' });
            setTimeout(() => {
                if (!el.isConnected) return;
                gsap.to(el, { opacity: 0, y: 6, scale: 0.97, duration: 0.2, ease: 'power2.in', onComplete: () => el.remove() });
            }, 3600);
        } else {
            setTimeout(() => el.remove(), 3600);
        }
    }
};

const GlobalSearchIndex = window.GlobalSearchIndex = {
    entries: [],
    add(type,label,payload){
        this.entries.push({type,label,payload});
    },
    search(query){
        query = query.toLowerCase();
        return this.entries.filter(e=>e.label.toLowerCase().includes(query));
    }
};

const RenderScheduler = window.RenderScheduler = {
    tasks: new Set(),
    _lastTick: 0,
    _fps: 30,
    _running: false,
    add(fn) {
        this.tasks.add(fn);
        if (!this._running) this.start();
    },
    remove(fn) { this.tasks.delete(fn); },
    start() {
        if (this._running || this.tasks.size === 0) return;
        this._running = true;
        const interval = 1000 / this._fps;
        const loop = (now) => {
            if (this.tasks.size === 0) {
                this._running = false;
                return;
            }
            requestAnimationFrame(loop);
            if (document.hidden) return;
            if (now - this._lastTick < interval) return;
            this._lastTick = now;
            this.tasks.forEach(fn => { try { fn(); } catch(e) {} });
        };
        requestAnimationFrame(loop);
    }
};

const WindowContents = window.WindowContents = {};
