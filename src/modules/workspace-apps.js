// AetherOS — Character Dex (PokéAPI + Dragon Ball + Jikan Anime), Files (IndexedDB VFS + Wikipedia), About AetherOS & WikiBoard
window.extendOS({
    entityscanner: {
        currentTab: 'stats',
        scalingMode: 'balanced',
        scannedEntities: {},
        currentEntity: null,
        isShiny: false,
        cryAudio: null,
        favorites: null,
        recent: [],
        activeLeft: null,
        activeRight: null,
        combatTimer: null,
        interceptsTimer: null
    },

    _scannerLoadFavs: () => {
        if (!os.entityscanner.favorites) {
            try { os.entityscanner.favorites = JSON.parse(localStorage.getItem('aether_dex_favs_v1') || '[]'); }
            catch (_) { os.entityscanner.favorites = []; }
        }
        return os.entityscanner.favorites;
    },

    initEntityScanner: () => {
        os._scannerLoadFavs();
        os.switchScannerTab('stats');
        os.populateCombatSelectors();

        const leftSel = document.getElementById('combat-fighter-left');
        const rightSel = document.getElementById('combat-fighter-right');
        if (leftSel) leftSel.value = 'charizard';
        if (rightSel) rightSel.value = 'mewtwo';
        os.updateCombatFighter('left');
        os.updateCombatFighter('right');

        os.setScannerPreset('charizard');
    },

    killEntityScanner: () => {
        if (os.entityscanner.combatTimer) {
            clearInterval(os.entityscanner.combatTimer);
            os.entityscanner.combatTimer = null;
        }
        if (os.entityscanner.cryAudio) {
            try { os.entityscanner.cryAudio.pause(); } catch (_) {}
            os.entityscanner.cryAudio = null;
        }
    },

    switchScannerTab: (tabId) => {
        os.entityscanner.currentTab = tabId;
        const tabs = ['stats', 'evolution', 'combat', 'intercepts'];
        tabs.forEach((t) => {
            const view = document.getElementById(`scanner-tab-view-${t}`);
            const btn = document.getElementById(`scan-tab-${t}`);
            if (view) view.classList.toggle('hidden', t !== tabId);
            if (btn) btn.classList.toggle('active', t === tabId);
        });
        if (tabId === 'intercepts') os.scannerRenderFavoritesAndRecent();
    },

    scannerRandomEntity: () => {
        const pool = [
            'charizard', 'mewtwo', 'pikachu', 'gengar', 'lucario', 'rayquaza', 'gardevoir',
            'umbreon', 'dragonite', 'snorlax', 'greninja', 'blaziken', 'goku', 'vegeta',
            'frieza', 'piccolo', 'gohan', 'luffy', 'zoro', 'naruto', 'gojo'
        ];
        const pick = pool[Math.floor(Math.random() * pool.length)];
        os.setScannerPreset(pick);
    },

    scannerToggleShiny: () => {
        const ent = os.entityscanner.currentEntity;
        if (!ent || !ent.shinyImage) return;
        os.entityscanner.isShiny = !os.entityscanner.isShiny;
        const imgEl = document.getElementById('scanner-entity-img');
        const btn = document.getElementById('scanner-shiny-btn');
        if (imgEl) imgEl.src = os.entityscanner.isShiny ? ent.shinyImage : ent.image;
        if (btn) btn.textContent = os.entityscanner.isShiny ? '✦ Default' : '✦ Shiny';
    },

    scannerPlayCry: () => {
        const ent = os.entityscanner.currentEntity;
        if (!ent || !ent.cryUrl) return;
        try {
            if (os.entityscanner.cryAudio) os.entityscanner.cryAudio.pause();
            const a = new Audio(ent.cryUrl);
            a.volume = 0.55;
            os.entityscanner.cryAudio = a;
            a.play().catch(() => {});
        } catch (_) {}
    },

    scannerToggleFavorite: () => {
        const ent = os.entityscanner.currentEntity;
        if (!ent) return;
        const favs = os._scannerLoadFavs();
        const key = `${ent.type}:${ent.queryKey || ent.name.toLowerCase()}`;
        const idx = favs.findIndex((f) => f.key === key);
        if (idx >= 0) favs.splice(idx, 1);
        else favs.unshift({ key, name: ent.name, query: ent.queryKey || ent.name.toLowerCase(), image: ent.image, universe: ent.universe || ent.type });
        try { localStorage.setItem('aether_dex_favs_v1', JSON.stringify(favs.slice(0, 40))); } catch (_) {}
        os._scannerSyncFavBtn();
        if (os.entityscanner.currentTab === 'intercepts') os.scannerRenderFavoritesAndRecent();
    },

    _scannerSyncFavBtn: () => {
        const btn = document.getElementById('scanner-fav-btn');
        const ent = os.entityscanner.currentEntity;
        if (!btn || !ent) return;
        const favs = os._scannerLoadFavs();
        const key = `${ent.type}:${ent.queryKey || ent.name.toLowerCase()}`;
        const isFav = favs.some((f) => f.key === key);
        btn.textContent = isFav ? '★ Favorited' : '☆ Favorite';
        btn.classList.toggle('text-amber-300', isFav);
    },

    scannerRenderFavoritesAndRecent: () => {
        const stream = document.getElementById('scanner-intercepts-stream');
        if (!stream) return;
        const favs = os._scannerLoadFavs();
        const rec = os.entityscanner.recent || [];
        const esc = (s) => os.fmEscape(String(s ?? ''));

        const renderRow = (item, badge) => `
            <button type="button" onclick="os.setScannerPreset('${esc(item.query).replace(/'/g, "\\'")}')"
                class="w-full os-card p-2.5 flex items-center gap-3 text-left hover:bg-white/[0.06] transition cursor-none hover-target">
                <img src="${esc(item.image)}" class="w-10 h-10 rounded-lg object-contain bg-black/40 p-1 shrink-0" onerror="this.style.display='none'">
                <div class="flex-1 min-w-0">
                    <div class="text-xs font-semibold text-white truncate">${esc(item.name)}</div>
                    <div class="text-[10.5px] text-gray-400 capitalize">${esc(item.universe || '')}</div>
                </div>
                <span class="os-badge text-[10px]">${badge}</span>
            </button>`;

        stream.innerHTML = [
            favs.length ? `<div class="text-[11px] font-semibold text-amber-300 pb-1">Favorites (${favs.length})</div>` + favs.map((f) => renderRow(f, '★ Saved')).join('') : '',
            rec.length ? `<div class="text-[11px] font-semibold text-gray-400 pt-2 pb-1">Recent Lookups</div>` + rec.map((r) => renderRow(r, 'Recent')).join('') : '',
            (!favs.length && !rec.length) ? `<div class="py-8 text-center text-gray-500 text-xs">Star any Pokémon or anime character to pin them here.</div>` : ''
        ].join('');
    },

    runEntityScan: async () => {
        const input = document.getElementById('scanner-search-input');
        if (!input) return;
        const query = input.value.trim().toLowerCase();
        if (!query) return;

        const lockLbl = document.getElementById('scanner-lock-lbl');
        if (lockLbl) lockLbl.innerText = 'Searching...';

        if (os.entityscanner.scannedEntities[query]) {
            os.renderEntityStats(os.entityscanner.scannedEntities[query]);
            return;
        }

        try {
            // 1. PokéAPI v2 (fast exact match for 1,025+ Pokémon!)
            const resPoke = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(8000) }).catch(() => null);
            if (resPoke && resPoke.ok) {
                const pokeData = await resPoke.json();
                let descText = '';
                let genus = 'Pokémon';
                let evolutionChainUrl = '';
                try {
                    const specRes = await fetch(pokeData.species.url);
                    if (specRes.ok) {
                        const specData = await specRes.json();
                        evolutionChainUrl = specData.evolution_chain?.url || '';
                        const entry = (specData.flavor_text_entries || []).find((e) => e.language.name === 'en');
                        if (entry) descText = entry.flavor_text.replace(/[\f\n\r]+/g, ' ');
                        const gen = (specData.genera || []).find((g) => g.language.name === 'en');
                        if (gen) genus = gen.genus;
                    }
                } catch (_) {}

                const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
                const entity = {
                    type: 'pokemon',
                    universe: 'Pokémon',
                    queryKey: query,
                    id: pokeData.id,
                    name: cap(pokeData.name),
                    genus,
                    image: pokeData.sprites?.other?.['official-artwork']?.front_default || pokeData.sprites?.front_default || '',
                    shinyImage: pokeData.sprites?.other?.['official-artwork']?.front_shiny || pokeData.sprites?.front_shiny || '',
                    cryUrl: pokeData.cries?.latest || pokeData.cries?.legacy || '',
                    height: pokeData.height,
                    weight: pokeData.weight,
                    abilities: (pokeData.abilities || []).map((a) => cap(a.ability.name.replace(/-/g, ' '))),
                    types: (pokeData.types || []).map((t) => cap(t.type.name)),
                    stats: (pokeData.stats || []).map((s) => ({
                        name: ({ hp: 'HP', attack: 'Attack', defense: 'Defense', 'special-attack': 'Sp. Atk', 'special-defense': 'Sp. Def', speed: 'Speed' }[s.stat.name] || s.stat.name),
                        val: s.base_stat
                    })),
                    description: descText,
                    evolutionChainUrl
                };
                os.entityscanner.scannedEntities[query] = entity;
                os.renderEntityStats(entity);
                return;
            }

            // 2. Dragon Ball API
            const resDb = await fetch(`https://dragonball-api.com/api/characters?name=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(8000) }).catch(() => null);
            if (resDb && resDb.ok) {
                const arr = await resDb.json();
                const items = Array.isArray(arr) ? arr : (arr?.items || []);
                if (items.length > 0) {
                    const fullRes = await fetch(`https://dragonball-api.com/api/characters/${items[0].id}`);
                    const fullData = await fullRes.json();
                    const entity = {
                        type: 'db',
                        universe: 'Dragon Ball',
                        queryKey: query,
                        id: fullData.id,
                        name: fullData.name,
                        image: fullData.image,
                        race: fullData.race || 'Warrior',
                        gender: fullData.gender || '--',
                        baseKi: fullData.ki || '--',
                        maxKi: fullData.maxKi || '--',
                        affiliation: fullData.affiliation || 'Independent',
                        description: fullData.description || '',
                        planet: fullData.originPlanet?.name || 'Unknown World',
                        transformations: fullData.transformations || []
                    };
                    os.entityscanner.scannedEntities[query] = entity;
                    os.renderEntityStats(entity);
                    return;
                }
            }

            // 3. Jikan v4 Anime Character fallback (Luffy, Gojo, Naruto, Frieren, etc.)
            const resAnime = await fetch(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(query)}&order_by=favorites&sort=desc&limit=1`, { signal: AbortSignal.timeout(8000) }).catch(() => null);
            if (resAnime && resAnime.ok) {
                const aj = await resAnime.json();
                const ch = aj?.data?.[0];
                if (ch) {
                    const entity = {
                        type: 'anime',
                        universe: 'Anime (MAL)',
                        queryKey: query,
                        id: ch.mal_id,
                        name: ch.name,
                        kanji: ch.name_kanji || '',
                        image: ch.images?.webp?.image_url || ch.images?.jpg?.image_url || '',
                        favoritesCount: ch.favorites || 0,
                        nicknames: (ch.nicknames || []).slice(0, 3),
                        description: String(ch.about || 'Popular anime character indexed via MyAnimeList / Jikan v4.').slice(0, 650),
                        url: ch.url
                    };
                    os.entityscanner.scannedEntities[query] = entity;
                    os.renderEntityStats(entity);
                    return;
                }
            }

            if (lockLbl) lockLbl.innerText = 'Not found';
            window.Notifications && Notifications.push('Character Dex', `No character found for "${query}"`);
        } catch (e) {
            if (lockLbl) lockLbl.innerText = 'Offline';
        }
    },

    setScannerPreset: (presetKey) => {
        const input = document.getElementById('scanner-search-input');
        if (input) {
            input.value = presetKey;
            os.runEntityScan();
        }
    },

    renderEntityStats: (entity) => {
        os.entityscanner.currentEntity = entity;
        os.entityscanner.isShiny = false;

        // Track in recent list
        os.entityscanner.recent = [
            { name: entity.name, query: entity.queryKey || entity.name.toLowerCase(), image: entity.image, universe: entity.universe },
            ...(os.entityscanner.recent || []).filter((r) => r.name !== entity.name)
        ].slice(0, 10);

        const nameEl = document.getElementById('scanner-name');
        const metaEl = document.getElementById('scanner-meta-affiliation');
        const imgEl = document.getElementById('scanner-entity-img');
        const lockLbl = document.getElementById('scanner-lock-lbl');
        const ratingLbl = document.getElementById('scanner-rating-lbl');
        const spectralLbl = document.getElementById('scanner-spectral-lbl');
        const sigPct = document.getElementById('scanner-sig-pct');
        const dangerClass = document.getElementById('scanner-danger-class');
        const statsMatrix = document.getElementById('scanner-stat-matrix');
        const assessment = document.getElementById('scanner-assessment');
        const shinyBtn = document.getElementById('scanner-shiny-btn');
        const cryBtn = document.getElementById('scanner-cry-btn');

        if (nameEl) nameEl.innerText = entity.name;
        if (imgEl && entity.image) imgEl.src = entity.image;
        if (lockLbl) lockLbl.innerText = entity.universe || 'Indexed';
        if (shinyBtn) { shinyBtn.classList.toggle('hidden', !entity.shinyImage); shinyBtn.textContent = '✦ Shiny'; }
        if (cryBtn) cryBtn.classList.toggle('hidden', !entity.cryUrl);
        os._scannerSyncFavBtn();

        const esc = (s) => os.fmEscape(String(s ?? ''));

        if (entity.type === 'pokemon') {
            const bst = entity.stats.reduce((acc, s) => acc + s.val, 0);
            const tier = bst >= 600 ? 'Legendary / Pseudo (S+)' : bst >= 520 ? 'S-Tier' : bst >= 450 ? 'A-Tier' : 'Standard';
            if (metaEl) metaEl.innerText = `#${String(entity.id).padStart(3, '0')} · ${entity.genus} · ${entity.types.join(' / ')}`;
            if (spectralLbl) spectralLbl.innerText = 'Pokémon';
            if (sigPct) sigPct.innerText = entity.types.join(' · ');
            if (ratingLbl) ratingLbl.innerText = tier;
            if (dangerClass) dangerClass.innerText = `BST ${bst}`;

            if (statsMatrix) {
                statsMatrix.innerHTML = entity.stats.map((s) => {
                    const barColor = s.val >= 110 ? 'bg-emerald-400' : s.val >= 80 ? 'bg-sky-400' : 'bg-amber-400';
                    return `
                        <div class="os-card p-2.5">
                            <div class="flex justify-between text-[11px] mb-1">
                                <span class="text-gray-400 font-medium">${esc(s.name)}</span>
                                <span class="text-white font-mono font-bold tabular-nums">${s.val}</span>
                            </div>
                            <div class="w-full h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
                                <div class="h-full ${barColor} rounded-full" style="width:${Math.min(100, (s.val / 160) * 100)}%"></div>
                            </div>
                        </div>`;
                }).join('');
            }
            if (assessment) {
                assessment.innerText = `${entity.description || ''}  Abilities: ${entity.abilities.join(', ')} · Height: ${(entity.height / 10).toFixed(1)} m · Weight: ${(entity.weight / 10).toFixed(1)} kg.`;
            }
            os.renderEvolutionChain(entity);
        } else if (entity.type === 'db') {
            if (metaEl) metaEl.innerText = `${entity.affiliation} · ${entity.race}`;
            if (spectralLbl) spectralLbl.innerText = 'Dragon Ball';
            if (sigPct) sigPct.innerText = entity.race;
            if (ratingLbl) ratingLbl.innerText = entity.transformations?.length ? `${entity.transformations.length} Forms` : 'Base Form';
            if (dangerClass) dangerClass.innerText = `Max Ki: ${entity.maxKi}`;

            if (statsMatrix) {
                statsMatrix.innerHTML = `
                    <div class="os-card p-2.5"><div class="text-[10.5px] text-gray-400">Base Ki</div><div class="text-white font-bold font-mono mt-0.5 text-xs">${esc(entity.baseKi)}</div></div>
                    <div class="os-card p-2.5"><div class="text-[10.5px] text-gray-400">Peak Ki</div><div class="text-amber-300 font-bold font-mono mt-0.5 text-xs">${esc(entity.maxKi)}</div></div>
                    <div class="os-card p-2.5"><div class="text-[10.5px] text-gray-400">Homeworld</div><div class="text-white font-semibold mt-0.5 text-xs truncate">${esc(entity.planet)}</div></div>
                    <div class="os-card p-2.5"><div class="text-[10.5px] text-gray-400">Affiliation</div><div class="text-sky-300 font-semibold mt-0.5 text-xs truncate">${esc(entity.affiliation)}</div></div>
                `;
            }
            if (assessment) assessment.innerText = entity.description || 'Warrior from the Dragon Ball universe.';
            os.renderEvolutionChain(entity);
        } else {
            if (metaEl) metaEl.innerText = `${entity.kanji ? entity.kanji + ' · ' : ''}MyAnimeList Character`;
            if (spectralLbl) spectralLbl.innerText = 'Anime (Jikan)';
            if (sigPct) sigPct.innerText = entity.nicknames?.length ? entity.nicknames[0] : 'Main Cast';
            if (ratingLbl) ratingLbl.innerText = `${(entity.favoritesCount || 0).toLocaleString()} ★`;
            if (dangerClass) dangerClass.innerText = `MAL #${entity.id}`;
            if (statsMatrix) {
                statsMatrix.innerHTML = `
                    <div class="os-card p-2.5"><div class="text-[10.5px] text-gray-400">Community Favorites</div><div class="text-amber-300 font-bold font-mono mt-0.5 text-xs tabular-nums">${(entity.favoritesCount || 0).toLocaleString()}</div></div>
                    <div class="os-card p-2.5"><div class="text-[10.5px] text-gray-400">Aliases</div><div class="text-white font-medium mt-0.5 text-xs truncate">${esc(entity.nicknames?.join(', ') || 'None')}</div></div>
                `;
            }
            if (assessment) assessment.innerText = entity.description;
            os.renderEvolutionChain(entity);
        }
    },

    renderEvolutionChain: async (entity) => {
        const container = document.getElementById('scanner-evolution-chain');
        if (!container) return;
        const esc = (s) => os.fmEscape(String(s ?? ''));

        if (entity.type === 'db') {
            if (!entity.transformations || !entity.transformations.length) {
                container.innerHTML = `<div class="py-6 text-center text-gray-500 os-card text-xs">No alternate transformations recorded for ${esc(entity.name)}.</div>`;
                return;
            }
            container.innerHTML = entity.transformations.map((tr) => `
                <div class="os-card p-2.5 flex gap-3 items-center">
                    <div class="w-12 h-12 rounded-xl bg-black/50 shrink-0 overflow-hidden flex items-center justify-center border border-white/10">
                        <img src="${esc(tr.image)}" class="w-full h-full object-contain">
                    </div>
                    <div class="overflow-hidden flex-1">
                        <div class="text-white font-semibold text-xs truncate">${esc(tr.name)}</div>
                        <div class="text-[11px] text-gray-400 mt-0.5">Ki Rating: <span class="text-amber-300 font-mono font-semibold">${esc(tr.ki)}</span></div>
                    </div>
                </div>`).join('');
            return;
        }

        if (entity.type === 'pokemon' && entity.evolutionChainUrl) {
            container.innerHTML = `<div class="text-center py-6 text-gray-400 text-xs">Loading evolution chain...</div>`;
            try {
                const res = await fetch(entity.evolutionChainUrl);
                if (!res.ok) throw new Error('Evolution API unavailable');
                const data = await res.json();
                const stages = [];
                const collect = (node, depth = 1) => {
                    if (!node) return;
                    const urlParts = String(node.species?.url || '').split('/').filter(Boolean);
                    const speciesId = urlParts[urlParts.length - 1] || entity.id;
                    stages.push({ name: node.species.name, id: speciesId, stage: depth });
                    (node.evolves_to || []).forEach((next) => collect(next, depth + 1));
                };
                collect(data.chain, 1);

                container.innerHTML = stages.map((st) => {
                    const cap = st.name.charAt(0).toUpperCase() + st.name.slice(1);
                    const art = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${st.id}.png`;
                    return `
                        <button type="button" onclick="os.setScannerPreset('${esc(st.name)}')"
                            class="w-full os-card p-2.5 flex gap-3 items-center text-left hover:bg-white/[0.06] transition cursor-none hover-target">
                            <div class="w-12 h-12 rounded-xl bg-black/40 shrink-0 flex items-center justify-center border border-white/10">
                                <img src="${art}" class="w-10 h-10 object-contain">
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="text-[10.5px] text-sky-300 font-medium">Stage ${st.stage} · #${String(st.id).padStart(3, '0')}</div>
                                <div class="text-white font-semibold text-xs truncate">${esc(cap)}</div>
                            </div>
                            <span class="text-[11px] text-gray-400">Inspect →</span>
                        </button>`;
                }).join('');
            } catch (_) {
                container.innerHTML = `<div class="py-6 text-center text-gray-500 os-card text-xs">Evolution chain unavailable right now.</div>`;
            }
            return;
        }

        container.innerHTML = `<div class="py-6 text-center text-gray-500 os-card text-xs">Standalone character profile — no evolution stages.</div>`;
    },

    toggleCombatScaling: () => {
        const cur = os.entityscanner.scalingMode;
        os.entityscanner.scalingMode = cur === 'balanced' ? 'true' : 'balanced';
        const btn = document.getElementById('btn-combat-scale');
        if (btn) btn.innerText = os.entityscanner.scalingMode === 'balanced' ? 'Mode: Balanced' : 'Mode: Lore Power';
    },

    populateCombatSelectors: () => {
        const left = document.getElementById('combat-fighter-left');
        const right = document.getElementById('combat-fighter-right');
        if (!left || !right) return;
        const options = `
            <optgroup label="Pokémon">
                <option value="charizard">Charizard (Fire / Flying)</option>
                <option value="mewtwo">Mewtwo (Psychic)</option>
                <option value="pikachu">Pikachu (Electric)</option>
                <option value="rayquaza">Rayquaza (Dragon / Flying)</option>
            </optgroup>
            <optgroup label="Dragon Ball">
                <option value="goku">Son Goku (Saiyan)</option>
                <option value="vegeta">Vegeta (Saiyan)</option>
                <option value="frieza">Frieza (Emperor)</option>
                <option value="cell">Perfect Cell (Bio-Android)</option>
            </optgroup>
        `;
        left.innerHTML = options;
        right.innerHTML = options;
    },

    updateCombatFighter: (side) => {
        const select = document.getElementById(`combat-fighter-${side}`);
        const nameLabel = document.getElementById(`combat-${side}-name`);
        if (select && nameLabel && select.options[select.selectedIndex]) {
            nameLabel.innerText = select.options[select.selectedIndex].text.split(' (')[0];
        }
    },

    engageScouterCombat: () => {
        if (os.entityscanner.combatTimer) {
            clearInterval(os.entityscanner.combatTimer);
            os.entityscanner.combatTimer = null;
        }
        const leftSelect = document.getElementById('combat-fighter-left');
        const rightSelect = document.getElementById('combat-fighter-right');
        const log = document.getElementById('combat-feed-log');
        if (!leftSelect || !rightSelect || !log) return;

        const fighters = {
            goku:      { name: 'Son Goku',   hp: 500000, atk: 92000, isDB: true, move: 'Kamehameha' },
            vegeta:    { name: 'Vegeta',     hp: 480000, atk: 88000, isDB: true, move: 'Final Flash' },
            frieza:    { name: 'Frieza',     hp: 450000, atk: 84000, isDB: true, move: 'Supernova' },
            cell:      { name: 'Perfect Cell', hp: 430000, atk: 80000, isDB: true, move: 'Solar Kamehameha' },
            pikachu:   { name: 'Pikachu',    hp: 350,  atk: 95,  isDB: false, move: 'Volt Tackle' },
            mewtwo:    { name: 'Mewtwo',     hp: 1060, atk: 240, isDB: false, move: 'Psystrike' },
            charizard: { name: 'Charizard',  hp: 780,  atk: 195, isDB: false, move: 'Blast Burn' },
            rayquaza:  { name: 'Rayquaza',   hp: 1050, atk: 255, isDB: false, move: 'Dragon Ascent' }
        };

        const f1 = { ...(fighters[leftSelect.value] || fighters.charizard) };
        const f2 = { ...(fighters[rightSelect.value] || fighters.mewtwo) };

        if (os.entityscanner.scalingMode === 'balanced') {
            f1.hp = f1.isDB ? 160 : 145; f1.atk = f1.isDB ? 26 : 24;
            f2.hp = f2.isDB ? 160 : 145; f2.atk = f2.isDB ? 26 : 24;
        }

        const maxHp1 = f1.hp, maxHp2 = f2.hp;
        const cln = document.getElementById('combat-left-name'); if (cln) cln.innerText = f1.name;
        const crn = document.getElementById('combat-right-name'); if (crn) crn.innerText = f2.name;

        const updateHpBars = () => {
            const pct1 = Math.max(0, (f1.hp / maxHp1) * 100);
            const pct2 = Math.max(0, (f2.hp / maxHp2) * 100);
            const bar1 = document.getElementById('combat-left-hp-bar');
            const bar2 = document.getElementById('combat-right-hp-bar');
            const label1 = document.getElementById('combat-left-hp-readout');
            const label2 = document.getElementById('combat-right-hp-readout');
            if (bar1) bar1.style.width = `${pct1}%`;
            if (bar2) bar2.style.width = `${pct2}%`;
            if (label1) label1.innerText = `${Math.round(f1.hp)}/${Math.round(maxHp1)}`;
            if (label2) label2.innerText = `${Math.round(f2.hp)}/${Math.round(maxHp2)}`;
        };
        updateHpBars();

        let step = 0;
        const logs = [`Match started: ${f1.name} vs ${f2.name} (${os.entityscanner.scalingMode === 'balanced' ? 'Balanced Arena' : 'Lore Power'})`];
        log.innerHTML = logs.map((l) => `<div class="text-sky-300">${l}</div>`).join('');

        os.entityscanner.combatTimer = setInterval(() => {
            step++;
            if (f1.hp <= 0 || f2.hp <= 0) {
                clearInterval(os.entityscanner.combatTimer);
                os.entityscanner.combatTimer = null;
                const winner = f1.hp > 0 ? f1.name : f2.name;
                logs.push(`🏆 Winner: ${winner}!`);
                log.innerHTML = logs.map((l, idx) => `<div class="${idx === logs.length - 1 ? 'text-emerald-300 font-semibold pt-1' : 'text-gray-300'}">${l}</div>`).join('');
                log.scrollTop = log.scrollHeight;
                return;
            }
            const attacker = step % 2 === 1 ? f1 : f2;
            const defender = step % 2 === 1 ? f2 : f1;
            const crit = Math.random() > 0.82;
            const dmg = Math.max(1, Math.round(attacker.atk * (crit ? 1.65 : (0.85 + Math.random() * 0.35))));
            defender.hp = Math.max(0, defender.hp - dmg);
            logs.push(`Turn ${step}: ${attacker.name} used ${attacker.move}${crit ? ' (Critical hit!)' : ''} — ${dmg.toLocaleString()} dmg.`);
            updateHpBars();
            log.innerHTML = logs.map((l) => `<div class="text-gray-300">${l}</div>`).join('');
            log.scrollTop = log.scrollHeight;
        }, 750);
    },

    filemanager: {
        currentPath: '/Archive',
        currentTab: 'all',
        activeFileId: 'doc-welcome',
        query: '',
        editingId: null,
        history: [],
        tabs: [
            { id: 'all', label: 'All Items', icon: 'layers' },
            { id: 'note', label: 'Documents', icon: 'file-text' },
            { id: 'wiki', label: 'Wikipedia', icon: 'book-open' },
            { id: 'media', label: 'Images & Audio', icon: 'image' }
        ],
        data: {
            id: 'root', name: 'Archive', kind: 'folder', path: '/Archive', signal: 'Root', children: [
                {
                    id: 'fld-docs', name: 'Documents', kind: 'folder', path: '/Archive/Documents', signal: 'Local', children: [
                        { id: 'doc-welcome', name: 'Welcome to AetherOS.md', kind: 'note', path: '/Archive/Documents/Welcome to AetherOS.md', signal: 'Local', size: '1.4 KB', modified: '2026-11-22', icon: 'file-text', tags: ['guide', 'workspace'], related: ['doc-shortcuts', 'doc-cli'], refs: ['Computer desktop', 'Graphical user interface'], content: '# Welcome to AetherOS\n\nAetherOS is a multi-window web desktop with 48 registered apps, 3 virtual workspaces, an IndexedDB file system, and live public APIs.\n\n- Drag local files anywhere onto the desktop to store them in IndexedDB.\n- Click "+ New File" above to create Markdown or text notes.\n- Type a topic into the search bar and click "Import Wiki" to mount any Wikipedia article and its images as a browsable folder.' },
                        { id: 'doc-shortcuts', name: 'Keyboard Shortcuts.md', kind: 'note', path: '/Archive/Documents/Keyboard Shortcuts.md', signal: 'Local', size: '1.1 KB', modified: '2026-11-22', icon: 'keyboard', tags: ['shortcuts', 'productivity'], related: ['doc-welcome', 'doc-cli'], refs: [], content: '# Keyboard Shortcuts\n\n- Cmd / Ctrl + K : Open Command Palette (apps, math, units, window tiling)\n- Space (in Files) : Quick Look preview\n- Ctrl + L (in Terminal) : Clear terminal output\n- Tab (in Terminal) : Autocomplete commands, apps, and file names\n- Drag window to screen edges : Snap left, right, or maximize' },
                        { id: 'doc-cli', name: 'Terminal Guide.txt', kind: 'note', path: '/Archive/Documents/Terminal Guide.txt', signal: 'Local', size: '0.9 KB', modified: '2026-11-22', icon: 'terminal', tags: ['shell', 'cli'], related: ['doc-welcome'], refs: [], content: 'Try running these commands in Terminal:\n\n  neofetch\n  ls /Archive/Documents\n  cat "Welcome to AetherOS.md"\n  touch todo.md\n  write todo.md Ship clean UI across the registered modules\n  grep shortcut\n  ps\n  calc (1920 * 1080) / 1000000' }
                    ]
                },
                {
                    id: 'fld-notes', name: 'Research Notes', kind: 'folder', path: '/Archive/Research Notes', signal: 'Local', children: [
                        { id: 'note-index', name: 'Scratchpad Ideas.md', kind: 'note', path: '/Archive/Research Notes/Scratchpad Ideas.md', signal: 'Local', size: '0.6 KB', modified: '2026-11-22', icon: 'notebook', tags: ['notes'], related: ['doc-welcome'], refs: ['Hypertext', 'Memex'], content: '# Scratchpad Ideas\n\nUse DevPad Studio or click "Edit Content" in the right inspector to edit any text file directly inside Files.' }
                    ]
                }
            ]
        }
    },

    fmCreateNewFile: (rawName, content = '', folderPath = os.filemanager.currentPath) => {
        const name = String(rawName || 'Untitled.md').trim() || 'Untitled.md';
        const folder = os.fmFindByPath(folderPath) || os.filemanager.data;
        folder.children = folder.children || [];
        const id = 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
        const node = {
            id,
            name,
            kind: 'note',
            path: `${folder.path}/${name}`,
            signal: 'Local',
            size: `${Math.max(0.1, (String(content).length / 1024)).toFixed(1)} KB`,
            modified: new Date().toISOString().slice(0, 10),
            icon: /\.md$/i.test(name) ? 'file-text' : 'file-code',
            tags: ['local'],
            related: [],
            refs: [],
            content: String(content || `# ${name.replace(/\.[^.]+$/, '')}\n\n`),
            localEditable: true
        };
        folder.children.unshift(node);
        os.filemanager.activeFileId = id;
        if (window.AetherVFS && AetherVFS.putFile) {
            AetherVFS.putFile({
                id,
                name,
                mime: 'text/markdown',
                kind: 'markdown',
                size: node.content.length,
                folder: folder.path.replace(/^\/Archive\/?/,'')||'User Uploads',
                content: node.content
            }).then(record=>os.fmSetStatus(record.persistence==='session-only'?'New file is session-only — download before reload.':'New file saved to browser storage')).catch(()=>os.fmSetStatus('New file is in this session only. Export before reload.'));
        }
        os.fmRender();
        return node;
    },

    fmPromptNewFile: () => {
        const defaultName = `Note-${new Date().toISOString().slice(11, 16).replace(':', '')}.md`;
        const node = os.fmCreateNewFile(defaultName, `# New Document\n\nWrite your notes here...\n`, os.filemanager.currentPath);
        os.filemanager.editingId = node.id;
        os.fmRenderPreview();
        setTimeout(() => document.getElementById('fm-inline-name')?.select(), 40);
    },

    fmSaveFolderLayout: async () => {
        if(!window.AetherVFS)return {persistence:'session-only'};
        return AetherVFS.setMeta('archive-folders-v1',os.fmFlatten().filter(n=>n.localFolder&&n.kind==='folder').map(n=>n.path));
    },

    fmPromptNewFolder: async () => {
        const parent = os.fmFindByPath(os.filemanager.currentPath) || os.filemanager.data;
        parent.children = parent.children || [];
        let idx = 1;
        let name = 'New Folder';
        while (parent.children.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
            idx++;
            name = `New Folder ${idx}`;
        }
        const folder = {
            id: 'fld-' + Date.now(),
            name,
            kind: 'folder',
            path: `${parent.path}/${name}`,
            signal: 'Local',
            localFolder:true,
            children: []
        };
        parent.children.unshift(folder);
        os.fmRender();
        try{const saved=await os.fmSaveFolderLayout();os.fmSetStatus(saved.persistence==='session-only'?'Folder exists in this session only.':'Folder saved to browser storage');}catch(_){os.fmSetStatus('Folder exists in this session only.');}
    },

    fmStartEditFile: (id) => {
        os.filemanager.editingId = id;
        os.fmRenderPreview();
    },

    fmSaveInlineEdit: async id => {
        const file=os.fmFindById(id);if(!file)return;
        const name=(document.getElementById('fm-inline-name')?.value||file.name).trim(),body=document.getElementById('fm-inline-body')?.value??file.content;
        const dir=file.path.split('/').slice(0,-1).join('/')||'/Archive';
        if(!name||name==='.'||name==='..'||/[\\/]/.test(name)||name.length>180){os.fmSetStatus('Use a filename without slashes (up to 180 characters).');return;}
        if(os.fmChildrenForPath(dir).some(n=>n.id!==id&&n.name===name)){os.fmSetStatus('Another file already uses that name.');return;}
        const button=document.getElementById('fm-edit-save');if(button)button.disabled=true;
        try{
            if(!window.AetherVFS)throw Error('File storage unavailable. Your edit is still in the editor.');
            os.fmSetStatus('Saving…');
            const bytes=new TextEncoder().encode(body).length;
            const record=await AetherVFS.putFile({id:file.id,name,mime:file.mime||(/\.md$/i.test(name)?'text/markdown':'text/plain'),folder:dir.replace(/^\/Archive\/?/,''),kind:'note',size:bytes,content:body});
            Object.assign(file,{name,path:`${dir}/${name}`,content:body,size:`${(bytes/1024).toFixed(1)} KB`,modified:new Date().toISOString().slice(0,10),vfsBacked:true});
            os.filemanager.editingId=null;os.fmRender();
            os.fmSetStatus(record.persistence==='session-only'?'Session-only copy — download before reload.':'Saved to browser storage');
        }catch(error){os.fmSetStatus(error.message||'Save failed. Your edit has not been discarded.');}
        finally{if(button?.isConnected)button.disabled=false;}
    },

    fmDeleteNode: async (id) => {
        const removeRec = (parent) => {
            if (!Array.isArray(parent.children)) return false;
            const i = parent.children.findIndex((c) => c.id === id);
            if (i >= 0) {
                parent.children.splice(i, 1);
                return true;
            }
            return parent.children.some(removeRec);
        };
        const target = os.fmFindById(id);
        if (!target || target.id === 'root') return;
        if(target.kind==='folder'&&!target.localFolder){os.fmSetStatus('Built-in archive locations cannot be deleted.');return;}
        if(target.kind==='folder'&&target.children?.length){os.fmSetStatus('Move or delete the contents first. Recursive folder deletion is not supported.');return;}
        if(!window.confirm(`Delete "${target.name}"? There is no trash or undo for this file.`))return;
        if (target.isVfs || target.vfsBacked || target.localEditable) {
            if(!window.AetherVFS){os.fmSetStatus('File storage unavailable. Nothing was deleted.');return;}
            try{await AetherVFS.deleteFile(id);}catch(_){os.fmSetStatus('Delete failed. The file was kept.');return;}
        }
        removeRec(os.filemanager.data);
        if(target.localFolder)await os.fmSaveFolderLayout().catch(()=>os.fmSetStatus('Folder deletion could not be persisted.'));
        os.filemanager.activeFileId = (os.fmChildrenForPath(os.filemanager.currentPath).find((x) => x.kind !== 'folder') || {}).id || '';
        os.fmRender();
    },

    fmDownloadTextFile: (id) => {
        const file = os.fmFindById(id);
        if (!file) return;
        if ((file.isVfs || file.vfsBacked) && window.AetherVFS) {
            AetherVFS.downloadFile(id);
            return;
        }
        const blob = new Blob([String(file.content || '')], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = file.name || 'document.txt';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    },

    initFileManager: () => {
                os.logTerminal('Living Archive: Mounted knowledge file system and relationship index.');
                if (window.AetherVFS) {
                    Promise.all([window.AetherVFS.getAllFiles(),window.AetherVFS.getMeta('archive-folders-v1')]).then(() => {
                        window.AetherVFS.syncToFileManager();
                        os.fmRender();
                    });
                } else {
                    os.fmRender();
                }
            },

    killFileManager: () => {
                os.logTerminal('Living Archive: Unmounted archive explorer.');
            },

    fmEscape: (str='') => String(str).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])),

    fmFlatten: (node=os.filemanager.data, acc=[]) => {
                acc.push(node);
                (node.children || []).forEach(child => os.fmFlatten(child, acc));
                return acc;
            },

    fmFindById: (id) => os.fmFlatten().find(n => n.id === id),

    fmFindByPath: (path) => os.fmFlatten().find(n => n.path === path),

    fmChildrenForPath: (path) => {
                const folder = os.fmFindByPath(path) || os.filemanager.data;
                return folder.children || [];
            },

    fmTrimHistory: () => { os.filemanager.history = os.filemanager.history.slice(0, 8); },

    fmGoBack: () => {
                const h = os.filemanager.history.find(item => item.path && item.path !== os.filemanager.currentPath);
                if (h) {
                    if (h.type === 'folder') os.filemanager.currentPath = h.path;
                    if (h.type === 'file') os.filemanager.activeFileId = h.id;
                    os.fmRender();
                }
            },

    fmSetTab: (tab) => {
                os.filemanager.currentTab = tab;
                os.fmRender();
            },

    fmHoverFile: (id, event) => {
                const box = document.getElementById('fm-hover-preview');
                const f = os.fmFindById(id);
                if (!box || !f || f.kind === 'folder') return;
                box.innerHTML = `<div class="text-white font-bold mb-1">${os.fmEscape(f.name)}</div><div class="text-gray-500 uppercase text-[8px] mb-2">${f.kind} · ${f.signal} · ${f.size || '--'}</div><div class="leading-relaxed">${os.fmEscape(f.content || '').slice(0, 180)}...</div>`;
                box.style.left = Math.min(event.offsetX + 24, 720) + 'px';
                box.style.top = Math.max(event.offsetY - 8, 58) + 'px';
                box.classList.remove('hidden');
            },

    fmHideHover: () => { const box = document.getElementById('fm-hover-preview'); if (box) box.classList.add('hidden'); },

    fmRender: () => {
                if (!document.getElementById('filemanager-root')) return;
                os.fmRenderTabs(); os.fmRenderSidebar(); os.fmRenderTree(); os.fmRenderBreadcrumbs(); os.fmRenderList(); os.fmRenderHistory();
                lucide.createIcons({ root: document.getElementById('filemanager-root') });
            },

    fmRenderTabs: () => {
                const el = document.getElementById('fm-tabs'); if (!el) return;
                el.innerHTML = os.filemanager.tabs.map(t => `<button onclick="os.fmSetTab('${t.id}')" class="fm-tab px-3 py-1.5 rounded-t-lg border border-white/5 ${os.filemanager.currentTab===t.id?'fm-active text-white':'text-gray-500 hover:text-white hover:bg-white/5'} cursor-none hover-target flex items-center gap-1.5"><i data-lucide="${t.icon}" class="w-3 h-3"></i>${t.label}</button>`).join('');
            },

    fmRenderSidebar: () => {
                const el = document.getElementById('fm-sidebar'); if (!el) return;
                const folders = os.fmFlatten().filter(n => n.kind === 'folder');
                el.innerHTML = folders.map(f => `<button onclick="os.fmOpenPath('${f.path}')" class="fm-tree-row w-full text-left px-2 py-2 rounded border border-transparent ${os.filemanager.currentPath===f.path?'fm-active':'text-gray-400'} cursor-none hover-target flex items-center gap-2"><i data-lucide="folder" class="w-3.5 h-3.5"></i><span class="truncate">${os.fmEscape(f.name)}</span></button>`).join('');
            },

    fmRenderTree: () => {
                const el = document.getElementById('fm-tree'); if (!el) return;
                const draw = (node, depth=0) => `<div><button onclick="os.fmOpenPath('${node.path}')" class="fm-tree-row w-full text-left px-2 py-1.5 rounded border border-transparent ${os.filemanager.currentPath===node.path?'fm-active':'text-gray-500'} cursor-none hover-target flex items-center gap-2" style="padding-left:${8 + depth*13}px"><i data-lucide="chevron-right" class="w-3 h-3 opacity-50"></i><i data-lucide="folder-tree" class="w-3 h-3"></i><span class="truncate">${os.fmEscape(node.name)}</span></button>${(node.children||[]).filter(c=>c.kind==='folder').map(c=>draw(c, depth+1)).join('')}</div>`;
                el.innerHTML = draw(os.filemanager.data);
            },

    fmRenderBreadcrumbs: () => {
                const el = document.getElementById('fm-breadcrumbs'); if (!el) return;
                const parts = os.filemanager.currentPath.split('/').filter(Boolean);
                let cur = '';
                el.innerHTML = parts.map((part, idx) => { cur += '/' + part; return `<button onclick="os.fmOpenPath('${cur}')" class="hover:text-white cursor-none hover-target ${idx===parts.length-1?'text-white':'text-gray-500'}">${os.fmEscape(part)}</button>${idx<parts.length-1?'<span class="text-gray-700">/</span>':''}`; }).join('');
            },

    fmRenderRecommendations: () => {
                const el = document.getElementById('fm-recommendations'); if (!el) return;
                const file = os.fmFindById(os.filemanager.activeFileId);
                const pool = (file?.related || []).map(id => os.fmFindById(id)).filter(Boolean).slice(0,4);
                el.innerHTML = pool.map(r => `<button onclick="os.fmJumpToRelated('${r.id}')" class="fm-chip rounded-lg border border-white/10 bg-white/5 p-2 text-left cursor-none hover-target"><div class="text-white truncate">${os.fmEscape(r.name)}</div><div class="text-[8px] text-gray-500 uppercase">similar ${r.kind}</div></button>`).join('') || '<div class="col-span-2 text-gray-600 text-center py-6">Open a connected file for recommendations</div>';
            },

    fmRenderHistory: () => {
                const el = document.getElementById('fm-history'); if (!el) return;
                el.innerHTML = os.filemanager.history.map(h => `<button onclick="${h.type==='file' ? `os.fmOpenFile('${h.id}')` : `os.fmOpenPath('${h.path}')`}" class="w-full text-left px-2 py-1.5 rounded bg-white/[0.025] hover:bg-white/5 text-gray-500 hover:text-white truncate cursor-none hover-target">${h.type==='file'?'◦':'▸'} ${os.fmEscape(h.name)}</button>`).join('') || '<div class="text-gray-700">No recent archive jumps.</div>';
            },

    fmJumpToRelated: (id) => {
                const f = os.fmFindById(id); if (!f) return;
                const folderPath = f.path.split('/').slice(0,-1).join('/') || '/Archive';
                os.filemanager.currentPath = folderPath;
                os.fmOpenFile(id);
            },

    fmSpawnRabbitHole: (label) => {
                os.logTerminal(`Living Archive: Rabbit hole surfaced → ${label}`);
                const input = document.getElementById('fm-search-input');
                if (input) input.value = label;
                os.fmSearch(label);
            },

    fmCloseQuickLook: () => { const modal = document.getElementById('fm-quicklook-modal'); if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); } },

    fmSetStatus: (msg, live=false) => {
                const el = document.getElementById('fm-status-live');
                if(el){el.textContent=msg;el.setAttribute('role','status');}
            },

    fmSlug: (str='') => String(str).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80) || 'node',

    fmRand: (len=10) => Array.from({length:len}, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random()*36)]).join(''),

    fmSafeSegment: (str='') => String(str).replace(/[\/`'"<>:#?%{}|^~[\]]/g,' ').replace(/\s+/g,' ').trim().slice(0,120) || 'Untitled',

    fmApi: async (params) => {
                const url = 'https://en.wikipedia.org/w/api.php?origin=*&format=json&' + new URLSearchParams(params).toString();
                const res = await fetch(url);
                if (!res.ok) throw new Error(`Wikipedia API ${res.status}`);
                return await res.json();
            },

    fmEnsureWikipediaRoot: () => {
                let root = os.fmFindByPath('/Archive/Wikipedia');
                if (!root) {
                    root = { id:'fld-wikipedia-live', name:'Wikipedia Live', kind:'folder', path:'/Archive/Wikipedia', signal:'LIVE', children:[] };
                    os.filemanager.data.children.unshift(root);
                }
                return root;
            },

    fmTitleFromSearch: async (query) => {
                const q = String(query || '').trim();
                if (!q) return '';
                try {
                    const data = await os.fmApi({ action:'query', list:'search', srsearch:q, srlimit:1 });
                    return data?.query?.search?.[0]?.title || q;
                } catch(e) { return q; }
            },

    fmGetExtract: async (title) => {
                const data = await os.fmApi({ action:'query', prop:'extracts|pageimages', exintro:'1', explaintext:'1', redirects:'1', pithumbsize:'900', titles:title });
                const page = Object.values(data?.query?.pages || {})[0] || {};
                return { title: page.title || title, extract: page.extract || 'No extract returned by Wikipedia.', thumb: page.thumbnail?.source || '' };
            },

    fmGetParse: async (title) => {
                const data = await os.fmApi({ action:'parse', page:title, prop:'links|images', redirects:'1' });
                return data?.parse || { links:[], images:[] };
            },

    fmGetImageInfo: async (names=[]) => {
                const clean = [...new Set(names)].filter(Boolean).filter(n => !/\.svg$/i.test(n)).slice(0, 28);
                if (!clean.length) return [];
                const chunks = [];
                for (let i=0; i<clean.length; i+=20) chunks.push(clean.slice(i, i+20));
                const out = [];
                for (const ch of chunks) {
                    try {
                        const data = await os.fmApi({ action:'query', prop:'imageinfo', iiprop:'url|mime|size', iiurlwidth:'900', titles: ch.map(n => `File:${n}`).join('|') });
                        Object.values(data?.query?.pages || {}).forEach(p => {
                            const info = p.imageinfo?.[0];
                            if (info && /^image\//.test(info.mime || '')) out.push({ title:(p.title||'').replace(/^File:/,''), url:info.thumburl || info.url, original:info.url, mime:info.mime, width:info.thumbwidth || info.width, height:info.thumbheight || info.height, size:info.size });
                        });
                    } catch(e) {}
                }
                return out.slice(0, 20);
            },

    fmWikiSearch: async (query) => {
                query = String(query || '').trim();
                if (!query) return;
                os.fmSetStatus(`fetching wikipedia: ${query}`, true);
                os.logTerminal(`Living Archive: Fetching live Wikipedia page "${query}"...`);
                try {
                    const title = await os.fmTitleFromSearch(query);
                    const folder = await os.fmBuildWikiFolder(title);
                    os.filemanager.currentPath = folder.path;
                    os.filemanager.activeFileId = folder.children?.find(c => c.kind === 'wiki')?.id || os.filemanager.activeFileId;
                    os.filemanager.query = '';
                    const input = document.getElementById('fm-search-input'); if (input) input.value = '';
                    os.fmSetStatus(`mounted wiki folder: ${folder.name}`);
                    os.fmRender();
                } catch(e) {
                    os.fmSetStatus('wiki fetch failed');
                    os.logTerminal(`Living Archive: Wikipedia fetch failed — ${e.message}`);
                }
            },

    fmBuildWikiFolder: async (title, parentPath='/Archive/Wikipedia') => {
                const wikiRoot = os.fmEnsureWikipediaRoot();
                const parent = os.fmFindByPath(parentPath) || wikiRoot;
                const meta = await os.fmGetExtract(title);
                const actualTitle = meta.title || title;
                const slug = os.fmSlug(actualTitle);
                const folderPath = `${parent.path}/${os.fmSafeSegment(actualTitle)}`;
                let folder = os.fmFindByPath(folderPath);
                if (folder && folder.wikiLoaded) return folder;
                if (!folder) {
                    folder = { id:`wiki-folder-${slug}-${os.fmRand(4)}`, name:actualTitle, kind:'folder', path:folderPath, signal:'WIKI', wikiTitle:actualTitle, wikiLoaded:false, children:[] };
                    parent.children = parent.children || [];
                    parent.children.unshift(folder);
                }
                folder.children = [{ id:`loading-${slug}`, name:'Fetching links and media...', kind:'note', path:`${folder.path}/Fetching links and media...`, signal:'WAIT', icon:'loader', content:'Wikipedia API request in progress.' }];
                os.fmRender();

                const parsed = await os.fmGetParse(actualTitle);
                const links = (parsed.links || [])
                    .filter(l => l.ns === 0 && l.exists !== undefined && l['*'])
                    .map(l => l['*'])
                    .filter(t => !/^(ISBN|Help:|Portal:|Category:|File:|Template:)/i.test(t));
                const uniqueLinks = [...new Set(links)].slice(0, 120);
                const images = await os.fmGetImageInfo(parsed.images || []);
                const summaryId = `wiki-summary-${slug}`;
                const summary = {
                    id: summaryId, name:`${actualTitle}.wiki`, kind:'wiki', path:`${folder.path}/${actualTitle}.wiki`, signal:'LIVE', size:`${Math.max(1, Math.round((meta.extract || '').length/1024))} KB`, modified:new Date().toISOString().slice(0,10), icon:'file-text', wikiTitle:actualTitle, sourceUrl:`https://en.wikipedia.org/wiki/${encodeURIComponent(actualTitle.replace(/ /g,'_'))}`,
                    tags:['wikipedia','live-fetch','infinite-folder'], refs: uniqueLinks.slice(0,12), related: [], content: meta.extract || 'No extract returned by Wikipedia.', imageUrl: meta.thumb || images[0]?.url || ''
                };
                const linkFolders = uniqueLinks.map((lt, idx) => ({
                    id:`wiki-link-${slug}-${os.fmSlug(lt)}-${idx}`, name:lt, kind:'folder', path:`${folder.path}/${os.fmSafeSegment(lt)}`, signal:'LINK', wikiTitle:lt, wikiLazy:true, wikiLoaded:false,
                    children:[{ id:`stub-${slug}-${idx}`, name:'Open this folder to fetch its Wikipedia page', kind:'note', path:`${folder.path}/${os.fmSafeSegment(lt)}/README.txt`, signal:'LAZY', icon:'download-cloud', content:`This is a live Wikipedia link-folder for "${lt}". Opening it fetches that page, extracts its links, and stores its images here.` }]
                }));
                const mediaFiles = images.map((img, idx) => {
                    const cleanName = os.fmSafeSegment(img.title || `Image-${idx + 1}`);
                    return { id: `wiki-img-${slug}-${idx}-${os.fmRand(4)}`, name: cleanName, originalName: img.title, kind: 'media', path: `${folder.path}/${cleanName}`, signal: 'Wiki Image', size: img.size ? `${Math.round(img.size / 1024)} KB` : 'Image', modified: new Date().toISOString().slice(0, 10), icon: 'image', imageUrl: img.url, originalUrl: img.original, mime: img.mime, width: img.width, height: img.height, tags: ['wikipedia', 'image'], refs: [img.title], related: [summaryId], content: `Image from Wikipedia article "${actualTitle}" (${img.title}).` };
                });
                summary.related = [...linkFolders.slice(0, 12).map((n) => n.id), ...mediaFiles.slice(0, 6).map((n) => n.id)];
                folder.children = [summary, ...mediaFiles, ...linkFolders];
                folder.signal = `${folder.children.length} items`;
                folder.wikiLoaded = true;
                folder.wikiLazy = false;
                os.logTerminal(`Files: Imported Wikipedia folder "${actualTitle}" (${folder.children.length} items).`);
                return folder;
            },

    fmOpenPath: async (path) => {
                const folder = os.fmFindByPath(path);
                if (!folder || folder.kind !== 'folder') return;
                if (folder.wikiLazy && !folder.wikiLoaded && folder.wikiTitle) {
                    os.filemanager.currentPath = path;
                    os.fmSetStatus(`expanding wiki folder: ${folder.wikiTitle}`, true);
                    os.fmRender();
                    await os.fmBuildWikiFolder(folder.wikiTitle, path.split('/').slice(0,-1).join('/') || '/Archive/Wikipedia');
                }
                if (os.filemanager.currentPath !== path) os.filemanager.history.unshift({ type:'folder', id: folder.id, name: folder.name, path, at: Date.now() });
                os.filemanager.currentPath = path;
                os.filemanager.query = '';
                const input = document.getElementById('fm-search-input');
                if (input) input.value = '';
                const firstFile = (folder.children || []).find(x => x.kind !== 'folder');
                if (firstFile) os.filemanager.activeFileId = firstFile.id;
                os.fmTrimHistory();
                os.fmSetStatus(folder.wikiTitle ? `opened: ${folder.wikiTitle}` : 'index synchronized');
                os.fmRender();
            },

    fmOpenFile: (id) => {
                const file = os.fmFindById(id);
                if (!file) return;
                if (file.kind === 'folder') return os.fmOpenPath(file.path);
                os.filemanager.activeFileId = id;
                os.filemanager.history.unshift({ type:'file', id: file.id, name: file.name, path: file.path, at: Date.now() });
                os.fmTrimHistory();
                os.fmRender();
            },

    fmSearch: (value) => {
                os.filemanager.query = String(value || '').trim().toLowerCase();
                os.fmRenderList();
                if (value && value.length > 2) os.fmSetStatus('local filter active — press Enter to fetch Wikipedia');
            },

    fmRenderPreview: () => {
        const el = document.getElementById('fm-preview'); if (!el) return;
        const file = os.fmFindById(os.filemanager.activeFileId);
        if (!file) { el.innerHTML = '<div class="p-6 text-gray-500 text-xs">Select a file or click "+ New File" to begin.</div>'; return; }

        if (os.filemanager.editingId === file.id) {
            el.innerHTML = `
                <div class="p-4 space-y-3 h-full flex flex-col">
                    <div class="text-xs font-semibold text-white">Editing Document</div>
                    <input id="fm-inline-name" aria-label="File name" maxlength="180" type="text" value="${os.fmEscape(file.name)}" class="os-input px-2.5 py-1.5 text-xs font-medium">
                    <textarea id="fm-inline-body" aria-label="File contents" class="flex-1 min-h-[200px] os-input p-3 text-xs font-mono leading-relaxed resize-none">${os.fmEscape(file.content || '')}</textarea>
                    <div class="flex items-center gap-2">
                        <button type="button" id="fm-edit-save" onclick="os.fmSaveInlineEdit('${file.id}')" class="os-btn-primary px-3.5 py-1.5 text-xs hover-target cursor-none">Save Changes</button>
                        <button type="button" onclick="os.filemanager.editingId=null;os.fmRenderPreview()" class="os-btn px-3 py-1.5 hover-target cursor-none">Cancel</button>
                    </div>
                </div>`;
            return;
        }

        const related = (file.related || []).map((id) => os.fmFindById(id)).filter(Boolean);
        const mediaBlock = file.imageUrl
            ? `<div class="rounded-xl border border-white/10 bg-black/50 overflow-hidden"><img src="${os.fmEscape(file.imageUrl)}" class="w-full max-h-56 object-contain bg-black" alt="${os.fmEscape(file.originalName || file.name)}" referrerpolicy="no-referrer"></div>`
            : (file.audioUrl ? `<div class="rounded-xl border border-white/10 bg-black/50 p-3"><audio controls src="${os.fmEscape(file.audioUrl)}" class="w-full h-9"></audio></div>` : '');
        const source = file.sourceUrl ? `<a href="${os.fmEscape(file.sourceUrl)}" target="_blank" rel="noopener" class="inline-block mt-1.5 text-[11px] text-sky-300 hover:text-white cursor-none hover-target">Open source page ↗</a>` : '';
        const isTextEditable = !file.imageUrl && !file.audioUrl && file.kind !== 'folder';
        const canDataLab = file.kind === 'json' || /\.(csv|tsv|json)$/i.test(file.name || '');

        const actionButtons = `
            <div class="flex flex-wrap gap-1.5">
                <button type="button" onclick="os.openQuickLook ? os.openQuickLook('${file.id}') : os.fmQuickLook()" class="os-btn hover-target cursor-none">Quick Look</button>
                ${isTextEditable ? `<button type="button" onclick="os.fmStartEditFile('${file.id}')" class="os-btn text-sky-300 hover-target cursor-none">Edit / Rename</button>` : ''}
                ${isTextEditable ? `<button type="button" onclick="window.AetherVFS ? AetherVFS.openInDevPad('${file.id}') : os.openWindow('devpad')" class="os-btn text-indigo-300 hover-target cursor-none">Open in DevPad</button>` : ''}
                ${canDataLab && typeof os.dataToolsOpenVfsFile==='function' ? `<button type="button" onclick="os.dataToolsOpenVfsFile && os.dataToolsOpenVfsFile('${file.id}')" class="os-btn text-teal-300 hover-target cursor-none">Data Lab</button>` : ''}
                ${file.imageUrl ? `<button type="button" onclick="os.ppOpenVfsImage && os.ppOpenVfsImage('${file.id}')" class="os-btn text-purple-300 hover-target cursor-none">Photopea</button>` : ''}
                ${file.imageUrl ? `<button type="button" onclick="window.AetherVFS && AetherVFS.applyFileAsWallpaper('${file.id}')" class="os-btn text-sky-300 hover-target cursor-none">Set Wallpaper</button>` : ''}
                <button type="button" onclick="os.fmDownloadTextFile('${file.id}')" class="os-btn hover-target cursor-none">Download</button>
                <button type="button" onclick="os.fmDeleteNode('${file.id}')" class="os-btn text-rose-300 hover-target cursor-none">Delete</button>
            </div>`;

        el.innerHTML = `<div class="p-4 space-y-3.5 text-xs">
            <div class="os-card p-3.5">
                <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-xl bg-white/[0.07] border border-white/10 flex items-center justify-center shrink-0"><i data-lucide="${file.icon || 'file'}" class="w-5 h-5 text-sky-300"></i></div>
                    <div class="min-w-0 flex-1">
                        <div class="text-white font-semibold text-sm leading-snug break-words">${os.fmEscape(file.name)}</div>
                        <div class="text-[11px] text-gray-400 mt-0.5">${os.fmEscape(file.kind)} · ${os.fmEscape(file.size || '--')} · ${os.fmEscape(file.modified || 'Today')}</div>
                        ${source}
                    </div>
                </div>
            </div>
            ${actionButtons}
            ${mediaBlock}
            <div>
                <div class="text-[11px] font-semibold text-gray-400 mb-1.5">Preview</div>
                <div class="os-card p-3 leading-relaxed text-gray-200 select-text whitespace-pre-wrap max-h-56 overflow-y-auto font-mono text-[11.5px]">${os.fmEscape(file.content || 'Empty file.')}</div>
            </div>
            ${(file.refs || []).length ? `<div><div class="text-[11px] font-semibold text-gray-400 mb-1.5">Wikipedia Topics</div><div class="space-y-1">${(file.refs || []).slice(0, 10).map((ref) => `<button type="button" onclick="os.fmWikiSearch('${os.fmEscape(ref).replace(/'/g, "\\'")}')" class="w-full text-left px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] text-gray-300 hover:text-white cursor-none hover-target text-[11px]">↳ ${os.fmEscape(ref)}</button>`).join('')}</div></div>` : ''}
            ${related.length ? `<div><div class="text-[11px] font-semibold text-gray-400 mb-1.5">Related Files</div><div class="space-y-1">${related.slice(0, 6).map((r) => `<button type="button" onclick="os.fmJumpToRelated('${r.id}')" class="w-full px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] text-left cursor-none hover-target flex items-center gap-2 text-[11px]"><i data-lucide="${r.icon || 'folder'}" class="w-3.5 h-3.5 text-gray-400"></i><span class="truncate text-gray-200">${os.fmEscape(r.name)}</span></button>`).join('')}</div></div>` : ''}
        </div>`;
        if (window.lucide) lucide.createIcons({ root: el });
    },

    fmRenderList: () => {
        const el = document.getElementById('fm-file-list'); if (!el) return;
        const q = os.filemanager.query;
        let items = q
            ? os.fmFlatten().filter((n) => n.kind !== 'folder' && [n.name, n.kind, (n.tags || []).join(' '), (n.refs || []).join(' '), n.content, n.originalName].join(' ').toLowerCase().includes(q))
            : os.fmChildrenForPath(os.filemanager.currentPath);
        if (os.filemanager.currentTab !== 'all') items = items.filter((n) => n.kind === 'folder' || n.kind === os.filemanager.currentTab);
        const count = document.getElementById('fm-count-label'); if (count) count.innerText = `${items.length} items`;
        if (!items.length) {
            el.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-gray-500 text-xs text-center px-6 gap-2"><div>No matching files in this folder.</div><div class="text-[11px] text-gray-600">Click "+ New File" to create a note or "Import Wiki" to fetch a Wikipedia topic.</div></div>`;
        } else {
            el.innerHTML = items.map((item) => {
                const isFolder = item.kind === 'folder';
                const active = os.filemanager.activeFileId === item.id;
                return `<button type="button" onclick="os.fmOpenNode('${item.id}')" class="w-full grid grid-cols-[30px_1fr_86px_86px_74px] gap-2 items-center px-3 py-2 rounded-xl border transition ${
                    active ? 'bg-white/[0.09] border-white/20 text-white' : 'border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05] text-gray-200'
                } text-left cursor-none hover-target">
                    <span class="w-6 h-6 rounded-lg bg-white/[0.06] flex items-center justify-center ${isFolder ? 'text-amber-300' : 'text-sky-300'}"><i data-lucide="${isFolder ? 'folder' : (item.icon || 'file')}" class="w-3.5 h-3.5"></i></span>
                    <span class="min-w-0"><span class="block truncate font-medium text-xs">${os.fmEscape(item.name)}</span><span class="block truncate text-[10.5px] text-gray-500">${os.fmEscape(item.originalName || item.path)}</span></span>
                    <span class="capitalize text-[11px] text-gray-400">${os.fmEscape(item.kind)}</span>
                    <span class="text-[11px] text-gray-400 truncate">${os.fmEscape(item.signal || 'Local')}</span>
                    <span class="text-[11px] font-mono text-gray-400 tabular-nums">${isFolder ? `${(item.children || []).length} items` : os.fmEscape(item.size || '--')}</span>
                </button>`;
            }).join('');
        }
        os.fmRenderPreview(); os.fmRenderRecommendations();
        if (window.lucide) lucide.createIcons({ root: document.getElementById('filemanager-root') });
    },

    fmQuickLook: () => {
        const file = os.fmFindById(os.filemanager.activeFileId); if (!file) return;
        const modal = document.getElementById('fm-quicklook-modal'); const title = document.getElementById('fm-ql-title'); const body = document.getElementById('fm-ql-body');
        if (!modal || !body) return;
        if (title) title.innerText = file.name;
        const media = file.imageUrl
            ? `<img src="${os.fmEscape(file.imageUrl)}" class="w-full max-h-[50vh] object-contain bg-black rounded-xl border border-white/10" referrerpolicy="no-referrer" alt="${os.fmEscape(file.originalName || file.name)}">`
            : '';
        body.innerHTML = `<div class="space-y-4">${media}<div class="text-white text-lg font-display font-bold">${os.fmEscape(file.name)}</div><pre class="text-gray-200 leading-relaxed select-text whitespace-pre-wrap font-mono text-xs bg-black/40 p-4 rounded-xl border border-white/10">${os.fmEscape(file.content || '')}</pre></div>`;
        modal.classList.remove('hidden'); modal.classList.add('flex');
        if (window.lucide) lucide.createIcons({ root: modal });
    },

    fmOpenNode: (id) => {
        const node = os.fmFindById(id);
        if (!node) return;
        return node.kind === 'folder' ? os.fmOpenPath(node.path) : os.fmOpenFile(node.id);
    },

    switchAboutTab: tab => window.AetherAbout?.show(tab),
    aboutSearch: query => window.AetherAbout?.search(query),

    wikiboard: {
                engine: null
            },

    initWikiBoard: () => {
                if (!os.wikiboard.engine) {
                    os.wikiboard.engine = new WikiBoardEngine();
                }
                os.wikiboard.engine.init();
                os.wikiboard.engine.loadState();
            },

    killWikiBoard: () => {
                if (os.wikiboard.engine) {
                    os.wikiboard.engine.destroy();
                    os.wikiboard.engine = null;
                }
            }
});
