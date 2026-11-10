"""Local transport only; the native Fe executable owns all game decisions."""
import argparse
import json
import os
from pathlib import Path
import subprocess
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = Path(__file__).resolve().parent
MAX_BODY = 262144
CURRENT_VERSION = 8
MAX_ACTIONS = 2048
DECISION_FIELDS = ('traceIndex','side','kind','from','to','amount','focus','target',
                   'depth','nodes','searchScore','beforeScore','afterScore',
                   'materialDelta','resourcesDelta','supplyDelta','economyDelta',
                   'positionDelta','pressureDelta','focusDelta','terminalDelta',
                   'highlight','orderCost')
DEVELOPMENT_FIELDS = ('side','id','known','active','goldCost','foodCost','orderCost',
                      'prerequisite','prerequisiteMet','town','affordable','eligible')
DEVELOPMENT_PREVIEW_FIELDS = ('actionIndex','blueKnownMask','redKnownMask','blueActiveMask','redActiveMask',
                             'blueGoldIncome','redGoldIncome','blueFoodProduction','redFoodProduction',
                             'blueUpkeep','redUpkeep','blueGoldAfter','redGoldAfter')


def request_text(data):
    if not isinstance(data, dict) or set(data) - {'version','scenario','mode','difficulty','actions'}:
        raise ValueError('Expected version, scenario, mode, difficulty, and actions only.')
    version, scenario = data.get('version'), data.get('scenario',0)
    if type(version) is not int or version not in (1,2,3,4,5,6,7,8):
        raise ValueError('Missing or unsupported replay version. Refresh the page for the hex game.')
    if type(scenario) is not int or not 0<=scenario<=2 or (version<3 and scenario!=0):
        raise ValueError('Unsupported map scenario.')
    if version<CURRENT_VERSION and data.get('mode',0)!=1:
        raise ValueError('Older rule-version replays are read-only. Start a new campaign game to play.')
    mode, difficulty, actions = data.get('mode', 0), data.get('difficulty'), data.get('actions')
    if type(mode) is not int or mode not in (0, 1) or type(difficulty) is not int or difficulty not in (0, 1):
        raise ValueError('Invalid mode or difficulty.')
    if not isinstance(actions, list) or len(actions) > (MAX_ACTIONS if version >= 5 else 240):
        raise ValueError(f'Replay must contain at most {MAX_ACTIONS if version >= 5 else 240} actions.')
    for action in actions:
        if not isinstance(action, list) or len(action) != 4 or any(type(n) is not int or not 0 <= n <= 4294967295 for n in action):
            raise ValueError('Each action must contain four unsigned integers.')
    header = f'{version} {mode} {difficulty} '+(f'{scenario} ' if version>=2 else '')+f'{len(actions)}\n'
    return header + ''.join(' '.join(map(str, a)) + '\n' for a in actions)


