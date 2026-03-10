"use client"
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import AuthLayout from "@/components/AuthLayout";
import InputField from "@/components/InputField";
import SubmitButton from "@/components/SubmitButton";

export default function Login() {
  const t = useTranslations('auth');
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- ICONOS (Siguiendo tu formato dinámico) ---
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      try {
          // Para GET, pasamos los datos en la URL: ?email=...
          const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/?email=${formData.email}`;

          const response = await fetch(url, {
              method: 'GET', // <--- OBLIGATORIO: Debe ser GET
              headers: {
                  'Content-Type': 'application/json',
              },
              // ¡IMPORTANTE! No pongas body: JSON.stringify(...) aquí.
          });

          if (!response.ok) {
              if (response.status === 405) {
                  throw new Error("El servidor no acepta GET en esta ruta. Revisa el decorador en Python.");
              }
              throw new Error("Error al obtener datos");
          }

          const data = await response.json(); // Esto será el array que viste en Swagger
          
          // Como recibimos una lista, buscamos al usuario
          const userFound = data.find((u: any) => u.email === formData.email);

          if (userFound) {
              router.push("/dashboard");
          } else {
              setError("Usuario no encontrado");
          }

      } catch (err: any) {
          setError(err.message);
      } finally {
          setLoading(false);
      }
  };

  return (
    <AuthLayout>

      <div className="h-px bg-blue-50 mb-8" />

      {error && (
        <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-2 animate-shake">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
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

        <div className="pt-2">
          <SubmitButton disabled={loading}>
            {loading ? "Entrando..." : t('signIn')}
          </SubmitButton>
        </div>
      </form>

      <p className="text-center text-gray-400 text-xs mt-8">
        {t('dontHaveAccount')}{" "}
        <span
          onClick={() => router.push("/register")}
          className="text-blue-600 font-bold hover:underline cursor-pointer transition-all"
        >
          {t('register')}
        </span>
      </p>
    </AuthLayout>
  );
}