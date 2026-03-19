import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { fetchUsersServer } from '@/services/userService';
import { fetchOpportunitiesServer } from '@/services/opportunityService';
import StudentTable from '@/components/students/StudentTable';
import StatCards from '@/components/ui/StatCards';

export default async function StudentsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        redirect(`/${locale}/login`);
    }

    const t = await getTranslations('studentsDashboard');
    const [users, opportunities] = await Promise.all([
        fetchUsersServer(token),
        fetchOpportunitiesServer(token),
    ]);

    // Count eligible students (adults with Student role, excluding lector)
    const eligibleStudents = users.filter(u => {
        const role = u.role?.name?.toLowerCase() || '';
        return role.includes('student') && !u.is_minor && !role.includes('lector');
    });

    return (
        <div className="space-y-6">
            <StatCards items={[
                {
                    label: t('eligibleStudents'),
                    value: eligibleStudents.length,
                    color: 'text-emerald-600',
                    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>,
                },
                {
                    label: t('totalStudents'),
                    value: users.filter(u => u.role?.name?.toLowerCase().includes('student')).length,
                    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.975 6.975 0 01-4.696-1.81z" /></svg>,
                },
            ]} />

            {/* Students section */}
            <div className="bg-white rounded-3xl p-4 sm:p-8 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{t('title')}</h2>
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                        {eligibleStudents.length} {t('studentsLabel')}
                    </span>
                </div>

                <StudentTable users={users} opportunities={opportunities} />
            </div>
        </div>
    );
}
