---
num: 13
part: 1
title: Context و useReducer
subtitle: اشتراک داده بدون prop drilling، الگوی Provider، reducer و ترکیب این دو
lead: وقتی داده باید در نقاط دور درخت در دسترس باشد (تم، کاربر لاگین‌شده، زبان)، Context راه‌حل است. وقتی منطق تغییر state پیچیده می‌شود، useReducer آن را متمرکز و قابل‌تست می‌کند. ترکیب این دو، الگوی مدیریت state داخلی React بدون کتابخانه است.
---

## مشکل prop drilling

وقتی `user` باید از `App` به `Avatar` در عمق پنج سطح برسد و سه کامپوننت میانی فقط آن را «رد می‌کنند»، به آن prop drilling می‌گویند. اول راه‌حل‌های ساده‌تر را امتحان کنید (ترکیب با `children`، فصل ۵)؛ اگر کافی نبود، Context.

## ساخت Context — سینتکس React 19

```tsx title="src/contexts/ThemeContext.tsx"
import { createContext, use, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';
type ThemeContextValue = { theme: Theme; toggle: () => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  // React 19: خودِ Context به‌عنوان Provider — بدون .Provider
  return <ThemeContext value={{ theme, toggle }}>{children}</ThemeContext>;
}

// هوک سفارشی: مصرف امن با پیام خطای واضح
export function useTheme() {
  const ctx = use(ThemeContext);
  if (!ctx) throw new Error('useTheme باید داخل <ThemeProvider> استفاده شود');
  return ctx;
}
```

```tsx title="src/components/ThemeToggle.tsx"
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return <button onClick={toggle}>{theme === 'light' ? '🌙' : '☀️'}</button>;
}
```

:::note سه تغییر React 19 در Context
۱) `<Context value>` به‌جای `<Context.Provider value>` (فرم قدیمی هنوز کار می‌کند اما deprecated است). ۲) `use(Context)` به‌جای `useContext` که داخل شرط هم مجاز است. ۳) `Context.Consumer` عملاً منسوخ شده است.
:::

## کارایی Context: مشکل و راه‌حل

هر بار `value` تغییر کند، **همه** مصرف‌کننده‌ها رندر می‌شوند. دو اشتباه رایج:

:::cols
:::col bad ❌ شیء جدید در هر رندر
```tsx nohead
<ThemeContext value={{ theme, toggle }}>
// والد رندر شود → شیء جدید →
// همه مصرف‌کننده‌ها رندر می‌شوند
```
:::
:::col good ✅ راه‌حل
```tsx nohead
// با React Compiler خودکار حل می‌شود.
// بدون کامپایلر:
const value = useMemo(
  () => ({ theme, toggle }),
  [theme]
);
<ThemeContext value={value}>
```
:::
:::

**راهکار مهم‌تر: Context را بشکنید.** داده‌هایی که با فرکانس متفاوت تغییر می‌کنند در Contextهای جدا باشند. مثلاً `UserContext` (به‌ندرت) و `NotificationsContext` (مکرر). همچنین state و dispatch را جدا کنید تا کامپوننت‌هایی که فقط dispatch می‌خواهند، با تغییر state رندر نشوند.

## چه چیزی در Context بگذاریم؟

| مناسب ✅ | نامناسب ❌ |
|---|---|
| تم، زبان، جهت (RTL) | داده سرور (→ TanStack Query) |
| کاربر احرازهویت‌شده | state فرم (محلی نگه دارید) |
| تنظیمات سراسری، feature flags | داده‌ای که مرتب تغییر می‌کند (موقعیت موس) |
| dispatch یک reducer سراسری | هر چیزی که فقط ۲ سطح پایین لازم است |

## `useReducer` — منطق متمرکز تغییر state

وقتی چند `useState` با هم تغییر می‌کنند یا تغییرات قوانین دارند، reducer خواناتر و قابل‌تست‌تر است:

```tsx title="src/features/cart/cartReducer.ts (1/2)"
export type CartItem = { id: string; title: string; price: number; qty: number };
export type CartState = { items: CartItem[]; coupon: string | null };

export type CartAction =
  | { type: 'added'; item: Omit<CartItem, 'qty'> }
  | { type: 'removed'; id: string }
  | { type: 'qtyChanged'; id: string; qty: number }
  | { type: 'couponApplied'; code: string }
  | { type: 'cleared' };

export const initialCart: CartState = { items: [], coupon: null };
```

نوع `CartAction` یک **discriminated union** است؛ به همین دلیل TypeScript داخل هر `case` دقیقاً می‌داند کدام فیلدها در دسترس‌اند. خودِ reducer یک تابع خالص است: state جدید برمی‌گرداند و هرگز ورودی را تغییر نمی‌دهد:

