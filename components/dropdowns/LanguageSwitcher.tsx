"use client"
import { useState, useRef, useEffect, useTransition } from "react";
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { useRoleTheme } from '@/hooks/useRoleTheme';

const languages = [
    { code: "es", name: "ES", fullName: "Español", flag: "https://flagcdn.com/w40/es.png" },
    { code: "en", name: "EN", fullName: "English", flag: "https://flagcdn.com/w40/gb.png" },
    { code: "cs", name: "CS", fullName: "Čeština", flag: "https://flagcdn.com/w40/cz.png" },
];

export default function LanguageSwitcher({ dropUp = false }: { dropUp?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const theme = useRoleTheme();

    // next-intl tools
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const selected = languages.find(l => l.code === locale) || languages[0];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const changeLanguage = (nextLocale: string) => {
        setIsOpen(false);
        // startTransition ensures the URL changes without a hard page reload
        startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
        });
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                type="button"
                disabled={isPending}
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 bg-white/80 hover:bg-white backdrop-blur-sm px-3 py-2 rounded-full shadow-sm border ${theme.borderLight} transition-all duration-200 ${isPending ? 'opacity-50 cursor-wait' : ''}`}
            >
                <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-200 shrink-0">
                    <img src={selected.flag} alt={selected.fullName} className="w-full h-full object-cover" />
                </div>
                <span className="text-sm font-semibold text-gray-700">{selected.name}</span>
            </button>

            {isOpen && (
                <div className={`absolute w-36 bg-white rounded-2xl shadow-lg border ${theme.borderLight} overflow-hidden z-50 ${dropUp ? 'bottom-full mb-2 left-0' : 'right-0 mt-2'}`}>
                    <div className="py-1">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => changeLanguage(lang.code)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                  ${selected.code === lang.code ? `${theme.selectedBg} ${theme.selectedText} font-semibold` : "text-gray-600 hover:bg-gray-50"}
                `}
                            >
                                <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-200 shrink-0">
                                    <img src={lang.flag} alt={lang.fullName} className="w-full h-full object-cover" />
                                </div>
                                {lang.fullName}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}