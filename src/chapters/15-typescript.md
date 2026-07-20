---
num: 15
part: 1
title: TypeScript در React
subtitle: تایپ‌دهی props، رویدادها، هوک‌ها، جنریک‌ها و الگوهای React 19
lead: TypeScript دیگر «انتخاب» نیست؛ استاندارد پروژه‌های جدی React است. این فصل تمام الگوهای تایپ‌دهی که در کار روزمره لازم دارید را در یک جا جمع کرده و تغییرات تایپی React 19 را پوشش می‌دهد.
---

## چرا TypeScript؟

خطاها را قبل از اجرا می‌گیرد، تکمیل خودکار دقیق می‌دهد، ری‌فکتور را امن می‌کند و **مستندات زنده** است: تایپ props یعنی هر کس بداند کامپوننت چه می‌خواهد. هزینه اولیه یادگیری در هفته اول جبران می‌شود.

## تایپ‌دهی Props

```tsx title="src/components/Badge.tsx"
import type { ReactNode, ComponentProps } from 'react';

// ۱) type برای props (interface هم مجاز است؛ در تیم یکی را انتخاب کنید)
type BadgeProps = {
  children: ReactNode;                      // هر چیز قابل‌رندر
  variant?: 'info' | 'success' | 'danger';  // union به‌جای string
  count?: number;
  onDismiss?: () => void;
  icon?: ReactNode;
};

export function Badge(props: BadgeProps) {
  const { children, variant = 'info', count, onDismiss, icon } = props;
  return (
    <span className={`badge badge-${variant}`}>
      {icon}
      {children}
      {count !== undefined && <b>{count}</b>}
      {onDismiss && <button onClick={onDismiss} aria-label="بستن">×</button>}
    </span>
  );
}

// ۲) به ارث بردن props عنصر بومی
type InputProps = ComponentProps<'input'> & { label: string; error?: string };
```

| تایپ | کاربرد |
|---|---|
| `ReactNode` | هر چیزی که رندر می‌شود (JSX، string، null، آرایه) — برای `children` |
| `ReactElement` | فقط JSX (نه string/null) — وقتی باید حتماً عنصر باشد |
| `ComponentProps<'button'>` | همه props بومی یک تگ |
| `ComponentProps<typeof Button>` | props یک کامپوننت دیگر |
| `PropsWithChildren<P>` | `P & { children?: ReactNode }` |
| `CSSProperties` | شیء style |

:::danger `React.FC` را فراموش کنید
`const Comp: React.FC<Props> = ...` در پروژه‌های قدیمی رایج بود اما اکنون توصیه نمی‌شود: `children` را به‌طور ضمنی اضافه نمی‌کند (از React 18)، جنریک را سخت می‌کند و مزیت خاصی ندارد. تابع معمولی با props تایپ‌شده بنویسید.
:::

## تایپ‌دهی State

```tsx nohead
const [count, setCount] = useState(0);                // استنتاج: number
const [user, setUser] = useState<User | null>(null);  // صریح وقتی مقدار اولیه null
const [items, setItems] = useState<Item[]>([]);       // آرایه خالی نیاز به تایپ دارد
const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
```

## تایپ‌دهی رویدادها

```tsx nohead
import type { ChangeEvent, FormEvent, KeyboardEvent, MouseEvent } from 'react';

const onChange = (e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value);
const onSelect = (e: ChangeEvent<HTMLSelectElement>) => ...;
const onSubmit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); };
const onKey = (e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && ...;
const onClick = (e: MouseEvent<HTMLButtonElement>) => ...;

// ترفند: اگر handler را inline بنویسید، TypeScript خودش تایپ را استنتاج می‌کند
<input onChange={(e) => setValue(e.target.value)} />  // e خودکار تایپ دارد
```

## تایپ‌دهی Ref

```tsx nohead
const inputRef = useRef<HTMLInputElement>(null);       // DOM: با null شروع
const timerRef = useRef<number | null>(null);          // مقدار قابل‌تغییر
const countRef = useRef(0);                            // استنتاج: RefObject<number>

// React 19: ref به‌عنوان prop
type InputProps = ComponentProps<'input'> & { ref?: React.Ref<HTMLInputElement> };
```

:::note تغییر React 19: `useRef` آرگومان اجباری
در React 19، `useRef()` بدون آرگومان خطای تایپ می‌دهد؛ باید `useRef<T>(null)` یا `useRef<T | undefined>(undefined)` بنویسید. همچنین `RefObject.current` دیگر readonly نیست و `MutableRefObject` منسوخ شده است.
:::

## تایپ‌دهی Context و Reducer

