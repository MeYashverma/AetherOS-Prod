import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const now=1800000000;
const fixture=()=>({timezone:'Asia/Kolkata',current:{time:now,temperature_2m:null,weather_code:999,relative_humidity_2m:0},hourly:{time:[now-3600,now,now+3600],temperature_2m:[99,0,20],precipitation_probability:[100,0,null]},daily:{time:[now],temperature_2m_max:[25],temperature_2m_min:[null],weather_code:[0],precipitation_sum:[null]}});
function setup(){
 const dom=new JSDOM('',{runScripts:'outside-only',url:'https://example.test'}),w=dom.window;w.os={};w.WindowContents={};w.extendOS=x=>Object.assign(w.os,x);
 const template=fs.readFileSync('src/ui/templates/media-space-templates.js','utf8');w.eval('WindowContents.weather = '+template.slice(template.indexOf('    weather: `')+13,template.indexOf('    nasa: `')).trim().replace(/,$/,''));w.document.body.innerHTML=w.WindowContents.weather;w.eval(fs.readFileSync('src/modules/space-and-weather.js','utf8'));return {dom,w,os:w.os};
}
const response=data=>({ok:true,json:async()=>data});
test('no silent IP lookup, default-city fabrication or storage exception on initial open',async()=>{
 const {dom,w,os}=setup();let calls=0;w.fetch=async()=>{calls++;throw Error('unexpected');};Object.defineProperty(w,'localStorage',{get(){throw Error('denied');}});await os.initWeatherStation();assert.equal(calls,0);assert.match(w.document.getElementById('weather-content').textContent,/No.*default city|no default city/);assert.equal(os._weatherManualOverride,undefined);dom.window.close();
});
test('city results require user choice and malicious names remain plain text',async()=>{
 const {dom,w,os}=setup();w.fetch=async()=>response({results:[{latitude:0,longitude:0,name:'<img src=x>',country:'Test'},{latitude:1,longitude:2,name:'Other'}]});await os.searchWeather('test');assert.equal(w.document.querySelectorAll('.weather-location-result').length,2);assert.equal(w.document.querySelector('#weather-locations img'),null);assert.equal(os._weatherManualOverride,undefined);let location;os.initWeatherStation=async()=>location=os._weatherManualOverride;w.document.querySelector('.weather-location-result').click();assert.equal(location.lat,0);assert.equal(location.lon,0);dom.window.close();
});
test('missing readings are not zero, unknown weather not clear, future hourly slots and timezone are labelled',()=>{
 const {dom,w,os}=setup();os.weatherRender({location:{city:'Test',lat:0,lon:0},data:fixture(),air:null,fetched:Date.now()});const host=w.document.getElementById('weather-content');assert.equal(host.querySelector('.weather-temperature').textContent,'—');assert.match(host.textContent,/Condition unavailable/);assert.match(host.textContent,/Asia\/Kolkata/);assert.equal(host.querySelectorAll('.weather-hour').length,2);assert.match(host.querySelector('.weather-hour').textContent,/0°C/);assert.match(host.textContent,/Unavailable/);assert.doesNotMatch(host.textContent,/99°C/);assert.match(host.querySelector('.weather-day').textContent,/—/);dom.window.close();
});
test('AQI thresholds match all six US categories',()=>{
 const {dom,os}=setup();assert.deepEqual([null,0,51,101,151,201,301].map(os.weatherAQILabel),['Unavailable','Good','Moderate','Unhealthy for sensitive groups','Unhealthy','Very unhealthy','Hazardous']);dom.window.close();
});
test('newer forecast wins even when old server ignores abort; coordinates support zero',async()=>{
 const {dom,w,os}=setup();await os.initWeatherStation();let resolve;
 w.fetch=async url=>url.includes('air-quality')?response({current:{us_aqi:25}}):url.includes('latitude=0&')?await new Promise(r=>resolve=r):response({...fixture(),current:{...fixture().current,temperature_2m:22}});
 const first=os.weatherChooseLocation({lat:0,lon:0,city:'First'});await os.weatherChooseLocation({lat:1,lon:1,city:'Second'});resolve(response(fixture()));await first;assert.equal(os._weatherCache.location.city,'Second');assert.match(w.document.querySelector('.weather-now').textContent,/Second/);dom.window.close();
});
test('cached data is labelled stale on refresh failure and never reused for another location',async()=>{
 const {dom,w,os}=setup();await os.initWeatherStation();w.fetch=async url=>response(url.includes('air-quality')?{}:fixture());await os.weatherChooseLocation({lat:0,lon:0,city:'A'});w.fetch=async()=>{throw Error('offline');};await os.initWeatherStation(true);assert.match(w.document.getElementById('weather-status').textContent,/Refresh failed.*cached/);await os.weatherChooseLocation({lat:5,lon:5,city:'B'});assert.match(w.document.getElementById('weather-content').textContent,/Forecast unavailable/);assert.doesNotMatch(w.document.getElementById('weather-content').textContent,/Selected location/);dom.window.close();
});
test('denied geolocation leaves usable city search and no forecast requests',()=>{
 const {dom,w,os}=setup();Object.defineProperty(w.navigator,'geolocation',{value:{getCurrentPosition(success,error){error({code:1});}}});os.resetWeatherLocation();assert.match(w.document.getElementById('weather-status').textContent,/denied.*search/);dom.window.close();
});
test('closing invalidates pending city lookup',async()=>{
 const {dom,w,os}=setup();let resolve,signal;w.fetch=async(url,options)=>{signal=options.signal;return await new Promise(r=>resolve=r);};const pending=os.searchWeather('slow');os.weatherDispose();assert.equal(signal.aborted,true);resolve(response({results:[{name:'late',latitude:1,longitude:1}]}));await pending;assert.equal(w.document.querySelectorAll('.weather-location-result').length,0);dom.window.close();
});
test('Fahrenheit conversion preserves missing readings and cannot resurrect another location while loading',()=>{
 const {dom,w,os}=setup();os._weatherManualOverride={lat:0,lon:0};os._weatherCache={key:'0,0',location:{lat:0,lon:0,city:'A'},data:fixture(),air:null,fetched:Date.now()};os._weatherCache.data.current.temperature_2m=0;os.toggleWeatherUnit();assert.equal(w.document.querySelector('.weather-temperature').textContent,'32°F');assert.match(w.document.querySelector('.weather-now p').textContent,/Feels like —/);
 os._weatherManualOverride={lat:1,lon:1};w.document.getElementById('weather-content').textContent='Loading B';os.toggleWeatherUnit();assert.equal(w.document.getElementById('weather-content').textContent,'Loading B');dom.window.close();
});
test('condition scene follows WMO codes and provider day/night, unknown is not sunny',()=>{
 const {dom,os}=setup();assert.equal(os.weatherVisual(0,false).mood,'night');assert.equal(os.weatherVisual(0,true).mood,'sunny');assert.equal(os.weatherVisual(63).mood,'rain');assert.equal(os.weatherVisual(95).mood,'storm');assert.equal(os.weatherVisual(75).mood,'snow');assert.equal(os.weatherVisual(null).mood,'unknown');dom.window.close();
});
test('chart uses forecast points, keeps missing-temperature gaps and plots rain on its own probability scale',()=>{
 const {dom,w,os}=setup(),data=fixture();data.hourly={time:[now,now+3600,now+7200],temperature_2m:[0,null,20],precipitation_probability:[0,null,100]};const cache={location:{lat:0,lon:0,city:'Chart'},data,air:null,fetched:Date.now()};os._weatherCache=cache;os.weatherRender(cache);
 const path=w.document.querySelector('.weather-temp-line');assert.equal((path.getAttribute('d').match(/M/g)||[]).length,2);assert.equal(w.document.querySelectorAll('.weather-chart-point').length,2);const bars=w.document.querySelectorAll('.weather-rain-bar');assert.equal(bars.length,2);assert.equal(bars[0].getAttribute('height'),'0');assert.equal(bars[1].getAttribute('height'),'30');assert.equal(w.document.querySelector('.weather-chart').getAttribute('role'),'img');dom.window.close();
});
test('keyboard-operable chart inspector exposes exact readings and missing-data descriptions',()=>{
 const {dom,w,os}=setup(),cache={location:{lat:0,lon:0,city:'Chart'},data:fixture(),air:null,fetched:Date.now()};os._weatherCache=cache;os.weatherRender(cache);os.weatherChartSelect(1);assert.match(w.document.getElementById('weather-hour-detail').textContent,/20°C/);assert.match(w.document.getElementById('weather-hour-slider').getAttribute('aria-valuetext'),/rain chance unavailable/);assert.equal(w.document.querySelectorAll('.weather-hour-selected').length,1);os._weatherUnit='F';os.weatherRender(cache);os.weatherChartSelect(1);assert.match(w.document.getElementById('weather-hour-detail').textContent,/68°F/);dom.window.close();
});
test('daily visual range is absent rather than fabricated when high or low is missing',()=>{
 const {dom,w,os}=setup();os.weatherRender({location:{lat:0,lon:0,city:'Chart'},data:fixture(),air:null,fetched:Date.now()});assert.equal(w.document.querySelectorAll('.weather-day-range b').length,0);dom.window.close();
});
