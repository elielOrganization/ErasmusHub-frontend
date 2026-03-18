'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { User, Role } from '@/services/userService';

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
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
                {children}
            </div>
        </div>
    );
}

/* ── Action buttons ─────────────────────────────────────────── */

function ActionButtons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
    return (
        <div className="flex items-center gap-1">
            <button
                onClick={onEdit}
                className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
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

/* ── Styled select wrapper ──────────────────────────────────── */

function StyledSelect({ value, onChange, children, className = '' }: {
    value: string;
    onChange: (v: string) => void;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`relative ${className}`}>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-colors cursor-pointer"
            >
                {children}
            </select>
            <div className="absolute inset-y-0 right-2 flex items-center text-gray-400">
                <ChevronDownIcon />
            </div>
        </div>
    );
}

/* ── Edit modal ─────────────────────────────────────────────── */

function EditModal({ user, roles, open, onClose }: { user: User | null; roles: Role[]; open: boolean; onClose: () => void }) {
    const t = useTranslations('adminDashboard');
    if (!user) return null;

    return (
        <Modal open={open} onClose={onClose}>
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">{t('editUser')}</h3>
                <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
                    <XMarkIcon />
                </button>
            </div>
            <p className="text-sm text-gray-400">{t('editUserDescription')}</p>

            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">{t('firstName')}</label>
                        <input
                            type="text"
                            defaultValue={user.first_name}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">{t('lastName')}</label>
                        <input
                            type="text"
                            defaultValue={user.last_name}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-colors"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('email')}</label>
                    <input
                        type="email"
                        defaultValue={user.email}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-colors"
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">{t('phone')}</label>
                        <input
                            type="tel"
                            defaultValue={user.phone}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">{t('role')}</label>
                        <div className="relative">
                            <select
                                defaultValue={user.role?.id?.toString() ?? ''}
                                className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-colors cursor-pointer"
                            >
                                {roles.map((role) => (
                                    <option key={role.id} value={role.id.toString()}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-2 flex items-center text-gray-400">
                                <ChevronDownIcon />
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('address')}</label>
                    <input
                        type="text"
                        defaultValue={user.address}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-colors"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                    {t('cancel')}
                </button>
                <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors cursor-pointer"
                >
                    {t('save')}
                </button>
            </div>
        </Modal>
    );
}

/* ── Delete modal ───────────────────────────────────────────── */

function DeleteModal({ user, open, onClose }: { user: User | null; open: boolean; onClose: () => void }) {
    const t = useTranslations('adminDashboard');
    if (!user) return null;

    return (
        <Modal open={open} onClose={onClose}>
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">{t('deleteUser')}</h3>
                <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
                    <XMarkIcon />
                </button>
            </div>

            <p className="text-sm text-gray-500">
                {t('deleteUserDescription')}
            </p>

            <div className="rounded-xl bg-red-50 border border-red-100 p-3">
                <p className="text-sm font-medium text-red-700">
                    {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-red-500">{user.email}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                    {t('cancel')}
                </button>
                <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer"
                >
                    {t('delete')}
                </button>
            </div>
        </Modal>
    );
}

/* ── Main component ─────────────────────────────────────────── */

export default function UserTable({ users }: { users: User[] }) {
    const t = useTranslations('adminDashboard');
    const [editUser, setEditUser] = useState<User | null>(null);
    const [deleteUser, setDeleteUser] = useState<User | null>(null);

    // Filters
    const [roleFilter, setRoleFilter] = useState('');
    const [minorFilter, setMinorFilter] = useState<'' | 'minor' | 'adult'>('');

    // Extract unique roles from users
    const roles = useMemo(() => {
        const map = new Map<number, Role>();
        for (const u of users) {
            if (u.role) map.set(u.role.id, u.role);
        }
        return Array.from(map.values());
    }, [users]);

    // Filtered users
    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            if (roleFilter && u.role?.id?.toString() !== roleFilter) return false;
            if (minorFilter === 'minor' && !u.is_minor) return false;
            if (minorFilter === 'adult' && u.is_minor) return false;
            return true;
        });
    }, [users, roleFilter, minorFilter]);

    return (
        <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-5">
                <StyledSelect value={roleFilter} onChange={setRoleFilter} className="w-full sm:w-48">
                    <option value="">{t('filterByRole')}</option>
                    {roles.map((role) => (
                        <option key={role.id} value={role.id.toString()}>
                            {role.name}
                        </option>
                    ))}
                </StyledSelect>

                <StyledSelect value={minorFilter} onChange={(v) => setMinorFilter(v as '' | 'minor' | 'adult')} className="w-full sm:w-48">
                    <option value="">{t('filterByMinor')}</option>
                    <option value="minor">{t('onlyMinors')}</option>
                    <option value="adult">{t('onlyAdults')}</option>
                </StyledSelect>
            </div>

            {filteredUsers.length === 0 ? (
                <p className="text-center text-gray-400 py-10 text-sm">{t('noResults')}</p>
            ) : (
                <>
                    {/* Desktop table */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-400 text-sm">
                                    <th className="pb-4 font-medium">{t('user')}</th>
                                    <th className="pb-4 font-medium">{t('email')}</th>
                                    <th className="pb-4 font-medium">{t('phone')}</th>
                                    <th className="pb-4 font-medium">{t('role')}</th>
                                    <th className="pb-4 font-medium">{t('birthDate')}</th>
                                    <th className="pb-4 font-medium">{t('minor')}</th>
                                    <th className="pb-4 font-medium">{t('createdAt')}</th>
                                    <th className="pb-4 font-medium w-20" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.map((user) => {
                                    const roleName = user.role?.name ?? t('unknown');
                                    const pillClasses = getRolePillClasses(roleName);

                                    return (
                                        <tr key={user.id} className="group hover:bg-gray-50/80 transition-colors">
                                            <td className="py-4 font-medium text-gray-700">
                                                {user.first_name} {user.last_name}
                                            </td>
                                            <td className="py-4 text-gray-500">{user.email}</td>
                                            <td className="py-4 text-gray-500">{user.phone || '—'}</td>
                                            <td className="py-4">
                                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${pillClasses}`}>
                                                    {roleName}
                                                </span>
                                            </td>
                                            <td className="py-4 text-gray-500 text-sm">
                                                {user.birth_date ? new Date(user.birth_date).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="py-4">
                                                {user.is_minor && (
                                                    <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700">
                                                        {t('minor')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 text-gray-500 text-sm">
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

                    {/* Mobile cards */}
                    <div className="lg:hidden space-y-3">
                        {filteredUsers.map((user) => {
                            const roleName = user.role?.name ?? t('unknown');
                            const pillClasses = getRolePillClasses(roleName);

                            return (
                                <div key={user.id} className="rounded-2xl border border-gray-100 p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-gray-800">
                                            {user.first_name} {user.last_name}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            {user.is_minor && (
                                                <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700">
                                                    {t('minor')}
                                                </span>
                                            )}
                                            <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${pillClasses}`}>
                                                {roleName}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
                                        <div>
                                            <span className="text-gray-400">{t('email')}: </span>
                                            <span className="text-gray-600 break-all">{user.email}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">{t('phone')}: </span>
                                            <span className="text-gray-600">{user.phone || '—'}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">{t('birthDate')}: </span>
                                            <span className="text-gray-600">
                                                {user.birth_date ? new Date(user.birth_date).toLocaleDateString() : '—'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">{t('createdAt')}: </span>
                                            <span className="text-gray-600">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-end border-t border-gray-50 pt-2">
                                        <ActionButtons
                                            onEdit={() => setEditUser(user)}
                                            onDelete={() => setDeleteUser(user)}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Modals */}
            <EditModal user={editUser} roles={roles} open={!!editUser} onClose={() => setEditUser(null)} />
            <DeleteModal user={deleteUser} open={!!deleteUser} onClose={() => setDeleteUser(null)} />
        </>
    );
}
