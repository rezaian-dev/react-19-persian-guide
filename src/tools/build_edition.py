# -*- coding: utf-8 -*-
"""
Build script: Markdown chapters  ->  styled HTML  ->  PDF (WeasyPrint)
Design language mirrors the Next.js 16 Persian Guide (Vazirmatn + JetBrains Mono,
indigo accent, Monokai code windows, callout cards).
"""
import re, html, pathlib, sys, time
from markdown_it import MarkdownIt
from pygments import highlight
from pygments.lexers import get_lexer_by_name, TextLexer
from pygments.formatters import HtmlFormatter
from weasyprint import HTML

ROOT = pathlib.Path(__file__).parent
CH_DIR = ROOT / "chapters"
OUT_PDF = ROOT / "React19-Persian-Guide.pdf"
OUT_HTML = ROOT / "build" / "book.html"

PARTS = {
    "1": ("بخش یکم", "بنیادها و مفاهیم اصلی"),
    "2": ("بخش دوم", "پیشرفته، معماری و Production"),
    "3": ("بخش سوم", "کارگاه عملی و نکات طلایی"),
    "4": ("بخش چهارم", "مرجع سریع و آمادگی مصاحبه"),
}

CALLOUT_TITLES = {
    "note": "نکته",
    "tip": "نکته حرفه‌ای",
    "warn": "هشدار",
    "danger": "اشتباه رایج",
    "interview": "سؤالات مصاحبه (با پاسخ)",
    "project": "مینی‌پروژه",
    "exercise": "تمرین",
    "summary": "جمع‌بندی فصل",
    "compare": "مقایسه",
}

FA_DIGITS = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")

# ----------------------------------------------------------------------------
# Markdown parsing
# ----------------------------------------------------------------------------
md = MarkdownIt("commonmark", {"html": True, "typographer": False}).enable("table").enable("strikethrough")

PRINT_MODE = "--print" in sys.argv
MAX_CODE_LINES = 40   # longest listing that fits on one page together with its title bar
BOOK_VERSION = "1.0.3"   # printed on the cover foot and the closing page (CHANGELOG.md has the history)
EDITION = f"نسخه ۲۰۲۶ · ویرایش {BOOK_VERSION.translate(FA_DIGITS)}"   # closing page + metadata only
COVER_EDITION = "نسخه ۲۰۲۶"                                                 # the cover carries no build number
formatter = HtmlFormatter(nowrap=True, noclasses=True, style="bw" if PRINT_MODE else "monokai")


def render_fence(self, tokens, idx, options, env):
    tok = tokens[idx]
    info = (tok.info or "").strip()
    lang = info.split(" ")[0] if info else "text"
    m = re.search(r'title="([^"]*)"', info)
    title = m.group(1) if m else ""
    code = tok.content.rstrip("\n")
    try:
        lexer = get_lexer_by_name(lang)
    except Exception:
        lexer = TextLexer()
    body = highlight(code, lexer, formatter)
    # Pygments marks unknown modern syntax (CSS nesting, @starting-style, TS edge cases)
    # as Error tokens with a red box; render those as plain text instead.
    body = re.sub(r'<span style="color: #ed007e; background-color: #1E0010">', '<span style="color: #f8f8f2">', body, flags=re.I)
    nlines = code.count("\n") + 1
    cls = "code"
    # A code window is never split across pages (.code { break-inside: avoid }).  The page
    # body holds ~44 code lines, so any listing longer than MAX_CODE_LINES would silently
    # overflow the page; fail the build instead so the author splits the listing in Markdown.
    if nlines > MAX_CODE_LINES:
        raise SystemExit(
            f"code block '{title or lang}' has {nlines} lines (> {MAX_CODE_LINES}); "
            "split it into two windows so it fits on one page"
        )
    if "nohead" in info:
        return f'<div class="{cls} bare"><pre>{body}</pre></div>\n'
    label = html.escape(title) if title else (lang.upper() if lang != "text" else "")
    head = (
        '<div class="code-head"><span class="dots"><i></i><i></i><i></i></span>'
        f'<span class="fname">{label}</span></div>'
    )
    return f'<div class="{cls}">{head}<pre>{body}</pre></div>\n'


