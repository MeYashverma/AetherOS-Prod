import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
function setup(app='worldmuseums'){
 const dom=new JSDOM('',{runScripts:'outside-only',url:'https://aether.test'}),w=dom.window;
 w.os={};w.SystemState={settings:{}};w.extendOS=x=>Object.assign(w.os,x);w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;
 w.eval(fs.readFileSync('src/modules/live-world-and-science-apis.js','utf8'));w.document.body.innerHTML=w.WindowContents[app];
 return {w,os:w.os,close:()=>{w.os.killWorldMuseums();w.os.killSpaceXHub();dom.window.close();}};
}
const json=data=>({ok:true,text:async()=>JSON.stringify(data)});
const artwork=(id=1)=>({id,title:'Artwork '+id,image_id:'abcd1234-1234-1234',artist_display:'Artist',date_display:'1900',is_public_domain:true});
const launch=(id='mission')=>({id,name:'Rocket | Mission',net:'2030-01-02T03:04:05Z',status:{name:'Go'},launch_service_provider:{name:'Agency'},pad:{name:'Pad',latitude:0,longitude:0},mission:{description:'Real provider description'},image:'https://images.example.test/mission.jpg',vidURLs:[{url:'javascript:alert(1)'}]});
test('museum separates empty live results from explicitly labelled included art on provider failure',async()=>{
 const {w,os,close}=setup();w.fetch=async()=>json({data:[]});await os.wmSearch('none');assert.equal(os.wmState.items.length,0);assert.match(w.document.getElementById('wm-status').textContent,/No image-bearing/);w.fetch=async()=>{throw Error('offline');};await os.wmSearch('test');assert.equal(os.wmState.items.length,3);assert.equal(os.wmState.includedView,true);assert.match(w.document.getElementById('wm-status').textContent,/NOT search results/);w.fetch=async()=>json({hello:1});await os.wmSearch('test');assert.match(w.document.getElementById('wm-status').textContent,/Invalid/);close();
});
test('museum images use a pinned IIIF origin, reject invalid IDs and keep provider text inert',async()=>{
 const {w,os,close}=setup();w.fetch=async()=>json({data:[{...artwork(),title:'<img src=x onerror=alert(1)>',artist_display:'<script>x</script>'},{...artwork(2),image_id:'https://evil.test/x'}],config:{iiif_url:'https://evil.test'}});await os.wmSearch('a & b');assert.equal(os.wmState.items.length,1);assert.equal(w.document.querySelector('#wm-inspector script'),null);assert.match(w.document.querySelector('.museum-art-stage img').src,/^https:\/\/www.artic.edu\/iiif\/2\//);assert.match(w.document.querySelector('.museum-caption h2').textContent,/<img/);close();
});
test('museum pagination is bounded and older responses cannot overwrite newer searches',async()=>{
 const {w,os,close}=setup();let resolve;w.fetch=async url=>String(url).includes('slow')?await new Promise(r=>resolve=r):json({data:[artwork(2)],pagination:{current_page:1,total_pages:2}});const slow=os.wmSearch('slow');await os.wmSearch('fast');resolve(json({data:[artwork(1)]}));await slow;assert.equal(os.wmState.items[0].id,2);assert.equal(w.document.getElementById('wm-next').disabled,false);os.wmPage(1);assert.equal(os.wmState.page,2);os.killWorldMuseums();close();
});
test('museum collection persists references, has a real saved view, and exports links rather than images',async()=>{
 const {w,os,close}=setup();w.fetch=async()=>json({data:[artwork()]});await os.wmSearch('art');os.wmToggleSaved();assert.equal(JSON.parse(w.localStorage.getItem('aether-museum-collection-v1')).length,1);let exported;os.discoveryDownload=(content,name)=>exported={data:JSON.parse(content),name};os.wmExportCollection();assert.equal(exported.name,'museum-collection.json');assert.match(exported.data.items[0].museumURL,/artic.edu\/artworks\/1/);os.wmShowSaved();assert.equal(os.wmState.savedView,true);os.wmToggleSaved();assert.equal(os.wmState.items.length,0);close();
});
test('museum storage failure is reported; Files saving awaits persistence and stores a text reference',async()=>{
 const {w,os,close}=setup();w.fetch=async()=>json({data:[artwork()]});await os.wmSearch('art');w.Storage.prototype.setItem=()=>{throw Error('quota');};os.wmToggleSaved();assert.match(w.document.getElementById('wm-status').textContent,/session-only/);let resolve,entry;w.AetherVFS={putFile:value=>{entry=value;return new Promise(r=>resolve=r);}};const pending=os.wmSaveToVFS();assert.equal(entry.mime,'text/plain');assert.equal(entry.dataUrl,undefined);resolve({persistence:'session-only'});await pending;assert.match(w.document.getElementById('wm-status').textContent,/Session-only reference/);close();
});
test('museum zoom affects just the preserved artwork and close discards late results',async()=>{
 const {w,os,close}=setup();w.fetch=async()=>json({data:[artwork()]});await os.wmSearch('art');os.wmZoom('200');assert.equal(w.document.querySelector('.museum-art-stage img').style.width,'200%');os.wmZoom('bad');assert.equal(os.wmState.zoom,200);let resolve;w.fetch=async()=>await new Promise(r=>resolve=r);const pending=os.wmSearch('pending');os.killWorldMuseums();resolve(json({data:[artwork(5)]}));await pending;assert.equal(os.wmState.items.length,0);close();
});
test('launch failures do not synthesize launches, astronaut manifests or countdowns',async()=>{
 const {w,os,close}=setup('spacexhub');w.fetch=async()=>{throw Error('offline');};await os.sxhFetchLaunches();await os.sxhFetchAstronauts();assert.equal(os.sxhState.launches.length,0);assert.equal(os.sxhState.astronauts.length,0);assert.doesNotMatch(w.document.body.textContent,/Falcon 9|Expedition Crew|LIFTOFF/);assert.match(w.document.getElementById('sxh-launch-list').textContent,/unavailable/);close();
});
test('launch data preserves zero coordinates, rejects unsafe links and never defaults to a launch pad',async()=>{
 const {w,os,close}=setup('spacexhub');w.fetch=async()=>json({results:[launch(),{...launch('two'),pad:{}}]});await os.sxhFetchLaunches();assert.equal(os.sxhState.launches[0].lat,0);assert.equal(os.sxhState.launches[0].webcast,'');assert.equal(os.sxhState.launches[1].lat,null);let args;os.geoJump=(...a)=>args=a;os.sxhOpenPad();assert.equal(args[0],0);assert.equal(args[1],0);os.sxhSelect(1);os.sxhOpenPad();assert.equal(args[0],0);assert.equal(w.document.querySelector('a[href^="javascript:"]'),null);close();
});
test('past or missing NET does not claim liftoff; UTC display and calendar use the actual timestamp',async()=>{
 const {w,os,close}=setup('spacexhub');w.fetch=async()=>json({results:[launch()]});await os.sxhFetchLaunches();os.sxhState.utc=true;assert.match(os.sxhDate(launch().net),/UTC$/);let output;os.discoveryDownload=(content,name,mime)=>output={content,name,mime};os.sxhExportCalendar();assert.match(output.content,/DTSTART:20300102T030405Z\r\n/);assert.equal(output.name,'launch-reminder.ics');assert.match(output.content,/NET estimate/);os.sxhState.launches[0].net='2000-01-01T00:00:00Z';os.sxhTickCountdown();assert.match(w.document.getElementById('sxh-countdown').textContent,/Scheduled time passed/);os.sxhState.launches[0].net=null;os.sxhTickCountdown();assert.match(w.document.getElementById('sxh-countdown').textContent,/not supplied/);close();
});
test('failed refresh retains real records with an explicit stale warning',async()=>{
 const {w,os,close}=setup('spacexhub');w.fetch=async()=>json({results:[launch()]});await os.sxhFetchLaunches();w.fetch=async()=>({ok:false,status:429});await os.sxhFetchLaunches();assert.equal(os.sxhState.launches.length,1);assert.match(w.document.querySelector('.launch-stale').textContent,/STALE/);assert.match(w.document.getElementById('sxh-status').textContent,/rate limit.*stale/);close();
});
test('older launch requests and results after close cannot replace the active schedule',async()=>{
 const {w,os,close}=setup('spacexhub');let resolve;w.fetch=async()=>await new Promise(r=>resolve=r);const pending=os.sxhFetchLaunches();w.fetch=async()=>json({results:[launch('new')]});await os.sxhFetchLaunches();resolve(json({results:[launch('old')]}));await pending;assert.equal(os.sxhState.launches[0].id,'new');w.fetch=async()=>await new Promise(r=>resolve=r);const next=os.sxhFetchLaunches();os.killSpaceXHub();resolve(json({results:[launch('late')]}));await next;assert.equal(os.sxhState.launches[0].id,'new');close();
});
test('crew empty response is honest and provider text is not injected as HTML',async()=>{
 const {w,os,close}=setup('spacexhub');w.fetch=async()=>json({results:[]});await os.sxhFetchAstronauts();assert.match(w.document.getElementById('sxh-pane-astronauts').textContent,/does not mean nobody/);w.fetch=async()=>json({results:[{name:'<img src=x>',bio:'<script>bad</script>',profile_image:'javascript:alert(1)'}]});await os.sxhFetchAstronauts();assert.equal(w.document.querySelector('#sxh-pane-astronauts script'),null);assert.equal(os.sxhState.astronauts[0].photo,'');close();
});
test('oversized streamed provider JSON is cancelled rather than silently truncated',async()=>{
 const {w,os,close}=setup();let cancelled=false;w.fetch=async()=>({ok:true,body:{getReader:()=>({read:async()=>({done:false,value:new Uint8Array(3*1024*1024+1)}),cancel:async()=>{cancelled=true;},releaseLock(){}})}});await os.wmSearch('large');assert.equal(cancelled,true);assert.equal(os.wmState.items.length,3);assert.equal(os.wmState.includedView,true);assert.match(w.document.getElementById('wm-status').textContent,/3 MiB/);close();
});
test('calendar escapes event text and folds long Unicode lines within RFC octet limits',async()=>{
 const {w,os,close}=setup('spacexhub');w.fetch=async()=>json({results:[{...launch(),name:'Mission,;\r\n'+ '宇'.repeat(100)}]});await os.sxhFetchLaunches();let text;os.discoveryDownload=content=>text=content;os.sxhExportCalendar();assert.match(text,/Mission\\,\\;\\n/);for(const line of text.split('\r\n'))assert.ok(new TextEncoder().encode(line).byteLength<=75);close();
});
test('museum uses documented image sizing and retries the same artwork before an honest preview fallback',async()=>{
 const {w,os,close}=setup();const lqip='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';w.fetch=async()=>json({data:[{...artwork(),thumbnail:{lqip}}]});await os.wmSearch('art');const img=w.document.querySelector('.museum-art-stage img');assert.match(img.src,/\/full\/843,\/0\/default.jpg$/);img.dispatchEvent(new w.Event('error'));assert.match(img.src,/\/full\/!843,843\/0\/default.jpg$/);img.dispatchEvent(new w.Event('error'));assert.equal(img.src,lqip);assert.equal(img.hidden,false);assert.match(w.document.querySelector('.museum-art-stage .museum-image-note').textContent,/Low-resolution/);assert.match(w.document.getElementById('wm-status').textContent,/could not load/);close();
});
test('failed museum images without a provider preview get visible retry advice, never unrelated art',async()=>{
 const {w,os,close}=setup();w.fetch=async()=>json({data:[{...artwork(),thumbnail:{lqip:'data:image/svg+xml;base64,AAAA'}}]});await os.wmSearch('art');assert.equal(os.wmState.items[0].thumbnail.lqip,'');const img=w.document.querySelector('.museum-art-stage img');img.dispatchEvent(new w.Event('error'));img.dispatchEvent(new w.Event('error'));assert.equal(img.hidden,true);assert.match(w.document.querySelector('.museum-art-stage .museum-image-note').textContent,/retry or open/);os.wmRetryImages();assert.equal(w.document.querySelector('.museum-art-stage img').hidden,false);assert.match(w.document.querySelector('.museum-art-stage img').src,/843,/);close();
});
test('museum opens with real local art without network access and can return from saved view offline',()=>{
 const {w,os,close}=setup();let calls=0;w.fetch=async()=>{calls++;throw Error('network disabled');};os.initWorldMuseums();assert.equal(calls,0);assert.equal(os.wmState.items.length,3);assert.equal(os.wmState.includedView,true);for(const img of w.document.querySelectorAll('#wm-grid img')){const path=img.getAttribute('src');assert.match(path,/^assets\/museum\/[a-z-]+\.webp$/);const bytes=fs.readFileSync(path);assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.equal(bytes.subarray(8,12).toString(),'WEBP');}
 os.wmToggleSaved();os.wmShowSaved();assert.equal(os.wmState.savedView,true);os.wmShowSaved();assert.equal(os.wmState.includedView,true);assert.equal(calls,0);assert.match(w.document.getElementById('wm-status').textContent,/Included collection/);close();
});
