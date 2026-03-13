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
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('type')}</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('scheduledDate')}</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('completionDate')}</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('status')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">{t('loading')}</td></tr>
                        ) : data?.map((s) => {
                            const available = new Date(s.scheduled_date) <= new Date();
                            return (
                                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{TIPO_DISPLAY[s.type] || s.type}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{s.scheduled_date}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{s.completed_at || '-'}</td>
                                    <td className="px-6 py-4">
                                        {s.completed ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg border border-green-200">
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                {t('completedStatus').toUpperCase()}
                                            </span>
                                        ) : available ? (
                                            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
                                                {t('fillOut')}
                                            </button>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-lg border border-red-200">
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586l-1.293-1.293z" clipRule="evenodd" /></svg>
                                                {t('notAvailable').toUpperCase()}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}