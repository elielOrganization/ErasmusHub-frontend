"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRoleTheme } from "@/hooks/useRoleTheme";
import { uploadDocument } from "@/services/documentsService";
import FileDropzone from "./FileDropzone";
import { emptyFile } from "../types";
import { GYMNASIUM_COURSES } from "../constants";
import type { UploadDocType, FileState } from "../types";

interface UploadModalProps {
    open: boolean;
    onClose: () => void;
    onUploaded: () => void;
    user: { first_name: string; last_name: string; is_minor?: boolean; year?: string | null };
    initialDocType?: UploadDocType | "";
    isMinor?: boolean;
}

export default function UploadModal({ open, onClose, onUploaded, user, initialDocType, isMinor }: UploadModalProps) {
    const t = useTranslations("documents");
    const theme = useRoleTheme();
    const [docType, setDocType] = useState<UploadDocType | "">(initialDocType ?? "");
    const [curso, setCurso] = useState<string>(user.year ?? "");
    const [fileFront, setFileFront] = useState<FileState>(emptyFile());
    const [fileBack, setFileBack] = useState<FileState>(emptyFile());
    const [fileMain, setFileMain] = useState<FileState>(emptyFile());
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        if (open) {
            setDocType(initialDocType ?? "");
            setCurso(user.year ?? "");
        }
        return () => { document.body.style.overflow = ""; };
    }, [open, initialDocType, user.year]);

    const resetForm = () => {
        setDocType("");
        setCurso(user.year ?? "");
        setFileFront(emptyFile()); setFileBack(emptyFile()); setFileMain(emptyFile());
        setSubmitting(false); setSubmitSuccess(false); setSubmitError(null); setFormError(null);
    };

    const handleClose = () => { resetForm(); onClose(); };

    const validate = (): boolean => {
        if (!docType) { setFormError(t("selectDocTypePlaceholder")); return false; }
        if (docType === "idDoc") {
            if (!fileFront.file || fileFront.error) { setFormError(t("errorRequired")); return false; }
            if (!fileBack.file || fileBack.error) { setFormError(t("errorRequired")); return false; }
        } else {
            if (!fileMain.file || fileMain.error) { setFormError(t("errorRequired")); return false; }
        }
        setFormError(null);
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        if (!validate()) return;
        setSubmitting(true);
        try {
            await uploadDocument(docType as UploadDocType, {
                front: fileFront.file ?? undefined,
                back: fileBack.file ?? undefined,
                main: fileMain.file ?? undefined,
            });
            setSubmitSuccess(true);
            onUploaded();
        } catch {
            setSubmitError(t("submitError"));
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) return null;

    const osmileteGroup = GYMNASIUM_COURSES.filter((c) => c.group === "osmilete");
    const ctyrileteGroup = GYMNASIUM_COURSES.filter((c) => c.group === "ctyrilete");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${theme.accentBg} flex items-center justify-center`}>
                            <svg className={`w-4.5 h-4.5 ${theme.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">{t("addDocumentTitle")}</h2>
                    </div>
                    <button onClick={handleClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {submitSuccess ? (
                    <div className="p-6 flex flex-col items-center text-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl ${theme.accentBg} flex items-center justify-center`}>
                            <svg className={`w-7 h-7 ${theme.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t("successTitle")}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">{t("successMsg")}</p>
                        <div className="flex gap-3 mt-2 w-full">
                            <button type="button" onClick={handleClose}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                {t("close")}
                            </button>
                            <button type="button" onClick={resetForm}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white ${theme.btnPrimary} ${theme.btnPrimaryHover} transition-colors`}>
                                {t("uploadMore")}
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">
                        {/* Full name (read-only) */}
                        <div>
                            <label className="block text-gray-500 dark:text-gray-400 text-[11px] font-semibold mb-1.5 tracking-wide uppercase">{t("fullName")}</label>
                            <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                <svg className={`w-4 h-4 ${theme.accent} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="text-sm text-gray-800 dark:text-gray-100">{user.first_name} {user.last_name}</span>
                            </div>
                        </div>

                        {/* Curso — dropdown with Gymnázium Třeboň courses (15+ only) */}
                        <div>
                            <label className="block text-gray-500 dark:text-gray-400 text-[11px] font-semibold mb-1.5 tracking-wide uppercase">{t("courseLabel")}</label>
                            <select
                                value={curso}
                                onChange={(e) => setCurso(e.target.value)}
                                className={`w-full rounded-xl px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-100 outline-none cursor-pointer ${theme.focusRing} transition-all`}
                            >
                                <option value="">{t("coursePlaceholder")}</option>
                                <optgroup label={t("courseGroupOsmilete")}>
                                    {osmileteGroup.map((c) => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </optgroup>
                                <optgroup label={t("courseGroupCtyrilete")}>
                                    {ctyrileteGroup.map((c) => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>

                        {/* Document type selector */}
                        <div>
                            <label className="block text-gray-500 dark:text-gray-400 text-[11px] font-semibold mb-1.5 tracking-wide uppercase">{t("selectDocType")}</label>
                            <select value={docType}
                                onChange={(e) => {
                                    setDocType(e.target.value as UploadDocType);
                                    setFormError(null);
                                    setFileMain(emptyFile()); setFileFront(emptyFile()); setFileBack(emptyFile());
                                }}
                                className={`w-full rounded-xl px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-100 outline-none cursor-pointer ${theme.focusRing} transition-all`}>
                                <option value="" disabled>{t("selectDocTypePlaceholder")}</option>
                                <option value="idDoc">{t("docType_idDoc")}</option>
                                <option value="grades">{t("docType_grades")}</option>
                                <option value="coverLetter">{t("docType_coverLetter")}</option>
                                <option value="disability">{t("docType_disability")}</option>
                                {isMinor && (
                                    <option value="parental">{t("docType_parental")}</option>
                                )}
                            </select>
                        </div>

                        {/* ID Document — front + back */}
                        {docType === "idDoc" && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-500 dark:text-gray-400 text-[11px] font-semibold mb-1.5 tracking-wide uppercase">{t("idDocFront")} <span className="text-red-400">*</span></label>
                                    <p className="text-[11px] text-gray-400 mb-2">{t("idDocFrontDesc")}</p>
                                    <FileDropzone fileState={fileFront} onFileChange={(f, err) => { setFileFront({ file: f, error: err ?? null }); setFormError(null); }} onRemove={() => setFileFront(emptyFile())} />
                                </div>
                                <div>
                                    <label className="block text-gray-500 dark:text-gray-400 text-[11px] font-semibold mb-1.5 tracking-wide uppercase">{t("idDocBack")} <span className="text-red-400">*</span></label>
                                    <p className="text-[11px] text-gray-400 mb-2">{t("idDocBackDesc")}</p>
                                    <FileDropzone fileState={fileBack} onFileChange={(f, err) => { setFileBack({ file: f, error: err ?? null }); setFormError(null); }} onRemove={() => setFileBack(emptyFile())} />
                                </div>
                            </div>
                        )}

                        {/* Single-file documents */}
                        {(docType === "grades" || docType === "coverLetter" || docType === "disability" || docType === "parental") && (
                            <div>
                                <label className="block text-gray-500 dark:text-gray-400 text-[11px] font-semibold mb-1.5 tracking-wide uppercase">
                                    {t(`docType_${docType}` as Parameters<typeof t>[0])} <span className="text-red-400">*</span>
                                </label>
                                <p className="text-[11px] text-gray-400 mb-2">
                                    {docType === "grades"
                                        ? t("gradesCertificateDesc")
                                        : docType === "coverLetter"
                                        ? t("coverLetterDesc")
                                        : docType === "parental"
                                        ? t("parentalAuthDesc")
                                        : t("disabilityCertificateDesc")}
                                </p>
                                <FileDropzone fileState={fileMain} onFileChange={(f, err) => { setFileMain({ file: f, error: err ?? null }); setFormError(null); }} onRemove={() => setFileMain(emptyFile())} />
                            </div>
                        )}

                        {(formError || submitError) && (
                            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                                <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-xs text-red-600 dark:text-red-400">{formError || submitError}</p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-1">
                            <button type="button" onClick={handleClose}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                {t("close")}
                            </button>
                            <button type="submit" disabled={submitting || !docType}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${theme.btnPrimary} ${theme.btnPrimaryHover}`}>
                                {submitting ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        {t("submitting")}
                                    </>
                                ) : t("submit")}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
