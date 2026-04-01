"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useApi } from "@/hooks/useApi";
import { useRoleTheme } from "@/hooks/useRoleTheme";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// ─────────────────────────────────────────────────────────────────────────────
// TODO: Connect endpoint when backend is ready
// Expected: GET /documents/pending
// Response: StudentDocSummary[]
// ─────────────────────────────────────────────────────────────────────────────

interface StudentDocSummary {
    user_id: number;
    user_name: string;
    email: string;
    pending: number;
    approved: number;
    rejected: number;
    total: number;
}

type FilterType = "all" | "pending" | "reviewed";

export default function RevisionPage() {
    const t = useTranslations("revision");
    const theme = useRoleTheme();
    const [filter, setFilter] = useState<FilterType>("all");

    // TODO: Replace "/documents/pending" with the real endpoint when ready
    const { data, loading, error } = useApi<StudentDocSummary[]>("/documents/pending");

    const students = data ?? [];

    const filtered = students.filter((s) => {
        if (filter === "pending") return s.pending > 0;
        if (filter === "reviewed") return s.pending === 0 && s.total > 0;
        return true;
    });

    const totalPending = students.reduce((acc, s) => acc + s.pending, 0);
    const totalReviewed = students.filter((s) => s.pending === 0 && s.total > 0).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("pageTitle")}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("statStudents")}</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{students.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("statPending")}</p>
                    <p className={`text-2xl font-bold mt-1 ${totalPending > 0 ? "text-amber-500" : "text-gray-800 dark:text-white"}`}>
                        {totalPending}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("statReviewed")}</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{totalReviewed}</p>
                </div>
            </div>

            {/* Table card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                {/* Filter tabs */}
                <div className="flex items-center gap-1 p-4 border-b border-gray-100 dark:border-gray-800">
                    {(["all", "pending", "reviewed"] as FilterType[]).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                filter === f
                                    ? `${theme.activeBg} text-white`
                                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                        >
                            {(t as (k: string) => string)(`filter_${f}`)}
                        </button>
                    ))}
                </div>

                {/* Endpoint not ready notice */}
                {error && (
                    <div className="p-8 text-center">
                        <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-gray-400 dark:text-gray-500">{t("endpointPending")}</p>
                    </div>
                )}

                {/* Empty state */}
                {!error && filtered.length === 0 && (
                    <div className="p-12 text-center">
                        <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm text-gray-400 dark:text-gray-500">{t("empty")}</p>
                    </div>
                )}

                {/* Student table */}
                {!error && filtered.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800">
                                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">
                                        {t("colStudent")}
                                    </th>
                                    <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">
                                        {t("colPending")}
                                    </th>
                                    <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">
                                        {t("colApproved")}
                                    </th>
                                    <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">
                                        {t("colRejected")}
                                    </th>
                                    <th className="px-5 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filtered.map((s) => (
                                    <tr key={s.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.user_name}</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">{s.email}</p>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            {s.pending > 0 ? (
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold">
                                                    {s.pending}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300 dark:text-gray-600">—</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            {s.approved > 0 ? (
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold">
                                                    {s.approved}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300 dark:text-gray-600">—</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            {s.rejected > 0 ? (
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold">
                                                    {s.rejected}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300 dark:text-gray-600">—</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <Link
                                                href={`/dashboard/revision/${s.user_id}`}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white ${theme.activeBg} hover:opacity-90 transition-opacity`}
                                            >
                                                {t("viewLibrary")}
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                </svg>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
