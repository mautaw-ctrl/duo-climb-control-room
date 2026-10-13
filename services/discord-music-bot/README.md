# Spillemand | Private Discord Music Bot

Discord slash commands and a private website music controller. The bot must remain on a persistent host with outbound voice connectivity. **Cloudflare Workers cannot host the persistent voice process.**

## Railway deployment from GitHub

1. Create a Railway project and add a **GitHub Repo** service using `mautaw-ctrl/duo-climb-control-room`. Choose its `main` branch.
2. In service **Settings → Source**, set **Root Directory** to `/services/discord-music-bot`. Railway will now detect the local `Dockerfile` automatically. Do not also specify a different Dockerfile path.
3. In Railway **Variables**, set:
   - `DISCORD_TOKEN`: bot token from Discord Developer Portal → Bot. **Never commit or share this secret.**
   - `GUILD_ID`: Discord server ID (enable Developer Mode and right-click server → Copy Server ID).
   - `VOICE_CHANNEL_ID` is **optional**: only set it if the website should start music before anybody has issued `/play` in Discord. Discord `/play` always follows the requester's current voice channel.
   - `CONTROL_KEY`: a **4-character PIN** for the web controller. The bot requires exactly 4 characters and limits repeated failed attempts. Keep the PIN private and configure Cloudflare Access or equivalent gating before treating this as a secure public control panel.
   - Spotify track links: no Spotify client credentials needed for title/artwork. Metadata is fetched from Spotify's public oEmbed endpoint. Audio playback still requires a playable external match.
   - `PORT` is provided by Railway. Otherwise defaults to `8080`.
4. In Railway **Settings → Networking**, generate a public HTTPS domain to access the web controller. The page itself is viewable, but state and playback controls require the control key.
5. Invite the bot to your private server with scopes `bot` and `applications.commands`; grant View Channels, Connect and Speak. Join any normal voice channel, then issue `/play` in your text commands channel. Spillemand joins your channel automatically; no fixed channel ID is necessary.

## Commands

- `/play` YouTube or SoundCloud URL, Spotify track URL (via metadata search), or song name. **You must be in a voice channel**. Spillemand automatically joins or moves into your channel.
- `/skip` next track
- `/stop` clear queue and disconnect
- `/queue` list queued tracks; Discord response includes skip and stop buttons
- Website UI: play, pause, resume, skip, stop, and visible queue. By default use Discord `/play` once to join a voice channel before starting music from the website. An optional `VOICE_CHANNEL_ID` can provide a website-only default instead.

## Supported music sources

YouTube uses **yt-dlp + Deno**, then tries configured public **Piped** and **Invidious** endpoints if the Railway IP is challenged. An **FFprobe audio preflight** must succeed before a stream is enqueued. SoundCloud still relies on yt-dlp and FFmpeg; DRM-protected tracks remain unavailable. Public fallback services may be rate limited, blocked, or shut down, so YouTube playback is best-effort, not guaranteed. Spotify track links use Spotify's public oEmbed endpoint for title and cover art (no client ID or secret), then search for a playable match via YouTube; Spotify itself does not provide audio to this bot. Pasting a single Spotify track URL into the website also displays the official Spotify embed preview above the **same** shared Discord queue. Queue add, bulk import, drag-and-drop reordering, remove, pause, skip and stop remain unchanged. Spotify albums and playlists are not implemented yet. One Discord guild/voice connection is supported; new `/play` commands from a different voice channel move the active bot to the new requester's channel. Provider changes or rate limits may require maintenance.

## Security and limitations

The web controller uses a 4-character PIN with in-memory failed-attempt limits. A four-character PIN is relatively weak and **does not protect a publicly reachable Railway URL against determined attacks**. For stronger protection put the controller behind Cloudflare Access or equivalent server-side authentication. **Do not put `DISCORD_TOKEN` or `CONTROL_KEY` into public static JavaScript or commit them to GitHub**. Protect public website access using authentication; a Railway web service domain does not automatically inherit your Cloudflare access controls. Deploying is not the same as verifying actual voice playback. This service has not yet been verified on a live Discord server.

## Architecture

Discord /play and controls → persistent Python bot on Railway → Discord voice.
Private web controller (Railway HTTPS) → authenticated HTTP API → same bot.
Existing Cloudflare website may link to this controller or use an authenticated server-side integration after the bot has a deployed URL.

## YouTube streaming diagnostics (2026)

Railway data-centre IP addresses sometimes trigger YouTube's **“Sign in to confirm you're not a bot”** challenge. A new Deno/yt-dlp client or PO token cannot guarantee bypassing an IP-level block.

- On every bot boot, a **single background smoke test** requests a real YouTube video's audio and runs FFprobe against the stream. Railway logs show `YOUTUBE_AUDIO_PROBE SUCCESS` or `YOUTUBE_AUDIO_PROBE FAILED`. The unauthenticated `GET /health` reports `youtubeAudio: pending | testing | verified | unavailable`; it never exposes stream URLs or credentials.
- `PIPED_API_INSTANCES` (optional): comma-separated HTTPS Piped API base URLs.
- `INVIDIOUS_API_INSTANCES` (optional): comma-separated HTTPS Invidious API base URLs.
- Each fallback must return a publicly reachable HTTPS audio stream that FFprobe can decode. If nothing works, the UI reports a real provider failure instead of silently queueing an unplayable song.
- The fallback services are **third parties**: use only for public YouTube video IDs or public music searches. The bot never forwards the Discord token, Spotify authentication, or the website PIN to them.
- The Railway Docker build runs mocked resolver regression tests and Python syntax checks before it can go live.

If the background probe fails across all providers, the durable solution may require an approved streaming source or a playback host on a connection not challenged by YouTube. Simply redeploying or using a different yt-dlp client does not fix an IP reputation block.

## Public Lavalink node playback (October 2026)

Spillemand now supports **Lavalink v4** through Python Wavelink 3.5.2. It discovers public SSL nodes through the same node directory used by [BeatDock](https://github.com/albertgmz/BeatDock) and connects to a bounded pool. Searches move to another connected node when a provider fails. An optional trusted node can be prioritized by setting `LAVALINK_PRIMARY=https://trusted.example.com:443|node-password` privately in Railway variables.

Important distinctions:

- The `/health` endpoint distinguishes `lavalinkNodes`, `youtubeAudio` search status, and the `playback` state. A connected node / loaded track does **not** prove Discord voice actually receives audio. Actual voice playback is logged as `LAVALINK_TRACK_STARTED` or an error.
- Third-party public nodes receive public song titles / video IDs and, when used for voice, Discord's temporary voice-session credentials. **Never use a public node you do not trust with your Discord voice session.** The bot PIN, Discord bot token, and Spotify credentials are not forwarded.
- If no Lavalink node is connected, the original yt-dlp / FFmpeg path remains for links that the Railway IP can play.
- Public nodes can become unavailable, block YouTube themselves, or run plugins that lack the requested source. Dependable 24-hour playback requires a trusted node with working access.
- The existing `/player/` controller, slash commands, Spotify preview, queued song edits, and 4-character PIN are unchanged.
