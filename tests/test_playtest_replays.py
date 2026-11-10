"""Keep the two documented v6 simulated-player games as native regressions.

These are replay/forecast checks, not a human playtest or an AI-strength test.
The host only compares Fe responses: one cached response per recorded prefix,
and only the recorded action's forecast is checked against its successor.
"""
import hashlib
import json
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from server import game


# Captured from the unchanged v6 native engine at 5acddb4, using the pinned
# offline image. The digest freezes the entire decoded terminal response,
# including every tile field and action; readable expectations below explain
# the important outcomes. Review rule changes rather than regenerating blindly.
EXPECTED = {
    'small': {
        'scenario': 0, 'actions': 70, 'width': 5, 'height': 3, 'count': 15,
        'roundLimit': 60, 'turn': 35, 'completedRounds': 17,
        'digest': '2e4ddc353ececdfaaff7e6f88e7e2ffdb16320cc6710a99da948abf489bac14c',
        'owner': (1, 1, 0, 2, 0, 1, 1, 1, 1, 2, 0, 2, 0, 1, 1),
        'infantry': (1, 1, 0, 1, 0, 1, 1, 1, 1, 6, 0, 1, 0, 1, 0),
        'supply': ((1, 8, 0), (2, 0, 3)),
    },
    'medium': {
        'scenario': 1, 'actions': 50, 'width': 7, 'height': 5, 'count': 35,
        'roundLimit': 120, 'turn': 25, 'completedRounds': 12,
        'digest': '75ffe65535e531322d285b07d8dc6d86c6dbbed7f488328a5ba8f9d5fddb0faf',
        'owner': (1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 0, 0, 0,
                  0, 0, 2, 2, 0, 0, 2, 2, 2, 1, 2, 0, 2, 2, 0, 0, 1, 1),
        'infantry': (1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 2, 1, 1, 0,
                     0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 3, 0, 1, 1, 0, 1, 0, 0),
        'supply': ((1, 8, 3), (2, 0, 9)),
    },
}

PREVIEW_FIELDS = set('''index outcome cost sourceTroops targetTroops targetOwner
nextSide nextOrders result defense foodCost settlementAfter food1After food2After
movingInfantry movingCavalry movingSiege attackPower sourceInfantry sourceCavalry
sourceSiege targetInfantry targetCavalry targetSiege blueConnectedAfter blueCutOffAfter
redConnectedAfter redCutOffAfter'''.split())


def values(record, *fields):
    return tuple(record[field] for field in fields)


def supply_rows(response):
    return tuple(values(side, 'side', 'connectedOwned', 'cutOffOwned')
                 for side in response['supply'])


class PlaytestReplayTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fixtures = {}
        cls.responses = {}
        for name, expected in EXPECTED.items():
            fixture = json.loads((ROOT / f'docs/playtests/v6-sol-{name}.json').read_text())
            # Keep the native work bounded even if a fixture is accidentally replaced.
            if (fixture['version'], fixture['difficulty'], fixture['scenario'],
                    len(fixture['actions'])) != (6, 0, expected['scenario'], expected['actions']):
                raise AssertionError(f'{name}: unexpected fixture metadata or action count')
            cls.fixtures[name] = fixture
            cls.responses[name] = [
                game(dict(fixture, mode=1, actions=fixture['actions'][:count]))
                for count in range(expected['actions'] + 1)
            ]

    def assert_values(self, record, **expected):
        self.assertEqual({field: record[field] for field in expected}, expected)

    def preview(self, name, index):
        before = self.responses[name][index]
        action = self.fixtures[name]['actions'][index]
        return before['previews'][before['legal'].index(action)]

    def test_frozen_v6_metadata_and_exact_prefix_arrays(self):
        for name, responses in self.responses.items():
            expected = EXPECTED[name]
            for count, response in enumerate(responses):
                with self.subTest(game=name, prefix=count):
                    self.assert_values(response, version=6, difficulty=0)
                    self.assertEqual(response['map'], dict(
                        width=expected['width'], height=expected['height'],
                        count=expected['count'], topology=1, scenario=expected['scenario'],
                        blueCapital=0, redCapital=expected['count'] - 1, orderBudget=2,
                        baseRoundLimit=expected['roundLimit'], extensionRounds=20,
                        traceCapacity=2048))
                    self.assert_values(response['state'], decisionPending=0,
                                       traceCapacityReached=0, nodes=0, depth=1,
                                       roundLimit=expected['roundLimit'])
                    self.assertEqual(response['actions'], self.fixtures[name]['actions'][:count])
                    self.assertEqual([t['index'] for t in response['tiles']],
                                     list(range(expected['count'])))
                    self.assertEqual([e['side'] for e in response['economy']], [1, 2])
                    self.assertEqual([s['side'] for s in response['supply']], [1, 2])
                    self.assertEqual([p['index'] for p in response['previews']],
                                     list(range(len(response['legal']))))
                    self.assertEqual(response['state']['result'],
                                     1 if count == expected['actions'] else 0)

    def test_all_120_recorded_forecasts_match_applied_results(self):
        checked = 0
        for name, fixture in self.fixtures.items():
            for index, action in enumerate(fixture['actions']):
                with self.subTest(game=name, index=index, action=action):
                    before, after = self.responses[name][index:index + 2]
                    self.assertIn(action, before['legal'])
                    forecast = self.preview(name, index)
                    self.assertEqual(set(forecast), PREVIEW_FIELDS)
                    source, target = after['tiles'][action[1]], after['tiles'][action[2]]
                    player = before['state']['side']
                    gold = f'gold{player}'
                    expected = dict(
                        sourceTroops=source['troops'], targetTroops=target['troops'],
                        targetOwner=target['owner'], settlementAfter=target['settlement'],
                        nextSide=after['state']['side'], nextOrders=after['state']['orders'],
                        result=after['state']['result'],
                        cost=before['state'][gold] - after['state'][gold],
                        foodCost=before['economy'][player - 1]['food'] - after['economy'][player - 1]['food'],
                        food1After=after['economy'][0]['food'],
                        food2After=after['economy'][1]['food'])
                    for role in ('Infantry', 'Cavalry', 'Siege'):
                        expected['source' + role] = source[role.lower()]
                        expected['target' + role] = target[role.lower()]
                    for side, color in enumerate(('blue', 'red')):
                        expected[color + 'ConnectedAfter'] = after['supply'][side]['connectedOwned']
                        expected[color + 'CutOffAfter'] = after['supply'][side]['cutOffOwned']
                    # 21 exposed result fields, including the incoming turn's effects.
                    self.assert_values(forecast, **expected)
                    checked += 1
        self.assertEqual(checked, 120)

    def test_exact_terminal_replay_and_compositions(self):
        for name, expected in EXPECTED.items():
            with self.subTest(game=name):
                final = self.responses[name][-1]
                self.assert_values(final['state'], side=1, orders=0, result=1,
                                   turn=expected['turn'], completedRounds=expected['completedRounds'])
                self.assertEqual(final['legal'], [])
                self.assertEqual(final['previews'], [])
                self.assertEqual(supply_rows(final), expected['supply'])
                for field in ('owner', 'infantry'):
                    self.assertEqual(tuple(t[field] for t in final['tiles']), expected[field])
                # Small finishes with one siege unit; Medium also leaves cavalry at 33.
                self.assertEqual(tuple(t['siege'] for t in final['tiles']),
                                 (0,) * (expected['count'] - 1) + (1,))
                cavalry = [0] * expected['count']
                if name == 'medium':
                    cavalry[33] = 1
                self.assertEqual([t['cavalry'] for t in final['tiles']], cavalry)
                for tile in final['tiles']:
                    self.assertEqual(tile['troops'], sum(values(tile, 'infantry', 'cavalry', 'siege')))
                digest = hashlib.sha256(json.dumps(final, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
                self.assertEqual(digest, expected['digest'],
                                 'Complete terminal response changed: ' + json.dumps(final, sort_keys=True))
                # Repeat the exact frozen replay; old versions are read-only.
                self.assertEqual(game(dict(self.fixtures[name], mode=1)), final)
                with self.assertRaises(ValueError):
                    game(dict(self.fixtures[name], mode=0))

    def test_small_bridge_conversion_and_repulses(self):
        responses = self.responses['small']
        self.assert_values(responses[44]['tiles'][7], troops=12, infantry=10, cavalry=0, siege=2)
        self.assert_values(responses[45]['tiles'][7], troops=12, infantry=9, cavalry=0, siege=3)
        self.assert_values(self.preview('small', 44), cost=5, foodCost=3, outcome=4)
        for index, amount, infantry, siege in ((46, 5, 7, 3), (59, 1, 7, 4)):
            with self.subTest(index=index):
                self.assertEqual(self.fixtures['small']['actions'][index], [1, 3, 7, amount])
                self.assert_values(self.preview('small', index), outcome=3, defense=15,
                                   attackPower=amount, movingInfantry=amount,
                                   movingCavalry=0, movingSiege=0)
                self.assert_values(responses[index + 1]['tiles'][7], owner=1, fort=2,
                                   settlement=2, supplied=1, infantry=infantry,
                                   cavalry=0, siege=siege, troops=infantry + siege)
        # The first repulse damages the bridge but relieves Red's looming shortage.
        self.assert_values(responses[46]['economy'][1], food=0, foodUpkeep=9,
                           foodNet=-2, shortageLossesNextTurn=2)
        self.assert_values(responses[47]['economy'][1], food=0, foodUpkeep=7,
                           foodNet=0, shortageLossesNextTurn=0)

    def test_medium_cut_recapture_attrition_and_finishing_route(self):
        responses = self.responses['medium']
        for count, expected in (
                (45, ((1, 9, 0), (2, 11, 0))),
                (46, ((1, 10, 0), (2, 5, 5))),
                (47, ((1, 10, 0), (2, 5, 5))),
                (48, ((1, 8, 1), (2, 11, 0))),
                (49, ((1, 8, 2), (2, 10, 0))),
                (50, ((1, 8, 3), (2, 0, 9)))):
            with self.subTest(prefix=count):
                self.assertEqual(supply_rows(responses[count]), expected)
        self.assertEqual(self.fixtures['medium']['actions'][45:50], [
            [1, 19, 26, 9], [2, 20, 20, 2], [1, 20, 19, 2],
            [1, 26, 33, 6], [1, 33, 34, 4]])
        self.assertEqual([t['index'] for t in responses[46]['tiles']
                          if t['owner'] == 2 and not t['supplied']], [23, 24, 25, 29, 30])
        self.assert_values(responses[46]['tiles'][26], owner=1, supplied=1,
                           troops=8, infantry=3, cavalry=2, siege=3)
        self.assert_values(responses[46]['tiles'][20], owner=2, troops=1, infantry=1)
        self.assert_values(responses[47]['tiles'][20], owner=2, troops=3, infantry=3)
        self.assert_values(responses[48]['tiles'][19], owner=2, supplied=1, troops=1)
        # The corridor recapture triggers Blue's turn, losing one expedition infantry.
        self.assert_values(responses[48]['state'], side=1, orders=2, completedRounds=12)
        self.assert_values(responses[48]['tiles'][26], owner=1, supplied=0,
                           troops=7, infantry=2, cavalry=2, siege=3)
        self.assert_values(responses[48]['economy'][0], food=16, goldIncome=8,
                           disconnectedTiles=1, foodUpkeep=0)
        self.assert_values(responses[49]['tiles'][33], owner=1, supplied=0,
                           troops=5, infantry=0, cavalry=2, siege=3)
        self.assert_values(self.preview('medium', 49), outcome=2, attackPower=10,
                           defense=7, movingInfantry=0, movingCavalry=1, movingSiege=3,
                           result=1)
        self.assert_values(responses[50]['tiles'][34], owner=1, supplied=0,
                           troops=1, infantry=0, cavalry=0, siege=1)

    def test_corrupted_histories_rejected_without_changing_saved_replay(self):
        for name, fixture in self.fixtures.items():
            actions = fixture['actions']
            for label, corrupted in (
                    ('order after victory', actions + [[0, 0, 0, 0]]),
                    ('finishing route reversed', actions[:-2] + actions[-2:][::-1])):
                with self.subTest(game=name, corruption=label):
                    with self.assertRaises(ValueError):
                        game(dict(fixture, mode=1, actions=corrupted))
            self.assertEqual(game(dict(fixture, mode=1)), self.responses[name][-1])
        # Omitting Red's recruitment cannot leave its subsequent two-troop attack legal.
        fixture = self.fixtures['medium']
        with self.assertRaises(ValueError):
            game(dict(fixture, mode=1, actions=fixture['actions'][:46] + fixture['actions'][47:]))


if __name__ == '__main__':
    unittest.main()
