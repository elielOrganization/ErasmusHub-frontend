"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useApi } from "@/hooks/useApi";
import { useRoleTheme } from "@/hooks/useRoleTheme";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { fetchDocumentBlob } from "@/services/documentsService";
import Cookies from "js-cookie";
import { API_URL } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// Endpoints disponibles en el backend:
//
// GET  /documents/user/{userId}          → DocumentRead[]  ✅ DISPONIBLE
// PATCH /documents/{docId}/review        → Document        ✅ DISPONIBLE
//   Body: { state: "approved" | "rejected", grade?: number }
//
// TODO (pendiente de backend):
//   - Campo `rejection_reason` en el modelo Document y en DocumentReviewUpdate
//   - Acceso del profesor al archivo: GET /documents/{id}/file solo permite al propietario
// ─────────────────────────────────────────────────────────────────────────────

// Tipos del backend (document_type enum values reales del backend)
interface ReviewDocument {
    id: number;
    document_type: "id_front" | "id_back" | "grade_certificate" | "cover_letter" | "disability_certificate" | string;
    name: string;
    state: "pending" | "approved" | "rejected";
    uploaded_at: string;
    calificable: boolean;
    grade?: number | null;
    rejection_reason?: string | null;
}

interface StudentInfo {
    id: number;
    name: string;
    last_name: string;
    email: string;
}

type ActionMode = "approve" | "reject" | null;

interface ReviewPayload {
    state: "approved" | "rejected";
    grade?: number;
    rejection_reason?: string;
}

// ✅ Endpoint disponible: PATCH /documents/{docId}/review
async function reviewDocument(docId: number, payload: ReviewPayload): Promise<ReviewDocument> {
    const token = Cookies.get("auth_token");
    const res = await fetch(`${API_URL}/documents/${docId}/review`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`PATCH /documents/${docId}/review failed: ${res.status}`);
    return res.json();
}

