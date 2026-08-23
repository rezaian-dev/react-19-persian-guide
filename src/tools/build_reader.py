#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""The online edition — every page of the PDF, readable in a browser at public/book/.

    python3 src/tools/build_reader.py            # write public/book/
    python3 src/tools/build_reader.py --check    # fail if the shipped reader is stale

The book is a typeset 178-page A4 PDF; there is no Markdown source in this repository,
so the reader is *photography of the edition*, exactly like the EPUB: each page is
rasterised straight from the PDF's own vectors and shown in reading order. That keeps the
online edition faithful to the printed layout — code windows, tables and figures included —
instead of inventing a second, lesser typesetting from extracted text.

Three numbers make that honest rather than blurry:

*  **Width.** A page is painted at most `PAINT` CSS px wide, so the file carries `RENDER` px
   — 2x — and stays sharp on a Retina display without the browser ever upscaling.
*  **Format.** WebP at q=82. The pages are type and flat colour over a white ground; at this
   width WebP holds the glyph edges while landing far under the PNG the previews use, which
   matters when a reader loads 178 of them.
*  **Loading.** Only the first two pages are eager; the rest carry `loading="lazy"` plus
   intrinsic `width`/`height`, so the page costs one screen of images and never reflows.

Navigation mirrors the PDF's own outline: `src/edition/chapters.json` gives the first page of
each of the 37 chapters, so every chapter gets an `id="ch-NN"` anchor and the site can deep
link to `book/#ch-05`. Anchors are placed by the *chapter table*, never guessed, and the
build refuses to run if a chapter points past the end of the file.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import pathlib
import shutil
import sys

import pymupdf
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
DATA = json.loads((ROOT / "src" / "edition" / "chapters.json").read_text(encoding="utf-8"))
PDF = ROOT / DATA["book"]["pdf"]
OUT = ROOT / "public" / "book"
PAGES_DIR = OUT / "pages"

PAINT = 820        # CSS px a page is painted at, at most
RENDER = PAINT * 2  # px actually stored, for 2x displays
QUALITY = 82

FA = "۰۱۲۳۴۵۶۷۸۹"


def fa(n: int | str) -> str:
    return "".join(FA[int(c)] if c.isdigit() else c for c in str(n))


def render() -> tuple[list[tuple[int, int]], int]:
    """Rasterise every page to WebP. Returns per-page (w, h) and total bytes."""
    doc = pymupdf.open(PDF)
    PAGES_DIR.mkdir(parents=True, exist_ok=True)
    dims: list[tuple[int, int]] = []
    total = 0
    for i, page in enumerate(doc, 1):
        zoom = RENDER / page.rect.width
        pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False)
        img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        buf = io.BytesIO()
        img.save(buf, "WEBP", quality=QUALITY, method=6)
        (PAGES_DIR / f"p{i:03d}.webp").write_bytes(buf.getvalue())
        total += buf.getbuffer().nbytes
        dims.append((pix.width, pix.height))
    doc.close()
    return dims, total


def chapter_anchor_map() -> dict[int, dict]:
    """page number -> chapter record that starts on it."""
    out: dict[int, dict] = {}
    for ch in DATA["chapters"]:
        out.setdefault(int(ch["page"]), ch)
    return out


def part_of(num: int) -> dict | None:
    for p in DATA["parts"]:
        if p["from"] <= num <= p["to"]:
            return p
    return None


def esc(s: str) -> str:
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
             .replace('"', "&quot;"))


