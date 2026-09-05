# ساخت کتاب (Build)

```bash
pip install -r requirements.txt        # یا: pip install weasyprint markdown-it-py pygments pymupdf pillow
python3 build.py          # → React19-Persian-Guide.pdf  (~40s)
python3 build.py --html   # فقط build/book.html برای پیش‌نمایش در مرورگر
```

- فایل‌های قابل دانلود (نسخه QA شده) در `../docs/pdf/` نگهداری می‌شوند؛ `src/*.pdf` ignore شده است.
- فصل‌ها: `chapters/NN-name.md` با front-matter (`num`, `part`, `title`, `subtitle`, `lead`)
- استایل چاپ: `style.css` (A4، RTL، Vazirmatn + JetBrains Mono + Noto Emoji)
- بنر گیت‌هاب: `banner/banner.html` + `banner/banner.css` → `banner/banner.png` (۱۲۵۴×۱۲۵۴)

## نحو ویژه در Markdown
- `:::note|tip|warn|danger|interview|project|exercise|summary عنوان` … `:::` → جعبه رنگی
- `:::cols` + `:::col good|bad عنوان` → ستون‌های مقایسه
- کد: ```tsx title="path/file.tsx"``` / ```tsx nohead```
- چک‌لیست: `- [ ] متن`

## نسخه EPUB
```bash
pip install ebooklib lxml
python3 build_epub.py   # → React19-Persian-Guide.epub  (از همان chapters/*.md؛ جلد از صفحه اول PDF گرفته می‌شود، پس اول build.py را اجرا کنید)
python3 -m epubcheck React19-Persian-Guide.epub   # اعتبارسنجی (نیاز به java)
```

## نسخه چاپ سیاه‌وسفید
```bash
python3 build.py --print   # → React19-Persian-Guide-Print.pdf (style.css + style-print.css، هایلایت bw)
```
