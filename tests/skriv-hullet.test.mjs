/* Smoke checks for the real home route. Run with: node --test tests/skriv-hullet.test.mjs */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import vm from "node:vm";
const html=readFileSync("site/index.html","utf8");
const css=readFileSync("site/skriv-hullet.css","utf8");
const js=readFileSync("site/skriv-hullet.js","utf8");
const ids=new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map(x=>x[1]));

test("Homepage is in Danish with the requested name",()=>{
  assert.match(html,/<html lang="da">/);
  assert.match(html,/<h1 id="heroTitle">SKRIV <strong>HULLET<\/strong><\/h1>/);
  assert.doesNotMatch(html,/JESUSLOVESYOU|JESUS<em>LOVES/i);
});
test("All three existing destinations remain intact",()=>{
  for(const route of ["/win98","/tracker/","/player/"])assert.ok(html.includes('href="'+route+'"'));
});
test("Interactive controls and intro are wired to real elements",()=>{
  const references=[...js.matchAll(/\bel\("([A-Za-z0-9_-]+)"\)/g)].map(x=>x[1]);
  for(const id of references)assert.ok(ids.has(id),"Missing HTML element id: "+id);
  for(const id of ["universe","intro","introProgress","skipIntro","introAudio","replayIntro","sound","modeAuto","modeDraw","intensity","symmetry","palette","clearDraw","portalDive","destinationer","guestbook","fxToggle"])assert.ok(ids.has(id),"Missing control: "+id);
});
test("JS parses without browser runtime and avoids CDN animation dependencies",()=>{
  assert.doesNotThrow(()=>new vm.Script(js));
  assert.match(html,/class="gate-orbit gate-orbit-a"/);
  assert.ok(js.includes("function renderDrawing("));
  assert.doesNotMatch(js,/requestAnimationFrame/);
  assert.ok(js.includes("function drawSegment("));
  assert.ok(js.includes("function scheduleAudio("));
  assert.ok(js.includes("function finishIntro("));
  assert.doesNotMatch(html,/three\.js|pixi\.js|unpkg\.com|cdnjs\.cloudflare/i);
});
test("Animation and sound respect user choice",()=>{
  assert.match(js,/prefers-reduced-motion/);
  assert.match(js,/audio\.resume\(\)/);
  assert.match(js,/soundOn=false/);
  assert.match(js,/pointercancel/);
  assert.match(js,/visibilitychange/);
  assert.match(html,/<button\b[^>]*id="introAudio"[^>]*type="button"[^>]*>/);
  assert.match(css,/#universe/);
  assert.match(css,/focus-visible/);
});
test("Static asset paths are correct",()=>{
  assert.ok(html.includes('href="/skriv-hullet.css?v=cosmos-4"'));
  assert.ok(html.includes('src="/skriv-hullet.js?v=cosmos-4"'));
});

test("Cinematic SVG art exists and stays light enough to cache",()=>{
  const art=readFileSync("site/hullet-cosmos.svg","utf8");
  assert.match(art,/viewBox="0 0 1600 940"/);
  assert.match(art,/<radialGradient id="vortex">/);
  assert.match(art,/id="sand"/);
  assert.ok(html.includes('src="/hullet-cosmos.svg"'));
  assert.ok(Buffer.byteLength(art)<110_000,"Scene artwork must stay under 110 KB");
});
test("Automatic animation has no continuous JavaScript rendering loop",()=>{
  assert.doesNotMatch(js,/requestAnimationFrame\s*\(/);
  assert.doesNotMatch(js,/setInterval\(\s*\(\s*\)\s*=>\s*tick/);
  assert.match(js,/function beginIntro\(/);
  assert.match(js,/function finishIntro\(/);
  assert.match(js,/if\(soundOn\)\s*\{/);
  assert.match(css,/animation:orbit/);
});
test("Existing application components are not edited by homepage redesign",()=>{
  assert.match(html,/href="\/win98"/);
  assert.match(html,/href="\/tracker\/"/);
  assert.match(html,/href="\/player\/"/);
});
