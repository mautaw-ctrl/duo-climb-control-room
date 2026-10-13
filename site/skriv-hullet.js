/* SKRIV HULLET: original real-time 1990s Goa-trance portal. No external animation libraries. */
(() => {
  "use strict";
  const el = id => document.getElementById(id);
  const canvas = el("universe");
  const ctx = canvas.getContext("2d", {alpha:true, desynchronized:true});
  if (!ctx) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const TWO = Math.PI*2, INTRO_SECONDS = 6;
  const colors = {
    goa:["#ff39d4","#56ffca","#a06cff","#55ccff","#ffe779"],
    desert:["#ffb766","#f34f89","#ffd989","#a760ea","#fc6235"],
    terminal:["#7affc3","#24e4ed","#acff96","#8edcff","#b0fff4"]
  };
  let w=innerWidth,h=innerHeight,dpr=1;
  let start=performance.now(),introElapsed=0,introActive=true;
  let pulseUntil=0,portalTime=0,mouseX=.5,mouseY=.5;
  let mode="auto",intensity=1,symmetry=8,palette="goa",running=true,drawDown=false,prevPoint=null;
  let lightCanvas=document.createElement("canvas"),light=lightCanvas.getContext("2d");
  let audio=null,master=null,nextBeat=0,beatIndex=0,soundOn=false,noiseBuf=null;
  const safe = (fn, fallback=null) => {try{return fn()}catch{return fallback}};
  const pad=n=>String(n).padStart(6,"0");
  const sessionSeen=safe(()=>sessionStorage.getItem("hullet_intro_set"),null);
  let visits=Number(safe(()=>localStorage.getItem("hullet_visits"),"0"))||0;
  if(!sessionSeen)visits++;
  safe(()=>localStorage.setItem("hullet_visits",String(visits)));
  el("visits").textContent=pad(visits);
  if(reduced.matches||sessionSeen){introActive=false;document.body.classList.add("entered");el("intro").setAttribute("aria-hidden","true")}
  running=!reduced.matches;

  function resize(){
    w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    // Preserve existing drawing when viewport size changes.
    const old=lightCanvas;
    lightCanvas=document.createElement("canvas");
    lightCanvas.width=Math.round(w*dpr);lightCanvas.height=Math.round(h*dpr);
    light=lightCanvas.getContext("2d");
    light.setTransform(dpr,0,0,dpr,0,0);
    if(old.width)light.drawImage(old,0,0,w,h);
  }
  function introStatus(seconds){
    const text=seconds<2?"Unormal aktivitet i horisonten …":seconds<4?"En anden verden åbner sig …":"Velkommen til den anden side.";
    if(el("introText").textContent!==text)el("introText").textContent=text;
    el("introProgress").style.width=(100*Math.min(1,seconds/INTRO_SECONDS)).toFixed(1)+"%";
  }
  function finishIntro(){
    if(!introActive)return;
    introActive=false;document.body.classList.add("entered");
    el("intro").setAttribute("aria-hidden","true");
    safe(()=>sessionStorage.setItem("hullet_intro_set","1"));
    el("status").textContent="STATUS: DIMENSIONEN ER ÅBEN ◉";
  }
  function tick(now){
    if(document.hidden)return;
    scheduleAudio();
    if(introActive){
      introElapsed=(now-start)/1000;introStatus(introElapsed);
      if(introElapsed>=INTRO_SECONDS)finishIntro();
    }
  }
  function renderDrawing(){
    ctx.clearRect(0,0,w,h);
    if(mode==="draw")ctx.drawImage(lightCanvas,0,0,w,h);
  }
  function setRun(active){
    running=active;document.body.classList.toggle("fx-paused",!active);el("fxToggle").textContent=running?"❙❙ PAUSE EFFEKTER":"▶ START EFFEKTER";
    el("fxToggle").setAttribute("aria-pressed",String(running));
  }
  function replay(){
    introActive=true;introElapsed=0;start=performance.now();
    el("intro").removeAttribute("aria-hidden");document.body.classList.remove("entered");
    el("status").textContent="STATUS: GENÅBNER DIMENSIONEN …";
  }
  function dive(){
    document.body.classList.add("diving");
    setTimeout(()=>document.body.classList.remove("diving"),900);
    portalTime=performance.now()+900;
    pulseUntil=performance.now()+3000;
    el("status").textContent="STATUS: REJSER GENNEM DIMENSIONSGATEN …";
    setTimeout(()=>{
      el("destinationer").scrollIntoView({behavior:reduced.matches?"auto":"smooth"});
      el("status").textContent="STATUS: VÆLG DIN DESTINATION";
    },650);
  }
  function setMode(value){
    mode=value;renderDrawing();document.body.classList.toggle("draw-mode",mode==="draw");
    el("modeAuto").setAttribute("aria-pressed",String(mode==="auto"));
    el("modeDraw").setAttribute("aria-pressed",String(mode==="draw"));
    el("drawOptions").hidden=mode!=="draw";
    el("oracle").textContent=mode==="draw"?"Hold musen nede og tegn i baggrunden. Alt spejles om portalens centrum.":"Automatiske dimensioner væver sig sammen. Prøv at klikke på portalen.";
    el("status").textContent=mode==="draw"?"STATUS: INTERAKTIV TEGNING AKTIV":"STATUS: AUTOMATISK PSYKEDELIA AKTIV";
  }
  function drawSegment(ax,ay,bx,by){
    if(!light)return;
    const cx=w*.5,cy=h*.45,rr=Math.hypot(ax-cx,ay-cy);
    if(rr>Math.max(w,h)*1.2)return;
    const a0=Math.atan2(ay-cy,ax-cx),a1=Math.atan2(by-cy,bx-cx);
    const r0=Math.hypot(ax-cx,ay-cy),r1=Math.hypot(bx-cx,by-cy);
    light.save();light.globalCompositeOperation="lighter";
    light.lineCap="round";light.lineWidth=intensity===1?1.4:2.4;
    const cols=colors[palette],hue=cols[Math.floor(performance.now()/850)%cols.length];
    light.strokeStyle=hue;light.shadowColor=hue;light.shadowBlur=11;
    for(let i=0;i<symmetry;i++){
      const base=i*TWO/symmetry;
      const reflect=i%2?-1:1;
      light.beginPath();
      light.moveTo(cx+Math.cos(base+a0*reflect)*r0,cy+Math.sin(base+a0*reflect)*r0);
      light.lineTo(cx+Math.cos(base+a1*reflect)*r1,cy+Math.sin(base+a1*reflect)*r1);
      light.stroke();
    }
    light.restore();renderDrawing();
  }
  function pointerPos(e){return [e.clientX,e.clientY]}
  function overControl(target){return !!(target instanceof Element && target.closest("button,a,select,input,dialog,.tile,.extras"))}
  canvas.addEventListener("pointerdown",e=>{
    if(mode!=="draw"||introActive||overControl(e.target))return;
    drawDown=true;prevPoint=pointerPos(e);
    safe(()=>canvas.setPointerCapture(e.pointerId));
    e.preventDefault();
  });
  canvas.addEventListener("pointermove",e=>{
    mouseX=e.clientX/Math.max(1,w);mouseY=e.clientY/Math.max(1,h);
    if(!drawDown||mode!=="draw")return;
    const p=pointerPos(e);
    if(prevPoint){drawSegment(...prevPoint,...p)}
    prevPoint=p;e.preventDefault();
  });
  window.addEventListener("pointermove",e=>{mouseX=e.clientX/Math.max(1,w);mouseY=e.clientY/Math.max(1,h)},{passive:true});
  const stopDraw=()=>{drawDown=false;prevPoint=null};
  canvas.addEventListener("pointerup",stopDraw);
  canvas.addEventListener("pointercancel",stopDraw);
  window.addEventListener("pointerup",stopDraw);

  function initAudio(){
    if(audio)return;
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC){el("oracle").textContent="Denne browser understøtter ikke lydsystemet.";return}
    audio=new AC();
    master=audio.createGain();master.gain.value=.10;
    const compressor=audio.createDynamicsCompressor();
    compressor.threshold.value=-18;compressor.ratio.value=4;
    master.connect(compressor);compressor.connect(audio.destination);
    noiseBuf=audio.createBuffer(1,Math.floor(audio.sampleRate*.1),audio.sampleRate);
    const ch=noiseBuf.getChannelData(0);
    for(let i=0;i<ch.length;i++)ch[i]=Math.random()*2-1;
    nextBeat=audio.currentTime+.03;
  }
  function note(midi,start,duration,wave="square",volume=.13){
    if(!audio||!master)return;
    const osc=audio.createOscillator(),gain=audio.createGain();
    osc.type=wave;osc.frequency.setValueAtTime(440*2**((midi-69)/12),start);
    gain.gain.setValueAtTime(.001,start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.002,volume),start+.012);
    gain.gain.exponentialRampToValueAtTime(.001,start+duration);
    osc.connect(gain);gain.connect(master);osc.start(start);osc.stop(start+duration+.01);
  }
  function drum(start,kick){
    if(!audio||!master)return;
    if(kick){
      const o=audio.createOscillator(),g=audio.createGain();
      o.type="sine";o.frequency.setValueAtTime(130,start);o.frequency.exponentialRampToValueAtTime(43,start+.11);
      g.gain.setValueAtTime(.65,start);g.gain.exponentialRampToValueAtTime(.001,start+.18);
      o.connect(g);g.connect(master);o.start(start);o.stop(start+.2);
    }else if(noiseBuf){
      const source=audio.createBufferSource(),g=audio.createGain(),hi=audio.createBiquadFilter();
      source.buffer=noiseBuf;hi.type="highpass";hi.frequency.value=3900;
      g.gain.setValueAtTime(.12,start);g.gain.exponentialRampToValueAtTime(.001,start+.04);
      source.connect(hi);hi.connect(g);g.connect(master);source.start(start);source.stop(start+.045);
    }
  }
  const notes=[57,58,61,62,65,64,62,61,57,61,65,67,65,62,61,58];
  function scheduleAudio(){
    if(!soundOn||!audio||audio.state!=="running")return;
    const beat=60/138/4;let loops=0;
    while(nextBeat<audio.currentTime+.11&&loops++<24){
      const index=beatIndex%16;
      if(index%4===0)drum(nextBeat,true);
      if(index%2===0)drum(nextBeat+.006,false);
      if(index%2===0)note(notes[index],nextBeat,beat*1.85,"square",.07);
      if(index%4===0)note([33,33,38,36][Math.floor(index/4)],nextBeat,beat*3.7,"sawtooth",.095);
      if(index===7||index===15)note(81,nextBeat,beat*.8,"triangle",.04);
      beatIndex++;nextBeat+=beat;
    }
  }
  async function toggleSound(force){
    const turnOn=typeof force==="boolean"?force:!soundOn;
    if(turnOn&&!audio)initAudio();
    if(turnOn&&audio){try{await audio.resume()}catch{el("oracle").textContent="Lyden kunne ikke startes i denne browser.";return}}
    soundOn=turnOn&&!!audio;
    if(!soundOn&&audio)await audio.suspend();
    if(soundOn){nextBeat=audio.currentTime+.03;beatIndex=0}
    el("sound").textContent=soundOn?"♫ LYD TIL":"♫ LYD FRA";
    el("introAudio").textContent=soundOn?"♫ SLUK LYD":"♫ TÆND LYD";
    el("sound").setAttribute("aria-pressed",String(soundOn));
    el("introAudio").setAttribute("aria-pressed",String(soundOn));
  }
  el("introAudio").addEventListener("click",()=>toggleSound());
  el("sound").addEventListener("click",()=>toggleSound());
  el("skipIntro").addEventListener("click",finishIntro);
  el("replayIntro").addEventListener("click",replay);
  el("portalDive").addEventListener("click",dive);
  el("fxToggle").addEventListener("click",()=>setRun(!running));
  el("modeAuto").addEventListener("click",()=>setMode("auto"));
  el("modeDraw").addEventListener("click",()=>setMode("draw"));
  el("intensity").addEventListener("change",e=>{intensity=Number(e.target.value)||1;document.body.dataset.intensity=String(intensity)});
  el("symmetry").addEventListener("change",e=>{symmetry=Number(e.target.value)||8});
  el("palette").addEventListener("change",e=>{palette=e.target.value;document.body.dataset.palette=palette});
  el("clearDraw").addEventListener("click",()=>{light.clearRect(0,0,w,h);renderDrawing()});
  const sayings=[
    "Du har fundet en gammel internetforbindelse. Den lugter af støv og muligheder.",
    "Ingen ved, hvor portalen fører hen. Det er halvdelen af pointen.",
    "Rejs uden at bevæge dig. En modemforbindelse tager sig af resten.",
    "En besøgende i 1998 efterlod en besked: Husk at gemme dit spil.",
    "Den bedste dimension er den, som endnu ikke er blevet kortlagt.",
    "Der findes flere hemmeligheder under overfladen. Prøv at tegne en."
  ];
  const guest=el("guestbook");
  document.querySelectorAll("[data-relic]").forEach(button=>{
    button.addEventListener("click",()=>{
      const type=button.dataset.relic;
      if(type==="oracle")el("oracle").textContent=sayings[Math.floor(Math.random()*sayings.length)];
      if(type==="glitch"){pulseUntil=performance.now()+1800;document.body.classList.add("surge");setTimeout(()=>document.body.classList.remove("surge"),1800);el("oracle").textContent="Signalet er forstyrret. Frekvensen bliver justeret …"}
      if(type==="portal")dive();
      if(type==="color"){const keys=Object.keys(colors),i=keys.indexOf(palette);palette=keys[(i+1)%keys.length];el("palette").value=palette;document.body.dataset.palette=palette;el("oracle").textContent="Ny farvefrekvens: "+({goa:"Goa-trance",desert:"Ørkenglød",terminal:"Terminal"}[palette]);}
      if(type==="guestbook"){el("guestLast").textContent=safe(()=>localStorage.getItem("hullet_guest"),"")||"Ingen besked gemt endnu.";if(typeof guest.showModal==="function")guest.showModal();}
    });
  });
  // Native links still work normally with modifier keys, touch, and new tabs.
  document.querySelectorAll(".tile").forEach(link=>link.addEventListener("click",e=>{
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||reduced.matches)return;
    e.preventDefault();
    portalTime=performance.now()+850;
    pulseUntil=performance.now()+850;
    const href=link.href;
    setTimeout(()=>location.assign(href),650);
  }));
  el("guestCancel").addEventListener("click",()=>guest.close());
  el("guestbookForm").addEventListener("submit",e=>{
    if(e.submitter?.value==="gem"){
      const message=el("guestText").value.trim().slice(0,140);
      if(message){
        safe(()=>localStorage.setItem("hullet_guest",message));
        el("oracle").textContent="Beskeden er gemt lokalt: "+message;
      }
    }
  });
  document.addEventListener("keydown",e=>{
    if(e.target.closest("input,textarea,select,dialog"))return;
    if(e.key==="Escape"&&introActive)finishIntro();
    if(e.key.toLowerCase()==="d"&&!introActive)setMode("draw");
    if(e.key.toLowerCase()==="a"&&!introActive)setMode("auto");
  });
  reduced.addEventListener("change",e=>{
    if(e.matches){finishIntro();setRun(false)}
    else setRun(true);
  });
  addEventListener("resize",()=>{resize();renderDrawing()},{passive:true});
  document.addEventListener("visibilitychange",()=>{
    document.body.classList.toggle("page-hidden",document.hidden);
    if(document.hidden){stopDraw();if(audio&&soundOn)safe(()=>audio.suspend())}
    else if(audio&&soundOn)audio.resume().then(()=>{nextBeat=audio.currentTime+.02}).catch(()=>{});
  });
  resize();setMode("auto");setRun(!reduced.matches);
  if(!introActive)el("introProgress").style.width="100%";
  // No continuous canvas redraw: paint only in response to drawing input.
  setInterval(()=>tick(performance.now()),100);
})();
