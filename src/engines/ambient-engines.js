// AetherOS — Ambient Three.js Particle Field, Sakura Petals & Oneko Ball Physics
class BackgroundEngine {
            constructor() {
                this.container = document.getElementById('webgl-container');
                if (!this.container || typeof THREE === 'undefined' || !THREE.Scene) {
                    this.isRendering = false;
                    return;
                }
                this.scene = new THREE.Scene();
                this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
                this.particles = null;
                this.mouseX = 0;
                this.mouseY = 0;
                this.targetX = 0;
                this.targetY = 0;
                this.isRendering = true;
                this.init();
            }

            init() {
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.renderer.setPixelRatio(1); 
                this.container.appendChild(this.renderer.domElement);

                const geometry = new THREE.BufferGeometry();
                const count = 300; 
                const positions = new Float32Array(count * 3);
                
                for(let i = 0; i < count * 3; i++) {
                    positions[i] = (Math.random() - 0.5) * 20;
                }
                
                geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                
                const material = new THREE.PointsMaterial({
                    size: 0.06,
                    color: 0x888899,
                    transparent: true,
                    opacity: 0.35,
                    blending: THREE.AdditiveBlending
                });

                this.particles = new THREE.Points(geometry, material);
                this.scene.add(this.particles);

                this.camera.position.z = 5;

                window.addEventListener('resize', () => this.onWindowResize(), {passive: true});
                document.addEventListener('mousemove', (e) => this.onMouseMove(e), {passive: true});
                this.animate();
            }

            onMouseMove(event) {
                this.mouseX = (event.clientX - window.innerWidth / 2) * 0.0008;
                this.mouseY = (event.clientY - window.innerHeight / 2) * 0.0008;
            }

            onWindowResize() {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            }

            animate() {
                const hidden = document.hidden;
                if (hidden) {
                    setTimeout(() => requestAnimationFrame(() => this.animate()), 800);
                    return;
                }
                const eco = SystemState.settings.performance_mode === 'eco';
                // Throttle: eco=~12fps (80ms), cinematic=~24fps (42ms)
                const now = performance.now();
                const interval = eco ? 80 : 42;
                if (!this._lastFrame || now - this._lastFrame >= interval) {
                    this._lastFrame = now;
                    const nextTargetX = this.mouseX * 0.4;
                    const nextTargetY = this.mouseY * 0.4;
                    const settled = Math.abs(nextTargetX - this.camera.position.x) < 0.001 && Math.abs(-nextTargetY - this.camera.position.y) < 0.001;
                    if (!eco || !settled || this._forceRenderOnce) {
                        this._forceRenderOnce = false;
                        this.targetX = nextTargetX;
                        this.targetY = nextTargetY;
                        const spin = eco ? 0.00006 : 0.00025;
                        this.scene.rotation.y += spin;
                        this.scene.rotation.x += spin * 0.33;
                        this.camera.position.x += (this.targetX - this.camera.position.x) * 0.04;
                        this.camera.position.y += (-this.targetY - this.camera.position.y) * 0.04;
                        this.renderer.render(this.scene, this.camera);
                    }
                }
                requestAnimationFrame(() => this.animate());
            }
        }

window.BackgroundEngine = BackgroundEngine;

