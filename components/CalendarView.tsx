'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface CalendarEvent {
    fecha: string; // YYYY-MM-DD
    tipo: string;
    hora_inicio?: string;
    hora_fin?: string;
    estado: string;
}

interface CalendarViewProps {
    events: CalendarEvent[];
    onMonthChange: (yearMonth: string) => void;
}

const eventColors: Record<string, string> = {
    asistencia: 'bg-green-500 text-white',
    completado: 'bg-green-600 text-white',
    pendiente: 'bg-blue-500 text-white',
    falta_justificada: 'bg-yellow-500 text-white',
    falta_injustificada: 'bg-red-500 text-white',
    festivo: 'bg-gray-400 text-white',
};

const DAYS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

export default function CalendarView({ events, onMonthChange }: CalendarViewProps) {
    const t = useTranslations('practicas');
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday = 0 in our grid
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const daysInMonth = lastDay.getDate();

    const navigate = (delta: number) => {
        const newDate = new Date(year, month + delta, 1);
        setCurrentDate(newDate);
        const ym = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
        onMonthChange(ym);
    };

    const goToday = () => {
        const today = new Date();
        setCurrentDate(today);
        const ym = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        onMonthChange(ym);
    };

    const monthNames = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    const eventMap = new Map<string, CalendarEvent[]>();
    events.forEach((e) => {
        const key = e.fecha;
        if (!eventMap.has(key)) eventMap.set(key, []);
        eventMap.get(key)!.push(e);
    });

    const cells: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={() => navigate(1)} className="p-1 hover:bg-gray-100 rounded">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                    <button onClick={goToday} className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                        Hoy
                    </button>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 capitalize">
                    {monthNames[month]} de {year}
                </h2>
                <div className="w-24" />
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-100">
                {DAYS.map((day) => (
                    <div key={day} className="px-2 py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
                {cells.map((day, idx) => {
                    const dateStr = day
                        ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                        : '';
                    const dayEvents = day ? (eventMap.get(dateStr) || []) : [];
                    const isToday = day && new Date().toISOString().slice(0, 10) === dateStr;

                    return (
                        <div
                            key={idx}
                            className={`min-h-24 border-b border-r border-gray-100 p-1 ${
                                !day ? 'bg-gray-50/50' : ''
                            }`}
                        >
                            {day && (
                                <>
                                    <div className={`text-xs font-medium mb-1 ${isToday ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                                        {day}
                                    </div>
                                    <div className="space-y-1">
                                        {dayEvents.map((ev, i) => (
                                            <div
                                                key={i}
                                                className={`text-[10px] px-1.5 py-0.5 rounded truncate ${
                                                    eventColors[ev.tipo] || eventColors[ev.estado] || 'bg-gray-200 text-gray-700'
                                                }`}
                                            >
                                                {ev.tipo === 'asistencia' && ev.hora_inicio && ev.hora_fin
                                                    ? `ASISTE [${ev.hora_inicio}-${ev.hora_fin}]`
                                                    : ev.tipo.replace('_', ' ')}
                                            </div>
                                        ))}
                                        {dayEvents.length > 0 && dayEvents[0].estado && (
                                            <div className={`text-[10px] px-1.5 py-0.5 rounded truncate ${
                                                dayEvents[0].estado === 'completado'
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-blue-500 text-white'
                                            }`}>
                                                {dayEvents[0].estado === 'completado'
                                                    ? 'Cumplimentado por el alumno/a'
                                                    : 'Pendiente de cumplimentar'}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
