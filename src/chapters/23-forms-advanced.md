---
num: 23
part: 2
title: فرم‌ها و اعتبارسنجی پیشرفته
subtitle: Zod، schema مشترک، خطاهای فیلدی، React Hook Form و فرم‌های چندمرحله‌ای
lead: فصل ۹ مبانی Actions را آموخت. حالا سراغ فرم‌های واقعی می‌رویم: اعتبارسنجی با schema تایپ‌شده، نمایش خطای هر فیلد، فرم‌های بزرگ با React Hook Form و فرم‌های چندمرحله‌ای — با همان الگوهایی که در بک‌اند هم قابل‌استفاده‌اند.
---

## Zod — یک schema، تایپ + اعتبارسنجی

```bash title="Terminal"
npm install zod
```

```ts title="src/features/auth/schemas.ts"
import { z } from 'zod';

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, 'نام حداقل ۲ حرف'),
    email: z.email('ایمیل معتبر نیست'),
    password: z.string().min(8, 'حداقل ۸ کاراکتر').regex(/[0-9]/, 'حداقل یک عدد'),
    confirm: z.string(),
    phone: z.string().regex(/^09\d{9}$/, 'شماره موبایل معتبر نیست').optional(),
    terms: z.literal(true, { error: 'پذیرش قوانین الزامی است' }),
  })
  .refine((d) => d.password === d.confirm, {
    error: 'رمزها یکسان نیستند',
    path: ['confirm'],
  });

// تایپ از schema استخراج می‌شود
export type SignupInput = z.infer<typeof signupSchema>;
```

همین فایل می‌تواند در بک‌اند Node/Next هم import شود: **یک منبع حقیقت** برای اعتبارسنجی کلاینت و سرور.

## Action با خطاهای فیلدی

```ts title="src/lib/forms.ts"
import { z } from 'zod';

export type FormState<T> = {
  values?: Partial<Record<keyof T, string>>;
  fieldErrors?: Partial<Record<keyof T, string[]>>;
  formError?: string;
  success?: boolean;
};

export function parseForm<S extends z.ZodType>(schema: S, formData: FormData) {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  // چک‌باکس: 'on' → true
  const normalized = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, v === 'on' ? true : v]),
  );
  const result = schema.safeParse(normalized);
  return { raw, result };
}
```

```tsx title="src/features/auth/SignupForm.tsx (1/2)"
import { useActionState } from 'react';
import { z } from 'zod';
import { signupSchema, type SignupInput } from './schemas';
import { parseForm, type FormState } from '@/lib/forms';
import { Field } from '@/components/ui/Field';

type SignupState = FormState<SignupInput>;

async function signupAction(_: SignupState, fd: FormData): Promise<SignupState> {
  const { raw, result } = parseForm(signupSchema, fd);
  if (!result.success) {
    // Zod 4: z.flattenError به‌جای result.error.flatten()
    return { values: raw, fieldErrors: z.flattenError(result.error).fieldErrors };
  }
  try {
    await api.signup(result.data);
    return { success: true };
  } catch (e) {
    return { values: raw, formError: (e as Error).message };
  }
}
```

Action همه‌ی منطق (اعتبارسنجی، درخواست، شکل خطا) را در خود دارد؛ کامپوننت فقط وضعیت بازگشتی را به فیلدها وصل می‌کند و در صورت خطا مقادیر قبلی را با `defaultValue` نگه می‌دارد:

```tsx title="src/features/auth/SignupForm.tsx (2/2)"
export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, {});
  if (state.success) return <SuccessMessage />;

  return (
    <form action={action} noValidate className="space-y-3">
      <Field name="name" label="نام"
        defaultValue={state.values?.name} errors={state.fieldErrors?.name} />
      <Field name="email" label="ایمیل" type="email"
        defaultValue={state.values?.email} errors={state.fieldErrors?.email} />
      <Field name="password" label="رمز عبور" type="password"
        errors={state.fieldErrors?.password} />
      <Field name="confirm" label="تکرار رمز" type="password"
        errors={state.fieldErrors?.confirm} />
      <label className="flex items-center gap-2">
        <input type="checkbox" name="terms" /> قوانین را می‌پذیرم
      </label>
      {state.fieldErrors?.terms && (
        <p className="text-red-600">{state.fieldErrors.terms[0]}</p>
      )}
      {state.formError && (
        <p role="alert" className="text-red-600">{state.formError}</p>
      )}
      <button disabled={pending}>{pending ? '…' : 'ثبت‌نام'}</button>
    </form>
  );
}
```

