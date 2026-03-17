import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { SidebarProvider } from "@/context/SidebarContext";
import DashboardContent from "@/components/DashboardContent";
import { SERVER_API_URL } from '@/lib/api';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    
    // 1. Get credentials and UI state
    const token = cookieStore.get('auth_token')?.value;
    const initialCollapsed = cookieStore.get('sidebar_collapsed')?.value === 'true';

    // 2. Immediate block if no token exists
    if (!token) {
        redirect('/login');
    }

    try {
        // 3. Validate token and fetch user identity/role
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

        // 4. Role Assignment & Authorization Check
        // Authenticate returning identity + roles even when the backend shape changes.
        const roleSlug = typeof userData.role === 'string'
            ? userData.role
            : userData.role?.slug ?? userData.role?.name;

        if (!roleSlug || !['admin', 'administrator'].includes(roleSlug.toString().toLowerCase())) {
            redirect('/dashboard/unauthorized');
        }

    } catch (error) {
        console.error("Server-side auth validation failed:", error);
        redirect('/login');
    }

    // 5. Render protected admin layout
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