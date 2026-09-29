# KeeperFX Web port scaffold

This directory documents the browser-port target used by Miracle442 OS.

## Goal

Compile the GPLv2 KeeperFX source to WebAssembly with Emscripten and serve the
result from:

```
site/keeperfx/runtime/keeperfx.js
site/keeperfx/runtime/keeperfx.wasm
```

The browser launcher then injects the compatibility data pack from:

```
site/keeperfx/game-files/data/
site/keeperfx/game-files/sound/
```

## Browser platform work still required

KeeperFX currently has no upstream Emscripten/WebAssembly build target. A real
port will need an Emscripten platform layer for graphics/input/audio, filesystem
paths, timing and networking. SDL is already used throughout KeeperFX, which is
a useful starting point.

Recommended first milestone:

1. Build a single-player-only WASM target.
2. Disable ENet/network code for the first browser build.
3. Use SDL browser video/input/audio backends.
4. Map KeeperFX file I/O onto Emscripten FS.
5. Produce `keeperfx.js` + `keeperfx.wasm`.
6. Put those two outputs in `site/keeperfx/runtime/`.
7. Open the Miracle442 KeeperFX app and use its file checker.

The game-data folder is deliberately separate from the runtime so a replacement
asset pack can be developed without touching the engine build.
