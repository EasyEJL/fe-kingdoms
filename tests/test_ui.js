// Mocked DOM/transport only; this does not claim browser or human playtest coverage.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'../web/index.html'),'utf8');
const elements=new Map();
function element(){return {textContent:'',value:'0',disabled:false,hidden:false,files:[],children:[],style:{},attrs:{},append(e){this.children.push(e)},replaceChildren(){this.children=[]},setAttribute(k,v){this.attrs[k]=v},click(){},focus(){}};}
const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id)};
const legacySaved=JSON.stringify({version:1,difficulty:0,actions:[[0,0,0,0]]});
const previousSaved=JSON.stringify({version:2,scenario:0,difficulty:0,actions:[[0,0,0,0]]});
const campaignSaved=JSON.stringify({version:3,scenario:0,difficulty:0,actions:[[0,0,0,0]]});
const storage=new Map([['fe-kingdoms-v1',legacySaved],['fe-kingdoms-v2',previousSaved],['fe-kingdoms-v3',campaignSaved],['fe-kingdoms-v4',JSON.stringify({version:4,scenario:0,difficulty:0,actions:[[0,0,0,0]]})],['fe-kingdoms-v5',JSON.stringify({version:5,scenario:0,difficulty:0,actions:[[0,0,0,0]]})],['fe-kingdoms-v8',JSON.stringify({version:8,scenario:0,difficulty:0,actions:[[0,0,0,0]]})]]);
const riversSaved=JSON.stringify({version:6,scenario:0,difficulty:0,actions:[[0,0,0,0]]});storage.set('fe-kingdoms-v6',riversSaved);
const frontiersSaved=JSON.stringify({version:7,scenario:0,difficulty:0,actions:[[0,0,0,0]]});storage.set('fe-kingdoms-v7',frontiersSaved);
const frontiersSlots=JSON.stringify({schema:1,slots:[{id:'1',name:'Frozen frontier',savedAt:'2026-11-10T00:00:00.000Z',replay:JSON.parse(frontiersSaved)}]});storage.set('fe-kingdoms-v7-slots-v1',frontiersSlots);
let fetches=0,accept=false,response,requests=[],confirmations=[];
const context=vm.createContext({document:{getElementById:get,querySelectorAll:()=>[...elements.values()],createElement:element},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},confirm:message=>{confirmations.push(message);return accept},fetch:async(url,options)=>{fetches++;requests.push(JSON.parse(options.body));return response},console,setTimeout,URL,Blob});
vm.runInContext(html.split('<script>')[1].split('</script>')[0],context);
const run=s=>vm.runInContext(s,context),pass=[0,0,0,0],recruit=[2,0,0,2],move=[1,0,1,4],badAttack=[1,1,2,1];
const preview={foodCost:2,food1After:10,food2After:12,settlementAfter:0,index:1,outcome:4,cost:3,sourceTroops:7,targetTroops:7,targetOwner:1,nextSide:1,nextOrders:1,result:0,defense:0};
const start={version:8,difficulty:0,economy:[{side:1,food:12,goldIncome:3,foodProduction:3,foodUpkeep:3,foodNet:0,disconnectedTiles:0,shortageLossesNextTurn:0},{side:2,food:12,goldIncome:3,foodProduction:3,foodUpkeep:3,foodNet:0,disconnectedTiles:0,shortageLossesNextTurn:0}],map:{width:5,height:3,count:15,topology:1,scenario:0,blueCapital:0,redCapital:14,orderBudget:2,baseRoundLimit:60,extensionRounds:20,traceCapacity:2048},state:{side:1,orders:2,turn:1,result:0,completedRounds:0,roundLimit:60,decisionPending:0,traceCapacityReached:0,gold1:8,gold2:8,nodes:0,depth:1},tiles:Array.from({length:15},(_,index)=>({index,q:index%5,r:Math.floor(index/5),owner:[0,1,5].includes(index)?1:0,troops:index===0?5:1,infantry:index===0?5:1,cavalry:0,siege:0,fort:0,supplied:1,settlement:index===5?1:0,passable:1,upkeep:index===0?2:0,terrain:index===0?4:0})),legal:[pass,recruit,move,badAttack],previews:[{index:0,outcome:0},preview,{index:2,outcome:1,sourceTroops:1,targetTroops:5},{index:3,outcome:3,sourceTroops:1,targetTroops:1,defense:1}],actions:[]};
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
 // New games are v6; hierarchy is immediately present even without preselection.
 accept=true;reply(start);await get('new').onclick();assert.equal(run('selected'),null);assert.equal(requests.at(-1).version,8);assert.equal(requests.at(-1).mode,1);
 assert.match(get('turn-guide').textContent,/orders TOTAL/);assert.match(get('opening-hint').textContent,/5 troops from A1 to B1.*order 1.*7 from B1 to forest B2.*order 2.*Fe forecast/);
 assert.equal(get('actions').children.length,3);assert.equal(openCards().length,0);assert.equal(get('global-actions').children.length,1);
 let before=fetches;get('actions').children[0].children[0].onclick();assert.equal(run('selected'),0);assert.equal(openCards().length,1);assert.equal(orderButtons(openCards()[0]).length,2);assert.equal(fetches,before);
 get('actions').children[1].children[0].onclick();assert.equal(run('selected'),1);assert.equal(openCards().length,1);assert.equal(orderButtons(openCards()[0]).length,1);assert.match(orderButtons(openCards()[0])[0].children[1].textContent,/all 1 attackers lost/); // Original preview index retained.
 get('board').children[5].onclick();assert.equal(run('selected'),5);assert.equal(openCards().length,1);assert.equal(fetches,before);
 get('actions').children[2].children[0].onclick();assert.equal(run('selected'),null);assert.equal(openCards().length,0);
 // True axial geometry, not a rectangular grid with clipped corners.
 assert.equal(get('board').children[0].style.left,'0px');assert.equal(get('board').children[5].style.left,'74px');assert.equal(get('board').children[5].style.top,'128px');assert.equal(get('board').children[10].style.left,'148px');
 const first={...start,state:{...start.state,orders:1,gold1:3},actions:[recruit]};reply(first);await run('perform('+JSON.stringify(recruit)+','+JSON.stringify(preview)+')');
 assert.equal(requests.at(-1).version,8);assert.equal(requests.at(-1).mode,1);assert.equal(run('game.state.orders'),1);assert.match(get('turn-guide').textContent,/Red has not moved/);assert.equal(get('opening-hint').textContent,'');
 const second={...first,state:{...first.state,side:2,orders:2,turn:2,gold2:8},actions:[recruit,move]};reply(second);before=fetches;await run('perform('+JSON.stringify(move)+','+JSON.stringify(start.previews[2])+')');
 assert.equal(fetches,before+1);assert.equal(requests.at(-1).mode,1);assert.equal(get('global-actions').children[0].textContent,'Run computer turn');
 const ai=[2,9,9,2],next={...start,state:{...start.state,turn:3,completedRounds:1,gold1:5,gold2:5},actions:[recruit,move,ai]};reply(next);await get('global-actions').children[0].onclick();assert.equal(requests.at(-1).mode,0);assert.match(get('activity').textContent,/Computer: 1. Recruit/);assert.match(get('status').textContent,/Completed rounds: 1 \/ 60/);
 accept=false;before=fetches;await run('perform('+JSON.stringify(pass)+',game.previews[0])');assert.equal(fetches,before);assert.match(confirmations.at(-1),/give up 2/);
 await run('perform('+JSON.stringify(badAttack)+','+JSON.stringify(start.previews[3])+')');assert.equal(fetches,before);assert.match(confirmations.at(-1),/all 1 attackers lost/);
 assert.match(run('forecast([0,0,0,0],{outcome:0,result:3})'),/ends the match in a draw/i);assert.match(run('forecast([1,13,14,8],{outcome:2,result:1})'),/wins the match immediately/);
 // Loading v6 on Red still pauses. Legacy loads are read-only and preserve BOTH checkpoints.
 accept=true;reply(second);await run('load('+JSON.stringify(JSON.stringify({version:8,scenario:0,difficulty:0,actions:second.actions}))+')');assert.equal(run('selected'),null);assert.equal(get('global-actions').children[0].textContent,'Run computer turn');
 const hexSaved=storage.get('fe-kingdoms-v8'),legacy={...start,tiles:untypedTiles(),economy:[],version:1,map:{...start.map,topology:0},actions:[pass]};reply(legacy);await get('legacy').onclick();assert.equal(requests.at(-1).version,1);assert.equal(requests.at(-1).mode,1);assert.equal(storage.get('fe-kingdoms-v1'),legacySaved);assert.equal(storage.get('fe-kingdoms-v8'),hexSaved);assert.equal(storage.get('fe-kingdoms-v3'),campaignSaved);assert.equal(storage.get('fe-kingdoms-v2'),previousSaved);assert.match(get('turn-guide').textContent,/read.only|original square rules/i);assert.match(get('global-actions').children[0].textContent,/Read-only/);assert.equal(get('board').children[5].style.left,'0px');assert.equal(get('board').children[5].style.top,'172px');
 before=fetches;await run('perform('+JSON.stringify(recruit)+','+JSON.stringify(preview)+')');assert.equal(fetches,before);assert.equal(run('replay().version'),1);
 // v2 is also read-only, retaining its own rules/checkpoint and the v6 save.
 const previous={...start,tiles:untypedTiles(),economy:[],version:2,actions:[pass]};reply(previous);await get('previous').onclick();assert.equal(requests.at(-1).version,2);assert.equal(storage.get('fe-kingdoms-v8'),hexSaved);assert.equal(storage.get('fe-kingdoms-v3'),campaignSaved);assert.equal(storage.get('fe-kingdoms-v2'),previousSaved);assert.equal(run('replay().version'),2);assert.match(get('status').textContent,/v2 hex replay/);
 before=fetches;await run('perform('+JSON.stringify(recruit)+','+JSON.stringify(preview)+')');assert.equal(fetches,before);
 // v3 campaigns retain economy but do not invent role counts or overwrite the v6 save.
 const campaign={...start,tiles:untypedTiles(),version:3,actions:[pass]};reply(campaign);await get('campaign').onclick();assert.equal(requests.at(-1).version,3);assert.equal(storage.get('fe-kingdoms-v3'),campaignSaved);assert.equal(storage.get('fe-kingdoms-v8'),hexSaved);assert.equal(run('replay().version'),3);assert.match(get('status').textContent,/v3 campaign replay/);assert.equal(get('economy').children.length,2);run('selected=0;render()');assert.doesNotMatch(get('territory-detail').textContent,/Infantry/);
 before=fetches;await run('perform('+JSON.stringify(recruit)+','+JSON.stringify(preview)+')');assert.equal(fetches,before);
 // All three map choices use engine dimensions and retain their scenario in saves.
 accept=true;
 for(const [scenario,width,height] of [[0,5,3],[1,7,5],[2,9,5]]){
  const mapped={...start,map:{...start.map,scenario,width,height,count:width*height,redCapital:width*height-1},tiles:Array.from({length:width*height},(_,index)=>({...start.tiles[0],index,q:index%width,r:Math.floor(index/width),owner:[0,1,width].includes(index)?1:0,terrain:index===0?4:0}))};
  get('scenario').value=String(scenario);reply(mapped);await get('new').onclick();assert.equal(requests.at(-1).scenario,scenario);assert.equal(requests.at(-1).version,8);assert.equal(get('board').children.length,width*height);assert.equal(run('replay().scenario'),scenario);assert.match(get('goal').textContent,new RegExp(String.fromCharCode(64+width)+height));assert.equal(get('board').children[width].style.left,'74px');
 }
 // Economy, warnings and forecasts display Fe values, not browser calculations.
 const resource={...start,economy:[{side:1,food:4,goldIncome:7,foodProduction:17,foodUpkeep:9,foodNet:8,disconnectedTiles:2,shortageLossesNextTurn:3}],tiles:start.tiles.map(t=>t.index===2?{...t,terrain:5,passable:0,troops:0}:t)};setGame(resource);
 assert.match(get('economy').children[0].textContent,/4 food.*7 gold.*17 food produced.*9 food upkeep.*balance before storage cap \+8/);assert.match(get('economy').children[0].textContent,/projects 3 troop losses/);assert.match(get('economy').children[0].textContent,/2 cut-off territories/);
 const capped={...resource,economy:[{side:1,food:40,goldIncome:2,foodProduction:5,foodUpkeep:3,foodNet:2,projectedFood:37,disconnectedTiles:0,shortageLossesNextTurn:0}]};setGame(capped);
 assert.match(get('economy').children[0].textContent,/40 food.*balance before storage cap \+2/);assert.match(get('economy').children[0].textContent,/next upkeep leaves 37 food/);assert.doesNotMatch(get('economy').children[0].textContent,/leaves 42 food/);
 // Display even a deliberately distinct engine projection verbatim rather than recomputing it.
 setGame({...capped,economy:[{...capped.economy[0],projectedFood:31}]});assert.match(get('economy').children[0].textContent,/next upkeep leaves 31 food/);
 setGame(resource);
 run('selected=2;render()');assert.match(get('territory-detail').textContent,/impassable.*route around the mountain/);assert.match(get('board').children[2].className,/blocked/);
 run('selected=1;render()');assert.match(get('territory-detail').textContent,/Recruiting requires/);
 run('selected=5;render()');assert.match(get('territory-detail').textContent,/Settlement: Village.*Food upkeep/);
 assert.match(run('forecast([2,0,0,2],'+JSON.stringify(preview)+')'),/3 gold, 2 food/);
 assert.match(run('actionName([4,1,1,1])'),/Build village/);assert.match(run('actionName([4,1,1,2])'),/Upgrade to town/);
 assert.match(run('forecast([4,1,1,1],{outcome:6,cost:6,foodCost:0,settlementAfter:1})'),/6 gold.*Village/);assert.match(run('forecast([4,1,1,2],{outcome:6,cost:8,settlementAfter:2},true)'),/8 gold.*Town/);
 // Role counts and power are Fe observations, not inferred from totals or bonuses.
 const roles={...start,tiles:start.tiles.map(t=>t.index===0?{...t,troops:8,infantry:3,cavalry:4,siege:1}:t)};setGame(roles);run('selected=0;render()');assert.match(get('territory-detail').textContent,/Infantry 3, cavalry 4, siege 1/);assert.match(openCards()[0].children[1].children[0].textContent,/Infantry 3, cavalry 4, siege 1/);
 assert.equal(get('board').children[0].children[0].children[4].textContent,'8 total | Fort 0');
 assert.deepEqual(get('board').children[0].children[0].children[3].children.map(e=>e.children[1].textContent),['3','4','1']);
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
 // Zoom changes presentation only, preserves selection/actions, and bounds extreme input.
 setGame(start);run('selected=0;render()');before=fetches;
 get('zoom-in').onclick();assert.equal(run('mapZoom'),1.15);assert.equal(get('zoom-label').textContent,'115%');assert.equal(get('board').style.transform,'scale(1.15)');assert.equal(run('selected'),0);assert.equal(fetches,before);
 run('zoomMap(99)');assert.equal(run('mapZoom'),2);run('zoomMap(0)');assert.equal(run('mapZoom'),.1);
 get('map-scroll').clientWidth=500;get('zoom-fit').onclick();assert.equal(parseFloat(get('map-stage').style.width),464);assert.equal(get('map-scroll').scrollLeft,0);
 setGame({...start,map:{...start.map,width:9,height:5}});get('map-scroll').clientWidth=320;get('zoom-fit').onclick();assert.equal(parseFloat(get('map-stage').style.width),284);assert.ok(run('mapZoom')<.35);assert.equal(fetches,before);
 get('zoom-reset').onclick();assert.equal(run('mapZoom'),1);assert.equal(get('map-stage').style.height,get('board').style.height);
 run('setBusy(true)');get('zoom-in').onclick();assert.equal(run('mapZoom'),1);run('setBusy(false)');
 assert.match(get('board').children[0].attrs['aria-label'],/Blue.*Infantry 5.*fort 0/);
 assert.equal(get('board').children[0].children[0].children[0].children[0].textContent,'BLUE');
 assert.equal(get('board').children[2].children[0].children[0].children[0].textContent,'N');
 const guide=openCards()[0].children[1].children.find(e=>e.className==='role-comparison').children[1];
 assert.match(orderButtons(openCards()[0])[0].children[2].textContent,/Infantry: two bodies/);
 const guideText=guide.children.map(e=>e.textContent||e.children[1].children.map(c=>c.textContent).join(' ')).join(' ');
 assert.match(guideText,/plus 1 attacking a plain or farm/);assert.match(guideText,/plus 2 against a fort, settlement OR capital/);assert.match(guideText,/All roles have base defense 1/);assert.match(guideText,/converts one infantry/);assert.match(guideText,/moving siege costs 2 orders anywhere/);assert.match(guideText,/highest cost among the actual moving troops/);assert.doesNotMatch(guideText,/No movement penalty|move one hex per order/);
 setGame({...capped,economy:[{...capped.economy[0],projectedFood:31}]});
 assert.equal(get('economy').children[0].children[0].children[1].children[0].value,31);
 setGame({...start,version:3,tiles:untypedTiles()});run('selected=0;render()');assert.equal(openCards()[0].children[1].children.some(e=>e.className==='role-guide'),false);assert.equal(get('board').children[0].children[0].children[3].children[0].attrs['aria-label'],'troops: 5');
 // v4 mixed-army replays remain inspectable/exportable without touching any checkpoint.
 const allCheckpoints=new Map(storage),mixed={...start,version:4,actions:[recruit],map:{...start.map,maxTurns:120}};
 reply(mixed);await get('roles').onclick();assert.equal(requests.at(-1).version,4);assert.equal(requests.at(-1).mode,1);
 assert.equal(run('replay().version'),4);assert.match(get('status').textContent,/Legacy v4 campaign replay/);assert.doesNotMatch(get('status').textContent,/Completed rounds/);
 for(const [key,value] of allCheckpoints)assert.equal(storage.get(key),value);
 before=fetches;await run('perform('+JSON.stringify(recruit)+','+JSON.stringify(preview)+')');assert.equal(fetches,before);
 assert.equal(get('roles').hidden,false);assert.equal(get('save').disabled,false);
 // Thresholds and progress are Fe data, including deliberately nonstandard values.
 for(const [scenario,limit] of [[0,60],[1,120],[2,180],[0,73]]){
  setGame({...start,map:{...start.map,scenario,baseRoundLimit:limit},state:{...start.state,roundLimit:limit,completedRounds:17}});
  assert.ok(get('status').textContent.includes('Completed rounds: 17 / '+limit));
  assert.ok(get('status').textContent.includes((limit-17)+' rounds until next decision'));
 }
 const extend=[9,0,0,0],draw=[10,0,0,0];
 const boundary={...start,state:{...start.state,side:2,orders:0,turn:120,completedRounds:60,roundLimit:60,decisionPending:1},actions:[recruit,move],legal:[extend,draw],previews:[{index:0,outcome:0,result:0},{index:1,outcome:0,result:3}]};
 setGame(boundary);run('selected=0;render()');before=fetches;
 assert.match(get('status').textContent,/Round limit reached.*Completed rounds: 60 \/ 60.*0 rounds until/);
 assert.match(get('turn-guide').textContent,/No next-turn income or orders/);
 assert.equal(get('order-guide').hidden,true);assert.equal(get('global-actions').children.length,2);assert.match(get('global-actions').children[0].children[0].textContent,/Extend by 20 rounds.*campaign decision/);
 assert.doesNotMatch(get('global-actions').children[0].children[0].textContent,/1 order/);
 assert.match(get('global-actions').children[0].children[1].textContent,/20 rounds.*Red does not move automatically/);
 assert.match(get('global-actions').children[1].children[0].textContent,/Accept draw/);assert.equal(orderButtons(openCards()[0]).length,0);
 assert.equal(get('board').children[0].className.includes('recent'),true); // Last real move still highlighted.
 await run('perform('+JSON.stringify(recruit)+','+JSON.stringify(preview)+')');assert.equal(fetches,before);
 accept=false;await get('global-actions').children[1].onclick();assert.equal(fetches,before);assert.match(confirmations.at(-1),/Accept a draw.*recorded/);
 // An extension is one recorded explicit request. Rapid double clicks cannot repeat it or run Red.
 const extended={...start,state:{...start.state,turn:121,completedRounds:60,roundLimit:80,gold1:19},actions:[...boundary.actions,extend]};
 get('activity').textContent='Computer: Round limit reached; choose whether to extend or draw.';reply(extended);const clicked=get('global-actions').children[0],pendingExtension=clicked.onclick();await clicked.onclick();await pendingExtension;
 assert.equal(fetches,before+1);assert.equal(requests.at(-1).mode,1);assert.deepEqual(requests.at(-1).actions.at(-1),extend);
 assert.equal(get('activity').textContent,'');assert.equal(get('order-guide').hidden,false);assert.equal(run('game.state.gold1'),19);assert.equal(run('game.state.orders'),2);assert.equal(run('game.state.side'),1);
 assert.match(get('status').textContent,/60 \/ 80.*20 rounds until/);assert.match(get('human-activity').textContent,/Extended.*20 rounds/);
 assert.doesNotMatch(get('board').children[0].className,/recent/);assert.equal(get('global-actions').children.length,1);
 before=fetches;await run('perform([9,0,0,0],{})');assert.equal(fetches,before);
 // Loading a boundary never runs Red or resolves the decision; only Fe legal options are rendered.
 accept=true;reply(boundary);await run('load('+JSON.stringify(JSON.stringify({version:8,scenario:0,difficulty:0,actions:boundary.actions}))+')');
 assert.equal(fetches,before+1);assert.equal(requests.at(-1).mode,1);assert.equal(get('global-actions').children.length,2);
 setGame({...boundary,legal:[draw],previews:[{result:3}]});assert.equal(get('global-actions').children.length,1);assert.match(get('global-actions').children[0].children[0].textContent,/Accept draw/);
 setGame(boundary);accept=true;const drawn={...boundary,state:{...boundary.state,result:3,decisionPending:0},actions:[...boundary.actions,draw],legal:[],previews:[]};reply(drawn);
 await get('global-actions').children[1].onclick();assert.equal(requests.at(-1).mode,1);assert.deepEqual(requests.at(-1).actions.at(-1),draw);assert.match(get('status').textContent,/Draw:/);assert.match(get('turn-guide').textContent,/Match complete/);
 // Capacity is a technical pause, even if reached at a decision boundary; result wins priority.
 const full={...boundary,state:{...boundary.state,traceCapacityReached:1},legal:[],previews:[]};setGame(full);run('selected=0;render()');
 assert.match(get('status').textContent,/Replay capacity reached: play paused/);assert.doesNotMatch(get('status').textContent,/Draw:/);
 assert.match(get('turn-guide').textContent,/match has not ended.*Save replay/);assert.match(get('global-actions').children[0].textContent,/2048 recorded actions/);
 assert.equal(orderButtons(openCards()[0]).length,0);assert.equal(get('save').disabled,false);before=fetches;
 await run('perform([9,0,0,0],{})');await run('perform([10,0,0,0],{})');assert.equal(fetches,before);
 for(const result of [1,2,3]){setGame({...full,state:{...full.state,result}});assert.match(get('turn-guide').textContent,/Match complete/);assert.doesNotMatch(get('status').textContent,/play paused/);}
 // Red's request stops at the boundary and reports the choice, never a ready Blue turn.
 setGame(second);reply({...boundary,actions:[...second.actions,ai]});before=fetches;await get('global-actions').children[0].onclick();
 assert.equal(fetches,before+1);assert.match(get('activity').textContent,/Round limit reached/);assert.doesNotMatch(get('activity').textContent,/Your turn is ready/);assert.equal(get('global-actions').children.length,2);
 setGame(second);reply({...full,actions:[...second.actions,ai]});await get('global-actions').children[0].onclick();assert.match(get('activity').textContent,/Replay capacity reached/);assert.doesNotMatch(get('activity').textContent,/Match ended|Your turn is ready/);
 // Failed decisions preserve the position and successful checkpoint, allowing a deliberate retry.
 setGame(boundary);const savedBefore=storage.get('fe-kingdoms-v8');response={ok:false,json:async()=>({error:'Decision rejected'})};
 await get('global-actions').children[0].onclick();assert.equal(run('game.state.decisionPending'),1);assert.equal(storage.get('fe-kingdoms-v8'),savedBefore);assert.equal(run('busy'),false);assert.match(get('error').textContent,/Decision rejected/);
 // New byte ceiling is inclusive; oversized files are rejected before reading or transport.
 before=fetches;let reads=0;get('file').files=[{size:262145,text:async()=>{reads++;return '{}'}}];await get('file').onchange();assert.equal(reads,0);assert.equal(fetches,before);assert.match(get('error').textContent,/too large/);
 reply(start);get('file').files=[{size:262144,text:async()=>{reads++;return JSON.stringify({version:8,scenario:0,difficulty:0,actions:[]})}}];await get('file').onchange();assert.equal(reads,1);assert.equal(fetches,before+1);assert.equal(requests.at(-1).version,8);
 // Rivers/bridges are readable, distinct artwork. Passability remains Fe-provided.
 const riverMap={...start,tiles:start.tiles.map(t=>t.index===2?{...t,terrain:8,passable:0,troops:0,infantry:0}:t.index===1?{...t,terrain:9}:t),supply:[{side:1,connectedOwned:17,cutOffOwned:3},{side:2,connectedOwned:11,cutOffOwned:6}]};
 setGame(riverMap);run('selected=2;render()');
 assert.match(get('board').children[2].attrs['aria-label'],/River.*impassable/);assert.match(get('board').children[2].className,/river blocked/);
 assert.match(get('territory-detail').textContent,/River: impassable.*bridge/);
 const riverArt=get('board').children[2].children[0].children[1].innerHTML;
 run('selected=1;render()');assert.match(get('board').children[1].attrs['aria-label'],/Fixed bridge/);assert.doesNotMatch(get('board').children[1].className,/blocked/);
 assert.match(get('territory-detail').textContent,/armies and supply can cross.*Terrain defense \+1/);
 const bridgeArt=get('board').children[1].children[0].children[1].innerHTML;
 assert.notEqual(riverArt,bridgeArt);assert.match(riverArt,/#287a9e/);assert.match(bridgeArt,/#287a9e/);
 assert.match(get('supply').textContent,/Blue 17 connected, 3 cut off.*Red 11 connected, 6 cut off/);assert.equal(get('supply').hidden,false);
 // Display deliberately unusual Fe totals verbatim, never derive reachability or infer reconnection.
 const supplyPreview={...preview,blueConnectedAfter:23,blueCutOffAfter:2,redConnectedAfter:8,redCutOffAfter:9};
 const supplyText=run('forecast([1,0,1,4],'+JSON.stringify(supplyPreview)+')');
 assert.match(supplyText,/owned territories, before → after.*Blue: connected 17 → 23, cut off 3 → 2.*Red: connected 11 → 8, cut off 6 → 9/);
 assert.match(run('forecast([9,0,0,0],'+JSON.stringify({...supplyPreview,outcome:0})+')'),/Extends.*20 rounds.*Supply/);
 assert.doesNotMatch(run('forecast([9,0,0,0],{outcome:0,result:0})'),/Unused orders/);
 assert.match(run('forecast([10,0,0,0],{outcome:0,result:3})'),/Ends the match in a draw/);
 assert.match(supplyText,/Counts include captured territories/);assert.doesNotMatch(supplyText,/reconnect|six territories/);
 const doneSupply=run('forecast([1,0,1,4],'+JSON.stringify(supplyPreview)+',true)');
 assert.match(doneSupply,/Supply after: Blue: 23 connected, 2 cut off; Red: 8 connected, 9 cut off/);assert.doesNotMatch(doneSupply,/17 →|before →/);
 setGame({...riverMap,previews:[start.previews[0],supplyPreview,...start.previews.slice(2)]});run('selected=0;render()');
 assert.match(orderButtons(openCards()[0])[0].children[1].textContent,/connected 17 → 23/);assert.equal(openCards().length,1);
 assert.doesNotMatch(run('forecast([2,0,0,2],'+JSON.stringify(preview)+')'),/Supply|undefined|NaN/);
 setGame({...riverMap,supply:undefined});assert.equal(get('supply').hidden,true);assert.equal(get('supply').textContent,'');assert.doesNotMatch(run('forecast([2,0,0,2],'+JSON.stringify(supplyPreview)+')'),/before →|undefined|NaN/);
 // v5 preserves boundary progress and original fields without claiming v6 supply features.
 const v7Saved=storage.get('fe-kingdoms-v8'),frozenSaves=new Map(storage),v5={...boundary,version:5,supply:undefined};
 reply(v5);await get('rounds').onclick();assert.equal(requests.at(-1).version,5);assert.equal(requests.at(-1).mode,1);assert.equal(run('replay().version'),5);
 assert.match(get('status').textContent,/Legacy v5 campaign replay.*Saved at round-limit decision.*Completed rounds: 60 \/ 60/);
 assert.match(get('turn-guide').textContent,/Saved at a round-limit decision/);assert.equal(get('global-actions').children.length,1);assert.match(get('global-actions').children[0].textContent,/Read-only/);
 assert.equal(get('supply').hidden,true);assert.equal(get('rounds').hidden,false);assert.equal(get('save').disabled,false);
 for(const [key,value] of frozenSaves)assert.equal(storage.get(key),value);assert.equal(storage.get('fe-kingdoms-v8'),v7Saved);
 before=fetches;await run('perform([9,0,0,0],{})');await run('perform([10,0,0,0],{})');assert.equal(fetches,before);
 setGame({...v5,supply:riverMap.supply});assert.equal(get('supply').hidden,true);assert.doesNotMatch(run('forecast([2,0,0,2],'+JSON.stringify(supplyPreview)+')'),/Supply|before →/);
 // Read-only saved turns never invite interaction with a nonexistent computer-turn button.
 for(const version of [1,2,3,4,5])for(const side of [1,2]){
  setGame({...start,version,state:{...start.state,side},supply:undefined});
  assert.ok(get('status').textContent.includes('Saved during '+(side===1?'Blue':'Red')+' turn (read-only)'));
  assert.doesNotMatch(get('status').textContent,/Run computer turn|Your turn:/);
  assert.match(get('global-actions').children[0].textContent,/Read-only/);
  assert.doesNotMatch(get('terrain-guide').textContent,/river|bridge/i);
 }
 reply({...start,version:5,state:{...start.state,side:2},supply:undefined});before=fetches;await get('rounds').onclick();assert.equal(fetches,before+1);assert.equal(requests.at(-1).mode,1);assert.equal(requests.at(-1).version,5);assert.match(get('status').textContent,/Saved during Red turn \(read-only\)/);assert.doesNotMatch(get('status').textContent,/Run computer turn/);
 // v6 remains read-only with its own supply and campaign fields, without touching any checkpoint.
 const beforeV6=new Map(storage),v6={...riverMap,version:6,state:{...boundary.state}};
 reply(v6);before=fetches;await get('rivers').onclick();
 assert.equal(fetches,before+1);assert.equal(requests.at(-1).version,6);assert.equal(requests.at(-1).mode,1);assert.equal(run('replay().version'),6);
 assert.match(get('status').textContent,/Legacy v6 campaign replay.*Saved at round-limit decision.*Completed rounds: 60 \/ 60/);
 assert.match(get('supply').textContent,/Blue 17 connected, 3 cut off/);assert.equal(get('supply').hidden,false);assert.equal(get('rivers').hidden,false);
 assert.match(get('global-actions').children[0].textContent,/Read-only/);assert.equal(get('save').disabled,false);
 assert.match(run('forecast([1,0,1,4],'+JSON.stringify(supplyPreview)+')'),/connected 17/);
 for(const [key,value] of beforeV6)assert.equal(storage.get(key),value);
 before=fetches;await run('perform([9,0,0,0],{})');await run('perform([10,0,0,0],{})');assert.equal(fetches,before);
 for(const side of [1,2]){setGame({...v6,state:{...start.state,side}});assert.ok(get('status').textContent.includes('Saved during '+(side===1?'Blue':'Red')+' turn (read-only)'));assert.doesNotMatch(get('status').textContent,/Run computer turn|Your turn:/);}
 assert.equal(storage.get('fe-kingdoms-v6'),riversSaved);
 setGame(start);assert.match(get('terrain-guide').textContent,/rivers.*fixed bridges.*1 defense.*Forest.*Moving siege uses 2 orders/);
 // Forest art and defense are distinct and accessible; defense is never reconstructed in JavaScript.
 const forest={...start,tiles:start.tiles.map(t=>t.index===1?{...t,terrain:10,defense:71,infantry:0,cavalry:1}:t)};
 setGame(forest);run('selected=1;render()');
 assert.match(get('board').children[1].className,/forest/);assert.match(get('board').children[1].attrs['aria-label'],/Forest.*defense 71 from Fe/);
 assert.match(get('territory-detail').textContent,/Forest: \+1 defense when infantry defend.*Defense: 71 \(Fe\)/);
 assert.notEqual(get('board').children[1].children[0].children[1].innerHTML,get('board').children[2].children[0].children[1].innerHTML);
 assert.equal(get('board').children[1].children[0].children[2].textContent,'Forest');assert.equal(openCards().length,1);
 // Cost follows the Fe detachment and preview, not all the roles in the source stack.
 const light=[1,0,6,2],heavy=[1,0,6,5];
 const lightPreview={...typedPreview,index:1,movingInfantry:2,movingCavalry:0,movingSiege:0,orderCost:1,nextSide:1,nextOrders:1};
 const heavyPreview={...typedPreview,index:2,movingInfantry:3,movingCavalry:1,movingSiege:1,orderCost:2,nextSide:2,nextOrders:2};
 const mixedForest={...forest,tiles:forest.tiles.map(t=>t.index===0?{...t,troops:6,infantry:4,cavalry:1,siege:1}:t),legal:[pass,light,heavy],previews:[{outcome:0},lightPreview,heavyPreview]};
 setGame(mixedForest);run('selected=0;render()');
 let movementButtons=orderButtons(openCards()[0]);assert.match(movementButtons[0].children[0].textContent,/\| 1 order$/);assert.match(movementButtons[1].children[0].textContent,/\| 2 orders$/);
 assert.match(movementButtons[0].children[1].textContent,/Moving force: Infantry 2, cavalry 0, siege 0.*Order cost: 1 order.*Blue turn, 1 order remaining/);
 assert.match(movementButtons[1].children[1].textContent,/Moving force: Infantry 3, cavalry 1, siege 1.*Order cost: 2 orders.*Red turn, 2 orders remaining/);
 assert.match(movementButtons[1].children[1].textContent,/Uses both orders; no order remains to fortify after capture/);
 assert.doesNotMatch(movementButtons[0].children[1].textContent,/fortify/);
 for(const change of [{outcome:1},{outcome:3},{result:1},{nextSide:1,nextOrders:1}])assert.doesNotMatch(run('forecast('+JSON.stringify(heavy)+','+JSON.stringify({...heavyPreview,...change})+')'),/fortify after capture/);
 assert.doesNotMatch(run('forecast('+JSON.stringify(heavy)+','+JSON.stringify(heavyPreview)+',true)'),/Uses both orders/);
 assert.match(get('status').textContent,/2 of 2 orders remaining/);
 assert.match(run('forecast('+JSON.stringify(heavy)+','+JSON.stringify({...heavyPreview,orderCost:7,nextOrders:9})+')'),/Order cost: 7 orders.*9 orders remaining/);
 assert.doesNotMatch(run('forecast('+JSON.stringify(heavy)+','+JSON.stringify(typedPreview)+')'),/Order cost|undefined|NaN/);
 // Spending both orders still requires explicit Red handoff; rapid clicks send one request only.
 before=fetches;reply({...mixedForest,state:{...mixedForest.state,side:2,orders:2},actions:[heavy],legal:[pass],previews:[{outcome:0}]});
 const heavyClick=movementButtons[1],moving=heavyClick.onclick();await heavyClick.onclick();await moving;
 assert.equal(fetches,before+1);assert.equal(requests.at(-1).mode,1);assert.deepEqual(requests.at(-1).actions,[heavy]);
 assert.match(get('human-activity').textContent,/Used 2 orders/);assert.match(get('turn-guide').textContent,/Red has not moved yet/);assert.equal(get('global-actions').children[0].textContent,'Run computer turn');
 // Only Fe-listed orders appear with one order remaining; the browser adds no move alternatives.
 setGame({...mixedForest,state:{...start.state,orders:1},legal:[pass,light],previews:[{outcome:0},lightPreview]});run('selected=0;render()');
 assert.equal(orderButtons(openCards()[0]).length,1);before=fetches;await run('perform('+JSON.stringify(heavy)+','+JSON.stringify(heavyPreview)+')');assert.equal(fetches,before);
 // Frozen v6 never receives forest-specific terrain or order-cost semantics.
 setGame({...v6,state:{...start.state,side:2}});assert.doesNotMatch(get('terrain-guide').textContent,/Forest|siege uses 2/);assert.doesNotMatch(run('forecast('+JSON.stringify(heavy)+','+JSON.stringify(heavyPreview)+')'),/Order cost/);
 // A supplied town offers only the permanent choices listed by Fe, with native prices.
 const granary=[11,5,5,1],arsenal=[11,5,5,2];
 const granaryPreview={...preview,index:1,outcome:7,cost:6,foodCost:2,orderCost:1,targetSpecialty:1};
 const arsenalPreview={...granaryPreview,index:2,targetSpecialty:2};
 const town={...start,tiles:start.tiles.map(t=>t.index===5?{...t,settlement:2,specialty:0}:t),legal:[pass,granary,arsenal],previews:[{outcome:0},granaryPreview,arsenalPreview]};
 setGame(town);run('selected=5;render()');let townButtons=orderButtons(openCards()[0]);
 assert.equal(townButtons.length,2);assert.match(townButtons[0].children[0].textContent,/Specialize A2 as Granary \(permanent choice\).*1 order/);
 assert.match(townButtons[1].children[0].textContent,/Arsenal \(permanent choice\)/);
 assert.match(townButtons[0].children[1].textContent,/6 gold, 2 food.*Granary.*cannot replace.*\+2 food production.*while supplied.*Capture preserves/);
 assert.match(townButtons[1].children[1].textContent,/Arsenal.*Cavalry\/siege recruitment and paid training cost 1 less gold while supplied/);
 assert.match(run('forecast('+JSON.stringify(granary)+','+JSON.stringify({...granaryPreview,cost:13,foodCost:9,targetSpecialty:2})+')'),/13 gold, 9 food.*Arsenal/);
 // Double-clicking records one paid choice. No replacement button appears unless Fe offers one.
 const granaryTown={...town,state:{...town.state,orders:1},tiles:town.tiles.map(t=>t.index===5?{...t,specialty:1}:t),actions:[granary],legal:[pass],previews:[{outcome:0}],economy:[{...start.economy[0],foodProduction:19,foodNet:16}]};
 before=fetches;reply(granaryTown);const chosen=townButtons[0],specializing=chosen.onclick();await chosen.onclick();await specializing;
 assert.equal(fetches,before+1);assert.equal(requests.at(-1).mode,1);assert.deepEqual(requests.at(-1).actions,[granary]);assert.equal(orderButtons(openCards()[0]).length,0);
 assert.match(get('human-activity').textContent,/Specialized.*Granary.*Used 1 order/);assert.match(get('economy').children[0].textContent,/19 food produced/);
 assert.match(get('board').children[5].attrs['aria-label'],/Granary \(permanent\)/);assert.match(get('board').children[5].children[0].children[2].textContent,/Town \/ Granary/);
 assert.match(openCards()[0].children[0].textContent,/Granary/);assert.equal(openCards()[0].children[0].children[0].className,'specialty-icon');
 const granaryArt=get('board').children[5].children[0].children[2].children[0].innerHTML;
 // Arsenal's base-price explanation does not replace Fe's actual local recruit or training quote.
 const arsenalTown={...town,tiles:town.tiles.map(t=>t.index===5?{...t,specialty:2}:t),legal:[pass,[5,5,5,1],[8,5,5,1]],previews:[{outcome:0},{...preview,cost:2,foodCost:7,orderCost:1},{...preview,cost:3,foodCost:8,orderCost:1}]};
 setGame(arsenalTown);run('selected=5;render()');townButtons=orderButtons(openCards()[0]);
 assert.match(townButtons[0].children[1].textContent,/2 gold, 7 food/);assert.match(townButtons[1].children[1].textContent,/3 gold, 8 food/);
 assert.match(get('territory-detail').textContent,/Arsenal.*Cavalry\/siege recruitment and paid training cost 1 less gold/);
 assert.notEqual(get('board').children[5].children[0].children[2].children[0].innerHTML,granaryArt);
 const baseGuide=openCards()[0].children[1].children.find(e=>e.className==='role-comparison').children[1];
 assert.match(baseGuide.children[1].children[1].children[0].textContent,/Cavalry.*base: 1 for 4 gold/);assert.match(baseGuide.children[3].textContent,/Base prices above are not local quotes.*Fe forecast for actual prices/);
 // Cut-off and captured towns retain the choice; the UI neither invents income nor grants actions.
 setGame({...granaryTown,tiles:granaryTown.tiles.map(t=>t.index===5?{...t,supplied:0}:t),economy:[{...start.economy[0],foodProduction:3}]});run('selected=5;render()');
 assert.match(get('territory-detail').textContent,/Granary.*Benefit inactive: town is cut off/);assert.match(get('economy').children[0].textContent,/3 food produced/);assert.equal(orderButtons(openCards()[0]).length,0);
 setGame({...arsenalTown,tiles:arsenalTown.tiles.map(t=>t.index===5?{...t,owner:2}:t),legal:[pass],previews:[{outcome:0}]});run('selected=5;render()');
 assert.match(get('board').children[5].attrs['aria-label'],/Red.*Arsenal/);assert.match(get('territory-detail').textContent,/Capture preserves this choice/);assert.equal(openCards().length,0);
 // Construction belongs to the Fe-listed bank, not the unowned river site. Empty bridges are valid.
 const buildBridge=[12,1,2,1],buildPreview={...preview,index:1,outcome:8,cost:6,foodCost:2,orderCost:1,targetTerrain:9,targetPassable:1,targetOwner:0,targetTroops:0,targetInfantry:0,targetCavalry:0,targetSiege:0,blueConnectedAfter:17,blueCutOffAfter:3,redConnectedAfter:11,redCutOffAfter:6};
 const siteMap={...start,supply:riverMap.supply,tiles:start.tiles.map(t=>t.index===2?{...t,terrain:8,crossingSite:1,constructedBridge:0,passable:0,troops:0,infantry:0,defense:0}:t),legal:[pass,buildBridge],previews:[{outcome:0},buildPreview]};
 setGame(siteMap);run('selected=2;render()');
 assert.match(get('board').children[2].className,/river crossing-site blocked/);assert.match(get('board').children[2].attrs['aria-label'],/Bridge site.*Neutral.*0 troops.*impassable/);
 assert.match(get('territory-detail').textContent,/Bridge site: impassable.*adjacent owned land bank.*permanent, shared, neutral and empty/);assert.equal(openCards().length,0);
 const siteArt=get('board').children[2].children[0].children[1].innerHTML;assert.match(siteArt,/stroke-dasharray/);assert.notEqual(siteArt,riverArt);
 run('selected=1;render()');const constructionButton=orderButtons(openCards()[0])[0];
 assert.match(constructionButton.children[0].textContent,/Build shared bridge: B1 -> C1 \(permanent\).*1 order/);
 assert.match(constructionButton.children[1].textContent,/6 gold, 2 food.*Bridge, passable, Neutral, 0 troops.*Either side can occupy.*does not claim it or automatically connect supply/);
 assert.match(constructionButton.children[1].textContent,/Blue: connected 17/);
 assert.match(run('forecast('+JSON.stringify(buildBridge)+','+JSON.stringify({...buildPreview,cost:12,foodCost:4,targetTerrain:10,targetPassable:0,targetOwner:2,targetTroops:7})+')'),/12 gold, 4 food.*Forest, impassable, Red, 7 troops/);
 const bridgeMap={...siteMap,state:{...start.state,orders:1},tiles:siteMap.tiles.map(t=>t.index===2?{...t,terrain:9,constructedBridge:1,passable:1,supplied:0}:t),actions:[buildBridge],legal:[pass],previews:[{outcome:0}]};
 before=fetches;reply(bridgeMap);const building=constructionButton.onclick();await constructionButton.onclick();await building;
 assert.equal(fetches,before+1);assert.deepEqual(requests.at(-1).actions,[buildBridge]);assert.equal(requests.at(-1).mode,1);assert.equal(orderButtons(openCards()[0]).length,0);
 assert.match(get('human-activity').textContent,/Built a permanent shared crossing.*Neutral, 0 troops/);
 run('selected=2;render()');assert.match(get('board').children[2].attrs['aria-label'],/Built bridge.*Neutral.*0 troops.*defense 0 from Fe/);
 assert.doesNotMatch(get('board').children[2].className,/blocked|crossing-site/);assert.equal(get('board').children[2].children[0].children[3].textContent,'Empty');
 assert.match(get('territory-detail').textContent,/Built crossing.*either side can use.*Empty: move troops here.*Supply requires an owned connected route.*Defense: 0/);
 assert.notEqual(get('board').children[2].children[0].children[1].innerHTML,siteArt);assert.equal(openCards().length,0);
 assert.match(get('supply').textContent,/Blue 17 connected, 3 cut off/);assert.equal(run('game.tiles[2].owner'),0);
 // Occupation and later capture keep the constructed marker; native ownership/defense/supply win.
 for(const owner of [1,2]){setGame({...bridgeMap,tiles:bridgeMap.tiles.map(t=>t.index===2?{...t,owner,troops:1,infantry:1,defense:33,supplied:1}:t)});run('selected=2;render()');assert.match(get('board').children[2].attrs['aria-label'],new RegExp('Built bridge, '+(owner===1?'Blue':'Red')+'.*defense 33 from Fe'));assert.match(get('territory-detail').textContent,/Defense: 33 \(Fe\)/);assert.doesNotMatch(get('territory-detail').textContent,/Empty: move/);assert.equal(openCards().length,owner===1?1:0);}
 assert.doesNotMatch(html,/Every territory retains at least one troop/);assert.match(html,/Every departing army retains at least one garrison/);
 // Native decisions describe only actual automatic orders, with immediate changes kept distinct from search.
 const aiFortify=[3,9,9,1],decision1={traceIndex:2,side:2,kind:ai[0],from:ai[1],to:ai[2],amount:ai[3],focus:1,target:14,depth:4,nodes:127,searchScore:99,beforeScore:42,afterScore:36,materialDelta:4,resourcesDelta:-10,supplyDelta:0,economyDelta:0,positionDelta:0,pressureDelta:0,focusDelta:0,terminalDelta:0,highlight:1,orderCost:1};
 const decision2={...decision1,traceIndex:3,kind:aiFortify[0],amount:1,focus:3,target:64,nodes:55,searchScore:81,beforeScore:36,afterScore:34,materialDelta:0,resourcesDelta:0,positionDelta:-2,highlight:0};
 const decisionResponse={...next,difficulty:1,actions:[recruit,move,ai,aiFortify],decisions:[decision1,decision2]};
 setGame(second);reply(decisionResponse);before=fetches;await get('global-actions').children[0].onclick();
 assert.equal(fetches,before+1);assert.equal(requests.at(-1).mode,0);assert.equal(get('search').children.length,2);assert.match(get('search').textContent,/Latest automatic response only/);
 const firstDecision=get('search').children[0],secondDecision=get('search').children[1];
 assert.match(firstDecision.children[0].textContent,/Red order 3: Fe priority: defend capital E3.*Immediate evaluation change: 42 to 36/);
 assert.match(firstDecision.children[1].textContent,/Actual order: Recruit \+2 infantry at E2.*Cost: 1 order/);
 assert.match(firstDecision.children[2].textContent,/Largest positive component: material \+4.*resources -10/);
 assert.match(firstDecision.children[3].textContent,/Configured action-ply limit: 4.*Per-decision search nodes: 127.*Chosen horizon score: 99.*not a full explanation.*or a promise of future orders/);
 assert.match(secondDecision.children[0].textContent,/Red order 4.*food \(kingdom-wide\).*36 to 34/);assert.match(secondDecision.children[2].textContent,/No positive component.*position -2/);assert.match(secondDecision.children[3].textContent,/nodes: 55.*score: 81/);
 assert.equal(run('focusLabel({focus:2,target:1})'),'reconnect holding B1');assert.equal(run('focusLabel({focus:4,target:14})'),'advance toward E3 (normal positional play)');
 assert.match(firstDecision.children[0].textContent,/heuristic points/);assert.match(firstDecision.children[3].textContent,/not win probabilities/);assert.equal(firstDecision.attrs.open,undefined);assert.equal(secondDecision.attrs.open,undefined);
 assert.equal(run('replay().decisions'),undefined);assert.deepEqual(JSON.parse(run('JSON.stringify(replay().actions)')),decisionResponse.actions);
 // Prior-response, mismatched-action and invalid-index metadata cannot be assigned to a different order.
 setGame(second);reply({...decisionResponse,decisions:[{...decision1,traceIndex:0,from:0,to:0},decision1,{...decision2,kind:2},{...decision2,traceIndex:99},decision2]});await get('global-actions').children[0].onclick();
 assert.equal(get('search').children.length,2);assert.deepEqual(JSON.parse(run('JSON.stringify(game.decisions.map(d=>d.traceIndex))')),[2,3]);
 setGame({...decisionResponse,decisions:[{...decision1,amount:99},{...decision2,traceIndex:-1}]});assert.equal(get('search').children.length,0);assert.match(get('search').textContent,/No search explanation/);
 // Human requests and replay loads never retain automatic-response analysis, even if stale data is returned.
 setGame(decisionResponse);reply({...decisionResponse,actions:[...decisionResponse.actions,recruit],state:{...start.state,orders:1}});await run('perform('+JSON.stringify(recruit)+','+JSON.stringify(preview)+')');
 assert.equal(requests.at(-1).mode,1);assert.equal(get('search').children.length,0);assert.equal(run('game.decisions.length'),0);assert.match(get('search').textContent,/replays store orders only/);
 reply(decisionResponse);await run('load('+JSON.stringify(JSON.stringify({version:8,scenario:0,difficulty:1,actions:decisionResponse.actions}))+')');
 assert.equal(requests.at(-1).mode,1);assert.equal(get('search').children.length,0);assert.equal(run('game.decisions.length'),0);assert.equal(run('replay().actions.length'),4);
 setGame(decisionResponse);accept=true;reply({...start,decisions:[decision1,decision2]});await get('new').onclick();assert.equal(get('search').children.length,0);assert.equal(run('game.actions.length'),0);
 // Frozen v6 does not acquire v7 decision metadata, and repeat renders do not duplicate details.
 setGame({...decisionResponse,version:6});assert.equal(get('search').children.length,0);assert.doesNotMatch(get('search').textContent,/priority|explanation/);
 setGame(decisionResponse);run('render();render()');assert.equal(get('search').children.length,2);
 const old={...start};delete old.previews;setGame(old);run('selected=0;render()');assert.doesNotThrow(()=>run('render()'));assert.equal(run('busy'),false);
 assert.match(orderButtons(openCards()[0])[0].children[0].textContent,/Check Fe order cost/);assert.doesNotMatch(orderButtons(openCards()[0])[0].children[0].textContent,/1 order/);
 // Named snapshots are explicitly saved replay copies, not new engine payload fields.
 const slotsKey='fe-kingdoms-v8-slots-v1',checkpointKey='fe-kingdoms-v8';
 const frozenKeys=new Map([...storage].filter(([key])=>key!==checkpointKey));
 const slots=()=>JSON.parse(storage.get(slotsKey)).slots;
 const campaignGame={...start,map:{...start.map,scenario:2},actions:[recruit,move]};
 setGame(campaignGame);run('checkpoint()');get('snapshot-name').value='  Long campaign  ';
 assert.equal(get('snapshot-save').onclick(),true);assert.equal(slots().length,1);assert.equal(slots()[0].name,'Long campaign');
 assert.deepEqual(slots()[0].replay,{version:8,scenario:2,difficulty:0,actions:[recruit,move]});
 assert.match(get('snapshot-status').textContent,/stays unchanged.*Resume campaign autosaves/);
 const longSnapshot=storage.get(slotsKey);accept=false;reply(start);before=fetches;
 // A matching saved snapshot protects the outgoing campaign, so no discard prompt is needed.
 get('scenario').value='0';get('difficulty').value='0';const confirmsBefore=confirmations.length;
 await get('new').onclick();assert.equal(fetches,before+1);assert.equal(confirmations.length,confirmsBefore);assert.equal(storage.get(slotsKey),longSnapshot);
 // A different unsaved working game requires explicit discard, including terminal games.
 setGame({...start,state:{...start.state,result:1},actions:[recruit]});run('checkpoint()');before=fetches;
 reply(campaignGame);await get('snapshot-load').onclick();assert.equal(fetches,before);assert.equal(run('game.state.result'),1);
 accept=true;await get('snapshot-load').onclick();assert.equal(fetches,before+1);assert.equal(requests.at(-1).mode,1);
 assert.deepEqual(Object.keys(requests.at(-1)).sort(),['actions','difficulty','mode','scenario','version']);assert.equal(run('replay().name'),undefined);
 assert.equal(storage.get(slotsKey),longSnapshot);assert.equal(run('replay().scenario'),2);
 // Unsaved completed checkpoint behind a legacy view remains guarded.
 const ended={...start,state:{...start.state,result:1},actions:[pass,recruit]};setGame(ended);run('checkpoint()');
 const endedCheckpoint=storage.get(checkpointKey);reply(legacy);accept=false;before=fetches;
 await get('legacy').onclick();assert.equal(fetches,before+1);assert.equal(storage.get(checkpointKey),endedCheckpoint);
 reply(start);before=fetches;await get('new').onclick();assert.equal(fetches,before);assert.equal(storage.get(checkpointKey),endedCheckpoint);
 assert.equal(get('snapshot-save').onclick(),false);assert.equal(storage.get(slotsKey),longSnapshot);
 // Names, bounded collection, deliberate replacement/deletion and retained identity.
 setGame(start);run('checkpoint()');get('snapshot-name').value='LONG CAMPAIGN';assert.equal(get('snapshot-save').onclick(),false);
 for(const name of ['', ' '.repeat(3), 'x'.repeat(41)]){get('snapshot-name').value=name;assert.equal(get('snapshot-save').onclick(),false);}
 for(let n=2;n<=6;n++){get('snapshot-name').value='Snapshot '+n;assert.equal(get('snapshot-save').onclick(),true);}
 const fullSlots=storage.get(slotsKey);get('snapshot-name').value='Seventh';assert.equal(get('snapshot-save').onclick(),false);assert.equal(storage.get(slotsKey),fullSlots);
 get('snapshot-list').value=slots()[0].id;accept=false;assert.equal(get('snapshot-replace').onclick(),false);assert.equal(get('snapshot-delete').onclick(),false);assert.equal(storage.get(slotsKey),fullSlots);
 accept=true;assert.equal(get('snapshot-replace').onclick(),true);assert.equal(slots()[0].name,'Long campaign');assert.deepEqual(slots()[0].replay.actions,[]);
 const selectedDelete=slots()[0].id;get('snapshot-list').value=selectedDelete;assert.equal(get('snapshot-delete').onclick(),true);assert.equal(slots().length,5);
 assert.equal(get('snapshot-delete').onclick(),false);assert.equal(slots().length,5); // A second click cannot silently target the next entry.
 const healthySlots=storage.get(slotsKey);
 // Bad/unknown collections are preserved on all write attempts. A bad entry is not silently dropped.
 const invalidCollections=['{bad',JSON.stringify({schema:2,slots:[]}),JSON.stringify({schema:1,slots:[{id:'x',name:'Broken',savedAt:'today',replay:{}}]})];
 for(const raw of invalidCollections){storage.set(slotsKey,raw);run('renderSnapshots()');get('snapshot-name').value='Recovery';before=fetches;
  assert.equal(get('snapshot-save').onclick(),false);assert.equal(get('snapshot-replace').onclick(),false);assert.equal(get('snapshot-delete').onclick(),false);await get('snapshot-load').onclick();assert.equal(fetches,before);assert.equal(storage.get(slotsKey),raw);assert.match(get('storage-warning').textContent,/Snapshots unavailable/);}
 storage.set(slotsKey,healthySlots);run('renderSnapshots()');
 const healthyFirst=slots()[0],duplicateCollection=JSON.parse(healthySlots);duplicateCollection.slots[1].name=healthyFirst.name.toUpperCase();storage.set(slotsKey,JSON.stringify(duplicateCollection));
 assert.equal(get('snapshot-save').onclick(),false);assert.equal(storage.get(slotsKey),JSON.stringify(duplicateCollection));storage.set(slotsKey,healthySlots);run('renderSnapshots()');
 // Persistence failures never report success or mutate stored snapshots; warnings survive requests/renders.
 const normalSet=context.localStorage.setItem,normalGet=context.localStorage.getItem;
 context.localStorage.setItem=(key,value)=>{if(key===slotsKey)throw Error('QuotaExceededError');return normalSet(key,value)};
 get('snapshot-name').value='Quota test';assert.equal(get('snapshot-save').onclick(),false);assert.equal(storage.get(slotsKey),healthySlots);assert.match(get('storage-warning').textContent,/QuotaExceededError/);
 get('snapshot-list').value=slots()[0].id;assert.equal(get('snapshot-replace').onclick(),false);assert.equal(get('snapshot-delete').onclick(),false);assert.equal(storage.get(slotsKey),healthySlots);
 reply(start);await get('new').onclick();assert.match(get('storage-warning').textContent,/QuotaExceededError/);
 context.localStorage.setItem=normalSet;assert.equal(get('snapshot-save').onclick(),true);assert.doesNotMatch(get('storage-warning').textContent,/QuotaExceededError/);
 const checkpointBeforeFailure=storage.get(checkpointKey);context.localStorage.setItem=(key,value)=>{if(key===checkpointKey)throw Error('storage denied');return normalSet(key,value)};
 reply(first);await run('perform('+JSON.stringify(recruit)+','+JSON.stringify(preview)+')');assert.equal(storage.get(checkpointKey),checkpointBeforeFailure);assert.equal(run('game.actions.length'),1);assert.match(get('storage-warning').textContent,/NOT saved locally.*storage denied/);
 run('render()');assert.match(get('storage-warning').textContent,/NOT saved locally/);
 accept=false;before=fetches;reply(legacy);await get('legacy').onclick();assert.equal(fetches,before); // Memory-only progress cannot be silently lost even to read-only viewing.
 context.localStorage.setItem=normalSet;run('checkpoint()');assert.doesNotMatch(get('storage-warning').textContent,/NOT saved locally/);
 context.localStorage.getItem=()=>{throw Error('read denied')};before=fetches;await get('new').onclick();assert.equal(fetches,before);assert.match(get('storage-warning').textContent,/read denied/);context.localStorage.getItem=normalGet;
 // Corrupt current checkpoint remains byte-identical and blocks replacement, including startup-like no-game state.
 const validCheckpoint=storage.get(checkpointKey);storage.set(checkpointKey,'{corrupt');run('game=null');accept=true;before=fetches;await get('new').onclick();assert.equal(fetches,before);assert.equal(storage.get(checkpointKey),'{corrupt');
 setGame(start);run('checkpoint()');assert.equal(storage.get(checkpointKey),'{corrupt');storage.set(checkpointKey,validCheckpoint);
 // Failed Fe validation retains current game, selection, checkpoint and named collection.
 setGame(first);run('checkpoint();selected=5');const beforeRejected=storage.get(checkpointKey),beforeRejectedSlots=storage.get(slotsKey);
 get('snapshot-list').value=slots()[0].id;response={ok:false,json:async()=>({error:'Fe rejected snapshot'})};await get('snapshot-load').onclick();
 assert.equal(run('selected'),5);assert.equal(run('game.actions.length'),1);assert.equal(storage.get(checkpointKey),beforeRejected);assert.equal(storage.get(slotsKey),beforeRejectedSlots);
 // A delayed import owns the busy lock through reading AND validation/application.
 let finishRead,finishResponse;get('file').files=[{size:100,text:()=>new Promise(resolve=>{finishRead=resolve})}];
 const imported=get('file').onchange();assert.equal(run('busy'),true);assert.equal(get('snapshot-name').disabled,true);before=fetches;
 await get('new').onclick();await get('snapshot-load').onclick();assert.equal(get('snapshot-save').onclick(),false);await get('resume').onclick();assert.equal(fetches,before);
 response={ok:true,json:()=>new Promise(resolve=>{finishResponse=resolve})};finishRead(JSON.stringify({version:8,scenario:0,difficulty:0,actions:[]}));
 await new Promise(resolve=>setImmediate(resolve));assert.equal(run('busy'),true);assert.equal(fetches,before+1);await get('snapshot-load').onclick();assert.equal(fetches,before+1);
 finishResponse(JSON.parse(JSON.stringify(start)));await imported;assert.equal(run('busy'),false);assert.equal(get('snapshot-name').disabled,false);
 // Cancel and rejection during import release the lock without disturbing accepted data.
 setGame(first);run('checkpoint()');const importCheckpoint=storage.get(checkpointKey);accept=false;before=fetches;
 get('file').files=[{size:100,text:async()=>JSON.stringify({version:8,scenario:0,difficulty:0,actions:[]})}];await get('file').onchange();assert.equal(fetches,before);assert.equal(run('busy'),false);assert.equal(storage.get(checkpointKey),importCheckpoint);
 get('file').files=[{size:100,text:async()=>'{bad'}];await get('file').onchange();assert.equal(run('busy'),false);assert.equal(storage.get(checkpointKey),importCheckpoint);
 // Double-clicked snapshot loads make only one transport request and do not modify snapshots.
 accept=true;reply(start);before=fetches;const loading=get('snapshot-load').onclick();await get('snapshot-load').onclick();await loading;assert.equal(fetches,before+1);assert.equal(storage.get(slotsKey),beforeRejectedSlots);
 for(const [key,value] of frozenKeys)assert.equal(storage.get(key),value);
 assert.match(html,/Named snapshots stay unchanged/);assert.match(html,/Resume campaign autosaves/);
 // Startup never sends a new-game request over an existing, empty/corrupt or unreadable checkpoint.
 for(const stored of [validCheckpoint,'{bad','',null]){
  const bootElements=new Map(),bootGet=id=>{if(!bootElements.has(id))bootElements.set(id,element());return bootElements.get(id)};let bootFetches=0,bootWrites=0;
  const boot=vm.createContext({document:{getElementById:bootGet,querySelectorAll:()=>[...bootElements.values()],createElement:element},localStorage:{getItem:key=>{if(stored===null)throw Error('startup denied');return key===checkpointKey?stored:null},setItem:()=>{bootWrites++}},confirm:()=>false,fetch:async()=>{bootFetches++;throw Error('Unexpected startup request')},console,setTimeout,URL,Blob});
  vm.runInContext(html.split('<script>')[1].split('</script>')[0],boot);assert.equal(bootFetches,0);assert.equal(bootWrites,0);assert.equal(bootGet('snapshot-save').disabled,true);
  if(stored===null)assert.match(bootGet('storage-warning').textContent,/startup denied.*Automatic startup is paused/);
 }
 // Practice uses real replay-shaped prefixes but mocked state here; native tests validate the catalog's actual tactics.
 const demos=JSON.parse(run('JSON.stringify(PRACTICE_DEMOS)'));
 assert.deepEqual(demos.map(d=>[d.id,d.replay.actions.length]),[['shared-crossing',27],['mixed-siege',24]]);
 const practiceGame=index=>({...start,actions:demos[index].replay.actions});
 const protectedCampaign={...start,map:{...start.map,scenario:2},actions:[pass,move,recruit]};
 setGame(protectedCampaign);run('checkpoint();selected=5');const practiceStorage=new Map(storage);let practiceWrites=0;
 context.localStorage.setItem=(key,value)=>{practiceWrites++;return normalSet(key,value)};
 const unchangedPracticeStorage=()=>{assert.deepEqual([...storage],[...practiceStorage]);assert.equal(practiceWrites,0)};
 // Entry is staged: Fe rejection retains ordinary campaign and selected territory.
 get('practice-list').value=demos[0].id;response={ok:false,json:async()=>({error:'Practice rejected'})};await get('practice-start').onclick();
 assert.equal(run('practiceSession'),null);assert.equal(run('selected'),5);assert.deepEqual(JSON.parse(run('JSON.stringify(replay().actions)')),protectedCampaign.actions);unchangedPracticeStorage();
 reply(practiceGame(0));before=fetches;const entering=get('practice-start').onclick();await get('practice-start').onclick();await entering;
 assert.equal(fetches,before+1);assert.equal(run('practiceSession.id'),demos[0].id);assert.equal(requests.at(-1).mode,1);assert.deepEqual(requests.at(-1).actions,demos[0].replay.actions);
 assert.deepEqual(Object.keys(requests.at(-1)).sort(),['actions','difficulty','mode','scenario','version']);
 assert.equal(get('practice-banner').hidden,false);assert.match(get('practice-description').textContent,/Prepared example.*NOT saved/);assert.match(get('practice-source').textContent,/V8-derived.*model-selected Blue.*not a recorded v8 match/);
 assert.equal(get('snapshot-save').disabled,true);assert.equal(get('snapshot-replace').disabled,true);assert.equal(get('snapshot-delete').disabled,true);assert.equal(get('save').disabled,false);
 assert.equal(get('snapshot-save').onclick(),false);assert.equal(get('snapshot-replace').onclick(),false);assert.equal(get('snapshot-delete').onclick(),false);run('checkpoint()');unchangedPracticeStorage();
 // Human actions and native Red requests continue in practice without ANY storage writes.
 const practiceRed={...practiceGame(0),state:{...start.state,side:2},actions:[...demos[0].replay.actions,recruit]};reply(practiceRed);
 await run('perform('+JSON.stringify(recruit)+','+JSON.stringify(preview)+')');assert.equal(run('practiceSession.id'),demos[0].id);unchangedPracticeStorage();
 reply({...practiceGame(0),actions:[...practiceRed.actions,ai]});await get('global-actions').children[0].onclick();assert.equal(requests.at(-1).mode,0);unchangedPracticeStorage();
 // Failed/reset/switch/return preserve old context; reset ignores a different selector value.
 get('practice-list').value=demos[1].id;response={ok:false,json:async()=>({error:'Reset rejected'})};const beforeReset=run('JSON.stringify(replay())');
 await get('practice-reset').onclick();assert.equal(run('JSON.stringify(replay())'),beforeReset);assert.equal(run('practiceSession.id'),demos[0].id);
 reply(practiceGame(0));before=fetches;const resetting=get('practice-reset').onclick();await get('practice-reset').onclick();await resetting;assert.equal(fetches,before+1);assert.deepEqual(requests.at(-1).actions,demos[0].replay.actions);unchangedPracticeStorage();
 response={ok:false,json:async()=>({error:'Switch rejected'})};await get('practice-start').onclick();assert.equal(run('practiceSession.id'),demos[0].id);
 reply(practiceGame(1));await get('practice-start').onclick();assert.equal(run('practiceSession.id'),demos[1].id);unchangedPracticeStorage();
 response={ok:false,json:async()=>({error:'Return rejected'})};await get('practice-return').onclick();assert.equal(run('practiceSession.id'),demos[1].id);assert.equal(get('practice-banner').hidden,false);unchangedPracticeStorage();
 reply(protectedCampaign);before=fetches;const returning=get('practice-return').onclick();await get('practice-return').onclick();await returning;assert.equal(fetches,before+1);
 assert.equal(run('practiceSession'),null);assert.equal(get('practice-banner').hidden,true);assert.equal(run('replay().scenario'),2);assert.deepEqual(requests.at(-1).actions,protectedCampaign.actions);unchangedPracticeStorage();
 // Subsequent ordinary campaign orders resume autosave, after the write-free return.
 reply({...protectedCampaign,actions:[...protectedCampaign.actions,recruit]});await run('perform('+JSON.stringify(recruit)+','+JSON.stringify(preview)+')');assert.equal(practiceWrites,1);
 context.localStorage.setItem=normalSet;
 // An unsaved in-memory campaign cannot enter practice until a matching snapshot protects it.
 const memoryOnly={...start,actions:[move,pass,recruit,move]};setGame(memoryOnly);before=fetches;reply(practiceGame(0));get('practice-list').value=demos[0].id;
 await get('practice-start').onclick();assert.equal(fetches,before);assert.equal(run('practiceSession'),null);assert.match(get('error').textContent,/Save a named snapshot/);
 get('snapshot-list').value=slots()[0].id;accept=true;assert.equal(get('snapshot-replace').onclick(),true);
 const beforeProtectedEntry=new Map(storage);reply(practiceGame(0));await get('practice-start').onclick();reply(memoryOnly);await get('practice-return').onclick();assert.deepEqual([...storage],[...beforeProtectedEntry]);assert.deepEqual(JSON.parse(run('JSON.stringify(replay().actions)')),memoryOnly.actions);
 // Other navigation cancels/rejects without abandoning practice; successful navigation exits only on response.
 setGame(protectedCampaign);run('checkpoint()');reply(practiceGame(0));await get('practice-start').onclick();accept=false;before=fetches;
 await get('new').onclick();assert.equal(fetches,before);assert.equal(run('practiceSession.id'),demos[0].id);
 get('file').files=[{size:100,text:async()=>JSON.stringify({version:8,scenario:0,difficulty:0,actions:[]})}];await get('file').onchange();assert.equal(fetches,before);assert.equal(run('practiceSession.id'),demos[0].id);
 accept=true;
 const navigation=[()=>get('new').onclick(),()=>get('resume').onclick(),()=>get('legacy').onclick(),()=>get('snapshot-load').onclick(),()=>{get('file').files=[{size:100,text:async()=>JSON.stringify({version:8,scenario:0,difficulty:0,actions:[]})}];return get('file').onchange()}];
 for(const navigate of navigation){
  response={ok:false,json:async()=>({error:'Navigation rejected'})};const oldPosition=run('JSON.stringify(replay())'),oldStorage=new Map(storage);await navigate();
  assert.equal(run('practiceSession.id'),demos[0].id);assert.equal(run('JSON.stringify(replay())'),oldPosition);assert.deepEqual([...storage],[...oldStorage]);
 }
 let finishPracticeImport;get('file').files=[{size:100,text:()=>new Promise(resolve=>{finishPracticeImport=resolve})}];const practiceImport=get('file').onchange();before=fetches;
 await get('practice-reset').onclick();await get('practice-return').onclick();await get('practice-start').onclick();assert.equal(fetches,before);assert.equal(run('practiceSession.id'),demos[0].id);
 finishPracticeImport('{bad');await practiceImport;assert.equal(run('busy'),false);assert.equal(run('practiceSession.id'),demos[0].id);
 for(let i=0;i<navigation.length;i++){
  reply(i===2?legacy:start);await navigation[i]();assert.equal(run('practiceSession'),null);assert.equal(get('practice-banner').hidden,true);
  setGame(protectedCampaign);run('checkpoint()');reply(practiceGame(0));await get('practice-start').onclick();assert.equal(run('practiceSession.id'),demos[0].id);
 }
 // Legacy view entry returns the stored v7 campaign, not the old read-only replay.
 reply(legacy);await get('legacy').onclick();const legacyPracticeStorage=new Map(storage);reply(practiceGame(0));await get('practice-start').onclick();assert.equal(run('practiceSession.returnReplay.version'),8);
 reply(protectedCampaign);await get('practice-return').onclick();assert.deepEqual([...storage],[...legacyPracticeStorage]);
 // No campaign is invented when starting practice without one; ordinary reload resumes only the real checkpoint.
 const savedForPractice=storage.get(checkpointKey);storage.delete(checkpointKey);run('game=null');reply(practiceGame(0));await get('practice-start').onclick();assert.equal(run('practiceSession.returnReplay'),null);assert.equal(get('practice-return').disabled,true);assert.equal(storage.has(checkpointKey),false);
 reply(start);await get('new').onclick();assert.equal(run('practiceSession'),null);storage.set(checkpointKey,savedForPractice);
 for(const [key,value] of frozenKeys)assert.equal(storage.get(key),value);
 // V8 progression is presentation of Fe rows and forecasts, never reconstructed town/supply/economy rules.
 const charter=[13,5,5,1],rotation=[13,5,5,2],muster=[13,5,5,3];
 const developmentRows=[1,2].flatMap(side=>[1,2,3].map(id=>({side,id,known:0,active:0,goldCost:6,foodCost:id===1?0:2,orderCost:1,prerequisite:id===1?0:1,prerequisiteMet:id===1?1:0,town:id===1?5:64,affordable:1,eligible:id===1?1:0})));
 const researchPreview={...preview,index:1,outcome:9,cost:11,foodCost:4,orderCost:1};
 const charterProjection={actionIndex:1,blueKnownMask:1,redKnownMask:6,blueActiveMask:1,redActiveMask:2,blueGoldIncome:17,redGoldIncome:18,blueFoodProduction:19,redFoodProduction:20,blueUpkeep:21,redUpkeep:22,blueGoldAfter:23,redGoldAfter:24};
 const researchTown={...start,tiles:start.tiles.map(t=>t.index===5?{...t,settlement:2,specialty:0}:t),developments:developmentRows,developmentPreviews:[charterProjection],legal:[pass,charter],previews:[{outcome:0},researchPreview]};
 setGame(researchTown);run('selected=5;render()');assert.equal(get('developments').hidden,false);assert.equal(get('development-list').children.length,6);
 assert.match(get('development-list').children[0].textContent,/Blue.*Town Charter.*Not researched.*Prerequisite: None \(met\).*6 gold, 0 food, 1 order.*A2.*Affordable: yes.*Eligible now: yes/);
 assert.match(get('development-list').children[1].textContent,/Crop Rotation.*Town Charter \(not met\).*no qualifying supplied town.*Eligible now: no/);
 assert.match(get('development-list').children[0].textContent,/Adds 1 kingdom gold income while any town is supplied/);
 assert.match(get('development-list').children[1].textContent,/Adds 1 food per supplied farm, capped at 2 extra food, while a supplied Granary exists/);
 assert.match(get('development-list').children[2].textContent,/Infantry recruitment at a supplied Arsenal costs 2 gold instead of 3; food cost, headcount and order cost are unchanged/);
 let researchButtons=orderButtons(openCards()[0]);assert.equal(researchButtons.length,1);assert.match(researchButtons[0].children[0].textContent,/Research Town Charter at A2.*kingdom knowledge/);
 assert.match(researchButtons[0].children[1].textContent,/11 gold, 4 food.*Permanent kingdom knowledge.*capture does not transfer/);
 assert.match(researchButtons[0].children[1].textContent,/Blue: learns Town Charter; active: Town Charter; gold 8 -> 23; gold income 3 -> 17; food production 3 -> 19; food upkeep 3 -> 21/);
 assert.match(researchButtons[0].children[1].textContent,/Red: learns Crop Rotation; active: Crop Rotation; learns Organized Muster; gold 8 -> 24; gold income 3 -> 18; food production 3 -> 20; food upkeep 3 -> 22/);
 before=fetches;await run('perform('+JSON.stringify(rotation)+','+JSON.stringify(researchPreview)+')');assert.equal(fetches,before);
 // Even nonstandard requirements/status/prices are shown verbatim, not inferred from matching buildings or resources.
 setGame({...researchTown,developments:[{...developmentRows[1],goldCost:13,foodCost:9,orderCost:2,prerequisite:3,prerequisiteMet:1,town:0,affordable:0,eligible:0,known:1,active:0}]});
 assert.match(get('development-list').children[0].textContent,/Known; benefit suspended.*Organized Muster \(met\).*13 gold, 9 food, 2 orders.*A1.*Affordable: no.*Eligible now: no/);
 // An eligible-looking row does not create a research order; only the Fe legal list does.
 setGame({...researchTown,legal:[pass],previews:[{outcome:0}],developments:developmentRows.map(d=>({...d,eligible:1}))});run('selected=5;render()');assert.equal(orderButtons(openCards()[0]).length,0);
 // Captured and cut-off towns do not transfer/erase knowledge; active/suspended comes only from Fe.
 for(const [owner,supplied,active] of [[2,1,0],[1,0,0],[1,1,1]]){
  setGame({...researchTown,tiles:researchTown.tiles.map(t=>t.index===5?{...t,owner,supplied}:t),developments:[{...developmentRows[0],known:1,active,eligible:0}],legal:[pass],previews:[{outcome:0}]});
  assert.match(get('development-list').children[0].textContent,new RegExp('Known; benefit '+(active?'active':'suspended')));assert.equal(run('game.developments[0].known'),1);
 }
 // Fe's discounted infantry quote is used without changing base role-guide prices or computing savings in JS.
 setGame({...researchTown,tiles:researchTown.tiles.map(t=>t.index===5?{...t,specialty:2}:t),developments:[{...developmentRows[2],known:1,active:1,eligible:0}],legal:[pass,[2,5,5,2]],previews:[{outcome:0},{...preview,cost:2,foodCost:7,orderCost:1}]});run('selected=5;render()');assert.match(orderButtons(openCards()[0])[0].children[1].textContent,/2 gold, 7 food/);
 // Capture the originating development forecast before a request, not the successor's unrelated action index.
 setGame(researchTown);run('selected=5;render()');const researched={...researchTown,actions:[charter],state:{...start.state,orders:1},developments:developmentRows.map(d=>d.side===1&&d.id===1?{...d,known:1,active:1,eligible:0}:d),legal:[pass,rotation,muster],previews:[{outcome:0},{...researchPreview,index:1},{...researchPreview,index:2}],developmentPreviews:[{...charterProjection,blueGoldIncome:999}]};
 reply(researched);before=fetches;const researchClick=orderButtons(openCards()[0])[0],researching=researchClick.onclick();await researchClick.onclick();await researching;assert.equal(fetches,before+1);assert.equal(requests.at(-1).version,8);assert.deepEqual(requests.at(-1).actions,[charter]);
 assert.match(get('human-activity').textContent,/Researched Town Charter.*learns Town Charter; active: Town Charter.*gold income 3 -> 17/);assert.doesNotMatch(get('human-activity').textContent,/999/);
 assert.equal(run('replay().developments'),undefined);assert.equal(run('replay().developmentPreviews'),undefined);assert.equal(get('development-list').children[0].textContent.includes('Known; benefit active'),true);
 // Rejection preserves progression and the successful v8 checkpoint; no research is locally applied.
 const checkpointBeforeResearchFailure=storage.get(checkpointKey);response={ok:false,json:async()=>({error:'Research rejected'})};await run('perform('+JSON.stringify(rotation)+','+JSON.stringify(researchPreview)+')');assert.equal(run('game.actions.length'),1);assert.equal(storage.get(checkpointKey),checkpointBeforeResearchFailure);
 // Frozen v7 replay/checkpoint/slots remain isolated and read-only; v8 UI never projects developments onto them.
 const frontier={...researchTown,version:7,actions:[pass]};reply(frontier);await get('frontiers').onclick();assert.equal(requests.at(-1).version,7);assert.equal(requests.at(-1).mode,1);assert.match(get('status').textContent,/Legacy v7.*read-only/);
 assert.equal(get('developments').hidden,true);assert.equal(get('development-list').children.length,0);assert.equal(storage.get(checkpointKey),checkpointBeforeResearchFailure);assert.equal(get('frontiers').hidden,false);
 before=fetches;await run('perform('+JSON.stringify(charter)+','+JSON.stringify(researchPreview)+')');assert.equal(fetches,before);assert.equal(get('snapshot-save').disabled,true);assert.equal(get('snapshot-save').onclick(),false);
 assert.equal(run('replay().version'),7);assert.equal(storage.get('fe-kingdoms-v7'),frontiersSaved);assert.equal(storage.get('fe-kingdoms-v7-slots-v1'),frontiersSlots);
 assert.doesNotMatch(run('forecast('+JSON.stringify(charter)+','+JSON.stringify(researchPreview)+')'),/Fe changes/);
 assert.equal(run('CURRENT_VERSION'),8);assert.equal(run('CHECKPOINT'),'fe-kingdoms-v8');assert.equal(run('SNAPSHOTS'),'fe-kingdoms-v8-slots-v1');
 assert.ok(demos.every(d=>d.replay.version===8&&/V8-derived.*revalidated under v8 rules/.test(d.source)&&/not a recorded v8 match/.test(d.source)));
 // Routine unchanged kingdom forecasts add no narration; only differing Fe values are shown.
 setGame(researchTown);const unchangedKingdom={actionIndex:1,...JSON.parse(run('JSON.stringify(developmentBaseline())'))};
 const routine={...researchTown,legal:[pass,move],previews:[{outcome:0},{...preview,index:1,outcome:1}],developmentPreviews:[unchangedKingdom]};setGame(routine);
 const routineText=run('forecast('+JSON.stringify(move)+',game.previews[1])');assert.doesNotMatch(routineText,/Fe changes|known|active:|gold income|food production|food upkeep/);
 setGame({...routine,developmentPreviews:[]});assert.equal(run('forecast('+JSON.stringify(move)+',game.previews[1])'),routineText);
 setGame({...routine,developmentPreviews:[{...unchangedKingdom,blueGoldAfter:7}]});assert.equal(run('developmentForecast(game.developmentPreviews[0],developmentBaseline())'),' Fe changes: Blue: gold 8 -> 7.');
 // Supply-related suspension/restoration remains explicit before committing an otherwise ordinary move.
 const suppliedKnowledge=developmentRows.map(d=>d.side===1&&d.id===1?{...d,known:1,active:1}:d);
 const suspendedProjection={...unchangedKingdom,blueKnownMask:1,blueActiveMask:0,blueGoldIncome:2};
 const supplyMove={...routine,developments:suppliedKnowledge,developmentPreviews:[suspendedProjection]};setGame(supplyMove);
 assert.match(run('forecast('+JSON.stringify(move)+',game.previews[1])'),/Fe changes: Blue: suspended: Town Charter; gold income 3 -> 2/);
 assert.doesNotMatch(run('forecast('+JSON.stringify(move)+',game.previews[1])'),/Red:|learns|food production|food upkeep/);
 const suspendedRows=suppliedKnowledge.map(d=>d.side===1&&d.id===1?{...d,active:0}:d),suspendedEconomy=start.economy.map(e=>e.side===1?{...e,goldIncome:2}:e);
 reply({...supplyMove,actions:[move],developments:suspendedRows,economy:suspendedEconomy});await run('perform('+JSON.stringify(move)+',game.previews[1])');
 assert.match(get('human-activity').textContent,/suspended: Town Charter; gold income 3 -> 2/); // Must compare captured pre-action values, not this successor state.
 setGame({...routine,developments:suspendedRows,economy:suspendedEconomy,developmentPreviews:[{...unchangedKingdom,blueKnownMask:1,blueActiveMask:1}]});
 assert.match(run('forecast('+JSON.stringify(move)+',game.previews[1])'),/Fe changes: Blue: active: Town Charter; gold income 2 -> 3/);
 console.log('UI unit tests passed: v8 Fe-driven development rows/research/forecasts, isolated v1..v8 checkpoints and v7 slots, named snapshot safeguards and write-free prepared practice. Mocked DOM/transport, not browser or human playtesting.');
})().catch(e=>{console.error(e);process.exitCode=1});
