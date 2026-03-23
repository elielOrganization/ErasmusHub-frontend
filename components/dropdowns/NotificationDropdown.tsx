"use client"
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useApi, apiPatch } from "@/hooks/useApi";
import { useNotificationPrefs, PREF_TYPE_MAP } from "@/hooks/useNotificationPrefs";

interface Notification {
    id: number;
    title: string;
    body: string;
    type: string;
    is_read: boolean;
    created_at: string;
}

interface PaginatedResponse<T> {
    items: T[];
    total: number;
}

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const t = useTranslations("dashboard");
    const ta = useTranslations("avisos");
    const menuRef = useRef<HTMLDivElement>(null);
    const { prefs } = useNotificationPrefs();

    const { data, refetch } = useApi<PaginatedResponse<Notification>>("/notifications/me?page_size=20");

    // Filter by enabled types (same logic as avisos page)
    const enabledTypes: string[] = [];
    if (prefs.weeklyDigest) enabledTypes.push(...PREF_TYPE_MAP.weeklyDigest);
    if (prefs.applicationUpdates) enabledTypes.push(...PREF_TYPE_MAP.applicationUpdates);
    if (prefs.taskReminders) enabledTypes.push(...PREF_TYPE_MAP.taskReminders);

    const notifications = (data?.items ?? []).filter((n) => {
        const isKnownType = Object.values(PREF_TYPE_MAP).flat().includes(n.type);
        if (!isKnownType) return true;
        return enabledTypes.includes(n.type);
    });

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMarkRead = async (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        await apiPatch(`/notifications/${id}/read`);
        refetch();
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 transition-all relative"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                    <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{t('notifications')}</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs font-semibold bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                                    </svg>
                                </div>
                                <p className="text-xs text-gray-400">{t('noNotifications')}</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div key={n.id} className={`flex items-start gap-3 px-4 py-3 ${!n.is_read ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}>
                                    <div className={`mt-0.5 shrink-0 w-2 h-2 rounded-full ${!n.is_read ? "bg-blue-500" : "bg-transparent"}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{n.title}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">{n.body}</p>
                                    </div>
                                    {!n.is_read && (
                                        <button
                                            onClick={(e) => handleMarkRead(e, n.id)}
                                            className="shrink-0 text-[10px] text-blue-500 hover:underline"
                                        >
                                            {ta('markRead')}
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="px-4 py-2.5 border-t border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                        <Link
                            href="/dashboard/avisos"
                            onClick={() => setIsOpen(false)}
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            {ta('title')} →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}