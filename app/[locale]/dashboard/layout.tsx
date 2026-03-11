import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { SidebarProvider } from "@/context/SidebarContext";
import DashboardContent from "../../../components/DashboardContent";
import { SERVER_API_URL } from '@/lib/api';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    
    // 1. Intentamos obtener el token de las cookies
    const token = cookieStore.get('auth_token')?.value;
    const initialCollapsed = cookieStore.get('sidebar_collapsed')?.value === 'true';

    // 2. Si no hay token, fuera. Ni siquiera cargamos el resto.
    if (!token) {
        redirect('/login');
    }

    // 3. (Opcional pero recomendado) Validar el token en el servidor
    // Esto evita que alguien con un token falso o expirado vea el dashboard
    try {
        const response = await fetch(`${SERVER_API_URL}/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            // Cache: 'no-store' asegura que siempre verifique contra el servidor
            cache: 'no-store' 
        });

        if (!response.ok) {
            // Si el backend dice que el token no vale (401), redirigimos
            redirect('/login');
        }
    } catch (error) {
        // Si el servidor de Python está caído, podrías redirigir o mostrar un error
        console.error("Error validando token en el servidor:", error);
        redirect('/login');
    }

    // 4. Si todo está OK, renderizamos el layout normalmente
    return (
        <SidebarProvider initialCollapsed={initialCollapsed}>
            <div className="min-h-screen bg-gray-50">
                <Header />
                <Sidebar />
                <DashboardContent>
                    {children}
                </DashboardContent>
            </div>
        </SidebarProvider>
    );
}