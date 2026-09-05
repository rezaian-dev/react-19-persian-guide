---
num: 05
part: 1
title: کامپوننت‌ها و Props
subtitle: ترکیب، children، ref به‌عنوان prop و الگوهای طراحی API کامپوننت
lead: کامپوننت واحد سازنده هر اپلیکیشن React است. در این فصل یاد می‌گیرید چطور کامپوننت‌های قابل‌ترکیب و قابل‌استفاده‌مجدد طراحی کنید و با تغییر مهم React 19 در مورد ref آشنا می‌شوید.
---

## کامپوننت یعنی چه؟

یک کامپوننت **تابعی است که props می‌گیرد و React Element برمی‌گرداند**. همین. هیچ جادوی دیگری در کار نیست:

```tsx title="src/components/Avatar.tsx"
type AvatarProps = {
  src: string;
  name: string;
  size?: number; // اختیاری با مقدار پیش‌فرض
};

export function Avatar({ src, name, size = 40 }: AvatarProps) {
  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      style={{ borderRadius: '50%' }}
    />
  );
}
```

:::note `defaultProps` حذف شد
در React 19، `defaultProps` برای کامپوننت‌های تابعی حذف شده است. مقدار پیش‌فرض را همان‌طور که بالا می‌بینید با **destructuring پیش‌فرض** جاوااسکریپت تعریف کنید. `propTypes` هم حذف شده و جای آن را TypeScript گرفته است.
:::

## قواعد Props

- **Props فقط‌خواندنی هستند.** هرگز `props.value = x` ننویسید؛ کامپوننت باید نسبت به ورودی‌هایش «خالص» (pure) باشد.
- **جریان یک‌طرفه:** والد به فرزند داده می‌دهد. اگر فرزند باید چیزی را تغییر دهد، والد یک **تابع callback** پاس می‌دهد.
- **هر مقدار جاوااسکریپت مجاز است:** رشته، عدد، شیء، آرایه، تابع، حتی JSX.

```tsx title="src/components/Toolbar.tsx"
type ToolbarProps = {
  title: string;
  onSave: () => void;             // callback
  onDelete?: (id: string) => void; // اختیاری
  actions?: React.ReactNode;       // JSX دلخواه
};

export function Toolbar({ title, onSave, actions }: ToolbarProps) {
  return (
    <header className="toolbar">
      <h2>{title}</h2>
      <div>
        {actions}
        <button onClick={onSave}>ذخیره</button>
      </div>
    </header>
  );
}
```

## ترکیب با `children`

`children` یک prop ویژه است: هر چیزی که بین تگ باز و بسته کامپوننت بنویسید. این مهم‌ترین ابزار **ترکیب (Composition)** در React است و جایگزین وراثت می‌شود:

```tsx title="src/components/Card.tsx"
type CardProps = {
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function Card({ title, children, footer }: CardProps) {
  return (
    <div className="card">
      {title && <h3 className="card-title">{title}</h3>}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}

// استفاده
<Card title="پروفایل" footer={<button>ویرایش</button>}>
  <Avatar src={user.avatar} name={user.name} />
  <p>{user.bio}</p>
</Card>
```

:::tip الگوی «Slot»
وقتی یک کامپوننت چند ناحیه قابل‌سفارشی‌سازی دارد (هدر، بدنه، فوتر)، به‌جای ده‌ها prop رشته‌ای، برای هر ناحیه یک prop از نوع `ReactNode` تعریف کنید. این الگو «Slot» نام دارد و کامپوننت را انعطاف‌پذیر و API آن را کوچک نگه می‌دارد.
:::

## `ref` به‌عنوان prop (تغییر بزرگ React 19)

در نسخه‌های قبل برای دسترسی به DOM داخلی یک کامپوننت سفارشی باید از `forwardRef` استفاده می‌کردید. در React 19 `ref` یک prop معمولی است:

:::cols
:::col bad قبل (React 18)
```tsx nohead
const Input = forwardRef<
  HTMLInputElement,
  InputProps
>((props, ref) => (
  <input ref={ref} {...props} />
));
```
:::
:::col good حالا (React 19)
```tsx nohead
function Input({
  ref,
  ...props
}: InputProps & {
  ref?: React.Ref<HTMLInputElement>;
}) {
  return <input ref={ref} {...props} />;
}
```
:::
:::

