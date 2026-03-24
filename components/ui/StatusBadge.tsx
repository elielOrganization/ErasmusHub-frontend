'use client';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
    label: string;
    variant?: Variant;
}

const variantStyles: Record<Variant, string> = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

export default function StatusBadge({ label, variant = 'neutral' }: StatusBadgeProps) {
    return (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${variantStyles[variant]}`}>
            {label}
        </span>
    );
}

export function getStatusVariant(status: string): Variant {
    const map: Record<string, Variant> = {
        completado: 'success',
        activa: 'info',
        pendiente: 'warning',
        cancelada: 'danger',
        rechazada: 'danger',
        aprobada: 'success',
        finalizada: 'neutral',
    };
    return map[status.toLowerCase()] || 'neutral';
}
