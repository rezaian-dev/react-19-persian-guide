---
num: 21
part: 2
title: معماری پروژه و Clean Code در React
subtitle: ساختار feature-based، لایه‌بندی، مرزهای ماژول و اصول کد تمیز
lead: اپلیکیشنی که در هفته اول خوب کار می‌کند، در ماه ششم ممکن است غیرقابل‌نگهداری شود — نه به‌خاطر React، بلکه به‌خاطر نبود معماری. این فصل ساختار پوشه‌ها، لایه‌بندی و اصولی را آموزش می‌دهد که پروژه را در مقیاس زنده نگه می‌دارد.
---

## مشکل ساختار «بر اساس نوع»

```text title="❌ Type-based"
src/
├── components/     # ۱۲۰ فایل!
├── hooks/          # ۴۰ فایل
├── utils/
├── contexts/
└── pages/
```

با رشد پروژه، یافتن «همه‌چیز مربوط به سبد خرید» یعنی جستجو در پنج پوشه. تغییر یک فیچر، فایل‌های پراکنده را لمس می‌کند و حذف فیچر تقریباً غیرممکن است.

## ساختار feature-based (توصیه‌شده)

```text title="✅ Feature-based"
src/
├── app/                      # راه‌اندازی: router.tsx، providers.tsx، layouts/
├── features/                 # هر فیچر: خودکفا و قابل‌حذف
│   ├── auth/
│   │   ├── api/              # توابع fetch و query options
│   │   ├── components/       # LoginForm, UserMenu
│   │   ├── hooks/            # useSession
│   │   ├── stores/           # (در صورت نیاز)
│   │   ├── types.ts
│   │   └── index.ts          # 🚪 API عمومی فیچر
│   ├── cart/
│   └── products/
├── components/               # UI عمومی و بدون منطق دامنه
│   ├── ui/                   # Button, Input, Dialog (shadcn)
│   └── layout/               # Container, PageHeader
├── hooks/                    # هوک‌های عمومی (useMediaQuery, useDebounce)
├── lib/                      # ابزارهای زیرساختی: apiClient, cn, formatters
├── config/                   # ثابت‌ها، env
└── types/                    # تایپ‌های سراسری
```

قاعده: **کد داخل هر feature فقط از خودش، از `components/ui`، `hooks`، `lib` و `types` import می‌کند** — نه از فیچر دیگر به‌صورت مستقیم. ارتباط بین فیچرها از طریق `index.ts` (API عمومی) یا در لایه `app` انجام می‌شود.

```ts title="src/features/cart/index.ts"
// فقط چیزهایی که بیرون فیچر لازم است
export { CartBadge } from './components/CartBadge';
export { useCartStore } from './stores/cartStore';
export type { CartItem } from './types';
```

:::tip اعمال مرزها با ESLint
با `eslint-plugin-boundaries` یا قانون `no-restricted-imports` جلوی import مستقیم `features/cart/components/...` از داخل `features/products` را بگیرید. معماری که ابزار آن را اعمال نکند، در اولین deadline فراموش می‌شود.
:::

## لایه‌بندی درون یک فیچر

<div class="flow">
<div class="box"><b>UI</b>کامپوننت‌های نمایشی؛ props می‌گیرند، JSX می‌دهند</div>
<span class="arrow">→</span>
<div class="box"><b>Hooks</b>منطق stateful و ترکیب queryها</div>
<span class="arrow">→</span>
<div class="box"><b>API / Services</b>fetch، تبدیل داده، اعتبارسنجی پاسخ</div>
<span class="arrow">→</span>
<div class="box"><b>Types</b>مدل‌های دامنه</div>
</div>

```ts title="src/features/products/api/products.api.ts"
import { apiClient } from '@/lib/apiClient';
import { queryOptions } from '@tanstack/react-query';
import { productSchema, type Product } from '../types';

async function fetchProducts(category: string): Promise<Product[]> {
  const data = await apiClient.get(`/products?category=${category}`);
  return productSchema.array().parse(data); // اعتبارسنجی مرز سیستم
}

// query options قابل‌استفاده در loader، کامپوننت و prefetch
export const productsQuery = (category: string) =>
  queryOptions({
    queryKey: ['products', category],
    queryFn: () => fetchProducts(category),
  });
```

```tsx title="src/features/products/components/ProductList.tsx"
export function ProductList({ category }: { category: string }) {
  const { data } = useSuspenseQuery(productsQuery(category));
  return <ProductGrid products={data} />;   // ProductGrid: کاملاً نمایشی
}
```

## کلاینت API متمرکز

