import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { fetchUsersServer } from '@/services/userService';
import StudentTable from '@/components/students/StudentTable';

export default async function StudentsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        redirect(`/${locale}/login`);
    }

    const t = await getTranslations('studentsDashboard');
    const users = await fetchUsersServer(token);

    // Count eligible students (adults with Student role, excluding lector)
    const eligibleStudents = users.filter(u => {
        const role = u.role?.name?.toLowerCase() || '';
        return role.includes('student') && !u.is_minor && !role.includes('lector');
    });

    return (
        <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-400 font-medium">{t('eligibleStudents')}</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-1">{eligibleStudents.length}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-400 font-medium">{t('totalStudents')}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">
                        {users.filter(u => u.role?.name?.toLowerCase().includes('student')).length}
                    </p>
                </div>
            </div>

            {/* Students section */}
            <div className="bg-white rounded-3xl p-4 sm:p-8 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{t('title')}</h2>
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                        {eligibleStudents.length} {t('studentsLabel')}
                    </span>
                </div>

                <StudentTable users={users} />
            </div>
        </div>
    );
}
