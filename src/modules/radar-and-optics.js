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

                    // Standard OpenStreetMap tiles: no CARTO account or API key required.
                    const map = L.map(mapEl, {
                        center: [20, 0],
                        zoom: 2,
                        zoomControl: false,
                        attributionControl: false
                    });

                    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        maxZoom: 19,
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
                    }).addTo(map);

                    // Attribution (small, bottom right)
                    L.control.attribution({ prefix: false, position: 'bottomright' }).addTo(map);
                    map.attributionControl.addAttribution('Flight data: <a href="https://opensky-network.org">OpenSky</a> / <a href="https://airplanes.live">Airplanes.live</a>');

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
                    os.switchRadarView('leaflet');
                    if (window.lucide) lucide.createIcons({ root: document.getElementById('globe-root') });
                    os.logTerminal('Flight Radar: Live ADS-B map initialized.');
                });
            },

    radarJumpRegion: (lat, lon, zoom = 4) => {
        if (!os.radarMap) return;
        os.radarMap.setView([lat, lon], zoom, { animate: true, duration: 0.7 });
        os._radarFocusCenter = { lat, lon, zoom };
        os.fetchGlobeData();
    },

    initRadarEmbed: async () => {
        const frame = document.getElementById('radar-embed-frame');
        if (!frame) return false;
        const target = 'https://globe.adsbexchange.com/';
        if (frame.src !== target) frame.src = target;
        os.radarEmbedReady = true;
        os.radarEmbedLastUrl = target;
        return true;
    },

    switchRadarView: async (mode) => {
        const nextMode = mode === 'embed' ? 'embed' : 'leaflet';
        const leafletEl = document.getElementById('radar-leaflet-map');
        const embedShell = document.getElementById('radar-embed-shell');
        const warnStrip = document.getElementById('radar-embed-warning');
        const detailPanel = document.getElementById('radar-detail-panel');
        const btnLeaflet = document.getElementById('radar-mode-leaflet-btn');
        const btnEmbed = document.getElementById('radar-mode-embed-btn');

        if (!leafletEl || !embedShell) return;

        if (btnLeaflet) btnLeaflet.classList.toggle('active', nextMode === 'leaflet');
        if (btnEmbed) btnEmbed.classList.toggle('active', nextMode === 'embed');

        if (nextMode === 'embed') {
            await os.initRadarEmbed();
            leafletEl.classList.add('hidden');
            embedShell.classList.remove('hidden');
            if (warnStrip) warnStrip.classList.remove('hidden');
            if (os.globeDataTimer) { clearInterval(os.globeDataTimer); os.globeDataTimer = null; }
            const embedNote = document.getElementById('radar-detail-embed-note');
            if (embedNote) embedNote.classList.remove('hidden');
            os.radarViewMode = 'embed';
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
    },

    fetchGlobeData: async () => {
        if (!os._leafletLoaded || !os.radarMap) return;

        const refreshBtn = document.getElementById('globe-refresh-btn');
        if (refreshBtn) {
            const ic = refreshBtn.querySelector('i');
            if (ic) ic.classList.add('animate-spin');
        }

        const applyFlights = (flights, providerLabel) => {
            os._radarLastError = '';
            os.activeFlights = flights;
            os.redrawMarkers();
            os.renderFlightManifest();
            const titleEl = document.getElementById('globe-event-title');
            const magEl = document.getElementById('globe-event-mag');
            const timeEl = document.getElementById('globe-event-time');
            const cntEl = document.getElementById('globe-flight-count');
            if (titleEl && !os.selectedFlight) titleEl.innerText = providerLabel;
            if (magEl) magEl.innerText = `${flights.length} aircraft`;
            if (timeEl) timeEl.innerText = new Date().toLocaleTimeString('en-US', { hour12: false });
            if (cntEl) cntEl.innerText = `${flights.length} live`;
        };

        try {
            // Try OpenSky global feed first when zoomed out, or Airplanes.live regional feed when zoomed in / rate-limited
            const center = os.radarMap.getCenter();
            const zoom = os.radarMap.getZoom();
            let loaded = false;
            const feedErrors = new Set();
            const httpIssue = (provider, status) => `${provider}: HTTP ${status}${status === 401 || status === 403 ? " (access denied)" : status === 429 ? " (rate limited)" : ""}`;

            if (zoom <= 3) {
                try {
                    const res = await fetch('https://opensky-network.org/api/states/all', {
                        signal: AbortSignal.timeout(9000),
                        cache: 'no-store'
                    });
                    if (res.ok) {
                        const raw = await res.json();
                        if (Array.isArray(raw?.states) && raw.states.length) {
                            const parsed = raw.states
                                .filter((s) => s[5] != null && s[6] != null && s[7] != null && s[7] > 50)
                                .slice(0, 1200)
                                .map((s) => ({
                                    icao: s[0] || '------',
                                    callsign: (s[1] || '').trim() || s[0],
                                    origin: s[2] || 'Unknown',
                                    lon: s[5],
                                    lat: s[6],
                                    baroAlt: s[7] || 0,
                                    geoAlt: s[13] || s[7] || 0,
                                    onGround: s[8],
                                    speed: s[9] ? Math.round(s[9] * 1.94384) : 0,
                                    track: s[10] || 0,
                                    vRate: s[11] || 0,
                                    squawk: s[14] || '----',
                                    posSource: ['ADS-B', 'ASTERIX', 'MLAT', 'FLARM'][s[16]] || 'ADS-B'
                                }));
                            if (parsed.length) {
                                applyFlights(parsed, 'OpenSky ADS-B');
                                loaded = true;
                            }
                        }
                    } else feedErrors.add(httpIssue('OpenSky', res.status));
                } catch (_) { feedErrors.add('OpenSky: network, CORS or timeout error'); }
            }

            if (!loaded) {
                // Airplanes.live CORS-open regional ADS-B feed (250 NM radius around current map center or busy hubs)
                const hubs = zoom > 3
                    ? [[center.lat, center.lng]]
                    : [[51.47, -0.45], [40.64, -73.78], [28.55, 77.10], [35.55, 139.78]];
                const seen = new Set();
                const merged = [];
                await Promise.all(hubs.map(async ([la, lo]) => {
                    try {
                        const r = await fetch(`https://api.airplanes.live/v2/point/${la.toFixed(2)}/${lo.toFixed(2)}/250`, { signal: AbortSignal.timeout(9000) });
                        if (!r.ok) { feedErrors.add(httpIssue('Airplanes.live', r.status)); return; }
                        const data = await r.json();
                        (data?.ac || []).forEach((ac) => {
                            if (ac.lat == null || ac.lon == null || seen.has(ac.hex)) return;
                            seen.add(ac.hex);
                            const altFt = typeof ac.alt_baro === 'number' ? ac.alt_baro : 0;
                            merged.push({
                                icao: ac.hex || '------',
                                callsign: String(ac.flight || ac.r || ac.hex || '').trim(),
                                origin: ac.desc || ac.t || 'Civil Aviation',
                                lon: ac.lon,
                                lat: ac.lat,
                                baroAlt: altFt / 3.28084,
                                geoAlt: (typeof ac.alt_geom === 'number' ? ac.alt_geom : altFt) / 3.28084,
                                onGround: ac.alt_baro === 'ground',
                                speed: Math.round(ac.gs || 0),
                                track: ac.track || 0,
                                vRate: (ac.baro_rate || 0) / 196.85,
                                squawk: ac.squawk || '----',
                                posSource: 'Airplanes.live ADS-B'
                            });
                        });
                    } catch (_) { feedErrors.add('Airplanes.live: network, CORS or timeout error'); }
                }));

                if (!merged.length) throw new Error([...feedErrors].join(' · ') || 'Flight feeds returned no aircraft for this area. Try another region.');
                applyFlights(merged.slice(0, 1200), 'Airplanes.live ADS-B');
            }
        } catch (err) {
            os._radarLastError = err.message || 'ADS-B feeds unreachable';
            os.activeFlights = [];
            os.redrawMarkers();
            os.renderFlightManifest();
            const cntEl = document.getElementById('globe-flight-count');
            const magEl = document.getElementById('globe-event-mag');
            if (cntEl) cntEl.innerText = 'Offline';
            if (magEl) magEl.innerText = 'Unavailable';
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
                    list.innerHTML = `<div class="p-4 text-center text-[10px] font-mono text-gray-500 leading-relaxed">Live flight data unavailable<br><span class="text-[8px] text-gray-600">${os.escapeHtml(msg)}</span></div>`;
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
    _marketSymbol: 'BTCUSDT',
    _marketInterval: '15m',
    _marketChartStyle: 'candles',
    _marketHoverIdx: -1,
    _marketTickers: {},

    _marketCoins: [
        { symbol: 'BTCUSDT', kraken: 'XXBTZUSD', code: 'BTC', name: 'Bitcoin', badge: '₿', fallback: 92400 },
        { symbol: 'ETHUSDT', kraken: 'XETHZUSD', code: 'ETH', name: 'Ethereum', badge: 'Ξ', fallback: 3180 },
        { symbol: 'SOLUSDT', kraken: 'SOLUSD',   code: 'SOL', name: 'Solana',   badge: '◎', fallback: 194 },
        { symbol: 'BNBUSDT', kraken: 'BNBUSD',   code: 'BNB', name: 'BNB',      badge: '◆', fallback: 640 },
        { symbol: 'XRPUSDT', kraken: 'XXRPZUSD', code: 'XRP', name: 'XRP',      badge: '✕', fallback: 2.38 },
        { symbol: 'ADAUSDT', kraken: 'ADAUSD',   code: 'ADA', name: 'Cardano',  badge: '₳', fallback: 0.94 },
        { symbol: 'DOGEUSDT',kraken: 'XDGUSD',   code: 'DOGE',name: 'Dogecoin', badge: 'Ð', fallback: 0.34 },
        { symbol: 'AVAXUSDT',kraken: 'AVAXUSD',  code: 'AVAX',name: 'Avalanche',badge: '▲', fallback: 38.5 }
    ],

    marketFormatPrice: (val) => {
        const n = Number(val);
        if (!Number.isFinite(n)) return '--';
        if (n >= 1000) return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (n >= 1) return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 });
        return n.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 5 });
    },

    initMarket: async () => {
        const canvas = document.getElementById('market-canvas');
        if (!canvas) return;

        const resize = () => {
            const c = document.getElementById('market-canvas');
            if (!c || !c.parentElement) return;
            const rect = c.parentElement.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            c.width = Math.max(200, Math.floor(rect.width * dpr));
            c.height = Math.max(140, Math.floor(rect.height * dpr));
            c.style.width = rect.width + 'px';
            c.style.height = rect.height + 'px';
            os.drawMarketChart();
        };

        if (!os.marketResizeObserver && window.ResizeObserver) {
            os.marketResizeObserver = new ResizeObserver(resize);
            os.marketResizeObserver.observe(canvas.parentElement);
        }
        resize();

        if (!canvas.dataset.boundHover) {
            canvas.dataset.boundHover = '1';
            canvas.addEventListener('mousemove', (ev) => {
                const rect = canvas.getBoundingClientRect();
                const x = ev.clientX - rect.left;
                const data = os.marketData || [];
                if (!data.length) return;
                const padRight = 64;
                const padLeft = 12;
                const plotW = Math.max(40, rect.width - padLeft - padRight);
                const idx = Math.max(0, Math.min(data.length - 1, Math.floor(((x - padLeft) / plotW) * data.length)));
                os._marketHoverIdx = idx;
                os.drawMarketChart();
            });
            canvas.addEventListener('mouseleave', () => {
                os._marketHoverIdx = -1;
                os.drawMarketChart();
            });
        }

        os.marketRenderWatchlist();
        os.marketRefreshWatchlistTickers();
        await os.marketSelectSymbol(os._marketSymbol || 'BTCUSDT', os._marketInterval || '15m');
    },

    marketRenderWatchlist: () => {
        const el = document.getElementById('market-watchlist');
        if (!el) return;
        el.innerHTML = os._marketCoins.map((c) => {
            const active = c.symbol === os._marketSymbol;
            const tk = os._marketTickers[c.symbol];
            const pct = tk ? Number(tk.pct) : null;
            return `
                <button type="button" onclick="os.marketSelectSymbol('${c.symbol}')"
                    class="w-full px-2.5 py-2 rounded-xl text-left flex items-center justify-between gap-2 transition cursor-none hover-target border ${
                        active ? 'bg-white/[0.09] border-white/20' : 'bg-white/[0.02] hover:bg-white/[0.05] border-transparent'
                    }">
                    <div class="flex items-center gap-2 min-w-0">
                        <span class="w-6 h-6 rounded-lg bg-white/[0.06] flex items-center justify-center font-mono font-bold text-[11px] text-amber-300 shrink-0">${c.badge}</span>
                        <div class="min-w-0">
                            <div class="text-xs font-semibold text-white">${c.code}</div>
                            <div class="text-[10px] text-gray-500 truncate">${c.name}</div>
                        </div>
                    </div>
                    <div class="text-right font-mono tabular-nums shrink-0">
                        <div class="text-xs text-gray-100">${tk ? '$' + os.marketFormatPrice(tk.last) : '--'}</div>
                        <div class="text-[10px] ${pct == null ? 'text-gray-500' : pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${pct == null ? '' : `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`}</div>
                    </div>
                </button>`;
        }).join('');
    },

    marketRefreshWatchlistTickers: async () => {
        try {
            const syms = encodeURIComponent(JSON.stringify(os._marketCoins.map((c) => c.symbol)));
            const r = await fetch(`https://data-api.binance.vision/api/v3/ticker/24hr?symbols=${syms}`, { signal: AbortSignal.timeout(8000) });
            if (r.ok) {
                const arr = await r.json();
                if (Array.isArray(arr)) {
                    arr.forEach((item) => {
                        os._marketTickers[item.symbol] = {
                            last: parseFloat(item.lastPrice),
                            pct: parseFloat(item.priceChangePercent),
                            high: parseFloat(item.highPrice),
                            low: parseFloat(item.lowPrice)
                        };
                    });
                    os.marketRenderWatchlist();
                    os.marketSyncHeaderPrice();
                }
            }
        } catch (_) {}
    },

    marketSetInterval: (tf) => {
        os._marketInterval = tf;
        document.querySelectorAll('#market-tf-group [data-mkt-tf]').forEach((b) => {
            b.classList.toggle('active', b.getAttribute('data-mkt-tf') === tf);
        });
        os.marketSelectSymbol(os._marketSymbol, tf);
    },

    marketSetChartStyle: (style) => {
        os._marketChartStyle = style === 'area' ? 'area' : 'candles';
        document.getElementById('mkt-style-candles')?.classList.toggle('active', os._marketChartStyle === 'candles');
        document.getElementById('mkt-style-area')?.classList.toggle('active', os._marketChartStyle === 'area');
        os.drawMarketChart();
    },

    marketSelectSymbol: async (symbol, interval = os._marketInterval) => {
        const coin = os._marketCoins.find((c) => c.symbol === symbol) || os._marketCoins[0];
        os._marketSymbol = coin.symbol;
        os._marketInterval = interval || '15m';
        os.marketRenderWatchlist();

        const titleEl = document.getElementById('market-symbol-title');
        const badgeEl = document.getElementById('market-coin-badge');
        const symConv = document.getElementById('market-conv-sym');
        const statusLbl = document.getElementById('market-status-lbl');
        if (titleEl) titleEl.textContent = `${coin.code} / USDT`;
        if (badgeEl) badgeEl.textContent = coin.badge;
        if (symConv) symConv.textContent = coin.code;
        if (statusLbl) statusLbl.textContent = `Loading ${os._marketInterval}...`;

        // Close previous WS
        if (os.marketWs) {
            try { os.marketWs.onclose = null; os.marketWs.close(); } catch (_) {}
            os.marketWs = null;
        }

        // Preload 60 historical OHLC candles immediately!
        let loaded = false;
        try {
            const kRes = await fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${coin.symbol}&interval=${os._marketInterval}&limit=60`, { signal: AbortSignal.timeout(8000) });
            if (kRes.ok) {
                const raw = await kRes.json();
                if (Array.isArray(raw) && raw.length) {
                    os.marketData = raw.map((k) => ({
                        t: k[0], o: parseFloat(k[1]), h: parseFloat(k[2]), l: parseFloat(k[3]), c: parseFloat(k[4])
                    }));
                    loaded = true;
                    if (statusLbl) statusLbl.textContent = `Live · ${os._marketInterval}`;
                }
            }
        } catch (_) {}

        // Fallback to Kraken public OHLC if Binance Vision was blocked
        if (!loaded) {
            const krakenTf = { '1m': 1, '15m': 15, '1h': 60, '4h': 240, '1d': 1440 }[os._marketInterval] || 15;
            try {
                const kr = await fetch(`https://api.kraken.com/0/public/OHLC?pair=${coin.kraken}&interval=${krakenTf}`, { signal: AbortSignal.timeout(8000) });
                if (kr.ok) {
                    const kj = await kr.json();
                    const key = Object.keys(kj?.result || {}).find((k) => k !== 'last');
                    const rows = key ? kj.result[key] : null;
                    if (Array.isArray(rows) && rows.length) {
                        os.marketData = rows.slice(-60).map((k) => ({
                            t: k[0] * 1000, o: parseFloat(k[1]), h: parseFloat(k[2]), l: parseFloat(k[3]), c: parseFloat(k[4])
                        }));
                        loaded = true;
                        if (statusLbl) statusLbl.textContent = `Kraken · ${os._marketInterval}`;
                    }
                }
            } catch (_) {}
        }

        if (!loaded && !os.marketData.length) {
            if (statusLbl) statusLbl.textContent = 'Offline';
        }

        os.marketSyncHeaderPrice();
        os.marketConvert('coin');
        os.drawMarketChart();

        // Connect live WebSocket stream (Binance Vision global stream -> fallback stream.binance.com)
        const streamPath = `${coin.symbol.toLowerCase()}@kline_${os._marketInterval}`;
        const connectWs = (wsBase, isFallback = false) => {
            if (os._marketSymbol !== coin.symbol) return;
            try {
                const ws = new WebSocket(`${wsBase}/${streamPath}`);
                os.marketWs = ws;
                ws.onopen = () => {
                    if (statusLbl) statusLbl.textContent = `Live WS · ${os._marketInterval}`;
                };
                ws.onmessage = (event) => {
                    try {
                        const msg = JSON.parse(event.data);
                        const k = msg.k;
                        if (!k) return;
                        const candle = { t: k.t, o: parseFloat(k.o), h: parseFloat(k.h), l: parseFloat(k.l), c: parseFloat(k.c) };
                        if (!os.marketData.length || os.marketData[os.marketData.length - 1].t !== candle.t) {
                            os.marketData.push(candle);
                            if (os.marketData.length > 60) os.marketData.shift();
                        } else {
                            os.marketData[os.marketData.length - 1] = candle;
                        }
                        os._marketTickers[coin.symbol] = {
                            ...(os._marketTickers[coin.symbol] || {}),
                            last: candle.c
                        };
                        os.marketSyncHeaderPrice();
                        os.drawMarketChart();
                    } catch (_) {}
                };
                ws.onerror = () => {
                    if (!isFallback) {
                        try { ws.close(); } catch (_) {}
                        connectWs('wss://stream.binance.com:9443/ws', true);
                    }
                };
            } catch (_) {}
        };
        connectWs('wss://data-stream.binance.vision/ws');
    },

    marketSyncHeaderPrice: () => {
        const priceEl = document.getElementById('market-price');
        const changeEl = document.getElementById('market-change');
        const rangeEl = document.getElementById('market-24h-range');
        const data = os.marketData || [];
        const last = data.length ? data[data.length - 1].c : os._marketTickers[os._marketSymbol]?.last;
        const first = data.length ? data[0].o : last;
        if (priceEl && last != null) {
            const diff = last - (first || last);
            const pct = first ? (diff / first) * 100 : (os._marketTickers[os._marketSymbol]?.pct || 0);
            const isUp = diff >= 0;
            priceEl.textContent = `$${os.marketFormatPrice(last)}`;
            priceEl.className = `text-lg font-mono font-bold leading-none tabular-nums ${isUp ? 'text-emerald-400' : 'text-rose-400'}`;
            if (changeEl) {
                changeEl.textContent = `${isUp ? '+' : ''}${pct.toFixed(2)}% (${os._marketInterval} window)`;
                changeEl.className = `text-[11px] font-mono mt-0.5 tabular-nums ${isUp ? 'text-emerald-400/90' : 'text-rose-400/90'}`;
            }
        }
        const tk = os._marketTickers[os._marketSymbol];
        if (rangeEl && tk?.high && tk?.low) {
            rangeEl.textContent = `24h High $${os.marketFormatPrice(tk.high)} · Low $${os.marketFormatPrice(tk.low)}`;
        }
    },

    marketConvert: (source) => {
        const coinInput = document.getElementById('market-conv-coin');
        const usdInput = document.getElementById('market-conv-usd');
        if (!coinInput || !usdInput) return;
        const price = (os.marketData.length ? os.marketData[os.marketData.length - 1].c : null)
            || os._marketTickers[os._marketSymbol]?.last || 0;
        if (!price) return;
        if (source === 'coin') {
            const qty = parseFloat(coinInput.value) || 0;
            usdInput.value = (qty * price).toFixed(2);
        } else {
            const usd = parseFloat(usdInput.value) || 0;
            coinInput.value = (usd / price).toFixed(6);
        }
    },

    drawMarketChart: () => {
        const canvas = document.getElementById('market-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        const data = os.marketData || [];
        if (!data.length) {
            ctx.fillStyle = 'rgba(148,163,184,0.55)';
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Loading market candles...', w / 2, h / 2);
            ctx.restore();
            return;
        }

        const min = Math.min(...data.map((d) => d.l));
        const max = Math.max(...data.map((d) => d.h));
        const range = (max - min) || (max * 0.01) || 1;

        const padTop = 18;
        const padBottom = 22;
        const padLeft = 12;
        const padRight = 64;
        const plotW = Math.max(40, w - padLeft - padRight);
        const plotH = Math.max(40, h - padTop - padBottom);
        const getY = (val) => padTop + plotH - ((val - min) / range) * plotH;

        // Horizontal price grid + right-axis price labels
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillStyle = 'rgba(148,163,184,0.7)';
        ctx.textAlign = 'left';
        for (let i = 0; i <= 4; i++) {
            const y = padTop + (plotH / 4) * i;
            const pVal = max - (range / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padLeft, y);
            ctx.lineTo(padLeft + plotW, y);
            ctx.stroke();
            ctx.fillText(os.marketFormatPrice(pVal), padLeft + plotW + 6, y + 3);
        }

        const stepX = plotW / data.length;
        const candleW = Math.max(2.5, stepX * 0.66);

        if (os._marketChartStyle === 'area') {
            const isUpOverall = data[data.length - 1].c >= data[0].o;
            const strokeCol = isUpOverall ? '#34d399' : '#fb7185';
            const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
            grad.addColorStop(0, isUpOverall ? 'rgba(52,211,153,0.28)' : 'rgba(251,113,133,0.28)');
            grad.addColorStop(1, 'rgba(4,6,11,0.0)');

            ctx.beginPath();
            data.forEach((d, i) => {
                const x = padLeft + i * stepX + stepX / 2;
                const y = getY(d.c);
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
            ctx.strokeStyle = strokeCol;
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.lineTo(padLeft + (data.length - 1) * stepX + stepX / 2, padTop + plotH);
            ctx.lineTo(padLeft + stepX / 2, padTop + plotH);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();
        } else {
            data.forEach((d, i) => {
                const cx = padLeft + i * stepX + stepX / 2;
                const yO = getY(d.o);
                const yC = getY(d.c);
                const yH = getY(d.h);
                const yL = getY(d.l);
                const color = d.c >= d.o ? '#34d399' : '#f87171';
                ctx.strokeStyle = color;
                ctx.fillStyle = color;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(cx, yH);
                ctx.lineTo(cx, yL);
                ctx.stroke();
                ctx.fillRect(cx - candleW / 2, Math.min(yO, yC), candleW, Math.max(1.5, Math.abs(yO - yC)));
            });
        }

        // Hover crosshair + OHLC bar
        const ohlcBar = document.getElementById('market-ohlc-bar');
        const hIdx = os._marketHoverIdx;
        if (hIdx >= 0 && hIdx < data.length) {
            const hd = data[hIdx];
            const hx = padLeft + hIdx * stepX + stepX / 2;
            const hy = getY(hd.c);
            ctx.setLineDash([3, 3]);
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.moveTo(hx, padTop);
            ctx.lineTo(hx, padTop + plotH);
            ctx.moveTo(padLeft, hy);
            ctx.lineTo(padLeft + plotW, hy);
            ctx.stroke();
            ctx.setLineDash([]);
            if (ohlcBar) {
                const ts = new Date(hd.t).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
                ohlcBar.firstElementChild.textContent = `${ts}  ·  O ${os.marketFormatPrice(hd.o)}  H ${os.marketFormatPrice(hd.h)}  L ${os.marketFormatPrice(hd.l)}  C ${os.marketFormatPrice(hd.c)}`;
            }
        }

        ctx.restore();
    },

    killMarket: () => {
        if (os.marketWs) {
            try { os.marketWs.onclose = null; os.marketWs.close(); } catch (_) {}
            os.marketWs = null;
        }
        if (os.marketResizeObserver) {
            os.marketResizeObserver.disconnect();
            os.marketResizeObserver = null;
        }
    }
});