def build_html(dims: list[tuple[int, int]]) -> str:
    book = DATA["book"]
    anchors = chapter_anchor_map()
    n_pages = len(dims)

    for ch in DATA["chapters"]:
        if int(ch["page"]) > n_pages:
            raise SystemExit(f"chapter {ch['num']} points at page {ch['page']} of {n_pages}")

    # ---- table of contents, grouped by part -------------------------------
    toc: list[str] = []
    for part in DATA["parts"]:
        rows = [c for c in DATA["chapters"] if part["from"] <= c["num"] <= part["to"]]
        if not rows:
            continue
        toc.append(
            f'<section class="toc-part"><h3>بخش {fa(part["num"])} · {esc(part["name"])}</h3><ol>'
        )
        for c in rows:
            toc.append(
                f'<li><a href="#ch-{c["num"]:02d}">'
                f'<span class="n">{fa(f"{c['num']:02d}")}</span>'
                f'<span class="t">{esc(c["title"])}'
                f'<em>{esc(c.get("subtitle", ""))}</em></span>'
                f'<span class="p">ص&nbsp;{fa(c["page"])}</span></a></li>'
            )
        toc.append("</ol></section>")

    # ---- the pages --------------------------------------------------------
    pages: list[str] = []
    for i, (w, h) in enumerate(dims, 1):
        ch = anchors.get(i)
        if ch:
            part = part_of(ch["num"])
            pages.append(
                f'<div class="ch-head" id="ch-{ch["num"]:02d}">'
                f'<span class="kicker">{esc(part["name"]) if part else ""}</span>'
                f'<h2>{fa(f"{ch['num']:02d}")} · {esc(ch["title"])}</h2>'
                + (f'<p>{esc(ch["subtitle"])}</p>' if ch.get("subtitle") else "")
                + "</div>"
            )
        eager = i <= 2
        pages.append(
            f'<figure class="pg" id="p-{i:03d}">'
            f'<img src="pages/p{i:03d}.webp" width="{w}" height="{h}" '
            f'alt="صفحه {fa(i)}" decoding="async" '
            f'{"" if eager else 'loading="lazy" '}/>'
            f'<figcaption>{fa(i)}</figcaption></figure>'
        )

    # shadcn/ui-style Select: items grouped under their part label, each row
    # carrying a check slot the controller lights up for the active chapter.
    nav: list[str] = []
    for part in DATA["parts"]:
        rows = [c for c in DATA["chapters"] if part["from"] <= c["num"] <= part["to"]]
        nav.append(f'<div class="select-label">بخش {fa(part["num"])} · {esc(part["name"])}</div>')
        for c in rows:
            n = fa(f"{c['num']:02d}")
            nav.append(
                f'<div class="select-item" role="option" id="jump-ch-{c["num"]:02d}" '
                f'data-value="#ch-{c["num"]:02d}" aria-selected="false">'
                f'<span class="n">{n}</span><span class="t">{esc(c["title"])}</span>'
                f'<svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
                f'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
                f'<path d="M20 6 9 17l-5-5"/></svg></div>'
            )
    nav_chapters = "".join(nav)

    title = f'{esc(book["title"])} — نسخهٔ آنلاین'
    desc = (f'خواندن آنلاین {esc(book["title"])}؛ '
            f'{fa(book["pages"])} صفحه، {fa(len(DATA["chapters"]))} فصل، رایگان و بدون دانلود.')

    return f"""<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="dark">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="https://rezaian-dev.github.io/react-19-persian-guide/book/">
<meta name="theme-color" content="#111a30">
<meta property="og:type" content="book">
<meta property="og:locale" content="fa_IR">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="https://rezaian-dev.github.io/react-19-persian-guide/book/">
<meta property="og:image" content="https://rezaian-dev.github.io/react-19-persian-guide/social-card.jpg">
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<link rel="icon" href="../favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="../icon-180.png">
<link rel="preload" href="../assets/fonts/Vazirmatn-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="pages/p001.webp" as="image">
<link rel="stylesheet" href="reader.css">
</head>
<body>
<a class="skip" href="#pages">پرش به متن کتاب</a>

<header class="bar">
  <div class="bar-in">
    <a class="home" href="../" aria-label="بازگشت به صفحهٔ کتاب">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg>
      <span>صفحهٔ کتاب</span>
    </a>

    <div class="ident">
      <strong>{esc(book["title"])}</strong>
      <span>نسخهٔ آنلاین · {fa(book["pages"])} صفحه</span>
    </div>

    <div class="tools">
      <div class="select" id="jump">
        <button type="button" class="select-trigger" aria-haspopup="listbox" aria-expanded="false" aria-label="پرش به فصل">
          <span class="select-value ph">فهرست فصل‌ها…</span>
          <svg class="select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
        </button>
        <div class="select-pop" role="listbox" aria-label="پرش به فصل" hidden>
          {nav_chapters}
        </div>
      </div>
      <button id="toc-btn" class="icon" type="button" aria-controls="toc" aria-expanded="false" aria-label="فهرست مطالب">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/></svg>
      </button>
      <a class="dl" href="../pdf/{PDF.name}" download>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19v2h16v-2"/></svg>
        <span>PDF</span>
      </a>
    </div>
  </div>
  <div class="progress"><i id="bar"></i></div>
</header>

<div class="scrim" id="scrim" hidden></div>
<aside class="toc" id="toc" hidden aria-label="فهرست مطالب">
  <div class="toc-top">
    <strong>فهرست مطالب</strong>
    <button id="toc-x" class="icon" type="button" aria-label="بستن فهرست">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
    </button>
  </div>
  <div class="toc-body">{"".join(toc)}</div>
</aside>

<main id="pages" class="pages">
{"".join(pages)}
</main>

<footer class="end">
  <p>پایان کتاب — {fa(book["pages"])} صفحه، {fa(len(DATA["chapters"]))} فصل.</p>
  <div class="end-cta">
    <a class="btn primary" href="../pdf/{PDF.name}" download>دانلود PDF</a>
    <a class="btn" href="../pdf/{PDF.name.replace('.pdf', '.epub')}" download>دانلود EPUB</a>
    <a class="btn" href="../">صفحهٔ کتاب</a>
  </div>
  <small>© {fa(book["year"])} {esc(book["author"])} · {esc(book["license"])}</small>
</footer>

<button id="top" class="to-top" type="button" aria-label="بازگشت به ابتدا" hidden>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 14 6-6 6 6"/></svg>
</button>

<script src="reader.js" defer></script>
</body>
</html>
"""


