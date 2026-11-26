// AetherOS — Clean, Grouped & Progressive-Disclosure Settings Panes
(function () {
    const esc = (v) => String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const ONEKO_SKINS = [
        ['classic', 'Classic Cat'], ['dog', 'Dog'], ['tora', 'Tora'], ['maia', 'Maia'], ['vaporwave', 'Vaporwave'],
        ['web-white', 'Web White'], ['web-black', 'Web Black'], ['web-gray', 'Web Gray'], ['web-calico', 'Web Calico'],
        ['web-robot', 'Web Robot'], ['web-peach', 'Web Peach'], ['web-colourful', 'Web Colourful'], ['web-earth', 'Web Earth'],
        ['web-air', 'Web Air'], ['web-water', 'Web Water'], ['web-fire', 'Web Fire'], ['web-spirit', 'Web Spirit'],
        ['web-rainbow', 'Web Rainbow'], ['web-ghost', 'Web Ghost'], ['web-neon', 'Web Neon'], ['web-pink', 'Web Pink'],
        ['web-orange', 'Web Orange'], ['web-blue', 'Web Blue'], ['bom-neko', 'Bom Neko'], ['bom-tabby', 'Bom Tabby'],
        ['bom-dog', 'Bom Dog'], ['bom-ace', 'Bom Ace'], ['bom-black2', 'Bom Black 2'], ['bom-blue-tabby', 'Bom Blue Tabby'],
        ['bom-boo-boo-kitty', 'Bom Boo-Boo'], ['bom-clorpoin', 'Bom Clorpoin'], ['bom-dave', 'Bom Dave'],
        ['bom-dee-dee', 'Bom Dee-Dee'], ['bom-fancy', 'Bom Fancy'], ['bom-ghetto', 'Bom Ghetto'], ['bom-holiday', 'Bom Holiday'],
        ['bom-jess', 'Bom Jess'], ['bom-kina', 'Bom Kina'], ['bom-kitty', 'Bom Kitty'], ['bom-kuramecha', 'Bom Kuramecha'],
        ['bom-lucky', 'Bom Lucky'], ['bom-lucy', 'Bom Lucy'], ['bom-marmalade', 'Bom Marmalade'], ['bom-mermaid', 'Bom Mermaid'],
        ['bom-mike', 'Bom Mike'], ['bom-multi', 'Bom Multi'], ['bom-neko-cool', 'Bom Cool'], ['bom-silver', 'Bom Silver'],
        ['bom-silversky', 'Bom Silversky'], ['bom-socks', 'Bom Socks'], ['bom-spooky', 'Bom Spooky'], ['bom-usa', 'Bom USA'],
        ['bom-valentine', 'Bom Valentine'], ['bom-browndog', 'Bom Brown Dog'], ['bom-bug', 'Bom Bug'], ['bom-caz', 'Bom Caz'],
        ['bom-chocobo', 'Bom Chocobo'], ['bom-dalmy', 'Bom Dalmy'], ['bom-face', 'Bom Face'], ['bom-fox', 'Bom Fox'],
        ['bom-lucydog', 'Bom Lucy Dog'], ['bom-alien', 'Bom Alien'], ['bom-bluemarine', 'Bom Blue Marine'],
        ['bom-doom', 'Bom Doom'], ['bom-metroid', 'Bom Metroid'], ['bom-mini', 'Bom Mini'], ['bom-moon', 'Bom Moon'],
        ['bom-white-pink-nose', 'Bom Pink Nose'], ['bom-moka', 'Bom Moka'], ['bom-royal', 'Bom Royal'], ['bom-air', 'Bom Air'],
        ['bom-black', 'Bom Black'], ['bom-blue', 'Bom Blue'], ['bom-calico', 'Bom Calico'], ['bom-colourful', 'Bom Colourful'],
        ['bom-earth', 'Bom Earth'], ['bom-fire', 'Bom Fire'], ['bom-ghost', 'Bom Ghost'], ['bom-gray', 'Bom Gray'],
        ['bom-neon', 'Bom Neon'], ['bom-orange', 'Bom Orange'], ['bom-peach', 'Bom Peach'], ['bom-pink', 'Bom Pink'],
        ['bom-rainbow', 'Bom Rainbow'], ['bom-robot', 'Bom Robot'], ['bom-rose', 'Bom Rose'], ['bom-spirit', 'Bom Spirit'],
        ['bom-water', 'Bom Water'], ['bom-brownbsddaemon', 'BSD Daemon'], ['bom-captaingoodnight', 'Captain Goodnight'],
        ['bom-cokebottle', 'Coke Bottle'], ['bom-greenghost', 'Green Ghost'], ['bom-monstertruck', 'Monster Truck']
    ];

    const THEMES = [
        { id: 'midnight', name: 'Midnight', desc: 'Deep black · Pure glass', dot: '#ffffff', bg: 'linear-gradient(145deg,#060608,#14141d)' },
        { id: 'aurora',   name: 'Aurora',   desc: 'Bioluminescent teal',    dot: '#14ffb4', bg: 'linear-gradient(145deg,#021008,#062e22)' },
        { id: 'synthwave',name: 'Synthwave',desc: 'Neon purple retro',      dot: '#c084fc', bg: 'linear-gradient(145deg,#0a0412,#1e0e48)' },
        { id: 'ember',    name: 'Ember',    desc: 'Warm amber contrast',    dot: '#fb923c', bg: 'linear-gradient(145deg,#0c0603,#261408)' },
        { id: 'ice',      name: 'Arctic Ice',desc: 'Crisp glacial blue',    dot: '#60a5fa', bg: 'linear-gradient(145deg,#020810,#0d1e3a)' },
        { id: 'rose',     name: 'Rosé',     desc: 'Soft pink dark glass',   dot: '#f472b6', bg: 'linear-gradient(145deg,#0c0208,#2e0818)' },
        { id: 'solar',    name: 'Solar',    desc: 'Incandescent gold',      dot: '#facc15', bg: 'linear-gradient(145deg,#0d0800,#2e1e00)' },
        { id: 'hacker',   name: 'Hacker',   desc: 'Phosphor matrix green',  dot: '#4ade80', bg: 'linear-gradient(145deg,#000a00,#001e00)' },
        { id: 'neonvoid', name: 'Neon Void',desc: 'Indigo & magenta split', dot: '#818cf8', bg: 'linear-gradient(145deg,#000008,#0a0020)' },
        { id: 'sakura',   name: 'Sakura',   desc: 'Cherry blossom tint',    dot: '#fbb6ce', bg: 'linear-gradient(145deg,#0e0508,#280e15)' },
        { id: 'carbon',   name: 'Carbon',   desc: 'Minimal slate monochrome',dot:'#94a3b8', bg: 'linear-gradient(145deg,#0a0a0a,#1c1c1c)' },
        { id: 'ocean',    name: 'Ocean',    desc: 'Deep aqua current',      dot: '#38bdf8', bg: 'linear-gradient(145deg,#00050f,#001840)' }
    ];

    const FX_CURSORS = [
        ['neon', 'Neon Trail'], ['comet', 'Comet Dust'], ['cursorly', 'Bubbles'],
        ['ripple', 'Click Ripple'], ['sparkle', 'Sparkle'], ['binary', 'Binary Rain'],
        ['gold', 'Gold Pulse'], ['void', 'Void Lens'], ['nyan', 'Nyan Cat']
    ];

    const s = () => (window.SystemState && window.SystemState.settings) ? window.SystemState.settings : {};

    function countModules() {
        const reg = window.AETHER_MODULE_REGISTRY || {};
        const ids = Object.keys(reg);
        const enabledMap = s().enabled_modules || {};
        const enabled = ids.filter((id) => reg[id].required || enabledMap[id] !== false && Boolean(enabledMap[id])).length;
        return { enabled, total: ids.length || 35 };
    }

    function renderModulesSection(filterPack) {
        const reg = window.AETHER_MODULE_REGISTRY || {};
        const packs = window.AETHER_MODULE_PACKS || [];
        const enabledMap = s().enabled_modules || {};
        const activeFilter = filterPack || window._settingsModulePackFilter || 'all';
        const counts = countModules();

        const filterPills = [
            { id: 'all', label: 'All Packs' },
            ...packs.map((p) => ({ id: p.id, label: p.label.split(',')[0].split('&')[0].trim() }))
        ].map((pill) => `
            <button type="button" onclick="os.setSettingsModuleFilter('${pill.id}')"
                class="px-2.5 py-1 rounded-lg text-[11px] font-medium transition hover-target cursor-none ${activeFilter === pill.id ? 'bg-white/15 text-white border border-white/20' : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:text-white'}">
                ${esc(pill.label)}
            </button>
        `).join('');

        const packCards = packs
            .filter((pack) => activeFilter === 'all' || pack.id === activeFilter)
            .map((pack) => {
                const mods = Object.values(reg).filter((m) => m.pack === pack.id);
                const enabledInPack = mods.filter((m) => m.required || Boolean(enabledMap[m.id])).length;
                const toggleableMods = mods.filter((m) => !m.required);
                const allToggleableOn = toggleableMods.length > 0 && toggleableMods.every((m) => Boolean(enabledMap[m.id]));

                const rows = mods.map((m) => {
                    const isOn = Boolean(m.required || enabledMap[m.id]);
                    return `
                        <div class="settings-row" data-search-item="${esc(m.label + ' ' + m.desc + ' ' + pack.label)}">
                            <div class="settings-row-main">
                                <div class="settings-row-icon">${window.AetherDesign?.appIcon(m.id, 22) || ''}</div>
                                <div class="min-w-0">
                                    <div class="settings-row-title flex items-center gap-2">
                                        <span>${esc(m.label)}</span>
                                        ${m.required ? '<span class="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/10 text-gray-300">Core</span>' : ''}
                                    </div>
                                    <div class="settings-row-desc">${esc(m.desc)}</div>
                                </div>
                            </div>
                            <div class="flex items-center gap-2.5 shrink-0">
                                ${isOn && m.id !== 'settings' ? `<button type="button" onclick="os.openWindow('${m.id}')" class="px-2 py-1 rounded-md bg-white/[0.05] hover:bg-white/10 border border-white/10 text-[10.5px] text-gray-300 hover:text-white transition hover-target cursor-none">Open</button>` : ''}
                                <button type="button" role="switch" aria-checked="${isOn}" ${m.required ? 'disabled title="Required system module"' : `onclick="os.toggleModuleEnabled('${m.id}')"`}
                                    class="os-switch hover-target cursor-none" data-module-switch="${m.id}" data-on="${isOn}"></button>
                            </div>
                        </div>
                    `;
                }).join('');

                return `
                    <div class="space-y-2">
                        <div class="flex items-center justify-between gap-2 px-0.5 pt-2">
                            <div class="min-w-0">
                                <div class="text-xs font-semibold text-white flex items-center gap-2">
                                    <i data-lucide="${esc(pack.icon)}" class="w-3.5 h-3.5 text-gray-400"></i>
                                    <span>${esc(pack.label)}</span>
                                    <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-gray-400">${enabledInPack}/${mods.length}</span>
                                </div>
                                <div class="text-[11px] text-gray-500 mt-0.5">${esc(pack.description)}</div>
                            </div>
                            ${toggleableMods.length ? `
                                <button type="button" onclick="os.setModulePack('${pack.id}', ${!allToggleableOn})"
                                    class="px-2.5 py-1 rounded-lg text-[11px] font-medium border transition shrink-0 hover-target cursor-none ${allToggleableOn ? 'bg-white/[0.04] border-white/10 text-gray-300 hover:bg-white/10' : 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/25'}">
                                    ${allToggleableOn ? 'Disable Pack' : 'Enable Pack'}
                                </button>
                            ` : ''}
                        </div>
                        <div class="settings-card">${rows}</div>
                    </div>
                `;
            }).join('');

        return `
            <div class="settings-pane-header flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div class="settings-pane-title">App Modules</div>
                    <div class="settings-pane-subtitle">Keep AetherOS minimal or enable optional packs anytime. Disabled apps stay hidden from the Dock, Launcher, and Command Palette.</div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <button type="button" onclick="os.applyModulePreset('minimal')" class="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/10 border border-white/10 text-[11px] font-medium text-gray-200 transition hover-target cursor-none">Minimal (${Object.values(reg).filter(m => m.required || m.defaultEnabled).length})</button>
                    <button type="button" onclick="os.applyModulePreset('all')" class="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-[11px] font-medium text-emerald-200 transition hover-target cursor-none">Enable All (${counts.total})</button>
                </div>
            </div>

            <div class="flex flex-wrap items-center gap-1.5 mb-4">${filterPills}</div>

            <div class="space-y-4" id="settings-modules-pack-list">${packCards}</div>
        `;
    }

    const SettingsTabs = window.SettingsTabs = {
        renderModulesSection,

        get general() {
            const st = s();
            const counts = countModules();
            const perf = st.performance_mode === 'cinematic' ? 'cinematic' : 'eco';
            const motion = st.motion_intensity === 'low' ? 'low' : 'high';
            const sidebarOn = st.desktop_sidebar === 'on';
            const awakeOn = st.screen_awake_enabled === 'on';

            return `
                <div class="settings-pane-header">
                    <div class="settings-pane-title">General</div>
                    <div class="settings-pane-subtitle">Core performance, workspace layout, and power behavior.</div>
                </div>

                <div class="settings-section-label">Performance &amp; Motion</div>
                <div class="settings-card">
                    <div class="settings-row" data-search-item="performance mode eco cinematic gpu glass blur">
                        <div class="settings-row-main">
                            <div class="settings-row-icon"><i data-lucide="zap" class="w-3.5 h-3.5 text-emerald-400"></i></div>
                            <div>
                                <div class="settings-row-title">Performance Profile</div>
                                <div class="settings-row-desc">Eco minimizes GPU blur overhead; Cinematic enables full Liquid Glass refraction.</div>
                            </div>
                        </div>
                        <div class="os-segmented">
                            <button type="button" id="opt-perf-eco" onclick="os.setOption('performance_mode','eco')" class="os-seg-btn ${perf === 'eco' ? 'active' : ''} hover-target cursor-none">Eco</button>
                            <button type="button" id="opt-perf-cinematic" onclick="os.setOption('performance_mode','cinematic')" class="os-seg-btn ${perf === 'cinematic' ? 'active' : ''} hover-target cursor-none">Cinematic</button>
                        </div>
                    </div>

                    <div class="settings-row" data-search-item="motion animation speed gsap reduced">
                        <div class="settings-row-main">
                            <div class="settings-row-icon"><i data-lucide="sparkles" class="w-3.5 h-3.5 text-sky-400"></i></div>
                            <div>
                                <div class="settings-row-title">Window Animations</div>
                                <div class="settings-row-desc">Control spring transitions and genie minimize animations.</div>
                            </div>
                        </div>
                        <div class="os-segmented">
                            <button type="button" id="opt-motion-high" onclick="os.setOption('motion_intensity','high')" class="os-seg-btn ${motion === 'high' ? 'active' : ''} hover-target cursor-none">Dynamic</button>
                            <button type="button" id="opt-motion-low" onclick="os.setOption('motion_intensity','low')" class="os-seg-btn ${motion === 'low' ? 'active' : ''} hover-target cursor-none">Reduced</button>
                        </div>
                    </div>
                </div>

                <div class="settings-section-label">Workspace &amp; Power</div>
                <div class="settings-card">
                    <div class="settings-row" data-search-item="sidebar telemetry chat assistant right panel">
                        <div class="settings-row-main">
                            <div class="settings-row-icon"><i data-lucide="panel-right" class="w-3.5 h-3.5 text-indigo-400"></i></div>
                            <div>
                                <div class="settings-row-title">Desktop control shelf</div>
                                <div class="settings-row-desc">Pin media summaries and workspace shortcuts on wide screens. The assistant lives in the top island.</div>
                            </div>
                        </div>
                        <button type="button" role="switch" aria-checked="${sidebarOn}" onclick="os.setOption('desktop_sidebar', SystemState.settings.desktop_sidebar === 'on' ? 'off' : 'on')"
                            class="os-switch hover-target cursor-none" data-setting-switch="desktop_sidebar" data-on="${sidebarOn}"></button>
                    </div>

                    <div class="settings-row" data-search-item="keep screen awake wake lock sleep">
                        <div class="settings-row-main">
                            <div class="settings-row-icon"><i data-lucide="sun" class="w-3.5 h-3.5 text-amber-400"></i></div>
                            <div>
                                <div class="settings-row-title">Keep Screen Awake</div>
                                <div class="settings-row-desc">Prevent your display from dimming while AetherOS is active.</div>
                            </div>
                        </div>
                        <button type="button" role="switch" aria-checked="${awakeOn}" onclick="os.toggleWakeLock()"
                            class="os-switch hover-target cursor-none" data-setting-switch="screen_awake_enabled" data-on="${awakeOn}"></button>
                    </div>

                    <div class="settings-row" data-search-item="icons dark color appearance">
                      <div class="settings-row-main"><div><div class="settings-row-title">App icon appearance</div><div class="settings-row-desc">Original Fluent artwork, dark tiles, or translucent Liquid Glass. Applies across Dock, launcher and windows.</div></div></div>
                      <select class="os-input px-2 py-1" aria-label="App icon appearance" onchange="AetherDesign.setIconAppearance(this.value)">${[['glass','Liquid Glass'],['dark','Dark'],['color','Original color'],['auto','Match device']].map(([v,t])=>`<option value="${v}" ${(st.icon_appearance||'dark')===v?'selected':''}>${t}</option>`).join('')}</select>
                    </div>
                    <div class="settings-row" data-search-item="lock screen name idle automatic privacy">
                      <div class="settings-row-main"><div><div class="settings-row-title">Lock screen profile &amp; automatic locking</div><div class="settings-row-desc">Locks this workspace tab, not the device. Idle locking is best-effort while the tab is running.</div></div></div>
                      <div class="flex flex-wrap gap-2"><input class="os-input px-2 py-1" aria-label="Lock screen display name" maxlength="40" value="${esc(st.lock_display_name||'My workspace')}" onchange="os.setLockPreference('lock_display_name',this.value)">
                      <select class="os-input px-2 py-1" aria-label="Automatically lock after inactivity" onchange="os.setLockPreference('lock_idle_minutes',this.value)">${[[0,'Never auto-lock'],[1,'After 1 minute'],[5,'After 5 minutes'],[15,'After 15 minutes'],[30,'After 30 minutes']].map(([v,t])=>`<option value="${v}" ${Number(st.lock_idle_minutes||0)===v?'selected':''}>${t}</option>`).join('')}</select>
                      <label><input type="checkbox" ${st.lock_when_hidden?'checked':''} onchange="os.setLockPreference('lock_when_hidden',this.checked)"> Lock when leaving tab</label></div>
                    </div>
                    <div class="settings-row" data-search-item="lock screen pin password privacy security">
                        <div class="settings-row-main">
                            <div class="settings-row-icon"><i data-lucide="lock" class="w-3.5 h-3.5 text-violet-400"></i></div>
                            <div>
                                <div class="settings-row-title">Workspace privacy curtain</div>
                                <div class="settings-row-desc">Press Ctrl/⌘ + Shift + L to pause the workspace. Passphrases are stored as salted PBKDF2 verifiers, not plaintext. This is not device security or file encryption.<p id="lock-setting-status" role="status"></p></div>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                            <input id="lock-setting-input" type="password" autocomplete="new-password" maxlength="128" placeholder="New passphrase" aria-label="New workspace passphrase" class="os-input w-32 px-2 py-1">
                            <button type="button" class="os-btn px-2 py-1" onclick="os.setLockPassphrase(document.getElementById('lock-setting-input').value)">Save</button>
                            <button type="button" class="os-btn px-2 py-1" onclick="os.clearLockPassphrase()">Remove</button>
                            <button type="button" onclick="os.lockScreen && os.lockScreen()" class="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] font-medium text-white transition hover-target cursor-none">Lock Now</button>
                        </div>
                    </div>
                </div>

                <div class="settings-section-label">Modular Workspace</div>
                <div class="settings-card">
                    <div class="settings-row">
                        <div class="settings-row-main">
                            <div class="settings-row-icon"><i data-lucide="layout-grid" class="w-3.5 h-3.5 text-cyan-400"></i></div>
                            <div>
                                <div class="settings-row-title">${counts.enabled} of ${counts.total} App Modules Enabled</div>
                                <div class="settings-row-desc">22 niche, experimental, and entertainment modules are tucked away until you need them.</div>
                            </div>
                        </div>
                        <button type="button" onclick="os.switchSettingsTab('modules')" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-medium text-white transition hover-target cursor-none shrink-0">Configure</button>
                    </div>
                    <div class="settings-row">
                        <div class="settings-row-main">
                            <div class="settings-row-icon"><i data-lucide="wand-2" class="w-3.5 h-3.5 text-pink-400"></i></div>
                            <div>
                                <div class="settings-row-title">Desktop Extras &amp; Ambient Toys</div>
                                <div class="settings-row-desc">Optional Oneko pet, Sakura petals, anime quotes, and companion banter (off by default).</div>
                            </div>
                        </div>
                        <button type="button" onclick="os.switchSettingsTab('extras')" class="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/12 border border-white/10 text-xs font-medium text-gray-200 transition hover-target cursor-none shrink-0">Open Extras</button>
                    </div>
                </div>
            `;
        },

        get appearance() {
            const st = s();
            const activeTheme = st.active_theme || 'midnight';
            const wpMode = ['default', 'custom', 'mesh', 'dynamic', 'gif', 'gallery', 'online'].includes(st.wallpaper_mode) ? st.wallpaper_mode : 'default';
            const cur = st.cursor_theme || 'aether';
            const isFxCursor = FX_CURSORS.some(([id]) => id === cur);
            const nyanStd = st.cursor_nyan_standard === 'on';

            const themeCards = THEMES.map((t) => `
                <button type="button" onclick="os.applyTheme('${t.id}')" id="theme-btn-${t.id}"
                    class="theme-btn relative overflow-hidden rounded-xl p-3 text-left border transition-all hover:-translate-y-0.5 hover-target cursor-none ${activeTheme === t.id ? 'theme-active ring-1 ring-white/50 border-white/40' : 'border-white/10 hover:border-white/25'}"
                    style="background:${t.bg};min-height:66px">
                    <div class="flex items-center justify-between gap-1.5">
                        <span class="flex items-center gap-1.5 text-xs font-semibold text-white">
                            <span class="w-2 h-2 rounded-full shrink-0" style="background:${t.dot};box-shadow:0 0 8px ${t.dot}"></span>
                            ${esc(t.name)}
                        </span>
                        <span class="theme-active-badge text-[8px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/15 text-white ${activeTheme === t.id ? 'opacity-100' : 'opacity-0'}">Active</span>
                    </div>
                    <div class="text-[10px] text-white/55 mt-1 truncate">${esc(t.desc)}</div>
                </button>
            `).join('');

            const fxButtons = FX_CURSORS.map(([id, label]) => `
                <button type="button" id="opt-cursor-${id}" onclick="os.setOption('cursor_theme','${id}')"
                    class="px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition hover-target cursor-none ${cur === id ? 'bg-white/18 border-white/35 text-white' : 'bg-white/[0.04] border-white/10 text-gray-400 hover:text-white'}">
                    ${esc(label)}
                </button>
            `).join('');

            return `
                <div class="settings-pane-header">
                    <div class="settings-pane-title">Appearance</div>
                    <div class="settings-pane-subtitle">Color themes, accent highlights, backdrop mode, and pointer style.</div>
                </div>

                <div class="settings-section-label">System appearance</div>
                <div class="settings-card" data-search-item="day night auto light dark glass transparency clarity">
                  <div class="settings-row"><div class="settings-row-main"><div><div class="settings-row-title">Day / Night / Auto</div><div class="settings-row-desc">Auto follows your device’s light or dark preference, including changes while AetherOS is open. Color themes below remain your accent and wallpaper choice.</div></div></div>
                  <select class="os-input px-3 py-2" aria-label="System appearance" onchange="AetherAppearance.set('system_appearance',this.value)">${[['day','Day'],['night','Night'],['auto','Auto · match device']].map(([v,t])=>`<option value="${v}" ${(st.system_appearance||'auto')===v?'selected':''}>${t}</option>`).join('')}</select></div>
                  <div class="settings-row"><div class="settings-row-main"><div><div class="settings-row-title">Glass clarity</div><div class="settings-row-desc">Clear reveals more wallpaper; Balanced adds reading contrast. Solid removes transparency and blur. Your device’s reduced-transparency preference takes priority.</div></div></div>
                  <select class="os-input px-3 py-2" aria-label="Glass clarity" onchange="AetherAppearance.set('glass_clarity',this.value)">${[['clear','Clear'],['balanced','Balanced'],['solid','Solid · maximum contrast']].map(([v,t])=>`<option value="${v}" ${(st.glass_clarity||'balanced')===v?'selected':''}>${t}</option>`).join('')}</select></div>
                  <p id="system-appearance-status" role="status" class="appearance-status">${esc(document.documentElement.dataset.systemMode||'auto')} · ${esc(st.glass_clarity||'balanced')} glass</p>
                </div>

                <div class="settings-section-label">System Theme</div>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5" id="theme-grid" data-search-item="theme midnight aurora synthwave ember ice rose solar hacker neonvoid sakura carbon ocean">
                    ${themeCards}
                </div>
                <div class="mt-2 px-1 flex items-center justify-between text-[11px] text-gray-400">
                    <span>Active theme: <strong id="active-theme-name" class="text-white">${esc((THEMES.find(t => t.id === activeTheme) || THEMES[0]).name)}</strong></span>
                    <span class="font-mono text-[10.5px]">Accent <span id="active-theme-accent" style="color:var(--os-accent-custom)">${esc(st.theme_accent || '#ffffff')}</span></span>
                </div>

                <div class="settings-section-label">Surface &amp; Backdrop</div>
                <div class="settings-card">
                    <div class="settings-row" data-search-item="accent highlight color picker">
                        <div class="settings-row-main">
                            <div class="settings-row-icon"><i data-lucide="pipette" class="w-3.5 h-3.5"></i></div>
                            <div>
                                <div class="settings-row-title">Custom Accent Color</div>
                                <div class="settings-row-desc">Override the active theme highlight color across badges and controls.</div>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <input type="color" id="opt-color-accent" value="${esc(st.theme_accent || '#ffffff')}" onchange="os.setOption('theme_accent', this.value)"
                                class="w-8 h-8 rounded-lg bg-transparent border border-white/15 cursor-none hover-target">
                        </div>
                    </div>

                    <div class="settings-row flex-wrap" data-search-item="wallpaper background liquid glass custom image mesh gradient dynamic sky gif">
                        <div class="settings-row-main">
                            <div class="settings-row-icon"><i data-lucide="image" class="w-3.5 h-3.5 text-sky-400"></i></div>
                            <div>
                                <div class="settings-row-title">Desktop Wallpaper Studio</div>
                                <div class="settings-row-desc">Original 4K vector collection with automatic rotation, or keep your own wallpaper.</div>
                            </div>
                        </div>
                        <div class="os-segmented flex-wrap">
                            <button type="button" onclick="os.setOption('wallpaper_mode','gallery')" class="os-seg-btn ${wpMode === 'gallery' ? 'active' : ''} hover-target">4K Collection</button>
                            <button type="button" onclick="os.setOption('wallpaper_mode','online')" class="os-seg-btn ${wpMode === 'online' ? 'active' : ''} hover-target">Online Wallpapers</button>
                            <button type="button" id="opt-wp-default" onclick="os.setOption('wallpaper_mode','default')" class="os-seg-btn ${wpMode === 'default' ? 'active' : ''} hover-target cursor-none">Glass</button>
                            <button type="button" id="opt-wp-custom" onclick="os.setOption('wallpaper_mode','custom')" class="os-seg-btn ${wpMode === 'custom' ? 'active' : ''} hover-target cursor-none">Custom</button>
                            <button type="button" id="opt-wp-mesh" onclick="os.setOption('wallpaper_mode','mesh')" class="os-seg-btn ${wpMode === 'mesh' ? 'active' : ''} hover-target cursor-none">Mesh</button>
                            <button type="button" id="opt-wp-dynamic" onclick="os.setOption('wallpaper_mode','dynamic')" class="os-seg-btn ${wpMode === 'dynamic' ? 'active' : ''} hover-target cursor-none">Sky</button>
                            <button type="button" id="opt-wp-gif" onclick="os.setOption('wallpaper_mode','gif')" class="os-seg-btn ${wpMode === 'gif' ? 'active' : ''} hover-target cursor-none">GIF</button>
                        </div>
                        ${wpMode === 'gallery' ? `
                            <div class="wallpaper-collection-grid">
                                ${(window.AetherDesign?.wallpapers || []).map(w => `<button type="button" aria-label="Use ${w.name} wallpaper" aria-pressed="${(st.wallpaper_collection || 'aurora') === w.id && st.wallpaper_rotation === 'off'}" onclick="SystemState.settings.wallpaper_collection='${w.id}'; SystemState.settings.wallpaper_rotation='off'; os.setOption('wallpaper_mode','gallery')" style="background-image:url('assets/wallpapers/${w.id}.svg')"><span>${w.name}</span></button>`).join('')}
                            </div>
                            <label class="wallpaper-cadence">Change wallpaper
                                <select aria-label="Wallpaper rotation" onchange="os.setOption('wallpaper_rotation',this.value)">
                                    ${[['daily','Daily'],['hourly','Every hour'],['off','Keep selected']].map(([value,label]) => `<option value="${value}" ${(st.wallpaper_rotation || 'daily') === value ? 'selected' : ''}>${label}</option>`).join('')}
                                </select>
                            </label>
                            <p class="text-[10px] text-gray-400">3840 × 2160 original vector artwork. Rotates locally, works offline after first load. Selecting a thumbnail pauses rotation. No downloads from third-party wallpaper services.</p>
                        ` : ''}
                        ${wpMode === 'online' ? `
                            <div class="wallpaper-online-panel">
                                <p>Auto uses the fastest configured provider, with the GitHub collection as a fallback. Search batches are cached: Next cycles through already-found images. Provider availability, plans and resolution affect results. Artist rights remain with their owners.</p>
                                <label class="wallpaper-cadence">Provider <select aria-label="Online wallpaper provider" onchange="if(this.value==='nexwall' &amp;&amp; SystemState.settings.wallpaper_online_quality!=='4k')SystemState.settings.wallpaper_online_quality='screen';os.setOption('wallpaper_online_provider',this.value)">
                                    ${[['auto','Auto · fastest ready provider'],['nexwall','NexWall · demo or server key'],['pixabay','Pixabay · server key'],['unsplash','Unsplash · server key + approval'],['pexels','Pexels · server key + approval'],['github','GitHub collection · no server needed'],['wallhaven','Wallhaven · requires API server'],['commons','Wikimedia · public-domain photos']].map(([v,l]) => `<option value="${v}" ${(st.wallpaper_online_provider || 'auto') === v ? 'selected' : ''}>${l}</option>`).join('')}
                                </select></label>
                                <p id="wallpaper-provider-setup" class="text-[10px] text-gray-400" role="status">Checking provider setup…</p>
                                <label class="wallpaper-cadence">Resolution <select aria-label="Online wallpaper resolution" onchange="os.setOption('wallpaper_online_quality',this.value)">
                                    <option value="4k" ${(st.wallpaper_online_quality || 'hd') === '4k' ? 'selected' : ''}>Strict 4K · 3840×2160+</option>
                                    <option value="screen" ${st.wallpaper_online_quality === 'screen' ? 'selected' : ''}>Screen-fit · includes cropped phone wallpapers</option>
                                    <option value="hd" ${(st.wallpaper_online_quality || 'hd') === 'hd' ? 'selected' : ''}>Allow HD · 1920×1080+</option>
                                </select></label>
                                <label class="wallpaper-cadence">Theme <select aria-label="Online wallpaper theme" onchange="os.setOption('wallpaper_online_topic',this.value)">
                                    ${[['gaming','Gaming'],['anime','Anime'],['meme','Memes'],['amoled','AMOLED / dark'],['abstract','Abstract'],['landscape','Landscapes'],['coast','Coasts'],['space','Space'],['nature','Nature'],['city','Cities'],['cars','Cars'],['animals','Animals'],['flowers','Flowers'],['minimal','Minimal'],['cyberpunk','Cyberpunk'],['mountains','Mountains']].map(([v,l]) => `<option value="${v}" ${(st.wallpaper_online_topic || 'abstract') === v ? 'selected' : ''}>${l}</option>`).join('')}
                                </select></label>
                                <label class="wallpaper-cadence">Search <input type="search" maxlength="80" value="${esc(st.wallpaper_online_search || '')}" placeholder="Optional: e.g. neon city, pixel art" aria-label="Wallpaper search" onchange="os.setOption('wallpaper_online_search',this.value.trim().slice(0,80))" class="os-input px-2 py-1"></label>
                                <label class="wallpaper-cadence">Change photo <select aria-label="Online wallpaper rotation" onchange="os.setOption('wallpaper_rotation',this.value)">
                                    ${[['daily','Daily'],['hourly','Every hour'],['off','Keep current']].map(([v,l]) => `<option value="${v}" ${(st.wallpaper_rotation || 'daily') === v ? 'selected' : ''}>${l}</option>`).join('')}
                                </select></label>
                                <button type="button" class="os-seg-btn" onclick="window.AetherWebWallpapers?.next()">Next wallpaper</button> <button type="button" class="os-seg-btn" onclick="window.AetherWebWallpapers?.retry()">Retry connection</button>
                                <p id="wallpaper-online-status" role="status">Your current wallpaper stays visible while loading. NexWall is mainly phone-portrait content: use Screen-fit to include it (cropped to your desktop). Strict 4K never silently downgrades. Stock providers may not have anime or memes. Keys belong in server environment variables, never browser settings. Unsplash/Pexels require operator-confirmed approval for this use.</p>
                            </div>
                        ` : ''}
                        ${wpMode === 'custom' ? `
                            <div class="w-full pt-2.5 mt-1 border-t border-white/[0.06] space-y-2.5">
                                <div class="flex flex-wrap items-center gap-2">
                                    <button type="button" onclick="os.uploadCustomWallpaper()" class="px-3 py-1.5 rounded-lg bg-white/12 hover:bg-white/20 border border-white/20 text-[11px] font-medium text-white transition hover-target cursor-none flex items-center gap-1.5">
                                        <i data-lucide="upload" class="w-3 h-3"></i> Upload Image
                                    </button>
                                    <input type="text" value="${esc(st.wallpaper_custom_url || '')}" placeholder="Or paste HTTPS image URL..."
                                        onchange="SystemState.settings.wallpaper_custom_url = this.value.trim(); os.setOption('wallpaper_mode','custom');"
                                        class="flex-1 min-w-[180px] px-2.5 py-1.5 rounded-lg bg-black/45 border border-white/10 text-[11px] text-white font-mono outline-none focus:border-white/30">
                                </div>
                                <div class="grid grid-cols-2 gap-3 text-[10.5px] text-gray-400">
                                    <label class="flex items-center justify-between gap-2">
                                        <span>Dim (${Number(st.wallpaper_dim ?? 25)}%)</span>
                                        <input type="range" min="0" max="75" value="${Number(st.wallpaper_dim ?? 25)}" oninput="SystemState.settings.wallpaper_dim = Number(this.value); SystemState.save(); os.syncSystemPerformanceEngine();" class="w-24 accent-sky-400">
                                    </label>
                                    <label class="flex items-center justify-between gap-2">
                                        <span>Blur (${Number(st.wallpaper_blur ?? 0)}px)</span>
                                        <input type="range" min="0" max="20" value="${Number(st.wallpaper_blur ?? 0)}" oninput="SystemState.settings.wallpaper_blur = Number(this.value); SystemState.save(); os.syncSystemPerformanceEngine();" class="w-24 accent-sky-400">
                                    </label>
                                </div>
                            </div>
                        ` : wpMode === 'mesh' ? `
                            <div class="w-full pt-2.5 mt-1 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
                                <div class="flex items-center gap-2 text-[11px] text-gray-300">
                                    <span>Mesh Colors:</span>
                                    <input type="color" value="${esc(st.wallpaper_mesh_c1 || '#4f46e5')}" onchange="SystemState.settings.wallpaper_mesh_c1 = this.value; os.setOption('wallpaper_mode','mesh');" class="w-7 h-7 rounded bg-transparent border border-white/15">
                                    <input type="color" value="${esc(st.wallpaper_mesh_c2 || '#ec4899')}" onchange="SystemState.settings.wallpaper_mesh_c2 = this.value; os.setOption('wallpaper_mode','mesh');" class="w-7 h-7 rounded bg-transparent border border-white/15">
                                    <input type="color" value="${esc(st.wallpaper_mesh_c3 || '#14b8a6')}" onchange="SystemState.settings.wallpaper_mesh_c3 = this.value; os.setOption('wallpaper_mode','mesh');" class="w-7 h-7 rounded bg-transparent border border-white/15">
                                </div>
                                <button type="button" onclick="os.randomizeMeshWallpaper()" class="px-2.5 py-1 rounded-lg bg-white/[0.07] hover:bg-white/14 border border-white/12 text-[11px] text-white transition hover-target cursor-none">Randomize Mesh</button>
                            </div>
                        ` : wpMode === 'gif' ? `
                            <div class="w-full pt-2 mt-1 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-gray-400">
                                <span>Ambient animated GIF wallpaper</span>
                                <button type="button" onclick="os.fetchWallpaperGif()" class="px-2.5 py-1 rounded-lg bg-white/[0.07] hover:bg-white/14 border border-white/12 text-white transition hover-target cursor-none">Shuffle GIF</button>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="settings-section-label">Pointer</div>
                <div class="settings-card">
                    <div class="settings-row" data-search-item="mouse cursor pointer aether minimal crosshair">
                        <div class="settings-row-main">
                            <div class="settings-row-icon"><i data-lucide="mouse-pointer-2" class="w-3.5 h-3.5"></i></div>
                            <div>
                                <div class="settings-row-title">Cursor Style</div>
                                <div class="settings-row-desc">Precision custom pointer rendered above windows.</div>
                            </div>
                        </div>
                        <div class="os-segmented">
                            <button type="button" id="opt-cursor-aether" onclick="os.setOption('cursor_theme','aether')" class="os-seg-btn ${cur === 'aether' ? 'active' : ''} hover-target cursor-none">Aether</button>
                            <button type="button" id="opt-cursor-minimal" onclick="os.setOption('cursor_theme','minimal')" class="os-seg-btn ${cur === 'minimal' ? 'active' : ''} hover-target cursor-none">Minimal</button>
                            <button type="button" id="opt-cursor-crosshair" onclick="os.setOption('cursor_theme','crosshair')" class="os-seg-btn ${cur === 'crosshair' ? 'active' : ''} hover-target cursor-none">Crosshair</button>
                        </div>
                    </div>

                    <details class="group" ${isFxCursor ? 'open' : ''} data-search-item="cursor effects neon comet bubbles sparkle binary nyan">
                        <summary class="px-3.5 py-2.5 text-[11.5px] text-gray-400 hover:text-white flex items-center justify-between list-none cursor-none hover-target select-none">
                            <span>Particle &amp; Novelty Cursor Effects ${isFxCursor ? `<strong class="text-emerald-400 ml-1">(${esc(cur)})</strong>` : ''}</span>
                            <i data-lucide="chevron-down" class="w-3.5 h-3.5 transition-transform group-open:rotate-180"></i>
                        </summary>
                        <div class="px-3.5 pb-3.5 pt-1 space-y-2.5 border-t border-white/[0.05] bg-black/20">
                            <div class="grid grid-cols-3 gap-1.5" id="cursor-theme-grid">${fxButtons}</div>
                            ${cur === 'nyan' ? `
                                <div class="flex items-center justify-between pt-1 text-[11px] text-gray-400">
                                    <span>Show native OS arrow alongside Nyan Cat</span>
                                    <button type="button" role="switch" aria-checked="${nyanStd}" onclick="os.setOption('cursor_nyan_standard', SystemState.settings.cursor_nyan_standard === 'on' ? 'off' : 'on')"
                                        class="os-switch hover-target cursor-none" data-on="${nyanStd}"></button>
                                </div>
                            ` : ''}
                        </div>
                    </details>
                </div>
            `;
        },

        get themes() {
            return this.appearance;
        },

        get modules() {
            return renderModulesSection();
        },

        get extras() {
            const st = s();
            const onekoOn = st.cursor_oneko === 'on';
            const ballOn = st.cursor_oneko_ball === 'on';
            const sakuraOn = st.sakura_petals === 'on';
            const sakuraInt = st.sakura_intensity || 'normal';
            const quotesOn = st.anime_quotes === 'on';
            const quoteBg = st.quote_bg_mode || 'none';
            const quotePos = st.quote_position || 'top-left';
            const companionOn = st.speech_companion === 'on';
            const emoMode = st.companion_emotion_mode || 'gif';
            const radioGifOn = st.radio_gif_enabled === 'on';
            const curSkin = st.cursor_oneko_variant || 'classic';

            const skinOptions = ONEKO_SKINS.map(([val, label]) =>
                `<option value="${esc(val)}" ${curSkin === val ? 'selected' : ''}>${esc(label)}</option>`
            ).join('');

            return `
                <div class="settings-pane-header">
                    <div class="settings-pane-title">Desktop Extras</div>
                    <div class="settings-pane-subtitle">Playful overlays and ambient toys. Everything here defaults to off so your workspace stays clean unless you opt in.</div>
                </div>

                <div class="settings-section-label">Desktop Companions &amp; Ambient FX</div>
                <div class="settings-card">
                    <!-- Oneko Pet -->
                    <div class="settings-row" data-search-item="oneko cat dog pet cursor companion ball">
                        <div class="settings-row-main">
                            <div class="settings-row-icon"><i data-lucide="cat" class="w-3.5 h-3.5 text-amber-300"></i></div>
                            <div>
                                <div class="settings-row-title">Oneko Pixel Pet</div>
                                <div class="settings-row-desc">Classic retro pixel companion that chases your pointer across the desktop.</div>
                            </div>
                        </div>
                        <button type="button" id="opt-oneko-toggle" role="switch" aria-checked="${onekoOn}"
                            onclick="os.setOption('cursor_oneko', SystemState.settings.cursor_oneko === 'on' ? 'off' : 'on')"
                            class="os-switch hover-target cursor-none" data-setting-switch="cursor_oneko" data-on="${onekoOn}"></button>
                    </div>
                    <div class="settings-subpanel ${onekoOn ? '' : 'is-collapsed'}" data-subpanel-for="cursor_oneko">
                        <div class="space-y-2.5">
                            <div class="flex flex-wrap items-center justify-between gap-2">
                                <span class="text-[11px] text-gray-400">Companion Skin</span>
                                <div class="flex items-center gap-2">
                                    <select id="oneko-variant-select" onchange="os.setOption('cursor_oneko_variant', this.value)"
                                        class="px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/10 text-xs text-white outline-none hover-target cursor-none">
                                        ${skinOptions}
                                    </select>
                                    <button type="button" onclick="window.cursorEngine && window.cursorEngine.showOnekoPicker()"
                                        class="px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/12 border border-white/10 text-[11px] text-gray-200 transition hover-target cursor-none">Gallery</button>
                                </div>
                            </div>
                            <div class="flex items-center justify-between gap-2 pt-1">
                                <div>
                                    <div class="text-[11.5px] text-gray-200">Interactive Physics Ball</div>
                                    <div class="text-[10.5px] text-gray-500">Throwable toy ball on the desktop that Oneko chases and fetches.</div>
                                </div>
                                <button type="button" role="switch" aria-checked="${ballOn}"
                                    onclick="os.setOption('cursor_oneko_ball', SystemState.settings.cursor_oneko_ball === 'on' ? 'off' : 'on')"
                                    class="os-switch hover-target cursor-none" data-setting-switch="cursor_oneko_ball" data-on="${ballOn}"></button>
                            </div>
                        </div>
                    </div>

                    <!-- Sakura Petals -->
                    <div class="settings-row" data-search-item="sakura cherry blossom petals falling atmosphere">
                        <div class="settings-row-main">
                            <div class="settings-row-icon"><i data-lucide="flower-2" class="w-3.5 h-3.5 text-pink-300"></i></div>
                            <div>
                                <div class="settings-row-title">Sakura Blossom Overlay</div>
                                <div class="settings-row-desc">Gentle falling cherry blossom petals floating behind open windows.</div>
                            </div>
                        </div>
                        <button type="button" role="switch" aria-checked="${sakuraOn}"
                            onclick="os.setOption('sakura_petals', SystemState.settings.sakura_petals === 'on' ? 'off' : 'on')"
                            class="os-switch hover-target cursor-none" data-setting-switch="sakura_petals" data-on="${sakuraOn}"></button>
                    </div>
                    <div class="settings-subpanel ${sakuraOn ? '' : 'is-collapsed'}" data-subpanel-for="sakura_petals">
                        <div class="flex items-center justify-between gap-2">
                            <span class="text-[11px] text-gray-400">Petal Density</span>
                            <div class="os-segmented">
                                <button type="button" id="opt-sakura-light" onclick="os.setOption('sakura_intensity','light')" class="os-seg-btn ${sakuraInt === 'light' ? 'active' : ''} hover-target cursor-none">Light</button>
                                <button type="button" id="opt-sakura-normal" onclick="os.setOption('sakura_intensity','normal')" class="os-seg-btn ${sakuraInt === 'normal' ? 'active' : ''} hover-target cursor-none">Normal</button>
                                <button type="button" id="opt-sakura-storm" onclick="os.setOption('sakura_intensity','storm')" class="os-seg-btn ${sakuraInt === 'storm' ? 'active' : ''} hover-target cursor-none">Storm</button>
                            </div>
                        </div>
                    </div>

                    <!-- Desktop Anime Quotes -->
                    <div class="settings-row" data-search-item="desktop anime quotes widget klipy">
                        <div class="settings-row-main">
                            <div class="settings-row-icon"><i data-lucide="quote" class="w-3.5 h-3.5 text-purple-300"></i></div>
                            <div>
                                <div class="settings-row-title">Desktop Quote Widget</div>
                                <div class="settings-row-desc">Floating anime quote card pinned to a corner of the desktop canvas.</div>
                            </div>
                        </div>
                        <button type="button" role="switch" aria-checked="${quotesOn}"
                            onclick="os.setOption('anime_quotes', SystemState.settings.anime_quotes === 'on' ? 'off' : 'on')"
                            class="os-switch hover-target cursor-none" data-setting-switch="anime_quotes" data-on="${quotesOn}"></button>
                    </div>
                    <div class="settings-subpanel ${quotesOn ? '' : 'is-collapsed'}" data-subpanel-for="anime_quotes">
                        <div class="space-y-2.5">
                            <div class="flex flex-wrap items-center justify-between gap-2">
                                <span class="text-[11px] text-gray-400">Widget Position</span>
                                <div class="flex items-center gap-2">
                                    <select id="opt-quote-pos" onchange="os.setOption('quote_position', this.value)"
                                        class="px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-xs text-white outline-none hover-target cursor-none">
                                        <option value="top-left" ${quotePos === 'top-left' ? 'selected' : ''}>Top Left</option>
                                        <option value="top-right" ${quotePos === 'top-right' ? 'selected' : ''}>Top Right</option>
                                        <option value="bottom-left" ${quotePos === 'bottom-left' ? 'selected' : ''}>Bottom Left</option>
                                        <option value="bottom-right" ${quotePos === 'bottom-right' ? 'selected' : ''}>Bottom Right</option>
                                        <option value="center" ${quotePos === 'center' ? 'selected' : ''}>Center</option>
                                    </select>
                                    <button type="button" onclick="os.fetchAnimeQuote()" class="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/12 border border-white/10 text-[11px] text-gray-200 transition hover-target cursor-none">Next Quote</button>
                                </div>
                            </div>
                            <div class="flex flex-wrap items-center justify-between gap-2">
                                <span class="text-[11px] text-gray-400">Card Backdrop</span>
                                <div class="os-segmented">
                                    <button type="button" id="opt-qbg-none" onclick="os.setOption('quote_bg_mode','none')" class="os-seg-btn ${quoteBg === 'none' ? 'active' : ''} hover-target cursor-none">Minimal</button>
                                    <button type="button" id="opt-qbg-gif" onclick="os.setOption('quote_bg_mode','gif')" class="os-seg-btn ${quoteBg === 'gif' ? 'active' : ''} hover-target cursor-none">GIF</button>
                                    <button type="button" id="opt-qbg-klipy" onclick="os.setOption('quote_bg_mode','klipy')" class="os-seg-btn ${quoteBg === 'klipy' ? 'active' : ''} hover-target cursor-none">Klipy</button>
                                </div>
                            </div>
                            ${quoteBg === 'klipy' ? `
                                <div class="pt-1">
                                    <input type="password" id="cfg-klipy-key" value="${esc(st.quote_gif_api_key || '')}" placeholder="Klipy API key..."
                                        onchange="os.setOption('quote_gif_api_key', this.value.trim())"
                                        class="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/10 text-xs text-white font-mono outline-none">
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Companion Personality -->
                    <div class="settings-row" data-search-item="jarvis companion personality banter emotion oled">
                        <div class="settings-row-main">
                            <div class="settings-row-icon"><i data-lucide="bot" class="w-3.5 h-3.5 text-cyan-300"></i></div>
                            <div>
                                <div class="settings-row-title">Autonomous Companion Banter</div>
                                <div class="settings-row-desc">Allow Aether AI to make occasional witty remarks on app launches and idle states.</div>
                            </div>
                        </div>
                        <button type="button" role="switch" aria-checked="${companionOn}"
                            onclick="os.setOption('speech_companion', SystemState.settings.speech_companion === 'on' ? 'off' : 'on')"
                            class="os-switch hover-target cursor-none" data-setting-switch="speech_companion" data-on="${companionOn}"></button>
                    </div>
                    <div class="settings-subpanel ${companionOn ? '' : 'is-collapsed'}" data-subpanel-for="speech_companion">
                        <div class="flex items-center justify-between gap-2">
                            <span class="text-[11px] text-gray-400">Chat Avatar Style</span>
                            <div class="os-segmented">
                                <button type="button" id="opt-emo-gif" onclick="os.setOption('companion_emotion_mode','gif')" class="os-seg-btn ${emoMode === 'gif' ? 'active' : ''} hover-target cursor-none">Reaction GIF</button>
                                <button type="button" id="opt-emo-oled" onclick="os.setOption('companion_emotion_mode','emo')" class="os-seg-btn ${emoMode === 'emo' ? 'active' : ''} hover-target cursor-none">OLED Robot Face</button>
                            </div>
                        </div>
                    </div>

                    <!-- Radio Anime GIF Backdrop -->
                    <div class="settings-row" data-search-item="radio gif anime visual background">
                        <div class="settings-row-main">
                            <div class="settings-row-icon"><i data-lucide="disc-3" class="w-3.5 h-3.5 text-emerald-300"></i></div>
                            <div>
                                <div class="settings-row-title">Radio Visual GIF Backdrop</div>
                                <div class="settings-row-desc">Show animated anime visuals behind the Global Radio vinyl deck.</div>
                            </div>
                        </div>
                        <button type="button" role="switch" aria-checked="${radioGifOn}"
                            onclick="os.setOption('radio_gif_enabled', SystemState.settings.radio_gif_enabled === 'on' ? 'off' : 'on')"
                            class="os-switch hover-target cursor-none" data-setting-switch="radio_gif_enabled" data-on="${radioGifOn}"></button>
                    </div>
                </div>
            `;
        },

        get voice() {
            const st = s();
            const volPct = Math.round((typeof st.media_tuner_volume === 'number' ? st.media_tuner_volume : 0.7) * 100);
            const ttsOn = st.speech_synthesis === 'on';
            const rate = Number(st.speech_rate || 0.92).toFixed(2);
            const pitch = Number(st.speech_pitch || 0.88).toFixed(2);

            return `
                <div class="settings-pane-header">
                    <div class="settings-pane-title">Sound &amp; Voice</div>
                    <div class="settings-pane-subtitle">System audio output level and browser-native speech synthesis.</div>
                </div>

                <div class="settings-section-label">Audio Output</div>
                <div class="settings-card">
                    <div class="settings-row" data-search-item="master volume audio output speaker">
                        <div class="settings-row-main">
                            <div class="settings-row-icon"><i data-lucide="volume-2" class="w-3.5 h-3.5 text-cyan-400"></i></div>
                            <div>
                                <div class="settings-row-title">Master Output Volume</div>
                                <div class="settings-row-desc">Controls Global Radio, ambient streams, and notification chimes.</div>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 w-44 shrink-0">
                            <input type="range" min="0" max="100" value="${volPct}"
                                oninput="os.adjustVolume(this.value/100);const l=document.getElementById('settings-vol-lbl');if(l)l.textContent=this.value+'%';"
                                class="w-full accent-white cursor-none hover-target">
                            <span id="settings-vol-lbl" class="text-xs font-mono text-gray-300 w-9 text-right">${volPct}%</span>
                        </div>
                    </div>
                </div>

                <div class="settings-section-label">Speech Synthesis (TTS)</div>
                <div class="settings-card">
                    <div class="settings-row" data-search-item="voice alerts speech synthesis tts">
                        <div class="settings-row-main">
                            <div class="settings-row-icon"><i data-lucide="mic" class="w-3.5 h-3.5 text-emerald-400"></i></div>
                            <div>
                                <div class="settings-row-title">Spoken Voice Alerts</div>
                                <div class="settings-row-desc">Read AI companion replies and system notifications aloud using local voices.</div>
                            </div>
                        </div>
                        <button type="button" id="opt-speech-toggle" role="switch" aria-checked="${ttsOn}"
                            onclick="os.setOption('speech_synthesis', SystemState.settings.speech_synthesis === 'on' ? 'off' : 'on')"
                            class="os-switch hover-target cursor-none" data-setting-switch="speech_synthesis" data-on="${ttsOn}"></button>
                    </div>

                    <div class="settings-subpanel ${ttsOn ? '' : 'is-collapsed'}" data-subpanel-for="speech_synthesis">
                        <div class="space-y-3">
                            <div class="flex items-center justify-between text-[10.5px] font-mono text-gray-400">
                                <span>Engine: <span id="speech-api-support" class="text-gray-300">Checking...</span></span>
                                <span>Quality: <span id="speech-voice-quality" class="text-emerald-400">Auto</span></span>
                            </div>

                            <select id="speech-voice-select" onchange="os.setOption('speech_voice', this.value)"
                                class="w-full px-3 py-2 rounded-lg bg-black/55 border border-white/10 text-xs text-white font-mono outline-none cursor-none hover-target">
                                <option value="auto-real">Auto · Best Available Local Voice</option>
                            </select>

                            <div class="grid grid-cols-2 gap-3">
                                <div class="p-2.5 rounded-lg bg-black/35 border border-white/[0.06]">
                                    <div class="flex justify-between text-[10px] font-mono text-gray-400 mb-1">
                                        <span>Rate</span><span id="speech-rate-val" class="text-white">${rate}x</span>
                                    </div>
                                    <input id="speech-rate-slider" type="range" min="0.75" max="1.15" step="0.01" value="${rate}"
                                        oninput="os.setSpeechTuning('speech_rate', this.value)" class="w-full accent-white cursor-none hover-target">
                                </div>
                                <div class="p-2.5 rounded-lg bg-black/35 border border-white/[0.06]">
                                    <div class="flex justify-between text-[10px] font-mono text-gray-400 mb-1">
                                        <span>Pitch</span><span id="speech-pitch-val" class="text-white">${pitch}</span>
                                    </div>
                                    <input id="speech-pitch-slider" type="range" min="0.72" max="1.12" step="0.01" value="${pitch}"
                                        oninput="os.setSpeechTuning('speech_pitch', this.value)" class="w-full accent-white cursor-none hover-target">
                                </div>
                            </div>

                            <div class="flex items-center gap-2">
                                <button type="button" onclick="os.testSpeechVoice()" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-medium text-white transition hover-target cursor-none">Test Voice</button>
                                <button type="button" onclick="window.speechSynthesis && window.speechSynthesis.cancel()" class="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/10 border border-white/10 text-xs text-gray-300 transition hover-target cursor-none">Stop</button>
                            </div>

                            <details class="rounded-lg border border-white/[0.07] bg-black/30 overflow-hidden">
                                <summary class="px-3 py-2 text-[11px] font-medium text-gray-300 hover:text-white flex items-center justify-between cursor-none hover-target list-none">
                                    <span>Browse All Installed Voices</span>
                                    <span id="voice-pack-count" class="text-[10px] font-mono text-gray-500">0 voices</span>
                                </summary>
                                <div class="p-2.5 pt-1 space-y-2 border-t border-white/[0.06]">
                                    <input id="voice-pack-search" type="text" placeholder="Filter by language or name..."
                                        oninput="os.renderVoicePackGrid()"
                                        class="w-full px-2.5 py-1.5 bg-black/55 border border-white/10 rounded-lg text-[11px] font-mono text-white outline-none">
                                    <div id="voice-pack-grid" class="max-h-40 overflow-y-auto space-y-1.5 pr-1"></div>
                                </div>
                            </details>
                        </div>
                    </div>
                </div>
            `;
        },

        get api() {
            const st = s();
            return `
                <div class="settings-pane-header">
                    <div class="settings-pane-title">Integrations</div>
                    <div class="settings-pane-subtitle">Optional API credentials stored locally in your browser. Leave blank to use built-in public feeds.</div>
                </div>

                <div class="settings-section-label">Music &amp; Social Telemetry</div>
                <div class="settings-card p-4 space-y-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" data-search-item="lastfm music scrobble api key username">
                        <div>
                            <label class="block text-[11px] font-medium text-gray-300 mb-1">Last.fm API Key</label>
                            <input type="password" id="cfg-lastfm" value="${esc(st.api_lastfm)}" placeholder="32-char API key"
                                class="w-full px-3 py-2 bg-black/45 border border-white/10 rounded-lg text-xs text-white font-mono outline-none focus:border-white/30">
                        </div>
                        <div>
                            <label class="block text-[11px] font-medium text-gray-300 mb-1">Last.fm Username</label>
                            <input type="text" id="cfg-lastfm-user" value="${esc(st.api_lastfm_user)}" placeholder="Username"
                                class="w-full px-3 py-2 bg-black/45 border border-white/10 rounded-lg text-xs text-white font-mono outline-none focus:border-white/30">
                        </div>
                    </div>

                    <div data-search-item="discord lanyard user id presence">
                        <label class="block text-[11px] font-medium text-gray-300 mb-1">Discord User ID (Lanyard Presence)</label>
                        <input type="text" id="cfg-discord" value="${esc(st.api_discord)}" placeholder="18-digit Discord snowflake ID"
                            class="w-full px-3 py-2 bg-black/45 border border-white/10 rounded-lg text-xs text-white font-mono outline-none focus:border-white/30">
                    </div>
                </div>

                <div class="settings-section-label">Feeds &amp; Developer</div>
                <div class="settings-card p-4 space-y-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" data-search-item="github username reddit subreddits">
                        <div>
                            <label class="block text-[11px] font-medium text-gray-300 mb-1">GitHub Username</label>
                            <input type="text" id="cfg-github" value="${esc(st.api_github)}" placeholder="octocat"
                                class="w-full px-3 py-2 bg-black/45 border border-white/10 rounded-lg text-xs text-white font-mono outline-none focus:border-white/30">
                        </div>
                        <div>
                            <label class="block text-[11px] font-medium text-gray-300 mb-1">Custom Subreddits</label>
                            <input type="text" id="cfg-subreddits" value="${esc(st.api_custom_subreddits)}" placeholder="technology, linux, space"
                                class="w-full px-3 py-2 bg-black/45 border border-white/10 rounded-lg text-xs text-white font-mono outline-none focus:border-white/30">
                        </div>
                    </div>
                    <div data-search-item="rss xml feed url">
                        <label class="block text-[11px] font-medium text-gray-300 mb-1">Custom RSS Feed URL</label>
                        <input type="text" id="cfg-rss" value="${esc(st.api_rss)}" placeholder="https://hnrss.org/frontpage"
                            class="w-full px-3 py-2 bg-black/45 border border-white/10 rounded-lg text-xs text-white font-mono outline-none focus:border-white/30">
                    </div>
                </div>

                <div class="mt-4 flex items-center justify-end gap-2">
                    <button type="button" onclick="os.saveSettings()" class="px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:bg-gray-200 transition hover-target cursor-none">Save Integrations</button>
                </div>
            `;
        },

        get system() {
            const counts = countModules();
            return `
                <div class="settings-pane-header">
                    <div class="settings-pane-title">System &amp; Reset</div>
                    <div class="settings-pane-subtitle">Runtime diagnostics, local storage footprint, and safe workspace recovery.</div>
                </div>

                <div class="settings-section-label">Runtime Snapshot</div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono" data-search-item="diagnostics hardware cpu memory storage">
                    <div class="settings-card p-3.5 space-y-2">
                        <div class="text-[10px] text-gray-400 uppercase tracking-wider">Workspace</div>
                        <div class="flex justify-between"><span class="text-gray-500">Enabled Modules</span><span class="text-white">${counts.enabled} / ${counts.total}</span></div>
                        <div class="flex justify-between"><span class="text-gray-500">Open Windows</span><span class="text-emerald-400" id="settings-open-wins">--</span></div>
                        <div class="flex justify-between"><span class="text-gray-500">Saved State</span><span class="text-white" id="settings-state-size">--</span></div>
                        <div class="flex justify-between"><span class="text-gray-500">Profile</span><span class="text-emerald-400" id="sys-diagnostic-power">ECO</span></div>
                    </div>
                    <div class="settings-card p-3.5 space-y-2">
                        <div class="text-[10px] text-gray-400 uppercase tracking-wider">Host Environment</div>
                        <div class="flex justify-between"><span class="text-gray-500">CPU Threads</span><span class="text-white">${navigator.hardwareConcurrency || '--'}</span></div>
                        <div class="flex justify-between"><span class="text-gray-500">Device Memory</span><span class="text-white">${navigator.deviceMemory ? navigator.deviceMemory + ' GB' : '--'}</span></div>
                        <div class="flex justify-between"><span class="text-gray-500">Pixel Ratio</span><span class="text-white">${window.devicePixelRatio || 1}x</span></div>
                        <div class="flex justify-between"><span class="text-gray-500">Network</span><span class="${navigator.onLine ? 'text-emerald-400' : 'text-red-400'}">${navigator.onLine ? 'Online' : 'Offline'}</span></div>
                    </div>
                    <div class="settings-card p-3.5 sm:col-span-2 flex items-center justify-between gap-3">
                        <div>
                            <div class="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">JS Heap Telemetry</div>
                            <div id="settings-mem-snapshot" class="text-gray-300 text-[11px]">Querying heap...</div>
                        </div>
                        <button type="button" onclick="os.sysmonCopyReport && os.sysmonCopyReport()" class="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/12 border border-white/10 text-[11px] font-sans font-medium text-gray-200 transition hover-target cursor-none shrink-0">Copy Report</button>
                    </div>
                </div>

                <div class="settings-section-label">Portability &amp; Offline App</div>
                <div class="settings-card">
                    <div class="settings-row" data-search-item="backup restore export import snapshot aether encrypted aes">
                        <div class="settings-row-main">
                            <div class="settings-row-icon"><i data-lucide="archive" class="w-3.5 h-3.5 text-emerald-400"></i></div>
                            <div>
                                <div class="settings-row-title">Workspace Snapshot (.aether.json)</div>
                                <div class="settings-row-desc">Export or restore settings, notes, Dev Studio tabs, and uploaded files (supports AES-256 encryption).</div>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                            <button type="button" onclick="window.AetherBackup && AetherBackup.triggerImportUI()" class="px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/12 border border-white/10 text-xs font-medium text-gray-200 transition hover-target cursor-none">Import</button>
                            <button type="button" onclick="window.AetherBackup && AetherBackup.triggerExportUI()" class="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-xs font-medium text-emerald-200 transition hover-target cursor-none">Export</button>
                        </div>
                    </div>

                    <div class="settings-row" data-search-item="pwa install standalone desktop offline service worker">
                        <div class="settings-row-main">
                            <div class="settings-row-icon"><i data-lucide="monitor-down" class="w-3.5 h-3.5 text-sky-400"></i></div>
                            <div>
                                <div class="settings-row-title">Install Standalone Desktop App (PWA)</div>
                                <div class="settings-row-desc">Run AetherOS in its own borderless OS window with offline shell caching.</div>
                            </div>
                        </div>
                        <button type="button" onclick="window.AetherBackup && AetherBackup.installPWA()" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-medium text-white transition hover-target cursor-none shrink-0">Install App</button>
                    </div>
                </div>

                <div class="settings-section-label">Recovery &amp; Reset</div>
                <div class="settings-card">
                    <div class="settings-row" data-search-item="restore clean defaults disable gimmicks modules">
                        <div class="settings-row-main">
                            <div class="settings-row-icon"><i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-sky-400"></i></div>
                            <div>
                                <div class="settings-row-title">Restore Clean Workspace Defaults</div>
                                <div class="settings-row-desc">Turns off optional modules and desktop toys while keeping your notes, files, and API keys intact.</div>
                            </div>
                        </div>
                        <button type="button" onclick="os.restoreCleanDefaults()" class="px-3 py-1.5 rounded-lg bg-white/[0.07] hover:bg-white/14 border border-white/12 text-xs font-medium text-white transition hover-target cursor-none shrink-0">Restore Clean</button>
                    </div>

                    <div class="settings-row" data-search-item="factory reset wipe format localstorage">
                        <div class="settings-row-main">
                            <div class="settings-row-icon"><i data-lucide="trash-2" class="w-3.5 h-3.5 text-red-400"></i></div>
                            <div>
                                <div class="settings-row-title text-red-300">Factory Reset AetherOS</div>
                                <div class="settings-row-desc">Erases all saved settings, virtual files, notes, and API keys from this browser.</div>
                            </div>
                        </div>
                        <button type="button" onclick="os.confirmFactoryReset()" class="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-xs font-medium text-red-300 transition hover-target cursor-none shrink-0">Factory Reset</button>
                    </div>
                </div>
            `;
        }
    };
})();
