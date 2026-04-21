"use client"
import { useTranslations } from 'next-intl';
import AuthLayout from "@/components/layout/AuthLayout";
import FormInput from "@/components/form/FormInput";
import FormSubmitButton from "@/components/form/FormSubmitButton";
import { useRegister } from '@/services/useRegister';

export default function Register() {
    const t = useTranslations('auth');

    const {
        step, totalSteps, formData, loading, errors, rcParsed,
        handleChange, nextStep, prevStep, handleSubmit, router
    } = useRegister((key: string) => t(key as any));

    // Icons
    const userIcon = (color: string) => (
        <>
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeLinecap="round" />
            <circle cx="12" cy="7" r="4" stroke={color} strokeLinecap="round" />
        </>
    );
    const emailIcon = (color: string) => (
        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
    );
    const lockIcon = (color: string) => (
        <>
            <rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeLinecap="round" />
            <path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeLinecap="round" />
        </>
    );
    const checkIcon = (color: string) => (
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
    );
    const idIcon = (color: string) => (
        <rect x="3" y="7" width="18" height="10" rx="2" stroke={color} strokeWidth="2" fill="none" />
    );
    const calendarIcon = (color: string) => (
        <path d="M4 7h16M4 11h16M6 4v4M18 4v4M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
    );
    const mapIcon = (color: string) => (
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={color} strokeWidth="2" fill="none" />
    );
    const phoneIcon = (color: string) => (
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke={color} strokeWidth="2" fill="none" />
    );
    const genderIcon = (color: string) => (
        <>
            <circle cx="9" cy="9" r="4" stroke={color} strokeWidth="2" fill="none" />
            <path d="M16 3l5 0M21 3l0 5M21 3l-5.5 5.5" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M9 13l0 8M6 18l6 0" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
        </>
    );

    // Format displayed birth date
    const formatBirthDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    return (
        <AuthLayout>
            <div className="mb-6 text-center">
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
                    {t('createAccountTitle')}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {t('stepText', { current: step, total: totalSteps })}
                </p>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-4">
                    <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
                </div>
            </div>

            {errors._form && (
                <div className="mb-6 p-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800 flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors._form}
                </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>

                {/* STEP 1: Personal Data */}
                {step === 1 && (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="grid grid-cols-2 gap-4">
                            <FormInput
                                label={t('nameLabel')}
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                placeholder={t('namePlaceholder')}
                                icon={userIcon}
                                error={errors.first_name}
                                required
                            />
                            <FormInput
                                label={t('lastNameLabel')}
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                placeholder={t('lastNamePlaceholder')}
                                icon={userIcon}
                                error={errors.last_name}
                                required
                            />
                        </div>

                        <FormInput
                            label={t('dniLabel')}
                            type="text"
                            name="rodne_cislo"
                            value={formData.rodne_cislo}
                            onChange={handleChange}
                            placeholder={t('dniPlaceholder')}
                            icon={idIcon}
                            error={errors.rodne_cislo}
                            required
                        />

                        {/* Gender select — auto-filled from Rodné číslo */}
                        <div>
                            <label className="block text-gray-600 dark:text-gray-400 text-xs font-semibold mb-2 tracking-wide uppercase">
                                {t('genderLabel')}
                            </label>
                            <div
                                className="flex items-center gap-3 rounded-xl px-4 py-3.5 border-2 transition-all duration-200 opacity-60 cursor-not-allowed"
                                style={{
                                    borderColor: errors.gender ? "#dc2626" : "var(--input-border)",
                                    background: errors.gender ? "var(--input-error-bg)" : "var(--input-bg)",
                                }}
                            >
                                <svg width="16" height="16" fill="none" stroke={errors.gender ? "#dc2626" : "#93c5fd"} strokeWidth="2" viewBox="0 0 24 24">
                                    {genderIcon(errors.gender ? "#dc2626" : "#93c5fd")}
                                </svg>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    disabled
                                    className="flex-1 bg-transparent dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-sm outline-none min-w-0 appearance-none cursor-not-allowed"
                                >
                                    <option value="" className="bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500">{t('genderPlaceholder')}</option>
                                    <option value="male" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">{t('genderMale')}</option>
                                    <option value="female" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">{t('genderFemale')}</option>
                                </select>
                            </div>
                            {errors.gender && (
                                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {errors.gender}
                                </p>
                            )}
                        </div>

                        {/* Birth date - read-only, auto-filled from Rodné číslo */}
                        <FormInput
                            label={t('birthdateLabel')}
                            type="text"
                            name="birth_date"
                            value={rcParsed ? formatBirthDate(rcParsed.birthDate) : ''}
                            placeholder={t('birthdatePlaceholder')}
                            icon={calendarIcon}
                            readOnly
                        />

                        {rcParsed?.isMinor && (
                            <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2 inline-block border border-amber-200 dark:border-amber-800">
                                {t('isMinorInfo')}
                            </p>
                        )}
                    </div>
                )}

                {/* STEP 2: Contact Data */}
                {step === 2 && (
                    <div className="space-y-4 animate-fadeIn">
                        <FormInput
                            label={t('emailLabel')}
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder={t('emailPlaceholder')}
                            icon={emailIcon}
                            error={errors.email}
                            required
                        />
                        <FormInput
                            label={t('addressLabel')}
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder={t('addressPlaceholder')}
                            icon={mapIcon}
                            error={errors.address}
                            required
                        />
                        <FormInput
                            label={t('phoneLabel')}
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder={t('phonePlaceholder')}
                            icon={phoneIcon}
                            error={errors.phone}
                            required
                        />
                    </div>
                )}

                {/* STEP 3: Security */}
                {step === 3 && (
                    <div className="space-y-4 animate-fadeIn">
                        <FormInput
                            label={t('passwordLabel')}
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder={t('passwordPlaceholder')}
                            icon={lockIcon}
                            error={errors.password}
                            required
                        />
                        <FormInput
                            label={t('confirmPasswordLabel')}
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder={t('confirmPasswordPlaceholder')}
                            icon={checkIcon}
                            error={errors.confirmPassword}
                            required
                        />
                    </div>
                )}

                <div className="flex gap-4 pt-4">
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={prevStep}
                            className="w-full py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            {t('prevButton')}
                        </button>
                    )}

                    {step < totalSteps ? (
                        <button
                            type="button"
                            onClick={nextStep}
                            className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                        >
                            {t('nextButton')}
                        </button>
                    ) : (
                        <FormSubmitButton disabled={loading}>
                            {loading ? t('registering') : t('finishButton')}
                        </FormSubmitButton>
                    )}
                </div>
            </form>

            <p className="text-center text-gray-400 dark:text-gray-500 text-xs mt-8">
                {t('alreadyHaveAccount')}{" "}
                <span
                    onClick={() => router.push("/")}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer transition-all"
                >
                    {t('signIn')}
                </span>
            </p>
        </AuthLayout>
    );
}
