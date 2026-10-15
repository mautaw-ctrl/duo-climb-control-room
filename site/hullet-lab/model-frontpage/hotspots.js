import * as THREE from 'three';

const storageKey='hullet-scene-links-v1';
export function createHotspots({canvas,getModel,getCamera,getKey,status}) {
  let saved={};try{saved=JSON.parse(localStorage.getItem(storageKey)||'{}');}catch{}
  let placing=false,down=null;
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  const layer=document.createElement('div');layer.className='hotspot-layer';document.body.append(layer);
  const editor=document.createElement('details');editor.className='import hotspot-editor';
  const summary=document.createElement('summary');summary.textContent='LINKS I MODELLEN';editor.append(summary);
  const content=document.createElement('div');content.className='import-inner';editor.append(content);
  const label=document.createElement('input');label.placeholder='Navn, fx Raidtilmelding';label.setAttribute('aria-label','Linkets navn');label.maxLength=80;
  const url=document.createElement('input');url.type='url';url.placeholder='https://softreserve.it/…';url.setAttribute('aria-label','Linkets adresse');
  const place=document.createElement('button');place.type='button';place.textContent='＋ PLACER LINK';
  const exportButton=document.createElement('button');exportButton.type='button';exportButton.textContent='↓ EKSPORTER LINKS';
  const clear=document.createElement('button');clear.type='button';clear.textContent='FJERN SCENENS LINKS';
  const note=document.createElement('p');note.className='local-library-note';note.textContent='Navngiv linket, indsæt adressen og klik derefter på en overflade i modellen. Placeringer gemmes i denne browser. Eksporter dem, når de skal deles på siden.';
  content.append(label,url,place,exportButton,clear,note);
  document.getElementById('import-details').before(editor);
  let markers=[];
  function persist(){try{localStorage.setItem(storageKey,JSON.stringify(saved));}catch{status('Linket kan ikke gemmes i denne browser. Eksporter det før du lukker siden.');}}
  function validURL(value){try{const parsed=new URL(value);return ['https:','http:'].includes(parsed.protocol)?parsed.href:null;}catch{return null;}}
  function refresh(){
    placing=false;canvas.classList.remove('placing-link');place.textContent='＋ PLACER LINK';
    layer.replaceChildren();markers=[];
    for(const entry of saved[getKey()]||[]){
      const href=validURL(entry.url);
      if(!href||!Array.isArray(entry.point)||entry.point.length!==3||!entry.point.every(Number.isFinite))continue;
      const a=document.createElement('a');a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.className='scene-link';a.textContent=entry.label||'Åbn link';a.hidden=true;layer.append(a);markers.push({a,point:new THREE.Vector3(...entry.point)});
    }
  }
  place.addEventListener('click',()=>{
    if(!getModel()||canvas.hidden){status('Vælg en GLB-model for at placere et link.');return;}
    if(!label.value.trim()||!validURL(url.value)){status('Udfyld navn og en gyldig http/https-adresse.');return;}
    placing=!placing;place.textContent=placing?'ANNULLER PLACERING':'＋ PLACER LINK';canvas.classList.toggle('placing-link',placing);
    if(placing)status('Klik på en overflade i modellen.');
  });
  canvas.addEventListener('pointerdown',event=>{down={x:event.clientX,y:event.clientY};});
  canvas.addEventListener('pointerup',event=>{
    if(!placing||!down||Math.hypot(event.clientX-down.x,event.clientY-down.y)>6)return;
    const model=getModel(),camera=getCamera();if(!model||!camera)return;
    const rect=canvas.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObject(model,true)[0];
    if(!hit){status('Klik på selve modellen for at placere linket.');return;}
    const point=model.worldToLocal(hit.point.clone()).toArray();
    (saved[getKey()]??=[]).push({label:label.value.trim(),url:validURL(url.value),point});persist();refresh();status('Link placeret.');
  });
  clear.addEventListener('click',()=>{delete saved[getKey()];persist();refresh();});
  exportButton.addEventListener('click',()=>{
    const blob=new Blob([JSON.stringify({version:1,scenes:saved},null,2)],{type:'application/json'});
    const href=URL.createObjectURL(blob),a=document.createElement('a');a.href=href;a.download='hullet-scene-links.json';a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){placing=false;canvas.classList.remove('placing-link');place.textContent='＋ PLACER LINK';}});
  return {
    refresh,
    update(){
      const model=getModel(),camera=getCamera();
      for(const marker of markers){
        if(!model||!camera||canvas.hidden){marker.a.hidden=true;continue;}
        const world=model.localToWorld(marker.point.clone());const projected=world.clone().project(camera);
        const inside=projected.z>=-1&&projected.z<=1&&Math.abs(projected.x)<1&&Math.abs(projected.y)<1;
        marker.a.hidden=!inside;
        if(inside){marker.a.style.left=((projected.x+1)/2*innerWidth)+'px';marker.a.style.top=((-projected.y+1)/2*innerHeight)+'px';}
      }
    }
  };
}
