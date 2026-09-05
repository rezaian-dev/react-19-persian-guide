#!/usr/bin/env python3
"""README banner (1254×1254 PNG) — same composition as the Next.js 16 guide banner:
title, subtitle, official logo pills, side chips, laptop with a live code window,
feature checklist and the author card.  Artwork plate: plate.jpg (laptop + circuit
background); everything else is HTML/CSS rendered by WeasyPrint.

    cd src/banner && python3 make_banner.py     → banner.png (همان فایلی که README نشان می‌دهد)
"""
import pathlib, re
from weasyprint import HTML
import pymupdf

HERE = pathlib.Path(__file__).resolve().parent
build_src = (HERE.parent / "build.py").read_text(encoding="utf-8")
LOGOS = {n: re.search(n + r' = """(.*?)"""', build_src, re.S).group(1) for n in ("REACT_LOGO", "TS_LOGO", "VITE_LOGO", "COMPILER_LOGO")}

react = LOGOS["REACT_LOGO"].format(w=22, h=20, c="#61dafb")
ts = LOGOS["TS_LOGO"].format(s=20)
vite = LOGOS["VITE_LOGO"].format(w=30, h=18, arc="#f1f5f9")
compiler = LOGOS["COMPILER_LOGO"].format(w=22, h=20)
tailwind = ('<svg viewBox="0 0 54 33" width="26" height="16" xmlns="http://www.w3.org/2000/svg"><path fill="#38bdf8" fill-rule="evenodd" '
            'd="M27 0c-7.2 0-11.7 3.6-13.5 10.8 2.7-3.6 5.85-4.95 9.45-4.05 2.054.513 3.522 2.004 5.147 3.653C30.744 13.09 33.808 16.2 40.5 16.2c7.2 0 11.7-3.6 13.5-10.8'
            '-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.513-3.522-2.004-5.147-3.653C36.756 3.11 33.692 0 27 0zM13.5 16.2C6.3 16.2 1.8 19.8 0 27c2.7-3.6 5.85-4.95 9.45-4.05 '
            '2.054.514 3.522 2.004 5.147 3.653C17.244 29.29 20.308 32.4 27 32.4c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.513-3.522-2.004-5.147-3.653'
            'C23.256 19.31 20.192 16.2 13.5 16.2z"/></svg>')

code = '''<span class="k">import</span> { useActionState, useOptimistic } <span class="k">from</span> <span class="s">'react'</span>;
<span class="k">import</span> { useFormStatus } <span class="k">from</span> <span class="s">'react-dom'</span>;

<span class="k">export function</span> <span class="f">CheckoutForm</span>({ cart }: { cart: <span class="t">Cart</span> }) {
  <span class="k">const</span> [state, submit, pending] = <span class="f">useActionState</span>(placeOrder, <span class="c">null</span>);
  <span class="k">const</span> [items, addOptimistic] = <span class="f">useOptimistic</span>(cart.items);

  <span class="k">return</span> (
    &lt;<span class="tag">form</span> <span class="a">action</span>={submit}&gt;
      &lt;<span class="tag">Suspense</span> <span class="a">fallback</span>={&lt;<span class="tag">Skeleton</span> /&gt;}&gt;
        &lt;<span class="tag">CartSummary</span> <span class="a">items</span>={items} /&gt;
      &lt;/<span class="tag">Suspense</span>&gt;
      {state?.error &amp;&amp; &lt;<span class="tag">p</span> <span class="a">role</span>=<span class="s">"alert"</span>&gt;{state.error}&lt;/<span class="tag">p</span>&gt;}
      &lt;<span class="tag">SubmitButton</span> /&gt;   <span class="cm">// useFormStatus()</span>
    &lt;/<span class="tag">form</span>&gt;
  );
}'''

left = [("🧪", "Testing"), ("🔐", "Security"), ("♿", "a11y &amp; RTL"), ("🚀", "Performance"), ("🗺️", "Router v8"), ("🏗️", "Architecture")]
right = [("⚡", "Actions"), ("✨", "React Compiler"), ("⏳", "Suspense · use()"), ("🧩", "Server Comp."), ("🔄", "useOptimistic"), ("🎯", "Activity")]
row = [("📘", "TypeScript"), ("⚛️", "Concurrent"), ("🧠", "TanStack Query"), ("📦", "Vite 8"), ("✅", "Production Ready")]
features = ["۳۷ فصل تخصصی", "Actions &amp; useActionState", "React Compiler 1.0",
            "آموزش پروژه‌محور", "Suspense &amp; Streaming", "Best Practices",
            "Clean Architecture", "Server Components", "۸ مینی‌پروژه عملی",
            "مهاجرت به React 19", "Testing &amp; Security", "۴۵ سؤال مصاحبه"]

chips = lambda items: "".join(f'<div class="chip"><i>{i}</i>{t}</div>' for i, t in items)
html = f'''<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><link rel="stylesheet" href="banner.css"></head><body>
<div class="bg">
  <div class="title"><span class="fa">مرجع جامع</span><span class="en">React <b>19</b></span></div>
  <div class="subtitle">از مبانی تا معماری <b>Production-Level</b></div>
  <div class="logos">
    <span class="logo">{react}React 19</span><span class="logo">{ts}TypeScript</span><span class="logo">{vite}Vite</span><span class="logo">{tailwind}Tailwind v4</span><span class="logo">{compiler}Compiler</span>
  </div>
  <div class="side l">{chips(left)}</div>
  <div class="side r">{chips(right)}</div>
  <div class="screen">
    <div class="win-head"><span class="d r"></span><span class="d y"></span><span class="d g"></span><span class="fn">src/features/checkout/CheckoutForm.tsx</span></div>
    <pre>{code}</pre>
  </div>
  <div class="row">{chips(row)}</div>
  <div class="features">{"".join(f"<div><span>✔</span><bdi>{f}</bdi></div>" for f in features)}</div>
  <div class="author">
    <img src="../author-sq.png" alt="">
    <div class="a-txt"><div class="a-role">صاحب اثر <em>Author</em></div><div class="a-name">محمدرضا رضائیان</div></div>
    <span class="a-sep"></span>
    <div class="a-tag">Front-End Developer<br><b>React · Next.js · TypeScript</b></div>
  </div>
  <div class="foot">React 19.2 &nbsp;•&nbsp; TypeScript &nbsp;•&nbsp; Vite &nbsp;•&nbsp; React Compiler &nbsp;•&nbsp; Production Ready</div>
</div></body></html>'''

(HERE / "banner.html").write_text(html, encoding="utf-8")
pdf = HERE / "banner.pdf"
HTML(string=html, base_url=str(HERE)).write_pdf(pdf)
page = pymupdf.open(pdf)[0]
pix = page.get_pixmap(matrix=pymupdf.Matrix(1254 / page.rect.width, 1254 / page.rect.height), alpha=False)
pix.save(HERE / "banner.png")
pdf.unlink()
out = HERE / "banner.png"
print("banner.png", pix.width, "x", pix.height, "->", out)
