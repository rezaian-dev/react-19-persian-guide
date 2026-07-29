# مشارکت در کتاب

اشتباه تایپی، خطای فنی یا پیشنهاد بهبود را گزارش کنید یا مستقیماً اصلاح کنید. ساخت هر سه نسخه محلی است و **CI در مخزن نیست**؛ کیفیت صفحه‌بندی همان‌جا که می‌نویسید سنجیده می‌شود.

## ساختار
```text
src/chapters/NN-name.md    ← متن فصل‌ها — Markdown + front-matter: num, part, title, subtitle, lead
src/style.css              ← استایل PDF رنگی (A4/RTL)      src/style-print.css ← افزونهٔ چاپ سیاه‌وسفید
src/build.py               ← Markdown → PDF                src/build_epub.py   ← Markdown → EPUB 3
src/fonts/                 ← وزیرمتن، JetBrains Mono، Noto Emoji (جاسازی‌شده در خروجی)
src/banner/                ← بنر و کارت اجتماعی: plate.jpg + banner.css + make_banner.py → banner.png
docs/                      ← صفحهٔ GitHub Pages؛ فایل‌های قابل دانلود در docs/pdf/
```

## اصلاح متن
۱. فایل فصل را در `src/chapters/` ویرایش کنید.
۲. هر سه نسخه را بسازید و خروجی را ببینید:
   ```bash
   pip install -r src/requirements.txt
   cd src
   python3 build.py          # React19-Persian-Guide.pdf
   python3 build.py --print  # نسخهٔ چاپی سیاه‌وسفید
   python3 build.py --html   # build/book.html برای پیش‌نمایش سریع در مرورگر
   python3 build_epub.py     # جلد EPUB از صفحهٔ اول PDF گرفته می‌شود؛ اول build.py
   ```
   لینوکس: `apt install libpango-1.0-0 libpangoft2-1.0-0` · macOS: `brew install pango`
۳. PR بفرستید. فایل‌های `docs/pdf/` را نگهدارنده پس از merge با build محلیِ بازبینی‌شده به‌روز می‌کند تا صفحه‌بندی کتاب کنترل‌شده بماند.

## نحو Markdown
- `:::note|tip|warn|danger|interview|project|exercise|summary عنوان` … `:::` → جعبهٔ رنگی
- `:::cols` + `:::col good|bad عنوان` → ستون‌های مقایسه
- کد: ```` ```tsx title="path/file.tsx" ```` · قطعه‌های کوتاه: ```` ```tsx nohead ````
- چک‌لیست: `- [ ] متن` · خروجی‌های build در `src/` ignore شده‌اند (`src/*.pdf`، `src/build/`)

## قواعد نگارش
- اعداد داخل متن فارسی با ارقام فارسی (۱۹.۲)، نام نسخه‌ها به لاتین (React 19، Vite 8).
- نیم‌فاصله برای «می‌شود / نمی‌کند / کامپوننت‌ها / بهتر».
- اصطلاحات ثابت: کامپوننت، هوک، رندر، اپلیکیشن، دسترسی‌پذیری.
- جعبهٔ مصاحبه باید هر سه سطح **Junior — / Mid — / Senior —** را داشته باشد.

## انتشار نسخه جدید
۱. build محلی هر سه نسخه (همان دستورات بالا) و QA چشمی: تعداد صفحات، شکسته‌نشدن پنجره‌های کد، لینک‌های فهرست، `python3 -m epubcheck React19-Persian-Guide.epub` (نیاز به java).
۲. کپی سه فایل در `docs/pdf/` (تنها جای نگهداری فایل‌های قابل دانلود؛ نسخهٔ تکراری نسازید) و به‌روزرسانی `CHANGELOG.md` و شمارهٔ ویرایش داخل `src/build.py`.
۳. `git push` سپس تگ آنوتیتد: `git tag -a v1.0.N -m "v1.0.N" && git push origin v1.0.N`.
۴. Releases → Draft: سه فایل از `docs/pdf/` را ضمیمه کنید؛ جدول فایل‌ها و لینک صفحهٔ Pages در متن ریلیز کافی است.

## تنظیمات مخزن (یک‌بار)
- **Pages:** *Deploy from a branch* → `main` / `/docs`
- **Settings → General → Social preview:** آپلود `src/banner/social.png` + توضیح و Topics: `react` `react19` `persian` `farsi` `ebook` `typescript` `frontend` `react-compiler` `server-components`

## گزارش خطای فنی
در Issue بنویسید: شماره فصل و صفحه، متن فعلی، متن پیشنهادی و در صورت امکان لینک به مستندات رسمی (react.dev).
