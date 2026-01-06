export default function Footer() {
    return (
        <footer className="w-full py-6 text-center text-gray-500 text-sm mt-auto border-t border-gray-100 bg-white/50 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2">
                <span>هل تحتاج إلى مساعدة؟</span>
                <a
                    href="https://wa.me/966509762389"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-green-600 hover:text-green-700 font-semibold transition-colors"
                >
                    <span>تواصل معنا عبر واتساب</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.05 12.05 0 0 0 .57 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.03 12.03 0 0 0 2.81.57A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                </a>
            </div>
            <div className="mt-1 text-xs opacity-70">
                © {new Date().getFullYear()} منصة تحفيظ القرآن الكريم. جميع الحقوق محفوظة.
            </div>
        </footer>
    );
}
