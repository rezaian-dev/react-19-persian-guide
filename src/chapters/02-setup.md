---
num: 02
part: 1
title: شروع به کار و ساختار پروژه
subtitle: نصب با Vite، ساختار فولدرها، ابزارهای توسعه و اولین کامپوننت
lead: در این فصل یک پروژه React 19 + TypeScript را با Vite می‌سازیم، آناتومی فایل‌ها را می‌فهمیم و ابزارهایی که هر توسعه‌دهنده حرفه‌ای باید نصب داشته باشد را راه‌اندازی می‌کنیم.
---

## چرا Vite؟

سال‌ها `create-react-app` ابزار رسمی شروع پروژه بود، اما در سال ۲۰۲۵ به‌طور رسمی بازنشسته شد. امروز **Vite** استاندارد صنعت برای پروژه‌های React خالص است: شروع سرد زیر یک ثانیه، HMR فوری و خروجی بهینه. نسخه ۸ Vite (مارس ۲۰۲۶) با باندلر Rust-محورِ **Rolldown** عرضه شد و سرعت build را چند برابر کرد.

```bash title="Terminal"
# ساخت پروژه با قالب React + TypeScript
npm create vite@latest my-app -- --template react-ts

cd my-app
npm install
npm run dev
```

پس از اجرا، آدرس `http://localhost:5173` را در مرورگر باز کنید.

:::tip انتخاب پکیج‌منیجر
`npm` کاملاً کافی است، اما در پروژه‌های تیمی `pnpm` (سریع‌تر، فضای دیسک کمتر) رایج‌تر شده است: `pnpm create vite my-app --template react-ts`. در طول کتاب از npm استفاده می‌کنیم؛ دستورات معادل pnpm/yarn/bun تقریباً یکسان‌اند.
:::

## دستورهای اصلی

| دستور | کاربرد |
|---|---|
| `npm run dev` | سرور توسعه با HMR |
| `npm run build` | ساخت نسخه بهینه Production در پوشه `dist/` |
| `npm run preview` | اجرای محلی خروجی build برای تست نهایی |
| `npx tsc --noEmit` | بررسی صحت تایپ‌ها بدون تولید فایل |
| `npm run lint` | اجرای linter قالب (oxlint) — یا ESLint اگر آن را نصب کنید (بخش بعد) |

## آناتومی پروژه

```text title="Project structure"
my-app/
├── index.html           # 🚪 نقطه ورود واقعی؛ Vite از اینجا شروع می‌کند
├── public/              # 🖼️ فایل‌های استاتیک (همان‌طور که هست سرو می‌شوند)
├── src/
│   ├── main.tsx         # ⚛️ اتصال React به DOM (createRoot)
│   ├── App.tsx          # 🏠 کامپوننت ریشه
│   ├── index.css        # 🎨 استایل سراسری
│   └── assets/          # 📦 تصاویر و فایل‌هایی که باندل می‌شوند
├── vite.config.ts       # ⚙️ پیکربندی Vite و پلاگین‌ها
├── tsconfig.json        # 🧩 پیکربندی TypeScript
├── .oxlintrc.json       # 🔍 قوانین Lint (oxlint؛ rules-of-hooks)
└── package.json
```

قلب اپلیکیشن دو فایل است. اول `index.html` که برخلاف ابزارهای قدیمی، در ریشه پروژه قرار دارد و Vite آن را نقطه شروع می‌داند:

```html title="index.html"
<!doctype html>
<html lang="fa" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

و دوم `main.tsx` که React را به آن `div` متصل می‌کند:

```tsx title="src/main.tsx"
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

:::note StrictMode چیست؟
`<StrictMode>` فقط در حالت توسعه فعال است و کامپوننت‌ها را **دو بار** رندر می‌کند و Effectها را دو بار اجرا می‌کند تا باگ‌های ناشی از ناخالصی (impure render) یا cleanup فراموش‌شده را زودتر آشکار کند. در Production هیچ اثری ندارد. **هرگز آن را برای «رفع» باگ حذف نکنید**؛ باگ را رفع کنید.
:::

## اولین کامپوننت

فایل `App.tsx` را با این محتوا جایگزین کنید:

```tsx title="src/App.tsx"
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>تعداد کلیک: {count}</button>
  );
}

export default function App() {
  return (
    <main>
      <h1>سلام React 19! 👋</h1>
      <Counter />
    </main>
  );
}
```

مرورگر بدون رفرش به‌روز می‌شود؛ این همان **Hot Module Replacement** است. سه چیز را از همین حالا به خاطر بسپارید: نام کامپوننت با حرف بزرگ شروع می‌شود، هر کامپوننت یک تابع است که JSX برمی‌گرداند، و state با `useState` تعریف می‌شود.

## پیکربندی Vite و فعال‌کردن React Compiler

