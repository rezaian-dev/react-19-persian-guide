---
num: 16
part: 1
title: روتینگ با React Router v8
subtitle: مسیرهای تودرتو، loader و action، navigation و مسیرهای محافظت‌شده
lead: هر اپلیکیشن واقعی چند صفحه دارد. React Router v8 با API مبتنی بر داده (loader/action) واکشی داده را به لایه مسیر منتقل می‌کند و آبشار درخواست‌ها را از بین می‌برد. این فصل حالت «Data» آن را که برای SPA مناسب است، عمیق آموزش می‌دهد.
---

## نصب و پیکربندی

```bash title="Terminal"
npm install react-router
```

:::note نسخه ۸
از v7 به بعد همه‌چیز در یک پکیج `react-router` است و `react-router-dom` حذف شده؛ فقط `RouterProvider` (وابسته به DOM) از مسیر `react-router/dom` وارد می‌شود. v8 (تابستان ۲۰۲۶) همان API حالت Data را دارد — تغییر اصلی، فعال‌بودن پیش‌فرض middleware و حداقل‌های Node 22 و React 19.2 است.
:::

React Router v8 سه حالت دارد: **Declarative** (ساده، فقط `<Routes>`)، **Data** (loader/action — توصیه ما برای SPA) و **Framework** (SSR و فایل‌محور، جانشین Remix). این فصل روی حالت Data تمرکز دارد. پیکربندی حالت Data دو فایل دارد — تعریف مسیرها و اتصال روتر به ریشه:

```tsx title="src/router.tsx"
import { createBrowserRouter } from 'react-router';
import { RootLayout } from './layouts/RootLayout';
import { HomePage } from './pages/HomePage';
import { ProductPage, productLoader } from './pages/ProductPage';
import { ErrorPage } from './pages/ErrorPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products/:id', element: <ProductPage />, loader: productLoader },
      { path: 'about', lazy: () => import('./pages/AboutPage') },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
```

```tsx title="src/main.tsx"
import { RouterProvider } from 'react-router/dom';
import { router } from './router';

createRoot(root).render(<RouterProvider router={router} />);
```

## Layout و `<Outlet>`

```tsx title="src/layouts/RootLayout.tsx"
import { Outlet, NavLink } from 'react-router';

export function RootLayout() {
  return (
    <>
      <nav>
        <NavLink to="/" end>خانه</NavLink>
        <NavLink to="/about" className={({ isActive }) => (isActive ? 'active' : '')}>
          درباره
        </NavLink>
      </nav>
      <main>
        <Outlet /> {/* صفحه فرزند اینجا رندر می‌شود */}
      </main>
    </>
  );
}
```

`<NavLink>` نسخه‌ای از `<Link>` است که وضعیت active را می‌داند. `end` یعنی فقط برای تطابق دقیق active باشد (وگرنه `/` با همه مسیرها تطابق دارد).

## Loader — داده قبل از رندر

```tsx title="src/pages/ProductPage.tsx"
import { useLoaderData, type LoaderFunctionArgs } from 'react-router';

export async function productLoader({ params }: LoaderFunctionArgs) {
  const res = await fetch(`/api/products/${params.id}`);
  if (!res.ok) throw new Response('Not Found', { status: 404 });
  return res.json() as Promise<Product>;
}

export function ProductPage() {
  const product = useLoaderData() as Product;
  return <h1>{product.title}</h1>;
}
```

مزیت: روتر **قبل از رندر** و به‌صورت **موازی برای همه مسیرهای تودرتو** loader را اجرا می‌کند؛ آبشار حذف می‌شود. `throw new Response(...)` مستقیماً به `errorElement` می‌رود.

:::tip ترکیب با TanStack Query
loader می‌تواند فقط `queryClient.ensureQueryData(...)` را صدا بزند تا کش گرم شود، و کامپوننت با `useSuspenseQuery` بخواند. این‌طور هم ناوبری آنی دارید و هم کش، refetch و mutation کتابخانه را.
:::

## نمایش تدریجی با `defer`-style: `Await`

برای صفحاتی که بخشی از داده کند است، Promise را از loader برگردانید (بدون `await`) و با `<Suspense>` + `<Await>` نمایش دهید:

```tsx title="src/pages/DashboardPage.tsx"
import { Suspense } from 'react';
import { Await, useLoaderData } from 'react-router';

export function dashboardLoader() {
  return {
    user: fetchUser(),              // Promise — بدون await
    stats: fetchStats(),            // Promise کند
  };
}

export function DashboardPage() {
  const { user, stats } = useLoaderData() as ReturnType<typeof dashboardLoader>;
  return (
    <>
      <Suspense fallback={<p>…</p>}>
        <Await resolve={user}>{(u) => <h1>سلام {u.name}</h1>}</Await>
      </Suspense>
      <Suspense fallback={<StatsSkeleton />}>
        <Await resolve={stats}>{(s) => <StatsPanel stats={s} />}</Await>
      </Suspense>
    </>
  );
}
```

