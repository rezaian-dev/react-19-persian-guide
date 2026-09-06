# مشارکت در کتاب

خوشحال می‌شوم اشتباه تایپی، خطای فنی یا پیشنهاد بهبود را گزارش کنید یا مستقیماً اصلاح کنید.

## ساختار
```text
src/chapters/NN-name.md   ← متن فصل‌ها (Markdown + front-matter)
src/style.css             ← استایل PDF رنگی      src/style-print.css ← افزونه‌ی چاپ سیاه‌وسفید
src/build.py              ← Markdown → PDF        src/build_epub.py   ← Markdown → EPUB
src/fonts/                ← وزیرمتن، JetBrains Mono، Noto Emoji
```

## اصلاح متن (ساده‌ترین راه)
1. فایل فصل را در `src/chapters/` باز کنید و ویرایش کنید.
2. Pull Request بفرستید. **GitHub Actions** خودش هر سه نسخه (PDF رنگی، PDF چاپی، EPUB) را می‌سازد و به‌عنوان Artifact ضمیمه می‌کند؛ نیازی به build محلی نیست.
3. CI هر PR را build و اعتبارسنجی می‌کند (خروجی‌ها به‌صورت artifact قابل دانلودند). فایل‌های نهایی داخل `docs/pdf/` را نگهدارنده پس از merge با build محلیِ بازبینی‌شده به‌روز می‌کند تا صفحه‌بندی کتاب کنترل‌شده بماند.

## build محلی (اختیاری)
```bash
pip install -r src/requirements.txt
cd src && python3 build.py && python3 build.py --print && python3 build_epub.py
```
روی لینوکس به کتابخانه‌های Pango نیاز است (`apt install libpango-1.0-0 libpangoft2-1.0-0`)؛ روی macOS: `brew install pango`.

## قواعد نگارش
- اعداد داخل متن فارسی با ارقام فارسی (۱۹.۲)، نام نسخه‌ها به لاتین (React 19، Vite 8).
- نیم‌فاصله برای «می‌شود / نمی‌کند / کامپوننت‌ها / بهتر».
- اصطلاحات ثابت: کامپوننت، هوک، رندر، اپلیکیشن، دسترسی‌پذیری.
- کد داخل ```tsx title="path/file.tsx"```؛ قطعه‌های کوتاه با ```tsx nohead```.
- جعبه‌ها: `:::note` `:::tip` `:::warn` `:::danger` `:::interview` `:::project` `:::exercise` `:::summary`
- ستون مقایسه: `:::cols` → `:::col good عنوان` / `:::col bad عنوان` → `:::` → `:::`
- جعبه‌ی مصاحبه باید هر سه سطح **Junior — / Mid — / Senior —** را داشته باشد.

## انتشار نسخه جدید
۱. build محلی هر سه نسخه (خروجی‌ها در `src/` می‌افتند و ignore شده‌اند):
   ```bash
   cd src
   python3 build.py && python3 build.py --print && python3 build_epub.py
   python3 -m epubcheck React19-Persian-Guide.epub
   ```
۲. QA خودتان: تعداد صفحات، شکسته‌نشدن پنجره‌های کد، لینک‌های فهرست. **build روی runner با فونت‌های خودش صفحه‌بندی را جابه‌جا می‌کند**، پس همان build محلی مرجع است و CI فقط صحت ساخت را می‌سنجد.
۳. کپی سه فایل در `docs/pdf/` (تنها جای نگهداری فایل‌های قابل دانلود؛ نسخه‌ی تکراری نسازید) و به‌روزرسانی `CHANGELOG.md` و شماره‌ی ویرایش داخل `src/build.py`.
۴. `git push` سپس تگ آنوتیتد: `git tag -a v1.0.N -m "v1.0.N" && git push origin v1.0.N`.
۵. Releases → Draft: سه فایل از `docs/pdf/` را ضمیمه کنید؛ جدول فایل‌ها و لینک صفحه‌ی Pages در متن ریلیز کافی است.

## تنظیمات مخزن (یک‌بار)
- **Pages:** *Deploy from a branch* → `main` / `/docs`
- **Actions → General → Workflow permissions:** *Read and write permissions*
- **Settings → General → Social preview:** آپلود `src/banner/social.png` + توضیح و Topics: `react` `react19` `persian` `farsi` `ebook` `typescript` `frontend` `react-compiler` `server-components`

## گزارش خطای فنی
در Issue بنویسید: شماره فصل و صفحه، متن فعلی، متن پیشنهادی و در صورت امکان لینک به مستندات رسمی (react.dev).
