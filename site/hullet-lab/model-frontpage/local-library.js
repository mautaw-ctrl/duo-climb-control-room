// Browser-owned model library. Files are never uploaded by this module.
export function installLocalLibrary({models, choose, status}) {
  const input=document.getElementById('model-file');
  input.multiple=true;
  document.getElementById('import-trigger').textContent='↥ TILFØJ GLB-MODELLER';
  const note=document.createElement('p');
  note.className='local-library-note';
  note.textContent='Vælg flere .glb-filer eller slip dem på siden. Gemmes i denne browser; deles ikke med andre besøgende.';
  input.after(note);
  const select=document.getElementById('model-select');
  const group=document.createElement('optgroup');group.label='Mine modeller · denne browser';select.append(group);
  let db;
  const urls=new Set();
  const ready=new Promise((resolve,reject)=>{
    const request=indexedDB.open('hullet-model-library',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('models',{keyPath:'id'});
    request.onsuccess=()=>{db=request.result;resolve();};
    request.onerror=()=>reject(request.error);
  });
  function register(entry){
    if(models[entry.id])return entry.id;
    const url=URL.createObjectURL(entry.file);urls.add(url);
    models[entry.id]={name:entry.name,category:'MINE MODELLER',description:'Gemt i denne browser. Vælg en anden model for at skifte scene.',url};
    const option=document.createElement('option');option.value=entry.id;option.textContent=entry.name;group.append(option);
    return entry.id;
  }
  async function add(files){
    const accepted=Array.from(files).filter(file=>/\.glb$/i.test(file.name));
    if(!accepted.length){status('Vælg .glb-filer.');return;}
    let first=null,failed=0;
    for(const file of accepted){
      // Sequential reads avoid decoding the entire collection into memory.
      if(file.size>100*1024*1024){failed++;continue;}
      const magic=new Uint8Array(await file.slice(0,4).arrayBuffer());
      if(String.fromCharCode(...magic)!=='glTF'){failed++;continue;}
      const entry={id:'local-'+crypto.randomUUID(),name:file.name,file};
      register(entry);first??=entry.id;
      try{
        await ready;
        await new Promise((resolve,reject)=>{
          const tx=db.transaction('models','readwrite');tx.objectStore('models').put(entry);
          tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
        });
      }catch{failed++;note.textContent='Browseren kunne ikke gemme alle filer. De kan stadig bruges i denne session. Tilføj dem igen efter genindlæsning.';}
    }
    if(first)choose(first);
    if(failed)note.textContent+=' '+failed+' filer kunne ikke tilføjes eller gemmes (maks. 100 MB pr. fil).';
    input.value='';
  }
  input.addEventListener('change',event=>{add(event.target.files).catch(()=>status('Kunne ikke læse filerne.'));});
  const hasFiles=event=>Array.from(event.dataTransfer?.types||[]).includes('Files');
  document.addEventListener('dragover',event=>{if(hasFiles(event)){event.preventDefault();event.dataTransfer.dropEffect='copy';}});
  document.addEventListener('drop',event=>{if(hasFiles(event)){event.preventDefault();add(event.dataTransfer.files).catch(()=>status('Kunne ikke læse filerne.'));}});
  ready.then(()=>new Promise((resolve,reject)=>{
    const request=db.transaction('models').objectStore('models').getAll();
    request.onsuccess=()=>{request.result.forEach(register);resolve();};request.onerror=()=>reject(request.error);
  })).catch(()=>{note.textContent='Permanent lagring er ikke tilgængelig. Modeller kan stadig åbnes i denne session.';});
  window.addEventListener('pagehide',()=>{urls.forEach(url=>URL.revokeObjectURL(url));db?.close();});
}
