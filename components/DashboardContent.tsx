"use client"
import { useSidebar } from "@/context/SidebarContext";

export default function DashboardContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();

    return (
        <main className={`transition-all duration-300 pt-12 min-h-screen ${isCollapsed ? 'pl-20' : 'pl-64'}`}>
            <div className="p-8">
                {children}
            </div>
        </main>
    );
}