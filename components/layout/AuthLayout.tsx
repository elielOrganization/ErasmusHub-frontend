import { ReactNode } from "react";
import Image from "next/image";
import LanguageSwitcher from "../dropdowns/LanguageSwitcher";
import AuthThemeToggle from "../buttons/AuthThemeToggle";

interface AuthLayoutProps {
    children: ReactNode;
    exiting?: boolean;
}

export default function AuthLayout({ children, exiting }: AuthLayoutProps) {
    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 relative"
            style={{
                background: "var(--auth-bg)",
                fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}
        >
            {/* Theme toggle & Language selector */}
            <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
                <AuthThemeToggle />
                <LanguageSwitcher />
            </div>

            {/* Decorative circles */}
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

            {/* Logo above card */}
            <div className={`relative z-10 flex flex-col items-center w-full max-w-md ${exiting ? "auth-card-exit" : "auth-card-enter"}`}>
                <div className="flex flex-col items-center gap-3 mb-6">
                    <Image
                        src="/logoVector.svg"
                        alt="ErasmusHub"
                        width={80}
                        height={80}
                        className="dark:hidden"
                    />
                    <Image
                        src="/logoVectorDark.svg"
                        alt="ErasmusHub"
                        width={80}
                        height={80}
                        className="hidden dark:block"
                    />
                    <span className="text-lg font-bold text-gray-800 dark:text-gray-100 tracking-tight">
                        ErasmusHub
                    </span>
                </div>

                {/* Card */}
                <div
                    className="w-full bg-white dark:bg-gray-900 rounded-3xl p-8 sm:p-10"
                    style={{ boxShadow: "var(--auth-card-shadow)" }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}
