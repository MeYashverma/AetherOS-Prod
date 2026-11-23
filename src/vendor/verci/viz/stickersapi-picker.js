import { listMedia, mediaURL } from '../providers/stickersapi.js';

const CATEGORIES = {
  stickers: 'Stickers', emotes: 'Emotes', telegram: 'Telegram sets',
  pfps: 'Profile pictures', banners: 'Banners'
};
const DEFAULTS = { stickers: 'happy', emotes: 'happy', telegram: 'UtyaDuck', pfps: 'music', banners: 'music' };
let activePicker;
const button = (label, className, action) => {
  const el = document.createElement('button'); el.type = 'button'; el.className = className;
  el.textContent = label; if (action) el.addEventListener('click', action); return el;
};

// A single picker for lyric reactions AND the desktop's Finder. Third-party
// strings enter only textContent; image/download URLs are rebuilt from safe IDs.
export function openMediaPicker({
  types = Object.keys(CATEGORIES), initialType = 'stickers', onSelect,
  onAvatar, onBanner, fetchImpl = fetch
} = {}) {
  activePicker?.close();
  const categories = [...new Set(types)].filter(type => Object.hasOwn(CATEGORIES,type));
  if (!categories.length) throw Error('No media categories available.');
  let type = categories.includes(initialType) ? initialType : categories[0];
  let page = 1, nextPage = null, requestId = 0;
  let controller;
  const focusReturn = document.activeElement;
  const overlay = document.createElement('div'); overlay.className = 'aether-media-overlay';
  const dialog = document.createElement('section'); dialog.className = 'aether-media-picker';
  dialog.tabIndex = -1; dialog.setAttribute('role','dialog'); dialog.setAttribute('aria-modal','true');
  dialog.setAttribute('aria-label','Stickers and profile media library');
  overlay.append(dialog); (document.fullscreenElement || document.body).append(overlay);
  const head = document.createElement('header');
  const title = document.createElement('h2'); title.textContent = 'Stickers & profiles';
  const closeButton = button('×','aether-media-close',()=>close()); closeButton.setAttribute('aria-label','Close media library');
  head.append(title,closeButton);
  const intro = document.createElement('p'); intro.className='aether-media-intro';
  intro.textContent='Browse public StickersAPI media · no key needed. Searches and images load from stickerapi.sbs; lyrics and private replies are never sent.';
  const tabs = document.createElement('div'); tabs.className='aether-media-tabs'; tabs.setAttribute('role','tablist');
  const form = document.createElement('form'); form.className='aether-media-search';
  const input = document.createElement('input'); input.type='search'; input.maxLength=100;
  input.setAttribute('aria-label','Search media or enter a Telegram set');
  const source = document.createElement('select'); source.setAttribute('aria-label','Emote source');
  for (const [id,label] of [['all','All emotes'],['7tv','7TV'],['bttv','BetterTTV'],['ffz','FrankerFaceZ']]) {
    const opt=document.createElement('option');opt.value=id;opt.textContent=label;source.append(opt);
  }
  const searchButton = button('Search','aether-media-search-button'); searchButton.type='submit';
  form.append(input,source,searchButton);
  const status = document.createElement('p'); status.className='aether-media-status';
  status.setAttribute('role','status'); status.setAttribute('aria-live','polite');
  const grid = document.createElement('div'); grid.className='aether-media-grid';
  grid.setAttribute('aria-label','Media results');
  const pages = document.createElement('div'); pages.className='aether-media-pages'; pages.hidden=true;
  const previous = button('← Previous','',()=>{page=Math.max(1,page-1);load();});
  const next = button('Next →','',()=>{if(nextPage){page=nextPage;load();}});
  pages.append(previous,next);
  const details = document.createElement('div');details.className='aether-media-details';details.hidden=true;
  dialog.append(head,intro,tabs,form,status,grid,pages,details);

  const picker = { element:overlay, dialog, close, load:()=>load() };
  activePicker = picker;
  function close() {
    if (activePicker !== picker) return;
    controller?.abort(); requestId++;
    overlay.remove(); activePicker = null;
    // Selecting a profile can replace its original "Choose" card. Return to
    // the surviving launcher rather than leaving focus on the removed dialog.
    const returnTo=focusReturn?.isConnected?focusReturn:document.querySelector('#stickers-library-panel [data-media-open]');
    if (returnTo?.focus) returnTo.focus({preventScroll:true});
  }
  function selection(item) {
    details.replaceChildren();details.hidden=false;
    const text = document.createElement('span');text.textContent=`${item.name} · ${item.kind === 'emote' ? item.source : item.kind}`;
    const link = document.createElement('input');link.type='text';link.readOnly=true;
    link.value=mediaURL(item);link.setAttribute('aria-label','Selected image URL');
    const copy = button('Copy image link','',async()=>{
      try { await navigator.clipboard.writeText(link.value);status.textContent='Image link copied.'; }
      catch {link.focus();link.select();status.textContent='Select and copy the image link above.';}
    });
    const download = document.createElement('a');download.textContent='Download';
    download.href=mediaURL(item,'download');download.target='_blank';download.rel='noopener noreferrer';
    details.append(text,link,copy,download);
    if (item.kind === 'pfp' && onAvatar) details.append(button('Use as chat avatar','aether-media-use',()=>{onAvatar(item);close();}));
    if (item.kind === 'banner' && onBanner) details.append(button('Use as chat banner','aether-media-use',()=>{onBanner(item);close();}));
  }
  function configure() {
    tabs.replaceChildren();
    for (const id of categories) {
      const tab = button(CATEGORIES[id],'aether-media-tab',()=>{
        if (type===id) return;
        type=id; page=1; details.hidden=true;configure();load();
      });
      tab.setAttribute('role','tab');tab.setAttribute('aria-selected',String(type===id));
      tab.setAttribute('aria-controls','aether-media-results');tabs.append(tab);
    }
    input.value=DEFAULTS[type];
    input.placeholder=type==='telegram'?'Public set name (e.g. UtyaDuck)':
      ['pfps','banners'].includes(type)?'One tag, e.g. music':'Search titles and tags';
    source.hidden=type!=='emotes';
    grid.id='aether-media-results';
  }
  function show(items) {
    grid.replaceChildren();
    const reduced=typeof matchMedia==='function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (const item of items) {
      if (reduced && item.animated && item.kind !== 'telegram') continue;
      const tile=button(item.name,'aether-media-item',()=>{
        // Profile assets expose both Copy/Download and Use-as-chat-profile even
        // when the lyric chat also accepts ordinary stickers/emotes on selection.
        if (onSelect && !(item.kind === 'pfp' && onAvatar) && !(item.kind === 'banner' && onBanner)) {
          onSelect(item);close();
        } else selection(item);
      });
      tile.setAttribute('aria-label',`Choose ${item.name} (${item.kind === 'emote' ? item.source+' emote' : item.kind})`);
      tile.replaceChildren();
      const img=document.createElement('img');img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';
      img.src=mediaURL(item);
      img.onerror=()=>{img.remove();};
      const label=document.createElement('span');label.textContent=item.name;
      tile.append(img,label);grid.append(tile);
    }
    if (!grid.children.length) status.textContent='No matching media. Try another search or source.';
    return grid.children.length;
  }
  async function load() {
    controller?.abort();controller=new AbortController();
    const id=++requestId;
    details.hidden=true;pages.hidden=true;
    grid.replaceChildren();status.textContent='Loading public media…';
    previous.disabled=true;next.disabled=true;
    const q=input.value.trim();
    try {
      const result=await listMedia(type,{
        query:type==='telegram'?'':q,
        set:type==='telegram'?q:'UtyaDuck',source:source.value,page,signal:controller.signal
      },fetchImpl);
      if (id!==requestId || !overlay.isConnected) return;
      nextPage=result.nextPage;
      const visible=show(result.items);
      if(visible)status.textContent=`${visible} ${CATEGORIES[type].toLowerCase()} found${result.unavailable.length?' · some emote sources unavailable':''}.`;
      previous.disabled=page<=1;next.disabled=!nextPage;
      pages.hidden=!['pfps','banners'].includes(type);
    } catch (e) {
      if (id!==requestId || !overlay.isConnected || controller.signal.aborted) return;
      status.textContent=`Media unavailable: ${e.message}. Existing local chat options still work.`;
      nextPage=null;pages.hidden=true;
    }
  }
  form.addEventListener('submit',e=>{e.preventDefault();page=1;load();});
  source.addEventListener('change',()=>{page=1;load();});
  overlay.addEventListener('pointerdown',e=>{if(e.target===overlay)close();});
  dialog.addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.preventDefault();close();return;}
    if(e.key==='Tab'){
      const targets=[...dialog.querySelectorAll('button:not(:disabled):not([hidden]),input:not([hidden]),select:not([hidden]),a[href]')].filter(n=>!n.closest('[hidden]'));
      if(e.shiftKey && (document.activeElement===targets[0] || document.activeElement===dialog)){e.preventDefault();targets.at(-1)?.focus();}
      else if(!e.shiftKey && document.activeElement===targets.at(-1)){e.preventDefault();targets[0]?.focus();}
    }
  });
  configure();load();dialog.focus();
  return picker;
}
