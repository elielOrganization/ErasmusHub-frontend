"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useApi, apiPost } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { ApplicationWithOpportunity } from "../page";

function isStudent(roleName: string | null | undefined): boolean {
    if (!roleName) return false;
    const r = roleName.toLowerCase();
    return (
        r.indexOf("student")    !== -1 ||
        r.indexOf("alumno")     !== -1 ||
        r.indexOf("estudiante") !== -1
    );
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface DailyNote {
    id: number;
    date: string;       // "YYYY-MM-DD"
    notes: string | null;
}

// ── Date helpers ───────────────────────────────────────────────────────────────

function generateDays(start: string, end: string): Date[] {
    const days: Date[] = [];
    const current = new Date(start + "T00:00:00");
    const last    = new Date(end   + "T00:00:00");
    while (current <= last) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return days;
}

function toISODate(d: Date): string {
    const y   = d.getFullYear();
    const m   = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function isWeekend(d: Date) { return d.getDay() === 0 || d.getDay() === 6; }

function weekNumber(d: Date): number {
    const jan4  = new Date(d.getFullYear(), 0, 4);
    const start = new Date(jan4);
    start.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
    return Math.floor((d.getTime() - start.getTime()) / 604800000) + 1;
}

function fmtWeekday(d: Date, locale: string) {
    return d.toLocaleDateString(locale, { weekday: "long" });
}
function fmtFull(d: Date, locale: string) {
    return d.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
}
function fmtHeader(s: string | null, locale: string) {
    if (!s) return "—";
    return new Date(s + "T00:00:00").toLocaleDateString(locale, {
        day: "2-digit", month: "long", year: "numeric",
    });
}

// ── Day Modal ─────────────────────────────────────────────────────────────────

interface DayModalProps {
    day: Date;
    opportunityId: number;
    initialNotes: string;
    locale: string;
    t: ReturnType<typeof useTranslations>;
    onClose: () => void;
    onSaved: (date: string, notes: string) => void;
}

function DayModal({ day, opportunityId, initialNotes, locale, t, onClose, onSaved }: DayModalProps) {
    const [text, setText]   = useState(initialNotes);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved]   = useState(false);
    const [error, setError]   = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => { textareaRef.current?.focus(); }, []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSaved(false);
        try {
            await apiPost("/opportunity-daily-notes/", {
                opportunity_id: opportunityId,
                date: toISODate(day),
                notes: text,
            });
            setSaved(true);
            onSaved(toISODate(day), text);
            setTimeout(onClose, 800);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : t("dayModalError"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                            {t("dayModalTitle")}
                        </h3>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 capitalize">
                            {fmtWeekday(day, locale)}, {fmtFull(day, locale)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-4">
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => { setText(e.target.value); setSaved(false); }}
                        rows={6}
                        placeholder={t("dayModalPlaceholder")}
                        className="w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors"
                    />
                    {saved && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {t("dayModalSaved")}
                        </p>
                    )}
                    {error && (
                        <p className="mt-2 text-xs text-red-500 dark:text-red-400">{error}</p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-6 pb-5">
                    <button
                        onClick={onClose}
                        className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        {t("dayModalClose")}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !text.trim()}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 px-5 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed"
                    >
                        {saving && (
                            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                        )}
                        {saving ? t("dayModalSaving") : t("dayModalSave")}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Day Row ────────────────────────────────────────────────────────────────────

function DayRow({
    day, locale, hasNote, isFuture, onClick,
}: {
    day: Date;
    locale: string;
    hasNote: boolean;
    isFuture: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={isFuture ? undefined : onClick}
            disabled={isFuture}
            className={[
                "group w-full flex items-center gap-4 rounded-xl px-4 py-3 text-left transition-all",
                isFuture
                    ? "bg-gray-50 dark:bg-gray-800/30 opacity-45 cursor-not-allowed"
                    : "cursor-pointer bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10 hover:shadow-md",
            ].join(" ")}
        >
            {/* Weekday */}
            <div className="w-28 flex-shrink-0 capitalize">
                <span className={`text-sm font-semibold ${isFuture ? "text-gray-400 dark:text-gray-600" : "text-gray-800 dark:text-gray-200"}`}>
                    {fmtWeekday(day, locale)}
                </span>
            </div>

            {/* Full date */}
            <div className="flex-1 capitalize">
                <span className={`text-sm ${isFuture ? "text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-400"}`}>
                    {fmtFull(day, locale)}
                </span>
            </div>

            {/* Right side: lock / check / plus */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {isFuture ? (
                    <svg className="h-4 w-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                ) : hasNote ? (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        ✓
                    </span>
                ) : (
                    <svg className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                )}
            </div>
        </button>
    );
}

// ── Info Pill ──────────────────────────────────────────────────────────────────

function InfoPill({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
            {icon}{label}
        </span>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PracticaDetailPage() {
    const { id }        = useParams<{ id: string }>();
    const locale        = useLocale();
    const router        = useRouter();
    const searchParams  = useSearchParams();
    const t             = useTranslations("practicas");

    const { user, loading: authLoading } = useAuth();
    const { data: applications, loading, refetch: refetchApps } =
        useApi<ApplicationWithOpportunity[]>("/applications/me/with-opportunity");

    const app   = useMemo(
        () => applications?.find((a) => String(a.opportunity_id) === id) ?? null,
        [applications, id],
    );
    const oppId = app?.opportunity_id ?? null;

    // Selected day for modal
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    // Working days (weekends already excluded), recomputed when opportunity dates change
    const days = useMemo(() => {
        if (!app?.opportunity_start_date || !app?.opportunity_end_date) return null;
        return generateDays(app.opportunity_start_date, app.opportunity_end_date)
            .filter((d) => !isWeekend(d));
    }, [app?.opportunity_start_date, app?.opportunity_end_date]);

    // Today at midnight — stable reference, only needs today's date
    const todayMidnight = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now;
    }, []);

    const workDays = days?.length ?? 0;

    // Cache-busting key: changes when opportunity dates change → forces remount of day list
    const datesKey = `${app?.opportunity_start_date ?? "x"}-${app?.opportunity_end_date ?? "x"}`;

    // Fetch daily notes via useApi (same auth path as the rest of the app)
    const { data: dailyNotesData, refetch: refetchNotes } = useApi<DailyNote[]>(
        oppId ? `/opportunity-daily-notes?opportunity_id=${oppId}` : null,
        { refreshInterval: 0 }
    );

    // Convert array → date→text map
    const notes = useMemo(() => {
        const map: Record<string, string> = {};
        dailyNotesData?.forEach((n) => { map[n.date] = n.notes ?? ""; });
        return map;
    }, [dailyNotesData]);

    // Refresh opportunity data + notes when the user returns to this tab
    const refetchAll = useCallback(() => {
        refetchApps();
        refetchNotes();
    }, [refetchApps, refetchNotes]);

    useEffect(() => {
        const onVisible = () => { if (document.visibilityState === "visible") refetchAll(); };
        document.addEventListener("visibilitychange", onVisible);
        return () => document.removeEventListener("visibilitychange", onVisible);
    }, [refetchAll]);

    // Auto-open modal when ?date=YYYY-MM-DD is in the URL (only once, not on refetch)
    useEffect(() => {
        const dateParam = searchParams.get("date");
        if (!dateParam || !days) return;
        const target = days.find(d => toISODate(d) === dateParam);
        if (!target) return;
        const now = new Date(); now.setHours(0, 0, 0, 0);
        if (target > now) return; // don't open for future days
        setSelectedDay(prev => prev ?? target); // only set if not already open
    }, [searchParams, days]);

    const handleNoteSaved = (date: string, text: string) => {
        // Optimistic local update — refetch will sync from backend
        refetchNotes();
        void date; void text; // suppress lint warnings (refetch covers both)
    };

    // Auth guard
    useEffect(() => {
        if (!authLoading && !user) router.replace(`/${locale}/login`);
    }, [authLoading, user, router, locale]);

    if (authLoading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;
    if (!user)       return <div className="flex justify-center py-20"><LoadingSpinner /></div>;
    if (!isStudent(user.role?.name)) return null;

    return (
        <div className="space-y-6">
            {/* Back */}
            <button
                onClick={() => router.push(`/${locale}/dashboard/internships`)}
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t("title")}
            </button>

            {/* Loading */}
            {loading && (
                <div className="flex justify-center py-20"><LoadingSpinner /></div>
            )}

            {/* Not found */}
            {!loading && !app && applications && (
                <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center">
                    <p className="text-sm text-red-600 dark:text-red-400">{t("notFound")}</p>
                </div>
            )}

            {/* Content */}
            {!loading && app && (
                <>
                    {/* Header card */}
                    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                                <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{app.opportunity_name}</h1>
                                {app.opportunity_institution && (
                                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{app.opportunity_institution}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-5">
                            {(app.opportunity_country || app.opportunity_city) && (
                                <InfoPill
                                    label={[app.opportunity_city, app.opportunity_country].filter(Boolean).join(", ")}
                                    icon={
                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    }
                                />
                            )}
                            {days && (
                                <InfoPill
                                    label={t("totalDaysLabel", { count: days.length })}
                                    icon={
                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    }
                                />
                            )}
                            {days && (
                                <InfoPill
                                    label={t("workDaysLabel", { count: workDays })}
                                    icon={
                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    }
                                />
                            )}
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800/50 px-6 py-4">
                            <div className="text-center">
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">{t("labelStart")}</p>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">
                                    {fmtHeader(app.opportunity_start_date, locale)}
                                </p>
                            </div>
                            <div className="flex-1 mx-4 border-t border-dashed border-gray-300 dark:border-gray-700" />
                            <div className="text-center">
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">{t("labelEnd")}</p>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">
                                    {fmtHeader(app.opportunity_end_date, locale)}
                                </p>
                            </div>
                        </div>

                        {app.opportunity_description && (
                            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                {app.opportunity_description}
                            </p>
                        )}
                    </div>

                    {/* Day list */}
                    {days && days.length > 0 ? (
                        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                    {t("dayListTitle")}
                                </h2>
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    {t("workDaysCount", { count: workDays })}
                                </span>
                            </div>

                            {/* key=datesKey forces a full remount when opportunity dates change */}
                            <div key={datesKey} className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                                {(() => {
                                    const weeks = new Map<number, Date[]>();
                                    days.forEach((d) => {
                                        const wk = weekNumber(d);
                                        if (!weeks.has(wk)) weeks.set(wk, []);
                                        weeks.get(wk)!.push(d);
                                    });

                                    return Array.from(weeks.entries()).map(([wk, wkDays]) => (
                                        <div key={wk}>
                                            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-600">
                                                {t("weekLabel", { n: wk })}
                                            </p>
                                            <div className="space-y-1">
                                                {wkDays.map((d) => {
                                                    const dMidnight = new Date(d);
                                                    dMidnight.setHours(0, 0, 0, 0);
                                                    return (
                                                        <DayRow
                                                            key={d.toISOString()}
                                                            day={d}
                                                            locale={locale}
                                                            hasNote={!!notes[toISODate(d)]}
                                                            isFuture={dMidnight > todayMidnight}
                                                            onClick={() => setSelectedDay(d)}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-10 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t("noDates")}</p>
                        </div>
                    )}
                </>
            )}

            {/* Day modal */}
            {selectedDay && oppId && (
                <DayModal
                    day={selectedDay}
                    opportunityId={oppId}
                    initialNotes={notes[toISODate(selectedDay)] ?? ""}
                    locale={locale}
                    t={t}
                    onClose={() => setSelectedDay(null)}
                    onSaved={handleNoteSaved}
                />
            )}
        </div>
    );
}
