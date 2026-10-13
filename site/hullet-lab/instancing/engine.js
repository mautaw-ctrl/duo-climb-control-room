import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";

export const MAX_INSTANCES = 12000;
export const PHI = (1 + Math.sqrt(5)) / 2;
export const GOLDEN_ANGLE = Math.PI * 2 / (PHI * PHI);
const TAU = Math.PI * 2;
const clamp = (v,a,b) => Math.min(b,Math.max(a,v));
function random(seed){
  let n=seed>>>0;
  return ()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return(n>>>0)/4294967296;};
}
function normal(rng){
  return Math.sqrt(-2*Math.log(Math.max(1e-6,rng())))*Math.cos(TAU*rng());
}
function fibonacciSphere(i,count){
  const y=1-2*(i+.5)/count,rad=Math.sqrt(Math.max(0,1-y*y));
  const angle=i*GOLDEN_ANGLE;
  return [rad*Math.cos(angle),y,rad*Math.sin(angle)];
}
export function generatePreset(name,count,seed=214){
  const rng=random(seed),positions=new Float32Array(count*3),colors=new Float32Array(count*3);
  const hue=new THREE.Color();
  for(let i=0;i<count;i++){
    const index=i*3;
    let x=0,y=0,z=0,h=.6;
    if(name==="fibonacci"){
      const p=fibonacciSphere(i,count),wave=1+.12*Math.sin(i*.015);
      x=p[0]*1.93*wave;y=p[1]*1.93*wave;z=p[2]*1.93*wave;
      h=.51+.42*i/count;
    }else if(name==="vortex"){
      const t=(i+.5)/count,a=i*GOLDEN_ANGLE;
      const rad=Math.sqrt(t)*2.15*(.76+.24*Math.sin(t*18+seed));
      x=Math.cos(a)*rad;y=Math.sin(a)*rad;
      z=Math.sin(t*TAU*6)*.47+(1-t)*.45;
      h=.75+.25*Math.sin(t*17);
    }else if(name==="cathedral"){
      // A deliberately recognizable face and raised-arm robe silhouette.
      const zone=rng();
      if(zone<.31){
        const p=fibonacciSphere(i,Math.max(count,2));
        const ry=clamp(normal(rng)*.44,-1,1),ring=Math.sqrt(Math.max(.06,1-ry*ry));
        x=ring*Math.cos(p[0]*11+i*GOLDEN_ANGLE)*.72;
        y=.80+ry*.90;
        z=ring*Math.sin(p[0]*11+i*GOLDEN_ANGLE)*.53;
        if(z>.13 && y>.58 && y<1.09) z+=.23*Math.exp(-x*x*27)*Math.exp(-((y-.77)**2)*25);
        h=.09+.11*rng();
      }else if(zone<.87){
        const t=rng(),s=(rng()-.5)*2,wide=.83+Math.sin(t*Math.PI)*.3;
        x=s*wide*(.65+t*.36);
        y=.58-t*2.8;
        z=(rng()-.5)*.58+.10*Math.cos(s*Math.PI);
        h=.45+.38*rng();
      }else{
        const arm=zone<.94?-1:1,t=rng();
        x=arm*(.77+t*1.5);y=.27+Math.sin(t*Math.PI)*.3;
        z=(rng()-.5)*.25;h=.10+.14*rng();
      }
    }else{
      // Volumetric iridescent nebula. Instancing demonstrates 3D geometry,
      // not a 2D canvas pretending to have depth.
      const t=(i+.5)/count,spin=i*GOLDEN_ANGLE;
      const p=fibonacciSphere(i,count),spread=.55+1.42*Math.pow(rng(),.63);
      x=p[0]*spread+.23*normal(rng);
      y=p[1]*spread*1.08+.27*Math.sin(spin*1.4);
      z=p[2]*spread+.20*normal(rng);
      h=.52+.30*Math.sin(spin*.23);
    }
    positions[index]=x;positions[index+1]=y;positions[index+2]=z;
    hue.setHSL(((h%1)+1)%1,.72,.58);
    colors[index]=hue.r;colors[index+1]=hue.g;colors[index+2]=hue.b;
  }
  return {positions,colors};
}
export function boundsForCount(count){return Math.round(count*20*3/1024)+"K triangle faces";}

