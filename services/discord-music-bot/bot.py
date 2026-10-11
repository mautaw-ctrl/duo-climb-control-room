import asyncio
import logging
import os
import re
import time
from collections import deque
from dataclasses import dataclass, field
from uuid import uuid4

import discord
from discord import app_commands
from discord.ext import commands
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import uvicorn
import yt_dlp

logging.basicConfig(level=logging.INFO)
TOKEN = os.environ["DISCORD_TOKEN"]
GUILD_ID = int(os.environ["GUILD_ID"])
CONTROL_KEY = os.environ["CONTROL_KEY"]
PORT = int(os.getenv("PORT", "8080"))
if len(CONTROL_KEY) != 4:
    raise RuntimeError("CONTROL_KEY must be exactly 4 characters; set it in Railway Variables")
GUILD = discord.Object(id=GUILD_ID)
intents = discord.Intents.default()
bot = commands.Bot(command_prefix="!", intents=intents)
api = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
tracks = deque()
current = None
voice = None
lock = asyncio.Lock()
YDL_OPTIONS = {"format": "bestaudio/best", "quiet": True, "noplaylist": True,
               "default_search": "ytsearch1", "socket_timeout": 20,
               "retries": 2, "extractor_retries": 2,
               # These YouTube clients currently work without a separately supplied PO token.
               "extractor_args": {"youtube": {"player_client": ["android_vr", "web_embedded"]}}}
FFMPEG_OPTIONS = {"before_options": "-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5",
                  "options": "-vn"}

@dataclass
class Track:
    title: str
    lookup: str
    requester: str
    stream_url: str = ""
    resolved_at: float = 0.0
    id: str = field(default_factory=lambda: uuid4().hex)

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
    try:
        with yt_dlp.YoutubeDL(YDL_OPTIONS) as ydl:
            result = ydl.extract_info(query, download=False)
        if "entries" in result:
            result = next((entry for entry in result["entries"] if entry), None)
        if not result:
            raise ValueError("No playable result")
        return result["title"], result["webpage_url"], result["url"]
    except yt_dlp.utils.DownloadError as exc:
        detail = str(exc).lower()
        if "confirm you're not a bot" in detail or "confirm you’re not a bot" in detail:
            raise ValueError("YouTube is blocking the bot's Railway server. Try a SoundCloud link while YouTube access is investigated.") from None
        raise

async def resolve(query, requester):
    if "open.spotify.com/" in query:
        query = await asyncio.to_thread(spotify_lookup, query)
    title, url, stream = await asyncio.to_thread(extract, query)
    return Track(title[:160], url, requester, stream, time.monotonic())

async def ensure_voice(channel=None):
    """Join the requester's voice channel, or reuse the current connection.

    VOICE_CHANNEL_ID is optional and only helps the website start playback
    before anyone has used /play in Discord.
    """
    global voice
    guild = bot.get_guild(GUILD_ID)
    if not guild:
        raise ValueError("Bot is not in the configured Discord server")

    active = guild.voice_client
    if channel is None and active and active.is_connected():
        channel = active.channel
    if channel is None:
        fallback = os.getenv("VOICE_CHANNEL_ID")
        if fallback:
            channel = guild.get_channel(int(fallback))
    if not isinstance(channel, discord.VoiceChannel) or channel.guild.id != GUILD_ID:
        raise ValueError("Join a voice channel and use /play in Discord first.")

    if active and active.is_connected():
        voice = active
        if active.channel.id != channel.id:
            await active.move_to(channel)
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
        # Reusing a fresh resolved audio URL avoids making two back-to-back
        # YouTube requests for every /play. Refresh it for older queued songs.
        stream = selected.stream_url
        if not stream or time.monotonic() - selected.resolved_at > 15 * 60:
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
            "queue": [s.title for s in tracks],
            "items": [{"id": s.id, "title": s.title, "requester": s.requester} for s in tracks]}

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
        user_voice = getattr(interaction.user, "voice", None)
        channel = user_voice.channel if user_voice else None
        if not isinstance(channel, discord.VoiceChannel):
            raise ValueError("Join a voice channel first, then use /play again.")
        # Follow the requester, including when music is already playing elsewhere.
        await ensure_voice(channel)
        item = await add_track(query, interaction.user.display_name)
        await interaction.followup.send(
            "Queued: " + item.title + " | Playing in " + channel.name,
            view=PlayerControls(), ephemeral=True
        )
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

# Short PINs require brute-force protection. This is an in-memory safeguard,
# not a substitute for Cloudflare Access or other website-level authentication.
auth_failures = {}
all_auth_failures = deque()
AUTH_WINDOW = 15 * 60

def authenticate(key, request: Request):
    import hmac
    now = time.monotonic()
    client = request.client.host if request.client else "unknown"
    while all_auth_failures and now - all_auth_failures[0] > AUTH_WINDOW:
        all_auth_failures.popleft()
    failures = auth_failures.setdefault(client, deque())
    while failures and now - failures[0] > AUTH_WINDOW:
        failures.popleft()
    if len(failures) >= 5 or len(all_auth_failures) >= 30:
        raise HTTPException(429, "Too many invalid PIN attempts. Try again later.")
    if not key or not hmac.compare_digest(key, CONTROL_KEY):
        failures.append(now)
        all_auth_failures.append(now)
        raise HTTPException(401, "Invalid PIN")

class PlayRequest(BaseModel):
    query: str

class QueueEdit(BaseModel):
    id: str
    before_id: str | None = None

@api.post("/api/queue/{action}")
async def edit_queue(action: str, item: QueueEdit, request: Request,
                     x_control_key: str = Header(default="")):
    authenticate(x_control_key, request)
    async with lock:
        selected = next((track for track in tracks if track.id == item.id), None)
        if selected is None:
            raise HTTPException(409, "That song has already started or left the queue. Queue refreshed.")
        if action == "remove":
            tracks.remove(selected)
        elif action == "move":
            if item.before_id == item.id:
                return snapshot()
            target = next((track for track in tracks if track.id == item.before_id), None)
            if item.before_id is not None and target is None:
                raise HTTPException(409, "The destination song has left the queue. Try again.")
            tracks.remove(selected)
            if target is None:
                tracks.append(selected)
            else:
                tracks.insert(tracks.index(target), selected)
        else:
            raise HTTPException(400, "Unsupported queue action")
        return snapshot()

@api.get("/health")
async def health():
    return {"ready": bot.is_ready()}
@api.get("/api/state")
async def state(request: Request, x_control_key: str = Header(default="")):
    authenticate(x_control_key, request)
    return snapshot()
