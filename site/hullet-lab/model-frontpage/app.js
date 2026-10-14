import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";

// Real, bundled glTF assets. The Sketchfab entry is the creator's own
// embedded viewer, not a rehosted proprietary model or invented replacement.
const SKETCHFAB_ID="d4033484327540f298185d4fe87c78bb";
const SKETCHFAB_URL="https://sketchfab.com/models/"+SKETCHFAB_ID+"/embed?autostart=1&autospin=0.25";
export const models={
  jesus:{name:"Jesus · Hullet Original",category:"ORIGINAL PARTICLE SCULPTURE",
    description:"The original luminous Jesus particle figure from Hullet. A real point cloud, not a fake glTF sword.",kind:"jesus"},
  fox:{name:"Animated Fox",category:"ANIMATED CREATURE / LOCAL GLTF",
    description:"A rigged animal with a real looping animation. PixelMannen, tomkranis and AsoboStudio.",url:"./models/Fox.glb"},
  cesiumman:{name:"Cesium Man",category:"ANIMATED CHARACTER / LOCAL GLTF",
    description:"A moving rigged character from the Cesium sample collection.",url:"./models/CesiumMan.glb"},
  milkTruck:{name:"Cesium Milk Truck",category:"VEHICLE / LOCAL GLTF",
    description:"A miniature delivery truck with detailed modeled geometry.",url:"./models/CesiumMilkTruck.glb"},
  toyCar:{name:"Toy Car",category:"VEHICLE / LOCAL GLTF",
    description:"A miniature toy car, physically based materials. Guido Odendahl and Eric Chadwick.",url:"./models/ToyCar.glb"},
  sunglasses:{name:"Sunglasses Khronos",category:"IRIDESCENT OBJECT / LOCAL GLTF",
    description:"An authentic glTF sample with striking iridescent lenses.",url:"../artefact/SunglassesKhronos.glb"},
  boomBox:{name:"Retro BoomBox",category:"RETRO AUDIO / LOCAL GLTF",
    description:"A fully modeled vintage boombox. CC0 sample by Microsoft.",url:"./models/BoomBox.glb"},
  sheenChair:{name:"Sheen Chair",category:"DESIGN OBJECT / LOCAL GLTF",
    description:"A chair with physically based sheen material, by Eric Chadwick.",url:"./models/SheenChair.glb"},
  irisLamp:{name:"Iridescence Lamp",category:"LIGHT / LOCAL GLTF",
    description:"A shifting iridescent decorative lamp from Wayfair's glTF examples.",url:"./models/IridescenceLamp.glb"},
  lantern:{name:"Lantern",category:"LIGHT / LOCAL GLTF",
    description:"A vintage lantern featuring detailed textures. CC0 sample.",url:"./models/Lantern.glb"},
  animatedBox:{name:"Animated Cube",category:"ABSTRACT / LOCAL GLTF",
    description:"A minimal animated geometry study from Cesium.",url:"./models/BoxAnimated.glb"},

  riggedFigure:{name:"Animated Figure",category:"CHARACTER / LICENSED GLTF",
    description:"An animated, rigged sample figure by Cesium. Fully self-hosted.",url:"./models/RiggedFigure.glb"},
  scatteringSkull:{name:"Crystal Skull",category:"ANATOMY / CC0",
    description:"A detailed skull with translucent-material extensions. Vladimir Petkovic, public domain.",url:"./models/ScatteringSkull.glb"},
  materialsShoe:{name:"Designer Sneaker",category:"FASHION / CC BY 4.0",
    description:"Shopify's sneaker asset with multiple material variants. Original materials render by default.",url:"./models/MaterialsVariantsShoe.glb"},
  waterBottle:{name:"PBR Water Bottle",category:"OBJECT / CC0",
    description:"Microsoft's textured water bottle demonstrating physically-based rendering.",url:"./models/WaterBottle.glb"},
  glamSofa:{name:"Velvet Sofa",category:"FURNITURE / CC BY 4.0",
    description:"Wayfair's velvet sofa with sheen materials, modeled by Eric Chadwick.",url:"./models/GlamVelvetSofa.glb"},
  barnLamp:{name:"Industrial Barn Lamp",category:"LIGHTING / CC BY 4.0",
    description:"Industrial lamp showing anisotropic highlights and complex materials. Wayfair and Eric Chadwick.",url:"./models/AnisotropyBarnLamp.glb"},
  avocado:{name:"Half an Avocado",category:"FOOD / CC0",
    description:"A properly textured cut avocado by Microsoft. Yes, this is apparently what 3D technology was meant for.",url:"./models/Avocado.glb"},
  teaCup:{name:"Translucent Teacup",category:"CERAMICS / CC0",
    description:"Polyhaven and Eric Chadwick's teacup illustrating translucent ceramic shading.",url:"./models/DiffuseTransmissionTeacup.glb"},
  abalone:{name:"Iridescent Abalone Shell",category:"NATURE / CC BY 4.0",
    description:"Abby Crawford's shell with iridescent materials adapted by Eric Chadwick.",url:"./models/IridescenceAbalone.glb"},
  oliveDish:{name:"Glowing Dish of Olives",category:"ODDITIES / CC BY 4.0",
    description:"Wayfair's transparent material study: iridescent glass and olives, naturally.",url:"./models/IridescentDishWithOlives.glb"},
  irisSuzanne:{name:"Iridescent Monkey",category:"MATERIAL EXPERIMENT / CC0",
    description:"Blender's iconic Suzanne monkey in reflective iridescent materials. UX3D sample.",url:"./models/IridescenceSuzanne.glb"},
  clearCoat:{name:"Lacquered Paint Sphere",category:"ABSTRACT / CC0",
    description:"Clear-coat and metallic paint material demonstration by Eric Chadwick.",url:"./models/ClearCoatCarPaint.glb"},
  thunderfury:{name:"Thunderfury, Blessed Blade of the Windseeker",category:"SKETCHFAB / JOHNSKYRIM",
    description:"The exact creator-uploaded Thunderfury from your link, in its native Sketchfab viewer. A fan recreation, not a verified original Blizzard game mesh.",kind:"sketchfab"}
};
const $=id=>document.getElementById(id);
const canvas=$("background"),jesusCanvas=$("jesus-background"),frame=$("sketchfab-frame");
const reduced=matchMedia("(prefers-reduced-motion: reduce)"),mobile=matchMedia("(max-width: 760px)");
const loader=new GLTFLoader();
const clamp=(value,a,b)=>Math.min(b,Math.max(a,value));
let renderer,scene,camera,controls,root,model=null,mixer=null;
let jesus,jesusGL,jesusReady=false,jesusError=false,jesusTime=0;
let jsYaw=0,jsPitch=-.08,jsScale=1.03,jsDrag=null;
let rotation=true,active="jesus",loadNumber=0,raf=0,last=0,lastAnimation=0;
let loadTimer=0,disposed=false,threeReady=false,started=false;

