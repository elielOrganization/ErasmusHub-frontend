"use client"
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useApi, apiPatch } from "@/hooks/useApi";
import { useNotificationPrefs, PREF_TYPE_MAP } from "@/hooks/useNotificationPrefs";
import { useRoleTheme } from "@/hooks/useRoleTheme";

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
    if (mins < 1) return "ahora";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return `${Math.floor(days / 7)}sem`;
}

export default function NotificationDropdown() {
    const theme = useRoleTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [show, setShow] = useState(false);
    const t = useTranslations("dashboard");
    const ta = useTranslations("avisos");
    const menuRef = useRef<HTMLDivElement>(null);
    const { prefs } = useNotificationPrefs();

    const { data, refetch } = useApi<PaginatedResponse<Notification>>("/notifications/me?page_size=20");

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

    const openDropdown = () => {
        setIsOpen(true);
        setMounted(true);
        requestAnimationFrame(() => requestAnimationFrame(() => setShow(true)));
    };

    const closeDropdown = () => {
        setShow(false);
        setTimeout(() => { setMounted(false); setIsOpen(false); }, 200);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeDropdown();
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

            {/* ── Bell button ── */}
            <button
                onClick={() => isOpen ? closeDropdown() : openDropdown()}
                className={`relative p-2 rounded-xl transition-all duration-200 active:scale-95 ${
                    isOpen
                        ? `${theme.accentBg} ${theme.accent}`
                        : `text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300`
                }`}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className={`absolute top-1.5 right-1.5 w-2 h-2 ${theme.badgeBg} rounded-full ring-2 ring-white dark:ring-gray-900`} />
                )}
            </button>

            {/* ── Dropdown ── */}
            {mounted && (
                <div className={`absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 transition-all duration-200 origin-top-right ${
                    show ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'
                }`}>

                    {/* Role accent bar */}
                    <div className={`h-1 w-full ${theme.btnPrimary}`} />

                    {/* Header */}
                    <div className="px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <svg className={`w-4 h-4 ${theme.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                                {t('notifications')}
                            </h3>
                            {unreadCount > 0 && (
                                <span className={`text-[10px] font-bold ${theme.badgeBg} text-white px-1.5 py-0.5 rounded-full leading-none`}>
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className={`text-[11px] font-semibold ${theme.accent} ${theme.accentHover} transition-colors`}
                            >
                                {ta('markAllRead')}
                            </button>
                        )}
                    </div>

                    <div className="h-px bg-gray-100 dark:bg-gray-800" />

                    {/* Notification list */}
                    <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-10 flex flex-col items-center gap-3">
                                <div className={`w-12 h-12 rounded-2xl ${theme.accentBg} flex items-center justify-center`}>
                                    <svg className={`w-6 h-6 ${theme.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </div>
                                <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
                                    {t('noNotifications')}
                                </p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`relative flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800/60 last:border-0 transition-colors ${
                                        !n.is_read
                                            ? `${theme.softBgHalf} ${theme.hoverSoftBgHalf}`
                                            : 'hover:bg-gray-50/60 dark:hover:bg-gray-800/20'
                                    }`}
                                >
                                    {/* Unread left accent */}
                                    {!n.is_read && (
                                        <div className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full ${theme.badgeBg}`} />
                                    )}

                                    {/* Icon */}
                                    <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                                        !n.is_read ? theme.accentBg : 'bg-gray-100 dark:bg-gray-800'
                                    }`}>
                                        <svg className={`w-4 h-4 ${!n.is_read ? theme.accent : 'text-gray-400 dark:text-gray-500'}`}
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[13px] leading-snug ${
                                            !n.is_read
                                                ? 'font-semibold text-gray-900 dark:text-white'
                                                : 'font-medium text-gray-500 dark:text-gray-400'
                                        }`}>
                                            {getMessage(n)}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                                                !n.is_read
                                                    ? `${theme.accentBg} ${theme.accentText}`
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                                            }`}>
                                                {getTypeLabel(n.type)}
                                            </span>
                                            <span className="text-[10px] text-gray-300 dark:text-gray-700">·</span>
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                                {timeAgo(n.created_at)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Mark read */}
                                    {!n.is_read && (
                                        <button
                                            onClick={(e) => handleMarkRead(e, n.id)}
                                            title={ta('markRead')}
                                            className={`shrink-0 mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center ${theme.accentBgHover} ${theme.accent} transition-colors`}
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
                    <div className="h-px bg-gray-100 dark:bg-gray-800" />
                    <div className="px-4 py-2.5">
                        <Link
                            href="/dashboard/notifications"
                            onClick={closeDropdown}
                            className={`flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl text-xs font-semibold transition-colors ${theme.accentBgHover} ${theme.accent}`}
                        >
                            {ta('title')}
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
