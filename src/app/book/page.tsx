import type { Metadata } from "next";

import ReaderHeader from "@/components/book/ReaderHeader";
import PageList from "@/components/book/PageList";
import { BOOK, fa, TOTAL_BOOK_CHAPTERS } from "@/lib/book";
import { SITE_URL } from "@/lib/links";

const title = `${BOOK.title} — نسخهٔ آنلاین`;
const description = `خواندن آنلاین ${BOOK.title}؛ ${fa(BOOK.pages)} صفحه، ${fa(TOTAL_BOOK_CHAPTERS)} فصل، رایگان و بدون دانلود.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/book/` },
  openGraph: {
    title,
    description,
    url: `${SITE_URL}/book/`,
    siteName: "Persian Developer Handbook",
    images: [{ url: `${SITE_URL}/${BOOK.socialCard}`, width: 1280, height: 640 }],
    locale: "fa_IR",
    type: "book",
  },
  twitter: { card: "summary_large_image" },
};

export default function BookPage() {
  return (
    <div className="min-h-svh bg-[#111a30] bg-[radial-gradient(50rem_34rem_at_88%_-6%,rgb(56_189_248/0.16),transparent_62%),radial-gradient(46rem_32rem_at_8%_2%,rgb(139_92_246/0.16),transparent_64%),linear-gradient(180deg,#0e1729,#111a30_40%,#16203c)] font-sans text-[#f6f8fd]">
      <a
        href="#pages"
        className="fixed start-4 top-2.5 z-[200] -translate-y-32 rounded-[10px] bg-sky-400 px-[13px] py-[9px] font-extrabold text-[#03101a] no-underline focus:translate-y-0 focus-visible:outline-[3px] focus-visible:outline-white"
      >
        پرش به متن کتاب
      </a>
      <ReaderHeader />
      <PageList />
    </div>
  );
}