## Action — تغییر داده در سطح مسیر

```tsx title="src/pages/NewPostPage.tsx"
import { Form, redirect, useNavigation, type ActionFunctionArgs } from 'react-router';

export async function newPostAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const title = formData.get('title') as string;
  if (title.length < 3) return { error: 'عنوان کوتاه است' };
  const post = await api.createPost({ title });
  return redirect(`/posts/${post.id}`);
}

export function NewPostPage() {
  const navigation = useNavigation();
  const busy = navigation.state === 'submitting';
  return (
    <Form method="post">
      <input name="title" />
      <button disabled={busy}>{busy ? '…' : 'انتشار'}</button>
    </Form>
  );
}
```

`<Form>` روتر مثل `<form action>` React 19 کار می‌کند، اما پس از موفقیت **همه loaderهای فعال را دوباره اجرا** (revalidate) می‌کند تا UI با سرور همگام بماند.

## ناوبری برنامه‌ریزی‌شده و پارامترها

```tsx nohead
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router';

const navigate = useNavigate();
navigate('/login');                       // push
navigate(-1);                             // back
navigate('/done', { replace: true });     // بدون تاریخچه

const { id } = useParams<{ id: string }>();
const [searchParams, setSearchParams] = useSearchParams();
const page = Number(searchParams.get('page') ?? 1);
setSearchParams({ page: String(page + 1) });

const location = useLocation(); // pathname, search, state
```

## مسیرهای محافظت‌شده

```tsx title="src/router.tsx"
async function requireAuth() {
  const user = await auth.getUser();
  if (!user) throw redirect('/login?from=' + encodeURIComponent(location.pathname));
  return user;
}

{
  path: 'dashboard',
  loader: requireAuth,          // کاربر لاگین نکرده هرگز صفحه را نمی‌بیند
  element: <DashboardLayout />,
  children: [...]
}
```

بررسی در loader بهتر از بررسی در کامپوننت است: قبل از رندر انجام می‌شود و فلش UI محافظت‌شده رخ نمی‌دهد.

## Code Splitting با `lazy`

```tsx nohead
// فایل صفحه: export هایی به نام Component و loader
export async function loader() { ... }
export function Component() { ... }

// روتر
{ path: 'reports', lazy: () => import('./pages/ReportsPage') }
```

هر صفحه یک chunk جدا می‌شود و فقط هنگام نیاز دانلود می‌شود — بدون `React.lazy` و `Suspense` دستی.

## اسکرول و انتقال صفحه

```tsx nohead
import { ScrollRestoration } from 'react-router';
// در RootLayout: <ScrollRestoration /> موقعیت اسکرول را هنگام back/forward حفظ می‌کند

// انیمیشن انتقال با View Transitions API (جزئیات و Hero image در فصل ۳۲)
<Link to="/gallery" viewTransition>گالری</Link>
```

## گزینه جایگزین: TanStack Router

اگر type-safety کامل (پارامترها و search params تایپ‌شده در زمان کامپایل) اولویت است، **TanStack Router** انتخاب بسیار قوی و در حال رشدی است. API آن مفاهیم مشابه (loader، layout، lazy) دارد؛ مهارت شما قابل انتقال است.

:::project مینی‌بلاگ
سه صفحه بسازید: لیست پست‌ها (`/`)، جزئیات پست (`/posts/:id`) و ایجاد پست (`/posts/new`). از `loader` برای داده، `action` برای ایجاد، `errorElement` برای ۴۰۴، و `lazy` برای صفحه ایجاد استفاده کنید. API: `https://jsonplaceholder.typicode.com/posts`.
:::

:::interview
**Junior — تفاوت `<a href>` و `<Link to>` چیست؟** `<a>` صفحه را کامل بارگذاری مجدد می‌کند و state از بین می‌رود؛ `<Link>` با History API آدرس را عوض می‌کند و فقط کامپوننت‌های لازم رندر می‌شوند.

**Mid — loader چه مزیتی نسبت به fetch در `useEffect` دارد؟** موازی‌سازی خودکار برای مسیرهای تودرتو، شروع واکشی قبل از رندر (بدون آبشار)، مدیریت خطای یکپارچه با `errorElement`، revalidation خودکار پس از action، و امکان prefetch هنگام hover.

**Senior — حالت Data و Framework در React Router v8 چه تفاوتی دارند و کی به Framework مهاجرت کنیم؟** حالت Data روی کلاینت اجرا می‌شود (SPA) و همان مفاهیم loader/action را دارد. حالت Framework (میراث Remix) همین API را روی سرور اجرا می‌کند: SSR، Streaming، مسیرهای فایل‌محور، Server Actions و type-safety تولیدشده. مهاجرت وقتی توجیه دارد که SEO، TTFB یا کاهش JS کلاینت اولویت شود؛ چون API مشترک است، هزینه مهاجرت پایین است.
:::
