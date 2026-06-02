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
  metadataBase: new URL("https://mue3n.com"),
  title: {
    default: "منصة مُعِين | لإدارة حلقات تحفيظ القرآن الكريم",
    template: "%s | منصة مُعِين",
  },
  description: "المنصة الرقمية لإدارة حلقات تحفيظ القرآن الكريم. متابعة دقيقة لحفظ الطلاب ومراجعتهم، تسجيل الحضور والغياب، وإدارة الحلقات بسهولة وكفاءة.",
  applicationName: "منصة مُعِين",
  authors: [{ name: "مُعِين" }],
  generator: "Next.js",
  keywords: [
    "قرآن", "تحفيظ", "حلقات", "تسميع", "إدارة حلقات",
    "مُعِين", "حفظ القرآن",
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
    icon: "/logo.svg?v=3",
    apple: "/logo.svg?v=3",
    shortcut: "/logo.svg?v=3",
  },
  openGraph: {
    title: "منصة مُعِين",
    description: "المنصة الرقمية لإدارة حلقات تحفيظ القرآن الكريم. متابعة دقيقة لحفظ الطلاب ومراجعتهم، تسجيل الحضور والغياب، وإدارة الحلقات بسهولة وكفاءة.",
    url: "https://mue3n.com",
    siteName: "منصة مُعِين",
    images: [
      {
        url: "/logo.png",
        width: 1672,
        height: 1663,
        alt: "شعار منصة مُعِين",
      },
    ],
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "منصة مُعِين",
    description: "المنصة الرقمية لإدارة حلقات تحفيظ القرآن الكريم. متابعة دقيقة لحفظ الطلاب ومراجعتهم، تسجيل الحضور والغياب، وإدارة الحلقات بسهولة وكفاءة.",
    images: ["/logo.png"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "منصة مُعِين",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased flex flex-col min-h-screen transition-colors duration-300" suppressHydrationWarning>
        <ToasterProvider />
        <ThemeProvider>
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(let registration of registrations) {
                    registration.unregister();
                  }
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
