import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import worker from "../src/index.js";

const page=readFileSync("site/sovietna/index.html","utf8");
const css=readFileSync("site/sovietna/sovietna.css","utf8");
const archive=readFileSync("site/hullet-lab/model-frontpage/app.js","utf8");
const original=readFileSync("site/hullet-lab/model-frontpage/index.html","utf8");

test("Sovietna has its own full-screen 3D entry with model archive controls",()=>{
  assert.match(page,/<title>Sovietna · Hullet<\/title>/);
  assert.match(page,/<body class="sovietna-route" data-initial-model="sovietna">/);
  assert.match(page,/<option value="sovietna" selected>/);
  assert.match(page,/id="sketchfab-frame"/);
  assert.match(page,/id="model-select"/);
  assert.match(page,/id="previous"/);
  assert.match(page,/id="next"/);
  assert.match(css,/\.sovietna-route \.sketchfab-stage\{inset:0;width:100vw;height:100svh/);
  assert.match(css,/\.sovietna-route \.selector\{position:absolute/);
  assert.match(css,/@media\(max-width:760px\)/);
  assert.match(page,/\.\/sovietna\.css/);
  assert.doesNotMatch(page,/<base /);
});

test("Dedicated entrypoint keeps all original 25 3D models working",()=>{
  assert.match(original,/<option value="jesus" selected>/);
  assert.match(archive,/document\.body\.dataset\.initialModel/);
  assert.match(archive,/choose\(initialModel\)/);
  assert.match(archive,/601c179398d5467383827647b3eb70c4/);
  assert.match(archive,/new URL\(data\.url,import\.meta\.url\)/);
  assert.match(archive,/new URL\("\.\.\/\.\.\/jesus-figure\.png",import\.meta\.url\)/);
  assert.equal((page.match(/<option value=/g)||[]).length,25+4);
});

for(const method of ["GET","HEAD"]){
  test(method+" /sovietna redirects to /sovietna/ preserving query",async()=>{
    const response=await worker.fetch(
      new Request("https://jesuslovesyou.dk/sovietna?entry=ragnarok",{method}),{},{});
    assert.equal(response.status,308);
    assert.equal(response.headers.get("location"),
      "https://jesuslovesyou.dk/sovietna/?entry=ragnarok");
  });
}
