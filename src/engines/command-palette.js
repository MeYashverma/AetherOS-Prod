// AetherOS — Command Palette Spotlight Launcher (Ctrl/Cmd+K)
class CommandPalette {
            constructor() {
                this.el = document.getElementById('cmd-palette');
                this.input = document.getElementById('cmd-input');
                this.isOpen = false;
                this.selectedIndex = 0;

                document.addEventListener('keydown', (e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                        e.preventDefault();
                        this.toggle();
                        return;
                    }
                    if (e.key === 'Escape') {
                        if (os.finderOpen) { os.closeFinder(); return; }
                        if (this.isOpen) { e.preventDefault(); this.close(); return; }
                    }
                    if (this.isOpen) {
                        const visible = this._visibleItems();
                        if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            if (visible.length) {
                                this.selectedIndex = (this.selectedIndex + 1) % visible.length;
                                this._highlightSelection(visible);
                            }
                        } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            if (visible.length) {
                                this.selectedIndex = (this.selectedIndex - 1 + visible.length) % visible.length;
                                this._highlightSelection(visible);
                            }
                        } else if (e.key === 'Enter') {
                            e.preventDefault();
                            const targetItem = visible[this.selectedIndex] || visible[0];
                            if (targetItem) {
                                this.execute(targetItem.getAttribute('data-cmd'));
                            }
                        }
                    }
                });

                this.el.addEventListener('click', (e) => {
                    if (e.target === this.el) this.close();
                });

                this.input.addEventListener('input', () => {
                    this.filter(this.input.value);
                });

                document.querySelectorAll('.cmd-item').forEach((item) => {
                    item.addEventListener('click', () => {
                        const cmd = item.getAttribute('data-cmd');
                        this.execute(cmd);
                    });
                    item.addEventListener('mouseenter', () => {
                        const visible = this._visibleItems();
                        const idx = visible.indexOf(item);
                        if (idx >= 0) {
                            this.selectedIndex = idx;
                            this._highlightSelection(visible);
                        }
                    });
                });
            }

            _visibleItems() {
                return Array.from(this.el.querySelectorAll('.cmd-item')).filter(el => el.style.display !== 'none');
            }

            _highlightSelection(visible = this._visibleItems()) {
                this.el.querySelectorAll('.cmd-item').forEach(el => el.classList.remove('cmd-selected'));
                const active = visible[this.selectedIndex];
                if (active) {
                    active.classList.add('cmd-selected');
                    active.scrollIntoView({ block: 'nearest' });
                }
            }

            filter(rawQuery) {
                const q = String(rawQuery || '').trim().toLowerCase();
                this.el.querySelectorAll('.cmd-item').forEach(el => {
                    const cmd = (el.getAttribute('data-cmd') || '').toLowerCase();
                    const txt = (el.textContent || '').toLowerCase();
                    const show = !q || txt.includes(q) || cmd.includes(q);
                    el.style.display = show ? 'flex' : 'none';
                });
                this.selectedIndex = 0;
                this._highlightSelection();
            }

            toggle() {
                this.isOpen ? this.close() : this.open();
            }

            open() {
                if (os.finderOpen) os.closeFinder();
                this.isOpen = true;
                this.el.style.display = 'flex';
                this.input.value = '';
                this.filter('');
                gsap.fromTo(this.el, 
                    { opacity: 0 },
                    { opacity: 1, duration: 0.18, ease: 'power2.out' }
                );
                gsap.fromTo(this.el.firstElementChild, 
                    { scale: 0.95, y: -12, opacity: 0 },
                    { scale: 1, y: 0, opacity: 1, duration: 0.24, ease: 'power2.out' }
                );
                this.input.focus();
            }

            close() {
                this.isOpen = false;
                gsap.to(this.el, { 
                    opacity: 0, 
                    duration: 0.14,
                    ease: 'power2.in',
                    onComplete: () => this.el.style.display = 'none' 
                });
                gsap.to(this.el.firstElementChild, { scale: 0.96, y: -8, duration: 0.14, ease: 'power2.in' });
            }

            execute(cmd) {
                const [action, target] = cmd.split(':');
                if (action === 'open') {
                    window.os.openWindow(target);
                } else if (action === 'sys' && target === 'reset') {
                    SystemState.reset();
                }
                this.close();
            }
        }
window.CommandPaletteClass = CommandPalette;
