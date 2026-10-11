# jesuslovesyou.dk · v0.4.1 — A universe within

A 46-second introduction in a Y2K dreamscape. It begins with two seconds of black, then luminous glass and chrome organs emerge. The camera slowly pulls away to reveal a fragmented human body. Its coherent parts return one at a time, becoming whole before dissolving into the luminous Jesus figure.

The surrounding world has pearl water, liquid chrome arches, orbit ribbons, an eclipse, lilac and cyan atmospheric light, and sparse star glints. This world continues throughout the homepage. The organs and body are procedural geometry rendered in real time; the Jesus artwork seeds the existing moving point volume. No animation video, external fonts or runtime dependencies are required.

## Sequence and interaction

- 0–2 seconds: black.
- 2–6 seconds: the internal organs emerge.
- 5–17 seconds: a continuous pullback reveals the fragmented body.
- 16–31.5 seconds: individual parts glide into their anatomical positions.
- 30.5–41 seconds: the assembled body transitions into Jesus.
- 46 seconds: the homepage content arrives.

Scroll to make Jesus glide, bank and turn between Love, Englesang and Teknologi. Each chapter retains its own animated entrance. Pointer movement gently shifts the scene. Pause, replay and skip are available; chapter links skip the introduction.

Reduced motion opens the completed scene paused and disables flight, turning, scattering and camera movement. Without WebGL or JavaScript, the artwork and content remain available.

## Background music

Click **Music off** to play **Funky Stars**, composed by **Quazar of Sanxion** in January 1996. This replaces the synthesized soundtrack with the user's supplied FastTracker II XM file, converted to browser-compatible MP3. It loops as background music and starts only after an explicit click. The anatomy introduction has no thunder or additional synthesized sounds.

Music stays silent through the black opening; replay resets the track to its beginning. Pause and hidden tabs pause playback without losing the position, while switching music off stops its output. The reduced-motion scene permits explicitly enabled music while its visuals remain still. `soundtrack-preview.wav` is an optional 24-second excerpt from the supplied track. The live site loads `funky-stars.mp3` when music is enabled.

## Cloudflare Pages

Repository: **mautaw-ctrl/duo-climb-control-room**. Production branch: **jesuslovesyou-website**. The connected Git integration should deploy branch updates.

- Framework: **None**
- Build command: **empty**
- Output directory: **/**
- Root directory: **empty**

Deploy `index.html`, `styles.css`, `experience.js`, `dreamscape.js`, `anatomy-figure.js`, `jesus-figure.js`, `soundscape.js`, `jesus-figure.png` and `funky-stars.mp3`. The upload ZIP contains only these runtime files at its root. No installation, build command, secret or environment variable is needed.

Existing project URL: **https://duo-climb-control-room.pages.dev/**. Local validation does not confirm Cloudflare's production deployment result.

## Saved versions

The immutable Git tags **v0.1**, **v0.2**, **v0.3** and **v0.4** preserve their exact earlier homepages. v0.4.1 keeps v0.4's visuals and replaces its music with the supplied track. It advances only the standalone homepage branch. The original application branches and their secrets remain unchanged.

The chapter destinations remain **https://jesuslovesyou.dk/englesang** and **https://jesuslovesyou.dk/teknologi**. Their separate domain routing is outside this visual update.

## Validation

`validation.json` records browser checks, including the black frame, organ pullback, sequential assembly, finished pose, transitions, controls, desktop/mobile layout and accessible fallbacks. `audio-validation.json` records music and playback lifecycle checks. The preview images are actual rendered frames.

Drawing resolution is capped and adapts downward on slower devices. The browser checks use Chromium with software WebGL; they are not a hardware frame-rate measurement.
