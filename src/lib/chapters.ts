export type Chapter = { n: number; title: string };

export type Part = {
  id: string;
  emoji: string;
  label: string;
  range: string;
  tagline: string;
  outcome: string;
  chapters: Chapter[];
};

export const PARTS: Part[] = [
  {
    id: "part-1",
    emoji: "🌱",
    label: "بنیادها و مفاهیم اصلی",
    range: "فصل‌های ۱ تا ۱۸",
    tagline: "JSX، Props، State، Hooks، Actions، Suspense، Context و پروژهٔ مدیریت وظایف.",
    outcome: "یک اپ کامل می‌سازی و رفتار رندر React را از ته می‌فهمی.",
    chapters: [
      { n: 1, title: "معرفی React و تازه‌های نسخه ۱۹" },
      { n: 2, title: "شروع به کار و ساختار پروژه" },
      { n: 3, title: "نقشه راه یادگیری" },
      { n: 4, title: "JSX و رندر عناصر" },
      { n: 5, title: "کامپوننت‌ها و Props" },
      { n: 6, title: "State و چرخه رندر" },
      { n: 7, title: "رویدادها و تعامل کاربر" },
      { n: 8, title: "قوانین Hooks و مرور همه هوک‌ها" },
      { n: 9, title: "فرم‌ها و Actions در React 19" },
      { n: 10, title: "useOptimistic و تجربه کاربری آنی" },
      { n: 11, title: "useEffect، useRef و useEffectEvent" },
      { n: 12, title: "واکشی داده، Suspense و use" },
      { n: 13, title: "Context و useReducer" },
      { n: 14, title: "هوک‌های سفارشی" },
      { n: 15, title: "TypeScript در React" },
      { n: 16, title: "روتینگ با React Router v8" },
      { n: 17, title: "استایل‌دهی، Tailwind v4 و Metadata" },
      { n: 18, title: "پروژه عملی: مدیریت وظایف کامل" },
    ],
  },
  {
    id: "part-2",
    emoji: "🏗️",
    label: "معماری و Production",
    range: "فصل‌های ۱۹ تا ۳۲",
    tagline: "Compiler، کارایی، state در مقیاس، الگوها، امنیت، تست و Server Components.",
    outcome: "معماری Production با مرزهای روشن و کیفیت قابل دفاع.",
    chapters: [
      { n: 19, title: "کارایی، React Compiler و Concurrent Rendering" },
      { n: 20, title: "مدیریت state در مقیاس: Zustand، Redux Toolkit و Jotai" },
      { n: 21, title: "معماری پروژه و Clean Code در React" },
      { n: 22, title: "الگوهای پیشرفته کامپوننت" },
      { n: 23, title: "فرم‌ها و اعتبارسنجی پیشرفته" },
      { n: 24, title: "مدیریت خطا — مرجع کامل" },
      { n: 25, title: "دسترسی‌پذیری، RTL و بین‌المللی‌سازی" },
      { n: 26, title: "امنیت اپلیکیشن React" },
      { n: 27, title: "تست‌نویسی: Vitest، Testing Library و Playwright" },
      { n: 28, title: "Server Components و Server Functions" },
      { n: 29, title: "انتخاب فریم‌ورک: Next.js، React Router و TanStack Start" },
      { n: 30, title: "Build، استقرار و Web Vitals" },
      { n: 31, title: "مهاجرت و ارتقا به React 19" },
      { n: 32, title: "انیمیشن، View Transitions و حس «نرم بودن»" },
    ],
  },
  {
    id: "part-3",
    emoji: "🛠️",
    label: "کارگاه و تثبیت",
    range: "فصل‌های ۳۳ تا ۳۵",
    tagline: "ترفندهای طلایی، هشت مینی‌پروژه و بهترین شیوه‌ها.",
    outcome: "تثبیت مهارت روی پروژه‌های واقعی.",
    chapters: [
      { n: 33, title: "نکات و ترفندهای طلایی" },
      { n: 34, title: "کارگاه مینی‌پروژه‌ها" },
      { n: 35, title: "بهترین شیوه‌ها، اشتباهات رایج و منابع" },
    ],
  },
  {
    id: "part-4",
    emoji: "🏁",
    label: "مرجع و آمادگی شغلی",
    range: "فصل‌های ۳۶ تا ۳۷",
    tagline: "پرسش‌های مصاحبه از Junior تا Senior و واژه‌نامهٔ فارسی–انگلیسی.",
    outcome: "آمادگی مصاحبه و مرجع سریع اصطلاحات.",
    chapters: [
      { n: 36, title: "پرسش‌های مصاحبه (Junior تا Senior)" },
      { n: 37, title: "واژه‌نامه فارسی–انگلیسی" },
    ],
  },
];

export const TOTAL_CHAPTERS = PARTS.reduce((sum, p) => sum + p.chapters.length, 0);
