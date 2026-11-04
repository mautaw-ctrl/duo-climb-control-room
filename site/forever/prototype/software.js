// Orthographic textured triangle rasterization for browsers without WebGL.
// It uses the same camera, geometry, UVs and depth ordering as the GPU scene.
export function makeRenderer(canvas,shape,image) {
  const ctx=canvas.getContext('2d',{alpha:false});
  const atlas=document.createElement('canvas');
  atlas.width=atlas.height=1024;
  const surface=atlas.getContext('2d',{willReadFrequently:true});
  surface.drawImage(image,0,0,atlas.width,atlas.height);
  const pixels=new Uint32Array(surface.getImageData(0,0,atlas.width,atlas.height).data.buffer);
  const vertices=shape.attributes.position.array, uv=shape.attributes.uv.array, indices=shape.index.array;
  const projected=new Float32Array(vertices.length);
  let output, colors, depths;
  function resize(w,h){
    const scale=Math.min(1,860/w,580/h);
    canvas.width=Math.max(1,Math.round(w*scale));canvas.height=Math.max(1,Math.round(h*scale));
    output=ctx.createImageData(canvas.width,canvas.height);
    colors=new Uint32Array(output.data.buffer);depths=new Float32Array(colors.length);
  }
  function draw(camera){
    if(!output) resize(canvas.clientWidth,canvas.clientHeight);
    const w=canvas.width,h=canvas.height,m=camera.projectionMatrix.clone().multiply(camera.matrixWorldInverse).elements;
    for(let i=0;i<vertices.length;i+=3){
      const x=vertices[i],y=vertices[i+1],z=vertices[i+2];
      projected[i]=(1+m[0]*x+m[4]*y+m[8]*z+m[12])*w*.5;
      projected[i+1]=(1-m[1]*x-m[5]*y-m[9]*z-m[13])*h*.5;
      projected[i+2]=m[2]*x+m[6]*y+m[10]*z+m[14];
    }
    colors.fill(0xff171c20);depths.fill(Infinity);
    for(let i=0;i<indices.length;i+=3){
      const a=indices[i],b=indices[i+1],c=indices[i+2],pa=a*3,pb=b*3,pc=c*3;
      const ax=projected[pa],ay=projected[pa+1],az=projected[pa+2];
      const bx=projected[pb]-ax,by=projected[pb+1]-ay,bz=projected[pb+2]-az;
      const cx=projected[pc]-ax,cy=projected[pc+1]-ay,cz=projected[pc+2]-az;
      const det=bx*cy-by*cx;if(Math.abs(det)<.015)continue;
      const x0=Math.max(0,Math.floor(ax+Math.min(0,bx,cx))),x1=Math.min(w-1,Math.ceil(ax+Math.max(0,bx,cx)));
      const y0=Math.max(0,Math.floor(ay+Math.min(0,by,cy))),y1=Math.min(h-1,Math.ceil(ay+Math.max(0,by,cy)));
      const ua=uv[a*2],va=uv[a*2+1],ub=uv[b*2]-ua,vb=uv[b*2+1]-va,uc=uv[c*2]-ua,vc=uv[c*2+1]-va;
      for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
        const u=((x+.5-ax)*cy-(y+.5-ay)*cx)/det,v=(bx*(y+.5-ay)-by*(x+.5-ax))/det;
        if(u<0||v<0||u+v>1)continue;
        const j=y*w+x,z=az+u*bz+v*cz;if(z>=depths[j])continue;
        depths[j]=z;const tx=Math.floor((ua+u*ub+v*uc)*1023/65535),ty=Math.floor((va+u*vb+v*vc)*1023/65535);
        colors[j]=pixels[ty*1024+tx];
      }
    }
    ctx.putImageData(output,0,0);
  }
  return {resize,draw};
}
