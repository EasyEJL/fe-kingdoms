"""Check native decision observations; no host evaluation or opponent policy."""
import json
from pathlib import Path
import subprocess
import sys
import unittest
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from server import CURRENT_VERSION,DECISION_FIELDS,MAX_ACTIONS,decode,game

DELTAS=('materialDelta','resourcesDelta','supplyDelta','economyDelta',
        'positionDelta','pressureDelta','focusDelta','terminalDelta')
CYCLE=[[1,0,1,3],[1,1,0,3],[1,14,13,3],[1,13,14,3]]


def request(actions,mode=1,difficulty=0):
    return dict(version=CURRENT_VERSION,mode=mode,difficulty=difficulty,actions=actions)


def native(actions,mode=1,difficulty=0):
    wire=f'{CURRENT_VERSION} {mode} {difficulty} 0 {len(actions)}\n'+''.join(' '.join(map(str,a))+'\n' for a in actions)
    return subprocess.run([str(ROOT/'out/kingdom')],input=wire,text=True,capture_output=True,check=True,timeout=30).stdout


class DecisionTests(unittest.TestCase):
    def test_actual_automatic_decisions_and_replay_are_distinct(self):
        trace=[[0,0,0,0]]
        for difficulty in (0,1):
            response=game(request(trace,mode=0,difficulty=difficulty))
            self.assertEqual(response,game(request(trace,mode=0,difficulty=difficulty)))
            decisions=response['decisions']
            self.assertEqual(len(decisions),len(response['actions'])-len(trace))
            self.assertTrue(1<=len(decisions)<=2)
            self.assertEqual(sum(d['nodes'] for d in decisions),response['state']['nodes'])
            for decision in decisions:
                self.assertEqual(set(decision),set(DECISION_FIELDS))
                index=decision['traceIndex']
                action=response['actions'][index]
                before=game(request(response['actions'][:index],difficulty=difficulty))
                after=game(request(response['actions'][:index+1],difficulty=difficulty))
                forecast=before['previews'][before['legal'].index(action)]
                self.assertEqual([decision[k] for k in ('kind','from','to','amount')],action)
                self.assertEqual(decision['side'],before['state']['side'])
                self.assertEqual(decision['orderCost'],forecast['orderCost'])
                self.assertEqual(decision['depth'],1 if difficulty==0 else 4)
                if decision['focus'] in (1,4):
                    target_side=decision['side'] if decision['focus']==1 else 3-decision['side']
                    self.assertEqual(decision['target'],before['map']['blueCapital' if target_side==1 else 'redCapital'])
                elif decision['focus']==2:
                    target=before['tiles'][decision['target']]
                    self.assertEqual((target['owner'],target['supplied']),(decision['side'],0))
                else:
                    self.assertEqual(decision['target'],64)
                changes=[decision[k] for k in DELTAS]
                self.assertEqual(sum(changes),decision['afterScore']-decision['beforeScore'])
                expected=changes.index(max(changes))+1 if max(changes)>0 else 0
                self.assertEqual(decision['highlight'],expected)
                if difficulty==0:
                    self.assertEqual(decision['searchScore'],decision['afterScore'])
                self.assertEqual(after['decisions'],[])
            replay=game(request(response['actions'],difficulty=difficulty))
            self.assertEqual(replay['decisions'],[])
            self.assertEqual(replay['tiles'],response['tiles'])
            self.assertEqual(replay['actions'],response['actions'])
        self.assertEqual(game(request([],mode=0))['decisions'],[])
        pending=CYCLE*60
        self.assertEqual(game(request(pending,mode=0))['decisions'],[])
        fixture=json.loads((ROOT/f'tests/fixtures/current-v{CURRENT_VERSION}-win.json').read_text())
        self.assertEqual(game(dict(fixture,mode=0))['decisions'],[])

    def test_native_modes_keep_only_actual_final_two_decisions(self):
        trace=CYCLE*59
        full=decode(native(trace,mode=2))
        self.assertEqual(full['state']['decisionPending'],1)
        self.assertGreater(len(full['actions'])-len(trace),2)
        self.assertEqual(len(full['decisions']),2)
        self.assertEqual([d['traceIndex'] for d in full['decisions']],list(range(len(full['actions'])-2,len(full['actions']))))
        sequence=[]
        actions=trace
        for _ in range(4):
            step=decode(native(actions,mode=3))
            self.assertEqual(len(step['decisions']),1)
            self.assertEqual(len(step['actions']),len(actions)+1)
            sequence+=step['decisions']
            actions=step['actions']
            if step['state']['decisionPending']:break
        self.assertEqual(actions,full['actions'])
        self.assertEqual(sequence[-2:],full['decisions'])
        self.assertEqual(sum(d['nodes'] for d in sequence),full['state']['nodes'])
        self.assertEqual(decode(native(actions,mode=3))['decisions'],[])
        self.assertEqual(decode(native(actions))['decisions'],[])

    def test_decoder_rejects_malformed_decision_records(self):
        output=native([[0,0,0,0]],mode=0)
        lines=output.splitlines()
        positions=[i for i,line in enumerate(lines) if line.startswith('9 ')]
        self.assertEqual(len(positions),2)
        position=positions[0]
        original=lines[position].split()
        malformed=[' '.join(original[:-1]),' '.join(original+['0'])]
        changed=original.copy()
        material=1+DECISION_FIELDS.index('materialDelta')
        changed[material]=str(int(changed[material])+1)
        malformed.append(' '.join(changed))
        for field,value in (
            ('traceIndex',-1),('traceIndex',MAX_ACTIONS),('traceIndex',0),
            ('side',0),('focus',0),('focus',5),('depth',2),('nodes',-1),
            ('highlight',9),('orderCost',0),('orderCost',3),('amount',99),
        ):
            changed=original.copy()
            changed[1+DECISION_FIELDS.index(field)]=str(value)
            malformed.append(' '.join(changed))
        for focus,target in ((3,0),(4,64),(1,-1)):
            changed=original.copy()
            changed[1+DECISION_FIELDS.index('focus')]=str(focus)
            changed[1+DECISION_FIELDS.index('target')]=str(target)
            malformed.append(' '.join(changed))
        for record in malformed:
            changed=lines.copy();changed[position]=record
            with self.subTest(record=record):
                with self.assertRaises(RuntimeError):decode('\n'.join(changed))
        with self.assertRaises(RuntimeError):decode(output+'\n'+lines[position])
        swapped=lines.copy()
        swapped[positions[0]],swapped[positions[1]]=swapped[positions[1]],swapped[positions[0]]
        with self.assertRaises(RuntimeError):decode('\n'.join(swapped))
        duplicate=lines.copy();duplicate[positions[1]]=duplicate[positions[0]]
        with self.assertRaises(RuntimeError):decode('\n'.join(duplicate))
        legacy=subprocess.run([str(ROOT/'out/kingdom-v6')],input='6 1 0 0 0\n',text=True,capture_output=True,check=True).stdout
        self.assertNotIn('decisions',decode(legacy))
        with self.assertRaises(RuntimeError):decode(legacy+'\n'+lines[position])

    def test_transport_rejects_missing_or_unrequested_observations(self):
        trace=[[0,0,0,0]]
        output=native(trace,mode=0)
        parsed=decode(output)
        self.assertEqual(len(parsed['decisions']),2)
        missing='\n'.join(line for line in output.splitlines() if not line.startswith('9 '))
        self.assertEqual(decode(missing)['decisions'],[])
        first=next(line for line in output.splitlines() if line.startswith('9 '))
        missing_first=output.replace(first+'\n','',1)
        changed_lines=output.splitlines()
        prefix_index=next(i for i,line in enumerate(changed_lines) if line.startswith('4 0 '))
        changed=changed_lines[prefix_index].split();changed[-1]='1'
        changed_lines[prefix_index]=' '.join(changed)
        wrong_prefix='\n'.join(changed_lines)
        cases=((missing,request(trace,mode=0)),(missing_first,request(trace,mode=0)),
               (output,request(parsed['actions'],mode=1)),(wrong_prefix,request(trace,mode=0)))
        for index,(native_output,payload) in enumerate(cases):
            result=subprocess.CompletedProcess([],0,native_output,'')
            with self.subTest(case=index),patch('server.subprocess.run',return_value=result):
                with self.assertRaises(RuntimeError):game(payload)


if __name__=='__main__':unittest.main()
