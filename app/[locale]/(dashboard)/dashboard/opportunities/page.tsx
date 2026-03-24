import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { fetchOpportunitiesServer, fetchOpportunityStudentsServer } from '@/services/opportunityService';
import OpportunityTable from '@/components/opportunities/OpportunityTable';
import type { OpportunityWithStudents } from '@/components/opportunities/OpportunityTable';
import StatCards from '@/components/ui/StatCards';

export default async function OpportunitiesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        redirect(`/${locale}/login`);
    }

    const t = await getTranslations('opportunitiesDashboard');
    const opportunities = await fetchOpportunitiesServer(token);

    const oppsWithStudents: OpportunityWithStudents[] = await Promise.all(
        opportunities.map(async (opp) => ({
            ...opp,
            students: await fetchOpportunityStudentsServer(token, opp.id),
        }))
    );

    const openCount = opportunities.filter(o => o.status === 'open').length;

    return (
        <div className="space-y-6">
            <StatCards items={[
                {
                    label: t('totalOpportunities'),
                    value: opportunities.length,
                    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 018.75 1h2.5A2.75 2.75 0 0114 3.75v.443c.572.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.07v3.469c0 1.126-.694 2.191-1.83 2.54-1.952.599-4.024.921-6.17.921s-4.219-.322-6.17-.921C2.694 12.73 2 11.665 2 10.539V7.07c0-1.321.947-2.489 2.294-2.676A41.047 41.047 0 016 4.193V3.75zm6.5 0v.325a41.622 41.622 0 00-5 0V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25zM10 10a1 1 0 00-1 1v.01a1 1 0 001 1h.01a1 1 0 001-1V11a1 1 0 00-1-1H10z" clipRule="evenodd" /><path d="M3 15.055v-.684c.126.053.255.1.39.142 2.092.642 4.313.987 6.61.987 2.297 0 4.518-.345 6.61-.987.135-.041.264-.089.39-.142v.684c0 1.347-.985 2.53-2.363 2.686A41.454 41.454 0 0110 18c-1.572 0-3.118-.12-4.637-.26C3.985 17.586 3 16.402 3 15.056z" /></svg>,
                },
                {
                    label: t('openOpportunities'),
                    value: openCount,
                    color: 'text-emerald-600',
                    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>,
                },
            ]} />

            {/* Opportunities table */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-4 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">{t('title')}</h2>
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                        {opportunities.length} {t('totalOpportunities').toLowerCase()}
                    </span>
                </div>

                <OpportunityTable opportunities={oppsWithStudents} />
            </div>
        </div>
    );
}
