// Keep navigation independent of the renderer. The overview is rendered from the
// same mesh and camera, so a browser without WebGL still has a usable map.
(async function () {
  const fixed = document.querySelector('#fixedMode');
  const terrain = document.querySelector('#mapMode');
  const hint = document.querySelector('#viewHint');
  const canvas = document.querySelector('#land');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const coordinates = new Map(nodes.map(([name, , x, y]) => [name, [x,y]]));
  let mapMode = new URLSearchParams(location.search).get('view') === 'map';
  let projection, sceneView;

  function positionNodes(points) {
    for (const [name, [x,y]] of points) {
      const button = buttons.get(name);
      button.style.left = x+'%';
      button.style.top = y+'%';
      const parent = byName.get(name)[1];
      if (!parent) continue;
      const [px,py] = points.get(parent);
      const mid = (py+y)/2;
      const path = mapMode ? 'M '+px+' '+py+' L '+x+' '+y :
        'M '+px+' '+py+' V '+mid+' H '+x+' V '+y;
      wires.get(name).setAttribute('d',path);
      lines.querySelectorAll('.trace[data-target="'+name+'"]').forEach(el=>el.setAttribute('d',path));
    }
  }
  function applyMode(isMap) {
    mapMode = isMap;
    board.classList.toggle('map',mapMode);
    fixed.setAttribute('aria-pressed',String(!mapMode));
    terrain.setAttribute('aria-pressed',String(mapMode));
    hint.textContent = mapMode ? 'Nodes follow the terrain as the camera moves.' : 'The valley moves beneath the tree.';
    if (!sceneView && mapMode) hint.textContent = 'Terrain overview · select a landmark.';
    positionNodes(mapMode && projection ?
      new Map(Object.entries(projection.anchors).map(([name,a])=>[name,a.map])) : coordinates);
    sceneView?.move();
  }
  fixed.onclick=()=>applyMode(false);
  terrain.onclick=()=>applyMode(true);
  applyMode(mapMode);
  try {
    const response = await fetch('valley/projection.json');
    if(!response.ok)throw Error('Projection unavailable');
    projection = await response.json();
    applyMode(mapMode);
    const T = await import('/hullet-lab/vendor/three.module.js');
    const renderer = new T.WebGLRenderer({canvas,antialias:true,alpha:true});
    const scene = new T.Scene();
    const loadMesh = async () => {
      const response = await fetch('valley/mesh.gz');
      if(!response.ok)throw Error('Terrain unavailable');
      const bytes = await response.arrayBuffer();
      const magic = new Uint8Array(bytes,0,2);
      const buffer = magic[0] === 31 && magic[1] === 139
        ? await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
        : bytes;
      const [vertices,indices] = new Uint32Array(buffer,0,2);
      const pos = new Int16Array(buffer,8,vertices*3);
      const uv = new Uint16Array(buffer,8+pos.byteLength,vertices*2);
      const index = new Uint16Array(buffer,8+pos.byteLength+uv.byteLength,indices);
      const shape = new T.BufferGeometry();
      shape.setAttribute('position',new T.Float32BufferAttribute(Float32Array.from(pos,v=>v/256),3));
      shape.setAttribute('uv',new T.BufferAttribute(uv,2,true));
      shape.setIndex(new T.BufferAttribute(index,1));
      return shape;
    };
    const [shape,texture] = await Promise.all([loadMesh(),new T.TextureLoader().loadAsync('valley/terrain.jpg')]);
    texture.flipY=false;
    texture.colorSpace=T.SRGBColorSpace;
    scene.add(new T.Mesh(shape,new T.MeshBasicMaterial({map:texture,side:T.DoubleSide})));
    const [width,height]=projection.extent;
    const camera=new T.OrthographicCamera(-width/2,width/2,height/2,-height/2,.1,450);
    const base=new T.Vector3(...projection.target);
    const direction=new T.Vector3(...projection.eye);
    const center=base.clone(), destination=base.clone();
    let angle=0, goalAngle=0, zoom=1, goalZoom=1, frame=0, last=0;
    function draw(now) {
      frame=0;
      const blend=reduced.matches?1:1-Math.exp(-Math.min(60,now-last)/140);
      last=now;
      center.lerp(destination,blend);
      angle+=(goalAngle-angle)*blend;
      zoom+=(goalZoom-zoom)*blend;
      camera.position.copy(direction).applyAxisAngle(new T.Vector3(0,1,0),angle).multiplyScalar(180).add(center);
      camera.lookAt(center);
      camera.zoom=zoom;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      renderer.render(scene,camera);
      if(mapMode){
        const points=new Map();
        for(const [name,a] of Object.entries(projection.anchors)){
          const v=new T.Vector3(...a.world).project(camera);
          points.set(name,[(v.x+1)*50,(1-v.y)*50]);
        }
        positionNodes(points);
      }
      if(center.distanceTo(destination)>.015 || Math.abs(angle-goalAngle)>.0002 || Math.abs(zoom-goalZoom)>.0002) requestDraw();
    }
    function requestDraw(){if(!frame)frame=requestAnimationFrame(draw)}
    function move(){
      const anchor=projection.anchors[activeNode];
      destination.copy(base).lerp(new T.Vector3(...anchor.world),mapMode?.12:.24);
      goalAngle=(anchor.map[0]-50)*(mapMode?.0028:.0055);
      goalZoom=mapMode?1:1.12;
      if(!frame)last=performance.now()-16;
      requestDraw();
    }
    const resize=new ResizeObserver(()=>{
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
      renderer.setSize(board.clientWidth,board.clientHeight,false);
      requestDraw();
    });
    resize.observe(board);
    function fallback(){
      resize.disconnect();cancelAnimationFrame(frame);
      window.removeEventListener('atlas-select',move);
      sceneView=null;canvas.hidden=true;applyMode(mapMode);
    }
    canvas.addEventListener('webglcontextlost',fallback,{once:true});
    sceneView={move};
    board.style.backgroundImage='none';
    canvas.addEventListener('webglcontextlost',()=>board.style.removeProperty('background-image'),{once:true});
    window.addEventListener('atlas-select',move);
    applyMode(mapMode);
  } catch(error) {
    canvas.hidden=true;
    applyMode(mapMode);
    if(!mapMode)hint.textContent='Fixed tree · terrain overview';
  }
})();