```tsx title="src/components/ui/Field.tsx"
import { useId, type ComponentProps } from 'react';

type FieldProps = ComponentProps<'input'> & { label: string; errors?: string[] };

export function Field({ label, errors, ...input }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const invalid = !!errors?.length;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      <input
        id={id}
        aria-invalid={invalid}
        aria-describedby={invalid ? errorId : undefined}
        className={`rounded-lg border px-3 py-2 ${invalid ? 'border-red-500' : ''}`}
        {...input}
      />
      {invalid && (
        <p id={errorId} className="mt-1 text-sm text-red-600">{errors![0]}</p>
      )}
    </div>
  );
}
```

`noValidate` اعتبارسنجی بومی مرورگر را خاموش می‌کند تا پیام‌های خودتان نمایش داده شوند؛ اما ویژگی‌های `required`/`type="email"` را برای دسترسی‌پذیری نگه دارید.

:::tip Progressive Enhancement در عمل
همین فرم در Next.js/React Router با Server Function بدون تغییر کار می‌کند و حتی بدون JS هم submit می‌شود. الگوی `values` + `fieldErrors` استاندارد این اکوسیستم است.
:::

## React Hook Form — برای فرم‌های بزرگ و تعاملی

وقتی فرم ۲۰ فیلد، اعتبارسنجی لحظه‌ای، فیلدهای وابسته و آرایه‌های پویا دارد، **React Hook Form** کارایی بالایی دارد (فیلدها uncontrolled‌اند و تایپ‌کردن رندر مجدد کل فرم را نمی‌سازد):

```bash title="Terminal"
npm install react-hook-form @hookform/resolvers
```

```tsx title="src/features/orders/OrderForm.tsx (1/2)"
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const itemSchema = z.object({
  sku: z.string().min(1),
  qty: z.coerce.number().int().min(1),
});
const orderSchema = z.object({
  customer: z.string().min(2),
  items: z.array(itemSchema).min(1, 'حداقل یک قلم'),
});
type OrderInput = z.infer<typeof orderSchema>;

export function OrderForm() {
  const { register, control, handleSubmit, formState } = useForm<OrderInput>({
    resolver: zodResolver(orderSchema),
    defaultValues: { customer: '', items: [{ sku: '', qty: 1 }] },
    mode: 'onBlur',
  });
  const { errors, isSubmitting } = formState;
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const onSubmit = async (data: OrderInput) => { await api.createOrder(data); };
```

با `useFieldArray` آرایه‌ی اقلام سفارش مدیریت می‌شود؛ هر ردیف با `f.id` (نه index) کلید می‌خورد تا حذف و افزودن، state فیلدهای دیگر را به‌هم نریزد:

```tsx title="src/features/orders/OrderForm.tsx (2/2)"
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <input {...register('customer')} placeholder="نام مشتری" />
      {errors.customer && <p>{errors.customer.message}</p>}

      {fields.map((f, i) => (
        <div key={f.id} className="flex gap-2">
          <input {...register(`items.${i}.sku`)} placeholder="کد کالا" />
          <input type="number" {...register(`items.${i}.qty`)} />
          <button type="button" onClick={() => remove(i)}>حذف</button>
        </div>
      ))}
      {errors.items?.root && <p>{errors.items.root.message}</p>}

      <button type="button" onClick={() => append({ sku: '', qty: 1 })}>
        + قلم جدید
      </button>
      <button disabled={isSubmitting}>ثبت سفارش</button>
    </form>
  );
}
```

## `useActionState` یا React Hook Form؟

| معیار | Actions + Zod | React Hook Form |
|---|---|---|
| فرم ساده تا متوسط | ✅ ایده‌آل | بیش از حد |
| اعتبارسنجی لحظه‌ای (onChange) | دستی | ✅ داخلی |
| آرایه‌های پویا و فیلدهای وابسته | سخت | ✅ `useFieldArray`, `watch` |
| Progressive Enhancement | ✅ | ❌ |
| بدون وابستگی | ✅ | +۱ کتابخانه |
| هم‌راستا با Server Functions | ✅ | نیاز به پل |

قاعده سرانگشتی: **پیش‌فرض Actions**؛ اگر فرم واقعاً پیچیده شد، RHF.

