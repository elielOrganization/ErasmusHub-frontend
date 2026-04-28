"use client"
import Image from 'next/image';
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

    const cycleRole = () => {
        const ids = ROLE_BUTTONS.map(b => b.id);
        const idx = ids.indexOf(previewRole);
        setPreviewRole(ids[(idx + 1) % ids.length] as PreviewRole);
    };

    return (
        <header className="fixed top-0 left-0 w-full h-12 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-3 sm:px-6 z-30 shadow-sm gap-2">

            {/* ── Left: sidebar toggle + desktop role pills ── */}
            <div className="flex items-center gap-2 shrink-0">
                {/* Mobile sidebar toggle — always visible */}
                <button
                    onClick={toggleSidebar}
                    className="md:hidden cursor-pointer group"
                    aria-label="Toggle menu"
                >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${theme.logoBg}`}>
                        <Image
                            src="/logoVector.svg"
                            alt="ErasmusHub"
                            width={20}
                            height={20}
                            className="w-5 h-5 transition-transform group-hover:scale-110 group-active:scale-95"
                        />
                    </div>
                </button>

                {/* Desktop: collapsed logo button */}
                <button
                    onClick={toggleSidebar}
                    className={`hidden md:flex cursor-pointer group transition-all duration-300 ${isCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    aria-label="Toggle sidebar"
                >
                    <Image
                        src="/logoVector.svg"
                        alt="ErasmusHub"
                        width={32}
                        height={32}
                        className="w-8 h-8 transition-transform group-hover:scale-110"
                    />
                </button>

                {/* Desktop: full role pills (admin only) */}
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

            {/* ── Center: title — flex-1 so it sits between sides without overlapping ── */}
            <div className="flex-1 min-w-0 flex justify-center">
                <Link
                    href="/dashboard"
                    className={`text-base sm:text-lg font-extrabold tracking-tight transition-colors whitespace-nowrap ${theme.titleText} ${theme.titleHover}`}
                >
                    ErasmusHub
                </Link>
            </div>

            {/* ── Right: actions + mobile/tablet role pill (admin) ── */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* Mobile + tablet: compact role cycling pill — only for admin */}
                {isAdminUser && (
                    <button
                        onClick={cycleRole}
                        title={tRoles(currentBtn.translationKey)}
                        className={`lg:hidden inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 ${currentBtn.activeClass}`}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" />
                        <span className="max-w-[56px] truncate">{tRoles(currentBtn.translationKey)}</span>
                    </button>
                )}

                <ChatDropdown />
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
