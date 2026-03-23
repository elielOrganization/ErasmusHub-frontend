import { ReactNode } from 'react';

export interface StatCardItem {
    label: string;
    value: number | string;
    color?: string;          // Tailwind text color for the value, e.g. "text-purple-600"
    icon?: ReactNode;
}

/* Maps a text color class to a soft background for the icon circle */
function colorToBg(color?: string): string {
    if (!color) return 'bg-gray-100 dark:bg-gray-800';
    if (color.includes('purple')) return 'bg-purple-100 dark:bg-purple-900/30';
    if (color.includes('amber'))  return 'bg-amber-100 dark:bg-amber-900/30';
    if (color.includes('emerald')) return 'bg-emerald-100 dark:bg-emerald-900/30';
    if (color.includes('blue'))   return 'bg-blue-100 dark:bg-blue-900/30';
    if (color.includes('red'))    return 'bg-red-100 dark:bg-red-900/30';
    return 'bg-gray-100 dark:bg-gray-800';
}

/**
 * Responsive stat cards grid.
 * - Mobile: compact horizontal row.
 * - Desktop: cards with colored icon badge.
 */
export default function StatCards({ items }: { items: StatCardItem[] }) {
    return (
        <>
            {/* ── Mobile: compact horizontal strip ── */}
            <div className="flex sm:hidden gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {items.map((item, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-2.5 bg-white dark:bg-gray-900 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-800 shadow-sm min-w-0 flex-1"
                    >
                        {item.icon && (
                            <span className={`shrink-0 ${item.color || 'text-gray-600'}`}>
                                {item.icon}
                            </span>
                        )}
                        <div className="min-w-0">
                            <p className={`text-xl font-bold leading-none ${item.color || 'text-gray-800'}`}>
                                {item.value}
                            </p>
                            <p className="text-[11px] text-gray-400 font-medium mt-0.5 truncate">
                                {item.label}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Desktop ── */}
            <div className={`hidden sm:grid gap-4 ${
                items.length === 2 ? 'grid-cols-2' : items.length === 3 ? 'grid-cols-3' : 'grid-cols-4'
            }`}>
                {items.map((item, i) => (
                    <div
                        key={i}
                        className="group bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
                    >
                        {item.icon && (
                            <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${colorToBg(item.color)}`}>
                                <span className={item.color || 'text-gray-600'}>{item.icon}</span>
                            </div>
                        )}
                        <div>
                            <p className={`text-2xl font-bold leading-none ${item.color || 'text-gray-800 dark:text-gray-100'}`}>
                                {item.value}
                            </p>
                            <p className="text-sm text-gray-400 font-medium mt-1">{item.label}</p>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
