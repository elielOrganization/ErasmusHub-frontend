"use client";

import { useTranslations } from "next-intl";
import { useRoleTheme } from "@/hooks/useRoleTheme";
import { CARD_CONFIG } from "../constants";
import type { UserDocument } from "../types";
import DocStateBadge from "./DocStateBadge";

interface DocumentCardProps {
    category: string;
    docs: UserDocument[];
    mandatory?: boolean;
    weight?: number;
    processActive?: boolean;
    onDelete: (doc: UserDocument) => void;
    onPreview: (doc: UserDocument) => void;
    onAdd: () => void;
}

export default function DocumentCard({
    category,
    docs,
    mandatory = true,
    weight = 0,
    processActive = true,
    onDelete,
    onPreview,
    onAdd,
}: DocumentCardProps) {
    const t = useTranslations("documents");
    const theme = useRoleTheme();
    const config = CARD_CONFIG[category];
    if (!config) return null;

    const activeDocs = docs.filter((d) => d.state !== "rejected");
    const rejectedDocs = docs.filter((d) => d.state === "rejected");
    const uploaded = activeDocs.length > 0;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col gap-3">
            {/* Header row */}
            <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl ${theme.accentBg} flex items-center justify-center shrink-0`}>
                    <svg className={`w-5 h-5 ${theme.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        {config.icon}
                    </svg>
                </div>
                {uploaded ? (
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                        {t("cardUploaded")}
                    </span>
                ) : (
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${theme.accentBg} ${theme.accentText}`}>
                        {t("cardPending")}
                    </span>
                )}
            </div>

            {/* Title + badges */}
            <div>
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                        {t(config.labelKey as Parameters<typeof t>[0])}
                    </h3>
                    {mandatory ? (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-800/40">
                            {t("mandatory")}
                        </span>
                    ) : (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-gray-700">
                            {t("optional")}
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                    {t(config.descKey as Parameters<typeof t>[0])}
                </p>
                {weight > 0 && (
                    <p className={`text-[11px] font-semibold mt-1 ${theme.accentText}`}>
                        {(t as (k: string, p: Record<string, number>) => string)("affectsScore", { weight })}
                    </p>
                )}
            </div>

            {/* Document list */}
            <div className="pt-1 border-t border-gray-100 dark:border-gray-800 space-y-2">
                {activeDocs.map((doc) => (
                    <div key={doc.id} className="flex items-start gap-2 group">
                        <svg className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
                        </svg>
                        <button onClick={() => onPreview(doc)} className="flex-1 min-w-0 text-left" title={t("preview")}>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate hover:underline">{doc.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <p className="text-[10px] text-gray-400">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                                <DocStateBadge state={doc.state ?? "pending"} size="sm" />
                            </div>
                        </button>
                        <button onClick={() => onPreview(doc)}
                            className="opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded-md text-gray-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                            title={t("preview")}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>
                        <button onClick={() => onDelete(doc)}
                            className="opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                            title={t("deleteDocument")}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                ))}

                {/* Rejected docs */}
                {rejectedDocs.map((doc) => (
                    <div key={doc.id} className="rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/10 p-2.5 space-y-2">
                        <div className="flex items-start gap-2">
                            <svg className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-red-700 dark:text-red-400 truncate">{doc.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <p className="text-[10px] text-red-400">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                                    <DocStateBadge state="rejected" size="sm" />
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onAdd}
                            disabled={!processActive}
                            className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                processActive
                                    ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            {t("rewriteDocument")}
                        </button>
                    </div>
                ))}

                {/* Add button — only when no active/rejected docs */}
                {!uploaded && rejectedDocs.length === 0 && (
                    <button
                        onClick={onAdd}
                        disabled={!processActive}
                        className={`mt-1 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border border-dashed transition-all duration-200 ${
                            processActive
                                ? `${theme.borderLight} ${theme.accentText} ${theme.accentBg} hover:opacity-80`
                                : "border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed"
                        }`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        {t("addDocument")}
                    </button>
                )}
            </div>
        </div>
    );
}