md.add_render_rule("fence", render_fence)


def render_table_open(self, tokens, idx, options, env):
    return '<div class="tbl-wrap"><table>'


def render_table_close(self, tokens, idx, options, env):
    return "</table></div>"


md.add_render_rule("table_open", render_table_open)
md.add_render_rule("table_close", render_table_close)


def render_heading_open(self, tokens, idx, options, env):
    """Section headings keep their block box (pagination is untouched); the decoration —
    diamond marker + fading hairline — lives on an inner flex wrapper (`.hx`)."""
    tag = tokens[idx].tag
    if tag in ("h2", "h3"):
        return f'<{tag}><span class="hx"><span class="hx-t">'
    return f"<{tag}>"


def render_heading_close(self, tokens, idx, options, env):
    tag = tokens[idx].tag
    if tag in ("h2", "h3"):
        return f"</span></span></{tag}>\n"
    return f"</{tag}>\n"


md.add_render_rule("heading_open", render_heading_open)
md.add_render_rule("heading_close", render_heading_close)


def convert_tasklists(text: str) -> str:
    """Wrap runs of `- [ ]` items in a .checklist div and strip the brackets."""
    lines = text.split("\n")
    out, i = [], 0
    while i < len(lines):
        if re.match(r"^\s*- \[[ xX]\] ", lines[i]):
            out += ['<div class="checklist">', ""]
            while i < len(lines) and re.match(r"^\s*- \[[ xX]\] ", lines[i]):
                out.append(re.sub(r"^(\s*)- \[[ xX]\] ", r"\1- ", lines[i]))
                i += 1
            out += ["", "</div>"]
            continue
        out.append(lines[i]); i += 1
    return "\n".join(out)


def preprocess(text: str) -> str:
    """Convert ::: containers into HTML wrappers understood by markdown-it."""
    text = convert_tasklists(text)
    out = []
    stack = []
    for line in text.split("\n"):
        m = re.match(r"^:::\s*([a-z]+)(?:\s+(.*))?$", line)
        if m:
            typ, title = m.group(1), (m.group(2) or "").strip()
            if typ == "cols":
                out.append('<div class="cols">')
                out.append("")
                stack.append("cols")
                continue
            if typ == "col":
                cls = "col"
                mm = re.match(r"^(good|bad)\s+(.*)$", title)
                if mm:
                    cls += " " + mm.group(1)
                    title = mm.group(2)
                out.append(f'<div class="{cls}"><div class="col-title">{html.escape(title)}</div>')
                out.append("")
                stack.append("col")
                continue
            if typ == "steps":
                out.append('<div class="steps">')
                out.append("")
                stack.append("steps")
                continue
            title = title or CALLOUT_TITLES.get(typ, "")
            out.append(f'<div class="callout callout-{typ}"><div class="callout-title">{html.escape(title)}</div>')
            out.append("")
            stack.append("callout")
            continue
        if line.strip() == ":::":
            out.append("")
            out.append("</div>")
            if stack:
                stack.pop()
            continue
        out.append(line)
    return "\n".join(out)


def parse_chapter(path: pathlib.Path):
    raw = path.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", raw, re.S)
    meta = {}
    body = raw
    if m:
        for ln in m.group(1).split("\n"):
            if ":" in ln:
                k, v = ln.split(":", 1)
                meta[k.strip()] = v.strip()
        body = m.group(2)
    meta.setdefault("num", path.stem[:2])
    return meta, body


FIGURE_OPEN = r'<div class="(?:code|tbl-wrap|cols|flow|facts|diagram|steps)[ "]'
_P_BEFORE_FIGURE = re.compile(r'<p>((?:(?!</p>).)*?)</p>(\s*)(?=' + FIGURE_OPEN + ')', re.S)
_P_BEFORE_LIST = re.compile(r'<p>((?:(?!</p>).)*?[:：])</p>(\s*)(?=<(?:ul|ol)[ >])', re.S)
_LIST_BEFORE_FIGURE = re.compile(r'</(ul|ol)>(\s*)(?=' + FIGURE_OPEN + ')')


