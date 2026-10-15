import {installLocalLibrary} from "./local-library.js";
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {setupStage,updateStage,setEnvironment} from "./stage.js";

// Real, bundled glTF assets. The Sketchfab entry is the creator's own
// embedded viewer, not a rehosted proprietary model or invented replacement.
const SKETCHFAB_THUNDERFURY="d4033484327540f298185d4fe87c78bb";
const SKETCHFAB_SOVIETNA="601c179398d5467383827647b3eb70c4";
const sketchfabEmbed=id=>"https://sketchfab.com/models/"+id+"/embed?autostart=1&autospin="+(rotation?"0.25":"0");
export const models={
  jesus:{name:"Jesus · Hullet Original",category:"ORIGINAL PARTICLE SCULPTURE",
    description:"The original luminous Jesus particle figure from Hullet. A real point cloud, not a fake glTF sword.",kind:"jesus"},
  sovietna:{name:"Sovietna vs Leiching · Ragnarok",category:"SKETCHFAB / CREATOR VIEWER",
    description:"Your exact Ragnarok model, streamed from its Sketchfab page. The 25 MB local upload limit does not apply.",
    kind:"sketchfab",sketchfabId:SKETCHFAB_SOVIETNA,sourceUrl:"https://sketchfab.com/3d-models/sovietna-vs-leiching-ragnarok-will-started-601c179398d5467383827647b3eb70c4"},
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
    description:"The exact creator-uploaded Thunderfury from your link, in its native Sketchfab viewer. A fan recreation, not a verified original Blizzard game mesh.",
    kind:"sketchfab",sketchfabId:SKETCHFAB_THUNDERFURY,sourceUrl:"https://sketchfab.com/3d-models/thunderfury-blessed-blade-of-the-windseeker-d4033484327540f298185d4fe87c78bb"}
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
let sceneLights=[],environmentGeometry=null;

