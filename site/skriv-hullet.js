/* SKRIV HULLET: original real-time 1990s Goa-trance portal. No external animation libraries. */
(() => {
  "use strict";
  const el = id => document.getElementById(id);
  const canvas = el("universe");
  const ctx = canvas.getContext("2d", {alpha:false, desynchronized:true});
  if (!ctx) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const TWO = Math.PI*2, INTRO_SECONDS = 18;
  const colors = {
    goa:["#ff39d4","#56ffca","#a06cff","#55ccff","#ffe779"],
    desert:["#ffb766","#f34f89","#ffd989","#a760ea","#fc6235"],
    terminal:["#7affc3","#24e4ed","#acff96","#8edcff","#b0fff4"]
  };
  let w=innerWidth,h=innerHeight,dpr=1,stars=[],dust=[],sparks=[],last=0,raf=0;
  let start=performance.now(),introElapsed=0,introActive=true,entering=false;
  let pulseUntil=0,portalTime=0,frame=0,mouseX=.5,mouseY=.5;
  let mode="auto",intensity=3,symmetry=8,palette="goa",running=true,drawDown=false,prevPoint=null;
  let lightCanvas=document.createElement("canvas"),light=lightCanvas.getContext("2d");
  let audio=null,master=null,nextBeat=0,beatIndex=0,soundOn=false,noiseBuf=null;
  const rand = (min,max)=>min+Math.random()*(max-min);
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
    stars=Array.from({length:Math.max(110,Math.min(480,Math.floor(w*h/3400)))},()=>({
      x:Math.random(),y:Math.random(),r:rand(.25,2.1),phase:rand(0,TWO),v:rand(.3,1.3)
    }));
    dust=Array.from({length:290},()=>({x:Math.random(),y:Math.random(),s:rand(.3,2.5),v:rand(.2,1.5)}));
    sparks=Array.from({length:250},()=>({angle:rand(0,TWO),r:Math.random(),size:rand(.4,2),hue:rand(170,330)}));
  }
  function useColor(i,a=1){const cs=colors[palette];ctx.strokeStyle=cs[i%cs.length];ctx.globalAlpha=a}
  function back(t,desert=false){
    const grad=ctx.createRadialGradient(w*.51,h*(desert?.35:.45),5,w*.5,h*.5,Math.max(w,h)*.75);
    if(desert){grad.addColorStop(0,"#632448");grad.addColorStop(.34,"#1e1335");grad.addColorStop(.76,"#100d21");grad.addColorStop(1,"#03020a")}
    else{grad.addColorStop(0,"#381044");grad.addColorStop(.19,"#150b30");grad.addColorStop(.52,"#090b1d");grad.addColorStop(1,"#01030a")}
    ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  }
  function starfield(t,warp=false){
    ctx.save();ctx.globalCompositeOperation="screen";
    let limit=Math.round(stars.length*(intensity===1?.5:intensity===2?.8:1));
    for(let i=0;i<limit;i++){
      const s=stars[i],n=Math.sin(t*s.v*1.7+s.phase)*.33+.67;
      let x=s.x*w,y=s.y*h;
      if(warp){
        const scale=1+(t%2.6)*1.6;
        x=w/2+(x-w/2)*scale;y=h*.43+(y-h*.43)*scale;
      }
      if(x<0||x>w||y<0||y>h)continue;
      ctx.globalAlpha=n*.8;ctx.fillStyle=i%7===0?"#f8a6fc":i%4===0?"#a5fdff":"#e7d9fb";
      ctx.beginPath();ctx.arc(x,y,s.r*(warp?1.5:1),0,TWO);ctx.fill();
      if(i%19===0&&intensity>1){ctx.strokeStyle="#9eeffc";ctx.globalAlpha=n*.35;ctx.beginPath();ctx.moveTo(x-6,y);ctx.lineTo(x+6,y);ctx.moveTo(x,y-6);ctx.lineTo(x,y+6);ctx.stroke()}
    }
    ctx.restore();
  }
  function glow(x,y,r,inner,outer){
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,inner);g.addColorStop(1,outer);
    ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  function planets(t){
    const list=[[.15,.32,Math.min(w,h)*.075,220],[.87,.21,Math.min(w,h)*.055,290],[.77,.52,Math.min(w,h)*.032,325]];
    ctx.save();
    for(let i=0;i<list.length;i++){
      const [rx,ry,r,hue]=list[i];
      const x=rx*w+Math.sin(t*.18+i)*14,y=ry*h+Math.cos(t*.11+i)*9;
      const g=ctx.createRadialGradient(x-r*.45,y-r*.5,r*.05,x,y,r);
      g.addColorStop(0,"#74578e");g.addColorStop(.25,"#27163e");g.addColorStop(.8,"#0a0b20");g.addColorStop(1,"#2b2846");
      ctx.fillStyle=g;ctx.shadowColor=i%2?"#ec53ef":"#52d5ff";ctx.shadowBlur=20;
      ctx.beginPath();ctx.arc(x,y,r,0,TWO);ctx.fill();ctx.shadowBlur=0;
      ctx.strokeStyle="hsla("+hue+",100%,73%,.4)";ctx.lineWidth=1.5;ctx.stroke();
    }
    ctx.restore();
  }
  function dunes(t,storm){
    const horizon=h*.66, low=h*.94;
    const ground=ctx.createLinearGradient(0,horizon,0,h);
    ground.addColorStop(0,"#2a1638");ground.addColorStop(.2,"#824363");ground.addColorStop(.65,"#6d3556");ground.addColorStop(1,"#1c0b2a");
    ctx.fillStyle=ground;ctx.beginPath();ctx.moveTo(0,horizon);
    for(let x=0;x<=w+20;x+=20){let y=horizon+Math.sin(x/w*12.5+t*.11)*h*.038+Math.sin(x/w*5)*h*.047;ctx.lineTo(x,y)}
    ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.fill();
    for(let j=0;j<6;j++){
      let y=horizon+Math.pow(j/5,1.5)*(h-horizon);
      ctx.strokeStyle="rgba(255,170,151,"+(.22+j*.08)+")";
      ctx.lineWidth=.8+j*.38;ctx.beginPath();
      for(let x=-15;x<=w+15;x+=12)ctx.lineTo(x,y+Math.sin(x*.015+j*2+t*.15)*(j+1)*4);
      ctx.stroke();
    }
    // Perspective lines are deliberately subtle during the desert sequence.
    ctx.lineWidth=1;
    for(let i=-10;i<=10;i++){
      ctx.strokeStyle="rgba(255,119,192,.13)";
      ctx.beginPath();ctx.moveTo(w*.5+i*3,horizon);ctx.lineTo(w*.5+i*w*.19,h);ctx.stroke();
    }
    const obelisks=[[-.06,.61,.07,.19],[.11,.58,.035,.18],[.29,.63,.027,.13],[.72,.62,.024,.14],[.9,.56,.045,.23],[1.02,.61,.07,.19]];
    obelisks.forEach(([rx,ry,rw,rh],i)=>{
      const x=rx*w,base=ry*h+rh*h/2,ww=rw*w,hh=rh*h;
      ctx.fillStyle=i%2?"#160f22":"#110e21";ctx.beginPath();
      ctx.moveTo(x-ww*.45,base);ctx.lineTo(x-ww*.32,base-hh*.9);ctx.lineTo(x,base-hh);ctx.lineTo(x+ww*.3,base-hh*.86);ctx.lineTo(x+ww*.48,base);ctx.closePath();ctx.fill();
      ctx.strokeStyle="rgba(255,67,203,.6)";ctx.lineWidth=2;ctx.beginPath();
      ctx.moveTo(x,base-hh*.8);ctx.lineTo(x,base-hh*.3);ctx.stroke();
      glow(x,base-hh*.59,Math.min(ww,hh)*.45,"rgba(248,36,220,.2)","rgba(248,36,220,0)");
    });
    if(storm){
      ctx.save();ctx.globalCompositeOperation="screen";
      const count=Math.round(dust.length*(intensity/3));
      for(let i=0;i<count;i++){
        const d=dust[i],xx=((d.x+(t*(.09+d.v*.02)))%1.2)*w-w*.1,yy=d.y*h*.83+h*.17;
        ctx.strokeStyle="rgba(255,191,151,"+(.07+storm*.23)+")";ctx.lineWidth=d.s*(.6+storm*.9);
        ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx-(15+d.v*70)*storm,yy+storm*13);ctx.stroke();
      }
      ctx.restore();
    }
    glow(w*.5,low,Math.min(w,h)*.36,"rgba(249,72,199,.4)","rgba(228,38,199,0)");
  }
  function portal(t,zoom=1,cy=h*.43){
    const cx=w*.5,base=Math.min(w*.36,h*.52)*zoom;
    ctx.save();ctx.globalCompositeOperation="lighter";ctx.lineCap="round";
    glow(cx,cy,base*1.4,"rgba(252,73,226,.3)","rgba(234,30,221,0)");
    for(let r=21;r>=0;r--){
      const frac=(r+1)/22,R=base*frac;
      const hue=280+95*Math.sin(t*.22+frac*3),alpha=.13+(1-frac)*.4;
      ctx.strokeStyle="hsla("+hue+",100%,65%,"+alpha+")";
      ctx.lineWidth=1.6+(1-frac)*4;
      ctx.shadowColor=r%2?"#eb29dc":"#60fffa";ctx.shadowBlur=r%4===0?12:0;
      ctx.beginPath();
      const segments=intensity===1?55:84;
      for(let i=0;i<=segments;i++){
        const a=i/segments*TWO+t*.13*(r%2?1:-1);
        const distortion=Math.sin(a*7+t*1.5+r*.53)*.048+Math.sin(a*3-t*.8)*.05;
        const rr=R*(1+distortion);
        const px=cx+Math.cos(a)*rr,py=cy+Math.sin(a)*rr*.62;
        if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
      }
      ctx.closePath();ctx.stroke();
    }
    ctx.shadowBlur=0;
    const core=ctx.createRadialGradient(cx,cy,0,cx,cy,base*.25);
    core.addColorStop(0,"rgba(255,255,255,.98)");core.addColorStop(.18,"rgba(255,194,251,.9)");core.addColorStop(.55,"rgba(250,42,241,.43)");core.addColorStop(1,"rgba(184,23,218,0)");
    ctx.fillStyle=core;ctx.beginPath();ctx.arc(cx,cy,base*.25,0,TWO);ctx.fill();
    ctx.restore();
  }
  function filaments(t,qty=16,home=true){
    const cx=w*.5,cy=h*(home?.32:.43),spread=Math.max(w,h)*.72;
    ctx.save();ctx.globalCompositeOperation="lighter";ctx.lineCap="round";
    for(let side of [-1,1])for(let i=0;i<qty;i++){
      const u=i/qty,s=i%5,phase=t*(.18+.1*u)+i*.51;
      const x0=cx+side*(w*.11+u*w*.12);
      const y0=cy+(u-.48)*h*.32;
      const x1=cx+side*(w*.39+Math.sin(phase+(mouseX-.5)*2)*w*.065);
      const y1=(u*.78+.04)*h+(mouseY-.5)*h*.06;
      ctx.strokeStyle=["#fb47cb","#48ffe3","#8381ff","#f0a6fe","#65ccff"][s];
      ctx.globalAlpha=.12+(1-u)*.20;
      ctx.lineWidth=.7+(i%4===0?2.3:.3);
      ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=i%5===0?18:0;
      ctx.beginPath();
      ctx.moveTo(x0,y0);
      ctx.bezierCurveTo(cx+side*(w*.19+Math.sin(phase)*w*.09),cy-h*.4,
                       cx+side*(w*.6+Math.cos(phase*.7)*w*.12),cy-h*.35+y1*.2,x1,y1);
      ctx.stroke();
    }
    ctx.restore();
  }
  function sparkles(t){
    ctx.save();ctx.globalCompositeOperation="lighter";
    for(let i=0,n=Math.floor(sparks.length*(intensity/3));i<n;i++){
      const s=sparks[i],a=s.angle+t*(.05+.04*(i%4)),r=(s.r+t*.035*(i%4+1))%1;
      const x=w*.5+Math.cos(a)*r*w*.6,y=h*.45+Math.sin(a)*r*h*.6;
      ctx.globalAlpha=(1-r)*.75;
      ctx.fillStyle="hsl("+s.hue+",100%,"+(65+(i%3)*8)+"%)";
      ctx.beginPath();ctx.arc(x,y,s.size,0,TWO);ctx.fill();
    }
    ctx.restore();
  }
  function warp(t,progress){
    const cx=w*.5,cy=h*.43,reach=Math.max(w,h)*.85;
    ctx.save();ctx.globalCompositeOperation="lighter";
    for(let i=0,n=110*intensity;i<n;i++){
      const a=(i*2.399963+Math.sin(i*.9)*.2);
      const u=((i*.618033+progress*2.8)%1);
      const len=(8+u*reach*.28)*progress;
      const r=(u*u)*reach;
      const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;
      ctx.strokeStyle=["#f354dd","#5afff1","#7289fd","#fff2e0","#ec5dff"][i%5];
      ctx.globalAlpha=.25+.66*u;ctx.lineWidth=1+u*4;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*len,y+Math.sin(a)*len);ctx.stroke();
    }
    ctx.restore();
    portal(t,1+progress*2.7);
    glow(cx,cy,reach*.23*progress,"rgba(255,244,255,.85)","rgba(255,255,255,0)");
  }
  function autoPattern(t){
    const c=w*.5,cy=h*.42,lines=intensity===1?6:intensity===2?12:21;
    ctx.save();ctx.globalCompositeOperation="lighter";ctx.lineCap="round";
    for(let j=0;j<lines;j++){
      const hue=175+(j*23)%160,offset=t*(.18+.02*j)+j*.23;
      ctx.strokeStyle="hsla("+hue+",100%,70%,"+(.13+(j%5)*.035)+")";
      ctx.lineWidth=j%5===0?2.2:.9;
      ctx.beginPath();
      for(let i=0;i<=100;i++){
        const s=i/100,r=Math.min(w,h)*(.07+s*.68);
        const angle=s*(6.3+j*.27)+offset+(mouseX-.5)*1.8;
        let x=c+Math.cos(angle)*r*1.32;
        let y=cy+Math.sin(angle*1.07)*r*.78;
        if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  function paint(modeTime,scene){
    ctx.setTransform(dpr,0,0,dpr,0,0);
    back(modeTime,scene==="desert");
    starfield(modeTime,scene==="warp");
    if(scene==="desert"){
      portal(modeTime,.1+Math.min(1,Math.max(0,(introElapsed-5)/8))*.95,h*.34);
      // Tilt the camera skyward as the storm rises: the desert sinks out
      // of view while the dimensional gate takes over the sky.
      const skyTilt=Math.max(0,Math.min(1,(introElapsed-5)/7));
      ctx.save();ctx.translate(0,h*.44*skyTilt);
      dunes(modeTime,Math.max(.15,Math.min(1,introElapsed/8)));
      ctx.restore();
    }else if(scene==="warp"){
      warp(modeTime,Math.min(1,Math.max(.05,(introElapsed-12)/5)));
    }else{
      planets(modeTime);
      filaments(modeTime,intensity===1?7:intensity===2?11:19);
      portal(modeTime,1.05,h*.41);
      sparkles(modeTime);
      if(mode==="auto")autoPattern(modeTime);
      if(mode==="draw"){
        ctx.save();ctx.globalCompositeOperation="lighter";
        ctx.globalAlpha=.9;ctx.drawImage(lightCanvas,0,0,w,h);ctx.restore();
      }
      // Reflective perspective floor.
      ctx.save();ctx.globalAlpha=.23;ctx.strokeStyle="#f757e9";ctx.lineWidth=1;
      for(let i=-12;i<=12;i++){ctx.beginPath();ctx.moveTo(w*.5+i*9,h*.66);ctx.lineTo(w*.5+i*w*.22,h);ctx.stroke()}
      for(let i=0;i<12;i++){const frac=i/12;const y=h*.66+frac*frac*h*.34;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
      ctx.restore();
    }
    if(scene==="home"&&portalTime>performance.now()){
      warp(modeTime,Math.min(1,(portalTime-performance.now())/2800));
    }
    if(pulseUntil>performance.now()){
      ctx.save();ctx.globalAlpha=.11;ctx.fillStyle="#ff33eb";
      for(let y=(frame%25)*5;y<h;y+=48)ctx.fillRect(0,y,w,3);
      ctx.restore();
    }
  }
  function introStatus(seconds){
    const text=seconds<4?"Signaler opfanges fra ørkenen …":
      seconds<8?"Stormen samler sig. Se mod himlen …":
      seconds<12?"En dimension åbner sig …":
      seconds<16?"REJS UDEN AT BEVÆGE DIG …":"Portalen er åben. Velkommen.";
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
    raf=requestAnimationFrame(tick);
    if(document.hidden)return;
    scheduleAudio();
    if(!running&&!introActive&&portalTime<=now)return;
    const minGap=running?(intensity===3?16.2:30):250;
    if(now-last<minGap)return;
    last=now;frame++;
    const t=now/1000;
    if(introActive){
      introElapsed=(now-start)/1000;
      introStatus(introElapsed);
      if(introElapsed>=INTRO_SECONDS)finishIntro();
    }
    const scene=introActive?(introElapsed<12?"desert":"warp"):"home";
    paint(t,scene);
  }
  function setRun(active){
    running=active;el("fxToggle").textContent=running?"❙❙ PAUSE EFFEKTER":"▶ START EFFEKTER";
    el("fxToggle").setAttribute("aria-pressed",String(running));
  }
  function replay(){
    introActive=true;introElapsed=0;start=performance.now();
    el("intro").removeAttribute("aria-hidden");document.body.classList.remove("entered");
    el("status").textContent="STATUS: GENÅBNER DIMENSIONEN …";
  }
  function dive(){
    portalTime=performance.now()+2900;
    pulseUntil=performance.now()+3000;
    el("status").textContent="STATUS: REJSER GENNEM DIMENSIONSGATEN …";
    setTimeout(()=>{
      el("destinationer").scrollIntoView({behavior:reduced.matches?"auto":"smooth"});
      el("status").textContent="STATUS: VÆLG DIN DESTINATION";
    },2300);
  }
  function setMode(value){
    mode=value;document.body.classList.toggle("draw-mode",mode==="draw");
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
    light.restore();
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
  el("intensity").addEventListener("change",e=>{intensity=Number(e.target.value)||3});
  el("symmetry").addEventListener("change",e=>{symmetry=Number(e.target.value)||8});
  el("palette").addEventListener("change",e=>{palette=e.target.value});
  el("clearDraw").addEventListener("click",()=>light.clearRect(0,0,w,h));
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
      if(type==="color"){const keys=Object.keys(colors),i=keys.indexOf(palette);palette=keys[(i+1)%keys.length];el("palette").value=palette;el("oracle").textContent="Ny farvefrekvens: "+({goa:"Goa-trance",desert:"Ørkenglød",terminal:"Terminal"}[palette]);}
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
  addEventListener("resize",resize,{passive:true});
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden){stopDraw();if(audio&&soundOn)safe(()=>audio.suspend())}
    else if(audio&&soundOn)audio.resume().then(()=>{nextBeat=audio.currentTime+.02}).catch(()=>{});
  });
  resize();setMode("auto");setRun(!reduced.matches);
  if(!introActive)el("introProgress").style.width="100%";
  raf=requestAnimationFrame(tick);
})();
