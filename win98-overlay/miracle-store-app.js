import { Application } from "../../system/application.js";
import { ICONS } from "../../config/icons.js";

export class MiracleStoreApp extends Application {
  static config = {
    id: "miracle-store",
    title: "Miracle App Store",
    description: "Retro software catalog for Miracle442 OS.",
    icon: ICONS["internet-explorer"],
    width: 900,
    height: 680,
    resizable: true,
    isSingleton: true,
    hasTaskbarButton: true,
    tips: [
      "Browse the installed and available apps from one place.",
      "Use Launch to open web-ready apps directly."
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

    win.$content.css({ padding: "0", overflow: "hidden", background: "#c0c0c0" });

    const frame = document.createElement("iframe");
    frame.src = "/store/";
    frame.title = "Miracle App Store";
    frame.style.cssText = "display:block;width:100%;height:100%;border:0;background:#c0c0c0;";
    win.$content.append(frame);
    return win;
  }
}
