const win = document.getElementById("classicVisWindow");
const title = document.getElementById("classicVisTitle");
const canvas = document.getElementById("classicVisCanvas");
const ctx = canvas?.getContext("2d");

let mode = "spectrum";
let analyser = window.__headampAnalyser || null;
let freqData = null;
let timeData = null;
const peaks = new Array(20).fill(0);
const peakVelocity = new Array(20).fill(0);

function setAnalyser(a) {
  analyser = a || null;
  if (analyser) {
    freqData = new Uint8Array(analyser.frequencyBinCount);
    timeData = new Uint8Array(analyser.fftSize);
  }
}

setAnalyser(window.__headampAnalyser);
window.addEventListener("headamp-analyser-ready", () => setAnalyser(window.__headampAnalyser));

function classicGradient(y, h) {
  const ratio = 1 - (y / Math.max(h,1));
  if (ratio > 0.72) return "#ff3b24";
  if (ratio > 0.52) return "#ffe600";
  if (ratio > 0.28) return "#7dff00";
  return "#00b900";
}

function bucketIndex(i, count, bins) {
  const min = 1;
  const max = Math.max(2, bins - 1);
  const t = i / Math.max(1, count - 1);
  return Math.min(max, Math.floor(min * Math.pow(max / min, t)));
}

function drawSpectrum() {
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = "#000";
  ctx.fillRect(0,0,w,h);

  if (!analyser || !freqData) {
    ctx.fillStyle = "#003300";
    for (let x=4;x<w;x+=8) ctx.fillRect(x,h-5,3,1);
    return;
  }

  analyser.getByteFrequencyData(freqData);

  const bars = 20;
  const gap = 2;
  const bw = Math.floor((w - gap * (bars + 1)) / bars);

  for (let i=0;i<bars;i++) {
    const a = bucketIndex(i,bars,freqData.length);
    const b = bucketIndex(i+1,bars+1,freqData.length);
    let amp = 0;
    for (let k=a;k<=Math.max(a,b);k++) amp = Math.max(amp,freqData[k] || 0);

    const barH = Math.max(1,Math.round((amp/255)*(h-6)));
    const x = gap + i*(bw+gap);

    for (let y=0;y<barH;y+=3) {
      const py = h-2-y;
      ctx.fillStyle = classicGradient(y,barH);
      ctx.fillRect(x,py,bw,2);
    }

    if (amp > peaks[i]) {
      peaks[i] = amp;
      peakVelocity[i] = 0;
    } else {
      peakVelocity[i] += 0.20;
      peaks[i] = Math.max(0,peaks[i]-peakVelocity[i]);
    }

    const peakY = h-2-Math.round((peaks[i]/255)*(h-6));
    ctx.fillStyle = "#aaff55";
    ctx.fillRect(x,peakY,bw,1);
  }
}

function drawOscilloscope() {
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = "#000";
  ctx.fillRect(0,0,w,h);

  if (!analyser || !timeData) {
    ctx.fillStyle = "#00d000";
    ctx.fillRect(0,Math.floor(h/2),w,1);
    return;
  }

  analyser.getByteTimeDomainData(timeData);

  ctx.strokeStyle = "#24ff24";
  ctx.lineWidth = 1;
  ctx.beginPath();

  const step = timeData.length / w;
  for (let x=0;x<w;x++) {
    const sample = timeData[Math.floor(x*step)] / 128 - 1;
    const y = Math.round(h/2 + sample*(h*0.42));
    if (x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.stroke();
}

function frame() {
  if (ctx) {
    if (mode === "spectrum") drawSpectrum();
    else drawOscilloscope();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

canvas?.addEventListener("click", () => {
  mode = mode === "spectrum" ? "oscilloscope" : "spectrum";
  if (title) title.textContent = "WINAMP VISUALIZER // " + mode.toUpperCase();
});

let drag = null;
title?.addEventListener("pointerdown", (e) => {
  if (!win) return;
  e.preventDefault();
  const r = win.getBoundingClientRect();
  drag = { id:e.pointerId, dx:e.clientX-r.left, dy:e.clientY-r.top };
  win.style.right = "auto";
  win.style.bottom = "auto";
  try { title.setPointerCapture(e.pointerId); } catch {}
});

window.addEventListener("pointermove", (e) => {
  if (!drag || e.pointerId !== drag.id || !win) return;
  const maxX = Math.max(0,innerWidth-win.offsetWidth);
  const maxY = Math.max(0,innerHeight-win.offsetHeight);
  win.style.left = Math.max(0,Math.min(maxX,e.clientX-drag.dx))+"px";
  win.style.top = Math.max(0,Math.min(maxY,e.clientY-drag.dy))+"px";
});

window.addEventListener("pointerup", (e) => {
  if (drag && e.pointerId === drag.id) drag = null;
});
window.addEventListener("pointercancel", () => { drag = null; });
