---
num: 32
part: 2
title: انیمیشن، View Transitions و حس «نرم بودن»
subtitle: CSS-first، Motion، View Transitions API و کامپوننت آزمایشی `<ViewTransition>`
lead: انیمیشن خوب دیده نمی‌شود؛ فقط حس می‌شود. این فصل نشان می‌دهد چه چیزی را با CSS خالص حل کنید، کجا به کتابخانه‌ای مثل Motion نیاز دارید، چطور از View Transitions مرورگر برای جابه‌جایی صفحه‌ها استفاده کنید و `<ViewTransition>` آزمایشی React چه آینده‌ای را نوید می‌دهد — همه با احترام به کاربرانی که حرکت کمتر می‌خواهند.
---

## اصول: انیمیشن باید معنا داشته باشد

انیمیشن سه کار مفید انجام می‌دهد: **جهت‌دهی** (از کجا آمدیم، به کجا رفتیم)، **بازخورد** (کلیک شد، ذخیره شد) و **تداوم** (این کارت همان کارتی است که در لیست بود). هر انیمیشنی که یکی از این سه کار را نکند، فقط تأخیر است.

- مدت ۱۵۰ تا ۳۰۰ میلی‌ثانیه برای UI معمولی؛ بیش از ۵۰۰ms فقط برای انتقال صفحه یا داستان‌سرایی
- فقط `transform` و `opacity` را انیمیت کنید — روی compositor اجرا می‌شوند و layout را دوباره محاسبه نمی‌کنند. انیمیت‌کردن `height`، `top` یا `margin` باعث jank می‌شود
- easing طبیعی: ورود با `ease-out`، خروج با `ease-in`، جابه‌جایی با `ease-in-out`
- همیشه `prefers-reduced-motion` را رعایت کنید

:::note قاعده سرانگشتی
اگر انیمیشن را حذف کنید و کسی متوجه نشود، حذفش کنید. اگر حذفش کنید و کاربر گیج شود («این از کجا آمد؟»)، انیمیشن درست بوده است.
:::

## سطح ۱: CSS خالص — ۸۰٪ نیازها

React برای بیشتر انیمیشن‌ها به هیچ کتابخانه‌ای نیاز ندارد؛ کافی است **state را به class یا data-attribute** تبدیل کنید و بقیه را به CSS بسپارید.

```tsx title="src/components/Toast.tsx"
import type { ReactNode } from 'react';

export function Toast({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className="toast" data-open={open} role="status">
      {children}
    </div>
  );
}
```

```css title="src/components/toast.css"
.toast {
  transform: translateY(16px);
  opacity: 0;
  transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 220ms ease-out;
}
.toast[data-open="true"] { transform: none; opacity: 1; }

@media (prefers-reduced-motion: reduce) {
  .toast { transition-duration: 1ms; }
}
```

با Tailwind v4 همین کار یک خط است: `transition-all duration-200 data-[open=true]:translate-y-0 data-[open=false]:translate-y-4 motion-reduce:transition-none`.

### ورود عناصر با `@starting-style`

مشکل کلاسیک: عنصری که تازه mount شده، transition ورودی ندارد چون «حالت قبلی» نداشته. CSS مدرن این را با `@starting-style` حل می‌کند — بدون هیچ JS:

```css title="src/styles/enter.css"
.card {
  opacity: 1; transform: none;
  transition: opacity 200ms, transform 200ms;

  @starting-style {
    opacity: 0; transform: scale(0.96);
  }
}
```

هر بار React یک `.card` جدید به DOM اضافه کند، از حالت `@starting-style` به حالت عادی انیمیت می‌شود. برای **خروج** هنوز CSS خالص کافی نیست (عنصر قبل از انیمیشن از DOM حذف می‌شود) — این‌جاست که به سطح ۲ می‌رسیم.

### `transition-behavior: allow-discrete` برای `display` و `<dialog>`

```css nohead
dialog {
  opacity: 0;
  transition:
    opacity 200ms, display 200ms allow-discrete, overlay 200ms allow-discrete;
}
dialog[open] { opacity: 1; @starting-style { opacity: 0; } }
```

با این دو ویژگی، حتی باز/بسته‌شدن `<dialog>` و Popover بومی هم بدون کتابخانه انیمیت می‌شود.

## سطح ۲: Motion — وقتی به خروج، layout و ژست نیاز دارید

