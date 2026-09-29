const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
let DATA=null,sessionTicker=null;
function log(msg,cls=""){const el=document.createElement("div");el.className=cls;el.textContent=`[${new Date().toLocaleTimeString("da-DK")}] ${msg}`;$("#log").prepend(el)}
function delta(a,b,reverse=false){const d=Number(a||0)-Number(b||0),good=reverse?d<=0:d>=0;return `<span class="${good?'deltaUp':'deltaDown'}">${d>=0?'+':''}${Math.round(d*100)/100}</span>`}
function rankText(r){return r?.tier==="UNRANKED"?"UNRANKED":`${r?.tier||"--"} ${r?.rank||""}`}
function playerCard(p,n){const r=p.rank,x=p.recent10;return `<div class="kicker">[ SUMMONER 0${n} ]</div><div class="rankname">${esc(p.riotId)}</div><div class="rankline"><div class="rank">${esc(rankText(r))}</div><div class="lp">${r.lp} LP</div></div><div class="metrics"><div class="metric"><b>${r.wins}-${r.losses}</b><span>SEASON W/L</span></div><div class="metric"><b>${r.winRate}%</b><span>SEASON WR</span></div><div class="metric"><b>${x.kda}</b><span>KDA</span></div><div class="metric"><b>${x.csMin}</b><span>CS/MIN</span></div><div class="metric"><b>${x.deathsPerGame}</b><span>DEATHS/G</span></div></div>`}
function renderGoals(){if(!DATA)return;[0,1].forEach(i=>{const p=DATA.players[i],g=p.goal;$("#goal"+(i+1)).innerHTML=`<div class="kicker">${esc(p.riotId)}</div><div style="margin-top:8px">CURRENT // ${esc(rankText(p.rank))} // ${p.rank.lp} LP</div><div>TARGET // ${esc($("#targetRank").value)}</div><div class="progress"><i data-w="${g.percent}"></i></div><div class="goaltext">${g.percent}% COMPLETE // ${g.remainingRP==null?'N/A':g.remainingRP+' RP remaining'}</div>`});requestAnimationFrame(()=>$$('.progress i').forEach(i=>i.style.width=i.dataset.w+'%'))}
function renderCoach(){if(!DATA)return;const d=DATA.duo,stop=Number($("#stopLosses").value||2),adv=[];adv.push(`<div class="note good">Session sample: ${d.sharedGames} shared games // ${d.wins}-${d.losses} // ${d.winRate}% WR</div>`);if(d.currentLossStreak>=stop)adv.push(`<div class="note bad">STOP SIGNAL: current loss streak is ${d.currentLossStreak}. Your rule says stop after ${stop}.</div>`);else adv.push(`<div class="note">Loss-streak threshold: ${d.currentLossStreak}/${stop}. No forced stop yet.</div>`);adv.push(`<div class="note">Session focus: ${esc($("#sessionFocus").value)}</div>`);adv.push(`<div class="note">Planned games: ${esc($("#plannedGames").value)} // break rule: ${esc($("#breakRule").value)}</div>`);$("#coachAdvice").innerHTML=adv.join("")}
function renderImprovement(){if(!DATA)return;const rows=[["WIN RATE","winRate",false],["KDA","kda",false],["CS/MIN","csMin",false],["DMG/MIN","damageMin",false],["VISION/MIN","visionMin",false],["DEATHS/G","deathsPerGame",true]];$("#improvement").innerHTML=DATA.players.map(p=>`<div class="rankcard"><div class="kicker">${esc(p.riotId)} // LAST 10 vs PREVIOUS 10</div><table><thead><tr><th>METRIC</th><th>LAST 10</th><th>PREV 10</th><th>DELTA</th></tr></thead><tbody>${rows.map(([label,key,rev])=>`<tr><td>${label}</td><td>${p.recent10[key]}</td><td>${p.previous10[key]}</td><td>${delta(p.recent10[key],p.previous10[key],rev)}</td></tr>`).join('')}</tbody></table></div>`).join('')}
function renderFun(){if(!DATA)return;const a=DATA.players[0].recent10,b=DATA.players[1].recent10,d=DATA.duo,vals=[["DUO WR",d.winRate+"%"],["DAVY CS/M",a.csMin],["SARAH KDA",b.kda],["DAVY DMG/M",a.damageMin],["SARAH VISION/M",b.visionMin],["LOSS STREAK",d.currentLossStreak]];$("#funstats").innerHTML=vals.map(v=>`<div class="fun"><b>${v[1]}</b><span>${v[0]}</span></div>`).join('')}
function renderPairs(){$("#pairs").innerHTML=(DATA.duo.pairs||[]).map(p=>`<tr><td>${esc(p.pair)}</td><td>${p.games}</td><td>${p.wins}-${p.games-p.wins}</td><td>${p.winRate}%</td></tr>`).join('')||'<tr><td colspan="4">No shared champion pairs in current sample.</td></tr>'}
function renderDuo(){const d=DATA.duo;$("#duostats").innerHTML=[[d.sharedGames,"SHARED GAMES"],[d.wins,"WINS"],[d.losses,"LOSSES"],[d.winRate+"%","DUO WR"]].map(v=>`<div class="bigstat"><b>${v[0]}</b><span>${v[1]}</span></div>`).join('')}
function renderMatches(){const q=$("#matchSearch").value.toLowerCase(),f=$("#resultFilter").value,rows=(DATA?.duo?.recentMatches||[]).filter(m=>{const hit=(m.player1.champion+' '+m.player2.champion).toLowerCase().includes(q);return hit&&(f==='all'||(f==='win'&&m.win)||(f==='loss'&&!m.win))});$("#matches").innerHTML=rows.map((m,i)=>`<tr class="matchrow ${m.win?'win':'loss'}" data-i="${i}"><td>${new Date(m.date).toLocaleDateString('da-DK')}</td><td>${m.win?'WIN':'LOSS'}</td><td>${esc(m.player1.champion)} ${m.player1.kills}/${m.player1.deaths}/${m.player1.assists}</td><td>${esc(m.player2.champion)} ${m.player2.kills}/${m.player2.deaths}/${m.player2.assists}</td><td>${m.durationMin}m</td></tr><tr class="matchdetail" id="detail-${i}" style="display:none"><td colspan="5">MATCH ID // ${esc(m.id)} &nbsp; | &nbsp; Combined deaths: ${m.player1.deaths+m.player2.deaths} &nbsp; | &nbsp; Click row to collapse.</td></tr>`).join('')||'<tr><td colspan="5">No matching shared games.</td></tr>';$$('.matchrow').forEach(r=>r.onclick=()=>{const d=document.getElementById('detail-'+r.dataset.i);d.style.display=d.style.display==='none'?'table-row':'none'})}
function updateSession(){const s=JSON.parse(localStorage.getItem('m442_session')||'null');if(!s){$("#timer").textContent='00:00:00';$("#sessionRecord").textContent='0-0';$("#sessionGames").textContent='0';$("#sessionState").textContent='IDLE';return}const sec=Math.max(0,Math.floor((Date.now()-s.start)/1000)),h=String(Math.floor(sec/3600)).padStart(2,'0'),m=String(Math.floor(sec%3600/60)).padStart(2,'0'),x=String(sec%60).padStart(2,'0');$("#timer").textContent=`${h}:${m}:${x}`;$("#sessionState").textContent='ACTIVE';if(DATA){const w=Math.max(0,DATA.duo.wins-s.wins),l=Math.max(0,DATA.duo.losses-s.losses);$("#sessionRecord").textContent=`${w}-${l}`;$("#sessionGames").textContent=w+l}}
function savePrefs(){localStorage.setItem('m442_plan',JSON.stringify({planned:$("#plannedGames").value,stop:$("#stopLosses").value,breakRule:$("#breakRule").value,focus:$("#sessionFocus").value}));renderCoach();log('Session plan saved','ok')}
function loadPrefs(){try{const p=JSON.parse(localStorage.getItem('m442_plan')||'null');if(p){$("#plannedGames").value=p.planned||3;$("#stopLosses").value=p.stop||2;$("#breakRule").value=p.breakRule||$("#breakRule").value;$("#sessionFocus").value=p.focus||$("#sessionFocus").value}const g=JSON.parse(localStorage.getItem('m442_goal')||'null');if(g){$("#targetRank").value=g.rank||'GOLD IV';$("#targetDate").value=g.date||''}}catch{}}
async function load(){$("#apierror").style.display='none';$("#status").textContent='CONNECTING // Riot API';log('Requesting live duo data...');try{const r=await fetch('/api/duo',{cache:'no-store'}),j=await r.json().catch(()=>({}));if(r.status===401&&j.error==='AUTH_REQUIRED'){$("#login").style.display='flex';log('Private access required','warn');return}if(!r.ok)throw new Error(j.error||('HTTP '+r.status));DATA=j;$("#status").textContent=`ONLINE // refreshed ${new Date(j.generatedAt).toLocaleTimeString('da-DK')} // Riot API`;$("#p1").innerHTML=playerCard(j.players[0],1);$("#p2").innerHTML=playerCard(j.players[1],2);renderDuo();renderPairs();renderGoals();renderCoach();renderImprovement();renderFun();renderMatches();updateSession();log('Live rank + match data loaded','ok')}catch(e){$("#apierror").textContent='SYSTEM ERROR // '+e.message;$("#apierror").style.display='block';$("#status").textContent='ERROR // see message';log('API error: '+e.message,'bad')}}
$$('.collapseBtn').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();b.closest('.box').classList.toggle('collapsed')}));$$('.boxtitle').forEach(t=>t.addEventListener('dblclick',()=>t.closest('.box').classList.toggle('collapsed')));
$("#refresh").onclick=load;$("#matchSearch").oninput=renderMatches;$("#resultFilter").onchange=renderMatches;$("#savePlan").onclick=savePrefs;$("#saveGoal").onclick=()=>{localStorage.setItem('m442_goal',JSON.stringify({rank:$("#targetRank").value,date:$("#targetDate").value}));renderGoals();log('Goal settings saved','ok')};
$("#startSession").onclick=()=>{if(!DATA)return;localStorage.setItem('m442_session',JSON.stringify({start:Date.now(),wins:DATA.duo.wins,losses:DATA.duo.losses}));updateSession();log('Session started','ok')};$("#endSession").onclick=()=>{localStorage.removeItem('m442_session');updateSession();log('Session ended','warn')};sessionTicker=setInterval(updateSession,1000);
$("#loginBtn").onclick=async()=>{const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({passcode:$("#passcode").value})});if(r.ok){$("#login").style.display='none';load()}else $("#loginError").style.display='block'};$("#passcode").addEventListener('keydown',e=>{if(e.key==='Enter')$("#loginBtn").click()});
const player=$("#musicPlayer"),drag=$("#playerDrag"),restore=$("#musicRestore");
const trackInput=$("#trackFile"),trackLabel=$("#headampTrack"),trackState=$("#headampState");
let dragState=null,nativeAudio=new Audio(),modPlayer=null,modBuffer=null,currentKind=null,playlist=[],playlistIndex=-1;\nconst DEUS_ORDER=["Title_Music.it","Intro_Music.it","Training_Music.it","LibertyIsland_Music.it","UNATCO_Music.it","BatteryPark_Music.it","Tunnels_Music.it","NavalBase_Music.it","HongKong_Music.it","VersaLife_Music.it","MJ12_Music.it","ParisChateau_Music.it","Quotes_Music.it","Endgame1_Music.it","Endgame2_Music.it","Endgame3_Music.it"];

