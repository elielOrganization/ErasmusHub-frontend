"use client"
import React from "react";

// Allows the component to accept all standard HTML button properties
interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    disabled?: boolean;
}

export default function SubmitButton({ children, disabled, className, ...props }: SubmitButtonProps) {
    return (
        <button
            {...props} // Passes onClick, onBlur, etc. automatically
            type={props.type || "submit"}
            disabled={disabled}
            className={`relative w-full py-4 rounded-xl font-semibold text-white text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2
                ${disabled 
                    ? 'cursor-not-allowed opacity-70 scale-[0.98]' 
                    : 'hover:opacity-90 active:scale-[0.95]'
                } ${className || ""}`}
            style={{
                background: disabled 
                    ? "#94a3b8" 
                    : "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                boxShadow: disabled ? "none" : "0 4px 20px rgba(37,99,235,0.35)",
            }}
        >
            {/* If disabled (loading), show the spinner */}
            {disabled ? (
                <div className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading...</span>
                </div>
            ) : (
                children
            )}
        </button>
    );
}