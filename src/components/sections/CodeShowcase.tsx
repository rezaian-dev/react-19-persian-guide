"use client";

import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

import Reveal from "@/components/motion/Reveal";
import { Badge } from "@/components/ui/badge";

const CHIPS = ["useActionState", "useOptimistic", "Suspense", "use", "Activity", "Compiler"];

const LINES = [
  { text: "// فرم با Action — بدون state دستی و بدون onSubmit", cls: "text-faint" },
  { text: "async function addTodo(prev, formData) {", cls: "text-sky-300" },
  { text: "  const title = formData.get(\"title\");", cls: "text-sky-300" },
  { text: "  await db.todos.add(title);", cls: "text-sky-300" },
  { text: "  revalidatePath(\"/\");", cls: "text-sky-300" },
  { text: "  return null;", cls: "text-sky-300" },
  { text: "}", cls: "text-sky-300" },
  { text: "", cls: "" },
  { text: "// pending و خطا خودکار مدیریت می‌شوند", cls: "text-faint" },
  { text: "export function AddTodo() {", cls: "text-sky-300" },
  { text: "  const [error, action, pending] =", cls: "text-sky-300" },
  { text: "    useActionState(addTodo, null);", cls: "text-violet-300" },
  { text: "  return (", cls: "text-sky-300" },
  { text: "    <form action={action}>", cls: "text-violet-300" },
  { text: "      <input name=\"title\" required />", cls: "text-violet-300" },
  { text: "      <SubmitButton pending={pending} />", cls: "text-violet-300" },
  { text: "    </form>", cls: "text-violet-300" },
  { text: "  );", cls: "text-sky-300" },
  { text: "}", cls: "text-sky-300" },
];

const PLAIN = LINES.map((l) => l.text).join("\n");

export default function CodeShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [typed, setTyped] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      if (i >= PLAIN.length) {
        i = PLAIN.length;
        clearInterval(id);
        setTimeout(() => setDone(true), 300);
      }
      setTyped(i);
    }, 22);
    return () => clearInterval(id);
  }, [inView]);

  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <Reveal>
          <div ref={ref} className="glass grid items-center gap-10 rounded-3xl p-6 md:grid-cols-[0.85fr_1.15fr] md:p-10">
            <div>
              <span dir="ltr" className="mb-4 flex items-center gap-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-primary-soft">
                <i className="h-px w-6 bg-primary shadow-[0_0_12px_var(--color-primary)]" aria-hidden="true" />
                Code first
              </span>
              <h2 className="text-[clamp(26px,3.5vw,38px)] font-extrabold leading-tight">
کد <span className="grad-text">Production</span>، نه اسباب‌بازی
              </h2>
              <p className="mt-3.5 text-[15px] leading-8 text-muted-foreground">
                هر الگو با کد کامل و قابل اجرا می‌آید؛ صدها پنجرهٔ کد TypeScript در طول کتاب.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {CHIPS.map((c) => (
                  <Badge key={c} variant="secondary" className="px-3 py-1.5 font-mono text-[11px] text-sub" dir="ltr">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>

            <div dir="ltr" className="overflow-hidden rounded-2xl border border-input bg-card shadow-[0_40px_110px_-30px_rgb(4_10_18_/_0.65)]">
              <div className="flex items-center gap-1.5 border-b border-border bg-secondary/40 px-4 py-3 font-mono text-[11.5px] text-muted-foreground">
                <i className="size-2.5 rounded-full bg-[#ff5f57]" />
                <i className="size-2.5 rounded-full bg-[#febc2e]" />
                <i className="size-2.5 rounded-full bg-[#28c840]" />
                <span className="ms-2">src/components/AddTodo.tsx</span>
              </div>
              <pre className="min-h-[330px] whitespace-pre-wrap p-5 text-left font-mono text-[clamp(12.5px,1.4vw,14px)] leading-8 text-sub" tabIndex={0}>
                {done
                  ? LINES.map((l, idx) =>
                      l.text === "" ? "\n" : (
                        <span key={idx} className={l.cls}>
                          {l.text}
                          {"\n"}
                        </span>
                      )
                    )
                  : PLAIN.slice(0, typed)}
                {!done && (
                  <span className="ms-0.5 inline-block h-[1.1em] w-[9px] animate-blink align-text-bottom bg-primary shadow-[0_0_12px_var(--color-primary)]" />
                )}
              </pre>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