کتابخانه **Motion** (نام جدید Framer Motion؛ ایمپورت از `motion/react`، نصب با `npm install motion`) سه چیز را می‌دهد که CSS نمی‌دهد: **انیمیشن خروج** (`AnimatePresence`)، **انیمیشن layout** خودکار (FLIP) و **ژست‌ها** (drag، hover، tap). حجم آن حدود ۳۰KB است؛ فقط وقتی به این سه نیاز دارید نصبش کنید. نمونه‌ی کلاسیک — Modal با انیمیشن خروج:

```tsx title="src/components/Modal.tsx"
import { AnimatePresence, motion } from 'motion/react';

const pop = {
  initial: { opacity: 0, y: 24, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 12, scale: 0.98 },
  transition: { type: 'spring', stiffness: 400, damping: 32 },
};

export function Modal({ open, onClose, children }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div role="dialog" aria-modal="true" className="modal" {...pop}>
          {children}
          <button onClick={onClose}>بستن</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

`AnimatePresence` فرزندی را که از درخت حذف شده، تا پایان انیمیشن `exit` در DOM نگه می‌دارد — همان چیزی که با CSS خالص ممکن نبود. شرط کارکرد: فرزند مستقیم باید `key` پایدار داشته باشد.

### انیمیشن layout: مرتب‌سازی لیست بدون محاسبه

```tsx title="src/features/tasks/TaskList.tsx"
import { motion, AnimatePresence } from 'motion/react';

export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <ul>
      <AnimatePresence initial={false}>
        {tasks.map((t) => (
          <motion.li
            key={t.id}
            layout                                  // جابه‌جایی نرم هنگام reorder/فیلتر
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {t.title}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
```

prop `layout` تکنیک FLIP را خودکار می‌کند: موقعیت قبل و بعد از رندر را اندازه می‌گیرد و تفاوت را با `transform` انیمیت می‌کند. با `layoutId` مشترک بین دو کامپوننت (مثلاً کارت لیست و کارت جزئیات) به **shared element transition** می‌رسید.

:::tip Motion و React Compiler
Motion با React 19 و Compiler سازگار است. فقط تابع‌هایی که به `onAnimationComplete` می‌دهید را مثل هر handler دیگری بنویسید — Compiler خودش memoize می‌کند. اگر با انیمیشن مبتنی بر `useMotionValue` کار می‌کنید، مقدار را در رندر نخوانید؛ آن را به `style` بدهید تا خارج از چرخه رندر React به‌روز شود (بدون رندر مجدد در هر فریم).
:::

### احترام به کاربر: `MotionConfig`

```tsx title="src/app/providers.tsx"
import { MotionConfig } from 'motion/react';

<MotionConfig reducedMotion="user">
  <App />
</MotionConfig>
```

با `reducedMotion="user"` هر انیمیشن `transform` برای کاربرانی که در سیستم‌عامل «کاهش حرکت» را فعال کرده‌اند غیرفعال می‌شود؛ `opacity` باقی می‌ماند تا تغییر همچنان قابل‌درک باشد.

## سطح ۳: View Transitions API مرورگر

برای **انتقال بین صفحه‌ها** (یا هر تغییر بزرگ DOM)، مرورگر یک API بومی دارد: `document.startViewTransition(callback)`. مرورگر از حالت فعلی اسکرین‌شات می‌گیرد، callback شما DOM را تغییر می‌دهد، و بین دو تصویر cross-fade (یا هر انیمیشن CSS دلخواه) اجرا می‌کند. پشتیبانی: Chrome/Edge 111+، Safari 18+، Firefox 132+ — یعنی در ۲۰۲۶ همه‌ی مرورگرهای اصلی برای انتقال درون‌سندی.

### با React Router

React Router از v6.4 به بعد این را داخلی پشتیبانی می‌کند؛ کافی است prop بدهید:

```tsx title="src/components/ProductCard.tsx"
import { Link } from 'react-router';

<Link to={`/products/${p.id}`} viewTransition>
  <img src={p.image} alt="" style={{ viewTransitionName: `product-${p.id}` }} />
  <h3>{p.title}</h3>
</Link>
```

```tsx title="src/routes/product.tsx"
import { useLoaderData } from 'react-router';

export default function Product() {
  const p = useLoaderData() as ProductData;   // همان الگوی Data mode فصل ۱۶
  return (
    <article>
      <img
        src={p.image} alt={p.title}
        style={{ viewTransitionName: `product-${p.id}` }}
      />
      {/* … */}
    </article>
  );
}
```

چون تصویر در هر دو صفحه یک `view-transition-name` دارد، مرورگر آن را از موقعیت کوچک در لیست به موقعیت بزرگ در صفحه جزئیات **morph** می‌کند — اثر «Hero» بدون یک خط محاسبه. شرط مهم: در هر لحظه فقط **یک** عنصر در صفحه می‌تواند نام مشخصی داشته باشد (برای همین `product-${id}` است، نه `product`).

### سفارشی‌سازی با CSS

```css title="src/styles/transitions.css"
::view-transition-old(root) { animation: 180ms ease-in both fade-out; }
::view-transition-new(root) {
  animation: 220ms ease-out both fade-in, 220ms ease-out both slide-up;
}

@keyframes fade-out { to { opacity: 0; } }
@keyframes fade-in  { from { opacity: 0; } }
@keyframes slide-up { from { transform: translateY(12px); } }

@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) { animation: none !important; }
}
```

### بدون روتر: هوک کوچک

```tsx title="src/hooks/useViewTransition.ts"
import { flushSync } from 'react-dom';

export function useViewTransition() {
  return (update: () => void) => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || reduce) {
      update();
      return;
    }
    document.startViewTransition(() => flushSync(update));
  };
}
```

`flushSync` لازم است تا React تغییر state را **هم‌زمان** داخل callback commit کند؛ در غیر این صورت مرورگر قبل از به‌روزرسانی DOM اسکرین‌شات «بعد» را می‌گیرد. مثلاً برای تغییر تم: `withTransition(() => setTheme('dark'))`.

:::warn آبشار انیمیشن و INP
`startViewTransition` کل صفحه را تا پایان انیمیشن **غیرقابل‌تعامل** می‌کند. انیمیشن‌های بلند (بیش از ۳۰۰ms) مستقیماً INP را بدتر می‌کنند. برای فهرست‌های طولانی یا صفحات سنگین، `view-transition-name: none` را روی بخش‌های بی‌ربط بگذارید تا اسکرین‌شات سبک‌تر شود.
:::

## آینده: `<ViewTransition>` در React (آزمایشی)

تیم React در حال ساخت یک کامپوننت بومی است که همین API را با مدل Transition خودش یکپارچه می‌کند. **وضعیت در زمان نگارش:** فقط در کانال‌های `canary` و `experimental`؛ در React 19.2 پایدار **وجود ندارد** و ایمپورت آن خطا می‌دهد. Next.js با فلگ `experimental.viewTransition` آن را در دسترس می‌گذارد (اما «توصیه‌نشده برای production»).

```tsx title="app/Gallery.tsx (React canary)"
// ⚠ فقط در react@canary — در 19.2 پایدار export نمی‌شود
import { ViewTransition, startTransition, addTransitionType } from 'react';

