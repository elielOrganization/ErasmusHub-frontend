'use client';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/PageHeader';
import InfoCard from '@/components/InfoCard';
import { useApi } from '@/hooks/useApi';

interface HorarioItem {
    id: number;
    dia_semana: string;
    horario_manana: string | null;
    horario_tarde: string | null;
}

interface PracticaDetail {
    id: number;
    estudiante_nombre: string;
    estudiante_apellidos: string;
    estudiante_email: string;
    empresa_nombre: string;
    empresa_cif: string | null;
    empresa_direccion: string | null;
    tutor_empresa_nombre: string | null;
    tutor_empresa_email: string | null;
    tutor_educativo_nombre: string | null;
    fecha_inicio: string;
    fecha_fin: string;
    horas_totales: number;
    estado: string;
    horarios: HorarioItem[];
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
    const { data, loading } = useApi<PracticaDetail>(`/practicas/${params.id}`);

    if (loading) {
        return <div className="text-sm text-gray-400 py-8 text-center">Cargando...</div>;
    }

    if (!data) {
        return <div className="text-sm text-gray-400 py-8 text-center">No se encontró la práctica</div>;
    }

    const sortedHorarios = [...(data.horarios || [])].sort(
        (a, b) => DIAS_ORDER.indexOf(a.dia_semana) - DIAS_ORDER.indexOf(b.dia_semana)
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
                            { label: 'Nombre completo', value: `${data.estudiante_nombre} ${data.estudiante_apellidos}` },
                            { label: 'Email', value: data.estudiante_email },
                        ]}
                    />
                    <InfoCard
                        title={t('companyData')}
                        fields={[
                            { label: 'Nombre empresa', value: data.empresa_nombre },
                            { label: 'CIF', value: data.empresa_cif },
                            { label: 'Dirección prácticas', value: data.empresa_direccion },
                            { label: 'Tutor/a empresa', value: data.tutor_empresa_nombre },
                        ]}
                    />
                    <InfoCard
                        title={t('practiceData')}
                        fields={[
                            { label: 'Nombre tutor/a educativo/a', value: data.tutor_educativo_nombre },
                            { label: 'Fecha inicio', value: data.fecha_inicio },
                            { label: 'Fecha fin', value: data.fecha_fin },
                            { label: 'Horas previstas', value: `${data.horas_totales} horas` },
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
                                    {DIAS_DISPLAY[h.dia_semana] || h.dia_semana.toUpperCase()}
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-700">{h.horario_manana || '-'}</td>
                                <td className="px-6 py-3 text-sm text-gray-700">{h.horario_tarde || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
