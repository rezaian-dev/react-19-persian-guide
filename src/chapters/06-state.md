---
num: 06
part: 1
title: State و چرخه رندر
subtitle: useState، به‌روزرسانی‌های دسته‌ای، ناتغییرپذیری و مدل ذهنی رندر
lead: state حافظه کامپوننت است و رندر مکانیزمی که آن حافظه را به رابط کاربری تبدیل می‌کند. درک دقیق این دو مفهوم، تفاوت بین «کسی که React می‌نویسد» و «کسی که React را می‌فهمد» است.
---

## چرا متغیر معمولی کافی نیست؟

```tsx nohead
function Counter() {
  let count = 0;                 // ❌ با هر رندر دوباره ۰ می‌شود
  return <button onClick={() => count++}>{count}</button>;
}
```

دو مشکل: اول، تغییر `count` به React نمی‌گوید که باید دوباره رندر کند. دوم، حتی اگر رندر شود، تابع از نو اجرا و `count` دوباره ۰ می‌شود. `useState` هر دو مشکل را حل می‌کند: مقدار را **بین رندرها حفظ** می‌کند و تغییر آن **رندر مجدد را زمان‌بندی** می‌کند.

```tsx title="src/components/Counter.tsx"
import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

## مدل ذهنی رندر: سه مرحله

<div class="flow">
<div class="box"><b>1. Trigger</b>mount اولیه یا تغییر state</div>
<span class="arrow">→</span>
<div class="box"><b>2. Render</b>React تابع کامپوننت را صدا می‌زند</div>
<span class="arrow">→</span>
<div class="box"><b>3. Commit</b>تفاوت‌ها روی DOM اعمال می‌شود</div>
</div>

نکته حیاتی: **«رندر» یعنی اجرای تابع شما**، نه لمس DOM. React ممکن است کامپوننت را رندر کند ولی چون خروجی تغییری نکرده، هیچ چیزی در DOM عوض نشود. به همین دلیل تابع کامپوننت باید **خالص** باشد: با ورودی یکسان، خروجی یکسان بدهد و هیچ side effect نداشته باشد.

## state یک «عکس فوری» است

```tsx title="src/components/SnapshotDemo.tsx"
export function SnapshotDemo() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
    // ❌ count فقط ۱ واحد اضافه می‌شود!
    console.log(count); // هنوز مقدار قدیمی را چاپ می‌کند
  }

  return <button onClick={handleClick}>{count}</button>;
}
```

چرا؟ چون `count` در طول یک رندر **ثابت** است؛ متغیری است که مقدارش در لحظه رندر «عکس‌برداری» شده. هر سه `setCount(0 + 1)` هستند. اگر مقدار جدید به مقدار قبلی وابسته است، از **تابع به‌روزرسان (updater)** استفاده کنید:

```tsx nohead
setCount((c) => c + 1);
setCount((c) => c + 1);
setCount((c) => c + 1); // ✅ حالا ۳ واحد اضافه می‌شود
```

:::note Batching خودکار
React چند `setState` را که در یک رویداد (یا حتی در `setTimeout`، Promise و…) رخ می‌دهند، **دسته‌بندی** می‌کند و فقط یک بار رندر می‌کند. از React 18 به بعد این رفتار همه‌جا فعال است. بنابراین نگران کارایی چند setState پشت‌سرهم نباشید.
:::

## ناتغییرپذیری (Immutability)

React برای تشخیص تغییر state از مقایسه **مرجع** (`Object.is`) استفاده می‌کند. اگر شیء یا آرایه را مستقیماً تغییر دهید، مرجع همان است و React متوجه تغییر نمی‌شود:

:::cols
:::col bad ❌ Mutation
```tsx nohead
user.name = 'علی';
setUser(user);        // رندر نمی‌شود!

items.push(newItem);
setItems(items);      // رندر نمی‌شود!
```
:::
:::col good ✅ کپی جدید
```tsx nohead
setUser({ ...user, name: 'علی' });

