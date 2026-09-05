---
num: 29
part: 2
title: انتخاب فریم‌ورک: Next.js، React Router و TanStack Start
short: انتخاب فریم‌ورک
subtitle: SPA یا فریم‌ورک؟ مقایسه عملی، معیارهای انتخاب و مسیر مهاجرت از Vite
lead: بعد از تسلط بر React، سؤال بعدی این است که آن را با چه چیزی به Production ببرید. این فصل بدون تعصب، گزینه‌های سال ۲۰۲۶ را با معیارهای واقعی مقایسه می‌کند تا برای هر پروژه انتخاب درستی داشته باشید.
---

## اول: آیا اصلاً به فریم‌ورک نیاز دارید؟

| SPA با Vite کافی است اگر… | به فریم‌ورک نیاز دارید اگر… |
|---|---|
| اپ پشت لاگین است (داشبورد، ادمین، ابزار داخلی) | SEO مهم است (فروشگاه، بلاگ، لندینگ) |
| بک‌اند جداگانه و تیم بک‌اند دارید | می‌خواهید بک‌اند و فرانت در یک پروژه باشند |
| کاربران اینترنت خوب دارند و TTFB حیاتی نیست | کارایی بارگذاری اولیه در موبایل/شبکه ضعیف مهم است |
| می‌خواهید کنترل کامل و کمترین «جادو» داشته باشید | می‌خواهید از RSC، Streaming، Server Functions استفاده کنید |
| استقرار استاتیک روی هر CDN/هاست ساده | زیرساخت Node/Edge دارید |

توصیه رسمی تیم React برای پروژه جدید، استفاده از فریم‌ورک است؛ اما «ابزار داخلی با Vite» همچنان کاملاً معتبر و رایج است.

## گزینه‌ها در یک نگاه

| | Next.js 16 | React Router v8 (Framework) | TanStack Start | Vite SPA |
|---|---|---|---|---|
| RSC | ✅ بالغ | ✅ (تجربی → پایدار) | ✅ (در حال تکمیل) | ❌ |
| روتینگ | فایل‌محور (App Router) | فایل‌محور یا config | فایل‌محور، type-safe کامل | React Router / TanStack Router |
| Type-safety مسیر | متوسط | خوب (typegen) | ✅ عالی | بستگی به روتر |
| Server Functions | ✅ | ✅ | ✅ | ❌ |
| کش و ISR | ✅ پیشرفته (`'use cache'`, PPR) | ساده (HTTP headers) | ساده | — |
| باندلر | Turbopack | Vite | Vite | Vite |
| استقرار | Vercel بهینه؛ Docker/Node هرجا | هر Node/Edge؛ adapterها | هر Node/Edge؛ adapterها | هر CDN استاتیک |
| منحنی یادگیری | بالاتر (قواعد کش، RSC) | متوسط (میراث Remix) | متوسط | کم |
| بازار کار ایران | بیشترین | در حال رشد | کم اما رو به رشد | زیاد |

## Next.js 16

بالغ‌ترین پیاده‌سازی RSC با اکوسیستم عظیم. مفاهیم کلیدی: App Router (`app/`)، Layoutهای تودرتو، `loading.tsx`/`error.tsx`، Server Actions، `'use cache'` و Cache Components، `proxy.ts` (جانشین middleware)، Turbopack. برای این فریم‌ورک، **کتاب «مرجع جامع Next.js 16»** از همین نویسنده را مطالعه کنید.

```text title="Next.js App Router"
app/
├── layout.tsx            # Root layout (Server)
├── page.tsx              # /
├── products/
│   ├── page.tsx          # /products  (async Server Component)
│   ├── loading.tsx       # Suspense fallback خودکار
│   └── [id]/page.tsx     # /products/:id
└── api/…/route.ts        # Route Handlers
```

## React Router v8 — حالت Framework

تکامل Remix؛ روی Vite. اگر حالت Data (فصل ۱۶) را بلدید، ۸۰٪ راه را رفته‌اید: همان `loader`/`action`، فقط روی سرور اجرا می‌شوند.

```tsx title="app/routes/products.$id.tsx"
import type { Route } from './+types/products.$id';

export async function loader({ params }: Route.LoaderArgs) {
  const product = await db.product.findUnique({ where: { id: params.id } });
  if (!product) throw new Response('Not Found', { status: 404 });
  return { product };
}

export default function ProductPage({ loaderData }: Route.ComponentProps) {
  return <h1>{loaderData.product.title}</h1>;   // تایپ‌ها خودکار تولید می‌شوند
}
```

مزایا: ساده‌تر از Next.js، وابستگی کمتر به یک ارائه‌دهنده، مستندات عالی، استانداردهای وب (Request/Response). مسیر مهاجرت رسمی از SPA وجود دارد.

## TanStack Start

