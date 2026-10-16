"""Best-effort public Lavalink v4 node discovery and YouTube search.

Inspired by BeatDock's public node provider (Apache-2.0) and compatible
with Wavelink 3.5. Public nodes are third-party services and may fail.
Only public HTTPS hosts are accepted; this never sends Discord credentials,
control keys, or personal data to the node.
"""
import asyncio
import ipaddress
import json
import logging
import os
import random
import socket
from urllib.parse import urlsplit

import aiohttp
import wavelink

LOG = logging.getLogger(__name__)
DISCOVERY = "https://lavalink-list.ajieblogs.eu.org/All"
MAX_RESPONSE = 256 * 1024
MAX_NODES = 5
SOURCE_NODES = 35
SEARCH_NODE_TIMEOUT = 5.0
SEARCH_TOTAL_TIMEOUT = 9.0
SEARCH_PARALLELISM = 3
SEARCH_TIMEOUT_COOLDOWN = 90.0

# Publicly documented v4 SSL nodes, ordered by available status reports.
# These are independent of BeatDock's directory, which sometimes lists stale
# nodes (the prior Railway probe hit dead Nazha endpoints).
STATIC_NODES = (
    ("https://lavalink-v4.triniumhost.indevs.in:443", "free"),
    ("https://eu.lavalink.heavencloud.in:443", "heavencloud"),
    ("https://us.lavalink.heavencloud.in:443", "heavencloud"),
    ("https://sg.lavalink.heavencloud.in:443", "heavencloud"),
    ("https://lavalink.heavencloud.in:443", "heavencloud"),
    ("https://lavalinkv4.serenetia.com:443", "https://dsc.gg/ajidevserver"),
    ("https://lavalink-v4.triniumhost.com:443", "free"),
)


def public_https_host(value):
    """Reject private addresses, IP literals, userinfo and non-HTTPS hosts."""
    try:
        parts = urlsplit(value)
        host = (parts.hostname or "").lower().rstrip(".")
        if (parts.scheme != "https" or parts.username or parts.password
                or not host or "." not in host or len(host) > 253
                or parts.path not in ("", "/") or parts.query or parts.fragment):
            return False
        if host.endswith((".local", ".localhost", ".internal", ".lan", ".test")):
            return False
        try:
            ipaddress.ip_address(host)
            return False
        except ValueError:
            return True
    except (TypeError, ValueError):
        return False


def parse_public_nodes(data):
    """Validate provider format and select HTTPS v4 endpoints."""
    if not isinstance(data, list):
        return []
    candidates = []
    seen = set()
    for row in data[:120]:
        if not isinstance(row, dict) or row.get("version") != "v4":
            continue
        host = str(row.get("host") or "").strip().lower().rstrip(".")
        password = row.get("password")
        port = row.get("port")
        if row.get("secure") is not True or not isinstance(password, str):
            continue
        if not 0 < len(password) <= 512 or not isinstance(port, int) or not 1 <= port <= 65535:
            continue
        uri = f"https://{host}:{port}"
        if not public_https_host(uri) or uri in seen:
            continue
        candidates.append((uri, password))
        seen.add(uri)
    return candidates[:SOURCE_NODES]


async def hostname_is_public(uri):
    """DNS lookups reduce exposure to accidentally advertised local nodes."""
    host = urlsplit(uri).hostname
    try:
        records = await asyncio.wait_for(asyncio.to_thread(
            socket.getaddrinfo, host, 443, type=socket.SOCK_STREAM
        ), 4)
        return bool(records) and all(
            ipaddress.ip_address(item[4][0]).is_global for item in records
        )
    except (socket.gaierror, TimeoutError, OSError, ValueError):
        return False


