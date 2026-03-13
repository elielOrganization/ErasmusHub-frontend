'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { useApi, apiPost } from '@/hooks/useApi';

interface Comunicacion {
    id: number;
    emisor_id: number;
    destinatario_tipo: string;
    tipo: string;
    asunto: string;
    mensaje: string;
    leido: boolean;
    created_at: string;
}

function MessageSection({
    title,
    messages,
    loading,
    onAdd,
    t,
}: {
    title: string;
    messages: Comunicacion[];
    loading: boolean;
    onAdd: () => void;
    t: (key: string) => string;
}) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="flex items-center justify-between px-6 py-4 bg-blue-50 border-b border-blue-100">
                <h2 className="text-sm font-semibold text-blue-900">{title}</h2>
                <button
                    onClick={onAdd}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                >
                    + {t('addMessage')}
                </button>
            </div>
            <table className="w-full">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('date')}</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('type')}</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('subject')}</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('message')}</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('read')}</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">Cargando...</td></tr>
                    ) : messages.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">Ningún dato disponible en esta tabla</td></tr>
                    ) : (
                        messages.map((msg) => (
                            <tr key={msg.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                <td className="px-6 py-3 text-sm text-gray-700">{new Date(msg.created_at).toLocaleDateString()}</td>
                                <td className="px-6 py-3 text-sm text-gray-700">{msg.tipo}</td>
                                <td className="px-6 py-3 text-sm text-gray-700">{msg.asunto}</td>
                                <td className="px-6 py-3 text-sm text-gray-700 max-w-xs truncate">{msg.mensaje}</td>
                                <td className="px-6 py-3">
                                    <StatusBadge label={msg.leido ? 'Sí' : 'No'} variant={msg.leido ? 'success' : 'warning'} />
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default function ComunicacionesPage() {
    const params = useParams();
    const t = useTranslations('practicas');

    const { data: tutorMsgs, loading: l1 } = useApi<Comunicacion[]>(
        `/practicas/${params.id}/comunicaciones?destinatario_tipo=tutor_empresa`
    );
    const { data: cotutorMsgs, loading: l2 } = useApi<Comunicacion[]>(
        `/practicas/${params.id}/comunicaciones?destinatario_tipo=cotutor`
    );

    const handleAddTutor = () => {
        // TODO: open modal to create message
    };

    const handleAddCotutor = () => {
        // TODO: open modal to create message
    };

    return (
        <div>
            <MessageSection
                title={`${t('communicationStudentTutor')}`}
                messages={tutorMsgs || []}
                loading={l1}
                onAdd={handleAddTutor}
                t={t}
            />
            <MessageSection
                title={`${t('communicationStudentCotutor')}`}
                messages={cotutorMsgs || []}
                loading={l2}
                onAdd={handleAddCotutor}
                t={t}
            />
        </div>
    );
}
