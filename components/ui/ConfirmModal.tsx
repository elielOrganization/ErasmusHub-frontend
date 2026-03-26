"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";

function XMarkIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

interface ConfirmModalProps {
    open: boolean;
    title: string;
    description?: string;
    /** Name/label shown in the red highlight box */
    itemName?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    deletingLabel?: string;
    onConfirm: () => Promise<void> | void;
    onClose: () => void;
}

export default function ConfirmModal({
    open,
    title,
    description,
    itemName,
    confirmLabel = "Eliminar",
    cancelLabel = "Cancelar",
    deletingLabel,
    onConfirm,
    onClose,
}: ConfirmModalProps) {
    const [deleting, setDeleting] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleConfirm = async () => {
        setDeleting(true);
        setMsg(null);
        try {
            await onConfirm();
        } catch {
            setMsg({ type: "error", text: "Ha ocurrido un error. Inténtalo de nuevo." });
        } finally {
            setDeleting(false);
        }
    };

    const handleClose = () => {
        if (deleting) return;
        setMsg(null);
        onClose();
    };

    return (
        <Modal open={open} onClose={handleClose}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{title}</h3>
                <button
                    onClick={handleClose}
                    disabled={deleting}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors cursor-pointer disabled:opacity-40"
                >
                    <XMarkIcon />
                </button>
            </div>

            {/* Description */}
            {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            )}

            {/* Item highlight */}
            {itemName && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-3">
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">{itemName}</p>
                </div>
            )}

            {/* Feedback message */}
            {msg && (
                <div className={`rounded-xl border p-3 text-sm font-medium ${msg.type === "success"
                    ? "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400"
                    : "bg-red-50 border-red-100 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                    }`}>
                    {msg.text}
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
                <button
                    onClick={handleClose}
                    disabled={deleting || msg?.type === "success"}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${msg?.type === "success" ? "text-gray-300 cursor-not-allowed" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"}`}
                >
                    {cancelLabel}
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={deleting || msg?.type === "success"}
                    className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors ${deleting || msg?.type === "success" ? "bg-red-400 cursor-not-allowed opacity-60" : "bg-red-600 hover:bg-red-700 cursor-pointer"}`}
                >
                    {deleting ? (deletingLabel ?? confirmLabel) : confirmLabel}
                </button>
            </div>
        </Modal>
    );
}
