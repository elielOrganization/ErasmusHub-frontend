import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { SidebarProvider } from "@/context/SidebarContext";
import MainContentWrapper from "@/components/layout/MainContentWrapper";
import { SERVER_API_URL } from '@/lib/api';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    
    // 1. Try to get the token from cookies
    const token = cookieStore.get('auth_token')?.value;
    const initialCollapsed = cookieStore.get('sidebar_collapsed')?.value === 'true';

    // 2. If there's no token, redirect. Don't even load the rest.
    if (!token) {
        redirect('/login');
    }

    // 3. (Optional but recommended) Validate the token on the server
    // This prevents someone with a fake or expired token from seeing the dashboard
    try {
        const response = await fetch(`${SERVER_API_URL}/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            // cache: 'no-store' ensures it always validates against the server
            cache: 'no-store' 
        });

        if (!response.ok) {
            // If the backend says the token is invalid (401), redirect
            redirect('/login');
        }
    } catch (error) {
        // If the Python server is down, redirect or show an error
        console.error("Error validating token on the server:", error);
        redirect('/login');
    }

    // 4. If everything is OK, render the layout normally
    return (
        <SidebarProvider initialCollapsed={initialCollapsed}>
            <div className="min-h-screen bg-gray-50">
                <DashboardHeader />
                <DashboardSidebar />
                <MainContentWrapper>
                    {children}
                </MainContentWrapper>
            </div>
        </SidebarProvider>
    );
}