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
  title: {
    default: "منصة تحفيظ القرآن الكريم | جامع الحديقة بحي السلامة",
    template: "%s | منصة تحفيظ جامع الحديقة",
  },
  description: "المنصة الرقمية لإدارة حلقات تحفيظ القرآن الكريم في جامع الحديقة بحي السلامة. متابعة دقيقة لحفظ الطلاب ومراجعتهم، تسجيل الحضور والغياب، وإدارة الحلقات بسهولة وكفاءة.",
  applicationName: "منصة تحفيظ جامع الحديقة",
  authors: [{ name: "جامع الحديقة بحي السلامة" }],
  generator: "Next.js",
  keywords: [
    "قرآن", "تحفيظ", "حلقات", "تسميع", "إدارة حلقات",
    "جامع الحديقة", "حي السلامة", "حفظ القرآن",
    "مراجعة", "حضور وغياب", "معلم قرآن",
    "Quran", "Memorization", "Halaqa", "Quran Platform"
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: "/mosque-logo.png",
    apple: "/mosque-logo.png",
    shortcut: "/mosque-logo.png",
  },
  openGraph: {
    title: "منصة تحفيظ القرآن الكريم | جامع الحديقة",
    description: "المنصة الرقمية لإدارة حلقات تحفيظ القرآن الكريم في جامع الحديقة بحي السلامة - متابعة حفظ الطلاب ومراجعتهم وتسجيل الحضور",
    url: "https://quran-platform-wheat.vercel.app",
    siteName: "منصة تحفيظ جامع الحديقة",
    images: [
      {
        url: "/mosque-logo.png",
        width: 512,
        height: 512,
        alt: "شعار جامع الحديقة بحي السلامة",
      },
    ],
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "منصة تحفيظ القرآن الكريم | جامع الحديقة",
    description: "المنصة الرقمية لإدارة حلقات تحفيظ القرآن الكريم في جامع الحديقة بحي السلامة",
    images: ["/mosque-logo.png"],
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
