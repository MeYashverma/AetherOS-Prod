// AetherOS — Speech Synthesis TTS, Emo OLED Face Engine & Companion Conversational Brain
window.extendOS({
    speech: { lastSpokenAt: 0, voices: [], preferredVoice: null, voiceScores: new Map() },

    speechSupported: () => ('speechSynthesis' in window) && ('SpeechSynthesisUtterance' in window),

    speechVoiceScore: (voice) => {
                if (!voice) return 0;
                const name = `${voice.name || ''} ${voice.lang || ''}`.toLowerCase();
                let score = 0;
                if (/^en/i.test(voice.lang || '')) score += 30;
                if (/natural|neural|online|aria|jenny|guy|libby|sonia|ryan|michelle|roger|emma|brian|amy|ava|andrew/i.test(name)) score += 55;
                if (/microsoft/i.test(name)) score += 36;
                if (/google (us|uk|english)|google.*english/i.test(name)) score += 30;
                if (/samantha|karen|serena|daniel|moira|tessa|veena|rishi|alex/i.test(name)) score += 28;
                if (/female|zira|susan|hazel/i.test(name)) score += 10;
                if (/compact|eSpeak|default|fred|bells|bad news|cellos|pipe organ|trinoids|whisper/i.test(name)) score -= 40;
                if (voice.localService === false) score += 4; // often cloud/natural in Chromium
                return score;
            },

    initSpeechSynthesis: () => {
                if (!os.speechSupported()) return false;
                const loadVoices = () => {
                    const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
                    os.speech.voices = voices || [];
                    os.speech.voiceScores = new Map(os.speech.voices.map(v => [v.name, os.speechVoiceScore(v)]));
                    os.speech.preferredVoice = os.resolveSpeechVoice(SystemState.settings.speech_voice || 'auto-real');
                    os.populateSpeechVoiceSelect && os.populateSpeechVoiceSelect();
                    os.updateSpeechTuningUI && os.updateSpeechTuningUI();
                }

                // Aether Companion / Jarvis-style chatter buttons
                if (document.getElementById('opt-companion-on')) {
                    const activeCompanionId = SystemState.settings.speech_companion === 'on' ? 'opt-companion-on' : 'opt-companion-off';
                    const activeCompanionBtn = document.getElementById(activeCompanionId);
                    const deactiveCompanionId = SystemState.settings.speech_companion === 'on' ? 'opt-companion-off' : 'opt-companion-on';
                    const deactiveCompanionBtn = document.getElementById(deactiveCompanionId);
                    if (activeCompanionBtn) activeCompanionBtn.className = "flex-1 p-2 bg-white/20 text-white border border-white/30 text-xs font-mono uppercase rounded transition hover-target cursor-none";
                    if (deactiveCompanionBtn) deactiveCompanionBtn.className = "flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded text-gray-400 transition hover-target cursor-none";
                };
                loadVoices();
                if (window.speechSynthesis.onvoiceschanged !== undefined) {
                    window.speechSynthesis.onvoiceschanged = loadVoices;
                }
                // Emo emotion mode buttons
                if (document.getElementById('opt-emo-gif')) {
                    const activeEmoId = (SystemState.settings.companion_emotion_mode || 'gif') === 'emo' ? 'opt-emo-oled' : 'opt-emo-gif';
                    const activeEmoBtn = document.getElementById(activeEmoId);
                    const deactiveEmoId = (SystemState.settings.companion_emotion_mode || 'gif') === 'emo' ? 'opt-emo-gif' : 'opt-emo-oled';
                    const deactiveEmoBtn = document.getElementById(deactiveEmoId);
                    if (activeEmoBtn) activeEmoBtn.className = "flex-1 p-2 bg-white/20 text-white border border-white/30 text-xs font-mono uppercase rounded transition hover-target cursor-none";
                    if (deactiveEmoBtn) deactiveEmoBtn.className = "flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded text-gray-400 transition hover-target cursor-none";
                }
                if (!os.speech.heartbeatInterval) {
                    os.speech.heartbeatInterval = setInterval(() => {
                        if (window.speechSynthesis && window.speechSynthesis.speaking) {
                            try { window.speechSynthesis.resume(); } catch(_) {}
                        }
                    }, 140);
                }

                if (!os.speech.unlockBound) {
                    os.speech.unlockBound = true;
                    const unlock = () => {
                        try { window.speechSynthesis.resume(); } catch(_) {}
                    };
                    ['pointerdown','keydown','touchstart','mousedown'].forEach(evt => window.addEventListener(evt, unlock, { passive:true }));
                    document.addEventListener('visibilitychange', () => { try { if (!document.hidden) window.speechSynthesis.resume(); } catch(_) {} }, { passive:true });
                }
                return true;
            },

    resolveSpeechVoice: (voiceName = 'auto-real') => {
                if (!os.speechSupported()) return null;
                const voices = os.speech.voices?.length ? os.speech.voices : (window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : []);
                if (!voices || !voices.length) return null;
                if (voiceName && voiceName !== 'auto-real') {
                    const exact = voices.find(v => v.name === voiceName);
                    if (exact) return exact;
                }
                return voices.slice().sort((a,b) => os.speechVoiceScore(b) - os.speechVoiceScore(a))[0] || voices[0] || null;
            },

    populateSpeechVoiceSelect: () => {
                const select = document.getElementById('speech-voice-select');
                const quality = document.getElementById('speech-voice-quality');
                const support = document.getElementById('speech-api-support');
                if (!select) return;
                if (!os.speechSupported()) {
                    select.innerHTML = '<option value="auto-real">Speech API unavailable</option>';
                    if (support) { support.innerText = 'UNAVAILABLE'; support.className = 'text-red-400'; }
                    if (quality) { quality.innerText = 'UNAVAILABLE'; quality.className = 'text-red-400'; }
                    return;
                }
                const voices = os.speech.voices?.length ? os.speech.voices : (window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : []);
                if (support) { support.innerText = voices.length ? `${voices.length} VOICES` : 'LOADING'; support.className = voices.length ? 'text-green-400' : 'text-yellow-400'; }
                const saved = SystemState.settings.speech_voice || 'auto-real';
                const sorted = voices.slice().sort((a,b) => os.speechVoiceScore(b) - os.speechVoiceScore(a));
                const best = sorted[0];
                const opt = (v) => {
                    const score = os.speechVoiceScore(v);
                    const tag = score >= 95 ? 'REAL+' : score >= 75 ? 'NATURAL' : score >= 45 ? 'CLEAR' : 'BASIC';
                    const local = v.localService ? 'local' : 'enhanced';
                    return `<option value="${os._html ? os._html(v.name) : v.name}">${tag} · ${os._html ? os._html(v.name) : v.name} · ${os._html ? os._html(v.lang || '--') : (v.lang || '--')} · ${local}</option>`;
                };
                select.innerHTML = `<option value="auto-real">AUTO BEST FREE VOICE${best ? ' · ' + (os._html ? os._html(best.name) : best.name) : ''}</option>` + sorted.map(opt).join('');
                select.value = saved;
                os.speech.preferredVoice = os.resolveSpeechVoice(saved);
                const score = os.speech.preferredVoice ? os.speechVoiceScore(os.speech.preferredVoice) : 0;
                if (quality) {
                    quality.innerText = score >= 95 ? 'REAL+ LOCAL' : score >= 75 ? 'NATURAL' : score >= 45 ? 'CLEAR' : (voices.length ? 'BASIC' : 'LOADING');
                    quality.className = score >= 75 ? 'text-green-400' : score >= 45 ? 'text-yellow-300' : 'text-gray-500';
                }
                os.renderVoicePackGrid && os.renderVoicePackGrid();
            },

    renderVoicePackGrid: () => {
                const grid = document.getElementById('voice-pack-grid');
                if (!grid) return;
                const voices = os.speech.voices?.length ? os.speech.voices : (window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : []);
                const saved = SystemState.settings.speech_voice || 'auto-real';
                const sorted = voices.slice().sort((a,b) => os.speechVoiceScore(b) - os.speechVoiceScore(a));
                const makeCard = (v, isAuto) => {
                    const score = isAuto ? 999 : os.speechVoiceScore(v);
                    const tag = isAuto ? 'RECOMMENDED' : score >= 95 ? 'REAL+' : score >= 75 ? 'NATURAL' : score >= 45 ? 'CLEAR' : 'BASIC';
                    const tagColor = isAuto ? 'background:rgba(16,185,129,0.15);color:#34d399' : score >= 75 ? 'background:rgba(16,185,129,0.12);color:#34d399' : score >= 45 ? 'background:rgba(250,204,21,0.12);color:#facc15' : 'background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.35)';
                    const name = isAuto ? 'Auto Best' : (os._html ? os._html(v.name) : v.name);
                    const meta = isAuto ? 'Let AetherOS choose the most natural voice available' : `${os._html ? os._html(v.lang || '--') : (v.lang || '--')} · ${v.localService ? 'local' : 'enhanced'}`;
                    const val = isAuto ? 'auto-real' : (os._html ? os._html(v.name) : v.name);
                    const selected = saved === val;
                    return `<div class="voice-pack-card${isAuto ? ' voice-pack-auto' : ''}${selected ? ' selected' : ''}" data-voice-name="${val}" onclick="os.handleVoiceCardClick(event, this.dataset.voiceName)"><div class="voice-pack-play" onclick="event.stopPropagation();os.previewVoicePack(this.dataset.voiceName, this)" data-voice-name="${val}"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg></div><div class="voice-pack-info"><div class="voice-pack-name">${name}</div><div class="voice-pack-meta">${meta}</div></div><div class="voice-pack-badge" style="${tagColor}">${tag}</div><div class="voice-pack-check"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div></div>`;
                };
                grid.innerHTML = makeCard(null, true) + sorted.map(v => makeCard(v, false)).join('');
                os._applyVoicePackFilters && os._applyVoicePackFilters();
            },

    handleVoiceCardClick: (event, voiceName) => {
                os.selectVoiceFromGrid(voiceName);
            },

    previewVoicePack: (voiceName, el) => {
                if (el) { el.classList.add('playing'); setTimeout(() => el.classList.remove('playing'), 2000); }
                const saved = SystemState.settings.speech_voice;
                SystemState.settings.speech_voice = voiceName;
                os.speech.preferredVoice = os.resolveSpeechVoice(voiceName);
                const v = os.speech.preferredVoice;
                const name = v ? v.name : 'the browser default voice';
                os.speak(`Voice preview. AetherOS is using ${name}. This is a free built in voice pack from your browser or operating system.`, { force: true, interrupt: true });
                SystemState.settings.speech_voice = saved;
                os.speech.preferredVoice = os.resolveSpeechVoice(saved);
            },

    selectVoiceFromGrid: (voiceName) => {
                os.setSpeechVoice(voiceName);
            },

    filterVoicePackGrid: (query) => {
                os._voicePackSearch = (query || '').toLowerCase().trim();
                os._applyVoicePackFilters && os._applyVoicePackFilters();
            },

    filterVoicePackTag: (tag) => {
                document.querySelectorAll('.voice-pack-tag').forEach(t => t.classList.remove('active'));
                const btn = document.querySelector(`.voice-pack-tag[data-tag="${tag}"]`);
                if (btn) btn.classList.add('active');
                os._voicePackTag = tag;
                os._applyVoicePackFilters && os._applyVoicePackFilters();
            },

    _applyVoicePackFilters: () => {
                const q = os._voicePackSearch || '';
                const tag = os._voicePackTag || 'all';
                document.querySelectorAll('.voice-pack-card').forEach(card => {
                    const txt = (card.innerText || '').toLowerCase();
                    let visible = true;
                    if (q && !txt.includes(q)) visible = false;
                    if (visible && tag !== 'all') {
                        const badge = (card.querySelector('.voice-pack-badge')?.innerText || '');
                        const meta = (card.querySelector('.voice-pack-meta')?.innerText || '').toLowerCase();
                        const isAuto = card.dataset.voiceName === 'auto-real';
                        if (tag === 'neural') visible = isAuto || /REAL\+|NATURAL/.test(badge);
                        else if (tag === 'english') visible = isAuto || meta.includes('en');
                        else if (tag === 'local') visible = isAuto || meta.includes('local');
                    }
                    card.classList.toggle('hidden-by-filter', !visible);
                });
            },

    setSpeechVoice: (voiceName) => {
                SystemState.settings.speech_voice = voiceName || 'auto-real';
                SystemState.save();
                os.speech.preferredVoice = os.resolveSpeechVoice(SystemState.settings.speech_voice);
                os.populateSpeechVoiceSelect();
                os.speak('Voice pack switched. This is the selected free browser voice for AetherOS.', { force:true, interrupt:true });
                os.logTerminal(`Voice Core: selected voice pack -> ${SystemState.settings.speech_voice}`);
            },

    setSpeechTuning: (key, value) => {
                const num = Number(value);
                if (!Number.isFinite(num)) return;
                SystemState.settings[key] = num;
                SystemState.save();
                os.updateSpeechTuningUI();
            },

    updateSpeechTuningUI: () => {
                const rate = Number(SystemState.settings.speech_rate ?? 0.92);
                const pitch = Number(SystemState.settings.speech_pitch ?? 0.88);
                const rateRange = document.getElementById('speech-rate-range');
                const pitchRange = document.getElementById('speech-pitch-range');
                const rateOut = document.getElementById('speech-rate-readout');
                const pitchOut = document.getElementById('speech-pitch-readout');
                if (rateRange) rateRange.value = String(rate);
                if (pitchRange) pitchRange.value = String(pitch);
                if (rateOut) rateOut.innerText = `${rate.toFixed(2)}×`;
                if (pitchOut) pitchOut.innerText = pitch.toFixed(2);
            },

    previewSpeechVoice: () => {
                const v = os.resolveSpeechVoice(SystemState.settings.speech_voice || 'auto-real');
                const name = v ? v.name : 'the browser default voice';
                os.speak(`Voice preview. AetherOS is using ${name}. This is a free built in voice pack from your browser or operating system.`, { force:true, interrupt:true });
            },

    speechKick: (duration = 3600) => {
                if (!os.speechSupported()) return;
                clearInterval(os.speech.kickTimer);
                const synth = window.speechSynthesis;
                const started = Date.now();
                os.speech.kickTimer = setInterval(() => {
                    try { synth.resume(); } catch(_) {}
                    if (!synth.speaking || Date.now() - started > duration) {
                        clearInterval(os.speech.kickTimer);
                        os.speech.kickTimer = null;
                    }
                }, 220);
            },

    speak: (text, opts = {}) => {
                if (!os.speechSupported()) {
                    os.logTerminal && os.logTerminal('Voice Core: Speech Synthesis API unavailable in this browser.');
                    return false;
                }
                if (!opts.force && SystemState.settings.speech_synthesis !== 'on') return false;
                const raw = String(text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                if (!raw) return false;
                
                const now = Date.now();
                const minGap = opts.force ? 0 : (opts.minGap || 3200);
                if (!opts.force && now - (os.speech.lastSpokenAt || 0) < minGap) return false;
                
                os.initSpeechSynthesis();
                const synth = window.speechSynthesis;
                
                // Clear any existing active heartbeat loop
                if (os.speech.heartbeatInterval) {
                    clearInterval(os.speech.heartbeatInterval);
                }
                
                // Maintain high frequency wake heartbeat & Chrome 15-second speech cutoff reset watchdog
                let tickCount = 0;
                os.speech.heartbeatInterval = setInterval(() => {
                    if (synth.speaking) {
                        try { synth.resume(); } catch(_) {}
                        
                        tickCount++;
                        // Every 5 seconds (50 ticks of 100ms), pause and immediately resume speech.
                        // This resets Chromium's internal 15-second speech termination watchdog timer,
                        // guaranteeing that long speech monologues never get cut off midway or at the end!
                        if (tickCount % 50 === 0) {
                            try {
                                synth.pause();
                                setTimeout(() => {
                                    try { synth.resume(); } catch(_) {}
                                }, 15);
                            } catch(_) {}
                        }
                    }
                }, 100);

                const makeUtterance = (txt) => {
                    // Extended character slice from 360 to 1200. Local voices are incredibly robust 
                    // and handle extensive blocks easily, eliminating the truncating cutting-off issue.
                    const utter = new SpeechSynthesisUtterance(txt.slice(0, 1200));
                    const selectedVoice = os.resolveSpeechVoice(SystemState.settings.speech_voice || 'auto-real');
                    if (selectedVoice) utter.voice = selectedVoice;
                    utter.lang = selectedVoice?.lang || 'en-US';
                    utter.rate = Number(opts.rate ?? SystemState.settings.speech_rate ?? 0.92);
                    utter.pitch = Number(opts.pitch ?? SystemState.settings.speech_pitch ?? 0.88);
                    utter.volume = Math.max(0, Math.min(1, Number(opts.volume ?? SystemState.settings.speech_volume ?? 0.85)));
                    
                    utter.onstart = () => {
                        os.speech._started = true;
                        os.speech.lastSpokenAt = Date.now();
                        os.startTTSVisualizer && os.startTTSVisualizer(raw);
                        os.speechKick(Math.max(2600, raw.length * 85));
                    };
                    
                    // Lightweight, IPC-friendly word boundaries to prevent any IPC lag
                    utter.onboundary = (event) => {
                        if (os.pulseTTSVisualizer) {
                            os.pulseTTSVisualizer('aether', 0.85);
                        }
                    };
                    
                    utter.onend = () => {
                        clearInterval(os.speech.kickTimer);
                        os.speech.kickTimer = null;
                        os.stopTTSVisualizer && os.stopTTSVisualizer();
                    };
                    
                    utter.onerror = () => {
                        clearInterval(os.speech.kickTimer);
                        os.speech.kickTimer = null;
                        os.stopTTSVisualizer && os.stopTTSVisualizer();
                    };
                    
                    return utter;
                };

                try {
                    os.speech._started = false;
                    
                    // Always cancel any pending speech immediately to prevent queues from clogging up
                    synth.cancel();
                    
                    // Small delay to let the browser process the cancel operation
                    setTimeout(() => {
                        try { synth.resume(); } catch(_) {}
                        const utter = makeUtterance(raw);
                        
                        // Prevent garbage collection by keeping references in a global array
                        window._activeUtterances = window._activeUtterances || [];
                        window._activeUtterances.push(utter);
                        if (window._activeUtterances.length > 20) {
                            window._activeUtterances.shift();
                        }
                        
                        os.speech.currentUtterance = utter;
                        
                        try { synth.speak(utter); } catch(e) { console.error('Speech speak failed', e); }
                        try { synth.resume(); } catch(_) {}
                        
                        // Fallback re-queue check in case of a silent failure
                        setTimeout(() => {
                            if (!os.speech._started && !synth.speaking) {
                                try {
                                    synth.cancel();
                                    const retry = makeUtterance(raw);
                                    window._activeUtterances.push(retry);
                                    os.speech.currentUtterance = retry;
                                    synth.resume();
                                    synth.speak(retry);
                                } catch(_) {}
                            }
                        }, 600);
                        
                    }, 60); // 60ms is the perfect time budget for resetting hardware audio pipelines
                    
                    return true;
                } catch(e) {
                    console.error('Speech engine failure', e);
                    return false;
                }
            },

    stopSpeech: () => {
                try {
                    if (os.speechSupported()) window.speechSynthesis.cancel();
                    clearInterval(os.speech.kickTimer);
                    os.speech.kickTimer = null;
                    os.stopTTSVisualizer && os.stopTTSVisualizer();
                } catch(e) {}
            },

    speakSystemNotification: (title, message) => {
                if (SystemState.settings.speech_synthesis !== 'on') return false;
                const t = String(title || '').trim();
                const m = String(message || '').trim();
                // Avoid turning the decorative low-priority chatter loop into constant speech.
                if (/^(SYSTEM|AetherOS)$/i.test(t) && /^\[/.test(m)) return false;
                if (/Visual engine initialized|Telemetry uplink active|All runtime subsystems active/i.test(m)) return false;
                return os.speak(`${t}. ${m}`, { minGap: 3800, interrupt: true });
            },

    emoFaceEngine: null,

    initEmoFace: function() {
                if (os.emoFaceEngine) return;
                os.emoFaceEngine = {
                    canvas: document.getElementById('aether-emo-face'),
                    ctx: null,
                    size: 56,
                    active: false,
                    animFrame: 0,
                    // Current visual state (all lerped smoothly)
                    state: {
                        eyeLX: 0, eyeLY: 0, eyeRX: 0, eyeRY: 0,    // eye positions for tracking
                        pupilDilate: 1,                               // pupil size multiplier
                        browAngle: 0, browY: 0,                       // eyebrow tilt/height
                        mouthCurve: 0, mouthOpen: 0, mouthWidth: 1,  // mouth params
                        blushAlpha: 0, blushRadius: 0,                // cheek blush
                        headTilt: 0, headBob: 0,                      // head movement
                        glowIntensity: 0.18, glowHue: 195,            // background glow (cyan)
                        tearFlow: 0, tearDrop: 0,                     // tear animation
                        sparkleCount: 0, sparklePhase: 0,             // excitement sparkles
                        sweatCount: 0, sweatPhase: 0,                 // nervous sweat
                        heartCount: 0, heartPhase: 0,                 // happy hearts
                        steamCount: 0, steamPhase: 0,                 // angry steam
                        blinkPhase: 0, blinkState: 'open',
                        idleTimer: 0, idleLookX: 0, idleLookY: 0,
                    },
                    // Current/target emotion identifiers
                    currentEmotion: 'neutral',
                    targetEmotion: 'neutral',
                    transitionT: 0,
                    // Particle pools
                    particles: { tears: [], sparkles: [], hearts: [], sweat: [], steam: [] },

                    init: function() {
                        if (!this.canvas) return;
                        this.ctx = this.canvas.getContext('2d');
                        this.size = this.canvas.width;
                        this.active = true;
                        this.start();
                    },

                    // ----- EMOTION DEFINITIONS (drive all state params) -----
                    emotionDefs: {
                        neutral:  { brows:0, mouthCurve:0, mouthOpen:0, blush:0, glow:[0.18,195], particles:null },
                        happy:    { brows:-0.5, mouthCurve:0.7, mouthOpen:0.1, blush:0.25, glow:[0.28,40], particles:null },
                        happy2:   { brows:-0.7, mouthCurve:1, mouthOpen:0.45, blush:0.35, glow:[0.35,45], particles:'hearts' },
                        sad:      { brows:0.5, mouthCurve:-0.7, mouthOpen:0.05, blush:0.15, glow:[0.12,220], particles:'tears' },
                        angry:    { brows:0.9, mouthCurve:-0.4, mouthOpen:0.2, blush:0.4, glow:[0.3,5], particles:'steam' },
                        dizzy:    { brows:0.3, mouthCurve:0, mouthOpen:0.55, blush:0.2, glow:[0.2,280], particles:'sweat' },
                        excited:  { brows:-0.9, mouthCurve:0.8, mouthOpen:0.5, blush:0.5, glow:[0.4,55], particles:'sparkles' },
                        sleep:    { brows:0.1, mouthCurve:0, mouthOpen:0.12, blush:0.1, glow:[0.08,200], particles:null },
                        wink:     { brows:0.2, mouthCurve:0.5, mouthOpen:0, blush:0.2, glow:[0.22,200], particles:null },
                        surprised:{ brows:-0.4, mouthCurve:0, mouthOpen:0.7, blush:0, glow:[0.28,190], particles:'sparkles' },
                        bootup:   { brows:0, mouthCurve:0, mouthOpen:0, blush:0, glow:[0.12,220], particles:null },
                    },

                    // ----- CORE DRAWING PRIMITIVES -----
                    cx: function() { return this.size / 2; },
                    cy: function() { return this.size / 2; },

                    glow: function(r, g, b, a) {
                        var grad = this.ctx.createRadialGradient(this.cx(), this.cy(), 2, this.cx(), this.cy(), this.size/2 - 1);
                        grad.addColorStop(0, 'rgba('+r+','+g+','+b+','+a.toFixed(3)+')');
                        grad.addColorStop(0.55, 'rgba('+r+','+g+','+b+','+(a*0.25).toFixed(3)+')');
                        grad.addColorStop(1, 'rgba(5,5,7,0.97)');
                        this.ctx.fillStyle = grad;
                        this.ctx.fillRect(0, 0, this.size, this.size);
                    },

                    // ----- PARTICLES -----
                    spawnParticle: function(pool, x, y, vx, vy, life, size) {
                        pool.push({ x:x, y:y, vx:vx||0, vy:vy||0, life:life||60, maxLife:life||60, size:size||2 });
                    },
                    tickParticles: function(pool, dt) {
                        for (var i = pool.length-1; i >= 0; i--) {
                            var p = pool[i];
                            p.x += p.vx * dt; p.y += p.vy * dt;
                            p.life -= dt * 60;
                            if (p.life <= 0) pool.splice(i, 1);
                        }
                        // Cap
                        while (pool.length > 18) pool.shift();
                    },
                    drawParticles: function(pool, color, shape) {
                        var ctx = this.ctx;
                        for (var i = 0; i < pool.length; i++) {
                            var p = pool[i], alpha = Math.max(0, p.life / p.maxLife);
                            ctx.globalAlpha = alpha;
                            ctx.fillStyle = color;
                            if (shape === 'tear') {
                                ctx.beginPath();
                                ctx.moveTo(p.x, p.y - p.size*1.5);
                                ctx.quadraticCurveTo(p.x + p.size, p.y + p.size*0.5, p.x, p.y + p.size*2);
                                ctx.quadraticCurveTo(p.x - p.size, p.y + p.size*0.5, p.x, p.y - p.size*1.5);
                                ctx.fill();
                            } else if (shape === 'heart') {
                                var s = p.size;
                                ctx.beginPath();
                                ctx.moveTo(p.x, p.y + s*0.7);
                                ctx.bezierCurveTo(p.x, p.y + s*0.3, p.x - s*0.7, p.y - s*0.5, p.x, p.y - s*0.4);
                                ctx.bezierCurveTo(p.x + s*0.7, p.y - s*0.5, p.x, p.y + s*0.3, p.x, p.y + s*0.7);
                                ctx.fill();
                            } else if (shape === 'steam') {
                                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
                            } else {
                                // sparkle / sweat / default: tiny circle
                                ctx.beginPath(); ctx.arc(p.x, p.y, p.size*0.7, 0, Math.PI*2); ctx.fill();
                                // sparkle cross
                                if (shape === 'sparkle') {
                                    ctx.strokeStyle = color;
                                    ctx.lineWidth = 0.5;
                                    ctx.beginPath(); ctx.moveTo(p.x-p.size, p.y); ctx.lineTo(p.x+p.size, p.y); ctx.stroke();
                                    ctx.beginPath(); ctx.moveTo(p.x, p.y-p.size); ctx.lineTo(p.x, p.y+p.size); ctx.stroke();
                                }
                            }
                        }
                        ctx.globalAlpha = 1;
                    },

                    // ----- EYES WITH PUPILS -----
                    drawEye: function(x, y, lookX, lookY, dilate, closed) {
                        var ctx = this.ctx, s = this.size;
                        var r = 4.2 * (dilate || 1);
                        if (closed) {
                            // Closed: horizontal line
                            ctx.strokeStyle = '#ffffff';
                            ctx.lineWidth = 1.6;
                            ctx.lineCap = 'round';
                            ctx.beginPath(); ctx.moveTo(x - 4.5, y); ctx.lineTo(x + 4.5, y); ctx.stroke();
                            return;
                        }
                        // White of eye (subtle)
                        ctx.fillStyle = 'rgba(255,255,255,0.15)';
                        ctx.beginPath(); ctx.ellipse(x, y, r+0.8, r+0.3, 0, 0, Math.PI*2); ctx.fill();
                        // Iris/pupil circle
                        ctx.fillStyle = '#ffffff';
                        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
                        // Pupil dot that follows gaze
                        var px = x + (lookX || 0) * 1.6;
                        var py = y + (lookY || 0) * 1.1;
                        var pr = r * 0.38;
                        ctx.fillStyle = 'rgba(5,5,7,0.85)';
                        ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI*2); ctx.fill();
                        // Tiny highlight
                        ctx.fillStyle = 'rgba(255,255,255,0.6)';
                        ctx.beginPath(); ctx.arc(px - pr*0.4, py - pr*0.5, pr*0.35, 0, Math.PI*2); ctx.fill();
                    },

                    // ----- EYEBROWS -----
                    drawEyebrow: function(x, y, angle, tiltY) {
                        var ctx = this.ctx, len = 7;
                        var ay = y + (tiltY || 0);
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 1.8;
                        ctx.lineCap = 'round';
                        ctx.save();
                        ctx.translate(x, ay);
                        ctx.rotate((angle || 0) * 0.6);
                        ctx.beginPath();
                        ctx.moveTo(-len/2, 0);
                        ctx.quadraticCurveTo(0, -(angle || 0) * 1.5, len/2, 0);
                        ctx.stroke();
                        ctx.restore();
                    },

                    // ----- MOUTH -----
                    drawMouth: function(curve, openness, width) {
                        var ctx = this.ctx, s = this.size;
                        var cx = this.cx(), my = this.cy() + 9;
                        var w = 5 * (width || 1);
                        var o = openness || 0;
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 1.6;
                        ctx.lineCap = 'round';
                        ctx.beginPath();
                        if (Math.abs(o) < 0.08) {
                            // Flat line with subtle curve
                            ctx.moveTo(cx - w, my);
                            ctx.quadraticCurveTo(cx, my + curve * 3.5, cx + w, my);
                        } else if (o > 0.25) {
                            // Open mouth (surprised / big laugh)
                            var oh = o * 6;
                            ctx.moveTo(cx - w, my - curve * 2);
                            ctx.quadraticCurveTo(cx - w*0.6, my + oh, cx, my + oh + curve);
                            ctx.quadraticCurveTo(cx + w*0.6, my + oh, cx + w, my - curve);
                            // Teeth for happy
                            if (curve > 0.5 && o > 0.35) {
                                ctx.fillStyle = 'rgba(5,5,7,0.7)';
                                ctx.fillRect(cx - w*0.5, my + oh*0.2, w, oh*0.6);
                                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                                for (var ti = -1; ti <= 1; ti+=0.5) {
                                    ctx.fillRect(cx + ti*w*0.35 - 0.6, my + oh*0.22, 1.2, oh*0.55);
                                }
                            }
                        } else {
                            // Slightly open
                            var oh = o * 4;
                            ctx.moveTo(cx - w, my);
                            ctx.quadraticCurveTo(cx, my + oh + curve * 2, cx + w, my);
                        }
                        ctx.stroke();
                    },

                    // ----- BLUSH -----
                    drawBlush: function(alpha, radius) {
                        if (alpha < 0.01) return;
                        var ctx = this.ctx, s = this.size;
                        var cx = this.cx(), cy = this.cy();
                        var grad = ctx.createRadialGradient(cx - 9, cy + 2, 0, cx - 9, cy + 2, (radius || 6));
                        grad.addColorStop(0, 'rgba(255,120,140,'+alpha.toFixed(2)+')');
                        grad.addColorStop(1, 'rgba(255,120,140,0)');
                        ctx.fillStyle = grad;
                        ctx.fillRect(cx - 18, cy - 4, 18, 14);
                        grad = ctx.createRadialGradient(cx + 9, cy + 2, 0, cx + 9, cy + 2, (radius || 6));
                        grad.addColorStop(0, 'rgba(255,120,140,'+alpha.toFixed(2)+')');
                        grad.addColorStop(1, 'rgba(255,120,140,0)');
                        ctx.fillStyle = grad;
                        ctx.fillRect(cx, cy - 4, 18, 14);
                    },

                    // ----- SCANLINES -----
                    drawScanlines: function() {
                        var ctx = this.ctx, s = this.size;
                        ctx.fillStyle = 'rgba(0,0,0,0.055)';
                        for (var i = 0; i < s; i += 3) {
                            ctx.fillRect(0, i, s, 0.8);
                        }
                    },

                    // ----- MAIN RENDER -----
                    render: function(timestamp) {
                        var ctx = this.ctx, s = this.size;
                        if (!ctx) return;
                        var st = this.state;
                        ctx.clearRect(0, 0, s, s);

                        // Background glow
                        var hue = st.glowHue || 195;
                        var r = Math.round(34 + Math.sin(hue * Math.PI/180) * 120);
                        var g = Math.round(180 + Math.cos(hue * Math.PI/180) * 60);
                        var b = Math.round(220 + Math.cos((hue+60) * Math.PI/180) * 50);
                        this.glow(Math.max(10,Math.min(255,r)), Math.max(50,Math.min(255,g)), Math.max(80,Math.min(255,b)), st.glowIntensity || 0.18);

                        // Face outline ring
                        ctx.beginPath();
                        ctx.arc(this.cx(), this.cy(), s/2 - 3.5, 0, Math.PI*2);
                        ctx.strokeStyle = 'rgba(255,255,255,' + (0.35 + (st.glowIntensity||0)*1.2).toFixed(2) + ')';
                        ctx.lineWidth = 1.2;
                        ctx.stroke();

                        // Subtle outer ring
                        ctx.beginPath();
                        ctx.arc(this.cx(), this.cy(), s/2 - 2, 0, Math.PI*2);
                        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
                        ctx.lineWidth = 0.5;
                        ctx.stroke();

                        // Apply head tilt
                        ctx.save();
                        ctx.translate(this.cx(), this.cy());
                        ctx.rotate((st.headTilt || 0) * 0.08);
                        ctx.translate(-this.cx(), -this.cy());

                        var bobY = (st.headBob || 0) * 1.5;
                        var cy = this.cy();
                        var cx = this.cx();
                        var eyeY = cy - 4 + bobY;

                        // Blush
                        this.drawBlush(st.blushAlpha || 0, st.blushRadius || 6);

                        // Eyebrows
                        var browY = eyeY - 6 + (st.browY || 0) + bobY;
                        this.drawEyebrow(cx - 7.5, browY, -st.browAngle, 0);
                        this.drawEyebrow(cx + 7.5, browY, st.browAngle, 0);

                        // Eyes
                        var blinkClose = st.blinkState === 'closed' || st.blinkState === 'closing';
                        this.drawEye(cx - 7.5, eyeY, st.eyeLX, st.eyeLY, st.pupilDilate || 1, (st.winkLeft || blinkClose));
                        this.drawEye(cx + 7.5, eyeY, st.eyeRX, st.eyeRY, st.pupilDilate || 1, (st.winkRight || blinkClose));

                        ctx.restore();

                        // Mouth (not affected by head tilt for cleaner look)
                        this.drawMouth(st.mouthCurve || 0, st.mouthOpen || 0, st.mouthWidth || 1);

                        // Particles
                        if (st.tearFlow > 0.01) this.drawParticles(this.particles.tears, 'rgba(120,180,255,0.85)', 'tear');
                        if (st.sparkleCount > 0) this.drawParticles(this.particles.sparkles, 'rgba(255,255,200,0.9)', 'sparkle');
                        if (st.heartCount > 0) this.drawParticles(this.particles.hearts, 'rgba(255,140,170,0.85)', 'heart');
                        if (st.sweatCount > 0) this.drawParticles(this.particles.sweat, 'rgba(180,210,255,0.8)', null);
                        if (st.steamCount > 0) this.drawParticles(this.particles.steam, 'rgba(255,100,80,0.7)', 'steam');

                        // Scanlines on top
                        this.drawScanlines();
                    },

                    // ----- SKINNING: interpolate state toward emotion definition -----
                    applyEmotionDef: function(def, t) {
                        var st = this.state;
                        // Linear interpolate all params with easing
                        var ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t; // easeInOutQuad
                        if (def.brows !== undefined) st.browAngle += ((def.brows * 0.75) - st.browAngle) * ease * 0.18;
                        if (def.mouthCurve !== undefined) st.mouthCurve += (def.mouthCurve - st.mouthCurve) * ease * 0.2;
                        if (def.mouthOpen !== undefined) st.mouthOpen += (def.mouthOpen - st.mouthOpen) * ease * 0.22;
                        if (def.blush !== undefined) { st.blushAlpha += (def.blush - st.blushAlpha) * ease * 0.15; st.blushRadius = 5 + def.blush * 8; }
                        if (def.glow) {
                            st.glowIntensity += (def.glow[0] - st.glowIntensity) * ease * 0.12;
                            st.glowHue += (def.glow[1] - st.glowHue) * ease * 0.1;
                        }
                        // Handle wink
                        if (this.currentEmotion === 'wink') st.winkLeft = true;
                        else st.winkLeft = false;
                        st.winkRight = false;
                        // Handle eyelid for sleep
                        if (this.currentEmotion === 'sleep') { st.blinkState = 'closed'; }
                    },

                    // ----- TICK: animation frame -----
                    tick: function(timestamp) {
                        if (!this.active || !this.canvas) return;

                        var dt = Math.min(0.1, ((timestamp - (this._lastTick || timestamp)) / 1000) || 0.016);
                        this._lastTick = timestamp;

                        // ---- BLINK LOGIC ----
                        if (!this._nextBlink) this._nextBlink = timestamp + 1800 + Math.random() * 3000;
                        var bs = this.state.blinkState;
                        if (bs === 'open' && timestamp > this._nextBlink) {
                            this.state.blinkState = 'closing'; this._blinkAt = timestamp;
                            this._nextBlink = timestamp + 1800 + Math.random() * 3000;
                        } else if (bs === 'closing' && timestamp - this._blinkAt > 50) {
                            this.state.blinkState = 'closed';
                        } else if (bs === 'closed' && timestamp - this._blinkAt > 90) {
                            this.state.blinkState = 'opening';
                        } else if (bs === 'opening' && timestamp - this._blinkAt > 50) {
                            this.state.blinkState = 'open';
                        }
                        // Sleep overrides blink
                        if (this.currentEmotion === 'sleep') this.state.blinkState = 'closed';

                        // ---- EMOTION TRANSITION ----
                        if (this.targetEmotion !== this.currentEmotion) {
                            this.transitionT = Math.min(1, (this.transitionT || 0) + dt * 3.5);
                            if (this.transitionT >= 1) {
                                this.currentEmotion = this.targetEmotion;
                                this.transitionT = 0;
                            }
                        }

                        // ---- APPLY CURRENT EMOTION DEF ----
                        var curDef = this.emotionDefs[this.currentEmotion] || this.emotionDefs.neutral;
                        this.applyEmotionDef(curDef, this.transitionT < 0.3 ? this.transitionT / 0.3 : 1);

                        // ---- IDLE ANIMATION ----
                        this.state.idleTimer += dt;
                        if (this.state.idleTimer > 2.5 + Math.random() * 0.5) {
                            this.state.idleTimer = 0;
                            this.state.idleLookX = (Math.random() - 0.5) * 1.4;
                            this.state.idleLookY = (Math.random() - 0.5) * 0.8;
                        }
                        // Smooth idle look
                        this.state.idleLookX += (0 - this.state.idleLookX) * dt * 0.4;
                        this.state.idleLookY += (0 - this.state.idleLookY) * dt * 0.4;

                        // ---- EYE TRACKING ----
                        var lookX = this.state.idleLookX || 0;
                        var lookY = this.state.idleLookY || 0;
                        if (window._lastMouseX !== undefined) {
                            var avatar = document.getElementById('aether-chat-avatar');
                            if (avatar) {
                                var rect = avatar.getBoundingClientRect();
                                var dx = (window._lastMouseX - (rect.left + rect.width/2)) / (rect.width * 0.5);
                                var dy = (window._lastMouseY - (rect.top + rect.height/2)) / (rect.height * 0.5);
                                lookX += Math.max(-1, Math.min(1, dx));
                                lookY += Math.max(-1, Math.min(1, dy));
                            }
                        }
                        this.state.eyeLX += (lookX - this.state.eyeLX) * dt * 8;
                        this.state.eyeLY += (lookY - this.state.eyeLY) * dt * 8;
                        this.state.eyeRX += (lookX - this.state.eyeRX) * dt * 8;
                        this.state.eyeRY += (lookY - this.state.eyeRY) * dt * 8;

                        // ---- PUPIL DILATION ----
                        this.state.pupilDilate += (1 - this.state.pupilDilate) * dt * 3;

                        // ---- HEAD BOB ----
                        this.state.headBob = Math.sin(timestamp * 0.003) * 0.4;
                        this.state.headTilt += (Math.sin(timestamp * 0.0017) * 0.12 - this.state.headTilt) * dt * 1.5;

                        // ---- PARTICLES ----
                        var cx = this.cx(), cy = this.cy();
                        // Tears
                        if (this.currentEmotion === 'sad' && Math.random() < 0.08) {
                            this.spawnParticle(this.particles.tears, cx - 6 + Math.random()*12, cy - 2, (Math.random()-0.5)*0.3, 0.4+Math.random()*0.5, 55+Math.random()*30, 2+Math.random()*2.5);
                        }
                        this.state.tearFlow += ((this.currentEmotion==='sad'?0.6:0) - this.state.tearFlow) * dt * 4;
                        // Sparkles
                        if (this.currentEmotion === 'excited' && Math.random() < 0.12) {
                            this.spawnParticle(this.particles.sparkles, cx + (Math.random()-0.5)*20, cy + (Math.random()-0.5)*20, (Math.random()-0.5)*0.4, (Math.random()-0.5)*0.4 - 0.3, 30+Math.random()*25, 1.5+Math.random()*3);
                        }
                        this.state.sparkleCount += ((this.currentEmotion==='excited'||this.currentEmotion==='surprised'?1:0) - this.state.sparkleCount) * dt * 5;
                        // Hearts
                        if (this.currentEmotion === 'happy2' && Math.random() < 0.06) {
                            this.spawnParticle(this.particles.hearts, cx + (Math.random()-0.5)*16, cy - 6 + Math.random()*8, (Math.random()-0.5)*0.3, -0.5-Math.random()*0.6, 45+Math.random()*25, 2.5+Math.random()*2);
                        }
                        this.state.heartCount += ((this.currentEmotion==='happy2'?1:0) - this.state.heartCount) * dt * 5;
                        // Sweat
                        if (this.currentEmotion === 'dizzy' && Math.random() < 0.07) {
                            this.spawnParticle(this.particles.sweat, cx + (Math.random()-0.5)*18, cy - 8 + Math.random()*4, (Math.random()-0.5)*0.25, 0.2+Math.random()*0.4, 35+Math.random()*20, 1.5+Math.random()*2);
                        }
                        this.state.sweatCount += ((this.currentEmotion==='dizzy'?1:0) - this.state.sweatCount) * dt * 5;
                        // Steam
                        if (this.currentEmotion === 'angry' && Math.random() < 0.1) {
                            this.spawnParticle(this.particles.steam, cx + (Math.random()-0.5)*16, cy - 4, (Math.random()-0.5)*0.3, -0.5-Math.random()*0.6, 35+Math.random()*25, 2+Math.random()*3);
                        }
                        this.state.steamCount += ((this.currentEmotion==='angry'?1:0) - this.state.steamCount) * dt * 5;

                        // Tick all particle pools
                        this.tickParticles(this.particles.tears, dt);
                        this.tickParticles(this.particles.sparkles, dt);
                        this.tickParticles(this.particles.hearts, dt);
                        this.tickParticles(this.particles.sweat, dt);
                        this.tickParticles(this.particles.steam, dt);

                        // ---- BOOTUP SPECIAL ----
                        if (this.currentEmotion === 'bootup') {
                            var phase = (timestamp % 1800) / 1800;
                            if (phase < 0.25) this.state.blinkState = 'closed';
                            else if (phase < 0.5) this.state.blinkState = 'open';
                            else if (phase < 0.65) this.state.blinkState = 'closed';
                            else this.state.blinkState = 'open';
                            this.state.glowIntensity = 0.08 + Math.sin(phase * Math.PI * 3) * 0.22;
                        }

                        // ---- RENDER ----
                        this.render(timestamp);

                        this.animFrame = requestAnimationFrame(function(t) { os.emoFaceEngine.tick(t); });
                    },

                    setEmotion: function(emotion) {
                        if (!emotion) return;
                        var emoMap = {
                            'smile': 'happy', 'laugh': 'happy2', 'cry': 'sad',
                            'wave': 'happy', 'dance': 'excited', 'wink': 'wink',
                            'confused': 'dizzy', 'angry': 'angry', 'sleep': 'sleep',
                            'surprised': 'surprised'
                        };
                        this.targetEmotion = emoMap[emotion] || emotion || 'neutral';
                        this.transitionT = 0;
                    },

                    start: function() {
                        if (!this.canvas) return;
                        if (this.animFrame) cancelAnimationFrame(this.animFrame);
                        this.active = true;
                        this.canvas.classList.remove('hidden');
                        var gifEl = document.getElementById('aether-avatar-gif');
                        if (gifEl) { gifEl.classList.add('hidden'); gifEl.src = ''; }
                        var eyesContainer = this.canvas.parentElement ? this.canvas.parentElement.querySelector('[class*="gap-1"]') : null;
                        if (eyesContainer) eyesContainer.style.display = 'none';
                        this._lastTick = performance.now();
                        var self = this;
                        this.animFrame = requestAnimationFrame(function(t) { self.tick(t); });
                    },

                    stop: function() {
                        this.active = false;
                        if (this.animFrame) { cancelAnimationFrame(this.animFrame); this.animFrame = null; }
                        if (this.canvas) this.canvas.classList.add('hidden');
                        var eyesContainer = this.canvas && this.canvas.parentElement ? this.canvas.parentElement.querySelector('[class*="gap-1"]') : null;
                        if (eyesContainer) eyesContainer.style.display = '';
                    }
                };
                os.emoFaceEngine.init();
            },

    companion: {
                initialized: false,
                lastActivity: Date.now(),
                isAfk: false,
                emotionTimer: null,

                getEmotionFromText: function(text) {
                    const t = String(text || '').toLowerCase();
                    if (t.includes('failed') || t.includes('error') || t.includes('unable') || t.includes('offline') || t.includes('danger') || t.includes('warn') || t.includes('refused')) return 'cry';
                    if (t.includes('joke') || t.includes('laugh') || t.includes('funny') || t.includes('humor')) return 'laugh';
                    if (t.includes('music') || t.includes('song') || t.includes('radio') || t.includes('tuner') || t.includes('plaza') || t.includes('discover')) return 'dance';
                    if (t.includes('welcome') || t.includes('hello') || t.includes('hi ') || t.includes('greetings')) return 'wave';
                    if (t.includes('success') || t.includes('loaded') || t.includes('completed') || t.includes('done') || t.includes('good') || t.includes('excellent')) return 'smile';
                    if (t.includes('entropy') || t.includes('fact') || t.includes('did you know') || t.includes('consistent') || t.includes('taste')) return 'wink';
                    if (t.includes('who is') || t.includes('what is') || t.includes('define') || t.includes('unknown') || t.includes('commands') || t.includes('question') || t.includes('suspicious') || t.includes('choice') || t.includes('degrading')) return 'confused';
                    return 'smile'; // default
                },

                triggerAvatarEmotion: function(emotion) {
                    // The island face is CSS-animated locally; do not fetch GIFs
                    // or start a hidden OLED renderer behind its conversation.
                    if (document.getElementById('aether-island')) return;
                    // Emo OLED Face mode
                    if (os.companionEmotionMode && os.companionEmotionMode() === 'emo') {
                        if (!os.emoFaceEngine) os.initEmoFace();
                        if (os.emoFaceEngine) {
                            os.emoFaceEngine.setEmotion(emotion);
                            if (!os.emoFaceEngine.active) os.emoFaceEngine.start();
                        }
                        return;
                    }
                    // Original GIF Reaction mode
                    const gifEl = document.getElementById('aether-avatar-gif');
                    if (!gifEl) return;
                    
                    if (os.companionFetchReaction) {
                        os.companionFetchReaction(emotion)
                            .then(media => {
                                if (media && media.url) {
                                    gifEl.src = media.url;
                                    gifEl.classList.remove('hidden');
                                    // Hide Emo face when GIF is active
                                    if (os.emoFaceEngine && os.emoFaceEngine.active) os.emoFaceEngine.stop();
                                    
                                    clearTimeout(os.companion.emotionTimer);
                                    os.companion.emotionTimer = setTimeout(() => {
                                        gifEl.classList.add('hidden');
                                        gifEl.src = '';
                                    }, 8000);
                                }
                            })
                            .catch(() => {
                                gifEl.classList.add('hidden');
                            });
                    }
                },
                afkNotifiedAt: 0,
                lastQuipAt: 0,
                lastReturnAt: 0,
                greetDone: false,
                timer: null,

                // Persistent memory & observational state
                memory: {
                    radioHistory: {},
                    sessionsCount: 0,
                    totalCardsCreated: 0,
                    favStation: '',
                    wikiHours: 0
                },
                
                state: {
                    globalCooldown: 0,
                    spokenLines: {},
                    musicSeconds: 0,
                    musicTimer: null,
                    wikiboardCardCount: 0,
                    lastDiscordActivity: null,
                    lastDiscordStatus: null,
                    lastIssLoc: null,
                    openWindowsCount: 0
                },

                greetings: [
                    'Welcome back. AetherOS is online, polished, and pretending the internet is stable.',
                    'Good to see you. Systems are awake, telemetry is humming, and I have resisted touching your settings.',
                    'AetherOS online. I have warmed the circuits and lowered expectations for third party APIs.',
                    'Welcome. Your workstation is ready. I have organized the chaos into aesthetically pleasing chaos.',
                    'Presence detected. Restoring your session workspace.'
                ],
                afkLines: [
                    'You appear to be away. I will guard the pixels. Very bravely.',
                    'AFK detected. I have entered silent dramatic monitoring mode.',
                    'No input for a while. Either you are thinking deeply, or the chair has won.',
                    'I am still here. The cursor, however, has emotionally checked out.',
                    'Away mode engaged. I will keep the dashboards looking expensive.',
                    'User idle. I considered optimizing something, but decided not to start a revolution without approval.'
                ],
                returnLines: [
                    'Welcome back. I definitely did not miss you. The logs might disagree.',
                    'User presence restored. I have paused my solo career as a screensaver.',
                    'Back online. Nothing exploded. A surprisingly productive interval.',
                    'Welcome back. I kept the system alive and only judged your absence a little.',
                    'Input detected. Reassigning sarcasm budget to active assistance.'
                ],
                humorLines: [
                    'Tiny status note: everything is normal, which is always suspicious.',
                    'System humor packet: if an API fails in the forest, AetherOS still logs it dramatically.',
                    'Telemetry remains nominal. I have asked the particles to look busy.',
                    'Small update: the dock icons are behaving. For now.',
                    'Background thought: dark mode is not a theme, it is a lifestyle choice.'
                ],

                loadMemory: function() {
                    try {
                        const raw = localStorage.getItem('AetherOS_JarvisMemory');
                        if (raw) {
                            this.memory = JSON.parse(raw);
                        } else {
                            this.memory = { radioHistory: {}, sessionsCount: 0, totalCardsCreated: 0, favStation: '', wikiHours: 0 };
                        }
                        this.memory.sessionsCount = (this.memory.sessionsCount || 0) + 1;
                        this.saveMemory();
                    } catch(e) {
                        this.memory = { radioHistory: {}, sessionsCount: 1, totalCardsCreated: 0, favStation: '', wikiHours: 0 };
                    }
                },

                saveMemory: function() {
                    try {
                        localStorage.setItem('AetherOS_JarvisMemory', JSON.stringify(this.memory));
                    } catch(e) {}
                },

                speakWithCooldown: function(text, opts = {}) {
                    if (!os.companionEnabled()) return false;
                    const now = Date.now();
                    const force = opts.force || false;
                    
                    if (!force && now < this.state.globalCooldown) {
                        console.log(`Jarvis (Silent Observer): Cooldown active. Suppressed line: "${text}"`);
                        return false;
                    }

                    if (this.state.spokenLines[text] && !force) {
                        return false;
                    }

                    if (!force) {
                        this.state.globalCooldown = now + 90 * 1000; // 90 seconds cooldown between proactive lines
                        this.state.spokenLines[text] = true;
                    }

                    return os.companionSay(text, opts);
                },

                observeEvent: function(type, data) {
                    if (!os.companionEnabled()) return;
                    console.log(`Jarvis observing event [${type}]:`, data);
                    
                    const now = Date.now();
                    const hour = new Date().getHours();

                    if (type === 'window_open') {
                        const id = data.id;
                        const count = Object.values(SystemState.windows).filter(w => w.isOpen && !w.isMinimized).length;
                        this.state.openWindowsCount = count;

                        if (id === 'nasa') {
                            if (hour >= 19 || hour < 5) {
                                this.speakWithCooldown("Back to deep space tonight?", { priority: 2 });
                            } else {
                                this.speakWithCooldown("Interesting choice. Investigating deep space telemetry.", { priority: 1 });
                            }
                        } else if (id === 'wikiboard') {
                            this.speakWithCooldown("Interesting choice. What rabbit hole are we descending into today?", { priority: 1 });
                        } else if (id === 'terminal') {
                            this.speakWithCooldown("Data stream accessed. I'm keeping an eye on the telemetry in the background.", { priority: 1 });
                        } else if (id === 'weather') {
                            const tempDesc = (document.getElementById('topbar-weather-desc')?.innerText || '').toLowerCase();
                            const isClear = tempDesc.includes('clear') || tempDesc.includes('sunny') || tempDesc.includes('few clouds') || tempDesc.includes('fair');
                            if (isClear) {
                                this.speakWithCooldown("Weather conditions are ideal for ISS observation.", { priority: 2 });
                            } else {
                                this.speakWithCooldown("Opening Weather Station. Let's analyze the micro-climates.", { priority: 1 });
                            }
                        } else if (count > 6) {
                            this.speakWithCooldown("Performance is degrading slightly. Nothing serious.", { priority: 2 });
                        }
                    } 
                    
                    else if (type === 'radio_play' || type === 'media_play') {
                        const name = data.name || data.station || 'the stream';
                        this.memory.radioHistory[name] = (this.memory.radioHistory[name] || 0) + 1;
                        this.saveMemory();

                        const plays = this.memory.radioHistory[name];
                        if (plays >= 3) {
                            this.speakWithCooldown("That radio station again. Good taste.", { priority: 2 });
                        } else {
                            this.speakWithCooldown("Interesting choice.", { priority: 1 });
                        }

                        // Reset play seconds timer when a new stream is loaded
                        this.state.musicSeconds = 0;
                    } 
                    
                    else if (type === 'iss_telemetry') {
                        const loc = data.loc || 'International Waters';
                        const lastLoc = this.state.lastIssLoc;
                        this.state.lastIssLoc = loc;

                        if (lastLoc && lastLoc !== loc) {
                            this.speakWithCooldown(`ISS is currently passing over ${loc}. Trajectory is nominal.`, { priority: 1 });
                        }
                    } 
                    
                    else if (type === 'discord_presence') {
                        const status = data.discord_status;
                        const prevStatus = this.state.lastDiscordStatus;
                        this.state.lastDiscordStatus = status;

                        let activityName = null;
                        if (data.listening_to_spotify) {
                            activityName = "Spotify";
                        } else if (data.activities && data.activities.length > 0) {
                            const act = data.activities.find(a => a.type !== 4);
                            if (act) activityName = act.name;
                        }

                        const prevActivity = this.state.lastDiscordActivity;
                        this.state.lastDiscordActivity = activityName;

                        if (activityName && activityName !== prevActivity) {
                            if (activityName === 'Spotify') {
                                this.speakWithCooldown("Music starts, and I notice. Spotify feed synchronized.", { priority: 2 });
                            } else {
                                this.speakWithCooldown(`Discord activity change: ${activityName}. Consistent.`, { priority: 2 });
                            }
                        } else if (status === 'dnd' && prevStatus !== 'dnd') {
                            this.speakWithCooldown("Do Not Disturb. Wise choice. Peace is a premium feature.", { priority: 2 });
                        }
                    } 
                    
                    else if (type === 'wikiboard_create_card') {
                        this.state.wikiboardCardCount++;
                        this.memory.totalCardsCreated = (this.memory.totalCardsCreated || 0) + 1;
                        this.saveMemory();

                        if (data.type === 'wiki') {
                            this.speakWithCooldown(`Ah, investigating ${data.title || 'Wikipedia'}. Stray thoughts are becoming blueprints.`, { priority: 1 });
                        }

                        if (this.state.wikiboardCardCount === 5) {
                            this.speakWithCooldown("You've spent a lot of time researching on WikiBoard. An intricate web of ideas.", { priority: 2 });
                        }
                    }
                    
                    else if (type === 'window_close') {
                        const count = Object.values(SystemState.windows).filter(w => w.isOpen && !w.isMinimized).length;
                        this.state.openWindowsCount = count;
                        if (count === 0) {
                            this.speakWithCooldown("All windows closed. The desktop is... eerily quiet.", { priority: 1 });
                        }
                        if (data.id === 'nasa') {
                            this.speakWithCooldown("NASA explorer closed. Deep space telemetry offline.", { priority: 1 });
                        } else if (data.id === 'wikiboard') {
                            this.speakWithCooldown("WikiBoard closed. The rabbit hole has been sealed.", { priority: 1 });
                        } else if (data.id === 'terminal') {
                            this.speakWithCooldown("Data stream terminated. Telemetry ceasing.", { priority: 1 });
                        } else if (data.id === 'games') {
                            this.speakWithCooldown("Game session concluded. Returning to productive operations.", { priority: 1 });
                        } else if (data.id === 'memes') {
                            this.speakWithCooldown("Meme console closed. Sanity levels stabilizing.", { priority: 1 });
                        }
                    }
                    
                    else if (type === 'window_minimize') {
                        const minimizedCount = Object.values(SystemState.windows).filter(w => w.isOpen && w.isMinimized).length;
                        if (minimizedCount >= 3) {
                            this.speakWithCooldown(`Three windows minimized. You are building a skyline down there.`, { priority: 2 });
                        } else if (data.id === 'settings') {
                            this.speakWithCooldown("Settings minimized. Configuration changes are pending your approval.", { priority: 1 });
                        } else if (data.id === 'browser') {
                            this.speakWithCooldown("Browser tucked away. The internet will wait.", { priority: 1 });
                        } else if (data.id === 'terminal') {
                            this.speakWithCooldown("Terminal minimized. Background processes continue uninterrupted.", { priority: 1 });
                        } else if (data.id === 'winamp' || data.id === 'radiobrowser') {
                            this.speakWithCooldown("Media player minimized. The soundtrack continues in the shadows.", { priority: 1 });
                        }
                    }
                    
                    else if (type === 'window_restore') {
                        if (data.id === 'settings') {
                            this.speakWithCooldown("Settings restored. Tweaking the universe again?", { priority: 1 });
                        } else if (data.id === 'memes') {
                            this.speakWithCooldown("Meme console restored. I was starting to worry about your serotonin levels.", { priority: 1 });
                        } else if (data.id === 'games') {
                            this.speakWithCooldown("Game vault reopened. Productivity is officially on pause.", { priority: 1 });
                        } else if (data.id === 'nasa') {
                            this.speakWithCooldown("Deep space telemetry restored. Welcome back to the cosmos.", { priority: 1 });
                        }
                    }
                    
                    else if (type === 'theme_change') {
                        const theme = data.theme || 'midnight';
                        if (theme === 'aurora') {
                            this.speakWithCooldown("Aurora theme activated. Atmospheric conditions: optimal for creativity.", { priority: 1 });
                        } else if (theme === 'synthwave') {
                            this.speakWithCooldown("Synthwave engaged. The grid is listening. Neon intensity: maximum.", { priority: 1 });
                        } else if (theme === 'ember') {
                            this.speakWithCooldown("Ember theme deployed. Thermal readings: elevated. Proceed with caution.", { priority: 1 });
                        } else if (theme === 'ice') {
                            this.speakWithCooldown("Ice theme crystallized. Operation temperatures: frosty. Focus should improve.", { priority: 1 });
                        } else if (theme === 'rose') {
                            this.speakWithCooldown("Rose theme blooming. Sentiment analysis: unexpectedly soft. Proceeding.", { priority: 1 });
                        } else if (theme === 'midnight') {
                            this.speakWithCooldown("Midnight restored. The baseline darkness returns. Comforting, isn't it?", { priority: 1 });
                        }
                    }
                    
                    else if (type === 'dock_preview_hover') {
                        // Too spammy — silent observation only
                    }
                }
            },

    companionEnabled: () => SystemState.settings.speech_companion !== 'off',

    companionEmotionMode: () => SystemState.settings.companion_emotion_mode || 'gif',

    companionPick: (arr) => arr[Math.floor(Math.random() * arr.length)],

    companionSay: (line, opts = {}) => {
                if (!os.companionEnabled() && !opts.force) return false;
                const text = String(line || '').trim();
                if (!text) return false;
                if (!opts.noToast && window.Notifications) Notifications.push('AETHER COMPANION', text);
                else os.logTerminal && os.logTerminal(`Aether Companion: ${text}`);
                if (SystemState.settings.speech_synthesis === 'on') {
                    os.speak(text, { force: !!opts.force, interrupt: opts.interrupt !== false, minGap: opts.minGap || 9000, rate: opts.rate || 0.91, pitch: opts.pitch || 0.84, volume: opts.volume ?? 0.82 });
                }
                
                // Emote visually whenever Jarvis speaks proactively
                if (os.companion && os.companion.getEmotionFromText && os.companion.triggerAvatarEmotion) {
                    const emotion = os.companion.getEmotionFromText(text);
                    os.companion.triggerAvatarEmotion(emotion);
                }
                return true;
            },

    initCompanion: () => {
                if (os.companion.initialized) return;
                os.companion.initialized = true;
                os.companion.loadMemory();
                const markActive = () => os.companionHandleActivity();
                ['mousemove','mousedown','keydown','touchstart','wheel','pointerdown'].forEach(evt => {
                    window.addEventListener(evt, markActive, { passive: true });
                });

                // Digital Eyes look-at-cursor interaction
                window.addEventListener('mousemove', (e) => {
                    window._lastMouseX = e.clientX;
                    window._lastMouseY = e.clientY;
                    const avatar = document.getElementById('aether-chat-avatar');
                    if (!avatar) return;
                    const r = avatar.getBoundingClientRect();
                    const cx = r.left + r.width / 2;
                    const cy = r.top + r.height / 2;
                    const dx = e.clientX - cx;
                    const dy = e.clientY - cy;
                    const dist = Math.hypot(dx, dy);
                    
                    const maxShift = 3.2; // significantly larger translation for dramatic tracking
                    const angle = Math.atan2(dy, dx);
                    const shiftX = Math.cos(angle) * Math.min(maxShift, dist * 0.04);
                    const shiftY = Math.sin(angle) * Math.min(maxShift, dist * 0.04);
                    
                    const p1 = document.getElementById('aether-eye-left');
                    const p2 = document.getElementById('aether-eye-right');
                    if (p1) p1.style.transform = `translate(${shiftX}px, ${shiftY}px)`;
                    if (p2) p2.style.transform = `translate(${shiftX}px, ${shiftY}px)`;
                }, { passive: true });
                os.companion.timer = setInterval(() => os.companionTick(), 10000);
                // Initialize Emo OLED face if mode is set to emo
                if (os.companionEmotionMode && os.companionEmotionMode() === 'emo') {
                    setTimeout(() => {
                        if (!os.emoFaceEngine) os.initEmoFace();
                        if (os.emoFaceEngine) os.emoFaceEngine.start();
                    }, 1200);
                }
                setTimeout(() => {
                    if (!os.companionEnabled() || os.companion.greetDone) return;
                    os.companion.greetDone = true;
                    
                    const hour = new Date().getHours();
                    let greetingLine = "";
                    if (hour >= 19 || hour < 5) {
                        greetingLine = "Back to deep space tonight?";
                    } else if (os.companion.memory.sessionsCount > 1) {
                        greetingLine = "You always seem to end up back here.";
                    } else {
                        greetingLine = os.companionPick(os.companion.greetings);
                    }
                    os.companionSay(greetingLine, { minGap: 0 });
                }, 5200);
            },

    companionHandleActivity: () => {
                const now = Date.now();
                const wasAfk = os.companion.isAfk;
                os.companion.lastActivity = now;
                if (wasAfk) {
                    os.companion.isAfk = false;
                    if (os.companionEnabled() && now - (os.companion.lastReturnAt || 0) > 45000) {
                        os.companion.lastReturnAt = now;
                        os.companion.speakWithCooldown(os.companionPick(os.companion.returnLines), { minGap: 0, force: true });
                    }
                }
            },

    companionTick: () => {
                if (!os.companionEnabled() || document.hidden) return;
                const now = Date.now();
                
                // Continuous play check
                const isPlaying = os.audioStream && !os.audioStream.paused && os.audioStream.src;
                if (isPlaying) {
                    os.companion.state.musicSeconds = (os.companion.state.musicSeconds || 0) + 10;
                    if (os.companion.state.musicSeconds === 120) {
                        const activeStation = SystemState.settings.media_tuner_station;
                        const stationName = activeStation === 'external' ? (os._rbNowPlaying?.name || 'Radio') : activeStation;
                        os.companion.speakWithCooldown(`Three hours of ${stationName}. Consistent.`, { priority: 2 });
                    }
                }

                const timeout = Math.max(45, Number(SystemState.settings.speech_afk_timeout || 90)) * 1000;
                const idleFor = now - (os.companion.lastActivity || now);
                if (idleFor >= timeout) {
                    if (!os.companion.isAfk) {
                        os.companion.isAfk = true;
                        os.companion.afkNotifiedAt = now;
                        os.companionSay(os.companionPick(os.companion.afkLines), { minGap: 0 });
                    } else if (now - (os.companion.lastQuipAt || 0) > 10 * 60 * 1000) {
                        os.companion.lastQuipAt = now;
                        os.companionSay(os.companionPick(os.companion.humorLines), { minGap: 0 });
                    }
                }
            },

    companionLocalFallback: {
                jokes: [
                    'I told my CPU a joke. It needed a few cycles to process it.',
                    'Why did the API break up with the frontend? Too many unresolved promises.',
                    'I tried to make a UDP joke, but you might not get it.',
                    'Debugging is like being a detective in a crime movie where you are also the murderer.'
                ],
                facts: [
                    'Octopuses have three hearts and still refuse to answer emails faster than humans.',
                    'Honey never really spoils. Archaeologists have found edible honey in ancient tombs.',
                    'Bananas are berries, but strawberries are not. Botany enjoys chaos.',
                    'The first computer bug was an actual moth found in a relay in 1947.'
                ],
                advice: [
                    'Drink water, save your work, and do not trust a single tab with your entire personality.',
                    'If it takes less than two minutes, do it now. If it takes more, open a module and look tactical.',
                    'Back up before you experiment. Future you is watching with folded arms.',
                    'When stuck, reduce the problem until it looks embarrassed.'
                ],
                quotes: [
                    '“The important thing is not to stop questioning.” — Albert Einstein',
                    '“Simplicity is the ultimate sophistication.” — Leonardo da Vinci',
                    '“Programs must be written for people to read.” — Harold Abelson',
                    '“The future is already here — it is just not evenly distributed.” — William Gibson'
                ]
            },

    companionChatQuick: (text) => {
                const input = document.getElementById('companion-chat-input');
                if (input) input.value = text;
                os.companionChatSend();
            },

    companionChatClear: () => {
                const log = document.getElementById('companion-chat-log');
                if (log) log.innerHTML = '<div class="text-gray-500 leading-relaxed"><span class="text-os-accent">AETHER:</span> Memory cleared. Very therapeutic.</div>';
            },

    companionChatAppend: (who, text, tone='normal', media=null) => {
                const log = document.getElementById('companion-chat-log');
                if (!log) return;
                const row = document.createElement('div');
                const isUser = who === 'YOU';
                const toneClass = tone === 'warn' ? 'text-yellow-300' : tone === 'good' ? 'text-green-300' : tone === 'bad' ? 'text-red-300' : isUser ? 'text-white' : 'text-gray-300';
                const safe = os._html ? os._html(text) : String(text).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
                const mediaHtml = media && media.url ? `<div class="aether-chat-media"><img src="${os._html ? os._html(media.url) : media.url}" alt="reaction" loading="lazy"><div class="cap">${os._html ? os._html(media.label || 'reaction') : (media.label || 'reaction')}</div></div>` : '';
                row.className = `leading-relaxed break-words ${toneClass}`;
                row.innerHTML = `<span class="${isUser ? 'text-blue-300' : 'text-os-accent'}">${who}:</span> ${safe}${mediaHtml}`;
                log.appendChild(row);
                while (log.children.length > 22) log.firstChild.remove();
                log.scrollTop = log.scrollHeight;
            },

    ttsViz: { raf: null, active: false, energy: 0, words: [], charIndex: 0, wordIndex: 0, startedAt: 0, textHash: 1 },

    _chatBars: () => Array.from(document.querySelectorAll('#aether-voice-bars span')),

    companionSetThinking: (on=true) => {
                const wrap = document.getElementById('aether-voice-bars');
                const bars = os._chatBars ? os._chatBars() : [];
                if (!wrap) return;
                wrap.classList.toggle('thinking', !!on);
                if (on) {
                    wrap.classList.add('active');
                    bars.forEach((b,i) => { b.style.height = (4 + ((i * 5) % 11)) + 'px'; b.style.opacity = '.9'; });
                } else if (!os.ttsViz?.active) {
                    wrap.classList.remove('active', 'thinking');
                    bars.forEach(b => { b.style.height = '3px'; b.style.opacity = '.45'; });
                }
            },

    startTTSVisualizer: (text='') => {
                const wrap = document.getElementById('aether-voice-bars');
                const bars = os._chatBars ? os._chatBars() : [];
                if (!wrap || !bars.length) return;
                if (os.ttsViz?.raf) cancelAnimationFrame(os.ttsViz.raf);
                const words = String(text || '').split(/\s+/).filter(Boolean);
                const hash = Array.from(String(text || 'aether')).reduce((a,c)=>((a*31 + c.charCodeAt(0)) % 9973), 7);
                os.ttsViz = { raf:null, active:true, energy:.35, words, charIndex:0, wordIndex:0, startedAt:performance.now(), textHash:hash, currentWord:words[0] || 'aether' };
                wrap.classList.add('active');
                wrap.classList.remove('thinking');
                const loop = (now) => {
                    const v = os.ttsViz;
                    if (!v || !v.active) return;
                    // If boundary events are unavailable, advance through words based on elapsed time.
                    const elapsed = now - v.startedAt;
                    const fallbackIdx = Math.min(v.words.length - 1, Math.floor(elapsed / 330));
                    if (fallbackIdx > (v.wordIndex || 0)) {
                        v.wordIndex = fallbackIdx;
                        v.currentWord = v.words[fallbackIdx] || v.currentWord;
                        os.pulseTTSVisualizer(v.currentWord, 0.55);
                    }
                    v.energy = Math.max(0.08, (v.energy || 0) * 0.91);
                    const word = v.currentWord || 'aether';
                    const codes = Array.from(word).map(c => c.charCodeAt(0));
                    bars.forEach((bar, i) => {
                        const code = codes[i % Math.max(1, codes.length)] || (v.textHash + i * 17);
                        const syllable = /[aeiou]/i.test(String.fromCharCode(code)) ? 1.15 : 0.82;
                        const wave = 0.72 + 0.28 * Math.sin(now * 0.018 + i * 1.73 + v.textHash * 0.01);
                        const consonantPunch = 0.65 + ((code % 11) / 10);
                        const h = Math.max(3, Math.min(18, 3 + v.energy * 13 * wave * syllable * consonantPunch));
                        bar.style.height = h.toFixed(1) + 'px';
                        bar.style.opacity = String(Math.max(.38, Math.min(1, .35 + v.energy)));
                    });
                    v.raf = requestAnimationFrame(loop);
                };
                os.ttsViz.raf = requestAnimationFrame(loop);
            },

    pulseTTSVisualizer: (word='', boost=0.92) => {
                if (!os.ttsViz) return;
                const w = String(word || '').trim() || 'aether';
                const vowels = (w.match(/[aeiou]/gi) || []).length;
                const consonants = (w.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length;
                const punctuation = /[!?.,:;]/.test(w) ? .12 : 0;
                os.ttsViz.currentWord = w;
                os.ttsViz.energy = Math.max(os.ttsViz.energy || 0, Math.min(1.15, boost + vowels * .055 + consonants * .028 + punctuation));
            },

    stopTTSVisualizer: () => {
                const wrap = document.getElementById('aether-voice-bars');
                const bars = os._chatBars ? os._chatBars() : [];
                if (os.ttsViz?.raf) cancelAnimationFrame(os.ttsViz.raf);
                if (os.ttsViz) os.ttsViz.active = false;
                if (wrap) wrap.classList.remove('active', 'thinking');
                bars.forEach((b, i) => { b.style.height = '3px'; b.style.opacity = '.45'; });
            },

    updateChatVoiceViz: (active=false) => {
                if (active) os.startTTSVisualizer('voice activity');
                else os.stopTTSVisualizer();
            },

    companionChatSend: () => {
                const input = document.getElementById('companion-chat-input');
                if (!input) return;
                const msg = input.value.trim();
                if (!msg) return;
                input.value = '';
                os.companionChatAppend('YOU', msg);
                const log = document.getElementById('companion-chat-log');
                let pendingRow = null;
                if (log) {
                    pendingRow = document.createElement('div');
                    pendingRow.className = 'text-gray-600 leading-relaxed italic';
                    pendingRow.innerHTML = '<span class="text-os-accent">AETHER:</span> querying free public APIs...';
                    log.appendChild(pendingRow);
                    log.scrollTop = log.scrollHeight;
                }
                os.companionSetThinking(true);
                Promise.resolve(os.companionChatReply(msg)).then(reply => {
                    setTimeout(() => {
                        os.companionSetThinking(false);
                        if (pendingRow) pendingRow.remove();
                        os.companionChatAppend('AETHER', reply.text, reply.tone || 'normal', reply.media || null);
                        if (reply.speak !== false) os.speak(reply.speech || reply.text, { force: true, interrupt: true, rate: 0.91, pitch: 0.84, volume: 0.86 });
                        
                        // Emote visually on chat replies
                        if (os.companion && os.companion.getEmotionFromText && os.companion.triggerAvatarEmotion) {
                            const emotion = os.companion.getEmotionFromText(reply.text);
                            os.companion.triggerAvatarEmotion(emotion);
                        }
                    }, 180);
                }).catch(err => {
                    os.companionSetThinking(false);
                    if (pendingRow) pendingRow.remove();
                    const fallback = `API uplink failed: ${err.message || err}. ${os.companionPick(os.companionLocalFallback.advice)}`;
                    os.companionChatAppend('AETHER', fallback, 'warn');
                    os.speak(fallback, { force: true, interrupt: true });
                });
            },

    companionFetchJSON: async (urls, timeout=9000) => {
                const list = Array.isArray(urls) ? urls : [urls];
                let lastErr = null;
                for (const url of list) {
                    try {
                        const res = await fetch(url, { signal: AbortSignal.timeout(timeout), cache: 'no-store' });
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        return await res.json();
                    } catch(e) { lastErr = e; }
                }
                throw lastErr || new Error('all endpoints failed');
            },

    companionFetchText: async (urls, timeout=9000) => {
                const list = Array.isArray(urls) ? urls : [urls];
                let lastErr = null;
                for (const url of list) {
                    try {
                        const res = await fetch(url, { signal: AbortSignal.timeout(timeout), cache: 'no-store' });
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        return await res.text();
                    } catch(e) { lastErr = e; }
                }
                throw lastErr || new Error('all endpoints failed');
            },

    companionDecodeHtml: (s='') => String(s).replace(/&quot;/g,'"').replace(/&#039;|&#39;/g,"'").replace(/&amp;/g,'&').replace(/&eacute;/g,'é').replace(/&rsquo;/g,"'").replace(/&ldquo;|&rdquo;/g,'"'),

    companionHumanPrefix: () => os.companionPick ? os.companionPick([
                'Alright, I found this for you.',
                'Here you go — pulled from the public internet pipes.',
                'I checked. The answer is less dramatic than my loading animation, but useful.',
                'Got it. Tiny expedition complete.',
                'I have consulted the free API council.'
            ]) : 'Here you go.',

    companionReactionMap: {
                hug:'hug', pat:'pat', kiss:'kiss', wave:'wave', smile:'smile', laugh:'laugh', cry:'cry', sad:'sad', dance:'dance', happy:'happy', clap:'clap', facepalm:'facepalm', confused:'confused', sorry:'sorry', yes:'yes', no:'no', wink:'wink', sleep:'sleep', tired:'tired', scared:'scared', shy:'shy', blush:'blush', punch:'punch', slap:'slap', pout:'pout', smug:'smug', stare:'stare', thumbsup:'thumbsup', celebrate:'celebrate', cheers:'cheers', sing:'sing'
            },

    companionFetchReaction: async (reaction='hug') => {
                reaction = os.companionReactionMap[reaction] || reaction || 'hug';
                // 1) OtakuGIFs: purpose-built reaction GIFs.
                try {
                    const r = await fetch(`https://api.otakugifs.xyz/gif?reaction=${encodeURIComponent(reaction)}&format=gif`, { signal: AbortSignal.timeout(7000), cache:'no-store' });
                    if (!r.ok) throw new Error('otakugifs failed');
                    const j = await r.json();
                    if (j.url) return { url:j.url, label:`OtakuGIFs · ${reaction}` };
                } catch(e) {}
                // 2) Nekos API: anime image fallback. If the deployment blocks it, continue gracefully.
                try {
                    const tags = encodeURIComponent(reaction === 'cry' || reaction === 'sad' ? 'sad' : reaction);
                    const r = await fetch(`https://api.nekosapi.com/v4/images/random?limit=1&rating=safe&tags=${tags}`, { signal: AbortSignal.timeout(7000), cache:'no-store' });
                    if (!r.ok) throw new Error('nekosapi failed');
                    const j = await r.json();
                    const item = Array.isArray(j) ? j[0] : (j.items?.[0] || j.data?.[0] || j.results?.[0]);
                    const url = item?.url || item?.image_url || item?.file_url || item?.sample_url;
                    if (url) return { url, label:`Nekos API · ${reaction}` };
                } catch(e) {}
                // 3) Existing nekos.best endpoint fallback for browser-safe anime gifs.
                try {
                    const cat = ['hug','pat','kiss','wave','smile','laugh','cry','dance','happy','sleep'].includes(reaction) ? reaction : 'smile';
                    const r = await fetch(`https://nekos.best/api/v2/${encodeURIComponent(cat)}?amount=1`, { signal: AbortSignal.timeout(7000), cache:'no-store' });
                    if (!r.ok) throw new Error('nekos.best failed');
                    const j = await r.json();
                    const url = j.results?.[0]?.url;
                    if (url) return { url, label:`nekos.best · ${cat}` };
                } catch(e) {}
                throw new Error('reaction providers unavailable');
            },

    companionSignalUpdate: async () => {
                try { await os.fetchSignals(); } catch(e) {}
                const items = [];
                (os.signalFeed?.buffer || []).slice(0, 5).forEach(x => items.push(x));
                const dom = Array.from(document.querySelectorAll('#signal-stream-container > div')).slice(0, 5).map(el => ({
                    source: el.querySelector('.text-os-accent')?.textContent || 'Signal',
                    title: el.querySelector('.text-[11px]')?.textContent || el.textContent.trim().slice(0,120),
                    time: 'LIVE'
                }));
                if (!items.length) items.push(...dom);
                if (!items.length) return { text:'Global Signal Feed is quiet right now. Suspiciously peaceful.', speech:'Global Signal Feed is quiet right now.', tone:'warn' };
                const summary = items.slice(0,4).map((it,i)=>`${i+1}. ${it.source || 'Signal'}: ${it.title}`).join(' | ');
                return { text:`Global Signal Feed update: ${summary}`, speech:`Global Signal Feed update. ${items.slice(0,3).map(it=>`${it.source || 'Signal'}: ${it.title}`).join('. ')}`, tone:'good' };
            },

    companionFetchFreeInfo: async (kind, query='') => {
                const local = os.companionLocalFallback;
                const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
                const decode = os.companionDecodeHtml;
                try {
                    if (kind === 'joke') {
                        try {
                            const j = await os.companionFetchJSON(['https://official-joke-api.appspot.com/random_joke','https://v2.jokeapi.dev/joke/Any?safe-mode&type=twopart']);
                            if (j.setup && j.punchline) return { text: `${j.setup} — ${j.punchline} [source: Official Joke API]`, speech: `${j.setup}. ${j.punchline}`, tone:'good' };
                            if (j.setup && j.delivery) return { text: `${j.setup} — ${j.delivery} [source: JokeAPI]`, speech: `${j.setup}. ${j.delivery}`, tone:'good' };
                        } catch(e) {}
                        const c = await os.companionFetchJSON('https://api.chucknorris.io/jokes/random');
                        return { text: `${c.value} [source: Chuck Norris API]`, speech: c.value, tone:'good' };
                    }
                    if (kind === 'programming-joke') {
                        const j = await os.companionFetchJSON('https://v2.jokeapi.dev/joke/Programming?safe-mode&type=twopart');
                        return { text: `${j.setup} — ${j.delivery} [source: JokeAPI Programming]`, speech: `${j.setup}. ${j.delivery}`, tone:'good' };
                    }
                    if (kind === 'fact') {
                        const f = await os.companionFetchJSON('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en');
                        return { text: `${f.text} [source: Useless Facts API]`, speech: f.text, tone:'good' };
                    }
                    if (kind === 'cat') {
                        const f = await os.companionFetchJSON('https://catfact.ninja/fact');
                        return { text: `${f.fact} [source: catfact.ninja]`, speech: f.fact, tone:'good' };
                    }
                    if (kind === 'dog') {
                        const f = await os.companionFetchJSON('https://dogapi.dog/api/v2/facts?limit=1');
                        const body = f.data?.[0]?.attributes?.body || 'Dogs remain excellent. API details were less cooperative.';
                        return { text: `${body} [source: Dog API]`, speech: body, tone:'good' };
                    }
                    if (kind === 'number') {
                        const n = String(query || 'random').trim();
                        const path = n === 'random' ? 'random/trivia' : `${encodeURIComponent(n)}/trivia`;
                        const txt = await os.companionFetchText(`https://r.jina.ai/http://numbersapi.com/${path}`);
                        const clean = txt.replace(/^Title:.*\n+/i,'').replace(/^URL Source:.*\n+/i,'').trim().split('\n').filter(Boolean).pop() || txt.trim();
                        return { text: `${clean} [source: Numbers API via Jina]`, speech: clean, tone:'good' };
                    }
                    if (kind === 'advice') {
                        const a = await os.companionFetchJSON('https://api.adviceslip.com/advice?ts=' + Date.now());
                        return { text: `${a.slip?.advice || 'Advice unavailable.'} [source: Advice Slip]`, speech: a.slip?.advice || '', tone:'good' };
                    }
                    if (kind === 'activity') {
                        const b = await os.companionFetchJSON(['https://bored.api.lewagon.com/api/activity','https://www.boredapi.com/api/activity']);
                        return { text: `${b.activity} Type: ${b.type || 'general'}. Participants: ${b.participants || 1}. [source: Bored API]`, speech: `Suggestion. ${b.activity}`, tone:'good' };
                    }
                    if (kind === 'quote') {
                        try {
                            const q = await os.companionFetchJSON('https://api.quotable.io/random');
                            return { text: `“${q.content}” — ${q.author}. [source: Quotable]`, speech: `${q.content}. By ${q.author}.`, tone:'good' };
                        } catch(e) {
                            const z = await os.companionFetchJSON('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://zenquotes.io/api/random'));
                            const item = Array.isArray(z) ? z[0] : z;
                            return { text: `“${item.q}” — ${item.a}. [source: ZenQuotes via proxy]`, speech: `${item.q}. By ${item.a}.`, tone:'good' };
                        }
                    }
                    if (kind === 'trivia') {
                        const t = await os.companionFetchJSON('https://opentdb.com/api.php?amount=1&type=multiple');
                        const item = t.results?.[0];
                        if (!item) throw new Error('No trivia returned');
                        const ans = decode(item.correct_answer);
                        const question = decode(item.question);
                        return { text: `${question} Answer: ${ans}. [source: Open Trivia DB]`, speech: `${question}. The answer is ${ans}.`, tone:'good' };
                    }
                    if (kind === 'wiki') {
                        const term = String(query || '').trim();
                        if (!term) return { text:'Give me a topic, for example: wiki black holes.', speak:false };
                        const w = await os.companionFetchJSON('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(term));
                        if (w.type === 'disambiguation') return { text: `${w.title}: ${w.extract} Try a more specific topic. [source: Wikipedia]`, speech: w.extract, tone:'warn' };
                        return { text: `${w.title}: ${w.extract || 'No summary available.'} [source: Wikipedia]`, speech: `${w.title}. ${w.extract || ''}`, tone:'good' };
                    }
                    if (kind === 'dictionary') {
                        const word = String(query || '').trim().split(/\s+/)[0];
                        if (!word) return { text:'Give me a word, for example: define entropy.', speak:false };
                        const d = await os.companionFetchJSON('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(word));
                        const entry = Array.isArray(d) ? d[0] : d;
                        const meaning = entry.meanings?.[0];
                        const def = meaning?.definitions?.[0]?.definition || 'No definition returned.';
                        return { text: `${entry.word}: ${def} [${meaning?.partOfSpeech || 'definition'} · source: Free Dictionary API]`, speech: `${entry.word}. ${def}`, tone:'good' };
                    }
                    if (kind === 'crypto') {
                        const id = /eth|ethereum/.test(String(query).toLowerCase()) ? 'ethereum' : /doge/.test(String(query).toLowerCase()) ? 'dogecoin' : 'bitcoin';
                        const c = await os.companionFetchJSON(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`);
                        const price = c[id]?.usd;
                        const change = c[id]?.usd_24h_change;
                        return { text: `${id.toUpperCase()} is $${Number(price).toLocaleString()} USD, 24h change ${Number(change).toFixed(2)}%. [source: CoinGecko]`, speech: `${id} is ${Number(price).toLocaleString()} US dollars.`, tone: change >= 0 ? 'good' : 'warn' };
                    }
                    if (kind === 'nasa') {
                        const n = await os.companionFetchJSON('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
                        const text = `${n.title}: ${(n.explanation || '').slice(0, 280)}${(n.explanation || '').length > 280 ? '…' : ''} [source: NASA APOD]`;
                        return { text, speech: `${n.title}. ${(n.explanation || '').slice(0, 220)}`, tone:'good' };
                    }
                    if (kind === 'ip') {
                        const ip = await os.companionFetchJSON(['https://ipwho.is/','https://ipapi.co/json/']);
                        const city = ip.city || ip.region || 'unknown city';
                        const country = ip.country || ip.country_name || 'unknown country';
                        const addr = ip.ip || ip.query || 'masked';
                        return { text: `Public IP ${addr}. Approx route: ${city}, ${country}. [source: IP geolocation API]`, speech: `Approximate route is ${city}, ${country}.`, tone:'good' };
                    }
                    if (kind === 'hn') {
                        const ids = await os.companionFetchJSON('https://hacker-news.firebaseio.com/v0/topstories.json');
                        const item = await os.companionFetchJSON(`https://hacker-news.firebaseio.com/v0/item/${ids[0]}.json`);
                        return { text: `Top Hacker News: ${item.title}. Score ${item.score || 0}. [source: HN Firebase]`, speech: `Top Hacker News. ${item.title}.`, tone:'good' };
                    }
                    if (kind === 'animequote') {
                        try {
                            const q = await os.companionFetchJSON('https://api.animechan.io/v1/quotes/random');
                            const data = q.data || q;
                            return { text: `“${data.content || data.quote}” — ${data.character?.name || data.character || 'Unknown'} (${data.anime?.name || data.anime || 'Anime'}). [source: Animechan]`, speech: data.content || data.quote, tone:'good' };
                        } catch(e) {
                            const f = os.companionPick ? os.companionPick(['Hard work is worthless for those that do not believe in themselves. — Naruto', 'If you do not take risks, you cannot create a future. — Luffy']) : 'Believe it.';
                            return { text: `${f} [local fallback]`, speech: f, tone:'good' };
                        }
                    }
                } catch(e) {
                    if (kind === 'joke') return { text: `${pick(local.jokes)} [local fallback]`, speech: pick(local.jokes), tone:'warn' };
                    if (kind === 'fact' || kind === 'cat' || kind === 'dog' || kind === 'number') return { text: `${pick(local.facts)} [local fallback]`, speech: pick(local.facts), tone:'warn' };
                    if (kind === 'quote') return { text: `${pick(local.quotes)} [local fallback]`, speech: pick(local.quotes), tone:'warn' };
                    if (kind === 'advice' || kind === 'activity') return { text: `${pick(local.advice)} [local fallback]`, speech: pick(local.advice), tone:'warn' };
                    throw e;
                }
                throw new Error('Unknown info request');
            },

    companionChatReply: async (raw='') => {
                const msg = String(raw).trim();
                const q = msg.toLowerCase();
                const reactMatch = msg.match(/^(?:react|reaction|gif|anime gif)\s+([a-zA-Z]+)/i) || msg.match(/\b(airkiss|angrystare|bite|bleh|blush|brofist|celebrate|cheers|clap|confused|cool|cry|cuddle|dance|drool|evillaugh|facepalm|handhold|happy|headbang|hug|huh|kiss|laugh|lick|love|mad|nervous|no|nom|nosebleed|nuzzle|nyah|pat|peek|pinch|poke|pout|punch|roll|run|sad|scared|shout|shrug|shy|sigh|sing|sip|slap|sleep|slowclap|smack|smile|smug|sneeze|sorry|stare|stop|surprised|sweat|thumbsup|tickle|tired|wave|wink|woah|yawn|yay|yes)\b/i);
                if (reactMatch) {
                    const reaction = (reactMatch[1] || reactMatch[0]).toLowerCase();
                    try {
                        const media = await os.companionFetchReaction(reaction);
                        const human = os.companionPick ? os.companionPick([
                            'Here is a reaction that matches this moment.',
                            'I think this about sums up how I feel.',
                            'Here, let me express that visually.',
                            'This feels about right for what you just said.',
                            'A picture is worth a thousand words. Here you go.',
                            'Visualizing that sentiment right now.',
                            'Indeed. Here is a little reaction.',
                            'Here is how I would express that.',
                            'I found a reaction that matches.',
                            'This represents my exact thoughts on the matter.'
                        ]) : 'Here is a reaction.';
                        return { text: `${human} (${reaction})`, speech: human, tone:'good', media };
                    } catch(e) { return { text:`I tried to fetch a ${reaction} reaction, but the GIF gremlins refused.`, speech:`I tried to fetch a ${reaction} reaction, but the GIF providers failed.`, tone:'warn' }; }
                }
                if (/\b(global signal|signal feed|feed update|latest signals|news update)\b/i.test(q)) return await os.companionSignalUpdate();
                if (/\b(programming joke|dev joke|code joke)\b/.test(q)) return await os.companionFetchFreeInfo('programming-joke');
                if (/\b(joke|make me laugh|funny|chuck)\b/.test(q)) return await os.companionFetchFreeInfo('joke');
                if (/\b(cat fact|cat)\b/.test(q)) return await os.companionFetchFreeInfo('cat');
                if (/\b(dog fact|dog)\b/.test(q)) return await os.companionFetchFreeInfo('dog');
                const numberMatch = msg.match(/^(?:number|number fact)\s*(\d+)?/i);
                if (numberMatch) return await os.companionFetchFreeInfo('number', numberMatch[1] || 'random');
                if (/\b(random fact|fact|useless fact|did you know)\b/.test(q)) return await os.companionFetchFreeInfo('fact');
                if (/\b(advice|advise|what should i do)\b/.test(q)) return await os.companionFetchFreeInfo('advice');
                if (/\b(bored|activity|something to do|what to do)\b/.test(q)) return await os.companionFetchFreeInfo('activity');
                if (/\b(quote|inspire|motivate|motivation)\b/.test(q)) return await os.companionFetchFreeInfo('quote');
                if (/\b(trivia|quiz|question)\b/.test(q)) return await os.companionFetchFreeInfo('trivia');
                if (/\b(nasa|space|apod)\b/.test(q)) return await os.companionFetchFreeInfo('nasa');
                if (/\b(ip|my ip|location|route)\b/.test(q)) return await os.companionFetchFreeInfo('ip');
                if (/\b(hacker news|hn|top news)\b/.test(q)) return await os.companionFetchFreeInfo('hn');
                if (/\b(anime quote|anime line)\b/.test(q)) return await os.companionFetchFreeInfo('animequote');
                const cryptoMatch = msg.match(/\b(btc|bitcoin|eth|ethereum|doge|dogecoin|crypto)\b/i);
                if (cryptoMatch) return await os.companionFetchFreeInfo('crypto', cryptoMatch[0]);
                const dictMatch = msg.match(/^(?:define|dictionary|meaning of)\s+(.+)/i);
                if (dictMatch && dictMatch[1]) return await os.companionFetchFreeInfo('dictionary', dictMatch[1]);
                const wikiMatch = msg.match(/^(?:wiki|wikipedia|tell me about|what is|who is)\s+(.+)/i);
                if (wikiMatch && wikiMatch[1]) return await os.companionFetchFreeInfo('wiki', wikiMatch[1]);
                const cleanTell = msg.replace(/^(say|tell|repeat|speak|read)\s*[:,]?\s*/i, '').trim();
                if (/^(say|tell|repeat|speak|read)\b/i.test(msg) && cleanTell) {
                    return { text: `Of course. “${cleanTell}”`, speech: cleanTell, tone: 'good' };
                }
                if (/\b(time|clock)\b/.test(q)) {
                    const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    return { text: `Current local time is ${t}. Temporal dignity preserved.`, speech: `The time is ${t}.`, tone: 'good' };
                }
                if (/\b(date|today)\b/.test(q)) {
                    const d = new Date().toLocaleDateString([], { weekday:'long', year:'numeric', month:'long', day:'numeric' });
                    return { text: `Today is ${d}.`, speech: `Today is ${d}.`, tone: 'good' };
                }
                if (/\b(weather|temperature|temp)\b/.test(q)) {
                    const temp = document.getElementById('topbar-weather-temp')?.innerText || '--°C';
                    const desc = document.getElementById('topbar-weather-desc')?.innerText || 'unknown conditions';
                    return { text: `Weather reads ${temp}, ${desc}. For more drama, open Weather Station.`, speech: `Weather reads ${temp}, ${desc}.`, tone: 'good' };
                }
                if (/\b(awake|wake|nosleep|screen)\b/.test(q)) {
                    const state = document.getElementById('awake-state')?.innerText || 'OFF';
                    const mode = os.wakeLock?.mode || 'standby';
                    return { text: `Screen awake state: ${state}. Mode: ${mode}.`, speech: `Screen awake is ${state}.`, tone: state === 'ON' ? 'good' : 'warn' };
                }
                if (/\b(status|system|diagnostic|health)\b/.test(q)) {
                    const load = document.getElementById('sys-load')?.innerText || '--';
                    const open = Object.values(SystemState.windows || {}).filter(w => w.isOpen).length;
                    return { text: `System load ${load}. Open modules ${open}. Nothing is on fire, which is a premium feature.`, speech: `System load is ${load}. ${open} modules are open. Nothing is on fire.`, tone: 'good' };
                }
                if (/\b(open settings|settings)\b/.test(q)) { os.openWindow('settings'); return { text: 'Opening System Config. Try not to press the dramatic red buttons.', tone: 'good' }; }
                if (/\b(open weather)\b/.test(q)) { os.openWindow('weather'); return { text: 'Opening Weather Station.', tone: 'good' }; }
                if (/\b(open media|music|radio)\b/.test(q)) { os.openWindow(/radio/.test(q) ? 'radiobrowser' : 'media'); return { text: 'Opening audio systems.', tone: 'good' }; }
                if (/\b(help|commands|what can you do)\b/.test(q)) {
                    return { text: 'Try: joke, programming joke, fact, cat fact, dog fact, number 42, advice, activity, quote, trivia, nasa, btc, define entropy, wiki black holes, ip, hacker news, global signal update, react hug, react cry, anime quote, say hello, time, weather, status, awake, open settings.', speech: 'You can ask for jokes, facts, advice, quotes, trivia, global signal feed updates, anime reactions, Wikipedia summaries, dictionary definitions, crypto prices, NASA facts, IP route, time, weather, or tell me to say anything.', tone: 'good' };
                }
                const quips = [
                    `I hear you. If that was a feeling, I am filing it under: human, complicated, possibly under-caffeinated.`,
                    `Got it. I can pull jokes, facts, quotes, trivia, wiki summaries, definitions, crypto, NASA, signal feed updates, or anime reactions if you want.`,
                    `Understood. No paid cloud brain attached, but I do have public APIs, local memory, and excellent dramatic timing.`,
                    `I’m with you. If you want me to say it aloud, start with “say”. If you want a reaction, try “react hug” or “react cry”.`,
                    `Copy that. Tiny human-style note: you are doing fine, and the machine agrees enough not to argue.`,
                    `That sounds important. Do you want information, a joke, a quote, or one of those emotionally specific anime GIFs humans seem to enjoy?`
                ];
                return { text: quips[Math.floor(Math.random() * quips.length)], speak: false };
            }
});
