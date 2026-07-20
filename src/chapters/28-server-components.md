---
num: 28
part: 2
title: Server Components و Server Functions
subtitle: مدل ذهنی «دو کامپیوتر»، مرز `'use client'`، `'use server'`، `cache` و Streaming
lead: React Server Components (RSC) بزرگ‌ترین تغییر معماری React از ابتدای آن است: کامپوننت‌هایی که فقط روی سرور اجرا می‌شوند و هیچ JavaScript به مرورگر نمی‌فرستند. این فصل مدل ذهنی درست را می‌سازد تا وقتی به Next.js یا React Router Framework رفتید، دقیقاً بدانید چه اتفاقی می‌افتد.
---

## مدل ذهنی: React برای دو کامپیوتر

تا اینجای کتاب، همه کامپوننت‌ها روی **یک** کامپیوتر (مرورگر) اجرا می‌شدند. RSC یک محیط دوم اضافه می‌کند: **سرور** (در زمان build یا هر درخواست). حالا هر کامپوننت به یکی از دو دنیا تعلق دارد:

| | Server Component | Client Component |
|---|---|---|
| کجا اجرا می‌شود | فقط سرور (build یا request) | سرور (SSR) **و** مرورگر |
| JS به کلاینت | ❌ صفر | ✅ در باندل |
| دسترسی مستقیم به DB / FS / secrets | ✅ | ❌ |
| `useState`, `useEffect`, event handler | ❌ | ✅ |
| `async/await` در بدنه کامپوننت | ✅ | ❌ (از `use` استفاده کنید) |
| نحوه علامت‌گذاری | پیش‌فرض (در فریم‌ورک RSC) | `'use client'` بالای فایل |

```tsx title="app/products/page.tsx (Server Component)"
import { db } from '@/lib/db';
import { AddToCartButton } from './AddToCartButton';

export default async function ProductsPage() {
  const products = await db.product.findMany();   // مستقیم از دیتابیس! بدون API
  return (
    <ul>
      {products.map((p) => (
        <li key={p.id}>
          {p.title} — {p.price}
          <AddToCartButton productId={p.id} />        {/* جزیره تعاملی */}
        </li>
      ))}
    </ul>
  );
}
```

```tsx title="app/products/AddToCartButton.tsx (Client Component)"
'use client';
import { useState } from 'react';

export function AddToCartButton({ productId }: { productId: string }) {
  const [added, setAdded] = useState(false);
  const handleClick = () => {
    addToCart(productId);
    setAdded(true);
  };
  return <button onClick={handleClick}>{added ? '✓' : 'افزودن'}</button>;
}
```

:::note RSC به فریم‌ورک نیاز دارد
React خودش فقط پروتکل و runtime را ارائه می‌دهد؛ باندلر و سرور را فریم‌ورک تأمین می‌کند. در ۲۰۲۶: **Next.js (App Router)**، **React Router v8 (Framework mode)**، **TanStack Start**، **Waku** و **Parcel/Vite با پلاگین RSC** (تجربی). SPA خالص Vite بدون پلاگین، RSC ندارد.
:::

## مرز `'use client'` چطور کار می‌کند؟

`'use client'` یک **مرز** تعریف می‌کند، نه «این کامپوننت کلاینتی است». هر چیزی که از یک فایل `'use client'` import شود، وارد باندل کلاینت می‌شود — از جمله همه وابستگی‌هایش.

```text title="Component tree"
<Page>                   Server
 ├─ <Header>             Server
 ├─ <Sidebar>            'use client' ─┐ باندل کلاینت
 │   └─ <NavItem>        (کلاینت، حتی بدون دایرکتیو) ─┘
 └─ <Article>            Server
     └─ <LikeButton>     'use client'
```

قواعد ترکیب:

- Server Component می‌تواند Client Component را رندر کند ✅
- Client Component **نمی‌تواند** Server Component را import کند ❌
- اما Client Component می‌تواند Server Component را به‌عنوان **`children`** بگیرد ✅ (الگوی «سوراخ»)

