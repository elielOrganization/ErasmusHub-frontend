'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/PageHeader';
import { apiPost } from '@/hooks/useApi';

export default function ExencionesPage() {
    const t = useTranslations('exenciones');
    const [motivo, setMotivo] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!motivo.trim()) return;

        setSubmitting(true);
        setError('');
        try {
            await apiPost('/exenciones/', { motivo });
            setSuccess(true);
            setMotivo('');
        } catch {
            setError('Error al enviar la solicitud');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <PageHeader title={t('title')} />

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <p className="text-sm text-gray-600 mb-6">{t('description')}</p>

                {success && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
                        {t('successMessage')}
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('reason')}
                        </label>
                        <textarea
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            rows={4}
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-400 resize-none"
                            placeholder={t('reasonPlaceholder')}
                        />
                    </div>

                    {/* Document upload section */}
                    <div className="mb-6">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">{t('documentsToProvide')}</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-700">{t('socialSecurityCert')}</span>
                                <label className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors">
                                    {t('selectFile')}
                                    <input type="file" className="hidden" accept=".pdf,.doc,.docx" />
                                </label>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-700">{t('activitiesCert')}</span>
                                <label className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors">
                                    {t('selectFile')}
                                    <input type="file" className="hidden" accept=".pdf,.doc,.docx" />
                                </label>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || !motivo.trim()}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        {t('submit')}
                    </button>
                </form>
            </div>
        </div>
    );
}
