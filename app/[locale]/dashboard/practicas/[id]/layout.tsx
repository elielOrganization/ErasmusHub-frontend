'use client';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import TabNav from '@/components/TabNav';

export default function PracticaDetailLayout({ children }: { children: React.ReactNode }) {
    const t = useTranslations('practicas');
    const params = useParams();
    const id = params.id;

    const tabs = [
        { label: t('generalData'), href: `/dashboard/practicas/${id}/datos-generales` },
        { label: t('followUps'), href: `/dashboard/practicas/${id}/seguimientos` },
        { label: t('diary'), href: `/dashboard/practicas/${id}/diario` },
        { label: t('activityCalendar'), href: `/dashboard/practicas/${id}/calendario` },
        { label: t('communications'), href: `/dashboard/practicas/${id}/comunicaciones` },
    ];

    return (
        <div>
            <TabNav tabs={tabs} />
            {children}
        </div>
    );
}
