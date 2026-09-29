import { ChiptuneJsPlayer } from "/vendor/chiptune3/chiptune3.js";

let webamp=null;
let container=null;
let taskbarButton=null;
let tracker=null;
let trackerReady=false;
let currentIndex=-1;
let loadedIndex=-1;
let paused=false;
let silentUrl="";
let unsubscribeStore=null;

function clean(name){
  return name.replace(/_Music\.(it|mod|xm|s3m)$/i,"").replace(/_/g," ");
}

function makeSilentWav(seconds=900,rate=8000){
  const samples=seconds*rate;
  const bytes=new Uint8Array(44+samples);
  const v=new DataView(bytes.buffer);
  const put=(o,t)=>{for(let i=0;i<t.length;i++)bytes[o+i]=t.charCodeAt(i)};
  put(0,"RIFF");v.setUint32(4,36+samples,true);put(8,"WAVE");put(12,"fmt ");
  v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
  v.setUint32(24,rate,true);v.setUint32(28,rate,true);v.setUint16(32,1,true);v.setUint16(34,8,true);
  put(36,"data");v.setUint32(40,samples,true);bytes.fill(128,44);
  return URL.createObjectURL(new Blob([bytes],{type:"audio/wav"}));
}

function nextZ(){
  if(window.$Window && typeof window.$Window.Z_INDEX==="number"){
    const z=window.$Window.Z_INDEX;
    window.$Window.Z_INDEX=z+1;
    return z;
  }
  return 999;
}

function taskbarArea(){
  return document.querySelector(".taskbar-app-area");
}

function setTaskbarActive(active){
  taskbarButton?.classList.toggle("selected",!!active);
}

function makeTaskbarButton(){
  if(taskbarButton?.isConnected)return;
  const area=taskbarArea();
  if(!area)return;
  taskbarButton=document.createElement("button");
  taskbarButton.className="toggle selected taskbar-button";
  taskbarButton.id="m442-winamp-taskbar";
  taskbarButton.title="Winamp";
  const source=[...document.querySelectorAll(".desktop .explorer-icon")].find(el=>
    (el.querySelector(".icon-label")?.textContent||"").trim().toLowerCase()==="winamp"
  );
  const src=source?.querySelector("img")?.src||"";
  taskbarButton.innerHTML='<span class="taskbar-button-content">'+(src?'<img src="'+src+'" alt="">':"")+'<span class="taskbar-button-text">Winamp</span></span>';
  taskbarButton.addEventListener("mousedown",e=>e.preventDefault());
  taskbarButton.addEventListener("click",()=>{
    const el=document.getElementById("webamp");
    if(!el)return launchWinamp();
    const hidden=el.style.display==="none"||el.style.visibility==="hidden";
    if(hidden){
      el.style.display="block";
      el.style.visibility="visible";
      if(container)container.style.zIndex=String((window.$Window?.Z_INDEX||100)+1);
      setTaskbarActive(true);
    }else{
      el.style.display="none";
      el.style.visibility="hidden";
      setTaskbarActive(false);
    }
  });
  area.append(taskbarButton);
}

async function ensureTracker(names){
  if(tracker)return tracker;
  tracker=new ChiptuneJsPlayer({repeatCount:0});
  tracker.onInitialized(()=>{
    trackerReady=true;
    syncFromWebamp(names);
  });
  tracker.onEnded(()=>{
    container?.querySelector("#next")?.click();
  });
  tracker.onError(err=>console.error("Winamp tracker playback error",err));
  return tracker;
}

async function loadIndex(names,index){
  currentIndex=index;
  if(!trackerReady||index<0||index>=names.length)return;
  if(loadedIndex===index){
    if(paused){tracker.unpause();paused=false}
    return;
  }
  tracker.stop();
  loadedIndex=index;
  paused=false;
  await tracker.context.resume().catch(()=>{});
  tracker.load("/music/deus-ex/"+encodeURIComponent(names[index]));
}

