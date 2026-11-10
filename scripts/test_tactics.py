#!/usr/bin/env python3
"""Two preserved v6 capital-threat puzzles, evaluated only by native Fe.

The test oracle enumerates complete Red turns and all Blue continuations within
its next two orders. It is not an opponent policy and is never used by the app.
Hard must prevent the immediate win; Easy is diagnostic, not required to fail.
"""
import hashlib
import json
import pathlib
import subprocess
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from server import decode

EVIDENCE = ROOT / 'evidence'
CASES = (('small', 66), ('medium', 46))


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def compile_oracle():
    lock = json.loads((ROOT / 'toolchain.lock.json').read_text())
    assert sha256(pathlib.Path('/usr/local/bin/fe')) == lock['compiler_sha256']
    engine = (ROOT / 'legacy/v6/engine.fe').read_text(encoding='utf-8-sig')
    native = (ROOT / 'legacy/v6/native.fe').read_text(encoding='utf-8-sig')
    # Reuse the existing bounded numeric parser/output helpers, without the
    # production run/main functions. No engine/native source is rewritten.
    marker = 'fn run() -> i32'
    assert native.count(marker) == 1
    io = native.split(marker, 1)[0]
    oracle = (ROOT / 'tests/tactics.fe').read_text(encoding='utf-8-sig')
    (ROOT / 'generated').mkdir(exist_ok=True)
    (ROOT / 'out').mkdir(exist_ok=True)
    (ROOT / 'generated/tactics.fe').write_text(engine + '\n' + io + '\n' + oracle)
    subprocess.run(['fe', 'build', '--backend', 'native', '-O', '1', '--emit',
                    'executable', '--out-dir', 'out', 'generated/tactics.fe'],
                   cwd=ROOT, check=True, timeout=60)


def wire_actions(actions):
    return ''.join(' '.join(map(str, a)) + '\n' for a in actions)


def native(scenario, actions, mode=1, difficulty=0):
    wire = f'6 {mode} {difficulty} {scenario} {len(actions)}\n' + wire_actions(actions)
    run = subprocess.run([str(ROOT / 'out/kingdom-v6')], input=wire, text=True,
                         capture_output=True, check=True, timeout=30)
    return decode(run.stdout)


def parse_oracle(text, full_audit=True):
    data = {'policies': [{'difficulty': level, 'orders': [], 'blue_wins': []}
                         for level in (0, 1)], 'root_candidates': []}
    for line in text.splitlines():
        tag, *v = map(int, line.split())
        if tag == 0:
            assert len(v) == 3 and 'position' not in data
            data['position'] = dict(zip(('side', 'orders', 'turn'), v))
        elif tag == 1:
            assert len(v) == 8
            level, order = v[:2]
            policy = data['policies'][level]
            assert order == len(policy['orders'])
            policy['orders'].append({'action': v[2:6], 'rank': v[6],
                                     'one_ply_red_score': v[7]})
        elif tag == 2:
            assert len(v) == 13
            policy = data['policies'][v[0]]
            assert 'blue_win_count' not in policy
            policy['blue_win_count'] = v[1]
        elif tag == 3:
            assert len(v) == 14
            assert v[0] == len(data['root_candidates'])
            data['root_candidates'].append({
                'rank': v[0], 'action': v[1:5], 'one_ply_red_score': v[5],
                'native_search_score': v[6], 'red_turn_completions': v[7],
                'immediate_defenses': v[8], 'defending_second_rank': v[9],
                'defending_second_action': v[10:14] if v[9] >= 0 else None})
        elif tag == 4:
            assert len(v) == 2 and 'red_turn_completions' not in data
            data['red_turn_completions'], data['immediate_defenses'] = v
        elif tag == 5:
            assert len(v) == 12 and v[1] in (1, 2)
            actions = [v[2:6]] + ([v[6:10]] if v[1] == 2 else [])
            data['policies'][v[0]]['blue_wins'].append({
                'actions': actions, 'ranks': v[10:10 + v[1]]})
        else:
            raise AssertionError(f'Unexpected tactical record: {line}')
    if full_audit:
        assert data['position']['side'] == 2 and data['position']['orders'] == 2
        assert sum(c['red_turn_completions'] for c in data['root_candidates']) == data['red_turn_completions']
        assert sum(c['immediate_defenses'] for c in data['root_candidates']) == data['immediate_defenses']
    for policy in data['policies'][:2 if full_audit else 1]:
        assert policy['blue_win_count'] == len(policy['blue_wins'])
    return data


