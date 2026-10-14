/* Reactive art direction for Hullet. One atmospheric CSS layer, no additional WebGL renderer.
   The current object controls the palette; the selected atmosphere controls the composition. */
const root=document.documentElement;
const stageThemes={
  jesus:[192,37,267],fox:[29,193,8],cesiumman:[209,170,252],
  riggedFigure:[280,200,320],scatteringSkull:[202,273,168],
  milkTruck:[42,195,212],toyCar:[9,190,32],sunglasses:[283,178,310],
  boomBox:[324,176,272],materialsShoe:[18,211,341],waterBottle:[205,157,225],
  sheenChair:[295,190,262],glamSofa:[315,35,269],irisLamp:[281,189,310],
  lantern:[39,195,20],barnLamp:[37,205,46],avocado:[91,175,62],
  teaCup:[195,35,169],abalone:[280,157,331],oliveDish:[68,259,120],
  animatedBox:[225,43,190],irisSuzanne:[287,177,322],clearCoat:[353,195,320],
  thunderfury:[197,261,222],custom:[185,267,49]
};
let currentEnvironment="aurora",pendingPointer=false,mouseX=.5,mouseY=.5,transitionTimeout=0;
export function updateStage(key){
  const [primary,secondary,accent]=stageThemes[key]||stageThemes.custom;
  root.style.setProperty("--stage-hue",String(primary));
  root.style.setProperty("--stage-hue-secondary",String(secondary));
  root.style.setProperty("--stage-hue-accent",String(accent));
  root.dataset.artwork=key;
  root.classList.remove("stage-arriving");
  void root.offsetWidth;
  root.classList.add("stage-arriving");
  clearTimeout(transitionTimeout);
  transitionTimeout=setTimeout(()=>root.classList.remove("stage-arriving"),850);
  return {primary,secondary,accent};
}
export function setEnvironment(value){
  if(!["aurora","cosmos","gallery","void"].includes(value))return;
  currentEnvironment=value;
  root.dataset.environment=value;
  const input=document.getElementById("environment-select");
  if(input)input.value=value;
}
export function setupStage(){
  setEnvironment(currentEnvironment);
  updateStage("jesus");
  document.getElementById("environment-select")?.addEventListener("change",event=>{
    setEnvironment(event.target.value);
  });
  window.addEventListener("pointermove",event=>{
    if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    mouseX=event.clientX/Math.max(innerWidth,1);
    mouseY=event.clientY/Math.max(innerHeight,1);
    if(pendingPointer)return;
    pendingPointer=true;
    requestAnimationFrame(()=>{
      pendingPointer=false;
      root.style.setProperty("--cursor-x",(mouseX*100).toFixed(2)+"%");
      root.style.setProperty("--cursor-y",(mouseY*100).toFixed(2)+"%");
      root.style.setProperty("--parallax-x",((mouseX-.5)*2).toFixed(3));
      root.style.setProperty("--parallax-y",((mouseY-.5)*2).toFixed(3));
    });
  },{passive:true});
  const reveal=()=>{
    for(const element of document.querySelectorAll(".selector,.hero-copy,.masthead")){
      element?.classList.add("arrived");
    }
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",reveal,{once:true});
  else reveal();
}
