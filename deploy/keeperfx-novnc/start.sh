#!/usr/bin/env bash
set -euo pipefail

export DISPLAY="${DISPLAY:-:1}"
export WINEPREFIX="${WINEPREFIX:-/data/wine}"
PORT="${PORT:-6080}"
VNC_PASSWORD="${VNC_PASSWORD:-keeperfx}"

mkdir -p /data /data/saves /data/config "$WINEPREFIX"

GAME_EXE="$(find /opt/keeperfx -type f \( -iname 'keeperfx.exe' -o -iname 'keeperfx*.exe' \) | head -n 1 || true)"
if [ -z "$GAME_EXE" ]; then
  echo "ERROR: KeeperFX executable not found in /opt/keeperfx"
  find /opt/keeperfx -maxdepth 3 -type f | sed -n '1,200p'
  exit 1
fi

GAME_DIR="$(dirname "$GAME_EXE")"
echo "KeeperFX executable: $GAME_EXE"
echo "KeeperFX directory:  $GAME_DIR"

# Merge the user's original DK1 files into the KeeperFX installation.
# Do not overwrite files supplied by the KeeperFX complete package.
mkdir -p "$GAME_DIR/data" "$GAME_DIR/sound"
if [ -d /workspace/site/keeperfx/game-files/DATA ]; then
  cp -an /workspace/site/keeperfx/game-files/DATA/. "$GAME_DIR/data/" || true
fi
if [ -d /workspace/site/keeperfx/game-files/SOUND ]; then
  cp -an /workspace/site/keeperfx/game-files/SOUND/. "$GAME_DIR/sound/" || true
fi

# Preserve saves between Railway redeploys where possible.
for save_name in save SAVE saves Saves; do
  candidate="$GAME_DIR/$save_name"
  if [ -e "$candidate" ] && [ ! -L "$candidate" ]; then
    cp -an "$candidate"/. /data/saves/ 2>/dev/null || true
    rm -rf "$candidate"
  fi
  ln -sfn /data/saves "$candidate"
done

# X desktop
Xvfb "$DISPLAY" -screen 0 1280x800x24 -ac +extension GLX +render -noreset &
XVFB_PID=$!
sleep 2

fluxbox >/tmp/fluxbox.log 2>&1 &

mkdir -p /root/.vnc
x11vnc -storepasswd "$VNC_PASSWORD" /root/.vnc/passwd >/dev/null
x11vnc -display "$DISPLAY" -rfbauth /root/.vnc/passwd -rfbport 5900 -forever -shared -noxdamage >/tmp/x11vnc.log 2>&1 &

# Start noVNC on Railway's assigned port.
websockify --web=/usr/share/novnc/ "$PORT" localhost:5900 >/tmp/novnc.log 2>&1 &

# Initialize Wine quietly, then start KeeperFX.
wineboot -u >/tmp/wineboot.log 2>&1 || true
sleep 2
cd "$GAME_DIR"
wine "$GAME_EXE" >/tmp/keeperfx.log 2>&1 &

echo "KeeperFX web desktop listening on port $PORT"
echo "VNC password is controlled by VNC_PASSWORD."

wait "$XVFB_PID"
