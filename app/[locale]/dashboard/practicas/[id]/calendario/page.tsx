'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/PageHeader';
import CalendarView from '@/components/CalendarView';
import { useApi } from '@/hooks/useApi';

interface AsistenciaEvent {
    id: number;
    date: string;
    type: string;
    start_time: string | null;
    end_time: string | null;
    status: string;
    notes: string | null;
}

export default function CalendarioPage() {
    const params = useParams();
    const t = useTranslations('practicas');
    const now = new Date();
    const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

    const { data } = useApi<AsistenciaEvent[]>(
        `/internships/${params.id}/attendance?month=${month}`
    );

    return (
        <div>
            <PageHeader title={t('attendanceCalendar')} />
            <CalendarView
                events={(data || []).map((e) => ({
                    date: e.date,
                    type: e.type,
                    start_time: e.start_time || undefined,
                    end_time: e.end_time || undefined,
                    status: e.status,
                }))}
                onMonthChange={setMonth}
            />
        </div>
    );
}
