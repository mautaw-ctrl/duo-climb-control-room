(function(){
  let done=false;
  const deadline=setTimeout(()=>{
    if(done)return;
    const e=document.getElementById("error");
    if(e){e.hidden=false;document.getElementById("error-message").textContent="3D modules did not start within 20 seconds. Reload to retry.";}
    const loading=document.getElementById("loading");if(loading)loading.hidden=true;
  },20000);
  function check(){
    if(window.__HULLET_MODELFRONT_READY||window.__HULLET_THUNDERFURY_READY){done=true;clearTimeout(deadline);}
    else if(!done)setTimeout(check,300);
  }
  check();
  window.addEventListener("error",event=>{
    if(done)return;
    if(event.target?.tagName==="SCRIPT"||/module|import/i.test(event.message||"")){
      document.getElementById("loading").hidden=true;
      const error=document.getElementById("error");error.hidden=false;
      document.getElementById("error-message").textContent="Failed to load a required graphics module.";
      done=true;clearTimeout(deadline);
    }
  },true);
})();
