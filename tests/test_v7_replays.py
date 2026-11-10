"""Preserve two unfinished v7 simulated-player traces, not balance claims.

Literal digests were independently captured from the verified 0517958 native
engine, then cross-checked against independent repeated HTTP replay results.
They cover the complete replay-only response, including every tile, forecast,
economy row, supply row, and accepted action. Do not regenerate on failure.
"""
import hashlib
import json
from pathlib import Path
import sys
import unittest

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from server import game

STATE_FIELDS=('side','orders','turn','result','gold1','gold2','completedRounds',
              'roundLimit','decisionPending','traceCapacityReached')
ECONOMY_FIELDS=('side','food','goldIncome','foodProduction','foodUpkeep','foodNet',
                'disconnectedTiles','shortageLossesNextTurn','projectedFood')
EXPECTED={
    'small': {
        'scenario':0,'difficulty':0,'actions':120,'tiles':15,
        'digest':'c0adac9d21a3cc8d84820d29b0232994a885daab8ee45f60f12ef87828bc935c',
        'state':(1,2,65,0,15,32,32,60,0,0),
        'economy':((1,33,6,7,6,1,0,0,34),(2,1,8,9,10,-1,0,0,0)),
        'supply':((1,4,0),(2,8,0)),
        'specialties':[(5,1,1),(6,1,2)],'bridges':[(12,2,1)],
    },
    'medium': {
        'scenario':1,'difficulty':1,'actions':79,'tiles':35,
        'digest':'46530e0238306a25eb9121b5235f6dcf0b9612a910c04e4dee5fc11247fdc454',
        'state':(1,2,41,0,29,26,20,120,0,0),
        'economy':((1,37,8,7,3,4,0,0,37),(2,6,7,7,7,0,0,0,6)),
        'supply':((1,6,0),(2,11,0)),
        'specialties':[(7,1,1)],'bridges':[],
    },
}


class V7ReplayTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fixtures={}
        cls.responses={}
        for name,expected in EXPECTED.items():
            fixture=json.loads((ROOT/f'docs/playtests/v7-sol-{name}.json').read_text())
            # Bound native work before calling it, even if a fixture is replaced.
            actual=(fixture['version'],fixture['scenario'],fixture['difficulty'],len(fixture['actions']))
            if actual!=(7,expected['scenario'],expected['difficulty'],expected['actions']):
                raise AssertionError(f'{name}: unexpected fixture metadata or action count')
            cls.fixtures[name]=fixture
            cls.responses[name]=game(dict(fixture,mode=1))

    def test_exact_response_digest_trace_and_repeat(self):
        for name,expected in EXPECTED.items():
            with self.subTest(replay=name):
                response=self.responses[name]
                fixture=self.fixtures[name]
                self.assertEqual((response['version'],response['difficulty']),(7,expected['difficulty']))
                self.assertEqual(response['actions'],fixture['actions'])
                self.assertEqual(response['map']['scenario'],expected['scenario'])
                self.assertEqual(len(response['tiles']),expected['tiles'])
                self.assertEqual(response['decisions'],[],'Saved replays contain no automatic search observations.')
                # Default JSON separators intentionally match the independent HTTP baseline.
                digest=hashlib.sha256(json.dumps(response,sort_keys=True).encode()).hexdigest()
                self.assertEqual(digest,expected['digest'],'Verified v7 replay response changed.')
                self.assertEqual(game(dict(fixture,mode=1)),response)

    def test_readable_unfinished_campaign_outcomes(self):
        for name,expected in EXPECTED.items():
            with self.subTest(replay=name):
                response=self.responses[name]
                self.assertEqual(tuple(response['state'][field] for field in STATE_FIELDS),expected['state'])
                self.assertEqual(response['state']['nodes'],0)
                self.assertTrue(response['legal'],'These saved campaigns remain playable, not completed.')
                self.assertEqual(tuple(tuple(row[field] for field in ECONOMY_FIELDS) for row in response['economy']),expected['economy'])
                self.assertEqual(tuple(tuple(row[field] for field in ('side','connectedOwned','cutOffOwned')) for row in response['supply']),expected['supply'])
                self.assertEqual([(t['index'],t['owner'],t['specialty']) for t in response['tiles'] if t['specialty']],expected['specialties'])
                self.assertEqual([(t['index'],t['owner'],t['troops']) for t in response['tiles'] if t['constructedBridge']],expected['bridges'])


if __name__=='__main__':unittest.main()