nativeAudio.preload="metadata";
nativeAudio.addEventListener("play",()=>trackState.textContent="PLAYING");
nativeAudio.addEventListener("pause",()=>trackState.textContent=nativeAudio.currentTime>0?"PAUSED":"READY");
nativeAudio.addEventListener("ended",()=>{if(playlist.length>1)loadPlaylistTrack(playlistIndex+1,true);else trackState.textContent="ENDED"});

function ensureModPlayer(){
  if(modPlayer)return modPlayer;
  if(typeof ChiptuneJsPlayer==="undefined"||typeof ChiptuneJsConfig==="undefined"){
    throw new Error("Tracker engine did not load");
  }
  modPlayer=new ChiptuneJsPlayer(new ChiptuneJsConfig(-1));
  if(modPlayer.onEnded)modPlayer.onEnded(()=>{if(playlist.length>1)loadPlaylistTrack(playlistIndex+1,true);else trackState.textContent="ENDED"});
  if(modPlayer.onError)modPlayer.onError(()=>trackState.textContent="MOD ERROR");
  return modPlayer;
}
function isTracker(name){return /\.(mod|xm|s3m|it)$/i.test(name||"")}
function playCurrent(){
  try{
    if(currentKind==="tracker"){
      const p=ensureModPlayer();
      if(modBuffer){p.play(modBuffer);trackState.textContent="PLAYING";}
    }else if(currentKind==="native"){
      nativeAudio.play().catch(()=>trackState.textContent="CLICK PLAY AGAIN");
    }else{
      trackInput.click();
    }
  }catch(e){trackState.textContent="ERROR";log("HeadAMP: "+e.message,"bad")}
}
function stopCurrent(){
  if(currentKind==="tracker"&&modPlayer){modPlayer.stop();trackState.textContent="STOPPED"}
  if(currentKind==="native"){nativeAudio.pause();nativeAudio.currentTime=0;trackState.textContent="STOPPED"}
}
function pauseCurrent(){
  if(currentKind==="tracker"&&modPlayer){modPlayer.togglePause();trackState.textContent="PAUSED"}
  if(currentKind==="native"){
    if(nativeAudio.paused)nativeAudio.play().catch(()=>{});else nativeAudio.pause();
  }
}
function loadPlaylistTrack(index,autoplay=true){
  if(!playlist.length)return;
  playlistIndex=(index+playlist.length)%playlist.length;
  const file=playlist[playlistIndex];
  stopCurrent();
  trackLabel.textContent=`${String(playlistIndex+1).padStart(2,"0")}/${String(playlist.length).padStart(2,"0")} // ${file.name.toUpperCase()}`;
  if(isTracker(file.name)){
    currentKind="tracker";trackState.textContent="LOADING MOD";
    try{
      const p=ensureModPlayer();
      p.load(file,buffer=>{modBuffer=buffer;if(autoplay)p.play(buffer);trackState.textContent=autoplay?"PLAYING":"READY";log("HeadAMP tracker loaded: "+file.name,"ok")});
    }catch(e){trackState.textContent="MOD ERROR";log("HeadAMP: "+e.message,"bad")}
  }else{
    currentKind="native";modBuffer=null;
    if(nativeAudio.src?.startsWith("blob:"))URL.revokeObjectURL(nativeAudio.src);
    nativeAudio.src=URL.createObjectURL(file);
    nativeAudio.load();
    if(autoplay)nativeAudio.play().then(()=>log("HeadAMP audio loaded: "+file.name,"ok")).catch(()=>trackState.textContent="PRESS PLAY");
    else trackState.textContent="READY";
  }
}
function sortDeusFiles(files){
  const pos=new Map(DEUS_ORDER.map((n,i)=>[n.toLowerCase(),i]));
  return [...files].sort((a,b)=>(pos.get(a.name.toLowerCase())??999)-(pos.get(b.name.toLowerCase())??999)||a.name.localeCompare(b.name));
}
function soundtrackDb(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open("m442_headamp",1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains("tracks"))req.result.createObjectStore("tracks",{keyPath:"name"})};
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
}
async function rememberPlaylist(files){
  try{
    const db=await soundtrackDb(),tx=db.transaction("tracks","readwrite"),store=tx.objectStore("tracks");
    store.clear();
    for(const file of files)store.put({name:file.name,type:file.type,lastModified:file.lastModified,blob:file});
    await new Promise((res,rej)=>{tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});
    localStorage.setItem("m442_soundtrack_saved","1");
    log(`HeadAMP soundtrack cached locally: ${files.length} tracks`,"ok");
  }catch(e){log("Could not cache soundtrack: "+e.message,"warn")}
}
async function tryHostedPlaylist(){
  try{
    const mr=await fetch("/music/deus-ex/manifest.json",{cache:"no-store"});
    if(!mr.ok)return false;
    const manifest=await mr.json();
    const names=Array.isArray(manifest)?manifest:manifest.tracks;
    if(!Array.isArray(names)||!names.length)return false;
    const test=await fetch("/music/deus-ex/"+encodeURIComponent(names[0]),{method:"HEAD",cache:"no-store"});
    if(!test.ok)return false;
    trackState.textContent="LOADING HOSTED SOUNDTRACK";
    const files=[];
    for(const name of names){
      const r=await fetch("/music/deus-ex/"+encodeURIComponent(name),{cache:"force-cache"});
      if(!r.ok)throw new Error("Missing hosted track: "+name);
      const blob=await r.blob();
      files.push(new File([blob],name,{type:blob.type||"application/octet-stream"}));
    }
    playlist=sortDeusFiles(files);
    playlistIndex=0;
    trackLabel.textContent=`DEUS EX SOUNDTRACK // ${playlist.length} HOSTED TRACKS`;
    trackState.textContent="READY";
    log(`HeadAMP loaded ${playlist.length} hosted Deus Ex tracks`,"ok");
    return true;
  }catch(e){
    log("Hosted soundtrack unavailable: "+e.message,"warn");
    return false;
  }
}

