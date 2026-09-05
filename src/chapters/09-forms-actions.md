---
num: 09
part: 1
title: فرم‌ها و Actions در React 19
subtitle: `<form action>`، useActionState، useFormStatus و Progressive Enhancement
lead: React 19 نحوه کار با فرم‌ها را متحول کرد. به‌جای مدیریت دستی loading و خطا، یک تابع async به فرم می‌دهید و React بقیه را انجام می‌دهد. این فصل مهم‌ترین تغییر عملی نسخه ۱۹ را عمیق آموزش می‌دهد.
---

## مشکلی که Actions حل می‌کند

در React 18 یک فرم ساده «ثبت نظر» این‌طور بود:

```tsx nohead
const [text, setText] = useState('');
const [isPending, setIsPending] = useState(false);
const [error, setError] = useState<string | null>(null);

async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  setIsPending(true);
  setError(null);
  try {
    await postComment(text);
    setText('');
  } catch (err) {
    setError((err as Error).message);
  } finally {
    setIsPending(false);
  }
}
```

سه state، یک try/catch/finally و `preventDefault` — برای هر فرم، در هر پروژه، با کیفیت متفاوت. React 19 این الگو را **درون خودش** آورد.

## Action چیست؟

**Action** تابعی async است که داخل یک **transition** اجرا می‌شود. وقتی تابع async را به `<form action>`، `startTransition` یا `useActionState` می‌دهید، React به‌طور خودکار:

- وضعیت **pending** را مدیریت می‌کند،
- **خطاها** را به نزدیک‌ترین Error Boundary می‌فرستد،
- **به‌روزرسانی خوش‌بینانه** را با `useOptimistic` پشتیبانی می‌کند،
- فرم را پس از موفقیت **ریست** می‌کند (برای فرم‌های کنترل‌نشده).

## `<form action>` — ساده‌ترین شکل

```tsx title="src/features/comments/CommentForm.tsx"
export function CommentForm({ postId }: { postId: string }) {
  async function submit(formData: FormData) {
    const text = formData.get('text') as string;
    await postComment(postId, text);
    // فرم به‌صورت خودکار ریست می‌شود
  }

  return (
    <form action={submit}>
      <textarea name="text" required minLength={3} />
      <SubmitButton />
    </form>
  );
}
```

هیچ `useState`، هیچ `preventDefault`، هیچ `onSubmit`. `formData` همان `FormData` استاندارد وب است و مقدارها را با ویژگی `name` می‌خواند.

## `useFormStatus` — دکمه‌ای که خودش می‌داند pending است

```tsx title="src/components/SubmitButton.tsx"
import { useFormStatus } from 'react-dom';

export function SubmitButton({ children = 'ارسال' }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'در حال ارسال…' : children}
    </button>
  );
}
```

:::warn `useFormStatus` فقط برای فرزندان فرم
این هوک وضعیت **نزدیک‌ترین `<form>` والد** را می‌خواند. اگر آن را در همان کامپوننتی که `<form>` را رندر می‌کند صدا بزنید، همیشه `pending: false` می‌گیرید. دکمه را به یک کامپوننت جدا منتقل کنید — همان‌طور که بالا انجام دادیم.
:::

## `useActionState` — وقتی به نتیجه Action نیاز دارید

برای نمایش خطای اعتبارسنجی یا پیام موفقیت:

```tsx title="src/features/auth/SignupForm.tsx"
import { useActionState } from 'react';

type State = { error?: string; success?: boolean };

async function signupAction(prev: State, formData: FormData): Promise<State> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  if (!email.includes('@')) return { error: 'ایمیل معتبر نیست' };
  if (password.length < 8) return { error: 'رمز باید حداقل ۸ کاراکتر باشد' };

  try {
    await api.signup({ email, password });
    return { success: true };
  } catch {
    return { error: 'خطای سرور؛ دوباره تلاش کنید' };
  }
}

export function SignupForm() {
  const [state, action, isPending] = useActionState(signupAction, {});

  if (state.success) return <p>✅ ثبت‌نام انجام شد. ایمیل خود را بررسی کنید.</p>;

  return (
    <form action={action}>
      <input name="email" type="email" placeholder="ایمیل" />
      <input name="password" type="password" placeholder="رمز عبور" />
      {state.error && <p role="alert" className="error">{state.error}</p>}
      <button disabled={isPending}>{isPending ? '…' : 'ثبت‌نام'}</button>
    </form>
  );
}
```

