"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import AuthLayout from "@/components/layout/AuthLayout";
import FormInput from "@/components/form/FormInput";
import { useLogin } from "@/services/useLogin";

export default function Login() {
    const t  = useTranslations("auth");
    const td = useTranslations("dashboard");

    const [success, setSuccess]   = useState(false);
    const [exiting, setExiting]   = useState(false);

    const onBeforeNavigate = useCallback(() =>
        new Promise<void>(resolve => {
            // 1. Button turns green
            setSuccess(true);
            // 2. Card exits upward after a beat
            setTimeout(() => setExiting(true), 500);
            // 3. Navigate once exit animation finishes
            setTimeout(resolve, 950);
        }),
    []);

    const {
        formData, loading, authLoading, error, isInstallable,
        handleChange, handleSubmit, installApp, router,
    } = useLogin({
        translations: {
            emptyFields:      t("errors.emptyFields"),
            passwordTooShort: t("errors.passwordTooShort"),
            badCredentials:   t("errors.badCredentials"),
            generic:          t("errors.generic"),
        },
        onBeforeNavigate,
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
        <AuthLayout exiting={exiting}>
            {error && (
                <div className="mb-6 p-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800 flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <FormInput
                    label={t("dniLabel")}
                    type="text"
                    name="rodne_cislo"
                    value={formData.rodne_cislo}
                    onChange={handleChange}
                    placeholder={t("dniPlaceholder")}
                    icon={idIcon}
                    required
                />
                <FormInput
                    label={t("passwordLabel")}
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={t("passwordPlaceholder")}
                    icon={lockIcon}
                    required
                />

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading || authLoading || success}
                        className={`w-full py-3 rounded-2xl text-sm font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
                            success
                                ? "bg-emerald-500"
                                : "bg-blue-600 hover:bg-blue-700 active:scale-[.98]"
                        } disabled:opacity-80`}
                    >
                        {success ? (
                            <span className="flex items-center gap-2 check-pop">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                                ¡Bienvenido!
                            </span>
                        ) : loading || authLoading ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                                </svg>
                                {t("loading")}
                            </>
                        ) : t("signIn")}
                    </button>
                </div>
            </form>

            <p className="text-center text-gray-400 dark:text-gray-500 text-xs mt-8">
                {t("dontHaveAccount")}{" "}
                <span
                    onClick={() => router.push("/register")}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer transition-all"
                >
                    {t("register")}
                </span>
            </p>

            {isInstallable && (
                <div className="mt-8 flex justify-center border-t border-gray-100 dark:border-gray-700 pt-6">
                    <button
                        type="button"
                        onClick={installApp}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-all shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {td("installApp")}
                    </button>
                </div>
            )}
        </AuthLayout>
    );
}
