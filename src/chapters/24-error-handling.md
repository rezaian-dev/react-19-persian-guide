---
num: 24
part: 2
title: مدیریت خطا — مرجع کامل
subtitle: Error Boundary، خطاهای async، گزینه‌های createRoot در React 19 و استراتژی چندلایه
lead: خطا اجتناب‌ناپذیر است؛ سؤال این است که کاربر صفحه سفید می‌بیند یا پیام مفید با دکمه «تلاش مجدد». این فصل یک استراتژی چندلایه برای مدیریت خطاهای رندر، async و رویداد ارائه می‌دهد و API‌های جدید React 19 برای گزارش خطا را معرفی می‌کند.
---

## انواع خطا در اپلیکیشن React

| نوع | مثال | چه کسی می‌گیرد؟ |
|---|---|---|
| **خطای رندر** | `user.name` وقتی `user` null است | Error Boundary |
| **خطای async در Action/Suspense** | reject شدن Promise در `use()` یا `<form action>` | Error Boundary |
| **خطای event handler** | `throw` داخل `onClick` | ❌ Error Boundary نمی‌گیرد؛ try/catch خودتان |
| **خطای Effect** | throw داخل `useEffect` | Error Boundary |
| **خطای شبکه** | 500 از API | کتابخانه داده / Boundary |
| **Promise رها‌شده** | `fetch().then()` بدون catch در handler | `window.onunhandledrejection` |

## Error Boundary

Error Boundary کامپوننتی است که خطای زیردرخت خود را می‌گیرد و UI جایگزین نشان می‌دهد. React هنوز نسخه هوکی ندارد؛ از `react-error-boundary` استفاده کنید:

```bash title="Terminal"
npm install react-error-boundary
```

```tsx title="src/components/ErrorFallback.tsx"
import type { FallbackProps } from 'react-error-boundary';

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const message = error instanceof Error ? error.message : 'خطای ناشناخته';
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-6 text-center"
    >
      <h2 className="text-lg font-bold text-red-700">مشکلی پیش آمد</h2>
      <p className="mt-2 text-sm text-red-600">{message}</p>
      <button
        onClick={resetErrorBoundary}
        className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white"
      >
        تلاش مجدد
      </button>
    </div>
  );
}
```

```tsx title="src/features/dashboard/Dashboard.tsx"
import { ErrorBoundary } from 'react-error-boundary';
import { QueryErrorResetBoundary } from '@tanstack/react-query';

export function Dashboard() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onReset={reset}                 // کش خطادار TanStack Query را پاک می‌کند
          onError={(err, info) => logError(err, info.componentStack)}
          resetKeys={[userId]}            // با تغییر کاربر خودکار ریست شود
        >
          <Suspense fallback={<Skeleton />}>
            <Stats />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
```

## استراتژی چندلایه (Granular Boundaries)

```text title="Error boundary layers"
<App>
 └─ ErrorBoundary (سراسری: «خطای غیرمنتظره» + reload)
     └─ RootLayout
         └─ ErrorBoundary (هر صفحه: errorElement روتر)
             └─ Page
                 ├─ ErrorBoundary (ویجت ۱) ─ Suspense ─ <Chart/>
                 └─ ErrorBoundary (ویجت ۲) ─ Suspense ─ <Feed/>
```

قاعده: **هر واحد مستقل UI که می‌تواند جداگانه شکست بخورد، مرز خودش را داشته باشد.** شکست نمودار فروش نباید فید اخبار را از بین ببرد. مرز سراسری فقط «آخرین خط دفاع» است.

## خطا در event handler

```tsx nohead
async function handleDelete() {
  try {
    await api.deleteItem(id);
    toast.success('حذف شد');
  } catch (e) {
    const forbidden = e instanceof ApiError && e.status === 403;
    toast.error(forbidden ? 'دسترسی ندارید' : 'حذف ناموفق بود');
    logError(e);
  }
}
```

Error Boundary خطای handler را نمی‌گیرد چون خارج از رندر است. **اما** اگر همان کار را داخل `startTransition(async () => ...)` یا `<form action>` انجام دهید، خطا به Boundary می‌رسد — یکی از مزایای Actions.

:::tip پرتاب عمدی به Boundary از handler
گاهی می‌خواهید خطای handler هم به Boundary برود (مثلاً session منقضی شده). با `useErrorBoundary` از `react-error-boundary`: `const { showBoundary } = useErrorBoundary(); ... catch (e) { showBoundary(e); }`.
:::

## گزینه‌های خطا در `createRoot` (React 19)

React 19 سه hook در سطح root اضافه کرد که برای لاگ‌کردن متمرکز ایده‌آل‌اند:

