(() => {
  if (window.__m442Sound) return;

  const api = {
    ready: false,
    enabled: true,
    launch() {},
    select() {},
    error() {},
    setEnabled(v) { this.enabled = !!v; }
  };
  window.__m442Sound = api;

  function wav(freq=660, ms=55, volume=0.22) {
    const rate=22050;
    const count=Math.max(1,Math.floor(rate*ms/1000));
    const bytes=new Uint8Array(44+count*2);
    const view=new DataView(bytes.buffer);
    const str=(o,s)=>{for(let i=0;i<s.length;i++)bytes[o+i]=s.charCodeAt(i)};
    str(0,"RIFF"); view.setUint32(4,36+count*2,true); str(8,"WAVE");
    str(12,"fmt "); view.setUint32(16,16,true); view.setUint16(20,1,true);
    view.setUint16(22,1,true); view.setUint32(24,rate,true);
    view.setUint32(28,rate*2,true); view.setUint16(32,2,true); view.setUint16(34,16,true);
    str(36,"data"); view.setUint32(40,count*2,true);
    for(let i=0;i<count;i++){
      const env=Math.min(1,i/(rate*.005))*Math.max(0,1-i/count);
      const sample=Math.sin((Math.PI*2*freq*i)/rate)*32767*volume*env;
      view.setInt16(44+i*2,sample,true);
    }
    return URL.createObjectURL(new Blob([bytes],{type:"audio/wav"}));
  }

  const script=document.createElement("script");
  script.src="/vendor/howler/howler.core.min.js";
  script.onload=()=>{
    try{
      const launchUrl=wav(720,48,.18);
      const selectUrl=wav(980,35,.14);
      const errorUrl=wav(180,85,.18);

      const launch=new Howl({src:[launchUrl],volume:.75});
      const select=new Howl({src:[selectUrl],volume:.65});
      const error=new Howl({src:[errorUrl],volume:.8});

      api.launch=()=>{if(api.enabled) launch.play()};
      api.select=()=>{if(api.enabled) select.play()};
      api.error=()=>{if(api.enabled) error.play()};
      api.ready=true;

      window.addEventListener("beforeunload",()=>{
        URL.revokeObjectURL(launchUrl);URL.revokeObjectURL(selectUrl);URL.revokeObjectURL(errorUrl);
      },{once:true});
    }catch(err){
      console.warn("Miracle442 Howler audio init failed",err);
    }
  };
  script.onerror=()=>console.warn("Howler.js failed to load");
  document.head.append(script);
})();