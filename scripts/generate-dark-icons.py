#!/usr/bin/env python3
"""Dark presentation variants of vendored Fluent art; original paths unchanged."""
from pathlib import Path
import re,json,hashlib
root=Path(__file__).resolve().parents[1]/'assets/app-icons'
records={}
for path in sorted(root.glob('*.svg')):
    source=path.read_text(); source=re.sub(r'<\?xml[^>]*>','',source).strip()
    start,end=source.split('>',1)
    start=re.sub(r'\s(?:width|height)="[^"]*"','',start)
    source=start.replace('<svg ', '<svg x="8" y="8" width="48" height="48" ',1)+'>'+end
    out='<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><defs><linearGradient id="darkTile" x2=".8" y2="1"><stop stop-color="#354358"/><stop offset="1" stop-color="#101823"/></linearGradient></defs><rect x="1" y="1" width="62" height="62" rx="15" fill="url(#darkTile)" stroke="#718399" stroke-opacity=".45"/>'+source+'</svg>\n'
    (root/'dark'/path.name).write_text(out)
    records[path.name]=hashlib.sha256(out.encode()).hexdigest()
(root/'dark/SOURCES.json').write_text(json.dumps({'source':'../SOURCES.json','modification':'AetherOS dark rounded tile around unmodified Microsoft Fluent Color artwork; not official Microsoft dark variants. Original MIT license in parent directory.','files':records},indent=2)+'\n')
