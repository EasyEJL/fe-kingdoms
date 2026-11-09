// Mocked DOM/transport only; this does not claim browser or human playtest coverage.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'../web/index.html'),'utf8');
const elements=new Map();
function element(){return {textContent:'',value:'0',disabled:false,hidden:false,files:[],children:[],style:{},attrs:{},append(e){this.children.push(e)},replaceChildren(){this.children=[]},setAttribute(k,v){this.attrs[k]=v},click(){}};}
const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id)};
const legacySaved=JSON.stringify({version:1,difficulty:0,actions:[[0,0,0,0]]});
const previousSaved=JSON.stringify({version:2,scenario:0,difficulty:0,actions:[[0,0,0,0]]});
const campaignSaved=JSON.stringify({version:3,scenario:0,difficulty:0,actions:[[0,0,0,0]]});
const storage=new Map([['fe-kingdoms-v1',legacySaved],['fe-kingdoms-v2',previousSaved],['fe-kingdoms-v3',campaignSaved],['fe-kingdoms-v4',JSON.stringify({version:4,scenario:0,difficulty:0,actions:[[0,0,0,0]]})]]);
let fetches=0,accept=false,response,requests=[],confirmations=[];
const context=vm.createContext({document:{getElementById:get,querySelectorAll:()=>[...elements.values()],createElement:element},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},confirm:message=>{confirmations.push(message);return accept},fetch:async(url,options)=>{fetches++;requests.push(JSON.parse(options.body));return response},console,setTimeout,URL,Blob});
vm.runInContext(html.split('<script>')[1].split('</script>')[0],context);
const run=s=>vm.runInContext(s,context),pass=[0,0,0,0],recruit=[2,0,0,2],move=[1,0,1,4],badAttack=[1,1,2,1];
const preview={foodCost:2,food1After:10,food2After:12,settlementAfter:0,index:1,outcome:4,cost:3,sourceTroops:7,targetTroops:7,targetOwner:1,nextSide:1,nextOrders:1,result:0,defense:0};
const start={version:4,difficulty:0,economy:[{side:1,food:12,goldIncome:3,foodProduction:3,foodUpkeep:3,foodNet:0,disconnectedTiles:0,shortageLossesNextTurn:0},{side:2,food:12,goldIncome:3,foodProduction:3,foodUpkeep:3,foodNet:0,disconnectedTiles:0,shortageLossesNextTurn:0}],map:{width:5,height:3,count:15,topology:1,scenario:0,blueCapital:0,redCapital:14,orderBudget:2,maxTurns:120},state:{side:1,orders:2,turn:1,result:0,gold1:8,gold2:8,nodes:0,depth:1},tiles:Array.from({length:15},(_,index)=>({index,q:index%5,r:Math.floor(index/5),owner:[0,1,5].includes(index)?1:0,troops:index===0?5:1,infantry:index===0?5:1,cavalry:0,siege:0,fort:0,supplied:1,settlement:index===5?1:0,passable:1,upkeep:index===0?2:0,terrain:index===0?4:0})),legal:[pass,recruit,move,badAttack],previews:[{index:0,outcome:0},preview,{index:2,outcome:1,sourceTroops:1,targetTroops:5},{index:3,outcome:3,sourceTroops:1,targetTroops:1,defense:1}],actions:[]};
function setGame(value){run('game='+JSON.stringify(value)+';render();')}
function reply(value){response={ok:true,json:async()=>JSON.parse(JSON.stringify(value))};}
function openCards(){return get('actions').children.filter(e=>e.className==='territory open')}
function orderButtons(card){return card.children[1].children.filter(e=>typeof e.onclick==='function')}
const untypedTiles=()=>start.tiles.map(({infantry,cavalry,siege,...t})=>t);
(async()=>{
 const recorded={...start,actions:[pass]};setGame(recorded);run('selected=5');
 get('new').onclick();assert.equal(fetches,0);assert.equal(run('selected'),5);
 get('file').files=[];await get('file').onchange();assert.equal(run('selected'),5);
 get('file').files=[{size:10,text:async()=>{throw Error('read failed')}}];await get('file').onchange();assert.equal(run('selected'),5);assert.match(get('error').textContent,/read failed/);assert.equal(run('busy'),false);
 await run("load('{bad')");assert.equal(fetches,0);
 response={ok:false,json:async()=>({error:'Fe rejected'})};await run('load('+JSON.stringify(storage.get('fe-kingdoms-v2'))+')');assert.equal(run('selected'),5);assert.equal(run('game.actions.length'),1);
 // New games are v4; hierarchy is immediately present even without preselection.
 accept=true;reply(start);await get('new').onclick();assert.equal(run('selected'),null);assert.equal(requests.at(-1).version,4);assert.equal(requests.at(-1).mode,1);
 assert.match(get('turn-guide').textContent,/orders TOTAL/);assert.match(get('opening-hint').textContent,/Open village A2.*2 food.*order 1.*B2.*order 2/);
 assert.equal(get('actions').children.length,3);assert.equal(openCards().length,0);assert.equal(get('global-actions').children.length,1);
 let before=fetches;get('actions').children[0].children[0].onclick();assert.equal(run('selected'),0);assert.equal(openCards().length,1);assert.equal(orderButtons(openCards()[0]).length,2);assert.equal(fetches,before);
 get('actions').children[1].children[0].onclick();assert.equal(run('selected'),1);assert.equal(openCards().length,1);assert.equal(orderButtons(openCards()[0]).length,1);assert.match(orderButtons(openCards()[0])[0].children[1].textContent,/all 1 attackers lost/); // Original preview index retained.
 get('board').children[5].onclick();assert.equal(run('selected'),5);assert.equal(openCards().length,1);assert.equal(fetches,before);
 get('actions').children[2].children[0].onclick();assert.equal(run('selected'),null);assert.equal(openCards().length,0);
 // True axial geometry, not a rectangular grid with clipped corners.
 assert.equal(get('board').children[0].style.left,'0px');assert.equal(get('board').children[5].style.left,'52px');assert.equal(get('board').children[5].style.top,'90px');assert.equal(get('board').children[10].style.left,'104px');
 const first={...start,state:{...start.state,orders:1,gold1:3},actions:[recruit]};reply(first);await run('perform('+JSON.stringify(recruit)+','+JSON.stringify(preview)+')');
 assert.equal(requests.at(-1).version,4);assert.equal(requests.at(-1).mode,1);assert.equal(run('game.state.orders'),1);assert.match(get('turn-guide').textContent,/Red has not moved/);assert.equal(get('opening-hint').textContent,'');
 const second={...first,state:{...first.state,side:2,orders:2,turn:2,gold2:8},actions:[recruit,move]};reply(second);before=fetches;await run('perform('+JSON.stringify(move)+','+JSON.stringify(start.previews[2])+')');
 assert.equal(fetches,before+1);assert.equal(requests.at(-1).mode,1);assert.equal(get('global-actions').children[0].textContent,'Run computer turn');
 const ai=[2,9,9,2],next={...start,state:{...start.state,turn:3,gold1:5,gold2:5},actions:[recruit,move,ai]};reply(next);await get('global-actions').children[0].onclick();assert.equal(requests.at(-1).mode,0);assert.match(get('activity').textContent,/Computer: 1. Recruit/);assert.match(get('status').textContent,/Round 2/);
 accept=false;before=fetches;await run('perform('+JSON.stringify(pass)+',game.previews[0])');assert.equal(fetches,before);assert.match(confirmations.at(-1),/give up 2/);
 await run('perform('+JSON.stringify(badAttack)+','+JSON.stringify(start.previews[3])+')');assert.equal(fetches,before);assert.match(confirmations.at(-1),/all 1 attackers lost/);
 assert.match(run('forecast([0,0,0,0],{outcome:0,result:3})'),/ends the match in a draw/i);assert.match(run('forecast([1,13,14,8],{outcome:2,result:1})'),/wins the match immediately/);
 // Loading v4 on Red still pauses. Legacy loads are read-only and preserve BOTH checkpoints.
 reply(second);await run('load('+JSON.stringify(JSON.stringify({version:4,scenario:0,difficulty:0,actions:second.actions}))+')');assert.equal(run('selected'),null);assert.equal(get('global-actions').children[0].textContent,'Run computer turn');
 const hexSaved=storage.get('fe-kingdoms-v4'),legacy={...start,tiles:untypedTiles(),economy:[],version:1,map:{...start.map,topology:0},actions:[pass]};reply(legacy);await get('legacy').onclick();assert.equal(requests.at(-1).version,1);assert.equal(requests.at(-1).mode,1);assert.equal(storage.get('fe-kingdoms-v1'),legacySaved);assert.equal(storage.get('fe-kingdoms-v4'),hexSaved);assert.equal(storage.get('fe-kingdoms-v3'),campaignSaved);assert.equal(storage.get('fe-kingdoms-v2'),previousSaved);assert.match(get('turn-guide').textContent,/read.only|original square rules/i);assert.match(get('global-actions').children[0].textContent,/Read-only/);assert.equal(get('board').children[5].style.left,'0px');assert.equal(get('board').children[5].style.top,'120px');
 before=fetches;await run('perform('+JSON.stringify(recruit)+','+JSON.stringify(preview)+')');assert.equal(fetches,before);assert.equal(run('replay().version'),1);
 // v2 is also read-only, retaining its own rules/checkpoint and the v4 save.
 const previous={...start,tiles:untypedTiles(),economy:[],version:2,actions:[pass]};reply(previous);await get('previous').onclick();assert.equal(requests.at(-1).version,2);assert.equal(storage.get('fe-kingdoms-v4'),hexSaved);assert.equal(storage.get('fe-kingdoms-v3'),campaignSaved);assert.equal(storage.get('fe-kingdoms-v2'),previousSaved);assert.equal(run('replay().version'),2);assert.match(get('status').textContent,/v2 hex replay/);
 before=fetches;await run('perform('+JSON.stringify(recruit)+','+JSON.stringify(preview)+')');assert.equal(fetches,before);
 // v3 campaigns retain economy but do not invent role counts or overwrite the v4 save.
 const campaign={...start,tiles:untypedTiles(),version:3,actions:[pass]};reply(campaign);await get('campaign').onclick();assert.equal(requests.at(-1).version,3);assert.equal(storage.get('fe-kingdoms-v3'),campaignSaved);assert.equal(storage.get('fe-kingdoms-v4'),hexSaved);assert.equal(run('replay().version'),3);assert.match(get('status').textContent,/v3 campaign replay/);assert.equal(get('economy').children.length,2);run('selected=0;render()');assert.doesNotMatch(get('territory-detail').textContent,/Infantry/);
 before=fetches;await run('perform('+JSON.stringify(recruit)+','+JSON.stringify(preview)+')');assert.equal(fetches,before);
 // All three map choices use engine dimensions and retain their scenario in saves.
 accept=true;
 for(const [scenario,width,height] of [[0,5,3],[1,7,5],[2,9,5]]){
  const mapped={...start,map:{...start.map,scenario,width,height,count:width*height,redCapital:width*height-1},tiles:Array.from({length:width*height},(_,index)=>({...start.tiles[0],index,q:index%width,r:Math.floor(index/width),owner:[0,1,width].includes(index)?1:0,terrain:index===0?4:0}))};
  get('scenario').value=String(scenario);reply(mapped);await get('new').onclick();assert.equal(requests.at(-1).scenario,scenario);assert.equal(requests.at(-1).version,4);assert.equal(get('board').children.length,width*height);assert.equal(run('replay().scenario'),scenario);assert.match(get('goal').textContent,new RegExp(String.fromCharCode(64+width)+height));assert.equal(get('board').children[width].style.left,'52px');
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
 // Role counts and power are Fe observations, not inferred from totals or bonuses.
 const roles={...start,tiles:start.tiles.map(t=>t.index===0?{...t,troops:8,infantry:3,cavalry:4,siege:1}:t)};setGame(roles);run('selected=0;render()');assert.match(get('territory-detail').textContent,/Infantry 3, cavalry 4, siege 1/);assert.match(openCards()[0].children[1].children[0].textContent,/Infantry 3, cavalry 4, siege 1/);
 assert.equal(get('board').children[0].children[0].children[2].textContent,'8'); // Compact map keeps total only.
 const typedPreview={outcome:2,result:0,sourceTroops:5,targetTroops:2,defense:6,movingInfantry:1,movingCavalry:2,movingSiege:3,attackPower:91,sourceInfantry:4,sourceCavalry:0,sourceSiege:1,targetInfantry:0,targetCavalry:1,targetSiege:1};
 const typedText=run('forecast([1,0,6,6],'+JSON.stringify(typedPreview)+')');assert.match(typedText,/Moving force: Infantry 1, cavalry 2, siege 3/);assert.match(typedText,/Attack power: 91/);assert.match(typedText,/Source after: Infantry 4, cavalry 0, siege 1/);assert.match(typedText,/Target after: Infantry 0, cavalry 1, siege 1/);
 assert.match(run('forecast([1,0,14,6],'+JSON.stringify({...typedPreview,result:1})+')'),/wins the match immediately.*Attack power: 91/);
 for(const [kind,label] of [[2,/Recruit \+2 infantry/],[5,/Recruit \+1 cavalry/],[6,/Recruit \+1 siege/],[7,/Train 1 infantry -> cavalry/],[8,/Train 1 infantry -> siege/]])assert.match(run('actionName(['+kind+',0,0,1])'),label);
 assert.match(run('forecast([7,0,0,1],{outcome:4,cost:4,foodCost:2,targetTroops:8,targetInfantry:2,targetCavalry:5,targetSiege:1})'),/Converts 1 infantry into cavalry.*4 gold, 2 food.*Target after: Infantry 2, cavalry 5, siege 1/);
 assert.match(run('forecast([8,0,0,1],{outcome:4,cost:5,foodCost:3,targetTroops:8},true)'),/Converted 1 infantry into siege.*5 gold, 3 food/);
 // Explicit training changes Fe-provided composition, not Fe-provided total strength.
 const trainAction=[7,5,5,1],trainPreview={index:1,outcome:4,cost:4,foodCost:2,sourceTroops:8,targetTroops:8,targetOwner:1,nextSide:1,nextOrders:1,result:0,defense:0,food1After:10,sourceInfantry:2,sourceCavalry:5,sourceSiege:1,targetInfantry:2,targetCavalry:5,targetSiege:1};
 const trainingBefore={...start,tiles:start.tiles.map(t=>t.index===5?{...t,settlement:2,troops:8,infantry:3,cavalry:4,siege:1}:t),legal:[pass,trainAction],previews:[start.previews[0],trainPreview]};setGame(trainingBefore);run('selected=5;render()');assert.equal(run('game.tiles[5].troops'),8);assert.match(get('territory-detail').textContent,/Infantry 3, cavalry 4, siege 1/);assert.match(orderButtons(openCards()[0])[0].children[0].textContent,/Train 1 infantry -> cavalry/);assert.match(orderButtons(openCards()[0])[0].children[1].textContent,/Would have 8 troops/);
 const trainingAfter={...trainingBefore,state:{...start.state,orders:1,gold1:4},tiles:trainingBefore.tiles.map(t=>t.index===5?{...t,infantry:2,cavalry:5,siege:1}:t),actions:[trainAction]};reply(trainingAfter);await run('perform('+JSON.stringify(trainAction)+','+JSON.stringify(trainPreview)+')');assert.equal(run('game.tiles[5].troops'),8);assert.match(get('territory-detail').textContent,/Infantry 2, cavalry 5, siege 1/);assert.match(get('human-activity').textContent,/Train 1 infantry -> cavalry.*Converted 1 infantry/);assert.equal(requests.at(-1).actions[0][0],7);
 const beforeRoles={...start,version:3,tiles:untypedTiles()};setGame(beforeRoles);assert.match(run('actionName([2,0,0,2])'),/Recruit \+2 troops/);assert.doesNotMatch(run('forecast([1,0,6,4],{outcome:2,sourceTroops:1,targetTroops:3,defense:1})'),/Moving force|Attack power|Infantry/);
 const old={...start};delete old.previews;setGame(old);assert.doesNotThrow(()=>run('render()'));assert.equal(run('busy'),false);
 console.log('UI unit tests passed: axial hex geometry, one-open owned-territory hierarchy, forecast indexing, explicit turns, confirmations and v4 role forecasts, campaign economy/maps and isolated v1/v2/v3/v4 replay checkpoints.');
})().catch(e=>{console.error(e);process.exitCode=1});
