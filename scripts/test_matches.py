"""Bounded real-engine self-play and parser/replay checks; no host game policy."""
import hashlib,json,pathlib,subprocess,time,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from server import CURRENT_VERSION, decode
E=ROOT/'evidence'

def invoke(mode,difficulty,actions,scenario=0):
    wire=f'{CURRENT_VERSION} {mode} {difficulty} {scenario} {len(actions)}\n'+''.join(' '.join(map(str,a))+'\n' for a in actions)
    start=time.perf_counter()
    p=subprocess.run([str(ROOT/'out/kingdom')],input=wire,text=True,capture_output=True,timeout=30,check=True)
    return decode(p.stdout),time.perf_counter()-start

def match(name,levels,scenario=0,max_actions=24):
    actions=[];side=1;durations=[];turns=[]
    data,_=invoke(1,levels[0],actions,scenario)
    for _ in range(max_actions):
        if data['state']['result'] or data['state']['decisionPending'] or data['state']['traceCapacityReached']:break
        data,elapsed=invoke(3,levels[side-1],actions,scenario)
        assert len(data['actions'])==len(actions)+1
        actions=data['actions'];durations.append(elapsed)
        for tile in data['tiles']:
            assert tile['infantry']+tile['cavalry']+tile['siege']==tile['troops']
            assert min(tile['infantry'],tile['cavalry'],tile['siege'])>=0
        turns.append({'side':side,'difficulty':levels[side-1],'nodes':data['state']['nodes']})
        side=data['state']['side']
    replay,_=invoke(1,levels[1],actions,scenario)
    assert replay['tiles']==data['tiles']
    assert {k:v for k,v in replay['state'].items() if k not in ('nodes','depth')}=={k:v for k,v in data['state'].items() if k not in ('nodes','depth')}
    status='completed' if data['state']['result'] else 'paused'
    reason='game_result' if status=='completed' else 'round_decision' if data['state']['decisionPending'] else 'trace_capacity' if data['state']['traceCapacityReached'] else 'test_action_budget'
    (E/(name+'.json')).write_text(json.dumps({'version':CURRENT_VERSION,'scenario':scenario,'difficulty':levels[1],'actions':actions},indent=2))
    result={'name':name,'scenario':scenario,'levels':levels,'status':status,'stop_reason':reason,'result':data['state']['result'],'turn':data['state']['turn'],'actions':len(actions),'specialist_orders':sum(5<=a[0]<=8 for a in actions),'specialty_orders':sum(a[0]==11 for a in actions),'crossing_orders':sum(a[0]==12 for a in actions),'seconds':sum(durations),'max_action_seconds':max(durations,default=0),'replay_exact':True,'decisions':turns}
    (E/(name+'-result.json')).write_text(json.dumps(result,indent=2))
    print(json.dumps({k:v for k,v in result.items() if k!='decisions'}),flush=True)
    return result

def main():
    E.mkdir(exist_ok=True)
    results=[]
    for name,levels in [('easy-easy',[0,0]),('hard-easy',[1,0]),('easy-hard',[0,1]),('hard-hard',[1,1])]:
        results.append(match(name,levels))
    for scenario in (1,2):results.append(match(f'map-{scenario}-easy-easy',[0,0],scenario))
    malformed=['',f'{CURRENT_VERSION} 0 0 0 0 extra',f'{CURRENT_VERSION} 0 0 0 1 0 0 0',f'{CURRENT_VERSION} 0 0 0 1 1 0 14 4',f'{CURRENT_VERSION} 0 0 0 2049',f'{CURRENT_VERSION} 0 0 0 1 2 0 0 4294967296',f'{CURRENT_VERSION} 0 0 0 -1','99 0 0 0 0',f'{CURRENT_VERSION} 0 0 9 0',f'{CURRENT_VERSION} 1 0 0 0 '+' '*131072]
    for wire in malformed:
        p=subprocess.run([str(ROOT/'out/kingdom')],input=wire,text=True,capture_output=True,timeout=5)
        assert p.returncode==2 and not p.stdout,(wire[:100],p.returncode,p.stdout)
    summary={'status':'passed','bounded_matches':[{k:v for k,v in r.items() if k!='decisions'} for r in results],'malformed_cases':len(malformed),'sources':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'src').glob('*.fe')}}
    (E/'matches-summary.json').write_text(json.dumps(summary,indent=2))
if __name__=='__main__':main()
