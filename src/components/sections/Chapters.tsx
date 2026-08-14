"use client";

import { BookOpen } from "lucide-react";

import SectionHeader from "@/components/layout/SectionHeader";
import Reveal from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PARTS } from "@/lib/chapters";
import { BOOK_URL, chapterUrl } from "@/lib/links";

export default function Chapters() {
  return (
    <section className="py-24 md:py-32" id="chapters">
      <div className="container">
        <SectionHeader
          eyebrow="Chapters"
          title={<>فهرست <span className="grad-text">۳۷ فصل</span></>}
          lead="چهار بخش، یک مسیر پیوسته. روی هر بخش کلیک کنید تا فصل‌هایش باز شود."
        />
        <div className="grid gap-3.5">
          <Accordion type="single" collapsible defaultValue="part-1">
            {PARTS.map((part) => (
              <AccordionItem
                key={part.id}
                value={part.id}
                className="glass mb-3.5 overflow-hidden rounded-2xl border-0"
              >
                <AccordionTrigger className="px-5 py-5 md:px-6">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-primary/20 bg-linear-to-br from-primary/15 to-sky/10 text-xl">
                    {part.emoji}
                  </span>
                  <span className="min-w-0 flex-1 text-start">
                    <span className="block text-base font-extrabold md:text-[17px]">{part.label}</span>
                    <span className="mt-0.5 block text-xs text-primary-soft">{part.range}</span>
                  </span>
                  <span dir="ltr" className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:block">
                    {part.chapters.length} chapters
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-5 md:px-6">
                  <div className="grid gap-1.5 sm:grid-cols-2">
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
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <Reveal delay={0.1}>
          <div className="mt-10 flex justify-center">
            <Button asChild size="lg">
              <a href={BOOK_URL} target="_blank" rel="noopener">
                <BookOpen /> مطالعهٔ کامل کتاب
              </a>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
