// AetherOS — WikiBoard Infinite Research Canvas & Graph Minimap Engine
class WikiBoardEngine {
            constructor() {
                this.viewport = null;
                this.canvasLayer = null;
                this.svgLayer = null;
                this.minimapCanvas = null;
                this.minimapCtx = null;
                this.cards = new Map();
                this.connections = [];
                this.nextId = 1;
                this.pan = { x: 0, y: 0 };
                this.zoom = 1;
                this.isPanning = false;
                this.panStartMouse = { x: 0, y: 0 };
                this.panStartOffset = { x: 0, y: 0 };
                this.isDragging = false;
                this.dragCardId = null;
                this.dragStartMouse = { x: 0, y: 0 };
                this.dragStartPos = { x: 0, y: 0 };
                this.isResizing = false;
                this.resizeCardId = null;
                this.resizeStart = { mx: 0, my: 0, w: 0, h: 0 };
                this._bound = {};
                this._childCounters = {};
                this._minimapDragging = false;
                this.selectedCardId = null;
            }

            init() {
                this.viewport = document.getElementById('wb-viewport');
                this.canvasLayer = document.getElementById('wb-canvas-layer');
                this.svgLayer = document.getElementById('wb-svg-connections');
                this.minimapCanvas = document.getElementById('wb-minimap-canvas');
                if (this.minimapCanvas) this.minimapCtx = this.minimapCanvas.getContext('2d');
                if (!this.viewport || !this.canvasLayer) return;
                this.setupEventListeners();
                this.updateTransform();
                os.logTerminal('WikiBoard: Infinite canvas engine initialized.');
            }

            destroy() {
                Object.values(this._bound).forEach(fn => {
                    this.viewport && this.viewport.removeEventListener('mousedown', fn);
                    this.viewport && this.viewport.removeEventListener('dblclick', fn);
                    document.removeEventListener('mousemove', fn);
                    document.removeEventListener('mouseup', fn);
                    document.removeEventListener('keydown', fn);
                });
                if (this.viewport) this.viewport.removeEventListener('wheel', this._bound.wheel);
                if (this._minimapRaf) cancelAnimationFrame(this._minimapRaf);
                this.cards.clear();
                this.connections = [];
            }

            // Returns true if the element (or any ancestor up to the card boundary)
            // is a scrollable content container that still has scroll room in the wheel direction
            _isScrollableContent(target, deltaY) {
                let el = target;
                while (el && !el.classList.contains('wb-card') && el !== this.viewport) {
                    const style = getComputedStyle(el);
                    const overflowY = style.overflowY;
                    const isScrollable = (overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 1;
                    if (isScrollable) {
                        const atTop = el.scrollTop <= 0;
                        const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
                        if (deltaY < 0 && !atTop) return true;   // scrolling up, not at top
                        if (deltaY > 0 && !atBottom) return true; // scrolling down, not at bottom
                        return false; // at boundary — let canvas take over
                    }
                    el = el.parentElement;
                }
                return false;
            }

            setupEventListeners() {
                this._bound.mousedown = (e) => this.onMouseDown(e);
                this._bound.mousemove = (e) => this.onMouseMove(e);
                this._bound.mouseup = (e) => this.onMouseUp(e);
                this._bound.wheel = (e) => this.onWheel(e);
                this._bound.dblclick = (e) => this.onDblClick(e);
                
                this.viewport.addEventListener('mousedown', this._bound.mousedown);
                document.addEventListener('mousemove', this._bound.mousemove);
                document.addEventListener('mouseup', this._bound.mouseup);
                this.viewport.addEventListener('wheel', this._bound.wheel, { passive: false });
                this.viewport.addEventListener('dblclick', this._bound.dblclick);

                // Keyboard Shortcuts
                this._bound.keydown = (e) => {
                    const root = document.getElementById('wikiboard-root');
                    if (!root || root.offsetParent === null) return;
                    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

                    if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedCardId) {
                        e.preventDefault();
                        this.removeCard(this.selectedCardId);
                        this.selectedCardId = null;
                        this.setStatus('Deleted card via hotkey');
                    }
                    if (e.key === '+') { e.preventDefault(); this.zoomIn(); }
                    if (e.key === '-') { e.preventDefault(); this.zoomOut(); }
                    if (e.key === '0') { e.preventDefault(); this.resetView(); }
                };
                document.addEventListener('keydown', this._bound.keydown);

                // Minimap interaction
                const mm = document.getElementById('wb-minimap');
                if (mm) {
                    mm.addEventListener('mousedown', (e) => this._minimapMouseDown(e));
                    document.addEventListener('mousemove', (e) => this._minimapMouseMove(e));
                    document.addEventListener('mouseup', () => { this._minimapDragging = false; });
                }

                // Start minimap animation loop
                this._scheduleMinimap();
            }

            onDblClick(e) {
                if (e.target.closest('.wb-card') || e.target.closest('.wb-toolbar') || e.target.closest('.wb-status-bar') || e.target.closest('#wb-minimap')) return;
                const c = this.screenToCanvas(e.clientX, e.clientY);
                this.createCard({ type: 'text', x: c.x - 150, y: c.y - 100, width: 300, height: 200, title: 'Note' });
                this.setStatus('Created text card via double click');
            }

            _scheduleMinimap() {
                const loop = () => {
                    this._drawMinimap();
                    this._minimapRaf = requestAnimationFrame(loop);
                };
                this._minimapRaf = requestAnimationFrame(loop);
            }

