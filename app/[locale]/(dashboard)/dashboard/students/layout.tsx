import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SERVER_API_URL } from '@/lib/api';

export default async function StudentsLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        redirect('/login');
    }

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

        const lower = roleName?.toLowerCase() || '';
        const isAllowed = lower.includes('admin') || lower.includes('teacher') || lower.includes('profesor');

        if (!isAllowed) {
            redirect('/dashboard/unauthorized');
        }

    } catch (error) {
        console.error("Students auth validation failed:", error);
        redirect('/login');
    }

    return <>{children}</>;
}
