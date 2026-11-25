import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
const source = fs.readFileSync(new URL('../../src/ui/web-wallpapers.js', import.meta.url), 'utf8');
const page = (id = 'Mountain') => ({ title: `File:${id}.jpg`, imageinfo: [{ mime: 'image/jpeg', width: 6000, height: 4000,
  thumburl: `https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/${id}.jpg/3840px-${id}.jpg`,
  descriptionurl: `https://commons.wikimedia.org/wiki/File:${id}.jpg`, extmetadata: { Artist: { value: '<a href="https://example.test">Example photographer</a>' }, LicenseShortName: { value: 'CC0' } } }] });
function setup(fetcher) {
  const dom = new JSDOM('<div id="lg-wallpaper" style="background:red"></div><p id="wallpaper-online-status"></p>', { url: 'https://aether.test', runScripts: 'outside-only' });
  const w = dom.window; let calls = [];
  w.fetch = async (...args) => { calls.push(args); return fetcher ? fetcher(...args) : { ok: true, json: async () => ({ query: { pages: { 1: page() } } }) }; };
  w.Image = class { naturalWidth = 3840; naturalHeight = 2560; set src(url) { this.url = url; queueMicrotask(() => this.onload?.()); } };
  w.eval(source);
  const settings = { wallpaper_mode: 'online', wallpaper_online_provider: 'commons', wallpaper_online_topic: 'landscape', wallpaper_rotation: 'daily' };
  w.SystemState = { settings, save() {} };
  return { w, settings, api: w.AetherWebWallpapers, calls, close: () => dom.window.close() };
}
test('only high-resolution, landscape, public-domain/CC0 Commons files are accepted', () => {
  const { api, close } = setup();
  assert.equal(api.normalize(page()).artist, 'Example photographer');
  for (const mutate of [p => p.imageinfo[0].width = 1200, p => p.imageinfo[0].mime = 'image/svg+xml',
    p => p.imageinfo[0].thumburl = 'https://evil.test/image.jpg', p => p.imageinfo[0].descriptionurl = 'javascript:alert(1)',
    p => p.imageinfo[0].extmetadata.LicenseShortName.value = 'All rights reserved', p => p.imageinfo[0].height = 8000]) {
    const p = page(); mutate(p); assert.equal(api.normalize(p), null);
  }
  close();
});
test('online mode uses keyless CORS API, validates a loaded 4K image, and displays safe source credits', async () => {
  const { w, settings, api, calls, close } = setup();
  await api.sync(settings);
  assert.equal(calls.length, 1); assert.match(calls[0][0], /origin=\*/); assert.equal(calls[0][1].credentials, 'omit');
  assert.match(w.document.querySelector('#lg-wallpaper').style.backgroundImage, /upload.wikimedia.org/);
  assert.equal(w.document.querySelector('#wallpaper-photo-credit').hostname, 'commons.wikimedia.org');
  assert.match(w.document.querySelector('#wallpaper-photo-credit').textContent, /Example photographer/);
  await api.sync(settings); assert.equal(calls.length, 1, 'same bucket does not refetch');
  settings.wallpaper_rotation = 'off'; await api.sync(settings); assert.equal(calls.length, 1, 'pause retains current photo');
  settings.wallpaper_mode = 'gallery'; await api.sync(settings);
  assert.equal(w.document.querySelector('#wallpaper-photo-credit'), null);
  close();
});
test('failures retain fallback and back off rather than hammering the provider', async () => {
  const { api, settings, w, calls, close } = setup(async () => ({ ok: false, status: 429 }));
  await api.sync(settings); await api.sync(settings);
  assert.equal(calls.length, 1); assert.equal(w.document.querySelector('#lg-wallpaper').style.background, 'red');
  assert.match(w.document.querySelector('#wallpaper-online-status').textContent, /429.*fallback.*10 minutes/);
  close();
});
test('an in-flight photo cannot overwrite a manually chosen wallpaper after mode switch', async () => {
  let resolve;
  const { api, settings, w, close } = setup(() => new Promise(r => resolve = r));
  const pending = api.sync(settings);
  settings.wallpaper_mode = 'custom'; await api.sync(settings);
  w.document.querySelector('#lg-wallpaper').style.background = 'blue';
  resolve({ ok: true, json: async () => ({ query: { pages: { 1: page() } } }) });
  await pending; assert.equal(w.document.querySelector('#lg-wallpaper').style.background, 'blue'); close();
});
test('malicious cached metadata is revalidated rather than rendered', async () => {
  const { api, settings, w, calls, close } = setup(); const malicious = page(); malicious.imageinfo[0].thumburl = 'https://evil.test/x';
  w.localStorage.setItem('aether.web-wallpaper.v2', JSON.stringify({ key: api.bucket(settings), page: malicious }));
  await api.sync(settings); assert.equal(calls.length, 1);
  assert.doesNotMatch(w.document.querySelector('#lg-wallpaper').style.backgroundImage, /evil.test/); close();
});