            onMouseDown(e) {
                if (e.target.closest('.wb-toolbar') || e.target.closest('.wb-status-bar') || e.target.closest('#wb-minimap')) return;
                const control = e.target.closest('button:not(.wb-card-controls button), input, textarea, select, a');
                if (control && !e.target.closest('.wb-card-header')) return;
                const resizer = e.target.closest('.wb-card-resizer');
                const header = e.target.closest('.wb-card-header');
                const card = e.target.closest('.wb-card');

                if (card) {
                    this.selectedCardId = card.dataset.id;
                    document.querySelectorAll('.wb-card').forEach(el => el.classList.remove('wb-card-selected'));
                    card.classList.add('wb-card-selected');
                } else {
                    this.selectedCardId = null;
                    document.querySelectorAll('.wb-card').forEach(el => el.classList.remove('wb-card-selected'));
                }

                if (resizer && card) {
                    const cid = card.dataset.id;
                    const cd = this.cards.get(cid);
                    if (!cd) return;
                    this.isResizing = true;
                    this.resizeCardId = cid;
                    this.resizeStart = { mx: e.clientX, my: e.clientY, w: cd.width, h: cd.height };
                    e.preventDefault(); return;
                }
                if (header && card) {
                    const cid = card.dataset.id;
                    const cd = this.cards.get(cid);
                    if (!cd) return;
                    this.isDragging = true;
                    this.dragCardId = cid;
                    this.dragStartMouse = { x: e.clientX, y: e.clientY };
                    this.dragStartPos = { x: cd.x, y: cd.y };
                    card.style.zIndex = 9000;
                    e.preventDefault(); return;
                }
                if (!card) {
                    this.isPanning = true;
                    this.panStartMouse = { x: e.clientX, y: e.clientY };
                    this.panStartOffset = { x: this.pan.x, y: this.pan.y };
                    this.viewport.style.cursor = 'grabbing';
                    e.preventDefault();
                }
            }

            onMouseMove(e) {
                if (this.isPanning) {
                    this.pan.x = this.panStartOffset.x + (e.clientX - this.panStartMouse.x);
                    this.pan.y = this.panStartOffset.y + (e.clientY - this.panStartMouse.y);
                    this.updateTransform();
                    this.renderConnections();
                }
                if (this.isDragging && this.dragCardId) {
                    const cd = this.cards.get(this.dragCardId);
                    if (!cd) return;
                    cd.x = this.dragStartPos.x + (e.clientX - this.dragStartMouse.x) / this.zoom;
                    cd.y = this.dragStartPos.y + (e.clientY - this.dragStartMouse.y) / this.zoom;
                    const el = document.getElementById('wb-card-' + this.dragCardId);
                    if (el) { el.style.left = cd.x + 'px'; el.style.top = cd.y + 'px'; }
                    this.renderConnections();
                }
                if (this.isResizing && this.resizeCardId) {
                    const cd = this.cards.get(this.resizeCardId);
                    if (!cd) return;
                    cd.width = Math.max(250, this.resizeStart.w + (e.clientX - this.resizeStart.mx) / this.zoom);
                    cd.height = Math.max(150, this.resizeStart.h + (e.clientY - this.resizeStart.my) / this.zoom);
                    const el = document.getElementById('wb-card-' + this.resizeCardId);
                    if (el) { el.style.width = cd.width + 'px'; el.style.height = cd.height + 'px'; }
                    this.renderConnections();
                }
            }

            onMouseUp(e) {
                if (this.isPanning) { this.isPanning = false; this.viewport.style.cursor = 'crosshair'; this._saveDebounced(); }
                if (this.isDragging && this.dragCardId) {
                    const el = document.getElementById('wb-card-' + this.dragCardId);
                    if (el) el.style.zIndex = '';
                    this.isDragging = false; this.dragCardId = null;
                    this._saveDebounced();
                }
                if (this.isResizing) { this.isResizing = false; this.resizeCardId = null; this._saveDebounced(); }
            }

            onWheel(e) {
                // If the pointer is over a scrollable card content area, let it scroll natively
                if (this._isScrollableContent(e.target, e.deltaY)) return;

                e.preventDefault();
                const factor = e.deltaY > 0 ? 0.92 : 1.08;
                const newZoom = Math.max(0.12, Math.min(3.5, this.zoom * factor));
                const rect = this.viewport.getBoundingClientRect();
                const mx = e.clientX - rect.left, my = e.clientY - rect.top;
                const s = newZoom / this.zoom;
                this.pan.x = mx - s * (mx - this.pan.x);
                this.pan.y = my - s * (my - this.pan.y);
                this.zoom = newZoom;
                this.updateTransform();
                this.renderConnections();
                this.updateZoomDisplay();
                this._saveDebounced();
            }

            updateTransform() {
                if (this.canvasLayer) {
                    this.canvasLayer.style.transform = 'translate(' + this.pan.x + 'px,' + this.pan.y + 'px) scale(' + this.zoom + ')';
                }
                if (this.viewport) {
                    const gs = 40 * this.zoom;
                    this.viewport.style.backgroundSize = gs + 'px ' + gs + 'px';
                    this.viewport.style.backgroundPosition = this.pan.x + 'px ' + this.pan.y + 'px';
                }
            }

            updateZoomDisplay() {
                const el = document.getElementById('wb-zoom-display');
                if (el) el.textContent = Math.round(this.zoom * 100) + '%';
            }

            screenToCanvas(sx, sy) {
                const r = this.viewport.getBoundingClientRect();
                return { x: (sx - r.left - this.pan.x) / this.zoom, y: (sy - r.top - this.pan.y) / this.zoom };
            }

            // ── MINIMAP ──────────────────────────────────────────────────────

            _getCanvasBounds() {
                if (this.cards.size === 0) return { minX: -200, minY: -200, maxX: 600, maxY: 400 };
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                this.cards.forEach(cd => {
                    minX = Math.min(minX, cd.x - 40);
                    minY = Math.min(minY, cd.y - 40);
                    maxX = Math.max(maxX, cd.x + cd.width + 40);
                    maxY = Math.max(maxY, cd.y + cd.height + 40);
                });
                // Also include the current viewport area
                const vr = this.viewport ? this.viewport.getBoundingClientRect() : { width: 800, height: 600 };
                const vpLeft = -this.pan.x / this.zoom;
                const vpTop = -this.pan.y / this.zoom;
                const vpRight = vpLeft + vr.width / this.zoom;
                const vpBottom = vpTop + vr.height / this.zoom;
                minX = Math.min(minX, vpLeft - 80);
                minY = Math.min(minY, vpTop - 80);
                maxX = Math.max(maxX, vpRight + 80);
                maxY = Math.max(maxY, vpBottom + 80);
                return { minX, minY, maxX, maxY };
            }

