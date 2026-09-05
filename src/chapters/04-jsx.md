---
num: 04
part: 1
title: JSX و رندر عناصر
subtitle: قواعد JSX، عبارات، شرط‌ها، لیست‌ها و Fragment
lead: JSX زبانی است که با آن رابط کاربری را «توصیف» می‌کنیم. این فصل قواعد آن، تفاوتش با HTML و الگوهای رایج رندر شرطی و لیست را با دقت آموزش می‌دهد.
---

## JSX چیست؟

JSX یک **افزونه نحوی برای JavaScript** است که اجازه می‌دهد ساختار شبیه HTML را مستقیماً داخل کد بنویسید. مرورگر JSX را نمی‌فهمد؛ ابزار build (Vite) آن را به فراخوانی‌های تابع تبدیل می‌کند:

:::cols
:::col آن‌چه می‌نویسید
```tsx nohead
const el = (
  <h1 className="title">سلام {name}</h1>
);
```
:::
:::col آن‌چه اجرا می‌شود
```tsx nohead
import { jsx }
  from 'react/jsx-runtime';
const el = jsx('h1', {
  className: 'title',
  children: ['سلام ', name],
});
```
:::
:::

نکته کلیدی: خروجی JSX یک **شیء جاوااسکریپت** ساده (React Element) است، نه DOM واقعی. به همین دلیل می‌توانید آن را در متغیر بریزید، از تابع برگردانید یا در آرایه نگه دارید.

## قواعد طلایی JSX

| قاعده | مثال درست | چرا |
|---|---|---|
| یک عنصر ریشه | `<><A/><B/></>` | تابع فقط یک مقدار برمی‌گرداند |
| بستن همه تگ‌ها | `<img />`، `<input />` | JSX به XML نزدیک‌تر است تا HTML |
| camelCase برای ویژگی‌ها | `className`، `onClick`، `tabIndex` | ویژگی‌ها property جاوااسکریپت هستند |
| عبارت داخل `{}` | `{user.name}`، `{a + b}` | فقط **عبارت**، نه `if`/`for` |
| استایل به‌صورت شیء | `style={{ color: 'red' }}` | دو آکولاد: یکی JSX و یکی شیء |
| کامنت | `{/* توضیح */}` | کامنت HTML کار نمی‌کند |

:::danger اشتباه رایج: `class` به‌جای `className`
`class` کلمه رزروشده جاوااسکریپت است؛ در JSX باید `className` بنویسید. همچنین `for` در label به `htmlFor` تبدیل می‌شود. React 19 در صورت اشتباه هشدار واضحی در کنسول می‌دهد.
:::

## عبارات و مقادیر در JSX

```tsx title="src/components/Greeting.tsx"
type GreetingProps = { user: { name: string; age: number; isPro: boolean } };

export function Greeting({ user }: GreetingProps) {
  const greeting = new Date().getHours() < 12 ? 'صبح بخیر' : 'عصر بخیر';

  return (
    <section>
      <h2>{greeting}، {user.name}!</h2>
      <p>سن: {user.age.toLocaleString('fa-IR')}</p>
      <p>وضعیت: {user.isPro ? 'حرفه‌ای ⭐' : 'رایگان'}</p>
    </section>
  );
}
```

مقادیر مختلف چگونه رندر می‌شوند؟

| مقدار | خروجی |
|---|---|
| `string`، `number` | متن |
| `true`، `false`، `null`، `undefined` | **هیچ چیز** (همین ویژگی پایه رندر شرطی است) |
| آرایه | تک‌تک عناصر پشت‌سرهم |
| شیء ساده | ❌ خطا: «Objects are not valid as a React child» |

## رندر شرطی

سه الگوی اصلی وجود دارد و انتخاب بین آن‌ها به خوانایی بستگی دارد:

```tsx title="src/components/OrderStatus.tsx"
type Props = { status: 'pending' | 'paid' | 'failed'; items: number };

export function OrderStatus({ status, items }: Props) {
  // ۱) return زودهنگام برای حالت‌های کاملاً متفاوت
  if (status === 'failed') {
    return <p className="error">پرداخت ناموفق بود.</p>;
  }

  // ۲) عملگر && برای «نمایش یا هیچ»
  // ۳) عملگر سه‌تایی برای «یا این یا آن»
  return (
    <div>
      {items > 0 && <p>{items} کالا در سفارش</p>}
      <p>{status === 'paid' ? 'پرداخت شد ✅' : 'در انتظار پرداخت ⏳'}</p>
    </div>
  );
}
```

