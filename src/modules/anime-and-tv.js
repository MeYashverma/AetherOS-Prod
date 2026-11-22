// AetherOS — Anime & Manga Explorer, YTCH Retro TV & Memetic Intelligence
window.extendOS({
    ytchtv: {
                currentSource: 'direct', // 'direct', 'proxy', 'embed'
                currentChannelIndex: 0,
                currentVideoIndex: 0,
                channels: [
                    { name: 'Science & Technology', id: '1', presetVideos: ['H1K6S89pA_o', 'Y3rD7X4-A7E', 'g2_qgXmO0mY'] },
                    { name: 'Synthwave & Cyberpunk', id: '2', presetVideos: ['Y-N3yZPrvIM', '4xDzrJKXOOY', 'EB4X_uS-xoo', 't8NlI966-E8'] },
                    { name: 'Food & Cooking', id: '3', presetVideos: ['P6Vw_PAtKrc', 'K_9tX4eHh7c', '87gRNoYOnFw'] },
                    { name: 'Space & Astro', id: '4', presetVideos: ['8Z8_6N2Z02o', 'dwY7w05vX-s', 'un08g_8u9Ao'] },
                    { name: 'Retro Computing', id: '5', presetVideos: ['tD-tC_4hTMI', 'H1K6S89pA_o', 'YpGAt8uAc6g'] },
                    { name: 'Ambient & Lo-Fi', id: '6', presetVideos: ['jfKfPfyJRdk', 'n61ULEU7CO0', 'MVPTGnggS-Y'] },
                    { name: 'Nature & Exploration', id: '7', presetVideos: ['dwY7w05vX-s', '8Z8_6N2Z02o'] },
                    { name: 'Classic Animation', id: '8', presetVideos: ['o3N_unF9GqM', 'Y-N3yZPrvIM'] },
                    { name: 'Movie Archive', id: '9', presetVideos: ['t8NlI966-E8', 'EB4X_uS-xoo'] },
                    { name: 'Gaming Zone', id: '10', presetVideos: ['YpGAt8uAc6g', '4xDzrJKXOOY'] },
                    { name: 'Retro Ads', id: '11', presetVideos: ['_S8PzU_C8iU', 't8NlI966-E8'] },
                    { name: 'Cyber Culture', id: '12', presetVideos: ['tD-tC_4hTMI', 'Y-N3yZPrvIM'] },
                    { name: 'Synth Pop & Beats', id: '13', presetVideos: ['n61ULEU7CO0', '4xDzrJKXOOY'] },
                    { name: 'Vintage Documentaries', id: '14', presetVideos: ['H1K6S89pA_o', 'tD-tC_4hTMI'] },
                    { name: 'Abstract Art', id: '15', presetVideos: ['un08g_8u9Ao', 'Y-N3yZPrvIM'] },
                    { name: 'Tech Demos', id: '16', presetVideos: ['Y3rD7X4-A7E', 'g2_qgXmO0mY'] },
                    { name: 'Late Night Chill', id: '17', presetVideos: ['jfKfPfyJRdk', 'MVPTGnggS-Y'] }
                ]
            },

    initYtchtv: () => {
                os.logTerminal('Retro TV: Cathode tube warming up...');
                os.ytchSwitchSource('direct');
                os.ytchtvRenderChannels();
            },

    killYtchtv: () => {
                const iframe = document.getElementById('ytchtv-iframe');
                if (iframe) iframe.src = 'about:blank';
                const embedPlayer = document.getElementById('ytchtv-custom-youtube-player');
                if (embedPlayer) embedPlayer.src = 'about:blank';
                os.logTerminal('Retro TV: Cathode transmission disconnected.');
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

                // Clear active states
                [btnDirect, btnProxy, btnEmbed].forEach(btn => {
                    if (btn) btn.className = "px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-gray-400 hover:text-white hover:bg-white/10 transition cursor-none hover-target";
                });

                os.ytchtvTriggerStatic();

                if (srcType === 'direct') {
                    if (btnDirect) btnDirect.className = "px-2 py-0.5 bg-white/20 border border-white/15 rounded text-[9px] text-white hover:bg-white/15 transition cursor-none hover-target animate-pulse";
                    if (iframe) {
                        iframe.style.display = 'block';
                        iframe.src = 'https://ytch.tv';
                    }
                    if (customEmbed) customEmbed.style.display = 'none';
                    if (modeLbl) modeLbl.innerText = 'YTCH.TV';
                    if (modeLblSub) modeLblSub.innerText = 'DIRECT';
                    os.logTerminal('Retro TV: Tuned direct antenna to https://ytch.tv');
                } else if (srcType === 'proxy') {
                    if (btnProxy) btnProxy.className = "px-2 py-0.5 bg-white/20 border border-white/15 rounded text-[9px] text-white hover:bg-white/15 transition cursor-none hover-target animate-pulse";
                    if (iframe) {
                        iframe.style.display = 'block';
                        iframe.src = 'https://ytch.xyz';
                    }
                    if (customEmbed) customEmbed.style.display = 'none';
                    if (modeLbl) modeLbl.innerText = 'YTCH.XYZ';
                    if (modeLblSub) modeLblSub.innerText = 'MIRROR';
                    os.logTerminal('Retro TV: Tuned mirror antenna to https://ytch.xyz');
                } else if (srcType === 'embed') {
                    if (btnEmbed) btnEmbed.className = "px-2 py-0.5 bg-white/20 border border-white/15 rounded text-[9px] text-white hover:bg-white/15 transition cursor-none hover-target animate-pulse";
                    if (iframe) iframe.style.display = 'none';
                    if (customEmbed) customEmbed.style.display = 'flex';
                    if (modeLbl) modeLbl.innerText = 'RETRO';
                    if (modeLblSub) modeLblSub.innerText = 'EMBED';
                    os.logTerminal('Retro TV: Tuned to custom retro TV broadcast simulator.');
                    os.ytchtvTuneCustomChannel();
                }
            },

    ytchtvTriggerStatic: () => {
                const staticEl = document.getElementById('ytchtv-static');
                if (!staticEl) return;
                
                staticEl.style.opacity = '0.9';
                
                gsap.fromTo(staticEl, 
                    { backgroundPosition: '0px 0px' },
                    { backgroundPosition: '100px 100px', duration: 0.15, repeat: 3, ease: 'none',
                      onComplete: () => {
                          staticEl.style.opacity = '0';
                      }
                    }
                );
            },

    ytchtvRenderChannels: () => {
                const container = document.getElementById('ytchtv-channels-list');
                if (!container) return;

                container.innerHTML = os.ytchtv.channels.map((ch, idx) => {
                    const isActive = idx === os.ytchtv.currentChannelIndex;
                    return `
                        <button onclick="os.ytchtvTuneChannel(${idx})"
                            class="w-full px-2 py-1 rounded text-left flex items-center justify-between cursor-none hover-target transition-colors ${isActive ? 'bg-white/10 text-white font-bold' : 'text-gray-500 hover:text-white hover:bg-white/5'}" style="outline: none;">
                            <span class="truncate">CH ${(idx+1).toString().padStart(2, '0')}: ${ch.name}</span>
                            <i data-lucide="play" class="w-2.5 h-2.5 ${isActive ? 'opacity-100' : 'opacity-0'}"></i>
                        </button>
                    `;
                }).join('');

                lucide.createIcons({ root: container });
            },

    ytchtvTuneChannel: (idx) => {
                os.ytchtv.currentChannelIndex = idx;
                os.ytchtv.currentVideoIndex = 0; 
                
                os.ytchtvTriggerStatic();
                os.ytchtvRenderChannels();

                const degrees = idx * (360 / os.ytchtv.channels.length);
                const dialHand = document.getElementById('ytchtv-dial-hand');
                if (dialHand) {
                    dialHand.style.transform = `rotate(${degrees}deg)`;
                }

                const activeChLbl = document.getElementById('ytch-active-ch-lbl');
                if (activeChLbl) activeChLbl.innerText = `CH ${(idx+1).toString().padStart(2, '0')}`;

                if (os.ytchtv.currentSource === 'embed') {
                    os.ytchtvTuneCustomChannel();
                } else {
                    os.logTerminal(`Retro TV: Tuning Dial set to CH ${(idx+1).toString().padStart(2, '0')} (${os.ytchtv.channels[idx].name}). Switch to RETRO INTERFACE to control video feeds!`);
                }
            },

    ytchtvTuneCustomChannel: () => {
                const ch = os.ytchtv.channels[os.ytchtv.currentChannelIndex];
                const videoId = ch.presetVideos[os.ytchtv.currentVideoIndex % ch.presetVideos.length];
                
                const customPlayer = document.getElementById('ytchtv-custom-youtube-player');
                const chanNum = document.getElementById('ytchtv-custom-chan-num');
                const chanName = document.getElementById('ytchtv-custom-chan-name');
                const videoIdEl = document.getElementById('ytchtv-custom-video-id');

                if (chanNum) chanNum.innerText = `CH ${(os.ytchtv.currentChannelIndex+1).toString().padStart(2, '0')}`;
                if (chanName) chanName.innerText = ch.name;
                if (videoIdEl) videoIdEl.innerText = videoId;

                if (customPlayer) {
                    customPlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&mute=0&loop=1&playlist=${videoId}&iv_load_policy=3&rel=0&showinfo=0`;
                }

                os.logTerminal(`Retro TV: Tune-in preset video [${videoId}] on CH ${(os.ytchtv.currentChannelIndex+1).toString().padStart(2, '0')}`);
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
                    navigator.clipboard.writeText(videoIdEl.innerText);
                    os.logTerminal(`Retro TV: Copied video ID [${videoIdEl.innerText}] to clipboard.`);
                }
            },

    _mediaCard: (a, type='anime') => {
                const img = a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || '';
                const meta = [a.type, a.year || a.published?.prop?.from?.year, a.episodes ? a.episodes+' eps' : a.chapters ? a.chapters+' ch' : '', a.status].filter(Boolean).join(' · ');
                const genres = (a.genres||[]).slice(0,3).map(g=>`<span class="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-gray-400">${os._html(g.name)}</span>`).join('');
                return `<button onclick="${type==='anime' ? `os.animeOpen(${a.mal_id})` : `os.mangaOpen(${a.mal_id})`}" class="w-full text-left rounded-xl border border-white/10 bg-white/[0.035] hover:bg-white/[0.07] hover:border-white/20 transition overflow-hidden cursor-none hover-target group"><div class="flex gap-3 p-2"><div class="w-16 h-24 rounded-lg overflow-hidden bg-black/60 flex-shrink-0">${img?`<img src="${img}" class="w-full h-full object-cover group-hover:scale-105 transition" loading="lazy">`:''}</div><div class="min-w-0 flex-1"><div class="text-white font-bold line-clamp-2">${os._html(a.title)}</div><div class="text-[9px] text-os-accent mt-1">⭐ ${a.score || '--'} · ${os._html(meta)}</div><div class="flex flex-wrap gap-1 mt-2">${genres}</div><div class="text-[10px] text-gray-500 line-clamp-3 mt-2">${os._html(a.synopsis || 'No synopsis available.')}</div></div></div></button>`;
            },

    animeTrending: async () => { const el=document.getElementById('anime-results'); if(!el)return; el.innerHTML='<div class="text-center text-gray-500 mt-16 animate-pulse">Loading trending anime...</div>'; try{ const j=await os._fetchJson('https://api.jikan.moe/v4/top/anime?filter=airing&limit=18'); el.innerHTML=(j.data||[]).map(a=>os._mediaCard(a,'anime')).join(''); if(j.data?.[0]) os.animeOpen(j.data[0].mal_id); }catch(e){ el.innerHTML=`<div class="text-red-300 text-center mt-16">Jikan failed: ${os._html(e.message)}</div>`; } },

    animeSeasonal: async () => { const el=document.getElementById('anime-results'); if(!el)return; el.innerHTML='<div class="text-center text-gray-500 mt-16 animate-pulse">Loading seasonal anime...</div>'; try{ const j=await os._fetchJson('https://api.jikan.moe/v4/seasons/now?sfw=true&limit=18'); el.innerHTML=(j.data||[]).map(a=>os._mediaCard(a,'anime')).join(''); if(j.data?.[0]) os.animeOpen(j.data[0].mal_id); }catch(e){ el.innerHTML=`<div class="text-red-300 text-center mt-16">Seasonal failed: ${os._html(e.message)}</div>`; } },

    animeRecommendations: async () => { const el=document.getElementById('anime-results'); if(!el)return; el.innerHTML='<div class="text-center text-gray-500 mt-16 animate-pulse">Loading recommendations...</div>'; try{ const j=await os._fetchJson('https://api.jikan.moe/v4/recommendations/anime'); const items=(j.data||[]).flatMap(r=>r.entry||[]).slice(0,18).map(e=>({mal_id:e.mal_id,title:e.title,images:e.images,synopsis:'Community recommendation'})); el.innerHTML=items.map(a=>os._mediaCard(a,'anime')).join(''); }catch(e){ el.innerHTML=`<div class="text-red-300 text-center mt-16">Recommendations failed: ${os._html(e.message)}</div>`; } },

    animeSearch: async () => { const q=document.getElementById('anime-search')?.value.trim(); const el=document.getElementById('anime-results'); if(!q||!el)return; el.innerHTML='<div class="text-center text-gray-500 mt-16 animate-pulse">Searching Jikan...</div>'; try{ const j=await os._fetchJson('https://api.jikan.moe/v4/anime?q='+encodeURIComponent(q)+'&sfw=true&limit=20'); el.innerHTML=(j.data||[]).map(a=>os._mediaCard(a,'anime')).join('') || '<div class="text-gray-500">No anime found.</div>'; if(j.data?.[0]) os.animeOpen(j.data[0].mal_id); }catch(e){ el.innerHTML=`<div class="text-red-300 text-center mt-16">Jikan failed: ${os._html(e.message)}</div>`; } },

    animeOpen: async (id) => { const el=document.getElementById('anime-detail'); if(!el)return; el.innerHTML='<div class="text-center text-gray-500 mt-20 animate-pulse">Loading anime dossier...</div>'; try{ const [full, eps, streaming] = await Promise.allSettled([os._fetchJson(`https://api.jikan.moe/v4/anime/${id}/full`), os._fetchJson(`https://api.jikan.moe/v4/anime/${id}/episodes?page=1`), os._fetchJson(`https://api.jikan.moe/v4/anime/${id}/streaming`)]); const a=full.value?.data; if(!a) throw new Error('No anime details returned'); const img=a.images?.jpg?.large_image_url||a.images?.jpg?.image_url||''; const trailer=a.trailer?.embed_url || (a.trailer?.youtube_id ? `https://www.youtube-nocookie.com/embed/${a.trailer.youtube_id}` : ''); const streams=streaming.value?.data||[]; const epList=eps.value?.data||[]; el.innerHTML=`<div class="relative min-h-full"><div class="absolute inset-x-0 top-0 h-56 bg-cover bg-center opacity-20 blur-xl" style="background-image:url('${img}')"></div><div class="relative p-5"><div class="flex gap-5"><img src="${img}" class="w-44 h-64 object-cover rounded-2xl border border-white/10 bg-black shadow-os-panel"><div class="min-w-0 flex-1"><div class="text-os-accent text-[9px] uppercase tracking-widest">${os._html(a.type||'Anime')} · ${os._html(a.status||'')}</div><div class="text-white font-display text-3xl uppercase leading-tight mt-1">${os._html(a.title)}</div><div class="text-gray-400 mt-1">${os._html(a.title_japanese||'')}</div><div class="grid grid-cols-4 gap-2 mt-4 text-center"><div class="p-2 bg-white/[0.04] border border-white/10 rounded"><b class="text-white">${a.score||'--'}</b><br><span class="text-gray-500">Score</span></div><div class="p-2 bg-white/[0.04] border border-white/10 rounded"><b class="text-white">${a.episodes||'--'}</b><br><span class="text-gray-500">Episodes</span></div><div class="p-2 bg-white/[0.04] border border-white/10 rounded"><b class="text-white">#${a.rank||'--'}</b><br><span class="text-gray-500">Rank</span></div><div class="p-2 bg-white/[0.04] border border-white/10 rounded"><b class="text-white">${a.year||'--'}</b><br><span class="text-gray-500">Year</span></div></div><div class="flex flex-wrap gap-1 mt-3">${(a.genres||[]).map(g=>`<span class="px-2 py-1 bg-white/5 border border-white/10 rounded-full text-gray-300">${os._html(g.name)}</span>`).join('')}</div><div class="flex gap-2 mt-4">${trailer?`<button onclick="os.animePlayTrailer('${trailer.replace(/'/g,'&#39;')}')" class="px-3 py-2 bg-white text-black rounded-lg font-bold cursor-none hover-target">Play Trailer</button>`:''}<a href="${a.url}" target="_blank" class="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white">MAL Page</a></div></div></div><div id="anime-player" class="mt-5 ${trailer?'':'hidden'} rounded-2xl overflow-hidden border border-white/10 bg-black"></div><div class="grid grid-cols-2 gap-4 mt-5"><div class="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div class="text-os-accent uppercase tracking-widest text-[9px] mb-2">Synopsis</div><div class="text-gray-300 leading-relaxed select-text">${os._html(a.synopsis||'No synopsis.')}</div></div><div class="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div class="text-os-accent uppercase tracking-widest text-[9px] mb-2">Where to Watch / Episodes</div><div class="flex flex-wrap gap-2 mb-3">${streams.length?streams.map(s=>`<a target="_blank" href="${s.url}" class="px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-200">${os._html(s.name)}</a>`).join(''):'<span class="text-gray-500">No official streaming links in Jikan.</span>'}</div><div class="space-y-1 max-h-44 overflow-y-auto">${epList.slice(0,20).map(ep=>`<div class="p-2 rounded bg-black/30 border border-white/5"><span class="text-white">EP ${ep.mal_id}</span> <span class="text-gray-400">${os._html(ep.title||'Untitled')}</span><div class="text-gray-600 text-[9px]">${ep.aired?new Date(ep.aired).toLocaleDateString():''} · Score ${ep.score||'--'}</div></div>`).join('')}</div></div></div></div></div>`; if(trailer) os.animePlayTrailer(trailer); }catch(e){ el.innerHTML=`<div class="text-red-300 text-center mt-20">Anime details failed: ${os._html(e.message)}</div>`; } },

    animePlayTrailer: (url) => { const p=document.getElementById('anime-player'); if(p){ p.classList.remove('hidden'); p.innerHTML=`<iframe src="${url}${url.includes('?')?'&':'?'}autoplay=1&rel=0" class="w-full h-72 border-0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`; p.scrollIntoView({behavior:'smooth',block:'nearest'}); } },

    initManga: () => { os.mangaRenderList(); },

    mangaTrending: async () => { const el=document.getElementById('manga-results'); if(!el)return; el.innerHTML='<div class="text-center text-gray-500 mt-16 animate-pulse">Loading top manga...</div>'; try{ const j=await os._fetchJson('https://api.jikan.moe/v4/top/manga?limit=20'); el.innerHTML=(j.data||[]).map(a=>os._mediaCard(a,'manga')).join(''); if(j.data?.[0]) os.mangaOpen(j.data[0].mal_id); }catch(e){ el.innerHTML=`<div class="text-red-300 text-center mt-16">Jikan failed: ${os._html(e.message)}</div>`; } },

    mangaSearch: async () => { const q=document.getElementById('manga-search')?.value.trim(); const el=document.getElementById('manga-results'); if(!q||!el)return; el.innerHTML='<div class="text-center text-gray-500 mt-16 animate-pulse">Searching manga...</div>'; try{ const j=await os._fetchJson('https://api.jikan.moe/v4/manga?q='+encodeURIComponent(q)+'&sfw=true&limit=20'); el.innerHTML=(j.data||[]).map(a=>os._mediaCard(a,'manga')).join('') || '<div class="text-gray-500">No manga found.</div>'; if(j.data?.[0]) os.mangaOpen(j.data[0].mal_id); }catch(e){ el.innerHTML=`<div class="text-red-300 text-center mt-16">Jikan failed: ${os._html(e.message)}</div>`; } },

    mangaOpen: async (id) => { const el=document.getElementById('manga-detail'); if(!el)return; el.innerHTML='<div class="text-center text-gray-500 mt-20 animate-pulse">Loading manga dossier...</div>'; try{ const j=await os._fetchJson(`https://api.jikan.moe/v4/manga/${id}/full`); const m=j.data; const img=m.images?.jpg?.large_image_url||m.images?.jpg?.image_url||''; os._currentMangaObj={title:m.title,url:m.url,img,score:m.score||'',mal_id:m.mal_id}; el.innerHTML=`<div class="relative min-h-full"><div class="absolute inset-x-0 top-0 h-56 bg-cover bg-center opacity-20 blur-xl" style="background-image:url('${os._html(img)}')"></div><div class="relative p-5"><div class="flex gap-5"><img src="${os._html(img)}" class="w-44 h-64 object-cover rounded-2xl border border-white/10 bg-black"><div class="flex-1 min-w-0"><div class="text-os-accent text-[9px] uppercase tracking-widest">${os._html(m.type||'Manga')} · ${os._html(m.status||'')}</div><div class="text-white font-display text-3xl uppercase leading-tight mt-1">${os._html(m.title)}</div><div class="text-gray-400 mt-1">${os._html(m.title_japanese||'')}</div><div class="grid grid-cols-4 gap-2 mt-4 text-center"><div class="p-2 bg-white/[0.04] border border-white/10 rounded"><b class="text-white">${m.score||'--'}</b><br><span class="text-gray-500">Score</span></div><div class="p-2 bg-white/[0.04] border border-white/10 rounded"><b class="text-white">${m.chapters||'--'}</b><br><span class="text-gray-500">Chapters</span></div><div class="p-2 bg-white/[0.04] border border-white/10 rounded"><b class="text-white">${m.volumes||'--'}</b><br><span class="text-gray-500">Volumes</span></div><div class="p-2 bg-white/[0.04] border border-white/10 rounded"><b class="text-white">#${m.rank||'--'}</b><br><span class="text-gray-500">Rank</span></div></div><div class="flex flex-wrap gap-1 mt-3">${(m.genres||[]).map(g=>`<span class="px-2 py-1 bg-white/5 border border-white/10 rounded-full text-gray-300">${os._html(g.name)}</span>`).join('')}</div><div class="flex gap-2 mt-4"><button onclick="os.mangaAdd(os._currentMangaObj)" class="px-3 py-2 bg-emerald-500/15 border border-emerald-500/25 text-emerald-200 rounded-lg cursor-none hover-target">Add List</button><button onclick="os.mangaDexResolve(os._currentMangaObj.title)" class="px-3 py-2 bg-white text-black rounded-lg font-bold cursor-none hover-target">Find Readable Chapters</button><a href="${os._html(m.url)}" target="_blank" class="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white">MAL</a></div></div></div><div class="grid grid-cols-2 gap-4 mt-5"><div class="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div class="text-os-accent uppercase tracking-widest text-[9px] mb-2">Synopsis / Background</div><div class="text-gray-300 leading-relaxed select-text">${os._html(m.synopsis||'No synopsis.')}<br><br>${os._html(m.background||'')}</div></div><div class="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div class="text-os-accent uppercase tracking-widest text-[9px] mb-2">Reader</div><div id="mangadex-panel" class="text-gray-500">Click “Find Readable Chapters” to resolve MangaDex chapters. Only legally hosted MangaDex pages are loaded.</div></div></div><div id="manga-reader" class="mt-5"></div></div></div>`; }catch(e){ el.innerHTML=`<div class="text-red-300 text-center mt-20">Manga details failed: ${os._html(e.message)}</div>`; } },

    mangaDexResolveByIndex: (i) => { const list=JSON.parse(localStorage.getItem('AetherOS_Manga_List')||'[]'); if(list[i]?.title) os.mangaDexResolve(list[i].title); },

    mangaDexResolve: async (title) => { const panel=document.getElementById('mangadex-panel'); if(!panel)return; panel.innerHTML='<div class="animate-pulse text-gray-500">Searching MangaDex...</div>'; try{ const md=await os._fetchJson('https://api.mangadex.org/manga?limit=8&availableTranslatedLanguage[]=en&includes[]=cover_art&title='+encodeURIComponent(title)); const manga=(md.data||[])[0]; if(!manga) throw new Error('No MangaDex match'); const feed=await os._fetchJson(`https://api.mangadex.org/manga/${manga.id}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=50`); const chapters=(feed.data||[]).filter(c=>c.type==='chapter'); panel.innerHTML=`<div class="text-white font-bold mb-2">${os._html(manga.attributes?.title?.en || title)}</div><div class="space-y-1 max-h-64 overflow-y-auto">${chapters.map(ch=>`<button onclick="os.mangaReadChapter('${ch.id}')" class="w-full text-left p-2 rounded bg-black/35 border border-white/5 hover:bg-white/10 cursor-none hover-target"><span class="text-emerald-200">Ch. ${os._html(ch.attributes?.chapter||'?')}</span> <span class="text-gray-400">${os._html(ch.attributes?.title||'')}</span></button>`).join('') || '<div class="text-gray-500">No English chapters available.</div>'}</div>`; }catch(e){ panel.innerHTML=`<div class="text-red-300">MangaDex failed: ${os._html(e.message)}</div>`; } },

    mangaReadChapter: async (chapterId) => { const r=document.getElementById('manga-reader'); if(!r)return; r.innerHTML='<div class="text-center text-gray-500 animate-pulse py-10">Loading chapter pages...</div>'; try{ const at=await os._fetchJson(`https://api.mangadex.org/at-home/server/${chapterId}`); const pages=at.chapter?.data || []; const base=at.baseUrl, hash=at.chapter.hash; r.innerHTML=`<div class="rounded-2xl border border-white/10 bg-black/55 p-3"><div class="sticky top-0 z-10 bg-black/80 border border-white/10 rounded-xl p-2 mb-3 flex justify-between"><span class="text-os-accent uppercase tracking-widest text-[9px]">MangaDex Reader · ${pages.length} pages</span><button onclick="document.getElementById('manga-reader').innerHTML=''" class="text-red-300 cursor-none hover-target">Close</button></div><div class="space-y-3">${pages.map(pg=>`<img src="${base}/data/${hash}/${pg}" class="mx-auto max-w-full rounded border border-white/10 bg-black" loading="lazy">`).join('')}</div></div>`; r.scrollIntoView({behavior:'smooth'}); }catch(e){ r.innerHTML=`<div class="text-red-300 text-center py-10">Reader failed: ${os._html(e.message)}</div>`; } },

    mangaAdd: (m) => { const list=JSON.parse(localStorage.getItem('AetherOS_Manga_List')||'[]'); if(!list.some(x=>x.url===m.url)) list.unshift({...m, progress:m.progress||'Plan to read', added:Date.now()}); localStorage.setItem('AetherOS_Manga_List', JSON.stringify(list.slice(0,80))); os.mangaRenderList(); Notifications.push('MANGA', 'Added to reading list'); },

    mangaRenderList: () => { const el=document.getElementById('manga-results'); if(!el)return; const list=JSON.parse(localStorage.getItem('AetherOS_Manga_List')||'[]'); el.innerHTML=list.length?list.map((m,i)=>`<div class="flex gap-3 p-3 rounded-xl bg-white/[0.035] border border-white/10"><img src="${os._html(m.img)}" class="w-14 h-20 object-cover rounded bg-black"><div class="min-w-0 flex-1"><button onclick="${m.mal_id?`os.mangaOpen(${Number(m.mal_id)})`:`window.open('${os._html(m.url)}','_blank')`}" class="text-white font-bold hover:underline text-left line-clamp-2 cursor-none hover-target">${os._html(m.title)}</button><div class="text-gray-500 mt-1">Score ${os._html(m.score||'--')} · ${os._html(m.progress||'Plan to read')}</div><div class="flex gap-2 mt-2"><button onclick="os.mangaRemove(${i})" class="text-red-400 text-[9px] cursor-none hover-target">Remove</button><button onclick="os.mangaDexResolveByIndex(${i})" class="text-emerald-300 text-[9px] cursor-none hover-target">Chapters</button></div></div></div>`).join(''):'<div class="text-gray-600 text-center mt-10">No saved manga yet.</div>'; },

    mangaRemove: (i) => { const list=JSON.parse(localStorage.getItem('AetherOS_Manga_List')||'[]'); list.splice(i,1); localStorage.setItem('AetherOS_Manga_List', JSON.stringify(list)); os.mangaRenderList(); },

    mangaClearList: () => { if(confirm('Clear manga reading list?')){ localStorage.removeItem('AetherOS_Manga_List'); os.mangaRenderList(); } },

    memeSource: 'memes',

    memeTimer: null,

    renderMemeButtons: () => {
                const container = document.getElementById('memes-source-buttons');
                if (!container) return;

                const defaultSubs = ['memes', 'dankmemes', 'shitposting'];
                const customStr = SystemState.settings.api_custom_subreddits || '';
                const customSubs = customStr.split(',').map(s => s.trim()).filter(s => s);
                const allSubs = [...new Set([...defaultSubs, ...customSubs])];

                if (!allSubs.includes(os.memeSource)) {
                    os.memeSource = allSubs[0] || 'memes';
                }

                container.innerHTML = allSubs.map(s => `
                    <button onclick="os.setMemeSource('${s}')" id="btn-meme-${s}" class="px-2.5 py-1 rounded cursor-none hover-target transition-colors shrink-0 border border-transparent hover:border-white/10 ${os.memeSource === s ? 'bg-white/10 text-white shadow-os-btn border-white/10' : 'bg-transparent text-gray-500 hover:text-white'}">r/${s.length > 14 ? s.substring(0,12)+'..' : s}</button>
                `).join('');
            },

    setMemeSource: (src) => {
                os.memeSource = src;
                os.renderMemeButtons();
                const container = document.getElementById('memes-container');
                if (container) container.innerHTML = `<div class="col-span-2 text-center text-yellow-500 py-10 animate-pulse tracking-widest uppercase text-[10px]">DECRYPTING MEMETIC PAYLOADS...</div>`;
                os.fetchMemes();
            },

    initMemes: () => {
                os.renderMemeButtons();
                os.fetchMemes();
                if(!os.memeTimer) {
                    os.memeTimer = setInterval(os.fetchMemes, 60000); 
                }
            },

    killMemes: () => {
                if(os.memeTimer) {
                    clearInterval(os.memeTimer);
                    os.memeTimer = null;
                }
            },

    fetchMemes: async () => {
                const container = document.getElementById('memes-container');
                if(!container) return;
                
                const refreshBtn = document.getElementById('btn-meme-refresh');
                let refreshIcon = null;
                if (refreshBtn) {
                    refreshIcon = refreshBtn.querySelector('i');
                    if (refreshIcon) refreshIcon.classList.add('animate-spin');
                }

                const rawTargetUrl = `https://www.reddit.com/r/${os.memeSource}/hot.json?limit=40`;
                const proxyChain = [
                    rawTargetUrl,
                    `https://corsproxy.io/?url=${encodeURIComponent(rawTargetUrl)}`,
                    `https://api.allorigins.win/raw?url=${encodeURIComponent(rawTargetUrl)}`,
                    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rawTargetUrl)}`
                ];

                let data = null;
                let lastErr = '';

                for (const proxyUrl of proxyChain) {
                    try {
                        const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
                        if (!res.ok) { lastErr = `HTTP ${res.status}`; continue; }
                        const json = await res.json();
                        if (json && json.data && json.data.children) { data = json; break; }
                        lastErr = 'Invalid schema';
                    } catch (e) { lastErr = e.message; }
                }

                try {
                    if (!data) throw new Error(lastErr || 'All proxies exhausted');

                    const posts = data.data.children
                        .map(c => c.data)
                        .filter(p => !p.is_video && p.url && p.url.match(/\.(jpg|jpeg|png|gif)$/i));
                    
                    let html = '';
                    posts.forEach(post => {
                        const safeTitle = post.title.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                        html += `
                            <div class="break-inside-avoid relative group border border-white/5 rounded-lg overflow-hidden bg-[#0c0c0e] hover-target cursor-none shadow-os-recessed mb-4" onclick="os.openLinkInProxy('https://reddit.com${post.permalink}')">
                                <img src="${post.url}" class="w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" loading="lazy" onerror="this.parentElement.style.display='none'">
                                <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                    <div class="text-white text-[10px] font-bold line-clamp-3 leading-tight mb-1">${safeTitle}</div>
                                    <div class="text-os-accent text-[8px] flex justify-between uppercase tracking-wider font-semibold mt-1">
                                        <span class="text-green-500 flex items-center gap-1"><i data-lucide="arrow-up" class="w-2.5 h-2.5"></i> ${post.score}</span>
                                        <span>u/${post.author}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    
                    if(html) {
                        container.innerHTML = html;
                        lucide.createIcons({root: container});
                    } else {
                        container.innerHTML = `<div class="text-center text-red-500 py-10 w-full col-span-2 tracking-widest uppercase text-[10px]">NO VISUAL MEDIA EXTRACTED</div>`;
                    }
                    os.logTerminal(`Memetic Node: Synced payload from r/${os.memeSource}`);
                } catch (e) {
                    container.innerHTML = `<div class="text-center text-red-500 py-10 w-full col-span-2 tracking-widest uppercase text-[10px]">UPLINK FAILED // CORS BLOCK<br><span class="text-[9px] text-gray-500 mt-1 block">${e.message}</span></div>`;
                    os.logTerminal(`Memetic Node Error: ${e.message}`);
                } finally {
                    if (refreshIcon) refreshIcon.classList.remove('animate-spin');
                }
            }
});
