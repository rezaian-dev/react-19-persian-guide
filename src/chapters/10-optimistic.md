---
num: 10
part: 1
title: useOptimistic و تجربه کاربری آنی
subtitle: به‌روزرسانی خوش‌بینانه، بازگشت خودکار و الگوهای لایک، حذف و مرتب‌سازی
lead: کاربران انتظار دارند رابط کاربری «فوری» واکنش نشان دهد، نه بعد از پاسخ سرور. React 19 با `useOptimistic` این الگو را که قبلاً پیچیده و خطاخیز بود، به چند خط تبدیل کرده است.
---

## مفهوم به‌روزرسانی خوش‌بینانه

وقتی کاربر دکمه لایک را می‌زند، دو گزینه دارید: صبر کنید تا سرور پاسخ دهد (کند و سنگین) یا **فرض کنید موفق می‌شود**، UI را فوراً به‌روز کنید و اگر شکست خورد، برگردانید. گزینه دوم «Optimistic UI» است و تجربه اپ‌هایی مثل توییتر و اینستاگرام را می‌سازد.

## `useOptimistic` در عمل

```tsx title="src/features/posts/LikeButton.tsx"
import { useOptimistic, useTransition } from 'react';

type Props = { postId: string; likes: number; liked: boolean };

export function LikeButton({ postId, likes, liked }: Props) {
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    { likes, liked },
    (current, next: boolean) => ({
      liked: next,
      likes: current.likes + (next ? 1 : -1),
    }),
  );

  function toggle() {
    startTransition(async () => {
      setOptimistic(!optimistic.liked);       // فوراً در UI
      await api.toggleLike(postId);            // بعد سرور
      // پس از اتمام transition، مقدار واقعی از props جایگزین می‌شود
    });
  }

  return (
    <button onClick={toggle} disabled={isPending} aria-pressed={optimistic.liked}>
      {optimistic.liked ? '❤️' : '🤍'} {optimistic.likes}
    </button>
  );
}
```

امضا: `const [optimisticValue, addOptimistic] = useOptimistic(actualValue, updateFn?)`.

| بخش | توضیح |
|---|---|
| `actualValue` | مقدار واقعی (از props یا state) |
| `updateFn(current, input)` | نحوه محاسبه مقدار خوش‌بینانه از ورودی |
| `optimisticValue` | آن‌چه رندر می‌کنید: تا پایان transition خوش‌بینانه، بعد واقعی |
| `addOptimistic(input)` | باید **داخل transition یا Action** صدا زده شود |

:::note بازگشت خودکار (Rollback)
نیازی به کد rollback نیست. وقتی transition تمام شود (چه موفق چه با خطا)، `optimisticValue` به `actualValue` بازمی‌گردد. اگر والد پس از موفقیت داده جدید را پاس دهد، UI همان می‌ماند؛ اگر خطا رخ دهد، به مقدار قبلی برمی‌گردد. برای نمایش پیام خطا، در Action آن را catch کنید.
:::

## الگوی لیست: افزودن آنی به لیست نظرات

```tsx title="src/features/comments/Comments.tsx (1/2)"
import { useOptimistic } from 'react';

type Comment = { id: string; text: string; pending?: boolean };
type Props = { comments: Comment[]; postId: string };

export function Comments({ comments, postId }: Props) {
  const [optimisticComments, addOptimistic] = useOptimistic(
    comments,
    (state, newText: string) => [
      ...state,
      { id: crypto.randomUUID(), text: newText, pending: true },
    ],
  );

  async function submit(formData: FormData) {
    const text = formData.get('text') as string;
    addOptimistic(text);
    await api.addComment(postId, text);
    // والد لیست جدید را واکشی و به‌عنوان props پاس می‌دهد
  }
```

آیتم خوش‌بینانه با `pending: true` علامت می‌خورد تا در رندر، نیمه‌شفاف نمایش داده شود؛ وقتی والد لیست واقعی را پاس دهد، این پرچم دیگر وجود ندارد:

