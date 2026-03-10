"use client"
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const t = useTranslations("dashboard");
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full text-gray-400 hover:bg-gray-50 hover:text-blue-600 transition-all relative"
            >
                {/* Icono de Campana Relleno (Solid) */}
                <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                </svg>

                {/* Puntito de notificación activa */}
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                    <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                        <h3 className="text-sm font-bold text-gray-800">{t('notifications')}</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-8 text-center">
                        {/* Icono decorativo para estado vacío */}
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                            </svg>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">{t('noNotifications')}</p>
                    </div>
                </div>
            )}
        </div>
    );
}