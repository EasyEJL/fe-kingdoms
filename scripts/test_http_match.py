"""Verify a complete saved Fe match through the actual local HTTP transport."""
import http.client,json,pathlib,sys,threading
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from server import Handler,ThreadingHTTPServer
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
connection=http.client.HTTPConnection('127.0.0.1',server.server_port,timeout=30)
def request(actions,mode=1):
    connection.request('POST','/api/game',json.dumps({'version':5,'mode':mode,'difficulty':0,'actions':actions}),{'Content-Type':'application/json'})
    response=connection.getresponse();payload=json.loads(response.read())
    assert response.status==200,payload
    return payload
try:
    expected=json.loads((ROOT/'tests/fixtures/legacy-v4-win.json').read_text())['actions']
    game=request([]);requests=1
    while game['state']['result']==0:
        assert game['state']['side']==1
        next_action=expected[len(game['actions'])]
        previous=len(game['actions'])
        game=request(game['actions']+[next_action]);requests+=1
        assert len(game['actions'])==previous+1, 'A human order must not automatically run Red.'
        assert game['actions']==expected[:len(game['actions'])]
        if game['state']['side']==2 and not game['state']['result']:
            game=request(game['actions'],0);requests+=1
            assert game['state']['side']==1 or game['state']['result']
        assert game['actions']==expected[:len(game['actions'])]
    expected_result=1
    assert game['state']['result']==expected_result and game['actions']==expected
    evidence={'status':'passed','http_requests':requests,'actions':len(expected),'result':game['state']['result'],'explicit_computer_handoff':True,'browser_verified':False,'human_playtest':False}
    (ROOT/'evidence/http-full-match.json').write_text(json.dumps(evidence,indent=2))
    print(json.dumps(evidence))
finally:
    connection.close();server.shutdown();server.server_close();thread.join()
