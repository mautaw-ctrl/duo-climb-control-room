(() => {
  "use strict";
  const canvas = document.querySelector("#universe");
  const toggle = document.querySelector("#motion-toggle");
  const buttons = [...document.querySelectorAll("[data-chapter]")];
  const chapters = [...document.querySelectorAll(".chapter")];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const notes = [
    "Kærlighed er en bevægelse.<br> Følg den, og se hvor du lander.",
    "En tone kan åbne noget i os.<br> Her er der plads til at lytte.",
    "Nysgerrighed har sin egen frekvens.<br> Skru lidt op for mulighederne."
  ];
  let activeChapter = -1;
  let sceneTarget = 0;
  let scene = 0;
  let paused = reducedMotion.matches;
  let elapsed = 0;
  let previous = performance.now();
  let pointerX = 0, pointerY = 0, cameraX = 0, cameraY = 0;
  let dirty = true;

  function updateToggle() {
    toggle.setAttribute("aria-pressed", String(paused));
    toggle.setAttribute("aria-label", paused ? "Afspil animation" : "Sæt animation på pause");
  }
  updateToggle();
  toggle.addEventListener("click", () => { paused = !paused; updateToggle(); dirty = true; });
  reducedMotion.addEventListener("change", event => { paused = event.matches; updateToggle(); dirty = true; });
  buttons.forEach(button => button.addEventListener("click", () => {
    chapters[Number(button.dataset.chapter)].scrollIntoView({ behavior: reducedMotion.matches ? "instant" : "smooth" });
  }));

  function updateScroll() {
    const y = window.scrollY;
    let target = 2;
    for (let i = 0; i < 2; i++) {
      if (y < chapters[i + 1].offsetTop) {
        target = i + Math.max(0, (y - chapters[i].offsetTop) / (chapters[i + 1].offsetTop - chapters[i].offsetTop));
        break;
      }
    }
    sceneTarget = Math.min(2, Math.max(0, target));
    const index = Math.round(sceneTarget);
    dirty = true;
    if (index === activeChapter) return;
    activeChapter = index;
    buttons.forEach((button, i) => {
      button.classList.toggle("is-active", i === index);
      if (i === index) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    document.querySelector("#scene-note").innerHTML = notes[index];
    document.documentElement.style.setProperty("--accent", ["#ffe07e", "#d5eeef", "#b9dcff"][index]);
    document.documentElement.style.setProperty("--art-y", `${index * 50}%`);
    document.documentElement.style.setProperty("--art-x", ["60%", "53%", "57%"][index]);
    const cue = document.querySelector("#scroll-cue");
    cue.href = "#" + chapters[index === 2 ? 0 : index + 1].id;
    cue.classList.toggle("is-last", index === 2);
    cue.setAttribute("aria-label", index === 2 ? "Tilbage til toppen" : "Fortsæt til næste kapitel");
  }
  window.addEventListener("scroll", updateScroll, { passive: true });
  updateScroll();
  window.addEventListener("pointermove", event => {
    if (event.pointerType === "touch") return;
    pointerX = (event.clientX / innerWidth - .5) * 2;
    pointerY = (event.clientY / innerHeight - .5) * 2;
  }, { passive: true });
  document.addEventListener("pointerleave", () => { pointerX = 0; pointerY = 0; });

  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
  function useFallback() {
    document.body.classList.remove("art-ready");
    document.body.classList.add("no-webgl");
    toggle.disabled = true;
    toggle.setAttribute("aria-label", "Animation er ikke tilgængelig i denne browser");
  }
  if (!gl) { useFallback(); return; }

  const vertexSource = `
    attribute vec2 aPosition;
    varying vec2 vUv;
    void main() { vUv = aPosition * .5 + .5; gl_Position = vec4(aPosition, 0.0, 1.0); }
  `;
  const fragmentSource = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uAtlas;
    uniform float uTime;
    uniform float uScene;
    uniform float uAspect;
    uniform float uAtlasAspect;
    uniform vec2 uPointer;
    uniform vec2 uResolution;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
    }
    vec3 readScene(float index, vec2 screen) {
      float mobile = 1.0-smoothstep(.65,1.2,uAspect);
      float focus = index < .5 ? mix(.566,.628,mobile) : index < 1.5 ? mix(.505,.565,mobile) : mix(.538,.593,mobile);
      vec2 uv = vec2(screen.x,1.0-screen.y);
      float ratio = uAspect/uAtlasAspect;
      if (ratio < 1.0) uv.x = (uv.x-.5)*ratio+focus;
      else uv.y = (uv.y-.5)/ratio+.5;

      vec2 face = index < .5 ? vec2(.63,.36) : index < 1.5 ? vec2(.565,.18) : vec2(.59,.22);
      float protect = 1.0-smoothstep(.6,1.6,length((uv-face)/vec2(.052,.20)));
      float flow = 1.0-protect;
      vec2 wave = vec2(sin(uv.y*15.0+uTime*.27),cos(uv.x*14.0-uTime*.19));
      float atmosphere = noise(uv*5.0+vec2(uTime*.025,-uTime*.017));
      uv += wave * vec2(.004,.011) * flow * (.4+atmosphere);
      uv += uPointer*vec2(.0015,.0025)*(1.0-protect*.85);
      uv = (uv-vec2(focus,.5))*(1.0-.007*sin(uTime*.12))+vec2(focus,.5);
      uv = clamp(uv, vec2(.001,.002), vec2(.999,.998));
      vec2 atlasUv = vec2(uv.x,1.0-(index+uv.y)/3.0);
      vec3 color = texture2D(uAtlas,atlasUv).rgb;

      float luminance = dot(color,vec3(.2126,.7152,.0722));
      float breathing = .985+.04*sin(uTime*.17+uv.x*5.0-uv.y*4.0)*flow;
      color *= breathing;
      if(index < .5) {
        float hueFlow = (.5+.5*sin(uTime*.13+uv.y*7.0+atmosphere*4.0))*.19*flow;
        color = mix(color,color.brg,hueFlow);
        color += vec3(.035,.005,.042)*pow(luminance,1.8)*flow*(.5+.5*sin(uTime*.4+uv.y*10.0));
      } else {
        float ray = pow(max(0.0,sin(uv.x*23.0+uv.y*6.0-uTime*.12)),10.0);
        color += vec3(.025,.023,.016)*ray*luminance*flow;
      }
      float printTexture = .99+.01*sin(screen.y*uResolution.y*1.2);
      return color*printTexture;
    }
    void main() {
      float first = floor(uScene);
      float second = min(first+1.0,2.0);
      float progress = fract(uScene);
      float grain = noise(vUv*9.0+uTime*.015);
      float dissolve = smoothstep(grain*.24, .76+grain*.24, progress);
      vec3 a = readScene(first,vUv);
      vec3 b = readScene(second,vUv);
      gl_FragColor = vec4(mix(a,b,dissolve),1.0);
    }
  `;
  const particleVertex = `
    precision highp float;
    attribute vec4 aSeed;
    uniform float uTime;
    uniform float uScene;
    uniform float uDpr;
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
      float drift = uTime*(.008+aSeed.z*.008);
      float x = fract(aSeed.x+.012*sin(aSeed.y*8.0+uTime*.12));
      float y = fract(aSeed.y+drift);
      gl_Position = vec4(x*2.0-1.0,y*2.0-1.0,0,1);
      gl_PointSize = (1.0+aSeed.z*2.0)*uDpr;
      vec3 gold = vec3(1.0,.77,.36);
      vec3 pink = vec3(1.0,.25,.55);
      vColor = mix(gold,pink,step(.7,aSeed.w)*(1.0-smoothstep(0.0,1.0,uScene)));
      vColor = mix(vColor,vec3(.56,.83,1.0),smoothstep(1.0,2.0,uScene));
      float centerMask = smoothstep(.07,.38,abs(x-.68));
      vAlpha = (.1+.18*aSeed.z)*(.4+.6*sin(uTime*.4+aSeed.w*16.0))*centerMask;
    }
  `;
  const particleFragment = `
    precision mediump float;
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
      float radius = length(gl_PointCoord-.5);
      if(radius>.5) discard;
      gl_FragColor = vec4(vColor,exp(-radius*radius*15.0)*vAlpha);
    }
  `;

  function makeProgram(vertex, fragment) {
    const program = gl.createProgram();
    for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]]) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      gl.attachShader(program,shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    return program;
  }
  let imageProgram, glowProgram;
  try { imageProgram = makeProgram(vertexSource,fragmentSource); glowProgram = makeProgram(particleVertex,particleFragment); }
  catch (error) { console.error("Animation could not start:", error); useFallback(); return; }

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,quad);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position = gl.getAttribLocation(imageProgram,"aPosition");
  const imageUniforms = Object.fromEntries(["uAtlas","uTime","uScene","uAspect","uAtlasAspect","uPointer","uResolution"].map(name => [name,gl.getUniformLocation(imageProgram,name)]));
  const particleUniforms = Object.fromEntries(["uTime","uScene","uDpr"].map(name => [name,gl.getUniformLocation(glowProgram,name)]));
  const particleCount = innerWidth < 650 ? 240 : 650;
  const seeds = new Float32Array(particleCount*4);
  let randomSeed = 1791687335;
  for (let i = 0; i < seeds.length; i++) {
    randomSeed ^= randomSeed << 13; randomSeed ^= randomSeed >>> 17; randomSeed ^= randomSeed << 5;
    seeds[i] = (randomSeed >>> 0)/4294967296;
  }
  const particleBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,particleBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,seeds,gl.STATIC_DRAW);
  const seedPosition = gl.getAttribLocation(glowProgram,"aSeed");
  const texture = gl.createTexture();
  let textureReady = false;
  let atlasAspect = 5.3305;
  let dpr = 1;

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, innerWidth < 650 ? 1.25 : 1.5);
    canvas.width = Math.round(innerWidth*dpr); canvas.height = Math.round(innerHeight*dpr);
    gl.viewport(0,0,canvas.width,canvas.height);
    dirty = true; updateScroll();
  }
  window.addEventListener("resize",resize,{ passive: true });
  resize();
  const artwork = new Image();
  artwork.onload = () => {
    try {
      atlasAspect = artwork.naturalWidth/(artwork.naturalHeight/3);
      gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,artwork);
      textureReady = true; dirty = true;
    } catch (error) { console.error("Artwork could not load:",error); useFallback(); }
  };
  artwork.onerror = () => { console.error("Artwork could not load."); useFallback(); };
  artwork.src = "./universe-atlas.png";
  canvas.addEventListener("webglcontextlost",event => { event.preventDefault(); textureReady = false; useFallback(); });

  function render(now) {
    const delta = Math.min((now-previous)/1000,.05); previous = now;
    if (!document.hidden && !paused) elapsed += delta;
    if (Math.abs(sceneTarget-scene)>.0005) {
      scene = paused || reducedMotion.matches ? sceneTarget : scene+(sceneTarget-scene)*(1-Math.exp(-delta*6));
      dirty = true;
    }
    if (!paused) {
      cameraX += (pointerX-cameraX)*(1-Math.exp(-delta*2));
      cameraY += (pointerY-cameraY)*(1-Math.exp(-delta*2));
    }
    if (textureReady && !document.hidden && (!paused || dirty)) {
      gl.disable(gl.BLEND);
      gl.useProgram(imageProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER,quad);
      gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.uniform1i(imageUniforms.uAtlas,0);
      gl.uniform1f(imageUniforms.uTime,elapsed+5);
      gl.uniform1f(imageUniforms.uScene,scene);
      gl.uniform1f(imageUniforms.uAspect,innerWidth/innerHeight);
      gl.uniform1f(imageUniforms.uAtlasAspect,atlasAspect);
      gl.uniform2f(imageUniforms.uPointer,cameraX,cameraY);
      gl.uniform2f(imageUniforms.uResolution,canvas.width,canvas.height);
      gl.drawArrays(gl.TRIANGLES,0,6);

      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
      gl.useProgram(glowProgram); gl.bindBuffer(gl.ARRAY_BUFFER,particleBuffer);
      gl.enableVertexAttribArray(seedPosition); gl.vertexAttribPointer(seedPosition,4,gl.FLOAT,false,0,0);
      gl.uniform1f(particleUniforms.uTime,elapsed+5);
      gl.uniform1f(particleUniforms.uScene,scene);
      gl.uniform1f(particleUniforms.uDpr,dpr);
      gl.drawArrays(gl.POINTS,0,particleCount);
      document.body.classList.add("art-ready");
      canvas.dataset.ready = "true";
      document.querySelector("#elapsed").textContent = `${String(Math.floor(elapsed/60)).padStart(2,"0")}:${String(Math.floor(elapsed%60)).padStart(2,"0")}`;
      dirty = false;
    }
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
})();
