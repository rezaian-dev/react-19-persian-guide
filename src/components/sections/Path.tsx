"use client";

import SectionHeader from "@/components/layout/SectionHeader";
import Reveal from "@/components/motion/Reveal";
import TiltCard from "@/components/motion/TiltCard";
import { Card, CardContent } from "@/components/ui/card";
import { PARTS } from "@/lib/chapters";

export default function Path() {
  return (
    <section className="py-24 md:py-32" id="path">
      <div className="container">
        <SectionHeader
          eyebrow="Learning path"
          title={<>مسیر کتاب در <span className="grad-text">چهار گام</span></>}
          lead="از صفر تا سطح حرفه‌ای؛ هر گام یک دستاورد ملموس دارد."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PARTS.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.09}>
              <TiltCard className="h-full">
                <Card className="h-full">
                  <CardContent className="flex-1 pt-6">
                    <span dir="ltr" className="font-mono text-[40px] font-extrabold leading-none text-transparent [-webkit-text-stroke:1.5px_rgb(154_216_251_/_0.5)]">
                      0{i + 1}
                    </span>
                    <span className="mt-1.5 block text-xl">{p.emoji}</span>
                    <h3 className="mt-3 text-base font-extrabold">{p.label}</h3>
                    <span className="mt-1 block text-xs font-bold text-primary-soft">{p.range}</span>
                    <p className="mt-3 text-[13px] leading-7 text-muted-foreground">{p.tagline}</p>
                    <p className="mt-3.5 border-t border-dashed border-input pt-3.5 text-xs font-bold text-sub">
                      🎯 {p.outcome}
                    </p>
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
