---
num: 17
part: 1
title: استایل‌دهی، Tailwind v4 و Metadata
subtitle: CSS Modules، Tailwind، shadcn/ui، RTL و تگ‌های `<title>`/`<meta>` داخلی React 19
lead: رابط کاربری زیبا و قابل‌نگهداری به یک استراتژی استایل روشن نیاز دارد. این فصل گزینه‌های مدرن را مقایسه می‌کند، Tailwind v4 را با پشتیبانی RTL راه‌اندازی می‌کند و قابلیت جدید React 19 برای مدیریت `<head>` را معرفی می‌کند.
---

## گزینه‌های استایل‌دهی در ۲۰۲۶

| روش | مزیت | عیب | مناسب |
|---|---|---|---|
| **CSS Modules** | بومی Vite، scoped، بدون runtime | نام‌گذاری دستی، بدون design token | پروژه‌های میانی |
| **Tailwind v4** | سریع، سازگار، design system داخلی | HTML شلوغ، منحنی یادگیری | **اکثر پروژه‌ها** |
| **CSS-in-JS runtime** (styled-components) | dynamic styles راحت | سربار runtime، ناسازگار با RSC | پروژه‌های قدیمی |
| **Zero-runtime CSS-in-JS** (Panda, Vanilla Extract) | تایپ‌شده + بدون runtime | پیکربندی بیشتر | Design System بزرگ |
| **shadcn/ui** | کامپوننت‌های قابل‌مالکیت روی Tailwind + Radix | نه یک کتابخانه؛ کد را نگه می‌دارید | اپ‌های واقعی |

## CSS Modules

```css title="src/components/Card.module.css"
.card { border-radius: 12px; padding: 16px; box-shadow: 0 1px 4px rgb(0 0 0 / 8%); }
.title { font-weight: 700; }
```

```tsx nohead
import styles from './Card.module.css';
<div className={styles.card}><h3 className={styles.title}>…</h3></div>
```

Vite نام کلاس‌ها را یکتا می‌کند (`Card_card_x7f2a`)؛ تداخل بین کامپوننت‌ها غیرممکن است.

## Tailwind CSS v4

نسخه ۴ (۲۰۲۵) پیکربندی را به خود CSS منتقل کرد و نیازی به `tailwind.config.js` نیست:

```bash title="Terminal"
npm install tailwindcss @tailwindcss/vite
```

```ts title="vite.config.ts"
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ plugins: [react(), tailwindcss()] });
```

```css title="src/index.css"
@import "tailwindcss";

@theme {
  --font-sans: "Vazirmatn", system-ui, sans-serif;
  --color-brand-500: oklch(0.65 0.18 250);
  --color-brand-600: oklch(0.58 0.18 250);
}
```

```tsx nohead
<button
  className="rounded-lg bg-brand-500 px-4 py-2 text-white
             hover:bg-brand-600 disabled:opacity-50"
>
  ذخیره
</button>
```

## RTL در Tailwind

از **logical properties** استفاده کنید تا با `dir="rtl"` خودکار درست شوند:

| به‌جای | بنویسید | معنی |
|---|---|---|
| `ml-4` / `mr-4` | `ms-4` / `me-4` | margin-inline-start/end |
| `pl-4` / `pr-4` | `ps-4` / `pe-4` | padding-inline |
| `left-0` / `right-0` | `start-0` / `end-0` | inset-inline |
| `text-left` | `text-start` | تراز منطقی |
| `rounded-l-lg` | `rounded-s-lg` | گوشه منطقی |

برای موارد خاص از variantهای `rtl:` و `ltr:` استفاده کنید: `rtl:rotate-180`.

## ترکیب کلاس‌ها: `clsx` + `tailwind-merge`

```ts title="src/lib/cn.ts"
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

```tsx nohead
<div className={cn('p-4 bg-white', isActive && 'bg-brand-500', className)} />
// twMerge تضاد bg-white و bg-brand-500 را حل می‌کند (آخری برنده است)
```

## Variantها با `class-variance-authority`

```tsx title="src/components/ui/Button.tsx"
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

