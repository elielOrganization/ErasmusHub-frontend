"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useApi } from "@/hooks/useApi";
import { useRoleTheme } from "@/hooks/useRoleTheme";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PreviewModal from "../../documents/_components/PreviewModal";
import type { UserDocument } from "../../documents/types";
import Cookies from "js-cookie";
import { API_URL } from "@/lib/api";
import { GYMNASIUM_COURSES } from "../../documents/constants";

// ─────────────────────────────────────────────────────────────────────────────
// Available backend endpoints:
//
// GET  /documents/user/{userId}          → DocumentRead[]  ✅ AVAILABLE
// PATCH /documents/{docId}/review        → Document        ✅ AVAILABLE
//   Body: { state: "approved" | "rejected", grade?: number }
// ─────────────────────────────────────────────────────────────────────────────

// Tipos del backend (document_type enum values reales del backend)
interface ReviewDocument {
    id: number;
    document_type: "id_front" | "id_back" | "grade_certificate" | "motivation_letter" | "language_certificate" | "disability_certificate" | string;
    name: string;
    state: "pending" | "approved" | "rejected";
    uploaded_at: string;
    calificable: boolean;
    grade?: number | null;
    rejection_reason?: string | null;
}

interface StudentInfo {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    year?: string | null;
}

type ActionMode = "approve" | "reject" | null;

interface ReviewPayload {
    state: "approved" | "rejected";
    grade?: number;
    rejection_reason?: string;
}

