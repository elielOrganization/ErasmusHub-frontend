'use client';

import { useTranslations } from 'next-intl';
import AccessDenied from '@/components/ui/AccessDenied';

export default function UnauthorizedPage() {
    const t = useTranslations('accessDenied');

    return (
        <AccessDenied
            title={t('title')}
            message={t('message')}
            backLabel={t('backLabel')}
            backHref="/dashboard"
        />
    );
}
