# -*- coding: utf-8 -*-
"""
EPUB 3 builder — reuses the Markdown pipeline from build.py so the content is
byte-identical to the PDF, but re-styled for reflowable RTL e-readers.
Usage: python3 build_epub.py
"""
import re, html, pathlib, io, time, uuid
from ebooklib import epub
from PIL import Image

import build as B  # md, preprocess, parse_chapter, PARTS, CH_DIR

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "pdf" / "React19-Persian-Guide.epub"

EPUB_CSS = """
@font-face { font-family: "Vazirmatn"; src: url("../fonts/Vazirmatn-Regular.ttf"); font-weight: 400; }
@font-face { font-family: "Vazirmatn"; src: url("../fonts/Vazirmatn-Bold.ttf"); font-weight: 700; }
@font-face { font-family: "JetBrains Mono"; src: url("../fonts/JetBrainsMono-Regular.ttf"); font-weight: 400; }

html { }
body { font-family: "Vazirmatn", sans-serif; line-height: 1.85; color: #1e293b; margin: 0; padding: 0 0.4em; text-align: right; }
p { margin: 0 0 0.75em; text-align: justify; }
h1, h2, h3, h4 { font-family: "Vazirmatn", sans-serif; color: #0f172a; line-height: 1.4; page-break-after: avoid; }
h1.chapter-title { font-size: 1.7em; margin: 0.4em 0 0.2em; }
.chapter-num { display: inline-block; font-family: "JetBrains Mono", monospace; color: #0891b2; font-size: 0.85em; letter-spacing: 1px; margin-bottom: 0.3em; }
.lead { color: #475569; font-size: 1.02em; border-right: 3px solid #0891b2; padding-right: 0.7em; margin: 0.8em 0 1.2em; }
h2 { font-size: 1.32em; margin: 1.5em 0 0.5em; }
h3 { font-size: 1.12em; margin: 1.2em 0 0.4em; }
/* same heading treatment as the PDF: accent bar + soft cyan band (h2), small diamond (h3);
   the .hx wrapper comes from build.py's heading renderer */
h2 .hx { display: block; padding: 0.2em 0.6em 0.2em 0.5em; border-right: 4px solid #0891b2; border-radius: 0 6px 6px 0;
         background: linear-gradient(to left, #ecfeff, rgba(236,254,255,0) 70%); }
h3 .hx::before { content: "\25C6"; color: #0891b2; font-size: 0.55em; margin-left: 0.6em; vertical-align: 0.3em; }
h4 { font-size: 1em; color: #0e7490; margin: 1em 0 0.3em; }
ul, ol { margin: 0.3em 0 0.9em; padding: 0 1.4em 0 0; }
li { margin-bottom: 0.25em; }
pre, code { font-variant-ligatures: none; font-feature-settings: "calt" 0, "liga" 0; }
code { font-family: "JetBrains Mono", monospace; font-size: 0.86em; background: #f1f5f9; color: #155e75; padding: 0 0.25em; border-radius: 3px; }
.code { text-align: left; margin: 0.8em 0 1.1em; border-radius: 8px; overflow: hidden; background: #272822; page-break-inside: avoid; }
.code-head { background: #1e293b; color: #94a3b8; font-family: "JetBrains Mono", monospace; font-size: 0.72em; padding: 0.45em 0.8em; }
.dots { display: none; }
.code pre { margin: 0; padding: 0.8em 0.9em; color: #f8f8f2; font-family: "JetBrains Mono", monospace; font-size: 0.78em; line-height: 1.55; white-space: pre-wrap; word-wrap: break-word; }
.code pre code { background: transparent; color: inherit; padding: 0; font-size: 1em; }
.tbl-wrap { margin: 0.8em 0 1.1em; overflow-x: auto; }
table { border-collapse: collapse; width: 100%; font-size: 0.9em; }
th { background: #0891b2; color: #fff; padding: 0.45em 0.6em; text-align: right; font-weight: 700; }
td { padding: 0.4em 0.6em; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
tr:nth-child(even) td { background: #f8fafc; }
.callout { border-right: 4px solid; border-radius: 8px; padding: 0.7em 0.9em 0.3em; margin: 0.9em 0 1.1em; font-size: 0.95em; }
.callout-title { font-weight: 700; margin-bottom: 0.35em; }
.callout-note { background: #f0f9ff; border-color: #0369a1; } .callout-note .callout-title { color: #0369a1; }
.callout-tip { background: #ecfdf5; border-color: #047857; } .callout-tip .callout-title { color: #047857; }
.callout-warn { background: #fffbeb; border-color: #b45309; } .callout-warn .callout-title { color: #b45309; }
.callout-danger { background: #fef2f2; border-color: #b91c1c; } .callout-danger .callout-title { color: #b91c1c; }
.callout-interview { background: #f5f3ff; border-color: #7c3aed; } .callout-interview .callout-title { color: #6d28d9; }
.callout-project { background: #f0fdfa; border-color: #0d9488; } .callout-project .callout-title { color: #0f766e; }
.callout-exercise { background: #fdf4ff; border-color: #a21caf; } .callout-exercise .callout-title { color: #a21caf; }
.callout-summary { background: #f8fafc; border-color: #475569; } .callout-summary .callout-title { color: #334155; }
.cols { margin: 0.8em 0; }
.col { border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.6em 0.8em 0.2em; margin-bottom: 0.7em; background: #f8fafc; }
.col.good { background: #ecfdf5; border-color: #6ee7b7; } .col.bad { background: #fef2f2; border-color: #fecaca; }
.col-title { font-weight: 700; margin-bottom: 0.3em; }
.col.good .col-title { color: #047857; } .col.bad .col-title { color: #b91c1c; }
.flow { text-align: center; margin: 0.8em 0; }
.flow .box { display: inline-block; border: 1px solid #a5f3fc; background: #ecfeff; border-radius: 8px; padding: 0.4em 0.7em; margin: 0.25em; font-size: 0.85em; }
.flow .box b { display: block; font-family: "JetBrains Mono", monospace; color: #0891b2; }
.flow .arrow { display: inline-block; color: #94a3b8; margin: 0 0.2em; }
.checklist ul { list-style: none; padding-right: 0.2em; }
.checklist li::before { content: "☐ "; color: #0891b2; }
.glossary td:first-child { font-family: "JetBrains Mono", monospace; text-align: left; white-space: nowrap; font-size: 0.9em; }
hr { border: 0; border-top: 1px solid #e2e8f0; margin: 1.5em 0; }
strong { color: #0f172a; }

/* front matter */
.cover { text-align: center; padding: 2em 0; }
.cover .kicker { font-family: "JetBrains Mono", monospace; letter-spacing: 3px; color: #0891b2; font-size: 0.75em; }
.cover h1 { font-size: 2em; margin: 0.4em 0 0.2em; }
.cover .ver { font-family: "JetBrains Mono", monospace; font-size: 1.5em; color: #0891b2; }
.cover .sub { color: #475569; font-size: 1.05em; margin: 0.8em 0 1.4em; }
.cover .author { color: #334155; font-size: 0.95em; }
.part-title { text-align: center; padding: 3em 0; }
.part-title .n { font-family: "JetBrains Mono", monospace; color: #0891b2; letter-spacing: 3px; font-size: 0.8em; }
.part-title h1 { font-size: 1.8em; margin: 0.3em 0 0.2em; }
.part-title p { color: #64748b; text-align: center; }
.toc-list { list-style: none; padding: 0; }
.toc-list li { padding: 0.35em 0; border-bottom: 1px dashed #e2e8f0; }
.toc-list li.toc-part { border: 0; margin-top: 1em; font-weight: 700; color: #0e7490; }
.toc-list .n { font-family: "JetBrains Mono", monospace; color: #0891b2; display: inline-block; min-width: 2em; }
.toc-part { font-weight: 700; color: #0f172a; margin: 1.2em 0 0.3em; }
"""

