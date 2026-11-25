#!/usr/bin/env python3
"""Deterministic source inventory and changelog snapshot. No guessed metrics."""
import json
from pathlib import Path
import subprocess
ROOT=Path(__file__).resolve().parents[1]
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT,text=True).strip()
files=git('ls-files','src','styles','scripts').splitlines()
commits=[]
for line in git('log','-30','--format=%H%x09%cI%x09%s').splitlines():
    sha,date,title=line.split('\t',2)
    commits.append(dict(sha=sha,date=date,title=title,url=f'https://github.com/MeYashverma/AetherOS-Prod/commit/{sha}'))
metadata=dict(schemaVersion=1,revision=git('rev-parse','HEAD'),commitDate=git('show','-s','--format=%cI','HEAD'),
              repository='MeYashverma/AetherOS-Prod',files=files,commits=commits)
(ROOT/'assets/project-metadata.json').write_text(json.dumps(metadata,indent=2)+'\n')
print(f'Generated metadata from {metadata["revision"][:7]}: {len(files)} tracked source paths, {len(commits)} real commits')