def keep_with_next(html_body: str) -> str:
    """Pagination: whatever introduces a code window / table / diagram (the paragraph or the
    list right before it) must never be orphaned at the bottom of a page while its figure
    starts on the next one.  Also keeps a colon-terminated paragraph with the first item of
    the list it introduces.  (A callout that explains a snippet should contain the snippet.)"""
    html_body = _P_BEFORE_FIGURE.sub(lambda m: f'<p class="keep-next">{m.group(1)}</p>{m.group(2)}', html_body)
    html_body = _P_BEFORE_LIST.sub(lambda m: f'<p class="keep-next">{m.group(1)}</p>{m.group(2)}', html_body)
    # a list ending right before a figure: mark the list's last item (a `ul.keep-next` would
    # need break-after on the ul itself, which WeasyPrint honours less reliably than on <li>)
    html_body = _LIST_BEFORE_FIGURE.sub(lambda m: f'</{m.group(1)}>{m.group(2)}', html_body)
    html_body = re.sub(r'<li>((?:(?!<li>).)*?)</li>\n</(ul|ol)>(\s*)(?=' + FIGURE_OPEN + ')',
                       lambda m: f'<li class="keep-next">{m.group(1)}</li>\n</{m.group(2)}>{m.group(3)}', html_body, flags=re.S)
    return html_body


def render_chapter(meta, body):
    num = meta["num"]
    cid = f"ch-{num}"
    html_body = keep_with_next(md.render(preprocess(body)))
    lead = f'<p class="lead">{md.renderInline(meta["lead"])}</p>' if meta.get("lead") else ""
    title_html = md.renderInline(meta["title"])
    fa_num = str(int(num)).translate(FA_DIGITS)
    # running footer label; `short:` front-matter overrides titles too long for the 80 mm box
    run_title = html.escape(meta.get("short") or re.sub(r"<[^>]+>", "", title_html))
    return f"""
<section class="chapter" id="{cid}">
  <div class="chapter-head">
    <span class="chapter-num">{num}</span>
    <h1 class="chapter-title" data-num="{num}" data-label="فصل {fa_num} · {run_title}">{title_html}</h1>
  </div>
  {lead}
  {html_body}
</section>
"""


# ----------------------------------------------------------------------------
# Static parts: cover, TOC, closing
# ----------------------------------------------------------------------------
REACT_LOGO = """<svg viewBox="-11.5 -10.23174 23 20.46348" xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}">
<circle cx="0" cy="0" r="2.05" fill="{c}"/>
<g stroke="{c}" stroke-width="1" fill="none">
<ellipse rx="11" ry="4.2"/><ellipse rx="11" ry="4.2" transform="rotate(60)"/><ellipse rx="11" ry="4.2" transform="rotate(120)"/>
</g></svg>"""


