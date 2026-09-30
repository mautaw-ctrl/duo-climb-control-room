import { Application } from "../../system/application.js";
import { ICONS } from "../../config/icons.js";

export class XpLayerApp extends Application {
  static config = {
    id: "xp-layer",
    title: "Windows XP",
    description: "Open the separate Windows XP-style desktop layer.",
    icon: ICONS["internet-explorer"],
    width: 1024,
    height: 760,
    resizable: true,
    isSingleton: true,
    hasTaskbarButton: true,
    tips: [
      "This is a separate XP-style desktop layer.",
      "Use the Back to Windows 98 button to return to Miracle442 OS."
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

    win.$content.css({ padding: "0", overflow: "hidden", background: "#000" });

    const frame = document.createElement("iframe");
    frame.src = "/xp/";
    frame.title = "Windows XP layer";
    frame.allow = "fullscreen; autoplay; clipboard-read; clipboard-write";
    frame.style.cssText = "display:block;width:100%;height:100%;border:0;background:#000;";
    win.$content.append(frame);
    return win;
  }
}
