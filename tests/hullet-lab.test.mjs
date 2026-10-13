import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import vm from "node:vm";

const lab=readFileSync("site/hullet-lab/index.html","utf8");
const scene=readFileSync("site/hullet-lab/scene.js","utf8");
const fractal=readFileSync("site/hullet-lab/fractal.js","utf8");
const css=readFileSync("site/hullet-lab/scene.css","utf8");
const root=readFileSync("site/index.html","utf8");

test("The live homepage remains untouched and the prototype uses a separate path",()=>{
  assert.match(root,/<title>hullet<\/title>/);
  assert.doesNotMatch(root,/hullet-lab/);
  assert.match(lab,/<title>hullet<\/title>/);
  assert.match(lab,/\/hullet-lab\/fractal\.js/);
  assert.match(lab,/src="\/jesus-figure\.js/);
  assert.match(lab,/href="\/tracker\/"|href="\/win98"|href="\/player\//);
});
test("Fibonacci sequences, golden angle and sphere are mathematical, not decorative labels",()=>{
  const ctx=vm.createContext({window:{JesusFigure:function(){}}});
  assert.doesNotThrow(()=>new vm.Script(fractal));
  vm.runInContext(fractal,ctx);
  const {PHI,GOLDEN_ANGLE,fibonacci,spherePoint}=ctx.window.HulletMath;
  assert.ok(Math.abs(PHI*PHI-(PHI+1))<1e-12);
  assert.ok(Math.abs(GOLDEN_ANGLE*180/Math.PI-137.507764)<0.0001);
  assert.deepEqual(Array.from({length:12},(_,i)=>fibonacci(i)),[0,1,1,2,3,5,8,13,21,34,55,89]);
  for(let i=0;i<610;i++){
    const [x,y,z]=spherePoint(i,610);
    assert.ok(Math.abs(x*x+y*y+z*z-1)<1e-10);
  }
});
test("Three patterns build in a single WebGL context with shared static buffers",()=>{
  assert.match(fractal,/gl\.STATIC_DRAW/);
  assert.match(fractal,/Figure\.prototype\.draw=function/);
  assert.match(fractal,/originalDraw\.call\(this,state\)/);
  assert.match(fractal,/gl\.drawArrays\(gl\.LINES/);
  assert.match(fractal,/gl\.drawArrays\(gl\.POINTS/);
  assert.match(fractal,/for\(let i=0;i<987;i\+\+\)/);
  assert.match(fractal,/spherePoint\(i,610\)/);
  assert.match(fractal,/for\(let ring=1;ring<=2;ring\+\+\)/);
  assert.match(fractal,/gl\.deleteBuffer/);
});
test("Menu adds depth without sacrificing native navigation and keyboard input",()=>{
  assert.match(lab,/<details class="nav-drop"/);
  assert.match(lab,/<details class="menu-theory"/);
  for(const choice of ["auto","0","1","2"])assert.ok(lab.includes('data-pattern="'+choice+'"'));
  for(const quality of ["eco","high"])assert.ok(lab.includes('data-quality="'+quality+'"'));
  assert.match(scene,/event\.key==="Escape"/);
  assert.match(lab,/aria-pressed="true"/);
  assert.match(lab,/href="#duo-tracker"/);
});
test("Motion remains bounded, optional and responsive to scrolling",()=>{
  assert.doesNotThrow(()=>new vm.Script(scene));
  assert.match(scene,/ts-last<interval/);
  assert.match(scene,/prefers-reduced-motion: reduce/);
  assert.match(scene,/webglcontextlost/);
  assert.match(scene,/webglcontextrestored/);
  assert.match(scene,/Math\.exp\(-delta\*6\.5\)/);
  assert.match(scene,/requestAnimationFrame/);
  assert.match(scene,/document\.hidden/);
  assert.match(scene,/geometryIntensity/);
  assert.match(scene,/autoEconomy=true/);
  assert.match(css,/@media\(max-width:690px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
test("Visible fallback exists even when WebGL or JS initialization fails",()=>{
  assert.match(lab,/class="fallback"/);
  assert.match(lab,/jesus-figure\.png/);
  assert.match(css,/\.figure-unavailable \.fallback\{opacity:1\}/);
  assert.match(css,/\.has-webgl \.fallback\{opacity:\.025\}/);
});
