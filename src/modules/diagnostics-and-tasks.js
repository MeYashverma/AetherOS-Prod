// AetherOS — Interactive Unix-Style Terminal Shell, Activity & Speed Monitor, and Task Manager
window.extendOS({
    _sysLogs: [],
    _terminalCwd: '/Archive',
    _terminalTab: 'shell',
    _terminalMatrixOn: false,
    _terminalIntervals: [],

    logTerminal: (txt) => {
        const stamp = new Date().toLocaleTimeString([], { hour12: false });
        const msg = String(txt || '').trim();
        if (!msg) return;

        os._sysLogs = os._sysLogs || [];
        os._sysLogs.push({ stamp, msg });
        if (os._sysLogs.length > 200) os._sysLogs.shift();

        const countEl = document.getElementById('term-syslog-count');
        if (countEl) countEl.textContent = String(os._sysLogs.length);

        const sysFeed = document.getElementById('terminal-syslog-feed');
        if (sysFeed) {
            const row = document.createElement('div');
            const isErr = /error|fail|denied|offline/i.test(msg);
            const isOk = /ok|sync|connected|ready|complete|saved/i.test(msg);
            row.className = `flex items-start gap-2.5 px-2.5 py-1 rounded-md border ${
                isErr ? 'bg-rose-500/10 border-rose-500/20 text-rose-200'
                      : isOk ? 'bg-emerald-500/[0.07] border-emerald-500/15 text-emerald-200'
                             : 'bg-white/[0.025] border-white/[0.05] text-gray-300'
            }`;
            const safe = os._html ? os._html(msg) : msg.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
            row.innerHTML = `<span class="text-gray-500 shrink-0 tabular-nums">${stamp}</span><span class="break-words min-w-0 flex-1">${safe}</span>`;
            sysFeed.appendChild(row);
            while (sysFeed.children.length > 160) sysFeed.firstChild.remove();
            sysFeed.scrollTop = sysFeed.scrollHeight;
        }
    },

    terminalClearSyslog: () => {
        os._sysLogs = [];
        const sysFeed = document.getElementById('terminal-syslog-feed');
        if (sysFeed) sysFeed.innerHTML = '';
        const countEl = document.getElementById('term-syslog-count');
        if (countEl) countEl.textContent = '0';
    },

    terminalSetTab: (tab) => {
        os._terminalTab = tab === 'syslog' ? 'syslog' : 'shell';
        const shellPane = document.getElementById('terminal-shell-pane');
        const sysPane = document.getElementById('terminal-syslog-pane');
        if (shellPane) shellPane.classList.toggle('hidden', os._terminalTab !== 'shell');
        if (sysPane) sysPane.classList.toggle('hidden', os._terminalTab !== 'syslog');
        document.querySelectorAll('[data-term-tab]').forEach((b) => {
            b.classList.toggle('active', b.getAttribute('data-term-tab') === os._terminalTab);
        });
        if (os._terminalTab === 'syslog') {
            const sysFeed = document.getElementById('terminal-syslog-feed');
            if (sysFeed && !sysFeed.children.length && (os._sysLogs || []).length) {
                const copy = [...os._sysLogs];
                os._sysLogs = [];
                copy.forEach((entry) => os.logTerminal(entry.msg));
            }
        } else {
            document.getElementById('terminal-cli')?.focus();
        }
    },

    terminalWrite: (text, tone = 'default') => {
        const feed = document.getElementById('terminal-feed');
        if (!feed) return;
        const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
        const toneClass = tone === 'error' ? 'text-rose-300'
            : tone === 'success' ? 'text-emerald-300'
            : tone === 'muted' ? 'text-gray-400'
            : tone === 'accent' ? 'text-sky-300'
            : tone === 'prompt' ? 'text-white font-semibold mt-1.5'
            : 'text-gray-200';
        String(text ?? '').split('\n').forEach((ln) => {
            const div = document.createElement('div');
            div.className = `whitespace-pre-wrap break-words ${toneClass}`;
            div.innerHTML = esc(ln);
            feed.appendChild(div);
        });
        while (feed.children.length > 350) feed.firstChild.remove();
        feed.scrollTop = feed.scrollHeight;
    },

    terminalCopyOutput: () => {
        const feed = document.getElementById('terminal-feed');
        if (!feed || !navigator.clipboard) return;
        navigator.clipboard.writeText(feed.innerText || '').then(() => {
            window.Notifications && Notifications.push('Terminal', 'Copied shell session output to clipboard');
        });
    },

    terminalToggleMatrix: () => {
        os._terminalMatrixOn = !os._terminalMatrixOn;
        const canvas = document.getElementById('terminal-matrix-canvas');
        const btn = document.getElementById('term-matrix-btn');
        if (canvas) canvas.classList.toggle('hidden', !os._terminalMatrixOn);
        if (btn) btn.classList.toggle('text-emerald-300', os._terminalMatrixOn);
        if (os._terminalMatrixOn) os._terminalAnimate();
    },

    _terminalSyncCwdUI: () => {
        const cwd = os._terminalCwd || '/Archive';
        const badge = document.getElementById('terminal-cwd-badge');
        const prompt = document.getElementById('terminal-prompt-path');
        if (badge) badge.textContent = cwd;
        if (prompt) prompt.textContent = cwd;
    },

    _terminalResolvePath: (rawTarget) => {
        const cur = os._terminalCwd || '/Archive';
        const t = String(rawTarget || '').trim();
        if (!t || t === '.') return cur;
        if (t === '~') return '/Archive';
        if (t === '..') {
            const parts = cur.split('/').filter(Boolean);
            if (parts.length <= 1) return '/Archive';
            parts.pop();
            return '/' + parts.join('/');
        }
        if (t.startsWith('/')) return t.replace(/\/+$/, '') || '/Archive';
        return (cur === '/' ? '' : cur) + '/' + t.replace(/\/+$/, '');
    },

    initDataStream: () => {
        const root = document.getElementById('terminal-out');
        if (!root) return;
        if (root.dataset.ready === '1') return;
        (os._terminalIntervals || []).forEach(clearInterval);
        os._terminalIntervals = [];
        root.dataset.ready = '1';

        os._terminalHistory = os._terminalHistory || [];
        os._terminalHistIdx = -1;
        os._terminalSyncCwdUI();

        const countEl = document.getElementById('term-syslog-count');
        if (countEl) countEl.textContent = String((os._sysLogs || []).length);

        const cliInput = document.getElementById('terminal-cli');
        const COMMANDS = [
            'help', 'neofetch', 'sysinfo', 'pwd', 'ls', 'cd', 'tree', 'cat', 'touch', 'mkdir',
            'write', 'rm', 'grep', 'ps', 'top', 'kill', 'open', 'closeall', 'space', 'snap',
            'theme', 'calc', 'curl', 'ping', 'echo', 'date', 'uptime', 'whoami', 'uname',
            'history', 'dmesg', 'logs', 'matrix', 'clear', 'lock', 'backup', 'wiki'
        ];

        if (cliInput) {
            cliInput.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key.toLowerCase() === 'l') {
                    e.preventDefault();
                    const f = document.getElementById('terminal-feed');
                    if (f) f.innerHTML = '';
                    return;
                }
                if (e.key === 'Tab') {
                    e.preventDefault();
                    const val = cliInput.value;
                    const parts = val.split(/\s+/);
                    if (parts.length <= 1) {
                        const prefix = parts[0].toLowerCase();
                        const match = COMMANDS.find((cmd) => cmd.startsWith(prefix));
                        if (match) cliInput.value = match + ' ';
                    } else {
                        const cmd = parts[0].toLowerCase();
                        const arg = parts.slice(1).join(' ').toLowerCase();
                        if (cmd === 'open' || cmd === 'kill') {
                            const ids = Object.keys(window.AETHER_MODULE_REGISTRY || {});
                            const m = ids.find((id) => id.startsWith(arg));
                            if (m) cliInput.value = `${cmd} ${m}`;
                        } else if (['cd', 'ls', 'cat', 'rm'].includes(cmd) && os.fmChildrenForPath) {
                            const items = os.fmChildrenForPath(os._terminalCwd || '/Archive');
                            const m = items.find((n) => (n.name || '').toLowerCase().startsWith(arg));
                            if (m) cliInput.value = `${cmd} ${m.name}`;
                        }
                    }
                    return;
                }
                if (e.key === 'Enter' && cliInput.value.trim() !== '') {
                    const val = cliInput.value.trim();
                    os._terminalHistory.unshift(val);
                    if (os._terminalHistory.length > 80) os._terminalHistory.pop();
                    os._terminalHistIdx = -1;
                    os.terminalRunCommand(val);
                    cliInput.value = '';
                } else if (e.key === 'ArrowUp' && os._terminalHistory.length) {
                    e.preventDefault();
                    os._terminalHistIdx = Math.min(os._terminalHistory.length - 1, os._terminalHistIdx + 1);
                    cliInput.value = os._terminalHistory[os._terminalHistIdx] || '';
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    os._terminalHistIdx = Math.max(-1, os._terminalHistIdx - 1);
                    cliInput.value = os._terminalHistIdx >= 0 ? (os._terminalHistory[os._terminalHistIdx] || '') : '';
                }
            });
            setTimeout(() => cliInput.focus(), 40);
        }

        os.terminalWrite('AetherOS Interactive Shell (ash 2.6) — Type "help" for commands or Tab to autocomplete.', 'accent');
        os.terminalWrite('Working directory mounted at /Archive · Ctrl+L clears screen · Switch to "System Log" tab for background events.', 'muted');
    },

    _terminalAnimate: () => {
        const matrix = document.getElementById('terminal-matrix-canvas');
        if (!matrix || !os._terminalMatrixOn) return;
        const mctx = matrix.getContext('2d');
        const resize = () => {
            if (!matrix.parentElement) return;
            const r = matrix.parentElement.getBoundingClientRect();
            matrix.width = Math.max(320, r.width);
            matrix.height = Math.max(200, r.height);
        };
        resize();
        const cols = () => Math.max(8, Math.floor(matrix.width / 16));
        let drops = Array.from({ length: cols() }, () => Math.random() * matrix.height / 16);
        const loop = () => {
            if (!os._terminalMatrixOn || !document.getElementById('terminal-matrix-canvas')) return;
            if (drops.length !== cols()) drops = Array.from({ length: cols() }, () => Math.random() * matrix.height / 16);
            mctx.fillStyle = 'rgba(6, 8, 14, 0.14)';
            mctx.fillRect(0, 0, matrix.width, matrix.height);
            mctx.font = '12px JetBrains Mono, monospace';
            for (let i = 0; i < drops.length; i++) {
                const ch = '01AETHERλΔΣ'[Math.floor(Math.random() * 11)];
                mctx.fillStyle = 'rgba(52, 211, 153, 0.45)';
                mctx.fillText(ch, i * 16, drops[i] * 16);
                if (drops[i] * 16 > matrix.height && Math.random() > 0.975) drops[i] = 0;
                drops[i] += 0.4;
            }
            requestAnimationFrame(loop);
        };
        loop();
    },

    terminalRunCommand: (cmd) => {
        const raw = String(cmd || '').trim();
        if (!raw) return;
        if (os._terminalTab === 'syslog') os.terminalSetTab('shell');

        const cwd = os._terminalCwd || '/Archive';
        const c = raw.toLowerCase();

        if (c === 'clear') {
            const f = document.getElementById('terminal-feed');
            if (f) f.innerHTML = '';
            return;
        }

        os.terminalWrite(`user@aetheros:${cwd}$ ${raw}`, 'prompt');

        if (c === 'help') {
            os.terminalWrite([
                'File System : pwd · ls [dir] · cd <dir> · tree · cat <file> · touch <file> · mkdir <dir> · write <file> <text> · rm <file> · grep <query>',
                'Processes   : ps · kill <app> · open <app> · closeall · dmesg (view system logs)',
                'Workspace   : space <1-3> · snap <left|right|max|split> · theme <name> · lock · backup',
                'Network/Dev : curl <url> · ping <url/host> · calc <expr> · wiki <topic> · neofetch · history · date · uptime · clear'
            ].join('\n'), 'muted');
            return;
        }

        if (c === 'neofetch' || c === 'sysinfo') {
            const reg = window.AETHER_MODULE_REGISTRY || {};
            const totalMods = Object.keys(reg).length;
            const enabledMods = Object.keys(reg).filter((id) => os.isModuleEnabled && os.isModuleEnabled(id)).length;
            const openWins = Object.values(SystemState.windows || {}).filter((w) => w.isOpen).length;
            const upSec = Math.floor(performance.now() / 1000);
            const vfsCount = os.fmFlatten ? os.fmFlatten().filter((n) => n.kind !== 'folder').length : 0;
            os.terminalWrite([
                '      /\\         user@aetheros',
                '     /  \\        -------------',
                `    / /\\ \\       OS:       AetherOS Liquid Glass 2.6 (Web Workstation)`,
                `   / ____ \\      Shell:    ash 2.6 · cwd ${cwd}`,
                `  /_/    \\_\\     Theme:    ${SystemState.settings.active_theme || 'midnight'} (${SystemState.settings.performance_mode || 'eco'} profile)`,
                `                 Desktop:  Workspace 0${SystemState.settings.active_space || 1} · ${openWins} open window(s)`,
                `                 Apps:     ${enabledMods} enabled / ${totalMods} installed · ${vfsCount} VFS files`,
                `                 Runtime:  ${navigator.hardwareConcurrency || '?'} CPU threads · ${navigator.deviceMemory ? navigator.deviceMemory + ' GB RAM · ' : ''}uptime ${Math.floor(upSec / 60)}m ${upSec % 60}s`
            ].join('\n'), 'accent');
            return;
        }

        if (c === 'pwd') {
            os.terminalWrite(cwd);
            return;
        }

        if (c === 'cd' || c.startsWith('cd ')) {
            const arg = raw.slice(2).trim();
            const nextPath = arg ? os._terminalResolvePath(arg) : '/Archive';
            const node = os.fmFindByPath ? os.fmFindByPath(nextPath) : null;
            if (!node || node.kind !== 'folder') {
                // Also try case-insensitive child folder match
                const children = os.fmChildrenForPath ? os.fmChildrenForPath(cwd) : [];
                const fuzzy = children.find((ch) => ch.kind === 'folder' && ch.name.toLowerCase() === arg.toLowerCase());
                if (fuzzy) {
                    os._terminalCwd = fuzzy.path;
                    os._terminalSyncCwdUI();
                    return;
                }
                os.terminalWrite(`cd: no such directory: ${arg}`, 'error');
                return;
            }
            os._terminalCwd = node.path;
            os._terminalSyncCwdUI();
            return;
        }

        if (c === 'ls' || c.startsWith('ls ')) {
            const arg = raw.slice(2).trim();
            const targetPath = arg ? os._terminalResolvePath(arg) : cwd;
            const folder = os.fmFindByPath ? os.fmFindByPath(targetPath) : null;
            if (!folder || folder.kind !== 'folder') {
                os.terminalWrite(`ls: cannot access '${arg || targetPath}': No such directory`, 'error');
                return;
            }
            const items = folder.children || [];
            if (!items.length) {
                os.terminalWrite('(empty directory)', 'muted');
                return;
            }
            const formatted = items.map((n) => n.kind === 'folder' ? `drwxr-xr-x  ${n.name}/` : `-rw-r--r--  ${(n.size || '1 KB').padStart(8)}  ${n.name}`).join('\n');
            os.terminalWrite(formatted);
            return;
        }

        if (c === 'tree') {
            const start = (os.fmFindByPath && os.fmFindByPath(cwd)) || os.filemanager?.data;
            if (!start) { os.terminalWrite('VFS not mounted.', 'error'); return; }
            const lines = [start.name + '/'];
            const walk = (node, prefix) => {
                const kids = node.children || [];
                kids.forEach((child, idx) => {
                    const last = idx === kids.length - 1;
                    lines.push(`${prefix}${last ? '└── ' : '├── '}${child.name}${child.kind === 'folder' ? '/' : ''}`);
                    if (child.kind === 'folder') walk(child, prefix + (last ? '    ' : '│   '));
                });
            };
            walk(start, '');
            os.terminalWrite(lines.slice(0, 50).join('\n'));
            return;
        }

        if (c.startsWith('cat ')) {
            const q = raw.slice(4).trim().toLowerCase();
            const localItems = os.fmChildrenForPath ? os.fmChildrenForPath(cwd) : [];
            const found = localItems.find((n) => n.kind !== 'folder' && (n.name || '').toLowerCase() === q)
                || (os.fmFlatten && os.fmFlatten().find((n) => n.kind !== 'folder' && (n.name || '').toLowerCase().includes(q)));
            if (!found) {
                os.terminalWrite(`cat: ${raw.slice(4).trim()}: No such file`, 'error');
            } else {
                os.terminalWrite(String(found.content || '(binary / media asset)').slice(0, 2400));
            }
            return;
        }

        if (c.startsWith('touch ')) {
            const rawArg = raw.slice(6).trim();
            if (!rawArg) { os.terminalWrite('Usage: touch <filename>', 'error'); return; }
            const resolved = os._terminalResolvePath(rawArg);
            const lastSlash = resolved.lastIndexOf('/');
            const dirPath = lastSlash > 0 ? resolved.slice(0, lastSlash) : cwd;
            const fileName = resolved.slice(lastSlash + 1);
            if (os.fmCreateNewFile) {
                os.fmCreateNewFile(fileName, '', dirPath);
                os.terminalWrite(`Created ${dirPath}/${fileName}`, 'success');
            } else if (window.AetherVFS) {
                AetherVFS.putFile({ name: fileName, content: '', folder: 'User Uploads', kind: 'note' }).then(() => os.terminalWrite(`Saved ${fileName} to VFS`, 'success'));
            }
            return;
        }

        if (c.startsWith('mkdir ')) {
            const rawArg = raw.slice(6).trim();
            if (!rawArg) { os.terminalWrite('Usage: mkdir <dirname>', 'error'); return; }
            const resolved = os._terminalResolvePath(rawArg);
            const lastSlash = resolved.lastIndexOf('/');
            const parentPath = lastSlash > 0 ? resolved.slice(0, lastSlash) : '/Archive';
            const folderName = resolved.slice(lastSlash + 1);
            const parent = os.fmFindByPath && os.fmFindByPath(parentPath);
            if (!parent || parent.kind !== 'folder') { os.terminalWrite(`mkdir: parent directory not found: ${parentPath}`, 'error'); return; }
            parent.children = parent.children || [];
            const fullPath = `${parent.path}/${folderName}`;
            if (parent.children.some((ch) => ch.name.toLowerCase() === folderName.toLowerCase())) {
                os.terminalWrite(`mkdir: ${folderName}: File or directory exists`, 'error');
                return;
            }
            parent.children.unshift({ id: 'fld-' + Date.now(), name: folderName, kind: 'folder', path: fullPath, signal: 'Local', children: [] });
            os.fmSaveLocalTree && os.fmSaveLocalTree();
            os.fmRender && os.fmRender();
            os.terminalWrite(`Created directory ${fullPath}`, 'success');
            return;
        }

        if (c.startsWith('write ')) {
            const rest = raw.slice(6).trim();
            const sp = rest.indexOf(' ');
            if (sp < 1) { os.terminalWrite('Usage: write <filename> <content>', 'error'); return; }
            const name = rest.slice(0, sp).trim();
            const body = rest.slice(sp + 1);
            if (os.fmCreateNewFile) {
                os.fmCreateNewFile(name, body, cwd);
                os.terminalWrite(`Wrote ${body.length} bytes to ${cwd}/${name}`, 'success');
            }
            return;
        }

        if (c.startsWith('rm ')) {
            const name = raw.slice(3).trim().toLowerCase();
            const parent = os.fmFindByPath && os.fmFindByPath(cwd);
            if (!parent || !Array.isArray(parent.children)) { os.terminalWrite('rm: cannot access directory', 'error'); return; }
            const idx = parent.children.findIndex((ch) => (ch.name || '').toLowerCase() === name);
            if (idx < 0) { os.terminalWrite(`rm: ${raw.slice(3).trim()}: No such file in ${cwd}`, 'error'); return; }
            const removed = parent.children.splice(idx, 1)[0];
            if (removed.vfsId && window.AetherVFS) AetherVFS.deleteFile(removed.vfsId).catch(() => {});
            os.fmRender && os.fmRender();
            os.terminalWrite(`Removed ${removed.name}`, 'muted');
            return;
        }

        if (c.startsWith('grep ')) {
            const term = raw.slice(5).trim().toLowerCase();
            if (!term) { os.terminalWrite('Usage: grep <pattern>', 'error'); return; }
            const all = os.fmFlatten ? os.fmFlatten().filter((n) => n.kind !== 'folder') : [];
            const hits = [];
            all.forEach((f) => {
                String(f.content || '').split('\n').forEach((ln, idx) => {
                    if (ln.toLowerCase().includes(term)) hits.push(`${f.path}:${idx + 1}: ${ln.trim().slice(0, 100)}`);
                });
            });
            os.terminalWrite(hits.length ? hits.slice(0, 20).join('\n') : `(no matches for "${term}")`, hits.length ? 'default' : 'muted');
            return;
        }

        if (c === 'ps' || c === 'top') {
            const open = Object.values(SystemState.windows || {}).filter((w) => w.isOpen);
            if (!open.length) {
                os.terminalWrite('No open application windows.', 'muted');
            } else {
                const rows = ['APP ID           SPACE   GEOMETRY     STATE     TITLE'];
                open.forEach((w) => {
                    rows.push(`${w.id.padEnd(16)} 0${w.space || 1}      ${`${Math.round(w.width)}x${Math.round(w.height)}`.padEnd(12)} ${(w.isMinimized ? 'MIN' : 'OPEN').padEnd(9)} ${w.title}`);
                });
                os.terminalWrite(rows.join('\n'));
            }
            return;
        }

        if (c === 'closeall') {
            Object.values(SystemState.windows || {}).forEach((w) => {
                if (w.isOpen && w.id !== 'terminal' && window.winManager) window.winManager.closeWindow(w.id);
            });
            os.terminalWrite('Closed all background windows.', 'success');
            return;
        }

        if (c.startsWith('kill ')) {
            const id = c.slice(5).trim();
            if (window.winManager && SystemState.windows[id]?.isOpen) {
                window.winManager.closeWindow(id);
                os.terminalWrite(`Closed window [${id}].`, 'success');
            } else {
                os.terminalWrite(`kill: window [${id}] is not open.`, 'error');
            }
            return;
        }

        if (c.startsWith('open ')) {
            const q = c.slice(5).trim();
            const reg = window.AETHER_MODULE_REGISTRY || {};
            const appId = SystemState.windows[q] ? q : Object.keys(reg).find((id) => id.includes(q) || (reg[id].label || '').toLowerCase().includes(q));
            if (appId && SystemState.windows[appId]) {
                if (os.isModuleEnabled && !os.isModuleEnabled(appId)) os.setModuleEnabled(appId, true, { silent: true });
                os.openWindow(appId);
                os.terminalWrite(`Opened ${reg[appId]?.label || appId} (${appId})`, 'success');
            } else {
                os.terminalWrite(`open: no app matching "${q}"`, 'error');
            }
            return;
        }

        if (c.startsWith('space ')) {
            const n = Number(c.slice(6).trim());
            if (os.switchSpace && n >= 1 && n <= 3) { os.switchSpace(n); os.terminalWrite(`Switched to Workspace 0${n}.`, 'success'); }
            else os.terminalWrite('Usage: space <1|2|3>', 'error');
            return;
        }

        if (c.startsWith('snap ')) {
            const mode = c.slice(5).trim();
            if (mode === 'split') { os.tileSideBySide && os.tileSideBySide(); os.terminalWrite('Tiled top 2 windows 50/50.', 'success'); }
            else {
                const z = mode === 'max' ? 'maximize' : mode;
                os.snapActiveWindow && os.snapActiveWindow(z);
                os.terminalWrite(`Snapped active window -> ${z}`, 'success');
            }
            return;
        }

        if (c.startsWith('theme ')) {
            const t = c.slice(6).trim();
            os.applyTheme && os.applyTheme(t);
            os.terminalWrite(`Applied theme: ${t}`, 'success');
            return;
        }

        if (c.startsWith('calc ') || /^=\s*/.test(raw)) {
            const expr = raw.replace(/^(calc\s+|=\s*)/i, '').trim().replace(/\^/g, '**');
            if (/^[0-9+\-*/%.()\s]+$/.test(expr)) {
                try { os.terminalWrite('= ' + Function(`"use strict";return (${expr})`)(), 'success'); }
                catch (_) { os.terminalWrite('Invalid arithmetic expression', 'error'); }
            } else {
                os.terminalWrite('Usage: calc (480 * 1.18) / 12', 'error');
            }
            return;
        }

        if (c.startsWith('echo ')) { os.terminalWrite(raw.slice(5)); return; }
        if (c === 'date') { os.terminalWrite(new Date().toString()); return; }
        if (c === 'whoami') { os.terminalWrite('user@aetheros'); return; }
        if (c === 'uname' || c.startsWith('uname ')) { os.terminalWrite(`AetherOS 2.6.0-liquidglass ${navigator.platform || 'Web'} WebKit/Blink`); return; }
        if (c === 'uptime') { const s = Math.floor(performance.now() / 1000); os.terminalWrite(`up ${Math.floor(s / 60)}m ${s % 60}s`); return; }
        if (c === 'history') {
            os.terminalWrite((os._terminalHistory || []).slice(0, 25).reverse().map((h, i) => `${String(i + 1).padStart(3)}  ${h}`).join('\n') || '(empty)', 'muted');
            return;
        }
        if (c === 'dmesg' || c === 'logs') {
            const logs = (os._sysLogs || []).slice(-20);
            os.terminalWrite(logs.length ? logs.map((l) => `[${l.stamp}] ${l.msg}`).join('\n') : '(no system events logged yet)', 'muted');
            return;
        }
        if (c === 'matrix') {
            os.terminalToggleMatrix();
            os.terminalWrite(`Matrix rain backdrop ${os._terminalMatrixOn ? 'enabled' : 'disabled'}.`, 'muted');
            return;
        }
        if (c === 'lock') { os.lockScreen && os.lockScreen(); return; }
        if (c === 'backup') { window.AetherBackup && AetherBackup.triggerExportUI(); return; }
        if (c === 'scan') { os.openWindow('taskmanager'); return; }
        if (c === 'weather') { os.openWindow('weather'); return; }
        if (c === 'iss') { if (!os.isModuleEnabled('iss')) os.setModuleEnabled('iss', true, { silent: true }); os.openWindow('iss'); return; }
        if (c === 'apis') { os.openWindow('sysmon'); return; }

        if (c.startsWith('wiki ')) {
            const query = raw.substring(5).trim();
            os.openWindow('wikiboard');
            setTimeout(() => { if (os.wikiboard?.engine) os.wikiboard.engine.searchAndSpawn(query); }, 600);
            os.terminalWrite(`Opened WikiBoard for "${query}"`, 'success');
            return;
        }

        if (c.startsWith('ping ')) {
            let target = raw.slice(5).trim();
            if (!/^https?:\/\//i.test(target)) target = 'https://' + target;
            const t0 = performance.now();
            os.terminalWrite(`PING ${target} ...`, 'muted');
            fetch(target, { mode: 'no-cors', cache: 'no-store' })
                .then(() => {
                    const ms = (performance.now() - t0).toFixed(1);
                    os.terminalWrite(`64 bytes from ${target}: time=${ms} ms (reachable)`, 'success');
                })
                .catch((e) => os.terminalWrite(`ping failed: ${e.message}`, 'error'));
            return;
        }

        if (c.startsWith('curl ')) {
            let url = raw.slice(5).trim();
            if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
            os.terminalWrite(`GET ${url} ...`, 'muted');
            fetch(url)
                .then(async (r) => {
                    const text = await r.text();
                    let formatted = text;
                    try { formatted = JSON.stringify(JSON.parse(text), null, 2); } catch (_) {}
                    os.terminalWrite(`HTTP ${r.status} (${text.length} bytes)\n` + formatted.slice(0, 1200));
                })
                .catch((e) => os.terminalWrite('curl error: ' + e.message, 'error'));
            return;
        }

        // Shortcut: if command matches an app ID directly, open it
        if (SystemState.windows[c]) {
            if (os.isModuleEnabled && !os.isModuleEnabled(c)) os.setModuleEnabled(c, true, { silent: true });
            os.openWindow(c);
            os.terminalWrite(`Opened ${SystemState.windows[c].title}`, 'success');
            return;
        }

        os.terminalWrite(`ash: command not found: ${raw.split(/\s+/)[0]} (type "help" for available commands)`, 'error');
    },

    switchSysmonView: (viewId) => {
        os.sysmonView = viewId;
        const container = document.getElementById('sysmon-content');
        if (!container) return;

        container.innerHTML = SysmonViews[viewId] || '';

        const tabPerf = document.getElementById('tab-sysmon-perf');
        const tabSpeed = document.getElementById('tab-sysmon-speed');

        if (tabPerf) tabPerf.classList.toggle('active', viewId === 'perf');
        if (tabSpeed) tabSpeed.classList.toggle('active', viewId !== 'perf');

        if (viewId === 'perf') {
            os.initSysMonitor();
        } else {
            os.killSysMonitor();
            os.initSpeedTestUI();
        }
        if (window.lucide) lucide.createIcons({ root: container });
    },

    sysmonTelemetry: { frames: [], heap: [], longTasks: 0, lastReport: {} },

    initSysMonitor: () => {
                os.killSysMonitor();
                os.sysMonitorCanvas = document.getElementById('sysmon-canvas');
                if (!os.sysMonitorCanvas) return;
                os.sysMonitorCtx = os.sysMonitorCanvas.getContext('2d');
                os.sysmonTelemetry = os.sysmonTelemetry || { frames: [], heap: [], longTasks: 0, lastReport: {} };
                os.sysmonTelemetry.frames = Array(160).fill(16.6);
                os.sysmonTelemetry.heap = Array(80).fill(0);
                os.resizeSysMonitorCanvas();
                const root = document.getElementById('sysmon-enhanced-root') || os.sysMonitorCanvas.parentNode;
                if (window.ResizeObserver && !os.sysmonResizeObserver) {
                    os.sysmonResizeObserver = new ResizeObserver(() => os.resizeSysMonitorCanvas());
                    os.sysmonResizeObserver.observe(root);
                }
                if (window.PerformanceObserver) {
                    try {
                        os.sysmonLongTaskObserver = new PerformanceObserver((list) => {
                            os.sysmonTelemetry.longTasks += list.getEntries().length;
                            const el = document.getElementById('sysmon-longtasks');
                            if (el) el.innerText = os.sysmonTelemetry.longTasks;
                        });
                        os.sysmonLongTaskObserver.observe({ entryTypes: ['longtask'] });
                    } catch(e) {}
                }
                let lastFrameTime = performance.now();
                let frameCount = 0;
                let fpsTimer = 0;
                const loop = (timestamp) => {
                    if (!os.sysMonitorCanvas) return;
                    const delta = Math.max(0, timestamp - lastFrameTime);
                    lastFrameTime = timestamp;
                    frameCount++;
                    fpsTimer += delta;
                    os.sysmonTelemetry.frames.push(delta);
                    if (os.sysmonTelemetry.frames.length > 160) os.sysmonTelemetry.frames.shift();
                    if (performance.memory) {
                        os.sysmonTelemetry.heap.push(performance.memory.usedJSHeapSize / 1048576);
                        if (os.sysmonTelemetry.heap.length > 80) os.sysmonTelemetry.heap.shift();
                    }
                    if (fpsTimer >= 1000) {
                        const fps = Math.round((frameCount * 1000) / fpsTimer);
                        const avg = os.sysmonTelemetry.frames.reduce((a,b)=>a+b,0) / os.sysmonTelemetry.frames.length;
                        const lag = Math.max(0, Math.round(avg - 16.6));
                        const fpsDisplay = document.getElementById('sysmon-fps');
                        const frameEl = document.getElementById('sysmon-frame-ms');
                        const lagEl = document.getElementById('sysmon-loop-lag');
                        if (fpsDisplay) fpsDisplay.innerText = `${fps} FPS`;
                        if (frameEl) frameEl.innerText = `${avg.toFixed(1)} MS`;
                        if (lagEl) lagEl.innerText = `${lag} MS LAG`;
                        frameCount = 0;
                        fpsTimer = 0;
                    }
                    os.drawOscilloscopeWaveform(os.sysmonTelemetry.frames);
                    os.drawSysmonMemoryChart();
                    os.sysMonitorLoopId = requestAnimationFrame(loop);
                };
                os.sysMonitorLoopId = requestAnimationFrame(loop);
                os.updateTrueSystemStats();
                os.sysMonitorStatsInterval = setInterval(os.updateTrueSystemStats, 1500);
                if (navigator.getBattery) {
                    navigator.getBattery().then(battery => {
                        const updateBattery = () => {
                            const pct = Math.round(battery.level * 100);
                            const batPct = document.getElementById('sysmon-bat-pct');
                            const batStatus = document.getElementById('sysmon-bat-status');
                            const batTime = document.getElementById('sysmon-bat-time');
                            if (batPct) batPct.innerText = `${pct}%`;
                            if (batStatus) batStatus.innerText = battery.charging ? 'CHARGING' : 'DISCHARGING';
                            if (batTime) batTime.innerText = battery.charging ? (battery.chargingTime === Infinity ? 'PLUGGED IN' : `${Math.round(battery.chargingTime/60)}M TO FULL`) : (battery.dischargingTime === Infinity ? 'CALCULATING...' : `${Math.round(battery.dischargingTime/60)}M LEFT`);
                        };
                        updateBattery();
                        battery.addEventListener('levelchange', updateBattery);
                        battery.addEventListener('chargingchange', updateBattery);
                    });
                } else {
                    const batStatus = document.getElementById('sysmon-bat-status');
                    if (batStatus) batStatus.innerText = 'UNAVAILABLE';
                }
            },

    killSysMonitor: () => {
                if (os.sysMonitorLoopId) cancelAnimationFrame(os.sysMonitorLoopId);
                os.sysMonitorLoopId = null;
                if (os.sysMonitorStatsInterval) clearInterval(os.sysMonitorStatsInterval);
                os.sysMonitorStatsInterval = null;
                if (os.sysmonResizeObserver) { os.sysmonResizeObserver.disconnect(); os.sysmonResizeObserver = null; }
                if (os.sysmonLongTaskObserver) { try { os.sysmonLongTaskObserver.disconnect(); } catch(e) {} os.sysmonLongTaskObserver = null; }
                os.sysMonitorCanvas = null;
                os.sysMonitorCtx = null;
            },

    resizeSysMonitorCanvas: () => {
                if (os.sysMonitorCanvas && os.sysMonitorCanvas.parentNode) {
                    const rect = os.sysMonitorCanvas.parentNode.getBoundingClientRect();
                    const ratio = window.devicePixelRatio || 1;
                    os.sysMonitorCanvas.width = Math.max(1, Math.floor(rect.width * ratio));
                    os.sysMonitorCanvas.height = Math.max(1, Math.floor(rect.height * ratio));
                    os.sysMonitorCanvas.style.width = rect.width + 'px';
                    os.sysMonitorCanvas.style.height = rect.height + 'px';
                    os.sysMonitorCtx = os.sysMonitorCanvas.getContext('2d');
                    if (os.sysMonitorCtx) os.sysMonitorCtx.setTransform(ratio,0,0,ratio,0,0);
                }
                const memCanvas = document.getElementById('sysmon-mem-canvas');
                if (memCanvas) { memCanvas.width = memCanvas.clientWidth || 112; memCanvas.height = memCanvas.clientHeight || 64; }
            },

    drawOscilloscopeWaveform: (data) => {
                const canvas = os.sysMonitorCanvas;
                const ctx = os.sysMonitorCtx;
                if (!canvas || !ctx) return;
                const w = canvas.clientWidth || canvas.width;
                const h = canvas.clientHeight || canvas.height;
                ctx.clearRect(0,0,w,h);
                ctx.fillStyle = '#020202'; ctx.fillRect(0,0,w,h);
                ctx.strokeStyle = 'rgba(255,255,255,0.035)'; ctx.lineWidth = 1;
                for (let x=0; x<w; x+=32) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
                for (let y=0; y<h; y+=28) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
                const maxMs = 80;
                const slice = w / Math.max(1, data.length-1);
                const drawLine = (color, width, mapper) => { ctx.strokeStyle=color; ctx.lineWidth=width; ctx.beginPath(); data.forEach((v,i)=>{ const x=i*slice; const y=mapper(v); i?ctx.lineTo(x,y):ctx.moveTo(x,y); }); ctx.stroke(); };
                drawLine('rgba(255,255,255,0.18)', 1, v => h - Math.min(maxMs,v)/maxMs*h);
                drawLine('rgba(34,197,94,0.9)', 1.6, v => h - Math.min(40,v)/40*h);
                ctx.strokeStyle = 'rgba(250,204,21,0.25)'; ctx.setLineDash([4,4]); ctx.beginPath(); const target = h - 16.6/40*h; ctx.moveTo(0,target); ctx.lineTo(w,target); ctx.stroke(); ctx.setLineDash([]);
            },

    drawSysmonMemoryChart: () => {
                const canvas = document.getElementById('sysmon-mem-canvas');
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                const data = os.sysmonTelemetry?.heap || [];
                const w = canvas.width = canvas.clientWidth || 112;
                const h = canvas.height = canvas.clientHeight || 64;
                ctx.clearRect(0,0,w,h);
                ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0,0,w,h);
                if (!data.length) return;
                const max = Math.max(16, ...data);
                ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.5; ctx.beginPath();
                data.forEach((v,i)=>{ const x = i/(data.length-1)*w; const y = h - (v/max)*h; i?ctx.lineTo(x,y):ctx.moveTo(x,y); }); ctx.stroke();
            },

    drawSysmonStorageDonut: (pct) => {
                const canvas = document.getElementById('sysmon-storage-canvas');
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                const w = canvas.width, h = canvas.height, cx=w/2, cy=h/2, r=34;
                ctx.clearRect(0,0,w,h);
                ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
                ctx.strokeStyle = pct > 80 ? '#ef4444' : pct > 55 ? '#facc15' : '#22c55e'; ctx.beginPath(); ctx.arc(cx,cy,r,-Math.PI/2,-Math.PI/2 + Math.PI*2*(pct/100)); ctx.stroke();
                ctx.fillStyle = '#fff'; ctx.font = 'bold 14px JetBrains Mono, monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(`${Math.round(pct)}%`, cx, cy);
            },

    renderSysmonBars: (id, data) => {
                const el = document.getElementById(id); if (!el) return;
                el.innerHTML = data.map(d => `<div class="bg-white/[0.03] border border-white/5 rounded p-2 min-w-0"><div class="flex justify-between text-[8px] uppercase text-gray-500 mb-1"><span class="truncate">${d.label}</span><span>${d.value}</span></div><div class="h-1.5 bg-os-900 rounded overflow-hidden"><div class="h-full bg-white/50" style="width:${Math.max(2, Math.min(100, d.pct))}%"></div></div></div>`).join('');
            },

    updateTrueSystemStats: async () => {
                const report = {};
                if (performance.memory) {
                    const mem = performance.memory;
                    const used = Math.round(mem.usedJSHeapSize / 1048576);
                    const total = Math.round(mem.totalJSHeapSize / 1048576);
                    const limit = Math.round(mem.jsHeapSizeLimit / 1048576);
                    const pct = Math.round((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100);
                    report.heap = { usedMB: used, totalMB: total, limitMB: limit, pct };
                    const memUsedEl = document.getElementById('sysmon-mem-used');
                    const memLimitEl = document.getElementById('sysmon-mem-limit');
                    const memBarEl = document.getElementById('sysmon-mem-bar');
                    const memPctEl = document.getElementById('sysmon-mem-pct');
                    if (memUsedEl) memUsedEl.innerText = `${used} MB / ${total} MB`;
                    if (memLimitEl) memLimitEl.innerText = `${limit} MB`;
                    if (memBarEl) memBarEl.style.width = `${pct}%`;
                    if (memPctEl) memPctEl.innerText = `${pct}%`;
                } else {
                    const memUsedEl = document.getElementById('sysmon-mem-used'); if (memUsedEl) memUsedEl.innerText = 'NO HEAP API';
                }
                if (navigator.storage && navigator.storage.estimate) {
                    try {
                        const estimate = await navigator.storage.estimate();
                        const quotaMB = Math.round((estimate.quota || 0) / 1048576);
                        const usedMB = ((estimate.usage || 0) / 1048576).toFixed(2);
                        const pct = estimate.quota ? (estimate.usage / estimate.quota) * 100 : 0;
                        report.storage = { usedMB, quotaMB, pct: Math.round(pct) };
                        const quotaEl = document.getElementById('sysmon-quota-val'); if (quotaEl) quotaEl.innerText = `${usedMB}MB / ${quotaMB}MB`;
                        const pctEl = document.getElementById('sysmon-storage-pct'); if (pctEl) pctEl.innerText = `${pct.toFixed(3)}% used`;
                        os.drawSysmonStorageDonut(pct);
                    } catch(e) {}
                }
                const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                if (conn) {
                    report.network = { downlink: conn.downlink, rtt: conn.rtt, effectiveType: conn.effectiveType, saveData: conn.saveData };
                    const netSpeedEl = document.getElementById('sysmon-net-speed'); if (netSpeedEl) netSpeedEl.innerText = `${conn.downlink || '--'} Mbps`;
                    const jitterEl = document.getElementById('sysmon-ping-jitter'); if (jitterEl) jitterEl.innerText = `${conn.rtt || '--'} ms`;
                    const typeEl = document.getElementById('sysmon-net-type'); if (typeEl) typeEl.innerText = conn.effectiveType || 'unknown';
                    const saveEl = document.getElementById('sysmon-net-save'); if (saveEl) saveEl.innerText = conn.saveData ? 'ON' : 'OFF';
                }
                const navEntry = typeof performance.getEntriesByType === 'function' ? performance.getEntriesByType('navigation')[0] : null;
                const loadMs = navEntry ? Math.round(navEntry.loadEventEnd || navEntry.domComplete || performance.now()) : Math.round(performance.now());
                const resources = typeof performance.getEntriesByType === 'function' ? performance.getEntriesByType('resource') : [];
                const byType = resources.reduce((acc, r) => { const t = r.initiatorType || 'other'; acc[t] = (acc[t]||0)+1; return acc; }, {});
                os.renderSysmonBars('sysmon-resource-bars', Object.entries(byType).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([label,value]) => ({label,value,pct: resources.length ? value/resources.length*100 : 0})));
                const cores = navigator.hardwareConcurrency || 1;
                const avgFrameMs = (os.sysmonTelemetry?.frames?.length)
                    ? (os.sysmonTelemetry.frames.reduce((a, b) => a + b, 0) / os.sysmonTelemetry.frames.length)
                    : 16.6;
                const estThreadBusyPct = Math.max(4, Math.min(98, Math.round((Math.max(0, avgFrameMs - 14) / 34) * 100 + Object.values(SystemState.windows).filter(w => w.isOpen).length * 4)));
                os.renderSysmonBars('sysmon-core-bars', Array.from({length: Math.min(16, cores)}, (_, i) => ({
                    label: `T${i + 1}`,
                    value: i === 0 ? `${estThreadBusyPct}%` : 'HW',
                    pct: i === 0 ? estThreadBusyPct : Math.max(6, Math.round(estThreadBusyPct * (0.45 + ((i % 3) * 0.12))))
                })));
                const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
                set('sysmon-device-cores', `${cores}`);
                set('sysmon-device-memory', navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'API N/A');
                set('sysmon-dpr', `${(window.devicePixelRatio || 1).toFixed(2)}x`);
                set('sysmon-viewport', `${window.innerWidth}×${window.innerHeight}`);
                set('sysmon-platform', navigator.platform || 'unknown');
                set('sysmon-online', navigator.onLine ? 'ONLINE' : 'OFFLINE');
                set('sysmon-dom-nodes', document.getElementsByTagName('*').length.toLocaleString());
                set('sysmon-resource-count', resources.length.toString());
                set('sysmon-load-time', `${loadMs} ms`);
                set('sysmon-windows-open', Object.values(SystemState.windows).filter(w => w.isOpen).length.toString());
                const state = localStorage.getItem('AetherOS_State') || '';
                set('sysmon-state-size', `${(state.length/1024).toFixed(1)} KB`);
                set('sysmon-agent', (navigator.userAgent || '').replace(/^Mozilla\//,'').slice(0,42));
                report.browser = { platform:navigator.platform, userAgent:navigator.userAgent, language:navigator.language, online:navigator.onLine, cookieEnabled:navigator.cookieEnabled };
                report.viewport = { width:window.innerWidth, height:window.innerHeight, dpr:window.devicePixelRatio || 1 };
                report.performance = { loadMs, resourceCount: resources.length, domNodes: document.getElementsByTagName('*').length, longTasks: os.sysmonTelemetry?.longTasks || 0 };
                report.app = { openWindows: Object.values(SystemState.windows).filter(w => w.isOpen).length, savedStateKB: Number((state.length/1024).toFixed(1)) };
                os.sysmonTelemetry.lastReport = report;
            },

    sysmonCopyReport: () => {
                const report = os.sysmonTelemetry?.lastReport || {};
                const lines = [
                    '=== AetherOS Diagnostic Report ===',
                    `Timestamp: ${new Date().toISOString()}`,
                    `UA: ${navigator.userAgent}`,
                    `Platform: ${navigator.platform || '--'}`,
                    `Online: ${navigator.onLine}`,
                    `CPU Cores: ${navigator.hardwareConcurrency || '--'}`,
                    `Device RAM: ${navigator.deviceMemory ? navigator.deviceMemory + ' GB' : '--'}`,
                    `Viewport: ${window.innerWidth}×${window.innerHeight} @${window.devicePixelRatio}x`,
                    `Heap: ${report.heap ? report.heap.usedMB + ' / ' + report.heap.limitMB + ' MB (' + report.heap.pct + '%)' : 'N/A'}`,
                    `Storage: ${report.storage ? report.storage.usedMB + ' MB / ' + report.storage.quotaMB + ' MB' : 'N/A'}`,
                    `Network: ${report.network ? report.network.effectiveType + ' @' + report.network.downlink + 'Mbps RTT ' + report.network.rtt + 'ms' : 'N/A'}`,
                    `Open Windows: ${report.app?.openWindows ?? '--'}`,
                    `Saved State: ${report.app?.savedStateKB ?? '--'} KB`,
                    `Load Time: ${report.performance?.loadMs ?? '--'} ms`,
                    `DOM Nodes: ${report.performance?.domNodes ?? '--'}`,
                    `Resources: ${report.performance?.resourceCount ?? '--'}`,
                    `Long Tasks: ${report.performance?.longTasks ?? '--'}`,
                    '=== Raw JSON ===',
                    JSON.stringify(report, null, 2)
                ];
                const text = lines.join('\n');
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(text).then(() => {
                        Notifications.push('DIAGNOSTICS', 'Report copied to clipboard');
                    });
                }
                os.logTerminal('System Diagnostics: Full telemetry report copied to clipboard.');
            },

    forceKillApp: (id) => {
                if (window.winManager) window.winManager.closeWindow(id);
                // Stop audio if it's a media/radio window
                if ((id === 'media' || id === 'radiobrowser') && os.audioStream) {
                    try { os.audioStream.pause(); os.audioStream.src = ''; } catch(e){}
                }
                // Clear intervals tagged to this module
                if (os._moduleIntervals && os._moduleIntervals[id]) {
                    os._moduleIntervals[id].forEach(i => clearInterval(i));
                    delete os._moduleIntervals[id];
                }
                os.logTerminal(`Task Manager: Force killed module [${id}]`);
                Notifications.push('TASK MGR', `Force killed: ${id}`);
            },

    _tmTab: 'processes',
    _tmFilter: '',

    initTaskManager: () => {
        if (os._tmRefreshInterval) clearInterval(os._tmRefreshInterval);
        os.tmSwitchTab('processes');
        os._tmRefreshInterval = setInterval(() => {
            if (document.getElementById('taskmanager-content')) os.tmRefreshData();
        }, 2000);
    },

    tmCloseAllWindows: () => {
        Object.values(SystemState.windows || {}).forEach((w) => {
            if (w.isOpen && w.id !== 'taskmanager') os.forceKillApp(w.id);
        });
        os.tmRefreshData();
    },

    tmSwitchTab: (tab) => {
        os._tmTab = tab;
        const btns = { processes: 'tm-tab-proc', performance: 'tm-tab-perf' };
        Object.entries(btns).forEach(([t, id]) => {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('active', t === tab);
        });
        os.tmRefreshData();
    },

    tmRefresh: () => os.tmRefreshData(),

    tmRefreshData: () => {
        const root = document.getElementById('taskmanager-content');
        if (!root) return;
        const q = String(os._tmFilter || '').trim().toLowerCase();
        if (os._tmTab === 'processes') {
            const allWins = Object.values(SystemState.windows || {}).filter((w) => !q || (w.title + ' ' + w.id).toLowerCase().includes(q));
            const open = allWins.filter((w) => w.isOpen);
            const closed = allWins.filter((w) => !w.isOpen && (!os.isModuleEnabled || os.isModuleEnabled(w.id)));
            const mem = performance.memory;
            const totalMB = mem ? (mem.usedJSHeapSize / 1048576).toFixed(1) : '--';

            root.innerHTML = `
                <div class="p-3.5 h-full flex flex-col">
                    <div class="grid grid-cols-12 gap-2 text-[10.5px] text-gray-400 font-medium px-2.5 pb-2 border-b border-white/[0.07] mb-1.5">
                        <span class="col-span-5">Application</span>
                        <span class="col-span-2">Space</span>
                        <span class="col-span-2">State</span>
                        <span class="col-span-3 text-right">Actions</span>
                    </div>
                    <div class="flex-1 overflow-y-auto space-y-1 pr-0.5">
                        ${open.length ? open.map((w) => `
                            <div class="grid grid-cols-12 gap-2 items-center px-2.5 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] transition">
                                <div class="col-span-5 flex items-center gap-2.5 overflow-hidden">
                                    ${window.AetherDesign?.appIcon(w.id, 20) || ''}
                                    <span class="text-xs text-white font-medium truncate">${os.escapeHtml(w.title)}</span>
                                </div>
                                <span class="col-span-2 text-[11px] font-mono text-gray-400">Space 0${w.space || 1}</span>
                                <span class="col-span-2 text-[11px] font-medium ${w.isMinimized ? 'text-amber-300' : 'text-emerald-300'}">${w.isMinimized ? 'Minimized' : 'Active'}</span>
                                <div class="col-span-3 flex justify-end gap-1.5">
                                    <button type="button" onclick="os.openWindow('${w.id}')" class="px-2 py-1 rounded-md bg-white/[0.06] hover:bg-white/14 text-[10.5px] text-gray-200 cursor-none hover-target transition">Focus</button>
                                    <button type="button" onclick="os.forceKillApp('${w.id}')" class="px-2 py-1 rounded-md bg-rose-500/15 hover:bg-rose-500/30 text-[10.5px] text-rose-300 cursor-none hover-target transition">Close</button>
                                </div>
                            </div>`).join('') : `<div class="py-6 text-center text-gray-500 text-xs">No open windows matching filter.</div>`}

                        ${closed.length ? `<div class="text-[10.5px] text-gray-500 font-semibold px-2.5 pt-3 pb-1">Available Apps (${closed.length})</div>` : ''}
                        ${closed.slice(0, 12).map((w) => `
                            <div class="grid grid-cols-12 gap-2 items-center px-2.5 py-1.5 rounded-lg hover:bg-white/[0.04] opacity-70 hover:opacity-100 transition">
                                <div class="col-span-7 flex items-center gap-2.5 overflow-hidden">
                                    ${window.AetherDesign?.appIcon(w.id, 20) || ''}
                                    <span class="text-xs text-gray-300 truncate">${os.escapeHtml(w.title)}</span>
                                </div>
                                <span class="col-span-2 text-[11px] text-gray-500">Idle</span>
                                <div class="col-span-3 flex justify-end">
                                    <button type="button" onclick="os.openWindow('${w.id}')" class="px-2.5 py-1 rounded-md bg-white/[0.05] hover:bg-white/12 text-[10.5px] text-gray-300 cursor-none hover-target transition">Open</button>
                                </div>
                            </div>`).join('')}
                    </div>
                    <div class="mt-2.5 pt-2.5 border-t border-white/[0.07] flex items-center justify-between text-[11px] text-gray-400 px-1">
                        <span>JS Heap: <b class="text-white font-mono tabular-nums">${totalMB} MB</b></span>
                        <span>Open Windows: <b class="text-emerald-300 font-mono tabular-nums">${open.length}</b></span>
                    </div>
                </div>`;
            if (window.lucide) lucide.createIcons({ root });
        } else {
            const mem = performance.memory;
            const heapUsed = mem ? (mem.usedJSHeapSize / 1048576).toFixed(1) : '--';
            const heapTotal = mem ? (mem.jsHeapSizeLimit / 1048576).toFixed(0) : '--';
            const heapPct = mem ? Math.round(mem.usedJSHeapSize / mem.jsHeapSizeLimit * 100) : 0;
            const conn = navigator.connection || {};
            const nodes = document.querySelectorAll('*').length;
            root.innerHTML = `
                <div class="p-4 space-y-3 overflow-y-auto h-full text-xs">
                    <div class="os-card p-3.5">
                        <div class="text-[11px] font-semibold text-gray-300 mb-2">JavaScript Heap Memory</div>
                        <div class="flex justify-between mb-1.5"><span class="text-gray-400">Used / Limit</span><span class="text-white font-mono font-semibold tabular-nums">${heapUsed} MB / ${heapTotal} MB</span></div>
                        <div class="w-full h-2 bg-black/60 rounded-full overflow-hidden"><div class="h-full bg-emerald-400 rounded-full" style="width:${heapPct}%"></div></div>
                        <div class="text-gray-500 text-[11px] mt-1 font-mono">${heapPct}% allocated</div>
                    </div>
                    <div class="os-card p-3.5 space-y-1.5">
                        <div class="text-[11px] font-semibold text-gray-300 mb-1">Network Link</div>
                        <div class="flex justify-between"><span class="text-gray-400">Profile</span><span class="text-white font-mono uppercase">${conn.effectiveType || conn.type || 'Standard'}</span></div>
                        <div class="flex justify-between"><span class="text-gray-400">Estimated Downlink</span><span class="text-emerald-300 font-mono tabular-nums">${conn.downlink ?? '--'} Mbps</span></div>
                        <div class="flex justify-between"><span class="text-gray-400">Round-Trip Time</span><span class="text-white font-mono tabular-nums">${conn.rtt ?? '--'} ms</span></div>
                    </div>
                    <div class="os-card p-3.5 space-y-1.5">
                        <div class="text-[11px] font-semibold text-gray-300 mb-1">Browser Runtime</div>
                        <div class="flex justify-between"><span class="text-gray-400">Active DOM Elements</span><span class="text-white font-mono font-semibold tabular-nums">${nodes.toLocaleString()}</span></div>
                        <div class="flex justify-between"><span class="text-gray-400">Logical CPU Threads</span><span class="text-white font-mono tabular-nums">${navigator.hardwareConcurrency || '--'}</span></div>
                        <div class="flex justify-between"><span class="text-gray-400">Device Memory</span><span class="text-white font-mono tabular-nums">${navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'Not reported'}</span></div>
                    </div>
                </div>`;
        }
    },

    initSpeedTestUI: () => {
                const curve = document.getElementById('speed-chart-curve');
                if (!curve) return;
                curve.innerHTML = '';
                for (let i = 0; i < 30; i++) {
                    const bar = document.createElement('div');
                    bar.className = 'flex-1 bg-white/10 h-full transition-transform duration-100';
                    bar.style.transform = 'scaleY(0.05)';
                    bar.style.transformOrigin = 'bottom';
                    curve.appendChild(bar);
                }
            },

    updateSpeedTestCurve: (speedMbps) => {
                const curve = document.getElementById('speed-chart-curve');
                if (!curve) return;
                const bars = curve.children;
                if (bars.length === 0) return;

                for (let i = 0; i < bars.length - 1; i++) {
                    bars[i].style.transform = bars[i + 1].style.transform;
                }
                const maxExpectedMbps = 500; 
                const scalingFactor = Math.min(1, speedMbps / maxExpectedMbps);
                bars[bars.length - 1].style.transform = `scaleY(${Math.max(0.05, scalingFactor)})`;
            },

    updateGaugeArc: (value, maxVal = 500) => {
                const progressCircle = document.getElementById('gauge-progress');
                if (!progressCircle) return;
                const radius = progressCircle.r.baseVal.value;
                const circumference = 2 * Math.PI * radius;
                
                const percentage = Math.min(value / maxVal, 1);
                const offset = circumference - (percentage * circumference);
                progressCircle.style.strokeDashoffset = offset;
            },

    runSpeedTest: async () => {
                const startBtn = document.getElementById('speedtest-btn');
                const phaseLabel = document.getElementById('speedtest-phase');
                const speedVal = document.getElementById('speed-meter-val');
                const pingVal = document.getElementById('speed-ping-val');
                const jitterVal = document.getElementById('speed-jitter-val');
                const dlVal = document.getElementById('speed-dl-val');
                const ulVal = document.getElementById('speed-ul-val');
                const ipVal = document.getElementById('speed-client-ip');
                const locVal = document.getElementById('speed-client-loc');

                if (!startBtn || startBtn.disabled) return;
                startBtn.disabled = true;
                startBtn.innerText = "TESTING ACTIVE...";
                startBtn.classList.add('opacity-50');

                pingVal.innerHTML = `-- <span class="text-[10px] text-gray-500">ms</span>`;
                jitterVal.innerHTML = `-- <span class="text-[10px] text-gray-500">ms</span>`;
                dlVal.innerHTML = `-- <span class="text-[10px] text-gray-500">Mbps</span>`;
                ulVal.innerHTML = `-- <span class="text-[10px] text-gray-500">Mbps</span>`;
                os.updateGaugeArc(0, 500);
                os.initSpeedTestUI();

                os.logTerminal("SpeedTest: Initiating real Cloudflare diagnostic sequence...");

                const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
                const maxScale = 500;

                // Phase 0: Topology Scanning
                phaseLabel.innerText = "SCANNING TOPOLOGY";
                try {
                    const traceRes = await fetch('https://cloudflare.com/cdn-cgi/trace', { cache: 'no-store', signal: AbortSignal.timeout(6000) });
                    if (!traceRes.ok) throw new Error(`HTTP ${traceRes.status}`);
                    const traceText = await traceRes.text();
                    const lines = traceText.split('\n');
                    let ip = 'UNKNOWN', loc = 'UNKNOWN', colo = 'UNKNOWN';
                    lines.forEach(line => {
                        if (line.startsWith('ip=')) ip = line.split('=')[1];
                        if (line.startsWith('loc=')) loc = line.split('=')[1];
                        if (line.startsWith('colo=')) colo = line.split('=')[1];
                    });
                    ipVal.innerText = ip;
                    locVal.innerText = `${colo} DATA CENTER (${loc})`;
                } catch(e) {
                    ipVal.innerText = "RESTRICTED / CORS";
                    locVal.innerText = navigator.onLine ? "TRACE ENDPOINT BLOCKED" : "OFFLINE";
                }

                // Phase 1: Latency Analysis (real HTTP RTT probes only)
                phaseLabel.innerText = "LATENCY ANALYSIS";
                os.updateGaugeArc(20, maxScale);

                const pings = [];
                const pingUrl = 'https://speed.cloudflare.com/__down?bytes=0';
                for (let i = 0; i < 5; i++) {
                    const start = performance.now();
                    try {
                        const r = await fetch(`${pingUrl}&_=${Date.now()}_${i}`, { mode: 'cors', cache: 'no-store', signal: AbortSignal.timeout(4000) });
                        if (r.ok) pings.push(performance.now() - start);
                    } catch (e) {}
                    await new Promise(r => setTimeout(r, 50));
                }

                if (pings.length > 0) {
                    pings.sort((a,b) => a-b);
                    const bestPings = pings.slice(0, Math.min(4, pings.length));
                    const avgPing = bestPings.reduce((a,b) => a+b, 0) / bestPings.length;
                    let jitterSum = 0;
                    for (let i = 1; i < bestPings.length; i++) {
                        jitterSum += Math.abs(bestPings[i] - bestPings[i-1]);
                    }
                    const avgJitter = bestPings.length > 1 ? jitterSum / (bestPings.length - 1) : 0;
                    pingVal.innerHTML = `${avgPing.toFixed(1)} <span class="text-[10px] text-gray-500">ms</span>`;
                    jitterVal.innerHTML = `${avgJitter.toFixed(1)} <span class="text-[10px] text-gray-500">ms</span>`;
                } else if (conn && typeof conn.rtt === 'number' && conn.rtt > 0) {
                    pingVal.innerHTML = `${conn.rtt} <span class="text-[10px] text-gray-500">ms (nav)</span>`;
                    jitterVal.innerHTML = `N/A`;
                } else {
                    pingVal.innerHTML = `<span class="text-yellow-400 text-xs">BLOCKED</span>`;
                    jitterVal.innerHTML = `N/A`;
                }

                // Phase 2: Downlink Stress (real stream measurement; honest fallback if blocked)
                phaseLabel.innerText = "DOWNLINK PROBE";
                let dlSpeed = null;
                try {
                    const dlBytesTarget = 10000000;
                    const dlUrl = `https://speed.cloudflare.com/__down?bytes=${dlBytesTarget}&_=${Date.now()}`;
                    const start = performance.now();
                    const response = await fetch(dlUrl, { cache: 'no-store', signal: AbortSignal.timeout(12000) });
                    if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
                    const reader = response.body.getReader();
                    let receivedLength = 0;
                    let lastTick = performance.now();
                    let bytesSinceLastTick = 0;

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        receivedLength += value.length;
                        bytesSinceLastTick += value.length;

                        const now = performance.now();
                        const tickDuration = (now - lastTick) / 1000;
                        if (tickDuration > 0.1) {
                            const instSpeed = ((bytesSinceLastTick * 8) / tickDuration) / 1000000;
                            speedVal.innerText = instSpeed.toFixed(1);
                            os.updateGaugeArc(instSpeed, maxScale);
                            os.updateSpeedTestCurve(instSpeed);
                            lastTick = now;
                            bytesSinceLastTick = 0;
                        }
                    }
                    const totalDuration = Math.max(0.001, (performance.now() - start) / 1000);
                    if (receivedLength > 0) {
                        dlSpeed = ((receivedLength * 8) / totalDuration) / 1000000;
                        speedVal.innerText = dlSpeed.toFixed(1);
                        os.updateGaugeArc(dlSpeed, maxScale);
                    }
                } catch (e) {
                    dlSpeed = null;
                }

                if (dlSpeed !== null) {
                    dlVal.innerHTML = `${dlSpeed.toFixed(1)} <span class="text-[10px] text-gray-500">Mbps</span>`;
                } else if (conn && typeof conn.downlink === 'number' && conn.downlink > 0) {
                    dlVal.innerHTML = `${conn.downlink.toFixed(1)} <span class="text-[10px] text-gray-500">Mbps (nav)</span>`;
                } else {
                    dlVal.innerHTML = `<span class="text-yellow-400 text-xs">BLOCKED</span>`;
                }

                await new Promise(r => setTimeout(r, 300));
                os.initSpeedTestUI();

                // Phase 3: Uplink Probe (real POST measurement; honest fallback if blocked)
                phaseLabel.innerText = "UPLINK PROBE";
                let ulSpeed = null;
                try {
                    const uploadSize = 4000000;
                    const uploadBlob = new Blob([new Uint8Array(uploadSize)]);
                    const start = performance.now();
                    const upRes = await fetch('https://speed.cloudflare.com/__up', {
                        method: 'POST',
                        body: uploadBlob,
                        cache: 'no-store',
                        signal: AbortSignal.timeout(10000)
                    });
                    if (!upRes.ok) throw new Error(`HTTP ${upRes.status}`);
                    const duration = Math.max(0.001, (performance.now() - start) / 1000);
                    ulSpeed = ((uploadSize * 8) / duration) / 1000000;
                    speedVal.innerText = ulSpeed.toFixed(1);
                    os.updateGaugeArc(ulSpeed, maxScale);
                    os.updateSpeedTestCurve(ulSpeed);
                } catch (e) {
                    ulSpeed = null;
                }

                if (ulSpeed !== null) {
                    ulVal.innerHTML = `${ulSpeed.toFixed(1)} <span class="text-[10px] text-gray-500">Mbps</span>`;
                    phaseLabel.innerText = "DIAGNOSTICS COMPLETE";
                } else {
                    ulVal.innerHTML = `<span class="text-yellow-400 text-xs">BLOCKED</span>`;
                    phaseLabel.innerText = dlSpeed !== null ? "PARTIAL DIAGNOSTICS COMPLETE" : "PROBE BLOCKED BY NETWORK / CORS";
                }

                setTimeout(() => {
                    speedVal.innerText = "0.0";
                    os.updateGaugeArc(0, maxScale);
                }, 2000);

                startBtn.disabled = false;
                startBtn.innerText = "Run Speed Test";
                startBtn.classList.remove('opacity-50');
            }
});
