/* MIRACLE442_ARCHIVE_FETCH_PATCH
   The upstream DOS Games Downloader relies on public CORS proxies. Those
   services frequently reject Archive.org ZIPs. Route those downloads through
   our own same-origin Cloudflare Worker instead.
*/
(() => {
  const nativeFetch = window.fetch.bind(window);

  function extractArchiveUrl(raw) {
    try {
      const u = new URL(typeof raw === "string" ? raw : raw.url, location.href);
      let candidate = null;

      if (u.hostname === "api.codetabs.com" && u.pathname === "/v1/proxy") {
        candidate = u.searchParams.get("quest");
      } else if (u.hostname === "corsproxy.io") {
        const query = u.search.length > 1 ? u.search.slice(1) : "";
        candidate = decodeURIComponent(query);
      } else if (u.hostname === "api.allorigins.win" && u.pathname === "/raw") {
        candidate = u.searchParams.get("url");
      }

      if (!candidate) return null;
      const source = new URL(candidate);
      if (source.hostname !== "archive.org" || !source.pathname.startsWith("/download/")) {
        return null;
      }
      return source.toString();
    } catch {
      return null;
    }
  }

  window.fetch = function miracle442Fetch(input, init) {
    const archiveUrl = extractArchiveUrl(input);
    if (archiveUrl) {
      const local = "/api/archive-download?url=" + encodeURIComponent(archiveUrl);
      console.log("[Miracle442] replacing unreliable public CORS proxy with same-origin Archive proxy", archiveUrl);
      return nativeFetch(local, init);
    }
    return nativeFetch(input, init);
  };
})();

