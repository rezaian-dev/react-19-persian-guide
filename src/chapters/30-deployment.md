---
num: 30
part: 2
title: Build، استقرار و Web Vitals
subtitle: بهینه‌سازی باندل، Docker و Nginx، CI/CD، Core Web Vitals و پایش
lead: کد خوب فقط نیمی از راه است؛ باید سریع، پایدار و قابل‌مشاهده به دست کاربر برسد. این فصل از تحلیل باندل شروع می‌کند، استقرار روی CDN و سرور خودی را پوشش می‌دهد و با معیارهای Core Web Vitals و پایش تمام می‌شود.
---

## Build بهینه با Vite

```bash title="Terminal"
npm run build          # خروجی در dist/ با hash و code splitting
npm run preview        # تست محلی خروجی
npx vite-bundle-visualizer   # نقشه باندل: چه چیزی چقدر جا گرفته
```

```ts title="vite.config.ts"
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  build: {
    target: 'es2022',
    sourcemap: 'hidden',               // برای Sentry؛ در سرور عمومی سرو نشود
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
});
```

## کاهش حجم باندل

| تکنیک | اثر |
|---|---|
| **Code splitting به‌ازای مسیر** (`lazy` در روتر) | کاربر فقط JS صفحه فعلی را می‌گیرد |
| **`React.lazy` برای کامپوننت‌های سنگین** | نمودار، ویرایشگر، نقشه فقط در صورت نیاز |
| **import انتخابی** | `import { debounce } from 'lodash-es'` نه `import _ from 'lodash'` |
| **جایگزینی وابستگی‌های سنگین** | `date-fns` به‌جای `moment`؛ `Intl` به‌جای هر دو |
| **حذف polyfillهای غیرضروری** | target مدرن؛ `browserslist` واقع‌بینانه |
| **تصاویر** | WebP/AVIF، `loading="lazy"`، `srcset`، CDN تصویر |
| **فونت** | فونت متغیر، subset فارسی، `font-display: swap`، preload |

```tsx nohead
import { lazy, Suspense } from 'react';
const Chart = lazy(() => import('./Chart'));  // chunk جدا

<Suspense fallback={<ChartSkeleton />}>
  <Chart data={data} />
</Suspense>
```

:::tip بودجه کارایی
یک عدد تعیین کنید (مثلاً JS اولیه < ۲۰۰KB gzip) و در CI با `size-limit` یا `bundlesize` اجبار کنید. بدون بودجه، باندل هر ماه ۱۰٪ بزرگ‌تر می‌شود.
:::

## Core Web Vitals

| معیار | چه چیزی را می‌سنجد | هدف | راهکار React |
|---|---|---|---|
| **LCP** (Largest Contentful Paint) | سرعت نمایش بزرگ‌ترین عنصر | < ۲.۵s | SSR/SSG، preload تصویر hero، حذف render-blocking، code splitting |
| **INP** (Interaction to Next Paint) | تأخیر پاسخ به تعامل | < ۲۰۰ms | `startTransition`، شکستن کار سنگین، virtualization، React Compiler |
| **CLS** (Cumulative Layout Shift) | پرش‌های چیدمان | < ۰.۱ | ابعاد صریح تصاویر، Skeleton هم‌اندازه، `font-display` درست |

اندازه‌گیری: Lighthouse (آزمایشگاهی)، Chrome UX Report و `web-vitals` (کاربران واقعی):

```ts title="src/lib/vitals.ts"
import { onCLS, onINP, onLCP } from 'web-vitals';

function send(metric: { name: string; value: number; id: string }) {
  navigator.sendBeacon('/api/vitals', JSON.stringify(metric));
}
onCLS(send); onINP(send); onLCP(send);
```

## استقرار SPA روی CDN / هاست استاتیک

SPA فقط فایل استاتیک است؛ هر جایی قابل‌سرو است. **یک قاعده حیاتی:** همه مسیرها باید به `index.html` برگردند (SPA fallback) وگرنه رفرش روی `/products/42` خطای ۴۰۴ می‌دهد.

| پلتفرم | پیکربندی fallback |
|---|---|
| **Vercel** | خودکار برای Vite؛ یا `vercel.json` با `rewrites` |
| **Netlify** | فایل `_redirects`: `/* /index.html 200` |
| **Cloudflare Pages** | خودکار (SPA mode) |
| **GitHub Pages** | ترفند `404.html` یا HashRouter |
| **هاست اشتراکی (cPanel)** | `.htaccess` با `RewriteRule` |
| **Nginx / Docker** | `try_files $uri /index.html` (پایین) |

## استقرار با Docker + Nginx

```dockerfile title="Dockerfile"
# مرحله ۱: build
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# مرحله ۲: سرو استاتیک
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

پیکربندی Nginx سه کار دارد: کش تهاجمی برای فایل‌های hash‌دار، «هرگز کش نشود» برای `index.html` و fallback مسیرهای SPA:

```nginx title="nginx.conf (1/2)"
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  # فایل‌های hash‌دار: کش طولانی
  location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
  }

  # index.html: هرگز کش نشود تا نسخه جدید فوراً دیده شود
  location = /index.html {
    add_header Cache-Control "no-cache";
  }

  # SPA fallback
  location / {
    try_files $uri $uri/ /index.html;
  }
