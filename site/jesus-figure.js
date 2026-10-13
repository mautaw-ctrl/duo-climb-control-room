/* A luminous, image-seeded point volume. No textured image plane is rendered. */
(function () {
  'use strict';

  var TAU = Math.PI * 2;
  var STRIDE = 11;

  var VERTEX = `
    precision highp float;
    attribute vec3 aPosition;
    attribute vec4 aColor;
    attribute vec4 aData;
    uniform float uTime;
    uniform float uReveal;
    uniform float uLight;
    uniform float uStorm;
    uniform float uParting;
    uniform float uScene;
    uniform float uAspect;
    uniform float uScale;
    uniform float uDpr;
    uniform float uMaxSize;
    uniform float uFigureScale;
    uniform float uEntry;
    uniform float uEntryProgress;
    uniform float uScrollVelocity;
    uniform vec3 uFlight;
    uniform vec3 uRotation;
    uniform mediump float uPass;
    uniform vec2 uCenter;
    uniform vec2 uPointer;
    varying mediump vec4 vColor;

    void main() {
      float seed = aData.x;
      float kind = aData.z;
      float t = uTime;
      float phase = seed * 6.2831853;
      vec3 p = aPosition;
      float assembled = smoothstep(0.04 + seed * 0.16, 0.86 + seed * 0.10, uReveal);
      float opacity = smoothstep(0.005, 0.30 + seed * 0.18, uReveal);
      float face = smoothstep(0.40, 0.68, p.y) * (1.0 - smoothstep(0.12, 0.34, abs(p.x)));
      if (kind > 0.5) face = 0.0;

      if (kind < 0.5) {
        // Far from the body, fragments follow one continuous, unhurried current.
        // At full reveal the surface breathes with millimetre-scale movement.
        float scattered = 1.0 - assembled;
        float flow = t * 0.15 + phase;
        p.x += scattered * (sin(flow + p.y * 2.4) * 1.25 + cos(phase * 1.7) * 0.28);
        p.y += scattered * (cos(flow * 0.7 + p.x * 1.7) * 0.54 + sin(phase * 2.0) * 0.23);
        p.z += scattered * sin(phase + t * 0.11) * 0.85;
        float cloth = (1.0 - face * 0.92) * assembled;
        p.x += sin(aPosition.y * 9.0 - t * 0.42 + phase * 0.23) * 0.014 * cloth;
        p.z += sin(aPosition.y * 7.0 + t * 0.30 + phase) * 0.022 * cloth;
        p.y += sin(t * 0.34 + phase) * 0.004 * assembled;
        opacity *= mix(0.66, 1.0, assembled);
      } else if (kind < 1.5) {
        // A real torus behind the face: each particle has an angular and tube phase.
        float angle = aPosition.x + t * 0.038;
        float tube = aPosition.y;
        float radius = 0.235 + cos(tube) * 0.008;
        p = vec3(cos(angle) * radius, sin(angle) * radius + 0.735, -0.13);
        p.z += sin(tube) * 0.014 + sin(angle) * 0.044;
        p.y += sin(t * 0.35) * 0.010;
        p.x += sin(t * 0.23) * 0.012;
        opacity *= smoothstep(0.22, 0.87, uReveal);
        opacity *= 0.63 + 0.37 * pow(max(0.0, sin(angle * 5.0 - t * 0.6)), 4.0);
      } else if (kind < 2.5) {
        // Slender helices flow around, behind and in front of the body.
        float progress = fract(aPosition.x + t * (0.018 + seed * 0.004));
        float lane = aPosition.y * 6.2831853;
        float y = mix(-1.12, 1.15, progress);
        float angle = lane + y * 3.4 - t * 0.075;
        float width = 0.37 + sin(progress * 3.1415927) * 0.35 + aPosition.z * 0.06;
        width += (1.0 - assembled) * 0.30 + uParting * 0.035;
        p = vec3(cos(angle) * width, y, sin(angle) * width * 0.65);
        p.x += sin(y * 4.0 + lane + t * 0.13) * 0.08;
        opacity *= smoothstep(0.0, 0.12, progress) * (1.0 - smoothstep(0.78, 1.0, progress));
        opacity *= 0.42 * (0.35 + 0.65 * assembled);
        p.z -= abs(uScrollVelocity) * progress * 0.075;
      } else {
        // A sparse robe sample leaves a soft wake during flight. At rest these
        // satellite particles are fully transparent and cost no extra draw pass.
        float speed = min(1.0, abs(uScrollVelocity) * 0.5);
        float tail = aData.w;
        p.z -= tail * speed * 0.72;
        p.y -= uScrollVelocity * tail * 0.10;
        p.x += sin(phase + tail * 5.0 - t * 0.35) * tail * speed * 0.12;
        opacity *= smoothstep(0.035, 0.32, speed) * speed * pow(1.0 - tail, 1.5) * 0.60;
      }

      // Each entrance has an identity endpoint. The host drives a continuous
      // envelope, so changing the section at completion never teleports a point.
      float entering = 1.0 - smoothstep(0.0, 1.0, uEntryProgress);
      if (uEntry < 0.5) {
        p.y += entering * 0.82;
        p.x += sin(phase + p.y * 2.2) * entering * 0.34 * (1.0 - face * 0.65);
        p.z += cos(phase * 1.7) * entering * 0.30;
      } else if (uEntry < 1.5) {
        float spiral = entering * (2.7 + p.y * 0.62);
        float spiralCos = cos(spiral), spiralSin = sin(spiral);
        p.xz = mat2(spiralCos, -spiralSin, spiralSin, spiralCos) * p.xz;
        float radius = entering * (0.19 + seed * 0.31);
        p.x += cos(phase + p.y * 3.7 - t * 0.12) * radius;
        p.z += sin(phase + p.y * 3.7 - t * 0.12) * radius;
        p.y += sin(phase + p.y * 2.0) * entering * 0.14;
      } else {
        vec3 direction = vec3(sin(phase * 2.1) + p.x * 0.45, cos(phase * 1.4) + p.y * 0.24, sin(phase * 0.9));
        direction /= max(0.12, length(direction));
        p += direction * entering * (0.43 + seed * 0.43);
      }
      opacity *= 1.0 - entering * 0.34;
      if (kind < 0.5) {
        // The sampled surface opens into deeper flowing strata while turning,
        // giving the side view volume without changing the settled facial pose.
        float turning = min(1.0, abs(sin(uRotation.y)) + abs(uScrollVelocity) * 0.16);
        p.z += sin(phase * 3.0) * turning * 0.20 * (1.0 - face * 0.66);
      }

      // The same flight transform carries the surface, corona, filaments and wake.
      // Angles stay continuous through whole turns; no wrapping occurs here.
      p *= uFigureScale;
      float pitch = uRotation.x - uPointer.y * 0.036;
      float c = cos(pitch), s = sin(pitch);
      p.yz = mat2(c, -s, s, c) * p.yz;
      float yaw = uRotation.y + uPointer.x * 0.13 + sin(t * 0.095) * 0.025;
      c = cos(yaw); s = sin(yaw);
      p.xz = mat2(c, -s, s, c) * p.xz;
      c = cos(uRotation.z); s = sin(uRotation.z);
      p.xy = mat2(c, -s, s, c) * p.xy;
      p.z += uFlight.z;
      float perspective = 3.8 / max(2.2, 3.8 - p.z);
      vec2 projected = p.xy * perspective * uScale;
      projected.x /= uAspect;
      projected += uCenter + uFlight.xy;
      gl_Position = vec4(projected, 0.0, 1.0);

      float sparkle = 0.80 + 0.20 * sin(t * (0.46 + seed * 0.34) + phase * 9.0);
      float pixelSize = mix(1.35 + aData.y * 1.45, 3.0 + aData.y * 4.0, step(0.5, uPass));
      if (kind < 0.5) pixelSize *= 1.0 + face * 0.26;
      gl_PointSize = clamp(pixelSize * uDpr * perspective * sqrt(uFigureScale), 1.0, uMaxSize);

      vec3 violet = vec3(0.80, 0.32, 1.0);
      vec3 cyan = vec3(0.24, 0.78, 1.0);
      vec3 gold = vec3(1.0, 0.71, 0.32);
      float paletteWave = 0.5 + 0.5 * sin(aPosition.y * 4.0 + aPosition.x * 3.0 + t * 0.025);
      vec3 palette = mix(violet, cyan, paletteWave);
      palette = mix(palette, gold, clamp(uLight * 0.14 + face * 0.60, 0.0, 0.78));
      vec3 color = mix(aColor.rgb, palette, (0.22 + uStorm * 0.11) * (1.0 - face * 0.63));
      if (kind > 0.5 && kind < 1.5) color = mix(gold, vec3(1.0, 0.89, 0.65), seed * 0.40);
      if (kind > 1.5) color = mix(color, mix(violet, cyan, paletteWave), 0.48);
      color = mix(color, vec3(0.96, 0.55, 0.83), max(0.0, uScene - 1.0) * 0.07);

      float gain = (0.78 + uLight * 0.24) * sparkle;
      float alpha = aColor.a * opacity;
      if (uPass > 1.5) alpha *= 0.56 * (1.0 - face * 0.65);
      else if (uPass > 0.5) alpha *= kind < 0.5 ? 0.16 * (1.0 - face * 0.78) : 0.15;
      else alpha *= kind < 0.5 ? 0.86 + face * 0.12 : 0.72;
      vColor = vec4(color * gain, alpha);
    }
  `;

  var FRAGMENT = `
    precision mediump float;
    uniform mediump float uPass;
    varying mediump vec4 vColor;
    void main() {
      float falloff = 1.0;
      if (uPass < 1.5) {
        vec2 q = gl_PointCoord * 2.0 - 1.0;
        float radius = length(q);
        if (radius > 1.0) discard;
        if (uPass > 0.5) falloff = exp(-radius * radius * 3.2) * (1.0 - smoothstep(0.58, 1.0, radius));
        else falloff = 1.0 - smoothstep(0.30, 1.0, radius);
      }
      gl_FragColor = vec4(vColor.rgb, vColor.a * falloff);
    }
  `;

  function clamp(value, lo, hi) { return Math.max(lo, Math.min(hi, value)); }
  function finite(value, fallback) { return Number.isFinite(value) ? value : fallback; }
  function randomGenerator(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var z = Math.imul(seed ^ seed >>> 15, 1 | seed);
      z = z + Math.imul(z ^ z >>> 7, 61 | z) ^ z;
      return ((z ^ z >>> 14) >>> 0) / 4294967296;
    };
  }

  function shader(gl, type, source) {
    var item = gl.createShader(type);
    gl.shaderSource(item, source);
    gl.compileShader(item);
    if (!gl.getShaderParameter(item, gl.COMPILE_STATUS)) {
      var log = gl.getShaderInfoLog(item);
      gl.deleteShader(item);
      throw new Error('JesusFigure shader: ' + log);
    }
    return item;
  }

  function createProgram(gl) {
    var vertex = shader(gl, gl.VERTEX_SHADER, VERTEX);
    var fragment;
    try { fragment = shader(gl, gl.FRAGMENT_SHADER, FRAGMENT); }
    catch (error) { gl.deleteShader(vertex); throw error; }
    var result = gl.createProgram();
    gl.attachShader(result, vertex);
    gl.attachShader(result, fragment);
    gl.linkProgram(result);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(result, gl.LINK_STATUS)) {
      var log = gl.getProgramInfoLog(result);
      gl.deleteProgram(result);
      throw new Error('JesusFigure program: ' + log);
    }
    return result;
  }

  function JesusFigure(gl) {
    if (!gl) throw new Error('JesusFigure requires a WebGL1 context.');
    this.gl = gl;
    this.ready = false;
    this.loading = false;
    this.error = null;
    this._disposed = false;
    this._loadId = 0;
    this._buffers = [];
    this._aspect = 0.72;
    this._program = createProgram(gl);
    this._attributes = {
      position: gl.getAttribLocation(this._program, 'aPosition'),
      color: gl.getAttribLocation(this._program, 'aColor'),
      data: gl.getAttribLocation(this._program, 'aData')
    };
    this._uniforms = {};
    ['Time', 'Reveal', 'Light', 'Storm', 'Parting', 'Scene', 'Aspect', 'Scale', 'Dpr', 'MaxSize', 'Pass', 'Center', 'Pointer', 'FigureScale', 'Entry', 'EntryProgress', 'ScrollVelocity', 'Flight', 'Rotation'].forEach(function (name) {
      this._uniforms[name] = gl.getUniformLocation(this._program, 'u' + name);
    }, this);
    this._maxAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    var range = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
    this._maxPointSize = Math.min(24, range && range[1] || 24);
    this._mobile = typeof window !== 'undefined' && window.innerWidth < 800;
    this.particleCount = 0;
    this.lastMotion = {
      visible: false, flight: [0, 0, 0], rotation: [0, 0, 0], figureScale: 1,
      entry: 0, entryProgress: 1, scrollVelocity: 0, reducedMotion: false, drawCount: 0
    };
  }

  JesusFigure.prototype._makeBuffer = function (vertices) {
    var gl = this.gl;
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices instanceof Float32Array ? vertices : new Float32Array(vertices), gl.STATIC_DRAW);
    var geometry = { buffer: buffer, count: vertices.length / STRIDE };
    this._buffers.push(buffer);
    return geometry;
  };

  JesusFigure.prototype._sample = function (image) {
    var resolution = this._mobile ? 600 : 800;
    var imageScale = Math.min(1, resolution / Math.max(image.naturalWidth, image.naturalHeight));
    var width = Math.max(1, Math.round(image.naturalWidth * imageScale));
    var height = Math.max(1, Math.round(image.naturalHeight * imageScale));
    var canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Unable to sample figure pixels.');
    ctx.drawImage(image, 0, 0, width, height);
    var pixels = ctx.getImageData(0, 0, width, height).data;
    var candidates = [];
    var minX = width, maxX = 0, minY = height, maxY = 0;
    var x, y, i;
    // Alpha and light must both be present. Dark transparent-edge RGB is ignored.
    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        i = (y * width + x) * 4;
        var alpha = pixels[i + 3] / 255;
        var brightness = (pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722) / 255;
        if (alpha < 0.025 || brightness < 0.022) continue;
        candidates.push(i);
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
    if (candidates.length < 64) throw new Error('Figure image has too few visible pixels.');
    var span = Math.max(1, maxY - minY + 1);
    var centerX = (minX + maxX) * 0.5;
    var centerY = (minY + maxY) * 0.5;
    this._aspect = (maxX - minX + 1) / span;
    var rand = randomGenerator(0x4a455355);
    var count = Math.min(this._mobile ? 22000 : 43000, Math.max(3000, candidates.length));
    var weights = new Float32Array(candidates.length);
    var total = 0;
    for (var n = 0; n < candidates.length; n++) {
      i = candidates[n];
      x = (i / 4) % width; y = Math.floor(i / 4 / width);
      var px = (x - centerX) / span * 2;
      var py = (centerY - y) / span * 2;
      var lum = (pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722) / 255;
      var facial = py > 0.54 && py < 0.84 && Math.abs(px) < 0.16 ? 3.25 : py > 0.40 && Math.abs(px) < 0.23 ? 1.5 : 1;
      total += (0.30 + Math.sqrt(lum) * 0.70) * Math.pow(pixels[i + 3] / 255, 0.65) * facial;
      weights[n] = total;
    }

    var points = new Float32Array(count * STRIDE);
    var selected = [];
    var index = 0;
    var interval = total / count;
    var start = rand() * interval;
    function surfaceVertex(target, offset, sx, sy, colorIndex, seed, strength) {
      var xx = (sx - centerX) / span * 2;
      var yy = (centerY - sy) / span * 2;
      var r = pixels[colorIndex] / 255, g = pixels[colorIndex + 1] / 255, b = pixels[colorIndex + 2] / 255;
      var light = r * 0.2126 + g * 0.7152 + b * 0.0722;
      var facial = yy > 0.40 && Math.abs(xx) < 0.23;
      // Surface convexity and shallow strata create volume, preserving the face.
      var depth = Math.exp(-xx * xx * 7) * 0.115 + (light - 0.45) * 0.042;
      depth += (seed - 0.5) * (facial ? 0.028 : 0.14);
      target[offset] = xx;
      target[offset + 1] = yy;
      target[offset + 2] = depth;
      target[offset + 3] = Math.pow(r, 0.78);
      target[offset + 4] = Math.pow(g, 0.78);
      target[offset + 5] = Math.pow(b, 0.78);
      target[offset + 6] = Math.pow(pixels[colorIndex + 3] / 255, 0.66) * (0.40 + light * 0.60) * strength;
      target[offset + 7] = seed;
      target[offset + 8] = 0.40 + Math.sqrt(light) * 0.64 + seed * 0.28;
      target[offset + 9] = 0;
      target[offset + 10] = light;
    }
    for (n = 0; n < count; n++) {
      var goal = start + n * interval;
      while (index < weights.length - 1 && weights[index] < goal) index++;
      i = candidates[index];
      x = (i / 4) % width; y = Math.floor(i / 4 / width);
      var seed = rand();
      surfaceVertex(points, n * STRIDE, x + rand() - 0.5, y + rand() - 0.5, i, seed, 1);
      if (n % 3 === 0) selected.push(i);
    }

    function sampleLight(sx, sy) {
      sx = Math.round(sx); sy = Math.round(sy);
      if (sx < 0 || sx >= width || sy < 0 || sy >= height) return 0;
      var p = (sy * width + sx) * 4;
      return (pixels[p] * 0.2126 + pixels[p + 1] * 0.7152 + pixels[p + 2] * 0.0722) / 255 * pixels[p + 3] / 255;
    }
    // Short, connected luminous threads follow local image structure. These are
    // geometry in the same volume, rather than a raster veil over the particles.
    var lines = [];
    var strandCount = this._mobile ? 700 : 1700;
    for (var strand = 0; strand < strandCount; strand++) {
      i = selected[Math.floor(rand() * selected.length)];
      var sx = (i / 4) % width, sy = Math.floor(i / 4 / width);
      var best = -1, angle = Math.PI * 0.5;
      for (var direction = 0; direction < 8; direction++) {
        var a = direction * Math.PI * 0.25;
        var energy = sampleLight(sx + Math.cos(a) * 2.5, sy + Math.sin(a) * 2.5) + sampleLight(sx + Math.cos(a) * 5, sy + Math.sin(a) * 5) * 0.55;
        if (energy > best) { best = energy; angle = a; }
      }
      var strandSeed = rand();
      for (var step = 0; step < (this._mobile ? 22 : 30); step++) {
        var nextX = sx, nextY = sy, nextAngle = angle, nextScore = -1;
        for (var turn = -2; turn <= 2; turn++) {
          a = angle + turn * 0.22;
          var candidateX = sx + Math.cos(a) * 1.65;
          var candidateY = sy + Math.sin(a) * 1.65;
          var score = sampleLight(candidateX, candidateY) * (1 - Math.abs(turn) * 0.065);
          if (score > nextScore) { nextScore = score; nextX = candidateX; nextY = candidateY; nextAngle = a; }
        }
        if (nextScore < 0.035) break;
        var oldIndex = (Math.round(sy) * width + Math.round(sx)) * 4;
        var newIndex = (Math.round(nextY) * width + Math.round(nextX)) * 4;
        if (newIndex < 0 || newIndex + 3 >= pixels.length) break;
        var offset = lines.length;
        for (var fill = 0; fill < STRIDE * 2; fill++) lines.push(0);
        surfaceVertex(lines, offset, sx, sy, oldIndex, strandSeed, 0.67);
        surfaceVertex(lines, offset + STRIDE, nextX, nextY, newIndex, strandSeed, 0.67);
        sx = nextX; sy = nextY; angle = nextAngle;
      }
    }

    var aura = [];
    var haloCount = this._mobile ? 850 : 1500;
    for (n = 0; n < haloCount; n++) {
      var ring = n / haloCount * TAU;
      aura.push(ring, rand() * TAU, rand(), 1, 0.77 + rand() * 0.16, 0.42 + rand() * 0.25, 0.66,
        rand(), 0.40 + rand() * 0.45, 1, 1);
    }
    var lanes = this._mobile ? 10 : 14;
    var lanePoints = this._mobile ? 100 : 170;
    for (var lane = 0; lane < lanes; lane++) {
      for (n = 0; n < lanePoints; n++) {
        var phase = (n + rand() * 0.6) / lanePoints;
        var tint = lane / lanes;
        aura.push(phase, tint, rand() - 0.5,
          0.36 + tint * 0.35, 0.40 + (1 - tint) * 0.35, 1, 0.42 + rand() * 0.30,
          rand(), 0.26 + rand() * 0.48, 2, 0.75);
      }
    }
    // A handful of satellite points give the halo a broad, airy corona.
    for (n = 0; n < (this._mobile ? 90 : 180); n++) {
      aura.push(rand() * TAU, rand() * TAU, rand(), 0.82, 0.55, 1, 0.18,
        rand(), 1.15 + rand() * 0.50, 1, 0.5);
    }
    var wakeCount = this._mobile ? 600 : 1100;
    for (n = 0; n < wakeCount; n++) {
      var origin = Math.floor(rand() * count) * STRIDE;
      if (points[origin + 1] > 0.42) continue;
      aura.push(points[origin], points[origin + 1], points[origin + 2],
        points[origin + 3], points[origin + 4], points[origin + 5], points[origin + 6] * 0.38,
        rand(), 0.35 + rand() * 0.40, 3, rand());
    }

    this._clearBuffers();
    this._body = this._makeBuffer(points);
    this._threads = this._makeBuffer(lines);
    this._aura = this._makeBuffer(aura);
    this.particleCount = count + aura.length / STRIDE;
    this.ready = true;
    // Only GPU buffers remain after this function; the sample canvas is not retained.
    canvas.width = 1; canvas.height = 1;
  };

  JesusFigure.prototype.load = function (src) {
    var self = this;
    if (this._disposed) return Promise.reject(new Error('JesusFigure has been disposed.'));
    var id = ++this._loadId;
    this.loading = true;
    this.error = null;
    return new Promise(function (resolve, reject) {
      var image = new Image();
      image.decoding = 'async';
      image.crossOrigin = 'anonymous';
      image.onload = function () {
        if (id !== self._loadId || self._disposed) { resolve(self); return; }
        try {
          self._sample(image);
          self.loading = false;
          resolve(self);
        } catch (error) {
          self.loading = false;
          self.error = error;
          reject(error);
        }
      };
      image.onerror = function () {
        var error = new Error('Unable to load figure image: ' + src);
        if (id === self._loadId) { self.loading = false; self.error = error; }
        reject(error);
      };
      image.src = src;
    });
  };

  JesusFigure.prototype._bind = function (geometry) {
    var gl = this.gl;
    var attr = this._attributes;
    gl.bindBuffer(gl.ARRAY_BUFFER, geometry.buffer);
    gl.vertexAttribPointer(attr.position, 3, gl.FLOAT, false, STRIDE * 4, 0);
    gl.vertexAttribPointer(attr.color, 4, gl.FLOAT, false, STRIDE * 4, 3 * 4);
    gl.vertexAttribPointer(attr.data, 4, gl.FLOAT, false, STRIDE * 4, 7 * 4);
    gl.enableVertexAttribArray(attr.position);
    gl.enableVertexAttribArray(attr.color);
    gl.enableVertexAttribArray(attr.data);
  };

  JesusFigure.prototype.draw = function (state) {
    state = state || {};
    var motion = this.lastMotion;
    motion.reducedMotion = !!state.reducedMotion;
    for (var component = 0; component < 3; component++) {
      motion.flight[component] = motion.reducedMotion ? 0 : clamp(finite(state.flight && state.flight[component], 0), component === 2 ? -1.2 : -2, component === 2 ? 1.2 : 2);
      motion.rotation[component] = motion.reducedMotion ? 0 : finite(state.rotation && state.rotation[component], 0);
    }
    motion.figureScale = motion.reducedMotion ? 1 : clamp(finite(state.figureScale, 1), 0.05, 2.4);
    motion.entry = clamp(Math.round(finite(state.entry, 0)), 0, 2);
    motion.entryProgress = motion.reducedMotion ? 1 : clamp(finite(state.entryProgress, 1), 0, 1);
    motion.scrollVelocity = motion.reducedMotion ? 0 : clamp(finite(state.scrollVelocity, 0), -2, 2);
    motion.visible = this.ready && !this._disposed && finite(state.reveal, 0) > 0.0001;
    if (!motion.visible) return;
    var gl = this.gl;
    if (gl.isContextLost()) return;
    var uniforms = this._uniforms;
    var width = Math.max(1, finite(state.width, gl.drawingBufferWidth));
    var height = Math.max(1, finite(state.height, gl.drawingBufferHeight));
    var ratio = width / height;
    var dpr = clamp(finite(state.dpr, window.devicePixelRatio || 1), 1, this._mobile ? 1.6 : 2);
    var mobile = width / Math.max(1, finite(state.dpr, 1)) < 800;
    var scale = Math.min(mobile ? 0.77 : 0.84, ratio / Math.max(0.3, this._aspect) * (mobile ? 0.97 : 0.91));
    var pointer = state.pointer || [0, 0];

    // The ocean and figure share the context. Every GL state consumed by this pass
    // is set explicitly; clearing and context restoration belong to the host.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.useProgram(this._program);
    for (var i = 0; i < this._maxAttributes; i++) gl.disableVertexAttribArray(i);
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.STENCIL_TEST);
    gl.colorMask(true, true, true, true);
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    gl.uniform1f(uniforms.Time, state.reducedMotion ? 0 : finite(state.time, 0));
    gl.uniform1f(uniforms.Reveal, clamp(finite(state.reveal, 0), 0, 1));
    gl.uniform1f(uniforms.Light, clamp(finite(state.light, 0.5), 0, 1));
    gl.uniform1f(uniforms.Storm, clamp(finite(state.storm, 0), 0, 1));
    gl.uniform1f(uniforms.Parting, clamp(finite(state.parting, 0), 0, 1));
    gl.uniform1f(uniforms.Scene, clamp(finite(state.scene, 0), 0, 2));
    gl.uniform1f(uniforms.Aspect, ratio);
    gl.uniform1f(uniforms.Scale, scale);
    gl.uniform1f(uniforms.Dpr, dpr);
    gl.uniform1f(uniforms.MaxSize, this._maxPointSize);
    gl.uniform1f(uniforms.FigureScale, motion.figureScale);
    gl.uniform1f(uniforms.Entry, motion.entry);
    gl.uniform1f(uniforms.EntryProgress, motion.entryProgress);
    gl.uniform1f(uniforms.ScrollVelocity, motion.scrollVelocity);
    gl.uniform3f(uniforms.Flight, motion.flight[0], motion.flight[1], motion.flight[2]);
    gl.uniform3f(uniforms.Rotation, motion.rotation[0], motion.rotation[1], motion.rotation[2]);
    gl.uniform2f(uniforms.Center, clamp(finite(state.centerX, mobile ? 0.5 : 0.6), 0.2, 0.8) * 2 - 1, 1 - clamp(finite(state.centerY, mobile ? 0.5175 : 0.4775), 0.2, 0.8) * 2);
    gl.uniform2f(uniforms.Pointer, motion.reducedMotion ? 0 : clamp(finite(pointer[0], 0), -1, 1), motion.reducedMotion ? 0 : clamp(finite(pointer[1], 0), -1, 1));
    motion.drawCount++;

    // Broad radiance first, then fine moving cores and connected threads.
    gl.uniform1f(uniforms.Pass, 1);
    this._bind(this._aura);
    gl.drawArrays(gl.POINTS, 0, this._aura.count);
    this._bind(this._body);
    gl.drawArrays(gl.POINTS, 0, this._body.count);

    gl.uniform1f(uniforms.Pass, 2);
    gl.lineWidth(1);
    this._bind(this._threads);
    gl.drawArrays(gl.LINES, 0, this._threads.count);

    gl.uniform1f(uniforms.Pass, 0);
    this._bind(this._aura);
    gl.drawArrays(gl.POINTS, 0, this._aura.count);
    // Dense soft cores veil the light behind the face and merge into a coherent
    // robe. The surrounding threads and radiance retain additive light blending.
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    this._bind(this._body);
    gl.drawArrays(gl.POINTS, 0, this._body.count);
  };

  JesusFigure.prototype._clearBuffers = function () {
    for (var i = 0; i < this._buffers.length; i++) this.gl.deleteBuffer(this._buffers[i]);
    this._buffers.length = 0;
  };

  JesusFigure.prototype.dispose = function () {
    if (this._disposed) return;
    this._loadId++;
    this._disposed = true;
    this.ready = false;
    this.loading = false;
    this._clearBuffers();
    this.gl.deleteProgram(this._program);
  };

  window.JesusFigure = JesusFigure;
})();

