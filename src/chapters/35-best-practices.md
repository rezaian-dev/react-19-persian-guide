---
num: 35
part: 3
title: بهترین شیوه‌ها، اشتباهات رایج و منابع
subtitle: جمع‌بندی حرفه‌ای، ۲۰ اشتباه پرتکرار با راه‌حل، و مسیر ادامه یادگیری
lead: این فصل جمع‌بندی کل کتاب در قالب یک مرجع سریع است: اشتباهاتی که در بازبینی کد بارها می‌بینیم، شیوه‌های درست در برابر آن‌ها، و منابعی که برای عمیق‌تر شدن باید دنبال کنید.
---

## ۲۰ اشتباه رایج و راه‌حل

### ۱ تا ۱۰ — بنیادها، Hooks و فرم‌ها

| # | اشتباه | راه‌حل | فصل |
|---|---|---|---|
| ۱ | تغییر مستقیم state (`arr.push`) | کپی جدید: spread، `filter`، `map`، `toSorted` | ۶ |
| ۲ | `setCount(count + 1)` چند بار پشت‌سرهم | فرم تابعی: `setCount(c => c + 1)` | ۶ |
| ۳ | `index` به‌عنوان `key` در لیست پویا | شناسه پایدار از داده | ۴ |
| ۴ | `{items.length && <List/>}` → چاپ «۰» | `{items.length > 0 && …}` | ۴ |
| ۵ | تعریف کامپوننت داخل کامپوننت | انتقال به سطح ماژول | ۵ |
| ۶ | کپی props در state (`useState(props.x)`) | مستقیم از props؛ یا `key` برای ریست | ۶ |
| ۷ | `useEffect` برای محاسبه مقدار مشتق‌شده | محاسبه در بدنه رندر | ۱۱ |
| ۸ | fetch در Effect بدون cleanup → race condition | AbortController؛ بهتر: TanStack Query | ۱۱ |
| ۹ | دروغ در آرایه وابستگی‌ها / `eslint-disable` | رفع علت؛ `useEffectEvent` برای منطق رویدادی | ۱۱ |
| ۱۰ | `use(fetch(...))` مستقیم در رندر | Promise پایدار از والد/loader/کش | ۱۲ |

### ۱۱ تا ۲۰ — داده، معماری و کیفیت

| # | اشتباه | راه‌حل | فصل |
|---|---|---|---|
| ۱۱ | `useFormStatus` در همان کامپوننت فرم | انتقال دکمه به کامپوننت فرزند | ۹ |
| ۱۲ | `addOptimistic` خارج از transition | داخل `startTransition` یا `<form action>` | ۱۰ |
| ۱۳ | یک Context بزرگ برای همه‌چیز | تقسیم بر اساس فرکانس تغییر؛ state/dispatch جدا | ۱۳ |
| ۱۴ | داده سرور در Redux/Zustand | TanStack Query؛ store فقط برای client state | ۲۰ |
| ۱۵ | `memo`/`useMemo` همه‌جا بدون اندازه‌گیری | Profiler؛ React Compiler | ۱۹ |
| ۱۶ | یک Error Boundary فقط دور `<App>` | مرزهای دانه‌ریز به‌ازای هر ویجت | ۲۴ |
| ۱۷ | JWT در localStorage | کوکی httpOnly + CSRF defense | ۲۶ |
| ۱۸ | `<div onClick>` به‌جای `<button>` | عنصر معنایی | ۲۵ |
| ۱۹ | `React.FC` و `any` در تایپ‌ها | تابع معمولی + props تایپ‌شده؛ `unknown` + narrow | ۱۵ |
| ۲۰ | تست پیاده‌سازی (state داخلی، نام کلاس) | تست رفتار با Testing Library | ۲۷ |

## بهترین شیوه‌ها — خلاصه اجرایی

### ساختار و کد
- feature-based؛ هر فیچر با `index.ts` به‌عنوان API عمومی.
- کامپوننت کوچک (< ۱۵۰ خط)، منطق در هوک، نما در کامپوننت.
- TypeScript strict + `noUncheckedIndexedAccess`؛ Zod در مرزهای سیستم.
- ESLint با `react-hooks` v6+ و `jsx-a11y`؛ Prettier؛ husky.

### state و داده
- state را دسته‌بندی کنید: محلی / مشترک / سراسری / سرور / URL / فرم.
- پیش‌فرض `useState`؛ `useReducer` برای منطق پیچیده؛ Context برای کم‌تغییر؛ Zustand برای پرتغییر؛ TanStack Query برای سرور.
- فرم‌ها با Actions + Zod؛ RHF فقط برای فرم‌های بسیار پیچیده.
- Optimistic UI برای تعاملات پرتکرار و کم‌ریسک.

