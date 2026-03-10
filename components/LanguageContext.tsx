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

// Añadimos la prop initialLocale
export function LanguageProvider({
    children,
    initialLocale = "es"
}: {
    children: ReactNode;
    initialLocale?: string;
}) {
    const [locale, setLocaleState] = useState(initialLocale);

    // Esta función ahora cambia el estado Y guarda la cookie
    const setLocale = (newLocale: string) => {
        setLocaleState(newLocale);
        // Guardamos la cookie por 1 año (365 días * 24h * 60m * 60s = 31536000)
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    };

    const t = (path: string) => {
        const keys = path.split('.');
        let value = dictionaries[locale] || dictionaries["es"]; // Fallback a español si no encuentra el idioma

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
    if (!context) throw new Error("useLanguage debe usarse dentro de un LanguageProvider");
    return context;
}