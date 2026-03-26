"use client"
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from "../dropdowns/LanguageSwitcher";
import UserMenuDropdown from "../dropdowns/UserMenuDropdown";
import NotificationDropdown from "../dropdowns/NotificationDropdown";
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
}[] = [
    {
        id: null,
        translationKey: 'administrator',
        activeClass: 'bg-purple-600 text-white',
        inactiveClass: 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20',
        dotClass: 'bg-purple-500',
    },
    {
        id: 'student',
        translationKey: 'student',
        activeClass: 'bg-emerald-600 text-white',
        inactiveClass: 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
        dotClass: 'bg-emerald-500',
    },
    {
        id: 'teacher',
        translationKey: 'professor',
        activeClass: 'bg-blue-600 text-white',
        inactiveClass: 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
        dotClass: 'bg-blue-500',
    },
    {
        id: 'coordinator',
        translationKey: 'coordinator',
        activeClass: 'bg-blue-500 text-white',
        inactiveClass: 'text-blue-500 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20',
        dotClass: 'bg-blue-400',
    },
    {
        id: 'lector',
        translationKey: 'reader',
        activeClass: 'bg-gray-500 text-white',
        inactiveClass: 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
        dotClass: 'bg-gray-400',
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

    return (
        <header className="fixed top-0 left-0 w-full h-12 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sm:px-6 z-30 shadow-sm">
            {/* Left: mobile logo + role switcher (admin only) */}
            <div className="flex items-center gap-3">
                <button
                    onClick={toggleSidebar}
                    className={`md:hidden cursor-pointer group transition-all duration-300 origin-left ${isCollapsed ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
                >
                    <Image
                        src="/logoVector.svg"
                        alt="ErasmusHub"
                        width={32}
                        height={32}
                        className="w-8 h-8 transition-transform duration-300 group-hover:scale-110 group-active:scale-95"
                    />
                </button>

                {/* Role preview buttons — only for admins, desktop only */}
                {isAdminUser && (
                    <div className="hidden md:flex items-center gap-1">
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

                {/* Mobile: compact role dots (admin only) */}
                {isAdminUser && (
                    <div className="flex md:hidden items-center gap-1.5">
                        {ROLE_BUTTONS.map(({ id, translationKey, dotClass, activeClass }) => {
                            const isActive = previewRole === id;
                            return (
                                <button
                                    key={id ?? 'admin'}
                                    onClick={() => setPreviewRole(id)}
                                    title={tRoles(translationKey)}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                                        isActive ? activeClass : 'bg-gray-100 dark:bg-gray-800'
                                    }`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : dotClass}`} />
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* App title ABSOLUTELY CENTERED */}
            <Link href="/dashboard" className={`absolute left-1/2 -translate-x-1/2 text-xl font-extrabold tracking-tight transition-colors ${theme.titleText} ${theme.titleHover}`}>
                ErasmusHub
            </Link>

            {/* Controls on the right */}
            <div className="flex items-center gap-2">
                <NotificationDropdown />
                <div className="h-6 w-px bg-gray-100 dark:bg-gray-700 mx-1 hidden md:block"></div>
                <div className="hidden md:block">
                    <LanguageSwitcher />
                </div>
                <UserMenuDropdown />
            </div>
        </header>
    );
}
