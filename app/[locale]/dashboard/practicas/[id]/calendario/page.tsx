'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/PageHeader';
import CalendarView from '@/components/CalendarView';
import { useApi } from '@/hooks/useApi';

interface AsistenciaEvent {
    id: number;
    fecha: string;
    tipo: string;
    hora_inicio: string | null;
    hora_fin: string | null;
    estado: string;
    notas: string | null;
}

export default function CalendarioPage() {
    const params = useParams();
    const t = useTranslations('practicas');
    const now = new Date();
    const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

    const { data } = useApi<AsistenciaEvent[]>(
        `/practicas/${params.id}/asistencia?month=${month}`
    );

    return (
        <div>
            <PageHeader title={t('attendanceCalendar')} />
            <CalendarView
                events={(data || []).map((e) => ({
                    fecha: e.fecha,
                    tipo: e.tipo,
                    hora_inicio: e.hora_inicio || undefined,
                    hora_fin: e.hora_fin || undefined,
                    estado: e.estado,
                }))}
                onMonthChange={setMonth}
            />
        </div>
    );
}
