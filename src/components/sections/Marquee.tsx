import { Zap } from "lucide-react";

const ITEMS = [
  "Hooks",
  "useActionState",
  "useOptimistic",
  "Suspense",
  "use",
  "useEffectEvent",
  "Activity",
  "React Compiler",
  "Context",
  "useReducer",
  "React Router v8",
  "Zustand",
  "View Transitions",
  "Server Components",
  "Vitest",
  "TypeScript",
];

function Row() {
  return (
    <>
      {ITEMS.map((t) => (
        <span
          key={t}
          dir="ltr"
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-secondary/50 px-4 py-2.5 font-mono text-[13px] text-sub"
        >
          <Zap className="size-3.5 text-primary" />
          {t}
        </span>
      ))}
    </>
  );
}

export default function Marquee() {
  return (
    <div className="marquee-mask mt-16 overflow-hidden border-y border-border bg-secondary/30 py-6" aria-hidden="true">
      <div dir="ltr" className="flex w-max animate-marquee gap-3.5 hover:[animation-play-state:paused] motion-reduce:animate-none">
        <Row />
        <Row />
      </div>
    </div>
  );
}
