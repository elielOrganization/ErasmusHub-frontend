'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { getCountryFlagUrl } from '@/lib/countryFlags';
import { COUNTRIES } from '@/lib/countries';
import { translateOpportunity, type OpportunityTranslation } from '@/lib/translate';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import type { Opportunity, AssignedStudent } from '@/services/opportunityService';

// Mirrors the export in OpportunityTable without creating a circular import
interface OpportunityWithStudents extends Opportunity {
    students: AssignedStudent[];
}

interface Props {
    opp: OpportunityWithStudents | null;
    open: boolean;
    onClose: () => void;
    locale: string;
    dateLocale: string;
    canManage?: boolean;
    onEdit?: () => void;
}

/* ── Icons ──────────────────────────────────────────────────── */

function XIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
    );
}

function EditIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
        </svg>
    );
}

function TranslateIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M8.22 3.75a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5H15.5V6h.25a.75.75 0 010 1.5H15.5v.5a.75.75 0 01-.75.75h-.5a.75.75 0 01-.75-.75V7.5h-2v.5a.75.75 0 01-.75.75h-.5a.75.75 0 01-.75-.75V7.5h-.5A.75.75 0 018.22 6.75V6h-.25a.75.75 0 010-1.5H8.22V3.75zM10 6h4V5h-4v1zm-7.28 5.47a.75.75 0 011.06 0l.97.97.97-.97a.75.75 0 111.06 1.06l-.97.97.97.97a.75.75 0 11-1.06 1.06l-.97-.97-.97.97a.75.75 0 01-1.06-1.06l.97-.97-.97-.97a.75.75 0 010-1.06zM11.5 11a.75.75 0 01.688.452l2.5 5.5a.75.75 0 01-1.376.596L12.89 16.5h-2.78l-.422.048a.75.75 0 01-1.376-.596l2.5-5.5A.75.75 0 0111.5 11zm0 2.564L10.698 15h1.604L11.5 13.564z" clipRule="evenodd" />
        </svg>
    );
}

function ArrowRightIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400 shrink-0">
            <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
        </svg>
    );
}

/* ── Component ──────────────────────────────────────────────── */

