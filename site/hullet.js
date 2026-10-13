/* hullet: original image-seeded particle figure, GPU rendering capped at 30 fps. */
(() => {
  "use strict";
  const canvas = document.getElementById("figure");
  const motion = document.getElementById("motion");
  const symbol = motion.querySelector(".motion-symbol");
  const label = motion.querySelector(".motion-label");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const sections = Array.from(document.querySelectorAll("main > section"));
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  let generation=0,gl,figure,ready=false,paused=reduced.matches,hidden=document.hidden;
  let frame=0,last=0,elapsed=0,scroll=0,targetScroll=0,mouseX=0,mouseY=0;
  let width=0,height=0,dpr=1;
  const setButton=()=>{
    motion.setAttribute("aria-pressed",String(paused));
    motion.setAttribute("aria-label",paused?"Fortsæt animation":"Sæt animation på pause");
    symbol.textContent=paused?"▶":"Ⅱ";
    label.textContent=paused?"Afspil":"Pause";
  };
  function resize(){
    const w=innerWidth,h=innerHeight;
    const cap=Math.sqrt(1650000/Math.max(w*h,1));
    dpr=clamp(Math.min(devicePixelRatio||1,w<760?1.15:1.4,cap),.75,1.4);
    width=canvas.width=Math.round(w*dpr);
    height=canvas.height=Math.round(h*dpr);
    if(gl)gl.viewport(0,0,width,height);
    if(ready)render();
  }
  function readScroll(){
    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    targetScroll=clamp(scrollY/max,0,1);
    if(paused&&!reduced.matches){scroll=targetScroll;render();}
  }
  function render(){
    if(!gl||!figure?.ready||gl.isContextLost())return;
    gl.viewport(0,0,width,height);
    gl.clearColor(0,0,0,0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const mobile=innerWidth<760;
    const angle=scroll*Math.PI*2 + elapsed*.11;
    figure.draw({
      width,height,dpr,time:elapsed,reveal:1,light:.86,storm:.1,parting:.8,scene:scroll*2,
      centerX:mobile?.5:.66+scroll*.04,centerY:mobile?.38:.49,pointer:[mouseX,mouseY],rotation:[-.035,angle,.03*Math.sin(elapsed*.32)],
      figureScale:mobile?.92:1.1,flight:[0,0,0],entry:0,entryProgress:1,
      scrollVelocity:0,reducedMotion:reduced.matches
    });
  }
  function animate(ts){
    frame=0;
    if(paused||hidden||!ready)return;
    if(last&&ts-last<33){frame=requestAnimationFrame(animate);return;}
    const delta=last?Math.min(.08,(ts-last)/1000):.033;
    last=ts;elapsed+=delta;
    scroll+=(targetScroll-scroll)*.085;
    render();
    frame=requestAnimationFrame(animate);
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
    mouseX=clamp((e.clientX/innerWidth-.5)*.7,-.35,.35);
    mouseY=clamp((.5-e.clientY/innerHeight)*.5,-.25,.25);

  },{passive:true});
  document.addEventListener("visibilitychange",()=>{hidden=document.hidden;run();});
  reduced.addEventListener("change",e=>{paused=e.matches;setButton();run();});
  window.addEventListener("pageshow",()=>{hidden=document.hidden;run();});
  async function init(){
    const attempt=++generation;
    setButton();
    try{
      gl=canvas.getContext("webgl",{alpha:true,antialias:false,depth:false,premultipliedAlpha:false,powerPreference:"low-power"});
      if(!gl||!window.JesusFigure)throw new Error("WebGL unavailable");
      figure?.dispose();
      figure=new window.JesusFigure(gl);
      resize();
      await figure.load("/jesus-figure.png");
      if(attempt!==generation||gl.isContextLost())return;
      ready=true;canvas.style.display="";motion.hidden=false;
      document.body.classList.add("has-webgl");
      readScroll();run();
    }catch(error){
      // The transparent artwork remains as an accessible, static visual fallback.
      if(attempt!==generation)return;
      ready=false;document.body.classList.remove("has-webgl");
      canvas.style.display="none";motion.hidden=true;
      console.warn("hullet figure fallback",error);
    }
  }
  canvas.addEventListener("webglcontextlost",event=>{
    event.preventDefault();generation++;ready=false;run();document.body.classList.remove("has-webgl");motion.hidden=true;
  });
  canvas.addEventListener("webglcontextrestored",init);
  // Native observation keeps transitions off the render loop.
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      entry.target.classList.toggle('in-view',entry.isIntersecting);
    }),{threshold:.18});
    sections.forEach(section=>observer.observe(section));
    document.body.classList.add('has-observer');
  }
  init();
})();
