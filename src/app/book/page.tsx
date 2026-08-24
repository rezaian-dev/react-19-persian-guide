import type { Metadata } from "next";

import ReaderHeader from "@/components/book/ReaderHeader";
import PageList from "@/components/book/PageList";
import { BOOK, fa, TOTAL_BOOK_CHAPTERS } from "@/lib/book";
import { SITE_URL } from "@/lib/links";
import "./reader.css";

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
    <>
      <a className="skip" href="#pages">
        پرش به متن کتاب
      </a>
      <ReaderHeader />
      <PageList />
    </>
  );
}
