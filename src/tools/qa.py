#!/usr/bin/env python3
"""Repository auditor — one command that says whether this repo is self-consistent.

    python3 src/tools/qa.py            # print a report, exit non-zero if anything drifted
    python3 src/tools/qa.py --json     # machine-readable summary

Five things rot silently in a documentation repository, so all five are checked here:
  1. the edition: page count, chapter outline, language, metadata, paper size;
  2. the data file: chapter headings, order, part coverage, page bounds;
  3. the online reader: one image per PDF page and an anchor per chapter;
  4. the exported app: the built Pages copy under docs/ agrees with public/ and
     every link the landing page ships actually resolves;
  5. the prose: README numbers agree with the edition, and no stale reference to
     the retired hand-written landing page survives.
"""
from __future__ import annotations
import argparse, json, pathlib, re, sys

import pymupdf

ROOT = pathlib.Path(__file__).resolve().parents[2]
DATA = json.loads((ROOT / "src" / "edition" / "chapters.json").read_text(encoding="utf-8"))
PDF = ROOT / DATA["book"]["pdf"]
READER = ROOT / "public" / "book"
EXPORT = ROOT / "docs"

fails: list[str] = []


def ok(label: str, cond, detail: str = "") -> bool:
    cond = bool(cond)
    print(f"  {'PASS' if cond else 'FAIL'}  {label}{(' — ' + detail) if detail else ''}")
    if not cond:
        fails.append(label)
    return cond


def fa(n: int) -> str:
    return "".join(chr(0x06F0 + int(d)) for d in str(n))


def read(p: pathlib.Path) -> str:
    return p.read_text(encoding="utf-8") if p.exists() else ""


# ---------------------------------------------------------------- 1. edition
def check_edition(doc) -> dict:
    print("\n\033[1medition — the shipped PDF\033[0m")
    book = DATA["book"]
    ok(f"page count is {book['pages']}", doc.page_count == book["pages"], f"{doc.page_count} pages")
    toc = [t for t in doc.get_toc() if t[0] == 1]
    ok("outline present", len(toc) >= len(DATA["chapters"]), f"{len(toc)} top-level bookmarks")
    lang = (doc.xref_get_key(doc.pdf_catalog(), "Lang")[1] or "").strip('()"')
    ok("document language is fa", lang == "fa", repr(lang))
    title = doc.metadata.get("title") or ""
    ok("readers show the title, not the filename", "React" in title, repr(title))
    w, h = doc[0].rect.width, doc[0].rect.height
    ok("paper is A4 portrait", abs(w - 595) < 2 and abs(h - 842) < 2, f"{w:.0f} x {h:.0f} pt")
    return {"pages": doc.page_count, "chapters_in_outline": len(toc)}


# ---------------------------------------------------------------- 2. data
def check_data() -> None:
    print("\n\033[1mdata — src/edition/chapters.json\033[0m")
    chapters = DATA["chapters"]
    ok("37 chapters", len(chapters) == 37, str(len(chapters)))
    ok("chapter numbers are 1..37 in order",
       [c["num"] for c in chapters] == list(range(1, 38)))
    ok("chapter pages ascend", all(a["page"] < b["page"] for a, b in zip(chapters, chapters[1:])))
    ok("first chapter starts on page 4", chapters[0]["page"] == 4, str(chapters[0]["page"]))
    covered = sum(p["to"] - p["from"] + 1 for p in DATA["parts"])
    ok("parts cover every chapter exactly once", covered == len(chapters), f"{covered} slots")
    def front_title(md: str) -> tuple[int | None, str]:
        m = re.match(r"^---\n(.*?)\n---", md, re.S)
        if not m:
            return None, ""
        num, title = None, ""
        for line in m.group(1).splitlines():
            if line.startswith("num:"):
                num = int(line.split(":", 1)[1].strip().lstrip("0") or 0)
            elif line.startswith("title:"):
                title = line.split(":", 1)[1].strip().replace("`", "")
        return num, title

    src_titles: dict[int, str] = {}
    for f in sorted((ROOT / "src" / "chapters").glob("*.md")):
        n, t = front_title(read(f))
        if n is not None:
            src_titles[n] = t
    same = sum(1 for c in chapters if src_titles.get(c["num"]) == c["title"].replace("`", ""))
    ok("titles match src/chapters/*.md", same == len(chapters), f"{same}/{len(chapters)}")


