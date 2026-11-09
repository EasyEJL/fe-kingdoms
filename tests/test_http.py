import json
import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from server import request_text, decode, game, Handler, ThreadingHTTPServer
import threading
import http.client


class AdapterTests(unittest.TestCase):
    def test_protocol_serialization(self):
        self.assertEqual(request_text({'version':5,'mode': 0, 'difficulty': 1, 'actions': [[1, 0, 1, 3]]}), '5 0 1 0 1\n1 0 1 3\n')

    def test_transport_rejects_invalid_shapes(self):
        cases = [None, {}, {'difficulty': True, 'actions': []}, {'difficulty': 0, 'actions': [[1, 0, 1]]}, {'difficulty': 0, 'actions': [[1, 0, 1, -1]]}, {'difficulty': 0, 'actions': [[1, 0, 1, True]]}, {'difficulty': 0, 'actions': [[0, 0, 0, 0]]*2049}, {'difficulty': 0, 'actions': [], 'shell': 'x'}]
        for data in cases:
            with self.subTest(data=data):
                with self.assertRaises(ValueError): request_text(dict(version=5, mode=1, **data) if isinstance(data, dict) else data)

    def test_decoder_rejects_incomplete_output(self):
        with self.assertRaises(RuntimeError): decode('0 4 0 0\n')

    def test_http_transport_guards(self):
        server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        worker = threading.Thread(target=server.serve_forever, daemon=True)
        worker.start()
        try:
            connection = http.client.HTTPConnection('127.0.0.1', server.server_port, timeout=5)
            connection.request('GET', '/')
            response = connection.getresponse()
            self.assertEqual(response.status, 200)
            self.assertIn(b'Fe Kingdoms', response.read())
            connection.request('POST', '/api/game', body='{}', headers={'Content-Type': 'application/json', 'Origin': 'https://malicious.example'})
            response = connection.getresponse()
            self.assertEqual(response.status, 403)
            response.read()
            connection.request('POST', '/api/game', body='{}', headers={'Content-Type': 'application/json'})
            response = connection.getresponse()
            self.assertEqual(response.status, 400)
            response.read()
            connection.request('GET', '/../server.py')
            response = connection.getresponse()
            self.assertEqual(response.status, 404)
            response.read()
            connection.close()
        finally:
            server.shutdown()
            server.server_close()
            worker.join()

    def test_native_roundtrip_and_replay(self):
        for difficulty in (0, 1):
            start = game({'version':5,'mode': 0, 'difficulty': difficulty, 'actions': []})
            self.assertEqual(start['state']['side'], 1)
            self.assertEqual(len(start['tiles']), 15)
            self.assertTrue(start['legal'])
            # The end-turn order is supplied by Fe, not recreated by the host.
            end = next(a for a in start['legal'] if a[0] == 0)
            after = game({'version':5,'mode': 0, 'difficulty': difficulty, 'actions': [end]})
            self.assertGreater(len(after['actions']), 1)
            self.assertIn(after['state']['side'], (1, 2))
            self.assertTrue(after['state']['result'] or after['state']['side'] == 1)
            replay = game({'version':5,'mode': 1, 'difficulty': difficulty, 'actions': after['actions']})
            self.assertEqual(after['tiles'], replay['tiles'])
            self.assertEqual(after['actions'], replay['actions'])
            for field in ('side','orders','turn','result','gold1','gold2','quiet'):
                self.assertEqual(after['state'][field], replay['state'][field])

    def test_explicit_two_order_handoff(self):
        for difficulty in (0, 1):
            start = game({'version':5,'mode': 1, 'difficulty': difficulty, 'actions': []})
            recruit = next(a for a in start['legal'] if a == [2,0,0,2])
            first = game({'version':5,'mode':1,'difficulty':difficulty,'actions':[recruit]})
            self.assertEqual((first['state']['side'],first['state']['orders'],len(first['actions'])),(1,1,1))
            second = game({'version':5,'mode':1,'difficulty':difficulty,'actions':[recruit,recruit]})
            self.assertEqual((second['state']['side'],second['state']['orders'],len(second['actions'])),(2,2,2))
            # Only this explicit request gives the computer its turn.
            returned = game({'version':5,'mode':0,'difficulty':difficulty,'actions':second['actions']})
            self.assertEqual((returned['state']['side'],returned['state']['orders']),(1,2))
            self.assertGreater(len(returned['actions']),2)

    def test_fe_previews_match_actual_results(self):
        for trace in (
            [], [[1,0,5,5]], [[2,0,0,2],[2,0,0,2]],
            # Upgrade a starting village, cycle turns, then create a mixed army.
            [[4,5,5,2],[1,0,5,3],[0,0,0,0],[1,0,1,1],[0,0,0,0],[0,0,0,0],[6,5,5,1]],
            [[4,5,5,2],[1,0,5,3],[0,0,0,0],[7,5,5,1]],
        ):
            start=game({'version':5,'mode':1,'difficulty':0,'actions':trace})
            self.assertEqual(len(start['previews']),len(start['legal']))
            for action,preview in zip(start['legal'],start['previews']):
                after=game({'version':5,'mode':1,'difficulty':0,'actions':trace+[action]})
                self.assertEqual(preview['sourceTroops'],after['tiles'][action[1]]['troops'])
                self.assertEqual(preview['targetTroops'],after['tiles'][action[2]]['troops'])
                self.assertEqual(preview['targetOwner'],after['tiles'][action[2]]['owner'])
                for role in ('Infantry','Cavalry','Siege'):
                    self.assertEqual(preview['source'+role],after['tiles'][action[1]][role.lower()])
                    self.assertEqual(preview['target'+role],after['tiles'][action[2]][role.lower()])
                for pkey,skey in [('nextSide','side'),('nextOrders','orders'),('result','result')]:
                    self.assertEqual(preview[pkey],after['state'][skey])
                side=start['state']['side']
                self.assertEqual(preview['foodCost'],start['economy'][side-1]['food']-after['economy'][side-1]['food'])
                self.assertEqual(preview['food1After'],after['economy'][0]['food'])
                self.assertEqual(preview['food2After'],after['economy'][1]['food'])
                self.assertEqual(preview['settlementAfter'],after['tiles'][action[2]]['settlement'])
                field='gold'+str(start['state']['side'])
                self.assertEqual(preview['cost'],start['state'][field]-after['state'][field])
        start=game({'version':5,'mode':1,'difficulty':0,'actions':[]})
        attack=start['legal'].index([1,1,6,1])
        self.assertEqual(start['previews'][attack]['outcome'],3)
        self.assertEqual(start['previews'][attack]['targetTroops'],1)
        prepared=game({'version':5,'mode':1,'difficulty':0,'actions':[[1,0,5,5]]})
        capture=prepared['legal'].index([1,5,6,5])
        self.assertEqual(prepared['previews'][capture]['outcome'],2)
        self.assertEqual(prepared['previews'][capture]['targetTroops'],4)

    def test_legacy_replay_readonly(self):
        for version,winner in ((1,1),(2,2),(3,1),(4,1)):
            fixture=json.loads((Path(__file__).parent/f'fixtures/legacy-v{version}-win.json').read_text())
            legacy=game(dict(fixture,mode=1))
            self.assertEqual(legacy['version'],version)
            self.assertEqual(legacy['map']['topology'],0 if version==1 else 1)
            self.assertEqual(legacy['state']['result'],winner)
            with self.assertRaises(ValueError): game(dict(fixture,mode=0))

    def test_campaign_sizes_and_economy(self):
        for scenario,count,width,height in ((0,15,5,3),(1,35,7,5),(2,45,9,5)):
            initial=game(dict(version=5,scenario=scenario,mode=1,difficulty=0,actions=[]))
            self.assertEqual((initial['map']['count'],initial['map']['width'],initial['map']['height']),(count,width,height))
            self.assertEqual(len(initial['tiles']),count)
            self.assertEqual([e['side'] for e in initial['economy']],[1,2])
            self.assertEqual(initial['economy'][0]['food'],12)
            self.assertTrue(any(not t['passable'] for t in initial['tiles']))
            self.assertTrue(any(t['terrain']==7 for t in initial['tiles']))
            for action in initial['legal']:
                if action[0]==1:self.assertTrue(initial['tiles'][action[2]]['passable'])

    def test_next_turn_food_projection(self):
        for scenario in (0,1,2):
            before=game(dict(version=5,scenario=scenario,mode=1,difficulty=0,actions=[]))
            after=game(dict(version=5,scenario=scenario,mode=1,difficulty=0,actions=[[0,0,0,0]]))
            self.assertEqual(before['economy'][1]['projectedFood'],after['economy'][1]['food'])

    def test_infantry_only_v3_replay_equivalence(self):
        fixture=json.loads((Path(__file__).parent/'fixtures/legacy-v3-win.json').read_text())
        records=fixture['actions']
        for length in list(range(0,len(records),8))+[len(records)]:
            old=game(dict(fixture,mode=1,actions=records[:length]))
            new=game(dict(fixture,version=4,mode=1,actions=records[:length]))
            self.assertEqual(old['state'],new['state'])
            self.assertEqual(old['economy'],new['economy'])
            for previous,current in zip(old['tiles'],new['tiles']):
                self.assertEqual(previous,{k:current[k] for k in previous})
                self.assertEqual(current['infantry'],current['troops'])
                self.assertEqual((current['cavalry'],current['siege']),(0,0))

    def test_native_rejects_illegal_move(self):
        with self.assertRaises(ValueError):
            game({'version':5,'mode': 0, 'difficulty': 0, 'actions': [[1, 14, 0, 99]]})


if __name__ == '__main__':
    unittest.main()
