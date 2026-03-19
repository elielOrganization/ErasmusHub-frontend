import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { SERVER_API_URL } from '@/lib/api';
import AccessDenied from '@/components/ui/AccessDenied';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        redirect('/login');
    }

    let allowed = false;

    try {
        const response = await fetch(`${SERVER_API_URL}/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            redirect('/login');
        }

        const userData = await response.json();

        const roleName = typeof userData.role === 'string'
            ? userData.role
            : userData.role?.name;

        allowed = !!roleName && roleName.toLowerCase().includes('admin');

    } catch (error) {
        console.error("Admin auth validation failed:", error);
        redirect('/login');
    }

    if (!allowed) {
        const t = await getTranslations('accessDenied');
        return (
            <AccessDenied
                title={t('title')}
                message={t('message')}
                backLabel={t('backLabel')}
            />
        );
    }

    return <>{children}</>;
}
