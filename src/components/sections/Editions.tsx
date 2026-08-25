"use client";

import Link from "next/link";
import { BookOpen, FileText, Smartphone } from "lucide-react";

import SectionHeader from "@/components/layout/SectionHeader";
import Reveal from "@/components/motion/Reveal";
import TiltCard from "@/components/motion/TiltCard";
import GitHubIcon from "@/components/icons/GitHubIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES, PDF_URL, PRINT_URL, EPUB_URL, REPO_URL } from "@/lib/links";

type Edition = {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  title: string;
  text: string;
  meta: string;
  cta: string;
  route?: string;
  href?: string;
  download?: boolean;
  external?: boolean;
  extra?: { href: string; label: string };
};

const EDITIONS: Edition[] = [
  { icon: BookOpen, title: "نسخهٔ آنلاین", text: "هر ۲۳۹ صفحهٔ کتاب در مرورگر، با فهرست فصل‌ها و پیوند مستقیم به هر فصل؛ بدون دانلود.", meta: "۳۷ فصل · رایگان", route: ROUTES.book, cta: "مطالعه آنلاین" },
  { icon: FileText, title: "PDF", text: "A4 رنگی، قابل جست‌وجو و آمادهٔ چاپ.", meta: "۲۳۹ صفحه · A4", href: PDF_URL, cta: "دانلود PDF", download: true, extra: { href: PRINT_URL, label: "نسخهٔ چاپی سیاه‌وسفید (۲۴۰ صفحه)" } },
  { icon: Smartphone, title: "EPUB", text: "نسخهٔ بازچینش‌پذیر راست‌به‌چپ با فونت داخلی برای کتاب‌خوان و موبایل.", meta: "EPUB 3 · فونت داخلی", href: EPUB_URL, cta: "دانلود EPUB", download: true },
  { icon: GitHubIcon, title: "مخزن پروژه", text: "سورس سایت، فایل‌های کتاب و تاریخچهٔ نسخه‌ها.", meta: "Next.js · TypeScript", href: REPO_URL, cta: "مشاهده مخزن", external: true },
];

export default function Editions() {
  return (
    <section className="py-24 md:py-32" id="editions">
      <div className="container">
        <SectionHeader
          eyebrow="Editions"
          title={<>نسخهٔ مناسب <span className="grad-text">خودت</span> را بردار</>}
          lead="همهٔ نسخه‌ها رایگان‌اند — هر طور راحت‌تری، شروع کن."
          center
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {EDITIONS.map((e, i) => (
            <Reveal key={e.title} delay={i * 0.08}>
              <TiltCard className="h-full">
                <Card className="h-full">
                  <CardHeader>
                    <span className="mb-1 grid size-11 place-items-center rounded-[13px] border border-primary/25 bg-linear-to-br from-primary/15 to-sky/10 text-primary-soft">
                      <e.icon className="size-5" />
                    </span>
                    <CardTitle className="text-base">{e.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-[13px] leading-6 text-muted-foreground">{e.text}</p>
                    <p className="mt-3 text-xs font-bold text-sub">{e.meta}</p>
                  </CardContent>
                  <CardFooter className="mt-auto flex-col items-stretch gap-2">
                    <Button asChild size="sm" className="w-full">
                      {e.route ? (
                        <Link href={e.route}>{e.cta}</Link>
                      ) : (
                        <a
                          href={e.href}
                          {...(e.download ? { download: true } : {})}
                          {...(e.external ? { target: "_blank", rel: "noopener" } : {})}
                        >
                          {e.cta}
                        </a>
                      )}
                    </Button>
                    {e.extra && (
                      <a href={e.extra.href} download className="text-center text-xs font-bold text-primary-soft transition-colors hover:text-foreground">
                        {e.extra.label}
                      </a>
                    )}
                  </CardFooter>
                </Card>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
