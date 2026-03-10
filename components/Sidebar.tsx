"use client"
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { useSidebar } from '@/context/SidebarContext';
import { usePWA } from '@/hooks/usePWA';

export default function Sidebar() {
    const t = useTranslations('dashboard');
    const pathname = usePathname();
    const { isCollapsed, toggleSidebar } = useSidebar();
    
    const { isInstallable, installApp } = usePWA();

    const menuItems = [
        { name: t('home'), path: '/dashboard', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
        { name: t('students'), path: '/dashboard/students', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /> },
        { name: t('documents'), path: '/dashboard/documents', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /> },
        { name: t('settings'), path: '/dashboard/settings', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> },
    ];

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
                    const isActive = pathname === item.path;
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
                        </Link>
                    );
                })}
            </nav>

            {isInstallable && (
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={installApp}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 justify-center`}
                        title="Instalar App"
                    >
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span className={`text-sm font-medium whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'hidden' : 'block'}`}>
                            Instalar App
                        </span>
                    </button>
                </div>
            )}
        </aside>
    );
}