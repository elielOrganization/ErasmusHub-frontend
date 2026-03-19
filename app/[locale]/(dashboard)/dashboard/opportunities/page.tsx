import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { fetchOpportunitiesServer } from '@/services/opportunityService';
import OpportunityTable from '@/components/opportunities/OpportunityTable';
import type { OpportunityWithStudents } from '@/components/opportunities/OpportunityTable';

export default async function OpportunitiesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        redirect(`/${locale}/login`);
    }

    const t = await getTranslations('opportunitiesDashboard');
    const opportunities = await fetchOpportunitiesServer(token);

    // Map to OpportunityWithStudents (students empty until backend supports it)
    const oppsWithStudents: OpportunityWithStudents[] = opportunities.map(opp => ({
        ...opp,
        students: [],
    }));

    const openCount = opportunities.filter(o => o.status === 'open').length;

    return (
        <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-400 font-medium">{t('totalOpportunities')}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{opportunities.length}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-400 font-medium">{t('openOpportunities')}</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-1">{openCount}</p>
                </div>
            </div>

            {/* Opportunities table */}
            <div className="bg-white rounded-3xl p-4 sm:p-8 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{t('title')}</h2>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                        {opportunities.length} {t('totalOpportunities').toLowerCase()}
                    </span>
                </div>

                <OpportunityTable opportunities={oppsWithStudents} />
            </div>
        </div>
    );
}
