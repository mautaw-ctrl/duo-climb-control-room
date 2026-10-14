import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import worker from "../src/index.js";

const prefix="site/fladbroed/";
const html=readFileSync(prefix+"index.html","utf8");
const css=readFileSync(prefix+"fladbroed.css","utf8");
const js=readFileSync(prefix+"fladbroed.js","utf8");

test("Fladbrød is an independent, mobile-ready 3D website",()=>{
  assert.match(html,/<title>fladbrød<\/title>/);
  assert.match(html,/name="viewport"/);
  assert.match(html,/id="model-viewer"/);
  assert.match(html,/id="viewer-caption"/);
  assert.match(css,/@media\(max-width:720px\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.doesNotThrow(()=>execFileSync(process.execPath,["--check",prefix+"fladbroed.js"]));
});
test("Chole Bhature is the default model using the exact uploaded model's Sketchfab ID",()=>{
  assert.match(html,/src="https:\/\/sketchfab\.com\/models\/a4fcd5f9a8b34a9883bda4198d63801a\/embed/);
  assert.match(html,/<option value="chole" selected>/);
  assert.match(js,/let active="chole"/);
  assert.match(js,/__FLADBROED_STATE/);
  assert.match(js,/a4fcd5f9a8b34a9883bda4198d63801a/);
  assert.match(html,/Chole Bhature af/);
  assert.match(html,/seirogan/);
  assert.match(html,/creativecommons\.org\/licenses\/by-nc-sa\/4\.0/);
});
test("Second dish and interactive menu use the creator's original 3D viewer",()=>{
  assert.match(html,/<option value="whopper">/);
  assert.match(js,/3d8fa6fd454041f3ab113cb5a6cc1550/);
  assert.match(js,/model-select/);
  assert.match(js,/iframe\.src=embed\(model\)/);
  assert.match(js,/fullscreen/);
  assert.match(js,/13000/);
  assert.doesNotMatch(html,/<script[^>]+src=["']https?:/);
});
for(const method of ["GET","HEAD"]){
  test(method+" /fladbroed resolves to the slash-suffixed static page",async()=>{
    const req=new Request("https://jesuslovesyou.dk/fladbroed?source=menu",{method});
    const response=await worker.fetch(req,{},{});
    assert.equal(response.status,308);
    assert.equal(response.headers.get("location"),"https://jesuslovesyou.dk/fladbroed/?source=menu");
  });
}
