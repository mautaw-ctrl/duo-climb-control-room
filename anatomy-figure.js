/* v0.4: a pearl anatomical sculpture, built from coherent procedural volumes. */
(function () {
  'use strict';
  var TAU = Math.PI * 2;
  var STRIDE = 20;
  var PART_COUNT = 28;
  var VERTEX = `
    precision highp float;
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec4 aColor;
    attribute vec3 aScatter;
    attribute vec3 aCenter;
    attribute vec4 aData;
    uniform mediump float uTime, uPass;
    uniform float uReveal, uPullback, uAssembly, uOpacity;
    uniform float uAspect, uScale, uDpr, uPointSize, uMaxPointSize;
    uniform vec2 uPointer;
    varying mediump vec4 vColor;
    varying mediump vec3 vNormal;
    varying mediump vec3 vPosition;
    varying mediump vec2 vMaterial;
    void main() {
      float order = aData.x;
      float kind = aData.y;
      float start = order / 28.0 * 0.94;
      float joined = smoothstep(start, start + 0.032, uAssembly);
      float split = (1.0 - joined) * smoothstep(0.22, 0.78, uPullback);
      vec3 p = aPosition - aCenter;
      vec3 n = aNormal;
      float angle = sin(order * 2.83) * split * 0.25;
      float c = cos(angle), s = sin(angle);
      p.xy = mat2(c, -s, s, c) * p.xy;
      n.xy = mat2(c, -s, s, c) * n.xy;
      float breath = kind < 0.5 ? 1.0 + sin(uTime * 1.1 + order) * 0.009 : 1.0;
      if (order < 0.5) breath += max(0.0, sin(uTime * 4.1)) * 0.018;
      p *= breath;
      p += aCenter + aScatter * split;
      p += vec3(sin(uTime * 0.26 + order * 0.8), cos(uTime * 0.22 + order), sin(uTime * 0.21 + order)) * split * 0.012;
      float yaw = uPointer.x * 0.055 + sin(uTime * 0.12) * 0.024;
      c = cos(yaw); s = sin(yaw);
      p.xz = mat2(c, -s, s, c) * p.xz;
      n.xz = mat2(c, -s, s, c) * n.xz;
      float zoom = mix(4.9, 1.0, smoothstep(0.0, 1.0, uPullback));
      p.y -= (1.0 - uPullback) * 0.34;
      float perspective = 3.7 / max(2.8, 3.7 - p.z);
      vec2 screen = p.xy * uScale * zoom * perspective;
      screen.x /= uAspect;
      screen += uPointer * vec2(0.012, 0.009);
      gl_Position = vec4(screen, 0.0, 1.0);
      gl_PointSize = clamp(uPointSize * uDpr * sqrt(zoom) * perspective, 1.0, uMaxPointSize);
      float visible = smoothstep(0.0, 0.55 + aData.z * 0.22, uReveal);
      if (kind > 0.5) visible *= smoothstep(0.18, 0.72, uPullback);
      float gathering = 1.0 - smoothstep(0.0, 0.16, abs(uAssembly - start - 0.018));
      vColor = vec4(aColor.rgb, aColor.a * visible * uOpacity);
      vNormal = n;
      vPosition = aPosition;
      vMaterial = vec2(kind, gathering * split);
    }
  `;
  var FRAGMENT = `
    precision mediump float;
    uniform float uTime, uPass;
    varying mediump vec4 vColor;
    varying mediump vec3 vNormal;
    varying mediump vec3 vPosition;
    varying mediump vec2 vMaterial;
    void main() {
      // This shared canvas has no depth attachment. A front surface gives each
      // transparent anatomical volume a clean silhouette without rear latitude
      // rings painting over its chrome highlight.
      if (vNormal.z < -0.015) discard;
      if (uPass > 0.5) {
        vec2 q = gl_PointCoord * 2.0 - 1.0;
        float radius = length(q);
        if (radius > 1.0) discard;
        float glow = exp(-radius * radius * 4.0) * (1.0 - smoothstep(0.64, 1.0, radius));
        gl_FragColor = vec4(vColor.rgb * 1.2, vColor.a * glow * 0.32);
        return;
      }
      vec3 n = normalize(vNormal);
      vec3 view = vec3(0.0, 0.0, 1.0);
      float rim = pow(1.0 - abs(dot(n, view)), 2.5);
      float top = max(0.0, dot(n, normalize(vec3(-0.4, 0.65, 0.7))));
      float fill = max(0.0, dot(n, normalize(vec3(0.65, -0.16, 0.55))));
      float spec = pow(max(0.0, dot(reflect(-normalize(vec3(-0.4, 0.65, 0.7)), n), view)), 32.0);
      float silk = 0.5 + 0.5 * sin(n.y * 7.0 + n.x * 4.0 + vPosition.y * 6.0 + uTime * 0.09);
      vec3 reflected = mix(vec3(0.20, 0.91, 1.0), vec3(1.0, 0.43, 0.78), silk);
      vec3 pearl = vColor.rgb * (0.31 + top * 0.58 + fill * 0.27);
      pearl += reflected * (rim * 0.43 + pow(silk, 10.0) * 0.10);
      pearl += vec3(0.91, 0.96, 1.0) * spec * 0.70;
      pearl += vec3(0.72, 0.91, 1.0) * vMaterial.y * 0.14;
      float alpha = vColor.a;
      if (vMaterial.x > 0.5 && vMaterial.x < 1.5) {
        // The transparent outer shell leaves the organ sculpture legible.
        alpha *= 0.40 + rim * 0.60;
        pearl += reflected * rim * 0.18;
      }
      gl_FragColor = vec4(pearl, alpha);
    }
  `;

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function finite(value, fallback) { return Number.isFinite(value) ? value : fallback; }
  function smooth(a, b, value) { var t = clamp((value - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function normalize(v) { var d = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / d, v[1] / d, v[2] / d]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function scale(a, value) { return [a[0] * value, a[1] * value, a[2] * value]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function shader(gl, type, source) {
    var result = gl.createShader(type);
    gl.shaderSource(result, source); gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
      var error = gl.getShaderInfoLog(result); gl.deleteShader(result);
      throw new Error('AnatomyFigure shader: ' + error);
    }
    return result;
  }
  function program(gl) {
    var vertex = shader(gl, gl.VERTEX_SHADER, VERTEX), fragment;
    try { fragment = shader(gl, gl.FRAGMENT_SHADER, FRAGMENT); }
    catch (error) { gl.deleteShader(vertex); throw error; }
    var result = gl.createProgram();
    gl.attachShader(result, vertex); gl.attachShader(result, fragment); gl.linkProgram(result);
    gl.deleteShader(vertex); gl.deleteShader(fragment);
    if (!gl.getProgramParameter(result, gl.LINK_STATUS)) {
      var log = gl.getProgramInfoLog(result); gl.deleteProgram(result); throw new Error('AnatomyFigure program: ' + log);
    }
    return result;
  }

  function AnatomyFigure(gl) {
    if (!gl) throw new Error('AnatomyFigure requires a WebGL1 context.');
    this.gl = gl;
    this._disposed = false;
    this._buffers = [];
    this._program = program(gl);
    this._mobile = window.innerWidth < 800;
    this._maxAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    this._maxPointSize = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1];
    this._vaoExtension = gl.getExtension('OES_vertex_array_object');
    this._instancingExtension = gl.getExtension('ANGLE_instanced_arrays');
    this._attributes = {};
    var self = this;
    ['Position', 'Normal', 'Color', 'Scatter', 'Center', 'Data'].forEach(function (name) {
      self._attributes[name] = gl.getAttribLocation(self._program, 'a' + name);
    });
    this._uniforms = {};
    ['Time', 'Reveal', 'Pullback', 'Assembly', 'Opacity', 'Aspect', 'Scale', 'Dpr', 'PointSize', 'MaxPointSize', 'Pass', 'Pointer'].forEach(function (name) {
      self._uniforms[name] = gl.getUniformLocation(self._program, 'u' + name);
    });
    this._parts = [];
    this._build();
    this.ready = true;
    this._last = { visible: false, reveal: 0, pullback: 0, assembly: 0, opacity: 0, assembledParts: 0, settledParts: 0, movingParts: 0, cameraScale: 1, drawCalls: 0, reducedMotion: false };
  }

  AnatomyFigure.prototype._build = function () {
    var self = this;
    var groups = { shell: [], organ: [], rib: [], glow: [] };
    var triangles = 0;
    var pearl = [0.78, 0.91, 1.0, 0.28];
    var blue = [0.26, 0.78, 0.98, 0.89];
    var pink = [1.0, 0.39, 0.68, 0.97];
    var lavender = [0.67, 0.60, 0.99, 0.91];
    var silver = [0.85, 0.94, 1.0, 0.76];
    function part(name, center, scatter, kind, color) {
      var p = { id: self._parts.length, name: name, center: center, scatter: scatter, kind: kind, color: color };
      self._parts.push(p); return p;
    }
    function vertex(target, p, position, normal, color) {
      color = color || p.color;
      var seed = (Math.sin(position[0] * 93.7 + position[1] * 71.1 + position[2] * 43.1 + p.id) + 1) * 0.5;
      target.push(position[0], position[1], position[2], normal[0], normal[1], normal[2], color[0], color[1], color[2], color[3],
        p.scatter[0], p.scatter[1], p.scatter[2], p.center[0], p.center[1], p.center[2], p.id, p.kind, seed, 0);
    }
    function tri(target, p, a, b, c, na, nb, nc, color) {
      vertex(target, p, a, na, color); vertex(target, p, b, nb, color); vertex(target, p, c, nc, color); triangles++;
    }
    function ellipsoid(p, center, radius, targetName, color, shape) {
      var target = groups[targetName || (p.kind < 0.5 ? 'organ' : 'shell')];
      var lat = p.kind < 0.5 ? (self._mobile ? 18 : 22) : (self._mobile ? 8 : 12);
      var lon = p.kind < 0.5 ? (self._mobile ? 24 : 32) : (self._mobile ? 14 : 18);
      if (p.kind > 1.5) { lat = 6; lon = 10; }
      if (p.name === 'head') { lat = self._mobile ? 14 : 20; lon = self._mobile ? 22 : 30; }
      var ring = [];
      for (var j = 0; j <= lat; j++) {
        var row = [], theta = j / lat * Math.PI;
        for (var i = 0; i <= lon; i++) {
          var phi = i / lon * TAU;
          var n = [Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi)];
          var q = [n[0] * radius[0], n[1] * radius[1], n[2] * radius[2]];
          if (shape) q = shape(q, n, theta, phi);
          row.push({ position: add(center, q), normal: normalize([n[0] / radius[0], n[1] / radius[1], n[2] / radius[2]]) });
          if (p.kind > 0.5 && j > 1 && j < lat - 1 && i % 4 === 0 && j % 2 === 0) vertex(groups.glow, p, add(center, q), n, [0.50 + n[0] * 0.15, 0.82, 1.0, 0.13]);
        }
        ring.push(row);
      }
      for (j = 0; j < lat; j++) for (i = 0; i < lon; i++) {
        var a = ring[j][i], b = ring[j + 1][i], c = ring[j + 1][i + 1], d = ring[j][i + 1];
        tri(target, p, a.position, b.position, d.position, a.normal, b.normal, d.normal, color);
        tri(target, p, b.position, c.position, d.position, b.normal, c.normal, d.normal, color);
      }
    }
    function tube(p, path, radii, targetName, color, sides) {
      sides = sides || 10;
      if (self._mobile) sides = Math.min(sides, p.kind < 0.5 ? 8 : 10);
      var target = groups[targetName || (p.kind < 0.5 ? 'organ' : 'shell')];
      var rings = [];
      for (var i = 0; i < path.length; i++) {
        var prev = path[Math.max(0, i - 1)], next = path[Math.min(path.length - 1, i + 1)];
        var tangent = normalize([next[0] - prev[0], next[1] - prev[1], next[2] - prev[2]]);
        var basis = normalize(cross(tangent, Math.abs(tangent[2]) < 0.90 ? [0, 0, 1] : [0, 1, 0]));
        var other = normalize(cross(tangent, basis));
        var row = [], radius = typeof radii === 'number' ? radii : radii[i];
        for (var k = 0; k <= sides; k++) {
          var phase = k / sides * TAU;
          var n = add(scale(basis, Math.cos(phase)), scale(other, Math.sin(phase)));
          row.push({ position: add(path[i], scale(n, radius)), normal: n });
          if (k === Math.floor(sides * 0.25) && i % 2 === 0) vertex(groups.glow, p, add(path[i], scale(n, radius)), n, [0.56, 0.90, 1, 0.42]);
        }
        rings.push(row);
      }
      for (i = 0; i < path.length - 1; i++) for (k = 0; k < sides; k++) {
        var a = rings[i][k], b = rings[i + 1][k], c = rings[i + 1][k + 1], d = rings[i][k + 1];
        tri(target, p, a.position, b.position, d.position, a.normal, b.normal, d.normal, color);
        tri(target, p, b.position, c.position, d.position, b.normal, c.normal, d.normal, color);
      }
    }
    function curve(count, fn) { var path = []; for (var i = 0; i <= count; i++) path.push(fn(i / count)); return path; }
    function limb(p, a, b, top, bottom) {
      var path = curve(12, function (t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; });
      var radii = path.map(function (_, i) { var t = i / (path.length - 1); return (top * (1 - t) + bottom * t) * (0.76 + 0.24 * Math.sin(Math.PI * t)); });
      tube(p, path, radii, 'shell', p.color, 16);
      ellipsoid(p, a, [top * 0.77, top * 0.77, top * 0.77], 'shell');
      ellipsoid(p, b, [bottom * 0.77, bottom * 0.77, bottom * 0.77], 'shell');
    }

    // One continuous ventricular surface prevents intersecting sphere seams
    // in a depthless context. A smooth upper bulge suggests the left atrium.
    var heart = part('heart', [0.018, 0.33, 0.105], [0.07, 0.04, 0.025], 0, pink);
    ellipsoid(heart, [0.015, 0.333, 0.115], [0.065, 0.088, 0.045], 'organ', pink, function (q, n) {
      q[0] += n[1] * 0.020; q[0] *= 0.82 + Math.max(0, n[1]) * 0.30;
      if (n[1] < 0) { q[0] *= 0.86 + n[1] * 0.17; q[2] *= 0.87 + n[1] * 0.14; }
      var atrium = Math.exp(-Math.pow((n[1] - 0.48) / 0.40, 2) - Math.pow((n[0] + 0.62) / 0.52, 2));
      q[0] -= atrium * 0.018; q[1] += atrium * 0.007; q[2] += atrium * 0.014;
      return q;
    });
    tube(heart, curve(18, function (t) { return [-0.004 + Math.sin(t * Math.PI) * 0.038, 0.40 + Math.sin(t * Math.PI) * 0.045, 0.112 - t * 0.036]; }), 0.011, 'organ', [1, 0.71, 0.86, 1], 12);
    tube(heart, curve(12, function (t) { return [-0.018 - t * 0.013, 0.404 + t * 0.043, 0.104 - t * 0.017]; }), 0.007, 'organ', blue, 10);

    // Separate lobed lungs, with bronchi joining a pearl trachea.
    for (var side = -1; side <= 1; side += 2) {
      var lung = part(side < 0 ? 'right lung' : 'left lung', [side * 0.105, 0.361, 0.042], [side * 0.081, 0.037, -0.018], 0, side < 0 ? blue : lavender);
      ellipsoid(lung, [side * 0.112, 0.359, 0.042], [0.082, 0.135, 0.058], 'organ', null, function (q, n) {
        var taper = 0.72 + 0.28 * (1 - n[1]) * 0.5;
        q[0] *= taper;
        q[0] += side * Math.max(0, -n[1]) * 0.018;
        q[2] += Math.sin(n[1] * Math.PI * 2.2) * 0.004;
        return q;
      });
      tube(lung, curve(12, function (t) { return [side * (0.011 + t * 0.084), 0.484 - t * 0.112, 0.112 - t * 0.014]; }), 0.006, 'organ', [0.79, 0.97, 1, 0.78], 8);
      for (var branch = 0; branch < 3; branch++) {
        (function (branchIndex) {
          tube(lung, curve(10, function (t) { return [side * (0.049 + t * (0.072 - branchIndex * 0.007)), 0.432 - branchIndex * 0.043 - t * 0.048, 0.099 - t * 0.015]; }), 0.0028, 'organ', [0.75, 0.98, 1, 0.55], 6);
        })(branch);
      }
    }
    var liver = part('liver', [-0.070, 0.180, 0.050], [-0.119, -0.016, 0.025], 0, [0.78, 0.47, 0.84, 0.88]);
    ellipsoid(liver, [-0.065, 0.18, 0.049], [0.135, 0.055, 0.055], 'organ', null, function (q, n) { q[1] += n[0] * 0.021; q[0] *= 0.9 + n[0] * 0.10; return q; });
    var stomach = part('stomach', [0.081, 0.116, 0.079], [0.118, 0.004, 0.034], 0, [0.95, 0.66, 0.81, 0.94]);
    ellipsoid(stomach, [0.073, 0.115, 0.079], [0.058, 0.075, 0.042], 'organ', null, function (q, n) { q[0] += 0.025 * n[1] * n[1]; q[1] += n[0] * 0.017; return q; });
    var intestine = part('intestines', [0, 0.005, 0.08], [0.026, -0.104, 0.018], 0, [0.67, 0.91, 0.96, 0.94]);
    // A continuous serpentine coil, rather than independent beads.
    tube(intestine, curve(210, function (t) {
      var phase = t * Math.PI * 11;
      return [Math.sin(phase) * (0.108 - t * 0.027), 0.080 - t * 0.155, 0.071 + Math.cos(phase) * 0.012];
    }), 0.0103, 'organ', null, 10);
    tube(intestine, curve(65, function (t) {
      var angle = Math.PI * 0.5 + t * TAU * 0.86;
      return [Math.cos(angle) * 0.126, Math.sin(angle) * 0.116 - 0.011, 0.052];
    }), 0.014, 'organ', [0.79, 0.69, 0.98, 0.93], 10);

    // Seven curved ribs remain one coherent cluster on either side.
    for (side = -1; side <= 1; side += 2) {
      var rib = part(side < 0 ? 'right ribs' : 'left ribs', [side * 0.113, 0.339, -0.005], [side * 0.136, 0.043, -0.062], 2, silver);
      for (var r = 0; r < 7; r++) {
        (function (ribIndex, ribSide) {
          var y = 0.485 - ribIndex * 0.042;
          var width = 0.108 + Math.sin((ribIndex + 1) / 8 * Math.PI) * 0.084;
          tube(rib, curve(28, function (t) {
            var angle = t * Math.PI * 0.90;
            return [ribSide * (0.013 + Math.sin(angle) * width), y - Math.sin(t * Math.PI) * 0.024 - t * 0.024, -0.045 + (1 - Math.cos(angle)) * 0.065];
          }), 0.0040 - ribIndex * 0.00014, 'rib', [0.67, 0.87, 1, 0.53], 8);
        })(r, side);
      }
    }
    var spine = part('spine', [0, 0.258, -0.065], [-0.031, 0.021, -0.078], 2, silver);
    for (var vertebra = 0; vertebra < 17; vertebra++) {
      ellipsoid(spine, [0, 0.514 - vertebra * 0.034, -0.074], [0.019, 0.015, 0.018], 'rib', [0.80, 0.91, 1, 0.57]);
    }
    tube(spine, [[0, 0.49, 0.099], [0, 0.454, 0.098], [0, 0.315, 0.095]], 0.0041, 'rib', [0.80, 0.96, 1, 0.55], 8);
    var neck = part('neck', [0, 0.571, 0], [0.024, 0.091, 0.012], 1, pearl);
    limb(neck, [0, 0.526, 0], [0, 0.629, 0], 0.040, 0.044);
    tube(neck, [[0, 0.524, 0.094], [0, 0.596, 0.077], [0, 0.635, 0.047]], 0.008, 'rib', [0.73, 0.91, 1, 0.69], 10);
    var head = part('head', [0, 0.750, 0], [-0.047, 0.108, 0.002], 1, [0.76, 0.89, 1, 0.64]);
    ellipsoid(head, [0, 0.756, 0.003], [0.088, 0.126, 0.077], 'shell', null, function (q, n) {
      if (n[1] < -0.18) { q[0] *= 0.75 + (n[1] + 1) * 0.20; q[2] += 0.014; }
      return q;
    });
    // Quiet facial topology in reflective material; no texture or photo plane.
    ellipsoid(head, [0, 0.746, 0.078], [0.014, 0.037, 0.016], 'shell', [0.82, 0.94, 1, 0.69]);
    ellipsoid(head, [0, 0.706, 0.075], [0.030, 0.006, 0.010], 'shell', [0.82, 0.72, 0.95, 0.61]);
    for (side = -1; side <= 1; side += 2) {
      ellipsoid(head, [side * 0.035, 0.782, 0.069], [0.022, 0.007, 0.010], 'shell', [0.57, 0.86, 1, 0.59]);
      ellipsoid(head, [side * 0.083, 0.751, 0.001], [0.012, 0.026, 0.016], 'shell', [0.78, 0.90, 1, 0.51]);
    }
    for (side = -1; side <= 1; side += 2) {
      var chest = part(side < 0 ? 'right upper torso' : 'left upper torso', [side * 0.109, 0.422, -0.01], [side * 0.114, 0.078, -0.073], 1, pearl);
      ellipsoid(chest, [side * 0.095, 0.407, -0.025], [0.114, 0.140, 0.091], 'shell', null, function (q, n) { q[0] *= 0.93 + n[1] * 0.06; return q; });
    }
    for (side = -1; side <= 1; side += 2) {
      var torso = part(side < 0 ? 'right lower torso' : 'left lower torso', [side * 0.090, 0.13, -0.018], [side * 0.120, -0.035, -0.045], 1, pearl);
      ellipsoid(torso, [side * 0.077, 0.116, -0.032], [0.092, 0.157, 0.085], 'shell', null, function (q, n) { q[0] *= 0.77 + Math.abs(n[1]) * 0.20; return q; });
    }
    var pelvis = part('pelvis', [0, -0.124, -0.005], [-0.024, -0.086, -0.014], 1, pearl);
    ellipsoid(pelvis, [0, -0.124, -0.018], [0.152, 0.108, 0.082], 'shell');
    for (side = -1; side <= 1; side += 2) {
      var hipColor = [0.67, 0.90, 1, 0.60];
      tube(pelvis, curve(32, function (t) { return [side * (0.027 + Math.sin(t * Math.PI) * 0.106), -0.113 - t * 0.087, 0.035 + Math.sin(t * Math.PI) * 0.012]; }), 0.007, 'rib', hipColor, 10);
    }
    for (side = -1; side <= 1; side += 2) {
      var arm = part(side < 0 ? 'right upper arm' : 'left upper arm', [side * 0.259, 0.346, -0.014], [side * 0.16, 0.056, -0.013], 1, [0.74, 0.91, 1, 0.47]);
      ellipsoid(arm, [side * 0.209, 0.468, -0.018], [0.064, 0.067, 0.067], 'shell');
      limb(arm, [side * 0.214, 0.436, -0.018], [side * 0.298, 0.203, -0.010], 0.049, 0.036);
      var forearm = part(side < 0 ? 'right forearm' : 'left forearm', [side * 0.321, 0.105, -0.003], [side * 0.137, -0.012, 0.028], 1, [0.79, 0.91, 1, 0.54]);
      limb(forearm, [side * 0.299, 0.197, -0.010], [side * 0.347, 0.006, 0.008], 0.039, 0.026);
      var hand = part(side < 0 ? 'right hand' : 'left hand', [side * 0.358, -0.074, 0.014], [side * 0.135, -0.035, 0.035], 1, [0.84, 0.94, 1, 0.66]);
      ellipsoid(hand, [side * 0.351, -0.041, 0.013], [0.028, 0.046, 0.018], 'shell');
      for (var finger = 0; finger < 4; finger++) {
        var fx = side * (0.330 + finger * 0.014);
        limb(hand, [fx, -0.069, 0.014], [fx + side * 0.009, -0.124 + Math.abs(finger - 1.5) * 0.010, 0.019], 0.007, 0.0045);
      }
      limb(hand, [side * 0.330, -0.034, 0.020], [side * 0.308, -0.071, 0.031], 0.010, 0.006);
    }
    for (side = -1; side <= 1; side += 2) {
      var thigh = part(side < 0 ? 'right thigh' : 'left thigh', [side * 0.097, -0.335, -0.012], [side * 0.107, -0.061, -0.020], 1, [0.78, 0.90, 1, 0.48]);
      limb(thigh, [side * 0.094, -0.195, -0.009], [side * 0.105, -0.481, -0.007], 0.077, 0.043);
      var shin = part(side < 0 ? 'right shin' : 'left shin', [side * 0.106, -0.666, -0.018], [side * 0.085, -0.063, 0.034], 1, [0.81, 0.91, 1, 0.54]);
      limb(shin, [side * 0.104, -0.493, -0.009], [side * 0.109, -0.813, -0.006], 0.048, 0.028);
      var foot = part(side < 0 ? 'right foot' : 'left foot', [side * 0.109, -0.849, 0.034], [side * 0.063, -0.075, 0.029], 1, [0.88, 0.92, 1, 0.64]);
      ellipsoid(foot, [side * 0.111, -0.851, 0.025], [0.046, 0.039, 0.090], 'shell');
      for (var toe = 0; toe < 3; toe++) ellipsoid(foot, [side * (0.089 + toe * 0.019), -0.858, 0.095], [0.010, 0.016, 0.020], 'shell');
    }
    if (self._parts.length !== PART_COUNT) throw new Error('AnatomyFigure part topology changed unexpectedly.');
    this._geometry = {};
    Object.keys(groups).forEach(function (name) {
      var data = new Float32Array(groups[name]);
      if (name !== 'glow') {
        // Back-to-front construction order is deterministic and retains the
        // organ layers when a shared context is configured without depth.
        var order = [];
        for (var offset = 0; offset < data.length; offset += STRIDE * 3) order.push({ offset: offset, z: data[offset + 2] + data[offset + STRIDE + 2] + data[offset + STRIDE * 2 + 2] });
        order.sort(function (a, b) { return a.z - b.z; });
        var sorted = new Float32Array(data.length);
        for (var i = 0; i < order.length; i++) sorted.set(data.subarray(order[i].offset, order[i].offset + STRIDE * 3), i * STRIDE * 3);
        data = sorted;
      }
      var buffer = self.gl.createBuffer();
      self.gl.bindBuffer(self.gl.ARRAY_BUFFER, buffer);
      self.gl.bufferData(self.gl.ARRAY_BUFFER, data, self.gl.STATIC_DRAW);
      self._buffers.push(buffer);
      self._geometry[name] = { buffer: buffer, count: groups[name].length / STRIDE };
    });
    this._counts = { parts: PART_COUNT, organs: 6, triangles: triangles, vertices: groups.shell.length / STRIDE + groups.organ.length / STRIDE + groups.rib.length / STRIDE, glowPoints: groups.glow.length / STRIDE };
  };

  AnatomyFigure.prototype._bind = function (geometry) {
    var gl = this.gl, a = this._attributes;
    gl.bindBuffer(gl.ARRAY_BUFFER, geometry.buffer);
    var offset = 0;
    [['Position', 3], ['Normal', 3], ['Color', 4], ['Scatter', 3], ['Center', 3], ['Data', 4]].forEach(function (spec) {
      var location = a[spec[0]];
      if (location >= 0) { gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, spec[1], gl.FLOAT, false, STRIDE * 4, offset * 4); }
      offset += spec[1];
    });
  };

  AnatomyFigure.prototype.draw = function (state) {
    state = state || {};
    var last = this._last, gl = this.gl, u = this._uniforms;
    last.reveal = clamp(finite(state.anatomyReveal, 0), 0, 1);
    last.pullback = clamp(finite(state.anatomyPullback, 0), 0, 1);
    last.assembly = clamp(finite(state.anatomyAssembly, 0), 0, 1);
    last.opacity = clamp(finite(state.anatomyOpacity, 0), 0, 1);
    last.reducedMotion = !!state.reducedMotion;
    if (last.reducedMotion) { last.pullback = 1; last.assembly = 1; }
    last.assembledParts = 0; last.movingParts = 0;
    for (var p = 0; p < PART_COUNT; p++) {
      var start = p / PART_COUNT * 0.94;
      if (last.assembly >= start + 0.032) last.assembledParts++;
      else if (last.assembly > start) last.movingParts++;
    }
    last.settledParts = last.assembledParts;
    last.cameraScale = Math.min(0.83, Math.max(1, finite(state.width, gl.drawingBufferWidth)) / Math.max(1, finite(state.height, gl.drawingBufferHeight)) / 0.56 * 0.92) * (4.9 + (1.0 - 4.9) * smooth(0, 1, last.pullback));
    last.drawCalls = 0;
    last.visible = this.ready && !this._disposed && last.reveal > 0.0001 && last.opacity > 0.0001 && !gl.isContextLost();
    if (!last.visible) return;
    var width = Math.max(1, finite(state.width, gl.drawingBufferWidth));
    var height = Math.max(1, finite(state.height, gl.drawingBufferHeight));
    var dpr = clamp(finite(state.dpr, window.devicePixelRatio || 1), 1, 2);
    var ratio = width / height;
    var scaleValue = Math.min(0.83, ratio / 0.56 * 0.92);
    var pointer = state.pointer || [0, 0];
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.useProgram(this._program);
    if (this._vaoExtension) this._vaoExtension.bindVertexArrayOES(null);
    for (var i = 0; i < this._maxAttributes; i++) {
      gl.disableVertexAttribArray(i);
      if (this._instancingExtension) this._instancingExtension.vertexAttribDivisorANGLE(i, 0);
    }
    gl.disable(gl.DEPTH_TEST); gl.depthMask(false);
    gl.disable(gl.CULL_FACE); gl.disable(gl.SCISSOR_TEST); gl.disable(gl.STENCIL_TEST);
    gl.colorMask(true, true, true, true);
    gl.enable(gl.BLEND); gl.blendEquation(gl.FUNC_ADD);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1f(u.Time, last.reducedMotion ? 0 : finite(state.time, 0));
    gl.uniform1f(u.Reveal, last.reveal); gl.uniform1f(u.Pullback, last.pullback);
    gl.uniform1f(u.Assembly, last.assembly); gl.uniform1f(u.Opacity, last.opacity);
    gl.uniform1f(u.Aspect, ratio); gl.uniform1f(u.Scale, scaleValue); gl.uniform1f(u.Dpr, dpr);
    gl.uniform1f(u.MaxPointSize, this._maxPointSize);
    gl.uniform2f(u.Pointer, last.reducedMotion ? 0 : clamp(finite(pointer[0], 0), -1, 1), last.reducedMotion ? 0 : clamp(finite(pointer[1], 0), -1, 1));
    gl.uniform1f(u.Pass, 0);
    ['shell', 'organ', 'rib'].forEach(function (name) {
      this._bind(this._geometry[name]); gl.drawArrays(gl.TRIANGLES, 0, this._geometry[name].count); last.drawCalls++;
    }, this);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1f(u.Pass, 1); gl.uniform1f(u.PointSize, 9);
    this._bind(this._geometry.glow); gl.drawArrays(gl.POINTS, 0, this._geometry.glow.count); last.drawCalls++;
    gl.depthMask(true);
  };

  AnatomyFigure.prototype.getDiagnostics = function () {
    return {
      ready: this.ready && !this._disposed,
      partCount: PART_COUNT,
      organCount: this._counts.organs,
      triangleCount: this._counts.triangles,
      vertexCount: this._counts.vertices,
      glowPointCount: this._counts.glowPoints,
      partNames: this._parts.map(function (p) { return p.name; }),
      parts: this._parts.map(function (p) { return { id: p.id, name: p.name, assemblyOrder: p.id, kind: p.kind }; }),
      mobileGeometry: this._mobile,
      lastFrame: Object.assign({}, this._last),
      assemblyProgress: this._parts.map(function (p) { return smooth(p.id / PART_COUNT * 0.94, p.id / PART_COUNT * 0.94 + 0.032, this._last.assembly); }, this)
    };
  };
  AnatomyFigure.prototype.dispose = function () {
    if (this._disposed) return;
    this._disposed = true; this.ready = false;
    for (var i = 0; i < this._buffers.length; i++) this.gl.deleteBuffer(this._buffers[i]);
    this._buffers = []; this.gl.deleteProgram(this._program); this._program = null;
    this._last.visible = false; this._last.drawCalls = 0;
  };
  window.AnatomyFigure = AnatomyFigure;
})();
