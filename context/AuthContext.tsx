"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from '@/i18n/routing';

interface User {
    id: number;
    email: string;
    nombre: string;
    apellidos: string;
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

    // Función para validar el token contra /auth/me
    const checkUserSession = async () => {
        const token = Cookies.get('auth_token');

        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:8000/auth/me", {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`, // Cabecera requerida por tu backend
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                // Si el backend da 401 (token expirado tras 30 min), borramos todo
                logout();
            }
        } catch (error) {
            console.error("Error de conexión:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkUserSession();
    }, []);

    const loginGlobal = async (token: string) => {
        await checkUserSession(); // Sincroniza el estado del usuario tras el login
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
    if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
    return context;
};