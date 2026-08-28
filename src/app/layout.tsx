import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import MotionProvider from "@/components/providers/MotionProvider";
import "./globals.css";

const vazirmatn = localFont({
  src: [
    { path: "../fonts/Vazirmatn-Regular.woff2", weight: "400" },
    { path: "../fonts/Vazirmatn-Medium.woff2", weight: "500" },
    { path: "../fonts/Vazirmatn-Bold.woff2", weight: "700" },
    { path: "../fonts/Vazirmatn-ExtraBold.woff2", weight: "800" },
  ],
  variable: "--font-vazirmatn",
  display: "swap",
});

const jetbrains = localFont({
  src: [
    { path: "../fonts/JetBrainsMono-Regular.woff2", weight: "400" },
    { path: "../fonts/JetBrainsMono-Bold.woff2", weight: "700" },
  ],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rezaian-dev.github.io"),
  alternates: { canonical: "https://rezaian-dev.github.io/react-19-persian-guide/" },
  icons: { icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/react-logo-64.png` },
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/manifest.webmanifest`,
  title: "مرجع جامع React 19.2 | راهنمای فارسی از مقدماتی تا Production",
  description:
    "مرجع فارسی React 19.2 در ۳۷ فصل — کامپوننت‌ها، Hooks، Actions، useOptimistic، Suspense، React Compiler، تست، امنیت و معماری. رایگان و متن‌باز.",
  openGraph: {
    title: "مرجع جامع React 19.2 | راهنمای فارسی",
    description:
      "۳۷ فصل، ۲۳۹ صفحه — از JSX و State تا Actions، Suspense، Compiler و معماری Production‏.",
    url: "https://rezaian-dev.github.io/react-19-persian-guide/",
    siteName: "Persian Developer Handbook",
    images: [{ url: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/social-card.png`, width: 1280, height: 640 }],
    locale: "fa_IR",
    type: "book",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0e1a26",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const BOOK_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Book",
  name: "مرجع جامع React 19.2",
  alternateName: "React 19.2 Persian Guide",
  inLanguage: "fa",
  numberOfPages: 239,
  bookEdition: "1.0.3",
  bookFormat: "https://schema.org/EBook",
  datePublished: "2026",
  url: "https://rezaian-dev.github.io/react-19-persian-guide/",
  image: "https://rezaian-dev.github.io/react-19-persian-guide/social-card.png",
  description:
    "مرجع فارسی React 19.2 در ۳۷ فصل — کامپوننت‌ها، Hooks، Actions، Suspense، React Compiler، تست، امنیت و معماری.",
  author: { "@type": "Person", name: "محمدرضا رضائیان", url: "https://github.com/rezaian-dev" },
  license: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
  isAccessibleForFree: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} ${jetbrains.variable}`}>
      <body>
        <script
          type="application/ld+json"
          // Static, developer-authored metadata — no user input is interpolated.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(BOOK_JSONLD) }}
        />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
