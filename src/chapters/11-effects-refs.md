---
num: 11
part: 1
title: useEffect، useRef و useEffectEvent
subtitle: همگام‌سازی با سیستم‌های خارجی، cleanup، وابستگی‌ها و جدایی رویداد از Effect
lead: `useEffect` پرکاربردترین و در عین حال بدفهمیده‌شده‌ترین هوک React است. این فصل مدل ذهنی درست («همگام‌سازی، نه چرخه حیات»)، الگوهای cleanup، و هوک جدید `useEffectEvent` در نسخه ۱۹.۲ را آموزش می‌دهد.
---

## Effect چیست و چه زمانی به آن نیاز داریم؟

Effect راهی است برای **همگام‌کردن کامپوننت با چیزی بیرون از React**: اتصال WebSocket، اشتراک در رویداد `window`، کتابخانه نمودار غیر-React، `document.title`، یا تایمر. Effect **بعد از commit** و پس از نقاشی صفحه اجرا می‌شود.

:::danger Effect برای این کارها نیست
- **تبدیل داده برای رندر:** محاسبه `fullName` از `first`+`last` → مستقیماً در بدنه رندر.
- **واکنش به رویداد کاربر:** ارسال فرم، خرید → در event handler.
- **ریست state با تغییر props:** → از `key` استفاده کنید.
- **واکشی داده (data fetching):** در اپ واقعی → Suspense/کتابخانه (فصل ۱۲). Effect خام برای fetch فقط برای یادگیری یا پروژه بسیار کوچک.

اگر هیچ «سیستم خارجی» درگیر نیست، احتمالاً به Effect نیاز ندارید. مستندات رسمی یک صفحه کامل با عنوان *You Might Not Need an Effect* دارد.
:::

## آناتومی Effect

```tsx title="src/features/chat/ChatRoom.tsx"
import { useEffect, useState } from 'react';

export function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    // ۱) راه‌اندازی (setup)
    const conn = createConnection(roomId);
    conn.on('message', (m) => setMessages((prev) => [...prev, m]));
    conn.connect();

    // ۲) پاک‌سازی (cleanup): قبل از اجرای مجدد و هنگام unmount
    return () => conn.disconnect();
  }, [roomId]); // ۳) وابستگی‌ها: هر بار roomId تغییر کند، cleanup → setup

  return <ul>{messages.map((m, i) => <li key={i}>{m}</li>)}</ul>;
}
```

مدل ذهنی درست: Effect **«چرخه حیات کامپوننت» نیست**؛ بلکه هر Effect یک فرآیند همگام‌سازی مستقل را توصیف می‌کند: «چطور شروع کن» و «چطور متوقف کن». React هر وقت لازم بداند این چرخه را تکرار می‌کند — از جمله دو بار در StrictMode برای اطمینان از صحت cleanup.

## آرایه وابستگی‌ها

| آرایه | رفتار |
|---|---|
| بدون آرایه | بعد از **هر** رندر (تقریباً همیشه اشتباه) |
| `[]` | فقط پس از mount (+ cleanup در unmount) |
| `[a, b]` | پس از mount و هر بار `a` یا `b` تغییر کند |

**قاعده:** هر مقدار reactive (props، state، متغیرهای محاسبه‌شده از آن‌ها) که داخل Effect استفاده می‌شود باید در آرایه باشد. ESLint این را بررسی می‌کند. **آرایه را دروغ نگویید**؛ اگر می‌خواهید Effect به چیزی واکنش نشان ندهد، کد را طوری بنویسید که نیازی به آن نداشته باشد.

## `useEffectEvent` — راه‌حل رسمی وابستگی‌های ناخواسته (React 19.2)

مشکل کلاسیک: می‌خواهید هنگام اتصال، یک notification با تم فعلی نشان دهید، اما تغییر `theme` نباید باعث reconnect شود:

:::cols
:::col bad ❌ مشکل
```tsx nohead
useEffect(() => {
  const conn = createConnection(roomId);
  conn.on('connected', () => {
    showToast('متصل شد', theme);
  });
  conn.connect();
  return () => conn.disconnect();
}, [roomId, theme]);
// تغییر تم → قطع و وصل مجدد!
```
:::
:::col good ✅ راه‌حل
```tsx nohead
const onConnected = useEffectEvent(
  () => showToast('متصل شد', theme),
);

useEffect(() => {
  const conn = createConnection(roomId);
  conn.on('connected', onConnected);
  conn.connect();
  return () => conn.disconnect();
}, [roomId]);
// ✅ Effect Event در وابستگی‌ها نیست
```
:::
:::

`useEffectEvent` تابعی می‌سازد که **همیشه آخرین props/state را می‌بیند** اما reactive نیست. قوانین: فقط داخل Effect همان کامپوننت صدا زده شود، به کامپوننت دیگر پاس داده نشود، و در آرایه وابستگی‌ها قرار نگیرد. `eslint-plugin-react-hooks@6+` این‌ها را می‌داند.

:::tip چه زمانی از `useEffectEvent` استفاده کنیم؟
فقط برای منطقی که مفهوماً یک «رویداد» است اما از داخل Effect شلیک می‌شود (مثل «وقتی متصل شد»، «وقتی صفحه دیده شد»). آن را برای ساکت‌کردن lint استفاده نکنید؛ اگر Effect واقعاً باید به مقداری واکنش نشان دهد، آن مقدار باید در وابستگی‌ها باشد.
:::