            _drawMinimap() {
                const ctx = this.minimapCtx;
                const mc = this.minimapCanvas;
                if (!ctx || !mc || !this.viewport) return;

                const W = mc.offsetWidth || 160;
                const H = mc.offsetHeight || 110;
                if (mc.width !== W * 2 || mc.height !== H * 2) {
                    mc.width = W * 2; mc.height = H * 2;
                    ctx.scale(2, 2); // hi-dpi
                }

                ctx.clearRect(0, 0, W, H);
                ctx.fillStyle = 'rgba(3,3,5,0.0)';
                ctx.fillRect(0, 0, W, H);

                const bounds = this._getCanvasBounds();
                const bw = bounds.maxX - bounds.minX;
                const bh = bounds.maxY - bounds.minY;
                const scale = Math.min(W / bw, H / bh);
                const offX = (W - bw * scale) / 2;
                const offY = (H - bh * scale) / 2;

                const toMM = (cx, cy) => ({
                    x: offX + (cx - bounds.minX) * scale,
                    y: offY + (cy - bounds.minY) * scale
                });

                // Draw connections
                ctx.strokeStyle = 'rgba(107,181,255,0.2)';
                ctx.lineWidth = 0.8;
                this.connections.forEach(conn => {
                    const fc = this.cards.get(conn.from), tc = this.cards.get(conn.to);
                    if (!fc || !tc) return;
                    const fp = toMM(fc.x + fc.width / 2, fc.y + fc.height / 2);
                    const tp = toMM(tc.x + tc.width / 2, tc.y + tc.height / 2);
                    ctx.beginPath();
                    ctx.moveTo(fp.x, fp.y);
                    ctx.lineTo(tp.x, tp.y);
                    ctx.stroke();
                });

                // Draw cards
                this.cards.forEach(cd => {
                    const p = toMM(cd.x, cd.y);
                    const w = cd.width * scale;
                    const h = (cd.minimized ? 34 : cd.height) * scale;
                    ctx.fillStyle = 'rgba(30,30,40,0.85)';
                    ctx.strokeStyle = 'rgba(107,181,255,0.35)';
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.roundRect(p.x, p.y, w, h, 2);
                    ctx.fill();
                    ctx.stroke();
                    // Header strip
                    ctx.fillStyle = 'rgba(107,181,255,0.12)';
                    ctx.beginPath();
                    ctx.roundRect(p.x, p.y, w, Math.min(6, h), 2);
                    ctx.fill();
                });

                // Draw viewport rect
                const vr = this.viewport.getBoundingClientRect();
                const vpX = -this.pan.x / this.zoom;
                const vpY = -this.pan.y / this.zoom;
                const vpW = vr.width / this.zoom;
                const vpH = vr.height / this.zoom;
                const vp = toMM(vpX, vpY);
                ctx.strokeStyle = 'rgba(255,220,100,0.7)';
                ctx.lineWidth = 1.2;
                ctx.fillStyle = 'rgba(255,220,100,0.04)';
                ctx.beginPath();
                ctx.rect(vp.x, vp.y, vpW * scale, vpH * scale);
                ctx.fill();
                ctx.stroke();

                // Store minimap transform for click-to-navigate
                this._mmScale = scale;
                this._mmOffX = offX;
                this._mmOffY = offY;
                this._mmBounds = bounds;
            }

            _minimapNavigateTo(e) {
                if (!this._mmScale || !this.viewport) return;
                const mm = document.getElementById('wb-minimap');
                const r = mm.getBoundingClientRect();
                const mx = e.clientX - r.left;
                const my = e.clientY - r.top;
                // Convert minimap pixel → canvas coords
                const cx = this._mmBounds.minX + (mx - this._mmOffX) / this._mmScale;
                const cy = this._mmBounds.minY + (my - this._mmOffY) / this._mmScale;
                // Center viewport on that canvas point
                const vr = this.viewport.getBoundingClientRect();
                this.pan.x = vr.width / 2 - cx * this.zoom;
                this.pan.y = vr.height / 2 - cy * this.zoom;
                this.updateTransform();
                this.renderConnections();
            }

            _minimapMouseDown(e) {
                e.preventDefault(); e.stopPropagation();
                this._minimapDragging = true;
                this._minimapNavigateTo(e);
            }

            _minimapMouseMove(e) {
                if (!this._minimapDragging) return;
                this._minimapNavigateTo(e);
            }

            // ── END MINIMAP ──────────────────────────────────────────────────

