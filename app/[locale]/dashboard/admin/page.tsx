import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { SERVER_API_URL } from '@/lib/api';

interface Role {
    id: number;
    name: string;
    description?: string;
}

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    is_minor: boolean;
    created_at: string;
    role?: Role;
}

async function fetchUsers(token: string): Promise<User[]> {
    const response = await fetch(`${SERVER_API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
    });

    if (!response.ok) return [];
    return response.json();
}

export default async function AdminDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        redirect(`/${locale}/login`);
    }

    const t = await getTranslations('adminDashboard');
    const users = await fetchUsers(token);

    const totalUsers = users.length;
    const adminCount = users.filter(u => u.role?.name?.toLowerCase().includes('admin')).length;
    const minorCount = users.filter(u => u.is_minor).length;

    return (
        <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-400 font-medium">{t('totalUsers')}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{totalUsers}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-400 font-medium">{t('admins')}</p>
                    <p className="text-3xl font-bold text-purple-600 mt-1">{adminCount}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-400 font-medium">{t('minors')}</p>
                    <p className="text-3xl font-bold text-amber-600 mt-1">{minorCount}</p>
                </div>
            </div>

            {/* Users table */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">{t('userManagement')}</h2>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                        {totalUsers} {t('totalUsers')}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100 text-gray-400 text-sm">
                                <th className="pb-4 font-medium">{t('user')}</th>
                                <th className="pb-4 font-medium">{t('email')}</th>
                                <th className="pb-4 font-medium">{t('role')}</th>
                                <th className="pb-4 font-medium">{t('minor')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {users.map((user) => {
                                const roleName = user.role?.name ?? t('unknown');

                                return (
                                    <tr key={user.id} className="group hover:bg-gray-50 transition-colors">
                                        <td className="py-4 font-medium text-gray-700">
                                            {user.first_name} {user.last_name}
                                        </td>
                                        <td className="py-4 text-gray-500">{user.email}</td>
                                        <td className="py-4">
                                            <span
                                                className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                                                    roleName.toLowerCase().includes('admin')
                                                        ? 'bg-purple-100 text-purple-700'
                                                        : 'bg-emerald-100 text-emerald-700'
                                                }`}
                                            >
                                                {roleName}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            {user.is_minor && (
                                                <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700">
                                                    {t('minor')}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
