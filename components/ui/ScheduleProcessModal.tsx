"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/Modal";
import { useRoleTheme } from "@/hooks/useRoleTheme";
import { apiPost, apiDelete } from "@/hooks/useApi";

type ProcessStatus = {
    active: boolean;
    scheduled_start: string | null;
    scheduled_end: string | null;
    is_scheduled: boolean;
};

interface ScheduleProcessModalProps {
    open: boolean;
    onClose: () => void;
    isActive: boolean;
    scheduledStart: string | null;
    scheduledEnd: string | null;
    onScheduled: (data: ProcessStatus) => void;
    onStartedNow: () => void;
}

function toLocalInputValue(isoString: string | null): string {
    if (!isoString) return "";
    const d = new Date(isoString + 'Z');
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localNowPlus5(): string {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 5);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ScheduleProcessModal({
    open,
    onClose,
    isActive,
    scheduledStart,
    scheduledEnd,
    onScheduled,
    onStartedNow,
}: ScheduleProcessModalProps) {
    const t = useTranslations("dashboard");
    const tc = useTranslations("common");
    const theme = useRoleTheme();

    const [startNow, setStartNow] = useState(false);
    const [startDate, setStartDate] = useState<string>(() => toLocalInputValue(scheduledStart) || localNowPlus5());
    const [endDate, setEndDate] = useState<string>(() => toLocalInputValue(scheduledEnd));
    const [noEnd, setNoEnd] = useState(!scheduledEnd);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOpen = () => {
        setStartNow(false);
        setStartDate(toLocalInputValue(scheduledStart) || localNowPlus5());
        setEndDate(toLocalInputValue(scheduledEnd));
        setNoEnd(!scheduledEnd);
        setError(null);
    };

    const handleSubmit = async () => {
        setError(null);
        const now = new Date();

        const resolvedStart = (!startNow && !isActive && startDate) ? new Date(startDate) : null;
        const resolvedEnd = (!noEnd && endDate) ? new Date(endDate) : null;

        if (!startNow && !resolvedStart && !resolvedEnd) {
            setError(t("processScheduleErrorNoDate"));
            return;
        }
        if (resolvedStart && resolvedStart <= now) {
            setError(t("processScheduleErrorPast"));
            return;
        }
        if (resolvedEnd && resolvedEnd <= now) {
            setError(t("processScheduleErrorPast"));
            return;
        }
        if (resolvedStart && resolvedEnd && resolvedEnd <= resolvedStart) {
            setError(t("processScheduleErrorEndBeforeStart"));
            return;
        }

        setLoading(true);
        try {
            if (startNow) {
                const toggleData = await apiPost<ProcessStatus>("/selection-process/toggle", {});
                if (resolvedEnd) {
                    const schedData = await apiPost<ProcessStatus>("/selection-process/schedule", {
                        scheduled_end: resolvedEnd.toISOString(),
                    });
                    onScheduled(schedData);
                } else {
                    onScheduled(toggleData);
                }
                onStartedNow();
            } else {
                const body: Record<string, string> = {};
                if (resolvedStart) body.scheduled_start = resolvedStart.toISOString();
                if (resolvedEnd) body.scheduled_end = resolvedEnd.toISOString();
                const data = await apiPost<ProcessStatus>("/selection-process/schedule", body);
                onScheduled(data);
            }
            onClose();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            setError(msg || tc("genericError"));
        } finally {
            setLoading(false);
        }
    };

    const handleCancelSchedule = async () => {
        setLoading(true);
        try {
            const data = await apiDelete<ProcessStatus>("/selection-process/schedule");
            onScheduled(data);
            onClose();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            setError(msg || tc("genericError"));
        } finally {
            setLoading(false);
        }
    };

    const hasExistingSchedule = !!(scheduledStart || scheduledEnd);
    const minDate = localNowPlus5();

    return (
        <Modal open={open} onClose={() => { if (!loading) { handleOpen(); onClose(); } }}>

            {/* ── Header ── */}
            <div className="flex items-center gap-3 mb-1">
                <div className={`w-10 h-10 rounded-2xl ${theme.accentBg} flex items-center justify-center shrink-0`}>
                    <svg className={`w-5 h-5 ${theme.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                        {t("processScheduleTitle")}
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {t("processScheduleDesc")}
                    </p>
                </div>
            </div>

            <div className={`h-px w-full ${theme.accentBg}`} />

            <div className="space-y-5">

                {/* ── Start section ── */}
                {!isActive && (
                    <div className="space-y-3">
                        <p className={`text-[11px] font-bold uppercase tracking-widest ${theme.accent}`}>
                            {t("processScheduleStart")}
                        </p>

                        <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${
                            startNow
                                ? `${theme.accentBg} ${theme.borderLight}`
                                : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                        }`}>
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                                startNow ? `${theme.checkboxBg} border-transparent` : 'border-gray-300 dark:border-gray-600'
                            }`}>
                                {startNow && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <input
                                type="checkbox"
                                checked={startNow}
                                onChange={e => setStartNow(e.target.checked)}
                                disabled={loading}
                                className="sr-only"
                            />
                            <span className={`text-sm font-medium ${startNow ? theme.accentText : 'text-gray-700 dark:text-gray-300'}`}>
                                {t("processScheduleStartNow")}
                            </span>
                        </label>

                        {!startNow && (
                            <input
                                type="datetime-local"
                                value={startDate}
                                min={minDate}
                                onChange={e => setStartDate(e.target.value)}
                                disabled={loading}
                                className={`w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all focus:ring-2 focus:border-transparent disabled:opacity-50 ${theme.focusRing}`}
                            />
                        )}
                    </div>
                )}

                {/* ── End section ── */}
                <div className="space-y-3">
                    <p className={`text-[11px] font-bold uppercase tracking-widest ${theme.accent}`}>
                        {t("processScheduleEnd")}
                    </p>

                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${
                        noEnd
                            ? `${theme.accentBg} ${theme.borderLight}`
                            : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                    }`}>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                            noEnd ? `${theme.checkboxBg} border-transparent` : 'border-gray-300 dark:border-gray-600'
                        }`}>
                            {noEnd && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        <input
                            type="checkbox"
                            checked={noEnd}
                            onChange={e => setNoEnd(e.target.checked)}
                            disabled={loading}
                            className="sr-only"
                        />
                        <span className={`text-sm font-medium ${noEnd ? theme.accentText : 'text-gray-700 dark:text-gray-300'}`}>
                            {t("processScheduleNoEnd")}
                        </span>
                    </label>

                    {!noEnd && (
                        <input
                            type="datetime-local"
                            value={endDate}
                            min={startNow || isActive ? minDate : (startDate || minDate)}
                            onChange={e => setEndDate(e.target.value)}
                            disabled={loading}
                            className={`w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all focus:ring-2 focus:border-transparent disabled:opacity-50 ${theme.focusRing}`}
                        />
                    )}
                </div>

                {/* ── Error ── */}
                {error && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                        <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}
            </div>

            {/* ── Actions ── */}
            <div className="flex justify-between items-center pt-1 gap-2 flex-wrap">
                {hasExistingSchedule && (
                    <button
                        onClick={handleCancelSchedule}
                        disabled={loading}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors disabled:opacity-40"
                    >
                        {t("processScheduleCancel")}
                    </button>
                )}

                <div className={`flex gap-2 ${hasExistingSchedule ? "" : "ml-auto"}`}>
                    <button
                        onClick={() => { if (!loading) { handleOpen(); onClose(); } }}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40"
                    >
                        {t("processCancel")}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${theme.btnPrimary} ${theme.btnPrimaryHover}`}
                    >
                        {loading && (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        {t("processScheduleConfirm")}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
