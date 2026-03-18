"use client"
import { useSidebar } from "@/context/SidebarContext";

export default function MainContentWrapper({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();

    return (
        <main className={`transition-all duration-300 pt-12 min-h-screen pl-0 ${isCollapsed ? 'md:pl-16' : 'md:pl-64'}`}>
            <div className="p-8">
                {children}
            </div>
        </main>
    );
}
