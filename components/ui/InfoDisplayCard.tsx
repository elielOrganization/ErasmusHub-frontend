'use client';

interface InfoField {
    label: string;
    value: string | undefined | null;
}

interface InfoCardProps {
    title: string;
    fields: InfoField[];
}

export default function InfoDisplayCard({ title, fields }: InfoCardProps) {
    return (
        <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">{title}</h3>
            <div className="space-y-2">
                {fields.map((field, i) => (
                    <div key={i} className="text-sm">
                        <span className="text-gray-500 dark:text-gray-400">{field.label}: </span>
                        <span className="text-gray-900 dark:text-gray-100">{field.value || '-'}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
