import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const upstream = path.join(root, "win98-web");
const overlay = path.join(root, "win98-overlay");
const siteWin98 = path.join(root, "site", "win98-web");

function run(cmd, args, cwd = root) {
  console.log("> " + cmd + " " + args.join(" "));
  execFileSync(cmd, args, { cwd, stdio: "inherit", env: process.env });
}

function replaceOnce(file, needle, replacement, label) {
  let text = fs.readFileSync(file, "utf8");
  if (text.includes(replacement)) return;
  if (!text.includes(needle)) throw new Error("Patch target not found: " + label);
  text = text.replace(needle, replacement);
  fs.writeFileSync(file, text);
}

console.log("Preparing complete Windows 98 Web Edition build...");

run("git", ["submodule", "update", "--init", "--recursive"]);

if (!fs.existsSync(path.join(upstream, "package.json"))) {
  throw new Error("win98-web submodule is missing.");
}

// Always reset the submodule before applying our small Miracle442 overlay so
// repeated local/deploy builds are deterministic.
run("git", ["reset", "--hard", "HEAD"], upstream);
run("git", ["clean", "-fd"], upstream);

const appDir = path.join(upstream, "src", "apps", "miracle442");
fs.mkdirSync(appDir, { recursive: true });
fs.copyFileSync(
  path.join(overlay, "miracle442-app.js"),
  path.join(appDir, "miracle442-app.js"),
);
fs.copyFileSync(
  path.join(overlay, "miracle-store-app.js"),
  path.join(appDir, "miracle-store-app.js"),
);
fs.copyFileSync(
  path.join(overlay, "xp-layer-app.js"),
  path.join(appDir, "xp-layer-app.js"),
);

const zenfs = path.join(upstream, "src", "system", "zenfs-init.js");
replaceOnce(
  zenfs,
  '    const defaultShortcuts = [\n',
  '    const defaultShortcuts = [\\n      { name: "League Tracker.lnk.json", appId: "miracle442" },\\n      { name: "App Store.lnk.json", appId: "miracle-store" },\\n      { name: "Windows XP.lnk.json", appId: "xp-layer" },\\n',
  "desktop League Tracker shortcut",
);

const osInit = path.join(upstream, "src", "system", "os-init.js");
replaceOnce(
  osInit,
  '    console.log("azOS initialized");',
  '    console.log("azOS initialized");\n\n    // Miracle442 opens like the primary application, but remains a real OS window.\n    setTimeout(() => launchApp("miracle442"), 150);',
  "auto-launch League Tracker",
);

// Add a direct Start-menu entry while leaving all upstream items intact.
const startMenu = path.join(upstream, "src", "config", "start-menu.js");
replaceOnce(
  startMenu,
  'const startMenuConfig = [\n',
  'const startMenuConfig = [\n  {\n    label: "Windows XP",\n    icon: ICONS["internet-explorer"][32],\n    appId: "xp-layer",\n    action: () => launchApp("xp-layer"),\n  },\n  {\n    label: "App Store",\n    icon: ICONS["internet-explorer"][32],\n    appId: "miracle-store",\n    action: () => launchApp("miracle-store"),\n  },\n  {\n    label: "League Tracker",\n    icon: ICONS["internet-explorer"][32],\n    appId: "miracle442",\n    action: () => launchApp("miracle442"),\n  },\n',
  "Start menu League Tracker entry",
);

if (!fs.existsSync(path.join(upstream, "node_modules"))) {
  run("npm", ["install", "--no-audit", "--no-fund"], upstream);
}

run(process.execPath, ["scripts/generate_registry.js"], upstream);
run(path.join(upstream, "node_modules", ".bin", process.platform === "win32" ? "vite.cmd" : "vite"), ["build"], upstream);

fs.rmSync(siteWin98, { recursive: true, force: true });
fs.mkdirSync(path.dirname(siteWin98), { recursive: true });
fs.cpSync(path.join(upstream, "dist"), siteWin98, { recursive: true });

console.log("Windows 98 Web Edition copied to site/win98-web.");
