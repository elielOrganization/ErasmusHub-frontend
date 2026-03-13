'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/PageHeader';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { useApi, apiPatch } from '@/hooks/useApi';

interface Tarea {
    id: number;
    titulo: string;
    completed: boolean;
    due_date: string;
    created_at: string;
}

interface PaginatedResponse {
    items: Tarea[];
    total: number;
    page: number;
    page_size: number;
}

export default function TareasPage() {
    const t = useTranslations('tareas');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [search, setSearch] = useState('');

    const { data, loading, refetch } = useApi<PaginatedResponse>(
        `/tareas/me?page=${page}&page_size=${pageSize}${search ? `&search=${search}` : ''}`
    );

    const handleComplete = async (id: number) => {
        await apiPatch(`/tareas/${id}/completar`);
        refetch();
    };

    const columns: Column<Tarea>[] = [
        { key: 'titulo', label: t('task') },
        {
            key: 'due_date',
            label: t('dueDate'),
            render: (item) => new Date(item.due_date).toLocaleDateString(),
        },
        {
            key: 'completed',
            label: t('status'),
            render: (item) => (
                <StatusBadge
                    label={item.completed ? 'Completada' : 'Pendiente'}
                    variant={item.completed ? 'success' : 'warning'}
                />
            ),
        },
        {
            key: 'action',
            label: '',
            render: (item) =>
                !item.completed ? (
                    <button
                        onClick={() => handleComplete(item.id)}
                        className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                        {t('markComplete')}
                    </button>
                ) : null,
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