            createCard(opts) {
                const id = 'wb' + (this.nextId++);
                const card_type = opts.type || 'wiki';
                if (window.os && window.os.companion && window.os.companion.observeEvent) {
                    window.os.companion.observeEvent('wikiboard_create_card', { type: card_type, title: opts.title || 'Untitled' });
                }
                const card = {
                    id, type: opts.type || 'wiki',
                    x: opts.x || 100, y: opts.y || 100,
                    width: opts.width || 480, height: opts.height || 500,
                    title: opts.title || 'Untitled',
                    data: opts.data || {},
                    parentId: opts.parentId || null,
                    minimized: false
                };
                this.cards.set(id, card);

                const el = document.createElement('div');
                el.id = 'wb-card-' + id;
                el.className = 'wb-card';
                el.dataset.id = id;
                el.style.cssText = 'left:' + card.x + 'px;top:' + card.y + 'px;width:' + card.width + 'px;height:' + card.height + 'px;';

                let icon = '&#x1F4C4;', contentHTML = '';
                if (card.type === 'wiki') {
                    icon = '&#x1F4D6;';
                    contentHTML = '<div class="wb-card-content wb-wiki-content" id="wb-c-' + id + '"><div class="wb-loading-spinner"></div></div>';
                } else if (card.type === 'text') {
                    icon = '&#x1F4DD;';
                    contentHTML = '<div class="wb-card-content"><textarea class="wb-textarea" placeholder="Type your notes here...">' + ((opts.data && opts.data.text) ? opts.data.text.replace(/</g,'&lt;') : '') + '</textarea></div>';
                } else if (card.type === 'image') {
                    icon = '&#x1F5BC;';
                    contentHTML = '<div class="wb-card-content wb-image-content"><img src="' + (opts.data.url||'') + '" alt="' + card.title.replace(/"/g,'&quot;') + '"></div>';
                } else if (card.type === 'youtube') {
                    icon = '&#x25B6;';
                    contentHTML = '<div class="wb-card-content wb-youtube-content"><iframe src="' + (opts.data.embedUrl||'') + '" frameborder="0" allow="autoplay;encrypted-media" allowfullscreen sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe></div>';
                } else if (card.type === 'url') {
                    icon = '&#x1F517;';
                    contentHTML = '<div class="wb-card-content wb-wiki-content" id="wb-c-' + id + '"><div class="wb-loading-spinner"></div></div>';
                } else if (card.type === 'pdf') {
                    icon = '&#x1F4CB;';
                    contentHTML = '<div class="wb-card-content wb-pdf-content"><iframe src="' + (opts.data.url||'') + '" frameborder="0" sandbox="allow-scripts allow-same-origin"></iframe></div>';
                }

                let extraControl = '';
                if (card.type === 'text') {
                    extraControl = '<button class="wb-btn-push" title="Push to Memory Scratchpad">💾</button>';
                }

                el.innerHTML = '<div class="wb-card-header"><span class="wb-card-icon">' + icon + '</span><span class="wb-card-title">' + card.title.replace(/</g,'&lt;') + '</span><div class="wb-card-controls">' + extraControl + '<button class="wb-btn-minimize" title="Minimize">&#x2500;</button><button class="wb-btn-close" title="Close">&#x2715;</button></div></div>' + contentHTML + '<div class="wb-card-resizer"></div>';

                this.canvasLayer.appendChild(el);

                el.querySelector('.wb-btn-close').addEventListener('click', (ev) => { ev.stopPropagation(); this.removeCard(id); });
                el.querySelector('.wb-btn-minimize').addEventListener('click', (ev) => { ev.stopPropagation(); this.toggleMinimize(id); });
                el.querySelector('.wb-card-header').addEventListener('dblclick', (ev) => { ev.stopPropagation(); this.toggleMinimize(id); });

                const pushBtn = el.querySelector('.wb-btn-push');
                if (pushBtn) {
                    pushBtn.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        this.pushToScratchpad(id);
                    });
                }

                if (card.type === 'text') {
                    const ta = el.querySelector('.wb-textarea');
                    if (ta) ta.addEventListener('input', () => {
                        const c = this.cards.get(id);
                        if (c) { c.data = c.data || {}; c.data.text = ta.value; }
                        this._saveDebounced();
                    });
                }

                gsap.fromTo(el, { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.3)' });

                if (card.parentId) {
                    this.connections.push({ from: card.parentId, to: id });
                    this.renderConnections();
                }
                if (card.type === 'wiki') this.fetchWikiArticle(id, card.title);
                else if (card.type === 'url') this.fetchUrlPreview(id, opts.data.url);

                this.updateCardCount();
                this._saveDebounced();
                return id;
            }

            removeCard(id) {
                const card = this.cards.get(id);
                if (!card) return;
                this.connections = this.connections.filter(c => c.from !== id && c.to !== id);
                gsap.to(card.el || document.getElementById('wb-card-' + id), {
                    scale: 0.7, opacity: 0, duration: 0.2, ease: 'power2.in',
                    onComplete: () => {
                        const e = document.getElementById('wb-card-' + id);
                        if (e) e.remove();
                        this.cards.delete(id);
                        this.renderConnections();
                        this.updateCardCount();
                        this._saveDebounced();
                    }
                });
            }

            toggleMinimize(id) {
                const cd = this.cards.get(id);
                if (!cd) return;
                cd.minimized = !cd.minimized;
                const el = document.getElementById('wb-card-' + id);
                if (!el) return;
                if (cd.minimized) {
                    el.style.height = '34px';
                    const c = el.querySelector('.wb-card-content'); if (c) c.style.display = 'none';
                    const r = el.querySelector('.wb-card-resizer'); if (r) r.style.display = 'none';
                } else {
                    el.style.height = cd.height + 'px';
                    const c = el.querySelector('.wb-card-content'); if (c) c.style.display = '';
                    const r = el.querySelector('.wb-card-resizer'); if (r) r.style.display = '';
                }
                this.renderConnections();
                this._saveDebounced();
            }

            findSpawnPosition(parentId, idx) {
                const p = this.cards.get(parentId);
                if (!p) return { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 };
                const ox = p.width + 50 + (idx % 3) * 60;
                const oy = -40 + (idx * 70);
                return { x: p.x + ox, y: p.y + oy };
            }

            async fetchWikiArticle(cardId, title) {
                const cel = document.getElementById('wb-c-' + cardId);
                if (!cel) return;
                cel.innerHTML = '<div class="wb-loading-spinner"></div>';
                this.setStatus('Loading: ' + title);
                const encoded = title.replace(/ /g, '_');
                const proxies = [
                    'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://en.wikipedia.org/wiki/' + encodeURIComponent(encoded)),
                    'https://corsproxy.io/?' + encodeURIComponent('https://en.wikipedia.org/wiki/' + encodeURIComponent(encoded)),
                ];
                let html = null;
                for (const purl of proxies) {
                    try {
                        const r = await fetch(purl, { signal: AbortSignal.timeout(12000) });
                        if (r.ok) { html = await r.text(); break; }
                    } catch (e) { continue; }
                }
                if (html) {
                    this.renderWikiContent(cardId, html, title);
                    os.logTerminal('WikiBoard: Article "' + title + '" loaded.');
                    this.setStatus('Loaded: ' + title);
                } else {
                    try {
                        const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/html/' + encodeURIComponent(encoded), { signal: AbortSignal.timeout(10000) });
                        if (r.ok) { html = await r.text(); this.renderWikiRestContent(cardId, html, title); os.logTerminal('WikiBoard: Article "' + title + '" via REST.'); this.setStatus('Loaded: ' + title); return; }
                    } catch (e) {}
                    cel.innerHTML = '<div class="wb-error-state"><div>&#x26A0; Failed to load article</div><div style="font-size:9px;color:#555;margin-top:4px;">Network or CORS restriction</div><button class="wb-retry-btn" onclick="os.wikiboard.engine.fetchWikiArticle(\'' + cardId + '\',\'' + title.replace(/'/g, "\'") + '\')">Retry</button></div>';
                    this.setStatus('Error loading: ' + title);
                }
            }

