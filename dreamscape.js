/* Dreamscape — an original Y2K liquid-chrome world, rendered in WebGL 1.
 * new Dreamscape(gl).draw({width,height,time,pointer,reducedMotion,
 *   dreamReveal:0..1, dreamOpacity:0..1, centerX:.5});
 * A zero reveal is exactly black. Reduced motion freezes all drift/parallax.
 * Owns its GL state; shares the context with AnatomyFigure and JesusFigure.
 */
(function (global) {
  'use strict';
  var vertex = 'attribute vec2 aPosition; varying vec2 vUv; void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}';
  var fragment = `
precision highp float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uTime;
uniform float uReveal;
uniform float uOpacity;
uniform float uCenterX;

const vec3 ICE = vec3(.43,.84,.94);
const vec3 LILAC = vec3(.60,.37,.85);
const vec3 ROSE = vec3(.96,.40,.62);
const vec3 PEARL = vec3(.75,.79,.94);

float hash(vec2 p){p=fract(p*vec2(.1031,.11369));p+=dot(p,p.yx+19.19);return fract((p.x+p.y)*p.x);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
float mist(vec2 p){float a=noise(p)*.57;p=mat2(.8,-.6,.6,.8)*p*2.03+7.9;a+=noise(p)*.28;p=p*2.01+4.7;return a+noise(p)*.15;}
mat2 turn(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}

// A restrained iridescent environment is reflected by the arches and water.
vec3 atmosphere(vec3 rd){
  float y=rd.y;
  float horizon=exp(-abs(y)*6.4);
  vec3 col=mix(vec3(.020,.012,.054),vec3(.091,.110,.155),horizon);
  col+=LILAC*exp(-pow((y-.27)*3.5,2.))*.080;
  col+=ICE*exp(-pow((y+.015)*14.,2.))*.040;
  float x=rd.x*1.3;
  float drift=uTime*.011;
  float curtain=sin(x*2.6+sin(y*4.1+drift)*.55+drift);
  float silk=exp(-pow((y-.26-curtain*.13)*9.0,2.));
  float echo=exp(-pow((y-.38-sin(x*3.4-drift)*.11)*16.,2.));
  col+=mix(ICE,LILAC,.5+.5*sin(x*2.0+.8))*silk*.085;
  col+=ROSE*echo*.034;
  // Curved iridescent ribbons give the sky depth without busy particles or
  // expensive volumetric loops. Their shapes reappear softly in the sea.
  float sweep=y-.28-sin(x*1.7+drift*.7)*.115;
  float ribbon=exp(-sweep*sweep*250.0);
  float rim=exp(-pow((sweep-.052)*42.,2.));
  float arc=y-.41+sin(x*1.18-drift)*.20;
  col+=mix(LILAC,ICE,.5+.5*sin(x*1.6+1.3))*ribbon*.062;
  col+=ICE*rim*.032+ROSE*exp(-arc*arc*420.)*.024;
  float cloud=mist(vec2(x*2.0,y*2.7)+vec2(drift,-drift*.5));
  col+=mix(LILAC,PEARL,cloud)*pow(cloud,3.)*.065*smoothstep(-.03,.24,y);
  // Eclipsed pearl moon, intentionally small and off the body's axis.
  vec2 mp=vec2(rd.x-.50,rd.y-.37);
  float moon=length(mp);
  col+=LILAC*exp(-moon*moon*22.)*.10;
  float disk=1.-smoothstep(.075,.080,moon);
  float eclipse=1.-smoothstep(.071,.075,length(mp-vec2(.026,.012)));
  col=mix(col,vec3(.30,.31,.40),disk*.74);
  col=mix(col,vec3(.035,.032,.076),eclipse*disk*.97);
  col+=PEARL*exp(-pow((moon-.078)*245.,2.))*.26;
  return col;
}

float glints(vec2 p,float scale,float seed){
  vec2 cells=p*scale;
  vec2 cell=floor(cells);
  float h=hash(cell+seed);
  vec2 q=fract(cells)-vec2(.22+.55*hash(cell+1.7),.22+.55*hash(cell+4.9));
  float core=exp(-dot(q,q)*1600.);
  float cross=exp(-abs(q.x)*110.-abs(q.y)*16.)+exp(-abs(q.x)*16.-abs(q.y)*110.);
  float twinkle=.78+.22*sin(uTime*.5+h*12.);
  return (core+cross*.19)*step(.982,h)*twinkle;
}

// An elliptical chrome tube with an analytic rounded surface normal. This
// is shaded as a curved object, not a flat neon outline. No ray march needed.
vec4 chromeRing(vec2 p,vec2 center,vec2 radius,float angle,float thickness,float phase,float alpha){
  mat2 rotation=turn(angle);
  vec2 local=rotation*(p-center);
  vec2 q=local/radius;
  float l=length(q);
  float gradient=length(q/(radius*max(l,.0001)));
  float d=(l-1.)/max(gradient,.0001);
  float aa=2.0/max(uResolution.y,1.0);
  float mask=1.-smoothstep(thickness-aa,thickness+aa,abs(d));
  if(mask<.001) return vec4(0.);
  vec2 radial=normalize(q/radius);
  float edge=clamp(d/thickness,-1.,1.);
  vec3 normal=normalize(vec3(radial*edge,sqrt(max(1.-edge*edge,0.))));
  normal.xy=turn(-angle)*normal.xy;
  vec3 reflection=reflect(vec3(0.,0.,-1.),normal);
  vec3 material=atmosphere(vec3(reflection.x,reflection.y+.16,reflection.z));
  float stripe=.5+.5*sin(reflection.y*6.8+reflection.x*2.4+phase);
  float edgeLight=pow(1.-max(normal.z,0.),3.);
  float highlight=pow(max(dot(normal,normalize(vec3(-.48,.71,.48))),0.),30.);
  float silverBand=smoothstep(-.34,-.14,reflection.y)-smoothstep(.17,.39,reflection.y);
  vec3 color=material*1.55+mix(vec3(.031,.030,.068),PEARL*.32,pow(stripe,8.));
  color+=PEARL*silverBand*.18;
  color+=mix(ICE,ROSE,.5+.5*sin(phase+local.y*2.0))*edgeLight*.15;
  color+=PEARL*highlight*.95;
  float waist=.42+.58*smoothstep(-.65,.55,local.y);
  return vec4(color,mask*alpha*waist);
}

vec3 pearlSea(vec3 ro,vec3 rd,vec3 sky){
  if(rd.y>=-.009) return sky;
  float hit=-ro.y/rd.y;
  if(hit>260.) return sky;
  vec3 p=ro+rd*hit;
  float t=uTime;
  float a=p.x*.48+p.z*.31-t*.18;
  float b=p.x*-.24+p.z*.71+t*.13;
  float c=p.z*1.67-p.x*.45-t*.24;
  vec2 slope=cos(a)*vec2(.48,.31)*.075+cos(b)*vec2(-.24,.71)*.035+cos(c)*vec2(-.45,1.67)*.007;
  vec3 n=normalize(vec3(-slope.x,1.,-slope.y));
  vec3 reflectDir=reflect(rd,n);
  vec3 reflected=atmosphere(reflectDir);
  float fresnel=.18+.82*pow(1.-max(dot(n,-rd),0.),4.0);
  float pearl=.5+.5*sin(p.z*.28+p.x*.11+t*.05);
  vec3 col=mix(mix(vec3(.030,.035,.071),vec3(.078,.056,.102),pearl),reflected*.93,fresnel);
  float ripple=sin(p.z*1.1+sin(p.x*.64+t*.10)*.85-t*.13);
  float glimmer=pow(max(ripple,0.),25.0)*exp(-abs(p.x)*.22)*.011;
  col+=ICE*glimmer;
  // Long reflective horizon bands and a quiet iridescent central pathway.
  float path=exp(-pow(p.x/(.75+abs(p.z)*.14),2.))*exp(-abs(p.z+10.)*.014);
  col+=mix(LILAC,ICE,.5+.5*sin(p.z*.11+t*.07))*path*.042;
  float silken=.5+.5*cos(p.z*.38+sin(p.x*.24+t*.06)*1.8-t*.06);
  float opal=.5+.5*sin(p.x*.17+p.z*.14+t*.04);
  col+=mix(ICE,LILAC,opal)*pow(silken,5.)*path*.035;
  col+=PEARL*pow(max(dot(reflectDir,normalize(vec3(.42,.14,-1.))),0.),120.)*.18;
  return mix(col,sky,1.-exp(-hit*.009));
}

void main(){
  if(uReveal<=.000001){gl_FragColor=vec4(0.,0.,0.,uOpacity);return;}
  float aspect=uResolution.x/max(uResolution.y,1.0);
  vec2 p=vec2((vUv.x-uCenterX)*2.*aspect,vUv.y*2.-1.);
  p+=uPointer*vec2(.014,.009);
  vec3 ro=vec3(uPointer.x*.1,1.8+uPointer.y*.04,7.);
  vec3 rd=normalize(vec3(p.x*.66,p.y*.66+.13,-1.5));
  vec3 sky=atmosphere(rd);
  vec3 col=pearlSea(ro,rd,sky);
  float atmosphericArc=p.y-.53-.18*cos(p.x*1.25+uTime*.010);
  vec3 arcColor=mix(ICE,LILAC,.5+.5*sin(p.x*.9+.6));
  col+=arcColor*(exp(-pow(atmosphericArc*30.,2.))*.023+exp(-pow(atmosphericArc*8.0,2.))*.014);
  float mirrorArc=p.y+.84+.095*cos(p.x*1.25+uTime*.010);
  col+=mix(LILAC,ICE,.5+.5*sin(p.x*1.7))
       *exp(-pow(mirrorArc*15.,2.))*.016;
  float horizon=exp(-pow((p.y+.196)*28.,2.));
  col+=ICE*horizon*.018;
  float side=min(aspect,1.55);
  float narrow=1.-smoothstep(.70,1.10,aspect);
  float drift=sin(uTime*.07)*.012;
  // The side arches frame the body; distant circles float behind them.
  vec4 ring=chromeRing(p,vec2(side*(.93+narrow*.68),.09+drift),vec2(.36+side*.13-narrow*.07,.84),-.24+drift,.026,1.2,.9);
  col=mix(col,ring.rgb,ring.a);
  ring=chromeRing(p,vec2(-side*(1.01+narrow*.65),.21-drift),vec2(.31+side*.13-narrow*.05,.69),.29-drift,.019,2.7,.69);
  col=mix(col,ring.rgb,ring.a);
  // Small orbiting satellite and its suspended silver ellipse.
  ring=chromeRing(p,vec2(side*.56,.50),vec2(.20,.09),-.40+uTime*.009,.009,4.0,.74);
  col=mix(col,ring.rgb,ring.a);
  ring=chromeRing(p,vec2(-side*.49,.03),vec2(.33,.075),.28+uTime*.006,.007,2.8,.35);
  col=mix(col,ring.rgb,ring.a);
  // Four-point optical glints, sparse enough to read as depth, not confetti.
  float stars=glints(p+vec2(uTime*.0015,0.),7.5,1.)+glints(p,15.,8.)*.24;
  col+=PEARL*stars*.31*smoothstep(-.42,.14,p.y);
  vec2 spark=p-vec2(side*.68,.73+drift);
  float sparkle=exp(-dot(spark,spark)*2300.)+exp(-abs(spark.x)*340.-abs(spark.y)*46.)*.25+exp(-abs(spark.x)*46.-abs(spark.y)*340.)*.25;
  col+=PEARL*sparkle*.54;
  // Indigo corners leave room for the homepage copy and anchor the body.
  float vignette=1.-smoothstep(.20,1.22,length((vUv-.5)*vec2(1.25,.92)));
  col*=mix(.40,1.,vignette);
  float desktop=smoothstep(1.12,1.40,aspect);
  float copyShade=1.-smoothstep(.12,.47,vUv.x);
  col*=1.-copyShade*desktop*.24;
  col=max(col,vec3(0.));
  col=vec3(1.)-exp(-col*1.42);
  col=pow(col,vec3(.86));
  // Brightness, not alpha, brings the dream out of absolute black.
  col*=smoothstep(0.,1.,uReveal);
  gl_FragColor=vec4(col,uOpacity);
}
`;

  function number(value, fallback) { return typeof value === 'number' && isFinite(value) ? value : fallback; }
  function unit(value, fallback) { return Math.max(0, Math.min(1, number(value, fallback))); }
  function compile(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      var log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error('Dreamscape shader: ' + log);
    }
    return shader;
  }
  function Dreamscape(gl) {
    if (!(this instanceof Dreamscape)) return new Dreamscape(gl);
    if (!gl) throw new Error('Dreamscape requires WebGL.');
    this.gl = gl;
    var highp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    var source = highp && highp.precision ? fragment : fragment.replace('precision highp float;', 'precision mediump float;');
    var vs = compile(gl, gl.VERTEX_SHADER, vertex), fs;
    try { fs = compile(gl, gl.FRAGMENT_SHADER, source); }
    catch (error) { gl.deleteShader(vs); throw error; }
    this.program = gl.createProgram();
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.bindAttribLocation(this.program, 0, 'aPosition');
    gl.linkProgram(this.program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      var log = gl.getProgramInfoLog(this.program);
      gl.deleteProgram(this.program);
      throw new Error('Dreamscape program: ' + log);
    }
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
    this.uniforms = {};
    var names = ['uResolution','uPointer','uTime','uReveal','uOpacity','uCenterX'];
    for (var i = 0; i < names.length; i++) this.uniforms[names[i]] = gl.getUniformLocation(this.program, names[i]);
    this.maxAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    this.vaoExtension = gl.getExtension('OES_vertex_array_object');
    this.instancingExtension = gl.getExtension('ANGLE_instanced_arrays');
    this.disposed = false;
  }
  Dreamscape.prototype.draw = function (state) {
    if (this.disposed) return;
    state = state || {};
    var gl = this.gl, u = this.uniforms;
    var opacity = unit(state.dreamOpacity, 1);
    if (opacity <= 0) return;
    var width = Math.max(1, number(state.width, gl.drawingBufferWidth));
    var height = Math.max(1, number(state.height, gl.drawingBufferHeight));
    var reduced = !!state.reducedMotion;
    var pointer = state.pointer || [0,0];
    if (this.vaoExtension) this.vaoExtension.bindVertexArrayOES(null);
    for (var i = 0; i < this.maxAttributes; i++) {
      gl.disableVertexAttribArray(i);
      if (this.instancingExtension) this.instancingExtension.vertexAttribDivisorANGLE(i, 0);
    }
    gl.viewport(0, 0, width, height);
    gl.useProgram(this.program);
    gl.disable(gl.DEPTH_TEST); gl.depthMask(false);
    gl.disable(gl.CULL_FACE); gl.disable(gl.SCISSOR_TEST); gl.disable(gl.STENCIL_TEST);
    gl.colorMask(true, true, true, true);
    if (opacity < 1) {
      gl.enable(gl.BLEND); gl.blendEquation(gl.FUNC_ADD);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    } else gl.disable(gl.BLEND);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(u.uResolution, width, height);
    gl.uniform2f(u.uPointer, reduced ? 0 : number(pointer[0],0), reduced ? 0 : number(pointer[1],0));
    gl.uniform1f(u.uTime, reduced ? 0 : Math.max(0, number(state.time,0)));
    gl.uniform1f(u.uReveal, unit(state.dreamReveal,0));
    gl.uniform1f(u.uOpacity, opacity);
    gl.uniform1f(u.uCenterX, unit(state.centerX,.5));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disableVertexAttribArray(0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  };
  Dreamscape.prototype.dispose = function () {
    if (this.disposed) return;
    this.gl.deleteBuffer(this.buffer);
    this.gl.deleteProgram(this.program);
    this.disposed = true;
  };
  global.Dreamscape = Dreamscape;
})(window);
