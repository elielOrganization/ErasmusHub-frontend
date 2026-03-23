"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useRoleTheme } from "@/hooks/useRoleTheme";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Cookies from "js-cookie";
import { API_URL } from "@/lib/api";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "application/pdf"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const ID_TYPES = [
    "rodneCislo",
    "dni",
    "nie",
    "passport",
    "other",
] as const;

type DocKey = "grades" | "coverLetter" | "disability";

interface FileState {
    file: File | null;
    error: string | null;
    dragging: boolean;
}

const emptyFileState = (): FileState => ({ file: null, error: null, dragging: false });

interface FormErrors {
    idType?: string;
    grades?: string;
    coverLetter?: string;
    disability?: string;
}

// ─── File Dropzone ────────────────────────────────────────────────────────────

function FileDropzone({
    id,
    fileState,
    onFileChange,
    onRemove,
    t,
}: {
    id: DocKey;
    fileState: FileState;
    onFileChange: (key: DocKey, file: File, errorMsg?: string) => void;
    onRemove: (key: DocKey) => void;
    t: ReturnType<typeof useTranslations>;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    const validate = (file: File): string | undefined => {
        if (!ACCEPTED_TYPES.includes(file.type)) return t("errorFileType");
        if (file.size > MAX_SIZE_BYTES) return t("errorFileSize");
        return undefined;
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) onFileChange(id, file, validate(file));
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onFileChange(id, file, validate(file));
        e.target.value = "";
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (type: string) => {
        if (type === "application/pdf")
            return (
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            );
        return (
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        );
    };

    if (fileState.file && !fileState.error) {
        return (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3 border-2 border-green-200 bg-green-50">
                {getFileIcon(fileState.file.type)}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{fileState.file.name}</p>
                    <p className="text-xs text-gray-400">{formatSize(fileState.file.size)}</p>
                </div>
                <button
                    type="button"
                    onClick={() => onRemove(id)}
                    className="shrink-0 text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
                    title={t("removeFile")}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <div>
            <div
                onClick={() => inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={`
                    rounded-xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-all duration-200
                    ${fileState.error
                        ? "border-red-300 bg-red-50 hover:border-red-400"
                        : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50"
                    }
                `}
            >
                <div className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${fileState.error ? "bg-red-100" : "bg-white shadow-sm"}`}>
                        <svg className={`w-5 h-5 ${fileState.error ? "text-red-400" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <p className={`text-sm font-medium ${fileState.error ? "text-red-500" : "text-gray-600"}`}>
                        {t("dropzoneLabel")}
                    </p>
                    <p className="text-xs text-gray-400">{t("dropzoneFormats")}</p>
                </div>
            </div>
            <input
                ref={inputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.pdf"
                className="hidden"
                onChange={handleInputChange}
            />
        </div>
    );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionCard({
    icon,
    iconBg,
    iconColor,
    title,
    children,
}: {
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                    <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {icon}
                    </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-800">{title}</h2>
            </div>
            {children}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
    const t = useTranslations("documents");
    const { user, loading } = useAuth();
    const theme = useRoleTheme();

    const [idType, setIdType] = useState("");
    const [hasDisability, setHasDisability] = useState(false);
    const [files, setFiles] = useState<Record<DocKey, FileState>>({
        grades: emptyFileState(),
        coverLetter: emptyFileState(),
        disability: emptyFileState(),
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    if (loading) return <LoadingSpinner />;
    if (!user) return null;

    const fullName = `${user.first_name} ${user.last_name}`;

    const handleFileChange = (key: DocKey, file: File, errorMsg?: string) => {
        setFiles((prev) => ({ ...prev, [key]: { file, error: errorMsg ?? null, dragging: false } }));
        if (!errorMsg) {
            setErrors((prev) => ({ ...prev, [key]: undefined }));
        }
    };

    const handleRemove = (key: DocKey) => {
        setFiles((prev) => ({ ...prev, [key]: emptyFileState() }));
    };

    const validate = (): boolean => {
        const newErrors: FormErrors = {};
        if (!idType) newErrors.idType = t("errorIdType");
        if (!files.grades.file || files.grades.error) newErrors.grades = t("errorRequired");
        if (!files.coverLetter.file || files.coverLetter.error) newErrors.coverLetter = t("errorRequired");
        if (hasDisability && (!files.disability.file || files.disability.error)) {
            newErrors.disability = t("errorRequired");
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        if (!validate()) return;

        setSubmitting(true);
        try {
            const token = Cookies.get("auth_token");
            const formData = new FormData();
            formData.append("id_type", idType);
            if (files.grades.file) formData.append("grades_certificate", files.grades.file);
            if (files.coverLetter.file) formData.append("cover_letter", files.coverLetter.file);
            if (hasDisability && files.disability.file) {
                formData.append("disability_certificate", files.disability.file);
            }

            const res = await fetch(`${API_URL}/documents/upload`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!res.ok) throw new Error(`${res.status}`);
            setSubmitSuccess(true);
        } catch {
            setSubmitError(t("submitError"));
        } finally {
            setSubmitting(false);
        }
    };

    // ── Success State ──────────────────────────────────────────────────────────

    if (submitSuccess) {
        return (
            <div className="max-w-2xl mx-auto p-4 sm:p-6">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">{t("successTitle")}</h2>
                    <p className="text-gray-500 text-sm max-w-sm">{t("successMsg")}</p>
                    <button
                        type="button"
                        onClick={() => {
                            setSubmitSuccess(false);
                            setIdType("");
                            setHasDisability(false);
                            setFiles({ grades: emptyFileState(), coverLetter: emptyFileState(), disability: emptyFileState() });
                        }}
                        className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.97]"
                        style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)" }}
                    >
                        {t("submit")}
                    </button>
                </div>
            </div>
        );
    }

    // ── Form ───────────────────────────────────────────────────────────────────

    return (
        <div className="max-w-3xl mx-auto space-y-6 p-4 sm:p-6">

            {/* ── Page Header ── */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className={`h-28 bg-gradient-to-r ${theme.gradientFrom} ${theme.gradientTo} flex items-center px-8 gap-4`}>
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">{t("title")}</h1>
                        <p className={`text-sm ${theme.gradientSubtext}`}>{t("subtitle")}</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-6">

                {/* ── Applicant Info ── */}
                <SectionCard
                    iconBg="bg-blue-50"
                    iconColor="text-blue-600"
                    title={t("applicantInfo")}
                    icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />}
                >
                    <div className="space-y-5">
                        {/* Full Name (read-only) */}
                        <div>
                            <label className="block text-gray-600 text-xs font-semibold mb-2 tracking-wide uppercase">
                                {t("fullName")}
                            </label>
                            <div
                                className="flex items-center gap-3 rounded-xl px-4 py-3.5 border-2"
                                style={{ borderColor: "#e8f0fe", background: "#f8faff" }}
                            >
                                <svg width="16" height="16" fill="none" stroke="#93c5fd" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="flex-1 text-sm text-gray-800">{fullName}</span>
                                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                        </div>

                        {/* ID Type selector */}
                        <div>
                            <label className="block text-gray-600 text-xs font-semibold mb-2 tracking-wide uppercase">
                                {t("idType")}
                            </label>
                            <div
                                className="flex items-center gap-3 rounded-xl px-4 py-3.5 border-2 transition-all duration-200"
                                style={{
                                    borderColor: errors.idType ? "#dc2626" : idType ? "#2563eb" : "#e8f0fe",
                                    background: errors.idType ? "#fef2f2" : idType ? "#f0f7ff" : "#f8faff",
                                    boxShadow: errors.idType
                                        ? "0 0 0 4px rgba(220,38,38,0.08)"
                                        : idType ? "0 0 0 4px rgba(37,99,235,0.08)" : "none",
                                }}
                            >
                                <svg width="16" height="16" fill="none" stroke={errors.idType ? "#dc2626" : idType ? "#2563eb" : "#93c5fd"} strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                </svg>
                                <select
                                    value={idType}
                                    onChange={(e) => {
                                        setIdType(e.target.value);
                                        setErrors((prev) => ({ ...prev, idType: undefined }));
                                    }}
                                    className="flex-1 bg-transparent text-sm text-gray-800 outline-none cursor-pointer"
                                    style={{ color: idType ? "#1e293b" : "#93c5fd" }}
                                >
                                    <option value="" disabled style={{ color: "#94a3b8" }}>
                                        {t("idTypePlaceholder")}
                                    </option>
                                    {ID_TYPES.map((type) => (
                                        <option key={type} value={type} style={{ color: "#1e293b" }}>
                                            {t(`idType_${type}` as Parameters<typeof t>[0])}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {errors.idType && (
                                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {errors.idType}
                                </p>
                            )}
                        </div>
                    </div>
                </SectionCard>

                {/* ── Required Documents ── */}
                <SectionCard
                    iconBg="bg-emerald-50"
                    iconColor="text-emerald-600"
                    title={t("requiredDocuments")}
                    icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
                >
                    <div className="space-y-6">
                        {/* Grades Certificate */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-gray-600 text-xs font-semibold tracking-wide uppercase">
                                    {t("gradesCertificate")}
                                </label>
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                                    {t("required")}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mb-3">{t("gradesCertificateDesc")}</p>
                            <FileDropzone
                                id="grades"
                                fileState={files.grades}
                                onFileChange={handleFileChange}
                                onRemove={handleRemove}
                                t={t}
                            />
                            {errors.grades && (
                                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {errors.grades}
                                </p>
                            )}
                        </div>

                        <div className="border-t border-gray-100" />

                        {/* Cover Letter */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-gray-600 text-xs font-semibold tracking-wide uppercase">
                                    {t("coverLetter")}
                                </label>
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                                    {t("required")}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mb-3">{t("coverLetterDesc")}</p>
                            <FileDropzone
                                id="coverLetter"
                                fileState={files.coverLetter}
                                onFileChange={handleFileChange}
                                onRemove={handleRemove}
                                t={t}
                            />
                            {errors.coverLetter && (
                                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {errors.coverLetter}
                                </p>
                            )}
                        </div>
                    </div>
                </SectionCard>

                {/* ── Disability Certificate (Optional) ── */}
                <SectionCard
                    iconBg="bg-purple-50"
                    iconColor="text-purple-600"
                    title={t("disabilityCertificate")}
                    icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />}
                >
                    <div className="space-y-4">
                        <p className="text-xs text-gray-400 -mt-2">{t("disabilityCertificateDesc")}</p>

                        {/* Toggle checkbox */}
                        <label className="flex items-center gap-3 cursor-pointer group w-fit">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={hasDisability}
                                    onChange={(e) => {
                                        setHasDisability(e.target.checked);
                                        if (!e.target.checked) {
                                            handleRemove("disability");
                                            setErrors((prev) => ({ ...prev, disability: undefined }));
                                        }
                                    }}
                                    className="sr-only"
                                />
                                <div
                                    className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200"
                                    style={{
                                        borderColor: hasDisability ? "#9333ea" : "#d1d5db",
                                        background: hasDisability ? "#9333ea" : "white",
                                    }}
                                >
                                    {hasDisability && (
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                                {t("hasDisabilityCert")}
                            </span>
                        </label>

                        {hasDisability && (
                            <div>
                                <FileDropzone
                                    id="disability"
                                    fileState={files.disability}
                                    onFileChange={handleFileChange}
                                    onRemove={handleRemove}
                                    t={t}
                                />
                                {errors.disability && (
                                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {errors.disability}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </SectionCard>

                {/* ── Submit Error ── */}
                {submitError && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
                        <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-red-600">{submitError}</p>
                    </div>
                )}

                {/* ── Submit Button ── */}
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{
                        background: submitting ? "#94a3b8" : "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                    }}
                >
                    {submitting ? (
                        <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            {t("submitting")}
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            {t("submit")}
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
