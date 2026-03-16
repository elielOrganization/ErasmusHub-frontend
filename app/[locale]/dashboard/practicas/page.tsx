'use client';
import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import PageHeader from '@/components/PageHeader';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge, { getStatusVariant } from '@/components/StatusBadge';
import { useApi } from '@/hooks/useApi';

interface Internship {
    id: number;
    company_name: string;
    company_address: string | null;
    start_date: string;
    end_date: string;
    total_hours: number;
    status: string;
}

interface PaginatedResponse {
    items: Internship[];
    total: number;
    page: number;
    page_size: number;
}

export default function MisPracticasPage() {
    const t = useTranslations('practicas');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [search, setSearch] = useState('');

    const { data, loading } = useApi<PaginatedResponse>(
        `/internships/me?page=${page}&page_size=${pageSize}${search ? `&search=${search}` : ''}`
    );

    const columns: Column<Internship>[] = [
        {
            key: 'action',
            label: '',
            render: (item) => (
                <Link
                    href={`/dashboard/practicas/${item.id}/datos-generales`}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    {t('viewPractice')}
                </Link>
            ),
        },
        { key: 'company_name', label: t('entity') },
        { key: 'start_date', label: t('startDate') },
        { key: 'end_date', label: t('endDate') },
        { key: 'total_hours', label: t('totalHours') },
    ];

    return (
        <div>
            <PageHeader title={t('title')} />
            <DataTable
                columns={columns}
                data={data?.items || []}
                total={data?.total || 0}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                onSearch={setSearch}
                loading={loading}
            />
        </div>
    );
}