@api.post("/api/play")
async def web_play(item: PlayRequest, request: Request, x_control_key: str = Header(default="")):
    authenticate(x_control_key, request)
    if not item.query.strip() or len(item.query) > 500:
        raise HTTPException(400, "Invalid query")
    # The web interface has no Discord member voice state. When there is no
    # connected bot or optional fallback channel, a slash /play must go first.
    if not (voice and voice.is_connected()) and not os.getenv("VOICE_CHANNEL_ID"):
        raise HTTPException(409, "Use /play from a Discord voice channel first.")
    try:
        result = await add_track(item.query.strip(), "Website")
        return {"queued": result.title}
    except Exception as exc:
        raise HTTPException(400, str(exc)[:150])
@api.post("/api/{action}")
async def web_command(action: str, request: Request, x_control_key: str = Header(default="")):
    authenticate(x_control_key, request)
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

PAGE = r"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Spillemand · Music queue</title><style>
:root{color-scheme:dark}*{box-sizing:border-box}body{font:16px system-ui;background:#101217;color:#eef2fa;max-width:820px;margin:4vh auto;padding:18px}section{background:#1c202a;border:1px solid #303644;border-radius:20px;padding:clamp(18px,4vw,32px)}h1{margin:0 0 4px}h2{font-size:18px}small,.muted{color:#adb7cc}input,textarea,button{font:inherit;border:1px solid #414a60;border-radius:9px;padding:11px}input,textarea{background:#121620;color:white;width:100%}textarea{resize:vertical;min-height:100px}button{background:#30394d;color:white;cursor:pointer}button:hover{background:#424e68}button:disabled{opacity:.4;cursor:default}button:focus-visible,input:focus-visible,textarea:focus-visible{outline:2px solid #93adff;outline-offset:3px}.primary{background:#5865f2}.toolbar{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.pin{max-width:210px;margin:18px 0}.dropzone{border:2px dashed #49546a;border-radius:12px;padding:15px}.over{border-color:#97b0ff!important;background:#29344a!important}.hint{display:block;margin:7px 0 0;font-size:13px}.playing{background:#141923;border-left:3px solid #869dff;padding:14px;border-radius:7px}ol{list-style:none;padding:0;min-height:64px;border:2px dashed transparent;border-radius:10px}li{display:flex;align-items:center;gap:10px;padding:11px 8px;margin:6px 0;background:#262c39;border:2px solid transparent;border-radius:10px}.song{flex:1;min-width:0;overflow-wrap:anywhere}.song small{display:block;font-size:12px;margin-top:4px}.handle{cursor:grab;letter-spacing:-2px}.actions{display:flex;gap:4px}.actions button{padding:6px 9px}.remove{color:#ffb5c2}.dragging{opacity:.4}.empty{padding:18px;color:#adb7cc}.count{color:#adb7cc;font-weight:400}#message{white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px}header small{display:block}@media(max-width:520px){body{padding:8px}li{gap:6px}.actions button{padding:6px}.handle{padding:6px}}

/* Matrix backdrop: isolated from player interactions. */
body{background:#020906;max-width:880px;isolation:isolate;margin:5vh auto;color:#e4ffef}
#matrix{position:fixed;inset:0;width:100%;height:100%;z-index:-2;pointer-events:none}
body:before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse at center,transparent 25%,#010604aa 100%),repeating-linear-gradient(0deg,transparent 0 3px,#00000016 3px 4px)}
section{background:linear-gradient(145deg,#06150feF,#07110fed);border:1px solid #2e78594d;box-shadow:0 24px 100px #000b,0 0 45px #2eff8710;border-radius:20px}
header{border-bottom:1px solid #63ffa52b;padding-bottom:20px;margin-bottom:18px}h1{font-size:clamp(28px,5vw,40px);letter-spacing:-1px;text-shadow:0 0 25px #42ff8c55}h2{color:#b8ffd3}small,.muted,.count,.empty{color:#a2bfaf}input,textarea{background:#031009;border-color:#315340}button{background:#152c20;border-color:#365b45}button:hover{background:#254a34}.primary{background:#226d43;border-color:#53d288}.primary:hover{background:#2b8653}.playing{background:#031109;border-color:#68ffad;box-shadow:inset 0 0 22px #49ff9208}li{background:#0c2016}.dropzone{border-color:#315e43}.over{border-color:#8bffc0!important;background:#173d29!important}button:focus-visible,input:focus-visible,textarea:focus-visible{outline-color:#97ffbd}
.fxbar{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 16px;font:11px ui-monospace,monospace;letter-spacing:2px;color:#88cca3}.fxbar button{font:11px ui-monospace,monospace;padding:7px 10px;letter-spacing:0}.fxbar span:before{content:"●";color:#73ffb0;margin-right:8px;text-shadow:0 0 12px #73ffb0}
@media(min-width:1300px){body{margin-top:10vh}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
</style></head><body><canvas id="matrix" aria-hidden="true"></canvas><section><div class="fxbar"><span>SPILLEMAND / MATRIX RADIO</span><button id="fx-toggle" type="button" aria-pressed="true">Pause background</button></div><header><h1>♫ Spillemand</h1><small>Your Discord music queue · <span id="status">Enter your PIN to connect</span></small></header>
<div class="pin"><label for="key">4-character PIN</label><input id="key" type="password" maxlength="4" autocomplete="off"></div>
<div id="dropzone" class="dropzone"><label for="query">Add music</label><textarea id="query" placeholder="Paste links here — one per line — or enter a song title"></textarea><small class="hint">Drop Spotify track, YouTube or SoundCloud links here or onto the queue. Up to 50 at once.</small><div class="toolbar"><button id="add" class="primary">＋ Add to queue</button></div><small id="progress" role="status"></small></div>
<h2>Now playing</h2><div class="playing" id="now">Nothing playing</div>
<div class="toolbar" id="controls"><button data-action="pause">⏸ Pause</button><button data-action="resume">▶ Resume</button><button data-action="skip">⏭ Skip</button><button data-action="stop">⏹ Stop</button></div>
<h2>Up next <span class="count" id="count"></span></h2><small>Drag a song to move it, or use the arrows. × removes it immediately.</small><ol id="queue" aria-label="Upcoming songs"></ol><p id="message" role="status" aria-live="polite"></p>
</section><script>
const $=id=>document.getElementById(id),key=$('key'),queue=$('queue');
key.value=sessionStorage.getItem('controlKey')||'';
let items=[],dragId=null,editing=false,importing=false,refreshing=false,version=0,authBlocked=false;
function message(text){$('message').textContent=text}
async function request(path,body){
 if(key.value.length!==4)throw Error('Enter your 4-character PIN first.');
 sessionStorage.setItem('controlKey',key.value);
 const r=await fetch('/api/'+path,{method:body===undefined?'GET':'POST',headers:{'X-Control-Key':key.value,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 let data;try{data=await r.json()}catch{throw Error('Server unavailable. Try again shortly.')}
 if(!r.ok){if(r.status===401||r.status===429)authBlocked=true;throw Error(typeof data.detail==='string'?data.detail:'Request failed')}
 return data;
}
function button(label,title,fn,disabled=false){const b=document.createElement('button');b.textContent=label;b.title=title;b.setAttribute('aria-label',title);b.disabled=disabled;b.onclick=fn;return b}
function render(s){
 items=s.items||[];$('now').textContent=s.now||'Nothing playing';$('status').textContent=!s.online?'Bot offline':s.connected?(s.paused?'Paused':'Connected to Discord'):'Ready · use /play in a Discord voice channel first';$('count').textContent='('+items.length+'/100)';
 queue.replaceChildren();if(!items.length){const empty=document.createElement('div');empty.className='empty';empty.textContent='Queue empty — drop links here to add music.';queue.append(empty)}
 items.forEach((t,i)=>{
  const li=document.createElement('li');li.dataset.id=t.id;li.draggable=true;
  const handle=document.createElement('span');handle.className='handle';handle.textContent='⠿';handle.title='Drag to reorder';
  const song=document.createElement('div');song.className='song';song.textContent=(i+1)+'. '+t.title;const by=document.createElement('small');by.textContent=t.requester;song.append(by);
  const actions=document.createElement('div');actions.className='actions';
  const remove=button('×','Remove '+t.title,()=>edit('remove',t.id));remove.className='remove';
  actions.append(button('↑','Move '+t.title+' up',()=>edit('move',t.id,items[i-1].id),i===0),button('↓','Move '+t.title+' down',()=>edit('move',t.id,items[i+2]?.id||null),i===items.length-1),remove);li.append(handle,song,actions);
  li.ondragstart=e=>{if(editing){e.preventDefault();return}dragId=t.id;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('application/x-spillemand-track',t.id);li.classList.add('dragging')};
  li.ondragend=()=>{dragId=null;document.querySelectorAll('.over,.dragging').forEach(el=>el.classList.remove('over','dragging'));refresh()};
  li.ondragover=e=>{e.preventDefault();if(dragId){e.stopPropagation();li.classList.add('over');e.dataTransfer.dropEffect='move'}};
  li.ondragleave=()=>li.classList.remove('over');
  li.ondrop=e=>{if(!dragId)return;e.preventDefault();e.stopPropagation();const id=dragId;dragId=null;li.classList.remove('over');edit('move',id,t.id)};queue.append(li);
 });
}
async function refresh(){if(key.value.length!==4||authBlocked||dragId||editing||refreshing)return;refreshing=true;const v=version;try{const s=await request('state');if(v===version&&!dragId&&!editing)render(s)}catch(e){message(e.message)}finally{refreshing=false}}
async function edit(action,id,before_id=null){if(editing)return;editing=true;version++;try{render(await request('queue/'+action,{id,before_id}));message(action==='remove'?'Song removed.':'Queue updated.')}catch(e){message(e.message)}finally{editing=false;refresh()}}
function parseEntries(text){return text.split(/\r?\n/).flatMap(line=>{const links=line.match(/https?:\/\/[^\s<>"']+/g);return links?links.map(s=>s.replace(/[),;]+$/,'')):(line.trim()?[line.trim()]:[])})}
async function addMusic(text,fromInput=false){
 if(importing){message('An import is already running. Wait for it to finish.');return}
 const entries=parseEntries(text);if(!entries.length){message('Paste a link or song title first.');return}if(entries.length>50){message('Add up to 50 links at a time.');return}
 if(key.value.length!==4){message('Enter your 4-character PIN first.');return}
 importing=true;$('add').disabled=true;let added=0,failed=[];
 try{for(let i=0;i<entries.length;i++){$('progress').textContent='Adding '+(i+1)+' of '+entries.length+'…';try{await request('play',{query:entries[i]});added++}catch(e){failed.push(entries[i]+' — '+e.message);if(authBlocked){failed.push(...entries.slice(i+1).map(x=>x+' — not attempted'));break}}await refresh()}
 if(fromInput&&$('query').value===text&&failed.length===0)$('query').value='';
 message(failed.length?'Could not add:\n'+failed.join('\n'):'All songs added.');
 }finally{importing=false;$('add').disabled=false;$('progress').textContent=added+' added'+(failed.length?' · '+failed.length+' failed or not attempted':'');refresh()}
}
for(const zone of [$('dropzone'),queue]){
 zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('over');e.dataTransfer.dropEffect=dragId?'move':'copy'});
 zone.addEventListener('dragleave',e=>{if(!zone.contains(e.relatedTarget))zone.classList.remove('over')});
 zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('over');if(dragId){const id=dragId;dragId=null;edit('move',id,null);return}const uri=e.dataTransfer.getData('text/uri-list');const text=uri?uri.split(/\r?\n/).filter(l=>!l.startsWith('#')).join('\n'):e.dataTransfer.getData('text/plain');if(!text){message('Drop a music link, not a file.');return}addMusic(text)});
}
$('add').onclick=()=>addMusic($('query').value,true);
$('query').onkeydown=e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();addMusic($('query').value,true)}};
$('controls').onclick=async e=>{const action=e.target.dataset.action;if(!action)return;version++;try{await request(action,{});message(action==='stop'?'Playback stopped and queue cleared.':'Playback updated.');refresh()}catch(err){message(err.message)}};
key.oninput=()=>{authBlocked=false;version++;if(key.value.length===4)refresh()};setInterval(refresh,3000);refresh();

// Cached artwork + bounded canvas rain; no timers or DOM nodes per glyph.
(()=>{
 const canvas=document.getElementById('matrix'),ctx=canvas.getContext('2d');if(!ctx)return;
 const art="⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⡀⠀⡀⠀⠀⢀⠀⢀⢀⣀⢀⣀⢀⡀⡀⡀⡀⡀⡀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⢷⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠞⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⠆⣜⠈⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⢀⣀⢀⣀⢀⡀⡀⡀⡀⡀⡀⠀⠀⠀⠀⠀\n⠀⠀⠀⣹⡏⠀⠀⣀⣀⣀⣀⣀⣀⢀⣀⡀⣀⣀⢀⣀⢀⡀⡀⣀⡀⠀⢘⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣷⡻⣿⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢔⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⡾⢅⡴⠋⢀⢀⠀⠈⠑⢆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⡎⠀⠀⠀⢀⣀⣀⣀⣀⢀⣀⡀⢀⣀⢀⣀⡀⠀⠀⠀⠻⣆⡀⠀⠀\n⠀⠀⠀⣿⡇⠀⠀⠨⡏⢨⣯⡏⣿⠘⢗⡅⠁⡇⢹⢿⢸⠻⡇⡯⣿⠀⠘⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡠⠤⠲⠒⣖⣂⠤⢄⠀⢠⣿⠉⢻⣿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣅⠀⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡼⠋⠀⠁⠁⢴⠿⢿⣿⣿⡀⠈⢣⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⡇⠀⠈⠀⠀⢸⠀⣷⢿⢸⢷⡇⢀⡇⢸⣈⡀⠀⠀⠀⢸⡟⠀⠀⠀\n⠀⠀⠀⠿⠇⠀⠀⠘⠃⠈⠀⠁⠙⠈⠋⠃⠀⠁⠈⠈⠈⠀⠃⠃⠉⠀⠘⠇⠀⠀⠀⠀⠀⠈⠛⠛⠣⢄⠟⠀⡤⠘⣿⣿⠂⠈⠀⣸⡟⠀⢘⢿⣿⣇⢀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⡇⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠟⠀⠀⠀⢀⠠⡀⡀⣸⡇⠈⠉⠀⠘⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠷⠄⠀⠀⠀⠈⠀⠁⠘⠘⠃⠃⠘⠁⠈⠛⠁⠀⠀⠀⢾⠋⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⢁⣑⣁⣁⣉⠉⠀⠀⢀⠦⡀⠈⣀⣉⣁⣁⣑⣁⡁⡁⠀⠀⠀⠀⠀⠀⠀⣀⡤⠔⠖⢄⢑⣀⣠⣤⣬⣨⣈⣂⡂⠛⠊⠀⢐⢕⣿⣿⡄⠄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⠐⠀⠀⠁⣠⡿⣺⣻⡀⠘⠂⠀⠀⠀⠐⠀⠀⠀⣒⡀⠀⠀⠀⠀⠀⠀⠀⣀⠔⠁⠐⠀⠀⢠⣾⣿⣿⣾⠛⠛⣲⣶⠄⢀⢱⠀⠀⠀⠀⠠⢠⡷⡀⠀⠀⠀⠀⠀⠐⢑⢁⣁⣉⣉⡀⠀⠈⡢⡀⠀⠀⢉⣁⣁⣑⢁⠁⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠁⠉⠉⠉⠀⠹⣰⠃⠀⠉⠉⠁⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡞⠁⣠⣖⣿⣷⣿⣿⣿⣿⣿⣿⡟⣟⢳⡖⢠⣄⣀⢐⠟⢿⡗⠀⠀⠀⠀⠀⠀⠀⣀⣴⠀⠀⠀⠀⠀⢀⡀⠀⣿⡷⣿⢺⣷⠀⢀⠀⠀⠀⠀⠀⠀⠀⠛⠁⠀⠀⣀⣠⡦⡶⠎⠁⠀⠀⠀⠀⢀⢸⣿⣿⣿⡿⡺⢲⣾⣷⠀⠀⠈⢀⠀⠀⠀⢀⣿⣧⢻⣆⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠋⠀⠈⢣⠊⠀⠘⠋⠁⠁⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢅⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠄⠄⡜⢠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⢿⣇⠹⣌⠿⣌⡹⠿⣾⣦⠨⣥⡀⣀⠀⢄⢀⠀⠀⠉⠉⠀⠀⠀⠀⠀⠈⠁⡀⢸⢇⢟⢼⠍⠀⠈⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⠟⢉⢤⠄⠂⠀⠀⠀⠀⠰⣿⣿⣿⣿⣿⣷⢗⠛⣽⡿⠀⠀⠀⠈⠢⠀⢀⣾⣿⢿⣼⢝⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⣰⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠠⠀⠀⠀⠂⠀⠉⢠⠴⠂⠟⠐⢦⡄⠀⠀⠀⠀⠀⠀⠀⢀⡞⣁⠶⢀⣽⣿⣿⣿⣿⣿⢿⣯⣿⡿⢛⣍⠭⠕⠀⠉⠱⠾⣭⠻⠈⠉⠠⠀⠹⡶⠔⢄⠂⠑⠄⠀⠀⠀⠀⣨⡠⠀⠀⠀⠀⠀⢱⢵⠝⠀⠀⠀⠀⠀⠀⡀⣆⡀⠀⢀⠀⡼⢁⠔⠁⠀⠀⠀⠀⠈⠠⠠⠀⠨⡽⣿⣿⠿⠿⠿⠿⠿⠭⠉⠀⢤⣈⡀⠀⢸⠍⢸⡅⡇⡟⠵⡅⠀⠀⢠⡠⠀⠈⠀⢀⠁⠀⣴⠗⣷⡄⠀⠀⠀⠁⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡞⢠⣶⡗⣦⡈⢳⠀⠀⠀⠀⣄⠀⠀⢾⠇⢁⣴⣿⣿⣿⣿⣿⣯⣾⣿⣿⠋⡈⠉⢠⣴⢀⣷⡄⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣵⡄⡌⠁⣦⠀⠀⠈⠀⠀⠀⠀⠀⠀⠀⡿⠀⠀⠀⠀⠀⠀⠀⠀⠏⠀⠀⠀⣸⡟⠁⠀⠀⠀⠀⠀⠀⠀⢀⢠⡄⢸⣿⣄⡁⠀⠀⠀⠀⠀⠀⢀⡎⠈⣮⢹⣷⣦⣄⣈⡇⡇⡇⠀⠁⠀⢀⣿⣧⠀⠀⠀⠀⠁⢰⠉⣴⢹⡇⠐⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⢀⠀⠀⠀⠀⠀⢰⡂⢺⡃⠶⢸⡇⣴⡂⠀⠀⠀⠈⠒⠶⠶⠾⢟⣿⣾⣻⣟⣣⣆⣿⣿⢿⠃⢀⡇⠀⡀⣨⣾⣿⣿⣸⠀⣄⠀⡤⢀⠀⠀⠀⣀⠀⡨⡚⠠⣻⡀⠃⠀⠀⠀⠀⠀⠀⠀⠀⢸⠀⡂⠰⠀⠀⠀⠀⠀⠀⠀⢀⣀⡴⠊⠁⡀⠀⢀⡠⠀⠀⣀⢤⠔⢋⠁⠀⢘⣿⣿⣧⣦⡀⠀⠀⠀⢀⠞⢀⠀⢘⣶⢘⣿⡻⣿⣶⣤⣃⣀⠀⢀⣾⣿⣙⡆⠀⠀⠀⣤⠘⣆⠀⣻⡇⣤⡄⠀⠀⢀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⢀⠀⠀⠀⠀⠀⠀⠻⣄⠁⣮⠉⡰⠋⠀⠀⠀⠀⠀⠀⠀⠒⢠⣾⣿⣲⣻⣾⣻⣿⢻⠏⢀⣴⣿⣷⣶⣿⣿⠛⣻⣿⡇⣺⣎⢉⢈⢁⠀⠒⢄⠀⠀⠀⠂⠂⠨⢨⣷⡄⠀⠀⠀⠀⠀⠀⠀⢸⠀⡊⠠⠀⠀⠀⠀⢀⡴⠚⢁⣀⠔⠒⢀⡠⠚⠋⣀⡠⠚⠁⠀⠐⠀⠐⠀⢐⣿⡺⣿⡻⡂⣠⡢⠂⣟⠁⠐⠀⠀⢹⣿⣿⣭⣈⡊⡛⣢⡈⠙⠶⣁⠕⢀⠇⠄⠀⠀⠈⠢⠸⡠⡟⠰⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⣼⡏⣿⣿⣿⣿⣿⠇⠃⣠⢰⡿⣿⣿⣿⡿⠃⠀⣿⣿⣧⣿⣿⣷⣵⢸⠇⠀⠈⠂⠀⠀⠀⠀⠀⣾⣿⣷⠀⠀⠀⠀⠀⠀⠀⠘⠀⠆⠘⠀⠀⠀⠀⠎⢀⣴⠟⠁⠀⠀⣡⣴⣶⠾⠏⠀⠀⠀⠀⠀⠀⠀⠀⠈⣿⡇⠺⠆⣾⠿⠀⢠⡇⠀⠀⠀⠀⠀⢻⣿⣿⢿⠏⣾⣿⣿⣷⣶⣤⡱⡶⡄⠀⠀⠀⠀⠀⠀⢸⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠤⠄⠀⠀⠀⠀⠀⠀⠀⠀⢄⠀⠅⠀⠀⠀⣠⣤⡶⠪⠋⠉⡟⢉⣿⣿⣿⣿⣿⠠⡀⣠⣾⣯⣫⡸⣯⠗⠁⢸⣿⣿⡟⢹⡻⢿⡿⠪⠨⠀⠀⠀⢁⣅⢄⠄⠄⠝⣽⠏⠀⠠⠀⡀⠀⠀⠀⠐⠀⢅⠀⠀⠀⠀⠀⡠⠊⣀⣤⣶⣾⣿⣿⠟⠉⢄⠔⠁⠀⠀⠀⠠⠀⠀⡠⡫⢸⣷⡵⠞⣉⣤⣴⣾⠄⠀⠀⠀⠀⠀⠈⠉⠛⢭⣾⣿⣿⣽⣿⡿⣿⣿⣶⣦⣀⠀⠀⠀⠀⠅⠀⠆⠄⠀⠀⠀⠀⠀⠠⠤⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠠⠀⠀⠀⠀⠀⠀⠀⠀⠀⠁⠀⠁⠀⢀⣾⡫⣡⡠⡈⡉⠀⠁⢘⣿⠅⣿⣿⣷⠀⠺⣿⣿⢟⣋⠈⠉⠰⣣⣿⣿⠟⠁⠿⣯⡯⠣⠈⠀⠀⢀⣶⣿⢿⠕⠅⢁⠍⠁⠀⢀⣾⡎⠀⠀⠀⠀⠀⠁⠅⠀⠁⠀⣴⠋⢠⣾⣿⠿⠿⠿⣿⠁⠀⠀⠁⠀⠀⠀⠀⠀⡠⣨⣢⡉⡩⠉⣡⣶⣿⣿⣿⣿⣿⠁⠈⠈⠈⠈⠀⠀⠀⠀⢼⣿⡟⢕⣿⣿⣯⡮⠩⠻⡿⣿⣷⣄⠀⠀⠁⠀⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⠃⠀⠀⠀⠀⡇⠀⠀⢀⣾⣿⣿⣿⣿⣿⣷⣆⣀⠀⡇⡇⡿⣿⣿⡀⠈⠘⢏⢿⣿⣿⣶⣾⣿⡿⠋⣰⣷⠀⠈⠉⢀⣰⢶⠿⣿⣿⡿⠋⣡⠰⠃⠀⠀⠀⣼⣟⣿⡀⠄⠀⠀⠀⠀⢀⠀⠀⠀⠁⢀⣾⣿⠋⠀⠀⠀⠈⢦⠀⠀⠀⠀⠀⠀⢀⣘⣿⣿⣿⣿⣱⣾⣿⣻⣿⣿⣿⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⣹⡿⣱⣿⣿⠟⠛⢿⣿⣾⣈⠙⠻⢿⣧⡰⠀⠀⡇⠀⠀⠀⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣶⡀⠀⠂⠀⠀⡜⢋⣤⣴⣤⢍⡙⠻⢿⣿⣂⡁⠀⠡⠘⣿⣇⢔⣄⣐⡀⠀⠀⠈⠈⠤⣀⠊⡉⠳⡶⠛⢒⣈⣑⠀⠑⣙⠛⡠⠂⠁⠀⡀⠀⠐⢒⢿⢗⢘⡗⢐⣀⠀⠈⠐⠺⠂⠂⠂⣀⣾⡟⢁⢐⠀⣀⢤⣾⣮⠂⠀⠂⡀⠀⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⣃⡂⠀⣐⣕⣐⢀⠀⠀⠀⠀⠚⠚⠛⠋⠁⠀⠀⠀⠙⠛⢿⣟⣗⣚⡻⣧⡀⠂⡂⠀⠀⢀⣼⣧⠐⠀⠒⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣘⣯⣿⣆⠂⡀⠀⠀⠀⠀⠁⢁⠁⠀⠀⠀⠈⠻⣮⣂⣂⡠⠀⠊⠉⠀⠁⠠⠒⢱⣿⣿⡂⠈⠎⠀⠂⣘⠛⢐⣟⣿⣷⣄⠀⠙⠂⡀⡀⠀⣀⡔⣶⣦⣄⣀⡐⠃⠐⠂⠀⠀⠀⡂⠀⠀⠀⣸⠋⠀⠀⢀⣾⡟⣴⣿⣿⡇⠢⠀⠀⣸⣾⣿⣿⣿⣿⣟⣿⣿⣿⣿⣿⣿⡟⣠⡾⠂⣴⣟⠗⢐⠀⢀⠀⠀⠀⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣿⣿⡺⣷⡀⠂⠀⢀⣼⡟⣿⣇⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠔⠉⠁⠉⠁⢺⣪⢺⣻⡎⠈⠛⣀⣠⣷⣿⣿⣷⣄⠈⠁⡀⠀⠈⠉⠀⠀⡴⢒⢷⣟⣷⣦⠀⣼⣿⣿⡋⠀⠊⠀⠀⡷⠂⢀⢁⢖⣿⣿⡗⠀⡀⠀⢀⣾⠏⠀⢘⣗⣿⣿⣿⣷⣄⠁⠀⠐⠂⡊⠀⠂⠠⠃⠀⠐⢰⣿⠟⢐⣿⣿⡿⠀⡀⣱⡀⢺⣿⣿⣿⣿⣟⢑⣿⢹⣿⣿⣻⠋⠊⡉⠊⣸⣟⡅⠁⢐⢔⠁⠀⠀⠀⠀⠈⠊⠂⠀⠀⠀⠀⢑⠐⠀⠀⢀⠈⠛⠿⣮⣻⡆⠀⣸⣟⣅⢿⣿⣇⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⢠⡄⠀⠀⠀⠀⢀⡀⢸⢾⠞⢣⣴⠿⠛⠋⠀⠀⠙⠹⢿⣿⣶⣤⡰⠆⠆⢀⠞⠀⣾⣿⠆⢹⣿⣷⠉⠉⠳⢆⠀⠀⠀⠠⠀⠀⠀⠱⠀⡁⠛⠃⠀⠃⢠⣾⠇⠀⠀⠀⢿⣷⠋⡽⡿⣿⣆⠀⠀⠀⠆⠀⠀⠀⠀⠀⠀⣿⡿⠑⠸⣿⣿⠃⠀⢶⠾⢿⡜⠿⣿⡿⢱⠱⣱⣿⡄⠸⠇⠈⠀⠀⠀⠀⠃⠋⠀⢀⠈⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⢦⠀⠀⠈⠿⣿⡄⣾⠙⠿⢾⡿⠿⡆⠀⠰⠆⠀⠀\n⠀⠀⠀⠀⢫⠋⠂⠀⣠⡾⣿⣿⠝⢁⣴⠟⠁⠤⠄⠀⠂⠂⠠⠄⠀⠈⢿⣿⣷⣄⠐⢬⣀⠀⠉⠉⠀⠈⢫⣋⠀⢠⣄⠈⢧⠀⠀⠁⠀⠠⣤⣾⣿⡿⡿⡿⠐⢀⡾⠁⠄⠀⠀⠀⠀⠩⠈⡨⠨⡨⢻⣧⠰⠄⠅⠀⠀⢐⣤⠎⣾⡿⣯⠪⠂⢻⡏⠀⢰⢅⡱⣽⠿⣄⠩⠌⣨⣴⣿⣿⣿⡶⠄⠄⠅⢄⠔⠁⠀⠀⠠⠨⠠⡀⠀⠀⠀⠀⠀⠀⠄⠀⠀⠀⠀⡠⡦⡠⠀⠀⠈⠸⣇⠀⠀⠄⠈⠃⠹⠄⠀⡯⠠⡾⠁⠈⠀⠀⠀⠀\n⠀⠀⠀⠀⠈⠀⠀⣸⡿⡋⠊⠀⢡⠞⢁⠅⠁⠀⠀⠀⠀⠀⠀⠀⠈⠀⠈⢿⣿⣿⣷⢆⠙⣳⠆⠀⠀⠨⠛⣛⣀⠘⠹⠅⢕⢅⠁⠀⠀⠈⠪⠋⠋⠁⡢⠀⠉⣸⠅⠁⠁⢀⠀⠀⠀⠀⠈⡈⣀⡀⠈⢹⡀⠄⠀⣀⣴⠞⠁⣾⠟⠋⠀⠀⠀⠈⠀⢁⠀⠉⠁⠙⠄⠈⠅⠿⣿⡿⣿⡿⡿⠋⠀⠀⠅⠁⠀⠀⠀⠀⠀⠈⠈⠀⠀⠀⠀⠀⠀⠀⠐⠀⠀⠀⠈⠀⠋⠀⠈⡀⡀⠀⠈⠆⠀⠁⠁⠀⠈⡇⡀⡮⡢⠏⠀⢰⡆⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⣀⣿⣟⢆⠀⢠⡞⠀⠈⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣶⢻⣿⣿⣆⢠⠀⠙⢿⣿⣷⣦⡈⣀⡷⠄⠈⠀⠀⠀⠀⢀⣠⡆⡸⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠁⠙⠁⠀⢀⡁⠠⠻⣳⡻⡁⠀⠁⢀⣄⠀⠀⠀⠀⠀⠀⡇⠀⠀⠀⠈⠀⠀⠀⠘⢟⢟⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⠀⣀⣼⣿⣿⣿⣿⣿⣦⠀⠀⠀⠀⣼⡀⠰⣅⣟⡟⠀⢠⣿⣇⢀⡀⠀\n⠀⢀⣶⣿⣿⣷⣿⣿⣷⣤⠀⣾⠀⠀⡠⡀⠀⠀⠀⠀⠀⠀⢀⢀⠀⠀⠀⠀⠸⣿⡻⣻⡻⡞⣿⣝⣿⣗⣦⠀⠐⣿⡈⠻⣿⣦⢤⣀⠀⠀⠀⠄⠶⢟⠁⠀⠁⠀⠀⠀⡀⠀⠀⢀⣤⣴⣶⣶⣤⡀⠀⠸⢿⡀⠈⠠⠊⠀⠀⢐⠟⢁⠔⢀⠀⠀⠀⠀⠘⡀⡀⠀⠀⠀⠀⠀⠀⢐⠄⢀⣤⣶⡶⡶⣶⣶⣦⣤⡀⠀⠀⠀⢀⠄⠀⠀⠀⠀⠀⠠⡀⠀⠀⠀⠔⢿⣿⣿⣿⣿⣿⣿⣿⣆⠀⡀⠪⡊⢋⡀⢳⡟⠐⣰⣿⣟⣻⠀⠀⠀\n⠀⠘⣿⣿⡟⢟⣟⢅⢑⠀⠈⡗⢢⡀⡈⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡂⠀⡿⡂⣺⡂⡏⢹⣿⣿⣿⣟⣗⠀⢸⡆⠀⢻⣿⡎⣹⣿⣦⣄⠀⠀⢐⢐⠄⠀⠀⠀⣠⣤⣄⣀⣿⣿⣿⣿⣿⣿⣷⠀⠀⣈⣤⣤⡀⠀⠀⢀⡧⠀⠀⠀⠁⠀⠐⠀⠀⠀⠈⠀⠀⠀⠀⠀⠀⢀⣴⠞⢋⡄⠀⡀⢠⡠⡈⠛⣾⡿⢆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠂⠀⠀⠀⢶⡔⢀⢝⢿⣿⣿⣿⣿⣾⣿⣷⣦⣀⠀⢀⠀⠐⠁⢀⣟⢑⣵⡗⠀⠀⠀\n⠀⠀⠉⢿⣅⠀⠉⠈⠀⠀⠀⡇⢸⢁⠀⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣼⡇⠀⡟⠁⠟⠀⠀⢸⠻⡻⠻⡻⠣⠀⠀⠅⠀⢸⢿⠇⠀⠀⠀⢹⡧⠀⠀⠀⠀⠀⣠⣼⣿⣿⣿⣿⣿⣿⣿⣿⣯⣿⣿⣇⠀⠹⠙⠛⠿⡄⠀⠚⠀⠀⠀⣤⣿⣿⡶⡆⠀⠀⢸⠀⠀⠀⠀⠀⢠⡾⠋⠀⣼⠉⢢⣄⡀⠙⠧⠆⠙⢄⠀⠇⠀⠀⠀⠀⠀⠀⠀⠘⠀⠀⠀⠀⠀⠙⡇⠠⠫⠻⠿⡿⢣⢼⣿⣿⣿⣿⣷⣄⡀⠀⠆⡸⡯⠈⡍⠀⠀⠀⠀\n⠀⠀⠀⢈⣻⣤⡠⠊⣠⣤⡄⣯⢽⢁⠔⠅⠄⠀⠀⠀⠀⡠⡪⠢⣨⡨⣿⠅⢸⠅⠅⠅⠁⠀⠈⠈⠨⡪⠨⠈⠀⠀⠀⠀⠐⠁⠅⣀⣄⡠⢮⠎⠈⠀⠀⠀⣼⣿⣿⣿⣽⢿⠟⢽⣿⡿⡿⠿⡿⣿⣿⣧⠀⠀⠐⠅⠇⠀⠀⠀⠀⣼⣿⣿⡿⠫⠋⠀⠀⠀⠅⠀⠀⠀⣠⠯⢀⣴⡿⠛⠒⠿⣿⣿⢦⠁⠀⠀⢉⣴⣿⡦⡌⣀⣀⣀⣀⠀⠁⠀⠀⠀⠀⠀⠀⠈⠠⠮⡀⠈⠈⢹⣿⣿⣿⢝⣝⢿⣿⣷⡀⠠⠫⠀⠠⠃⠈⠁⠀⠀\n⠀⠀⠰⡾⠿⠮⢠⣾⡿⣿⣿⢹⡜⣿⢵⣅⡅⠁⠀⠀⠀⡂⣠⣨⣾⣿⡏⠀⡏⠀⠀⠅⠀⠀⠈⠈⠀⠀⠈⠀⠀⠀⠀⢠⢕⡅⠀⠉⠉⠉⠀⠀⠀⠀⠀⢸⣿⣿⣿⢿⡝⠕⠅⣿⠿⠉⢩⢨⡼⣯⣿⣿⣶⣷⣦⡍⠉⠽⡇⣠⣾⣿⣯⢫⠋⠈⠉⠐⠁⠀⠁⠀⠀⢀⡿⠀⣸⡏⡼⠟⠀⠀⠹⠏⠅⡇⠀⠀⠚⠻⡈⠀⠀⣻⣿⣿⣿⠐⠒⠔⢢⢤⣄⠀⠀⠀⠀⠀⣿⣯⡄⢸⣿⣽⣿⣍⢝⠉⣿⣿⣿⡄⠈⠩⠋⠉⠉⠉⠁⠀\n⠀⠀⠀⠀⠠⠀⢼⣿⣓⠜⠛⠋⢱⠹⣾⡪⣣⡂⣴⣀⢄⣅⣵⣿⣿⡏⠀⡘⠀⠀⡀⠀⠀⠀⠀⠀⠀⢀⠀⠀⠀⠀⣠⡺⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⡿⠛⡣⢣⡆⠀⡟⠀⢐⣀⣄⣐⠙⢻⣿⣿⣿⣿⣧⠀⠀⣹⣿⣿⣿⣟⢘⠀⠀⣀⠀⠀⠀⣀⣠⡄⣈⠁⠀⣿⡇⠁⠀⢠⣤⠠⠂⠀⡃⠀⠀⣀⡀⠘⠀⠀⢿⠛⣻⣿⡀⠀⠀⠀⠂⠈⢓⡀⠀⠀⠀⣿⣿⣷⣠⣾⣿⣿⣿⣮⡀⠉⢛⢿⣷⡀⠀⠃⠀⠀⠀⠀⠀\n⠀⠠⠤⢤⣤⣤⣤⠝⠳⣄⠍⠁⠈⠢⡘⢿⣯⣿⣾⡿⠿⠿⠿⠛⠁⢀⡚⠀⠀⠂⡂⠀⠀⡀⢀⣐⠐⠔⠀⠀⠒⠚⠁⠀⠠⠂⠂⠀⠀⣰⣶⣶⣔⣴⣿⣿⣿⣦⡞⢺⠊⠢⠈⠀⣴⣿⣿⣿⣟⣷⣤⠌⡪⠻⡿⣿⣿⣶⡐⠓⠙⢛⠗⠑⠀⠠⠖⠀⠀⣸⡿⡻⠺⠛⠃⠀⢻⠗⢔⠐⠒⣻⣾⣦⡢⠂⠀⡀⠘⠃⢐⠃⢀⠗⠀⠡⠿⡂⠀⠪⠂⠐⡂⠀⢀⠀⠀⠀⢻⣟⣿⣿⡿⡻⡻⣿⣿⣯⣦⡉⠕⢟⣷⣤⢶⢖⠒⠀⠀⠀\n⠀⠀⠀⠀⠀⠙⠙⠛⠇⢀⣶⣄⠀⠀⠑⢦⠈⠿⢿⣷⡷⡅⠰⠁⠀⠂⠀⠀⠀⠊⠀⠂⢀⣴⣾⣿⣿⣆⣴⣶⣶⣦⡀⠀⣰⣾⣿⣦⣸⣿⣿⡟⣿⣿⣿⣿⡿⠉⢈⣮⡎⠀⠂⣴⣿⣿⢻⢱⡕⣿⣷⣶⡈⠺⠊⢿⢻⣿⣷⡄⠀⠀⠰⠁⠐⠀⠀⠀⠀⣿⠺⡎⠀⠀⣄⠀⠈⠷⠀⠀⠁⢸⣾⠿⠁⠀⣰⣷⡖⠀⡸⠀⢰⠁⠀⠀⠛⠃⠀⠀⠀⠀⠂⠀⠀⠀⠀⠀⣼⣿⣿⣿⡟⠊⠊⡎⣿⣿⣿⣷⠐⠁⠹⠙⠁⠁⠀⠀⠀⠀\n⠀⠀⠀⢰⠦⠀⣤⡀⠀⠈⠉⠻⠒⠀⠀⠀⠑⠠⠤⠄⠠⠠⠀⠊⠀⠤⠀⠀⠀⠀⠀⠀⠾⠿⠿⠩⠿⠿⠫⠫⠫⠿⢷⠶⠿⠟⠝⠿⠿⠿⠿⠿⠿⠿⠻⠁⠤⠕⠝⠍⠁⠀⠸⠏⠋⠉⠈⠈⠈⠉⠈⠉⠁⠀⢰⡄⠀⠉⠉⠹⠺⠢⠠⠀⠀⠀⠀⠀⠰⠙⠁⠁⠀⠀⠹⡄⠀⠠⠈⠂⠋⠉⠁⠀⢀⠴⠿⠏⠀⠼⠁⠠⠏⠀⠀⠀⠀⠀⠀⠀⠄⠀⠀⠀⠀⠀⠠⠾⠿⠻⠋⠥⠀⠅⠅⠁⠁⠁⠉⠀⠀⠀⢠⣤⠀⢶⡆⠀⠀⠀\n⠀⠀⠀⠈⠯⡠⡉⠠⠦⠀⠠⠶⠴⠴⠴⠴⠴⠤⠠⠀⠀⠀⠀⠀⠀⠀⠤⠴⠴⠴⠴⠴⠴⠶⠦⠤⠦⠤⠀⠀⠀⠀⠀⠀⠐⠐⠄⠴⠴⠦⠤⠦⠦⠦⠦⠶⠶⠴⠴⠴⠴⠴⠴⠶⠶⠢⠢⠠⠢⠀⠀⠰⠀⠴⣟⣷⠄⠀⠤⠀⠠⠢⠠⠢⠢⠲⠶⠶⠴⠴⠴⠴⠴⠶⠦⠦⠮⠤⠤⠠⠤⠤⠤⠄⠀⠄⠄⠀⠀⠠⠠⠀⠠⠦⠤⠶⠶⠴⠴⠴⠴⠴⠴⠶⠦⠦⠦⠄⠂⠀⠀⠀⠀⠤⠴⠴⠴⠴⠶⠄⠠⠦⠨⢩⣀⠮⠁⠀⠀⠀\n⠀⠀⠀⠀⠀⠈⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠈⠈⢶⠃⠀⠀⠀⠀⠀⢹⡇⠀⠀⠀⠀⠀⠈⠾⠈⠈⠀⠀⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠰⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀".split('\n'),glyphs='アイウエオカキクケコサシスセソタチツテト012345789⣿⡿⣷⠿';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),toggle=document.getElementById('fx-toggle');
 let running=!reduced.matches,w=0,h=0,drops=[],frame=0,last=0,time=0,px=0,py=0;
 const plate=document.createElement('canvas'),pc=plate.getContext('2d');
 plate.width=Math.max(...art.map(l=>l.length))*10;plate.height=art.length*20;
 pc.font='16px monospace';pc.textBaseline='top';pc.fillStyle='#50e994';
 art.forEach((line,i)=>pc.fillText(line,0,i*20));
 function size(){w=innerWidth;h=innerHeight;const d=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);drops=Array.from({length:Math.ceil(w/23)},(_,i)=>({x:i*23,y:Math.random()*(h+400)-200,v:30+Math.random()*65,len:7+Math.floor(Math.random()*14),seed:Math.floor(Math.random()*glyphs.length)}));draw(0)}
 function draw(dt){
  time+=dt;ctx.fillStyle='#020906';ctx.fillRect(0,0,w,h);
  ctx.font='14px monospace';ctx.textBaseline='top';
  for(const d of drops){d.y+=dt*d.v;if(d.y-d.len*18>h)d.y=-20;
   for(let j=0;j<d.len;j++){const y=d.y-j*18;if(y< -18||y>h)continue;ctx.fillStyle=j===0?'#b2ffda':`rgba(37,219,113,${(1-j/d.len)*.32})`;ctx.fillText(glyphs[(d.seed+j+Math.floor(time*4))%glyphs.length],d.x+px*3,y)}
  }
  const width=Math.min(Math.max(w*1.1,920),2200),height=width*plate.height/plate.width;
  const x=(w-width)/2+px*10,y=(h-height)/2+py*7;
  ctx.globalAlpha=.42;ctx.drawImage(plate,x,y,width,height);
  // A narrow moving reveal highlights the original characters, never replacing them.
  const sweep=((time*70)%(width+160))-80;
  ctx.save();ctx.beginPath();ctx.rect(x+sweep,y,65,height);ctx.clip();ctx.globalAlpha=.8;ctx.drawImage(plate,x,y,width,height);ctx.restore();ctx.globalAlpha=1;
  if(running&&time%13<.09){ctx.globalAlpha=.2;const row=Math.floor(time/13*97)%plate.height;ctx.drawImage(plate,0,row,plate.width,8,x+7,y+row*height/plate.height,width,8*height/plate.height);ctx.globalAlpha=1}
 }
 function loop(now){if(!running||document.hidden){frame=0;return}if(now-last>=1000/30){draw(last?Math.min((now-last)/1000,.07):0);last=now}frame=requestAnimationFrame(loop)}
 function sync(){cancelAnimationFrame(frame);frame=0;last=0;toggle.textContent=running?'Pause background':'Play background';toggle.setAttribute('aria-pressed',String(running));if(running&&!document.hidden)frame=requestAnimationFrame(loop);else draw(0)}
 toggle.onclick=()=>{running=!running;sync()};reduced.addEventListener('change',()=>{running=!reduced.matches;sync()});
 document.addEventListener('visibilitychange',sync);window.addEventListener('resize',size);window.addEventListener('pointermove',e=>{if(running){px=e.clientX/w-.5;py=e.clientY/h-.5}},{passive:true});size();sync();
})();
</script></body></html>
"""

async def main():
    config = uvicorn.Config(api, host="0.0.0.0", port=PORT, log_level="info")
    server = uvicorn.Server(config)
    await asyncio.gather(bot.start(TOKEN), server.serve())

if __name__ == "__main__":
    asyncio.run(main())
