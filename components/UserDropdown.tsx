"use client"
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext"; // 1. Import the auth hook

export default function UserDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const t = useTranslations("dashboard");
    const router = useRouter();
    const menuRef = useRef<HTMLDivElement>(null);

    
    // 2. Extract real user data and logout function from context
    const { user, logout } = useAuth();

    // 3. Generate initials dynamically based on the real user
    const initials = user 
        ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
        : "??";

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // If there's no user for some reason, don't render the dropdown
    if (!user) return null;

    return (
        <div className="relative" ref={menuRef}>
            {/* Trigger: Small avatar */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm transition-transform hover:scale-105 active:scale-95 border-2 border-white ring-1 ring-gray-100"
                style={{
                    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                }}
            >
                {initials}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in duration-200">

                    {/* Menu header with REAL user data */}
                    <div className="flex flex-col items-center px-4 py-6 bg-gray-50/50 border-b border-gray-100">
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mb-3 shadow-md border-4 border-white"
                            style={{
                                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                            }}
                        >
                            {initials}
                        </div>
                        <p className="text-base font-bold text-gray-800 text-center">
                            {user.first_name} {user.last_name} {user.role.name}
                            console.log({user.id}, {user.first_name}, {user.last_name}, {user.role.name})
                        </p>
                        <p className="text-xs text-gray-400 text-center">{user.email}</p>
                    </div>

                    <div className="p-2 space-y-1">
                        <button
                            onClick={() => { router.push('/dashboard/profile'); setIsOpen(false) }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors group"
                        >
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-medium">{t('profile')}</span>
                        </button>

                        <button
                            onClick={() => { router.push('/dashboard/settings'); setIsOpen(false) }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors group"
                        >
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            </svg>
                            <span className="font-medium">{t('settings')}</span>
                        </button>
                    </div>

                    {/* Footer: Logout (Using the context function) */}
                    <div className="p-2 border-t border-gray-50 bg-gray-50/30">
                        <button
                            onClick={() => logout()} // 4. Execute the real logout
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 bg-red-50/50 hover:bg-red-50 rounded-xl transition-colors group"
                        >
                            <svg className="w-5 h-5 text-red-400 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="font-semibold">{t('logout')}</span>
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
}