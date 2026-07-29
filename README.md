<div dir="ltr" align="center">

<img src="./src/banner/banner.png" alt="مرجع جامع React 19 — بنر مخزن" width="100%" />

</div>

<div dir="rtl" align="center">

# ⚛️ مرجع جامع React 19

**از مبانی تا معماری Production-Level** — کامل‌ترین مرجع فارسی ری‌اکت ۱۹.۲، پروژه‌محور و بر پایهٔ مدل ذهنی درست.

</div>

<div dir="ltr" align="center">

![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React Compiler](https://img.shields.io/badge/React_Compiler-1.0-0ea5e9?style=for-the-badge)
![Chapters](https://img.shields.io/badge/37_chapters-4_parts-0f172a?style=for-the-badge)
![Pages](https://img.shields.io/badge/239_pages-A4-1e293b?style=for-the-badge)
![License](https://img.shields.io/badge/CC--BY--NC--SA-4.0-888888?style=for-the-badge)

</div>

<div dir="rtl" align="center">

**دانلود:** [📘 PDF رنگی](./docs/pdf/React19-Persian-Guide.pdf) &nbsp;·&nbsp; [📱 EPUB](./docs/pdf/React19-Persian-Guide.epub) &nbsp;·&nbsp; [🖨️ نسخه چاپی](./docs/pdf/React19-Persian-Guide-Print.pdf) &nbsp;·&nbsp; [🌐 صفحه معرفی](https://rezaian-dev.github.io/react-19-persian-guide/)

</div>

---

<div dir="rtl">

<a id="fahrest"></a>

## 🧭 فهرست

1. [معرفی کتاب](#mokhaddame)
2. [در یک نگاه](#dar-yek-negah)
3. [برای چه کسی است؟](#baraye-kiasi)
4. [چگونه بخوانیم](#chegune-bkhanim)
5. [فصل‌ها](#faselha)
6. [نسخه‌ها و دانلود](#danlod)
7. [ساخت از سورس](#sakht-az-source)
8. [مشارکت](#msharekat)
9. [مجوز و استناد](#mojavez)

</div>

---

<div dir="rtl">

<a id="mokhaddame"></a>

## 📖 معرفی

**ری‌اکت** را با حفظ‌کردن API نمی‌توان یاد گرفت؛ باید مدل ذهنی ساخت. این کتاب همان مدل را می‌سازد و بعد آن را در کد واقعی به آزمون می‌گذارد:

- **رندر** چیست، state دقیقاً کِی تغییر می‌کند و چرا یک `console.log` مقدار تازه را نشان نمی‌دهد.
- **فرم‌ها** در نسخهٔ ۱۹ با Actions، `useActionState` و `useFormStatus` چطور ساده شده‌اند و `useOptimistic` چه تجربه‌ای می‌سازد.
- **واکشی داده** با Suspense و هوک `use` — چرا این مدل، پیش‌فرض جدید ری‌اکت است، نه یک انتخاب پیشرفته.
- **حافظه‌سازی خودکار** با React Compiler: چه زمانی `useMemo` و `memo` بی‌معنا می‌شوند و چه زمانی هنوز لازم‌اند.
- **اثر جانبی**: `useEffect` چه زمانی درست است، چه زمانی باید حذف شود و `useEffectEvent` چه گره‌ای را باز می‌کند.
- **تولید**: معماری feature-based، تست، امنیت، دسترسی‌پذیری و RTL، Server Components و استقرار با Web Vitals.

هر فصل کد واقعی TypeScript دارد، یک جعبهٔ «اشتباه رایج» با توضیح اینکه چرا این‌طور فکر می‌کنیم و چرا غلط است، و سؤالات مصاحبهٔ همان مبحث. خروجی نهایی این است که بتوانید اپلیکیشن مدرن، قابل‌تست و Production Ready بسازید — و در مصاحبهٔ Senior هم جواب داشته باشید.

</div>

---

<div dir="rtl">

<a id="dar-yek-negah"></a>

## 📌 در یک نگاه

| | |
|:--|:--|
| **نسخهٔ مرجع** | React ۱۹.۲ با React Compiler ۱.۰ |
| **ساختار** | ۳۷ فصل در ۴ بخش |
| **حجم** | ۲۳۹ صفحهٔ A4 رنگی · ۲۴۰ صفحهٔ نسخهٔ چاپی |
| **پروژه** | ۱ پروژهٔ کامل مدیریت وظایف + ۸ مینی‌پروژه در کارگاه |
| **جعبه‌های آموزشی** | ۲۶ نکتهٔ حرفه‌ای · ۱۶ جعبهٔ «اشتباه رایج» · ۱۷ نکته · ۱۲ جدول مقایسه |
| **تمرین و جمع‌بندی** | ۲ تمرین و ۳ جمع‌بندی فصل · ۳ مینی‌پروژهٔ داخل فصل |
| **آمادگی مصاحبه** | ۳۰ جعبهٔ «سؤالات مصاحبه» در دل فصل‌ها + ۴۵ پرسشِ فصل ۳۶ |
| **واژه‌نامه** | ۱۳۳ مدخل فارسی–انگلیسی |
| **زبان** | متن فارسی با نیم‌فاصله و ارقام فارسی؛ نام کتابخانه‌ها و کدها به لاتین |

</div>

---

<div dir="rtl">

<a id="baraye-kiasi"></a>

## 🎯 برای چه کسی است؟

| ✅ مناسب شماست اگر… | ⚠️ فعلاً نروید سراغش اگر… |
|:--|:--|
| با جاوااسکریپت و تایپ‌اسکریپت آشنایید و می‌خواهید ری‌اکت را در نسخهٔ ۱۹، درست و از پایه یاد بگیرید | تازه با `let`، `map` و Promise آشنا شده‌اید؛ از فصل‌های ۱ تا ۴ شروع کنید |
| کد می‌نویسید ولی «چرا این‌جا رندر شد؟» برایتان جعبهٔ سیاه است | فقط یک تکه‌کد آماده برای یک فرم می‌خواهید؛ این کتاب تفکر می‌دهد، نه اسنیپت |
| می‌خواهید فرم، داده و خطا را با Actions و Suspense طراحی کنید، نه `useEffect` + `loading` دستی | با کلاس‌ها و Lifecycle کار کرده‌اید و JSX ندیده‌اید؛ اول فصل ۲ را بخوانید |
| برای مصاحبه آماده می‌شوید یا می‌خواهید Code Review تیم را جدی‌تر کنید | روی نسخهٔ ۱۸ هستید و عجله دارید: اول فصل ۳۱ (مهاجرت) را بخوانید |

</div>

---

<div dir="rtl">

<a id="chegune-bkhanim"></a>

## 🗺️ چگونه بخوانیم

| مسیر | فصل‌ها | چه چیزی می‌گیرد |
|:--|:--|:--|
| **مبتدی تا اولین اپلیکیشن** | از ۱ تا ۱۸ | مدل ذهنی، هوک‌ها، فرم، داده، TypeScript و یک پروژهٔ کامل |
| **سطح Production** | از ۱۹ تا ۳۲ | کارایی، Compiler، معماری، تست، امنیت، دسترسی‌پذیری، RSC و استقرار |
| **کارگاه و تثبیت** | از ۳۳ تا ۳۵ | ۸ مینی‌پروژه، ۲۵ نکتهٔ طلایی و ۲۰ اشتباه رایج |
| **هفتهٔ مصاحبه** | فصل ۳۶ و ۳۷ | ۴۵ پرسش با پاسخ + واژه‌نامه برای مرور سریع |

سه عادت که کتاب را نتیجه‌بخش می‌کند: **یک فصل، یک بازسازی** (کد فصل را در پروژهٔ خودتان بنویسید، نه کپی)؛ **جعبهٔ «اشتباه رایج» را جدی بگیرید** (دقیقاً همان چیزی که در Code Review می‌گیرند)؛ و **نقشهٔ راه فصل ۳** را قبل از شروع بخوانید تا مسیر پراکنده نشود.

</div>

---

<div dir="rtl">

<a id="faselha"></a>

## 📚 فصل‌ها

چک‌لیست کامل ۳۷ فصل؛ روی سرصفحهٔ هر بخش بزنید تا بازشود.

</div>

<details>
<summary><b>بخش یکم — بنیادها و مفاهیم اصلی</b> &nbsp;·&nbsp; ۱۸ فصل</summary>

<div dir="rtl">

از JSX و state تا فرم‌ها، Suspense، TypeScript و روتینگ؛ ستون‌های مدل ذهنی React ۱۹.

| # | فصل | محور فصل |
|:--:|:--|:--|
| ۱ | **معرفی React و تازه‌های نسخه ۱۹** | کتابخانه چیست، چه مشکلی را حل می‌کند و در نسخه ۱۹ چه تغییر کرده |
| ۲ | **شروع به کار و ساختار پروژه** | نصب با Vite، ساختار فولدرها، ابزارهای توسعه و اولین کامپوننت |
| ۳ | **نقشه راه یادگیری** | مسیر مبتدی تا حرفه‌ای و نحوه استفاده از این کتاب |
| ۴ | **JSX و رندر عناصر** | قواعد JSX، عبارات، شرط‌ها، لیست‌ها و Fragment |
| ۵ | **کامپوننت‌ها و Props** | ترکیب، children، ref به‌عنوان prop و الگوهای طراحی API کامپوننت |
| ۶ | **State و چرخه رندر** | useState، به‌روزرسانی‌های دسته‌ای، ناتغییرپذیری و مدل ذهنی رندر |
| ۷ | **رویدادها و تعامل کاربر** | SyntheticEvent، الگوهای handler، propagation و دسترسی‌پذیری |
| ۸ | **قوانین Hooks و مرور همه هوک‌ها** | چرا قوانین وجود دارند، جدول مرجع کامل هوک‌های React 19 و انتخاب هوک درست |
| ۹ | **فرم‌ها و Actions در React 19** | `<form action>`، useActionState، useFormStatus و Progressive Enhancement |
| ۱۰ | **useOptimistic و تجربه کاربری آنی** | به‌روزرسانی خوش‌بینانه، بازگشت خودکار و الگوهای لایک، حذف و مرتب‌سازی |
| ۱۱ | **useEffect، useRef و useEffectEvent** | همگام‌سازی با سیستم‌های خارجی، cleanup، وابستگی‌ها و جدایی رویداد از Effect |
| ۱۲ | **واکشی داده، Suspense و `use`** | مدل ذهنی Suspense، API جدید `use`، Error Boundary و TanStack Query |
| ۱۳ | **Context و useReducer** | اشتراک داده بدون prop drilling، الگوی Provider، reducer و ترکیب این دو |
| ۱۴ | **هوک‌های سفارشی** | استخراج منطق قابل‌استفاده‌مجدد، قراردادها و کتابخانه هوک‌های پرکاربرد |
| ۱۵ | **TypeScript در React** | تایپ‌دهی props، رویدادها، هوک‌ها، جنریک‌ها و الگوهای React 19 |
| ۱۶ | **روتینگ با React Router v8** | مسیرهای تودرتو، loader و action، navigation و مسیرهای محافظت‌شده |
| ۱۷ | **استایل‌دهی، Tailwind v4 و Metadata** | CSS Modules، Tailwind، shadcn/ui، RTL و تگ‌های `<title>`/`<meta>` داخلی React 19 |
| ۱۸ | **پروژه عملی: مدیریت وظایف کامل** | ترکیب مفاهیم بخش یکم در یک اپلیکیشن واقعی با Actions، Optimistic UI، Context و روتینگ |

</div>
</details>

<details>
<summary><b>بخش دوم — پیشرفته، معماری و Production</b> &nbsp;·&nbsp; ۱۴ فصل</summary>

<div dir="rtl">

کارایی و React Compiler، مدیریت state، معماری، تست، امنیت، دسترسی‌پذیری، Server Components و استقرار.

| # | فصل | محور فصل |
|:--:|:--|:--|
| ۱۹ | **کارایی، React Compiler و Concurrent Rendering** | memo/useMemo/useCallback، Compiler، useTransition، useDeferredValue و پروفایلینگ |
| ۲۰ | **مدیریت state در مقیاس: Zustand، Redux Toolkit و Jotai** | انواع state، معیار انتخاب ابزار، الگوهای store و ترکیب با داده سرور |
| ۲۱ | **معماری پروژه و Clean Code در React** | ساختار feature-based، لایه‌بندی، مرزهای ماژول و اصول کد تمیز |
| ۲۲ | **الگوهای پیشرفته کامپوننت** | Compound Components، Portal، Controlled/Uncontrolled، Polymorphic و Headless UI |
| ۲۳ | **فرم‌ها و اعتبارسنجی پیشرفته** | Zod، schema مشترک، خطاهای فیلدی، React Hook Form و فرم‌های چندمرحله‌ای |
| ۲۴ | **مدیریت خطا — مرجع کامل** | Error Boundary، خطاهای async، گزینه‌های createRoot در React 19 و استراتژی چندلایه |
| ۲۵ | **دسترسی‌پذیری، RTL و بین‌المللی‌سازی** | ARIA، مدیریت فوکوس، کیبورد، Intl API و پشتیبانی فارسی |
| ۲۶ | **امنیت اپلیکیشن React** | XSS، احراز هویت و توکن‌ها، CSRF، CSP، وابستگی‌ها و آسیب‌پذیری‌های RSC |
| ۲۷ | **تست‌نویسی: Vitest، Testing Library و Playwright** | هرم تست، تست کامپوننت با رفتار کاربر، mock کردن شبکه با MSW و تست E2E |
| ۲۸ | **Server Components و Server Functions** | مدل ذهنی «دو کامپیوتر»، مرز `'use client'`، `'use server'`، `cache` و Streaming |
| ۲۹ | **انتخاب فریم‌ورک: Next.js، React Router و TanStack Start** | SPA یا فریم‌ورک؟ مقایسه عملی، معیارهای انتخاب و مسیر مهاجرت از Vite |
| ۳۰ | **Build، استقرار و Web Vitals** | بهینه‌سازی باندل، Docker و Nginx، CI/CD، Core Web Vitals و پایش |
| ۳۱ | **مهاجرت و ارتقا به React 19** | تغییرات شکننده، codemodها، به‌روزرسانی تایپ‌ها و پذیرش تدریجی React Compiler |
| ۳۲ | **انیمیشن، View Transitions و حس «نرم بودن»** | CSS-first، Motion، View Transitions API و کامپوننت آزمایشی `<ViewTransition>` |

</div>
</details>

<details>
<summary><b>بخش سوم — کارگاه عملی و نکات طلایی</b> &nbsp;·&nbsp; ۳ فصل</summary>

<div dir="rtl">

۸ مینی‌پروژه، ۲۵ نکتهٔ تجربی و ۲۰ اشتباه رایج با راه‌حل.

| # | فصل | محور فصل |
|:--:|:--|:--|
| ۳۳ | **نکات و ترفندهای طلایی** | ۲۵ نکته‌ای که سال‌ها تجربه را در چند صفحه خلاصه می‌کند |
| ۳۴ | **کارگاه مینی‌پروژه‌ها** | هشت پروژه کوچک صفر تا صد برای تثبیت مفاهیم، به‌ترتیب سختی |
| ۳۵ | **بهترین شیوه‌ها، اشتباهات رایج و منابع** | جمع‌بندی حرفه‌ای، ۲۰ اشتباه پرتکرار با راه‌حل، و مسیر ادامه یادگیری |

</div>
</details>

<details>
<summary><b>بخش چهارم — مرجع سریع و آمادگی مصاحبه</b> &nbsp;·&nbsp; ۲ فصل</summary>

<div dir="rtl">

۴۵ پرسش مصاحبه در سه سطح و واژه‌نامهٔ ۱۳۳ مدخلی فارسی–انگلیسی.

| # | فصل | محور فصل |
|:--:|:--|:--|
| ۳۶ | **پرسش‌های مصاحبه (Junior تا Senior)** | ۴۵ سؤال پرتکرار با پاسخ دقیق، دسته‌بندی‌شده بر اساس موضوع و سطح |
| ۳۷ | **واژه‌نامه فارسی–انگلیسی** | مرجع سریع اصطلاحات کلیدی React 19 و اکوسیستم آن |

</div>
</details>

---

<div dir="rtl">

<a id="danlod"></a>

## 📥 نسخه‌ها و دانلود

| نسخه | فایل | مناسب برای |
|:--|:--|:--|
| 🖥️ **رنگی (اصلی)** | [PDF — ۲۳۹ صفحه](./docs/pdf/React19-Persian-Guide.pdf) | مطالعه روی مانیتور و تبلت؛ بوک‌مارک فصل‌ها، متن قابل‌جستجو و شماره‌صفحهٔ فارسی |
| 📱 **موبایل و کتاب‌خوان** | [EPUB 3](./docs/pdf/React19-Persian-Guide.epub) | قابل‌بازچینش با RTL و قلم‌های جاسازی‌شده؛ Apple Books، Google Play Books، KOReader، Calibre |
| 🖨️ **چاپ سیاه‌وسفید** | [PDF — ۲۴۰ صفحه](./docs/pdf/React19-Persian-Guide-Print.pdf) | پرینتر لیزری؛ پس‌زمینهٔ روشن و مصرف جوهر حداقلی |

همین سه فایل روی [Release نسخهٔ ۱.۰.۳](https://github.com/rezaian-dev/react-19-persian-guide/releases/tag/v1.0.3) هم ضمیمه‌اند و صفحهٔ [معرفی](https://rezaian-dev.github.io/react-19-persian-guide/) پیش‌نمایش صفحات را همراه دانلود مستقیم نشان می‌دهد.

</div>

---

<div dir="rtl">

<a id="sakht-az-source"></a>

## 🛠️ ساخت از سورس

متن کتاب Markdown است و هر سه نسخه از همان منبع ساخته می‌شود:

</div>

```bash
git clone https://github.com/rezaian-dev/react-19-persian-guide.git
cd react-19-persian-guide/src
pip install -r requirements.txt     # WeasyPrint + markdown-it + Pygments + PyMuPDF
python3 build.py                    # → React19-Persian-Guide.pdf
python3 build.py --print            # → B/W print edition
python3 build_epub.py               # → React19-Persian-Guide.epub
python3 -m epubcheck React19-Persian-Guide.epub
```

<div dir="rtl">

ساختار مخزن عمداً تخت نگه داشته شده: هر فایل یک خانه دارد و نسخهٔ تکراریِ باینری در مخزن نیست.

</div>

```text
├── src/                                ← the whole book: text, styles, fonts, builders
│   ├── chapters/NN-name.md             ← 37 chapters (front-matter + custom callouts)
│   ├── style.css · style-print.css     ← colour A4/RTL · B/W print overlay
│   ├── build.py · build_epub.py        ← Markdown → PDF / EPUB 3
│   ├── fonts/ · cover-bg.jpg           ← Vazirmatn, JetBrains Mono, Noto Emoji
│   └── banner/                         ← README banner and social card sources
└── docs/                               ← GitHub Pages (main /docs) + the 3 downloads
```

۵ فایل در ریشه — «README»، «CHANGELOG»، «CONTRIBUTING»، «LICENSE» و «.gitignore» — و ۲ پوشه: «src» برای سورس کتاب و «docs» برای صفحهٔ Pages؛ نه CI، نه اسکریپت‌های حاشیه‌ای، نه نسخهٔ تکراری از یک فایل.

---

<div dir="rtl">

<a id="msharekat"></a>

## 🤝 مشارکت

غلط تایپی، خطای فنی یا پیشنهاد بهتر شدن یک بخش را مستقیم اصلاح کنید و PR بفرستید. قواعد نگارش فارسی، نحوۀ بلوک‌های `:::tip` و مراحل انتشار نسخۀ جدید در [CONTRIBUTING.md](./CONTRIBUTING.md) آمده است. مخزن عمداً بدون CI نگه داشته شده: هر سه نسخه با چند دستور محلی ساخته می‌شوند و همین باعث می‌شود صفحه‌بندی کتاب قابل کنترل بماند. تاریخچۀ نسخه‌ها در [CHANGELOG.md](./CHANGELOG.md).

</div>

---

<div dir="rtl">

<a id="mojavez"></a>

## 📜 مجوز و استناد

این اثر تحت مجوز **CC BY-NC-SA ۴.۰** منتشر شده است: استفاده و اشتراک‌گذاری آزاد با ذکر منبع، غیرتجاری و با حفظ همان مجوز. کدهای نمونۀ کتاب آزادند و این محدودیت فقط متنی است.

</div>

```bibtex
@book{react19-persian-guide,
  title   = {مرجع جامع React 19 — از مبانی تا معماری Production-Level},
  author  = {Rezaian, Mohammadreza},
  year    = {2026},
  edition = {1.0.3},
  url     = {https://github.com/rezaian-dev/react-19-persian-guide}
}
```

---

<div dir="rtl" align="center">

**⭐ حمایت**

اگر کتاب مفید بود، یک Star بزرگ‌ترین کمک است؛ اشتراک‌گذاری، گزارش خطا و PR هم به همان اندازه ارزشمندند.

**مرجع مکمل:** برای ادامۀ مسیر فول‌استک، [مرجع جامع Next.js 16](https://github.com/rezaian-dev/nextjs-16-persian-guide) از همین نویسنده.

نوشته‌شده توسط **محمدرضا رضائیان** · [rezaian-dev](https://github.com/rezaian-dev)

</div>
