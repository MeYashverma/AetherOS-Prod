#!/usr/bin/env python3
"""AetherOS static server + narrow same-origin SFW Wallhaven adapter.
Run: python3 scripts/serve.py --port 4174 --host 0.0.0.0
No keys are needed for the public SFW search. Deploy this server (or an
 equivalent /api adapter) for online Wallhaven mode; static hosting alone
cannot supply these endpoints. No arbitrary proxy URLs are accepted.
"""
try:
    import wallpaper_providers as providers
except ModuleNotFoundError:
    from scripts import wallpaper_providers as providers

import argparse
from collections import OrderedDict
import hashlib
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import re
import threading
import time
from urllib.error import HTTPError
from urllib.parse import parse_qs, urlencode, urlsplit, unquote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
TOPICS = {
    'gaming': ('video games', '100'), 'anime': ('', '010'), 'meme': ('memes', '100'),
    'amoled': ('minimalism black', '100'), 'abstract': ('abstract', '100'),
    'landscape': ('landscape', '100'), 'coast': ('ocean', '100'), 'space': ('space', '100'),
}
TOPICS.update({k: (v, '100') for k, v in providers.TOPICS.items() if k not in TOPICS})
CACHE = OrderedDict()
LOCK = threading.Lock()
LAST_REQUESTS = {}


def search_url(topic, quality, seed, search=None):
    query, categories = TOPICS[topic]
    if search: query = search
    return 'https://wallhaven.cc/api/v1/search?' + urlencode({
        'q': query, 'categories': categories, 'purity': '100', 'sorting': 'random',
        'seed': hashlib.sha256(seed.encode()).hexdigest()[:6],
        'atleast': '3840x2160' if quality == '4k' else '1920x1080',
        'ratios': '16x9,16x10', 'page': '1',
    })


def image_url(identifier, extension):
    if not re.fullmatch(r'[a-z0-9]{6}', identifier) or extension not in ('jpg', 'png', 'webp'):
        raise ValueError('Invalid wallpaper image')
    return f'https://w.wallhaven.cc/full/{identifier[:2]}/wallhaven-{identifier}.{extension}'


def normalize_wallhaven(data, quality):
    minimum = (3840, 2160) if quality == '4k' else (1920, 1080)
    results = []
    for item in data.get('data', []):
        identifier = str(item.get('id', ''))
        path = str(item.get('path', ''))
        extension = path.rsplit('.', 1)[-1]
        if item.get('purity') != 'sfw' or not re.fullmatch(r'[a-z0-9]{6}', identifier):
            continue
        if extension not in ('jpg', 'png', 'webp') or path != image_url(identifier, extension):
            continue
        width, height = item.get('dimension_x', 0), item.get('dimension_y', 0)
        if not isinstance(width, int) or not isinstance(height, int) or width < minimum[0] or height < minimum[1]:
            continue
        if item.get('file_size', 0) > 25 * 1024 * 1024:
            continue
        results.append({'id': identifier, 'ext': extension, 'width': width, 'height': height,
                        'source': f'https://wallhaven.cc/w/{identifier}', 'provider': 'Wallhaven', 'purity': 'sfw',
                        'title': f'Wallhaven {identifier}', 'license': 'See source for artist and usage rights'})
    return results


