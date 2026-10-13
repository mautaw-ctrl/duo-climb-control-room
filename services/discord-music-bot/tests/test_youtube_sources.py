"""Regression tests for YouTube stream resolution without network access."""
import unittest
from unittest.mock import patch

import youtube_sources as yt


class AudioResolverTests(unittest.TestCase):
    def setUp(self):
        yt._yt_blocked_until = 0

    def tearDown(self):
        yt._yt_blocked_until = 0

    def test_youtube_links(self):
        expected = "E6IXUfLi81A"
        for link in (
            "https://www.youtube.com/watch?v=E6IXUfLi81A&list=PL123",
            "https://music.youtube.com/watch?v=E6IXUfLi81A",
            "https://youtu.be/E6IXUfLi81A?t=12",
            "https://youtube.com/shorts/E6IXUfLi81A",
            "https://www.youtube.com/live/E6IXUfLi81A",
            "https://www.youtube-nocookie.com/embed/E6IXUfLi81A",
        ):
            with self.subTest(link=link):
                self.assertEqual(yt._youtube_id(link), expected)

    def test_reject_local_stream_urls(self):
        for bad in (
            "http://cdn.example.org/audio.mp3",
            "https://localhost/audio.mp3",
            "https://192.168.1.10/audio.mp3",
            "https://127.0.0.1/audio.mp3",
            "https://127.0.0.1.nip.io.local/audio",
            "file:///etc/passwd",
            "https://foo.internal/audio",
            "https://user:pass@audio.example.com/a.mp3",
            "javascript:alert(1)",
        ):
            with self.subTest(url=bad):
                self.assertFalse(yt._public_https(bad))
        self.assertTrue(yt._public_https("https://pipedproxy.kavin.rocks/stream?x=1"))

    def test_instance_override_validated(self):
        with patch.dict("os.environ", {
            "PIPED_API_INSTANCES": "http://not-secure.invalid,https://pipedapi.kavin.rocks/,https://localhost,"
                                   "https://pipedapi.nosebs.ru/"
        }):
            self.assertEqual(
                yt._instances("PIPED_API_INSTANCES", ()),
                ("https://pipedapi.kavin.rocks", "https://pipedapi.nosebs.ru"),
            )

    @patch.object(yt, "_probe_audio", return_value=True)
    @patch.object(yt, "_json_get")
    def test_piped_audio_candidate(self, fetch, probe):
        fetch.return_value = {
            "title": "Astral Projection - Dancing Galaxy",
            "audioStreams": [
                {"url": "https://pipedproxy.kavin.rocks/a-low", "mimeType": "audio/mp4", "bitrate": 96000},
                {"url": "https://pipedproxy.kavin.rocks/a-high", "mimeType": "audio/webm", "bitrate": 192000},
            ],
        }
        result = yt._piped_candidate("https://pipedapi.kavin.rocks", "E6IXUfLi81A")
        self.assertEqual(result[0], "Astral Projection - Dancing Galaxy")
        self.assertIn("E6IXUfLi81A", result[1])
        self.assertEqual(result[2], "https://pipedproxy.kavin.rocks/a-high")
        probe.assert_called_once_with("https://pipedproxy.kavin.rocks/a-high")

    @patch.object(yt, "_json_get")
    def test_piped_search_finds_a_video(self, fetch):
        fetch.return_value = {"items": [
            {"type": "stream", "url": "/watch?v=E6IXUfLi81A",
             "title": "Astral Projection - Dancing Galaxy"}
        ]}
        self.assertEqual(yt._find_piped_id(
            "https://pipedapi.kavin.rocks", "Astral Projection"),
            ("E6IXUfLi81A", "Astral Projection - Dancing Galaxy"))

    @patch.object(yt, "_piped_resolve",
                  return_value=("A song", "https://www.youtube.com/watch?v=E6IXUfLi81A",
                                "https://media.example.org/stream"))
    @patch.object(yt, "_yt_dlp_extract", side_effect=ValueError(
        "Sign in to confirm you're not a bot"))
    def test_youtube_bot_challenge_uses_backup(self, direct, backup):
        result = yt.extract("https://youtu.be/E6IXUfLi81A")
        self.assertEqual(result[0], "A song")
        self.assertEqual(backup.call_count, 1)
        self.assertGreater(yt._yt_blocked_until, 0)
        yt.extract("https://youtu.be/E6IXUfLi81A")
        self.assertEqual(direct.call_count, 1)  # avoids hammering challenged IP

    @patch.object(yt, "_invidious_resolve",
                  return_value=("Backup", "https://www.youtube.com/watch?v=E6IXUfLi81A",
                                "https://media.example.org/audio"))
    @patch.object(yt, "_piped_resolve", return_value=None)
    @patch.object(yt, "_yt_dlp_extract", side_effect=ValueError("YouTube blocked"))
    def test_invidious_is_second_fallback(self, direct, piped, invidious):
        result = yt.extract("music title")
        self.assertEqual(result[0], "Backup")
        piped.assert_called_once()
        invidious.assert_called_once()

    @patch.object(yt, "_invidious_resolve", return_value=None)
    @patch.object(yt, "_piped_resolve", return_value=None)
    @patch.object(yt, "_yt_dlp_extract", side_effect=ValueError("Blocked"))
    def test_no_false_success_on_unplayable_stream(self, direct, piped, invidious):
        with self.assertRaisesRegex(yt.AudioUnavailable, "No playable stream"):
            yt.extract("https://youtu.be/E6IXUfLi81A")

    @patch.object(yt, "_yt_dlp_extract",
                  return_value=("Other", "https://soundcloud.com/artist/track",
                                "https://media.example.org/other"))
    @patch.object(yt, "_piped_resolve")
    def test_soundcloud_stays_on_original_resolver(self, piped, direct):
        result = yt.extract("https://soundcloud.com/artist/track")
        self.assertEqual(result[0], "Other")
        piped.assert_not_called()

    @patch.object(yt.subprocess, "run")
    def test_ffprobe_rejects_empty_audio(self, subprocess_run):
        subprocess_run.return_value.returncode = 0
        subprocess_run.return_value.stdout = ""
        self.assertFalse(yt._probe_audio("https://audio.example.org/file"))
        subprocess_run.return_value.stdout = "opus"
        self.assertTrue(yt._probe_audio("https://audio.example.org/file"))


if __name__ == "__main__":
    unittest.main()
