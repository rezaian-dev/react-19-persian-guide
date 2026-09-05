---
num: 25
part: 2
title: دسترسی‌پذیری، RTL و بین‌المللی‌سازی
subtitle: ARIA، مدیریت فوکوس، کیبورد، Intl API و پشتیبانی فارسی
lead: دسترسی‌پذیری (a11y) «ویژگی اضافه» نیست؛ بخشی از کیفیت است و در بسیاری از کشورها الزام قانونی. برای توسعه‌دهنده فارسی‌زبان، RTL و اعداد فارسی هم چالش‌های خاص خودشان را دارند. این فصل هر دو را پوشش می‌دهد.
---

## اصول پایه دسترسی‌پذیری

| اصل | در عمل |
|---|---|
| **HTML معنایی اول** | `<button>`، `<nav>`، `<main>`، `<h1>`-`<h6>` قبل از هر ARIA |
| **قابل‌استفاده با کیبورد** | همه‌چیز با Tab/Enter/Space/Arrow قابل‌دسترس باشد |
| **فوکوس قابل‌مشاهده** | هرگز `outline: none` بدون جایگزین |
| **متن جایگزین** | `alt` معنادار برای تصاویر؛ `alt=""` برای تزئینی |
| **کنتراست** | حداقل ۴.۵:۱ برای متن معمولی (WCAG AA) |
| **برچسب فرم** | هر input یک `<label>` متصل با `htmlFor` |
| **اعلام تغییرات** | `aria-live` برای پیام‌های پویا (toast، خطا) |

:::note قانون اول ARIA
«از ARIA استفاده نکنید» — اگر عنصر بومی HTML همان معنا را دارد. `<button>` بهتر از `<div role="button" tabIndex={0} onKeyDown=...>` است. ARIA فقط برای الگوهایی که HTML ندارد (tabs، combobox، tree).
:::

## `useId` — برچسب‌های متصل

```tsx nohead
function PasswordField() {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <>
      <label htmlFor={id}>رمز عبور</label>
      <input id={id} type="password" aria-describedby={hintId} />
      <p id={hintId}>حداقل ۸ کاراکتر شامل عدد</p>
    </>
  );
}
```

`useId` شناسه‌ای یکتا و **پایدار بین سرور و کلاینت** می‌سازد؛ برخلاف `Math.random()` که در SSR باعث mismatch می‌شود. React 19.2 پیشوند آن را به `_r_` تغییر داد تا در `view-transition-name` معتبر باشد.

## مدیریت فوکوس

```tsx title="src/features/todos/TodoList.tsx"
export function TodoList() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [items, setItems] = useState(initial);

  function remove(id: string) {
    setItems((s) => s.filter((i) => i.id !== id));
    // پس از حذف، فوکوس نباید «گم» شود (به body برود)
    headingRef.current?.focus();
  }

  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1}>وظایف</h2>
      {items.map((i) => (
        <TodoItem key={i.id} item={i} onRemove={() => remove(i.id)} />
      ))}
    </section>
  );
}
```

قواعد فوکوس:

- هنگام باز شدن modal → فوکوس به داخل آن؛ هنگام بستن → به عنصری که آن را باز کرد (`<dialog>` بومی این را انجام می‌دهد).
- پس از ناوبری SPA → فوکوس به `<h1>` صفحه جدید یا اعلام با `aria-live`.
- پس از حذف آیتم → فوکوس به آیتم بعدی یا عنوان لیست.
- `tabIndex={-1}` عنصر را «برنامه‌ریزی‌شده قابل‌فوکوس» می‌کند بدون این‌که در ترتیب Tab قرار گیرد.

## Live Region برای پیام‌های پویا

```tsx title="src/components/ui/Toaster.tsx"
export function Toaster({ toasts }: { toasts: Toast[] }) {
  return (
    <div aria-live="polite" className="fixed bottom-4 end-4 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="rounded-lg bg-slate-900 px-4 py-2 text-white"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
```

`polite` منتظر می‌ماند تا screen reader جمله فعلی را تمام کند؛ `assertive` فوراً قطع می‌کند (فقط برای خطاهای بحرانی). live region باید **از ابتدا در DOM باشد** تا تغییراتش اعلام شود.

## ناوبری با کیبورد در لیست (Roving tabindex)

```tsx title="src/components/ui/Menu.tsx"
export function Menu({ items }: { items: string[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent) {
    const next =
      e.key === 'ArrowDown' ? (active + 1) % items.length
      : e.key === 'ArrowUp' ? (active - 1 + items.length) % items.length
      : e.key === 'Home' ? 0
      : e.key === 'End' ? items.length - 1
      : null;
    if (next !== null) {
      e.preventDefault();
      setActive(next);
      refs.current[next]?.focus();
    }
  }

  return (
    <div role="menu" onKeyDown={onKeyDown}>
      {items.map((label, i) => (
        <button
          key={label}
          role="menuitem"
          ref={(el) => { refs.current[i] = el; }}
          tabIndex={i === active ? 0 : -1}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
```

فقط یک آیتم در ترتیب Tab است؛ Arrow بین آیتم‌ها حرکت می‌کند. این الگو در کتابخانه‌های headless (Radix، React Aria) آماده است — ترجیحاً از آن‌ها استفاده کنید.

## RTL — راست‌به‌چپ

