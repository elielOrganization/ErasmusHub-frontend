'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
import { getCountryFlagUrl } from '@/lib/countryFlags';
import { searchCountries } from '@/lib/countries';
import FilterBar from '@/components/ui/FilterBar';
import Pagination from '@/components/ui/Pagination';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import Cookies from 'js-cookie';
import type { Opportunity, AssignedStudent } from '@/services/opportunityService';

const PAGE_SIZE = 10;

/* ── Types ─────────────────────────────────────────────────── */

export type { AssignedStudent };

export interface OpportunityWithStudents extends Opportunity {
    students: AssignedStudent[];
}

/* ── Icon helpers ──────────────────────────────────────────── */

function ChevronDownIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 pointer-events-none">
            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
    );
}

function XMarkIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
    );
}

/* ── Status pill ───────────────────────────────────────────── */

function StatusPill({ status, t }: { status: string; t: (key: string) => string }) {
    const isOpen = status === 'open';
    return (
        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${isOpen ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
            {isOpen ? t('open') : t('closed')}
        </span>
    );
}

/* ── Slots bar ─────────────────────────────────────────────── */

function SlotsBar({ filled, max }: { filled: number; max: number }) {
    const pct = max > 0 ? Math.min((filled / max) * 100, 100) : 0;
    const color = pct >= 100 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
    return (
        <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-gray-500 font-medium">{filled}/{max}</span>
        </div>
    );
}

/* ── Student pills for assigned students ───────────────────── */

function StudentPills({ students, t, theme, locale }: { students: AssignedStudent[]; t: (key: string) => string; theme: ReturnType<typeof useRoleTheme>; locale: string }) {
    if (students.length === 0) {
        return <span className="text-xs text-gray-400 italic">{t('noStudentsAssigned')}</span>;
    }
    return (
        <div className="flex flex-wrap gap-1">
            {students.map((s) => (
                <Link
                    key={s.application_id}
                    href={`/${locale}/dashboard/students`}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${theme.accentBg} ${theme.accentText} hover:opacity-75 transition-opacity`}
                    title={s.email}
                >
                    {s.first_name} {s.last_name}
                    <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'approved' ? 'bg-emerald-500' : s.status === 'pending' ? 'bg-amber-500' : 'bg-gray-400'}`} />
                </Link>
            ))}
        </div>
    );
}

/* ── Country autocomplete ──────────────────────────────────── */

