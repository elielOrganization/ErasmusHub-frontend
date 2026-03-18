"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from '@/i18n/routing';
import { API_URL } from '@/lib/api';

interface Role {
    id: number;
    name: string;
    description: string;
}

interface User {
    id: number;
    birth_date: string;
    created_at: string;
    is_minor: boolean;
    rodne_cislo: string;
    phone: string;
    email: string;
    first_name: string;
    last_name: string;
    role: Role;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    roleName: string | null; // inmediate value from token
    loginGlobal: (token: string) => Promise<void>;
    logout: () => void;
}

function base64UrlDecode(input: string) {
    // Base64url -> Base64
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const padded = pad === 0 ? base64 : base64 + '='.repeat(4 - pad);
    return atob(padded);
}

function decodeJwt<T = any>(token: string): T | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = base64UrlDecode(parts[1]);
        return JSON.parse(payload) as T;
    } catch {
        return null;
    }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [roleName, setRoleName] = useState<string | null>(null);
    const router = useRouter();

    // Decodes the token and updates roleName (fast path). Then refreshes full user data.
    const refreshUserFromToken = async () => {
        const token = Cookies.get('auth_token');
        if (!token) {
            setUser(null);
            setRoleName(null);
            setLoading(false);
            return;
        }

        const decoded = decodeJwt<{ sub?: string; role?: string }>(token);
        const role = decoded?.role ?? null;
        setRoleName(role);

        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                // Keep roleName in sync with the validated value from the backend
                setRoleName(userData?.role?.name ?? role);
            } else {
                // If backend returns 401 (token expired), clear everything
                logout();
            }
        } catch (error) {
            console.error('Connection error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUserFromToken();

        const interval = setInterval(() => {
            refreshUserFromToken();
        }, 10 * 60 * 1000); // Refresh every 10 min

        return () => clearInterval(interval);
    }, []);

    const loginGlobal = async (token: string) => {
        await refreshUserFromToken(); // Sync user state after login
    };

    const logout = () => {
        Cookies.remove('auth_token');
        setUser(null);
        setRoleName(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, roleName, loginGlobal, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};