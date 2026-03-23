"use client"
import Image from 'next/image';
import LanguageSwitcher from "../dropdowns/LanguageSwitcher";
import UserMenuDropdown from "../dropdowns/UserMenuDropdown";
import NotificationDropdown from "../dropdowns/NotificationDropdown";
import { Link } from '@/i18n/routing';
import { useSidebar } from '@/context/SidebarContext';
import { useRoleTheme } from '@/hooks/useRoleTheme';

export default function DashboardHeader() {
    const { isCollapsed, toggleSidebar } = useSidebar();
    const theme = useRoleTheme();

    return (
        <header className="fixed top-0 left-0 w-full h-12 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sm:px-6 z-30 shadow-sm">
            {/* Mobile: logo button | Desktop: spacer */}
            <div className="w-32 flex items-center">
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
