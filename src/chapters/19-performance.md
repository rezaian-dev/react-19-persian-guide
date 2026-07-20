---
num: 19
part: 2
title: کارایی، React Compiler و Concurrent Rendering
subtitle: memo/useMemo/useCallback، Compiler، useTransition، useDeferredValue و پروفایلینگ
lead: کارایی در React یعنی «رندر کمتر، رندر ارزان‌تر و رندر با اولویت درست». این فصل از ابزارهای کلاسیک memoization شروع می‌کند، نشان می‌دهد React Compiler چطور آن‌ها را خودکار می‌کند و سپس وارد قابلیت‌های Concurrent (transition و deferred value) می‌شود که تجربه کاربری را واقعاً متحول می‌کنند.
---

## اول اندازه بگیرید، بعد بهینه کنید

اکثر اپلیکیشن‌های React بدون هیچ بهینه‌سازی به‌اندازه کافی سریع‌اند. بهینه‌سازی زودهنگام کد را پیچیده می‌کند بدون این‌که تفاوت محسوسی ایجاد کند. ابزارها:

| ابزار | چه چیزی نشان می‌دهد |
|---|---|
| **React DevTools → Profiler** | کدام کامپوننت، چند بار و چرا رندر شد (گزینه «Record why each component rendered») |
| **Chrome Performance + React Tracks** (۱۹.۲) | ردهای Scheduler ⚛ و Components ⚛ در timeline کروم: اولویت هر کار، مدت رندر و commit |
| **`<Profiler>` API** | اندازه‌گیری برنامه‌نویسی‌شده: `<Profiler id="Feed" onRender={log}>` |
| **Lighthouse / Web Vitals** | LCP، INP، CLS — معیارهای واقعی کاربر |

## چرا کامپوننت رندر می‌شود؟

فقط سه دلیل: (۱) state خودش تغییر کرده، (۲) والدش رندر شده، (۳) Context مصرفی‌اش تغییر کرده. **تغییر props به‌تنهایی دلیل نیست** — props تغییر می‌کند چون والد رندر شده. رندر مجدد فرزندان به‌طور پیش‌فرض اتفاق می‌افتد، حتی اگر props یکسان باشد.

## ابزار کلاسیک: `memo`، `useMemo`، `useCallback`

```tsx title="src/features/products/ProductGrid.tsx"
import { memo, useMemo, useCallback, useState } from 'react';

// memo: اگر props (با مقایسه سطحی) تغییر نکرده، رندر نکن
const ProductCard = memo(function ProductCard({ product, onSelect }: CardProps) {
  return <div onClick={() => onSelect(product.id)}>{product.title}</div>;
});

export function ProductGrid({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  // useMemo: محاسبه گران فقط وقتی ورودی‌هایش تغییر کرد
  const filtered = useMemo(
    () => products.filter((p) => p.title.includes(query)),
    [products, query],
  );

  // useCallback: هویت تابع ثابت بماند تا memo فرزند بی‌اثر نشود
  const handleSelect = useCallback((id: string) => setSelected(id), []);

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      {filtered.map((p) => (
        <ProductCard key={p.id} product={p} onSelect={handleSelect} />
      ))}
    </>
  );
}
```

:::danger سه اشتباه رایج memoization
۱) `memo` روی کامپوننتی که همیشه prop جدید می‌گیرد (مثل `style={{}}` یا `onClick={() => ...}` بدون useCallback) — بی‌اثر است و فقط هزینه مقایسه اضافه می‌کند. ۲) `useMemo` برای محاسبات ارزان (چند عملیات ساده) — سربارش بیشتر از فایده است. ۳) `useCallback` بدون این‌که گیرنده memo شده باشد — هیچ چیزی را ذخیره نمی‌کند.
:::

## React Compiler: خداحافظی با memoization دستی

React Compiler (نسخه ۱.۰، اکتبر ۲۰۲۵) یک ابزار زمان build است که کد شما را تحلیل می‌کند و به‌طور خودکار memoization دقیق‌تر از آنچه انسان می‌نویسد اضافه می‌کند. کد بالا **بدون** `memo`/`useMemo`/`useCallback` همان کارایی را خواهد داشت:

