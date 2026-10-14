import {chromium} from "playwright";
import assert from "node:assert/strict";

const browser=await chromium.launch({headless:true,args:[
  "--disable-dev-shm-usage","--no-sandbox","--enable-webgl",
  "--enable-unsafe-swiftshader","--use-gl=angle","--use-angle=swiftshader"
]});
try{
  for(const dimensions of [{width:1440,height:900},{width:390,height:844}]){
    const page=await browser.newPage({viewport:dimensions,deviceScaleFactor:1});
    const errors=[];page.on("pageerror",e=>errors.push(e.message));
    await page.route("https://sketchfab.com/models/**",route=>route.fulfill({
      status:200,contentType:"text/html",
      body:"<!doctype html><html><body>Mock original Sketchfab embed</body></html>"
    }));
    await page.goto("http://127.0.0.1:8183/sovietna/",{waitUntil:"domcontentloaded",timeout:25000});
    await page.waitForFunction(()=>window.__HULLET_ACTIVE_MODEL==="sovietna",{timeout:18000});
    assert.equal(await page.title(),"Sovietna · Hullet");
    assert.equal(await page.locator("#model-select").inputValue(),"sovietna");
    assert.equal(await page.locator("#model-select option").count(),25);
    assert.equal(await page.locator(".sketchfab-stage").isVisible(),true);
    assert.equal(await page.locator("#jesus-background").isVisible(),false);
    assert.match(await page.locator("#sketchfab-frame").getAttribute("src"),
      /601c179398d5467383827647b3eb70c4/);
    const positions=await page.evaluate(()=>{
      const el=s=>document.querySelector(s).getBoundingClientRect();
      const frame=el("#sketchfab-frame"),panel=el(".selector");
      return {frame:{left:frame.left,top:frame.top,width:frame.width,height:frame.height},
        panel:{left:panel.left,right:panel.right,top:panel.top,bottom:panel.bottom},
        panelPosition:getComputedStyle(document.querySelector(".selector")).position,
        scrollWidth:document.documentElement.scrollWidth};
    });
    assert.ok(Math.abs(positions.frame.left)<=2 && Math.abs(positions.frame.top)<=2);
    assert.ok(positions.frame.width>=dimensions.width-3);
    assert.ok(positions.frame.height>=dimensions.height-3);
    assert.equal(positions.panelPosition,"absolute");
    assert.ok(positions.panel.left>=-2 && positions.panel.right<=dimensions.width+2);
    assert.ok(positions.panel.bottom<=dimensions.height+2);
    assert.ok(positions.scrollWidth<=dimensions.width+3);
    await page.locator("#model-select").selectOption("thunderfury");
    await page.waitForFunction(()=>window.__HULLET_ACTIVE_MODEL==="thunderfury");
    assert.match(await page.locator("#sketchfab-frame").getAttribute("src"),
      /d4033484327540f298185d4fe87c78bb/);
    await page.locator("#model-select").selectOption("sovietna");
    assert.equal(await page.evaluate(()=>window.__HULLET_ACTIVE_MODEL),"sovietna");
    assert.deepEqual(errors,[]);
    console.log("SOVIETNA_BROWSER_PASS "+dimensions.width+"px: full viewport, floating menu, model changes");
    await page.close();
  }
}finally{await browser.close();}
