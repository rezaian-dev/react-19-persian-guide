import { cn } from "@/lib/utils";
import Reveal from "@/components/motion/Reveal";

export default function SectionHeader({
  eyebrow,
  title,
  lead,
  center,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: string;
  center?: boolean;
}) {
  return (
    <Reveal className={cn("mb-12 max-w-3xl", center && "mx-auto text-center")}>
      <span
        dir="ltr"
        className={cn(
          "mb-4 flex items-center gap-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-primary-soft",
          center && "justify-center"
        )}
      >
        <i className="h-px w-6 bg-primary shadow-[0_0_12px_var(--color-primary)]" aria-hidden="true" />
        {eyebrow}
      </span>
      <h2 className="text-[clamp(30px,4.6vw,50px)] font-extrabold leading-[1.22] tracking-tight">
        {title}
      </h2>
      {lead && <p className="mt-3.5 text-base leading-8 text-muted-foreground">{lead}</p>}
    </Reveal>
  );
}