async function restorePlaylist(){
  if(localStorage.getItem("m442_soundtrack_saved")!=="1")return false;
  try{
    const db=await soundtrackDb(),tx=db.transaction("tracks","readonly"),req=tx.objectStore("tracks").getAll();
    const rows=await new Promise((res,rej)=>{req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error)});
    if(!rows.length)return false;
    playlist=sortDeusFiles(rows.map(r=>new File([r.blob],r.name,{type:r.type||"",lastModified:r.lastModified||Date.now()})));
    playlistIndex=0;
    trackLabel.textContent=`DEUS EX SOUNDTRACK // ${playlist.length} TRACKS CACHED`;
    trackState.textContent="READY";
    log(`HeadAMP restored ${playlist.length}-track Deus Ex soundtrack`,"ok");
    return true;
  }catch(e){log("Could not restore cached soundtrack: "+e.message,"warn");return false}
}
trackInput.addEventListener("change",async()=>{
  playlist=sortDeusFiles([...(trackInput.files||[])]);
  if(!playlist.length)return;
  playlistIndex=0;
  await rememberPlaylist(playlist);
  loadPlaylistTrack(0,true);
  log(`HeadAMP playlist loaded: ${playlist.length} track(s)`,"ok");
});
$("#headLoad").onclick=e=>{e.stopPropagation();trackInput.click()};
$("#headPlay").onclick=e=>{e.stopPropagation();playCurrent()};
$("#headPause").onclick=e=>{e.stopPropagation();pauseCurrent()};
$("#headStop").onclick=e=>{e.stopPropagation();stopCurrent()};
$("#headPrev").onclick=e=>{e.stopPropagation();if(playlist.length)loadPlaylistTrack(playlistIndex-1,true)};
$("#headNext").onclick=e=>{e.stopPropagation();if(playlist.length)loadPlaylistTrack(playlistIndex+1,true)};