function CountryInput({ value, onChange, onRawChange, placeholder, inputCls, locale }: {
    value: string;
    onChange: (code: string) => void;
    /** Called with the raw text the user is typing (even before selecting from list) */
    onRawChange?: (raw: string) => void;
    placeholder?: string;
    inputCls: string;
    locale: string;
}) {
    const [query, setQuery] = useState(value);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const lang = locale === "cs" ? "cs" : locale === "es" ? "es" : "en";

    // Sync query when value resets (e.g. modal opens)
    useEffect(() => { setQuery(value); }, [value]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const results = searchCountries(query, locale);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        setQuery(raw);
        setOpen(true);
        onChange('');          // Clear confirmed code — user is typing something new
        onRawChange?.(raw);
    };

    const handleSelect = (code: string, name: string) => {
        onChange(code);
        setQuery(name);
        onRawChange?.(name);
        setOpen(false);
    };

    return (
        <div ref={ref} className="relative">
            <input
                type="text"
                value={query}
                onChange={handleInputChange}
                onFocus={() => query && setOpen(true)}
                placeholder={placeholder}
                className={inputCls}
                autoComplete="off"
            />
            {open && results.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg max-h-48 overflow-y-auto">
                    {results.map(c => (
                        <button
                            key={c.code}
                            type="button"
                            onMouseDown={() => handleSelect(c.code, c[lang])}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            {getCountryFlagUrl(c.code) && (
                                <img src={getCountryFlagUrl(c.code)!} alt="" className="w-5 h-auto rounded-sm shrink-0" />
                            )}
                            <span className="text-sm text-gray-700 dark:text-gray-200 flex-1">{c[lang]}</span>
                            <span className="text-xs text-gray-400 font-mono">{c.code}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ── Create opportunity modal ──────────────────────────────── */

function CreateModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
    const t = useTranslations('opportunitiesDashboard');
    const theme = useRoleTheme();
    const params = useParams();
    const locale = (params?.locale as string) || 'en';
    const [form, setForm] = useState({
        name: '', description: '', country: '', city: '',
        max_slots: 1, start_date: '', end_date: '',
    });
    const [creating, setCreating] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [countryRaw, setCountryRaw] = useState('');

    // Country is invalid when the user has typed something but hasn't selected from the list
    const isCountryInvalid = !!countryRaw.trim() && !form.country;

    const updateField = (key: string, value: string | number) => setForm(f => ({ ...f, [key]: value }));

    // Reset when modal opens
    useEffect(() => {
        if (open) {
            setForm({ name: '', description: '', country: '', city: '', max_slots: 1, start_date: '', end_date: '' });
            setSuccess(false);
            setErrorMsg('');
            setCountryRaw('');
        }
    }, [open]);

    const handleCreate = async () => {
        if (!form.name.trim()) return;
        if (isCountryInvalid) {
            setErrorMsg('Selecciona un país válido del listado de sugerencias.');
            return;
        }
        setCreating(true);
        setErrorMsg('');
        try {
            const token = Cookies.get('auth_token');
            const res = await fetch(`${API_URL}/opportunities/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    description: form.description || null,
                    country: form.country || null,
                    city: form.city || null,
                    max_slots: form.max_slots,
                    status: 'open',
                    start_date: form.start_date || null,
                    end_date: form.end_date || null,
                }),
            });
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => { onCreated(); onClose(); }, 1500);
            } else {
                const err = await res.json().catch(() => null);
                setErrorMsg(err?.detail || t('createError'));
            }
        } catch {
            setErrorMsg(t('createError'));
        } finally {
            setCreating(false);
        }
    };

    if (!open) return null;

    const inputCls = `w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors placeholder-gray-300 dark:placeholder-gray-600`;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={!creating ? onClose : undefined} />
            <div className="relative bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md">

                {success ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <svg className="w-7 h-7 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t('createSuccess')}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{form.name}</p>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">{t('addTitle')}</h3>
                            <button onClick={onClose} disabled={creating} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-40">
                                <XMarkIcon />
                            </button>
                        </div>

                        {/* Nombre */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                {t('fieldName')} <span className="text-red-400">*</span>
                            </label>
                            <input type="text" value={form.name} onChange={e => updateField('name', e.target.value)}
                                placeholder={t('fieldNamePlaceholder')} autoFocus className={inputCls} />
                        </div>

                        {/* Descripción */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldDescription')}</label>
                            <textarea value={form.description} onChange={e => updateField('description', e.target.value)}
                                placeholder={t('fieldDescriptionPlaceholder')} rows={2}
                                className={`${inputCls} resize-none`} />
                        </div>

                        {/* País + Ciudad */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldCountry')}</label>
                                <CountryInput
                                    value={form.country}
                                    onChange={code => updateField('country', code)}
                                    onRawChange={setCountryRaw}
                                    placeholder="Ej: ES, DE, FR…"
                                    inputCls={`${inputCls} ${isCountryInvalid ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
                                    locale={locale}
                                />
                                {isCountryInvalid && (
                                    <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">Selecciona del listado</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldCity')}</label>
                                <input type="text" value={form.city} onChange={e => updateField('city', e.target.value)}
                                    placeholder="Madrid" className={inputCls} />
                            </div>
                        </div>

                        {/* Plazas + Fechas en una fila */}
                        <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
                            {/* Stepper plazas */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldMaxSlots')}</label>
                                <div className="flex items-center gap-1.5 h-9">
                                    <button type="button" onClick={() => updateField('max_slots', Math.max(1, form.max_slots - 1))}
                                        className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center cursor-pointer text-base leading-none">−</button>
                                    <span className={`w-7 text-center text-sm font-bold ${theme.accentText}`}>{form.max_slots}</span>
                                    <button type="button" onClick={() => updateField('max_slots', form.max_slots + 1)}
                                        className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center cursor-pointer text-base leading-none">+</button>
                                </div>
                            </div>

                            {/* Fechas estancia */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Estancia <span className="font-normal text-gray-400">(inicio → fin)</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input type="date" value={form.start_date} onChange={e => updateField('start_date', e.target.value)}
                                        className={inputCls} />
                                    <input type="date" value={form.end_date} min={form.start_date || undefined} onChange={e => updateField('end_date', e.target.value)}
                                        className={inputCls} />
                                </div>
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-400 font-medium">
                                {errorMsg}
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <button onClick={onClose} disabled={creating}
                                className="px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50">
                                {t('cancel')}
                            </button>
                            <button onClick={handleCreate} disabled={!form.name.trim() || creating || isCountryInvalid}
                                className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors inline-flex items-center gap-2 ${!form.name.trim() || creating || isCountryInvalid ? `${theme.btnDisabled} cursor-not-allowed opacity-60` : `${theme.btnPrimary} ${theme.btnPrimaryHover} cursor-pointer`}`}>
                                {creating && (
                                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                )}
                                {creating ? t('creating') : t('create')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Edit opportunity modal ─────────────────────────────────── */

function EditModal({ opp, open, onClose, onUpdated }: { opp: OpportunityWithStudents | null; open: boolean; onClose: () => void; onUpdated: () => void }) {
    const t = useTranslations('opportunitiesDashboard');
    const theme = useRoleTheme();
    const params = useParams();
    const locale = (params?.locale as string) || 'en';
    const [form, setForm] = useState({
        name: '', description: '', country: '', city: '',
        max_slots: 1, status: 'open', start_date: '', end_date: '',
    });
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [countryRaw, setCountryRaw] = useState('');

    const isCountryInvalid = !!countryRaw.trim() && !form.country;

    // Sync form when opp changes
    useEffect(() => {
        if (opp) {
            setForm({
                name: opp.name || '',
                description: opp.description || '',
                country: opp.country || '',
                city: opp.city || '',
                max_slots: opp.max_slots || 1,
                status: opp.status || 'open',
                start_date: opp.start_date || '',
                end_date: opp.end_date || '',
            });
            setSuccess(false);
            setErrorMsg('');
            setCountryRaw(opp.country || '');
        }
    }, [opp?.id]);

    const updateField = (key: string, value: string | number) => setForm(f => ({ ...f, [key]: value }));

    const handleSave = async () => {
        if (!opp || !form.name.trim()) return;
        if (isCountryInvalid) {
            setErrorMsg('Selecciona un país válido del listado de sugerencias.');
            return;
        }
        setSaving(true);
        setErrorMsg('');
        try {
            const token = Cookies.get('auth_token');
            const res = await fetch(`${API_URL}/opportunities/${opp.id}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    description: form.description || null,
                    country: form.country || null,
                    city: form.city || null,
                    max_slots: form.max_slots,
                    status: form.status,
                    start_date: form.start_date || null,
                    end_date: form.end_date || null,
                }),
            });
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => { onUpdated(); onClose(); }, 1500);
            } else {
                const err = await res.json().catch(() => null);
                setErrorMsg(err?.detail || t('editError'));
            }
        } catch {
            setErrorMsg(t('editError'));
        } finally {
            setSaving(false);
        }
    };

    if (!open || !opp) return null;

    const inputCls = `w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors placeholder-gray-300 dark:placeholder-gray-600`;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={!saving ? onClose : undefined} />
            <div className="relative bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md">

                {success ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <svg className="w-7 h-7 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t('editSuccess')}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{form.name}</p>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">{t('editTitle')}</h3>
                            <button onClick={onClose} disabled={saving} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-40">
                                <XMarkIcon />
                            </button>
                        </div>

                        {/* Nombre */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                {t('fieldName')} <span className="text-red-400">*</span>
                            </label>
                            <input type="text" value={form.name} onChange={e => updateField('name', e.target.value)}
                                placeholder={t('fieldNamePlaceholder')} autoFocus className={inputCls} />
                        </div>

                        {/* Descripción */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldDescription')}</label>
                            <textarea value={form.description} onChange={e => updateField('description', e.target.value)}
                                placeholder={t('fieldDescriptionPlaceholder')} rows={2}
                                className={`${inputCls} resize-none`} />
                        </div>

                        {/* País + Ciudad */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldCountry')}</label>
                                <CountryInput
                                    value={form.country}
                                    onChange={code => updateField('country', code)}
                                    onRawChange={setCountryRaw}
                                    placeholder="Ej: ES, DE, FR…"
                                    inputCls={`${inputCls} ${isCountryInvalid ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
                                    locale={locale}
                                />
                                {isCountryInvalid && (
                                    <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">Selecciona del listado</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldCity')}</label>
                                <input type="text" value={form.city} onChange={e => updateField('city', e.target.value)}
                                    placeholder="Madrid" className={inputCls} />
                            </div>
                        </div>

                        {/* Plazas + Estado + Fechas */}
                        <div className="grid grid-cols-[auto_auto_1fr] gap-3 items-start">
                            {/* Stepper plazas */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldMaxSlots')}</label>
                                <div className="flex items-center gap-1.5 h-9">
                                    <button type="button" onClick={() => updateField('max_slots', Math.max(1, form.max_slots - 1))}
                                        className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center cursor-pointer text-base leading-none">−</button>
                                    <span className={`w-7 text-center text-sm font-bold ${theme.accentText}`}>{form.max_slots}</span>
                                    <button type="button" onClick={() => updateField('max_slots', form.max_slots + 1)}
                                        className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center cursor-pointer text-base leading-none">+</button>
                                </div>
                            </div>

                            {/* Estado */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('status')}</label>
                                <div className="relative h-9">
                                    <select value={form.status} onChange={e => updateField('status', e.target.value)}
                                        className={`h-full w-full appearance-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 pr-7 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors cursor-pointer`}>
                                        <option value="open">{t('open')}</option>
                                        <option value="closed">{t('closed')}</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
                                        <ChevronDownIcon />
                                    </div>
                                </div>
                            </div>

                            {/* Fechas estancia */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Estancia <span className="font-normal text-gray-400">(inicio → fin)</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input type="date" value={form.start_date} onChange={e => updateField('start_date', e.target.value)}
                                        className={inputCls} />
                                    <input type="date" value={form.end_date} min={form.start_date || undefined} onChange={e => updateField('end_date', e.target.value)}
                                        className={inputCls} />
                                </div>
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-400 font-medium">
                                {errorMsg}
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <button onClick={onClose} disabled={saving}
                                className="px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50">
                                {t('cancel')}
                            </button>
                            <button onClick={handleSave} disabled={!form.name.trim() || saving || isCountryInvalid}
                                className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors inline-flex items-center gap-2 ${!form.name.trim() || saving || isCountryInvalid ? `${theme.btnDisabled} cursor-not-allowed opacity-60` : `${theme.btnPrimary} ${theme.btnPrimaryHover} cursor-pointer`}`}>
                                {saving && (
                                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                )}
                                {saving ? t('saving') : t('save')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Main component ────────────────────────────────────────── */

export default function OpportunityTable({ opportunities }: { opportunities: OpportunityWithStudents[] }) {
    const t = useTranslations('opportunitiesDashboard');
    const { user } = useAuth();
    const theme = useRoleTheme();
    const params = useParams();
    const locale = (params?.locale as string) || 'en';
    const dateLocale = locale === 'cs' ? 'cs-CZ' : locale === 'es' ? 'es-ES' : 'en-GB';
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [countryFilter, setCountryFilter] = useState<string[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [editOpp, setEditOpp] = useState<OpportunityWithStudents | null>(null);
    const [page, setPage] = useState(1);

    const roleName = user?.role?.name?.toLowerCase() || '';
    const canManage = roleName.includes('admin') || roleName.includes('teacher') || roleName.includes('profesor');

    const countries = useMemo(() => {
        const set = new Set<string>();
        for (const o of opportunities) {
            if (o.country) set.add(o.country);
        }
        return Array.from(set).sort();
    }, [opportunities]);

    const filtered = useMemo(() => {
        setPage(1);
        return opportunities.filter(o => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                if (!o.name.toLowerCase().includes(q) &&
                    !(o.country || '').toLowerCase().includes(q) &&
                    !(o.city || '').toLowerCase().includes(q)) {
                    return false;
                }
            }
            if (statusFilter && o.status !== statusFilter) return false;
            if (countryFilter.length > 0 && (!o.country || !countryFilter.includes(o.country))) return false;
            return true;
        });
    }, [opportunities, searchQuery, statusFilter, countryFilter]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginatedOpps = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <>
            <FilterBar
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder={t('searchPlaceholder')}
                filterLabel={t('filters')}
                clearLabel={t('clearFilters')}
                applyLabel={t('applyFilters')}
                filters={[
                    {
                        type: 'checkbox',
                        key: 'status',
                        label: t('statusLabel'),
                        iconColor: 'text-emerald-500',
                        icon: (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                            </svg>
                        ),
                        value: statusFilter,
                        onChange: setStatusFilter,
                        options: [
                            { value: 'open', label: t('open') },
                            { value: 'closed', label: t('closed') },
                        ],
                    },
                    {
                        type: 'pills',
                        key: 'country',
                        label: t('country'),
                        iconColor: theme.accent,
                        icon: (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-1.5 0a6.5 6.5 0 11-11-4.69v.001a6.489 6.489 0 003.995 2.127.75.75 0 01.654.741v.674c0 .37.27.688.636.74a6.547 6.547 0 001.43 0 .751.751 0 01.636-.74v-.674a.75.75 0 01.654-.741A6.489 6.489 0 0016.5 5.312 6.5 6.5 0 0116.5 10z" clipRule="evenodd" />
                            </svg>
                        ),
                        value: countryFilter,
                        onChange: setCountryFilter,
                        options: countries.map(c => ({
                            value: c,
                            label: c,
                            icon: getCountryFlagUrl(c) ? (
                                <img src={getCountryFlagUrl(c)!} alt="" className="w-4 h-auto rounded-sm" />
                            ) : undefined,
                        })),
                    },
                ]}
                actionButton={canManage ? {
                    label: t('addOpportunity'),
                    onClick: () => setShowCreate(true),
                    icon: <PlusIcon />,
                } : undefined}
            />

            {filtered.length === 0 ? (
                <p className="text-center text-gray-400 py-10 text-sm">{t('noResults')}</p>
            ) : (
                <>
                    {/* Desktop table */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-500 text-sm">
                                    <th className="pb-4 pr-6 font-medium">{t('name')}</th>
                                    <th className="pb-4 pr-6 font-medium">{t('country')}</th>
                                    <th className="pb-4 pr-6 font-medium">{t('status')}</th>
                                    <th className="pb-4 pr-6 font-medium">{t('slots')}</th>
                                    <th className="pb-4 pr-6 font-medium">{t('startDate')}</th>
                                    <th className="pb-4 font-medium">{t('assignedStudents')}</th>
                                    {canManage && <th className="pb-4 font-medium w-20" />}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {paginatedOpps.map(opp => (
                                    <tr key={opp.id} className="group hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="py-4 pr-6">
                                            <p className="font-medium text-gray-700 dark:text-gray-200">{opp.name}</p>
                                            {opp.city && <p className="text-xs text-gray-400">{opp.city}</p>}
                                        </td>
                                        <td className="py-4 pr-6 text-gray-500 dark:text-gray-400 text-sm">
                                            {opp.country ? (
                                                <span className="inline-flex items-center gap-1.5">
                                                    {getCountryFlagUrl(opp.country) && (
                                                        <img
                                                            src={getCountryFlagUrl(opp.country)!}
                                                            alt=""
                                                            className="w-5 h-auto rounded-sm shrink-0"
                                                        />
                                                    )}
                                                    {opp.country}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="py-4 pr-6"><StatusPill status={opp.status} t={t} /></td>
                                        <td className="py-4 pr-6"><SlotsBar filled={opp.filled_slots} max={opp.max_slots} /></td>
                                        <td className="py-4 pr-6 text-gray-500 dark:text-gray-400 text-sm">
                                            {opp.start_date ? new Date(opp.start_date).toLocaleDateString(dateLocale) : '—'}
                                        </td>
                                        <td className="py-4"><StudentPills students={opp.students} t={t} theme={theme} locale={locale} /></td>
                                        {canManage && (
                                            <td className="py-4">
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => setEditOpp(opp)}
                                                        className={`p-1.5 rounded-lg text-gray-400 ${theme.hoverText} ${theme.hoverBg} transition-colors cursor-pointer`}
                                                        title={t('editTitle')}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                            <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="lg:hidden space-y-3">
                        {paginatedOpps.map(opp => (
                            <div key={opp.id} className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-100">{opp.name}</p>
                                        <p className="text-xs text-gray-400 inline-flex items-center gap-1.5">
                                            {opp.country && getCountryFlagUrl(opp.country) && (
                                                <img
                                                    src={getCountryFlagUrl(opp.country)!}
                                                    alt=""
                                                    className="w-4 h-auto rounded-sm shrink-0"
                                                />
                                            )}
                                            {[opp.city, opp.country].filter(Boolean).join(', ') || '—'}
                                        </p>
                                    </div>
                                    <StatusPill status={opp.status} t={t} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-xs text-gray-400">{t('slots')}: </span>
                                        <SlotsBar filled={opp.filled_slots} max={opp.max_slots} />
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {opp.start_date ? new Date(opp.start_date).toLocaleDateString(dateLocale) : ''}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">{t('assignedStudents')}:</p>
                                    <StudentPills students={opp.students} t={t} theme={theme} locale={locale} />
                                </div>
                                {canManage && (
                                    <div className="flex justify-end border-t border-gray-50 dark:border-gray-800 pt-2">
                                        <button
                                            onClick={() => setEditOpp(opp)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${theme.accentText} ${theme.accentBg} ${theme.softHover} transition-colors cursor-pointer`}
                                        >
                                            {t('editTitle')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        totalItems={filtered.length}
                        pageSize={PAGE_SIZE}
                        onPageChange={setPage}
                    />
                </>
            )}

            <CreateModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => window.location.reload()} />
            <EditModal opp={editOpp} open={!!editOpp} onClose={() => setEditOpp(null)} onUpdated={() => window.location.reload()} />
        </>
    );
}
