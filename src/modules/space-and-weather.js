// AetherOS — Weather Station, NASA Explorer, ISS 3D Orbital Tracker & Game Vault
window.extendOS({
    searchWeather: async (cityName) => {
                const query = String(cityName || '').trim();
                if (!query) return;
                
                os.logTerminal && os.logTerminal(`Geocoding: Searching coordinates for [${query}]...`);
                try {
                    const ctrl = new AbortController();
                    const t = setTimeout(() => ctrl.abort(), 5000);
                    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`, { signal: ctrl.signal });
                    clearTimeout(t);
                    if (!r.ok) throw new Error(`HTTP ${r.status}`);
                    const data = await r.json();
                    const result = data.results && data.results[0];
                    if (result && result.latitude && result.longitude) {
                        const lat = result.latitude;
                        const lon = result.longitude;
                        const city = result.name;
                        const country = result.country || '';
                        
                        os.logTerminal && os.logTerminal(`Geocoding: Found [${city}, ${country}] at (${lat}, ${lon})`);
                        
                        os._weatherManualOverride = { lat, lon, city, country };
                        os.initWeatherStation();
                    } else {
                        alert(`City "${query}" not found in Geocoding matrix.`);
                    }
                } catch(e) {
                    os.logTerminal && os.logTerminal(`Geocoding Error: ${e.message}`);
                    alert(`Geocoding uplink failed: ${e.message}`);
                }
            },

    _weatherData: null,

    initWeatherStation: async () => {
                const content = document.getElementById('weather-content');
                const bgGif = document.getElementById('weather-bg-gif');
                if (!content) return;
                content.innerHTML = '<div class="text-white/40 text-xs animate-pulse text-center mt-20">Acquiring atmospheric telemetry...</div>';

                // Use cached weather if < 10 minutes old
                const now = Date.now();
                if (os._weatherCache && os._weatherCache.timestamp && (now - os._weatherCache.timestamp) < 600000) {
                    const cached = os._weatherCache;
                    os._renderWeatherData(cached.wd, cached.lat, cached.lon, cached.city, cached.country, content, bgGif);
                    return;
                }

                // Robust fetch with manual timeout (cross-browser) + retry
                const tryFetch = async (url, timeoutMs, retries = 2) => {
                    for (let attempt = 0; attempt <= retries; attempt++) {
                        const ctrl = new AbortController();
                        const t = setTimeout(() => ctrl.abort(), timeoutMs);
                        try {
                            const res = await fetch(url, { signal: ctrl.signal });
                            clearTimeout(t);
                            if (res.status === 429 && attempt < retries) {
                                await new Promise(r => setTimeout(r, (attempt + 1) * 2000));
                                continue;
                            }
                            return res;
                        } catch (e) {
                            clearTimeout(t);
                            if (attempt < retries) {
                                await new Promise(r => setTimeout(r, (attempt + 1) * 1500));
                                continue;
                            }
                            throw e;
                        }
                    }
                    return null;
                };

                try {
                    let lat = 28.6139, lon = 77.2090, city = 'New Delhi', country = 'India';
                    if (os._weatherManualOverride) {
                        lat = os._weatherManualOverride.lat;
                        lon = os._weatherManualOverride.lon;
                        city = os._weatherManualOverride.city;
                        country = os._weatherManualOverride.country;
                    } else {
                        try {
                            const g = await tryFetch('https://ipwho.is/', 4000, 1);
                            const gd = await g.json();
                            if (gd && gd.success !== false && gd.latitude && gd.longitude) { lat = gd.latitude; lon = gd.longitude; city = gd.city || city; country = gd.country || country; }
                        } catch {
                            try {
                                const g = await tryFetch('https://ipapi.co/json/', 4000, 1);
                                const gd = await g.json();
                                if (gd && gd.latitude && gd.longitude) { lat = gd.latitude; lon = gd.longitude; city = gd.city || city; country = gd.country_name || country; }
                            } catch(_) {}
                        }
                    }

                    const wr = await tryFetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,weather_code,relative_humidity_2m,apparent_temperature,precipitation,surface_pressure&hourly=temperature_2m,precipitation_probability,wind_speed_10m,uv_index,visibility&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset,precipitation_sum&forecast_days=7&timezone=auto`, 10000, 2);
                    if (!wr || !wr.ok) throw new Error('Open-Meteo HTTP ' + (wr ? wr.status : 'unreachable'));
                    const wd = await wr.json();
                    os._weatherCache = { wd, lat, lon, city, country, timestamp: Date.now() };
                    os._renderWeatherData(wd, lat, lon, city, country, content, bgGif);
                    const c = wd.current || {};
                    const code = c.weather_code ?? c.weathercode ?? 0;
                    const wmoLabel = {0:'Clear Sky',1:'Mostly Clear',2:'Partly Cloudy',3:'Overcast',45:'Foggy',48:'Icy Fog',51:'Light Drizzle',53:'Drizzle',55:'Heavy Drizzle',61:'Light Rain',63:'Rain',65:'Heavy Rain',71:'Light Snow',73:'Snow',75:'Heavy Snow',77:'Snow Grains',80:'Showers',81:'Heavy Showers',82:'Violent Showers',85:'Light Snow Showers',86:'Snow Showers',95:'Thunderstorm',96:'Hail Storm',99:'Heavy Hail Storm'};
                    Notifications.push('WEATHER', `${city}: ${c.temperature_2m}°C ${wmoLabel[code] || 'Clear'}`);
                } catch(err) {
                    // Fallback to cached data if available
                    if (os._weatherCache && os._weatherCache.wd) {
                        const cached = os._weatherCache;
                        os._renderWeatherData(cached.wd, cached.lat, cached.lon, cached.city, cached.country, content, bgGif);
                        os.logTerminal(`Weather: API failed (${err.message}), serving cached data.`);
                        return;
                    }
                    if (content) content.innerHTML = `<div class="text-center mt-20"><div class="text-red-400 font-mono text-xs">Atmospheric link failed</div><div class="text-gray-500 text-[10px] mt-2">${os._html(err.message)}</div><button onclick="os.initWeatherStation()" class="mt-4 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-white text-[10px] cursor-none hover-target">Retry</button></div>`;
                }
            },

    _renderWeatherData: (wd, lat, lon, city, country, content, bgGif) => {
                const c = wd.current || {};
                const code = c.weather_code ?? c.weathercode ?? 0;
                os._weatherData = { lat, lon, city, country, ...wd };
                const wmoLucide = {0:'sun',1:'cloud-sun',2:'cloud-sun',3:'cloud',45:'cloud-fog',48:'cloud-fog',51:'cloud-drizzle',53:'cloud-drizzle',55:'cloud-rain',61:'cloud-rain',63:'cloud-rain',65:'cloud-rain',71:'snowflake',73:'snowflake',75:'snowflake',77:'snowflake',80:'cloud-drizzle',81:'cloud-rain',82:'cloud-lightning',85:'snowflake',86:'snowflake',95:'cloud-lightning',96:'cloud-lightning',99:'cloud-lightning'};
                const wmoLabel = {0:'Clear Sky',1:'Mostly Clear',2:'Partly Cloudy',3:'Overcast',45:'Foggy',48:'Icy Fog',51:'Light Drizzle',53:'Drizzle',55:'Heavy Drizzle',61:'Light Rain',63:'Rain',65:'Heavy Rain',71:'Light Snow',73:'Snow',75:'Heavy Snow',77:'Snow Grains',80:'Showers',81:'Heavy Showers',82:'Violent Showers',85:'Light Snow Showers',86:'Snow Showers',95:'Thunderstorm',96:'Hail Storm',99:'Heavy Hail Storm'};
                const iconName = wmoLucide[code] || 'thermometer';
                const label = wmoLabel[code] || 'Clear';
                const tbIcon = document.getElementById('topbar-weather-icon');
                const tbTemp = document.getElementById('topbar-weather-temp');
                const tbDesc = document.getElementById('topbar-weather-desc');
                const tbWrap = document.getElementById('top-weather-wrap');
                if (tbIcon) tbIcon.innerHTML = `<i data-lucide="${iconName}" class="w-3.5 h-3.5 text-sky-300"></i>`;
                if (tbTemp) tbTemp.textContent = Math.round(c.temperature_2m) + '°C';
                if (tbDesc) tbDesc.textContent = label;
                if (tbWrap && window.lucide) lucide.createIcons({root: tbWrap});
                const moodQuery = os._weatherGifQuery(code);
                os._loadWeatherGif(bgGif, moodQuery);
                const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
                const dailyHtml = (wd.daily?.time || []).map((date, i) => {
                    const d = new Date(date);
                    const dCode = (wd.daily.weather_code || wd.daily.weathercode || [])[i];
                    const di = wmoLucide[dCode] || 'cloud-sun';
                    return `<div class="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5 border border-white/5 flex-1 min-w-0">
                        <div class="text-[9px] text-gray-500 uppercase">${days[d.getDay()]}</div>
                        <i data-lucide="${di}" class="w-4 h-4 text-sky-300 my-0.5"></i>
                        <div class="text-[10px] text-white font-bold">${Math.round(wd.daily.temperature_2m_max?.[i] ?? 0)}°</div>
                        <div class="text-[9px] text-blue-400">${Math.round(wd.daily.temperature_2m_min?.[i] ?? 0)}°</div>
                        <div class="text-[8px] text-blue-300/60">${Math.round(wd.daily.precipitation_sum?.[i] ?? 0)}mm</div>
                    </div>`;
                }).join('');
                const hourlyTemps = (wd.hourly?.temperature_2m || []).slice(0, 24);
                const hourlyPrec = (wd.hourly?.precipitation_probability || []).slice(0, 24);
                const tMin = Math.min(...hourlyTemps), tMax = Math.max(...hourlyTemps) || tMin + 1;
                const hourlyBars = hourlyTemps.map((t, i) => {
                    const h = Math.max(8, Math.round(((t - tMin) / (tMax - tMin)) * 48 + 8));
                    const pp = hourlyPrec[i] || 0;
                    const col = pp > 60 ? 'rgba(96,165,250,0.7)' : pp > 30 ? 'rgba(74,222,128,0.6)' : 'rgba(255,255,255,0.4)';
                    return `<div style="height:${h}px;flex:1;background:${col};border-radius:2px 2px 0 0;min-width:2px;" title="${i}:00 — ${t}°C | Rain: ${pp}%"></div>`;
                }).join('');
                const sunrise = wd.daily?.sunrise?.[0]?.split('T')[1] || '--';
                const sunset = wd.daily?.sunset?.[0]?.split('T')[1] || '--';
                const safeCity = os._html(city);
                const safeCountry = os._html(country);
                content.innerHTML = `
                    <div class="flex items-center justify-between gap-4 mb-4 pb-2 border-b border-white/5 relative z-20">
                        <span class="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><i data-lucide="cloud-rain" class="w-3 h-3 text-cyan-400"></i> METEOROLOGICAL TELEMETRY</span>
                        <div class="flex items-center gap-1.5">
                            <input type="text" id="weather-search-city" placeholder="Search City..." class="bg-black/60 border border-white/10 rounded px-2.5 py-1 text-[9px] text-white focus:outline-none focus:border-cyan-500/30 outline-none w-28 cursor-text" onkeydown="if(event.key==='Enter') os.searchWeather(this.value)">
                            <button onclick="os.searchWeather(document.getElementById('weather-search-city').value)" class="p-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white hover-target cursor-none" aria-label="Search city"><i data-lucide="search" class="w-3 h-3"></i></button>
                        </div>
                    </div>
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <div class="text-[10px] text-gray-400 font-mono mb-1 flex items-center gap-1"><i data-lucide="map-pin" class="w-3 h-3 text-cyan-400"></i> ${safeCity}, ${safeCountry}</div>
                            <div class="text-6xl font-black text-white leading-none">${c.temperature_2m}°<span class="text-3xl text-gray-400">C</span></div>
                            <div class="text-lg text-white/70 mt-1 font-mono flex items-center gap-2"><i data-lucide="${iconName}" class="w-5 h-5 text-sky-300"></i> ${label}</div>
                            <div class="text-xs text-gray-500 mt-0.5">Feels like ${c.apparent_temperature}°C</div>
                        </div>
                        <div class="text-right text-[10px] font-mono space-y-1">
                            <div class="text-gray-500">UV Index <span class="text-white font-bold">${wd.hourly?.uv_index?.[0] ?? '--'}</span></div>
                            <div class="text-gray-500">Humidity <span class="text-blue-400 font-bold">${c.relative_humidity_2m}%</span></div>
                            <div class="text-gray-500">Wind <span class="text-white font-bold">${c.wind_speed_10m} km/h</span></div>
                            <div class="text-gray-500">Pressure <span class="text-white font-bold">${c.surface_pressure ?? '--'} hPa</span></div>
                            <div class="text-gray-500">Precipitation <span class="text-blue-400 font-bold">${c.precipitation ?? 0} mm</span></div>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3 mb-4 text-[10px] font-mono">
                        <div class="p-2.5 bg-white/5 border border-white/5 rounded-lg flex items-center gap-2"><i data-lucide="sunrise" class="w-5 h-5 text-amber-300 shrink-0"></i><div><div class="text-gray-500">Sunrise</div><div class="text-white font-bold">${os._html(sunrise)}</div></div></div>
                        <div class="p-2.5 bg-white/5 border border-white/5 rounded-lg flex items-center gap-2"><i data-lucide="sunset" class="w-5 h-5 text-orange-400 shrink-0"></i><div><div class="text-gray-500">Sunset</div><div class="text-white font-bold">${os._html(sunset)}</div></div></div>
                    </div>
                    <div class="mb-4">
                        <div class="text-[9px] text-gray-500 uppercase tracking-widest font-mono mb-2">24h Temperature & Rain Probability</div>
                        <div class="flex items-end gap-0.5 h-14 w-full bg-white/3 rounded-lg p-1.5">${hourlyBars}</div>
                        <div class="flex justify-between text-[8px] text-gray-600 font-mono mt-0.5"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span></div>
                    </div>
                    <div><div class="text-[9px] text-gray-500 uppercase tracking-widest font-mono mb-2">7-Day Forecast</div><div class="flex gap-1.5">${dailyHtml}</div></div>
                    <div class="mt-3 text-[8px] text-gray-600 font-mono text-right">Source: Open-Meteo API · WMO Compliant · Auto-updated</div>
                `;
                if (window.lucide) lucide.createIcons({root: content});
            },

    _weatherGifQuery: (code) => {
                // Return a NEKOS.BEST GIF category (docs: https://docs.nekos.best/)
                if (code === 0 || code === 1) return 'happy';       // sunny / clear
                if (code === 2 || code === 3) return 'blush';        // cloudy
                if (code >= 45 && code <= 48) return 'sleep';        // fog / low visibility
                if (code >= 51 && code <= 67) return 'cry';          // drizzle / rain
                if (code >= 71 && code <= 77) return 'dance';        // snow mood
                if (code >= 80 && code <= 82) return 'wave';         // showers
                if (code >= 95) return 'stare';                      // thunderstorm
                return 'smile';
            },

    _loadWeatherGif: async (el, category) => {
                if (!el) return;
                const fallbackCats = [category, 'smile', 'happy', 'wave'];
                for (const cat of fallbackCats) {
                    try {
                        const res = await fetch(`https://nekos.best/api/v2/${encodeURIComponent(cat)}?amount=1`, { signal: AbortSignal.timeout(7000) });
                        if (!res.ok) throw new Error('Nekos.best HTTP ' + res.status);
                        const data = await res.json();
                        const gif = data?.results?.[0];
                        if (gif?.url) {
                            el.style.backgroundImage = `url('${gif.url}')`;
                            el.style.opacity = '0.24';
                            el.title = `Anime weather GIF via nekos.best/${cat}${gif.anime_name ? ' · ' + gif.anime_name : ''}`;
                            return;
                        }
                    } catch(e) { /* try fallback category */ }
                }
                el.style.backgroundImage = 'radial-gradient(circle at 30% 20%, rgba(96,165,250,.25), transparent 45%), radial-gradient(circle at 80% 10%, rgba(236,72,153,.18), transparent 42%)';
                el.style.opacity = '0.18';
            },

    nasaFetchJSON: async (url, timeout=12000) => {
                const r = await fetch(url, { signal: AbortSignal.timeout(timeout), cache:'no-store' });
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            },

    nasaRenderError: (el, title, err, fallbackAction='os.nasaLoadAPOD()') => {
                el.innerHTML = `<div class="h-full flex items-center justify-center text-center p-6"><div><div class="text-red-300 font-bold uppercase tracking-widest">${os._html(title)} offline</div><div class="text-gray-500 mt-2 text-[10px]">${os._html(err.message || err)}</div><button onclick="${fallbackAction}" class="mt-4 px-3 py-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 cursor-none hover-target">Retry / Fallback</button></div></div>`;
            },

    nasaLoadAPOD: async () => {
                const el = document.getElementById('nasa-content');
                if (!el) return;
                el.innerHTML = '<div class="text-center text-gray-500 animate-pulse mt-10">ACQUIRING DEEP SPACE TELEMETRY...</div>';
                try {
                    let d;
                    try { d = await os.nasaFetchJSON('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&thumbs=true', 10000); }
                    catch(primaryErr) {
                        const search = await os.nasaFetchJSON('https://images-api.nasa.gov/search?q=nebula%20galaxy&media_type=image&page_size=12', 10000);
                        const item = search.collection?.items?.[Math.floor(Math.random()*Math.min(8, search.collection.items.length))];
                        d = { title:item?.data?.[0]?.title || 'NASA Deep Space Archive', date:item?.data?.[0]?.date_created?.split('T')[0] || '', explanation:item?.data?.[0]?.description || 'Loaded from NASA Image and Video Library fallback feed.', url:item?.links?.[0]?.href, hdurl:item?.links?.[0]?.href, media_type:'image', copyright:'NASA Image Library' };
                    }
                    const media = d.media_type === 'video' ? `<iframe src="${os._html(d.url)}" class="w-full h-72 border-0" allowfullscreen></iframe>` : `<img src="${os._html(d.hdurl || d.url)}" class="w-full max-h-80 object-cover" alt="${os._html(d.title)}" loading="lazy">`;
                    el.innerHTML = `
                        <div class="rounded-2xl overflow-hidden border border-white/10 mb-4 relative bg-black shadow-os-recessed">${media}<div class="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-transparent"></div></div>
                        <div class="flex items-start justify-between gap-4"><div><div class="text-white font-display text-xl uppercase tracking-wide mb-1">${os._html(d.title)}</div><div class="text-[9px] text-os-accent font-mono mb-2">${os._html(d.date)} · ${os._html(d.copyright || 'NASA')}</div></div><button onclick="os.nasaLoadAPOD()" class="px-2 py-1 bg-white/5 border border-white/10 rounded cursor-none hover-target text-[9px]">Refresh</button></div>
                        <div class="text-[11px] text-gray-300 leading-relaxed max-h-36 overflow-y-auto pr-2 select-text">${os._html(d.explanation || '').slice(0,1200)}</div>
                        <a href="${os._html(d.hdurl || d.url)}" target="_blank" class="inline-block mt-3 text-[9px] text-blue-300 hover:underline">Open NASA Asset ↗</a>`;
                } catch(e) { os.nasaRenderError(el, 'APOD', e); }
            },

    nasaLoadEPIC: async () => {
                const el = document.getElementById('nasa-content'); if (!el) return;
                el.innerHTML = '<div class="text-center text-gray-500 animate-pulse mt-10">QUERYING EARTH POLYCHROMATIC IMAGING CAMERA...</div>';
                try {
                    let imgs=[];
                    try { imgs = await os.nasaFetchJSON('https://api.nasa.gov/EPIC/api/natural/images?api_key=DEMO_KEY', 10000); }
                    catch(e) { imgs = await os.nasaFetchJSON('https://api.nasa.gov/EPIC/api/natural?api_key=DEMO_KEY', 10000); }
                    const latest = (imgs||[]).slice(0, 9);
                    if (!latest.length) throw new Error('No EPIC images returned');
                    el.innerHTML = `<div class="text-[9px] text-os-accent font-mono mb-3 uppercase tracking-widest">DSCOVR:EPIC Earth Images — ${latest[0]?.date?.split(' ')[0] || ''}</div>
                    <div class="grid grid-cols-3 gap-3">${latest.map(img => { const [y,m,d] = img.date.split(' ')[0].split('-'); const url = `https://api.nasa.gov/EPIC/archive/natural/${y}/${m}/${d}/png/${img.image}.png?api_key=DEMO_KEY`; return `<div class="rounded-xl overflow-hidden border border-white/10 bg-white/[0.035] cursor-none hover-target" onclick="window.open('${url}','_blank')"><img src="${url}" class="w-full h-28 object-cover" loading="lazy" alt="${os._html(img.image)}"><div class="text-[8px] text-gray-500 p-2 truncate">${os._html(img.caption || img.image)}</div></div>`; }).join('')}</div>`;
                } catch(e) { os.nasaRenderError(el, 'EPIC', e, 'os.nasaLoadAPOD()'); }
            },

    nasaLoadMars: async () => {
                const el = document.getElementById('nasa-content'); if (!el) return;
                el.innerHTML = '<div class="text-center text-gray-500 animate-pulse mt-10">QUERYING MARS ROVER TELEMETRY...</div>';
                try {
                    let d;
                    try { d = await os.nasaFetchJSON('https://api.nasa.gov/mars-photos/api/v1/rovers/perseverance/latest_photos?api_key=DEMO_KEY&page=1', 12000); }
                    catch(e) { d = await os.nasaFetchJSON('https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?sol=1000&api_key=DEMO_KEY&page=1', 12000); d.latest_photos = d.photos; }
                    const photos = (d.latest_photos || d.photos || []).slice(0, 12);
                    if (!photos.length) throw new Error('No rover photos returned');
                    el.innerHTML = `<div class="text-[9px] text-os-accent font-mono mb-3 uppercase tracking-widest">Mars Rover · Sol ${photos[0]?.sol || '--'} · ${photos[0]?.rover?.name || 'Rover'}</div><div class="grid grid-cols-4 gap-2">${photos.map(p => `<div class="rounded-lg overflow-hidden border border-white/10 bg-white/[0.035] cursor-none hover-target" onclick="window.open('${p.img_src}','_blank')"><img src="${p.img_src}" class="w-full h-24 object-cover" loading="lazy" alt="${os._html(p.camera?.full_name || '')}"><div class="text-[8px] text-gray-500 p-1 truncate">${os._html(p.camera?.name || 'CAM')}</div></div>`).join('')}</div>`;
                } catch(e) { os.nasaRenderError(el, 'Mars Rover', e, 'os.nasaLoadAPOD()'); }
            },

    nasaLoadDONKI: async () => {
                const el = document.getElementById('nasa-content'); if (!el) return;
                el.innerHTML = '<div class="text-center text-gray-500 animate-pulse mt-10">SCANNING SOLAR WIND UPLINK...</div>';
                try {
                    const end = new Date().toISOString().split('T')[0]; const start = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
                    let flares=[], cme=[];
                    try { [flares, cme] = await Promise.all([os.nasaFetchJSON(`https://api.nasa.gov/DONKI/FLR?startDate=${start}&endDate=${end}&api_key=DEMO_KEY`), os.nasaFetchJSON(`https://api.nasa.gov/DONKI/CME?startDate=${start}&endDate=${end}&api_key=DEMO_KEY`)]); }
                    catch(e) { const kp = await os.nasaFetchJSON('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json'); flares = kp.slice(-12).map(r=>({classType:'Kp '+r[1], peakTime:r[0], sourceLocation:'NOAA SWPC'})); cme=[]; }
                    const classColor = (cls) => String(cls||'').includes('X') ? 'text-red-400' : String(cls||'').includes('M') ? 'text-orange-400' : 'text-yellow-300';
                    el.innerHTML = `<div class="grid grid-cols-2 gap-3 mb-3 text-[10px] font-mono"><div class="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl"><div class="text-orange-300 font-bold text-xs mb-1 flex items-center gap-1.5"><i data-lucide="sun" class="w-3.5 h-3.5"></i> Solar/Kp Events</div><div class="text-4xl font-black text-white">${flares.length}</div></div><div class="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl"><div class="text-blue-300 font-bold text-xs mb-1 flex items-center gap-1.5"><i data-lucide="orbit" class="w-3.5 h-3.5"></i> CME Events</div><div class="text-4xl font-black text-white">${cme.length}</div></div></div><div class="text-[9px] text-os-accent font-mono uppercase tracking-widest mb-2">Recent Space Weather</div><div class="space-y-1 max-h-72 overflow-y-auto">${(flares.slice(-14).reverse()).map(f => `<div class="flex items-center justify-between p-2 bg-white/[0.03] border border-white/5 rounded text-[10px] font-mono"><span class="${classColor(f.classType)} font-bold">${os._html(f.classType || '--')}</span><span class="text-gray-400">${os._html((f.peakTime||'').split('T')[0] || '--')}</span><span class="text-gray-500 truncate max-w-[160px]">${os._html(f.sourceLocation || 'Unknown')}</span></div>`).join('')}</div>`;
                    if (window.lucide) lucide.createIcons({root: el});
                } catch(e) { os.nasaRenderError(el, 'Space Weather', e, 'os.nasaLoadAPOD()'); }
            },

    _gameCatalog: [],

    initGames: () => {
                const lib = document.getElementById('games-library');
                if (!lib) return;
                const esc = (v='') => String(v).replace(/[&<>'"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
                const games = [
                    // Only iframe-playable entries are kept here. External/CSP-blocked games were removed.
                    { id:'tetris', name:'Tetris', icon:'🟦', tag:'Official', desc:'Official Tetris web player', url:'https://play.tetris.com', color:'#3b82f6', source:'Tetris.com', note:'Official browser player' },
                    { id:'krunker', name:'Krunker', icon:'🎯', tag:'3D FPS', desc:'Fast browser FPS arena', url:'https://krunker.io/', color:'#f97316', source:'Krunker', note:'Pointer-lock enabled' },
                    { id:'slowroads', name:'Slow Roads', icon:'🏎️', tag:'3D Racing', desc:'High-graphics procedural driving', url:'https://slowroads.io/', color:'#22d3ee', source:'Slow Roads', note:'WebGL driving' },
                    { id:'supertux', name:'SuperTux Classic', icon:'🐧', tag:'Open Source', desc:'Legal open-source platformer slot', url:'https://www.retrogames.cc/embed/41696-supertux.html', color:'#60a5fa', source:'SuperTux GPL', note:'Open-source platformer build' },
                    { id:'pacman', name:'PAC-MAN', icon:'👾', tag:'Arcade', desc:'Classic arcade maze', url:'https://freepacman.org/', color:'#f59e0b', source:'Free Pacman', note:'Iframe-safe arcade' },
                    { id:'minesweep', name:'Minesweeper', icon:'💣', tag:'Puzzle', desc:'Classic mine detection', url:'https://minesweeper.online/', color:'#9ca3af', source:'minesweeper.online', note:'Iframe-safe puzzle' },
                    { id:'solitaire', name:'Solitaire', icon:'🃏', tag:'Cards', desc:'Klondike Solitaire', url:'https://www.solitaire.org/', color:'#0ea5e9', source:'solitaire.org', note:'Iframe-safe cards' }
                ];
                os._gameCatalog = games;
                lib.className = 'flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 content-start';
                lib.innerHTML = games.map(g => `
                    <div class="group relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/[0.08] to-black/70 min-h-[155px] p-4 hover:border-white/25 hover:-translate-y-1 hover:shadow-2xl transition-all duration-200 cursor-none hover-target" style="box-shadow: inset 0 0 0 1px ${g.color}22, 0 18px 40px -26px ${g.color};">
                        <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style="background:radial-gradient(circle at top right, ${g.color}35, transparent 45%);"></div>
                        <div class="relative z-10 flex flex-col h-full">
                            <div class="flex items-start justify-between gap-2">
                                <div class="w-12 h-12 rounded-xl flex items-center justify-center text-3xl border border-white/10 bg-black/40" style="background:linear-gradient(135deg, ${g.color}22, rgba(0,0,0,.5));">${g.icon}</div>
                                <span class="px-2 py-1 rounded-full text-[8px] uppercase tracking-widest border border-white/10 text-gray-300 bg-black/40">${esc(g.tag)}</span>
                            </div>
                            <div class="mt-3 text-white font-display text-lg uppercase tracking-wide leading-tight">${esc(g.name)}</div>
                            <div class="text-gray-400 text-[10px] mt-1 leading-snug flex-1">${esc(g.desc)}</div>
                            <div class="mt-3 flex items-center justify-between gap-2">
                                <div class="text-[8px] text-gray-600 truncate">${esc(g.source)} · ${esc(g.note)}</div>
                                <div class="flex gap-1">
                                    <button onclick="event.stopPropagation();os.openGameExternal('${g.id}')" class="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[9px] text-gray-300 cursor-none hover-target">Open</button>
                                    <button onclick="event.stopPropagation();os.launchGame('${g.id}')" class="px-2.5 py-1 rounded text-[9px] text-black font-bold cursor-none hover-target" style="background:${g.color}">Play</button>
                                </div>
                            </div>
                        </div>
                    </div>`).join('');
                const header = document.querySelector('#games-root .h-9 span:last-child');
                if (header) header.textContent = 'Iframe-playable vault · Tetris · Krunker · Slow Roads · SuperTux';
            },

    launchGame: (id, name, url) => {
                const g = os._gameCatalog.find(x => x.id === id) || { id, name, url };
                const lib = document.getElementById('games-library');
                const fc = document.getElementById('games-frame-container');
                const iframe = document.getElementById('games-iframe');
                const title = document.getElementById('games-frame-title');
                if (!lib || !fc || !iframe) return;
                lib.classList.add('hidden');
                fc.classList.remove('hidden');
                fc.classList.add('flex');
                if (title) title.innerHTML = `${g.icon || '🎮'} ${g.name || id} <span class="text-gray-600 font-normal ml-2">${g.url || ''}</span>`;
                iframe.src = g.url || url;
                const hint = document.getElementById('games-frame-hint');
                if (hint) hint.remove();
                const bar = fc.querySelector('.border-b');
                if (bar && !document.getElementById('games-frame-hint')) {
                    const b = document.createElement('button'); b.id='games-frame-hint'; b.textContent='Open in new tab'; b.className='px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-gray-400 text-[10px] cursor-none hover-target transition'; b.onclick=()=>os.openGameExternal(g.id); bar.appendChild(b);
                }
                os.logTerminal(`Game Vault: Launched "${g.name || id}"`);
            },

    openGameExternal: (id) => {
                const g = os._gameCatalog.find(x => x.id === id);
                if (g && g.url) window.open(g.url, '_blank', 'noopener,noreferrer');
            },

    gamesBack: () => {
                const lib = document.getElementById('games-library');
                const fc = document.getElementById('games-frame-container');
                const iframe = document.getElementById('games-iframe');
                if (lib) lib.classList.remove('hidden');
                if (fc) { fc.classList.add('hidden'); fc.classList.remove('flex'); }
                if (iframe) iframe.src = '';
            },

    gamesFullscreen: () => {
                const iframe = document.getElementById('games-iframe');
                if (iframe && iframe.requestFullscreen) iframe.requestFullscreen();
            },

    _html: (v='') => String(v ?? '').replace(/[&<>'"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m])),

    _fetchJson: async (url, timeout=9000) => {
                const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
                if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
                return res.json();
            },

    _issSunPos: function() {
                var n = ((new Date()).getTime() / 86400000 + 2440587.5) - 2451545.0;
                var L = (280.460 + 0.9856474 * n) % 360;
                var g = (357.528 + 0.9856003 * n) % 360;
                var lam = (L + 1.915 * Math.sin(g*Math.PI/180) + 0.020 * Math.sin(2*g*Math.PI/180)) * Math.PI/180;
                var eps = (23.439 - 0.0000004*n) * Math.PI/180;
                return new THREE.Vector3(-Math.cos(lam), -Math.sin(eps)*Math.sin(lam), Math.cos(eps)*Math.sin(lam)).normalize();
            },

    _issNasaModelUrl: 'https://solarsystem.nasa.gov/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBdXdRIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--0bf26e0891c22b81cc54d610a7f0293ea11bf6a1/ISS_stationary.glb',

    _issMakeEarthTex: function() {
                var c = document.createElement('canvas');
                c.width = 1024; c.height = 512;
                var ctx = c.getContext('2d');
                var g = ctx.createLinearGradient(0, 0, 0, c.height);
                g.addColorStop(0, '#0a2a50'); g.addColorStop(0.15, '#0b4d91');
                g.addColorStop(0.5, '#0c5ea8'); g.addColorStop(0.85, '#0b4d91');
                g.addColorStop(1, '#0a2a50');
                ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height);
                ctx.fillStyle = '#2a7d3f';
                var shapes = [
                    [20,80,320,60,380,120,360,200,280,250,180,220,80,240,30,160],
                    [200,240,260,250,280,320,250,400,190,360,170,280],
                    [460,90,560,80,580,140,520,180,440,160],
                    [450,170,540,160,560,280,520,360,460,340,440,240],
                    [600,60,850,50,900,120,860,200,780,240,700,260,650,200,580,150],
                    [760,300,840,290,860,340,820,370,750,350],
                    [480,50,540,45,560,70,500,75],
                    [330,280,370,270,400,310,350,320],
                    [680,310,740,300,760,340,720,370,660,350],
                    [540,300,600,290,620,340,580,360,530,330],
                ];
                shapes.forEach(function(s) {
                    ctx.beginPath(); ctx.moveTo(s[0],s[1]);
                    for (var i=2;i<s.length;i+=2) ctx.lineTo(s[i],s[i+1]);
                    ctx.closePath(); ctx.fill();
                });
                for (var i=0;i<500;i++) {
                    ctx.fillStyle = 'rgba('+(35+Math.random()*55)+','+(110+Math.random()*70)+','+(35+Math.random()*55)+',0.35)';
                    ctx.beginPath();
                    ctx.ellipse(Math.random()*c.width, 55+Math.random()*390, 3+Math.random()*35, 2+Math.random()*10, Math.random()*Math.PI, 0, Math.PI*2);
                    ctx.fill();
                }
                ctx.fillStyle='rgba(240,250,255,0.75)'; ctx.fillRect(0,0,c.width,35); ctx.fillRect(0,470,c.width,42);
                return new THREE.CanvasTexture(c);
            },

    _issMakeCloudTex: function() {
                var c=document.createElement('canvas'); c.width=512; c.height=256;
                var ctx=c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height);
                for (var i=0;i<2000;i++) {
                    var cx=Math.random()*c.width, cy=Math.random()*c.height, cr=5+Math.random()*50;
                    var grad=ctx.createRadialGradient(cx,cy,0,cx,cy,cr);
                    grad.addColorStop(0,'rgba(255,255,255,0.55)');
                    grad.addColorStop(0.5,'rgba(255,255,255,0.12)');
                    grad.addColorStop(1,'rgba(255,255,255,0)');
                    ctx.fillStyle=grad; ctx.fillRect(cx-cr,cy-cr,cr*2,cr*2);
                }
                return new THREE.CanvasTexture(c);
            },

    initISS: async function(manual) {
                manual = manual || false;
                var el = document.getElementById('iss-content');
                if (!el) return;

                // Cleanup previous
                if (os._issTimer) { clearInterval(os._issTimer); os._issTimer = null; }
                if (os._issPosTimer) { clearInterval(os._issPosTimer); os._issPosTimer = null; }
                if (os._issAnimFrame) { cancelAnimationFrame(os._issAnimFrame); os._issAnimFrame = null; }

                if (!document.getElementById('iss-3d-stage')) {
                    el.innerHTML = ''
                        + '<div class="w-full h-full relative bg-black overflow-hidden" id="iss-3d-stage">'
                        // Primary render surface
                        + '<div id="iss-render-surface" class="absolute inset-0"></div>'
                        // Bottom telemetry bar
                        + '<div class="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-white/[0.08] z-30" id="iss-telemetry">'
                        +   '<div class="flex items-center h-14 px-4">'
                        +     '<div class="flex-1 grid grid-cols-7 gap-1 items-center">'
                        +       '<div class="text-center"><div class="text-white/35 text-[7px] uppercase tracking-[0.15em]">LAT</div><div class="text-white font-mono text-xs font-bold" id="t-lat">--.--°</div></div>'
                        +       '<div class="text-center"><div class="text-white/35 text-[7px] uppercase tracking-[0.15em]">LON</div><div class="text-white font-mono text-xs font-bold" id="t-lon">--.--°</div></div>'
                        +       '<div class="text-center"><div class="text-white/35 text-[7px] uppercase tracking-[0.15em]">ALT</div><div class="text-white font-mono text-xs font-bold" id="t-alt">--- km</div></div>'
                        +       '<div class="text-center"><div class="text-white/35 text-[7px] uppercase tracking-[0.15em]">VELOCITY</div><div class="text-white font-mono text-xs font-bold" id="t-vel">----- km/h</div></div>'
                        +       '<div class="text-center"><div class="text-white/35 text-[7px] uppercase tracking-[0.15em]">VISIBILITY</div><div class="text-white font-mono text-xs font-bold" id="t-vis">---</div></div>'
                        +       '<div class="text-center"><div class="text-white/35 text-[7px] uppercase tracking-[0.15em]">FOOTPRINT</div><div class="text-white font-mono text-xs font-bold" id="t-foot">---- km</div></div>'
                        +       '<div class="text-center px-2"><div class="text-white/35 text-[7px] uppercase tracking-[0.15em]">LOCATION</div><div class="text-cyan-300 font-mono text-[10px] font-bold truncate" id="t-loc">Acquiring...</div></div>'
                        +     '</div>'
                        +   '</div>'
                        + '</div>'
                        // Camera mode buttons (top-right)
                        + '<div class="absolute top-3 right-3 flex gap-1.5 z-20">'
                        +   '<button onclick="os.issSetCam(\'free\')" data-cam="free" class="cam-btn px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/[0.15] text-white/60 hover:text-white text-[10px] font-mono uppercase tracking-wider transition flex items-center justify-center" title="Free orbit" aria-label="Free orbit"><i data-lucide="globe" class="w-3.5 h-3.5"></i></button>'
                        +   '<button onclick="os.issSetCam(\'follow\')" data-cam="follow" class="cam-btn px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/[0.15] text-white/60 hover:text-white text-[10px] font-mono uppercase tracking-wider transition flex items-center justify-center" title="Follow ISS" aria-label="Follow ISS"><i data-lucide="satellite" class="w-3.5 h-3.5"></i></button>'
                        +   '<button onclick="os.issSetCam(\'firstperson\')" data-cam="firstperson" class="cam-btn px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/[0.15] text-white/60 hover:text-white text-[10px] font-mono uppercase tracking-wider transition flex items-center justify-center" title="ISS View" aria-label="ISS View"><i data-lucide="eye" class="w-3.5 h-3.5"></i></button>'
                        + '</div>'
                        // Live indicator (top-left)
                        + '<div class="absolute top-4 left-4 flex items-center gap-2 z-20 pointer-events-none">'
                        +   '<span class="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)] animate-pulse"></span>'
                        +   '<span class="text-white/50 text-[9px] font-mono uppercase tracking-[0.15em]">LIVE</span>'
                        +   '<span class="text-white/25 text-[8px] font-mono" id="t-engine">Three.js</span>'
                        + '</div>'
                        // 2D Minimap (bottom-right)
                        + '<div class="absolute bottom-[68px] right-3 w-[210px] h-[120px] rounded-lg border border-white/[0.1] bg-[#020812]/90 overflow-hidden z-20 pointer-events-none shadow-[0_4px_20px_rgba(0,0,0,0.6)]" id="iss-mm-wrap">'
                        +   '<canvas id="iss-mm-canvas" class="w-full h-full block"></canvas>'
                        +   '<div class="absolute top-0.5 left-1.5 text-[7px] text-white/25 uppercase tracking-wider">2D TRACK</div>'
                        + '</div>'
                        + '</div>';
                    if (window.lucide) lucide.createIcons({ root: el });
                    var loading = document.getElementById('iss-loading');
                    if (loading) loading.style.display = 'none';

                    setTimeout(function() { os._issInit(); }, 120);
                }

                // Unified 5-second ISS position + telemetry poll
                var pollISS = async function() {
                    try {
                        var pos = await os._fetchJson('https://api.wheretheiss.at/v1/satellites/25544', 8000);
                        if (!pos) return;
                        var lat = Number(pos.latitude), lon = Number(pos.longitude),
                            alt = Number(pos.altitude), vel = Number(pos.velocity);
                        var d = os._iss3d;
                        if (d) {
                            d.tarLat = lat; d.tarLon = lon; d.tarAlt = alt; d.tarVel = vel;
                            if (!d.lastTraj || Date.now() - d.lastTraj > 30000) {
                                os._issUpdateTraj(pos.timestamp || Math.floor(Date.now()/1000));
                            }
                        }
                        var set = function(id,v) { var e=document.getElementById(id); if(e)e.textContent=v; };
                        set('t-lat', lat.toFixed(4)+'°');
                        set('t-lon', lon.toFixed(4)+'°');
                        set('t-alt', alt.toFixed(1)+' km');
                        set('t-vel', vel.toFixed(0)+' km/h');
                        set('t-vis', String(pos.visibility||'--'));
                        set('t-foot', Number(pos.footprint||0).toFixed(0)+' km');
                        var loc = 'International Waters';
                        if (lat>70) loc='Arctic';
                        else if (lat<-60) loc='Antarctic';
                        else if (lat>15&&lat<72&&lon>-170&&lon<-30) loc='North America';
                        else if (lat>-60&&lat<15&&lon>-82&&lon<-34) loc='South America';
                        else if (lat>35&&lat<72&&lon>-10&&lon<40) loc='Europe';
                        else if (lat>-35&&lat<37&&lon>-18&&lon<52) loc='Africa';
                        else if (lat>5&&lat<72&&lon>40&&lon<180) loc='Asia';
                        else if (lat>-40&&lat<-10&&lon>113&&lon<155) loc='Australia';
                        else if (lon>-100&&lon<20) loc='Atlantic Ocean';
                        else if (lon>-180&&lon<-100) loc='Pacific Ocean';
                        else if (lon>20&&lon<130) loc='Indian Ocean';
                        set('t-loc', loc);
                    } catch(e) {
                        var locEl = document.getElementById('t-loc');
                        if (locEl && locEl.textContent === 'Acquiring...') locEl.textContent = 'Uplink Offline';
                    }
                };

                await pollISS();
                os._issTimer = setInterval(pollISS, 5000);
                if (manual && typeof Notifications !== 'undefined') Notifications.push('ISS', 'Orbital tracking active');
            },

    _issInit: function() {
                os._issInitThree();
            },

    _issInitThree: function() {
                var container = document.getElementById('iss-render-surface');
                if (!container || !window.THREE) return;

                // Remove any Cesium content
                container.innerHTML = '';
                var canvas = document.createElement('canvas');
                canvas.id = 'iss-canvas';
                canvas.style.cssText = 'position:absolute;inset:0;display:block;width:100%;height:100%;';
                container.appendChild(canvas);

                var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
                renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
                renderer.setClearColor(0x000000, 1);

                var scene = new THREE.Scene();
                var camera = new THREE.PerspectiveCamera(38, 1.6, 0.05, 100);
                camera.position.set(0, 0.2, 3.0);

                // Stars
                var sGeo = new THREE.BufferGeometry(), sPts = [];
                for (var i=0;i<1800;i++) {
                    var r=16+Math.random()*4, th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1);
                    var gl=Math.abs(ph-Math.PI/2);
                    if (Math.random() < (gl<0.25?0.6:0.1)) sPts.push(r*Math.sin(ph)*Math.cos(th), r*Math.sin(ph)*Math.sin(th), r*Math.cos(ph));
                }
                sGeo.setAttribute('position', new THREE.Float32BufferAttribute(sPts,3));
                scene.add(new THREE.Points(sGeo, new THREE.PointsMaterial({size:0.02,color:0xffffff,transparent:true,opacity:0.75,depthWrite:false})));

                // Earth group
                var earthGrp = new THREE.Group(); scene.add(earthGrp);

                // Earth
                var eTex = os._issMakeEarthTex();
                var eGeo = new THREE.SphereGeometry(1,200,200);
                var eMat = new THREE.MeshPhongMaterial({map:eTex,shininess:12,specular:new THREE.Color(0x1a3a5c),emissive:new THREE.Color(0x000510),emissiveIntensity:0.06});
                var earth = new THREE.Mesh(eGeo,eMat); earthGrp.add(earth);

                // Try HD texture
                (function(){
                    var ld=new THREE.TextureLoader(); ld.setCrossOrigin('anonymous');
                    var urls=['https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg','https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg','https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg'];
                    var done=false;
                    function tl(idx){if(idx>=urls.length||done)return;ld.load(urls[idx],function(tx){if(done)return;done=true;if(THREE.sRGBEncoding)tx.encoding=THREE.sRGBEncoding;if(THREE.SRGBColorSpace)tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=16;eMat.map=tx;eMat.needsUpdate=true;},undefined,function(){tl(idx+1);});}
                    tl(0);
                })();

                // Atmosphere
                var aGeo=new THREE.SphereGeometry(1.055,100,100);
                var aMat=new THREE.MeshBasicMaterial({color:0x4488cc,transparent:true,opacity:0.13,side:THREE.BackSide,depthWrite:false});
                var atmos=new THREE.Mesh(aGeo,aMat); atmos.renderOrder=10; earthGrp.add(atmos);

                // Atmosphere inner
                var a2Geo=new THREE.SphereGeometry(1.008,80,80);
                var a2Mat=new THREE.MeshBasicMaterial({color:0x88ccff,transparent:true,opacity:0.04,side:THREE.FrontSide,depthWrite:false});
                var atmos2=new THREE.Mesh(a2Geo,a2Mat); atmos2.renderOrder=11; earthGrp.add(atmos2);

                // Clouds
                var cTex=os._issMakeCloudTex();
                var cGeo=new THREE.SphereGeometry(1.014,100,100);
                var cMat=new THREE.MeshPhongMaterial({map:cTex,transparent:true,opacity:0.2,depthWrite:false});
                var clouds=new THREE.Mesh(cGeo,cMat); clouds.renderOrder=5; earthGrp.add(clouds);

                // Lighting
                var sd=os._issSunPos();
                var sl=new THREE.DirectionalLight(0xffffff,1.8); sl.position.copy(sd.clone().multiplyScalar(5)); scene.add(sl);
                scene.add(new THREE.AmbientLight(0x334466,0.5));
                var fl=new THREE.DirectionalLight(0x5599cc,0.35); fl.position.set(-3,1.5,-4); scene.add(fl);

                // ISS marker group
                var issMarker = new THREE.Group();

                // Try loading NASA GLB model
                if (typeof THREE.GLTFLoader !== 'undefined') {
                    var gltfLoader = new THREE.GLTFLoader();
                    gltfLoader.load(os._issNasaModelUrl, function(gltf) {
                        var model = gltf.scene;
                        model.scale.set(0.04, 0.04, 0.04);
                        // Rotate to face outward from Earth center
                        model.rotation.x = Math.PI/2;
                        issMarker.add(model);
                        if (os._iss3d) os._iss3d.issModelLoaded = true;
                    }, undefined, function() {
                        // Fallback to procedural model
                        os._issAddProceduralModel(issMarker);
                    });
                } else {
                    os._issAddProceduralModel(issMarker);
                }

                // Beacon ring
                var bGeo=new THREE.TorusGeometry(0.045,0.004,16,32);
                var bMat=new THREE.MeshBasicMaterial({color:0xff4060,transparent:true,opacity:0.9,depthTest:false,depthWrite:false});
                var beacon=new THREE.Mesh(bGeo,bMat); beacon.renderOrder=30; issMarker.add(beacon);

                // Glow
                var glGeo=new THREE.SphereGeometry(0.032,16,16);
                var glMat=new THREE.MeshBasicMaterial({color:0xff5577,transparent:true,opacity:0.45,depthTest:false,depthWrite:false});
                var glow=new THREE.Mesh(glGeo,glMat); glow.renderOrder=29; issMarker.add(glow);

                // Stem
                var stGeo=new THREE.CylinderGeometry(0.0025,0.0025,0.07,8);
                var st=new THREE.Mesh(stGeo,new THREE.MeshBasicMaterial({color:0xff8899,transparent:true,opacity:0.55}));
                st.position.y=-0.038; issMarker.add(st);

                earthGrp.add(issMarker);

                // Ground marker
                var gMkr=new THREE.Group();
                gMkr.add(new THREE.Mesh(new THREE.SphereGeometry(0.014,16,16),new THREE.MeshBasicMaterial({color:0x22d3ee})));
                var gR=new THREE.Mesh(new THREE.RingGeometry(0.017,0.024,32),new THREE.MeshBasicMaterial({color:0x22d3ee,side:THREE.DoubleSide,transparent:true,opacity:0.55,depthTest:false,depthWrite:false}));
                gR.renderOrder=28; gMkr.add(gR); earthGrp.add(gMkr);

                // Orbit lines
                function mkL(col,op){var l=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:col,transparent:true,opacity:op,depthTest:false,depthWrite:false}));return l;}
                var orb=mkL(0xffffff,0.92); orb.renderOrder=20;
                var pastL=mkL(0x8899aa,0.55); pastL.renderOrder=18;
                var gndL=mkL(0x22d3ee,0.78); gndL.renderOrder=19;
                var oRing=mkL(0x334466,0.22); oRing.renderOrder=17;
                earthGrp.add(orb); earthGrp.add(pastL); earthGrp.add(gndL); earthGrp.add(oRing);

                // Footprint ring
                var fpR=new THREE.Mesh(new THREE.RingGeometry(0.06,0.064,64),new THREE.MeshBasicMaterial({color:0xff8844,side:THREE.DoubleSide,transparent:true,opacity:0.28,depthTest:false,depthWrite:false}));
                fpR.renderOrder=27; earthGrp.add(fpR);

                // Path dots
                var pDots=new THREE.Group(); pDots.renderOrder=21; earthGrp.add(pDots);

                // Orbit plane ring
                var rPts=[];
                for (var i=0;i<=128;i++){var a=(i/128)*Math.PI*2;rPts.push(new THREE.Vector3(Math.cos(a)*1.08,0,Math.sin(a)*1.08));}
                oRing.geometry.dispose(); oRing.geometry=new THREE.BufferGeometry().setFromPoints(rPts);
                oRing.rotation.x=(90-51.64)*Math.PI/180;

                // Sun arrow
                var saGeo=new THREE.ConeGeometry(0.035,0.1,8);
                var sa=new THREE.Mesh(saGeo,new THREE.MeshBasicMaterial({color:0xffdd44,transparent:true,opacity:0.55,depthTest:false,depthWrite:false}));
                sa.renderOrder=30; sa.position.copy(sd.clone().multiplyScalar(1.8)); sa.lookAt(sd.clone().multiplyScalar(3));
                earthGrp.add(sa);

                // Store
                os._iss3d = {
                    engine: 'three',
                    renderer:renderer, scene:scene, camera:camera,
                    earthGrp:earthGrp, earth:earth, eMat:eMat,
                    atmos:atmos, atmos2:atmos2, clouds:clouds,
                    sl:sl, sa:sa,
                    issMarker:issMarker, beacon:beacon, bMat:bMat, glow:glow,
                    gMkr:gMkr,
                    orb:orb, pastL:pastL, gndL:gndL, oRing:oRing, pDots:pDots, fpR:fpR,
                    canvas:canvas, host:container,
                    zoom:3.0, tarZoom:3.0,
                    rotX:0.25, rotY:-0.55, tarRotX:0.25, tarRotY:-0.55,
                    curLat:0, curLon:0, curAlt:420,
                    tarLat:0, tarLon:0, tarAlt:420, tarVel:27600,
                    dragging:false, lx:0, ly:0, lastTraj:0,
                    camMode:'free', cinAngle:0, time:0,
                    issModelLoaded:false
                };

                document.getElementById('t-engine').textContent = 'Three.js';

                // Resize
                function doResize(){
                    var d=os._iss3d; if(!d||!d.host)return;
                    var rect=d.host.getBoundingClientRect();
                    var w=Math.max(100,Math.floor(rect.width||800));
                    var h=Math.max(100,Math.floor(rect.height||500));
                    d.canvas.style.width=w+'px'; d.canvas.style.height=h+'px';
                    d.renderer.setSize(w,h,false);
                    d.camera.aspect=w/Math.max(1,h); d.camera.updateProjectionMatrix();
                }
                setTimeout(doResize,50); setTimeout(doResize,250); setTimeout(doResize,800);
                if(window.ResizeObserver){
                    if(os._issRO)os._issRO.disconnect();
                    os._issRO=new ResizeObserver(function(){doResize();});
                    os._issRO.observe(container);
                }

                // Input
                container.addEventListener('wheel',function(e){
                    e.preventDefault();
                    var d=os._iss3d; if(!d||d.camMode==='firstperson')return;
                    d.tarZoom=Math.min(7.0,Math.max(1.3,d.tarZoom+e.deltaY*0.0035));
                },{passive:false});

                container.addEventListener('pointerdown',function(e){
                    var d=os._iss3d; if(!d)return;
                    d.dragging=true; d.lx=e.clientX; d.ly=e.clientY;
                    if(container.setPointerCapture)container.setPointerCapture(e.pointerId);
                });

                container.addEventListener('pointermove',function(e){
                    var d=os._iss3d; if(!d||!d.dragging)return;
                    d.tarRotY+=(e.clientX-d.lx)*0.004;
                    d.tarRotX+=(e.clientY-d.ly)*0.004;
                    d.tarRotX=Math.max(-1.4,Math.min(1.4,d.tarRotX));
                    d.lx=e.clientX; d.ly=e.clientY;
                });

                function onUp(){if(os._iss3d)os._iss3d.dragging=false;}
                container.addEventListener('pointerup',onUp);
                container.addEventListener('pointerleave',onUp);

                os._issInitMM();
                os._issStartLoop();
            },

    _issAddProceduralModel: function(marker) {
                var g=new THREE.Group();
                var mW=new THREE.MeshPhongMaterial({color:0xf0f0f0,specular:0x555555,shininess:40});
                var mG=new THREE.MeshPhongMaterial({color:0xd4a954,specular:0x996633,shininess:70});
                var mS=new THREE.MeshPhongMaterial({color:0x1a2b6c,specular:0x4466aa,shininess:15,emissive:0x04081a});
                var mD=new THREE.MeshPhongMaterial({color:0x334455,specular:0x333333,shininess:20});
                var mC=new THREE.MeshPhongMaterial({color:0xb87333,specular:0x775522,shininess:50});
                g.add(new THREE.Mesh(new THREE.BoxGeometry(0.14,0.016,0.016),mW));
                for(var i=-0.06;i<=0.06;i+=0.012){
                    var cr=new THREE.Mesh(new THREE.BoxGeometry(0.005,0.018,0.018),mD);
                    cr.position.set(i,0,0); g.add(cr);
                }
                [{x:-0.035,l:0.02,r:0.009,c:mW},{x:-0.018,l:0.025,r:0.01,c:mW},{x:0,l:0.022,r:0.009,c:mG},{x:0.018,l:0.02,r:0.009,c:mW},{x:0.035,l:0.018,r:0.008,c:mW}].forEach(function(m){
                    var mod=new THREE.Mesh(new THREE.CylinderGeometry(m.r,m.r,m.l,16),m.c);
                    mod.rotation.z=Math.PI/2; mod.position.set(m.x,0,0); g.add(mod);
                });
                [-1,1].forEach(function(s){
                    var pg=new THREE.Group();
                    pg.add(new THREE.Mesh(new THREE.BoxGeometry(0.0015,0.04,0.03),mD));
                    [0,0.02].forEach(function(y){
                        var p=new THREE.Mesh(new THREE.PlaneGeometry(0.032,0.022),mS);
                        p.rotation.y=Math.PI/2; p.position.y=y; pg.add(p);
                    });
                    pg.position.set(s*0.08,0,0); g.add(pg);
                });
                [-1,1].forEach(function(s){
                    var r=new THREE.Mesh(new THREE.BoxGeometry(0.006,0.012,0.024),mC);
                    r.position.set(s*0.07,-0.014,0); g.add(r);
                });
                var d=new THREE.Mesh(new THREE.CylinderGeometry(0.007,0.008,0.014,12),mG);
                d.rotation.z=Math.PI/2; d.position.set(0.075,0,0); g.add(d);
                var cu=new THREE.Mesh(new THREE.SphereGeometry(0.006,8,8),mC);
                cu.position.set(-0.045,0.01,0); g.add(cu);
                g.scale.set(0.55,0.55,0.55);
                marker.add(g);
            },

    _issStartLoop: function() {
                var d = os._iss3d;
                if (!d) return;

                // Three.js loop
                function animate(ts) {
                    var d2 = os._iss3d;
                    if (!d2 || d2.engine !== 'three' || !document.getElementById('iss-canvas')) {
                        return;
                    }
                    d2.time = ts * 0.001;

                    // Interpolation
                    d2.rotX += (d2.tarRotX - d2.rotX) * 0.08;
                    d2.rotY += (d2.tarRotY - d2.rotY) * 0.08;
                    d2.zoom += (d2.tarZoom - d2.zoom) * 0.08;

                    if (d2.tarLat !== undefined && d2.tarLat !== null) {
                        var lf = 0.08;
                        d2.curLat += (d2.tarLat - d2.curLat) * lf;
                        var dLon = d2.tarLon - d2.curLon;
                        if (Math.abs(dLon) > 180) dLon = dLon > 0 ? dLon - 360 : dLon + 360;
                        d2.curLon += dLon * lf;
                        if (d2.curLon > 180) d2.curLon -= 360;
                        if (d2.curLon < -180) d2.curLon += 360;
                        d2.curAlt += (d2.tarAlt - d2.curAlt) * lf;
                    }

                    // Camera
                    var mode = d2.camMode;
                    if (mode === 'free') {
                        d2.earthGrp.rotation.x = d2.rotX;
                        d2.earthGrp.rotation.y = d2.rotY;
                        d2.camera.position.set(0, 0, d2.zoom);
                        d2.camera.lookAt(0, 0, 0);
                    } else if (mode === 'follow') {
                        d2.earthGrp.rotation.x += (d2.rotX - d2.earthGrp.rotation.x) * 0.05;
                        d2.earthGrp.rotation.y += (d2.rotY - d2.earthGrp.rotation.y) * 0.05;
                        d2.camera.position.set(0, 0, d2.zoom);
                        d2.camera.lookAt(0, 0, 0);
                    } else if (mode === 'firstperson') {
                        var issR = os._issRad(d2.curAlt, 1.0);
                        var issP = os._issLLVec(d2.curLat, d2.curLon, issR);
                        d2.earthGrp.rotation.set(0, 0, 0);
                        d2.camera.position.copy(issP);
                        d2.camera.lookAt(0, 0, 0);
                    }

                    // ISS marker
                    var issR2 = os._issRad(d2.curAlt, 1.08);
                    var issP2 = os._issLLVec(d2.curLat, d2.curLon, issR2);
                    d2.issMarker.position.copy(issP2);
                    d2.issMarker.lookAt(new THREE.Vector3(0, 0, 0));

                    // Ground marker
                    var gP = os._issLLVec(d2.curLat, d2.curLon, 1.006);
                    d2.gMkr.position.copy(gP);
                    d2.gMkr.lookAt(new THREE.Vector3(0, 0, 0));

                    // Footprint
                    d2.fpR.position.copy(gP);
                    d2.fpR.lookAt(new THREE.Vector3(0, 0, 0));

                    // Sun
                    var sd = os._issSunPos();
                    d2.sl.position.copy(sd.clone().multiplyScalar(5));
                    d2.sa.position.copy(sd.clone().multiplyScalar(1.8));
                    d2.sa.lookAt(sd.clone().multiplyScalar(3));
                    d2.atmos.material.opacity = 0.09 + 0.04 * (0.5 + 0.5 * sd.y);

                    // Pulse
                    d2.beacon.scale.setScalar(1 + Math.sin(d2.time * 3.5) * 0.25);
                    d2.bMat.opacity = 0.55 + Math.sin(d2.time * 2.5) * 0.35;
                    d2.glow.scale.setScalar(1 + Math.sin(d2.time * 3) * 0.15);

                    // Clouds
                    d2.clouds.rotation.y += 0.00025;

                    // Auto-rotate
                    if (!d2.dragging && mode === 'free') d2.tarRotY += 0.001;

                    d2.renderer.render(d2.scene, d2.camera);
                    os._issDrawMM();

                    os._issAnimFrame = requestAnimationFrame(animate);
                }
                os._issAnimFrame = requestAnimationFrame(animate);

                os.issResetCamera = function() { os.issSetCam('free'); };
            },

    issSetCam: function(mode) {
                var d = os._iss3d;
                if (!d) return;
                d.camMode = mode;
                if (d.engine === 'three') {
                    if (mode === 'free') { d.tarZoom = 3.0; d.tarRotX = 0.25; d.tarRotY = -0.55; }
                    else if (mode === 'follow') { d.tarZoom = 2.5; }
                    else if (mode === 'firstperson') { var r = os._issRad(d.curAlt, 1.0); d.zoom = r; d.tarZoom = r; }
                }
                var btns = document.querySelectorAll('.cam-btn');
                for (var i = 0; i < btns.length; i++) {
                    var b = btns[i];
                    if (b.dataset.cam === mode) {
                        b.style.color = '#ffffff';
                        b.style.borderColor = 'rgba(255,255,255,0.35)';
                        b.style.background = 'rgba(255,255,255,0.12)';
                    } else {
                        b.style.color = 'rgba(255,255,255,0.5)';
                        b.style.borderColor = 'rgba(255,255,255,0.1)';
                        b.style.background = 'rgba(0,0,0,0.6)';
                    }
                }
            },

    _issInitMM: function() {
                var mc = document.getElementById('iss-mm-canvas');
                if (!mc) return;
                var wrap = document.getElementById('iss-mm-wrap');
                var w = wrap ? Math.floor(wrap.clientWidth) : 210;
                var h = wrap ? Math.floor(wrap.clientHeight) : 120;
                mc.width = w * 2;
                mc.height = h * 2;
                os._issMM = { canvas: mc, w: mc.width, h: mc.height };
                os._issDrawMMStatic();
            },

    _issDrawMMStatic: function() {
                var mm = os._issMM;
                if (!mm || !mm.canvas) return;
                var ctx = mm.canvas.getContext('2d'), w = mm.w, h = mm.h;
                
                // Ocean
                ctx.fillStyle = '#020a18'; ctx.fillRect(0, 0, w, h);
                
                // Grid
                ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 0.5;
                for (var i=0; i<w; i+=w/36) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,h); ctx.stroke(); }
                for (var i=0; i<h; i+=h/18) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(w,i); ctx.stroke(); }
                
                // Equator
                ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 0.5;
                ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();
                
                // Tropic lines
                ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 0.3;
                [h*0.26, h*0.74].forEach(function(y) {
                    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
                });

                // Simplified continent outlines
                ctx.fillStyle = 'rgba(255,255,255,0.06)';
                var continents = [
                    // North America
                    {x:0.06,y:0.14,w:0.19,h:0.18},
                    {x:0.03,y:0.12,w:0.12,h:0.10},
                    // South America
                    {x:0.15,y:0.50,w:0.07,h:0.18},
                    // Europe
                    {x:0.44,y:0.16,w:0.09,h:0.12},
                    // Africa
                    {x:0.43,y:0.32,w:0.10,h:0.24},
                    // Asia
                    {x:0.52,y:0.10,w:0.20,h:0.18},
                    {x:0.58,y:0.18,w:0.18,h:0.14},
                    // India
                    {x:0.60,y:0.30,w:0.05,h:0.08},
                    // SE Asia
                    {x:0.68,y:0.28,w:0.08,h:0.10},
                    // Japan
                    {x:0.82,y:0.24,w:0.02,h:0.04},
                    // Australia
                    {x:0.72,y:0.55,w:0.10,h:0.12},
                    // New Zealand
                    {x:0.86,y:0.63,w:0.02,h:0.04},
                    // Greenland
                    {x:0.20,y:0.06,w:0.04,h:0.05},
                    // Indonesia
                    {x:0.72,y:0.40,w:0.08,h:0.04},
                    // Middle East
                    {x:0.50,y:0.30,w:0.04,h:0.06},
                ];
                continents.forEach(function(c) {
                    ctx.fillRect(c.x*w, c.y*h, c.w*w, c.h*h);
                });

                // Ice caps
                ctx.fillStyle = 'rgba(200,220,255,0.08)';
                ctx.fillRect(0, 0, w, h*0.05);
                ctx.fillRect(0, h*0.93, w, h*0.07);

                mm.staticDrawn = true;
            },

    _issDrawMM: function() {
                var mm = os._issMM, d = os._iss3d;
                if (!mm || !mm.canvas || !d) return;

                // Redraw static base every 30 frames
                if (!mm.frameCount) mm.frameCount = 0;
                mm.frameCount++;
                if (mm.frameCount % 30 === 0) {
                    os._issDrawMMStatic();
                }

                var ctx = mm.canvas.getContext('2d'), w = mm.w, h = mm.h;
                var ix = ((d.curLon + 180) / 360) * w;
                var iy = ((90 - d.curLat) / 180) * h;

                // Only clear the ISS marker area from previous frame
                // We overlay on the static base

                // Day/night terminator
                var now = new Date();
                var sunLon = ((now.getUTCHours() + now.getUTCMinutes()/60) - 12) * 15;
                var termX = ((sunLon + 180) / 360) * w;

                // Draw the dynamic overlay
                // ISS position - pulse ring
                ctx.strokeStyle = 'rgba(255,60,90,0.7)'; ctx.lineWidth = 2;
                ctx.beginPath();
                var r = 6 + Math.sin(Date.now() * 0.005) * 2;
                ctx.arc(ix, iy, r, 0, Math.PI*2);
                ctx.stroke();

                // ISS red dot
                ctx.fillStyle = '#ff4060'; ctx.beginPath();
                ctx.arc(ix, iy, 4, 0, Math.PI*2); ctx.fill();

                // ISS white center
                ctx.fillStyle = '#ffffff'; ctx.beginPath();
                ctx.arc(ix, iy, 1.5, 0, Math.PI*2); ctx.fill();

                // Ground track cyan dot
                ctx.fillStyle = '#22d3ee'; ctx.beginPath();
                ctx.arc(ix, iy, 3, 0, Math.PI*2); ctx.fill();

                // Label
                ctx.fillStyle = '#ffffff'; ctx.font = '9px monospace';
                var label = d.curLat.toFixed(1)+'° '+d.curLon.toFixed(1)+'°';
                var lx = ix + 8, ly = iy - 6;
                if (lx > w - 60) lx = ix - 8 - ctx.measureText(label).width;
                if (ly < 10) ly = iy + 16;
                ctx.fillText(label, lx, ly);

                // Sun indicator
                var sx = ((sunLon + 180) / 360) * w;
                ctx.fillStyle = '#ffdd44'; ctx.beginPath();
                ctx.arc(sx, h*0.08, 5, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#ffffff'; ctx.fillText('\u2600', sx-7, h*0.08+4);
            },

    _issLLVec: function(lat, lon, r) {
                r = r || 1.0;
                var phi = (90 - Number(lat)) * Math.PI / 180;
                var theta = (Number(lon) + 180) * Math.PI / 180;
                return new THREE.Vector3(-(r*Math.sin(phi)*Math.cos(theta)), r*Math.cos(phi), r*Math.sin(phi)*Math.sin(theta));
            },

    _issRad: function(alt, vb) {
                vb = vb || 1.0;
                return 1 + ((Number.isFinite(Number(alt)) ? Number(alt) : 420) / 6371) * vb;
            },

    _issSetLine: function(line, pts, mode) {
                if (!line || !pts || pts.length < 2) return;
                var arr = [];
                for (var i = 0; i < pts.length; i++) {
                    var p = pts[i];
                    var r = mode === 'orbit' ? os._issRad(p.altitude, 1.12) : 1.005;
                    arr.push(os._issLLVec(p.latitude, p.longitude, r));
                }
                if (line.geometry && line.geometry.dispose) line.geometry.dispose();
                line.geometry = new THREE.BufferGeometry().setFromPoints(arr);
                line.geometry.computeBoundingSphere();
                if (line.material) { line.material.depthTest = false; line.material.depthWrite = false; line.material.needsUpdate = true; }
            },

    _issClrDots: function() {
                var d = os._iss3d;
                if (!d || !d.pDots) return;
                while (d.pDots.children.length) {
                    var c = d.pDots.children.pop();
                    if (c.geometry && c.geometry.dispose) c.geometry.dispose();
                    if (c.material && c.material.dispose) c.material.dispose();
                }
            },

    _issAddDots: function(pts, color, every, mode) {
                color = color || 0xffffff; every = every || 3; mode = mode || 'orbit';
                var d = os._iss3d;
                if (!d || !d.pDots || !pts) return;
                for (var i = 0; i < pts.length; i++) {
                    if (i % every !== 0) continue;
                    var p = pts[i];
                    var r = mode === 'orbit' ? os._issRad(p.altitude, 1.12) : 1.006;
                    var mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.8, depthTest: false, depthWrite: false });
                    var dot = new THREE.Mesh(new THREE.SphereGeometry(mode==='orbit'?0.007:0.004, 8, 8), mat);
                    dot.position.copy(os._issLLVec(p.latitude, p.longitude, r));
                    dot.renderOrder = 22;
                    d.pDots.add(dot);
                }
            },

    _issFallTraj: function(t0) {
                var d = os._iss3d || {};
                var bl = Number(d.curLat || 0), bL = Number(d.curLon || 0), alt = Number(d.curAlt || 420);
                var inc = 51.64 * Math.PI / 180, per = 92.68, out = [];
                for (var m = -46; m <= 46; m += 2) {
                    var a = (m / per) * Math.PI * 2;
                    var sl = Math.sin(bl * Math.PI/180), si = Math.sin(inc);
                    var anom = a + Math.asin(sl / si);
                    var lat = Math.asin(si * Math.sin(anom)) * 180/Math.PI;
                    var lon = bL + (m * 360 / per) * 1.06;
                    lon = ((lon + 540) % 360) - 180;
                    out.push({ latitude: lat, longitude: lon, altitude: alt, timestamp: t0 + m*60, _fallback: true });
                }
                return out;
            },

    _issUpdateTraj: async function(ct) {
                var d = os._iss3d;
                if (!d || !ct) return;
                var now = Date.now();
                if (d.lastTraj && now - d.lastTraj < 30000) return;
                var t0 = Math.floor(ct), valid = [], src = 'API';
                try {
                    var stamps = [];
                    for (var m = -46; m <= 46; m += 1) stamps.push(t0 + m*60);
                    var url = 'https://api.wheretheiss.at/v1/satellites/25544/positions?timestamps=' + stamps.join(',') + '&units=kilometers';
                    var res = await fetch(url, { signal: AbortSignal.timeout(12000), cache: 'no-store' });
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    var data = await res.json();
                    valid = (Array.isArray(data) ? data : [])
                        .filter(function(p) { return Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude)); })
                        .sort(function(a, b) { return (a.timestamp||0) - (b.timestamp||0); });
                    if (valid.length < 10) throw new Error('Too few points');
                } catch(e) {
                    src = 'FALLBACK'; valid = os._issFallTraj(t0);
                }
                var past = valid.filter(function(p) { return (p.timestamp||t0) <= t0; });
                var fut = valid.filter(function(p) { return (p.timestamp||t0) >= t0; });

                if (d.engine === 'three') {
                    os._issSetLine(d.pastL, past, 'orbit');
                    os._issSetLine(d.orb, fut, 'orbit');
                    os._issSetLine(d.gndL, valid, 'ground');
                    os._issClrDots();
                    os._issAddDots(past, 0x8899aa, 5, 'orbit');
                    os._issAddDots(fut, 0xffffff, 5, 'orbit');
                    os._issAddDots(valid, 0x22d3ee, 8, 'ground');
                }

                d.lastTraj = now;
            }
});