`forwardRef` هنوز کار می‌کند اما منسوخ (deprecated) است و در نسخه‌های آینده حذف خواهد شد. یک codemod رسمی برای مهاجرت خودکار وجود دارد.

## پخش props با Spread

```tsx title="src/components/Button.tsx"
import type { ComponentProps } from 'react';

type ButtonProps = ComponentProps<'button'> & {
  variant?: 'primary' | 'ghost';
};

export function Button({ variant = 'primary', className, ...rest }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} ${className ?? ''}`}
      {...rest}
    />
  );
}
```

`ComponentProps<'button'>` تمام ویژگی‌های بومی `<button>` (از جمله `onClick`، `disabled`، `type` و حتی `ref`) را به ارث می‌برد. این الگو استاندارد ساخت Design System است.

:::warn spread را کورکورانه استفاده نکنید
`{...rest}` راحت است اما اگر روی عنصر DOM قرار بگیرد و prop ناشناخته‌ای در آن باشد، React هشدار می‌دهد. همیشه propهای سفارشی (مثل `variant`) را قبل از spread جدا کنید.
:::

## Render Props و کامپوننت‌های چندشکلی

گاهی می‌خواهید *منطق* را به اشتراک بگذارید ولی *نما* را به مصرف‌کننده بسپارید:

```tsx title="src/components/DataList.tsx"
type DataListProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
};

export function DataList<T extends { id: string }>({
  items,
  renderItem,
  emptyMessage = 'موردی وجود ندارد',
}: DataListProps<T>) {
  if (items.length === 0) return <p>{emptyMessage}</p>;
  return <ul>{items.map((it, i) => <li key={it.id}>{renderItem(it, i)}</li>)}</ul>;
}

// استفاده — کامپوننت جنریک است و تایپ item خودکار استنتاج می‌شود
<DataList items={users} renderItem={(u) => <b>{u.name}</b>} />
```

امروز هوک‌های سفارشی (فصل ۱۴) بیشتر جای Render Props را گرفته‌اند، اما این الگو برای کامپوننت‌های لیست، جدول و ویرچوالایز هنوز رایج است.

## اصول طراحی API کامپوننت

| اصل | توضیح |
|---|---|
| **کوچک و متمرکز** | هر کامپوننت یک مسئولیت. اگر بیش از ~۱۵۰ خط شد، بشکنید |
| **نام‌گذاری boolean** | `isOpen`، `hasError`، `canEdit` — نه `open` |
| **callbacks با `on`** | `onChange`، `onSubmit`، `onClose` |
| **کنترل‌شده در برابر کنترل‌نشده** | اگر `value` می‌گیرید، `onChange` هم بگیرید؛ اگر نه `defaultValue` |
| **ترکیب به‌جای پیکربندی** | `<Modal><Modal.Header/></Modal>` بهتر از `<Modal headerText=... headerIcon=... />` |

:::interview
**Junior — تفاوت props و state چیست؟** props از بیرون (والد) می‌آید و فقط‌خواندنی است؛ state داخل کامپوننت است و کامپوننت خودش آن را تغییر می‌دهد. تغییر هرکدام باعث رندر مجدد می‌شود.

**Mid — چرا نباید کامپوننت را داخل کامپوننت دیگر تعریف کرد؟** چون در هر رندرِ والد، یک «نوع» کامپوننت جدید ساخته می‌شود؛ React آن را عنصری متفاوت می‌بیند، کل زیردرخت را unmount/mount می‌کند و state از دست می‌رود. همیشه کامپوننت‌ها را در سطح ماژول تعریف کنید.

**Senior — Composition چطور مشکل «prop drilling» را قبل از رسیدن به Context حل می‌کند؟** با پاس‌دادن JSX به‌عنوان `children` یا slot، کامپوننت میانی دیگر نیازی به دانستن داده ندارد؛ والد بالایی مستقیماً کامپوننت نهایی را با داده می‌سازد و به پایین می‌فرستد. این «بالا کشیدن ترکیب» اغلب Context را غیرضروری می‌کند.
:::
