---
num: 26
part: 2
title: امنیت اپلیکیشن React
subtitle: XSS، احراز هویت و توکن‌ها، CSRF، CSP، وابستگی‌ها و آسیب‌پذیری‌های RSC
lead: React به‌طور پیش‌فرض در برابر XSS محافظت می‌کند، اما امنیت اپلیکیشن بسیار فراتر از آن است: کجا توکن را نگه داریم؟ چطور از CSRF جلوگیری کنیم؟ چه وابستگی‌هایی خطرناک‌اند؟ این فصل چک‌لیست عملی امنیت Front-End را ارائه می‌دهد.
---

## XSS — چیزی که React برایتان انجام می‌دهد و چیزی که نمی‌دهد

React همه مقادیر را در JSX **escape** می‌کند: `<p>{userInput}</p>` هرگز HTML اجرا نمی‌کند. اما چند در پشتی وجود دارد:

| خطر | مثال | راهکار |
|---|---|---|
| `dangerouslySetInnerHTML` | رندر HTML از CMS | پاک‌سازی با **DOMPurify** قبل از رندر |
| `href` با `javascript:` | `<a href={userUrl}>` | فقط `http(s):` مجاز؛ React 19 هشدار می‌دهد و در آینده بلاک می‌کند |
| ویژگی‌های event از داده | `<div {...userProps}>` | هرگز شیء کنترل‌نشده را spread نکنید |
| SVG/Markdown از کاربر | `<svg onload>` | DOMPurify با پروفایل SVG یا رندر امن Markdown |
| `eval`/`new Function` | تفسیر کد کاربر | ممنوع |

```tsx title="src/components/RichText.tsx"
import DOMPurify from 'dompurify';
import { useMemo } from 'react';

export function RichText({ html }: { html: string }) {
  const clean = useMemo(
    () => DOMPurify.sanitize(html, { USE_PROFILES: { html: true } }),
    [html],
  );
  return <div className="prose" dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

```ts title="src/lib/safeUrl.ts"
const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

export function safeHref(url: string, fallback = '#') {
  try {
    const u = new URL(url, window.location.origin);
    return SAFE_PROTOCOLS.includes(u.protocol) ? u.href : fallback;
  } catch {
    return fallback;
  }
}
```

## احراز هویت: توکن را کجا نگه داریم؟

:::cols
:::col bad ❌ localStorage
- هر اسکریپت (از جمله XSS و وابستگی آلوده) می‌تواند بخواند
- توکن سرقت‌شده تا انقضا معتبر است
- «راحت است» تنها مزیتش است
:::
:::col good ✅ کوکی httpOnly
- JavaScript **نمی‌تواند** بخواند → XSS نمی‌تواند سرقت کند
- `Secure` + `SameSite=Lax/Strict` → CSRF محدود
- مرورگر خودکار ارسال می‌کند (`credentials: 'include'`)
:::
:::

الگوی توصیه‌شده: **session cookie** (یا refresh token در کوکی httpOnly + access token کوتاه‌عمر در حافظه):

```ts title="src/features/auth/session.ts"
let accessToken: string | null = null; // فقط در حافظه؛ با رفرش صفحه پاک می‌شود

export async function refreshAccessToken() {
  const res = await fetch('/api/auth/refresh', {
    method: 'POST', credentials: 'include', // کوکی HttpOnly همراه درخواست می‌رود
  });
  if (!res.ok) throw new UnauthorizedError();
  accessToken = (await res.json()).accessToken;
  return accessToken;
}

export const getAccessToken = () => accessToken;
```

```ts title="src/lib/apiClient.ts (بخش auth)"
async function request<T>(
  path: string, init?: RequestInit, retry = true,
): Promise<T> {
  const res = await fetch(url(path), {
    ...init,
    credentials: 'include',
    headers: { ...init?.headers, Authorization: `Bearer ${getAccessToken() ?? ''}` },
  });
  if (res.status === 401 && retry) {
    await refreshAccessToken();          // یک بار تلاش مجدد
    return request<T>(path, init, false);
  }
  // ...
}
```

:::warn «محافظت مسیر» در کلاینت امنیت نیست
مخفی‌کردن دکمه «حذف» یا ریدایرکت کاربر غیرادمین در React فقط **UX** است. هر کسی می‌تواند با DevTools آن را دور بزند. **هر** بررسی مجوز باید در سرور تکرار شود. کلاینت را طوری بنویسید که انگار کاربر مهاجم است.
:::

## CSRF

اگر از کوکی برای session استفاده می‌کنید، مرورگر آن را با هر درخواست به دامنه شما می‌فرستد — حتی از سایت مهاجم. دفاع‌ها:

- `SameSite=Lax` (پیش‌فرض مرورگرهای مدرن) درخواست‌های POST cross-site را بدون کوکی می‌فرستد.
- **توکن CSRF** (double-submit cookie یا synchronizer) برای APIهای حساس؛ در header `X-CSRF-Token` ارسال کنید.
- بررسی header `Origin`/`Referer` در سرور.
- اگر API فقط با `Authorization: Bearer` (بدون کوکی) کار می‌کند، CSRF عملاً منتفی است.

## Content Security Policy (CSP)

CSP لایه دفاعی قدرتمندی است که حتی اگر XSS رخ دهد، اجرای اسکریپت inline و بارگذاری از دامنه‌های ناشناس را بلاک می‌کند:

```text title="HTTP header"
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{random}';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://cdn.example.com;
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
  base-uri 'self';
