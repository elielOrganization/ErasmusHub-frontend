'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Cookies from 'js-cookie';
import { API_URL } from '@/lib/api';
import FilterBar from '@/components/ui/FilterBar';
import Pagination from '@/components/ui/Pagination';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { translateRole } from '@/lib/translateRole';
import type { User, Role } from '@/services/userService';

/* ── Parse Rodné číslo ─────────────────────────────────────── */

function parseRodneCislo(rc: string, gender: 'male' | 'female' | ''): { error: string } | { birthDate: string; isMinor: boolean; gender: 'male' | 'female' } {
    const cleaned = rc.replace(/\//g, '').replace(/\s/g, '');
    if (!/^\d{9,10}$/.test(cleaned)) return { error: 'invalidRcFormat' as const };

    const yy = parseInt(cleaned.substring(0, 2), 10);
    let mm = parseInt(cleaned.substring(2, 4), 10);
    const dd = parseInt(cleaned.substring(4, 6), 10);

    if (cleaned.length === 10) {
        const num = parseInt(cleaned, 10);
        if (num % 11 !== 0) return { error: 'invalidRcChecksum' as const };
    }

    let rcGender: 'male' | 'female';
    if (mm > 70) { rcGender = 'female'; mm -= 70; }
    else if (mm > 50) { rcGender = 'female'; mm -= 50; }
    else if (mm > 20) { rcGender = 'male'; mm -= 20; }
    else { rcGender = 'male'; }

    if (gender && rcGender !== gender) return { error: 'rcGenderMismatch' as const };
    if (mm < 1 || mm > 12) return { error: 'invalidRcFormat' as const };

    const isOldFormat = cleaned.length === 9;
    let year: number;
    if (isOldFormat) year = 1900 + yy;
    else if (yy >= 54) year = 1900 + yy;
    else year = 2000 + yy;

    const maxDay = new Date(year, mm, 0).getDate();
    if (dd < 1 || dd > maxDay) return { error: 'invalidRcFormat' as const };

    const birthDate = `${year}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    const today = new Date();
    const birth = new Date(year, mm - 1, dd);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;

    return { birthDate, isMinor: age < 18, gender: rcGender };
}

const PAGE_SIZE = 10;

/* ── Icon components ────────────────────────────────────────── */

function PencilIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
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

function ChevronDownIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 pointer-events-none">
            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
    );
}

/* ── Role pill helper ───────────────────────────────────────── */

function getRolePillClasses(roleName: string): string {
    const name = roleName.toLowerCase();
    if (name.includes('admin')) return 'bg-purple-100 text-purple-700';
    if (name.includes('student')) return 'bg-emerald-100 text-emerald-700';
    if (name.includes('profesor') || name.includes('coordinador')) return 'bg-blue-100 text-blue-700';
    return 'bg-gray-50 text-gray-600';
}

/* ── Modal wrapper ──────────────────────────────────────────── */

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
                {children}
            </div>
        </div>
    );
}

/* ── Action buttons ─────────────────────────────────────────── */

function ActionButtons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
    const theme = useRoleTheme();
    return (
        <div className="flex items-center gap-1">
            <button
                onClick={onEdit}
                className={`p-1.5 rounded-lg text-gray-400 ${theme.hoverText} ${theme.hoverBg} transition-colors cursor-pointer`}
            >
                <PencilIcon />
            </button>
            <button
                onClick={onDelete}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
                <TrashIcon />
            </button>
        </div>
    );
}

function PlusIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
    );
}

/* ── Create user modal ─────────────────────────────────────── */

function CreateUserModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
    const t = useTranslations('adminDashboard');
    const tAuth = useTranslations('auth');
    const theme = useRoleTheme();

    const [step, setStep] = useState(1);
    const totalSteps = 3;

    const [form, setForm] = useState({
        first_name: '', last_name: '', gender: '' as '' | 'male' | 'female',
        rodne_cislo: '', email: '', address: '', phone: '',
        password: '', confirmPassword: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [creating, setCreating] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const updateField = (key: string, value: string) => {
        setForm(f => ({ ...f, [key]: value }));
        if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    };

    const rcParsed = useMemo(() => {
        if (!form.rodne_cislo || !form.gender) return null;
        const result = parseRodneCislo(form.rodne_cislo, form.gender);
        if ('error' in result) return null;
        return result;
    }, [form.rodne_cislo, form.gender]);

    const formatBirthDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    const validateStep = (s: number): boolean => {
        const newErrors: Record<string, string> = {};
        if (s === 1) {
            if (!form.first_name.trim()) newErrors.first_name = tAuth('errors.firstNameRequired');
            if (!form.last_name.trim()) newErrors.last_name = tAuth('errors.lastNameRequired');
            if (!form.gender) newErrors.gender = tAuth('errors.genderRequired');
            if (!form.rodne_cislo.trim()) {
                newErrors.rodne_cislo = tAuth('errors.rodneCisloRequired');
            } else {
                const result = parseRodneCislo(form.rodne_cislo, form.gender);
                if ('error' in result) {
                    const errorKey = result.error;
                    const errorMap: Record<string, string> = {
                        invalidRcFormat: tAuth('errors.invalidRcFormat'),
                        invalidRcChecksum: tAuth('errors.invalidRcChecksum'),
                        rcGenderMismatch: tAuth('errors.rcGenderMismatch'),
                    };
                    newErrors.rodne_cislo = errorMap[errorKey] || tAuth('errors.invalidRcFormat');
                }
            }
        }
        if (s === 2) {
            if (!form.email.trim()) newErrors.email = tAuth('errors.emailRequired');
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = tAuth('errors.invalidEmail');
            if (!form.address.trim()) newErrors.address = tAuth('errors.addressRequired');
            if (!form.phone.trim()) newErrors.phone = tAuth('errors.phoneRequired');
            else if (!/^\+?\d[\d\s]{7,}$/.test(form.phone.trim())) newErrors.phone = tAuth('errors.invalidPhone');
        }
        if (s === 3) {
            if (!form.password) newErrors.password = tAuth('errors.passwordRequired');
            else if (form.password.length < 8) newErrors.password = tAuth('errors.passwordTooShort');
            if (!form.confirmPassword) newErrors.confirmPassword = tAuth('errors.confirmPasswordRequired');
            else if (form.password !== form.confirmPassword) newErrors.confirmPassword = tAuth('errors.passwordsMatch');
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => { if (validateStep(step) && step < totalSteps) setStep(step + 1); };
    const prevStep = () => { if (step > 1) setStep(step - 1); };

    const handleCreate = async () => {
        if (!validateStep(step)) return;
        const result = parseRodneCislo(form.rodne_cislo, form.gender);
        if ('error' in result) return;

        setCreating(true);
        setMsg(null);
        try {
            const token = Cookies.get('auth_token');
            const body: Record<string, unknown> = {
                first_name: form.first_name,
                last_name: form.last_name,
                email: form.email,
                password: form.password,
                rodne_cislo: form.rodne_cislo,
                birth_date: result.birthDate,
                is_minor: result.isMinor,
                address: form.address || null,
                phone: form.phone || null,
            };
            const res = await fetch(`${API_URL}/users/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                setMsg({ type: 'success', text: t('createSuccess') });
                setTimeout(() => { onCreated(); onClose(); setStep(1); setForm({ first_name: '', last_name: '', gender: '', rodne_cislo: '', email: '', address: '', phone: '', password: '', confirmPassword: '' }); setErrors({}); setMsg(null); }, 1000);
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

    const handleClose = () => {
        onClose();
        setStep(1);
        setForm({ first_name: '', last_name: '', gender: '', rodne_cislo: '', email: '', address: '', phone: '', password: '', confirmPassword: '' });
        setErrors({});
        setMsg(null);
    };

    if (!open) return null;

    const inputClass = (field?: string) =>
        `w-full rounded-xl border px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors ${field && errors[field] ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700'}`;

    const errorMsg = (field: string) => errors[field] ? (
        <p className="mt-1 text-xs text-red-600">{errors[field]}</p>
    ) : null;

    const stepLabels = [t('stepPersonal'), t('stepContact'), t('stepSecurity')];

    return (
        <Modal open={open} onClose={handleClose}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('addTitle')}</h3>
                <button onClick={handleClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors cursor-pointer">
                    <XMarkIcon />
                </button>
            </div>

            {/* Step indicator */}
            <div className="space-y-2">
                <p className="text-xs text-gray-400 text-center">
                    {stepLabels[step - 1]} ({step}/{totalSteps})
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full transition-all ${theme.btnPrimary}`} style={{ width: `${(step / totalSteps) * 100}%` }} />
                </div>
            </div>

            {/* Step 1: Personal Data */}
            {step === 1 && (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('firstName')} *</label>
                            <input type="text" value={form.first_name} onChange={e => updateField('first_name', e.target.value)}
                                className={inputClass('first_name')} />
                            {errorMsg('first_name')}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('lastName')} *</label>
                            <input type="text" value={form.last_name} onChange={e => updateField('last_name', e.target.value)}
                                className={inputClass('last_name')} />
                            {errorMsg('last_name')}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldGender')} *</label>
                        <div className="relative">
                            <select value={form.gender} onChange={e => updateField('gender', e.target.value)}
                                className={`${inputClass('gender')} appearance-none pr-8 bg-white dark:bg-gray-800 cursor-pointer`}>
                                <option value="">{t('genderPlaceholder')}</option>
                                <option value="male">{t('genderMale')}</option>
                                <option value="female">{t('genderFemale')}</option>
                            </select>
                            <div className="absolute inset-y-0 right-2 flex items-center text-gray-400 pointer-events-none">
                                <ChevronDownIcon />
                            </div>
                        </div>
                        {errorMsg('gender')}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldRodneCislo')} *</label>
                        <input type="text" value={form.rodne_cislo} onChange={e => updateField('rodne_cislo', e.target.value)}
                            placeholder={t('fieldRodneCisloPlaceholder')}
                            className={inputClass('rodne_cislo')} />
                        {errorMsg('rodne_cislo')}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldBirthDate')}</label>
                        <input type="text" readOnly tabIndex={-1}
                            value={rcParsed ? formatBirthDate(rcParsed.birthDate) : ''}
                            placeholder={t('fieldBirthDatePlaceholder')}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                    </div>
                    {rcParsed?.isMinor && (
                        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                            {t('isMinorInfo')}
                        </p>
                    )}
                </div>
            )}

            {/* Step 2: Contact Data */}
            {step === 2 && (
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldEmail')} *</label>
                        <input type="email" value={form.email} onChange={e => updateField('email', e.target.value)}
                            placeholder={t('fieldEmailPlaceholder')}
                            className={inputClass('email')} />
                        {errorMsg('email')}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldAddress')} *</label>
                        <input type="text" value={form.address} onChange={e => updateField('address', e.target.value)}
                            placeholder={t('fieldAddressPlaceholder')}
                            className={inputClass('address')} />
                        {errorMsg('address')}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldPhone')} *</label>
                        <input type="tel" value={form.phone} onChange={e => updateField('phone', e.target.value)}
                            placeholder={t('fieldPhonePlaceholder')}
                            className={inputClass('phone')} />
                        {errorMsg('phone')}
                    </div>
                </div>
            )}

            {/* Step 3: Security */}
            {step === 3 && (
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldPassword')} *</label>
                        <input type="password" value={form.password} onChange={e => updateField('password', e.target.value)}
                            placeholder={t('fieldPasswordPlaceholder')}
                            className={inputClass('password')} />
                        {errorMsg('password')}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldConfirmPassword')} *</label>
                        <input type="password" value={form.confirmPassword} onChange={e => updateField('confirmPassword', e.target.value)}
                            placeholder={t('fieldConfirmPasswordPlaceholder')}
                            className={inputClass('confirmPassword')} />
                        {errorMsg('confirmPassword')}
                    </div>
                </div>
            )}

            {msg && (
                <div className={`rounded-xl border p-3 text-sm font-medium ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                    {msg.text}
                </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between gap-2 pt-2">
                <div>
                    {step > 1 && (
                        <button onClick={prevStep} disabled={creating || msg?.type === 'success'}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${msg?.type === 'success' ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'}`}>
                            {t('previous')}
                        </button>
                    )}
                </div>
                <div className="flex gap-2">
                    <button onClick={handleClose} disabled={creating || msg?.type === 'success'}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${msg?.type === 'success' ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'}`}>
                        {t('cancel')}
                    </button>
                    {step < totalSteps ? (
                        <button onClick={nextStep}
                            className={`px-4 py-2 rounded-xl text-sm font-medium text-white ${theme.btnPrimary} ${theme.btnPrimaryHover} transition-colors cursor-pointer`}>
                            {t('next')}
                        </button>
                    ) : (
                        <button onClick={handleCreate} disabled={creating || msg?.type === 'success'}
                            className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors ${creating || msg?.type === 'success' ? `${theme.btnDisabled} cursor-not-allowed opacity-60` : `${theme.btnPrimary} ${theme.btnPrimaryHover} cursor-pointer`}`}>
                            {creating ? t('creating') : t('save')}
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
}

/* ── Edit modal ─────────────────────────────────────────────── */

function EditModal({ user, roles, open, onClose, onUpdated }: { user: User | null; roles: Role[]; open: boolean; onClose: () => void; onUpdated: () => void }) {
    const t = useTranslations('adminDashboard');
    const tRoles = useTranslations('roles');
    const theme = useRoleTheme();

    const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', address: '', role_id: '' });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Sync form when user changes
    useEffect(() => {
        if (user) {
            setForm({
                first_name: user.first_name ?? '',
                last_name: user.last_name ?? '',
                email: user.email ?? '',
                phone: user.phone ?? '',
                address: user.address ?? '',
                role_id: user.role?.id?.toString() ?? '',
            });
            setMsg(null);
        }
    }, [user]);

    const updateField = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        setMsg(null);
        try {
            const token = Cookies.get('auth_token');
            const body: Record<string, unknown> = {
                first_name: form.first_name,
                last_name: form.last_name,
                email: form.email,
                phone: form.phone || null,
                address: form.address || null,
                role_id: form.role_id ? parseInt(form.role_id) : null,
            };
            const res = await fetch(`${API_URL}/users/${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                setMsg({ type: 'success', text: t('updateSuccess') });
                setTimeout(() => { onUpdated(); onClose(); }, 1000);
            } else {
                const err = await res.json().catch(() => null);
                setMsg({ type: 'error', text: err?.detail || t('updateError') });
            }
        } catch {
            setMsg({ type: 'error', text: t('updateError') });
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;

    return (
        <Modal open={open} onClose={onClose}>
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('editUser')}</h3>
                <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors cursor-pointer">
                    <XMarkIcon />
                </button>
            </div>
            <p className="text-sm text-gray-400">{t('editUserDescription')}</p>

            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('firstName')}</label>
                        <input
                            type="text"
                            value={form.first_name}
                            onChange={e => updateField('first_name', e.target.value)}
                            className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors`}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('lastName')}</label>
                        <input
                            type="text"
                            value={form.last_name}
                            onChange={e => updateField('last_name', e.target.value)}
                            className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors`}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('email')}</label>
                    <input
                        type="email"
                        value={form.email}
                        onChange={e => updateField('email', e.target.value)}
                        className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors`}
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('phone')}</label>
                        <input
                            type="tel"
                            value={form.phone}
                            onChange={e => updateField('phone', e.target.value)}
                            className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors`}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('fieldRole')}</label>
                        <div className="relative">
                            <select
                                value={form.role_id}
                                onChange={e => updateField('role_id', e.target.value)}
                                className={`w-full appearance-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 pr-8 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors cursor-pointer`}
                            >
                                <option value="">{t('selectRolePlaceholder')}</option>
                                {roles.map((role) => (
                                    <option key={role.id} value={role.id.toString()}>
                                        {translateRole(role.name, tRoles)}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-2 flex items-center text-gray-400 pointer-events-none">
                                <ChevronDownIcon />
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('address')}</label>
                    <input
                        type="text"
                        value={form.address}
                        onChange={e => updateField('address', e.target.value)}
                        className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors`}
                    />
                </div>
            </div>

            {msg && (
                <div className={`rounded-xl border p-3 text-sm font-medium ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                    {msg.text}
                </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
                <button
                    onClick={onClose}
                    disabled={saving || msg?.type === 'success'}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${msg?.type === 'success' ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'}`}
                >
                    {t('cancel')}
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving || msg?.type === 'success'}
                    className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors ${saving || msg?.type === 'success' ? `${theme.btnDisabled} cursor-not-allowed opacity-60` : `${theme.btnPrimary} ${theme.btnPrimaryHover} cursor-pointer`}`}
                >
                    {saving ? t('saving') : t('save')}
                </button>
            </div>
        </Modal>
    );
}

/* ── Delete modal ───────────────────────────────────────────── */

function DeleteModal({ user, open, onClose, onDeleted }: { user: User | null; open: boolean; onClose: () => void; onDeleted: () => void }) {
    const t = useTranslations('adminDashboard');
    const [deleting, setDeleting] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleDelete = async () => {
        if (!user) return;
        setDeleting(true);
        setMsg(null);
        try {
            const token = Cookies.get('auth_token');
            const res = await fetch(`${API_URL}/users/${user.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                setMsg({ type: 'success', text: t('deleteSuccess') });
                setTimeout(() => { onDeleted(); onClose(); setMsg(null); }, 1000);
            } else {
                const err = await res.json().catch(() => null);
                setMsg({ type: 'error', text: err?.detail || t('deleteError') });
            }
        } catch {
            setMsg({ type: 'error', text: t('deleteError') });
        } finally {
            setDeleting(false);
        }
    };

    if (!user) return null;

    return (
        <Modal open={open} onClose={onClose}>
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('deleteUser')}</h3>
                <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors cursor-pointer">
                    <XMarkIcon />
                </button>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('deleteUserDescription')}
            </p>

            <div className="rounded-xl bg-red-50 border border-red-100 p-3">
                <p className="text-sm font-medium text-red-700">
                    {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-red-500">{user.email}</p>
            </div>

            {msg && (
                <div className={`rounded-xl border p-3 text-sm font-medium ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                    {msg.text}
                </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
                <button
                    onClick={onClose}
                    disabled={deleting || msg?.type === 'success'}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${msg?.type === 'success' ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'}`}
                >
                    {t('cancel')}
                </button>
                <button
                    onClick={handleDelete}
                    disabled={deleting || msg?.type === 'success'}
                    className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors ${deleting || msg?.type === 'success' ? 'bg-red-400 cursor-not-allowed opacity-60' : 'bg-red-600 hover:bg-red-700 cursor-pointer'}`}
                >
                    {deleting ? t('deleting') : t('delete')}
                </button>
            </div>
        </Modal>
    );
}

/* ── Main component ─────────────────────────────────────────── */

export default function UserTable({ users }: { users: User[] }) {
    const t = useTranslations('adminDashboard');
    const tRoles = useTranslations('roles');
    const [searchQuery, setSearchQuery] = useState('');
    const [editUser, setEditUser] = useState<User | null>(null);
    const [deleteUser, setDeleteUser] = useState<User | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [page, setPage] = useState(1);

    // Filters
    const [roleFilter, setRoleFilter] = useState('');
    const [minorFilter, setMinorFilter] = useState<'' | 'minor' | 'adult'>('');

    // Sorting
    type SortKey = 'user' | 'email' | 'phone' | 'role' | 'birthDate' | 'minor' | 'createdAt';
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const clearSort = () => { setSortKey(null); setSortDir('asc'); };

    // Fetch all roles from API client-side, fallback to extracting from users
    const [fetchedRoles, setFetchedRoles] = useState<Role[]>([]);
    useEffect(() => {
        const token = Cookies.get('auth_token');
        if (!token) return;
        fetch(`${API_URL}/role/`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.ok ? res.json() : [])
            .then((data: Role[]) => setFetchedRoles(data))
            .catch(() => {});
    }, []);

    const roles = useMemo(() => {
        if (fetchedRoles.length > 0) return fetchedRoles;
        const map = new Map<number, Role>();
        for (const u of users) {
            if (u.role) map.set(u.role.id, u.role);
        }
        return Array.from(map.values());
    }, [users, fetchedRoles]);

    // Filtered users
    const filteredUsers = useMemo(() => {
        setPage(1);
        return users.filter((u) => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                if (!`${u.first_name} ${u.last_name}`.toLowerCase().includes(q) &&
                    !u.email.toLowerCase().includes(q)) {
                    return false;
                }
            }
            if (roleFilter && u.role?.id?.toString() !== roleFilter) return false;
            if (minorFilter === 'minor' && !u.is_minor) return false;
            if (minorFilter === 'adult' && u.is_minor) return false;
            return true;
        });
    }, [users, searchQuery, roleFilter, minorFilter]);

    // Sorted users
    const sortedUsers = useMemo(() => {
        if (!sortKey) return filteredUsers;
        const sorted = [...filteredUsers].sort((a, b) => {
            let aVal = '';
            let bVal = '';
            switch (sortKey) {
                case 'user': aVal = `${a.first_name} ${a.last_name}`.toLowerCase(); bVal = `${b.first_name} ${b.last_name}`.toLowerCase(); break;
                case 'email': aVal = a.email.toLowerCase(); bVal = b.email.toLowerCase(); break;
                case 'phone': aVal = (a.phone || '').toLowerCase(); bVal = (b.phone || '').toLowerCase(); break;
                case 'role': aVal = (a.role?.name || '').toLowerCase(); bVal = (b.role?.name || '').toLowerCase(); break;
                case 'birthDate': aVal = a.birth_date || ''; bVal = b.birth_date || ''; break;
                case 'minor': aVal = a.is_minor ? '0' : '1'; bVal = b.is_minor ? '0' : '1'; break;
                case 'createdAt': aVal = a.created_at || ''; bVal = b.created_at || ''; break;
            }
            if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [filteredUsers, sortKey, sortDir]);

    const totalPages = Math.ceil(sortedUsers.length / PAGE_SIZE);
    const paginatedUsers = sortedUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
                        key: 'role',
                        label: t('roleLabel'),
                        iconColor: 'text-purple-500',
                        icon: (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
                            </svg>
                        ),
                        value: roleFilter,
                        onChange: setRoleFilter,
                        options: roles.map(r => ({ value: r.id.toString(), label: translateRole(r.name, tRoles) })),
                    },
                    {
                        type: 'checkbox',
                        key: 'minor',
                        label: t('ageLabel'),
                        iconColor: 'text-amber-500',
                        icon: (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                            </svg>
                        ),
                        value: minorFilter,
                        onChange: (v) => setMinorFilter(v as '' | 'minor' | 'adult'),
                        options: [
                            { value: 'minor', label: t('onlyMinors') },
                            { value: 'adult', label: t('onlyAdults') },
                        ],
                    },
                ]}
                actionButton={{
                    label: t('addUser'),
                    onClick: () => setShowCreate(true),
                    icon: <PlusIcon />,
                }}
            />

            {sortedUsers.length === 0 ? (
                <p className="text-center text-gray-400 py-10 text-sm">{t('noResults')}</p>
            ) : (
                <>
                    {/* Desktop table */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-500 text-sm">
                                    {([
                                        ['user', t('user')],
                                        ['email', t('email')],
                                        ['phone', t('phone')],
                                        ['role', t('role')],
                                        ['birthDate', t('birthDate')],
                                        ['minor', t('minor')],
                                        ['createdAt', t('createdAt')],
                                    ] as [SortKey, string][]).map(([key, label]) => (
                                        <th key={key}
                                            onClick={() => toggleSort(key)}
                                            className="pb-4 font-medium cursor-default select-none hover:text-gray-600 transition-colors">
                                            <span className="inline-flex items-center gap-1">
                                                {label}
                                                {sortKey === key ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
                                                        className={`w-3.5 h-3.5 text-gray-600 transition-transform ${sortDir === 'desc' ? 'rotate-180' : ''}`}>
                                                        <path fillRule="evenodd" d="M8 3.5a.75.75 0 01.75.75v5.69l2.22-2.22a.75.75 0 111.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 111.06-1.06l2.22 2.22V4.25A.75.75 0 018 3.5z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
                                                        className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100">
                                                        <path fillRule="evenodd" d="M5.22 10.22a.75.75 0 011.06 0L8 11.94l1.72-1.72a.75.75 0 111.06 1.06l-2.25 2.25a.75.75 0 01-1.06 0l-2.25-2.25a.75.75 0 010-1.06zM10.78 5.78a.75.75 0 01-1.06 0L8 4.06 6.28 5.78a.75.75 0 01-1.06-1.06l2.25-2.25a.75.75 0 011.06 0l2.25 2.25a.75.75 0 010 1.06z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </span>
                                        </th>
                                    ))}
                                    <th className="pb-4 font-medium w-20">
                                        {sortKey && (
                                            <button onClick={clearSort}
                                                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                                                    <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
                                                </svg>
                                            </button>
                                        )}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {paginatedUsers.map((user) => {
                                    const rawRole = user.role?.name ?? '';
                                    const displayRole = rawRole ? translateRole(rawRole, tRoles) : t('unknown');
                                    const pillClasses = getRolePillClasses(rawRole);

                                    return (
                                        <tr key={user.id} className="group hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="py-4 font-medium text-gray-700 dark:text-gray-200">
                                                {user.first_name} {user.last_name}
                                            </td>
                                            <td className="py-4 text-gray-500 dark:text-gray-400">{user.email}</td>
                                            <td className="py-4 text-gray-500 dark:text-gray-400">{user.phone || '—'}</td>
                                            <td className="py-4">
                                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${pillClasses}`}>
                                                    {displayRole}
                                                </span>
                                            </td>
                                            <td className="py-4 text-gray-500 dark:text-gray-400 text-sm">
                                                {user.birth_date ? new Date(user.birth_date).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="py-4">
                                                {user.is_minor && (
                                                    <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700">
                                                        {t('minor')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 text-gray-500 dark:text-gray-400 text-sm">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="py-4">
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ActionButtons
                                                        onEdit={() => setEditUser(user)}
                                                        onDelete={() => setDeleteUser(user)}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile sort + cards */}
                    <div className="lg:hidden flex items-center justify-end gap-1 mb-2">
                        <button
                            onClick={() => { setSortKey('user'); setSortDir('asc'); }}
                            className={`p-1.5 rounded-lg transition-colors ${sortKey === 'user' && sortDir === 'asc' ? 'text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M2 3.75A.75.75 0 012.75 3h11.5a.75.75 0 010 1.5H2.75A.75.75 0 012 3.75zM2 7.5a.75.75 0 01.75-.75h8.5a.75.75 0 010 1.5h-8.5A.75.75 0 012 7.5zM2 11.25a.75.75 0 01.75-.75h5.5a.75.75 0 010 1.5h-5.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                            </svg>
                        </button>
                        <button
                            onClick={() => { setSortKey('user'); setSortDir('desc'); }}
                            className={`p-1.5 rounded-lg transition-colors ${sortKey === 'user' && sortDir === 'desc' ? 'text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M2 3.75A.75.75 0 012.75 3h5.5a.75.75 0 010 1.5h-5.5A.75.75 0 012 3.75zM2 7.5a.75.75 0 01.75-.75h8.5a.75.75 0 010 1.5h-8.5A.75.75 0 012 7.5zM2 11.25a.75.75 0 01.75-.75h11.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                            </svg>
                        </button>
                        {sortKey && (
                            <button onClick={clearSort}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                                    <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <div className="lg:hidden space-y-3">
                        {paginatedUsers.map((user) => {
                            const rawRole = user.role?.name ?? '';
                            const displayRole = rawRole ? translateRole(rawRole, tRoles) : t('unknown');
                            const pillClasses = getRolePillClasses(rawRole);

                            return (
                                <div key={user.id} className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-gray-800 dark:text-gray-100">
                                            {user.first_name} {user.last_name}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            {user.is_minor && (
                                                <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700">
                                                    {t('minor')}
                                                </span>
                                            )}
                                            <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${pillClasses}`}>
                                                {displayRole}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
                                        <div>
                                            <span className="text-gray-400">{t('email')}: </span>
                                            <span className="text-gray-600 dark:text-gray-300 break-all">{user.email}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">{t('phone')}: </span>
                                            <span className="text-gray-600 dark:text-gray-300">{user.phone || '—'}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">{t('birthDate')}: </span>
                                            <span className="text-gray-600 dark:text-gray-300">
                                                {user.birth_date ? new Date(user.birth_date).toLocaleDateString() : '—'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">{t('createdAt')}: </span>
                                            <span className="text-gray-600 dark:text-gray-300">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-end border-t border-gray-50 dark:border-gray-800 pt-2">
                                        <ActionButtons
                                            onEdit={() => setEditUser(user)}
                                            onDelete={() => setDeleteUser(user)}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        totalItems={sortedUsers.length}
                        pageSize={PAGE_SIZE}
                        onPageChange={setPage}
                    />
                </>
            )}

            {/* Modals */}
            <CreateUserModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => window.location.reload()} />
            <EditModal user={editUser} roles={roles} open={!!editUser} onClose={() => setEditUser(null)} onUpdated={() => window.location.reload()} />
            <DeleteModal user={deleteUser} open={!!deleteUser} onClose={() => setDeleteUser(null)} onDeleted={() => window.location.reload()} />
        </>
    );
}
