// AetherOS — Weather Station, NASA Explorer, ISS 3D Orbital Tracker & Game Vault
window.extendOS({
    _weatherUnit: 'C',
    _weatherRequestID: 0,
    _weatherLocationID: 0,
    _weatherControllers: {},
    weatherEscape: (value) => String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])),
    weatherNumber: (value) => typeof value==='number'&&Number.isFinite(value),
    weatherStatus: (message) => {const el=document.getElementById('weather-status');if(el)el.textContent=message;},
    weatherFetch: async (url,channel) => {
        os._weatherControllers[channel]?.abort();const controller=new AbortController();os._weatherControllers[channel]=controller;
        const timer=setTimeout(()=>controller.abort(),10000);
        try{const response=await fetch(url,{signal:controller.signal,credentials:'omit'});if(!response.ok)throw Error('Weather provider HTTP '+response.status);return await response.json();}
        finally{clearTimeout(timer);if(os._weatherControllers[channel]===controller)delete os._weatherControllers[channel];}
    },
    weatherDispose: () => {
        os._weatherRequestID++;os._weatherLocationID++;Object.values(os._weatherControllers).forEach(c=>c.abort());os._weatherControllers={};
    },
    searchWeather: async (query) => {
        query=String(query||'').trim();if(!query)return;
        const id=++os._weatherLocationID,host=document.getElementById('weather-locations');os.weatherStatus('Finding matching cities…');if(host)host.replaceChildren();
        try{
            const data=await os.weatherFetch('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(query)+'&count=6&language=en&format=json','search');
            if(id!==os._weatherLocationID)return;
            const matches=(Array.isArray(data.results)?data.results:[]).filter(item=>os.weatherNumber(item.latitude)&&os.weatherNumber(item.longitude));
            if(host)for(const item of matches){const button=document.createElement('button');button.type='button';button.className='weather-location-result';button.textContent=[item.name,item.admin1,item.country].filter(Boolean).join(', ');button.addEventListener('click',()=>os.weatherChooseLocation({lat:item.latitude,lon:item.longitude,city:item.name,country:item.country||'',source:'City search'}));host.append(button);}
            os.weatherStatus(matches.length?'Choose the matching city below':'No matching cities · try another spelling');
        }catch(error){if(id===os._weatherLocationID)os.weatherStatus('City search unavailable · '+(error.name==='AbortError'?'request cancelled or timed out':error.message));}
    },
    weatherChooseLocation: async (location) => {
        if(!location||!os.weatherNumber(location.lat)||!os.weatherNumber(location.lon)||Math.abs(location.lat)>90||Math.abs(location.lon)>180)return;
        os._weatherLocationID++;os._weatherManualOverride=location;
        document.getElementById('weather-locations')?.replaceChildren();
        try{localStorage.setItem('aether_weather_location_v2',JSON.stringify(location));}catch(_){os._weatherStorageWarning=true;}
        return os.initWeatherStation(true);
    },
    resetWeatherLocation: () => {
        const id=++os._weatherLocationID;
        if(!navigator.geolocation){os.weatherStatus('Device location unavailable · search for a city instead');return;}
        os.weatherStatus('Waiting for device location permission…');
        navigator.geolocation.getCurrentPosition(position=>{
            if(id!==os._weatherLocationID)return;
            os.weatherChooseLocation({lat:position.coords.latitude,lon:position.coords.longitude,city:'Device location',country:'',source:'Device coordinates'});
        },error=>{if(id===os._weatherLocationID)os.weatherStatus('Device location unavailable or denied · search for a city instead');},{timeout:10000,maximumAge:300000,enableHighAccuracy:false});
    },
    toggleWeatherUnit: () => {
        os._weatherUnit=os._weatherUnit==='C'?'F':'C';try{localStorage.setItem('aether_weather_unit',os._weatherUnit);}catch(_){os._weatherStorageWarning=true;}
        const button=document.getElementById('weather-unit');if(button)button.textContent='°'+os._weatherUnit;
        const location=os._weatherManualOverride;
        if(location&&os._weatherCache?.key===location.lat+','+location.lon)os.weatherRender(os._weatherCache);
    },
    initWeatherStation: async (force=false) => {
        const content=document.getElementById('weather-content');if(!content)return;
        if(!os._weatherPrefsLoaded){
            os._weatherPrefsLoaded=true;
            try{os._weatherUnit=localStorage.getItem('aether_weather_unit')==='F'?'F':'C';const location=JSON.parse(localStorage.getItem('aether_weather_location_v2')||'null');if(location&&os.weatherNumber(location.lat)&&os.weatherNumber(location.lon)&&Math.abs(location.lat)<=90&&Math.abs(location.lon)<=180)os._weatherManualOverride=location;}catch(_){os._weatherStorageWarning=true;}
        }
        const button=document.getElementById('weather-unit');if(button)button.textContent='°'+os._weatherUnit;
        const location=os._weatherManualOverride;
        if(!location){content.innerHTML='<div class="weather-empty"><h3>Your forecast starts with a place.</h3><p>Search for a city above, or choose Use device location. Nothing is located automatically, and no default city is presented as yours.</p></div>';os.weatherStatus('Choose a location · powered by Open-Meteo');return;}
        const key=location.lat+','+location.lon,id=++os._weatherRequestID;
        if(!force&&os._weatherCache?.key===key&&Date.now()-os._weatherCache.fetched<600000){os.weatherRender(os._weatherCache);return;}
        os.weatherStatus('Updating forecast…');
        if(os._weatherCache?.key!==key)content.innerHTML='<div class="weather-empty">Loading forecast for '+os.weatherEscape(location.city)+'…</div>';
        try{
            const query='latitude='+encodeURIComponent(location.lat)+'&longitude='+encodeURIComponent(location.lon);
            const [data,air]=await Promise.all([
                os.weatherFetch('https://api.open-meteo.com/v1/forecast?'+query+'&current=is_day,temperature_2m,wind_speed_10m,weather_code,relative_humidity_2m,apparent_temperature,precipitation,surface_pressure&hourly=temperature_2m,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset,precipitation_sum&forecast_days=7&timezone=auto&timeformat=unixtime','forecast'),
                os.weatherFetch('https://air-quality-api.open-meteo.com/v1/air-quality?'+query+'&current=us_aqi,pm2_5&timeformat=unixtime','air').catch(()=>null)
            ]);
            if(id!==os._weatherRequestID)return;
            if(!data.current||!os.weatherNumber(data.current.time))throw Error('Provider returned no valid current forecast');
            os._weatherCache={key,location,data,air:air?.current||null,fetched:Date.now(),stale:false};os.weatherRender(os._weatherCache);
        }catch(error){
            if(id!==os._weatherRequestID)return;
            if(os._weatherCache?.key===key){os._weatherCache.stale=true;os.weatherRender(os._weatherCache);}
            else{content.innerHTML='<div class="weather-empty"><h3>Forecast unavailable</h3><p>'+os.weatherEscape(error.name==='AbortError'?'Request cancelled or timed out':error.message)+'</p><button type="button" class="os-btn" onclick="os.initWeatherStation(true)">Retry forecast</button></div>';os.weatherStatus('No forecast loaded · try Refresh or another location');}
        }
    },
    weatherVisual: (code,day=true) => {
        if(code===0||code===1)return {mood:day?'sunny':'night',icon:day?'sun':'moon-star'};
        if(code===2)return {mood:'partly',icon:day?'cloud-sun':'cloud-moon'};
        if(code===3)return {mood:'cloudy',icon:'cloud'};
        if([45,48].includes(code))return {mood:'fog',icon:'cloud-fog'};
        if([71,73,75,77,85,86].includes(code))return {mood:'snow',icon:'snowflake'};
        if([95,96,99].includes(code))return {mood:'storm',icon:'cloud-lightning'};
        if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code))return {mood:'rain',icon:'cloud-rain'};
        return {mood:'unknown',icon:'thermometer'};
    },
    weatherChart: (cache,hours,temp,time) => {
        const data=cache.data,esc=os.weatherEscape,num=os.weatherNumber;
        const entries=hours.map(({epoch,index})=>({epoch,t:data.hourly.temperature_2m?.[index],rain:data.hourly.precipitation_probability?.[index]}));
        os._weatherChartEntries=entries;
        if(!entries.length)return '<section class="weather-chart-card"><h3>Hourly trends</h3><p>Hourly chart unavailable for this forecast.</p></section>';
        const valid=entries.map(e=>e.t).filter(num),low=valid.length?Math.min(...valid):0,high=valid.length?Math.max(...valid):1,span=Math.max(4,high-low),floor=low-(span-(high-low))/2;
        const x=i=>50+i*660/Math.max(1,entries.length-1),y=t=>142-(t-floor)/span*98;
        const grids=valid.length?[0,.5,1].map(f=>{const yy=142-f*98;return '<line x1="45" y1="'+yy+'" x2="722" y2="'+yy+'" class="weather-chart-grid"/><text x="3" y="'+(yy+4)+'">'+esc(temp(floor+span*f))+'</text>';}).join(''):'<text x="50" y="90">Temperature readings unavailable</text>';
        let path='';let connected=false;
        const points=entries.map((e,i)=>{if(!num(e.t)){connected=false;return '';}path+=(connected?' L':' M')+x(i).toFixed(2)+','+y(e.t).toFixed(2);connected=true;return '<circle class="weather-chart-point" cx="'+x(i)+'" cy="'+y(e.t)+'" r="3"><title>'+esc(time(e.epoch)+' · '+temp(e.t))+'</title></circle>';}).join('');
        const bars=entries.map((e,i)=>num(e.rain)?'<rect class="weather-rain-bar" x="'+(x(i)-5)+'" y="'+(190-Math.max(0,Math.min(100,e.rain))*.3)+'" width="10" height="'+(Math.max(0,Math.min(100,e.rain))*.3)+'" rx="3"><title>'+esc(time(e.epoch)+' · '+e.rain+'% rain probability')+'</title></rect>':'').join('');
        const ticks=entries.map((e,i)=>i%6===0||i===entries.length-1?'<text x="'+x(i)+'" y="214" text-anchor="middle">'+esc(time(e.epoch))+'</text>':'').join('');
        return '<section class="weather-chart-card"><div class="weather-chart-heading"><div><span class="weather-eyebrow">THE DAY AHEAD</span><h3>Temperature &amp; rain</h3></div><div class="weather-chart-legend"><span>━ Temperature</span><span>▮ Rain chance · 0–100%</span></div></div><svg data-preserve-surface class="weather-chart" viewBox="0 0 750 225" role="img" aria-label="Next '+entries.length+' hours: temperature line and rain probability bars; use the hour slider or cards for exact readings"><title>Hourly temperature and rain probability. Gaps indicate unavailable values.</title>'+grids+bars+'<path class="weather-temp-line" d="'+path+'"/>'+points+ticks+'</svg><div class="weather-chart-inspector"><span id="weather-hour-detail" aria-live="polite">Move the slider to inspect an hour</span><label>Forecast hour <input id="weather-hour-slider" type="range" min="0" max="'+(entries.length-1)+'" value="0" oninput="os.weatherChartSelect(Number(this.value))" aria-label="Inspect forecast hour"></label></div></section>';
    },
    weatherChartSelect: (index) => {
        const entry=os._weatherChartEntries?.[index],cache=os._weatherCache;if(!entry||!cache)return;
        const num=os.weatherNumber,temperature=num(entry.t)?Math.round(os._weatherUnit==='F'?entry.t*9/5+32:entry.t)+'°'+os._weatherUnit:'temperature unavailable';
        let time;try{time=new Intl.DateTimeFormat('en-GB',{timeZone:cache.data.timezone||'UTC',weekday:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(entry.epoch*1000));}catch(_){time=new Date(entry.epoch*1000).toISOString();}
        const detail=document.getElementById('weather-hour-detail');if(detail)detail.textContent=time+' · '+temperature+' · '+(num(entry.rain)?entry.rain+'% rain chance':'rain chance unavailable');
        document.querySelectorAll('.weather-hour').forEach((el,i)=>el.classList.toggle('weather-hour-selected',i===index));
        const slider=document.getElementById('weather-hour-slider');if(slider)slider.setAttribute('aria-valuetext',detail?.textContent||time);
    },
    weatherAQILabel: (value) => !os.weatherNumber(value)?'Unavailable':value<=50?'Good':value<=100?'Moderate':value<=150?'Unhealthy for sensitive groups':value<=200?'Unhealthy':value<=300?'Very unhealthy':'Hazardous',
    weatherRender: (cache) => {
        const host=document.getElementById('weather-content');if(!host)return;
        const {data,location,air}=cache,c=data.current||{},unit=os._weatherUnit,esc=os.weatherEscape,num=os.weatherNumber;
        const temp=value=>num(value)?Math.round(unit==='F'?value*9/5+32:value)+'°'+unit:'—';
        const value=(v,suffix='')=>num(v)?Math.round(v)+suffix:'—';
        let zone=data.timezone||'UTC';try{new Intl.DateTimeFormat('en',{timeZone:zone});}catch(_){zone='UTC';}
        const time=(epoch,opts={hour:'2-digit',minute:'2-digit'})=>num(epoch)?new Intl.DateTimeFormat('en-GB',{timeZone:zone,...opts}).format(new Date(epoch*1000)):'—';
        const visual=os.weatherVisual(c.weather_code,c.is_day!==0);host.dataset.weatherMood=visual.mood;
        const labels={0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Rime fog',51:'Light drizzle',53:'Drizzle',55:'Dense drizzle',56:'Freezing drizzle',57:'Dense freezing drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',66:'Freezing rain',67:'Heavy freezing rain',71:'Light snow',73:'Snow',75:'Heavy snow',77:'Snow grains',80:'Rain showers',81:'Rain showers',82:'Violent showers',85:'Snow showers',86:'Heavy snow showers',95:'Thunderstorm',96:'Thunderstorm with hail',99:'Thunderstorm with heavy hail'};
        const condition=code=>labels[code]||'Condition unavailable';
        const hours=(data.hourly?.time||[]).map((epoch,index)=>({epoch,index})).filter(({epoch})=>num(epoch)&&epoch>=c.time).slice(0,24);
        const hourly=hours.map(({epoch,index})=>'<div class="weather-hour"><time>'+esc(time(epoch))+'</time><strong>'+temp(data.hourly.temperature_2m?.[index])+'</strong><span>'+value(data.hourly.precipitation_probability?.[index],'%')+' rain</span></div>').join('');
        const rangeValues=[...(data.daily?.temperature_2m_min||[]),...(data.daily?.temperature_2m_max||[])].filter(num),rangeLow=rangeValues.length?Math.min(...rangeValues):0,rangeSpan=rangeValues.length?Math.max(1,Math.max(...rangeValues)-rangeLow):1;
        const daily=(data.daily?.time||[]).slice(0,7).map((epoch,index)=>'<div class="weather-day"><time>'+esc(time(epoch,{weekday:'short',day:'numeric'}))+'</time><span class="weather-day-condition"><i data-lucide="'+os.weatherVisual(data.daily.weather_code?.[index]).icon+'" aria-hidden="true"></i>'+esc(condition(data.daily.weather_code?.[index]))+'</span><strong>'+temp(data.daily.temperature_2m_max?.[index])+' / '+temp(data.daily.temperature_2m_min?.[index])+'</strong><div class="weather-day-range" aria-hidden="true">'+(num(data.daily.temperature_2m_min?.[index])&&num(data.daily.temperature_2m_max?.[index])?'<b style="left:'+Math.max(0,(data.daily.temperature_2m_min[index]-rangeLow)/rangeSpan*100)+'%;width:'+Math.max(2,(data.daily.temperature_2m_max[index]-data.daily.temperature_2m_min[index])/rangeSpan*100)+'%"></b>':'')+'</div><span>'+value(data.daily.precipitation_sum?.[index],' mm')+'</span></div>').join('');
        const metric=(label,reading)=>'<div class="weather-metric"><span>'+label+'</span><strong>'+esc(reading)+'</strong></div>';
        host.innerHTML='<section class="weather-now"><div><span class="weather-eyebrow">'+esc(location.source||'Selected location')+'</span><h3>'+esc(location.city)+(location.country?', '+esc(location.country):'')+'</h3><div class="weather-temperature">'+temp(c.temperature_2m)+'</div><p>'+esc(condition(c.weather_code))+' · Feels like '+temp(c.apparent_temperature)+'</p></div><div class="weather-scene weather-scene-'+visual.mood+'" data-preserve-surface aria-hidden="true"><div class="weather-orb"></div><div class="weather-cloud weather-cloud-back"></div><div class="weather-cloud"></div><div class="weather-particles">'+Array.from({length:9},()=>'<b></b>').join('')+'</div><i data-lucide="'+visual.icon+'" class="weather-scene-icon"></i></div><div class="weather-observed"><strong>Forecast model · not a local sensor</strong><span>Valid '+esc(time(c.time,{weekday:'short',hour:'2-digit',minute:'2-digit'}))+'</span><span>'+esc(zone)+'</span><span>'+location.lat.toFixed(2)+'°, '+location.lon.toFixed(2)+'°</span></div></section>'+
            os.weatherChart(cache,hours,temp,time)+'<section class="weather-metrics">'+metric('Humidity',value(c.relative_humidity_2m,'%'))+metric('Wind',value(c.wind_speed_10m,' km/h'))+metric('Precipitation',value(c.precipitation,' mm'))+metric('Pressure',value(c.surface_pressure,' hPa'))+metric('US AQI',value(air?.us_aqi)+' · '+os.weatherAQILabel(air?.us_aqi))+metric('PM2.5',value(air?.pm2_5,' µg/m³'))+metric('Sunrise',time(data.daily?.sunrise?.[0]))+metric('Sunset',time(data.daily?.sunset?.[0]))+'</section>'+
            '<section class="weather-section"><h3>Next '+hours.length+' forecast hours</h3><p>Local time at the selected location · precipitation probability</p><div class="weather-hours" tabindex="0" role="region" aria-label="Hourly forecast, scroll horizontally">'+(hourly||'<p>Hourly forecast unavailable</p>')+'</div></section>'+
            '<section class="weather-section"><h3>Seven-day outlook</h3><div class="weather-days">'+(daily||'<p>Daily forecast unavailable</p>')+'</div></section><footer class="weather-attribution">Weather and air quality: <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a> · model estimates, not a severe-weather alert service. AQI uses the US scale; unavailable readings remain blank. Selected location is saved in this browser; coordinates are sent to Open-Meteo when requesting a forecast.</footer>';
        if(window.lucide)lucide.createIcons({root:host});
        os.weatherChartSelect(0);
        os.weatherStatus((cache.stale?'Refresh failed · showing cached forecast from ':'Fetched ')+new Date(cache.fetched).toLocaleTimeString()+(os._weatherStorageWarning?' · preferences may not persist':''));
    },

    nasaFetchJSON: async (url, timeout=12000) => {
                const r = await fetch(url, { signal: AbortSignal.timeout(timeout), cache:'no-store' });
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            },

    _nasaSetActiveTab: (key) => {
        document.querySelectorAll('#nasa-tabs [data-nasa-tab]').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.nasaTab === key);
        });
    },

    nasaRenderError: (el, title, err, fallbackAction = 'os.nasaLoadAPOD()') => {
        el.innerHTML = `<div class="h-full flex items-center justify-center text-center p-6"><div><div class="text-rose-300 font-semibold text-xs">${os._html(title)} unavailable</div><div class="text-gray-500 mt-1.5 text-[11px]">${os._html(err.message || err)}</div><button type="button" onclick="${fallbackAction}" class="mt-3.5 os-btn mx-auto cursor-none hover-target">Retry</button></div></div>`;
    },

    nasaLoadAPOD: async (dateStr = '') => {
        os._nasaSetActiveTab('apod');
        const el = document.getElementById('nasa-content');
        if (!el) return;
        const request = el._request = (el._request || 0) + 1;
        el.innerHTML = '<div class="text-center text-gray-400 text-xs mt-10">Loading Astronomy Picture of the Day...</div>';
        try {
            let d;
            const dateParam = dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? `&date=${encodeURIComponent(dateStr)}` : '';
            try {
                d = await os.nasaFetchJSON(`https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&thumbs=true${dateParam}`, 10000);
            } catch (primaryErr) {
                const search = await os.nasaFetchJSON('https://images-api.nasa.gov/search?q=nebula%20galaxy%20james%20webb&media_type=image&page_size=16', 10000);
                const items = search.collection?.items || [];
                const item = items[Math.floor(Math.random() * Math.min(12, Math.max(1, items.length)))];
                if (!item?.links?.[0]?.href) throw new Error('APOD and archive imagery are unavailable.');
                d = {
                    archiveFallback: true,
                    title: item?.data?.[0]?.title || 'NASA Deep Space Archive',
                    date: item?.data?.[0]?.date_created?.split('T')[0] || '',
                    explanation: item?.data?.[0]?.description || 'Loaded from the NASA Image and Video Library archive.',
                    url: item?.links?.[0]?.href,
                    hdurl: item?.links?.[0]?.href,
                    media_type: 'image',
                    copyright: 'NASA Image Library'
                };
            }
            if (request !== el._request || !el.isConnected) return;
            os._lastNasaApod = d;
            const dateInput = document.getElementById('nasa-apod-date');
            if (dateInput && d.date) dateInput.value = d.date;
            const media = d.media_type === 'video'
                ? `<iframe src="${os._html(d.url)}" class="w-full h-72 border-0" allowfullscreen></iframe>`
                : `<img src="${os._html(d.hdurl || d.url)}" class="w-full max-h-80 object-cover" alt="${os._html(d.title)}" loading="lazy">`;
            if (request !== el._request || !el.isConnected) return;
            el.innerHTML = `
                ${d.archiveFallback ? '<p class="text-amber-300 text-xs mb-2">APOD unavailable · showing a NASA archive image, not the requested day’s Astronomy Picture of the Day.</p>' : ''}
                <div class="rounded-2xl overflow-hidden border border-white/10 mb-3.5 relative bg-black shadow-lg">${media}</div>
                <div class="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <div class="text-white font-display font-bold text-lg leading-snug mb-0.5">${os._html(d.title)}</div>
                        <div class="text-[11px] text-sky-300 font-mono mb-2">${os._html(d.date)} · ${os._html(d.copyright || 'NASA')}</div>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                        ${d.media_type !== 'video' ? `<button type="button" onclick="SystemState.settings.wallpaper_custom_url = os._lastNasaApod.hdurl || os._lastNasaApod.url; os.setOption('wallpaper_mode','custom'); window.Notifications && Notifications.push('Wallpaper','Applied NASA APOD backdrop');" class="os-btn text-sky-300 cursor-none hover-target">Set Wallpaper</button>` : ''}
                        <button type="button" onclick="window.AetherVFS && AetherVFS.saveClipperItem({ title: os._lastNasaApod.title, content: os._lastNasaApod.explanation, imageUrl: os._lastNasaApod.media_type !== 'video' ? (os._lastNasaApod.hdurl || os._lastNasaApod.url) : '', sourceUrl: os._lastNasaApod.hdurl || os._lastNasaApod.url, tags: ['nasa','apod'] })" class="os-btn text-emerald-300 cursor-none hover-target">Save to Files</button>
                        <button type="button" onclick="os.nasaLoadAPOD()" class="os-btn cursor-none hover-target">Today</button>
                    </div>
                </div>
                <div class="text-xs text-gray-300 leading-relaxed select-text">${os._html(d.explanation || '').slice(0, 1400)}</div>
                <a href="${os._html(d.hdurl || d.url)}" target="_blank" rel="noopener" class="inline-block mt-2 text-xs text-sky-300 hover:underline">Open Full Resolution ↗</a>`;
        } catch (e) { if (request !== el._request || !el.isConnected) return; os.nasaRenderError(el, 'APOD', e); }
    },

    nasaLoadEPIC: async () => {
        os._nasaSetActiveTab('epic');
        const el = document.getElementById('nasa-content'); if (!el) return;
        const request = el._request = (el._request || 0) + 1;
        el.innerHTML = '<div class="text-center text-gray-400 text-xs mt-10">Loading DSCOVR Earth EPIC imagery...</div>';
        try {
            let imgs = [];
            try { imgs = await os.nasaFetchJSON('https://epic.gsfc.nasa.gov/api/natural', 10000); }
            catch (e) { imgs = await os.nasaFetchJSON('https://api.nasa.gov/EPIC/api/natural/images?api_key=DEMO_KEY', 10000); }
            const latest = (imgs || []).slice(0, 9);
            if (!latest.length) throw new Error('No EPIC images returned');
            if (request !== el._request || !el.isConnected) return;
            el.innerHTML = `<div class="text-xs text-gray-300 font-semibold mb-2.5">DSCOVR Earth Polychromatic Camera — <span class="text-sky-300 font-mono">${os._html(latest[0]?.date?.split(' ')[0] || '')}</span></div>
            <div class="grid grid-cols-3 gap-3">${latest.map((img) => {
                const [y, m, d] = img.date.split(' ')[0].split('-');
                const url = `https://epic.gsfc.nasa.gov/archive/natural/${y}/${m}/${d}/png/${img.image}.png`;
                return `<div class="rounded-xl overflow-hidden border border-white/10 bg-white/[0.03] cursor-none hover-target hover:border-white/25 transition" onclick="window.open('${url}','_blank')"><img src="${url}" class="w-full h-28 object-cover bg-black" loading="lazy" alt="${os._html(img.image)}"><div class="text-[11px] text-gray-400 p-2 truncate">${os._html(img.caption || img.image)}</div></div>`;
            }).join('')}</div>`;
        } catch (e) { if (request !== el._request || !el.isConnected) return; os.nasaRenderError(el, 'Earth EPIC', e, 'os.nasaLoadEPIC()'); }
    },

    nasaLoadMars: async () => {
        os._nasaSetActiveTab('mars');
        const el = document.getElementById('nasa-content'); if (!el) return;
        const request = el._request = (el._request || 0) + 1;
        el.innerHTML = '<div class="text-center text-gray-400 text-xs mt-10">Loading Mars Rover surface photography...</div>';
        try {
            let photos = [];
            let subtitle = '';
            try {
                const d = await os.nasaFetchJSON('https://api.nasa.gov/mars-photos/api/v1/rovers/perseverance/latest_photos?api_key=DEMO_KEY&page=1', 10000);
                photos = (d.latest_photos || []).slice(0, 12).map((p) => ({ url: p.img_src, label: p.camera?.name || 'Mastcam-Z', title: p.camera?.full_name || 'Perseverance' }));
                if (photos.length) subtitle = `Perseverance · Sol ${d.latest_photos[0]?.sol || '--'}`;
            } catch (e) {}
            if (!photos.length) {
                const arch = await os.nasaFetchJSON('https://images-api.nasa.gov/search?q=perseverance%20mars%20surface%20rover&media_type=image&page_size=12', 10000);
                photos = (arch.collection?.items || []).slice(0, 12).map((item) => ({
                    url: item.links?.[0]?.href || '',
                    label: (item.data?.[0]?.date_created || '').slice(0, 10) || 'Mars Archive',
                    title: item.data?.[0]?.title || 'Mars Surface'
                })).filter((p) => p.url);
                subtitle = 'Perseverance & Curiosity Archive · NASA Image Library';
            }
            if (!photos.length) throw new Error('No rover photos returned');
            if (request !== el._request || !el.isConnected) return;
            el.innerHTML = `<div class="text-xs text-gray-300 font-semibold mb-2.5">${os._html(subtitle)}</div><div class="grid grid-cols-3 sm:grid-cols-4 gap-2.5">${photos.map((p) => `<div class="rounded-xl overflow-hidden border border-white/10 bg-white/[0.03] cursor-none hover-target hover:border-white/25 transition" onclick="window.open('${os._html(p.url)}','_blank')"><img src="${os._html(p.url)}" class="w-full h-24 object-cover bg-black" loading="lazy" alt="${os._html(p.title)}"><div class="text-[11px] text-gray-400 p-1.5 truncate">${os._html(p.label)}</div></div>`).join('')}</div>`;
        } catch (e) { if (request !== el._request || !el.isConnected) return; os.nasaRenderError(el, 'Mars Rover', e, 'os.nasaLoadMars()'); }
    },

    nasaLoadDONKI: async () => {
        os._nasaSetActiveTab('donki');
        const el = document.getElementById('nasa-content'); if (!el) return;
        const request = el._request = (el._request || 0) + 1;
        el.innerHTML = '<div class="text-center text-gray-400 text-xs mt-10">Loading NOAA &amp; NASA space weather...</div>';
        try {
            const end = new Date().toISOString().split('T')[0];
            const start = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
            let flares = [], cme = [];
            try {
                [flares, cme] = await Promise.all([
                    os.nasaFetchJSON(`https://api.nasa.gov/DONKI/FLR?startDate=${start}&endDate=${end}&api_key=DEMO_KEY`),
                    os.nasaFetchJSON(`https://api.nasa.gov/DONKI/CME?startDate=${start}&endDate=${end}&api_key=DEMO_KEY`)
                ]);
            } catch (e) {
                const kp = await os.nasaFetchJSON('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json');
                flares = kp.slice(-14).map((r) => ({ classType: 'Kp ' + r[1], peakTime: r[0], sourceLocation: 'NOAA SWPC Planetary K-Index' }));
                cme = [];
            }
            const classColor = (cls) => String(cls || '').includes('X') ? 'text-rose-400' : String(cls || '').includes('M') ? 'text-amber-400' : 'text-sky-300';
            if (request !== el._request || !el.isConnected) return;
            el.innerHTML = `
                <div class="grid grid-cols-2 gap-3 mb-3 text-xs">
                    <div class="os-card p-3.5">
                        <div class="text-amber-300 font-semibold text-xs mb-1 flex items-center gap-1.5"><i data-lucide="sun" class="w-3.5 h-3.5"></i> Solar Flare / Kp Readings</div>
                        <div class="text-3xl font-display font-bold text-white tabular-nums">${flares.length}</div>
                    </div>
                    <div class="os-card p-3.5">
                        <div class="text-sky-300 font-semibold text-xs mb-1 flex items-center gap-1.5"><i data-lucide="orbit" class="w-3.5 h-3.5"></i> Coronal Mass Ejections (30d)</div>
                        <div class="text-3xl font-display font-bold text-white tabular-nums">${cme.length}</div>
                    </div>
                </div>
                <div class="text-xs text-gray-300 font-semibold mb-2">Recent Solar Events</div>
                <div class="space-y-1.5 max-h-72 overflow-y-auto">${(flares.slice(-14).reverse()).map((f) => `<div class="flex items-center justify-between px-3 py-2 os-card text-xs"><span class="${classColor(f.classType)} font-mono font-semibold">${os._html(f.classType || '--')}</span><span class="text-gray-400 font-mono">${os._html((f.peakTime || '').split('T')[0] || '--')}</span><span class="text-gray-400 truncate max-w-[200px]">${os._html(f.sourceLocation || 'Solar Disk')}</span></div>`).join('')}</div>`;
            if (window.lucide) lucide.createIcons({ root: el });
        } catch (e) { if (request !== el._request || !el.isConnected) return; os.nasaRenderError(el, 'Solar Weather', e, 'os.nasaLoadDONKI()'); }
    },

    _gameCatalog: [],

    initGames: () => {
        const lib = document.getElementById('games-library');
        if (!lib) return;
        const esc = (v = '') => String(v).replace(/[&<>'"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[m]));
        const games = [
            { id: '2048', name: '2048', icon: '🔢', tag: 'Puzzle', desc: 'Classic sliding tile number puzzle', url: 'https://play2048.co/', color: '#eab308', source: 'play2048.co', note: 'Keyboard arrows' },
            { id: 'hexgl', name: 'HexGL', icon: '🚀', tag: '3D Wipeout', desc: 'Futuristic HTML5/WebGL anti-gravity racer', url: 'https://hexgl.bkcore.com/play/', color: '#38bdf8', source: 'BKcore OSS', note: 'WebGL required' },
            { id: 'slowroads', name: 'Slow Roads', icon: '🏎️', tag: '3D Driving', desc: 'Endless procedural zen driving simulator', url: 'https://slowroads.io/', color: '#22d3ee', source: 'slowroads.io', note: 'WebGL driving' },
            { id: 'tetris', name: 'Tetris', icon: '🟦', tag: 'Arcade', desc: 'Official Tetris browser game', url: 'https://play.tetris.com', color: '#3b82f6', source: 'Tetris.com', note: 'Official web build' },
            { id: 'pacman', name: 'PAC-MAN', icon: '👾', tag: 'Retro', desc: 'Classic arcade maze chase', url: 'https://freepacman.org/', color: '#f59e0b', source: 'Free Pacman', note: 'Arrow keys' },
            { id: 'minesweep', name: 'Minesweeper', icon: '💣', tag: 'Logic', desc: 'Classic grid mine sweeper', url: 'https://minesweeper.online/', color: '#94a3b8', source: 'minesweeper.online', note: 'Mouse click' },
            { id: 'krunker', name: 'Krunker', icon: '🎯', tag: '3D FPS', desc: 'Fast-paced browser arena shooter', url: 'https://krunker.io/', color: '#f97316', source: 'krunker.io', note: 'Pointer lock' },
            { id: 'supertux', name: 'SuperTux', icon: '🐧', tag: 'Platformer', desc: 'Open-source 2D jump-and-run classic', url: 'https://www.retrogames.cc/embed/41696-supertux.html', color: '#60a5fa', source: 'SuperTux GPL', note: 'Retro build' },
            { id: 'solitaire', name: 'Solitaire', icon: '🃏', tag: 'Cards', desc: 'Klondike Solitaire card deck', url: 'https://www.solitaire.org/', color: '#10b981', source: 'solitaire.org', note: 'Drag & drop' }
        ];
        os._gameCatalog = games;
        lib.className = 'flex-1 overflow-y-auto p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 content-start';
        lib.innerHTML = games.map((g) => `
            <div onclick="os.launchGame('${g.id}')" class="group relative rounded-xl overflow-hidden border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] p-3.5 hover:border-white/25 transition-all cursor-none hover-target flex flex-col justify-between min-h-[140px]">
                <div>
                    <div class="flex items-start justify-between gap-2">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-2xl border border-white/10 bg-black/40">${g.icon}</div>
                        <span class="os-badge text-gray-300">${esc(g.tag)}</span>
                    </div>
                    <div class="mt-2.5 text-white font-display font-bold text-sm leading-tight">${esc(g.name)}</div>
                    <div class="text-gray-400 text-[11px] mt-1 leading-snug">${esc(g.desc)}</div>
                </div>
                <div class="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
                    <span class="text-[10.5px] text-gray-500 truncate">${esc(g.note)}</span>
                    <div class="flex gap-1.5">
                        <button type="button" onclick="event.stopPropagation();os.openGameExternal('${g.id}')" class="os-btn px-2 py-0.5 text-[10.5px] cursor-none hover-target">Tab ↗</button>
                        <button type="button" onclick="event.stopPropagation();os.launchGame('${g.id}')" class="os-btn-primary px-2.5 py-0.5 text-[10.5px] cursor-none hover-target">Play</button>
                    </div>
                </div>
            </div>`).join('');
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
                const controller=new AbortController();
                const timer=setTimeout(()=>controller.abort(),Math.max(1000,Math.min(30000,Number(timeout)||9000)));
                try{
                    const res=await fetch(url,{signal:controller.signal,credentials:'omit'});
                    if(!res.ok)throw new Error(res.status===429?'Provider rate limit reached. Wait before retrying.':`Provider returned HTTP ${res.status}`);
                    const text=await res.text();
                    if(text.length>8*1024*1024)throw new Error('Provider response is too large');
                    try{return JSON.parse(text);}catch(_){throw new Error('Provider returned invalid JSON');}
                }catch(error){if(error.name==='AbortError')throw new Error('Provider request timed out. Please retry.');throw error;}
                finally{clearTimeout(timer);}
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
                        +   '<span class="text-white/50 text-[9px] font-mono uppercase tracking-[0.15em]">OBSERVATIONS</span>'
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
                        const status = document.getElementById('iss-position-status');
                        if (status) status.textContent = 'Position observed ' + (Number.isFinite(Number(pos.timestamp)) ? new Date(Number(pos.timestamp)*1000).toLocaleString() : '(provider time unavailable)');
                        var lat = Number(pos.latitude), lon = Number(pos.longitude),
                            alt = Number(pos.altitude), vel = Number(pos.velocity);
                        if (![lat,lon,alt,vel].every(Number.isFinite) || Math.abs(lat)>90 || Math.abs(lon)>180) throw new Error('Invalid position');
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
                        set('t-loc', 'Approx. ' + loc);
                    } catch(e) {
                        const status = document.getElementById('iss-position-status');
                        if (status) status.textContent = 'Position feed unavailable · displayed coordinates, if any, are stale';
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
                    src = 'UNAVAILABLE'; valid = [];
                    d.trajectoryStatus = 'Trajectory unavailable; no synthetic prediction substituted.';
                }
                if (os._iss3d !== d) return;
                d.trajectoryStatus = valid.length ? 'Provider trajectory · ' + new Date(now).toISOString() : 'Trajectory unavailable; no synthetic prediction substituted.';
                const status = document.getElementById('iss-trajectory-status');
                if (status) status.textContent = d.trajectoryStatus;
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
