/* Progressive studio. No second WebGL context until a visitor opens a lab.
   Closing the modal destroys its iframe/renderer and resumes the original Jesus. */
(()=>{
  "use strict";
  const modal=document.getElementById("studio-modal");
  const frame=document.getElementById("studio-frame");
  const loading=document.getElementById("studio-loading");
  const exit=document.getElementById("studio-close");
  const standalone=document.getElementById("studio-standalone");
  const title=document.getElementById("studio-title");
  const subtitle=document.getElementById("studio-subtitle");
  if(!modal||!frame||!modal.showModal)return;
  const choices={instancing:{url:"./instancing/",name:"hullet / crystal storm",subtitle:"WEBGL / INSTANCED MESHES"},head:{url:"./head/",name:"hullet / head lab",subtitle:"PORTRAIT / 3D RELIEF"}};
  let timeout,previousFocus=null,opening=false;
  function stopTimer(){if(timeout){clearTimeout(timeout);timeout=0;}}
  function close(){
    stopTimer();loading.hidden=true;
    frame.removeAttribute("src"); // Releases the second GPU context.
    opening=false;
    document.body.classList.remove("studio-open");
    document.dispatchEvent(new CustomEvent("hullet:studio",{detail:{open:false}}));
    previousFocus?.focus?.({preventScroll:true});
  }
  function open(name){
    const item=choices[name];if(!item)return;
    previousFocus=document.activeElement;
    title.textContent=item.name;subtitle.textContent=item.subtitle;
    standalone.href=item.url;
    loading.hidden=false;loading.textContent="AKTIVERER 3D-RENDERING...";
    stopTimer();
    if(!modal.open)modal.showModal();
    document.body.classList.add("studio-open");
    document.dispatchEvent(new CustomEvent("hullet:studio",{detail:{open:true}}));
    opening=true;
    frame.src=item.url;
    // iframe onload reports a document load, not actual WebGL success.
    timeout=setTimeout(()=>{
      if(opening){loading.hidden=false;loading.textContent="3D-INDLÆSNING TOG FOR LANG TID. BRUG NYT VINDUE ↗";}
    },18000);
  }
  frame.addEventListener("load",()=>{
    stopTimer();
    loading.hidden=true;
    opening=false;
  });
  document.querySelectorAll("[data-studio]").forEach(btn=>btn.addEventListener("click",()=>open(btn.dataset.studio)));
  exit.addEventListener("click",()=>{modal.close();close();});
  modal.addEventListener("close",close);
  modal.addEventListener("click",e=>{if(e.target===modal)modal.close();});
})();
