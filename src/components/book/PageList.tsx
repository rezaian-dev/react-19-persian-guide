import { Fragment } from "react";
import Link from "next/link";

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

/**
 * The typeset pages of the online edition.
 *
 * Every page of the print PDF is shown in reading order as a sharp 2x WebP
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
      <main id="pages" className="pages">
        {Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).map((page) => {
          const chapter = chapterOnPage(page);
          const part = chapter ? partOf(chapter.num) : undefined;
          return (
            <Fragment key={page}>
              {chapter && (
                <div className="ch-head" id={chapterId(chapter.num)}>
                  <span className="kicker">{part?.name ?? ""}</span>
                  <h2>
                    {fa(String(chapter.num).padStart(2, "0"))} · {chapter.title}
                  </h2>
                  {chapter.subtitle ? <p>{chapter.subtitle}</p> : null}
                </div>
              )}
              <figure className="pg" id={`p-${String(page).padStart(3, "0")}`}>
                <img
                  src={asset(`/book/pages/${pageFile(page)}`)}
                  width={BOOK.pageWidth}
                  height={BOOK.pageHeight}
                  alt={`صفحه ${fa(page)}`}
                  decoding="async"
                  loading={page <= 2 ? undefined : "lazy"}
                />
                <figcaption>{fa(page)}</figcaption>
              </figure>
            </Fragment>
          );
        })}
      </main>

      <footer className="end">
        <p>
          پایان کتاب — {fa(TOTAL_PAGES)} صفحه، {fa(TOTAL_BOOK_CHAPTERS)} فصل.
        </p>
        <div className="end-cta">
          <a className="btn primary" href={asset(`/pdf/${BOOK.pdfFile}`)} download>
            دانلود PDF
          </a>
          <a className="btn" href={asset(`/pdf/${BOOK.epubFile}`)} download>
            دانلود EPUB
          </a>
          <Link className="btn" href="/">
            صفحهٔ کتاب
          </Link>
        </div>
        <small>
          © {fa(BOOK.year)} {BOOK.author} · {BOOK.license}
        </small>
      </footer>
    </>
  );
}
