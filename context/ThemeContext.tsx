"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import Cookies from "js-cookie";

interface ThemeContextType {
    isDark: boolean;
    toggleTheme: () => void;
}

const THEME_COOKIE = "theme";
const COOKIE_OPTIONS: Cookies.CookieAttributes = { expires: 365, sameSite: "lax" };

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [isDark, setIsDark] = useState(() => {
        if (typeof window === "undefined") return false;
        return document.documentElement.classList.contains("dark");
    });

    // On mount: sync state with the class already applied by the inline script,
    // and persist cookie if it was missing (first visit using system preference)
    useEffect(() => {
        const stored = Cookies.get(THEME_COOKIE);
        const dark = document.documentElement.classList.contains("dark");
        setIsDark(dark);

        // Migrate from localStorage if cookie is missing (existing users)
        if (!stored) {
            const legacy = localStorage.getItem("theme");
            if (legacy) {
                Cookies.set(THEME_COOKIE, legacy, COOKIE_OPTIONS);
                localStorage.removeItem("theme");
                const useLegacy = legacy === "dark";
                document.documentElement.classList.toggle("dark", useLegacy);
                setIsDark(useLegacy);
            } else {
                Cookies.set(THEME_COOKIE, dark ? "dark" : "light", COOKIE_OPTIONS);
            }
        }
    }, []);

    const toggleTheme = () => {
        setIsDark((prev) => {
            const next = !prev;
            Cookies.set(THEME_COOKIE, next ? "dark" : "light", COOKIE_OPTIONS);
            document.documentElement.classList.toggle("dark", next);
            return next;
        });
    };

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
};
