---
num: 37
part: 4
title: واژه‌نامه فارسی–انگلیسی
subtitle: مرجع سریع اصطلاحات کلیدی React 19 و اکوسیستم آن
lead: مرجع سریع مهم‌ترین اصطلاحات React و اکوسیستم آن. برای مرور پیش از مصاحبه یا وقتی در مستندات انگلیسی به واژه‌ای برخوردید که معادل فارسی‌اش را می‌خواهید.
---

## مفاهیم هسته

### مدل رندر

<div class="glossary">

| اصطلاح | معادل و توضیح |
|---|---|
| Component | کامپوننت؛ تابعی که props می‌گیرد و React Element برمی‌گرداند |
| Props | ویژگی‌ها؛ ورودی فقط‌خواندنی کامپوننت از والد |
| State | وضعیت؛ حافظه داخلی کامپوننت که تغییرش رندر مجدد می‌سازد |
| Render | رندر؛ اجرای تابع کامپوننت برای محاسبه خروجی (نه لمس DOM) |
| Commit | کامیت؛ اعمال تفاوت‌های محاسبه‌شده روی DOM واقعی |
| Reconciliation | آشتی‌دهی؛ الگوریتم مقایسه درخت جدید و قبلی برای یافتن کمترین تغییر |
| Fiber | ساختار داده داخلی React برای هر واحد کار؛ پایه رندر قابل‌قطع |
| Virtual DOM | نمایش سبک درخت UI در حافظه؛ اصطلاح قدیمی‌تر برای همان ایده |

</div>

### عناصر و ترکیب

<div class="glossary">

| اصطلاح | معادل و توضیح |
|---|---|
| JSX | افزونه نحوی شبیه HTML که به `jsx()` تبدیل می‌شود |
| React Element | شیء ساده‌ای که خروجی JSX است و «چه چیزی» را توصیف می‌کند |
| Key | کلید؛ شناسه پایدار آیتم‌های لیست برای حفظ هویت بین رندرها |
| Fragment | قطعه؛ گروه‌بندی عناصر بدون افزودن wrapper به DOM |
| Pure Component / Purity | خلوص؛ خروجی یکسان با ورودی یکسان و بدون side effect در رندر |
| Immutability | ناتغییرپذیری؛ ساخت کپی جدید به‌جای تغییر شیء موجود |
| Lifting State Up | بالا بردن state به والد مشترک |
| Composition | ترکیب؛ ساخت UI پیچیده از کامپوننت‌های ساده (به‌جای وراثت) |
| Children | فرزندان؛ prop ویژه برای محتوای بین تگ باز و بسته |
| Controlled / Uncontrolled | کنترل‌شده (مقدار در state) / کنترل‌نشده (مقدار در DOM) |
| Prop Drilling | عبور دادن props از چند لایه میانی که به آن نیاز ندارند |
| Strict Mode | حالت سخت‌گیرانه؛ رندر و Effect دوگانه در dev برای یافتن باگ |

</div>

## هوک‌ها و APIهای React 19

### هوک‌ها و Effect

<div class="glossary">

| اصطلاح | معادل و توضیح |
|---|---|
| Hook | هوک؛ تابعی با پیشوند `use` که به کامپوننت تابعی قابلیت (state، Effect…) می‌دهد |
| Rules of Hooks | قوانین هوک؛ فقط در سطح بالا و فقط از کامپوننت/هوک |
| Rules of React | قوانین React؛ مجموعه گسترده‌تر (خلوص، ناتغییرپذیری…) که Compiler به آن نیاز دارد |
| Custom Hook | هوک سفارشی؛ استخراج منطق stateful قابل‌استفاده‌مجدد |
| Effect | اثر؛ همگام‌سازی کامپوننت با سیستم خارجی پس از commit |
| Cleanup | پاک‌سازی؛ تابع بازگشتی Effect که قبل از اجرای بعدی و در unmount اجرا می‌شود |
| Dependency Array | آرایه وابستگی‌ها؛ مقادیر reactive که تغییرشان Effect را دوباره اجرا می‌کند |
| Effect Event (`useEffectEvent`) | رویداد Effect؛ منطق غیر-reactive که از داخل Effect صدا زده می‌شود (۱۹.۲) |
| Ref | مرجع؛ مقدار قابل‌تغییر بدون رندر یا دسترسی به DOM |
| Ref as Prop | `ref` به‌عنوان prop معمولی در React 19؛ جایگزین `forwardRef` |
| Context | زمینه؛ انتقال داده به عمق درخت بدون props |
| Provider | تأمین‌کننده؛ در React 19 خودِ `<Context value>` |
| Reducer | کاهنده؛ تابع خالص `(state, action) => newState` |

</div>

### Actions و APIهای جدید

<div class="glossary">

