import{A as _,I as H,h as z,i as O}from"./main-XJCJPCO4.js";import{w as P}from"./zenfs-5S7w0OYW.js";import"./xterm-BwRfFNjq.js";import"./xterm-BV-LBlTX.js";class j extends _{static config={id:"image-resizer",title:"Image Resizer",description:"Resize and convert images.",icon:H.image,width:920,height:720,resizable:!0,isSingleton:!1};constructor(a){super(a)}_createWindow(){const a=this.win=new $Window({title:this.title,width:this.width,height:this.height,resizable:this.resizable,icons:this.icon}),s=this._createMenuBar();return a.setMenuBar(s),a.$content.append('<div class="image-resizer-container"></div>'),a}_onLaunch(){const a=this.win.$content.find(".image-resizer-container")[0];a.innerHTML=this._getHTML(),this._initApp()}_createMenuBar(){return new MenuBar({"&File":[{label:"&Open...",action:()=>this.openFile()},"MENU_DIVIDER",{label:"E&xit",action:()=>this.win.close()}],"&Help":[{label:"&About Image Resizer",action:()=>this.showAboutDialog()}]})}_getHTML(){return`
            <div class="image-resizer-app">
                <div class="main-content">
                    <fieldset class="controls-group">
                        <legend>Resize Options</legend>
                        <div class="field-row-stacked" style="width: 120px;">
                            <label for="widthInput">Width (px):</label>
                            <input type="number" id="widthInput" min="1" value="800">
                        </div>
                        <div class="field-row-stacked" style="width: 120px;">
                            <label for="heightInput">Height (px):</label>
                            <input type="number" id="heightInput" min="1" value="600">
                        </div>
                        <div class="field-row" style="margin-top: 10px;">
                            <input type="checkbox" id="aspectRatio" checked>
                            <label for="aspectRatio">Keep Aspect Ratio</label>
                        </div>
                        <div class="buttons-container">
                            <button id="enlargeBtn" disabled>Enlarge</button>
                            <button id="downloadBtn" disabled>Download</button>
                        </div>
                    </fieldset>

                    <div class="preview-area" id="previewArea">
                        <div class="canvas-box">
                            <h3>Original</h3>
                            <div class="sunken-panel">
                                <canvas id="originalCanvas"></canvas>
                            </div>
                        </div>
                        <div class="canvas-box">
                            <h3>Enlarged</h3>
                            <div class="sunken-panel">
                                <canvas id="enlargedCanvas"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="status-bar" id="info">
                    <p class="status-bar-field">Drag an image onto the window or use File > Open</p>
                </div>
            </div>
        `}_initApp(){const a=this.win.$content,s=a.find("#widthInput")[0],h=a.find("#heightInput")[0],D=a.find("#aspectRatio")[0],A=a.find("#enlargeBtn")[0],L=a.find("#downloadBtn")[0],C=a.find("#previewArea")[0],x=a.find("#originalCanvas")[0],d=a.find("#enlargedCanvas")[0],F=a.find("#info")[0],l=a.find(".image-resizer-app")[0];let t=null,c=!1;this.openFile=async()=>{const e=await z({title:"Open Image",mode:"open",fileTypes:[{label:"Image Files",extensions:["jpg","jpeg","png","gif","bmp"]},{label:"All Files",extensions:["*"]}]});if(e)try{const i=await O(e);E(i)}catch(i){console.error("Error loading image from ZenFS:",i)}},this.showAboutDialog=()=>{alert("Image Resizer v1.0\\n\\nResizes images with pixel-perfect precision.")},l.addEventListener("dragover",e=>{e.preventDefault(),e.stopPropagation(),l.classList.add("dragover")}),l.addEventListener("dragleave",e=>{e.preventDefault(),e.stopPropagation(),l.classList.remove("dragover")}),l.addEventListener("drop",e=>{e.preventDefault(),e.stopPropagation(),l.classList.remove("dragover");const i=e.dataTransfer.files[0];i&&i.type.startsWith("image/")&&E(i)});function E(e){const i=new FileReader;i.onload=p=>{const n=new Image;n.onload=()=>{t=n,B(),s.value=n.width*4,h.value=n.height*4,A.disabled=!1,C.style.display="flex"},n.src=p.target.result},i.readAsDataURL(e)}function B(){x.width=t.width,x.height=t.height,x.getContext("2d").drawImage(t,0,0)}s.addEventListener("input",()=>{if(D.checked&&t&&!c){c=!0;const e=t.height/t.width;h.value=Math.round(s.value*e),c=!1}}),h.addEventListener("input",()=>{if(D.checked&&t&&!c){c=!0;const e=t.width/t.height;s.value=Math.round(h.value*e),c=!1}}),A.addEventListener("click",k);function k(){if(!t)return;const e=parseInt(s.value),i=parseInt(h.value),p=e/t.width,n=i/t.height,o=Math.min(p,n),r=Math.round(t.width*o),v=Math.round(t.height*o),g=document.createElement("canvas");g.width=t.width,g.height=t.height;const M=g.getContext("2d");M.drawImage(t,0,0);const u=M.getImageData(0,0,g.width,g.height).data;d.width=r,d.height=v;const R=d.getContext("2d"),y=R.createImageData(r,v),f=y.data;for(let w=0;w<v;w++)for(let m=0;m<r;m++){const $=Math.floor(m/o),b=(Math.floor(w/o)*t.width+$)*4,I=(w*r+m)*4;f[I]=u[b],f[I+1]=u[b+1],f[I+2]=u[b+2],f[I+3]=u[b+3]}R.putImageData(y,0,0),L.disabled=!1,F.innerHTML=`
                <p class="status-bar-field">Original: ${t.width}×${t.height}px</p>
                <p class="status-bar-field">Enlarged: ${r}×${v}px (${o.toFixed(2)}× scale)</p>
            `}L.addEventListener("click",async()=>{const e=`enlarged_${d.width}x${d.height}.png`,i=await z({title:"Save Enlarged Image",mode:"save",suggestedName:e,fileTypes:[{label:"PNG Image",extensions:["png"]}]});if(i){const n=d.toDataURL("image/png").split(",")[1],o=Uint8Array.from(atob(n),r=>r.charCodeAt(0));await P(i,o)}})}}export{j as ImageResizerApp};
