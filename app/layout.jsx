import "./globals.css";
import ToasterProvider from "./components/ToasterProvider";

export const metadata = {
  title: "منصة تحفيظ القرآن الكريم | Quran Memorization Platform",
  description: "منصة رقمية متكاملة لإدارة حلقات تحفيظ القرآن الكريم، تتيح للمعلمين متابعة حفظ الطلاب ومراجعتهم بسهولة ودقة.",
  applicationName: "Quran Platform",
  authors: [{ name: "Quran Platform Team" }],
  generator: "Next.js",
  keywords: ["قرآن", "تحفيظ", "حلقات", "تسميع", "إدارة حلقات", "Quran", "Memorization", "Halaqa"],
  themeColor: "#059669",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "منصة تحفيظ القرآن الكريم",
    description: "منصة رقمية متكاملة لإدارة حلقات تحفيظ القرآن الكريم",
    url: "https://quran-platform.vercel.app",
    siteName: "منصة تحفيظ القرآن",
    locale: "ar_SA",
    type: "website",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased" suppressHydrationWarning>
        <ToasterProvider />
        {children}
      </body>
    </html>
  );
}