| اصطلاح | معادل و توضیح |
|---|---|
| Action (React 19) | تابع async داخل transition با مدیریت خودکار pending/خطا |
| `useActionState` | هوک state + pending برای Action فرم |
| `useFormStatus` | وضعیت pending فرم والد (از `react-dom`) |
| `useOptimistic` | به‌روزرسانی خوش‌بینانه با بازگشت خودکار |
| `use` | خواندن Promise یا Context در رندر؛ مجاز در شرط |
| Transition | انتقال؛ به‌روزرسانی غیرفوری و قابل‌قطع |
| `useDeferredValue` | مقدار عقب‌افتاده برای رندر کم‌اولویت |
| `useSyncExternalStore` | اتصال امن به store بیرونی بدون tearing |
| `useId` | شناسه یکتای پایدار سرور/کلاینت برای ARIA |
| `<Activity>` | پنهان‌کردن UI با حفظ state و اولویت پایین (۱۹.۲) |
| `cache` / `cacheSignal` | حذف تکرار فراخوانی در یک درخواست سرور (RSC) |
| Document Metadata | تگ‌های `<title>`/`<meta>`/`<link>` که React 19 به `<head>` منتقل می‌کند |
| Owner Stack | پشته مالک؛ ابزار dev برای دیدن کدام کامپوننت این را رندر کرده (۱۹.۱) |
| `<ViewTransition>` | انتقال نما؛ انیمیشن بین دو حالت UI روی View Transitions API مرورگر — در React هنوز آزمایشی (فصل ۳۲) |

</div>

## داده، Suspense و Concurrent

### Suspense و رندر هم‌روند

<div class="glossary">

| اصطلاح | معادل و توضیح |
|---|---|
| Suspense | تعلیق؛ نمایش fallback تا آماده‌شدن داده/کد زیردرخت |
| Suspend | معلق شدن؛ وقتی کامپوننت Promise ناتمام را throw می‌کند |
| Fallback | جایگزین موقت؛ محتوای نمایشی در حین انتظار (Skeleton) |
| Error Boundary | مرز خطا؛ کامپوننتی که خطای زیردرخت را می‌گیرد |
| Streaming | جریان‌سازی؛ ارسال تکه‌تکه HTML/payload از سرور |
| Batching | دسته‌بندی؛ ادغام چند setState در یک رندر |
| Concurrent Rendering | رندر هم‌روند؛ رندر قابل‌قطع با اولویت‌بندی |
| Tearing | پارگی؛ ناسازگاری UI وقتی store بیرونی وسط رندر تغییر کند |
| Waterfall | آبشار؛ درخواست‌های متوالی که هر کدام منتظر قبلی است |
| Race Condition | شرایط مسابقه؛ رسیدن پاسخ قدیمی بعد از جدید |

</div>

### داده و کش

<div class="glossary">

| اصطلاح | معادل و توضیح |
|---|---|
| Server State | داده‌ای که منبع حقیقتش سرور است و کش می‌شود |
| Stale Time | مدت تازگی داده در کش قبل از نیاز به refetch |
| Invalidation | باطل‌سازی؛ علامت‌گذاری کش برای واکشی مجدد |
| Optimistic UI | رابط خوش‌بینانه؛ نمایش نتیجه قبل از تأیید سرور |
| Deduplication | حذف تکرار؛ ادغام درخواست‌های هم‌زمان یکسان |
| Prefetch | پیش‌واکشی؛ گرفتن داده قبل از نیاز (hover، مسیر بعدی) |
| Loader / Action (Router) | تابع واکشی/تغییر داده در سطح مسیر |
| Revalidation | اعتبارسنجی مجدد؛ اجرای دوباره loaderها پس از تغییر |

</div>

## Server Components و فریم‌ورک

### Server Components

<div class="glossary">

| اصطلاح | معادل و توضیح |
|---|---|
| RSC (React Server Components) | کامپوننت‌های سرور؛ فقط روی سرور اجرا و بدون JS کلاینت |
| Client Component | کامپوننت کلاینت؛ با `'use client'`؛ در سرور و مرورگر اجرا می‌شود |
| `'use client'` / `'use server'` | دایرکتیو مرز کلاینت / علامت Server Function |
| Server Function (Server Action) | تابع سرور قابل‌فراخوانی از کلاینت؛ endpoint خودکار |
| RSC Payload | خروجی سریال‌شده درخت سرور برای کلاینت |
| Serializable | سریال‌پذیر؛ داده‌ای که می‌تواند از مرز سرور/کلاینت عبور کند |

</div>

### رندر سرور و فریم‌ورک

<div class="glossary">

