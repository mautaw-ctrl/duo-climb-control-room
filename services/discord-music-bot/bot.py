import asyncio
import logging
import os
import re
from collections import deque
from dataclasses import dataclass

import discord
from discord import app_commands
from discord.ext import commands
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import uvicorn
import yt_dlp

logging.basicConfig(level=logging.INFO)
TOKEN = os.environ["DISCORD_TOKEN"]
GUILD_ID = int(os.environ["GUILD_ID"])
CONTROL_KEY = os.environ["CONTROL_KEY"]
PORT = int(os.getenv("PORT", "8080"))
if len(CONTROL_KEY) < 24:
    raise RuntimeError("CONTROL_KEY must be at least 24 characters")
GUILD = discord.Object(id=GUILD_ID)
intents = discord.Intents.default()
bot = commands.Bot(command_prefix="!", intents=intents)
api = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
tracks = deque()
current = None
voice = None
lock = asyncio.Lock()
YDL_OPTIONS = {"format": "bestaudio/best", "quiet": True, "noplaylist": True,
               "default_search": "ytsearch1", "socket_timeout": 20}
FFMPEG_OPTIONS = {"before_options": "-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5",
                  "options": "-vn"}

@dataclass
class Track:
    title: str
    lookup: str
    requester: str

def spotify_lookup(link):
    import spotipy
    from spotipy.oauth2 import SpotifyClientCredentials
    if not os.getenv("SPOTIFY_CLIENT_ID") or not os.getenv("SPOTIFY_CLIENT_SECRET"):
        raise ValueError("Spotify links need SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET")
    match = re.search(r"/track/([a-zA-Z0-9]+)", link)
    if not match:
        raise ValueError("Spotify track links are supported; albums and playlists aren't yet.")
    client = spotipy.Spotify(auth_manager=SpotifyClientCredentials(), requests_timeout=15)
    item = client.track(match.group(1))
    return item["name"] + " " + " ".join(artist["name"] for artist in item["artists"]) + " audio"

def extract(query):
    with yt_dlp.YoutubeDL(YDL_OPTIONS) as ydl:
        result = ydl.extract_info(query, download=False)
    if "entries" in result:
        result = next((entry for entry in result["entries"] if entry), None)
    if not result:
        raise ValueError("No playable result")
    return result["title"], result["webpage_url"], result["url"]

async def resolve(query, requester):
    if "open.spotify.com/" in query:
        query = await asyncio.to_thread(spotify_lookup, query)
    title, url, _ = await asyncio.to_thread(extract, query)
    return Track(title[:160], url, requester)

async def ensure_voice():
    global voice
    guild = bot.get_guild(GUILD_ID)
    if not guild:
        raise ValueError("Bot is not in the configured Discord server")
    channel_id = os.getenv("VOICE_CHANNEL_ID")
    channel = guild.get_channel(int(channel_id)) if channel_id else None
    if not isinstance(channel, (discord.VoiceChannel, discord.StageChannel)):
        raise ValueError("Configure VOICE_CHANNEL_ID to a voice channel on the server")
    if guild.voice_client and guild.voice_client.is_connected():
        voice = guild.voice_client
        if voice.channel.id != channel.id:
            await voice.move_to(channel)
    else:
        voice = await channel.connect(timeout=30, reconnect=True)
    return voice

async def advance():
    global current
    async with lock:
        current = None
        if not tracks:
            return
        current = tracks.popleft()
        selected = current
    try:
        client = await ensure_voice()
        _, _, stream = await asyncio.to_thread(extract, selected.lookup)
        def on_end(error):
            if error:
                logging.error("Playback failed: %s", error)
            asyncio.run_coroutine_threadsafe(advance(), bot.loop)
        client.play(discord.FFmpegPCMAudio(stream, **FFMPEG_OPTIONS), after=on_end)
    except Exception:
        logging.exception("Skipping unplayable track")
        await advance()

async def add_track(query, requester):
    item = await resolve(query, requester)
    async with lock:
        if len(tracks) >= 100:
            raise ValueError("Queue is full")
        tracks.append(item)
        start = current is None
    if start:
        await advance()
    return item

async def skip_track():
    if voice and (voice.is_playing() or voice.is_paused()):
        voice.stop()
    else:
        await advance()

async def stop_all():
    global current
    async with lock:
        tracks.clear()
        current = None
    if voice:
        # Stopping may invoke the after-callback; queue is cleared.
        if voice.is_playing() or voice.is_paused():
            voice.stop()
        await voice.disconnect(force=True)

def snapshot():
    return {"online": bot.is_ready(), "connected": bool(voice and voice.is_connected()),
            "paused": bool(voice and voice.is_paused()),
            "now": current.title if current else None,
            "queue": [s.title for s in tracks]}

async def send_queue(interaction):
    state = snapshot()
    lines = [f"Now: {state['now'] or 'Nothing playing'}"]
    lines += [f"{i}. {title}" for i, title in enumerate(state["queue"][:20], 1)]
    await interaction.response.send_message("\n".join(lines), ephemeral=True)

class PlayerControls(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)
    @discord.ui.button(label="Skip", emoji="⏭️", custom_id="music:skip")
    async def skip(self, interaction: discord.Interaction, button: discord.ui.Button):
        await skip_track()
        await interaction.response.send_message("Skipped.", ephemeral=True)
    @discord.ui.button(label="Queue", emoji="📜", custom_id="music:queue")
    async def queue_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        await send_queue(interaction)
    @discord.ui.button(label="Stop", emoji="⏹️", custom_id="music:stop")
    async def stop_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        await stop_all()
        await interaction.response.send_message("Stopped.", ephemeral=True)

