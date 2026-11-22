// AetherOS — AetherLink P2P Chat, Voice Walkie-Talkie, Screen Share & Mini-Apps Service
const AetherLink = (() => {
            const EMOJIS=['😀','😂','🥰','😎','🤔','😮','👍','👎','❤️','🔥','⚡','🎵','🚀','💎','🌙','⭐','🎉','🎨','💡','🔗','⚙️','🧠','👾','🎮','📡','🌐','🔮','💫','🎯','✨','🌊','🍀'];
            const state={
                myCode:null, myName:'Workstation', myStatus:'online',
                peers:{},   // peerId → { id, name, status, chatHistory, presence, conn }
                activePeer:null, activeTab:'chat',
                peer:null,  // PeerJS instance
                wbTool:'pen', wbColor:'#a78bfa', wbSize:4,
                wbDrawing:false, wbLastX:0, wbLastY:0,
                pendingPairReq:null, activityLog:[], emojiVisible:false,
            };
            const todoItems=[];

            // ── Chess game state (real, move-validated, turn-enforced) ──
            const chessState = {
                board: null,       // 8x8 array, null or {type,color}
                turn: 'w',         // 'w' or 'b'
                myColor: null,     // assigned on first sync: host=w, joiner=b
                selected: null,    // {r,c} of selected piece
                moveLog: [],
                gameId: null,
            };

            // ── Pixel art state (16x16 grid, real synced colors) ──
            const pixelState = {
                grid: new Array(256).fill(''),  // hex colors or '' for blank
            };

            // ── Screen share state (real getDisplayMedia + WebRTC) ──
            const screenShareState = {
                active: false,
                isSharing: false,      // am I the one sharing my screen
                isViewing: false,      // am I viewing someone else's screen
                localStream: null,
                pc: null,              // RTCPeerConnection for screen share
                remotePeerId: null,
                pendingICE: [],
            };

            // ── Voice chat / walkie-talkie state (real getUserMedia + WebRTC audio) ──
            const voiceState = {
                mode: null,           // null | 'open' (continuous duplex) | 'walkie' (push-to-talk)
                active: false,
                localStream: null,
                connections: {},      // peerId → { pc, remoteAudioEl, sending }
                pttHeld: false,       // is the push-to-talk key currently held
                pendingICE: {},       // peerId → [candidates] queued before remote description set
                mutedOutput: false,
            };
            let peerJsLoaded=false;

            async function ensurePeerJS() {
                if(window.Peer) return;
                if(peerJsLoaded) return;
                peerJsLoaded=true;
                await new Promise((resolve,reject)=>{
                    const s=document.createElement('script');
                    s.src='https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.2/peerjs.min.js';
                    s.onload=resolve; s.onerror=()=>reject(new Error('PeerJS CDN failed'));
                    document.head.appendChild(s);
                });
            }

            async function createPeer(id) {
                await ensurePeerJS();
                return new Promise((resolve, reject)=>{
                    const p = new Peer(id, {
                        debug: 0,
                        config: {
                            iceServers: [
                                {urls:'stun:stun.l.google.com:19302'},
                                {urls:'stun:stun1.l.google.com:19302'},
                                {urls:'stun:global.stun.twilio.com:3478'}
                            ]
                        }
                    });
                    let settled = false;
                    const timeoutId = setTimeout(() => {
                        if(settled) return;
                        settled = true;
                        try { p.destroy(); } catch(e) {}
                        reject(new Error('Signaling server connection timed out'));
                    }, 10000);
                    p.on('open', () => {
                        if(settled) return;
                        settled = true;
                        clearTimeout(timeoutId);
                        resolve(p);
                    });
                    p.on('error', e => {
                        if(settled) return;
                        settled = true;
                        clearTimeout(timeoutId);
                        try { p.destroy(); } catch(err) {}
                        reject(e);
                    });
                });
            }

            function sendToPeer(peerId, msg) {
                const peer=state.peers[peerId]; if(!peer) return;
                if(peer.conn && peer.conn.open) {
                    try { peer.conn.send(JSON.stringify(msg)); } catch(e) {}
                } else if(peer.bc || !peer.conn) {
                    // Same-browser peer (or no live WebRTC channel yet) — route via BroadcastChannel
                    bcSend({...msg, targetCode: peerId});
                }
            }

            function broadcastAll(msg) {
                Object.keys(state.peers).forEach(id=>sendToPeer(id, msg));
                // Also broadcast via BC for any same-browser tabs that haven't formally "joined" yet
                bcSend({...msg, broadcast: true});
            }

            function handlePeerMsg(fromId, rawData) {
                let data; try { data=typeof rawData==='string'?JSON.parse(rawData):rawData; } catch(e){return;}
                switch(data.type) {
                    case 'HELLO':
                        if(state.peers[fromId]) { state.peers[fromId].name=data.name||fromId; renderPeers(); renderPresence(); }
                        // Reply with my info
                        sendToPeer(fromId, {type:'HELLO_ACK', name:state.myName, status:state.myStatus});
                        break;
                    case 'HELLO_ACK':
                        if(state.peers[fromId]) { state.peers[fromId].name=data.name||fromId; state.peers[fromId].status=data.status||'online'; renderPeers(); renderPresence(); }
                        break;
                    case 'CHAT_MSG':
                        receiveMsg(fromId, data);
                        break;
                    case 'TYPING':
                        showTyping(state.peers[fromId]?.name||fromId);
                        break;
                    case 'PRESENCE_UPDATE':
                        if(state.peers[fromId]) { state.peers[fromId].presence=data.presence; renderPresence(); }
                        break;
                    case 'ACTIVITY':
                        addActivity(state.peers[fromId]?.name||fromId, data.activity);
                        break;
                    case 'WB_STROKE':
                        receiveStroke(data);
                        break;
                    case 'WB_CLEAR':
                        clearRemoteCanvas();
                        break;
                    case 'FILE_OFFER':
                        showFileOffer(fromId, data);
                        break;
                    case 'FILE_CHUNK':
                        receiveFileChunk(fromId, data);
                        break;
                    case 'FILE_META':
                        receiveFileMeta(fromId, data);
                        break;
                    case 'FILE_DONE':
                        finalizeFileTransfer(fromId, data);
                        break;
                    case 'STATUS_UPDATE':
                        if(state.peers[fromId]) { state.peers[fromId].status=data.status; renderPeers(); renderPresence(); }
                        break;
                    case 'SHARED_NOTES':
                        sharedNotesState.text = data.text;
                        const notesEl=document.getElementById('al-shared-notes');
                        if(notesEl && notesEl.value!==data.text) notesEl.value=data.text;
                        break;
                    case 'SHARED_NOTES_REQUEST':
                        sendToPeer(fromId, {type:'SHARED_NOTES', text: sharedNotesState.text});
                        break;
                    case 'TODO_SYNC':
                        todoItems.length=0; data.items.forEach(i=>todoItems.push(i)); renderTodos();
                        break;
                    case 'TODO_SYNC_REQUEST':
                        sendToPeer(fromId, {type:'TODO_SYNC', items: todoItems});
                        break;
                    case 'CHESS_MOVE':
                        applyRemoteChessMove(data);
                        break;
                    case 'CHESS_RESET':
                        resetChessBoard(false);
                        break;
                    case 'CHESS_SYNC_REQUEST':
                        sendToPeer(fromId, {type:'CHESS_SYNC_STATE', board: chessState.board, turn: chessState.turn, moveLog: chessState.moveLog});
                        break;
                    case 'CHESS_SYNC_STATE':
                        chessState.board = data.board; chessState.turn = data.turn; chessState.moveLog = data.moveLog || [];
                        renderChessBoard();
                        break;
                    case 'PIXEL_PAINT':
                        applyRemotePixel(data.index, data.color);
                        break;
                    case 'PIXEL_CLEAR':
                        resetPixelGrid(false);
                        break;
                    case 'PIXEL_SYNC_REQUEST':
                        sendToPeer(fromId, {type:'PIXEL_SYNC_STATE', grid: pixelState.grid});
                        break;
                    case 'PIXEL_SYNC_STATE':
                        pixelState.grid = data.grid;
                        renderPixelGridFromState();
                        break;
                    case 'SCREEN_SHARE_OFFER':
                        showScreenShareIncoming(fromId, data);
                        break;
                    case 'SCREEN_SHARE_ANSWER':
                        handleScreenShareAnswer(fromId, data);
                        break;
                    case 'SCREEN_SHARE_ICE':
                        handleScreenShareICE(fromId, data);
                        break;
                    case 'SCREEN_SHARE_STOP':
                        handleScreenShareStop(fromId);
                        break;
                    case 'VOICE_INVITE':
                        handleVoiceInvite(fromId, data);
                        break;
                    case 'VOICE_OFFER':
                        handleVoiceOffer(fromId, data);
                        break;
                    case 'VOICE_ANSWER':
                        handleVoiceAnswer(fromId, data);
                        break;
                    case 'VOICE_ICE':
                        handleVoiceICE(fromId, data);
                        break;
                    case 'VOICE_LEAVE':
                        handleVoiceLeave(fromId);
                        break;
                    case 'VOICE_PTT_START':
                        handlePTTStart(fromId);
                        break;
                    case 'VOICE_PTT_END':
                        handlePTTEnd(fromId);
                        break;
                }
            }

            // ── BroadcastChannel for same-browser cross-tab ──
            let _bc = null;
            function initBC() {
                try {
                    _bc = new BroadcastChannel('aether_link_v1');
                    _bc.onmessage = e => {
                        const data=e.data;
                        if(!data||data.from===state.myCode) return;
                        // Route BC messages same as peer messages
                        switch(data.type) {
                            case 'PAIR_REQUEST':
                                if(data.targetCode===state.myCode) showPairModal(data);
                                break;
                            case 'PAIR_ACCEPT':
                                if(data.targetCode===state.myCode) {
                                    // Same-browser: connect via BC only
                                    connectPeerBC(data.from, data.fromName);
                                }
                                break;
                            case 'PAIR_REJECT':
                                if(data.targetCode===state.myCode) Notifications.push('AETHER LINK',`${data.fromName} declined`);
                                break;
                            default:
                                if(state.peers[data.from]) handlePeerMsg(data.from, data);
                        }
                    };
                } catch(e) {}
            }

            function bcSend(msg) {
                if(_bc) try { _bc.postMessage({...msg, from:state.myCode, fromName:state.myName, ts:Date.now()}); } catch(e){}
            }

            // BC-only peer (same browser, no WebRTC needed)
            function connectPeerBC(peerId, peerName) {
                if(state.peers[peerId]) return;
                state.peers[peerId]={id:peerId,name:peerName,status:'online',chatHistory:[],presence:{app:'—',music:'—',theme:'—',workspace:1},conn:null,bc:true};
                finalizePeerConnect(peerId, peerName);
            }

            function connectPeer(peerId, peerName) {
                if(state.peers[peerId]) return; // already connected
                state.peers[peerId]={id:peerId,name:peerName||peerId,status:'online',chatHistory:[],presence:{app:'—',music:'—',theme:'—',workspace:1},conn:null};
                finalizePeerConnect(peerId, peerName);
            }

            function finalizePeerConnect(peerId, peerName) {
                renderPeers(); updateConnIndicator(); addActivity(peerName,'connected');
                const sel=document.getElementById('al-chat-peer');
                if(sel){const o=document.createElement('option');o.value=peerId;o.textContent=peerName;sel.appendChild(o);}
                Notifications.push('AETHER LINK',`${peerName} connected`);
                os.logTerminal(`Aether Link: ${peerName} (${peerId}) connected`);
                broadcastPresence();
            }

            function setupDataConn(conn) {
                const peerId=conn.peer;
                conn.on('open',()=>{
                    if(!state.peers[peerId]) {
                        state.peers[peerId]={id:peerId,name:peerId,status:'online',chatHistory:[],presence:{},conn};
                        finalizePeerConnect(peerId, peerId);
                    } else {
                        state.peers[peerId].conn=conn;
                    }
                    // Exchange names
                    conn.send(JSON.stringify({type:'HELLO',name:state.myName,status:state.myStatus}));
                });
                conn.on('data', data=>handlePeerMsg(peerId, data));
                conn.on('close',()=>removePeer(peerId));
                conn.on('error',e=>{Notifications.push('AETHER LINK','Connection error: '+e.message);});
            }

            function removePeer(id) {
                if(!state.peers[id]) return;
                const name=state.peers[id].name;
                delete state.peers[id];
                if(voiceState.connections[id]) teardownVoicePeer(id, false);
                if(screenShareState.remotePeerId === id) stopScreenShareReal(false);
                renderPeers(); renderPresence(); updateConnIndicator(); addActivity(name,'disconnected');
                const sel=document.getElementById('al-chat-peer');
                const opt=sel?.querySelector(`option[value="${id}"]`); if(opt) opt.remove();
                Notifications.push('AETHER LINK',`${name} disconnected`);
            }

            function renderPeers() {
                const el=document.getElementById('al-peer-list'); if(!el) return;
                const peers=Object.values(state.peers);
                if(!peers.length){el.innerHTML='<div class="text-[9px] text-white/20 text-center py-2">No connections</div>';return;}
                const esc = window.escapeAetherHtml;
                el.innerHTML=peers.map(p=>`
                    <div class="al-peer-card connected hover-target" onclick="window.AetherLinkAPI.openChat('${encodeURIComponent(p.id)}')">
                        <div class="w-2 h-2 rounded-full shrink-0 ${p.status==='online'?'bg-emerald-400':p.status==='away'?'bg-yellow-400':'bg-red-400'}"></div>
                        <div class="flex-1 min-w-0">
                            <div class="text-[9px] font-bold text-white/70 truncate">${esc(p.name)}</div>
                            <div class="text-[7px] text-violet-400/60 font-mono">${esc(p.id.slice(0,18))}…</div>
                        </div>
                        <button onclick="event.stopPropagation();window.AetherLinkAPI.disconnect('${encodeURIComponent(p.id)}')" class="text-white/20 hover:text-red-400 transition hover-target cursor-none p-0.5"><i data-lucide="x" class="w-2.5 h-2.5"></i></button>
                    </div>`).join('');
                if(window.lucide) lucide.createIcons({nodes:[el]});
            }

            function updateConnIndicator() {
                const dot=document.getElementById('al-conn-dot');const txt=document.getElementById('al-conn-text');
                const tb=document.getElementById('al-topbar-indicator');const tl=document.getElementById('al-topbar-label');
                const n=Object.keys(state.peers).length;
                if(dot) dot.className=`w-1.5 h-1.5 rounded-full ${n>0?'bg-violet-400':'bg-white/20'}`;
                if(txt) txt.textContent=n>0?`${n} peer${n>1?'s':''} connected`:'Disconnected';
                if(tb){if(n>0){tb.classList.add('active');if(tl) tl.textContent=`LINKED (${n})`;}else tb.classList.remove('active');}
            }

            function receiveMsg(fromId, data) {
                if(!state.peers[fromId]) return;
                const msg={id:Date.now(),from:fromId,fromName:state.peers[fromId].name,text:String(data.text||''),ts:data.ts||Date.now(),mine:false};
                state.peers[fromId].chatHistory.push(msg);
                renderChat(fromId);
                if(state.activeTab!=='chat'||state.activePeer!==fromId) Notifications.push(state.peers[fromId].name, String(data.text||'').slice(0,60));
                addActivity(state.peers[fromId].name,'sent a message');
                const ti=document.getElementById('al-typing-indicator');if(ti) ti.classList.add('hidden');
            }

            function renderChat(peerId) {
                const c=document.getElementById('al-chat-messages'); if(!c) return;
                const peer=state.peers[peerId];
                if(!peer||!peer.chatHistory.length){c.innerHTML='<div class="flex flex-col items-center justify-center h-full gap-3 text-white/20 py-8"><div class="text-xs">No messages yet</div></div>';return;}
                const esc = window.escapeAetherHtml;
                c.innerHTML=peer.chatHistory.map(m=>`
                    <div class="al-chat-msg ${m.mine?'mine':'theirs'}">
                        <div class="al-chat-bubble">${esc(m.text)}</div>
                        <div class="al-chat-meta">${m.mine?'You':esc(m.fromName)} · ${new Date(m.ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                    </div>`).join('');
                c.scrollTop=c.scrollHeight;
            }

            let typingTimer=null;
            function showTyping(name){
                const el=document.getElementById('al-typing-indicator'); if(!el) return;
                el.textContent=`${name} is typing…`; el.classList.remove('hidden');
                clearTimeout(typingTimer); typingTimer=setTimeout(()=>el.classList.add('hidden'),3000);
            }

            function broadcastPresence() {
                const topWin = Object.values(SystemState.windows).filter(w=>w&&w.isOpen&&!w.isMinimized).sort((a,b)=>(b.zIndex||0)-(a.zIndex||0))[0];
                const presence={app:topWin?topWin.title:'—',music:os.nowPlaying?.title||'—',theme:SystemState.settings?.active_theme||'midnight',workspace:SystemState.currentWorkspace||1,status:state.myStatus};
                broadcastAll({type:'PRESENCE_UPDATE',presence});
            }

            function renderPresence(){
                const grid=document.getElementById('al-presence-grid'); if(!grid) return;
                const peers=Object.values(state.peers);
                if(!peers.length){grid.innerHTML='<div class="col-span-1 text-center text-white/20 py-8"><div class="text-xs">No peers connected</div></div>';return;}
                const sc={online:'text-emerald-400',away:'text-yellow-400',busy:'text-red-400'};
                const esc = window.escapeAetherHtml;
                grid.innerHTML=peers.map(p=>`
                    <div class="al-presence-card">
                        <div class="flex items-center gap-2 mb-3">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.25)">${esc((p.name||'?')[0].toUpperCase())}</div>
                            <div><div class="text-[10px] font-bold text-white/80">${esc(p.name)}</div><div class="text-[8px] ${sc[p.status]||'text-white/30'}">${esc(p.status)}</div></div>
                        </div>
                        <div class="al-presence-stat"><i data-lucide="music" class="w-2.5 h-2.5 text-violet-400/60 shrink-0"></i><span class="truncate">${esc(p.presence?.music||'—')}</span></div>
                        <div class="al-presence-stat"><i data-lucide="app-window" class="w-2.5 h-2.5 text-violet-400/60 shrink-0"></i><span class="truncate">${esc(p.presence?.app||'—')}</span></div>
                        <div class="al-presence-stat"><i data-lucide="layers" class="w-2.5 h-2.5 text-violet-400/60 shrink-0"></i><span>Theme: ${esc(p.presence?.theme||'—')}</span></div>
                        <div class="al-presence-stat"><i data-lucide="layout-grid" class="w-2.5 h-2.5 text-violet-400/60 shrink-0"></i><span>Workspace ${Number(p.presence?.workspace)||1}</span></div>
                        <button onclick="window.AetherLinkAPI.openChat('${encodeURIComponent(p.id)}')" class="mt-2 w-full py-1 text-[7px] rounded border border-white/8 hover:border-violet-500/30 text-white/30 hover:text-violet-300 transition hover-target cursor-none">Chat</button>
                    </div>`).join('');
                if(window.lucide) lucide.createIcons({nodes:[grid]});
            }

            function addActivity(name,act){
                state.activityLog.unshift({name,act,ts:Date.now()});state.activityLog=state.activityLog.slice(0,50);
                const feed=document.getElementById('al-activity-feed'); if(!feed) return;
                const esc = window.escapeAetherHtml;
                feed.innerHTML=state.activityLog.map(i=>`
                    <div class="al-activity-item">
                        <div class="al-activity-dot"></div>
                        <div class="flex-1"><span class="text-[9px] font-bold text-violet-300/80">${esc(i.name)}</span><span class="text-[9px] text-white/40"> ${esc(i.act)}</span></div>
                        <div class="text-[7px] text-white/20 shrink-0">${new Date(i.ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                    </div>`).join('');
            }

            function showPairModal(data){
                state.pendingPairReq=data;
                const m=document.getElementById('al-pair-modal');
                const t=document.getElementById('al-pair-title');const msg=document.getElementById('al-pair-msg');
                if(!m){Notifications.push('AETHER LINK',`Pair request from ${data.fromName}`);return;}
                if(t) t.textContent='Pair Request';if(msg) msg.textContent=`${data.fromName} wants to connect`;
                m.style.display='flex'; Notifications.push('AETHER LINK',`Pair request from ${data.fromName}`);
            }

            // ── Whiteboard ──
            function initWB() {
                const canvas=document.getElementById('al-wb-canvas');const rc=document.getElementById('al-wb-remote-canvas'); if(!canvas) return;
                const resize=()=>{const r=canvas.parentElement?.getBoundingClientRect();if(!r) return;canvas.width=r.width;canvas.height=r.height;if(rc){rc.width=r.width;rc.height=r.height;}};
                resize();
                const ctx=canvas.getContext('2d'); let sx,sy;
                canvas.addEventListener('pointerdown',e=>{state.wbDrawing=true;const r=canvas.getBoundingClientRect();state.wbLastX=e.clientX-r.left;state.wbLastY=e.clientY-r.top;sx=state.wbLastX;sy=state.wbLastY;canvas.setPointerCapture(e.pointerId);if(state.wbTool==='sticky') addSticky(ctx,sx,sy);});
                canvas.addEventListener('pointermove',e=>{
                    if(!state.wbDrawing) return;
                    const r=canvas.getBoundingClientRect();const x=e.clientX-r.left;const y=e.clientY-r.top;
                    if(state.wbTool==='pen'){ctx.beginPath();ctx.globalCompositeOperation='source-over';ctx.strokeStyle=state.wbColor;ctx.lineWidth=state.wbSize;ctx.lineCap='round';ctx.lineJoin='round';ctx.moveTo(state.wbLastX,state.wbLastY);ctx.lineTo(x,y);ctx.stroke();broadcastAll({type:'WB_STROKE',tool:'pen',color:state.wbColor,size:state.wbSize,x1:state.wbLastX,y1:state.wbLastY,x2:x,y2:y,cw:canvas.width,ch:canvas.height});}
                    else if(state.wbTool==='eraser'){ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.arc(x,y,state.wbSize*3,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation='source-over';broadcastAll({type:'WB_STROKE',tool:'eraser',size:state.wbSize*3,x2:x,y2:y,cw:canvas.width,ch:canvas.height});}
                    state.wbLastX=x;state.wbLastY=y;
                });
                canvas.addEventListener('pointerup',e=>{
                    if(!state.wbDrawing) return;state.wbDrawing=false;
                    const r=canvas.getBoundingClientRect();const x=e.clientX-r.left;const y=e.clientY-r.top;
                    if(state.wbTool==='rect'){ctx.beginPath();ctx.strokeStyle=state.wbColor;ctx.lineWidth=state.wbSize;ctx.strokeRect(sx,sy,x-sx,y-sy);broadcastAll({type:'WB_STROKE',tool:'rect',color:state.wbColor,size:state.wbSize,x1:sx,y1:sy,x2:x,y2:y,cw:canvas.width,ch:canvas.height});}
                    else if(state.wbTool==='circle'){ctx.beginPath();ctx.strokeStyle=state.wbColor;ctx.lineWidth=state.wbSize;const rx=Math.abs(x-sx)/2;const ry=Math.abs(y-sy)/2;const cx2=sx+(x-sx)/2;const cy2=sy+(y-sy)/2;ctx.ellipse(cx2,cy2,rx,ry,0,0,Math.PI*2);ctx.stroke();broadcastAll({type:'WB_STROKE',tool:'circle',color:state.wbColor,size:state.wbSize,x1:sx,y1:sy,x2:x,y2:y,cw:canvas.width,ch:canvas.height});}
                });
            }

            function addSticky(ctx,x,y){ctx.fillStyle='rgba(250,204,21,0.85)';ctx.fillRect(x,y,120,80);ctx.strokeStyle='rgba(250,204,21,0.4)';ctx.lineWidth=1;ctx.strokeRect(x,y,120,80);ctx.fillStyle='rgba(0,0,0,0.7)';ctx.font='10px Inter,sans-serif';ctx.fillText('Sticky Note',x+8,y+18);ctx.fillStyle='rgba(0,0,0,0.4)';ctx.font='8px Inter,sans-serif';ctx.fillText('Double-click to edit',x+8,y+34);}

            function receiveStroke(data){
                const canvas=document.getElementById('al-wb-remote-canvas'); if(!canvas) return;
                const ctx=canvas.getContext('2d');const sx=canvas.width/(data.cw||canvas.width);const sy=canvas.height/(data.ch||canvas.height);
                if(data.tool==='pen'){ctx.beginPath();ctx.strokeStyle=data.color||'#a78bfa';ctx.lineWidth=(data.size||4)*Math.min(sx,sy);ctx.lineCap='round';ctx.lineJoin='round';ctx.moveTo(data.x1*sx,data.y1*sy);ctx.lineTo(data.x2*sx,data.y2*sy);ctx.stroke();}
                else if(data.tool==='eraser'){ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.arc(data.x2*sx,data.y2*sy,data.size*Math.min(sx,sy),0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation='source-over';}
                else if(data.tool==='rect'){ctx.beginPath();ctx.strokeStyle=data.color||'#a78bfa';ctx.lineWidth=data.size||4;ctx.strokeRect(data.x1*sx,data.y1*sy,(data.x2-data.x1)*sx,(data.y2-data.y1)*sy);}
                else if(data.tool==='circle'){ctx.beginPath();ctx.strokeStyle=data.color||'#a78bfa';ctx.lineWidth=data.size||4;const rx=Math.abs(data.x2-data.x1)/2*sx;const ry=Math.abs(data.y2-data.y1)/2*sy;const cx=((data.x1+(data.x2-data.x1)/2))*sx;const cy=((data.y1+(data.y2-data.y1)/2))*sy;ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.stroke();}
                const dot=document.getElementById('al-wb-remote-dot');const lbl=document.getElementById('al-wb-remote-label');
                if(dot) dot.className='w-2 h-2 rounded-full bg-violet-400';if(lbl) lbl.textContent='1 collaborator';
            }
            function clearRemoteCanvas(){const c=document.getElementById('al-wb-remote-canvas');if(c) c.getContext('2d').clearRect(0,0,c.width,c.height);}

            // ── File Transfer ──
            const fileRecvState={};

            function showFileOffer(fromId,data){
                Notifications.push('AETHER LINK',`${state.peers[fromId]?.name||fromId} wants to send: ${data.fileName} (${data.fileSize})`);
                addActivity(state.peers[fromId]?.name||fromId,`sent a file: ${data.fileName}`);
                const list=document.getElementById('al-transfer-list'); if(!list) return;
                const ph=list.querySelector('.text-[9px]'); if(ph) ph.remove();
                const item=document.createElement('div'); item.className='al-transfer-item';
                item.dataset.transferId=data.transferId;
                item.innerHTML=`<i data-lucide="file" class="w-4 h-4 text-violet-400/60 shrink-0"></i><div class="flex-1 min-w-0"><div class="text-[9px] text-white/60 truncate">${data.fileName}</div><div class="text-[7px] text-white/30">${state.peers[fromId]?.name||fromId} · ${data.fileSize}</div><div class="ab-transfer-bar mt-1"><div id="ft-bar-${data.transferId}" class="ab-transfer-fill" style="width:0%"></div></div></div><span id="ft-pct-${data.transferId}" class="text-[7px] text-white/30 shrink-0">0%</span>`;
                list.prepend(item);
                if(window.lucide) lucide.createIcons({nodes:[item]});
                fileRecvState[data.transferId]={name:data.fileName,size:data.size,chunks:[],received:0};
            }

            function receiveFileMeta(fromId, data){
                fileRecvState[data.transferId]={name:data.name,size:data.size,chunks:[],received:0};
                showFileOffer(fromId, {fileName:data.name, fileSize:formatFileSize(data.size), transferId:data.transferId, size:data.size});
            }

            function receiveFileChunk(fromId, data){
                const fs=fileRecvState[data.transferId]; if(!fs) return;
                fs.chunks.push(data.chunk); fs.received+=data.size;
                const pct=Math.round((fs.received/fs.size)*100);
                const bar=document.getElementById('ft-bar-'+data.transferId); if(bar) bar.style.width=pct+'%';
                const pctEl=document.getElementById('ft-pct-'+data.transferId); if(pctEl) pctEl.textContent=pct+'%';
            }

            function finalizeFileTransfer(fromId, data){
                const fs=fileRecvState[data.transferId]; if(!fs) return;
                try {
                    const combined=fs.chunks.join('');
                    const binary=atob(combined);const bytes=new Uint8Array(binary.length);
                    for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
                    const blob=new Blob([bytes]);const url=URL.createObjectURL(blob);
                    const a=document.createElement('a');a.href=url;a.download=fs.name;a.click();
                    setTimeout(()=>URL.revokeObjectURL(url),5000);
                    const bar=document.getElementById('ft-bar-'+data.transferId);if(bar){bar.style.width='100%';bar.style.background='linear-gradient(90deg,#10b981,#34d399)';}
                    const pctEl=document.getElementById('ft-pct-'+data.transferId);if(pctEl) pctEl.textContent='✓';
                    Notifications.push('AETHER LINK',`${fs.name} received`);
                } catch(e){ Notifications.push('AETHER LINK','File receive error: '+e.message); }
                delete fileRecvState[data.transferId];
            }

            function formatFileSize(b){if(!b) return '0 B';const u=['B','KB','MB','GB'];let i=0;while(b>=1024&&i<u.length-1){b/=1024;i++;}return `${b.toFixed(1)} ${u[i]}`;}

            async function sendFileViaPeer(peerId, file){
                const CHUNK=16384;
                const transferId='alt_'+Date.now();
                const sizeStr=formatFileSize(file.size);
                sendToPeer(peerId,{type:'FILE_META',name:file.name,size:file.size,transferId});
                const list=document.getElementById('al-transfer-list');
                if(list){const ph=list.querySelector('.text-[9px]');if(ph) ph.remove();const item=document.createElement('div');item.className='al-transfer-item';item.innerHTML=`<i data-lucide="upload-cloud" class="w-4 h-4 text-emerald-400/60 shrink-0"></i><div class="flex-1 min-w-0"><div class="text-[9px] text-white/60 truncate">${file.name}</div><div class="text-[7px] text-white/30">Sending · ${sizeStr}</div><div class="ab-transfer-bar mt-1"><div id="fts-bar-${transferId}" class="ab-transfer-fill" style="width:0%"></div></div></div><span id="fts-pct-${transferId}" class="text-[7px] text-white/30">0%</span>`;list.prepend(item);if(window.lucide) lucide.createIcons({nodes:[item]});}
                let offset=0;
                const reader=new FileReader();
                const readNext=()=>{const slice=file.slice(offset,offset+CHUNK);reader.readAsArrayBuffer(slice);};
                reader.onload=e=>{
                    const buf=e.target.result;const bytes2=new Uint8Array(buf);
                    let bin='';bytes2.forEach(b=>bin+=String.fromCharCode(b));
                    const b64=btoa(bin);
                    sendToPeer(peerId,{type:'FILE_CHUNK',transferId,chunk:b64,size:buf.byteLength});
                    offset+=buf.byteLength;
                    const pct=Math.round((offset/file.size)*100);
                    const bar2=document.getElementById('fts-bar-'+transferId);if(bar2) bar2.style.width=pct+'%';
                    const pctEl2=document.getElementById('fts-pct-'+transferId);if(pctEl2) pctEl2.textContent=pct+'%';
                    if(offset<file.size){readNext();}
                    else{sendToPeer(peerId,{type:'FILE_DONE',transferId,name:file.name});if(pctEl2) pctEl2.textContent='✓';Notifications.push('AETHER LINK',`${file.name} sent`);}
                };
                readNext();
            }

            // ── Mini Apps ──
            function renderTodos(){
                const list=document.getElementById('al-todo-list'); if(!list) return;
                if(!todoItems.length){list.innerHTML='<div style="font:400 9px Inter;color:rgba(255,255,255,0.2);text-align:center;padding:20px 0">No tasks yet</div>';return;}
                list.innerHTML=todoItems.map(t=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04)"><input type="checkbox" ${t.done?'checked':''} onchange="window.AetherLinkAPI.toggleTodo(${t.id})" style="accent-color:#8b5cf6;cursor:none"><span style="font:400 9px Inter;color:${t.done?'rgba(255,255,255,0.25)':'rgba(255,255,255,0.7)'};text-decoration:${t.done?'line-through':'none'};flex:1">${t.text}</span><button onclick="window.AetherLinkAPI.removeTodo(${t.id})" style="color:rgba(255,255,255,0.2);background:none;border:none;cursor:none">✕</button></div>`).join('');
            }

            // ════════════════════════════════════════════════════════
            // REAL COOP CHESS — move-validated, turn-enforced, synced
            // ════════════════════════════════════════════════════════
            const CHESS_PIECES = {'r':'♜','n':'♞','b':'♝','q':'♛','k':'♚','p':'♟','R':'♖','N':'♘','B':'♗','Q':'♕','K':'♔','P':'♙'};

            function freshChessBoard(){
                return [
                    ['r','n','b','q','k','b','n','r'],
                    ['p','p','p','p','p','p','p','p'],
                    ['','','','','','','',''],
                    ['','','','','','','',''],
                    ['','','','','','','',''],
                    ['','','','','','','',''],
                    ['P','P','P','P','P','P','P','P'],
                    ['R','N','B','Q','K','B','N','R']
                ];
            }

            function pieceColor(p){ if(!p) return null; return p===p.toUpperCase() ? 'w' : 'b'; }

            // Simplified-but-real legal move generator (no check/checkmate detection,
            // but enforces real per-piece movement rules + turn order + capture rules,
            // which is what makes a casual coop chess board actually playable).
            function getLegalMoves(board, r, c){
                const p = board[r][c]; if(!p) return [];
                const color = pieceColor(p);
                const type = p.toLowerCase();
                const moves = [];
                const inBounds = (rr,cc) => rr>=0&&rr<8&&cc>=0&&cc<8;
                const enemy = (rr,cc) => board[rr][cc] && pieceColor(board[rr][cc]) !== color;
                const empty = (rr,cc) => !board[rr][cc];

                const slide = (dirs) => {
                    dirs.forEach(([dr,dc])=>{
                        let rr=r+dr, cc=c+dc;
                        while(inBounds(rr,cc)){
                            if(empty(rr,cc)) { moves.push([rr,cc]); }
                            else { if(enemy(rr,cc)) moves.push([rr,cc]); break; }
                            rr+=dr; cc+=dc;
                        }
                    });
                };

                if(type==='p'){
                    const dir = color==='w' ? -1 : 1;
                    const startRow = color==='w' ? 6 : 1;
                    if(inBounds(r+dir,c) && empty(r+dir,c)) {
                        moves.push([r+dir,c]);
                        if(r===startRow && empty(r+2*dir,c)) moves.push([r+2*dir,c]);
                    }
                    [[dir,-1],[dir,1]].forEach(([dr,dc])=>{
                        const rr=r+dr, cc=c+dc;
                        if(inBounds(rr,cc) && enemy(rr,cc)) moves.push([rr,cc]);
                    });
                } else if(type==='n'){
                    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc])=>{
                        const rr=r+dr, cc=c+dc;
                        if(inBounds(rr,cc) && (empty(rr,cc)||enemy(rr,cc))) moves.push([rr,cc]);
                    });
                } else if(type==='b'){
                    slide([[-1,-1],[-1,1],[1,-1],[1,1]]);
                } else if(type==='r'){
                    slide([[-1,0],[1,0],[0,-1],[0,1]]);
                } else if(type==='q'){
                    slide([[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]);
                } else if(type==='k'){
                    [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc])=>{
                        const rr=r+dr, cc=c+dc;
                        if(inBounds(rr,cc) && (empty(rr,cc)||enemy(rr,cc))) moves.push([rr,cc]);
                    });
                }
                return moves;
            }

            function initChessGame(){
                if(!chessState.board) {
                    chessState.board = freshChessBoard();
                    chessState.turn = 'w';
                    chessState.moveLog = [];
                    // Assign color: whoever has fewer peer IDs alphabetically "hosts" white — simplest deterministic rule
                    const peerIds = Object.keys(state.peers);
                    if(peerIds.length === 0) {
                        chessState.myColor = 'w'; // solo/testing
                    } else {
                        const allIds = [...peerIds, state.myCode||'me'].sort();
                        chessState.myColor = allIds[0] === (state.myCode||'me') ? 'w' : 'b';
                    }
                }
                // Ask peers for current state in case a game is already in progress
                broadcastAll({type:'CHESS_SYNC_REQUEST'});
            }

            function renderChessBoard(){
                const container = document.getElementById('al-chess-board');
                if(!container || !chessState.board) return;
                const flip = chessState.myColor === 'b';
                let html = '';
                for(let rr=0; rr<8; rr++){
                    const r = flip ? 7-rr : rr;
                    for(let cc=0; cc<8; cc++){
                        const c = flip ? 7-cc : cc;
                        const piece = chessState.board[r][c];
                        const light = (r+c)%2===0;
                        const isSelected = chessState.selected && chessState.selected[0]===r && chessState.selected[1]===c;
                        let highlightMoves = [];
                        if(chessState.selected) highlightMoves = getLegalMoves(chessState.board, chessState.selected[0], chessState.selected[1]);
                        const isLegalTarget = highlightMoves.some(([mr,mc])=>mr===r&&mc===c);
                        let bg = light ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.45)';
                        if(isSelected) bg = 'rgba(139,92,246,0.45)';
                        else if(isLegalTarget) bg = 'rgba(52,211,153,0.28)';
                        html += `<div onclick="window.AetherLinkAPI.chessSquareClick(${r},${c})" style="width:32px;height:32px;background:${bg};display:flex;align-items:center;justify-content:center;font-size:19px;cursor:none;transition:background 0.1s;user-select:none">${piece?CHESS_PIECES[piece]||piece:''}</div>`;
                    }
                }
                container.innerHTML = html;

                const turnEl = document.getElementById('al-chess-turn');
                if(turnEl) {
                    const isMyTurn = chessState.turn === chessState.myColor;
                    turnEl.textContent = isMyTurn ? 'Your move' : `Waiting for opponent (${chessState.turn==='w'?'White':'Black'})`;
                    turnEl.style.color = isMyTurn ? 'rgba(167,139,250,1)' : 'rgba(255,255,255,0.3)';
                }
                const colorEl = document.getElementById('al-chess-color');
                if(colorEl) colorEl.textContent = `Playing as: ${chessState.myColor==='w'?'White':'Black'}`;
            }

            function chessSquareClick(r, c){
                if(!chessState.board) return;
                const isMyTurn = chessState.turn === chessState.myColor;
                if(!isMyTurn) { Notifications.push('AETHER LINK', "It's not your turn"); return; }

                const piece = chessState.board[r][c];

                if(chessState.selected) {
                    const [sr, sc] = chessState.selected;
                    const legal = getLegalMoves(chessState.board, sr, sc);
                    const isLegal = legal.some(([mr,mc])=>mr===r&&mc===c);
                    if(isLegal) {
                        const movedPiece = chessState.board[sr][sc];
                        const capturedPiece = chessState.board[r][c];
                        chessState.board[r][c] = movedPiece;
                        chessState.board[sr][sc] = '';
                        chessState.turn = chessState.turn === 'w' ? 'b' : 'w';
                        chessState.moveLog.push({from:[sr,sc], to:[r,c], piece:movedPiece, captured:capturedPiece});
                        chessState.selected = null;
                        renderChessBoard();
                        broadcastAll({type:'CHESS_MOVE', from:[sr,sc], to:[r,c], board: chessState.board, turn: chessState.turn});
                        addActivity('You', `moved ${CHESS_PIECES[movedPiece]||movedPiece} ${String.fromCharCode(97+sc)}${8-sr} → ${String.fromCharCode(97+c)}${8-r}`);
                        return;
                    }
                    // Re-select if clicking own piece, else deselect
                    chessState.selected = (piece && pieceColor(piece)===chessState.myColor) ? [r,c] : null;
                    renderChessBoard();
                    return;
                }

                if(piece && pieceColor(piece) === chessState.myColor) {
                    chessState.selected = [r,c];
                    renderChessBoard();
                }
            }

            function applyRemoteChessMove(data){
                if(!chessState.board) chessState.board = freshChessBoard();
                chessState.board = data.board;
                chessState.turn = data.turn;
                chessState.selected = null;
                renderChessBoard();
                const [fr,fc] = data.from, [tr,tc] = data.to;
                addActivity('Opponent', `moved ${String.fromCharCode(97+fc)}${8-fr} → ${String.fromCharCode(97+tc)}${8-tr}`);
            }

            function resetChessBoard(broadcast=true){
                chessState.board = freshChessBoard();
                chessState.turn = 'w';
                chessState.selected = null;
                chessState.moveLog = [];
                renderChessBoard();
                if(broadcast) broadcastAll({type:'CHESS_RESET'});
            }

            // ════════════════════════════════════════════════════════
            // REAL COOP PIXEL ART — synced 16×16 grid, real broadcast
            // ════════════════════════════════════════════════════════
            function renderPixelGridFromState(){
                const cells = document.querySelectorAll('.al-pixel-cell');
                cells.forEach((cell,i)=>{
                    cell.style.background = pixelState.grid[i] || 'transparent';
                });
            }

            function paintPixelCell(index, el){
                const colorInput = document.getElementById('al-pixel-color');
                const color = colorInput?.value || '#a78bfa';
                pixelState.grid[index] = color;
                if(el) el.style.background = color;
                broadcastAll({type:'PIXEL_PAINT', index, color});
            }

            function applyRemotePixel(index, color){
                pixelState.grid[index] = color;
                const cell = document.querySelector(`.al-pixel-cell[data-idx="${index}"]`);
                if(cell) cell.style.background = color;
            }

            function resetPixelGrid(broadcast=true){
                pixelState.grid = new Array(256).fill('');
                renderPixelGridFromState();
                if(broadcast) broadcastAll({type:'PIXEL_CLEAR'});
            }

            const MINI_APPS={
                chess:()=>{
                    initChessGame();
                    setTimeout(renderChessBoard, 30);
                    return `<div style="padding:12px">
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                            <div style="font:700 10px Inter;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.1em">Chess — Real Coop</div>
                            <button onclick="window.AetherLinkAPI.chessReset()" style="font:600 8px Inter;color:rgba(255,255,255,0.3);background:none;border:1px solid rgba(255,255,255,0.1);border-radius:5px;padding:3px 8px;cursor:none">Reset</button>
                        </div>
                        <div id="al-chess-board" style="display:grid;grid-template-columns:repeat(8,32px);border:1px solid rgba(255,255,255,0.1);border-radius:6px;overflow:hidden;width:fit-content"></div>
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">
                            <span id="al-chess-turn" style="font:700 9px Inter">Loading…</span>
                            <span id="al-chess-color" style="font:400 8px JetBrains Mono;color:rgba(255,255,255,0.3)"></span>
                        </div>
                        <div style="font:400 8px Inter;color:rgba(255,255,255,0.2);margin-top:6px">Real moves sync to all connected peers · Turn-based</div>
                    </div>`;
                },
                pixelart:()=>{
                    setTimeout(renderPixelGridFromState, 30);
                    broadcastAll({type:'PIXEL_SYNC_REQUEST'});
                    let h='<div style="padding:12px"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div style="font:700 10px Inter;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.1em">Pixel Art — Real Coop</div><button onclick="window.AetherLinkAPI.pixelReset()" style="font:600 8px Inter;color:rgba(255,255,255,0.3);background:none;border:1px solid rgba(255,255,255,0.1);border-radius:5px;padding:3px 8px;cursor:none">Clear</button></div><div style="display:grid;grid-template-columns:repeat(16,18px);border:1px solid rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;width:fit-content">';
                    for(let i=0;i<256;i++) h+=`<div class="al-pixel-cell" data-idx="${i}" style="width:18px;height:18px;border:0.5px solid rgba(255,255,255,0.04);cursor:none;background:${window.escapeAetherHtml(pixelState.grid[i]||'transparent')}" onmousedown="window.AetherLinkAPI.pixelPaint(${i},this)" onmouseenter="if(event.buttons===1)window.AetherLinkAPI.pixelPaint(${i},this)"></div>`;
                    h+='</div><div style="margin-top:8px;display:flex;align-items:center;gap:6px"><input type="color" id="al-pixel-color" value="#a78bfa" style="width:24px;height:24px;border:none;cursor:none"><span style="font:400 8px JetBrains Mono;color:rgba(255,255,255,0.3)">Paint syncs live to all peers</span></div></div>';
                    return h;
                },
                notes:()=>{
                    broadcastAll({type:'SHARED_NOTES_REQUEST'});
                    return `<div style="padding:12px;height:100%;box-sizing:border-box;display:flex;flex-direction:column"><div style="font:700 10px Inter;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">Shared Notes — Live Sync</div><textarea id="al-shared-notes" style="flex:1;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px;color:rgba(255,255,255,0.75);font:400 11px Inter;resize:none;outline:none" placeholder="Start typing — syncs to all connected peers via DataChannel…" oninput="window.AetherLinkAPI.syncNotes(this.value)">${window.escapeAetherHtml(sharedNotesState.text||'')}</textarea><div style="font:400 8px Inter;color:rgba(255,255,255,0.2);margin-top:6px">Real-time via PeerJS DataChannels</div></div>`;
                },
                todo:()=>{
                    broadcastAll({type:'TODO_SYNC_REQUEST'});
                    return `<div style="padding:12px;height:100%;box-sizing:border-box;display:flex;flex-direction:column"><div style="font:700 10px Inter;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">Shared To-Do — Live Sync</div><div style="display:flex;gap:6px;margin-bottom:8px"><input id="al-todo-input" type="text" placeholder="Add a task…" style="flex:1;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:6px 10px;color:rgba(255,255,255,0.8);font:400 10px Inter;outline:none" onkeydown="if(event.key==='Enter')window.AetherLinkAPI.addTodo()"><button onclick="window.AetherLinkAPI.addTodo()" style="padding:6px 12px;background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.35);border-radius:6px;color:rgba(167,139,250,1);font:700 9px Inter;cursor:none">Add</button></div><div id="al-todo-list" style="flex:1;overflow-y:auto"></div></div>`;
                },
            };

            const sharedNotesState = { text: '' };

            // ════════════════════════════════════════════════════════
            // REAL SCREEN SHARING — getDisplayMedia + RTCPeerConnection
            // Signaling travels over the existing PeerJS DataChannel (or
            // BroadcastChannel for same-browser testing).
            // ════════════════════════════════════════════════════════
            const ICE_SERVERS = [
                {urls:'stun:stun.l.google.com:19302'},
                {urls:'stun:stun1.l.google.com:19302'},
                {urls:'stun:global.stun.twilio.com:3478'}
            ];

            function showSSIdle(){
                const idle=document.getElementById('al-ss-idle'); const active=document.getElementById('al-ss-active');
                if(idle) idle.classList.remove('hidden'); if(active) active.classList.add('hidden');
            }
            function showSSActive(label){
                const idle=document.getElementById('al-ss-idle'); const active=document.getElementById('al-ss-active');
                if(idle) idle.classList.add('hidden'); if(active) active.classList.remove('hidden');
                const lbl=document.getElementById('al-ss-status-label'); if(lbl) lbl.textContent=label;
            }

            async function startScreenShareReal(){
                const sel=document.getElementById('al-ss-peer-select');
                const peerId=sel?.value;
                if(!peerId){ Notifications.push('AETHER LINK','Select a peer to share your screen with'); return; }
                if(screenShareState.active){ Notifications.push('AETHER LINK','A screen share session is already active'); return; }

                let stream;
                try {
                    stream = await navigator.mediaDevices.getDisplayMedia({ video:{ frameRate:{ ideal:15, max:30 } }, audio:false });
                } catch(e) {
                    Notifications.push('AETHER LINK', 'Screen share cancelled or denied');
                    return;
                }

                screenShareState.localStream = stream;
                screenShareState.isSharing = true;
                screenShareState.active = true;
                screenShareState.remotePeerId = peerId;

                const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
                screenShareState.pc = pc;
                stream.getTracks().forEach(track => pc.addTrack(track, stream));

                pc.onicecandidate = e => {
                    if(e.candidate) sendToPeer(peerId, {type:'SCREEN_SHARE_ICE', candidate: e.candidate});
                };

                // If the user stops sharing via the browser's native "Stop sharing" control
                stream.getVideoTracks()[0].onended = () => stopScreenShareReal();

                pc.onconnectionstatechange = () => {
                    if(['failed','disconnected','closed'].includes(pc.connectionState)) {
                        if(screenShareState.active) stopScreenShareReal();
                    }
                };

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                sendToPeer(peerId, {type:'SCREEN_SHARE_OFFER', sdp: offer});

                showSSActive('Requesting to share your screen…');
                const video = document.getElementById('al-ss-video');
                if(video) video.srcObject = stream;

                Notifications.push('AETHER LINK', `Screen share offer sent to ${state.peers[peerId]?.name||peerId}`);
                addActivity('You', 'started sharing their screen');
            }

            function showScreenShareIncoming(fromId, data){
                screenShareState.pendingOffer = { fromId, sdp: data.sdp };
                const modal=document.getElementById('al-ss-incoming-modal');
                const msg=document.getElementById('al-ss-incoming-msg');
                if(msg) msg.textContent = `${state.peers[fromId]?.name||fromId} wants to share their screen with you`;
                if(modal) modal.style.display='flex';
                Notifications.push('AETHER LINK', `${state.peers[fromId]?.name||fromId} wants to share their screen`);
            }

            async function acceptScreenShareReal(){
                const pending = screenShareState.pendingOffer;
                document.getElementById('al-ss-incoming-modal').style.display='none';
                if(!pending) return;

                const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
                screenShareState.pc = pc;
                screenShareState.isViewing = true;
                screenShareState.active = true;
                screenShareState.remotePeerId = pending.fromId;

                pc.ontrack = e => {
                    const video = document.getElementById('al-ss-video');
                    if(video) video.srcObject = e.streams[0];
                    // Switch to screen share tab to show the incoming stream
                    if(window.AetherLinkAPI) window.AetherLinkAPI.switchTab('screenshare');
                    showSSActive(`Viewing ${state.peers[pending.fromId]?.name||pending.fromId}'s screen`);
                };

                pc.onicecandidate = e => {
                    if(e.candidate) sendToPeer(pending.fromId, {type:'SCREEN_SHARE_ICE', candidate: e.candidate});
                };
                pc.onconnectionstatechange = () => {
                    if(['failed','disconnected','closed'].includes(pc.connectionState)) {
                        if(screenShareState.active) stopScreenShareReal();
                    }
                };

                await pc.setRemoteDescription(new RTCSessionDescription(pending.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                sendToPeer(pending.fromId, {type:'SCREEN_SHARE_ANSWER', sdp: answer});

                // Flush any queued ICE candidates
                screenShareState.pendingICE.forEach(c => pc.addIceCandidate(new RTCIceCandidate(c)).catch(()=>{}));
                screenShareState.pendingICE = [];

                addActivity(state.peers[pending.fromId]?.name||pending.fromId, 'is sharing their screen with you');
                screenShareState.pendingOffer = null;
            }

            function declineScreenShareReal(){
                const pending = screenShareState.pendingOffer;
                document.getElementById('al-ss-incoming-modal').style.display='none';
                if(pending) sendToPeer(pending.fromId, {type:'SCREEN_SHARE_STOP'});
                screenShareState.pendingOffer = null;
            }

            async function handleScreenShareAnswer(fromId, data){
                if(!screenShareState.pc) return;
                try {
                    await screenShareState.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                    showSSActive(`Sharing your screen with ${state.peers[fromId]?.name||fromId}`);
                    Notifications.push('AETHER LINK', `${state.peers[fromId]?.name||fromId} accepted your screen share`);
                } catch(e) {}
            }

            function handleScreenShareICE(fromId, data){
                if(screenShareState.pc && screenShareState.pc.remoteDescription) {
                    screenShareState.pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(()=>{});
                } else {
                    screenShareState.pendingICE.push(data.candidate);
                }
            }

            function handleScreenShareStop(fromId){
                if(screenShareState.remotePeerId === fromId || !screenShareState.remotePeerId) {
                    stopScreenShareReal(false);
                    Notifications.push('AETHER LINK', `${state.peers[fromId]?.name||fromId} ended the screen share`);
                }
            }

            function stopScreenShareReal(notifyPeer=true){
                if(notifyPeer && screenShareState.remotePeerId) {
                    sendToPeer(screenShareState.remotePeerId, {type:'SCREEN_SHARE_STOP'});
                }
                if(screenShareState.localStream) {
                    screenShareState.localStream.getTracks().forEach(t => t.stop());
                    screenShareState.localStream = null;
                }
                if(screenShareState.pc) {
                    try { screenShareState.pc.close(); } catch(e) {}
                    screenShareState.pc = null;
                }
                const video = document.getElementById('al-ss-video');
                if(video) video.srcObject = null;
                screenShareState.active = false;
                screenShareState.isSharing = false;
                screenShareState.isViewing = false;
                screenShareState.remotePeerId = null;
                screenShareState.pendingICE = [];
                showSSIdle();
                addActivity('You', 'ended the screen share');
            }

            // ════════════════════════════════════════════════════════
            // REAL VOICE CHAT / WALKIE-TALKIE — getUserMedia + WebRTC audio
            // Two modes:
            //  - 'open'   : continuous duplex mic, mesh of RTCPeerConnections to every connected peer
            //  - 'walkie' : push-to-talk — mic track only enabled while PTT button is held
            // Signaling travels over the existing PeerJS DataChannel (or BroadcastChannel fallback).
            // ════════════════════════════════════════════════════════

            function updateVoiceIndicator(){
                const ind = document.getElementById('al-voice-indicator');
                const lbl = document.getElementById('al-voice-indicator-label');
                if(!ind) return;
                if(voiceState.active) {
                    ind.classList.remove('hidden'); ind.classList.add('flex');
                    if(lbl) lbl.textContent = voiceState.mode === 'walkie' ? 'WALKIE LIVE' : 'VOICE LIVE';
                } else {
                    ind.classList.add('hidden'); ind.classList.remove('flex');
                }
            }

            function renderVoiceParticipants(){
                const el = document.getElementById('al-voice-participants');
                if(!el) return;
                const ids = Object.keys(voiceState.connections);
                if(!ids.length) { el.innerHTML = '<div class="text-[9px] text-white/20 text-center py-2">Just you — waiting for peers to join…</div>'; return; }
                el.innerHTML = ids.map(id => {
                    const name = state.peers[id]?.name || id;
                    const conn = voiceState.connections[id];
                    const speaking = conn?.speaking;
                    return `<div class="flex items-center gap-2 px-2 py-1.5 rounded-lg" style="background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,${speaking?'0.4':'0.12'})">
                        <div class="w-2 h-2 rounded-full ${speaking ? 'bg-emerald-400' : 'bg-white/20'}" style="${speaking?'animation:indicatorPulse 0.6s infinite':''}"></div>
                        <span class="text-[9px] text-white/60 flex-1">${name}</span>
                        <i data-lucide="${conn?.connected ? 'mic' : 'loader'}" class="w-3 h-3 text-white/25"></i>
                    </div>`;
                }).join('');
                if(window.lucide) lucide.createIcons({nodes:[el]});
            }

            function showVoiceIdle(){
                const idle=document.getElementById('al-voice-idle'); const active=document.getElementById('al-voice-active');
                if(idle) idle.classList.remove('hidden'); if(active) active.classList.add('hidden');
                document.querySelectorAll('.al-voice-mode-btn').forEach(b=>{ b.style.background=''; b.style.borderColor=''; b.classList.remove('text-violet-300'); b.classList.add('text-white/50'); });
            }

            function showVoiceActive(){
                const idle=document.getElementById('al-voice-idle'); const active=document.getElementById('al-voice-active');
                if(idle) idle.classList.add('hidden'); if(active) active.classList.remove('hidden');
                const openCtl=document.getElementById('al-voice-open-controls'); const pttCtl=document.getElementById('al-voice-ptt-controls');
                if(voiceState.mode==='walkie') { if(openCtl) openCtl.classList.add('hidden'); if(pttCtl) { pttCtl.classList.remove('hidden'); pttCtl.classList.add('flex'); } }
                else { if(pttCtl) { pttCtl.classList.add('hidden'); pttCtl.classList.remove('flex'); } if(openCtl) { openCtl.classList.remove('hidden'); openCtl.classList.add('flex'); } }
                const lbl=document.getElementById('al-voice-status-label');
                if(lbl) lbl.textContent = voiceState.mode==='walkie' ? 'Walkie-talkie active — hold button to talk' : 'Open mic — live duplex audio';
            }

            // Get (or lazily create) the local mic stream
            async function ensureLocalMicStream(startMuted){
                if(voiceState.localStream) return voiceState.localStream;
                const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation:true, noiseSuppression:true, autoGainControl:true } });
                if(startMuted) stream.getAudioTracks().forEach(t => t.enabled = false);
                voiceState.localStream = stream;
                return stream;
            }

            // Set up a peer connection (audio only) to one specific peer for voice
            function setupVoicePC(peerId, isInitiator){
                const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
                voiceState.connections[peerId] = voiceState.connections[peerId] || {};
                voiceState.connections[peerId].pc = pc;
                voiceState.connections[peerId].connected = false;
                voiceState.connections[peerId].speaking = false;

                if(voiceState.localStream) {
                    voiceState.localStream.getTracks().forEach(track => pc.addTrack(track, voiceState.localStream));
                }

                pc.onicecandidate = e => {
                    if(e.candidate) sendToPeer(peerId, {type:'VOICE_ICE', candidate: e.candidate});
                };

                pc.ontrack = e => {
                    let audioEl = document.getElementById('voice-audio-'+peerId);
                    if(!audioEl) {
                        audioEl = document.createElement('audio');
                        audioEl.id = 'voice-audio-'+peerId;
                        audioEl.autoplay = true;
                        audioEl.style.display = 'none';
                        document.body.appendChild(audioEl);
                    }
                    audioEl.srcObject = e.streams[0];
                    audioEl.muted = voiceState.mutedOutput;
                    voiceState.connections[peerId].remoteAudioEl = audioEl;
                    voiceState.connections[peerId].connected = true;
                    renderVoiceParticipants();

                    // Simple speaking-detection via AnalyserNode for the live "speaking" dot
                    try {
                        const audioCtx = new (window.AudioContext||window.webkitAudioContext)();
                        const src = audioCtx.createMediaStreamSource(e.streams[0]);
                        const analyser = audioCtx.createAnalyser();
                        analyser.fftSize = 512;
                        src.connect(analyser);
                        const data = new Uint8Array(analyser.frequencyBinCount);
                        const tick = () => {
                            if(!voiceState.connections[peerId]) { try{audioCtx.close();}catch(err){} return; }
                            analyser.getByteFrequencyData(data);
                            const avg = data.reduce((a,b)=>a+b,0)/data.length;
                            const speaking = avg > 12;
                            if(voiceState.connections[peerId].speaking !== speaking) {
                                voiceState.connections[peerId].speaking = speaking;
                                renderVoiceParticipants();
                            }
                            requestAnimationFrame(tick);
                        };
                        tick();
                    } catch(e) {}
                };

                pc.onconnectionstatechange = () => {
                    if(['failed','disconnected','closed'].includes(pc.connectionState)) {
                        teardownVoicePeer(peerId, false);
                    }
                };

                return pc;
            }

            async function joinVoiceWithPeer(peerId, isInitiator){
                const pc = setupVoicePC(peerId, isInitiator);
                if(isInitiator) {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    sendToPeer(peerId, {type:'VOICE_OFFER', sdp: offer, mode: voiceState.mode});
                }
            }

            async function startVoiceSession(mode){
                if(voiceState.active && voiceState.mode === mode) return;
                if(voiceState.active) stopVoiceSession(false); // switch mode cleanly

                const peerIds = Object.keys(state.peers);
                if(!peerIds.length) {
                    Notifications.push('AETHER LINK', 'Connect to a peer first to start voice chat');
                    return;
                }

                voiceState.mode = mode;
                try {
                    await ensureLocalMicStream(mode === 'walkie'); // walkie starts muted (PTT controls it)
                } catch(e) {
                    Notifications.push('AETHER LINK', 'Microphone access denied or unavailable');
                    voiceState.mode = null;
                    return;
                }

                voiceState.active = true;
                document.querySelectorAll('.al-voice-mode-btn').forEach(b=>{
                    const isThis = b.id === 'al-voice-mode-'+mode;
                    b.style.background = isThis ? 'rgba(139,92,246,0.2)' : '';
                    b.style.borderColor = isThis ? 'rgba(139,92,246,0.4)' : '';
                    b.classList.toggle('text-violet-300', isThis);
                    b.classList.toggle('text-white/50', !isThis);
                });

                // Connect to all current peers — invite them, then they answer
                peerIds.forEach(id => {
                    sendToPeer(id, {type:'VOICE_INVITE', mode});
                    joinVoiceWithPeer(id, true);
                });

                showVoiceActive();
                renderVoiceParticipants();
                updateVoiceIndicator();
                addActivity('You', `started ${mode==='walkie'?'walkie-talkie':'open mic'} voice chat`);
                Notifications.push('AETHER LINK', `Voice chat started (${mode==='walkie'?'Walkie-Talkie':'Open Mic'})`);
            }

            function teardownVoicePeer(peerId, notify=true){
                const conn = voiceState.connections[peerId];
                if(conn) {
                    if(conn.pc) try { conn.pc.close(); } catch(e) {}
                    if(conn.remoteAudioEl) { conn.remoteAudioEl.srcObject=null; conn.remoteAudioEl.remove(); }
                    delete voiceState.connections[peerId];
                }
                if(notify) sendToPeer(peerId, {type:'VOICE_LEAVE'});
                renderVoiceParticipants();
            }

            function stopVoiceSession(notifyPeers=true){
                Object.keys(voiceState.connections).forEach(id => teardownVoicePeer(id, notifyPeers));
                if(voiceState.localStream) {
                    voiceState.localStream.getTracks().forEach(t => t.stop());
                    voiceState.localStream = null;
                }
                voiceState.active = false;
                voiceState.mode = null;
                voiceState.pttHeld = false;
                showVoiceIdle();
                updateVoiceIndicator();
                addActivity('You', 'left voice chat');
            }

            function handleVoiceInvite(fromId, data){
                // Auto-join: if we're not already in a voice session, mirror their mode and join.
                // If we ARE in a session, just answer the connection (mesh).
                if(!voiceState.active) {
                    voiceState.mode = data.mode;
                    ensureLocalMicStream(data.mode === 'walkie').then(()=>{
                        voiceState.active = true;
                        showVoiceActive();
                        updateVoiceIndicator();
                        document.querySelectorAll('.al-voice-mode-btn').forEach(b=>{
                            const isThis = b.id === 'al-voice-mode-'+data.mode;
                            b.style.background = isThis ? 'rgba(139,92,246,0.2)' : '';
                            b.style.borderColor = isThis ? 'rgba(139,92,246,0.4)' : '';
                        });
                        Notifications.push('AETHER LINK', `${state.peers[fromId]?.name||fromId} started voice chat — you joined automatically`);
                        addActivity(state.peers[fromId]?.name||fromId, 'started a voice session');
                    }).catch(()=>{
                        Notifications.push('AETHER LINK', 'Microphone access denied — cannot join voice chat');
                    });
                }
            }

            async function handleVoiceOffer(fromId, data){
                if(!voiceState.localStream) {
                    try { await ensureLocalMicStream(data.mode === 'walkie'); } catch(e) { return; }
                }
                if(!voiceState.active) { voiceState.active = true; voiceState.mode = data.mode; showVoiceActive(); updateVoiceIndicator(); }

                const pc = setupVoicePC(fromId, false);
                await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                sendToPeer(fromId, {type:'VOICE_ANSWER', sdp: answer});

                // Flush queued ICE
                (voiceState.pendingICE[fromId]||[]).forEach(c => pc.addIceCandidate(new RTCIceCandidate(c)).catch(()=>{}));
                voiceState.pendingICE[fromId] = [];
                renderVoiceParticipants();
            }

            async function handleVoiceAnswer(fromId, data){
                const conn = voiceState.connections[fromId];
                if(!conn || !conn.pc) return;
                try {
                    await conn.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                    (voiceState.pendingICE[fromId]||[]).forEach(c => conn.pc.addIceCandidate(new RTCIceCandidate(c)).catch(()=>{}));
                    voiceState.pendingICE[fromId] = [];
                } catch(e) {}
            }

            function handleVoiceICE(fromId, data){
                const conn = voiceState.connections[fromId];
                if(conn && conn.pc && conn.pc.remoteDescription) {
                    conn.pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(()=>{});
                } else {
                    voiceState.pendingICE[fromId] = voiceState.pendingICE[fromId] || [];
                    voiceState.pendingICE[fromId].push(data.candidate);
                }
            }

            function handleVoiceLeave(fromId){
                teardownVoicePeer(fromId, false);
                Notifications.push('AETHER LINK', `${state.peers[fromId]?.name||fromId} left voice chat`);
                addActivity(state.peers[fromId]?.name||fromId, 'left voice chat');
                if(Object.keys(voiceState.connections).length === 0 && voiceState.active) {
                    // Everyone left — stay "active" alone in case more peers join, just update UI
                    renderVoiceParticipants();
                }
            }

            // ── Push-to-talk signaling: when I hold PTT, unmute locally AND tell peers
            //    I'm transmitting (used for the "speaking" UI on their end as a fallback
            //    to the AnalyserNode VAD, and to gate that my mic track stays muted otherwise). ──
            function pttStart(){
                if(!voiceState.active || voiceState.mode !== 'walkie' || voiceState.pttHeld) return;
                voiceState.pttHeld = true;
                if(voiceState.localStream) voiceState.localStream.getAudioTracks().forEach(t => t.enabled = true);
                const btn = document.getElementById('al-voice-ptt-btn');
                if(btn) { btn.style.background='rgba(52,211,153,0.25)'; btn.style.borderColor='rgba(52,211,153,0.5)'; btn.style.transform='scale(0.95)'; }
                Object.keys(voiceState.connections).forEach(id => sendToPeer(id, {type:'VOICE_PTT_START'}));
            }

            function pttEnd(){
                if(!voiceState.pttHeld) return;
                voiceState.pttHeld = false;
                if(voiceState.localStream) voiceState.localStream.getAudioTracks().forEach(t => t.enabled = false);
                const btn = document.getElementById('al-voice-ptt-btn');
                if(btn) { btn.style.background='rgba(139,92,246,0.12)'; btn.style.borderColor='rgba(139,92,246,0.3)'; btn.style.transform=''; }
                Object.keys(voiceState.connections).forEach(id => sendToPeer(id, {type:'VOICE_PTT_END'}));
            }

            function handlePTTStart(fromId){
                const conn = voiceState.connections[fromId];
                if(conn) { conn.speaking = true; renderVoiceParticipants(); }
            }
            function handlePTTEnd(fromId){
                const conn = voiceState.connections[fromId];
                if(conn) { conn.speaking = false; renderVoiceParticipants(); }
            }

            function toggleMicMute(){
                if(!voiceState.localStream) return;
                const track = voiceState.localStream.getAudioTracks()[0];
                if(!track) return;
                track.enabled = !track.enabled;
                const btn = document.getElementById('al-voice-mute-btn');
                const icon = document.getElementById('al-voice-mute-icon');
                if(track.enabled) {
                    if(btn) { btn.style.background='rgba(139,92,246,0.15)'; btn.style.borderColor='rgba(139,92,246,0.3)'; }
                    if(icon) icon.setAttribute('data-lucide','mic');
                } else {
                    if(btn) { btn.style.background='rgba(239,68,68,0.15)'; btn.style.borderColor='rgba(239,68,68,0.4)'; }
                    if(icon) icon.setAttribute('data-lucide','mic-off');
                }
                if(window.lucide) lucide.createIcons({nodes:[document.getElementById('al-voice-open-controls')]});
            }


            // ── Public API ──
            const API = {
                init() {
                    state.myName = SystemState.settings?.api_lastfm_user || (navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Workstation');
                    if (!state._initialized) {
                        state._initialized = true;
                        initBC();
                        os.logTerminal('Aether Link: Engine initialized. BroadcastChannel active.');
                        state._presenceInterval = setInterval(()=>{ if(Object.keys(state.peers).length>0) broadcastPresence(); }, 5000);
                    }
                    const el = document.getElementById('al-my-code');
                    if (el && state.myCode) el.textContent = state.myCode;
                    renderPeers();
                    renderPresence();
                    updateConnIndicator();
                },
                suspendUI() {
                    // Preserve active P2P connections across minimize/close while closing floating popups
                    const em = document.getElementById('al-emoji-picker');
                    if (em) em.style.display = 'none';
                },

                async generateCode() {
                    if(state.peer && !state.peer.destroyed) { try{state.peer.destroy();}catch(e){} }
                    // Generate short readable code
                    const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                    const part=()=>Array.from({length:4},()=>chars[Math.floor(Math.random()*chars.length)]).join('');
                    const shortCode=`${part()}-${part()}`;
                    state.myCode=shortCode;

                    const el=document.getElementById('al-my-code');
                    if(el) el.textContent='Connecting…';

                    try {
                        // Use shortCode as the PeerJS ID (lowercase for PeerJS compat)
                        const peerjsId='al-'+shortCode.replace('-','').toLowerCase();
                        state.peer = await createPeer(peerjsId);

                        // Patch BC reference
                        if(el) el.textContent=shortCode;

                        state.peer.on('connection', conn => {
                            setupDataConn(conn);
                        });
                        state.peer.on('error', e => {
                            os.logTerminal('Aether Link peer error: '+e.type);
                            if(el) el.textContent=shortCode+' (relay)';
                        });
                        state.peer.on('disconnected', ()=>{ try{state.peer.reconnect();}catch(e){} });

                        os.logTerminal(`Aether Link: Code generated — ${shortCode} | PeerJS ID: ${peerjsId}`);
                        Notifications.push('AETHER LINK', `Your code: ${shortCode}`);
                    } catch(e) {
                        // PeerJS unavailable — fall back to BroadcastChannel only (same browser tab group)
                        if(el) el.textContent=shortCode+' (local only)';
                        os.logTerminal('Aether Link: PeerJS unavailable, using BroadcastChannel only: '+(e.message||e.type||'unknown error'));
                        Notifications.push('AETHER LINK', `Could not reach the relay server — this code only works for other tabs in this same browser`);
                    }
                },

                copyCode() {
                    if(!state.myCode) { this.generateCode(); return; }
                    navigator.clipboard?.writeText(state.myCode).catch(()=>{});
                    Notifications.push('AETHER LINK', `Code copied: ${state.myCode}`);
                },

                async joinSession() {
                    const input=document.getElementById('al-join-code');
                    const code=(input?.value||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
                    if(!code||code.length<4){Notifications.push('AETHER LINK','Enter a valid code');return;}
                    const formatted=code.length>=8?code.slice(0,4)+'-'+code.slice(4,8):code;
                    if(input) input.value='';

                    if(!state.myCode || !state.peer || state.peer.destroyed) {
                        Notifications.push('AETHER LINK', 'Setting up your connection…');
                        await this.generateCode();
                    }

                    const targetPeerjsId='al-'+formatted.replace('-','').toLowerCase();

                    if(!state.peer || state.peer.destroyed || state.peer.disconnected) {
                        Notifications.push('AETHER LINK', 'Could not establish a relay connection — check your internet and try again');
                        os.logTerminal('Aether Link: join failed — no usable PeerJS connection');
                        return;
                    }

                    Notifications.push('AETHER LINK', `Connecting to ${formatted}…`);
                    os.logTerminal(`Aether Link: Dialing ${targetPeerjsId}`);

                    const conn = state.peer.connect(targetPeerjsId, {reliable:true});
                    if(!conn) {
                        Notifications.push('AETHER LINK', 'Failed to start connection — try again');
                        return;
                    }

                    // Provisional entry so the UI shows "connecting…" immediately
                    if(!state.peers[targetPeerjsId]) {
                        state.peers[targetPeerjsId]={id:targetPeerjsId,name:formatted,status:'connecting',chatHistory:[],presence:{},conn};
                        renderPeers();
                    }

                    // Real timeout: PeerJS will NOT error out on its own if the target
                    // peer simply doesn't exist on the broker — the connect() call
                    // succeeds optimistically and just never opens. We have to time it
                    // out ourselves and tell the user clearly what went wrong.
                    let settled = false;
                    const timeoutId = setTimeout(() => {
                        if(settled) return;
                        settled = true;
                        if(state.peers[targetPeerjsId] && state.peers[targetPeerjsId].status === 'connecting') {
                            delete state.peers[targetPeerjsId];
                            renderPeers();
                        }
                        try { conn.close(); } catch(e) {}
                        Notifications.push('AETHER LINK', `Could not reach ${formatted} — make sure they generated a code and are online right now`);
                        os.logTerminal(`Aether Link: connect timeout for ${targetPeerjsId}`);
                    }, 12000);

                    conn.on('open', () => {
                        settled = true;
                        clearTimeout(timeoutId);
                        setupDataConn(conn);
                    });
                    conn.on('error', e => {
                        settled = true;
                        clearTimeout(timeoutId);
                        if(state.peers[targetPeerjsId] && state.peers[targetPeerjsId].status === 'connecting') {
                            delete state.peers[targetPeerjsId];
                            renderPeers();
                        }
                        Notifications.push('AETHER LINK', `Connection to ${formatted} failed: ${e.type || e.message || 'unknown error'}`);
                        os.logTerminal('Aether Link connect error: '+(e.message||e.type));
                    });
                },

                acceptPair() {
                    const req=state.pendingPairReq; if(!req) return;
                    if(!state.myCode) this.generateCode();
                    // BC accept (same browser)
                    bcSend({type:'PAIR_ACCEPT', targetCode:req.from, fromName:state.myName});
                    connectPeerBC(req.from, req.fromName);
                    document.getElementById('al-pair-modal').style.display='none';
                    state.pendingPairReq=null;
                },

                rejectPair() {
                    const req=state.pendingPairReq; if(!req) return;
                    bcSend({type:'PAIR_REJECT', targetCode:req.from, fromName:state.myName});
                    document.getElementById('al-pair-modal').style.display='none';
                    state.pendingPairReq=null;
                },

                disconnect(rawId) {
                    const id = decodeURIComponent(rawId);
                    const p=state.peers[id]; if(p?.conn) try{p.conn.close();}catch(e){}
                    removePeer(id);
                },

                setStatus(s) {
                    state.myStatus=s;
                    document.querySelectorAll('.al-status-btn').forEach(b=>{b.classList.toggle('bg-white/8',b.dataset.status===s);b.classList.toggle('text-white',b.dataset.status===s);});
                    broadcastAll({type:'STATUS_UPDATE',status:s});
                },

                switchTab(tab) {
                    state.activeTab=tab;
                    document.querySelectorAll('.al-tab').forEach(el=>el.classList.add('hidden'));
                    const ae=document.getElementById(`al-tab-${tab}`); if(ae) ae.classList.remove('hidden');
                    document.querySelectorAll('.al-mod-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
                    const icons={chat:'message-square',presence:'eye',whiteboard:'pen-tool',transfer:'send',activity:'activity',miniapps:'grid-2x2',screenshare:'monitor-up',voice:'radio'};
                    const titles={chat:'Chat',presence:'Live Presence',whiteboard:'Shared Whiteboard',transfer:'File Transfer',activity:'Activity Feed',miniapps:'Mini Apps',screenshare:'Screen Share',voice:'Voice / Walkie-Talkie'};
                    const ie=document.getElementById('al-header-icon');const te=document.getElementById('al-header-title');
                    if(ie) ie.setAttribute('data-lucide',icons[tab]||'layout');if(te) te.textContent=titles[tab]||tab;
                    if(window.lucide) lucide.createIcons({nodes:[document.getElementById('al-tab-header')]});
                    if(tab==='whiteboard') setTimeout(initWB,50);
                    if(tab==='presence') renderPresence();
                    if(tab==='activity') { if(!state.activityLog.length) addActivity('System','Activity feed opened'); }
                    if(tab==='screenshare') {
                        const sel=document.getElementById('al-ss-peer-select');
                        if(sel) {
                            const esc = window.escapeAetherHtml;
                            sel.innerHTML='<option value="">— Select peer —</option>'+Object.values(state.peers).map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
                        }
                    }
                    if(tab==='voice') { renderVoiceParticipants(); }
                },

                openChat(rawPeerId) {
                    const peerId = decodeURIComponent(rawPeerId);
                    state.activePeer=peerId;
                    this.switchTab('chat');
                    const sel=document.getElementById('al-chat-peer');
                    if(sel) sel.value=peerId;
                    renderChat(peerId);
                },

                sendMessage() {
                    const input=document.getElementById('al-chat-input');const sel=document.getElementById('al-chat-peer');
                    const peerId=sel?.value||state.activePeer; const text=input?.value.trim();
                    if(!text||!peerId) return;
                    if(!state.peers[peerId]) state.peers[peerId]={id:peerId,name:peerId,chatHistory:[],presence:{},status:'online',conn:null};
                    const msg={id:Date.now(),from:state.myCode||'me',fromName:state.myName,text,ts:Date.now(),mine:true};
                    state.peers[peerId].chatHistory.push(msg);
                    renderChat(peerId);
                    if(input){input.value='';input.style.height='auto';}
                    // Send via WebRTC DataChannel OR BroadcastChannel
                    const peer=state.peers[peerId];
                    if(peer?.conn?.open) { sendToPeer(peerId,{type:'CHAT_MSG',text,ts:msg.ts}); }
                    else if(peer?.bc) { bcSend({type:'CHAT_MSG',targetCode:peerId,text,ts:msg.ts}); }
                    else { bcSend({type:'CHAT_MSG',targetCode:peerId,text,ts:msg.ts}); }
                    addActivity('You','sent a message');
                },

                chatKeydown(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();this.sendMessage();}},
                chatInputChange(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,80)+'px';const sel=document.getElementById('al-chat-peer');if(sel?.value) sendToPeer(sel.value,{type:'TYPING'});else bcSend({type:'TYPING'});},
                clearChat(){const sel=document.getElementById('al-chat-peer');const pid=sel?.value||state.activePeer;if(pid&&state.peers[pid]){state.peers[pid].chatHistory=[];renderChat(pid);}},

                toggleEmoji(){const p=document.getElementById('al-emoji-picker');if(!p) return;state.emojiVisible=!state.emojiVisible;if(state.emojiVisible){const g=document.getElementById('al-emoji-grid');if(g) g.innerHTML=EMOJIS.map(e=>`<button onclick="window.AetherLinkAPI.insertEmoji('${e}')" class="p-1 rounded hover:bg-white/10 text-sm hover-target cursor-none">${e}</button>`).join('');p.style.display='block';}else p.style.display='none';},
                insertEmoji(e){const i=document.getElementById('al-chat-input');if(i){i.value+=e;i.focus();}const p=document.getElementById('al-emoji-picker');if(p) p.style.display='none';state.emojiVisible=false;},

                attachFile(){document.getElementById('al-file-input')?.click();},
                pickFiles(){document.getElementById('al-file-input')?.click();},
                filesSelected(input){Array.from(input.files||[]).forEach(f=>this.sendFileOffer(f));input.value='';},
                dropFiles(e){e.preventDefault();const dz=document.getElementById('al-drop-zone');if(dz) dz.style.borderColor='';Array.from(e.dataTransfer.files||[]).forEach(f=>this.sendFileOffer(f));},

                async sendFileOffer(file){
                    const sel=document.getElementById('al-chat-peer');const peerId=sel?.value||state.activePeer;
                    if(!peerId){Notifications.push('AETHER LINK','Select a peer first');return;}
                    const peer=state.peers[peerId];
                    if(peer?.conn?.open) {
                        await sendFileViaPeer(peerId, file);
                    } else {
                        // BC can't send binary — show offer only
                        const sizeStr=formatFileSize(file.size);
                        bcSend({type:'FILE_OFFER',targetCode:peerId,fileName:file.name,fileSize:sizeStr,transferId:'bc_'+Date.now()});
                        Notifications.push('AETHER LINK',`File offer sent: ${file.name} (WebRTC needed for actual transfer)`);
                    }
                },

                wbTool(t){state.wbTool=t;document.querySelectorAll('.al-wb-tool').forEach(b=>{b.classList.toggle('bg-violet-500/20',b.dataset.tool===t);b.classList.toggle('text-violet-300',b.dataset.tool===t);b.classList.toggle('text-white/40',b.dataset.tool!==t);});},
                wbColorChange(c){state.wbColor=c;},
                wbSizeChange(s){state.wbSize=parseInt(s);},
                wbClear(){const c=document.getElementById('al-wb-canvas');if(c) c.getContext('2d').clearRect(0,0,c.width,c.height);broadcastAll({type:'WB_CLEAR'});},
                wbExport(){const c=document.getElementById('al-wb-canvas');if(!c) return;const a=document.createElement('a');a.download=`AetherLink_WB_${Date.now()}.png`;a.href=c.toDataURL();a.click();},

                launchMiniApp(id){const c=document.getElementById('al-mini-app-container');if(!c) return;const r=MINI_APPS[id];if(!r) return;c.classList.remove('hidden');c.innerHTML=r();if(window.lucide) lucide.createIcons({nodes:[c]});},
                pixelPaint(index, el){ paintPixelCell(index, el); },
                pixelReset(){ resetPixelGrid(true); },
                chessSquareClick(r,c){ chessSquareClick(r,c); },
                chessReset(){ resetChessBoard(true); },
                syncNotes(text){ sharedNotesState.text=text; broadcastAll({type:'SHARED_NOTES',text}); },
                addTodo(){const i=document.getElementById('al-todo-input');const t=i?.value.trim();if(!t) return;const item={id:Date.now(),text:t,done:false};todoItems.push(item);if(i) i.value='';renderTodos();broadcastAll({type:'TODO_SYNC',items:todoItems});},
                toggleTodo(id){const t=todoItems.find(x=>x.id===id);if(t){t.done=!t.done;renderTodos();broadcastAll({type:'TODO_SYNC',items:todoItems});}},
                removeTodo(id){const idx=todoItems.findIndex(x=>x.id===id);if(idx!==-1){todoItems.splice(idx,1);renderTodos();broadcastAll({type:'TODO_SYNC',items:todoItems});}},

                // ── Screen Sharing (real getDisplayMedia + WebRTC) ──
                async startScreenShare(){ await startScreenShareReal(); },
                stopScreenShare(){ stopScreenShareReal(); },
                acceptScreenShare(){ acceptScreenShareReal(); },
                declineScreenShare(){ declineScreenShareReal(); },

                // ── Voice Chat / Walkie-Talkie (real getUserMedia + WebRTC audio) ──
                async setVoiceMode(mode){ await startVoiceSession(mode); },
                leaveVoice(){ stopVoiceSession(true); },
                toggleMute(){ toggleMicMute(); },
                pttStart(){ pttStart(); },
                pttEnd(){ pttEnd(); },
            };

            window.AetherLinkAPI=API;
            return API;
        })();

