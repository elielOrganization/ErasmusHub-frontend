"use client"
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useApi, apiPatch } from "@/hooks/useApi";
import { useNotificationPrefs, PREF_TYPE_MAP } from "@/hooks/useNotificationPrefs";

interface Notification {
    id: number;
    message_key: string;
    params: string | null;
    type: string;
    is_read: boolean;
    created_at: string;
}

interface PaginatedResponse<T> {
    items: T[];
    total: number;
}

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return `${Math.floor(days / 7)}w`;
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
        e.stopPropagation();
        await apiPatch(`/notifications/${id}/read`);
        refetch();
    };

    const handleMarkAllRead = async () => {
        for (const n of notifications.filter((n) => !n.is_read)) {
            await apiPatch(`/notifications/${n.id}/read`);
        }
        refetch();
    };

    const getMessage = (n: Notification): string => {
        const key = `messages.${n.message_key}`;
        if (ta.has(key)) {
            const params = n.params ? JSON.parse(n.params) : {};
            return ta(key, params);
        }
        return n.message_key;
    };

    const getTypeLabel = (type: string): string => {
        return ta.has(type) ? ta(type) : ta("unknown");
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
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/60 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{t('notifications')}</h3>
                            {unreadCount > 0 && (
                                <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                {ta('markAllRead')}
                            </button>
                        )}
                    </div>

                    {/* Notification list */}
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500">{t('noNotifications')}</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800/50 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30 ${
                                        !n.is_read ? "bg-blue-50/60 dark:bg-blue-950/20" : ""
                                    }`}
                                >
                                    {/* Icon */}
                                    <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                        !n.is_read
                                            ? "bg-blue-100 dark:bg-blue-900/40"
                                            : "bg-gray-100 dark:bg-gray-800"
                                    }`}>
                                        <svg className={`w-4 h-4 ${!n.is_read ? "text-blue-500 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`}
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[13px] leading-snug ${
                                            !n.is_read
                                                ? "font-semibold text-gray-900 dark:text-white"
                                                : "font-medium text-gray-600 dark:text-gray-300"
                                        }`}>
                                            {getMessage(n)}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                                {getTypeLabel(n.type)}
                                            </span>
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                                {timeAgo(n.created_at)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Mark read button */}
                                    {!n.is_read && (
                                        <button
                                            onClick={(e) => handleMarkRead(e, n.id)}
                                            title={ta('markRead')}
                                            className="shrink-0 mt-1 w-6 h-6 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/60 text-center">
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