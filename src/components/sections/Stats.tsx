import Counter from "@/components/motion/Counter";
import Reveal from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

const STATS = [
  { to: 37, label: "فصل ساختاریافته" },
  { to: 239, label: "صفحهٔ رنگی PDF" },
  { to: 8, label: "مینی‌پروژهٔ کارگاه" },
  { to: 45, label: "پرسش مصاحبه" },
  { to: 133, label: "مدخل واژه‌نامه" },
];

export default function Stats() {
  return (
    <div className="container" id="stats">
      <Reveal>
        <div
          className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-3 lg:grid-cols-5"
          aria-label="آمار کتاب"
        >
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={cn(
                "relative overflow-hidden bg-card px-3 py-7 text-center",
                i === STATS.length - 1 && "col-span-2 lg:col-span-1",
              )}
            >
              <span className="grad-text block text-[clamp(30px,4vw,44px)] font-extrabold leading-none">
                <Counter to={s.to} />
              </span>
              <span className="mt-1.5 block text-xs leading-relaxed text-balance text-muted-foreground">
                {s.label}
              </span>
              <i className="absolute inset-x-0 bottom-0 h-0.5 bg-linear-to-l from-gold to-primary opacity-70" aria-hidden="true" />
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
