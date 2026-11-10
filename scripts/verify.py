"""Offline complete verification; stores logs, exact source hashes and results."""
import hashlib,json,pathlib,subprocess,sys,time
ROOT=pathlib.Path(__file__).resolve().parents[1]
E=ROOT/'evidence';E.mkdir(exist_ok=True)
commands=[['python3','scripts/build.py'],['python3','scripts/test_fe.py'],['python3','scripts/test_tactics.py'],['python3','scripts/test_matches.py'],['python3','tests/test_http.py'],['python3','tests/test_decisions.py'],['python3','tests/test_campaign.py'],['python3','tests/test_playtest_replays.py'],['python3','scripts/test_http_match.py']]
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
for p in list((ROOT/'tests/fixtures').glob('*.json')) + list((ROOT/'legacy/v6').glob('*.fe')):
    summary['sha256'][str(p.relative_to(ROOT))]=hashlib.sha256(p.read_bytes()).hexdigest()
for name in ('small','medium'):
    fixture=f'docs/playtests/v6-sol-{name}.json'
    summary['sha256'][fixture]=hashlib.sha256((ROOT/fixture).read_bytes()).hexdigest()
summary['browser_verification']='not run by this automated suite'
summary['human_playtest']=False
(E/'verification.json').write_text(json.dumps(summary,indent=2))
print('All native Fe, bounded self-play, replay, parser and HTTP checks passed.')
