import "./globals.css";
import ToasterProvider from "./components/ToasterProvider";

export const metadata = {
  title: "منصة تحفيظ القرآن الكريم | Quran Memorization Platform",
  description: "منصة متابعة حفظ القرآن الكريم للطلاب والمعلمين والمشرفين",
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
