#!/usr/bin/env python3
"""Prepare the official complete KeeperFX 1.3.2 distribution for BoxedWine."""
from pathlib import Path
import re
import shutil
import struct
import sys
import zipfile

dist = Path(sys.argv[1])
assets = Path(sys.argv[2])
output = Path(sys.argv[3])

exe = dist / 'keeperfx.exe'
binary = exe.read_bytes()
pe = struct.unpack_from('<I', binary, 0x3C)[0]
if binary[pe:pe + 4] != b'PE\0\0' or struct.unpack_from('<H', binary, pe + 4)[0] != 0x14C:
    raise SystemExit('BoxedWine requires the official 32-bit KeeperFX executable')

compatibility = (
    'data/bluepal.dat', 'data/bluepall.dat', 'data/dogpal.pal',
    'data/hitpall.dat', 'data/lightng.pal', 'data/main.pal',
    'data/mapfadeg.dat', 'data/redpal.col', 'data/redpall.dat',
    'data/slab0-0.dat', 'data/slab0-1.dat', 'data/vampal.pal',
    'data/whitepal.col', 'sound/atmos1.sbk', 'sound/atmos2.sbk',
    'sound/bullfrog.sbk',
)
for rel in compatibility:
    source = assets / rel
    if not source.is_file():
        raise SystemExit('Missing uploaded compatibility file: ' + rel)
    shutil.copy2(source, dist / rel)

# Retain all campaigns, maps and graphics. The browser edition uses English
# speech; desktop launchers, build maps and other-language voices are omitted.
for path in dist.iterdir():
    if path.is_file() and (path.suffix.lower() in ('.7z', '.map', '.pdb') or
                          path.suffix.lower() == '.exe' and path.name != 'keeperfx.exe'):
        path.unlink()
for path in (dist / 'sound').glob('speech_*.dat'):
    if path.name.lower() != 'speech_eng.dat':
        path.unlink()
other_languages = {'chi', 'cht', 'cze', 'dut', 'fre', 'ger', 'ita',
                   'jpn', 'kor', 'lat', 'pol', 'por', 'rus', 'spa', 'swe', 'ukr'}
for path in (dist / 'campgns').iterdir():
    if path.is_dir() and path.name.rsplit('_', 1)[-1] in other_languages:
        shutil.rmtree(path)
# The startup movie is disabled above; retain the outro and all landviews.
(dist / 'ldata/intromix.smk').unlink(missing_ok=True)

cfg = dist / 'keeperfx.cfg'
text = cfg.read_text()
settings = {
    'FRONTEND_RES': '640x480w32 640x480w32 640x480w32',
    'INGAME_RES': '640x480w32 800x600w32',
    'STARTUP': '',
    'FREEZE_GAME_ON_FOCUS_LOST': 'OFF',
    'MUSIC_FROM_DISK': 'OFF',
    'FRAMES_PER_SECOND': '20',
    'API_ENABLED': 'FALSE',
}
for key, value in settings.items():
    text = re.sub(r'(?m)^' + key + r'\s*=.*$', key + '=' + value, text)
cfg.write_text(text)

for rel in ('SDL2.dll', 'SDL2_mixer.dll', 'data/bluepal.dat',
            'data/main.pal', 'sound/bullfrog.sbk',
            'campgns/keeporig/map00001.slb'):
    if not (dist / rel).is_file():
        raise SystemExit('Incomplete KeeperFX distribution: ' + rel)

output.parent.mkdir(parents=True, exist_ok=True)
files = sorted(p for p in dist.rglob('*') if p.is_file())
with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for path in files:
        archive.write(path, path.relative_to(dist).as_posix())
print(f'Packaged {len(files)} files, including complete level maps: {output.stat().st_size} bytes')
