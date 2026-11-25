#!/usr/bin/env python3
"""Reproduce the vendored Fluent Color SVG subset without installing a runtime package.

Usage: python3 scripts/import-app-icons.py [path/to/svg-icons-1.1.347.tgz]
The pinned archive and each extracted SVG are verified against SOURCES.json.
The upstream MIT notice in assets/app-icons/LICENSE.txt must be retained.
"""
import hashlib
import io
import json
from pathlib import Path
import sys
import tarfile
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'assets' / 'app-icons'
manifest = json.loads((DEST / 'SOURCES.json').read_text())
if len(sys.argv) > 1:
    data = Path(sys.argv[1]).read_bytes()
else:
    with urllib.request.urlopen(manifest['archive'], timeout=60) as response:
        data = response.read()
if hashlib.sha256(data).hexdigest() != manifest['archive_sha256']:
    raise SystemExit('Archive checksum mismatch; refusing to import.')
verified = {}
with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as archive:
    for app, info in manifest['icons'].items():
        content = archive.extractfile('package/icons/' + info['file']).read()
        if hashlib.sha256(content).hexdigest() != info['sha256']:
            raise SystemExit('SVG checksum mismatch: ' + app)
        verified[app] = content
for app, content in verified.items():
    (DEST / (app + '.svg')).write_bytes(content)
print(f"Imported {len(verified)} verified Fluent Color SVGs ({manifest['version']}).")
