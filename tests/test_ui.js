// Mocked DOM/transport only; this does not claim browser or human playtest coverage.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'../web/index.html'),'utf8');
const elements=new Map();
function element(){return {textContent:'',value:'0',disabled:false,hidden:false,files:[],children:[],style:{},attrs:{},append(e){this.children.push(e)},replaceChildren(){this.children=[]},setAttribute(k,v){this.attrs[k]=v},click(){}};}
const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id)};
const legacySaved=JSON.stringify({version:1,difficulty:0,actions:[[0,0,0,0]]});
const previousSaved=JSON.stringify({version:2,scenario:0,difficulty:0,actions:[[0,0,0,0]]});
const storage=new Map([['fe-kingdoms-v1',legacySaved],['fe-kingdoms-v2',previousSaved],['fe-kingdoms-v3',JSON.stringify({version:3,scenario:0,difficulty:0,actions:[[0,0,0,0]]})]]);
let fetches=0,accept=false,response,requests=[],confirmations=[];
const context=vm.createContext({document:{getElementById:get,querySelectorAll:()=>[...elements.values()],createElement:element},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},confirm:message=>{confirmations.push(message);return accept},fetch:async(url,options)=>{fetches++;requests.push(JSON.parse(options.body));return response},console,setTimeout,URL,Blob});
vm.runInContext(html.split('<script>')[1].split('</script>')[0],context);
const run=s=>vm.runInContext(s,context),pass=[0,0,0,0],recruit=[2,0,0,2],move=[1,0,1,4],badAttack=[1,1,2,1];
const preview={foodCost:2,food1After:10,food2After:12,settlementAfter:0,index:1,outcome:4,cost:3,sourceTroops:7,targetTroops:7,targetOwner:1,nextSide:1,nextOrders:1,result:0,defense:0};
const start={version:3,difficulty:0,economy:[{side:1,food:12,goldIncome:3,foodProduction:3,foodUpkeep:3,foodNet:0,disconnectedTiles:0,shortageLossesNextTurn:0},{side:2,food:12,goldIncome:3,foodProduction:3,foodUpkeep:3,foodNet:0,disconnectedTiles:0,shortageLossesNextTurn:0}],map:{width:5,height:3,count:15,topology:1,scenario:0,blueCapital:0,redCapital:14,orderBudget:2,maxTurns:120},state:{side:1,orders:2,turn:1,result:0,gold1:8,gold2:8,nodes:0,depth:1},tiles:Array.from({length:15},(_,index)=>({index,q:index%5,r:Math.floor(index/5),owner:[0,1,5].includes(index)?1:0,troops:index===0?5:1,fort:0,supplied:1,settlement:index===5?1:0,passable:1,upkeep:index===0?2:0,terrain:index===0?4:0})),legal:[pass,recruit,move,badAttack],previews:[{index:0,outcome:0},preview,{index:2,outcome:1,sourceTroops:1,targetTroops:5},{index:3,outcome:3,sourceTroops:1,targetTroops:1,defense:1}],actions:[]};
function setGame(value){run('game='+JSON.stringify(value)+';render();')}
function reply(value){response={ok:true,json:async()=>JSON.parse(JSON.stringify(value))};}
function openCards(){return get('actions').children.filter(e=>e.className==='territory open')}
(async()=>{
 const recorded={...start,actions:[pass]};setGame(recorded);run('selected=5');
 get('new').onclick();assert.equal(fetches,0);assert.equal(run('selected'),5);
 get('file').files=[];await get('file').onchange();assert.equal(run('selected'),5);
 get('file').files=[{size:10,text:async()=>{throw Error('read failed')}}];await get('file').onchange();assert.equal(run('selected'),5);assert.match(get('error').textContent,/read failed/);assert.equal(run('busy'),false);
 await run("load('{bad')");assert.equal(fetches,0);
 response={ok:false,json:async()=>({error:'Fe rejected'})};await run('load('+JSON.stringify(storage.get('fe-kingdoms-v2'))+')');assert.equal(run('selected'),5);assert.equal(run('game.actions.length'),1);
 // New games are v3; hierarchy is immediately present even without preselection.
 accept=true;reply(start);await get('new').onclick();assert.equal(run('selected'),null);assert.equal(requests.at(-1).version,3);assert.equal(requests.at(-1).mode,1);
 assert.match(get('turn-guide').textContent,/orders TOTAL/);assert.match(get('opening-hint').textContent,/Open village A2.*2 food.*order 1.*B2.*order 2/);
 assert.equal(get('actions').children.length,3);assert.equal(openCards().length,0);assert.equal(get('global-actions').children.length,1);
 let before=fetches;get('actions').children[0].children[0].onclick();assert.equal(run('selected'),0);assert.equal(openCards().length,1);assert.equal(openCards()[0].children[1].children.length,2);assert.equal(fetches,before);
 get('actions').children[1].children[0].onclick();assert.equal(run('selected'),1);assert.equal(openCards().length,1);assert.equal(openCards()[0].children[1].children.length,1);assert.match(openCards()[0].children[1].children[0].children[1].textContent,/all 1 attackers lost/); // Original preview index retained.
 get('board').children[5].onclick();assert.equal(run('selected'),5);assert.equal(openCards().length,1);assert.equal(fetches,before);
 get('actions').children[2].children[0].onclick();assert.equal(run('selected'),null);assert.equal(openCards().length,0);
 // True axial geometry, not a rectangular grid with clipped corners.
 assert.equal(get('board').children[0].style.left,'0px');assert.equal(get('board').children[5].style.left,'52px');assert.equal(get('board').children[5].style.top,'90px');assert.equal(get('board').children[10].style.left,'104px');
 const first={...start,state:{...start.state,orders:1,gold1:3},actions:[recruit]};reply(first);await run('perform('+JSON.stringify(recruit)+','+JSON.stringify(preview)+')');
 assert.equal(requests.at(-1).version,3);assert.equal(requests.at(-1).mode,1);assert.equal(run('game.state.orders'),1);assert.match(get('turn-guide').textContent,/Red has not moved/);assert.equal(get('opening-hint').textContent,'');
 const second={...first,state:{...first.state,side:2,orders:2,turn:2,gold2:8},actions:[recruit,move]};reply(second);before=fetches;await run('perform('+JSON.stringify(move)+','+JSON.stringify(start.previews[2])+')');
 assert.equal(fetches,before+1);assert.equal(requests.at(-1).mode,1);assert.equal(get('global-actions').children[0].textContent,'Run computer turn');
 const ai=[2,9,9,2],next={...start,state:{...start.state,turn:3,gold1:5,gold2:5},actions:[recruit,move,ai]};reply(next);await get('global-actions').children[0].onclick();assert.equal(requests.at(-1).mode,0);assert.match(get('activity').textContent,/Computer: 1. Recruit/);assert.match(get('status').textContent,/Round 2/);
 accept=false;before=fetches;await run('perform('+JSON.stringify(pass)+',game.previews[0])');assert.equal(fetches,before);assert.match(confirmations.at(-1),/give up 2/);
 await run('perform('+JSON.stringify(badAttack)+','+JSON.stringify(start.previews[3])+')');assert.equal(fetches,before);assert.match(confirmations.at(-1),/all 1 attackers lost/);
 assert.match(run('forecast([0,0,0,0],{outcome:0,result:3})'),/ends the match in a draw/i);assert.match(run('forecast([1,13,14,8],{outcome:2,result:1})'),/wins the match immediately/);
 // Loading v3 on Red still pauses. Legacy loads are read-only and preserve BOTH checkpoints.
 reply(second);await run('load('+JSON.stringify(JSON.stringify({version:3,scenario:0,difficulty:0,actions:second.actions}))+')');assert.equal(run('selected'),null);assert.equal(get('global-actions').children[0].textContent,'Run computer turn');
 const hexSaved=storage.get('fe-kingdoms-v3'),legacy={...start,version:1,map:{...start.map,topology:0},actions:[pass]};reply(legacy);await get('legacy').onclick();assert.equal(requests.at(-1).version,1);assert.equal(requests.at(-1).mode,1);assert.equal(storage.get('fe-kingdoms-v1'),legacySaved);assert.equal(storage.get('fe-kingdoms-v3'),hexSaved);assert.equal(storage.get('fe-kingdoms-v2'),previousSaved);assert.match(get('turn-guide').textContent,/read.only|original square rules/i);assert.match(get('global-actions').children[0].textContent,/Read-only/);assert.equal(get('board').children[5].style.left,'0px');assert.equal(get('board').children[5].style.top,'120px');
 before=fetches;await run('perform('+JSON.stringify(recruit)+','+JSON.stringify(preview)+')');assert.equal(fetches,before);assert.equal(run('replay().version'),1);
 // v2 is also read-only, retaining its own rules/checkpoint and the v3 save.
 const previous={...start,version:2,actions:[pass]};reply(previous);await get('previous').onclick();assert.equal(requests.at(-1).version,2);assert.equal(storage.get('fe-kingdoms-v3'),hexSaved);assert.equal(storage.get('fe-kingdoms-v2'),previousSaved);assert.equal(run('replay().version'),2);assert.match(get('status').textContent,/v2 hex replay/);
 before=fetches;await run('perform('+JSON.stringify(recruit)+','+JSON.stringify(preview)+')');assert.equal(fetches,before);
 // All three map choices use engine dimensions and retain their scenario in saves.
 accept=true;
 for(const [scenario,width,height] of [[0,5,3],[1,7,5],[2,9,5]]){
  const mapped={...start,map:{...start.map,scenario,width,height,count:width*height,redCapital:width*height-1},tiles:Array.from({length:width*height},(_,index)=>({...start.tiles[0],index,q:index%width,r:Math.floor(index/width),owner:[0,1,width].includes(index)?1:0,terrain:index===0?4:0}))};
  get('scenario').value=String(scenario);reply(mapped);await get('new').onclick();assert.equal(requests.at(-1).scenario,scenario);assert.equal(requests.at(-1).version,3);assert.equal(get('board').children.length,width*height);assert.equal(run('replay().scenario'),scenario);assert.match(get('goal').textContent,new RegExp(String.fromCharCode(64+width)+height));assert.equal(get('board').children[width].style.left,'52px');
 }
 // Economy, warnings and forecasts display Fe values, not browser calculations.
 const resource={...start,economy:[{side:1,food:4,goldIncome:7,foodProduction:17,foodUpkeep:9,foodNet:8,disconnectedTiles:2,shortageLossesNextTurn:3}],tiles:start.tiles.map(t=>t.index===2?{...t,terrain:5,passable:0,troops:0}:t)};setGame(resource);
 assert.match(get('economy').children[0].textContent,/4 food.*7 gold.*17 food produced.*9 food upkeep.*balance before storage cap \+8/);assert.match(get('economy').children[0].textContent,/projects 3 troop losses/);assert.match(get('economy').children[0].textContent,/2 cut-off territories/);
 const capped={...resource,economy:[{side:1,food:40,goldIncome:2,foodProduction:5,foodUpkeep:3,foodNet:2,projectedFood:37,disconnectedTiles:0,shortageLossesNextTurn:0}]};setGame(capped);
 assert.match(get('economy').children[0].textContent,/40 food.*balance before storage cap \+2/);assert.match(get('economy').children[0].textContent,/next upkeep leaves 37 food/);assert.doesNotMatch(get('economy').children[0].textContent,/leaves 42 food/);
 // Display even a deliberately distinct engine projection verbatim rather than recomputing it.
 setGame({...capped,economy:[{...capped.economy[0],projectedFood:31}]});assert.match(get('economy').children[0].textContent,/next upkeep leaves 31 food/);
 setGame(resource);
 run('selected=2;render()');assert.match(get('territory-detail').textContent,/impassable/);assert.match(get('board').children[2].className,/blocked/);
 run('selected=1;render()');assert.match(get('territory-detail').textContent,/Recruiting requires/);
 run('selected=5;render()');assert.match(get('territory-detail').textContent,/Settlement: Village.*Food upkeep/);
 assert.match(run('forecast([2,0,0,2],'+JSON.stringify(preview)+')'),/3 gold, 2 food/);
 assert.match(run('actionName([4,1,1,1])'),/Build village/);assert.match(run('actionName([4,1,1,2])'),/Upgrade to town/);
 assert.match(run('forecast([4,1,1,1],{outcome:6,cost:6,foodCost:0,settlementAfter:1})'),/6 gold.*Village/);assert.match(run('forecast([4,1,1,2],{outcome:6,cost:8,settlementAfter:2},true)'),/8 gold.*Town/);
 const old={...start};delete old.previews;setGame(old);assert.doesNotThrow(()=>run('render()'));assert.equal(run('busy'),false);
 console.log('UI unit tests passed: axial hex geometry, one-open owned-territory hierarchy, forecast indexing, explicit turns, confirmations and v3 campaign economy/maps and isolated v1/v2/v3 replay checkpoints.');
})().catch(e=>{console.error(e);process.exitCode=1});
