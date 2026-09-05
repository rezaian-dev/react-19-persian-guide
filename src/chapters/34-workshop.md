---
num: 34
part: 3
title: کارگاه مینی‌پروژه‌ها
subtitle: هشت پروژه کوچک صفر تا صد برای تثبیت مفاهیم، به‌ترتیب سختی
lead: دانستن کافی نیست؛ باید ساخت. این هشت پروژه طوری طراحی شده‌اند که هر کدام چند مفهوم کتاب را ترکیب کند و در ۲ تا ۶ ساعت قابل‌انجام باشد. برای هر پروژه: هدف، مفاهیم، مشخصات، نکات پیاده‌سازی و «چالش اضافه» آمده است.
---

## ۱. شمارنده پیشرفته و Undo/Redo

**مفاهیم:** `useReducer`، ناتغییرپذیری، الگوی تاریخچه، TypeScript union.

**مشخصات:** شمارنده با افزایش/کاهش/ریست، گام قابل‌تنظیم، دکمه‌های Undo و Redo (Ctrl+Z / Ctrl+Shift+Z)، نمایش تاریخچه ۱۰ عمل آخر.

```ts nohead
type HistoryState<T> = { past: T[]; present: T; future: T[] };
// undo: present → future, past.pop() → present
// redo: present → past, future.shift() → present
```

**نکته:** reducer را جنریک بنویسید (`historyReducer<T>`) تا در پروژه ۶ دوباره استفاده کنید. **چالش:** ذخیره تاریخچه در `sessionStorage` و بازیابی پس از رفرش.

## ۲. جستجوی زنده با debounce و transition

**مفاهیم:** `useDeferredValue`، `useTransition`، AbortController، Suspense، TanStack Query.

**مشخصات:** input جستجو روی API `https://dummyjson.com/products/search?q=`; نتایج با تأخیر debounce ۳۰۰ms؛ نمایش «در حال جستجو…» بدون پرش layout؛ تاریخچه ۵ جستجوی اخیر در localStorage؛ حالت خالی و خطا.

**نکته:** input همیشه فوری باشد — مقدار deferred را به query بدهید. **چالش:** highlight کردن عبارت جستجو در نتایج بدون `dangerouslySetInnerHTML` (با split و `<mark>`).

## ۳. فرم چندمرحله‌ای ثبت‌نام

**مفاهیم:** `useActionState`، Zod، `useReducer` برای wizard، حفظ state در URL.

**مشخصات:** سه مرحله (اطلاعات شخصی → آدرس → بازبینی)؛ اعتبارسنجی هر مرحله با schema جدا (`.pick`)؛ نمایش خطای هر فیلد زیر آن؛ مرحله فعلی در `?step=2` تا رفرش آن را حفظ کند؛ دکمه «ویرایش» در بازبینی که به مرحله مربوطه برمی‌گردد.

**نکته:** اعداد فارسی موبایل را قبل از regex به انگلیسی تبدیل کنید. **چالش:** ذخیره خودکار پیش‌نویس هر ۲ ثانیه با نشانگر «ذخیره شد ✓».

## ۴. کانبان با Drag & Drop و Optimistic UI

**مفاهیم:** `useOptimistic`، `@dnd-kit`، Zustand، الگوی normalize شده.

**مشخصات:** سه ستون (To Do / Doing / Done)؛ کشیدن کارت بین ستون‌ها و تغییر ترتیب داخل ستون؛ API شبیه‌سازی‌شده با ۵۰۰ms تأخیر و ۱۰٪ خطا؛ حرکت کارت **فوراً** دیده شود و در خطا برگردد؛ افزودن/حذف کارت.

```ts nohead
type Board = {
  columns: Record<ColumnId, { id: ColumnId; title: string; cardIds: string[] }>;
  cards: Record<string, Card>;
};
```

**نکته:** state را normalize کنید؛ جابه‌جایی فقط `cardIds` دو ستون را تغییر می‌دهد. **چالش:** پشتیبانی کیبورد برای drag (dnd-kit دارد) و اعلام حرکت با `aria-live`.

## ۵. داشبورد با نمودار، فیلتر URL و Suspense تودرتو

**مفاهیم:** React Router loader، `<Await>`، Suspense چندلایه، `lazy`، search params، `<Activity>`.

**مشخصات:** صفحه با ۴ ویجت (KPIها، نمودار فروش، جدول سفارش‌ها، فید فعالیت)؛ هر ویجت Suspense و ErrorBoundary خودش؛ فیلتر بازه زمانی در URL؛ نمودار (Recharts) lazy-load شود؛ تب «گزارش‌ها» با `<Activity>` پنهان شود تا state فیلترهایش حفظ بماند.