```tsx nohead
// ✅ الگوی children: Server Component داخل Client Component
<ClientLayout>           {/* 'use client' */}
  <ServerContent />      {/* Server؛ به‌عنوان children پاس داده می‌شود */}
</ClientLayout>
```

:::warn props باید سریال‌پذیر باشند
از Server به Client فقط مقادیر قابل‌سریال‌سازی پاس می‌شوند: primitive، آرایه، شیء ساده، Date، Map/Set، **Promise** (با `use` در کلاینت خوانده می‌شود) و **Server Function**. تابع معمولی، کلاس یا JSX با state ✗. اگر می‌خواهید تابع پاس دهید، باید Server Function باشد.
:::

## Server Functions — `'use server'`

تابعی که روی سرور اجرا می‌شود اما از کلاینت (مثلاً `<form action>`) قابل‌فراخوانی است. فریم‌ورک آن را به یک endpoint امن تبدیل می‌کند:

```ts title="app/actions/comments.ts"
'use server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({ postId: z.string(), text: z.string().min(3) });

export async function addComment(prev: { error?: string }, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: 'ابتدا وارد شوید' };          // ✅ بررسی مجوز در سرور

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'ورودی نامعتبر' };

  await db.comment.create({ data: { ...parsed.data, userId: session.userId } });
  revalidatePath(`/posts/${parsed.data.postId}`);              // (Next.js) کش را باطل کن
  return {};
}
```

```tsx title="app/posts/[id]/CommentForm.tsx"
'use client';
import { useActionState } from 'react';
import { addComment } from '@/app/actions/comments';

export function CommentForm({ postId }: { postId: string }) {
  const [state, action, pending] = useActionState(addComment, {});
  return (
    <form action={action}>
      <input type="hidden" name="postId" value={postId} />
      <textarea name="text" required />
      {state.error && <p role="alert">{state.error}</p>}
      <button disabled={pending}>ارسال</button>
    </form>
  );
}
```

همان `useActionState` فصل ۹ — فقط تابع روی سرور اجرا می‌شود. این فرم **بدون JavaScript هم کار می‌کند** (Progressive Enhancement واقعی).

:::danger Server Function = endpoint عمومی
هر Server Function یک URL عمومی است که هر کسی می‌تواند با هر ورودی صدا بزند. **همیشه** داخل آن احراز هویت، مجوز و اعتبارسنجی ورودی انجام دهید — دقیقاً مثل یک REST endpoint. اسرار را در آرگومان‌ها یا مقدار بازگشتی قرار ندهید.
:::

## `cache` و `cacheSignal` — deduplication در سرور

در یک درخواست، چند Server Component ممکن است داده یکسانی بخواهند. `cache` تضمین می‌کند تابع فقط یک بار به‌ازای هر درخواست اجرا شود:

```ts title="lib/data.ts"
import { cache, cacheSignal } from 'react';

export const getUser = cache(async (id: string) => {
  // cacheSignal (React 19.2): وقتی رندر تمام/لغو شد، درخواست abort می‌شود
  const signal = cacheSignal() ?? undefined;
  const res = await fetch(`${API}/users/${id}`, { signal });
  return res.json() as Promise<User>;
});

// در سه کامپوننت مختلف: getUser('42') — فقط یک fetch واقعی
```

`cache` فقط در Server Components معنا دارد و عمرش یک درخواست است (نه کش بین درخواست‌ها؛ آن را فریم‌ورک با `'use cache'` یا مشابه ارائه می‌دهد).

## Streaming و Suspense در سرور

```tsx title="app/dashboard/page.tsx"
export default function Dashboard() {
  return (
    <>
      <Header />                                  {/* فوری */}
      <Suspense fallback={<StatsSkeleton />}>
        <SlowStats />                             {/* await کند؛ بعداً stream می‌شود */}
      </Suspense>
      <Suspense fallback={<FeedSkeleton />}>
        <Feed />
      </Suspense>
    </>
  );
}
```

