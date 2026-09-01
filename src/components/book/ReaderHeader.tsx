"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { asset } from "@/lib/links";
import { BOOK, BOOK_CHAPTERS, BOOK_PARTS, chapterId, fa } from "@/lib/book";

/** Visible keyboard focus for every reader control. */
const FOCUS =
  "focus-visible:outline-[3px] focus-visible:outline-sky-400 focus-visible:outline-offset-2";

/** Active TOC link — toggled by the IntersectionObserver below. The literal
    must stay in this file so Tailwind generates the utility. */
const TOC_ACTIVE = "bg-sky-400/15";

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
  // Instant, not smooth: a 100k-pixel smooth swoosh takes seconds in Chromium.
  useEffect(() => {
    const settle = () => {
      const hash = window.location.hash;
      const el = hash ? document.querySelector(hash) : null;
      if (!el) return;
      let n = 0;
      const fix = () => {
        el.scrollIntoView({ block: "start", behavior: "instant" });
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
    const heads = [...document.querySelectorAll("[data-ch-head]")];
    if (!("IntersectionObserver" in window) || heads.length === 0) return;
    let active: Element | null = null;
    const links = new Map(
      [...document.querySelectorAll("[data-toc-link]")].map((a) => [
        a.getAttribute("data-toc-link") ?? "",
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
            active?.classList.remove(TOC_ACTIVE);
            link.classList.add(TOC_ACTIVE);
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
      <header className="sticky top-0 z-[90] border-b border-white/10 bg-[#111a30]/85 backdrop-blur-lg backdrop-saturate-[1.4]">
        <div className="mx-auto flex min-h-[60px] w-[min(1180px,calc(100%-28px))] items-center gap-3">
          <Link
            href="/"
            aria-label="بازگشت به صفحهٔ کتاب"
            className={cn(
              FOCUS,
              "inline-flex shrink-0 items-center gap-1.5 rounded-[10px] border border-white/15 bg-[#202b48]/60 px-2.5 py-2 text-[13px] font-bold text-[#b2bcd0] no-underline transition-colors duration-150 hover:border-sky-400/50 hover:text-white",
            )}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="size-4"
            >
              <path d="m14 6-6 6 6 6" />
            </svg>
            <span className="max-md:hidden">صفحهٔ کتاب</span>
          </Link>

          <div className="me-auto grid min-w-0 leading-[1.3]">
            <strong className="truncate text-sm font-extrabold">{BOOK.title}</strong>
            <span className="text-[11.5px] text-[#8b95ad] max-md:hidden">
              نسخهٔ آنلاین · {fa(BOOK.pages)} صفحه
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="relative max-md:hidden" ref={jumpRef}>
              <button
                ref={triggerRef}
                type="button"
                aria-haspopup="listbox"
                aria-expanded={selectOpen}
                aria-label="پرش به فصل"
                onClick={() => setOpen(!selectOpen)}
                onKeyDown={onTriggerKey}
                className={cn(
                  FOCUS,
                  "group inline-flex min-h-[38px] cursor-pointer items-center gap-2 rounded-[10px] border border-white/15 bg-[#202b48]/70 px-3 py-2 font-sans text-[12.5px] font-bold text-[#b2bcd0] transition-colors duration-150 hover:border-sky-400/55 hover:text-white aria-expanded:border-sky-400/75 aria-expanded:text-white",
                )}
              >
                <span
                  className={cn(
                    "max-w-[200px] truncate",
                    !selectedChapter && "font-semibold text-[#8b95ad]",
                  )}
                >
                  {selectedChapter ? selectedChapter.title : "فهرست فصل‌ها…"}
                </span>
                <svg
                  className="size-[15px] shrink-0 opacity-75 transition-transform duration-200 group-aria-expanded:rotate-180"
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
                role="listbox"
                aria-label="پرش به فصل"
                hidden={!selectOpen}
                className="absolute end-0 top-[calc(100%+8px)] z-[120] max-h-[min(64vh,500px)] w-[min(370px,88vw)] animate-pop overflow-y-auto overscroll-contain rounded-[14px] border border-white/15 bg-[#182240] p-1.5 shadow-[0_26px_64px_rgba(0,0,0,0.5)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-lg [&::-webkit-scrollbar-thumb]:bg-white/15"
              >
                {BOOK_PARTS.map((part) => {
                  const rows = BOOK_CHAPTERS.filter(
                    (c) => part.from <= c.num && c.num <= part.to,
                  );
                  if (rows.length === 0) return null;
                  return (
                    <Fragment key={part.num}>
                      <div className="px-2.5 pb-1 pt-2 text-[11px] font-extrabold tracking-wide text-sky-400">
                        بخش {fa(part.num)} · {part.name}
                      </div>
                      {rows.map((c) => {
                        const idx = flat.findIndex((x) => x.num === c.num);
                        const isHl = idx === highlight;
                        const isSel = selected === c.num;
                        return (
                          <div
                            key={c.num}
                            ref={(el) => {
                              if (el) itemRefs.current.set(c.num, el);
                              else itemRefs.current.delete(c.num);
                            }}
                            role="option"
                            id={`jump-${chapterId(c.num)}`}
                            aria-selected={isSel}
                            onClick={() => pick(c.num)}
                            onMouseMove={() => setHighlight(idx)}
                            className={cn(
                              "grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13px] font-semibold text-[#b2bcd0]",
                              isHl && "bg-white/[0.07] text-white",
                              isSel && "text-white",
                            )}
                          >
                            <span className="font-mono text-[10.5px] font-bold text-sky-400">
                              {fa(String(c.num).padStart(2, "0"))}
                            </span>
                            <span className="min-w-0 truncate">{c.title}</span>
                            <svg
                              className={cn(
                                "size-[15px] text-sky-400",
                                isSel ? "visible" : "invisible",
                              )}
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
              type="button"
              aria-controls="toc"
              aria-expanded={tocOpen}
              aria-label="فهرست مطالب"
              onClick={() => setTocOpen((o) => !o)}
              className={cn(
                FOCUS,
                "grid size-[38px] cursor-pointer place-items-center rounded-[10px] border border-white/15 bg-[#202b48]/70 text-[#f6f8fd] transition-colors hover:border-sky-400/50",
              )}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
                className="size-[19px]"
              >
                <path d="M4 6h16M4 12h16M4 18h10" />
              </svg>
            </button>
            <a
              href={asset(`/pdf/${BOOK.pdfFile}`)}
              download
              className={cn(
                FOCUS,
                "inline-flex items-center gap-1.5 rounded-[10px] bg-[linear-gradient(135deg,#38bdf8,#51a0f7)] px-[13px] py-[9px] text-[12.5px] font-extrabold text-[#03101a] no-underline shadow-[0_10px_26px_rgb(56_189_248/0.22)]",
              )}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="size-4"
              >
                <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19v2h16v-2" />
              </svg>
              <span>PDF</span>
            </a>
          </div>
        </div>
        <div className="h-0.5 bg-transparent">
          <i className="block h-full bg-sky-400 transition-[width] duration-100" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div
        className="fixed inset-0 z-[95] animate-fade bg-[#060a16]/60 backdrop-blur-[3px]"
        hidden={!tocOpen}
        onClick={() => setTocOpen(false)}
      />
      <aside
        id="toc"
        hidden={!tocOpen}
        aria-label="فهرست مطالب"
        className="fixed inset-y-0 end-0 z-[96] flex w-[min(430px,90vw)] animate-slide flex-col border-s border-white/15 bg-[#182240] shadow-[-30px_0_70px_rgba(0,0,0,0.42)]"
      >
        <div className="flex items-center justify-between gap-2.5 border-b border-white/10 px-[18px] py-4">
          <strong className="text-[15px] font-extrabold">فهرست مطالب</strong>
          <button
            type="button"
            aria-label="بستن فهرست"
            onClick={() => setTocOpen(false)}
            className={cn(
              FOCUS,
              "grid size-[38px] cursor-pointer place-items-center rounded-[10px] border border-white/15 bg-[#202b48]/70 text-[#f6f8fd] transition-colors hover:border-sky-400/50",
            )}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
              className="size-[19px]"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="overscroll-contain overflow-y-auto px-3 pb-[22px] pt-2">
          {BOOK_PARTS.map((part) => {
            const rows = BOOK_CHAPTERS.filter(
              (c) => part.from <= c.num && c.num <= part.to,
            );
            if (rows.length === 0) return null;
            return (
              <section key={part.num} className="mt-3.5">
                <h3 className="m-0 mb-2 px-1.5 text-[11.5px] font-extrabold tracking-wide text-sky-400">
                  بخش {fa(part.num)} · {part.name}
                </h3>
                <ol className="m-0 grid list-none gap-0.5 p-0">
                  {rows.map((c) => (
                    <li key={c.num}>
                      <a
                        href={`#${chapterId(c.num)}`}
                        data-toc-link={chapterId(c.num)}
                        onClick={() => setTocOpen(false)}
                        className={cn(
                          FOCUS,
                          "grid grid-cols-[auto_1fr_auto] items-center gap-2.5 rounded-[10px] px-2.5 py-[9px] text-inherit no-underline transition-colors duration-150 hover:bg-white/[0.06]",
                        )}
                      >
                        <span className="min-w-5 font-mono text-[11px] font-bold text-sky-400">
                          {fa(String(c.num).padStart(2, "0"))}
                        </span>
                        <span className="grid min-w-0 text-[13.5px] font-bold leading-[1.45]">
                          {c.title}
                          {c.subtitle ? (
                            <em className="truncate text-[11.5px] font-medium not-italic text-[#8b95ad]">
                              {c.subtitle}
                            </em>
                          ) : null}
                        </span>
                        <span className="whitespace-nowrap text-[10.5px] text-[#8b95ad]">
                          ص&nbsp;{fa(c.page)}
                        </span>
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
        type="button"
        aria-label="بازگشت به ابتدا"
        hidden={!showTop}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={cn(
          FOCUS,
          "fixed bottom-[18px] start-[18px] z-[80] grid size-11 cursor-pointer place-items-center rounded-full border border-white/15 bg-[#182240]/90 text-[#f6f8fd] shadow-[0_10px_28px_rgba(0,0,0,0.35)] backdrop-blur",
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="size-5"
        >
          <path d="m6 14 6-6 6 6" />
        </svg>
      </button>
    </>
  );
}
