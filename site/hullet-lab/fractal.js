/* HULLET LAB / phi-field: extra geometry in the original Jesus WebGL context.
   Exact golden-angle phyllotaxis, 13-arm logarithmic spirals, 19-circle lattice,
   and Fibonacci sphere constellations. No extra canvas, render loop or dependencies. */
(function () {
  "use strict";
  const Figure=window.JesusFigure;
  if (!Figure) return;
  const TAU=Math.PI*2, PHI=(1+Math.sqrt(5))/2, GOLDEN_ANGLE=TAU/(PHI*PHI);
  const fibonacci=n=>{let a=0,b=1;for(let i=0;i<n;i++){const t=a+b;a=b;b=t;}return a;};
  function spherePoint(i,n){
    const y=1-2*(i+.5)/n, r=Math.sqrt(Math.max(0,1-y*y)),a=i*GOLDEN_ANGLE;
    return [r*Math.cos(a),y,r*Math.sin(a)];
  }
  window.HulletMath=Object.freeze({PHI,GOLDEN_ANGLE,fibonacci,spherePoint});
  const VERTEX=`
    precision highp float;
    attribute vec3 aPosition;
    attribute vec4 aInfo;
    uniform float uTime, uMode, uDensity, uIntensity, uScroll, uAspect, uScale, uDpr;
    uniform vec2 uCenter;
    varying mediump vec4 vInk;
    void main(){
      float kind=aInfo.x;
      float weight=1.0-smoothstep(0.0,1.02,abs(kind-uMode));
      float lod=step(aInfo.z,uDensity);
      float glow=weight*lod*uIntensity*aInfo.y;
      vec3 p=aPosition;
      float orbit=uTime*(0.018+kind*0.013)+uScroll*1.10;
      float cs=cos(orbit),sn=sin(orbit);
      p.xz=mat2(cs,-sn,sn,cs)*p.xz;
      if(kind<0.5){
        float spin=uTime*0.015+uScroll*0.25;
        cs=cos(spin);sn=sin(spin);
        p.xy=mat2(cs,-sn,sn,cs)*p.xy;
      }else if(kind<1.5){
        p.z+=sin(uTime*0.11+aInfo.w*4.0)*0.045;
      }else{
        p.y+=sin(uTime*0.10+aInfo.w*11.0)*0.016;
      }
      float depth=3.8/max(2.6,3.8-p.z);
      vec2 pos=p.xy*depth*uScale*1.12;
      pos.x/=uAspect;
      pos+=vec2(uCenter.x*2.0-1.0,1.0-uCenter.y*2.0);
      gl_Position=vec4(pos,0.0,1.0);
      gl_PointSize=clamp((1.5+aInfo.y*3.0)*uDpr*depth,1.0,6.5);
      vec3 gold=vec3(1.0,0.76,0.46),ice=vec3(0.42,0.82,1.0),violet=vec3(0.75,0.55,1.0);
      vec3 color=mix(gold,ice,clamp(kind*0.46,0.0,1.0));
      color=mix(color,violet,0.12+0.20*sin(aInfo.w*6.28318+uTime*0.08));
      vInk=vec4(color,glow);
    }
  `;
  const FRAGMENT=`
    precision mediump float;
    uniform float uPoints;
    varying mediump vec4 vInk;
    void main(){
      float falloff=1.0;
      if(uPoints>0.5){
        vec2 xy=gl_PointCoord*2.0-1.0;
        float r=length(xy);
        if(r>1.0) discard;
        falloff=1.0-smoothstep(0.15,1.0,r);
      }
      gl_FragColor=vec4(vInk.rgb,vInk.a*falloff);
    }
  `;
  function compile(gl,type,text){
    const shader=gl.createShader(type);
    gl.shaderSource(shader,text);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
      const reason=gl.getShaderInfoLog(shader);gl.deleteShader(shader);
      throw new Error("Phi shader: "+reason);
    }
    return shader;
  }
  function program(gl){
    const vs=compile(gl,gl.VERTEX_SHADER,VERTEX),fs=compile(gl,gl.FRAGMENT_SHADER,FRAGMENT);
    const p=gl.createProgram();
    gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);
    gl.deleteShader(vs);gl.deleteShader(fs);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS)){
      const reason=gl.getProgramInfoLog(p);gl.deleteProgram(p);
      throw new Error("Phi program: "+reason);
    }
    return p;
  }
  function buildGeometry(gl){
    const lines=[],stars=[];
    // Seven floats per vertex: xyz, scene index, opacity, deterministic detail, tint.
    function vertex(out,p,mode,alpha,lod,tint){out.push(p[0],p[1],p[2],mode,alpha,lod,tint);}
    function line(a,b,mode,alpha,lod,tint){
      vertex(lines,a,mode,alpha,lod,tint);vertex(lines,b,mode,alpha,lod,tint);
    }
    const radial=[];
    // 987 and 13 are Fibonacci numbers. Golden angle = 2pi/phi^2.
    for(let i=0;i<987;i++){
      const r=Math.sqrt((i+.5)/987)*1.03,angle=i*GOLDEN_ANGLE;
      const p=[r*Math.cos(angle),r*Math.sin(angle),-0.46+0.16*Math.sin(angle*3)];
      radial.push(p);
      vertex(stars,p,0,0.35+(i%13)/70,(i%21)/21,(i%89)/89);
      if(i>21&&i%2===0)line(radial[i-13],p,0,0.085,(i%34)/34,(i%13)/13);
      if(i>34&&i%3===0)line(radial[i-21],p,0,0.060,(i%55)/55,(i%21)/21);
    }
    // Exact logarithmic growth: each quarter-turn multiplies radius by phi.
    for(let arm=0;arm<13;arm++){
      let previous=null;
      for(let i=0;i<=116;i++){
        const t=i/116,theta=t*3.8*Math.PI+arm*TAU/13;
        const r=0.026*Math.pow(PHI,theta/(Math.PI/2)-arm*4/13);
        const p=[Math.cos(theta)*r,Math.sin(theta)*r,-0.35+0.10*Math.cos(theta*0.5+arm)];
        if(previous)line(previous,p,0,0.16*(0.3+0.7*t),(arm%5)/5,arm/13);
        previous=p;
      }
    }
    // Nineteen equal-radius circles on a hexagonal lattice: flower-of-life.
    const centers=[[0,0]];
    for(let ring=1;ring<=2;ring++){
      for(let side=0;side<6;side++){
        for(let step=0;step<ring;step++){
          const a=side*TAU/6, b=(side+1)*TAU/6;
          const x=ring*Math.cos(a)+(ring*Math.cos(b)-ring*Math.cos(a))*step/ring;
          const y=ring*Math.sin(a)+(ring*Math.sin(b)-ring*Math.sin(a))*step/ring;
          centers.push([x*.34,y*.34]);
        }
      }
    }
    centers.forEach(([cx,cy],index)=>{
      let last=null;
      for(let i=0;i<=94;i++){
        const a=i/94*TAU;
        const p=[cx+Math.cos(a)*.34,cy+Math.sin(a)*.34,-.42+.12*Math.sin(a*3+index)];
        if(last)line(last,p,1,0.14,(index%7)/7,index/19);
        last=p;
      }
    });
    // Eight Sierpiński triangles: genuinely self-similar fractal geometry.
    // Four recursive levels, computed only once and uploaded as static lines.
    function mid(a,b){return [(a[0]+b[0])*.5,(a[1]+b[1])*.5,(a[2]+b[2])*.5];}
    function gasket(a,b,c,depth,seed){
      if(depth===0){
        const detail=(seed%13)/13,opacity=.16;
        line(a,b,1,opacity,detail,seed/55);
        line(b,c,1,opacity,detail,seed/55);
        line(c,a,1,opacity,detail,seed/55);
        return;
      }
      const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);
      gasket(a,ab,ca,depth-1,seed);
      gasket(ab,b,bc,depth-1,seed);
      gasket(ca,bc,c,depth-1,seed);
    }
    for(let satellite=0;satellite<8;satellite++){
      const theta=satellite*TAU/8, cx=Math.cos(theta)*.91,cy=Math.sin(theta)*.91;
      const radius=.19,z=-.52+.06*Math.sin(theta*2);
      gasket([cx,cy+radius,z],[cx-radius,cy-radius,z],
             [cx+radius,cy-radius,z],4,satellite+1);
    }

    // Icosahedral-feeling Fibonacci sphere: points distributed uniformly with
    // golden angle, connected by Fibonacci-number offsets rather than randomness.
    const constellation=[];
    for(let i=0;i<610;i++){
      const v=spherePoint(i,610);
      const p=[v[0]*1.03,v[1]*1.11,v[2]*.48-.48];
      constellation.push(p);
      vertex(stars,p,2,0.22+0.30*(i%13)/13,(i%55)/55,(i%233)/233);
      if(i>=13 && i%2===0)line(constellation[i-13],p,2,0.115,(i%34)/34,(i%89)/89);
      if(i>=21 && i%3===0)line(constellation[i-21],p,2,0.075,(i%21)/21,(i%55)/55);
    }
    // Golden-ratio meridians give actual structure and depth to the constellation.
    for(let meridian=0;meridian<13;meridian++){
      let last=null;
      for(let j=0;j<=89;j++){
        const t=j/89,lat=(t-.5)*Math.PI,lon=meridian*GOLDEN_ANGLE+t*TAU/8;
        const p=[Math.cos(lat)*Math.cos(lon),Math.sin(lat)*1.10,
                 Math.cos(lat)*Math.sin(lon)*.48-.49];
        if(last)line(last,p,2,.095,(meridian%8)/8,meridian/13);
        last=p;
      }
    }
    // 5, 8 and 13-fold wire orbits: an airy geometrical transition.
    for(let petals of [5,8,13]){
      let last=null;
      for(let j=0;j<=233;j++){
        const t=j/233,a=t*TAU;
        const r=.61+.28*Math.cos(a*petals);
        const p=[r*Math.cos(a),r*Math.sin(a),-.47+.10*Math.sin(a*petals)];
        if(last)line(last,p,1,.08,(j%21)/21,petals/13);
        last=p;
      }
    }
    function upload(a){
      const buffer=gl.createBuffer();if(!buffer)throw new Error("Phi geometry buffer missing");
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(a),gl.STATIC_DRAW);
      return {buffer,count:a.length/7};
    }
    const shaderProgram=program(gl);
    try{
      return {program:shaderProgram,lines:upload(lines),stars:upload(stars),
        lineCount:lines.length/14,starCount:stars.length/7};
    }catch(e){gl.deleteProgram(shaderProgram);throw e;}
  }
  const originalLoad=Figure.prototype.load;
  Figure.prototype.load=function(src){
    return originalLoad.call(this,src).then(result=>{
      try{this._phi=buildGeometry(this.gl);}
      catch(error){this._phi=null;console.warn("Phi geometry disabled; original Jesus remains intact",error);}
      return result;
    });
  };
  const originalDraw=Figure.prototype.draw;
  Figure.prototype.draw=function(state){
    const gl=this.gl,geom=this._phi;
    if(geom && this.ready && state && Number(state.reveal)>0.0001 && !gl.isContextLost()){
      const p=geom.program,mode=Math.max(0,Math.min(2,Number(state.geometryMode)||0));
      const density=Math.max(.15,Math.min(1,Number(state.geometryDensity)||1));
      const intensity=Math.max(0,Math.min(1.6,Number(state.geometryIntensity)||0));
      if(intensity>0.001){
        gl.bindFramebuffer(gl.FRAMEBUFFER,null);
        gl.viewport(0,0,state.width,state.height);
        gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.disable(gl.SCISSOR_TEST);
        gl.disable(gl.STENCIL_TEST);gl.depthMask(false);
        gl.colorMask(true,true,true,true);
        gl.enable(gl.BLEND);gl.blendEquation(gl.FUNC_ADD);
        gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(p);
        const uniform=(n)=>gl.getUniformLocation(p,n);
        gl.uniform1f(uniform("uTime"),state.reducedMotion?0:state.time||0);
        gl.uniform1f(uniform("uMode"),mode);
        gl.uniform1f(uniform("uDensity"),density);
        gl.uniform1f(uniform("uIntensity"),intensity*(state.reveal||0));
        gl.uniform1f(uniform("uScroll"),state.reducedMotion?0:state.scene||0);
        gl.uniform1f(uniform("uAspect"),state.width/Math.max(1,state.height));
        gl.uniform1f(uniform("uScale"),Math.min(.85,Math.max(.45,state.width/state.height*.6)));
        gl.uniform1f(uniform("uDpr"),state.dpr||1);
        gl.uniform2f(uniform("uCenter"),state.centerX||.5,state.centerY||.5);
        const position=gl.getAttribLocation(p,"aPosition"),info=gl.getAttribLocation(p,"aInfo");
        for(let i=0;i<gl.getParameter(gl.MAX_VERTEX_ATTRIBS);i++)gl.disableVertexAttribArray(i);
        function bind(buffer){
          gl.bindBuffer(gl.ARRAY_BUFFER,buffer.buffer);
          gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,3,gl.FLOAT,false,28,0);
          gl.enableVertexAttribArray(info);gl.vertexAttribPointer(info,4,gl.FLOAT,false,28,12);
        }
        gl.uniform1f(uniform("uPoints"),0);
        bind(geom.lines);gl.lineWidth(1);gl.drawArrays(gl.LINES,0,geom.lines.count);
        gl.uniform1f(uniform("uPoints"),1);
        bind(geom.stars);gl.drawArrays(gl.POINTS,0,geom.stars.count);
      }
    }
    originalDraw.call(this,state);
  };
  const originalDispose=Figure.prototype.dispose;
  Figure.prototype.dispose=function(){
    if(this._phi){
      this.gl.deleteBuffer(this._phi.lines.buffer);
      this.gl.deleteBuffer(this._phi.stars.buffer);
      this.gl.deleteProgram(this._phi.program);
      this._phi=null;
    }
    originalDispose.call(this);
  };
})();
