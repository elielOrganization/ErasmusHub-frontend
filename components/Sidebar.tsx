"use client"
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { useSidebar } from '@/context/SidebarContext';
import { usePWA } from '@/hooks/usePWA';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';

export default function Sidebar() {
    const t = useTranslations('dashboard');
    const tp = useTranslations('practicas');
    const te = useTranslations('exenciones');
    const tt = useTranslations('tareas');
    const ta = useTranslations('avisos');
    const pathname = usePathname();
    const { isCollapsed, toggleSidebar } = useSidebar();
    const { isInstallable, installApp } = usePWA();
    const { user } = useAuth();

    const isStudent = user?.role?.name.includes('Student');

    // Fetch unread notifications count for badge
    const { data: unreadData } = useApi<{ count: number }>('/notifications/me/unread-count');
    const unreadCount = unreadData?.count || 0;

    const defaultItems = [
        { name: t('home'), path: '/dashboard', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
        { name: t('students'), path: '/dashboard/students', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /> },
        { name: t('documents'), path: '/dashboard/documents', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /> },
        { name: t('settings'), path: '/dashboard/settings', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> },
    ];

    const studentItems = [
        { name: t('home'), path: '/dashboard', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
        { name: tp('title'), path: '/dashboard/practicas', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /> },
        { name: te('title'), path: '/dashboard/exenciones', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
        { name: tt('title'), path: '/dashboard/tareas', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /> },
        { name: ta('title'), path: '/dashboard/avisos', badge: unreadCount, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /> },
    ];

    const menuItems = isStudent ? studentItems : defaultItems;

    return (
        <aside className={`fixed left-0 top-12 h-[calc(100vh-3rem)] bg-white border-r border-gray-200 flex flex-col z-20 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>

            <div className="px-4 py-6 flex items-center justify-center relative">
                <div className={`bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'}`}>
                    <svg className={`${isCollapsed ? 'w-6 h-6' : 'w-7 h-7'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                </div>
            </div>

            <button
                onClick={toggleSidebar}
                className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 z-30 transition-transform duration-300"
                style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
                {menuItems.map((item) => {
                    const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <svg className={`w-5 h-5 shrink-0 ${isActive ? "text-blue-600" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                {item.icon}
                            </svg>
                            <span className={`text-sm whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                                {item.name}
                            </span>
                            {'badge' in item && (item as { badge?: number }).badge ? (
                                <span className={`ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1.5 transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                                    {(item as { badge?: number }).badge}
                                </span>
                            ) : null}
                        </Link>
                    );
                })}
            </nav>

            {isInstallable && (
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={installApp}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 justify-center`}
                        title={t('installApp')}
                    >
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span className={`text-sm font-medium whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'hidden' : 'block'}`}>
                            {t('installApp')}
                        </span>
                    </button>
                </div>
            )}
        </aside>
    );
}
