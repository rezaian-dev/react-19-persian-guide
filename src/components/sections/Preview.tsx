"use client";

import Image from "next/image";

import SectionHeader from "@/components/layout/SectionHeader";
import Reveal from "@/components/motion/Reveal";
import { asset } from "@/lib/links";

const PREVIEWS = [
  { src: "/preview-toc.webp", full: "/page-toc.jpg", label: "فهرست مطالب" },
  { src: "/preview-chapter.webp", full: "/page-chapter.jpg", label: "ساختار فصل" },
  { src: "/preview-code.webp", full: "/page-code.jpg", label: "Actions و فرم‌ها" },
  { src: "/preview-workshop.webp", full: "/page-workshop.jpg", label: "کارگاه پروژه" },
  { src: "/preview-interview.webp", full: "/page-interview.jpg", label: "پرسش مصاحبه" },
];

export default function Preview() {
  return (
    <section className="py-24 md:py-32" id="preview">
      <div className="container">
        <SectionHeader
          eyebrow="Book preview"
          title={<>نگاهی به <span className="grad-text">داخل کتاب</span></>}
          lead="پنج صفحهٔ برگزیده — روی هر کدام کلیک کنید تا در اندازهٔ کامل ببینید."
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {PREVIEWS.map((p, i) => (
            <Reveal key={p.src} delay={i * 0.07}>
              <a
                href={asset(p.full)}
                target="_blank"
                rel="noopener"
                className="group relative block overflow-hidden rounded-2xl border border-border shadow-[0_26px_70px_-24px_rgb(4_10_18_/_0.65)] transition-colors hover:border-primary/50"
              >
                <Image
                  src={asset(p.src)}
                  alt={p.label}
                  width={420}
                  height={594}
                  sizes="(max-width: 640px) 45vw, 220px"
                  className="aspect-[1/1.41] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-background/95 to-transparent px-2.5 pb-3 pt-7 text-center text-xs font-bold text-foreground">
                  {p.label}
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