(() => {
  let trackerWin = null;
  let taskButton = null;

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function getIeIcon() {
    const icons = [...document.querySelectorAll(".explorer-icon")];
    const ie = icons.find((el) =>
      (el.querySelector(".icon-label")?.textContent || el.textContent || "")
        .trim()
        .toLowerCase()
        .includes("internet explorer")
    );
    return {
      node: ie || null,
      src: ie?.querySelector("img")?.src || null,
    };
  }

  function removeTaskButton() {
    taskButton?.remove();
    taskButton = null;
  }

  function makeTaskButton(win, iconSrc) {
    const area = document.querySelector(".taskbar-app-area");
    if (!area) return null;

    const button = document.createElement("button");
    button.className = "toggle selected taskbar-button";
    button.setAttribute("for", "miracle442-fallback");
    button.title = "League Progression Tracker";
    button.innerHTML = `
      <span class="taskbar-button-content">
        ${iconSrc ? `<img src="${iconSrc}" alt="League Tracker">` : ""}
        <span class="taskbar-button-text">League Tracker</span>
      </span>`;

    button.addEventListener("mousedown", (e) => e.preventDefault());
    button.addEventListener("click", () => {
      if (!trackerWin?.element?.isConnected) return openTracker();
      const visible = window.jQuery
        ? window.jQuery(trackerWin.element).is(":visible")
        : trackerWin.element.style.display !== "none";

      if (visible && trackerWin.element.classList.contains("focused")) {
        window.System?.minimizeWindow?.(trackerWin.element);
        button.classList.remove("selected");
      } else if (!visible) {
        window.System?.restoreWindow?.(trackerWin.element);
        trackerWin.focus?.();
        button.classList.add("selected");
      } else {
        trackerWin.focus?.();
        button.classList.add("selected");
      }
    });

    area.appendChild(button);
    return button;
  }

  function openTracker() {
    if (trackerWin?.element?.isConnected) {
      window.System?.restoreWindow?.(trackerWin.element);
      trackerWin.focus?.();
      taskButton?.classList.add("selected");
      return;
    }
    if (typeof window.$Window !== "function") return;

    const { src: iconSrc } = getIeIcon();
    const icons = iconSrc ? { 16: iconSrc, 32: iconSrc } : undefined;

    trackerWin = new window.$Window({
      title: "League Progression Tracker",
      icons,
      outerWidth: Math.min(1180, Math.max(720, innerWidth - 80)),
      outerHeight: Math.min(820, Math.max(520, innerHeight - 70)),
      resizable: true,
      minimizable: true,
      maximizable: true,
    });

    trackerWin.element.id = "miracle442-fallback";
    trackerWin.element.classList.add("app-window");
    trackerWin.$content.css({ padding: 0, overflow: "hidden", background: "#081016" });

    const frame = document.createElement("iframe");
    frame.src = "/tracker/";
    frame.title = "Miracle442 League Progression Tracker";
    frame.style.cssText = "display:block;width:100%;height:100%;border:0;background:#081016;";
    trackerWin.$content.append(frame);

    taskButton = makeTaskButton(trackerWin, iconSrc);
    if (taskButton && typeof trackerWin.setMinimizeTarget === "function") {
      trackerWin.setMinimizeTarget(taskButton);
    }

    trackerWin.onFocus?.(() => taskButton?.classList.add("selected"));
    trackerWin.onBlur?.(() => taskButton?.classList.remove("selected"));
    trackerWin.onClosed?.(() => {
      removeTaskButton();
      trackerWin = null;
    });

    trackerWin.center?.();
    trackerWin.focus?.();
    trackerWin.maximize?.();
  }

  function addDesktopShortcut() {
    const desktop = document.querySelector(".desktop");
    if (!desktop || desktop.querySelector('[data-miracle442-shortcut="1"]')) return;

    const { node: ie, src: iconSrc } = getIeIcon();
    let icon;

    if (ie) {
      icon = ie.cloneNode(true);
      icon.removeAttribute("data-path");
      icon.removeAttribute("data-name");
      icon.removeAttribute("data-type");
      icon.classList.remove("selected");
      const label = icon.querySelector(".icon-label");
      if (label) label.textContent = "League Tracker";
    } else {
      icon = document.createElement("div");
      icon.className = "explorer-icon";
      icon.innerHTML = `
        <div class="icon-wrapper">${iconSrc ? `<img src="${iconSrc}" alt="">` : ""}</div>
        <div class="icon-label">League Tracker</div>`;
    }

    icon.dataset.miracle442Shortcut = "1";
    icon.title = "League Progression Tracker";
    icon.addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelectorAll(".desktop .explorer-icon.selected").forEach((x) => x.classList.remove("selected"));
      icon.classList.add("selected");
    });
    icon.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      openTracker();
    });

    desktop.appendChild(icon);
  }

  function addQuickLaunch() {
    const area = document.querySelector(".taskbar-icon-area");
    if (!area || area.querySelector("[data-miracle442-quicklaunch]")) return;
    const { src } = getIeIcon();
    const button = document.createElement("button");
    button.className = "taskbar-icon lightweight";
    button.dataset.miracle442Quicklaunch = "1";
    button.title = "League Tracker";
    button.setAttribute("aria-label", "Open League Tracker");
    if (src) button.innerHTML = `<img src="${src}" alt="League Tracker">`;
    else button.textContent = "e";
    button.addEventListener("click", openTracker);
    area.appendChild(button);
  }

  async function boot() {
    for (let i = 0; i < 80; i++) {
      if (document.querySelector(".desktop") && document.querySelector(".taskbar-app-area") && typeof window.$Window === "function") {
        break;
      }
      await wait(100);
    }
    addDesktopShortcut();
    addQuickLaunch();
    await wait(250);
    openTracker();
  }

  document.addEventListener("desktop-ready-to-launch-apps", () => setTimeout(boot, 300), { once: true });
  if (document.querySelector(".desktop")) boot();
})();


