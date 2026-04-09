"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useApi } from "@/hooks/useApi";
import { useRoleTheme } from "@/hooks/useRoleTheme";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Cookies from "js-cookie";
import { API_URL } from "@/lib/api";

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

type TabType = "documentos" | "entrevista";
type InterviewMode = "grade" | "reject" | null;

// Helper para usar claves de traducción que existen en el JSON pero no en el tipo de next-intl
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

    const { data, loading, error, refetch } = useApi<StudentDocSummary[]>("/documents/pending");

    // Interview inline state
    const [activeInterview, setActiveInterview] = useState<number | null>(null);
    const [interviewMode, setInterviewMode] = useState<InterviewMode>(null);
    const [interviewGrade, setInterviewGrade] = useState("");
    const [interviewReason, setInterviewReason] = useState("");
    const [interviewReasonError, setInterviewReasonError] = useState(false);
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
    }

    function cancelInterview() {
        setActiveInterview(null);
        setInterviewMode(null);
        setInterviewGrade("");
        setInterviewReason("");
        setInterviewReasonError(false);
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

    const students = data ?? [];
    const filtered = tab === "entrevista"
        ? students.filter((s) => s.all_approved)
        : students;

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
                {/* Tabs */}
                <div className="flex items-center gap-1 p-4 border-b border-gray-100 dark:border-gray-800">
                    {(["documentos", "entrevista"] as TabType[]).map((t_key) => (
                        <button
                            key={t_key}
                            onClick={() => setTab(t_key)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                tab === t_key
                                    ? `${theme.activeBg} text-white`
                                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                        >
                            {ti(t, `tab_${t_key}`)}
                        </button>
                    ))}
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
                {!error && filtered.length === 0 && (
                    <div className="p-12 text-center">
                        <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                            {tab === "entrevista" ? ti(t, "interview_empty") : t("empty")}
                        </p>
                    </div>
                )}

                {/* ── Tab Documentos ─────────────────────────────────────────── */}
                {!error && filtered.length > 0 && tab === "documentos" && (
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

                {/* ── Tab Entrevista ─────────────────────────────────────────── */}
                {!error && filtered.length > 0 && tab === "entrevista" && (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filtered.map((s) => {
                            const isActive = activeInterview === s.user_id;
                            const fb = interviewFeedback?.userId === s.user_id ? interviewFeedback : null;

                            return (
                                <div key={s.user_id} className="px-5 py-4">
                                    {/* Fila del alumno */}
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{s.user_name}</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">{s.email}</p>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            {/* Aprobado */}
                                            {s.interview_status === "passed" && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                                    {ti(t, "interview_passed")}
                                                    {s.interview_grade != null && (
                                                        <span className="ml-1 font-bold">{s.interview_grade}</span>
                                                    )}
                                                </span>
                                            )}

                                            {/* Rechazado */}
                                            {s.interview_status === "rejected" && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                                    {ti(t, "interview_rejected")}
                                                </span>
                                            )}

                                            {/* Acciones — solo pendiente y sin form abierto */}
                                            {s.interview_status === "pending" && !isActive && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openInterview(s.user_id, "grade")}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white ${theme.activeBg} hover:opacity-90 transition-opacity`}
                                                    >
                                                        {ti(t, "interview_gradeBtn")}
                                                    </button>
                                                    <button
                                                        onClick={() => openInterview(s.user_id, "reject")}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors"
                                                    >
                                                        {ti(t, "interview_rejectBtn")}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Motivo de rechazo (estado resuelto) */}
                                    {s.interview_status === "rejected" && s.interview_rejection_reason && (
                                        <p className="mt-2 text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                                            {ti(t, "interview_rejectionReason", { reason: s.interview_rejection_reason })}
                                        </p>
                                    )}

                                    {/* Formulario inline */}
                                    {isActive && (
                                        <div className="mt-3 border border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/40 px-4 py-3 space-y-3">
                                            {/* Modo nota */}
                                            {interviewMode === "grade" && (
                                                <>
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
                                                            onChange={(e) => setInterviewGrade(e.target.value)}
                                                            placeholder={ti(t, "interview_gradePlaceholder")}
                                                            className="w-36 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleInterviewSubmit(s.user_id)}
                                                            disabled={submittingInterview}
                                                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white ${theme.activeBg} hover:opacity-90 disabled:opacity-50 transition-opacity`}
                                                        >
                                                            {ti(t, "interview_saveGrade")}
                                                        </button>
                                                        <button
                                                            onClick={() => setInterviewMode("reject")}
                                                            disabled={submittingInterview}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white transition-colors"
                                                        >
                                                            {ti(t, "interview_rejectBtn")}
                                                        </button>
                                                        <button
                                                            onClick={cancelInterview}
                                                            disabled={submittingInterview}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                        >
                                                            {ti(t, "interview_cancelAction")}
                                                        </button>
                                                    </div>
                                                </>
                                            )}

                                            {/* Modo rechazo */}
                                            {interviewMode === "reject" && (
                                                <>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                                            {ti(t, "interview_reasonLabel")} <span className="text-red-500">*</span>
                                                        </label>
                                                        <textarea
                                                            value={interviewReason}
                                                            onChange={(e) => {
                                                                setInterviewReason(e.target.value);
                                                                setInterviewReasonError(false);
                                                            }}
                                                            placeholder={ti(t, "interview_reasonPlaceholder")}
                                                            rows={3}
                                                            className={`w-full text-sm border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 resize-none ${
                                                                interviewReasonError
                                                                    ? "border-red-400 focus:ring-red-400"
                                                                    : "border-gray-300 dark:border-gray-600 focus:ring-red-400"
                                                            }`}
                                                        />
                                                        {interviewReasonError && (
                                                            <p className="text-xs text-red-500 mt-1">{ti(t, "interview_reasonRequired")}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleInterviewSubmit(s.user_id)}
                                                            disabled={submittingInterview}
                                                            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white transition-colors"
                                                        >
                                                            {ti(t, "interview_confirmReject")}
                                                        </button>
                                                        <button
                                                            onClick={cancelInterview}
                                                            disabled={submittingInterview}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                        >
                                                            {ti(t, "interview_cancelAction")}
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* Feedback */}
                                    {fb && (
                                        <p className={`mt-2 text-xs font-medium ${
                                            fb.type === "success"
                                                ? "text-green-600 dark:text-green-400"
                                                : "text-red-600 dark:text-red-400"
                                        }`}>
                                            {fb.msg}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
