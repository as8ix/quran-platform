import "./globals.css";
import ToasterProvider from "./components/ToasterProvider";
import ThemeProvider from "./components/ThemeProvider";
import Footer from "./components/Footer";

export const viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata = {
  title: "منصة تحفيظ القرآن الكريم | Quran Memorization Platform",
  description: "منصة رقمية متكاملة لإدارة حلقات تحفيظ القرآن الكريم، تتيح للمعلمين متابعة حفظ الطلاب ومراجعتهم بسهولة ودقة.",
  applicationName: "Quran Platform",
  authors: [{ name: "Quran Platform Team" }],
  generator: "Next.js",
  keywords: ["قرآن", "تحفيظ", "حلقات", "تسميع", "إدارة حلقات", "Quran", "Memorization", "Halaqa"],
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
      <body className="antialiased flex flex-col min-h-screen transition-colors duration-300" suppressHydrationWarning>
        <ThemeProvider>
          <ToasterProvider />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