/* MIRACLE442_EXPERIENCE_LAYER
   Windows93-inspired interaction layer on top of the authentic Win98 shell.
*/
(() => {
  if (window.__miracle442ExperienceLayer) return;
  window.__miracle442ExperienceLayer = true;

  const running = new Map();

  function injectStyle() {
    if (document.getElementById("m442-experience-style")) return;
    const style = document.createElement("style");
    style.id = "m442-experience-style";
    style.textContent = `
      @keyframes m442WindowIn {
        0% { opacity:0; transform:scale(.92) translateY(7px); filter:brightness(1.35); }
        65% { opacity:1; transform:scale(1.015) translateY(-1px); }
        100% { opacity:1; transform:scale(1) translateY(0); filter:none; }
      }
      @keyframes m442IconPop {
        0%{transform:scale(1)}
        35%{transform:scale(.86)}
        70%{transform:scale(1.15)}
        100%{transform:scale(1)}
      }
      @keyframes m442Spark {
        from{opacity:1;transform:translate(-50%,-50%) scale(1)}
        to{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.1)}
      }
      .m442-window-spawn{animation:m442WindowIn 180ms cubic-bezier(.18,.88,.32,1.2);transform-origin:center}
      .m442-icon-pop .icon-wrapper{animation:m442IconPop 190ms ease-out}
      .m442-spark{
        position:fixed;width:4px;height:4px;background:#fff;box-shadow:1px 1px #000;
        z-index:2147483000;pointer-events:none;animation:m442Spark 330ms ease-out forwards
      }
    `;
    document.head.append(style);
  }

  function sparkle(x,y) {
    for (let i=0;i<8;i++) {
      const p=document.createElement("i");
      p.className="m442-spark";
      const a=(Math.PI*2*i)/8, d=18+Math.random()*22;
      p.style.left=x+"px";
      p.style.top=y+"px";
      p.style.setProperty("--dx",(Math.cos(a)*d)+"px");
      p.style.setProperty("--dy",(Math.sin(a)*d)+"px");
      document.body.append(p);
      setTimeout(()=>p.remove(),380);
    }
  }

  function desktopIconByText(...terms) {
    return [...document.querySelectorAll(".desktop .explorer-icon")].find(el=>{
      const text=(el.querySelector(".icon-label")?.textContent||el.textContent||"").trim().toLowerCase();
      return terms.some(term=>text.includes(term.toLowerCase()));
    }) || null;
  }

  function bestIconSource(terms) {
    return desktopIconByText(...terms)
      || desktopIconByText("internet explorer")
      || document.querySelector(".desktop .explorer-icon");
  }

  function makeTaskButton(id,title,iconSrc,win) {
    const area=document.querySelector(".taskbar-app-area");
    if(!area) return null;

    const button=document.createElement("button");
    button.className="toggle selected taskbar-button";
    button.setAttribute("for",id);
    button.title=title;
    button.innerHTML=`<span class="taskbar-button-content">${iconSrc?`<img src="${iconSrc}" alt="">`:""}<span class="taskbar-button-text">${title}</span></span>`;

    button.addEventListener("mousedown",e=>e.preventDefault());
    button.addEventListener("click",()=>{
      const visible=window.jQuery
        ? window.jQuery(win.element).is(":visible")
        : win.element.style.display!=="none";

      if(visible && win.element.classList.contains("focused")){
        window.System?.minimizeWindow?.(win.element);
        button.classList.remove("selected");
      } else if(!visible) {
        window.System?.restoreWindow?.(win.element);
        win.focus?.();
        button.classList.add("selected");
      } else {
        win.focus?.();
        button.classList.add("selected");
      }
    });

    area.append(button);
    return button;
  }

  function openFrameApp({id,title,url,width=900,height=650,iconTerms=["internet explorer"]}) {
    window.__m442Sound?.launch?.();
    const existing=running.get(id);
    if(existing?.win?.element?.isConnected){
      window.System?.restoreWindow?.(existing.win.element);
      existing.win.focus?.();
      existing.button?.classList.add("selected");
      return;
    }
    if(typeof window.$Window!=="function") return;

    const source=bestIconSource(iconTerms);
    const src=source?.querySelector("img")?.src || null;
    const icons=src ? {16:src,32:src} : undefined;

    const win=new window.$Window({
      title,
      icons,
      outerWidth:Math.min(width,Math.max(520,innerWidth-70)),
      outerHeight:Math.min(height,Math.max(420,innerHeight-65)),
      resizable:true,
      minimizable:true,
      maximizable:true
    });

    win.element.id="m442-"+id;
    win.element.classList.add("app-window","m442-window-spawn");
    win.$content.css({padding:0,overflow:"hidden",background:"#c0c0c0"});

    const frame=document.createElement("iframe");
    frame.src=url;
    frame.title=title;
    frame.style.cssText="display:block;width:100%;height:100%;border:0;background:#c0c0c0";
    frame.setAttribute("allow","autoplay; fullscreen; gamepad; microphone");
    win.$content.append(frame);

    const button=makeTaskButton(win.element.id,title,src,win);
    if(button && typeof win.setMinimizeTarget==="function") win.setMinimizeTarget(button);

    win.onFocus?.(()=>button?.classList.add("selected"));
    win.onBlur?.(()=>button?.classList.remove("selected"));
    win.onClosed?.(()=>{
      button?.remove();
      running.delete(id);
    });

    win.center?.();
    win.focus?.();
    running.set(id,{win,button});
  }

  function addShortcut({id,label,url,iconTerms,width,height}) {
    const desktop=document.querySelector(".desktop");
    if(!desktop || desktop.querySelector(`[data-m442-app="${id}"]`)) return;

    const source=bestIconSource(iconTerms);
    let icon;
    if(source){
      icon=source.cloneNode(true);
      icon.removeAttribute("data-path");
      icon.removeAttribute("data-name");
      icon.removeAttribute("data-type");
      icon.classList.remove("selected");
      const lab=icon.querySelector(".icon-label");
      if(lab) lab.textContent=label;
    } else {
      icon=document.createElement("div");
      icon.className="explorer-icon";
      icon.innerHTML='<div class="icon-wrapper"></div><div class="icon-label"></div>';
      icon.querySelector(".icon-label").textContent=label;
    }

    icon.dataset.m442App=id;
    icon.title=label;

    icon.addEventListener("click",e=>{
      e.stopPropagation();
      window.__m442Sound?.select?.();
      document.querySelectorAll(".desktop .explorer-icon.selected").forEach(x=>x.classList.remove("selected"));
      icon.classList.add("selected");
    });

    icon.addEventListener("dblclick",e=>{
      e.stopPropagation();
      icon.classList.remove("m442-icon-pop");
      void icon.offsetWidth;
      icon.classList.add("m442-icon-pop");
      sparkle(e.clientX,e.clientY);
      openFrameApp({id,title:label,url,width,height,iconTerms});
    });

    desktop.append(icon);
  }

  function installApps() {
    injectStyle();

    const apps=[
      {
        id:"emulator-center",
        label:"Emulator Center",
        url:"/emulators/",
        width:1080,height:760,
        iconTerms:["games","doom","pinball"]
      },
      {
        id:"psx-emulator",
        label:"PlayStation Emulator",
        url:"/emulators/?core=psx",
        width:1080,height:760,
        iconTerms:["games","doom","pinball"]
      },
      {
        id:"wasmpsx",
        label:"WASMpsx Instant",
        url:"/wasmpsx/",
        width:980,height:720,
        iconTerms:["games","doom","pinball"]
      },
      {
        id:"gameboyjs",
        label:"Gameboy.js",
        url:"/gameboy/",
        width:900,height:650,
        iconTerms:["games","doom","pinball"]
      },
      {
        id:"playjs",
        label:"Play!.js PS2",
        url:"/playjs/",
        width:1120,height:790,
        iconTerms:["games","doom","pinball"]
      },
      {
        id:"space-huggers",
        label:"Space Huggers",
        url:"/space-huggers/",
        width:1040,height:760,
        iconTerms:["games","doom","pinball"]
      },
      {
        id:"snakeia",
        label:"SnakeIA",
        url:"/snakeia/",
        width:1120,height:790,
        iconTerms:["games","doom","pinball"]
      },
      {
        id:"uno",
        label:"UNO Game",
        url:"/uno/",
        width:1040,height:760,
        iconTerms:["games","solitaire","cards"]
      },
      {
        id:"soundbox",
        label:"SoundBox Tracker",
        url:"/soundbox/",
        width:1180,height:800,
        iconTerms:["media","winamp","songs"]
      },
      {
        id:"tinymusic",
        label:"TinyMusic",
        url:"/tinymusic/",
        width:900,height:650,
        iconTerms:["media","winamp","songs"]
      },
      {
        id:"sonantx",
        label:"Sonant-X Lab",
        url:"/sonantx/",
        width:900,height:650,
        iconTerms:["media","winamp","songs"]
      },
      {
        id:"toybox",
        label:"93 Toybox",
        url:"/toybox/",
        width:900,height:650,
        iconTerms:["programs","paint","notepad"]
      },
      {
        id:"bytebeat",
        label:"Byte Beat",
        url:"/toybox/?app=byte",
        width:820,height:560,
        iconTerms:["media","winamp","songs"]
      },
      {
        id:"life",
        label:"Game of Life",
        url:"/toybox/?app=life",
        width:820,height:620,
        iconTerms:["games","paint"]
      },
      {
        id:"maze",
        label:"Maze",
        url:"/toybox/?app=maze",
        width:820,height:620,
        iconTerms:["games","paint"]
      },
      {
        id:"speech",
        label:"Speech",
        url:"/toybox/?app=speech",
        width:700,height:430,
        iconTerms:["agent","notepad"]
      },
      {
        id:"video",
        label:"Video Player",
        url:"/toybox/?app=video",
        width:850,height:620,
        iconTerms:["media","winamp"]
      },
      {
        id:"ansi",
        label:"ANSI Love",
        url:"/toybox/?app=ansi",
        width:820,height:580,
        iconTerms:["notepad","command"]
      }
    ];

    apps.forEach(addShortcut);
  }

  let attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    if(document.querySelector(".desktop") && typeof window.$Window==="function"){
      installApps();
      if(attempts>12) clearInterval(timer);
    }
    if(attempts>80) clearInterval(timer);
  },250);

  document.addEventListener("desktop-refresh",()=>setTimeout(installApps,80));
})();


