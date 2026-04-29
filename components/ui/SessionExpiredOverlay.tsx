'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import Cookies from 'js-cookie';

export default function SessionExpiredOverlay() {
    const t = useTranslations('sessionExpired');
    const router = useRouter();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handler = () => setVisible(true);
        window.addEventListener('session-expired', handler);
        return () => window.removeEventListener('session-expired', handler);
    }, []);

    if (!visible) return null;

    const handleLogin = () => {
        Cookies.remove('auth_token');
        router.push('/login');
    };

    return (
        /* Full-screen blocker — pointer-events-auto so nothing below is clickable */
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ pointerEvents: 'all' }}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Card */}
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-7 flex flex-col items-center text-center gap-5">
                {/* Icon */}
                <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                    <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                </div>

                {/* Text */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('title')}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">{t('body')}</p>
                </div>

                {/* Button */}
                <button
                    onClick={handleLogin}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                    {t('btn')}
                </button>
            </div>
        </div>
    );
}