```tsx nohead
// Context با null و هوک نگهبان (فصل ۱۳)
const AuthContext = createContext<AuthValue | null>(null);

// Reducer: union برای action ⇒ TypeScript هر case را دقیق می‌داند
type Action =
  | { type: 'added'; item: Item }
  | { type: 'removed'; id: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'added':   return ...; // action.item در دسترس
    case 'removed': return ...; // action.id در دسترس
  }
}
```

## کامپوننت‌های جنریک

```tsx title="src/components/Select.tsx"
type SelectProps<T> = {
  options: T[];
  value: T | null;
  onChange: (value: T) => void;
  getLabel: (option: T) => string;
  getKey: (option: T) => string;
};

export function Select<T>(props: SelectProps<T>) {
  const { options, value, onChange, getLabel, getKey } = props;
  return (
    <select
      value={value ? getKey(value) : ''}
      onChange={(e) => {
        const found = options.find((o) => getKey(o) === e.target.value);
        if (found) onChange(found);
      }}
    >
      {options.map((o) => (
        <option key={getKey(o)} value={getKey(o)}>{getLabel(o)}</option>
      ))}
    </select>
  );
}

// استفاده: T = City به‌صورت خودکار استنتاج می‌شود
<Select
  options={cities}
  value={city}
  onChange={setCity}
  getLabel={(c) => c.name}
  getKey={(c) => c.id}
/>
```

## Discriminated Union برای props متقابلاً انحصاری

```tsx nohead
type ButtonProps =
  | { as: 'button'; onClick: () => void; href?: never }
  | { as: 'link'; href: string; onClick?: never };

// <Button as="link" onClick={...} />  ← ❌ خطای کامپایل
```

## تایپ‌دهی Actions و `useActionState`

```tsx nohead
type FormState = {
  error?: string;
  fieldErrors?: Partial<Record<'email' | 'password', string>>;
};

async function loginAction(prev: FormState, formData: FormData): Promise<FormState> {
  /* ... */
}

const initialState: FormState = {};
const [state, action, isPending] = useActionState(loginAction, initialState);
```

## `satisfies` و `as const`

```ts nohead
const routes = {
  home: '/',
  profile: '/profile',
} as const satisfies Record<string, `/${string}`>;
// ✅ مقدار literal حفظ می‌شود و هم‌زمان با الگو بررسی می‌شود
type Route = (typeof routes)[keyof typeof routes]; // '/' | '/profile'
```

## پیکربندی توصیه‌شده `tsconfig`

در TypeScript 6 گزینه‌های `baseUrl`، `moduleResolution: "node10"` و `target: "ES5"` منسوخ شده‌اند (و در نسخه ۷ حذف می‌شوند)؛ مسیرهای `paths` را نسبی به tsconfig بنویسید (`./src/*`):

```json title="tsconfig.app.json"
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

`verbatimModuleSyntax` شما را مجبور می‌کند تایپ‌ها را با `import type` وارد کنید — که برای tree-shaking و سازگاری با ابزارهای Rust-محور (Rolldown، SWC) ضروری است.

:::tip فایل‌های تایپ سراسری
برای `import.meta.env` و فایل‌های استاتیک، Vite `vite-env.d.ts` را می‌سازد. متغیرهای محیطی خودتان را در آن تعریف کنید تا تکمیل خودکار داشته باشید:
```ts nohead
interface ImportMetaEnv { readonly VITE_API_URL: string }
```
:::

:::interview
**Junior — تفاوت `ReactNode` و `ReactElement` چیست؟** `ReactElement` فقط خروجی JSX است؛ `ReactNode` مجموعه بزرگ‌تری است که string، number، null، boolean، آرایه و ReactElement را شامل می‌شود. برای `children` تقریباً همیشه `ReactNode`.

**Mid — چطور props یک دکمه سفارشی را طوری تایپ می‌کنید که همه ویژگی‌های `<button>` را بپذیرد؟** با `ComponentProps<'button'> & { variant?: ... }` و spread کردن باقی‌مانده روی `<button>`. اگر می‌خواهید prop خاصی را حذف کنید: `Omit<ComponentProps<'button'>, 'type'>`.

**Senior — Discriminated Union در طراحی API کامپوننت چه مزیتی دارد و محدودیتش چیست؟** ترکیب‌های نامعتبر props را در زمان کامپایل غیرممکن می‌کند (مثلاً `href` بدون `as="link"`). محدودیت: destructuring در ابتدای تابع باعث از‌دست‌رفتن narrowing می‌شود؛ باید ابتدا روی `props.as` شرط بگذارید و بعد فیلدها را بخوانید، یا از تابع کمکی type-guard استفاده کنید.
:::
