import Webamp from "https://unpkg.com/webamp@^2";

const host = document.getElementById("classicEqHost");
let eq = null;
let lastState = null;

function sync() {
  if (!eq) return;
  const state = eq.store.getState();
  const equalizer = state.equalizer;
  lastState = { on: equalizer.on, auto: equalizer.auto, sliders: { ...equalizer.sliders } };
  if (window.__headampEq?.setState) window.__headampEq.setState(lastState);
}

try {
  eq = new Webamp({
    windowLayout: {
      equalizer: {
        position: { left: 0, top: 0 },
        shadeMode: false,
        closed: false
      }
    },
    enableDoubleSizeMode: false,
    enableHotkeys: false,
    enableMediaSession: false,
    zIndex: 349
  });

  await eq.renderWhenReady(host);
  window.__classicWinampEq = eq;
  sync();
  eq.store.subscribe(sync);

  window.addEventListener("headamp-eq-ready", () => {
    if (lastState && window.__headampEq?.setState) window.__headampEq.setState(lastState);
  });

  window.addEventListener("desktop-eq-show", () => {
    host.classList.remove("desktopHidden");
  });
} catch (error) {
  console.error("Classic Winamp EQ failed:", error);
}
