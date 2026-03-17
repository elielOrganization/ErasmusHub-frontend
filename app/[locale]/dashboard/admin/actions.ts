"use server";

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SERVER_API_URL } from '@/lib/api';

async function getTokenFromCookie() {
    const cookieStore = await cookies();
    return cookieStore.get('auth_token')?.value;
}

export async function deleteUser(formData: FormData) {
    const userId = formData.get('userId');
    const locale = formData.get('locale')?.toString() ?? 'en';
    const token = await getTokenFromCookie();

    if (!token || !userId) {
        redirect(`/${locale}/login`);
    }

    await fetch(`${SERVER_API_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        cache: 'no-store',
    });

    redirect(`/${locale}/dashboard/admin`);
}

export async function toggleRole(formData: FormData) {
    const userId = formData.get('userId');
    const currentRole = formData.get('currentRole') as string | null;
    const locale = formData.get('locale')?.toString() ?? 'en';
    const token = await getTokenFromCookie();

    if (!token || !userId || !currentRole) {
        redirect(`/${locale}/login`);
    }

    const nextRoleSlug = currentRole.toLowerCase().includes('admin') ? 'student' : 'admin';

    await fetch(`${SERVER_API_URL}/users/${userId}`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: nextRoleSlug }),
        cache: 'no-store',
    });

    redirect(`/${locale}/dashboard/admin`);
}
