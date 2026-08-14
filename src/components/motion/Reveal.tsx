"use client";

import { m } from "motion/react";

import { cn } from "@/lib/utils";

export default function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <m.div
      // h-full so a Reveal used as a grid item passes stretch down to the card
      className={cn("h-full", className)}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </m.div>
  );
}
