"""Real v8 replay/projection checks; the host does not implement development rules."""
import json
from pathlib import Path
import subprocess
import sys
import unittest

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from server import CURRENT_VERSION,DEVELOPMENT_FIELDS,DEVELOPMENT_PREVIEW_FIELDS,decode,game


def play(actions):
    return game(dict(version=CURRENT_VERSION,scenario=0,difficulty=0,mode=1,actions=actions))


def row(response,side,id):
    return response['developments'][(side-1)*3+id-1]


def mask(response,side,field):
    return sum(1<<(entry['id']-1) for entry in response['developments'] if entry['side']==side and entry[field])


class DevelopmentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        source=json.loads((ROOT/'docs/playtests/v7-sol-small.json').read_text())
        if source['version']!=7 or len(source['actions'])!=120:
            raise AssertionError('Unexpected source trace for the directed v8 positions.')
        # Explicit v8-derived test positions, not relabeled v7 playtest evidence.
        cls.source=source['actions']

    def advance(self,before,action):
        self.assertIn(action,before['legal'])
        index=before['legal'].index(action)
        forecast=before['developmentPreviews'][index]
        after=play(before['actions']+[action])
        expected={'actionIndex':index}
        for side,color in ((1,'blue'),(2,'red')):
            expected[color+'KnownMask']=mask(after,side,'known')
            expected[color+'ActiveMask']=mask(after,side,'active')
            expected[color+'GoldIncome']=after['economy'][side-1]['goldIncome']
            expected[color+'FoodProduction']=after['economy'][side-1]['foodProduction']
            expected[color+'Upkeep']=after['economy'][side-1]['foodUpkeep']
            expected[color+'GoldAfter']=after['state'][f'gold{side}']
        self.assertEqual(forecast,expected)
        self.assertEqual(after['actions'],before['actions']+[action])
        return after,before['previews'][index]

    def test_six_ordered_rows_and_malformed_new_records(self):
        wire=f'{CURRENT_VERSION} 1 0 0 0\n'
        output=subprocess.run([str(ROOT/'out/kingdom')],input=wire,text=True,capture_output=True,check=True).stdout
        initial=decode(output)
        self.assertEqual([(r['side'],r['id']) for r in initial['developments']],[(s,i) for s in (1,2) for i in (1,2,3)])
        for entry in initial['developments']:
            self.assertEqual(set(entry),set(DEVELOPMENT_FIELDS))
            self.assertEqual(tuple(entry[k] for k in ('known','active','affordable','eligible','town')),(0,0,1,0,64))
            self.assertEqual((entry['goldCost'],entry['foodCost'],entry['orderCost']),(6,0 if entry['id']==1 else 2,1))
        self.assertEqual(len(initial['developmentPreviews']),len(initial['legal']))
        for index,forecast in enumerate(initial['developmentPreviews']):
            self.assertEqual(set(forecast),set(DEVELOPMENT_PREVIEW_FIELDS))
            self.assertEqual(forecast['actionIndex'],index)
        lines=output.splitlines()
        for tag in ('10 ','11 '):
            position=next(i for i,line in enumerate(lines) if line.startswith(tag))
            fields=lines[position].split()
            for replacement in (' '.join(fields[:-1]),' '.join(fields+['0'])):
                changed=lines.copy();changed[position]=replacement
                with self.assertRaises(RuntimeError):decode('\n'.join(changed))
            with self.assertRaises(RuntimeError):decode('\n'.join(line for line in lines if not line.startswith(tag)))
            with self.assertRaises(RuntimeError):decode(output+'\n'+lines[position])
        for tag,fields,field,value in (
            ('10 ',DEVELOPMENT_FIELDS,'id',2),('10 ',DEVELOPMENT_FIELDS,'known',2),
            ('10 ',DEVELOPMENT_FIELDS,'town',65),('10 ',DEVELOPMENT_FIELDS,'prerequisite',2),
            ('10 ',DEVELOPMENT_FIELDS,'goldCost',-1),('10 ',DEVELOPMENT_FIELDS,'eligible',2),
            ('10 ',DEVELOPMENT_FIELDS,'orderCost',0),
            ('11 ',DEVELOPMENT_PREVIEW_FIELDS,'actionIndex',1),
            ('11 ',DEVELOPMENT_PREVIEW_FIELDS,'blueKnownMask',8),
            ('11 ',DEVELOPMENT_PREVIEW_FIELDS,'redGoldAfter',-1),
        ):
            changed=lines.copy();position=next(i for i,line in enumerate(lines) if line.startswith(tag))
            values=changed[position].split();values[1+fields.index(field)]=str(value)
            changed[position]=' '.join(values)
            with self.assertRaises(RuntimeError):decode('\n'.join(changed))
        legacy=subprocess.run([str(ROOT/'out/kingdom-v7')],input='7 1 0 0 0\n',text=True,capture_output=True,check=True).stdout
        self.assertNotIn('developments',decode(legacy))
        with self.assertRaises(RuntimeError):decode(legacy+'\n'+next(line for line in lines if line.startswith('10 ')))

    def test_charter_rotation_and_canonical_research_town(self):
        before=play(self.source)
        self.assertEqual((row(before,1,1)['town'],row(before,1,1)['eligible']),(5,1))
        self.assertEqual((row(before,1,2)['town'],row(before,1,2)['prerequisiteMet'],row(before,1,2)['eligible']),(5,0,0))
        with self.assertRaises(ValueError):play(before['actions']+[[13,6,6,1]])
        with self.assertRaises(ValueError):play(before['actions']+[[13,5,5,2]])
        charter,forecast=self.advance(before,[13,5,5,1])
        self.assertEqual((forecast['outcome'],forecast['cost'],forecast['foodCost'],forecast['orderCost']),(9,6,0,1))
        self.assertEqual((row(charter,1,1)['known'],row(charter,1,1)['active'],row(charter,1,1)['eligible']),(1,1,0))
        self.assertEqual(charter['economy'][0]['goldIncome'],before['economy'][0]['goldIncome']+1)
        self.assertEqual((row(charter,1,2)['prerequisiteMet'],row(charter,1,2)['eligible']),(1,1))
        rotation,forecast=self.advance(charter,[13,5,5,2])
        self.assertEqual((forecast['cost'],forecast['foodCost'],forecast['orderCost']),(6,2,1))
        self.assertEqual((mask(rotation,1,'known'),mask(rotation,1,'active')),(3,3))
        self.assertEqual(rotation['economy'][0]['foodProduction'],charter['economy'][0]['foodProduction']+1)
        self.assertFalse(any(r['known'] for r in rotation['developments'] if r['side']==2))
        with self.assertRaises(ValueError):play(charter['actions']+[[13,5,5,1]])
        self.assertEqual(play(rotation['actions']),rotation)

    def test_muster_discount_and_knowledge_survive_capture(self):
        before=play(self.source[:27])
        charter,_=self.advance(before,[13,6,6,1])
        current,_=self.advance(charter,[0,0,0,0])
        current,_=self.advance(current,[0,0,0,0])
        normal=current['previews'][current['legal'].index([2,6,6,2])]
        muster,forecast=self.advance(current,[13,6,6,3])
        self.assertEqual((forecast['cost'],forecast['foodCost'],forecast['orderCost']),(6,2,1))
        self.assertEqual((mask(muster,1,'known'),mask(muster,1,'active')),(5,5))
        recruited,discount=self.advance(muster,[2,6,6,2])
        self.assertEqual((normal['cost'],discount['cost'],discount['foodCost']),(3,2,2))
        self.assertEqual(recruited['tiles'][6]['troops'],muster['tiles'][6]['troops']+2)
        current,_=self.advance(muster,[0,0,0,0])
        current,_=self.advance(current,[0,0,0,0])
        current,_=self.advance(current,[1,7,11,6])
        for origin,target in ((8,7),(7,6)):
            captures=[a for a,p in zip(current['legal'],current['previews']) if a[0]==1 and a[1]==origin and a[2]==target and p['outcome']==2]
            self.assertTrue(captures,'The directed native capture must remain legal.')
            current,_=self.advance(current,max(captures,key=lambda a:a[3]))
        self.assertEqual(current['tiles'][6]['owner'],2)
        self.assertEqual((mask(current,1,'known'),mask(current,1,'active'),mask(current,2,'known')),(5,0,0))
        captures=[a for a,p in zip(current['legal'],current['previews']) if a[0]==1 and a[1]==11 and a[2]==6 and p['outcome']==2]
        self.assertTrue(captures)
        restored,_=self.advance(current,max(captures,key=lambda a:a[3]))
        self.assertEqual((restored['tiles'][6]['owner'],mask(restored,1,'known'),mask(restored,1,'active')),(1,5,5))
        self.assertEqual(play(restored['actions']),restored)

    def test_projection_for_every_legal_order_in_researched_positions(self):
        traces=(self.source,self.source+[[13,5,5,1]],self.source+[[13,5,5,1],[13,5,5,2]])
        for trace in traces:
            before=play(trace)
            self.assertLessEqual(len(before['legal']),128)
            for action in before['legal']:
                with self.subTest(prefix=len(trace),action=action):self.advance(before,action)
            eligible=[(r['town'],r['id']) for r in before['developments'] if r['eligible']]
            research=[(a[1],a[3]) for a in before['legal'] if a[0]==13]
            self.assertEqual(eligible,research)


if __name__=='__main__':unittest.main()
