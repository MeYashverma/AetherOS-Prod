// AetherOS — Browser Engine, Floor796 Mirror, WPlace Canvas, Global Signal Feed & Discord Lanyard/Webhook
window.extendOS({
    lanyardData: null,

    lanyardReconnectTimer: null,

    lanyardReconnectAttempts: 0,

    presenceActivityType: (type) => ({0:'PLAYING',1:'STREAMING',2:'LISTENING',3:'WATCHING',4:'CUSTOM STATUS',5:'COMPETING'}[type] || 'ACTIVITY'),

    presenceStatusMeta: (status='offline') => ({
                online: { label:'ONLINE', dot:'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.75)]', text:'text-green-400', ring:'border-green-500/40' },
                idle: { label:'IDLE', dot:'bg-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.75)]', text:'text-yellow-300', ring:'border-yellow-500/40' },
                dnd: { label:'DO NOT DISTURB', dot:'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.75)]', text:'text-red-400', ring:'border-red-500/40' },
                offline: { label:'OFFLINE', dot:'bg-gray-700', text:'text-gray-500', ring:'border-white/10' }
            }[status] || { label:String(status).toUpperCase(), dot:'bg-gray-700', text:'text-gray-500', ring:'border-white/10' }),

    presenceFormatTime: (ms) => {
                if (!ms) return '--';
                const total = Math.max(0, Math.floor(ms / 1000));
                const h = Math.floor(total / 3600);
                const m = Math.floor((total % 3600) / 60);
                const s = total % 60;
                return h ? `${h}h ${m}m` : `${m}:${String(s).padStart(2,'0')}`;
            },

    presenceAssetUrl: (act, key) => {
                if (!act || !key) return '';
                if (key.startsWith('spotify:')) return '';
                if (key.startsWith('mp:external/')) {
                    const httpsIdx = key.indexOf('https/');
                    const httpIdx = key.indexOf('http/');
                    if (httpsIdx >= 0) return 'https://' + key.slice(httpsIdx + 6);
                    if (httpIdx >= 0) return 'http://' + key.slice(httpIdx + 5);
                }
                if (/^https?:\/\//.test(key)) return key;
                if (act.application_id) return `https://cdn.discordapp.com/app-assets/${act.application_id}/${key}.png?size=160`;
                return '';
            },

    presenceAvatarUrl: (user, size=256) => {
                if (!user) return '';
                if (user.avatar) {
                    const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
                    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=${size}`;
                }
                const discrim = Number(user.discriminator || 0);
                return `https://cdn.discordapp.com/embed/avatars/${discrim % 5}.png`;
            },

    initLanyardPresence: () => {
                const userId = String(SystemState.settings.api_discord || '').trim();
                const sidebarLed = document.getElementById('sidebar-discord-status');
                clearTimeout(os.lanyardReconnectTimer);
                if (!/^\d{17,20}$/.test(userId)) {
                    if (sidebarLed) sidebarLed.className = 'w-2 h-2 rounded-full bg-gray-700';
                    const name = document.getElementById('sidebar-discord-name'); if (name) name.innerText = 'Offline';
                    const act = document.getElementById('sidebar-discord-activity'); if (act) act.innerText = 'Configure Discord ID';
                    const img = document.getElementById('sidebar-discord-avatar'); if (img) img.className = 'hidden';
                    const fb = document.getElementById('sidebar-discord-fallback'); if (fb) fb.className = 'w-5 h-5 text-white/20';
                    os.lanyardData = null;
                    os.renderPresenceOfflineSlate(false);
                    return;
                }
                if (os.lanyardSocket) {
                    try { clearInterval(os.lanyardHeartbeat); os.lanyardSocket.onclose = null; os.lanyardSocket.close(); } catch(e) {}
                }
                os.logTerminal(`Lanyard API: Opening enhanced realtime uplink for ID ${userId}`);
                const socket = new WebSocket('wss://api.lanyard.rest/v1');
                os.lanyardSocket = socket;
                socket.onopen = () => {
                    os.lanyardReconnectAttempts = 0;
                    socket.send(JSON.stringify({ op: 2, d: { subscribe_to_id: userId } }));
                    os.renderPresenceConnectionState('HANDSHAKE_OK');
                };
                socket.onmessage = (event) => {
                    if (window._networkBytes !== undefined) window._networkBytes += event.data.length;
                    let frame; try { frame = JSON.parse(event.data); } catch(e) { return; }
                    if (frame.op === 1) {
                        clearInterval(os.lanyardHeartbeat);
                        os.lanyardHeartbeat = setInterval(() => {
                            if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ op: 3 }));
                        }, frame.d.heartbeat_interval);
                    }
                    if (frame.op === 0 && (frame.t === 'INIT_STATE' || frame.t === 'PRESENCE_UPDATE')) os.syncPresenceState(frame.d);
                };
                socket.onerror = () => {
                    os.logTerminal('Lanyard WS: gateway fault; trying REST fallback.');
                    os.fetchLanyardRESTFallback(userId);
                };
                socket.onclose = () => {
                    clearInterval(os.lanyardHeartbeat);
                    os.renderPresenceConnectionState('SOCKET_CLOSED');
                    const delay = Math.min(30000, 1500 * Math.pow(1.7, os.lanyardReconnectAttempts++));
                    if (!document.hidden && SystemState.settings.api_discord === userId) {
                        os.lanyardReconnectTimer = setTimeout(() => os.initLanyardPresence(), delay);
                    }
                };
            },

    renderPresenceConnectionState: (label) => {
                const el = document.getElementById('presence-uplink-state');
                if (el) el.innerText = label;
            },

    fetchLanyardRESTFallback: async (userId) => {
                try {
                    const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
                    const body = await res.json();
                    if (!body.success) throw new Error(body.error?.message || 'User presence unreachable');
                    os.syncPresenceState(body.data, true);
                } catch(e) {
                    os.logTerminal(`Lanyard REST Fail: ${e.message}`);
                    os.renderPresenceOfflineSlate(true);
                }
            },

    syncPresenceState: (data, viaRest=false) => {
                if (os.companion && os.companion.observeEvent) {
                    os.companion.observeEvent('discord_presence', data);
                }
                if (!data || !data.discord_user) { os.renderPresenceOfflineSlate(true); return; }
                os.lanyardData = { ...data, _lastSync: Date.now(), _transport: viaRest ? 'REST_FALLBACK' : 'REALTIME_SOCKET' };
                const user = data.discord_user;
                const status = data.discord_status || 'offline';
                const meta = os.presenceStatusMeta(status);
                const avatarUrl = os.presenceAvatarUrl(user, 128);
                const sidebarLed = document.getElementById('sidebar-discord-status');
                const sidebarAvatarImg = document.getElementById('sidebar-discord-avatar');
                const sidebarAvatarFallback = document.getElementById('sidebar-discord-fallback');
                const sidebarName = document.getElementById('sidebar-discord-name');
                const sidebarActivity = document.getElementById('sidebar-discord-activity');
                if (sidebarLed) sidebarLed.className = `w-2 h-2 rounded-full ${meta.dot}`;
                if (sidebarName) sidebarName.innerText = user.global_name || user.username;
                if (avatarUrl && sidebarAvatarImg) { sidebarAvatarImg.src = avatarUrl; sidebarAvatarImg.classList.remove('hidden'); }
                if (sidebarAvatarFallback) sidebarAvatarFallback.classList.add('hidden');
                const custom = (data.activities || []).find(a => a.type === 4);
                const rich = (data.activities || []).find(a => a.type !== 4 && a.type !== 2);
                const top = data.listening_to_spotify && data.spotify ? `Spotify: ${data.spotify.track}` : (rich ? `${os.presenceActivityType(rich.type)} ${rich.name}` : (custom?.state || meta.label));
                if (sidebarActivity) sidebarActivity.innerText = top;
                if (document.getElementById('presence-console-panel')) os.drawPresenceConsoleDOM(os.lanyardData);
            },

    renderPresenceOfflineSlate: (isError = false) => {
                const root = document.getElementById('presence-console-panel');
                if (!root) return;
                root.innerHTML = `
                    <div class="flex flex-col h-full justify-center items-center p-6 text-center bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_55%)]">
                        <div class="w-24 h-24 rounded-full border border-white/10 mb-6 flex items-center justify-center relative shadow-[0_0_60px_rgba(255,255,255,0.06)] bg-os-800">
                            <i data-lucide="${isError ? 'radio-tower' : 'user-x'}" class="w-11 h-11 ${isError ? 'text-red-400' : 'text-gray-500'}"></i>
                        </div>
                        <h3 class="font-display tracking-widest text-xl text-white uppercase">${isError ? 'Uplink Unreachable' : 'Discord Uplink Offline'}</h3>
                        <p class="font-mono text-xs text-gray-500 mt-2 max-w-md leading-relaxed">
                            ${isError ? 'Lanyard could not return presence data. Confirm the Discord ID is correct and that the account is registered with Lanyard.' : 'Configure your 17-20 digit Discord User ID in Settings → API Configuration. Lanyard must be enabled for realtime presence.'}
                        </p>
                        <div class="flex gap-2 mt-6">
                            <button onclick="os.openWindow('settings')" class="px-4 py-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded hover:bg-white/10 hover-target cursor-none transition-colors">Configure Uplink</button>
                            <button onclick="os.initLanyardPresence()" class="px-4 py-2 bg-white text-black text-xs font-mono uppercase rounded hover:bg-gray-200 hover-target cursor-none transition-colors">Retry</button><button onclick="os.setPresenceSubView('webhook')" class="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-300 text-xs font-mono uppercase rounded hover:bg-green-500/20 hover-target cursor-none transition-colors">Webhook TX</button>
                        </div>
                    </div>`;
                lucide.createIcons({root});
            },

    drawPresenceConsoleDOM: (data=os.lanyardData) => {
                const root = document.getElementById('presence-console-panel');
                if (!root || !data || !data.discord_user) return;
                const esc = (v) => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
                const user = data.discord_user;
                const status = data.discord_status || 'offline';
                const meta = os.presenceStatusMeta(status);
                const avatarUrl = os.presenceAvatarUrl(user, 256);
                const devices = [data.active_on_discord_desktop && 'Desktop', data.active_on_discord_web && 'Web', data.active_on_discord_mobile && 'Mobile'].filter(Boolean);
                const flags = [user.bot && 'BOT', user.system && 'SYSTEM', user.public_flags ? `FLAGS:${user.public_flags}` : '', user.primary_guild?.tag ? `GUILD:${user.primary_guild.tag}` : ''].filter(Boolean);
                const activities = data.activities || [];
                const custom = activities.find(a => a.type === 4);
                const nonSpotifyActs = activities.filter(a => !(a.type === 2 && data.listening_to_spotify));
                const now = Date.now();
                const activityCards = [];
                if (data.listening_to_spotify && data.spotify) {
                    const sp = data.spotify;
                    const start = sp.timestamps?.start || 0, end = sp.timestamps?.end || 0;
                    const pct = start && end ? Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100)) : 0;
                    activityCards.push(`<div class="bg-green-950/20 border border-green-500/20 rounded-xl p-3 shadow-os-recessed">
                        <div class="flex gap-3 items-center"><img src="${esc(sp.album_art_url)}" class="w-16 h-16 rounded-lg object-cover border border-green-500/20" loading="lazy"><div class="min-w-0 flex-1"><div class="text-[9px] text-green-400 font-bold uppercase tracking-widest flex items-center gap-1"><i data-lucide="music" class="w-3 h-3"></i> Spotify Listening Session</div><div class="text-white font-bold truncate">${esc(sp.track)}</div><div class="text-gray-400 truncate text-[10px]">${esc(sp.artist)} · ${esc(sp.album || '')}</div><div class="mt-2 h-1.5 bg-black/50 rounded overflow-hidden"><div class="h-full bg-green-400" style="width:${pct}%"></div></div><div class="flex justify-between text-[8px] text-gray-500 mt-1"><span>${os.presenceFormatTime(now-start)}</span><span>${os.presenceFormatTime(end-start)}</span></div></div></div>
                    </div>`);
                }
                nonSpotifyActs.forEach(act => {
                    const large = os.presenceAssetUrl(act, act.assets?.large_image);
                    const small = os.presenceAssetUrl(act, act.assets?.small_image);
                    const start = act.timestamps?.start || 0, end = act.timestamps?.end || 0;
                    const elapsed = start ? os.presenceFormatTime(now - start) : '';
                    const pct = start && end ? Math.max(0, Math.min(100, ((now-start)/(end-start))*100)) : 0;
                    const details = [act.details, act.state].filter(Boolean).join(' // ');
                    activityCards.push(`<div class="bg-black/40 border border-white/5 rounded-xl p-3 flex gap-3 shadow-os-recessed items-center">
                        <div class="relative w-16 h-16 rounded-lg bg-os-800 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">${large ? `<img src="${esc(large)}" class="w-full h-full object-cover" loading="lazy">` : `<i data-lucide="${act.type===4?'message-circle':'gamepad-2'}" class="w-7 h-7 text-os-accent"></i>`}${small ? `<img src="${esc(small)}" class="absolute -right-1 -bottom-1 w-6 h-6 rounded-full border-2 border-black object-cover">` : ''}</div>
                        <div class="min-w-0 flex-1"><div class="text-[9px] text-os-accent font-bold uppercase tracking-widest">${os.presenceActivityType(act.type)}</div><div class="text-white font-bold truncate">${esc(act.name || 'Custom Status')}</div><div class="text-gray-400 truncate text-[10px] uppercase">${esc(details || act.emoji?.name || '')}</div>${elapsed ? `<div class="text-[9px] text-gray-500 mt-1">elapsed ${elapsed}</div>` : ''}${pct ? `<div class="mt-2 h-1 bg-os-900 rounded overflow-hidden"><div class="h-full bg-white/50" style="width:${pct}%"></div></div>` : ''}</div>
                    </div>`);
                });
                const kv = data.kv && Object.keys(data.kv).length ? Object.entries(data.kv).slice(0,6).map(([k,v]) => `<div class="flex justify-between gap-2"><span class="text-gray-500 truncate">${esc(k)}</span><b class="text-white truncate">${esc(v)}</b></div>`).join('') : '<div class="text-gray-600">No public KV records.</div>';
                root.innerHTML = `<div class="flex flex-col h-full overflow-hidden text-[10px] font-mono">
                    <div class="grid grid-cols-[86px_1fr_auto] gap-4 items-center border-b border-white/5 pb-4 shrink-0">
                        <div class="relative"><div class="w-20 h-20 rounded-2xl overflow-hidden border ${meta.ring} bg-os-700 shadow-os-recessed">${avatarUrl ? `<img src="${esc(avatarUrl)}" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center text-2xl text-white">${esc(user.username?.[0] || '?')}</div>`}</div><span class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-black ${meta.dot}"></span></div>
                        <div class="min-w-0"><div class="flex items-center gap-2 flex-wrap"><span class="text-xl font-display tracking-wider text-white uppercase truncate">${esc(user.global_name || user.username)}</span><span class="px-2 py-0.5 rounded border border-white/10 bg-white/5 ${meta.text} uppercase">${meta.label}</span></div><div class="text-gray-400 mt-1">@${esc(user.username)} <span class="text-gray-600">ID:${esc(user.id)}</span></div>${custom?.state ? `<div class="text-os-accent italic mt-1 truncate">“${esc(custom.state)}”</div>` : ''}<div class="flex flex-wrap gap-1 mt-2">${[...devices, ...flags].map(x=>`<span class="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400 uppercase">${esc(x)}</span>`).join('') || '<span class="text-gray-600">No active client device.</span>'}</div></div>
                        <div class="text-right space-y-1"><div class="text-[8px] text-gray-500 uppercase">Transport</div><div id="presence-uplink-state" class="text-os-accent font-bold">${esc(data._transport || 'REALTIME_SOCKET')}</div><div class="text-gray-600">${new Date(data._lastSync || Date.now()).toLocaleTimeString()}</div><div class="flex gap-1 justify-end"><button onclick="os.initLanyardPresence()" class="mt-1 px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 cursor-none hover-target">Reconnect</button><button onclick="os.setPresenceSubView('webhook')" class="mt-1 px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-300 hover:bg-green-500/20 cursor-none hover-target">Webhook TX</button></div></div>
                    </div>
                    <div class="grid grid-cols-12 gap-3 flex-1 min-h-0 pt-4">
                        <div class="col-span-8 min-h-0 flex flex-col"><div class="text-[9px] text-os-accent tracking-widest uppercase mb-2">Active Presences (${activities.length})</div><div class="space-y-3 overflow-y-auto pr-1 no-scrollbar">${activityCards.join('') || '<div class="py-8 text-center text-gray-500 border border-white/5 bg-black/20 rounded-xl">NO ACTIVE GAME / MEDIA / CUSTOM TELEMETRY DETECTED.</div>'}</div></div>
                        <div class="col-span-4 min-h-0 space-y-3 overflow-y-auto no-scrollbar"><div class="bg-black/30 border border-white/5 rounded-xl p-3"><div class="text-[9px] text-os-accent uppercase mb-2">Client Matrix</div><div class="grid grid-cols-3 gap-2 text-center"><div class="p-2 rounded bg-white/[0.03] border border-white/5 ${data.active_on_discord_desktop?'text-green-400':'text-gray-600'}"><i data-lucide="monitor" class="w-4 h-4 mx-auto mb-1"></i>Desktop</div><div class="p-2 rounded bg-white/[0.03] border border-white/5 ${data.active_on_discord_web?'text-green-400':'text-gray-600'}"><i data-lucide="globe" class="w-4 h-4 mx-auto mb-1"></i>Web</div><div class="p-2 rounded bg-white/[0.03] border border-white/5 ${data.active_on_discord_mobile?'text-green-400':'text-gray-600'}"><i data-lucide="smartphone" class="w-4 h-4 mx-auto mb-1"></i>Mobile</div></div></div><div class="bg-black/30 border border-white/5 rounded-xl p-3"><div class="text-[9px] text-os-accent uppercase mb-2">Public KV / Metadata</div><div class="space-y-1">${kv}</div></div><div class="bg-black/30 border border-white/5 rounded-xl p-3"><div class="text-[9px] text-os-accent uppercase mb-2">Raw Counters</div><div class="space-y-1"><div class="flex justify-between"><span class="text-gray-500">Activities</span><b class="text-white">${activities.length}</b></div><div class="flex justify-between"><span class="text-gray-500">Spotify</span><b class="text-white">${data.listening_to_spotify?'YES':'NO'}</b></div><div class="flex justify-between"><span class="text-gray-500">Avatar</span><b class="text-white">${user.avatar?'CUSTOM':'DEFAULT'}</b></div></div></div></div>
                    </div>
                    <div class="border-t border-white/5 pt-2 mt-3 text-[9px] text-os-accent flex justify-between shrink-0"><span>UPLINK PRESENCE // LANYARD v1</span><span>${navigator.onLine ? 'NETWORK ONLINE' : 'NETWORK OFFLINE'}</span></div>
                </div>`;
                lucide.createIcons({root});
            },

    presenceSubView: 'presence',

    presenceWebhookStatus: 'STANDBY',

    webhookLogs: [],

    webhookEscape: (v='') => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])),

    setPresenceSubView: (view) => {
                os.presenceSubView = view;
                if (view === 'webhook') os.renderPresenceWebhookComposer();
                else if (os.lanyardData) os.drawPresenceConsoleDOM(os.lanyardData);
                else os.renderPresenceDashboard();
            },

    renderPresenceDashboard: () => {
                if (os.presenceSubView === 'webhook') return os.renderPresenceWebhookComposer();
                if (os.lanyardData) return os.drawPresenceConsoleDOM(os.lanyardData);
                const userId = SystemState.settings.api_discord;
                if (!userId) return os.renderPresenceOfflineSlate(false);
                const root = document.getElementById('presence-console-panel');
                if (root) root.innerHTML = `<div class="h-full flex items-center justify-center text-center p-6"><div><div class="w-14 h-14 mx-auto mb-4 rounded-full border border-white/10 flex items-center justify-center bg-white/5 animate-pulse"><i data-lucide="radio" class="w-7 h-7 text-os-accent"></i></div><div class="text-white font-display uppercase tracking-widest">Opening Discord uplink...</div><div class="text-gray-500 mt-2">Connecting to Lanyard realtime gateway for ${os.webhookEscape(userId)}</div><button onclick="os.setPresenceSubView('webhook')" class="mt-4 px-3 py-1.5 rounded bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 cursor-none hover-target uppercase text-[9px]">Open Webhook TX</button></div></div>`;
                lucide.createIcons({root});
                os.initLanyardPresence();
            },

    webhookLoadLogs: () => {
                try { os.webhookLogs = JSON.parse(localStorage.getItem('AetherOS_WebhookLogs') || '[]'); } catch(e) { os.webhookLogs = []; }
                return os.webhookLogs;
            },

    webhookPushLog: (status, detail) => {
                os.webhookLoadLogs();
                os.webhookLogs.unshift({ status, detail, time: new Date().toLocaleString() });
                os.webhookLogs = os.webhookLogs.slice(0, 24);
                localStorage.setItem('AetherOS_WebhookLogs', JSON.stringify(os.webhookLogs));
                os.renderWebhookLogs();
            },

    webhookSaveFields: () => {
                const get = id => document.getElementById(id)?.value || '';
                SystemState.settings.discord_webhook_url = get('wh-url').trim();
                SystemState.settings.discord_webhook_username = get('wh-username').trim();
                SystemState.settings.discord_webhook_avatar = get('wh-avatar').trim();
                SystemState.save();
            },

    renderPresenceWebhookComposer: () => {
                const root = document.getElementById('presence-console-panel'); if (!root) return;
                const s = SystemState.settings;
                os.webhookLoadLogs();
                root.innerHTML = `
                    <div class="flex flex-col h-full overflow-hidden text-[10px] font-mono">
                        <div class="flex items-center justify-between border-b border-white/5 pb-3 mb-3 shrink-0">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl wh-glass wh-radar flex items-center justify-center"><i data-lucide="send" class="w-5 h-5 text-green-400 relative z-10"></i></div>
                                <div><div class="text-white font-display uppercase tracking-widest text-lg leading-none">Webhook Transmitter</div><div class="text-gray-500 mt-1">Client-side Discord webhook payload console</div></div>
                            </div>
                            <div class="flex items-center gap-2">
                                <button onclick="os.setPresenceSubView('presence')" class="wh-btn cursor-none hover-target">Presence</button>
                                <button onclick="os.setPresenceSubView('webhook')" class="wh-btn active cursor-none hover-target">Webhook TX</button>
                                <span id="wh-status" class="px-2 py-1 rounded border border-white/10 bg-white/5 text-gray-300 font-bold">${os.presenceWebhookStatus || 'STANDBY'}</span>
                            </div>
                        </div>
                        <div class="grid grid-cols-12 gap-3 flex-1 min-h-0">
                            <div class="col-span-7 min-h-0 overflow-y-auto pr-1 no-scrollbar space-y-3">
                                <div class="wh-glass rounded-xl p-3 space-y-2">
                                    <div class="flex justify-between items-center"><div class="text-os-accent uppercase tracking-widest text-[9px]">Webhook Link</div><div class="flex gap-1"><button onclick="os.webhookCopyUrl()" class="wh-btn py-1 px-2 cursor-none hover-target">Copy</button><button onclick="os.webhookClearUrl()" class="wh-btn py-1 px-2 cursor-none hover-target text-red-300">Clear</button></div></div>
                                    <input id="wh-url" type="password" class="wh-input" placeholder="https://discord.com/api/webhooks/..." value="${os.webhookEscape(s.discord_webhook_url || '')}" oninput="os.webhookSaveFields();os.webhookUpdatePreview()">
                                    <div class="grid grid-cols-2 gap-2"><input id="wh-username" class="wh-input" placeholder="Username override" value="${os.webhookEscape(s.discord_webhook_username || 'AetherOS Uplink')}" oninput="os.webhookSaveFields();os.webhookUpdatePreview()"><input id="wh-avatar" class="wh-input" placeholder="Avatar URL override" value="${os.webhookEscape(s.discord_webhook_avatar || '')}" oninput="os.webhookSaveFields();os.webhookUpdatePreview()"></div>
                                </div>
                                <div class="wh-glass rounded-xl p-3 space-y-2">
                                    <div class="flex items-center justify-between"><div class="text-os-accent uppercase tracking-widest text-[9px]">Message Markdown</div><div class="flex gap-1"><button onclick="os.webhookPreset('alert')" class="wh-btn py-1 px-2 cursor-none hover-target">Alert</button><button onclick="os.webhookPreset('log')" class="wh-btn py-1 px-2 cursor-none hover-target">System Log</button><button onclick="os.webhookPreset('status')" class="wh-btn py-1 px-2 cursor-none hover-target">Status</button><button onclick="os.webhookPreset('media')" class="wh-btn py-1 px-2 cursor-none hover-target">Media</button></div></div>
                                    <textarea id="wh-content" class="wh-input h-24 resize-none" maxlength="1900" placeholder="Write Discord markdown message..." oninput="os.webhookUpdatePreview()"></textarea>
                                    <div class="flex justify-between text-[9px] text-gray-500"><label class="flex items-center gap-2 cursor-none hover-target"><input id="wh-timestamp" type="checkbox" class="accent-green-500" onchange="os.webhookUpdatePreview()"> inject timestamp</label><span><b id="wh-char-count" class="text-white">0</b>/1900 chars · <b id="wh-payload-size" class="text-white">0</b> bytes</span></div>
                                </div>
                                <div class="wh-glass rounded-xl p-3 space-y-2">
                                    <div class="flex justify-between items-center"><div class="text-os-accent uppercase tracking-widest text-[9px]">Embed Builder</div><label class="flex items-center gap-2 text-gray-400 cursor-none hover-target"><input id="wh-embed-enabled" type="checkbox" class="accent-green-500" onchange="os.webhookToggleEmbed();os.webhookUpdatePreview()"> Embed mode</label></div>
                                    <div id="wh-embed-fields" class="grid grid-cols-2 gap-2 opacity-45 pointer-events-none">
                                        <input id="wh-embed-title" class="wh-input col-span-2" placeholder="Embed title" oninput="os.webhookUpdatePreview()">
                                        <textarea id="wh-embed-desc" class="wh-input col-span-2 h-20 resize-none" placeholder="Embed description (markdown supported)" oninput="os.webhookUpdatePreview()"></textarea>
                                        <input id="wh-embed-color" type="color" class="wh-input h-9 p-1" value="#22c55e" oninput="os.webhookUpdatePreview()">
                                        <input id="wh-embed-footer" class="wh-input" placeholder="Footer" oninput="os.webhookUpdatePreview()">
                                        <input id="wh-embed-thumb" class="wh-input col-span-2" placeholder="Thumbnail URL" oninput="os.webhookUpdatePreview()">
                                    </div>
                                </div>
                            </div>
                            <div class="col-span-5 min-h-0 flex flex-col gap-3">
                                <div class="wh-glass rounded-xl p-3 flex-1 min-h-0 overflow-y-auto no-scrollbar">
                                    <div class="flex justify-between items-center mb-2"><div class="text-os-accent uppercase tracking-widest text-[9px]">Live Payload Preview</div><span class="flex items-center gap-1 text-green-400"><span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> LOCAL RENDER</span></div>
                                    <div id="wh-preview" class="rounded-lg bg-[#111214] border border-white/10 p-3 text-gray-300 min-h-[150px]"></div>
                                </div>
                                <div class="wh-glass rounded-xl p-3 shrink-0">
                                    <div class="grid grid-cols-2 gap-2"><button id="wh-send-btn" onclick="os.webhookSend(false)" class="wh-btn bg-green-500/15 border-green-500/25 text-green-300 cursor-none hover-target font-bold">Transmit Message</button><button onclick="os.webhookSend(true)" class="wh-btn cursor-none hover-target">Test Link</button></div>
                                </div>
                                <div class="wh-glass rounded-xl p-3 h-40 shrink-0 overflow-hidden"><div class="flex justify-between mb-2"><div class="text-os-accent uppercase tracking-widest text-[9px]">Delivery Logs</div><button onclick="os.webhookClearLogs()" class="text-red-400 hover:text-red-300 cursor-none hover-target">CLEAR</button></div><div id="wh-logs" class="space-y-1 overflow-y-auto h-28 pr-1 no-scrollbar"></div></div>
                            </div>
                        </div>
                    </div>`;
                os.webhookUpdatePreview(); os.renderWebhookLogs(); lucide.createIcons({root});
            },

    webhookToggleEmbed: () => {
                const enabled = document.getElementById('wh-embed-enabled')?.checked;
                const fields = document.getElementById('wh-embed-fields');
                if (fields) fields.className = `grid grid-cols-2 gap-2 ${enabled ? 'opacity-100 pointer-events-auto' : 'opacity-45 pointer-events-none'}`;
            },

    webhookMarkdownLite: (txt='') => os.webhookEscape(txt).replace(/\*\*(.*?)\*\*/g,'<b class="text-white">$1</b>').replace(/\*(.*?)\*/g,'<i>$1</i>').replace(/`([^`]+)`/g,'<code class="bg-black/40 px-1 rounded text-green-300">$1</code>').replace(/\n/g,'<br>'),

    webhookBuildPayload: (test=false) => {
                const get = id => document.getElementById(id)?.value || '';
                let content = test ? 'AetherOS webhook connection test packet.' : get('wh-content');
                if (document.getElementById('wh-timestamp')?.checked) content += `\n\n<t:${Math.floor(Date.now()/1000)}:F>`;
                const payload = { content: content.slice(0, 2000) };
                const username = get('wh-username').trim(); if (username) payload.username = username.slice(0,80);
                const avatar = get('wh-avatar').trim(); if (/^https?:\/\//.test(avatar)) payload.avatar_url = avatar;
                if (document.getElementById('wh-embed-enabled')?.checked && !test) {
                    const colorHex = get('wh-embed-color') || '#22c55e';
                    const embed = { title:get('wh-embed-title').slice(0,256), description:get('wh-embed-desc').slice(0,4096), color:parseInt(colorHex.replace('#',''),16) || 2263278 };
                    const footer=get('wh-embed-footer').trim(); if (footer) embed.footer={text:footer.slice(0,2048)};
                    const thumb=get('wh-embed-thumb').trim(); if (/^https?:\/\//.test(thumb)) embed.thumbnail={url:thumb};
                    if (document.getElementById('wh-timestamp')?.checked) embed.timestamp = new Date().toISOString();
                    if (embed.title || embed.description || embed.footer || embed.thumbnail) payload.embeds=[embed];
                }
                return payload;
            },

    webhookUpdatePreview: () => {
                const payload = os.webhookBuildPayload(false);
                const preview = document.getElementById('wh-preview');
                const count = document.getElementById('wh-char-count');
                const size = document.getElementById('wh-payload-size');
                const bytes = new Blob([JSON.stringify(payload)]).size;
                if (count) count.innerText = (document.getElementById('wh-content')?.value || '').length;
                if (size) size.innerText = bytes;
                if (!preview) return;
                const embed = payload.embeds?.[0];
                preview.innerHTML = `<div class="flex gap-2 items-start"><div class="w-9 h-9 rounded-full bg-white/5 overflow-hidden flex items-center justify-center">${payload.avatar_url?`<img src="${os.webhookEscape(payload.avatar_url)}" class="w-full h-full object-cover">`:'<i data-lucide="bot" class="w-5 h-5 text-os-accent"></i>'}</div><div class="min-w-0 flex-1"><div class="text-white font-bold">${os.webhookEscape(payload.username || 'AetherOS Uplink')}</div><div class="mt-1 leading-relaxed break-words">${payload.content ? os.webhookMarkdownLite(payload.content) : '<span class="text-gray-600">No message content.</span>'}</div>${embed?`<div class="mt-3 border-l-4 rounded bg-black/30 p-3" style="border-color:#${(embed.color||0).toString(16).padStart(6,'0')}"><div class="text-white font-bold">${os.webhookEscape(embed.title||'Untitled Embed')}</div><div class="text-gray-300 mt-1 break-words">${os.webhookMarkdownLite(embed.description||'')}</div>${embed.thumbnail?`<img src="${os.webhookEscape(embed.thumbnail.url)}" class="mt-2 max-h-24 rounded border border-white/10">`:''}${embed.footer?`<div class="text-[9px] text-gray-500 mt-2">${os.webhookEscape(embed.footer.text)}</div>`:''}</div>`:''}</div></div>`;
                lucide.createIcons({root:preview});
            },

    webhookSetStatus: (status) => { os.presenceWebhookStatus = status; const el=document.getElementById('wh-status'); if(el){ el.innerText=status; el.className=`px-2 py-1 rounded border font-bold ${status==='DELIVERED'||status==='LINKED'?'border-green-500/30 bg-green-500/10 text-green-300':status==='FAILED'?'border-red-500/30 bg-red-500/10 text-red-300':status==='TRANSMITTING'?'border-yellow-500/30 bg-yellow-500/10 text-yellow-300 wh-transmitting':'border-white/10 bg-white/5 text-gray-300'}`; } },

    webhookSend: async (test=false) => {
                os.webhookSaveFields();
                const url = (SystemState.settings.discord_webhook_url || '').trim();
                if (!/^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\//.test(url)) { os.webhookSetStatus('FAILED'); os.webhookPushLog('FAILED','Invalid Discord webhook URL.'); return; }
                const payload = os.webhookBuildPayload(test);
                if (!payload.content && !payload.embeds?.length) { os.webhookSetStatus('FAILED'); os.webhookPushLog('FAILED','Payload empty.'); return; }
                const btn=document.getElementById('wh-send-btn'); if(btn){btn.disabled=true;btn.classList.add('wh-transmitting');btn.innerText='TRANSMITTING...';}
                os.webhookSetStatus('TRANSMITTING'); os.webhookPushLog('TRANSMITTING', test?'Testing webhook endpoint...':'Dispatching payload...');
                try {
                    const endpoint = url + (url.includes('?') ? '&' : '?') + 'wait=true';
                    const res = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
                    const text = await res.text();
                    if (!res.ok) throw new Error(`${res.status} ${text.slice(0,120)}`);
                    os.webhookSetStatus(test ? 'LINKED' : 'DELIVERED'); os.webhookPushLog(test?'LINKED':'DELIVERED', test?'Webhook connection verified.':'Message delivered to Discord.');
                    os.logTerminal(`Webhook TX: ${test?'connection verified':'payload delivered'} via Discord webhook.`);
                } catch(e) { os.webhookSetStatus('FAILED'); os.webhookPushLog('FAILED', e.message); os.logTerminal(`Webhook TX failed: ${e.message}`); }
                finally { if(btn){btn.disabled=false;btn.classList.remove('wh-transmitting');btn.innerText='Transmit Message';} }
            },

    webhookPreset: (type) => {
                const map = {
                    alert: { content:'🚨 **AetherOS Alert**\nPriority event detected. Please review immediately.', title:'Alert Packet', desc:'A tactical alert was generated from the AetherOS uplink console.', color:'#ef4444' },
                    log: { content:'```log\n[AETHEROS] System log packet emitted.\nSTATUS: NOMINAL\n```', title:'System Log', desc:'Diagnostic log event from local workstation.', color:'#22c55e' },
                    status: { content:'**Status Update**\nAetherOS systems online. Uplink channels stable.', title:'Status Update', desc:'All primary client-side modules are operational.', color:'#3b82f6' },
                    media: { content:'🎧 **Media Share**\nNow transmitting from the Media Console.', title:'Media Telemetry', desc:'Track / station metadata can be pasted here before transmission.', color:'#a855f7' }
                }[type];
                if(!map) return;
                const whContent = document.getElementById('wh-content'); if (whContent) whContent.value = map.content;
                const whEmbedEnabled = document.getElementById('wh-embed-enabled'); if (whEmbedEnabled) whEmbedEnabled.checked = true;
                os.webhookToggleEmbed();
                const whTitle = document.getElementById('wh-embed-title'); if (whTitle) whTitle.value = map.title;
                const whDesc = document.getElementById('wh-embed-desc'); if (whDesc) whDesc.value = map.desc;
                const whColor = document.getElementById('wh-embed-color'); if (whColor) whColor.value = map.color;
                os.webhookUpdatePreview();
            },

    webhookCopyUrl: () => { const url=SystemState.settings.discord_webhook_url||document.getElementById('wh-url')?.value||''; if(navigator.clipboard) navigator.clipboard.writeText(url); os.webhookPushLog('LOCAL','Webhook URL copied to clipboard.'); },

    webhookClearUrl: () => { SystemState.settings.discord_webhook_url=''; SystemState.save(); const el=document.getElementById('wh-url'); if(el) el.value=''; os.webhookSetStatus('STANDBY'); os.webhookPushLog('LOCAL','Webhook URL cleared.'); },

    webhookClearLogs: () => { os.webhookLogs=[]; localStorage.removeItem('AetherOS_WebhookLogs'); os.renderWebhookLogs(); },

    renderWebhookLogs: () => { const el=document.getElementById('wh-logs'); if(!el) return; os.webhookLoadLogs(); el.innerHTML=os.webhookLogs.map(l=>`<div class="px-2 py-1 rounded bg-white/[0.03] border border-white/5 flex justify-between gap-2"><span class="${l.status==='FAILED'?'text-red-400':l.status==='DELIVERED'||l.status==='LINKED'?'text-green-400':l.status==='TRANSMITTING'?'text-yellow-300':'text-gray-400'}">${os.webhookEscape(l.status)}</span><span class="text-gray-500 truncate flex-1">${os.webhookEscape(l.detail)}</span><span class="text-gray-600">${os.webhookEscape(l.time.split(',').pop().trim())}</span></div>`).join('') || '<div class="text-gray-600 text-center py-6">No transmissions logged.</div>'; },

    floor796Url: 'https://floor796.com/',

    floor796MirrorUrl: 'https://floor796.com/data/floor796.html',

    floor796BlobUrl: null,

    floor796NativeUrl: null,

    floor796WatchdogTimer: null,

    floor796Intel: [],

    floor796Matrix: null,

    initFloor796: () => {
                const root = document.getElementById('floor796-root');
                if (!root) return;
                os.floor796SetStatus('BRIDGE READY');
                lucide.createIcons({ root });
                if (!os.floor796Intel.length) os.floor796LoadIntel();
                const frame = document.getElementById('floor796-frame');
                if (frame && frame.src === 'about:blank') setTimeout(() => os.floor796LoadSavedMirror(true), 250);
            },

    floor796SetStatus: (msg, tone='text-gray-500') => {
                const el = document.getElementById('floor796-status');
                if (el) { el.textContent = msg; el.className = `text-[9px] ${tone} uppercase`; }
            },

    floor796SetProgress: (pct) => {
                const bar = document.getElementById('floor796-progress');
                if (bar) bar.style.width = `${Math.max(0, Math.min(100, pct || 0))}%`;
            },

    floor796FetchText: async (url) => {
                const candidates = [
                    url,
                    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
                    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
                ];
                let lastErr = null;
                for (const u of candidates) {
                    try {
                        const r = await fetch(u, { cache:'no-store', signal: AbortSignal.timeout(18000) });
                        if (!r.ok) throw new Error('HTTP ' + r.status);
                        return await r.text();
                    } catch (e) { lastErr = e; }
                }
                throw lastErr || new Error('all text routes failed');
            },

    floor796RewriteShell: (html, base='https://floor796.com/') => {
                let out = String(html || '');
                out = out.replace(/<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]*>/ig, '');
                // Disable the modern-browser redirect guard in srcdoc mode; it can mis-detect inside embedded contexts.
                out = out.replace(/<script>\s*\/\*\*[\s\S]*?modern-agent[\s\S]*?<\/script>/i, '');
                // Floor796 stores the real bundle URL as text/plain; convert it to an executable script tag.
                out = out.replace(/<script\b([^>]*)type=["']text\/plain["']([^>]*)data-type=["']js["']([^>]*)>([\s\S]*?)<\/script>/ig,
                    (m, a, b, c, src) => `<script src="${src.trim()}"></` + `script>`);
                out = out.replace(/<script\b([^>]*)data-type=["']js["']([^>]*)type=["']text\/plain["']([^>]*)>([\s\S]*?)<\/script>/ig,
                    (m, a, b, c, src) => `<script src="${src.trim()}"></` + `script>`);
                out = out.replace(/(href|src)=["']\/(?!\/)/g, `$1="${base}`);
                if (!/<base\s/i.test(out)) out = out.replace(/<head([^>]*)>/i, `<head$1><base href="${base}">`);
                out = out.replace('</head>', `<style>html,body{margin:0!important;width:100%!important;height:100%!important;overflow:hidden!important;background:#111!important}.fatal-error{z-index:999999}</style></head>`);
                return out;
            },

    floor796LoadLiveRewrite: async () => {
                const frame = document.getElementById('floor796-frame');
                if (!frame) return;
                os.floor796SetStatus('FETCHING LIVE SHELL', 'text-cyan-300');
                os.floor796SetProgress(8);
                try {
                    let html;
                    try { html = await os.floor796FetchText('https://floor796.com/'); }
                    catch (_) { html = await os.floor796FetchText('https://old.floor796.com/'); }
                    os.floor796SetStatus('REWRITING FRAME BYPASS', 'text-cyan-300');
                    os.floor796SetProgress(55);
                    frame.style.setProperty('pointer-events', 'auto', 'important');
                    frame.style.setProperty('cursor', 'auto', 'important');
                    frame.onload = () => os.floor796SetStatus('LIVE REWRITE LOADED', 'text-green-300');
                    frame.removeAttribute('src');
                    frame.srcdoc = os.floor796RewriteShell(html, html.includes('cdn2.floor796.com') ? 'https://old.floor796.com/' : 'https://floor796.com/');
                    os.floor796SetProgress(100);
                    os.floor796SetStatus('LIVE REWRITE ACTIVE', 'text-cyan-200');
                    os.floor796ToggleGuide(false);
                    clearTimeout(os.floor796WatchdogTimer);
                    os.logTerminal && os.logTerminal('Floor796: live shell rewritten into iframe srcdoc bypass.');
                } catch (e) {
                    os.floor796SetStatus('REWRITE FAILED', 'text-red-300');
                    const list = document.getElementById('floor796-intel-list');
                    if (list) list.innerHTML = `<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200">Live Rewrite failed: ${String(e.message || e)}</div>`;
                }
            },

    floor796TryIframe: () => {
                const frame = document.getElementById('floor796-frame');
                if (!frame) return;
                os.floor796SetStatus('PROBING IFRAME', 'text-yellow-300');
                frame.src = os.floor796Url;
                setTimeout(() => os.floor796SetStatus('LIKELY BLOCKED — USE BLOB BRIDGE', 'text-red-300'), 2600);
            },

    floor796PickLocalMirror: () => {
                const input = document.getElementById('floor796-file-input');
                if (input) input.click();
            },

    floor796PrepareMirrorHtml: (html) => {
                let out = String(html || '');
                if (!/<base\s/i.test(out)) out = out.replace(/<head([^>]*)>/i, '<head$1><base href="https://floor796.com/">');
                out = out.replace(/<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]*>/ig, '');
                return out;
            },

    floor796OpenDB: () => new Promise((resolve, reject) => {
                if (typeof indexedDB === 'undefined' || !indexedDB) {
                    reject(new Error('IndexedDB unavailable'));
                    return;
                }
                const req = indexedDB.open('AetherOS_Floor796', 1);
                req.onupgradeneeded = () => req.result.createObjectStore('files');
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            }),

    floor796SaveMirrorBlob: async (blob, name='floor796.html') => {
                try {
                    const db = await os.floor796OpenDB();
                    await new Promise((resolve, reject) => {
                        const tx = db.transaction('files', 'readwrite');
                        tx.objectStore('files').put({ blob, name, size: blob.size, ts: Date.now() }, 'mirror');
                        tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
                    });
                    db.close();
                } catch (e) { console.warn('Floor796 persistent save failed', e); }
            },

    floor796GetSavedMirror: async () => {
                const db = await os.floor796OpenDB();
                try {
                    return await new Promise((resolve, reject) => {
                        const tx = db.transaction('files', 'readonly');
                        const req = tx.objectStore('files').get('mirror');
                        req.onsuccess = () => resolve(req.result || null);
                        req.onerror = () => reject(req.error);
                    });
                } finally { db.close(); }
            },

    floor796MountDecodedMirror: (arrayBuffer, sourceLabel='LOCAL HTML LIVE') => {
                const frame = document.getElementById('floor796-frame');
                if (!frame) return;
                os.floor796SetStatus('DECODING WINDOWS-1251', 'text-blue-300');
                // Decode bytes explicitly as Windows-1251, then emit UTF-8 HTML with the SAME Unicode
                // character stream Floor796 expects. This lets us inject <base> so root-relative
                // requests resolve to floor796.com instead of the blob: origin, fixing the 100% stall.
                const html = new TextDecoder('windows-1251').decode(arrayBuffer);
                if (os.floor796BlobUrl) URL.revokeObjectURL(os.floor796BlobUrl);
                os.floor796BlobUrl = URL.createObjectURL(new Blob([os.floor796PrepareMirrorHtml(html)], { type:'text/html;charset=utf-8' }));
                frame.src = os.floor796BlobUrl;
                os.floor796SetProgress(100);
                os.floor796SetStatus(sourceLabel, 'text-green-300');
                os.floor796ToggleGuide(false);
                os.floor796StartWatchdog();
            },

    floor796MountHtmlBlob: (content, sourceLabel='LOCAL BLOB', opts={}) => {
                // Kept for compatibility with older buttons; raw bytes are routed through the decoder path.
                if (opts.rawBytes) {
                    if (Array.isArray(content)) {
                        new Blob(content).arrayBuffer().then(buf => os.floor796MountDecodedMirror(buf, sourceLabel));
                    } else if (content instanceof ArrayBuffer) os.floor796MountDecodedMirror(content, sourceLabel);
                    else if (ArrayBuffer.isView(content)) os.floor796MountDecodedMirror(content.buffer, sourceLabel);
                    return;
                }
                const frame = document.getElementById('floor796-frame');
                if (!frame) return;
                if (os.floor796BlobUrl) URL.revokeObjectURL(os.floor796BlobUrl);
                os.floor796BlobUrl = URL.createObjectURL(new Blob([os.floor796PrepareMirrorHtml(content)], { type:'text/html;charset=utf-8' }));
                frame.src = os.floor796BlobUrl;
                os.floor796SetProgress(100);
                os.floor796SetStatus(sourceLabel, 'text-green-300');
                os.floor796ToggleGuide(false);
            },

    floor796StartWatchdog: () => {
                clearTimeout(os.floor796WatchdogTimer);
                const panel = document.getElementById('floor796-stuck-panel');
                if (panel) panel.classList.add('hidden');
                os.floor796WatchdogTimer = setTimeout(() => {
                    try {
                        const frame = document.getElementById('floor796-frame');
                        const doc = frame && frame.contentDocument;
                        const pc = doc && doc.querySelector('.boot-loader__pc');
                        const loader = doc && doc.querySelector('.boot-loader');
                        const txt = pc && pc.textContent || '';
                        const stillVisible = loader && getComputedStyle(loader).display !== 'none';
                        if (stillVisible && /100%/.test(txt)) {
                            os.floor796SetStatus('100% STALL DETECTED', 'text-red-300');
                            const p = document.getElementById('floor796-stuck-panel');
                            if (p) p.classList.remove('hidden');
                        }
                    } catch (e) {
                        // If cross-origin access is blocked, still expose native fallback after a long stall.
                        const p = document.getElementById('floor796-stuck-panel');
                        if (p) p.classList.remove('hidden');
                    }
                }, 22000);
            },

    floor796ForceHideLoader: () => {
                try {
                    const doc = document.getElementById('floor796-frame')?.contentDocument;
                    const loader = doc && doc.querySelector('.boot-loader');
                    if (loader) loader.style.display = 'none';
                    const p = document.getElementById('floor796-stuck-panel');
                    if (p) p.classList.add('hidden');
                    os.floor796SetStatus('LOADER HIDDEN', 'text-yellow-300');
                } catch (e) { os.floor796SetStatus('HIDE FAILED', 'text-red-300'); }
            },

    floor796LaunchNativeRuntime: async () => {
                try {
                    let url = os.floor796BlobUrl;
                    // Prefer a raw saved copy for native runtime because it most closely matches opening the file from disk.
                    const saved = await os.floor796GetSavedMirror().catch(()=>null);
                    if (saved && saved.blob) {
                        if (os.floor796NativeUrl) URL.revokeObjectURL(os.floor796NativeUrl);
                        os.floor796NativeUrl = URL.createObjectURL(saved.blob);
                        url = os.floor796NativeUrl;
                    }
                    if (!url) { os.floor796SetStatus('NO LOCAL RUNTIME', 'text-yellow-300'); return; }
                    const w = window.open(url, 'AetherOS_Floor796_Native', 'popup=yes,width=1280,height=820,noopener=no,noreferrer=no');
                    if (!w) os.floor796SetStatus('POPUP BLOCKED', 'text-red-300');
                    else os.floor796SetStatus('NATIVE RUNTIME OPEN', 'text-purple-200');
                } catch (e) { os.floor796SetStatus('NATIVE FAILED', 'text-red-300'); console.warn(e); }
            },

    floor796LoadSavedMirror: async (silent=false) => {
                try {
                    const saved = await os.floor796GetSavedMirror();
                    if (!saved || !saved.blob) { if (!silent) os.floor796SetStatus('NO SAVED COPY', 'text-yellow-300'); return; }
                    os.floor796SetStatus('LOADING SAVED COPY', 'text-emerald-300');
                    os.floor796SetProgress(5);
                    const buf = await saved.blob.arrayBuffer();
                    os.floor796MountDecodedMirror(buf, 'SAVED HTML LIVE');
                    os.logTerminal && os.logTerminal(`Floor796: restored saved mirror "${saved.name || 'floor796.html'}" (${((saved.size||saved.blob.size)/1048576).toFixed(1)} MB).`);
                } catch (e) { if (!silent) os.floor796SetStatus('SAVED LOAD FAILED', 'text-red-300'); console.warn(e); }
            },

    floor796LoadLocalMirror: (file) => {
                if (!file) return;
                const frame = document.getElementById('floor796-frame');
                if (!frame) return;
                os.floor796SetStatus('READING LOCAL HTML', 'text-green-300');
                os.floor796SetProgress(1);
                const reader = new FileReader();
                reader.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const pct = Math.min(94, Math.round((e.loaded / e.total) * 94));
                        os.floor796SetProgress(pct);
                        os.floor796SetStatus(`READING LOCAL ${pct}%`, 'text-green-300');
                    } else os.floor796SetStatus(`READING ${(e.loaded/1048576).toFixed(1)} MB`, 'text-green-300');
                };
                reader.onerror = () => os.floor796SetStatus('LOCAL READ FAILED', 'text-red-300');
                reader.onload = async () => {
                    os.floor796SetStatus('SAVING LOCAL COPY', 'text-emerald-300');
                    const blob = new Blob([reader.result], { type:'text/html' });
                    os.floor796SaveMirrorBlob(blob, file.name);
                    os.floor796MountDecodedMirror(reader.result, 'LOCAL HTML LIVE');
                    os.logTerminal && os.logTerminal(`Floor796: mounted and saved local mirror "${file.name}" (${(file.size/1048576).toFixed(1)} MB).`);
                };
                reader.readAsArrayBuffer(file);
            },

    floor796LoadBlobBridge: async () => {
                const frame = document.getElementById('floor796-frame');
                if (!frame) return;
                os.floor796SetStatus('FETCHING MIRROR', 'text-yellow-300');
                os.floor796SetProgress(2);
                try {
                    const res = await fetch(os.floor796MirrorUrl, { mode:'cors', cache:'force-cache' });
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    const total = Number(res.headers.get('content-length')) || 0;
                    const reader = res.body && res.body.getReader ? res.body.getReader() : null;
                    const chunks = [];
                    let loaded = 0;
                    if (reader) {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            chunks.push(value);
                            loaded += value.byteLength;
                            if (total) {
                                const pct = Math.min(96, Math.round((loaded / total) * 100));
                                os.floor796SetProgress(pct);
                                os.floor796SetStatus(`DOWNLOADING ${pct}%`, 'text-yellow-300');
                            } else {
                                os.floor796SetStatus(`DOWNLOADING ${(loaded/1048576).toFixed(1)} MB`, 'text-yellow-300');
                            }
                        }
                    } else {
                        chunks.push(await res.arrayBuffer());
                    }
                    os.floor796SetStatus('DECODING MIRROR', 'text-blue-300');
                    const mirrorBlob = new Blob(chunks, { type:'text/html' });
                    os.floor796SaveMirrorBlob(mirrorBlob, 'floor796-online.html');
                    os.floor796MountHtmlBlob(chunks, 'ONLINE MIRROR LIVE', { rawBytes: true });
                    os.logTerminal && os.logTerminal('Floor796: frame-ancestor bypass active via local Blob bridge.');
                } catch (err) {
                    os.floor796SetStatus('BRIDGE FAILED', 'text-red-300');
                    const list = document.getElementById('floor796-intel-list');
                    if (list) list.innerHTML = `<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200">Blob bridge failed: ${String(err.message || err)}</div>`;
                }
            },

    floor796ToggleGuide: (force) => {
                const el = document.getElementById('floor796-guide');
                if (!el) return;
                const show = force === undefined ? el.classList.contains('hidden') : !!force;
                el.classList.toggle('hidden', !show);
                lucide.createIcons({ root: el });
            },

    floor796FetchJson: async (url) => {
                const candidates = [
                    url,
                    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
                    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
                ];
                let lastErr = null;
                for (const u of candidates) {
                    try {
                        const r = await fetch(u, { cache:'no-store', signal: AbortSignal.timeout(16000) });
                        if (!r.ok) throw new Error('HTTP ' + r.status);
                        return await r.json();
                    } catch (e) { lastErr = e; }
                }
                throw lastErr || new Error('all routes failed');
            },

    floor796LoadIntel: async () => {
                const list = document.getElementById('floor796-intel-list');
                const summary = document.getElementById('floor796-intel-summary');
                if (list) list.innerHTML = '<div class="p-3 text-center text-gray-500 animate-pulse uppercase tracking-widest">Scanning changelog...</div>';
                try {
                    const [changelog, matrix] = await Promise.all([
                        os.floor796FetchJson('https://floor796.com/data/changelog.json'),
                        os.floor796FetchJson('https://floor796.com/data/matrix.json').catch(()=>null)
                    ]);
                    os.floor796Intel = Array.isArray(changelog) ? changelog : [];
                    os.floor796Matrix = matrix;
                    if (summary) summary.textContent = `${os.floor796Intel.length} updates · matrix v${matrix?.ver || '--'} · latest ${os.floor796Intel[0]?.d || '--'}`;
                    os.floor796RenderIntel();
                    os.floor796SetStatus('INTEL SYNCED', 'text-blue-300');
                } catch (err) {
                    if (list) list.innerHTML = `<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200">Intel fetch failed: ${String(err.message || err)}</div>`;
                }
            },

    floor796RenderIntel: (filter='') => {
                const list = document.getElementById('floor796-intel-list');
                if (!list) return;
                const q = String(filter || '').toLowerCase();
                const rows = os.floor796Intel.filter(it => !q || JSON.stringify(it).toLowerCase().includes(q)).slice(0, 80);
                if (!rows.length) { list.innerHTML = '<div class="p-3 text-center text-gray-600">No matching updates.</div>'; return; }
                const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
                list.innerHTML = rows.map(it => {
                    const media = String(it.l || '').split('||')[0] || '';
                    const coords = String(it.p || '').split(';').filter(Boolean).slice(0,3).join(' · ');
                    const kind = it.m ? 'interactive' : 'scene';
                    return `<div class="rounded-xl border border-white/5 bg-white/[0.035] p-2 hover:bg-white/[0.06] transition">
                        <div class="flex justify-between gap-2"><b class="text-white">#${esc(it.id)}</b><span class="text-yellow-200">${esc(it.d)}</span></div>
                        <div class="text-gray-500 mt-1 uppercase tracking-wider text-[8px]">${kind}${it.a ? ' · '+esc(it.a) : ''}</div>
                        ${coords ? `<div class="mt-1 text-gray-400 break-all">${esc(coords)}</div>` : ''}
                        ${media ? `<button onclick="os.floor796PreviewMedia('${encodeURIComponent(media)}')" class="mt-2 px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-300 hover:text-white cursor-none hover-target">Preview media</button>` : ''}
                    </div>`;
                }).join('');
            },

    floor796PreviewMedia: (encoded) => {
                const url = decodeURIComponent(encoded);
                const list = document.getElementById('floor796-intel-list');
                if (!list) return;
                const isImg = /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(url);
                const abs = url.startsWith('http') ? url : 'https://floor796.com' + url;
                list.insertAdjacentHTML('afterbegin', `<div class="rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-2 mb-2"><div class="text-yellow-100 uppercase text-[9px] mb-2">Media preview</div>${isImg ? `<img src="${abs}" class="max-w-full rounded border border-white/10">` : `<div class="text-gray-300 break-all">${abs}</div>`}</div>`);
            },

    wplaceUrl: 'https://wplace.live/',

    wplaceLoaded: false,

    initWplace: () => {
                const root = document.getElementById('wplace-root');
                if (!root) return;
                os.wplaceSetStatus('READY');
                const frame = document.getElementById('wplace-frame');
                if (!os.wplaceLoaded || !frame || frame.src === 'about:blank') os.wplaceLoad();
                lucide.createIcons({ root });
            },

    wplaceSetStatus: (msg, tone='text-gray-500') => {
                const el = document.getElementById('wplace-status');
                if (el) { el.textContent = msg; el.className = `text-[9px] ${tone} uppercase`; }
            },

    wplaceLoad: () => {
                const frame = document.getElementById('wplace-frame');
                if (!frame) return;
                os.wplaceLoaded = true;
                os.wplaceSetStatus('LOADING', 'text-yellow-300');
                frame.src = os.wplaceUrl;
                frame.onload = () => os.wplaceSetStatus('LIVE / EMBEDDED', 'text-green-300');
                setTimeout(() => {
                    if (document.getElementById('wplace-frame') && os.wplaceLoaded) os.wplaceSetStatus('LIVE OR EXTERNAL-BLOCKED', 'text-fuchsia-200');
                }, 4500);
                os.logTerminal && os.logTerminal('Wplace: live canvas bridge initialized.');
            },

    wplaceOpenExternal: () => {
                window.open(os.wplaceUrl, '_blank', 'noopener,noreferrer');
                os.wplaceSetStatus('OPENED EXTERNAL', 'text-fuchsia-200');
            },

    wplaceToggleOverlay: (force) => {
                const overlay = document.getElementById('wplace-overlay');
                if (!overlay) return;
                const show = force === undefined ? overlay.classList.contains('hidden') : !!force;
                overlay.classList.toggle('hidden', !show);
                lucide.createIcons({ root: overlay });
            },

    browser: {
                tabs: [],           // [{id, url, title, favicon}]
                activeTab: null,    // id
                history: [],        // [{url, title, ts}]
                bookmarks: [],      // [{url, title}]
                histPtr: -1,
            },

    browserQuickLinks: [
                { label: 'DuckDuckGo', url: 'https://duckduckgo.com',       icon: 'search',         color: '#de5833' },
                { label: 'GitHub',     url: 'https://github.com',           icon: 'github',         color: '#a78bfa' },
                { label: 'Wikipedia',  url: 'https://en.wikipedia.org',     icon: 'book-open',      color: '#60a5fa' },
                { label: 'Hacker News',url: 'https://news.ycombinator.com', icon: 'flame',          color: '#ff6600' },
                { label: 'YouTube',    url: 'https://youtube.com',          icon: 'play-circle',    color: '#f87171' },
                { label: 'Archive.org',url: 'https://archive.org',          icon: 'archive',        color: '#34d399' },
                { label: 'Translate',  url: 'https://translate.google.com', icon: 'languages',      color: '#38bdf8' },
                { label: 'Reddit',     url: 'https://old.reddit.com',       icon: 'message-square', color: '#fb923c' },
            ],

    initBrowser: () => {
                os.browser.bookmarks = JSON.parse(localStorage.getItem('aetheros_bookmarks') || '[]');
                os.browser.history   = JSON.parse(localStorage.getItem('aetheros_bhistory')  || '[]');
                os.browserRenderQuickLaunch();
                os.browserRenderTabs();
                os.browserRenderHistory();
                os.browserRenderBookmarks();
                lucide.createIcons({ root: document.getElementById('browser-root') });
            },

    browserGo: () => {
                const input = document.getElementById('browser-url-input');
                if (!input) return;
                let raw = input.value.trim();
                if (!raw) return;
                // If it looks like a search query (no dot, no //) — search DDG
                const isURL = /^https?:\/\//i.test(raw) || /^[a-z0-9-]+\.[a-z]{2,}(\/|$)/i.test(raw);
                const url = isURL ? (raw.startsWith('http') ? raw : 'https://' + raw)
                                  : `https://duckduckgo.com/?q=${encodeURIComponent(raw)}`;
                os.browserLoadURL(url);
            },

    browserSearch: (query) => {
                if (!query.trim()) return;
                const url = `https://duckduckgo.com/?q=${encodeURIComponent(query.trim())}`;
                os.browserLoadURL(url);
            },

    browserLoadURL: (url) => {
                // Push to session history
                const title = os.browserGuessTitle(url);
                os.browser.history.unshift({ url, title, ts: Date.now() });
                if (os.browser.history.length > 50) os.browser.history.pop();
                try { localStorage.setItem('aetheros_bhistory', JSON.stringify(os.browser.history)); } catch(e){}

                // Manage tabs
                const tabId = 'tab_' + Date.now();
                os.browser.tabs.push({ id: tabId, url, title });
                os.browser.activeTab = tabId;

                // Update URL bar
                const input = document.getElementById('browser-url-input');
                if (input) input.value = url;

                os.browserRenderTabs();
                os.browserRenderHistory();

                // Try to fetch a preview; on failure, show the launch card
                os.browserFetchPreview(url, tabId, title);
                os.browserSetStatus(`Loading ${os.browserDomain(url)}…`);
            },

    browserFetchPreview: async (url, tabId, title) => {
                os.browserShowPreview();
                const content = document.getElementById('browser-preview-content');
                const domainEl = document.getElementById('browser-preview-domain');
                const titleEl  = document.getElementById('browser-preview-title');
                if (domainEl) domainEl.innerText = os.browserDomain(url);
                if (titleEl)  titleEl.innerText  = title;
                if (content)  content.innerHTML  = `<div class="flex items-center justify-center h-full py-16"><div class="text-center text-gray-500 text-[10px] animate-pulse uppercase tracking-widest">Fetching preview…</div></div>`;

                // Try allorigins raw proxy to grab HTML, parse it for text
                try {
                    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
                    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const html = await res.text();

                    // Parse out useful content
                    const parser = new DOMParser();
                    const doc    = parser.parseFromString(html, 'text/html');

                    // Get page title
                    const pageTitle = doc.querySelector('title')?.textContent?.trim() || title;
                    if (titleEl) titleEl.innerText = pageTitle;

                    // Update tab title
                    const tab = os.browser.tabs.find(t => t.id === tabId);
                    if (tab) { tab.title = pageTitle; os.browserRenderTabs(); }

                    // Extract meta description
                    const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';

                    // Extract main text content — try article/main/body progressively
                    const mainEl = doc.querySelector('article, main, [role="main"], .content, #content, body');
                    const paragraphs = Array.from(mainEl?.querySelectorAll('p, h1, h2, h3, h4, li') || [])
                        .map(el => ({ tag: el.tagName.toLowerCase(), text: el.textContent.trim() }))
                        .filter(x => x.text.length > 20)
                        .slice(0, 60);

                    // Extract OG image
                    const ogImg = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';

                    // Render reader view
                    let rendered = `<div class="max-w-2xl mx-auto space-y-4 text-[13px] leading-relaxed text-gray-300">`;

                    // Hero image
                    if (ogImg) {
                        rendered += `<img src="${ogImg}" class="w-full rounded-lg object-cover max-h-48 opacity-80" onerror="this.style.display=&apos;none&apos;">`;
                    }

                    // Title + domain
                    rendered += `
                        <div class="border-b border-white/5 pb-3">
                            <div class="text-white font-bold text-lg leading-snug mb-1">${pageTitle}</div>
                            <div class="text-[10px] text-gray-500 font-mono">${url}</div>
                            ${metaDesc ? `<div class="text-gray-400 text-sm mt-2 italic">${metaDesc}</div>` : ''}
                        </div>`;

                    // Body paragraphs
                    paragraphs.forEach(({tag, text}) => {
                        if (['h1','h2','h3'].includes(tag)) {
                            rendered += `<h3 class="text-white font-bold text-base mt-4">${text}</h3>`;
                        } else if (tag === 'h4') {
                            rendered += `<h4 class="text-gray-200 font-semibold mt-3">${text}</h4>`;
                        } else if (tag === 'li') {
                            rendered += `<div class="flex gap-2 text-gray-300"><span class="text-os-accent mt-1">▸</span><span>${text}</span></div>`;
                        } else {
                            rendered += `<p class="text-gray-300">${text}</p>`;
                        }
                    });

                    if (paragraphs.length === 0) {
                        rendered += `<div class="text-gray-500 text-center py-8 text-[11px]">Preview extracted — no readable body content found.<br>Open in browser for full experience.</div>`;
                    }

                    rendered += `
                        <div class="pt-4 border-t border-white/5">
                            <button onclick="os.browserOpenExternal()"
                                class="flex items-center gap-2 px-4 py-2 bg-white/8 border border-white/15 rounded-lg text-sm text-white hover:bg-white/15 transition cursor-none hover-target">
                                <i data-lucide="external-link" class="w-4 h-4"></i>
                                Open full page in browser
                            </button>
                        </div>
                    </div>`;

                    if (content) {
                        content.innerHTML = rendered;
                        lucide.createIcons({ root: content });
                    }
                    os.browserSetStatus(`Preview loaded · ${os.browserDomain(url)}`);

                } catch(e) {
                    // Proxy failed → show a rich launch card instead
                    os.browserShowLaunchCard(url, title, content, e.message);
                    os.browserSetStatus(`Preview unavailable · ${os.browserDomain(url)}`);
                }
            },

    browserShowLaunchCard: (url, title, container, reason) => {
                const domain = os.browserDomain(url);
                const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
                if (!container) return;
                container.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full text-center py-12 space-y-5">
                        <img src="${faviconUrl}" class="w-12 h-12 rounded-xl opacity-80" onerror="this.style.display=&apos;none&apos;">
                        <div>
                            <div class="text-white font-bold text-xl mb-1">${domain}</div>
                            <div class="text-gray-500 text-[11px] font-mono max-w-sm">${url}</div>
                        </div>
                        <div class="text-[10px] text-yellow-500/70 bg-yellow-500/5 border border-yellow-500/10 rounded px-3 py-2 max-w-sm">
                            Preview unavailable — site blocks cross-origin requests.<br>
                            <span class="text-gray-500">${reason}</span>
                        </div>
                        <button onclick="window.open('${url.replace(/'/g,"\\'")}', '_blank')"
                            class="flex items-center gap-2 px-5 py-2.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white hover:bg-white/20 transition cursor-none hover-target">
                            <i data-lucide="external-link" class="w-4 h-4"></i>
                            Open ${domain} in browser
                        </button>
                        <button onclick="os.browserShowHome()"
                            class="text-[10px] text-gray-500 hover:text-gray-300 transition cursor-none hover-target">
                            ← Back to home
                        </button>
                    </div>`;
                lucide.createIcons({ root: container });
            },

    browserShowPreview: () => {
                const home = document.getElementById('browser-home');
                const prev = document.getElementById('browser-preview');
                if (home) home.style.display = 'none';
                if (prev) { prev.style.display = 'flex'; prev.classList.remove('hidden'); }
            },

    browserShowHome: () => {
                const home = document.getElementById('browser-home');
                const prev = document.getElementById('browser-preview');
                if (home) home.style.display = '';
                if (prev) prev.style.display = 'none';
            },

    browserRenderQuickLaunch: () => {
                const grid = document.getElementById('browser-quicklaunch');
                if (!grid) return;
                grid.innerHTML = os.browserQuickLinks.map(l => `
                    <button onclick="os.browserLoadURL('${l.url}')"
                        class="flex flex-col items-center gap-1.5 p-3 bg-black/40 border border-white/5 rounded-lg hover:bg-white/8 hover:border-white/15 transition cursor-none hover-target group">
                        <div class="w-7 h-7 rounded-md bg-white/[0.04] flex items-center justify-center"><i data-lucide="${l.icon}" class="w-4 h-4" style="color:${l.color}"></i></div>
                        <div class="text-[9px] text-gray-400 group-hover:text-white transition truncate w-full text-center">${os.escapeHtml(l.label)}</div>
                    </button>
                `).join('');
                lucide.createIcons({ root: grid });
            },

    browserRenderTabs: () => {
                const row = document.getElementById('browser-tabs-row');
                if (!row) return;
                row.innerHTML = os.browser.tabs.slice(-8).map(tab => {
                    const active = tab.id === os.browser.activeTab;
                    const domain = os.browserDomain(tab.url);
                    return `
                        <div class="flex items-center gap-1 px-2.5 py-1 rounded-t text-[9px] max-w-[140px] shrink-0 cursor-none hover-target transition
                            ${active ? 'bg-white/10 text-white border border-white/10 border-b-transparent' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}"
                            onclick="os.browserSwitchTab('${tab.id}')">
                            <img src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=16" class="w-3 h-3 shrink-0" onerror="this.style.display=&apos;none&apos;">
                            <span class="truncate">${os.escapeHtml(domain)}</span>
                            <button class="ml-0.5 opacity-50 hover:opacity-100 text-[8px] flex items-center" onclick="event.stopPropagation();os.browserCloseTab('${tab.id}')" aria-label="Close tab"><i data-lucide="x" class="w-2.5 h-2.5"></i></button>
                        </div>`;
                }).join('');
                lucide.createIcons({ root: row });
            },

    browserSwitchTab: (id) => {
                const tab = os.browser.tabs.find(t => t.id === id);
                if (!tab) return;
                os.browser.activeTab = id;
                const input = document.getElementById('browser-url-input');
                if (input) input.value = tab.url;
                os.browserRenderTabs();
                os.browserFetchPreview(tab.url, id, tab.title);
            },

    browserCloseTab: (id) => {
                os.browser.tabs = os.browser.tabs.filter(t => t.id !== id);
                if (os.browser.activeTab === id) {
                    os.browser.activeTab = os.browser.tabs.length ? os.browser.tabs[os.browser.tabs.length-1].id : null;
                }
                os.browserRenderTabs();
                if (!os.browser.activeTab) os.browserShowHome();
            },

    browserRenderHistory: () => {
                const section = document.getElementById('browser-history-section');
                const list    = document.getElementById('browser-history-list');
                if (!list) return;
                if (os.browser.history.length === 0) { if(section) section.classList.add('hidden'); return; }
                if(section) section.classList.remove('hidden');
                list.innerHTML = os.browser.history.slice(0, 15).map(h => `
                    <button onclick="os.browserLoadURL('${h.url.replace(/'/g,'\\\'')}')"
                        class="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 text-left transition cursor-none hover-target group">
                        <img src="https://www.google.com/s2/favicons?domain=${os.browserDomain(h.url)}&sz=16" class="w-3.5 h-3.5 shrink-0 opacity-60 group-hover:opacity-100">
                        <span class="flex-1 text-[10px] text-gray-400 group-hover:text-white truncate">${h.title || os.browserDomain(h.url)}</span>
                        <span class="text-[8px] text-gray-600 shrink-0">${new Date(h.ts).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false})}</span>
                    </button>`).join('');
            },

    browserRenderBookmarks: () => {
                const section = document.getElementById('browser-bookmarks-section');
                const list    = document.getElementById('browser-bookmarks-list');
                if (!list) return;
                if (os.browser.bookmarks.length === 0) { if(section) section.classList.add('hidden'); return; }
                if(section) section.classList.remove('hidden');
                list.innerHTML = os.browser.bookmarks.map((b, i) => `
                    <div class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 group">
                        <img src="https://www.google.com/s2/favicons?domain=${os.browserDomain(b.url)}&sz=16" class="w-3.5 h-3.5 shrink-0 opacity-60">
                        <button onclick="os.browserLoadURL('${b.url.replace(/'/g,'\\\'')}')"
                            class="flex-1 text-[10px] text-gray-400 hover:text-white text-left truncate transition cursor-none hover-target">${b.title || os.browserDomain(b.url)}</button>
                        <button onclick="os.browserRemoveBookmark(${i})" class="opacity-0 group-hover:opacity-100 text-red-500/60 hover:text-red-400 text-[9px] cursor-none hover-target">✕</button>
                    </div>`).join('');
            },

    browserToggleFav: () => {
                const input = document.getElementById('browser-url-input');
                const url = input ? input.value.trim() : '';
                if (!url || !url.startsWith('http')) return;
                const exists = os.browser.bookmarks.findIndex(b => b.url === url);
                if (exists >= 0) {
                    os.browser.bookmarks.splice(exists, 1);
                    os.browserSetStatus('Bookmark removed');
                } else {
                    const title = document.getElementById('browser-preview-title')?.innerText || os.browserDomain(url);
                    os.browser.bookmarks.unshift({ url, title });
                    os.browserSetStatus('Bookmarked!');
                }
                try { localStorage.setItem('aetheros_bookmarks', JSON.stringify(os.browser.bookmarks)); } catch(e){}
                os.browserRenderBookmarks();
                // Update star icon color
                const starBtn = document.getElementById('browser-btn-fav');
                const inBM = os.browser.bookmarks.some(b => b.url === url);
                if (starBtn) starBtn.classList.toggle('text-yellow-400', inBM);
            },

    browserRemoveBookmark: (i) => {
                os.browser.bookmarks.splice(i, 1);
                try { localStorage.setItem('aetheros_bookmarks', JSON.stringify(os.browser.bookmarks)); } catch(e){}
                os.browserRenderBookmarks();
            },

    browserClearBookmarks: () => {
                os.browser.bookmarks = [];
                try { localStorage.removeItem('aetheros_bookmarks'); } catch(e){}
                os.browserRenderBookmarks();
            },

    browserClearHistory: () => {
                os.browser.history = [];
                try { localStorage.removeItem('aetheros_bhistory'); } catch(e){}
                os.browserRenderHistory();
            },

    browserOpenExternal: () => {
                const input = document.getElementById('browser-url-input');
                const url = input?.value?.trim() || 'https://duckduckgo.com';
                if (url.startsWith('http')) window.open(url, '_blank', 'noopener');
            },

    browserNav: (dir) => {
                // No true back/forward within the preview engine, but navigate history list
                const histLen = os.browser.history.length;
                if (dir === 'back' && histLen > 1) {
                    os.browserLoadURL(os.browser.history[1].url);
                }
            },

    browserGuessTitle: (url) => {
                try {
                    const u = new URL(url);
                    const path = u.pathname.replace(/\//g,' ').trim();
                    return path ? `${u.hostname} › ${path}` : u.hostname;
                } catch(e) { return url; }
            },

    browserDomain: (url) => {
                try { return new URL(url).hostname.replace(/^www\./, ''); }
                catch(e) { return url.replace(/^https?:\/\//,'').split('/')[0]; }
            },

    browserSetStatus: (msg) => {
                const el = document.getElementById('browser-status');
                if (el) el.innerText = msg;
            },

    openLinkInProxy: (url) => {
                if (!SystemState.windows.browser || !SystemState.windows.browser.isOpen) {
                    os.openWindow('browser');
                    setTimeout(() => {
                        os.browserLoadURL(url);
                    }, 350);
                } else {
                    if (window.winManager) window.winManager.bringToFront('browser');
                    os.browserLoadURL(url);
                }
            },

    initSignalFeed: () => {
                if(!os.signalFeed.isLooping) {
                    os.signalFeed.isLooping = true;
                    os.renderSignalLoop();
                }
            },

    renderSignalLoop: () => {
                const container = document.getElementById('signal-stream-container');
                if (!container) {
                    os.signalFeed.isLooping = false;
                    return; 
                }

                if (os.signalFeed.buffer.length > 0) {
                    if (container.children.length === 1 && (container.children[0].innerText.includes('TUNING') || container.children[0].innerText.includes('OFFLINE'))) {
                        container.innerHTML = '';
                    }

                    const item = os.signalFeed.buffer.shift();
                    os.signalFeed.renderedIds.add(item.id);

                    const el = document.createElement('div');
                    const clickClasses = item.link ? 'cursor-none hover-target group hover:bg-white/10' : '';
                    
                    el.className = `border border-white/5 bg-black/60 rounded p-3 flex gap-3 items-start shadow-os-recessed transform transition-all duration-500 opacity-0 -translate-x-4 backdrop-blur-sm ${clickClasses}`;
                    if (item.link) {
                        el.addEventListener('click', () => os.openLinkInProxy(item.link));
                    }

                    el.innerHTML = `
                        <div class="mt-0.5 ${item.color}"><i data-lucide="${item.icon}" class="w-4 h-4"></i></div>
                        <div class="flex-1 overflow-hidden">
                            <div class="flex justify-between items-center text-[9px] mb-1.5">
                                <span class="text-os-accent font-bold uppercase tracking-wider">${os.escapeHtml(item.source)}</span>
                                <span class="text-gray-500">${os.escapeHtml(item.time)}</span>
                            </div>
                            <div class="text-[11px] text-white font-medium leading-snug ${item.link ? 'group-hover:text-green-400 transition-colors' : ''}">${os.escapeHtml(item.title)}</div>
                        </div>
                        ${item.link ? '<div class="mt-0.5"><i data-lucide="external-link" class="w-3 h-3 text-gray-500 group-hover:text-green-400 transition-colors"></i></div>' : ''}
                    `;

                    container.prepend(el);
                    lucide.createIcons({root: el});

                    requestAnimationFrame(() => {
                        el.classList.remove('opacity-0', '-translate-x-4');
                    });

                    if (container.children.length > 40) {
                        container.removeChild(container.lastChild);
                    }
                }

                const bufferCounter = document.getElementById('signal-buffer-count');
                if(bufferCounter) bufferCounter.innerText = `BUFFER: ${os.signalFeed.buffer.length}`;

                setTimeout(os.renderSignalLoop, 1500 + Math.random() * 2500); 
            },

    fetchSignals: async () => {
                let activeSources = [];

                try {
                    const hnRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
                    if (!hnRes.ok) throw new Error(`HTTP ${hnRes.status}`);
                    const hnIds = await hnRes.json();
                    if (!Array.isArray(hnIds)) throw new Error('Invalid HN payload');
                    for(let i=0; i<Math.min(3, hnIds.length); i++) {
                        const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${hnIds[i]}.json`);
                        if (!storyRes.ok) continue;
                        const story = await storyRes.json();
                        if(story && story.id && !os.signalFeed.renderedIds.has(`hn-${story.id}`)) {
                            os.signalFeed.buffer.push({
                                id: `hn-${story.id}`,
                                source: 'Hacker News',
                                icon: 'triangle',
                                title: story.title,
                                color: 'text-orange-500',
                                time: 'LIVE',
                                link: story.url || `https://news.ycombinator.com/item?id=${story.id}`
                            });
                        }
                    }
                    activeSources.push('HN');
                } catch(e) { console.warn('Signal Intercept: HN core failure', e); }

                try {
                    const redRes = await fetch('https://www.reddit.com/r/technology/new.json?limit=3');
                    if (!redRes.ok) throw new Error(`HTTP ${redRes.status}`);
                    const redData = await redRes.json();
                    (redData?.data?.children || []).forEach(child => {
                        if(child?.data?.id && !os.signalFeed.renderedIds.has(`red-${child.data.id}`)) {
                            os.signalFeed.buffer.push({
                                id: `red-${child.data.id}`,
                                source: 'r/technology',
                                icon: 'message-square',
                                title: child.data.title,
                                color: 'text-red-400',
                                time: 'LIVE',
                                link: `https://reddit.com${child.data.permalink}`
                            });
                        }
                    });
                    activeSources.push('REDDIT');
                } catch(e) { console.warn('Signal Intercept: Reddit core failure', e); }

                try {
                    const ghUser = SystemState.settings.api_github;
                    const ghUrl = ghUser ? `https://api.github.com/users/${ghUser}/events/public` : 'https://api.github.com/events';
                    const ghRes = await fetch(ghUrl);
                    if (ghRes.ok) {
                        const ghData = await ghRes.json();
                        const events = ghData.filter(e => e.type === 'PushEvent' || e.type === 'WatchEvent' || e.type === 'CreateEvent').slice(0, 3);
                        events.forEach(ev => {
                            if(!os.signalFeed.renderedIds.has(`gh-${ev.id}`)) {
                                let actionText = ev.type;
                                if (ev.type === 'PushEvent') actionText = `Pushed updates to ${ev.repo.name}`;
                                else if (ev.type === 'WatchEvent') actionText = `Starred repository ${ev.repo.name}`;
                                else if (ev.type === 'CreateEvent') actionText = `Created resource ${ev.repo.name}`;
                                
                                os.signalFeed.buffer.push({
                                    id: `gh-${ev.id}`,
                                    source: ghUser ? `GitHub: ${ghUser}` : 'GitHub Network',
                                    icon: 'github',
                                    title: actionText,
                                    color: 'text-gray-300',
                                    time: 'LIVE',
                                    link: `https://github.com/${ev.repo.name}`
                                });
                            }
                        });
                        activeSources.push('GITHUB');
                    }
                } catch(e) { console.warn('Signal Intercept: Github core failure', e); }

                try {
                    const rssUrlRaw = SystemState.settings.api_rss || 'https://techcrunch.com/feed/';
                    const rssUrl = encodeURIComponent(rssUrlRaw);
                    const rssRes = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`);
                    const rssData = await rssRes.json();
                    if (rssData.status === 'ok') {
                        const items = rssData.items.slice(0, 3);
                        items.forEach(item => {
                            const id = `rss-${item.link.replace(/[^a-z0-9]/gi, '')}`;
                            if(!os.signalFeed.renderedIds.has(id)) {
                                os.signalFeed.buffer.push({
                                    id: id,
                                    source: rssData.feed.title || 'RSS Intercept',
                                    icon: 'rss',
                                    title: item.title,
                                    color: 'text-blue-400',
                                    time: 'LIVE',
                                    link: item.link
                                });
                            }
                        });
                        activeSources.push('RSS');
                    }
                } catch(e) { console.warn('Signal Intercept: RSS core failure', e); }

                const srcLbl = document.getElementById('signal-sources-lbl');
                if (srcLbl) {
                    srcLbl.innerText = activeSources.length > 0
                        ? `SOURCES: ${activeSources.join(', ')}`
                        : 'SOURCES: OFFLINE (FEEDS UNREACHABLE)';
                }
                if (activeSources.length === 0 && os.signalFeed.buffer.length === 0) {
                    const container = document.getElementById('signal-stream-container');
                    if (container && container.children.length <= 1) {
                        container.innerHTML = '<div class="p-6 text-center text-gray-500 font-mono text-[10px]">SIGNAL FEED OFFLINE — Live HN / Reddit / GitHub / RSS endpoints unreachable.</div>';
                    }
                }
            }
});
