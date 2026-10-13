import {InstancingScene,boundsForCount} from "./engine.js";
const $=id=>document.getElementById(id);
const mobile=matchMedia("(max-width: 720px)").matches;
const canvas=$("universe"),loading=$("loading"),error=$("render-error");
const number=n=>new Intl.NumberFormat("da-DK").format(n);
let engine,paused=false,morphShape="nebula";
function report(message){if($("gpu-stat"))$("gpu-stat").textContent=message;}
function visibleError(message){
  loading.classList.add("finished");error.hidden=false;
  error.querySelector("p").textContent=message;
}
try{
  engine=new InstancingScene(canvas,{count:mobile?2600:6500});
  window.__HULLET_THREE_OK=true;
  $("instances").value=engine.count;$("count-output").textContent=number(engine.count);
  report(number(engine.count)+" INSTANCES / 1 DRAW CALL");
  loading.classList.add("finished");
}catch(reason){
  console.error("Three.js instancing engine unavailable",reason);
  visibleError("WebGL kan ikke initialiseres på denne enhed. Prøv at slå hardwareacceleration til.");
}
function syncPressed(buttons,target,attr){
  buttons.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset[attr]===target)));
}
document.querySelectorAll("[data-shape]").forEach(button=>button.addEventListener("click",()=>{
  if(!engine)return;
  morphShape=button.dataset.shape;
  engine.setPreset(morphShape);
  syncPressed(document.querySelectorAll("[data-shape]"),morphShape,"shape");
}));
document.querySelectorAll("[data-palette]").forEach(button=>button.addEventListener("click",()=>{
  if(!engine)return;
  engine.recolor(button.dataset.palette);
  syncPressed(document.querySelectorAll("[data-palette]"),button.dataset.palette,"palette");
}));
$("instances").addEventListener("input",event=>{
  if(!engine)return;
  const count=engine.setCount(Number(event.target.value));
  $("count-output").textContent=number(count);
  report(number(count)+" INSTANCES / 1 DRAW CALL");
});
$("speed").addEventListener("input",event=>{
  if(!engine)return;
  engine.speed=Number(event.target.value);
  $("speed-output").textContent=engine.speed.toFixed(2);
});
$("pause").addEventListener("click",()=>{
  if(!engine)return;
  paused=!paused;
  engine.run(!paused);
  $("pause").textContent=paused?"▶ Afspil":"Ⅱ Pause";
  $("pause").setAttribute("aria-pressed",String(paused));
});
$("reset").addEventListener("click",()=>{
  if(!engine)return;
  engine.controls.reset();engine.cluster.rotation.set(0,0,0);
  engine.setPreset("nebula");engine.setScroll(0);
  engine.recolor("spectral");engine.speed=.12;
  $("instances").value=mobile?2600:6500;engine.setCount(Number($("instances").value));
  $("count-output").textContent=number(engine.count);
  $("speed").value=".12";$("speed-output").textContent=".12";
  morphShape="nebula";
  syncPressed(document.querySelectorAll("[data-shape]"),"nebula","shape");
  syncPressed(document.querySelectorAll("[data-palette]"),"spectral","palette");
});
$("capture").addEventListener("click",async()=>{
  if(!engine)return;
  const blob=await engine.snapshot();
  if(!blob)return;
  const url=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=url;link.download="hullet-three-instancing.png";link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
function scrollUpdate(){
  if(!engine)return;
  const start=$("studio").offsetTop;
  const length=Math.max(1,$("studio").offsetHeight-window.innerHeight);
  engine.setScroll(Math.max(0,Math.min(1,(scrollY-start)/length)));
}
function initScroll(){
  if(window.gsap&&window.ScrollTrigger&&!reduced){
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({
      trigger:"#studio",start:"top top",end:"bottom top",
      scrub:.65,
      onUpdate:self=>{engine?.setScroll(self.progress);}
    });
    for(const el of document.querySelectorAll(".chapter-inner")){
      gsap.fromTo(el,{y:60,opacity:.15},{y:0,opacity:1,duration:1.2,ease:"power2.out",
        scrollTrigger:{trigger:el,start:"top 88%",end:"top 45%",scrub:.7}});
    }
    return;
  }
  addEventListener("scroll",scrollUpdate,{passive:true});
  scrollUpdate();
}
initScroll();
addEventListener("pagehide",()=>{engine?.dispose();});