```tsx title="src/features/comments/Comments.tsx (2/2)"
  return (
    <>
      <ul>
        {optimisticComments.map((c) => (
          <li key={c.id} style={{ opacity: c.pending ? 0.5 : 1 }}>
            {c.text} {c.pending && <small>(در حال ارسال…)</small>}
          </li>
        ))}
      </ul>
      <form action={submit}>
        <input name="text" required />
        <button>ارسال</button>
      </form>
    </>
  );
}
```

فراخوانی `addOptimistic` داخل `<form action>` مجاز است چون Action خودش یک transition است.

## الگوی حذف

```tsx nohead
const [optimisticItems, removeOptimistic] = useOptimistic(
  items,
  (state, idToRemove: string) => state.filter((i) => i.id !== idToRemove),
);

function handleDelete(id: string) {
  startTransition(async () => {
    removeOptimistic(id);
    await api.deleteItem(id);
    onRefresh(); // یا revalidate در فریم‌ورک
  });
}
```

## کِی از Optimistic استفاده نکنیم؟

:::cols
:::col good ✅ مناسب
- لایک، بوکمارک، فالو
- افزودن نظر، پیام چت
- تیک زدن تسک، مرتب‌سازی drag & drop
- تغییر تنظیمات ساده (تم، اعلان)
:::
:::col bad ❌ نامناسب
- پرداخت و تراکنش مالی
- عملیات غیرقابل‌بازگشت (حذف حساب)
- عملیاتی که نتیجه‌اش غیرقابل‌پیش‌بینی است (تولید محتوا با AI)
- وقتی نرخ خطا بالاست (اتصال ضعیف شبکه)
:::
:::

:::danger اشتباه رایج: صدا زدن خارج از transition
```tsx nohead
function toggle() {
  setOptimistic(!liked);  // ❌ هشدار: خارج از transition
  api.toggleLike(id);
}
```
`addOptimistic` باید داخل `startTransition(async () => {...})` یا Action فرم باشد؛ در غیر این صورت React هشدار می‌دهد و مقدار بلافاصله برمی‌گردد.
:::

:::tip ترکیب با `useActionState`
برای فرم‌هایی که هم به Optimistic UI و هم به پیام خطا نیاز دارند، هر دو هوک را کنار هم استفاده کنید: `useActionState` نتیجه/خطا را نگه می‌دارد و `useOptimistic` نمایش آنی را. Action مشترک اول `addOptimistic` را صدا می‌زند و بعد نتیجه را برمی‌گرداند.
:::

:::interview
**Junior — Optimistic UI یعنی چه؟** نمایش نتیجه یک عملیات قبل از تأیید سرور، با فرض موفقیت؛ اگر شکست خورد، UI به حالت قبل برمی‌گردد.

**Mid — `useOptimistic` چطور می‌فهمد کی باید به مقدار واقعی برگردد؟** به transitionای که `addOptimistic` در آن صدا زده شده گوش می‌دهد. وقتی آن transition (شامل همه `await`ها) تمام شود، مقدار خوش‌بینانه دور ریخته می‌شود و `actualValue` رندر می‌شود.

**Senior — چالش‌های Optimistic UI در لیست‌های همزمان (concurrent) چیست و React چطور کمک می‌کند؟** چند Action هم‌زمان می‌توانند مقادیر خوش‌بینانه را روی هم انباشته کنند و ترتیب پاسخ سرور ممکن است با ترتیب ارسال متفاوت باشد. React به‌روزرسانی‌های خوش‌بینانه را روی آخرین مقدار واقعی **دوباره اعمال (rebase)** می‌کند و Actionهای یک فرم را صف می‌کند تا ترتیب حفظ شود. شناسه موقت (`crypto.randomUUID`) و فیلد `pending` به شما امکان تمایز آیتم‌های تأییدنشده را می‌دهد.
:::
