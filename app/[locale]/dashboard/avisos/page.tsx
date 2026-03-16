'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/PageHeader';
import DataTable, { Column } from '@/components/DataTable';
import { useApi, apiPatch } from '@/hooks/useApi';

interface Notice {
    id: number;
    title: string;
    body: string;
    type: string;
    is_read: boolean;
    created_at: string;
}

interface PaginatedResponse {
    items: Notice[];
    total: number;
    page: number;
    page_size: number;
}

export default function AvisosPage() {
    const t = useTranslations('avisos');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [search, setSearch] = useState('');

    const { data, loading, refetch } = useApi<PaginatedResponse>(
        `/notifications/me?page=${page}&page_size=${pageSize}${search ? `&search=${search}` : ''}`
    );

    const handleMarkRead = async (id: number) => {
        await apiPatch(`/notifications/${id}/read`);
        refetch();
    };

    const columns: Column<Notice>[] = [
        { key: 'title', label: t('notice') },
        {
            key: 'type',
            label: t('type'),
            render: (item) => (
                <span className="uppercase text-xs font-medium text-gray-600">{item.type}</span>
            ),
        },
        {
            key: 'action',
            label: t('view'),
            render: (item) => (
                <button
                    onClick={() => handleMarkRead(item.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                >
                    {t('view')}
                </button>
            ),
        },
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
