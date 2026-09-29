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
