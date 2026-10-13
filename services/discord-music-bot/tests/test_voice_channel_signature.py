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


if __name__ == "__main__":
    unittest.main()
