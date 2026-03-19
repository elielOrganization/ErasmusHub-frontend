"use client";

import { useTranslations } from 'next-intl';

export default function ErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const t = useTranslations('errors');

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-6 text-center px-6 max-w-md">
                <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
                    <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {t('errorTitle')}
                    </h1>
                    <p className="text-gray-500 mt-2">
                        {t('errorDescription')}
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={reset}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                        {t('errorRetry')}
                    </button>
                    <a
                        href="/"
                        className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-colors"
                    >
                        {t('errorGoHome')}
                    </a>
                </div>
            </div>
        </div>
    );
}
