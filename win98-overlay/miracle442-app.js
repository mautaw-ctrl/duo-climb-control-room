import { Application } from "../../system/application.js";
import { ICONS } from "../../config/icons.js";

export class Miracle442App extends Application {
  static config = {
    id: "miracle442",
    title: "League Progression Tracker",
    description: "Miracle442 duo climb control room for Davy442#EUW and SDSarah#EUW.",
    icon: ICONS["internet-explorer"],
    width: 1180,
    height: 820,
    resizable: true,
    isSingleton: true,
    hasTaskbarButton: true,
    tips: [
      "Minimize the tracker to return to the Windows 98 desktop.",
      "Use the taskbar button to restore the tracker at any time."
    ],
  };

  _createWindow() {
    const win = new window.$Window({
      title: this.title,
      icons: this.icon,
      outerWidth: this.width,
      outerHeight: this.height,
      resizable: true,
      minimizable: true,
      maximizable: true,
    });

    win.$content.css({
      padding: "0",
      overflow: "hidden",
      background: "#081016",
    });

    const frame = document.createElement("iframe");
    frame.src = "/tracker/";
    frame.title = "Miracle442 League Progression Tracker";
    frame.style.cssText = "display:block;width:100%;height:100%;border:0;background:#081016;";
    frame.setAttribute("allow", "autoplay");
    win.$content.append(frame);

    return win;
  }

  async _onLaunch() {
    // The tracker should feel like the site when first opened, while still
    // being a real Windows 98 application that can minimize to the desktop.
    requestAnimationFrame(() => {
      if (this.win && typeof this.win.maximize === "function") {
        this.win.maximize();
      }
    });
  }
}
