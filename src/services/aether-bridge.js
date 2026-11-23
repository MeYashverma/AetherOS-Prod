// AetherOS — AetherBridge WebRTC P2P Device Sync & File Transfer Service
const AetherBridge = (() => {
            const state = {
                hosting: false,
                hostPeer: null,          // PeerJS instance when hosting
                connections: {},         // peerId → DataConnection
                connectedDevices: [],
                activeDevice: null,
                currentPath: '/',
                pathHistory: ['/'],
                pathHistoryIndex: 0,
                sortBy: 'name',
                searchQuery: '',
                transfers: [],
                syncMode: 'manual',
                syncFolders: [],
                previewFile: null,
                sessionToken: null,
                sharedFS: {},            // virtual FS built from File System Access API
                fileHandles: {},         // path → FileSystemFileHandle
            };

            // ── Helpers ──
            const ICONS = {
                dir: '<i data-lucide="folder" class="w-5 h-5 text-emerald-400/80"></i>',
                image: '<i data-lucide="image" class="w-5 h-5 text-sky-400/80"></i>',
                video: '<i data-lucide="film" class="w-5 h-5 text-violet-400/80"></i>',
                audio: '<i data-lucide="music" class="w-5 h-5 text-pink-400/80"></i>',
                pdf: '<i data-lucide="file-text" class="w-5 h-5 text-red-400/80"></i>',
                text: '<i data-lucide="file-code" class="w-5 h-5 text-amber-400/80"></i>',
                archive: '<i data-lucide="archive" class="w-5 h-5 text-orange-400/80"></i>',
                other: '<i data-lucide="file" class="w-5 h-5 text-white/45"></i>'
            };
            const typeOf = name => {
                const ext = name.split('.').pop().toLowerCase();
                if (/jpg|jpeg|png|gif|webp|svg|bmp/.test(ext)) return 'image';
                if (/mp4|webm|mov|avi|mkv/.test(ext)) return 'video';
                if (/mp3|ogg|flac|wav|aac|m4a/.test(ext)) return 'audio';
                if (ext === 'pdf') return 'pdf';
                if (/txt|md|js|ts|html|css|json|py|sh|csv|xml|yaml/.test(ext)) return 'text';
                if (/zip|rar|7z|tar|gz/.test(ext)) return 'archive';
                return 'other';
            };
            const getIcon = f => ICONS[f.type] || ICONS.other;
            const fmtSize = b => { if(!b&&b!==0) return '—'; if(!b) return '0 B'; const u=['B','KB','MB','GB']; let i=0; while(b>=1024&&i<u.length-1){b/=1024;i++;} return `${b.toFixed(1)} ${u[i]}`; };
            const fmtDate = t => t ? new Date(t).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'2-digit'}) : '—';

            function updateStatus(text, online=null) {
                const st=document.getElementById('ab-status-text'); const dot=document.getElementById('ab-conn-dot'); const lbl=document.getElementById('ab-conn-label');
                if(st) st.textContent=text;
                if(online!==null&&dot&&lbl){ dot.className=`w-1.5 h-1.5 rounded-full ${online?'bg-emerald-400':'bg-white/15'}`; lbl.textContent=online?'Connected':'Offline'; }
            }

            // Real QR code generation using the 'qrcode' library (lazy loaded from CDN)
            let _qrLibLoading = null;
            function ensureQRLib() {
                if (window.QRCode) return Promise.resolve();
                if (_qrLibLoading) return _qrLibLoading;
                _qrLibLoading = new Promise((resolve, reject) => {
                    const s = document.createElement('script');
                    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
                    s.onload = resolve;
                    s.onerror = () => reject(new Error('QR library failed to load'));
                    document.head.appendChild(s);
                });
                return _qrLibLoading;
            }

            async function genQR(canvas, text) {
                const size = canvas.width;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, size, size);
                ctx.fillStyle = '#94a3b8';
                ctx.font = '10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('Generating QR…', size/2, size/2);

                try {
                    await ensureQRLib();
                    // qrcodejs renders into a DOM element (canvas or table), so use a detached div
                    const tempDiv = document.createElement('div');
                    tempDiv.style.display = 'none';
                    document.body.appendChild(tempDiv);
                    new QRCode(tempDiv, {
                        text: text,
                        width: size,
                        height: size,
                        colorDark: '#000000',
                        colorLight: '#ffffff',
                        correctLevel: QRCode.CorrectLevel.M
                    });
                    // qrcodejs draws onto a <canvas> or <img> inside tempDiv depending on browser support
                    await new Promise(r => setTimeout(r, 60)); // allow render
                    const innerCanvas = tempDiv.querySelector('canvas');
                    const innerImg = tempDiv.querySelector('img');
                    ctx.clearRect(0, 0, size, size);
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(0, 0, size, size);
                    if (innerCanvas) {
                        ctx.drawImage(innerCanvas, 0, 0, size, size);
                    } else if (innerImg && innerImg.src) {
                        await new Promise(res => {
                            const im = new Image();
                            im.onload = () => { ctx.drawImage(im, 0, 0, size, size); res(); };
                            im.onerror = res;
                            im.src = innerImg.src;
                        });
                    }
                    document.body.removeChild(tempDiv);
                } catch (e) {
                    // Fallback: render the URL as readable text + a simple visual frame if the CDN is unreachable
                    ctx.clearRect(0, 0, size, size);
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(0, 0, size, size);
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 4;
                    ctx.strokeRect(8, 8, size-16, size-16);
                    ctx.fillStyle = '#000';
                    ctx.font = 'bold 11px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText('QR unavailable', size/2, size/2 - 14);
                    ctx.font = '9px monospace';
                    ctx.fillStyle = '#444';
                    const words = text.match(/.{1,22}/g) || [text];
                    words.slice(0,5).forEach((w,i) => ctx.fillText(w, size/2, size/2 + 4 + i*12));
                    ctx.fillStyle = '#999';
                    ctx.font = '8px monospace';
                    ctx.fillText('Copy the ID below instead', size/2, size - 16);
                }
            }

            // Build virtual FS from File System Access API directory
            async function buildFSFromDir(dirHandle, path='/') {
                const entries = [];
                try {
                    for await (const [name, handle] of dirHandle.entries()) {
                        if (handle.kind === 'directory') {
                            entries.push({ name, type: 'dir', size: 0, modified: Date.now() });
                            await buildFSFromDir(handle, path === '/' ? '/'+name : path+'/'+name);
                        } else {
                            const file = await handle.getFile();
                            const t = typeOf(name);
                            entries.push({ name, type: t, size: file.size, modified: file.lastModified });
                            state.fileHandles[path === '/' ? '/'+name : path+'/'+name] = handle;
                        }
                    }
                } catch(e) {}
                state.sharedFS[path] = entries;
            }

            function renderDeviceList() {
                const el=document.getElementById('ab-device-list'); if(!el) return;
                if(!state.connectedDevices.length){el.innerHTML='<div class="text-[9px] text-white/20 py-3 text-center">No devices connected</div>';return;}
                const esc = window.escapeAetherHtml;
                el.innerHTML=state.connectedDevices.map(dev=>`
                    <div class="ab-device-card ${state.activeDevice===dev.id?'active':''}" onclick="window.AetherBridgeAPI.selectDevice('${encodeURIComponent(dev.id)}')">
                        <div class="w-2 h-2 rounded-full shrink-0 ${dev.status==='online'?'bg-emerald-400':'bg-white/20'}"></div>
                        <div class="flex-1 min-w-0">
                            <div class="text-[9px] font-bold text-white/70 truncate">${esc(dev.name)}</div>
                            <div class="text-[7px] text-white/30 font-mono">${esc(dev.id.slice(0,20))}…</div>
                        </div>
                        <button onclick="event.stopPropagation();window.AetherBridgeAPI.disconnectDevice('${encodeURIComponent(dev.id)}')" class="text-white/20 hover:text-red-400 transition hover-target cursor-none p-0.5"><i data-lucide="x" class="w-2.5 h-2.5"></i></button>
                    </div>`).join('');
                if(window.lucide) lucide.createIcons({nodes:[el]});
            }

            function renderFiles(fsData) {
                const container=document.getElementById('ab-files-container');
                const empty=document.getElementById('ab-empty-state');
                const countEl=document.getElementById('ab-file-count');
                if(!container) return;
                const dev=state.connectedDevices.find(d=>d.id===state.activeDevice);
                if(!dev){container.classList.add('hidden');if(empty) empty.classList.remove('hidden');return;}
                let files=[...(fsData||dev.fs||{})[state.currentPath]||[]];
                if(state.searchQuery) files=files.filter(f=>f.name.toLowerCase().includes(state.searchQuery.toLowerCase()));
                files.sort((a,b)=>{
                    if(a.type==='dir'&&b.type!=='dir') return -1;
                    if(a.type!=='dir'&&b.type==='dir') return 1;
                    if(state.sortBy==='name') return a.name.localeCompare(b.name);
                    if(state.sortBy==='size') return b.size-a.size;
                    if(state.sortBy==='modified') return b.modified-a.modified;
                    return 0;
                });
                if(empty) empty.classList.add('hidden');
                container.classList.remove('hidden');
                if(countEl) countEl.textContent=`${files.length} item${files.length!==1?'s':''}`;
                const esc = window.escapeAetherHtml;
                container.innerHTML=`<div class="grid grid-cols-5 gap-2">`+files.map(f=>`
                    <div class="ab-file-item hover-target" ondblclick="window.AetherBridgeAPI.openFile('${encodeURIComponent(f.name)}')" onclick="window.AetherBridgeAPI.selectFile('${encodeURIComponent(f.name)}')" title="${esc(f.name)}">
                        <div class="ab-file-icon flex items-center justify-center">${getIcon(f)}</div>
                        <div class="ab-file-name">${esc(f.name)}</div>
                        <div class="ab-file-size">${f.type==='dir'?'—':fmtSize(f.size)}</div>
                        ${f.type!=='dir'?`<button onclick="event.stopPropagation();window.AetherBridgeAPI.downloadFile('${encodeURIComponent(f.name)}')" class="mt-0.5 px-1.5 py-0.5 text-[7px] rounded border border-emerald-500/20 text-emerald-400/50 hover:border-emerald-500/50 hover:text-emerald-300 transition hover-target cursor-none">↓</button>`:''}
                    </div>`).join('')+`</div>`;
                if(window.lucide) lucide.createIcons({nodes:[container]});
            }

            function updateBreadcrumb() {
                const el=document.getElementById('ab-path-display'); if(!el) return;
                const dev=state.connectedDevices.find(d=>d.id===state.activeDevice);
                const dn=dev?dev.name:'Device';
                const parts=state.currentPath==='/'?[]:state.currentPath.split('/').filter(Boolean);
                el.textContent=`${dn} › ${parts.join(' › ')||'Root'}`;
            }

            function addTransfer(name, size, dir, progress=0, status='running') {
                const id=Date.now();
                state.transfers.unshift({id,name,size,direction:dir,progress,status});
                renderTransfers();
                return id;
            }

            function updateTransfer(id, progress, status) {
                const tr=state.transfers.find(t=>t.id===id);
                if(tr){tr.progress=progress;tr.status=status;}
                renderTransfers();
            }

            function renderTransfers() {
                const panel=document.getElementById('ab-transfer-panel');
                const list=document.getElementById('ab-transfer-list'); if(!list) return;
                const running=state.transfers.filter(t=>t.status==='running');
                if(panel) panel.style.display=running.length>0?'block':'none';
                list.innerHTML=state.transfers.slice(0,4).map(t=>`
                    <div class="ab-transfer-item">
                        <span class="text-[7px] ${t.direction==='up'?'text-emerald-400':'text-sky-400'}">${t.direction==='up'?'↑':'↓'}</span>
                        <div class="flex-1 min-w-0">
                            <div class="text-[8px] text-white/55 truncate">${t.name}</div>
                            <div class="ab-transfer-bar mt-0.5"><div class="ab-transfer-fill" style="width:${t.progress}%;background:${t.direction==='up'?'linear-gradient(90deg,#10b981,#34d399)':'linear-gradient(90deg,#38bdf8,#7dd3fc)'}"></div></div>
                        </div>
                        <span class="text-[7px] font-mono ${t.status==='done'?'text-emerald-400':t.status==='error'?'text-red-400':'text-white/30'}">${t.status==='done'?'✓':t.status==='error'?'✗':Math.round(t.progress)+'%'}</span>
                    </div>`).join('');
            }

            // Send a message over the active connection
            function send(devId, msg) {
                const conn=state.connections[devId];
                if(conn&&conn.open) { try { conn.send(JSON.stringify(msg)); } catch(e) { updateStatus('Send error: '+e.message); } }
            }

            // Handle incoming DataConnection message from remote
            function handleRemoteMsg(devId, data) {
                try { data=typeof data==='string'?JSON.parse(data):data; } catch(e) { return; }
                switch(data.type) {
                    case 'FS_LISTING':
                        const dev=state.connectedDevices.find(d=>d.id===devId);
                        if(dev) {
                            dev.fs = dev.fs || {};
                            dev.fs[data.path] = data.entries;
                            if(state.activeDevice===devId && state.currentPath===data.path) renderFiles(dev.fs);
                            updateStatus(`Loaded ${data.path}`, true);
                        }
                        break;
                    case 'FILE_CHUNK':
                        receiveFileChunk(devId, data);
                        break;
                    case 'FILE_META':
                        receiveFileMeta(devId, data);
                        break;
                    case 'FILE_DONE':
                        finalizeFile(devId, data);
                        break;
                    case 'CLIPBOARD':
                        if(navigator.clipboard) navigator.clipboard.writeText(data.text).catch(()=>{});
                        Notifications.push('Device Sync', 'Clipboard synced from remote device');
                        break;
                    case 'REQUEST_DEVPAD': {
                        let notes = [];
                        try { notes = JSON.parse(localStorage.getItem('AetherOS_DevPad_v1') || '[]'); } catch(e) {}
                        send(devId, { type: 'DEVPAD_SYNC', notes: Array.isArray(notes) ? notes : [] });
                        break;
                    }
                    case 'DEVPAD_SYNC': {
                        if (Array.isArray(data.notes) && data.notes.length) {
                            let local = [];
                            try { local = JSON.parse(localStorage.getItem('AetherOS_DevPad_v1') || '[]'); } catch(e) {}
                            if (!Array.isArray(local)) local = [];
                            const ids = new Set(local.map(n => n && n.id));
                            let added = 0;
                            data.notes.forEach(n => {
                                if (n && n.id && !ids.has(n.id)) { local.unshift(n); ids.add(n.id); added++; }
                            });
                            try { localStorage.setItem('AetherOS_DevPad_v1', JSON.stringify(local)); } catch(e) {}
                            if (window.os && os.devpadInit) os.devpadInit();
                            Notifications.push('Device Sync', `Synced ${added} new DevPad note(s)`);
                        }
                        break;
                    }
                    case 'PING':
                        send(devId, {type:'PONG', ts: data.ts});
                        break;
                }
            }

            // File receive state per device
            const fileReceiveState = {};

            function receiveFileMeta(devId, data) {
                fileReceiveState[data.transferId] = { name: data.name, size: data.size, chunks: [], received: 0, transferId: data.transferId };
                addTransfer(data.name, data.size, 'down');
                updateStatus(`Receiving ${data.name}…`);
            }

            function receiveFileChunk(devId, data) {
                const fs = fileReceiveState[data.transferId]; if(!fs) return;
                // data.chunk is a base64 string
                fs.chunks.push(data.chunk);
                fs.received += data.size;
                const progress = Math.round((fs.received/fs.size)*100);
                // Update transfer bar
                const tr=state.transfers.find(t=>t.name===fs.name&&t.direction==='down'&&t.status==='running');
                if(tr){tr.progress=Math.min(progress,99);renderTransfers();}
            }

            function finalizeFile(devId, data) {
                const fs=fileReceiveState[data.transferId]; if(!fs) return;
                // Reconstruct from base64 chunks and trigger download
                try {
                    const combined = fs.chunks.join('');
                    const binary = atob(combined);
                    const bytes = new Uint8Array(binary.length);
                    for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
                    const blob = new Blob([bytes]);
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href=url; a.download=fs.name; a.click();
                    setTimeout(()=>URL.revokeObjectURL(url), 5000);
                    const tr=state.transfers.find(t=>t.name===fs.name&&t.direction==='down'&&t.status==='running');
                    if(tr){tr.progress=100;tr.status='done';renderTransfers();}
                    updateStatus(`Downloaded: ${fs.name}`, true);
                    Notifications.push('AETHER BRIDGE', `${fs.name} downloaded`);
                } catch(e) {
                    updateStatus('Download error: '+e.message);
                }
                delete fileReceiveState[data.transferId];
            }

            // Send a real file over DataChannel in 16KB chunks
            async function sendFileReal(devId, fileHandle) {
                const file = await fileHandle.getFile();
                const CHUNK = 16384;
                const transferId = 'tx_'+Date.now();
                send(devId, {type:'FILE_META', name:file.name, size:file.size, transferId});
                const trId = addTransfer(file.name, file.size, 'up');
                let offset=0;
                const reader = new FileReader();
                const readNext = () => {
                    const slice = file.slice(offset, offset+CHUNK);
                    reader.readAsArrayBuffer(slice);
                };
                reader.onload = e => {
                    const buf = e.target.result;
                    // Convert to base64 for DataChannel text mode
                    const bytes = new Uint8Array(buf);
                    let binary=''; bytes.forEach(b=>binary+=String.fromCharCode(b));
                    const b64 = btoa(binary);
                    send(devId, {type:'FILE_CHUNK', transferId, chunk:b64, size:buf.byteLength});
                    offset+=buf.byteLength;
                    const progress=Math.round((offset/file.size)*100);
                    updateTransfer(trId, Math.min(progress,99), 'running');
                    if(offset<file.size) { readNext(); }
                    else {
                        send(devId, {type:'FILE_DONE', transferId, name:file.name});
                        updateTransfer(trId, 100, 'done');
                        Notifications.push('AETHER BRIDGE', `${file.name} sent`);
                    }
                };
                readNext();
            }

            function setupConnection(conn, devName) {
                const devId = conn.peer;
                state.connections[devId] = conn;
                conn.on('data', data => handleRemoteMsg(devId, data));
                conn.on('close', () => {
                    delete state.connections[devId];
                    state.connectedDevices = state.connectedDevices.filter(d=>d.id!==devId);
                    renderDeviceList();
                    if(state.activeDevice===devId) { state.activeDevice=null; const c=document.getElementById('ab-files-container');const e=document.getElementById('ab-empty-state');if(c)c.classList.add('hidden');if(e)e.classList.remove('hidden'); }
                    updateStatus('Device disconnected', false);
                    Notifications.push('AETHER BRIDGE', `${devName} disconnected`);
                });
                conn.on('error', e => updateStatus('Connection error: '+e.message));
            }

            function onPeerConnected(conn) {
                const devId = conn.peer;
                // Ask remote what name they are
                conn.on('open', () => {
                    const devName = 'Device '+devId.slice(0,6);
                    const dev = {id:devId, name:devName, status:'online', fs:{}};
                    state.connectedDevices.push(dev);
                    setupConnection(conn, devName);
                    renderDeviceList();
                    updateStatus(`Connected to ${devName}`, true);
                    // Request root listing
                    send(devId, {type:'REQUEST_LISTING', path:'/'});
                    const topbar=document.getElementById('ab-topbar-indicator');const topLbl=document.getElementById('ab-topbar-label');
                    if(topbar) topbar.classList.add('active');
                    if(topLbl) topLbl.textContent=state.connectedDevices.length+' DEVICE'+(state.connectedDevices.length>1?'S':'');
                    Notifications.push('AETHER BRIDGE', `${devName} connected`);
                    os.logTerminal(`Aether Bridge: ${devName} (${devId}) connected`);
                });
            }

            const API = {
                init() {
                    state.sessionToken = Array.from({length:12},()=>Math.floor(Math.random()*16).toString(16)).join('');
                    os.logTerminal('Aether Bridge: Engine ready.');
                },

                async toggleHost() {
                    if(state.hosting) {
                        // Stop hosting
                        if(state.hostPeer) { state.hostPeer.destroy(); state.hostPeer=null; }
                        state.hosting=false;
                        const btn=document.getElementById('ab-host-btn');const dot=document.getElementById('ab-host-dot');
                        const lbl=document.getElementById('ab-host-label');const info=document.getElementById('ab-host-info');
                        const topbar=document.getElementById('ab-topbar-indicator');
                        if(btn) btn.textContent='Start Hosting';
                        if(dot) dot.className='w-2 h-2 rounded-full bg-white/20 shrink-0';
                        if(lbl) lbl.textContent='Not Hosting';
                        if(info) info.classList.add('hidden');
                        if(topbar&&!state.connectedDevices.length) topbar.classList.remove('active');
                        updateStatus('Ready', false);
                        os.logTerminal('Aether Bridge: Hosting stopped.');
                        return;
                    }
                    // Start hosting — pick a shared folder via File System Access API
                    let dirHandle = null;
                    if(window.showDirectoryPicker) {
                        try {
                            updateStatus('Select folder to share…');
                            dirHandle = await window.showDirectoryPicker({mode:'read'});
                            updateStatus('Scanning folder…');
                            await buildFSFromDir(dirHandle, '/');
                        } catch(e) {
                            if(e.name==='AbortError') { updateStatus('Cancelled'); return; }
                            updateStatus('Folder access denied — using demo mode');
                        }
                    } else {
                        updateStatus('File System Access API not supported in this browser');
                    }

                    // Create PeerJS host
                    if(!window.Peer) {
                        updateStatus('Loading PeerJS…');
                        await new Promise((resolve,reject)=>{
                            const s=document.createElement('script');
                            s.src='https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.2/peerjs.min.js';
                            s.onload=resolve; s.onerror=reject;
                            document.head.appendChild(s);
                        });
                    }

                    const peerId='ab-'+state.sessionToken;
                    updateStatus('Connecting to relay server…');
                    state.hostPeer = new Peer(peerId, {debug:0});

                    let hostOpenSettled = false;
                    const hostTimeoutId = setTimeout(() => {
                        if(hostOpenSettled) return;
                        hostOpenSettled = true;
                        updateStatus('Could not reach the relay server — check your internet and try again', false);
                        Notifications.push('AETHER BRIDGE', 'Hosting failed: relay server unreachable');
                        try { state.hostPeer.destroy(); } catch(e) {}
                        state.hostPeer = null;
                    }, 10000);

                    state.hostPeer.on('open', id => {
                        if(hostOpenSettled) return;
                        hostOpenSettled = true;
                        clearTimeout(hostTimeoutId);
                        state.hosting=true;
                        const url=`${location.origin}${location.pathname}?ab_connect=${id}`;
                        state.hostURL=url;
                        const urlEl=document.getElementById('ab-host-url');if(urlEl) urlEl.textContent=id;
                        const btn=document.getElementById('ab-host-btn');const dot=document.getElementById('ab-host-dot');
                        const lbl=document.getElementById('ab-host-label');const info=document.getElementById('ab-host-info');
                        const topbar=document.getElementById('ab-topbar-indicator');const topLbl=document.getElementById('ab-topbar-label');
                        if(btn) btn.textContent='Stop Hosting';
                        if(dot) dot.className='w-2 h-2 rounded-full bg-emerald-400 shrink-0';
                        if(lbl) lbl.textContent='Hosting';
                        if(info) info.classList.remove('hidden');
                        if(topbar) topbar.classList.add('active');
                        if(topLbl) topLbl.textContent='HOSTING';
                        updateStatus('Hosting — send your connect code to the other device', true);
                        Notifications.push('AETHER BRIDGE', `Hosting active. Connect code: ${id}`);
                        os.logTerminal(`Aether Bridge: Hosting as ${id}`);
                    });

                    state.hostPeer.on('error', e => {
                        if(!hostOpenSettled) {
                            hostOpenSettled = true;
                            clearTimeout(hostTimeoutId);
                            updateStatus('Hosting failed: '+(e.type||e.message||'unknown error'), false);
                            Notifications.push('AETHER BRIDGE', `Hosting failed: ${e.type||'connection error'}`);
                            os.logTerminal('Aether Bridge host error: '+(e.message||e.type));
                            state.hostPeer = null;
                            return;
                        }
                        if(state.hosting) {
                            updateStatus('Connection error: '+(e.type||e.message), null);
                            os.logTerminal('Aether Bridge error: '+(e.message||e.type));
                        }
                    });

                    state.hostPeer.on('connection', conn => {
                        conn.on('open', () => {
                            conn.on('data', async rawData => {
                                let data; try { data=JSON.parse(rawData); } catch(e){return;}
                                if(data.type==='REQUEST_LISTING') {
                                    const path=data.path||'/';
                                    const entries = state.sharedFS[path] || [];
                                    conn.send(JSON.stringify({type:'FS_LISTING', path, entries}));
                                } else if(data.type==='REQUEST_FILE') {
                                    const fh=state.fileHandles[data.path];
                                    if(fh) { await sendFileReal(conn.peer, fh); }
                                } else if(data.type==='CLIPBOARD') {
                                    if(navigator.clipboard) navigator.clipboard.writeText(data.text).catch(()=>{});
                                }
                            });
                            const dev={id:conn.peer,name:'Remote '+conn.peer.slice(0,6),status:'online',fs:{}};
                            if(!state.connectedDevices.find(d=>d.id===conn.peer)) {
                                state.connectedDevices.push(dev);
                                state.connections[conn.peer]=conn;
                                renderDeviceList();
                                Notifications.push('AETHER BRIDGE', `${dev.name} connected to your host`);
                            }
                            conn.on('close', ()=>{
                                state.connectedDevices=state.connectedDevices.filter(d=>d.id!==conn.peer);
                                delete state.connections[conn.peer];
                                renderDeviceList();
                            });
                        });
                    });
                },

                async connectToDevice() {
                    const ipEl=document.getElementById('ab-connect-ip');
                    const nameEl=document.getElementById('ab-connect-name');
                    let peerId=(ipEl?.value||'').trim();
                    const devName=(nameEl?.value||'').trim()||'Remote Device';
                    if(!peerId){updateStatus('Enter a connect code first');return;}

                    // Accept either the bare code (ab-xxxx) or a pasted deep-link URL
                    const urlMatch = peerId.match(/[?&]ab_connect=([a-zA-Z0-9-]+)/);
                    if(urlMatch) peerId = urlMatch[1];
                    if(state.connectedDevices.find(d=>d.id===peerId)) { updateStatus('Already connected to this device'); return; }

                    if(!window.Peer) {
                        updateStatus('Loading PeerJS…');
                        try {
                            await new Promise((resolve,reject)=>{
                                const s=document.createElement('script');
                                s.src='https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.2/peerjs.min.js';
                                s.onload=resolve; s.onerror=()=>reject(new Error('Failed to load PeerJS'));
                                document.head.appendChild(s);
                            });
                        } catch(e) {
                            updateStatus('Could not load the connection library — check your internet'); return;
                        }
                    }

                    // Create a client peer if we don't have one yet
                    if(!state.hostPeer || state.hostPeer.destroyed) {
                        const clientId='ab-client-'+state.sessionToken;
                        updateStatus('Connecting to relay server…');
                        state.hostPeer = new Peer(clientId, {debug:0});
                        try {
                            await new Promise((resolve,reject)=>{
                                const t=setTimeout(()=>reject(new Error('Relay server connection timed out')), 10000);
                                state.hostPeer.on('open', ()=>{ clearTimeout(t); resolve(); });
                                state.hostPeer.on('error', e=>{ clearTimeout(t); reject(e); });
                            });
                        } catch(e) {
                            updateStatus('Could not reach the relay server: '+(e.message||e.type||'unknown error'));
                            Notifications.push('AETHER BRIDGE', 'Connection setup failed — check your internet and try again');
                            try { state.hostPeer.destroy(); } catch(err) {}
                            state.hostPeer = null;
                            return;
                        }
                    }

                    updateStatus(`Connecting to ${peerId}…`);
                    const conn = state.hostPeer.connect(peerId, {reliable:true, serialization:'raw'});
                    if(!conn) { updateStatus('Failed to start connection'); return; }

                    let settled = false;
                    const timeoutId = setTimeout(() => {
                        if(settled) return;
                        settled = true;
                        try { conn.close(); } catch(e) {}
                        updateStatus(`Could not reach ${peerId} — make sure that device is hosting right now`, false);
                        Notifications.push('AETHER BRIDGE', `Could not connect: ${peerId} is not reachable`);
                    }, 12000);

                    conn.on('open', () => {
                        settled = true;
                        clearTimeout(timeoutId);
                        const dev={id:peerId,name:devName,status:'online',fs:{}};
                        if(!state.connectedDevices.find(d=>d.id===peerId)) state.connectedDevices.push(dev);
                        setupConnection(conn, devName);
                        renderDeviceList();
                        updateStatus(`Connected to ${devName}`, true);
                        if(ipEl) ipEl.value=''; if(nameEl) nameEl.value='';
                        conn.send(JSON.stringify({type:'REQUEST_LISTING',path:'/'}));
                        const topbar=document.getElementById('ab-topbar-indicator');const topLbl=document.getElementById('ab-topbar-label');
                        if(topbar) topbar.classList.add('active');
                        if(topLbl) topLbl.textContent=state.connectedDevices.length+' DEVICE'+(state.connectedDevices.length>1?'S':'');
                        Notifications.push('AETHER BRIDGE', `Connected to ${devName}`);
                        os.logTerminal(`Aether Bridge: Connected to ${devName} (${peerId})`);
                        this.selectDevice(peerId);
                    });
                    conn.on('error', e => {
                        settled = true;
                        clearTimeout(timeoutId);
                        updateStatus('Connection failed: '+(e.message||e.type||'unknown error'), false);
                        Notifications.push('AETHER BRIDGE', `Connection to ${peerId} failed`);
                    });
                },

                copyHostId() {
                    const id = state.hostPeer?.id;
                    if(!id) return;
                    navigator.clipboard?.writeText(id).catch(()=>{});
                    Notifications.push('AETHER BRIDGE', 'Connect code copied to clipboard');
                },

                selectDevice(rawId) {
                    const id = decodeURIComponent(rawId);
                    state.activeDevice=id; state.currentPath='/'; state.pathHistory=['/']; state.pathHistoryIndex=0;
                    renderDeviceList(); updateBreadcrumb();
                    send(id, {type:'REQUEST_LISTING', path:'/'});
                    updateStatus('Loading file listing…', true);
                },

                disconnectDevice(rawId) {
                    const id = decodeURIComponent(rawId);
                    const conn=state.connections[id]; if(conn) try{conn.close();}catch(e){}
                    delete state.connections[id];
                    state.connectedDevices=state.connectedDevices.filter(d=>d.id!==id);
                    if(state.activeDevice===id){
                        state.activeDevice=null;
                        const c=document.getElementById('ab-files-container');const e=document.getElementById('ab-empty-state');
                        if(c) c.classList.add('hidden');if(e) e.classList.remove('hidden');
                        updateStatus('Disconnected', false);
                    }
                    renderDeviceList();
                    if(!state.connectedDevices.length){const tb=document.getElementById('ab-topbar-indicator');if(tb&&!state.hosting) tb.classList.remove('active');}
                },

                openFile(enc) {
                    const name=decodeURIComponent(enc);
                    const dev=state.connectedDevices.find(d=>d.id===state.activeDevice);
                    const files=((dev?.fs)||{})[state.currentPath]||[];
                    const file=files.find(f=>f.name===name); if(!file) return;
                    if(file.type==='dir') {
                        const newPath=state.currentPath==='/'?'/'+name:state.currentPath+'/'+name;
                        const trim=state.pathHistory.slice(0,state.pathHistoryIndex+1);
                        state.pathHistory=[...trim,newPath]; state.pathHistoryIndex=state.pathHistory.length-1;
                        state.currentPath=newPath;
                        send(state.activeDevice, {type:'REQUEST_LISTING', path:newPath});
                        updateBreadcrumb(); updateStatus('Loading…');
                    } else {
                        state.previewFile=file;
                        const modal=document.getElementById('ab-preview-modal');const title=document.getElementById('ab-preview-title');const body=document.getElementById('ab-preview-body');
                        if(!modal||!title||!body) return;
                        title.textContent=file.name;
                        const esc = window.escapeAetherHtml;
                        const safeName = esc(file.name);
                        const bodyMap={
                            image:`<div class="text-center"><div class="w-64 h-48 rounded-lg border border-white/10 flex items-center justify-center mb-3" style="background:rgba(255,255,255,0.03)"><i data-lucide="image" class="w-12 h-12 text-sky-400/60"></i></div><div class="text-[9px] text-white/30">${safeName}<br>${fmtSize(file.size)}</div></div>`,
                            video:`<div class="text-center"><div class="w-72 h-44 rounded-lg border border-white/10 flex items-center justify-center mb-3" style="background:rgba(0,0,0,0.3)"><i data-lucide="film" class="w-12 h-12 text-violet-400/60"></i></div><div class="text-[9px] text-white/30">${safeName}<br>${fmtSize(file.size)}</div></div>`,
                            audio:`<div class="text-center"><div class="w-44 h-44 rounded-full border border-white/10 flex items-center justify-center mb-3 mx-auto" style="background:rgba(0,0,0,0.3)"><i data-lucide="music" class="w-12 h-12 text-pink-400/60"></i></div><div class="text-[9px] text-white/30">${safeName}<br>${fmtSize(file.size)}</div></div>`,
                            text:`<div class="w-full"><pre class="text-[9px] text-white/60 whitespace-pre-wrap font-mono p-2">[Requesting content from remote…]\n\n${safeName} · ${fmtSize(file.size)}</pre></div>`,
                            pdf:`<div class="text-center"><div class="w-44 h-60 rounded-lg border border-white/10 flex items-center justify-center mb-3" style="background:rgba(0,0,0,0.3)"><i data-lucide="file-text" class="w-12 h-12 text-red-400/60"></i></div><div class="text-[9px] text-white/30">${safeName}<br>${fmtSize(file.size)}</div></div>`
                        };
                        body.innerHTML=bodyMap[file.type]||`<div class="text-center"><div class="mb-3 flex justify-center"><i data-lucide="file" class="w-12 h-12 text-white/40"></i></div><div class="text-[9px] text-white/30">${safeName}</div></div>`;
                        modal.style.display='flex';
                        if(window.lucide) lucide.createIcons({nodes:[modal]});
                    }
                },

                selectFile(enc) { const name=decodeURIComponent(enc); document.querySelectorAll('.ab-file-item').forEach(el=>{const fn=el.querySelector('.ab-file-name')?.textContent;if(fn===name) el.classList.toggle('selected');}); },

                downloadFile(enc) {
                    const name=decodeURIComponent(enc);
                    // Request the actual file from remote device
                    const fullPath=state.currentPath==='/'?'/'+name:state.currentPath+'/'+name;
                    send(state.activeDevice, {type:'REQUEST_FILE', path:fullPath, name});
                    updateStatus(`Requesting: ${name}…`);
                    Notifications.push('AETHER BRIDGE', `Downloading ${name}…`);
                },

                downloadPreviewFile() { if(!state.previewFile) return; this.downloadFile(encodeURIComponent(state.previewFile.name)); document.getElementById('ab-preview-modal').style.display='none'; },

                navBack() { if(state.pathHistoryIndex>0){state.pathHistoryIndex--;state.currentPath=state.pathHistory[state.pathHistoryIndex];send(state.activeDevice,{type:'REQUEST_LISTING',path:state.currentPath});updateBreadcrumb();updateStatus('Loading…');} },
                navForward() { if(state.pathHistoryIndex<state.pathHistory.length-1){state.pathHistoryIndex++;state.currentPath=state.pathHistory[state.pathHistoryIndex];send(state.activeDevice,{type:'REQUEST_LISTING',path:state.currentPath});updateBreadcrumb();updateStatus('Loading…');} },
                navUp() { if(state.currentPath==='/') return;const parts=state.currentPath.split('/');parts.pop();const np=parts.join('/')||'/';const trim=state.pathHistory.slice(0,state.pathHistoryIndex+1);state.pathHistory=[...trim,np];state.pathHistoryIndex=state.pathHistory.length-1;state.currentPath=np;send(state.activeDevice,{type:'REQUEST_LISTING',path:np});updateBreadcrumb();updateStatus('Loading…'); },
                search(q) { state.searchQuery=q; const dev=state.connectedDevices.find(d=>d.id===state.activeDevice); if(dev) renderFiles(dev.fs); },
                sort(by) { state.sortBy=by; const dev=state.connectedDevices.find(d=>d.id===state.activeDevice); if(dev) renderFiles(dev.fs); },
                refresh() { if(state.activeDevice) { send(state.activeDevice,{type:'REQUEST_LISTING',path:state.currentPath}); updateStatus('Refreshing…'); } },

                async showQR() {
                    const modal=document.getElementById('ab-qr-modal');const canvas=document.getElementById('ab-qr-canvas');const urlEl=document.getElementById('ab-qr-url');
                    if(!modal||!canvas) return;

                    if(!state.hosting || !state.hostPeer || !state.hostPeer.id) {
                        Notifications.push('AETHER BRIDGE', 'Start hosting first to generate a connect code');
                        updateStatus('Start hosting before generating a QR code');
                        return;
                    }

                    const hostId = state.hostPeer.id;
                    // Real, working connect string: the AetherBridge Peer ID itself.
                    // If the page is served over http(s), also build a deep-link URL that
                    // auto-fills the connect field when opened on another device running this OS.
                    const isWebURL = location.protocol === 'http:' || location.protocol === 'https:';
                    const payload = isWebURL
                        ? `${location.origin}${location.pathname}?ab_connect=${hostId}`
                        : hostId; // file:// can't be opened cross-device, so encode just the Peer ID

                    modal.style.display='flex';
                    if(urlEl) urlEl.textContent = 'Generating…';
                    await genQR(canvas, payload);
                    if(urlEl) urlEl.textContent = payload;
                    state._lastQRPayload = payload;
                },

                copyQRPayload() {
                    if(!state._lastQRPayload) return;
                    navigator.clipboard?.writeText(state._lastQRPayload).catch(()=>{});
                    Notifications.push('AETHER BRIDGE', 'Connect code copied to clipboard');
                },

                setSyncMode(mode) { state.syncMode=mode; document.querySelectorAll('.ab-sync-mode-btn').forEach(b=>{b.classList.toggle('border-emerald-500/40',b.dataset.mode===mode);b.classList.toggle('text-emerald-300',b.dataset.mode===mode);}); },

                startSync() {
                    const folders=[];
                    if(document.getElementById('ab-sync-downloads')?.checked) folders.push('Downloads');
                    if(document.getElementById('ab-sync-documents')?.checked) folders.push('Documents');
                    if(document.getElementById('ab-sync-photos')?.checked) folders.push('Photos');
                    if(document.getElementById('ab-sync-notes')?.checked) folders.push('Notes');
                    const syncDevPad = !!document.getElementById('ab-sync-devpad')?.checked;
                    if(!folders.length && !syncDevPad){updateStatus('Select at least one folder or DevPad Notes');return;}
                    state.syncFolders=folders;
                    document.getElementById('ab-sync-modal').style.display='none';
                    folders.forEach(f=>{
                        if(state.activeDevice) send(state.activeDevice,{type:'REQUEST_LISTING',path:'/'+f});
                        addTransfer('/'+f+' (sync)',0,'down');
                    });
                    if (syncDevPad && state.activeDevice) {
                        let notes = [];
                        try { notes = JSON.parse(localStorage.getItem('AetherOS_DevPad_v1') || '[]'); } catch(e) {}
                        send(state.activeDevice, { type: 'DEVPAD_SYNC', notes: Array.isArray(notes) ? notes : [] });
                        send(state.activeDevice, { type: 'REQUEST_DEVPAD' });
                        addTransfer('DevPad Notes', JSON.stringify(notes).length, 'up');
                    }
                    const summary = [...folders, ...(syncDevPad ? ['DevPad Notes'] : [])].join(', ');
                    updateStatus(`Syncing: ${summary}…`);
                    Notifications.push('Device Sync', `Sync started [${state.syncMode}]: ${summary}`);
                    os.logTerminal(`Device Sync: [${state.syncMode}] — ${summary}`);
                },
            };

            // Check URL params on load for auto-connect
            (() => {
                const params=new URLSearchParams(location.search);
                const abId=params.get('ab_connect');
                if(abId) {
                    document.addEventListener('DOMContentLoaded', ()=>{
                        setTimeout(()=>{ const ipEl=document.getElementById('ab-connect-ip');if(ipEl){ipEl.value=abId;API.connectToDevice();} },2000);
                    });
                }
            })();

            window.AetherBridgeAPI=API;
            return API;
        })();

