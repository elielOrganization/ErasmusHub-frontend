"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { useRoleTheme } from "@/hooks/useRoleTheme";
import { useApi, apiPatch } from "@/hooks/useApi";
import { useNotificationPrefs, PREF_TYPE_MAP } from "@/hooks/useNotificationPrefs";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Cookies from "js-cookie";
import { API_URL } from "@/lib/api";

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
    page: number;
    page_size: number;
}

type Filter = "all" | "unread";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEnabledTypes(prefs: ReturnType<typeof useNotificationPrefs>["prefs"]): string[] | null {
    const enabled: string[] = [];
    if (prefs.weeklyDigest) enabled.push(...PREF_TYPE_MAP.weeklyDigest);
    if (prefs.applicationUpdates) enabled.push(...PREF_TYPE_MAP.applicationUpdates);
    if (prefs.taskReminders) enabled.push(...PREF_TYPE_MAP.taskReminders);
    if (enabled.length === 0) return null; // all disabled
    return enabled;
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── NotificationCard ─────────────────────────────────────────────────────────

function NotificationCard({
    notif,
    t,
    onMarkRead,
}: {
    notif: Notification;
    t: ReturnType<typeof useTranslations>;
    onMarkRead: (id: number) => void;
}) {
    const typeLabel = (t as (k: string) => string)(notif.type) !== notif.type
        ? (t as (k: string) => string)(notif.type)
        : (t as (k: string) => string)("unknown");

    return (
        <div className={`flex gap-4 p-4 rounded-xl border transition-all ${notif.is_read
            ? "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
            : "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900"
            }`}>
            {/* Icon */}
            <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${notif.is_read
                ? "bg-gray-100 dark:bg-gray-800"
                : "bg-blue-100 dark:bg-blue-900/50"
                }`}>
                <svg className={`w-5 h-5 ${notif.is_read ? "text-gray-400 dark:text-gray-500" : "text-blue-500 dark:text-blue-400"}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${notif.is_read ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-white"}`}>
                            {notif.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.body}</p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                            {formatDate(notif.created_at)}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                            {typeLabel}
                        </span>
                    </div>
                </div>

                {!notif.is_read && (
                    <button
                        onClick={() => onMarkRead(notif.id)}
                        className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        {t("markRead")}
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AvisosPage() {
    const t = useTranslations("avisos");
    const { user, loading: authLoading } = useAuth();
    const theme = useRoleTheme();
    const { prefs, loaded: prefsLoaded } = useNotificationPrefs();
    const [filter, setFilter] = useState<Filter>("all");
    const [markingAll, setMarkingAll] = useState(false);

    const { data, loading, refetch } = useApi<PaginatedResponse<Notification>>("/notifications/me?page_size=100");

    if (authLoading || !prefsLoaded) return <LoadingSpinner />;

    const enabledTypes = getEnabledTypes(prefs);
    const allDisabled = enabledTypes === null;

    // Filter notifications: only show those whose type is enabled in settings
    const visibleNotifs = (data?.items ?? []).filter((n) => {
        if (allDisabled) return false;
        const typeEnabled = enabledTypes!.includes(n.type);
        // If type doesn't match any known category, show it anyway
        const isKnownType = Object.values(PREF_TYPE_MAP).flat().includes(n.type);
        if (!isKnownType) return true;
        if (!typeEnabled) return false;
        if (filter === "unread") return !n.is_read;
        return true;
    });

    const unreadCount = visibleNotifs.filter((n) => !n.is_read).length;

    const handleMarkRead = async (id: number) => {
        await apiPatch(`/notifications/${id}/read`);
        refetch();
    };

    const handleMarkAllRead = async () => {
        setMarkingAll(true);
        try {
            const token = Cookies.get("auth_token");
            await fetch(`${API_URL}/notifications/me/read-all`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
            refetch();
        } finally {
            setMarkingAll(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
                    {!allDisabled && unreadCount > 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {unreadCount} {t("unread").toLowerCase()}
                        </p>
                    )}
                </div>
                {!allDisabled && unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        disabled={markingAll}
                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                    >
                        {t("markAllRead")}
                    </button>
                )}
            </div>

            {/* All types disabled */}
            {allDisabled ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    </div>
                    <p className="text-base font-semibold text-gray-700 dark:text-gray-300">{t("allDisabled")}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">{t("allDisabledDesc")}</p>
                    <Link href="/dashboard/settings"
                        className={`mt-2 px-4 py-2 rounded-lg text-sm font-semibold text-white ${theme.activeBg}`}>
                        {t("goToSettings")}
                    </Link>
                </div>
            ) : (
                <>
                    {/* Filter tabs */}
                    <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
                        {(["all", "unread"] as Filter[]).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${filter === f
                                    ? `border-blue-500 text-blue-600 dark:text-blue-400`
                                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                    }`}
                            >
                                {t(f === "all" ? "filterAll" : "filterUnread")}
                                {f === "unread" && unreadCount > 0 && (
                                    <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* List */}
                    {loading ? (
                        <div className="flex justify-center py-12"><LoadingSpinner /></div>
                    ) : visibleNotifs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                            <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <p className="text-base font-semibold text-gray-700 dark:text-gray-300">{t("noNotifications")}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t("noNotificationsDesc")}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {visibleNotifs.map((notif) => (
                                <NotificationCard key={notif.id} notif={notif} t={t} onMarkRead={handleMarkRead} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
