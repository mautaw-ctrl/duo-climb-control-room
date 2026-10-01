# KeeperFX Browser / noVNC deployment

This is the fast browser route for Miracle442.

It runs the official KeeperFX 1.4.0 Windows release under Wine in a virtual X desktop and exposes that desktop through noVNC.

## Railway

Create a new Railway service from this repository.

Use the repository root as the build context and set the Dockerfile path to:

```
deploy/keeperfx-novnc/Dockerfile
```

Add a persistent volume mounted at:

```
/data
```

Set:

```
VNC_PASSWORD=<your-own-password>
```

Railway supplies `PORT` automatically.

After deployment, open the public Railway URL. Then paste that URL into the Miracle442 "KeeperFX Remote" launcher.

## Game data

The Docker build copies:

```
site/keeperfx/game-files/DATA/
site/keeperfx/game-files/SOUND/
```

into the KeeperFX installation without replacing files already supplied by the official KeeperFX package.

The original CD BIN/CUE image is not required for this deployment if the needed installed data is already present.

## Persistence

`/data` is intended for Wine state and saves. Attach a Railway volume there so redeploys do not wipe it.
