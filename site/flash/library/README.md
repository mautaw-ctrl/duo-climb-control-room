# Miracle442 SWF Library

Put your own .swf files in this folder.

Example:

```
site/flash/library/
  game-one.swf
  game-two.swf
  another-game.swf
```

Then add them to `manifest.json`:

```json
{
  "games": [
    {
      "name": "Game One",
      "file": "game-one.swf"
    },
    {
      "name": "Game Two",
      "file": "game-two.swf"
    }
  ]
}
```

The Miracle442 Ruffle player reads this list automatically and shows the games in its library selector.

Notes:
- Keep filenames simple: letters, numbers, dashes, underscores.
- GitHub's normal browser upload has per-file limits. Large collections are better stored in Cloudflare R2 and referenced separately.
- Only add SWFs you are allowed to host/share.
