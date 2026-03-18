import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { fetchUsersServer } from '@/services/userService';
import UserTable from '@/components/admin/UserTable';

export default async function AdminDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        redirect(`/${locale}/login`);
    }

    const t = await getTranslations('adminDashboard');
    const users = await fetchUsersServer(token);

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

            {/* Users section */}
            <div className="bg-white rounded-3xl p-4 sm:p-8 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{t('userManagement')}</h2>
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                        {totalUsers} {t('totalUsers')}
                    </span>
                </div>

                <UserTable users={users} />
            </div>
        </div>
    );
}
