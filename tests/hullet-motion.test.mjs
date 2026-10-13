import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('site/hullet.js','utf8');
async function scene(){
 const events={},draws=[],frames=new Map(),classes=new Set();let next=0,lost=false;
 const gl={viewport(){},clearColor(){},clear(){},isContextLost:()=>lost};
 const motion={hidden:false,querySelector:()=>({}),setAttribute(){},addEventListener:(n,fn)=>events['motion:'+n]=fn};
 const canvas={style:{},getContext:()=>gl,addEventListener:(n,fn)=>events[n]=fn};
 const document={hidden:false,getElementById:id=>id==='figure'?canvas:motion,querySelectorAll:()=>[],documentElement:{scrollHeight:3000},body:{classList:{add:n=>classes.add(n),remove:n=>classes.delete(n)}},addEventListener:(n,fn)=>events[n]=fn};
 const context=vm.createContext({console,document,innerWidth:1200,innerHeight:800,devicePixelRatio:1,scrollY:0,matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){},requestAnimationFrame:fn=>{frames.set(++next,fn);return next},cancelAnimationFrame:id=>frames.delete(id),window:{addEventListener(){},JesusFigure:class{ready=true;async load(){}dispose(){}draw(state){draws.push(state)}}}});
 vm.runInContext(source,context);await Promise.resolve();await Promise.resolve();
 const tick=ts=>{const queued=[...frames.values()];frames.clear();queued.forEach(fn=>fn(ts));};
 return {events,draws,frames,classes,canvas,motion,tick,lose:v=>lost=v};
}
test('Pause preserves rotation, stops RAF, and resumes without a snap',async()=>{const s=await scene();s.tick(100);s.tick(140);const before=s.draws.at(-1).rotation[1];s.events['motion:click']();assert.equal(s.draws.at(-1).rotation[1],before);assert.equal(s.frames.size,0);s.events['motion:click']();s.tick(180);assert.ok(s.draws.at(-1).rotation[1]>before);});
test('Graphics context loss shows fallback and restoration restarts the original figure',async()=>{const s=await scene();s.lose(true);s.events.webglcontextlost({preventDefault(){}});assert.equal(s.classes.has('has-webgl'),false);assert.equal(s.frames.size,0);s.lose(false);await s.events.webglcontextrestored();assert.equal(s.classes.has('has-webgl'),true);assert.equal(s.motion.hidden,false);assert.equal(s.frames.size,1);});