            renderWikiContent(cardId, html, title) {
                const cel = document.getElementById('wb-c-' + cardId);
                if (!cel) return;
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const article = doc.querySelector('#mw-content-text .mw-parser-output') || doc.querySelector('#mw-content-text') || doc.querySelector('#content') || doc.querySelector('body');
                if (!article) { cel.innerHTML = '<div class="wb-error-state">No content found</div>'; return; }
                cel.innerHTML = '<div class="wb-wiki-article">' + article.innerHTML + '</div>';
                const base = document.createElement('base');
                base.href = 'https://en.wikipedia.org/';
                cel.prepend(base);
                this.interceptWikiLinks(cardId, cel);
            }

            renderWikiRestContent(cardId, html, title) {
                const cel = document.getElementById('wb-c-' + cardId);
                if (!cel) return;
                cel.innerHTML = '<base href="https://en.wikipedia.org/"><div class="wb-wiki-article">' + html + '</div>';
                this.interceptWikiLinks(cardId, cel);
            }

            interceptWikiLinks(cardId, container) {
                if (!this._childCounters[cardId]) this._childCounters[cardId] = 0;
                container.querySelectorAll('a').forEach(link => {
                    const href = link.getAttribute('href') || '';
                    
                    let isWiki = false;
                    let articleTitleRaw = '';
                    
                    // Standard relative path (e.g., '/wiki/Black_hole')
                    if (href.startsWith('/wiki/')) {
                        articleTitleRaw = href.replace('/wiki/', '');
                        isWiki = true;
                    } 
                    // Relative paths inside REST responses (e.g., './Black_hole')
                    else if (href.startsWith('./')) {
                        articleTitleRaw = href.replace(/^\.\//, '');
                        isWiki = true;
                    } 
                    // Absolute Wikipedia links (e.g., 'https://en.wikipedia.org/wiki/Black_hole')
                    else if (href.includes('wikipedia.org/wiki/')) {
                        articleTitleRaw = href.split('wikipedia.org/wiki/')[1] || '';
                        isWiki = true;
                    }

                    // Clean hash and query params
                    if (isWiki && articleTitleRaw) {
                        articleTitleRaw = articleTitleRaw.split('#')[0].split('?')[0].trim();
                    }

                    // Avoid namespace/help/file links which contain ':'
                    if (isWiki && articleTitleRaw.includes(':')) {
                        isWiki = false;
                    }

                    if (isWiki && articleTitleRaw) {
                        const articleTitle = decodeURIComponent(articleTitleRaw).replace(/_/g, ' ');
                        link.classList.add('wb-link-expandable');
                        link.title = 'Expand: ' + articleTitle;
                        
                        // Explicitly clear any existing targets that might force new tabs
                        link.removeAttribute('target');
                        
                        link.addEventListener('click', (e) => {
                            e.preventDefault(); 
                            e.stopPropagation();
                            const idx = this._childCounters[cardId] || 0;
                            this._childCounters[cardId] = idx + 1;
                            const pos = this.findSpawnPosition(cardId, idx);
                            this.createCard({ type: 'wiki', x: pos.x, y: pos.y, title: articleTitle, parentId: cardId });
                        });
                        return; // Successfully intercepted as Wikipedia link
                    }

                    // Skip media/image namespace links
                    if (href.includes('/wiki/') && (href.includes('File:') || href.includes('Image:'))) {
                        return;
                    }

                    // Standard external link handling
                    if (href.startsWith('http')) {
                        // Clear target to prevent it from bypassing our intercept
                        link.removeAttribute('target');
                        
                        link.addEventListener('click', (e) => {
                            e.preventDefault(); 
                            e.stopPropagation();
                            const idx = this._childCounters[cardId] || 0;
                            this._childCounters[cardId] = idx + 1;
                            const pos = this.findSpawnPosition(cardId, idx);
                            let host = href;
                            try { host = new URL(href).hostname.replace(/^www\./, ''); } catch(_) {}
                            this.createCard({ type: 'url', x: pos.x, y: pos.y, title: host, data: { url: href }, parentId: cardId });
                        });
                    }
                });
                container.querySelectorAll('img').forEach(img => {
                    if (img.width < 50 && img.height < 50) return;
                    img.style.cursor = 'pointer';
                    img.addEventListener('click', (e) => {
                        e.preventDefault(); e.stopPropagation();
                        const src = img.src;
                        if (!src || src.startsWith('data:')) return;
                        const idx = this._childCounters[cardId] || 0;
                        this._childCounters[cardId] = idx + 1;
                        const pos = this.findSpawnPosition(cardId, idx);
                        this.createCard({ type: 'image', x: pos.x, y: pos.y, width: 340, height: 300, title: img.alt || 'Image', data: { url: src }, parentId: cardId });
                    });
                });
            }

            async fetchUrlPreview(cardId, url) {
                const cel = document.getElementById('wb-c-' + cardId);
                if (!cel) return;
                cel.innerHTML = '<div class="wb-loading-spinner"></div>';
                try {
                    const r = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(url), { signal: AbortSignal.timeout(10000) });
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    const html = await r.text();
                    const doc = new DOMParser().parseFromString(html, 'text/html');
                    const body = doc.querySelector('article, main, [role="main"], body');
                    const paras = Array.from(body ? body.querySelectorAll('p,h1,h2,h3') : []).map(el => el.textContent.trim()).filter(t => t.length > 20).slice(0, 20);
                    const ogImg = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
                    let out = '<div class="wb-wiki-article">';
                    if (ogImg) out += '<img src="' + ogImg + '" style="max-height:120px;object-fit:cover;width:100%;border-radius:6px;margin-bottom:8px;" onerror="this.style.display=&apos;none&apos;">';
                    paras.forEach(t => { out += '<p style="font-size:12px;">' + t + '</p>'; });
                    out += '<p style="margin-top:8px;"><a href="' + url + '" target="_blank" style="color:#6bb5ff;">Open full page &#x2197;</a></p></div>';
                    cel.innerHTML = out;
                } catch (e) {
                    cel.innerHTML = '<div class="wb-error-state"><div>Preview unavailable</div><a href="' + url + '" target="_blank" style="color:#6bb5ff;margin-top:8px;display:inline-block;">Open URL &#x2197;</a></div>';
                }
            }

