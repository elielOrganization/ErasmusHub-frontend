'use client';

interface PageHeaderProps {
    title: string;
}

export default function SectionHeader({ title }: PageHeaderProps) {
    return (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-6 py-4 mb-6">
            <h1 className="text-lg font-semibold text-blue-900">{title}</h1>
        </div>
    );
}
