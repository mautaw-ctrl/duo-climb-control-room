# KeeperFX browser game

Miracle442 runs the official 32-bit KeeperFX 1.3.2 release (SDL2) using
BoxedWine compiled to WebAssembly. This is Win32 emulation in the browser,
not a native Emscripten port of KeeperFX.

The launcher is `site/keeperfx/index.html`. Runtime files, game data,
all campaign maps and graphics are served by the same static site. No
player PC, streaming server, paid object store or cross-origin proxy is needed.

## Rebuild

`Build KeeperFX Browser Package` downloads the complete official release
from `dkfans/keeperfx`, applies the user's compatibility files from
`site/keeperfx/game-files/data` and `sound`, and sets fixed windowed
resolutions for the browser software framebuffer. English speech is retained.
All campaigns, level maps and graphics are kept. Desktop launchers and debug
build files are omitted.

Both the game ZIP and the Wine root ZIP are split into 8 MiB files with JSON
manifests in `site/keeperfx/runtime-web`. The launcher prefetches those chunks
asynchronously before starting the emulator. It routes both the BoxedWine
shell's central-directory reader and BrowserFS's separate ZIP-entry reader
through the same Wine chunk backend.

The complete release's SDL2 library uses newer Universal CRT functions that
Wine 1.7.55 does not implement. `site/keeperfx/compat/sdl2-wine17.zip`
contains the official 32-bit MinGW SDL2 2.26.5 runtime and its license. The
launcher layers that compatible DLL over the game filesystem in memory.
It exports every SDL function imported by KeeperFX and its other SDL libraries.
The unused WebGL canvas stays hidden so it cannot intercept game input.

The generated runtime is committed back to `main`. GitHub Pages serves the
`site/keeperfx/` route. For Cloudflare hosting, deploy the updated `site/`
directory using the repository's existing deployment flow.

## Use and diagnostics

Click **START KEEPERFX**, wait for downloads, then click the game to focus its
keyboard/mouse input. The loading panel disappears when the first visible
frame is drawn, not on a timer. **FULLSCREEN** expands the game;
**RESTART** reloads the launcher.

**LOG** shows bounded engine/runtime output. **KEEPERFX.LOG** reads the game
log from the mounted application filesystem. Saves and settings use an
IndexedDB-backed BrowserFS mirror and survive a reload on the same browser
and site origin. If browser storage is unavailable, the log reports that the
session is using memory.

The browser CPU emulator may run more slowly than desktop KeeperFX. The
initial target is single-player; network play is not validated.