## واکشی داده با Effect (فقط برای یادگیری)

```tsx title="src/features/users/UserList.tsx"
useEffect(() => {
  const controller = new AbortController();

  fetch(`/api/users?q=${query}`, { signal: controller.signal })
    .then((r) => r.json())
    .then(setUsers)
    .catch((err) => {
      if (err.name !== 'AbortError') setError(err);
    });

  return () => controller.abort(); // جلوی race condition را می‌گیرد
}, [query]);
```

بدون `AbortController`، اگر کاربر سریع تایپ کند، پاسخ درخواست قدیمی ممکن است بعد از جدید برسد و UI اشتباه شود. این «race condition» رایج‌ترین باگ fetch در Effect است. در فصل ۱۲ راه مدرن (Suspense + کتابخانه) را می‌بینید که این مشکلات را ندارد.

## `useRef` — حافظه بدون رندر

`useRef` یک «جعبه» با ویژگی `current` است که بین رندرها زنده می‌ماند اما تغییرش رندر نمی‌سازد. تفاوت آن با `useState` را یک‌بار برای همیشه به خاطر بسپارید:

| | `useState` | `useRef` |
|---|---|---|
| تغییر باعث رندر می‌شود؟ | ✅ | ❌ |
| مقدار بین رندرها حفظ می‌شود؟ | ✅ | ✅ |
| خواندن در حین رندر | ✅ | ❌ (فقط در handler/Effect) |
| کاربرد | داده UI | تایمر، DOM، مقدار قبلی، فلگ |

نمونه‌ی کلاسیک: شناسه‌ی تایمر و لحظه‌ی شروع، داده‌ی UI نیستند و نباید رندر بسازند — فقط `elapsed` باید state باشد:

```tsx title="src/components/Stopwatch.tsx"
import { useRef, useState } from 'react';

export function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<number | null>(null); // ۱) مقدار قابل‌تغییر
  const startRef = useRef(0);

  function start() {
    startRef.current = Date.now() - elapsed;
    intervalRef.current = window.setInterval(() => {
      setElapsed(Date.now() - startRef.current);
    }, 50);
  }
  function stop() {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  return (
    <>
      <p>{(elapsed / 1000).toFixed(2)} ثانیه</p>
      <button onClick={start}>شروع</button>
      <button onClick={stop}>توقف</button>
    </>
  );
}
```

## `useRef` برای دسترسی به DOM

```tsx title="src/components/SearchBox.tsx"
export function SearchBox() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus(); // فوکوس خودکار پس از mount
  }, []);

  return <input ref={inputRef} placeholder="جستجو…" />;
}
```

React 19 دو قابلیت جدید به `ref` داد: **cleanup function** در ref callback (`ref={(el) => { ...; return () => {...} }}`) و **`ref` به‌عنوان prop معمولی** (فصل ۵).

## `useLayoutEffect` — وقتی باید قبل از paint اندازه بگیرید

```tsx nohead
useLayoutEffect(() => {
  const { height } = tooltipRef.current!.getBoundingClientRect();
  setPosition(height > spaceBelow ? 'top' : 'bottom');
}, []);
```

مثل `useEffect` است اما **همگام و قبل از نقاشی** اجرا می‌شود؛ برای جلوگیری از پرش بصری هنگام اندازه‌گیری DOM. چون مرورگر را بلاک می‌کند، فقط در همین موارد استفاده کنید.

:::summary
- Effect = همگام‌سازی با بیرون React، نه چرخه حیات.
- هر Effect باید cleanup متناظر داشته باشد اگر چیزی راه می‌اندازد.
- وابستگی‌ها را صادقانه بنویسید؛ برای منطق رویدادی از `useEffectEvent` استفاده کنید.
- `useRef` برای مقادیری که رندر لازم ندارند و برای DOM.
- برای داده، به Suspense و کتابخانه‌ها بروید (فصل بعد).
:::

:::interview
**Junior — چرا Effect در StrictMode دو بار اجرا می‌شود؟** React عمداً setup→cleanup→setup را شبیه‌سازی می‌کند تا مطمئن شود cleanup درست نوشته شده. اگر دوبار اجرا شدن مشکل می‌سازد، cleanup شما ناقص است.

**Mid — تفاوت `useEffect` و `useLayoutEffect` چیست؟** `useEffect` بعد از paint و به‌صورت غیرهمگام اجرا می‌شود؛ `useLayoutEffect` بعد از تغییر DOM ولی قبل از paint و همگام. دومی فقط برای اندازه‌گیری/تنظیم layout که باید قبل از دیده‌شدن انجام شود.

**Senior — `useEffectEvent` چه مشکلی را حل می‌کند که `useRef` + `useEffect` به‌طور کامل حل نمی‌کرد؟** الگوی «latest ref» (ذخیره callback در ref و به‌روزرسانی در Effect) یک پنجره زمانی دارد که ref هنوز مقدار قدیمی است، و همچنین linter نمی‌تواند صحت آن را بررسی کند. `useEffectEvent` تضمین می‌کند تابع همیشه آخرین مقادیر commit‌شده را ببیند، قوانین استفاده را قابل‌lint می‌کند و به‌صراحت بیان می‌کند این منطق reactive نیست.
:::
