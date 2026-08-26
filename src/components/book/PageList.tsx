import { Fragment } from "react";
import Link from "next/link";
import { Maximize2 } from "lucide-react";

import { asset } from "@/lib/links";
import {
  BOOK,
  chapterId,
  chapterOnPage,
  fa,
  partOf,
  TOTAL_BOOK_CHAPTERS,
  TOTAL_PAGES,
} from "@/lib/book";

function pageFile(page: number): string {
  return `p${String(page).padStart(3, "0")}.webp`;
}

const FOCUS =
  "focus-visible:outline-[3px] focus-visible:outline-sky-400 focus-visible:outline-offset-2";

/**
 * The typeset pages of the online edition.
 *
 * Every page of the print PDF is shown in reading order as a sharp 3x WebP
 * figure; a `#ch-NN` anchor head is dropped wherever a chapter starts so the
 * chapter list and README can deep-link to it. Only the first two images are
 * eager — the rest carry `loading="lazy"` plus intrinsic dimensions, so the
 * route costs one screen of images and never reflows.
 *
 * Server-rendered: zero client JavaScript for the page column itself.
 */
export default function PageList() {
  return (
    <>
      <p className="mx-auto mt-6 w-[min(820px,calc(100%-24px))] rounded-xl border border-white/10 bg-[#182240]/70 px-4 py-2.5 text-center text-xs leading-6 text-[#b2bcd0]">
        💡 نسخهٔ آنلاین تصویرمحور است و متن آن قابل انتخاب نیست؛ برای خواندن
        جزئیات، هر صفحه را با دکمهٔ «بزرگ‌نمایی» در اندازهٔ کامل باز کنید یا
        نسخهٔ PDF قابل جست‌وجو را دانلود کنید.
      </p>

      <main id="pages" className="mx-auto mt-[26px] grid w-[min(820px,calc(100%-24px))] gap-4 [overflow-anchor:none]">
        {Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).map((page) => {
          const chapter = chapterOnPage(page);
          const part = chapter ? partOf(chapter.num) : undefined;
          const full = asset(`/book/pages/${pageFile(page)}`);
          return (
            <Fragment key={page}>
              {chapter && (
                <div
                  data-ch-head
                  className="mb-1.5 mt-[26px] rounded-2xl border border-white/15 bg-[linear-gradient(145deg,rgba(32,43,72,0.9),rgba(24,34,60,0.72))] p-[18px_20px]"
                  id={chapterId(chapter.num)}
                >
                  <span className="mb-1.5 block text-[11px] font-extrabold tracking-wide text-sky-400">
                    {part?.name ?? ""}
                  </span>
                  <h2 className="m-0 text-[clamp(18px,2.6vw,23px)] font-extrabold leading-[1.4]">
                    {fa(String(chapter.num).padStart(2, "0"))} · {chapter.title}
                  </h2>
                  {chapter.subtitle ? (
                    <p className="mb-0 mt-1.5 text-[13.5px] leading-[1.6] text-[#b2bcd0]">
                      {chapter.subtitle}
                    </p>
                  ) : null}
                </div>
              )}
              <figure className="relative m-0" id={`p-${String(page).padStart(3, "0")}`}>
                <img
                  src={full}
                  width={BOOK.pageWidth}
                  height={BOOK.pageHeight}
                  alt={`صفحه ${fa(page)}`}
                  decoding="async"
                  loading={page <= 2 ? undefined : "lazy"}
                  className="block h-auto w-full rounded-xl border border-white/10 bg-white shadow-[0_14px_40px_rgba(0,0,0,0.3)]"
                />
                <figcaption className="absolute bottom-[9px] start-[9px] rounded-md bg-[#111a30]/80 px-[7px] py-[3px] font-mono text-[10px] font-bold text-[#b2bcd0] backdrop-blur">
                  {fa(page)}
                </figcaption>
                <a
                  href={full}
                  target="_blank"
                  rel="noopener"
                  aria-label={`باز کردن صفحهٔ ${fa(page)} در اندازهٔ کامل`}
                  className={`${FOCUS} absolute end-2 top-2 inline-flex items-center gap-1 rounded-lg bg-[#111a30]/85 px-2 py-1.5 text-[10.5px] font-bold text-[#b2bcd0] no-underline backdrop-blur transition-colors hover:text-white`}
                >
                  <Maximize2 className="size-3.5" aria-hidden="true" />
                  بزرگ‌نمایی
                </a>
              </figure>
            </Fragment>
          );
        })}
      </main>

      <footer className="mx-auto mb-0 mt-[34px] w-[min(820px,calc(100%-24px))] border-t border-white/10 px-0 py-[26px_40px] text-center">
        <p className="mb-3.5 mt-0 text-sm font-bold">
          پایان کتاب — {fa(TOTAL_PAGES)} صفحه، {fa(TOTAL_BOOK_CHAPTERS)} فصل.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <a
            href={asset(`/pdf/${BOOK.pdfFile}`)}
            download
            className={`${FOCUS} inline-flex min-h-[42px] items-center justify-center rounded-[11px] border border-transparent bg-[linear-gradient(135deg,#38bdf8,#51a0f7)] px-4 py-2 text-[13px] font-extrabold text-[#03101a] no-underline`}
          >
            دانلود PDF
          </a>
          <a
            href={asset(`/pdf/${BOOK.epubFile}`)}
            download
            className={`${FOCUS} inline-flex min-h-[42px] items-center justify-center rounded-[11px] border border-white/15 bg-[#202b48]/70 px-4 py-2 text-[13px] font-extrabold text-[#f6f8fd] no-underline`}
          >
            دانلود EPUB
          </a>
          <Link
            href="/"
            className={`${FOCUS} inline-flex min-h-[42px] items-center justify-center rounded-[11px] border border-white/15 bg-[#202b48]/70 px-4 py-2 text-[13px] font-extrabold text-[#f6f8fd] no-underline`}
          >
            صفحهٔ کتاب
          </Link>
        </div>
        <small className="mt-4 block text-[11.5px] text-[#8b95ad]">
          © {fa(BOOK.year)} {BOOK.author} · {BOOK.license}
        </small>
      </footer>
    </>
  );
}
