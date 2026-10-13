const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
let DATA=null,sessionTicker=null,activeRun=0,mainHistory=null,comparisonResults=new Map(),runController=null,loadedIds=null;
function log(msg,cls=""){const el=document.createElement("div");el.className=cls;el.textContent=`[${new Date().toLocaleTimeString("da-DK")}] ${msg}`;$("#log").prepend(el)}
function delta(a,b,reverse=false){const d=Number(a||0)-Number(b||0),good=reverse?d<=0:d>=0;return `<span class="${good?'deltaUp':'deltaDown'}">${d>=0?'+':''}${Math.round(d*100)/100}</span>`}
function rankText(r){return r?.tier==="UNRANKED"?"UNRANKED":`${r?.tier||"--"} ${r?.rank||""}`}
function playerCard(p,n){const r=p.rank,x=p.selectedStats||p.recent10;return `<div class="kicker">[ SUMMONER 0${n} ]</div><div class="rankname">${esc(p.riotId)}</div><div class="rankline"><div class="rank">${esc(rankText(r))}</div><div class="lp">${r.lp} LP</div></div><div class="metrics"><div class="metric"><b>${r.wins}-${r.losses}</b><span>SEASON W/L</span></div><div class="metric"><b>${r.winRate}%</b><span>SEASON WR</span></div><div class="metric"><b>${x.kda}</b><span>KDA</span></div><div class="metric"><b>${x.csMin}</b><span>CS/MIN</span></div><div class="metric"><b>${x.deathsPerGame}</b><span>DEATHS/G</span></div></div>`}
function selectedGoal(rank){
  if(!rank||rank.tier==='UNRANKED')return {percent:0,remainingRP:null};
  const tiers=['IRON','BRONZE','SILVER','GOLD','PLATINUM','EMERALD','DIAMOND','MASTER','GRANDMASTER','CHALLENGER'];
  const divisions={IV:0,III:100,II:200,I:300};
  const points=(tier,division,lp=0)=>Math.min(tiers.indexOf(tier),7)*400+(tiers.indexOf(tier)>=7?0:divisions[division]||0)+lp;
  const [tier,division]=$('#targetRank').value.split(' '),goal=points(tier,division),current=points(rank.tier,rank.rank,rank.lp);
  return {percent:Math.max(0,Math.min(100,Math.round((current-800)/Math.max(goal-800,1)*100))),remainingRP:Math.max(0,goal-current)};
}
function renderGoals(){if(!DATA)return;[0,1].forEach(i=>{const p=DATA.players[i],g=selectedGoal(p.rank);$("#goal"+(i+1)).innerHTML=`<div class="kicker">${esc(p.riotId)}</div><div style="margin-top:8px">CURRENT // ${esc(rankText(p.rank))} // ${p.rank.lp} LP</div><div>TARGET // ${esc($("#targetRank").value)}</div><div class="progress"><i data-w="${g.percent}"></i></div><div class="goaltext">${g.percent}% COMPLETE // ${g.remainingRP==null?'N/A':g.remainingRP+' RP remaining'}</div>`});requestAnimationFrame(()=>$$('.progress i').forEach(i=>i.style.width=i.dataset.w+'%'))}
function renderCoach(){if(!DATA)return;const d=DATA.duo,stop=Number($("#stopLosses").value||2),adv=[];adv.push(`<div class="note good">Session sample: ${d.sharedGames} shared games // ${d.wins}-${d.losses} // ${d.winRate}% WR</div>`);if(d.currentLossStreak>=stop)adv.push(`<div class="note bad">STOP SIGNAL: current loss streak is ${d.currentLossStreak}. Your rule says stop after ${stop}.</div>`);else adv.push(`<div class="note">Loss-streak threshold: ${d.currentLossStreak}/${stop}. No forced stop yet.</div>`);adv.push(`<div class="note">Session focus: ${esc($("#sessionFocus").value)}</div>`);adv.push(`<div class="note">Planned games: ${esc($("#plannedGames").value)} // break rule: ${esc($("#breakRule").value)}</div>`);$("#coachAdvice").innerHTML=adv.join("")}
function renderImprovement(){if(!DATA)return;const rows=[["WIN RATE","winRate",false],["KDA","kda",false],["CS/MIN","csMin",false],["DMG/MIN","damageMin",false],["VISION/MIN","visionMin",false],["DEATHS/G","deathsPerGame",true]];$("#improvement").innerHTML=DATA.players.map(p=>`<div class="rankcard"><div class="kicker">${esc(p.riotId)} // SHARED GAMES: ${p.recent10.games} RECENT vs ${p.previous10.games} PREVIOUS</div><table><thead><tr><th>METRIC</th><th>LAST 10</th><th>PREV 10</th><th>DELTA</th></tr></thead><tbody>${rows.map(([label,key,rev])=>`<tr><td>${label}</td><td>${p.recent10[key]}</td><td>${p.previous10[key]}</td><td>${delta(p.recent10[key],p.previous10[key],rev)}</td></tr>`).join('')}</tbody></table></div>`).join('')}
function renderFun(){if(!DATA)return;const a=DATA.players[0].selectedStats||DATA.players[0].recent10,b=DATA.players[1].selectedStats||DATA.players[1].recent10,d=DATA.duo,vals=[["DUO WR",d.winRate+"%"],[DATA.players[0].gameName+" CS/M",a.csMin],[DATA.players[1].gameName+" KDA",b.kda],[DATA.players[0].gameName+" DMG/M",a.damageMin],[DATA.players[1].gameName+" VISION/M",b.visionMin],["LOSS STREAK",d.currentLossStreak]];$("#funstats").innerHTML=vals.map(v=>`<div class="fun"><b>${v[1]}</b><span>${esc(v[0])}</span></div>`).join('')}
function renderPairs(){$("#pairs").innerHTML=(DATA.duo.pairs||[]).map(p=>`<tr><td>${esc(p.pair)}</td><td>${p.games}</td><td>${p.wins}-${p.games-p.wins}</td><td>${p.winRate}%</td></tr>`).join('')||'<tr><td colspan="4">No shared champion pairs in current sample.</td></tr>'}
function renderDuo(){const d=DATA.duo;$("#duostats").innerHTML=[[d.sharedGames,"SHARED GAMES"],[d.wins,"WINS"],[d.losses,"LOSSES"],[d.winRate+"%","DUO WR"]].map(v=>`<div class="bigstat"><b>${v[0]}</b><span>${v[1]}</span></div>`).join('')}
function renderMatches(){const q=$("#matchSearch").value.toLowerCase(),f=$("#resultFilter").value,rows=(DATA?.duo?.recentMatches||[]).filter(m=>{const hit=(m.player1.champion+' '+m.player2.champion).toLowerCase().includes(q);return hit&&(f==='all'||(f==='win'&&m.win)||(f==='loss'&&!m.win))});$("#matches").innerHTML=rows.map((m,i)=>`<tr class="matchrow ${m.win?'win':'loss'}" data-i="${i}"><td>${new Date(m.date).toLocaleDateString('da-DK')}</td><td>${m.win?'WIN':'LOSS'}</td><td>${esc(m.player1.champion)} ${m.player1.kills}/${m.player1.deaths}/${m.player1.assists}</td><td>${esc(m.player2.champion)} ${m.player2.kills}/${m.player2.deaths}/${m.player2.assists}</td><td>${m.durationMin}m</td></tr><tr class="matchdetail" id="detail-${i}" style="display:none"><td colspan="5">MATCH ID // ${esc(m.id)} &nbsp; | &nbsp; Combined deaths: ${m.player1.deaths+m.player2.deaths} &nbsp; | &nbsp; Click row to collapse.</td></tr>`).join('')||'<tr><td colspan="5">No matching shared games.</td></tr>';$$('.matchrow').forEach(r=>r.onclick=()=>{const d=document.getElementById('detail-'+r.dataset.i);d.style.display=d.style.display==='none'?'table-row':'none'})}
function updateSession(){let s;try{s=JSON.parse(localStorage.getItem('m442_session')||'null')}catch{s=null}if(!s){$("#timer").textContent='00:00:00';$("#sessionRecord").textContent='0-0';$("#sessionGames").textContent='0';$("#sessionState").textContent='IDLE';return}const sec=Math.max(0,Math.floor((Date.now()-s.start)/1000)),h=String(Math.floor(sec/3600)).padStart(2,'0'),m=String(Math.floor(sec%3600/60)).padStart(2,'0'),x=String(sec%60).padStart(2,'0');$("#timer").textContent=`${h}:${m}:${x}`;$("#sessionState").textContent='ACTIVE';if(DATA){const ids=DATA.players.map(p=>p.riotId.toLowerCase());const matches=ids.join("|")===s.pair?(DATA.duo.recentMatches||[]).filter(m=>Date.parse(m.date)>=s.start):[];const w=matches.filter(m=>m.win).length,l=matches.length-w;$("#sessionRecord").textContent=`${w}-${l}`;$("#sessionGames").textContent=w+l}}
function savePrefs(){localStorage.setItem('m442_plan',JSON.stringify({planned:$("#plannedGames").value,stop:$("#stopLosses").value,breakRule:$("#breakRule").value,focus:$("#sessionFocus").value}));renderCoach();log('Session plan saved','ok')}
function loadPrefs(){try{const p=JSON.parse(localStorage.getItem('m442_plan')||'null');if(p){$("#plannedGames").value=p.planned||3;$("#stopLosses").value=p.stop||2;$("#breakRule").value=p.breakRule||$("#breakRule").value;$("#sessionFocus").value=p.focus||$("#sessionFocus").value}const g=JSON.parse(localStorage.getItem('m442_goal')||'null');if(g){$("#targetRank").value=g.rank||'GOLD IV';$("#targetDate").value=g.date||''}}catch{}}
function selectedIds(){return [$("#player1").value.trim(),$("#player2").value.trim()]}

