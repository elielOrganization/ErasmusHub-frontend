'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { useApi, apiPost } from '@/hooks/useApi';

interface Communication {
    id: number;
    sender_id: number;
    recipient_type: string;
    type: string;
    subject: string;
    body: string;
    is_read: boolean;
    created_at: string;
}

function MessageSection({
    title,
    messages,
    loading,
    onAdd,
    t,
    tc,
}: {
    title: string;
    messages: Communication[];
    loading: boolean;
    onAdd: () => void;
    t: (key: string) => string;
    tc: (key: string) => string;
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
                        <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">{tc('loading')}</td></tr>
                    ) : messages.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">{t('noDataAvailable')}</td></tr>
                    ) : (
                        messages.map((msg) => (
                            <tr key={msg.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                <td className="px-6 py-3 text-sm text-gray-700">{new Date(msg.created_at).toLocaleDateString()}</td>
                                <td className="px-6 py-3 text-sm text-gray-700">{msg.type}</td>
                                <td className="px-6 py-3 text-sm text-gray-700">{msg.subject}</td>
                                <td className="px-6 py-3 text-sm text-gray-700 max-w-xs truncate">{msg.body}</td>
                                <td className="px-6 py-3">
                                    <StatusBadge label={msg.is_read ? tc('yes') : tc('no')} variant={msg.is_read ? 'success' : 'warning'} />
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
    const tc = useTranslations('common');

    const { data: tutorMsgs, loading: l1 } = useApi<Communication[]>(
        `/internships/${params.id}/communications?recipient_type=tutor_empresa`
    );
    const { data: cotutorMsgs, loading: l2 } = useApi<Communication[]>(
        `/internships/${params.id}/communications?recipient_type=cotutor`
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
                tc={tc}
            />
            <MessageSection
                title={`${t('communicationStudentCotutor')}`}
                messages={cotutorMsgs || []}
                loading={l2}
                onAdd={handleAddCotutor}
                t={t}
                tc={tc}
            />
        </div>
    );
}
