"""Real v6 protocol boundaries, replay capacity, and immutable v4 evidence."""
import http.client,json,pathlib,subprocess,sys,threading,unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from server import game,decode,request_text,Handler,ThreadingHTTPServer,MAX_BODY

EXTEND=[9,0,0,0]
DRAW=[10,0,0,0]

def cycle(scenario):
    cap=(15,35,45)[scenario]-1
    return [[1,0,1,3],[1,1,0,3],[1,cap,cap-1,3],[1,cap-1,cap,3]]

def run(actions,scenario=0,mode=1,version=6):
    return game(dict(version=version,scenario=scenario,mode=mode,difficulty=0,actions=actions))

class CampaignTests(unittest.TestCase):
    def test_map_round_boundaries_and_forecasts(self):
        for scenario,limit in enumerate((60,120,180)):
            trace=cycle(scenario)*limit
            before=run(trace[:-1],scenario)
            self.assertEqual(before['state']['completedRounds'],limit-1)
            self.assertEqual(before['state']['decisionPending'],0)
            pending=run(trace,scenario)
            self.assertEqual(pending['version'],6)
            self.assertEqual(pending['map']['baseRoundLimit'],limit)
            self.assertEqual(pending['map']['extensionRounds'],20)
            self.assertEqual(pending['map']['traceCapacity'],2048)
            self.assertEqual([pending['state'][k] for k in ('side','orders','turn','result','completedRounds','roundLimit','decisionPending')],[2,0,limit*2,0,limit,limit,1])
            self.assertEqual(pending['legal'],[EXTEND,DRAW])
            # Native automation pauses instead of choosing the human's continuation.
            automatic=run(trace,scenario,mode=0)
            self.assertEqual(automatic['actions'],trace)
            self.assertEqual(automatic['state']['result'],0)
            for mode in (2,3):
                wire=request_text(dict(version=6,scenario=scenario,mode=1,difficulty=0,actions=trace)).replace('6 1 ',f'6 {mode} ',1)
                native=subprocess.run([str(ROOT/'out/kingdom')],input=wire,text=True,capture_output=True,check=True,timeout=30)
                self.assertEqual(decode(native.stdout)['actions'],trace)
            for action,forecast in zip(pending['legal'],pending['previews']):
                after=run(trace+[action],scenario)
                self.assertEqual(forecast['nextSide'],after['state']['side'])
                self.assertEqual(forecast['nextOrders'],after['state']['orders'])
                self.assertEqual(forecast['result'],after['state']['result'])
                self.assertEqual(forecast['food1After'],after['economy'][0]['food'])
                self.assertEqual(forecast['food2After'],after['economy'][1]['food'])
                for side,color in ((1,'blue'),(2,'red')):
                    self.assertEqual(forecast[color+'ConnectedAfter'],after['supply'][side-1]['connectedOwned'])
                    self.assertEqual(forecast[color+'CutOffAfter'],after['supply'][side-1]['cutOffOwned'])
            extended=run(trace+[EXTEND],scenario)
            self.assertEqual([extended['state'][k] for k in ('side','orders','turn','result','completedRounds','roundLimit','decisionPending')],[1,2,limit*2+1,0,limit,limit+20,0])
            self.assertEqual(extended['economy'][0]['food'],pending['economy'][0]['projectedFood'])
            drawn=run(trace+[DRAW],scenario)
            self.assertEqual(drawn['state']['result'],3)
            self.assertEqual(drawn['tiles'],pending['tiles'])
            self.assertEqual(drawn['economy'],pending['economy'])
            self.assertFalse(drawn['legal'])
            next_boundary=run(trace+[EXTEND]+cycle(scenario)*20,scenario)
            self.assertEqual(next_boundary['state']['decisionPending'],1)
            self.assertEqual(next_boundary['state']['completedRounds'],limit+20)
            with self.assertRaises(ValueError):run(trace+[cycle(scenario)[0]],scenario)
            with self.assertRaises(ValueError):run(trace+[DRAW,EXTEND],scenario)
        for action in (EXTEND,DRAW,[9,0,0,20],[10,1,0,0]):
            with self.assertRaises(ValueError):run([action])

    def test_long_replay_and_capacity_is_unfinished(self):
        trace=cycle(0)*60
        while len(trace)<2048:
            trace+=[EXTEND]
            trace+=cycle(0)*20
        trace=trace[:2048]
        data=run(trace)
        self.assertEqual(data['actions'],trace)
        self.assertEqual(data['state']['result'],0)
        self.assertEqual(data['state']['traceCapacityReached'],1)
        self.assertEqual(data['legal'],[])
        self.assertEqual(data['previews'],[])
        frozen=run(trace,version=5)
        self.assertEqual(frozen['actions'],trace)
        self.assertEqual(frozen['state']['result'],0)
        self.assertEqual(frozen['state']['traceCapacityReached'],1)
        self.assertFalse(frozen['legal'])
        self.assertFalse(frozen['previews'])
        with self.assertRaises(ValueError):run(trace,mode=0,version=5)
        with self.assertRaises(ValueError):run(trace+[[0,0,0,0]],version=5)
        self.assertEqual(run(trace,mode=0)['actions'],trace)
        before=run(trace[:-1])
        self.assertEqual(before['state']['traceCapacityReached'],0)
        self.assertIn(trace[-1],before['legal'])
        with self.assertRaises(ValueError):run(trace+[[0,0,0,0]])
        self.assertEqual(request_text(dict(version=6,mode=1,difficulty=0,actions=trace)).splitlines()[0],'6 1 0 0 2048')
        # A body above the old 32KiB ceiling still transports a real long replay.
        server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        connection=http.client.HTTPConnection('127.0.0.1',server.server_port,timeout=30)
        try:
            body=json.dumps(dict(version=6,mode=1,difficulty=0,actions=trace),indent=2)
            self.assertGreater(len(body),32768)
            self.assertLess(len(body),MAX_BODY)
            connection.request('POST','/api/game',body,{'Content-Type':'application/json'})
            response=connection.getresponse();result=json.loads(response.read())
            self.assertEqual(response.status,200,result)
            self.assertEqual(result['state']['traceCapacityReached'],1)
            connection.request('POST','/api/game',' '*(MAX_BODY+1),{'Content-Type':'application/json'})
            response=connection.getresponse();response.read();self.assertEqual(response.status,400)
        finally:
            connection.close();server.shutdown();server.server_close();thread.join()

    def test_frozen_v5_exact_campaign_checkpoints(self):
        for name in ('win','pending','extended'):
            fixture=json.loads((ROOT/f'tests/fixtures/legacy-v5-{name}.json').read_text())
            expected=json.loads((ROOT/f'tests/fixtures/legacy-v5-{name}-expected.json').read_text())
            actual=game(dict(fixture,mode=1))
            self.assertEqual(actual,expected)
            self.assertIn('baseRoundLimit',actual['map'])
            self.assertNotIn('maxTurns',actual['map'])
            with self.assertRaises(ValueError):game(dict(fixture,mode=0))

    def test_exact_legacy_v4_outcomes_and_forbidden_continuation(self):
        for name,result,turn,count in [('win',1,35,69),('timeout',3,121,240)]:
            fixture=json.loads((ROOT/f'tests/fixtures/legacy-v4-{name}.json').read_text())
            old=game(dict(fixture,mode=1))
            self.assertEqual((old['version'],old['state']['result'],old['state']['turn'],len(old['actions'])),(4,result,turn,count))
            self.assertEqual(old['actions'],fixture['actions'])
            self.assertFalse(old['legal'])
            with self.assertRaises(ValueError):game(dict(fixture,mode=0))
            for action in (EXTEND,DRAW):
                with self.assertRaises(ValueError):run([action],version=4)
        winning=json.loads((ROOT/'tests/fixtures/legacy-v4-win.json').read_text())
        new=game(dict(winning,version=5,mode=1))
        self.assertEqual(new['state']['result'],1)
        self.assertEqual(new['state']['decisionPending'],0)
        passed=run([[0,0,0,0]]*4)
        self.assertEqual(passed['state']['result'],3)
        self.assertEqual(passed['state']['decisionPending'],0)

if __name__=='__main__':unittest.main()
