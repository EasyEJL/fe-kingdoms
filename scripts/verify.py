"""Offline complete verification; stores logs, exact source hashes and results."""
import hashlib,json,pathlib,subprocess,sys,time
ROOT=pathlib.Path(__file__).resolve().parents[1]
E=ROOT/'evidence';E.mkdir(exist_ok=True)
commands=[['python3','scripts/build.py'],['python3','scripts/test_fe.py'],['python3','scripts/test_matches.py'],['python3','tests/test_http.py'],['python3','scripts/test_http_match.py']]
results=[]
summary={'status':'running','checks':results}
(E/'verification.json').write_text(json.dumps(summary,indent=2))
for index,command in enumerate(commands):
    start=time.perf_counter()
    p=subprocess.run(command,cwd=ROOT,capture_output=True,text=True,timeout=360 if command[-1]=='scripts/test_matches.py' else 180)
    (E/f'verify-{index}.stdout').write_text(p.stdout)
    (E/f'verify-{index}.stderr').write_text(p.stderr)
    results.append({'command':command,'exit':p.returncode,'seconds':time.perf_counter()-start})
    print(p.stdout,end='');print(p.stderr,end='',file=sys.stderr)
    if p.returncode:
        summary['status']='failed';(E/'verification.json').write_text(json.dumps(summary,indent=2));sys.exit(p.returncode)
summary['status']='passed'
summary['sha256']={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for directory in ('src','scripts','tests','web') for p in (ROOT/directory).glob('*') if p.is_file()}
summary['sha256']['server.py']=hashlib.sha256((ROOT/'server.py').read_bytes()).hexdigest()
summary['browser_verification']='blocked: Windows Computer Use could not determine the current browser URL confidently; no further browser attempt made'
summary['human_playtest']=False
(E/'verification.json').write_text(json.dumps(summary,indent=2))
print('All native Fe, match, replay, parser and HTTP checks passed.')
