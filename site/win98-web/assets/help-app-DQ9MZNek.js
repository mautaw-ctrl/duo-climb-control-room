import{A as y,I as w}from"./main-XJCJPCO4.js";import"./xterm-BwRfFNjq.js";import"./xterm-BV-LBlTX.js";import"./zenfs-5S7w0OYW.js";const g=`<div class="help-app">
    <div class="toolbar">
        <button class="hide-button lightweight">
            <div class="icon"></div>
            <span>Hide</span>
        </button>
        <button class="show-button lightweight" style="display: none">
            <div class="icon"></div>
            <span>Show</span>
        </button>
        <button class="back-button lightweight" disabled>
            <div class="icon"></div>
            <span>Back</span>
        </button>
        <button class="forward-button lightweight" disabled>
            <div class="icon"></div>
            <span>Forward</span>
        </button>
        <button class="options-button lightweight">
            <div class="icon"></div>
            <span>Options</span>
        </button>
        <button class="web-help-button lightweight">
            <div class="icon"></div>
            <span>Web Help</span>
        </button>
    </div>
    <div class="main-area">
        <div class="sidebar">
            <div style="height: 100%; display: flex; flex-direction: column">
                <menu role="tablist">
                    <li role="tab" aria-selected="true">
                        <a href="#" data-target="#contents">Contents</a>
                    </li>
                    <li role="tab" aria-selected="false">
                        <a href="#" data-target="#index">Index</a>
                    </li>
                    <li role="tab" aria-selected="false">
                        <a href="#" data-target="#search">Search</a>
                    </li>
                </menu>
                <div
                    class="tab-content outset-deep"
                    id="contents"
                    style="flex-grow: 1"
                >
                    <!-- Tree view will be rendered here -->
                </div>
                <div class="tab-content outset-deep" id="index" style="display: none; flex-grow: 1">
                    <div class="index-container">
                        <label for="index-input">Type in the keyword to find:</label>
                        <input type="text" id="index-input" class="inset-deep">
                        <ul id="index-list" class="inset-deep"></ul>
                    </div>
                </div>
                <div class="tab-content outset-deep" id="search" style="display: none; flex-grow: 1">
                    <div class="search-container">
                        <label for="search-input">Type in the word(s) to search for:</label>
                        <input type="text" id="search-input" class="inset-deep">
                        <button id="list-topics-button">List Topics</button>
                        <ul id="search-results" class="inset-deep"></ul>
                    </div>
                </div>
            </div>
        </div>
        <div class="resizer"></div>
        <div class="content-panel sunken-panel">
            <!-- Selected topic content will be rendered here (iframe) -->
        </div>
    </div>
</div>
`,v="Windows Help",x=[{title:"Troubleshooting",icon:"book",file:"help/default/troubleshooting.htm",children:[{title:"Printing Problems",icon:"page",file:"help/default/printing_problems.html"},{title:"Network Problems",icon:"page",file:"help/default/network_problems.html"}]},{title:"Using Accessibility Features",icon:"book",children:[{title:"Magnifier",icon:"page",file:"help/default/magnifier.html"}]}],H={title:v,topics:x};class L extends y{static config={id:"help",title:"Help Topics",description:"Provides help and support.",icon:w.help,width:600,height:450,resizable:!0,isSingleton:!1};constructor(t){super(t),this.history=[],this.historyIndex=-1,this.currentHelpData=null,this.rootPath=""}_createWindow(){return new window.$Window({title:this.title,outerWidth:this.width,outerHeight:this.height,resizable:this.resizable,icons:this.icon,id:this.id,className:"help-window"})}async _onLaunch(t){const{win:e}=this;if(e.$content.html(g),typeof t=="string")if(t.endsWith(".hhc")){const c=await(await fetch(t)).text();this.rootPath=t.substring(0,t.lastIndexOf("/")),this.currentHelpData={title:t.split("/").pop().replace(".hhc","").replace("ms","")+" Help",topics:this.parseHHC(c)},this.currentHelpData.title.toLowerCase().startsWith("paint")&&(this.currentHelpData.title="Paint Help");const r=t.replace(".hhc",".hhk");try{const l=await fetch(r);if(l.ok){const a=await l.text();this.currentHelpData.index=this.parseHHK(a)}}catch{console.warn("Failed to load HHK file",r)}}else try{const s=await fetch(t);this.currentHelpData=await s.json()}catch(s){console.error("Failed to load help data from string",t,s)}else typeof t=="object"&&t!==null&&(t.hhc||t.hhk?(this.rootPath=t.baseUrl||"",this.currentHelpData={title:t.title||(t.hhc?"Help":"Help Topics"),topics:t.hhc?this.parseHHC(t.hhc):[],index:t.hhk?this.parseHHK(t.hhk):[]}):this.currentHelpData=t);this.currentHelpData||(this.currentHelpData=H),this.currentHelpData.title&&e.title(this.currentHelpData.title),this._setupToolbar(e),this._setupResizer(e),this._setupTabs(e),this._renderContents(),this._renderIndex(),this._setupSearch();const i=s=>{for(const c of s){if(c.file)return c;if(c.children&&c.children.length>0){const r=i(c.children);if(r)return r}}return null},n=i(this.currentHelpData.topics||[])||{title:"Welcome",file:"default.html"};this._showTopic(n)}parseHHC(t){const i=new DOMParser().parseFromString(t,"text/html"),n=c=>{const r=[],l=Array.from(c.children);for(let a=0;a<l.length;a++){const o=l[a];if(o.tagName!=="LI")continue;const d={},h=o.querySelector("object");if(h)for(const f of h.querySelectorAll("param")){const m=f.getAttribute("name"),b=f.getAttribute("value");m&&(d[m]=b)}if(!d.Name)continue;const u={title:d.Name.trim(),file:d.Local,children:[]};let p=o.querySelector("ul");!p&&a+1<l.length&&l[a+1].tagName==="UL"&&(p=l[a+1]),p&&(u.children=n(p)),r.push(u)}return r},s=i.querySelector("ul");return s?n(s):[]}parseHHK(t){const i=new DOMParser().parseFromString(t,"text/html"),n=[],s=i.querySelectorAll("object[type='text/sitemap'], object[type='Text/sitemap']");for(const c of s){const r=[];for(const o of c.querySelectorAll("param"))r.push({name:o.getAttribute("name"),value:o.getAttribute("value")});const l=r.filter(o=>o.name==="Name"),a=r.filter(o=>o.name==="Local");l.length>0&&n.push({title:l[0].value,file:a.length>0?a[0].value:null})}return n.sort((c,r)=>c.title.localeCompare(r.title))}_renderContents(){const t=this.win.$content.find("#contents");if(t.empty(),!this.currentHelpData.topics)return;const e=document.createElement("ul");e.className="tree-view",this.currentHelpData.topics.forEach(i=>{e.appendChild(this._createTreeNode(i))}),t.append(e)}_renderIndex(){const t=this.win.$content.find("#index-list");if(t.empty(),!this.currentHelpData.index)return;this.currentHelpData.index.forEach(i=>{const n=document.createElement("li");n.textContent=i.title,n.addEventListener("click",()=>{this.win.$content.find("#index-list li").removeClass("selected"),$(n).addClass("selected"),this._showTopic(i,!0)}),t.append(n)});const e=this.win.$content.find("#index-input");e.on("input",()=>{const i=e.val().toLowerCase();t.find("li").each((n,s)=>{const c=$(s).text().toLowerCase();$(s).toggle(c.includes(i))})})}_setupSearch(){const t=this.win.$content.find("#search-input"),e=this.win.$content.find("#list-topics-button"),i=this.win.$content.find("#search-results"),n=[],s=r=>{r.forEach(l=>{l.file&&n.push(l),l.children&&s(l.children)})};this.currentHelpData.topics&&s(this.currentHelpData.topics),this.currentHelpData.index&&this.currentHelpData.index.forEach(r=>{r.file&&(n.some(l=>l.file===r.file)||n.push(r))});const c=()=>{const r=t.val().toLowerCase();if(i.empty(),!r)return;n.filter(a=>a.title.toLowerCase().includes(r)).forEach(a=>{const o=document.createElement("li");o.textContent=a.title,o.addEventListener("click",()=>{i.find("li").removeClass("selected"),$(o).addClass("selected"),this._showTopic(a,!0)}),i.append(o)})};e.on("click",c),t.on("keypress",r=>{r.which===13&&c()})}_createTreeNode(t){const e=document.createElement("li");e.className="tree-node";const i=document.createElement("div");if(i.className="item",i.textContent=t.title,e.appendChild(i),t.children&&t.children.length>0){e.classList.add("folder");const n=document.createElement("ul");t.children.forEach(s=>{n.appendChild(this._createTreeNode(s))}),e.appendChild(n),i.addEventListener("click",s=>{s.stopPropagation(),e.classList.toggle("expanded"),this._selectItem(i,t)})}else e.classList.add("page"),i.addEventListener("click",n=>{n.stopPropagation(),this._selectItem(i,t)});return e}_selectItem(t,e){this.win.$content.find(".item").removeClass("selected"),$(t).addClass("selected"),e.file&&this._showTopic(e,!0)}_joinPaths(t,e){if(!t)return e;if(!e)return t;const i=t.endsWith("/"),n=e.startsWith("/");return i&&n?t+e.substring(1):!i&&!n?t+"/"+e:t+e}async _showTopic(t,e=!1){const i=this.win.$content.find(".content-panel");let n=t.file;if(n&&!n.startsWith("http")&&!n.startsWith("/")&&(n=this.rootPath?this._joinPaths(this.rootPath,n):this._joinPaths("/win98-web/",n)),n){let s=i.find("iframe")[0];s||(s=document.createElement("iframe"),i.empty().append(s)),s.src=n,e&&(this.historyIndex<this.history.length-1&&(this.history=this.history.slice(0,this.historyIndex+1)),this.history.push(n),this.historyIndex=this.history.length-1,this._updateHistoryButtons())}}_updateHistoryButtons(){const t=this.win.$content.find(".back-button")[0],e=this.win.$content.find(".forward-button")[0];t.disabled=this.historyIndex<=0,e.disabled=this.historyIndex>=this.history.length-1}_setupToolbar(t){const e=t.$content.find(".hide-button")[0],i=t.$content.find(".show-button")[0],n=t.$content.find(".back-button")[0],s=t.$content.find(".forward-button")[0],c=t.$content.find(".options-button")[0],r=t.$content.find(".web-help-button")[0],l=t.$content.find(".sidebar")[0],a=t.$content.find(".resizer")[0];e.addEventListener("click",()=>{const o=l.offsetWidth+a.offsetWidth;l.style.display="none",a.style.display="none",e.style.display="none",i.style.display="flex";const d=t.width();t.width(d-o),t.css("left",t.offset().left+o)}),i.addEventListener("click",()=>{l.style.display="flex",a.style.display="block",i.style.display="none",e.style.display="flex";const o=l.offsetWidth+a.offsetWidth,d=t.width();t.width(d+o),t.css("left",Math.max(0,t.offset().left-o))}),n.addEventListener("click",()=>{const o=t.$content.find("iframe")[0];o&&o.contentWindow&&o.contentWindow.history.back()}),s.addEventListener("click",()=>{const o=t.$content.find("iframe")[0];o&&o.contentWindow&&o.contentWindow.history.forward()}),c.addEventListener("click",o=>{const d=[{item:"Print...",action:()=>{const h=t.$content.find("iframe")[0];h&&h.contentWindow&&h.contentWindow.print()}},{item:"Refresh",action:()=>{const h=t.$content.find("iframe")[0];h&&h.contentWindow&&h.contentWindow.location.reload()}},{item:"Back",enabled:()=>this.historyIndex>0,action:()=>n.click()},{item:"Forward",enabled:()=>this.historyIndex<this.history.length-1,action:()=>s.click()}];window.ContextMenu(d,{left:o.clientX,top:o.clientY})}),r.addEventListener("click",()=>{this._showTopic({file:"online_support.htm"},!0)}),t.$content.on("load","iframe",()=>{this._updateHistoryButtons()})}_setupResizer(t){const e=t.$content.find(".resizer")[0],i=t.$content.find(".sidebar")[0];let n=!1;e.addEventListener("mousedown",s=>{n=!0,document.body.style.cursor="ew-resize",t.$content.find(".content-panel").css("pointer-events","none")}),window.addEventListener("mousemove",s=>{if(!n)return;const c=t.$content[0].getBoundingClientRect(),r=s.clientX-c.left,l=Math.max(50,Math.min(r,c.width-50));i.style.flexBasis=`${l}px`,i.style.width=`${l}px`}),window.addEventListener("mouseup",()=>{n&&(n=!1,document.body.style.cursor="",t.$content.find(".content-panel").css("pointer-events",""))})}_setupTabs(t){const e=t.$content.find('[role="tab"]');e.on("click",i=>{i.preventDefault();const n=$(i.currentTarget),s=n.find("a").attr("data-target");e.attr("aria-selected","false"),n.attr("aria-selected","true"),t.$content.find(".tab-content").hide(),t.$content.find(s).css("display","flex")})}}export{L as default};
