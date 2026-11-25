"""Fixed-host wallpaper adapters. Keys never leave this process.
Pixabay metadata and selected image files are cached for 24h, not hotlinked.
Unsplash/Pexels require explicit operator approval for this use case.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed, TimeoutError as FuturesTimeout
import hashlib
import json
import os
from pathlib import Path
import re
import threading
import time
from urllib.parse import urlencode, urlsplit, urlunsplit, parse_qsl
from urllib.request import Request, build_opener, HTTPRedirectHandler

CACHE_DIR = Path(__file__).resolve().parents[1] / '.cache' / 'wallpaper-providers'
LOCK = threading.RLock()
TOPICS = {'gaming': 'video games', 'anime': 'anime', 'meme': 'memes', 'amoled': 'black minimal',
          'abstract': 'abstract', 'landscape': 'landscape', 'coast': 'ocean', 'space': 'space',
          'nature': 'nature', 'city': 'city skyline', 'cars': 'cars', 'animals': 'animals',
          'flowers': 'flowers', 'minimal': 'minimal', 'cyberpunk': 'cyberpunk', 'mountains': 'mountains'}
HOSTS = {'unsplash': {'images.unsplash.com'}, 'pexels': {'images.pexels.com'},
         'pixabay': {'pixabay.com', 'cdn.pixabay.com'},
         'nexwall': {'nexwall.kodnextech.com', 'img.kodnextech.com'}}
SOURCES = {'unsplash': 'unsplash.com', 'pexels': 'www.pexels.com', 'pixabay': 'pixabay.com', 'nexwall': 'nexwall.kodnextech.com'}
KEYS = {'unsplash': 'UNSPLASH_ACCESS_KEY', 'pexels': 'PEXELS_API_KEY', 'pixabay': 'PIXABAY_API_KEY', 'nexwall': 'NEXWALL_API_KEY'}
MEMORY = {}
APPROVED = {}
INFLIGHT = {}
IMAGE_LOCK = threading.Lock()
LIMITS = {}
POOL = ThreadPoolExecutor(max_workers=8)


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError('Upstream redirect refused')


def valid_url(value, hosts):
    try:
        p = urlsplit(value)
        return p.scheme == 'https' and p.hostname in hosts and p.port in (None, 443) and not p.username and not p.password
    except (ValueError, TypeError):
        return False


def fetch(url, headers=None, image=False):
    # All callers construct fixed-host URLs or validate against an exact allowlist.
    req = Request(url, headers={'User-Agent': 'AetherOS-Wallpapers/2.0', **(headers or {})})
    with build_opener(NoRedirect).open(req, timeout=5) as response:
        kind = response.headers.get_content_type()
        if image and kind not in ('image/jpeg', 'image/png', 'image/webp'):
            raise ValueError('Unsupported image response')
        if not image and kind != 'application/json':
            raise ValueError('Provider did not return JSON')
        limit = 25 * 1024 * 1024 if image else 3 * 1024 * 1024
        body = response.read(limit + 1)
        if len(body) > limit:
            raise ValueError('Provider response too large')
        return (body, kind) if image else json.loads(body)


def capabilities():
    output = []
    for provider, env in KEYS.items():
        approval = provider not in ('unsplash', 'pexels') or os.getenv(provider.upper() + '_WALLPAPER_APPROVED') == '1'
        keyed = bool(os.getenv(env))
        ready = approval and (keyed or provider == 'nexwall')
        reason = '' if ready else ('Operator must confirm provider approval for this wallpaper use' if not approval else f'Set {env} on the server')
        output.append({'id': provider, 'ready': ready, 'mode': 'keyed' if keyed else 'demo' if provider == 'nexwall' else 'unconfigured', 'reason': reason})
    return output


def minimum(quality):
    return (3840, 2160) if quality == '4k' else (1920, 1080) if quality == 'hd' else (720, 1280)


def normalize(provider, raw, quality):
    minimum_size = minimum(quality)
    records = raw.get('results', []) if provider == 'unsplash' else raw.get('photos', []) if provider == 'pexels' else raw.get('hits', []) if provider == 'pixabay' else raw.get('data', [])
    result = []
    for item in records[:40]:
        w, h = item.get('width', item.get('imageWidth', 0)), item.get('height', item.get('imageHeight', 0))
        if not isinstance(w, int) or not isinstance(h, int): continue
        # Screen-fit deliberately allows phone portrait imagery, with cropping.
        if quality == 'screen':
            if max(w, h) < 1280 or min(w, h) < 720: continue
        elif w < minimum_size[0] or h < minimum_size[1]: continue
        identifier = str(item.get('id', ''))
        if not re.fullmatch(r'[a-zA-Z0-9_-]{1,80}', identifier): continue
        track = None
        if provider == 'unsplash':
            image = item.get('urls', {}).get('raw', '')
            if valid_url(image, HOSTS[provider]):
                p = urlsplit(image)
                params = dict(parse_qsl(p.query)); params.update(w='3840' if quality == '4k' else '1920', fit='max', auto='format', q='85')
                image = urlunsplit((p.scheme, p.netloc, p.path, urlencode(params), ''))
            source = item.get('links', {}).get('html', '')
            if valid_url(source, {SOURCES[provider]}):
                p = urlsplit(source); params = dict(parse_qsl(p.query)); params.update(utm_source='aetheros', utm_medium='referral')
                source = urlunsplit((p.scheme,p.netloc,p.path,urlencode(params),''))
            artist = item.get('user', {}).get('name', 'Unsplash photographer')
            track = item.get('links', {}).get('download_location', '')
            if not valid_url(track, {'api.unsplash.com'}) or urlsplit(track).path != f'/photos/{identifier}/download': continue
        elif provider == 'pexels':
            image, source, artist = item.get('src', {}).get('original', ''), item.get('url', ''), item.get('photographer', 'Pexels photographer')
            if valid_url(image, HOSTS[provider]):
                p = urlsplit(image); params = dict(parse_qsl(p.query))
                params.update(auto='compress', cs='tinysrgb', w='3840' if quality == '4k' else '1920', fit='max')
                image = urlunsplit((p.scheme,p.netloc,p.path,urlencode(params),''))
        elif provider == 'pixabay':
            # Do not pretend the usual 1280px largeImageURL is HD/4K.
            image = item.get('imageURL') or item.get('fullHDURL') or ''
            if not item.get('imageURL') and quality == '4k': continue
            source, artist = item.get('pageURL', ''), item.get('user', 'Pixabay contributor')
        else:
            if item.get('type') != 'image': continue
            image, source, artist = item.get('image_url', ''), 'https://nexwall.kodnextech.com/wallpaper-api', 'NexWall'
        if not valid_url(image, HOSTS[provider]) or not valid_url(source, {SOURCES[provider]}): continue
        token = hashlib.sha256((provider + ':' + image).encode()).hexdigest()
        record = {'id': identifier, 'providerId': provider, 'provider': {'nexwall':'NexWall','pixabay':'Pixabay','pexels':'Pexels','unsplash':'Unsplash'}[provider],
                  'image': '/api/wallpapers/image?token=' + token if provider == 'pixabay' else image,
                  'source': source, 'artist': str(artist)[:160], 'title': str(item.get('alt_description') or item.get('alt') or item.get('tags') or provider + ' wallpaper')[:240],
                  'width': w, 'height': h, 'license': 'See source and provider usage terms', 'selectionToken': token if track else ''}
        with LOCK:
            APPROVED[token] = (time.time(), provider, image, track)
            while len(APPROVED) > 24000: APPROVED.pop(next(iter(APPROVED)))
        result.append(record)
    return result


def query(provider, topic, quality, search=''):
    cap = next((p for p in capabilities() if p['id'] == provider), None)
    if not cap or not cap['ready']: raise ValueError(cap['reason'] if cap else 'Unknown provider')
    term = search or TOPICS[topic]
    key = os.getenv(KEYS[provider], '')
    headers = {}
    if provider == 'unsplash':
        url = 'https://api.unsplash.com/search/photos?' + urlencode({'query':term, 'orientation':'landscape', 'content_filter':'high', 'per_page':30})
        headers = {'Authorization': 'Client-ID ' + key, 'Accept-Version': 'v1'}
    elif provider == 'pexels':
        url = 'https://api.pexels.com/v1/search?' + urlencode({'query':term, 'orientation':'landscape', 'size':'large', 'per_page':30})
        headers = {'Authorization': key}
    elif provider == 'pixabay':
        w,h = minimum(quality)
        url = 'https://pixabay.com/api/?' + urlencode({'key':key, 'q':term, 'safesearch':'true', 'orientation':'horizontal', 'min_width':w, 'min_height':h, 'per_page':30})
    else:
        url = 'https://nexwall.kodnextech.com/api/developer/v1/' + ('wallpapers' if key else 'demo/wallpapers') + '?' + urlencode({'search':term, 'per_page':30 if key else 10, 'sort':'popular'})
        if key: headers = {'Authorization':'Bearer ' + key}
    return normalize(provider, fetch(url, headers), quality)


def search(provider, topic, quality, text=''):
    if provider not in KEYS or topic not in TOPICS or quality not in ('4k','hd','screen') or len(text) > 80:
        raise ValueError('Invalid provider or filter')
    cap = next(p for p in capabilities() if p['id'] == provider)
    if not cap['ready']: raise ValueError(cap['reason'])
    # Seed/Next is intentionally not a search key: rotate cached result batches.
    digest = hashlib.sha256(json.dumps([provider,topic,quality,text]).encode()).hexdigest()
    ttl = 86400 if provider == 'pixabay' else 1800
    with LOCK:
        cached = MEMORY.get(digest)
        if cached and time.time()-cached[0] < ttl: return cached[1]
        future = INFLIGHT.get(digest)
        if not future:
            now = time.monotonic()
            LIMITS[provider] = [t for t in LIMITS.get(provider, []) if now-t < 60]
            if len(LIMITS[provider]) >= (8 if provider == 'nexwall' else 20): raise ValueError('Provider request cooldown; try again shortly')
            LIMITS[provider].append(now)
            future = POOL.submit(_search, digest, provider, topic, quality, text, ttl)
            INFLIGHT[digest] = future
    try:
        return future.result(timeout=7)
    finally:
        with LOCK:
            if future.done(): INFLIGHT.pop(digest, None)


def _search(digest, provider, topic, quality, text, ttl):
    path = CACHE_DIR / (digest + '.json')
    if provider == 'pixabay' and path.exists() and time.time()-path.stat().st_mtime < ttl:
        stored = json.loads(path.read_text())
        result = normalize(provider, stored, quality)
    else:
        # For Pixabay persist the original metadata, so image approvals can be
        # reconstructed after a restart. Never persist API keys or request URLs.
        if provider == 'pixabay':
            term = text or TOPICS[topic]; w,h = minimum(quality)
            raw = fetch('https://pixabay.com/api/?' + urlencode({'key':os.getenv(KEYS[provider], ''),'q':term,'safesearch':'true','orientation':'horizontal','min_width':w,'min_height':h,'per_page':30}))
            CACHE_DIR.mkdir(parents=True, exist_ok=True)
            # Preserve valid 24h search entries; reject rather than evict early.
            for old in CACHE_DIR.glob('*.json'):
                if time.time()-old.stat().st_mtime >= 86400: old.unlink(missing_ok=True)
            if len(list(CACHE_DIR.glob('*.json'))) >= 512: raise ValueError('Search cache full; retry later')
            temp = path.with_suffix('.tmp'); temp.write_text(json.dumps(raw)); temp.replace(path)
            result = normalize(provider, raw, quality)
        else:
            result = query(provider, topic, quality, text)
    with LOCK:
        MEMORY[digest] = (time.time(), result)
        while len(MEMORY) > 128: MEMORY.pop(next(iter(MEMORY)))
    return result


def aggregate(topic, quality, text=''):
    enabled = [p['id'] for p in capabilities() if p['ready']]
    # Separate workers avoid deadlock with the provider single-flight pool.
    executor = ThreadPoolExecutor(max_workers=4)
    pending = {executor.submit(search,p,topic,quality,text): p for p in enabled}
    results, errors = [], []
    try:
        for future in as_completed(pending, timeout=7):
            try:
                results.extend(future.result())
                if results: break  # fastest nonempty provider wins; other searches warm their caches
            except Exception: errors.append(pending[future] + ': unavailable')
    except FuturesTimeout:
        errors.append('Some providers timed out')
    finally:
        executor.shutdown(wait=False, cancel_futures=True)
    return {'data':results, 'warnings':errors}


def selected(token):
    with LOCK: approved = APPROVED.get(token)
    if not approved or time.time()-approved[0] > 86400: raise ValueError('Wallpaper selection expired; refresh results')
    _, provider, _, track = approved
    if provider != 'unsplash' or not track: return
    fetch(track, {'Authorization':'Client-ID ' + os.getenv('UNSPLASH_ACCESS_KEY',''), 'Accept-Version':'v1'})


def image(token):
    with IMAGE_LOCK:
        return _image(token)


def _image(token):
    if not re.fullmatch(r'[a-f0-9]{64}', token): raise ValueError('Invalid image token')
    with LOCK: approved = APPROVED.get(token)
    if not approved or time.time()-approved[0] > 86400 or approved[1] != 'pixabay': raise ValueError('Search for this image first')
    path = CACHE_DIR / (token + '.image')
    if path.exists() and time.time()-path.stat().st_mtime < 86400:
        raw = path.read_bytes(); kind,body = raw.split(b'\n',1); return body, kind.decode()
    body,kind = fetch(approved[2], image=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    for old in CACHE_DIR.glob('*.image'):
        if time.time()-old.stat().st_mtime >= 86400: old.unlink(missing_ok=True)
    if sum(p.stat().st_size for p in CACHE_DIR.glob('*.image')) + len(body) > 256*1024*1024:
        raise ValueError('Image cache full; retry later')
    temp = path.with_suffix('.tmp-image'); temp.write_bytes(kind.encode()+b'\n'+body);temp.replace(path)
    return body, kind
