"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/Modal";
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
    // The backend stores naive local datetimes — display as-is
    return isoString.slice(0, 16);
}

function localNowPlus5(): string {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 5);
    // Return local datetime string (not UTC) for the input default
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toLocalISOString(date: Date): string {
    // Serialize as local time (not UTC) so backend stores and compares in local time
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
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

    const [startNow, setStartNow] = useState(false);
    const [startDate, setStartDate] = useState<string>(() => toLocalInputValue(scheduledStart) || localNowPlus5());
    const [endDate, setEndDate] = useState<string>(() => toLocalInputValue(scheduledEnd));
    const [noEnd, setNoEnd] = useState(!scheduledEnd);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset form state when modal opens
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
                // Toggle on immediately
                const toggleData = await apiPost<ProcessStatus>("/selection-process/toggle", {});
                if (resolvedEnd) {
                    // Also set the scheduled end
                    const schedData = await apiPost<ProcessStatus>("/selection-process/schedule", {
                        scheduled_end: toLocalISOString(resolvedEnd),
                    });
                    onScheduled(schedData);
                } else {
                    onScheduled(toggleData);
                }
                onStartedNow();
            } else {
                const body: Record<string, string> = {};
                if (resolvedStart) body.scheduled_start = toLocalISOString(resolvedStart);
                if (resolvedEnd) body.scheduled_end = toLocalISOString(resolvedEnd);

                const data = await apiPost<ProcessStatus>("/selection-process/schedule", body);
                onScheduled(data);
            }
            onClose();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            setError(msg || "Error");
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
            setError(msg || "Error");
        } finally {
            setLoading(false);
        }
    };

    const hasExistingSchedule = !!(scheduledStart || scheduledEnd);
    const minDate = localNowPlus5();

    return (
        <Modal open={open} onClose={() => { if (!loading) { handleOpen(); onClose(); } }}>
            <div className="border-l-4 border-emerald-500 pl-3 mb-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    {t("processScheduleTitle")}
                </h3>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {t("processScheduleDesc")}
            </p>

            <div className="space-y-4">
                {/* Start section — only when process is not active */}
                {!isActive && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t("processScheduleStart")}
                        </p>

                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={startNow}
                                onChange={e => setStartNow(e.target.checked)}
                                disabled={loading}
                                className="w-4 h-4 rounded accent-emerald-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
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
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 dark:focus:border-emerald-500 disabled:opacity-50"
                            />
                        )}
                    </div>
                )}

                {/* End section */}
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t("processScheduleEnd")}
                    </p>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={noEnd}
                            onChange={e => setNoEnd(e.target.checked)}
                            disabled={loading}
                            className="w-4 h-4 rounded accent-emerald-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
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
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 dark:focus:border-emerald-500 disabled:opacity-50"
                        />
                    )}
                </div>

                {error && (
                    <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
                )}
            </div>

            <div className="flex justify-between items-center pt-1 gap-2 flex-wrap">
                {hasExistingSchedule && (
                    <button
                        onClick={handleCancelSchedule}
                        disabled={loading}
                        className="px-3 py-2 rounded-xl text-xs font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors disabled:opacity-40"
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
                        className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
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
