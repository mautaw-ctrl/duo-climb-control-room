import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const client=readFileSync('site/tracker/app.js','utf8');
const html=readFileSync('site/tracker/index.html','utf8');
const live=JSON.parse(readFileSync('tests/fixtures/dashboard.json','utf8'));
const sampleMatches=JSON.parse(readFileSync('tests/fixtures/history.json','utf8')).matches;
function harness(sample='10',extras=[]){
  const elements=new Map([...html.matchAll(/id="([^"]+)"/g)].map(m=>['#'+m[1],{value:'',style:{},dataset:{},textContent:'',innerHTML:'',addEventListener(){},prepend(){}}]));
  for(const [id,value] of Object.entries({player1:'restored#EUW',player2:'old#EUW',sample,targetRank:'GOLD IV',resultFilter:'all',stopLosses:'2',plannedGames:'3'}))elements.get('#'+id).value=value;
  const storage=new Map([['m442_extra_accounts',JSON.stringify(extras)]]),calls=[];
  const headers=Array.from({length:5},()=>({textContent:''}));
  const context=vm.createContext({console,URLSearchParams,AbortController,setInterval(){},requestAnimationFrame:fn=>fn(),localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    document:{querySelector:s=>elements.get(s)||null,querySelectorAll:s=>s==='#matchTable th'?headers:[],createElement:()=>({})},
    fetch:async url=>{calls.push(url);const u=new URL(url,'https://test');if(u.pathname==='/api/duo')return Response.json(live);const offset=Number(u.searchParams.get('offset'));const matches=Array.from({length:Math.max(0,Math.min(10,105-offset))},(_,i)=>({...sampleMatches[i%sampleMatches.length],id:'match-'+(offset+i)}));return Response.json({matches,nextOffset:offset+matches.length,hasMore:offset+matches.length<105,exhaustive:offset+matches.length>=105,fetchedPerPlayer:[offset+matches.length],scanLimit:1000});}});
  vm.runInContext(client,context);
  return {context,elements,storage,calls};
}
async function settle(h){for(let i=0;i<100;i++)await new Promise(r=>setImmediate(r));assert.equal(h.elements.get('#apierror').style.display,'none',h.elements.get('#apierror').textContent);}
for(const sample of ['10','20','50','100','all'])test('Tracker boots without extra accounts and loads sample '+sample,async()=>{
  const h=harness(sample);await settle(h);
  assert.equal(h.elements.get('#player1').value,'Davy442#EUW');
  assert.equal(h.elements.get('#combinedGames').textContent,String(sample==='all'?105:Number(sample)));
  assert.ok(h.calls[0].includes('summary=1'));
  assert.match(h.elements.get('#p1').innerHTML,/GOLD IV/);
});
test('Extra accounts combine unique matches without double counting',async()=>{const h=harness('20',['Another#EUW']);await settle(h);assert.equal(h.elements.get('#combinedGames').textContent,'20');assert.match(h.elements.get('#extraRows').innerHTML,/Another#EUW/);});
test('Goal selection changes the actual progress calculation',async()=>{const h=harness();await settle(h);h.elements.get('#targetRank').value='PLATINUM IV';vm.runInContext('renderGoals()',h.context);assert.match(h.elements.get('#goal1').innerHTML,/320 RP remaining/);assert.match(h.elements.get('#goal1').innerHTML,/60% COMPLETE/);});
test('Session record is based on match timestamps, not moving sample totals',async()=>{const h=harness();await settle(h);h.storage.set('m442_session',JSON.stringify({start:Date.now()-1000,pair:'davy442#euw|sdsarah#euw'}));vm.runInContext('updateSession()',h.context);assert.equal(h.elements.get('#sessionRecord').textContent,'0-0');});
