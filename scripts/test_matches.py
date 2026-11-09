"""Full real-engine matches and parser/replay checks, with no host-side game policy."""
import hashlib,json,pathlib,subprocess,time
import sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from server import decode
E=ROOT/'evidence'
def invoke(mode,difficulty,actions):
    wire=f'1 {mode} {difficulty} {len(actions)}\n'+''.join(' '.join(map(str,a))+'\n' for a in actions)
    start=time.perf_counter()
    p=subprocess.run([str(ROOT/'out/kingdom')],input=wire,text=True,capture_output=True,timeout=30,check=True)
    return decode(p.stdout),time.perf_counter()-start

def match(name,levels):
    actions=[];side=1;durations=[];turns=[]
    while True:
        data,elapsed=invoke(3,levels[side-1],actions)
        assert len(data['actions'])==len(actions)+1
        actions=data['actions'];durations.append(elapsed)
        turns.append({'side':side,'difficulty':levels[side-1],'nodes':data['state']['nodes']})
        if data['state']['result']:
            break
        side=data['state']['side']
        assert len(actions)<240
    replay,_=invoke(1,levels[1],actions)
    assert replay['tiles']==data['tiles']
    assert {k:v for k,v in replay['state'].items() if k not in ('nodes','depth')}=={k:v for k,v in data['state'].items() if k not in ('nodes','depth')}
    (E/(name+'.json')).write_text(json.dumps({'version':1,'difficulty':levels[1],'actions':actions},indent=2))
    result={'name':name,'levels':levels,'result':data['state']['result'],'turn':data['state']['turn'],'actions':len(actions),'seconds':sum(durations),'max_action_seconds':max(durations),'replay_exact':True,'decisions':turns}
    (E/(name+'-result.json')).write_text(json.dumps(result,indent=2))
    print(json.dumps({k:v for k,v in result.items() if k!='decisions'}),flush=True)
    return result

def main():
    E.mkdir(exist_ok=True)
    results=[]
    for name,levels in [('easy-easy',[0,0]),('hard-easy',[1,0]),('easy-hard',[0,1]),('hard-hard',[1,1])]:
        results.append(match(name,levels))
    malformed=['','1 0 0 0 extra','1 0 0 1 0 0 0','1 0 0 1 1 0 14 4','1 0 0 241','1 0 0 1 2 0 0 4294967296','1 0 0 -1','2 0 0 0','1 0 0 0 '+'0 '*9000]
    for wire in malformed:
        p=subprocess.run([str(ROOT/'out/kingdom')],input=wire,text=True,capture_output=True,timeout=5)
        assert p.returncode==2 and not p.stdout,(wire,p.returncode,p.stdout)
    summary={'status':'passed','complete_matches':[{k:v for k,v in r.items() if k!='decisions'} for r in results],'malformed_cases':len(malformed),'sources':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'src').glob('*.fe')}}
    (E/'matches-summary.json').write_text(json.dumps(summary,indent=2))
if __name__=='__main__':main()
