"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useRoleTheme } from "@/hooks/useRoleTheme";
import { useApi } from "@/hooks/useApi";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { deleteDocument } from "@/services/documentsService";

import { DOC_TYPE_MAP, CARD_CONFIG } from "./constants";
import type { UserDocument, UploadDocType } from "./types";
import DocumentCard from "./_components/DocumentCard";
import AllDocumentsSection from "./_components/AllDocumentsSection";
import UploadModal from "./_components/UploadModal";
import PreviewModal from "./_components/PreviewModal";

// Skeleton for card loading state
function CardSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3 animate-pulse">
            <div className="flex justify-between">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800" />
                <div className="w-16 h-5 rounded-full bg-gray-100 dark:bg-gray-800" />
            </div>
            <div className="w-24 h-4 rounded bg-gray-100 dark:bg-gray-800" />
            <div className="w-full h-3 rounded bg-gray-50 dark:bg-gray-800" />
        </div>
    );
}

export default function DocumentsPage() {
    const t = useTranslations("documents");
    const { user, loading: authLoading } = useAuth();
    const theme = useRoleTheme();
    const [modalOpen, setModalOpen] = useState(false);
    const [modalDocType, setModalDocType] = useState<UploadDocType | "">("");
    const [deleteTarget, setDeleteTarget] = useState<UserDocument | null>(null);
    const [previewDoc, setPreviewDoc] = useState<UserDocument | null>(null);

    const { data: documents, loading: docsLoading, refetch } = useApi<UserDocument[]>("/documents");

    const openModalWithType = (docType?: UploadDocType) => {
        setModalDocType(docType ?? "");
        setModalOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        await deleteDocument(deleteTarget.id);
        refetch();
        setDeleteTarget(null);
    };

    if (authLoading) return <LoadingSpinner />;
    if (!user) return null;

    // Group documents by category
    const docsByCategory: Record<string, UserDocument[]> = { idDoc: [], grades: [], coverLetter: [], disability: [] };
    (documents ?? []).forEach((doc) => {
        const cat = DOC_TYPE_MAP[doc.document_type];
        if (cat && docsByCategory[cat]) docsByCategory[cat].push(doc);
    });

    return (
        <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className={`h-28 bg-gradient-to-r ${theme.gradientFrom} ${theme.gradientTo} flex items-center justify-between px-8`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">{t("title")}</h1>
                            <p className={`text-sm ${theme.gradientSubtext}`}>{t("subtitle")}</p>
                        </div>
                    </div>
                    <button onClick={() => openModalWithType()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.97] backdrop-blur-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        {t("addDocument")}
                    </button>
                </div>
            </div>

            {/* Category cards */}
            {docsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.keys(CARD_CONFIG).map((cat) => (
                        <DocumentCard
                            key={cat}
                            category={cat}
                            docs={docsByCategory[cat] ?? []}
                            onDelete={setDeleteTarget}
                            onPreview={setPreviewDoc}
                            onAdd={() => openModalWithType(cat as UploadDocType)}
                        />
                    ))}
                </div>
            )}

            {/* All documents list */}
            {!docsLoading && (
                <AllDocumentsSection
                    docs={documents ?? []}
                    onPreview={setPreviewDoc}
                    onDelete={setDeleteTarget}
                    onAdd={() => openModalWithType()}
                />
            )}

            {/* Modals */}
            <UploadModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onUploaded={refetch}
                user={user}
                initialDocType={modalDocType}
            />
            <PreviewModal
                doc={previewDoc}
                onClose={() => setPreviewDoc(null)}
            />
            <ConfirmModal
                open={!!deleteTarget}
                title={t("deleteDocument")}
                description={t("deleteConfirm")}
                itemName={deleteTarget?.name}
                confirmLabel={t("deleteDocument")}
                deletingLabel={t("submitting")}
                cancelLabel={t("close")}
                onConfirm={handleDelete}
                onClose={() => setDeleteTarget(null)}
            />
        </div>
    );
}
