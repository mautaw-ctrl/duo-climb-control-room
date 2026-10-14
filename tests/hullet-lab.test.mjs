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
  assert.match(lab,/src="\.\/fractal\.js/);
  assert.match(lab,/src="\.\.\/jesus-figure\.js/);
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
  assert.match(fractal,/function gasket\(/);
  assert.match(fractal,/gasket\(ca,bc,c,depth-1,seed\)/);
  assert.match(fractal,/for\(let satellite=0;satellite<8;satellite\+\+\)/);
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
  assert.match(lab,/href="\.\/scene\.css/);
  assert.match(scene,/figure\.load\("\.\.\/jesus-figure\.png"\)/);
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

test("The public lab does not offer the removed Crystal Storm or Head Lab",()=>{
  assert.match(lab,/id="laboratorium"/);
  assert.doesNotMatch(lab,/data-studio="instancing"/);
  assert.doesNotMatch(lab,/data-studio="head"/);
  assert.doesNotMatch(lab,/id="studio-modal"/);
  assert.doesNotMatch(lab,/href="\.\/head\//);
  assert.doesNotMatch(lab,/href="\.\/instancing\//);
  assert.match(lab,/href="\.\/model-frontpage\//);
});
test("Aliases retain model navigation and remove abandoned tools",()=>{
  const worker=readFileSync("src/index.js","utf8");
  assert.match(worker,/\["\/test", "\/hullet-lab\/"\]/);
  assert.match(worker,/\["\/models", "\/hullet-lab\/model-frontpage\/"\]/);
  assert.doesNotMatch(worker,/\["\/instancing",/);
  assert.doesNotMatch(worker,/\["\/head",/);
  assert.match(worker,/Response\.redirect\(new URL\(target, url\), 302\)/);
});
test("Hullet Phi links to an isolated glTF viewer without loading another GPU canvas",()=>{
  assert.match(lab,/href="\.\/artefact\/"/);
  assert.match(lab,/class="lab-card artefact-card"/);
  const worker=readFileSync("src/index.js","utf8");
  assert.match(worker,/\["\/artefact", "\/hullet-lab\/artefact\/"\]/);
});

test("Model Frontpage has selectable glTF and exact Sketchfab Thunderfury link",()=>{
  const modelHTML=readFileSync("site/hullet-lab/model-frontpage/index.html","utf8");
  const modelJS=readFileSync("site/hullet-lab/model-frontpage/app.js","utf8");
  const modelCSS=readFileSync("site/hullet-lab/model-frontpage/style.css","utf8");
  assert.match(lab,/href="\.\/model-frontpage\/"/);
  assert.match(modelHTML,/<option value="thunderfury">/);
  assert.match(modelHTML,/<option value="fox">/);
  assert.match(modelHTML,/johnskyrim/);
  assert.match(modelJS,/d4033484327540f298185d4fe87c78bb/);
  assert.match(modelJS,/Sketchfab/);
  assert.match(modelJS,/new THREE.WebGLRenderer/);
  assert.match(modelCSS,/@media\(max-width:760px\)/);
  assert.doesNotThrow(()=>new vm.Script(readFileSync("site/hullet-lab/model-frontpage/boot.js","utf8")));
});

test("The original Jesus is selected first with a broad built-in model archive",()=>{
  const html=readFileSync("site/hullet-lab/model-frontpage/index.html","utf8");
  const script=readFileSync("site/hullet-lab/model-frontpage/app.js","utf8");
  const boot=readFileSync("site/hullet-lab/model-frontpage/boot.js","utf8");
  const options=[...html.matchAll(/<option value="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(options[0],"jesus");
  assert.equal(options.length,24);
  for(const model of ["fox","cesiumman","milkTruck","toyCar","sunglasses",
      "boomBox","sheenChair","irisLamp","lantern","animatedBox","thunderfury",
      "riggedFigure","scatteringSkull","materialsShoe","waterBottle",
      "glamSofa","barnLamp","avocado","teaCup","abalone","oliveDish",
      "irisSuzanne","clearCoat"])
    assert.ok(options.includes(model),model);
  assert.match(html,/id="jesus-background"/);
  assert.match(html,/jesus-figure\.js/);
  assert.match(script,/new window\.JesusFigure/);
  assert.match(script,/__HULLET_JESUS_READY=true/);
  assert.match(boot,/__HULLET_JESUS_READY/);
  assert.match(script,/new THREE\.WebGLRenderer/);
});

test("Every locally referenced GLB is physically bundled, with a valid binary magic header",()=>{
  const root="site/hullet-lab/model-frontpage/";
  const script=readFileSync(root+"app.js","utf8");
  const matches=[...script.matchAll(/url:"(\.\/models\/[^"]+\.glb)"/g)];
  assert.equal(matches.length,21,"All locally served GLB choices excluding Sunglasses");
  for(const [_,rel] of matches){
    const file=readFileSync(root+rel);
    assert.ok(file.length>10000,rel+" not bundled");
    assert.equal(file.subarray(0,4).toString("utf8"),"glTF",rel+" corrupt");
  }
  assert.match(script,/new window\.JesusFigure/);
  assert.match(script,/\$\("random"\)\.addEventListener/);
});

test("The cinematic model scene keeps Jesus as default with four live atmosphere modes",()=>{
  const html=readFileSync("site/hullet-lab/model-frontpage/index.html","utf8");
  const stage=readFileSync("site/hullet-lab/model-frontpage/stage.js","utf8");
  const app=readFileSync("site/hullet-lab/model-frontpage/app.js","utf8");
  const css=readFileSync("site/hullet-lab/model-frontpage/style.css","utf8");
  assert.match(html,/<option value="jesus" selected>/);
  for(const mode of ["aurora","cosmos","gallery","void"])
    assert.match(html,new RegExp('<option value="'+mode+'">'));
  for(const control of ["previous","next","environment-select","switch-status"])
    assert.match(html,new RegExp('id="'+control+'"'));
  assert.match(app,/installGeometricBackdrop\(/);
  assert.match(app,/setStage\(key\)/);
  assert.match(app,/setMode\("three"\)/);
  assert.match(stage,/updateStage\(/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/\.env-light-a/);
  assert.match(css,/\.env-orbit/);
  assert.equal((html.match(/<canvas /g)||[]).length,2);
});
