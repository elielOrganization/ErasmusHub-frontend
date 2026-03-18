import { SERVER_API_URL } from '@/lib/api';

export interface Role {
    id: number;
    name: string;
    description: string;
}

export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    rodne_cislo: string;
    birth_date: string;
    is_minor: boolean;
    address: string;
    phone: string;
    created_at: string;
    role: Role;
}

/** Server-side fetch (for server components) */
export async function fetchUsersServer(token: string): Promise<User[]> {
    const response = await fetch(`${SERVER_API_URL}/users/`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
    });

    if (!response.ok) return [];
    return response.json();
}
