---
num: 07
part: 1
title: رویدادها و تعامل کاربر
subtitle: SyntheticEvent، الگوهای handler، propagation و دسترسی‌پذیری
lead: تعامل کاربر قلب هر اپلیکیشن است. React سیستم رویداد خودش را دارد که روی DOM ساخته شده اما تفاوت‌های مهمی دارد. این فصل الگوهای صحیح و تله‌های رایج را پوشش می‌دهد.
---

## مبانی event handler

```tsx title="src/components/LikeButton.tsx"
import { useState, type MouseEvent } from 'react';

export function LikeButton() {
  const [liked, setLiked] = useState(false);

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setLiked((v) => !v);
  }

  return (
    <button onClick={handleClick} aria-pressed={liked}>
      {liked ? '❤️ پسندیدم' : '🤍 پسندیدن'}
    </button>
  );
}
```

سه قاعده:

- **تابع را پاس بدهید، صدا نزنید:** `onClick={handleClick}` ✅ — `onClick={handleClick()}` ❌ (این یکی در لحظه رندر اجرا می‌شود).
- **برای پاس‌دادن آرگومان از arrow استفاده کنید:** `onClick={() => deleteItem(id)}`.
- **نام‌گذاری:** handlerهای داخلی با `handle` و propهای callback با `on` شروع شوند.

## SyntheticEvent چیست؟

React رویدادها را در یک شیء `SyntheticEvent` می‌پیچد که در همه مرورگرها رفتار یکسان دارد و همان API استاندارد (`preventDefault`، `stopPropagation`، `target`، `currentTarget`) را ارائه می‌دهد. از React 17 به بعد، رویدادها به **root container** (نه `document`) متصل می‌شوند و pooling حذف شده؛ یعنی می‌توانید `e` را در async هم استفاده کنید.

| رویداد React | نوع TypeScript | نکته |
|---|---|---|
| `onClick` | `MouseEvent<HTMLButtonElement>` | روی هر عنصر |
| `onChange` | `ChangeEvent<HTMLInputElement>` | در هر keystroke اجرا می‌شود (برخلاف HTML) |
| `onSubmit` | `FormEvent<HTMLFormElement>` | حتماً `preventDefault` مگر با Actions |
| `onKeyDown` | `KeyboardEvent<HTMLElement>` | `e.key === 'Enter'` |
| `onFocus`/`onBlur` | `FocusEvent` | در React حباب می‌کنند (bubble) |
| `onPointerDown` | `PointerEvent` | موس + لمس + قلم یک‌جا |

## Propagation و Delegation

```tsx title="src/components/ProductCard.tsx"
export function ProductCard({ product, onOpen, onAddToCart }: Props) {
  return (
    <article onClick={() => onOpen(product.id)} className="card">
      <h3>{product.title}</h3>
      <button
        onClick={(e) => {
          e.stopPropagation(); // جلوی باز شدن کارت را می‌گیرد
          onAddToCart(product.id);
        }}
      >
        افزودن به سبد
      </button>
    </article>
  );
}
```

:::warn `stopPropagation` را کم استفاده کنید
اغلب راه بهتر این است که کلیک‌پذیربودن کارت را حذف و یک لینک/دکمه واضح بگذارید. حباب‌کردن رویداد، قابلیت‌های دسترسی‌پذیری و کتابخانه‌های دیگر (مثل بستن منو با کلیک بیرون) را هم مختل می‌کند.
:::

## الگوی handler مشترک برای فرم‌ها

```tsx title="src/components/SignupForm.tsx"
import { useState, type ChangeEvent } from 'react';

type Form = { name: string; email: string; agree: boolean };

export function SignupForm() {
  const [form, setForm] = useState<Form>({ name: '', email: '', agree: false });

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  return (
    <form>
      <input name="name" value={form.name} onChange={handleChange} />
      <input name="email" type="email" value={form.email} onChange={handleChange} />
      <label>
        <input name="agree" type="checkbox" checked={form.agree}
               onChange={handleChange} />
        قوانین را می‌پذیرم
      </label>
    </form>
  );
}
```

در فصل ۹ خواهید دید که React 19 با **Actions** و `FormData` بسیاری از این boilerplate را حذف می‌کند؛ اما الگوی کنترل‌شده برای اعتبارسنجی لحظه‌ای همچنان لازم است.

## کیبورد و دسترسی‌پذیری

```tsx nohead
<div
  role="button"
  tabIndex={0}
  onClick={open}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  }}
>
```

:::tip از عنصر معنایی درست استفاده کنید
اگر چیزی کلیک می‌شود، `<button>` باشد؛ اگر به جایی می‌برد، `<a href>`. این عناصر به‌صورت خودکار فوکوس، کیبورد و اعلام صحیح به screen reader را دارند. کد بالا فقط برای مواقع خاص است. `<button>` بدون `type="button"` داخل فرم، فرم را submit می‌کند!
:::

## رویدادهای غیر-React (window, document)

برای رویدادهایی که به عنصر خاصی تعلق ندارند (اسکرول پنجره، resize، کلیدهای سراسری) از `useEffect` استفاده می‌شود (فصل ۱۱):

```tsx nohead
useEffect(() => {
  const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, [onClose]);
```

## Debounce و Throttle

برای جستجوی زنده، هر keystroke نباید درخواست شبکه بزند. راه مدرن و بدون کتابخانه: `useDeferredValue` (فصل ۱۹) برای UI و یک هوک debounce کوچک برای شبکه:

```ts title="src/hooks/useDebouncedValue.ts"
import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
```

:::interview
**Junior — چرا `onClick={handleClick()}` اشتباه است؟** چون تابع در لحظه رندر اجرا می‌شود و *نتیجه‌اش* (معمولاً `undefined`) به onClick داده می‌شود. اگر داخلش setState باشد، حلقه بی‌نهایت رندر می‌سازید.

**Mid — تفاوت `e.target` و `e.currentTarget` چیست؟** `target` عنصری است که رویداد روی آن رخ داده (ممکن است فرزند باشد)؛ `currentTarget` عنصری است که handler به آن متصل است. در TypeScript، `currentTarget` تایپ دقیق دارد و ترجیح داده می‌شود.

**Senior — React رویدادها را چطور پیاده‌سازی می‌کند و چه پیامدهایی دارد؟** React یک listener برای هر نوع رویداد روی root container ثبت می‌کند (event delegation) و خودش رویداد را به کامپوننت‌ها dispatch می‌کند. پیامدها: `stopPropagation` در React جلوی listenerهای بومی روی `document` را نمی‌گیرد؛ ترتیب اجرای listenerهای بومی و React ممکن است غیرمنتظره باشد؛ و چند اپ React مستقل روی یک صفحه با هم تداخل ندارند.
:::
