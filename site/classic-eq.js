import Webamp from "https://unpkg.com/webamp@^2";

const host = document.getElementById("classicEqHost");
let lastEqState = null;

function pushEq(state) {
  const eq = state?.equalizer;
  if (!eq) return;
  lastEqState = {
    on: eq.on,
    auto: eq.auto,
    sliders: { ...eq.sliders }
  };
  if (window.__headampEq?.setState) {
    window.__headampEq.setState(lastEqState);
  }
}

try {
  const eq = new Webamp({
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

  pushEq(eq.store.getState());
  eq.store.subscribe(() => pushEq(eq.store.getState()));

  window.addEventListener("headamp-eq-ready", () => {
    if (lastEqState && window.__headampEq?.setState) {
      window.__headampEq.setState(lastEqState);
    }
  });
} catch (error) {
  console.error("Classic Winamp EQ failed:", error);
}