```tsx title="src/main.tsx"
createRoot(document.getElementById('root')!, {
  // خطایی که Boundary گرفت (قبلاً به console.error می‌رفت)
  onCaughtError(error, errorInfo) {
    monitoring.capture(error, { stack: errorInfo.componentStack, handled: true });
  },
  // خطایی که هیچ Boundary نگرفت و React درخت را unmount کرد
  onUncaughtError(error, errorInfo) {
    monitoring.capture(error, { stack: errorInfo.componentStack, handled: false });
  },
  // خطایی که React از آن بازیابی کرد (مثل hydration mismatch)
  onRecoverableError(error, errorInfo) {
    monitoring.capture(error, { level: 'warning' });
  },
}).render(<App />);
```

React 19 همچنین گزارش خطا را ساده کرد: به‌جای دو بار لاگ (یکی throw اصلی و یکی rethrow)، **یک پیام واحد** با تمام اطلاعات چاپ می‌شود.

## Owner Stack برای دیباگ (React 19.1)

```ts nohead
import { captureOwnerStack } from 'react';

// فقط در development: نشان می‌دهد کدام کامپوننت این کامپوننت را «رندر کرده»
// (نه فقط والد DOM) — برای رد‌گیری props اشتباه بسیار مفید
console.log(captureOwnerStack());
```

## خطاهای شبکه: الگوی نتیجه به‌جای throw

برای خطاهای «قابل‌انتظار» (اعتبارسنجی، ۴۰۴، دسترسی)، به‌جای throw یک شیء نتیجه برگردانید و در UI به‌درستی نمایش دهید. throw را برای خطاهای «غیرمنتظره» نگه دارید که Boundary باید بگیرد:

```ts title="src/lib/result.ts"
export type Result<T, E = string> = { ok: true; data: T } | { ok: false; error: E };

export async function safe<T>(p: Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await p };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'خطای ناشناخته' };
  }
}
```

## کلاس‌های خطای معنادار

```ts title="src/lib/errors.ts"
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status = 500,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
export class NotFoundError extends AppError {
  constructor(what = 'منبع') { super(`${what} یافت نشد`, 'NOT_FOUND', 404); }
}
export class UnauthorizedError extends AppError {
  constructor() { super('ابتدا وارد شوید', 'UNAUTHORIZED', 401); }
}
```

در Fallback بر اساس `error.code` تصمیم بگیرید: ۴۰۱ → ریدایرکت به لاگین، ۴۰۴ → صفحه «یافت نشد»، بقیه → پیام عمومی + تلاش مجدد.

## پایش در Production

| ابزار | ویژگی |
|---|---|
| **Sentry** | `@sentry/react` با `ErrorBoundary` داخلی، replay جلسه، source map |
| **Bugsnag / Rollbar** | مشابه؛ گاهی ساده‌تر |
| **OpenTelemetry** | استاندارد باز؛ برای تیم‌هایی که observability یکپارچه می‌خواهند |
| **`window.onerror` + endpoint خودتان** | حداقلی؛ برای پروژه‌های کوچک |

هرچه باشد، **source map** را آپلود کنید وگرنه stack trace کد minify‌شده بی‌فایده است.

:::danger اشتباه رایج: Boundary سراسری تنها
یک Boundary فقط دور `<App>` یعنی هر خطای کوچک، **کل اپ** را با صفحه خطا جایگزین می‌کند و همه state کاربر از بین می‌رود. Boundary‌ها را نزدیک محل احتمالی خطا بگذارید.
:::

:::interview
**Junior — Error Boundary چه خطاهایی را نمی‌گیرد؟** خطاهای event handler، کد async خارج از Actions/Suspense (مثل `setTimeout`)، خطاهای خودِ Boundary، و خطاهای SSR (در فریم‌ورک با مکانیزم خودش مدیریت می‌شود).

**Mid — چطور خطای یک query در TanStack Query را با Error Boundary و دکمه تلاش مجدد مدیریت می‌کنید؟** `useSuspenseQuery` (یا `throwOnError`) خطا را throw می‌کند تا Boundary بگیرد؛ `QueryErrorResetBoundary` تابع `reset` می‌دهد که در `onReset` صدا می‌زنیم تا کش خطادار پاک و query دوباره اجرا شود.

**Senior — تفاوت `onCaughtError`، `onUncaughtError` و `onRecoverableError` چیست و در پایش چه کاربردی دارند؟** Caught: خطایی که Boundary گرفت — severity متوسط، UI بازیابی شده. Uncaught: هیچ Boundary نبود، React root را unmount کرد — severity بحرانی، باید alert بزند. Recoverable: React خودش بازیابی کرد (مثل hydration mismatch که با رندر کلاینت جبران شد) — هشدار برای کیفیت، نه incident. جداسازی این سه در dashboard پایش، نویز را کم و اولویت‌بندی را دقیق می‌کند.
:::
