'use client';
import { Link, usePathname } from '@/i18n/routing';

interface Tab {
    label: string;
    href: string;
    icon?: React.ReactNode;
}

interface TabNavProps {
    tabs: Tab[];
}

export default function TabNavigation({ tabs }: TabNavProps) {
    const pathname = usePathname();

    return (
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="flex gap-0 -mb-px overflow-x-auto">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                                isActive
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
