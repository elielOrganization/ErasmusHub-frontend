"use client"
import { useTranslations } from 'next-intl';
import AuthLayout from "@/components/AuthLayout";
import InputField from "@/components/InputField";
import SubmitButton from "@/components/SubmitButton";
import { useLogin } from '@/services/useLogin';

export default function Login() {
  const t = useTranslations('auth');
  const td = useTranslations('dashboard');

  const {
    formData, loading, authLoading, error, isInstallable,
    handleChange, handleSubmit, installApp, router
  } = useLogin({
    emptyFields: t('errors.emptyFields'),
    passwordTooShort: t('errors.passwordTooShort'),
    badCredentials: t('errors.badCredentials'),
    generic: t('errors.generic'),
  });

  const idIcon = (color: string) => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="10" rx="2" />
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
          label={t('dniLabel')}
          type="text"
          name="rodne_cislo"
          value={formData.rodne_cislo}
          onChange={handleChange}
          placeholder={t('dniPlaceholder')}
          icon={idIcon}
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
            {td('installApp')}
          </button>
        </div>
      )}

    </AuthLayout>
  );
}