export default function OpportunityDetailSheet({
    opp,
    open,
    onClose,
    locale,
    dateLocale,
    canManage,
    onEdit,
}: Props) {
    const t = useTranslations('opportunitiesDashboard');
    const theme = useRoleTheme();

    const [translation, setTranslation] = useState<OpportunityTranslation | null>(null);
    const [translating, setTranslating] = useState(false);
    const [showTranslated, setShowTranslated] = useState(false);

    // Reset translation when opportunity changes
    useEffect(() => {
        setTranslation(null);
        setShowTranslated(false);
    }, [opp?.id]);

    const handleTranslate = async () => {
        if (!opp) return;
        if (translation) {
            setShowTranslated(v => !v);
            return;
        }
        setTranslating(true);
        try {
            const result = await translateOpportunity(opp.name, opp.description, locale);
            setTranslation(result);
            setShowTranslated(true);
        } catch {
            // silently fail — user stays on original
        } finally {
            setTranslating(false);
        }
    };

    if (!open || !opp) return null;

    const isOpen = opp.status === 'open';
    const slotPct = opp.max_slots > 0 ? Math.min((opp.filled_slots / opp.max_slots) * 100, 100) : 0;
    const slotColor = slotPct >= 100 ? 'bg-red-500' : slotPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';

    // Country name in the active locale
    const langKey = locale === 'cs' ? 'cs' : locale === 'es' ? 'es' : 'en';
    const countryName = opp.country
        ? (COUNTRIES.find(c => c.code === opp.country)?.[langKey] ?? opp.country)
        : null;

    // What text to display (original vs translated)
    const displayName = showTranslated && translation ? translation.name : opp.name;
    const displayDescription = showTranslated && translation
        ? translation.description
        : opp.description ?? '';

    // Show translate button only when content exists and locale is not English
    const showTranslateButton = locale !== 'en' && !!(opp.name || opp.description);

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Panel — bottom sheet on mobile, right drawer on desktop */}
            <div className="absolute bottom-0 left-0 right-0 sm:top-0 sm:left-auto sm:right-0 sm:bottom-auto sm:h-full sm:w-[460px] bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-none sm:rounded-l-2xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-none overflow-hidden">

                {/* ── Header ───────────────────────────────────────── */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        {t('details')}
                    </span>
                    <div className="flex items-center gap-1">
                        {canManage && onEdit && (
                            <button
                                onClick={onEdit}
                                className={`p-1.5 rounded-lg text-gray-400 ${theme.hoverText} ${theme.hoverBg} transition-colors cursor-pointer`}
                                title={t('editTitle')}
                            >
                                <EditIcon />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                            <XIcon />
                        </button>
                    </div>
                </div>

                {/* ── Scrollable body ───────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

                    {/* Name */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 leading-snug">
                            {displayName}
                        </h2>
                        {showTranslated && translation && (
                            <p className="text-xs text-gray-400 mt-0.5 italic">{t('autoTranslated')}</p>
                        )}
                    </div>

                    {/* Status + Country + City pills */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${isOpen
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                            {isOpen ? t('open') : t('closed')}
                        </span>
                        {opp.country && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-300">
                                {getCountryFlagUrl(opp.country) && (
                                    <img src={getCountryFlagUrl(opp.country)!} alt="" className="w-4 h-auto rounded-sm shrink-0" />
                                )}
                                {countryName}
                            </span>
                        )}
                        {opp.city && (
                            <span className="px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-300">
                                📍 {opp.city}
                            </span>
                        )}
                    </div>

                    {/* Stay period */}
                    {(opp.start_date || opp.end_date) && (
                        <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-4">
                            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-3">
                                {t('stayPeriod')}
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="text-center">
                                    <p className="text-xs text-gray-400 mb-0.5">{t('fieldStartDate')}</p>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        {opp.start_date
                                            ? new Date(opp.start_date).toLocaleDateString(dateLocale)
                                            : '—'}
                                    </p>
                                </div>
                                <div className="flex-1 flex items-center gap-1">
                                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                                    <ArrowRightIcon />
                                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-400 mb-0.5">{t('fieldEndDate')}</p>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        {opp.end_date
                                            ? new Date(opp.end_date).toLocaleDateString(dateLocale)
                                            : '—'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Slots */}
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
                                {t('slots')}
                            </p>
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                {opp.filled_slots} / {opp.max_slots}
                            </span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${slotColor}`}
                                style={{ width: `${slotPct}%` }}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                {t('fieldDescription')}
                            </p>
                            {showTranslateButton && (
                                <button
                                    onClick={handleTranslate}
                                    disabled={translating}
                                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50
                                        ${showTranslated
                                            ? `${theme.accentBg} ${theme.accentText}`
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                >
                                    <TranslateIcon />
                                    {translating
                                        ? t('translating')
                                        : showTranslated
                                            ? t('showOriginal')
                                            : t('translate')}
                                </button>
                            )}
                        </div>
                        {displayDescription ? (
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {displayDescription}
                            </p>
                        ) : (
                            <p className="text-sm text-gray-400 italic">{t('noDescription')}</p>
                        )}
                    </div>

                    {/* Assigned students */}
                    <div>
                        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                            {t('assignedStudents')}
                        </p>
                        {opp.students.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">{t('noStudentsAssigned')}</p>
                        ) : (
                            <div className="space-y-1.5">
                                {opp.students.map(s => (
                                    <Link
                                        key={s.application_id}
                                        href={`/${locale}/dashboard/students`}
                                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <div className={`w-8 h-8 rounded-full ${theme.accentBg} flex items-center justify-center shrink-0`}>
                                            <span className={`text-xs font-bold ${theme.accentText}`}>
                                                {s.first_name[0]}{s.last_name[0]}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                                                {s.first_name} {s.last_name}
                                            </p>
                                            <p className="text-xs text-gray-400 truncate">{s.email}</p>
                                        </div>
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${s.status === 'approved'
                                            ? 'bg-emerald-500'
                                            : s.status === 'pending'
                                                ? 'bg-amber-500'
                                                : 'bg-gray-400'}`}
                                        />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Created at */}
                    <p className="text-xs text-gray-300 dark:text-gray-600 pb-2">
                        {t('createdAt')}: {new Date(opp.created_at).toLocaleDateString(dateLocale)}
                    </p>
                </div>
            </div>
        </div>
    );
}
