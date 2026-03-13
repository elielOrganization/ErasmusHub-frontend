'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/PageHeader';
import DataTable, { Column } from '@/components/DataTable';
import { useApi, apiPatch } from '@/hooks/useApi';

interface Notificacion {
    id: number;
    titulo: string;
    body: string;
    tipo: string;
    is_read: boolean;
    created_at: string;
}

interface PaginatedResponse {
    items: Notificacion[];
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
        `/notificaciones/me?page=${page}&page_size=${pageSize}${search ? `&search=${search}` : ''}`
    );

    const handleMarkRead = async (id: number) => {
        await apiPatch(`/notificaciones/${id}/read`);
        refetch();
    };

    const columns: Column<Notificacion>[] = [
        { key: 'titulo', label: t('notice') },
        {
            key: 'tipo',
            label: t('type'),
            render: (item) => (
                <span className="uppercase text-xs font-medium text-gray-600">{item.tipo}</span>
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
                    VER
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
