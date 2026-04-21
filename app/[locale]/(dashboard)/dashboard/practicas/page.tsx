"use client";

import { useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ApplicationWithOpportunity {
    id: number;
    opportunity_id: number;
    status: string;
    applied_at: string;
    opportunity_name: string;
    opportunity_description: string | null;
    opportunity_country: string | null;
    opportunity_city: string | null;
    opportunity_institution: string | null;
    opportunity_start_date: string | null;
    opportunity_end_date: string | null;
    opportunity_status: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function isStudent(roleName: string | null | undefined): boolean {
    if (!roleName) return false;
    const r = roleName.toLowerCase();
    return r.indexOf("student") !== -1 ||
           r.indexOf("alumno")  !== -1 ||
           r.indexOf("estudiante") !== -1;
}

function countDays(start: string | null, end: string | null): number | null {
    if (!start || !end) return null;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(0, Math.round(diff / 86400000) + 1);
}

function formatDate(dateStr: string | null, locale: string): string {
    if (!dateStr) return "—";
    return new Date(dateStr + "T00:00:00").toLocaleDateString(locale, {
        day: "2-digit", month: "long", year: "numeric",
    });
}

function StatusBadge({ status, t }: { status: string; t: ReturnType<typeof useTranslations> }) {
    const map: Record<string, string> = {
        pending:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
        rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    };
    const labelKey = status === "pending" ? "statusPending"
                   : status === "approved" ? "statusApproved"
                   : "statusRejected";
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
            {t(labelKey)}
        </span>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PracticasPage() {
    const t      = useTranslations("practicas");
    const locale = useLocale();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const { data: applications, loading: dataLoading, error } =
        useApi<ApplicationWithOpportunity[]>("/applications/me/with-opportunity");

    // Sin sesión → login
    useEffect(() => {
        if (!authLoading && !user) {
            router.replace(`/${locale}/login`);
        }
    }, [authLoading, user, router, locale]);

    // Cargando auth
    if (authLoading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

    // Sin usuario (mientras redirige)
    if (!user) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

    // Solo alumnos
    if (!isStudent(user.role?.name)) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("errorLoad")}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t("title")}
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {t("pageSubtitle")}
                </p>
            </div>

            {/* Loading datos */}
            {dataLoading && (
                <div className="flex justify-center py-20">
                    <LoadingSpinner />
                </div>
            )}

            {/* Error */}
            {!dataLoading && error && (
                <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center">
                    <p className="text-sm text-red-600 dark:text-red-400">{t("errorLoad")}</p>
                </div>
            )}

            {/* Empty */}
            {!dataLoading && !error && applications?.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-16 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800">
                        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t("emptyTitle")}</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("emptyDesc")}</p>
                </div>
            )}

            {/* Cards */}
            {!dataLoading && !error && applications && applications.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                    {applications.map((app) => {
                        const days = countDays(app.opportunity_start_date, app.opportunity_end_date);
                        return (
                            <button
                                key={app.id}
                                onClick={() => router.push(`/${locale}/dashboard/practicas/${app.opportunity_id}`)}
                                className="group relative w-full text-left rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm transition-all hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            >
                                {/* Top row */}
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                                            <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                {app.opportunity_name}
                                            </h2>
                                            {app.opportunity_institution && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {app.opportunity_institution}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <StatusBadge status={app.status} t={t} />
                                </div>

                                {/* Meta pills */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {(app.opportunity_country || app.opportunity_city) && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 dark:bg-gray-800 px-3 py-1 text-xs text-gray-600 dark:text-gray-400">
                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {[app.opportunity_city, app.opportunity_country].filter(Boolean).join(", ")}
                                        </span>
                                    )}
                                    {days !== null && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 dark:bg-gray-800 px-3 py-1 text-xs text-gray-600 dark:text-gray-400">
                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {t("days", { count: days })}
                                        </span>
                                    )}
                                </div>

                                {/* Date range */}
                                <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
                                    <div className="text-center">
                                        <p className="text-[10px] uppercase tracking-wide text-gray-400">{t("labelStart")}</p>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {formatDate(app.opportunity_start_date, locale)}
                                        </p>
                                    </div>
                                    <svg className="h-4 w-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                    <div className="text-center">
                                        <p className="text-[10px] uppercase tracking-wide text-gray-400">{t("labelEnd")}</p>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {formatDate(app.opportunity_end_date, locale)}
                                        </p>
                                    </div>
                                </div>

                                {/* Arrow */}
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
