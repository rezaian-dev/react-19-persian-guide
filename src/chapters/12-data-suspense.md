---
num: 12
part: 1
title: واکشی داده، Suspense و `use`
subtitle: مدل ذهنی Suspense، API جدید `use`، Error Boundary و TanStack Query
lead: واکشی داده در React 19 یک پارادایم جدید دارد: به‌جای «loading state دستی»، کامپوننت هنگام نبود داده «تعلیق» می‌شود و Suspense نمایش fallback را مدیریت می‌کند. این فصل مدل ذهنی، API `use` و راه‌حل production با TanStack Query را آموزش می‌دهد.
---

## مشکل رویکرد سنتی

با `useEffect` + `useState` هر کامپوننت سه حالت (loading/error/data) را دستی مدیریت می‌کند، «آبشار درخواست‌ها» (waterfall) می‌سازد (فرزند تا mount نشود fetch نمی‌کند)، و هیچ کش، retry یا deduplication ندارد. Suspense این مسئولیت‌ها را از کامپوننت به لایه بالاتر منتقل می‌کند.

## مدل ذهنی Suspense

```tsx nohead
<Suspense fallback={<Skeleton />}>
  <UserProfile />     {/* اگر داده‌اش آماده نباشد "suspend" می‌شود */}
  <UserPosts />       {/* هر دو با هم منتظر می‌مانند */}
</Suspense>
```

وقتی کامپوننتی داخل Suspense هنوز داده‌اش آماده نیست، React رندر آن زیردرخت را **متوقف** و `fallback` را نشان می‌دهد. به محض آماده‌شدن، محتوای واقعی جایگزین می‌شود. Suspense خودش داده fetch نمی‌کند؛ فقط به «سیگنال تعلیق» واکنش نشان می‌دهد.

## API `use` — خواندن Promise در رندر

```tsx title="src/features/users/UserProfile.tsx"
import { use, Suspense } from 'react';

type User = { id: string; name: string; bio: string };

function UserDetails({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise); // تا resolve شدن suspend می‌شود
  return (
    <article>
      <h2>{user.name}</h2>
      <p>{user.bio}</p>
    </article>
  );
}

export function UserProfile({ id }: { id: string }) {
  // ⚠️ Promise باید پایدار باشد؛ نه ساخته‌شده در هر رندر
  const userPromise = useMemo(() => fetchUser(id), [id]);

  return (
    <Suspense fallback={<p>در حال بارگذاری…</p>}>
      <UserDetails userPromise={userPromise} />
    </Suspense>
  );
}
```

:::warn تله بزرگ: Promise ساخته‌شده در رندر
`use(fetchUser(id))` را مستقیم ننویسید. هر رندر یک Promise **جدید** می‌سازد، React دوباره suspend می‌شود، رندر می‌شود، Promise جدید… حلقه بی‌نهایت. Promise باید یا از والد بیاید (بهترین: از Server Component یا loader روتر)، یا کش شده باشد (`useMemo`، کتابخانه، یا `cache()` در RSC). این محدودیت باعث شده در SPA خالص، کتابخانه‌هایی مثل TanStack Query راه‌حل عملی باشند.
:::

## Error Boundary — مدیریت خطای Suspense

اگر Promise reject شود، خطا به نزدیک‌ترین **Error Boundary** می‌رسد. React هنوز API هوکی برای آن ندارد؛ از پکیج کوچک `react-error-boundary` استفاده کنید:

```tsx title="src/app/DataSection.tsx"
import { ErrorBoundary } from 'react-error-boundary';
import { Suspense } from 'react';

export function DataSection() {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div role="alert">
          <p>مشکلی پیش آمد: {error.message}</p>
          <button onClick={resetErrorBoundary}>تلاش مجدد</button>
        </div>
      )}
    >
      <Suspense fallback={<Skeleton />}>
        <UserProfile id="42" />
      </Suspense>
    </ErrorBoundary>
  );
}
```

الگوی استاندارد: `ErrorBoundary` بیرون، `Suspense` داخل. هر «بخش مستقل» صفحه یک جفت از این دو داشته باشد تا خطای یک ویجت کل صفحه را نخواباند.

## چیدمان مرزهای Suspense

:::cols
:::col یک مرز بزرگ
```tsx nohead
<Suspense fallback={<PageSkeleton />}>
  <Header />
  <Feed />
  <Sidebar />
</Suspense>
```
همه یک‌جا ظاهر می‌شوند؛ کندترین بخش، همه را نگه می‌دارد.
:::
:::col مرزهای تودرتو
```tsx nohead
<Header />
<Suspense fallback={<FeedSkeleton />}>
  <Feed />
</Suspense>
<Suspense fallback={<SidebarSkeleton />}>
  <Sidebar />
</Suspense>
```
هر بخش مستقل ظاهر می‌شود؛ تجربه «پیش‌رونده».
:::
:::