```

Vite در build خروجی بدون inline script تولید می‌کند (به‌جز اگر خودتان اضافه کنید)، پس `script-src 'self'` کافی است. اسکریپت تم inline (فصل ۱۷) به `nonce` نیاز دارد.

## امنیت وابستگی‌ها (Supply Chain)

```bash title="Terminal"
npm audit                           # آسیب‌پذیری‌های شناخته‌شده
npx npm-check-updates               # نسخه‌های قدیمی
npm ci                              # نصب دقیق از lockfile در CI
```

- **lockfile را commit کنید** و در CI از `npm ci` استفاده کنید.
- **Dependabot / Renovate** برای به‌روزرسانی خودکار با PR.
- پکیج‌های کم‌ستاره با دسترسی postinstall را بررسی کنید.
- **پین‌کردن نسخه** ابزارهای build (`--save-exact` برای `babel-plugin-react-compiler` توصیه رسمی است).

:::danger آسیب‌پذیری‌های React Server Components (۲۰۲۵–۲۰۲۶)
در دسامبر ۲۰۲۵ آسیب‌پذیری بحرانی **CVE-2025-55182** (معروف به React2Shell) در پکیج‌های `react-server-dom-*` کشف شد که اجرای کد از راه دور روی سرور را ممکن می‌کرد، و در ادامه چند مورد DoS و افشای سورس تا ژانویه ۲۰۲۶. اگر از RSC (Next.js App Router، React Router Framework، …) استفاده می‌کنید، حتماً روی **React 19.0.4 / 19.1.5 / 19.2.4 یا بالاتر** و آخرین نسخه فریم‌ورک باشید. SPAهای خالص (بدون RSC) تحت تأثیر نبودند. درس: به‌روزرسانی امنیتی را در همان هفته اعمال کنید.
:::

## اسرار و متغیرهای محیطی

- هر چیزی با پیشوند `VITE_` در باندل عمومی است — **هرگز** کلید خصوصی.
- کلیدهای «عمومی» (مثل Google Maps با محدودیت دامنه) قابل‌قبول‌اند اما محدودیت referrer/دامنه را در پنل سرویس فعال کنید.
- عملیات حساس (پرداخت، ارسال ایمیل، AI API) همیشه از طریق بک‌اند یا Server Function.

## چک‌لیست امنیت Front-End

- [ ] هیچ `dangerouslySetInnerHTML` بدون DOMPurify
- [ ] URLهای کاربر با `safeHref` فیلتر می‌شوند
- [ ] توکن در localStorage نیست؛ session با کوکی httpOnly/Secure/SameSite
- [ ] هر بررسی مجوز در سرور تکرار شده
- [ ] CSP فعال و بدون `unsafe-inline` برای script
- [ ] `npm audit` در CI بدون خطای high/critical
- [ ] React و فریم‌ورک روی نسخه‌های وصله‌شده
- [ ] هیچ secret در `VITE_*`
- [ ] فرم‌ها rate-limit سمت سرور دارند (کلاینت فقط debounce)
- [ ] هدرهای امنیتی: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`

:::interview
**Junior — React چطور از XSS جلوگیری می‌کند؟** با escape خودکار همه مقادیر داخل JSX؛ رشته `<script>` به‌صورت متن نمایش داده می‌شود نه اجرا. استثناها `dangerouslySetInnerHTML` و `href`های `javascript:` هستند.

**Mid — چرا ذخیره JWT در localStorage توصیه نمی‌شود و جایگزین چیست؟** هر XSS یا وابستگی آلوده می‌تواند آن را بخواند و به سرور مهاجم بفرستد. جایگزین: کوکی httpOnly (غیرقابل‌خواندن با JS) با `Secure` و `SameSite`، به‌همراه دفاع CSRF؛ یا access token کوتاه‌عمر فقط در حافظه + refresh token در کوکی httpOnly.

**Senior — CSP با nonce در یک SPA چطور پیاده می‌شود و چه چالش‌هایی دارد؟** سرور برای هر پاسخ HTML یک nonce تصادفی می‌سازد، در header CSP و روی هر `<script nonce>` قرار می‌دهد. چالش‌ها: با فایل `index.html` استاتیک (CDN) nonce ثابت می‌شود که بی‌معناست — باید HTML را در edge/سرور رندر کرد یا از hash به‌جای nonce استفاده کرد؛ کتابخانه‌هایی که style/script inline تزریق می‌کنند (بعضی CSS-in-JS، ابزارهای analytics) می‌شکنند و باید nonce به آن‌ها پاس داده شود؛ و `'strict-dynamic'` برای اجازه به اسکریپت‌های بارگذاری‌شده توسط اسکریپت معتبر لازم می‌شود.
:::
