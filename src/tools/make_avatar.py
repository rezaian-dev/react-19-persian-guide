#!/usr/bin/env python3
"""The round author avatar for the README footer, cut from the portrait the cover embeds.

    python3 src/tools/make_avatar.py      # write src/assets/avatar.png
    python3 src/make_avatar.py --check    # fail if the shipped file is stale

`src/author-sq.png` is the 400 x 400 master portrait and stays untouched. The README footer is a different job: a small
round headshot. Painting the master square into a 72 px box left the browser to do the resampling
and the corners hard, which is exactly what looked cheap.

So the avatar is a file made for its box:
*  the head is framed first (the cover's portrait has room around it that a small circle wastes),
*  the disc is resampled once, with Lanczos, at `AVATAR` px — twice the `PAINT` px the README
   asks for, so the picture stays sharp on a 2× display and the browser never has to upscale,
*  the circle is anti-aliased at 4× and carried in the alpha channel, so the corners are
   transparent instead of grey and the avatar sits on light and dark themes alike.
"""
from __future__ import annotations
import argparse, io, pathlib, sys

from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / "src" / "author-sq.png"
OUT = ROOT / "src" / "assets" / "avatar.png"

AVATAR = 240        # px, the file
PAINT = 120         # px, the README box — the file is 2× it
CROP = 0.90         # keep this share of the source square, centred on the head
CENTRE_Y = 0.46     # the head sits a little above the middle of the portrait
SS = 4              # supersampling factor for the mask edge


def build(src: Image.Image) -> bytes:
    if src.size[0] != src.size[1]:
        sys.exit(f"{SRC.name} is {src.size[0]}×{src.size[1]} — the portrait is expected square")
    w = src.size[0]
    side = round(w * CROP)
    x = (w - side) // 2
    y = min(max(round(w * CENTRE_Y) - side // 2, 0), w - side)
    head = src.convert("RGB").crop((x, y, x + side, y + side))
    if side < AVATAR:
        sys.exit(f"the source gives only {side} px for a {AVATAR} px avatar — refusing to upscale")
    disc = head.resize((AVATAR, AVATAR), Image.LANCZOS)

    mask = Image.new("L", (AVATAR * SS, AVATAR * SS), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, AVATAR * SS - 1, AVATAR * SS - 1), fill=255)
    disc.putalpha(mask.resize((AVATAR, AVATAR), Image.LANCZOS))

    buf = io.BytesIO()
    disc.save(buf, "PNG", optimize=True, compress_level=9)
    blob = buf.getvalue()
    back = Image.open(io.BytesIO(blob))
    back.load()
    if back.size != disc.size or back.tobytes() != disc.tobytes():
        sys.exit("PNG round-trip is not pixel-identical — refusing to write a lossy file")
    return blob


def main() -> None:
    ap = argparse.ArgumentParser(description="cut the round README avatar from the portrait")
    ap.add_argument("--check", action="store_true", help="compare against what is committed")
    args = ap.parse_args()
    if not SRC.exists():
        sys.exit(f"missing {SRC.relative_to(ROOT)} — the master portrait is missing")
    src = Image.open(SRC)
    blob = build(src)
    now = OUT.read_bytes() if OUT.exists() else None
    same = now == blob
    print(f"  {OUT.name:<20} {AVATAR}×{AVATAR}  {len(blob) / 1024:>6.0f} KiB  RGBA  "
          f"painted at {PAINT} px ({AVATAR // PAINT}× density)  "
          + ("unchanged" if same else ("STALE" if now else "new")))
    if args.check:
        sys.exit(0 if same else f"{OUT.relative_to(ROOT)} no longer matches {SRC.name}")
    if not same:
        OUT.write_bytes(blob)
        print(f"  wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
