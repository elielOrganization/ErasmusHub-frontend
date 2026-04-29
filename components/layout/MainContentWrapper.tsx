"use client"
import { useSidebar } from "@/context/SidebarContext";
import SessionExpiredOverlay from "@/components/ui/SessionExpiredOverlay";

export default function MainContentWrapper({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();

    return (
        <>
            <main className={`transition-all duration-300 pt-12 min-h-screen pl-0 ${isCollapsed ? 'md:pl-16' : 'md:pl-64'}`}>
                <div className="p-4 sm:p-6 lg:p-8 dark:text-gray-100">
                    {children}
                </div>
            </main>
            <SessionExpiredOverlay />
        </>
    );
}
