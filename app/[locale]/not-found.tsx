import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function NotFoundPage() {
    const t = useTranslations('errors');

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-6 text-center px-6 max-w-md">
                <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
                    <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                    </svg>
                </div>

                <div>
                    <p className="text-7xl font-extrabold text-blue-600 mb-2">404</p>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {t('notFoundTitle')}
                    </h1>
                </div>

                <p className="text-gray-500">
                    {t('notFoundDescription')}
                </p>

                <Link
                    href="/"
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors"
                >
                    {t('notFoundButton')}
                </Link>
            </div>
        </div>
    );
}