React Compiler در نسخه ۱.۰ (اکتبر ۲۰۲۵) پایدار شد و memoization را خودکار می‌کند. در قالب پیش‌فرض Vite به‌دلیل تأثیر جزئی روی سرعت build غیرفعال است؛ برای پروژه واقعی توصیه می‌کنیم فعالش کنید:

```bash title="Terminal"
npm install -D babel-plugin-react-compiler@latest @rolldown/plugin-babel
```

```ts title="vite.config.ts"
import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  resolve: {
    // import Button from '@/components/Button'
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
```

برای این‌که alias در TypeScript هم شناخته شود، به `tsconfig.app.json` اضافه کنید (بدون `baseUrl` — این گزینه در TypeScript 6 منسوخ شده و مسیرها نسبت به خود فایل tsconfig حل می‌شوند):

```json title="tsconfig.app.json"
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

:::warn ترتیب پلاگین‌ها مهم است
React Compiler باید **اولین** پلاگین Babel باشد چون به کد اصلی و دست‌نخورده نیاز دارد. اگر از نسخه‌های قدیمی‌تر `@vitejs/plugin-react` (قبل از ۶) استفاده می‌کنید، به‌جای `@rolldown/plugin-babel` گزینه `react({ babel: { plugins: ['babel-plugin-react-compiler'] } })` را به کار ببرید.
:::

## Lint: قوانین Hooks و کامپایلر

قالب رسمی Vite از نسخه ۹ به‌جای ESLint، **oxlint** (نوشته‌شده با Rust، ده‌ها برابر سریع‌تر) را با قانون `react/rules-of-hooks` می‌آورد و برای شروع کافی است. اما قوانین کامل «Rules of React» و بررسی‌های React Compiler (mutation، purity، setState در Effect و…) فقط در `eslint-plugin-react-hooks` (نسخه ۶ به بعد) هستند؛ برای پروژه واقعی توصیه می‌کنیم ESLint را با Flat Config کنار آن اضافه کنید:

```bash title="Terminal"
npm install -D eslint @eslint/js typescript-eslint \
  eslint-plugin-react-hooks eslint-plugin-react-refresh
```

```js title="eslint.config.js"
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,   // شامل قوانین کامپایلر
  reactRefresh.configs.vite,
  { files: ['**/*.{ts,tsx}'] },
]);
```

## ابزارهای ضروری توسعه‌دهنده

| ابزار | چرا؟ |
|---|---|
| **React Developer Tools** | افزونه مرورگر؛ درخت کامپوننت‌ها، props/state، پروفایلر و نشان ✨ Memo برای کامپوننت‌های بهینه‌شده توسط کامپایلر |
| **ES7+ React Snippets** (VS Code) | `rfc` → کامپوننت آماده، `us` → useState |
| **Prettier** | فرمت خودکار؛ بحث‌های بی‌فایده روی استایل کد تمام می‌شود |
| **Error Lens** (VS Code) | نمایش خطای TypeScript/ESLint در همان خط |
| **Chrome Performance Tracks** | (React 19.2) رد‌های اختصاصی React در تب Performance کروم |

## متغیرهای محیطی

Vite فقط متغیرهایی با پیشوند `VITE_` را در کد کلاینت قابل‌دسترس می‌کند:

```bash title=".env.local"
VITE_API_URL=https://api.example.com
```

```ts title="src/lib/config.ts"
export const API_URL = import.meta.env.VITE_API_URL;
```

:::danger هرگز اسرار را در کلاینت نگذارید
هر چیزی با `VITE_` در باندل نهایی و قابل‌مشاهده برای همه است. کلید API خصوصی، توکن پرداخت یا رمز دیتابیس هیچ‌وقت نباید در پروژه کلاینتی React قرار بگیرد. این‌ها فقط در بک‌اند (یا Server Components/Functions) جای دارند.
:::

:::interview
**Junior — تفاوت `public/` و `src/assets/` چیست؟** فایل‌های `public/` بدون پردازش و با همان نام سرو می‌شوند (مثل `favicon.ico` یا `robots.txt`). فایل‌های `src/assets/` توسط Vite باندل، hash‌گذاری و بهینه می‌شوند و از طریق `import` استفاده می‌شوند.

**Mid — چرا Vite در dev سریع‌تر از Webpack است؟** چون در dev کد را باندل نمی‌کند؛ از ES Modules بومی مرورگر استفاده می‌کند و هر فایل را در لحظه درخواست تبدیل می‌کند. تغییر یک فایل یعنی فقط همان ماژول دوباره ارسال می‌شود.

**Senior — React Compiler چه کدی را نمی‌تواند بهینه کند؟** کدی که «قوانین React» را نقض می‌کند: تغییر (mutate) props/state، فراخوانی هوک به‌صورت شرطی، side effect در بدنه رندر. کامپایلر چنین کامپوننت‌هایی را **رد می‌کند** (skip) نه این‌که بشکند؛ ESLint دقیقاً به شما می‌گوید کدام کامپوننت و چرا.
:::
