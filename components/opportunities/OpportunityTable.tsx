'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
import { getCountryFlagUrl } from '@/lib/countryFlags';
import FilterBar from '@/components/ui/FilterBar';
import Pagination from '@/components/ui/Pagination';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import Cookies from 'js-cookie';
import type { Opportunity } from '@/services/opportunityService';

const PAGE_SIZE = 10;

/* ── Types ─────────────────────────────────────────────────── */

export interface AssignedStudent {
    application_id: number;
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    status: string;
}

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

function StudentPills({ students, t, theme }: { students: AssignedStudent[]; t: (key: string) => string; theme: ReturnType<typeof useRoleTheme> }) {
    if (students.length === 0) {
        return <span className="text-xs text-gray-400 italic">{t('noStudentsAssigned')}</span>;
    }
    return (
        <div className="flex flex-wrap gap-1">
            {students.map((s) => (
                <span
                    key={s.application_id}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${theme.accentBg} ${theme.accentText}`}
                    title={s.email}
                >
                    {s.first_name} {s.last_name}
                    <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'approved' ? 'bg-emerald-500' : s.status === 'pending' ? 'bg-amber-500' : 'bg-gray-400'}`} />
                </span>
            ))}
        </div>
    );
}

/* ── Create opportunity modal ──────────────────────────────── */

function CreateModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
    const t = useTranslations('opportunitiesDashboard');
    const theme = useRoleTheme();
    const [form, setForm] = useState({
        name: '', description: '', country: '', city: '',
        max_slots: '1', start_date: '', end_date: '',
    });
    const [creating, setCreating] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const updateField = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

    const handleCreate = async () => {
        if (!form.name.trim()) return;
        setCreating(true);
        setMsg(null);
        try {
            const token = Cookies.get('auth_token');
            const body: Record<string, unknown> = {
                name: form.name,
                description: form.description || null,
                country: form.country || null,
                city: form.city || null,
                max_slots: parseInt(form.max_slots) || 1,
                status: 'open',
                start_date: form.start_date || null,
                end_date: form.end_date || null,
            };
            const res = await fetch(`${API_URL}/opportunities/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                setMsg({ type: 'success', text: t('createSuccess') });
                setTimeout(() => { onCreated(); onClose(); }, 1000);
            } else {
                const err = await res.json().catch(() => null);
                setMsg({ type: 'error', text: err?.detail || t('createError') });
            }
        } catch {
            setMsg({ type: 'error', text: t('createError') });
        } finally {
            setCreating(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('addTitle')}</h3>
                    <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors cursor-pointer">
                        <XMarkIcon />
                    </button>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldName')}</label>
                        <input type="text" value={form.name} onChange={e => updateField('name', e.target.value)}
                            placeholder={t('fieldNamePlaceholder')}
                            className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors`} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldDescription')}</label>
                        <textarea value={form.description} onChange={e => updateField('description', e.target.value)}
                            placeholder={t('fieldDescriptionPlaceholder')} rows={2}
                            className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors resize-none`} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldCountry')}</label>
                            <input type="text" value={form.country} onChange={e => updateField('country', e.target.value)}
                                placeholder={t('fieldCountryPlaceholder')}
                                className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors`} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldCity')}</label>
                            <input type="text" value={form.city} onChange={e => updateField('city', e.target.value)}
                                placeholder={t('fieldCityPlaceholder')}
                                className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors`} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldMaxSlots')}</label>
                            <input type="number" min="1" value={form.max_slots} onChange={e => updateField('max_slots', e.target.value)}
                                className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors`} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldStartDate')}</label>
                            <input type="date" value={form.start_date} onChange={e => updateField('start_date', e.target.value)}
                                className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors`} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldEndDate')}</label>
                            <input type="date" value={form.end_date} onChange={e => updateField('end_date', e.target.value)}
                                className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors`} />
                        </div>
                    </div>
                </div>

                {msg && (
                    <div className={`rounded-xl border p-3 text-sm font-medium ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                        {msg.text}
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                        {t('cancel')}
                    </button>
                    <button onClick={handleCreate} disabled={!form.name.trim() || creating}
                        className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors ${!form.name.trim() || creating ? `${theme.btnDisabled} cursor-not-allowed opacity-60` : `${theme.btnPrimary} ${theme.btnPrimaryHover} cursor-pointer`}`}>
                        {creating ? t('creating') : t('create')}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Edit opportunity modal ─────────────────────────────────── */

function EditModal({ opp, open, onClose, onUpdated }: { opp: OpportunityWithStudents | null; open: boolean; onClose: () => void; onUpdated: () => void }) {
    const t = useTranslations('opportunitiesDashboard');
    const theme = useRoleTheme();
    const [form, setForm] = useState({
        name: '', description: '', country: '', city: '',
        max_slots: '1', status: 'open', start_date: '', end_date: '',
    });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Sync form when opp changes
    useEffect(() => {
        if (opp) {
            setForm({
                name: opp.name || '',
                description: opp.description || '',
                country: opp.country || '',
                city: opp.city || '',
                max_slots: String(opp.max_slots || 1),
                status: opp.status || 'open',
                start_date: opp.start_date || '',
                end_date: opp.end_date || '',
            });
            setMsg(null);
        }
    }, [opp?.id]);

    const updateField = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

    const handleSave = async () => {
        if (!opp || !form.name.trim()) return;
        setSaving(true);
        setMsg(null);
        try {
            const token = Cookies.get('auth_token');
            const body: Record<string, unknown> = {
                name: form.name,
                description: form.description || null,
                country: form.country || null,
                city: form.city || null,
                max_slots: parseInt(form.max_slots) || 1,
                status: form.status,
                start_date: form.start_date || null,
                end_date: form.end_date || null,
            };
            const res = await fetch(`${API_URL}/opportunities/${opp.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                setMsg({ type: 'success', text: t('editSuccess') });
                setTimeout(() => { onUpdated(); onClose(); }, 1000);
            } else {
                const err = await res.json().catch(() => null);
                setMsg({ type: 'error', text: err?.detail || t('editError') });
            }
        } catch {
            setMsg({ type: 'error', text: t('editError') });
        } finally {
            setSaving(false);
        }
    };

    if (!open || !opp) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('editTitle')}</h3>
                    <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors cursor-pointer">
                        <XMarkIcon />
                    </button>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldName')}</label>
                        <input type="text" value={form.name} onChange={e => updateField('name', e.target.value)}
                            placeholder={t('fieldNamePlaceholder')}
                            className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors`} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldDescription')}</label>
                        <textarea value={form.description} onChange={e => updateField('description', e.target.value)}
                            placeholder={t('fieldDescriptionPlaceholder')} rows={2}
                            className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors resize-none`} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldCountry')}</label>
                            <input type="text" value={form.country} onChange={e => updateField('country', e.target.value)}
                                placeholder={t('fieldCountryPlaceholder')}
                                className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors`} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldCity')}</label>
                            <input type="text" value={form.city} onChange={e => updateField('city', e.target.value)}
                                placeholder={t('fieldCityPlaceholder')}
                                className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors`} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldMaxSlots')}</label>
                            <input type="number" min="1" value={form.max_slots} onChange={e => updateField('max_slots', e.target.value)}
                                className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors`} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('status')}</label>
                            <div className="relative">
                                <select value={form.status} onChange={e => updateField('status', e.target.value)}
                                    className={`w-full appearance-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 pr-8 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors cursor-pointer`}>
                                    <option value="open">{t('open')}</option>
                                    <option value="closed">{t('closed')}</option>
                                </select>
                                <div className="absolute inset-y-0 right-2 flex items-center text-gray-400">
                                    <ChevronDownIcon />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldStartDate')}</label>
                            <input type="date" value={form.start_date} onChange={e => updateField('start_date', e.target.value)}
                                className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors`} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldEndDate')}</label>
                            <input type="date" value={form.end_date} onChange={e => updateField('end_date', e.target.value)}
                                className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors`} />
                        </div>
                    </div>
                </div>

                {msg && (
                    <div className={`rounded-xl border p-3 text-sm font-medium ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                        {msg.text}
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                        {t('cancel')}
                    </button>
                    <button onClick={handleSave} disabled={!form.name.trim() || saving}
                        className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors ${!form.name.trim() || saving ? `${theme.btnDisabled} cursor-not-allowed opacity-60` : `${theme.btnPrimary} ${theme.btnPrimaryHover} cursor-pointer`}`}>
                        {saving ? t('saving') : t('save')}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Main component ────────────────────────────────────────── */

export default function OpportunityTable({ opportunities }: { opportunities: OpportunityWithStudents[] }) {
    const t = useTranslations('opportunitiesDashboard');
    const { user } = useAuth();
    const theme = useRoleTheme();
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
                                            {opp.start_date ? new Date(opp.start_date).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="py-4"><StudentPills students={opp.students} t={t} theme={theme} /></td>
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
                                        {opp.start_date ? new Date(opp.start_date).toLocaleDateString() : ''}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">{t('assignedStudents')}:</p>
                                    <StudentPills students={opp.students} t={t} theme={theme} />
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
