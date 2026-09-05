---
num: 22
part: 2
title: الگوهای پیشرفته کامپوننت
subtitle: Compound Components، Portal، Controlled/Uncontrolled، Polymorphic و Headless UI
lead: کتابخانه‌های UI حرفه‌ای (Radix، Headless UI، shadcn) روی چند الگوی مشخص ساخته شده‌اند. با یادگیری این الگوها می‌توانید کامپوننت‌هایی بسازید که هم انعطاف‌پذیرند و هم API ساده‌ای دارند.
---

## Compound Components — کامپوننت‌های مرکب

به‌جای یک کامپوننت با ۲۰ prop، خانواده‌ای از کامپوننت‌ها که state را از طریق Context به اشتراک می‌گذارند. مثل `<select>` و `<option>` در HTML:

```tsx title="src/components/ui/Tabs.tsx (1/2)"
import { createContext, use, useId, useState, type ReactNode } from 'react';

type TabsCtx = { active: string; setActive: (v: string) => void; baseId: string };
const TabsContext = createContext<TabsCtx | null>(null);
const useTabs = () => {
  const ctx = use(TabsContext);
  if (!ctx) throw new Error('Tabs.* باید داخل <Tabs> باشد');
  return ctx;
};

type TabsProps = { defaultValue: string; children: ReactNode };

export function Tabs({ defaultValue, children }: TabsProps) {
  const [active, setActive] = useState(defaultValue);
  const baseId = useId();
  return <TabsContext value={{ active, setActive, baseId }}>{children}</TabsContext>;
}
```

اجزای فرزند از طریق `useTabs()` به state مشترک می‌رسند و با `useId` شناسه‌های ARIA سازگار می‌سازند؛ در پایان به‌صورت property روی `Tabs` سوار می‌شوند تا API `<Tabs.Trigger>` شکل بگیرد:

```tsx title="src/components/ui/Tabs.tsx (2/2)"
function List({ children }: { children: ReactNode }) {
  return <div role="tablist" className="flex gap-1 border-b">{children}</div>;
}

function Trigger({ value, children }: { value: string; children: ReactNode }) {
  const { active, setActive, baseId } = useTabs();
  const selected = active === value;
  return (
    <button
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      onClick={() => setActive(value)}
      className={selected ? 'border-b-2 border-brand-500 font-bold' : ''}
    >
      {children}
    </button>
  );
}

function Panel({ value, children }: { value: string; children: ReactNode }) {
  const { active, baseId } = useTabs();
  if (active !== value) return null;
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
    >
      {children}
    </div>
  );
}

Tabs.List = List;
Tabs.Trigger = Trigger;
Tabs.Panel = Panel;
```

```tsx nohead
<Tabs defaultValue="specs">
  <Tabs.List>
    <Tabs.Trigger value="specs">مشخصات</Tabs.Trigger>
    <Tabs.Trigger value="reviews">نظرات</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Panel value="specs"><SpecsTable /></Tabs.Panel>
  <Tabs.Panel value="reviews"><Reviews /></Tabs.Panel>
</Tabs>
```

مصرف‌کننده آزادانه ساختار را می‌چیند (مثلاً یک آیکون کنار یک Trigger) بدون این‌که Tabs prop جدیدی بخواهد. `useId` شناسه‌های یکتا برای ARIA می‌سازد — حتی در SSR بدون mismatch.

## Controlled / Uncontrolled — پشتیبانی هم‌زمان

کامپوننت‌های حرفه‌ای هر دو حالت را می‌پذیرند: اگر `value` داده شد، کنترل‌شده؛ در غیر این صورت state داخلی:

```ts title="src/hooks/useControllableState.ts"
import { useState } from 'react';

export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value?: T;
  defaultValue: T;
  onChange?: (v: T) => void;
}) {
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;

  function set(next: T) {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  }
  return [current, set] as const;
}
```

```tsx nohead
export function Tabs(props: TabsProps) {
  const { value, defaultValue = '', onValueChange, children } = props;
  const [active, setActive] = useControllableState({
    value, defaultValue, onChange: onValueChange,
  });
  // ...
}

<Tabs defaultValue="a" />                    // uncontrolled
<Tabs value={tab} onValueChange={setTab} />  // controlled (مثلاً همگام با URL)
```

:::warn تغییر حالت در طول عمر ممنوع
کامپوننت نباید بین controlled و uncontrolled جابه‌جا شود (`value` از `undefined` به مقدار یا برعکس). React برای `<input>` هم همین هشدار را می‌دهد. اگر می‌خواهید «خالی» را نشان دهید، `null` یا `''` بدهید نه `undefined`.
:::

## Portal — رندر خارج از سلسله‌مراتب DOM

Modal، Tooltip و Toast باید بالای همه‌چیز باشند؛ اما اگر داخل عنصری با `overflow: hidden` یا `transform` باشند، بریده می‌شوند. `createPortal` آن‌ها را در `document.body` رندر می‌کند در حالی که در درخت React همان‌جا (با Context و رویدادها) باقی می‌مانند.

:::tip `<dialog>` بومی را جدی بگیرید
عنصر `<dialog>` با `showModal()` به‌طور بومی focus trap، بستن با Escape، `inert` کردن پس‌زمینه و لایه top-layer را دارد. در ۲۰۲۶ همه مرورگرهای اصلی پشتیبانی می‌کنند؛ صدها خط کد دسترسی‌پذیری صرفه‌جویی می‌شود. حتی Portal هم برای top-layer لازم نیست، اما برای سازگاری با `overflow` والدین همچنان مفید است.
:::

