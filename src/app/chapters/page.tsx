import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, ExternalLink } from "lucide-react";

import Background from "@/components/layout/Background";
import ScrollProgress from "@/components/layout/ScrollProgress";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PARTS, TOTAL_CHAPTERS } from "@/lib/chapters";
import { BOOK_URL, chapterUrl } from "@/lib/links";

export const metadata: Metadata = {
  title: "فهرست فصل‌ها | مرجع جامع React 19.2",
  description: "فهرست کامل ۳۷ فصل مرجع فارسی React 19.2 — از JSX و State تا معماری Production‏.",
};

export default function BookPage() {
  return (
    <>
      <Background />
      <ScrollProgress />
      <Navbar />

      <main className="container pb-24 pt-36">
        <header className="mx-auto mb-12 max-w-2xl text-center">
          <span dir="ltr" className="mb-4 flex items-center justify-center gap-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-primary-soft">
            <i className="h-px w-6 bg-primary shadow-[0_0_12px_var(--color-primary)]" aria-hidden="true" />
            Table of contents
          </span>
          <h1 className="text-[clamp(30px,4.6vw,50px)] font-extrabold leading-tight">
            <span className="grad-text">۳۷ فصل</span> در چهار بخش
          </h1>
          <p className="mt-3.5 text-base leading-8 text-muted-foreground">
            هر بخش یک مرحله از مسیر است: از JSX و State تا معماری Production‏. روی هر فصل کلیک کنید تا مستقیم در نسخهٔ آنلاین کتاب باز شود.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <a href={BOOK_URL} target="_blank" rel="noopener">
                <BookOpen /> مطالعهٔ کامل کتاب <ExternalLink />
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowRight /> بازگشت به خانه
              </Link>
            </Button>
          </div>
        </header>

        <div className="grid gap-3.5">
          {PARTS.map((part) => (
            <Card key={part.id} className="gap-0 p-0">
              <div className="flex items-center gap-4 px-5 py-5 md:px-6">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-primary/20 bg-linear-to-br from-primary/15 to-sky/10 text-xl">
                  {part.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-extrabold md:text-[17px]">{part.label}</span>
                  <span className="mt-0.5 block text-xs text-primary-soft">{part.range}</span>
                </span>
                <span dir="ltr" className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:block">
                  {part.chapters.length} chapters
                </span>
              </div>
              <CardContent className="grid gap-1.5 sm:grid-cols-2">
                {part.chapters.map((c) => (
                  <a
                    key={c.n}
                    href={chapterUrl(c.n)}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center gap-3 rounded-xl border border-transparent px-3.5 py-2.5 transition-colors hover:border-border hover:bg-secondary/40"
                  >
                    <span dir="ltr" className="grid size-7 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 font-mono text-[11px] font-bold text-primary-soft">
                      {c.n}
                    </span>
                    <span className="text-[13.5px] text-sub">{c.title}</span>
                  </a>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-center text-[13px] text-muted-foreground">
          مجموع {TOTAL_CHAPTERS} فصل · ۲۳۹ صفحه · رایگان و متن‌باز
        </p>
      </main>

      <Footer />
    </>
  );
}