setItems([...items, newItem]);
setItems(items.filter(i => !i.done));
setItems(items.map(i =>
  i.id === id ? { ...i, done: true } : i
));
```
:::
:::

| عملیات | متد ناتغییرپذیر |
|---|---|
| افزودن | `[...arr, item]` یا `arr.concat(item)` |
| حذف | `arr.filter(x => x.id !== id)` |
| به‌روزرسانی | `arr.map(x => x.id === id ? {...x, ...changes} : x)` |
| مرتب‌سازی | `arr.toSorted(cmp)` (ES2023) یا `[...arr].sort(cmp)` |
| جای‌گذاری | `arr.with(index, value)` (ES2023) |
| شیء تودرتو | `{...s, address: {...s.address, city}}` |

:::tip Immer برای state پیچیده
اگر state چند سطح تودرتو دارد، کتابخانه `immer` (یا `use-immer`) اجازه می‌دهد کد را «به‌شکل mutation» بنویسید ولی خروجی ناتغییرپذیر بگیرید: `setUser(draft => { draft.address.city = 'تهران' })`. Redux Toolkit هم درونش از Immer استفاده می‌کند.
:::

## مقدار اولیه تنبل (Lazy Initializer)

```tsx nohead
// ❌ در هر رندر اجرا می‌شود (فقط نتیجه اولی استفاده می‌شود)
const [data, setData] = useState(expensiveParse(raw));

// ✅ فقط در رندر اول اجرا می‌شود
const [data, setData] = useState(() => expensiveParse(raw));
```

## ساختاردهی state

- **گروه‌بندی مرتبط‌ها:** اگر دو state همیشه با هم تغییر می‌کنند (`x` و `y`)، یک شیء باشند.
- **پرهیز از تناقض:** به‌جای `isLoading` و `isError` جداگانه، یک `status: 'idle' | 'loading' | 'error' | 'success'`.
- **پرهیز از تکرار:** اگر مقداری از state دیگری محاسبه می‌شود (مثل `fullName` از `first` و `last`)، آن را state نکنید؛ در رندر محاسبه کنید.
- **پرهیز از تودرتویی عمیق:** ساختار normalize شده (`{ byId, allIds }`) برای داده‌های رابطه‌ای.

:::danger اشتباه رایج: کپی props در state
```tsx nohead
function Profile({ user }) {
  const [name, setName] = useState(user.name); // ❌
}
```
اگر `user.name` از والد تغییر کند، این state به‌روز نمی‌شود چون `useState` مقدار اولیه را فقط بار اول می‌خواند. یا مستقیماً از prop استفاده کنید، یا اگر واقعاً «مقدار اولیه قابل‌ویرایش» می‌خواهید، نامش را صریح کنید (`initialName`) و با `key` ریست کنید.
:::

## State کجا باید زندگی کند؟ (Lifting State Up)

وقتی دو کامپوننت خواهر به یک داده نیاز دارند، state را به **نزدیک‌ترین والد مشترک** منتقل کنید و از طریق props پایین بفرستید:

```tsx title="src/features/search/SearchPage.tsx"
export function SearchPage() {
  const [query, setQuery] = useState('');

  return (
    <>
      <SearchInput value={query} onChange={setQuery} />
      <SearchResults query={query} />
    </>
  );
}
```

## کامپوننت کنترل‌شده در برابر کنترل‌نشده

| | کنترل‌شده | کنترل‌نشده |
|---|---|---|
| منبع حقیقت | state React | DOM |
| props | `value` + `onChange` | `defaultValue` + `ref` |
| کاربرد | اعتبارسنجی لحظه‌ای، فرمت‌دهی | فرم‌های ساده، فایل آپلود |
| React 19 | همچنان پرکاربرد | با Actions و `FormData` بسیار راحت‌تر شد |

:::interview
**Junior — چرا نباید state را مستقیماً تغییر داد؟** چون React با مقایسه مرجع تغییر را تشخیص می‌دهد؛ mutation مرجع را عوض نمی‌کند و رندر رخ نمی‌دهد. علاوه بر آن، ناتغییرپذیری امکان بازگشت (undo)، دیباگ و بهینه‌سازی با memo را فراهم می‌کند.

**Mid — تفاوت `setCount(count + 1)` و `setCount(c => c + 1)` چیست؟** اولی از مقدار «عکس فوری» رندر فعلی استفاده می‌کند؛ دومی از آخرین مقدار در صف به‌روزرسانی‌ها. وقتی به‌روزرسانی به مقدار قبلی وابسته است یا چند بار پشت‌سرهم اتفاق می‌افتد، فرم تابعی درست است.

**Senior — «رندر» و «کامیت» چه تفاوتی دارند و چرا این تمایز برای Concurrent React مهم است؟** رندر محاسبه خروجی (اجرای تابع) است و قابل توقف، تکرار یا دورانداختن؛ کامیت اعمال نتیجه روی DOM است و همیشه همگام و یکپارچه. چون رندر ممکن است چند بار بدون کامیت اجرا شود (مثلاً در transitionها)، side effect در بدنه رندر ممنوع است و باید در Effect یا event handler باشد.
:::