class Sakura {
            constructor(selector, options = {}) {
                if (typeof selector === 'undefined') throw new Error('No selector present. Define an element.');
                this.el = document.querySelector(selector);
                if (!this.el) throw new Error('Sakura target element not found.');
                const defaults = {
                    className: 'sakura',
                    fallSpeed: 1,
                    maxSize: 14,
                    minSize: 10,
                    delay: 300,
                    colors: [
                        { gradientColorStart: 'rgba(255, 183, 197, 0.92)', gradientColorEnd: 'rgba(255, 197, 208, 0.86)', gradientColorDegree: 120 },
                        { gradientColorStart: 'rgba(255, 225, 235, 0.88)', gradientColorEnd: 'rgba(255, 160, 190, 0.72)', gradientColorDegree: 135 },
                        { gradientColorStart: 'rgba(255, 245, 250, 0.84)', gradientColorEnd: 'rgba(244, 114, 182, 0.58)', gradientColorDegree: 105 }
                    ],
                    lifeTime: 0
                };
                this.settings = { ...defaults, ...options };
                this.petalsWeak = new Map();
                this._sweepTimer = setInterval(() => this.sweepPetals(), 1000);
                this.el.style.overflowX = 'hidden';
                this.createPetal = this.createPetal.bind(this);
                this.start();
            }
            randomArrayElem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
            randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
            elementInViewport(el) {
                const rect = el.getBoundingClientRect();
                return rect.top < (window.innerHeight || document.documentElement.clientHeight) + 80 && rect.bottom > -80 && rect.left < (window.innerWidth || document.documentElement.clientWidth) + 160 && rect.right > -160;
            }
            sweepPetals() {
                if (!this.settings.lifeTime) return;
                const remove = [];
                const stamp = Date.now();
                this.petalsWeak.forEach((value, key) => { if (key + this.settings.lifeTime < stamp) { remove.push(key); value.remove(); } });
                remove.forEach(key => this.petalsWeak.delete(key));
            }
            createPetal() {
                if (!this.el || !this.el.dataset.sakuraAnimId || document.hidden) {
                    if (this.el && this.el.dataset.sakuraAnimId) {
                        setTimeout(() => { this.el.dataset.sakuraAnimId && window.requestAnimationFrame(this.createPetal); }, Math.max(600, this.settings.delay));
                    }
                    return;
                }
                setTimeout(() => { this.el.dataset.sakuraAnimId && window.requestAnimationFrame(this.createPetal); }, this.settings.delay);
                const animationNames = {
                    blowAnimations: ['blow-soft-left', 'blow-medium-left', 'blow-soft-right', 'blow-medium-right'],
                    swayAnimations: ['sway-0', 'sway-1', 'sway-2', 'sway-3', 'sway-4', 'sway-5', 'sway-6', 'sway-7', 'sway-8']
                };
                const blowAnimation = this.randomArrayElem(animationNames.blowAnimations);
                const swayAnimation = this.randomArrayElem(animationNames.swayAnimations);
                const fallTime = (document.documentElement.clientHeight * 0.007 + Math.round(Math.random() * 5)) * this.settings.fallSpeed;
                const animations = [
                    `fall ${fallTime}s linear 0s 1`,
                    `${blowAnimation} ${(fallTime > 30 ? fallTime : 30) - 20 + this.randomInt(0, 20)}s linear 0s infinite`,
                    `${swayAnimation} ${this.randomInt(2, 4)}s linear 0s infinite`
                ].join(', ');
                const petal = document.createElement('div');
                petal.classList.add(this.settings.className);
                const height = this.randomInt(this.settings.minSize, this.settings.maxSize);
                const width = height - Math.floor(this.randomInt(0, this.settings.minSize) / 3);
                const color = this.randomArrayElem(this.settings.colors);
                petal.style.background = `linear-gradient(${color.gradientColorDegree}deg, ${color.gradientColorStart}, ${color.gradientColorEnd})`;
                petal.style.webkitAnimation = animations;
                petal.style.animation = animations;
                petal.style.borderRadius = `${this.randomInt(this.settings.maxSize, this.settings.maxSize + Math.floor(Math.random() * 10))}px ${this.randomInt(1, Math.max(2, Math.floor(width / 4)))}px`;
                petal.style.height = `${height}px`;
                petal.style.left = `${Math.random() * document.documentElement.clientWidth - 100}px`;
                petal.style.marginTop = `${-(Math.floor(Math.random() * 20) + 15)}px`;
                petal.style.width = `${width}px`;
                const cleanup = () => { if (!this.elementInViewport(petal)) petal.remove(); };
                ['animationend','webkitAnimationEnd','animationiteration','webkitAnimationIteration'].forEach(evt => petal.addEventListener(evt, cleanup, false));
                this.petalsWeak.set(Date.now() + Math.random(), petal);
                this.el.appendChild(petal);
            }
            start() {
                const animId = this.el.dataset.sakuraAnimId;
                if (!animId) this.el.dataset.sakuraAnimId = window.requestAnimationFrame(this.createPetal);
            }
            stop(graceful = false) {
                const animId = this.el.dataset.sakuraAnimId;
                if (animId) {
                    window.cancelAnimationFrame(Number(animId));
                    this.el.dataset.sakuraAnimId = '';
                }
                clearInterval(this._sweepTimer);
                if (!graceful) {
                    setTimeout(() => {
                        const petals = this.el.getElementsByClassName(this.settings.className);
                        while (petals.length > 0) petals[0].parentNode.removeChild(petals[0]);
                    }, this.settings.delay + 50);
                }
            }
        }

window.Sakura = Sakura;

