import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('src/index.js','utf8').replace('export default {','globalThis.app = {');
function server(fail=false){
 let requests=0;const context=vm.createContext({console:{error(){},warn(){}},URL,Request,Response,Headers,TextEncoder,
 caches:{default:{match:async()=>null,put:async()=>{}}},fetch:async url=>{
  requests++;
  if(url.includes('/accounts/by-riot-id/'))return Response.json({puuid:url.includes('Davy442')?'a':'b'});
  if(url.includes('/entries/'))return Response.json([{queueType:'RANKED_SOLO_5x5',tier:'GOLD',rank:'IV',leaguePoints:80,wins:44,losses:29}]);
  if(url.includes('/ids?'))return Response.json(Array.from({length:23},(_,i)=>'M'+i));
  const id=url.split('/').at(-1),i=Number(id.slice(1));
  if(fail&&i===3)return new Response('rate limited',{status:429,headers:{'Retry-After':'17'}});
  const participant=(puuid,teamId)=>({puuid,teamId,championName:'Champion',kills:3,deaths:2,assists:5,win:i%2===0});
  return Response.json({metadata:{matchId:id},info:{queueId:i===2?440:420,gameCreation:1700000000000-i*1000,gameDuration:1800,participants:[participant('a',100),participant('b',i===1?200:100)]}});
 }});
 vm.runInContext(source,context);
 return {request:path=>context.app.fetch(new Request('https://test'+path),{RIOT_API_KEY:'test'}),requests:()=>requests};
}
test('Summary returns ranks without expensive match requests',async()=>{const s=server();const r=await s.request('/api/duo?summary=1');const j=await r.json();assert.equal(r.status,200);assert.equal(s.requests(),4);assert.equal(j.players.length,2);});
test('History is bounded, excludes opponents and Flex, paginates to exhaustion',async()=>{const s=server();const first=await(await s.request('/api/duo-history?sample=all&offset=0')).json();assert.equal(first.matches.length,8);assert.equal(first.nextOffset,10);assert.equal(first.hasMore,true);assert.equal(s.requests(),13);const last=await(await s.request('/api/duo-history?sample=all&offset=20')).json();assert.equal(last.matches.length,3);assert.equal(last.hasMore,false);assert.equal(last.exhaustive,true);});
test('Rate limits preserve retry time instead of silently skipping matches',async()=>{const r=await server(true).request('/api/duo-history?sample=20');assert.equal(r.status,429);assert.equal(r.headers.get('Retry-After'),'17');assert.equal((await r.json()).ok,false);});
