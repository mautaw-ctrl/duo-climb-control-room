import {chromium} from "playwright";
import assert from "node:assert/strict";

const browser=await chromium.launch({
  headless:true,
  args:["--disable-dev-shm-usage","--no-sandbox"]
});
try{
  for(const dimensions of [{width:1480,height:880},{width:390,height:844}]){
    const page=await browser.newPage({viewport:dimensions,deviceScaleFactor:1});
    const errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    // Test our integration independently of external Sketchfab availability.
    await page.route("https://sketchfab.com/models/**",route=>
      route.fulfill({
        status:200,
        contentType:"text/html",
        body:"<!doctype html><html><title>Mock Sketchfab viewer</title><body>3D test stub</body></html>"
      }));
    await page.goto("http://127.0.0.1:8181/fladbroed/",{
      waitUntil:"domcontentloaded",timeout:25000
    });
    await page.waitForFunction(()=>typeof window.__FLADBROED_STATE==="function",{timeout:15000});
    const initial=await page.evaluate(()=>window.__FLADBROED_STATE());
    assert.equal(initial.active,"chole");
    assert.equal(initial.modelId,"a4fcd5f9a8b34a9883bda4198d63801a");
    assert.equal(await page.locator("#model-select").inputValue(),"chole");
    assert.equal(await page.title(),"fladbrød");
    assert.ok((await page.locator("#model-viewer").getAttribute("src")).includes(initial.modelId));
    await page.locator("#next").click();
    const next=await page.evaluate(()=>window.__FLADBROED_STATE());
    assert.equal(next.active,"whopper");
    assert.ok((await page.locator("#model-viewer").getAttribute("src")).includes("3d8fa6fd454041f3ab113cb5a6cc1550"));
    assert.equal(await page.locator("#license-label").textContent(),"CC BY 4.0");
    assert.equal(await page.locator("body").getAttribute("data-scene"),"whopper");
    await page.locator("#model-select").selectOption("chole");
    assert.equal(await page.evaluate(()=>window.__FLADBROED_STATE().active),"chole");
    assert.equal(await page.locator("#license-label").textContent(),"CC BY-NC-SA 4.0");
    // The Sketchfab iframe must be the backdrop, not a card in a three-column grid.
    const layout=await page.evaluate(()=>{
      const viewer=document.querySelector("#model-viewer").getBoundingClientRect();
      const main=document.querySelector("main").getBoundingClientRect();
      const hero=document.querySelector(".hero").getBoundingClientRect();
      const panel=document.querySelector(".control-panel").getBoundingClientRect();
      return {
        viewer:{left:viewer.left,top:viewer.top,width:viewer.width,height:viewer.height},
        main:{left:main.left,top:main.top,width:main.width,height:main.height},
        hero:{left:hero.left,top:hero.top},
        panel:{left:panel.left,top:panel.top,right:panel.right,bottom:panel.bottom},
        heroPosition:getComputedStyle(document.querySelector(".hero")).position,
        panelPosition:getComputedStyle(document.querySelector(".control-panel")).position
      };
    });
    assert.ok(Math.abs(layout.viewer.left)<=2 && Math.abs(layout.viewer.top)<=2,
      "3D viewer must begin at the viewport origin");
    assert.ok(layout.viewer.width>=dimensions.width-3 && layout.viewer.height>=dimensions.height-3,
      "3D viewer must cover the full viewport");
    assert.equal(layout.heroPosition,"absolute");
    assert.equal(layout.panelPosition,"absolute");
    assert.ok(layout.panel.right<=dimensions.width+3 &&
      layout.panel.left>=-3 && layout.panel.bottom<=dimensions.height+3,
      "Floating controls must stay within the viewport");
    const scrollWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
    assert.ok(scrollWidth<=dimensions.width+3,
      "Fladbrød overflows at "+dimensions.width+"px: "+scrollWidth);
    assert.deepEqual(errors,[]);
    console.log("FLADBROED_BROWSER_PASS",dimensions.width,
      "Chole defaults; second model switches; correct credit; no overflow");
    await page.close();
  }
}finally{await browser.close();}