| اصطلاح | معادل و توضیح |
|---|---|
| SSR | رندر سمت سرور؛ تولید HTML اولیه روی سرور |
| SSG | تولید استاتیک؛ HTML در زمان build |
| ISR | بازتولید افزایشی استاتیک؛ صفحه استاتیک با به‌روزرسانی دوره‌ای |
| Hydration | آب‌دهی؛ اتصال event handlerها به HTML سرور در کلاینت |
| Hydration Mismatch | ناهمخوانی HTML سرور و رندر اولیه کلاینت |
| Partial Pre-rendering (PPR) | پیش‌رندر جزئی؛ shell استاتیک + بخش‌های پویا در یک صفحه |
| Progressive Enhancement | بهبود تدریجی؛ کارکرد پایه بدون JS، بهتر با JS |
| Islands | جزیره‌ها؛ نواحی تعاملی کوچک در صفحه‌ای عمدتاً استاتیک |
| App Router | روتر مبتنی بر پوشه `app/` در Next.js با RSC |
| Framework Mode | حالت فریم‌ورک React Router (SSR، جانشین Remix) |
| Middleware (Router) | میان‌افزار؛ کدی که پیش از loader/action مسیر اجرا می‌شود (احراز هویت، لاگ)؛ در React Router v8 پیش‌فرض |
| Edge Runtime | اجرای کد نزدیک کاربر روی شبکه CDN |

</div>

## ابزار، کارایی و کیفیت

### ابزار، کارایی و باندل

<div class="glossary">

| اصطلاح | معادل و توضیح |
|---|---|
| React Compiler | کامپایلر React؛ memoization خودکار در زمان build (۱.۰) |
| Memoization | یادسپاری؛ کش نتیجه بر اساس ورودی (`memo`, `useMemo`) |
| Code Splitting | تقسیم کد؛ شکستن باندل به chunkهای lazy |
| Lazy Loading | بارگذاری تنبل؛ دانلود کد/داده فقط هنگام نیاز |
| Tree Shaking | حذف کد استفاده‌نشده در build |
| Bundle | باندل؛ فایل(های) JS نهایی |
| Chunk | تکه؛ بخشی از باندل که جداگانه بارگذاری می‌شود |
| HMR | جایگزینی داغ ماژول؛ به‌روزرسانی بدون رفرش در dev |
| Codemod | تغییر خودکار کد با اسکریپت (`npx codemod react/19/…`) برای مهاجرت |
| Virtualization | مجازی‌سازی؛ رندر فقط آیتم‌های داخل viewport |
| Core Web Vitals | معیارهای کلیدی تجربه کاربر: LCP, INP, CLS |
| LCP | زمان نمایش بزرگ‌ترین عنصر محتوایی |
| INP | تأخیر تعامل تا نقاشی بعدی |
| CLS | مجموع پرش‌های چیدمان |
| Profiler | پروفایلر؛ ابزار اندازه‌گیری رندر در DevTools |
| Performance Tracks | ردهای React در Chrome Performance (۱۹.۲) |

</div>

### تست و الگوها

<div class="glossary">

| اصطلاح | معادل و توضیح |
|---|---|
| Testing Library | کتابخانه تست مبتنی بر رفتار کاربر |
| MSW (Mock Service Worker) | شبیه‌سازی شبکه در سطح درخواست |
| E2E (End-to-End) | تست سرتاسری در مرورگر واقعی (Playwright) |
| Headless UI | کامپوننت بدون استایل؛ فقط منطق و دسترسی‌پذیری |
| Compound Components | کامپوننت‌های مرکب با state مشترک از طریق Context |
| Render Prop | تابع به‌عنوان prop برای سفارشی‌کردن رندر |
| Slot / `asChild` | جای‌گذاری؛ اعمال رفتار/استایل روی عنصر فرزند |
| Portal | دروازه؛ رندر در جای دیگر DOM با حفظ جایگاه در درخت React |
| Discriminated Union | اتحاد تمایزیافته؛ تایپ union با فیلد تشخیص‌دهنده |
| Zod | کتابخانه schema برای اعتبارسنجی + استخراج تایپ |

</div>

### امنیت

<div class="glossary">

| اصطلاح | معادل و توضیح |
|---|---|
| CSP | سیاست امنیت محتوا؛ هدر محدودکننده منابع مجاز |
| XSS | تزریق اسکریپت؛ اجرای کد مهاجم در مرورگر کاربر |
| CSRF | جعل درخواست بین‌سایتی؛ سوءاستفاده از کوکی کاربر |
| httpOnly Cookie | کوکی غیرقابل‌خواندن با JavaScript |

</div>

### دسترسی‌پذیری و بین‌المللی‌سازی

<div class="glossary">

| اصطلاح | معادل و توضیح |
|---|---|
| a11y | دسترسی‌پذیری (accessibility) |
| i18n / l10n | بین‌المللی‌سازی / بومی‌سازی |
| RTL | راست‌به‌چپ |
| Logical Properties | ویژگی‌های منطقی CSS (`inline-start`) مستقل از جهت |
| ARIA | مجموعه ویژگی‌های دسترسی‌پذیری برای فناوری‌های کمکی |
| Live Region | ناحیه زنده؛ اعلام خودکار تغییرات به screen reader |
| Focus Trap | تله فوکوس؛ نگه‌داشتن فوکوس داخل modal |
| Roving tabindex | فقط یک آیتم در ترتیب Tab؛ Arrow بین آیتم‌ها |

</div>