CSS = """@font-face{font-family:Vazirmatn;src:url(../assets/fonts/Vazirmatn-Regular.woff2) format("woff2");font-weight:400;font-display:swap}
@font-face{font-family:Vazirmatn;src:url(../assets/fonts/Vazirmatn-Medium.woff2) format("woff2");font-weight:500;font-display:swap}
@font-face{font-family:Vazirmatn;src:url(../assets/fonts/Vazirmatn-Bold.woff2) format("woff2");font-weight:700;font-display:swap}
@font-face{font-family:Vazirmatn;src:url(../assets/fonts/Vazirmatn-ExtraBold.woff2) format("woff2");font-weight:800;font-display:swap}
@font-face{font-family:"JetBrains Mono";src:url(../assets/fonts/JetBrainsMono-Regular.woff2) format("woff2");font-weight:400;font-display:swap}

:root{
  --bg:#111a30; --bg-2:#0e1729; --panel:#202b48; --panel-2:#182240;
  --line:hsla(0,0%,100%,.14); --line-2:hsla(0,0%,100%,.08);
  --ink:#f6f8fd; --sub:#b2bcd0; --faint:#8b95ad;
  --accent:56 189 248; --accent-2:139 92 246; --on-accent:#03101a;
  --bar-h:60px;
}
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:calc(var(--bar-h) + 14px);-webkit-text-size-adjust:100%}
body{margin:0;font-family:Vazirmatn,Tahoma,sans-serif;background:var(--bg);color:var(--ink);
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;overflow-x:hidden}
body::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;
  background:radial-gradient(50rem 34rem at 88% -6%,rgb(var(--accent)/.16),transparent 62%),
             radial-gradient(46rem 32rem at 8% 2%,rgb(var(--accent-2)/.16),transparent 64%),
             linear-gradient(180deg,#0e1729,#111a30 40%,#16203c 100%)}
a{color:inherit}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.skip{position:fixed;top:.7rem;inset-inline-start:1rem;z-index:200;transform:translateY(-8rem);
  padding:.55rem .85rem;border-radius:.6rem;font-weight:800;text-decoration:none;
  background:rgb(var(--accent));color:var(--on-accent)}
.skip:focus{transform:none}
:focus-visible{outline:3px solid rgb(var(--accent));outline-offset:3px;border-radius:8px}

/* ---------- top bar ---------- */
.bar{position:sticky;top:0;z-index:90;background:rgba(17,26,48,.86);
  backdrop-filter:blur(16px) saturate(140%);-webkit-backdrop-filter:blur(16px) saturate(140%);
  border-bottom:1px solid var(--line-2)}
.bar-in{display:flex;align-items:center;gap:12px;min-height:var(--bar-h);
  width:min(1180px,calc(100% - 28px));margin-inline:auto}
.home{display:inline-flex;align-items:center;gap:6px;flex-shrink:0;text-decoration:none;
  font-size:13px;font-weight:700;color:var(--sub);padding:8px 10px;border-radius:10px;
  border:1px solid var(--line);background:rgba(32,43,72,.6);transition:color .16s,border-color .16s}
.home:hover{color:#fff;border-color:rgb(var(--accent)/.5)}
.home svg{width:16px;height:16px}
.ident{display:grid;line-height:1.3;min-width:0;margin-inline-end:auto}
.ident strong{font-size:14px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ident span{font-size:11.5px;color:var(--faint)}
.tools{display:flex;align-items:center;gap:8px;flex-shrink:0}
/* --- chapter select (shadcn/ui Select, vanilla) --- */
.select{position:relative}
.select-trigger{display:inline-flex;align-items:center;gap:8px;min-height:38px;padding:8px 12px;
  font-family:inherit;font-size:12.5px;font-weight:700;color:var(--sub);cursor:pointer;
  background:rgba(32,43,72,.7);border:1px solid var(--line);border-radius:10px;
  transition:color .16s,border-color .16s}
.select-trigger:hover{color:#fff;border-color:rgb(var(--accent)/.55)}
.select-trigger[aria-expanded="true"]{color:#fff;border-color:rgb(var(--accent)/.75)}
.select-value{max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.select-value.ph{color:var(--faint);font-weight:600}
.select-chevron{width:15px;height:15px;flex-shrink:0;opacity:.75;transition:transform .18s}
.select-trigger[aria-expanded="true"] .select-chevron{transform:rotate(180deg)}
.select-pop{position:absolute;top:calc(100% + 8px);inset-inline-end:0;z-index:120;
  width:min(370px,88vw);max-height:min(64vh,500px);overflow-y:auto;overscroll-behavior:contain;
  padding:6px;border:1px solid var(--line);border-radius:14px;background:var(--panel-2);
  box-shadow:0 26px 64px rgba(0,0,0,.5);animation:pop .16s ease}
.select-pop[hidden]{display:none}
.select-pop::-webkit-scrollbar{width:8px}
.select-pop::-webkit-scrollbar-thumb{background:hsla(0,0%,100%,.14);border-radius:8px}
@keyframes pop{from{opacity:0;transform:translateY(-6px) scale(.98)}to{opacity:1;transform:none}}
.select-label{padding:9px 10px 4px;font-size:11px;font-weight:800;letter-spacing:.03em;
  color:rgb(var(--accent))}
.select-item{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:9px;
  padding:8px 10px;border-radius:9px;cursor:pointer;font-size:13px;font-weight:600;color:var(--sub)}
.select-item .n{font-family:"JetBrains Mono",monospace;font-size:10.5px;font-weight:700;
  color:rgb(var(--accent))}
.select-item .t{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.select-item .check{width:15px;height:15px;visibility:hidden;color:rgb(var(--accent))}
.select-item.hl{background:hsla(0,0%,100%,.07);color:#fff}
.select-item[aria-selected="true"]{color:#fff}
.select-item[aria-selected="true"] .check{visibility:visible}
.icon{display:grid;place-items:center;width:38px;height:38px;border-radius:10px;cursor:pointer;
  border:1px solid var(--line);background:rgba(32,43,72,.7);color:var(--ink)}
.icon svg{width:19px;height:19px}
.icon:hover{border-color:rgb(var(--accent)/.5)}
.dl{display:inline-flex;align-items:center;gap:6px;text-decoration:none;font-size:12.5px;font-weight:800;
  padding:9px 13px;border-radius:10px;color:var(--on-accent);
  background:linear-gradient(135deg,rgb(var(--accent)),color-mix(in srgb,rgb(var(--accent)) 70%,rgb(var(--accent-2))));
  box-shadow:0 10px 26px rgb(var(--accent)/.22)}
.dl svg{width:16px;height:16px}
.progress{height:2px;background:transparent}
.progress i{display:block;height:100%;width:0;background:rgb(var(--accent));transition:width .12s linear}

@media (max-width:760px){
  .ident span{display:none}
  .select{display:none}
  .home span{display:none}
  .home{padding:9px}
}

/* ---------- table of contents ---------- */
.scrim{position:fixed;inset:0;z-index:95;background:rgba(6,10,22,.6);
  backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);animation:fade .2s ease}
.toc{position:fixed;z-index:96;inset-block:0;inset-inline-end:0;width:min(430px,90vw);
  display:flex;flex-direction:column;background:var(--panel-2);
  border-inline-start:1px solid var(--line);box-shadow:-30px 0 70px rgba(0,0,0,.42);
  animation:slide .32s cubic-bezier(.22,1,.36,1)}
.toc[hidden],.scrim[hidden]{display:none}
.toc-top{display:flex;align-items:center;justify-content:space-between;gap:10px;
  padding:16px 18px;border-bottom:1px solid var(--line-2)}
.toc-top strong{font-size:15px;font-weight:800}
.toc-body{overflow-y:auto;padding:8px 12px 22px;overscroll-behavior:contain}
.toc-part{margin-top:14px}
.toc-part h3{margin:0 0 8px;padding:0 6px;font-size:11.5px;font-weight:800;letter-spacing:.04em;
  color:rgb(var(--accent))}
.toc-part ol{list-style:none;margin:0;padding:0;display:grid;gap:2px}
.toc-part a{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;
  padding:9px 10px;border-radius:10px;text-decoration:none;transition:background .14s}
.toc-part a:hover{background:hsla(0,0%,100%,.06)}
.toc-part a.on{background:rgb(var(--accent)/.14)}
.toc-part .n{font-family:"JetBrains Mono",monospace;font-size:11px;font-weight:700;
  color:rgb(var(--accent));min-width:20px}
.toc-part .t{display:grid;line-height:1.45;min-width:0}
.toc-part .t{font-size:13.5px;font-weight:700}
.toc-part .t em{font-style:normal;font-size:11.5px;font-weight:500;color:var(--faint);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.toc-part .p{font-size:10.5px;color:var(--faint);white-space:nowrap}

/* ---------- the pages ---------- */
.pages{width:min(820px,calc(100% - 24px));margin:26px auto 0;display:grid;gap:16px;overflow-anchor:none}
.ch-head{margin:26px 0 6px;padding:18px 20px;border-radius:16px;
  border:1px solid var(--line);background:linear-gradient(145deg,rgba(32,43,72,.9),rgba(24,34,60,.72));
  scroll-margin-top:0}
.ch-head .kicker{display:block;font-size:11px;font-weight:800;letter-spacing:.05em;
  color:rgb(var(--accent));margin-bottom:6px}
.ch-head h2{margin:0;font-size:clamp(18px,2.6vw,23px);font-weight:800;line-height:1.4}
.ch-head p{margin:6px 0 0;font-size:13.5px;color:var(--sub);line-height:1.6}
.pg{margin:0;position:relative}
.pg img{display:block;width:100%;height:auto;border-radius:12px;
  border:1px solid var(--line-2);background:#fff;box-shadow:0 14px 40px rgba(0,0,0,.3)}
.pg figcaption{position:absolute;inset-block-end:9px;inset-inline-start:9px;
  font-family:"JetBrains Mono",monospace;font-size:10px;font-weight:700;
  padding:3px 7px;border-radius:6px;color:var(--sub);background:rgba(17,26,48,.8);
  backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}

/* ---------- end ---------- */
.end{width:min(820px,calc(100% - 24px));margin:34px auto 0;padding:26px 0 40px;
  border-top:1px solid var(--line-2);text-align:center}
.end p{margin:0 0 14px;font-size:14px;font-weight:700}
.end-cta{display:flex;flex-wrap:wrap;gap:9px;justify-content:center}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:9px 16px;
  border-radius:11px;text-decoration:none;font-size:13px;font-weight:800;
  border:1px solid var(--line);background:rgba(32,43,72,.7);color:var(--ink)}
.btn.primary{border-color:transparent;color:var(--on-accent);
  background:linear-gradient(135deg,rgb(var(--accent)),color-mix(in srgb,rgb(var(--accent)) 70%,rgb(var(--accent-2))))}
.end small{display:block;margin-top:16px;font-size:11.5px;color:var(--faint)}

.to-top{position:fixed;inset-block-end:18px;inset-inline-start:18px;z-index:80;
  display:grid;place-items:center;width:44px;height:44px;border-radius:50%;cursor:pointer;
  border:1px solid var(--line);background:rgba(24,34,60,.9);color:var(--ink);
  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 10px 28px rgba(0,0,0,.35)}
.to-top[hidden]{display:none}
.to-top svg{width:20px;height:20px}

@keyframes fade{from{opacity:0}to{opacity:1}}
@keyframes slide{from{transform:translateX(-100%);opacity:.4}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  .toc,.scrim{animation:none}
}
"""