# ---------------------------------------------------------------- 3. reader
def check_reader(doc) -> None:
    print("\n\033[1mreader — public/book\033[0m")
    if not ok("reader exists", READER.is_dir()):
        return
    n_img = len(list((READER / "pages").glob("p*.webp")))
    ok("one image per PDF page", n_img == doc.page_count, f"{n_img} images / {doc.page_count} pages")
    body = read(READER / "index.html")
    missing = [c["num"] for c in DATA["chapters"] if f'id="ch-{c["num"]:02d}"' not in body]
    ok("every chapter has its anchor", not missing, f"missing: {missing[:5]}")
    ok("reader css/js ship", (READER / "reader.css").exists() and (READER / "reader.js").exists())


# ---------------------------------------------------------------- 4. exported app
def check_export(doc) -> None:
    print("\n\033[1mexport — docs/ (the built Pages copy)\033[0m")
    index = read(EXPORT / "index.html")
    ok("landing exists", bool(index))
    ok("landing is the Next.js app, not the retired hand-written page",
       "React 19.2" in index and "_next/" in index and not (EXPORT / "assets/site.css").exists())
    for f in ["pdf/React19-Persian-Guide.pdf", "pdf/React19-Persian-Guide.epub",
              "pdf/React19-Persian-Guide-Print.pdf", "cover-hero.webp", "author.webp",
              "react-logo-64.png", "social-card.jpg", "manifest.webmanifest", "sitemap.xml"]:
        ok(f"ships {f}", (EXPORT / f).exists())
    ok("book is exported", (EXPORT / "book" / "index.html").exists())
    n = len(list((EXPORT / "book" / "pages").glob("p*.webp"))) if (EXPORT / "book" / "pages").exists() else 0
    ok("exported book matches the edition", n == doc.page_count, f"{n} images")
    ok("chapters page exported", (EXPORT / "chapters" / "index.html").exists())
    # relative links on the landing must resolve inside docs/
    base = "/react-19-persian-guide"
    hrefs = set(re.findall(r'href="(?!https?:|#|mailto:)([^"]+)"', index))
    bad = []
    for h in hrefs:
        rel = h.split("#", 1)[0].removeprefix(base) or "/"   # basePath + #fragment
        p = EXPORT / rel.lstrip("/")
        if not (p.exists() or (p / "index.html").exists()):
            bad.append(h)
    ok("every internal href resolves", not bad, f"broken: {sorted(bad)[:5]}")


# ---------------------------------------------------------------- 5. prose
def check_prose() -> None:
    print("\n\033[1mprose — README.md\033[0m")
    md = read(ROOT / "README.md")
    ok("README exists", bool(md))
    ok("chapter count stated as ۳۷", "۳۷ فصل" in md)
    ok("page count stated as ۲۳۹", "۲۳۹" in md)
    ok("hero banner referenced and present",
       (not re.search(r'readme-hero\.webp', md)) or (ROOT / "assets/readme/readme-hero.webp").exists())
    local = set(re.findall(r'\]\((\./[^)]+)\)', md))
    bad = [h for h in local if not (ROOT / h.removeprefix("./")).exists()]
    ok("every ./link in README exists", not bad, f"broken: {sorted(bad)[:5]}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    if not PDF.exists():
        sys.exit(f"missing {PDF.relative_to(ROOT)}")
    doc = pymupdf.open(PDF)

    counts = check_edition(doc)
    check_data()
    check_reader(doc)
    check_export(doc)
    check_prose()
    doc.close()

    print(f"\n  {len(fails)} failure(s)" if fails else "\n  \033[32mall checks passed\033[0m")
    if args.json:
        print(json.dumps({"fails": fails, **counts}, ensure_ascii=False, indent=2))
    if fails:
        sys.exit(f"\n  \033[31m{len(fails)} check(s) failed\033[0m: {', '.join(fails[:6])}")


if __name__ == "__main__":
    main()
