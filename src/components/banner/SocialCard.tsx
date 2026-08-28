import { asset } from "@/lib/links";
import { BOOK, fa } from "@/lib/book";
import ReactBrandIcon from "@/components/icons/ReactBrandIcon";

const STATS = [
  { value: fa(37), label: "فصل" },
  { value: fa(BOOK.pages), label: "صفحه" },
  { value: fa(8), label: "مینی‌پروژه" },
  { value: fa(45), label: "پرسش مصاحبه" },
];

/**
 * Fixed-size (1280×640) banner / OG card for the React 19.2 handbook.
 *
 * Pure Tailwind, real Persian typography (Vazirmatn via next/font) and the
 * official React brand mark — no AI-guessed logo, no code-window clutter.
 * Rendered by the `/social-card` route (not linked anywhere in the UI):
 * screenshot that route at 1280×640 to regenerate the images —
 *   1x → `public/social-card.png` (Open Graph)
 *   3x → `assets/readme/react-19-persian-guide-banner.png` (README hero)
 *
 * The footer is a separate block: divider line, 24px of padding, then the
 * author content — nothing may cross above the line.
 */
export default function SocialCard() {
  return (
    <div
      role="img"
      aria-label="مرجع فارسی React 19.2 — از اولین کامپوننت تا معماری Production"
      dir="rtl"
      className="relative h-[640px] w-[1280px] overflow-hidden bg-[#0b1226] font-sans text-slate-100"
    >
      {/* ambient glows */}
      <div
        aria-hidden="true"
        className="absolute -left-36 -top-10 size-[640px] rounded-full bg-[radial-gradient(circle,rgb(56_189_248/0.32),transparent_65%)] blur-[10px]"
      />
      <div
        aria-hidden="true"
        className="absolute -right-30 top-15 size-[560px] rounded-full bg-[radial-gradient(circle,rgb(139_92_246/0.26),transparent_65%)] blur-[10px]"
      />
      {/* blueprint grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(rgb(148_163_184/0.09)_1px,transparent_1px),linear-gradient(90deg,rgb(148_163_184/0.09)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_40%,#000_20%,transparent_75%)]"
      />

      <div className="absolute inset-0 flex flex-col px-16 pb-10 pt-14">
        <div className="flex flex-1 gap-8">
          {/* title column */}
          <div className="w-[620px]">
            <p className="font-mono text-sm tracking-[0.35em] text-cyan-300">
              PERSIAN DEVELOPER HANDBOOK · 2026
            </p>
            <h1 className="mt-2">
              <span className="block text-[60px] font-extrabold leading-[1.25] text-white">
                مرجع فارسی
              </span>
              <span
                dir="ltr"
                className="block font-mono text-[78px] font-extrabold leading-[1.05] tracking-tight text-[#61DAFB]"
              >
                React 19.2
              </span>
            </h1>
            <p className="mt-3 text-[21px] leading-8 text-slate-200">
              از اولین کامپوننت تا معماری رابط کاربری در Production
            </p>
            <div className="mt-5 flex gap-2.5">
              {STATS.map((s) => (
                <span
                  key={s.label}
                  className="whitespace-nowrap rounded-xl border border-white/20 bg-slate-950/60 px-4 py-2 text-[17px] text-slate-200"
                >
                  <b className="ml-1.5 font-sans text-[19px] font-extrabold text-cyan-300">
                    {s.value}
                  </b>
                  {s.label}
                </span>
              ))}
            </div>
            <p dir="ltr" className="mt-3.5 text-right font-mono text-[13.5px] text-slate-400">
              TypeScript · Vite 8 · React Compiler · Server Components
            </p>
          </div>

          {/* official React mark */}
          <div className="relative grid flex-1 place-items-center">
            <div
              aria-hidden="true"
              className="absolute size-[380px] rounded-full bg-[radial-gradient(circle,rgb(97_218_251/0.22),transparent_65%)] blur-2xl"
            />
            <ReactBrandIcon className="relative size-[300px] text-[#61DAFB] drop-shadow-[0_0_45px_rgb(97_218_251/0.45)]" />
          </div>
        </div>

        {/* footer: divider, 24px gap, then author content */}
        <div className="h-px w-full bg-white/15" data-testid="footer-divider" />
        <div className="flex items-center justify-between pt-6" data-testid="footer-content">
          <div className="flex items-center gap-4">
            <img
              src={asset("/author.webp")}
              alt=""
              width={400}
              height={400}
              className="size-14 rounded-full object-cover ring-2 ring-cyan-300/80"
            />
            <div>
              <div className="text-xl font-extrabold leading-[1.3] text-white">
                {BOOK.author}
              </div>
              <div dir="ltr" className="text-right font-mono text-sm text-slate-400">
                Front-End Developer
              </div>
            </div>
          </div>
          <div dir="ltr" className="font-mono text-base text-slate-400">
            github.com/rezaian-dev/react-19-persian-guide
          </div>
        </div>
      </div>
    </div>
  );
}