function status(value){$("render-status").textContent=value;}
function loaderShow(message){
  const initial=!(window.__HULLET_JESUS_READY||window.__HULLET_MODELFRONT_READY||window.__HULLET_THUNDERFURY_READY);
  $("loading").hidden=!initial;
  $("switch-status").hidden=initial;
  $("switch-message").textContent=message;
  $("loading-label").textContent=message;
  $("loading-progress").style.width="0%";
}
function loaderHide(){
  clearTimeout(loadTimer);loadTimer=0;
  $("loading").hidden=true;
  $("switch-status").hidden=true;
}
function error(message){
  loaderHide();$("error").hidden=false;$("error-message").textContent=message;
  status("MODEL UNAVAILABLE");console.warn("HULLET_MODEL_VIEWER",message);
}
function setUI(key){
  const data=models[key];
  $("model-select").value=key;
  const index=$("model-select").selectedIndex+1;
  $("model-index").textContent=String(index).padStart(3,"0")+" / "+String($("model-select").options.length).padStart(3,"0");
  $("model-title").textContent=data.name;
  $("model-category").textContent=data.category;
  $("model-description").textContent=data.description;
  const creatorViewer=data.kind==="sketchfab";
  $("thunderfury-note").hidden=!creatorViewer;
  $("sketchfab-links").hidden=!creatorViewer;
  if(creatorViewer){
    frame.title=data.name+" interaktiv 3D-model på Sketchfab";
    $("sketchfab-original-link").href=data.sourceUrl;
    $("sketchfab-note-title").textContent=key==="thunderfury"?"Thunderfury by johnskyrim":"Sovietna vs Leiching · Ragnarok";
    $("sketchfab-note-body").textContent=key==="thunderfury"?
      "Fan recreation shown through its creator-hosted viewer, not a verified Blizzard original.":
      "Creator-hosted 3D viewer. The 25 MB local upload limit does not apply.";
  }
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
      jesus.load(new URL("../../jesus-figure.png",import.meta.url).href),
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

/* The stage's decorative geometry shares the model renderer. No second GPU
   context, bloom pipeline, HDR fetch, or large texture is created. */
function installGeometricBackdrop(){
  const group=new THREE.Group();
  const count=mobile.matches?210:610;
  const coords=new Float32Array(count*3);
  let seed=31577;
  const rand=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};
  for(let i=0;i<count;i++){
    const angle=rand()*Math.PI*2;
    const height=(rand()-.5)*11;
    const radius=4.8+rand()*4.2;
    coords[3*i]=Math.cos(angle)*radius;
    coords[3*i+1]=height;
    coords[3*i+2]=Math.sin(angle)*radius-2;
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.BufferAttribute(coords,3));
  const dust=new THREE.Points(geometry,new THREE.PointsMaterial({
    color:0xb1d7e7,size:mobile.matches?.018:.025,
    transparent:true,opacity:.44,sizeAttenuation:true,depthWrite:false
  }));
  group.add(dust);
  for(const [i,radius] of [2.9,3.32,3.75].entries()){
    const geometry=new THREE.TorusGeometry(radius,.005,3,164);
    const material=new THREE.MeshBasicMaterial({
      color:[0x93d4e0,0xd6b6ae,0x9e98e3][i],
      transparent:true,opacity:.14-i*.025,depthWrite:false
    });
    const ring=new THREE.Mesh(geometry,material);
    ring.rotation.set(.5+i*.27,.28+i*.15,i*.69);
    group.add(ring);
  }
  scene.add(group);
  return group;
}
function setStage(key){
  const theme=updateStage(key);
  if(sceneLights.length){
    sceneLights[0].color.setHSL(theme.primary/360,.62,.72);
    sceneLights[1].color.setHSL(theme.secondary/360,.64,.73);
    sceneLights[2].color.setHSL(theme.accent/360,.58,.67);
  }
  if(environmentGeometry){
    const materials=environmentGeometry.children.map(child=>child.material);
    if(materials[0])materials[0].color.setHSL(theme.primary/360,.55,.72);
    for(let i=1;i<materials.length;i++)
      materials[i].color.setHSL([theme.primary,theme.secondary,theme.accent][(i-1)%3]/360,.66,.68);
  }
}
function updateEnvironment(){
  if(!environmentGeometry)return;
  environmentGeometry.visible=document.documentElement.dataset.environment==="cosmos";
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
  sceneLights=[a,b,c];
  environmentGeometry=installGeometricBackdrop();
  setStage(active);
  updateEnvironment();
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
  frame.src="about:blank";
  setMode("three");
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
  setStage(key);
  if(key==="jesus"){
    disposeModel();
    window.__HULLET_ACTIVE_MODEL="jesus";
    frame.src="about:blank";
    setMode("jesus");
    loaderHide();
    ensureJesus();
    if(jesusReady)status("ORIGINAL JESUS / PARTICLES READY");
    return;
  }
  if(data.kind==="sketchfab"){
    disposeModel();
    window.__HULLET_ACTIVE_MODEL=key;
    loaderHide();
    setMode("sketchfab");
    frame.src=sketchfabEmbed(data.sketchfabId);
    status("SKETCHFAB / CREATOR VIEWER");
    window.__HULLET_THUNDERFURY_READY=true;
    return;
  }
  // Keep the previously rendered object visible until the new GLB has decoded.
  loaderShow("DECODING "+data.name.toUpperCase());
  status("LOADING GLTF / "+data.name.toUpperCase());
  try{initializeThree();}
  catch(e){error("Three.js renderer could not initialize: "+e.message);return;}
  loadTimer=setTimeout(()=>{if(attempt===loadNumber)error("This 3D model took longer than 20 seconds to load.");},20000);
  loader.load(new URL(data.url,import.meta.url).href,gltf=>{
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
  }else if(models[active]?.kind!=="sketchfab"&&renderer){
    if(mixer)mixer.update(dt);
    controls.update();
    if(environmentGeometry && environmentGeometry.visible && !reduced.matches)
      environmentGeometry.rotation.y+=dt*.004;
    renderer.render(scene,camera);
  }
}
function bind(){
  $("model-select").addEventListener("change",e=>choose(e.target.value));
  $("environment-select").addEventListener("change",updateEnvironment);

  function adjacent(direction){
    const allKeys=Array.from($("model-select").options,option=>option.value);
    if(active==="custom")return choose("jesus");
    const index=allKeys.indexOf(active);
    choose(allKeys[(index+direction+allKeys.length)%allKeys.length]);
  }
  $("previous").addEventListener("click",()=>adjacent(-1));
  $("next").addEventListener("click",()=>adjacent(1));
  document.addEventListener("keydown",event=>{
    const target=event.target;
    if(event.altKey||event.metaKey||event.ctrlKey||event.shiftKey||
       /^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(target?.tagName||"") ||
       target?.isContentEditable)return;
    if(event.key==="ArrowRight"){event.preventDefault();adjacent(1);}
    else if(event.key==="ArrowLeft"){event.preventDefault();adjacent(-1);}
  });
  $("rotation-toggle").addEventListener("click",()=>{
    rotation=!rotation;
    if(controls)controls.autoRotate=rotation&&!reduced.matches;
    if(models[active]?.kind==="sketchfab")frame.src=sketchfabEmbed(models[active].sketchfabId);
    $("rotation-toggle").textContent=rotation?"Ⅱ AUTO ROTATE":"▶ AUTO ROTATE";
    $("rotation-toggle").setAttribute("aria-pressed",String(rotation));
  });
  $("reset").addEventListener("click",()=>{
    if(active==="jesus"){jsYaw=0;jsPitch=-.08;jsScale=1.03;renderJesus();}
    else if(models[active]?.kind==="sketchfab")frame.src=sketchfabEmbed(models[active].sketchfabId);
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
  installLocalLibrary({models,choose,status});
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
  frame.addEventListener("load",()=>{if(models[active]?.kind==="sketchfab")status("SKETCHFAB / DOCUMENT LOADED");});
  window.__HULLET_STAGE_INSPECT=()=>({
    model:active,
    environment:document.documentElement.dataset.environment,
    hue:document.documentElement.style.getPropertyValue("--stage-hue"),
    has3DBackdrop:Boolean(environmentGeometry),
    backgroundMode:document.documentElement.dataset.artwork
  });
}
setupStage();
bind();
// A dedicated entrypoint can request an existing archive model without
// changing the default model of the original /models page.
const requestedModel=document.body.dataset.initialModel;
const initialModel=requestedModel&&Object.hasOwn(models,requestedModel)?requestedModel:"jesus";
choose(initialModel);
raf=requestAnimationFrame(animate);