جدیدترین گزینه از سازندگان TanStack Query/Router. برگ برنده: **type-safety کامل** — پارامترهای مسیر، search params، loader data و حتی لینک‌ها در زمان کامپایل بررسی می‌شوند. برای تیم‌های TypeScript-محور که از TanStack Query استفاده می‌کنند، یکپارچگی بی‌نظیری دارد. هنوز جوان است؛ برای پروژه‌های سازمانی محافظه‌کارانه صبر کنید.

```tsx title="src/routes/products.$id.tsx"
import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

const getProduct = createServerFn({ method: 'GET' })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => db.product.findUnique({ where: { id } }));

export const Route = createFileRoute('/products/$id')({
  loader: ({ params }) => getProduct({ data: params.id }),
  component: () => {
    const product = Route.useLoaderData();   // تایپ دقیق، بدون cast
    return <h1>{product?.title}</h1>;
  },
});
```

## معیارهای انتخاب

<div class="flow">
<div class="box">SEO و محتوا؟<b>Next.js / RR7</b></div>
<span class="arrow">→</span>
<div class="box">تیم TS سخت‌گیر + TanStack Query؟<b>TanStack Start</b></div>
<span class="arrow">→</span>
<div class="box">داشبورد پشت لاگین؟<b>Vite SPA</b></div>
<span class="arrow">→</span>
<div class="box">Vercel و اکوسیستم بزرگ؟<b>Next.js</b></div>
</div>

سؤال‌های تصمیم‌گیری:

1. **تیم چه چیزی بلد است؟** فریم‌ورکی که تیم می‌شناسد، از «بهترین» فریم‌ورک بهتر است.
2. **کجا مستقر می‌شوید؟** اگر فقط هاست استاتیک دارید، SPA یا خروجی استاتیک.
3. **چقدر «جادو» می‌پذیرید؟** Next.js قواعد کش پیچیده‌تری دارد؛ RR7 صریح‌تر است.
4. **بازار کار محلی؟** برای استخدام در ایران، Next.js بیشترین تقاضا را دارد.

## مهاجرت از Vite SPA به فریم‌ورک

مهارت‌های این کتاب مستقیماً منتقل می‌شوند. آنچه تغییر می‌کند:

| در SPA | در فریم‌ورک RSC |
|---|---|
| `useSuspenseQuery` در کامپوننت | `await` مستقیم در Server Component (+ Query برای داده کلاینتی پرتغییر) |
| `fetch` به API جدا | دسترسی مستقیم به DB در سرور، یا Server Function |
| `<title>` با Metadata React | همان + API متادیتای فریم‌ورک |
| همه کامپوننت‌ها کلاینت | پیش‌فرض سرور؛ `'use client'` برای تعامل |
| `import.meta.env.VITE_*` | متغیرهای سرور (بدون پیشوند) + عمومی با پیشوند |
| روتینگ در `router.tsx` | ساختار پوشه‌ها |

گام‌های عملی: (۱) ابتدا با React Router v8 حالت Data کار کنید تا loader/action در دستتان بیاید؛ (۲) کامپوننت‌های نمایشی را از هوک‌های داده جدا کنید؛ (۳) در فریم‌ورک، صفحه به صفحه مهاجرت کنید و از الگوی children برای ترکیب Server/Client استفاده کنید.

:::tip یک فریم‌ورک را عمیق یاد بگیرید، بقیه را بشناسید
مفاهیم (RSC، Streaming، Actions، کش) مشترک‌اند. با تسلط بر یکی، یادگیری بقیه چند روز طول می‌کشد. پراکندگی بین همه، تسلط بر هیچ‌کدام است.
:::

:::interview
**Junior — چرا تیم React توصیه می‌کند از فریم‌ورک استفاده کنیم؟** چون اپ واقعی به روتینگ، واکشی داده، code splitting، SSR/SEO و بهینه‌سازی نیاز دارد و فریم‌ورک این‌ها را یکپارچه و آزموده‌شده ارائه می‌دهد؛ سرهم‌کردن دستی آن‌ها زمان‌بر و خطاخیز است.

**Mid — تفاوت اصلی React Router v8 Framework و Next.js در مدل داده چیست؟** RR8 روی loader/action و استانداردهای Request/Response بنا شده و کش را به HTTP و کتابخانه‌ها می‌سپارد؛ Next.js لایه کش چندسطحی خودش (Data Cache، Full Route Cache، `'use cache'`) را دارد که قدرتمندتر اما پیچیده‌تر است.

**Senior — چه زمانی SPA خالص انتخاب معماری بهتری از فریم‌ورک فول‌استک است؟** وقتی: تیم بک‌اند مستقل با API قرارداد‌محور دارد (مثلاً چند کلاینت موبایل/وب)، اپ کاملاً پشت احراز هویت است و SEO ندارد، زیرساخت فقط CDN استاتیک است (هزینه و پیچیدگی عملیاتی کمتر)، یا اپ بسیار تعاملی است (ویرایشگر، نقشه) که مزیت RSC ناچیز است. در این موارد، SPA سادگی، استقلال از vendor و قابلیت کش کامل در CDN می‌دهد و پیچیدگی مرز سرور/کلاینت را حذف می‌کند.
:::