React 19.2 در SSR مرزهای Suspense را **دسته‌ای آشکار می‌کند** (batched reveal) تا از ظاهر‌شدن پشت‌سرهم و آزاردهنده جلوگیری شود؛ رفتار کلاینت مشابه است.

## راه‌حل Production: TanStack Query

برای یک SPA واقعی به کش، retry، refetch در فوکوس، pagination و mutation نیاز دارید. **TanStack Query** (v5) استاندارد صنعت است و از Suspense پشتیبانی کامل دارد:

```bash title="Terminal"
npm install @tanstack/react-query
```

```tsx title="src/main.tsx"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

createRoot(root).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
);
```

```tsx title="src/features/products/ProductList.tsx"
import { useSuspenseQuery } from '@tanstack/react-query';

export function ProductList({ category }: { category: string }) {
  const { data } = useSuspenseQuery({
    queryKey: ['products', category],           // کلید کش
    queryFn: () => api.getProducts(category),   // تابع واکشی
  });

  return <ul>{data.map((p) => <li key={p.id}>{p.title}</li>)}</ul>;
}

// والد: <Suspense fallback={<Skeleton/>}><ProductList category="books"/></Suspense>
```

`useSuspenseQuery` تضمین می‌کند `data` همیشه تعریف‌شده است (نه `undefined`)؛ loading و error به Suspense/ErrorBoundary سپرده می‌شوند. برای تغییر داده:

```tsx title="src/features/products/AddProduct.tsx"
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function AddProduct() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: api.createProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });

  return (
    <form action={(fd) => mutation.mutate({ title: fd.get('title') as string })}>
      <input name="title" required />
      <button disabled={mutation.isPending}>افزودن</button>
    </form>
  );
}
```

## جلوگیری از آبشار (Waterfall)

**آبشار** زمانی است که درخواست دوم فقط بعد از اتمام اولی شروع می‌شود، چون کامپوننت فرزند تا رندر والد mount نمی‌شود. راه‌حل‌ها:

| راهکار | توضیح |
|---|---|
| **Fetch در والد، پاس به فرزند** | Promiseها را هم‌زمان بسازید و با `use` در فرزندان بخوانید |
| **Prefetch در روتر** | `loader` در React Router / TanStack Router قبل از رندر شروع می‌کند |
| **`queryClient.prefetchQuery`** | هنگام hover روی لینک، داده صفحه بعد را بگیرید |
| **Server Components** | (فصل ۲۸) واکشی روی سرور بدون آبشار کلاینت |

## مقایسه رویکردها

| | `useEffect` + `useState` | `use` + Suspense | TanStack Query |
|---|---|---|---|
| کش | ❌ | ❌ (خودتان) | ✅ |
| Loading/Error | دستی | Suspense/Boundary | هر دو حالت |
| Race condition | باید خودتان حل کنید | ندارد | ندارد |
| مناسب | آموزش، پروژه خیلی کوچک | با فریم‌ورک/RSC | SPA واقعی |

:::project ویترین محصولات
با API عمومی `https://dummyjson.com/products` یک صفحه بسازید: لیست محصولات با `useSuspenseQuery`، فیلتر دسته‌بندی (هر دسته یک queryKey)، Skeleton هنگام بارگذاری، ErrorBoundary با دکمه تلاش مجدد، و prefetch جزئیات محصول هنگام hover روی کارت.
:::

:::interview
**Junior — Suspense چه کاری انجام می‌دهد؟** نمایش fallback تا زمانی که کامپوننت‌های داخلش (که داده یا کد lazy منتظرند) آماده شوند. خودش داده واکشی نمی‌کند.

**Mid — چرا `use(fetch(...))` مستقیم داخل کامپوننت اشتباه است؟** هر رندر Promise جدیدی می‌سازد و React نمی‌تواند تشخیص دهد همان درخواست قبلی است؛ نتیجه حلقه suspend بی‌پایان است. Promise باید خارج از رندر ساخته یا کش شود.

**Senior — TanStack Query چطور با Suspense و transitions تعامل دارد و کجا باید مراقب بود؟** `useSuspenseQuery` هنگام نبود داده suspend می‌کند و React 19 با transitions می‌تواند به‌جای نمایش fallback، UI قدیمی را نگه دارد (وقتی تغییر کلید داخل `startTransition` باشد). نکته مهم: بدون prefetch، هر `useSuspenseQuery` در سطوح مختلف درخت می‌تواند آبشار بسازد؛ برای صفحات پیچیده queryها را در loader روتر یا با `useSuspenseQueries` موازی کنید.
:::