## فرم چندمرحله‌ای (Wizard)

فرم چندمرحله‌ای همان فرم است، فقط state آن «کدام مرحله + داده‌ی جمع‌شده تا این‌جا» است. این state را با `useReducer` (فصل ۱۳) مدل کنید تا قوانین عبور بین مراحل یک‌جا و قابل‌تست باشند:

```tsx title="src/features/onboarding/Wizard.tsx (1/2)"
import { useReducer } from 'react';

type Data = { name?: string; email?: string; plan?: 'free' | 'pro' };
type State = { step: 0 | 1 | 2; data: Data };
type Action = { type: 'next'; patch: Data } | { type: 'back' };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'next':
      return {
        step: Math.min(s.step + 1, 2) as State['step'],
        data: { ...s.data, ...a.patch },
      };
    case 'back':
      return { ...s, step: Math.max(s.step - 1, 0) as State['step'] };
  }
}
```

reducer تنها جایی است که قانون «مرحله بعد/قبل» و ادغام داده‌ها نوشته می‌شود؛ کامپوننت Wizard فقط مرحله‌ی فعال را رندر می‌کند و هر گام، داده‌ی خود را با `onNext` بالا می‌فرستد:

```tsx title="src/features/onboarding/Wizard.tsx (2/2)"
const LABELS = ['پروفایل', 'پلن', 'بازبینی'];

export function Wizard() {
  const [state, dispatch] = useReducer(reducer, { step: 0, data: {} });
  const next = (patch: Data) => dispatch({ type: 'next', patch });
  const back = () => dispatch({ type: 'back' });
  const steps = [
    <StepProfile key="p" data={state.data} onNext={next} />,
    <StepPlan key="l" data={state.data} onNext={next} onBack={back} />,
    <StepReview key="r" data={state.data} onBack={back} />,
  ];
  return (
    <>
      <ol className="flex gap-2">{LABELS.map((label, i) => (
        <li key={label} aria-current={i === state.step ? 'step' : undefined}>
          {label}
        </li>
      ))}</ol>
      {steps[state.step]}
    </>
  );
}
```

هر مرحله یک فرم مستقل با schema خودش (`z.object({...}).pick(...)`) است و فقط داده معتبر را به بالا می‌فرستد. برای حفظ پیشرفت هنگام رفرش، `data` را در `sessionStorage` یا URL نگه دارید.

## نکات UX فرم

- **خطا را بعد از blur یا submit نشان دهید**، نه هنگام اولین کاراکتر.
- **فوکوس روی اولین فیلد خطادار** پس از submit ناموفق.
- **`autoComplete` درست**: `email`، `new-password`، `current-password`، `tel`، `one-time-code`.
- **`inputMode="numeric"`** برای اعداد در موبایل به‌جای `type="number"` (که اسکرول را می‌شکند).
- اعداد فارسی را در سرور/قبل از اعتبارسنجی به انگلیسی تبدیل کنید: `s.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))`.

:::interview
**Junior — چرا اعتبارسنجی فقط سمت کلاینت کافی نیست؟** کلاینت قابل دور زدن است (DevTools، curl). کلاینت برای UX است؛ سرور برای امنیت. Zod اجازه می‌دهد یک schema را در هر دو جا استفاده کنید.

**Mid — تفاوت `z.coerce.number()` و `z.number()` در فرم‌ها چیست؟** `FormData` همه‌چیز را رشته می‌دهد؛ `z.number()` روی `"5"` خطا می‌دهد. `z.coerce.number()` ابتدا `Number()` را اعمال می‌کند. برای چک‌باکس هم باید `'on'` را به boolean تبدیل کنید.

**Senior — چرا React Hook Form از uncontrolled inputs استفاده می‌کند و این با Concurrent React چه نسبتی دارد؟** با ثبت `ref` و خواندن مقادیر مستقیماً از DOM، تایپ در یک فیلد باعث رندر مجدد کل فرم نمی‌شود — برای فرم‌های ۵۰ فیلدی تفاوت محسوس است. چون RHF state خود را خارج از React نگه می‌دارد، از `useSyncExternalStore`-مانند برای `watch`/`formState` استفاده می‌کند تا با Concurrent Rendering سازگار بماند. هزینه: با `<form action>` و Progressive Enhancement مستقیماً یکپارچه نیست و نیاز به adapter دارد.
:::
