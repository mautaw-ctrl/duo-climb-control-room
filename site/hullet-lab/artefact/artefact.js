import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";

const $=id=>document.getElementById(id);
const canvas=$("viewport");
const clamp=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
const reduced=matchMedia("(prefers-reduced-motion: reduce)");
const mobile=matchMedia("(max-width: 700px)");
const choices=[
  {id:"portal",label:"PORTALS",code:"01",description:"Choose a world"},
  {id:"material",label:"MATERIAL",code:"02",description:"Modulate the object"},
  {id:"diagnostics",label:"STRUCTURE",code:"03",description:"Inspect the scene"}
];
const panels={
  portal:[
    {label:"THE JESUS FIELD",caption:"GO TO HULLET",href:"../"},
    {label:"SPILLEMAND",caption:"LIVE DISCORD MUSIC",href:"https://jesuslovesyou.dk/player/"},
    {label:"DUO TRACKER",caption:"LEAGUE CONTROL ROOM",href:"https://jesuslovesyou.dk/tracker/"},
    {label:"WINDOWS 98",caption:"DESKTOP ARCHIVE",href:"https://jesuslovesyou.dk/win98"}
  ],
  material:[
    {label:"IRIDESCENT",caption:"ORIGINAL MATERIAL",effect:"original"},
    {label:"ARCTIC",caption:"ICE-TINTED LIGHT",effect:"ice"},
    {label:"SOLAR",caption:"AMBER LIGHT",effect:"amber"},
    {label:"ULTRAVIOLET",caption:"PLASMA LIGHT",effect:"violet"}
  ],
  diagnostics:[
    {label:"WIREFRAME",caption:"VIEW TRIANGLE MESH",effect:"wireframe"},
    {label:"ORBITAL FIELD",caption:"TOGGLE GLASS RINGS",effect:"lights"},
    {label:"RE-CENTRE",caption:"HOME VIEW",effect:"reset"}
  ]
};
const markerMaterials=[];
const mats=[];
const pointer=new THREE.Vector2();
const raycaster=new THREE.Raycaster();
let scene,renderer,camera,controls,root,objectRoot,modelRoot,hotspotGroup,panelGroup;
let renderRequested=true,contextLost=false,disposed=false,modelVersion=0;
let clock=0,last=0,frame=0,orbit=0;
let interactive=[],hotspots=[],panelItems=[],rings,stars;
let modelReady=false,currentMenu="portal",menuOpen=true,modelName="SUNGLASSES KHRONOS";
let burst=0,timer=0,startPointer=null,glowEnabled=true;
let loader,ambient,directional,pink,ice;
function readyStatus(message){$("gpu-status").textContent=message;}
function fail(message){
  $("loading").hidden=true;
  $("error").hidden=false;$("error-copy").textContent=message;
  readyStatus("3D UNAVAILABLE");
  window.__HULLET_ARTEFACT_ERROR=message;
}
function success(){
  $("error").hidden=true;$("loading").hidden=true;
  window.__HULLET_ARTEFACT_READY=true;
}
function watchLoad(){
  clearTimeout(timer);
  timer=setTimeout(()=>{if(!modelReady)fail("The 3D model did not initialize in 18 seconds. Reload to retry.");},18000);
}
function resize(){
  if(!renderer||disposed)return;
  const rect=canvas.getBoundingClientRect(),w=Math.max(1,rect.width),h=Math.max(1,rect.height);
  const maxPixels=mobile.matches?850000:1400000;
  const cap=Math.sqrt(maxPixels/(w*h));
  renderer.setPixelRatio(clamp(Math.min(devicePixelRatio||1,mobile.matches?1:1.5,cap),.65,1.5));
  renderer.setSize(w,h,false);
  camera.aspect=w/h;camera.updateProjectionMatrix();requestRender();
}
function requestRender(){renderRequested=true;}
function createWorld(){
  renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,stencil:false,powerPreference:"high-performance"});
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.45;
  renderer.setClearColor(0x070b13,0);
  scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x091422,.047);
  camera=new THREE.PerspectiveCamera(43,1,.12,80);
  camera.position.set(0,0.15,6.8);
  controls=new OrbitControls(camera,canvas);
  controls.enableDamping=true;controls.dampingFactor=.07;
  controls.enablePan=false;controls.minDistance=4.1;controls.maxDistance=11;
  controls.autoRotate=!reduced.matches;controls.autoRotateSpeed=.20;
  controls.target.set(0,-.20,0);
  controls.update();
  controls.addEventListener("change",requestRender);
  ambient=new THREE.AmbientLight(0xd6e9ff,2.2);scene.add(ambient);
  directional=new THREE.DirectionalLight(0xffddba,4.1);
  directional.position.set(-4,6,9);scene.add(directional);
  ice=new THREE.PointLight(0x89e9ff,68,20);
  ice.position.set(4,1,5);scene.add(ice);
  pink=new THREE.PointLight(0xb48cff,40,16);
  pink.position.set(0,-4,4);scene.add(pink);
  root=new THREE.Group();scene.add(root);
  modelRoot=new THREE.Group();root.add(modelRoot);
  hotspotGroup=new THREE.Group();root.add(hotspotGroup);
  panelGroup=new THREE.Group();root.add(panelGroup);
  loader=new GLTFLoader();
  makeBackground();resize();
}
function makeBackground(){
  // Decorative geometry is a single buffer, not one mesh per star.
  const rng=(()=>{let v=8827;return ()=>{v^=v<<13;v^=v>>>17;v^=v<<5;return(v>>>0)/4294967296;};})();
  const count=mobile.matches?170:520,coords=new Float32Array(count*3);
  for(let i=0;i<count;i++){
    const a=rng()*Math.PI*2,phi=Math.acos(2*rng()-1),d=12+rng()*11;
    coords[3*i]=Math.cos(a)*Math.sin(phi)*d;
    coords[3*i+1]=Math.cos(phi)*d;
    coords[3*i+2]=Math.sin(a)*Math.sin(phi)*d;
  }
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(coords,3));
  stars=new THREE.Points(g,new THREE.PointsMaterial({color:0xc0d6f1,size:.024,transparent:true,opacity:.57,sizeAttenuation:true}));
  scene.add(stars);
  const orbitals=new THREE.Group();
  const colors=[0x91c7d2,0xa99dde,0xdfba85];
  for(let i=0;i<3;i++){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(2.65+i*.30,.004,3,154),
      new THREE.MeshBasicMaterial({color:colors[i],transparent:true,opacity:.28-i*.045,depthWrite:false}));
    ring.rotation.set(.34+i*.6,.4+i*.9,i*.65);orbitals.add(ring);
  }
  scene.add(orbitals);rings=orbitals;
}
function textTexture(lines,{w=800,h=380,background=true}={}){
  const c=document.createElement("canvas");c.width=w;c.height=h;
  const x=c.getContext("2d");
  if(background){
    const gradient=x.createLinearGradient(0,0,w,h);
    gradient.addColorStop(0,"rgba(20,43,61,.95)");gradient.addColorStop(1,"rgba(7,15,29,.96)");
    x.fillStyle=gradient;x.fillRect(0,0,w,h);
    x.strokeStyle="rgba(158,234,236,.48)";x.lineWidth=2;
    x.strokeRect(2,2,w-4,h-4);
    x.fillStyle="#c9b68e";x.fillRect(0,0,w*.2,3);
    // Tiny instrument rails and diagnostic markings.
    x.globalAlpha=.19;x.fillStyle="#9bd8e2";
    for(let i=0;i<16;i++)x.fillRect(28+i*29,h-12,1,7);
    x.globalAlpha=1;
  }
  for(const line of lines){
    x.font=line.font||"500 23px monospace";
    x.textAlign=line.align||"left";
    x.fillStyle=line.color||"#e0eced";
    x.fillText(line.text,line.x||30,line.y||80);
  }
  const t=new THREE.CanvasTexture(c);
  t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  return t;
}
function panelPlane(width,height,z,texture,opacity=1){
  const material=new THREE.MeshBasicMaterial({
    map:texture,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false,
    polygonOffset:true,polygonOffsetFactor:-1
  });
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);
  plane.position.z=z;
  return plane;
}
function clearGroup(group){
  // Holographic canvas textures are generated locally on menu changes.
  for(const child of [...group.children]){
    group.remove(child);
    child.traverse(obj=>{
      if(obj.geometry)obj.geometry.dispose();
      const materials=Array.isArray(obj.material)?obj.material:[obj.material];
      for(const mat of materials){if(mat?.map)mat.map.dispose();mat?.dispose();}
    });
  }
}
function createMarkers(){
  clearGroup(hotspotGroup);hotspots=[];interactive=[];
  const xs=[-1.06,1.06,0],ys=[.34,.34,1.0];
  choices.forEach((menu,i)=>{
    const mark=new THREE.Group();
    mark.position.set(xs[i],ys[i],.50);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.135,.018,7,36),
      new THREE.MeshBasicMaterial({color:i===0?0xecc795:0x9fe4e9,transparent:true,opacity:.95,depthTest:false}));
    ring.userData.action={menu:menu.id};
    const core=new THREE.Mesh(new THREE.SphereGeometry(.058,12,9),
      new THREE.MeshBasicMaterial({color:0xe9f3ee,depthTest:false}));
    core.userData.action={menu:menu.id};
    mark.add(ring,core);
    const label=textTexture([
      {text:menu.code+" / "+menu.label,font:"600 24px monospace",x:26,y:48,color:"#d6eee9"},
      {text:menu.description.toUpperCase(),font:"16px monospace",x:26,y:79,color:"#a6beca"}
    ],{w:440,h:106});
    const plate=panelPlane(.95,.228,.01,label,.96);
    plate.position.y=-.31;plate.userData.action={menu:menu.id};mark.add(plate);
    hotspots.push({mark,ring,core,i});
    interactive.push(ring,core,plate);
    hotspotGroup.add(mark);
  });
}
function buildPanel(){
  clearGroup(panelGroup);panelItems=[];interactive=hotspots.flatMap(h=>[h.ring,h.core,h.mark.children[2]]);
  panelGroup.visible=menuOpen;
  if(!menuOpen)return;
  panelGroup.position.set(0,-1.20,.91);
  const mode=choices.find(x=>x.id===currentMenu)||choices[0];
  const heading=textTexture([
    {text:"HULLET // "+mode.code,font:"22px monospace",color:"#b7d6d8",x:30,y:52},
    {text:mode.label,font:"600 39px monospace",color:"#f3e3ba",x:30,y:113},
    {text:"SELECT WITH POINTER / TOUCH",font:"17px monospace",color:"#9bb4bb",x:30,y:160},
  ],{w:760,h:195});
  const top=panelPlane(2.38,.62,.02,heading);
  top.position.y=.65;panelGroup.add(top);
  const options=panels[currentMenu]||panels.portal;
  options.forEach((item,i)=>{
    const active=false;
    const tex=textTexture([
      {text:String(i+1).padStart(2,"0"),font:"600 22px monospace",color:"#e8c894",x:25,y:55},
      {text:item.label,font:"600 30px monospace",color:"#edf5f1",x:94,y:55},
      {text:item.caption,font:"17px monospace",color:"#a4c2c7",x:95,y:100},
      {text:"↗",font:"600 30px monospace",color:"#e8cb9a",x:722,y:71,align:"right"}
    ],{w:760,h:130});
    const plane=panelPlane(2.38,.40,.035+i*.001,tex,.99);
    plane.position.y=.18-i*.415;
    plane.userData.action={item,currentMenu};
    panelItems.push(plane);interactive.push(plane);
    panelGroup.add(plane);
  });
  const line=new THREE.Mesh(new THREE.PlaneGeometry(.016,.63),new THREE.MeshBasicMaterial({
    color:0x92dbdb,transparent:true,opacity:.50,side:THREE.DoubleSide,depthWrite:false}));
  line.position.set(-1.225,.62,.00);panelGroup.add(line);
  panelGroup.rotation.y=.08;
  requestRender();
}
function chooseMenu(menu,open=true){
  if(!panels[menu])return;
  currentMenu=menu;menuOpen=open;
  document.querySelectorAll("[data-menu]").forEach(b=>
    b.setAttribute("aria-pressed",String(b.dataset.menu===menu)));
  buildPanel();
  burst=1;
  requestRender();
}
function applyPalette(name){
  const palettes={
    original:[0xffddba,0x89e9ff,0xb48cff],
    ice:[0xb5f9ff,0x5bc6ff,0x88f4e8],
    amber:[0xffe4a8,0xffb472,0xe1ac69],
    violet:[0xd7aafa,0xcc74fe,0x7eb6fb]
  };
  const colors=palettes[name]||palettes.original;
  directional.color.setHex(colors[0]);ice.color.setHex(colors[1]);pink.color.setHex(colors[2]);
  requestRender();
}
function perform(item){
  if(item.href){
    const url=new URL(item.href,location.href);
    // Keep browser's default popup restrictions: called directly by user event.
    window.location.assign(url.href);
  }else if(item.effect==="reset")reset();
  else if(item.effect==="wireframe"){$("wireframe").click();}
  else if(item.effect==="lights"){$("lights").click();}
  else applyPalette(item.effect);
}
function setWireframe(enabled){
  if(!objectRoot)return;
  objectRoot.traverse(obj=>{
    if(!obj.isMesh)return;
    const materials=Array.isArray(obj.material)?obj.material:[obj.material];
    for(const mat of materials)if(mat&&"wireframe" in mat){mat.wireframe=enabled;mat.needsUpdate=true;}
  });requestRender();
}
function setLights(enabled){
  glowEnabled=enabled;
  rings.visible=enabled;stars.visible=enabled;
  if(!enabled){ice.intensity=18;pink.intensity=14;}
  else{ice.intensity=68;pink.intensity=40;}
  requestRender();
}
function reset(){
  controls.reset();
  camera.position.set(0,.15,6.8);controls.target.set(0,-.20,0);controls.update();
  root.rotation.set(0,0,0);
  chooseMenu("portal");
  requestRender();
}
function frameLoaded(gltf,name){
  if(objectRoot){
    modelRoot.remove(objectRoot);
    objectRoot.traverse(obj=>{
      // Never dispose assets still shared with this glTF loader instance.
      if(obj.geometry)obj.geometry.dispose();
      const materials=Array.isArray(obj.material)?obj.material:[obj.material];
      for(const mat of materials){if(!mat)continue;for(const key of ["map","normalMap","roughnessMap","metalnessMap","aoMap","emissiveMap","transmissionMap"]){mat[key]?.dispose?.();}mat.dispose();}
    });
  }
  objectRoot=gltf.scene;
  const box=new THREE.Box3().setFromObject(objectRoot),size=new THREE.Vector3(),center=new THREE.Vector3();
  box.getSize(size);box.getCenter(center);
  const maxAxis=Math.max(size.x,size.y,size.z);
  if(!Number.isFinite(maxAxis)||maxAxis<1e-6)throw Error("This glTF object contains no usable geometry.");
  const ratio=3.2/maxAxis;
  objectRoot.scale.multiplyScalar(ratio);
  objectRoot.position.sub(center.multiplyScalar(ratio));
  // Lift the object above its holographic navigation block.
  objectRoot.position.y+=.62;
  modelRoot.add(objectRoot);
  let triangles=0,meshCount=0;
  objectRoot.traverse(obj=>{
    if(!obj.isMesh)return;
    meshCount++;
    const geometry=obj.geometry;
    triangles+=(geometry.index?geometry.index.count:geometry.attributes.position.count)/3;
  });
  $("model-readout").textContent=name.toUpperCase();
  readyStatus(meshCount+" MESHES / "+Math.round(triangles).toLocaleString()+" TRIANGLES");
  createMarkers();buildPanel();
  modelReady=true;
  clearTimeout(timer);success();requestRender();
}
async function loadModel(url,name){
  const version=++modelVersion;
  modelReady=false;
  $("loading").hidden=false;
  $("error").hidden=true;
  $("loading-progress").style.width="0%";
  $("loading-detail").textContent="Reading glTF scene…";
  watchLoad();
  try{
    const gltf=await new Promise((resolve,reject)=>loader.load(url,resolve,event=>{
      if(version!==modelVersion)return;
      if(event.lengthComputable&&event.total>0){
        const percent=Math.round(event.loaded/event.total*100);
        $("loading-progress").style.width=percent+"%";
        $("loading-detail").textContent="Geometry "+percent+"%";
      }
    },reject));
    if(version!==modelVersion)return;
    frameLoaded(gltf,name);
  }catch(err){
    if(version===modelVersion){
      console.error("ARTEFACT GLTF_LOAD_FAILED",err);
      fail("Could not decode this model. Use a self-contained .glb under 25 MB. "+String(err?.message||"").slice(0,100));
    }
  }
}
function handleAction(action){
  if(action.menu)chooseMenu(action.menu,true);
  else if(action.item)perform(action.item);
}
function interact(event){
  if(!modelReady||!camera)return;
  const rect=canvas.getBoundingClientRect();
  pointer.set((event.clientX-rect.left)/rect.width*2-1,
    -((event.clientY-rect.top)/rect.height*2-1));
  raycaster.setFromCamera(pointer,camera);
  const collisions=raycaster.intersectObjects(interactive,false);
  if(collisions.length){
    // Prefer nearest positive distance; marker and panel both belong to rotating root.
    const action=collisions[0].object.userData.action;
    if(action)handleAction(action);
  }else if(!menuOpen)chooseMenu("portal",true);
}
function initEvents(){
  canvas.addEventListener("pointerdown",e=>{startPointer={x:e.clientX,y:e.clientY,t:performance.now()};},{passive:true});
  canvas.addEventListener("pointerup",e=>{
    if(!startPointer)return;
    const distance=Math.hypot(e.clientX-startPointer.x,e.clientY-startPointer.y);
    if(distance<9)interact(e);
    startPointer=null;
  },{passive:true});
  canvas.addEventListener("pointercancel",()=>{startPointer=null;});
  document.querySelectorAll("[data-menu]").forEach(btn=>
    btn.addEventListener("click",()=>chooseMenu(btn.dataset.menu,true)));
  $("engage").addEventListener("click",()=>{chooseMenu("portal",true);controls.autoRotate=false;$("autorotate").checked=false;});
  $("reset").addEventListener("click",reset);
  $("retry").addEventListener("click",()=>loadModel("./SunglassesKhronos.glb","Sunglasses Khronos"));
  $("restore").addEventListener("click",()=>{
    $("model-upload").value="";
    loadModel("./SunglassesKhronos.glb","Sunglasses Khronos");
  });
  $("autorotate").addEventListener("change",e=>{controls.autoRotate=e.target.checked&&!reduced.matches;requestRender();});
  $("wireframe").addEventListener("change",e=>setWireframe(e.target.checked));
  $("lights").addEventListener("change",e=>setLights(e.target.checked));
  $("model-upload").addEventListener("change",async e=>{
    const file=e.target.files?.[0];if(!file)return;
    if(!/\.glb$/i.test(file.name)||file.size>25*1024*1024){
      fail("Select a self-contained .glb file smaller than 25 MB. External textures are not supported.");
      return;
    }
    const url=URL.createObjectURL(file);
    try{await loadModel(url,file.name.replace(/\.glb$/i,""));}
    finally{URL.revokeObjectURL(url);}
  });
  const onResize=()=>resize();
  window.addEventListener("resize",onResize,{passive:true});
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)requestRender();});
  window.addEventListener("pagehide",()=>{
    disposed=true;if(frame)cancelAnimationFrame(frame);
    clearTimeout(timer);controls?.dispose();renderer?.dispose();
  });
  canvas.addEventListener("webglcontextlost",e=>{
    e.preventDefault();contextLost=true;modelReady=false;
    fail("The GPU context was lost. Reload to restore the object.");
  });
  canvas.addEventListener("webglcontextrestored",()=>location.reload());
  reduced.addEventListener("change",()=>{
    controls.autoRotate=$("autorotate").checked&&!reduced.matches;
    requestRender();
  });
}
function animation(t){
  frame=requestAnimationFrame(animation);
  if(disposed||contextLost||document.hidden)return;
  const interval=mobile.matches?1000/24:1000/30;
  if(t-last<interval)return;
  const delta=last?Math.min(.06,(t-last)/1000):.033;
  last=t;clock+=delta;orbit+=delta;
  controls.update();
  if(glowEnabled&&!reduced.matches){
    rings.rotation.y+=delta*.007;
    stars.rotation.y+=delta*.001;
    hotspotGroup.children.forEach((g,i)=>{
      const s=1+.05*Math.sin(orbit*1.9+i*1.9);
      g.scale.setScalar(s);
    });
  }
  if(burst>0){burst=Math.max(0,burst-delta);}
  if(modelReady&&(!reduced.matches||renderRequested||controls.autoRotate)){
    renderer.render(scene,camera);renderRequested=false;
  }else if(renderRequested){renderer.render(scene,camera);renderRequested=false;}
}
async function init(){
  try{
    createWorld();initEvents();
    // Wireframe and control state are initialized before the model resolves.
    setLights($("lights").checked);
    modelName="SUNGLASSES KHRONOS";
    await loadModel("./SunglassesKhronos.glb","Sunglasses Khronos");
    if(!disposed)frame=requestAnimationFrame(animation);
  }catch(error){
    console.error("ARTEFACT_STARTUP_FAILED",error);
    fail("The 3D engine failed to start. Check WebGL / hardware acceleration. "+String(error?.message||"").slice(0,140));
  }
}
init();
