import { ReactNode } from "react";
import LanguageSwitcher from "../dropdowns/LanguageSwitcher";
import AuthThemeToggle from "../buttons/AuthThemeToggle";

interface AuthLayoutProps {
    children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 relative"
            style={{
                background: "var(--auth-bg)",
                fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}
        >
            {/* --- Theme toggle & Language selector positioned top right --- */}
            <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
                <AuthThemeToggle />
                <LanguageSwitcher />
            </div>

            {/* Decorative circles background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full opacity-20"
                    style={{ background: "var(--auth-circle-1)" }}
                />
                <div
                    className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full opacity-15"
                    style={{ background: "var(--auth-circle-2)" }}
                />
                <div
                    className="absolute top-[30%] left-[10%] w-[200px] h-[200px] rounded-full opacity-10"
                    style={{ background: "var(--auth-circle-3)" }}
                />
            </div>

            {/* Card */}
            <div
                className="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-10"
                style={{
                    boxShadow: "var(--auth-card-shadow)",
                }}
            >
                {children}
            </div>
        </div>
    );
}
