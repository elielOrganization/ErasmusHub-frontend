'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/PageHeader';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { useApi } from '@/hooks/useApi';

interface DiaryEntry {
    id: number;
    date: string;
    status: string;
    morning_start: string | null;
    morning_end: string | null;
    afternoon_start: string | null;
    afternoon_end: string | null;
    incidents: string | null;
}

interface PaginatedResponse {
    items: DiaryEntry[];
    total: number;
    page: number;
    page_size: number;
}

export default function DiarioPage() {
    const params = useParams();
    const t = useTranslations('practicas');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [search, setSearch] = useState('');

    const { data, loading } = useApi<PaginatedResponse>(
        `/internships/${params.id}/daily-logs?page=${page}&page_size=${pageSize}`
    );

    const columns: Column<DiaryEntry>[] = [
        {
            key: 'view',
            label: t('view'),
            render: () => (
                <button className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </button>
            ),
        },
        { key: 'date', label: t('date') },
        {
            key: 'status',
            label: t('status'),
            render: (item) => (
                <StatusBadge
                    label={item.status === 'completado' ? t('completedByStudent') : t('pendingCompletion')}
                    variant={item.status === 'completado' ? 'success' : 'warning'}
                />
            ),
        },
        { key: 'morning_start', label: t('morningStart') },
        { key: 'morning_end', label: t('morningEnd') },
        { key: 'afternoon_start', label: t('afternoonStart') },
        { key: 'afternoon_end', label: t('afternoonEnd') },
        { key: 'incidents', label: t('incidents') },
    ];

    return (
        <div>
            <PageHeader title={t('diary')} />
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
