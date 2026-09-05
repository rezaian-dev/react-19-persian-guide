---
num: 31
part: 2
title: مهاجرت و ارتقا به React 19
subtitle: تغییرات شکننده، codemodها، به‌روزرسانی تایپ‌ها و پذیرش تدریجی React Compiler
lead: اکثر پروژه‌های موجود روی React 18 هستند. ارتقا به ۱۹ ساده‌تر از آن چیزی است که به نظر می‌رسد — اگر ترتیب درست را رعایت کنید. این فصل یک نقشه گام‌به‌گام با codemodهای رسمی و فهرست کامل تغییرات شکننده ارائه می‌دهد.
---

## نقشه راه ارتقا

<div class="flow">
<div class="box"><b>1</b>به آخرین ۱۸.۳ برسید و هشدارها را رفع کنید</div>
<span class="arrow">→</span>
<div class="box"><b>2</b>codemodها را اجرا کنید</div>
<span class="arrow">→</span>
<div class="box"><b>3</b>React 19 + تایپ‌ها را نصب کنید</div>
<span class="arrow">→</span>
<div class="box"><b>4</b>تست، وابستگی‌ها، سپس Compiler</div>
</div>

## گام ۱: React 18.3 — پل ارتقا

```bash title="Terminal"
npm install react@18.3 react-dom@18.3
```

نسخه ۱۸.۳ از نظر عملکرد با ۱۸.۲ یکسان است اما برای هر API که در ۱۹ حذف می‌شود **هشدار** می‌دهد. اپ را اجرا کنید، کنسول را بخوانید و هشدارها را رفع کنید. این کار بیشتر ارتقا را بدون ریسک انجام می‌دهد.

## گام ۲: codemodهای رسمی

```bash title="Terminal"
# همه codemodهای React 19 با هم
npx codemod@latest react/19/migration-recipe

# یا جداگانه:
npx codemod@latest react/19/replace-reactdom-render  # ReactDOM.render → createRoot
npx codemod@latest react/19/replace-string-ref       # string refs → callback
npx codemod@latest react/19/replace-act-import       # act از react
npx codemod@latest react/19/replace-use-form-state   # useFormState → useActionState
npx codemod@latest react/prop-types-typescript       # propTypes → TS
npx types-react-codemod@latest preset-19 ./src       # تایپ‌ها
```

## گام ۳: نصب React 19

```bash title="Terminal"
npm install react@19 react-dom@19
npm install -D @types/react@19 @types/react-dom@19
npm install -D eslint-plugin-react-hooks@latest
```

بعد: `npx tsc --noEmit` و `npm run lint` — خطاهای باقی‌مانده را با جدول‌های زیر رفع کنید.

## تغییرات شکننده — مرجع کامل

### حذف‌شده‌ها

| حذف‌شده | جایگزین |
|---|---|
| `ReactDOM.render` / `hydrate` | `createRoot(el).render()` / `hydrateRoot()` |
| `ReactDOM.unmountComponentAtNode` | `root.unmount()` |
| `ReactDOM.findDOMNode` | `ref` روی عنصر |
| `propTypes`, `defaultProps` (توابع) | TypeScript + مقدار پیش‌فرض در destructuring |
| String refs (`ref="input"`) | `useRef` یا ref callback |
| Legacy Context (`contextTypes`, `getChildContext`) | `createContext` |
| `React.createFactory` | JSX |
| `react-test-renderer/shallow` | Testing Library |
| `act` از `react-dom/test-utils` | `import { act } from 'react'` |
| Module pattern factories | تابع معمولی |

### تغییر رفتار

| تغییر | اثر و راهکار |
|---|---|
| **خطا هنگام رندر throw می‌شود** (نه rethrow) | یک لاگ به‌جای دو؛ از `onUncaughtError`/`onCaughtError` استفاده کنید |
| **`ref` cleanup function** | اگر ref callback مقداری برمی‌گرداند، حالا cleanup تلقی می‌شود؛ `ref={el => (this.x = el)}` را به بلاک تبدیل کنید |
| **`useRef` آرگومان اجباری** (تایپ) | `useRef<T>(null)` |
| **`ReactElement.props` از `any` به `unknown`** | با `isValidElement<Props>(el)` narrow کنید |
| **UMD builds حذف شد** | از ESM CDN (`esm.sh`) یا باندلر |
| **حداقل ES2020** | Chrome 80+، Safari 13.1+؛ برای قدیمی‌تر polyfill |
| **`<Context.Provider>` deprecated** | `<Context value>` (هنوز کار می‌کند) |
| **`forwardRef` deprecated** | `ref` به‌عنوان prop (هنوز کار می‌کند) |
| **`element.ref` حذف** | `element.props.ref` |
| **StrictMode: useMemo/useCallback** | نتیجه اولین رندر در رندر دوم استفاده می‌شود (رفتار درست‌تر) |

### تغییرات JSX و تایپ‌ها