class OnekoBallEngine {
            constructor() {
                this.el = null;
                this.enabled = false;
                this.pos = { x: Math.max(80, window.innerWidth - 140), y: Math.max(80, window.innerHeight - 150) };
                this.vel = { x: 0, y: 0 };
                this.radius = 9;
                this.dragging = false;
                this.mode = 'idle';
                this.lastActivity = performance.now();
                this.autoStarted = false;
                this.lastKick = 0;
                this.prevDrag = null;
                this._raf = null;
                this._activity = () => { this.lastActivity = performance.now(); this.autoStarted = false; if (this.mode === 'auto') this.mode = 'idle'; };
                ['mousemove','mousedown','keydown','wheel','touchstart','pointerdown'].forEach(evt => document.addEventListener(evt, this._activity, { passive:true }));
                window.addEventListener('resize', () => this.keepInBounds(), { passive:true });
                this.animate = this.animate.bind(this);
            }
            setEnabled(on) {
                this.enabled = !!on;
                if (this.enabled) this.ensureBall();
                else this.destroy();
            }
            wake() {
                if (this.enabled && this.el && !this._raf) {
                    this._raf = requestAnimationFrame(this.animate);
                }
            }
            ensureBall() {
                if (this.el) return;
                const el = document.createElement('div');
                el.id = 'oneko-ball';
                el.title = 'Drag and throw me. Dog variant fetches it back.';
                el.className = 'hover-target';
                el.addEventListener('pointerdown', (e) => this.pointerDown(e));
                document.body.appendChild(el);
                this.el = el;
                this.keepInBounds();
                this.render();
                this.wake();
            }
            destroy() {
                if (this._raf) cancelAnimationFrame(this._raf);
                this._raf = null;
                if (this.el) this.el.remove();
                this.el = null;
                this.mode = 'idle';
            }
            pointerDown(e) {
                if (!this.enabled || !this.el) return;
                e.preventDefault(); e.stopPropagation();
                this.dragging = true;
                this.mode = 'held';
                this.el.classList.add('ball-held');
                this.el.setPointerCapture && this.el.setPointerCapture(e.pointerId);
                this.prevDrag = { x: e.clientX, y: e.clientY, t: performance.now() };
                this.pos.x = e.clientX; this.pos.y = e.clientY; this.vel.x = this.vel.y = 0; this.render();
                this.wake();
                const move = (ev) => {
                    const now = performance.now();
                    const dt = Math.max(8, now - (this.prevDrag?.t || now));
                    this.vel.x = (ev.clientX - (this.prevDrag?.x || ev.clientX)) / dt * 16.67;
                    this.vel.y = (ev.clientY - (this.prevDrag?.y || ev.clientY)) / dt * 16.67;
                    this.pos.x = ev.clientX; this.pos.y = ev.clientY;
                    this.prevDrag = { x: ev.clientX, y: ev.clientY, t: now };
                    this.render();
                };
                const up = (ev) => {
                    this.dragging = false;
                    if (this.el) this.el.classList.remove('ball-held');
                    window.removeEventListener('pointermove', move);
                    window.removeEventListener('pointerup', up);
                    window.removeEventListener('pointercancel', up);
                    this.lastActivity = performance.now();
                    const speed = Math.hypot(this.vel.x, this.vel.y);
                    this.mode = speed > 1.6 ? (/(^dog$|dog)/i.test(this.variant()) ? 'fetch' : 'play') : 'idle';
                    this.el && this.el.classList.toggle('ball-fetch', this.mode === 'fetch');
                };
                window.addEventListener('pointermove', move, { passive:false });
                window.addEventListener('pointerup', up, { passive:true });
                window.addEventListener('pointercancel', up, { passive:true });
            }
            variant() { return window.cursorEngine?.oneko?.getVariant ? window.cursorEngine.oneko.getVariant() : (SystemState.settings.cursor_oneko_variant || 'classic'); }
            pet() { return window.cursorEngine?.oneko || null; }
            cursor() { return window.cursorEngine?.mouse || { x: window.innerWidth/2, y: window.innerHeight/2 }; }
            keepInBounds() {
                this.pos.x = Math.min(Math.max(this.radius, this.pos.x), window.innerWidth - this.radius);
                this.pos.y = Math.min(Math.max(this.radius, this.pos.y), window.innerHeight - this.radius);
                this.render();
            }
            render() {
                if (!this.el) return;
                this.el.style.transform = `translate3d(${this.pos.x - this.radius}px, ${this.pos.y - this.radius}px, 0) rotate(${(this.pos.x + this.pos.y) * 2}deg)`;
                this.el.style.setProperty('z-index', '2147483646', 'important');
            }
            startAutoPlay() {
                if (!this.enabled) return;
                this.ensureBall();
                const pet = this.pet();
                const p = pet?.getPosition ? pet.getPosition() : this.cursor();
                this.pos.x = Math.min(window.innerWidth - 40, Math.max(40, p.x + 45));
                this.pos.y = Math.min(window.innerHeight - 80, Math.max(40, p.y - 8));
                this.vel.x = (Math.random() - 0.5) * 7;
                this.vel.y = -5 - Math.random() * 4;
                this.mode = /(^dog$|dog)/i.test(this.variant()) ? 'fetch' : 'auto';
                this.autoStarted = true;
                this.lastKick = 0;
                this.el && this.el.classList.toggle('ball-fetch', this.mode === 'fetch');
            }
            petInteraction(now) {
                const pet = this.pet();
                if (!pet || !pet.getPosition || !pet.setTarget) return;
                const p = pet.getPosition();
                const d = Math.hypot(p.x - this.pos.x, p.y - this.pos.y);
                const speed = Math.hypot(this.vel.x, this.vel.y);
                const dog = /(^dog$|dog)/i.test(this.variant());
                if (dog && (this.mode === 'fetch' || this.mode === 'auto')) {
                    pet.setTarget(this.pos.x, this.pos.y);
                    if (d < 30 && speed < 2.8) {
                        this.mode = 'return';
                        this.el && this.el.classList.add('ball-fetch');
                    }
                } else if (dog && this.mode === 'return') {
                    const c = this.cursor();
                    pet.setTarget(c.x, c.y);
                    this.pos.x = p.x + 12; this.pos.y = p.y + 8; this.vel.x = this.vel.y = 0;
                    if (Math.hypot(p.x - c.x, p.y - c.y) < 48) {
                        this.mode = 'idle';
                        this.vel.x = (Math.random() - .5) * 2; this.vel.y = -2;
                        this.el && this.el.classList.remove('ball-fetch');
                    }
                } else if (this.mode === 'play' || this.mode === 'auto') {
                    pet.setTarget(this.pos.x + Math.sin(now/400)*18, this.pos.y);
                    if (d < 34 && now - this.lastKick > 800) {
                        this.vel.x += (Math.random() - .5) * 8;
                        this.vel.y += -5 - Math.random() * 3;
                        this.lastKick = now;
                    }
                }
            }
            animate(now = performance.now()) {
                if (!this.enabled || !this.el) return;
                if (!this.dragging && this.mode !== 'return') {
                    this.vel.y += 0.34;
                    this.vel.x *= 0.992;
                    this.vel.y *= 0.996;
                    this.pos.x += this.vel.x;
                    this.pos.y += this.vel.y;
                    const floor = window.innerHeight - this.radius - 8;
                    if (this.pos.x < this.radius) { this.pos.x = this.radius; this.vel.x *= -0.72; }
                    if (this.pos.x > window.innerWidth - this.radius) { this.pos.x = window.innerWidth - this.radius; this.vel.x *= -0.72; }
                    if (this.pos.y > floor) {
                        this.pos.y = floor;
                        if (Math.abs(this.vel.y) > 1.2) this.vel.y *= -0.66; else this.vel.y = 0;
                        this.vel.x *= 0.94;
                    }
                    if (this.pos.y < this.radius) { this.pos.y = this.radius; this.vel.y *= -0.55; }
                    if (Math.hypot(this.vel.x, this.vel.y) < 0.08 && this.pos.y >= floor - 1 && (this.mode === 'play' || this.mode === 'fetch')) this.mode = /(^dog$|dog)/i.test(this.variant()) ? 'fetch' : 'idle';
                }
                if (SystemState.settings.cursor_oneko === 'on') this.petInteraction(now);
                if (!this.autoStarted && now - this.lastActivity > 30000 && SystemState.settings.cursor_oneko === 'on') this.startAutoPlay();
                this.render();
                const floor = window.innerHeight - this.radius - 8;
                const settled = !this.dragging && Math.hypot(this.vel.x, this.vel.y) < 0.04 && this.pos.y >= floor - 1 && SystemState.settings.cursor_oneko !== 'on';
                if (settled) {
                    this.vel.x = 0;
                    this.vel.y = 0;
                    this._raf = null;
                    return;
                }
                this._raf = requestAnimationFrame(this.animate);
            }
        }

window.OnekoBallEngine = OnekoBallEngine;