:::cols
:::col آن‌چه می‌نویسید
```tsx nohead
function ProductGrid({ products }) {
  const [query, setQuery] = useState('');
  const filtered = products.filter(
    p => p.title.includes(query)
  );
  const handleSelect = (id) => ...;
  return filtered.map(p =>
    <ProductCard
      product={p}
      onSelect={handleSelect}
    />
  );
}
```
:::
:::col آن‌چه کامپایلر تولید می‌کند (ساده‌شده)
```tsx nohead
function ProductGrid(t0) {
  const $ = _c(6); // cache slots
  // ...
  let filtered;
  if ($[0] !== products
    || $[1] !== query) {
    filtered = products.filter(...);
    $[0] = products; $[1] = query;
    $[2] = filtered;
  } else filtered = $[2];
  // handleSelect و JSX هم کش می‌شوند
}
```
:::
:::

کامپایلر در سطح **عبارت** (نه فقط کامپوننت) کش می‌کند: حتی JSX فرزند اگر ورودی‌هایش تغییر نکرده باشد، دوباره ساخته نمی‌شود. نصب در فصل ۲ توضیح داده شد.

:::note قوانین بازی با Compiler
- کامپایلر فقط کدی را بهینه می‌کند که **Rules of React** را رعایت کند؛ کد متخلف را رد می‌کند (نه این‌که بشکند). ESLint می‌گوید کدام.
- `memo`/`useMemo` موجود را لازم نیست حذف کنید؛ کامپایلر با آن‌ها سازگار است. اما در کد جدید ننویسید.
- در DevTools کامپوننت‌های بهینه‌شده نشان «Memo ✨» دارند.
- برای پذیرش تدریجی از گزینه `compilationMode: 'annotation'` و دایرکتیو `"use memo"` استفاده کنید.
:::

## Concurrent Rendering: اولویت‌بندی به‌روزرسانی‌ها

از React 18، رندر **قابل‌قطع** است. React می‌تواند رندر کم‌اهمیت را متوقف کند، به ورودی کاربر پاسخ دهد و بعد ادامه دهد. برای استفاده از این قابلیت باید بگویید کدام به‌روزرسانی‌ها «فوری» نیستند.

### `useTransition`

```tsx title="src/features/search/SearchPage.tsx"
import { useState, useTransition } from 'react';

export function SearchPage({ allItems }: { allItems: Item[] }) {
  const [query, setQuery] = useState('');       // فوری: input باید آنی باشد
  const [results, setResults] = useState(allItems);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);                                 // اولویت بالا
    startTransition(() => {
      setResults(heavyFilter(allItems, q));      // اولویت پایین؛ قابل‌قطع
    });
  }

  return (
    <>
      <input value={query} onChange={handleChange} />
      <div style={{ opacity: isPending ? 0.6 : 1 }}>
        <HeavyList items={results} />
      </div>
    </>
  );
}
```

اگر کاربر سریع تایپ کند، React رندر لیست قدیمی را **رها می‌کند** و فقط آخرین را کامل می‌کند. تایپ در input هرگز گیر نمی‌کند.

### `useDeferredValue`

وقتی مقدار را کنترل نمی‌کنید (از props می‌آید) یا نمی‌خواهید دو state جدا نگه دارید:

```tsx nohead
function SearchResults({ query }: { query: string }) {
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  const results = useMemo(() => heavyFilter(items, deferredQuery), [deferredQuery]);
  return <HeavyList items={results} style={{ opacity: isStale ? 0.6 : 1 }} />;
}
```

React اول با مقدار قدیمی رندر می‌کند (سریع)، بعد در پس‌زمینه با مقدار جدید. React 19 آرگومان دوم `initialValue` را برای رندر اولیه اضافه کرد.

| | `useTransition` | `useDeferredValue` |
|---|---|---|
| کنترل روی | خودِ setState | یک مقدار |
| کاربرد | وقتی state را خودتان set می‌کنید | وقتی مقدار از props/کتابخانه می‌آید |
| `isPending` | ✅ مستقیم | با مقایسه `value !== deferred` |
| با Suspense | fallback را نشان نمی‌دهد؛ UI قدیمی می‌ماند | همین‌طور |

