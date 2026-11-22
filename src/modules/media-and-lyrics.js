// AetherOS — Media Console, Audio Engine & BetterLyrics Sync
window.extendOS({
    setStation: (stationId) => {
                if (SystemState.settings.media_tuner_station === stationId) return;

                SystemState.settings.media_tuner_station = stationId;
                SystemState.save();
                
                // Halt active audio streams to prevent background overlapping
                if (os.audioStream && !os.audioStream.paused) {
                    os.audioStream.pause();
                    os.audioStream.src = '';
                    os.updatePlayStateVisuals(false);
                }
                
                os.stopFullTrackPlayback();
                
                // Halt Radio Browser if switching away
                os.stopRadioBrowser();

                os.logTerminal(`Tuner Core: Switched frequency path to target [${stationId.toUpperCase()}]`);
                os.renderMediaDashboard();
            },

    initAudioEngine: () => {
                if (!os.audioStream) {
                    os.audioStream = new Audio();
                    os.audioStream.crossOrigin = "anonymous"; 
                    os.audioStream.volume = SystemState.settings.media_tuner_volume;
                }
            },

    toggleAudioPlayback: () => {
                os.initAudioEngine();
                const activeStation = SystemState.settings.media_tuner_station;
                const streamUrls = {
                    plaza: 'https://radio.plaza.one/mp3'
                };

                const playBtn = document.getElementById('media-console-play-btn');
                const isIframePlaying = !!document.getElementById('media-full-player-iframe');
                const isAudioPlaying = os.audioStream && !os.audioStream.paused && os.audioStream.src;

                if (isIframePlaying || isAudioPlaying) {
                    // Stop whatever is playing
                    if (isAudioPlaying) {
                        os.audioStream.pause();
                        os.audioStream.src = '';
                    }
                    if (isIframePlaying) {
                        os.stopFullTrackPlayback();
                    }
                    os._playerUserPaused = true;
                    os.logTerminal("Tuner Core: Playback suspended.");
                    os.updatePlayStateVisuals(false);
                } else {
                    os._playerUserPaused = false;
                    os.stopRadioBrowser();
                    
                    // In PLAYER mode with LASTFM station, attempt full track playback
                    if (activeStation === 'lastfm' && SystemState.settings.media_player_mode === 'player') {
                        os.attemptFullTrackPlayback();
                        return;
                    }

                    const targetUrl = streamUrls[activeStation];
                    if (targetUrl) {
                        os.audioStream.src = targetUrl;
                        os.logTerminal(`Tuner Core: Initiated uplink audio handshakes with ${activeStation.toUpperCase()}`);
                        
                        os.audioStream.play()
                            .then(() => {
                                os.updatePlayStateVisuals(true);
                                if (os.companion && os.companion.observeEvent) {
                                    os.companion.observeEvent('media_play', { station: activeStation });
                                }
                                os.logTerminal("Tuner Core: Audio uplink synced successfully.");
                            })
                            .catch(err => {
                                os.logTerminal(`Tuner Core Audio Error: ${err.message}`);
                                os.updatePlayStateVisuals(false);
                            });
                    }
                }
            },

    updatePlayStateVisuals: (isPlaying) => {
                const playBtn = document.getElementById('media-console-play-btn');
                const coverArt = document.getElementById('media-art-cover');
                const spokes = document.getElementById('spinning-spokes');
                const led = document.getElementById('console-status-led');
                const miniIndicator = document.getElementById('mini-stream-indicator');
                
                // Also check if iframe player is active
                const isIframePlaying = !!document.getElementById('media-full-player-iframe');
                const actualPlaying = isPlaying || isIframePlaying;

                if (playBtn) {
                    playBtn.innerHTML = actualPlaying ? `<i data-lucide="pause" class="w-5 h-5 text-black"></i>` : `<i data-lucide="play" class="w-5 h-5 ml-1 text-black"></i>`;
                    lucide.createIcons({root: playBtn});
                }

                if (actualPlaying) {
                    if (led) led.className = "w-2 h-2 rounded-full bg-green-500 animate-pulse";
                    if (miniIndicator) miniIndicator.className = "w-2 h-2 rounded-full bg-green-500 animate-pulse";
                    if (coverArt) coverArt.className = "absolute inset-0 bg-cover bg-center opacity-40 spinning-reel-fast";
                    if (spokes) spokes.className = "absolute inset-6 rounded-full border border-white/5 spinning-reel-fast pointer-events-none";
                } else {
                    if (led) led.className = "w-2 h-2 rounded-full bg-yellow-500";
                    if (miniIndicator) miniIndicator.className = "w-2 h-2 rounded-full bg-yellow-500";
                    if (coverArt) coverArt.className = "absolute inset-0 bg-cover bg-center opacity-40 spinning-reel";
                    if (spokes) spokes.className = "absolute inset-6 rounded-full border border-white/5 spinning-reel pointer-events-none";
                }
            },

    adjustVolume: (vol) => {
                SystemState.settings.media_tuner_volume = parseFloat(vol);
                SystemState.save();
                
                if (os.audioStream) {
                    os.audioStream.volume = parseFloat(vol);
                }

                const dbLabel = document.getElementById('vol-db-readout');
                if (dbLabel) {
                    const dbValue = Math.round(20 * Math.log10(parseFloat(vol) || 0.001));
                    dbLabel.innerText = `${dbValue} dB`;
                }
            },

    setMediaPlayerMode: (mode) => {
                if (mode !== 'monitor' && mode !== 'player') return;
                const wasPlayer = SystemState.settings.media_player_mode === 'player';
                SystemState.settings.media_player_mode = mode;
                SystemState.save();
                os.logTerminal(`Media Core: Player mode switched to ${mode.toUpperCase()}.`);
                os._updateMediaModeButtons && os._updateMediaModeButtons();
                if (mode === 'player') {
                    os._pendingTrackPlayback = true;
                    os._playerUserPaused = false;
                    os.attemptFullTrackPlayback();
                } else {
                    os._pendingTrackPlayback = false;
                    os._playerUserPaused = false;
                    os.stopFullTrackPlayback();
                    if (os.audioStream && !os.audioStream.paused) {
                        try { os.audioStream.pause(); os.audioStream.src = ''; } catch(e){}
                    }
                }
            },

    _updateMediaModeButtons: () => {
                const panel = document.getElementById('media-console-panel');
                if (!panel) return;
                const btns = panel.querySelectorAll('button[onclick*="setMediaPlayerMode"]');
                btns.forEach(btn => {
                    const onclick = btn.getAttribute('onclick') || '';
                    const isMonitor = onclick.includes('monitor');
                    const isPlayer = onclick.includes('player');
                    const active = (isMonitor && SystemState.settings.media_player_mode === 'monitor') || (isPlayer && SystemState.settings.media_player_mode === 'player');
                    if (isMonitor) {
                        btn.className = active ? 'hover-target cursor-none text-white font-bold' : 'hover-target cursor-none text-gray-600 hover:text-white';
                    } else if (isPlayer) {
                        btn.className = active ? 'hover-target cursor-none text-green-400 font-bold' : 'hover-target cursor-none text-gray-600 hover:text-white';
                    }
                });
            },

    _pipedAudioCache: {},

    _currentTrackAudio: null,

    resolveVideoId: async (artist, title) => {
                const query = `${artist} ${title}`.replace(/\s+/g, ' ').trim();
                const cacheKey = `vid:${artist}\t${title}`.toLowerCase();
                if (os._videoIdCache && os._videoIdCache[cacheKey]) return os._videoIdCache[cacheKey];
                
                const searchQueries = [
                    `${artist} ${title} official audio`,
                    `${artist} ${title} audio`,
                    `${artist} ${title}`,
                    `${title} ${artist}`
                ];
                
                const invidiousInstances = ['https://invidious.fdn.fr','https://iv.nboeck.de','https://iv.datura.network','https://vid.puffyan.us','https://y.com.sb','https://iv.melmac.space','https://invidious.snopyta.org'];
                
                for (const q of searchQueries) {
                    for (const base of invidiousInstances) {
                        try {
                            const res = await fetch(`${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video`, { signal: AbortSignal.timeout(6000) });
                            if (!res.ok) continue;
                            const items = await res.json();
                            if (!Array.isArray(items) || !items.length) continue;
                            
                            const scored = items.map(v => {
                                const text = `${v.title||''} ${v.author||''}`.toLowerCase();
                                let score = 0;
                                if (text.includes('official')) score += 4;
                                if (text.includes('audio')) score += 6;
                                if (text.includes('topic')) score += 5;
                                if (text.includes('music video')) score += 1;
                                if (text.includes('lyrics')) score -= 2;
                                if (text.includes('cover')) score -= 5;
                                if (text.includes('live')) score -= 2;
                                const artWords = String(artist).toLowerCase().split(/\s+/).filter(w => w.length > 2);
                                const titWords = String(title).toLowerCase().split(/\s+/).filter(w => w.length > 2);
                                artWords.forEach(w => { if (text.includes(w)) score += 3; });
                                titWords.forEach(w => { if (text.includes(w)) score += 3; });
                                return { v, score };
                            }).sort((a,b) => b.score - a.score);
                            
                            const pick = scored[0]?.v;
                            if (pick && pick.videoId) {
                                const result = { videoId: pick.videoId, title: pick.title, uploader: pick.author, source: base };
                                if (!os._videoIdCache) os._videoIdCache = {};
                                os._videoIdCache[cacheKey] = result;
                                return result;
                            }
                        } catch (e) { continue; }
                    }
                }
                
                const pipedInstances = ['https://pipedapi.kavin.rocks','https://pipedapi.adminforge.de','https://pipedapi.syncpundit.io','https://api.piped.projectsegfault.com'];
                for (const q of searchQueries) {
                    for (const base of pipedInstances) {
                        try {
                            const res = await fetch(`${base}/search?q=${encodeURIComponent(q)}&filter=videos`, { signal: AbortSignal.timeout(6000) });
                            if (!res.ok) continue;
                            const data = await res.json();
                            const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
                            if (!items.length) continue;
                            
                            const scored = items.map(v => {
                                const text = `${v.title||''} ${v.uploaderName||v.uploader||''}`.toLowerCase();
                                let score = 0;
                                if (text.includes('official')) score += 4;
                                if (text.includes('audio')) score += 5;
                                const artWords = String(artist).toLowerCase().split(/\s+/).filter(w => w.length > 2);
                                const titWords = String(title).toLowerCase().split(/\s+/).filter(w => w.length > 2);
                                artWords.forEach(w => { if (text.includes(w)) score += 3; });
                                titWords.forEach(w => { if (text.includes(w)) score += 3; });
                                return { v, score };
                            }).sort((a,b) => b.score - a.score);
                            
                            const pick = scored[0]?.v;
                            const rawId = pick?.url || pick?.id || '';
                            const vid = (String(rawId).match(/(?:v=|\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)||[])[1] || (String(rawId).match(/^[a-zA-Z0-9_-]{11}$/)?rawId:'');
                            if (vid) {
                                const result = { videoId: vid, title: pick.title, uploader: pick.uploaderName, source: 'piped' };
                                if (!os._videoIdCache) os._videoIdCache = {};
                                os._videoIdCache[cacheKey] = result;
                                return result;
                            }
                        } catch (e) { continue; }
                    }
                }
                return null;
            },

    resolvePipedAudioStream: async (artist, title) => {
                const query = `${artist} ${title}`.replace(/\s+/g, ' ').trim();
                const cacheKey = `${artist}\t${title}`.toLowerCase();
                if (os._pipedAudioCache[cacheKey] !== undefined) return os._pipedAudioCache[cacheKey];
                
                // ── Strategy 1: Invidious API (most reliable for audio URLs) ──
                const invidiousInstances = [
                    'https://invidious.fdn.fr','https://iv.nboeck.de','https://iv.datura.network',
                    'https://vid.puffyan.us','https://invidious.snopyta.org','https://y.com.sb',
                    'https://iv.melmac.space','https://iv.datura.network'
                ];
                
                const searchQueries = [
                    `${artist} ${title} official audio`,
                    `${artist} ${title} audio`,
                    `${artist} ${title}`,
                    `${title} ${artist}`
                ];
                
                let foundVideoId = null;
                let foundTitle = null;
                let foundUploader = null;
                
                for (const q of searchQueries) {
                    if (foundVideoId) break;
                    for (const base of invidiousInstances) {
                        try {
                            const searchRes = await fetch(`${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video`, { signal: AbortSignal.timeout(6000) });
                            if (!searchRes.ok) continue;
                            const items = await searchRes.json();
                            if (!Array.isArray(items) || !items.length) continue;
                            
                            const scored = items.map(v => {
                                const text = `${v.title||''} ${v.author||''}`.toLowerCase();
                                let score = 0;
                                if (text.includes('official')) score += 4;
                                if (text.includes('audio')) score += 6;
                                if (text.includes('topic')) score += 5;
                                if (text.includes('music video')) score += 1;
                                if (text.includes('lyrics')) score -= 2;
                                if (text.includes('cover')) score -= 3;
                                if (text.includes('live')) score -= 1;
                                const artWords = String(artist).toLowerCase().split(/\s+/).filter(w => w.length > 2);
                                const titWords = String(title).toLowerCase().split(/\s+/).filter(w => w.length > 2);
                                artWords.forEach(w => { if (text.includes(w)) score += 3; });
                                titWords.forEach(w => { if (text.includes(w)) score += 3; });
                                return {v, score};
                            }).sort((a,b) => b.score - a.score);
                            
                            const pick = scored[0]?.v || items[0];
                            if (pick && pick.videoId) {
                                foundVideoId = pick.videoId;
                                foundTitle = pick.title || title;
                                foundUploader = pick.author || artist;
                                break;
                            }
                        } catch (e) { continue; }
                    }
                }
                
                // ── Strategy 1b: Get audio stream from Invidious video API ──
                if (foundVideoId) {
                    for (const base of invidiousInstances) {
                        try {
                            const res = await fetch(`${base}/api/v1/videos/${foundVideoId}`, { signal: AbortSignal.timeout(6000) });
                            if (!res.ok) continue;
                            const data = await res.json();
                            const adaptive = data.adaptiveFormats || [];
                            // Prefer audio-only formats: itag 251=opus 160kbps, 140=m4a 128kbps, 250=opus 64kbps
                            const audioFmts = adaptive.filter(f => f.type && f.type.startsWith('audio/'));
                            if (audioFmts.length) {
                                const best = audioFmts.sort((a,b) => (Number(b.bitrate)||0) - (Number(a.bitrate)||0))[0];
                                const result = { url: best.url, duration: Number(data.lengthSeconds)||0, videoId: foundVideoId, title: foundTitle, uploader: foundUploader, source: 'invidious' };
                                os._pipedAudioCache[cacheKey] = result;
                                os.logTerminal(`Media Core: Audio resolved via Invidious [${foundVideoId}] — ${foundTitle}`);
                                return result;
                            }
                            // Fallback: use instance proxy for audio
                            const proxyUrl = `${base}/latest_version?id=${foundVideoId}&itag=251&local=true`;
                            const result = { url: proxyUrl, duration: Number(data.lengthSeconds)||0, videoId: foundVideoId, title: foundTitle, uploader: foundUploader, source: 'invidious-proxy' };
                            os._pipedAudioCache[cacheKey] = result;
                            os.logTerminal(`Media Core: Audio resolved via Invidious proxy [${foundVideoId}] — ${foundTitle}`);
                            return result;
                        } catch (e) { continue; }
                    }
                }
                
                // ── Strategy 2: Piped API (fallback) ──
                const pipedInstances = ['https://pipedapi.kavin.rocks','https://pipedapi.adminforge.de','https://pipedapi.syncpundit.io','https://api.piped.projectsegfault.com'];
                for (const q of searchQueries) {
                    if (foundVideoId) break;
                    for (const base of pipedInstances) {
                        try {
                            const searchRes = await fetch(`${base}/search?q=${encodeURIComponent(q)}&filter=videos`, { signal: AbortSignal.timeout(6000) });
                            if (!searchRes.ok) continue;
                            const searchData = await searchRes.json();
                            const items = Array.isArray(searchData?.items) ? searchData.items : (Array.isArray(searchData) ? searchData : []);
                            if (!items.length) continue;
                            
                            const scored = items.map(v => {
                                const text = `${v.title||''} ${v.uploaderName||v.uploader||''}`.toLowerCase();
                                let score = 0;
                                if (text.includes('official')) score += 4;
                                if (text.includes('audio')) score += 5;
                                if (text.includes('topic')) score += 3;
                                if (text.includes('music video')) score -= 2;
                                if (text.includes('lyrics')) score -= 1;
                                const artWords = String(artist).toLowerCase().split(/\s+/).filter(w => w.length > 2);
                                const titWords = String(title).toLowerCase().split(/\s+/).filter(w => w.length > 2);
                                artWords.forEach(w => { if (text.includes(w)) score += 3; });
                                titWords.forEach(w => { if (text.includes(w)) score += 3; });
                                return {v, score};
                            }).sort((a,b) => b.score - a.score);
                            
                            const pick = scored[0]?.v || items[0];
                            const rawId = pick?.url || pick?.id || '';
                            const vid = (String(rawId).match(/(?:v=|\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)||[])[1] || (String(rawId).match(/^[a-zA-Z0-9_-]{11}$/)?rawId:'');
                            if (!vid) continue;
                            
                            const streamRes = await fetch(`${base}/streams/${vid}`, { signal: AbortSignal.timeout(6000) });
                            if (!streamRes.ok) continue;
                            const streamData = await streamRes.json();
                            const audioStreams = streamData.audioStreams || [];
                            if (audioStreams.length) {
                                const best = audioStreams.sort((a,b) => (Number(b.bitrate)||0) - (Number(a.bitrate)||0))[0];
                                const result = { url: best.url, duration: Number(streamData.duration)||Number(streamData.lengthSeconds)||0, videoId: vid, title: streamData.title || pick.title || title, uploader: streamData.uploader || pick.uploaderName || artist, source: 'piped' };
                                os._pipedAudioCache[cacheKey] = result;
                                os.logTerminal(`Media Core: Audio resolved via Piped [${vid}] — ${streamData.title || title}`);
                                return result;
                            }
                        } catch (e) { continue; }
                    }
                }
                
                // ── Strategy 3: Direct Invidious proxy URL (best CORS support) ──
                if (foundVideoId) {
                    for (const base of invidiousInstances) {
                        const proxyUrl = `${base}/latest_version?id=${foundVideoId}&itag=251&local=true`;
                        const result = { url: proxyUrl, duration: 0, videoId: foundVideoId, title: foundTitle, uploader: foundUploader, source: 'invidious-proxy' };
                        os._pipedAudioCache[cacheKey] = result;
                        os.logTerminal(`Media Core: Audio resolved via Invidious proxy fallback [${foundVideoId}] — ${foundTitle}`);
                        return result;
                    }
                }
                
                os.logTerminal(`Media Core: All audio resolution strategies failed for "${artist} — ${title}".`);
                os._pipedAudioCache[cacheKey] = null;
                return null;
            },

    attemptFullTrackPlayback: async () => {
                if (SystemState.settings.media_player_mode !== 'player') return;
                if (SystemState.settings.media_tuner_station !== 'lastfm') return;
                if (os._isResolvingPlayback) return;
                os._isResolvingPlayback = true;
                
                const user = SystemState.settings.api_lastfm_user;
                if (!user) { os._isResolvingPlayback = false; return; }
                
                const trackEl = document.getElementById('media-track');
                const artistEl = document.getElementById('media-artist');
                const track = trackEl ? trackEl.textContent.trim() : '';
                const artist = artistEl ? artistEl.textContent.trim() : '';
                if (!track || track === 'Telemetry loading...' || !artist || artist === 'Standby...') {
                    os._isResolvingPlayback = false;
                    return;
                }
                
                // Avoid duplicate playback of same track — check BEFORE stopping
                const existingIframe = document.getElementById('media-full-player-iframe');
                if (os._currentTrackAudio && os._currentTrackAudio.track === track && os._currentTrackAudio.artist === artist && existingIframe) {
                    os._isResolvingPlayback = false;
                    return;
                }
                
                // Stop any existing playback
                os.stopFullTrackPlayback();
                os._pendingTrackPlayback = true; // ensure retry is enabled for this attempt
                if (os.audioStream && os.audioStream.src) {
                    try { os.audioStream.pause(); os.audioStream.src = ''; } catch(e){}
                }
                os.stopRadioBrowser();
                
                const state = document.getElementById('spotify-canvas-state');
                if (state) state.textContent = 'resolving video...';
                
                const videoInfo = await os.resolveVideoId(artist, track);
                if (!videoInfo || !videoInfo.videoId) {
                    if (state) state.textContent = 'video not found';
                    os.logTerminal(`Media Core: No video found for "${track}" by ${artist}. Retrying in 4s...`);
                    os._isResolvingPlayback = false;
                    setTimeout(() => {
                        if (SystemState.settings.media_player_mode === 'player' && os._pendingTrackPlayback) {
                            os.attemptFullTrackPlayback();
                        }
                    }, 4000);
                    return;
                }
                
                const videoId = videoInfo.videoId;
                
                // Create iframe host if missing
                let host = document.getElementById('media-full-player-host');
                if (!host) {
                    host = document.createElement('div');
                    host.id = 'media-full-player-host';
                    host.style.cssText = 'position:fixed;bottom:0;right:0;width:2px;height:2px;opacity:0;pointer-events:none;z-index:-1;overflow:hidden;';
                    document.body.appendChild(host);
                }
                
                // Build embed URLs with fallbacks — Invidious first (no bot checks), then YouTube
                const embedUrls = [
                    `https://y.com.sb/embed/${videoId}?autoplay=1&continue=0&controls=0&listen=1`,
                    `https://invidious.fdn.fr/embed/${videoId}?autoplay=1&continue=0&controls=0`,
                    `https://vid.puffyan.us/embed/${videoId}?autoplay=1&continue=0&controls=0`,
                    `https://iv.nboeck.de/embed/${videoId}?autoplay=1&continue=0&controls=0`,
                    `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=0&controls=0&modestbranding=1&rel=0&playsinline=1&start=0`,
                ];
                
                // Clear host and create iframe
                host.innerHTML = '';
                const iframe = document.createElement('iframe');
                iframe.id = 'media-full-player-iframe';
                iframe.allow = 'autoplay; encrypted-media; fullscreen';
                iframe.style.cssText = 'width:100%;height:100%;border:none;';
                iframe.src = embedUrls[0];
                
                // Track which URL is active for error recovery
                let activeUrlIndex = 0;
                iframe.onload = () => {
                    os.logTerminal(`Media Core: Iframe loaded for "${track}" — ${embedUrls[activeUrlIndex]}`);
                };
                iframe.onerror = () => {
                    os.logTerminal(`Media Core: Iframe failed to load for "${track}" — ${embedUrls[activeUrlIndex]}`);
                };
                
                host.appendChild(iframe);
                
                os._currentTrackAudio = { track, artist, videoId, embedUrl: embedUrls[0] };
                os._pendingTrackPlayback = false;
                os._isResolvingPlayback = false;
                
                // Get duration estimate from Invidious API
                let duration = 220;
                try {
                    const durRes = await fetch(`${videoInfo.source || 'https://invidious.fdn.fr'}/api/v1/videos/${videoId}`, { signal: AbortSignal.timeout(5000) });
                    if (durRes.ok) {
                        const durData = await durRes.json();
                        duration = Number(durData.lengthSeconds) || 220;
                    }
                } catch(e) {}
                
                os.mediaPlaybackDuration = duration;
                os.startPlaybackTimer(duration, { preservePosition: false });
                os.updatePlayStateVisuals(true);
                
                if (state) state.textContent = `full audio · ${videoInfo.source || 'youtube'}`;
                os.logTerminal(`Media Core: Full track iframe playback started — "${track}" [${videoId}] via ${videoInfo.source || 'youtube'}`);
                
                if (os.companion && os.companion.observeEvent) {
                    os.companion.observeEvent('media_play', { station: 'full_track', track, artist });
                }
            },

    stopFullTrackPlayback: () => {
                const host = document.getElementById('media-full-player-host');
                if (host) host.innerHTML = '';
                if (os.audioStream && os._currentTrackAudio) {
                    try { os.audioStream.pause(); os.audioStream.src = ''; } catch(e){}
                }
                os._currentTrackAudio = null;
                os._pendingTrackPlayback = false;
                os._isResolvingPlayback = false;
                if (os.playbackTimerInterval) {
                    clearInterval(os.playbackTimerInterval);
                    os.playbackTimerInterval = null;
                }
                os.updatePlayStateVisuals(false);
            },

    renderMediaDashboard: () => {
                const container = document.getElementById('media-console-panel');
                if (!container) return;

                if (os.radioMetaPollTimer) {
                    clearInterval(os.radioMetaPollTimer);
                    os.radioMetaPollTimer = null;
                }

                const activeStation = SystemState.settings.media_tuner_station || 'lastfm';
                let tunerHeaderHtml = `
                    <div class="h-10 border-b border-white/5 px-4 flex justify-between items-center text-[9px] font-mono text-os-accent uppercase flex-shrink-0 bg-black/20">
                        <div class="flex gap-4">
                            <button onclick="os.setMediaView('stream')" class="hover-target cursor-none ${os.mediaView === 'stream' ? 'text-white font-semibold border-b border-white pb-0.5' : 'text-gray-500 hover:text-white'}">Monitor</button>
                            ${activeStation === 'lastfm' ? `
                            <button onclick="os.setMediaView('metrics')" class="hover-target cursor-none ${os.mediaView === 'metrics' ? 'text-white font-semibold border-b border-white pb-0.5' : 'text-gray-500 hover:text-white'}">Profile Metrics</button>
                            <button onclick="os.setMediaView('history')" class="hover-target cursor-none ${os.mediaView === 'history' ? 'text-white font-semibold border-b border-white pb-0.5' : 'text-gray-500 hover:text-white'}">History Archive (${SystemState.history.length})</button>
                            ` : ''}
                        </div>
                        <div class="flex items-center gap-3 bg-os-900 border border-white/5 px-2 py-0.5 rounded">
                            <span class="text-gray-600">STN_BAND:</span>
                            <button onclick="os.setStation('lastfm')" class="hover-target cursor-none ${activeStation === 'lastfm' ? 'text-white font-bold' : 'text-gray-600 hover:text-white'}">LASTFM</button>
                            <button onclick="os.setStation('plaza')" class="hover-target cursor-none ${activeStation === 'plaza' ? 'text-white font-bold' : 'text-gray-600 hover:text-white'}">PLAZA.ONE</button>
                        </div>
                        <div class="flex items-center gap-2 bg-os-900 border border-white/5 px-2 py-0.5 rounded">
                            <span class="text-gray-600">MODE:</span>
                            <button onclick="os.setMediaPlayerMode('monitor')" class="hover-target cursor-none ${SystemState.settings.media_player_mode === 'monitor' ? 'text-white font-bold' : 'text-gray-600 hover:text-white'}">MONITOR</button>
                            <button onclick="os.setMediaPlayerMode('player')" class="hover-target cursor-none ${SystemState.settings.media_player_mode === 'player' ? 'text-green-400 font-bold' : 'text-gray-600 hover:text-white'}">PLAYER</button>
                        </div>
                    </div>
                `;

                if (activeStation === 'lastfm') {
                    const user = SystemState.settings.api_lastfm_user;
                    if (!user) {
                        container.innerHTML = tunerHeaderHtml + `
                            <div class="flex flex-col h-full justify-center items-center p-6 text-center">
                                <div class="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0%,transparent_60%)]"></div>
                                <div class="w-20 h-20 rounded-full border border-white/10 mb-6 flex items-center justify-center relative shadow-[0_0_50px_rgba(255,255,255,0.05)] bg-os-800">
                                    <i data-lucide="radio" class="w-8 h-8 text-gray-600"></i>
                                </div>
                                <h3 class="font-display tracking-widest text-lg text-white uppercase">Aether Console Offline</h3>
                                <p class="font-mono text-xs text-gray-500 mt-2 max-w-sm">Please link your Last.fm username in System Configuration to enable scrobble mapping.</p>
                                <button onclick="os.openWindow('settings')" class="mt-6 px-4 py-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded hover:bg-white/10 hover-target transition-colors">
                                    Open Config Parameters
                                </button>
                            </div>
                        `;
                    } else {
                        if (os.mediaView === 'metrics') {
                            container.innerHTML = tunerHeaderHtml + os.getLastFmMetricsLayout();
                            os.initLastFmMetricsSubView();
                        } else if (os.mediaView === 'stream') {
                            container.innerHTML = tunerHeaderHtml + `
                                <div class="flex-1 flex overflow-hidden relative min-h-0" id="media-command-center">
                                    <!-- Cinematic Blurry Ambient Background -->
                                    <div id="media-ambient-bg" class="absolute inset-0 opacity-[0.18] filter blur-[40px] transition-all duration-1000 bg-cover bg-center pointer-events-none" style="background-image: url('');"></div>

                                    <!-- Left Column: Audio deck + Procedural Visualizer (42% width) -->
                                    <div class="w-[42%] min-w-[300px] p-4 border-r border-white/5 flex flex-col justify-between bg-black/30 relative z-10">
                                        <div class="flex justify-between items-start">
                                            <div class="space-y-1">
                                                <div class="text-[9px] font-mono text-os-accent tracking-widest uppercase">AUD_CH_1 // MAIN_STATION</div>
                                                <div class="flex items-center gap-2">
                                                    <div class="font-display text-base tracking-wider text-white">NOW TRANSMITTING</div>
                                                    <i id="media-loved-icon" data-lucide="heart" class="w-3.5 h-3.5 text-red-500 hidden fill-current animate-pulse"></i>
                                                </div>
                                            </div>
                                            <!-- Reactive Equalizer Spectrum (12 bars!) -->
                                            <div class="flex gap-0.5 h-6 items-end w-20" id="media-spectrograph"></div>
                                        </div>

                                        <!-- Substantially Enlarged Vinyl Deck -->
                                        <div class="my-auto flex flex-col items-center py-3 relative">
                                            <div class="w-44 h-44 xl:w-52 xl:h-52 rounded-full border border-white/10 flex items-center justify-center relative bg-gradient-to-b from-os-700 to-black overflow-hidden group shadow-[0_0_50px_rgba(255,255,255,0.04)]" id="vinyl-deck">
                                                <div id="media-art-cover" class="absolute inset-0 bg-cover bg-center opacity-50 spinning-reel hidden"></div>
                                                <div class="absolute inset-2 rounded-full border border-white/5 pointer-events-none"></div>
                                                <div class="absolute inset-4 rounded-full border border-white/5 pointer-events-none"></div>
                                                <div class="absolute inset-8 rounded-full border border-white/5 pointer-events-none"></div>
                                                <div class="absolute inset-12 rounded-full border border-white/5 spinning-reel pointer-events-none" id="spinning-spokes">
                                                    <div class="absolute top-1 left-1/2 -ml-0.5 w-1 h-3 bg-white/40 rounded"></div>
                                                </div>
                                                <div class="w-10 h-10 rounded-full bg-os-600 border border-white/10 flex items-center justify-center z-10">
                                                    <div class="w-2.5 h-2.5 rounded-full bg-white shadow-glow"></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="space-y-3">
                                            <div class="space-y-1">
                                                <div class="font-mono text-xs text-white uppercase tracking-wider truncate text-glow" id="media-track">Telemetry loading...</div>
                                                <div class="font-mono text-[10px] text-gray-400 uppercase truncate" id="media-artist">Standby...</div>
                                            </div>
                                            
                                            <!-- Interactive Progress Bar -->
                                            <div class="space-y-1 text-[8px] font-mono text-gray-500">
                                                <div class="flex justify-between">
                                                    <span id="media-playback-time">0:00</span>
                                                    <span id="media-total-time">3:40</span>
                                                </div>
                                                <div class="w-full h-1 bg-white/10 rounded-full overflow-hidden relative cursor-none hover-target" onclick="os.seekMedia(event)">
                                                    <div id="media-progress-bar" class="absolute left-0 top-0 bottom-0 bg-white/40 w-[20%] transition-all duration-300"></div>
                                                </div>
                                            </div>

                                            <!-- High-End Playback Controls -->
                                            <div class="flex items-center justify-between border-t border-white/5 pt-3">
                                                <div class="flex items-center gap-3">
                                                    <button onclick="os.toggleAudioPlayback()" id="media-console-play-btn" class="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition shadow-os-btn cursor-none hover-target"><i data-lucide="play" class="w-4.5 h-4.5 text-black ml-0.5"></i></button>
                                                    <span class="text-[9px] text-gray-500 uppercase tracking-widest font-mono">LIVE TUNER</span>
                                                </div>
                                                <div class="flex items-center gap-1.5 text-[9px]">
                                                    <i data-lucide="volume-2" class="w-3.5 h-3.5 text-os-accent"></i>
                                                    <input type="range" min="0" max="1" step="0.01" value="0.7" oninput="os.adjustVolume(this.value)" class="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-none hover-target">
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Middle Column: Synced Lyric Stream with BetterLyrics themes (28% width) -->
                                    <div class="w-[33%] min-w-[300px] border-r border-white/5 bg-black/20 flex flex-col relative z-10 font-mono overflow-hidden" id="media-lyrics-panel">
                                        <div class="px-3 pt-2 pb-1 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                                            <div class="text-[8px] text-os-accent tracking-widest uppercase">Lyric Stream</div>
                                            <div class="flex items-center gap-1">
                                                <span class="text-[7px] text-gray-600 uppercase">Theme:</span>
                                                <select id="lyrics-theme-select" onchange="os.setLyricsTheme(this.value)" class="bg-black/60 border border-white/10 text-[7px] text-gray-300 rounded px-1 py-0.5 outline-none cursor-none font-mono uppercase">
                                                    <option value="default">Default</option>
                                                    <option value="spotlight">Spotlight</option>
                                                    <option value="ebl">Even Better</option>
                                                    <option value="minimal">Minimal</option>
                                                    <option value="dynbg">Dyn. BG</option>
                                                    <option value="apple">Apple Music</option>
                                                </select>
                                            </div>
                                        </div>
                                        
                                        <!-- Scrollable Lyric Container -->
                                        <div class="flex-1 overflow-y-auto no-scrollbar select-text relative" id="media-lyric-scroller" data-lyrics-theme="default">
                                            <div class="space-y-2 animate-pulse py-4 px-3" id="media-lyric-placeholder">
                                                <div class="h-3 bg-white/5 rounded w-[90%]"></div>
                                                <div class="h-3 bg-white/10 rounded w-[80%]"></div>
                                                <div class="h-3 bg-white/5 rounded w-[85%]"></div>
                                            </div>
                                        </div>

                                        <div class="border-t border-white/5 px-3 py-1.5 text-[7px] text-os-accent flex justify-between flex-shrink-0">
                                            <span id="lyrics-src-label">SRC: LRCLIB</span>
                                            <span class="text-green-500" id="lyrics-sync-label">SYNCED</span>
                                        </div>
                                    </div>

                                    <!-- Right Column: Profile Diagnostics & Recent Activity (30% width) -->
                                    <div class="w-[33%] min-w-[300px] p-4 flex flex-col overflow-hidden bg-black/40 text-xs relative z-10">
                                        <div class="space-y-3 flex-1 min-h-0 flex flex-col">
                                            <div class="rounded-xl overflow-hidden border border-white/10 bg-black/55 relative h-56 xl:h-64 shadow-os-recessed flex-shrink-0" id="spotify-canvas-shell">
                                                <div id="spotify-canvas-bg" class="absolute inset-0 bg-cover bg-center opacity-[0.18] blur-md scale-110"></div>
                                                <canvas id="spotify-canvas-visual" class="absolute inset-0 w-full h-full"></canvas>
                                                <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"></div>
                                                <div class="absolute top-2 left-2 right-2 flex items-center justify-between text-[7px] uppercase tracking-widest opacity-75 hover:opacity-100 transition-opacity gap-2"><span id="spotify-canvas-state" class="text-green-300 bg-black/30 border border-white/5 rounded-full px-2 py-0.5 truncate">procedural</span><div class="flex items-center gap-1 pointer-events-auto"><select id="spotify-gif-provider-select" onchange="os.setSpotifyGifProvider(this.value)" class="bg-black/45 border border-white/10 rounded-full px-1 py-0.5 text-gray-300 outline-none cursor-none hover-target uppercase"><option value="mixed">Mixed</option><option value="nekos">Nekos</option><option value="giphy">Giphy</option><option value="tenor">Tenor</option></select><button onclick="event.stopPropagation();os.toggleSpotifyAnimeGif()" id="spotify-anime-toggle" class="px-2 py-0.5 rounded-full bg-black/35 border border-white/10 text-gray-300 cursor-none hover-target">GIF ON</button></div></div>
                                                <div class="absolute bottom-2 left-2 right-2 pointer-events-none opacity-75"><div id="spotify-canvas-title" class="text-white text-[10px] font-bold truncate">Awaiting track telemetry</div><div id="spotify-canvas-artist" class="text-gray-400 text-[8px] truncate">Canvas engine standby</div></div>
                                            </div>
                                            <div class="text-[8px] font-mono text-os-accent tracking-widest uppercase mb-1">PROFILER METRICS</div>
                                            
                                            <!-- Last.fm Profile Avatar & Info Card -->
                                            <div class="bg-os-900/50 rounded-lg border border-white/5 p-2.5 flex gap-2 items-center shadow-os-recessed flex-shrink-0" id="media-profile-card">
                                                <div class="w-10 h-10 rounded-full bg-white/5 animate-pulse shrink-0" id="media-profile-avatar-placeholder"></div>
                                                <div class="space-y-1 overflow-hidden flex-1">
                                                    <div class="h-2 bg-white/10 rounded w-16 animate-pulse"></div>
                                                    <div class="h-2 bg-white/5 rounded w-24 animate-pulse"></div>
                                                </div>
                                            </div>

                                            <div class="text-[8px] font-mono text-os-accent tracking-widest uppercase mb-1">RECENT TELEMETRY</div>
                                            <div class="space-y-2 overflow-y-auto pr-1 max-h-44 xl:max-h-56 no-scrollbar" id="scrobble-history-list"></div>
                                        </div>

                                        <div class="flex justify-between items-center border-t border-white/5 pt-3 mt-3 text-[9px] font-mono text-os-accent flex-shrink-0">
                                            <span id="telemetry-update-time">UPDATE: INACTIVE</span>
                                            <button onclick="os.fetchLastFmData()" class="hover-target cursor-none text-white hover:underline uppercase flex items-center gap-1">
                                                <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> Sync Live
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        } else {
                            let historyRows = '';
                            if (SystemState.history.length === 0) {
                                historyRows = `
                                    <div class="col-span-12 py-12 text-center text-xs font-mono text-gray-500">
                                        No logged tracks found in telemetry records.
                                    </div>
                                `;
                            } else {
                                SystemState.history.forEach((track, idx) => {
                                    historyRows += `
                                        <div class="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-xs font-mono">
                                            <div class="flex items-center gap-3 truncate max-w-[340px]">
                                                <span class="text-[10px] text-gray-500">#${SystemState.history.length - idx}</span>
                                                <div class="w-8 h-8 rounded bg-os-800 flex-shrink-0 overflow-hidden flex items-center justify-center border border-white/10">
                                                    ${track.coverUrl ? `<img src="${track.coverUrl}" class="w-full h-full object-cover">` : `<i data-lucide="music" class="w-4 h-4 text-white/20"></i>`}
                                                </div>
                                                <div class="truncate">
                                                    <div class="flex items-center gap-1.5">
                                                        <div class="text-white font-medium truncate">${track.title}</div>
                                                        ${track.isLoved ? `<i data-lucide="heart" class="w-2.5 h-2.5 text-red-500 fill-current flex-shrink-0"></i>` : ''}
                                                    </div>
                                                    <div class="text-os-accent text-[9px] truncate uppercase">${track.artist} ${track.album ? '• ' + track.album : ''}</div>
                                                </div>
                                            </div>
                                            <div class="text-[9px] text-os-accent text-right">
                                                <div>${track.time}</div>
                                                <div class="opacity-50">${track.date}</div>
                                            </div>
                                        </div>
                                    `;
                                });
                            }

                            container.innerHTML = tunerHeaderHtml + `
                                <div class="flex-1 p-4 overflow-y-auto flex flex-col justify-between bg-black/30">
                                    <div class="space-y-2">
                                        <div class="flex justify-between items-center mb-3">
                                            <span class="text-[10px] font-mono text-os-accent tracking-widest uppercase">RECORDED TRACK DATABASE</span>
                                            <button onclick="os.clearMusicHistory()" class="text-[9px] font-mono text-red-400 hover:text-red-300 transition-colors uppercase cursor-none hover-target">Clear Logs</button>
                                        </div>
                                        <div class="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                            ${historyRows}
                                        </div>
                                    </div>
                                    <div class="text-[9px] font-mono text-os-accent border-t border-white/5 pt-3 mt-4">
                                        System holds up to 50 logs dynamically mapped in storage.
                                    </div>
                                </div>
                            `;
                        }
                        os.fetchLastFmData();
                    }
                } else {
                    const volumePercent = Math.round(SystemState.settings.media_tuner_volume * 100);
                    const isCurrentlyPlaying = os.audioStream && !os.audioStream.paused && os.audioStream.src && SystemState.settings.media_tuner_station !== 'external';

                    container.innerHTML = tunerHeaderHtml + `
                        <div class="flex-1 flex overflow-hidden min-h-0">
                            <!-- Left: Standard spinning record block -->
                            <div class="w-[46%] min-w-[320px] p-4 border-r border-white/5 flex flex-col justify-between bg-black/30">
                                <div class="flex justify-between items-start">
                                    <div class="space-y-1">
                                        <div class="text-[9px] font-mono text-os-accent tracking-widest uppercase">RECEIVER UNIT</div>
                                        <div class="flex items-center gap-2">
                                            <div class="font-display text-lg tracking-wide text-white" id="active-station-display-lbl">UPLINK_READY</div>
                                            <i id="media-loved-icon" data-lucide="heart" class="w-3.5 h-3.5 text-red-500 hidden fill-current"></i>
                                        </div>
                                    </div>
                                    <div class="flex gap-1 h-6 items-end w-12" id="console-eq-bars">
                                        <div class="eq-bar flex-1 bg-white opacity-25 h-full"></div>
                                        <div class="eq-bar flex-1 bg-white opacity-25 h-full"></div>
                                        <div class="eq-bar flex-1 bg-white opacity-25 h-full"></div>
                                        <div class="eq-bar flex-1 bg-white opacity-25 h-full"></div>
                                    </div>
                                </div>

                                <div class="my-auto flex justify-center py-4">
                                    <div class="w-44 h-44 xl:w-52 xl:h-52 rounded-full border border-white/10 flex items-center justify-center relative shadow-[0_0_50px_rgba(255,255,255,0.05)] bg-gradient-to-b from-os-700 to-black overflow-hidden" id="vinyl-deck">
                                        <div id="media-art-cover" class="absolute inset-0 bg-cover bg-center opacity-40 spinning-reel hidden"></div>
                                        <div class="absolute inset-2 rounded-full border border-white/5 pointer-events-none"></div>
                                        <div class="absolute inset-4 rounded-full border border-white/5 pointer-events-none"></div>
                                        <div class="absolute inset-6 rounded-full border border-white/5 spinning-reel pointer-events-none" id="spinning-spokes">
                                            <div class="absolute top-1 left-1/2 -ml-0.5 w-1 h-2 bg-white/40 rounded"></div>
                                        </div>
                                        <div class="w-6 h-6 rounded-full bg-os-600 border border-white/10 flex items-center justify-center z-10">
                                            <div class="w-1.5 h-1.5 rounded-full bg-white shadow-glow"></div>
                                        </div>
                                    </div>
                                </div>

                                <div class="space-y-1 border-t border-white/5 pt-3">
                                    <div class="font-mono text-xs text-white uppercase tracking-wider truncate" id="media-track">Connecting stream...</div>
                                    <div class="font-mono text-[10px] text-gray-400 uppercase truncate" id="media-artist">Standby...</div>
                                </div>
                            </div>

                            <!-- Right: Tactical Controls -->
                            <div class="flex-1 p-4 flex flex-col justify-between bg-black/10 overflow-y-auto">
                                <div class="space-y-4">
                                    <div class="rounded-xl overflow-hidden border border-white/10 bg-black/55 relative h-52 xl:h-60 shadow-os-recessed" id="spotify-canvas-shell"><div id="spotify-canvas-bg" class="absolute inset-0 bg-cover bg-center opacity-[0.18] blur-md scale-110"></div><canvas id="spotify-canvas-visual" class="absolute inset-0 w-full h-full"></canvas><div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"></div><div class="absolute top-2 left-2 right-2 flex items-center justify-between text-[7px] uppercase tracking-widest opacity-75 hover:opacity-100 transition-opacity gap-2"><span id="spotify-canvas-state" class="text-green-300 bg-black/30 border border-white/5 rounded-full px-2 py-0.5 truncate">procedural</span><div class="flex items-center gap-1 pointer-events-auto"><select id="spotify-gif-provider-select" onchange="os.setSpotifyGifProvider(this.value)" class="bg-black/45 border border-white/10 rounded-full px-1 py-0.5 text-gray-300 outline-none cursor-none hover-target uppercase"><option value="mixed">Mixed</option><option value="nekos">Nekos</option><option value="giphy">Giphy</option><option value="tenor">Tenor</option></select><button onclick="event.stopPropagation();os.toggleSpotifyAnimeGif()" id="spotify-anime-toggle" class="px-2 py-0.5 rounded-full bg-black/35 border border-white/10 text-gray-300 cursor-none hover-target">GIF ON</button></div></div><div class="absolute bottom-2 left-2 right-2 pointer-events-none opacity-75"><div id="spotify-canvas-title" class="text-white text-[10px] font-bold truncate">Radio Canvas</div><div id="spotify-canvas-artist" class="text-gray-400 text-[8px] truncate">Reactive visual loop</div></div></div>
                                    <div class="text-[9px] font-mono text-os-accent tracking-widest uppercase mb-1">TUNER_CONTROLS</div>
                                    <div class="flex gap-3">
                                        <button onclick="os.toggleAudioPlayback()" id="media-console-play-btn" class="w-12 h-12 rounded bg-white flex items-center justify-center hover:bg-gray-200 transition shadow-os-btn cursor-none hover-target">
                                        </button>
                                        <div class="flex-1 bg-os-900 border border-white/5 rounded p-2 flex flex-col justify-between font-mono text-[9px] shadow-os-recessed">
                                            <span class="text-gray-500">UPLINK STATUS</span>
                                            <span class="text-white font-bold uppercase" id="radio-station-uplink-status">STANDBY</span>
                                        </div>
                                    </div>

                                    <div class="space-y-2 p-3 bg-os-900 border border-white/5 rounded shadow-os-recessed font-mono text-[9px]">
                                        <div class="flex justify-between items-center mb-1">
                                            <span class="text-gray-500 uppercase">Hardware Gain</span>
                                            <span class="text-white font-bold text-glow" id="vol-db-readout">0 dB</span>
                                        </div>
                                        <div class="flex items-center gap-3">
                                            <i data-lucide="volume-1" class="w-4 h-4 text-gray-500"></i>
                                            <input type="range" min="0" max="1" step="0.01" value="${SystemState.settings.media_tuner_volume}" oninput="os.adjustVolume(this.value)" class="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-none hover-target">
                                            <i data-lucide="volume-2" class="w-4 h-4 text-gray-400"></i>
                                        </div>
                                    </div>
                                </div>

                                <div class="border-t border-white/5 pt-3 mt-4 text-[10px] font-mono text-os-accent flex justify-between">
                                    <span id="telemetry-update-time">SYNCING_DECK</span>
                                    <span class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-yellow-500" id="console-status-led"></span> LIVE</span>
                                </div>
                            </div>
                        </div>
                    `;

                    os.updatePlayStateVisuals(isCurrentlyPlaying);
                    os.adjustVolume(SystemState.settings.media_tuner_volume);

                    if (activeStation === 'plaza') {
                        const nwLabel = document.getElementById('active-station-display-lbl'); if (nwLabel) nwLabel.innerText = 'NIGHTWAVE PLAZA';
                        os.fetchRadioPlazaMetadata();
                        os.radioMetaPollTimer = setInterval(os.fetchRadioPlazaMetadata, 10000);
                    }
                }

                lucide.createIcons({root: container});
            },

    _spotifyCanvasRaf: null,

    _spotifyCanvasToken: 0,

    _spotifyGifCycleTimer: null,

    _spotifyVideoCache: {},

    _spotifyGifMoodHistory: {},

    spotifyAnimeGifEnabled: () => localStorage.getItem('AetherOS_SpotifyAnimeGif') !== 'off',

    toggleSpotifyAnimeGif: () => {
                const next = !os.spotifyAnimeGifEnabled();
                localStorage.setItem('AetherOS_SpotifyAnimeGif', next ? 'on' : 'off');
                document.querySelectorAll('#spotify-anime-toggle').forEach(b => b.textContent = next ? 'GIF ON' : 'GIF OFF');
                const title = document.getElementById('spotify-canvas-title')?.textContent || document.getElementById('media-track')?.textContent || '';
                const artist = document.getElementById('spotify-canvas-artist')?.textContent || document.getElementById('media-artist')?.textContent || '';
                const bg = document.getElementById('spotify-canvas-bg')?.style.backgroundImage?.replace(/url\(["']?|["']?\)$/g,'') || '';
                os.initSpotifyCanvas(bg, title, artist);
                os.logTerminal && os.logTerminal('Spotify Canvas anime GIF fallback ' + (next ? 'enabled' : 'disabled'));
            },

    _spotifyCanvasSetToggleState: () => {
                document.querySelectorAll('#spotify-anime-toggle').forEach(b => b.textContent = os.spotifyAnimeGifEnabled() ? 'GIF ON' : 'GIF OFF');
                document.querySelectorAll('#spotify-gif-provider-select').forEach(sel => sel.value = SystemState.settings.media_gif_provider || 'mixed');
            },

    isUsableArtworkUrl: (url='') => {
                const u = String(url || '').trim();
                if (!u) return false;
                if (/2a96cbd8b46e442fc41c2b86b821562f|default_album|noimage|placeholder|spacer\.gif|transparent/i.test(u)) return false;
                return /^https?:\/\//i.test(u);
            },

    sanitizeArtworkUrl: (url='') => os.isUsableArtworkUrl(url) ? String(url).replace('/64s/','/300x300/').replace('/174s/','/600x600/').replace('34s','600x600').replace('64s','600x600').replace('174s','600x600') : '',

    resolveAlbumArtworkFallback: async (artist='', title='', album='') => {
                os._albumArtCache = os._albumArtCache || {};
                const key = `${artist}|${title}|${album}`.toLowerCase();
                if (os._albumArtCache[key] !== undefined) return os._albumArtCache[key];
                const clean = v => String(v||'').replace(/\s*\(.*?\)|\s*\[.*?\]/g,'').trim();
                const apiKey = (SystemState.settings.api_lastfm || '').trim();
                const attempts = [
                    async () => {
                        const term = `${clean(artist)} ${clean(title)} ${clean(album)}`;
                        const j = await os._fetchJson(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=12`, 7000);
                        const nt = clean(title).toLowerCase(), na = clean(artist).toLowerCase().split(' ')[0];
                        const pick = (j.results||[]).find(r => String(r.trackName||'').toLowerCase().includes(nt.slice(0,12)) && String(r.artistName||'').toLowerCase().includes(na)) || (j.results||[]).find(r => r.artworkUrl100) || (j.results||[])[0];
                        return pick?.artworkUrl100 ? pick.artworkUrl100.replace('100x100bb','1200x1200bb').replace('100x100','1200x1200') : '';
                    },
                    async () => {
                        if (!apiKey) return '';
                        const u = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&autocorrect=1&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(title)}&api_key=${apiKey}&format=json`;
                        const j = await os._fetchJson(u, 7000); const imgs = j.track?.album?.image || j.track?.image || [];
                        return [...imgs].reverse().find(i=>os.isUsableArtworkUrl(i['#text']))?.['#text'] || '';
                    },
                    async () => {
                        if (!album) return '';
                        const u = `https://ws.audioscrobbler.com/2.0/?method=album.getInfo&autocorrect=1&artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(album)}&api_key=${apiKey}&format=json`;
                        const j = await os._fetchJson(u, 7000); const imgs = j.album?.image || [];
                        return [...imgs].reverse().find(i=>os.isUsableArtworkUrl(i['#text']))?.['#text'] || '';
                    },
                    async () => {
                        const term = `artist:"${clean(artist)}" track:"${clean(title)}"`;
                        const r = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(term)}&limit=5`, { signal: AbortSignal.timeout(7000) });
                        const j = await r.json(); const pick=(j.data||[])[0]; return pick?.album?.cover_xl || pick?.album?.cover_big || '';
                    },
                    async () => os.spotifyResolveNekosGif(title, artist, true)
                ];
                for (const fn of attempts) { try { const url = os.sanitizeArtworkUrl(await fn()); if (url) { os._albumArtCache[key]=url; return url; } } catch(e) {} }
                os._albumArtCache[key]=''; return '';
            },

    verifyArtworkOrFallback: (url='', artist='', title='', album='') => {
                url = os.sanitizeArtworkUrl(url);
                if (!url) return os.resolveAlbumArtworkFallback(artist, title, album).then(u => os.applyMediaArtworkFallback(u, title, artist)).catch(()=>{});
                const img = new Image();
                let done = false;
                const fail = () => { if (done) return; done = true; os.resolveAlbumArtworkFallback(artist, title, album).then(u => { if (u && u !== url) os.applyMediaArtworkFallback(u, title, artist); }).catch(()=>{}); };
                img.onload = () => { done = true; };
                img.onerror = fail;
                img.src = url;
                setTimeout(fail, 5000);
            },

    applyMediaArtworkFallback: (url, title='', artist='') => {
                if (!url) return;
                const coverArt = document.getElementById('media-art-cover');
                const ambientBg = document.getElementById('media-ambient-bg');
                const miniCover = document.getElementById('mini-cover-art');
                const miniCoverFallback = document.getElementById('mini-cover-fallback');
                if (coverArt) { coverArt.style.backgroundImage = `url('${url}')`; coverArt.classList.remove('hidden'); }
                if (ambientBg) ambientBg.style.backgroundImage = `url('${url}')`;
                if (miniCover) { miniCover.src = url; miniCover.classList.remove('hidden'); }
                if (miniCoverFallback) miniCoverFallback.classList.add('hidden');
                if (SystemState.history?.[0] && SystemState.history[0].title === title && SystemState.history[0].artist === artist) { SystemState.history[0].coverUrl = url; SystemState.save(); }
                os.initSpotifyCanvas(url, title, artist);
                os.logTerminal && os.logTerminal('Media Console: album artwork fallback resolved.');
            },

    setSpotifyGifProvider: (provider='mixed') => {
                SystemState.settings.media_gif_provider = provider;
                SystemState.save();
                document.querySelectorAll('#spotify-gif-provider-select').forEach(sel => sel.value = provider);
                const title = document.getElementById('spotify-canvas-title')?.textContent || document.getElementById('media-track')?.textContent || '';
                const artist = document.getElementById('spotify-canvas-artist')?.textContent || document.getElementById('media-artist')?.textContent || '';
                const bg = document.getElementById('spotify-canvas-bg')?.style.backgroundImage?.replace(/url\(["']?|["']?\)$/g,'') || '';
                if (os.spotifyAnimeGifEnabled()) os.initSpotifyCanvas(bg, title, artist);
                os.logTerminal && os.logTerminal(`Media Canvas: GIF provider set to ${provider.toUpperCase()}.`);
            },

    spotifyMoodLexicon: {
                sad: {
                    words: ['sad','cry','cries','crying','tears','tear','lonely','alone','hurt','blue','lost','miss','missing','broken','pain','goodbye','without you','empty','dark','sorrow','heartbreak','dard','dukhi','udaas','udas','tanha','tanhai','akela','akele','bewafa','judai','judaai','yaad','aansu','ansoo','rona','roye','roti','ro diya','gham','gam','toota','toote','tooti','dil toota','दर्द','दुख','उदास','तन्हा','तन्हाई','अकेला','बेवफा','जुदाई','याद','आंसू','आँसू','रोना','रोये','ग़म','गम','टूटा','दिल टूटा'],
                    category: 'cry', query: 'sad lonely rainy anime aesthetic gif'
                },
                love: {
                    words: ['love','heart','kiss','darling','baby','sweet','romance','hold me','beloved','ishq','pyaar','pyar','mohabbat','dil','jaan','sanam','sajan','sajna','maahi','mahi','prem','chahat','प्यार','मोहब्बत','इश्क','इश्क़','दिल','जान','सनम','साजन','माही','प्रेम','चाहत'],
                    category: 'hug', query: 'romantic warm anime music gif'
                },
                calm: {
                    words: ['sleep','dream','moon','midnight','calm','slow','soft','lofi','chill','rain','night','khwaab','khwab','sapna','sapne','raat','chand','shaam','sukoon','शाम','रात','चाँद','चांद','ख्वाब','सपना','सुकून'],
                    category: 'sleep', query: 'calm lofi night anime aesthetic gif'
                },
                energetic: {
                    words: ['dance','party','nightclub','club','disco','groove','funk','beat','move','edm','banger','nach','naach','nache','nacho','jhoom','dhoom','party','नाच','नाचे','नाचो','झूम','धूम','पार्टी'],
                    category: 'dance', query: 'anime dance concert music gif'
                },
                angry: {
                    words: ['angry','rage','fire','war','fight','monster','hate','mad','revenge','aggressive','gussa','aag','jung','ladai','badla','गुस्सा','आग','जंग','लड़ाई','लड़ाई','बदला'],
                    category: 'angry', query: 'intense dark anime action music gif'
                },
                happy: {
                    words: ['happy','smile','sun','shine','good','joy','laugh','glad','masti','khushi','muskur','hasi','hasna','mast','खुशी','मुस्कान','मुस्कुर','हँसी','हंसी','मस्ती','मस्त'],
                    category: 'happy', query: 'happy bright anime music gif'
                },
                travel: {
                    words: ['wave','ocean','sea','sky','fly','float','safar','raasta','rasta','manzil','kinara','समंदर','सागर','आसमान','सफर','रास्ता','मंज़िल','मंजिल','किनारा'],
                    category: 'wave', query: 'ocean sky travel anime aesthetic gif'
                }
            },

    spotifyDetectMood: (title='', artist='') => {
                const lyrics = (os.mediaLyricsParsed || []).slice(0, 24).map(l=>l.text).join(' ');
                const rawOriginal = `${title} ${artist} ${lyrics}`;
                const raw = rawOriginal.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
                const scores = {};
                Object.entries(os.spotifyMoodLexicon).forEach(([m, cfg]) => {
                    scores[m] = 0;
                    cfg.words.forEach(w => {
                        const term = String(w).toLowerCase();
                        if (!term) return;
                        const occurrences = raw.split(term).length - 1;
                        if (occurrences > 0) scores[m] += occurrences * (term.length > 4 ? 3 : 2);
                    });
                });
                // Negative/sad songs often contain love words too; if heartbreak indicators exist, bias sad.
                if (scores.sad > 0 && scores.love > 0) scores.sad += 4;
                if (/dil.*(toot|tod|jala|roya)|दिल.*(टूट|जला|रो)/i.test(rawOriginal)) scores.sad += 8;
                const best = Object.entries(scores).sort((a,b)=>b[1]-a[1])[0];
                const mood = best && best[1] > 0 ? best[0] : 'calm';
                const cfg = os.spotifyMoodLexicon[mood] || os.spotifyMoodLexicon.calm;
                return { mood, score: best ? best[1] : 0, category: cfg.category, query: cfg.query, scores };
            },

    spotifyGifSearchTerm: (title='', artist='', category='dance') => {
                const detected = os.spotifyDetectMood(title, artist);
                const safeTitle = String(title || '').replace(/\([^)]*\)|\[[^\]]*\]/g,'').trim();
                const safeArtist = String(artist || '').split('//')[0].trim();
                const base = `${safeArtist} ${safeTitle}`.trim();
                const providerHint = detected.query || `${category} music anime aesthetic gif`;
                return `${base} ${providerHint}`.trim();
            },

    refreshSpotifyGifForCurrentTrack: async () => {
                if (!os.spotifyAnimeGifEnabled || !os.spotifyAnimeGifEnabled()) return;
                const title = document.getElementById('media-track')?.textContent || document.getElementById('spotify-canvas-title')?.textContent || '';
                const artistRaw = document.getElementById('media-artist')?.textContent || document.getElementById('spotify-canvas-artist')?.textContent || '';
                const artist = artistRaw.split('//')[0].trim();
                if (!title || /telemetry loading|connecting/i.test(title)) return;
                const gif = await os.spotifyResolveNekosGif(title, artist);
                if (gif && gif.url && os.currentMediaTrackIdentifier === `${artist} - ${title}`.toLowerCase()) {
                    os.spotifyCanvasAnimeGif(gif, title, artist, { token: os._spotifyCanvasToken || 0 });
                }
            },

    spotifyFetchGifFromProvider: async (provider, title='', artist='', category='dance') => {
                const pickFresh = (items, key) => {
                    const list = (items || []).filter(x => x && x.url);
                    if (!list.length) return null;
                    os._spotifyGifMoodHistory = os._spotifyGifMoodHistory || {};
                    const recent = os._spotifyGifMoodHistory[key] || [];
                    const fresh = list.filter(x => !recent.includes(x.url));
                    const pool = fresh.length ? fresh : list;
                    const pick = pool[Math.floor(Math.random() * pool.length)];
                    os._spotifyGifMoodHistory[key] = [pick.url, ...recent.filter(u => u !== pick.url)].slice(0, 12);
                    return pick;
                };
                if (provider === 'nekos') {
                    const r = await fetch(`https://nekos.best/api/v2/${encodeURIComponent(category)}?amount=8`, { signal: AbortSignal.timeout(6500) });
                    if (!r.ok) throw new Error('nekos failed');
                    const j = await r.json();
                    const pick = pickFresh((j.results || []).map(g => ({ url:g.url, anime:g.anime_name || g.anime || '', label:`nekos.best/${category}` })), `nekos:${category}`);
                    if (!pick) throw new Error('nekos empty');
                    return pick;
                }
                const q = os.spotifyGifSearchTerm(title, artist, category);
                if (provider === 'giphy') {
                    const key = 'dc6zaTOxFJmzC';
                    const r = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(q)}&limit=16&rating=pg-13`, { signal: AbortSignal.timeout(8000) });
                    if (!r.ok) throw new Error('giphy failed');
                    const j = await r.json();
                    const pick = pickFresh((j.data || []).map(g => ({ url:g.images?.downsized_medium?.url || g.images?.original?.url || g.images?.fixed_height?.url, label:'giphy', anime:'' })), `giphy:${q.toLowerCase()}`);
                    if (!pick) throw new Error('giphy empty');
                    return pick;
                }
                if (provider === 'tenor') {
                    const key = 'LIVDSRZULELA';
                    const r = await fetch(`https://g.tenor.com/v1/search?q=${encodeURIComponent(q)}&key=${key}&limit=16&media_filter=minimal&contentfilter=medium`, { signal: AbortSignal.timeout(8000) });
                    if (!r.ok) throw new Error('tenor failed');
                    const j = await r.json();
                    const pick = pickFresh((j.results || []).map(g => ({ url:g.media?.[0]?.gif?.url || g.media?.[0]?.mediumgif?.url || g.media?.[0]?.tinygif?.url, label:'tenor', anime:'' })), `tenor:${q.toLowerCase()}`);
                    if (!pick) throw new Error('tenor empty');
                    return pick;
                }
                throw new Error('unknown gif provider');
            },

    spotifyResolveNekosGif: async (title='', artist='', artworkMode=false) => {
                const detected = os.spotifyDetectMood(title, artist);
                const category = detected.category || 'sleep';
                const moodQuery = `${detected.mood} mood / ${detected.query}`;
                const selected = SystemState.settings.media_gif_provider || 'mixed';
                const providers = selected === 'mixed' ? ['nekos','giphy','tenor'] : [selected, 'nekos', 'giphy', 'tenor'];
                const categories = [category, 'dance', 'happy', 'smile'];
                for (const provider of [...new Set(providers)]) {
                    for (const cat of categories) {
                        try {
                            const pick = await os.spotifyFetchGifFromProvider(provider, title, artist, cat);
                            const meta = { url: pick.url, mood: detected.mood || cat, score: detected.score || 0, category: cat, query: provider === 'nekos' ? moodQuery : os.spotifyGifSearchTerm(title, artist, cat), api: pick.label || provider, anime: pick.anime || '', source: provider };
                            return artworkMode ? meta.url : meta;
                        } catch(e) {}
                    }
                }
                if (!artworkMode) return { url:'', mood:category, category, query:moodQuery, api:'none', anime:'', source:'failed' };
                return '';
            },

    spotifyCanvasRemoveVisuals: (immediate=true) => {
                const shell = document.getElementById('spotify-canvas-shell');
                if (!shell) return;
                shell.querySelectorAll('[data-spotify-canvas-visual="1"], #spotify-canvas-video, #spotify-canvas-video-next').forEach(node => {
                    if (immediate) {
                        node.remove();
                    } else {
                        node.style.transition = 'opacity 420ms ease, filter 420ms ease';
                        node.style.opacity = '0';
                        node.style.filter = 'blur(10px)';
                        setTimeout(() => node.remove(), 460);
                    }
                });
            },

    spotifyStopGifCycle: () => {
                if (os._spotifyGifCycleTimer) clearTimeout(os._spotifyGifCycleTimer);
                os._spotifyGifCycleTimer = null;
            },

    spotifyScheduleNextGif: (title='', artist='', token=0) => {
                os.spotifyStopGifCycle && os.spotifyStopGifCycle();
                if (!os.spotifyAnimeGifEnabled()) return;
                // GIF files don't expose a reliable browser "ended" event. Treat one loop
                // as an 8.5s dwell, then fetch a fresh random GIF for the same detected mood.
                os._spotifyGifCycleTimer = setTimeout(async () => {
                    if ((os._spotifyCanvasToken || 0) !== token) return;
                    const current = document.getElementById('spotify-canvas-video');
                    if (!current || current.tagName !== 'IMG') return;
                    const next = await os.spotifyResolveNekosGif(title, artist);
                    if ((os._spotifyCanvasToken || 0) !== token) return;
                    if (next) os.spotifyCanvasAnimeGif(next, title, artist, { cycle:true, token });
                }, 8500);
            },

    spotifyCanvasMountVisual: (el, mode='visual') => {
                const shell = document.getElementById('spotify-canvas-shell');
                if (!shell || !el) return;
                el.dataset.spotifyCanvasVisual = '1';
                el.style.filter = 'saturate(1.08) contrast(1.04)';

                if (mode === 'gif') {
                    let placed = false;
                    const placeGif = () => {
                        if (placed) return;
                        placed = true;
                        // Hard swap for GIFs: never keep multiple GIFs layered with opacity.
                        os.spotifyCanvasRemoveVisuals(true);
                        el.id = 'spotify-canvas-video';
                        el.style.opacity = '0.92';
                        el.style.transition = 'none';
                        el.style.transform = 'scale(1.105)';
                        shell.prepend(el);
                    };
                    if (el.complete && el.naturalWidth) placeGif();
                    else {
                        el.addEventListener('load', placeGif, { once:true });
                        el.addEventListener('error', placeGif, { once:true });
                        setTimeout(placeGif, 1400);
                    }
                    return;
                }

                const oldNodes = Array.from(shell.querySelectorAll('[data-spotify-canvas-visual="1"], #spotify-canvas-video, #spotify-canvas-video-next'));
                el.id = 'spotify-canvas-video-next';
                el.style.opacity = '0';
                el.style.transition = 'opacity 700ms ease, transform 1000ms ease, filter 700ms ease';
                shell.prepend(el);
                const reveal = () => {
                    requestAnimationFrame(() => {
                        el.style.opacity = mode === 'iframe' ? '0.82' : '0.88';
                        el.style.transform = 'scale(1.105)';
                        oldNodes.forEach(old => { old.style.transition = 'opacity 420ms ease, filter 420ms ease'; old.style.opacity = '0'; old.style.filter = 'blur(8px)'; setTimeout(() => old.remove(), 460); });
                        el.id = 'spotify-canvas-video';
                    });
                };
                if (el.tagName === 'VIDEO') {
                    el.addEventListener('loadeddata', reveal, { once:true });
                    el.addEventListener('timeupdate', () => {
                        if (el.duration && el.duration - el.currentTime < 0.28) {
                            try { el.currentTime = 0.06; el.play().catch(()=>{}); } catch(e) {}
                        }
                    });
                    el.addEventListener('ended', () => { try { el.currentTime = 0.06; el.play().catch(()=>{}); } catch(e) {} });
                    setTimeout(reveal, 1200);
                } else {
                    el.addEventListener('load', reveal, { once:true });
                    setTimeout(reveal, 1400);
                }
            },

    spotifyCanvasClearVisual: () => {
                os.spotifyStopGifCycle && os.spotifyStopGifCycle();
                document.getElementById('spotify-canvas-source-hint')?.remove();
                os.spotifyCanvasRemoveVisuals(true);
            },

    spotifyResolveITunesVideo: async (artist, title) => {
                const key = `itunes:${artist} ${title}`.toLowerCase();
                if (os._spotifyVideoCache[key] !== undefined) return os._spotifyVideoCache[key];
                try {
                    const term = `${artist} ${title}`.replace(/\s+/g,' ').trim();
                    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=musicVideo&entity=musicVideo&limit=8`;
                    const r = await fetch(url, { signal: AbortSignal.timeout(7000) });
                    if (!r.ok) throw new Error('iTunes HTTP ' + r.status);
                    const j = await r.json();
                    const norm = s => String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
                    const nt = norm(title), na = norm(artist);
                    const results = (j.results || []).filter(v => v.previewUrl);
                    const pick = results.find(v => norm(v.trackName).includes(nt.slice(0,18)) || nt.includes(norm(v.trackName).slice(0,18))) || results.find(v => norm(v.artistName).includes(na.split(' ')[0])) || results[0];
                    const out = pick ? { type:'itunes', url:pick.previewUrl, page:pick.trackViewUrl, artwork:(pick.artworkUrl100||'').replace('100x100','600x600'), title:pick.trackName, artist:pick.artistName } : null;
                    os._spotifyVideoCache[key] = out;
                    return out;
                } catch(e) { os._spotifyVideoCache[key] = null; return null; }
            },

    spotifyParseDurationSeconds: (v) => {
                if (typeof v === 'number') return v > 10000 ? Math.round(v/1000) : Math.round(v);
                const s = String(v || '').trim();
                if (!s) return 0;
                const parts = s.split(':').map(n=>parseInt(n,10)).filter(n=>!isNaN(n));
                if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
                if (parts.length === 2) return parts[0]*60 + parts[1];
                return parseInt(s,10) || 0;
            },

    spotifyBestStartSeconds: async (videoId, duration=0) => {
                // YouTube's exact "most replayed" heatmap is not officially exposed to static frontends.
                // Workaround: query public Piped stream metadata, prefer chorus/drop-like chapters if present,
                // otherwise jump near the high-retention region where official videos usually hit the hook.
                const instances = ['https://pipedapi.kavin.rocks','https://pipedapi.adminforge.de','https://pipedapi.syncpundit.io'];
                for (const base of instances) {
                    try {
                        const r = await fetch(`${base}/streams/${videoId}`, { signal: AbortSignal.timeout(5500) });
                        if (!r.ok) throw new Error('streams blocked');
                        const j = await r.json();
                        duration = os.spotifyParseDurationSeconds(j.duration || j.lengthSeconds || duration);
                        const chapters = j.chapters || j.videoStreams?.chapters || [];
                        const hit = chapters.find(c => /chorus|hook|drop|solo|dance|visualizer|music/i.test(c.title || c.name || ''));
                        const ts = hit?.start || hit?.startTime || hit?.start_time;
                        if (Number.isFinite(Number(ts))) return Math.max(0, Math.floor(Number(ts)));
                    } catch(e) {}
                }
                const d = os.spotifyParseDurationSeconds(duration);
                if (!d || d < 75) return 0;
                return Math.min(Math.max(35, Math.floor(d * 0.32)), Math.max(0, d - 45));
            },

    spotifyResolveVideoId: async (artist, title) => {
                const key = `yt:${artist} ${title}`.toLowerCase();
                if (os._spotifyVideoCache[key] !== undefined) return os._spotifyVideoCache[key];
                const query = `${artist} ${title} official music video visualizer`;
                const instances = ['https://pipedapi.kavin.rocks','https://pipedapi.adminforge.de','https://pipedapi.syncpundit.io'];
                for (const base of instances) {
                    try {
                        const r = await fetch(`${base}/search?q=${encodeURIComponent(query)}&filter=videos`, { signal: AbortSignal.timeout(6500) });
                        if (!r.ok) throw new Error('search blocked');
                        const data = await r.json();
                        const vids = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
                        const scored = vids.map(v => {
                            const text = `${v.title||''} ${v.uploaderName||v.uploader||''}`.toLowerCase();
                            let score = 0;
                            if (text.includes('official')) score += 5;
                            if (text.includes('music video')) score += 4;
                            if (text.includes('visualizer')) score += 3;
                            if (text.includes(String(artist).toLowerCase().split(' ')[0])) score += 2;
                            if (text.includes(String(title).toLowerCase().split(' ')[0])) score += 2;
                            if (text.includes('lyrics')) score -= 1;
                            return {v, score};
                        }).sort((a,b)=>b.score-a.score);
                        const pick = scored[0]?.v || vids[0];
                        const raw = pick?.url || pick?.id || '';
                        const id = (String(raw).match(/(?:v=|\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)||[])[1] || (String(raw).match(/^[a-zA-Z0-9_-]{11}$/)?raw:'');
                        if (id) { os._spotifyVideoCache[key] = { type:'youtube', id, title:pick.title||'', uploader:pick.uploaderName||pick.uploader||'', duration: os.spotifyParseDurationSeconds(pick.duration || pick.durationText || pick.lengthSeconds || 0) }; return os._spotifyVideoCache[key]; }
                    } catch(e) {}
                }
                os._spotifyVideoCache[key] = null;
                return null;
            },

    initSpotifyCanvas: async (coverUrl='', title='Unknown Track', artist='Unknown Artist') => {
                const shell = document.getElementById('spotify-canvas-shell');
                if (!shell) return;
                const canvasToken = (os._spotifyCanvasToken = (os._spotifyCanvasToken || 0) + 1);
                os.spotifyStopGifCycle && os.spotifyStopGifCycle();
                os._spotifyCanvasSetToggleState && os._spotifyCanvasSetToggleState();
                const bg = document.getElementById('spotify-canvas-bg');
                const t = document.getElementById('spotify-canvas-title');
                const a = document.getElementById('spotify-canvas-artist');
                const st = document.getElementById('spotify-canvas-state');
                if (bg && coverUrl) bg.style.backgroundImage = `url('${coverUrl}')`;
                if (t) t.textContent = title || 'Unknown Track';
                if (a) a.textContent = artist || 'Unknown Artist';
                if (st) st.textContent = 'resolving real video';
                const cleanTitle = String(title||'').replace(/\s*\(.*?\)|\s*\[.*?\]|-\s*remaster.*$/ig,'').trim();
                if (os._spotifyCanvasRaf) cancelAnimationFrame(os._spotifyCanvasRaf);
                os.spotifyCanvasClearVisual && os.spotifyCanvasClearVisual();
                const canvas = document.getElementById('spotify-canvas-visual');

                const itunes = await os.spotifyResolveITunesVideo(artist, cleanTitle);
                if (canvasToken !== os._spotifyCanvasToken) return;
                if (itunes?.url) {
                    const v = document.createElement('video');
                    v.className = 'absolute inset-0 w-full h-full object-cover scale-110 pointer-events-none';
                    v.src = itunes.url;
                    v.muted = true; v.autoplay = true; v.loop = false; v.playsInline = true; v.crossOrigin = 'anonymous'; v.preload = 'auto';
                    os.spotifyCanvasMountVisual(v, 'video');
                    v.play().catch(()=>{});
                    if (canvas) canvas.style.display='none';
                    if (bg && (itunes.artwork || coverUrl)) bg.style.backgroundImage = `url('${itunes.artwork || coverUrl}')`;
                    if (st) st.textContent = 'Apple/iTunes video preview';
                    const hint = document.getElementById('spotify-canvas-source-hint') || document.createElement('div');
                    hint.id = 'spotify-canvas-source-hint';
                    hint.className = 'absolute left-2 bottom-12 max-w-[calc(100%-1rem)] truncate text-[7px] text-gray-400 uppercase tracking-widest bg-black/30 border border-white/5 px-2 py-0.5 rounded-full pointer-events-none opacity-70';
                    hint.textContent = 'source: real music-video preview';
                    shell.appendChild(hint);
                    return;
                }

                const yt = await os.spotifyResolveVideoId(artist, cleanTitle);
                if (canvasToken !== os._spotifyCanvasToken) return;
                if (yt?.id) {
                    const frame = document.createElement('iframe');
                    frame.className = 'absolute inset-0 w-full h-full border-0 scale-125 pointer-events-none';
                    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
                    frame.referrerPolicy = 'strict-origin-when-cross-origin';
                    const startAt = await os.spotifyBestStartSeconds(yt.id, yt.duration || 0);
                    if (canvasToken !== os._spotifyCanvasToken) return;
                    const loopEnd = yt.duration ? Math.max(startAt + 18, Math.min(startAt + 42, yt.duration - 2)) : '';
                    frame.src = `https://www.youtube-nocookie.com/embed/${yt.id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${yt.id}&modestbranding=1&rel=0&playsinline=1&start=${startAt}${loopEnd ? '&end=' + loopEnd : ''}`;
                    os.spotifyCanvasMountVisual(frame, 'iframe');
                    if (canvas) canvas.style.display='none';
                    if (st) st.textContent = startAt ? 'YouTube video · hook segment' : 'YouTube official video';
                    return;
                }

                if (os.spotifyAnimeGifEnabled()) {
                    const gif = await os.spotifyResolveNekosGif(cleanTitle, artist);
                    if (canvasToken !== os._spotifyCanvasToken) return;
                    if (gif) { os.spotifyCanvasAnimeGif(gif, title, artist, { token: canvasToken }); return; }
                }
                if (st) st.textContent = 'fallback visual';
                os.spotifyCanvasFallback(coverUrl, title, artist);
            },

    spotifyCanvasAnimeGif: (gifData='', title='Unknown Track', artist='Unknown Artist', opts={}) => {
                os.spotifyStopGifCycle && os.spotifyStopGifCycle();
                const token = opts.token || os._spotifyCanvasToken || 0;
                const meta = (gifData && typeof gifData === 'object') ? gifData : { url: gifData, mood: 'anime', query: 'legacy gif url', api: 'nekos.best' };
                const gifUrl = meta.url || '';
                const shell = document.getElementById('spotify-canvas-shell');
                if (!shell || !gifUrl) return;
                if (os._spotifyCanvasRaf) cancelAnimationFrame(os._spotifyCanvasRaf);
                document.getElementById('spotify-canvas-source-hint')?.remove();
                const canvas = document.getElementById('spotify-canvas-visual'); if (canvas) canvas.style.display='none';
                const img = document.createElement('img');
                img.src = gifUrl;
                img.className = 'absolute inset-0 w-full h-full object-cover scale-110 pointer-events-none';
                os.spotifyCanvasMountVisual(img, 'gif');
                const bg = document.getElementById('spotify-canvas-bg'); if (bg) bg.style.backgroundImage = `url('${gifUrl}')`;
                const st = document.getElementById('spotify-canvas-state'); if (st) st.textContent = `GIF mood: ${meta.mood || meta.category || 'anime'}`;
                const hint = document.getElementById('spotify-canvas-source-hint') || document.createElement('div');
                hint.id = 'spotify-canvas-source-hint';
                hint.className = 'absolute left-2 bottom-12 max-w-[calc(100%-1rem)] truncate text-[7px] text-gray-300 uppercase tracking-widest bg-black/35 border border-white/5 px-2 py-0.5 rounded-full pointer-events-none opacity-75';
                const anime = meta.anime ? ` · anime: ${meta.anime}` : '';
                hint.textContent = `mood query: ${meta.query || meta.mood || 'anime'} · ${meta.api || 'nekos.best'}${anime}`;
                hint.title = hint.textContent;
                shell.appendChild(hint);
                os.spotifyScheduleNextGif && os.spotifyScheduleNextGif(title, artist, token);
                os.logTerminal && os.logTerminal(`Spotify Canvas GIF: mood=${meta.mood || meta.category || 'anime'} query="${meta.query || ''}"`);
            },

    spotifyCanvasFallback: (coverUrl='', title='Unknown Track', artist='Unknown Artist') => {
                const canvas = document.getElementById('spotify-canvas-visual');
                const shell = document.getElementById('spotify-canvas-shell');
                if (!canvas || !shell) return;
                document.getElementById('spotify-canvas-source-hint')?.remove();
                os.spotifyCanvasClearVisual && os.spotifyCanvasClearVisual();
                canvas.style.display='block';
                canvas.style.opacity='0';
                canvas.style.transition='opacity 700ms ease';
                requestAnimationFrame(()=>canvas.style.opacity='1');
                if (os._spotifyCanvasRaf) cancelAnimationFrame(os._spotifyCanvasRaf);
                const ctx = canvas.getContext('2d');
                const resize = () => { const r=shell.getBoundingClientRect(); canvas.width=Math.max(220, r.width*devicePixelRatio); canvas.height=Math.max(160, r.height*devicePixelRatio); ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); };
                resize();
                const seed = Array.from((title+artist)||'aether').reduce((n,ch)=>n+ch.charCodeAt(0),0);
                const blobs = Array.from({length:18},(_,i)=>({a:(i*37+seed)%360,r:22+((i*13+seed)%80),s:.25+((i*7)%9)/20,w:1+((i+seed)%4),o:.16+((i%5)/18)}));
                const img = new Image(); img.crossOrigin='anonymous'; if (coverUrl) img.src=coverUrl;
                const loop = (now) => { if (!document.getElementById('spotify-canvas-visual')) return; const W=shell.clientWidth,H=shell.clientHeight,cx=W/2,cy=H/2; ctx.clearRect(0,0,W,H); const grd=ctx.createRadialGradient(cx,cy,10,cx,cy,Math.max(W,H)); grd.addColorStop(0,'rgba(255,255,255,.10)'); grd.addColorStop(.45,'rgba(34,197,94,.08)'); grd.addColorStop(1,'rgba(0,0,0,.85)'); ctx.fillStyle=grd; ctx.fillRect(0,0,W,H); if (img.complete && img.naturalWidth) { ctx.save(); ctx.globalAlpha=.16; ctx.filter='blur(8px) saturate(1.4)'; const scale=Math.max(W/img.width,H/img.height)*1.18; ctx.drawImage(img,cx-img.width*scale/2,cy-img.height*scale/2,img.width*scale,img.height*scale); ctx.restore(); } ctx.save(); ctx.translate(cx,cy); ctx.rotate(now*.00008); blobs.forEach((b,i)=>{ const ang=(b.a+now*.025*b.s)*Math.PI/180; const rr=b.r+Math.sin(now*.001+i)*18; const x=Math.cos(ang)*rr, y=Math.sin(ang)*rr*.75; const g=ctx.createRadialGradient(x,y,0,x,y,34+b.w*10); g.addColorStop(0,`rgba(74,222,128,${b.o+.10})`); g.addColorStop(.55,`rgba(255,255,255,${b.o*.55})`); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,36+b.w*8,0,Math.PI*2); ctx.fill(); }); ctx.restore(); os._spotifyCanvasRaf=requestAnimationFrame(loop); };
                window.addEventListener('resize', resize, {passive:true}); os._spotifyCanvasRaf=requestAnimationFrame(loop);
            },

    fetchRadioPlazaMetadata: async () => {
                if (SystemState.settings.media_tuner_station !== 'plaza') return;
                
                const url = 'https://api.plaza.one/status';
                const trackDisplay = document.getElementById('media-track');
                const artistDisplay = document.getElementById('media-artist');
                const coverArt = document.getElementById('media-art-cover');
                const ledText = document.getElementById('radio-station-uplink-status');

                const miniTitle = document.getElementById('mini-track-title');
                const miniArtist = document.getElementById('mini-artist-name');
                const miniCover = document.getElementById('mini-cover-art');
                const miniCoverFallback = document.getElementById('mini-cover-fallback');

                let fullArtUrl = '';
                if (coverArt && coverArt.style.backgroundImage && coverArt.style.backgroundImage.includes('nekos.best')) {
                    fullArtUrl = coverArt.style.backgroundImage.replace(/(url\(|"|'|\))/ig, '');
                }

                try {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error('HTTP Status Alert');
                    const data = await response.json();
                    
                    const song = data.song || {};
                    const title = song.title || 'Vaporwave Horizon';
                    const artist = song.artist || 'Plaza Artist';
                    const rawArt = song.artwork_src || song.artwork || '';
                    fullArtUrl = rawArt ? (rawArt.startsWith('http') ? rawArt : `https://plaza.one${rawArt}`) : fullArtUrl;

                    if (!fullArtUrl) {
                        try { fullArtUrl = await os.resolveAlbumArtworkFallback(artist, title, ''); } catch(e) {}
                    }

                    if (trackDisplay) trackDisplay.innerText = title;
                    if (artistDisplay) artistDisplay.innerText = artist;
                    if (miniTitle) miniTitle.innerText = title;
                    if (miniArtist) miniArtist.innerText = artist;
                    if (ledText) ledText.innerText = 'CONNECTED';

                    if (fullArtUrl) {
                        if (coverArt) {
                            coverArt.style.backgroundImage = `url('${fullArtUrl}')`;
                            coverArt.classList.remove('hidden');
                        }
                        if (miniCover) {
                            miniCover.src = fullArtUrl;
                            miniCover.classList.remove('hidden');
                        }
                        if (miniCoverFallback) miniCoverFallback.classList.add('hidden');
                    } else {
                        if (coverArt) coverArt.classList.add('hidden');
                        if (miniCover) miniCover.classList.add('hidden');
                        if (miniCoverFallback) miniCoverFallback.classList.remove('hidden');
                    }

                    os.initSpotifyCanvas(fullArtUrl, title, artist);
                    os.logTerminal('Tuner: Nightwave Plaza live metadata synced.');
                    if (SystemState.settings.media_player_mode === 'player') {
                        setTimeout(() => os.attemptFullTrackPlayback(), 400);
                    }

                } catch (err) {
                    if (trackDisplay) trackDisplay.innerText = 'Nightwave Plaza Live';
                    if (artistDisplay) artistDisplay.innerText = 'Vaporwave FM';
                    if (ledText) ledText.innerText = 'ICY SOURCE';

                    if (!fullArtUrl) {
                        try {
                            const res = await fetch(`https://nekos.best/api/v2/dance`);
                            if (res.ok) {
                                const gifData = await res.json();
                                if (gifData.results && gifData.results.length > 0) {
                                    fullArtUrl = gifData.results[0].url;
                                    if (coverArt) {
                                        coverArt.style.backgroundImage = `url('${fullArtUrl}')`;
                                        coverArt.classList.remove('hidden');
                                    }
                                    if (miniCover) {
                                        miniCover.src = fullArtUrl;
                                        miniCover.classList.remove('hidden');
                                    }
                                    if (miniCoverFallback) miniCoverFallback.classList.add('hidden');
                                }
                            }
                        } catch (e) {}
                    }
                }
            },

    prevTrack: () => {
                os.logTerminal('Tuner Core: Skipped to previous track vector.');
                os.fetchLastFmData();
            },

    nextTrack: () => {
                os.logTerminal('Tuner Core: Skipped to next track vector.');
                os.fetchLastFmData();
            },

    startSpectrograph: () => {
                if (os.spectrographInterval) clearInterval(os.spectrographInterval);
                
                const spect = document.getElementById('media-spectrograph');
                if (!spect) return;

                spect.innerHTML = Array(12).fill(0).map(() => `<div class="spect-bar flex-1 bg-green-400 opacity-60 h-full transition-transform duration-100" style="transform: scaleY(0.15); transform-origin: bottom; will-change: transform;"></div>`).join('');

                const bars = spect.getElementsByClassName('spect-bar');
                os.spectrographInterval = setInterval(() => {
                    const activeStation = SystemState.settings.media_tuner_station;
                    const isPlaying = activeStation === 'external' || (os.audioStream && !os.audioStream.paused);
                    
                    for (let i = 0; i < bars.length; i++) {
                        const baseVal = isPlaying ? 0.2 : 0.05;
                        const randomHeight = baseVal + (isPlaying ? Math.random() * 0.8 : Math.random() * 0.1);
                        bars[i].style.transform = `scaleY(${randomHeight})`;
                    }
                }, 120);
            },

    lyricNormalize: (s='') => String(s).replace(/\[[^\]]*\]/g,'').replace(/\([^)]*(remaster|radio edit|explicit|clean|feat\.?|ft\.?)[^)]*\)/ig,'').replace(/\s+-\s+.*$/,'').replace(/[^\p{L}\p{N}\s'&]/gu,' ').replace(/\s+/g,' ').trim(),

    parseLrcLyrics: (lrcText) => {
                const out=[]; const lines=String(lrcText||'').split(/\r?\n/);
                lines.forEach(raw=>{
                    const tags=[...raw.matchAll(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g)];
                    const text=raw.replace(/\[[^\]]+\]/g,'').trim();
                    if(!tags.length || !text) return;
                    tags.forEach(t=>{ const ms=t[3]?Number((t[3]+'00').slice(0,3))/1000:0; out.push({time:Number(t[1])*60+Number(t[2])+ms,text}); });
                });
                return out.sort((a,b)=>a.time-b.time).filter((l,i,a)=>!i || Math.abs(l.time-a[i-1].time)>.08 || l.text!==a[i-1].text);
            },

    parsePlainLyrics: (plainText, duration=220) => {
                let lines=String(plainText||'').split(/\r?\n/).map(l=>l.trim()).filter(Boolean)
                    .filter(l=>!/^\[?(verse|chorus|bridge|intro|outro|hook|instrumental)/i.test(l));
                if(!lines.length) return [];
                const total=Math.max(75, Number(duration)||220), intro=Math.min(10,total*.06), outro=Math.min(8,total*.04);
                const weights=lines.map(l=>Math.max(1.8, Math.min(7.5, 1.15 + l.length/18)));
                const sum=weights.reduce((a,b)=>a+b,0), span=Math.max(45,total-intro-outro);
                let t=intro;
                return lines.map((line,i)=>{ const item={time:t,text:line}; t += span*(weights[i]/sum); return item; });
            },

    lyricsGetBestCandidate: async (artist,title) => {
                const cleanArtist=os.lyricNormalize(artist), cleanTitle=os.lyricNormalize(title);
                const candidates=[];
                try {
                    const search=await fetch(`https://lrclib.net/api/search?artist_name=${encodeURIComponent(cleanArtist)}&track_name=${encodeURIComponent(cleanTitle)}`);
                    if(search.ok){ const arr=await search.json(); if(Array.isArray(arr)) candidates.push(...arr); }
                } catch(e) {}
                try {
                    const lookup=await fetch(`https://lrclib.net/api/lookup?artist_name=${encodeURIComponent(cleanArtist)}&track_name=${encodeURIComponent(cleanTitle)}`);
                    if(lookup.ok) candidates.unshift(await lookup.json());
                } catch(e) {}
                const scoreText=(v='')=>os.lyricNormalize(v).toLowerCase(); const ca=scoreText(cleanArtist), ct=scoreText(cleanTitle);
                candidates.forEach(c=>{ let sc=0; const ta=scoreText(c.artistName), tt=scoreText(c.trackName); if(ta===ca)sc+=45; else if(ta.includes(ca)||ca.includes(ta))sc+=25; if(tt===ct)sc+=55; else if(tt.includes(ct)||ct.includes(tt))sc+=32; if(c.syncedLyrics)sc+=35; if(c.plainLyrics)sc+=8; c._score=sc; });
                return candidates.sort((a,b)=>(b._score||0)-(a._score||0))[0] || null;
            },

    fetchTrackLyrics: async (artist, title) => {
                const scroller=document.getElementById('media-lyric-scroller'); if(!scroller) return;
                scroller.innerHTML=`<div class="space-y-2 animate-pulse py-6 px-2"><div class="h-3 bg-white/5 rounded w-[90%]"></div><div class="h-3 bg-white/10 rounded w-[80%]"></div><div class="h-3 bg-white/5 rounded w-[85%]"></div><div class="text-[8px] text-os-accent uppercase tracking-widest pt-2">Negotiating lyric timeline...</div></div>`;
                os.mediaLyricsParsed=[]; os.mediaLyricActiveIdx=-1; os.mediaLyricOffset=0; os.mediaLyricSource='NONE';
                const cleanArtist=os.lyricNormalize(artist), cleanTitle=os.lyricNormalize(title);
                let duration=Number(os.mediaPlaybackDuration)||220;
                try{
                    const best=await os.lyricsGetBestCandidate(cleanArtist, cleanTitle);
                    if(best){ duration=Number(best.duration)||duration; if(best.syncedLyrics){ os.mediaLyricsParsed=os.parseLrcLyrics(best.syncedLyrics); os.mediaLyricSource=`LRCLIB_SYNC:${Math.round(best._score||0)}`; } else if(best.plainLyrics){ os.mediaLyricsParsed=os.parsePlainLyrics(best.plainLyrics,duration); os.mediaLyricSource=`LRCLIB_PLAIN:${Math.round(best._score||0)}`; } }
                    if(!os.mediaLyricsParsed.length){
                        const resOvh=await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`);
                        if(resOvh.ok){ const j=await resOvh.json(); if(j.lyrics){ os.mediaLyricsParsed=os.parsePlainLyrics(j.lyrics,duration); os.mediaLyricSource='LYRICS_OVH_PLAIN'; }}
                    }
                    if(os.mediaLyricsParsed.length){
                        scroller.innerHTML=os.mediaLyricsParsed.map((line,idx)=>`<div class="lyric-line lyric-future transition-all duration-300 hover:text-white cursor-none hover-target text-[10px]" data-idx="${idx}" onclick="os.clickLyricLine(this)">${os.fmEscape?os.fmEscape(line.text):line.text.replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))}</div>`).join('');
                        const src=scroller.parentElement?.querySelector('.border-t span:first-child'); if(src) src.innerText=`SRC: ${os.mediaLyricSource}`;
                        os.logTerminal(`Lyrics Engine: loaded ${os.mediaLyricsParsed.length} lines via ${os.mediaLyricSource}.`);
                        os.startPlaybackTimer(duration, { preservePosition:false });
                        os.syncLyricsToPlayback(true);
                        setTimeout(() => os.refreshSpotifyGifForCurrentTrack && os.refreshSpotifyGifForCurrentTrack(), 250);
                        return;
                    }
                    throw new Error('No lyric candidates matched.');
                }catch(e){
                    scroller.innerHTML=`<div class="h-full flex flex-col justify-center items-center text-center py-10 text-gray-500 text-[10px] uppercase"><i data-lucide="music" class="w-6 h-6 opacity-30 mb-2"></i>Instrumental frequency detected // Lyrics unmapped<br><span class="text-[8px] text-gray-600 normal-case mt-1">${e.message}</span></div>`;
                    lucide.createIcons({root:scroller}); os.startPlaybackTimer(duration,{preservePosition:false});
                }
            },

    startPlaybackTimer: (durationSeconds, opts={}) => {
                if(os.playbackTimerInterval) clearInterval(os.playbackTimerInterval);
                os.mediaPlaybackDuration=Number(durationSeconds)||220;
                if(!opts.preservePosition){ os.mediaPlaybackStartedAt=performance.now(); os.mediaPlaybackBase=0; os.mediaPlaybackElapsed=0; }
                const totalLabel=document.getElementById('media-total-time'); if(totalLabel){ const d=os.mediaPlaybackDuration; totalLabel.innerText=`${Math.floor(d/60)}:${String(Math.floor(d%60)).padStart(2,'0')}`; }
                const tick=()=>{
                    const activeStation=SystemState.settings.media_tuner_station;
                    // In PLAYER mode with iframe player, the timer is simulated (iframe doesn't expose time)
                    const isPlayerMode = SystemState.settings.media_player_mode === 'player';
                    const hasIframePlayer = !!document.getElementById('media-full-player-iframe');
                    if (isPlayerMode && hasIframePlayer) {
                        // Iframe player is active — drive timer from simulation
                        os.mediaPlaybackElapsed=(os.mediaPlaybackBase||0)+(performance.now()-(os.mediaPlaybackStartedAt||performance.now()))/1000;
                        // Cap at duration so it doesn't run forever if iframe doesn't signal end
                        if (os.mediaPlaybackElapsed > os.mediaPlaybackDuration) os.mediaPlaybackElapsed = os.mediaPlaybackDuration;
                        os.updateMediaTimeUI(); os.syncLyricsToPlayback();
                        return;
                    }
                    // In PLAYER mode with actual audio track (legacy audio element), the audio element drives time via ontimeupdate
                    const hasActiveAudio = os.audioStream && !os.audioStream.paused && os.audioStream.src && os._currentTrackAudio;
                    if (isPlayerMode && hasActiveAudio) {
                        if (isNaN(os.audioStream.duration) || os.audioStream.duration <= 0) {
                            os.updateMediaTimeUI(); os.syncLyricsToPlayback();
                        }
                        return;
                    }
                    const isPlaying=activeStation==='external'||(os.audioStream&&!os.audioStream.paused)||(activeStation==='lastfm' && os.mediaIsNowPlaying !== false);
                    if(isPlaying){
                        os.mediaPlaybackElapsed=(os.mediaPlaybackBase||0)+(performance.now()-(os.mediaPlaybackStartedAt||performance.now()))/1000;
                        os.updateMediaTimeUI(); os.syncLyricsToPlayback();
                    }
                };
                tick(); os.playbackTimerInterval=setInterval(tick,250);
            },

    updateMediaTimeUI: () => {
                const progressBar=document.getElementById('media-progress-bar'), timeLabel=document.getElementById('media-playback-time');
                const elapsed=Math.max(0,os.mediaPlaybackElapsed||0), duration=Math.max(1,os.mediaPlaybackDuration||220);
                if(progressBar) progressBar.style.width=`${Math.max(0,Math.min(100,(elapsed/duration)*100))}%`;
                if(timeLabel){ const m=Math.floor(elapsed/60), s=Math.floor(elapsed%60); timeLabel.innerText=`${m}:${String(s).padStart(2,'0')}`; }
            },

    syncLyricsToPlayback: (force=false) => {
                const scroller=document.getElementById('media-lyric-scroller'); if(!scroller||!os.mediaLyricsParsed?.length) return;
                const elapsed=(os.mediaPlaybackElapsed||0)+(os.mediaLyricOffset||0); let lo=0, hi=os.mediaLyricsParsed.length-1, activeIdx=0;
                while(lo<=hi){ const mid=(lo+hi)>>1; if(elapsed>=os.mediaLyricsParsed[mid].time){activeIdx=mid; lo=mid+1;} else hi=mid-1; }
                if(!force && activeIdx===os.mediaLyricActiveIdx) return;
                os.mediaLyricActiveIdx=activeIdx;
                const lines=scroller.getElementsByClassName('lyric-line');
                for(let i=0;i<lines.length;i++){ lines[i].classList.remove('lyric-active','lyric-past','lyric-future','opacity-100','opacity-30','scale-105','text-green-400','font-bold'); lines[i].classList.add(i<activeIdx?'lyric-past':i===activeIdx?'lyric-active':'lyric-future'); }
                const activeEl=lines[activeIdx]; if(activeEl) os.scrollAndHighlightLyricLine(activeEl, true);
            },

    scrollAndHighlightLyricLine: (el, alreadyClassed=false) => {
                const parent=el?.parentElement; if(!parent) return;
                if(!alreadyClassed){ const lines=parent.getElementsByClassName('lyric-line'); for(let i=0;i<lines.length;i++){lines[i].classList.remove('lyric-active','lyric-past','lyric-future'); lines[i].classList.add(i<Number(el.dataset.idx)?'lyric-past':i===Number(el.dataset.idx)?'lyric-active':'lyric-future');} }
                const target=el.offsetTop - parent.clientHeight*0.45 + el.offsetHeight/2;
                parent.scrollTo({top:Math.max(0,target), behavior:'smooth'});
            },

    clickLyricLine: (el) => {
                const idx=parseInt(el.getAttribute('data-idx'),10); if(!os.mediaLyricsParsed?.[idx]) return;
                const lyric=os.mediaLyricsParsed[idx]; os.mediaPlaybackBase=Math.max(0,lyric.time-(os.mediaLyricOffset||0)); os.mediaPlaybackStartedAt=performance.now(); os.mediaPlaybackElapsed=os.mediaPlaybackBase; os.mediaLyricActiveIdx=-1; os.updateMediaTimeUI(); os.syncLyricsToPlayback(true); os.logTerminal(`Lyrics Engine: manual lyric seek -> line ${idx+1} @ ${lyric.time.toFixed(2)}s`);
            },

    seekMedia: (e) => {
                const rect=e.currentTarget.getBoundingClientRect(); const pct=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));
                os.mediaPlaybackBase=pct*(os.mediaPlaybackDuration||220); os.mediaPlaybackStartedAt=performance.now(); os.mediaPlaybackElapsed=os.mediaPlaybackBase; os.mediaLyricActiveIdx=-1; os.updateMediaTimeUI(); os.syncLyricsToPlayback(true); os.logTerminal(`Tuner Core: Manual track head seek to ${Math.round(pct*100)}%`);
            },

    fetchLastFmUserProfile: async () => {
                const user = (SystemState.settings.api_lastfm_user || '').trim();
                const apiKey = (SystemState.settings.api_lastfm || '').trim();
                if (!user || !apiKey) return;

                const url = `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${encodeURIComponent(user)}&api_key=${encodeURIComponent(apiKey)}&format=json`;

                try {
                    const res = await fetch(url);
                    if (res.ok) {
                        const body = await res.json();
                        const profile = body.user || {};
                        const avatarUrl = profile.image?.[2]?.['#text'] || profile.image?.[1]?.['#text'] || '';
                        const safeAvatar = os.escapeHtml(avatarUrl || os._lfmFallbackImg(profile.name || user));
                        const card = document.getElementById('media-profile-card');
                        if (card) {
                            card.innerHTML = `
                                <img src="${safeAvatar}" class="w-10 h-10 rounded-full border border-white/10 shrink-0" onerror="this.style.display='none'">
                                <div class="space-y-0.5 overflow-hidden flex-1 font-mono text-[10px]">
                                    <div class="text-white font-bold uppercase truncate">${os.escapeHtml(profile.name || user)}</div>
                                    <div class="text-[8px] text-gray-500 uppercase flex justify-between">
                                        <span>Plays: ${parseInt(profile.playcount || 0, 10).toLocaleString()}</span>
                                        <span>${os.escapeHtml(profile.country || 'Global')}</span>
                                    </div>
                                </div>
                            `;
                        }
                    }
                } catch(e) {}
            },

    fetchLastFmData: async () => {
                if (SystemState.settings.media_tuner_station !== 'lastfm') return;

                const user = (SystemState.settings.api_lastfm_user || '').trim();
                const apiKey = (SystemState.settings.api_lastfm || '').trim();
                if (!user || !apiKey) {
                    os.renderLastFmDisconnectedState(!user ? 'Configure Last.fm username in System Config' : 'Configure Last.fm API key in System Config');
                    return;
                }

                const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(user)}&api_key=${encodeURIComponent(apiKey)}&format=json&limit=5`;

                const led = document.getElementById('console-status-led');
                if (led) {
                    led.className = "w-2 h-2 rounded-full bg-blue-500 animate-pulse";
                }

                try {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const data = await response.json();
                    if (data.error) throw new Error(data.message || `Last.fm error ${data.error}`);
                    const tracks = data.recenttracks?.track;
                    const totalScrobbles = parseInt(data.recenttracks?.['@attr']?.total || 0, 10);

                    if (!tracks || tracks.length === 0) {
                        throw new Error("No recent track records found.");
                    }

                    const latestTrack = tracks[0];
                    const isNowPlaying = latestTrack['@attr']?.nowplaying === 'true';
                    const isLoved = latestTrack.loved === '1';
                    const title = latestTrack.name;
                    const artist = latestTrack.artist?.['#text'] || "Unknown Artist";
                    const album = latestTrack.album?.['#text'] || "";
                    const coverUrl = os.sanitizeArtworkUrl(latestTrack.image?.[3]?.['#text'] || latestTrack.image?.[2]?.['#text'] || latestTrack.image?.[1]?.['#text'] || '');

                    os.updateAudioHardwareDOM(title, artist, album, coverUrl, isNowPlaying, isLoved, totalScrobbles, tracks);
                    os.logTerminal(`Live API: Successfully synced live scrobble telemetry from user "${user}"`);
                } catch (err) {
                    os.logTerminal(`Last.fm API unavailable: ${err.message}`);
                    os.renderLastFmDisconnectedState(`Last.fm unavailable (${err.message})`);
                }
            },

    updateAudioHardwareDOM: (title, artist, album, coverUrl, isNowPlaying, isLoved, totalCount, allTracks) => {
                if (SystemState.settings.media_tuner_station !== 'lastfm') return;
                os.mediaIsNowPlaying = !!isNowPlaying;
                coverUrl = os.sanitizeArtworkUrl(coverUrl);

                const currentRecord = {
                    title: title,
                    artist: artist,
                    album: album,
                    isLoved: isLoved,
                    coverUrl: coverUrl,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })
                };

                const trackId = `${title}-${artist}`.toLowerCase();
                const lastLogged = SystemState.history[0];
                const lastLoggedId = lastLogged ? `${lastLogged.title}-${lastLogged.artist}`.toLowerCase() : '';

                if (trackId !== lastLoggedId) {
                    SystemState.history.unshift(currentRecord);
                    if (SystemState.history.length > 50) SystemState.history.pop();
                    SystemState.save();
                    os.logTerminal(`Telemetry recorded played track: "${title}" - ${artist}`);
                }

                const trackDisplay = document.getElementById('media-track');
                const artistDisplay = document.getElementById('media-artist');
                const coverArt = document.getElementById('media-art-cover');
                const spokes = document.getElementById('spinning-spokes');
                const countVal = document.getElementById('scrobble-count-val');
                const liveInd = document.getElementById('live-indicator');
                const led = document.getElementById('console-status-led');
                const historyList = document.getElementById('scrobble-history-list');
                const lovedIcon = document.getElementById('media-loved-icon');

                const miniTitle = document.getElementById('mini-track-title');
                const miniArtist = document.getElementById('mini-artist-name');
                const miniCover = document.getElementById('mini-cover-art');
                const miniCoverFallback = document.getElementById('mini-cover-fallback');
                const miniIndicator = document.getElementById('mini-stream-indicator');

                if (trackDisplay) trackDisplay.innerText = title;
                if (artistDisplay) artistDisplay.innerText = `${artist} ${album ? '// ' + album : ''}`;

                const trackIdentifierKey = `${artist} - ${title}`.toLowerCase();
                const trackChanged = os.currentMediaTrackIdentifier !== trackIdentifierKey;
                if (trackChanged) {
                    os.currentMediaTrackIdentifier = trackIdentifierKey;
                    os._playerUserPaused = false; // new track should auto-play

                    // Set Blurry Ambient Background cover
                    const ambientBg = document.getElementById('media-ambient-bg');
                    if (ambientBg && coverUrl) {
                        ambientBg.style.backgroundImage = `url('${coverUrl}')`;
                    }

                    // Initialize spectrograph animations
                    os.startSpectrograph();

                    // Fetch lyrics (handles duration lookup, LRC mapping, and starting playback timer)
                    os.fetchTrackLyrics(artist, title);

                    // Fetch Last.fm User profile detailed statistics
                    os.fetchLastFmUserProfile();
                }

                if (SystemState.settings.media_player_mode === 'player' && SystemState.settings.media_tuner_station === 'lastfm') {
                    const shouldAttempt = trackChanged || os._pendingTrackPlayback;
                    if (shouldAttempt && !os._playerUserPaused) {
                        setTimeout(() => os.attemptFullTrackPlayback(), 400);
                    }
                }
                if (miniTitle) miniTitle.innerText = title;
                if (miniArtist) miniArtist.innerText = artist;

                if (lovedIcon) {
                    if (isLoved) lovedIcon.classList.remove('hidden');
                    else lovedIcon.classList.add('hidden');
                }

                if (coverUrl) {
                    if (coverArt) {
                        coverArt.style.backgroundImage = `url('${coverUrl}')`;
                        coverArt.classList.remove('hidden');
                    }
                    if (miniCover) {
                        miniCover.src = coverUrl;
                        miniCover.classList.remove('hidden');
                    }
                    if (miniCoverFallback) miniCoverFallback.classList.add('hidden');
                } else {
                    if (coverArt) coverArt.classList.add('hidden');
                    if (miniCover) miniCover.classList.add('hidden');
                    if (miniCoverFallback) miniCoverFallback.classList.remove('hidden');
                    // Missing Last.fm album art fallback chain: Last.fm track.getInfo → iTunes artwork → Deezer → nekos.best GIF.
                    os.resolveAlbumArtworkFallback(artist, title, album).then(url => {
                        if (url && os.currentMediaTrackIdentifier === `${artist} - ${title}`.toLowerCase()) os.applyMediaArtworkFallback(url, title, artist);
                    }).catch(()=>{});
                }

                os.initSpotifyCanvas(coverUrl, title, artist);
                os.verifyArtworkOrFallback(coverUrl, artist, title, album);

                if (isNowPlaying) {
                    if (liveInd) liveInd.classList.remove('hidden');
                    if (led) led.className = "w-2 h-2 rounded-full bg-green-500 animate-pulse";
                    if (miniIndicator) miniIndicator.className = "w-2 h-2 rounded-full bg-green-500 animate-pulse";
                    if (coverArt) coverArt.className = "absolute inset-0 bg-cover bg-center opacity-40 spinning-reel-fast";
                    if (spokes) spokes.className = "absolute inset-6 rounded-full border border-white/5 spinning-reel-fast pointer-events-none";
                } else {
                    if (liveInd) liveInd.classList.add('hidden');
                    if (led) led.className = "w-2 h-2 rounded-full bg-yellow-500";
                    if (miniIndicator) miniIndicator.className = "w-2 h-2 rounded-full bg-yellow-500";
                    if (coverArt) coverArt.className = "absolute inset-0 bg-cover bg-center opacity-40 spinning-reel";
                    if (spokes) spokes.className = "absolute inset-6 rounded-full border border-white/5 spinning-reel pointer-events-none";
                }

                if (countVal) {
                    countVal.innerText = totalCount.toLocaleString('en-US', { minimumIntegerDigits: 6 });
                }

                const timestamp = document.getElementById('telemetry-update-time');
                if (timestamp) {
                    timestamp.innerText = `SYNCED: ${new Date().toLocaleTimeString()}`;
                }

                if (historyList && allTracks) {
                    historyList.innerHTML = '';
                    const startIndex = isNowPlaying ? 1 : 0;
                    const historySlice = allTracks.slice(startIndex, startIndex + 4);

                    historySlice.forEach(item => {
                        const row = document.createElement('div');
                        row.className = 'flex justify-between items-center text-xs border-b border-white/5 pb-2 last:border-none';
                        const tName = item.name;
                        const tArtist = item.artist?.['#text'] || "Unknown";
                        const tAlbum = item.album?.['#text'] || "";
                        const tTime = item.date ? item.date['#text'] : "Just Played";
                        const tArt = item.image?.[1]?.['#text'] || item.image?.[0]?.['#text'] || "";
                        const tLoved = item.loved === '1';
                        
                        const artHtml = tArt ? `<img src="${os.escapeHtml(tArt)}" class="w-full h-full object-cover">` : `<i data-lucide="music" class="w-3 h-3 text-white/20"></i>`;

                        row.innerHTML = `
                            <div class="flex items-center gap-2 truncate max-w-[160px]">
                                <div class="w-6 h-6 rounded bg-os-800/85 flex-shrink-0 overflow-hidden flex items-center justify-center border border-white/10">
                                    ${artHtml}
                                </div>
                                <div class="truncate">
                                    <div class="flex items-center gap-1.5">
                                        <div class="text-white font-mono truncate text-[10px]">${os.escapeHtml(tName)}</div>
                                        ${tLoved ? `<i data-lucide="heart" class="w-2.5 h-2.5 text-red-500 fill-current flex-shrink-0"></i>` : ''}
                                    </div>
                                    <div class="text-[8px] text-gray-500 font-mono truncate uppercase">${os.escapeHtml(tArtist)} ${tAlbum ? '• '+os.escapeHtml(tAlbum) : ''}</div>
                                </div>
                            </div>
                            <span class="text-[8px] font-mono text-os-accent text-right whitespace-nowrap ml-2">${os.escapeHtml(tTime)}</span>
                        `;
                        historyList.appendChild(row);
                    });
                }
            },

    renderLastFmDisconnectedState: (reason = 'Last.fm unconfigured') => {
                os.mediaIsNowPlaying = false;
                const trackDisplay = document.getElementById('media-track');
                const artistDisplay = document.getElementById('media-artist');
                const countVal = document.getElementById('scrobble-count-val');
                const liveInd = document.getElementById('live-indicator');
                const led = document.getElementById('console-status-led');
                const historyList = document.getElementById('scrobble-history-list');
                const miniTitle = document.getElementById('mini-track-title');
                const miniArtist = document.getElementById('mini-artist-name');
                const miniIndicator = document.getElementById('mini-stream-indicator');
                if (trackDisplay) trackDisplay.innerText = 'Last.fm Disconnected';
                if (artistDisplay) artistDisplay.innerText = reason;
                if (countVal) countVal.innerText = '------';
                if (liveInd) liveInd.classList.add('hidden');
                if (led) led.className = 'w-2 h-2 rounded-full bg-gray-600';
                if (miniTitle) miniTitle.innerText = 'Idle';
                if (miniArtist) miniArtist.innerText = 'No active Last.fm uplink';
                if (miniIndicator) miniIndicator.className = 'w-2 h-2 rounded-full bg-gray-600';
                if (historyList) {
                    historyList.innerHTML = `<div class="text-[10px] font-mono text-gray-500 py-3 text-center">${os.escapeHtml(reason)}</div>`;
                }
            }
});
