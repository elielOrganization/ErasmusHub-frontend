"use client"
import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/context/AuthContext';

export default function RootPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Solo actuamos cuando el AuthContext ha terminado de verificar la cookie
        if (!loading) {
            if (user) {
                // Si hay usuario válido, al Dashboard
                router.push('/dashboard');
            } else {
                // Si no hay token o es inválido, al Login
                router.push('/login');
            }
        }
    }, [user, loading, router]);

    // Retornamos una pantalla en blanco o un cargando mientras se decide el destino
    return (
        <div className="h-screen w-screen flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                {/* Spinner animado opcional */}
                <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-gray-400 text-sm animate-pulse">Cargando ErasmusHub...</p>
            </div>
        </div>
    );
}