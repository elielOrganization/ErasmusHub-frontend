'use client';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
    label: string;
    variant?: Variant;
}

const variantStyles: Record<Variant, string> = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-orange-100 text-orange-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    neutral: 'bg-gray-100 text-gray-800',
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