# Official marks, simplified for WeasyPrint's SVG renderer (no <mask>/<filter> support):
# TypeScript — microsoft/TypeScript-Website branding/ts-logo-128.svg; Vite — vitejs/vite docs/public/logo.svg (2026 mark).
TS_LOGO = """<svg viewBox="0 0 128 128" width="{s}" height="{s}" xmlns="http://www.w3.org/2000/svg"><rect fill="#3178c6" height="128" rx="14" width="128"/><path clip-rule="evenodd" fill-rule="evenodd" fill="#fff" d="m74.2622 99.468v14.026c2.2724 1.168 4.9598 2.045 8.0625 2.629 3.1027.585 6.3728.877 9.8105.877 3.3503 0 6.533-.321 9.5478-.964 3.016-.643 5.659-1.702 7.932-3.178 2.272-1.476 4.071-3.404 5.397-5.786 1.325-2.381 1.988-5.325 1.988-8.8313 0-2.5421-.379-4.7701-1.136-6.6841-.758-1.9139-1.85-3.6159-3.278-5.1062-1.427-1.4902-3.139-2.827-5.134-4.0104-1.996-1.1834-4.246-2.3011-6.752-3.353-1.8352-.7597-3.4812-1.4975-4.9378-2.2134-1.4567-.7159-2.6948-1.4464-3.7144-2.1915-1.0197-.7452-1.8063-1.5341-2.3598-2.3669-.5535-.8327-.8303-1.7751-.8303-2.827 0-.9643.2476-1.8336.7429-2.6079s1.1945-1.4391 2.0976-1.9943c.9031-.5551 2.0101-.9861 3.3211-1.2929 1.311-.3069 2.7676-.4603 4.3699-.4603 1.1658 0 2.3958.0877 3.6928.263 1.296.1753 2.6.4456 3.911.8109 1.311.3652 2.585.8254 3.824 1.3806 1.238.5552 2.381 1.198 3.43 1.9285v-13.1051c-2.127-.8182-4.45-1.4245-6.97-1.819s-5.411-.5917-8.6744-.5917c-3.3211 0-6.4674.3579-9.439 1.0738-2.9715.7159-5.5862 1.8336-7.844 3.353-2.2578 1.5195-4.0422 3.4553-5.3531 5.8075-1.311 2.3522-1.9665 5.1646-1.9665 8.4373 0 4.1785 1.2017 7.7433 3.6052 10.6945 2.4035 2.9513 6.0523 5.4496 10.9466 7.495 1.9228.7889 3.7145 1.5633 5.375 2.323 1.6606.7597 3.0954 1.5486 4.3044 2.3668s2.1628 1.7094 2.8618 2.6736c.7.9643 1.049 2.06 1.049 3.2873 0 .9062-.218 1.7462-.655 2.5202s-1.1 1.446-1.9885 2.016c-.8886.57-1.9956 1.016-3.3212 1.337-1.3255.321-2.8768.482-4.6539.482-3.0299 0-6.0305-.533-9.0021-1.6-2.9715-1.066-5.7245-2.666-8.2591-4.799zm-23.5596-34.9136h18.2974v-11.5544h-51v11.5544h18.2079v51.4456h14.4947z"/></svg>"""
VITE_LOGO = """<svg viewBox="0 0 23 14" width="{w}" height="{h}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="vbolt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#47bfff"/><stop offset="0.55" stop-color="#863bff"/><stop offset="1" stop-color="#7e14ff"/></linearGradient></defs><path d="M20.7482 0H18.8887C21.641 3.93959 21.6571 10.0462 18.8887 14H20.7482C23.516 10.0462 23.4999 3.93959 20.7482 0Z" fill="{arc}"/><path d="M2.07027 3.05176e-05C-0.682028 3.93963 -0.698142 10.0463 2.07027 14H3.92985C1.16208 10.0463 1.1782 3.93963 3.92985 3.05176e-05H2.07027Z" fill="{arc}"/><path d="M12.0135 13.6771C11.815 13.9297 11.4089 13.7892 11.4089 13.4682V10.3853C11.4089 10.0114 11.106 9.70846 10.7321 9.70846H7.32818C7.05295 9.70846 6.89245 9.39713 7.05295 9.17347L9.29089 6.04023C9.61124 5.59225 9.29089 4.9696 8.73979 4.9696H4.62036C4.34513 4.9696 4.18463 4.65828 4.34512 4.43461L7.24632 0.372548C7.31013 0.283598 7.41262 0.230743 7.52155 0.230743H16.1671C16.4424 0.230743 16.6029 0.542069 16.4424 0.765734L14.2044 3.89897C13.8841 4.34695 14.2044 4.9696 14.7555 4.9696H18.1595C18.4418 4.9696 18.6004 5.29511 18.4257 5.51748L12.0142 13.6777L12.0135 13.6771Z" fill="url(#vbolt)"/></svg>"""
# React Compiler: the atom with a small "auto-memo" spark — no official standalone mark exists
COMPILER_LOGO = """<svg viewBox="-12 -11 24 22" width="{w}" height="{h}" xmlns="http://www.w3.org/2000/svg"><g stroke="#a78bfa" stroke-width="1" fill="none"><ellipse rx="10.5" ry="4"/><ellipse rx="10.5" ry="4" transform="rotate(60)"/><ellipse rx="10.5" ry="4" transform="rotate(120)"/></g><path d="M0.9,-5.2 L-2.6,0.6 L0.2,0.6 L-0.9,5.2 L2.6,-0.6 L-0.2,-0.6 Z" fill="#c4b5fd"/></svg>"""


