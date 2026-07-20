---
num: 08
part: 1
title: قوانین Hooks و مرور همه هوک‌ها
subtitle: چرا قوانین وجود دارند، جدول مرجع کامل هوک‌های React 19 و انتخاب هوک درست
lead: هوک‌ها به کامپوننت‌های تابعی «حافظه» و «قابلیت» می‌دهند. اما دو قانون ساده دارند که نقض‌شان باگ‌های عجیب می‌سازد. این فصل چرایی این قوانین و نقشه کامل هوک‌های نسخه ۱۹ را ارائه می‌دهد.
---

## دو قانون طلایی

1. **فقط در سطح بالای کامپوننت یا هوک سفارشی صدا بزنید** — نه داخل `if`، حلقه، تابع تودرتو یا بعد از `return` زودهنگام.
2. **فقط از داخل کامپوننت React یا هوک سفارشی صدا بزنید** — نه در تابع جاوااسکریپت معمولی، کلاس یا event handler.

## چرا این قوانین وجود دارند؟

React هوک‌ها را با **ترتیب فراخوانی** به هم مرتبط می‌کند، نه با نام. در هر رندر، React یک لیست از «سلول‌های حافظه» دارد و انتظار دارد هوک اول همان هوک اول رندر قبلی باشد:

```tsx nohead
function Profile({ userId }) {
  const [name, setName] = useState('');        // سلول ۰
  if (userId) {
    const [age, setAge] = useState(0);          // ❌ گاهی سلول ۱، گاهی وجود ندارد
  }
  const [bio, setBio] = useState('');          // گاهی سلول ۱، گاهی سلول ۲ → خرابی
}
```

وقتی `userId` از truthy به falsy تغییر کند، `useState` سوم به سلولی که قبلاً برای `age` بود می‌رسد و state قاطی می‌شود. ESLint با قانون `react-hooks/rules-of-hooks` این خطا را قبل از اجرا می‌گیرد.

:::note قوانین React (Rules of React)
از React 19 با React Compiler، مجموعه گسترده‌تری به نام **Rules of React** رسمی شد: کامپوننت‌ها و هوک‌ها باید خالص باشند، props/state تغییر داده نشوند، مقادیر بازگشتی هوک‌ها mutate نشوند، و هوک‌ها فقط به‌عنوان هوک استفاده شوند (نه پاس‌دادن به‌عنوان مقدار). پلاگین `eslint-plugin-react-hooks@6+` این‌ها را بررسی می‌کند.
:::

## نقشه کامل هوک‌های React 19.2

### هوک‌های State

| هوک | کاربرد | فصل |
|---|---|---|
| `useState` | state ساده محلی | ۶ |
| `useReducer` | state پیچیده با منطق انتقال متمرکز | ۱۳ |
| `useActionState` | **(۱۹)** state + pending یک Action فرم | ۹ |
| `useOptimistic` | **(۱۹)** نمایش خوش‌بینانه نتیجه قبل از پاسخ سرور | ۱۰ |

### هوک‌های Context و Ref

| هوک | کاربرد | فصل |
|---|---|---|
| `useContext` | خواندن Context (در ۱۹ می‌توان `use(Context)` نوشت) | ۱۳ |
| `useRef` | مقدار قابل‌تغییر بدون رندر؛ دسترسی به DOM | ۱۱ |
| `useImperativeHandle` | سفارشی‌کردن چیزی که ref والد می‌بیند | ۱۱ |

### هوک‌های Effect

| هوک | کاربرد | فصل |
|---|---|---|
| `useEffect` | همگام‌سازی با سیستم خارجی (بعد از paint) | ۱۱ |
| `useLayoutEffect` | مثل Effect ولی قبل از paint (اندازه‌گیری DOM) | ۱۱ |
| `useInsertionEffect` | فقط برای کتابخانه‌های CSS-in-JS | — |
| `useEffectEvent` | **(۱۹.۲)** جداکردن منطق «رویدادی» از وابستگی‌های Effect | ۱۱ |

