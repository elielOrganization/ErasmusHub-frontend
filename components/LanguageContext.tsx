"use client"
import { createContext, useContext, useState, ReactNode } from "react";
import es from "../messages/es.json";
import en from "../messages/en.json";
import cs from "../messages/cs.json";

const dictionaries: Record<string, any> = { es, en, cs };

type LanguageContextType = {
    locale: string;
    setLocale: (lang: string) => void;
    t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Added the initialLocale prop
export function LanguageProvider({
    children,
    initialLocale = "es"
}: {
    children: ReactNode;
    initialLocale?: string;
}) {
    const [locale, setLocaleState] = useState(initialLocale);

    // This function changes state AND saves the cookie
    const setLocale = (newLocale: string) => {
        setLocaleState(newLocale);
        // Save cookie for 1 year (365 days * 24h * 60m * 60s = 31536000)
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    };

    const t = (path: string) => {
        const keys = path.split('.');
        let value = dictionaries[locale] || dictionaries["es"]; // Fallback to Spanish if language not found

        for (const key of keys) {
            if (value[key] === undefined) return path;
            value = value[key];
        }
        return value;
    };

    return (
        <LanguageContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
    return context;
}