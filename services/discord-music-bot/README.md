# Private Discord music service

Runs a persistent Discord voice bot plus a web music controller.

## Deployment
Use a persistent Docker host (Railway, VPS or a service supporting long-lived Discord gateway and voice WebSocket connections). Repository: `mautaw-ctrl/duo-climb-control-room`. Docker build context: repository root. Dockerfile: `services/discord-music-bot/Dockerfile`.

Set the following environment variables in the hosting provider, never in Git: `DISCORD_TOKEN`, numeric `GUILD_ID`, `VOICE_CHANNEL_ID`, and a randomly generated `CONTROL_KEY` of 24 characters or longer. Optional: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `PORT` (default `8080`).

Invite the bot with `bot` and `applications.commands` scopes; grant View Channel, Connect, and Speak in its assigned voice channel. The web controller is served from the host's root URL, authenticated with the control key. Do not publish the control key in site JavaScript.

Discord commands: `/play`, `/stop`, `/skip`, `/queue`. The web controller supports play, skip, stop, pause, resume, and queue display.

YouTube and SoundCloud playback use yt-dlp and FFmpeg. Spotify track URLs use Spotify metadata and a YouTube audio search; Spotify does not supply raw audio to this bot. Spotify playlists/albums are not supported yet.

Cloudflare Workers can host or proxy a gated web interface but **cannot run the long-lived Python voice process**. The Cloudflare site deployment is not part of this commit. This has not been live-tested against a Discord guild.
