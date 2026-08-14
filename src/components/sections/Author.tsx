"use client";

import Image from "next/image";
import { BookOpen, MessageSquare } from "lucide-react";

import Reveal from "@/components/motion/Reveal";
import Magnetic from "@/components/motion/Magnetic";
import GitHubIcon from "@/components/icons/GitHubIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { asset, AUTHOR_URL, BOOK_URL, ISSUES_URL } from "@/lib/links";

export default function Author() {
  return (
    <section className="pb-24 md:pb-32" id="author">
      <div className="container">
        <Reveal>
          <Card className="grid items-center gap-7 p-6 md:grid-cols-[auto_1fr] md:p-10">
            <div className="rounded-full bg-linear-to-br from-gold to-primary p-[3px]">
              <Image
                src={asset("/author.webp")}
                alt="محمدرضا رضائیان"
                width={640}
                height={640}
                className="size-32 rounded-full border-4 border-background object-cover"
              />
            </div>
            <CardContent className="p-0">
              <h2 className="text-[clamp(22px,3vw,30px)] font-extrabold">محمدرضا رضائیان</h2>
              <p dir="ltr" className="mt-1.5 font-mono text-[11.5px] text-primary-soft">
                React · Next.js · TypeScript · Web Performance · Software Architecture
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                توسعه‌دهنده و نویسندهٔ مجموعه راهنماهای فارسی؛ با تمرکز بر مدل ذهنی، شفافیت مرحله‌به‌مرحله و انتقال تجربهٔ مهندسی به زبان روشن.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Magnetic>
                  <Button asChild size="sm" variant="outline">
                    <a href={AUTHOR_URL} target="_blank" rel="noopener">
                      <GitHubIcon /> GitHub
                    </a>
                  </Button>
                </Magnetic>
                <Magnetic>
                  <Button asChild size="sm" variant="outline">
                    <a href={ISSUES_URL} target="_blank" rel="noopener">
                      <MessageSquare /> گزارش خطا
                    </a>
                  </Button>
                </Magnetic>
                <Magnetic>
                  <Button asChild size="sm">
                    <a href={BOOK_URL} target="_blank" rel="noopener">
                      <BookOpen /> مطالعه آنلاین
                    </a>
                  </Button>
                </Magnetic>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
