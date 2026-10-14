(function(){
  "use strict";
  // Both models were supplied by the site owner. Their original glTF metadata
  // identifies their Sketchfab IDs, creator and respective CC licences.
  // Creator-hosted embeds avoid copying a 22.9 MB model into every page load.
  const MODELS={
    chole:{
      id:"a4fcd5f9a8b34a9883bda4198d63801a",
      title:"Chole Bhature",number:"001",
      description:"Et nærmest skulpturelt indisk måltid: krydrede kikærter, luftigt bhature og alle de små detaljer, der gør mad værd at kigge nærmere på.",
      source:"https://sketchfab.com/3d-models/chole-bhature-a4fcd5f9a8b34a9883bda4198d63801a",
      author:"seirogan",authorUrl:"https://sketchfab.com/seirogan",
      license:"CC BY-NC-SA 4.0",licenseUrl:"https://creativecommons.org/licenses/by-nc-sa/4.0/"
    },
    whopper:{
      id:"3d8fa6fd454041f3ab113cb5a6cc1550",
      title:"Steak Sauce Whopper",number:"002",
      description:"Et andet stykke spiselig 3D: en steak sauce burger set som en lille verden af teksturer, lag og geometri.",
      source:"https://sketchfab.com/3d-models/steak-sauce-whopper-3d8fa6fd454041f3ab113cb5a6cc1550",
      author:"seirogan",authorUrl:"https://sketchfab.com/seirogan",
      license:"CC BY 4.0",licenseUrl:"https://creativecommons.org/licenses/by/4.0/"
    }
  };
  const names=Object.keys(MODELS);
  const $=id=>document.getElementById(id);
  const iframe=$("model-viewer"),loading=$("viewer-loading");
  let active="chole",generation=0,deadline=0;
  const embed=model=>"https://sketchfab.com/models/"+model.id+"/embed?autostart=1&autospin=0.15&ui_theme=dark";
  function updateAttribution(model){
    const el=$("attribution");
    el.replaceChildren(
      document.createTextNode(model.title+" af "),
      createLink(model.author,model.authorUrl),
      document.createTextNode(", "),
      createLink(model.license,model.licenseUrl),
      document.createTextNode(". Modellen vises fra Sketchfab.")
    );
  }
  function createLink(text,url){
    const a=document.createElement("a");a.textContent=text;a.href=url;
    a.target="_blank";a.rel="noopener noreferrer";return a;
  }
  function finishLoad(){
    clearTimeout(deadline);deadline=0;loading.hidden=true;
  }
  function update(key){
    if(!Object.hasOwn(MODELS,key))return;
    const model=MODELS[key];
    active=key;generation++;
    document.body.dataset.scene=key;
    $("model-select").value=key;
    $("object-title").replaceChildren(
      document.createTextNode(key==="chole"?"Chole":"Steak Sauce"),
      document.createElement("br"),
      document.createTextNode(key==="chole"?"Bhature":"Whopper"),
      Object.assign(document.createElement("span"),{textContent:"."})
    );
    $("object-description").textContent=model.description;
    $("object-counter").textContent=names.indexOf(key)+1===1?"01 / 02":"02 / 02";
    $("viewer-number").textContent="OBJECT / "+model.number;
    $("original-model").href=model.source;
    $("source-author").textContent="3D MODEL / "+model.author.toUpperCase();
    $("license-label").textContent=model.license;
    iframe.title=model.title+" 3D-model af "+model.author+" på Sketchfab";
    updateAttribution(model);
    // Avoid a blank/infinitely spinning full-screen loader if Sketchfab is slow
    // or a content blocker prevents its iframe from loading.
    loading.hidden=false;
    clearTimeout(deadline);
    const token=generation;
    deadline=setTimeout(()=>{
      if(token!==generation)return;
      finishLoad();
      const small=document.createElement("small");
      small.textContent="Sketchfab kan stadig indlæse. Åbn ORIGINAL MODEL, hvis visningen blokeres.";
      small.className="late-note";
      $("viewer-caption").replaceChildren(small);
    },13000);
    iframe.src=embed(model);
  }
  iframe.addEventListener("load",()=>{
    finishLoad();
    if(!$("viewer-caption").querySelector(".late-note")){
      $("viewer-caption").replaceChildren(
        Object.assign(document.createElement("span"),{textContent:"TRÆK FOR AT ROTERE"}),
        Object.assign(document.createElement("span"),{textContent:"SCROLL / KNIB FOR ZOOM"})
      );
    }
  });
  function step(direction){
    const index=names.indexOf(active);
    update(names[(index+direction+names.length)%names.length]);
  }
  $("model-select").addEventListener("change",event=>update(event.target.value));
  $("previous").addEventListener("click",()=>step(-1));
  $("next").addEventListener("click",()=>step(1));
  $("fullscreen").addEventListener("click",async()=>{
    try{
      if(document.fullscreenElement){await document.exitFullscreen();return;}
      await iframe.requestFullscreen();
    }catch(error){
      // Some browsers block cross-origin iframe fullscreen.
      $("fullscreen").textContent="ÅBN ORIGINAL MODEL ↗";
      $("fullscreen").onclick=()=>window.open(MODELS[active].source,"_blank","noopener,noreferrer");
    }
  });
  document.addEventListener("keydown",event=>{
    if(event.altKey||event.ctrlKey||event.metaKey||
      /^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(event.target?.tagName||""))return;
    if(event.key==="ArrowRight")step(1);
    else if(event.key==="ArrowLeft")step(-1);
  });
  window.__FLADBROED_STATE=()=>({active,modelId:MODELS[active].id,source:MODELS[active].source});
  window.addEventListener("pagehide",()=>clearTimeout(deadline));
  // Static HTML already points at Chole Bhature; keep its default iframe src,
  // avoiding a needless double load when this script starts.
  $("model-select").value="chole";
  iframe.title="Chole Bhature interaktiv 3D-model af seirogan på Sketchfab";
  deadline=setTimeout(finishLoad,13000);
})();