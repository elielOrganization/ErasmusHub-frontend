import { ReactNode } from 'react';

export interface StatCardItem {
    label: string;
    value: number | string;
    color?: string;          // Tailwind text color for the value, e.g. "text-purple-600"
    icon?: ReactNode;        // kept for API compatibility, not rendered
}

const accentHex: Record<string, string> = {
    'text-purple-600': '#9333ea',
    'text-purple-500': '#a855f7',
    'text-blue-600':   '#2563eb',
    'text-blue-500':   '#3b82f6',
    'text-green-600':  '#16a34a',
    'text-green-500':  '#22c55e',
    'text-rose-600':   '#e11d48',
    'text-rose-500':   '#f43f5e',
    'text-amber-600':  '#d97706',
    'text-amber-500':  '#f59e0b',
    'text-sky-600':    '#0284c7',
    'text-sky-500':    '#0ea5e9',
    'text-indigo-600': '#4f46e5',
    'text-indigo-500': '#6366f1',
    'text-teal-600':   '#0d9488',
    'text-teal-500':   '#14b8a6',
};

export default function StatCards({ items }: { items: StatCardItem[] }) {
    const n = items.length;
    const cols =
        n <= 2 ? 'grid-cols-2' :
        n === 4 ? 'grid-cols-2 sm:grid-cols-4' :
        n === 6 ? 'grid-cols-3' :
        'grid-cols-3';

    return (
        <div className={`grid ${cols} gap-3 sm:gap-4`}>
            {items.map((item, i) => {
                const hex = item.color ? (accentHex[item.color] ?? '#6b7280') : '#6b7280';

                return (
                    <div
                        key={i}
                        className="rounded-2xl px-4 py-4 sm:px-5 sm:py-5 flex flex-col gap-1 bg-white dark:bg-gray-900"
                        style={{
                            boxShadow: `0 0 0 1px ${hex}22, 0 2px 8px ${hex}14`,
                        }}
                    >
                        <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 leading-none">
                            {item.label}
                        </span>
                        <span
                            className="text-2xl sm:text-3xl font-bold tabular-nums leading-tight"
                            style={{ color: hex }}
                        >
                            {item.value ?? 0}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
