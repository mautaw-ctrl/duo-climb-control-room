/* HULLET HEAD LAB / portrait-to-depth relief.
   No remote AI, face recognition or image uploads. Deterministic 2.5D mesh.
   Valid image+crop pixels become colored front vertices; a mirrored curved
   reverse side closes the sculpture. This is not true photogrammetry. */
export function sculptPortrait(rgba,width,height,options={}){
  if(!rgba || width<12 || height<12 || rgba.length<width*height*4)
    throw new Error("Billedet indeholder for få pixels.");
  const depth=Math.max(.06,Math.min(1.5,Number(options.depth)||.58));
  const maskWidth=Math.max(.50,Math.min(1.05,Number(options.maskWidth)||.79));
  const count=Math.max(200,Math.min(12000,Math.round(Number(options.count)||5000)));
  const valid=new Uint8Array(width*height);
  const front=new Float32Array(width*height*3);
  const back=new Float32Array(width*height*3);
  const tint=new Uint8Array(width*height*3);
  const candidates=[];
  for(let y=0;y<height;y++){
    const ny=1-2*y/(height-1);
    // Narrow toward the chin, lift the crown, and allow hair beyond the oval.
    const rowWidth=maskWidth*(1-.20*Math.max(0,-ny)-.055*Math.max(0,ny-.50));
    for(let x=0;x<width;x++){
      const nx=2*x/(width-1)-1,id=y*width+x,at=id*4,of=id*3;
      const r=rgba[at],g=rgba[at+1],b=rgba[at+2],alpha=rgba[at+3];
      const radius=Math.pow(nx/rowWidth,2)+ny*ny;
      if(radius>0.987 || alpha<24)continue;
      valid[id]=1;candidates.push(id);
      const convex=Math.sqrt(Math.max(0,1-radius));
      const brightness=(r*.2126+g*.7152+b*.0722)/255;
      const nose=Math.exp(-Math.pow(nx/.15,2)-Math.pow((ny-.025)/.27,2));
      const eye=Math.exp(-Math.pow((Math.abs(nx)-.29)/.14,2)-Math.pow((ny-.25)/.10,2));
      const cheek=Math.exp(-Math.pow((Math.abs(nx)-.35)/.22,2)-Math.pow((ny+.02)/.21,2));
      const chin=Math.exp(-Math.pow(nx/.32,2)-Math.pow((ny+.62)/.14,2));
      const displacement=(brightness-.46)*.14+nose*.20*depth-eye*.10*depth+cheek*.10*depth+chin*.06*depth;
      front[of]=nx*1.12;
      front[of+1]=ny*1.42;
      front[of+2]=.08+convex*depth+displacement;
      back[of]=nx*1.12;
      back[of+1]=ny*1.42;
      back[of+2]=-.16-convex*depth*.55;
      tint[of]=r;tint[of+1]=g;tint[of+2]=b;
    }
  }
  if(candidates.length<30)throw new Error("Der blev ikke fundet et synligt ansigt. Brug et tydeligt frontfoto.");
  const points=new Float32Array(count*3),colors=new Float32Array(count*3);
  // Golden-angle sampling decorrelates the original rectangular pixel grid.
  const GOLDEN=0.618033988749895;
  for(let i=0;i<count;i++){
    const q=(i*GOLDEN)%1;
    const id=candidates[Math.floor(q*candidates.length)];
    const off=id*3,dst=i*3,rear=i%7<2,src=rear?back:front;
    const jitter=(Math.sin(i*14.71)*.5+.5)*.014;
    points[dst]=src[off]+Math.sin(i*2.11)*jitter;
    points[dst+1]=src[off+1]+Math.cos(i*1.72)*jitter;
    points[dst+2]=src[off+2]+Math.sin(i*5.11)*jitter;
    const dim=rear?.35:1;
    colors[dst]=(tint[off]/255)*dim;
    colors[dst+1]=(tint[off+1]/255)*dim;
    colors[dst+2]=(tint[off+2]/255)*dim;
  }
  // A triangle shell formed from the same mask. Exporters get real faces,
  // rather than a list of isolated points or a fake 3D photograph.
  const vertices=[],faces=[],mapping=new Int32Array(valid.length).fill(-1);
  for(let i=0;i<valid.length;i++){
    if(!valid[i])continue;
    mapping[i]=vertices.length;
    const o=i*3;
    vertices.push([front[o],front[o+1],front[o+2],tint[o],tint[o+1],tint[o+2]]);
  }
  const n=vertices.length;
  for(let i=0;i<valid.length;i++){
    if(!valid[i])continue;
    const o=i*3;
    vertices.push([back[o],back[o+1],back[o+2],
      Math.round(tint[o]*.35),Math.round(tint[o+1]*.35),Math.round(tint[o+2]*.35)]);
  }
  const cellW=width-1,cellH=height-1;
  const occupied=new Uint8Array(cellW*cellH);
  const corner=(x,y)=>mapping[y*width+x];
  for(let y=0;y<cellH;y++)for(let x=0;x<cellW;x++){
    const a=corner(x,y),b=corner(x+1,y),c=corner(x+1,y+1),d=corner(x,y+1);
    if(Math.min(a,b,c,d)<0)continue;
    occupied[y*cellW+x]=1;
    faces.push([a,d,b],[b,d,c]);
    faces.push([a+n,b+n,d+n],[b+n,c+n,d+n]);
  }
  function side(a,b){
    faces.push([a,b,b+n],[a,b+n,a+n]);
  }
  for(let y=0;y<cellH;y++)for(let x=0;x<cellW;x++){
    if(!occupied[y*cellW+x])continue;
    if(!y || !occupied[(y-1)*cellW+x])side(corner(x,y),corner(x+1,y));
    if(y===cellH-1 || !occupied[(y+1)*cellW+x])side(corner(x+1,y+1),corner(x,y+1));
    if(!x || !occupied[y*cellW+x-1])side(corner(x,y+1),corner(x,y));
    if(x===cellW-1 || !occupied[y*cellW+x+1])side(corner(x+1,y),corner(x+1,y+1));
  }
  return {points,colors,vertices,faces,depth,maskWidth,width,height,
    validPixels:candidates.length,triangleCount:faces.length};
}
export function serializePLY(sculpture){
  const {vertices,faces}=sculpture;
  const out=[
    "ply","format ascii 1.0",
    "comment Hullet Head Lab local image-based 2.5D reconstruction",
    "element vertex "+vertices.length,
    "property float x","property float y","property float z",
    "property uchar red","property uchar green","property uchar blue",
    "element face "+faces.length,"property list uchar int vertex_indices","end_header"
  ];
  for(const v of vertices)out.push(
    v.slice(0,3).map(n=>n.toFixed(5)).join(" ")+" "+
    v.slice(3,6).map(n=>Math.min(255,Math.max(0,Math.round(n)))).join(" ")
  );
  for(const f of faces)out.push("3 "+f.join(" "));
  return out.join("\n")+"\n";
}
export function serializeOBJ(sculpture){
  const {vertices,faces}=sculpture;
  const out=["# Hullet Head Lab | 2.5D portrait mesh",
    "# Approximate geometry from a single photo; no true 360 degree scan",
    "o portrait_relief"];
  for(const v of vertices)out.push("v "+v.slice(0,3).map(n=>n.toFixed(6)).join(" "));
  // OBJ indices start at 1.
  for(const face of faces)out.push("f "+face.map(n=>n+1).join(" "));
  return out.join("\n")+"\n";
}
