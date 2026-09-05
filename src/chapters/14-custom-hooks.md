---
num: 14
part: 1
title: هوک‌های سفارشی
subtitle: استخراج منطق قابل‌استفاده‌مجدد، قراردادها و کتابخانه هوک‌های پرکاربرد
lead: هوک سفارشی مهم‌ترین ابزار انتزاع در React مدرن است: منطق stateful را از کامپوننت جدا می‌کنید، نام‌گذاری معنادار می‌دهید و در چند جا استفاده می‌کنید. این فصل اصول طراحی و ده هوک کاربردی آماده تحویل می‌دهد.
---

## هوک سفارشی چیست؟

یک **تابع جاوااسکریپت معمولی** که نامش با `use` شروع می‌شود و داخلش از هوک‌های دیگر استفاده می‌کند. هیچ جادویی نیست؛ پیشوند `use` قراردادی است که به ESLint و React Compiler می‌گوید قوانین هوک را روی آن اعمال کنند.

```ts title="src/hooks/useLocalStorage.ts"
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

// استفاده — دقیقاً مثل useState
const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
```

:::note هر فراخوانی، state مستقل
دو کامپوننت که `useLocalStorage('theme', ...)` را صدا می‌زنند **state مشترک ندارند**؛ هرکدام نمونه خودشان را دارند. هوک‌ها *منطق* را به اشتراک می‌گذارند، نه *state* را. برای state مشترک از Context یا store استفاده کنید.
:::

## اصول طراحی هوک خوب

| اصل | توضیح |
|---|---|
| **نام از روی هدف** | `useOnlineStatus` ✅، `useEffectWrapper` ❌ |
| **API شبیه هوک‌های داخلی** | tuple برای state-like (`[value, setValue]`)، object برای چندمقداره |
| **ورودی reactive بپذیرید** | اگر `url` تغییر کرد، هوک باید واکنش نشان دهد |
| **`as const` برای tuple** | تا TypeScript آن را آرایه ثابت با تایپ دقیق بداند |
| **مسئولیت واحد** | `useFetch` که هم‌زمان auth و cache هم انجام دهد، بد است |
| **مستقل از UI** | هوک نباید JSX برگرداند (آن کامپوننت است) |

## ده هوک پرکاربرد

### `useToggle`

```ts title="src/hooks/useToggle.ts"
import { useCallback, useState } from 'react';

export function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn((v) => !v), []);
  return [on, toggle, setOn] as const;
}
```

### `useMediaQuery` — با `useSyncExternalStore`

```ts title="src/hooks/useMediaQuery.ts"
import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string) {
  const subscribe = (cb: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener('change', cb);
    return () => mql.removeEventListener('change', cb);
  };
  const getSnapshot = () => window.matchMedia(query).matches;
  const getServerSnapshot = () => false; // برای SSR
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const isMobile = useMediaQuery('(max-width: 768px)');
```

`useSyncExternalStore` راه درست اتصال به منابع بیرونی (مرورگر، store) است: بدون tearing و سازگار با Concurrent Rendering.

### `useOnlineStatus`

```ts title="src/hooks/useOnlineStatus.ts"
import { useSyncExternalStore } from 'react';

const subscribe = (cb: () => void) => {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
};

export const useOnlineStatus = () =>
  useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
```

### `usePrevious`

```ts title="src/hooks/usePrevious.ts"
import { useEffect, useRef } from 'react';

export function usePrevious<T>(value: T) {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}
```

### `useClickOutside`

```ts title="src/hooks/useClickOutside.ts"
import { useEffect, useEffectEvent, type RefObject } from 'react';

export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void,
) {
  const handleOutside = useEffectEvent(onOutside); // همیشه آخرین callback

  useEffect(() => {
    const listener = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handleOutside();
    };
    document.addEventListener('pointerdown', listener);
    return () => document.removeEventListener('pointerdown', listener);
  }, [ref]);
}
```

با `useEffectEvent` دیگر لازم نیست مصرف‌کننده callback را با `useCallback` بپیچد.

### `useIntersectionObserver` — lazy load و infinite scroll

