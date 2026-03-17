"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from '@/i18n/routing';
import { API_URL } from '@/lib/api';

interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    roles: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    loginGlobal: (token: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Function to validate the token against /auth/me
    const checkUserSession = async () => {
        const token = Cookies.get('auth_token');

        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`, // Header required by the backend
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                console.log(userData)
            } else {
                // If backend returns 401 (token expired after 30 min), clear everything
                logout();
            }
        } catch (error) {
            console.error("Connection error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkUserSession();
    }, []);

    const loginGlobal = async (token: string) => {
        await checkUserSession(); // Sync user state after login
    };

    const logout = () => {
        Cookies.remove('auth_token');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginGlobal, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};