:::warn تله عدد صفر در `&&`
`{items.length && <List/>}` وقتی `items.length` برابر ۰ باشد، خودِ عدد **۰** را روی صفحه چاپ می‌کند (چون ۰ falsy است اما `null` نیست). همیشه شرط را boolean کنید: `{items.length > 0 && <List/>}`.
:::

## رندر لیست‌ها و اهمیت `key`

```tsx title="src/components/ProductList.tsx"
type Product = { id: string; title: string; price: number };

export function ProductList({ products }: { products: Product[] }) {
  if (products.length === 0) return <p>محصولی یافت نشد.</p>;

  return (
    <ul>
      {products.map((p) => (
        <li key={p.id}>
          {p.title} — {p.price.toLocaleString('fa-IR')} تومان
        </li>
      ))}
    </ul>
  );
}
```

`key` به React می‌گوید هر آیتم «کیست» تا هنگام تغییر لیست (افزودن، حذف، مرتب‌سازی) بتواند عناصر DOM و state آن‌ها را درست نگه دارد.

:::danger هرگز از index به‌عنوان key استفاده نکنید (مگر…)
اگر لیست مرتب‌سازی، فیلتر یا آیتم از وسطش حذف می‌شود، استفاده از `index` باعث می‌شود state آیتم‌ها (مثل مقدار input) به آیتم اشتباه بچسبد. فقط وقتی لیست **کاملاً ثابت** و بدون شناسه است، index قابل‌قبول است. اگر داده id ندارد، هنگام ساخت داده با `crypto.randomUUID()` یکی بسازید — نه در زمان رندر.
:::

## Fragment

وقتی نمی‌خواهید یک `div` اضافی به DOM اضافه کنید:

```tsx nohead
// فرم کوتاه
<>
  <dt>نام</dt>
  <dd>{name}</dd>
</>

// فرم کامل — فقط وقتی key لازم است
{rows.map((r) => (
  <Fragment key={r.id}>
    <dt>{r.label}</dt>
    <dd>{r.value}</dd>
  </Fragment>
))}
```

## استایل داخلی و کلاس‌های شرطی

```tsx nohead
<button
  className={isActive ? 'btn btn-active' : 'btn'}
  style={{ padding: 8, opacity: disabled ? 0.5 : 1 }}
>
```

مقادیر عددی در `style` به‌صورت خودکار `px` می‌گیرند (`padding: 8` → `8px`). برای ترکیب کلاس‌های متعدد، کتابخانه کوچک `clsx` بسیار رایج است: `clsx('btn', { 'btn-active': isActive })`.

:::interview
**Junior — چرا در JSX باید یک عنصر ریشه داشته باشیم؟** چون JSX به یک فراخوانی تابع تبدیل می‌شود و تابع فقط یک مقدار برمی‌گرداند. Fragment (`<>...</>`) این محدودیت را بدون افزودن عنصر اضافی به DOM حل می‌کند.

**Mid — `key` باید در کجا قرار بگیرد و آیا داخل کامپوننت قابل‌دسترسی است؟** `key` روی عنصری که مستقیماً داخل `map` برمی‌گردد قرار می‌گیرد (نه روی عنصر داخلی‌تر). `key` به‌عنوان prop به کامپوننت پاس داده **نمی‌شود**؛ اگر به مقدار نیاز دارید، آن را با نام دیگری هم ارسال کنید.

**Senior — تغییر `key` یک کامپوننت چه اثری دارد و کجا عمداً از آن استفاده می‌کنیم؟** تغییر key یعنی «این یک عنصر کاملاً جدید است»: React نمونه قبلی را unmount و state آن را دور می‌ریزد و از نو mount می‌کند. الگوی عمدی: ریست‌کردن فرم هنگام تغییر کاربر با `<ProfileForm key={userId} />` به‌جای `useEffect` برای پاک‌کردن state.
:::
