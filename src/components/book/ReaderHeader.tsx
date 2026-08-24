"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { asset } from "@/lib/links";
import { BOOK, BOOK_CHAPTERS, BOOK_PARTS, chapterId, fa } from "@/lib/book";

/**
 * Reader chrome for `/book`: a sticky top bar with a chapter jump-select, a
 * slide-in table of contents, a scroll-progress hairline and back-to-top.
 *
 * Behaviour mirrors the former vanilla `reader.js`, now as React state:
 * keyboard-navigable select (arrows / home / end / enter / escape), outside
 * click to dismiss, scroll-locked drawer, rAF-throttled progress, deep-link
 * re-pinning above lazy images, and an IntersectionObserver that keeps the
 * TOC link and the select label in sync with the chapter on screen.
 */
export default function ReaderHeader() {
  const [tocOpen, setTocOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [highlight, setHighlight] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  const jumpRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<number, HTMLDivElement>());

  const flat = BOOK_CHAPTERS;

  const pick = useCallback((num: number) => {
    setSelected(num);
    setSelectOpen(false);
    setHighlight(-1);
    triggerRef.current?.focus();
    document.getElementById(chapterId(num))?.scrollIntoView({ block: "start" });
  }, []);

  const setOpen = useCallback(
    (open: boolean) => {
      setSelectOpen(open);
      if (open) {
        const cur = selected ? flat.findIndex((c) => c.num === selected) : 0;
        setHighlight(cur >= 0 ? cur : 0);
      } else {
        setHighlight(-1);
      }
    },
    [selected, flat],
  );

  // Keep the highlighted row visible inside the popover — never scrolls the page.
  useEffect(() => {
    if (!selectOpen || highlight < 0) return;
    const pop = popRef.current;
    const el = itemRefs.current.get(flat[highlight]?.num ?? -1);
    if (!pop || !el) return;
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    if (top < pop.scrollTop) pop.scrollTop = top - 8;
    else if (bottom > pop.scrollTop + pop.clientHeight) {
      pop.scrollTop = bottom - pop.clientHeight + 8;
    }
  }, [highlight, selectOpen, flat]);

  // Outside click dismisses the select.
  useEffect(() => {
    if (!selectOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (jumpRef.current && !jumpRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [selectOpen, setOpen]);

  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (selectOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => (h + 1) % flat.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => (h - 1 + flat.length) % flat.length);
      } else if (e.key === "Home") {
        e.preventDefault();
        setHighlight(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setHighlight(flat.length - 1);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const c = flat[highlight];
        if (c) pick(c.num);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
    }
  };

  // TOC drawer: lock body scroll while open, Escape closes and refocuses.
  useEffect(() => {
    document.body.style.overflow = tocOpen ? "hidden" : "";
    if (!tocOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTocOpen(false);
        document.getElementById("toc-btn")?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [tocOpen]);

  // Scroll progress + back-to-top visibility, rAF-throttled.
  useEffect(() => {
    let tick = false;
    const onScroll = () => {
      if (tick) return;
      tick = true;
      requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(h > 0 ? (window.scrollY / h) * 100 : 0);
        setShowTop(window.scrollY >= 900);
        tick = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Deep-link settle: a hash landing happens before the lazy images above it
  // have decoded, so re-pin the chapter head under the bar a few times.
  useEffect(() => {
    const settle = () => {
      const hash = window.location.hash;
      const el = hash ? document.querySelector(hash) : null;
      if (!el) return;
      let n = 0;
      const fix = () => {
        el.scrollIntoView({ block: "start" });
        if (++n < 3) window.setTimeout(fix, 220);
      };
      window.setTimeout(fix, 60);
    };
    settle();
    window.addEventListener("load", settle);
    window.addEventListener("hashchange", settle);
    return () => {
      window.removeEventListener("load", settle);
      window.removeEventListener("hashchange", settle);
    };
  }, []);

  // Highlight the chapter currently on screen (TOC link + select label).
  useEffect(() => {
    const heads = [...document.querySelectorAll(".ch-head")];
    if (!("IntersectionObserver" in window) || heads.length === 0) return;
    let active: Element | null = null;
    const links = new Map(
      [...document.querySelectorAll(".toc-part a")].map((a) => [
        (a.getAttribute("href") ?? "").slice(1),
        a,
      ]),
    );
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.id;
          const link = links.get(id);
          if (!link) continue;
          if (link !== active) {
            active?.classList.remove("on");
            link.classList.add("on");
            active = link;
          }
          const num = Number(id.replace("ch-", ""));
          if (!Number.isNaN(num)) setSelected(num);
        }
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    heads.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, []);

  const selectedChapter = selected
    ? BOOK_CHAPTERS.find((c) => c.num === selected)
    : undefined;

  return (
    <>
      <header className="bar">
        <div className="bar-in">
          <Link className="home" href="/" aria-label="بازگشت به صفحهٔ کتاب">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m14 6-6 6 6 6" />
            </svg>
            <span>صفحهٔ کتاب</span>
          </Link>

          <div className="ident">
            <strong>{BOOK.title}</strong>
            <span>
              نسخهٔ آنلاین · {fa(BOOK.pages)} صفحه
            </span>
          </div>

          <div className="tools">
            <div className="select" ref={jumpRef}>
              <button
                ref={triggerRef}
                type="button"
                className="select-trigger"
                aria-haspopup="listbox"
                aria-expanded={selectOpen}
                aria-label="پرش به فصل"
                onClick={() => setOpen(!selectOpen)}
                onKeyDown={onTriggerKey}
              >
                <span className={`select-value${selectedChapter ? "" : " ph"}`}>
                  {selectedChapter ? selectedChapter.title : "فهرست فصل‌ها…"}
                </span>
                <svg
                  className="select-chevron"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <div
                ref={popRef}
                className="select-pop"
                role="listbox"
                aria-label="پرش به فصل"
                hidden={!selectOpen}
              >
                {BOOK_PARTS.map((part) => {
                  const rows = BOOK_CHAPTERS.filter(
                    (c) => part.from <= c.num && c.num <= part.to,
                  );
                  if (rows.length === 0) return null;
                  return (
                    <Fragment key={part.num}>
                      <div className="select-label">
                        بخش {fa(part.num)} · {part.name}
                      </div>
                      {rows.map((c) => {
                        const idx = flat.findIndex((x) => x.num === c.num);
                        return (
                          <div
                            key={c.num}
                            ref={(el) => {
                              if (el) itemRefs.current.set(c.num, el);
                              else itemRefs.current.delete(c.num);
                            }}
                            className={`select-item${idx === highlight ? " hl" : ""}`}
                            role="option"
                            id={`jump-${chapterId(c.num)}`}
                            data-value={`#${chapterId(c.num)}`}
                            aria-selected={selected === c.num}
                            onClick={() => pick(c.num)}
                            onMouseMove={() => setHighlight(idx)}
                          >
                            <span className="n">
                              {fa(String(c.num).padStart(2, "0"))}
                            </span>
                            <span className="t">{c.title}</span>
                            <svg
                              className="check"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          </div>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </div>
            </div>
            <button
              id="toc-btn"
              className="icon"
              type="button"
              aria-controls="toc"
              aria-expanded={tocOpen}
              aria-label="فهرست مطالب"
              onClick={() => setTocOpen((o) => !o)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M4 6h16M4 12h16M4 18h10" />
              </svg>
            </button>
            <a className="dl" href={asset(`/pdf/${BOOK.pdfFile}`)} download>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19v2h16v-2" />
              </svg>
              <span>PDF</span>
            </a>
          </div>
        </div>
        <div className="progress">
          <i style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div
        className="scrim"
        hidden={!tocOpen}
        onClick={() => setTocOpen(false)}
      />
      <aside className="toc" id="toc" hidden={!tocOpen} aria-label="فهرست مطالب">
        <div className="toc-top">
          <strong>فهرست مطالب</strong>
          <button
            className="icon"
            type="button"
            aria-label="بستن فهرست"
            onClick={() => setTocOpen(false)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="toc-body">
          {BOOK_PARTS.map((part) => {
            const rows = BOOK_CHAPTERS.filter(
              (c) => part.from <= c.num && c.num <= part.to,
            );
            if (rows.length === 0) return null;
            return (
              <section key={part.num} className="toc-part">
                <h3>
                  بخش {fa(part.num)} · {part.name}
                </h3>
                <ol>
                  {rows.map((c) => (
                    <li key={c.num}>
                      <a
                        href={`#${chapterId(c.num)}`}
                        onClick={() => setTocOpen(false)}
                      >
                        <span className="n">
                          {fa(String(c.num).padStart(2, "0"))}
                        </span>
                        <span className="t">
                          {c.title}
                          {c.subtitle ? <em>{c.subtitle}</em> : null}
                        </span>
                        <span className="p">ص&nbsp;{fa(c.page)}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </div>
      </aside>

      <button
        className="to-top"
        type="button"
        aria-label="بازگشت به ابتدا"
        hidden={!showTop}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 14 6-6 6 6" />
        </svg>
      </button>
    </>
  );
}
