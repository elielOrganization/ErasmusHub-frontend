"use client";

import { useTranslations } from "next-intl";
import { useRoleTheme } from "@/hooks/useRoleTheme";
import { DOC_TYPE_MAP, CARD_CONFIG } from "../constants";
import type { UserDocument } from "../types";
import DocStateBadge from "./DocStateBadge";

interface AllDocumentsSectionProps {
    docs: UserDocument[];
    onPreview: (doc: UserDocument) => void;
    onDelete: (doc: UserDocument) => void;
    onAdd: () => void;
}

export default function AllDocumentsSection({ docs, onPreview, onDelete, onAdd }: AllDocumentsSectionProps) {
    const t = useTranslations("documents");
    const theme = useRoleTheme();
    const hasAnyDocs = docs.length > 0;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            {/* Section header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${theme.accentBg} flex items-center justify-center`}>
                        <svg className={`w-4.5 h-4.5 ${theme.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">{t("allDocuments")}</h2>
                        <p className="text-[11px] text-gray-400">{t("allDocumentsDesc")}</p>
                    </div>
                </div>
                {hasAnyDocs && (
                    <button onClick={onAdd}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white ${theme.btnPrimary} ${theme.btnPrimaryHover} transition-colors`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        {t("addDocument")}
                    </button>
                )}
            </div>

            {hasAnyDocs ? (
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {docs.map((doc) => {
                        const cat = DOC_TYPE_MAP[doc.document_type];
                        const config = cat ? CARD_CONFIG[cat] : null;
                        return (
                            <div key={doc.id} className="flex items-center gap-4 px-6 py-3.5 group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <div className={`w-9 h-9 rounded-lg ${theme.accentBg} flex items-center justify-center shrink-0`}>
                                    <svg className={`w-4 h-4 ${theme.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        {config?.icon ?? <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />}
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{doc.name}</p>
                                    <div className="flex items-center gap-2 text-[11px] text-gray-400 flex-wrap">
                                        {config && <span className={`${theme.accentText} font-medium`}>{t(config.labelKey as Parameters<typeof t>[0])}</span>}
                                        <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                                        <DocStateBadge state={doc.state ?? "pending"} size="sm" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button onClick={() => onPreview(doc)}
                                        className="p-2 rounded-lg text-gray-300 dark:text-gray-600 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all opacity-0 group-hover:opacity-100"
                                        title={t("preview")}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </button>
                                    <button onClick={() => onDelete(doc)}
                                        className="p-2 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                                        title={t("deleteDocument")}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="p-8 flex flex-col items-center text-center gap-3">
                    <div className={`w-14 h-14 rounded-2xl ${theme.accentBg} flex items-center justify-center`}>
                        <svg className={`w-7 h-7 ${theme.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400">{t("noDocumentsYet")}</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 max-w-sm">{t("emptyLibraryDesc")}</p>
                    <button onClick={onAdd}
                        className={`mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.97] ${theme.btnPrimary} ${theme.btnPrimaryHover}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        {t("addDocument")}
                    </button>
                </div>
            )}
        </div>
    );
}
