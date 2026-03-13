'use client';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { useApi } from '@/hooks/useApi';

interface Seguimiento {
    id: number;
    type: string;
    scheduled_date: string;
    completed: boolean;
    completed_at: string | null;
}

const TIPO_DISPLAY: Record<string, string> = {
    inicial: 'Cuestionario inicial',
    intermedio: 'Cuestionario intermedio',
    final: 'Cuestionario final',
};

export default function SeguimientosPage() {
    const params = useParams();
    const t = useTranslations('practicas');
    const { data, loading } = useApi<Seguimiento[]>(`/internships/${params.id}/follow-ups`);

    return (
        <div>
            <PageHeader title={t('followUpQuestionnaires')} />
            <div className="mb-4 text-sm font-medium text-gray-700">{t('studentFollowUps')}</div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-y border-gray-100">
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('type')}</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('scheduledDate')}</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('completed')}</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('completionDate')}</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">Cargando...</td></tr>
                        ) : !data || data.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">Sin seguimientos</td></tr>
                        ) : (
                            data.map((s) => {
                                const now = new Date();
                                const scheduled = new Date(s.scheduled_date);
                                const available = scheduled <= now;

                                return (
                                    <tr key={s.id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-3 text-sm text-gray-700">{TIPO_DISPLAY[s.type] || s.type}</td>
                                        <td className="px-6 py-3 text-sm text-gray-700">{s.scheduled_date}</td>
                                        <td className="px-6 py-3">
                                            <StatusBadge
                                                label={s.completed ? 'SÍ' : 'NO'}
                                                variant={s.completed ? 'success' : 'warning'}
                                            />
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-700">{s.completed_at || '-'}</td>
                                        <td className="px-6 py-3">
                                            {s.completado ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg border border-green-200">
                                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                    SEGUIMIENTO REALIZADO
                                                </span>
                                            ) : available ? (
                                                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
                                                    {t('fillOut')}
                                                </button>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-lg border border-red-200">
                                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                                    SEGUIMIENTO AÚN NO DISPONIBLE
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
