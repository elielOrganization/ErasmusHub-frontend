'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Cookies from 'js-cookie';
import { API_URL } from '@/lib/api';
import FilterBar from '@/components/ui/FilterBar';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import FormInput from '@/components/form/FormInput';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { translateRole } from '@/lib/translateRole';
import type { User, Role } from '@/services/userService';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/i18n/routing';
import { adminOpenChatWithUser } from '@/services/chatService';
import { parseRodneCislo } from '@/lib/validateRodneCislo';

const PAGE_SIZE = 10;

const AVATAR_PALETTES: [string, string][] = [
    ['#6366f1', '#8b5cf6'],
    ['#0ea5e9', '#6366f1'],
    ['#10b981', '#0ea5e9'],
    ['#f59e0b', '#ef4444'],
    ['#ec4899', '#8b5cf6'],
    ['#14b8a6', '#6366f1'],
];

function avatarGradient(name: string): [string, string] {
    const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
    return AVATAR_PALETTES[code % AVATAR_PALETTES.length];
}

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

function PlusIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
    );
}

function ChatIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M3.505 2.365A41.369 41.369 0 019 2c1.863 0 3.697.124 5.495.365 1.247.167 2.18 1.108 2.435 2.268a4.45 4.45 0 00-.577-.069 43.141 43.141 0 00-4.706 0C9.229 4.696 7.5 6.727 7.5 8.998v2.24c0 1.413.67 2.735 1.76 3.562l-2.98 2.98A.75.75 0 015 17.25v-3.443c-.501-.048-1-.106-1.495-.172C2.033 13.438 1 12.162 1 10.72V5.28c0-1.441 1.033-2.717 2.505-2.914z" />
            <path d="M14 6c-.762 0-1.52.02-2.271.062C10.157 6.148 9 7.472 9 8.998v2.24c0 1.519 1.147 2.839 2.71 2.935.214.013.428.024.642.034.2.009.385.09.518.224l2.35 2.35a.75.75 0 001.28-.531v-2.07c1.453-.195 2.5-1.463 2.5-2.915V8.998c0-1.526-1.157-2.85-2.729-2.936A41.645 41.645 0 0014 6z" />
        </svg>
    );
}

/* ── Role pill helper ───────────────────────────────────────── */

function getRolePillClasses(roleName: string): string {
    const name = roleName.toLowerCase();
    if (name.includes('admin')) return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
    if (name.includes('student')) return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
    if (name.includes('teacher') || name.includes('professor') || name.includes('profesor') || name.includes('coordinator') || name.includes('coordinador')) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    return 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300';
}

/* ── Action buttons ─────────────────────────────────────────── */

function ActionButtons({ onEdit, onDelete, onChat, isSelf, isSuperAdmin, isAdmin }: {
    onEdit: () => void;
    onDelete: () => void;
    onChat?: () => void;
    isSelf?: boolean;
    isSuperAdmin?: boolean;
    isAdmin?: boolean;
}) {
    const theme = useRoleTheme();
    const t = useTranslations('adminDashboard');
    const canDelete = !isSelf && !isSuperAdmin;
    const showChat = !isSelf && !isAdmin && !!onChat;
    return (
        <div className="flex items-center gap-1">
            {showChat && (
                <button
                    onClick={e => { e.stopPropagation(); onChat!(); }}
                    title={t('sendMessage')}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                >
                    <ChatIcon />
                </button>
            )}
            <button
                onClick={e => { e.stopPropagation(); onEdit(); }}
                className={`p-1.5 rounded-lg text-gray-400 ${theme.hoverText} ${theme.hoverBg} transition-colors cursor-pointer`}
            >
                <PencilIcon />
            </button>
            <button
                onClick={canDelete ? e => { e.stopPropagation(); onDelete(); } : undefined}
                disabled={!canDelete}
                title={isSuperAdmin ? t('lockedSuperAdmin') : isSelf ? t('lockedCannotDeleteSelf') : undefined}
                className={`p-1.5 rounded-lg transition-colors ${!canDelete ? 'text-gray-200 dark:text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer'}`}
            >
                <TrashIcon />
            </button>
        </div>
    );
}

