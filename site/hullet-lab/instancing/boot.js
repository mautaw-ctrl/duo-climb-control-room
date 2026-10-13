/* Classic-script boot watchdog.
   A missing ES module never executes its own catch block. No more infinite loader. */
(function(){
  "use strict";
  let settled=false;
  const begin=Date.now();
  function fail(reason){
    if(settled)return;
    settled=true;
    if(pulse)clearTimeout(pulse);
    if(deadline)clearTimeout(deadline);
    const loading=document.getElementById("loading");
    loading?.classList.add("finished");
    const card=document.getElementById("render-error");
    if(card){
      card.hidden=false;
      const paragraph=card.querySelector("p");
      if(paragraph)paragraph.textContent=
        reason+" Opdatér siden med Ctrl+F5. Hvis problemet fortsætter, kontrollér at browseren tillader WebGL.";
    }
    const status=document.getElementById("gpu-stat");
    if(status)status.textContent="RENDERER UNAVAILABLE";
    console.warn("[Hullet Three.js] "+reason);
  }
  function ready(){
    if(settled)return;
    settled=true;
    if(pulse)clearTimeout(pulse);
    if(deadline)clearTimeout(deadline);
    const loading=document.getElementById("loading");
    loading?.classList.add("finished");
  }
  const pulse=setTimeout(()=>{
    const status=document.getElementById("gpu-stat");
    if(status&&!settled)status.textContent="INITIALISERER 3D... "+Math.round((Date.now()-begin)/1000)+"S";
  },4500);
  const deadline=setTimeout(()=>fail(
    "3D-motoren blev ikke indlæst inden for 16 sekunder. De lokale Three.js-filer kan være utilgængelige."
  ),16000);
  window.HulletBoot={ready,failed:reason=>fail(String(reason||"Ukendt grafikfejl"))};
  window.addEventListener("error",e=>{
    if(settled)return;
    if(e.target && e.target!==window && e.target.tagName==="SCRIPT"){
      fail("Et nødvendigt JavaScript-modul kunne ikke indlæses.");
    }else if(e.message && /module|import|WebGL|three\.js|OrbitControls/i.test(e.message)){
      fail(e.message.slice(0,200));
    }
  },true);
  window.addEventListener("unhandledrejection",e=>{
    if(settled)return;
    const message=String(e.reason?.message||e.reason||"Uventet indlæsningsfejl");
    if(/module|fetch|three|WebGL|import/i.test(message))fail(message.slice(0,200));
  });
})();