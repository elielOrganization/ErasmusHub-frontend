'use client';

import { useState, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRoleTheme } from '@/hooks/useRoleTheme';

/* ── Helpers ─────────────────────────────────────────────── */

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday = 0
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

/* ── Component ───────────────────────────────────────────── */

export default function DashboardCalendar() {
    const locale = useLocale();
    const t = useTranslations('dashboard');
    const theme = useRoleTheme();
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());

    const daysFull = WEEKDAYS[locale] || WEEKDAYS.en;
    const daysShort = WEEKDAYS_SHORT[locale] || WEEKDAYS_SHORT.en;

    const monthLabel = useMemo(() => {
        const d = new Date(year, month);
        const formatted = d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }, [year, month, locale]);

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfWeek(year, month);

    const isToday = (day: number) =>
        day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const prev = () => {
        if (month === 0) { setMonth(11); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };

    const next = () => {
        if (month === 11) { setMonth(0); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };

    const goToday = () => {
        setYear(today.getFullYear());
        setMonth(today.getMonth());
    };

    // Build weeks as rows of 7 cells
    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = Array(firstDay).fill(null);

    for (let d = 1; d <= daysInMonth; d++) {
        currentWeek.push(d);
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    }
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) currentWeek.push(null);
        weeks.push(currentWeek);
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{monthLabel}</h2>
                    <button
                        onClick={goToday}
                        className={`text-xs ${theme.accent} ${theme.accentHover} font-medium px-2 py-0.5 rounded-md ${theme.accentBgHover} transition-colors cursor-pointer`}
                    >
                        {t('calendarToday')}
                    </button>
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

            {/* Table */}
            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        {daysFull.map((day, i) => (
                            <th
                                key={day}
                                className={`py-2.5 text-xs font-medium uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 ${
                                    i >= 5 ? 'text-gray-300 dark:text-gray-700' : 'text-gray-400 dark:text-gray-500'
                                }`}
                            >
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
                                const isWeekend = di >= 5;
                                const todayCell = day !== null && isToday(day);
                                return (
                                    <td
                                        key={di}
                                        className={`border border-gray-50 dark:border-gray-800 h-16 md:h-20 align-top p-1.5 transition-colors ${
                                            day === null
                                                ? 'bg-gray-50/50 dark:bg-gray-800/30'
                                                : isWeekend
                                                  ? 'bg-gray-50/30 dark:bg-gray-800/20'
                                                  : theme.hoverSoftBgHalf
                                        }`}
                                    >
                                        {day !== null && (
                                            <div className="flex flex-col h-full">
                                                <span
                                                    className={`text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-full ${
                                                        todayCell
                                                            ? `${theme.btnPrimary} text-white`
                                                            : isWeekend
                                                              ? 'text-gray-300 dark:text-gray-600'
                                                              : 'text-gray-600 dark:text-gray-400'
                                                    }`}
                                                >
                                                    {day}
                                                </span>
                                                {/* Future: schedule items will render here */}
                                            </div>
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
