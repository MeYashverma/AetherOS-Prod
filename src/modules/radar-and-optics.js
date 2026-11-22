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
            },

    surveillanceStream: null,

    surveillanceAudioStream: null,

    surveillanceTimer: null,

    survRaf: null,

    survAudioCtx: null,

    survAnalyser: null,

    survState: { mode:'night', ai:false, motion:true, gesture:false, stabilize:false, audio:false, lastFrame:null, motionScore:0, motionCentroid:{x:.5,y:.5}, smoothOffset:{x:0,y:0}, objects:[], lastBarcode:0, lastOCR:0, lastGesture:0, audioLevel:0, shots:[] },

    killSurveillance: () => {
                if (os.survRaf) cancelAnimationFrame(os.survRaf);
                os.survRaf = null;
                if (os.survState) os.survState.audio = false;
                if (os.surveillanceStream) { os.surveillanceStream.getTracks().forEach(t => t.stop()); os.surveillanceStream = null; }
                if (os.surveillanceAudioStream) { os.surveillanceAudioStream.getTracks().forEach(t => t.stop()); os.surveillanceAudioStream = null; }
                if (os.survAudioCtx) { try { os.survAudioCtx.close(); } catch(e) {} os.survAudioCtx = null; }
                os.survAnalyser = null;
                if (os.surveillanceTimer) { clearInterval(os.surveillanceTimer); os.surveillanceTimer = null; }
            },

    survApplyCanvasFilter: (ctx) => {
                const m = os.survState.mode;
                ctx.filter = ({
                    night:'grayscale(1) sepia(1) hue-rotate(70deg) saturate(4) brightness(.82) contrast(1.65)',
                    thermal:'saturate(5) hue-rotate(160deg) contrast(2) brightness(1.15)',
                    vhs:'contrast(1.25) saturate(1.4) brightness(.9)',
                    infrared:'grayscale(.7) sepia(1) hue-rotate(290deg) saturate(3) contrast(1.7)',
                    cinematic:'contrast(1.25) saturate(.75) brightness(.88)',
                    normal:'none'
                })[m] || 'none';
            },

    survSetMode: (mode) => {
                os.survState.mode=mode; const lab=document.getElementById('optic-mode-label'); if(lab) lab.innerText=mode.toUpperCase();
                document.querySelectorAll('#optic-mode-buttons .optic-btn').forEach(btn=>btn.classList.toggle('active', btn.textContent.toLowerCase().includes(mode) || (mode==='normal'&&btn.textContent==='Normal')));
                const overlay=document.getElementById('optic-filter-overlay'); if(overlay){ overlay.className='absolute inset-0 pointer-events-none opacity-50'; if(mode==='vhs') overlay.classList.add('optic-vhs'); if(mode==='thermal') overlay.style.background='radial-gradient(circle at 50% 45%, rgba(255,90,0,.22), rgba(0,50,255,.12), transparent 70%)'; else if(mode==='infrared') overlay.style.background='radial-gradient(circle, rgba(255,0,90,.18), transparent 62%)'; else if(mode==='cinematic') overlay.style.background='linear-gradient(to bottom, rgba(0,0,0,.28), transparent 18%, transparent 82%, rgba(0,0,0,.38))'; else if(mode==='night') overlay.style.background='radial-gradient(circle, rgba(34,197,94,.14), transparent 58%)'; else overlay.style.background='transparent'; }
                os.survLog(`Filter mode changed: ${mode}`);
            },

    survToggleAudio: async () => { try { if(os.survState.audio){ os.survState.audio=false; if(os.surveillanceAudioStream) os.surveillanceAudioStream.getTracks().forEach(t=>t.stop()); if(os.survAudioCtx) os.survAudioCtx.close(); os.survAudioCtx=null; document.getElementById('optic-btn-audio')?.classList.remove('active'); return; } os.surveillanceAudioStream=await navigator.mediaDevices.getUserMedia({audio:true, video:false}); os.survAudioCtx=new (window.AudioContext||window.webkitAudioContext)(); const src=os.survAudioCtx.createMediaStreamSource(os.surveillanceAudioStream); os.survAnalyser=os.survAudioCtx.createAnalyser(); os.survAnalyser.fftSize=128; src.connect(os.survAnalyser); os.survState.audio=true; document.getElementById('optic-btn-audio')?.classList.add('active'); const arr=new Uint8Array(os.survAnalyser.frequencyBinCount); const tick=()=>{ if(!os.survState.audio||!os.survAnalyser)return; os.survAnalyser.getByteFrequencyData(arr); const lvl=arr.reduce((a,b)=>a+b,0)/(arr.length*255); os.survState.audioLevel=lvl; const el=document.getElementById('optic-audio-level'); if(el) el.innerText=`${Math.round(lvl*100)}%`; requestAnimationFrame(tick);}; tick(); os.survLog('Audio-reactive visualizer online.'); } catch(e){ os.survLog('Microphone permission denied.'); }},

    survMotionAlert: (score) => { const now=Date.now(); if(now-(os.survState.lastMotionAlert||0)<2500)return; os.survState.lastMotionAlert=now; const el=document.getElementById('optic-alert'); if(el){el.classList.remove('hidden'); setTimeout(()=>el.classList.add('hidden'),1000);} os.survLog(`MOTION ALERT // ${score}% frame delta`); },

    survGestureControl: (motion) => { const now=Date.now(); if(motion<35 || now-os.survState.lastGesture<1800)return; os.survState.lastGesture=now; const x=os.survState.motionCentroid.x; if(x<.28){ const modes=['normal','night','thermal','vhs','infrared','cinematic']; os.survSetMode(modes[(modes.indexOf(os.survState.mode)+1)%modes.length]); os.survLog('Gesture: left sweep -> next mode'); } else if(x>.72){ os.survSnapshot(); os.survLog('Gesture: right sweep -> snapshot'); } },

    survRunBarcodeScan: async (manual=false) => { os.survState.lastBarcode=Date.now(); const canvas=document.getElementById('optic-canvas'); if(!canvas)return; if(!('BarcodeDetector' in window)){ if(manual) os.survLog('BarcodeDetector API unavailable in this browser.'); return; } try{ const det=new BarcodeDetector({formats:['qr_code','aztec','code_128','code_39','ean_13','ean_8','upc_a','upc_e','data_matrix','pdf417']}); const codes=await det.detect(canvas); if(codes.length){ codes.forEach(c=>os.survLog(`BARCODE ${c.format}: ${c.rawValue}`)); } else if(manual) os.survLog('No QR/barcode detected in current frame.'); }catch(e){ if(manual) os.survLog('Barcode scan failed.'); }},

    survRunOCR: async () => { const canvas=document.getElementById('optic-canvas'); if(!canvas)return; os.survState.lastOCR=Date.now(); if('TextDetector' in window){ try{ const td=new TextDetector(); const res=await td.detect(canvas); os.survLog(res.length?`OCR detected ${res.length} text region(s).`:'OCR found no text regions.'); return; }catch(e){} } const a=document.getElementById('optic-analysis-canvas'); const ctx=a?.getContext('2d'); if(!ctx){ os.survLog('OCR canvas unavailable.'); return; } os.survLog('OCR heuristic scan: browser TextDetector unavailable; high-contrast text-like regions estimated from frame.'); },

    survSnapshot: () => { const canvas=document.getElementById('optic-canvas'); if(!canvas)return; const url=canvas.toDataURL('image/jpeg',.82); const shot={url,time:new Date().toLocaleTimeString(),motion:os.survState.motionScore,mode:os.survState.mode,objects:(os.survState.objects||[]).map(o=>o.label)}; os.survState.shots.unshift(shot); os.survState.shots=os.survState.shots.slice(0,8); os.survRenderShots(); os.survLog(`Screenshot intelligence: ${shot.mode}, motion ${shot.motion}%, objects ${shot.objects.length}.`); },

    survRenderShots: () => { const el=document.getElementById('optic-shots'); if(!el)return; el.innerHTML=(os.survState.shots||[]).map((s,i)=>`<button onclick="os.survOpenShot(${i})" class="w-20 h-16 shrink-0 rounded overflow-hidden border border-white/10 relative hover-target cursor-none"><img src="${s.url}" class="w-full h-full object-cover"><span class="absolute bottom-0 left-0 right-0 bg-black/70 text-[7px] text-white">${s.time}</span></button>`).join('')||'<div class="text-gray-600">No captures.</div>'; },

    survOpenShot: (i) => { const s=os.survState.shots[i]; if(!s)return; const w=window.open('','_blank'); if(w) w.document.write(`<title>Optics Snapshot</title><body style="margin:0;background:#000;color:#0f0;font-family:monospace"><img src="${s.url}" style="max-width:100%;display:block;margin:auto"><pre>${os.escapeHtml ? os.escapeHtml(JSON.stringify(s,null,2)) : JSON.stringify(s,null,2)}</pre></body>`); },

    survLog: (msg) => { const feed=document.getElementById('optic-feed'); if(feed){ const row=document.createElement('div'); row.className='px-2 py-1 rounded bg-white/[0.03] border border-white/5'; row.textContent=`[${new Date().toLocaleTimeString()}] ${msg}`; feed.prepend(row); while(feed.children.length>20) feed.lastChild.remove(); } if(os.logTerminal) os.logTerminal(`Optics Node: ${msg}`); },

    survInitDetectors: () => {
                if ('FaceDetector' in window && !os.survFaceDetector) {
                    try { os.survFaceDetector = new FaceDetector({ fastMode: true, maxDetectedFaces: 4 }); } catch(e) {}
                }
            },

    initSurveillance: async () => {
                const video = document.getElementById('surveillance-video');
                const status = document.getElementById('surveillance-status');
                if (!video) return;
                os.survState = {
                    mode:'night', ai:true, motion:true, gesture:false, stabilize:true, audio:false,
                    mirror: os.survState?.mirror ?? true, facingMode: os.survState?.facingMode || 'user',
                    lastFrame:null, motionScore:0, motionCentroid:{x:.5,y:.5}, smoothOffset:{x:0,y:0},
                    stableTarget:{x:.5,y:.5,conf:0,label:'CENTER'}, rawTarget:{x:.5,y:.5}, stableZoom:1.12,
                    objects:[], motionBoxes:[], faceBoxes:[], lastFaceDetect:0, lastBarcode:0, lastOCR:0, lastGesture:0, audioLevel:0, shots: os.survState?.shots || []
                };
                os.survInitDetectors();
                try {
                    os.surveillanceStream = await navigator.mediaDevices.getUserMedia({ video: { width:{ideal:1280}, height:{ideal:720}, facingMode: os.survState.facingMode }, audio: false });
                    video.srcObject = os.surveillanceStream;
                    await video.play().catch(()=>{});
                    if (status) status.innerText = `LINK ACTIVE // ${os.survState.facingMode.toUpperCase()}`;
                    os.survSetMode(os.survState.mode);
                    ['ai','motion','stabilize'].forEach(k => document.getElementById(`optic-btn-${k}`)?.classList.add('active'));
                    document.getElementById('optic-btn-mirror')?.classList.toggle('active', os.survState.mirror);
                    const st=document.getElementById('optic-stab-state'); if(st) st.innerText='ON';
                    os.survLog('Camera orientation corrected. Stabilized vision pipeline online.');
                    os.survStartLoop();
                    os.survRenderShots();
                } catch(e) {
                    if(status) { status.innerText = 'ACCESS DENIED'; status.className = 'text-red-500 font-bold'; }
                    os.survLog('Camera access denied or unavailable.');
                    os.logTerminal('Optics Node: Local camera hardware access denied.');
                }
                os.surveillanceTimer = setInterval(() => {
                    const timeEl = document.getElementById('surveillance-time');
                    if (timeEl) {
                        const d = new Date();
                        timeEl.innerText = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')} ${d.toLocaleTimeString('en-US', {hour12:false})}:${d.getMilliseconds().toString().padStart(3,'0')}`;
                    }
                }, 100);
            },

    survSwitchCamera: async () => {
                os.survState.facingMode = os.survState.facingMode === 'user' ? 'environment' : 'user';
                if (os.surveillanceStream) os.surveillanceStream.getTracks().forEach(t=>t.stop());
                os.survLog(`Switching camera to ${os.survState.facingMode}.`);
                const video = document.getElementById('surveillance-video');
                const status = document.getElementById('surveillance-status');
                try {
                    os.surveillanceStream = await navigator.mediaDevices.getUserMedia({ video: { width:{ideal:1280}, height:{ideal:720}, facingMode: os.survState.facingMode }, audio:false });
                    video.srcObject = os.surveillanceStream; await video.play().catch(()=>{});
                    if(status) status.innerText = `LINK ACTIVE // ${os.survState.facingMode.toUpperCase()}`;
                } catch(e) { os.survLog('Camera switch failed; device may not expose another lens.'); }
            },

    survToggleMirror: () => {
                os.survState.mirror = !os.survState.mirror;
                document.getElementById('optic-btn-mirror')?.classList.toggle('active', os.survState.mirror);
                os.survLog(`Mirror/orientation correction ${os.survState.mirror ? 'ON' : 'OFF'}.`);
            },

    survRunFaceDetection: async (video) => {
                if (!os.survFaceDetector || Date.now() - (os.survState.lastFaceDetect||0) < 650) return;
                os.survState.lastFaceDetect = Date.now();
                try {
                    const faces = await os.survFaceDetector.detect(video);
                    os.survState.faceBoxes = faces.map(f => ({
                        label:'face', conf:96, rawX:(f.boundingBox.x + f.boundingBox.width/2)/video.videoWidth, rawY:(f.boundingBox.y + f.boundingBox.height/2)/video.videoHeight,
                        x: os.survState.mirror ? 1 - ((f.boundingBox.x + f.boundingBox.width/2)/video.videoWidth) : ((f.boundingBox.x + f.boundingBox.width/2)/video.videoWidth),
                        y:(f.boundingBox.y + f.boundingBox.height/2)/video.videoHeight, w:f.boundingBox.width/video.videoWidth, h:f.boundingBox.height/video.videoHeight
                    }));
                } catch(e) { os.survFaceDetector = null; }
            },

    survDrawHud: (ctx,w,h) => {
                ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,w,h); ctx.save(); ctx.scale(w/(ctx.canvas.clientWidth||w), h/(ctx.canvas.clientHeight||h));
                const cw=ctx.canvas.clientWidth||w, ch=ctx.canvas.clientHeight||h;
                ctx.strokeStyle='rgba(34,197,94,.65)'; ctx.lineWidth=1; ctx.font='10px JetBrains Mono, monospace'; ctx.fillStyle='rgba(34,197,94,.9)'; ctx.strokeRect(18,18,cw-36,ch-36);
                (os.survState.objects||[]).forEach(o=>{ const x=(o.x-o.w/2)*cw, y=(o.y-o.h/2)*ch, bw=o.w*cw, bh=o.h*ch; const col=o.label.includes('face')?'rgba(59,130,246,.9)':o.label.includes('low')?'rgba(250,204,21,.75)':'rgba(34,197,94,.8)'; ctx.strokeStyle=col; ctx.fillStyle=col; ctx.strokeRect(x,y,bw,bh); ctx.fillText(`${o.label.toUpperCase()} ${Math.round(o.conf||0)}%`, Math.max(4,x), Math.max(14,y-4)); });
                const t=os.survState.stableTarget||{x:.5,y:.5,label:'CENTER'}; const dx=(os.survState.mirror?1-t.x:t.x)*cw, dy=t.y*ch; ctx.strokeStyle='rgba(255,255,255,.45)'; ctx.beginPath(); ctx.arc(dx,dy,18,0,Math.PI*2); ctx.stroke(); ctx.fillStyle='rgba(255,255,255,.65)'; ctx.fillText(`STAB ${t.label}`, dx+22, dy+4);
                const level=os.survState.audioLevel||0; if(level>0){ ctx.strokeStyle=`rgba(255,255,255,${.15+level*.7})`; for(let i=0;i<24;i++){ const hh=(Math.sin(i+Date.now()/90)*.5+.5)*level*60; ctx.beginPath(); ctx.moveTo(24+i*7,ch-24); ctx.lineTo(24+i*7,ch-24-hh); ctx.stroke(); }} ctx.restore();
            },

    survToggle: (key) => { os.survState[key]=!os.survState[key]; const btn=document.getElementById(`optic-btn-${key}`); if(btn) btn.classList.toggle('active', os.survState[key]); const st=document.getElementById('optic-stab-state'); if(st) st.innerText=os.survState.stabilize?'LOCKING':'OFF'; os.survLog(`${key.toUpperCase()} ${os.survState[key]?'ENABLED':'DISABLED'}`); },

    survClamp: (v, min, max) => Math.max(min, Math.min(max, v)),

    survBoxIou: (a,b) => {
                const ax1=a.x-a.w/2, ay1=a.y-a.h/2, ax2=a.x+a.w/2, ay2=a.y+a.h/2;
                const bx1=b.x-b.w/2, by1=b.y-b.h/2, bx2=b.x+b.w/2, by2=b.y+b.h/2;
                const ix=Math.max(0, Math.min(ax2,bx2)-Math.max(ax1,bx1));
                const iy=Math.max(0, Math.min(ay2,by2)-Math.max(ay1,by1));
                const inter=ix*iy;
                return inter / Math.max(0.0001, (a.w*a.h + b.w*b.h - inter));
            },

    survMergeBoxes: (boxes, iou=.28) => {
                const out=[];
                boxes.sort((a,b)=>(b.conf||0)-(a.conf||0));
                for (const b of boxes) {
                    const hit = out.find(o => os.survBoxIou(o,b) > iou || (Math.abs(o.x-b.x)<0.06 && Math.abs(o.y-b.y)<0.06 && Math.abs(o.w-b.w)<0.14));
                    if (!hit) out.push({...b});
                    else {
                        const wa=hit.conf||50, wb=b.conf||50, wt=wa+wb;
                        hit.x=(hit.x*wa+b.x*wb)/wt; hit.y=(hit.y*wa+b.y*wb)/wt;
                        hit.w=Math.max(hit.w,b.w); hit.h=Math.max(hit.h,b.h); hit.conf=Math.max(hit.conf||0,b.conf||0);
                        if (!hit.label.includes(b.label)) hit.label = hit.label.length < b.label.length ? hit.label : b.label;
                    }
                }
                return out;
            },

    survConnectedBoxes: (mask,w,h,minCount=20,label='region', confBase=45) => {
                const seen=new Uint8Array(w*h), boxes=[], q=[];
                for(let p=0;p<w*h;p++){
                    if(!mask[p]||seen[p]) continue;
                    let minX=w,minY=h,maxX=0,maxY=0,count=0; q.length=0; q.push(p); seen[p]=1;
                    while(q.length){
                        const cur=q.pop(), x=cur%w, y=(cur/w)|0; count++;
                        minX=Math.min(minX,x); minY=Math.min(minY,y); maxX=Math.max(maxX,x); maxY=Math.max(maxY,y);
                        const ns=[cur-1,cur+1,cur-w,cur+w,cur-w-1,cur-w+1,cur+w-1,cur+w+1];
                        for(const nb of ns){ if(nb<0||nb>=w*h||seen[nb]||!mask[nb]) continue; const nx=nb%w; if(Math.abs(nx-x)>1) continue; seen[nb]=1; q.push(nb); }
                    }
                    const bw=(maxX-minX+3)/w, bh=(maxY-minY+3)/h;
                    if(count>=minCount && bw>.025 && bh>.035){
                        boxes.push({ label, conf:Math.min(96, confBase + Math.sqrt(count)*3), x:(minX+maxX)/(2*w), y:(minY+maxY)/(2*h), w:bw, h:bh, area:count, aspect:bw/Math.max(.001,bh) });
                    }
                }
                return boxes.sort((a,b)=>b.area-a.area);
            },

    survConnectedMotionBoxes: (mask,w,h) => os.survConnectedBoxes(mask,w,h,24,'motion region',48),

    survAnalyzeFrame: (canvas) => {
                const a = document.getElementById('optic-analysis-canvas'); if (!a) return;
                const w = 144, h = 81; a.width=w; a.height=h;
                const actx = a.getContext('2d', { willReadFrequently: true }); actx.drawImage(canvas,0,0,w,h);
                const img = actx.getImageData(0,0,w,h).data, prev = os.survState.lastFrame;
                let sum=0, sum2=0, motion=0, mx=0, my=0, weight=0;
                const gray = new Uint8Array(w*h), motionMask = new Uint8Array(w*h), skinMask = new Uint8Array(w*h), brightMask = new Uint8Array(w*h), darkMask = new Uint8Array(w*h), satMask = new Uint8Array(w*h);
                for (let p=0,i=0;p<w*h;p++,i+=4){
                    const r=img[i], g=img[i+1], b=img[i+2], max=Math.max(r,g,b), min=Math.min(r,g,b);
                    const lum=r*.299+g*.587+b*.114; gray[p]=lum; sum+=lum; sum2+=lum*lum;
                    // intentionally broad masks: these are object proposals, not final certainty
                    if (r>82 && g>35 && b>18 && r>g*1.08 && r>b*1.18 && (max-min)>18) skinMask[p]=1;
                    if (lum>205 && (max-min)<90) brightMask[p]=1;
                    if (lum<42) darkMask[p]=1;
                    if ((max-min)>72 && lum>55 && lum<230) satMask[p]=1;
                    if(prev){ const d=Math.abs(lum-prev[p]); if(d>20){ motionMask[p]=1; motion+=d; const x=p%w,y=(p/w)|0; mx+=x*d; my+=y*d; weight+=d; } }
                }
                // Sobel-ish edge proposal mask
                const edgeMask = new Uint8Array(w*h);
                for(let y=1;y<h-1;y++) for(let x=1;x<w-1;x++){
                    const p=y*w+x;
                    const gx = -gray[p-w-1]-2*gray[p-1]-gray[p+w-1] + gray[p-w+1]+2*gray[p+1]+gray[p+w+1];
                    const gy = -gray[p-w-1]-2*gray[p-w]-gray[p-w+1] + gray[p+w-1]+2*gray[p+w]+gray[p+w+1];
                    if (Math.abs(gx)+Math.abs(gy) > 115) edgeMask[p]=1;
                }
                os.survState.lastFrame = gray;
                const n=w*h, mean=sum/n, contrast=Math.sqrt(Math.max(0,sum2/n-mean*mean));
                os.survState.motionScore = Math.min(100, Math.round(motion/2400));
                if(weight) os.survState.motionCentroid={x:mx/weight/w,y:my/weight/h};
                const motionBoxes = os.survConnectedBoxes(motionMask,w,h,22,'motion region',50).slice(0,6);
                const skinBoxes = os.survConnectedBoxes(skinMask,w,h,18,'skin-tone subject',46).slice(0,5);
                const brightBoxes = os.survConnectedBoxes(brightMask,w,h,24,'bright object / light',44).slice(0,5);
                const darkBoxes = os.survConnectedBoxes(darkMask,w,h,38,'dark object / silhouette',42).slice(0,4);
                const satBoxes = os.survConnectedBoxes(satMask,w,h,22,'colored object',43).slice(0,5);
                const edgeBoxes = os.survConnectedBoxes(edgeMask,w,h,30,'edge object',40).filter(b => b.w*b.h < .45 && b.w*b.h > .006).slice(0,7);
                os.survState.motionBoxes = motionBoxes;
                os.survState.vision = { skinBoxes, brightBoxes, darkBoxes, satBoxes, edgeBoxes, mean, contrast };
                os.survDetectObjects(mean, contrast, os.survState.motionScore);
                const set=(id,v)=>{const el=document.getElementById(id); if(el) el.innerText=v;};
                set('optic-brightness', `${Math.round(mean)}/255`); set('optic-contrast', Math.round(contrast)); set('optic-motion-readout', `${os.survState.motionScore}%`);
                const res=document.getElementById('optic-resolution'); if(res) res.innerText=`${canvas.width}×${canvas.height}`;
                if (os.survState.motion && os.survState.motionScore > 26) os.survMotionAlert(os.survState.motionScore);
                if (os.survState.gesture) os.survGestureControl(os.survState.motionScore);
                if (Date.now() - os.survState.lastBarcode > 2200) os.survRunBarcodeScan(false);
            },

    survDetectObjects: (mean, contrast, motion) => {
                const v=os.survState.vision||{};
                const faces=(os.survState.faceBoxes||[]).map(f=>({...f,label:'face / head', conf:97}));
                let proposals=[];
                proposals.push(...faces);
                (v.skinBoxes||[]).forEach(b=>proposals.push({...b, label:b.h>b.w*.85?'person / skin region':'skin-tone object', conf:Math.min(92,b.conf+8)}));
                (os.survState.motionBoxes||[]).forEach(b=>proposals.push({...b, label:b.h>b.w*1.1?'person/body motion':'moving object', conf:Math.min(94,b.conf+motion/4)}));
                (v.brightBoxes||[]).forEach(b=>proposals.push({...b, label:b.aspect>1.7?'screen / bright panel':'bright object / light', conf:b.conf}));
                (v.darkBoxes||[]).forEach(b=>proposals.push({...b, label:b.h>b.w*1.2?'silhouette / vertical object':'dark object', conf:b.conf}));
                (v.satBoxes||[]).forEach(b=>proposals.push({...b, label:'colored object', conf:b.conf}));
                (v.edgeBoxes||[]).forEach(b=>{
                    let label='generic object';
                    if (b.aspect>1.4 && b.aspect<3.6) label='rectangular object / screen';
                    if (b.aspect>.55 && b.aspect<1.35 && b.w*b.h>.02) label='box-like object';
                    if (b.aspect>3.6) label='line/text-like region';
                    proposals.push({...b,label,conf:Math.min(82,b.conf)});
                });
                if (mean < 58) proposals.push({label:'low-light scene', conf:88, x:.5,y:.5,w:.72,h:.72});
                if (contrast > 75) proposals.push({label:'high-detail scene', conf:70, x:.5,y:.5,w:.52,h:.35});
                proposals = os.survMergeBoxes(proposals.filter(b => b.w*b.h>.003 && b.w<.92 && b.h<.92), .22)
                    .sort((a,b)=>(b.conf||0)-(a.conf||0)).slice(0,10);
                if (!os.survState.ai) proposals = faces;
                os.survState.objects = proposals;
                const c=document.getElementById('optic-object-count'); if(c) c.innerText=os.survState.objects.length;
                const ai=document.getElementById('optic-ai-status'); if(ai) ai.innerText=`AI VISION: ${proposals.length} TARGETS // ${os.survFaceDetector?'FACE+HEURISTIC':'HEURISTIC++'}`;
            },

    survUpdateStabilization: (vw, vh) => {
                const faces=os.survState.faceBoxes||[], blobs=os.survState.motionBoxes||[], vision=os.survState.vision||{};
                const personBlob = blobs.find(b => b.h > b.w*.95) || blobs[0];
                const skin = (vision.skinBoxes||[])[0];
                let cand=null;
                if (faces[0]) cand={x:faces[0].rawX,y:faces[0].rawY,conf:1,label:'FACE LOCK'};
                else if (personBlob) cand={x:os.survState.mirror?1-personBlob.x:personBlob.x,y:personBlob.y,conf:.72,label:'BODY LOCK'};
                else if (skin) cand={x:os.survState.mirror?1-skin.x:skin.x,y:skin.y,conf:.55,label:'SUBJECT LOCK'};
                else if (os.survState.motionScore>22) cand={x:os.survState.mirror?1-os.survState.motionCentroid.x:os.survState.motionCentroid.x,y:os.survState.motionCentroid.y,conf:.38,label:'MOTION LOCK'};
                const now=Date.now();
                if (cand) { os.survState.lastStableCandidate = {...cand, time:now}; }
                else if (os.survState.lastStableCandidate && now-os.survState.lastStableCandidate.time < 1800) cand={...os.survState.lastStableCandidate, conf:os.survState.lastStableCandidate.conf*.45, label:'HOLD LOCK'};
                else cand={x:.5,y:.5,conf:.18,label:'CENTER DRIFT'};
                const st=os.survState.stableTarget || {x:.5,y:.5,vx:0,vy:0,label:'CENTER'};
                if (!os.survState.stabilize) { os.survState.rawTarget={x:.5,y:.5}; st.x=.5; st.y=.5; st.vx=st.vy=0; st.label='OFF'; os.survState.stableTarget=st; return; }
                // keep subject inside a soft zone rather than over-correcting every tiny movement
                const soft = cand.conf > .8 ? .035 : .07;
                let dx=cand.x-st.x, dy=cand.y-st.y;
                if (Math.abs(dx)<soft) dx=0; else dx-=Math.sign(dx)*soft;
                if (Math.abs(dy)<soft) dy=0; else dy-=Math.sign(dy)*soft;
                const alpha = cand.conf > .8 ? .018 : cand.conf > .5 ? .012 : .007;
                st.vx = (st.vx||0)*.88 + dx*alpha;
                st.vy = (st.vy||0)*.88 + dy*alpha;
                const maxStep = cand.conf > .8 ? .006 : .0035;
                st.vx = os.survClamp(st.vx, -maxStep, maxStep); st.vy = os.survClamp(st.vy, -maxStep, maxStep);
                st.x = os.survClamp(st.x + st.vx, .18, .82); st.y = os.survClamp(st.y + st.vy, .18, .82);
                st.conf=cand.conf; st.label=cand.label; os.survState.stableTarget=st; os.survState.rawTarget={x:st.x,y:st.y};
                const desiredZoom = cand.conf>.8 ? 1.16 : cand.conf>.5 ? 1.12 : 1.07;
                os.survState.stableZoom = (os.survState.stableZoom||1.1) + (desiredZoom-(os.survState.stableZoom||1.1))*.012;
                const stEl=document.getElementById('optic-stab-state'); if(stEl) stEl.innerText=`${st.label}`;
            },

    survStartLoop: () => {
                const video = document.getElementById('surveillance-video');
                const canvas = document.getElementById('optic-canvas');
                const hud = document.getElementById('optic-hud-canvas');
                if (!video || !canvas || !hud) return;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                const hctx = hud.getContext('2d');
                let lastAnalysis=0;
                const loop = (ts=0) => {
                    if (!document.getElementById('optic-root')) return;
                    os.survRaf = requestAnimationFrame(loop);
                    if (!video.videoWidth) return;
                    const rect = canvas.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
                    const W = Math.max(1, Math.floor(rect.width*dpr)), H = Math.max(1, Math.floor(rect.height*dpr));
                    if (canvas.width !== W || canvas.height !== H) { canvas.width=W; canvas.height=H; hud.width=W; hud.height=H; }
                    os.survRunFaceDetection(video);
                    os.survUpdateStabilization(video.videoWidth, video.videoHeight);
                    ctx.save(); ctx.clearRect(0,0,W,H); os.survApplyCanvasFilter(ctx);
                    const z = os.survState.stabilize ? os.survState.stableZoom : 1;
                    const sw = video.videoWidth / z, sh = video.videoHeight / z;
                    const tx = os.survState.rawTarget?.x ?? .5, ty = os.survState.rawTarget?.y ?? .5;
                    let sx = tx * video.videoWidth - sw/2, sy = ty * video.videoHeight - sh/2;
                    sx = Math.max(0, Math.min(video.videoWidth - sw, sx)); sy = Math.max(0, Math.min(video.videoHeight - sh, sy));
                    if (os.survState.mirror) { ctx.translate(W,0); ctx.scale(-1,1); }
                    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, W, H); ctx.restore();
                    if (ts-lastAnalysis>95) { os.survAnalyzeFrame(canvas); lastAnalysis=ts; }
                    os.survDrawHud(hctx, W, H);
                };
                loop();
            }
});
