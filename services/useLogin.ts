import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/context/AuthContext';
import { usePWA } from '@/hooks/usePWA';
import { API_URL } from '@/lib/api';
import Cookies from 'js-cookie';

interface LoginTranslations {
    emptyFields: string;
    passwordTooShort: string;
    badCredentials: string;
    generic: string;
}

interface LoginOptions {
    translations: LoginTranslations;
    onBeforeNavigate?: () => Promise<void>;
}

export const useLogin = (translationsOrOptions: LoginTranslations | LoginOptions) => {
    const translations = 'translations' in translationsOrOptions
        ? translationsOrOptions.translations
        : translationsOrOptions;
    const onBeforeNavigate = 'onBeforeNavigate' in translationsOrOptions
        ? translationsOrOptions.onBeforeNavigate
        : undefined;

    const router = useRouter();
    const { loginGlobal, user, loading: authLoading } = useAuth();
    const { isInstallable, installApp } = usePWA();

    const [formData, setFormData] = useState({ rodne_cislo: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigatingRef = useRef(false);

    useEffect(() => {
        if (user && !authLoading && !navigatingRef.current) {
            router.push("/dashboard");
        }
    }, [user, authLoading, router]);

    const validateForm = () => {
        const { rodne_cislo, password } = formData;
        if (!rodne_cislo.trim() || !password.trim()) {
            setError(translations.emptyFields);
            return false;
        }
        if (password.length < 8) {
            setError(translations.passwordTooShort);
            return false;
        }
        return true;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) throw new Error(translations.badCredentials);
                throw new Error(data.detail || translations.generic);
            }

            const expireTime = 30 / (24 * 60);
            Cookies.set('auth_token', data.access_token, { expires: expireTime, secure: true, sameSite: 'strict' });

            navigatingRef.current = true;
            await loginGlobal(data.access_token);
            if (onBeforeNavigate) await onBeforeNavigate();
            router.push("/dashboard");

        } catch (err: any) {
            navigatingRef.current = false;
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        loading,
        authLoading,
        error,
        isInstallable,
        handleChange,
        handleSubmit,
        installApp,
        router,
    };
};
