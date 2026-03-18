import { API_URL } from '@/lib/api';
import Cookies from 'js-cookie';
import type { User } from './userService';

export type { User, Role } from './userService';

/** Client-side fetch (for client components) */
export async function fetchUsersClient(): Promise<User[]> {
    const token = Cookies.get('auth_token');
    const response = await fetch(`${API_URL}/users/`, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) return [];
    return response.json();
}
