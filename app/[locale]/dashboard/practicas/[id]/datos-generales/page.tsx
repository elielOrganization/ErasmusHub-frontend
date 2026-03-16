'use client';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/PageHeader';
import InfoCard from '@/components/InfoCard';
import { useApi } from '@/hooks/useApi';

interface ScheduleItem {
    id: number;
    weekday: string;
    morning_hours: string | null;
    afternoon_hours: string | null;
}

interface InternshipDetail {
    id: number;
    student_first_name: string;
    student_last_name: string;
    student_email: string;
    company_name: string;
    company_tax_id: string | null;
    company_address: string | null;
    company_tutor_name: string | null;
    company_tutor_email: string | null;
    academic_tutor_name: string | null;
    start_date: string;
    end_date: string;
    total_hours: number;
    status: string;
    schedules: ScheduleItem[];
}

const DAYS_ORDER = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
const DAYS_DISPLAY: Record<string, string> = {
    lunes: 'MONDAY',
    martes: 'TUESDAY',
    miercoles: 'WEDNESDAY',
    jueves: 'THURSDAY',
    viernes: 'FRIDAY',
};

export default function DatosGeneralesPage() {
    const params = useParams();
    const t = useTranslations('practicas');
    const { data, loading } = useApi<InternshipDetail>(`/internships/${params.id}`);

    const tc = useTranslations('common');

    if (loading) {
        return <div className="text-sm text-gray-400 py-8 text-center">{tc('loading')}</div>;
    }

    if (!data) {
        return <div className="text-sm text-gray-400 py-8 text-center">{t('notFound')}</div>;
    }

    const sortedSchedules = [...(data.schedules || [])].sort(
        (a, b) => DAYS_ORDER.indexOf(a.weekday) - DAYS_ORDER.indexOf(b.weekday)
    );

    return (
        <div>
            <PageHeader title={t('practiceSheet')} />

            {/* Info cards */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <InfoCard
                        title={t('studentData')}
                        fields={[
                            { label: t('fullName'), value: `${data.student_first_name} ${data.student_last_name}` },
                            { label: 'Email', value: data.student_email },
                        ]}
                    />
                    <InfoCard
                        title={t('companyData')}
                        fields={[
                            { label: t('companyName'), value: data.company_name },
                            { label: t('taxId'), value: data.company_tax_id },
                            { label: t('internshipAddress'), value: data.company_address },
                            { label: t('companyTutor'), value: data.company_tutor_name },
                        ]}
                    />
                    <InfoCard
                        title={t('practiceData')}
                        fields={[
                            { label: t('academicTutorName'), value: data.academic_tutor_name },
                            { label: t('startDate'), value: data.start_date },
                            { label: t('endDate'), value: data.end_date },
                            { label: t('totalHours'), value: t('plannedHours', { hours: data.total_hours }) },
                        ]}
                    />
                </div>
            </div>

            {/* Schedule */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">{t('weeklySchedule')}</h2>
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-y border-gray-100">
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase"></th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('morningSchedule')}</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('afternoonSchedule')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {sortedSchedules.map((h) => (
                            <tr key={h.id}>
                                <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                                    {DAYS_DISPLAY[h.weekday] || h.weekday.toUpperCase()}
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-700">{h.morning_hours || '-'}</td>
                                <td className="px-6 py-3 text-sm text-gray-700">{h.afternoon_hours || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
