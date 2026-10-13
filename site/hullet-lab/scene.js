/* HULLET / PHI LAB. Smooth scroll-driven camera and native accessible menus.
   This lab is isolated from the production homepage. No layout hijacking. */
(() => {
  "use strict";
  const $=id=>document.getElementById(id);
  const canvas=$("figure"),motion=$("motion");
  if(!canvas||!motion)return;
  const symbol=motion.querySelector(".motion-symbol"),label=motion.querySelector(".motion-label");
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  const chapters=Array.from(document.querySelectorAll("main > section"));
  const choices=Array.from(document.querySelectorAll("[data-pattern]"));
  const qualities=Array.from(document.querySelectorAll("[data-quality]"));
  const dropdowns=Array.from(document.querySelectorAll("details.nav-drop"));
  const progress=$("chapter-progress"),status=$("geometry-status");
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
  const key="hullet-lab-settings-v1";
  let settings={pattern:"auto",quality:"high"};
  try{const stored=JSON.parse(localStorage.getItem(key)||"null");
    if(stored&&["auto","0","1","2"].includes(stored.pattern))settings.pattern=stored.pattern;
    if(stored&&["eco","high"].includes(stored.quality))settings.quality=stored.quality;
  }catch{}
  if(navigator.connection?.saveData||reduced.matches)settings.quality="eco";

  let generation=0,gl,figure,ready=false,broken=false;
  let paused=reduced.matches,hidden=document.hidden,frame=0,last=0,elapsed=0,entrance=0;
  let width=0,height=0,dpr=1,scroll=0,targetScroll=0,mouseX=0,mouseY=0;
  let firstValid=false,slowFrames=0,autoEconomy=false;
  const saveSettings=()=>{try{localStorage.setItem(key,JSON.stringify(settings));}catch{}};
  function setButton(){
    motion.setAttribute("aria-pressed",String(paused));
    motion.setAttribute("aria-label",paused?"Fortsæt animation":"Sæt animation på pause");
    symbol.textContent=paused?"▶":"Ⅱ";
    label.textContent=paused?"Afspil":"Pause";
  }
  function setControls(){
    for(const item of choices)item.setAttribute("aria-pressed",String(item.dataset.pattern===settings.pattern));
    for(const item of qualities)item.setAttribute("aria-pressed",String(item.dataset.quality===settings.quality));
    if(status)status.textContent=(settings.pattern==="auto"?"AUTO":({0:"PHI SPIRAL",1:"LIVETS BLOMST",2:"STJERNEKORT"}[settings.pattern]))+
      " / "+(settings.quality==="eco"||autoEconomy?"ECO":"HIGH");
  }
  for(const item of choices)item.addEventListener("click",()=>{
    settings.pattern=item.dataset.pattern;saveSettings();setControls();render();
  });
  for(const item of qualities)item.addEventListener("click",()=>{
    settings.quality=item.dataset.quality;autoEconomy=false;slowFrames=0;
    saveSettings();setControls();resize();run();
  });
  for(const drop of dropdowns){
    drop.addEventListener("toggle",()=>{
      if(drop.open)for(const other of dropdowns)if(other!==drop)other.open=false;
    });
    drop.querySelectorAll("a").forEach(link=>link.addEventListener("click",()=>{drop.open=false;}));
  }
  document.addEventListener("pointerdown",event=>{
    if(!event.target.closest?.("details.nav-drop")){
      for(const drop of dropdowns)drop.open=false;
    }
  });
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape")for(const drop of dropdowns)drop.open=false;
  });
  function resize(){
    const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight);
    const cap=Math.sqrt(1400000/Math.max(1,w*h));
    const low=settings.quality==="eco"||autoEconomy;
    dpr=clamp(Math.min(devicePixelRatio||1,low?0.88:(w<760?1.05:1.38),cap),.67,1.38);
    width=canvas.width=Math.max(1,Math.round(w*dpr));
    height=canvas.height=Math.max(1,Math.round(h*dpr));
    if(gl)gl.viewport(0,0,width,height);
    if(ready)render();
  }
  function readScroll(){
    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    targetScroll=clamp(scrollY/max,0,1);
    if(progress)progress.style.width=(targetScroll*100).toFixed(2)+"%";
    if(paused||reduced.matches){scroll=targetScroll;render();}
  }
  function state(){
    const mobile=innerWidth<760;
    const chapter=scroll*3;
    const born=reduced.matches||entrance>=3.1;
    const reveal=born?1:ease((entrance-.10)/2.0);
    const formation=born?1:ease(entrance/2.8);
    // Stage 0..3: birth, Fibonacci spiral, overlapping circles, star map.
    const autoMode=chapter<=1?0:chapter<=2?ease(chapter-1):1+ease(chapter-2);
    const geometryMode=settings.pattern==="auto"?autoMode:Number(settings.pattern);
    const slow=clamp((chapter-1.4)/1.6,0,1);
    const turning=scroll*Math.PI*2.25+elapsed*.12-(1-formation)*.24;
    const zoom=1-.30*ease(slow)+.06*Math.sin(chapter*Math.PI*.70);
    const pan=mobile?0:Math.sin(chapter*1.2)*.035;
    const density=(settings.quality==="eco"||autoEconomy)?0.34:1;
    return {
      width,height,dpr,time:elapsed,reveal,light:.9,storm:.16,parting:.54,
      scene:scroll*2,centerX:mobile?.5:.65+pan,centerY:mobile?.335:.49,
      pointer:[mouseX,mouseY],
      rotation:[-.04+Math.sin(chapter*1.16)*.18,turning,.025*Math.sin(elapsed*.21+chapter)],
      figureScale:(mobile?1.09:1.14)*zoom*(.84+.16*formation),
      flight:[0,(1-formation)*-.14+.05*Math.sin(chapter*2.3),0],
      entry:1,entryProgress:formation,scrollVelocity:clamp(targetScroll-scroll,-.18,.18)*5,
      reducedMotion:reduced.matches,
      geometryMode,geometryDensity:density,
      geometryIntensity:(.36+.56*ease(clamp(chapter/1.6,0,1)))*formation
    };
  }
  function render(){
    if(!gl||!figure?.ready||gl.isContextLost()||broken)return;
    try{
      gl.viewport(0,0,width,height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
      const current=state();
      figure.draw(current);
      if(current.reveal>.35&&!firstValid){
        if(typeof gl.getError==="function" && gl.getError()!==gl.NO_ERROR)throw new Error("WebGL draw error");
        firstValid=true;
        document.body.classList.add("has-webgl");
        document.body.classList.remove("figure-loading","figure-unavailable");
      }
    }catch(error){
      broken=true;ready=false;firstValid=false;
      document.body.classList.remove("has-webgl","figure-loading");
      document.body.classList.add("figure-unavailable");
      motion.hidden=true;
      if(frame)cancelAnimationFrame(frame);
      frame=0;
      console.warn("Hullet Lab: original image retained after graphics error",error);
    }
  }
  function animate(ts){
    frame=0;
    if(paused||hidden||!ready||broken)return;
    const interval=innerWidth<760?42:33;
    if(last&&ts-last<interval){frame=requestAnimationFrame(animate);return;}
    const delta=last?Math.min(.095,(ts-last)/1000):.033;
    last=ts;elapsed+=delta;entrance=Math.min(3.2,entrance+delta);
    scroll+=(targetScroll-scroll)*(1-Math.exp(-delta*6.5));
    if(delta>.055&&!document.hidden)slowFrames++;
    else slowFrames=Math.max(0,slowFrames-2);
    if(slowFrames>20&&!autoEconomy){
      autoEconomy=true;slowFrames=0;setControls();resize();
    }
    render();
    if(ready&&!hidden&&!paused)frame=requestAnimationFrame(animate);
  }
  function run(){
    if(frame)cancelAnimationFrame(frame);
    frame=0;last=0;
    if(!paused&&!hidden&&ready)frame=requestAnimationFrame(animate);
    else if(ready)render();
  }
  motion.addEventListener("click",()=>{paused=!paused;setButton();run();});
  addEventListener("resize",resize,{passive:true});
  addEventListener("scroll",readScroll,{passive:true});
  addEventListener("pointermove",e=>{
    if(paused||reduced.matches)return;
    mouseX=clamp((e.clientX/innerWidth-.5)*.56,-.28,.28);
    mouseY=clamp((.5-e.clientY/innerHeight)*.38,-.19,.19);
  },{passive:true});
  document.addEventListener("visibilitychange",()=>{hidden=document.hidden;run();});
  window.addEventListener("pageshow",()=>{hidden=document.hidden;run();});
  reduced.addEventListener("change",e=>{
    paused=e.matches;
    if(e.matches)entrance=3.2;
    setButton();run();
  });
  async function init(){
    const attempt=++generation;
    ready=false;broken=false;firstValid=false;
    document.body.classList.add("figure-loading");
    document.body.classList.remove("has-webgl","figure-unavailable");
    motion.hidden=true;setControls();setButton();
    let timeout;
    try{
      gl=canvas.getContext("webgl",{alpha:true,antialias:false,depth:false,stencil:false,
        premultipliedAlpha:false,powerPreference:"low-power"});
      if(!gl||!window.JesusFigure)throw new Error("WebGL not available");
      if(figure)figure.dispose();
      figure=new window.JesusFigure(gl);
      resize();
      const pending=figure.load("../jesus-figure.png");
      await Promise.race([pending,new Promise((_,reject)=>{
        timeout=setTimeout(()=>reject(new Error("Particle image load exceeded 12 seconds")),12000);
      })]);
      if(attempt!==generation||gl.isContextLost())return;
      ready=true;entrance=reduced.matches?3.2:0;
      motion.hidden=false;
      readScroll();render();run();
    }catch(error){
      if(attempt!==generation)return;
      broken=true;ready=false;canvas.style.display="none";motion.hidden=true;
      document.body.classList.remove("has-webgl","figure-loading");
      document.body.classList.add("figure-unavailable");
      console.warn("Hullet Lab fallback",error);
    }finally{if(timeout)clearTimeout(timeout);}
  }
  canvas.addEventListener("webglcontextlost",event=>{
    event.preventDefault();generation++;ready=false;broken=true;firstValid=false;
    run();document.body.classList.remove("has-webgl","figure-loading");
    document.body.classList.add("figure-unavailable");motion.hidden=true;
  });
  canvas.addEventListener("webglcontextrestored",()=>{
    canvas.style.display="";gl=null;figure=null;return init();
  });
  const image=document.querySelector(".fallback img");
  if(image)image.addEventListener("error",()=>document.body.classList.add("image-unavailable"));
  if("IntersectionObserver" in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      entry.target.classList.toggle("in-view",entry.isIntersecting);
    }),{threshold:.12});
    chapters.forEach(section=>observer.observe(section));
    document.body.classList.add("has-observer");
  }
  // A GitHub Pages preview lives below /duo-climb-control-room/site/, but
  // application links should still open the live tools on the main domain.
  if(location.hostname.endsWith("github.io")){
    document.querySelectorAll('a[href^="/"]').forEach(link=>{
      link.href="https://jesuslovesyou.dk"+link.getAttribute("href");
    });
  }
  setControls();
  init();
})();