            addConnection(fromId, toId) {
                if (!this.connections.some(c => c.from === fromId && c.to === toId)) {
                    this.connections.push({ from: fromId, to: toId });
                    this.renderConnections();
                }
            }

            renderConnections() {
                if (!this.svgLayer) return;
                this.svgLayer.innerHTML = '';
                this.connections.forEach(conn => {
                    const fc = this.cards.get(conn.from), tc = this.cards.get(conn.to);
                    if (!fc || !tc) return;
                    const fh = fc.minimized ? 34 : fc.height, th = tc.minimized ? 34 : tc.height;
                    const fp = this.getEdgePoint(fc, fc.x + fc.width / 2, fc.y + fh / 2, tc.x + tc.width / 2, tc.y + th / 2);
                    const tp = this.getEdgePoint(tc, tc.x + tc.width / 2, tc.y + th / 2, fc.x + fc.width / 2, fc.y + fh / 2);
                    const dx = tp.x - fp.x, dy = tp.y - fp.y;
                    const cx1 = fp.x + dx * 0.4, cy1 = fp.y;
                    const cx2 = tp.x - dx * 0.4, cy2 = tp.y;
                    const d = 'M ' + fp.x + ' ' + fp.y + ' C ' + cx1 + ' ' + cy1 + ', ' + cx2 + ' ' + cy2 + ', ' + tp.x + ' ' + tp.y;
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    path.setAttribute('d', d);
                    path.setAttribute('class', 'wb-connection-line');
                    this.svgLayer.appendChild(path);
                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.setAttribute('r', '3');
                    circle.setAttribute('fill', 'rgba(107,181,255,0.6)');
                    const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
                    anim.setAttribute('dur', '4s');
                    anim.setAttribute('repeatCount', 'indefinite');
                    anim.setAttribute('path', d);
                    circle.appendChild(anim);
                    this.svgLayer.appendChild(circle);
                });
            }

            getEdgePoint(card, cx, cy, tx, ty) {
                const hw = card.width / 2, hh = (card.minimized ? 34 : card.height) / 2;
                const dx = tx - cx, dy = ty - cy;
                if (dx === 0 && dy === 0) return { x: cx, y: cy };
                const adx = Math.abs(dx), ady = Math.abs(dy);
                const s = (adx * hh > ady * hw) ? hw / Math.max(adx, 0.001) : hh / Math.max(ady, 0.001);
                return { x: cx + dx * s, y: cy + dy * s };
            }

            updateCardCount() {
                const el = document.getElementById('wb-card-count');
                if (el) el.textContent = this.cards.size + ' cards';
            }

            setStatus(msg) {
                const el = document.getElementById('wb-status-msg');
                if (el) el.textContent = msg;
            }

            searchAndSpawn(query) {
                if (!query || !query.trim()) return;
                const title = query.trim();
                const r = this.viewport.getBoundingClientRect();
                const c = this.screenToCanvas(r.left + r.width / 2, r.top + r.height / 2);
                this.createCard({ type: 'wiki', x: c.x - 240, y: c.y - 250, title });
            }

            addTextNote() {
                const r = this.viewport.getBoundingClientRect();
                const c = this.screenToCanvas(r.left + r.width / 2, r.top + r.height / 2);
                this.createCard({ type: 'text', x: c.x - 150, y: c.y - 100, width: 300, height: 200, title: 'Note' });
            }

            async addUrlCard() {
                const url = prompt('Enter URL to preview:');
                if (!url) return;
                const r = this.viewport.getBoundingClientRect();
                const c = this.screenToCanvas(r.left + r.width / 2, r.top + r.height / 2);
                let host = url;
                try { host = new URL(url).hostname; } catch (e) {}
                this.createCard({ type: 'url', x: c.x - 240, y: c.y - 200, title: host, data: { url } });
            }

            addYoutubeCard() {
                const url = prompt('Enter YouTube URL or video ID:');
                if (!url) return;
                let vid = url;
                try { const u = new URL(url); vid = u.searchParams.get('v') || u.pathname.split('/').pop(); } catch (e) {}
                const r = this.viewport.getBoundingClientRect();
                const c = this.screenToCanvas(r.left + r.width / 2, r.top + r.height / 2);
                this.createCard({ type: 'youtube', x: c.x - 240, y: c.y - 180, width: 480, height: 360, title: 'YouTube: ' + vid, data: { embedUrl: 'https://www.youtube.com/embed/' + vid } });
            }

            addImageFromUrl() {
                const url = prompt('Enter image URL:');
                if (!url) return;
                const r = this.viewport.getBoundingClientRect();
                const c = this.screenToCanvas(r.left + r.width / 2, r.top + r.height / 2);
                this.createCard({ type: 'image', x: c.x - 160, y: c.y - 140, width: 340, height: 300, title: 'Image', data: { url } });
            }

            // ── PERSISTENCE ─────────────────────────────────────────────────

            _saveDebounced() {
                clearTimeout(this._saveTimer);
                this._saveTimer = setTimeout(() => this.saveState(), 800);
            }

