// AetherOS — Entity Scanner, File Manager, Encrypted Notes, System Encyclopedia (About) & WikiBoard Hooks
window.extendOS({
    entityscanner: {
                currentTab: 'stats',
                scalingMode: 'balanced', // 'balanced' or 'true'
                scannedEntities: {}, // cache
                presets: {
                    goku: { id: 1, type: 'db' },
                    vegeta: { id: 2, type: 'db' },
                    mewtwo: { id: 'mewtwo', type: 'pokemon' },
                    pikachu: { id: 'pikachu', type: 'pokemon' }
                },
                activeLeft: null,
                activeRight: null,
                combatTimer: null,
                interceptsTimer: null,
                interceptPhrases: [
                    "[ALERT] Saiyan space pods detected entering Kanto airspace.",
                    "[SCAN] Extreme Ki signature detected near Pallet Town.",
                    "[INFO] Master Ball containment field failing under telepathic load.",
                    "[ALARM] Frieza Force scout ships deploying near Cinnabar Island.",
                    "[DETECTION] Dragon Ball radar matching high-energy signature of GS-03.",
                    "[ALERT] Mewtwo energy spike detected in West City.",
                    "[SCAN] Majin Buu candy transmutation waves detected in Mt. Moon.",
                    "[INFO] Rayquaza airspace intrusion detected above Korin Tower.",
                    "[ALERT] Lord Beerus seen eating pancakes at a Saffron City café.",
                    "[SCAN] Cell Games arena broadcast intercepted near Indigo Plateau.",
                    "[ALERT] Frieza detected near Kanto region. Threat level: Planet Buster",
                    "[ALARM] Mewtwo and Frieza power levels colliding in Route 12."
                ]
            },

    initEntityScanner: () => {
                os.logTerminal('Scouter: Initializing scouter lens overlay systems...');
                os.switchScannerTab('stats');
                os.populateCombatSelectors();
                
                const leftSel = document.getElementById('combat-fighter-left');
                const rightSel = document.getElementById('combat-fighter-right');
                if (leftSel) leftSel.value = 'goku';
                if (rightSel) rightSel.value = 'pikachu';
                os.updateCombatFighter('left');
                os.updateCombatFighter('right');

                const sweepBar = document.getElementById('scanner-sweep-bar');
                if (sweepBar) {
                    gsap.fromTo(sweepBar, 
                        { top: '0%' },
                        { top: '100%', duration: 2.0, repeat: -1, yoyo: true, ease: 'sine.inOut' }
                    );
                }

                os.setScannerPreset('goku');
                os.runScannerInterceptLoop();
            },

    killEntityScanner: () => {
                if (os.entityscanner.combatTimer) {
                    clearInterval(os.entityscanner.combatTimer);
                    os.entityscanner.combatTimer = null;
                }
                if (os.entityscanner.interceptsTimer) {
                    clearInterval(os.entityscanner.interceptsTimer);
                    os.entityscanner.interceptsTimer = null;
                }
                os.logTerminal('Scouter: Scouter lens powered down safely.');
            },

    switchScannerTab: (tabId) => {
                os.entityscanner.currentTab = tabId;
                
                const tabs = ['stats', 'evolution', 'combat', 'intercepts'];
                tabs.forEach(t => {
                    const view = document.getElementById(`scanner-tab-view-${t}`);
                    const btn = document.getElementById(`scan-tab-${t}`);
                    if (view) {
                        if (t === tabId) view.classList.remove('hidden');
                        else view.classList.add('hidden');
                    }
                    if (btn) {
                        if (t === tabId) {
                            btn.className = "hover-target cursor-none text-green-400 font-bold border-b border-green-400 pb-0.5 uppercase tracking-wider text-[9px]";
                        } else {
                            btn.className = "hover-target cursor-none text-gray-500 hover:text-white uppercase tracking-wider text-[9px]";
                        }
                    }
                });
                
                if (tabId === 'intercepts') {
                    const stream = document.getElementById('scanner-intercepts-stream');
                    if (stream && stream.children.length === 0) {
                        for(let i=0; i<4; i++) {
                            const phrase = os.entityscanner.interceptPhrases[Math.floor(Math.random() * os.entityscanner.interceptPhrases.length)];
                            os.addScannerIntercept(phrase, Math.random() > 0.5 ? 'ALERT' : 'SCAN');
                        }
                    }
                }
            },

    runEntityScan: async () => {
                const input = document.getElementById('scanner-search-input');
                if (!input) return;
                const query = input.value.trim().toLowerCase();
                if (!query) return;

                os.logTerminal(`Scouter: Intercepting biological frequency matching keyword "${query}"`);
                
                const lockLbl = document.getElementById('scanner-lock-lbl');
                if (lockLbl) {
                    lockLbl.innerText = 'SCANNING...';
                    lockLbl.className = 'absolute bottom-2 left-2 px-1.5 py-0.5 bg-yellow-950/80 border border-yellow-500/40 text-[8px] text-yellow-400 font-bold tracking-widest uppercase rounded animate-pulse';
                }

                try {
                    const dbUrl = `https://dragonball-api.com/api/characters?name=${query}`;
                    const resDb = await fetch(dbUrl);
                    if (resDb.ok) {
                        const arr = await resDb.json();
                        if (arr && arr.length > 0) {
                            const fullRes = await fetch(`https://dragonball-api.com/api/characters/${arr[0].id}`);
                            const fullData = await fullRes.json();
                            
                            const entity = {
                                type: 'db',
                                id: fullData.id,
                                name: fullData.name,
                                image: fullData.image,
                                race: fullData.race,
                                gender: fullData.gender,
                                baseKi: fullData.ki,
                                maxKi: fullData.maxKi,
                                affiliation: fullData.affiliation,
                                description: fullData.description,
                                planet: fullData.originPlanet?.name || "Unknown Planet",
                                transformations: fullData.transformations || []
                            };

                            os.entityscanner.scannedEntities[query] = entity;
                            os.renderEntityStats(entity);
                            os.logTerminal(`Scouter: Bio-scan complete. Goku/Saiyan signature LOCKED on target "${entity.name}".`);
                            return;
                        }
                    }

                    const pokeUrl = `https://pokeapi.co/api/v2/pokemon/${query}`;
                    const resPoke = await fetch(pokeUrl);
                    if (resPoke.ok) {
                        const pokeData = await resPoke.json();
                        
                        let descText = "Target exhibits highly complex biological and elemental parameters.";
                        let evolutionChainUrl = "";
                        try {
                            const specRes = await fetch(pokeData.species.url);
                            if (specRes.ok) {
                                const specData = await specRes.json();
                                evolutionChainUrl = specData.evolution_chain?.url || "";
                                const entry = specData.flavor_text_entries.find(e => e.language.name === 'en');
                                if (entry) descText = entry.flavor_text.replace(/\f/g, ' ');
                            }
                        } catch(e) {}

                        const entity = {
                            type: 'pokemon',
                            id: pokeData.id,
                            name: pokeData.name.toUpperCase(),
                            image: pokeData.sprites.other['official-artwork'].front_default || pokeData.sprites.front_default,
                            height: pokeData.height,
                            weight: pokeData.weight,
                            abilities: pokeData.abilities.map(a => a.ability.name.toUpperCase()),
                            types: pokeData.types.map(t => t.type.name.toUpperCase()),
                            stats: pokeData.stats.map(s => ({ name: s.stat.name.toUpperCase(), val: s.base_stat })),
                            description: descText,
                            evolutionChainUrl: evolutionChainUrl
                        };

                        os.entityscanner.scannedEntities[query] = entity;
                        os.renderEntityStats(entity);
                        os.logTerminal(`Scouter: Bio-scan complete. Pocket Monster index match: Target "${entity.name}" LOCKED.`);
                        return;
                    }

                    if (lockLbl) {
                        lockLbl.innerText = 'SIGNAL_LOST';
                        lockLbl.className = 'absolute bottom-2 left-2 px-1.5 py-0.5 bg-red-950/80 border border-red-500/40 text-[8px] text-red-500 font-bold tracking-widest uppercase rounded';
                    }
                    os.logTerminal(`Scouter Error: Targeted entity frequency "${query}" cannot be resolved in database grids.`);
                } catch(e) {
                    os.logTerminal(`Scouter Error: Spectral alignment block. ${e.message}`);
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
                const nameEl = document.getElementById('scanner-name');
                const metaEl = document.getElementById('scanner-meta-affiliation');
                const imgEl = document.getElementById('scanner-entity-img');
                const lockLbl = document.getElementById('scanner-lock-lbl');
                const ratingLbl = document.getElementById('scanner-rating-lbl');
                const spectralLbl = document.getElementById('scanner-spectral-lbl');
                const dangerClass = document.getElementById('scanner-danger-class');
                const statsMatrix = document.getElementById('scanner-stat-matrix');
                const assessment = document.getElementById('scanner-assessment');

                if (nameEl) nameEl.innerText = entity.name;
                if (imgEl) imgEl.src = entity.image;

                if (lockLbl) {
                    lockLbl.innerText = 'LOCK_ACQUIRED';
                    lockLbl.className = 'absolute bottom-2 left-2 px-1.5 py-0.5 bg-green-950/80 border border-green-500/40 text-[8px] text-green-400 font-bold tracking-widest uppercase rounded';
                }

                if (entity.type === 'db') {
                    if (metaEl) metaEl.innerText = `${entity.affiliation} // ${entity.race}`;
                    if (spectralLbl) spectralLbl.innerText = `KI_RESONANCE_OK`;
                    
                    let threat = "PLANET BUSTER";
                    let threatClass = "bg-red-950/40 border border-red-500/30 text-red-400";
                    let rating = "CLASS SSS";

                    if (entity.name === 'Goku' || entity.name === 'Vegeta' || entity.name === 'Gohan') {
                        threat = "UNIVERSE BREAKER";
                        rating = "CLASS GOD";
                        threatClass = "bg-purple-950/40 border border-purple-500/30 text-purple-400 animate-pulse";
                    } else if (entity.name === 'Frieza' || entity.name === 'Cell' || entity.name === 'Majin Buu' || entity.name === 'Broly') {
                        threat = "PLANET ERADICATOR";
                        rating = "CLASS SSS";
                        threatClass = "bg-red-950/50 border border-red-500/40 text-red-400 animate-pulse";
                    } else if (entity.name === 'Krilin' || entity.name === 'Yamcha' || entity.name === 'Bulma') {
                        threat = "MODERATE THREAT";
                        rating = "CLASS A";
                        threatClass = "bg-yellow-950/40 border border-yellow-500/30 text-yellow-400";
                    }

                    if (dangerClass) {
                        dangerClass.innerText = threat;
                        dangerClass.className = `text-[9px] font-bold px-2 py-0.5 rounded tracking-widest uppercase ${threatClass}`;
                    }
                    if (ratingLbl) ratingLbl.innerText = rating;

                    if (statsMatrix) {
                        statsMatrix.innerHTML = `
                            <div class="bg-black/40 border border-white/5 p-2 rounded relative">
                                <div class="text-[8px] text-os-accent uppercase">Base KI Power</div>
                                <div class="text-white font-bold font-mono mt-1 text-[11px]">${entity.baseKi}</div>
                            </div>
                            <div class="bg-black/40 border border-white/5 p-2 rounded relative">
                                <div class="text-[8px] text-os-accent uppercase">Apex KI limit</div>
                                <div class="text-white font-bold font-mono mt-1 text-[11px]">${entity.maxKi}</div>
                            </div>
                            <div class="bg-black/40 border border-white/5 p-2 rounded relative">
                                <div class="text-[8px] text-os-accent uppercase">Origin Planet</div>
                                <div class="text-white font-bold mt-1 text-[10px] truncate">${entity.planet}</div>
                            </div>
                            <div class="bg-black/40 border border-white/5 p-2 rounded relative">
                                <div class="text-[8px] text-os-accent uppercase">Sub-Species</div>
                                <div class="text-white font-bold mt-1 text-[10px] truncate">${entity.race}</div>
                            </div>
                        `;
                    }
                    if (assessment) assessment.innerText = entity.description || "No tactical files on ship records.";
                    
                    os.renderEvolutionChain(entity);

                } else if (entity.type === 'pokemon') {
                    const primaryType = entity.types[0] || 'NORMAL';
                    if (metaEl) metaEl.innerText = `POCKET MONSTER // TYPE ${entity.types.join(' & ')}`;
                    if (spectralLbl) spectralLbl.innerText = `${primaryType}_ELEMENTAL`;

                    const statsSum = entity.stats.reduce((acc, s) => acc + s.val, 0);
                    let threat = "TRIVIAL LEVEL";
                    let threatClass = "bg-green-950/40 border border-green-500/30 text-green-400";
                    let rating = "CLASS C";

                    if (statsSum > 580) {
                        threat = "EXTINCTION THREAT";
                        rating = "CLASS SSS";
                        threatClass = "bg-red-950/40 border border-red-500/30 text-red-400 animate-pulse";
                    } else if (statsSum > 480) {
                        threat = "REGIONAL HAZARD";
                        rating = "CLASS S";
                        threatClass = "bg-orange-950/40 border border-orange-500/30 text-orange-400";
                    } else if (statsSum > 350) {
                        threat = "LOCAL CAUTION";
                        rating = "CLASS B";
                        threatClass = "bg-yellow-950/40 border border-yellow-500/30 text-yellow-400";
                    }

                    if (dangerClass) {
                        dangerClass.innerText = threat;
                        dangerClass.className = `text-[9px] font-bold px-2 py-0.5 rounded tracking-widest uppercase ${threatClass}`;
                    }
                    if (ratingLbl) ratingLbl.innerText = rating;

                    if (statsMatrix) {
                        let html = '';
                        entity.stats.slice(0,4).forEach(s => {
                            html += `
                                <div class="bg-black/40 border border-white/5 p-2 rounded relative">
                                    <div class="text-[8px] text-os-accent uppercase">${s.name}</div>
                                    <div class="flex items-center justify-between mt-1 gap-1">
                                        <span class="text-white font-bold font-mono text-[11px]">${s.val}</span>
                                        <div class="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                            <div class="h-full bg-green-400" style="width: ${Math.min(100, (s.val/160)*100)}%;"></div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        statsMatrix.innerHTML = html;
                    }
                    if (assessment) {
                        assessment.innerText = `Pokédex files retrieved: ${entity.description} Abilities cataloged: ${entity.abilities.join(', ')}. Height: ${entity.height / 10}m, Weight: ${entity.weight / 10}kg.`;
                    }

                    os.renderEvolutionChain(entity);
                }
            },

    renderEvolutionChain: async (entity) => {
                const container = document.getElementById('scanner-evolution-chain');
                if (!container) return;

                container.innerHTML = `<div class="text-center py-6 text-gray-500 animate-pulse text-[10px]">Tuning metamorphic paths...</div>`;

                if (entity.type === 'db') {
                    if (entity.transformations.length === 0) {
                        container.innerHTML = `
                            <div class="py-6 text-center text-gray-500 border border-white/5 bg-black/20 rounded-lg text-[9px] uppercase">
                                METAMORPHIC CHAINS RESOLVED: NO RECORDED RE-FORMS OR TRANSFORMATIONS.
                            </div>
                        `;
                        return;
                    }

                    let html = '';
                    entity.transformations.forEach(tr => {
                        html += `
                            <div class="bg-black/35 border border-white/5 rounded-lg p-2 flex gap-3 shadow-os-recessed items-center">
                                <div class="w-10 h-10 rounded bg-os-800 flex-shrink-0 relative overflow-hidden flex items-center justify-center border border-white/10">
                                    <img src="${tr.image}" class="w-full h-full object-cover">
                                </div>
                                <div class="overflow-hidden flex-1 space-y-0.5">
                                    <div class="text-[8px] text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                        <i data-lucide="zap" class="w-3 h-3"></i> TRANSFORM SEQUENCE ACTIVE
                                    </div>
                                    <div class="text-white font-bold truncate text-[10px]">${tr.name}</div>
                                    <div class="text-[8px] text-gray-500 truncate uppercase">KI LEVEL MULTIPLIER: <span class="text-white font-mono font-bold">${tr.ki}</span></div>
                                </div>
                            </div>
                        `;
                    });
                    container.innerHTML = html;
                    lucide.createIcons({ root: container });

                } else if (entity.type === 'pokemon') {
                    if (!entity.evolutionChainUrl) {
                        container.innerHTML = `
                            <div class="py-6 text-center text-gray-500 border border-white/5 bg-black/20 rounded-lg text-[9px] uppercase">
                                EVOLVING PROFILE RESOLVED: STANDALONE NON-EVOLVER SPECIMEN.
                            </div>
                        `;
                        return;
                    }

                    try {
                        const res = await fetch(entity.evolutionChainUrl);
                        if (!res.ok) throw new Error('CORS block or API limit');
                        const data = await res.json();
                        
                        const chain = [];
                        let ptr = data.chain;
                        while(ptr) {
                            chain.push(ptr.species.name);
                            ptr = ptr.evolves_to[0]; 
                        }

                        let html = '';
                        for (let i = 0; i < chain.length; i++) {
                            const name = chain[i];
                            const capName = name.toUpperCase();
                            const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${i === 0 ? entity.id : entity.id+i}.png`;
                            
                            html += `
                                <div class="bg-black/35 border border-white/5 rounded-lg p-2 flex gap-3 shadow-os-recessed items-center hover-target cursor-none" onclick="os.setScannerPreset('${name}')">
                                    <div class="w-10 h-10 rounded-full bg-os-800 flex-shrink-0 relative overflow-hidden flex items-center justify-center border border-white/10">
                                        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${entity.id}.png" class="w-8 h-8 object-contain" onerror="this.src='${spriteUrl}'">
                                    </div>
                                    <div class="overflow-hidden flex-1 space-y-0.5">
                                        <div class="text-[8px] text-green-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                            <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span> STAGE 0${i+1} PHENOTYPE
                                        </div>
                                        <div class="text-white font-bold truncate text-[10px]">${capName}</div>
                                        <div class="text-[8px] text-gray-500 truncate uppercase">Click target node to lock scouter</div>
                                    </div>
                                </div>
                            `;
                        }
                        container.innerHTML = html;
                    } catch(e) {
                        container.innerHTML = `
                            <div class="py-6 text-center text-yellow-500 border border-white/5 bg-black/20 rounded-lg text-[9px] uppercase">
                                Evolution API endpoint rate limited. Standalone fallback applied.
                            </div>
                        `;
                    }
                }
            },

    toggleCombatScaling: () => {
                const cur = os.entityscanner.scalingMode;
                os.entityscanner.scalingMode = cur === 'balanced' ? 'true' : 'balanced';
                
                const btn = document.getElementById('btn-combat-scale');
                if (btn) {
                    btn.innerText = os.entityscanner.scalingMode.toUpperCase();
                }
                os.logTerminal(`Scouter: Fight Simulator power scaling changed to ${os.entityscanner.scalingMode.toUpperCase()}`);
            },

    populateCombatSelectors: () => {
                const left = document.getElementById('combat-fighter-left');
                const right = document.getElementById('combat-fighter-right');
                if (!left || !right) return;

                const options = `
                    <optgroup label="Dragon Ball">
                        <option value="goku">Son Goku (Saiyan)</option>
                        <option value="vegeta">Prince Vegeta (Saiyan)</option>
                        <option value="frieza">Frieza (Tyrant)</option>
                        <option value="cell">Perfect Cell (Android)</option>
                    </optgroup>
                    <optgroup label="Pokémon">
                        <option value="pikachu">Pikachu (Electric)</option>
                        <option value="mewtwo">Mewtwo (Psychic)</option>
                        <option value="charizard">Charizard (Fire/Dragon)</option>
                        <option value="rayquaza">Rayquaza (Dragon/Flying)</option>
                    </optgroup>
                `;

                left.innerHTML = options;
                right.innerHTML = options;
            },

    updateCombatFighter: (side) => {
                const select = document.getElementById(`combat-fighter-${side}`);
                const nameLabel = document.getElementById(`combat-${side}-name`);
                
                if (select && nameLabel) {
                    nameLabel.innerText = select.options[select.selectedIndex].text;
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

                const leftId = leftSelect.value;
                const rightId = rightSelect.value;

                log.innerHTML = `<div class="text-[9px] text-green-500 animate-pulse">// INITIALIZING SCU_COMBAT MATRIX PROTOCOLS...</div>`;

                const fighters = {
                    goku:      { name: 'Son Goku', hp: 500000, atk: 9000000, speed: 200, isDB: true, move: 'Kamehameha' },
                    vegeta:    { name: 'Prince Vegeta', hp: 480000, atk: 8500000, speed: 190, isDB: true, move: 'Final Flash' },
                    frieza:    { name: 'Frieza', hp: 450000, atk: 8000000, speed: 180, isDB: true, move: 'Death Ball' },
                    cell:      { name: 'Perfect Cell', hp: 400000, atk: 7500000, speed: 170, isDB: true, move: 'Special Beam Cannon' },
                    pikachu:   { name: 'Pikachu', hp: 350, atk: 55, speed: 90, isDB: false, move: 'Thunderbolt' },
                    mewtwo:    { name: 'Mewtwo', hp: 1060, atk: 1100, speed: 130, isDB: false, move: 'Psystrike' },
                    charizard: { name: 'Charizard', hp: 780, atk: 840, speed: 100, isDB: false, move: 'Blast Burn' },
                    rayquaza:  { name: 'Rayquaza', hp: 1050, atk: 1500, speed: 115, isDB: false, move: 'Draco Meteor' }
                };

                const f1 = { ...fighters[leftId] };
                const f2 = { ...fighters[rightId] };

                if (os.entityscanner.scalingMode === 'balanced') {
                    if (f1.isDB) { f1.hp = 180; f1.atk = 24; } else { f1.hp = 120; f1.atk = 18; }
                    if (f2.isDB) { f2.hp = 180; f2.atk = 24; } else { f2.hp = 120; f2.atk = 18; }
                }

                const maxHp1 = f1.hp;
                const maxHp2 = f2.hp;

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
                const logs = [
                    `[COMBAT] Scouter locked on f1 (${f1.name}) and f2 (${f2.name}).`,
                    `[COMBAT] Scale matrix set to ${os.entityscanner.scalingMode.toUpperCase()}`
                ];

                const runStep = () => {
                    step++;
                    if (f1.hp <= 0 || f2.hp <= 0) {
                        clearInterval(os.entityscanner.combatTimer);
                        os.entityscanner.combatTimer = null;
                        
                        const winner = f1.hp > 0 ? f1.name : f2.name;
                        logs.push(`[MATRIX_VICTORY] Target "${winner}" has neutralized opposition forces.`);
                        log.innerHTML = logs.map(l => `<div>${l}</div>`).join('');
                        log.scrollTop = log.scrollHeight;
                        return;
                    }

                    const turn = (step % 2 === 1) ? 'left' : 'right';
                    
                    if (turn === 'left') {
                        const crit = Math.random() > 0.85;
                        const dmgMultiplier = crit ? 1.8 : (0.85 + Math.random() * 0.3);
                        const dmg = Math.round(f1.atk * dmgMultiplier);
                        f2.hp -= dmg;
                        if (f2.hp < 0) f2.hp = 0;
                        logs.push(`[${f1.name.toUpperCase()}] launches a shattering ${f1.move}! ${crit ? 'CRITICAL STRIKE! ' : ''}Deals ${dmg.toLocaleString()} impact.`);
                    } else {
                        const crit = Math.random() > 0.85;
                        const dmgMultiplier = crit ? 1.8 : (0.85 + Math.random() * 0.3);
                        const dmg = Math.round(f2.atk * dmgMultiplier);
                        f1.hp -= dmg;
                        if (f1.hp < 0) f1.hp = 0;
                        logs.push(`[${f2.name.toUpperCase()}] unleashes elemental ${f2.move}! ${crit ? 'SUPERCHARGED STRIKE! ' : ''}Deals ${dmg.toLocaleString()} impact.`);
                    }

                    updateHpBars();
                    log.innerHTML = logs.map(l => `<div>${l}</div>`).join('');
                    log.scrollTop = log.scrollHeight;
                };

                os.entityscanner.combatTimer = setInterval(runStep, 1000);
            },

    addScannerIntercept: (msg, type = 'ALERT') => {
                const stream = document.getElementById('scanner-intercepts-stream');
                if (!stream) return;

                if (stream.children.length > 30) stream.removeChild(stream.lastChild);

                const el = document.createElement('div');
                const isAlert = type === 'ALERT';
                el.className = `p-2 rounded border ${isAlert ? 'border-red-500/10 bg-red-950/10 text-red-400' : 'border-green-500/10 bg-green-950/10 text-green-400'} flex gap-2 items-start shadow-inner text-[9px] mb-2`;
                el.innerHTML = `
                    <span class="font-bold shrink-0">[${type}]</span>
                    <span class="flex-1">${msg}</span>
                    <span class="text-os-accent text-[8px] shrink-0">${new Date().toLocaleTimeString()}</span>
                `;
                stream.prepend(el);
            },

    runScannerInterceptLoop: () => {
                if (os.entityscanner.interceptsTimer) {
                    clearInterval(os.entityscanner.interceptsTimer);
                }

                const triggerLog = () => {
                    const stream = document.getElementById('scanner-intercepts-stream');
                    if (!stream) return;

                    const phrase = os.entityscanner.interceptPhrases[Math.floor(Math.random() * os.entityscanner.interceptPhrases.length)];
                    const isAlert = phrase.includes('ALERT') || phrase.includes('ALARM') || Math.random() > 0.6;
                    os.addScannerIntercept(phrase, isAlert ? 'ALERT' : 'SCAN');
                };

                os.entityscanner.interceptsTimer = setInterval(triggerLog, 8000 + Math.random() * 4000);
            },

    filemanager: {
                currentPath: '/Archive',
                currentTab: 'all',
                activeFileId: 'wf-wiki-files',
                query: '',
                history: [],
                tabs: [
                    { id: 'all', label: 'All Files', icon: 'sparkles' },
                    { id: 'wiki', label: 'Wiki', icon: 'file-text' },
                    { id: 'entity', label: 'Entities', icon: 'scan' },
                    { id: 'media', label: 'Media', icon: 'image' },
                    { id: 'note', label: 'Notes', icon: 'notebook' }
                ],
                data: {
                    id: 'root', name: 'Archive', kind: 'folder', path: '/Archive', signal: 'ROOT', children: [
                        { id: 'fld-wiki', name: 'Wiki Files', kind: 'folder', path: '/Archive/Wiki Files', signal: 'LIVE', children: [
                            { id: 'wf-wiki-files', name: 'Neal.fun Wiki Files.wiki', kind: 'wiki', path: '/Archive/Wiki Files/Neal.fun Wiki Files.wiki', signal: '98%', size: '3.7 MB', modified: '2026-05-25', icon: 'file-text', tags: ['wikipedia','archive','rabbit-hole'], related: ['wf-depths','en-liminal','note-index'], refs: ['List of unusual articles','Taxonomy of links','Hidden image captions'], content: 'A playful archive dossier inspired by Wiki Files. It treats Wikipedia pages as found objects: captions, redirects, bizarre categories, orphan pages, and tiny citations become explorable files instead of flat links.' },
                            { id: 'wf-depths', name: 'Depths of Wikipedia.index', kind: 'wiki', path: '/Archive/Wiki Files/Depths of Wikipedia.index', signal: '92%', size: '2.1 MB', modified: '2026-05-24', icon: 'book-open', tags: ['depths','curiosity','concept-map'], related: ['wf-wiki-files','en-recursion','md-rabbit'], refs: ['Category:Obscure history','Recursive portals','Footnote chains'], content: 'A curated dive map for strange, overlooked, emotional, and unexpectedly cinematic encyclopedia entries. Opening it exposes deeper paths, similar files, and connected cultural entities.' },
                            { id: 'md-rabbit', name: 'Rabbit Hole Protocol.md', kind: 'note', path: '/Archive/Wiki Files/Rabbit Hole Protocol.md', signal: '87%', size: '14 KB', modified: '2026-05-22', icon: 'notebook', tags: ['method','research'], related: ['wf-depths','note-index','en-recursion'], refs: ['Click trail entropy','Serendipity budget'], content: 'Protocol: start with one article, follow one reference, one image, one category, and one external citation. Record every unexpected entity surfaced by the archive intelligence layer.' }
                        ]},
                        { id: 'fld-entities', name: 'Entity Files', kind: 'folder', path: '/Archive/Entity Files', signal: 'SYNC', children: [
                            { id: 'en-liminal', name: 'Liminal Space.entity', kind: 'entity', path: '/Archive/Entity Files/Liminal Space.entity', signal: '91%', size: '812 KB', modified: '2026-05-23', icon: 'scan', tags: ['architecture','internet folklore','aesthetic'], related: ['wf-wiki-files','med-backrooms','note-index'], refs: ['Non-place','Nostalgia','Threshold psychology'], content: 'Entity profile for places that feel transitional, empty, and charged with memory. Connected media shows fluorescent halls, pools, malls, hotel corridors, and dreamlike public interiors.' },
                            { id: 'en-recursion', name: 'Recursive Archive.entity', kind: 'entity', path: '/Archive/Entity Files/Recursive Archive.entity', signal: '99%', size: '1.2 MB', modified: '2026-05-25', icon: 'boxes', tags: ['nested','orteil','systems'], related: ['wf-depths','md-rabbit','med-map'], refs: ['Nested objects','Self-similar directories','Infinite zoom'], content: 'An entity describing folders that contain ideas about folders. Inspired by nested interfaces and encyclopedia traversal, it models every file as a door into another shelf.' }
                        ]},
                        { id: 'fld-media', name: 'Media Fragments', kind: 'folder', path: '/Archive/Media Fragments', signal: 'CACHE', children: [
                            { id: 'med-map', name: 'Explorer Map.media', kind: 'media', path: '/Archive/Media Fragments/Explorer Map.media', signal: '83%', size: '9.4 MB', modified: '2026-05-21', icon: 'image', tags: ['samismith','map','interface'], related: ['en-recursion','wf-depths','med-backrooms'], refs: ['Spatial browsing','Preview tiles','Constellation panels'], content: 'A visual reference file for cinematic map-like browsing. This module uses the feeling, but remains a real file manager: folders, breadcrumbs, lists, preview panes, and metadata.' },
                            { id: 'med-backrooms', name: 'Backrooms Still 07.media', kind: 'media', path: '/Archive/Media Fragments/Backrooms Still 07.media', signal: '76%', size: '5.8 MB', modified: '2026-05-20', icon: 'image', tags: ['liminal','analog','yellow'], related: ['en-liminal','wf-wiki-files'], refs: ['Fluorescent hum','Procedural rooms'], content: 'A cached image dossier represented as metadata and generative preview blocks. It cross-links to liminal spaces, internet folklore, and knowledge rabbit holes.' }
                        ]},
                        { id: 'fld-notes', name: 'Research Notes', kind: 'folder', path: '/Archive/Research Notes', signal: 'LOCAL', children: [
                            { id: 'note-index', name: 'Living Archive Notes.txt', kind: 'note', path: '/Archive/Research Notes/Living Archive Notes.txt', signal: '94%', size: '28 KB', modified: '2026-05-25', icon: 'file-pen', tags: ['design','operating-system','knowledge'], related: ['wf-wiki-files','en-liminal','med-map'], refs: ['Finder metaphor','Smart recommendations','Knowledge OS'], content: 'Design note: opening a file should feel like an intelligence system waking up around it. Related entities, references, similar files, history, and rabbit holes should surface automatically.' }
                        ]}
                    ]
                }
            },

    initFileManager: () => {
                os.logTerminal('Living Archive: Mounted knowledge file system and relationship index.');
                if (window.AetherVFS) {
                    window.AetherVFS.getAllFiles().then(() => {
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
                if (el) el.innerHTML = live ? `<span class="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse"></span> ${os.fmEscape(msg)}` : `<span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> ${os.fmEscape(msg)}`;
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
                    const ext = (img.mime || '').split('/')[1] || 'img';
                    const name = `${os.fmRand(12)}.${ext.replace('jpeg','jpg')}`;
                    return { id:`wiki-img-${slug}-${idx}-${os.fmRand(4)}`, name, originalName:img.title, kind:'media', path:`${folder.path}/${name}`, signal:'IMG', size: img.size ? `${Math.round(img.size/1024)} KB` : 'remote', modified:new Date().toISOString().slice(0,10), icon:'image', imageUrl:img.url, originalUrl:img.original, mime:img.mime, width:img.width, height:img.height, tags:['wikipedia-image','randomized-name'], refs:[img.title], related:[summaryId], content:`Image extracted from the Wikipedia page "${actualTitle}". Original file: ${img.title}. Random local archive name: ${name}.` };
                });
                summary.related = [...linkFolders.slice(0,12).map(n => n.id), ...mediaFiles.slice(0,6).map(n => n.id)];
                folder.children = [summary, ...mediaFiles, ...linkFolders];
                folder.signal = `${folder.children.length} ITEMS`;
                folder.wikiLoaded = true;
                folder.wikiLazy = false;
                os.logTerminal(`Living Archive: Mounted "${actualTitle}" with ${uniqueLinks.length} link-folders and ${mediaFiles.length} media files.`);
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
                const file = os.fmFindById(os.filemanager.activeFileId) || os.fmFlatten().find(n => n.kind !== 'folder');
                if (!file) { el.innerHTML = '<div class="p-6 text-gray-600">Select a file or drop files onto the desktop to upload.</div>'; return; }
                const related = (file.related||[]).map(id => os.fmFindById(id)).filter(Boolean);
                const mediaBlock = file.imageUrl
                    ? `<div class="rounded-xl border border-white/10 bg-black/50 overflow-hidden"><img src="${os.fmEscape(file.imageUrl)}" class="w-full max-h-56 object-contain bg-black" alt="${os.fmEscape(file.originalName || file.name)}" referrerpolicy="no-referrer"><div class="px-3 py-2 text-[9px] text-gray-500 truncate">${os.fmEscape(file.originalName || file.imageUrl)}</div></div>`
                    : (file.audioUrl ? `<div class="rounded-xl border border-white/10 bg-black/50 p-3"><audio controls src="${os.fmEscape(file.audioUrl)}" class="w-full h-9"></audio></div>` : '');
                const source = file.sourceUrl ? `<a href="${os.fmEscape(file.sourceUrl)}" target="_blank" class="text-[9px] text-os-accent hover:text-white cursor-none hover-target">OPEN ORIGINAL SOURCE ↗</a>` : '';
                const canDevPad = ['markdown', 'text', 'code', 'json'].includes(file.kind) || (file.content && !file.imageUrl);
                const canDataLab = file.kind === 'json' || /\.(csv|tsv|json)$/i.test(file.name || '');
                const actionButtons = `
                    <div class="flex flex-wrap gap-1.5">
                        <button onclick="os.openQuickLook && os.openQuickLook('${file.id}')" class="px-2.5 py-1.5 rounded-lg bg-white/12 hover:bg-white/20 border border-white/20 text-[10px] text-white cursor-none hover-target">Quick Look (Space)</button>
                        ${canDevPad ? `<button onclick="window.AetherVFS ? AetherVFS.openInDevPad('${file.id}') : (os.openWindow('devpad'))" class="px-2.5 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/30 text-[10px] text-indigo-200 cursor-none hover-target">Open in Dev Studio</button>` : ''}
                        ${canDataLab ? `<button onclick="os.dataToolsOpenVfsFile && os.dataToolsOpenVfsFile('${file.id}')" class="px-2.5 py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 border border-teal-400/30 text-[10px] text-teal-200 cursor-none hover-target">Open in Data Lab</button>` : ''}
                        ${file.imageUrl ? `<button onclick="os.ppOpenVfsImage && os.ppOpenVfsImage('${file.id}')" class="px-2.5 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/30 text-[10px] text-purple-200 cursor-none hover-target">Edit in Photopea</button>` : ''}
                        ${file.imageUrl ? `<button onclick="os.imageLabOpenVfsFile && os.imageLabOpenVfsFile('${file.id}')" class="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-[10px] text-emerald-200 cursor-none hover-target">Compress / Edit</button>` : ''}
                        ${file.imageUrl ? `<button onclick="window.AetherVFS && AetherVFS.applyFileAsWallpaper('${file.id}')" class="px-2.5 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-[10px] text-sky-200 cursor-none hover-target">Set Wallpaper</button>` : ''}
                        ${(file.isVfs || file.vfsBacked) ? `<button onclick="window.AetherVFS && AetherVFS.downloadFile('${file.id}')" class="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-[10px] text-white cursor-none hover-target">Download</button>` : ''}
                        ${(file.isVfs || file.vfsBacked) ? `<button onclick="window.AetherVFS && AetherVFS.deleteFile('${file.id}')" class="px-2.5 py-1.5 rounded-lg bg-red-500/12 hover:bg-red-500/22 border border-red-400/25 text-[10px] text-red-300 cursor-none hover-target">Delete</button>` : ''}
                    </div>
                `;
                el.innerHTML = `<div class="p-4 space-y-4">
                    <div class="fm-preview-card fm-pulse-border rounded-2xl border border-white/10 p-4 overflow-hidden relative">
                        <div class="absolute right-4 top-4 w-24 h-24 rounded-full fm-mini-orbit opacity-50"></div>
                        <div class="w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center mb-4"><i data-lucide="${file.icon||'file'}" class="w-6 h-6 text-white"></i></div>
                        <div class="text-white text-lg font-display uppercase tracking-wider leading-tight pr-20">${os.fmEscape(file.name)}</div>
                        <div class="text-[9px] text-os-accent uppercase tracking-widest mt-1">${file.kind} · ${file.signal} · ${file.size || 'folder'}</div>${source}
                    </div>
                    ${actionButtons}
                    ${mediaBlock}
                    <div class="grid grid-cols-2 gap-2 text-[10px]">
                        <div class="fm-glass rounded-lg p-2"><div class="text-gray-600 uppercase text-[8px]">Modified</div><div class="text-gray-300">${file.modified || 'dynamic'}</div></div>
                        <div class="fm-glass rounded-lg p-2"><div class="text-gray-600 uppercase text-[8px]">References</div><div class="text-gray-300">${(file.refs||[]).length}</div></div>
                    </div>
                    <div><div class="text-[9px] uppercase tracking-widest text-os-accent mb-2">Quick Look Preview</div><p class="leading-relaxed text-gray-300 select-text whitespace-pre-wrap max-h-48 overflow-y-auto">${os.fmEscape(file.content || 'Folder node containing nested archive objects and relationship metadata.')}</p></div>
                    <div><div class="text-[9px] uppercase tracking-widest text-os-accent mb-2">Metadata Tags</div><div class="flex flex-wrap gap-1.5">${(file.tags||[]).map(t=>`<span class="fm-chip px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-300">#${os.fmEscape(t)}</span>`).join('') || '<span class="text-gray-600">No tags</span>'}</div></div>
                    <div><div class="text-[9px] uppercase tracking-widest text-os-accent mb-2">Relationship Explorer</div><div class="space-y-1.5">${related.map(r=>`<button onclick="os.fmJumpToRelated('${r.id}')" class="w-full fm-chip px-2 py-2 rounded border border-white/10 bg-white/5 text-left cursor-none hover-target flex items-center gap-2"><i data-lucide="${r.icon||'folder'}" class="w-3.5 h-3.5 text-os-accent"></i><span class="truncate text-white/80">${os.fmEscape(r.name)}</span><span class="ml-auto text-[8px] text-gray-500 uppercase">${r.kind}</span></button>`).join('') || '<div class="text-gray-600">Open a live wiki summary or drop local files onto the desktop.</div>'}</div></div>
                    <div><div class="text-[9px] uppercase tracking-widest text-os-accent mb-2">Extracted References</div><div class="space-y-1">${(file.refs||[]).slice(0,20).map(ref=>`<button onclick="os.fmWikiSearch('${os.fmEscape(ref).replace(/'/g,'\\&#39;')}')" class="w-full text-left px-2 py-1.5 rounded bg-black/35 border border-white/5 text-gray-400 hover:text-white hover:bg-white/5 cursor-none hover-target">↳ ${os.fmEscape(ref)}</button>`).join('') || '<div class="text-gray-600">No references extracted.</div>'}</div></div>
                </div>`;
                lucide.createIcons({ root: el });
            },

    fmQuickLook: () => {
                const file = os.fmFindById(os.filemanager.activeFileId); if (!file) return;
                const modal = document.getElementById('fm-quicklook-modal'); const title = document.getElementById('fm-ql-title'); const body = document.getElementById('fm-ql-body');
                if (!modal || !body) return;
                if (title) title.innerText = file.name;
                const media = file.imageUrl ? `<img src="${os.fmEscape(file.imageUrl)}" class="w-full max-h-[50vh] object-contain bg-black rounded-xl border border-white/10" referrerpolicy="no-referrer" alt="${os.fmEscape(file.originalName || file.name)}">` : `<div class="h-44 rounded-xl fm-preview-card border border-white/10 flex items-center justify-center relative overflow-hidden"><div class="absolute inset-0 fm-scanlines opacity-40"></div><i data-lucide="${file.icon||'file'}" class="w-16 h-16 text-white/70"></i></div>`;
                body.innerHTML = `<div class="space-y-4">${media}<div class="text-white text-xl font-display uppercase tracking-wider">${os.fmEscape(file.name)}</div><p class="text-gray-300 leading-relaxed select-text">${os.fmEscape(file.content||'')}</p><div class="grid grid-cols-3 gap-2 text-[10px] text-gray-400"><div class="fm-glass rounded p-2">TYPE<br><span class="text-white uppercase">${file.kind}</span></div><div class="fm-glass rounded p-2">SIGNAL<br><span class="text-white">${file.signal}</span></div><div class="fm-glass rounded p-2">LINKS<br><span class="text-white">${(file.related||[]).length}</span></div></div></div>`;
                modal.classList.remove('hidden'); modal.classList.add('flex'); lucide.createIcons({ root: modal });
            },

    fmOpenNode: (id) => {
                const node = os.fmFindById(id);
                if (!node) return;
                return node.kind === 'folder' ? os.fmOpenPath(node.path) : os.fmOpenFile(node.id);
            },

    fmRenderList: () => {
                const el = document.getElementById('fm-file-list'); if (!el) return;
                const q = os.filemanager.query;
                let items = q ? os.fmFlatten().filter(n => n.kind !== 'folder' && [n.name,n.kind,(n.tags||[]).join(' '),(n.refs||[]).join(' '),n.content,n.originalName].join(' ').toLowerCase().includes(q)) : os.fmChildrenForPath(os.filemanager.currentPath);
                if (os.filemanager.currentTab !== 'all') items = items.filter(n => n.kind === 'folder' || n.kind === os.filemanager.currentTab);
                const count = document.getElementById('fm-count-label'); if (count) count.innerText = `${items.length} objects`;
                if (!items.length) el.innerHTML = `<div class="h-full flex items-center justify-center text-gray-600 uppercase tracking-widest text-center px-6">No local objects match. Press Enter or Fetch Wiki to mount this query as a live Wikipedia folder.</div>`;
                else el.innerHTML = items.map(item => {
                    const isFolder = item.kind === 'folder';
                    const active = os.filemanager.activeFileId === item.id;
                    return `<button onclick="os.fmOpenNode('${item.id}')" ${!isFolder ? `onmousemove="os.fmHoverFile('${item.id}', event)" onmouseleave="os.fmHideHover()"` : ''} class="${isFolder?'fm-folder-row':'fm-file-row'} w-full grid grid-cols-[34px_1fr_95px_90px_82px] gap-2 items-center px-3 py-2.5 rounded-lg border ${active?'fm-active':'border-white/5 bg-white/[0.025] text-gray-300'} text-left cursor-none hover-target">
                        <span class="w-7 h-7 rounded-md bg-black/50 border border-white/10 flex items-center justify-center ${isFolder?'text-yellow-300':'text-white'}"><i data-lucide="${isFolder?'folder':(item.icon||'file')}" class="w-4 h-4"></i></span>
                        <span class="min-w-0"><span class="block truncate text-white/90">${os.fmEscape(item.name)}</span><span class="block truncate text-[9px] text-gray-600">${os.fmEscape(item.originalName || item.path)}</span></span>
                        <span class="uppercase text-[9px] text-gray-500">${item.kind}</span>
                        <span class="text-[9px] ${String(item.signal||'').includes('LIVE')||String(item.signal||'').includes('LINK')||String(item.signal||'').includes('IMG')?'text-green-400':'text-gray-400'}">${item.signal || '--'}</span>
                        <span class="text-[9px] text-os-accent">${(item.related||item.children||[]).length} links</span>
                    </button>`;
                }).join('');
                os.fmRenderPreview(); os.fmRenderRecommendations(); lucide.createIcons({ root: document.getElementById('filemanager-root') });
            },

    switchAboutTab: (tabId) => {
                const buttons = document.querySelectorAll('.about-tab');
                buttons.forEach(btn => {
                    btn.className = "about-tab w-full text-left px-2.5 py-1.5 rounded text-gray-500 hover:text-white hover:bg-white/5 transition-all hover-target cursor-none flex items-center gap-1.5";
                });
                const activeBtn = document.getElementById('tab-about-' + tabId);
                if (activeBtn) {
                    activeBtn.className = "about-tab active w-full text-left px-2.5 py-1.5 rounded text-white bg-white/10 hover-target cursor-none transition-all flex items-center gap-1.5";
                }
                
                const container = document.getElementById('about-panel-content');
                if (!container) return;
                
                container.innerHTML = os.aboutViews[tabId] || '';
                
                if (tabId === 'metrics') {
                    os.initAboutMetricsAnimation();
                } else if (tabId === 'architecture') {
                    os.initAboutArchitectureRelations();
                } else if (tabId === 'features') {
                    os.initAboutFeaturesAccordions();
                }
                
                lucide.createIcons({root: container});
            },

    initAboutMetricsAnimation: () => {
                const counters = document.querySelectorAll('.metric-counter');
                counters.forEach(counter => {
                    const target = parseInt(counter.getAttribute('data-target') || '0', 10);
                    const duration = 1200; // ms
                    const startTime = performance.now();
                    
                    const update = (now) => {
                        const elapsed = now - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        const current = Math.floor(progress * target);
                        counter.textContent = current.toLocaleString();
                        
                        const bar = document.getElementById('bar-' + counter.id);
                        if (bar) bar.style.width = (progress * 100) + '%';
                        
                        if (progress < 1) requestAnimationFrame(update);
                    };
                    requestAnimationFrame(update);
                });
            },

    initAboutArchitectureRelations: () => {
                const nodes = document.querySelectorAll('.arch-node');
                const textTitle = document.getElementById('arch-desc-title');
                const textDesc = document.getElementById('arch-desc-body');
                const textTech = document.getElementById('arch-desc-tech');
                
                const details = {
                    wm: {
                        title: "Window Manager",
                        tech: "GSAP (GreenSock) draggable, inertia, perspective timelines",
                        desc: "The 3D window compositor. Controls draggable states, smooth inertia snapping, Apple-style Genie animation minimize effects, Z-index stack sorting, focus highlights, and desktop scaling mechanics."
                    },
                    dock: {
                        title: "Dock System",
                        tech: "CSS layouts, Lucide icons, contextual event interceptors",
                        desc: "The dynamic launcher and shortcut bar. Seamlessly displays pinned favorites and active processes, rendering live active indicator LEDs, genie minimizes, and custom right-click utility context menus."
                    },
                    companion: {
                        title: "Companion (Jarvis Soul)",
                        tech: "SpeechSynthesis, sentiment analysis, multi-provider anime reaction APIs",
                        desc: "The living soul of AetherOS. A proactive background intelligence with lookup state history. Features look-at-cursor gaze tracking eyes, automated background events observation, and instant speech heartbeats."
                    },
                    wikiboard: {
                        title: "WikiBoard Canvas",
                        tech: "HTML5 Canvas viewport matrices, REST wiki APIs, SVG render layers",
                        desc: "An infinite canvas research ecosystem. Allows spawning connected Wikipedia cards, drawing flowing glowing connectors, and dispatching text notes straight into the central Scratchpad."
                    },
                    tracking: {
                        title: "Space & Radar Tracking",
                        tech: "Three.js WebGL renderer, Open-Meteo REST API, Leaflet tracking",
                        desc: "Handles geospatial trackers. Renders the 3D orbital space ISS station with live telemetry, passes overhead notices, and connects local climate stations to predict clear-sky flight observations."
                    },
                    terminal: {
                        title: "Data Stream Terminal",
                        tech: "HTML5 sandboxed sub-shells, secure REST APIs, CLI interpreters",
                        desc: "The centralized CLI hub. Allows executing system diagnostics, matrix rain rendering, network latency ping streams, and direct module triggers like 'wiki <topic>' commands."
                    },
                    diagnostics: {
                        title: "System Diagnostics",
                        tech: "Tuner volume decibel meters, WebSocket telemetry, resource counters",
                        desc: "Monitors overall workplace performance. Analyzes active windows counts, alerts users of thread budget stress, and coordinates speed pings and custom memory profile sweeps."
                    },
                    customization: {
                        title: "Customization Engine",
                        tech: "Sakura petal gravity arrays, Oneko pet sprite engines, custom canvas overlays",
                        desc: "Applies beautiful visual themes. Manages glowing neon parameters, coordinates background animated wallpapers, standard cursor overlay toggles, and direct custom cursor theme rendering."
                    }
                };
                
                nodes.forEach(node => {
                    node.addEventListener('mouseenter', () => {
                        const id = node.getAttribute('data-node');
                        const data = details[id];
                        if (!data) return;
                        
                        // Highlight SVG path lines
                        document.querySelectorAll('.arch-line').forEach(line => {
                            if (line.classList.contains('line-' + id)) {
                                line.style.stroke = 'var(--os-accent, #22d3ee)';
                                line.style.strokeWidth = '2.5px';
                                line.style.filter = 'drop-shadow(0 0 5px var(--os-accent, #22d3ee))';
                            } else {
                                line.style.stroke = 'rgba(255,255,255,0.06)';
                                line.style.strokeWidth = '1px';
                                line.style.filter = 'none';
                            }
                        });
                        
                        // Highlight Node border
                        nodes.forEach(n => n.classList.remove('border-cyan-400', 'bg-cyan-500/10'));
                        node.classList.add('border-cyan-400', 'bg-cyan-500/10');
                        
                        // Update Description Box
                        if (textTitle) textTitle.textContent = data.title;
                        if (textDesc) textDesc.textContent = data.desc;
                        if (textTech) textTech.textContent = data.tech;
                    });
                });
            },

    initAboutFeaturesAccordions: () => {
                const buttons = document.querySelectorAll('.wiki-accordion-btn');
                buttons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const parent = btn.parentElement;
                        const body = parent.querySelector('.wiki-accordion-body');
                        const icon = btn.querySelector('.accordion-icon');
                        
                        const isOpen = !body.classList.contains('hidden');
                        
                        // Close all
                        document.querySelectorAll('.wiki-accordion-body').forEach(b => b.classList.add('hidden'));
                        document.querySelectorAll('.accordion-icon').forEach(ic => { if (ic) ic.style.transform = 'rotate(0deg)'; });
                        
                        if (!isOpen) {
                            body.classList.remove('hidden');
                            if (icon) icon.style.transform = 'rotate(90deg)';
                        }
                    });
                });
            },

    aboutSearch: (q) => {
                const query = String(q || '').trim().toLowerCase();
                const container = document.getElementById('about-panel-content');
                if (!container) return;
                
                // Switch to Features Tab automatically to search inside the feature wiki!
                os.switchAboutTab('features');
                
                const accordions = document.querySelectorAll('.wiki-accordion-item');
                accordions.forEach(item => {
                    const text = item.textContent.toLowerCase();
                    const matches = text.includes(query);
                    item.style.display = matches ? '' : 'none';
                    
                    // Auto-open matched accordion
                    const body = item.querySelector('.wiki-accordion-body');
                    const icon = item.querySelector('.accordion-icon');
                    if (query && matches) {
                        body.classList.remove('hidden');
                        if (icon) icon.style.transform = 'rotate(90deg)';
                    } else if (!query) {
                        body.classList.add('hidden');
                        if (icon) icon.style.transform = 'rotate(0deg)';
                    }
                });
            },

    aboutViews: {
                overview: `
                    <div class="space-y-6">
                        <!-- Authentic macOS "About This Mac" Identity Card -->
                        <div class="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/[0.08] via-slate-900/70 to-black/80 border border-white/15 p-6 shadow-2xl flex flex-col sm:flex-row items-center gap-6">
                            <div class="w-24 h-24 rounded-3xl bg-white/[0.06] border border-white/15 flex items-center justify-center shrink-0 shadow-[0_0_40px_rgba(255,255,255,0.12)]">
                                <svg class="w-12 h-12 text-white drop-shadow-[0_0_14px_rgba(255,255,255,0.45)]" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
                                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                                </svg>
                            </div>
                            <div class="flex-1 text-center sm:text-left">
                                <div class="text-[10px] text-sky-300 tracking-[0.25em] font-bold uppercase">macOS Liquid Glass Edition</div>
                                <h1 class="text-3xl font-display font-semibold tracking-tight text-white mt-0.5">AetherOS Workstation</h1>
                                <div class="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 mt-3.5 text-[11px] text-gray-300">
                                    <div><span class="text-gray-500">Processor:</span> ${typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency + '-Core Silicon' : 'Apple Neural Engine'}</div>
                                    <div><span class="text-gray-500">Memory:</span> ${typeof navigator !== 'undefined' && navigator.deviceMemory ? navigator.deviceMemory + ' GB Unified' : '16 GB Unified'}</div>
                                    <div><span class="text-gray-500">Display:</span> ${typeof screen !== 'undefined' ? screen.width + ' × ' + screen.height : 'Retina Liquid Glass'}</div>
                                    <div><span class="text-gray-500">Apps Installed:</span> 50 Native Modules</div>
                                    <div><span class="text-gray-500">Spaces:</span> 3 Virtual Desktops</div>
                                    <div><span class="text-gray-500">Build:</span> 26A-LiquidGlass</div>
                                </div>
                                <div class="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
                                    <button type="button" onclick="os.openWindow('settings')" class="px-3.5 py-1.5 rounded-lg bg-white/12 hover:bg-white/20 border border-white/15 text-white text-[11px] font-sans font-medium hover-target cursor-none">System Settings...</button>
                                    <button type="button" onclick="os.openWindow('sysmon')" class="px-3.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/12 border border-white/10 text-gray-200 text-[11px] font-sans hover-target cursor-none">System Report...</button>
                                </div>
                            </div>
                        </div>

                        <!-- Core Grids -->
                        <div class="grid grid-cols-2 gap-4">
                            <!-- Vision Card -->
                            <div class="rounded-xl border border-white/5 bg-black/40 p-4 relative overflow-hidden">
                                <div class="flex items-center gap-2 text-white mb-2 font-bold uppercase text-[11px] tracking-wider text-cyan-400">
                                    <i data-lucide="eye" class="w-4 h-4"></i> Core Vision
                                </div>
                                <p class="text-gray-400 leading-relaxed">AetherOS is engineered to explore new paradigms of user-interface atmosphere. It is not designed to be a traditional file launcher, but an immersive technical museum and spatial workspace where live APIs, animations, and companion utilities form a unified digital consciousness.</p>
                            </div>

                            <!-- Design Philosophy Card -->
                            <div class="rounded-xl border border-white/5 bg-black/40 p-4 relative overflow-hidden">
                                <div class="flex items-center gap-2 text-white mb-2 font-bold uppercase text-[11px] tracking-wider text-cyan-400">
                                    <i data-lucide="paintbrush" class="w-4 h-4"></i> Design Philosophy
                                </div>
                                <p class="text-gray-400 leading-relaxed">Built upon premium glassmorphism, responsive tactile physics, and highly optimized hardware acceleration layers. Depth-of-field blurring, velocity-aware genie transitions, and dynamic SVG vectors ensure the interface feels completely fluid, organic, and exceptionally polished.</p>
                            </div>
                        </div>

                        <!-- Inspirations & Project Goals -->
                        <div class="grid grid-cols-2 gap-4">
                            <!-- Inspirations -->
                            <div class="rounded-xl border border-white/5 bg-black/40 p-4">
                                <div class="flex items-center gap-2 text-white mb-3 font-bold uppercase text-[11px] tracking-wider text-cyan-400">
                                    <i data-lucide="compass" class="w-4 h-4"></i> Inspirations & Influences
                                </div>
                                <ul class="space-y-2 text-gray-400 leading-relaxed">
                                    <li class="flex items-start gap-2"><span class="text-cyan-400">◇</span> <b>J.A.R.V.I.S. (Iron Man)</b>: High-integrity technical automation, passive vocal assistance, and orbital diagnostics.</li>
                                    <li class="flex items-start gap-2"><span class="text-cyan-400">◇</span> <b>Futuristic Workspace Hubs</b>: Real-time mission-control dashboards and live telemetry radar clusters.</li>
                                    <li class="flex items-start gap-2"><span class="text-cyan-400">◇</span> <b>Retro TV Cathode Aesthetics</b>: CRT-style scanlines and high-contrast terminal streams.</li>
                                </ul>
                            </div>

                            <!-- Project Goals -->
                            <div class="rounded-xl border border-white/5 bg-black/40 p-4">
                                <div class="flex items-center gap-2 text-white mb-3 font-bold uppercase text-[11px] tracking-wider text-cyan-400">
                                    <i data-lucide="target" class="w-4 h-4"></i> Core Project Goals
                                </div>
                                <ul class="space-y-2 text-gray-400 leading-relaxed">
                                    <li class="flex items-start gap-2"><span class="text-green-400">✔</span> <b>High Integrity</b>: Absolute zero backend dependencies or heavy frame dependencies. Everything runs inside a single, high-fidelity client file.</li>
                                    <li class="flex items-start gap-2"><span class="text-green-400">✔</span> <b>Atmospheric Depth</b>: Connecting isolated utilities into a connected ecosystem through Jarvis's persistent awareness.</li>
                                    <li class="flex items-start gap-2"><span class="text-green-400">✔</span> <b>Optimization</b>: Standardized rendering intervals keeping complex 3D WebGL scenes running at a solid 60fps.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                `,

                architecture: `
                    <div class="space-y-4 h-full flex flex-col">
                        <!-- Header -->
                        <div class="shrink-0 border-b border-white/5 pb-3">
                            <div class="text-[8px] text-cyan-400 tracking-[0.2em] font-bold uppercase mb-1">INTERACTIVE SYSTEM TOPOLOGY</div>
                            <h2 class="text-xl font-display text-white uppercase tracking-widest">ARCHITECTURE SCHEMA</h2>
                            <p class="text-gray-500 text-[10px] mt-1">Hover over any system node to highlight relationships, communication paths, and descriptive technical documentation.</p>
                        </div>

                        <!-- Main Architecture Body -->
                        <div class="flex-1 grid grid-cols-12 gap-4 items-stretch min-h-0">
                            <!-- SVG Diagram Area (8/12 Columns) -->
                            <div class="col-span-8 bg-black/55 border border-white/5 rounded-xl p-2 relative flex items-center justify-center overflow-hidden min-h-[300px]">
                                <svg class="absolute inset-0 w-full h-full pointer-events-none" id="arch-svg">
                                    <!-- Connection Lines with unique classes for relationship highlights -->
                                    <line x1="120" y1="130" x2="240" y2="130" class="arch-line line-wm line-terminal" style="stroke:rgba(255,255,255,0.06); stroke-width:1;" />
                                    <line x1="120" y1="130" x2="120" y2="210" class="arch-line line-wm line-companion" style="stroke:rgba(255,255,255,0.06); stroke-width:1;" />
                                    <line x1="120" y1="210" x2="120" y2="290" class="arch-line line-companion line-dock" style="stroke:rgba(255,255,255,0.06); stroke-width:1;" />
                                    <line x1="120" y1="130" x2="240" y2="210" class="arch-line line-wm line-companion" style="stroke:rgba(255,255,255,0.06); stroke-width:1;" />
                                    <line x1="240" y1="210" x2="240" y2="290" class="arch-line line-companion line-customization" style="stroke:rgba(255,255,255,0.06); stroke-width:1;" />
                                    <line x1="240" y1="210" x2="360" y2="210" class="arch-line line-companion line-tracking" style="stroke:rgba(255,255,255,0.06); stroke-width:1;" />
                                    <line x1="360" y1="130" x2="360" y2="210" class="arch-line line-tracking line-wikiboard" style="stroke:rgba(255,255,255,0.06); stroke-width:1;" />
                                    <line x1="360" y1="210" x2="360" y2="290" class="arch-line line-tracking line-diagnostics" style="stroke:rgba(255,255,255,0.06); stroke-width:1;" />
                                    <line x1="240" y1="210" x2="240" y2="50" class="arch-line line-companion line-diagnostics" style="stroke:rgba(255,255,255,0.06); stroke-width:1;" />
                                </svg>
                                
                                <!-- Interactive Node Buttons positioned absolutely to overlay on the SVG connections -->
                                <div class="absolute inset-0">
                                    <!-- Node 1: Window Manager -->
                                    <div class="arch-node absolute w-24 h-12 border border-white/10 rounded bg-os-900/80 flex flex-col items-center justify-center cursor-none hover-target text-center transition" style="left: 70px; top: 105px;" data-node="wm">
                                        <i data-lucide="monitor" class="w-3.5 h-3.5 mb-1 text-cyan-400"></i>
                                        <span class="text-[9px] font-bold uppercase tracking-wider">WINDOW_MGR</span>
                                    </div>
                                    <!-- Node 2: Companion / Jarvis -->
                                    <div class="arch-node absolute w-24 h-12 border border-cyan-500/20 rounded bg-cyan-950/20 flex flex-col items-center justify-center cursor-none hover-target text-center transition" style="left: 190px; top: 185px;" data-node="companion">
                                        <i data-lucide="bot" class="w-3.5 h-3.5 mb-1 text-cyan-400 animate-pulse"></i>
                                        <span class="text-[9px] font-bold uppercase tracking-wider text-cyan-300">JARVIS_SOUL</span>
                                    </div>
                                    <!-- Node 3: Dock System -->
                                    <div class="arch-node absolute w-24 h-12 border border-white/10 rounded bg-os-900/80 flex flex-col items-center justify-center cursor-none hover-target text-center transition" style="left: 70px; top: 265px;" data-node="dock">
                                        <i data-lucide="layers" class="w-3.5 h-3.5 mb-1 text-cyan-400"></i>
                                        <span class="text-[9px] font-bold uppercase tracking-wider">DOCK_SYS</span>
                                    </div>
                                    <!-- Node 4: Terminal -->
                                    <div class="arch-node absolute w-24 h-12 border border-white/10 rounded bg-os-900/80 flex flex-col items-center justify-center cursor-none hover-target text-center transition" style="left: 190px; top: 105px;" data-node="terminal">
                                        <i data-lucide="terminal" class="w-3.5 h-3.5 mb-1 text-cyan-400"></i>
                                        <span class="text-[9px] font-bold uppercase tracking-wider">CLI_STREAM</span>
                                    </div>
                                    <!-- Node 5: Customization Engine -->
                                    <div class="arch-node absolute w-24 h-12 border border-white/10 rounded bg-os-900/80 flex flex-col items-center justify-center cursor-none hover-target text-center transition" style="left: 190px; top: 265px;" data-node="customization">
                                        <i data-lucide="paintbrush" class="w-3.5 h-3.5 mb-1 text-cyan-400"></i>
                                        <span class="text-[9px] font-bold uppercase tracking-wider">THEMES_FX</span>
                                    </div>
                                    <!-- Node 6: WikiBoard -->
                                    <div class="arch-node absolute w-24 h-12 border border-white/10 rounded bg-os-900/80 flex flex-col items-center justify-center cursor-none hover-target text-center transition" style="left: 310px; top: 105px;" data-node="wikiboard">
                                        <i data-lucide="network" class="w-3.5 h-3.5 mb-1 text-cyan-400"></i>
                                        <span class="text-[9px] font-bold uppercase tracking-wider">WIKIBOARD</span>
                                    </div>
                                    <!-- Node 7: Space Tracking -->
                                    <div class="arch-node absolute w-24 h-12 border border-white/10 rounded bg-os-900/80 flex flex-col items-center justify-center cursor-none hover-target text-center transition" style="left: 310px; top: 185px;" data-node="tracking">
                                        <i data-lucide="satellite" class="w-3.5 h-3.5 mb-1 text-cyan-400"></i>
                                        <span class="text-[9px] font-bold uppercase tracking-wider">SPATIAL_SAT</span>
                                    </div>
                                    <!-- Node 8: Diagnostics -->
                                    <div class="arch-node absolute w-24 h-12 border border-white/10 rounded bg-os-900/80 flex flex-col items-center justify-center cursor-none hover-target text-center transition" style="left: 310px; top: 265px;" data-node="diagnostics">
                                        <i data-lucide="activity" class="w-3.5 h-3.5 mb-1 text-cyan-400"></i>
                                        <span class="text-[9px] font-bold uppercase tracking-wider">DIAG_MON</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Sidebar Technical Description Box (4/12 Columns) -->
                            <div class="col-span-4 bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col justify-start">
                                <div class="text-[8px] text-cyan-400 uppercase tracking-widest font-bold mb-1">Subsystem Matrix</div>
                                <h3 class="text-sm font-bold text-white uppercase tracking-wider mb-2 border-b border-white/5 pb-1" id="arch-desc-title">Jarvis Companion</h3>
                                <div class="text-[10px] text-gray-400 leading-relaxed overflow-y-auto max-h-[140px]" id="arch-desc-body">
                                    The core system director. Links terminal streams, music players, tracking modules, and visual themes. It observes user behavior and speaks aloud to coordinate system state transitions with context-aware cognitive reactions.
                                </div>
                                <div class="mt-auto pt-3 border-t border-white/5">
                                    <div class="text-[8px] text-gray-500 uppercase tracking-wider mb-1">Underlying Technologies</div>
                                    <div class="text-[10px] text-cyan-400 font-bold" id="arch-desc-tech">SpeechSynthesis, Lanyard socket API, OtakuREST</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `,

                features: `
                    <div class="space-y-4">
                        <!-- Header -->
                        <div class="border-b border-white/5 pb-3">
                            <div class="text-[8px] text-cyan-400 tracking-[0.2em] font-bold uppercase mb-1">WIKI REPOSITORY</div>
                            <h2 class="text-xl font-display text-white uppercase tracking-widest">FEATURE DOCUMENTATION</h2>
                            <p class="text-gray-500 text-[10px] mt-1">Explore exhaustive feature directories, module descriptions, and mechanical breakdowns of every AetherOS subsystem.</p>
                        </div>

                        <!-- Accordion List -->
                        <div class="space-y-2.5" id="wiki-accordion-list">
                            <!-- Desktop Environment -->
                            <div class="wiki-accordion-item rounded-xl border border-white/5 bg-black/45 overflow-hidden">
                                <button class="wiki-accordion-btn w-full flex items-center justify-between p-4 font-bold text-white uppercase text-[11px] tracking-wider text-left cursor-none hover-target hover:bg-white/[0.02]">
                                    <span class="flex items-center gap-2"><i data-lucide="monitor" class="w-4 h-4 text-cyan-400"></i> Desktop Environment</span>
                                    <i data-lucide="chevron-right" class="accordion-icon w-4 h-4 text-gray-500 transition-transform"></i>
                                </button>
                                <div class="wiki-accordion-body hidden p-4 border-t border-white/5 bg-black/20 text-gray-400 leading-relaxed space-y-2">
                                    <p>The AetherOS desktop compositor is engineered for ultra-smooth multi-window workflows. It acts as an independent windows supervisor within the HTML body, bypassing standard browser scrolling blocks.</p>
                                    <ul class="list-disc list-inside space-y-1.5 pl-2">
                                        <li><b>Window Manager</b>: Coordinates absolute positioning, drag boundaries, z-indexing focus, and minimization scales.</li>
                                        <li><b>Inertial Drag & Snap</b>: Features high-performance GSAP Draggable integrations with inertia resistance and window boundary clamping.</li>
                                        <li><b>Dock Interactions</b>: Dynamic launcher supporting process indicators, context menus, and Genie minimize targets.</li>
                                    </ul>
                                </div>
                            </div>

                            <!-- Media Workstation -->
                            <div class="wiki-accordion-item rounded-xl border border-white/5 bg-black/45 overflow-hidden">
                                <button class="wiki-accordion-btn w-full flex items-center justify-between p-4 font-bold text-white uppercase text-[11px] tracking-wider text-left cursor-none hover-target hover:bg-white/[0.02]">
                                    <span class="flex items-center gap-2"><i data-lucide="music" class="w-4 h-4 text-cyan-400"></i> Media Workstation</span>
                                    <i data-lucide="chevron-right" class="accordion-icon w-4 h-4 text-gray-500 transition-transform"></i>
                                </button>
                                <div class="wiki-accordion-body hidden p-4 border-t border-white/5 bg-black/20 text-gray-400 leading-relaxed space-y-2">
                                    <p>An immersive cybernetic audio ecosystem. Connects global streams and modern visualizers into a gorgeous mechanical interface.</p>
                                    <ul class="list-disc list-inside space-y-1.5 pl-2">
                                        <li><b>Vapor Plaza Tuner</b>: Direct integration with Vaporwave radio streams, complete with automated cover arts, retro metadata, and a rotating vinyl record deck.</li>
                                        <li><b>Procedural Audio Wave</b>: Integrates high-performance canvas visualizers rendering live frequency spectrums.</li>
                                        <li><b>Scrollable Lyric Scroller</b>: Features scroll spotlight, minimal, and Apple-inspired karaoke styles.</li>
                                    </ul>
                                </div>
                            </div>

                            <!-- Knowledge & Research -->
                            <div class="wiki-accordion-item rounded-xl border border-white/5 bg-black/45 overflow-hidden">
                                <button class="wiki-accordion-btn w-full flex items-center justify-between p-4 font-bold text-white uppercase text-[11px] tracking-wider text-left cursor-none hover-target hover:bg-white/[0.02]">
                                    <span class="flex items-center gap-2"><i data-lucide="network" class="w-4 h-4 text-cyan-400"></i> Knowledge & Research Canvas</span>
                                    <i data-lucide="chevron-right" class="accordion-icon w-4 h-4 text-gray-500 transition-transform"></i>
                                </button>
                                <div class="wiki-accordion-body hidden p-4 border-t border-white/5 bg-black/20 text-gray-400 leading-relaxed space-y-2">
                                    <p>AetherOS provides an infinite spatial whiteboard for cognitive layout mappings and Wikipedia research.</p>
                                    <ul class="list-disc list-inside space-y-1.5 pl-2">
                                        <li><b>WikiBoard Infinite Grid</b>: Features panning, zoom-pinching, and double-click note creation.</li>
                                        <li><b>Interactive Connected Nodes</b>: Automatically spawns parent-child article relationship maps with glowing connecting vector streams.</li>
                                        <li><b>Live Web & PDF Previews</b>: Direct card embedding of URL previews and readable PDFs.</li>
                                    </ul>
                                </div>
                            </div>

                            <!-- Space & Tracking Tools -->
                            <div class="wiki-accordion-item rounded-xl border border-white/5 bg-black/45 overflow-hidden">
                                <button class="wiki-accordion-btn w-full flex items-center justify-between p-4 font-bold text-white uppercase text-[11px] tracking-wider text-left cursor-none hover-target hover:bg-white/[0.02]">
                                    <span class="flex items-center gap-2"><i data-lucide="satellite" class="w-4 h-4 text-cyan-400"></i> Space & Tracking Radar</span>
                                    <i data-lucide="chevron-right" class="accordion-icon w-4 h-4 text-gray-500 transition-transform"></i>
                                </button>
                                <div class="wiki-accordion-body hidden p-4 border-t border-white/5 bg-black/20 text-gray-400 leading-relaxed space-y-2">
                                    <p>Integrates satellite coordinate trackers to visualize aerospace paths in real time.</p>
                                    <ul class="list-disc list-inside space-y-1.5 pl-2">
                                        <li><b>3D ISS Orbital Tracker</b>: Renders the International Space Station traveling over a 3D WebGL Earth globe using Three.js and Cesium.</li>
                                        <li><b>Live Telemetry Dashboard</b>: Polling live coordinates, altitude, orbital velocity, and visibility parameters.</li>
                                        <li><b>Aero Weather Station</b>: Integrates Open-Meteo REST APIs to evaluate optimal visibility conditions.</li>
                                    </ul>
                                </div>
                            </div>

                            <!-- Companion System -->
                            <div class="wiki-accordion-item rounded-xl border border-white/5 bg-black/45 overflow-hidden">
                                <button class="wiki-accordion-btn w-full flex items-center justify-between p-4 font-bold text-white uppercase text-[11px] tracking-wider text-left cursor-none hover-target hover:bg-white/[0.02]">
                                    <span class="flex items-center gap-2"><i data-lucide="bot" class="w-4 h-4 text-cyan-400"></i> Companion System</span>
                                    <i data-lucide="chevron-right" class="accordion-icon w-4 h-4 text-gray-500 transition-transform"></i>
                                </button>
                                <div class="wiki-accordion-body hidden p-4 border-t border-white/5 bg-black/20 text-gray-400 leading-relaxed space-y-2">
                                    <p>The J.A.R.V.I.S.-style passive background intelligence that acts as the director of AetherOS.</p>
                                    <ul class="list-disc list-inside space-y-1.5 pl-2">
                                        <li><b>Cursor Eye-Tracking</b>: Features a stylized digital head in the chat header whose glowing eyes follow your cursor positions.</li>
                                        <li><b>Visual Sentiment Emotions</b>: Analyzes incoming text to load expressive animated reaction GIFs (from OtakuGIFs REST API) representing Jarvis's cognitive mood.</li>
                                        <li><b>Offline Voice Wake-Lock</b>: Prioritizes local low-latency speech engines, utilizing automatic pause-resume watchdog timers to completely prevent Chrome's 15s mid-sentence cut-off bug.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                `,

                metrics: `
                    <div class="space-y-6">
                        <!-- Header -->
                        <div class="border-b border-white/5 pb-3">
                            <div class="text-[8px] text-cyan-400 tracking-[0.2em] font-bold uppercase mb-1">TELEMETRY & CODE MATRIX</div>
                            <h2 class="text-xl font-display text-white uppercase tracking-widest">SYSTEM STATISTICS</h2>
                            <p class="text-gray-500 text-[10px] mt-1">Real-time counts of integrated modules, custom sub-libraries, and the client-side technology stack.</p>
                        </div>

                        <!-- Animated Stats counters -->
                        <div class="grid grid-cols-4 gap-4">
                            <div class="p-3 bg-black/40 border border-white/5 rounded-xl text-center">
                                <div class="text-xs text-gray-500 mb-1 font-bold">TOTAL_MODULES</div>
                                <div class="text-2xl font-display text-cyan-400 metric-counter" id="stat-modules" data-target="35">0</div>
                                <div class="w-full bg-white/5 h-1 rounded mt-2 overflow-hidden"><div class="bg-cyan-500 h-full transition-all duration-1000" id="bar-stat-modules" style="width:0%"></div></div>
                            </div>
                            <div class="p-3 bg-black/40 border border-white/5 rounded-xl text-center">
                                <div class="text-xs text-gray-500 mb-1 font-bold">API_INTEGRATIONS</div>
                                <div class="text-2xl font-display text-cyan-400 metric-counter" id="stat-apis" data-target="14">0</div>
                                <div class="w-full bg-white/5 h-1 rounded mt-2 overflow-hidden"><div class="bg-cyan-500 h-full transition-all duration-1000" id="bar-stat-apis" style="width:0%"></div></div>
                            </div>
                            <div class="p-3 bg-black/40 border border-white/5 rounded-xl text-center">
                                <div class="text-xs text-gray-500 mb-1 font-bold">LINES_OF_CODE</div>
                                <div class="text-2xl font-display text-cyan-400 metric-counter" id="stat-loc" data-target="17800">0</div>
                                <div class="w-full bg-white/5 h-1 rounded mt-2 overflow-hidden"><div class="bg-cyan-500 h-full transition-all duration-1000" id="bar-stat-loc" style="width:0%"></div></div>
                            </div>
                            <div class="p-3 bg-black/40 border border-white/5 rounded-xl text-center">
                                <div class="text-xs text-gray-500 mb-1 font-bold">RENDER_RATE</div>
                                <div class="text-2xl font-display text-green-400 metric-counter" id="stat-fps" data-target="60">0</div>
                                <div class="w-full bg-white/5 h-1 rounded mt-2 overflow-hidden"><div class="bg-green-500 h-full transition-all duration-1000" id="bar-stat-fps" style="width:0%"></div></div>
                            </div>
                        </div>

                        <!-- Technology Stack Grid -->
                        <div class="space-y-3">
                            <div class="text-[9px] text-cyan-400 tracking-wider uppercase font-bold">Technology Stack</div>
                            <div class="grid grid-cols-3 gap-3">
                                <div class="p-3 rounded-lg border border-white/5 bg-black/25 flex gap-3 items-start">
                                    <div class="p-1.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs shrink-0 font-bold">HTML5</div>
                                    <div>
                                        <div class="text-[10px] font-bold text-white uppercase">Composited Canvas</div>
                                        <p class="text-[9px] text-gray-500 mt-1 leading-relaxed">Runs dynamic, low-latency 2D particles overlay layers, and sandbox-safe rendering pipelines.</p>
                                    </div>
                                </div>
                                <div class="p-3 rounded-lg border border-white/5 bg-black/25 flex gap-3 items-start">
                                    <div class="p-1.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-xs shrink-0 font-bold">GSAP</div>
                                    <div>
                                        <div class="text-[10px] font-bold text-white uppercase">Tactile Motion</div>
                                        <p class="text-[9px] text-gray-500 mt-1 leading-relaxed">Propels high-performance dragging with momentum inertia and spring minimization genie scales.</p>
                                    </div>
                                </div>
                                <div class="p-3 rounded-lg border border-white/5 bg-black/25 flex gap-3 items-start">
                                    <div class="p-1.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs shrink-0 font-bold">WebGL</div>
                                    <div>
                                        <div class="text-[10px] font-bold text-white uppercase">Three.js Globe</div>
                                        <p class="text-[9px] text-gray-500 mt-1 leading-relaxed">Renders orbital station coordinates traveling over a real-time geographic digital Earth globe.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `,

                roadmap: `
                    <div class="space-y-6">
                        <!-- Header -->
                        <div class="border-b border-white/5 pb-3">
                            <div class="text-[8px] text-cyan-400 tracking-[0.2em] font-bold uppercase mb-1">EVOLUTION & SECRETS</div>
                            <h2 class="text-xl font-display text-white uppercase tracking-widest">TIMELINE & ROADMAP</h2>
                            <p class="text-gray-500 text-[10px] mt-1">Timeline of AetherOS system releases, planned feature updates, and power-user cheat codes.</p>
                        </div>

                        <!-- Timeline -->
                        <div class="relative pl-6 border-l border-white/10 space-y-4">
                            <div class="relative">
                                <span class="absolute -left-[30px] top-1.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"></span>
                                <div class="text-[10px] text-cyan-400 font-bold">v1.0 (Core Workspace)</div>
                                <p class="text-[9px] text-gray-400 mt-0.5 leading-relaxed">Initial windows manager compositor, multi-window drag/resize snap boundary system, dynamic Dock launchers, and custom Terminal CLI shell.</p>
                            </div>
                            <div class="relative">
                                <span class="absolute -left-[30px] top-1.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"></span>
                                <div class="text-[10px] text-cyan-400 font-bold">v2.0 (Sensory Stream)</div>
                                <p class="text-[9px] text-gray-400 mt-0.5 leading-relaxed">Geospatial satellite tracker modules, open weather stations, real-time audio visualizers, scroll lyric decks, and living file archives.</p>
                            </div>
                            <div class="relative">
                                <span class="absolute -left-[30px] top-1.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)] animate-pulse"></span>
                                <div class="text-[10px] text-cyan-400 font-bold">v3.0 (Jarvis Soul & Nyan)</div>
                                <p class="text-[9px] text-gray-400 mt-0.5 leading-relaxed">Gaze cursor-tracking eyes, real-time sentiment reaction overlays, GC-proof offline speech heartbeats, and seamless 60fps Nyan Cat polyline trail systems.</p>
                            </div>
                            <div class="relative">
                                <span class="absolute -left-[30px] top-1.5 w-2 h-2 rounded-full bg-gray-600"></span>
                                <div class="text-[10px] text-gray-500 font-bold">Future (v4.0 Automation Roadmap)</div>
                                <p class="text-[9px] text-gray-600 mt-0.5 leading-relaxed">Planned multi-agent terminal operations, client-side WebGL canvas custom shaders compiling, and decentralization signal communication nodes.</p>
                            </div>
                        </div>

                        <!-- Secrets & Easter Eggs -->
                        <div class="p-3 rounded-lg border border-white/5 bg-black/40">
                            <div class="text-[9px] text-cyan-400 font-bold uppercase mb-2">Hidden Details & Secrets</div>
                            <div class="grid grid-cols-2 gap-3 text-[9px] text-gray-400 leading-relaxed font-mono">
                                <div><i data-lucide="terminal" class="w-3 h-3 inline text-cyan-400 mr-1"></i><b>Terminal commands</b>: Type <b class="text-os-accent">wiki &lt;topic&gt;</b> to search and spawn WikiBoard canvas cards instantly. Type <b class="text-os-accent">matrix</b> to max out stream entropy.</div>
                                <div><i data-lucide="keyboard" class="w-3 h-3 inline text-cyan-400 mr-1"></i><b>Keyboard Hotkeys</b>: Press <b class="text-os-accent">Ctrl/Cmd+K</b> for Command Palette. On WikiBoard canvas, press <b class="text-os-accent">Delete</b> to remove selected card.</div>
                            </div>
                        </div>
                    </div>
                `,

                credits: `
                    <div class="space-y-4">
                        <!-- Header -->
                        <div class="border-b border-white/5 pb-3">
                            <div class="text-[8px] text-cyan-400 tracking-[0.2em] font-bold uppercase mb-1">UPLINKS & UTILITIES</div>
                            <h2 class="text-xl font-display text-white uppercase tracking-widest">CREDITS & ACKNOWLEDGEMENTS</h2>
                            <p class="text-gray-500 text-[10px] mt-1">Open source libraries, public API endpoints, and community resources powering AetherOS.</p>
                        </div>

                        <!-- Grid -->
                        <div class="grid grid-cols-2 gap-4 text-[10px] leading-relaxed text-gray-400">
                            <!-- Libraries -->
                            <div class="p-3 bg-black/40 border border-white/5 rounded-xl">
                                <div class="text-[9px] text-cyan-400 font-bold uppercase mb-2">Core Open Source Libraries</div>
                                <ul class="space-y-1.5 pl-1">
                                    <li><b>GSAP</b>: Premium window composites, inertia drag, and elastic genie minimized animations.</li>
                                    <li><b>Three.js</b>: Hardware-accelerated 3D coordinate visualizer overlays.</li>
                                    <li><b>Leaflet</b>: Real-time satellite trackings and tactical airspace maps.</li>
                                    <li><b>Lucide</b>: Crisp, responsive modern system icons.</li>
                                </ul>
                            </div>

                            <!-- APIs -->
                            <div class="p-3 bg-black/40 border border-white/5 rounded-xl">
                                <div class="text-[9px] text-cyan-400 font-bold uppercase mb-2">Public API Endpoints</div>
                                <ul class="space-y-1.5 pl-1">
                                    <li><b>Open-Meteo</b>: Micro-climate weather conditions data stream.</li>
                                    <li><b>WhereTheISS</b>: High-integrity satellite tracking coordinates.</li>
                                    <li><b>Lanyard API</b>: Real-time Discord presence and client matrices.</li>
                                    <li><b>OtakuGIFs & Nekos</b>: Sentient sentiment companion reaction overlays.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                `
            },

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