PART_NAMES = {"1": "PART 01", "2": "PART 02", "3": "PART 03", "4": "PART 04"}


def fix_pre_code(body: str) -> str:
    """Our fence renderer emits <pre>{highlighted}</pre>; keep as-is but make sure
    inline-style spans survive (ebooklib is fine with them)."""
    return body


def make_cover_png() -> bytes:
    """Rasterize the PDF cover page as the EPUB cover image (1200px tall)."""
    import pymupdf
    pdf = ROOT / "docs" / "pdf" / "React19-Persian-Guide.pdf"
    doc = pymupdf.open(str(pdf))
    pix = doc[0].get_pixmap(dpi=150)
    im = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    im = im.resize((int(im.width * 1600 / im.height), 1600), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=88, optimize=True)
    return buf.getvalue()


def xhtml(title: str, body: str) -> str:
    """Return well-formed XHTML *body content* (ebooklib wraps it in <html>/<head>).
    markdown-it emits HTML5 (void tags like <br>, unescaped &); normalise via lxml."""
    from lxml import html as LH, etree
    frag = LH.fragment_fromstring(body, create_parent="div")
    frag.set("dir", "rtl")
    for el in frag.iter():
        cls = el.get("class", "")
        if el.tag == "pre" or "code " in cls + " " and el.tag == "div" or cls in ("chapter-num", "flow", "kicker", "ver", "n"):
            el.set("dir", "ltr")
        if el.tag == "code" and el.getparent() is not None and el.getparent().tag != "pre":
            el.set("dir", "ltr")
        if el.tag == "td" and el.getparent() is not None:
            row = el.getparent(); tbl = row.getparent()
            while tbl is not None and tbl.tag != "table": tbl = tbl.getparent()
            if tbl is not None and tbl.getparent() is not None and "glossary" in (tbl.getparent().get("class","") + " " + (tbl.getparent().getparent().get("class","") if tbl.getparent().getparent() is not None else "")) and row.index(el) == 0:
                el.set("dir", "ltr")
    # remove epub:type attrs (namespace not declared in fragment) — harmless
    for el in frag.iter():
        for k in list(el.attrib):
            if k.startswith("epub:"):
                del el.attrib[k]
    return etree.tostring(frag, method="xml", encoding="unicode")


