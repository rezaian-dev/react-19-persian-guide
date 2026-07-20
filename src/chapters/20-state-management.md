---
num: 20
part: 2
title: مدیریت state در مقیاس: Zustand، Redux Toolkit و Jotai
short: مدیریت state در مقیاس
subtitle: انواع state، معیار انتخاب ابزار، الگوهای store و ترکیب با داده سرور
lead: «کدام کتابخانه state؟» یکی از پرتکرارترین سؤالات React است و پاسخ درست با «چه نوع state‌ای؟» شروع می‌شود. این فصل ابتدا state را دسته‌بندی می‌کند، سپس سه ابزار محبوب را با کد واقعی مقایسه می‌کند تا انتخاب آگاهانه داشته باشید.
---

## اول: state خود را دسته‌بندی کنید

| نوع state | مثال | ابزار مناسب |
|---|---|---|
| **محلی (Local)** | باز/بسته بودن منو، مقدار input | `useState`، `useReducer` |
| **مشترک کم‌تغییر** | تم، زبان، کاربر لاگین‌شده | Context |
| **سراسری پرتغییر** | سبد خرید، پخش‌کننده موسیقی، ویرایشگر | Zustand / Redux Toolkit / Jotai |
| **سرور (Server cache)** | لیست محصولات، پروفایل | TanStack Query / SWR |
| **URL** | فیلتر، صفحه، تب فعال | Search params روتر |
| **فرم** | مقادیر و خطاهای فیلدها | `useActionState` / React Hook Form |

:::danger بزرگ‌ترین اشتباه: داده سرور در store سراسری
قراردادن پاسخ API در Redux/Zustand یعنی خودتان باید کش، invalidation، refetch، loading و race condition را مدیریت کنید. این دقیقاً کاری است که TanStack Query انجام می‌دهد. با جداکردن server state، اغلب می‌بینید state سراسری باقی‌مانده آن‌قدر کوچک است که Context کافی است.
:::

## Zustand — ساده، سریع، بدون boilerplate

```bash title="Terminal"
npm install zustand
```

```ts title="src/stores/cartStore.ts"
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type CartItem = { id: string; title: string; price: number; qty: number };

type CartStore = {
  items: CartItem[];
  add: (item: Omit<CartItem, 'qty'>) => void;
  remove: (id: string) => void;
  clear: () => void;
  total: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((s) => {
          const exists = s.items.find((i) => i.id === item.id);
          return {
            items: exists
              ? s.items.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i))
              : [...s.items, { ...item, qty: 1 }],
          };
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
    }),
    { name: 'cart' }, // localStorage key
  ),
);
```

```tsx title="src/features/cart/CartBadge.tsx"
// selector: این کامپوننت فقط با تغییر تعداد رندر می‌شود، نه با هر تغییر store
export function CartBadge() {
  const count = useCartStore((s) => s.items.length);
  return <span className="badge">{count}</span>;
}

export function AddButton({ product }: { product: Product }) {
  const add = useCartStore((s) => s.add); // تابع پایدار؛ هرگز رندر اضافه نمی‌دهد
  return <button onClick={() => add(product)}>افزودن</button>;
}
```

مزایا: بدون Provider، selector داخلی، ۱ کیلوبایت، middleware برای persist/devtools/immer، و قابل‌استفاده خارج از کامپوننت (`useCartStore.getState()`).

:::tip قاعده selector
همیشه با selector کوچک‌ترین بخش لازم را انتخاب کنید. `useCartStore()` بدون selector یعنی با هر تغییر store رندر می‌شوید. برای انتخاب چند فیلد از `useShallow` استفاده کنید: `useCartStore(useShallow((s) => ({ a: s.a, b: s.b })))`.
:::

## Redux Toolkit — استاندارد سازمانی

Redux کلاسیک به‌دلیل boilerplate بدنام شد، اما **Redux Toolkit (RTK)** آن را مدرن کرد و همچنان در تیم‌های بزرگ به‌دلیل ساختار سخت‌گیرانه، DevTools بی‌نظیر و RTK Query محبوب است:

```ts title="src/store/cartSlice.ts"
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type CartState = { items: CartItem[] };
const initialState: CartState = { items: [] };

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Immer داخلی: «mutation» بنویسید، خروجی immutable است
    added(state, action: PayloadAction<Omit<CartItem, 'qty'>>) {
      const existing = state.items.find((i) => i.id === action.payload.id);
      if (existing) existing.qty += 1;
      else state.items.push({ ...action.payload, qty: 1 });
    },
    removed(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
  },
  selectors: {
    selectCount: (s) => s.items.length,
    selectTotal: (s) => s.items.reduce((sum, i) => sum + i.price * i.qty, 0),
  },
});

export const { added, removed } = cartSlice.actions;
export const { selectCount, selectTotal } = cartSlice.selectors;
```