window.extendOS({
    alGenerateCode:    () => window.AetherLinkAPI?.generateCode(),

    alCopyCode:        () => window.AetherLinkAPI?.copyCode(),

    alJoinSession:     () => window.AetherLinkAPI?.joinSession(),

    alAcceptPair:      () => window.AetherLinkAPI?.acceptPair(),

    alRejectPair:      () => window.AetherLinkAPI?.rejectPair(),

    alDisconnect:      (id) => window.AetherLinkAPI?.disconnect(id),

    alSetStatus:       (s) => window.AetherLinkAPI?.setStatus(s),

    alSwitchTab:       (t) => window.AetherLinkAPI?.switchTab(t),

    alOpenChat:        (id) => window.AetherLinkAPI?.openChat(id),

    alSendMessage:     () => window.AetherLinkAPI?.sendMessage(),

    alChatKeydown:     (e) => window.AetherLinkAPI?.chatKeydown(e),

    alChatInputChange: (el) => window.AetherLinkAPI?.chatInputChange(el),

    alClearChat:       () => window.AetherLinkAPI?.clearChat(),

    alToggleEmoji:     () => window.AetherLinkAPI?.toggleEmoji(),

    alInsertEmoji:     (e) => window.AetherLinkAPI?.insertEmoji(e),

    alAttachFile:      () => window.AetherLinkAPI?.attachFile(),

    alPickFiles:       () => window.AetherLinkAPI?.pickFiles(),

    alFilesSelected:   (el) => window.AetherLinkAPI?.filesSelected(el),

    alDropFiles:       (e) => window.AetherLinkAPI?.dropFiles(e),

    alWbTool:          (t) => window.AetherLinkAPI?.wbTool(t),

    alWbColorChange:   (c) => window.AetherLinkAPI?.wbColorChange(c),

    alWbSizeChange:    (s) => window.AetherLinkAPI?.wbSizeChange(s),

    alWbClear:         () => window.AetherLinkAPI?.wbClear(),

    alWbExport:        () => window.AetherLinkAPI?.wbExport(),

    alLaunchMiniApp:   (id) => window.AetherLinkAPI?.launchMiniApp(id),

    alPixelPaint:      (idx, el) => window.AetherLinkAPI?.pixelPaint(idx, el),

    alPixelReset:      () => window.AetherLinkAPI?.pixelReset(),

    alChessReset:      () => window.AetherLinkAPI?.chessReset(),

    alStartScreenShare:() => window.AetherLinkAPI?.startScreenShare(),

    alStopScreenShare: () => window.AetherLinkAPI?.stopScreenShare(),

    alAcceptScreenShare: () => window.AetherLinkAPI?.acceptScreenShare(),

    alDeclineScreenShare: () => window.AetherLinkAPI?.declineScreenShare(),

    alSetVoiceMode:    (m) => window.AetherLinkAPI?.setVoiceMode(m),

    alLeaveVoice:      () => window.AetherLinkAPI?.leaveVoice(),

    alToggleMute:      () => window.AetherLinkAPI?.toggleMute(),

    alPTTStart:        () => window.AetherLinkAPI?.pttStart(),

    alPTTEnd:          () => window.AetherLinkAPI?.pttEnd()
});
