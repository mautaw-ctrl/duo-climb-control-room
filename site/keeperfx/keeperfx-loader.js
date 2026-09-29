(() => {
  const REQUIRED = [
    "data/bluepal.dat",
    "data/bluepall.dat",
    "data/dogpal.pal",
    "data/hitpall.dat",
    "data/lightng.pal",
    "data/main.pal",
    "data/mapfadeg.dat",
    "data/redpal.col",
    "data/redpall.dat",
    "data/slab0-0.dat",
    "data/slab0-1.dat",
    "data/vampal.pal",
    "data/whitepal.col",
    "sound/atmos1.sbk",
    "sound/atmos2.sbk",
    "sound/bullfrog.sbk"
  ];

  const $ = (id) => document.getElementById(id);
  const summary = $("summary");
  const list = $("fileList");
  const launch = $("launch");
  const screen = $("screen");

  async function exists(url) {
    try {
      const r = await fetch(url, { method: "HEAD", cache: "no-store" });
      return r.ok;
    } catch {
      return false;
    }
  }

  async function checkAll() {
    launch.disabled = true;
    summary.textContent = "CHECKING RUNTIME + GAME DATA...";
    list.innerHTML = "";

    const runtime = {
      js: await exists("/keeperfx/runtime/keeperfx.js"),
      wasm: await exists("/keeperfx/runtime/keeperfx.wasm")
    };

    const found = [];
    for (const rel of REQUIRED) {
      const ok = await exists("/keeperfx/game-files/" + rel);
      found.push({ rel, ok });
      const row = document.createElement("div");
      row.className = ok ? "ok" : "bad";
      row.textContent = (ok ? "[OK]   " : "[MISS] ") + rel;
      list.appendChild(row);
    }

    const dataReady = found.every((x) => x.ok);
    const runtimeReady = runtime.js && runtime.wasm;

    const rt = document.createElement("div");
    rt.style.marginTop = "8px";
    rt.innerHTML =
      '<div class="' + (runtime.js ? "ok" : "bad") + '">' +
      (runtime.js ? "[OK]   " : "[MISS] ") + "runtime/keeperfx.js</div>" +
      '<div class="' + (runtime.wasm ? "ok" : "bad") + '">' +
      (runtime.wasm ? "[OK]   " : "[MISS] ") + "runtime/keeperfx.wasm</div>";
    list.appendChild(rt);

    if (runtimeReady && dataReady) {
      summary.textContent = "READY // RUNTIME + DATA PACK COMPLETE";
      summary.className = "status ok";
      launch.disabled = false;
    } else if (!runtimeReady && dataReady) {
      summary.textContent = "DATA PACK READY // WAITING FOR WASM RUNTIME";
      summary.className = "status wait";
    } else if (runtimeReady && !dataReady) {
      summary.textContent = "RUNTIME READY // DATA PACK INCOMPLETE";
      summary.className = "status wait";
    } else {
      summary.textContent = "FRAMEWORK READY // ADD DATA PACK + WASM RUNTIME";
      summary.className = "status wait";
    }

    return { runtimeReady, dataReady };
  }

  async function boot() {
    const state = await checkAll();
    if (!state.runtimeReady || !state.dataReady) return;

    launch.disabled = true;
    summary.textContent = "BOOTING KEEPERFX...";
    screen.innerHTML = "<div>LOADING KEEPERFX WASM...</div>";

    const pending = [];
    window.Module = {
      noInitialRun: false,
      locateFile(path) {
        if (path.endsWith(".wasm")) return "/keeperfx/runtime/keeperfx.wasm";
        return "/keeperfx/runtime/" + path;
      },
      preRun: [function() {
        if (typeof addRunDependency !== "function" || typeof removeRunDependency !== "function") return;
        addRunDependency("miracle442-game-data");

        for (const rel of REQUIRED) {
          const job = fetch("/keeperfx/game-files/" + rel, { cache: "no-store" })
            .then((r) => {
              if (!r.ok) throw new Error(rel + " HTTP " + r.status);
              return r.arrayBuffer();
            })
            .then((buf) => {
              const parts = rel.split("/");
              const dir = "/" + parts[0];
              try { FS.mkdir(dir); } catch {}
              FS.writeFile("/" + rel, new Uint8Array(buf));
            });
          pending.push(job);
        }

        Promise.all(pending)
          .then(() => removeRunDependency("miracle442-game-data"))
          .catch((err) => {
            console.error(err);
            summary.textContent = "BOOT ERROR // " + err.message;
            summary.className = "status bad";
            removeRunDependency("miracle442-game-data");
          });
      }],
      canvas: (() => {
        const canvas = document.createElement("canvas");
        canvas.id = "keeperfxCanvas";
        canvas.style.maxWidth = "100%";
        canvas.style.maxHeight = "100%";
        canvas.style.imageRendering = "pixelated";
        screen.innerHTML = "";
        screen.appendChild(canvas);
        return canvas;
      })(),
      print(text) { console.log("[KeeperFX]", text); },
      printErr(text) { console.error("[KeeperFX]", text); },
      onRuntimeInitialized() {
        summary.textContent = "KEEPERFX RUNTIME INITIALIZED";
        summary.className = "status ok";
      }
    };

    const script = document.createElement("script");
    script.src = "/keeperfx/runtime/keeperfx.js";
    script.onerror = () => {
      summary.textContent = "BOOT ERROR // keeperfx.js failed to load";
      summary.className = "status bad";
      launch.disabled = false;
    };
    document.body.appendChild(script);
  }

  $("check").onclick = checkAll;
  launch.onclick = boot;
  checkAll();
})();