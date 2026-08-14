"use client";

import { Brain, Zap, CloudDownload, Gauge, Boxes, GraduationCap } from "lucide-react";

import SectionHeader from "@/components/layout/SectionHeader";
import Reveal from "@/components/motion/Reveal";
import TiltCard from "@/components/motion/TiltCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FEATURES = [
  { icon: Brain, title: "مدل ذهنی رندر، درست", text: "می‌دانی state کِی عکس می‌گیرد، رندر چند مرحله دارد و چرا کامپوننتت دوباره اجرا شد." },
  { icon: Zap, title: "Actions در React 19", text: "`useActionState`، `useFormStatus` و `useOptimistic`؛ فرم‌ها بدون state دستی و بدون `onSubmit`." },
  { icon: CloudDownload, title: "داده با Suspense و use", text: "واکشی بدون آبشار، مرزهای `Suspense` و خواندن Promise با API `use` در رندر." },
  { icon: Gauge, title: "React Compiler و Concurrent", text: "خداحافظی با memoization دستی؛ `useTransition`، `useDeferredValue` و `<Activity>`." },
  { icon: Boxes, title: "معماری در مقیاس", text: "ساختار feature-based، الگوهای Compound و Headless، state در مقیاس با Zustand و Redux." },
  { icon: GraduationCap, title: "کارگاه و مصاحبه", text: "هشت مینی‌پروژه، چهل‌وپنج پرسش مصاحبه و صد‌وسی‌وسه مدخل واژه‌نامه." },
];

export default function Features() {
  return (
    <section className="py-24 md:py-32" id="features">
      <div className="container">
        <SectionHeader
          eyebrow="Why this guide"
          title={<>Actions-first، با <span className="grad-text">مدل ذهنی درست</span></>}
          lead="هر مفهوم اول روی مدل اجرای React می‌نشیند؛ بعد در یک نمونهٔ واقعی پیاده می‌شود."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.08}>
              <TiltCard className="h-full">
                <Card className="h-full">
                  <CardHeader>
                    <span className="mb-1 grid size-12 place-items-center rounded-[14px] border border-primary/25 bg-linear-to-br from-primary/15 to-sky/10 text-primary-soft">
                      <f.icon className="size-6" />
                    </span>
                    <CardTitle className="text-[17px]">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 text-[13.5px] leading-7 text-muted-foreground">
                    {f.text.split("`").map((p, j) =>
                      j % 2 === 1 ? (
                        <code key={j} className="rounded-md border border-border bg-secondary/60 px-1.5 py-0.5 font-mono text-xs text-primary-soft">{p}</code>
                      ) : (
                        <span key={j}>{p}</span>
                      )
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
