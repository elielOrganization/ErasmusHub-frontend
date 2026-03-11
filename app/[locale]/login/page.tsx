"use client"
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import AuthLayout from "@/components/AuthLayout";
import InputField from "@/components/InputField";
import SubmitButton from "@/components/SubmitButton";
import Cookies from 'js-cookie';
import { useAuth } from '@/context/AuthContext';
import { usePWA } from '@/hooks/usePWA';
import { API_URL } from '@/lib/api';

export default function Login() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { loginGlobal, user, loading: authLoading } = useAuth();
  
  const { isInstallable, installApp } = usePWA();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !authLoading) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const validateForm = () => {
    const { email, password } = formData;
    if (!email.trim() || !password.trim()) {
      setError(t('errors.emptyFields'));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('errors.invalidEmail'));
      return false;
    }
    if (password.length < 8) {
      setError(t('errors.passwordTooShort'));
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
              if (response.status === 401) throw new Error(t('errors.badCredentials'));
              throw new Error(data.detail || t('errors.generic'));
          }

          const expireTime = 30 / (24 * 60); 
          Cookies.set('auth_token', data.access_token, { expires: expireTime, secure: true, sameSite: 'strict' });
          
          await loginGlobal(data.access_token);
          router.push("/dashboard");

      } catch (err: any) {
          setError(err.message);
      } finally {
          setLoading(false);
      }
  };

  const emailIcon = (color: string) => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );

  const lockIcon = (color: string) => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );

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
          <SubmitButton disabled={loading || authLoading}>
            {loading ? t('loading') : t('signIn')}
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

      {isInstallable && (
        <div className="mt-8 flex justify-center border-t border-gray-100 pt-6">
          <button
            type="button"
            onClick={installApp}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Instalar App
          </button>
        </div>
      )}

    </AuthLayout>
  );
}