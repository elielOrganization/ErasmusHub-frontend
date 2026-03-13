"use client"
import { useState, ReactNode, ChangeEvent } from "react";

interface InputFieldProps {
    label: string;
    // AÑADIDO: "date" a los tipos permitidos
    type: "text" | "email" | "password" | "date";
    placeholder: string;
    icon: (color: string) => ReactNode;
    name?: string;
    value?: string;
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
}

export default function InputField({ 
    label, 
    type, 
    placeholder, 
    icon, 
    name, 
    value, 
    onChange, 
    required 
}: InputFieldProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isPasswordField = type === "password";
    const inputType = isPasswordField && showPassword ? "text" : type;

    // Color dinámico para el icono basado en el foco
    const strokeColor = isFocused ? "#2563eb" : "#93c5fd";

    return (
        <div>
            <label className="block text-gray-600 text-xs font-semibold mb-2 tracking-wide uppercase">
                {label}
            </label>
            <div
                className="flex items-center gap-3 rounded-xl px-4 py-3.5 border-2 transition-all duration-200"
                style={{
                    borderColor: isFocused ? "#2563eb" : "#e8f0fe",
                    background: isFocused ? "#f0f7ff" : "#f8faff",
                    boxShadow: isFocused ? "0 0 0 4px rgba(37,99,235,0.08)" : "none",
                }}
            >
                {/* Icono dinámico inyectando el color */}
                <svg width="16" height="16" fill="none" stroke={strokeColor} strokeWidth="2" viewBox="0 0 24 24">
                    {icon(strokeColor)}
                </svg>

                <input
                    name={name}
                    value={value}
                    onChange={onChange}
                    required={required}
                    type={inputType}
                    placeholder={placeholder}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="flex-1 bg-transparent text-gray-800 text-sm outline-none placeholder-blue-200 min-w-0"
                />

                {/* Toggle Contraseña (Ojo) */}
                {isPasswordField && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="transition-colors hover:opacity-70"
                        style={{ color: showPassword ? "#2563eb" : "#93c5fd" }}
                    >
                        {showPassword ? (
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />
                            </svg>
                        ) : (
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}