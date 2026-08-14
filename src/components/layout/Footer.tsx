import { BOOK_URL, REPO_URL, ISSUES_URL } from "@/lib/links";

export default function Footer() {
  return (
    <footer className="border-t border-border pb-10 pt-16">
      <div className="container">
        <div
          className="select-none text-center font-mono text-[clamp(40px,9vw,88px)] font-extrabold leading-none tracking-tight text-transparent [-webkit-text-stroke:1px_rgb(255_255_255_/_0.18)]"
          dir="ltr"
          aria-hidden="true"
        >
          React 19.2
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>© ۲۰۲۶ محمدرضا رضائیان · مرجع جامع React 19.2 · CC BY-NC-SA 4.0</div>
          <nav className="flex flex-wrap gap-5" aria-label="پیوندهای پایین صفحه">
            <a href="#top" className="text-sub transition-colors hover:text-primary-soft">بازگشت به بالا ↑</a>
            <a href={REPO_URL} target="_blank" rel="noopener" className="text-sub transition-colors hover:text-primary-soft">مخزن</a>
            <a href={ISSUES_URL} target="_blank" rel="noopener" className="text-sub transition-colors hover:text-primary-soft">گزارش خطا</a>
            <a href={BOOK_URL} target="_blank" rel="noopener" className="text-sub transition-colors hover:text-primary-soft">نسخهٔ آنلاین کتاب</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