/* ── User profile panel ─────────────────────────────────────── */

function UserProfilePanel({ user, open, onClose, onEdit, onDelete, currentUserId }: {
    user: User | null;
    open: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    currentUserId?: number;
}) {
    const t = useTranslations('adminDashboard');
    const tRoles = useTranslations('roles');
    const tUp = useTranslations('userProfile');

    const [mounted, setMounted] = useState(false);
    const [show, setShow] = useState(false);
    const [localUser, setLocalUser] = useState<User | null>(null);

    useEffect(() => {
        if (user) setLocalUser(user);
    }, [user]);

    useEffect(() => {
        if (open) {
            setMounted(true);
            // Double rAF: first frame mounts at start state, second frame triggers transition
            const id = requestAnimationFrame(() =>
                requestAnimationFrame(() => setShow(true))
            );
            return () => cancelAnimationFrame(id);
        } else {
            setShow(false);
            const tid = setTimeout(() => setMounted(false), 300);
            return () => clearTimeout(tid);
        }
    }, [open]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (open) document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open, onClose]);

    if (!mounted || !localUser) return null;

    const isSuperAdmin = localUser.id === 1;
    const isSelf = localUser.id === currentUserId;
    const canDelete = !isSelf && !isSuperAdmin;
    const rawRole = localUser.role?.name ?? '';
    const displayRole = rawRole ? translateRole(rawRole, tRoles) : t('unknown');
    const pillClasses = getRolePillClasses(rawRole);
    const [avFrom, avTo] = avatarGradient(localUser.first_name + localUser.last_name);
    const initials = `${localUser.first_name[0] ?? ''}${localUser.last_name[0] ?? ''}`.toUpperCase();

    const fmt = (d?: string | null) =>
        d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : null;

    const fields: { label: string; val: string | null | undefined }[] = [
        { label: tUp('firstName'),  val: localUser.first_name },
        { label: tUp('lastName'),   val: localUser.last_name },
        { label: tUp('email'),      val: localUser.email },
        { label: tUp('phone'),      val: localUser.phone },
        { label: tUp('address'),    val: localUser.address },
        { label: tUp('birthDate'),  val: fmt(localUser.birth_date) },
        { label: tUp('memberSince'), val: fmt(localUser.created_at) },
        ...(localUser.rodne_cislo
            ? [{ label: tUp('rodneCislo'), val: localUser.rodne_cislo.slice(0, 4) + '••••••' }]
            : []),
    ];

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Panel */}
            <div className={`relative ml-auto h-full w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl flex flex-col overflow-hidden transition-transform duration-300 ease-in-out ${show ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-4 min-w-0">
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold shrink-0 shadow"
                            style={{ background: `linear-gradient(135deg, ${avFrom}, ${avTo})` }}
                        >
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 truncate">
                                    {localUser.first_name} {localUser.last_name}
                                </h2>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                                <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${pillClasses}`}>
                                    {displayRole}
                                </span>
                                {localUser.is_minor && (
                                    <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                                        {t('minor')}
                                    </span>
                                )}
                                {isSuperAdmin && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-widest uppercase border border-amber-300/60 dark:border-amber-600/50 text-amber-600 dark:text-amber-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v4A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5v-4A1.5 1.5 0 0 0 11 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" /></svg>
                                        {t('superAdminBadge')}
                                    </span>
                                )}
                                {isSelf && !isSuperAdmin && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-widest uppercase border border-violet-300/60 dark:border-violet-600/50 text-violet-500 dark:text-violet-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 dark:bg-violet-500" />
                                        {t('youBadge')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors cursor-pointer shrink-0 mt-0.5"
                    >
                        <XMarkIcon />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-1">
                    {fields.map(({ label, val }) =>
                        val ? (
                            <div key={label} className="flex items-baseline gap-2 py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                                <span className="w-28 shrink-0 text-xs text-gray-400 dark:text-gray-500">{label}</span>
                                <span className="text-sm text-gray-700 dark:text-gray-200 font-medium break-all">{val}</span>
                            </div>
                        ) : null
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                    <button
                        onClick={() => { onClose(); onEdit(); }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                        <PencilIcon />
                        {t('editUser')}
                    </button>
                    <button
                        onClick={canDelete ? () => { onClose(); onDelete(); } : undefined}
                        disabled={!canDelete}
                        title={isSuperAdmin ? t('lockedSuperAdmin') : isSelf ? t('lockedCannotDeleteSelf') : undefined}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            !canDelete
                                ? 'bg-gray-50 dark:bg-gray-800/50 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 cursor-pointer'
                        }`}
                    >
                        <TrashIcon />
                        {t('deleteUser')}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Create user modal ─────────────────────────────────────── */

function CreateUserModal({ open, onClose, onCreated, roles }: {
    open: boolean; onClose: () => void; onCreated: () => void; roles: Role[];
}) {
    const t = useTranslations('adminDashboard');
    const tAuth = useTranslations('auth');
    const tRoles = useTranslations('roles');
    const theme = useRoleTheme();

    const [step, setStep] = useState(1);
    const totalSteps = 3;

    const emptyForm = { first_name: '', last_name: '', rodne_cislo: '', email: '', address: '', phone: '', password: '', confirmPassword: '', role_id: '' };
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [creating, setCreating] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [selectFocused, setSelectFocused] = useState(false);

    const updateField = (key: string, value: string) => {
        setForm(f => ({ ...f, [key]: value }));
        if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    };

    /* Gender + birth date are derived from rodné číslo — no manual entry needed */
    const rcParsed = useMemo(() => {
        if (!form.rodne_cislo) return null;
        const result = parseRodneCislo(form.rodne_cislo, '');
        if ('error' in result) return null;
        return result;
    }, [form.rodne_cislo]);

    const formatBirthDate = (d: string) => { const [y, m, dd] = d.split('-'); return `${dd}/${m}/${y}`; };

    const validateStep = (s: number): boolean => {
        const e: Record<string, string> = {};
        if (s === 1) {
            if (!form.first_name.trim()) e.first_name = tAuth('errors.firstNameRequired');
            if (!form.last_name.trim())  e.last_name  = tAuth('errors.lastNameRequired');
            if (!form.rodne_cislo.trim()) {
                e.rodne_cislo = tAuth('errors.rodneCisloRequired');
            } else {
                const r = parseRodneCislo(form.rodne_cislo, '');
                if ('error' in r) e.rodne_cislo = {
                    invalidRcFormat:   tAuth('errors.invalidRcFormat'),
                    invalidRcChecksum: tAuth('errors.invalidRcChecksum'),
                    rcGenderMismatch:  tAuth('errors.rcGenderMismatch'),
                }[r.error] ?? tAuth('errors.invalidRcFormat');
            }
        }
        if (s === 2) {
            if (!form.email.trim()) e.email = tAuth('errors.emailRequired');
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = tAuth('errors.invalidEmail');
            if (!form.address.trim()) e.address = tAuth('errors.addressRequired');
            if (!form.phone.trim()) e.phone = tAuth('errors.phoneRequired');
            else if (!/^\+?\d[\d\s]{7,}$/.test(form.phone.trim())) e.phone = tAuth('errors.invalidPhone');
        }
        if (s === 3) {
            if (!form.password) e.password = tAuth('errors.passwordRequired');
            else if (form.password.length < 8) e.password = tAuth('errors.passwordTooShort');
            if (!form.confirmPassword) e.confirmPassword = tAuth('errors.confirmPasswordRequired');
            else if (form.password !== form.confirmPassword) e.confirmPassword = tAuth('errors.passwordsMatch');
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const nextStep   = () => { if (validateStep(step) && step < totalSteps) setStep(step + 1); };
    const prevStep   = () => { if (step > 1) setStep(step - 1); };

    const handleCreate = async () => {
        if (!validateStep(step)) return;
        const result = parseRodneCislo(form.rodne_cislo, '');
        if ('error' in result) return;
        setCreating(true); setMsg(null);
        try {
            const token = Cookies.get('auth_token');
            const res = await fetch(`${API_URL}/users/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: form.first_name, last_name: form.last_name,
                    email: form.email, password: form.password,
                    rodne_cislo: form.rodne_cislo, birth_date: result.birthDate,
                    is_minor: result.isMinor, address: form.address || null,
                    phone: form.phone || null,
                    role_id: form.role_id ? parseInt(form.role_id) : null,
                }),
            });
            if (res.ok) {
                setMsg({ type: 'success', text: t('createSuccess') });
                setTimeout(() => { onCreated(); handleClose(); }, 1000);
            } else {
                const err = await res.json().catch(() => null);
                setMsg({ type: 'error', text: err?.detail || t('createError') });
            }
        } catch { setMsg({ type: 'error', text: t('createError') }); }
        finally  { setCreating(false); }
    };

    const handleClose = () => { onClose(); setStep(1); setForm(emptyForm); setErrors({}); setMsg(null); };

    if (!open) return null;

    /* ── Icons (same style as registration page) ── */
    const userIcon     = (c: string) => <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={c} strokeLinecap="round"/><circle cx="12" cy="7" r="4" stroke={c} strokeLinecap="round"/></>;
    const idIcon       = (c: string) => <rect x="3" y="7" width="18" height="10" rx="2" stroke={c} strokeWidth="2" fill="none"/>;
    const calendarIcon = (c: string) => <path d="M4 7h16M4 11h16M6 4v4M18 4v4M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round"/>;
    const emailIcon    = (c: string) => <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke={c} strokeLinecap="round" strokeLinejoin="round"/>;
    const mapIcon      = (c: string) => <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={c} strokeWidth="2" fill="none"/>;
    const phoneIcon    = (c: string) => <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke={c} strokeWidth="2" fill="none"/>;
    const lockIcon     = (c: string) => <><rect x="3" y="11" width="18" height="11" rx="2" stroke={c} strokeLinecap="round"/><path d="M7 11V7a5 5 0 0110 0v4" stroke={c} strokeLinecap="round"/></>;
    const checkIcon    = (c: string) => <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke={c} strokeLinecap="round" strokeLinejoin="round"/>;
    const roleIcon     = (c: string) => <><path d="M12 11c2.21 0 4-1.79 4-4S14.21 3 12 3s-4 1.79-4 4 1.79 4 4 4z" stroke={c} strokeWidth="2" fill="none"/><path d="M3 20c0-3.31 4.03-6 9-6s9 2.69 9 6" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/><path d="M17 8l2 2 4-4" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/></>;
    const genderIcon   = (c: string) => <><circle cx="9" cy="9" r="4" stroke={c} strokeWidth="2" fill="none"/><path d="M16 3l5 0M21 3l0 5M21 3l-5.5 5.5" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/><path d="M9 13l0 8M6 18l6 0" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/></>;

    const genderLabel  = rcParsed?.gender === 'male' ? t('genderMale') : rcParsed?.gender === 'female' ? t('genderFemale') : '';
    const stepLabels   = [t('stepPersonal'), t('stepContact'), t('stepSecurity')];

    /* Shared select container style matching FormInput */
    const selectStyle = (focused: boolean, hasError?: boolean) => ({
        borderColor: hasError ? '#dc2626' : focused ? '#2563eb' : 'var(--input-border)',
        background:  hasError ? 'var(--input-error-bg)' : focused ? 'var(--input-focus-bg)' : 'var(--input-bg)',
        boxShadow:   hasError ? 'var(--input-shadow-error)' : focused ? 'var(--input-shadow-focus)' : 'none',
    });
    const iconColor = (focused: boolean, hasError?: boolean) =>
        hasError ? '#dc2626' : focused ? '#2563eb' : '#93c5fd';

    return (
        <Modal open={open} onClose={handleClose}>
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('addTitle')}</h3>
                <button onClick={handleClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors cursor-pointer">
                    <XMarkIcon />
                </button>
            </div>

            {/* Step indicator — matches register page */}
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    {stepLabels[step - 1]} &mdash; {step}/{totalSteps}
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-3">
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${theme.btnPrimary}`} style={{ width: `${(step / totalSteps) * 100}%` }} />
                </div>
            </div>

            {/* ── Step 1: Personal Data ── */}
            {step === 1 && (
                <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3">
                        <FormInput label={t('firstName')} type="text" name="first_name" value={form.first_name}
                            onChange={e => updateField('first_name', e.target.value)}
                            placeholder="Ana" icon={userIcon} error={errors.first_name} required />
                        <FormInput label={t('lastName')} type="text" name="last_name" value={form.last_name}
                            onChange={e => updateField('last_name', e.target.value)}
                            placeholder="García" icon={userIcon} error={errors.last_name} required />
                    </div>

                    <FormInput label={t('fieldRodneCislo')} type="text" name="rodne_cislo" value={form.rodne_cislo}
                        onChange={e => updateField('rodne_cislo', e.target.value)}
                        placeholder={t('fieldRodneCisloPlaceholder')} icon={idIcon} error={errors.rodne_cislo} required />

                    {/* Gender — auto-filled from rodné číslo, read-only */}
                    <div>
                        <label className="block text-gray-600 dark:text-gray-400 text-xs font-semibold mb-2 tracking-wide uppercase">
                            {t('fieldGender')}
                        </label>
                        <div className="flex items-center gap-3 rounded-xl px-4 py-3.5 border-2 transition-all duration-200 opacity-60 cursor-not-allowed"
                            style={{ borderColor: 'var(--input-border)', background: 'var(--input-bg)' }}>
                            <svg width="16" height="16" fill="none" stroke="#93c5fd" strokeWidth="2" viewBox="0 0 24 24">
                                {genderIcon('#93c5fd')}
                            </svg>
                            <span className="flex-1 text-sm text-gray-500 dark:text-gray-400">
                                {genderLabel || t('genderPlaceholder')}
                            </span>
                        </div>
                    </div>

                    {/* Birth date — auto-filled from rodné číslo, read-only */}
                    <FormInput label={t('fieldBirthDate')} type="text" name="birth_date"
                        value={rcParsed ? formatBirthDate(rcParsed.birthDate) : ''}
                        placeholder={t('fieldBirthDatePlaceholder')} icon={calendarIcon} readOnly />

                    {rcParsed?.isMinor && (
                        <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2 border border-amber-200 dark:border-amber-800">
                            {t('isMinorInfo')}
                        </p>
                    )}
                </div>
            )}

            {/* ── Step 2: Contact Data ── */}
            {step === 2 && (
                <div className="space-y-4 animate-fade-in">
                    <FormInput label={t('fieldEmail')} type="email" name="email" value={form.email}
                        onChange={e => updateField('email', e.target.value)}
                        placeholder={t('fieldEmailPlaceholder')} icon={emailIcon} error={errors.email} required />
                    <FormInput label={t('fieldAddress')} type="text" name="address" value={form.address}
                        onChange={e => updateField('address', e.target.value)}
                        placeholder={t('fieldAddressPlaceholder')} icon={mapIcon} error={errors.address} required />
                    <FormInput label={t('fieldPhone')} type="text" name="phone" value={form.phone}
                        onChange={e => updateField('phone', e.target.value)}
                        placeholder={t('fieldPhonePlaceholder')} icon={phoneIcon} error={errors.phone} required />

                    {/* Role selector */}
                    <div>
                        <label className="block text-gray-600 dark:text-gray-400 text-xs font-semibold mb-2 tracking-wide uppercase">
                            {t('fieldRole')}
                        </label>
                        <div className="flex items-center gap-3 rounded-xl px-4 py-3.5 border-2 transition-all duration-200"
                            style={selectStyle(selectFocused)}>
                            <svg width="16" height="16" fill="none" stroke={iconColor(selectFocused)} strokeWidth="2" viewBox="0 0 24 24">
                                {roleIcon(iconColor(selectFocused))}
                            </svg>
                            <select
                                value={form.role_id}
                                onChange={e => updateField('role_id', e.target.value)}
                                onFocus={() => setSelectFocused(true)}
                                onBlur={() => setSelectFocused(false)}
                                className="flex-1 bg-transparent text-gray-800 dark:text-gray-100 text-sm outline-none min-w-0 appearance-none cursor-pointer"
                            >
                                <option value="">{t('selectRolePlaceholder')}</option>
                                {roles.map(r => (
                                    <option key={r.id} value={r.id.toString()}>{translateRole(r.name, tRoles)}</option>
                                ))}
                            </select>
                            <ChevronDownIcon />
                        </div>
                    </div>
                </div>
            )}

            {/* ── Step 3: Security ── */}
            {step === 3 && (
                <div className="space-y-4 animate-fade-in">
                    <FormInput label={t('fieldPassword')} type="password" name="password" value={form.password}
                        onChange={e => updateField('password', e.target.value)}
                        placeholder={t('fieldPasswordPlaceholder')} icon={lockIcon} error={errors.password} required />
                    <FormInput label={t('fieldConfirmPassword')} type="password" name="confirmPassword" value={form.confirmPassword}
                        onChange={e => updateField('confirmPassword', e.target.value)}
                        placeholder={t('fieldConfirmPasswordPlaceholder')} icon={checkIcon} error={errors.confirmPassword} required />
                </div>
            )}

            {msg && (
                <div className={`rounded-xl border p-3 text-sm font-medium flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-700 dark:text-red-300'}`}>
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={msg.type === 'success' ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' : 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'} />
                    </svg>
                    {msg.text}
                </div>
            )}

            {/* Navigation — matches register page layout */}
            <div className="flex gap-3 pt-1">
                {step > 1 && (
                    <button onClick={prevStep} disabled={creating || msg?.type === 'success'}
                        className="w-full py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                        {t('previous')}
                    </button>
                )}
                {step < totalSteps ? (
                    <button onClick={nextStep}
                        className={`w-full py-2.5 rounded-xl text-white text-sm font-medium transition-colors cursor-pointer ${theme.btnPrimary} ${theme.btnPrimaryHover}`}>
                        {t('next')}
                    </button>
                ) : (
                    <button onClick={handleCreate} disabled={creating || msg?.type === 'success'}
                        className={`w-full py-2.5 rounded-xl text-white text-sm font-medium transition-colors ${creating || msg?.type === 'success' ? `${theme.btnDisabled} cursor-not-allowed opacity-60` : `${theme.btnPrimary} ${theme.btnPrimaryHover} cursor-pointer`}`}>
                        {creating ? t('creating') : t('save')}
                    </button>
                )}
            </div>
        </Modal>
    );
}

