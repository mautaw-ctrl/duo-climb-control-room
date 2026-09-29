import { ChiptuneJsPlayer } from "/vendor/chiptune3/chiptune3.js";

const statusEl = document.getElementById("headampModernStatus");
const host = document.getElementById("headampModernHost");
const BASE = "/vendor/webamp-modern";
const PLAYLIST_REGISTRY = "/music/playlists.json";

const setStatus = (text, cls = "") => {
  if (!statusEl) return;
  statusEl.textContent = text;
  statusEl.className = cls;
};

const cleanTitle = (name) =>
  name
    .replace(/_Music\.(it|mod|xm|s3m)$/i, "")
    .replace(/_/g, " ");

function isTracker(url) {
  return /\.(it|mod|xm|s3m)(?:$|[?#])/i.test(url || "");
}

try {
  setStatus("HEADAMP MODERN // LOADING ENGINE...");

  await import(`${BASE}/skin/SkinEngine_WAL.js`);
  await import(`${BASE}/WebampModern.js`);
  const audioModule = await import(`${BASE}/skin/AudioPlayer.js`);
  const AUDIO = audioModule.default;

  let webamp = null;
  let tracker = null;
  let trackerReady = Promise.resolve();
  let trackerBuffer = null;
  let trackerUrl = "";
  let trackerMode = false;
  let trackerState = "stopped";
  let trackerLoad = Promise.resolve(null);
  let loadGeneration = 0;

  const native = {
    setAudioSource: AUDIO.setAudioSource.bind(AUDIO),
    play: AUDIO.play.bind(AUDIO),
    pause: AUDIO.pause.bind(AUDIO),
    stop: AUDIO.stop.bind(AUDIO),
    getState: AUDIO.getState.bind(AUDIO),
    getCurrentTime: AUDIO.getCurrentTime.bind(AUDIO),
    getCurrentTimePercent: AUDIO.getCurrentTimePercent.bind(AUDIO),
    getLength: AUDIO.getLength.bind(AUDIO),
    seekTo: AUDIO.seekTo.bind(AUDIO),
    seekToPercent: AUDIO.seekToPercent.bind(AUDIO),
    setVolume: AUDIO.setVolume.bind(AUDIO),
    setBalance: AUDIO.setBalance.bind(AUDIO),
    getAnalyser: AUDIO.getAnalyser.bind(AUDIO)
  };

  function ensureTracker() {
    if (tracker) return tracker;

    tracker = new ChiptuneJsPlayer({
      repeatCount: 0,
      stereoSeparation: 100
    });

    trackerReady = new Promise((resolve) => {
      tracker.onInitialized(() => {
        try {
          tracker.gain.disconnect();

          const freqs = [60,170,310,600,1000,3000,6000,12000,14000,16000];
          const preamp = tracker.context.createGain();
          const filters = freqs.map((freq, i) => {
            const node = tracker.context.createBiquadFilter();
            node.frequency.value = freq;
            node.Q.value = 1;
            node.gain.value = 0;
            node.type = i === 0 ? "lowshelf" : (i === freqs.length - 1 ? "highshelf" : "peaking");
            return node;
          });
          const analyser = tracker.context.createAnalyser();
          analyser.fftSize = 1024;
          analyser.smoothingTimeConstant = 0.15;

          tracker.gain.connect(preamp);
          let node = preamp;
          for (const filter of filters) {
            node.connect(filter);
            node = filter;
          }
          node.connect(analyser);
          analyser.connect(tracker.context.destination);

          window.__headampEq = {
            setState(eq) {
              if (!eq) return;
              const enabled = eq.on !== false;
              const sliders = eq.sliders || {};
              const toDb = (value) => ((Number(value ?? 50) / 100) * 24) - 12;
              const preDb = enabled ? toDb(sliders.preamp) : 0;
              preamp.gain.setTargetAtTime(Math.pow(10, preDb / 20), tracker.context.currentTime, 0.01);
              freqs.forEach((freq, i) => {
                const db = enabled ? toDb(sliders[String(freq)] ?? sliders[freq]) : 0;
                filters[i].gain.setTargetAtTime(db, tracker.context.currentTime, 0.01);
              });
            }
          };

          window.__headampAnalyser = analyser;
          window.dispatchEvent(new CustomEvent("headamp-eq-ready"));
          window.dispatchEvent(new CustomEvent("headamp-analyser-ready"));
        } catch (e) {
          console.error("Could not build HeadAMP audio graph", e);
        }
        resolve();
      });
    });

    tracker.onEnded(() => {
      trackerState = "stopped";
      AUDIO._isStop = true;
      AUDIO.trigger("stop");
      AUDIO.trigger("statchanged");
      AUDIO.trigger("timeupdate");
      if (webamp?._uiRoot) {
        webamp._uiRoot.next();
      }
    });

    tracker.onError((err) => {
      console.error("HeadAMP tracker error", err);
      setStatus("HEADAMP MODERN // TRACKER ERROR", "error");
    });

    tracker.onProgress(() => {
      AUDIO.trigger("timeupdate");
    });

    return tracker;
  }

  AUDIO.setAudioSource = function (url) {
    trackerMode = isTracker(url);
    trackerUrl = url;

    if (!trackerMode) {
      trackerBuffer = null;
      trackerState = "stopped";
      return native.setAudioSource(url);
    }

    const generation = ++loadGeneration;
    const p = ensureTracker();
    try { p.stop(); } catch {}
    trackerBuffer = null;
    trackerState = "stopped";
    this._isStop = true;
    this.trigger("timeupdate");
    this.trigger("statchanged");

    trackerLoad = fetch(url, { cache: "force-cache" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} loading ${url}`);
        return r.arrayBuffer();
      })
      .then((buffer) => {
        if (generation !== loadGeneration) return null;
        trackerBuffer = buffer;
        return buffer;
      })
      .catch((e) => {
        console.error("HeadAMP tracker load failed", e);
        setStatus("HEADAMP MODERN // TRACK LOAD FAILED", "error");
        return null;
      });
  };

  AUDIO.play = function () {
    if (!trackerMode) return native.play();

    const p = ensureTracker();
    this._isStop = false;
    this.trigger("play");
    this.trigger("statchanged");

    if (trackerState === "paused" && trackerBuffer) {
      try { p.unpause(); } catch {}
      trackerState = "playing";
      return;
    }

    trackerState = "playing";
    Promise.all([trackerReady, trackerLoad]).then(async ([, buffer]) => {
      if (!buffer || !trackerMode || trackerUrl === "") return;
      try {
        if (p.context?.state === "suspended") await p.context.resume();
        p.play(buffer);
        setStatus("HEADAMP MODERN // TRACKER AUDIO", "ok");
      } catch (e) {
        console.error(e);
        setStatus("HEADAMP MODERN // PLAYBACK ERROR", "error");
      }
    });
  };

  AUDIO.pause = function () {
    if (!trackerMode) return native.pause();
    if (trackerState === "playing" && tracker) {
      try { tracker.pause(); } catch {}
      trackerState = "paused";
      this._isStop = false;
      this.trigger("pause");
      this.trigger("statchanged");
    }
  };

  AUDIO.stop = function () {
    if (!trackerMode) return native.stop();
    if (tracker) {
      try { tracker.stop(); } catch {}
    }
    trackerState = "stopped";
    this._isStop = true;
    this.trigger("stop");
    this.trigger("statchanged");
    this.trigger("timeupdate");
  };

  AUDIO.getState = function () {
    if (!trackerMode) return native.getState();
    return trackerState;
  };

  AUDIO.getCurrentTime = function () {
    if (!trackerMode) return native.getCurrentTime();
    if (tracker && typeof tracker.getCurrentTime === "function") {
      try { return Number(tracker.getCurrentTime()) || 0; } catch {}
    }
    return Number(tracker?.currentTime) || 0;
  };

  AUDIO.getLength = function () {
    if (!trackerMode) return native.getLength();
    return Number(tracker?.duration || tracker?.meta?.dur) || 0;
  };

  AUDIO.getCurrentTimePercent = function () {
    if (!trackerMode) return native.getCurrentTimePercent();
    const len = this.getLength();
    return len > 0 ? this.getCurrentTime() / len : 0;
  };

  AUDIO.seekTo = function (secs) {
    if (!trackerMode) return native.seekTo(secs);
    if (tracker && typeof tracker.setPos === "function") {
      try { tracker.setPos(Number(secs) || 0); } catch {}
    }
  };

  AUDIO.seekToPercent = function (percent) {
    if (!trackerMode) return native.seekToPercent(percent);
    const len = this.getLength();
    if (len > 0) this.seekTo(len * percent);
  };

  AUDIO.setVolume = function (volume) {
    native.setVolume(volume);
    if (tracker && typeof tracker.setVol === "function") {
      try { tracker.setVol(volume); } catch {}
    }
  };

  AUDIO.setBalance = function (balance) {
    native.setBalance(balance);
    if (tracker && typeof tracker.setStereoSeparation === "function") {
      try { tracker.setStereoSeparation(100); } catch {}
    }
  };

  // HeadAMP's WAL already contains a native <vis> inside the black face.
  // Route tracker audio through Webamp Modern's own spectrum/oscilloscope.
  AUDIO.getAnalyser = function () {
    if (trackerMode && window.__headampAnalyser) return window.__headampAnalyser;
    return native.getAnalyser();
  };

  if (typeof window.WebampModern !== "function") {
    throw new Error("Webamp Modern constructor unavailable");
  }

  webamp = new window.WebampModern(host, {
    skin: "/skins/HeadAMP.wal",
    tracks: []
  });

  let playlists = [];
  let currentPlaylist = null;

  async function readPlaylist(def) {
    const base = def.base.endsWith("/") ? def.base : def.base + "/";
    const response = await fetch(def.manifest || (base + "manifest.json"), { cache: "no-store" });
    if (!response.ok) throw new Error("Playlist manifest failed: " + (def.label || def.id));
    const manifest = await response.json();
    const names = Array.isArray(manifest) ? manifest : manifest.tracks;
    if (!Array.isArray(names) || names.length === 0) throw new Error("Playlist has no tracks");
    return { def, base, manifest, names };
  }

  async function loadPlaylist(id, autoplay = false) {
    const def = playlists.find((p) => p.id === id) || playlists[0];
    if (!def) throw new Error("No playlists configured");

    const loaded = await readPlaylist(def);
    if (currentPlaylist) {
      try { AUDIO.stop(); } catch {}
    }
    webamp._uiRoot.playlist.clear();

    for (const name of loaded.names) {
      webamp._uiRoot.playlist.addTrack({
        filename: loaded.base + encodeURIComponent(name),
        metadata: {
          artist: def.artist || loaded.manifest.artist || def.label || "HeadAMP",
          title: cleanTitle(name)
        },
        duration: 0
      });
    }

    currentPlaylist = def.id;
    window.dispatchEvent(new CustomEvent("headamp-playlist-changed", {
      detail: {
        id: def.id,
        label: def.label,
        count: loaded.names.length,
        tracks: loaded.names.map(cleanTitle)
      }
    }));

    if (autoplay && loaded.names.length) {
      try {
        webamp._uiRoot.playlist.playtrack(0);
        AUDIO.play();
      } catch {}
    }
    return loaded.names.length;
  }

  const registryResponse = await fetch(PLAYLIST_REGISTRY, { cache: "no-store" });
  if (!registryResponse.ok) throw new Error("HeadAMP playlist registry missing");
  const registry = await registryResponse.json();
  playlists = Array.isArray(registry) ? registry : registry.playlists;
  if (!Array.isArray(playlists) || playlists.length === 0) throw new Error("No HeadAMP playlists configured");

  const initialCount = await loadPlaylist(playlists[0].id, false);

  function getSkinObject(id) {
    try {
      const main = webamp?._uiRoot?.getContainers?.().find((c) => c.getId?.() === "main");
      const layout = main?.getlayout?.("mode-main");
      return layout?.findobject?.(id) || null;
    } catch {
      return null;
    }
  }

  function configureHeadampSkin() {
    const avs = getSkinObject("InlineAVS");
    const vis = getSkinObject("vis");
    if (avs?.hide) avs.hide();
    if (vis) {
      vis.show?.();
      vis.setmode?.("1");

      const cycleVisibleModes = () => {
        const mode = Number(vis.getmode?.() || 1);
        vis.setmode?.(mode === 1 ? "2" : "1");
        vis.show?.();
        avs?.hide?.();
      };

      // Clicking the black face cycles spectrum <-> oscilloscope.
      if (vis._canvas && !vis._canvas.dataset.headampCycleBound) {
        vis._canvas.dataset.headampCycleBound = "1";
        vis._canvas.style.cursor = "pointer";
        vis._canvas.addEventListener("click", cycleVisibleModes);
      }

      // The skin's original AVS button toggled an AVS component which is not
      // useful for tracker modules here. Re-purpose it as the visualizer mode
      // switch instead, keeping the exact original button artwork.
      const avsToggle = getSkinObject("avsToggle");
      if (avsToggle && !avsToggle.__headampRepurposed) {
        avsToggle.__headampRepurposed = true;
        avsToggle.onLeftClick = cycleVisibleModes;
      }

      window.__headampVis = {
        spectrum: () => { avs?.hide?.(); vis.show?.(); vis.setmode?.("1"); },
        oscilloscope: () => { avs?.hide?.(); vis.show?.(); vis.setmode?.("2"); },
        off: () => vis.setmode?.("0"),
        cycle: cycleVisibleModes,
        object: vis
      };
    }

    // Open HeadAMP's real right-hand fold-out playlist drawer.
    const drawerStatus = getSkinObject("RightDrawerStatus");
    const drawerOpen = getSkinObject("RightDrawerOpen");
    const rawStatus =
      drawerStatus?.getxmlparam?.("x") ??
      drawerStatus?.getXMLparam?.("x") ??
      "0";
    if (!Number(rawStatus)) drawerOpen?.leftclick?.();

    window.dispatchEvent(new CustomEvent("headamp-skin-ready"));
  }

  setTimeout(configureHeadampSkin, 500);
  setTimeout(configureHeadampSkin, 1400);

  window.addEventListener("headamp-analyser-ready", () => {
    const vis = getSkinObject("vis");
    if (!vis) return;
    const mode = String(vis.getmode?.() || 1);
    // Rebuild the painter so it captures the tracker analyser rather than
    // Webamp Modern's silent HTMLAudioElement analyser.
    vis.setmode?.("0");
    vis.setmode?.(mode === "0" ? "1" : mode);
  });

  window.__headampModern = webamp;
  window.__headampPlaylist = {
    list: () => playlists.map((p) => ({ ...p })),
    load: loadPlaylist,
    play: (index) => {
      const i = Number(index) || 0;
      webamp?._uiRoot?.playlist?.playtrack?.(i);
      AUDIO.play();
    },
    current: () => currentPlaylist
  };
  window.dispatchEvent(new CustomEvent("headamp-ready"));

  setStatus("HEADAMP MODERN // REAL .WAL // " + initialCount + " TRACKS", "ok");

  setTimeout(() => {
    if (statusEl) statusEl.style.display = "none";
  }, 5000);
} catch (error) {
  console.error("HeadAMP Modern failed:", error);
  setStatus("HEADAMP MODERN ERROR // " + (error?.message || error), "error");
}

window.addEventListener("desktop-headamp-show",()=>document.body.classList.remove("headamp-hidden"));