سرور HTML را **تکه‌تکه** می‌فرستد: ابتدا shell با اسکلت‌ها، سپس هر بخش وقتی آماده شد. کاربر TTFB بسیار پایین می‌بیند و بخش‌های سریع را زودتر می‌گیرد. React 19.2 مرزهای Suspense را در SSR دسته‌ای آشکار می‌کند تا از پرش‌های پی‌درپی جلوگیری شود.

## پاس‌دادن Promise از سرور به کلاینت

```tsx nohead
// Server Component
export default function Page() {
  const commentsPromise = getComments(); // بدون await!
  return (
    <Suspense fallback={<p>…</p>}>
      <Comments promise={commentsPromise} />
    </Suspense>
  );
}

// Client Component
'use client';
export function Comments({ promise }: { promise: Promise<Comment[]> }) {
  const comments = use(promise); // در کلاینت suspend می‌شود تا stream برسد
  return comments.map(c => <li key={c.id}>{c.text}</li>);
}
```

این الگو اجازه می‌دهد رندر سرور بلاک نشود، در حالی که کامپوننت تعاملی کلاینت داده را دریافت می‌کند.

## چه چیزی کجا برود؟

| بگذارید در Server Component | بگذارید در Client Component |
|---|---|
| واکشی داده، دسترسی به DB | `useState`/`useReducer`، event handler |
| کتابخانه‌های سنگین (markdown parser, syntax highlighter) | Effectها، APIهای مرورگر (`window`, `localStorage`) |
| کد وابسته به secret | Context provider و مصرف‌کننده‌ها |
| رندر محتوای استاتیک و لیست‌ها | انیمیشن، drag & drop، فرم‌های تعاملی پیچیده |

قاعده: **مرز `'use client'` را تا حد ممکن پایین (برگ‌ها) نگه دارید.** به‌جای کل صفحه، فقط دکمه را کلاینتی کنید.

## Partial Pre-rendering (React 19.2)

APIهای جدید `prerender` + `resume` اجازه می‌دهند shell استاتیک صفحه در زمان build ساخته و در CDN کش شود، و بخش‌های پویا در زمان درخواست «ادامه» یابند. Next.js این را با عنوان PPR ارائه می‌دهد: بهترین‌های استاتیک (سرعت CDN) و پویا (شخصی‌سازی) در یک صفحه.

:::interview
**Junior — تفاوت Server Component و SSR چیست؟** SSR یک Client Component را روی سرور به HTML تبدیل می‌کند اما JS آن باز هم به مرورگر می‌رود و hydrate می‌شود. Server Component **هرگز** به کلاینت نمی‌رود؛ فقط خروجی‌اش (در قالب RSC payload) ارسال می‌شود. می‌توان هر دو را با هم داشت.

**Mid — چرا Client Component نمی‌تواند Server Component را import کند ولی می‌تواند به‌عنوان children بگیرد؟** import یعنی «این کد را در باندل من قرار بده» — که برای کد سرور معنا ندارد. اما children در سرور رندر شده و به‌صورت payload آماده به کلاینت می‌رسد؛ Client Component فقط آن را جای‌گذاری می‌کند.

**Senior — RSC payload چیست و چرا به‌جای HTML از آن استفاده می‌شود؟** یک فرمت متنی stream‌پذیر که درخت React (نه HTML) را توصیف می‌کند: عناصر، props سریال‌شده، ارجاع به Client Componentها (به‌صورت module reference) و Promiseهای در حال انتظار. مزیت نسبت به HTML: هنگام ناوبری کلاینت، React می‌تواند درخت جدید را با درخت فعلی **reconcile** کند و state کامپوننت‌های کلاینت (مثل input یا اسکرول) را حفظ کند — کاری که با جایگزینی HTML ممکن نیست.
:::