/* ── Edit modal ─────────────────────────────────────────────── */

function EditModal({ user, roles, open, onClose, onUpdated, currentUserId }: { user: User | null; roles: Role[]; open: boolean; onClose: () => void; onUpdated: () => void; currentUserId?: number }) {
    const t = useTranslations('adminDashboard');
    const tRoles = useTranslations('roles');
    const theme = useRoleTheme();

    const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', address: '', role_id: '' });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
                        {(() => {
                            const isRoleLocked = !!user && (user.id === 1 || user.id === currentUserId);
                            return (
                                <div className="relative">
                                    <select
                                        value={form.role_id}
                                        onChange={e => !isRoleLocked && updateField('role_id', e.target.value)}
                                        disabled={isRoleLocked}
                                        title={isRoleLocked ? t('roleLocked') : undefined}
                                        className={`w-full appearance-none rounded-xl border px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors ${isRoleLocked ? 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 cursor-pointer'}`}
                                    >
                                        <option value="">{t('selectRolePlaceholder')}</option>
                                        {roles.map((role) => (
                                            <option key={role.id} value={role.id.toString()}>
                                                {translateRole(role.name, tRoles)}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-2 flex items-center text-gray-400 pointer-events-none">
                                        {isRoleLocked
                                            ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600"><path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v4A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5v-4A1.5 1.5 0 0 0 11 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" /></svg>
                                            : <ChevronDownIcon />
                                        }
                                    </div>
                                </div>
                            );
                        })()}
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

export default function UserTable({ users, roles }: { users: User[]; roles: Role[] }) {
    const t = useTranslations('adminDashboard');
    const tRoles = useTranslations('roles');
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [viewUser, setViewUser] = useState<User | null>(null);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [deleteUser, setDeleteUser] = useState<User | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [page, setPage] = useState(1);
    const [chatError, setChatError] = useState<string | null>(null);

    const handleOpenChat = async (userId: number) => {
        setChatError(null);
        try {
            const chat = await adminOpenChatWithUser(userId);
            router.push(`/dashboard/messages?chat=${chat.id}`);
        } catch {
            setChatError(t('chatNoApplications'));
            setTimeout(() => setChatError(null), 3500);
        }
    };

    // Filters
    const [roleFilter, setRoleFilter] = useState('');
    const [minorFilter, setMinorFilter] = useState<'' | 'minor' | 'adult'>('');

    // Sorting
    type SortKey = 'user' | 'email' | 'phone' | 'role' | 'createdAt';
    const [sortKey, setSortKey] = useState<SortKey | null>('createdAt');
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
                                    <th className="pb-4 font-medium w-28">
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
                                    const isSelf = user.id === currentUser?.id;
                                    const isSuperAdmin = user.id === 1;

                                    return (
                                        <tr
                                            key={user.id}
                                            onClick={() => setViewUser(user)}
                                            className={`group cursor-pointer transition-colors ${
                                                isSuperAdmin
                                                    ? 'bg-amber-50/40 dark:bg-amber-950/10 hover:bg-amber-50/80 dark:hover:bg-amber-950/20'
                                                    : isSelf
                                                        ? 'bg-violet-50/40 dark:bg-violet-950/10 hover:bg-violet-50/80 dark:hover:bg-violet-950/20'
                                                        : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/50'
                                            }`}
                                        >
                                            <td className="py-4 font-medium text-gray-700 dark:text-gray-200">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {user.first_name} {user.last_name}
                                                    {isSuperAdmin && (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-widest uppercase border border-amber-300/60 dark:border-amber-600/50 text-amber-600 dark:text-amber-400">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v4A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5v-4A1.5 1.5 0 0 0 11 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" /></svg>
                                                            {t('superAdminBadge')}
                                                        </span>
                                                    )}
                                                    {isSelf && !isSuperAdmin && (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-widest uppercase border border-violet-300/60 dark:border-violet-600/50 text-violet-500 dark:text-violet-400">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 dark:bg-violet-500" />
                                                            {t('youBadge')}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 text-gray-500 dark:text-gray-400">{user.email}</td>
                                            <td className="py-4 text-gray-500 dark:text-gray-400">{user.phone || '—'}</td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${pillClasses}`}>
                                                        {displayRole}
                                                    </span>
                                                    {user.is_minor && (
                                                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                                                            {t('minor')}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <div className={isSelf || isSuperAdmin ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}>
                                                    <ActionButtons
                                                        onEdit={() => setEditUser(user)}
                                                        onDelete={() => setDeleteUser(user)}
                                                        onChat={() => handleOpenChat(user.id!)}
                                                        isSelf={isSelf}
                                                        isSuperAdmin={isSuperAdmin}
                                                        isAdmin={rawRole.includes('admin')}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="lg:hidden space-y-2.5">
                        {paginatedUsers.map((user) => {
                            const rawRole = user.role?.name ?? '';
                            const displayRole = rawRole ? translateRole(rawRole, tRoles) : t('unknown');
                            const pillClasses = getRolePillClasses(rawRole);
                            const isSelf = user.id === currentUser?.id;
                            const isSuperAdmin = user.id === 1;
                            const [avFrom, avTo] = avatarGradient(user.first_name + user.last_name);
                            const initials = `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase();

                            return (
                                <div
                                    key={user.id}
                                    onClick={() => setViewUser(user)}
                                    className={`rounded-2xl cursor-pointer transition-colors ${
                                        isSuperAdmin
                                            ? 'border border-amber-100 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/10 active:bg-amber-50/80 dark:active:bg-amber-950/20'
                                            : isSelf
                                                ? 'border border-violet-100 dark:border-violet-900/40 bg-violet-50/40 dark:bg-violet-950/10 active:bg-violet-50/80 dark:active:bg-violet-950/20'
                                                : 'border border-gray-100 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-800/50'
                                    }`}
                                >
                                    {/* Main row */}
                                    <div className="flex items-center gap-3 px-4 pt-3.5 pb-3">
                                        {/* Avatar */}
                                        <div
                                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                                            style={{ background: `linear-gradient(135deg, ${avFrom}, ${avTo})` }}
                                        >
                                            {initials}
                                        </div>

                                        {/* Name + email */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate leading-tight">
                                                {user.first_name} {user.last_name}
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                                                {user.email}
                                            </p>
                                        </div>

                                        {/* Actions — stop propagation so they don't open the panel */}
                                        <div className="shrink-0" onClick={e => e.stopPropagation()}>
                                            <ActionButtons
                                                onEdit={() => setEditUser(user)}
                                                onDelete={() => setDeleteUser(user)}
                                                onChat={() => handleOpenChat(user.id!)}
                                                isSelf={isSelf}
                                                isSuperAdmin={isSuperAdmin}
                                                isAdmin={rawRole.includes('admin')}
                                            />
                                        </div>
                                    </div>

                                    {/* Footer row: role pill + optional badges + phone */}
                                    <div className="flex items-center gap-2 px-4 pb-3 border-t border-gray-50 dark:border-gray-800 pt-2.5 flex-wrap">
                                        <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${pillClasses}`}>
                                            {displayRole}
                                        </span>
                                        {user.is_minor && (
                                            <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                                                {t('minor')}
                                            </span>
                                        )}
                                        {user.phone && (
                                            <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 truncate">
                                                {user.phone}
                                            </span>
                                        )}
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

            {/* Chat error toast */}
            {chatError && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white text-sm font-medium px-5 py-2.5 rounded-2xl shadow-lg">
                    {chatError}
                </div>
            )}

            {/* Panels & Modals */}
            <UserProfilePanel
                user={viewUser}
                open={!!viewUser}
                onClose={() => setViewUser(null)}
                onEdit={() => setEditUser(viewUser)}
                onDelete={() => setDeleteUser(viewUser)}
                currentUserId={currentUser?.id}
            />
            <CreateUserModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => window.location.reload()} roles={roles} />
            <EditModal user={editUser} roles={roles} open={!!editUser} onClose={() => setEditUser(null)} onUpdated={() => window.location.reload()} currentUserId={currentUser?.id} />
            <DeleteModal user={deleteUser} open={!!deleteUser} onClose={() => setDeleteUser(null)} onDeleted={() => window.location.reload()} />
        </>
    );
}