def remote(url, limit, image=False):
    request = Request(url, headers={'User-Agent': 'AetherOS-Wallpapers/1.0', 'Accept': 'image/*' if image else 'application/json'})
    with urlopen(request, timeout=18) as response:
        # Redirects may not turn this narrow adapter into an arbitrary proxy.
        expected_host = 'w.wallhaven.cc' if image else 'wallhaven.cc'
        if urlsplit(response.url).hostname != expected_host:
            raise ValueError('Unexpected upstream redirect')
        content_type = response.headers.get_content_type()
        if image and content_type not in ('image/jpeg', 'image/png', 'image/webp'):
            raise ValueError('Unexpected image content type')
        if not image and content_type != 'application/json':
            raise ValueError('Provider returned a non-JSON response')
        body = response.read(limit + 1)
        if len(body) > limit:
            raise ValueError('Provider response exceeded the size limit')
        return body, content_type


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def reply(self, status, data, content_type='application/json', cache='no-store'):
        body = json.dumps(data).encode() if content_type == 'application/json' else data
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', cache)
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        # No credentials accepted over HTTP. Only approved selection tokens.
        if urlsplit(self.path).path != '/api/wallpapers/select':
            return self.reply(404, {'error': 'Unknown API route'})
        try:
            if int(self.headers.get('Content-Length', '0')) > 256:
                return self.reply(413, {'error': 'Request too large'})
            # Require JSON to prevent cross-origin simple-form quota abuse.
            if self.headers.get_content_type() != 'application/json':
                return self.reply(415, {'error': 'JSON required'})
            data = json.loads(self.rfile.read(int(self.headers.get('Content-Length', '0'))))
            providers.selected(str(data.get('token', '')))
            return self.reply(200, {'ok': True})
        except Exception:
            return self.reply(400, {'error': 'Could not record wallpaper selection; refresh and retry'})

    def do_GET(self):
        parsed = urlsplit(self.path)
        if not parsed.path.startswith('/api/'):
            # Do not serve repository internals or local secrets through the preview.
            if any(part.startswith('.') for part in unquote(parsed.path).split('/') if part):
                self.send_error(404)
                return
            return super().do_GET()
        params = parse_qs(parsed.query)
        get = lambda key, default='': params.get(key, [default])[0]
        try:
            if parsed.path == '/api/wallpapers/providers':
                return self.reply(200, {'providers': providers.capabilities()})
            if parsed.path == '/api/wallpapers/image':
                body, kind = providers.image(get('token'))
                return self.reply(200, body, kind, 'private, max-age=86400')
            if parsed.path == '/api/wallpapers' and get('provider') in ('auto', *providers.KEYS):
                provider, topic, quality, text = get('provider'), get('topic', 'abstract'), get('quality', 'hd'), get('search').strip()
                if topic not in providers.TOPICS or quality not in ('4k','hd','screen') or len(text) > 80:
                    return self.reply(400, {'error': 'Invalid wallpaper filter'})
                if provider == 'auto':
                    return self.reply(200, providers.aggregate(topic, quality, text))
                return self.reply(200, {'data': providers.search(provider, topic, quality, text)})
            if parsed.path == '/api/wallpapers/health':
                return self.reply(200, {'enabled': True, 'provider': 'Wallhaven', 'sfwOnly': True})
            if parsed.path == '/api/wallpapers':
                if get('provider', 'wallhaven') != 'wallhaven':
                    return self.reply(400, {'error': 'Unknown wallpaper provider'})
                topic, quality, seed = get('topic', 'abstract'), get('quality', '4k'), get('seed', '')
                if topic not in TOPICS or quality not in ('4k', 'hd', 'screen') or len(seed) > 160:
                    return self.reply(400, {'error': 'Invalid wallpaper filter'})
                text = get('search').strip()
                if len(text) > 80: return self.reply(400, {'error': 'Search too long'})
                key = (topic, quality, text)  # Next rotates one cached batch, not a new upstream search
                with LOCK:
                    cached = CACHE.get(key)
                    if cached and time.time() - cached[0] < 600:
                        return self.reply(200, cached[1])
                    # Global limit bounds outbound traffic, independent of spoofed client headers.
                    now = time.monotonic()
                    recent = [t for t in LAST_REQUESTS.get('global', []) if now - t < 60]
                    if len(recent) >= 20:
                        return self.reply(429, {'error': 'Wallpaper request limit reached. Try again shortly.'})
                    LAST_REQUESTS['global'] = recent + [now]
                raw, _ = remote(search_url(topic, quality, seed, text), 3 * 1024 * 1024)
                payload = {'data': normalize_wallhaven(json.loads(raw), quality), 'provider': 'Wallhaven'}
                with LOCK:
                    CACHE[key] = (time.time(), payload)
                    while len(CACHE) > 32:
                        CACHE.popitem(last=False)
                return self.reply(200, payload)
            if parsed.path == '/api/wallpaper-image':
                identifier, extension = get('id'), get('ext')
                url = image_url(identifier, extension)
                # Only serve images that appeared in a recent SFW-filtered search.
                with LOCK:
                    approved = any(time.time() - stamp < 3600 and any(
                        p['id'] == identifier and p['ext'] == extension for p in payload['data'])
                        for stamp, payload in CACHE.values())
                if not approved:
                    return self.reply(403, {'error': 'Search for this SFW wallpaper before loading it.'})
                body, content_type = remote(url, 25 * 1024 * 1024, image=True)
                return self.reply(200, body, content_type, 'private, max-age=86400')
            return self.reply(404, {'error': 'Unknown API route'})
        except ValueError as error:
            return self.reply(400, {'error': str(error)})
        except HTTPError as error:
            return self.reply(502, {'error': f'Wallpaper upstream returned HTTP {error.code}. Keeping the current wallpaper.'})
        except Exception:
            return self.reply(502, {'error': 'Wallpaper provider is unreachable from this server. Keeping the local wallpaper.'})


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=4174)
    parser.add_argument('--host', default='0.0.0.0')
    args = parser.parse_args()
    print(f'AetherOS with SFW wallpaper API: http://{args.host}:{args.port}', flush=True)
    ThreadingHTTPServer((args.host, args.port), Handler).serve_forever()
