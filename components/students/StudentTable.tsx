'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Cookies from 'js-cookie';
import { API_URL } from '@/lib/api';
import FilterBar from '@/components/ui/FilterBar';
import Pagination from '@/components/ui/Pagination';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { translateRole } from '@/lib/translateRole';
import type { User } from '@/services/userService';
import type { Opportunity } from '@/services/opportunityService';

const PAGE_SIZE = 10;

/* ── Icon helpers ──────────────────────────────────────────── */

function ChevronDownIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 pointer-events-none">
            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
    );
}

/* ── Assign modal ──────────────────────────────────────────── */

function AssignModal({ student, open, onClose, opportunities }: {
    student: User | null;
    open: boolean;
    onClose: () => void;
    opportunities: Opportunity[];
}) {
    const t = useTranslations('studentsDashboard');
    const theme = useRoleTheme();
    const [selectedOpp, setSelectedOpp] = useState('');
    const [assigning, setAssigning] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleAssign = async () => {
        if (!selectedOpp || !student) return;
        setAssigning(true);
        setErrorMsg('');
        try {
            const token = Cookies.get('auth_token');
            const res = await fetch(`${API_URL}/applications/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    opportunity_id: parseInt(selectedOpp),
                    user_id: student.id,
                }),
            });
            if (res.ok) {
                setSuccessMsg(t('assignSuccess'));
                setTimeout(() => onClose(), 1500);
            } else {
                const err = await res.json().catch(() => null);
                setErrorMsg(err?.detail || t('assignError'));
            }
        } catch {
            setErrorMsg(t('assignError'));
        } finally {
            setAssigning(false);
        }
    };

    if (!open || !student) return null;

    const openOpportunities = opportunities.filter(o => o.status === 'open');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('assignToOpportunity')}</h3>
                    <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                    </button>
                </div>

                <div className={`rounded-xl ${theme.accentBg} border ${theme.borderLight} p-3`}>
                    <p className={`text-sm font-medium ${theme.accentText}`}>
                        {student.first_name} {student.last_name}
                    </p>
                    <p className={`text-xs ${theme.accent}`}>{student.email}</p>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('selectOpportunity')}</label>
                    {openOpportunities.length === 0 ? (
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-400">
                            {t('noOpportunitiesYet')}
                        </div>
                    ) : (
                        <div className="relative">
                            <select
                                value={selectedOpp}
                                onChange={(e) => setSelectedOpp(e.target.value)}
                                className={`w-full appearance-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 pr-8 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors cursor-pointer`}
                            >
                                <option value="">{t('selectOpportunityPlaceholder')}</option>
                                {openOpportunities.map((opp) => (
                                    <option key={opp.id} value={opp.id.toString()}>
                                        {opp.name}{opp.city ? ` — ${opp.city}` : ''}{opp.country ? `, ${opp.country}` : ''}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-2 flex items-center text-gray-400">
                                <ChevronDownIcon />
                            </div>
                        </div>
                    )}
                </div>

                {successMsg && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-700 font-medium">
                        {successMsg}
                    </div>
                )}

                {errorMsg && (
                    <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-700 font-medium">
                        {errorMsg}
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={!selectedOpp || assigning || openOpportunities.length === 0}
                        className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors ${
                            !selectedOpp || assigning || openOpportunities.length === 0
                                ? `${theme.btnDisabled} cursor-not-allowed opacity-60`
                                : `${theme.btnPrimary} ${theme.btnPrimaryHover} cursor-pointer`
                        }`}
                    >
                        {assigning ? t('assigning') : t('assign')}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Main component ────────────────────────────────────────── */

export default function StudentTable({ users, opportunities }: { users: User[]; opportunities: Opportunity[] }) {
    const t = useTranslations('studentsDashboard');
    const tRoles = useTranslations('roles');
    const theme = useRoleTheme();
    const [assignStudent, setAssignStudent] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);

    // Filter: only students, adults (not minors), and role is not "lector"
    const students = useMemo(() => {
        return users.filter((u) => {
            const role = u.role?.name?.toLowerCase() || '';
            if (!role.includes('student')) return false;
            if (u.is_minor) return false;
            if (role.includes('lector')) return false;
            return true;
        });
    }, [users]);

    // Search filter
    const filteredStudents = useMemo(() => {
        setPage(1);
        if (!searchQuery.trim()) return students;
        const q = searchQuery.toLowerCase();
        return students.filter((s) =>
            `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q)
        );
    }, [students, searchQuery]);

    const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE);
    const paginatedStudents = filteredStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <>
            <FilterBar
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder={t('searchPlaceholder')}
            />

            {filteredStudents.length === 0 ? (
                <p className="text-center text-gray-400 py-10 text-sm">{t('noResults')}</p>
            ) : (
                <>
                    {/* Desktop table */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-500 text-sm">
                                    <th className="pb-4 font-medium">{t('student')}</th>
                                    <th className="pb-4 font-medium">{t('email')}</th>
                                    <th className="pb-4 font-medium">{t('phone')}</th>
                                    <th className="pb-4 font-medium">{t('birthDate')}</th>
                                    <th className="pb-4 font-medium">{t('createdAt')}</th>
                                    <th className="pb-4 font-medium w-40" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paginatedStudents.map((student) => (
                                    <tr key={student.id} className="group hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="py-4 font-medium text-gray-700 dark:text-gray-200">
                                            {student.first_name} {student.last_name}
                                        </td>
                                        <td className="py-4 text-gray-500 dark:text-gray-400">{student.email}</td>
                                        <td className="py-4 text-gray-500 dark:text-gray-400">{student.phone || '—'}</td>
                                        <td className="py-4 text-gray-500 dark:text-gray-400 text-sm">
                                            {student.birth_date ? new Date(student.birth_date).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="py-4 text-gray-500 dark:text-gray-400 text-sm">
                                            {new Date(student.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-4">
                                            <button
                                                onClick={() => setAssignStudent(student)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${theme.accentText} ${theme.accentBg} ${theme.softHover} transition-colors cursor-pointer`}
                                            >
                                                {t('assignBtn')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="lg:hidden space-y-3">
                        {paginatedStudents.map((student) => (
                            <div key={student.id} className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                                        {student.first_name} {student.last_name}
                                    </p>
                                    <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700">
                                        {translateRole(student.role?.name, tRoles)}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
                                    <div>
                                        <span className="text-gray-400">{t('email')}: </span>
                                        <span className="text-gray-600 dark:text-gray-300 break-all">{student.email}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">{t('phone')}: </span>
                                        <span className="text-gray-600">{student.phone || '—'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">{t('birthDate')}: </span>
                                        <span className="text-gray-600">
                                            {student.birth_date ? new Date(student.birth_date).toLocaleDateString() : '—'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">{t('createdAt')}: </span>
                                        <span className="text-gray-600">
                                            {new Date(student.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-end border-t border-gray-50 dark:border-gray-800 pt-2">
                                    <button
                                        onClick={() => setAssignStudent(student)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${theme.accentText} ${theme.accentBg} ${theme.softHover} transition-colors cursor-pointer`}
                                    >
                                        {t('assignBtn')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        totalItems={filteredStudents.length}
                        pageSize={PAGE_SIZE}
                        onPageChange={setPage}
                    />
                </>
            )}

            {/* Assign modal */}
            <AssignModal
                student={assignStudent}
                open={!!assignStudent}
                onClose={() => setAssignStudent(null)}
                opportunities={opportunities}
            />
        </>
    );
}
