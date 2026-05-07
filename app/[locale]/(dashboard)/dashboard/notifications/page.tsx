"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { useRoleTheme } from "@/hooks/useRoleTheme";
import { useApi, apiPatch } from "@/hooks/useApi";
import { useNotificationPrefs, PREF_TYPE_MAP } from "@/hooks/useNotificationPrefs";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import RoleGuard from "@/components/ui/RoleGuard";
import Cookies from "js-cookie";
import { API_URL } from "@/lib/api";

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
    page: number;
    page_size: number;
}

type Filter = "all" | "unread";

function getEnabledTypes(prefs: ReturnType<typeof useNotificationPrefs>["prefs"]): string[] | null {
    const enabled: string[] = [];
    if (prefs.weeklyDigest) enabled.push(...PREF_TYPE_MAP.weeklyDigest);
    if (prefs.applicationUpdates) enabled.push(...PREF_TYPE_MAP.applicationUpdates);
    if (prefs.taskReminders) enabled.push(...PREF_TYPE_MAP.taskReminders);
    if (enabled.length === 0) return null;
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
    theme,
    onMarkRead,
}: {
    notif: Notification;
    t: ReturnType<typeof useTranslations>;
    theme: ReturnType<typeof useRoleTheme>;
    onMarkRead: (id: number) => void;
}) {
    const typeLabel = t.has(notif.type) ? t(notif.type) : t("unknown");
    const params = notif.params ? JSON.parse(notif.params) : {};
    const msgKey = `messages.${notif.message_key}`;
    const messageText = t.has(msgKey) ? t(msgKey, params) : notif.message_key;

    return (
        <div className={`relative flex gap-4 p-4 rounded-2xl border transition-all ${
            notif.is_read
                ? "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
                : `${theme.softBgHalf} ${notif.is_read ? '' : theme.borderLight}`
        }`}>
            {/* Unread left accent */}
            {!notif.is_read && (
                <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full ${theme.badgeBg}`} />
            )}

            {/* Icon */}
            <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center ${
                notif.is_read ? "bg-gray-100 dark:bg-gray-800" : theme.accentBg
            }`}>
                <svg className={`w-5 h-5 ${notif.is_read ? "text-gray-400 dark:text-gray-500" : theme.accent}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                    <p className={`text-sm leading-snug ${
                        notif.is_read
                            ? "font-medium text-gray-500 dark:text-gray-400"
                            : "font-semibold text-gray-900 dark:text-white"
                    }`}>
                        {messageText}
                    </p>
                    <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap mt-0.5">
                        {formatDate(notif.created_at)}
                    </span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        notif.is_read
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                            : `${theme.accentBg} ${theme.accentText}`
                    }`}>
                        {typeLabel}
                    </span>

                    {!notif.is_read && (
                        <button
                            onClick={() => onMarkRead(notif.id)}
                            className={`text-xs font-semibold ${theme.accent} ${theme.accentHover} transition-colors`}
                        >
                            {t("markRead")}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AvisosPage() {
    const t = useTranslations("avisos");
    const { loading: authLoading } = useAuth();
    const theme = useRoleTheme();
    const { prefs, loaded: prefsLoaded } = useNotificationPrefs();
    const [filter, setFilter] = useState<Filter>("all");
    const [markingAll, setMarkingAll] = useState(false);

    const { data, loading, refetch } = useApi<PaginatedResponse<Notification>>("/notifications/me?page_size=100");

    if (authLoading || !prefsLoaded) return <LoadingSpinner />;

    const enabledTypes = getEnabledTypes(prefs);
    const allDisabled = enabledTypes === null;

    const visibleNotifs = (data?.items ?? []).filter((n) => {
        if (allDisabled) return false;
        const isKnownType = Object.values(PREF_TYPE_MAP).flat().includes(n.type);
        if (!isKnownType) return true;
        if (!enabledTypes!.includes(n.type)) return false;
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
        <RoleGuard allowed={['student', 'admin', 'teacher']}>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl ${theme.accentBg} flex items-center justify-center`}>
                        <svg className={`w-5 h-5 ${theme.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
                        {!allDisabled && unreadCount > 0 && (
                            <p className={`text-xs font-medium ${theme.accent} mt-0.5`}>
                                {unreadCount} {t("unread").toLowerCase()}
                            </p>
                        )}
                    </div>
                </div>
                {!allDisabled && unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        disabled={markingAll}
                        className={`text-sm font-semibold ${theme.accent} ${theme.accentHover} transition-colors disabled:opacity-50`}
                    >
                        {t("markAllRead")}
                    </button>
                )}
            </div>

            {/* ── All types disabled ── */}
            {allDisabled ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className={`w-16 h-16 rounded-3xl ${theme.accentBg} flex items-center justify-center`}>
                        <svg className={`w-8 h-8 ${theme.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-base font-bold text-gray-700 dark:text-gray-300">{t("allDisabled")}</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs mt-1">{t("allDisabledDesc")}</p>
                    </div>
                    <Link
                        href="/dashboard/settings"
                        className={`px-5 py-2 rounded-xl text-sm font-semibold text-white ${theme.btnPrimary} ${theme.btnPrimaryHover} transition-colors`}
                    >
                        {t("goToSettings")}
                    </Link>
                </div>
            ) : (
                <>
                    {/* ── Filter tabs ── */}
                    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
                        {(["all", "unread"] as Filter[]).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                                    filter === f
                                        ? `bg-white dark:bg-gray-900 shadow-sm ${theme.accentText}`
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                }`}
                            >
                                {t(f === "all" ? "filterAll" : "filterUnread")}
                                {f === "unread" && unreadCount > 0 && (
                                    <span className={`text-[10px] font-bold ${theme.badgeBg} text-white rounded-full px-1.5 py-0.5 leading-none`}>
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* ── List ── */}
                    {loading ? (
                        <div className="flex justify-center py-16"><LoadingSpinner /></div>
                    ) : visibleNotifs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className={`w-16 h-16 rounded-3xl ${theme.accentBg} flex items-center justify-center`}>
                                <svg className={`w-8 h-8 ${theme.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-base font-bold text-gray-700 dark:text-gray-300">{t("noNotifications")}</p>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t("noNotificationsDesc")}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {visibleNotifs.map((notif) => (
                                <NotificationCard
                                    key={notif.id}
                                    notif={notif}
                                    t={t}
                                    theme={theme}
                                    onMarkRead={handleMarkRead}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
        </RoleGuard>
    );
}
