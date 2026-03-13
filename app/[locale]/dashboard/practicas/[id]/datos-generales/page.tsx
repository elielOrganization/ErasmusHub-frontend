'use client';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/PageHeader';
import InfoCard from '@/components/InfoCard';
import { useApi } from '@/hooks/useApi';

interface HorarioItem {
    id: number;
    weekday: string;
    morning_hours: string | null;
    afternoon_hours: string | null;
}

interface PracticaDetail {
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
    schedules: HorarioItem[];
}

const DIAS_ORDER = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
const DIAS_DISPLAY: Record<string, string> = {
    lunes: 'LUNES',
    martes: 'MARTES',
    miercoles: 'MIÉRCOLES',
    jueves: 'JUEVES',
    viernes: 'VIERNES',
};

export default function DatosGeneralesPage() {
    const params = useParams();
    const t = useTranslations('practicas');
    const { data, loading } = useApi<PracticaDetail>(`/internships/${params.id}`);

    if (loading) {
        return <div className="text-sm text-gray-400 py-8 text-center">Cargando...</div>;
    }

    if (!data) {
        return <div className="text-sm text-gray-400 py-8 text-center">No se encontró la práctica</div>;
    }

    const sortedHorarios = [...(data.schedules || [])].sort(
        (a, b) => DIAS_ORDER.indexOf(a.weekday) - DIAS_ORDER.indexOf(b.weekday)
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
                            { label: 'Nombre completo', value: `${data.student_first_name} ${data.student_last_name}` },
                            { label: 'Email', value: data.student_email },
                        ]}
                    />
                    <InfoCard
                        title={t('companyData')}
                        fields={[
                            { label: 'Nombre empresa', value: data.company_name },
                            { label: 'CIF', value: data.company_tax_id },
                            { label: 'Dirección prácticas', value: data.company_address },
                            { label: 'Tutor/a empresa', value: data.company_tutor_name },
                        ]}
                    />
                    <InfoCard
                        title={t('practiceData')}
                        fields={[
                            { label: 'Nombre tutor/a educativo/a', value: data.academic_tutor_name },
                            { label: 'Fecha inicio', value: data.start_date },
                            { label: 'Fecha fin', value: data.end_date },
                            { label: 'Horas previstas', value: `${data.total_hours} horas` },
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
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">HORARIO MAÑANA</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">HORARIO TARDE</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {sortedHorarios.map((h) => (
                            <tr key={h.id}>
                                <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                                    {DIAS_DISPLAY[h.weekday] || h.weekday.toUpperCase()}
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
