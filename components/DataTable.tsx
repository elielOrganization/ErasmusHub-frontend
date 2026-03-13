'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

export interface Column<T> {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    onSearch: (query: string) => void;
    loading?: boolean;
}

export default function DataTable<T extends Record<string, unknown>>({
    columns,
    data,
    total,
    page,
    pageSize,
    onPageChange,
    onPageSizeChange,
    onSearch,
    loading = false,
}: DataTableProps<T>) {
    const t = useTranslations('table');
    const [searchValue, setSearchValue] = useState('');
    const totalPages = Math.ceil(total / pageSize);
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);

    const handleSearch = (value: string) => {
        setSearchValue(value);
        onSearch(value);
        onPageChange(1);
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Controls */}
            <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    {t('show')}
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            onPageSizeChange(Number(e.target.value));
                            onPageChange(1);
                        }}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white"
                    >
                        {[10, 25, 50].map((size) => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                    {t('records')}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{t('search')}</span>
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-blue-400"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-y border-gray-100">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-8 text-center text-sm text-gray-400">
                                    Cargando...
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-8 text-center text-sm text-gray-400">
                                    {t('noResults')}
                                </td>
                            </tr>
                        ) : (
                            data.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                    {columns.map((col) => (
                                        <td key={col.key} className="px-6 py-3 text-sm text-gray-700">
                                            {col.render ? col.render(item) : String(item[col.key] ?? '')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">
                    {t('showing', { from, to, total })}
                </span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange(page - 1)}
                        disabled={page <= 1}
                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {t('previous')}
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={`w-8 h-8 text-sm rounded-lg ${
                                    page === pageNum
                                        ? 'bg-blue-600 text-white'
                                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                    <button
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= totalPages}
                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {t('next')}
                    </button>
                </div>
            </div>
        </div>
    );
}
