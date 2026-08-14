"use client";

import { cn } from "@/lib/utils";
import SectionHeader from "@/components/layout/SectionHeader";
import Reveal from "@/components/motion/Reveal";
import TiltCard from "@/components/motion/TiltCard";
import { Card, CardContent } from "@/components/ui/card";

const SERIES = [
  { badge: "JS", title: "JavaScript ES2025", text: "زبان و مدل ذهنی؛ پایهٔ مسیر توسعه وب", href: "https://rezaian-dev.github.io/javascript-persian-guide/" },
  { badge: "RE", title: "React 19.2", text: "رابط کاربری، state و معماری کامپوننت", href: "#top", current: true },
  { badge: "NX", title: "Next.js 16", text: "فریم‌ورک، رندر سرور و استقرار", href: "https://rezaian-dev.github.io/nextjs-16-persian-guide/" },
  { badge: "GIT", title: "Git & GitHub 2026", text: "نسخه‌بندی، VS Code و همکاری روی GitHub", href: "https://rezaian-dev.github.io/git-github-persian-guide/" },
];

export default function Series() {
  return (
    <section className="py-24 md:py-32" id="series">
      <div className="container">
        <SectionHeader
          eyebrow="The collection"
          title={<>چهار مرجع، <span className="grad-text">یک مسیر منسجم</span></>}
          lead="JavaScript برای زبان؛ React برای رابط؛ Next.js برای Production؛ Git برای همکاری."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {SERIES.map((s, i) => (
            <Reveal key={s.badge} delay={i * 0.07}>
              <TiltCard className="h-full">
                <Card className={cn("h-full", s.current && "border-primary/50 bg-linear-to-br from-primary/15 to-sky/5")}>
                  <CardContent className="flex h-full flex-1 flex-col gap-3 pt-6">
                    <span dir="ltr" className="grid size-11 place-items-center rounded-[13px] border border-input bg-secondary/50 font-mono text-[13px] font-extrabold text-primary-soft">
                      {s.badge}
                    </span>
                    <h3 dir="ltr" className="font-mono text-[15px] font-bold">{s.title}</h3>
                    <p className="flex-1 text-xs leading-6 text-muted-foreground">{s.text}</p>
                    {s.current ? (
                      <span className="w-max rounded-full bg-linear-to-r from-gold to-primary px-3 py-1 text-[11px] font-bold text-primary-foreground">
                        همین حالا اینجایی
                      </span>
                    ) : (
                      <a href={s.href} target="_blank" rel="noopener" className="text-xs font-bold text-primary-soft">
                        مشاهده ←
                      </a>
                    )}
                  </CardContent>
                </Card>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