test('online provider makes no requests without choosing online mode', async () => {
  const { api, settings, calls, close } = setup(); settings.wallpaper_mode = 'gallery';
  await api.sync(settings); assert.equal(calls.length, 0); close();
});
test('a below-4K downloaded rendition is rejected even if metadata claims a larger original', async () => {
  const { api, settings, w, close } = setup();
  settings.wallpaper_online_quality = '4k';
  w.Image = class { naturalWidth = 1920; naturalHeight = 1080; set src(_) { queueMicrotask(() => this.onload?.()); } };
  await api.sync(settings);
  assert.equal(w.document.querySelector('#lg-wallpaper').style.background, 'red');
  assert.match(w.document.querySelector('#wallpaper-online-status').textContent, /below the selected resolution.*fallback/);
  close();
});

const wallhaven = { id: 'abc123', ext: 'jpg', width: 3840, height: 2160, purity: 'sfw', source: 'https://wallhaven.cc/w/abc123' };
test('gaming/anime wallpaper mode uses only same-origin API and image URLs', async () => {
  const { api, settings, calls, w, close } = setup(async () => ({ ok: true, json: async () => ({ data: [wallhaven] }) }));
  settings.wallpaper_online_provider = 'wallhaven'; settings.wallpaper_online_topic = 'anime';
  await api.sync(settings);
  assert.match(calls[0][0], /^\/api\/wallpapers\?/); assert.match(calls[0][0], /topic=anime/);
  assert.match(w.document.querySelector('#lg-wallpaper').style.backgroundImage, /\/api\/wallpaper-image/);
  assert.match(w.document.querySelector('#wallpaper-photo-credit').textContent, /3840×2160/);
  for (const unsafe of [{ ...wallhaven, purity: 'nsfw' }, { ...wallhaven, id: '../bad' }, { ...wallhaven, width: undefined }, { ...wallhaven, source: 'https://evil.test/w/abc123' }]) {
    assert.equal(api.normalizeWallhaven(unsafe, settings), null);
  }
  close();
});
test('static hosting gives actionable API server instructions rather than silently failing', async () => {
  const { api, settings, w, close } = setup(async () => ({ ok: false, status: 404 }));
  settings.wallpaper_online_provider = 'wallhaven';
  await api.sync(settings);
  assert.match(w.document.querySelector('#wallpaper-online-status').textContent, /scripts\/serve.py/);
  close();
});
test('changing provider/topic bypasses a failed-query backoff; status survives settings rerender', async () => {
  const { api, settings, calls, w, close } = setup(async () => ({ ok: false, status: 429 }));
  await api.sync(settings); assert.equal(calls.length, 1);
  settings.wallpaper_online_topic = 'space'; await api.sync(settings); assert.equal(calls.length, 2);
  w.document.querySelector('#wallpaper-online-status').textContent = '';
  api.refreshStatus(); assert.match(w.document.querySelector('#wallpaper-online-status').textContent, /429/);
  close();
});

test('default online collection works on static hosting without same-origin API endpoints', async () => {
  const catalog = JSON.parse(fs.readFileSync(new URL('../../assets/wallpapers/online-catalog.json', import.meta.url)));
  let blobRequests=0;
  const {api,settings,w,calls,close}=setup(async url=>{
    if(url==='assets/wallpapers/online-catalog.json')return {ok:true,json:async()=>catalog};
    assert.match(url,/^https:\/\/api.github.com\/repos\/dharmx\/walls\/git\/blobs\/[a-f0-9]{40}$/);
    blobRequests++;const sha=url.split('/').at(-1);
    return {ok:true,json:async()=>({sha,encoding:'base64',size:4,content:'/9j/AA=='})};
  });
  w.URL.createObjectURL=()=> 'blob:https://aether.test/loaded-wallpaper';w.URL.revokeObjectURL=()=>{};
  settings.wallpaper_online_provider='github';settings.wallpaper_online_topic='abstract';
  await api.sync(settings);
  assert.match(w.document.querySelector('#lg-wallpaper').style.backgroundImage,/blob:https:\/\/aether.test\/loaded-wallpaper/);
  assert.match(w.document.querySelector('#wallpaper-photo-credit').textContent,/GitHub collection/);
  await api.sync(settings);assert.equal(blobRequests,1);
  assert.equal(calls.some(([url])=>url.startsWith('/api/')),false);
  close();
});

