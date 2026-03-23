"use client";

import { useTranslations } from 'next-intl';

export default function DashboardErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const t = useTranslations('errors');

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-6">
            <div className="max-w-md w-full bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                </div>

                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    {t('errorTitle')}
                </h1>
                <p className="text-gray-500 text-sm mb-6">
                    {t('errorDescription')}
                </p>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="px-5 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm"
                    >
                        {t('errorRetry')}
                    </button>
                    <a
                        href="/dashboard"
                        className="px-5 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
                    >
                        {t('errorGoHome')}
                    </a>
                </div>
            </div>
        </div>
    );
}
