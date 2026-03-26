import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { fetchUsersServer, fetchRolesServer } from '@/services/userService';
import UserTable from '@/components/admin/UserTable';
import StatCards from '@/components/ui/StatCards';

export default async function AdminDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        redirect(`/${locale}/login`);
    }

    const t = await getTranslations('adminDashboard');
    const [users, roles] = await Promise.all([
        fetchUsersServer(token),
        fetchRolesServer(),
    ]);

    const totalUsers = users.length;
    const adminCount = users.filter(u => u.role?.name?.toLowerCase().includes('admin')).length;
    const minorCount = users.filter(u => u.is_minor).length;

    return (
        <div className="space-y-6">
            <StatCards items={[
                {
                    label: t('totalUsers'),
                    value: totalUsers,
                    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" /></svg>,
                },
                {
                    label: t('admins'),
                    value: adminCount,
                    color: 'text-purple-600',
                    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>,
                },
                {
                    label: t('minors'),
                    value: minorCount,
                    color: 'text-amber-600',
                    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
                },
            ]} />

            {/* Users section */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-4 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">{t('userManagement')}</h2>
                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-sm font-medium">
                        {totalUsers} {t('totalUsers')}
                    </span>
                </div>

                <UserTable users={users} roles={roles} />
            </div>
        </div>
    );
}