window.extendOS({
    abToggleHost:      () => window.AetherBridgeAPI?.toggleHost(),

    abConnectToDevice: () => window.AetherBridgeAPI?.connectToDevice(),

    abSelectDevice:    (id) => window.AetherBridgeAPI?.selectDevice(id),

    abDisconnectDevice:(id) => window.AetherBridgeAPI?.disconnectDevice(id),

    abOpenFile:        (n) => window.AetherBridgeAPI?.openFile(n),

    abSelectFile:      (n) => window.AetherBridgeAPI?.selectFile(n),

    abDownloadFile:    (n) => window.AetherBridgeAPI?.downloadFile(n),

    abDownloadPreviewFile: () => window.AetherBridgeAPI?.downloadPreviewFile(),

    abNavBack:         () => window.AetherBridgeAPI?.navBack(),

    abNavForward:      () => window.AetherBridgeAPI?.navForward(),

    abNavUp:           () => window.AetherBridgeAPI?.navUp(),

    abSearch:          (q) => window.AetherBridgeAPI?.search(q),

    abSort:            (b) => window.AetherBridgeAPI?.sort(b),

    abRefresh:         () => window.AetherBridgeAPI?.refresh(),

    abShowQR:          () => window.AetherBridgeAPI?.showQR(),

    abSetSyncMode:     (m) => window.AetherBridgeAPI?.setSyncMode(m),

    abStartSync:       () => window.AetherBridgeAPI?.startSync()
});
