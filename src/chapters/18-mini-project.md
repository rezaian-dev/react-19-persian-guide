---
num: 18
part: 1
title: پروژه عملی: مدیریت وظایف کامل
subtitle: ترکیب مفاهیم بخش یکم در یک اپلیکیشن واقعی با Actions، Optimistic UI، Context و روتینگ
lead: وقت آن است که همه‌چیز را کنار هم بگذاریم. در این فصل یک اپلیکیشن مدیریت وظایف (Task Manager) با فیلتر، ویرایش درجا، به‌روزرسانی خوش‌بینانه، ذخیره در localStorage و تم تاریک می‌سازیم — با معماری‌ای که در پروژه واقعی هم قابل‌استفاده است.
---

## آن‌چه می‌سازیم

- لیست وظایف با افزودن، تیک‌زدن، ویرایش درجا و حذف
- فیلتر (همه / فعال / انجام‌شده) از طریق **search params** (قابل bookmark)
- **Optimistic UI** برای تیک‌زدن و حذف با API شبیه‌سازی‌شده
- ذخیره پایدار در localStorage
- تم تاریک/روشن با Context
- ساختار **feature-based** و TypeScript کامل

## ساختار پروژه

```text title="Project structure"
src/
├── app/
│   ├── router.tsx              # تعریف مسیرها
│   └── providers.tsx           # ترکیب همه Providerها
├── features/
│   └── tasks/
│       ├── api.ts              # API شبیه‌سازی‌شده (با تأخیر و خطای تصادفی)
│       ├── types.ts
│       ├── TasksPage.tsx
│       ├── TaskList.tsx
│       ├── TaskItem.tsx
│       ├── AddTaskForm.tsx
│       └── FilterTabs.tsx
├── contexts/ThemeContext.tsx   # از فصل ۱۳
├── hooks/useLocalStorage.ts    # از فصل ۱۴
├── components/ui/              # Button, Input (cva)
└── main.tsx
```

## گام ۱: تایپ‌ها و API شبیه‌سازی‌شده

```ts title="src/features/tasks/types.ts"
export type Task = { id: string; title: string; done: boolean; createdAt: number };
export type Filter = 'all' | 'active' | 'done';
```

```ts title="src/features/tasks/api.ts"
import type { Task } from './types';

const KEY = 'tasks:v1';
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const read = (): Task[] => JSON.parse(localStorage.getItem(KEY) ?? '[]');
const write = (tasks: Task[]) => localStorage.setItem(KEY, JSON.stringify(tasks));

export const tasksApi = {
  async list() {
    await delay(300);
    return read();
  },
  async add(title: string) {
    await delay(500);
    const task: Task = {
      id: crypto.randomUUID(), title, done: false, createdAt: Date.now(),
    };
    write([task, ...read()]);
    return task;
  },
  async toggle(id: string) {
    await delay(400);
    if (Math.random() < 0.15) throw new Error('خطای شبکه (شبیه‌سازی)');
    write(read().map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  },
  async rename(id: string, title: string) {
    await delay(300);
    write(read().map((t) => (t.id === id ? { ...t, title } : t)));
  },
  async remove(id: string) {
    await delay(400);
    write(read().filter((t) => t.id !== id));
  },
};
```

## گام ۲: صفحه اصلی با loader و search params

```tsx title="src/features/tasks/TasksPage.tsx"
import { useLoaderData, useRevalidator, useSearchParams } from 'react-router';
import { tasksApi } from './api';
import type { Filter, Task } from './types';
import { AddTaskForm } from './AddTaskForm';
import { FilterTabs } from './FilterTabs';
import { TaskList } from './TaskList';

export const tasksLoader = () => tasksApi.list();

export function TasksPage() {
  const tasks = useLoaderData() as Task[];
  const { revalidate } = useRevalidator();
  const [params] = useSearchParams();
  const filter = (params.get('filter') ?? 'all') as Filter;

  const visible = tasks.filter((t) =>
    filter === 'all' ? true : filter === 'done' ? t.done : !t.done,
  );
  const remaining = tasks.filter((t) => !t.done).length;

  return (
    <section className="mx-auto max-w-xl space-y-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">وظایف</h1>
        <span className="text-sm text-slate-500">{remaining} مورد باقی‌مانده</span>
      </header>

      <AddTaskForm onAdded={revalidate} />
      <FilterTabs value={filter} />
      <TaskList tasks={visible} onChanged={revalidate} />
    </section>
  );
}
```