            saveState() {
                try {
                    const ind = document.getElementById('wb-save-indicator');
                    if (ind) { ind.style.opacity = '1'; setTimeout(() => { ind.style.opacity = '0'; }, 1500); }
                    const data = {
                        v: 2,
                        pan: this.pan,
                        zoom: this.zoom,
                        nextId: this.nextId,
                        connections: this.connections,
                        cards: []
                    };
                    this.cards.forEach(cd => {
                        data.cards.push({
                            id: cd.id, type: cd.type,
                            x: cd.x, y: cd.y,
                            width: cd.width, height: cd.height,
                            title: cd.title, data: cd.data,
                            parentId: cd.parentId, minimized: cd.minimized
                        });
                    });
                    localStorage.setItem('AetherOS_WikiBoard', JSON.stringify(data));
                } catch(e) { console.warn('WikiBoard save failed', e); }
            }

            loadState() {
                try {
                    const raw = localStorage.getItem('AetherOS_WikiBoard');
                    if (!raw) return;
                    const data = JSON.parse(raw);
                    if (!data || !Array.isArray(data.cards)) return;

                    // Restore viewport
                    if (data.pan) this.pan = data.pan;
                    if (data.zoom) this.zoom = data.zoom;
                    if (data.nextId) this.nextId = data.nextId;
                    this.updateTransform();
                    this.updateZoomDisplay();

                    // Restore connections list (cards will be re-created with same ids)
                    this.connections = data.connections || [];

                    // Re-create each card without triggering fetch (we restore content from cache)
                    data.cards.forEach(cd => {
                        // createCard assigns a new id — we need to force the saved id
                        // so connections remain valid. We do this by temporarily overriding nextId.
                        this._restoreCard(cd);
                    });

                    this.renderConnections();
                    this.updateCardCount();
                    this.setStatus('Board restored (' + data.cards.length + ' cards)');
                    os.logTerminal('WikiBoard: State restored — ' + data.cards.length + ' cards.');
                } catch(e) { console.warn('WikiBoard load failed', e); }
            }

            _restoreCard(cd) {
                // Re-create the DOM element with the exact saved id
                this.cards.set(cd.id, cd);

                const el = document.createElement('div');
                el.id = 'wb-card-' + cd.id;
                el.className = 'wb-card';
                el.dataset.id = cd.id;
                el.style.cssText = 'left:' + cd.x + 'px;top:' + cd.y + 'px;width:' + cd.width + 'px;height:' + cd.height + 'px;';

                let icon = '&#x1F4C4;', contentHTML = '';
                if (cd.type === 'wiki') {
                    icon = '&#x1F4D6;';
                    contentHTML = '<div class="wb-card-content wb-wiki-content" id="wb-c-' + cd.id + '"><div class="wb-loading-spinner"></div></div>';
                } else if (cd.type === 'text') {
                    icon = '&#x1F4DD;';
                    const savedText = (cd.data && cd.data.text) || '';
                    contentHTML = '<div class="wb-card-content"><textarea class="wb-textarea" placeholder="Type your notes here...">' + savedText.replace(/</g,'&lt;') + '</textarea></div>';
                } else if (cd.type === 'image') {
                    icon = '&#x1F5BC;';
                    contentHTML = '<div class="wb-card-content wb-image-content"><img src="' + (cd.data.url||'') + '" alt="' + cd.title.replace(/"/g,'&quot;') + '"></div>';
                } else if (cd.type === 'youtube') {
                    icon = '&#x25B6;';
                    contentHTML = '<div class="wb-card-content wb-youtube-content"><iframe src="' + (cd.data.embedUrl||'') + '" frameborder="0" allow="autoplay;encrypted-media" allowfullscreen sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe></div>';
                } else if (cd.type === 'url') {
                    icon = '&#x1F517;';
                    contentHTML = '<div class="wb-card-content wb-wiki-content" id="wb-c-' + cd.id + '"><div class="wb-loading-spinner"></div></div>';
                } else if (cd.type === 'pdf') {
                    icon = '&#x1F4CB;';
                    contentHTML = '<div class="wb-card-content wb-pdf-content"><iframe src="' + (cd.data.url||'') + '" frameborder="0" sandbox="allow-scripts allow-same-origin"></iframe></div>';
                }

                let extraControl = '';
                if (cd.type === 'text') {
                    extraControl = '<button class="wb-btn-push" title="Push to Memory Scratchpad">💾</button>';
                }

                el.innerHTML = '<div class="wb-card-header"><span class="wb-card-icon">' + icon + '</span><span class="wb-card-title">' + cd.title.replace(/</g,'&lt;') + '</span><div class="wb-card-controls">' + extraControl + '<button class="wb-btn-minimize" title="Minimize">&#x2500;</button><button class="wb-btn-close" title="Close">&#x2715;</button></div></div>' + contentHTML + '<div class="wb-card-resizer"></div>';

                this.canvasLayer.appendChild(el);

                el.querySelector('.wb-btn-close').addEventListener('click', (ev) => { ev.stopPropagation(); this.removeCard(cd.id); });
                el.querySelector('.wb-btn-minimize').addEventListener('click', (ev) => { ev.stopPropagation(); this.toggleMinimize(cd.id); });
                el.querySelector('.wb-card-header').addEventListener('dblclick', (ev) => { ev.stopPropagation(); this.toggleMinimize(cd.id); });

                const pushBtn = el.querySelector('.wb-btn-push');
                if (pushBtn) {
                    pushBtn.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        this.pushToScratchpad(cd.id);
                    });
                }

                if (cd.minimized) {
                    el.style.height = '34px';
                    const c = el.querySelector('.wb-card-content'); if (c) c.style.display = 'none';
                    const r = el.querySelector('.wb-card-resizer'); if (r) r.style.display = 'none';
                }

                // Re-fetch article content (wiki/url cards need live content)
                if (cd.type === 'wiki') this.fetchWikiArticle(cd.id, cd.title);
                else if (cd.type === 'url') this.fetchUrlPreview(cd.id, cd.data.url);

