"use client";

import { m, useScroll, useSpring } from "motion/react";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.4 });

  return (
    <m.div
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-right bg-linear-to-l from-gold to-primary shadow-[0_0_18px_rgb(56_189_248_/_0.6)]"
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
}
