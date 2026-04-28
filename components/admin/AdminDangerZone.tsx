'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiPost } from '@/hooks/useApi';

export default function AdminDangerZone() {
    const t = useTranslations('dashboard');

    // Reset chats state
    const [resettingChats, setResettingChats] = useState(false);
    const [chatsDone, setChatsDone] = useState(false);

    // Reset Erasmus state
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetText, setResetText] = useState('');
    const [resetting, setResetting] = useState(false);
    const [resetDone, setResetDone] = useState(false);

    const handleResetChats = async () => {
        setResettingChats(true);
        try {
            await apiPost('/admin/reset-chats', {});
            setChatsDone(true);
            setTimeout(() => setChatsDone(false), 3000);
        } catch { /* ignore */ }
        finally { setResettingChats(false); }
    };

    const handleResetErasmus = async () => {
        if (resetText !== 'RESET') return;
        setResetting(true);
        try {
            await apiPost('/admin/reset-erasmus', {});
            setResetDone(true);
            setTimeout(() => {
                setShowResetModal(false);
                setResetText('');
                setResetDone(false);
                window.location.reload();
            }, 1800);
        } catch { /* ignore */ }
        finally { setResetting(false); }
    };

    return (
        <div className="space-y-4">
            {/* Chat management */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t('chatManagement')}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('chatManagementDesc')}</p>
                        </div>
                    </div>
                    {chatsDone ? (
                        <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {t('resetChatsSuccess')}
                        </span>
                    ) : (
                        <button
                            onClick={handleResetChats}
                            disabled={resettingChats}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                        >
                            {resettingChats && <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />}
                            {t('resetChats')}
                        </button>
                    )}
                </div>
            </div>

            {/* Full Erasmus reset */}
            <div className="bg-red-50 dark:bg-red-950/20 rounded-3xl p-6 border border-red-200 dark:border-red-900/50 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">{t('resetErasmus')}</h3>
                            <p className="text-xs text-red-600/80 dark:text-red-500/80 mt-0.5 max-w-md">{t('erasmusResetDesc')}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setResetText(''); setResetDone(false); setShowResetModal(true); }}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shrink-0 shadow-sm"
                    >
                        {t('resetErasmus')}
                    </button>
                </div>
            </div>

            {/* Reset Erasmus modal */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md p-6 space-y-4">

                        <div className="border-l-4 border-red-500 pl-3">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('resetErasmusTitle')}</h3>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            {t('resetErasmusDesc')}
                        </p>

                        {!resetDone ? (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                                        {t('resetErasmusConfirmHint')}
                                    </label>
                                    <input
                                        type="text"
                                        value={resetText}
                                        onChange={e => setResetText(e.target.value.toUpperCase())}
                                        placeholder="RESET"
                                        disabled={resetting}
                                        autoFocus
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm font-mono outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-400 dark:focus:border-red-500 disabled:opacity-50"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-1">
                                    <button
                                        onClick={() => { setShowResetModal(false); setResetText(''); }}
                                        disabled={resetting}
                                        className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40"
                                    >
                                        {t('processCancel')}
                                    </button>
                                    <button
                                        onClick={handleResetErasmus}
                                        disabled={resetText !== 'RESET' || resetting}
                                        className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {resetting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                        {t('resetErasmusConfirm')}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{t('resetErasmusSuccess')}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
