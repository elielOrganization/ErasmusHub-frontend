"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useApi } from "@/hooks/useApi";
import { useRoleTheme } from "@/hooks/useRoleTheme";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import RoleGuard from "@/components/ui/RoleGuard";
import Cookies from "js-cookie";
import { API_URL } from "@/lib/api";
import { GYMNASIUM_COURSES } from "../documents/constants";

interface StudentDocSummary {
    user_id: number;
    user_name: string;
    email: string;
    pending: number;
    approved: number;
    rejected: number;
    total: number;
    all_approved: boolean;
    interview_grade: number | null;
    interview_status: "pending" | "passed" | "rejected";
    interview_rejection_reason: string | null;
}

interface UserPublicMin {
    id: number;
    year?: string | null;
}

interface GradedUser {
    id: number;
    final_grade: number | null;
}

type TabType = "documentos" | "entrevista" | "resultados";
type InterviewMode = "grade" | "reject" | null;
type SortCol = "pending" | "approved" | "rejected" | "total" | null;
type StatusFilter = "all" | "pending" | "reviewed" | "excluded";

interface OtherSubField { label: string; weight: number; }
interface OthersData    { weight: number; subfields: OtherSubField[]; }
interface CalificacionData { others: OthersData | null; }

const RUBRIC_OPTIONS = [
    { labelKey: "rubricAdequate",  value: 5   },
    { labelKey: "rubricNotable",   value: 7.5 },
    { labelKey: "rubricExcellent", value: 10  },
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ti = (t: ReturnType<typeof useTranslations>, key: string, params?: Record<string, string>) =>
    (t as unknown as (k: string, p?: Record<string, string>) => string)(key, params);

async function patchInterview(
    userId: number,
    payload: { grade?: number; status?: "rejected"; rejection_reason?: string }
): Promise<void> {
    const token = Cookies.get("auth_token");
    const res = await fetch(`${API_URL}/interviews/${userId}`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`PATCH /interviews/${userId} failed: ${res.status}`);
}

export default function RevisionPage() {
    const t = useTranslations("revision");
    const theme = useRoleTheme();
    const [tab, setTab] = useState<TabType>("documentos");
    const [search, setSearch] = useState("");
    const [sortCol, setSortCol] = useState<SortCol>(null);
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

    const { data, loading, error, refetch } = useApi<StudentDocSummary[]>("/documents/pending");
    const { data: usersData } = useApi<UserPublicMin[]>("/users");
    const { data: calificacionData } = useApi<CalificacionData>("/calificacion");
    const othersConfig = calificacionData?.others ?? null;

    // Map: userId → final_grade (calculated by backend)
    const [finalGrades, setFinalGrades] = useState<Map<number, number | null>>(new Map());
    const [loadingGrades, setLoadingGrades] = useState(false);

    // Publish final list
    const [publishingList, setPublishingList] = useState(false);
    const [publishFeedback, setPublishFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    const courseLabel = (userId: number): string | null => {
        const year = usersData?.find(u => u.id === userId)?.year;
        if (!year) return null;
        return GYMNASIUM_COURSES.find(c => c.value === year)?.label ?? year;
    };

    // Trigger backend grade calculation when entering Resultados tab
    useEffect(() => {
        if (tab !== "resultados") return;
        const token = Cookies.get("auth_token");
        setLoadingGrades(true);
        fetch(`${API_URL}/users/calculate-all-grades`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        })
            .then(res => res.ok ? res.json() : null)
            .then((users: GradedUser[] | null) => {
                if (!users) return;
                const map = new Map<number, number | null>();
                for (const u of users) map.set(u.id, u.final_grade);
                setFinalGrades(map);
            })
            .catch(() => {})
            .finally(() => setLoadingGrades(false));
    }, [tab]);

    function calcFinalGrade(s: StudentDocSummary): number | null {
        const g = finalGrades.get(s.user_id);
        return g !== undefined ? g : s.interview_grade;
    }

    // Interview inline state
    const [activeInterview, setActiveInterview] = useState<number | null>(null);
    const [interviewMode, setInterviewMode] = useState<InterviewMode>(null);
    const [interviewGrade, setInterviewGrade] = useState("");
    const [interviewReason, setInterviewReason] = useState("");
    const [interviewReasonError, setInterviewReasonError] = useState(false);
    const [othersRubric, setOthersRubric] = useState<Record<string, number | null>>({});

    // Weighted average of rubric selections → suggested grade for "Otros"
    const rubricGrade: number | null = (() => {
        if (!othersConfig || othersConfig.subfields.length === 0) return null;
        let total = 0;
        let weightSum = 0;
        for (const sf of othersConfig.subfields) {
            const val = othersRubric[sf.label];
            if (val == null) return null; // not all rated yet
            total += val * (sf.weight / 100);
            weightSum += sf.weight;
        }
        if (weightSum === 0) return null;
        return Math.round(total / weightSum * 100 * 10) / 10;
    })();

    const [submittingInterview, setSubmittingInterview] = useState(false);
    const [interviewFeedback, setInterviewFeedback] = useState<{
        userId: number;
        type: "success" | "error";
        msg: string;
    } | null>(null);

    function openInterview(userId: number, mode: InterviewMode) {
        setActiveInterview(userId);
        setInterviewMode(mode);
        setInterviewGrade("");
        setInterviewReason("");
        setInterviewReasonError(false);
        setInterviewFeedback(null);
        setOthersRubric({});
    }

    function cancelInterview() {
        setActiveInterview(null);
        setInterviewMode(null);
        setInterviewGrade("");
        setInterviewReason("");
        setInterviewReasonError(false);
        setOthersRubric({});
    }

    async function handleInterviewSubmit(userId: number) {
        if (interviewMode === "reject" && !interviewReason.trim()) {
            setInterviewReasonError(true);
            return;
        }
        setSubmittingInterview(true);
        try {
            if (interviewMode === "grade") {
                const grade = parseFloat(interviewGrade);
                if (isNaN(grade) || grade < 0 || grade > 10) {
                    setInterviewFeedback({ userId, type: "error", msg: ti(t, "interview_actionError") });
                    return;
                }
                await patchInterview(userId, { grade });
                setInterviewFeedback({ userId, type: "success", msg: ti(t, "interview_gradeSuccess") });
            } else {
                await patchInterview(userId, { status: "rejected", rejection_reason: interviewReason.trim() });
                setInterviewFeedback({ userId, type: "success", msg: ti(t, "interview_rejectSuccess") });
            }
            cancelInterview();
            await refetch();
        } catch {
            setInterviewFeedback({ userId, type: "error", msg: ti(t, "interview_actionError") });
        } finally {
            setSubmittingInterview(false);
        }
    }

    async function handlePublishList() {
        setPublishingList(true);
        setPublishFeedback(null);
        try {
            const token = Cookies.get("auth_token");
            const res = await fetch(`${API_URL}/final-list/publish`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            });
            if (!res.ok) throw new Error(`${res.status}`);
            setPublishFeedback({ type: "success", msg: ti(t, "publishSuccess") });
        } catch {
            setPublishFeedback({ type: "error", msg: ti(t, "publishError") });
        } finally {
            setPublishingList(false);
        }
    }

    function toggleSort(col: SortCol) {
        if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortCol(col); setSortDir("desc"); }
    }

    const students = data ?? [];
    const searchLower = search.toLowerCase();

    const matchesSearch = (s: StudentDocSummary) =>
        !searchLower ||
        s.user_name.toLowerCase().includes(searchLower) ||
        s.email.toLowerCase().includes(searchLower);

    const matchesStatus = (s: StudentDocSummary) => {
        if (statusFilter === "pending") return s.pending > 0;
        if (statusFilter === "reviewed") return s.pending === 0 && s.total > 0;
        if (statusFilter === "excluded") return s.interview_status === "rejected";
        return true;
    };

    const applySort = (arr: StudentDocSummary[]) => {
        if (!sortCol) return arr;
        return [...arr].sort((a, b) => {
            const diff = a[sortCol] - b[sortCol];
            return sortDir === "asc" ? diff : -diff;
        });
    };

    const filtered = applySort(
        tab === "entrevista"
            ? students.filter(s => s.all_approved && matchesSearch(s))
            : tab === "resultados"
            ? students
            : students.filter(s => matchesSearch(s) && matchesStatus(s))
    );

    const aptosParaErasmus = students
        .filter(s => s.all_approved && s.interview_status === "passed")
        .sort((a, b) => (calcFinalGrade(b) ?? 0) - (calcFinalGrade(a) ?? 0));

    const noAptos = students.filter(
        s => s.interview_status === "rejected" || (s.rejected > 0 && s.pending === 0 && !s.all_approved)
    );

    function rowBgClass(s: StudentDocSummary): string {
        if (s.all_approved && s.interview_status === "passed") return "bg-green-50/40 dark:bg-green-900/10";
        if (s.interview_status === "rejected") return "bg-red-50/40 dark:bg-red-900/10";
        if (s.pending > 0) return "bg-amber-50/40 dark:bg-amber-900/10";
        return "";
    }

    const totalPending = students.reduce((acc, s) => acc + s.pending, 0);
    const totalReviewed = students.filter(s => s.pending === 0 && s.total > 0).length;

    function SortIcon({ col }: { col: SortCol }) {
        if (sortCol !== col) {
            return (
                <svg className="w-3 h-3 opacity-30 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            );
        }
        return (
            <svg className="w-3 h-3 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={
                    sortDir === "asc" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"
                } />
            </svg>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <RoleGuard allowed={['admin', 'teacher']}>
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("pageTitle")}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {ti(t, "refresh")}
                </button>
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
                {/* Tabs + controls */}
                <div className="flex flex-wrap items-center gap-1 gap-y-2 p-4 border-b border-gray-100 dark:border-gray-800">
                    {(["documentos", "entrevista", "resultados"] as TabType[]).map((t_key) => (
                        <button
                            key={t_key}
                            onClick={() => setTab(t_key)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                tab === t_key
                                    ? `${theme.btnPrimary} text-white`
                                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                        >
                            {ti(t, `tab_${t_key}`)}
                        </button>
                    ))}

                    {tab === "documentos" && (
                        <div className="w-full sm:w-auto sm:ml-auto flex flex-wrap items-center gap-2 mt-1 sm:mt-0">
                            {/* Resultado count */}
                            {(search || statusFilter !== "all") && (
                                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                    {ti(t, "resultCount", { count: String(filtered.length), total: String(students.length) })}
                                </span>
                            )}
                            {/* Status filter */}
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                                className="flex-1 sm:flex-none text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                <option value="all">{ti(t, "filterAll")}</option>
                                <option value="pending">{ti(t, "filterWithPending")}</option>
                                <option value="reviewed">{ti(t, "filterReviewed")}</option>
                                <option value="excluded">{ti(t, "filterExcluded")}</option>
                            </select>
                            {/* Search */}
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder={ti(t, "searchPlaceholder")}
                                className="flex-1 sm:flex-none text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:w-48"
                            />
                        </div>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="p-8 text-center">
                        <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-gray-400 dark:text-gray-500">{t("endpointPending")}</p>
                    </div>
                )}

                {/* Empty */}
                {!error && tab !== "resultados" && filtered.length === 0 && (
                    <div className="p-12 text-center">
                        <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                            {tab === "entrevista" ? ti(t, "interview_empty") : t("empty")}
                        </p>
                    </div>
                )}
                {!error && tab === "resultados" && aptosParaErasmus.length === 0 && noAptos.length === 0 && (
                    <div className="p-12 text-center">
                        <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm text-gray-400 dark:text-gray-500">{ti(t, "resultadosEmpty")}</p>
                    </div>
                )}

                {/* ── Tab Documentos ─────────────────────────────────────────── */}
                {!error && filtered.length > 0 && tab === "documentos" && (
                    <>
                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                            {filtered.map((s) => {
                                const pct = s.total > 0 ? Math.round(s.approved / s.total * 100) : 0;
                                return (
                                    <div key={s.user_id} className={`px-4 py-4 space-y-3 ${rowBgClass(s)}`}>
                                        {/* Name + badge */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{s.user_name}</p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{s.email}</p>
                                                {courseLabel(s.user_id) && (
                                                    <p className="text-xs text-blue-500 dark:text-blue-400 font-medium mt-0.5 flex items-center gap-1">
                                                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" /></svg>
                                                        {courseLabel(s.user_id)}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="shrink-0">
                                                {s.all_approved ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                                        {ti(t, "badge_all_approved")}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                                                        {ti(t, "badge_pending_docs")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Progress bar */}
                                        {s.total > 0 && (
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                                                    <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                                </div>
                                                <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{s.approved}/{s.total}</span>
                                            </div>
                                        )}

                                        {/* Doc counts row */}
                                        <div className="flex items-center gap-3 text-xs">
                                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                                <span className="font-bold">{s.pending}</span>
                                                <span className="text-gray-400">{ti(t, "colPending")}</span>
                                            </span>
                                            <span className="text-gray-200 dark:text-gray-700">·</span>
                                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                                <span className="font-bold">{s.approved}</span>
                                                <span className="text-gray-400">{ti(t, "colApproved")}</span>
                                            </span>
                                            <span className="text-gray-200 dark:text-gray-700">·</span>
                                            <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
                                                <span className="font-bold">{s.rejected}</span>
                                                <span className="text-gray-400">{ti(t, "colRejected")}</span>
                                            </span>
                                        </div>

                                        {/* Button */}
                                        <Link
                                            href={`/dashboard/review/${s.user_id}`}
                                            className={`flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold text-white ${theme.btnPrimary} ${theme.btnPrimaryHover} transition-colors`}
                                        >
                                            {t("viewLibrary")}
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800">
                                        <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">
                                            {t("colStudent")}
                                        </th>
                                        {(["pending", "approved", "rejected", "total"] as SortCol[]).map(col => (
                                            <th
                                                key={col}
                                                onClick={() => toggleSort(col)}
                                                className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                            >
                                                {ti(t, col === "pending" ? "colPending" : col === "approved" ? "colApproved" : col === "rejected" ? "colRejected" : "colTotal")}
                                                <SortIcon col={col} />
                                            </th>
                                        ))}
                                        <th className="px-5 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filtered.map((s) => {
                                        const pct = s.total > 0 ? Math.round(s.approved / s.total * 100) : 0;
                                        return (
                                            <tr key={s.user_id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${rowBgClass(s)}`}>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.user_name}</p>
                                                        {s.all_approved ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                                                {ti(t, "badge_all_approved")}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                                                                {ti(t, "badge_pending_docs")}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500">{s.email}</p>
                                                    {courseLabel(s.user_id) && (
                                                        <p className="text-xs text-blue-500 dark:text-blue-400 font-medium mt-0.5 flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" /></svg>
                                                            {courseLabel(s.user_id)}
                                                        </p>
                                                    )}
                                                    {s.total > 0 && (
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <div className="flex-1 max-w-24 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                                                                <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                                            </div>
                                                            <span className="text-xs text-gray-400 dark:text-gray-500">{s.approved}/{s.total}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    {s.pending > 0 ? (
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold">{s.pending}</span>
                                                    ) : (
                                                        <span className="text-gray-300 dark:text-gray-600">—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    {s.approved > 0 ? (
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold">{s.approved}</span>
                                                    ) : (
                                                        <span className="text-gray-300 dark:text-gray-600">—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    {s.rejected > 0 ? (
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold">{s.rejected}</span>
                                                    ) : (
                                                        <span className="text-gray-300 dark:text-gray-600">—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{s.total}</span>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <Link
                                                        href={`/dashboard/review/${s.user_id}`}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white ${theme.btnPrimary} ${theme.btnPrimaryHover} transition-colors`}
                                                    >
                                                        {t("viewLibrary")}
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ── Tab Entrevista ─────────────────────────────────────────── */}
                {!error && filtered.length > 0 && tab === "entrevista" && (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filtered.map((s) => {
                            const isActive = activeInterview === s.user_id;
                            const fb = interviewFeedback?.userId === s.user_id ? interviewFeedback : null;

                            return (
                                <div key={s.user_id} className="px-5 py-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{s.user_name}</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">{s.email}</p>
                                            {courseLabel(s.user_id) && (
                                                <p className="text-xs text-blue-500 dark:text-blue-400 font-medium mt-0.5 flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" /></svg>
                                                    {courseLabel(s.user_id)}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap shrink-0">
                                            {s.interview_status === "passed" && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                                    {ti(t, "interview_passed")}
                                                    {s.interview_grade != null && (
                                                        <span className="ml-1 font-bold">{s.interview_grade}</span>
                                                    )}
                                                </span>
                                            )}

                                            {s.interview_status === "rejected" && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                                    {ti(t, "interview_rejected")}
                                                </span>
                                            )}

                                            {s.interview_status === "pending" && !isActive && (
                                                <>
                                                    <button
                                                        onClick={() => openInterview(s.user_id, "grade")}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white ${theme.btnPrimary} ${theme.btnPrimaryHover} transition-colors`}
                                                    >
                                                        {ti(t, "interview_gradeBtn")}
                                                    </button>
                                                    <button
                                                        onClick={() => openInterview(s.user_id, "reject")}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors"
                                                    >
                                                        {ti(t, "interview_rejectBtn")}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {s.interview_status === "rejected" && s.interview_rejection_reason && (
                                        <p className="mt-2 text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                                            {ti(t, "interview_rejectionReason", { reason: s.interview_rejection_reason })}
                                        </p>
                                    )}

                                    {isActive && (
                                        <div className="mt-3 border border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/40 px-4 py-3 space-y-3">
                                            {interviewMode === "grade" && (
                                                <>
                                                    {/* Manual grade input */}
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                                            {ti(t, "interview_gradeLabel")}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="10"
                                                            step="0.1"
                                                            value={interviewGrade}
                                                            onChange={e => setInterviewGrade(e.target.value)}
                                                            placeholder={ti(t, "interview_gradePlaceholder")}
                                                            className="w-36 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                                        />
                                                    </div>

                                                    {/* Otros rubric — only shown if admin configured subcampos */}
                                                    {othersConfig && othersConfig.subfields.length > 0 && (
                                                        <div className="mt-2 space-y-2">
                                                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                                                                {ti(t, "rubricLabel", { weight: String(othersConfig.weight) })}
                                                            </p>
                                                            {othersConfig.subfields.map(sf => (
                                                                <div key={sf.label} className="flex items-center gap-3 flex-wrap">
                                                                    <span className="text-xs text-gray-700 dark:text-gray-300 w-36 shrink-0">
                                                                        {sf.label}
                                                                        <span className="ml-1 text-gray-400">({sf.weight}%)</span>
                                                                    </span>
                                                                    <div className="flex items-center gap-1.5">
                                                                        {RUBRIC_OPTIONS.map(opt => (
                                                                            <button
                                                                                key={opt.labelKey}
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    setOthersRubric(prev => ({
                                                                                        ...prev,
                                                                                        [sf.label]: prev[sf.label] === opt.value ? null : opt.value,
                                                                                    }))
                                                                                }
                                                                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                                                                                    othersRubric[sf.label] === opt.value
                                                                                        ? "bg-blue-600 border-blue-600 text-white"
                                                                                        : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400"
                                                                                }`}
                                                                            >
                                                                                {ti(t, opt.labelKey)} <span className="opacity-70">({opt.value})</span>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {rubricGrade !== null && (
                                                                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium pt-1">
                                                                    {ti(t, "rubricSuggestedGrade")} <span className="font-bold">{rubricGrade}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setInterviewGrade(String(rubricGrade))}
                                                                        className="ml-2 underline hover:no-underline"
                                                                    >
                                                                        {ti(t, "rubricUseGrade")}
                                                                    </button>
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-2 pt-1">
                                                        <button onClick={() => handleInterviewSubmit(s.user_id)} disabled={submittingInterview} className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white ${theme.btnPrimary} ${theme.btnPrimaryHover} disabled:opacity-50 transition-colors`}>
                                                            {ti(t, "interview_saveGrade")}
                                                        </button>
                                                        <button onClick={() => setInterviewMode("reject")} disabled={submittingInterview} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white transition-colors">
                                                            {ti(t, "interview_rejectBtn")}
                                                        </button>
                                                        <button onClick={cancelInterview} disabled={submittingInterview} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                                            {ti(t, "interview_cancelAction")}
                                                        </button>
                                                    </div>
                                                </>
                                            )}

                                            {interviewMode === "reject" && (
                                                <>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                                            {ti(t, "interview_reasonLabel")} <span className="text-red-500">*</span>
                                                        </label>
                                                        <textarea
                                                            value={interviewReason}
                                                            onChange={e => { setInterviewReason(e.target.value); setInterviewReasonError(false); }}
                                                            placeholder={ti(t, "interview_reasonPlaceholder")}
                                                            rows={3}
                                                            className={`w-full text-sm border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 resize-none ${interviewReasonError ? "border-red-400 focus:ring-red-400" : "border-gray-300 dark:border-gray-600 focus:ring-red-400"}`}
                                                        />
                                                        {interviewReasonError && <p className="text-xs text-red-500 mt-1">{ti(t, "interview_reasonRequired")}</p>}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => handleInterviewSubmit(s.user_id)} disabled={submittingInterview} className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white transition-colors">
                                                            {ti(t, "interview_confirmReject")}
                                                        </button>
                                                        <button onClick={cancelInterview} disabled={submittingInterview} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                                            {ti(t, "interview_cancelAction")}
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {fb && (
                                        <p className={`mt-2 text-xs font-medium ${fb.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                            {fb.msg}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Tab Resultados ─────────────────────────────────────────── */}
                {!error && tab === "resultados" && (aptosParaErasmus.length > 0 || noAptos.length > 0) && (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {aptosParaErasmus.length > 0 && (
                            <div className="p-5 space-y-3">
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                                        {ti(t, "resultadosApto")}
                                        <span className="ml-1 normal-case font-normal text-gray-400">({aptosParaErasmus.length})</span>
                                        {loadingGrades && (
                                            <svg className="w-3.5 h-3.5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                            </svg>
                                        )}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {publishFeedback && (
                                            <span className={`text-xs font-medium ${publishFeedback.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                                                {publishFeedback.msg}
                                            </span>
                                        )}
                                        <button
                                            onClick={handlePublishList}
                                            disabled={publishingList || loadingGrades}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white ${theme.btnPrimary} ${theme.btnPrimaryHover} disabled:opacity-50 transition-colors`}
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                            {publishingList ? "..." : ti(t, "publishList")}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {aptosParaErasmus.map((s, idx) => {
                                        const finalGrade = calcFinalGrade(s);
                                        return (
                                            <div key={s.user_id} className="flex items-center justify-between gap-4 bg-green-50 dark:bg-green-900/10 rounded-xl px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-bold text-green-600 dark:text-green-400 w-6 text-center">{idx + 1}</span>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{s.user_name}</p>
                                                        <p className="text-xs text-gray-400 dark:text-gray-500">{s.email}</p>
                                                    </div>
                                                </div>
                                                {finalGrade != null && (
                                                    <span className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                                        {ti(t, "resultadosGrade", { grade: String(finalGrade) })}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {noAptos.length > 0 && (
                            <div className="p-5 space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                    {ti(t, "resultadosNoApto")}
                                    <span className="ml-1 normal-case font-normal text-gray-400">({noAptos.length})</span>
                                </h3>
                                <div className="space-y-2">
                                    {noAptos.map((s) => {
                                        const finalGrade = calcFinalGrade(s);
                                        return (
                                            <div key={s.user_id} className="flex items-center justify-between gap-4 bg-red-50 dark:bg-red-900/10 rounded-xl px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{s.user_name}</p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500">{s.email}</p>
                                                    {s.interview_rejection_reason && (
                                                        <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                                                            {ti(t, "resultadosReason", { reason: s.interview_rejection_reason })}
                                                        </p>
                                                    )}
                                                </div>
                                                {finalGrade != null && (
                                                    <span className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                                                        {ti(t, "resultadosGrade", { grade: String(finalGrade) })}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
        </RoleGuard>
    );
}
