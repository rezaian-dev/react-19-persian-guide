# مشارکت

اشتباه تایپی، خطای فنی یا پیشنهاد بهبود را گزارش کنید یا مستقیماً اصلاح کنید.

## گزارش خطای متن کتاب

در Issue بنویسید: شماره فصل و صفحه، متن فعلی، متن پیشنهادی و در صورت امکان لینک به مستندات رسمی (react.dev).

> نکته: سورس Markdown فصل‌ها و ابزار ساخت PDF/EPUB در تاریخچهٔ git محفوظ‌اند اما دیگر در ریشهٔ مخزن نیستند؛ فایل‌های `public/pdf/` فقط توسط نگهدارنده و با build محلیِ بازبینی‌شده به‌روز می‌شوند تا صفحه‌بندی کتاب کنترل‌شده بماند. پس برای اصلاح متن، Issue باز کنید و PR نفرستید.

## قواعد نگارش (برای پیشنهادهای متنی)

- اعداد داخل متن فارسی با ارقام فارسی (۱۹.۲)، نام نسخه‌ها به لاتین (React 19، Vite 8).
- نیم‌فاصله برای «می‌شود / نمی‌کند / کامپوننت‌ها / بهتر».
- اصطلاحات ثابت: کامپوننت، هوک، رندر، اپلیکیشن، دسترسی‌پذیری.

## توسعهٔ سایت

سایت یک اپ Next.js (App Router + TypeScript + Tailwind) با خروجی استاتیک است. تنها لینک‌های داخلی با روتر کلاینتی جابه‌جا می‌شوند (بدون reload)؛ دانلودها و لینک‌های خارجی استثنا هستند.

```bash
npm install      # نصب وابستگی‌ها (Node 20.9+)
npm run dev      # سرور توسعه روی localhost:3000

npm run typecheck    # بررسی تایپ‌ها
npm run build        # بیلد استاندارد (Vercel / Node)
npm run build:pages  # خروجی استاتیک در out/ با basePath (برای GitHub Pages)
```

```text
src/app/          صفحه‌ها و layout (خانه، فصل‌ها، نسخهٔ آنلاین، سوشال‌کارت)
src/app/book/     روت نسخهٔ آنلاین کتاب
src/components/   کامپوننت‌های رابط کاربری (بخش‌ها، ریدر، بنر)
src/lib/          داده فصل‌ها، طرح کتاب و پیوندها
src/fonts/        فونت‌های وزیرمتن و جت‌برینز (woff2)
public/           دارایی‌ها، PDF، EPUB و صفحه‌های نسخهٔ آنلاین
public/book/      تصویر صفحه‌های کتاب (۲۳۹ صفحه)
```

- لینک داخلی جدید با `next/link` و مسیر خام (`ROUTES` در `src/lib/links.ts`) بسازید؛ basePath را دستی prefix نکنید.
- تصاویر و دانلودهای `public/` را با `asset()` آدرس‌دهی کنید.
- بنر (`src/components/banner/SocialCard.tsx`) با اسکرین‌شات از روت `/social-card` بازتولید می‌شود: 1x برای `public/social-card.png` و 3x برای بنر README.

## انتشار سایت

انتشار GitHub Pages با GitHub Actions انجام می‌شود (`.github/workflows/pages.yml`): هر push روی `main` پس از typecheck و `build:pages` مستقر می‌شود. خروجی build را commit نکنید؛ پوشهٔ `out/` در `.gitignore` است.

## انتشار نسخهٔ جدید کتاب (نگهدارنده)

۱. build محلی هر سه نسخه و QA چشمی: تعداد صفحات، شکسته‌نشدن پنجره‌های کد، لینک‌های فهرست.
۲. کپی سه فایل در `public/pdf/` (تنها جای نگهداری فایل‌های قابل دانلود؛ نسخهٔ تکراری نسازید) و به‌روزرسانی `CHANGELOG.md`.
۳. `git push` سپس تگ آنوتیتد: `git tag -a v1.0.N -m "v1.0.N" && git push origin v1.0.N`.
۴. Releases → Draft: سه فایل را ضمیمه کنید؛ جدول فایل‌ها و لینک صفحهٔ Pages در متن ریلیز کافی است.

## تنظیمات مخزن (یک‌بار)

- **Pages:** *Deploy from*: GitHub Actions (ورک‌فلو `pages.yml`)
- **Settings → General → Social preview:** آپلود `public/social-card.png` + توضیح و Topics: ‏`react` `react19` `persian` `farsi` `ebook` `typescript` `frontend` `react-compiler` `server-components`