                // Save textarea content on change
                if (cd.type === 'text') {
                    const ta = el.querySelector('.wb-textarea');
                    if (ta) ta.addEventListener('input', () => {
                        const c = this.cards.get(cd.id);
                        if (c) { c.data = c.data || {}; c.data.text = ta.value; }
                        this._saveDebounced();
                    });
                }
            }

            // ── END PERSISTENCE ──────────────────────────────────────────────

            clearBoard() {
                if (this.cards.size === 0) return;
                const ok = confirm("Are you sure you want to clear the entire WikiBoard canvas? All cards and connections will be permanently deleted.");
                if (!ok) return;

                // Animate and remove all cards
                this.cards.forEach((cd, id) => {
                    const el = document.getElementById('wb-card-' + id);
                    if (el) {
                        gsap.to(el, {
                            scale: 0.5, opacity: 0, duration: 0.25, ease: 'power2.in',
                            onComplete: () => el.remove()
                        });
                    }
                });

                this.cards.clear();
                this.connections = [];
                this.nextId = 1;
                this._childCounters = {};
                this.selectedCardId = null;
                
                setTimeout(() => {
                    this.renderConnections();
                    this.updateCardCount();
                    this.resetView();
                    this.setStatus('Board cleared');
                    this.saveState();
                }, 300);

                if (window.os && window.os.companion && window.os.companion.speakWithCooldown) {
                    window.os.companion.speakWithCooldown("Board purged. A clean slate for new stray synapses.", { force: true });
                }
            }

            exportBoard() {
                try {
                    const data = {
                        v: 2,
                        pan: this.pan,
                        zoom: this.zoom,
                        nextId: this.nextId,
                        connections: this.connections,
                        cards: []
                    };
                    this.cards.forEach(cd => {
                        data.cards.push({
                            id: cd.id, type: cd.type,
                            x: cd.x, y: cd.y,
                            width: cd.width, height: cd.height,
                            title: cd.title, data: cd.data,
                            parentId: cd.parentId, minimized: cd.minimized
                        });
                    });
                    const json = JSON.stringify(data, null, 2);
                    const blob = new Blob([json], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `AetherOS_WikiBoard_Export_${Date.now()}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    this.setStatus('Board exported successfully');
                    
                    if (window.os && window.os.companion && window.os.companion.speakWithCooldown) {
                        window.os.companion.speakWithCooldown("Board configurations exported to your physical drive.", { priority: 1 });
                    }
                } catch(e) {
                    this.setStatus('Export failed: ' + e.message);
                }
            }

            importBoard() {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        try {
                            const data = JSON.parse(evt.target.result);
                            if (!data || !Array.isArray(data.cards)) {
                                throw new Error('Invalid board schema');
                            }
                            
                            // Clear existing
                            this.cards.forEach((cd, cid) => {
                                const el = document.getElementById('wb-card-' + cid);
                                if (el) el.remove();
                            });
                            this.cards.clear();
                            this.connections = [];

                            // Restore
                            if (data.pan) this.pan = data.pan;
                            if (data.zoom) this.zoom = data.zoom;
                            if (data.nextId) this.nextId = data.nextId;
                            this.updateTransform();
                            this.updateZoomDisplay();

                            this.connections = data.connections || [];
                            data.cards.forEach(cd => {
                                this._restoreCard(cd);
                            });

                            this.renderConnections();
                            this.updateCardCount();
                            this.setStatus('Board imported successfully (' + data.cards.length + ' cards)');
                            this.saveState();
                            
                            if (window.os && window.os.companion && window.os.companion.speakWithCooldown) {
                                window.os.companion.speakWithCooldown("New cognitive architecture imported successfully.", { force: true });
                            }
                        } catch(err) {
                            alert('Failed to import board: ' + err.message);
                            this.setStatus('Import failed');
                        }
                    };
                    reader.readAsText(file);
                };
                input.click();
            }

            pushToScratchpad(cardId) {
                const cd = this.cards.get(cardId);
                if (!cd || cd.type !== 'text') return;
                const textVal = cd.data ? (cd.data.text || '') : '';
                if (!textVal.trim()) {
                    this.setStatus('Note is empty. Nothing to push.');
                    return;
                }
                
                // Get Scratchpad elements
                const notesTextarea = document.getElementById('notes-textarea');
                if (notesTextarea) {
                    const currentVal = notesTextarea.value;
                    const sep = currentVal.trim() ? '\n\n---\n// Imported from WikiBoard Note:\n' : '// Imported from WikiBoard Note:\n';
                    notesTextarea.value = currentVal + sep + textVal + '\n';
                    // Trigger autosave
                    if (os.autoSaveNotes) os.autoSaveNotes();
                    this.setStatus('Note pushed to secure scratchpad!');
                    
                    if (window.os && window.os.companion && window.os.companion.speakWithCooldown) {
                        window.os.companion.speakWithCooldown("Note dispatched to Memory Scratchpad.", { priority: 1 });
                    }
                } else {
                    this.setStatus('Secure log area is unavailable. Open Memory Scratchpad first.');
                }
            }

            zoomIn() { this.zoom = Math.min(3.5, this.zoom * 1.25); this.updateTransform(); this.renderConnections(); this.updateZoomDisplay(); this._saveDebounced(); }
            zoomOut() { this.zoom = Math.max(0.12, this.zoom / 1.25); this.updateTransform(); this.renderConnections(); this.updateZoomDisplay(); this._saveDebounced(); }
            resetView() { this.zoom = 1; this.pan = { x: 0, y: 0 }; this.updateTransform(); this.renderConnections(); this.updateZoomDisplay(); this._saveDebounced(); }

            fitAll() {
                if (this.cards.size === 0) { this.resetView(); return; }
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                this.cards.forEach(cd => {
                    minX = Math.min(minX, cd.x); minY = Math.min(minY, cd.y);
                    maxX = Math.max(maxX, cd.x + cd.width); maxY = Math.max(maxY, cd.y + cd.height);
                });
                const r = this.viewport.getBoundingClientRect(), pad = 60;
                const cw = maxX - minX + pad * 2, ch = maxY - minY + pad * 2;
                this.zoom = Math.min(r.width / cw, r.height / ch, 1.5);
                this.pan.x = (r.width - cw * this.zoom) / 2 - minX * this.zoom + pad * this.zoom;
                this.pan.y = (r.height - ch * this.zoom) / 2 - minY * this.zoom + pad * this.zoom;
                this.updateTransform(); this.renderConnections(); this.updateZoomDisplay();
            }
        }
window.WikiBoardEngine = WikiBoardEngine;
