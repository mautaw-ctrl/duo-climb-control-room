/* hullet. The original image-seeded translucent Jesus point cloud, never a substitute illustration.
   A short entrance reveals the actual WebGL figure. A permanent CSS/PNG fallback prevents black screens. */
(() => {
  "use strict";
  const canvas = document.getElementById("figure");
  const motion = document.getElementById("motion");
  if (!canvas || !motion) return;
  const symbol = motion.querySelector(".motion-symbol");
  const label = motion.querySelector(".motion-label");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const sections = Array.from(document.querySelectorAll("main > section"));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const ease = n => { n=clamp(n,0,1); return n*n*(3-2*n); };
  let generation=0,gl,figure,ready=false,paused=reduced.matches,hidden=document.hidden;
  let frame=0,last=0,elapsed=0,entrance=0,scroll=0,targetScroll=0,mouseX=0,mouseY=0;
  let width=0,height=0,dpr=1,broken=false,visibleFrames=0;

  const setButton=()=>{
    motion.setAttribute("aria-pressed",String(paused));
    motion.setAttribute("aria-label",paused?"Fortsæt animation":"Sæt animation på pause");
    symbol.textContent=paused?"▶":"Ⅱ";
    label.textContent=paused?"Afspil":"Pause";
  };
  function resize(){
    const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight);
    const cap=Math.sqrt(1350000/(w*h));
    dpr=clamp(Math.min(devicePixelRatio||1,w<760?1.08:1.3,cap),.7,1.3);
    width=canvas.width=Math.max(1,Math.round(w*dpr));
    height=canvas.height=Math.max(1,Math.round(h*dpr));
    if(gl)gl.viewport(0,0,width,height);
    if(ready)render();
  }
  function readScroll(){
    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    targetScroll=clamp(scrollY/max,0,1);
    if(paused){scroll=targetScroll;render();}
  }
  function state(){
    const mobile=innerWidth<760;
    const settled=reduced.matches || entrance>=3.1;
    const reveal=settled?1:ease((entrance-.12)/2.15);
    const appearance=settled?1:ease(entrance/2.9);
    // Actual character assembles from particles on load, then makes slow,
    // uninterrupted turns in place. Sections never replace the figure.
    const angle=scroll*Math.PI*1.75 + elapsed*.15 - (1-appearance)*.28;
    return {
      width,height,dpr,time:elapsed,reveal,light:.92,storm:.13,parting:.56,scene:scroll*2,
      centerX:mobile?.5:.655+scroll*.028,
      centerY:mobile?.355:.485,
      pointer:[mouseX,mouseY],
      rotation:[-.028+(1-appearance)*.12,angle,.025*Math.sin(elapsed*.24)],
      figureScale:(mobile?1.02:1.13)*(0.86+appearance*.14),
      flight:[0,(1-appearance)*-.10,0],
      entry:1,entryProgress:appearance,
      scrollVelocity:0,reducedMotion:reduced.matches
    };
  }
  function render(){
    if(!gl||!figure?.ready||gl.isContextLost())return;
    try{
      gl.viewport(0,0,width,height);
      gl.clearColor(0,0,0,0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      figure.draw(state());
      // Never remove the fallback completely. If the browser accepts the
      // context but paints transparent/black (software GPU), Jesus stays visible.
      if(!visibleFrames++){
        const error=gl.getError();
        if(error!==gl.NO_ERROR)throw new Error("First particle frame: WebGL error "+error);
        document.body.classList.add("has-webgl");
        document.body.classList.remove("figure-loading","figure-unavailable");
      }
    }catch(error){
      broken=true;ready=false;document.body.classList.remove("has-webgl");
      document.body.classList.add("figure-unavailable");
      motion.hidden=true;
      if(frame){cancelAnimationFrame(frame);frame=0;}
      console.warn("hullet: falling back to the original figure image",error);
    }
  }
  function animate(ts){
    frame=0;
    if(paused||hidden||!ready||broken)return;
    if(last&&ts-last<33){frame=requestAnimationFrame(animate);return;}
    const delta=last?Math.min(.07,(ts-last)/1000):.033;
    last=ts;elapsed+=delta;entrance=Math.min(3.2,entrance+delta);
    scroll+=(targetScroll-scroll)*.085;
    render();
    if(ready&&!paused&&!hidden)frame=requestAnimationFrame(animate);
  }
  function run(){
    if(frame)cancelAnimationFrame(frame);
    frame=0;last=0;
    if(!paused&&!hidden&&ready)frame=requestAnimationFrame(animate);
    else if(ready)render();
  }
  motion.addEventListener("click",()=>{
    paused=!paused;
    if(paused && entrance<3.1)entrance=3.2;
    setButton();run();
  });
  addEventListener("resize",resize,{passive:true});
  addEventListener("scroll",readScroll,{passive:true});
  addEventListener("pointermove",e=>{
    if(paused||reduced.matches)return;
    mouseX=clamp((e.clientX/innerWidth-.5)*.65,-.33,.33);
    mouseY=clamp((.5-e.clientY/innerHeight)*.42,-.22,.22);
  },{passive:true});
  document.addEventListener("visibilitychange",()=>{hidden=document.hidden;run();});
  reduced.addEventListener("change",e=>{
    paused=e.matches;
    if(e.matches)entrance=3.2;
    setButton();run();
  });
  window.addEventListener("pageshow",()=>{hidden=document.hidden;run();});

  async function init(){
    const attempt=++generation;
    ready=false;broken=false;visibleFrames=0;
    document.body.classList.add("figure-loading");
    document.body.classList.remove("has-webgl","figure-unavailable");
    motion.hidden=true;
    setButton();
    let timer;
    try{
      gl=canvas.getContext("webgl",{
        alpha:true,antialias:false,depth:false,stencil:false,
        preserveDrawingBuffer:false,premultipliedAlpha:false,
        powerPreference:"low-power"
      });
      if(!gl||!window.JesusFigure)throw new Error("WebGL or Jesus particle renderer unavailable");
      if(figure)figure.dispose();
      figure=new window.JesusFigure(gl);
      resize();
      await Promise.race([
        figure.load("/jesus-figure.png"),
        new Promise((_,reject)=>{
          timer=setTimeout(()=>reject(new Error("Figure loading deadline")),9000);
        })
      ]);
      if(attempt!==generation||gl.isContextLost())return;
      ready=true;
      entrance=reduced.matches?3.2:0;
      motion.hidden=false;
      readScroll();
      // First draw before any fallback opacity changes.
      render();
      run();
    }catch(error){
      if(attempt!==generation)return;
      broken=true;ready=false;canvas.style.display="none";
      motion.hidden=true;
      document.body.classList.remove("has-webgl","figure-loading");
      document.body.classList.add("figure-unavailable");
      console.warn("hullet: original image fallback active",error);
    }finally{
      clearTimeout(timer);
    }
  }
  canvas.addEventListener("webglcontextlost",event=>{
    event.preventDefault();
    generation++;ready=false;broken=true;visibleFrames=0;
    run();
    document.body.classList.remove("has-webgl","figure-loading");
    document.body.classList.add("figure-unavailable");
    motion.hidden=true;
  });
  canvas.addEventListener("webglcontextrestored",()=>{
    canvas.style.display="";
    gl=null;figure=null;
    init();
  });

  const fallbackImage=document.querySelector(".fallback img");
  if(fallbackImage){
    fallbackImage.addEventListener("error",()=>{
      document.body.classList.add("image-unavailable");
    });
  }
  if("IntersectionObserver" in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      entry.target.classList.toggle("in-view",entry.isIntersecting);
    }),{threshold:.18});
    sections.forEach(section=>observer.observe(section));
    document.body.classList.add("has-observer");
  }
  init();
})();
