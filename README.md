# jesuslovesyou.dk — cinematic homepage · v0.2

A 36-second journey from black to storm, rising flood, breaking light and an abstract luminous Jesus figure parting the water. The ocean, clouds, rain, water walls and reflections are drawn in real time. The generated transparent artwork seeds animated points and connected strands; the figure is not a video or a flat moving image.

The scene keeps moving after the introduction. Pointer movement gently shifts the view; scrolling changes the atmosphere and moves between Love, Englesang and Teknologi. Pause, replay and skip are always available. Sound is optional and synthesized locally after a click. Reduced motion opens the finished scene paused, without lightning. If WebGL is unavailable, the artwork and navigation remain usable.

## Cloudflare Pages

The existing Pages project uses **mautaw-ctrl/duo-climb-control-room**, production branch **jesuslovesyou-website**. Updates to that branch trigger a new deployment when the Git integration is enabled.

- Framework: **None**
- Build command: **empty**
- Output directory: **/**
- Root directory: **empty**

No installation, build step, environment variable or secret is needed. Serve `index.html`, `styles.css`, `experience.js`, `storm-ocean.js`, `jesus-figure.js`, `soundscape.js` and `jesus-figure.png` together. The direct-upload ZIP contains those files at its root.

The existing project address is **https://duo-climb-control-room.pages.dev/**. The published version must be confirmed from the Cloudflare deployment result; the browser validation in this repository covers the files locally, not the production build.

## Versions and existing services

The Git tag **v0.1** preserves the previous homepage. This branch contains only the separate homepage. The existing desktop, League tracker, Riot secret and `main` branch are unchanged.

Navigation targets **https://jesuslovesyou.dk/englesang** and **https://jesuslovesyou.dk/teknologi**. Connecting the custom domain and routing those paths is separate from deploying this homepage. A pending Cloudflare zone still needs its assigned nameservers set at one.com and activation confirmed. Once active, use the Pages project's custom-domain wizard to connect the apex, then configure the service paths. The temporary Englesang address is **https://spillemand-production.up.railway.app/**.

## Rendering and validation

The renderer uses WebGL 1 without external packages or fonts. It caps the drawing-buffer resolution and reduces it gradually on slower devices. GPU performance varies by device; software-rendered headless browser checks are not a hardware frame-rate benchmark.

`validation.json` records the browser checks and any remaining limitations. Previews show the actual browser-rendered stages. They are snapshots; the deployed background animates continuously.
