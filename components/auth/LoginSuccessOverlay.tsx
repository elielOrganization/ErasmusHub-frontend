"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Props {
    name?: string;
    onDone: () => void;
}

export default function LoginSuccessOverlay({ name, onDone }: Props) {
    const [phase, setPhase] = useState<"in" | "show" | "out">("in");

    useEffect(() => {
        // burst in → show content → fade out → done
        const t1 = setTimeout(() => setPhase("show"), 550);
        const t2 = setTimeout(() => setPhase("out"),  1800);
        const t3 = setTimeout(() => onDone(),          2200);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [onDone]);

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center ${
                phase === "out" ? "login-exit" : ""
            }`}
        >
            {/* Gradient background — bursts in */}
            <div
                className="absolute inset-0 login-burst"
                style={{
                    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%)",
                }}
            />

            {/* Shimmer ring */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.2) 0%, transparent 40%)",
                }}
            />

            {/* Content */}
            {phase !== "in" && (
                <div className="relative z-10 flex flex-col items-center gap-5 text-white px-8">

                    {/* Checkmark circle */}
                    <div className="login-pop">
                        <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
                            <circle
                                cx="44" cy="44" r="40"
                                stroke="rgba(255,255,255,0.3)"
                                strokeWidth="3"
                            />
                            <circle
                                cx="44" cy="44" r="40"
                                stroke="white"
                                strokeWidth="3"
                                strokeLinecap="round"
                                fill="none"
                                strokeDasharray="251"
                                strokeDashoffset="251"
                                className="draw-circle"
                                style={{ animationDelay: "0.05s" }}
                            />
                            <path
                                d="M28 44 L40 56 L62 34"
                                stroke="white"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                                strokeDasharray="48"
                                strokeDashoffset="48"
                                className="draw-check"
                                style={{ animationDelay: "0.3s" }}
                            />
                        </svg>
                    </div>

                    {/* Text */}
                    <div
                        className="login-text flex flex-col items-center gap-1"
                        style={{ animationDelay: "0.25s" }}
                    >
                        <p className="text-white/70 text-sm font-medium tracking-wide uppercase">
                            Bienvenido{name ? "," : ""}
                        </p>
                        {name && (
                            <p className="text-white text-2xl font-bold tracking-tight">
                                {name}
                            </p>
                        )}
                    </div>

                    {/* Logo small */}
                    <div
                        className="login-text mt-2"
                        style={{ animationDelay: "0.4s" }}
                    >
                        <Image
                            src="/logoVectorDark.svg"
                            alt="ErasmusHub"
                            width={36}
                            height={36}
                            className="opacity-60"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
