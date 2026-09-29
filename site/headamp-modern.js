import { ChiptuneJsPlayer } from "/vendor/chiptune3/chiptune3.js";

const statusEl = document.getElementById("headampModernStatus");
const host = document.getElementById("headampModernHost");
const BASE = "/vendor/webamp-modern";
const TRACK_BASE = "/music/deus-ex/";

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
    setBalance: AUDIO.setBalance.bind(AUDIO)
  };

  function ensureTracker() {
    if (tracker) return tracker;

    tracker = new ChiptuneJsPlayer({
      repeatCount: 0,
      stereoSeparation: 100
    });

    trackerReady = new Promise((resolve) => {
      tracker.onInitialized(() => resolve());
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
        setStatus("HEADAMP MODERN // DEUS EX TRACKER AUDIO", "ok");
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

  const manifestResponse = await fetch(`${TRACK_BASE}manifest.json`, { cache: "no-store" });
  if (!manifestResponse.ok) throw new Error("Deus Ex soundtrack manifest missing");
  const manifest = await manifestResponse.json();
  const names = Array.isArray(manifest) ? manifest : manifest.tracks;
  if (!Array.isArray(names) || names.length === 0) throw new Error("No soundtrack tracks in manifest");

  if (typeof window.WebampModern !== "function") {
    throw new Error("Webamp Modern constructor unavailable");
  }

  webamp = new window.WebampModern(host, {
    skin: "/skins/HeadAMP.wal",
    tracks: []
  });

  // Add tracker modules ourselves with metadata so Webamp Modern does not
  // try to parse them as MP3/ID3 files.
  for (const name of names) {
    webamp._uiRoot.playlist.addTrack({
      filename: TRACK_BASE + encodeURIComponent(name),
      metadata: { artist: "Deus Ex", title: cleanTitle(name) },
      duration: 0
    });
  }

  window.__headampModern = webamp;
  setStatus(`HEADAMP MODERN // REAL .WAL // ${names.length} TRACKS`, "ok");

  setTimeout(() => {
    if (statusEl) statusEl.style.display = "none";
  }, 5000);
} catch (error) {
  console.error("HeadAMP Modern failed:", error);
  setStatus("HEADAMP MODERN ERROR // " + (error?.message || error), "error");
}