JS = """(() => {
  const toc = document.getElementById('toc');
  const scrim = document.getElementById('scrim');
  const btn = document.getElementById('toc-btn');
  const x = document.getElementById('toc-x');
  const jump = document.getElementById('jump');
  const bar = document.getElementById('bar');
  const top = document.getElementById('top');

  const open = () => {
    toc.hidden = false; scrim.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    toc.hidden = true; scrim.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  btn.addEventListener('click', () => (toc.hidden ? open() : close()));
  x.addEventListener('click', close);
  scrim.addEventListener('click', close);
  toc.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !toc.hidden) { close(); btn.focus(); }
  });

  /* --- chapter select (shadcn/ui Select behaviour: keyboard, check, outside-close) --- */
  if (jump && !jump.querySelector('select')) {
    const trigger = jump.querySelector('.select-trigger');
    const value = jump.querySelector('.select-value');
    const pop = jump.querySelector('.select-pop');
    const items = [...jump.querySelectorAll('.select-item')];
    let hl = -1;
    const setHl = (i) => {
      hl = i;
      items.forEach((it, k) => it.classList.toggle('hl', k === i));
      if (i >= 0) {
        // scroll the highlighted row inside the popover only — never the page
        const el = items[i], t = el.offsetTop, b = t + el.offsetHeight;
        if (t < pop.scrollTop) pop.scrollTop = t - 8;
        else if (b > pop.scrollTop + pop.clientHeight) pop.scrollTop = b - pop.clientHeight + 8;
      }
    };
    const setOpen = (o) => {
      pop.hidden = !o;
      trigger.setAttribute('aria-expanded', o ? 'true' : 'false');
      if (o) {
        const cur = items.findIndex((it) => it.getAttribute('aria-selected') === 'true');
        setHl(cur >= 0 ? cur : 0);
      } else setHl(-1);
    };
    const pick = (it) => {
      items.forEach((o) => o.setAttribute('aria-selected', o === it ? 'true' : 'false'));
      value.textContent = it.querySelector('.t').textContent;
      value.classList.remove('ph');
      setOpen(false);
      trigger.focus();
      document.querySelector(it.dataset.value)?.scrollIntoView({ block: 'start' });
    };
    trigger.addEventListener('click', () => setOpen(pop.hidden));
    items.forEach((it) => {
      it.addEventListener('click', () => pick(it));
      it.addEventListener('mousemove', () => setHl(items.indexOf(it)));
    });
    document.addEventListener('pointerdown', (e) => {
      if (!pop.hidden && !jump.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (pop.hidden) {
        if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && document.activeElement === trigger) {
          e.preventDefault(); setOpen(true);
        }
        return;
      }
      if (e.key === 'Escape') { setOpen(false); trigger.focus(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setHl((hl + 1) % items.length); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setHl((hl - 1 + items.length) % items.length); }
      else if (e.key === 'Home') { e.preventDefault(); setHl(0); }
      else if (e.key === 'End') { e.preventDefault(); setHl(items.length - 1); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (items[hl]) pick(items[hl]); }
    });
    // keep the trigger label in sync with the chapter on screen
    window.__selectSync = (id) => {
      const it = items.find((o) => o.dataset.value === '#' + id);
      if (!it) return;
      items.forEach((o) => o.setAttribute('aria-selected', o === it ? 'true' : 'false'));
      value.textContent = it.querySelector('.t').textContent;
      value.classList.remove('ph');
    };
  }

  top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  let tick = false;
  const onScroll = () => {
    if (tick) return;
    tick = true;
    requestAnimationFrame(() => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
      top.hidden = window.scrollY < 900;
      tick = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // A hash landing happens before the lazy images above it have decoded; once the
  // column has settled, put the chapter head exactly under the bar.
  const settle = (hash) => {
    const el = hash && document.querySelector(hash);
    if (!el) return;
    let n = 0;
    const fix = () => {
      el.scrollIntoView({ block: 'start', behavior: 'auto' });
      if (++n < 3) setTimeout(fix, 220);
    };
    setTimeout(fix, 60);
  };
  if (location.hash) {
    addEventListener('load', () => settle(location.hash));
    settle(location.hash);
  }
  addEventListener('hashchange', () => settle(location.hash));

  // highlight the chapter currently on screen
  const heads = [...document.querySelectorAll('.ch-head')];
  const links = new Map([...document.querySelectorAll('.toc-part a')].map((a) => [a.getAttribute('href').slice(1), a]));
  if ('IntersectionObserver' in window && heads.length) {
    let active = null;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const a = links.get(en.target.id);
        if (!a || a === active) return;
        active?.classList.remove('on');
        a.classList.add('on');
        active = a;
        window.__selectSync?.(en.target.id);
      });
    }, { rootMargin: '-15% 0px -70% 0px' });
    heads.forEach((h) => io.observe(h));
  }
})();
"""


