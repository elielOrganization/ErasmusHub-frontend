"use client"
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import AuthLayout from "@/components/AuthLayout";
import InputField from "@/components/InputField";
import SubmitButton from "@/components/SubmitButton";

export default function Register() {
    const t = useTranslations('auth');
    const router = useRouter();

    // 1. Estado del formulario (Coincide con lo que pide tu FastAPI)
    const [formData, setFormData] = useState({
        nombre: '',
        apellidos: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 2. Definición de Iconos (Reciben el color de InputField)
    const userIcon = (color: string) => (
        <>
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeLinecap="round" />
            <circle cx="12" cy="7" r="4" stroke={color} strokeLinecap="round" />
        </>
    );

    const emailIcon = (color: string) => (
        <path
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    );

    const lockIcon = (color: string) => (
        <>
            <rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeLinecap="round" />
            <path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeLinecap="round" />
        </>
    );

    const checkIcon = (color: string) => (
        <path
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    );

    // 3. Manejador de cambios
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 4. Envío al Backend (FastAPI)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        alert("¡El formulario se ha enviado!");
        setError(null);

        // 1. PRIMERO validamos
        if (formData.password !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden");
            return; // Aquí se corta y no llega al loading
        }

        // 2. SEGUNDO activamos el loading
        setLoading(true);
        console.log("Cargando activado..."); // Añade este log para ver si llega aquí

        try {
            const response = await fetch('http://127.0.0.1:8000/api/v1/users/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    nombre: formData.nombre,
                    apellidos: formData.apellidos,
                    password: formData.password
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Error en el registro");
            }

            // Éxito: Redirigimos al Login (la raíz /)
            router.push("/");

        } catch (err: any) {
            setError(err.message || "Error de conexión con el servidor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                    {t('createAccountTitle')}
                </h1>
            </div>

            <div className="h-px bg-blue-50 mb-8" />

            {error && (
                <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-2 gap-4">
                    <InputField
                        label={t('nameLabel')}
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        placeholder={t('namePlaceholder')}
                        icon={userIcon}
                        required
                    />
                    <InputField
                        label={t('lastNameLabel')}
                        type="text"
                        name="apellidos"
                        value={formData.apellidos}
                        onChange={handleChange}
                        placeholder={t('lastNamePlaceholder')}
                        icon={userIcon}
                        required
                    />
                </div>

                <InputField
                    label={t('emailLabel')}
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t('emailPlaceholder')}
                    icon={emailIcon}
                    required
                />

                <InputField
                    label={t('passwordLabel')}
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={t('passwordPlaceholder')}
                    icon={lockIcon}
                    required
                />

                <InputField
                    label={t('confirmPasswordLabel')}
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder={t('confirmPasswordPlaceholder')}
                    icon={checkIcon}
                    required
                />

                <div className="pt-2">
                    <SubmitButton disabled={loading}>
                        {loading ? "Registrando..." : t('register')}
                    </SubmitButton>
                </div>
            </form>

            <p className="text-center text-gray-400 text-xs mt-8">
                {t('alreadyHaveAccount')}{" "}
                <span
                    onClick={() => router.push("/")}
                    className="text-blue-600 font-bold hover:underline cursor-pointer transition-all"
                >
                    {t('signIn')}
                </span>
            </p>
        </AuthLayout>
    );
}