/* MIRACLE442_HEADAMP_DESKTOP_LAYER
   Keep Webamp Modern isolated in an iframe so its prototype CSS cannot leak
   into the real Win98 shell. The iframe itself behaves like a desktop app.
*/
(() => {
  if (window.__m442HeadampDesktopInstalled) return;
  window.__m442HeadampDesktopInstalled = true;

  let frame = null;
  let taskButton = null;
  let visible = true;
  let currentZ = 4;

  function findDesktopIcon(...terms) {
    return [...document.querySelectorAll(".desktop .explorer-icon")].find((el) => {
      const text=(el.querySelector(".icon-label")?.textContent||el.textContent||"").trim().toLowerCase();
      return terms.some(t=>text.includes(t.toLowerCase()));
    }) || null;
  }

  function bringFront() {
    if (!frame) return;
    try {
      currentZ = window.System?.incrementZIndex?.() || Math.max(currentZ + 1, 6);
    } catch {
      currentZ = Math.max(currentZ + 1, 6);
    }
    frame.style.zIndex = String(Math.min(currentZ, 950));
    taskButton?.classList.add("selected");
  }

  function show() {
    if (!frame) createFrame();
    frame.style.display = "block";
    visible = true;
    bringFront();
  }

  function hide() {
    if (!frame) return;
    frame.style.display = "none";
    visible = false;
    taskButton?.classList.remove("selected");
  }

  function toggle() {
    visible ? hide() : show();
  }

  function createFrame() {
    if (frame?.isConnected) return frame;

    frame=document.createElement("iframe");
    frame.id="m442-headamp-desktop";
    frame.src="/headamp/";
    frame.title="HeadAMP";
    frame.setAttribute("allow","autoplay; fullscreen");
    frame.style.position="absolute";
    frame.style.left=Math.max(55,Math.round((innerWidth-Math.min(1060,innerWidth-30))/2))+"px";
    frame.style.top="28px";
    frame.style.width=Math.min(1060,Math.max(760,innerWidth-30))+"px";
    frame.style.height=Math.min(470,Math.max(410,innerHeight-55))+"px";
    frame.style.border="0";
    frame.style.background="transparent";
    frame.style.zIndex=String(currentZ);
    frame.style.pointerEvents="auto";
    frame.style.colorScheme="normal";

    const screen=document.getElementById("screen")||document.body;
    screen.append(frame);

    frame.addEventListener("load",()=> {
      try {
        frame.contentWindow?.focus();
      } catch {}
    });

    return frame;
  }

  function makeTaskbarButton(iconSrc) {
    if (taskButton?.isConnected) return;
    const area=document.querySelector(".taskbar-app-area");
    if(!area) return;

    taskButton=document.createElement("button");
    taskButton.className="toggle taskbar-button";
    taskButton.title="HeadAMP";
    taskButton.innerHTML=`<span class="taskbar-button-content">${iconSrc?`<img src="${iconSrc}" alt="">`:""}<span class="taskbar-button-text">HeadAMP</span></span>`;
    taskButton.addEventListener("mousedown",e=>e.preventDefault());
    taskButton.addEventListener("click",()=>{
      if (!visible) show();
      else hide();
    });
    area.append(taskButton);
  }

  function addDesktopShortcut() {
    const desktop=document.querySelector(".desktop");
    if(!desktop || desktop.querySelector('[data-m442-headamp="1"]')) return;

    const source=findDesktopIcon("winamp","songs","media");
    let icon;

    if(source){
      icon=source.cloneNode(true);
      icon.removeAttribute("data-path");
      icon.removeAttribute("data-name");
      icon.removeAttribute("data-type");
      icon.classList.remove("selected");
      const label=icon.querySelector(".icon-label");
      if(label) label.textContent="HeadAMP";
    } else {
      icon=document.createElement("div");
      icon.className="explorer-icon";
      icon.innerHTML='<div class="icon-wrapper"></div><div class="icon-label">HeadAMP</div>';
    }

    icon.dataset.m442Headamp="1";
    icon.title="HeadAMP // tracker audio + visualizer + playlists";

    icon.addEventListener("click",e=>{
      e.stopPropagation();
      document.querySelectorAll(".desktop .explorer-icon.selected").forEach(x=>x.classList.remove("selected"));
      icon.classList.add("selected");
    });

    icon.addEventListener("dblclick",e=>{
      e.stopPropagation();
      show();
    });

    desktop.append(icon);

    const src=icon.querySelector("img")?.src || source?.querySelector("img")?.src || "";
    makeTaskbarButton(src);
  }

  function addQuickLaunch() {
    const area=document.querySelector(".taskbar-icon-area");
    if(!area || area.querySelector("[data-m442-headamp-quick]")) return;
    const source=findDesktopIcon("winamp","songs","media");
    const src=source?.querySelector("img")?.src || "";

    const button=document.createElement("button");
    button.className="taskbar-icon lightweight";
    button.dataset.m442HeadampQuick="1";
    button.title="HeadAMP";
    button.setAttribute("aria-label","Open HeadAMP");
    if(src) button.innerHTML=`<img src="${src}" alt="HeadAMP">`;
    else button.textContent="♪";
    button.addEventListener("click",show);
    area.append(button);
  }

  function install() {
    if(!document.querySelector(".desktop")) return;
    createFrame();
    addDesktopShortcut();
    addQuickLaunch();
  }

  window.__headampOS={show,hide,toggle,bringFront,get frame(){return frame;}};

  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    if(document.querySelector(".desktop") && document.querySelector(".taskbar-app-area")){
      install();
      if(tries>15) clearInterval(timer);
    }
    if(tries>100) clearInterval(timer);
  },200);

  document.addEventListener("desktop-refresh",()=>setTimeout(install,80));
})();