```ts title="src/hooks/useIntersectionObserver.ts"
import { useEffect, useState, type RefObject } from 'react';

export function useIntersectionObserver(
  ref: RefObject<Element | null>,
  options?: IntersectionObserverInit,
) {
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIntersecting(entry.isIntersecting),
      options,
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, options?.rootMargin, options?.threshold]);

  return isIntersecting;
}
```

### `useCopyToClipboard`

```ts title="src/hooks/useCopyToClipboard.ts"
import { useState } from 'react';

export function useCopyToClipboard(resetAfter = 2000) {
  const [copied, setCopied] = useState(false);

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), resetAfter);
  }

  return { copied, copy };
}
```

### `useDocumentTitle` — یا Metadata داخلی React 19

```tsx nohead
// React 19: نیازی به هوک نیست!
function ProductPage({ product }) {
  return (
    <>
      <title>{product.title} | فروشگاه</title>
      <meta name="description" content={product.summary} />
      <article>…</article>
    </>
  );
}
```

React 19 تگ‌های `<title>`، `<meta>` و `<link>` را از هر جای درخت به `<head>` منتقل می‌کند (فصل ۱۷).

### `useDebouncedCallback`

```ts title="src/hooks/useDebouncedCallback.ts"
import { useEffect, useEffectEvent, useRef } from 'react';

export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delay = 300,
) {
  const timer = useRef<number | null>(null);
  const stable = useEffectEvent(fn);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (...args: A) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => stable(...args), delay);
  };
}
```

### `useAsync` — برای موارد خارج از TanStack Query

```ts title="src/hooks/useAsync.ts"
import { useState, useTransition } from 'react';

export function useAsync<T>(fn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isPending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      try {
        setError(null);
        setData(await fn());
      } catch (e) {
        setError(e as Error);
      }
    });
  }

  return { data, error, isPending, run };
}
```

## `useDebugValue` — برچسب در DevTools

```ts nohead
export function useOnlineStatus() {
  const online = useSyncExternalStore(...);
  useDebugValue(online ? 'Online ✅' : 'Offline ❌');
  return online;
}
```

## کتابخانه‌های هوک آماده

| کتابخانه | ویژگی |
|---|---|
| `usehooks-ts` | تایپ‌شده، سبک، متداول‌ترین هوک‌ها |
| `@uidotdev/usehooks` | مدرن، مستندات تعاملی عالی |
| `react-use` | بسیار جامع (۱۰۰+ هوک) اما قدیمی‌تر |
| `ahooks` | از Alibaba؛ هوک‌های پیشرفته درخواست و کش |

:::tip قبل از نوشتن، جستجو کنید — ولی بفهمید
هوک‌های بالا را اغلب نباید از صفر بنویسید، اما باید بتوانید بنویسید. در مصاحبه، «یک `useDebounce` بنویس» سؤال بسیار رایجی است.
:::

:::interview
**Junior — چرا نام هوک سفارشی باید با `use` شروع شود؟** تا ESLint و React Compiler بدانند قوانین هوک داخل آن اعمال می‌شود (ترتیب فراخوانی ثابت) و شما هم بلافاصله بفهمید این تابع state یا Effect دارد و نمی‌توان آن را در شرط صدا زد.

**Mid — تفاوت هوک سفارشی با تابع کمکی معمولی چیست؟** تابع کمکی خالص است و به چرخه رندر وابسته نیست (می‌توانید هر جا صدایش بزنید). هوک از هوک‌های React استفاده می‌کند، بنابراین به «نمونه کامپوننت» متصل است و قوانین هوک بر آن حاکم است.

**Senior — چرا `useSyncExternalStore` را به `useState` + `useEffect` برای منابع بیرونی ترجیح می‌دهیم؟** در Concurrent Rendering، React ممکن است رندر را متوقف کند و بین دو بخش درخت، مقدار store بیرونی تغییر کند؛ نتیجه «tearing» است (دو کامپوننت دو مقدار متفاوت نشان می‌دهند). `useSyncExternalStore` با خواندن همگام snapshot و اجبار به رندر همگام در صورت تغییر، سازگاری را تضمین می‌کند و همچنین `getServerSnapshot` را برای hydration بدون mismatch فراهم می‌کند.
:::