### کارایی و UX
- React Compiler فعال؛ memoization دستی فقط با شواهد Profiler.
- ورودی فوری، بقیه در transition؛ `<Activity>` برای حفظ state تب‌ها.
- Suspense + ErrorBoundary به‌ازای هر بخش مستقل.
- code splitting به‌ازای مسیر؛ virtualization برای لیست بزرگ؛ بودجه باندل در CI.

### کیفیت و امنیت
- هرم تست: unit برای منطق، component با Testing Library + MSW، E2E فقط جریان‌های حیاتی.
- بدون `dangerouslySetInnerHTML` خام؛ توکن در کوکی httpOnly؛ CSP؛ `npm audit` در CI.
- دسترسی‌پذیری: HTML معنایی، کیبورد، فوکوس، `aria-live`؛ axe در CI.
- RTL با ویژگی‌های منطقی؛ `Intl` برای اعداد/تاریخ فارسی.

## چک‌لیست بازبینی کد (Code Review)

- [ ] آیا این state واقعاً لازم است یا مشتق‌شده است؟
- [ ] آیا این Effect با یک «سیستم خارجی» همگام می‌شود؟ cleanup دارد؟
- [ ] آیا `key` پایدار و یکتاست؟
- [ ] آیا کامپوننت یک مسئولیت دارد؟ قابل‌تست است؟
- [ ] آیا props تایپ دقیق دارند (نه `any`، نه `object`)؟
- [ ] آیا حالت‌های loading / error / empty مدیریت شده‌اند؟
- [ ] آیا با کیبورد قابل‌استفاده است؟ label دارد؟
- [ ] آیا داده کاربر بدون پاک‌سازی رندر می‌شود؟
- [ ] آیا تست رفتار (نه پیاده‌سازی) اضافه شده؟
- [ ] آیا نام‌ها «چرا» را می‌گویند نه فقط «چه»؟

## منابع برای ادامه مسیر

### رسمی
| منبع | چرا |
|---|---|
| `react.dev/learn` | بهترین نقطه شروع؛ مدل ذهنی درست با مثال تعاملی |
| `react.dev/reference` | مرجع کامل API با نکات و تله‌ها |
| `react.dev/blog` | اعلام نسخه‌ها، React Labs، RFCها |
| `react.dev/learn/react-compiler` | راهنمای کامپایلر و Rules of React |
| `github.com/reactjs/rfcs` | آینده React را زودتر ببینید |

### کتابخانه‌ها و ابزار
| منبع | موضوع |
|---|---|
| `tanstack.com/query` | مستندات + مقالات TkDodo (بهترین محتوای server state) |
| `reactrouter.com` | راهنمای Data و Framework mode |
| `vite.dev` | پیکربندی و پلاگین‌ها |
| `ui.shadcn.com` | کامپوننت‌های قابل‌مالکیت |
| `testing-library.com` | فلسفه و API تست |
| `playwright.dev` | تست E2E |

### افراد و وبلاگ‌ها
| منبع | موضوع |
|---|---|
| Dan Abramov — `overreacted.io` | مدل ذهنی عمیق React، RSC |
| Kent C. Dodds — `epicreact.dev` | الگوها، تست، آموزش ساختاریافته |
| Josh Comeau — `joshwcomeau.com` | React + CSS با توضیحات بصری عالی |
| Nadia Makarevich — `developerway.com` | کارایی و رندر مجدد به‌صورت دقیق |
| TkDodo — `tkdodo.eu/blog` | TanStack Query و state management |
| Sam Selikoff — `buildui.com` | انیمیشن و UI حرفه‌ای |

### خبرنامه و به‌روز ماندن
- **This Week in React** (Sébastien Lorber) — هفتگی، جامع‌ترین خلاصه اکوسیستم.
- **React Status** — هفتگی، کوتاه.
- **Bytes** (ui.dev) — سبک و طنزآمیز، JavaScript و React.
- React Conf (سالانه، ویدئوها رایگان) و React Summit.

### مسیر بعدی
1. **Next.js 16** — کتاب «مرجع جامع Next.js 16» از همین نویسنده؛ RSC و فول‌استک در عمل.
2. **React Native / Expo** — همان React برای موبایل؛ ۸۰٪ دانش شما منتقل می‌شود.
3. **معماری Front-End در مقیاس** — Micro-frontends، Design System، Monorepo (Turborepo/Nx).
4. **کارایی عمیق** — Chrome Performance، React Performance Tracks، Web Vitals در production.
5. **مشارکت متن‌باز** — issueهای `good first issue` در React Router، TanStack، shadcn.

:::note سخن پایانی
React در ۱۳ سال از «کتابخانه View فیسبوک» به پلتفرمی برای دو کامپیوتر (سرور و کلاینت) تبدیل شد، اما هسته‌اش تغییر نکرده: **UI تابعی از state است.** اگر این کتاب یک چیز به شما داده باشد، امیدوارم مدل ذهنی درست باشد — چون APIها تغییر می‌کنند، ولی مدل ذهنی درست سال‌ها کار می‌کند. موفق باشید. 🚀
:::
