import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";

const $=id=>document.getElementById(id);
const ID="d4033484327540f298185d4fe87c78bb";
const sketchfabUrl="https://sketchfab.com/models/"+ID+"/embed?autostart=1&autospin=0.25";
const modelData={
  sunglasses:{name:"Sunglasses Khronos",type:"GLTF / SELF-HOSTED",description:"Iridescent glasses from the official Khronos glTF sample library.",url:"../artefact/SunglassesKhronos.glb"},
  fox:{name:"Animated Fox",type:"GLTF / SELF-HOSTED",description:"An animated fox. An actual skinned 3D model with animation, not a generated approximation.",url:"./models/Fox.glb"},
  cesiumman:{name:"Cesium Man",type:"GLTF / SELF-HOSTED",description:"A real animated character from Cesium, with geometry, textures and rigging.",url:"./models/CesiumMan.glb"},
  thunderfury:{name:"Thunderfury, Blessed Blade of the Windseeker",type:"SKETCHFAB / JOHNSKYRIM",description:"The exact Sketchfab model you linked. Shown using Sketchfab's original 3D viewer; not an unverified Blizzard game-file export.",sketchfab:true}
};
const reduced=matchMedia("(prefers-reduced-motion: reduce)");
const mobile=matchMedia("(max-width: 760px)");
const background=$("background"),frame=$("sketchfab-frame");
const loader=new GLTFLoader();
let renderer,scene,camera,controls,root,model=null,mixer=null;
let moveAllowed=true,active="sunglasses",loadNumber=0,clock=new THREE.Clock();
let animation=0,last=0,ready=false,disposed=false,loadTimer=0;
function state(text){$("render-status").textContent=text;}
function showLoader(text){const el=$("loading");el.hidden=false;$("loading-label").textContent=text;$("loading-progress").style.width="0%";}
function hideLoader(){clearTimeout(loadTimer);$("loading").hidden=true;}
function fail(reason){hideLoader();$("error").hidden=false;$("error-message").textContent=reason;state("MODEL UNAVAILABLE");console.error("HULLET_MODEL_VIEWER",reason);}
function progress(event){
 if(event.lengthComputable&&event.total>0)$("loading-progress").style.width=Math.round(event.loaded/event.total*100)+"%";
}
function setModelUI(key){
 const data=modelData[key];
 $("model-title").textContent=data.name;
 $("model-category").textContent=data.type;
 $("model-description").textContent=data.description;
 $("thunderfury-note").hidden=!data.sketchfab;
 $("sketchfab-links").hidden=!data.sketchfab;
 $("rotation-toggle").disabled=false;
 $("model-select").value=key;
}
function fitModel(gltf){
 if(model){
   root.remove(model);
   // Dispose model-specific mesh materials but never scene-wide lights.
   model.traverse(obj=>{
     if(!obj.isMesh)return;
     obj.geometry?.dispose();
     const mats=Array.isArray(obj.material)?obj.material:[obj.material];
     for(const mat of mats){if(!mat)continue;for(const key of ["map","normalMap","metalnessMap","roughnessMap","aoMap","emissiveMap"])mat[key]?.dispose?.();mat.dispose();}
   });
 }
 model=gltf.scene;
 const box=new THREE.Box3().setFromObject(model);
 const size=new THREE.Vector3(),center=new THREE.Vector3();
 box.getSize(size);box.getCenter(center);
 const length=Math.max(size.x,size.y,size.z);
 if(!Number.isFinite(length)||length<.00001)throw Error("3D file has no visible geometry");
 const scale=3.5/length;
 model.scale.multiplyScalar(scale);
 model.position.sub(center.multiplyScalar(scale));
 root.add(model);
 mixer=gltf.animations.length?new THREE.AnimationMixer(model):null;
 if(mixer){const clip=gltf.animations[0];mixer.clipAction(clip).play();}
 const meshes=[];
 model.traverse(obj=>{if(obj.isMesh)meshes.push(obj);});
 state(meshes.length+" MESHES / GLTF READY");
 controls.reset();requestFrame();
}
function requestFrame(){
 if(disposed || !renderer || document.hidden || active==="thunderfury")return;
 renderer.render(scene,camera);
}
function resize(){
 if(!renderer)return;
 const width=Math.max(1,innerWidth),height=Math.max(1,innerHeight);
 const cap=Math.sqrt((mobile.matches?850000:1450000)/(width*height));
 renderer.setPixelRatio(Math.max(.65,Math.min(devicePixelRatio||1,mobile.matches?1:1.45,cap)));
 renderer.setSize(width,height,false);
 camera.aspect=width/height;camera.updateProjectionMatrix();
 requestFrame();
}
function initialize(){
 renderer=new THREE.WebGLRenderer({canvas:background,alpha:true,antialias:false,stencil:false,powerPreference:"high-performance"});
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
 controls=new OrbitControls(camera,background);
 controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.065;
 controls.minDistance=3;controls.maxDistance=13;
 controls.autoRotate=!reduced.matches;controls.autoRotateSpeed=.31;
 controls.target.set(0,0,0);controls.update();
 controls.addEventListener("change",requestFrame);
 resize();
 window.addEventListener("resize",resize,{passive:true});
 const visibility=()=>{if(!document.hidden)clock.getDelta();};
 document.addEventListener("visibilitychange",visibility);
}
async function choose(key){
 const data=modelData[key];if(!data)return;
 active=key;setModelUI(key);
 const attempt=++loadNumber;
 $("error").hidden=true;
 if(data.sketchfab){
   hideLoader();
   background.hidden=true;
   frame.parentElement.hidden=false;
   frame.src=sketchfabUrl;
   state("SKETCHFAB / EXTERNAL VIEWER");
   window.__HULLET_THUNDERFURY_READY=true;
   return;
 }
 if(!frame.parentElement.hidden){
   frame.src="about:blank";frame.parentElement.hidden=true;
 }
 background.hidden=false;
 showLoader("DECODING "+data.name.toUpperCase());
 loadTimer=setTimeout(()=>fail("The model has not loaded after 18 seconds. Try refreshing."),18000);
 try{
   const gltf=await new Promise((resolve,reject)=>loader.load(data.url,resolve,progress,reject));
   if(attempt!==loadNumber)return;
   fitModel(gltf);
   hideLoader();ready=true;
   window.__HULLET_MODELFRONT_READY=true;
 }catch(error){
   if(attempt===loadNumber)fail(error.message||"The GLB model could not be decoded.");
 }
}
function downloadLocal(file){
 if(!file)return;
 if(!/\.glb$/i.test(file.name)||file.size>25*1024*1024){
   fail("Choose a .glb model smaller than 25 MB.");return;
 }
 const url=URL.createObjectURL(file),attempt=++loadNumber;
 active="custom";$("model-title").textContent=file.name;
 $("model-category").textContent="GLTF / YOUR LOCAL MODEL";
 $("model-description").textContent="Loaded from your device; not uploaded to this website.";
 background.hidden=false;frame.parentElement.hidden=true;frame.src="about:blank";
 $("thunderfury-note").hidden=true;$("sketchfab-links").hidden=true;
 showLoader("IMPORTING LOCAL MODEL");
 loadTimer=setTimeout(()=>fail("Model import timed out after 18 seconds."),18000);
 loader.load(url,gltf=>{
   URL.revokeObjectURL(url);
   if(attempt!==loadNumber)return;
   try{fitModel(gltf);hideLoader();state("LOCAL GLTF / READY");}
   catch(err){fail(err.message);}
 },progress,err=>{URL.revokeObjectURL(url);if(attempt===loadNumber)fail(err.message);});
}
function animate(ms){
 animation=requestAnimationFrame(animate);
 if(disposed || document.hidden || active==="thunderfury")return;
 if(ms-last<(mobile.matches?42:33))return;
 last=ms;
 const delta=Math.min(clock.getDelta(),.08);
 if(mixer)mixer.update(delta);
 if(!reduced.matches)controls.update();
 renderer.render(scene,camera);
}
function bind(){
 $("model-select").addEventListener("change",e=>choose(e.target.value));
 $("rotation-toggle").addEventListener("click",()=>{
   moveAllowed=!moveAllowed;
   controls.autoRotate=moveAllowed&&!reduced.matches;
   $("rotation-toggle").textContent=moveAllowed?"Ⅱ AUTO ROTATE":"▶ AUTO ROTATE";
   $("rotation-toggle").setAttribute("aria-pressed",String(moveAllowed));
 });
 $("reset").addEventListener("click",()=>{controls.reset();requestFrame();});
 $("import-trigger").addEventListener("click",()=>$("model-file").click());
 $("model-file").addEventListener("change",e=>downloadLocal(e.target.files?.[0]));
 $("reload").addEventListener("click",()=>location.reload());
 frame.addEventListener("load",()=>{if(active==="thunderfury")state("SKETCHFAB VIEWER / LOADED DOCUMENT");});
 window.addEventListener("pagehide",()=>{
   disposed=true;cancelAnimationFrame(animation);clearTimeout(loadTimer);
   controls?.dispose();renderer?.dispose();frame.src="about:blank";
 });
 reduced.addEventListener("change",()=>{controls.autoRotate=moveAllowed&&!reduced.matches;requestFrame();});
}
try{
 initialize();bind();choose("sunglasses");animate(0);
}catch(error){
 fail("Three.js could not initialize. Enable WebGL and hardware acceleration. "+(error.message||""));
}
