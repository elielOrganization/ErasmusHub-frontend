"use client";

import { useState, useEffect } from "react";
import { useRoleTheme } from "@/hooks/useRoleTheme";
import { fetchDocumentBlob } from "@/services/documentsService";
import type { UserDocument } from "../types";

interface PreviewModalProps {
    doc: UserDocument | null;
    onClose: () => void;
}

export default function PreviewModal({ doc, onClose }: PreviewModalProps) {
    const theme = useRoleTheme();
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [loadingFile, setLoadingFile] = useState(false);
    const [fileError, setFileError] = useState(false);

    useEffect(() => {
        document.body.style.overflow = doc ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [doc]);

    useEffect(() => {
        if (!doc) {
            setBlobUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
            return;
        }
        let cancelled = false;
        setLoadingFile(true);
        setFileError(false);
        fetchDocumentBlob(doc.id)
            .then((blob) => { if (!cancelled) setBlobUrl(URL.createObjectURL(blob)); })
            .catch(() => { if (!cancelled) setFileError(true); })
            .finally(() => { if (!cancelled) setLoadingFile(false); });
        return () => { cancelled = true; };
    }, [doc]);

    useEffect(() => {
        return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
    }, [blobUrl]);

    if (!doc) return null;

    const isPdf = doc.name?.toLowerCase().endsWith(".pdf");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-5xl h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg ${theme.accentBg} flex items-center justify-center shrink-0`}>
                            <svg className={`w-4 h-4 ${theme.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{doc.name}</p>
                            <p className="text-[11px] text-gray-400">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors shrink-0">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {/* Content */}
                <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
                    {loadingFile ? (
                        <div className="flex flex-col items-center gap-3">
                            <svg className={`w-8 h-8 animate-spin ${theme.accent}`} fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <p className="text-xs text-gray-400">Cargando...</p>
                        </div>
                    ) : fileError ? (
                        <div className="flex flex-col items-center gap-2 text-center">
                            <svg className="w-10 h-10 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-gray-400">No se pudo cargar el archivo</p>
                        </div>
                    ) : blobUrl && isPdf ? (
                        <iframe src={blobUrl} className="w-full h-full rounded-lg border border-gray-200 dark:border-gray-700" />
                    ) : blobUrl ? (
                        <img src={blobUrl} alt={doc.name} className="max-w-full max-h-full rounded-lg shadow-sm object-contain" />
                    ) : null}
                </div>
            </div>
        </div>
    );
}
