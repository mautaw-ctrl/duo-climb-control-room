import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";

const base="http://127.0.0.1:8181/hullet-lab";
const browser=await chromium.launch({
  headless:true,
  args:["--enable-webgl","--enable-unsafe-swiftshader","--use-gl=angle","--use-angle=swiftshader"]
});
await mkdir("/tmp/hullet-browser-screenshots",{recursive:true});
let failed=false;
try{
  // The removed experiments are no longer part of public navigation.
  for(const dimensions of [{width:1920,height:850},{width:390,height:844}]){
    const page=await browser.newPage({viewport:dimensions});
    const errors=[];page.on("pageerror",e=>errors.push(e.message));
    await page.goto(base+"/",{waitUntil:"domcontentloaded",timeout:30000});
    assert.equal(await page.title(),"hullet");
    assert.equal(await page.locator("#studio-modal").count(),0);
    assert.equal(await page.locator('[data-studio="head"]').count(),0);
    assert.equal(await page.locator('[data-studio="instancing"]').count(),0);
    assert.ok(await page.locator("#figure").count());
    assert.ok(await page.locator('a[href="./model-frontpage/"]').count());
    assert.ok(await page.evaluate(()=>document.body.scrollWidth)<=dimensions.width+4);
    assert.deepEqual(errors,[]);
    await page.close();
  }

  for(const dimensions of [{width:1440,height:900},{width:390,height:844}]){
    const page=await browser.newPage({viewport:dimensions,deviceScaleFactor:1});
    const errors=[],failedAssets=[];
    page.on("pageerror",e=>errors.push(e.message));
    page.on("response",r=>{if(r.status()>=400)failedAssets.push(r.status()+" "+r.url());});
    await page.goto(base+"/artefact/",{waitUntil:"domcontentloaded",timeout:25000});
    await page.waitForFunction(()=>window.__HULLET_ARTEFACT_READY===true,{timeout:23000});
    const state=await page.evaluate(()=>window.__HULLET_ARTEFACT_INSPECT.state());
    assert.ok(state.ready,"glTF demo did not load");
    assert.ok(state.interactives>=12,"Actual Three.js menu planes were not constructed");
    assert.equal(await page.locator("#error").isVisible(),false);
    assert.ok(await page.locator("#viewport").evaluate(e=>e.width>0));
    assert.equal(await page.locator('[data-menu="portal"]').getAttribute("aria-pressed"),"true");
    await page.locator("#autorotate").uncheck();
    // On mobile the setting is below the canvas, so scroll back to the 3D
    // object before tapping its projected marker. Mouse clicks use viewport
    // coordinates, not document-space coordinates.
    await page.locator("#viewport").scrollIntoViewIfNeeded();
    await page.waitForTimeout(180);
    // Click the actual 3D glowing lens marker rather than its HTML twin.
    const p=await page.evaluate(()=>window.__HULLET_ARTEFACT_INSPECT.nodeScreen("material"));
    assert.ok(p&&Number.isFinite(p.x)&&Number.isFinite(p.y));
    await page.mouse.click(p.x,p.y);
    assert.equal(await page.locator('[data-menu="material"]').getAttribute("aria-pressed"),"true",
      "3D Raycaster must open menu anchored inside the object");
    await page.locator('[data-menu="diagnostics"]').click();
    assert.equal(await page.locator('[data-menu="diagnostics"]').getAttribute("aria-pressed"),"true");
    await page.locator("#wireframe").check();
    await page.locator("#wireframe").uncheck();
    const fullWidth=await page.evaluate(()=>document.body.scrollWidth);
    assert.ok(fullWidth<=dimensions.width+4,
      "Artefact horizontally overflows at "+dimensions.width+": "+fullWidth);
    assert.deepEqual(errors,[],"No JavaScript errors during viewer boot/interactions");
    assert.deepEqual(failedAssets,[],"Self-hosted 3D libraries and model must return 200");
    await page.screenshot({path:"/tmp/hullet-browser-screenshots/artefact-"+dimensions.width+".png",fullPage:false});
    console.log("HULLET_ARTEFACT_SUCCESS "+dimensions.width+"px: glTF loaded, 3D raycast menu opened, no overflow");
    await page.close();
  }


  // Actual default is the original Jesus renderer; GLTF is only loaded on demand.
  for(const dimensions of [{width:1440,height:900},{width:390,height:844}]){
    const page=await browser.newPage({viewport:dimensions,deviceScaleFactor:1});
    const errors=[];page.on("pageerror",e=>errors.push(e.message));
    await page.goto(base+"/model-frontpage/",{waitUntil:"domcontentloaded",timeout:25000});
    await page.waitForFunction(()=>window.__HULLET_JESUS_READY===true,{timeout:25000});
    assert.equal(await page.locator("#model-select").inputValue(),"jesus");
    assert.ok(await page.locator("#jesus-background").evaluate(canvas=>canvas.width>0));
    assert.ok(await page.locator("#jesus-background").isVisible());
    assert.equal(await page.locator("#background").isVisible(),false);
    assert.equal(await page.locator("#model-select option").count(),12);
    await page.locator("#model-select").selectOption("fox");
    await page.waitForFunction(()=>window.__HULLET_MODELFRONT_READY===true
      && window.__HULLET_ACTIVE_MODEL==="fox",{timeout:22000});
    await page.locator("#model-select").selectOption("milkTruck");
    await page.waitForFunction(()=>window.__HULLET_ACTIVE_MODEL==="milkTruck",{timeout:16000});
    // Larger licensed assets are already bundled locally, not streamed
    // from untrusted third-party servers at selection time.
    const largeKey=dimensions.width>900?"boomBox":"irisLamp";
    await page.locator("#model-select").selectOption(largeKey);
    await page.waitForFunction(key=>window.__HULLET_ACTIVE_MODEL===key,
      largeKey,{timeout:35000});
    await page.locator("#model-select").selectOption("thunderfury");
    assert.equal(await page.locator(".sketchfab-stage").isVisible(),true);
    assert.match(await page.locator("#sketchfab-frame").getAttribute("src"),/d4033484327540f298185d4fe87c78bb/);
    await page.locator("#model-select").selectOption("jesus");
    assert.ok(await page.locator("#jesus-background").isVisible());
    assert.equal(await page.locator(".sketchfab-stage").isVisible(),false);
    const width=await page.evaluate(()=>document.body.scrollWidth);
    assert.ok(width<=dimensions.width+4,"Model preview overflows "+dimensions.width+": "+width);
    assert.deepEqual(errors,[],"No JS errors in model page");
    await page.screenshot({path:"/tmp/hullet-browser-screenshots/model-preview-"+dimensions.width+".png",fullPage:false});
    console.log("MODEL_FRONT_SUCCESS "+dimensions.width+"px: Jesus first, GLTF assets, Sketchfab, no overflow");
    await page.close();
  }

  console.log("HULLET_BROWSER_SMOKE_SUCCESS glTF scene, 3D menus, both older scenes and mobile portal");
}catch(error){
  failed=true;console.error(error.stack||String(error));
}finally{await browser.close();}
if(failed)process.exitCode=1;
