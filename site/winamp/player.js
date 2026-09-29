import { ChiptuneJsPlayer } from "/vendor/chiptune3/chiptune3.js";

const statusEl=document.getElementById("status");
const clean=n=>n.replace(/_Music\.(it|mod|xm|s3m)$/i,"").replace(/_/g," ");

const [manifest,skinCatalog]=await Promise.all([
  fetch("/music/deus-ex/manifest.json",{cache:"no-store"}).then(r=>r.json()),
  fetch("/winamp-skins/skins.json",{cache:"no-store"}).then(r=>r.json())
]);

const names=manifest.tracks||[];
const skins=(skinCatalog||[]).map(([name,url])=>({name,url}));
const selectedSkin=localStorage.getItem("miracle442-winamp-skin");

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

const silentUrl=makeSilentWav();
const initialTracks=names.map((name,index)=>({
  metaData:{artist:"Deus Ex",title:clean(name)},
  url:silentUrl+"#m442="+index,
  duration:900
}));

const {default:Webamp}=await import("https://unpkg.com/webamp@^2?module");
const webamp=new Webamp({
  initialTracks,
  availableSkins:skins,
  initialSkin:selectedSkin?{url:selectedSkin}:undefined,
  enableHotkeys:true,
  windowLayout:{
    main:{position:{top:0,left:0},closed:false},
    equalizer:{position:{top:116,left:0},closed:false},
    playlist:{position:{top:0,left:275},size:{extraHeight:4,extraWidth:3},closed:false}
  }
});

let tracker=null;
let trackerReady=false;
let currentIndex=-1;
let loadedIndex=-1;
let paused=false;
let lastMediaStatus="";
let lastVolume=-1;

function trackIndex(track){
  const m=(track?.url||"").match(/#m442=(\d+)/);
  return m?Number(m[1]):-1;
}

async function ensureTracker(){
  if(tracker)return tracker;
  tracker=new ChiptuneJsPlayer({repeatCount:0});
  tracker.onInitialized(()=>{
    trackerReady=true;
    syncFromWebamp();
  });
  tracker.onEnded(()=>{
    if(typeof webamp.nextTrack==="function") webamp.nextTrack();
  });
  tracker.onError(err=>{
    console.error("Tracker playback error",err);
    statusEl.textContent="WINAMP // tracker playback error";
  });
  return tracker;
}

async function loadCurrent(){
  if(!trackerReady||currentIndex<0||currentIndex>=names.length)return;
  if(loadedIndex===currentIndex){
    if(paused){tracker.unpause();paused=false}
    return;
  }
  tracker.stop();
  loadedIndex=currentIndex;
  paused=false;
  await tracker.context.resume().catch(()=>{});
  tracker.load("/music/deus-ex/"+encodeURIComponent(names[currentIndex]));
  statusEl.textContent="WINAMP // "+String(currentIndex+1).padStart(2,"0")+" // "+clean(names[currentIndex]);
}

function syncFromWebamp(){
  if(!webamp?.store||!trackerReady)return;
  const state=webamp.store.getState();
  const mediaStatus=state?.media?.status||"";
  const volume=Number(state?.media?.volume);

  if(Number.isFinite(volume)&&volume!==lastVolume){
    lastVolume=volume;
    tracker.setVol(Math.max(0,Math.min(1,volume/100)));
  }

  if(mediaStatus!==lastMediaStatus){
    lastMediaStatus=mediaStatus;
    if(mediaStatus==="PLAYING") loadCurrent();
    else if(mediaStatus==="PAUSED"){tracker.pause();paused=true}
    else if(mediaStatus==="STOPPED"){tracker.stop();loadedIndex=-1;paused=false}
  }
}

webamp.onTrackDidChange(track=>{
  const index=trackIndex(track);
  if(index<0)return;
  currentIndex=index;
  const mediaStatus=webamp.store?.getState()?.media?.status;
  if(mediaStatus==="PLAYING") loadCurrent();
});

webamp.onClose(()=>{
  try{tracker?.stop()}catch{}
  parent.postMessage({type:"m442-winamp-closed"},"*");
});

webamp.onMinimize(()=>{
  parent.postMessage({type:"m442-winamp-minimized"},"*");
});

await webamp.renderWhenReady(document.getElementById("host"));
await ensureTracker();
webamp.store?.subscribe(syncFromWebamp);
syncFromWebamp();

window.addEventListener("storage",e=>{
  if(e.key==="miracle442-winamp-skin"&&e.newValue){
    webamp.setSkinFromUrl(e.newValue);
    statusEl.textContent="WINAMP // skin changed";
  }
});

window.addEventListener("message",e=>{
  if(e.data?.type==="m442-set-winamp-skin"&&e.data.url){
    webamp.setSkinFromUrl(e.data.url);
  }
});

statusEl.textContent="WINAMP // "+names.length+" Deus Ex tracks // "+skins.length+" skins // right-click > Options > Skins";
window.addEventListener("beforeunload",()=>{
  try{tracker?.stop()}catch{}
  URL.revokeObjectURL(silentUrl);
});