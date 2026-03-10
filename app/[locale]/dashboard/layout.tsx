import { cookies } from 'next/headers';
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { SidebarProvider } from "@/context/SidebarContext"; // <--- Mira esta ruta
import DashboardContent from "../../../components/DashboardContent";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const initialCollapsed = cookieStore.get('sidebar_collapsed')?.value === 'true';

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