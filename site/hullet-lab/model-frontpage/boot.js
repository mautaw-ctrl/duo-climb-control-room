(function(){
  let done=false;
  const check=()=>{
    if(done)return;
    const fallback=document.getElementById("jesus-fallback");
    const loading=document.getElementById("loading");
    if(window.__HULLET_JESUS_READY||window.__HULLET_MODELFRONT_READY||
       window.__HULLET_THUNDERFURY_READY||(loading?.hidden && fallback)){
      done=true;clearTimeout(deadline);return;
    }
    setTimeout(check,300);
  };
  const deadline=setTimeout(()=>{
    if(done)return;
    const error=document.getElementById("error");
    if(error){error.hidden=false;
      document.getElementById("error-message").textContent=
        "3D modules could not initialize. Enable WebGL or refresh this page.";}
    const loading=document.getElementById("loading");
    if(loading)loading.hidden=true;
    done=true;
  },20000);
  check();
  window.addEventListener("error",event=>{
    if(done)return;
    if(event.target?.tagName==="SCRIPT"||/module|import/i.test(event.message||"")){
      const loading=document.getElementById("loading");if(loading)loading.hidden=true;
      const error=document.getElementById("error");if(error)error.hidden=false;
      const message=document.getElementById("error-message");
      if(message)message.textContent="A graphics module couldn't load. Please refresh.";
      done=true;clearTimeout(deadline);
    }
  },true);
})();