ترکیب هر دو — Portal برای جای‌گذاری و `<dialog>` برای رفتار — یک Modal کامل در کمتر از ۳۰ خط می‌دهد:

```tsx title="src/components/ui/Modal.tsx"
import { createPortal } from 'react-dom';
import { useEffect, useRef, type ReactNode } from 'react';

type ModalProps = { open: boolean; onClose: () => void; children: ReactNode };

export function Modal({ open, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();   // بومی: focus trap + Escape + backdrop
    if (!open && el.open) el.close();
  }, [open]);

  if (!open) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="rounded-xl p-6 backdrop:bg-black/50"
    >
      {children}
    </dialog>,
    document.body,
  );
}
```

## Polymorphic Component — prop `as`

```tsx title="src/components/ui/Text.tsx"
import type { ComponentPropsWithoutRef, ElementType } from 'react';

type TextProps<T extends ElementType> = {
  as?: T;
  size?: 'sm' | 'md' | 'lg';
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'size'>;

export function Text<T extends ElementType = 'p'>(
  { as, size = 'md', className, ...props }: TextProps<T>,
) {
  const Component = as ?? 'p';
  return <Component className={`text-${size} ${className ?? ''}`} {...props} />;
}

<Text as="h1" size="lg">عنوان</Text>          // props مجاز h1
<Text as="a" href="/x">لینک</Text>            // href فقط وقتی as="a" ✅
```

TypeScript بر اساس `as`، props مجاز را استنتاج می‌کند. الگوی **`asChild`** (Radix) جایگزین مدرن‌تر است: به‌جای `as`، فرزند را با `Slot` کلون می‌کند و props را روی آن merge می‌کند.

## Headless Component — منطق بدون UI

منطق کامل (state، کیبورد، ARIA) را ارائه کنید و رندر را کاملاً به مصرف‌کننده بسپارید:

```ts title="src/hooks/useDisclosure.ts"
import { useCallback, useId, useState } from 'react';

export function useDisclosure(initial = false) {
  const [isOpen, setOpen] = useState(initial);
  const id = useId();
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  return {
    isOpen, open, close, toggle,
    // «prop getters»: ویژگی‌های آماده برای پخش روی عناصر
    getTriggerProps: () => ({
      'aria-expanded': isOpen, 'aria-controls': id, onClick: toggle,
    }),
    getPanelProps: () => ({ id, hidden: !isOpen }),
  };
}
```

```tsx nohead
const d = useDisclosure();
<button {...d.getTriggerProps()}>جزئیات</button>
<section {...d.getPanelProps()}>…</section>
```

این دقیقاً فلسفه **Radix Primitives**، **React Aria** و **Headless UI** است: شما ۱۰۰٪ کنترل استایل دارید و آن‌ها دسترسی‌پذیری را تضمین می‌کنند.

## Slot / `asChild`

```tsx title="src/components/ui/Slot.tsx"
import { cloneElement, isValidElement } from 'react';
import type { ReactNode, HTMLAttributes } from 'react';

type SlotProps = HTMLAttributes<HTMLElement> & { children: ReactNode };

export function Slot({ children, ...props }: SlotProps) {
  if (!isValidElement<HTMLAttributes<HTMLElement>>(children)) return null;
  return cloneElement(children, {
    ...props,
    ...children.props,
    className: [props.className, children.props.className].filter(Boolean).join(' '),
  });
}

// Button با asChild
function Button({ asChild, ...props }: ButtonProps & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={buttonStyles} {...props} />;
}

// استایل دکمه، رفتار لینک:
<Button asChild><Link to="/shop">فروشگاه</Link></Button>
```

## جدول انتخاب الگو

| نیاز | الگو |
|---|---|
| چند بخش مرتبط با state مشترک (تب، آکاردئون، منو) | Compound Components |
| پشتیبانی هم‌زمان از state داخلی و خارجی | Controlled/Uncontrolled |
| رندر بالای همه‌چیز (modal, toast) | Portal + `<dialog>` |
| یک ظاهر روی عناصر مختلف (دکمه‌ای که لینک است) | `asChild` / Polymorphic |
| اشتراک منطق پیچیده بدون تحمیل UI | Headless hook با prop getters |
| رندر سفارشی هر آیتم لیست | Render prop (`renderItem`) |

:::interview
**Junior — Portal چه مشکلی را حل می‌کند؟** اجازه می‌دهد کامپوننت در جای دیگری از DOM (مثل `body`) رندر شود تا `overflow`، `z-index` و `transform` والدین آن را نبرند؛ در حالی که در درخت React همان‌جا می‌ماند و Context و رویدادها کار می‌کنند.

**Mid — Compound Components چه مزیتی نسبت به props پیکربندی دارند؟** انعطاف ساختاری (مصرف‌کننده ترتیب، wrapper و محتوای هر بخش را کنترل می‌کند) بدون انفجار تعداد props، و API که شبیه HTML خوانده می‌شود. عیب: کمی پیچیدگی پیاده‌سازی و وابستگی به Context.

**Senior — رویدادها در Portal چطور حباب می‌کنند و چه تله‌ای دارد؟** رویدادهای React از درخت **React** (نه DOM) بالا می‌روند؛ کلیک داخل modal که در `body` است، به `onClick` والدِ React‌ای آن می‌رسد. تله: اگر والد یک handler «کلیک بیرون» دارد که `contains` را روی DOM بررسی می‌کند، کلیک داخل modal را «بیرون» تشخیص می‌دهد. راه‌حل: بررسی با `e.composedPath()` یا استفاده از `onPointerDownOutside` کتابخانه‌های headless.
:::