function syncFromWebamp(names){
  if(!webamp?.store||!trackerReady)return;
  const state=webamp.store.getState();
  const mediaStatus=state?.media?.status||"";
  const volume=Number(state?.media?.volume);

  if(Number.isFinite(volume)){
    tracker.setVol(Math.max(0,Math.min(1,volume/100)));
  }

  if(mediaStatus==="PLAYING"){
    loadIndex(names,currentIndex<0?0:currentIndex);
  }else if(mediaStatus==="PAUSED"){
    tracker.pause();
    paused=true;
  }else if(mediaStatus==="STOPPED"){
    tracker.stop();
    loadedIndex=-1;
    paused=false;
  }
}

function cleanup(){
  try{unsubscribeStore?.()}catch{}
  unsubscribeStore=null;
  try{tracker?.stop()}catch{}
  tracker=null;
  trackerReady=false;
  currentIndex=-1;
  loadedIndex=-1;
  paused=false;
  try{webamp?.dispose?.()}catch{}
  webamp=null;
  container?.remove();
  container=null;
  taskbarButton?.remove();
  taskbarButton=null;
  if(silentUrl){URL.revokeObjectURL(silentUrl);silentUrl=""}
  delete window.__m442Winamp;
}

export async function launchWinamp(){
  if(webamp){
    const el=document.getElementById("webamp");
    if(el){el.style.display="block";el.style.visibility="visible"}
    if(container)container.style.zIndex=String(nextZ());
    setTaskbarActive(true);
    return webamp;
  }

  const [{default:Webamp},manifest,skinCatalog]=await Promise.all([
    import("https://unpkg.com/webamp@^2?module"),
    fetch("/music/deus-ex/manifest.json",{cache:"no-store"}).then(r=>r.json()),
    fetch("/winamp-skins/skins.json",{cache:"no-store"}).then(r=>r.json())
  ]);

  const names=manifest.tracks||[];
  silentUrl=makeSilentWav();
  const initialTracks=names.map((name,index)=>({
    metaData:{artist:"Deus Ex",title:clean(name)},
    url:silentUrl+"#m442="+index,
    duration:900
  }));

  container=document.createElement("div");
  container.id="m442-direct-webamp";
  container.style.position="absolute";
  container.style.left="45px";
  container.style.top="45px";
  container.style.zIndex=String(nextZ());
  container.style.pointerEvents="none";
  const screen=document.getElementById("screen")||document.body;
  screen.append(container);
  container.addEventListener("mousedown",()=>{
    container.style.zIndex=String(nextZ());
  },true);

  const remembered=localStorage.getItem("miracle442-winamp-skin");
  webamp=new Webamp({
    initialTracks,
    initialSkin:remembered?{url:remembered}:undefined,
    availableSkins:(skinCatalog||[]).map(([name,url])=>({name,url})),
    enableHotkeys:true,
    zIndex:1000,
    windowLayout:{
      main:{position:{top:0,left:0},closed:false},
      equalizer:{position:{top:116,left:0},closed:false},
      playlist:{position:{top:0,left:275},size:{extraHeight:4,extraWidth:3},closed:false}
    }
  });

  webamp.onTrackDidChange(track=>{
    const m=(track?.url||"").match(/#m442=(\d+)/);
    if(m){
      currentIndex=Number(m[1]);
      if(webamp.store?.getState()?.media?.status==="PLAYING")loadIndex(names,currentIndex);
    }
  });

  webamp.onMinimize(()=>{
    const el=document.getElementById("webamp");
    if(el){el.style.display="none";el.style.visibility="hidden"}
    setTaskbarActive(false);
  });

  webamp.onClose(cleanup);

  await webamp.renderWhenReady(container);
  const webampEl=document.getElementById("webamp");
  if(webampEl)webampEl.style.pointerEvents="auto";
  makeTaskbarButton();

  await ensureTracker(names);
  unsubscribeStore=webamp.store?.subscribe(()=>syncFromWebamp(names))||null;
  syncFromWebamp(names);

  window.__m442Winamp={
    get webamp(){return webamp},
    setSkin:setWinampSkin,
    close:cleanup
  };
  return webamp;
}

export async function setWinampSkin(url){
  if(!url)return;
  localStorage.setItem("miracle442-winamp-skin",url);
  const instance=await launchWinamp();
  instance.setSkinFromUrl(url);
}