**نکته:** loader فقط Promiseها را برگرداند (بدون await) تا shell فوراً رندر شود. **چالش:** export جدول به CSV با `Blob` و بررسی INP در Chrome Performance.

## ۶. ویرایشگر Markdown با پیش‌نمایش زنده

**مفاهیم:** `useDeferredValue`، Web Worker، `dangerouslySetInnerHTML` امن با DOMPurify، `<dialog>`، Undo/Redo از پروژه ۱.

**مشخصات:** دو ستون (متن / پیش‌نمایش)؛ پارس Markdown با `marked` در Web Worker تا تایپ گیر نکند؛ پاک‌سازی HTML با DOMPurify؛ نوار ابزار (بولد، عنوان، لینک) با حفظ موقعیت cursor؛ ذخیره در IndexedDB (`idb-keyval`)؛ modal تنظیمات با `<dialog>`.

**نکته:** پیش‌نمایش را از `deferredText` بسازید؛ textarea از `text`. **چالش:** پشتیبانی RTL خودکار برای هر پاراگراف با `dir="auto"` و شمارش کلمات فارسی صحیح.

## ۷. چت بلادرنگ با WebSocket

**مفاهیم:** `useEffect` + cleanup، `useEffectEvent`، `useSyncExternalStore`، `useOptimistic`، virtualization، `useLayoutEffect` برای اسکرول.

**مشخصات:** اتصال به سرور WebSocket (echo عمومی `wss://echo.websocket.org` یا سرور کوچک Node خودتان)؛ نمایش وضعیت اتصال؛ ارسال پیام با Optimistic UI و نشانگر «در حال ارسال/ارسال‌شده/ناموفق»؛ reconnect خودکار با backoff؛ اسکرول خودکار به پایین فقط اگر کاربر پایین است؛ لیست virtualize شده برای ۱۰۰۰+ پیام.

**نکته:** «نمایش notification با تم فعلی هنگام اتصال» را با `useEffectEvent` بنویسید تا تغییر تم reconnect نسازد. **چالش:** نشانگر «در حال تایپ…» با throttle و اعلان مرورگر برای پیام جدید در تب غیرفعال.

## ۸. فروشگاه کامل (پروژه پایانی)

**مفاهیم:** همه‌چیز: معماری feature-based، React Router v8 با loader/action، TanStack Query، Zustand برای سبد، Actions برای فرم‌ها، Tailwind + shadcn، تست با Vitest/MSW/Playwright، Docker.

**مشخصات:**
- صفحات: خانه، لیست محصولات (فیلتر/مرتب‌سازی/صفحه‌بندی در URL)، جزئیات محصول، سبد، پرداخت (فرم چندمرحله‌ای)، ورود/ثبت‌نام، پروفایل و سفارش‌ها (محافظت‌شده).
- API: `https://dummyjson.com` (محصولات، auth، سبد) یا `json-server` محلی.
- سبد در Zustand با `persist`؛ افزودن با Optimistic badge.
- Metadata هر صفحه با `<title>`/`<meta>` React 19.
- ErrorBoundary سه‌لایه، Skeleton برای هر بخش، `<Activity>` برای تب‌های پروفایل.
- تست: reducer سبد (unit)، فرم پرداخت (component + MSW)، جریان خرید (Playwright).
- Docker + Nginx با SPA fallback و هدرهای کش؛ CI با GitHub Actions.

**معیار پذیرش:** Lighthouse موبایل ≥ ۹۰ در Performance و Accessibility؛ JS اولیه < ۲۰۰KB gzip؛ همه تست‌ها سبز.

**چالش:** مهاجرت همین پروژه به React Router v8 حالت Framework و مقایسه LCP قبل و بعد.

## نحوه ارائه پروژه‌ها (برای رزومه)

| مورد | توضیح |
|---|---|
| README قوی | اسکرین‌شات/GIF، لینک دمو، تصمیم‌های معماری، نحوه اجرا |
| commitهای معنادار | `feat(cart): optimistic add with rollback` نه `fix stuff` |
| دمو زنده | Vercel/Netlify/Cloudflare Pages رایگان |
| تست و CI badge | نشان می‌دهد حرفه‌ای کار می‌کنید |
| یک «تصمیم سخت» را مستند کنید | «چرا Zustand به‌جای Context» — مصاحبه‌کننده‌ها عاشق این‌اند |

:::tip ترتیب پیشنهادی
۱ → ۲ → ۳ → ۵ → ۴ → ۶ → ۷ → ۸. اگر وقت کم دارید، ۲، ۳، ۴ و ۸ بیشترین پوشش را می‌دهند. پروژه ۸ به‌تنهایی می‌تواند نمونه‌کار اصلی رزومه شما باشد.
:::
