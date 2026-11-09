// Unit tests with mocked DOM/transport, not browser or human playtest evidence.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'../web/index.html'),'utf8');
const elements=new Map();
function element(){return {textContent:'',value:'0',disabled:false,files:[],children:[],append(e){this.children.push(e)},replaceChildren(){this.children=[]},setAttribute(){},click(){}};}
const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id)};
let saved=JSON.stringify({version:1,difficulty:0,actions:[[0,0,0,0]]}),fetches=0,accept=false,response,requests=[],confirmations=[];
const context=vm.createContext({document:{getElementById:get,querySelectorAll:()=>[...elements.values()],createElement:element},localStorage:{getItem:()=>saved,setItem:(k,v)=>saved=v},confirm:message=>{confirmations.push(message);return accept},fetch:async(url,options)=>{fetches++;requests.push(JSON.parse(options.body));return response},console,setTimeout,URL,Blob});
vm.runInContext(html.split('<script>')[1].split('</script>')[0],context);
const run=s=>vm.runInContext(s,context);
const pass=[0,0,0,0],recruit=[2,0,0,2],move=[1,0,1,4],badAttack=[1,1,2,1];
const preview={index:1,outcome:4,cost:3,sourceTroops:7,targetTroops:7,targetOwner:1,nextSide:1,nextOrders:1,result:0,defense:0};
const start={version:1,difficulty:0,state:{side:1,orders:2,turn:1,result:0,gold1:6,gold2:6,nodes:0,depth:1},tiles:Array.from({length:15},(_,index)=>({index,owner:[0,1,5].includes(index)?1:0,troops:index===0?5:1,fort:0,supplied:1,terrain:index===0?4:0})),legal:[pass,recruit,move,badAttack],previews:[{index:0,outcome:0},preview,{index:2,outcome:1,sourceTroops:1,targetTroops:5},{index:3,outcome:3,sourceTroops:1,targetTroops:1,defense:1}],actions:[]};
function setGame(value){run('game='+JSON.stringify(value)+';render();')}
function reply(value){response={ok:true,json:async()=>JSON.parse(JSON.stringify(value))};}
(async()=>{
 // Existing checkpoint cannot be silently replaced; failure paths preserve it.
 const recorded={...start,actions:[pass]};setGame(recorded);run('selected=5');
 get('new').onclick();assert.equal(fetches,0);assert.equal(run('selected'),5);
 get('file').files=[];await get('file').onchange();assert.equal(run('selected'),5);
 get('file').files=[{size:10,text:async()=>{throw Error('read failed')}}];await get('file').onchange();assert.equal(run('selected'),5);assert.match(get('error').textContent,/read failed/);assert.equal(run('busy'),false);
 await run("load('{bad')");assert.equal(run('selected'),5);assert.equal(fetches,0);
 response={ok:false,json:async()=>({error:'Fe rejected'})};await run('load('+JSON.stringify(saved)+')');assert.equal(run('selected'),5);assert.equal(run('game.actions.length'),1);
 // New game defaults to a friendly territory, communicates kingdom-wide budget.
 accept=true;reply(start);await get('new').onclick();assert.equal(run('selected'),0);assert.equal(requests.at(-1).mode,1);assert.match(get('turn-guide').textContent,/TOTAL across your whole kingdom/);
 assert.match(get('opening-hint').textContent,/select A2 \(free\).*recruit \+2.*order 1.*neutral town B2 \(order 2\)/);
 let before=fetches;get('board').children[5].onclick();assert.equal(fetches,before);assert.equal(run('game.state.orders'),2);
 // First action is replay-only; no computer action follows automatically.
 const first={...start,state:{...start.state,orders:1,gold1:3},actions:[recruit]};
 reply(first);await run('perform('+JSON.stringify(recruit)+','+JSON.stringify(preview)+')');
 assert.equal(requests.at(-1).mode,1);assert.equal(run('game.state.orders'),1);assert.match(get('turn-guide').textContent,/Red has not moved/);assert.match(get('status').textContent,/1 of 2/);assert.match(get('human-activity').textContent,/Recruit \+2/);
 assert.equal(get('opening-hint').textContent,'');
 // Second action explicitly pauses on Red with a Run computer turn button.
 const second={...first,state:{...first.state,side:2,orders:2,turn:2,gold2:8},actions:[recruit,move]};
 reply(second);before=fetches;await run('perform('+JSON.stringify(move)+','+JSON.stringify(start.previews[2])+')');
 assert.equal(fetches,before+1);assert.equal(requests.at(-1).mode,1);assert.equal(run('game.state.side'),2);assert.match(get('turn-guide').textContent,/used both orders/);assert.equal(get('actions').children.length,1);assert.equal(get('actions').children[0].textContent,'Run computer turn');
 // Only explicit computer button requests mode0. Its actions are narrated.
 const ai=[2,9,9,2],next={...start,state:{...start.state,turn:3,gold1:5,gold2:5},actions:[recruit,move,ai]};
 reply(next);await get('actions').children[0].onclick();assert.equal(requests.at(-1).mode,0);assert.match(get('activity').textContent,/Computer: 1. Recruit/);assert.match(get('status').textContent,/Round 2/);assert.match(get('human-activity').textContent,/Your last order/);
 // Pass and known-failing attacks require informed, cancelable confirmation.
 accept=false;before=fetches;await run('perform('+JSON.stringify(pass)+',game.previews[0])');assert.equal(fetches,before);assert.match(confirmations.at(-1),/give up 2/);
 await run('perform('+JSON.stringify(badAttack)+','+JSON.stringify(start.previews[3])+')');assert.equal(fetches,before);assert.match(confirmations.at(-1),/all 1 attackers lost/);
 assert.match(run('forecast('+JSON.stringify([1,0,6,4])+',{outcome:2,targetTroops:2,sourceTroops:1,defense:2})'),/capture B2 with 2 survivors/);
 const drawText=run('forecast([0,0,0,0],{outcome:0,result:3})');
 assert.match(drawText,/ends the match in a draw/i);assert.doesNotMatch(drawText,/Red plays next/);
 assert.match(run('forecast([1,13,14,8],{outcome:2,result:1})'),/wins the match immediately/);
 assert.match(run('forecast([1,13,14,8],{outcome:2,result:1},true)'),/won the match/);
 // Invalid load keeps current state; successful Red-side load preserves pause.
 reply(second);await run('load('+JSON.stringify(JSON.stringify({version:1,difficulty:0,actions:second.actions}))+')');assert.equal(run('selected'),null);assert.equal(get('actions').children[0].textContent,'Run computer turn');assert.match(get('activity').textContent,/Replay restored/);
 // An old response with no previews still renders safely.
 const old={...start};delete old.previews;setGame(old);assert.doesNotThrow(()=>run('render()'));assert.equal(run('busy'),false);
 console.log('UI unit tests passed: kingdom-wide order budget, free selection, first/second order pacing, explicit computer turn, forecasts and canceled risks, checkpoint/load safety.');
})().catch(e=>{console.error(e);process.exitCode=1});
