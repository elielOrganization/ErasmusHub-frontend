"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { useRoleTheme } from "@/hooks/useRoleTheme";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";
import RoleGuard from "@/components/ui/RoleGuard";
import Cookies from "js-cookie";
import { API_URL } from "@/lib/api";
import { GYMNASIUM_COURSES } from "../documents/constants";
import type { Opportunity, PaginatedOpportunities } from "@/services/opportunityService";

interface GradedUser {
    id: number;
    user_id: number;
    first_name: string;
    last_name: string;
    year?: string | null;
    final_grade: number | null;
}

interface UserMin {
    id: number;
    role?: { name: string } | null;
}

const PAGE_SIZE = 15;

/* ── Assign modal ─────────────────────────────────────────────────────────── */

function AssignModal({ student, onClose, opportunities, currentOpp, resolvedUserId }: {
    student: GradedUser | null;
    onClose: () => void;
    opportunities: Opportunity[];
    currentOpp?: string;
    resolvedUserId?: number;
}) {
    const t = useTranslations("studentsDashboard");
    const theme = useRoleTheme();
    const [selectedOpp, setSelectedOpp] = useState("");
    const [assigning, setAssigning] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (student) { setSelectedOpp(""); setSuccessMsg(""); setErrorMsg(""); }
    }, [student]);

    if (!student) return null;

    const openOpportunities = opportunities.filter(o => o.status === "open");

    const handleAssign = async () => {
        if (!selectedOpp) return;
        const userId = resolvedUserId ?? student.user_id;
        if (!userId) { setErrorMsg(t("assignError")); return; }
        setAssigning(true);
        setErrorMsg("");
        try {
            const token = Cookies.get("auth_token");
            const isReassign = !!currentOpp;
            const res = await fetch(
                isReassign ? `${API_URL}/applications/reassign` : `${API_URL}/applications/`,
                {
                    method: isReassign ? "PATCH" : "POST",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    body: isReassign
                        ? JSON.stringify({ user_id: userId, new_opportunity_id: parseInt(selectedOpp) })
                        : JSON.stringify({ opportunity_id: parseInt(selectedOpp), user_id: userId }),
                }
            );
            if (res.ok) {
                setSuccessMsg(t("assignSuccess"));
                setTimeout(onClose, 1500);
            } else {
                const err = await res.json().catch(() => null);
                const detail: string = err?.detail || "";
                if (detail === "Opportunity not found") setErrorMsg(t("errorOpportunityNotFound"));
                else if (detail === "This opportunity is not open for applications") setErrorMsg(t("errorOpportunityNotOpen"));
                else if (detail === "No available slots for this opportunity") setErrorMsg(t("errorNoAvailableSlots"));
                else if (detail === "You already have an application for this opportunity") setErrorMsg(t("errorAlreadyApplied"));
                else setErrorMsg(t("assignError"));
            }
        } catch {
            setErrorMsg(t("assignError"));
        } finally {
            setAssigning(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6">

                {successMsg ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-base font-semibold text-gray-800 dark:text-gray-100 text-center">{successMsg}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{currentOpp ? t("changeOpportunity") : t("assignToOpportunity")}</h3>
                            <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className={`rounded-xl ${theme.accentBg} border ${theme.borderLight} p-3`}>
                            <p className={`text-sm font-semibold ${theme.accentText}`}>{student.first_name} {student.last_name}</p>
                        </div>

                        {currentOpp && (
                            <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 px-3 py-2.5">
                                <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                    Ya asignado a <span className="font-semibold">{currentOpp}</span>
                                </p>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t("selectOpportunity")}</label>
                            {openOpportunities.length === 0 ? (
                                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-400">
                                    {t("noOpportunitiesYet")}
                                </div>
                            ) : (
                                <select
                                    value={selectedOpp}
                                    onChange={e => setSelectedOpp(e.target.value)}
                                    disabled={assigning}
                                    className={`w-full appearance-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 ${theme.focusRing} cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <option value="">{t("selectOpportunityPlaceholder")}</option>
                                    {openOpportunities.map(opp => (
                                        <option key={opp.id} value={opp.id.toString()}>
                                            {opp.name}{opp.city ? ` — ${opp.city}` : ""}{opp.country ? `, ${opp.country}` : ""}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {errorMsg && <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400 font-medium">{errorMsg}</div>}

                        <div className="flex justify-end gap-2 pt-1">
                            <button onClick={onClose} disabled={assigning} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                                {t("cancel")}
                            </button>
                            <button
                                onClick={handleAssign}
                                disabled={!selectedOpp || assigning || openOpportunities.length === 0}
                                className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors inline-flex items-center gap-2 ${
                                    !selectedOpp || assigning || openOpportunities.length === 0
                                        ? `${theme.btnDisabled} cursor-not-allowed opacity-60`
                                        : `${theme.btnPrimary} ${theme.btnPrimaryHover} cursor-pointer`
                                }`}
                            >
                                {assigning && (
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                )}
                                {assigning ? t("assigning") : t("assign")}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function StudentsPage() {
    const t = useTranslations("studentsDashboard");
    const theme = useRoleTheme();
    const params = useParams();
    const locale = (params?.locale as string) || "en";
    const router = useRouter();

    const [search, setSearch] = useState("");
    const [courseFilter, setCourseFilter] = useState("");
    const [page, setPage] = useState(1);
    const [assignStudent, setAssignStudent] = useState<GradedUser | null>(null);

    const { data: finalList, loading, error } = useApi<GradedUser[]>("/final-list");
    const { data: allUsers } = useApi<UserMin[]>("/users");
    const { data: oppsData } = useApi<PaginatedOpportunities>("/opportunities?page=1&page_size=100");
    const { data: allApplications, refetch: refetchApplications } = useApi<{ user_id: number; first_name: string; last_name: string; opportunity_name: string }[]>("/applications/all");

    // Map "FirstName LastName" → { user_id from applications (always valid), opportunity_name }
    const assignmentMap = new Map<string, { userId: number; oppName: string }>(
        (allApplications ?? []).map(a => [`${a.first_name} ${a.last_name}`, { userId: a.user_id, oppName: a.opportunity_name }])
    );

    useEffect(() => { setPage(1); }, [search, courseFilter]);

    const totalStudents = allUsers?.filter(u =>
        u.role?.name?.toLowerCase().includes("student")
    ).length ?? 0;

    const students = finalList ?? [];
    const opportunities = oppsData?.items ?? [];

    const sorted = [...students].sort((a, b) =>
        (b.final_grade ?? -Infinity) - (a.final_grade ?? -Infinity)
    );

    const fullName = (s: GradedUser) => `${s.first_name} ${s.last_name}`;

    const filtered = sorted.filter(s => {
        if (search && !fullName(s).toLowerCase().includes(search.toLowerCase())) return false;
        if (courseFilter && s.year !== courseFilter) return false;
        return true;
    });

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const courseLabel = (year?: string | null) =>
        GYMNASIUM_COURSES.find(c => c.value === year)?.label ?? year ?? "—";

    return (
        <RoleGuard allowed={["admin", "teacher"]}>
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("finalListSubtitle")}</p>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("totalStudents")}</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalStudents}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("inFinalList")}</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{students.length}</p>
                    </div>
                </div>
            </div>

            {/* Table card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">

                {/* Filters bar */}
                <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 flex-wrap">
                    <select
                        value={courseFilter}
                        onChange={e => setCourseFilter(e.target.value)}
                        className={`appearance-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 ${theme.focusRing} cursor-pointer transition-colors`}
                    >
                        <option value="">{t("selectCourse")}</option>
                        {GYMNASIUM_COURSES.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                    <div className="relative flex-1 min-w-[160px] max-w-xs">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={t("searchPlaceholder")}
                            className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-8 pr-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors`}
                        />
                    </div>
                    {(search || courseFilter) && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
                        </span>
                    )}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <LoadingSpinner />
                    </div>
                ) : error ? (
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
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                            {search || courseFilter ? t("noResults") : t("finalListEmpty")}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800/60">
                                        <th className="text-center text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3 w-14">
                                            {t("colPosition")}
                                        </th>
                                        <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-5 py-3">
                                            {t("colName")}
                                        </th>
                                        <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-5 py-3">
                                            {t("colCourse")}
                                        </th>
                                        <th className="text-center text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-5 py-3">
                                            {t("colGrade")}
                                        </th>
                                        <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-5 py-3">
                                            {t("assignToOpportunity")}
                                        </th>
                                        <th className="px-5 py-3 w-36" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                    {paginated.map(s => {
                                        const position = filtered.indexOf(s) + 1;
                                        const isTop3 = position <= 3;
                                        const appInfo = assignmentMap.get(`${s.first_name} ${s.last_name}`);
                                        const assignedOpp = appInfo?.oppName;
                                        return (
                                            <tr key={s.id} onClick={() => router.push(`/${locale}/dashboard/students/${s.user_id}`)} className={`group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer ${isTop3 ? "bg-gradient-to-r from-transparent to-transparent" : ""}`}>
                                                <td className="px-4 py-3.5 text-center">
                                                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                                        position === 1 ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 ring-1 ring-yellow-200 dark:ring-yellow-700/50" :
                                                        position === 2 ? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-gray-600" :
                                                        position === 3 ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 ring-1 ring-orange-200 dark:ring-orange-700/50" :
                                                        "text-gray-400 dark:text-gray-500"
                                                    }`}>
                                                        {position}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{fullName(s)}</p>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                                                        </svg>
                                                        {courseLabel(s.year)}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    {s.final_grade != null ? (
                                                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold ${theme.accentBg} ${theme.accentText}`}>
                                                            {s.final_grade}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300 dark:text-gray-600 text-sm">—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {assignedOpp ? (
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                                                            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            {assignedOpp}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => setAssignStudent(s)}
                                                        className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${theme.accentText} ${theme.accentBg} ${theme.softHover}`}
                                                    >
                                                        {assignedOpp ? t("changeOpportunity") : t("assignBtn")}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800">
                                <Pagination
                                    page={page}
                                    totalPages={totalPages}
                                    totalItems={filtered.length}
                                    pageSize={PAGE_SIZE}
                                    onPageChange={setPage}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>

        <AssignModal
            student={assignStudent}
            onClose={() => { setAssignStudent(null); refetchApplications(); }}
            opportunities={opportunities}
            currentOpp={assignStudent ? assignmentMap.get(`${assignStudent.first_name} ${assignStudent.last_name}`)?.oppName : undefined}
            resolvedUserId={assignStudent ? assignmentMap.get(`${assignStudent.first_name} ${assignStudent.last_name}`)?.userId : undefined}
        />
        </RoleGuard>
    );
}