```ts title="src/store/index.ts"
import { configureStore } from '@reduxjs/toolkit';
import { cartSlice } from './cartSlice';

export const store = configureStore({ reducer: { cart: cartSlice.reducer } });
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// هوک‌های تایپ‌شده
import { useDispatch, useSelector } from 'react-redux';
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

```tsx nohead
const count = useAppSelector(selectCount);
const dispatch = useAppDispatch();
dispatch(added(product));
```

## Jotai — state اتمی (پایین به بالا)

به‌جای یک store بزرگ، «اتم‌های» کوچک و ترکیب‌پذیر:

```ts title="src/atoms/cart.ts"
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const cartItemsAtom = atomWithStorage<CartItem[]>('cart', []);

// اتم مشتق‌شده: خودکار با تغییر cartItemsAtom به‌روز می‌شود
export const cartTotalAtom = atom((get) =>
  get(cartItemsAtom).reduce((sum, i) => sum + i.price * i.qty, 0),
);

// اتم فقط-نوشتنی (action)
export const addToCartAtom = atom(null, (get, set, item: Omit<CartItem, 'qty'>) => {
  const items = get(cartItemsAtom);
  const exists = items.find((i) => i.id === item.id);
  set(
    cartItemsAtom,
    exists
      ? items.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i))
      : [...items, { ...item, qty: 1 }],
  );
});
```

```tsx nohead
import { useAtomValue, useSetAtom } from 'jotai';
const total = useAtomValue(cartTotalAtom);
const addToCart = useSetAtom(addToCartAtom);
```

Jotai برای stateهای پراکنده و وابسته به هم (ویرایشگرها، فرم‌های پیچیده، داشبوردهای تعاملی) عالی است و با Suspense (اتم async) یکپارچه می‌شود.

## مقایسه نهایی

| | Zustand | Redux Toolkit | Jotai | Context |
|---|---|---|---|---|
| حجم | ~۱KB | ~۱۱KB | ~۳KB | ۰ |
| Boilerplate | خیلی کم | متوسط | کم | کم |
| Selector / رندر جزئی | ✅ | ✅ | ✅ (per-atom) | ❌ |
| DevTools | ✅ (middleware) | ✅✅ بهترین | ✅ | React DevTools |
| Server state داخلی | ❌ (TanStack Query) | RTK Query | ❌ | ❌ |
| منحنی یادگیری | کم | متوسط | کم‌متوسط | صفر |
| مناسب | اکثر SPAها | تیم بزرگ، قوانین سخت | state اتمی پیچیده | داده کم‌تغییر |

:::note همه بر پایه `useSyncExternalStore`
Zustand، Redux و Jotai همگی برای اتصال به React از `useSyncExternalStore` استفاده می‌کنند؛ یعنی با Concurrent Rendering سازگارند و tearing ندارند. اگر روزی store خودتان را می‌سازید، همین هوک را استفاده کنید (فصل ۱۴).
:::

## الگوی توصیه‌شده برای اپ متوسط

```text title="State architecture"
URL (search params)   →  فیلتر، صفحه، تب
TanStack Query        →  همه داده‌های سرور
Zustand (۱ تا ۳ store) →  سبد، پخش‌کننده، تنظیمات UI پرتغییر
Context               →  تم، زبان، auth session
useState / useReducer →  همه‌چیز دیگر (اکثریت!)
```

:::interview
**Junior — چرا Context برای state پرتغییر مناسب نیست؟** چون selector ندارد؛ هر تغییر value همه مصرف‌کننده‌ها را رندر می‌کند حتی اگر فقط به بخش کوچکی نیاز داشته باشند.

**Mid — Zustand بدون Provider چطور کار می‌کند و چه عیبی دارد؟** store یک singleton در سطح ماژول است و هوک با `useSyncExternalStore` به آن subscribe می‌شود. عیب: در SSR، store بین درخواست‌ها مشترک می‌شود و باید per-request با Context ساخته شود (الگوی رسمی Zustand برای Next.js).

**Senior — Redux Toolkit چه زمانی هنوز انتخاب درست است؟** وقتی تیم بزرگ به قرارداد سخت‌گیرانه (action/reducer/selector)، ردیابی کامل تغییرات (time-travel debugging)، middleware پیچیده (saga/listener برای جریان‌های کاری چندمرحله‌ای) یا RTK Query به‌عنوان راه‌حل یکپارچه server state نیاز دارد. برای اپ کوچک/متوسط، سربار ذهنی آن توجیه ندارد.
:::
