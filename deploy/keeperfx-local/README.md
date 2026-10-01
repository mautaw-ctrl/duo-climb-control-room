# KeeperFX local server — zero paid storage

This is the Miracle442 KeeperFX setup when the user's PC acts as the complete server.

Nothing needs Railway, R2, paid object storage, or a hosted game-data volume.

## Host folders

Create these Windows folders:

```
C:\Miracle442\keeperfx-data\DATA
C:\Miracle442\keeperfx-data\SOUND
C:\Miracle442\keeperfx-server-data
```

Copy your installed Dungeon Keeper files into the first two folders:

```
C:\Miracle442\keeperfx-data\DATA\...
C:\Miracle442\keeperfx-data\SOUND\...
```

The second host folder stores saves and Wine state.

## Start

Install Docker Desktop.

From this directory:

```powershell
copy .env.example .env
docker compose up -d --build
```

Local noVNC:

```
http://localhost:6080
```

The compose file also starts a Cloudflare Quick Tunnel container. It prints a temporary public URL ending in:

```
trycloudflare.com
```

Find it with:

```powershell
docker logs miracle442-keeperfx-tunnel
```

Paste that HTTPS URL into the KeeperFX Remote app inside Miracle442.

Cloudflare Quick Tunnels do not store the Dungeon Keeper files. They proxy browser traffic to the local noVNC service. The hostname changes whenever the tunnel is recreated.

## Stop

```powershell
docker compose down
```

Your files and saves remain in C:\Miracle442.