function chosenSample(){return $("#sample").value}

function storedExtraIds(){
  try{const a=JSON.parse(localStorage.getItem("m442_extra_accounts")||"[]");return Array.isArray(a)?a.filter(x=>typeof x==="string").slice(0,8):[]}
  catch{return []}
}

function saveExtraIds(ids){localStorage.setItem("m442_extra_accounts",JSON.stringify(ids.slice(0,8)))}

function validRiotId(id){return /^.{3,16}#[^#\s\/?]{1,5}$/u.test(id)&&!/[\/?]/.test(id.split("#")[0])}

function winRateText(wins,games){return games?(Math.round(wins/games*1000)/10).toFixed(1)+"%":"0%"}

function calcPlayerStats(matches,key){
  const rows=matches.map(m=>m[key]).filter(Boolean),count=rows.length;
  const wins=matches.filter(m=>m.win).length;
  const avg=fn=>count?rows.reduce((s,p)=>s+fn(p),0)/count:0;
  return {games:count,wins,losses:count-wins,winRate:count?Math.round(wins/count*1000)/10:0,
    kda:Math.round(avg(p=>(p.kills+p.assists)/Math.max(p.deaths,1))*100)/100,
    csMin:Math.round(avg(p=>p.csMin||0)*100)/100,
    damageMin:Math.round(avg(p=>p.damageMin||0)),
    visionMin:Math.round(avg(p=>p.visionMin||0)*100)/100,
    deathsPerGame:Math.round(avg(p=>p.deaths)*100)/100}
}

function summarizeHistory(matches){
  const games=matches.length,wins=matches.filter(m=>m.win).length,pairs={};
  for(const m of matches){const pair=(m.player1?.champion||"?")+" + "+(m.player2?.champion||"?");const row=pairs[pair]||(pairs[pair]={pair,games:0,wins:0});row.games++;if(m.win)row.wins++}
  let currentLossStreak=0;for(const m of matches){if(m.win)break;currentLossStreak++}
  return {sharedGames:games,wins,losses:games-wins,winRate:games?Math.round(wins/games*1000)/10:0,
    currentLossStreak,pairs:Object.values(pairs).map(p=>({...p,winRate:Math.round(p.wins/p.games*100)})).sort((a,b)=>b.games-a.games||b.wins-a.wins),
    recentMatches:matches,sessionAdvice:"Ranked Solo/Duo shared matches only"}
}

function drawAll(){
  if(!DATA)return;
  $("#p1").innerHTML=playerCard(DATA.players[0],1);
  $("#p2").innerHTML=playerCard(DATA.players[1],2);
  $$('#matchTable th')[2].textContent=DATA.players[0].gameName;
  $$('#matchTable th')[3].textContent=DATA.players[1].gameName;
  renderDuo();renderPairs();renderGoals();renderCoach();renderImprovement();renderFun();renderMatches();updateSession()
}

function applyMainHistory(matches,meta){
  if(!DATA)return;
  DATA.duo=summarizeHistory(matches);
  DATA.players[0].selectedStats=calcPlayerStats(matches,"player1");
  DATA.players[1].selectedStats=calcPlayerStats(matches,"player2");
  DATA.players.forEach((p,i)=>{p.recent10=calcPlayerStats(matches.slice(0,10),'player'+(i+1));p.previous10=calcPlayerStats(matches.slice(10,20),'player'+(i+1));});
  mainHistory={matches:[...matches],meta};
  const atLimit=meta&&!meta.exhaustive&&meta.fetchedPerPlayer?.some(n=>n>=meta.scanLimit);
  const incomplete=atLimit?"; historical search capped at last "+meta.scanLimit+" ranked matches/account":"";
  $("#historyStatus").textContent=`RANKED SOLO/DUO ONLY // ${matches.length} confirmed same-team games // ${chosenSample()==="all"?"ALL AVAILABLE":("LAST "+chosenSample())}${incomplete}`;
  drawAll();renderAccounts()
}

async function historyRequest(query,run){
  const signal=runController.signal;
  for(let attempt=0;;attempt++){
    const response=await fetch("/api/duo-history?"+query,{cache:"no-store",signal});
    if(response.status!==429||attempt>=3)return response;
    const seconds=Math.min(180,Math.max(1,Number(response.headers.get("Retry-After"))||60));
    log(`Riot rate limit: waiting ${seconds}s before retrying this page`,"warn");
    $("#status").textContent=`WAITING // Riot rate limit · retry in ${seconds}s`;
    await new Promise((resolve,reject)=>{
      const abort=()=>{clearTimeout(timer);reject(new Error("CANCELLED"))};
      const timer=setTimeout(()=>{signal.removeEventListener("abort",abort);resolve()},seconds*1000);
      signal.addEventListener("abort",abort,{once:true});
      if(signal.aborted)abort();
    });
    if(run!==activeRun)throw new Error("CANCELLED");
  }
}

async function collectHistory(account,partner,sample,run,onProgress){
  const results=[],seen=new Set();let offset=0,meta=null;
  const maxGames=sample==="all"?Infinity:Number(sample);
  for(let round=0;round<100;round++){
    if(run!==activeRun)throw new Error("CANCELLED");
    const query=new URLSearchParams({player1:account,player2:partner,sample,offset:String(offset)});
    const r=await historyRequest(query,run);
    const j=await r.json().catch(()=>({}));
    if(run!==activeRun)throw new Error("CANCELLED");
    if(r.status===401&&j.error==="AUTH_REQUIRED"){$("#login").style.display="flex";throw new Error("Private access required")}
    if(!r.ok)throw new Error(j.error||("History HTTP "+r.status));
    if(!Array.isArray(j.matches))throw new Error("Riot history response is invalid");
    for(const m of j.matches)if(m?.id&&!seen.has(m.id)&&results.length<maxGames){seen.add(m.id);results.push(m)}
    meta=j;
    $("#status").textContent=`LOADING HISTORY // ${account} · ${results.length} shared games · ${j.nextOffset} ranked games scanned`;
    if(onProgress)onProgress(results,j);
    if(!j.hasMore||results.length>=maxGames)break;
    if(!Number.isSafeInteger(j.nextOffset)||j.nextOffset<=offset)throw new Error("Invalid Riot history pagination");
    offset=j.nextOffset;
  }
  return {matches:results,meta}
}

function renderAccounts(){
  const [main,partner]=loadedIds||selectedIds(),extra=storedExtraIds().filter(x=>x.toLowerCase()!==main.toLowerCase()&&x.toLowerCase()!==partner.toLowerCase());
  const names=[main,...extra],rows=[],all=[];
  for(const account of names){
    const item=account===main?mainHistory:comparisonResults.get(account.toLowerCase());
    const s=item&&!item.error?{games:item.matches.length,wins:item.matches.filter(m=>m.win).length}:null;
    if(s)all.push(...item.matches.map(m=>({id:m.id,win:m.win,account})));
    const count=s?s.games:(item?.error?"—":"…"),record=s?`${s.wins}–${s.games-s.wins}`:"…",rate=s?winRateText(s.wins,s.games):(item?.error?"ERROR":"Loading");
    const note=count;
    const remove=account===main?"":`<button class="remove-account" data-account="${esc(account)}" title="Remove this extra account">×</button>`;
    rows.push(`<tr><td>${esc(account)}${account===main?' <small>(MAIN)</small>':""}</td><td>${esc(partner)}</td><td>${note}</td><td>${record}</td><td>${rate}</td><td>${remove}</td></tr>`)
  }
  $("#extraRows").innerHTML=rows.join("");
  const unique=new Map(all.map(x=>[x.id,x]));const values=[...unique.values()],wins=values.filter(x=>x.win).length;
  $("#combinedGames").textContent=String(values.length);
  $("#combinedRecord").textContent=wins+"–"+(values.length-wins);
  $("#combinedRate").textContent=winRateText(wins,values.length);
  $$(".remove-account").forEach(b=>b.onclick=()=>{const id=b.dataset.account;saveExtraIds(storedExtraIds().filter(x=>x!==id));comparisonResults.delete(id.toLowerCase());renderAccounts();load()})
}

async function loadExtraAccounts(run){
  const [main,partner]=loadedIds||selectedIds(),sample=chosenSample();
  const extras=storedExtraIds().filter(x=>x.toLowerCase()!==main.toLowerCase()&&x.toLowerCase()!==partner.toLowerCase());
  for(let i=0;i<extras.length;i++){
    if(run!==activeRun)return;
    const account=extras[i];
    $("#extraStatus").textContent=`ACCOUNT ${i+1}/${extras.length}: Loading ${account} with ${partner}...`;
    try{
      const item=await collectHistory(account,partner,sample,run,(matches,meta)=>{comparisonResults.set(account.toLowerCase(),{matches:[...matches],meta});renderAccounts()});
      comparisonResults.set(account.toLowerCase(),item);renderAccounts()
    }catch(e){
      if(e.message==="CANCELLED")return;
      comparisonResults.set(account.toLowerCase(),{error:e.message});renderAccounts();
      $("#extraStatus").textContent=`Couldn't load ${account}: ${e.message}`;
      log(`Additional account ${account}: ${e.message}`,"warn");
      continue;
    }
  }
  if(run===activeRun){const errors=extras.filter(id=>comparisonResults.get(id.toLowerCase())?.error).length;$("#extraStatus").textContent=`${1+extras.length-errors} accounts compared with ${partner} // same-team Solo/Duo only${errors?" // "+errors+" failed (see log)":""}`}
}

async function load(){
  runController?.abort();runController=new AbortController();
  const run=++activeRun;loadedIds=selectedIds();DATA=null;mainHistory=null;comparisonResults=new Map();
  $("#apierror").style.display="none";$("#status").textContent="CONNECTING // Riot API";
  $("#historyStatus").textContent="Loading ranked Solo/Duo history...";
  $("#extraStatus").textContent="Waiting for primary account history...";
  try{
    renderAccounts();log("Requesting live account data...");
    for(const id of ['#p1','#p2'])$(id).textContent='Loading rank…';
    for(const id of ['#duostats','#pairs','#goal1','#goal2','#coachAdvice','#improvement','#funstats','#matches'])$(id).innerHTML='';
    const [a,b]=selectedIds();
    if(!validRiotId(a)||!validRiotId(b))throw new Error("Enter Riot IDs as Name#Tag, for example Davy442#EUW");
    if(a.toLowerCase()===b.toLowerCase())throw new Error("Choose two different Riot accounts");
    const query=new URLSearchParams({player1:a,player2:b,summary:"1"});
    const r=await fetch("/api/duo?"+query,{cache:"no-store",signal:runController.signal});
    const j=await r.json().catch(()=>({}));
    if(run!==activeRun)return;
    if(r.status===401&&j.error==="AUTH_REQUIRED"){$("#login").style.display="flex";log("Private access required","warn");return}
    if(!r.ok)throw new Error(j.error||("HTTP "+r.status));
    DATA=j;$("#status").textContent=`ONLINE // ${new Date(j.generatedAt).toLocaleTimeString("da-DK")} // Riot API`;
    drawAll();log("Ranks loaded; fetching expanded shared match sample...","ok");
    const result=await collectHistory(a,b,chosenSample(),run,(matches,meta)=>applyMainHistory(matches,meta));
    if(run!==activeRun)return;
    applyMainHistory(result.matches,result.meta);
    log(`${result.matches.length} ranked Solo/Duo matches loaded for current pair`,"ok");
    await loadExtraAccounts(run);
    if(run===activeRun)$("#status").textContent="ONLINE // selected Solo/Duo history loaded"
  }catch(e){
    if(run!==activeRun||e.message==="CANCELLED")return;
    $("#apierror").textContent="SYSTEM ERROR // "+e.message;$("#apierror").style.display="block";
    $("#status").textContent="ERROR // see message";log("API error: "+e.message,"bad");
    $("#historyStatus").textContent=(mainHistory?`PARTIAL // ${mainHistory.matches.length} shared games loaded. `:"")+"History could not be completed: "+e.message
  }
}
$$('.collapseBtn').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();b.closest('.box').classList.toggle('collapsed')}));$$('.boxtitle').forEach(t=>t.addEventListener('dblclick',()=>t.closest('.box').classList.toggle('collapsed')));
$("#refresh").onclick=load;$("#sample").onchange=load;["#player1","#player2","#extraRiotId"].forEach(id=>$(id).addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();if(id==="#extraRiotId")$("#addAccount").click();else load()}}));$("#matchSearch").oninput=renderMatches;$("#resultFilter").onchange=renderMatches;$("#savePlan").onclick=savePrefs;$("#targetRank").onchange=renderGoals;$("#saveGoal").onclick=()=>{localStorage.setItem('m442_goal',JSON.stringify({rank:$("#targetRank").value,date:$("#targetDate").value}));renderGoals();log('Goal settings saved','ok')};
$("#startSession").onclick=()=>{if(!DATA)return;localStorage.setItem('m442_session',JSON.stringify({start:Date.now(),pair:DATA.players.map(p=>p.riotId.toLowerCase()).join("|")}));updateSession();log('Session started','ok')};$("#endSession").onclick=()=>{localStorage.removeItem('m442_session');updateSession();log('Session ended','warn')};sessionTicker=setInterval(updateSession,1000);
$("#loginBtn").onclick=async()=>{const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({passcode:$("#passcode").value})});if(r.ok){$("#login").style.display='none';load()}else $("#loginError").style.display='block'};$("#passcode").addEventListener('keydown',e=>{if(e.key==='Enter')$("#loginBtn").click()});
$("#addAccount").onclick=()=>{const id=$("#extraRiotId").value.trim(),[main,partner]=selectedIds(),existing=storedExtraIds();if(!validRiotId(id)){$("#extraStatus").textContent="Enter a Riot ID like AnotherName#EUW";return}if([main,partner,...existing].some(x=>x.toLowerCase()===id.toLowerCase())){$("#extraStatus").textContent="That account is already listed.";return}if(existing.length>=8){$("#extraStatus").textContent="Maximum eight additional accounts to avoid excessive Riot API requests.";return}saveExtraIds([...existing,id]);$("#extraRiotId").value="";load()};$("#updateAccounts").onclick=load;loadPrefs();
// Explicitly reset browser-restored form values on reload.
$("#player1").value="Davy442#EUW";$("#player2").value="SDSarah#EUW";
log('Miracle442 control room booted','ok');
load();
updateSession();