test('strict 4K does not silently downgrade an HD-only category', async () => {
  const catalog=JSON.parse(fs.readFileSync(new URL('../../assets/wallpapers/online-catalog.json',import.meta.url)));
  const {api,settings,w,calls,close}=setup(async()=>({ok:true,json:async()=>catalog}));
  settings.wallpaper_online_provider='github';settings.wallpaper_online_topic='anime';settings.wallpaper_online_quality='4k';
  await api.sync(settings);
  assert.equal(calls.length,1);assert.equal(w.document.querySelector('#lg-wallpaper').style.background,'red');
  assert.match(w.document.querySelector('#wallpaper-online-status').textContent,/Allow HD/);close();
});

test('repeated shell refreshes retain loading status while the next wallpaper is in flight', async () => {
  let resolveFetch;
  let wait=false;
  const {api,settings,w,close}=setup(async()=>{
    if(wait)return new Promise(resolve=>{resolveFetch=resolve;});
    return {ok:true,json:async()=>({query:{pages:{1:page()}}})};
  });
  await api.sync(settings);
  wait=true; settings.wallpaper_online_next=1;
  const pending=api.sync(settings);
  await new Promise(r=>setTimeout(r,0));
  await api.sync(settings);
  assert.match(w.document.querySelector('#wallpaper-online-status').textContent,/Finding a public-domain/);
  resolveFetch({ok:true,json:async()=>({query:{pages:{1:page('Next')}}})});
  await pending;assert.match(w.document.querySelector('#wallpaper-online-status').textContent,/Next/);close();
});

const multiPhoto=(id='one')=>({providerId:'pexels',provider:'Pexels',image:`https://images.pexels.com/photos/${id}/photo.jpg`,source:`https://www.pexels.com/photo/${id}/`,width:3840,height:2160,artist:'Artist',title:id,license:'See source'});
test('provider normalizer rejects foreign image hosts, unsafe sources and untracked Unsplash selections',()=>{
  const {api,settings,close}=setup();
  assert.equal(api.normalizeProvider(multiPhoto(),settings).provider,'Pexels');
  for(const change of [{image:'https://evil.test/image.jpg'},{source:'javascript:alert(1)'},{width:undefined},{providerId:'unknown'},{providerId:'unsplash',image:'https://images.unsplash.com/image',source:'https://unsplash.com/photos/one'}]){
    assert.equal(api.normalizeProvider({...multiPhoto(),...change},settings),null);
  }
  close();
});
test('Next rotates a cached multi-provider batch without repeating searches',async()=>{
  const {api,settings,w,calls,close}=setup(async()=>({ok:true,json:async()=>({data:[multiPhoto('one'),multiPhoto('two')]})}));
  settings.wallpaper_online_provider='pexels';
  await api.sync(settings);const first=w.document.querySelector('#lg-wallpaper').style.backgroundImage;
  settings.wallpaper_online_next=1;await api.sync(settings);
  assert.notEqual(w.document.querySelector('#lg-wallpaper').style.backgroundImage,first);
  assert.equal(calls.length,1);
  settings.wallpaper_online_search='city';await api.sync(settings);assert.equal(calls.length,2);close();
});
test('static NexWall demo works without a key and screen-fit accepts portrait imagery',async()=>{
  const {api,settings,w,calls,close}=setup(async url=>url.startsWith('/api/')?{ok:false,status:404}:{ok:true,json:async()=>({data:[{id:1,type:'image',width:1440,height:2560,image_url:'https://img.kodnextech.com/wallpapers/demo.jpg',tags:'Anime',license:'Developer license'}]})});
  settings.wallpaper_online_provider='nexwall';settings.wallpaper_online_quality='screen';
  w.Image=class {naturalWidth=1440;naturalHeight=2560;set src(_){queueMicrotask(()=>this.onload?.());}};
  await api.sync(settings);
  assert.match(w.document.querySelector('#wallpaper-photo-credit').textContent,/NexWall/);
  assert.equal(calls.some(([url])=>url.includes('/demo/wallpapers?')),true);close();
});
test('Unsplash selection is recorded server-side before applying the hotlinked image',async()=>{
  const token='a'.repeat(64);
  const photo={...multiPhoto(),providerId:'unsplash',image:'https://images.unsplash.com/photo?ixid=keep',source:'https://unsplash.com/photos/one',selectionToken:token};
  const {api,settings,w,calls,close}=setup(async(url,options)=>({ok:true,json:async()=>({data:[photo]})}));
  settings.wallpaper_online_provider='unsplash';await api.sync(settings);
  const selection=calls.find(([url])=>url==='/api/wallpapers/select');
  assert.equal(selection[1].method,'POST');assert.equal(JSON.parse(selection[1].body).token,token);
  assert.match(w.document.querySelector('#lg-wallpaper').style.backgroundImage,/images.unsplash.com/);close();
});
