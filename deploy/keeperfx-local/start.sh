#!/usr/bin/env bash
set -euo pipefail

export DISPLAY="${DISPLAY:-:1}"
export WINEPREFIX="${WINEPREFIX:-/server-data/wine}"
VNC_PASSWORD="${VNC_PASSWORD:-keeperfx}"

mkdir -p /server-data/wine /server-data/saves /game-data/DATA /game-data/SOUND

GAME_EXE="$(find /opt/keeperfx -type f -iname 'keeperfx*.exe' | head -n 1 || true)"
if [ -z "$GAME_EXE" ]; then
  echo "ERROR: KeeperFX executable not found."
  exit 1
fi

GAME_DIR="$(dirname "$GAME_EXE")"
mkdir -p "$GAME_DIR/data" "$GAME_DIR/sound"

# Game assets stay on the host PC and are mounted read-only at /game-data.
cp -an /game-data/DATA/. "$GAME_DIR/data/" 2>/dev/null || true
cp -an /game-data/SOUND/. "$GAME_DIR/sound/" 2>/dev/null || true

# Persistent saves remain on the host PC.
for save_name in save SAVE saves Saves; do
  target="$GAME_DIR/$save_name"
  if [ -e "$target" ] && [ ! -L "$target" ]; then
    cp -an "$target"/. /server-data/saves/ 2>/dev/null || true
    rm -rf "$target"
  fi
  ln -sfn /server-data/saves "$target"
done

Xvfb "$DISPLAY" -screen 0 1280x800x24 -ac +extension GLX +render -noreset &
sleep 2
fluxbox >/tmp/fluxbox.log 2>&1 &

mkdir -p /root/.vnc
x11vnc -storepasswd "$VNC_PASSWORD" /root/.vnc/passwd >/dev/null
x11vnc -display "$DISPLAY" -rfbauth /root/.vnc/passwd -rfbport 5900 -forever -shared -noxdamage >/tmp/x11vnc.log 2>&1 &

websockify --web=/usr/share/novnc/ 6080 localhost:5900 >/tmp/novnc.log 2>&1 &

wineboot -u >/tmp/wineboot.log 2>&1 || true
sleep 2
cd "$GAME_DIR"
wine "$GAME_EXE" >/tmp/keeperfx.log 2>&1 &

echo "KeeperFX is running locally at http://localhost:6080"
tail -f /tmp/keeperfx.log /tmp/novnc.log
