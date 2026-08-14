"use client";

import { m, useMotionValue, useSpring, useTransform } from "motion/react";
import { useRef } from "react";

import { cn } from "@/lib/utils";

/** Card that tilts in 3D toward the cursor, with a moving glare highlight. */
export default function TiltCard({
  children,
  className,
  max = 7,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(my, [0, 1], [max, -max]), {
    stiffness: 180,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mx, [0, 1], [-max, max]), {
    stiffness: 180,
    damping: 20,
  });

  const glare = useTransform([mx, my], (v) => {
    const [x, y] = v as number[];
    return `radial-gradient(circle at ${(x * 100).toFixed(1)}% ${(y * 100).toFixed(1)}%, rgb(255 255 255 / 0.13), transparent 55%)`;
  });

  return (
    // h-full must be on BOTH the perspective wrapper and the motion div,
    // otherwise the grid's stretch never reaches the Card and siblings in a
    // row end up with different heights.
    <div className="h-full" style={{ perspective: 900 }}>
      <m.div
        ref={ref}
        className={cn("h-full", className)}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        onMouseMove={(e) => {
          const r = ref.current?.getBoundingClientRect();
          if (!r) return;
          mx.set((e.clientX - r.left) / r.width);
          my.set((e.clientY - r.top) / r.height);
        }}
        onMouseLeave={() => {
          mx.set(0.5);
          my.set(0.5);
        }}
      >
        <m.span className="tilt-glare rounded-2xl" style={{ background: glare }} aria-hidden="true" />
        {children}
      </m.div>
    </div>
  );
}