def digest(paths) -> str:
    h = hashlib.sha256()
    for p in sorted(paths):
        h.update(p.name.encode())
        h.update(p.read_bytes())
    return h.hexdigest()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="fail if public/book is stale")
    args = ap.parse_args()

    if not PDF.exists():
        raise SystemExit(f"missing {PDF}")

    if args.check:
        html = OUT / "index.html"
        if not html.exists():
            print("reader: MISSING"); return 1
        n = len(list(PAGES_DIR.glob("p*.webp")))
        want = pymupdf.open(PDF).page_count
        if n != want:
            print(f"reader: STALE — {n} page images, PDF has {want}"); return 1
        body = html.read_text(encoding="utf-8")
        for ch in DATA["chapters"]:
            if f'id="ch-{ch["num"]:02d}"' not in body:
                print(f"reader: STALE — missing anchor ch-{ch['num']:02d}"); return 1
        print(f"reader: OK — {n} pages, {len(DATA['chapters'])} anchors")
        return 0

    if OUT.exists():
        shutil.rmtree(OUT)
    dims, total = render()
    (OUT / "index.html").write_text(build_html(dims), encoding="utf-8")
    (OUT / "reader.css").write_text(CSS, encoding="utf-8")
    (OUT / "reader.js").write_text(JS, encoding="utf-8")

    print(f"pages   : {len(dims)}")
    print(f"anchors : {len(DATA['chapters'])}")
    print(f"images  : {total/1048576:.1f} MB  (avg {total/len(dims)/1024:.0f} KB)")
    print(f"written : {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
