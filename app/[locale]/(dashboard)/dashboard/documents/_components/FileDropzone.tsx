"use client";

import { useRef, DragEvent, ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { useRoleTheme } from "@/hooks/useRoleTheme";
import { ACCEPTED_TYPES, MAX_SIZE_BYTES } from "../constants";
import type { FileState } from "../types";

interface FileDropzoneProps {
    fileState: FileState;
    onFileChange: (file: File, errorMsg?: string) => void;
    onRemove: () => void;
}

export default function FileDropzone({ fileState, onFileChange, onRemove }: FileDropzoneProps) {
    const t = useTranslations("documents");
    const theme = useRoleTheme();
    const inputRef = useRef<HTMLInputElement>(null);

    const validate = (file: File): string | undefined => {
        if (!ACCEPTED_TYPES.includes(file.type)) return t("errorFileType");
        if (file.size > MAX_SIZE_BYTES) return t("errorFileSize");
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) onFileChange(file, validate(file));
    };

    const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onFileChange(file, validate(file));
        e.target.value = "";
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (fileState.file && !fileState.error) {
        return (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3 border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{fileState.file.name}</p>
                    <p className="text-xs text-gray-400">{formatSize(fileState.file.size)}</p>
                </div>
                <button type="button" onClick={onRemove}
                    className="shrink-0 text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    title={t("removeFile")}>
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
                onDragOver={(e) => e.preventDefault()}
                className={`rounded-xl border-2 border-dashed px-5 py-6 text-center cursor-pointer transition-all duration-200 ${fileState.error
                    ? "border-red-300 bg-red-50 dark:bg-red-900/20"
                    : `border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 ${theme.accentBgHover}`
                }`}>
                <div className="flex flex-col items-center gap-1.5">
                    <svg className={`w-6 h-6 ${fileState.error ? "text-red-400" : "text-gray-300 dark:text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className={`text-xs font-medium ${fileState.error ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}>{t("dropzoneLabel")}</p>
                    <p className="text-[11px] text-gray-400">{t("dropzoneFormats")}</p>
                </div>
            </div>
            {fileState.error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{fileState.error}</p>}
            <input ref={inputRef} type="file" accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,image/jpg,application/pdf" className="hidden" onChange={handleInput} />
        </div>
    );
}
