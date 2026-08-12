"use client";

import { LazyMotion, domAnimation } from "motion/react";

/** Lazy-load only the DOM animation feature set to keep the bundle small. */
export default function MotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
