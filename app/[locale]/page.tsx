"use client"
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/context/AuthContext';

export default function RootPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const t = useTranslations('dashboard');

    useEffect(() => {
        // Only act when AuthContext has finished verifying the cookie
        if (!loading) {
            if (user) {
                router.push('/dashboard');
            } else {
                router.push('/login');
            }
        }
    }, [user, loading, router]);

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-gray-400 text-sm animate-pulse">{t('loadingApp')}</p>
            </div>
        </div>
    );
}