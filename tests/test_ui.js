// Mocked DOM/transport only; this does not claim browser or human playtest coverage.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'../web/index.html'),'utf8');
const elements=new Map();
function element(){return {textContent:'',value:'0',disabled:false,hidden:false,files:[],children:[],style:{},attrs:{},append(e){this.children.push(e)},replaceChildren(){this.children=[]},setAttribute(k,v){this.attrs[k]=v},click(){},focus(){}};}
const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id)};
const legacySaved=JSON.stringify({version:1,difficulty:0,actions:[[0,0,0,0]]});
const previousSaved=JSON.stringify({version:2,scenario:0,difficulty:0,actions:[[0,0,0,0]]});
const campaignSaved=JSON.stringify({version:3,scenario:0,difficulty:0,actions:[[0,0,0,0]]});
const storage=new Map([['fe-kingdoms-v1',legacySaved],['fe-kingdoms-v2',previousSaved],['fe-kingdoms-v3',campaignSaved],['fe-kingdoms-v4',JSON.stringify({version:4,scenario:0,difficulty:0,actions:[[0,0,0,0]]})],['fe-kingdoms-v5',JSON.stringify({version:5,scenario:0,difficulty:0,actions:[[0,0,0,0]]})],['fe-kingdoms-v7',JSON.stringify({version:7,scenario:0,difficulty:0,actions:[[0,0,0,0]]})]]);
const riversSaved=JSON.stringify({version:6,scenario:0,difficulty:0,actions:[[0,0,0,0]]});storage.set('fe-kingdoms-v6',riversSaved);
let fetches=0,accept=false,response,requests=[],confirmations=[];
const context=vm.createContext({document:{getElementById:get,querySelectorAll:()=>[...elements.values()],createElement:element},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},confirm:message=>{confirmations.push(message);return accept},fetch:async(url,options)=>{fetches++;requests.push(JSON.parse(options.body));return response},console,setTimeout,URL,Blob});
vm.runInContext(html.split('<script>')[1].split('</script>')[0],context);
const run=s=>vm.runInContext(s,context),pass=[0,0,0,0],recruit=[2,0,0,2],move=[1,0,1,4],badAttack=[1,1,2,1];
const preview={foodCost:2,food1After:10,food2After:12,settlementAfter:0,index:1,outcome:4,cost:3,sourceTroops:7,targetTroops:7,targetOwner:1,nextSide:1,nextOrders:1,result:0,defense:0};
const start={version:7,difficulty:0,economy:[{side:1,food:12,goldIncome:3,foodProduction:3,foodUpkeep:3,foodNet:0,disconnectedTiles:0,shortageLossesNextTurn:0},{side:2,food:12,goldIncome:3,foodProduction:3,foodUpkeep:3,foodNet:0,disconnectedTiles:0,shortageLossesNextTurn:0}],map:{width:5,height:3,count:15,topology:1,scenario:0,blueCapital:0,redCapital:14,orderBudget:2,baseRoundLimit:60,extensionRounds:20,traceCapacity:2048},state:{side:1,orders:2,turn:1,result:0,completedRounds:0,roundLimit:60,decisionPending:0,traceCapacityReached:0,gold1:8,gold2:8,nodes:0,depth:1},tiles:Array.from({length:15},(_,index)=>({index,q:index%5,r:Math.floor(index/5),owner:[0,1,5].includes(index)?1:0,troops:index===0?5:1,infantry:index===0?5:1,cavalry:0,siege:0,fort:0,supplied:1,settlement:index===5?1:0,passable:1,upkeep:index===0?2:0,terrain:index===0?4:0})),legal:[pass,recruit,move,badAttack],previews:[{index:0,outcome:0},preview,{index:2,outcome:1,sourceTroops:1,targetTroops:5},{index:3,outcome:3,sourceTroops:1,targetTroops:1,defense:1}],actions:[]};
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
 accept=true;reply(start);await get('new').onclick();assert.equal(run('selected'),null);assert.equal(requests.at(-1).version,7);assert.equal(requests.at(-1).mode,1);
 assert.match(get('turn-guide').textContent,/orders TOTAL/);assert.match(get('opening-hint').textContent,/5 troops from A1 to B1.*order 1.*7 from B1 to forest B2.*order 2.*Fe forecast/);
 assert.equal(get('actions').children.length,3);assert.equal(openCards().length,0);assert.equal(get('global-actions').children.length,1);
 let before=fetches;get('actions').children[0].children[0].onclick();assert.equal(run('selected'),0);assert.equal(openCards().length,1);assert.equal(orderButtons(openCards()[0]).length,2);assert.equal(fetches,before);
 get('actions').children[1].children[0].onclick();assert.equal(run('selected'),1);assert.equal(openCards().length,1);assert.equal(orderButtons(openCards()[0]).length,1);assert.match(orderButtons(openCards()[0])[0].children[1].textContent,/all 1 attackers lost/); // Original preview index retained.
 get('board').children[5].onclick();assert.equal(run('selected'),5);assert.equal(openCards().length,1);assert.equal(fetches,before);
 get('actions').children[2].children[0].onclick();assert.equal(run('selected'),null);assert.equal(openCards().length,0);
 // True axial geometry, not a rectangular grid with clipped corners.
 assert.equal(get('board').children[0].style.left,'0px');assert.equal(get('board').children[5].style.left,'74px');assert.equal(get('board').children[5].style.top,'128px');assert.equal(get('board').children[10].style.left,'148px');
 const first={...start,state:{...start.state,orders:1,gold1:3},actions:[recruit]};reply(first);await run('perform('+JSON.stringify(recruit)+','+JSON.stringify(preview)+')');
 assert.equal(requests.at(-1).version,7);assert.equal(requests.at(-1).mode,1);assert.equal(run('game.state.orders'),1);assert.match(get('turn-guide').textContent,/Red has not moved/);assert.equal(get('opening-hint').textContent,'');
 const second={...first,state:{...first.state,side:2,orders:2,turn:2,gold2:8},actions:[recruit,move]};reply(second);before=fetches;await run('perform('+JSON.stringify(move)+','+JSON.stringify(start.previews[2])+')');
 assert.equal(fetches,before+1);assert.equal(requests.at(-1).mode,1);assert.equal(get('global-actions').children[0].textContent,'Run computer turn');
 const ai=[2,9,9,2],next={...start,state:{...start.state,turn:3,completedRounds:1,gold1:5,gold2:5},actions:[recruit,move,ai]};reply(next);await get('global-actions').children[0].onclick();assert.equal(requests.at(-1).mode,0);assert.match(get('activity').textContent,/Computer: 1. Recruit/);assert.match(get('status').textContent,/Completed rounds: 1 \/ 60/);
 accept=false;before=fetches;await run('perform('+JSON.stringify(pass)+',game.previews[0])');assert.equal(fetches,before);assert.match(confirmations.at(-1),/give up 2/);
 await run('perform('+JSON.stringify(badAttack)+','+JSON.stringify(start.previews[3])+')');assert.equal(fetches,before);assert.match(confirmations.at(-1),/all 1 attackers lost/);
 assert.match(run('forecast([0,0,0,0],{outcome:0,result:3})'),/ends the match in a draw/i);assert.match(run('forecast([1,13,14,8],{outcome:2,result:1})'),/wins the match immediately/);
 // Loading v6 on Red still pauses. Legacy loads are read-only and preserve BOTH checkpoints.
 reply(second);await run('load('+JSON.stringify(JSON.stringify({version:7,scenario:0,difficulty:0,actions:second.actions}))+')');assert.equal(run('selected'),null);assert.equal(get('global-actions').children[0].textContent,'Run computer turn');
 const hexSaved=storage.get('fe-kingdoms-v7'),legacy={...start,tiles:untypedTiles(),economy:[],version:1,map:{...start.map,topology:0},actions:[pass]};reply(legacy);await get('legacy').onclick();assert.equal(requests.at(-1).version,1);assert.equal(requests.at(-1).mode,1);assert.equal(storage.get('fe-kingdoms-v1'),legacySaved);assert.equal(storage.get('fe-kingdoms-v7'),hexSaved);assert.equal(storage.get('fe-kingdoms-v3'),campaignSaved);assert.equal(storage.get('fe-kingdoms-v2'),previousSaved);assert.match(get('turn-guide').textContent,/read.only|original square rules/i);assert.match(get('global-actions').children[0].textContent,/Read-only/);assert.equal(get('board').children[5].style.left,'0px');assert.equal(get('board').children[5].style.top,'172px');
 before=fetches;await run('perform('+JSON.stringify(recruit)+','+JSON.stringify(preview)+')');assert.equal(fetches,before);assert.equal(run('replay().version'),1);
 // v2 is also read-only, retaining its own rules/checkpoint and the v6 save.
 const previous={...start,tiles:untypedTiles(),economy:[],version:2,actions:[pass]};reply(previous);await get('previous').onclick();assert.equal(requests.at(-1).version,2);assert.equal(storage.get('fe-kingdoms-v7'),hexSaved);assert.equal(storage.get('fe-kingdoms-v3'),campaignSaved);assert.equal(storage.get('fe-kingdoms-v2'),previousSaved);assert.equal(run('replay().version'),2);assert.match(get('status').textContent,/v2 hex replay/);
 before=fetches;await run('perform('+JSON.stringify(recruit)+','+JSON.stringify(preview)+')');assert.equal(fetches,before);
 // v3 campaigns retain economy but do not invent role counts or overwrite the v6 save.
 const campaign={...start,tiles:untypedTiles(),version:3,actions:[pass]};reply(campaign);await get('campaign').onclick();assert.equal(requests.at(-1).version,3);assert.equal(storage.get('fe-kingdoms-v3'),campaignSaved);assert.equal(storage.get('fe-kingdoms-v7'),hexSaved);assert.equal(run('replay().version'),3);assert.match(get('status').textContent,/v3 campaign replay/);assert.equal(get('economy').children.length,2);run('selected=0;render()');assert.doesNotMatch(get('territory-detail').textContent,/Infantry/);
 before=fetches;await run('perform('+JSON.stringify(recruit)+','+JSON.stringify(preview)+')');assert.equal(fetches,before);
 // All three map choices use engine dimensions and retain their scenario in saves.
 accept=true;
 for(const [scenario,width,height] of [[0,5,3],[1,7,5],[2,9,5]]){
  const mapped={...start,map:{...start.map,scenario,width,height,count:width*height,redCapital:width*height-1},tiles:Array.from({length:width*height},(_,index)=>({...start.tiles[0],index,q:index%width,r:Math.floor(index/width),owner:[0,1,width].includes(index)?1:0,terrain:index===0?4:0}))};
  get('scenario').value=String(scenario);reply(mapped);await get('new').onclick();assert.equal(requests.at(-1).scenario,scenario);assert.equal(requests.at(-1).version,7);assert.equal(get('board').children.length,width*height);assert.equal(run('replay().scenario'),scenario);assert.match(get('goal').textContent,new RegExp(String.fromCharCode(64+width)+height));assert.equal(get('board').children[width].style.left,'74px');
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
 reply(boundary);await run('load('+JSON.stringify(JSON.stringify({version:7,scenario:0,difficulty:0,actions:boundary.actions}))+')');
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
 setGame(boundary);const savedBefore=storage.get('fe-kingdoms-v7');response={ok:false,json:async()=>({error:'Decision rejected'})};
 await get('global-actions').children[0].onclick();assert.equal(run('game.state.decisionPending'),1);assert.equal(storage.get('fe-kingdoms-v7'),savedBefore);assert.equal(run('busy'),false);assert.match(get('error').textContent,/Decision rejected/);
 // New byte ceiling is inclusive; oversized files are rejected before reading or transport.
 before=fetches;let reads=0;get('file').files=[{size:262145,text:async()=>{reads++;return '{}'}}];await get('file').onchange();assert.equal(reads,0);assert.equal(fetches,before);assert.match(get('error').textContent,/too large/);
 reply(start);get('file').files=[{size:262144,text:async()=>{reads++;return JSON.stringify({version:7,scenario:0,difficulty:0,actions:[]})}}];await get('file').onchange();assert.equal(reads,1);assert.equal(fetches,before+1);assert.equal(requests.at(-1).version,7);
 // Rivers/bridges are readable, distinct artwork. Passability remains Fe-provided.
 const riverMap={...start,tiles:start.tiles.map(t=>t.index===2?{...t,terrain:8,passable:0,troops:0,infantry:0}:t.index===1?{...t,terrain:9}:t),supply:[{side:1,connectedOwned:17,cutOffOwned:3},{side:2,connectedOwned:11,cutOffOwned:6}]};
 setGame(riverMap);run('selected=2;render()');
 assert.match(get('board').children[2].attrs['aria-label'],/River.*impassable/);assert.match(get('board').children[2].className,/river blocked/);
 assert.match(get('territory-detail').textContent,/River: impassable.*fixed bridge/);
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
 const v7Saved=storage.get('fe-kingdoms-v7'),frozenSaves=new Map(storage),v5={...boundary,version:5,supply:undefined};
 reply(v5);await get('rounds').onclick();assert.equal(requests.at(-1).version,5);assert.equal(requests.at(-1).mode,1);assert.equal(run('replay().version'),5);
 assert.match(get('status').textContent,/Legacy v5 campaign replay.*Saved at round-limit decision.*Completed rounds: 60 \/ 60/);
 assert.match(get('turn-guide').textContent,/Saved at a round-limit decision/);assert.equal(get('global-actions').children.length,1);assert.match(get('global-actions').children[0].textContent,/Read-only/);
 assert.equal(get('supply').hidden,true);assert.equal(get('rounds').hidden,false);assert.equal(get('save').disabled,false);
 for(const [key,value] of frozenSaves)assert.equal(storage.get(key),value);assert.equal(storage.get('fe-kingdoms-v7'),v7Saved);
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
 const old={...start};delete old.previews;setGame(old);run('selected=0;render()');assert.doesNotThrow(()=>run('render()'));assert.equal(run('busy'),false);
 assert.match(orderButtons(openCards()[0])[0].children[0].textContent,/Check Fe order cost/);assert.doesNotMatch(orderButtons(openCards()[0])[0].children[0].textContent,/1 order/);
 console.log('UI unit tests passed: v7 forest art, native defense/detachments/order costs, explicit turns, one-open territory hierarchy, accessible role badges and zoom, supply/campaign forecasts, and isolated v1..v7 replay checkpoints. Mocked DOM/transport, not browser or human playtesting.');
})().catch(e=>{console.error(e);process.exitCode=1});