async function patchInterview(userId: number, payload: { status: "rejected"; rejection_reason: string } | { status: "pending" }): Promise<void> {
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

// ✅ Available endpoint: PATCH /documents/{docId}/review
// Note: res.json() is intentionally not called — an empty body from the backend would
// throw even on a successful PATCH, causing a false error for the user.
async function reviewDocument(docId: number, payload: ReviewPayload): Promise<void> {
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
}

export default function StudentRevisionPage() {
    const t = useTranslations("revision");
    const theme = useRoleTheme();
    const params = useParams<{ studentId: string }>();
    const studentId = params.studentId;
    const router = useRouter();

    // ✅ Available endpoint: GET /documents/user/{userId}
    const { data: documents, loading, error } = useApi<ReviewDocument[]>(
        `/documents/user/${studentId}`
    );
    // GET /users/ returns all users; filter by studentId (no GET /users/{id} endpoint exists)
    const { data: allUsers } = useApi<StudentInfo[]>("/users");
    const studentData = allUsers?.find(u => u.id === parseInt(studentId));

    // Local overrides — applied on top of fetched data so only the touched doc re-renders
    const [docOverrides, setDocOverrides] = useState<Record<number, Partial<ReviewDocument>>>({});

    // Per-document action state
    const [activeDoc, setActiveDoc] = useState<number | null>(null);
    const [actionMode, setActionMode] = useState<ActionMode>(null);
    const [reason, setReason] = useState("");
    const [grade, setGrade] = useState("");
    const [reasonError, setReasonError] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ docId: number; type: "success" | "error"; msg: string } | null>(null);

    // Exclude from process state
    const [excludeModalOpen, setExcludeModalOpen] = useState(false);
    const [excludeReason, setExcludeReason] = useState("");
    const [excludeReasonError, setExcludeReasonError] = useState(false);
    const [excludeSubmitting, setExcludeSubmitting] = useState(false);
    const [excludeFeedback, setExcludeFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    // Readmit state
    const [readmitSubmitting, setReadmitSubmitting] = useState(false);
    const [readmitFeedback, setReadmitFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    // Document preview modal
    const [previewDoc, setPreviewDoc] = useState<UserDocument | null>(null);

    function openDocPreview(doc: ReviewDocument) {
        setPreviewDoc({
            id: doc.id,
            name: doc.name,
            document_type: doc.document_type,
            uploaded_at: doc.uploaded_at,
            state: doc.state,
            user_id: 0,
            file_path: "",
        });
    }

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
        const targetState = actionMode === "approve" ? "approved" : "rejected";
        const payload: ReviewPayload = {
            state: targetState,
            ...(actionMode === "approve" && grade && { grade: parseFloat(grade) }),
            ...(actionMode === "reject" && { rejection_reason: reason.trim() }),
        };

        try {
            await reviewDocument(docId, payload);

            if (actionMode === "reject") {
                try { await patchInterview(parseInt(studentId), { status: "pending" }); } catch { /* silent */ }
            }

            // Update only this document locally — no full refetch
            setDocOverrides(prev => ({
                ...prev,
                [docId]: {
                    state: targetState,
                    grade: actionMode === "approve" && grade ? parseFloat(grade) : null,
                    rejection_reason: actionMode === "reject" ? reason.trim() : null,
                },
            }));

            setFeedback({
                docId,
                type: "success",
                msg: actionMode === "approve" ? t("approvedSuccess") : t("rejectedSuccess"),
            });
            cancelAction();
        } catch {
            setFeedback({ docId, type: "error", msg: t("actionError") });
        } finally {
            setSubmitting(false);
        }
    }

    async function handleExclude() {
        if (!excludeReason.trim()) {
            setExcludeReasonError(true);
            return;
        }
        setExcludeSubmitting(true);
        try {
            await patchInterview(parseInt(studentId), { status: "rejected", rejection_reason: excludeReason.trim() });
            setExcludeFeedback({ type: "success", msg: t("excludeSuccess") });
            setTimeout(() => router.push("/dashboard/review"), 1200);
        } catch {
            setExcludeFeedback({ type: "error", msg: t("excludeError") });
            setExcludeSubmitting(false);
        }
    }

    async function handleReadmit() {
        setReadmitSubmitting(true);
        setReadmitFeedback(null);
        try {
            await patchInterview(parseInt(studentId), { status: "pending" });
            setReadmitFeedback({ type: "success", msg: t("readmitSuccess") });
            setTimeout(() => router.push("/dashboard/review"), 1200);
        } catch {
            setReadmitFeedback({ type: "error", msg: t("readmitError") });
            setReadmitSubmitting(false);
        }
    }

    // Auto-dismiss success feedback after 3s
    useEffect(() => {
        if (feedback?.type !== "success") return;
        const timer = setTimeout(() => setFeedback(null), 3000);
        return () => clearTimeout(timer);
    }, [feedback]);

    // Escape key: cierra modal o cancela acción activa
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key !== "Escape") return;
            if (excludeModalOpen) { setExcludeModalOpen(false); return; }
            if (activeDoc !== null) cancelAction();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [excludeModalOpen, activeDoc]);


    function docTypeLabel(docType: string): string {
        const key = `docType_${docType}` as Parameters<typeof t>[0];
        try {
            return t(key);
        } catch {
            return t("docType_unknown");
        }
    }

    function docTypeIcon(docType: string) {
        const cls = "w-5 h-5 text-gray-500 dark:text-gray-400";
        switch (docType) {
            case "id_front":
            case "id_back":
                return (
                    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                );
            case "grade_certificate":
                return (
                    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                );
            case "motivation_letter":
                return (
                    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                );
            case "language_certificate":
                return (
                    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                );
            case "disability_certificate":
                return (
                    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                );
            case "parental_authorization":
                return (
                    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                );
            default:
                return (
                    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                );
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    const docs = (documents ?? []).map(d =>
        docOverrides[d.id] ? { ...d, ...docOverrides[d.id] } : d
    );
    const studentName = studentData ? `${studentData.first_name} ${studentData.last_name}` : `#${studentId}`;
    const studentCourse = studentData?.year
        ? (GYMNASIUM_COURSES.find(c => c.value === studentData.year)?.label ?? studentData.year)
        : null;
    const approvedCount = docs.filter(d => d.state === "approved").length;
    const pendingCount = docs.filter(d => d.state === "pending").length;

    return (
        <div className="space-y-6">
            {/* Back + Header */}
            <div className="space-y-3">
                <div className="flex items-start gap-3">
                    <Link
                        href="/dashboard/review"
                        className="mt-1 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                            {(t as (k: string, p: Record<string, string>) => string)("studentDocs", { name: studentName })}
                        </h1>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {studentData && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{studentData.email}</p>
                            )}
                            {studentCourse && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" /></svg>
                                    {studentCourse}
                                </span>
                            )}
                        </div>
                        {docs.length > 0 && (
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                    approvedCount === docs.length
                                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                        : pendingCount > 0
                                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                }`}>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    {approvedCount}/{docs.length}
                                </span>
                                {pendingCount > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                        {pendingCount} {t("statPending").toLowerCase()}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action buttons — full width on mobile, inline on desktop */}
                <div className="flex flex-wrap gap-2 pl-8">
                    <button
                        onClick={handleReadmit}
                        disabled={readmitSubmitting}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-semibold bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-700/40 disabled:opacity-50 transition-colors"
                    >
                        {t("readmitStudent")}
                    </button>
                    <button
                        onClick={() => { setExcludeModalOpen(true); setExcludeReason(""); setExcludeReasonError(false); setExcludeFeedback(null); }}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-semibold bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700/40 transition-colors"
                    >
                        {t("excludeFromProcess")}
                    </button>
                    {readmitFeedback && (
                        <p className={`w-full text-xs font-medium ${readmitFeedback.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                            {readmitFeedback.msg}
                        </p>
                    )}
                </div>
            </div>

            {/* Exclude modal */}
            {excludeModalOpen && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-red-200 dark:border-red-700/40 shadow-lg p-6 space-y-4">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">{t("excludeConfirmTitle")}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t("excludeConfirmDesc")}</p>
                    <textarea
                        value={excludeReason}
                        onChange={(e) => { setExcludeReason(e.target.value); setExcludeReasonError(false); }}
                        placeholder={t("excludeReasonPlaceholder")}
                        rows={3}
                        className={`w-full text-sm border rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 resize-none ${
                            excludeReasonError
                                ? "border-red-400 focus:ring-red-400"
                                : "border-gray-300 dark:border-gray-600 focus:ring-red-400"
                        }`}
                    />
                    {excludeReasonError && (
                        <p className="text-xs text-red-500">{t("excludeReasonRequired")}</p>
                    )}
                    {excludeFeedback && (
                        <p className={`text-xs font-medium ${excludeFeedback.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                            {excludeFeedback.msg}
                        </p>
                    )}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExclude}
                            disabled={excludeSubmitting}
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white transition-colors"
                        >
                            {t("excludeConfirmTitle")}
                        </button>
                        <button
                            onClick={() => setExcludeModalOpen(false)}
                            disabled={excludeSubmitting}
                            className="px-4 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            {t("cancelAction")}
                        </button>
                    </div>
                </div>
            )}

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
                                className={`rounded-2xl border overflow-hidden transition-all ${
                                    isActive
                                        ? "bg-white dark:bg-gray-900 border-blue-300 dark:border-blue-600 shadow-md"
                                        : isApproved
                                        ? "bg-white dark:bg-gray-900 border-green-100 dark:border-green-900/40"
                                        : isRejected
                                        ? "bg-white dark:bg-gray-900 border-red-100 dark:border-red-900/40"
                                        : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
                                }`}
                            >
                                {/* Document row */}
                                <div className="flex flex-col gap-0 px-5 py-4">
                                    {/* Top row: icon + info + state badge (desktop also shows buttons here) */}
                                    <div className="flex items-center gap-4">
                                        {/* Icon */}
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                            isApproved ? "bg-green-100 dark:bg-green-900/30" :
                                            isRejected ? "bg-red-100 dark:bg-red-900/30" :
                                            "bg-gray-100 dark:bg-gray-800"
                                        }`}>
                                            {docTypeIcon(doc.document_type)}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                                                {docTypeLabel(doc.document_type)}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium truncate mt-0.5">{doc.name}</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                                {(t as (k: string, p: Record<string, string>) => string)("uploadedAt", {
                                                    date: new Date(doc.uploaded_at).toLocaleDateString(),
                                                })}
                                            </p>
                                        </div>

                                        {/* State badge — always visible on the right */}
                                        <div className="shrink-0">
                                            <StateBadge state={doc.state} />
                                        </div>
                                    </div>

                                    {/* Action buttons row — wraps below info on all sizes */}
                                    <div className="flex items-center gap-2 flex-wrap mt-3 pl-14">
                                        {/* View doc button */}
                                        <button
                                            onClick={() => openDocPreview(doc)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border border-blue-200 dark:border-blue-700/50 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            {t("viewDoc")}
                                        </button>

                                        {/* Review buttons */}
                                        {isPending && !isActive && (
                                            <>
                                                <button
                                                    onClick={() => openAction(doc.id, "approve")}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500 hover:bg-green-600 text-white transition-colors cursor-pointer"
                                                >
                                                    {t("approveBtn")}
                                                </button>
                                                <button
                                                    onClick={() => openAction(doc.id, "reject")}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer"
                                                >
                                                    {t("rejectBtn")}
                                                </button>
                                            </>
                                        )}
                                        {/* Change decision for reviewed docs */}
                                        {!isPending && !isActive && (
                                            <button
                                                onClick={() => openAction(doc.id, isApproved ? "reject" : "approve")}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border border-amber-200 dark:border-amber-700/50 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:border-amber-300 dark:hover:border-amber-600 transition-colors"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                </svg>
                                                {t("changeDecision")}
                                            </button>
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
                                                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white transition-colors"
                                                    >
                                                        {submitting && <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                                                        {submitting ? "..." : t("confirmApprove")}
                                                    </button>
                                                    <button
                                                        onClick={cancelAction}
                                                        disabled={submitting}
                                                        className="px-4 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                    >
                                                        {t("cancelAction")} <span className="opacity-40 ml-0.5">Esc</span>
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
                                                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white transition-colors"
                                                    >
                                                        {submitting && <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                                                        {submitting ? "..." : t("confirmReject")}
                                                    </button>
                                                    <button
                                                        onClick={cancelAction}
                                                        disabled={submitting}
                                                        className="px-4 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                    >
                                                        {t("cancelAction")} <span className="opacity-40 ml-0.5">Esc</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Feedback message */}
                                {docFeedback && (
                                    <div className={`mx-5 mb-4 rounded-xl px-4 py-3 text-xs font-semibold flex items-center gap-2 ${
                                        docFeedback.type === "success"
                                            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                                            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                                    }`}>
                                        {docFeedback.type === "success"
                                            ? <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                            : <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        }
                                        {docFeedback.msg}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Document preview modal */}
            <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
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
