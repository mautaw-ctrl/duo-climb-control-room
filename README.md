# jesuslovesyou.dk — cinematic homepage · v0.3

A 36-second journey from black to storm, rising flood, breaking light and an abstract luminous Jesus figure parting the water. The ocean, clouds, rain, water walls and reflections are drawn in real time. The generated transparent artwork seeds animated points and connected strands; the figure is not a video or a flat moving image.

The scene keeps moving after the introduction. Scrolling makes Jesus glide, bank and complete a full turn between chapters, settling front-facing at each destination. The entire point figure, halo and trailing currents move together. Love enters through descending light, Englesang gathers in a spiral, and Teknologi bursts into particles before reforming. The entry envelopes start and end at the same assembled pose. Chapter text enters in staggered movements, with cyan/gold currents for Englesang and violet/cyan aurora for Teknologi.

Pointer movement gently shifts the view. Pause, replay and skip remain available. Reduced motion opens the finished scene paused, without lightning, flight, spinning or entrance scattering. If WebGL is unavailable, the artwork and navigation remain usable.

## Background music

Click **Music off** in the upper-right corner to enable the original soundtrack. The opening has swelling wind and two isolated thunder rumbles; as the light arrives, the sound becomes an evolving modal arrangement of plucked strings, low strings, airy choir and soft bell-like notes. It blends celestial warmth with dark medieval ambience. The score is synthesized locally; it does not stream music or use existing game recordings.

The music follows the scene, has a bounded voice budget, and stops when switched off or when the tab is hidden. The normal pause control also pauses music. Reduced motion keeps the visuals still while allowing the explicitly enabled soundtrack to play.

`soundtrack-preview.wav` is an optional 24-second demonstration of the original score. The live soundtrack is synthesized by `soundscape.js` and does not require this preview file. `audio-validation.json` records measured audio output, silence on pause/mute, hidden-tab recovery and voice limits.

## Cloudflare Pages

The existing Pages project uses **mautaw-ctrl/duo-climb-control-room**, production branch **jesuslovesyou-website**. Updates to that branch trigger a new deployment when the Git integration is enabled.

- Framework: **None**
- Build command: **empty**
- Output directory: **/**
- Root directory: **empty**

No installation, build step, environment variable or secret is needed. Serve `index.html`, `styles.css`, `experience.js`, `storm-ocean.js`, `jesus-figure.js`, `soundscape.js` and `jesus-figure.png` together. The direct-upload ZIP contains those files at its root.

The existing project address is **https://duo-climb-control-room.pages.dev/**. The published version must be confirmed from the Cloudflare deployment result; the browser validation in this repository covers the files locally, not the production build.

## Versions and existing services

The Git tags **v0.1** and **v0.2** preserve the previous homepages. This branch contains only the separate homepage. The existing desktop, League tracker, Riot secret and `main` branch are unchanged.

Navigation targets **https://jesuslovesyou.dk/englesang** and **https://jesuslovesyou.dk/teknologi**. Connecting the custom domain and routing those paths is separate from deploying this homepage. A pending Cloudflare zone still needs its assigned nameservers set at one.com and activation confirmed. Once active, use the Pages project's custom-domain wizard to connect the apex, then configure the service paths. The temporary Englesang address is **https://spillemand-production.up.railway.app/**.

## Rendering and validation

The renderer uses WebGL 1 without external packages or fonts. It caps the drawing-buffer resolution and reduces it gradually on slower devices. GPU performance varies by device; software-rendered headless browser checks are not a hardware frame-rate benchmark.

`validation.json` records the browser checks and any remaining limitations. Previews show the actual browser-rendered stages. They are snapshots; the deployed background animates continuously.
