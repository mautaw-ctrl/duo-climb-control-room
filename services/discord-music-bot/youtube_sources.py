"""Resolve Discord audio with verified streams and multiple YouTube routes.

Cloud providers often receive YouTube's sign-in / bot challenge. This module
first tries yt-dlp, then checks public Piped and Invidious APIs. None of these
third-party services is guaranteed to remain available. Every candidate is
probed with ffprobe before the bot adds it to the Discord music queue.
"""
import ipaddress
import json
import logging
import os
import re
import subprocess
import time
from urllib.parse import parse_qs, quote, urlsplit
from urllib.request import Request, urlopen

import yt_dlp

LOGGER = logging.getLogger(__name__)

# Curated endpoints are public, unauthenticated services. The environment
# settings are optional and let the owner swap a dead service without a redeploy.
PIPED_DEFAULTS = (
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.nosebs.ru",
    "https://pipedapi.leptons.xyz",
)
INVIDIOUS_DEFAULTS = (
    "https://inv.nadeko.net",
    "https://invidious.nerdvpn.de",
)

BLOCK_WINDOW = 600
_PROTECTED_DOMAINS = ("localhost", "local", "internal", "lan", "home", "test")
_yt_blocked_until = 0.0

class AudioUnavailable(ValueError):
    """No usable audio was found with the configured providers."""

def _public_https(value):
    """Do not pass untrusted instance-returned internal URLs to ffmpeg."""
    try:
        parsed = urlsplit(value)
        host = (parsed.hostname or "").rstrip(".").lower()
        if parsed.scheme != "https" or not host or parsed.username or parsed.password:
            return False
        if host in _PROTECTED_DOMAINS or any(
            host.endswith("." + suffix) for suffix in _PROTECTED_DOMAINS
        ):
            return False
        try:
            ipaddress.ip_address(host)
            return False
        except ValueError:
            pass
        return "." in host and len(value) <= 4000
    except (ValueError, TypeError):
        return False

def _instances(variable, defaults):
    configured = os.getenv(variable, "").strip()
    values = configured.split(",") if configured else defaults
    return tuple(v.rstrip("/") for raw in values if
                 (v := raw.strip().rstrip("/")) and
                 _public_https(v) and
                 not urlsplit(v).path.strip("/") and
                 not urlsplit(v).query and
                 not urlsplit(v).fragment)[:5]

def _json_get(url):
    request = Request(url, headers={
        "Accept": "application/json",
        "User-Agent": "Spillemand/2.0 (Discord music queue)",
    })
    with urlopen(request, timeout=8) as response:
        raw = response.read(2_000_001)
    if len(raw) > 2_000_000:
        raise ValueError("Provider response too large")
    return json.loads(raw)

def _probe_audio(url):
    if not _public_https(url):
        return False
    try:
        done = subprocess.run(
            ["ffprobe", "-v", "error", "-select_streams", "a:0",
             "-show_entries", "stream=codec_name", "-of", "csv=p=0",
             "-rw_timeout", "10000000", url],
            capture_output=True, text=True, timeout=13, check=False,
        )
        if done.returncode != 0:
            LOGGER.debug("ffprobe failed: %s", done.stderr[-180:])
            return False
        return bool(done.stdout.strip())
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError) as exc:
        LOGGER.warning("Audio preflight failed: %s", type(exc).__name__)
        return False

def _youtube_id(query):
    try:
        parsed = urlsplit(query)
        host = (parsed.hostname or "").lower()
        if host == "youtu.be":
            candidate = parsed.path.strip("/").split("/")[0]
        elif host in ("youtube.com", "www.youtube.com", "m.youtube.com",
                      "music.youtube.com", "youtube-nocookie.com",
                      "www.youtube-nocookie.com"):
            if parsed.path == "/watch":
                candidate = parse_qs(parsed.query).get("v", [""])[0]
            elif parsed.path.startswith(("/shorts/", "/live/", "/embed/")):
                candidate = parsed.path.split("/")[2]
            else:
                return None
        else:
            return None
        return candidate if re.fullmatch(r"[A-Za-z0-9_-]{11}", candidate) else None
    except (ValueError, TypeError, IndexError):
        return None

def _is_youtube_or_search(query):
    parsed = urlsplit(query)
    return not parsed.scheme or (parsed.hostname or "").lower() in {
        "youtu.be", "youtube.com", "www.youtube.com",
        "m.youtube.com", "music.youtube.com",
        "youtube-nocookie.com", "www.youtube-nocookie.com",
    }