@bot.event
async def on_ready():
    logging.info("Discord online as %s", bot.user)

@bot.tree.command(name="play", description="Play YouTube, SoundCloud, Spotify track or search", guild=GUILD)
@app_commands.describe(query="Song name or URL")
async def play(interaction: discord.Interaction, query: str):
    await interaction.response.defer(ephemeral=True)
    try:
        item = await add_track(query, interaction.user.display_name)
        await interaction.followup.send("Queued: " + item.title, view=PlayerControls(), ephemeral=True)
    except Exception as error:
        await interaction.followup.send("Failed: " + str(error)[:170], ephemeral=True)

@bot.tree.command(name="skip", description="Play next song", guild=GUILD)
async def skip(interaction: discord.Interaction):
    await skip_track()
    await interaction.response.send_message("Skipped.", ephemeral=True)

@bot.tree.command(name="stop", description="Stop and disconnect", guild=GUILD)
async def stop(interaction: discord.Interaction):
    await stop_all()
    await interaction.response.send_message("Stopped.", ephemeral=True)

@bot.tree.command(name="queue", description="Show the current queue", guild=GUILD)
async def queue(interaction: discord.Interaction):
    await send_queue(interaction)

@bot.event
async def setup_hook():
    bot.add_view(PlayerControls())
    await bot.tree.sync(guild=GUILD)

def authenticate(key):
    import hmac
    if not key or not hmac.compare_digest(key, CONTROL_KEY):
        raise HTTPException(401, "Unauthorized")
class PlayRequest(BaseModel):
    query: str

@api.get("/health")
async def health():
    return {"ready": bot.is_ready()}
@api.get("/api/state")
async def state(x_control_key: str = Header(default="")):
    authenticate(x_control_key)
    return snapshot()
@api.post("/api/play")
async def web_play(item: PlayRequest, x_control_key: str = Header(default="")):
    authenticate(x_control_key)
    if not item.query.strip() or len(item.query) > 500:
        raise HTTPException(400, "Invalid query")
    try:
        result = await add_track(item.query.strip(), "Website")
        return {"queued": result.title}
    except Exception as exc:
        raise HTTPException(400, str(exc)[:150])
@api.post("/api/{action}")
async def web_command(action: str, x_control_key: str = Header(default="")):
    authenticate(x_control_key)
    if action == "skip":
        await skip_track()
    elif action == "stop":
        await stop_all()
    elif action == "pause" and voice and voice.is_playing():
        voice.pause()
    elif action == "resume" and voice and voice.is_paused():
        voice.resume()
    else:
        raise HTTPException(400, "Unsupported action")
    return snapshot()

@api.get("/", response_class=HTMLResponse)
async def page():
    return PAGE

PAGE = """<!doctype html><html lang="en"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Private Music</title><style>
body{font:16px system-ui;background:#15171c;color:#eef2fa;max-width:620px;margin:6vh auto;padding:18px}
input,button{font:inherit;border:0;border-radius:9px;padding:12px}input{background:#282c35;color:white;box-sizing:border-box;width:100%}
button{background:#5865f2;color:white;cursor:pointer;margin:5px 3px 5px 0}
section{background:#20232c;border-radius:16px;padding:24px}li{padding:7px}small{color:#aab0c0}
</style><section><h1>♫ Private Music</h1><small>Controls your Discord voice bot</small>
<p><input id="key" type="password" placeholder="Private control key" autocomplete="off"></p>
<p><input id="query" placeholder="YouTube, SoundCloud, Spotify track, or song title"></p>
<button onclick="play()">▶ Play</button><button onclick="cmd('skip')">⏭ Skip</button>
<button onclick="cmd('pause')">⏸ Pause</button><button onclick="cmd('resume')">▶ Resume</button>
<button onclick="cmd('stop')">⏹ Stop</button>
<h3>Now playing</h3><p id="now">Not connected</p><h3>Queue</h3><ol id="queue"></ol>
<p id="message"></p></section><script>
const key=document.getElementById('key');key.value=sessionStorage.getItem('controlKey')||'';
async function request(path,body){sessionStorage.setItem('controlKey',key.value);let r=await fetch('/api/'+path,{
method:body===undefined?'GET':'POST',headers:{'X-Control-Key':key.value,'Content-Type':'application/json'},
body:body===undefined?undefined:JSON.stringify(body)});let data=await r.json();if(!r.ok)throw Error(data.detail||'Request failed');return data}
async function refresh(){if(!key.value)return;try{let s=await request('state');document.getElementById('now').textContent=s.now||'Nothing playing';document.getElementById('queue').replaceChildren(...s.queue.map(t=>{let li=document.createElement('li');li.textContent=t;return li}))}catch(e){document.getElementById('message').textContent=e.message}}
async function play(){try{let r=await request('play',{query:document.getElementById('query').value});document.getElementById('message').textContent=r.queued;refresh()}catch(e){document.getElementById('message').textContent=e.message}}
async function cmd(action){try{await request(action,{});refresh()}catch(e){document.getElementById('message').textContent=e.message}}
setInterval(refresh,5000);refresh();
</script></html>"""

async def main():
    config = uvicorn.Config(api, host="0.0.0.0", port=PORT, log_level="info")
    server = uvicorn.Server(config)
    await asyncio.gather(bot.start(TOKEN), server.serve())

if __name__ == "__main__":
    asyncio.run(main())
