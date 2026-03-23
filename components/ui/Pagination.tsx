'use client';

import { useTranslations } from 'next-intl';
import { useRoleTheme } from '@/hooks/useRoleTheme';

interface PaginationProps {
    page: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }: PaginationProps) {
    const t = useTranslations('table');
    const theme = useRoleTheme();

    if (totalPages <= 1) return null;

    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, totalItems);

    // Build page numbers to show: always include first, last, current, and neighbors
    const pages: (number | 'ellipsis')[] = [];
    const addPage = (n: number) => {
        if (n >= 1 && n <= totalPages && !pages.includes(n)) pages.push(n);
    };

    addPage(1);
    for (let i = page - 1; i <= page + 1; i++) addPage(i);
    addPage(totalPages);

    // Sort and insert ellipsis
    const sorted = (pages.filter(p => typeof p === 'number') as number[]).sort((a, b) => a - b);
    const result: (number | 'ellipsis')[] = [];
    for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('ellipsis');
        result.push(sorted[i]);
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
            <span className="text-sm text-gray-400">
                {t('showing', { from, to, total: totalItems })}
            </span>
            <div className="flex items-center gap-1">
                {/* First */}
                <button
                    onClick={() => onPageChange(1)}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title={t('first')}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
                    </svg>
                </button>
                {/* Previous */}
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title={t('previous')}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>

                {/* Page numbers */}
                {result.map((item, i) =>
                    item === 'ellipsis' ? (
                        <span key={`e-${i}`} className="w-8 text-center text-gray-300 text-sm">...</span>
                    ) : (
                        <button
                            key={item}
                            onClick={() => onPageChange(item)}
                            className={`w-8 h-8 text-sm rounded-lg font-medium transition-colors cursor-pointer ${
                                page === item
                                    ? `${theme.btnPrimary} text-white`
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                        >
                            {item}
                        </button>
                    )
                )}

                {/* Next */}
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title={t('next')}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
                {/* Last */}
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title={t('last')}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 4.5l7.5 7.5-7.5 7.5m6-15l7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
