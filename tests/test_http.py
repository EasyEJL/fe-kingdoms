import json
import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from server import CURRENT_VERSION, request_text, decode, game, Handler, ThreadingHTTPServer
import threading
import http.client
import subprocess


class AdapterTests(unittest.TestCase):
    def test_protocol_serialization(self):
        self.assertEqual(request_text({'version':CURRENT_VERSION,'mode': 0, 'difficulty': 1, 'actions': [[1, 0, 1, 3]]}), f'{CURRENT_VERSION} 0 1 0 1\n1 0 1 3\n')

    def test_transport_rejects_invalid_shapes(self):
        cases = [None, {}, {'difficulty': True, 'actions': []}, {'difficulty': 0, 'actions': [[1, 0, 1]]}, {'difficulty': 0, 'actions': [[1, 0, 1, -1]]}, {'difficulty': 0, 'actions': [[1, 0, 1, True]]}, {'difficulty': 0, 'actions': [[0, 0, 0, 0]]*2049}, {'difficulty': 0, 'actions': [], 'shell': 'x'}]
        for data in cases:
            with self.subTest(data=data):
                with self.assertRaises(ValueError): request_text(dict(version=CURRENT_VERSION, mode=1, **data) if isinstance(data, dict) else data)

    def test_decoder_rejects_incomplete_output(self):
        with self.assertRaises(RuntimeError): decode('0 4 0 0\n')

    def test_decoder_requires_current_supply_metadata(self):
        root=Path(__file__).resolve().parents[1]
        output=subprocess.run([str(root/'out/kingdom')],input=f'{CURRENT_VERSION} 1 0 0 0\n',text=True,capture_output=True,check=True).stdout
        parsed=decode(output)
        self.assertEqual(len(parsed['supply']),2)
        for malformed in (
            '\n'.join(line for line in output.splitlines() if not line.startswith('8 ')),
            '\n'.join(' '.join(line.split()[:-4]) if line.startswith('5 ') else line for line in output.splitlines()),
            output.replace('8 2 ','8 1 ',1),
        ):
            with self.assertRaises(RuntimeError):decode(malformed)

    def test_decoder_requires_version_specific_field_widths(self):
        root=Path(__file__).resolve().parents[1]
        for version in range(1,CURRENT_VERSION+1):
            name='kingdom' if version==CURRENT_VERSION else f'kingdom-v{version}'
            wire=request_text(dict(version=version,mode=1,difficulty=0,actions=[]))
            output=subprocess.run([str(root/'out'/name)],input=wire,text=True,capture_output=True,check=True).stdout
            parsed=decode(output)
            self.assertEqual(len(parsed['tiles'][0]),{1:8,2:8,3:11,4:14,5:14,6:14,7:18}[version])
            self.assertEqual(len(parsed['previews'][0]),{1:10,2:10,3:14,4:24,5:24,6:28,7:32}[version])
            self.assertEqual('defense' in parsed['tiles'][0],version>=7)
            self.assertEqual('orderCost' in parsed['previews'][0],version>=7)
            for tag in ('2 ','5 '):
                for delta in (-1,1):
                    lines=output.splitlines()
                    index=next(i for i,line in enumerate(lines) if line.startswith(tag))
                    lines[index]=' '.join(lines[index].split()[:-1]) if delta<0 else lines[index]+' 0'
                    with self.assertRaises(RuntimeError):decode('\n'.join(lines))

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
            start = game({'version':CURRENT_VERSION,'mode': 0, 'difficulty': difficulty, 'actions': []})
            self.assertEqual(start['state']['side'], 1)
            self.assertEqual(len(start['tiles']), 15)
            self.assertTrue(start['legal'])
            # The end-turn order is supplied by Fe, not recreated by the host.
            end = next(a for a in start['legal'] if a[0] == 0)
            after = game({'version':CURRENT_VERSION,'mode': 0, 'difficulty': difficulty, 'actions': [end]})
            self.assertGreater(len(after['actions']), 1)
            self.assertIn(after['state']['side'], (1, 2))
            self.assertTrue(after['state']['result'] or after['state']['side'] == 1)
            replay = game({'version':CURRENT_VERSION,'mode': 1, 'difficulty': difficulty, 'actions': after['actions']})
            self.assertEqual(after['tiles'], replay['tiles'])
            self.assertEqual(after['actions'], replay['actions'])
            for field in ('side','orders','turn','result','gold1','gold2','quiet'):
                self.assertEqual(after['state'][field], replay['state'][field])

    def test_explicit_two_order_handoff(self):
        for difficulty in (0, 1):
            start = game({'version':CURRENT_VERSION,'mode': 1, 'difficulty': difficulty, 'actions': []})
            recruit = next(a for a in start['legal'] if a == [2,0,0,2])
            first = game({'version':CURRENT_VERSION,'mode':1,'difficulty':difficulty,'actions':[recruit]})
            self.assertEqual((first['state']['side'],first['state']['orders'],len(first['actions'])),(1,1,1))
            second = game({'version':CURRENT_VERSION,'mode':1,'difficulty':difficulty,'actions':[recruit,recruit]})
            self.assertEqual((second['state']['side'],second['state']['orders'],len(second['actions'])),(2,2,2))
            # Only this explicit request gives the computer its turn.
            returned = game({'version':CURRENT_VERSION,'mode':0,'difficulty':difficulty,'actions':second['actions']})
            self.assertEqual((returned['state']['side'],returned['state']['orders']),(1,2))
            self.assertGreater(len(returned['actions']),2)

    def test_fe_previews_match_actual_results(self):
        for trace in (
            [], [[1,0,5,5]], [[2,0,0,2],[2,0,0,2]],
            # Upgrade a starting village, cycle turns, then create a mixed army.
            [[4,5,5,2],[1,0,5,3],[0,0,0,0],[1,0,1,1],[0,0,0,0],[0,0,0,0],[6,5,5,1]],
            [[4,5,5,2],[1,0,5,3],[0,0,0,0],[7,5,5,1]],
            # A fresh turn exposes two-order mixed-army movements.
            [[4,5,5,2],[1,0,5,3],[0,0,0,0],[7,5,5,1],[0,0,0,0],[0,0,0,0]],
        ):
            start=game({'version':CURRENT_VERSION,'mode':1,'difficulty':0,'actions':trace})
            self.assertEqual(len(start['previews']),len(start['legal']))
            for action,preview in zip(start['legal'],start['previews']):
                after=game({'version':CURRENT_VERSION,'mode':1,'difficulty':0,'actions':trace+[action]})
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
                for side,color in ((1,'blue'),(2,'red')):
                    self.assertEqual(preview[color+'ConnectedAfter'],after['supply'][side-1]['connectedOwned'])
                    self.assertEqual(preview[color+'CutOffAfter'],after['supply'][side-1]['cutOffOwned'])
                self.assertEqual(preview['settlementAfter'],after['tiles'][action[2]]['settlement'])
                for field in ('specialty','terrain','passable'):
                    self.assertEqual(preview['target'+field.capitalize()],after['tiles'][action[2]][field])
                if action[0]==1 and start['tiles'][action[2]]['owner']!=start['state']['side']:
                    self.assertEqual(preview['defense'],start['tiles'][action[2]]['defense'])
                if not after['state']['result']:
                    remaining=after['state']['orders'] if after['state']['side']==start['state']['side'] else 0
                    self.assertEqual(preview['orderCost'],start['state']['orders']-remaining)
                field='gold'+str(start['state']['side'])
                self.assertEqual(preview['cost'],start['state'][field]-after['state'][field])
        start=game({'version':CURRENT_VERSION,'mode':1,'difficulty':0,'actions':[]})
        attack=start['legal'].index([1,1,6,1])
        self.assertEqual(start['previews'][attack]['outcome'],3)
        self.assertEqual(start['previews'][attack]['targetTroops'],1)
        prepared=game({'version':CURRENT_VERSION,'mode':1,'difficulty':0,'actions':[[1,0,5,5]]})
        capture=prepared['legal'].index([1,5,6,5])
        self.assertEqual(prepared['previews'][capture]['outcome'],2)
        self.assertEqual(prepared['previews'][capture]['targetTroops'],3)

    def test_forest_opening_and_two_order_moves(self):
        opening=[[1,0,1,5],[1,1,6,7]]
        first=game(dict(version=CURRENT_VERSION,mode=1,difficulty=0,actions=opening[:1]))
        self.assertEqual(first['tiles'][6]['terrain'],10)
        preview=first['previews'][first['legal'].index(opening[1])]
        self.assertEqual((preview['defense'],preview['orderCost'],preview['outcome']),(2,1,2))
        after=game(dict(version=CURRENT_VERSION,mode=1,difficulty=0,actions=opening))
        self.assertEqual((after['tiles'][6]['owner'],after['tiles'][6]['troops']),(1,5))
        trace=[[4,5,5,2],[1,0,5,3],[0,0,0,0],[1,0,1,1],[0,0,0,0],[0,0,0,0],[6,5,5,1],[0,0,0,0],[0,0,0,0]]
        start=game(dict(version=CURRENT_VERSION,mode=1,difficulty=0,actions=trace))
        heavy=[(a,p) for a,p in zip(start['legal'],start['previews']) if a[0]==1 and p['movingSiege']]
        self.assertTrue(heavy)
        for action,preview in heavy:
            self.assertEqual(preview['orderCost'],2)
            after=game(dict(version=CURRENT_VERSION,mode=1,difficulty=0,actions=trace+[action]))
            self.assertEqual(after['state']['side'],2)
        spent=game(dict(version=CURRENT_VERSION,mode=1,difficulty=0,actions=trace+[[3,0,0,1]]))
        self.assertEqual(spent['state']['orders'],1)
        self.assertFalse(any(a[0]==1 and p['movingSiege'] for a,p in zip(spent['legal'],spent['previews'])))

    def test_frozen_v6_win_supply_forecasts(self):
        fixture=json.loads((Path(__file__).parent/'fixtures/current-v6-win.json').read_text())
        actions=fixture['actions']
        captures=0
        for index,action in enumerate(actions):
            if action[0]!=1:continue
            before=game(dict(fixture,mode=1,actions=actions[:index]))
            if before['tiles'][action[2]]['terrain']!=9 and index%8!=0 and index!=len(actions)-1:continue
            preview=before['previews'][before['legal'].index(action)]
            after=game(dict(fixture,mode=1,actions=actions[:index+1]))
            if before['tiles'][action[2]]['terrain']==9 and preview['outcome']==2:captures+=1
            for side,color in ((1,'blue'),(2,'red')):
                self.assertEqual(preview[color+'ConnectedAfter'],after['supply'][side-1]['connectedOwned'])
                self.assertEqual(preview[color+'CutOffAfter'],after['supply'][side-1]['cutOffOwned'])
        self.assertGreater(captures,0,'The full win must exercise a river bridge capture.')

    def test_town_specialty_forecasts_and_permanent_choice(self):
        def at(actions):
            return game(dict(version=CURRENT_VERSION,mode=1,difficulty=0,actions=actions))
        trace=[[4,5,5,2],[1,0,5,3],[0,0,0,0],[1,0,1,1],[0,0,0,0],[0,0,0,0]]
        before=at(trace)
        self.assertEqual((before['tiles'][5]['settlement'],before['tiles'][5]['supplied']),(2,1))
        for specialty in (1,2):
            action=[11,5,5,specialty]
            self.assertIn(action,before['legal'])
            preview=before['previews'][before['legal'].index(action)]
            after=at(trace+[action])
            self.assertEqual((preview['outcome'],preview['cost'],preview['foodCost'],preview['orderCost']),(7,6,2,1))
            self.assertEqual(preview['targetSpecialty'],specialty)
            for key,field in (('targetSpecialty','specialty'),('targetTerrain','terrain'),('targetPassable','passable'),('settlementAfter','settlement')):
                self.assertEqual(preview[key],after['tiles'][5][field])
            self.assertEqual(preview['cost'],before['state']['gold1']-after['state']['gold1'])
            self.assertEqual(preview['foodCost'],before['economy'][0]['food']-after['economy'][0]['food'])
            self.assertEqual(preview['nextOrders'],after['state']['orders'])
            self.assertEqual(after['tiles'][5]['specialty'],specialty)
            self.assertFalse(any(a[0]==11 and a[1]==5 for a in after['legal']))
            for replacement in (1,2):
                with self.assertRaises(ValueError):at(trace+[action,[11,5,5,replacement]])
            red=at(trace+[action,[0,0,0,0]])
            next_turn=at(trace+[action,[0,0,0,0],[0,0,0,0]])
            self.assertEqual(red['economy'][0]['projectedFood'],next_turn['economy'][0]['food'])
            self.assertEqual(next_turn['tiles'][5]['specialty'],specialty)
            if specialty==1:
                self.assertEqual(after['economy'][0]['foodProduction'],before['economy'][0]['foodProduction']+2)
            else:
                ordinary=at(trace+[[3,0,0,1],[0,0,0,0],[0,0,0,0]])
                for kind in (5,6,7,8):
                    unit=[kind,5,5,1]
                    standard=ordinary['previews'][ordinary['legal'].index(unit)]
                    discount=next_turn['previews'][next_turn['legal'].index(unit)]
                    self.assertEqual(discount['cost'],standard['cost']-1)
                    self.assertEqual(discount['foodCost'],standard['foodCost'])
                    applied=at(trace+[action,[0,0,0,0],[0,0,0,0],unit])
                    self.assertEqual(discount['cost'],next_turn['state']['gold1']-applied['state']['gold1'])
                    self.assertEqual(discount['targetSpecialty'],applied['tiles'][5]['specialty'])
        self.assertFalse(any(a[0]==11 for a in at([])['legal']))
        for illegal in ([11,5,0,1],[11,5,5,3],[11,0,0,1]):
            with self.assertRaises(ValueError):at(trace+[illegal])

    def test_legacy_replay_readonly(self):
        for version,winner in ((1,1),(2,2),(3,1),(4,1),(5,1),(6,1)):
            filename=f'legacy-v{version}-win.json' if version<6 else 'current-v6-win.json'
            fixture=json.loads((Path(__file__).parent/'fixtures'/filename).read_text())
            legacy=game(dict(fixture,mode=1))
            self.assertEqual(legacy['version'],version)
            self.assertEqual(legacy['map']['topology'],0 if version==1 else 1)
            self.assertEqual(legacy['state']['result'],winner)
            with self.assertRaises(ValueError): game(dict(fixture,mode=0))

    def test_captured_town_keeps_native_specialty_forecast(self):
        # Both sides advance through the forests, then Red captures Blue's
        # newly specialized town. Every setup order is replayed by native Fe.
        setup=[[1,0,1,5],[1,1,6,7],[1,14,13,5],[1,13,8,7],
               [4,6,6,2],[1,6,5,4],[1,8,7,4],[2,8,8,2]]
        for specialty in (1,2):
            trace=setup+[[11,6,6,specialty],[0,0,0,0],[1,8,7,2]]
            before=game(dict(version=CURRENT_VERSION,mode=1,difficulty=0,actions=trace))
            self.assertEqual((before['tiles'][6]['owner'],before['tiles'][6]['specialty']),(1,specialty))
            action=[1,7,6,3]
            preview=before['previews'][before['legal'].index(action)]
            after=game(dict(version=CURRENT_VERSION,mode=1,difficulty=0,actions=trace+[action]))
            self.assertEqual((preview['outcome'],preview['targetOwner'],preview['targetSpecialty']),(2,2,specialty))
            self.assertEqual((after['tiles'][6]['owner'],after['tiles'][6]['specialty']),(2,specialty))
            self.assertEqual(preview['targetTroops'],after['tiles'][6]['troops'])
            self.assertEqual(preview['settlementAfter'],after['tiles'][6]['settlement'])
            for side,color in enumerate(('blue','red')):
                self.assertEqual(preview[color+'ConnectedAfter'],after['supply'][side]['connectedOwned'])
                self.assertEqual(preview[color+'CutOffAfter'],after['supply'][side]['cutOffOwned'])

    def test_campaign_sizes_and_economy(self):
        for scenario,count,width,height in ((0,15,5,3),(1,35,7,5),(2,45,9,5)):
            initial=game(dict(version=CURRENT_VERSION,scenario=scenario,mode=1,difficulty=0,actions=[]))
            self.assertEqual((initial['map']['count'],initial['map']['width'],initial['map']['height']),(count,width,height))
            self.assertEqual(len(initial['tiles']),count)
            self.assertEqual([e['side'] for e in initial['economy']],[1,2])
            self.assertEqual(initial['economy'][0]['food'],12)
            self.assertTrue(any(not t['passable'] for t in initial['tiles']))
            self.assertTrue(any(t['terrain']==8 for t in initial['tiles']))
            self.assertTrue(any(t['terrain']==9 for t in initial['tiles']))
            self.assertTrue(all(t['passable']==0 for t in initial['tiles'] if t['terrain']==8))
            self.assertTrue(all(t['passable']==1 for t in initial['tiles'] if t['terrain']==9))
            self.assertEqual([s['side'] for s in initial['supply']],[1,2])
            for side in (1,2):
                owned=[t for t in initial['tiles'] if t['owner']==side]
                self.assertEqual(initial['supply'][side-1]['connectedOwned'],sum(t['supplied'] for t in owned))
                self.assertEqual(initial['supply'][side-1]['cutOffOwned'],sum(not t['supplied'] for t in owned))
            for action in initial['legal']:
                if action[0]==1:self.assertTrue(initial['tiles'][action[2]]['passable'])

    def test_crossing_designations_construction_and_invalid_orders(self):
        def at(actions,scenario=0):
            return game(dict(version=CURRENT_VERSION,scenario=scenario,mode=1,difficulty=0,actions=actions))
        for scenario in (0,1,2):
            initial=at([],scenario)
            width,height=initial['map']['width'],initial['map']['height']
            sites=[tile['index'] for tile in initial['tiles'] if tile['crossingSite']]
            self.assertEqual(sites,[width//2,(height-1)*width+width//2])
            for index in sites:
                tile=initial['tiles'][index]
                self.assertEqual((tile['terrain'],tile['passable'],tile['constructedBridge']),(8,0,0))
        for trace,bank,target,side in (([],1,2,1),([[0,0,0,0]],13,12,2)):
            before=at(trace)
            action=[12,bank,target,1]
            preview=before['previews'][before['legal'].index(action)]
            after=at(trace+[action])
            tile=after['tiles'][target]
            self.assertEqual((preview['outcome'],preview['cost'],preview['foodCost'],preview['orderCost']),(8,6,2,1))
            self.assertEqual((tile['crossingSite'],tile['constructedBridge'],tile['terrain'],tile['passable']),(1,1,9,1))
            self.assertEqual((tile['owner'],tile['troops'],tile['defense'],tile['supplied']),(0,0,0,0))
            self.assertEqual((after['state']['side'],after['state']['orders']),(side,1))
            self.assertEqual(preview['cost'],before['state'][f'gold{side}']-after['state'][f'gold{side}'])
            self.assertEqual(preview['foodCost'],before['economy'][side-1]['food']-after['economy'][side-1]['food'])
            for key,field in (('targetOwner','owner'),('targetTroops','troops'),('targetTerrain','terrain'),('targetPassable','passable')):
                self.assertEqual(preview[key],tile[field])
            self.assertEqual(before['supply'],after['supply'],'A neutral bridge does not grant supply ownership.')
            with self.assertRaises(ValueError):at(trace+[action,action])
        for illegal in ([12,1,6,1],[12,1,12,1],[12,0,2,1],[12,1,2,2],[12,13,12,1]):
            with self.assertRaises(ValueError):at([illegal])
        with self.assertRaises(ValueError):at([[2,0,0,2],[12,1,2,1]])
        # An owned, supplied fixed bridge is not a land bank.
        bridge_bank=[[1,0,1,5],[1,1,6,7],[0,0,0,0],[1,6,7,4]]
        bank=at(bridge_bank)['tiles'][7]
        self.assertEqual((bank['owner'],bank['supplied'],bank['terrain']),(1,1,9))
        with self.assertRaises(ValueError):at(bridge_bank+[[12,7,2,1]])

    def test_constructed_bridge_is_shared_and_empty_until_occupied(self):
        build=[12,1,2,1]
        # Blue may occupy its own work immediately, or Red may reach it first.
        for trace,action,side in (
            ([build],[1,1,2,2],1),
            ([build,[0,0,0,0],[1,14,13,5],[1,13,8,7],[0,0,0,0],[1,8,3,4]],[1,3,2,2],2),
        ):
            before=game(dict(version=CURRENT_VERSION,mode=1,difficulty=0,actions=trace))
            self.assertEqual((before['tiles'][2]['owner'],before['tiles'][2]['troops']),(0,0))
            preview=before['previews'][before['legal'].index(action)]
            after=game(dict(version=CURRENT_VERSION,mode=1,difficulty=0,actions=trace+[action]))
            self.assertEqual((preview['outcome'],preview['defense'],preview['targetOwner'],preview['targetTroops']),(2,0,side,2))
            self.assertEqual((after['tiles'][2]['owner'],after['tiles'][2]['troops'],after['tiles'][2]['constructedBridge']),(side,2,1))
            self.assertEqual(after['tiles'][2]['supplied'],1)
            for player,color in enumerate(('blue','red')):
                self.assertEqual(preview[color+'ConnectedAfter'],after['supply'][player]['connectedOwned'])
                self.assertEqual(preview[color+'CutOffAfter'],after['supply'][player]['cutOffOwned'])
            self.assertEqual(game(dict(version=CURRENT_VERSION,mode=1,difficulty=0,actions=trace+[action])),after)
            if side==2:
                recapture_trace=trace+[action,[1,0,1,5]]
                prepared=game(dict(version=CURRENT_VERSION,mode=1,difficulty=0,actions=recapture_trace))
                recapture=[1,1,2,7]
                forecast=prepared['previews'][prepared['legal'].index(recapture)]
                restored=game(dict(version=CURRENT_VERSION,mode=1,difficulty=0,actions=recapture_trace+[recapture]))
                self.assertEqual((forecast['outcome'],forecast['defense'],forecast['targetOwner']),(2,3,1))
                self.assertEqual((restored['tiles'][2]['owner'],restored['tiles'][2]['constructedBridge']),(1,1))
                self.assertEqual(forecast['targetTroops'],restored['tiles'][2]['troops'])

    def test_next_turn_food_projection(self):
        for scenario in (0,1,2):
            before=game(dict(version=CURRENT_VERSION,scenario=scenario,mode=1,difficulty=0,actions=[]))
            after=game(dict(version=CURRENT_VERSION,scenario=scenario,mode=1,difficulty=0,actions=[[0,0,0,0]]))
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
            game({'version':CURRENT_VERSION,'mode': 0, 'difficulty': 0, 'actions': [[1, 14, 0, 99]]})


if __name__ == '__main__':
    unittest.main()
