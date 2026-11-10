"""Replay the actual embedded practice catalog with native Fe, not JS rules."""
import json
from pathlib import Path
import re
import sys
import unittest

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from server import CURRENT_VERSION,game

PREFIXES={'shared-crossing':27,'mixed-siege':24}
SOURCE='docs/playtests/v7-sol-small.json'


def catalog():
    html=(ROOT/'web/index.html').read_text(encoding='utf-8-sig')
    start,end='// BEGIN PRACTICE CATALOG','// END PRACTICE CATALOG'
    if html.count(start)!=1 or html.count(end)!=1 or html.find(start)>=html.find(end):
        raise AssertionError('Expected exactly one marked practice catalog.')
    block=html.split(start,1)[1].split(end,1)[0]
    if not 0<len(block.encode())<=32768:
        raise AssertionError('Practice catalog exceeds its bounded test size.')
    match=re.fullmatch(r'\s*const\s+PRACTICE_DEMOS\s*=\s*(\[.*\])\s*;\s*',block,re.S)
    if not match:
        raise AssertionError('Practice catalog must be one pure JSON array declaration.')
    def reject_constant(value):
        raise ValueError(f'Non-JSON constant: {value}')
    demos=json.loads(match.group(1),parse_constant=reject_constant)
    if not isinstance(demos,list) or len(demos)!=2:
        raise AssertionError('Expected the two reviewed practice demos.')
    if any(not isinstance(d,dict) or set(d)!={'id','title','prompt','source','replay'} for d in demos):
        raise AssertionError('Unexpected practice catalog shape.')
    if {d['id'] for d in demos}!=set(PREFIXES):
        raise AssertionError('Practice IDs changed or are duplicated.')
    return {d['id']:d for d in demos}


def payload(response,actions=None,mode=1):
    return dict(version=response['version'],scenario=response['map']['scenario'],
                difficulty=response['difficulty'],mode=mode,
                actions=response['actions'] if actions is None else actions)


class PracticeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.demos=catalog()
        source=json.loads((ROOT/SOURCE).read_text())
        if (source['version'],source['scenario'],source['difficulty'],len(source['actions']))!=(7,0,0,120):
            raise AssertionError('Unexpected committed source replay.')
        cls.positions={}
        for name,prefix in PREFIXES.items():
            replay=cls.demos[name]['replay']
            # Check exact provenance and bound the trace before invoking native Fe.
            if replay!=dict(source,version=CURRENT_VERSION,actions=source['actions'][:prefix]):
                raise AssertionError(f'{name}: current catalog must derive the exact committed v7 action prefix.')
            cls.positions[name]=game(dict(replay,mode=1))

    def advance(self,before,action):
        self.assertIn(action,before['legal'])
        forecast=before['previews'][before['legal'].index(action)]
        after=game(payload(before,before['actions']+[action]))
        self.assertEqual(after['actions'],before['actions']+[action])
        self.assertEqual((before['state']['result'],after['state']['result']),(0,0))
        source,target=after['tiles'][action[1]],after['tiles'][action[2]]
        side=before['state']['side']
        remaining=after['state']['orders'] if after['state']['side']==side else 0
        expected=dict(
            sourceTroops=source['troops'],targetTroops=target['troops'],targetOwner=target['owner'],
            settlementAfter=target['settlement'],targetSpecialty=target['specialty'],
            targetTerrain=target['terrain'],targetPassable=target['passable'],
            nextSide=after['state']['side'],nextOrders=after['state']['orders'],result=after['state']['result'],
            cost=before['state'][f'gold{side}']-after['state'][f'gold{side}'],
            foodCost=before['economy'][side-1]['food']-after['economy'][side-1]['food'],
            food1After=after['economy'][0]['food'],food2After=after['economy'][1]['food'],
            orderCost=before['state']['orders']-remaining)
        for role in ('Infantry','Cavalry','Siege'):
            expected['source'+role]=source[role.lower()]
            expected['target'+role]=target[role.lower()]
        for index,color in enumerate(('blue','red')):
            expected[color+'ConnectedAfter']=after['supply'][index]['connectedOwned']
            expected[color+'CutOffAfter']=after['supply'][index]['cutOffOwned']
        self.assertEqual(len(expected),25)
        self.assertEqual({field:forecast[field] for field in expected},expected)
        self.assertEqual(after['decisions'],[])
        return after,forecast

    def test_catalog_provenance_and_repeated_native_start(self):
        for name,prefix in PREFIXES.items():
            with self.subTest(demo=name):
                demo=self.demos[name]
                for field in ('title','prompt','source'):
                    self.assertIsInstance(demo[field],str)
                    self.assertTrue(demo[field].strip())
                self.assertIn(f'first {prefix} actions from {SOURCE}',demo['source'])
                self.assertIn(f'v{CURRENT_VERSION}',demo['source'].lower())
                self.assertIn('derived',demo['source'].lower())
                response=self.positions[name]
                self.assertEqual(response['actions'],demo['replay']['actions'])
                self.assertEqual((response['state']['side'],response['state']['orders'],response['state']['result']),(1,2,0))
                self.assertEqual((response['state']['decisionPending'],response['state']['traceCapacityReached']),(0,0))
                self.assertEqual(response['decisions'],[])
                self.assertTrue(response['legal'])
                self.assertEqual(game(dict(demo['replay'],mode=1)),response)

    def test_mixed_siege_changes_orders_and_capture_size(self):
        before=self.positions['mixed-siege']
        heavy,full=self.advance(before,[1,6,7,10])
        self.assertEqual((full['outcome'],full['orderCost'],full['targetTroops']),(2,2,7))
        self.assertGreater(full['movingSiege'],0)
        self.assertEqual((heavy['tiles'][7]['owner'],heavy['tiles'][7]['troops'],heavy['state']['side']),(1,7,2))
        self.assertNotIn([3,7,7,1],heavy['legal'])
        light,half=self.advance(before,[1,6,7,5])
        self.assertEqual((half['outcome'],half['orderCost'],half['targetTroops'],half['movingSiege']),(2,1,2,0))
        self.assertEqual((light['state']['side'],light['state']['orders']),(1,1))
        fortified,forecast=self.advance(light,[3,7,7,1])
        self.assertEqual((forecast['orderCost'],fortified['tiles'][7]['fort'],fortified['tiles'][7]['troops']),(1,1,2))

    def test_shared_crossing_choices_and_native_red_continuations(self):
        before=self.positions['shared-crossing']
        built,forecast=self.advance(before,[12,11,12,1])
        self.assertEqual((forecast['outcome'],forecast['cost'],forecast['foodCost'],forecast['orderCost']),(8,6,2,1))
        bridge=built['tiles'][12]
        self.assertEqual(tuple(bridge[k] for k in ('owner','troops','defense','passable','constructedBridge','supplied')),(0,0,0,1,1,0))
        self.assertEqual(built['supply'],before['supply'])
        occupied,forecast=self.advance(built,[1,7,12,3])
        self.assertEqual((forecast['defense'],occupied['tiles'][12]['owner'],occupied['tiles'][12]['troops']),(0,1,3))
        fortified,_=self.advance(built,[3,7,7,1])
        self.assertEqual((fortified['tiles'][12]['owner'],fortified['tiles'][12]['troops']),(0,0))
        # A legal Red occupation proves shared access without prescribing its policy.
        red,forecast=self.advance(fortified,[1,13,12,2])
        self.assertEqual((forecast['defense'],red['tiles'][12]['owner'],red['tiles'][12]['troops']),(0,2,2))
        for position in (occupied,fortified):
            automatic=game(payload(position,mode=0))
            prefix=len(position['actions'])
            self.assertEqual(automatic['actions'][:prefix],position['actions'])
            additions=automatic['actions'][prefix:]
            self.assertTrue(1<=len(additions)<=2)
            replay=position
            for action in additions:
                replay,_=self.advance(replay,action)
            for field in ('tiles','economy','supply','actions','legal','previews'):
                self.assertEqual(automatic[field],replay[field])
            self.assertEqual({k:v for k,v in automatic['state'].items() if k!='nodes'},
                             {k:v for k,v in replay['state'].items() if k!='nodes'})


if __name__=='__main__':unittest.main()