| قبل | بعد |
|---|---|
| `React.FC<Props>` با children ضمنی | `children` را صریح در Props بنویسید |
| `JSX.Element` سراسری | `React.JSX.Element` |
| `MutableRefObject<T>` | `RefObject<T>` (current قابل‌نوشتن است) |
| `ReactChild`, `ReactFragment` | `ReactNode` |
| `React.VFC` | تابع معمولی |

## گام ۴: به‌روزرسانی وابستگی‌ها

کتابخانه‌هایی که با React 19 مشکل داشتند (و نسخه سازگارشان):

| کتابخانه | وضعیت |
|---|---|
| `@testing-library/react` | ≥ 16 |
| `react-router` | v8 (v6.28+ و v7 هم با React 19 سازگارند) |
| `@tanstack/react-query` | v5 |
| `react-hook-form` | ≥ 7.54 |
| `framer-motion` → `motion` | ≥ 11.11 |
| `react-redux` | ≥ 9.2 |
| `@mui/material` | ≥ 6.1 |
| `antd` | v5.22+ (با `@ant-design/v5-patch-for-react-19`) |
| `react-helmet` | حذف کنید؛ Metadata داخلی |
| `styled-components` | v6 سازگار؛ اما برای RSC مناسب نیست |

```bash title="Terminal"
npm ls react          # وابستگی‌هایی که نسخه دیگری از react می‌خواهند
npm install --legacy-peer-deps   # موقت، اگر peerDependency هنوز به‌روز نشده
```

## گام ۵: React Compiler — تدریجی

```bash title="Terminal"
npm install -D --save-exact babel-plugin-react-compiler@latest
```

```ts title="vite.config.ts"
babel({
  presets: [reactCompilerPreset({
    // مرحله اول: فقط پوشه‌های انتخابی
    sources: (filename) => filename.includes('src/features/products'),
  })],
})
```

مسیر پذیرش: (۱) ابتدا فقط ESLint `react-hooks` نسخه ۶+ را فعال و خطاها را رفع کنید؛ (۲) کامپایلر را روی یک فیچر فعال کنید و در DevTools نشان ✨ را بررسی کنید؛ (۳) گسترش تدریجی؛ (۴) `memo`/`useMemo` قدیمی را در ری‌فکتورهای بعدی حذف کنید (اجباری نیست). اگر کامپوننتی رفتار عجیب داشت، `"use no memo"` بالای آن بگذارید و بعداً بررسی کنید — تقریباً همیشه یک نقض قوانین React است.

## چک‌لیست پس از ارتقا

- [ ] `npm run build`, `typecheck`, `lint`, `test` همه سبز
- [ ] کنسول در dev بدون هشدار deprecation
- [ ] فرم‌ها: `useFormState` → `useActionState` (آرگومان سوم `isPending` اضافه شد)
- [ ] `forwardRef`ها به‌تدریج به `ref` prop
- [ ] `react-helmet` حذف و با `<title>`/`<meta>` جایگزین
- [ ] اگر RSC دارید: روی نسخه وصله‌شده امنیتی (≥ 19.2.4)
- [ ] Error reporting با `onCaughtError`/`onUncaughtError` متصل

:::tip از ۱۶ یا ۱۷ می‌آیید؟
ابتدا به ۱۸ بروید (`createRoot`، automatic batching، StrictMode دوگانه) و اپ را پایدار کنید. پرش مستقیم از ۱۶ به ۱۹ ممکن است ولی دیباگ هم‌زمان دو مجموعه تغییر، دشوار است. کامپوننت‌های کلاسی هنوز کار می‌کنند اما هوک‌های جدید (Actions، `use`) فقط در توابع در دسترس‌اند.
:::

:::interview
**Junior — چرا ابتدا به ۱۸.۳ برویم؟** چون همان رفتار ۱۸.۲ را دارد اما برای هر API حذف‌شده در ۱۹ هشدار می‌دهد؛ می‌توانید بدون ریسک، مشکلات را قبل از ارتقای واقعی پیدا و رفع کنید.

**Mid — تغییر رفتار ref callback در React 19 چه باگی می‌سازد؟** `ref={el => (this.el = el)}` مقدار assignment را برمی‌گرداند؛ در ۱۹ این مقدار به‌عنوان cleanup function تفسیر می‌شود و اگر تابع نباشد هشدار/خطا می‌دهد. راه‌حل: بدنه را داخل آکولاد بنویسید تا `undefined` برگردد.

**Senior — استراتژی ارتقای یک monorepo بزرگ با ده‌ها پکیج و کتابخانه داخلی چیست؟** (۱) inventory: `npm ls react` و لیست APIهای deprecated با codemod در حالت dry-run؛ (۲) کتابخانه‌های داخلی را ابتدا با peerDependency `^18 || ^19` سازگار کنید (بدون استفاده از API جدید)؛ (۳) اپ‌های برگ را یکی‌یکی ارتقا دهید — از کم‌ریسک‌ترین؛ (۴) در CI ماتریس تست روی هر دو نسخه تا مهاجرت کامل؛ (۵) پس از ارتقای همه، peerDependency را به `^19` محدود کنید و از قابلیت‌های جدید استفاده کنید؛ (۶) React Compiler را آخر و فیچر به فیچر.
:::
