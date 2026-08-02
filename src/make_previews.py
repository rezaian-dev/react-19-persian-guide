#!/usr/bin/env python3
"""Page previews for the Pages site, re-cut from the edition at the density they are shown in.

    python3 src/make_previews.py            # write docs/assets/page-*.jpg
    python3 src/make_previews.py --check    # fail if the shipped images are stale

The originals were 910 x 1287 — roughly 110 dpi of an A4 page, saved small. The hero paints the
cover in a 380 px box, so on any 2x display the browser was asked for 760 px of real detail and
the file barely had it; the JPEG was compressed hard on top of that, which is why the cover read
soft and the small type on it turned to mush.

So each page is rasterised straight from the PDF vectors at 200 dpi (1654 x 2339 px) and encoded
at quality 92 with no chroma subsampling — text keeps its colour edges instead of bleeding. That
is 4.3x the pixels of the old file for about 3x the bytes, and it is also the size the gallery's
click-through wants, since each thumbnail opens its own full page.
"""
from __future__ import annotations
import argparse, io, pathlib, sys

from PIL import Image
import pymupdf

ROOT = pathlib.Path(__file__).resolve().parents[1]
PDF = ROOT / "docs" / "pdf" / "React19-Persian-Guide.pdf"
OUT = ROOT / "docs" / "assets"

DPI = 200                     # the density the hero and the click-through actually need
ZOOM = DPI / 72.0             # PDF user space is 72 pt per inch
QUALITY = 92                  # with subsampling off: no colour bleed around Persian glyphs

# file name -> the physical page it shows. These are the pages the published previews were cut
# from originally, recovered by matching the shipped images against every page of the edition.
PAGES = {
    "page-cover":     1,
    "page-toc":       2,
    "page-chapter":   39,
    "page-code":      43,
    "page-workshop":  216,
    "page-interview": 225,
}


def encode(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=QUALITY, subsampling=0, optimize=True, progressive=True)
    return buf.getvalue()


def render(doc, page_no: int) -> tuple[bytes, tuple[int, int]]:
    page = doc[page_no - 1]
    pix = page.get_pixmap(matrix=pymupdf.Matrix(ZOOM, ZOOM), alpha=False)
    want = (round(page.rect.width * ZOOM), round(page.rect.height * ZOOM))
    if abs(pix.width - want[0]) > 1 or abs(pix.height - want[1]) > 1:
        sys.exit(f"page {page_no}: got {pix.width}x{pix.height}, expected {want[0]}x{want[1]}")
    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    if img.getextrema() == ((255, 255), (255, 255), (255, 255)):
        sys.exit(f"page {page_no} rendered blank — refusing to publish an empty preview")
    return encode(img), img.size


def main() -> None:
    ap = argparse.ArgumentParser(description="re-cut the site's page previews at full quality")
    ap.add_argument("--check", action="store_true", help="compare against what is committed")
    args = ap.parse_args()
    if not PDF.exists():
        sys.exit(f"missing {PDF.relative_to(ROOT)}")
    OUT.mkdir(parents=True, exist_ok=True)
    doc = pymupdf.open(PDF)

    want: dict[str, bytes] = {}
    dims: dict[str, tuple[int, int]] = {}
    for name, pg in PAGES.items():
        if pg > doc.page_count:
            sys.exit(f"{name}: page {pg} is past the end of a {doc.page_count}-page edition")
        want[name], dims[name] = render(doc, pg)
    if len(set(dims.values())) != 1:
        sys.exit(f"the pages are not all the same size: {dims}")

    stale = []
    for name, blob in want.items():
        f = OUT / f"{name}.jpg"
        now = f.read_bytes() if f.exists() else None
        was = Image.open(f).size if f.exists() else None
        same = now == blob
        print(f"  {f.name:<20} {dims[name][0]}x{dims[name][1]}  {len(blob) / 1024:>6.0f} KiB  "
              f"(was {was[0]}x{was[1]}, {len(now) / 1024:.0f} KiB)  " if now else
              f"  {f.name:<20} {dims[name][0]}x{dims[name][1]}  {len(blob) / 1024:>6.0f} KiB  new  ",
              end="")
        print("unchanged" if same else "REWRITTEN")
        if not same:
            stale.append(f)
    if args.check:
        sys.exit(0 if not stale else f"{len(stale)} preview(s) no longer match the edition")
    for name, blob in want.items():
        if OUT / f"{name}.jpg" in stale:
            (OUT / f"{name}.jpg").write_bytes(blob)
    print(f"  wrote {len(stale)} file(s) at {DPI} dpi into {OUT.relative_to(ROOT)}/")


if __name__ == "__main__":
    main()