```tsx title="src/features/cart/cartReducer.ts (2/2)"
export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'added': {
      const exists = state.items.find((i) => i.id === action.item.id);
      const items = exists
        ? state.items.map((i) =>
            i.id === action.item.id ? { ...i, qty: i.qty + 1 } : i,
          )
        : [...state.items, { ...action.item, qty: 1 }];
      return { ...state, items };
    }
    case 'removed':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    case 'qtyChanged':
      return {
        ...state,
        items: state.items
          .map((i) => (i.id === action.id ? { ...i, qty: action.qty } : i))
          .filter((i) => i.qty > 0),
      };
    case 'couponApplied':
      return { ...state, coupon: action.code };
    case 'cleared':
      return initialCart;
  }
}
```

نکات: reducer یک **تابع خالص** است (state جدید برمی‌گرداند، mutate نمی‌کند)، نام actionها «چه اتفاقی افتاد» را می‌گویند (`added`) نه «چه کار کن» (`setItems`)، و TypeScript با union نوعِ action، هر `case` را دقیقاً تایپ می‌کند.

```tsx title="src/features/cart/CartContext.tsx"
import { createContext, use, useReducer, type ReactNode, type Dispatch } from 'react';
import { cartReducer, initialCart } from './cartReducer';
import type { CartState, CartAction } from './cartReducer';

const CartStateContext = createContext<CartState | null>(null);
const CartDispatchContext = createContext<Dispatch<CartAction> | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialCart);
  return (
    <CartStateContext value={state}>
      <CartDispatchContext value={dispatch}>{children}</CartDispatchContext>
    </CartStateContext>
  );
}

export const useCart = () => use(CartStateContext)!;
export const useCartDispatch = () => use(CartDispatchContext)!;
```

`dispatch` هویت پایداری دارد؛ کامپوننتی که فقط `useCartDispatch` را مصرف می‌کند (مثل دکمه «افزودن به سبد») با تغییر سبد رندر نمی‌شود.

```tsx title="src/features/products/AddToCartButton.tsx"
export function AddToCartButton({ product }: { product: Product }) {
  const dispatch = useCartDispatch();
  const add = () => dispatch({ type: 'added', item: product });
  return <button onClick={add}>افزودن</button>;
}
```

## تست reducer — بدون React

```ts title="src/features/cart/cartReducer.test.ts"
import { cartReducer, initialCart } from './cartReducer';

test('افزودن دوباره همان محصول qty را زیاد می‌کند', () => {
  const item = { id: '1', title: 'کتاب', price: 100 };
  let s = cartReducer(initialCart, { type: 'added', item });
  s = cartReducer(s, { type: 'added', item });
  expect(s.items).toEqual([{ ...item, qty: 2 }]);
});
```

چون reducer تابع خالص است، تستش نه به DOM نیاز دارد نه به رندر.

## `useState` یا `useReducer`؟

| نشانه | انتخاب |
|---|---|
| یک یا دو مقدار مستقل | `useState` |
| چند مقدار که با هم تغییر می‌کنند | `useReducer` |
| منطق انتقال پیچیده (اعتبارسنجی، شرط) | `useReducer` |
| می‌خواهید منطق را جدا تست کنید | `useReducer` |
| state باید بین صفحات/تب‌ها زنده بماند | کتابخانه (فصل ۲۰) |

:::interview
**Junior — Context چه زمانی رندر مجدد ایجاد می‌کند؟** هر بار `value` پاس‌داده‌شده به Provider با مقایسه `Object.is` تغییر کند، همه کامپوننت‌هایی که آن Context را مصرف می‌کنند رندر می‌شوند — صرف‌نظر از این‌که از کدام بخش value استفاده می‌کنند.

**Mid — چرا state و dispatch را در دو Context جدا می‌گذاریم؟** چون `dispatch` هویت ثابتی دارد؛ کامپوننت‌هایی که فقط action ارسال می‌کنند نباید با هر تغییر state رندر شوند. جداسازی، رندرهای غیرضروری را حذف می‌کند.

**Senior — Context جایگزین Redux/Zustand است؟** نه دقیقاً. Context یک مکانیزم **انتقال** (dependency injection) است، نه مدیریت state؛ selector ندارد و هر تغییر، همه مصرف‌کننده‌ها را رندر می‌کند. برای state سراسری پرتغییر با نیاز به انتخاب جزئی، ابزارهای مبتنی بر `useSyncExternalStore` (Zustand، Jotai، Redux Toolkit) مناسب‌ترند. برای داده کم‌تغییر (تم، کاربر)، Context کاملاً کافی است.
:::
