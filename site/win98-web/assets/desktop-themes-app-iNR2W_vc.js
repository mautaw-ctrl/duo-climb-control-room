import{A,I as H,w as C,x as M,y as O,z as W,m as K,L as D,B as _,C as q,E as R,F as B,G as $,S as y,H as j,J as Z,K as U,M as I,N as V,O as J,P as G,Q as F,R as Y,T as S,U as Q,V as N,W as X}from"./main-DeqTuPJI.js";import"./zenfs-5S7w0OYW.js";import"./xterm-BwRfFNjq.js";import"./xterm-BV-LBlTX.js";const ee=`<div class="desktop-icons-preview">
    <div class="desktop-icon-preview" data-icon="my-computer">
        <img src="" alt="My Computer" />
        <span>My Computer</span>
    </div>
    <div class="desktop-icon-preview" data-icon="network">
        <img src="" alt="Network Neighborhood" />
        <span>Network Neighborhood</span>
    </div>
    <div class="desktop-icon-preview" data-icon="recycle-bin">
        <img src="" alt="Recycle Bin" />
        <span>Recycle Bin</span>
    </div>
</div>
<div class="os-window app-window preview-window inactive-window-preview">
    <div class="title-bar window-titlebar">
        <div class="title-bar-text">Inactive Window</div>
        <div class="title-bar-controls">
            <button
                aria-label="Minimize"
                class="window-minimize-button window-action-minimize window-button"
            >
                <span class="window-button-icon"></span>
            </button>
            <button
                aria-label="Maximize"
                class="window-maximize-button window-action-maximize window-button"
            >
                <span class="window-button-icon"></span>
            </button>
            <button
                aria-label="Close"
                class="close-button window-close-button window-action-close window-button"
            >
                <span class="window-button-icon"></span>
            </button>
        </div>
    </div>
    <div class="window-body"></div>
</div>
<div class="os-window app-window preview-window active-window-preview">
    <div class="title-bar window-titlebar">
        <div class="title-bar-text">Active Window</div>
        <div class="title-bar-controls">
            <button
                aria-label="Minimize"
                class="window-minimize-button window-action-minimize window-button"
            >
                <span class="window-button-icon"></span>
            </button>
            <button
                aria-label="Maximize"
                class="window-maximize-button window-action-maximize window-button"
            >
                <span class="window-button-icon"></span>
            </button>
            <button
                aria-label="Close"
                class="close-button window-close-button window-action-close window-button"
            >
                <span class="window-button-icon"></span>
            </button>
        </div>
    </div>
    <div class="window-body">
        <div class="menu-bar">
            <span>Normal</span><span>Disabled</span
            ><span class="selected">Selected</span>
        </div>
        <div class="main-content"><span>Window Text</span></div>
    </div>
</div>
<div class="os-window app-window preview-window message-box-preview">
    <div class="title-bar window-titlebar">
        <div class="title-bar-text">Message Box</div>
        <div class="title-bar-controls">
            <button
                aria-label="Close"
                class="close-button window-close-button window-action-close window-button"
            >
                <span class="window-button-icon"></span>
            </button>
        </div>
    </div>
    <div class="window-body">
        <span>Message Text</span>
        <button>OK</button>
    </div>
</div>
`;class ae extends A{static config={id:"desktop-themes",title:"Desktop Themes",description:"Customize your desktop's appearance.",icon:H.desktopthemes,width:550,height:500,resizable:!1,isSingleton:!0};constructor(e){super(e),this.previousThemeId=null,this.customThemeProperties=null,this.originalFilename="",this.boundPopulateThemes=this.populateThemes.bind(this),document.addEventListener("custom-themes-changed",this.boundPopulateThemes)}async _createWindow(){const e=new $Window({id:this.id,title:this.title,outerWidth:600,outerHeight:500,resizable:this.resizable,icons:this.icon,className:"desktop-themes-app"});this.win=e,e.on("close",()=>{document.removeEventListener("custom-themes-changed",this.boundPopulateThemes)});const t=document.createElement("div");t.className="main-container",e.$content.append(t);const o=document.createElement("div");o.className="left-panel",t.appendChild(o);const n=document.createElement("div");n.className="controls",o.appendChild(n);const s=document.createElement("label");s.innerHTML=AccessKeys.toHTML("&Theme:"),n.appendChild(s),this.themeSelector=document.createElement("select"),this.themeSelector.id="theme-selector",s.setAttribute("for",this.themeSelector.id),n.appendChild(this.themeSelector),this.saveButton=document.createElement("button"),this.saveButton.textContent="Save As...",this.saveButton.disabled=!0,n.appendChild(this.saveButton),this.deleteButton=document.createElement("button"),this.deleteButton.textContent="Delete",this.deleteButton.disabled=!0,n.appendChild(this.deleteButton),this.saveButton.addEventListener("click",()=>this.handleSaveTheme()),this.deleteButton.addEventListener("click",()=>this.handleDeleteTheme()),this.themeSelector.addEventListener("change",()=>this.handleThemeSelection()),this.previewContainer=document.createElement("div"),this.previewContainer.className="preview-container",o.appendChild(this.previewContainer),this.previewContainer.innerHTML=ee,this.previewLabel=document.createElement("div"),this.previewLabel.className="preview-label";const i=document.createElement("div");i.className="right-panel",t.appendChild(i);const a=document.createElement("fieldset");a.className="previews-fieldset",a.innerHTML="<legend>Previews</legend>",i.appendChild(a),this.screenSaverButton=document.createElement("button"),this.screenSaverButton.textContent="Screen Saver",this.screenSaverButton.disabled=!0,this.screenSaverButton.addEventListener("click",()=>{const T=C()[this.themeSelector.value];T?.screensaver&&M.showPreview(T.screensaver)}),a.appendChild(this.screenSaverButton);const l=document.createElement("button");l.textContent="Pointers, Sounds, etc...",l.disabled=!0,a.appendChild(l);const r=document.createElement("fieldset");r.className="settings-fieldset",r.innerHTML=`
      <legend>Settings</legend>
      <p>Click OK or Apply to apply the selected settings to Windows 98.</p>
      <div class="field-row">
        <input type="checkbox" id="cb-screensaver" checked disabled />
        <label for="cb-screensaver">${AccessKeys.toHTML("Screen &saver")}</label>
      </div>
      <div class="field-row">
        <input type="checkbox" id="cb-sound" checked disabled />
        <label for="cb-sound">${AccessKeys.toHTML("&Sound events")}</label>
      </div>
      <div class="field-row">
        <input type="checkbox" id="cb-mouse" checked disabled />
        <label for="cb-mouse">${AccessKeys.toHTML("&Mouse pointers")}</label>
      </div>
      <div class="field-row">
        <input type="checkbox" id="cb-wallpaper" checked disabled />
        <label for="cb-wallpaper">${AccessKeys.toHTML("Desktop  &wallpaper")}</label>
      </div>
      <div class="field-row">
        <input type="checkbox" id="cb-icons" checked disabled />
        <label for="cb-icons">${AccessKeys.toHTML("&Icons")}</label>
      </div>
      <div class="field-row">
        <input type="checkbox" id="cb-colors" checked disabled />
        <label for="cb-colors">${AccessKeys.toHTML("&Colors")}</label>
      </div>
      <div class="field-row">
        <input type="checkbox" id="cb-fontnames" checked disabled />
        <label for="cb-fontnames">${AccessKeys.toHTML("&Font names and styles")}</label>
      </div>
      <div class="field-row">
        <input type="checkbox" id="cb-fontsizes" checked disabled />
        <label for="cb-fontsizes">${AccessKeys.toHTML("Font and window si&zes")}</label>
      </div>
    `,i.appendChild(r);const u=C(),d=X(),c=O(),m=W(),p=d[m],w=u[m]||c,b=K(D.WALLPAPER)||c.wallpaper;let h={};if(w.isCustom&&w.colors)for(const[T,x]of Object.entries(w.colors))h[`--${T.replace(/^--/,"")}`]=x;else if(p){const T=await _(m);if(T){const x=q(T);for(const[P,z]of Object.entries(x))h[`--${P}`]=z}}const g=R();this.customThemeProperties={...h,wallpaper:b,iconScheme:g,icons:c.icons,cursors:c.cursors,sounds:c.sounds,desktopConfig:c.desktopConfig},await this.populateThemes();const v=document.createElement("div");v.className="actions",e.$content.append(v),v.appendChild(this.previewLabel);const f=document.createElement("button");f.textContent="OK",f.classList.add("default"),v.appendChild(f);const k=document.createElement("button");k.textContent="Cancel",v.appendChild(k);const E=document.createElement("button");E.textContent="Apply",v.appendChild(E);const L=async()=>{this.themeSelector.value==="current-settings"?await this.applyCustomTheme():await $(this.themeSelector.value)};return E.addEventListener("click",async()=>{await L()}),f.addEventListener("click",async()=>{await L(),e.close()}),k.addEventListener("click",()=>e.close()),e}_createMenuBar(e){return new MenuBar({"&File":[{label:"E&xit",action:()=>e.close()}]})}async applyCustomTheme(){const t=C().default;await B();const o=window.makeThemeCSSFile(this.customThemeProperties),n=document.getElementById("custom-theme-styles");n&&n.remove();const s=document.createElement("style");s.id="custom-theme-styles",s.textContent=o,document.head.appendChild(s);const{wallpaper:i,icons:a,cursors:l,sounds:r,desktopConfig:u,...d}=this.customThemeProperties,c={...t,id:"custom",name:"Current Windows settings",colorSchemeId:null,colors:d,wallpaper:i,icons:a,cursors:l,sounds:r,desktopConfig:u};$("custom",c)}handleCustomThemeLoad(){this.previousThemeId=this.themeSelector.value;const e=document.createElement("input");e.type="file",e.accept=".theme",e.onchange=t=>{const o=t.target.files[0];if(!o){this.themeSelector.value=this.previousThemeId;return}this.loadFile(o)},e.click()}loadFile(e){this.originalFilename=e.name.replace(/\.[^/.]+$/,"");const t=new FileReader;t.onload=async o=>{const n=o.target.result;try{await B();const s=window.getColorsFromThemeFile(n),i=await window.getWallpaperFromThemeFile(n),a=await window.getIconsFromThemeFile(n,""),l=await window.getCursorsFromThemeFile(n,""),r=await window.getSoundsFromThemeFile(n,""),u=await window.getDesktopConfigFromThemeFile(n,"");if(s){const d=window.generateThemePropertiesFromColors(s);this.customThemeProperties={...d,wallpaper:i||u?.wallpaper,icons:a,cursors:l,sounds:r,desktopConfig:u},this.addTemporaryThemeOption(),this.themeSelector.value="current-settings",await this.handleThemeSelection()}else this.themeSelector.value=this.previousThemeId,y({title:"Error",text:"Could not parse the selected file.",buttons:[{label:"OK"}]})}catch(s){this.themeSelector.value=this.previousThemeId,y({title:"Error",text:`An error occurred: ${s.message}`,buttons:[{label:"OK"}]})}},t.readAsText(e)}_promptForThemeName(){const e=new $Window({title:"Save Theme",outerWidth:320,outerHeight:"auto",modal:!0,resizable:!1,toolWindow:!0,icons:this.icon,className:"theme-name-prompt"}),t=document.createElement("div");t.className="dialog-content";const o=document.createElement("p");o.textContent="Please enter a name for this theme:",t.appendChild(o);const n=document.createElement("input");n.type="text",n.value=this.originalFilename||"",t.appendChild(n);const s=document.createElement("div");s.className="dialog-buttons";const i=document.createElement("button");i.textContent="OK",i.classList.add("default");const a=document.createElement("button");a.textContent="Cancel",s.appendChild(i),s.appendChild(a);const l=()=>{i.disabled=n.value.trim()===""};n.addEventListener("input",l),l(),i.onclick=()=>{const r=n.value.trim();this._confirmAndSaveTheme(r),e.close()},a.onclick=()=>{e.close()},e.$content.append(t,s),e.center(),n.focus(),setTimeout(()=>{const r=t.offsetHeight+s.offsetHeight,u=e.outerHeight()-e.$content.innerHeight();e.outerHeight(r+u+10),e.center()},0)}_confirmAndSaveTheme(e){y({title:"Save Theme",text:`Do you want to save this theme as "${e}"?`,buttons:[{label:"OK",action:()=>{this.saveTheme(e)}},{label:"Cancel"}]})}handleSaveTheme(){this._promptForThemeName()}saveTheme(e){const t=C();let o=e,n=2;for(;Object.values(t).some(m=>m.name===o);)o=`${e} (${n++})`;const s=`custom-${o.toLowerCase().replace(/\s+/g,"-")}`,{wallpaper:i,icons:a,cursors:l,sounds:r,desktopConfig:u,...d}=this.customThemeProperties,c={...t.default,id:s,name:o,colorSchemeId:null,colors:d,wallpaper:i,icons:a,cursors:l,sounds:r,desktopConfig:u,isCustom:!0};j(s,c),this.themeSelector.value=s}handleDeleteTheme(){const e=this.themeSelector.value,t=C()[e];t?.isCustom&&y({title:"Delete Scheme",text:`Are you sure you want to delete "${t.name}"?`,buttons:[{label:"Yes",action:()=>{Z(e),this.themeSelector.value="default"}},{label:"No"}]})}async handleThemeSelection(){const e=`theme-selection-${Date.now()}`;U(e,this.win.$content[0]);try{const t=this.themeSelector.value,o=C()[t];if(t==="load-custom"){this.handleCustomThemeLoad();return}if(this.saveButton.disabled=t!=="current-settings",this.deleteButton.disabled=!o?.isCustom,o?.isZenFS&&!o.colors&&await I(o),this.screenSaverButton.disabled=!(o?.screensaver||o?.desktopConfig?.screenSaveActive==="1"),t==="current-settings"){const n={};for(const[s,i]of Object.entries(this.customThemeProperties))n[s.replace(/^--/,"")]=i;await this.previewCustomTheme(n),this.previewLabel.textContent="Preview of 'Current Windows settings'"}else o&&(await this.previewTheme(t),this.previewLabel.textContent=`Preview of '${o.name}'`)}finally{V(e,this.win.$content[0])}}addTemporaryThemeOption(){if(!this.themeSelector.querySelector('option[value="current-settings"]')){const e=document.createElement("option");e.value="current-settings",e.textContent="Current Windows settings",this.themeSelector.prepend(e)}}removeTemporaryThemeOption(){const e=this.themeSelector.querySelector('option[value="current-settings"]');e&&e.remove()}async populateThemes(){const e=this.themeSelector.value,t=this.themeSelector.innerHTML==="";this.themeSelector.innerHTML="",this.addTemporaryThemeOption(),await J();const o=C(),n=Object.entries(o).sort(([,a],[,l])=>a.name.localeCompare(l.name));for(const[a,l]of n){const r=document.createElement("option");r.value=a,r.textContent=l.name,this.themeSelector.appendChild(r)}const s=document.createElement("option");s.disabled=!0,s.textContent="──────────",this.themeSelector.appendChild(s);const i=document.createElement("option");i.value="load-custom",i.textContent="<Load Theme>",this.themeSelector.appendChild(i),t?this.themeSelector.value="current-settings":this.themeSelector.querySelector(`option[value="${e}"]`)?this.themeSelector.value=e:this.themeSelector.value=G(),await this.handleThemeSelection()}updatePreviewIcons(e="default"){const t=N[e]||N.default,o=a=>t.getIcon(a,32),n=this.previewContainer.querySelector('[data-icon="my-computer"] img'),s=this.previewContainer.querySelector('[data-icon="network"] img'),i=this.previewContainer.querySelector('[data-icon="recycle-bin"] img');n&&(n.src=o("myComputer")),s&&(s.src=o("networkNeighborhood")),i&&(i.src=o("recycleBinEmpty"))}async previewTheme(e){const t=C()[e];if(t)if(t.isZenFS){t.colors||await I(t);const o=window.generateThemePropertiesFromColors(t.colors),n={};for(const[i,a]of Object.entries(o))n[i.replace(/^--/,"")]=a;F(n,this.previewContainer);let s="none";if(t.desktopConfig?.wallpaper&&(Y(t.desktopConfig.wallpaper)?s=await S(t.desktopConfig.wallpaper):s=t.desktopConfig.wallpaper),this.previewContainer.style.backgroundImage=s!=="none"?`url('${s}')`:"none",this.previewContainer.style.backgroundColor=n.Background||"#008080",t.icons){const i=this.previewContainer.querySelector('[data-icon="my-computer"] img'),a=this.previewContainer.querySelector('[data-icon="network"] img'),l=this.previewContainer.querySelector('[data-icon="recycle-bin"] img');i&&t.icons.myComputer&&(i.src=await S(t.icons.myComputer)),a&&t.icons.networkNeighborhood&&(a.src=await S(t.icons.networkNeighborhood)),l&&t.icons.recycleBinEmpty&&(l.src=await S(t.icons.recycleBinEmpty))}else this.updatePreviewIcons(t.iconScheme)}else{this.updatePreviewIcons(t.iconScheme);const o=await Q(e,this.previewContainer);this.previewContainer.style.backgroundImage=t.wallpaper?`url('${t.wallpaper}')`:"none",this.previewContainer.style.backgroundColor=o.Background||"#008080"}}previewCustomTheme(e){this.updatePreviewIcons(e.iconScheme),F(e,this.previewContainer),this.previewContainer.style.backgroundImage=e.wallpaper?`url('${e.wallpaper}')`:"none",this.previewContainer.style.backgroundColor=e.Background||"#008080"}_rgbToHex(e){const t=e.match(/rgb\((\d+), (\d+), (\d+)\)/);if(!t)return"#000000";const o=parseInt(t[1],10),n=parseInt(t[2],10),s=parseInt(t[3],10);return"#"+((1<<24)+(o<<16)+(n<<8)+s).toString(16).slice(1)}_hexToRgb(e){const t=parseInt(e.slice(1),16),o=t>>16&255,n=t>>8&255,s=t&255;return`rgb(${o}, ${n}, ${s})`}_showThemeWizard(e,t,o){const n=new $Window({title:"Theme Wizard",outerWidth:350,outerHeight:400,resizable:!1,icons:this.icon,className:"theme-wizard-app"});let s=JSON.parse(JSON.stringify(e)),i=t,a=null;const l=()=>{n.$content.html("");const d=document.createElement("div");d.className="color-list-container",s.forEach(w=>{const b=document.createElement("div");b.className="color-item";const h=document.createElement("input");h.type="color",h.value=this._rgbToHex(w.value),h.addEventListener("change",v=>{w.value=this._hexToRgb(v.target.value)}),b.appendChild(h);const g=document.createElement("label");g.textContent=w.name,b.appendChild(g),d.appendChild(b)}),n.$content.append(d);const c=document.createElement("div");c.className="wizard-buttons";const m=document.createElement("button");m.textContent="Next",m.addEventListener("click",r),c.appendChild(m);const p=document.createElement("button");p.textContent="Cancel",p.addEventListener("click",()=>n.close()),c.appendChild(p),n.$content.append(c)},r=()=>{n.$content.html("");const d=document.createElement("div");d.className="wallpaper-container";const c=document.createElement("input");c.type="file",c.accept="image/*",d.appendChild(c);const m=document.createElement("img");if(m.className="wallpaper-preview",m.style.display="none",d.appendChild(m),i){const h=document.createElement("p");h.textContent=`Current wallpaper: ${i}`,d.insertBefore(h,c.nextSibling)}c.addEventListener("change",h=>{const g=h.target.files[0];if(g){const v=new FileReader;v.onload=f=>{a=f.target.result,m.src=a,m.style.display="block"},v.readAsDataURL(g)}}),n.$content.append(d);const p=document.createElement("div");p.className="wizard-buttons";const w=document.createElement("button");w.textContent="Back",w.addEventListener("click",l),p.appendChild(w);const b=document.createElement("button");b.textContent="Next",b.addEventListener("click",u),p.appendChild(b),n.$content.append(p)},u=()=>{n.$content.html("");const d=document.createElement("p");d.textContent="The theme will be previewed. Click Finish to apply the changes.",n.$content.append(d);const c=document.createElement("div");c.className="wizard-buttons";const m=document.createElement("button");m.textContent="Back",m.addEventListener("click",r),c.appendChild(m);const p=document.createElement("button");p.textContent="Finish",p.addEventListener("click",()=>{o({colors:s,wallpaper:a}),n.close()}),c.appendChild(p),n.$content.append(c)};l()}}export{ae as DesktopThemesApp};