`useRevalidator` loader را دوباره اجرا می‌کند؛ ساده‌ترین راه همگام‌سازی پس از تغییر بدون کتابخانه اضافی.

## گام ۳: فرم افزودن با `useActionState`

```tsx title="src/features/tasks/AddTaskForm.tsx"
import { useActionState } from 'react';
import { tasksApi } from './api';
import { Button } from '@/components/ui/Button';

type State = { error?: string };

export function AddTaskForm({ onAdded }: { onAdded: () => void }) {
  const [state, action, isPending] = useActionState(
    async (_prev: State, formData: FormData): Promise<State> => {
      const title = String(formData.get('title') ?? '').trim();
      if (title.length < 2) return { error: 'عنوان حداقل ۲ کاراکتر باشد' };
      await tasksApi.add(title);
      onAdded();
      return {};
    },
    {},
  );

  return (
    <form action={action} className="flex gap-2">
      <input
        name="title"
        placeholder="کار جدید…"
        autoComplete="off"
        className="flex-1 rounded-lg border px-3 py-2"
        aria-invalid={!!state.error}
      />
      <Button disabled={isPending}>{isPending ? '…' : 'افزودن'}</Button>
      {state.error && <p role="alert" className="text-red-600">{state.error}</p>}
    </form>
  );
}
```

## گام ۴: تب‌های فیلتر با search params

```tsx title="src/features/tasks/FilterTabs.tsx"
import { NavLink } from 'react-router';
import type { Filter } from './types';

const tabs: { value: Filter; label: string }[] = [
  { value: 'all', label: 'همه' },
  { value: 'active', label: 'فعال' },
  { value: 'done', label: 'انجام‌شده' },
];

export function FilterTabs({ value }: { value: Filter }) {
  return (
    <nav className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
      {tabs.map((t) => (
        <NavLink
          key={t.value}
          to={t.value === 'all' ? '.' : `?filter=${t.value}`}
          className={`flex-1 rounded-md py-1 text-center text-sm ${
            value === t.value ? 'bg-white shadow dark:bg-slate-700' : ''
          }`}
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
```

## گام ۵: لیست با Optimistic UI

```tsx title="src/features/tasks/TaskList.tsx (1/2)"
import { useOptimistic, useTransition } from 'react';
import { tasksApi } from './api';
import type { Task } from './types';
import { TaskItem } from './TaskItem';

type Optimistic =
  | { kind: 'toggle'; id: string }
  | { kind: 'remove'; id: string };
type Props = { tasks: Task[]; onChanged: () => void };

export function TaskList({ tasks, onChanged }: Props) {
  const [, startTransition] = useTransition();
  const [optimisticTasks, apply] = useOptimistic(tasks, (state, op: Optimistic) =>
    op.kind === 'remove'
      ? state.filter((t) => t.id !== op.id)
      : state.map((t) => (t.id === op.id ? { ...t, done: !t.done } : t)),
  );

  function run(op: Optimistic, request: () => Promise<void>) {
    startTransition(async () => {
      apply(op);
      try {
        await request();
      } catch (e) {
        alert((e as Error).message); // در پروژه واقعی: toast
      }
      onChanged(); // موفق یا ناموفق، با سرور همگام شو
    });
  }
```

تابع `run` قلب این کامپوننت است: ابتدا تغییر خوش‌بینانه را اعمال می‌کند، بعد درخواست واقعی را می‌فرستد و در هر حال با `onChanged` داده را از سرور تازه می‌کند. بخش رندر فقط این تابع را به آیتم‌ها وصل می‌کند:

```tsx title="src/features/tasks/TaskList.tsx (2/2)"
  if (optimisticTasks.length === 0)
    return <p className="py-8 text-center text-slate-400">چیزی برای نمایش نیست 🎉</p>;

  return (
    <ul className="divide-y rounded-lg border">
      {optimisticTasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={() =>
            run({ kind: 'toggle', id: task.id }, () => tasksApi.toggle(task.id))
          }
          onRemove={() =>
            run({ kind: 'remove', id: task.id }, () => tasksApi.remove(task.id))
          }
          onRename={(title) => tasksApi.rename(task.id, title).then(onChanged)}
        />
      ))}
    </ul>
  );
}
```

توجه کنید که با ۱۵٪ خطای تصادفی در `toggle`، تیک به‌صورت خودکار **برمی‌گردد** — بدون هیچ کد rollback.

## گام ۶: آیتم با ویرایش درجا

```tsx title="src/features/tasks/TaskItem.tsx (1/2)"
import { useState, useRef, useEffect } from 'react';
import type { Task } from './types';

type Props = {
  task: Task;
  onToggle: () => void;
  onRemove: () => void;
  onRename: (title: string) => void;
};

export function TaskItem({ task, onToggle, onRemove, onRename }: Props) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit(value: string) {
    const title = value.trim();
    if (title && title !== task.title) onRename(title);
    setEditing(false);
  }
```

و ادامه همان فایل — JSX آیتم. کلید طراحی: در حالت ویرایش، ورودی **uncontrolled** است (`defaultValue`) و فقط هنگام blur یا Enter مقدار نهایی خوانده می‌شود؛ بنابراین هر کلید، رندر مجدد لیست را نمی‌سازد:

```tsx title="src/features/tasks/TaskItem.tsx (2/2)"
  return (
    <li className="flex items-center gap-3 px-3 py-2">
      <input
        type="checkbox"
        checked={task.done}
        onChange={onToggle}
        aria-label="انجام شد"
      />

      {editing ? (
        <input
          ref={inputRef}
          defaultValue={task.title}
          className="flex-1 rounded border px-2 py-1"
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit(e.currentTarget.value);
            if (e.key === 'Escape') setEditing(false);
          }}
        />
      ) : (
        <span
          onDoubleClick={() => setEditing(true)}
          className={`flex-1 ${task.done ? 'text-slate-400 line-through' : ''}`}
        >
          {task.title}
        </span>
      )}

      <button
        onClick={onRemove}
        aria-label="حذف"
        className="text-slate-400 hover:text-red-600"
      >
        ✕
      </button>
    </li>
  );
}
```

## گام ۷: اتصال همه‌چیز

```tsx title="src/app/router.tsx"
import { createBrowserRouter } from 'react-router';
import { RootLayout } from './RootLayout';
import { TasksPage, tasksLoader } from '@/features/tasks/TasksPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [{ index: true, element: <TasksPage />, loader: tasksLoader }],
  },
]);
```

```tsx title="src/main.tsx"
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { router } from '@/app/router';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
);
```

## چه چیزی یاد گرفتیم؟

| مفهوم | کجا استفاده شد |
|---|---|
| Actions و `useActionState` | فرم افزودن با اعتبارسنجی |
| `useOptimistic` + `useTransition` | تیک و حذف آنی با rollback خودکار |
| Loader و revalidate | واکشی اولیه و همگام‌سازی |
| Search params | فیلتر قابل bookmark |
| `useRef` + `useEffect` | فوکوس و انتخاب متن هنگام ویرایش |
| Context | تم |
| ساختار feature-based | پوشه `features/tasks` مستقل و قابل‌حمل |

:::exercise تمرین‌های تکمیلی
۱) جابه‌جایی ترتیب با drag & drop (کتابخانه `@dnd-kit/core`) و Optimistic UI. ۲) جایگزینی API شبیه‌سازی‌شده با `json-server` واقعی. ۳) افزودن TanStack Query به‌جای `useRevalidator` و مقایسه تجربه. ۴) نوشتن تست برای `AddTaskForm` با Testing Library (فصل ۲۷).
:::
