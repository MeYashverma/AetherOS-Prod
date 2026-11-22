// AetherOS — 2D ADS-B Flight Radar, Live Crypto Market Matrix & AI Vision Surveillance Node
window.extendOS({
    radarMap: null,

    radarMarkersLayer: null,

    radarTrailLayer: null,

    radarMarkerMap: {},

    globeDataTimer: null,

    activeFlights: [],

    selectedFlight: null,

    _leafletLoaded: false,

    radarViewMode: 'leaflet',

    radarEmbedReady: false,

    radarEmbedLastUrl: '',

    radarProxyEndpoints: [],

    altToColor: (altM) => {
                const altFt = altM * 3.28084;
                const stops = [
                    [0,     '#ff0000'],
                    [2000,  '#ff4400'],
                    [5000,  '#ff8800'],
                    [10000, '#ffcc00'],
                    [15000, '#aaff00'],
                    [20000, '#00ff88'],
                    [25000, '#00ffff'],
                    [30000, '#0099ff'],
                    [35000, '#0044ff'],
                    [40000, '#8800ff'],
                ];
                if (altFt <= 0) return '#ff0000';
                if (altFt >= 40000) return '#8800ff';
                for (let i = 1; i < stops.length; i++) {
                    if (altFt <= stops[i][0]) {
                        const t = (altFt - stops[i-1][0]) / (stops[i][0] - stops[i-1][0]);
                        // Simple linear hex lerp
                        const c1 = stops[i-1][1], c2 = stops[i][1];
                        const r = Math.round(parseInt(c1.slice(1,3),16)*(1-t) + parseInt(c2.slice(1,3),16)*t);
                        const g = Math.round(parseInt(c1.slice(3,5),16)*(1-t) + parseInt(c2.slice(3,5),16)*t);
                        const b = Math.round(parseInt(c1.slice(5,7),16)*(1-t) + parseInt(c2.slice(5,7),16)*t);
                        return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
                    }
                }
                return '#8800ff';
            },

    makeAircraftIcon: (color, heading, isSelected, zoom) => {
                const size = isSelected ? 28 : (zoom > 6 ? 22 : 16);
                const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
                    <g transform="rotate(${heading}, 12, 12)">
                        <path d="M12 2 L15 10 L22 10 L16 14 L18 22 L12 18 L6 22 L8 14 L2 10 L9 10 Z"
                              fill="${color}" stroke="${isSelected ? '#fff' : 'rgba(0,0,0,0.5)'}"
                              stroke-width="${isSelected ? 1.5 : 0.8}" opacity="${isSelected ? 1 : 0.9}"/>
                    </g>
                </svg>`;
                return L.divIcon({
                    html: svg,
                    className: '',
                    iconSize: [size, size],
                    iconAnchor: [size/2, size/2]
                });
            },

    initGlobe: () => {
                if (os.radarMap) return;

                // Load Leaflet CSS + JS dynamically if not present
                const loadLeaflet = (cb) => {
                    if (window.L) { cb(); return; }
                    const css = document.createElement('link');
                    css.rel = 'stylesheet';
                    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
                    document.head.appendChild(css);

                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
                    script.onload = cb;
                    document.head.appendChild(script);
                };

                loadLeaflet(() => {
                    os._leafletLoaded = true;
                    const mapEl = document.getElementById('radar-leaflet-map');
                    if (!mapEl || os.radarMap) return;

                    // Dark tile layer — CartoDB dark matter
                    const map = L.map(mapEl, {
                        center: [20, 0],
                        zoom: 2,
                        zoomControl: false,
                        attributionControl: false
                    });

                    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                        maxZoom: 19,
                        subdomains: 'abcd'
                    }).addTo(map);

                    // Attribution (small, bottom right)
                    L.control.attribution({ prefix: false, position: 'bottomright' }).addTo(map);
                    map.attributionControl.addAttribution('© <a href="https://opensky-network.org" style="color:#888">OpenSky</a> © <a href="https://carto.com" style="color:#888">CARTO</a>');

                    // Zoom control top-right
                    L.control.zoom({ position: 'bottomright' }).addTo(map);

                    // Markers layer group
                    os.radarMarkersLayer = L.layerGroup().addTo(map);
                    os.radarTrailLayer   = L.layerGroup().addTo(map);
                    os.radarMarkerMap    = {};
                    os.radarMap          = map;

                    // Update marker sizes on zoom
                    map.on('zoom', () => os.redrawMarkers());

                    // Close popup / deselect on map click
                    map.on('click', () => os.deselectFlight());

                    os.fetchGlobeData();
                    os.globeDataTimer = setInterval(os.fetchGlobeData, 30000);
                    os.radarProxyEndpoints = os.buildRadarProxyChain('https://map.opensky-network.org/');
                    os.switchRadarView('leaflet');
                    lucide.createIcons({ root: document.getElementById('globe-root') });
                    os.logTerminal('Radar: Leaflet ADS-B map engaged. Fetching OpenSky feed...');
                });
            },

    buildRadarProxyChain: (targetUrl) => {
                const target = new URL(targetUrl);
                const q = `${target.pathname}${target.search}${target.hash}`;
                const encoded = encodeURIComponent(target.toString());
                const originEncoded = encodeURIComponent(target.origin);
                const targetNoScheme = target.toString().replace(/^https?:\/\//i, '');
                const relay = [
                    (u) => `https://browser.rammerhead.org/?url=${encodeURIComponent(u)}`,
                    (u) => `https://browser.rammerhead.org/${targetNoScheme}`,
                    (u) => `https://browser.rammerhead.org/newsession?url=${encodeURIComponent(u)}`,
                    (u) => `https://browser.rammerhead.org/session?url=${encodeURIComponent(u)}`,
                    (u) => `https://browser.rammerhead.org/go/${encodeURIComponent(u)}`,
                    () => `https://browser.rammerhead.org/?origin=${originEncoded}&path=${encodeURIComponent(q)}`,
                    (u) => `https://r.jina.ai/http://${u.replace(/^https?:\/\//i, '')}`,
                    (u) => `https://cors.isomorphic-git.org/${u}`,
                    (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
                    (u) => `https://r.jina.ai/http://${target.host}${q}`,
                    () => `https://r.jina.ai/http://${target.host}/`,
                    () => `https://thingproxy.freeboard.io/fetch/${target.toString()}`,
                    () => `https://r.jina.ai/http://${target.host}/?target=${encoded}`,
                    () => `https://r.jina.ai/http://${target.host}/?origin=${originEncoded}&path=${encodeURIComponent(q)}`
                ];
                return relay;
            },

    resolveRadarEmbedUrl: () => {
                const targetUrl = 'https://map.opensky-network.org/';
                const builders = Array.isArray(os.radarProxyEndpoints) && os.radarProxyEndpoints.length
                    ? os.radarProxyEndpoints
                    : os.buildRadarProxyChain(targetUrl);
                return builders
                    .map(fn => {
                        try { return fn(targetUrl); } catch { return null; }
                    })
                    .filter(Boolean);
            },

    initRadarEmbed: async () => {
                const frame = document.getElementById('radar-embed-frame');
                if (!frame) return false;
                if (os.radarEmbedReady && os.radarEmbedLastUrl) {
                    frame.src = os.radarEmbedLastUrl;
                    return true;
                }
                const candidates = os.resolveRadarEmbedUrl();
                for (const candidate of candidates) {
                    const loaded = await new Promise((resolve) => {
                        const onLoad = () => { cleanup(); resolve(true); };
                        const onError = () => { cleanup(); resolve(false); };
                        const cleanup = () => {
                            clearTimeout(timer);
                            frame.removeEventListener('load', onLoad);
                            frame.removeEventListener('error', onError);
                        };
                        frame.addEventListener('load', onLoad, { once: true });
                        frame.addEventListener('error', onError, { once: true });
                        const timer = setTimeout(() => { cleanup(); resolve(false); }, 7000);
                        frame.src = candidate;
                    });
                    if (loaded) {
                        os.radarEmbedReady = true;
                        os.radarEmbedLastUrl = candidate;
                        os.logTerminal(`Radar: Embed relay locked -> ${new URL(candidate).host}`);
                        return true;
                    }
                }
                os.radarEmbedReady = false;
                os.radarEmbedLastUrl = '';
                os.logTerminal('Radar Warning: embed relays unavailable; reverting to vector mode.');
                return false;
            },

    switchRadarView: async (mode) => {
                const nextMode = mode === 'embed' ? 'embed' : 'leaflet';
                const leafletEl = document.getElementById('radar-leaflet-map');
                const embedShell = document.getElementById('radar-embed-shell');
                const warnStrip = document.getElementById('radar-embed-warning');
                const detailPanel = document.getElementById('radar-detail-panel');
                const manifest = document.getElementById('flight-manifest-list');
                const btnLeaflet = document.getElementById('radar-mode-leaflet-btn');
                const btnEmbed = document.getElementById('radar-mode-embed-btn');

                if (!leafletEl || !embedShell) return;

                if (btnLeaflet && btnEmbed) {
                    btnLeaflet.className = `bg-black/70 border rounded px-2 py-1 text-[9px] transition cursor-none hover-target ${nextMode === 'leaflet' ? 'border-white/20 text-white' : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`;
                    btnEmbed.className = `bg-black/70 border rounded px-2 py-1 text-[9px] transition cursor-none hover-target ${nextMode === 'embed' ? 'border-white/20 text-white' : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`;
                }

                if (nextMode === 'embed') {
                    const ok = await os.initRadarEmbed();
                    if (!ok) {
                        os.switchRadarView('leaflet');
                        if (manifest) {
                            manifest.insertAdjacentHTML('afterbegin', '<div class="text-[9px] text-yellow-400 px-2 py-1 border border-yellow-500/30 rounded mb-1">Embed unavailable; continued in LIVE FEED mode.</div>');
                        }
                        return;
                    }
                    leafletEl.classList.add('hidden');
                    embedShell.classList.remove('hidden');
                    if (warnStrip) warnStrip.classList.remove('hidden');
                    if (os.globeDataTimer) { clearInterval(os.globeDataTimer); os.globeDataTimer = null; }
                    const embedNote = document.getElementById('radar-detail-embed-note');
                    if (detailPanel) detailPanel.classList.remove('hidden');
                    if (embedNote) embedNote.classList.remove('hidden');
                    if (detailPanel) detailPanel.classList.add('opacity-60');
                    os.radarViewMode = 'embed';
                    os.logTerminal('Radar: switched to EMBED VIEW (proxied client).');
                    return;
                }

                leafletEl.classList.remove('hidden');
                embedShell.classList.add('hidden');
                if (warnStrip) warnStrip.classList.add('hidden');
                if (!os.globeDataTimer) {
                    os.fetchGlobeData();
                    os.globeDataTimer = setInterval(os.fetchGlobeData, 30000);
                }
                const embedNote = document.getElementById('radar-detail-embed-note');
                if (embedNote) embedNote.classList.add('hidden');
                if (detailPanel) detailPanel.classList.remove('opacity-60');
                os.radarViewMode = 'leaflet';
                os.renderFlightManifest();
                os.deselectFlight();
                os.logTerminal('Radar: switched to LIVE FEED vector mode.');
            },

    fetchGlobeData: async () => {
                if (!os._leafletLoaded || !os.radarMap) return;

                const refreshBtn = document.getElementById('globe-refresh-btn');
                if (refreshBtn) {
                    const ic = refreshBtn.querySelector('i');
                    if (ic) ic.classList.add('animate-spin');
                }

                try {
                    const res = await fetch('https://opensky-network.org/api/states/all', {
                        signal: AbortSignal.timeout(15000),
                        cache: 'no-store'
                    });
                    if (!res.ok) throw new Error(`OpenSky HTTP ${res.status}`);
                    const raw = await res.json();
                    if (!raw || !raw.states) throw new Error('No state data returned');

                    // s[0]=icao24 s[1]=callsign s[2]=origin_country s[3]=time_position
                    // s[4]=last_contact s[5]=lon s[6]=lat s[7]=baro_alt s[8]=on_ground
                    // s[9]=velocity(m/s) s[10]=true_track s[11]=vertical_rate
                    // s[13]=geo_alt s[14]=squawk s[15]=spi s[16]=position_source
                    os.activeFlights = raw.states
                        .filter(s => s[5] != null && s[6] != null && s[7] != null && s[7] > 50)
                        .slice(0, 1500)
                        .map(s => ({
                            icao:    s[0] || '------',
                            callsign:(s[1] || '').trim() || s[0],
                            origin:  s[2] || 'Unknown',
                            lon:     s[5],
                            lat:     s[6],
                            baroAlt: s[7]  || 0,
                            geoAlt:  s[13] || s[7] || 0,
                            onGround:s[8],
                            speed:   s[9]  ? Math.round(s[9] * 1.94384) : 0,
                            track:   s[10] || 0,
                            vRate:   s[11] || 0,
                            squawk:  s[14] || '----',
                            posSource: ['ADS-B','ASTERIX','MLAT','FLARM'][s[16]] || 'ADS-B',
                        }));

                    os.redrawMarkers();
                    os.renderFlightManifest();

                    const titleEl = document.getElementById('globe-event-title');
                    const magEl   = document.getElementById('globe-event-mag');
                    const timeEl  = document.getElementById('globe-event-time');
                    const cntEl   = document.getElementById('globe-flight-count');
                    if (titleEl && !os.selectedFlight) titleEl.innerText = 'LIVE RADAR';
                    if (magEl)   magEl.innerText   = `${os.activeFlights.length} VECTORS`;
                    if (timeEl)  timeEl.innerText  = new Date().toLocaleTimeString('en-US',{hour12:false});
                    if (cntEl)   cntEl.innerText   = `${os.activeFlights.length} LIVE`;

                    os.logTerminal(`Radar: ${os.activeFlights.length} vectors from OpenSky.`);
                } catch(err) {
                    os.logTerminal(`Radar Warning: ${err.message} — OpenSky ADS-B unavailable.`);
                    os.activeFlights = [];
                    os.redrawMarkers();
                    os._radarLastError = err.message || 'OpenSky rate-limited or unreachable';
                    os.renderFlightManifest();
                    const cntEl = document.getElementById('globe-flight-count');
                    const magEl = document.getElementById('globe-event-mag');
                    if (cntEl) cntEl.innerText = 'OFFLINE';
                    if (magEl) magEl.innerText = 'ADS-B UNAVAILABLE';
                } finally {
                    if (refreshBtn) {
                        const ic = refreshBtn.querySelector('i');
                        if (ic) ic.classList.remove('animate-spin');
                    }
                }
            },

    redrawMarkers: () => {
                if (!os.radarMarkersLayer || !os.radarMap) return;
                const zoom = os.radarMap.getZoom();

                os.activeFlights.forEach(flight => {
                    const isSelected = os.selectedFlight && os.selectedFlight.icao === flight.icao;
                    const color = os.altToColor(flight.baroAlt);
                    const icon  = os.makeAircraftIcon(color, flight.track, isSelected, zoom);

                    if (os.radarMarkerMap[flight.icao]) {
                        // Update existing marker position + icon
                        os.radarMarkerMap[flight.icao]
                            .setLatLng([flight.lat, flight.lon])
                            .setIcon(icon);
                    } else {
                        // Create new marker
                        const marker = L.marker([flight.lat, flight.lon], { icon, zIndexOffset: isSelected ? 1000 : 0 });
                        marker.on('click', (e) => {
                            L.DomEvent.stopPropagation(e);
                            os.selectFlight(flight);
                        });
                        marker.addTo(os.radarMarkersLayer);
                        os.radarMarkerMap[flight.icao] = marker;
                    }
                });

                // Remove stale markers (flights no longer in feed)
                const liveIcaos = new Set(os.activeFlights.map(f => f.icao));
                Object.keys(os.radarMarkerMap).forEach(icao => {
                    if (!liveIcaos.has(icao)) {
                        os.radarMarkersLayer.removeLayer(os.radarMarkerMap[icao]);
                        delete os.radarMarkerMap[icao];
                    }
                });
            },

    selectFlight: (flight) => {
                os.selectedFlight = flight;

                // Update map marker icon to selected state
                if (os.radarMarkerMap[flight.icao]) {
                    const color = os.altToColor(flight.baroAlt);
                    os.radarMarkerMap[flight.icao].setIcon(
                        os.makeAircraftIcon(color, flight.track, true, os.radarMap ? os.radarMap.getZoom() : 4)
                    );
                }

                // Pan map to selected flight
                if (os.radarMap) {
                    os.radarMap.setView([flight.lat, flight.lon], Math.max(os.radarMap.getZoom(), 5), { animate: true, duration: 0.8 });
                }

                // Populate detail panel
                const panel = document.getElementById('radar-detail-panel');
                if (panel) {
                    panel.classList.remove('hidden');

                    const baroFt  = Math.round(flight.baroAlt * 3.28084);
                    const geoFt   = Math.round(flight.geoAlt  * 3.28084);
                    const vRateFtm= Math.round(flight.vRate   * 196.85);
                    const vrSign  = flight.vRate > 0.5 ? '▲' : flight.vRate < -0.5 ? '▼' : '►';
                    const vrClass = flight.vRate > 0.5 ? 'text-green-400' : flight.vRate < -0.5 ? 'text-red-400' : 'text-yellow-400';

                    const _rd = (id) => document.getElementById(id);
                    const _set = (id, txt) => { const el = _rd(id); if (el) el.innerText = txt; };

                    _set('rd-callsign', flight.callsign);
                    _set('rd-icao',     flight.icao.toUpperCase());
                    _set('rd-speed',    `${flight.speed} kt`);
                    _set('rd-baro',     `${baroFt.toLocaleString()} ft`);
                    _set('rd-geoalt',   `${geoFt.toLocaleString()} ft`);
                    _set('rd-track',    `${Math.round(flight.track)}°`);
                    _set('rd-pos',      `${flight.lat.toFixed(3)}°, ${flight.lon.toFixed(3)}°`);
                    _set('rd-source',   flight.posSource);
                    _set('rd-squawk',   flight.squawk);
                    _set('rd-country',  flight.origin);
                    _set('rd-icao24',   flight.icao.toUpperCase());
                    const rdGround = _rd('rd-ground');
                    if (rdGround) { rdGround.innerText = flight.onGround ? 'YES' : 'AIRBORNE'; rdGround.className = `text-right ${flight.onGround ? 'text-orange-400' : 'text-green-400'}`; }

                    // Vert rate with direction color
                    const vrEl = document.getElementById('rd-vrate');
                    if (vrEl) { vrEl.innerText = `${vrSign} ${Math.abs(vRateFtm).toLocaleString()} ft/min`; vrEl.className = `text-right font-bold ${vrClass}`; }

                    // Try to load a relevant aircraft image
                    const imgs = {
                        heavy:  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=400&h=160&fit=crop',
                        narrow: 'https://images.unsplash.com/photo-1559628233-100c798642d4?q=80&w=400&h=160&fit=crop',
                        turbo:  'https://images.unsplash.com/photo-1483373018724-b3d5b01c1072?q=80&w=400&h=160&fit=crop',
                        regional:'https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=400&h=160&fit=crop',
                    };
                    const imgKey = flight.speed > 470 ? 'heavy' : flight.speed > 350 ? 'narrow' : flight.baroAlt < 3000 ? 'turbo' : 'regional';
                    const radarImg = document.getElementById('radar-aircraft-img'); if (radarImg) radarImg.style.backgroundImage = `url('${imgs[imgKey]}')`;

                    // Try to infer type code from speed/alt heuristics
                    const typeGuess = flight.speed > 470 ? 'B789 / A350 class' : flight.speed > 350 ? 'B737 / A320 class' : flight.baroAlt < 3000 ? 'Turboprop / Light' : 'Regional Jet';
                    _set('rd-type', typeGuess);

                    // Reg + route are not available in OpenSky states/all; show ICAO + direction cue
                    _set('rd-reg',   flight.icao.toUpperCase());
                    _set('rd-route', `HDG ${Math.round(flight.track)}°`);

                    lucide.createIcons({ root: panel });
                }

                // Update top HUD
                const titleEl = document.getElementById('globe-event-title');
                const magEl   = document.getElementById('globe-event-mag');
                const timeEl  = document.getElementById('globe-event-time');
                if (titleEl) titleEl.innerText = `${flight.callsign} [${flight.icao.toUpperCase()}]`;
                if (magEl)   magEl.innerText   = `${Math.round(flight.baroAlt * 3.28084).toLocaleString()} FT`;
                if (timeEl)  timeEl.innerText  = flight.origin;

                os.logTerminal(`Radar: Locked on ${flight.callsign} [${flight.icao.toUpperCase()}] — ${flight.origin} — SQ:${flight.squawk}`);
            },

    deselectFlight: () => {
                if (os.selectedFlight && os.radarMarkerMap[os.selectedFlight.icao]) {
                    const f = os.selectedFlight;
                    const color = os.altToColor(f.baroAlt);
                    os.radarMarkerMap[f.icao].setIcon(
                        os.makeAircraftIcon(color, f.track, false, os.radarMap ? os.radarMap.getZoom() : 4)
                    );
                }
                os.selectedFlight = null;

                if (os.radarTrailLayer) os.radarTrailLayer.clearLayers();

                const panel = document.getElementById('radar-detail-panel');
                if (panel) panel.classList.add('hidden');

                const titleEl = document.getElementById('globe-event-title');
                const magEl   = document.getElementById('globe-event-mag');
                if (titleEl) titleEl.innerText = 'LIVE RADAR';
                if (magEl)   magEl.innerText   = `${os.activeFlights.length} VECTORS`;
            },

    fetchAndDrawVesselTrail: async (flight) => {
                if (!flight || !os.radarTrailLayer) return;
                os.radarTrailLayer.clearLayers();

                try {
                    const res = await fetch(`https://opensky-network.org/api/tracks/all?icao24=${flight.icao}&time=0`, {
                        signal: AbortSignal.timeout(10000)
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const data = await res.json();
                    if (!data.path || data.path.length < 2) throw new Error('Insufficient path data');

                    // Build polyline with altitude-colored segments
                    const points = data.path.filter(p => p[1] != null && p[2] != null);
                    if (points.length < 2) throw new Error('No valid points');

                    // Draw polyline with gradient-ish coloring by altitude
                    for (let i = 1; i < points.length; i++) {
                        const p0 = points[i-1], p1 = points[i];
                        const altM = (p0[3] || 0);
                        const color = os.altToColor(altM);
                        L.polyline([[p0[1], p0[2]], [p1[1], p1[2]]], {
                            color, weight: 2, opacity: 0.85
                        }).addTo(os.radarTrailLayer);
                    }

                    // Origin/destination dot markers
                    const first = points[0], last = points[points.length-1];
                    L.circleMarker([first[1], first[2]], { radius: 5, color: '#00ff88', fillColor: '#00ff88', fillOpacity: 1 })
                        .bindTooltip('Origin', { permanent: false, className: 'leaflet-dark-tooltip' })
                        .addTo(os.radarTrailLayer);
                    L.circleMarker([last[1], last[2]], { radius: 5, color: '#ffffff', fillColor: '#fff', fillOpacity: 0.8 })
                        .addTo(os.radarTrailLayer);

                    os.logTerminal(`Radar: Trail loaded for ${flight.callsign} — ${points.length} waypoints.`);
                } catch(e) {
                    os.logTerminal(`Radar: Track unavailable for ${flight.icao}. Projecting heading vector.`);
                    // Draw a simple projected heading line
                    const trackRad = (flight.track * Math.PI) / 180;
                    const endLat   = flight.lat + Math.cos(trackRad) * 8;
                    const endLon   = flight.lon + Math.sin(trackRad) * 8;
                    L.polyline([[flight.lat, flight.lon], [endLat, endLon]], {
                        color: '#ffff00', weight: 2, opacity: 0.7, dashArray: '6 4'
                    }).addTo(os.radarTrailLayer);
                }
            },

    renderFlightManifest: () => {
                const list = document.getElementById('flight-manifest-list');
                if (!list) return;
                list.innerHTML = '';
                if (!os.activeFlights || os.activeFlights.length === 0) {
                    const msg = os._radarLastError || 'No live ADS-B transponders returned.';
                    list.innerHTML = `<div class="p-4 text-center text-[10px] font-mono text-gray-500 leading-relaxed">OpenSky ADS-B feed offline<br><span class="text-[8px] text-gray-600">${os.escapeHtml(msg)}</span></div>`;
                    return;
                }
                const sorted = [...os.activeFlights].sort((a,b) => b.baroAlt - a.baroAlt);
                sorted.forEach(flight => {
                    const isSelected = os.selectedFlight && os.selectedFlight.icao === flight.icao;
                    const color = os.altToColor(flight.baroAlt);
                    const altFt = Math.round(flight.baroAlt * 3.28084);
                    const vrIcon = flight.vRate > 0.5 ? '▲' : flight.vRate < -0.5 ? '▼' : '►';

                    const el = document.createElement('button');
                    el.className = `w-full px-2 py-1.5 rounded text-left flex items-center gap-2 cursor-none hover-target transition ${isSelected ? 'bg-white/15 border border-white/20' : 'hover:bg-white/5 border border-transparent'}`;
                    el.dataset.search = `${flight.callsign || ''} ${flight.icao || ''} ${flight.origin || ''}`.toUpperCase();
                    el.onclick = () => os.selectFlight(flight);
                    el.innerHTML = `
                        <svg width="12" height="12" viewBox="0 0 24 24" style="flex-shrink:0;transform:rotate(${Number(flight.track)||0}deg)">
                            <path d="M12 2 L15 10 L22 10 L16 14 L18 22 L12 18 L6 22 L8 14 L2 10 L9 10 Z" fill="${color}" stroke="none"/>
                        </svg>
                        <div class="flex-1 overflow-hidden">
                            <div class="text-white font-bold text-[10px] truncate">${os.escapeHtml(flight.callsign)}</div>
                            <div class="text-[8px] text-gray-500 truncate">${os.escapeHtml(flight.origin)}</div>
                        </div>
                        <div class="text-right shrink-0">
                            <div class="text-[9px] font-mono font-bold" style="color:${color}">${vrIcon} ${altFt >= 1000 ? (altFt/1000).toFixed(0)+'k' : altFt} ft</div>
                            <div class="text-[8px] text-gray-500">${Number(flight.speed)||0} kt</div>
                        </div>
                    `;
                    list.appendChild(el);
                });
            },

    filterFlights: (query) => {
                const q = String(query || '').trim().toUpperCase();
                const list = document.getElementById('flight-manifest-list');
                if (!list) return;
                Array.from(list.children).forEach((btn) => {
                    if (!btn.dataset || btn.dataset.search === undefined) return;
                    btn.style.display = !q || btn.dataset.search.includes(q) ? '' : 'none';
                });
            },

    killISS: () => {
                if (os._issTimer) { clearInterval(os._issTimer); os._issTimer = null; }
                if (os._issPosTimer) { clearInterval(os._issPosTimer); os._issPosTimer = null; }
                if (os._issAnimFrame) {
                    if (typeof os._issAnimFrame === 'number') cancelAnimationFrame(os._issAnimFrame);
                    else clearInterval(os._issAnimFrame);
                    os._issAnimFrame = null;
                }
                if (os._issRO) { os._issRO.disconnect(); os._issRO = null; }
                if (os._issResizeObserver) { os._issResizeObserver.disconnect(); os._issResizeObserver = null; }
                if (os._iss3d) {
                    try {
                        if (os._iss3d.scene && os._iss3d.scene.traverse) {
                            os._iss3d.scene.traverse(obj => {
                                if (obj.geometry && obj.geometry.dispose) obj.geometry.dispose();
                                if (obj.material) {
                                    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
                                    mats.forEach(m => {
                                        if (m.map && m.map.dispose) m.map.dispose();
                                        if (m.bumpMap && m.bumpMap.dispose) m.bumpMap.dispose();
                                        if (m.specularMap && m.specularMap.dispose) m.specularMap.dispose();
                                        if (m.dispose) m.dispose();
                                    });
                                }
                            });
                        }
                        if (os._iss3d.renderer) {
                            os._iss3d.renderer.dispose();
                            if (os._iss3d.renderer.forceContextLoss) os._iss3d.renderer.forceContextLoss();
                            if (os._iss3d.renderer.domElement && os._iss3d.renderer.domElement.parentNode) {
                                os._iss3d.renderer.domElement.parentNode.removeChild(os._iss3d.renderer.domElement);
                            }
                        }
                    } catch(e) {}
                }
                os._iss3d = null;
                os._issMM = null;
            },

    killGlobe: () => {
                if (os.globeDataTimer) clearInterval(os.globeDataTimer);
                if (os.radarMap) { os.radarMap.remove(); os.radarMap = null; }
                const frame = document.getElementById('radar-embed-frame');
                if (frame) frame.src = 'about:blank';
                os.radarMarkersLayer = null;
                os.radarTrailLayer   = null;
                os.radarMarkerMap    = {};
                os.activeFlights     = [];
                os.selectedFlight    = null;
                os._leafletLoaded    = false;
                os.radarViewMode     = 'leaflet';
                os.radarEmbedReady   = false;
                os.radarEmbedLastUrl = '';
                os.radarProxyEndpoints = [];
            },

    marketWs: null,

    marketData: [],

    marketResizeObserver: null,

    initMarket: () => {
                if (os.marketWs) return;

                const canvas = document.getElementById('market-canvas');
                if (!canvas) return;
                
                const resize = () => {
                    const c = document.getElementById('market-canvas');
                    if(!c) return;
                    const rect = c.parentElement.getBoundingClientRect();
                    c.width = rect.width;
                    c.height = rect.height;
                    os.drawMarketChart();
                };
                
                if (!os.marketResizeObserver) {
                    os.marketResizeObserver = new ResizeObserver(resize);
                    os.marketResizeObserver.observe(canvas.parentElement);
                }
                resize(); 

                const statusLbl = document.getElementById('market-status-lbl');
                if(statusLbl) statusLbl.innerText = 'CONNECTING WSS...';

                os.marketWs = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@kline_1m');
                
                os.marketWs.onopen = () => {
                    os.logTerminal("Market Node: Binance uplink secured.");
                    if(statusLbl) statusLbl.innerText = 'BINANCE WSS STREAM (1M)';
                };
                
                os.marketWs.onmessage = (event) => {
                    if (window._networkBytes !== undefined) window._networkBytes += event.data.length;
                    const msg = JSON.parse(event.data);
                    const k = msg.k;
                    const candle = {
                        t: k.t,
                        o: parseFloat(k.o),
                        h: parseFloat(k.h),
                        l: parseFloat(k.l),
                        c: parseFloat(k.c)
                    };

                    const priceEl = document.getElementById('market-price');
                    const changeEl = document.getElementById('market-change');
                    
                    if (priceEl) {
                        priceEl.innerText = `$${candle.c.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                        const isUp = candle.c >= candle.o;
                        priceEl.className = `text-2xl font-mono font-bold leading-none tracking-tight ${isUp ? 'text-green-500' : 'text-red-500'}`;
                        
                        const diff = candle.c - candle.o;
                        const pct = (diff / candle.o) * 100;
                        changeEl.innerText = `${diff > 0 ? '+' : ''}${diff.toFixed(2)} (${pct.toFixed(3)}%)`;
                        changeEl.className = `text-[10px] font-mono uppercase mt-1 ${isUp ? 'text-green-500/80' : 'text-red-500/80'}`;
                    }

                    if (os.marketData.length === 0 || os.marketData[os.marketData.length-1].t !== candle.t) {
                        os.marketData.push(candle);
                        if(os.marketData.length > 60) os.marketData.shift(); 
                    } else {
                        os.marketData[os.marketData.length-1] = candle;
                    }

                    os.drawMarketChart();
                };

                os.marketWs.onerror = () => {
                    if(statusLbl) statusLbl.innerText = 'WSS CONNECTION FAILED';
                    os.logTerminal("Market Node: Binance WSS failed.");
                };
            },

    drawMarketChart: () => {
                const canvas = document.getElementById('market-canvas');
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                if (os.marketData.length === 0) return;

                const data = os.marketData;
                const min = Math.min(...data.map(d => d.l));
                const max = Math.max(...data.map(d => d.h));
                const range = max - min || 1;

                const paddingY = 20;
                const paddingX = 10;
                const drawAreaHeight = canvas.height - paddingY * 2;
                const candleWidth = Math.max(3, ((canvas.width - paddingX*2) / 60) - 2);

                data.forEach((d, i) => {
                    const xOffset = canvas.width - paddingX - ((data.length - 1 - i) * (candleWidth + 2)) - candleWidth;
                    const getY = (val) => canvas.height - paddingY - ((val - min) / range) * drawAreaHeight;
                    
                    const yO = getY(d.o);
                    const yC = getY(d.c);
                    const yH = getY(d.h);
                    const yL = getY(d.l);

                    const color = d.c >= d.o ? '#22c55e' : '#ef4444'; 
                    ctx.strokeStyle = color;
                    ctx.fillStyle = color;

                    ctx.beginPath();
                    ctx.moveTo(xOffset + candleWidth/2, yH);
                    ctx.lineTo(xOffset + candleWidth/2, yL);
                    ctx.stroke();

                    const bodyY = Math.min(yO, yC);
                    const bodyHeight = Math.max(1, Math.abs(yO - yC));
                    ctx.fillRect(xOffset, bodyY, candleWidth, bodyHeight);
                });
            },

    killMarket: () => {
                if (os.marketWs) {
                    os.marketWs.close();
                    os.marketWs = null;
                }
                if (os.marketResizeObserver) {
                    os.marketResizeObserver.disconnect();
                    os.marketResizeObserver = null;
                }
            }
});
