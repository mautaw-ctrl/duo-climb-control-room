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
   - Optional Spotify matching: `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` from a Spotify developer application.
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

YouTube and SoundCloud links rely on `yt-dlp` and FFmpeg. Spotify track links resolve metadata through Spotify API then try a playable match via YouTube; Spotify itself does not provide audio to this bot. Spotify albums and playlists are not implemented yet. One Discord guild/voice connection is supported; new `/play` commands from a different voice channel move the active bot to the new requester's channel. Provider changes or rate limits may require maintenance.

## Security and limitations

The web controller uses a 4-character PIN with in-memory failed-attempt limits. A four-character PIN is relatively weak and **does not protect a publicly reachable Railway URL against determined attacks**. For stronger protection put the controller behind Cloudflare Access or equivalent server-side authentication. **Do not put `DISCORD_TOKEN` or `CONTROL_KEY` into public static JavaScript or commit them to GitHub**. Protect public website access using authentication; a Railway web service domain does not automatically inherit your Cloudflare access controls. Deploying is not the same as verifying actual voice playback. This service has not yet been verified on a live Discord server.

## Architecture

Discord /play and controls → persistent Python bot on Railway → Discord voice.
Private web controller (Railway HTTPS) → authenticated HTTP API → same bot.
Existing Cloudflare website may link to this controller or use an authenticated server-side integration after the bot has a deployed URL.
