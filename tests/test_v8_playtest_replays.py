"""Preserve four bounded A/B playtest traces, not completed games or strength claims.

Literal full-response hashes were derived from preserved A (commit 4a0d8a2,
binary d93c5d1b...) and independently matched preserved B (fd979b0439...).
Mode1 excludes policy decisions, so the same physical rules must replay both
policies' recorded actions exactly. Do not regenerate expectations on failure.
"""
import hashlib
import json
from pathlib import Path
import sys
import unittest

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from server import game

ECONOMY_FIELDS=('side','food','goldIncome','foodProduction','foodUpkeep','foodNet',
                'disconnectedTiles','shortageLossesNextTurn','projectedFood')
MEDIUM={
    'scenario':1,'difficulty':1,'tiles':35,'roundLimit':120,
    'digest':'1d7cce75bf35f927fe531b6bcb2001b9f0bf80028ed74081a15832b2e069ee6a',
    'gold':(10,21),'knowledge':(1,0,0,0,0,0),
    'economy':((1,11,9,7,6,1,0,0,12),(2,29,7,9,8,1,0,0,30)),
    'supply':((1,8,0),(2,10,0)),
    'specialties':[(7,1,1),(27,2,1)],'eligible':[(2,1)],
}
EXPECTED={
    # The two Medium recorded traces are identical; retain both report inputs.
    'medium-a':MEDIUM,
    'medium-b':MEDIUM,
    'large-a':{
        'scenario':2,'difficulty':0,'tiles':45,'roundLimit':180,
        'digest':'01760888706661a4c8ea147290549600a8d2c7393a8c863cb5333b75aba808b1',
        'gold':(32,36),'knowledge':(1,0,0,1,0,0),
        'economy':((1,34,8,5,3,2,2,0,36),(2,9,7,5,4,1,0,0,10)),
        'supply':((1,7,2),(2,13,0)),
        'specialties':[(9,1,2),(35,2,2)],'eligible':[(2,3)],
    },
    'large-b':{
        'scenario':2,'difficulty':0,'tiles':45,'roundLimit':180,
        'digest':'2139025361a52fd0e8edc409e4853ef003390898549796c4d1b5fccf27853640',
        'gold':(33,32),'knowledge':(1,0,0,1,0,0),
        'economy':((1,30,10,7,3,4,0,0,34),(2,1,6,5,5,0,0,0,1)),
        'supply':((1,11,0),(2,12,0)),
        'specialties':[(9,1,2),(35,2,2)],'eligible':[],
    },
}


class V8PlaytestReplayTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fixtures={}
        cls.responses={}
        for name,expected in EXPECTED.items():
            fixture=json.loads((ROOT/f'docs/playtests/v8-ab-{name}.json').read_text())
            metadata=(fixture['version'],fixture['scenario'],fixture['difficulty'],len(fixture['actions']),fixture.get('mode',1))
            if metadata!=(8,expected['scenario'],expected['difficulty'],58,1):
                raise AssertionError(f'{name}: unexpected replay metadata or unbounded trace')
            cls.fixtures[name]=fixture
            cls.responses[name]=game(dict(fixture,mode=1))

    def test_fixed_full_response_hashes_exact_traces_and_repeat(self):
        for name,expected in EXPECTED.items():
            with self.subTest(replay=name):
                response=self.responses[name]
                fixture=self.fixtures[name]
                self.assertEqual((response['version'],response['difficulty']),(8,expected['difficulty']))
                self.assertEqual(response['actions'],fixture['actions'])
                self.assertEqual(response['map']['scenario'],expected['scenario'])
                self.assertEqual(len(response['tiles']),expected['tiles'])
                self.assertEqual(response['decisions'],[])
                # Default separators match the independently captured literal baseline.
                digest=hashlib.sha256(json.dumps(response,sort_keys=True).encode()).hexdigest()
                self.assertEqual(digest,expected['digest'],'Verified physical v8 replay response changed.')
                self.assertEqual(game(dict(fixture,mode=1)),response)

    def test_readable_ongoing_phase_knowledge_economy_and_supply(self):
        for name,expected in EXPECTED.items():
            with self.subTest(replay=name):
                response=self.responses[name]
                state=response['state']
                fields=('side','orders','turn','result','completedRounds','decisionPending','traceCapacityReached','nodes')
                self.assertEqual(tuple(state[k] for k in fields),(2,2,30,0,14,0,0,0))
                self.assertEqual(state['roundLimit'],expected['roundLimit'])
                self.assertEqual((state['gold1'],state['gold2']),expected['gold'])
                self.assertTrue(response['legal'],'These are ongoing checkpoints, not victories or draws.')
                self.assertEqual(tuple(tuple(row[k] for k in ECONOMY_FIELDS) for row in response['economy']),expected['economy'])
                self.assertEqual(tuple(tuple(row[k] for k in ('side','connectedOwned','cutOffOwned')) for row in response['supply']),expected['supply'])
                self.assertEqual(tuple(row['known'] for row in response['developments']),expected['knowledge'])
                self.assertEqual(tuple(row['active'] for row in response['developments']),expected['knowledge'])
                self.assertEqual([(r['side'],r['id']) for r in response['developments'] if r['eligible']],expected['eligible'])
                self.assertEqual([(t['index'],t['owner'],t['specialty']) for t in response['tiles'] if t['specialty']],expected['specialties'])


if __name__=='__main__':unittest.main()
