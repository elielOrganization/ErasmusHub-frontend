'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { getCountryFlagUrl } from '@/lib/countryFlags';
import { COUNTRIES } from '@/lib/countries';
import { translateOpportunity, type OpportunityTranslation } from '@/lib/translate';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { useAuth } from '@/context/AuthContext';
import type { Opportunity, AssignedStudent } from '@/services/opportunityService';
import {
    fetchOpportunityTeachers,
    addOpportunityTeacher,
    removeOpportunityTeacher,
    fetchAllTeachers,
    getOrCreateChat,
    type TeacherInfo,
} from '@/services/chatService';

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
    onOpenChat?: (chatId: number) => void;
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
    onOpenChat,
}: Props) {
    const t = useTranslations('opportunitiesDashboard');
    const theme = useRoleTheme();
    const { user, roleName } = useAuth();

    // ── Animation state ──────────────────────────────────────
    // shouldRender keeps the DOM node alive during exit animation.
    // visible drives the CSS transform/opacity.
    const [shouldRender, setShouldRender] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (open && opp) {
            setShouldRender(true);
            // Double rAF so the browser paints the initial (off-screen) state
            // before we apply the "visible" class that triggers the transition.
            const raf = requestAnimationFrame(() =>
                requestAnimationFrame(() => setVisible(true))
            );
            return () => cancelAnimationFrame(raf);
        } else {
            setVisible(false);
            const t = setTimeout(() => setShouldRender(false), 320);
            return () => clearTimeout(t);
        }
    }, [open, opp?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Keep a ref to the last valid opp so we still render content
    // during the exit animation (when opp becomes null).
    const oppRef = useRef(opp);
    if (opp) oppRef.current = opp;
    const o = oppRef.current;

    // ── Translation state ────────────────────────────────────
    const [translation, setTranslation] = useState<OpportunityTranslation | null>(null);
    const [translating, setTranslating] = useState(false);
    const [showTranslated, setShowTranslated] = useState(false);

    useEffect(() => {
        setTranslation(null);
        setShowTranslated(false);
    }, [o?.id]);

    const handleTranslate = async () => {
        if (!o) return;
        if (translation) { setShowTranslated(v => !v); return; }
        setTranslating(true);
        try {
            const result = await translateOpportunity(o.name, o.description, locale);
            setTranslation(result);
            setShowTranslated(true);
        } catch { /* silently fail */ }
        finally { setTranslating(false); }
    };

    // ── Teacher & chat state ──────────────────────────────────
    const [assignedTeachers, setAssignedTeachers] = useState<TeacherInfo[]>([]);
    const [allTeachers, setAllTeachers] = useState<TeacherInfo[]>([]);
    const [showTeacherPicker, setShowTeacherPicker] = useState(false);
    const [addLoading, setAddLoading] = useState(false);
    const [chatLoading, setChatLoading] = useState(false);

    const isAdmin = roleName?.toLowerCase().includes('admin');
    const isStudent = roleName?.toLowerCase() === 'student';

    useEffect(() => {
        if (!o) return;
        fetchOpportunityTeachers(o.id).then(setAssignedTeachers).catch(() => setAssignedTeachers([]));
    }, [o?.id]);

    useEffect(() => {
        if (!isAdmin || !showTeacherPicker) return;
        fetchAllTeachers().then(setAllTeachers).catch(() => setAllTeachers([]));
    }, [isAdmin, showTeacherPicker]);

    const handleAddTeacher = async (teacherId: number) => {
        if (!o) return;
        setAddLoading(true);
        try {
            const info = await addOpportunityTeacher(o.id, teacherId);
            setAssignedTeachers(prev => [...prev, info]);
        } catch { /* ignore */ }
        finally { setAddLoading(false); }
    };

    const handleRemoveTeacher = async (teacherId: number) => {
        if (!o) return;
        try {
            await removeOpportunityTeacher(o.id, teacherId);
            setAssignedTeachers(prev => prev.filter(t => t.id !== teacherId));
        } catch { /* ignore */ }
    };

    const handleOpenChat = async () => {
        if (!o) return;
        setChatLoading(true);
        try {
            const chat = await getOrCreateChat(o.id);
            onOpenChat?.(chat.id);
        } catch { /* ignore */ }
        finally { setChatLoading(false); }
    };

    const unassignedTeachers = allTeachers.filter(t => !assignedTeachers.some(a => a.id === t.id));

    if (!shouldRender || !o) return null;

    // ── Derived values ────────────────────────────────────────
    const isOpen = o.status === 'open';
    const slotPct = o.max_slots > 0 ? Math.min((o.filled_slots / o.max_slots) * 100, 100) : 0;
    const slotColor = slotPct >= 100 ? 'bg-red-500' : slotPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
    const langKey = locale === 'cs' ? 'cs' : locale === 'es' ? 'es' : 'en';
    const countryName = o.country
        ? (COUNTRIES.find(c => c.code === o.country)?.[langKey] ?? o.country)
        : null;
    const displayName = showTranslated && translation ? translation.name : o.name;
    const displayDescription = showTranslated && translation ? translation.description : o.description ?? '';
    const showTranslateButton = !!(o.name || o.description);

    return (
        <div className="fixed inset-0 z-50">

            {/* ── Backdrop ──────────────────────────────────── */}
            <div
                onClick={onClose}
                className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* ── Panel — always slides in from the right ───── */}
            <div className={`
                absolute top-0 right-0 h-full w-full sm:w-[460px]
                bg-white dark:bg-gray-900 rounded-l-2xl
                shadow-2xl flex flex-col overflow-hidden
                transition-transform duration-300 ease-out
                ${visible ? 'translate-x-0' : 'translate-x-full'}
            `}>

                {/* ── Header — tinted with role colour when translated ── */}
                <div className={`flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0 transition-colors duration-300 ${showTranslated && translation ? theme.accentBg : ''}`}>
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        {t('details')}
                    </span>
                    <div className="flex items-center gap-1">
                        {canManage && onEdit && (
                            <button onClick={onEdit} className={`p-1.5 rounded-lg text-gray-400 ${theme.hoverText} ${theme.hoverBg} transition-colors cursor-pointer`} title={t('editTitle')}>
                                <EditIcon />
                            </button>
                        )}
                        <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                            <XIcon />
                        </button>
                    </div>
                </div>

                {/* ── Scrollable body ───────────────────────── */}
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

                    {/* Name */}
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 leading-snug">
                        {displayName}
                    </h2>

                    {/* Status + Country + City */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${isOpen ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                            {isOpen ? t('open') : t('closed')}
                        </span>
                        {o.country && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-300">
                                {getCountryFlagUrl(o.country) && <img src={getCountryFlagUrl(o.country)!} alt="" className="w-4 h-auto rounded-sm shrink-0" />}
                                {countryName}
                            </span>
                        )}
                        {o.city && (
                            <span className="px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-300">
                                📍 {o.city}
                            </span>
                        )}
                    </div>

                    {/* Stay period */}
                    {(o.start_date || o.end_date) && (
                        <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-4">
                            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-3">{t('stayPeriod')}</p>
                            <div className="flex items-center gap-3">
                                <div className="text-center">
                                    <p className="text-xs text-gray-400 mb-0.5">{t('fieldStartDate')}</p>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        {o.start_date ? new Date(o.start_date).toLocaleDateString(dateLocale) : '—'}
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
                                        {o.end_date ? new Date(o.end_date).toLocaleDateString(dateLocale) : '—'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Slots */}
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{t('slots')}</p>
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{o.filled_slots} / {o.max_slots}</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${slotColor}`} style={{ width: `${slotPct}%` }} />
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
                                    {translating ? t('translating') : showTranslated ? t('showOriginal') : t('translate')}
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
                        {o.students.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">{t('noStudentsAssigned')}</p>
                        ) : (
                            <div className="space-y-1.5">
                                {o.students.map(s => (
                                    <Link key={s.application_id} href={`/${locale}/dashboard/students/${s.user_id}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <div className={`w-8 h-8 rounded-full ${theme.accentBg} flex items-center justify-center shrink-0`}>
                                            <span className={`text-xs font-bold ${theme.accentText}`}>{s.first_name[0]}{s.last_name[0]}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{s.first_name} {s.last_name}</p>
                                            <p className="text-xs text-gray-400 truncate">{s.email}</p>
                                        </div>
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${s.status === 'approved' ? 'bg-emerald-500' : s.status === 'pending' ? 'bg-amber-500' : 'bg-gray-400'}`} />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Responsible teachers */}
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                {t("responsibleTeachers")}
                            </p>
                            {isStudent && assignedTeachers.length > 0 && (
                                <button
                                    onClick={handleOpenChat}
                                    disabled={chatLoading}
                                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors active:scale-95 disabled:opacity-50"
                                >
                                    {chatLoading ? '...' : t("chatWithTeacher")}
                                </button>
                            )}
                        </div>

                        {/* Assigned teachers list */}
                        {assignedTeachers.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">{t("noTeachersAssigned")}</p>
                        ) : (
                            <div className="space-y-2">
                                {assignedTeachers.map(t => (
                                    <div key={t.id} className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                                {t.first_name.charAt(0)}{t.last_name.charAt(0)}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
                                                {t.first_name} {t.last_name}
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{t.email}</p>
                                        </div>
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleRemoveTeacher(t.id)}
                                                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 transition-colors shrink-0"
                                                title={t("removeTeacher")}
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Admin: add teacher picker */}
                        {isAdmin && (
                            <div className="pt-1">
                                {!showTeacherPicker ? (
                                    <button
                                        onClick={() => setShowTeacherPicker(true)}
                                        className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-400 hover:text-blue-500 hover:border-blue-400 transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                        {t("addTeacher")}
                                    </button>
                                ) : (
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t("selectTeacher")}</p>
                                            <button onClick={() => setShowTeacherPicker(false)} className="text-xs text-gray-400 hover:text-gray-600">{t("cancel")}</button>
                                        </div>
                                        {unassignedTeachers.length === 0 ? (
                                            <p className="text-xs text-gray-400 italic py-2">
                                                {allTeachers.length === 0 ? t("loading") : t("allTeachersAssigned")}
                                            </p>
                                        ) : (
                                            <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                                                {unassignedTeachers.map(t => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => handleAddTeacher(t.id)}
                                                        disabled={addLoading}
                                                        className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left disabled:opacity-50"
                                                    >
                                                        <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-300">
                                                                {t.first_name.charAt(0)}{t.last_name.charAt(0)}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{t.first_name} {t.last_name}</p>
                                                            <p className="text-[10px] text-gray-400 truncate">{t.email}</p>
                                                        </div>
                                                        <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                        </svg>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Created at */}
                    <p className="text-xs text-gray-300 dark:text-gray-600 pb-2">
                        {t('createdAt')}: {new Date(o.created_at).toLocaleDateString(dateLocale)}
                    </p>
                </div>
            </div>
        </div>
    );
}