function status(value){$("render-status").textContent=value;}
function loaderShow(message){$("loading").hidden=false;$("loading-label").textContent=message;$("loading-progress").style.width="0%";}
function loaderHide(){clearTimeout(loadTimer);loadTimer=0;$("loading").hidden=true;}
function error(message){
  loaderHide();$("error").hidden=false;$("error-message").textContent=message;
  status("MODEL UNAVAILABLE");console.warn("HULLET_MODEL_VIEWER",message);
}
function setUI(key){
  const data=models[key];
  $("model-select").value=key;
  const index=$("model-select").selectedIndex+1;
  $("model-index").textContent=String(index).padStart(3,"0")+" / 024";
  $("model-title").textContent=data.name;
  $("model-category").textContent=data.category;
  $("model-description").textContent=data.description;
  $("thunderfury-note").hidden=key!=="thunderfury";
  $("sketchfab-links").hidden=key!=="thunderfury";
  $("rotation-toggle").disabled=false;
}
function setMode(name){
  jesusCanvas.hidden=name!=="jesus";
  canvas.hidden=name!=="three";
  frame.parentElement.hidden=name!=="sketchfab";
  $("jesus-fallback").hidden=name!=="jesus";
}
function figureResize(){
  if(!jesusGL||disposed)return;
  const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight);
  const pixels=mobile.matches?840000:1350000;
  const dpr=clamp(Math.min(devicePixelRatio||1,mobile.matches?1:1.28,Math.sqrt(pixels/(w*h))),.7,1.28);
  jesusCanvas.width=Math.round(w*dpr);
  jesusCanvas.height=Math.round(h*dpr);
}
function renderJesus(){
  if(!jesusReady||!jesusGL||jesusGL.isContextLost()||active!=="jesus")return;
  const gl=jesusGL;
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  gl.viewport(0,0,jesusCanvas.width,jesusCanvas.height);
  gl.colorMask(true,true,true,true);
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
  jesus.draw({
    width:jesusCanvas.width,height:jesusCanvas.height,
    dpr:jesusCanvas.width/Math.max(1,innerWidth),
    time:reduced.matches?0:jesusTime,reveal:1,light:.98,storm:.16,
    parting:.54,scene:.15,
    centerX:mobile.matches?.5:.54,centerY:mobile.matches?.41:.49,
    pointer:[0,0],rotation:[jsPitch,jsYaw,0],
    figureScale:jsScale*(mobile.matches?1.28:1.17),
    flight:[0,0,0],entry:1,entryProgress:1,scrollVelocity:0,
    reducedMotion:reduced.matches
  });
}
async function ensureJesus(){
  if(jesusReady||jesusError)return;
  try{
    if(!window.JesusFigure)throw Error("The original Jesus particle engine is missing.");
    jesusGL=jesusCanvas.getContext("webgl",{
      alpha:true,antialias:false,depth:false,stencil:false,
      premultipliedAlpha:false,powerPreference:"low-power"
    });
    if(!jesusGL)throw Error("WebGL is unavailable.");
    jesus=new window.JesusFigure(jesusGL);
    figureResize();
    await Promise.race([
      jesus.load("../../jesus-figure.png"),
      new Promise((_,reject)=>setTimeout(()=>reject(Error("Image loading timed out.")),15000))
    ]);
    jesusReady=true;
    $("jesus-fallback").classList.add("faded");
    window.__HULLET_JESUS_READY=true;
    status("ORIGINAL JESUS / PARTICLES READY");
    renderJesus();
  }catch(e){
    jesusError=true;
    $("jesus-fallback").classList.remove("faded");
    status("JESUS IMAGE FALLBACK");
    console.warn("Original Jesus figure could not render, image remains visible",e);
  }
}
function threeResize(){
  if(!renderer||disposed)return;
  const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight);
  const cap=Math.sqrt((mobile.matches?850000:1450000)/(w*h));
  renderer.setPixelRatio(clamp(Math.min(devicePixelRatio||1,mobile.matches?1:1.4,cap),.65,1.4));
  renderer.setSize(w,h,false);
  camera.aspect=w/h;camera.updateProjectionMatrix();
  if(active!=="jesus"&&active!=="thunderfury")renderer.render(scene,camera);
}
function initializeThree(){
  if(threeReady)return;
  renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,stencil:false,powerPreference:"high-performance"});
  renderer.setClearColor(0x09131f,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.45;
  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(mobile.matches?42:39,1,.1,80);
  camera.position.set(0,.2,mobile.matches?8.1:7);
  root=new THREE.Group();scene.add(root);
  scene.add(new THREE.HemisphereLight(0xc5e8ff,0x201f3a,2.7));
  const a=new THREE.DirectionalLight(0xfce4c6,4.5);a.position.set(-4,6,7);scene.add(a);
  const b=new THREE.PointLight(0x93ddff,62,28);b.position.set(5,0,5);scene.add(b);
  const c=new THREE.PointLight(0xf7b2de,40,23);c.position.set(-4,-3,-1);scene.add(c);
  controls=new OrbitControls(camera,canvas);
  controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.065;
  controls.minDistance=3;controls.maxDistance=13;
  controls.autoRotate=rotation&&!reduced.matches;controls.autoRotateSpeed=.31;
  controls.target.set(0,0,0);controls.update();
  threeReady=true;
  threeResize();
}
function disposeModel(){
  if(!model||!root)return;
  root.remove(model);
  model.traverse(obj=>{
    if(!obj.isMesh)return;
    obj.geometry?.dispose();
    const materials=Array.isArray(obj.material)?obj.material:[obj.material];
    for(const material of materials){
      if(!material)continue;
      for(const name of ["map","normalMap","metalnessMap","roughnessMap","aoMap","emissiveMap"])
        material[name]?.dispose?.();
      material.dispose();
    }
  });
  model=null;mixer=null;
}
function display(gltf,name){
  if(!gltf?.scene)throw Error("No glTF scene in file");
  disposeModel();
  model=gltf.scene;
  const box=new THREE.Box3().setFromObject(model),size=new THREE.Vector3(),center=new THREE.Vector3();
  box.getSize(size);box.getCenter(center);
  const longest=Math.max(size.x,size.y,size.z);
  if(!Number.isFinite(longest)||longest<.000001)throw Error("No visible geometry in model.");
  const scale=3.5/longest;
  model.scale.multiplyScalar(scale);
  model.position.sub(center.multiplyScalar(scale));
  root.add(model);
  mixer=gltf.animations?.length?new THREE.AnimationMixer(model):null;
  if(mixer)mixer.clipAction(gltf.animations[0]).play();
  let meshes=0;
  model.traverse(obj=>{if(obj.isMesh)meshes++;});
  status(meshes+" MESHES / GLTF READY");
  window.__HULLET_ACTIVE_MODEL=active;
  controls.reset();renderer.render(scene,camera);
  window.__HULLET_MODELFRONT_READY=true;
}
function choose(key){
  const data=models[key];if(!data)return;
  const attempt=++loadNumber;
  clearTimeout(loadTimer);loadTimer=0;
  $("error").hidden=true;
  setUI(key);active=key;
  if(key==="jesus"){
    window.__HULLET_ACTIVE_MODEL="jesus";
    frame.src="about:blank";
    setMode("jesus");
    loaderHide();
    ensureJesus();
    if(jesusReady)status("ORIGINAL JESUS / PARTICLES READY");
    return;
  }
  if(data.kind==="sketchfab"){
    window.__HULLET_ACTIVE_MODEL="thunderfury";
    loaderHide();
    setMode("sketchfab");
    frame.src=SKETCHFAB_URL;
    status("SKETCHFAB / ORIGINAL CREATOR VIEWER");
    window.__HULLET_THUNDERFURY_READY=true;
    return;
  }
  frame.src="about:blank";
  setMode("three");
  loaderShow("DECODING "+data.name.toUpperCase());
  status("LOADING GLTF / "+data.name.toUpperCase());
  try{initializeThree();}
  catch(e){error("Three.js renderer could not initialize: "+e.message);return;}
  loadTimer=setTimeout(()=>{if(attempt===loadNumber)error("This 3D model took longer than 20 seconds to load.");},20000);
  loader.load(data.url,gltf=>{
    if(attempt!==loadNumber)return;
    try{display(gltf,data.name);loaderHide();}
    catch(e){error("Could not render "+data.name+": "+e.message);}
  },event=>{
    if(attempt!==loadNumber)return;
    if(event.lengthComputable&&event.total)
      $("loading-progress").style.width=Math.round(event.loaded/event.total*100)+"%";
  },err=>{
    if(attempt===loadNumber)error("Could not load "+data.name+": "+(err.message||"Network error"));
  });
}
function openLocal(file){
  if(!file)return;
  if(!/\.glb$/i.test(file.name)||file.size>25*1048576){
    error("Choose a .glb model under 25 MB.");return;
  }
  const url=URL.createObjectURL(file),attempt=++loadNumber;
  active="custom";
  $("model-index").textContent="CUSTOM / 024";
  $("model-title").textContent=file.name;
  $("model-category").textContent="LOCAL / YOUR OWN GLTF";
  $("model-description").textContent="A 3D model opened entirely in this browser. Your file is not uploaded.";
  $("thunderfury-note").hidden=true;$("sketchfab-links").hidden=true;
  frame.src="about:blank";setMode("three");loaderShow("IMPORTING LOCAL MODEL...");
  try{initializeThree();}
  catch(e){URL.revokeObjectURL(url);error(e.message);return;}
  loadTimer=setTimeout(()=>{if(attempt===loadNumber)error("Model import timed out.");},20000);
  loader.load(url,gltf=>{
    URL.revokeObjectURL(url);
    if(attempt!==loadNumber)return;
    try{display(gltf,file.name);loaderHide();}catch(e){error(e.message);}
  },undefined,err=>{
    URL.revokeObjectURL(url);
    if(attempt===loadNumber)error(err.message||"Couldn't decode this glTF file.");
  });
}
function animate(now){
  raf=requestAnimationFrame(animate);
  if(disposed||document.hidden)return;
  const interval=mobile.matches?42:33;
  if(last&&now-last<interval)return;
  const dt=last?Math.min(.08,(now-last)/1000):.033;
  last=now;
  if(active==="jesus"){
    if(rotation&&!reduced.matches){jsYaw+=dt*.16;jesusTime+=dt;}
    renderJesus();
  }else if(active!=="thunderfury"&&renderer){
    if(mixer)mixer.update(dt);
    controls.update();
    renderer.render(scene,camera);
  }
}
function bind(){
  $("model-select").addEventListener("change",e=>choose(e.target.value));
  $("rotation-toggle").addEventListener("click",()=>{
    rotation=!rotation;
    if(controls)controls.autoRotate=rotation&&!reduced.matches;
    $("rotation-toggle").textContent=rotation?"Ⅱ AUTO ROTATE":"▶ AUTO ROTATE";
    $("rotation-toggle").setAttribute("aria-pressed",String(rotation));
  });
  $("reset").addEventListener("click",()=>{
    if(active==="jesus"){jsYaw=0;jsPitch=-.08;jsScale=1.03;renderJesus();}
    else controls?.reset();
  });
  $("random").addEventListener("click",()=>{
    // Only choose bundled models or the existing Jesus sculpture.
    // Thunderfury opens a separately hosted Sketchfab iframe by choice.
    const available=Object.keys(models).filter(key=>key!=="thunderfury" && key!==active);
    const index=Math.floor(Math.random()*available.length);
    choose(available[index]);
  });
  $("import-trigger").addEventListener("click",()=>$("model-file").click());
  $("model-file").addEventListener("change",e=>openLocal(e.target.files?.[0]));
  $("reload").addEventListener("click",()=>location.reload());
  jesusCanvas.addEventListener("pointerdown",e=>{
    jsDrag={x:e.clientX,y:e.clientY};
    jesusCanvas.setPointerCapture?.(e.pointerId);
  });
  jesusCanvas.addEventListener("pointermove",e=>{
    if(!jsDrag)return;
    jsYaw+=(e.clientX-jsDrag.x)*.0075;
    jsPitch=clamp(jsPitch+(e.clientY-jsDrag.y)*.005,-.72,.72);
    jsDrag={x:e.clientX,y:e.clientY};
    renderJesus();
  });
  jesusCanvas.addEventListener("pointerup",()=>{jsDrag=null;});
  jesusCanvas.addEventListener("pointercancel",()=>{jsDrag=null;});
  jesusCanvas.addEventListener("wheel",e=>{
    e.preventDefault();jsScale=clamp(jsScale-e.deltaY*.0011,.45,2);
    renderJesus();
  },{passive:false});
  window.addEventListener("resize",()=>{figureResize();threeResize();renderJesus();},{passive:true});
  window.addEventListener("pagehide",()=>{
    disposed=true;cancelAnimationFrame(raf);clearTimeout(loadTimer);
    jesus?.dispose();controls?.dispose();renderer?.dispose();
    frame.src="about:blank";
  });
  reduced.addEventListener("change",()=>{if(controls)controls.autoRotate=rotation&&!reduced.matches;renderJesus();});
  frame.addEventListener("load",()=>{if(active==="thunderfury")status("SKETCHFAB / DOCUMENT LOADED");});
}
bind();
setMode("jesus");
$("model-select").value="jesus";
choose("jesus");
raf=requestAnimationFrame(animate);
