// AetherOS — Anime Hub, Manga Reader, Retro TV & Reddit Gallery
window.extendOS({
    ytchtv: {
        currentSource: 'embed',
        currentChannelIndex: 0,
        currentVideoIndex: 0,
        channels: [
            { name: 'Lofi Hip Hop 24/7', id: '1', presetVideos: ['jfKfPfyJRdk', '4xDzrJKXOOY'] },
            { name: 'Synthwave Radio', id: '2', presetVideos: ['4xDzrJKXOOY', 'MVPTGnggS-Y'] },
            { name: 'NASA Live Earth', id: '3', presetVideos: ['xRPjKQtRXR8', '21X5lGlDOfg'] },
            { name: 'DW World News', id: '4', presetVideos: ['LuKwFajn37U'] },
            { name: 'Sky News Live', id: '5', presetVideos: ['YDvsBbKfLPA'] },
            { name: 'Tokyo Live Camera', id: '6', presetVideos: ['DjdUEyjx8GM'] },
            { name: 'Namib Desert Oasis', id: '7', presetVideos: ['ydYDqZQpim8'] },
            { name: 'Ocean Jellyfish Cam', id: '8', presetVideos: ['N609loYkFJo'] },
            { name: 'Chillhop Beats', id: '9', presetVideos: ['5yx6BWlEVcY'] },
            { name: 'Jazz Cafe Stream', id: '10', presetVideos: ['Dx5qFachd3A'] }
        ]
    },

    initYtchtv: () => {
        os.ytchtvRenderChannels();
        os.ytchSwitchSource('embed');
    },

    killYtchtv: () => {
        const iframe = document.getElementById('ytchtv-iframe');
        if (iframe) iframe.src = 'about:blank';
        const embedPlayer = document.getElementById('ytchtv-custom-youtube-player');
        if (embedPlayer) embedPlayer.src = 'about:blank';
    },

    ytchSwitchSource: (srcType) => {
        os.ytchtv.currentSource = srcType;

        const iframe = document.getElementById('ytchtv-iframe');
        const customEmbed = document.getElementById('ytchtv-custom-embed');
        const btnDirect = document.getElementById('ytch-btn-direct');
        const btnProxy = document.getElementById('ytch-btn-proxy');
        const btnEmbed = document.getElementById('ytch-btn-embed');
        const modeLbl = document.getElementById('ytch-mode-lbl');
        const modeLblSub = document.getElementById('ytch-mode-lbl-sub');

        [
            [btnEmbed, 'embed'],
            [btnDirect, 'direct'],
            [btnProxy, 'proxy']
        ].forEach(([btn, key]) => {
            if (btn) btn.className = `os-seg-btn hover-target cursor-none ${srcType === key ? 'active' : ''}`;
        });

        os.ytchtvTriggerStatic();

        if (srcType === 'direct') {
            if (iframe) { iframe.classList.remove('hidden'); iframe.style.display = 'block'; iframe.src = 'https://ytch.tv'; }
            if (customEmbed) customEmbed.style.display = 'none';
            if (modeLbl) modeLbl.innerText = 'YTCH.TV';
            if (modeLblSub) modeLblSub.innerText = 'YTCH.TV';
        } else if (srcType === 'proxy') {
            if (iframe) { iframe.classList.remove('hidden'); iframe.style.display = 'block'; iframe.src = 'https://ytch.xyz'; }
            if (customEmbed) customEmbed.style.display = 'none';
            if (modeLbl) modeLbl.innerText = 'YTCH Mirror';
            if (modeLblSub) modeLblSub.innerText = 'Mirror';
        } else {
            if (iframe) { iframe.style.display = 'none'; iframe.src = 'about:blank'; }
            if (customEmbed) customEmbed.style.display = 'flex';
            if (modeLbl) modeLbl.innerText = 'Curated Channels';
            if (modeLblSub) modeLblSub.innerText = 'YouTube';
            os.ytchtvTuneCustomChannel();
        }
    },

    ytchtvTriggerStatic: () => {
        const staticEl = document.getElementById('ytchtv-static');
        if (!staticEl) return;
        staticEl.style.opacity = '0.75';
        if (window.gsap) {
            gsap.fromTo(staticEl,
                { backgroundPosition: '0px 0px' },
                { backgroundPosition: '100px 100px', duration: 0.12, repeat: 2, ease: 'none', onComplete: () => { staticEl.style.opacity = '0'; } }
            );
        } else {
            setTimeout(() => { staticEl.style.opacity = '0'; }, 240);
        }
    },

    ytchtvRenderChannels: () => {
        const container = document.getElementById('ytchtv-channels-list');
        if (!container) return;

        container.innerHTML = os.ytchtv.channels.map((ch, idx) => {
            const isActive = idx === os.ytchtv.currentChannelIndex;
            return `
                <button type="button" onclick="os.ytchtvTuneChannel(${idx})"
                    class="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between cursor-none hover-target transition-colors ${isActive ? 'bg-white/12 text-white font-semibold' : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'}">
                    <span class="truncate text-[11px]"><span class="font-mono text-gray-500 mr-1">${String(idx + 1).padStart(2, '0')}</span>${os._html(ch.name)}</span>
                    <i data-lucide="play" class="w-3 h-3 shrink-0 ${isActive ? 'opacity-100 text-sky-300' : 'opacity-0'}"></i>
                </button>`;
        }).join('');

        if (window.lucide) lucide.createIcons({ root: container });
    },

    ytchtvTuneChannel: (idx) => {
        os.ytchtv.currentChannelIndex = idx;
        os.ytchtv.currentVideoIndex = 0;

        if (os.ytchtv.currentSource !== 'embed') {
            os.ytchSwitchSource('embed');
            return;
        }

        os.ytchtvTriggerStatic();
        os.ytchtvRenderChannels();

        const degrees = idx * (360 / os.ytchtv.channels.length);
        const dialHand = document.getElementById('ytchtv-dial-hand');
        if (dialHand) dialHand.style.transform = `rotate(${degrees}deg)`;

        const activeChLbl = document.getElementById('ytch-active-ch-lbl');
        if (activeChLbl) activeChLbl.innerText = `CH ${String(idx + 1).padStart(2, '0')}`;

        os.ytchtvTuneCustomChannel();
    },

    ytchtvTuneCustomChannel: (overrideVideoId = '', overrideTitle = '') => {
        const ch = os.ytchtv.channels[os.ytchtv.currentChannelIndex] || os.ytchtv.channels[0];
        const videoId = overrideVideoId || ch.presetVideos[os.ytchtv.currentVideoIndex % ch.presetVideos.length];

        const customPlayer = document.getElementById('ytchtv-custom-youtube-player');
        const chanNum = document.getElementById('ytchtv-custom-chan-num');
        const chanName = document.getElementById('ytchtv-custom-chan-name');
        const videoIdEl = document.getElementById('ytchtv-custom-video-id');

        if (chanNum) chanNum.innerText = overrideVideoId ? 'CUSTOM' : `CH ${String(os.ytchtv.currentChannelIndex + 1).padStart(2, '0')}`;
        if (chanName) chanName.innerText = overrideTitle || ch.name;
        if (videoIdEl) videoIdEl.innerText = videoId;

        if (customPlayer) {
            customPlayer.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&controls=1&rel=0&modestbranding=1`;
        }
    },

    ytchtvPlayCustomUrl: (raw) => {
        const str = String(raw || '').trim();
        if (!str) return;
        let vid = '';
        const match = str.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
        if (match) vid = match[1];
        else if (/^[A-Za-z0-9_-]{11}$/.test(str)) vid = str;
        if (!vid) {
            if (window.Notifications) Notifications.push('Retro TV', 'Enter a valid YouTube URL or 11-character Video ID.');
            return;
        }
        if (os.ytchtv.currentSource !== 'embed') os.ytchSwitchSource('embed');
        os.ytchtvTriggerStatic();
        os.ytchtvTuneCustomChannel(vid, 'Custom YouTube Stream');
    },

    ytchtvNextChannel: () => {
        const nextIdx = (os.ytchtv.currentChannelIndex + 1) % os.ytchtv.channels.length;
        os.ytchtvTuneChannel(nextIdx);
    },

    ytchtvPrevChannel: () => {
        const prevIdx = (os.ytchtv.currentChannelIndex - 1 + os.ytchtv.channels.length) % os.ytchtv.channels.length;
        os.ytchtvTuneChannel(prevIdx);
    },

    ytchtvCopyVideoId: () => {
        const videoIdEl = document.getElementById('ytchtv-custom-video-id');
        if (videoIdEl && videoIdEl.innerText !== '--') {
            if(!navigator.clipboard){window.Notifications?.push('Retro TV','Clipboard unavailable. Copy the video ID manually.');return;}
            navigator.clipboard.writeText(`https://youtu.be/${videoIdEl.innerText}`).then(()=>window.Notifications?.push('Retro TV','YouTube URL copied.'),()=>window.Notifications?.push('Retro TV','Clipboard permission denied. Copy the video ID manually.'));
        }
    },

    _mediaCard: (a, type = 'anime') => {
        const img = a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || '';
        const meta = [a.type, a.year || a.published?.prop?.from?.year, a.episodes ? a.episodes + ' eps' : a.chapters ? a.chapters + ' ch' : '', a.status].filter(Boolean).join(' · ');
        const genres = (a.genres || []).slice(0, 3).map((g) => `<span class="px-1.5 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.07] text-[10.5px] text-gray-300">${os._html(g.name)}</span>`).join('');
        return `<button type="button" onclick="${type === 'anime' ? `os.animeOpen(${a.mal_id})` : `os.mangaOpen(${a.mal_id})`}" class="w-full text-left rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition overflow-hidden cursor-none hover-target group"><div class="flex gap-3 p-2.5"><div class="w-16 h-24 rounded-lg overflow-hidden bg-black/60 shrink-0">${img ? `<img src="${img}" class="w-full h-full object-cover group-hover:scale-105 transition" loading="lazy">` : ''}</div><div class="min-w-0 flex-1"><div class="text-white font-semibold text-xs line-clamp-2 leading-snug">${os._html(a.title)}</div><div class="text-[11px] text-sky-300 mt-1 font-medium">★ ${a.score || '--'} · <span class="text-gray-400 font-normal">${os._html(meta)}</span></div><div class="flex flex-wrap gap-1 mt-1.5">${genres}</div><div class="text-[11px] text-gray-400 line-clamp-2 mt-1.5 leading-relaxed">${os._html(a.synopsis || 'No synopsis available.')}</div></div></div></button>`;
    },

    animeTrending: async () => { const el = document.getElementById('anime-results'); if (!el) return; el.innerHTML = '<div class="text-center text-gray-400 mt-16 text-xs">Loading top airing anime...</div>'; try { const j = await os._fetchJson('https://api.jikan.moe/v4/top/anime?filter=airing&limit=18'); el.innerHTML = (j.data || []).map((a) => os._mediaCard(a, 'anime')).join(''); if (j.data?.[0]) os.animeOpen(j.data[0].mal_id); } catch (e) { el.innerHTML = `<div class="text-rose-300 text-center mt-16 text-xs">Jikan unavailable: ${os._html(e.message)}</div>`; } },

    animeSeasonal: async () => { const el = document.getElementById('anime-results'); if (!el) return; el.innerHTML = '<div class="text-center text-gray-400 mt-16 text-xs">Loading seasonal anime...</div>'; try { const j = await os._fetchJson('https://api.jikan.moe/v4/seasons/now?sfw=true&limit=18'); el.innerHTML = (j.data || []).map((a) => os._mediaCard(a, 'anime')).join(''); if (j.data?.[0]) os.animeOpen(j.data[0].mal_id); } catch (e) { el.innerHTML = `<div class="text-rose-300 text-center mt-16 text-xs">Seasonal feed unavailable: ${os._html(e.message)}</div>`; } },

    animeRecommendations: async () => { const el = document.getElementById('anime-results'); if (!el) return; el.innerHTML = '<div class="text-center text-gray-400 mt-16 text-xs">Loading recommendations...</div>'; try { const j = await os._fetchJson('https://api.jikan.moe/v4/recommendations/anime'); const items = (j.data || []).flatMap((r) => r.entry || []).slice(0, 18).map((e) => ({ mal_id: e.mal_id, title: e.title, images: e.images, synopsis: 'Community recommendation' })); el.innerHTML = items.map((a) => os._mediaCard(a, 'anime')).join(''); } catch (e) { el.innerHTML = `<div class="text-rose-300 text-center mt-16 text-xs">Recommendations unavailable: ${os._html(e.message)}</div>`; } },

    animeSearch: async () => { const q = document.getElementById('anime-search')?.value.trim(); const el = document.getElementById('anime-results'); if (!q || !el) return; el.innerHTML = '<div class="text-center text-gray-400 mt-16 text-xs">Searching anime...</div>'; try { const j = await os._fetchJson('https://api.jikan.moe/v4/anime?q=' + encodeURIComponent(q) + '&sfw=true&limit=20'); el.innerHTML = (j.data || []).map((a) => os._mediaCard(a, 'anime')).join('') || '<div class="text-gray-400 text-center mt-8">No anime found.</div>'; if (j.data?.[0]) os.animeOpen(j.data[0].mal_id); } catch (e) { el.innerHTML = `<div class="text-rose-300 text-center mt-16 text-xs">Search failed: ${os._html(e.message)}</div>`; } },

    animeOpen: async (id) => {
        const el = document.getElementById('anime-detail'); if (!el) return;
        el.innerHTML = '<div class="text-center text-gray-400 mt-20 text-xs">Loading anime details...</div>';
        try {
            const [full, eps, streaming] = await Promise.allSettled([
                os._fetchJson(`https://api.jikan.moe/v4/anime/${id}/full`),
                os._fetchJson(`https://api.jikan.moe/v4/anime/${id}/episodes?page=1`),
                os._fetchJson(`https://api.jikan.moe/v4/anime/${id}/streaming`)
            ]);
            const a = full.value?.data;
            if (!a) throw new Error('No anime details returned');
            const img = a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || '';
            const trailer = a.trailer?.embed_url || (a.trailer?.youtube_id ? `https://www.youtube-nocookie.com/embed/${a.trailer.youtube_id}` : '');
            const streams = streaming.value?.data || [];
            const epList = eps.value?.data || [];
            el.innerHTML = `<div class="relative min-h-full"><div class="absolute inset-x-0 top-0 h-56 bg-cover bg-center opacity-20 blur-xl" style="background-image:url('${img}')"></div><div class="relative p-5"><div class="flex gap-5 flex-wrap sm:flex-nowrap"><img src="${img}" class="w-40 h-60 object-cover rounded-2xl border border-white/10 bg-black shadow-lg shrink-0"><div class="min-w-0 flex-1"><div class="text-sky-300 text-xs font-medium">${os._html(a.type || 'Anime')} · ${os._html(a.status || '')}</div><div class="text-white font-display font-bold text-2xl leading-tight mt-1">${os._html(a.title)}</div><div class="text-gray-400 text-xs mt-1">${os._html(a.title_japanese || '')}</div><div class="grid grid-cols-4 gap-2 mt-4 text-center text-xs"><div class="os-card p-2"><b class="text-white text-sm">★ ${a.score || '--'}</b><br><span class="text-gray-400 text-[11px]">Score</span></div><div class="os-card p-2"><b class="text-white text-sm">${a.episodes || '--'}</b><br><span class="text-gray-400 text-[11px]">Episodes</span></div><div class="os-card p-2"><b class="text-white text-sm">#${a.rank || '--'}</b><br><span class="text-gray-400 text-[11px]">Rank</span></div><div class="os-card p-2"><b class="text-white text-sm">${a.year || '--'}</b><br><span class="text-gray-400 text-[11px]">Year</span></div></div><div class="flex flex-wrap gap-1.5 mt-3">${(a.genres || []).map((g) => `<span class="os-badge text-gray-300">${os._html(g.name)}</span>`).join('')}</div><div class="flex gap-2 mt-4">${trailer ? `<button type="button" onclick="os.animePlayTrailer('${trailer.replace(/'/g, '&#39;')}')" class="os-btn-primary px-3.5 py-1.5 text-xs cursor-none hover-target">▶ Watch Trailer</button>` : ''}<a href="${a.url}" target="_blank" rel="noopener" class="os-btn px-3 py-1.5">MyAnimeList ↗</a></div></div></div><div id="anime-player" class="mt-5 ${trailer ? '' : 'hidden'} rounded-2xl overflow-hidden border border-white/10 bg-black"></div><div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5"><div class="os-card p-4"><div class="text-white font-semibold text-xs mb-2">Synopsis</div><div class="text-gray-300 text-xs leading-relaxed select-text">${os._html(a.synopsis || 'No synopsis.')}</div></div><div class="os-card p-4"><div class="text-white font-semibold text-xs mb-2">Streaming &amp; Episodes</div><div class="flex flex-wrap gap-1.5 mb-3">${streams.length ? streams.map((s) => `<a target="_blank" rel="noopener" href="${s.url}" class="os-btn text-emerald-300">${os._html(s.name)} ↗</a>`).join('') : '<span class="text-gray-500 text-xs">No official streaming links listed.</span>'}</div><div class="space-y-1.5 max-h-48 overflow-y-auto">${epList.slice(0, 20).map((ep) => `<div class="p-2 rounded-lg bg-black/30 border border-white/[0.06] text-xs"><span class="text-sky-300 font-mono mr-1.5">EP ${ep.mal_id}</span><span class="text-gray-200">${os._html(ep.title || 'Untitled')}</span></div>`).join('')}</div></div></div></div></div>`;
        } catch (e) { el.innerHTML = `<div class="text-rose-300 text-center mt-20 text-xs">Anime details unavailable: ${os._html(e.message)}</div>`; }
    },

    animePlayTrailer: (url) => { const p = document.getElementById('anime-player'); if (p) { p.classList.remove('hidden'); p.innerHTML = `<iframe src="${url}${url.includes('?') ? '&' : '?'}autoplay=1&rel=0" class="w-full h-72 border-0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`; p.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } },

    initManga: () => {
        const list = JSON.parse(localStorage.getItem('AetherOS_Manga_List') || '[]');
        if (list.length) os.mangaRenderList();
        else os.mangaTrending();
    },

    mangaTrending: async () => { const el = document.getElementById('manga-results'); if (!el) return; el.innerHTML = '<div class="text-center text-gray-400 mt-16 text-xs">Loading top manga...</div>'; try { const j = await os._fetchJson('https://api.jikan.moe/v4/top/manga?limit=20'); el.innerHTML = (j.data || []).map((a) => os._mediaCard(a, 'manga')).join(''); if (j.data?.[0]) os.mangaOpen(j.data[0].mal_id); } catch (e) { el.innerHTML = `<div class="text-rose-300 text-center mt-16 text-xs">Jikan unavailable: ${os._html(e.message)}</div>`; } },

    mangaSearch: async () => { const q = document.getElementById('manga-search')?.value.trim(); const el = document.getElementById('manga-results'); if (!q || !el) return; el.innerHTML = '<div class="text-center text-gray-400 mt-16 text-xs">Searching manga...</div>'; try { const j = await os._fetchJson('https://api.jikan.moe/v4/manga?q=' + encodeURIComponent(q) + '&sfw=true&limit=20'); el.innerHTML = (j.data || []).map((a) => os._mediaCard(a, 'manga')).join('') || '<div class="text-gray-400 text-center mt-8">No manga found.</div>'; if (j.data?.[0]) os.mangaOpen(j.data[0].mal_id); } catch (e) { el.innerHTML = `<div class="text-rose-300 text-center mt-16 text-xs">Search failed: ${os._html(e.message)}</div>`; } },

    mangaOpen: async (id) => {
        const el = document.getElementById('manga-detail'); if (!el) return;
        el.innerHTML = '<div class="text-center text-gray-400 mt-20 text-xs">Loading manga details...</div>';
        try {
            const j = await os._fetchJson(`https://api.jikan.moe/v4/manga/${id}/full`);
            const m = j.data;
            const img = m.images?.jpg?.large_image_url || m.images?.jpg?.image_url || '';
            os._currentMangaObj = { title: m.title, url: m.url, img, score: m.score || '', mal_id: m.mal_id };
            el.innerHTML = `<div class="relative min-h-full"><div class="absolute inset-x-0 top-0 h-56 bg-cover bg-center opacity-20 blur-xl" style="background-image:url('${os._html(img)}')"></div><div class="relative p-5"><div class="flex gap-5 flex-wrap sm:flex-nowrap"><img src="${os._html(img)}" class="w-40 h-60 object-cover rounded-2xl border border-white/10 bg-black shrink-0"><div class="flex-1 min-w-0"><div class="text-emerald-300 text-xs font-medium">${os._html(m.type || 'Manga')} · ${os._html(m.status || '')}</div><div class="text-white font-display font-bold text-2xl leading-tight mt-1">${os._html(m.title)}</div><div class="text-gray-400 text-xs mt-1">${os._html(m.title_japanese || '')}</div><div class="grid grid-cols-4 gap-2 mt-4 text-center text-xs"><div class="os-card p-2"><b class="text-white text-sm">★ ${m.score || '--'}</b><br><span class="text-gray-400 text-[11px]">Score</span></div><div class="os-card p-2"><b class="text-white text-sm">${m.chapters || '--'}</b><br><span class="text-gray-400 text-[11px]">Chapters</span></div><div class="os-card p-2"><b class="text-white text-sm">${m.volumes || '--'}</b><br><span class="text-gray-400 text-[11px]">Volumes</span></div><div class="os-card p-2"><b class="text-white text-sm">#${m.rank || '--'}</b><br><span class="text-gray-400 text-[11px]">Rank</span></div></div><div class="flex flex-wrap gap-1.5 mt-3">${(m.genres || []).map((g) => `<span class="os-badge text-gray-300">${os._html(g.name)}</span>`).join('')}</div><div class="flex gap-2 mt-4 flex-wrap"><button type="button" onclick="os.mangaDexResolve(os._currentMangaObj.title)" class="os-btn-primary px-3.5 py-1.5 text-xs cursor-none hover-target">Read Chapters (MangaDex)</button><button type="button" onclick="os.mangaAdd(os._currentMangaObj)" class="os-btn text-emerald-300 px-3 py-1.5 cursor-none hover-target">+ Reading List</button><a href="${os._html(m.url)}" target="_blank" rel="noopener" class="os-btn px-3 py-1.5">MyAnimeList ↗</a></div></div></div><div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5"><div class="os-card p-4"><div class="text-white font-semibold text-xs mb-2">Synopsis</div><div class="text-gray-300 text-xs leading-relaxed select-text">${os._html(m.synopsis || 'No synopsis.')}</div></div><div class="os-card p-4"><div class="text-white font-semibold text-xs mb-2">Chapter Selector</div><div id="mangadex-panel" class="text-gray-400 text-xs">Click “Read Chapters” to search English chapters on MangaDex.</div></div></div><div id="manga-reader" class="mt-5"></div></div></div>`;
        } catch (e) { el.innerHTML = `<div class="text-rose-300 text-center mt-20 text-xs">Manga details unavailable: ${os._html(e.message)}</div>`; }
    },

    mangaDexResolveByIndex: (i) => { const list = JSON.parse(localStorage.getItem('AetherOS_Manga_List') || '[]'); if (list[i]?.title) os.mangaDexResolve(list[i].title); },

    mangaDexResolve: async (title) => {
        const panel = document.getElementById('mangadex-panel'); if (!panel) return;
        panel.innerHTML = '<div class="text-gray-400 text-xs">Searching MangaDex...</div>';
        try {
            const md = await os._fetchJson('https://api.mangadex.org/manga?limit=8&availableTranslatedLanguage[]=en&includes[]=cover_art&title=' + encodeURIComponent(title));
            const manga = (md.data || [])[0];
            if (!manga) throw new Error('No MangaDex match');
            const feed = await os._fetchJson(`https://api.mangadex.org/manga/${manga.id}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=50`);
            const chapters = (feed.data || []).filter((c) => c.type === 'chapter');
            panel.innerHTML = `<div class="text-white font-semibold text-xs mb-2">${os._html(manga.attributes?.title?.en || title)}</div><div class="space-y-1 max-h-64 overflow-y-auto">${chapters.map((ch) => `<button type="button" onclick="os.mangaReadChapter('${ch.id}')" class="w-full text-left p-2 rounded-lg bg-black/35 border border-white/[0.06] hover:bg-white/10 text-xs cursor-none hover-target"><span class="text-emerald-300 font-mono mr-1.5">Ch. ${os._html(ch.attributes?.chapter || '?')}</span><span class="text-gray-300">${os._html(ch.attributes?.title || '')}</span></button>`).join('') || '<div class="text-gray-400">No English chapters hosted on MangaDex.</div>'}</div>`;
        } catch (e) { panel.innerHTML = `<div class="text-rose-300 text-xs">MangaDex lookup failed: ${os._html(e.message)}</div>`; }
    },

    mangaReadChapter: async (chapterId) => {
        const r = document.getElementById('manga-reader'); if (!r) return;
        r.innerHTML = '<div class="text-center text-gray-400 py-10 text-xs">Loading chapter pages...</div>';
        try {
            const at = await os._fetchJson(`https://api.mangadex.org/at-home/server/${chapterId}`);
            const pages = at.chapter?.data || [];
            const base = at.baseUrl, hash = at.chapter.hash;
            r.innerHTML = `<div class="rounded-2xl border border-white/10 bg-black/60 p-3"><div class="sticky top-0 z-10 bg-black/85 backdrop-blur border border-white/10 rounded-xl px-3 py-2 mb-3 flex justify-between items-center"><span class="text-white font-semibold text-xs">MangaDex Reader · ${pages.length} pages</span><button type="button" onclick="document.getElementById('manga-reader').innerHTML=''" class="os-btn text-rose-300 cursor-none hover-target">Close Reader</button></div><div class="space-y-3">${pages.map((pg) => `<img src="${base}/data/${hash}/${pg}" class="mx-auto max-w-full rounded-lg border border-white/10 bg-black" loading="lazy">`).join('')}</div></div>`;
            r.scrollIntoView({ behavior: 'smooth' });
        } catch (e) { r.innerHTML = `<div class="text-rose-300 text-center py-10 text-xs">Chapter reader unavailable: ${os._html(e.message)}</div>`; }
    },

    mangaAdd: (m) => { const list = JSON.parse(localStorage.getItem('AetherOS_Manga_List') || '[]'); if (!list.some((x) => x.url === m.url)) list.unshift({ ...m, progress: m.progress || 'Reading', added: Date.now() }); localStorage.setItem('AetherOS_Manga_List', JSON.stringify(list.slice(0, 80))); os.mangaRenderList(); if (window.Notifications) Notifications.push('Manga Reader', 'Saved to Reading List.'); },

    mangaRenderList: () => { const el = document.getElementById('manga-results'); if (!el) return; const list = JSON.parse(localStorage.getItem('AetherOS_Manga_List') || '[]'); el.innerHTML = list.length ? list.map((m, i) => `<div class="flex gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08]"><img src="${os._html(m.img)}" class="w-14 h-20 object-cover rounded-lg bg-black shrink-0"><div class="min-w-0 flex-1"><button type="button" onclick="${m.mal_id ? `os.mangaOpen(${Number(m.mal_id)})` : `window.open('${os._html(m.url)}','_blank')`}" class="text-white font-semibold text-xs hover:underline text-left line-clamp-2 cursor-none hover-target">${os._html(m.title)}</button><div class="text-gray-400 text-[11px] mt-1">★ ${os._html(m.score || '--')} · ${os._html(m.progress || 'Saved')}</div><div class="flex gap-2 mt-2"><button type="button" onclick="os.mangaDexResolveByIndex(${i})" class="text-emerald-300 text-[11px] cursor-none hover-target">Chapters</button><button type="button" onclick="os.mangaRemove(${i})" class="text-rose-400 text-[11px] cursor-none hover-target">Remove</button></div></div></div>`).join('') : '<div class="text-gray-400 text-center mt-10 text-xs">Your reading list is empty.</div>'; },

    mangaRemove: (i) => { const list = JSON.parse(localStorage.getItem('AetherOS_Manga_List') || '[]'); list.splice(i, 1); localStorage.setItem('AetherOS_Manga_List', JSON.stringify(list)); os.mangaRenderList(); },

    mangaClearList: () => { if (confirm('Clear manga reading list?')) { localStorage.removeItem('AetherOS_Manga_List'); os.mangaRenderList(); } },

    memeSource: 'memes',
    memeSort: 'hot',
    memeTimer: null,
    _customSubreddits: [],

    renderMemeButtons: () => {
        const container = document.getElementById('memes-source-buttons');
        if (!container) return;

        const defaultSubs = ['memes', 'earthporn', 'spaceporn', 'cats', 'programmerhumor'];
        const customStr = SystemState.settings.api_custom_subreddits || '';
        const customSubs = customStr.split(',').map((s) => s.trim()).filter(Boolean);
        const allSubs = [...new Set([...defaultSubs, ...customSubs, ...(os._customSubreddits || [])])];

        if (!allSubs.includes(os.memeSource)) {
            os.memeSource = allSubs[0] || 'memes';
        }

        container.innerHTML = allSubs.map((s) => `
            <button type="button" onclick="os.setMemeSource('${os._html(s)}')" id="btn-meme-${os._html(s)}" class="px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-none hover-target transition-colors shrink-0 border ${os.memeSource === s ? 'bg-white/14 text-white border-white/20' : 'bg-white/[0.03] text-gray-400 border-white/[0.06] hover:text-white'}">r/${os._html(s)}</button>
        `).join('');
    },

    setMemeSubreddit: (rawSub) => {
        const sub = String(rawSub || '').trim().replace(/^r\//i, '').replace(/[^A-Za-z0-9_]/g, '');
        if (!sub) return;
        os._customSubreddits = [...new Set([...(os._customSubreddits || []), sub])];
        const inp = document.getElementById('memes-custom-sub');
        if (inp) inp.value = '';
        os.setMemeSource(sub);
    },

    setMemeSort: (sort) => {
        os.memeSort = ['hot', 'top', 'new'].includes(sort) ? sort : 'hot';
        os.fetchMemes();
    },

    setMemeSource: (src) => {
        os.memeSource = src;
        os.renderMemeButtons();
        const container = document.getElementById('memes-container');
        if (container) container.innerHTML = `<div class="col-span-2 text-center text-gray-400 py-10 text-xs">Loading r/${os._html(src)}...</div>`;
        os.fetchMemes();
    },

    openMemeLightbox: (url) => {
        const box = document.getElementById('memes-lightbox');
        const img = document.getElementById('memes-lightbox-img');
        if (!box || !img) return;
        img.src = url;
        box.classList.remove('hidden');
        box.classList.add('flex');
    },

    initMemes: () => {
        os.renderMemeButtons();
        os.fetchMemes();
    },

    killMemes: () => {
        if (os.memeTimer) {
            clearInterval(os.memeTimer);
            os.memeTimer = null;
        }
    },

    fetchMemes: async () => {
        const container = document.getElementById('memes-container');
        if (!container) return;

        const refreshBtn = document.getElementById('btn-meme-refresh');
        const refreshIcon = refreshBtn ? refreshBtn.querySelector('i') : null;
        if (refreshIcon) refreshIcon.classList.add('animate-spin');

        const sort = os.memeSort || 'hot';
        const sortQuery = sort === 'top' ? 'top.json?t=day&limit=36' : `${sort}.json?limit=36`;
        const rawTargetUrl = `https://www.reddit.com/r/${encodeURIComponent(os.memeSource)}/${sortQuery}`;
        const proxyChain = [
            rawTargetUrl,
            `https://corsproxy.io/?url=${encodeURIComponent(rawTargetUrl)}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(rawTargetUrl)}`
        ];

        let posts = [];
        let lastErr = '';

        for (const proxyUrl of proxyChain) {
            try {
                const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(7000) });
                if (!res.ok) { lastErr = `HTTP ${res.status}`; continue; }
                const json = await res.json();
                if (json?.data?.children) {
                    posts = json.data.children
                        .map((c) => c.data)
                        .filter((p) => !p.over_18 && !p.is_video && p.url && /\.(jpg|jpeg|png|gif|webp)$/i.test(p.url))
                        .map((p) => ({
                            title: p.title || '',
                            url: p.url,
                            score: p.score || 0,
                            author: p.author || 'reddit',
                            permalink: `https://www.reddit.com${p.permalink || ''}`
                        }));
                    if (posts.length) break;
                }
            } catch (e) { lastErr = e.message; }
        }

        // Fast zero-CORS fallback via Meme-API (D3vd/Meme_Api)
        if (!posts.length) {
            try {
                const res = await fetch(`https://meme-api.com/gimme/${encodeURIComponent(os.memeSource)}/24`, { signal: AbortSignal.timeout(7000) });
                if (res.ok) {
                    const j = await res.json();
                    posts = (j.memes || [])
                        .filter((m) => !m.nsfw && m.url)
                        .map((m) => ({
                            title: m.title || '',
                            url: m.url,
                            score: m.ups || 0,
                            author: m.author || 'reddit',
                            permalink: m.postLink || m.url
                        }));
                }
            } catch (e) { lastErr = e.message; }
        }

        try {
            if (!posts.length) throw new Error(lastErr || 'No image posts found in this subreddit.');

            os._lastMemePosts = posts;
            container.innerHTML = posts.map((post, idx) => `
                <div class="break-inside-avoid relative group border border-white/10 rounded-xl overflow-hidden bg-[#0b0e16] hover-target cursor-none shadow-md mb-3.5" onclick="os.openMemeLightbox(os._lastMemePosts[${idx}].url)">
                    <img src="${os._html(post.url)}" class="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-300" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.style.display='none'">
                    <div class="p-2.5 bg-black/50 border-t border-white/[0.06]">
                        <div class="text-gray-100 text-xs font-medium line-clamp-2 leading-snug">${os._html(post.title)}</div>
                        <div class="text-[11px] text-gray-400 flex items-center justify-between mt-1.5">
                            <span class="text-emerald-300 font-mono">▲ ${Number(post.score || 0).toLocaleString()}</span>
                            <div class="flex items-center gap-2">
                                <button type="button" onclick="event.stopPropagation(); SystemState.settings.wallpaper_custom_url = os._lastMemePosts[${idx}].url; os.setOption('wallpaper_mode','custom'); window.Notifications && Notifications.push('Wallpaper','Applied image backdrop');" class="text-sky-300 hover:underline cursor-none hover-target">Wallpaper</button>
                                <a href="${os._html(post.permalink)}" target="_blank" rel="noopener" onclick="event.stopPropagation()" class="text-gray-400 hover:text-white">Post ↗</a>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
            if (window.lucide) lucide.createIcons({ root: container });
        } catch (e) {
            container.innerHTML = `<div class="text-center text-rose-300 py-10 w-full col-span-2 text-xs">Unable to load r/${os._html(os.memeSource)}<div class="text-[11px] text-gray-500 mt-1">${os._html(e.message)}</div></div>`;
        } finally {
            if (refreshIcon) refreshIcon.classList.remove('animate-spin');
        }
    }
});
