import importlib.util
import json
from pathlib import Path
import threading
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.parse import parse_qs, urlsplit
from urllib.request import urlopen

spec = importlib.util.spec_from_file_location('wallpaper_server', Path(__file__).resolve().parents[1] / 'scripts' / 'serve.py')
s = importlib.util.module_from_spec(spec)
spec.loader.exec_module(s)


class Wallpapers(unittest.TestCase):
    def test_queries_are_sfw_and_allowlisted(self):
        for topic in s.TOPICS:
            params = parse_qs(urlsplit(s.search_url(topic, '4k', 'seed')).query)
            self.assertEqual(params['purity'], ['100'])
            self.assertEqual(params['atleast'], ['3840x2160'])
        self.assertEqual(parse_qs(urlsplit(s.search_url('anime', '4k', 's')).query)['categories'], ['010'])
        for identifier in ['../abc', 'https://evil.test', 'abcdefg']:
            with self.assertRaises(ValueError):
                s.image_url(identifier, 'jpg')

    def test_metadata_rejects_nsfw_small_and_untrusted_images(self):
        item = dict(id='abc123', path='https://w.wallhaven.cc/full/ab/wallhaven-abc123.jpg', purity='sfw', dimension_x=3840, dimension_y=2160, file_size=200000)
        self.assertEqual(len(s.normalize_wallhaven({'data': [item]}, '4k')), 1)
        for change in [dict(purity='nsfw'), dict(dimension_x=1920), dict(path='https://evil.test/x.jpg'), dict(file_size=30*1024*1024)]:
            self.assertEqual(s.normalize_wallhaven({'data': [{**item, **change}]}, '4k'), [])

    def test_http_adapter_cache_image_approval_and_hidden_files(self):
        s.CACHE.clear()
        s.LAST_REQUESTS.clear()
        class QuietHandler(s.Handler):
            def log_message(self, *args): pass
        server = s.ThreadingHTTPServer(('127.0.0.1', 0), QuietHandler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        base = f'http://127.0.0.1:{server.server_port}'
        def get(path):
            return urlopen(base + path, timeout=3)
        item = dict(id='abc123', path='https://w.wallhaven.cc/full/ab/wallhaven-abc123.jpg', purity='sfw', dimension_x=3840, dimension_y=2160)
        def remote(url, limit, image=False):
            return (b'fake-image', 'image/jpeg') if image else (json.dumps({'data': [item]}).encode(), 'application/json')
        try:
            for path in ['/api/wallpapers?topic=evil', '/api/wallpaper-image?id=abc123&ext=jpg', '/%2egit/config']:
                with self.assertRaises(HTTPError): get(path)
            with patch.object(s, 'remote', side_effect=remote) as mock:
                for _ in range(2):
                    data = json.load(get('/api/wallpapers?topic=anime&seed=test'))
                    self.assertEqual(data['data'][0]['purity'], 'sfw')
                self.assertEqual(mock.call_count, 1)
                response = get('/api/wallpaper-image?id=abc123&ext=jpg')
                self.assertEqual(response.headers['Content-Type'], 'image/jpeg')
                self.assertEqual(response.read(), b'fake-image')
                self.assertEqual(mock.call_count, 2)
        finally:
            server.shutdown()
            server.server_close()
            thread.join()

class MultiProvider(unittest.TestCase):
    def setUp(self):
        import tempfile
        self.p = s.providers
        self.temp = tempfile.TemporaryDirectory()
        self.cache_patch = patch.object(self.p, 'CACHE_DIR', Path(self.temp.name))
        self.cache_patch.start()
        self.env_patch = patch.dict('os.environ', {'PIXABAY_API_KEY':'test-only', 'NEXWALL_API_KEY':'', 'PEXELS_API_KEY':'test-only', 'UNSPLASH_ACCESS_KEY':'test-only', 'PEXELS_WALLPAPER_APPROVED':'0', 'UNSPLASH_WALLPAPER_APPROVED':'0'})
        self.env_patch.start()
        self.p.MEMORY.clear(); self.p.APPROVED.clear(); self.p.LIMITS.clear(); self.p.INFLIGHT.clear()

    def tearDown(self):
        self.cache_patch.stop(); self.env_patch.stop(); self.temp.cleanup()

    def pixabay(self):
        return {'hits':[{'id':42,'imageWidth':3840,'imageHeight':2160,'imageURL':'https://pixabay.com/get/image.jpg','pageURL':'https://pixabay.com/photos/example-42/','user':'Artist'}]}

    def test_capabilities_hide_secrets_and_gate_restricted_providers(self):
        caps={p['id']:p for p in self.p.capabilities()}
        self.assertTrue(caps['pixabay']['ready']); self.assertTrue(caps['nexwall']['ready'])
        self.assertFalse(caps['pexels']['ready']); self.assertFalse(caps['unsplash']['ready'])
        self.assertNotIn('test-only',json.dumps(caps))
        with self.assertRaises(ValueError): self.p.search('pexels','abstract','hd')

    def test_pixabay_24h_metadata_persists_and_image_is_cached_not_hotlinked(self):
        with patch.object(self.p,'fetch',return_value=self.pixabay()) as mock:
            data=self.p.search('pixabay','abstract','hd')
            self.assertTrue(data[0]['image'].startswith('/api/wallpapers/image?token='))
            self.p.MEMORY.clear(); self.p.APPROVED.clear()
            again=self.p.search('pixabay','abstract','hd')
            self.assertEqual(data,again); self.assertEqual(mock.call_count,1)
        token=data[0]['image'].split('=')[-1]
        with patch.object(self.p,'fetch',return_value=(b'jpeg-data','image/jpeg')) as mock:
            self.assertEqual(self.p.image(token),(b'jpeg-data','image/jpeg'))
            self.assertEqual(self.p.image(token),(b'jpeg-data','image/jpeg'))
            self.assertEqual(mock.call_count,1)
        for file in Path(self.temp.name).glob('*.json'):
            self.assertNotIn('test-only',file.read_text())
        with self.assertRaises(ValueError): self.p.image('a'*64)

    def test_nexwall_screen_fit_is_explicit_and_preserves_strict_4k(self):
        raw={'data':[{'id':7,'type':'image','width':1440,'height':2560,'image_url':'https://img.kodnextech.com/wallpapers/example.jpg','tags':'anime'}]}
        self.assertEqual(self.p.normalize('nexwall',raw,'4k'),[])
        self.assertEqual(self.p.normalize('nexwall',raw,'hd'),[])
        self.assertEqual(len(self.p.normalize('nexwall',raw,'screen')),1)
        raw['data'][0]['image_url']='https://evil.test/image.jpg'
        self.assertEqual(self.p.normalize('nexwall',raw,'screen'),[])

    def test_unsplash_keeps_hotlink_parameters_and_tracks_only_approved_download(self):
        raw={'results':[{'id':'abc-123','width':4000,'height':2500,'urls':{'raw':'https://images.unsplash.com/example?ixid=preserved'},'links':{'html':'https://unsplash.com/photos/abc-123','download_location':'https://api.unsplash.com/photos/abc-123/download'},'user':{'name':'Artist'}}]}
        record=self.p.normalize('unsplash',raw,'hd')[0]
        self.assertIn('ixid=preserved',record['image']); self.assertIn('utm_source=aetheros',record['source'])
        with patch.object(self.p,'fetch',return_value={}) as mock:
            self.p.selected(record['selectionToken'])
            self.assertEqual(mock.call_args.args[0],'https://api.unsplash.com/photos/abc-123/download')
        raw['results'][0]['links']['download_location']='https://evil.test/track'
        self.assertEqual(self.p.normalize('unsplash',raw,'hd'),[])

    def test_parallel_identical_searches_share_one_request(self):
        from concurrent.futures import ThreadPoolExecutor
        import time
        def fake(*args):
            time.sleep(.05)
            return self.pixabay()
        with patch.object(self.p,'fetch',side_effect=fake) as mock, ThreadPoolExecutor(max_workers=3) as pool:
            results=list(pool.map(lambda _:self.p.search('pixabay','gaming','hd'),range(3)))
            self.assertEqual(mock.call_count,1); self.assertEqual(results[0],results[1])

    def test_invalid_filters_do_not_contact_any_provider(self):
        with patch.object(self.p,'fetch') as mock:
            for args in [('arbitrary','abstract','hd'),('pixabay','unknown','hd'),('pixabay','abstract','tiny'),('pixabay','abstract','hd','x'*81)]:
                with self.assertRaises(ValueError): self.p.search(*args)
            self.assertEqual(mock.call_count,0)


if __name__ == '__main__':
    unittest.main()