```ts title="src/lib/apiClient.ts"
import { API_URL } from '@/config/env';

class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    credentials: 'include',
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.status === 204 ? (undefined as T) : res.json();
}

export const apiClient = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, body: unknown) =>
    request<T>(p, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(p: string, body: unknown) =>
    request<T>(p, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(p: string) => request<T>(p, { method: 'DELETE' }),
};
```

یک نقطه برای auth header، مدیریت خطا، لاگ و retry. هرگز `fetch` خام در کامپوننت ننویسید.

## اصول کد تمیز در React

| اصل | در عمل |
|---|---|
| **کامپوننت کوچک** | بیش از ~۱۵۰ خط یا بیش از ۳ مسئولیت → بشکنید |
| **جداسازی منطق از نما** | منطق در هوک سفارشی، نما در کامپوننت |
| **نام‌گذاری گویا** | `UserAvatarWithStatus` بهتر از `Avatar2` |
| **Props کم** | بیش از ۷ prop نشانه کامپوننت چندمنظوره است → ترکیب |
| **Early return** | حالت‌های خالی/خطا/loading اول، مسیر اصلی آخر |
| **بدون magic number/string** | `const MAX_UPLOAD_MB = 5` در `config/` |
| **Colocation** | تست، استایل و تایپ کنار فایل استفاده‌کننده |
| **حذف کد مرده** | کامنت‌شده = حذف‌شده؛ git تاریخچه دارد |

### مثال ری‌فکتور: از کامپوننت شلوغ به لایه‌بندی

:::cols
:::col bad ❌ قبل
```tsx nohead
function UserPage({ id }) {
  const [user, setUser] = useState();
  const [loading, setLoading] =
    useState(true);
  const [err, setErr] = useState();
  useEffect(() => {
    fetch('/api/users/' + id)
      .then(r => r.json())
      .then(setUser)
      .catch(setErr)
      .finally(() => setLoading(false));
  }, [id]);
  if (loading) return <Spinner/>;
  if (err) return <p>خطا</p>;
  return <div>{/* ۸۰ خط JSX */}</div>;
}
```
:::
:::col good ✅ بعد
```tsx nohead
// api/users.api.ts
export const userQuery = (id) =>
  queryOptions({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id),
  });

// components/UserPage.tsx
function UserPage({ id }) {
  const { data: user } =
    useSuspenseQuery(userQuery(id));
  return <UserProfile user={user} />;
}
// ErrorBoundary + Suspense در layout
```
:::
:::

## قراردادهای نام‌گذاری فایل

| نوع | قرارداد | مثال |
|---|---|---|
| کامپوننت | PascalCase | `ProductCard.tsx` |
| هوک | camelCase با use | `useCart.ts` |
| ابزار / سرویس | camelCase یا dot-suffix | `formatPrice.ts`، `products.api.ts` |
| تایپ | `types.ts` در هر فیچر | — |
| تست | کنار فایل با `.test` | `ProductCard.test.tsx` |
| ثابت‌ها | UPPER_SNAKE در فایل | `MAX_ITEMS` |

## ابزارهای کیفیت کد

```json title="package.json (scripts)"
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint . --max-warnings 0",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "prepare": "husky"
  }
}
```

با **husky + lint-staged** قبل از هر commit، lint و format روی فایل‌های تغییریافته اجرا شود؛ کد بد اصلاً وارد مخزن نمی‌شود.

:::interview
**Junior — چرا ساختار feature-based بهتر از type-based است؟** چون کدی که با هم تغییر می‌کند کنار هم است (cohesion بالا)، حذف یا استخراج فیچر ساده است، و onboarding سریع‌تر می‌شود چون هر فیچر یک نقشه کوچک دارد.

**Mid — «Presentational vs Container» هنوز معتبر است؟** ایده اصلی (جدایی منطق از نما) معتبر است اما پیاده‌سازی تغییر کرده: به‌جای کامپوننت Container، **هوک سفارشی** منطق را نگه می‌دارد و کامپوننت نما آن را مصرف می‌کند. این الگو تست‌پذیری بهتری دارد.

**Senior — چطور معماری را در برابر فرسایش (architecture erosion) محافظت می‌کنید؟** با تبدیل قواعد به ابزار: ESLint برای مرزهای import، TypeScript strict برای قراردادها، `index.ts` به‌عنوان API عمومی، تست‌های معماری (مثل dependency-cruiser)، بازبینی کد با چک‌لیست، و ADR (Architecture Decision Records) برای ثبت «چرا»ها تا تصمیم‌ها با رفتن افراد گم نشوند.
:::