امضای `useActionState`:

| بخش | توضیح |
|---|---|
| `useActionState(fn, initialState, permalink?)` | ورودی |
| `fn(prevState, formData)` | Action با state قبلی به‌عنوان آرگومان اول |
| `[state, formAction, isPending]` | خروجی: آخرین نتیجه، تابعی برای `<form action>`، وضعیت |

:::tip الگوی نتیجه استاندارد
برای همه Actionهای پروژه یک نوع مشترک تعریف کنید: `type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string> }`. این کار نمایش خطاهای فیلدی را یکنواخت می‌کند و در فصل ۲۳ با `zod` ترکیب می‌شود.
:::

## نگه‌داشتن مقادیر فرم پس از خطا

فرم کنترل‌نشده بعد از Action ریست می‌شود؛ اگر خطا رخ داد کاربر نباید همه چیز را دوباره تایپ کند. مقادیر را در state برگردانید و به‌عنوان `defaultValue` بدهید:

```tsx nohead
async function action(prev, formData) {
  const values = Object.fromEntries(formData) as Record<string, string>;
  if (!values.email.includes('@')) return { error: 'ایمیل نامعتبر', values };
  // ...
}

<input name="email" defaultValue={state.values?.email} />
```

## Action روی دکمه: `formAction`

هر دکمه می‌تواند Action مخصوص خودش داشته باشد — مفید برای «ذخیره پیش‌نویس» و «انتشار» در یک فرم:

```tsx nohead
<form action={publish}>
  <textarea name="body" />
  <button type="submit">انتشار</button>
  <button type="submit" formAction={saveDraft}>ذخیره پیش‌نویس</button>
</form>
```

## Action خارج از فرم: `startTransition`

Actions محدود به فرم نیستند. هر تابع async داخل `startTransition` یک Action است:

```tsx title="src/features/profile/DeleteAccount.tsx"
import { useTransition } from 'react';

export function DeleteAccount() {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await api.deleteAccount();
      navigate('/goodbye');
    });
  }

  return <button onClick={handleDelete} disabled={isPending}>حذف حساب</button>;
}
```

## Progressive Enhancement

چون `<form action>` روی مکانیزم بومی فرم HTML سوار است، در فریم‌ورک‌هایی با Server Functions (Next.js، React Router) فرم **حتی قبل از لود شدن JavaScript** کار می‌کند. در یک SPA خالص این مزیت وجود ندارد، اما API یکسان است؛ یعنی مهارت شما مستقیماً به فریم‌ورک منتقل می‌شود.

:::project فرم تماس با ما
یک فرم با فیلدهای نام، ایمیل و پیام بسازید که: (۱) با `useActionState` اعتبارسنجی کند و خطای هر فیلد را زیر همان فیلد نشان دهد؛ (۲) دکمه ارسال با `useFormStatus` غیرفعال شود؛ (۳) پس از خطا مقادیر حفظ شوند؛ (۴) پس از موفقیت پیام تشکر جای فرم را بگیرد. برای شبیه‌سازی API از `await new Promise(r => setTimeout(r, 1000))` استفاده کنید.
:::

:::interview
**Junior — تفاوت `onSubmit` و `action` روی فرم چیست؟** `onSubmit` یک رویداد است که خودتان باید `preventDefault` کنید و همه‌چیز را دستی مدیریت کنید. `action` یک تابع (Action) می‌گیرد که `FormData` دریافت می‌کند و React به‌طور خودکار pending، ریست و خطا را مدیریت می‌کند.

**Mid — چرا `useFormStatus` در همان کامپوننت فرم کار نمی‌کند؟** چون شبیه Context عمل می‌کند و وضعیت فرمِ **والد** را می‌خواند. کامپوننتی که خودش `<form>` را رندر می‌کند، فرزند آن فرم نیست.

**Senior — Actions چطور با Concurrent Rendering ادغام می‌شوند؟** Action داخل transition اجرا می‌شود؛ یعنی به‌روزرسانی‌های ناشی از آن غیرفوری (non-urgent) هستند و UI فعلی تا آماده‌شدن نتیجه تعاملی می‌ماند. React همچنین Actionهای متوالی را صف می‌کند تا ترتیب حفظ شود، و `useOptimistic` هنگام اتمام یا شکست transition به‌صورت خودکار به مقدار واقعی بازمی‌گردد.
:::