def decode(text):
    data = {'tiles': [], 'legal': [], 'actions': [], 'previews': [], 'economy': [], 'supply': []}
    count = None
    for line in text.splitlines():
        try:
            fields = [int(n) for n in line.split()]
        except ValueError as error:
            raise RuntimeError('Unexpected native engine output.') from error
        if not fields:
            continue
        tag, values = fields[0], fields[1:]
        version = data.get('version', 0)
        if tag == 0 and len(values) == 3 and 'version' not in data and values[0] in range(1, CURRENT_VERSION + 1):
            data['version'], data['difficulty'], count = values
            if data['version'] >= 7:
                data['decisions'] = []
            if data['version'] == 8:
                data['developments'] = []
                data['developmentPreviews'] = []
        elif tag == 1 and version and len(values) == (17 if version >= 5 else 13) and 'state' not in data:
            data['state'] = dict(zip(('side', 'orders', 'turn', 'result', 'gold1', 'gold2', 'quiet', 'lastKind', 'lastFrom', 'lastTo', 'lastAmount', 'nodes', 'depth', 'completedRounds', 'roundLimit', 'decisionPending', 'traceCapacityReached'), values))
        elif tag == 2 and len(values) == {1:6,2:8,3:11,4:14,5:14,6:14,7:18,8:18}.get(version):
            data['tiles'].append(dict(zip(('index', 'owner', 'troops', 'fort', 'supplied', 'terrain','q','r','settlement','passable','upkeep','infantry','cavalry','siege','defense','specialty','crossingSite','constructedBridge'), values)))
        elif tag == 6 and version >= 2 and len(values) == (11 if version >= 5 else 9) and 'map' not in data:
            limit_key = 'baseRoundLimit' if data.get('version',0) >= 5 else 'maxTurns'
            data['map']=dict(zip(('width','height','count','topology','scenario','blueCapital','redCapital','orderBudget',limit_key,'extensionRounds','traceCapacity'),values))
        elif tag == 7 and version >= 3 and len(values)==9 and values[0]==len(data['economy'])+1:
            data['economy'].append(dict(zip(('side','food','goldIncome','foodProduction','foodUpkeep','foodNet','disconnectedTiles','shortageLossesNextTurn','projectedFood'),values)))
        elif tag == 8 and version >= 6 and len(values)==3 and values[0]==len(data['supply'])+1:
            data['supply'].append(dict(zip(('side','connectedOwned','cutOffOwned'),values)))
        elif tag == 9 and version >= 7 and len(values)==len(DECISION_FIELDS) and len(data['decisions'])<2:
            data['decisions'].append(dict(zip(DECISION_FIELDS,values)))
        elif tag == 10 and version == 8 and len(values)==len(DEVELOPMENT_FIELDS) and len(data['developments'])<6 and values[:2]==[1+len(data['developments'])//3,1+len(data['developments'])%3]:
            data['developments'].append(dict(zip(DEVELOPMENT_FIELDS,values)))
        elif tag == 11 and version == 8 and len(values)==len(DEVELOPMENT_PREVIEW_FIELDS) and values[0]==len(data['developmentPreviews']):
            data['developmentPreviews'].append(dict(zip(DEVELOPMENT_PREVIEW_FIELDS,values)))
        elif tag == 3 and version and len(values) == 4:
            data['legal'].append(values)
        elif tag == 5 and len(values) == {1:10,2:10,3:14,4:24,5:24,6:28,7:32,8:32}.get(version) and values[0] == len(data['previews']):
            data['previews'].append(dict(zip(('index','outcome','cost','sourceTroops','targetTroops','targetOwner','nextSide','nextOrders','result','defense','foodCost','settlementAfter','food1After','food2After','movingInfantry','movingCavalry','movingSiege','attackPower','sourceInfantry','sourceCavalry','sourceSiege','targetInfantry','targetCavalry','targetSiege','blueConnectedAfter','blueCutOffAfter','redConnectedAfter','redCutOffAfter','orderCost','targetSpecialty','targetTerrain','targetPassable'),values)))
        elif tag == 4 and version and len(values) == 5 and values[0] == len(data['actions']):
            data['actions'].append(values[1:])
        else:
            raise RuntimeError('Unexpected native engine output.')
    if data.get('version')==1:
        data['map']=dict(width=5,height=3,count=15,topology=0,scenario=0,blueCapital=0,redCapital=14,orderBudget=2,maxTurns=120)
        for tile in data['tiles']: tile.update(q=tile['index']%5,r=tile['index']//5)
    if data.get('version') not in (1,2,3,4,5,6,7,8) or (data.get('version',0) >= 5 and ('traceCapacityReached' not in data.get('state',{}) or 'traceCapacity' not in data.get('map',{}))) or (data.get('version',0) >= 6 and (len(data['supply'])!=2 or any('redCutOffAfter' not in p for p in data['previews']))) or 'state' not in data or 'map' not in data or not 1<=data['map']['count']<=63 or len(data['tiles'])!=data['map']['count'] or [t['index'] for t in data['tiles']]!=list(range(data['map']['count'])) or len(data['actions']) != count or len(data['previews']) != len(data['legal']) or (data.get('version',0)>=3 and len(data['economy'])!=2):
        raise RuntimeError('Incomplete native engine response.')
    if data['version'] >= 7:
        decisions=data['decisions']
        suffix=list(range(len(data['actions'])-len(decisions),len(data['actions'])))
        if data['difficulty'] not in (0,1) or len(data['actions'])>MAX_ACTIONS or [d['traceIndex'] for d in decisions]!=suffix:
            raise RuntimeError('Invalid native decision trace.')
        for decision in decisions:
            index=decision['traceIndex']
            if (not 0<=index<MAX_ACTIONS or decision['side'] not in (1,2)
                    or decision['focus'] not in (1,2,3,4)
                    or not (decision['target']==64 if decision['focus']==3 else 0<=decision['target']<data['map']['count'])
                    or decision['depth']!=(1 if data['difficulty']==0 else 4)
                    or decision['nodes']<=0 or not 0<=decision['highlight']<=8
                    or decision['orderCost'] not in (1,2)
                    or sum(decision[field] for field in DECISION_FIELDS[13:21])!=decision['afterScore']-decision['beforeScore']
                    or [decision[field] for field in ('kind','from','to','amount')]!=data['actions'][index]):
                raise RuntimeError('Invalid native decision record.')
    if data['version'] == 8:
        if len(data['developments'])!=6 or len(data['developmentPreviews'])!=len(data['legal']):
            raise RuntimeError('Incomplete native development response.')
        for development in data['developments']:
            if (any(development[field] not in (0,1) for field in ('known','active','prerequisiteMet','affordable','eligible'))
                    or development['prerequisite'] not in (0,1)
                    or not (development['town']==64 or 0<=development['town']<data['map']['count'])
                    or development['orderCost']<=0
                    or any(development[field]<0 for field in ('goldCost','foodCost','orderCost'))):
                raise RuntimeError('Invalid native development record.')
        for forecast in data['developmentPreviews']:
            if (any(not 0<=forecast[field]<=7 for field in DEVELOPMENT_PREVIEW_FIELDS[1:5])
                    or any(forecast[field]<0 for field in DEVELOPMENT_PREVIEW_FIELDS[5:])):
                raise RuntimeError('Invalid native development forecast.')
    return data


def game(data):
    protocol = request_text(data)
    name='kingdom-v'+str(data['version']) if data['version']<CURRENT_VERSION else 'kingdom'
    executable = os.environ.get('KINGDOM_ENGINE', str(ROOT / 'out' / name))
    result = subprocess.run([executable], input=protocol, text=True, capture_output=True, timeout=30, cwd=ROOT)
    if result.returncode == 2:
        raise ValueError('Fe rejected this replay or action. Your previous board is unchanged.')
    if result.returncode:
        raise RuntimeError(f'Native engine failed (exit {result.returncode}).')
    response=decode(result.stdout)
    if data['version']>=7:
        added=len(response['actions'])-len(data['actions'])
        if (response['version']!=data['version'] or response['difficulty']!=data['difficulty'] or response['actions'][:len(data['actions'])]!=data['actions']
                or not 0<=added<=2 or len(response['decisions'])!=added
                or (data.get('mode',0)==1 and added)):
            raise RuntimeError('Native decisions do not match this request.')
    return response


class Handler(BaseHTTPRequestHandler):
    server_version = 'FeKingdoms/1'

    def setup(self):
        super().setup()
        self.connection.settimeout(35)

    def send_json(self, status, data):
        self.send_bytes(status, json.dumps(data).encode(), 'application/json; charset=utf-8')

    def send_bytes(self, status, body, content_type):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'")
        self.end_headers()
        self.wfile.write(body)

    def allowed(self):
        host = self.headers.get('Host', '')
        allowed = {f'localhost:{self.server.server_port}', f'127.0.0.1:{self.server.server_port}'}
        return host in allowed and self.headers.get('Origin', 'http://' + host) == 'http://' + host

    def do_GET(self):
        if not self.allowed():
            return self.send_json(403, {'error': 'Only same-origin localhost requests are accepted.'})
        if self.path in ('/', '/index.html'):
            return self.send_bytes(200, (ROOT / 'web' / 'index.html').read_bytes(), 'text/html; charset=utf-8')
        self.send_json(404, {'error': 'Not found.'})

    def do_POST(self):
        if not self.allowed():
            return self.send_json(403, {'error': 'Only same-origin localhost requests are accepted.'})
        if self.path != '/api/game':
            return self.send_json(404, {'error': 'Not found.'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= MAX_BODY:
                raise ValueError('Request body is missing or too large.')
            if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
                raise ValueError('Expected JSON content.')
            data = json.loads(self.rfile.read(length))
            self.send_json(200, game(data))
        except (ValueError, UnicodeError) as error:
            self.send_json(400, {'error': str(error)})
        except subprocess.TimeoutExpired:
            self.send_json(504, {'error': 'Fe search timed out. Your previous board is unchanged.'})
        except (RuntimeError, OSError):
            self.send_json(500, {'error': 'Native engine unavailable or returned invalid output. Check the server terminal.'})
            import traceback
            traceback.print_exc()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=8765)
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    server.timeout = 30
    print(f'Fe Kingdoms: http://localhost:{args.port}', flush=True)
    server.serve_forever()
