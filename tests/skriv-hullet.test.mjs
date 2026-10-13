import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import vm from "node:vm";
const html=readFileSync("site/index.html","utf8");
const css=readFileSync("site/hullet.css","utf8");
const js=readFileSync("site/hullet.js","utf8");
const figure=readFileSync("site/jesus-figure.js","utf8");
test("Name is exactly hullet in browser and main heading",()=>{
  assert.match(html,/<title>hullet<\/title>/);
  assert.match(html,/<h1 id="main-title">hullet<\/h1>/);
  assert.doesNotMatch(html,/SKRIV HULLET|REJS UDEN|1998|PORTAL|SIGNAL|LET THERE BE LIGHT/i);
});
test("Working destinations are preserved",()=>{
  for(const route of ["/win98","/tracker/","/player/"])assert.ok(html.includes('href="'+route+'"'));
});
test("Original point-cloud figure is rendered rather than substituted with an illustration",()=>{
  assert.match(html,/src="\/jesus-figure\.js(?:\?[^" ]+)?"/);
  assert.match(js,/new window\.JesusFigure\(gl\)/);
  assert.match(js,/figure\.draw\(/);
  assert.match(figure,/gl\.drawArrays\(gl\.POINTS/);
  assert.match(html,/jesus-figure\.png/);
  assert.doesNotMatch(html,/hullet-cosmos\.svg/);
});
test("Scene is capped and reduced motion and hidden tabs are respected",()=>{
  assert.match(js,/ts-last<33/);
  assert.match(js,/prefers-reduced-motion: reduce/);
  assert.match(js,/visibilitychange/);
  assert.match(css,/@media\(max-width:760px\)/);
  assert.doesNotThrow(()=>new vm.Script(js));
});

test("The original character has a visible fallback if WebGL fails or loses its context",()=>{
  assert.match(html,/class="fallback"/);
  assert.match(js,/webglcontextlost/);
  assert.match(js,/webglcontextrestored/);
  assert.match(js,/figure-unavailable/);
  assert.match(css,/\.has-webgl \.fallback\{opacity:\.24;visibility:visible\}/);
  assert.match(css,/\.atmosphere::before/);
});
test("The original GPU particles assemble during the entrance",()=>{
  assert.match(js,/figure\.draw\(state\(\)\)/);
  assert.match(js,/entryProgress:appearance/);
  assert.match(js,/const reveal=settled\?1:ease/);
  assert.match(js,/Promise\.race/);
});
