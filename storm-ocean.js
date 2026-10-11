/* StormOcean — dependency-free WebGL 1 cinematic background.
 * new StormOcean(gl); renderer.draw({ width, height, dpr, time, storm,
 *   flood, light, parting, reveal, pointer: [x, y], scene, reducedMotion });
 * width/height are framebuffer pixels; the controller owns canvas/DPR sizing.
 * Optional centerX overrides the .60 landscape / .50 portrait vanishing point.
 * Optional introTime controls the two thunder events independently of time.
 * Shared-context contract: draw() sets its own viewport/program/buffer,
 * disables depth/cull/scissor/stencil/blending, draws an opaque full-screen
 * triangle, and disables its vertex attribute before returning. The next
 * renderer should select its program and enable its own attributes/blending.
 */
(function (global) {
  'use strict';

  var vertex = [
    'attribute vec2 aPosition;',
    'varying vec2 vUv;',
    'void main() {',
    '  vUv = aPosition * 0.5 + 0.5;',
    '  gl_Position = vec4(aPosition, 0.0, 1.0);',
    '}'
  ].join('\n');

  var fragment = `
precision highp float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uTime;
uniform float uIntroTime;
uniform float uCenterX;
uniform float uStorm;
uniform float uFlood;
uniform float uLight;
uniform float uParting;
uniform float uReveal;
uniform float uScene;
uniform float uReduced;

const vec3 NIGHT = vec3(0.003, 0.009, 0.022);
const vec3 GOLD = vec3(1.0, 0.68, 0.28);
const vec3 SUN = vec3(-0.035, 0.305, -0.952);

float hash(vec2 p) {
  p = fract(p * vec2(0.1031, 0.11369));
  p += dot(p, p.yx + 19.19);
  return fract((p.x + p.y) * p.x);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), f.x), f.y);
}

float fbm(vec2 p) {
  float f = 0.0;
  f += 0.5 * noise(p); p = mat2(0.8, -0.6, 0.6, 0.8) * p * 2.04 + 11.7;
  f += 0.25 * noise(p); p = mat2(0.8, -0.6, 0.6, 0.8) * p * 2.02 + 8.3;
  f += 0.125 * noise(p); p = mat2(0.8, -0.6, 0.6, 0.8) * p * 2.01 + 5.6;
  f += 0.0625 * noise(p);
  return f;
}

float pulse(float center, float width) {
  float d = (uIntroTime - center) / width;
  return exp(-d * d);
}

float flash() {
  // Two single thunder events; they never loop, and reduced motion removes them.
  return (pulse(3.72, 0.075) + 0.55 * pulse(7.55, 0.065))
       * uStorm * (1.0 - uLight * 0.85) * (1.0 - uParting * 0.8)
       * (1.0 - uReduced);
}

float gapWidth() {
  return mix(0.015, 3.35, smoothstep(0.025, 0.95, uParting));
}

float seaLevel() {
  return mix(-1.75, 0.12, smoothstep(0.0, 1.0, uFlood));
}

float surgeStrength() {
  return uStorm * smoothstep(0.06, 0.55, uFlood)
       * pow(1.0 - uLight, 2.0) * pow(1.0 - uParting, 2.0);
}

// The low-frequency swells also have analytic derivatives, so intersection
// refinement and surface normals do not need multiple expensive height calls.
vec3 swell(vec2 p) {
  float t = uTime;
  float a = dot(p, vec2(0.27, 0.09)) - t * 0.54;
  float b = dot(p, vec2(-0.31, 0.42)) + t * 0.67;
  float c = dot(p, vec2(0.91, 0.73)) - t * 1.12;
  float d = dot(p, vec2(-1.72, 1.33)) + t * 1.37;
  float strength = mix(0.62, 1.0, uStorm) * (1.0 - 0.18 * uLight);
  float surge = surgeStrength();
  strength *= 1.0 + surge * 2.15;
  float h = 0.28 * sin(a) + 0.17 * sin(b) + 0.062 * sin(c) + 0.022 * sin(d);
  vec2 g = 0.28 * cos(a) * vec2(0.27, 0.09)
         + 0.17 * cos(b) * vec2(-0.31, 0.42)
         + 0.062 * cos(c) * vec2(0.91, 0.73)
         + 0.022 * cos(d) * vec2(-1.72, 1.33);
  if (surge < 0.0001) return vec3(h * strength, g * strength);
  // A broad incoming crest advances toward the camera while the flood rises.
  // Its exact derivative keeps the steep face, reflections and foam coherent.
  float crestZ = mix(-58.0, -2.5, smoothstep(0.10, 0.98, uFlood));
  float front = (p.y - crestZ) / 6.2;
  float back = (p.y - crestZ + 22.0) / 10.5;
  float trough = (p.y - crestZ - 9.0) / 8.5;
  float crest = 3.75 * exp(-front * front);
  float second = 1.2 * exp(-back * back);
  float hollow = 0.47 * exp(-trough * trough);
  float surgeHeight = crest + second - hollow;
  float surgeSlope = -2.0 * front * crest / 6.2
                   - 2.0 * back * second / 10.5
                   + 2.0 * trough * hollow / 8.5;
  return vec3(h * strength + surgeHeight * surge,
              g.x * strength, g.y * strength + surgeSlope * surge);
}

float boundary(float z, float y, float side) {
  return gapWidth() + 0.10 * max(y + 1.05, 0.0)
       + uParting * (0.18 * sin(z * 0.57 - uTime * 0.64 + side * 0.8)
       + 0.08 * sin(z * 1.31 + uTime * 0.83 + side * 2.1)
       + 0.035 * sin(y * 2.0 + z * 0.47 - uTime));
}

float wallHeight(vec2 p) {
  float edge = exp(-abs(abs(p.x) - gapWidth() - 0.52) * 1.6);
  return seaLevel() + uParting * (4.95 + 0.32 * edge)
       + swell(p).x;
}

vec3 sky(vec3 rd, float thunder) {
  float up = clamp(rd.y, 0.0, 1.0);
  vec3 col = mix(vec3(0.026, 0.041, 0.075), vec3(0.003, 0.009, 0.024),
                 smoothstep(0.0, 0.72, up));
  col += vec3(0.022, 0.012, 0.04) * uReveal * pow(up, 1.7);
  float sunAngle = max(dot(rd, SUN), 0.0);
  col += GOLD * uLight * (0.04 * pow(sunAngle, 5.0)
                       + 0.32 * pow(sunAngle, 24.0)
                       + 1.05 * pow(sunAngle, 165.0));

  // A projected, domain-warped cloud sheet creates cloud volume without a
  // per-pixel volumetric ray march. Horizon density blends into marine mist.
  vec2 cp = rd.xz / (max(rd.y, 0.0) + 0.34) * 2.3;
  cp += vec2(uTime * 0.019, -uTime * 0.027);
  float large = fbm(cp * 0.73);
  float detail = fbm(cp * 2.65 + vec2(large * 2.4, large * 1.2));
  float density = smoothstep(0.29, 0.74, large * 0.73 + detail * 0.40);
  float opening = pow(sunAngle, 31.0) * uLight;
  density *= 1.0 - opening * 0.86;
  float edge = pow(clamp(1.0 - abs(density - 0.42) * 2.0, 0.0, 1.0), 7.0);
  vec3 cloud = mix(vec3(0.008, 0.015, 0.031), vec3(0.058, 0.079, 0.115), detail);
  cloud += GOLD * uLight * edge * pow(sunAngle, 8.0) * 0.30;
  cloud += vec3(0.23, 0.27, 0.36) * thunder * (0.15 + detail * 0.8);
  col = mix(col, cloud, density * (0.82 - uLight * 0.12));
  col += GOLD * opening * 0.035;
  col += vec3(0.09, 0.13, 0.20) * thunder;

  // Tiny, sparsely revealed stars remain subordinate to the clouds and figure.
  vec2 starUV = rd.xz / (abs(rd.y) + 0.18) * 145.0;
  vec2 starCell = floor(starUV);
  float starSeed = hash(starCell);
  float star = 1.0 - smoothstep(0.0, 0.09, length(fract(starUV) - 0.5));
  star *= step(0.9957, starSeed) * smoothstep(0.03, 0.45, rd.y);
  col += vec3(0.27, 0.31, 0.44) * star * uReveal * (1.0 - density);
  return col;
}

float oceanIntersection(vec3 ro, vec3 rd) {
  float level = seaLevel() + uParting * 4.95;
  if (surgeStrength() > 0.025 && uParting < 0.045) {
    if (rd.y > 0.16) return 1000.0;
    // The incoming wave can stand above eye height. Bracket its first visible
    // face instead of assuming that every ray first meets a flat sea plane.
    float nearT = 0.0;
    float farT = 0.45;
    for (int i = 0; i < 24; i++) {
      vec3 test = ro + rd * farT;
      float residual = test.y - level - swell(test.xz).x;
      if (residual < 0.0) {
        for (int j = 0; j < 6; j++) {
          float mid = (nearT + farT) * 0.5;
          vec3 point = ro + rd * mid;
          if (point.y - level - swell(point.xz).x < 0.0) farT = mid;
          else nearT = mid;
        }
        return (nearT + farT) * 0.5;
      }
      nearT = farT;
      farT += 1.2 + farT * 0.11;
    }
  }
  if (abs(rd.y) < 0.001) return 1000.0;
  float t = (level - ro.y) / rd.y;
  if (t < 0.0) return 1000.0;
  // A handful of Newton steps converges on the actual animated swell surface.
  for (int i = 0; i < 7; i++) {
    vec3 p = ro + rd * t;
    vec3 wave = swell(p.xz);
    float edge = exp(-abs(abs(p.x) - gapWidth() - 0.52) * 1.6);
    float h = level + uParting * 0.32 * edge + wave.x;
    float derivative = rd.y - dot(wave.yz, rd.xz);
    float safeDerivative = (derivative < 0.0 ? -1.0 : 1.0) * max(abs(derivative), 0.065);
    t -= clamp((p.y - h) / safeDerivative, -8.0, 8.0);
  }
  if (t <= 0.0 || t > 230.0) return 1000.0;
  vec3 p = ro + rd * t;
  if (uParting > 0.045 && abs(p.x) < boundary(p.z, p.y, sign(p.x))) return 1000.0;
  return t;
}

float wallIntersection(vec3 ro, vec3 rd, float side) {
  if (uParting < 0.045 || rd.x * side < 0.006) return 1000.0;
  float slope = side * rd.x - 0.10 * rd.y;
  if (slope < 0.003) return 1000.0;
  float center = (gapWidth() + 0.10 * (ro.y + 1.05) - side * ro.x) / slope;
  float radius = 0.31 / slope;
  float low = max(0.0, center - radius), high = center + radius;
  // A bounded face solve remains stable where distant curved faces overlap.
  for (int i = 0; i < 10; i++) {
    float middle = (low + high) * 0.5;
    vec3 test = ro + rd * middle;
    float residual = side * test.x - boundary(test.z, test.y, side);
    if (residual > 0.0) high = middle;
    else low = middle;
  }
  float t = (low + high) * 0.5;
  vec3 p = ro + rd * t;
  if (t <= 0.0 || t > 230.0 || p.y < -1.12 || p.y > wallHeight(p.xz)) return 1000.0;
  return t;
}

vec3 waterColor(vec3 p, vec3 rd, float distanceToHit, float thunder) {
  vec3 wave = swell(p.xz);
  vec2 fine = vec2(
    sin(p.x * 3.2 + p.z * 2.7 + uTime * 1.6),
    cos(p.x * 2.6 - p.z * 4.3 - uTime * 1.35)
  ) * 0.055;
  fine += vec2(sin(p.z * 8.0 - uTime * 2.1), cos(p.x * 9.1 + uTime * 1.7)) * 0.018;
  fine *= 1.0 / (1.0 + distanceToHit * 0.018);
  vec3 n = normalize(vec3(-wave.y - fine.x, 1.0, -wave.z - fine.y));
  vec3 reflected = reflect(rd, n);
  float fresnel = 0.045 + 0.955 * pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
  vec3 reflection = sky(reflected, thunder);
  float facingLight = max(dot(reflected, SUN), 0.0);
  float glint = pow(facingLight, 125.0) * 2.25 + pow(facingLight, 15.0) * 0.20;
  vec3 col = mix(vec3(0.005, 0.018, 0.031), reflection * 0.91, fresnel * 0.83);
  col += vec3(0.020, 0.055, 0.079) * (0.25 + max(n.y, 0.0) * 0.5);
  col += GOLD * glint * uLight;
  col += vec3(0.075, 0.095, 0.155) * pow(facingLight, 8.0) * uReveal * 0.16;
  float foamNoise = fbm(p.xz * 2.1 + vec2(uTime * 0.11, -uTime * 0.19));
  float foam = smoothstep(0.18, 0.33, wave.x) * smoothstep(0.54, 0.77, foamNoise);
  float crest = exp(-abs(abs(p.x) - gapWidth() - 0.5) * 4.0) * uParting;
  foam += crest * smoothstep(0.43, 0.72, foamNoise) * 0.55;
  col += vec3(0.14, 0.21, 0.27) * foam * (0.33 + uLight * 0.33);
  float whitewater = smoothstep(2.4, 4.0, wave.x)
                   * smoothstep(0.35, 0.67, foamNoise) * surgeStrength();
  col += vec3(0.24, 0.34, 0.40) * whitewater * 0.33;
  float fog = 1.0 - exp(-distanceToHit * 0.011);
  vec3 mist = vec3(0.031, 0.049, 0.074) + GOLD * uLight * 0.032;
  return mix(col, mist, fog * 0.7);
}

vec3 wallColor(vec3 p, vec3 rd, float side, float distanceToHit, float thunder) {
  float t = uTime;
  float dz = uParting * (0.1026 * cos(p.z * 0.57 - t * 0.64 + side * 0.8)
           + 0.1048 * cos(p.z * 1.31 + t * 0.83 + side * 2.1)
           + 0.01645 * cos(p.y * 2.0 + p.z * 0.47 - t));
  float dy = 0.10 + uParting * 0.07 * cos(p.y * 2.0 + p.z * 0.47 - t);
  vec2 domain = vec2(p.z * 0.43, p.y * 0.85 - t * 0.25);
  float body = fbm(domain + vec2(sin(p.y * 1.3 + t * 0.35), 0.0));
  float threads = noise(vec2(p.z * 2.3 + sin(p.y * 1.7 - t * 0.6), p.y * 1.25 - t * 0.65));
  float detailFade = 1.0 / (1.0 + distanceToHit * 0.028);
  threads = mix(0.45, threads, detailFade);
  float fine = sin(p.z * 4.7 + p.y * 2.9 - t * 2.0) * 0.10;
  vec3 n = normalize(vec3(-side, dy + fine, dz + (threads - 0.5) * 0.27));
  float fresnel = pow(1.0 - max(dot(-rd, n), 0.0), 3.0);
  vec3 reflected = reflect(rd, n);
  float lit = max(dot(n, SUN), 0.0);
  float height = wallHeight(p.xz);
  float elevation = clamp((p.y + 1.12) / max(height + 1.12, 0.1), 0.0, 1.0);
  vec3 col = mix(vec3(0.004, 0.013, 0.026), vec3(0.027, 0.095, 0.137),
                 body * 0.61 + elevation * 0.3);
  col += vec3(0.031, 0.071, 0.094) * pow(threads, 4.0) * (0.3 + elevation * 0.6);
  col += sky(reflected, thunder) * fresnel * 0.46;
  col += GOLD * uLight * (lit * 0.12 + pow(max(dot(reflected, SUN), 0.0), 22.0) * 0.46);
  col += vec3(0.060, 0.027, 0.10) * uReveal * (body * 0.25 + fresnel * 0.16);
  // The crest is an irregular narrow silver/gold rim, with scattered foam.
  float rim = exp(-max(height - p.y, 0.0) * 5.0);
  float foam = smoothstep(0.40, 0.74, body + threads * 0.23);
  col += (vec3(0.21, 0.32, 0.38) + GOLD * uLight * 0.18) * rim * (0.33 + foam * 0.52);
  float streak = pow(threads, 7.0) * smoothstep(0.15, 0.70, elevation);
  col += vec3(0.09, 0.15, 0.20) * streak * 0.42;
  col += thunder * vec3(0.06, 0.085, 0.13) * elevation;
  float fog = 1.0 - exp(-distanceToHit * 0.012);
  return mix(col, vec3(0.025, 0.042, 0.073) + GOLD * uLight * 0.028, fog * 0.76);
}

vec3 corridorColor(vec3 p, vec3 rd, float distanceToHit) {
  float grain = fbm(p.xz * vec2(1.1, 2.0));
  float sheen = noise(p.xz * vec2(3.0, 8.0) + vec2(0.0, uTime * 0.025));
  float trail = exp(-p.x * p.x * 0.16);
  float perspective = 1.0 / (1.0 + distanceToHit * 0.007);
  float ripple = pow(max(sin(p.z * 4.5 + grain * 5.0), 0.0), 7.0);
  vec3 col = vec3(0.008, 0.017, 0.027) * (0.45 + grain * 0.75);
  col += GOLD * uLight * trail * (0.007 + sheen * 0.023 + ripple * 0.018) * perspective;
  col += vec3(0.032, 0.025, 0.060) * uReveal * (0.2 + grain * 0.25);
  float nearWall = exp(-abs(abs(p.x) - gapWidth()) * 1.55);
  col += vec3(0.015, 0.037, 0.055) * nearWall * (0.2 + sheen * 0.6);
  float fog = 1.0 - exp(-distanceToHit * 0.014);
  return mix(col, vec3(0.025, 0.037, 0.056) + GOLD * uLight * 0.035, fog * 0.75);
}

float rainLayer(vec2 uv, float scale, float speed, float seed) {
  vec2 q = vec2(uv.x + uv.y * 0.20, uv.y) * vec2(scale, scale * 0.21);
  q.y += uTime * speed;
  vec2 cell = floor(q);
  vec2 f = fract(q);
  float rnd = hash(cell + seed);
  float x = 0.2 + rnd * 0.6;
  float line = 1.0 - smoothstep(0.0, 0.028, abs(f.x - x));
  float tail = smoothstep(0.28, 0.95, f.y) * (1.0 - smoothstep(0.93, 1.0, f.y));
  return line * tail * step(0.63, rnd);
}

void main() {
  float arrival = max(max(uStorm, uFlood), uLight);
  if (arrival < 0.0001) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 screen = vec2((uv.x - uCenterX) * 2.0 * aspect, uv.y * 2.0 - 1.0) * 0.75;
  vec3 ro = vec3(uPointer.x * 0.09, 3.65 + uPointer.y * 0.035, 10.0);
  vec3 rd = normalize(vec3(screen.x + uPointer.x * 0.017,
                           screen.y - 0.15 + uPointer.y * 0.01, -1.25));
  float thunder = flash();
  vec3 col = sky(rd, thunder);
  float waterT = 1000.0, leftT = 1000.0, rightT = 1000.0, floorT = 1000.0;
  if (uFlood > 0.008) {
    waterT = oceanIntersection(ro, rd);
    leftT = wallIntersection(ro, rd, -1.0);
    rightT = wallIntersection(ro, rd, 1.0);
    if (uParting > 0.045 && rd.y < -0.003) {
      floorT = (-1.12 - ro.y) / rd.y;
      vec3 floorPoint = ro + rd * floorT;
      if (abs(floorPoint.x) > boundary(floorPoint.z, floorPoint.y, sign(floorPoint.x))) floorT = 1000.0;
    }
    float hit = min(min(waterT, floorT), min(leftT, rightT));
    if (hit < 230.0) {
      vec3 p = ro + rd * hit;
      vec3 surface;
      if (leftT <= min(min(waterT, floorT), rightT)) surface = wallColor(p, rd, -1.0, hit, thunder);
      else if (rightT <= min(waterT, floorT)) surface = wallColor(p, rd, 1.0, hit, thunder);
      else if (floorT < waterT) surface = corridorColor(p, rd, hit);
      else surface = waterColor(p, rd, hit, thunder);
      col = mix(col, surface, smoothstep(0.0, 0.30, uFlood));
    }
  }

  // Atmospheric shafts fan out from a soft opening high above the corridor.
  vec2 origin = vec2(uCenterX - 0.005, 0.78);
  vec2 ray = uv - origin;
  float descent = max(-ray.y, 0.0);
  float angle = atan(ray.x, max(descent, 0.02));
  float shafts = pow(max(sin(angle * 22.0 + 0.30), 0.0), 7.0)
               + 0.33 * pow(max(sin(angle * 49.0 - 0.52), 0.0), 9.0);
  float cone = exp(-abs(ray.x) / (0.06 + descent * 0.32));
  float beam = cone * smoothstep(0.0, 0.15, descent) * exp(-descent * 1.7);
  col += GOLD * uLight * beam * (0.016 + shafts * 0.035);
  col += vec3(0.09, 0.04, 0.17) * uReveal * beam * 0.038;

  float rain = rainLayer(vec2(uv.x * aspect, uv.y), 115.0, 8.5, 1.0)
             + rainLayer(vec2(uv.x * aspect, uv.y), 73.0, 5.3, 9.4) * 0.48;
  rain *= uStorm * (1.0 - uLight * 0.64) * (1.0 - uParting * 0.79);
  col += vec3(0.15, 0.20, 0.28) * rain * 0.27;

  if (thunder > 0.002) {
    float ly = uv.y;
    float lx = 0.225 + sin(ly * 29.0) * 0.016 + sin(ly * 67.0 + 0.8) * 0.006;
    float bolt = exp(-abs(uv.x - lx) * 650.0) + exp(-abs(uv.x - lx) * 95.0) * 0.08;
    bolt *= smoothstep(0.44, 0.52, ly) * (1.0 - smoothstep(0.90, 0.96, ly));
    col += vec3(0.54, 0.64, 0.92) * bolt * thunder * 0.84;
  }

  // Frame the luminous figure with deep blue edges and a restrained film grain.
  float vignette = 1.0 - smoothstep(0.25, 1.15, length((uv - 0.5) * vec2(1.15, 0.9)));
  col *= mix(0.51, 1.0, vignette);
  col *= smoothstep(0.0, 0.32, arrival);
  col *= 1.0 + uScene * 0.025;
  col += (hash(gl_FragCoord.xy + floor(uTime * 12.0)) - 0.5) * 0.0011 * arrival;
  col = max(col, vec3(0.0));
  // Exposure and a gentle display curve keep the midnight palette readable.
  col = vec3(1.0) - exp(-col * 1.30);
  col = pow(col, vec3(0.83));
  gl_FragColor = vec4(col, 1.0);
}
`;

  function compile(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      var error = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error('StormOcean shader: ' + error);
    }
    return shader;
  }

  function finite(value, fallback) {
    return typeof value === 'number' && isFinite(value) ? value : fallback;
  }

  function unit(value, fallback) {
    return Math.max(0, Math.min(1, finite(value, fallback || 0)));
  }

  function StormOcean(gl) {
    if (!(this instanceof StormOcean)) return new StormOcean(gl);
    if (!gl) throw new Error('StormOcean requires a WebGL context.');
    this.gl = gl;
    var highp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    var source = highp && highp.precision ? fragment : fragment.replace('precision highp float;', 'precision mediump float;');
    var vs = compile(gl, gl.VERTEX_SHADER, vertex);
    var fs;
    try { fs = compile(gl, gl.FRAGMENT_SHADER, source); }
    catch (error) { gl.deleteShader(vs); throw error; }
    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      var log = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error('StormOcean program: ' + log);
    }
    this.program = program;
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    this.maxAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    this.vaoExtension = gl.getExtension('OES_vertex_array_object');
    this.instancingExtension = gl.getExtension('ANGLE_instanced_arrays');
    this.uniforms = {};
    ['uResolution', 'uPointer', 'uTime', 'uIntroTime', 'uCenterX', 'uStorm', 'uFlood', 'uLight', 'uParting', 'uReveal', 'uScene', 'uReduced'].forEach(function (name) {
      this.uniforms[name] = gl.getUniformLocation(program, name);
    }, this);
  }

  StormOcean.prototype.draw = function (state) {
    var gl = this.gl;
    if (!this.program || gl.isContextLost()) return;
    state = state || {};
    var width = Math.max(1, Math.round(finite(state.width, gl.drawingBufferWidth)));
    var height = Math.max(1, Math.round(finite(state.height, gl.drawingBufferHeight)));
    var pointer = state.pointer || [0, 0];
    var reduced = !!state.reducedMotion;
    var uniforms = this.uniforms;
    if (this.vaoExtension) this.vaoExtension.bindVertexArrayOES(null);
    gl.viewport(0, 0, width, height);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.STENCIL_TEST);
    gl.colorMask(true, true, true, true);
    gl.depthMask(false);
    for (var i = 0; i < this.maxAttributes; i++) {
      gl.disableVertexAttribArray(i);
      if (this.instancingExtension) this.instancingExtension.vertexAttribDivisorANGLE(i, 0);
    }
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(uniforms.uResolution, width, height);
    gl.uniform2f(uniforms.uPointer, reduced ? 0 : Math.max(-1, Math.min(1, finite(pointer[0], 0))), reduced ? 0 : Math.max(-1, Math.min(1, finite(pointer[1], 0))));
    gl.uniform1f(uniforms.uTime, reduced ? 18.0 : Math.max(0, finite(state.time, 0)));
    gl.uniform1f(uniforms.uIntroTime, reduced ? 18.0 : Math.max(0, finite(state.introTime, finite(state.time, 0))));
    gl.uniform1f(uniforms.uCenterX, unit(state.centerX, width / height > 1.1 ? 0.60 : 0.50));
    gl.uniform1f(uniforms.uStorm, unit(state.storm));
    gl.uniform1f(uniforms.uFlood, unit(state.flood));
    gl.uniform1f(uniforms.uLight, unit(state.light));
    gl.uniform1f(uniforms.uParting, unit(state.parting));
    gl.uniform1f(uniforms.uReveal, unit(state.reveal));
    gl.uniform1f(uniforms.uScene, Math.max(0, Math.min(2, finite(state.scene, 0))));
    gl.uniform1f(uniforms.uReduced, reduced ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disableVertexAttribArray(0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.depthMask(true);
  };

  StormOcean.prototype.dispose = function () {
    if (this.program) this.gl.deleteProgram(this.program);
    if (this.buffer) this.gl.deleteBuffer(this.buffer);
    this.program = null;
    this.buffer = null;
  };

  global.StormOcean = StormOcean;
})(window);
