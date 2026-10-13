"""Offline unit tests: public node parsing, failover and result selection."""
import asyncio
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import wavelink
from lavalink_backend import LavalinkService, STATIC_NODES, parse_public_nodes, public_https_host


class NodeDiscoveryTests(unittest.TestCase):
    def test_parse_node_list(self):
        sample = [
            {"version": "v4", "host": "lavalink.example.com", "port": 443,
             "password": "free", "secure": True},
            {"version": "v4", "host": "bad.internal", "port": 443,
             "password": "free", "secure": True},
            {"version": "v3", "host": "old.example.com", "port": 443,
             "password": "free", "secure": True},
            {"version": "v4", "host": "insecure.example.com", "port": 2333,
             "password": "free", "secure": False},
            {"version": "v4", "host": "lavalink.example.com", "port": 443,
             "password": "free", "secure": True},
            {"version": "v4", "host": "localhost", "port": 443,
             "password": "free", "secure": True},
        ]
        self.assertEqual(parse_public_nodes(sample),
                         [("https://lavalink.example.com:443", "free")])
        self.assertEqual(parse_public_nodes({}), [])

    def test_documented_static_nodes_are_https(self):
        self.assertGreaterEqual(len(STATIC_NODES), 4)
        self.assertEqual(len(set(uri for uri, password in STATIC_NODES)), len(STATIC_NODES))
        self.assertTrue(all(public_https_host(uri) and password for uri, password in STATIC_NODES))

    def test_host_validation(self):
        for candidate in (
            "https://localhost:443", "http://node.example.com:2333",
            "https://10.0.0.2:443", "https://foo.internal:443",
            "https://admin:pass@public.example.com:443",
            "https://public.example.com:443/path",
            "https://public.example.com:443?x=y",
        ):
            with self.subTest(candidate=candidate):
                self.assertFalse(public_https_host(candidate))
        self.assertTrue(public_https_host("https://music.example.com:443"))


class FailoverTests(unittest.IsolatedAsyncioTestCase):
    async def test_source_failover_after_first_node_errors(self):
        first = SimpleNamespace(identifier="first")
        second = SimpleNamespace(identifier="second")
        service = LavalinkService()
        service.ready_nodes = lambda: [first, second]
        playable = SimpleNamespace(title="A Song", uri="https://youtube.com/")
        def fallback(query, source, node):
            if node is first:
                raise RuntimeError("node cannot load YouTube")
            return [playable]
        with patch.object(wavelink.Playable, "search",
                          new=AsyncMock(side_effect=fallback)) as search:
            result = await service.search("https://youtu.be/E6IXUfLi81A")
        self.assertEqual(result, (playable, second))
        self.assertEqual(search.await_count, 2)

    async def test_prefer_current_node(self):
        first = SimpleNamespace(identifier="first")
        second = SimpleNamespace(identifier="second")
        service = LavalinkService()
        service.ready_nodes = lambda: [first, second]
        playable = SimpleNamespace(title="Test")
        with patch.object(wavelink.Playable, "search",
                          new=AsyncMock(return_value=[playable])) as search:
            selected = await service.search("test title", preferred=second)
        self.assertIs(selected[1], second)
        self.assertEqual(search.await_count, 1)

    async def test_connect_keeps_pending_node(self):
        service = LavalinkService()
        node = SimpleNamespace(status=wavelink.NodeStatus.CONNECTING,
                               identifier="remote-0")
        service._discover = AsyncMock(return_value=[])
        with patch("lavalink_backend.STATIC_NODES",
                   [("https://music.example.com:443", "test-pass")]), \
             patch("lavalink_backend.hostname_is_public",
                   new=AsyncMock(return_value=True)), \
             patch("lavalink_backend.wavelink.Node", return_value=node), \
             patch("lavalink_backend.wavelink.Pool.connect",
                   new=AsyncMock(return_value={"remote-0": node})), \
             patch("lavalink_backend.asyncio.sleep", new=AsyncMock()):
            await service.connect(SimpleNamespace())
        self.assertIn(node, service.nodes)
        node.status = wavelink.NodeStatus.CONNECTED
        self.assertTrue(service.available)

    async def test_no_nodes_no_false_success(self):
        service = LavalinkService()
        service.ready_nodes = lambda: []
        with patch.object(wavelink.Playable, "search",
                          new=AsyncMock()) as search:
            self.assertIsNone(await service.search("test"))
            search.assert_not_awaited()

    async def test_parallel_search_skips_hanging_provider(self):
        """A working node can respond while another is still blocked."""
        first = SimpleNamespace(identifier="slow")
        second = SimpleNamespace(identifier="fast")
        service = LavalinkService()
        service.ready_nodes = lambda: [first, second]
        track = SimpleNamespace(title="Found")
        async def lookup(query, source, node):
            if node is first:
                await asyncio.sleep(3)
            return [track]
        with patch.object(wavelink.Playable, "search",
                          new=AsyncMock(side_effect=lookup)):
            result = await asyncio.wait_for(service.search("fast song"), timeout=0.5)
        self.assertEqual(result, (track, second))

    async def test_failed_search_node_enters_cooldown(self):
        first = SimpleNamespace(identifier="broken")
        second = SimpleNamespace(identifier="working")
        service = LavalinkService()
        service.ready_nodes = lambda: [first, second]
        track = SimpleNamespace(title="Found")
        calls = []
        async def lookup(query, source, node):
            calls.append(node.identifier)
            if node is first:
                raise TimeoutError("dead endpoint")
            await asyncio.sleep(0.01)
            return [track]
        with patch.object(wavelink.Playable, "search",
                          new=AsyncMock(side_effect=lookup)):
            self.assertEqual((await service.search("one"))[1], second)
            self.assertIn("broken", service._search_cooldown)
            calls.clear()
            self.assertEqual((await service.search("two"))[1], second)
            self.assertNotIn("broken", calls)

    async def test_search_has_global_deadline(self):
        first = SimpleNamespace(identifier="slow-1")
        second = SimpleNamespace(identifier="slow-2")
        service = LavalinkService()
        service.ready_nodes = lambda: [first, second]
        async def never(query, source, node):
            await asyncio.sleep(5)
        with patch.object(wavelink.Playable, "search",
                          new=AsyncMock(side_effect=never)), \
             patch("lavalink_backend.SEARCH_TOTAL_TIMEOUT", 0.05):
            result = await asyncio.wait_for(service.search("slow song"), timeout=0.4)
        self.assertIsNone(result)


    async def test_pinned_search_never_contacts_another_node(self):
        first = SimpleNamespace(identifier="first")
        second = SimpleNamespace(identifier="second")
        service = LavalinkService()
        service.ready_nodes = lambda: [first, second]
        track = SimpleNamespace(title="Audio")
        with patch.object(wavelink.Playable, "search",
                          new=AsyncMock(return_value=[track])) as lookup:
            item, node = await service.search(
                "my track", preferred=second, preferred_only=True,
                source=wavelink.TrackSource.SoundCloud)
        self.assertIs(node, second)
        self.assertEqual(lookup.await_count, 1)
        self.assertIs(lookup.await_args.kwargs["node"], second)
        self.assertEqual(lookup.await_args.kwargs["source"],
                         wavelink.TrackSource.SoundCloud)

    async def test_lookup_probe_is_not_audio_claim(self):
        service = LavalinkService()
        track = SimpleNamespace(title="Test")
        node = SimpleNamespace(identifier="node")
        service.search = AsyncMock(return_value=(track, node))
        self.assertEqual(await service.quick_probe(), "lookup-ok")


if __name__ == "__main__":
    unittest.main()