export default function StudentRevisionPage() {
    const t = useTranslations("revision");
    const theme = useRoleTheme();
    const params = useParams<{ studentId: string }>();
    const studentId = params.studentId;

    // ✅ Endpoint disponible: GET /documents/user/{userId}
    const { data: documents, loading, error, refetch } = useApi<ReviewDocument[]>(
        `/documents/user/${studentId}`
    );
    // ✅ Datos del alumno desde el endpoint de usuarios
    const { data: studentData } = useApi<StudentInfo>(`/users/${studentId}`);

    // Per-document action state
    const [activeDoc, setActiveDoc] = useState<number | null>(null);
    const [actionMode, setActionMode] = useState<ActionMode>(null);
    const [reason, setReason] = useState("");
    const [grade, setGrade] = useState("");
    const [reasonError, setReasonError] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ docId: number; type: "success" | "error"; msg: string } | null>(null);

    function openAction(docId: number, mode: ActionMode) {
        setActiveDoc(docId);
        setActionMode(mode);
        setReason("");
        setGrade("");
        setReasonError(false);
        setFeedback(null);
    }

    function cancelAction() {
        setActiveDoc(null);
        setActionMode(null);
        setReason("");
        setGrade("");
        setReasonError(false);
    }

    async function handleConfirm(docId: number) {
        if (actionMode === "reject" && !reason.trim()) {
            setReasonError(true);
            return;
        }
        setSubmitting(true);
        try {
            const payload: ReviewPayload = {
                state: actionMode === "approve" ? "approved" : "rejected",
                ...(actionMode === "approve" && grade && { grade: parseFloat(grade) }),
                ...(actionMode === "reject" && { rejection_reason: reason.trim() }),
            };
            await reviewDocument(docId, payload);
            setFeedback({
                docId,
                type: "success",
                msg: actionMode === "approve" ? t("approvedSuccess") : t("rejectedSuccess"),
            });
            cancelAction();
            await refetch();
        } catch {
            setFeedback({ docId, type: "error", msg: t("actionError") });
        } finally {
            setSubmitting(false);
        }
    }

    const openDocPreview = useCallback(async (docId: number) => {
        try {
            const blob = await fetchDocumentBlob(docId);
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
            setTimeout(() => URL.revokeObjectURL(url), 10_000);
        } catch {
            // silently fail — user will see nothing opened
        }
    }, []);

    function docTypeLabel(docType: string): string {
        const key = `docType_${docType}` as Parameters<typeof t>[0];
        try {
            return t(key);
        } catch {
            return t("docType_unknown");
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    const docs = documents ?? [];
    const studentName = studentData ? `${studentData.name} ${studentData.last_name}` : `#${studentId}`;

    return (
        <div className="space-y-6">
            {/* Back + Header */}
            <div className="flex items-start gap-4">
                <Link
                    href="/dashboard/revision"
                    className="mt-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {(t as (k: string, p: Record<string, string>) => string)("studentDocs", { name: studentName })}
                    </h1>
                    {studentData && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{studentData.email}</p>
                    )}
                </div>
            </div>

            {/* Endpoint not ready */}
            {error && (
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-12 text-center">
                    <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-gray-400 dark:text-gray-500">{t("endpointPending")}</p>
                </div>
            )}

            {/* No documents */}
            {!error && docs.length === 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-12 text-center">
                    <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-gray-400 dark:text-gray-500">{t("noDocs")}</p>
                </div>
            )}

            {/* Document list */}
            {!error && docs.length > 0 && (
                <div className="space-y-3">
                    {docs.map((doc) => {
                        const isPending = doc.state === "pending";
                        const isApproved = doc.state === "approved";
                        const isRejected = doc.state === "rejected";
                        const isActive = activeDoc === doc.id;
                        const docFeedback = feedback?.docId === doc.id ? feedback : null;

                        return (
                            <div
                                key={doc.id}
                                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                            >
                                {/* Document row */}
                                <div className="flex items-center gap-4 px-5 py-4">
                                    {/* Icon */}
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                                            {docTypeLabel(doc.document_type)}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{doc.name}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                            {(t as (k: string, p: Record<string, string>) => string)("uploadedAt", {
                                                date: new Date(doc.uploaded_at).toLocaleDateString(),
                                            })}
                                            {doc.reviewed_at && (
                                                <> · {(t as (k: string, p: Record<string, string>) => string)("reviewedAt", {
                                                    date: new Date(doc.reviewed_at).toLocaleDateString(),
                                                })}</>
                                            )}
                                        </p>
                                    </div>

                                    {/* State badge */}
                                    <div className="shrink-0 flex items-center gap-3">
                                        <StateBadge state={doc.state} />

                                        {/* View doc button */}
                                        <button
                                            onClick={() => openDocPreview(doc.id)}
                                            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline underline-offset-2 transition-colors"
                                        >
                                            {t("viewDoc")}
                                        </button>

                                        {/* Review buttons (pending only) */}
                                        {isPending && !isActive && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openAction(doc.id, "approve")}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500 hover:bg-green-600 text-white transition-colors"
                                                >
                                                    {t("approveBtn")}
                                                </button>
                                                <button
                                                    onClick={() => openAction(doc.id, "reject")}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors"
                                                >
                                                    {t("rejectBtn")}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Rejection reason shown on rejected docs */}
                                {isRejected && doc.rejection_reason && (
                                    <div className="px-5 pb-4">
                                        <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                                            {(t as (k: string, p: Record<string, string>) => string)("rejectionReason", {
                                                reason: doc.rejection_reason,
                                            })}
                                        </p>
                                    </div>
                                )}

                                {/* Grade shown on approved docs */}
                                {isApproved && doc.grade != null && (
                                    <div className="px-5 pb-4">
                                        <p className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
                                            {t("gradeLabel")}: <span className="font-bold">{doc.grade}</span>
                                        </p>
                                    </div>
                                )}

                                {/* Inline review form */}
                                {isActive && (
                                    <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 bg-gray-50 dark:bg-gray-800/40 space-y-3">
                                        {/* Approve form */}
                                        {actionMode === "approve" && (
                                            <div className="space-y-3">
                                                {/* Campo nota solo si el documento es calificable */}
                                                {doc.calificable && (
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                                            {t("gradeLabel")}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="10"
                                                            step="0.1"
                                                            value={grade}
                                                            onChange={(e) => setGrade(e.target.value)}
                                                            placeholder={t("gradePlaceholder")}
                                                            className="w-36 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleConfirm(doc.id)}
                                                        disabled={submitting}
                                                        className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white transition-colors"
                                                    >
                                                        {t("confirmApprove")}
                                                    </button>
                                                    <button
                                                        onClick={cancelAction}
                                                        disabled={submitting}
                                                        className="px-4 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                    >
                                                        {t("cancelAction")}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Reject form */}
                                        {actionMode === "reject" && (
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                                        {t("reasonLabel")} <span className="text-red-500">*</span>
                                                    </label>
                                                    <textarea
                                                        value={reason}
                                                        onChange={(e) => {
                                                            setReason(e.target.value);
                                                            setReasonError(false);
                                                        }}
                                                        placeholder={t("reasonPlaceholder")}
                                                        rows={3}
                                                        className={`w-full text-sm border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 resize-none ${
                                                            reasonError
                                                                ? "border-red-400 focus:ring-red-400"
                                                                : "border-gray-300 dark:border-gray-600 focus:ring-red-400"
                                                        }`}
                                                    />
                                                    {reasonError && (
                                                        <p className="text-xs text-red-500 mt-1">{t("reasonRequired")}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleConfirm(doc.id)}
                                                        disabled={submitting}
                                                        className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white transition-colors"
                                                    >
                                                        {t("confirmReject")}
                                                    </button>
                                                    <button
                                                        onClick={cancelAction}
                                                        disabled={submitting}
                                                        className="px-4 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                    >
                                                        {t("cancelAction")}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Feedback message */}
                                {docFeedback && (
                                    <div className={`px-5 pb-4 text-xs font-medium ${
                                        docFeedback.type === "success"
                                            ? "text-green-600 dark:text-green-400"
                                            : "text-red-600 dark:text-red-400"
                                    }`}>
                                        {docFeedback.msg}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Inline state badge ───────────────────────────────────────────────────────

function StateBadge({ state }: { state: "pending" | "approved" | "rejected" }) {
    const t = useTranslations("documents");
    const config = {
        pending: {
            label: t("statePending"),
            className: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-700/40",
            dot: "bg-amber-400",
        },
        approved: {
            label: t("stateApproved"),
            className: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-700/40",
            dot: "bg-green-500",
        },
        rejected: {
            label: t("stateRejected"),
            className: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-700/40",
            dot: "bg-red-500",
        },
    }[state];

    return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full px-2 py-0.5 text-[11px] ${config.className}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
            {config.label}
        </span>
    );
}
