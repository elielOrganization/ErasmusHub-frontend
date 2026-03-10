"use client";

import { useTranslations } from 'next-intl';

export default function OfflinePage() {
  const t = useTranslations('offline');

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4 text-center px-6">
        <svg
          className="w-16 h-16 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M18.364 5.636a9 9 0 11-12.728 0M12 9v4m0 4h.01"
          />
        </svg>
        <h1 className="text-2xl font-bold text-gray-800">
          {t('title')}
        </h1>
        <p className="text-gray-500 max-w-sm">
          {t('description')}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors"
        >
          {t('retry')}
        </button>
      </div>
    </div>
  );
}