def build():
    t0 = time.time()
    book = epub.EpubBook()
    book.set_identifier("urn:uuid:" + str(uuid.uuid5(uuid.NAMESPACE_URL, "react-19-persian-guide/1.0")))
    book.set_title("راهنمای جامع و حرفه‌ای React 19")
    book.set_language("fa")
    book.add_author("محمدرضا رضائیان")
    book.add_metadata("DC", "description", "مرجع فارسی React 19.2 — از مبانی تا معماری Production-Level")
    book.add_metadata("DC", "publisher", "rezaian-dev")
    book.add_metadata("DC", "date", "2026")
    book.add_metadata("DC", "rights", "CC BY-NC-SA 4.0")
    book.set_direction("rtl")

    # styles + fonts
    css = epub.EpubItem(uid="style", file_name="styles/book.css", media_type="text/css", content=EPUB_CSS.encode("utf-8"))
    book.add_item(css)
    for fn in ["Vazirmatn-Regular.ttf", "Vazirmatn-Bold.ttf", "JetBrainsMono-Regular.ttf"]:
        book.add_item(epub.EpubItem(uid=fn, file_name=f"fonts/{fn}", media_type="font/ttf", content=(ROOT / "src" / "fonts" / fn).read_bytes()))

    # cover
    book.set_cover("images/cover.jpg", make_cover_png(), create_page=True)

    # title page
    title_body = f"""
<section class="cover" epub:type="titlepage">
  <div class="kicker">PERSIAN DEVELOPER HANDBOOK</div>
  <h1>راهنمای جامع و حرفه‌ای</h1>
  <div class="ver">React 19.2</div>
  <p class="sub">از مبانی تا معماری Production-Level</p>
  <p class="author">گردآوری و تدوین: <b>محمدرضا رضائیان</b><br/>Front-End Developer · {B.EDITION}</p>
  <p class="author" style="font-size:.85em;color:#64748b">github.com/rezaian-dev/react-19-persian-guide</p>
</section>"""
    title_page = epub.EpubHtml(title="صفحه عنوان", file_name="title.xhtml", lang="fa", direction="rtl")
    title_page.content = xhtml("صفحه عنوان", title_body); title_page.add_item(css); book.add_item(title_page)

    # chapters
    files = sorted(B.CH_DIR.glob("*.md"))
    chapters, spine, toc = [], ["nav", title_page], []
    part_sections = {}
    toc_entries_html = []
    current_part = None
    for f in files:
        meta, body = B.parse_chapter(f)
        num, part = meta["num"], meta.get("part", "1")
        if part != current_part:
            current_part = part
            pn, pt = B.PARTS[part]
            ph = epub.EpubHtml(title=f"{pn} — {pt}", file_name=f"part-{part}.xhtml", lang="fa", direction="rtl")
            ph.content = xhtml(pn, f'<section class="part-title"><div class="n">{PART_NAMES[part]}</div><h1>{pn}</h1><p>{pt}</p></section>')
            ph.add_item(css); book.add_item(ph); spine.append(ph)
            part_sections[part] = (epub.Section(f"{pn} · {pt}", href=ph.file_name), [])
            toc_entries_html.append(f'<li class="toc-part">{pn} · {pt}</li>')
        html_body = B.md.render(B.preprocess(body))
        lead = f'<p class="lead">{B.md.renderInline(meta["lead"])}</p>' if meta.get("lead") else ""
        title_html = B.md.renderInline(meta["title"])
        body_html = f'<section class="chapter" id="ch-{num}"><div class="chapter-num">CHAPTER {num}</div><h1 class="chapter-title">{title_html}</h1>{lead}{html_body}</section>'
        ch = epub.EpubHtml(title=re.sub("<[^>]+>", "", title_html), file_name=f"ch-{num}.xhtml", lang="fa", direction="rtl")
        ch.content = xhtml(meta["title"], body_html); ch.add_item(css)
        book.add_item(ch); spine.append(ch); part_sections[part][1].append(ch)
        toc_entries_html.append(f'<li><span class="n">{num}</span> <a href="ch-{num}.xhtml">{title_html}</a></li>')
        print(f"  + {f.name}")

    # visible TOC page (in addition to nav)
    toc_body = '<h1 class="chapter-title">فهرست مطالب</h1><ul class="toc-list">' + "".join(toc_entries_html) + "</ul>"
    toc_page = epub.EpubHtml(title="فهرست مطالب", file_name="toc.xhtml", lang="fa", direction="rtl")
    toc_page.content = xhtml("فهرست مطالب", toc_body); toc_page.add_item(css); book.add_item(toc_page)
    spine.insert(2, toc_page)

    # closing
    close = epub.EpubHtml(title="پایان", file_name="closing.xhtml", lang="fa", direction="rtl")
    close.content = xhtml("پایان", """<section class="cover"><div class="kicker">THE END</div><h1>موفق باشید 🚀</h1>
<p class="sub">اگر این کتاب برایتان مفید بود، آن را با توسعه‌دهندگان دیگر به اشتراک بگذارید و در مخزن گیت‌هاب با یک Star از آن حمایت کنید.</p>
<p class="author">github.com/rezaian-dev/react-19-persian-guide<br/>github.com/rezaian-dev/nextjs-16-persian-guide</p></section>""")
    close.add_item(css); book.add_item(close); spine.append(close)

    book.toc = [epub.Link("title.xhtml", "صفحه عنوان", "title"), epub.Link("toc.xhtml", "فهرست مطالب", "toc")] + \
               [(sec, chs) for sec, chs in part_sections.values()] + [epub.Link("closing.xhtml", "پایان", "closing")]
    book.add_item(epub.EpubNcx()); book.add_item(epub.EpubNav())
    book.spine = spine
    epub.write_epub(str(OUT), book, {"epub3_pages": False})
    print(f"EPUB written -> {OUT} ({OUT.stat().st_size//1024} KB) in {time.time()-t0:.1f}s")


if __name__ == "__main__":
    build()
