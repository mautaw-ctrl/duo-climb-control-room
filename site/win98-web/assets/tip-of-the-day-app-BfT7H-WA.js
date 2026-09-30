import{A as u,I as h,a7 as g,a8 as v,a9 as w,aa as I,o as C}from"./main-DeqTuPJI.js";import"./xterm-BwRfFNjq.js";import"./xterm-BV-LBlTX.js";import"./zenfs-5S7w0OYW.js";const f=`<div class="tip-of-the-day-content">
  <div>
    <div class="sunken-panel">
      <div class="icon-container">
          <img src="TIP_ICON_PLACEHOLDER" alt="Help Icon" width="32" height="32">
      </div>
      <div class="content-area">
          <h1 class="tip-header"><strong>Did you know...</strong></h1>
          <hr class="tip-separator" />
          <div class="tip-text-container">
              <p id="tip-text">You can scroll text up one screen by pressing Page Up. Pressing Page Down scrolls text down one screen.</p>
          </div>
      </div>
    </div>
    <div class="bottom-controls">
      <div class="field-row">
          <input type="checkbox" id="show-tips">
          <label for="show-tips">Show tips at startup</label>
      </div>
      <div class="button-group">
          <button id="next-tip">&Next Tip</button>
          <button class="default">&Close</button>
      </div>
    </div>
  </div>
</div>
`,D="data:image/x-icon;base64,AAABAAEAICAQAAEABADoAgAAFgAAACgAAAAgAAAAQAAAAAEABAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACAAAAAgIAAgAAAAIAAgACAgAAAwMDAAICAgAAAAP8AAP8AAAD//wD/AAAA/wD/AP//AAD///8AAAAAAAAAAAgAAAAAAAAAAAAAAAAAAACIgAAAAAAAAAAAAAAAAAAIiIgAAAAAAAAAAAAAAAAAiICIgAAAAAAAAAAAAAAACIgOCIgAAAAAAAAAAAAAAIiA7+CIgAAAAAAAAAAAAAiIDv7+CIgAAAAAAAAAAACIgO/v7+CIgAAAAAAAAAAIiA7+AA7+CIgAAAAAAAAAiIDv4AAA7+CIgAAAAAAACIgO/oj3cA7+CIgAAAAAAIiA7++PAAcP7+CIgAAAAAAIDv74gPdwAP7+CAAAAAAAAO/v6P8AB3Dv7+AAAAAAAA7+/vgAMzAA/v7+AAAAAAAI7+/gM7uzMO/v4AAAAAAAAI7+A7u7u7MO/gAAAAAAAAAI7wO7+/vzD+AAAAAAAAAAAIA7u4CLuzAAAAAAAAAAAAADu/sAC/vzAAAAAAAAAAAAC7u/gI+7swAAAAAAAAAAA7v7+/v7+/swAAAAAAAAAAO7v7+wv7+7MAAAAAAAAAAD+///8Pv7+zAAAAAAAAAAA7///4CPv7swAAAAAAAAAAO///8AC/v7MAAAAAAAAAAAP///AA+/uwAAAAAAAAAAADv//wAL+/sAAAAAAAAAAAADv/+Aj7uwAAAAAAAAAAAAADv7+/v7MAAAAAAAAAAAAAADO7u7MwAAAAAAAAAAAAAAAAMzMwAAAAAAAAD//v////x////4P///8B///+AP///AB///gAP//wAB//4AAP/8AAB/+AAAP/AAAB/4AAA/+AAAP/AAAB/4AAA//AAAf/4AAP//AAH//wAB//8AAf/+AAD//gAA//4AAP/+AAD//gAA//8AAf//AAH//4AD///AB///4A////g//w==",m=f.replace("TIP_ICON_PLACEHOLDER",D);class b extends u{static config={id:"tip-of-the-day",title:"Tip of the Day",description:"Provides useful tips about using the system.",icon:h.tip,category:"",width:400,height:300,resizable:!1,minimizeButton:!1,maximizeButton:!1,isSingleton:!0,tips:["To open a file or an application from desktop, double-click the icon.","To close a window, click the X in the top-right corner."]};constructor(A){super(A)}_createWindow(){const A=new $Window({id:this.id,title:this.title,outerWidth:this.width,outerHeight:this.height,resizable:this.resizable,minimizeButton:this.minimizeButton,maximizeButton:this.maximizeButton,icons:this.icon});return A.$content.html(m),A}async _onLaunch(){const A=g.reduce((t,c)=>c.tips?t.concat(c.tips):t,[]),e=this.win.$content[0];let n=Math.floor(Math.random()*A.length);const s=e.querySelector("#tip-text"),i=e.querySelector("#next-tip"),o=e.querySelector(".button-group button:last-child");i&&(i.innerHTML="",i.appendChild(window.AccessKeys.toFragment("&Next Tip"))),o&&(o.innerHTML="",o.appendChild(window.AccessKeys.toFragment("&Close")),o.addEventListener("click",()=>this.win.close()));const p=t=>{s&&(s.innerHTML=A[t],s.querySelectorAll(".tip-link").forEach(r=>{r.addEventListener("click",l=>{l.preventDefault();const d=r.getAttribute("data-app");C(d)})}))};p(n),i&&s&&i.addEventListener("click",()=>{n=(n+1)%A.length,p(n)});const a=e.querySelector("#show-tips");if(a){const t=await v();a.checked=t.includes("tipOfTheDay"),a.addEventListener("change",async()=>{a.checked?await w("tipOfTheDay"):await I("tipOfTheDay")})}}}export{b as TipOfTheDayApp};
