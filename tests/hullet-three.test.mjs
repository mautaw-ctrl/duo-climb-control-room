import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {execFileSync} from "node:child_process";

const root="site/hullet-lab/";
const page=readFileSync(root+"instancing/index.html","utf8");
const head=readFileSync(root+"head/index.html","utf8");
const engine=readFileSync(root+"instancing/engine.js","utf8");
const app=readFileSync(root+"instancing/app.js","utf8");
const scanner=readFileSync(root+"head/head.js","utf8");
const portrait=readFileSync(root+"head/portrait.js","utf8");
const css=readFileSync(root+"instancing/style.css","utf8");
const moduleUrl="data:text/javascript;charset=utf-8,"+encodeURIComponent(portrait);
const {sculptPortrait,serializePLY,serializeOBJ}=await import(moduleUrl);

test("The Three.js prototypes are isolated from the original Jesus home page",()=>{
  const original=readFileSync("site/index.html","utf8");
  assert.doesNotMatch(original,/instancing\/engine|head\/head\.js/);
  assert.match(original,/<title>hullet<\/title>/);
  assert.match(page,/vendor\/three\.module\.js/);
  assert.match(head,/vendor\/three\.module\.js/);
  assert.match(page,/\/instancing|\.\/app\.js/);
  assert.match(head,/\.\/head\.js/);
  assert.match(page,/\bviewport\b/);
  assert.match(head,/\bviewport\b/);
});
test("10K faceted geometries are rendered with one InstancedMesh rather than 10K Mesh objects",()=>{
  assert.match(engine,/new THREE\.InstancedMesh\(/);
  assert.match(engine,/MAX_INSTANCES = 12000/);
  assert.match(engine,/new THREE\.IcosahedronGeometry\(1,0\)/);
  assert.match(engine,/setMatrixAt\(/);
  assert.match(engine,/setColorAt\(/);
  assert.match(engine,/THREE\.DynamicDrawUsage/);
  assert.match(engine,/this\.mesh\.count=this\.count/);
  assert.match(engine,/GOLDEN_ANGLE = Math\.PI \* 2/);
});
test("3D demo uses responsive layout and GSAP with safe native scroll fallback",()=>{
  assert.match(page,/ScrollTrigger\.min\.js/);
  assert.match(app,/gsap\.registerPlugin\(ScrollTrigger\)/);
  assert.match(app,/addEventListener\("scroll",scrollUpdate/);
  assert.match(css,/@media\(max-width:560px\)/);
  assert.match(css,/@media\(max-width:850px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(engine,/targetFPS=this\.mobile\?24:30/);
  assert.match(engine,/document\.hidden/);
  assert.match(engine,/this\.observer\?\.disconnect\(\)/);
});
test("Head scanner offers private upload, permission-based webcam and model exports",()=>{
  assert.match(head,/type="file" accept="image\/\*"/);
  assert.match(head,/id="camera-start"/);
  assert.match(head,/id="export-ply"/);
  assert.match(head,/id="export-obj"/);
  assert.match(head,/2,5D-model/);
  assert.match(scanner,/navigator\.mediaDevices\.getUserMedia/);
  assert.match(scanner,/sculptPortrait\(/);
  assert.match(scanner,/serializePLY\(/);
  assert.match(scanner,/serializeOBJ\(/);
  assert.match(scanner,/URL\.createObjectURL\(blob\)/);
  assert.doesNotMatch(scanner,/fetch\(|XMLHttpRequest\(|FormData\(/);
});
test("Portrait relief is real mesh geometry with faces, front, back and RGB",()=>{
  const w=80,h=100,data=new Uint8ClampedArray(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4;
    data[i]=Math.round(255*x/w);
    data[i+1]=Math.round(255*y/h);
    data[i+2]=180;data[i+3]=255;
  }
  const model=sculptPortrait(data,w,h,{count:1400,maskWidth:.8,depth:.6});
  assert.equal(model.points.length,1400*3);
  assert.equal(model.colors.length,1400*3);
  assert.ok(model.vertices.length>1500);
  assert.ok(model.faces.length>1500);
  assert.ok(model.triangleCount===model.faces.length);
  assert.ok(model.points.some(v=>v>.1));
  assert.ok(model.points.some(v=>v<-.1));
  for(const face of model.faces){
    assert.ok(face.every(n=>Number.isInteger(n)&&n>=0&&n<model.vertices.length));
  }
  const ply=serializePLY(model);
  assert.match(ply,/^ply\nformat ascii 1\.0/);
  assert.ok(ply.includes("element vertex "+model.vertices.length));
  assert.ok(ply.includes("element face "+model.faces.length));
  assert.match(ply,/property uchar red/);
  const obj=serializeOBJ(model);
  assert.match(obj,/\no portrait_relief\n/);
  assert.match(obj,/\nv [-\d.]+ [-\d.]+ [-\d.]+/);
  assert.match(obj,/\nf \d+ \d+ \d+/);
});
test("The portrait algorithm declines invalid input and respects geometry limits",()=>{
  assert.throws(()=>sculptPortrait(new Uint8Array(10),2,2),/få pixels/);
  const w=24,h=24,p=new Uint8ClampedArray(w*h*4);
  for(let i=0;i<p.length;i+=4){p[i]=130;p[i+1]=140;p[i+2]=180;p[i+3]=255;}
  const model=sculptPortrait(p,w,h,{count:20000,depth:40,maskWidth:.7});
  assert.equal(model.points.length,12000*3);
  assert.ok(model.vertices.length>0);
});
test("Every new module parses before deployment",()=>{
  for(const path of ["instancing/engine.js","instancing/app.js","head/portrait.js","head/head.js"]){
    assert.doesNotThrow(()=>execFileSync(process.execPath,["--check",root+path],
      {stdio:"pipe",timeout:10000}),path);
  }
});

test("3D pages load Three.js locally instead of depending on third-party CDNs",()=>{
  assert.match(page,/importmap/);
  assert.match(head,/importmap/);
  assert.match(page,/\.\.\/vendor\/three\.module\.js/);
  assert.match(head,/\.\.\/vendor\/OrbitControls\.js/);
  assert.doesNotMatch(page,/cdn\.jsdelivr\.net\/npm\/three@/);
  assert.doesNotMatch(head,/cdn\.jsdelivr\.net\/npm\/three@/);
  assert.match(page,/boot\.js\?v=2/);
  assert.match(head,/boot\.js\?v=2/);
  assert.match(app,/HulletBoot\?\.ready/);
  assert.match(scanner,/HulletBoot\?\.ready/);
});

test("Missing modules cause a visible failure instead of an infinite spinner",()=>{
  const boot=readFileSync(root+"instancing/boot.js","utf8");
  assert.match(boot,/16000/);
  assert.match(boot,/loading\?\.classList\.add\("finished"\)/);
  assert.match(boot,/card\.hidden=false/);
  assert.match(boot,/unhandledrejection/);
  assert.match(boot,/window\.HulletBoot/);
});

test("Pinned Three.js modules and OrbitControls are now shipped inside the website",()=>{
  const base=root+"vendor/";
  const module=readFileSync(base+"three.module.js","utf8");
  const core=readFileSync(base+"three.core.js","utf8");
  const orbit=readFileSync(base+"OrbitControls.js","utf8");
  assert.ok(module.length>200000);
  assert.ok(core.length>700000);
  assert.ok(orbit.length>10000);
  assert.match(module,/\.\/three\.core\.js/);
  assert.match(orbit,/from 'three'/);
  assert.match(readFileSync(base+"LICENSE-three.txt","utf8"),/MIT/);
});
