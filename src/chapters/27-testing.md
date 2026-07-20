---
num: 27
part: 2
title: تست‌نویسی: Vitest، Testing Library و Playwright
subtitle: هرم تست، تست کامپوننت با رفتار کاربر، mock کردن شبکه با MSW و تست E2E
lead: تست‌ها به شما اجازه می‌دهند با اطمینان ری‌فکتور کنید و باگ‌ها را قبل از کاربر بگیرید. فلسفه مدرن تست React ساده است: «تست‌هایتان باید شبیه استفاده کاربر از نرم‌افزار باشد». این فصل ابزارها و الگوهای آن را آموزش می‌دهد.
---

## هرم تست در Front-End

<div class="flow">
<div class="box"><b>Unit</b>توابع خالص، reducer، هوک — سریع و زیاد (Vitest)</div>
<span class="arrow">→</span>
<div class="box"><b>Component</b>کامپوننت در DOM شبیه‌سازی‌شده با تعامل کاربر (Testing Library)</div>
<span class="arrow">→</span>
<div class="box"><b>E2E</b>جریان کامل در مرورگر واقعی — کم و حیاتی (Playwright)</div>
</div>

## راه‌اندازی Vitest + Testing Library

```bash title="Terminal"
npm install -D vitest jsdom @testing-library/react \
  @testing-library/user-event @testing-library/jest-dom
```

```ts title="vite.config.ts"
/// <reference types="vitest/config" />
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false,
  },
});
```

```ts title="src/test/setup.ts"
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup());
```

## تست کامپوننت: رفتار، نه پیاده‌سازی

```tsx title="src/features/counter/Counter.test.tsx"
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Counter } from './Counter';

describe('Counter', () => {
  it('با کلیک افزایش می‌یابد', async () => {
    const user = userEvent.setup();
    render(<Counter />);

    const button = screen.getByRole('button', { name: /افزایش/ });
    await user.click(button);
    await user.click(button);

    expect(screen.getByText('تعداد: ۲')).toBeInTheDocument();
  });

  it('در صفر دکمه کاهش غیرفعال است', () => {
    render(<Counter />);
    expect(screen.getByRole('button', { name: /کاهش/ })).toBeDisabled();
  });
});
```

### اولویت انتخاب‌گرها (query priority)

| اولویت | Query | چرا |
|---|---|---|
| ۱ | `getByRole('button', { name })` | همان‌طور که screen reader می‌بیند؛ دسترسی‌پذیری را هم تست می‌کند |
| ۲ | `getByLabelText` | فرم‌ها |
| ۳ | `getByPlaceholderText`، `getByText` | متن قابل‌مشاهده |
| ۴ | `getByDisplayValue` | مقدار فعلی input |
| آخر | `getByTestId` | فقط وقتی هیچ راه معنایی نیست |

:::danger تست پیاده‌سازی نکنید
`expect(setState).toHaveBeenCalled()`، بررسی نام کلاس CSS، یا تست state داخلی یعنی با هر ری‌فکتور تست می‌شکند بدون این‌که باگی وجود داشته باشد. فقط چیزی را تست کنید که کاربر می‌بیند یا انجام می‌دهد.
:::

## تست فرم با Actions

```tsx title="src/features/auth/LoginForm.test.tsx"
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

it('خطای ایمیل نامعتبر را نشان می‌دهد', async () => {
  const user = userEvent.setup();
  render(<LoginForm />);

  await user.type(screen.getByLabelText('ایمیل'), 'not-an-email');
  await user.type(screen.getByLabelText('رمز عبور'), '12345678');
  await user.click(screen.getByRole('button', { name: 'ورود' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('ایمیل معتبر نیست');
});

it('هنگام ارسال دکمه غیرفعال می‌شود', async () => {
  const user = userEvent.setup();
  render(<LoginForm />);
  await user.type(screen.getByLabelText('ایمیل'), 'a@b.com');
  await user.type(screen.getByLabelText('رمز عبور'), '12345678');
  await user.click(screen.getByRole('button', { name: 'ورود' }));

  expect(screen.getByRole('button', { name: /در حال/ })).toBeDisabled();
  await waitFor(() =>
    expect(screen.queryByRole('button', { name: /در حال/ })).not.toBeInTheDocument(),
  );
});
```

`findBy*` منتظر ظاهر‌شدن عنصر می‌ماند (تا ۱ ثانیه) — برای Suspense و Actions ضروری است.

## Mock شبکه با MSW

به‌جای mock کردن `fetch` یا `axios`، شبکه را در سطح **درخواست** شبیه‌سازی کنید؛ کد اپ بدون تغییر اجرا می‌شود:

```bash title="Terminal"
npm install -D msw
```

