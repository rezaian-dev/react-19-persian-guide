---
num: 33
part: 3
title: نکات و ترفندهای طلایی
subtitle: ۲۵ نکته‌ای که سال‌ها تجربه را در چند صفحه خلاصه می‌کند
lead: این فصل مجموعه‌ای فشرده از درس‌هایی است که معمولاً فقط با ساعت‌ها دیباگ و بازبینی کد یاد گرفته می‌شوند. هر نکته را با «چرا» بخوانید، نه فقط «چه».
---

## مدل ذهنی و state

**۱. `key` را برای ریست state استفاده کنید، نه Effect.**
```tsx nohead
// ❌ useEffect(() => setDraft(''), [userId]);
// ✅
<ProfileEditor key={userId} user={user} />
```

**۲. state مشتق‌شده را ذخیره نکنید؛ محاسبه کنید.** اگر `total` از `items` به‌دست می‌آید، در رندر بنویسید `const total = items.reduce(...)`. با React Compiler حتی `useMemo` هم لازم نیست.

**۳. state را تا حد ممکن پایین نگه دارید.** state جستجو در `SearchBox` باشد نه در `App`. هر سطحی که بالا می‌رود، کامپوننت‌های بیشتری رندر می‌شوند.

**۴. برای حالت‌های چندگانه از union استفاده کنید نه چند boolean.**
```ts nohead
// ❌ isLoading, isError, isSuccess  (۸ ترکیب، ۵ تا غیرممکن)
// ✅ status: 'idle' | 'loading' | 'error' | 'success'
```

**۵. برای هر «سیستم خارجی» یک هوک بسازید.** `useWebSocket`، `useGeolocation`، `useMediaQuery` — کامپوننت نباید بداند چطور subscribe می‌شود.

## Effect و داده

**۶. اگر Effect فقط setState می‌کند، احتمالاً اشتباه است.** یا مقدار مشتق‌شده است (محاسبه در رندر) یا واکنش به رویداد است (در handler).

**۷. Race condition را با AbortController یا ignore flag حل کنید** — یا بهتر: از کتابخانه داده استفاده کنید که این را داخلی حل کرده.

**۸. `queryKey` را مثل URL طراحی کنید:** `['products', { category, page }]`. سلسله‌مراتبی، قابل‌invalidate جزئی: `invalidateQueries({ queryKey: ['products'] })` همه صفحات را باطل می‌کند.

**۹. `staleTime` را تنظیم کنید.** پیش‌فرض TanStack Query صفر است؛ یعنی هر mount یک refetch. برای داده‌های نسبتاً ثابت `staleTime: 5 * 60_000`.

**۱۰. Promise را قبل از رندر بسازید.** برای `use()`: در loader، والد، یا با `useMemo` — هرگز مستقیماً در بدنه رندر.

## کامپوننت و الگو

**۱۱. کامپوننت داخل کامپوننت تعریف نکنید.** هر رندر والد = نوع جدید = unmount/mount کامل فرزند = از دست رفتن state و کارایی.

**۱۲. `children` را به props پیکربندی ترجیح دهید.** `<Card><CardHeader/>…</Card>` انعطاف‌پذیرتر از `<Card headerTitle headerIcon headerAction />`.

**۱۳. Boolean prop را پیش‌فرض false طراحی کنید.** `<Button disabled>` طبیعی است؛ `<Button enabled={false}>` نه.

**۱۴. از `ComponentProps<'button'>` به ارث ببرید** تا کامپوننت سفارشی همه ویژگی‌های بومی (aria، data-*، onFocus) را بدون تعریف دستی بپذیرد.

**۱۵. Early return برای حالت‌های استثنا.** اول `if (!user) return <Login/>`، بعد مسیر اصلی. تودرتویی کمتر، خوانایی بیشتر.

## کارایی

**۱۶. ابتدا Profile کنید، بعد بهینه کنید.** ۹۰٪ «مشکلات کارایی» که توسعه‌دهندگان حدس می‌زنند، در Profiler وجود ندارند.

**۱۷. رندر مجدد به‌خودی‌خود بد نیست.** رندری که DOM را تغییر نمی‌دهد، ارزان است. مشکل، رندر *گران* و *مکرر* است.

**۱۸. Context را بر اساس فرکانس تغییر تقسیم کنید.** `AuthContext` (به‌ندرت) جدا از `NotificationContext` (مکرر).

**۱۹. لیست بالای ~۱۰۰ آیتم با DOM سنگین را virtualize کنید.** `@tanstack/react-virtual` چند خط است.

**۲۰. ورودی کاربر همیشه فوری، بقیه در transition.** `setQuery(v)` بیرون، `startTransition(() => setResults(...))` داخل.

## TypeScript

**۲۱. `as` را حداقل کنید.** هر `as` یک دروغ بالقوه به کامپایلر است. به‌جای `data as User`، با Zod parse کنید یا type guard بنویسید.

**۲۲. `satisfies` برای اشیاء پیکربندی.** نوع را بررسی می‌کند بدون این‌که literal types را از دست بدهید.

**۲۳. `noUncheckedIndexedAccess` را فعال کنید.** `arr[0]` می‌شود `T | undefined` — همان‌طور که واقعاً هست. صدها باگ runtime را جلوگیری می‌کند.

## دیباگ

**۲۴. پیام خطای React را کامل بخوانید.** React 19 پیام‌های بسیار دقیقی دارد، اغلب با لینک به راه‌حل. «Cannot update a component while rendering a different component» دقیقاً می‌گوید کجا.

**۲۵. React DevTools → «Highlight updates when components render».** در چند ثانیه می‌بینید کدام بخش UI بی‌دلیل چشمک می‌زند.

:::tip ترفند: لاگ رندر با نام کامپوننت
```tsx nohead
function useRenderCount(name: string) {
  const count = useRef(0);
  count.current++;
  if (import.meta.env.DEV) console.debug(`[render] ${name} #${count.current}`);
}
```
در بررسی کارایی موقتاً به کامپوننت مشکوک اضافه کنید.
:::

## قطعه‌کدهای پرکاربرد

```tsx title="الگوهای کوچک اما پرتکرار"
// ۱) تبدیل اعداد فارسی ورودی به انگلیسی قبل از اعتبارسنجی
const toEnDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

// ۲) کلید ترکیبی پایدار برای آیتم بدون id (فقط اگر چاره‌ای نیست)
const key = `${item.category}-${item.slug}`;

// ۳) رندر شرطی چندحالته بدون تودرتویی
const views = {
  idle: <Idle />, loading: <Spinner />, error: <Err />, success: <Data />,
} as const;
return views[status];

// ۴) دسترسی امن به env با پیام واضح
const env = (k: keyof ImportMetaEnv) => {
  const v = import.meta.env[k];
  if (!v) throw new Error(`متغیر محیطی ${k} تنظیم نشده`);
  return v;
};
// ۵) هوک «فقط بعد از mount» برای APIهای مرورگر (بدون mismatch در SSR)
const useMounted = () =>
  useSyncExternalStore(() => () => {}, () => true, () => false);
```

:::summary
اگر فقط پنج چیز را به خاطر بسپارید: (۱) UI تابعی از state است و رندر یعنی اجرای مجدد تابع؛ (۲) Effect برای همگام‌سازی با بیرون است، نه برای محاسبه؛ (۳) داده سرور را به کتابخانه بسپارید؛ (۴) ترکیب (children) قبل از Context، Context قبل از store؛ (۵) اول اندازه بگیرید، بعد بهینه کنید — و بگذارید React Compiler کار خودش را بکند.
:::
