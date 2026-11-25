// AetherOS — Last.fm Scrobble Analytics, Listening Clock, Heatmap, Treemaps & Neighbor Graph
window.extendOS({
    _lastFmMetricsCache: null,

    _lastFmMetricsLoading: false,

    _lastFmMetricsError: null,

    _lastFmMetricsLastUser: null,

    _activeMetricsTab: 'visuals',

    _activeTimeframeTab: 'overall',

    _activeReportTab: 'week',

    _activeArtistTreemapTimeframe: 'all',

    _activeAlbumTreemapTimeframe: 'all',

    _fallbackImageCache: {},

    fetchArtistImage: async (artistName) => {
                try {
                    const encodedName = encodeURIComponent(artistName);
                    const res = await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        const callbackName = `deezer_art_${Math.floor(Math.random() * 1000000)}`;
                        
                        window[callbackName] = (data) => {
                            document.body.removeChild(script);
                            delete window[callbackName];
                            resolve(data);
                        };
                        
                        script.src = `https://api.deezer.com/search/artist?q=${encodedName}&limit=1&output=jsonp&callback=${callbackName}`;
                        script.onerror = () => {
                            document.body.removeChild(script);
                            delete window[callbackName];
                            reject();
                        };
                        document.body.appendChild(script);
                    });
                    return res?.data?.[0]?.picture_medium || null;
                } catch (e) {
                    return null;
                }
            },

    fetchAlbumImage: async (albumName, artistName) => {
                try {
                    const query = `${artistName} - ${albumName}`;
                    const encoded = encodeURIComponent(query);
                    const res = await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        const callbackName = `deezer_alb_${Math.floor(Math.random() * 1000000)}`;
                        
                        window[callbackName] = (data) => {
                            document.body.removeChild(script);
                            delete window[callbackName];
                            resolve(data);
                        };
                        
                        script.src = `https://api.deezer.com/search/album?q=${encoded}&limit=1&output=jsonp&callback=${callbackName}`;
                        script.onerror = () => {
                            document.body.removeChild(script);
                            delete window[callbackName];
                            reject();
                        };
                        document.body.appendChild(script);
                    });
                    return res?.data?.[0]?.cover_medium || null;
                } catch (e) {
                    return null;
                }
            },

    fetchTrackImage: async (trackName, artistName) => {
                try {
                    const query = `${artistName} - ${trackName}`;
                    const encoded = encodeURIComponent(query);
                    const res = await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        const callbackName = `deezer_trk_${Math.floor(Math.random() * 1000000)}`;
                        
                        window[callbackName] = (data) => {
                            document.body.removeChild(script);
                            delete window[callbackName];
                            resolve(data);
                        };
                        
                        script.src = `https://api.deezer.com/search/track?q=${encoded}&limit=1&output=jsonp&callback=${callbackName}`;
                        script.onerror = () => {
                            document.body.removeChild(script);
                            delete window[callbackName];
                            reject();
                        };
                        document.body.appendChild(script);
                    });
                    return res?.data?.[0]?.album?.cover_medium || null;
                } catch (e) {
                    return null;
                }
            },

    _fetchJSONP: (url) => {
                return new Promise((resolve, reject) => {
                    const callbackName = `dz_cb_${Math.random().toString(36).slice(2, 11)}`;
                    const script = document.createElement('script');
                    
                    window[callbackName] = (data) => {
                        resolve(data);
                        cleanup();
                    };

                    script.onerror = () => {
                        reject(new Error(`JSONP failed for ${url}`));
                        cleanup();
                    };

                    const separator = url.includes('?') ? '&' : '?';
                    script.src = `${url}${separator}callback=${callbackName}`;
                    document.body.appendChild(script);

                    function cleanup() {
                        if (script.parentNode) script.parentNode.removeChild(script);
                        delete window[callbackName];
                    }
                });
            },

    fetchMusicImage: async (type, name, artist = '') => {
                const cacheKey = `${type}:${name}:${artist}`.toLowerCase();
                if (os._fallbackImageCache[cacheKey]) {
                    return os._fallbackImageCache[cacheKey];
                }

                let query = name;
                if (type === 'track' && artist) {
                    query = `${artist} - ${name}`;
                } else if (type === 'album' && artist) {
                    query = `${artist} - ${name}`;
                }

                // 1. Direct JSONP Deezer lookup (immune to CORS, incredibly fast!)
                try {
                    let deezerUrl = '';
                    if (type === 'artist') {
                        deezerUrl = `https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=1&output=jsonp`;
                    } else if (type === 'album') {
                        deezerUrl = `https://api.deezer.com/search/album?q=${encodeURIComponent(query)}&limit=1&output=jsonp`;
                    } else {
                        deezerUrl = `https://api.deezer.com/search/track?q=${encodeURIComponent(query)}&limit=1&output=jsonp`;
                    }

                    const data = await os._fetchJSONP(deezerUrl);
                    if (data && data.data && data.data.length > 0) {
                        const item = data.data[0];
                        let imgUrl = '';
                        if (type === 'artist' && item.picture_medium) {
                            imgUrl = item.picture_medium;
                        } else if (type === 'album' && item.cover_medium) {
                            imgUrl = item.cover_medium;
                        } else if (type === 'track' && item.album && item.album.cover_medium) {
                            imgUrl = item.album.cover_medium;
                        }
                        if (imgUrl) {
                            os._fallbackImageCache[cacheKey] = imgUrl;
                            return imgUrl;
                        }
                    }
                } catch (e) {
                    console.warn(`Deezer JSONP lookup failed for ${type} "${query}":`, e);
                }

                // 2. Fallback to iTunes Search API via AllOrigins
                try {
                    let itunesUrl = '';
                    if (type === 'artist') {
                        itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(name)}&entity=musicArtist&limit=1`;
                    } else if (type === 'album') {
                        itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=album&limit=1`;
                    } else {
                        itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`;
                    }

                    const alloriginsUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(itunesUrl)}`;
                    const res = await fetch(alloriginsUrl);
                    if (res.ok) {
                        const json = await res.json();
                        if (json && json.contents) {
                            const data = JSON.parse(json.contents);
                            if (data && data.results && data.results.length > 0) {
                                const result = data.results[0];
                                let imgUrl = '';
                                if (type === 'artist' && result.artworkUrl100) {
                                    imgUrl = result.artworkUrl100.replace('100x100bb.jpg', '500x500bb.jpg');
                                } else if (result.artworkUrl100) {
                                    imgUrl = result.artworkUrl100.replace('100x100bb.jpg', '500x500bb.jpg');
                                }
                                if (imgUrl) {
                                    os._fallbackImageCache[cacheKey] = imgUrl;
                                    return imgUrl;
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.warn(`iTunes fallback lookup failed for ${type} "${query}":`, e);
                }

                return null;
            },

    enrichFallbackImages: async (data) => {
                if (!data) return;

                const tasks = [];

                if (data.user && data.user.image && data.user.image.startsWith('data:image/svg+xml')) {
                    tasks.push({ type: 'artist', name: data.user.name, artist: '', ref: data.user });
                }

                if (data.recent) {
                    data.recent.forEach(t => {
                        if (t.image && t.image.startsWith('data:image/svg+xml')) {
                            tasks.push({ type: 'track', name: t.name, artist: t.artist, ref: t });
                        }
                    });
                }

                if (data.lovedTracks) {
                    data.lovedTracks.forEach(t => {
                        if (t.image && t.image.startsWith('data:image/svg+xml')) {
                            tasks.push({ type: 'track', name: t.name, artist: t.artist, ref: t });
                        }
                    });
                }

                if (data.obsessions) {
                    data.obsessions.forEach(t => {
                        if (t.image && t.image.startsWith('data:image/svg+xml')) {
                            tasks.push({ type: 'track', name: t.name, artist: t.artist, ref: t });
                        }
                    });
                }

                if (data.timeframeData) {
                    Object.values(data.timeframeData).forEach(tf => {
                        if (tf.artists) {
                            tf.artists.forEach(a => {
                                if (a.image && a.image.startsWith('data:image/svg+xml')) {
                                    tasks.push({ type: 'artist', name: a.name, artist: '', ref: a });
                                }
                            });
                        }
                        if (tf.albums) {
                            tf.albums.forEach(al => {
                                if (al.image && al.image.startsWith('data:image/svg+xml')) {
                                    tasks.push({ type: 'album', name: al.name, artist: al.artist, ref: al });
                                }
                            });
                        }
                        if (tf.tracks) {
                            tf.tracks.forEach(t => {
                                if (t.image && t.image.startsWith('data:image/svg+xml')) {
                                    tasks.push({ type: 'track', name: t.name, artist: t.artist, ref: t });
                                }
                            });
                        }
                    });
                }

                if (data.favouriteTaggedArtists) {
                    data.favouriteTaggedArtists.forEach(a => {
                        if (a.image && a.image.startsWith('data:image/svg+xml')) {
                            tasks.push({ type: 'artist', name: a.name, artist: '', ref: a });
                        }
                    });
                }

                if (tasks.length === 0) return;

                const concurrency = 5;
                let hasUpdates = false;

                for (let i = 0; i < tasks.length; i += concurrency) {
                    const chunk = tasks.slice(i, i + concurrency);
                    await Promise.all(chunk.map(async (task) => {
                        try {
                            const realImg = await os.fetchMusicImage(task.type, task.name, task.artist);
                            if (realImg) {
                                task.ref.image = realImg;
                                hasUpdates = true;
                            }
                        } catch (err) {
                            console.error('Image enrichment failed for', task.name, err);
                        }
                    }));

                    if (hasUpdates) {
                        os.renderMediaDashboard();
                    }
                }
            },

    showHeatmapDayDetails: async (dateStr, count) => {
                const modal = document.getElementById('heatmap-day-modal');
                const title = document.getElementById('heatmap-day-modal-title');
                const content = document.getElementById('heatmap-day-modal-content');
                if (!modal || !content || !title) return;

                const formattedDate = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                });

                title.innerText = formattedDate.toUpperCase();
                modal.classList.remove('hidden');
                modal.classList.add('flex');

                content.innerHTML = `
                    <div class="h-full flex flex-col items-center justify-center gap-3">
                        <i data-lucide="refresh-cw" class="w-8 h-8 animate-spin" style="color: var(--os-accent-custom); filter: drop-shadow(0 0 5px var(--os-accent-custom));"></i>
                        <p class="font-mono text-[10px] text-gray-400 uppercase tracking-widest">Querying chronological archives…</p>
                        <p class="font-mono text-[9px] text-gray-600">${count} scrobbles total</p>
                    </div>
                `;
                lucide && lucide.createIcons();
            


                try {
                    const dateObj = new Date(dateStr + 'T00:00:00');
                    const fromUnix = Math.floor(dateObj.getTime() / 1000);
                    const toUnix = fromUnix + 86400 - 1;

                    const res = await os._lfmApi('user.getrecenttracks', {
                        from: fromUnix,
                        to: toUnix,
                        limit: 200
                    });

                    let tracks = res?.recenttracks?.track || [];
                    if (!Array.isArray(tracks)) {
                        tracks = [tracks];
                    }

                    tracks = tracks.filter(t => t.date && t.date.uts);

                    if (tracks.length === 0) {
                        content.innerHTML = `
                            <div class="h-full flex flex-col items-center justify-center gap-2">
                                <i data-lucide="disc" class="w-8 h-8 text-gray-600"></i>
                                <p class="font-mono text-[10px] text-gray-500 uppercase">No precise track entries found for this period.</p>
                                <p class="font-mono text-[9px] text-gray-600">Estimated scrobbles: ${count}</p>
                            </div>
                        `;
                    } else {
                        let trackRows = tracks.map((t, i) => {
                            const trackName = t.name;
                            const artistName = t.artist?.['#text'] || t.artist?.name || '';
                            const albumName = t.album?.['#text'] || '';
                            const img = os._lfmPickImg(t.image, trackName);
                            const url = t.url || '#';
                            const timestamp = parseInt(t.date?.uts) * 1000;
                            const timeStr = new Date(timestamp).toLocaleTimeString('en-US', {
                                hour: '2-digit', minute: '2-digit'
                            });

                            return `
                                <a href="${url}" target="_blank" class="flex items-center gap-3 p-2 rounded bg-white/[0.02] border border-white/5 hover:border-cyan-500/20 transition cursor-none hover-target group">
                                    <div class="text-[9px] font-mono text-gray-500 w-12 shrink-0">${timeStr}</div>
                                    <img src="${img}" class="w-8 h-8 rounded object-cover shrink-0" onerror="this.src='${os._lfmFallbackImg(trackName)}'">
                                    <div class="flex-1 truncate">
                                        <div class="text-[10px] text-white font-bold truncate group-hover:text-cyan-300">${trackName}</div>
                                        <div class="text-[9px] text-gray-400 truncate">${artistName} ${albumName ? `· ${albumName}` : ''}</div>
                                    </div>
                                    <i data-lucide="external-link" class="w-3.5 h-3.5 text-gray-600 opacity-0 group-hover:opacity-100 transition shrink-0"></i>
                                </a>
                            `;
                        }).join('');

                        content.innerHTML = `
                            <div class="space-y-2">
                                <div class="flex justify-between items-center text-[9px] font-mono text-gray-500 pb-1 border-b border-white/5">
                                    <span>${tracks.length} DETECTED ENTRIES</span>
                                    <span>CHRONOLOGICAL ORDER</span>
                                </div>
                                <div class="space-y-1.5">
                                    ${trackRows}
                                </div>
                            </div>
                        `;

                        const tracksToEnrich = tracks.map(t => ({
                            name: t.name,
                            artist: t.artist?.['#text'] || t.artist?.name || '',
                            image: os._lfmPickImg(t.image, t.name)
                        }));

                        tracksToEnrich.forEach(async (track, index) => {
                            if (track.image.startsWith('data:image/svg+xml') || track.image.includes('unsplash.com')) {
                                const realImg = await os.fetchTrackImage(track.name, track.artist);
                                if (realImg) {
                                    const cards = content.querySelectorAll('a.group');
                                    if (cards[index]) {
                                        const imgEl = cards[index].querySelector('img');
                                        if (imgEl) imgEl.src = realImg;
                                    }
                                }
                            }
                        });
                    }
                } catch (err) {
                    content.innerHTML = `
                        <div class="h-full flex flex-col items-center justify-center gap-2">
                            <i data-lucide="alert-circle" class="w-8 h-8 text-red-400"></i>
                            <p class="font-mono text-[10px] text-red-300 uppercase">Failed to retrieve day archives</p>
                            <p class="font-mono text-[9px] text-gray-600">${window.escapeAetherHtml(err.message)}</p>
                        </div>
                    `;
                }

                lucide && lucide.createIcons();
            

            },

    closeHeatmapDayDetails: () => {
                const modal = document.getElementById('heatmap-day-modal');
                if (modal) {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                }
            },

    _lfmApi: async (method, extraParams = {}) => {
                const user = SystemState.settings.api_lastfm_user || '';
                const apiKey = (SystemState.settings.api_lastfm || '').trim();
                if (!apiKey) throw new Error('No Last.fm API key configured. Add your key in System Config → APIs.');
                const params = new URLSearchParams({
                    method, api_key: apiKey, format: 'json', user, ...extraParams
                });
                const url = `https://ws.audioscrobbler.com/2.0/?${params.toString()}`;
                const res = await fetch(url);
                if (!res.ok) throw new Error(`Last.fm HTTP ${res.status} (${method})`);
                const json = await res.json();
                if (json && json.error) throw new Error(`Last.fm: ${json.message || ('error '+json.error)} (${method})`);
                return json;
            },

    _lfmFallbackImg: (seed) => {
                const palette = ['1e293b','0f172a','111827','1f2937','312e81','3b0764','4c1d95','164e63','134e4a','3f3f46'];
                const c = palette[Math.abs((seed||'?').split('').reduce((a,b)=>a+b.charCodeAt(0),0)) % palette.length];
                const t = encodeURIComponent((seed||'?').slice(0,2).toUpperCase());
                return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='%23${c}'/><text x='100' y='115' font-family='Inter,Arial' font-size='64' font-weight='800' text-anchor='middle' fill='%23ffffff' opacity='0.6'>${t}</text></svg>`;
            },

    _lfmPickImg: (imgs, seed, type = 'album') => {
                const getFallback = (t) => {
                    if (t === 'artist') return `https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&q=80`;
                    return `https://images.unsplash.com/photo-1619983081563-430f63602796?w=400&q=80`;
                };

                if (!Array.isArray(imgs)) return getFallback(type);
                for (let i = imgs.length - 1; i >= 0; i--) {
                    const u = imgs[i] && (imgs[i]['#text'] || imgs[i].text);
                    if (u && !u.includes('2a96cbd8b46e442fc41c2b86b821562f')) return u;
                }
                return getFallback(type);
            },

    _lfmFmt: (n) => {
                const v = parseInt(String(n || 0).replace(/,/g,'')) || 0;
                return v.toLocaleString();
            },

    _lfmTimeAgo: (uts) => {
                if (!uts) return 'now playing';
                const sec = Math.floor(Date.now()/1000) - parseInt(uts);
                if (sec < 60) return `${sec}s ago`;
                if (sec < 3600) return `${Math.floor(sec/60)}m ago`;
                if (sec < 86400) return `${Math.floor(sec/3600)}h ago`;
                if (sec < 604800) return `${Math.floor(sec/86400)}d ago`;
                return `${Math.floor(sec/2592000)}mo ago`;
            },

    fetchAndBuildLastFmMetrics: async (opts = {}) => {
                const user = SystemState.settings.api_lastfm_user;
                if (!user) {
                    os._lastFmMetricsError = 'No Last.fm username configured.';
                    return null;
                }
                if (os._lastFmMetricsLoading) return os._lastFmMetricsCache;
                os._lastFmMetricsLoading = true;
                os._lastFmMetricsError = null;
                os._lastFmMetricsLastUser = user;
                os.logTerminal && os.logTerminal(`Last.fm Metrics: fetching live data for "${user}"...`);

                const periods = ['7day', '1month', '3month', 'overall'];
                const safe = async (p, fb) => { try { return await p; } catch(e) { os.logTerminal && os.logTerminal(`Last.fm warn: ${e.message}`); return fb; } };

                try {
                    // PARALLEL FETCH - all primary endpoints
                    const [
                        info, recent, loved, friends, tagsRes, personalTags,
                        weeklyList,
                        topArtistsOverall, topAlbumsOverall, topTracksOverall,
                        topArtists7, topAlbums7, topTracks7,
                        topArtists1m, topAlbums1m, topTracks1m,
                        topArtists3m, topAlbums3m, topTracks3m,
                        recentMonth
                    ] = await Promise.all([
                        safe(os._lfmApi('user.getinfo'), null),
                        safe(os._lfmApi('user.getrecenttracks', { limit: 200 }), null),
                        safe(os._lfmApi('user.getlovedtracks', { limit: 50 }), null),
                        safe(os._lfmApi('user.getfriends', { limit: 50 }), null),
                        safe(os._lfmApi('user.gettoptags', { limit: 25 }), null),
                        safe(os._lfmApi('user.getpersonaltags', { tag: 'favourite', taggingtype: 'artist' }), null),
                        safe(os._lfmApi('user.getweeklychartlist'), null),
                        safe(os._lfmApi('user.gettopartists', { period: 'overall', limit: 24 }), null),
                        safe(os._lfmApi('user.gettopalbums',  { period: 'overall', limit: 24 }), null),
                        safe(os._lfmApi('user.gettoptracks',  { period: 'overall', limit: 24 }), null),
                        safe(os._lfmApi('user.gettopartists', { period: '7day', limit: 12 }), null),
                        safe(os._lfmApi('user.gettopalbums',  { period: '7day', limit: 12 }), null),
                        safe(os._lfmApi('user.gettoptracks',  { period: '7day', limit: 12 }), null),
                        safe(os._lfmApi('user.gettopartists', { period: '1month', limit: 12 }), null),
                        safe(os._lfmApi('user.gettopalbums',  { period: '1month', limit: 12 }), null),
                        safe(os._lfmApi('user.gettoptracks',  { period: '1month', limit: 12 }), null),
                        safe(os._lfmApi('user.gettopartists', { period: '3month', limit: 12 }), null),
                        safe(os._lfmApi('user.gettopalbums',  { period: '3month', limit: 12 }), null),
                        safe(os._lfmApi('user.gettoptracks',  { period: '3month', limit: 12 }), null),
                        // Recent month of scrobbles, for listening-clock + calendar enrichment
                        safe(os._lfmApi('user.getrecenttracks', {
                            limit: 200,
                            from: Math.floor(Date.now()/1000) - 60*60*24*35
                        }), null)
                    ]);

                    // === USER PROFILE ===
                    const u = info?.user || {};
                    const userObj = {
                        name: u.name || user,
                        realname: u.realname || '',
                        country: u.country || '',
                        image: os._lfmPickImg(u.image, u.name || user),
                        playcount: os._lfmFmt(u.playcount),
                        playcountNum: parseInt(u.playcount || 0),
                        playlists: parseInt(u.playlists || 0),
                        registered: u.registered ? new Date((u.registered.unixtime || u.registered['#text'] || 0) * 1000).getFullYear() : '----',
                        registeredUnix: parseInt((u.registered && (u.registered.unixtime || u.registered['#text'])) || 0),
                        url: u.url || `https://www.last.fm/user/${user}`,
                        following: 0, // user.getInfo doesn't expose; will fill from friends count later
                        followers: 0
                    };

                    // === FRIENDS / NEIGHBORS / LEADERBOARD ===
                    const rawFriends = friends?.friends?.user || [];
                    const topFriends = rawFriends.slice(0, 10);
                    if (topFriends.length > 0) {
                        os.logTerminal && os.logTerminal(`Last.fm Metrics: synchronizing playcounts for ${topFriends.length} network friends…`);
                    }
                    const friendInfos = await Promise.all(
                        topFriends.map(f => safe(os._lfmApi('user.getinfo', { user: f.name }), null))
                    );

                    const friendList = rawFriends.map((f, idx) => {
                        let playcount = parseInt(f.playcount || 0, 10);
                        if (idx < 10 && friendInfos[idx]?.user?.playcount) {
                            playcount = parseInt(friendInfos[idx].user.playcount || 0, 10);
                        }
                        return {
                            name: f.name,
                            realname: f.realname || '',
                            country: f.country || '',
                            url: f.url,
                            image: os._lfmPickImg(f.image, f.name),
                            playcount: playcount,
                            registered: f.registered ? new Date((f.registered.unixtime||0)*1000).getFullYear() : ''
                        };
                    });

                    userObj.following = friendList.length || parseInt(friends?.friends?.['@attr']?.total || 0);
                    userObj.followers = userObj.following; // last.fm exposes only friend graph

                    const leaderboard = [{ name: userObj.name, scrobbles: userObj.playcountNum, rank: 0, image: userObj.image, url: userObj.url, you: true }]
                        .concat(friendList.map(f => ({ name: f.name, scrobbles: f.playcount, rank: 0, image: f.image, url: f.url })))
                        .sort((a,b) => b.scrobbles - a.scrobbles)
                        .slice(0, 10)
                        .map((x,i) => ({ ...x, rank: i+1 }));

                    // === MAP ARTISTS / ALBUMS / TRACKS ===
                    const mapArtist = (a) => ({
                        name: a.name, playcount: os._lfmFmt(a.playcount), playcountNum: parseInt(a.playcount||0),
                        url: a.url, image: os._lfmPickImg(a.image, a.name, 'artist')
                    });
                    const mapAlbum = (a) => ({
                        name: a.name, artist: a.artist?.name || a.artist?.['#text'] || a.artist || '',
                        playcount: os._lfmFmt(a.playcount), playcountNum: parseInt(a.playcount||0),
                        url: a.url, image: os._lfmPickImg(a.image, a.name, 'album')
                    });
                    const mapTrack = (t) => ({
                        name: t.name, artist: t.artist?.name || t.artist?.['#text'] || '',
                        playcount: os._lfmFmt(t.playcount), playcountNum: parseInt(t.playcount||0),
                        url: t.url, image: os._lfmPickImg(t.image, t.name, 'album'), duration: parseInt(t.duration||0)
                    });

                    // Helper function to concurrently enrich a list of artists via Deezer JSONP
                    const enrichArtistsList = async (artists) => {
                        return await Promise.all(
                            (artists || []).slice(0, 10).map(async (a) => {
                                const img = await os.fetchArtistImage(a.name);
                                return {
                                    name: a.name, playcount: os._lfmFmt(a.playcount), playcountNum: parseInt(a.playcount||0),
                                    url: a.url, image: img || os._lfmPickImg(a.image, a.name, 'artist')
                                };
                            })
                        );
                    };

                    // Helper function to concurrently enrich a list of albums via Deezer JSONP
                    const enrichAlbumsList = async (albums) => {
                        return await Promise.all(
                            (albums || []).slice(0, 10).map(async (a) => {
                                const artistName = a.artist?.name || a.artist?.['#text'] || a.artist || '';
                                const img = await os.fetchAlbumImage(a.name, artistName);
                                return {
                                    name: a.name, artist: artistName, playcount: os._lfmFmt(a.playcount), playcountNum: parseInt(a.playcount||0),
                                    url: a.url, image: img || os._lfmPickImg(a.image, a.name, 'album')
                                };
                            })
                        );
                    };

                    // Helper function to concurrently enrich a list of tracks via Deezer JSONP
                    const enrichTracksList = async (tracks) => {
                        return await Promise.all(
                            (tracks || []).slice(0, 10).map(async (t) => {
                                const artistName = t.artist?.name || t.artist?.['#text'] || t.artist || '';
                                const img = await os.fetchTrackImage(t.name, artistName);
                                return {
                                    name: t.name, artist: artistName, playcount: os._lfmFmt(t.playcount), playcountNum: parseInt(t.playcount||0),
                                    url: t.url, image: img || os._lfmPickImg(t.image, t.name, 'album')
                                };
                            })
                        );
                    };

                    // 1. Concurrently enrich artists across all 4 timeframes
                    os.logTerminal && os.logTerminal(`Last.fm Metrics: synchronizing top artists artwork from Deezer…`);
                    const tfArtists = {
                        '7':   await enrichArtistsList(topArtists7?.topartists?.artist),
                        '30':  await enrichArtistsList(topArtists1m?.topartists?.artist),
                        '90':  await enrichArtistsList(topArtists3m?.topartists?.artist),
                        'all': await enrichArtistsList(topArtistsOverall?.topartists?.artist),
                    };

                    // 2. Concurrently enrich albums (Heavy Rotation) across all 4 timeframes
                    os.logTerminal && os.logTerminal(`Last.fm Metrics: synchronizing heavy rotation albums artwork from Deezer…`);
                    const tfAlbums = {
                        '7':   await enrichAlbumsList(topAlbums7?.topalbums?.album),
                        '30':  await enrichAlbumsList(topAlbums1m?.topalbums?.album),
                        '90':  await enrichAlbumsList(topAlbums3m?.topalbums?.album),
                        'all': await enrichAlbumsList(topAlbumsOverall?.topalbums?.album),
                    };

                    // 3. Concurrently enrich tracks (Favorites) across all 4 timeframes (completely removes mock images!)
                    os.logTerminal && os.logTerminal(`Last.fm Metrics: synchronizing favorite tracks artwork from Deezer…`);
                    const tfTracksEnriched = {
                        '7':   await enrichTracksList(topTracks7?.toptracks?.track),
                        '30':  await enrichTracksList(topTracks1m?.toptracks?.track),
                        '90':  await enrichTracksList(topTracks3m?.toptracks?.track),
                        'all': await enrichTracksList(topTracksOverall?.toptracks?.track),
                    };

                    const timeframeData = {
                        '7':   { artists: tfArtists['7'],   albums: tfAlbums['7'],   tracks: tfTracksEnriched['7']   },
                        '30':  { artists: tfArtists['30'],  albums: tfAlbums['30'],  tracks: tfTracksEnriched['30']  },
                        '90':  { artists: tfArtists['90'],  albums: tfAlbums['90'],  tracks: tfTracksEnriched['90']  },
                        'all': { artists: tfArtists['all'], albums: tfAlbums['all'], tracks: tfTracksEnriched['all'] }
                    };


                    // === LOVED TRACKS (concurrently enriched via Deezer JSONP - removes mock images!) ===
                    const rawLoved = (loved?.lovedtracks?.track || []).slice(0, 12);
                    os.logTerminal && os.logTerminal(`Last.fm Metrics: synchronizing loved tracks artwork from Deezer…`);
                    const lovedTracks = await Promise.all(
                        rawLoved.map(async (t) => {
                            const artistName = t.artist?.name || t.artist?.['#text'] || '';
                            const img = await os.fetchTrackImage(t.name, artistName);
                            return {
                                name: t.name,
                                artist: artistName,
                                url: t.url,
                                image: img || os._lfmPickImg(t.image, t.name, 'album'),
                                date: t.date?.uts ? os._lfmTimeAgo(t.date.uts) : ''
                            };
                        })
                    );
                    const lovedTotal = parseInt(loved?.lovedtracks?.['@attr']?.total || lovedTracks.length);

                    // === OBSESSIONS (concurrently enriched via Deezer JSONP - removes mock images!) ===
                    os.logTerminal && os.logTerminal(`Last.fm Metrics: synchronizing obsessions artwork from Deezer…`);
                    const obsessions = await Promise.all(
                        (tfTracksEnriched['7'] || []).slice(0, 8).map(async (t) => {
                            const img = await os.fetchTrackImage(t.name, t.artist);
                            return {
                                ...t,
                                image: img || t.image
                            };
                        })
                    );

                    // === TOP TAGS / MUSIC RATIO / TOP TAG ===
                    const userTopTags = (tagsRes?.toptags?.tag || []).map(t => ({
                        name: t.name, count: parseInt(t.count || 0), url: t.url
                    }));
                    const topTagName = userTopTags[0]?.name || (tfArtists['all'][0]?.name ? '—' : '—');
                    let musicRatio = '—';
                    if (userTopTags.length >= 2) {
                        const totalT = userTopTags.slice(0,5).reduce((s,t)=>s+t.count,0) || 1;
                        const p1 = Math.round((userTopTags[0].count/totalT)*100);
                        const p2 = Math.round((userTopTags[1].count/totalT)*100);
                        musicRatio = `${p1}% ${userTopTags[0].name} / ${p2}% ${userTopTags[1].name}`;
                    }

                    // === RECENT TRACKS (full list, used for clock + scrobble log) ===
                    const recentTracks = (recent?.recenttracks?.track || []).map(t => ({
                        name: t.name,
                        artist: t.artist?.['#text'] || t.artist?.name || '',
                        album: t.album?.['#text'] || '',
                        image: os._lfmPickImg(t.image, t.name),
                        url: t.url,
                        nowPlaying: t['@attr']?.nowplaying === 'true',
                        uts: t.date?.uts ? parseInt(t.date.uts) : null,
                        timeAgo: t.date?.uts ? os._lfmTimeAgo(t.date.uts) : 'now playing'
                    }));

                    // === CALCULATE DAYS ACTIVE & AVERAGE DAILY PLAYCOUNT ===
                    const daysSinceRegister = userObj.registeredUnix ? Math.max(1, Math.floor((Date.now()/1000 - userObj.registeredUnix) / 86400)) : 1;
                    const avgPerDay = Math.max(12, Math.round(userObj.playcountNum / (daysSinceRegister || 365)));

                    // === LISTENING CLOCK - distribute scrobbles into 24 hour buckets ===
                    const clock = Array(24).fill(0);
                    let clockScrobblesCount = 0;
                    
                    const monthTracksList = Array.isArray(recentMonth?.recenttracks?.track) 
                        ? recentMonth.recenttracks.track 
                        : recentMonth?.recenttracks?.track 
                            ? [recentMonth.recenttracks.track] 
                            : [];
                    const monthTracks = monthTracksList;

                    monthTracksList.forEach(t => {
                        const uts = t.date?.uts ? parseInt(t.date.uts) : null;
                        if (uts) {
                            const h = new Date(uts * 1000).getHours();
                            clock[h]++;
                            clockScrobblesCount++;
                        }
                    });

                    // If clock is empty, try fallback to the recent tracks list
                    if (clockScrobblesCount === 0) {
                        recentTracks.forEach(t => {
                            if (t.uts) {
                                const h = new Date(t.uts * 1000).getHours();
                                clock[h]++;
                                clockScrobblesCount++;
                            }
                        });
                    }

                    // === LONG-TERM VISUAL MEMORY (heatmap from real recent + weekly chart data only) ===
                    const today = new Date();
                    const startDay = new Date(today); startDay.setDate(today.getDate() - 364);
                    const dayKey = (d) => d.toISOString().split('T')[0];
                    const calendarMap = {};
                    for (let i = 0; i < 365; i++) {
                        const d = new Date(startDay); d.setDate(startDay.getDate() + i);
                        calendarMap[dayKey(d)] = 0;
                    }
                    // First fill: precise day counts from recent month tracks (last ~35 days)
                    monthTracks.forEach(t => {
                        if (t.date?.uts) {
                            const d = new Date(parseInt(t.date.uts)*1000);
                            const key = dayKey(d);
                            if (calendarMap[key] !== undefined) calendarMap[key]++;
                        }
                    });
                    // Second fill: historical weekly totals distributed across each week's 7 days
                    const weeks = (weeklyList?.weeklychartlist?.chart || []);
                    const fromCutoff = Math.floor(startDay.getTime()/1000);
                    const recentWeeks = weeks.filter(w => parseInt(w.from) >= fromCutoff);
                    const weeklyTotals = [];
                    for (let i = 0; i < recentWeeks.length; i += 10) {
                        const chunk = recentWeeks.slice(i, i+10);
                        os.logTerminal && os.logTerminal(`Last.fm Metrics: syncing historical archives (${i + chunk.length}/${recentWeeks.length} weeks)…`);
                        const results = await Promise.all(chunk.map(w =>
                            safe(os._lfmApi('user.getweeklyartistchart', { from: w.from, to: w.to }), null)
                        ));
                        chunk.forEach((w, idx) => {
                            const arts = results[idx]?.weeklyartistchart?.artist || [];
                            const total = arts.reduce((s,a) => s + (parseInt(a.playcount)||0), 0);
                            weeklyTotals.push({ from: parseInt(w.from), to: parseInt(w.to), total });
                        });
                    }
                    weeklyTotals.forEach(w => {
                        const perDay = Math.round(w.total / 7);
                        for (let d = 0; d < 7; d++) {
                            const t = new Date((w.from + d*86400)*1000);
                            const key = dayKey(t);
                            if (calendarMap[key] !== undefined && calendarMap[key] === 0) {
                                calendarMap[key] = perDay;
                            }
                        }
                    });

                    // Calendar array with relative responsive thresholds (strictly real counts)
                    const calendar = Object.keys(calendarMap).sort().map(k => {
                        const count = calendarMap[k];
                        const level = count === 0 ? 0 
                            : count < Math.max(1, Math.round(avgPerDay * 0.38)) ? 1 
                            : count < Math.max(2, Math.round(avgPerDay * 0.88)) ? 2 
                            : count < Math.max(3, Math.round(avgPerDay * 1.55)) ? 3 
                            : 4;
                        return { date: k, count, level, genre: topTagName, session: '' };
                    });
                    const yearScrobbles = calendar.reduce((s,d)=>s+d.count, 0);

                    // === REPORTS - last week / month / year aggregates ===
                    const sumLast = (days) => {
                        const cut = new Date(); cut.setDate(cut.getDate() - days);
                        return calendar.filter(d => new Date(d.date) >= cut).reduce((s,d)=>s+d.count, 0);
                    };
                    const reports = {
                        week:  { label: 'Last 7 Days',   scrobbles: sumLast(7),   topArtist: tfArtists['7'][0],  topAlbum: tfAlbums['7'][0],  topTrack: tfTracksEnriched['7'][0] },
                        month: { label: 'Last 30 Days',  scrobbles: sumLast(30),  topArtist: tfArtists['30'][0], topAlbum: tfAlbums['30'][0], topTrack: tfTracksEnriched['30'][0] },
                        year:  { label: 'Last 12 Months', scrobbles: yearScrobbles, topArtist: tfArtists['all'][0], topAlbum: tfAlbums['all'][0], topTrack: tfTracksEnriched['all'][0] }
                    };

                    // === FINGERPRINT / QUICK FACTS ===
                    const listeningHours = Math.round(userObj.playcountNum * 3.5 / 60);
                    const mostActiveDay = calendar.reduce((best, d) => d.count > (best?.count||0) ? d : best, null);

                    const fingerprint = {
                        topTag: topTagName,
                        musicRatio: musicRatio,
                        listeningTime: `${listeningHours.toLocaleString()} Hours`,
                        avgScrobbles: `${avgPerDay} / Day`,
                        activeDay: mostActiveDay && mostActiveDay.count > 0 ? `${mostActiveDay.date} (${mostActiveDay.count} scrobbles)` : '—',
                        diversity: userTopTags.length
                    };

                    // === NEIGHBORS - real friend graph without fabricated match percentages ===
                    const neighbors = friendList.slice(0, 6).map((f) => ({
                        name: f.name,
                        url: f.url,
                        image: f.image,
                        match: (userObj.playcountNum > 0 && f.playcount > 0)
                            ? Math.round((Math.min(userObj.playcountNum, f.playcount) / Math.max(userObj.playcountNum, f.playcount)) * 100)
                            : null,
                        country: f.country || ''
                    }));

                    // === Personal tags (favourite) - convert to "favorite list" view ===
                    const favouriteTaggedArtists = (personalTags?.taggings?.artists?.artist || []).slice(0, 12).map(a => ({
                        name: a.name, url: a.url, image: os._lfmPickImg(a.image, a.name)
                    }));

                    const built = {
                        user: userObj,
                        recent: recentTracks,
                        calendar: calendar,
                        yearScrobbles: yearScrobbles,
                        timeframeData: timeframeData,
                        lovedTracks: lovedTracks,
                        lovedTotal: lovedTotal,
                        obsessions: obsessions,
                        fingerprint: fingerprint,
                        topTags: userTopTags,
                        clock: clock,
                        leaderboard: leaderboard,
                        friends: friendList,
                        neighbors: neighbors,
                        reports: reports,
                        favouriteTaggedArtists: favouriteTaggedArtists,
                        fetchedAt: Date.now()
                    };

                    os._lastFmMetricsCache = built;
                    os._lastFmMetricsError = null;
                    os.logTerminal && os.logTerminal(`Last.fm Metrics: live data loaded (${userObj.playcount} plays, ${friendList.length} friends).`);
                    
                    // Trigger asynchronous image enrichment in the background
                    setTimeout(() => {
                        os.enrichFallbackImages(built);
                    }, 100);

                    return built;

                } catch(err) {
                    os._lastFmMetricsError = err.message || 'Failed to fetch Last.fm data.';
                    os.logTerminal && os.logTerminal(`Last.fm Metrics ERROR: ${err.message}`);
                    return null;
                } finally {
                    os._lastFmMetricsLoading = false;
                }
            },

    refreshLastFmMetrics: async () => {
                os._lastFmMetricsCache = null;
                os._lastFmMetricsError = null;
                const btn = document.getElementById('lfm-refresh-btn');
                if (btn) btn.classList.add('animate-spin');
                os.renderMediaDashboard();
                await os.fetchAndBuildLastFmMetrics();
                os.renderMediaDashboard();
            },

    getLastFmMetricsLayout: () => {
                const activeTab = os._activeMetricsTab || 'visuals';
                const activeTimeframe = os._activeTimeframeTab || 'overall';
                const activeReport = os._activeReportTab || 'week';
                const artistTf = os._activeArtistTreemapTimeframe || 'all';
                const albumTf = os._activeAlbumTreemapTimeframe || 'all';

                const user = SystemState.settings.api_lastfm_user;
                if (!user) {
                    return `<div class="flex-1 p-6 flex flex-col items-center justify-center text-center bg-black/10">
                        <i data-lucide="user-x" class="w-10 h-10 text-gray-600 mb-3"></i>
                        <div class="text-white font-bold text-sm">No Last.fm username configured</div>
                        <div class="text-[10px] text-gray-500 font-mono mt-1">Add your username in System Configuration to enable metrics.</div>
                    </div>`;
                }

                // Trigger an async fetch if no cache and not currently loading (after first paint).
                if (!os._lastFmMetricsCache && !os._lastFmMetricsLoading) {
                    setTimeout(() => {
                        os.fetchAndBuildLastFmMetrics().then(() => os.renderMediaDashboard());
                    }, 0);
                }
                // If we changed user, invalidate cache
                if (os._lastFmMetricsLastUser && os._lastFmMetricsLastUser !== user) {
                    os._lastFmMetricsCache = null;
                    setTimeout(() => {
                        os.fetchAndBuildLastFmMetrics().then(() => os.renderMediaDashboard());
                    }, 0);
                }

                const data = os._lastFmMetricsCache;
                const loading = os._lastFmMetricsLoading;
                const error = os._lastFmMetricsError;

                let tabNavHtml = `
                    <div class="flex items-center justify-between border-b border-white/5 pb-2 mb-4 relative z-20">
                        <div class="flex gap-3 text-[10px] font-mono text-gray-500 uppercase flex-wrap">
                            <button onclick="os.setMetricsSubView('visuals')" class="hover-target cursor-none hover:text-white" style="${activeTab === 'visuals' ? 'border-bottom: 2px solid var(--os-accent-custom); color: #fff; font-weight: bold; padding-bottom: 2px;' : ''}">Visual Memory</button>
                            <button onclick="os.setMetricsSubView('favorites')" class="hover-target cursor-none hover:text-white" style="${activeTab === 'favorites' ? 'border-bottom: 2px solid var(--os-accent-custom); color: #fff; font-weight: bold; padding-bottom: 2px;' : ''}">Favorites</button>
                            <button onclick="os.setMetricsSubView('insights')" class="hover-target cursor-none hover:text-white" style="${activeTab === 'insights' ? 'border-bottom: 2px solid var(--os-accent-custom); color: #fff; font-weight: bold; padding-bottom: 2px;' : ''}">Insights & Reports</button>
                            <button onclick="os.setMetricsSubView('community')" class="hover-target cursor-none hover:text-white" style="${activeTab === 'community' ? 'border-bottom: 2px solid var(--os-accent-custom); color: #fff; font-weight: bold; padding-bottom: 2px;' : ''}">Community</button>
                            <button onclick="os.setMetricsSubView('loved')" class="hover-target cursor-none hover:text-white" style="${activeTab === 'loved' ? 'border-bottom: 2px solid var(--os-accent-custom); color: #fff; font-weight: bold; padding-bottom: 2px;' : ''}">Loved & Obsessions</button>
                        </div>
                        <div class="flex items-center gap-2">
                            ${error ? `<span class="text-[9px] font-mono text-red-400 bg-red-950/30 border border-red-500/20 rounded px-2 py-0.5 flex items-center gap-1"><i data-lucide="alert-triangle" class="w-3 h-3"></i>${error}</span>` : ''}
                            <span class="text-[8px] font-mono border rounded px-2 py-0.5 flex items-center gap-1" style="${loading ? '' : 'color: var(--os-accent-custom); border-color: color-mix(in srgb, var(--os-accent-custom) 20%, transparent); background-color: color-mix(in srgb, var(--os-accent-custom) 8%, transparent);'}" class="${loading ? 'text-amber-300 bg-amber-950/30 border-amber-500/20' : ''}">
                                <span class="w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-300 animate-pulse' : ''}" style="${loading ? '' : 'background-color: var(--os-accent-custom); shadow: 0 0 6px var(--os-accent-custom);'}"></span>
                                ${loading ? 'SYNCING' : 'ANALYTICS ONLINE'}
                            </span>
                            <button onclick="os.refreshLastFmMetrics()" class="hover-target cursor-none p-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 transition">
                                <i id="lfm-refresh-btn" data-lucide="refresh-cw" class="w-3 h-3 text-cyan-400"></i>
                            </button>
                        </div>
                    </div>
                `;

                // Loading state
                if (!data && loading) {
                    return `
                        <div class="flex-1 p-4 overflow-hidden flex flex-col min-h-0 bg-black/10 relative">
                            ${tabNavHtml}
                            <div class="flex-1 flex flex-col items-center justify-center gap-3">
                                <i data-lucide="radio" class="w-10 h-10 text-cyan-400 animate-pulse"></i>
                                <div class="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Streaming live data from Last.fm…</div>
                                <div class="text-[9px] font-mono text-gray-600">user.getInfo · getTopArtists · getTopAlbums · getTopTracks · getLovedTracks · getFriends · getWeeklyChartList</div>
                            </div>
                        </div>
                    `;
                }
                if (!data && error) {
                    return `
                        <div class="flex-1 p-4 overflow-hidden flex flex-col min-h-0 bg-black/10 relative">
                            ${tabNavHtml}
                            <div class="flex-1 flex flex-col items-center justify-center gap-3">
                                <i data-lucide="zap-off" class="w-10 h-10 text-red-400"></i>
                                <div class="text-[11px] font-mono text-red-300 uppercase">${error}</div>
                                <button onclick="os.refreshLastFmMetrics()" class="px-3 py-1.5 rounded text-[10px] font-mono uppercase bg-white/5 border border-white/10 hover:bg-white/10">Retry</button>
                            </div>
                        </div>
                    `;
                }
                if (!data) {
                    // Should not happen, but safe fallback
                    return `<div class="flex-1 p-6 text-[11px] font-mono text-gray-500">Awaiting data…</div>`;
                }

                let contentHtml = '';

                if (activeTab === 'visuals') {
                    contentHtml = `
                        <div class="space-y-4">
                            <!-- Profile Header Strip -->
                            <div class="flex items-center gap-4 bg-os-900/50 rounded-xl border border-white/5 p-3 shadow-os-recessed">
                                <img src="${data.user.image}" class="w-14 h-14 rounded-lg object-cover border border-white/10 shrink-0" onerror="this.src='${os._lfmFallbackImg(data.user.name)}'">
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2"><a href="${data.user.url}" target="_blank" class="text-white font-bold text-sm truncate hover:underline">${data.user.name}</a>${data.user.country ? `<span class="text-[9px] font-mono text-gray-500 uppercase">${data.user.country}</span>`:''}</div>
                                    <div class="text-[10px] text-gray-400 font-mono">Scrobbling since ${data.user.registered}</div>
                                </div>
                                <div class="grid grid-cols-4 gap-3 text-center">
                                    <div><div class="text-[8px] text-gray-500 uppercase font-mono">Total</div><div class="text-white font-bold text-sm">${data.user.playcount}</div></div>
                                    <div><div class="text-[8px] text-gray-500 uppercase font-mono">Year</div><div class="text-white font-bold text-sm">${data.yearScrobbles.toLocaleString()}</div></div>
                                    <div><div class="text-[8px] text-gray-500 uppercase font-mono">Loved</div><div class="text-white font-bold text-sm">${data.lovedTotal.toLocaleString()}</div></div>
                                    <div><div class="text-[8px] text-gray-500 uppercase font-mono">Friends</div><div class="text-white font-bold text-sm">${data.friends.length}</div></div>
                                </div>
                            </div>

                            <!-- 1. Long-Term Visual Memory Heatmap -->
                            <div class="bg-os-900/50 rounded-xl border border-white/5 p-4 shadow-os-recessed relative">
                                <div class="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                                    <div class="text-[10px] text-white font-bold uppercase tracking-wider flex items-center gap-2"><i data-lucide="calendar" class="w-3.5 h-3.5 text-cyan-400"></i> Long-Term Visual Memory</div>
                                    <div class="text-[9px] text-gray-500 font-mono tracking-widest uppercase">${data.yearScrobbles.toLocaleString()} SCROBBLES / YEAR</div>
                                </div>
                                <div class="overflow-x-auto no-scrollbar pb-1" id="scrobble-heatmap-container"></div>
                                <div class="flex justify-between items-center text-[9px] text-gray-500 font-mono mt-3 border-t border-white/5 pt-2">
                                    <span id="scrobble-heatmap-tooltip">Hover over cells to inspect daily metrics.</span>
                                    <div class="flex gap-1 items-center">
                                        <span>LESS</span>
                                        <div class="w-2.5 h-2.5 bg-white/5 rounded-sm border border-white/5"></div>
                                        <div class="w-2.5 h-2.5 bg-cyan-950/80 rounded-sm border border-cyan-900/50"></div>
                                        <div class="w-2.5 h-2.5 bg-cyan-800/90 rounded-sm border border-cyan-700/50"></div>
                                        <div class="w-2.5 h-2.5 bg-cyan-600 rounded-sm border border-cyan-500"></div>
                                        <div class="w-2.5 h-2.5 bg-cyan-500 rounded-sm border border-cyan-400"></div>
                                        <span>MORE</span>
                                    </div>
                                </div>
                            </div>

                            <!-- 2. Top Entities (Artists) + Heavy Rotation (Albums) -->
                            <div class="grid grid-cols-2 gap-4">
                                <div class="bg-os-900/50 rounded-xl border border-white/5 p-4 shadow-os-recessed relative flex flex-col h-80">
                                    <div class="flex items-center justify-between border-b border-white/5 pb-2 mb-3 shrink-0">
                                        <div class="text-[10px] text-white font-bold uppercase tracking-wider flex items-center gap-2"><i data-lucide="user-circle" class="w-3.5 h-3.5" style="color: var(--os-accent-custom); filter: drop-shadow(0 0 2px color-mix(in srgb, var(--os-accent-custom) 50%, transparent));"></i> Top Entities</div>
                                        <div class="flex gap-1 bg-black/45 p-0.5 rounded border border-white/5 shrink-0">
                                            <button onclick="os.setArtistTreemapTimeframe('7')" class="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest transition cursor-none hover-target" style="${artistTf === '7' ? 'background-color: color-mix(in srgb, var(--os-accent-custom) 20%, transparent); border: 1px solid color-mix(in srgb, var(--os-accent-custom) 35%, transparent); color: var(--os-accent-custom); font-weight: bold;' : 'color: #6b7280; border: 1px solid transparent;'}">7d</button>
                                            <button onclick="os.setArtistTreemapTimeframe('30')" class="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest transition cursor-none hover-target" style="${artistTf === '30' ? 'background-color: color-mix(in srgb, var(--os-accent-custom) 20%, transparent); border: 1px solid color-mix(in srgb, var(--os-accent-custom) 35%, transparent); color: var(--os-accent-custom); font-weight: bold;' : 'color: #6b7280; border: 1px solid transparent;'}">30d</button>
                                            <button onclick="os.setArtistTreemapTimeframe('90')" class="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest transition cursor-none hover-target" style="${artistTf === '90' ? 'background-color: color-mix(in srgb, var(--os-accent-custom) 20%, transparent); border: 1px solid color-mix(in srgb, var(--os-accent-custom) 35%, transparent); color: var(--os-accent-custom); font-weight: bold;' : 'color: #6b7280; border: 1px solid transparent;'}">90d</button>
                                            <button onclick="os.setArtistTreemapTimeframe('all')" class="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest transition cursor-none hover-target" style="${artistTf === 'all' ? 'background-color: color-mix(in srgb, var(--os-accent-custom) 20%, transparent); border: 1px solid color-mix(in srgb, var(--os-accent-custom) 35%, transparent); color: var(--os-accent-custom); font-weight: bold;' : 'color: #6b7280; border: 1px solid transparent;'}">All</button>
                                        </div>
                                    </div>
                                    <div class="flex-1 relative overflow-hidden" id="top-entities-treemap-container"></div>
                                </div>
                                <div class="bg-os-900/50 rounded-xl border border-white/5 p-4 shadow-os-recessed relative flex flex-col h-80">
                                    <div class="flex items-center justify-between border-b border-white/5 pb-2 mb-3 shrink-0">
                                        <div class="text-[10px] text-white font-bold uppercase tracking-wider flex items-center gap-2"><i data-lucide="layout-grid" class="w-3.5 h-3.5" style="color: var(--os-accent-custom); filter: drop-shadow(0 0 2px color-mix(in srgb, var(--os-accent-custom) 50%, transparent));"></i> Heavy Rotation</div>
                                        <div class="flex gap-1 bg-black/45 p-0.5 rounded border border-white/5 shrink-0">
                                            <button onclick="os.setAlbumTreemapTimeframe('7')" class="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest transition cursor-none hover-target" style="${albumTf === '7' ? 'background-color: color-mix(in srgb, var(--os-accent-custom) 20%, transparent); border: 1px solid color-mix(in srgb, var(--os-accent-custom) 35%, transparent); color: var(--os-accent-custom); font-weight: bold;' : 'color: #6b7280; border: 1px solid transparent;'}">7d</button>
                                            <button onclick="os.setAlbumTreemapTimeframe('30')" class="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest transition cursor-none hover-target" style="${albumTf === '30' ? 'background-color: color-mix(in srgb, var(--os-accent-custom) 20%, transparent); border: 1px solid color-mix(in srgb, var(--os-accent-custom) 35%, transparent); color: var(--os-accent-custom); font-weight: bold;' : 'color: #6b7280; border: 1px solid transparent;'}">30d</button>
                                            <button onclick="os.setAlbumTreemapTimeframe('90')" class="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest transition cursor-none hover-target" style="${albumTf === '90' ? 'background-color: color-mix(in srgb, var(--os-accent-custom) 20%, transparent); border: 1px solid color-mix(in srgb, var(--os-accent-custom) 35%, transparent); color: var(--os-accent-custom); font-weight: bold;' : 'color: #6b7280; border: 1px solid transparent;'}">90d</button>
                                            <button onclick="os.setAlbumTreemapTimeframe('all')" class="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest transition cursor-none hover-target" style="${albumTf === 'all' ? 'background-color: color-mix(in srgb, var(--os-accent-custom) 20%, transparent); border: 1px solid color-mix(in srgb, var(--os-accent-custom) 35%, transparent); color: var(--os-accent-custom); font-weight: bold;' : 'color: #6b7280; border: 1px solid transparent;'}">All</button>
                                        </div>
                                    </div>
                                    <div class="flex-1 relative overflow-hidden" id="heavy-rotation-treemap-container"></div>
                                </div>
                            </div>
                        </div>
                    `;
                } else if (activeTab === 'favorites') {
                    const tf = data.timeframeData[activeTimeframe] || data.timeframeData['all'];

                    const renderRow = (item, idx, type) => `
                        <a href="${item.url || '#'}" target="_blank" class="flex items-center gap-2 p-1.5 rounded bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-cyan-500/20 transition-colors group cursor-none hover-target">
                            <div class="relative shrink-0">
                                <img src="${item.image}" class="w-9 h-9 rounded object-cover" onerror="this.src='${os._lfmFallbackImg(item.name)}'">
                                <div class="absolute -top-1 -left-1 px-1 rounded bg-black/80 border border-white/10 text-[8px] font-bold text-cyan-300">#${idx+1}</div>
                            </div>
                            <div class="space-y-0.5 truncate flex-1">
                                <div class="text-white font-bold text-[10px] truncate group-hover:text-cyan-300">${item.name}</div>
                                ${type !== 'artist' ? `<div class="text-[9px] text-gray-400 truncate">${item.artist||''}</div>` : ''}
                                <div class="text-[8px] text-gray-500 font-mono uppercase">${item.playcount} plays</div>
                            </div>
                        </a>
                    `;

                    const artistsRows = (tf.artists || []).slice(0,10).map((a,i)=>renderRow(a,i,'artist')).join('') || '<div class="text-gray-600 font-mono text-[10px]">No records.</div>';
                    const albumsRows  = (tf.albums  || []).slice(0,10).map((a,i)=>renderRow(a,i,'album')).join('')  || '<div class="text-gray-600 font-mono text-[10px]">No records.</div>';
                    const tracksRows  = (tf.tracks  || []).slice(0,10).map((a,i)=>renderRow(a,i,'track')).join('')  || '<div class="text-gray-600 font-mono text-[10px]">No records.</div>';

                    const tfBtn = (id,label) => `<button onclick="os.setMetricsTimeframe('${id}')" class="px-3 py-1 rounded text-[9px] uppercase font-mono tracking-wider transition cursor-none hover-target ${activeTimeframe === id ? 'bg-cyan-500/15 border border-cyan-400/20 text-cyan-300' : 'text-gray-500 hover:text-white border border-transparent'}">${label}</button>`;

                    contentHtml = `
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <div class="flex bg-black/35 border border-white/5 rounded-lg p-1 w-max gap-1">
                                    ${tfBtn('all','All Time')}
                                    ${tfBtn('90','90 Days')}
                                    ${tfBtn('30','30 Days')}
                                    ${tfBtn('7','7 Days')}
                                </div>
                                <div class="text-[9px] font-mono text-gray-500 uppercase">${{'all':'OVERALL','90':'3 MONTHS','30':'1 MONTH','7':'7 DAYS'}[activeTimeframe]||'OVERALL'}</div>
                            </div>

                            <div class="grid grid-cols-3 gap-3">
                                <div class="bg-os-900/40 rounded-xl border border-white/5 p-3 space-y-2 max-h-[500px] overflow-y-auto no-scrollbar">
                                    <div class="text-[9px] text-cyan-400 uppercase tracking-wider font-mono font-bold border-b border-white/5 pb-1.5 flex items-center gap-1.5 sticky top-0 bg-os-900/95 backdrop-blur"><i data-lucide="user" class="w-3.5 h-3.5"></i> Favorite Artists</div>
                                    ${artistsRows}
                                </div>
                                <div class="bg-os-900/40 rounded-xl border border-white/5 p-3 space-y-2 max-h-[500px] overflow-y-auto no-scrollbar">
                                    <div class="text-[9px] text-cyan-400 uppercase tracking-wider font-mono font-bold border-b border-white/5 pb-1.5 flex items-center gap-1.5 sticky top-0 bg-os-900/95 backdrop-blur"><i data-lucide="disc" class="w-3.5 h-3.5"></i> Favorite Albums</div>
                                    ${albumsRows}
                                </div>
                                <div class="bg-os-900/40 rounded-xl border border-white/5 p-3 space-y-2 max-h-[500px] overflow-y-auto no-scrollbar">
                                    <div class="text-[9px] text-cyan-400 uppercase tracking-wider font-mono font-bold border-b border-white/5 pb-1.5 flex items-center gap-1.5 sticky top-0 bg-os-900/95 backdrop-blur"><i data-lucide="music-2" class="w-3.5 h-3.5"></i> Favorite Tracks</div>
                                    ${tracksRows}
                                </div>
                            </div>
                        </div>
                    `;
                } else if (activeTab === 'insights') {
                    const report = data.reports[activeReport];
                    const clockMax = Math.max(1, ...data.clock);
                    // 24-bar listening clock SVG
                    const clockBars = data.clock.map((v,h) => {
                        const pct = v / clockMax;
                        const hClass = pct > 0.66 ? 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]' : pct > 0.33 ? 'bg-cyan-600/80' : pct > 0 ? 'bg-cyan-900/80' : 'bg-white/5';
                        return `<div class="flex-1 flex flex-col-reverse items-center group" title="${String(h).padStart(2,'0')}:00 — ${v} scrobbles">
                            <div class="w-full ${hClass} rounded-t transition-all" style="height:${Math.max(4, pct*100)}%"></div>
                            ${h % 6 === 0 ? `<div class="text-[7px] text-gray-600 font-mono absolute -bottom-3.5">${String(h).padStart(2,'0')}h</div>`:''}
                        </div>`;
                    }).join('');

                    // Top-tags as music-ratio bar
                    const tagTotal = data.topTags.slice(0,6).reduce((s,t)=>s+t.count,0) || 1;
                    const tagPalette = ['bg-cyan-400','bg-fuchsia-400','bg-amber-400','bg-emerald-400','bg-rose-400','bg-violet-400'];
                    const ratioBar = data.topTags.slice(0,6).map((t,i)=>{
                        const pct = (t.count/tagTotal)*100;
                        return `<div class="${tagPalette[i]} h-full" style="width:${pct}%" title="${t.name} ${pct.toFixed(0)}%"></div>`;
                    }).join('') || '<div class="bg-white/10 h-full w-full"></div>';
                    const ratioLegend = data.topTags.slice(0,6).map((t,i)=>`<span class="text-[9px] font-mono text-gray-400 flex items-center gap-1"><span class="w-2 h-2 rounded ${tagPalette[i]}"></span>${t.name}</span>`).join('');

                    // Listening fingerprint cells
                    const reportBtn = (id,label) => `<button onclick="os.setMetricsReport('${id}')" class="px-2.5 py-1 rounded text-[9px] uppercase font-mono tracking-wider transition cursor-none hover-target ${activeReport === id ? 'bg-cyan-500/15 border border-cyan-400/20 text-cyan-300' : 'text-gray-500 hover:text-white border border-transparent'}">${label}</button>`;

                    const reportRow = (label, item) => item ? `
                        <a href="${item.url||'#'}" target="_blank" class="flex items-center gap-2 p-1.5 rounded bg-white/[0.02] border border-white/5 hover:border-cyan-500/20 transition cursor-none hover-target">
                            <img src="${item.image}" class="w-8 h-8 rounded object-cover shrink-0" onerror="this.src='${os._lfmFallbackImg(item.name)}'">
                            <div class="flex-1 truncate min-w-0">
                                <div class="text-[8px] text-gray-500 uppercase font-mono">${label}</div>
                                <div class="text-[10px] text-white font-bold truncate">${item.name}</div>
                                ${item.artist ? `<div class="text-[9px] text-gray-400 truncate">${item.artist}</div>`:''}
                            </div>
                            <div class="text-[9px] font-mono text-cyan-400 shrink-0">${item.playcount||''}</div>
                        </a>
                    ` : `<div class="p-1.5 text-[9px] font-mono text-gray-600 italic">No data</div>`;

                    contentHtml = `
                        <div class="grid grid-cols-2 gap-4">
                            <!-- Left column -->
                            <div class="space-y-4">
                                <div class="bg-os-900/50 border border-white/5 p-3 rounded-xl space-y-2.5">
                                    <div class="text-[9px] text-cyan-400 uppercase tracking-wider font-mono font-bold border-b border-white/5 pb-1 flex items-center gap-1.5"><i data-lucide="activity" class="w-3.5 h-3.5"></i> Listening Fingerprint</div>
                                    <div class="grid grid-cols-2 gap-2 text-[9px] font-mono leading-relaxed">
                                        <div><span class="text-gray-500 block">TOP TAG</span><b class="text-white">${data.fingerprint.topTag}</b></div>
                                        <div><span class="text-gray-500 block">DIVERSITY</span><b class="text-white">${data.fingerprint.diversity} tags</b></div>
                                        <div><span class="text-gray-500 block">LISTENING TIME</span><b class="text-white">${data.fingerprint.listeningTime}</b></div>
                                        <div><span class="text-gray-500 block">DAILY AVERAGE</span><b class="text-white">${data.fingerprint.avgScrobbles}</b></div>
                                        <div class="col-span-2"><span class="text-gray-500 block">MOST ACTIVE DAY</span><b class="text-white">${data.fingerprint.activeDay}</b></div>
                                    </div>
                                </div>

                                <div class="bg-os-900/50 border border-white/5 p-3 rounded-xl space-y-2">
                                    <div class="text-[9px] text-cyan-400 uppercase tracking-wider font-mono font-bold border-b border-white/5 pb-1 flex items-center gap-1.5"><i data-lucide="pie-chart" class="w-3.5 h-3.5"></i> Music Ratio (Top Tags)</div>
                                    <div class="h-3 w-full bg-black/40 rounded overflow-hidden flex border border-white/5">${ratioBar}</div>
                                    <div class="flex flex-wrap gap-x-3 gap-y-1 pt-1">${ratioLegend}</div>
                                </div>

                                <div class="bg-os-900/50 border border-white/5 p-3 rounded-xl space-y-2">
                                    <div class="text-[9px] text-cyan-400 uppercase tracking-wider font-mono font-bold border-b border-white/5 pb-1 flex items-center gap-1.5"><i data-lucide="clock" class="w-3.5 h-3.5"></i> Listening Clock (Last 30d)</div>
                                    <div class="relative h-24 flex items-end justify-between gap-[2px] px-1 pt-2">${clockBars}</div>
                                    <div class="flex justify-between text-[7px] font-mono text-gray-600 px-1 pt-3 border-t border-white/5">
                                        <span>00h</span><span>06h</span><span>12h</span><span>18h</span><span>23h</span>
                                    </div>
                                </div>

                                <div class="bg-os-900/50 border border-white/5 p-3 rounded-xl">
                                    <div class="text-[9px] text-cyan-400 uppercase tracking-wider font-mono font-bold border-b border-white/5 pb-1 mb-2 flex items-center gap-1.5"><i data-lucide="zap" class="w-3.5 h-3.5"></i> Quick Facts</div>
                                    <div class="grid grid-cols-3 gap-2 text-center text-[9px] font-mono">
                                        <div class="p-2 bg-white/5 rounded border border-white/5"><div class="text-gray-500 mb-1">LISTENING TIME</div><b class="text-white">${data.fingerprint.listeningTime}</b></div>
                                        <div class="p-2 bg-white/5 rounded border border-white/5"><div class="text-gray-500 mb-1">AVG SCROBBLES</div><b class="text-white">${data.fingerprint.avgScrobbles}</b></div>
                                        <div class="p-2 bg-white/5 rounded border border-white/5"><div class="text-gray-500 mb-1">MOST ACTIVE</div><b class="text-white text-[8px]">${data.fingerprint.activeDay.split(' (')[0]}</b></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Right column -->
                            <div class="space-y-4">
                                <div class="bg-os-900/50 border border-white/5 p-3 rounded-xl space-y-2">
                                    <div class="flex items-center justify-between border-b border-white/5 pb-1">
                                        <div class="text-[9px] text-cyan-400 uppercase tracking-wider font-mono font-bold flex items-center gap-1.5"><i data-lucide="file-text" class="w-3.5 h-3.5"></i> Listening Reports</div>
                                        <div class="flex gap-1 bg-black/30 p-0.5 rounded border border-white/5">
                                            ${reportBtn('week','Week')}
                                            ${reportBtn('month','Month')}
                                            ${reportBtn('year','Year')}
                                        </div>
                                    </div>
                                    <div class="flex items-center justify-between bg-black/30 rounded p-2 border border-white/5">
                                        <div>
                                            <div class="text-[8px] text-gray-500 uppercase font-mono">${report.label}</div>
                                            <div class="text-2xl font-bold text-white leading-none">${report.scrobbles.toLocaleString()}</div>
                                            <div class="text-[9px] text-cyan-400 font-mono">scrobbles</div>
                                        </div>
                                        <i data-lucide="trending-up" class="w-8 h-8 text-cyan-400/40"></i>
                                    </div>
                                    <div class="space-y-1.5 pt-1">
                                        ${reportRow('TOP ARTIST', report.topArtist)}
                                        ${reportRow('TOP ALBUM', report.topAlbum)}
                                        ${reportRow('TOP TRACK', report.topTrack)}
                                    </div>
                                </div>

                                <div class="bg-os-900/50 border border-white/5 p-3 rounded-xl space-y-2">
                                    <div class="text-[9px] text-cyan-400 uppercase tracking-wider font-mono font-bold border-b border-white/5 pb-1 flex items-center gap-1.5"><i data-lucide="compass" class="w-3.5 h-3.5"></i> Neighbors</div>
                                    ${data.neighbors.length ? data.neighbors.map(n => `
                                        <a href="${os.escapeHtml(n.url || '#')}" target="_blank" class="flex items-center gap-2 p-1.5 rounded bg-white/[0.02] border border-white/5 hover:border-cyan-500/20 transition cursor-none hover-target">
                                            <img src="${os.escapeHtml(n.image || '')}" class="w-7 h-7 rounded-full object-cover shrink-0" onerror="this.src='${os._lfmFallbackImg(n.name)}'">
                                            <div class="flex-1 truncate">
                                                <div class="text-[10px] text-white font-bold truncate">${os.escapeHtml(n.name)}</div>
                                                ${n.country ? `<div class="text-[8px] text-gray-500 font-mono uppercase">${os.escapeHtml(n.country)}</div>`:''}
                                            </div>
                                            <div class="text-[9px] font-mono text-cyan-400 font-bold">${n.match != null ? n.match + '%' : '—'}</div>
                                        </a>
                                    `).join('') : '<div class="text-[9px] font-mono text-gray-600 italic">No neighbors identified.</div>'}
                                </div>
                            </div>
                        </div>
                    `;
                } else if (activeTab === 'community') {
                    const lbRows = (data.leaderboard || []).map(usr => {
                        const classes = usr.you 
                            ? 'flex items-center gap-2 p-1.5 rounded transition cursor-none hover-target border'
                            : 'flex items-center gap-2 p-1.5 rounded transition cursor-none hover-target bg-white/[0.02] border border-white/5 hover:border-white/10';
                        const styleAttr = usr.you 
                            ? 'style="background-color: color-mix(in srgb, var(--os-accent-custom) 12%, transparent); border-color: color-mix(in srgb, var(--os-accent-custom) 35%, transparent);"'
                            : '';
                        const youText = usr.you ? ` <span style="font-size:8px;color:var(--os-accent-custom);font-family:monospace;font-weight:bold;">(YOU)</span>` : '';
                        return `
                            <a href="${usr.url||'#'}" target="_blank" class="${classes}" ${styleAttr}>
                                <span class="w-5 text-center text-[10px] font-mono font-bold ${usr.rank === 1 ? 'text-yellow-400' : usr.rank === 2 ? 'text-gray-300' : usr.rank === 3 ? 'text-orange-400' : 'text-gray-500'}">#${usr.rank}</span>
                                <img src="${usr.image}" class="w-7 h-7 rounded-full object-cover shrink-0" onerror="this.src='${os._lfmFallbackImg(usr.name)}'">
                                <div class="flex-1 truncate text-[10px] text-white font-bold">${usr.name}${youText}</div>
                                <div class="text-[10px] font-mono text-white font-bold">${usr.scrobbles.toLocaleString()}</div>
                            </a>
                        `;
                    }).join('') || '<div class="text-[9px] font-mono text-gray-600 italic">No friends found.</div>';

                    const friendsGrid = (data.friends || []).map(f => `
                        <a href="${f.url}" target="_blank" class="flex flex-col items-center gap-1 p-2 rounded bg-white/[0.02] border border-white/5 hover:border-cyan-500/20 transition cursor-none hover-target text-center">
                            <img src="${f.image}" class="w-12 h-12 rounded-full object-cover" onerror="this.src='${os._lfmFallbackImg(f.name)}'">
                            <div class="text-[10px] text-white font-bold truncate w-full">${f.name}</div>
                            <div class="text-[8px] font-mono text-gray-500 uppercase">${f.country||'—'}</div>
                            <div class="text-[8px] font-mono text-cyan-400">${f.playcount.toLocaleString()} plays</div>
                        </a>
                    `).join('') || '<div class="text-[9px] font-mono text-gray-600 italic col-span-full">No followers / following on record.</div>';

                    contentHtml = `
                        <div class="grid grid-cols-2 gap-4">
                            <div class="bg-os-900/50 border border-white/5 p-3 rounded-xl space-y-2 max-h-[480px] overflow-y-auto no-scrollbar">
                                <div class="text-[9px] text-cyan-400 uppercase tracking-wider font-mono font-bold border-b border-white/5 pb-1 flex items-center gap-1.5 sticky top-0 bg-os-900/95 backdrop-blur"><i data-lucide="trophy" class="w-3.5 h-3.5"></i> Scrobble Leaderboard</div>
                                ${lbRows}
                            </div>
                            <div class="space-y-3">
                                <div class="grid grid-cols-3 gap-2 text-center text-[9px] font-mono leading-none">
                                    <div class="p-2 bg-white/5 rounded border border-white/5"><div class="text-gray-500 mb-1">FOLLOWING</div><b class="text-white text-base">${data.user.following}</b></div>
                                    <div class="p-2 bg-white/5 rounded border border-white/5"><div class="text-gray-500 mb-1">FOLLOWERS</div><b class="text-white text-base">${data.user.followers}</b></div>
                                    <div class="p-2 bg-white/5 rounded border border-white/5"><div class="text-gray-500 mb-1">PLAYLISTS</div><b class="text-white text-base">${data.user.playlists}</b></div>
                                </div>
                                <div class="bg-os-900/50 border border-white/5 p-3 rounded-xl space-y-2 max-h-[400px] overflow-y-auto no-scrollbar">
                                    <div class="text-[9px] text-cyan-400 uppercase tracking-wider font-mono font-bold border-b border-white/5 pb-1 flex items-center gap-1.5 sticky top-0 bg-os-900/95 backdrop-blur"><i data-lucide="users" class="w-3.5 h-3.5"></i> Friends Network</div>
                                    <div class="grid grid-cols-3 gap-2">${friendsGrid}</div>
                                </div>
                            </div>
                        </div>
                    `;
                } else if (activeTab === 'loved') {
                    const lovedHtml = (data.lovedTracks || []).map(t => `
                        <a href="${t.url||'#'}" target="_blank" class="flex items-center gap-2 p-1.5 rounded bg-white/[0.02] border border-white/5 hover:border-rose-400/30 transition cursor-none hover-target">
                            <div class="relative shrink-0">
                                <img src="${t.image}" class="w-9 h-9 rounded object-cover" onerror="this.src='${os._lfmFallbackImg(t.name)}'">
                                <i data-lucide="heart" class="w-3 h-3 text-rose-400 fill-rose-400 absolute -bottom-0.5 -right-0.5 bg-black rounded-full p-0.5"></i>
                            </div>
                            <div class="flex-1 truncate">
                                <div class="text-[10px] text-white font-bold truncate">${t.name}</div>
                                <div class="text-[9px] text-gray-400 truncate">${t.artist}</div>
                            </div>
                            ${t.date ? `<div class="text-[8px] font-mono text-gray-500 shrink-0">${t.date}</div>`:''}
                        </a>
                    `).join('') || '<div class="text-[9px] font-mono text-gray-600 italic">No loved tracks yet.</div>';

                    const obsessionsHtml = (data.obsessions || []).map((t,i) => `
                        <a href="${t.url||'#'}" target="_blank" class="flex items-center gap-2 p-1.5 rounded bg-white/[0.02] border border-white/5 hover:border-cyan-500/20 transition cursor-none hover-target">
                            <div class="relative shrink-0">
                                <img src="${t.image}" class="w-9 h-9 rounded object-cover" onerror="this.src='${os._lfmFallbackImg(t.name)}'">
                                <div class="absolute -top-1 -left-1 px-1 rounded bg-black/80 border border-white/10 text-[8px] font-bold text-cyan-300">#${i+1}</div>
                            </div>
                            <div class="flex-1 truncate">
                                <div class="text-[10px] text-white font-bold truncate">${t.name}</div>
                                <div class="text-[9px] text-gray-400 truncate">${t.artist}</div>
                            </div>
                            <div class="text-[10px] font-mono text-cyan-400 font-bold shrink-0">${t.playcount}</div>
                        </a>
                    `).join('') || '<div class="text-[9px] font-mono text-gray-600 italic">No obsessions on record for the past week.</div>';

                    const recentHtml = (data.recent || []).slice(0,12).map(t => `
                        <a href="${t.url||'#'}" target="_blank" class="flex items-center gap-2 p-1.5 rounded bg-white/[0.02] border border-white/5 hover:border-cyan-500/20 transition cursor-none hover-target">
                            <img src="${t.image}" class="w-8 h-8 rounded object-cover shrink-0" onerror="this.src='${os._lfmFallbackImg(t.name)}'">
                            <div class="flex-1 truncate">
                                <div class="text-[10px] text-white font-bold truncate">${t.name}</div>
                                <div class="text-[9px] text-gray-400 truncate">${t.artist}</div>
                            </div>
                            <div class="text-[8px] font-mono ${t.nowPlaying ? 'text-cyan-300' : 'text-gray-500'} shrink-0 flex items-center gap-1">${t.nowPlaying ? '<span class="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse"></span> LIVE' : t.timeAgo}</div>
                        </a>
                    `).join('') || '<div class="text-[9px] font-mono text-gray-600 italic">No recent scrobbles.</div>';

                    contentHtml = `
                        <div class="grid grid-cols-3 gap-4">
                            <div class="bg-os-900/50 border border-white/5 p-3 rounded-xl space-y-2 max-h-[500px] overflow-y-auto no-scrollbar">
                                <div class="text-[9px] text-rose-400 uppercase tracking-wider font-mono font-bold border-b border-white/5 pb-1 flex items-center gap-1.5 sticky top-0 bg-os-900/95 backdrop-blur"><i data-lucide="heart" class="w-3.5 h-3.5 fill-rose-400"></i> Loved Tracks (${data.lovedTotal})</div>
                                ${lovedHtml}
                            </div>
                            <div class="bg-os-900/50 border border-white/5 p-3 rounded-xl space-y-2 max-h-[500px] overflow-y-auto no-scrollbar">
                                <div class="text-[9px] text-cyan-400 uppercase tracking-wider font-mono font-bold border-b border-white/5 pb-1 flex items-center gap-1.5 sticky top-0 bg-os-900/95 backdrop-blur"><i data-lucide="flame" class="w-3.5 h-3.5"></i> Obsessions (7D)</div>
                                ${obsessionsHtml}
                            </div>
                            <div class="bg-os-900/50 border border-white/5 p-3 rounded-xl space-y-2 max-h-[500px] overflow-y-auto no-scrollbar">
                                <div class="text-[9px] text-cyan-400 uppercase tracking-wider font-mono font-bold border-b border-white/5 pb-1 flex items-center gap-1.5 sticky top-0 bg-os-900/95 backdrop-blur"><i data-lucide="history" class="w-3.5 h-3.5"></i> Recent Scrobbles</div>
                                ${recentHtml}
                            </div>
                        </div>
                    `;
                }

                return `
                    <div class="flex-1 p-4 overflow-y-auto no-scrollbar flex flex-col min-h-0 bg-black/10 relative">
                        ${tabNavHtml}
                        <div class="flex-1 min-h-0" id="metrics-sub-content">
                            ${contentHtml}
                        </div>
                        <!-- Heatmap Day Detail Modal Overlay -->
                        <div id="heatmap-day-modal" class="absolute inset-0 bg-black/95 backdrop-blur-md hidden flex-col z-50 p-6 transition-all duration-300">
                            <div class="flex items-center justify-between border-b border-white/5 pb-3 mb-4 shrink-0">
                                <div class="flex items-center gap-2">
                                    <i data-lucide="calendar" class="w-4 h-4" style="color: var(--os-accent-custom); filter: drop-shadow(0 0 3px color-mix(in srgb, var(--os-accent-custom) 50%, transparent));"></i>
                                    <span class="font-display tracking-wider text-sm text-white font-bold" id="heatmap-day-modal-title">DAY DETAILS</span>
                                </div>
                                <button onclick="os.closeHeatmapDayDetails()" class="p-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-none hover-target">
                                    <i data-lucide="x" class="w-3.5 h-3.5 text-gray-400 hover:text-white"></i>
                                </button>
                            </div>
                            <div id="heatmap-day-modal-content" class="flex-1 overflow-y-auto no-scrollbar min-h-0 space-y-3">
                                <!-- Populated dynamically -->
                            </div>
                        </div>
                    </div>
                `;
            },

    setMetricsSubView: (view) => {
                os._activeMetricsTab = view;
                os.renderMediaDashboard();
            },

    setMetricsTimeframe: (timeframe) => {
                os._activeTimeframeTab = timeframe;
                os.renderMediaDashboard();
            },

    setMetricsReport: (r) => {
                os._activeReportTab = r;
                os.renderMediaDashboard();
            },

    setArtistTreemapTimeframe: (tf) => {
                os._activeArtistTreemapTimeframe = tf;
                os.renderMediaDashboard();
            },

    setAlbumTreemapTimeframe: (tf) => {
                os._activeAlbumTreemapTimeframe = tf;
                os.renderMediaDashboard();
            },

    initLastFmMetricsSubView: () => {
                const activeTab = os._activeMetricsTab || 'visuals';
                const data = os._lastFmMetricsCache;
                if (!data) return;

                if (activeTab === 'visuals') {
                    const artistTf = os._activeArtistTreemapTimeframe || 'all';
                    const albumTf = os._activeAlbumTreemapTimeframe || 'all';
                    
                    const artistItems = data.timeframeData[artistTf]?.artists || [];
                    const albumItems = data.timeframeData[albumTf]?.albums || [];

                    os.renderScrobbleCalendar(data.calendar);
                    os.renderTreemap(artistItems.slice(0, 10), 'top-entities-treemap-container', 'artist');
                    os.renderTreemap(albumItems.slice(0, 10), 'heavy-rotation-treemap-container', 'album');
                }
            },

    renderScrobbleCalendar: (calendarData) => {
                const container = document.getElementById('scrobble-heatmap-container');
                if (!container) return;

                const weeks = [];
                let currentWeek = [];
                calendarData.forEach((day, i) => {
                    currentWeek.push(day);
                    if (currentWeek.length === 7 || i === calendarData.length - 1) {
                        weeks.push(currentWeek);
                        currentWeek = [];
                    }
                });

                const levels = [
                    'bg-white/5 border border-white/5',
                    'bg-cyan-950/80 border border-cyan-900/50',
                    'bg-cyan-800/90 border border-cyan-700/50',
                    'bg-cyan-600 border border-cyan-500',
                    'bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.6)] border border-cyan-400'
                ];

                let html = `
                    <div class="flex w-max min-w-full font-mono text-[9px] select-none text-gray-500">
                        <div class="flex flex-col gap-1 pr-3 pt-[18px] shrink-0 text-[8px] text-gray-500 tracking-wider">
                            <div class="h-3 flex items-center"></div>
                            <div class="h-3 flex items-center">MON</div>
                            <div class="h-3 flex items-center"></div>
                            <div class="h-3 flex items-center">WED</div>
                            <div class="h-3 flex items-center"></div>
                            <div class="h-3 flex items-center">FRI</div>
                            <div class="h-3 flex items-center"></div>
                        </div>
                        <div class="flex flex-col">
                            <div class="flex gap-1 mb-2 h-3 shrink-0 text-[8px] text-gray-500 tracking-wider relative">
                `;

                weeks.forEach((week) => {
                    const d = new Date(week[0].date);
                    const showMonth = d.getDate() <= 7;
                    if (showMonth) {
                        const monthName = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                        html += `<div class="w-3 shrink-0 relative"><span class="absolute -left-1">${monthName}</span></div>`;
                    } else {
                        html += `<div class="w-3 shrink-0"></div>`;
                    }
                });

                html += `</div><div class="flex gap-1">`;

                const cellStyles = [
                    'background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.05);',
                    'background-color: color-mix(in srgb, var(--os-accent-custom) 20%, transparent); border: 1px solid color-mix(in srgb, var(--os-accent-custom) 30%, transparent);',
                    'background-color: color-mix(in srgb, var(--os-accent-custom) 50%, transparent); border: 1px solid color-mix(in srgb, var(--os-accent-custom) 60%, transparent);',
                    'background-color: color-mix(in srgb, var(--os-accent-custom) 80%, transparent); border: 1px solid color-mix(in srgb, var(--os-accent-custom) 90%, transparent);',
                    'background-color: var(--os-accent-custom); border: 1px solid var(--os-accent-custom); box-shadow: 0 0 8px color-mix(in srgb, var(--os-accent-custom) 60%, transparent);'
                ];

                weeks.forEach((week) => {
                    html += `<div class="flex flex-col gap-1">`;
                    week.forEach((day) => {
                        const formattedDate = new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                        const tooltip = `${formattedDate}: ${day.count} scrobbles`;
                        const safeTip = tooltip.replace(/'/g, "\\'");
                        html += `<div class="w-3 h-3 rounded-sm cursor-none hover-target transition-all duration-200 hover:scale-150 hover:z-20" style="${cellStyles[day.level]}" title="${tooltip}" onmouseenter="document.getElementById('scrobble-heatmap-tooltip').innerText='${safeTip}'" onmouseleave="document.getElementById('scrobble-heatmap-tooltip').innerText='Hover over cells to inspect daily metrics.'" onclick="os.showHeatmapDayDetails('${day.date}', ${day.count})"></div>`;
                    });
                    html += `</div>`;
                });

                html += `</div></div></div>`;
                container.innerHTML = html;
            },

    renderTreemap: (items, containerId, type='artist') => {
                const container = document.getElementById(containerId);
                if (!container) return;
                if (!items || !items.length) {
                    container.innerHTML = `<div class="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-gray-600 italic">No data to visualise.</div>`;
                    return;
                }
                const layoutNodes = os.computeTreemapLayout(items, 0, 0, 100, 100);

                let html = '';
                layoutNodes.forEach((node, i) => {
                    const isTiny = node.w < 12 || node.h < 12;
                    const hidePlaycount = node.w < 18 || node.h < 18;
                    const cardStyle = `left:${node.x}%; top:${node.y}%; width:${node.w}%; height:${node.h}%;`;
                    const fallback = os._lfmFallbackImg(node.name);
                    html += `
                        <a href="${node.url || '#'}" target="_blank" class="absolute p-0.5 group transition-all hover:scale-[1.01] hover:z-10 cursor-none hover-target" style="${cardStyle}">
                            <div class="relative w-full h-full overflow-hidden rounded-lg border border-black/40 bg-zinc-900 shadow-md flex flex-col justify-end p-2 transition-all duration-300 hover:border-white/20">
                                <img src="${node.image}" alt="${node.name}" class="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-luminosity group-hover:mix-blend-normal group-hover:opacity-80 group-hover:scale-105 transition-all duration-700" onerror="this.src='${fallback}'">
                                <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent pointer-events-none"></div>
                                ${!isTiny ? `<div class="absolute top-1.5 left-1.5 px-1 py-0.5 rounded bg-black/70 border border-white/10 text-[8px] font-bold text-white shadow">#${i + 1}</div>` : ''}
                                <div class="relative z-10 min-w-0">
                                    ${!isTiny ? `<h4 class="font-bold text-white truncate text-[10px] group-hover:underline leading-tight">${node.name}</h4>` : ''}
                                    ${type === 'album' && !hidePlaycount ? `<p class="text-[9px] text-white/50 truncate font-mono mt-0.5 leading-none">${node.artist || ''}</p>` : ''}
                                    ${!hidePlaycount ? `<div class="text-[9px] font-mono text-cyan-400 font-bold mt-0.5">${node.playcount} plays</div>` : ''}
                                </div>
                            </div>
                        </a>
                    `;
                });

                container.innerHTML = html;
            },

    computeTreemapLayout: (items, x, y, w, h) => {
                if (!items || items.length === 0) return [];
                if (items.length === 1) {
                    return [{ ...items[0], x, y, w, h }];
                }

                const totalVal = items.reduce((sum, item) => {
                    const val = parseInt(String(item.playcount).replace(/,/g, '')) || 1;
                    return sum + val;
                }, 0);

                let currentSum = 0;
                let splitIdx = 1;

                for (let i = 0; i < items.length; i++) {
                    const val = parseInt(String(items[i].playcount).replace(/,/g, '')) || 1;
                    currentSum += val;
                    if (currentSum >= totalVal / 2 || i === items.length - 2) {
                        splitIdx = i + 1;
                        break;
                    }
                }

                const firstGroup = items.slice(0, splitIdx);
                const secondGroup = items.slice(splitIdx);
                const firstSum = firstGroup.reduce((sum, item) => sum + (parseInt(String(item.playcount).replace(/,/g, '')) || 1), 0);

                const results = [];
                if (w > h) {
                    const firstW = w * (firstSum / totalVal);
                    results.push(...os.computeTreemapLayout(firstGroup, x, y, firstW, h));
                    results.push(...os.computeTreemapLayout(secondGroup, x + firstW, y, w - firstW, h));
                } else {
                    const firstH = h * (firstSum / totalVal);
                    results.push(...os.computeTreemapLayout(firstGroup, x, y, w, firstH));
                    results.push(...os.computeTreemapLayout(secondGroup, x, y + firstH, w, h - firstH));
                }
                return results;
            },

    generateAboutLastFmMetrics: () => {
                return os._lastFmMetricsCache;
            }
});
