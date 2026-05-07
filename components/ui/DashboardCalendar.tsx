'use client';

import { useState, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { useRolePreview } from '@/context/RolePreviewContext';
import { Link } from '@/i18n/routing';

/* ── Helpers ─────────────────────────────────────────────── */

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday = 0
}

function toDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toISO(y: number, m: number, d: number) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

const WEEKDAYS: Record<string, string[]> = {
    en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    es: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    cs: ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'],
};

const WEEKDAYS_SHORT: Record<string, string[]> = {
    en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    es: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    cs: ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'],
};

/* ── Inner types ─────────────────────────────────────────── */

interface ApplicationWithOpportunity {
    id: number;
    opportunity_id: number;
    status: string;
    opportunity_start_date: string | null;
    opportunity_end_date: string | null;
}

interface DailyNote {
    id: number;
    date: string; // "YYYY-MM-DD"
    notes: string | null;
}

/* ── Component ───────────────────────────────────────────── */

export default function DashboardCalendar() {
    const locale = useLocale();
    const t = useTranslations('dashboard');
    const theme = useRoleTheme();
    const { user } = useAuth();
    const { effectiveRoleName } = useRolePreview();
    const today = new Date();
    const todayDay = toDay(today);
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());

    // Role check
    const roleName = (effectiveRoleName || user?.role?.name || '').toLowerCase();
    const isStudent = roleName.includes('student') || roleName.includes('alumno') || roleName.includes('estudiante');

    // ── Erasmus process (all roles) ──────────────────────────
    const { data: processData } = useApi<{
        active: boolean;
        scheduled_start: string | null;
        scheduled_end: string | null;
        is_scheduled: boolean;
    }>('/selection-process', { refreshInterval: 60_000 });

    const erasmusStart = useMemo(() => {
        if (processData?.scheduled_start) return toDay(new Date(processData.scheduled_start + 'Z'));
        if (processData?.active) return toDay(today);
        return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [processData?.scheduled_start, processData?.active]);

    const erasmusEnd = useMemo(() => {
        if (!processData?.scheduled_end) return null;
        return toDay(new Date(processData.scheduled_end + 'Z'));
    }, [processData?.scheduled_end]);

    // ── Daily notes (students only) ──────────────────────────
    const { data: applications } = useApi<ApplicationWithOpportunity[]>(
        isStudent ? '/applications/me/with-opportunity' : null
    );

    // Pick the internship that has valid dates — any non-rejected application
    const activeApp = useMemo(() => {
        if (!applications) return null;
        return applications.find(a =>
            a.opportunity_start_date &&
            a.opportunity_end_date &&
            a.status.toLowerCase() !== 'rejected'
        ) ?? null;
    }, [applications]);

    const { data: dailyNotes } = useApi<DailyNote[]>(
        activeApp ? `/opportunity-daily-notes?opportunity_id=${activeApp.opportunity_id}` : null,
        { refreshInterval: 60_000 }
    );

    const noteDates = useMemo(() =>
        new Set(dailyNotes?.map(n => n.date) ?? []),
        [dailyNotes]
    );

    const internStart = useMemo(() =>
        activeApp?.opportunity_start_date
            ? toDay(new Date(activeApp.opportunity_start_date + 'T00:00:00'))
            : null,
        [activeApp]
    );
    const internEnd = useMemo(() =>
        activeApp?.opportunity_end_date
            ? toDay(new Date(activeApp.opportunity_end_date + 'T00:00:00'))
            : null,
        [activeApp]
    );

    // ── Range to highlight: internship for students, Erasmus process for everyone else ──
    const rangeStart = isStudent ? internStart : erasmusStart;
    const rangeEnd   = isStudent ? internEnd   : erasmusEnd;

    const sameDay = (ref: Date | null, d: number) =>
        ref !== null &&
        ref.getFullYear() === year &&
        ref.getMonth() === month &&
        ref.getDate() === d;

    const isInRange = (d: number) => {
        if (!rangeStart || !rangeEnd) return false;
        const cell = new Date(year, month, d);
        return cell >= rangeStart && cell <= rangeEnd;
    };

    // ── Diary helpers ────────────────────────────────────────
    const isDiaryDay = (d: number, isWeekend: boolean) => {
        if (!isStudent || !internStart || !internEnd || isWeekend) return false;
        const cell = new Date(year, month, d);
        return cell >= internStart && cell <= internEnd && cell <= todayDay;
    };

    // ── Calendar summary counts for this month ───────────────
    const { doneThisMonth, missedThisMonth } = useMemo(() => {
        if (!isStudent || !internStart || !internEnd) return { doneThisMonth: 0, missedThisMonth: 0 };
        let done = 0, missed = 0;
        const dim = getDaysInMonth(year, month);
        for (let d = 1; d <= dim; d++) {
            const dow = new Date(year, month, d).getDay(); // 0=Sun,6=Sat
            if (dow === 0 || dow === 6) continue;
            const cell = new Date(year, month, d);
            if (cell < internStart || cell > internEnd || cell > todayDay) continue;
            noteDates.has(toISO(year, month, d)) ? done++ : missed++;
        }
        return { doneThisMonth: done, missedThisMonth: missed };
    }, [isStudent, internStart, internEnd, year, month, noteDates, todayDay]);

    const hasDiarySummary = isStudent && (doneThisMonth > 0 || missedThisMonth > 0);

    // ── Calendar layout ──────────────────────────────────────
    const daysFull  = WEEKDAYS[locale]      || WEEKDAYS.en;
    const daysShort = WEEKDAYS_SHORT[locale] || WEEKDAYS_SHORT.en;

    const monthLabel = useMemo(() => {
        const d = new Date(year, month);
        const s = d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
        return s.charAt(0).toUpperCase() + s.slice(1);
    }, [year, month, locale]);

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay    = getFirstDayOfWeek(year, month);

    const isToday = (day: number) =>
        day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const prev = () => month === 0 ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1);
    const next = () => month === 11 ? (setMonth(0),  setYear(y => y + 1)) : setMonth(m => m + 1);
    const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
        currentWeek.push(d);
        if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
    }
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) currentWeek.push(null);
        weeks.push(currentWeek);
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{monthLabel}</h2>
                    <button
                        onClick={goToday}
                        className={`text-xs ${theme.accent} ${theme.accentHover} font-medium px-2 py-0.5 rounded-md ${theme.accentBgHover} transition-colors cursor-pointer`}
                    >
                        {t('calendarToday')}
                    </button>
                    {/* Diary summary pills */}
                    {hasDiarySummary && (
                        <div className="flex items-center gap-1.5">
                            {doneThisMonth > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                    {doneThisMonth}
                                </span>
                            )}
                            {missedThisMonth > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                    {missedThisMonth}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={prev} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button onClick={next} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* ── Table ── */}
            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        {daysFull.map((day, i) => (
                            <th key={day} className={`py-2.5 text-xs font-medium uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 ${i >= 5 ? 'text-gray-300 dark:text-gray-700' : 'text-gray-400 dark:text-gray-500'}`}>
                                <span className="hidden md:inline">{day}</span>
                                <span className="md:hidden">{daysShort[i]}</span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {weeks.map((week, wi) => (
                        <tr key={wi}>
                            {week.map((day, di) => {
                                const isWeekend  = di >= 5;
                                const todayCell  = day !== null && isToday(day);
                                const isStart    = day !== null && sameDay(rangeStart, day);
                                const isEnd      = day !== null && sameDay(rangeEnd, day);
                                const inRange    = day !== null && isInRange(day);
                                const diaryDay   = day !== null && isDiaryDay(day, isWeekend);
                                const diaryDone  = diaryDay && noteDates.has(toISO(year, month, day!));

                                let cellBg: string;
                                if (day === null)           cellBg = 'bg-gray-50/50 dark:bg-gray-800/30';
                                else if (isStart || isEnd)  cellBg = theme.rangeEdgeBg;
                                else if (inRange)           cellBg = theme.rangeBg;
                                else if (isWeekend)         cellBg = 'bg-gray-50/30 dark:bg-gray-800/20';
                                else                        cellBg = '';

                                return (
                                    <td
                                        key={di}
                                        className={`border border-gray-50 dark:border-gray-800 h-16 md:h-20 align-top transition-colors ${cellBg} ${diaryDay ? 'p-0' : 'p-1'}`}
                                    >
                                        {day !== null && (
                                            diaryDay ? (
                                                /* Diary day — full cell is a link */
                                                <Link
                                                    href={`/dashboard/internships/${activeApp!.opportunity_id}?date=${toISO(year, month, day)}`}
                                                    className="flex flex-col h-full w-full p-1 group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                                >
                                                    <span className={`text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-full shrink-0 ${
                                                        todayCell
                                                            ? `${theme.btnPrimary} text-white`
                                                            : 'text-gray-600 dark:text-gray-400'
                                                    }`}>
                                                        {day}
                                                    </span>
                                                    <div className="mt-auto flex justify-center pb-0.5">
                                                        <span className={`w-2 h-2 rounded-full transition-transform group-hover:scale-125 ${diaryDone ? 'bg-green-500' : 'bg-red-400'}`} />
                                                    </div>
                                                </Link>
                                            ) : (
                                                <div className="flex flex-col h-full">
                                                    <span className={`text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-full shrink-0 ${
                                                        todayCell
                                                            ? `${theme.btnPrimary} text-white`
                                                            : isWeekend
                                                              ? 'text-gray-300 dark:text-gray-600'
                                                              : 'text-gray-600 dark:text-gray-400'
                                                    }`}>
                                                        {day}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