export class InstancingScene {
  constructor(canvas,{count=6500,palette="spectral",staticMode=false}={}){
    this.canvas=canvas;
    this.mobile=matchMedia("(max-width: 720px)").matches;
    this.reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.count=clamp(Math.round(count),200,MAX_INSTANCES);
    this.palette=palette;this.speed=.12;
    this.time=0;this.last=0;this.scroll=0;this.morph=1;
    this.running=false;this.frame=0;this.visible=true;this.disposed=false;
    this.renderer=new THREE.WebGLRenderer({
      canvas,alpha:true,antialias:false,depth:true,stencil:false,
      powerPreference:"high-performance",preserveDrawingBuffer:true
    });
    this.renderer.setClearColor(0x070d1a,0);
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.25;
    this.scene=new THREE.Scene();
    this.camera=new THREE.PerspectiveCamera(43,1,.1,100);
    this.camera.position.set(0,0,6.4);
    this.controls=new OrbitControls(this.camera,canvas);
    this.controls.enablePan=false;this.controls.enableDamping=true;
    this.controls.dampingFactor=.05;this.controls.minDistance=3;
    this.controls.maxDistance=12;this.controls.autoRotate=false;
    this.scene.add(new THREE.AmbientLight(0xe0eaff,1.15));
    const left=new THREE.DirectionalLight(0x68eaff,2.25);
    left.position.set(-2,4,7);this.scene.add(left);
    const right=new THREE.PointLight(0xfa55df,65,22);
    right.position.set(3,-1,4);this.scene.add(right);
    const gold=new THREE.PointLight(0xf8b767,45,18);
    gold.position.set(0,4,-2);this.scene.add(gold);
    this.cluster=new THREE.Group();this.scene.add(this.cluster);
    // 20 triangles per faceted crystal: one instanced draw call, not 10,000 meshes.
    this.geometry=new THREE.IcosahedronGeometry(1,0);
    this.material=new THREE.MeshPhongMaterial({
      color:0xffffff,flatShading:true,shininess:92,
      specular:0xa5b6ff,transparent:true,opacity:.94
    });
    this.mesh=new THREE.InstancedMesh(this.geometry,this.material,MAX_INSTANCES);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled=false;this.mesh.count=this.count;
    this.cluster.add(this.mesh);
    this.tempObject=new THREE.Object3D();
    this.tempColor=new THREE.Color();
    this.source=new Float32Array(MAX_INSTANCES*3);
    this.target=new Float32Array(MAX_INSTANCES*3);
    this.positions=new Float32Array(MAX_INSTANCES*3);
    this.rgb=new Float32Array(MAX_INSTANCES*3);
    this.sizes=new Float32Array(MAX_INSTANCES);
    this.seed=random(99542);
    for(let i=0;i<MAX_INSTANCES;i++)
      this.sizes[i]=.007+Math.pow(this.seed(),3)*.052;
    this.setPreset("nebula",true);
    this.resize();
    this.onResize=()=>this.resize();
    window.addEventListener("resize",this.onResize,{passive:true});
    this.onVisibility=()=>this.run(!document.hidden && this.visible);
    document.addEventListener("visibilitychange",this.onVisibility);
    this.observer=typeof IntersectionObserver!=="undefined"?
      new IntersectionObserver(entries=>{
        this.visible=!!entries[0]?.isIntersecting;
        this.run(!document.hidden&&this.visible);
      },{threshold:.06}):null;
    this.observer?.observe(canvas);
    if(!staticMode)this.run(!document.hidden);
    else this.render();
  }
  resize(){
    if(this.disposed)return;
    const rect=this.canvas.getBoundingClientRect();
    const w=Math.max(1,rect.width),h=Math.max(1,rect.height);
    const low=this.mobile || this.reduced;
    const pixelCap=Math.sqrt(1650000/(w*h));
    this.renderer.setPixelRatio(clamp(Math.min(devicePixelRatio||1,low?1:1.6,pixelCap),.7,1.6));
    this.renderer.setSize(w,h,false);
    this.camera.aspect=w/h;this.camera.updateProjectionMatrix();
    this.render();
  }
  recolor(mode=this.palette){
    this.palette=mode;const color=this.tempColor;
    for(let i=0;i<this.count;i++){
      const j=i*3;const base=(i*.61803398875)%1;
      if(mode==="gold")color.setHSL(.085+.035*Math.sin(i*.13),.79,.63);
      else if(mode==="ice")color.setHSL(.49+.12*base,.80,.62);
      else if(mode==="plasma")color.setHSL(.78+.20*Math.sin(i*.0037),.87,.59);
      else if(mode==="photo"){
        color.setRGB(this.rgb[j],this.rgb[j+1],this.rgb[j+2]);
        color.multiplyScalar(1.22);
      }else{
        color.setHSL((.54+.32*Math.sin(i*.0011)+.25*base)%1,.82,.62);
      }
      this.mesh.setColorAt(i,color);
    }
    if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;
    this.render();
  }
  setCount(value){
    this.count=clamp(Math.round(value),200,MAX_INSTANCES);
    this.mesh.count=this.count;
    this.rebuild(true);return this.count;
  }
  setPreset(name,instant=false){
    this.preset=name;this.photoPoints=null;
    this.rebuild(instant);
  }
  setPoints(points,{colors=null,instant=false}={}){
    // Browser-local portrait scan, never sent to a service.
    this.preset="portrait";this.photoPoints=points;
    this.photoColors=colors;
    this.rebuild(instant);
  }
  rebuild(instant=false){
    const n=this.count;
    const built=this.photoPoints?null:generatePreset(this.preset,n);
    this.source.set(this.positions);
    for(let i=0;i<n;i++){
      const j=i*3;
      if(this.photoPoints){
        const k=Math.floor(i*this.photoPoints.length/3/n)*3;
        this.target[j]=this.photoPoints[k]||0;
        this.target[j+1]=this.photoPoints[k+1]||0;
        this.target[j+2]=this.photoPoints[k+2]||0;
        if(this.photoColors){
          this.rgb[j]=this.photoColors[k]??1;
          this.rgb[j+1]=this.photoColors[k+1]??1;
          this.rgb[j+2]=this.photoColors[k+2]??1;
        }
      }else{
        this.target[j]=built.positions[j];
        this.target[j+1]=built.positions[j+1];
        this.target[j+2]=built.positions[j+2];
        this.rgb[j]=built.colors[j];
        this.rgb[j+1]=built.colors[j+1];
        this.rgb[j+2]=built.colors[j+2];
      }
    }
    this.morph=instant?1:0;
    if(instant)this.positions.set(this.target);
    this.recolor(this.palette);
    this.writeMatrices();
    this.render();
  }
  writeMatrices(){
    const o=this.tempObject;
    const n=this.count;
    for(let i=0;i<n;i++){
      const j=i*3;
      o.position.set(this.positions[j],this.positions[j+1],this.positions[j+2]);
      const size=this.sizes[i];
      o.scale.set(size,size,size);
      const a=i*GOLDEN_ANGLE;o.rotation.set(a*.12,a*.17,a*.29);
      o.updateMatrix();this.mesh.setMatrixAt(i,o.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate=true;
  }
  setScroll(value){
    this.scroll=clamp(value,0,1);if(!this.running)this.render();
  }
  tick(time){
    if(this.disposed||!this.running)return;
    this.frame=requestAnimationFrame(t=>this.tick(t));
    const targetFPS=this.mobile?24:30;
    if(this.last&&time-this.last<1000/targetFPS)return;
    const delta=this.last?Math.min(.11,(time-this.last)/1000):.033;
    this.last=time;this.time+=delta;
    if(this.morph<1){
      this.morph=Math.min(1,this.morph+delta/1.1);
      const s=this.morph*this.morph*(3-2*this.morph);
      for(let i=0;i<this.count*3;i++)this.positions[i]=this.source[i]*(1-s)+this.target[i]*s;
      this.writeMatrices();
    }
    if(!this.reduced)this.cluster.rotation.y+=delta*this.speed;
    this.cluster.rotation.x+=(this.scroll*.25-this.cluster.rotation.x)*.07;
    this.cluster.rotation.z=Math.sin(this.time*.1)*.065;
    this.camera.position.z+=(6.4-this.scroll*1.8-this.camera.position.z)*.036;
    this.camera.updateProjectionMatrix();
    this.controls.update();this.render();
  }
  run(shouldRun){
    if(this.disposed)return;
    const wanted=Boolean(shouldRun)&&!this.reduced;
    if(this.running===wanted)return;
    this.running=wanted;this.last=0;
    if(this.frame)cancelAnimationFrame(this.frame);
    this.frame=0;
    if(wanted)this.frame=requestAnimationFrame(t=>this.tick(t));
    else this.render();
  }
  render(){
    if(!this.disposed&&this.renderer && !this.renderer.getContext().isContextLost())
      this.renderer.render(this.scene,this.camera);
  }
  async snapshot(){
    this.render();
    return new Promise(resolve=>this.canvas.toBlob(resolve,"image/png"));
  }
  dispose(){
    if(this.disposed)return;
    this.run(false);this.disposed=true;
    window.removeEventListener("resize",this.onResize);
    document.removeEventListener("visibilitychange",this.onVisibility);
    this.observer?.disconnect();
    this.controls.dispose();this.geometry.dispose();this.material.dispose();
    this.renderer.dispose();
  }
}