:::tip Transition و Suspense
اگر setState داخل `startTransition` باعث suspend شود (مثلاً تغییر تب که داده جدید می‌خواهد)، React به‌جای نشان‌دادن fallback، **UI فعلی را نگه می‌دارد** تا داده جدید برسد. این دقیقاً رفتاری است که کاربران انتظار دارند: هیچ فلش اسکلتی هنگام تغییر تب.
:::

## `<Activity>` — پنهان‌کردن بدون unmount (React 19.2)

```tsx title="src/app/Tabs.tsx"
import { Activity } from 'react';

export function Tabs({ active }: { active: 'feed' | 'profile' }) {
  return (
    <>
      <Activity mode={active === 'feed' ? 'visible' : 'hidden'}>
        <Feed />
      </Activity>
      <Activity mode={active === 'profile' ? 'visible' : 'hidden'}>
        <Profile />
      </Activity>
    </>
  );
}
```

در حالت `hidden`: کامپوننت از DOM حذف نمی‌شود اما `display: none` می‌گیرد، Effectهایش cleanup می‌شوند، و state (اسکرول، مقدار input) حفظ می‌شود. به‌روزرسانی‌های آن با کمترین اولویت انجام می‌شود. کاربردها: تب‌هایی که کاربر بین‌شان رفت‌وبرگشت می‌کند، پیش‌رندر صفحه بعدی، حفظ state فرم هنگام ناوبری.

## لیست‌های بزرگ: Virtualization

برای لیست‌های چندهزارتایی، فقط آیتم‌های داخل viewport را رندر کنید:

```tsx title="src/components/VirtualList.tsx"
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

export function VirtualList({ items }: { items: string[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
  });

  return (
    <div ref={parentRef} style={{ height: 600, overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((v) => (
          <div
            key={v.key}
            style={{
              position: 'absolute', top: v.start, height: v.size, width: '100%',
            }}
          >
            {items[v.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## چک‌لیست کارایی

- [ ] React Compiler فعال است و ESLint خطای Rules of React ندارد
- [ ] state تا حد امکان **پایین** (نزدیک مصرف‌کننده) نگه داشته شده
- [ ] Contextهای پرتغییر از کم‌تغییر جدا شده‌اند
- [ ] به‌روزرسانی‌های سنگین داخل `startTransition` هستند
- [ ] لیست‌های بزرگ virtualize شده‌اند
- [ ] صفحات با `lazy` code-split شده‌اند (فصل ۱۶)
- [ ] تصاویر lazy، با اندازه صریح و فرمت مدرن (WebP/AVIF)
- [ ] در Profiler هیچ کامپوننتی بی‌دلیل بیش از چند بار رندر نمی‌شود

:::interview
**Junior — `memo` چه کاری می‌کند؟** کامپوننت را طوری می‌پیچد که اگر props (با مقایسه سطحی) تغییر نکرده باشد، رندر مجدد ناشی از والد را رد کند. تغییر state داخلی یا Context را همچنان رندر می‌کند.

**Mid — تفاوت `useTransition` و `useDeferredValue` چیست و کی هرکدام؟** هر دو به‌روزرسانی را «غیرفوری» می‌کنند. `useTransition` وقتی خودتان setState را صدا می‌زنید و به `isPending` نیاز دارید؛ `useDeferredValue` وقتی مقدار از بیرون می‌آید یا می‌خواهید یک نسخه «عقب‌افتاده» از مقدار داشته باشید.

**Senior — React Compiler چطور تصمیم می‌گیرد چه چیزی را کش کند و چرا به Rules of React وابسته است؟** کامپایلر کد را به یک نمایش میانی (HIR) تبدیل می‌کند، وابستگی هر عبارت به props/state/متغیرها را تحلیل می‌کند و برای هر «واحد reactive» یک اسلات کش می‌سازد که فقط با تغییر ورودی‌های آن بازمحاسبه می‌شود. این تحلیل فرض می‌کند مقادیر **ناتغییرپذیر**ند و رندر **خالص** است؛ اگر کدی props را mutate کند یا نتیجه به چیزی خارج از ورودی‌های قابل‌ردیابی وابسته باشد، کش نادرست می‌شود — بنابراین کامپایلر چنین توابعی را تشخیص داده و از بهینه‌سازی صرف‌نظر می‌کند.
:::
