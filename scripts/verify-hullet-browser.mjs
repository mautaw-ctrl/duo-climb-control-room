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
  for(const [name,path,readyVar] of [
    ["instancing","/instancing/","__HULLET_THREE_OK"],
    ["head","/head/","__HULLET_HEAD_READY"]
  ]){
    const page=await browser.newPage({viewport:{width:1440,height:860},deviceScaleFactor:1});
    const pageErrors=[];
    page.on("pageerror",e=>pageErrors.push(e.message));
    const responses=[];
    page.on("response",res=>{
      if(res.status()>=400)responses.push(res.status()+" "+res.url());
    });
    await page.goto(base+path,{waitUntil:"domcontentloaded",timeout:25000});
    await page.waitForFunction(()=>{
      const e=document.querySelector("#loading");
      return Boolean(e?.classList.contains("finished"));
    },{timeout:22000});
    const state=await page.evaluate(readyVar=>({
      initialized:Boolean(window[readyVar]),
      visibleError:!document.querySelector("#render-error")?.hidden,
      errorText:document.querySelector("#render-error p")?.textContent||"",
      fpsOrStatus:document.querySelector("#gpu-stat")?.textContent||"",
      canvasWidth:document.querySelector("canvas#universe")?.width||0
    }),readyVar);
    console.log(JSON.stringify({name,state,pageErrors,responses},null,2));
    assert.ok(state.canvasWidth>0, name+": Canvas never initialized");
    assert.ok(!state.visibleError,name+": "+state.errorText+" JS: "+pageErrors.join("; "));
    assert.ok(state.initialized,name+": Three.js did not initialize (even though loader ended)");

    if(name==="instancing"){
      await page.locator('[data-shape="fibonacci"]').click();
      assert.equal(await page.locator('[data-shape="fibonacci"]').getAttribute("aria-pressed"),"true");
      await page.locator('[data-palette="ice"]').click();
      assert.equal(await page.locator('[data-palette="ice"]').getAttribute("aria-pressed"),"true");
    }
    if(name==="head"){
      await page.evaluate(async()=>{
        const canvas=document.createElement("canvas");
        canvas.width=128;canvas.height=160;
        const ctx=canvas.getContext("2d");
        ctx.fillStyle="#172c47";ctx.fillRect(0,0,128,160);
        ctx.fillStyle="#e4b492";ctx.beginPath();ctx.ellipse(64,71,46,67,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle="#4c3127";ctx.fillRect(22,15,85,20);
        ctx.fillStyle="#332b34";
        ctx.fillRect(38,69,12,6);ctx.fillRect(80,69,12,6);
        const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));
        const file=new File([blob],"portrait.png",{type:"image/png"});
        const dataTransfer=new DataTransfer();
        dataTransfer.items.add(file);
        const input=document.querySelector("#portrait-file");
        input.files=dataTransfer.files;
        input.dispatchEvent(new Event("change",{bubbles:true}));
      });
      await page.waitForFunction(() => {
        const b=document.querySelector("#export-ply");
        return b&&!b.disabled;
      },{timeout:15000});
      assert.match(await page.locator("#scan-status").textContent(),/KLAR/);
    }
    await page.screenshot({path:"/tmp/hullet-browser-screenshots/"+name+".png",fullPage:false});
    await page.close();
  }
  console.log("HULLET_BROWSER_SMOKE_SUCCESS both scenes start and portrait upload works");
}catch(error){
  failed=true;console.error(error.stack||String(error));
}finally{await browser.close();}
if(failed)process.exitCode=1;
