import { ReactNode } from "react";
import LanguageSelector from "./LanguageSelector";

interface AuthLayoutProps {
    children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 relative"
            style={{
                background: "linear-gradient(135deg, #e8f4fd 0%, #f0f7ff 40%, #dbeeff 100%)",
                fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}
        >
            {/* --- NUEVO: Selector de idioma posicionado arriba a la derecha --- */}
            <div className="absolute top-6 right-6 z-50">
                <LanguageSelector />
            </div>

            {/* Decorative circles background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full opacity-20"
                    style={{ background: "radial-gradient(circle, #2563eb, transparent)" }}
                />
                <div
                    className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full opacity-15"
                    style={{ background: "radial-gradient(circle, #1d4ed8, transparent)" }}
                />
                <div
                    className="absolute top-[30%] left-[10%] w-[200px] h-[200px] rounded-full opacity-10"
                    style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }}
                />
            </div>

            {/* Card */}
            <div
                className="relative z-10 w-full max-w-md bg-white rounded-3xl p-10"
                style={{
                    boxShadow: "0 20px 60px rgba(37, 99, 235, 0.12), 0 4px 20px rgba(0,0,0,0.06)",
                }}
            >
                {children}
            </div>
        </div>
    );
}