```ts title="src/test/handlers.ts"
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/products', () =>
    HttpResponse.json([{ id: '1', title: 'کتاب React', price: 250000 }]),
  ),
  http.post('/api/login', async ({ request }) => {
    const body = (await request.json()) as { email: string };
    if (!body.email.includes('@')) {
      return HttpResponse.json({ error: 'ایمیل معتبر نیست' }, { status: 400 });
    }
    return HttpResponse.json({ token: 'fake' });
  }),
];
```

```ts title="src/test/setup.ts (افزوده)"
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

```tsx nohead
// override در یک تست خاص
server.use(http.get('/api/products', () => HttpResponse.error()));
render(<ProductList />, { wrapper: Providers });
expect(await screen.findByRole('alert')).toHaveTextContent('مشکلی پیش آمد');
```

MSW در مرورگر هم کار می‌کند (Service Worker) — برای توسعه بدون بک‌اند و Storybook.

## Wrapper برای Providerها

```tsx title="src/test/utils.tsx"
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';

type Options = RenderOptions & { route?: string };

export function renderWithProviders(
  ui: ReactNode,
  { route = '/', ...options }: Options = {},
) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
    options,
  );
}
```

## تست هوک سفارشی

```ts title="src/hooks/useDebouncedValue.test.ts"
import { renderHook, act } from '@testing-library/react';
import { useDebouncedValue } from './useDebouncedValue';

it('مقدار را با تأخیر به‌روز می‌کند', () => {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 300), {
    initialProps: { v: 'a' },
  });

  rerender({ v: 'ab' });
  expect(result.current).toBe('a');

  act(() => vi.advanceTimersByTime(300));
  expect(result.current).toBe('ab');
  vi.useRealTimers();
});
```

## تست E2E با Playwright

```bash title="Terminal"
npm init playwright@latest
```

```ts title="e2e/checkout.spec.ts"
import { test, expect } from '@playwright/test';

test('کاربر می‌تواند محصول را به سبد اضافه کند و پرداخت کند', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'کتاب React' }).click();
  await page.getByRole('button', { name: 'افزودن به سبد' }).click();
  await expect(page.getByTestId('cart-badge')).toHaveText('1');

  await page.getByRole('link', { name: 'سبد خرید' }).click();
  await page.getByRole('button', { name: 'پرداخت' }).click();
  await expect(page).toHaveURL(/\/checkout\/success/);
  await expect(page.getByRole('heading', { name: 'سفارش ثبت شد' })).toBeVisible();
});
```

Playwright روی Chromium، Firefox و WebKit اجرا می‌شود، trace و ویدئو ضبط می‌کند و در CI پایدار است. فقط **جریان‌های حیاتی** (ثبت‌نام، خرید، جستجو) را E2E کنید؛ بقیه را با تست کامپوننت.

## چه چیزی را تست کنیم؟

| اولویت بالا ✅ | اولویت پایین ⬇ |
|---|---|
| منطق کسب‌وکار (reducer، محاسبات قیمت) | کامپوننت‌های صرفاً نمایشی |
| فرم‌ها و اعتبارسنجی | استایل و layout |
| جریان‌های حیاتی کاربر (E2E) | کد third-party |
| مدیریت خطا و حالت‌های لبه | getter/setter ساده |
| هوک‌های سفارشی با منطق | wrapper نازک |

:::tip Coverage عدد جادویی نیست
۱۰۰٪ coverage یعنی هر خط اجرا شده، نه این‌که درست کار می‌کند. هدف واقع‌بینانه: ۷۰–۸۰٪ با تمرکز روی منطق مهم. تست‌های خوب **با اعتماد ری‌فکتور** را ممکن می‌کنند؛ این معیار موفقیت است.
:::

:::interview
**Junior — چرا Testing Library به‌جای دسترسی به state کامپوننت، DOM را بررسی می‌کند؟** چون کاربر state را نمی‌بیند؛ DOM را می‌بیند. تست بر اساس خروجی قابل‌مشاهده، با ری‌فکتور داخلی نمی‌شکند و دسترسی‌پذیری را هم ضمناً بررسی می‌کند.

**Mid — MSW چه مزیتی نسبت به `vi.mock('./api')` دارد؟** کد واقعی fetch/apiClient اجرا می‌شود (شامل header، serialization، مدیریت خطا)، mockها بین تست، Storybook و توسعه مشترک‌اند، و تست به ساختار داخلی ماژول API وابسته نیست.

**Senior — استراتژی تست برای اپلیکیشنی با Suspense، transitions و Optimistic UI چیست؟** تست‌های کامپوننت باید async-aware باشند: `findBy*` و `waitFor` برای Suspense، `act` برای transitions، و بررسی هر دو حالت خوش‌بینانه و نهایی. MSW با `delay()` برای شبیه‌سازی تأخیر و خطا. برای رفتارهای وابسته به زمان از fake timers. E2E با Playwright برای اطمینان از این‌که ترکیب واقعی (شبکه واقعی، مرورگر واقعی) کار می‌کند — چون jsdom برخی APIها (layout، IntersectionObserver) را ندارد.
:::
