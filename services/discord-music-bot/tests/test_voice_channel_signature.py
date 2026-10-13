"""Prevent accidental use of unsupported discord.py Connectable.connect kwargs."""
import ast
import inspect
import pathlib
import unittest
import discord


class VoiceChannelApiTests(unittest.TestCase):
    def test_player_connect_uses_discord_supported_kwargs(self):
        # Runtime library is installed in Railway's Docker build. This catches
        # mistakes that Python syntax checks alone cannot catch.
        allowed = set(inspect.signature(discord.abc.Connectable.connect).parameters)
        src = pathlib.Path(__file__).resolve().parents[1].joinpath("bot.py").read_text()
        tree = ast.parse(src)
        calls = [
            node for node in ast.walk(tree)
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute)
            and node.func.attr == "connect"
            and isinstance(node.func.value, ast.Name)
            and node.func.value.id == "channel"
        ]
        self.assertGreaterEqual(len(calls), 1)
        for call in calls:
            unexpected = [kw.arg for kw in call.keywords if kw.arg not in allowed]
            self.assertFalse(unexpected, f"Unsupported Discord voice kwargs: {unexpected}")


    def test_website_play_checks_wavelink_connection_through_helper(self):
        """The website must not call discord.py-only voice.is_connected()."""
        src = pathlib.Path(__file__).resolve().parents[1].joinpath("bot.py").read_text()
        tree = ast.parse(src)
        endpoint = next(
            node for node in tree.body
            if isinstance(node, ast.AsyncFunctionDef) and node.name == "web_play"
        )
        calls = [node.func for node in ast.walk(endpoint) if isinstance(node, ast.Call)]
        self.assertTrue(
            any(isinstance(func, ast.Name) and func.id == "voice_connected"
                for func in calls),
            "web_play must use the Wavelink-aware voice_connected helper",
        )
        self.assertFalse(
            any(isinstance(func, ast.Attribute) and func.attr == "is_connected"
                for func in calls),
            "Wavelink Player has no is_connected() method",
        )

    def test_connected_helper_handles_wavelink(self):
        """We must use Wavelink's connected property and the legacy method separately."""
        src = pathlib.Path(__file__).resolve().parents[1].joinpath("bot.py").read_text()
        tree = ast.parse(src)
        helper = next(
            node for node in tree.body
            if isinstance(node, ast.FunctionDef) and node.name == "voice_connected"
        )
        self.assertIn("connected", ast.unparse(helper))
        self.assertIn("wavelink.Player", ast.unparse(helper))

    def test_existing_voice_session_never_switches_node_for_search(self):
        """Metadata searches must never migrate a Discord voice session."""
        src = pathlib.Path(__file__).resolve().parents[1].joinpath("bot.py").read_text()
        tree = ast.parse(src)
        targets = ("ensure_voice", "advance", "on_wavelink_node_disconnected")
        for name in targets:
            fn = next(n for n in tree.body if isinstance(n, ast.AsyncFunctionDef) and n.name == name)
            calls = [n for n in ast.walk(fn)
                     if isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute)
                     and n.func.attr == "switch_node"]
            self.assertEqual(calls, [], f"{name} must not force Lavalink node migration")

    def test_source_error_retries_without_disconnecting_discord(self):
        src = pathlib.Path(__file__).resolve().parents[1].joinpath("bot.py").read_text()
        tree = ast.parse(src)
        recover = next(n for n in tree.body if isinstance(n, ast.AsyncFunctionDef)
                       and n.name == "retry_soundcloud_after_track_failure")
        self.assertIn("TrackSource.SoundCloud", ast.unparse(recover))
        self.assertIn("preferred_only=True", ast.unparse(recover))


if __name__ == "__main__":
    unittest.main()