### هوک‌های کارایی

| هوک | کاربرد | فصل |
|---|---|---|
| `useMemo` | کش نتیجه محاسبه سنگین (با Compiler اغلب غیرضروری) | ۱۹ |
| `useCallback` | کش هویت تابع (با Compiler اغلب غیرضروری) | ۱۹ |
| `useTransition` | علامت‌گذاری به‌روزرسانی غیرفوری + `isPending` | ۱۹ |
| `useDeferredValue` | نسخه «عقب‌افتاده» یک مقدار برای UI سنگین | ۱۹ |

### هوک‌های دیگر

| هوک | کاربرد | فصل |
|---|---|---|
| `useId` | شناسه یکتا و پایدار برای دسترسی‌پذیری (label/input) | ۱۷ |
| `useSyncExternalStore` | اتصال به store خارجی (Zustand زیر پوسته از آن استفاده می‌کند) | ۲۰ |
| `useDebugValue` | برچسب در DevTools برای هوک سفارشی | ۱۴ |
| `useFormStatus` | **(۱۹, react-dom)** وضعیت pending فرمِ والد | ۹ |

### API `use` — هوکی که قانون اول را می‌شکند

```tsx nohead
import { use } from 'react';

function Comments({ commentsPromise }) {
  // ✅ می‌تواند داخل شرط باشد!
  if (!commentsPromise) return null;
  const comments = use(commentsPromise);  // suspend تا resolve شود
  const theme = use(ThemeContext);         // مثل useContext
  return comments.map(c => <Comment key={c.id} {...c} />);
}
```

`use` یک API جدید در React 19 است که Promise یا Context را می‌خواند و برخلاف هوک‌ها، **داخل شرط و حلقه مجاز است**. با Suspense یکپارچه است (فصل ۱۲).

## انتخاب هوک درست

<div class="flow">
<div class="box">داده UI که با تغییرش باید رندر شود؟<b>useState / useReducer</b></div>
<span class="arrow">→</span>
<div class="box">مقداری که رندر لازم ندارد (تایمر، DOM)؟<b>useRef</b></div>
<span class="arrow">→</span>
<div class="box">همگام‌سازی با بیرون React؟<b>useEffect</b></div>
<span class="arrow">→</span>
<div class="box">داده مشترک بین کامپوننت‌های دور؟<b>Context</b></div>
</div>

:::danger اشتباه رایج: هوک بعد از return
```tsx nohead
function List({ items }) {
  if (items.length === 0) return <Empty />;   // ❌ return قبل از هوک
  const [selected, setSelected] = useState(null);
}
```
راه‌حل: همه هوک‌ها را بالای تابع، قبل از هر `return` قرار دهید.
:::

:::interview
**Junior — چرا نمی‌توان هوک را داخل `if` صدا زد؟** چون React هوک‌ها را با ترتیب فراخوانی شناسایی می‌کند. اگر ترتیب بین رندرها تغییر کند، state هوک‌ها جابه‌جا می‌شود.

**Mid — `use` چه تفاوتی با `useContext` دارد؟** `use(Context)` همان کار را می‌کند اما داخل شرط و حلقه هم مجاز است و علاوه بر Context، Promise را هم می‌خواند (با Suspense ادغام می‌شود). تیم React توصیه می‌کند در کد جدید `use` را ترجیح دهید.

**Senior — چرا React به‌جای ترتیب فراخوانی از «کلید» برای هوک‌ها استفاده نکرد؟** طراحی مبتنی بر ترتیب سه مزیت دارد: بدون نام‌گذاری اضافی (که در هوک‌های سفارشی ترکیبی تداخل می‌سازد)، بدون سربار جستجو در map، و امکان ترکیب آزاد هوک‌های سفارشی بدون نگرانی از برخورد نام. هزینه‌اش دو قانون است که ابزار lint به‌طور کامل بررسی می‌کند.
:::