def cover_html():
    logo = REACT_LOGO.format(w=34, h=30, c="#61dafb")
    tech = "".join(
        f'<span class="tech t-{key}"><span class="tech-mark">{mark}</span><span class="tech-name">{name}</span></span>'
        for key, mark, name in (
            ("react", REACT_LOGO.format(w=34, h=30, c="#61dafb"), "React 19.2"),
            ("ts", TS_LOGO.format(s=28), "TypeScript"),
            ("vite", VITE_LOGO.format(w=44, h=27, arc="#1f2937" if PRINT_MODE else "#f1f5f9"), "Vite"),  # arcs are white in the official mark
            ("compiler", COMPILER_LOGO.format(w=34, h=31), "React Compiler"),
        )
    )
    code_bg = html.escape(
        """function App() {
  const [state, action, pending] =
    useActionState(saveTodo, initial);
  return (
    <form action={action}>
      <Suspense fallback={<Skeleton />}>
        <TodoList promise={todos} />
      </Suspense>
    </form>
  );
}
// Actions · use() · Activity
// React Compiler · Server Components
// Production-ready"""
    )
    return f"""
<section class="cover">
  <pre class="cover-code">{code_bg}</pre>
  <div class="cover-glow g1"></div><div class="cover-glow g2"></div>
  <div class="cover-inner">
    <div class="cover-kicker">PERSIAN DEVELOPER HANDBOOK</div>
    <div class="cover-brand">{logo}<span class="brand-txt">React <em>19</em></span></div>
    <h1 class="cover-title">راهنمای جامع و حرفه‌ای</h1>
    <div class="cover-frame">React 19.2</div>
    <div class="cover-line"></div>
    <p class="cover-sub">از مبانی تا معماری <span class="ltr">Production-Level</span></p>
    <div class="cover-tech">{tech}</div>
    <p class="cover-desc">راهنمایی برای جامعه توسعه‌دهندگان فارسی‌زبان، به‌سوی یادگیری مدل ذهنی درست، الگوهای مدرن<br/>و استانداردهای واقعی صنعت در ساخت رابط‌های کاربری با React.</p>
    <div class="cover-stats"><span><b>۳۷</b> فصل کاربردی</span><i></i><span>مینی‌پروژه <b>عملی</b></span><i></i><span>آمادگی <b>مصاحبه</b></span></div>
  </div>
  <div class="cover-author"><div class="cover-author-card">
    <img src="author-sq.png" alt="محمدرضا رضائیان"/>
    <div class="ca-text">
      <div class="ca-name">محمدرضا رضائیان</div>
      <div class="ca-role">Front-End Developer · گردآوری و تدوین</div>
      <div class="ca-tag">با هدف کمک به جامعه توسعه‌دهندگان Front-End فارسی‌زبان</div>
    </div>
  </div></div>
  <div class="cover-foot"><div class="cover-foot-row"><span>{COVER_EDITION}</span><span class="ltr">React 19.2 · TypeScript · Vite · React Compiler</span></div></div>
</section>
"""


