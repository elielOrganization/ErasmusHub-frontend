"use client"
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from "../dropdowns/LanguageSwitcher";
import UserMenuDropdown from "../dropdowns/UserMenuDropdown";
import NotificationDropdown from "../dropdowns/NotificationDropdown";
import ChatDropdown from "../dropdowns/ChatDropdown";
import { Link } from '@/i18n/routing';
import { useSidebar } from '@/context/SidebarContext';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { useRolePreview } from '@/context/RolePreviewContext';
import type { PreviewRole } from '@/context/RolePreviewContext';
import { useAuth } from '@/context/AuthContext';

const ROLE_BUTTONS: {
    id: PreviewRole;
    translationKey: string;
    activeClass: string;
    inactiveClass: string;
    dotClass: string;
    activeDotClass: string;
}[] = [
    {
        id: null,
        translationKey: 'administrator',
        activeClass: 'bg-purple-600 text-white',
        inactiveClass: 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20',
        dotClass: 'bg-purple-500',
        activeDotClass: 'bg-purple-600',
    },
    {
        id: 'student',
        translationKey: 'student',
        activeClass: 'bg-emerald-600 text-white',
        inactiveClass: 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
        dotClass: 'bg-emerald-500',
        activeDotClass: 'bg-emerald-600',
    },
    {
        id: 'teacher',
        translationKey: 'professor',
        activeClass: 'bg-blue-600 text-white',
        inactiveClass: 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
        dotClass: 'bg-blue-500',
        activeDotClass: 'bg-blue-600',
    },
    {
        id: 'coordinator',
        translationKey: 'coordinator',
        activeClass: 'bg-blue-500 text-white',
        inactiveClass: 'text-blue-500 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20',
        dotClass: 'bg-blue-400',
        activeDotClass: 'bg-blue-500',
    },
    {
        id: 'lector',
        translationKey: 'reader',
        activeClass: 'bg-gray-500 text-white',
        inactiveClass: 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
        dotClass: 'bg-gray-400',
        activeDotClass: 'bg-gray-500',
    },
];

export default function DashboardHeader() {
    const { isCollapsed, toggleSidebar } = useSidebar();
    const theme = useRoleTheme();
    const tRoles = useTranslations('roles');
    const { user } = useAuth();
    const { previewRole, setPreviewRole } = useRolePreview();

    const realRoleName = user?.role?.name || '';
    const isAdminUser = realRoleName.toLowerCase().includes('admin');



    const currentBtn = ROLE_BUTTONS.find(b => b.id === previewRole) ?? ROLE_BUTTONS[0];

    const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
    const roleDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!roleDropdownOpen) return;
        const handler = (e: MouseEvent) => {
            if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
                setRoleDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [roleDropdownOpen]);

    return (
        <header className="fixed top-0 left-0 w-full h-12 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center pl-0 sm:pl-16 pr-3 sm:pr-6 z-30 shadow-sm gap-2">

            {/* ── Mobile sidebar toggle (before title) ── */}
            <button
                onClick={toggleSidebar}
                className="md:hidden cursor-pointer group shrink-0 flex flex-row items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle menu"
            >
                <Image
                    src="/logoVector.svg"
                    alt="ErasmusHub"
                    width={32}
                    height={32}
                    className={`transition-all duration-300 ease-in-out group-hover:scale-110 group-active:scale-95 ${isCollapsed ? 'translate-x-0 opacity-100 rotate-0' : '-translate-x-4 opacity-0 rotate-[360deg]'}`}
                />
                <span
                    style={{ writingMode: 'vertical-lr', textOrientation: 'upright' }}
                    className={`text-[9px] font-semibold tracking-normal text-gray-400 dark:text-gray-500 leading-none transition-all duration-300 ${isCollapsed ? 'opacity-100' : 'opacity-0'}`}
                >
                    MENU
                </span>
            </button>

            {/* ── Title — left ── */}
            <Link
                href="/dashboard"
                className={`text-base sm:text-lg font-extrabold tracking-tight transition-colors whitespace-nowrap shrink-0 ml-2 sm:ml-0 ${theme.titleText} ${theme.titleHover}`}
            >
                ErasmusHub
            </Link>

            {/* ── Center: toggles + role pills ── */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                {/* Desktop role pills (admin only) */}
                {isAdminUser && (
                    <div className="hidden lg:flex items-center gap-1">
                        {ROLE_BUTTONS.map(({ id, translationKey, activeClass, inactiveClass, dotClass }) => {
                            const isActive = previewRole === id;
                            const label = tRoles(translationKey);
                            return (
                                <button
                                    key={id ?? 'admin'}
                                    onClick={() => setPreviewRole(id)}
                                    title={label}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                                        isActive ? activeClass : inactiveClass
                                    }`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-white/80' : dotClass}`} />
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="flex-1" />

            {/* ── Right: actions + mobile/tablet role pill (admin) ── */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* Mobile + tablet: role dropdown — only for admin */}
                {isAdminUser && (
                    <div className="lg:hidden relative" ref={roleDropdownRef}>
                        <button
                            onClick={() => setRoleDropdownOpen(o => !o)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 ${currentBtn.activeClass}`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" />
                            <span className="max-w-[90px] truncate">{tRoles(currentBtn.translationKey)}</span>
                            <svg className={`w-3 h-3 shrink-0 transition-transform duration-200 ${roleDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {roleDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden z-50">
                                {ROLE_BUTTONS.map(({ id, translationKey, activeClass, inactiveClass, dotClass }) => {
                                    const isActive = previewRole === id;
                                    const label = tRoles(translationKey);
                                    return (
                                        <button
                                            key={id ?? 'admin'}
                                            onClick={() => { setPreviewRole(id); setRoleDropdownOpen(false); }}
                                            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                                                isActive
                                                    ? activeClass
                                                    : `text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800`
                                            }`}
                                        >
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-white/80' : dotClass}`} />
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                <NotificationDropdown />
                <div className="hidden md:flex items-center gap-2 ml-1">
                    <div className="h-6 w-px bg-gray-100 dark:bg-gray-700" />
                    <LanguageSwitcher />
                </div>
                <UserMenuDropdown />
            </div>
        </header>
    );
}
