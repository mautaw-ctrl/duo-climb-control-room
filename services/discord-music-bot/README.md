# Spillemand | Private Discord Music Bot

Discord slash commands and a private website music controller. The bot must remain on a persistent host with outbound voice connectivity. **Cloudflare Workers cannot host the persistent voice process.**

## Railway deployment from GitHub

1. Create a Railway project and add a **GitHub Repo** service using `mautaw-ctrl/duo-climb-control-room`. Choose its `main` branch.
2. In service **Settings → Source**, set **Root Directory** to `/services/discord-music-bot`. Railway will now detect the local `Dockerfile` automatically. Do not also specify a different Dockerfile path.
3. In Railway **Variables**, set:
   - `DISCORD_TOKEN`: bot token from Discord Developer Portal → Bot. **Never commit or share this secret.**
   - `GUILD_ID`: Discord server ID (enable Developer Mode and right-click server → Copy Server ID).
   - `VOICE_CHANNEL_ID`: voice channel ID (right-click channel → Copy Channel ID).
   - `CONTROL_KEY`: generate a private random 32+ character value; required for website controls.
   - Optional Spotify matching: `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` from a Spotify developer application.
   - `PORT` is provided by Railway. Otherwise defaults to `8080`.
4. In Railway **Settings → Networking**, generate a public HTTPS domain to access the web controller. The page itself is viewable, but state and playback controls require the control key.
5. Invite the bot to your private server with scopes `bot` and `applications.commands`; grant View Channels, Connect and Speak. Use `/play` inside Discord to confirm audio.

## Commands

- `/play` YouTube or SoundCloud URL, Spotify track URL (via metadata search), or song name
- `/skip` next track
- `/stop` clear queue and disconnect
- `/queue` list queued tracks; Discord response includes skip and stop buttons
- Website UI: play, pause, resume, skip, stop, and visible queue

## Supported music sources

YouTube and SoundCloud links rely on `yt-dlp` and FFmpeg. Spotify track links resolve metadata through Spotify API then try a playable match via YouTube; Spotify itself does not provide audio to this bot. Spotify albums and playlists are not implemented yet. Provider changes or rate limits may require maintenance.

## Security and limitations

The web controller uses a header-based control key. **Do not put `DISCORD_TOKEN` or `CONTROL_KEY` into public static JavaScript or commit them to GitHub**. Protect public website access using authentication; a Railway web service domain does not automatically inherit your Cloudflare access controls. Deploying is not the same as verifying actual voice playback. This service has not yet been verified on a live Discord server.

## Architecture

Discord /play and controls → persistent Python bot on Railway → Discord voice.
Private web controller (Railway HTTPS) → authenticated HTTP API → same bot.
Existing Cloudflare website may link to this controller or use an authenticated server-side integration after the bot has a deployed URL.