const button = cva('inline-flex items-center rounded-lg font-medium transition', {
  variants: {
    variant: {
      primary: 'bg-brand-500 text-white hover:bg-brand-600',
      ghost: 'bg-transparent hover:bg-slate-100',
      danger: 'bg-red-600 text-white hover:bg-red-700',
    },
    size: { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4', lg: 'h-12 px-6 text-lg' },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});

type ButtonProps = ComponentProps<'button'> & VariantProps<typeof button>;

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={cn(button({ variant, size }), className)} {...props} />;
}
```

این دقیقاً الگویی است که **shadcn/ui** استفاده می‌کند. با `npx shadcn@latest add button dialog` کامپوننت‌های آماده و دسترس‌پذیر (بر پایه Radix) به پروژه شما **کپی** می‌شوند؛ مالک کد هستید و هر چه بخواهید تغییر می‌دهید.

## Metadata داخلی در React 19

قبلاً برای تغییر `<title>` به `react-helmet` نیاز داشتید. React 19 تگ‌های `<title>`، `<meta>` و `<link>` را از هر جای درخت به `<head>` منتقل می‌کند:

```tsx title="src/pages/ProductPage.tsx"
export function ProductPage({ product }: { product: Product }) {
  return (
    <>
      <title>{`${product.title} | فروشگاه`}</title>
      <meta name="description" content={product.summary} />
      <meta property="og:image" content={product.image} />
      <link rel="canonical" href={`https://shop.example/p/${product.slug}`} />

      <article>…</article>
    </>
  );
}
```

:::warn نکات Metadata
- `<title>` باید **یک رشته واحد** باشد: `` {`${a} | ${b}`} `` ✅ — `{a} | {b}` ❌ (آرایه می‌شود).
- در SPA خالص این تگ‌ها بعد از اجرای JS اعمال می‌شوند؛ خزنده‌ها ممکن است آن‌ها را نبینند. برای SEO واقعی به SSR/فریم‌ورک نیاز است (فصل ۲۸).
- Stylesheet هم پشتیبانی می‌شود: `<link rel="stylesheet" href="…" precedence="default" />` — React ترتیب و بارگذاری را مدیریت می‌کند.
:::

## فونت فارسی و بهینه‌سازی

```css title="src/index.css"
@font-face {
  font-family: "Vazirmatn";
  src: url("/fonts/Vazirmatn[wght].woff2") format("woff2-variations");
  font-weight: 100 900;
  font-display: swap;
}
```

از فونت **متغیر (variable)** استفاده کنید تا یک فایل همه وزن‌ها را پوشش دهد؛ `font-display: swap` از نامرئی‌ماندن متن جلوگیری می‌کند. فونت را در `public/fonts/` بگذارید و در `index.html` با `<link rel="preload" as="font" crossorigin>` پیش‌بارگذاری کنید.

## تم تاریک

```css title="src/index.css"
@custom-variant dark (&:where(.dark, .dark *));
```

```tsx nohead
// در ThemeProvider (فصل ۱۳):
useEffect(() => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}, [theme]);

<div className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
```

:::tip جلوگیری از فلش تم
تم ذخیره‌شده را با یک اسکریپت inline کوچک در `<head>` (قبل از بارگذاری React) روی `<html>` اعمال کنید تا کاربر تم روشن را برای یک لحظه نبیند.
:::

:::interview
**Junior — CSS Modules چطور از تداخل کلاس‌ها جلوگیری می‌کند؟** در زمان build هر نام کلاس را با یک hash یکتا ترکیب می‌کند و شیء نگاشتی می‌سازد که از آن استفاده می‌کنید. دو فایل با `.title` هرگز برخورد نمی‌کنند.

**Mid — چرا `twMerge` لازم است؟** چون در CSS، ترتیب تعریف کلاس در stylesheet برنده است نه ترتیب در `className`. اگر `p-4` و بعد `p-2` بنویسید، نتیجه غیرقطعی است. `twMerge` کلاس‌های متضاد Tailwind را می‌شناسد و فقط آخری را نگه می‌دارد.

**Senior — چرا CSS-in-JS runtime با Server Components سازگار نیست و راه‌حل چیست؟** این کتابخانه‌ها استایل را در زمان رندر با Context و `useInsertionEffect` تزریق می‌کنند؛ Server Components نه Context کلاینت دارند نه Effect. راه‌حل: ابزارهای zero-runtime (Tailwind، Panda، Vanilla Extract، StyleX) که CSS را در زمان build استخراج می‌کنند.
:::