function savePlayer(){localStorage.setItem("m442_player",JSON.stringify({left:player.style.left,top:player.style.top,hidden:player.classList.contains("hiddenPlayer")}))}
function loadPlayer(){try{const p=JSON.parse(localStorage.getItem("m442_player")||"null");if(!p)return;if(p.left)player.style.left=p.left;if(p.top)player.style.top=p.top;if(p.hidden){player.classList.add("hiddenPlayer");restore.classList.add("show")}}catch{}}
drag.addEventListener("pointerdown",e=>{if(e.target.closest(".headampHit"))return;drag.setPointerCapture(e.pointerId);const r=player.getBoundingClientRect();dragState={dx:e.clientX-r.left,dy:e.clientY-r.top}});
drag.addEventListener("pointermove",e=>{if(!dragState)return;const maxX=innerWidth-player.offsetWidth,maxY=innerHeight-70;player.style.left=Math.max(0,Math.min(maxX,e.clientX-dragState.dx))+"px";player.style.top=Math.max(0,Math.min(maxY,e.clientY-dragState.dy))+"px"});
drag.addEventListener("pointerup",()=>{dragState=null;savePlayer()});
$("#playerHide").onclick=e=>{e.stopPropagation();player.classList.add("hiddenPlayer");restore.classList.add("show");savePlayer()};
restore.onclick=()=>{player.classList.remove("hiddenPlayer");restore.classList.remove("show");savePlayer()};
$("#playerMin").onclick=e=>{e.stopPropagation();player.classList.toggle("headampMini");savePlayer()};
loadPrefs();loadPlayer();
(async()=>{if(!(await tryHostedPlaylist()))await restorePlaylist()})();
log('Miracle442 control room booted','ok');load();updateSession();