function Gallery({ photos, onOpen }: Props) {
  return (
    <ViewTransition default="fade" enter="slide-in" exit="slide-out">
      <ul>
        {photos.map((p) => (
          <ViewTransition key={p.id} name={`photo-${p.id}`}>
            <li
              onClick={() =>
                startTransition(() => {
                  addTransitionType('open-photo');
                  onOpen(p.id);
                })
              }
            >
              <img src={p.thumb} alt="" />
            </li>
          </ViewTransition>
        ))}
      </ul>
    </ViewTransition>
  );
}
```

ایده‌ها:

- `<ViewTransition>` **چه چیزی** انیمیت شود را مشخص می‌کند؛ props مثل `enter`/`exit`/`update`/`share` نام کلاس CSS می‌گیرند
- انیمیشن فقط برای به‌روزرسانی‌هایی فعال می‌شود که داخل `startTransition` (یا Suspense reveal، یا navigation روتر) اتفاق بیفتند — به‌روزرسانی‌های همگام عمداً انیمیت نمی‌شوند
- `addTransitionType('nav-back')` **علت** انتقال را مشخص می‌کند تا مثلاً «برگشت» جهت مخالف «رفتن» انیمیت شود
- کامپوننت باید **بالای اولین گره DOM** خروجی بنشیند؛ اگر یک `<div>` بین `<ViewTransition>` و محتوا باشد، انیمیشن enter/exit کار نمی‌کند

:::danger در production منتظر بمانید
API نهایی ممکن است تغییر کند. برای اپ‌های واقعی امروز از **React Router `viewTransition`** یا هوک `useViewTransition` بالا استفاده کنید؛ وقتی `<ViewTransition>` پایدار شد، مهاجرت کوچک است چون همان `view-transition-name`ها و همان CSS کار می‌کنند.
:::

## کدام ابزار برای کدام کار؟

| نیاز | ابزار | چرا |
|---|---|---|
| hover، focus، تغییر state ساده | CSS transition + data-attribute | صفر KB، روی compositor |
| ورود عنصر تازه | `@starting-style` | بدون JS، بدون کتابخانه |
| باز/بسته‌شدن `<dialog>`/Popover | `transition-behavior: allow-discrete` | بومی و دسترسی‌پذیر |
| خروج عنصر، لیست قابل‌مرتب‌سازی، drag | Motion (`AnimatePresence`, `layout`) | تنها راه تمیز برای exit و FLIP |
| انتقال بین صفحه‌ها، Hero image | View Transitions (`viewTransition` روتر) | بومی، بدون محاسبه، cross-fade رایگان |
| اسکرول‌محور (parallax، reveal) | CSS `animation-timeline: scroll()` یا Motion `whileInView` | CSS بومی در Chrome/Edge؛ Motion برای همه |
| میکرو-انیمیشن SVG/عدد | Motion `animate()` یا WAAPI | کنترل فریم‌به‌فریم |

## دسترسی‌پذیری و انیمیشن

- **`prefers-reduced-motion`** را در سه سطح رعایت کنید: CSS (`@media`)، Motion (`MotionConfig`)، View Transitions (شرط در هوک)
- انیمیشن نباید تنها راه انتقال اطلاعات باشد؛ «ذخیره شد» را با متن (و `role="status"`) هم بگویید، نه فقط با چشمک سبز
- فوکوس را بعد از انتقال صفحه مدیریت کنید (فصل ۲۵)؛ انیمیشن زیبا با فوکوس گم‌شده، برای کاربر کیبورد فاجعه است
- از انیمیشن‌های چشمک‌زن با فرکانس بالا (بیش از ۳ بار در ثانیه) پرهیز کنید — معیار WCAG 2.3.1

:::interview
**Junior — چرا انیمیت‌کردن `height` یا `top` باعث lag می‌شود؟** چون این ویژگی‌ها layout را تغییر می‌دهند و مرورگر باید در هر فریم موقعیت همه‌ی عناصر را دوباره محاسبه کند (reflow). `transform` و `opacity` روی لایه‌ی compositor اجرا می‌شوند و به layout دست نمی‌زنند؛ برای همین ۶۰fps پایدار می‌مانند.

**Mid — `AnimatePresence` چطور انیمیشن خروج را ممکن می‌کند در حالی که React عنصر را از درخت حذف کرده؟** `AnimatePresence` فرزندان قبلی خود را (بر اساس `key`) به خاطر می‌سپارد؛ وقتی فرزندی در رندر جدید غایب است، آن را همچنان رندر می‌کند و انیمیشن `exit` را اجرا می‌کند و فقط پس از پایان، واقعاً حذفش می‌کند. به همین دلیل `key` پایدار ضروری است.

**Senior — تفاوت مدل `<ViewTransition>` آزمایشی React با فراخوانی مستقیم `document.startViewTransition` چیست؟** فراخوانی مستقیم به `flushSync` نیاز دارد و با Suspense، رندر هم‌روند و به‌روزرسانی‌های قطع‌شده هماهنگ نیست. React انیمیشن را فقط برای Transitionها (startTransition، Suspense reveal، navigation) فعال می‌کند، snapshot را دقیقاً در لحظه‌ی commit می‌گیرد، چند به‌روزرسانی هم‌زمان را در یک view transition ادغام می‌کند و با `addTransitionType` امکان انیمیشن متفاوت بر اساس علت را می‌دهد — بدون این‌که بلوک همگام به رندر تزریق کنید.
:::

:::summary
- CSS اول: `transition` + data-attribute، `@starting-style` برای ورود، `allow-discrete` برای dialog
- Motion فقط برای خروج، layout/FLIP و ژست‌ها؛ با `MotionConfig reducedMotion="user"`
- View Transitions مرورگر برای انتقال صفحه؛ در React Router با prop `viewTransition` و `view-transition-name` یکتا
- `<ViewTransition>` React هنوز canary است — API را بشناسید، در production صبر کنید
- `prefers-reduced-motion` و مدیریت فوکوس اختیاری نیستند
:::

:::exercise
۱. به پروژه فصل ۱۸ (مدیریت وظایف) انیمیشن ورود/خروج آیتم‌ها با `AnimatePresence` و `layout` اضافه کنید؛ سپس همان را فقط با `@starting-style` + `transition` (بدون خروج) پیاده کنید و تفاوت حجم باندل را با `npx vite-bundle-visualizer` مقایسه کنید.
۲. در پروژه روتینگ فصل ۱۶، انتقال لیست → جزئیات را با `viewTransition` و `view-transition-name` روی تصویر بسازید و با `prefers-reduced-motion` تست کنید.
:::
