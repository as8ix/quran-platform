import "./globals.css";
import ToasterProvider from "./components/ToasterProvider";

import Footer from "./components/Footer";

export const metadata = {
  // ... (metadata kept as is, but we are replacing lines before RootLayout primarily)
  // To avoid replacing large block, I will target the imports and RootLayout return separately if possible, 
  // but `replace_file_content` works on contiguous blocks. 
  // Let's rely on finding imports and then finding body content.
  // Actually, I'll just rewrite the import and the function body since it's small enough.
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
    icon: "/logo.svg",
    apple: "/logo.svg",
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
      <body className="antialiased flex flex-col min-h-screen" suppressHydrationWarning>
        <ToasterProvider />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