def audit(name, prefix):
    replay_path = ROOT / f'docs/playtests/v6-sol-{name}.json'
    replay = json.loads(replay_path.read_text())
    assert replay['version'] == 6 and len(replay['actions']) == prefix + 4
    scenario = replay['scenario']
    actions = replay['actions'][:prefix]
    before = native(scenario, actions)
    assert before['state']['side'] == 2 and before['state']['orders'] == 2
    assert before['state']['result'] == 0
    original = native(scenario, replay['actions'])
    assert original['state']['result'] == 1
    # Positive control independent of the current Easy policy. A vacuous
    # zero-wins oracle must fail even if current AI decisions change.
    historical = replay['actions'][:prefix + 2]
    historical_wire = f'{scenario} {len(historical)}\n' + wire_actions(historical)
    positive = subprocess.run([str(ROOT / 'out/tactics')], input=historical_wire,
                              text=True, capture_output=True, check=True, timeout=30)
    known = parse_oracle(positive.stdout, full_audit=False)['policies'][0]
    assert known['blue_win_count'] > 0
    assert replay['actions'][-2:] in [w['actions'] for w in known['blue_wins']]
    for win in known['blue_wins']:
        assert native(scenario, historical + win['actions'])['state']['result'] == 1
    (EVIDENCE / f'tactics-{name}-positive.stdout').write_text(positive.stdout)
    wire = f'{scenario} {prefix}\n' + wire_actions(actions)
    start = time.perf_counter()
    run = subprocess.run([str(ROOT / 'out/tactics')], input=wire, text=True,
                         capture_output=True, check=True, timeout=60)
    repeat = subprocess.run([str(ROOT / 'out/tactics')], input=wire, text=True,
                            capture_output=True, check=True, timeout=60)
    assert repeat.stdout == run.stdout, 'The bounded native audit must be deterministic.'
    data = parse_oracle(run.stdout)
    assert data['position']['turn'] == before['state']['turn']
    assert data['immediate_defenses'] > 0, 'These are avoidable-loss puzzles.'
    assert data['policies'][1]['blue_win_count'] == 0, 'Hard permits an immediate Blue win.'
    for policy in data['policies']:
        level = policy['difficulty']
        response = native(scenario, actions, mode=0, difficulty=level)
        chosen = [o['action'] for o in policy['orders']]
        assert response['actions'] == actions + chosen
        assert response['state']['side'] == 1 and response['state']['orders'] == 2
        assert response['state']['result'] == 0
        assert response == native(scenario, actions, mode=0, difficulty=level)
        for win in policy['blue_wins']:
            actual = native(scenario, actions + chosen + win['actions'])
            assert actual['state']['result'] == 1
    # Every emitted defense witness is a legal complete Red turn. Its
    # no-immediate-loss property was exhaustively checked inside Fe.
    for candidate in data['root_candidates']:
        if candidate['immediate_defenses'] == 0:
            continue
        witness = [candidate['action']]
        if candidate['defending_second_action'] is not None:
            witness.append(candidate['defending_second_action'])
        actual = native(scenario, actions + witness)
        assert actual['state']['side'] == 1 and actual['state']['result'] == 0
    data.update(name=name, replay=str(replay_path.relative_to(ROOT)), prefix=prefix,
                scenario=scenario, original_winning_line=replay['actions'][-2:],
                deterministic=True, native_response_match=True,
                historical_successor_prefix=prefix + 2, historical_blue_wins=known['blue_wins'],
                all_red_completions_are_ordinary_blue_turns=True,
                seconds_including_repeat=time.perf_counter() - start)
    (EVIDENCE / f'tactics-{name}.stdout').write_text(run.stdout)
    print(json.dumps({key: data[key] for key in (
        'name', 'prefix', 'red_turn_completions', 'immediate_defenses',
        'seconds_including_repeat')} | {
        'easy_blue_wins': data['policies'][0]['blue_win_count'],
        'hard_blue_wins': data['policies'][1]['blue_win_count']}), flush=True)
    return data


def main():
    EVIDENCE.mkdir(exist_ok=True)
    report = {'status': 'running', 'scope': 'Only the next Blue turn (at most two orders); not a forced campaign outcome.',
              'cases': []}
    path = EVIDENCE / 'v6-tactics.json'
    path.write_text(json.dumps(report, indent=2))
    try:
        compile_oracle()
        for name, prefix in CASES:
            report['cases'].append(audit(name, prefix))
        report['status'] = 'passed'
        paths = [ROOT / p for p in ('legacy/v6/engine.fe', 'legacy/v6/native.fe',
                 'tests/tactics.fe', 'scripts/test_tactics.py', 'toolchain.lock.json')]
        paths += [ROOT / f'docs/playtests/v6-sol-{name}.json' for name, _ in CASES]
        report['sha256'] = {str(p.relative_to(ROOT)): sha256(p) for p in paths}
    except Exception as error:
        report.update(status='failed', error=str(error))
        raise
    finally:
        path.write_text(json.dumps(report, indent=2))
    print('Both native capital-threat puzzles passed; Easy outcomes are diagnostic.')


if __name__ == '__main__':
    main()
