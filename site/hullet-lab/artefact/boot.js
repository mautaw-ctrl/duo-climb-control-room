/* Classic boot guard: ES-module failures are otherwise invisible to the viewer. */
(()=>{
  "use strict";
  let done=false;
  const loading=()=>document.getElementById("loading");
  function fail(message){
    if(done)return;done=true;
    loading()?.setAttribute("hidden","");
    const card=document.getElementById("error");
    if(card){
      card.hidden=false;
      const text=document.getElementById("error-copy");
      if(text)text.textContent=message+" Check your connection and browser WebGL settings.";
    }
    const s=document.getElementById("gpu-status");
    if(s)s.textContent="3D OFFLINE";
    console.error("ARTEFACT_BOOT_FAILED",message);
  }
  window.__ARTEFACT_BOOT_FAILED=fail;
  const timer=setTimeout(()=>fail("Three.js or the model did not initialize within 20 seconds."),20000);
  const check=setInterval(()=>{
    if(window.__HULLET_ARTEFACT_READY){
      done=true;clearTimeout(timer);clearInterval(check);
    }
    if(done)clearInterval(check);
  },300);
  window.addEventListener("error",e=>{
    if(done)return;
    if(e.target?.tagName==="SCRIPT" || /module|import|GLTFLoader|three\.js/i.test(e.message||""))
      fail(e.message||"A required graphics module failed to load.");
  },true);
  window.addEventListener("unhandledrejection",e=>{
    if(done)return;
    const reason=String(e.reason?.message||e.reason||"Graphics loader error");
    if(/module|import|gltf|webgl|three/i.test(reason.toLowerCase()))fail(reason.slice(0,160));
  });
})();
