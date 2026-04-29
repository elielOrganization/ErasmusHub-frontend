"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useApi } from "@/hooks/useApi";
import { useRoleTheme } from "@/hooks/useRoleTheme";
import { useRolePreview } from "@/context/RolePreviewContext";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";
import RoleGuard from "@/components/ui/RoleGuard";
import { GYMNASIUM_COURSES } from "../documents/constants";

interface GradedUser {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    year?: string | null;
    final_grade: number | null;
}

const PAGE_SIZE = 15;

export default function ListaFinalPage() {
    const t = useTranslations("listaFinal");
    const theme = useRoleTheme();
    const { user } = useAuth();
    const { effectiveRoleName } = useRolePreview();

    const [search, setSearch] = useState("");
    const [courseFilter, setCourseFilter] = useState("");
    const [page, setPage] = useState(1);

    const roleName = (effectiveRoleName || user?.role?.name || "").toLowerCase();
    const isLector =
        !roleName.includes("admin") &&
        !roleName.includes("student") &&
        !roleName.includes("teacher") &&
        !roleName.includes("profesor") &&
        !roleName.includes("professor") &&
        !roleName.includes("coordinator") &&
        !roleName.includes("coordinador");

    const { data, loading, error } = useApi<GradedUser[]>("/final-list");

    useEffect(() => { setPage(1); }, [search, courseFilter]);

    const courseLabel = (year?: string | null): string => {
        if (!year) return "—";
        return GYMNASIUM_COURSES.find((c) => c.value === year)?.label ?? year;
    };

    const students = data ?? [];
    const fullName = (s: GradedUser) => `${s.first_name} ${s.last_name}`;

    // With course selected → ranked by grade desc
    // Without course → alphabetical, no positions
    const isRanked = !!courseFilter;

    const filtered = [...students]
        .filter(s => {
            if (!fullName(s).toLowerCase().includes(search.toLowerCase())) return false;
            if (courseFilter && s.year !== courseFilter) return false;
            return true;
        })
        .sort((a, b) => {
            if (isRanked) {
                return (b.final_grade ?? -Infinity) - (a.final_grade ?? -Infinity);
            }
            return fullName(a).localeCompare(fullName(b));
        });

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    if (isLector) return null;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    /* ── Shared row renderers ── */

    const positionBadge = (position: number) => (
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
            position === 1 ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" :
            position === 2 ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300" :
            position === 3 ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400" :
            "bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500"
        }`}>
            {position}
        </span>
    );

    const gradeBadge = (s: GradedUser) => s.final_grade != null ? (
        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold ${theme.accentBg} ${theme.accentText}`}>
            {s.final_grade}
        </span>
    ) : (
        <span className="text-gray-300 dark:text-gray-600 text-sm">—</span>
    );

    return (
        <RoleGuard allowed={['admin', 'teacher', 'student']}>
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("pageTitle")}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
            </div>

            {/* Table card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">

                {/* Filter bar */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[140px] max-w-xs">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t("searchPlaceholder")}
                            className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-9 pr-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors`}
                        />
                    </div>
                    <div className="relative shrink-0">
                        <select
                            value={courseFilter}
                            onChange={(e) => setCourseFilter(e.target.value)}
                            className={`appearance-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 pr-8 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors cursor-pointer`}
                        >
                            <option value="">{t("selectCourse")}</option>
                            {GYMNASIUM_COURSES.map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                        <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                    {/* Mode indicator */}
                    {!courseFilter && students.length > 0 && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto shrink-0">
                            {filtered.length} {t("generalListTotal")}
                        </span>
                    )}
                </div>

                {/* Content */}
                {error ? (
                    <div className="p-12 text-center">
                        <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-gray-400 dark:text-gray-500">{t("errorLoad")}</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm text-gray-400 dark:text-gray-500">{t("empty")}</p>
                    </div>
                ) : (
                    <>
                        {/* ── Desktop table ── */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800">
                                        {isRanked && (
                                            <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3 w-16">
                                                {t("colPosition")}
                                            </th>
                                        )}
                                        <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">
                                            {t("colName")}
                                        </th>
                                        {!isRanked && (
                                            <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">
                                                {t("colCourse")}
                                            </th>
                                        )}
                                        <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">
                                            {t("colGrade")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {paginated.map((s, idx) => {
                                        const position = (page - 1) * PAGE_SIZE + idx + 1;
                                        return (
                                            <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                {isRanked && (
                                                    <td className="px-5 py-4 text-center">
                                                        {positionBadge(position)}
                                                    </td>
                                                )}
                                                <td className="px-5 py-4">
                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{fullName(s)}</p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500">{s.email}</p>
                                                </td>
                                                {!isRanked && (
                                                    <td className="px-5 py-4">
                                                        <span className="text-sm text-gray-600 dark:text-gray-300">{courseLabel(s.year)}</span>
                                                    </td>
                                                )}
                                                <td className="px-5 py-4 text-center">
                                                    {gradeBadge(s)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* ── Mobile cards ── */}
                        <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
                            {paginated.map((s, idx) => {
                                const position = (page - 1) * PAGE_SIZE + idx + 1;
                                return (
                                    <div key={s.id} className="flex items-center gap-3 px-4 py-3.5">
                                        {isRanked && (
                                            <div className="shrink-0">{positionBadge(position)}</div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{fullName(s)}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{s.email}</p>
                                                {!isRanked && (
                                                    <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">· {courseLabel(s.year)}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="shrink-0">{gradeBadge(s)}</div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="px-5 pb-4">
                            <Pagination
                                page={page}
                                totalPages={totalPages}
                                totalItems={filtered.length}
                                pageSize={PAGE_SIZE}
                                onPageChange={setPage}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
        </RoleGuard>
    );
}
