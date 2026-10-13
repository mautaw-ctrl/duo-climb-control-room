import {InstancingScene} from "../instancing/engine.js";
import {sculptPortrait,serializePLY,serializeOBJ} from "./portrait.js";

const $=id=>document.getElementById(id);
const countLabel=n=>new Intl.NumberFormat("da-DK").format(n);
const canvas=$("universe"),loading=$("loading"),error=$("render-error");
const mobile=matchMedia("(max-width: 720px)").matches;
let engine=null,rawImage=null,stream=null,previewURL=null,sculpture=null,paused=false;
let scanTimer=0,currentPalette="spectral";
const status=$("scan-status");
function setStatus(message){status.textContent=message;}
function download(content,mimetype,filename){
  const blob=typeof content==="string"?new Blob([content],{type:mimetype}):content;
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
}
function setReady(yes){
  $("export-ply").disabled=!yes;
  $("export-obj").disabled=!yes;
}
function syncPalette(){
  document.querySelectorAll("[data-palette]").forEach(btn=>
    btn.setAttribute("aria-pressed",String(btn.dataset.palette===currentPalette)));
}
try{
  engine=new InstancingScene(canvas,{count:mobile?2400:5000,palette:"spectral"});
  engine.setPreset("cathedral",true);
  engine.speed=.13;
  $("instances").value=engine.count;
  $("count-output").textContent=countLabel(engine.count);
  loading.classList.add("finished");
  window.__HULLET_HEAD_READY=true;
  window.HulletBoot?.ready();
}catch(reason){
  console.error("Head Lab WebGL failed",reason);
  loading.classList.add("finished");error.hidden=false;
  error.querySelector("p").textContent="WebGL kunne ikke starte. Aktivér hardwareacceleration.";
  setStatus("WEBGL IKKE TILGÆNGELIG");
  window.HulletBoot?.failed(reason?.message||"WebGL kan ikke starte");
}
function photoToPixels(image){
  const w=128,h=160,off=document.createElement("canvas");
  off.width=w;off.height=h;
  const context=off.getContext("2d",{willReadFrequently:true});
  if(!context)throw new Error("Billedbehandling er ikke understøttet her.");
  const iw=image.naturalWidth||image.videoWidth||image.width;
  const ih=image.naturalHeight||image.videoHeight||image.height;
  if(!iw||!ih)throw new Error("Billedet har ugyldige dimensioner.");
  // Cover crop, preserving aspect ratio: user should center the face.
  const aspect=w/h,original=iw/ih;
  let sx=0,sy=0,sw=iw,sh=ih;
  if(original>aspect){sw=ih*aspect;sx=(iw-sw)*.5;}
  else{sh=iw/aspect;sy=(ih-sh)*.5;}
  context.clearRect(0,0,w,h);
  context.drawImage(image,sx,sy,sw,sh,0,0,w,h);
  return context.getImageData(0,0,w,h);
}
function rebuild(){
  if(!rawImage||!engine)return;
  setStatus("BEREGNER FARVER, DYBDE OG GEOMETRI...");
  try{
    const data=photoToPixels(rawImage);
    sculpture=sculptPortrait(data.data,data.width,data.height,{
      depth:Number($("depth").value),maskWidth:Number($("face-width").value),
      count:Number($("instances").value)
    });
    engine.setCount(Number($("instances").value));
    engine.setPoints(sculpture.points,{colors:sculpture.colors});
    engine.recolor(currentPalette);
    $("gpu-stat").textContent=countLabel(engine.count)+" INSTANSER / "+countLabel(sculpture.triangleCount)+" TRIANGLES";
    setReady(true);
    setStatus("KLAR / "+countLabel(sculpture.vertices.length)+" VERTEX-PUNKTER");
  }catch(reason){
    sculpture=null;setReady(false);
    setStatus("FEJL / "+(reason?.message||"Ugyldigt billede"));
    console.warn("Head Lab reconstruction",reason);
  }
}
function scheduleRebuild(){
  clearTimeout(scanTimer);
  scanTimer=setTimeout(rebuild,140);
}
async function receiveImage(blob){
  if(!blob || !blob.type.startsWith("image/")){
    setStatus("VÆLG EN BILLEDFIL, IKKE EN VIDEO ELLER EN ZIP.");
    return;
  }
  if(blob.size>24*1024*1024){
    setStatus("BILLEDET ER OVER 24 MB. VÆLG EN MINDRE FIL.");
    return;
  }
  try{
    setStatus("ÅBNER BILLEDE...");
    // Decode local bytes, no network submission or third-party recognition.
    const bitmap=typeof createImageBitmap==="function"?await createImageBitmap(blob):null;
    if(bitmap){
      rawImage?.close?.();rawImage=bitmap;
    }else{
      const objectUrl=URL.createObjectURL(blob),image=new Image();
      try{
        await new Promise((resolve,reject)=>{
          image.onload=resolve;image.onerror=()=>reject(new Error("Kan ikke afkode billedet."));
          image.src=objectUrl;
        });
        rawImage=image;
      }finally{URL.revokeObjectURL(objectUrl);}
    }
    if(previewURL)URL.revokeObjectURL(previewURL);
    previewURL=URL.createObjectURL(blob);
    $("source-preview").src=previewURL;$("source-preview").hidden=false;
    $("source-placeholder").hidden=true;
    rebuild();
  }catch(reason){setStatus("FOTO FEJL / "+reason.message);}
}
$("portrait-file").addEventListener("change",event=>{
  receiveImage(event.target.files?.[0]);
});
const dropzone=$("dropzone");
for(const name of ["dragenter","dragover"]){
  dropzone.addEventListener(name,event=>{
    event.preventDefault();dropzone.classList.add("dragging");
  });
}
for(const name of ["dragleave","drop"]){
  dropzone.addEventListener(name,event=>{
    event.preventDefault();dropzone.classList.remove("dragging");
    if(name==="drop")receiveImage(event.dataTransfer?.files?.[0]);
  });
}
async function stopCamera(){
  if(stream){for(const track of stream.getTracks())track.stop();stream=null;}
  const video=$("camera-preview");
  video.pause();video.srcObject=null;video.hidden=true;
  $("camera-placeholder").hidden=false;
  $("camera-start").textContent="◉ Brug kamera";
  $("camera-snap").disabled=true;
}
$("camera-start").addEventListener("click",async()=>{
  if(stream){stopCamera();return;}
  if(!navigator.mediaDevices?.getUserMedia){
    setStatus("KAMERA KRÆVER HTTPS OG EN UNDERSTØTTET BROWSER.");
    return;
  }
  try{
    setStatus("VENTER PÅ KAMERATILLADELSE...");
    stream=await navigator.mediaDevices.getUserMedia({
      audio:false,video:{facingMode:"user",width:{ideal:960},height:{ideal:1280}}
    });
    const video=$("camera-preview");
    video.srcObject=stream;video.hidden=false;$("camera-placeholder").hidden=true;
    await video.play();
    $("camera-start").textContent="■ Sluk kamera";
    $("camera-snap").disabled=false;
    setStatus("KAMERA TILSLUTTET / SE DIREKTE IND I KAMERAET");
  }catch(reason){
    await stopCamera();
    setStatus("KAMERA FEJL / "+(reason.name==="NotAllowedError"?"Tilladelse afvist":reason.message));
  }
});
$("camera-snap").addEventListener("click",()=>{
  if(!stream)return;
  const video=$("camera-preview"),capture=document.createElement("canvas");
  capture.width=video.videoWidth||640;capture.height=video.videoHeight||480;
  const context=capture.getContext("2d");if(!context)return;
  // Mirror webcam as in the self-preview.
  context.translate(capture.width,0);context.scale(-1,1);
  context.drawImage(video,0,0,capture.width,capture.height);
  capture.toBlob(async blob=>{
    if(blob)await receiveImage(blob);
    await stopCamera();
  },"image/png");
});
for(const [id,out] of [["depth","depth-output"],["face-width","width-output"],["instances","count-output"]]){
  $(id).addEventListener("input",event=>{
    $(out).textContent=id==="instances"?countLabel(Number(event.target.value)):
      Number(event.target.value).toFixed(2).replace(".",",");
    scheduleRebuild();
  });
}
document.querySelectorAll("[data-palette]").forEach(button=>button.addEventListener("click",()=>{
  currentPalette=button.dataset.palette;syncPalette();engine?.recolor(currentPalette);
}));
$("export-ply").addEventListener("click",()=>{
  if(!sculpture)return;
  setStatus("GEMMER FARVET 3D-MODEL...");
  download(serializePLY(sculpture),"model/ply","hullet-portrait-colored.ply");
  setStatus("EKSPORTERET / PLY MED FARVER OG FLADER");
});
$("export-obj").addEventListener("click",()=>{
  if(!sculpture)return;
  download(serializeOBJ(sculpture),"text/plain","hullet-portrait-relief.obj");
  setStatus("EKSPORTERET / OBJ MED GEOMETRISKE FLADER");
});
$("pause").addEventListener("click",()=>{
  if(!engine)return;
  paused=!paused;engine.run(!paused);
  $("pause").textContent=paused?"▶ Afspil":"Ⅱ Pause";
});
$("capture").addEventListener("click",async()=>{
  if(!engine)return;
  const blob=await engine.snapshot();
  if(blob)download(blob,"image/png","hullet-portrait-sculpture.png");
});
$("reset").addEventListener("click",()=>{
  currentPalette="spectral";syncPalette();
  $("depth").value=".58";$("face-width").value=".79";
  $("depth-output").textContent="0,58";$("width-output").textContent="0,79";
  $("instances").value=mobile?2400:5000;
  $("count-output").textContent=countLabel(Number($("instances").value));
  engine?.controls.reset();
  if(rawImage)rebuild();
  else{engine?.setPreset("cathedral",true);engine?.recolor("spectral");}
  setStatus(rawImage?"PORTRÆT NULSTILLET":"KLAR / VÆLG ET PORTRÆT");
});
addEventListener("pagehide",()=>{
  stopCamera();engine?.dispose();
  if(previewURL)URL.revokeObjectURL(previewURL);
  rawImage?.close?.();
});
