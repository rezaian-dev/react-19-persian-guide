"use client";

import Link from "next/link";
import { m, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import { useEffect, useState } from "react";
import {
  Menu,
  X,
  BookOpen,
  Sparkles,
  Route,
  Images,
  ListTree,
  Download,
  Layers,
  ArrowLeft,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import GitHubIcon from "@/components/icons/GitHubIcon";
import ReactIcon from "@/components/icons/ReactIcon";
import { BOOK_URL, PDF_URL, REPO_URL } from "@/lib/links";

const LINKS = [
  { href: "#features", label: "ویژگی‌ها", icon: Sparkles, hint: "چرا این کتاب" },
  { href: "#path", label: "مسیر کتاب", icon: Route, hint: "چهار گام یادگیری" },
  { href: "#preview", label: "پیش‌نمایش", icon: Images, hint: "نگاهی به داخل" },
  { href: "#chapters", label: "فصل‌ها", icon: ListTree, hint: "۳۷ فصل" },
  { href: "#editions", label: "نسخه‌ها", icon: Download, hint: "آنلاین · PDF · EPUB" },
  { href: "#series", label: "مجموعه", icon: Layers, hint: "چهار مرجع فارسی" },
];

/* Drawer slides in from the right (RTL) and its items cascade in after it. */
const sheet = {
  hidden: { x: "100%" },
  show: {
    x: "0%",
    transition: { type: "spring" as const, stiffness: 260, damping: 30, staggerChildren: 0.05, delayChildren: 0.12 },
  },
  exit: { x: "100%", transition: { duration: 0.25, ease: "easeIn" as const } },
};

const row = {
  hidden: { opacity: 0, x: 28 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(latest > 24);
    setHidden(latest > prev && latest > 220 && !open);
  });

  // Lock body scroll and allow Escape to dismiss while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <m.header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300",
          scrolled || open ? "border-border bg-background/80 backdrop-blur-xl" : "border-transparent"
        )}
        animate={{ y: hidden ? "-110%" : "0%" }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
      >
        <nav className="container flex min-h-18 items-center gap-4" aria-label="ناوبری اصلی">
          {/* prefetch={false}: on the landing page this link targets the page we are
              already on, and the speculative HEAD request just gets aborted. */}
          <Link href="/" prefetch={false} className="flex shrink-0 items-center gap-2.5" onClick={() => setOpen(false)}>
            <span className="grid size-10 place-items-center rounded-xl bg-linear-to-br from-gold to-primary shadow-[0_6px_24px_-6px_rgb(83_214_245_/_0.5)]">
              <ReactIcon className="size-6 text-primary-foreground" />
            </span>
            <span className="leading-tight">
              {/* Latin lockup keeps the mono face… */}
              <span dir="ltr" className="block font-mono text-sm font-bold">
                React 19.2
              </span>
              {/* …while the Persian strapline must use Vazirmatn — JetBrains Mono
                  has no Persian glyphs, so font-mono here fell back to Consolas. */}
              <span className="mt-0.5 flex items-center gap-1.5 font-sans text-[11px] font-medium text-muted-foreground">
                راهنمای فارسی
                <i className="size-1 rounded-full bg-primary/60" aria-hidden="true" />
                ۳۷ فصل
              </span>
            </span>
          </Link>

          <ul className="mx-auto hidden items-center gap-0.5 lg:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="ms-auto flex items-center gap-2">
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <a href={BOOK_URL} target="_blank" rel="noopener" onClick={() => setOpen(false)}>
                <BookOpen /> مطالعه آنلاین
              </a>
            </Button>
            <button
              type="button"
              className="grid size-11 place-items-center rounded-xl border border-input bg-secondary/50 text-foreground transition-colors hover:border-primary/50 lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "بستن منو" : "بازکردن منو"}
              onClick={() => setOpen((o) => !o)}
            >
              <AnimatePresence mode="wait" initial={false}>
                <m.span
                  key={open ? "x" : "m"}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.15 }}
                  className="grid"
                >
                  {open ? <X className="size-5" /> : <Menu className="size-5" />}
                </m.span>
              </AnimatePresence>
            </button>
          </div>
        </nav>
      </m.header>

      {/* ---------------- mobile drawer ---------------- */}
      <AnimatePresence>
        {open && (
          <m.div className="fixed inset-0 z-50 lg:hidden" initial="hidden" animate="show" exit="exit">
            <m.button
              type="button"
              aria-label="بستن منو"
              className="absolute inset-0 bg-background/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpen(false)}
            />

            <m.aside
              id="mobile-menu"
              variants={sheet}
              className="absolute inset-y-0 end-0 flex w-[88%] max-w-sm flex-col border-s border-border bg-popover/95 shadow-[0_0_80px_rgb(0_0_0_/_0.5)] backdrop-blur-2xl"
            >
              {/* warm glow so the panel doesn't read as a flat grey slab */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 end-[-20%] size-72 rounded-full bg-[radial-gradient(circle,rgb(83_214_245_/_0.22),transparent_70%)] blur-2xl"
              />

              <header className="relative flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                <span className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-lg bg-linear-to-br from-gold to-primary">
                    <ReactIcon className="size-5 text-primary-foreground" />
                  </span>
                  <span className="leading-tight">
                    <span dir="ltr" className="block font-mono text-[13px] font-bold">
                      React 19.2
                    </span>
                    <span className="flex items-center gap-1.5 font-sans text-[10.5px] text-muted-foreground">
                      راهنمای فارسی
                      <i className="size-1 rounded-full bg-primary/60" aria-hidden="true" />
                      ۳۷ فصل
                    </span>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="بستن منو"
                  className="grid size-9 shrink-0 place-items-center rounded-lg border border-input bg-secondary/60 transition-colors hover:border-primary/50 hover:text-primary-soft"
                >
                  <X className="size-4" />
                </button>
              </header>

              <nav className="relative flex-1 overflow-y-auto px-4 py-5" aria-label="ناوبری موبایل">
                <ul className="grid gap-1.5">
                  {LINKS.map((l) => (
                    <m.li key={l.href} variants={row}>
                      <a
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className="group flex items-center gap-3.5 rounded-2xl border border-transparent px-3.5 py-3 transition-colors hover:border-border hover:bg-secondary/50"
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-primary/20 bg-linear-to-br from-primary/15 to-sky/10 text-primary-soft transition-transform group-hover:scale-105">
                          <l.icon className="size-[18px]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-bold">{l.label}</span>
                          <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">
                            {l.hint}
                          </span>
                        </span>
                        <ArrowLeft className="size-4 shrink-0 text-faint transition-all group-hover:-translate-x-0.5 group-hover:text-primary-soft" />
                      </a>
                    </m.li>
                  ))}
                </ul>
              </nav>

              <m.footer variants={row} className="relative grid gap-2.5 border-t border-border px-4 py-4">
                <Button asChild size="lg" className="w-full">
                  <a href={BOOK_URL} target="_blank" rel="noopener" onClick={() => setOpen(false)}>
                    <BookOpen /> مطالعه آنلاین
                  </a>
                </Button>
                <div className="grid grid-cols-2 gap-2.5">
                  <Button asChild variant="outline" size="sm">
                    <a href={PDF_URL} download onClick={() => setOpen(false)}>
                      <Download /> دانلود PDF
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a href={REPO_URL} target="_blank" rel="noopener" onClick={() => setOpen(false)}>
                      <GitHubIcon /> مخزن
                    </a>
                  </Button>
                </div>
                <p className="pt-1 text-center text-[11px] text-faint">
                  ۳۷ فصل · ۲۳۹ صفحه · رایگان و متن‌باز
                </p>
              </m.footer>
            </m.aside>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
