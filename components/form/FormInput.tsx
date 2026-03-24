"use client"
import { useState, ReactNode, ChangeEvent } from "react";

interface InputFieldProps {
    label: string;
    type: "text" | "email" | "password" | "date";
    placeholder: string;
    icon: (color: string) => ReactNode;
    name?: string;
    value?: string;
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
    error?: string;
    readOnly?: boolean;
}

export default function FormInput({
    label,
    type,
    placeholder,
    icon,
    name,
    value,
    onChange,
    required,
    error,
    readOnly
}: InputFieldProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isPasswordField = type === "password";
    const inputType = isPasswordField && showPassword ? "text" : type;

    const hasError = !!error;
    const strokeColor = hasError ? "#dc2626" : isFocused ? "#2563eb" : "#93c5fd";

    const getBorderColor = () => {
        if (hasError) return "#dc2626";
        if (isFocused) return "#2563eb";
        return "var(--input-border)";
    };

    const getBackground = () => {
        if (hasError) return "var(--input-error-bg)";
        if (isFocused) return "var(--input-focus-bg)";
        return "var(--input-bg)";
    };

    const getBoxShadow = () => {
        if (hasError) return "var(--input-shadow-error)";
        if (isFocused) return "var(--input-shadow-focus)";
        return "none";
    };

    return (
        <div>
            <label className="block text-gray-600 dark:text-gray-400 text-xs font-semibold mb-2 tracking-wide uppercase">
                {label}
            </label>
            <div
                className="flex items-center gap-3 rounded-xl px-4 py-3.5 border-2 transition-all duration-200"
                style={{
                    borderColor: getBorderColor(),
                    background: getBackground(),
                    boxShadow: getBoxShadow(),
                }}
            >
                {/* Dynamic icon with injected color */}
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
                    readOnly={readOnly}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={`flex-1 bg-transparent text-gray-800 dark:text-gray-100 text-sm outline-none placeholder-blue-200 dark:placeholder-gray-600 min-w-0 ${readOnly ? 'cursor-default' : ''}`}
                />

                {/* Password toggle (Eye icon) */}
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
            {error && (
                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
}