def _yt_dlp_extract(query, clients):
    opts = {
        "format": "bestaudio[acodec!=none]/bestaudio/best",
        "quiet": True, "no_warnings": True, "noplaylist": True,
        "default_search": "ytsearch1", "socket_timeout": 16,
        "retries": 1, "extractor_retries": 1,
        "source_address": "0.0.0.0",
        "js_runtimes": {"deno": {}},
        "extractor_args": {"youtube": {"player_client": clients}},
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(query, download=False)
    if isinstance(info, dict) and "entries" in info:
        info = next((row for row in info["entries"] if row), None)
    if not isinstance(info, dict):
        raise AudioUnavailable("No playable YouTube result")
    url = info.get("url")
    if not url and info.get("requested_formats"):
        audio = next((f for f in info["requested_formats"] if
                      f and f.get("acodec") != "none" and f.get("url")), None)
        url = audio.get("url") if audio else None
    if not url or not _probe_audio(url):
        raise AudioUnavailable("yt-dlp returned audio that ffprobe cannot play")
    title = str(info.get("title") or "YouTube track")
    page = str(info.get("webpage_url") or query)
    return title, page, url

def _piped_candidate(instance, video_id, search_title=""):
    data = _json_get(instance + "/streams/" + quote(video_id))
    if not isinstance(data, dict):
        return None
    streams = data.get("audioStreams") or []
    if not isinstance(streams, list):
        return None
    ranked = sorted(
        (s for s in streams if isinstance(s, dict) and
         _public_https(s.get("url")) and not s.get("videoOnly")),
        key=lambda s: (
            1 if "audio" in str(s.get("mimeType", "")) else 0,
            int(s.get("bitrate") or 0),
        ), reverse=True,
    )
    for item in ranked[:4]:
        candidate = item["url"]
        if _probe_audio(candidate):
            title = str(data.get("title") or search_title or "YouTube track")
            return title, "https://www.youtube.com/watch?v=" + video_id, candidate
    return None

def _find_piped_id(instance, query):
    data = _json_get(instance + "/search?q=" + quote(query) + "&filter=videos")
    items = data.get("items", []) if isinstance(data, dict) else []
    for item in items[:8]:
        if not isinstance(item, dict) or item.get("isLive") or item.get("isUpcoming"):
            continue
        candidate = _youtube_id("https://www.youtube.com" + str(item.get("url", "")))
        if candidate:
            return candidate, str(item.get("title") or "")
    return None, ""

def _piped_resolve(query, video_id):
    for instance in _instances("PIPED_API_INSTANCES", PIPED_DEFAULTS):
        try:
            found_id, found_title = (
                (video_id, "") if video_id else _find_piped_id(instance, query)
            )
            if not found_id:
                continue
            result = _piped_candidate(instance, found_id, found_title)
            if result:
                LOGGER.info("YouTube audio stream verified via Piped provider")
                return result
        except Exception as exc:
            LOGGER.warning("Piped fallback unavailable (%s): %s",
                           urlsplit(instance).hostname, type(exc).__name__)
    return None

def _find_invidious_id(instance, query):
    data = _json_get(instance + "/api/v1/search?q=" + quote(query) + "&type=video")
    if not isinstance(data, list):
        return None
    for item in data[:8]:
        if isinstance(item, dict) and re.fullmatch(
            r"[A-Za-z0-9_-]{11}", str(item.get("videoId", ""))
        ) and not item.get("liveNow"):
            return item["videoId"]
    return None

def _invidious_resolve(query, video_id):
    for instance in _instances("INVIDIOUS_API_INSTANCES", INVIDIOUS_DEFAULTS):
        try:
            found_id = video_id or _find_invidious_id(instance, query)
            if not found_id:
                continue
            data = _json_get(instance + "/api/v1/videos/" + quote(found_id))
            if not isinstance(data, dict):
                continue
            streams = data.get("adaptiveFormats") or []
            audio = sorted(
                (row for row in streams if isinstance(row, dict) and
                 "audio/" in str(row.get("type", "")).lower() and
                 _public_https(row.get("url"))),
                key=lambda s: int(s.get("bitrate") or 0), reverse=True,
            )
            for row in audio[:4]:
                if _probe_audio(row["url"]):
                    LOGGER.info("YouTube audio stream verified via Invidious provider")
                    return (str(data.get("title") or "YouTube track"),
                            "https://www.youtube.com/watch?v=" + found_id,
                            row["url"])
        except Exception as exc:
            LOGGER.warning("Invidious fallback unavailable (%s): %s",
                           urlsplit(instance).hostname, type(exc).__name__)
    return None

def extract(query):
    """Return (title, canonical_page_url, ffmpeg_compatible_stream_url).

    Both direct and fallback streams are verified by ffprobe before return.
    Cloud IP bot blocks are cached briefly instead of hammering YouTube.
    """
    global _yt_blocked_until
    query = str(query).strip()
    if not query or len(query) > 1200:
        raise AudioUnavailable("Provide a music title or a valid URL.")
    supported = _is_youtube_or_search(query)
    video_id = _youtube_id(query)
    if not supported:
        try:
            return _yt_dlp_extract(query, ["default"])
        except Exception as exc:
            raise AudioUnavailable(
                "This audio source is unavailable or DRM protected."
            ) from exc

    error = None
    if time.monotonic() >= _yt_blocked_until:
        try:
            resolved = _yt_dlp_extract(query, ["tv", "web_safari"])
            LOGGER.info("YouTube audio stream verified via yt-dlp")
            return resolved
        except Exception as exc:
            error = exc
            message = str(exc).lower()
            if ("confirm you're not a bot" in message or
                "confirm you’re not a bot" in message or
                "sign in" in message):
                _yt_blocked_until = time.monotonic() + BLOCK_WINDOW
                LOGGER.warning("YouTube challenged Railway's IP; trying public fallback")
            else:
                LOGGER.warning("yt-dlp audio unavailable (%s); trying fallback",
                               type(exc).__name__)

    for resolver in (_piped_resolve, _invidious_resolve):
        result = resolver(query, video_id)
        if result:
            return result

    if error:
        LOGGER.error("YouTube providers all failed; direct issue: %s",
                     str(error)[:170])
    raise AudioUnavailable(
        "YouTube playback is blocked on this server and the backup sources "
        "are unavailable. No playable stream was found."
    )