```html title="index.html"
<html lang="fa" dir="rtl">
```

| موضوع | راهکار |
|---|---|
| فاصله و موقعیت | ویژگی‌های منطقی: `margin-inline-start`، `inset-inline-end` (Tailwind: `ms-`, `me-`, `start-`, `end-`) |
| آیکون‌های جهت‌دار | فلش «بعدی» باید در RTL برعکس شود: `rtl:rotate-180` یا `scale-x-[-1]` |
| متن مختلط | `unicode-bidi: isolate` و `<bdi>` برای نام کاربری/کد داخل متن فارسی |
| اعداد و کد | `dir="ltr"` روی عنصر شماره تلفن، کد، URL |
| ورودی‌ها | `dir="auto"` روی `<input>` تا با محتوا تنظیم شود |
| انیمیشن اسلاید | بر اساس `document.dir` جهت را انتخاب کنید |

```tsx nohead
<p>
  کاربر <bdi>{username}</bdi> با شماره <span dir="ltr">{phone}</span> ثبت شد.
</p>
```

## Intl API — اعداد، تاریخ و جمع‌بندی بدون کتابخانه

```ts title="src/lib/format.ts"
const rial = new Intl.NumberFormat('fa-IR', {
  style: 'currency', currency: 'IRR', maximumFractionDigits: 0,
});
export const formatPrice = (n: number) => rial.format(n);
// ۱٬۲۵۰٬۰۰۰ ریال

export const formatNumber = (n: number) => new Intl.NumberFormat('fa-IR').format(n);
// ۱۲٬۳۴۵

export const formatDate = (d: Date) =>
  new Intl.DateTimeFormat('fa-IR', { dateStyle: 'long' }).format(d);
// ۱۴ شهریور ۱۴۰۵  ← تقویم جلالی به‌صورت خودکار برای fa-IR

export const relativeTime = (minutes: number) =>
  new Intl.RelativeTimeFormat('fa', { numeric: 'auto' }).format(-minutes, 'minute');
// ۵ دقیقه پیش

export const listFormat = (items: string[]) =>
  new Intl.ListFormat('fa', { type: 'conjunction' }).format(items);
// علی، رضا و سارا
```

برای تبدیل تاریخ‌های جلالی/میلادی و محاسبات تقویمی، `date-fns-jalali` یا `Temporal` (در حال ورود به مرورگرها) گزینه‌های خوبی‌اند.

## بین‌المللی‌سازی (i18n) چندزبانه

```bash title="Terminal"
npm install i18next react-i18next i18next-browser-languagedetector
```

```ts title="src/i18n.ts"
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import fa from './locales/fa.json';
import en from './locales/en.json';

i18n.use(LanguageDetector).use(initReactI18next).init({
  resources: { fa: { translation: fa }, en: { translation: en } },
  fallbackLng: 'fa',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = i18n.dir(lng);
});
```

```tsx nohead
const { t } = useTranslation();
<h1>{t('cart.title', { count: items.length })}</h1>
// fa.json → cart: { title_one: "{{count}} کالا", title_other: "{{count}} کالا" }
```

## ابزارهای بررسی

| ابزار | کاربرد |
|---|---|
| **axe DevTools** (افزونه) | اسکن خودکار صفحه؛ ۳۰–۴۰٪ مشکلات را پیدا می‌کند |
| **eslint-plugin-jsx-a11y** | خطاهای رایج در زمان نوشتن (تصویر بدون alt، onClick روی div) |
| **`@axe-core/react`** | هشدار در کنسول هنگام توسعه |
| **Lighthouse → Accessibility** | امتیاز کلی |
| **تست دستی با کیبورد** | Tab بزنید؛ اگر جایی گیر کردید، کاربر هم گیر می‌کند |
| **NVDA / VoiceOver** | تجربه واقعی screen reader |

:::interview
**Junior — چرا `<div onClick>` به‌جای `<button>` مشکل‌ساز است؟** div قابل‌فوکوس نیست، با Enter/Space فعال نمی‌شود، و screen reader آن را «دکمه» اعلام نمی‌کند. برای جبران باید `role`، `tabIndex` و `onKeyDown` اضافه کنید که همه را `<button>` رایگان می‌دهد.

**Mid — `aria-live="polite"` و `assertive` چه تفاوتی دارند و کی هرکدام؟** polite بعد از اتمام گفتار فعلی اعلام می‌کند (پیام‌های موفقیت، به‌روزرسانی‌ها). assertive فوراً قطع می‌کند (خطای بحرانی که مانع ادامه است). استفاده بیش از حد از assertive تجربه را آزاردهنده می‌کند.

**Senior — چالش‌های RTL در اپلیکیشن React چندزبانه چیست و چطور به‌صورت سیستمی حل می‌کنید؟** چالش‌ها: استایل‌های فیزیکی (`left/right`) پراکنده، آیکون‌های جهت‌دار، انیمیشن‌ها، کتابخانه‌های third-party بدون پشتیبانی RTL، و متن مختلط. راه‌حل سیستمی: ESLint/Stylelint برای ممنوع‌کردن ویژگی‌های فیزیکی، design token برای جهت، wrapper برای آیکون‌های جهت‌دار با flip خودکار، تست بصری (Storybook + Chromatic) در هر دو جهت، و `dir` مشتق از زبان در یک نقطه (root).
:::
