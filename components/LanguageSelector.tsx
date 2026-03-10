"use client"
import { useState, useRef, useEffect, useTransition } from "react";
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';

const languages = [
    { code: "es", name: "ES", fullName: "Español", flag: "https://flagcdn.com/w40/es.png" },
    { code: "en", name: "EN", fullName: "English", flag: "https://flagcdn.com/w40/gb.png" },
    { code: "cs", name: "CS", fullName: "Čeština", flag: "https://flagcdn.com/w40/cz.png" },
];

export default function LanguageSelector() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Herramientas de next-intl
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
        // startTransition asegura que la URL cambie sin recargar la página bruscamente
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
                className={`flex items-center gap-2 bg-white/80 hover:bg-white backdrop-blur-sm px-3 py-2 rounded-full shadow-sm border border-blue-100 transition-all duration-200 ${isPending ? 'opacity-50 cursor-wait' : ''}`}
            >
                <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-200 shrink-0">
                    <img src={selected.flag} alt={selected.fullName} className="w-full h-full object-cover" />
                </div>
                <span className="text-sm font-semibold text-gray-700">{selected.name}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-2xl shadow-lg border border-blue-50 overflow-hidden z-50">
                    <div className="py-1">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => changeLanguage(lang.code)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                  ${selected.code === lang.code ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50"}
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