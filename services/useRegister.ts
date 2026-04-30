import { useState, useMemo, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { API_URL } from '@/lib/api';
import { parseRodneCislo } from '@/lib/validateRodneCislo';

export const useRegister = (t: (key: string) => string) => {
    const router = useRouter();

    const [step, setStep] = useState(1);
    const totalSteps = 3;

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        gender: '' as '' | 'male' | 'female',
        rodne_cislo: '',
        email: '',
        address: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Auto-select gender from Rodné číslo when it parses successfully
    useEffect(() => {
        const result = parseRodneCislo(formData.rodne_cislo, '');
        if (!('error' in result) && result.gender) {
            setFormData(prev => ({ ...prev, gender: result.gender as 'male' | 'female' }));
        }
    }, [formData.rodne_cislo]);

    // Auto-compute birth date and is_minor from Rodné číslo (gender optional for display)
    const rcParsed = useMemo(() => {
        if (!formData.rodne_cislo) return null;
        const result = parseRodneCislo(formData.rodne_cislo, formData.gender);
        if ('error' in result) return null;
        return result;
    }, [formData.rodne_cislo, formData.gender]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const type = e.target.type;
        const checked = 'checked' in e.target ? (e.target as HTMLInputElement).checked : false;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        // Clear field error on change
        if (errors[name]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    const validateStep = (stepNum: number): boolean => {
        const newErrors: Record<string, string> = {};

        if (stepNum === 1) {
            if (!formData.first_name.trim()) {
                newErrors.first_name = t('errors.firstNameRequired');
            }
            if (!formData.last_name.trim()) {
                newErrors.last_name = t('errors.lastNameRequired');
            }
            if (!formData.gender) {
                newErrors.gender = t('errors.genderRequired');
            }
            if (!formData.rodne_cislo.trim()) {
                newErrors.rodne_cislo = t('errors.rodneCisloRequired');
            } else {
                const result = parseRodneCislo(formData.rodne_cislo, formData.gender);
                if ('error' in result) {
                    newErrors.rodne_cislo = t(`errors.${result.error}`);
                }
            }
        }

        if (stepNum === 2) {
            if (!formData.email.trim()) {
                newErrors.email = t('errors.emailRequired');
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                newErrors.email = t('errors.invalidEmail');
            }
            if (!formData.address.trim()) {
                newErrors.address = t('errors.addressRequired');
            }
            if (!formData.phone.trim()) {
                newErrors.phone = t('errors.phoneRequired');
            } else if (!/^\+?\d[\d\s]{7,}$/.test(formData.phone.trim())) {
                newErrors.phone = t('errors.invalidPhone');
            }
        }

        if (stepNum === 3) {
            if (!formData.password) {
                newErrors.password = t('errors.passwordRequired');
            } else if (formData.password.length < 8) {
                newErrors.password = t('errors.passwordTooShort');
            }
            if (!formData.confirmPassword) {
                newErrors.confirmPassword = t('errors.confirmPasswordRequired');
            } else if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = t('errors.passwordsMatch');
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(step) && step < totalSteps) {
            setStep(step + 1);
        }
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep(step)) return;

        // Final parse for computed values
        const result = parseRodneCislo(formData.rodne_cislo, formData.gender);
        if ('error' in result) {
            setErrors({ rodne_cislo: t(`errors.${result.error}`) });
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            const response = await fetch(`${API_URL}/users/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    password: formData.password,
                    rodne_cislo: formData.rodne_cislo,
                    birth_date: result.birthDate,
                    is_minor: result.isMinor,
                    address: formData.address || null,
                    phone: formData.phone || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || t('errors.generic'));
            }

            router.push("/");

        } catch (err: any) {
            setErrors({ _form: err.message || t('errors.generic') });
        } finally {
            setLoading(false);
        }
    };

    return {
        step,
        totalSteps,
        formData,
        loading,
        errors,
        rcParsed,
        handleChange,
        nextStep,
        prevStep,
        handleSubmit,
        router
    };
};
