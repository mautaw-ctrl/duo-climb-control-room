#!/usr/bin/env python3
from pathlib import Path
import json
import sys

if len(sys.argv) not in (2, 3):
    raise SystemExit("usage: split-boxedwine-root.py <zip> [chunk-size-bytes]")

src = Path(sys.argv[1])
chunk_size = int(sys.argv[2]) if len(sys.argv) == 3 else 8 * 1024 * 1024
if chunk_size <= 0:
    raise SystemExit("chunk size must be positive")
if not src.is_file():
    raise SystemExit(f"missing input: {src}")

parts = []
with src.open("rb") as fh:
    index = 0
    while True:
        data = fh.read(chunk_size)
        if not data:
            break
        name = f"{src.name}.part{index:03d}"
        path = src.with_name(name)
        path.write_bytes(data)
        parts.append({"name": name, "size": len(data)})
        index += 1

manifest = {
    "version": 1,
    "file": src.name,
    "totalSize": src.stat().st_size,
    "chunkSize": chunk_size,
    "parts": parts,
}
manifest_path = src.with_name(src.name + ".chunks.json")
manifest_path.write_text(json.dumps(manifest, separators=(",", ":")) + "\n")
src.unlink()
print(f"Split {manifest['file']} into {len(parts)} chunks; total={manifest['totalSize']} bytes")
print(manifest_path)