def toc_html(chapters):
    """Contents. Every entry is ONE line box — chapter number, title, a dotted leader and the
    page number (WeasyPrint target-counter) — so the three share the same baseline by
    construction. Subtitles stay on the chapter openers only."""
    items = []
    cur_part = None
    for meta in chapters:
        p = meta.get("part", "1")
        if p != cur_part:
            cur_part = p
            pn, pt = PARTS[p]
            items.append(f'<div class="toc-part"><span class="toc-part-name">{pn}</span> · {pt}</div>')
        ref = f'#ch-{meta["num"]}'
        items.append(
            f'<a class="toc-item" href="{ref}">'
            f'<span class="toc-row"><span class="toc-num">{meta["num"]}</span>'
            f'<span class="toc-title">{md.renderInline(meta["title"])}</span>'
            f'<span class="toc-leader"></span><span class="toc-page" data-ref="{ref}"></span></span>'
            f'</a>'
        )
    return f"""
<section class="toc">
  <h1 class="toc-heading">فهرست مطالب</h1>
  {''.join(items)}
</section>
"""


def closing_html():
    return f"""
<section class="closing">
  <div class="closing-card">
    <div class="closing-kicker">پایان مرجع</div>
    <h1>موفق باشید 🚀</h1>
    <p>اگر این کتاب برایتان مفید بود، آن را با توسعه‌دهندگان دیگر به اشتراک بگذارید و در مخزن گیت‌هاب با یک <b>Star</b> از آن حمایت کنید. بازخوردها و پیشنهادهای شما، نسخه‌های بعدی را بهتر می‌کند.</p>
    <div class="closing-tags"><span>React 19.2</span><span>TypeScript</span><span>Vite</span><span>React Compiler</span><span>Production Ready</span></div>
    <div class="closing-links">
      <div><span class="lbl">مخزن گیت‌هاب</span><a class="ltr" href="https://github.com/rezaian-dev/react-19-persian-guide">github.com/rezaian-dev/react-19-persian-guide</a></div>
      <div><span class="lbl">مرجع مکمل</span><a class="ltr" href="https://github.com/rezaian-dev/nextjs-16-persian-guide">github.com/rezaian-dev/nextjs-16-persian-guide</a></div>
    </div>
    <div class="closing-author">گردآوری و تدوین: <b>محمدرضا رضائیان</b> · Front-End Developer · {EDITION}</div>
  </div>
</section>
"""


# ----------------------------------------------------------------------------
# Assemble
# ----------------------------------------------------------------------------
def build(pdf=True):
    t0 = time.time()
    files = sorted(CH_DIR.glob("*.md"))
    chapters = []
    sections = []
    for f in files:
        meta, body = parse_chapter(f)
        chapters.append(meta)
        sections.append(render_chapter(meta, body))
        print(f"  parsed {f.name}: {meta['title']}")

    css = (ROOT / "style.css").read_text(encoding="utf-8")
    if PRINT_MODE:
        css += "\n" + (ROOT / "style-print.css").read_text(encoding="utf-8")
    doc = f"""<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head><meta charset="utf-8"/>
<title>راهنمای جامع و حرفه‌ای React 19</title>
<meta name="author" content="محمدرضا رضائیان"/>
<meta name="description" content="مرجع فارسی React 19.2 — از مبانی تا معماری Production-Level"/>
<meta name="keywords" content="React 19, React 19.2, Persian, فارسی, TypeScript, Vite, edition {BOOK_VERSION}"/>
<style>{css}</style>
</head>
<body>
{cover_html()}
{toc_html(chapters)}
{''.join(sections)}
{closing_html()}
</body></html>"""
    OUT_HTML.parent.mkdir(exist_ok=True)
    OUT_HTML.write_text(doc, encoding="utf-8")
    print(f"HTML written ({len(doc)//1024} KB) in {time.time()-t0:.1f}s")
    if pdf:
        t1 = time.time()
        out = ROOT / "React19-Persian-Guide-Print.pdf" if PRINT_MODE else OUT_PDF
        HTML(string=doc, base_url=str(ROOT)).write_pdf(str(out))
        print(f"PDF written -> {out} in {time.time()-t1:.1f}s")


if __name__ == "__main__":
    build(pdf="--html" not in sys.argv)