```

و در ادامه‌ی همان بلوک `server`، فشرده‌سازی و هدرهای امنیتی پایه (CSP کامل را در فصل ۲۶ دیدید):

```nginx title="nginx.conf (2/2)"
  # فشرده‌سازی
  gzip on;
  gzip_types text/css application/javascript application/json image/svg+xml;

  # هدرهای امنیتی
  add_header X-Content-Type-Options nosniff;
  add_header Referrer-Policy strict-origin-when-cross-origin;
  add_header X-Frame-Options DENY;
}
```

```bash title="Terminal"
docker build --build-arg VITE_API_URL=https://api.example.com -t my-app .
docker run -p 8080:80 my-app
```

:::warn متغیرهای محیطی در زمان build
در SPA، `VITE_*` هنگام **build** در کد جای‌گذاری می‌شود، نه در زمان اجرا. برای یک image با چند محیط (staging/prod)، یا برای هر محیط جداگانه build کنید، یا الگوی «config در runtime» را پیاده کنید: یک `config.js` که Nginx سرو می‌کند و در `index.html` قبل از اپ لود می‌شود.
:::

## CI/CD با GitHub Actions

```yaml title=".github/workflows/ci.yml"
name: CI
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -- --run --coverage
      - run: npm run build
      - name: E2E
        run: npx playwright install --with-deps chromium && npx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: playwright-report, path: playwright-report }
```

خط لوله: lint → typecheck → unit/component → build → E2E. هر کدام شکست بخورد، merge نمی‌شود.

## استراتژی کش و نسخه‌بندی

Vite نام فایل‌های `assets/` را با hash محتوا می‌سازد (`index-a1b2c3.js`). بنابراین:

- `assets/*` → `Cache-Control: immutable, max-age=1y` (تغییر محتوا = نام جدید)
- `index.html` → `no-cache` (همیشه تازه؛ به فایل‌های جدید اشاره می‌کند)

:::danger باگ «chunk قدیمی» پس از deploy
کاربری که تب باز دارد، پس از deploy جدید روی لینکی کلیک می‌کند که chunk قدیمی (حذف‌شده) را lazy-load می‌کند → خطای `Failed to fetch dynamically imported module`. راه‌حل‌ها: (۱) نگه‌داشتن چند نسخه قبلی `assets/` روی سرور؛ (۲) گوش‌دادن به رویداد `vite:preloadError` و reload صفحه؛ (۳) Error Boundary که در این خطا `location.reload()` می‌کند. ساده‌ترین نسخه‌ی راه‌حل (۲) در `main.tsx`:
```ts nohead
window.addEventListener('vite:preloadError', () => window.location.reload());
```
:::

## پایش در Production

| لایه | ابزار |
|---|---|
| خطاها | Sentry / Bugsnag با source map |
| کارایی واقعی (RUM) | web-vitals → endpoint خودتان یا Vercel Analytics / SpeedCurve |
| رفتار کاربر | PostHog / Plausible (حریم‌خصوصی‌محور) |
| در دسترس بودن | UptimeRobot / Better Stack |
| لاگ سرور (اگر دارید) | Grafana Loki / Datadog |

## چک‌لیست پیش از انتشار

- [ ] `npm run build` بدون هشدار؛ حجم باندل داخل بودجه
- [ ] SPA fallback پیکربندی شده؛ رفرش روی مسیر عمیق کار می‌کند
- [ ] هدرهای کش درست (`immutable` برای assets، `no-cache` برای HTML)
- [ ] HTTPS، هدرهای امنیتی، CSP
- [ ] Error Boundary سراسری + Sentry با source map
- [ ] Lighthouse ≥ ۹۰ در Performance و Accessibility روی موبایل
- [ ] `robots.txt`، `favicon`، `manifest.json`، `<meta viewport>`
- [ ] متغیرهای محیطی Production جدا از dev؛ هیچ secret در باندل
- [ ] `vite:preloadError` handle شده
- [ ] تست E2E جریان‌های حیاتی سبز است

:::interview
**Junior — چرا رفرش روی `/products/42` در SPA خطای ۴۰۴ می‌دهد و چطور حل می‌شود؟** چون سرور فایلی به آن نام ندارد؛ روتینگ در کلاینت انجام می‌شود. سرور باید همه مسیرهای ناشناخته را به `index.html` برگرداند تا React Router مسیر را مدیریت کند.

**Mid — INP چیست و در React چطور بهبود می‌یابد؟** زمان از تعامل کاربر تا نقاشی فریم بعدی. راهکارها: به‌روزرسانی‌های سنگین را با `startTransition` غیرفوری کنید، کار طولانی را بشکنید، لیست‌های بزرگ را virtualize کنید، از React Compiler برای حذف رندرهای اضافه استفاده کنید، و کار غیرضروری را از event handler به بعد از paint منتقل کنید.

**Senior — استراتژی استقرار بدون downtime و بدون شکستن کاربران فعال برای SPA چیست؟** (۱) assets با hash و کش immutable، HTML بدون کش؛ (۲) نگه‌داشتن N نسخه قبلی assets تا کاربران با تب باز chunkها را پیدا کنند؛ (۳) handler برای `vite:preloadError` و reload نرم؛ (۴) اعلان «نسخه جدید موجود است» با بررسی دوره‌ای `version.json`؛ (۵) استقرار atomic (پوشه جدید + تعویض symlink یا deploy immutable در CDN) تا حالت نیمه‌کاره وجود نداشته باشد؛ (۶) سازگاری API با نسخه قبلی کلاینت حداقل برای یک دوره.
:::