class LavalinkService:
    def __init__(self):
        self.nodes = []
        self._initialized = False
        self._initializing = asyncio.Lock()
        self._last_error = ""
        self.last_search_ready = False
        self._search_cooldown = {}

    @property
    def available(self):
        return bool(self.ready_nodes())

    def ready_nodes(self):
        return [
            node for node in self.nodes
            if node.status is wavelink.NodeStatus.CONNECTED
        ]

    def healthy_nodes(self, *, exclude=None):
        """Connected nodes without recent failed audio lookups."""
        now = asyncio.get_running_loop().time()
        return [n for n in self.ready_nodes()
                if n is not exclude and self._search_cooldown.get(n.identifier, 0) <= now]

    def quarantine(self, node, seconds=180):
        """Avoid a node that reports connected but returns HTTP 502/530."""
        if node is not None:
            self._search_cooldown[node.identifier] = asyncio.get_running_loop().time() + seconds
            LOG.warning("LAVALINK_NODE_QUARANTINED %s seconds=%s", node.identifier, seconds)

    @property
    def status(self):
        if self.available:
            return "connected"
        return "disconnected" if self._initialized else "pending"

    @property
    def last_error(self):
        return self._last_error

    async def _discover(self):
        timeout = aiohttp.ClientTimeout(total=12)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(DISCOVERY) as response:
                response.raise_for_status()
                chunk = await response.content.read(MAX_RESPONSE + 1)
                if len(chunk) > MAX_RESPONSE:
                    raise ValueError("Lavalink node list too large")
        return parse_public_nodes(json.loads(chunk))

    async def connect(self, bot):
        """Connect a bounded number of healthy public Lavalink nodes."""
        async with self._initializing:
            self._initialized = True
            if self.available:
                return self.ready_nodes()
            primary = os.getenv("LAVALINK_PRIMARY", "").strip()
            candidates = []
            if primary and "|" in primary:
                uri, password = primary.rsplit("|", 1)
                if public_https_host(uri) and 0 < len(password) <= 512:
                    candidates.append((uri.rstrip("/"), password))
            # Start with independently documented nodes that have publicly
            # reported available instances; only then try a shuffled directory.
            candidates.extend(STATIC_NODES)
            try:
                discovered = await self._discover()
                random.shuffle(discovered)
                candidates.extend(discovered)
            except Exception as exc:
                self._last_error = f"Discovery: {type(exc).__name__}"
                LOG.warning("LAVALINK_DISCOVERY_FAILED %s", self._last_error)
            seen = set()
            for index, (uri, password) in enumerate(candidates):
                if len(self.ready_nodes()) >= MAX_NODES:
                    break
                if uri in seen:
                    continue
                seen.add(uri)
                if not await hostname_is_public(uri):
                    continue
                identifier = f"remote-{index}"
                node = wavelink.Node(
                    identifier=identifier, uri=uri, password=password,
                    retries=1, inactive_player_timeout=None,
                    inactive_channel_tokens=None,
                )
                try:
                    pool = await asyncio.wait_for(
                        wavelink.Pool.connect(nodes=[node], client=bot), 11
                    )
                    # Wavelink can return while the WebSocket is still
                    # CONNECTING. Keep the instance so a later NodeReady
                    # transition becomes visible in ready_nodes().
                    connected = pool.get(identifier) or node
                    if connected not in self.nodes:
                        self.nodes.append(connected)
                    for _ in range(12):
                        if connected.status is wavelink.NodeStatus.CONNECTED:
                            LOG.info("LAVALINK_NODE_CONNECTED %s", urlsplit(uri).hostname)
                            break
                        if connected.status is wavelink.NodeStatus.DISCONNECTED:
                            break
                        await asyncio.sleep(0.25)
                    else:
                        LOG.info("LAVALINK_NODE_PENDING %s", urlsplit(uri).hostname)
                except Exception as exc:
                    LOG.warning("LAVALINK_NODE_FAILED %s %s",
                                urlsplit(uri).hostname, type(exc).__name__)
                # Cap the number of connection attempts so fallback doesn't tie
                # up the worker for minutes. More candidates are tried later.
                if len(seen) >= 16:
                    break
            LOG.info("LAVALINK_POOL_READY nodes=%s", len(self.ready_nodes()))
            if not self.available:
                self._last_error = "No accessible Lavalink v4 nodes"
            return self.ready_nodes()

    async def search(self, query, preferred=None, *, source=None, preferred_only=False):
        """Search a playable source without moving an existing Discord voice session.

        When preferred_only=True, a player is already bound to that node.
        Wavelink's switch_node() can drop Discord voice state even if a
        different Lavalink node returned search metadata more quickly.
        """
        """Find the first usable track without waiting on every broken node.

        Nodes are independent third-party servers. Search a maximum of three
        concurrently, with a deadline and temporary cooldown for bad nodes.
        Cancelling the losing searches never stops active audio playback.
        """
        nodes = self.ready_nodes()
        now = asyncio.get_running_loop().time()
        candidates = [n for n in nodes
                      if self._search_cooldown.get(n.identifier, 0) <= now]
        # If everything is cooling down, probe the soonest available once
        # rather than returning an immediate false permanent failure.
        if not candidates and nodes:
            candidates = [min(nodes, key=lambda n:
                              self._search_cooldown.get(n.identifier, 0))]
        if preferred_only:
            # A connected player cannot safely play a track from a different
            # node. Keep the voice node even when its search is cooling down.
            candidates = [preferred] if preferred in nodes else []
        elif preferred in candidates:
            candidates.remove(preferred)
            candidates.insert(0, preferred)
        if not candidates:
            self.last_search_ready = False
            return None

        semaphore = asyncio.Semaphore(SEARCH_PARALLELISM)

        async def try_node(node):
            async with semaphore:
                try:
                    found = await asyncio.wait_for(
                        wavelink.Playable.search(
                            query, source=source or wavelink.TrackSource.YouTube,
                            node=node,
                        ), timeout=SEARCH_NODE_TIMEOUT
                    )
                    if isinstance(found, wavelink.Playlist):
                        found = found.tracks
                    if found:
                        return found[0], node
                except Exception as exc:
                    # A dead node must not impose its full timeout on every
                    # subsequent song in a bulk import.
                    cooldown = (SEARCH_TIMEOUT_COOLDOWN if
                                isinstance(exc, TimeoutError) else 20.0)
                    self._search_cooldown[node.identifier] = (
                        asyncio.get_running_loop().time() + cooldown)
                    LOG.warning("LAVALINK_SEARCH_FAILED %s %s (cooldown %.0fs)",
                                node.identifier, type(exc).__name__, cooldown)
            return None

        tasks = []
        self.last_search_ready = False
        try:
            # Prefer the node holding the current voice session. Give it a
            # tiny head start; this avoids unnecessary voice-node switches
            # when two servers return a result at practically the same time.
            if preferred in candidates:
                first = asyncio.create_task(try_node(preferred))
                tasks.append(first)
                try:
                    result = await asyncio.wait_for(
                        asyncio.shield(first), timeout=0.15)
                    if result:
                        self.last_search_ready = True
                        return result
                except TimeoutError:
                    pass
                candidates.remove(preferred)
            tasks.extend(asyncio.create_task(try_node(node))
                         for node in candidates)
            for future in asyncio.as_completed(tasks, timeout=SEARCH_TOTAL_TIMEOUT):
                try:
                    result = await future
                except TimeoutError:
                    LOG.warning("LAVALINK_SEARCH_DEADLINE %.1fs", SEARCH_TOTAL_TIMEOUT)
                    break
                if result:
                    self.last_search_ready = True
                    return result
        finally:
            for task in tasks:
                if not task.done():
                    task.cancel()
            await asyncio.gather(*tasks, return_exceptions=True)
        return None

    async def quick_probe(self):
        try:
            result = await self.search("https://www.youtube.com/watch?v=jNQXAC9IVRw")
            if result:
                LOG.info("LAVALINK_YOUTUBE_LOOKUP_SUCCESS metadata only; waiting for actual voice playback")
                return "lookup-ok"
            LOG.warning("LAVALINK_YOUTUBE_LOOKUP_FAILED remote nodes could not return a track")
        except Exception as exc:
            LOG.warning("LAVALINK_YOUTUBE_LOOKUP_FAILED %s", type(exc).__name__)
        return "unavailable"


service = LavalinkService()
