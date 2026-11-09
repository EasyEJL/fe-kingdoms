#!/usr/bin/env python3
"""Assemble unchanged Fe files and compile using the pinned native compiler."""
import hashlib, json, pathlib, subprocess
ROOT=pathlib.Path(__file__).resolve().parents[1]
def build():
    expected='3732fbe8a6e9d2ea3925d02d0e3a1478bc1e01d742c2be75d3ea7300c46c45f0'
    assert hashlib.sha256(pathlib.Path('/usr/local/bin/fe').read_bytes()).hexdigest()==expected
    for p in ('generated','out','evidence'): (ROOT/p).mkdir(exist_ok=True)
    source='\n'.join((ROOT/'src'/p).read_text(encoding='utf-8-sig') for p in ('engine.fe','native.fe'))
    (ROOT/'generated/kingdom.fe').write_text(source)
    subprocess.run(['fe','build','--backend','native','-O','1','--emit','executable','--out-dir','out','generated/kingdom.fe'],cwd=ROOT,check=True)
    for version in (1,2,3,4,5):
        legacy='\n'.join((ROOT/f'legacy/v{version}'/name).read_text(encoding='utf-8-sig') for name in ('engine.fe','native.fe'))
        (ROOT/f'generated/kingdom-v{version}.fe').write_text(legacy)
        subprocess.run(['fe','build','--backend','native','-O','1','--emit','executable','--out-dir','out',f'generated/kingdom-v{version}.fe'],cwd=ROOT,check=True)
    (ROOT/'evidence/build.json').write_text(json.dumps({'compiler_sha256':expected,'source_sha256':hashlib.sha256(source.encode()).hexdigest()},indent=2))
if __name__=='__main__': build()
