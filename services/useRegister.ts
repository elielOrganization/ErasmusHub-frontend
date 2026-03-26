import { useState, useMemo } from 'react';
import { useRouter } from '@/i18n/routing';
import { API_URL } from '@/lib/api';

/**
 * Parses a Czech/Slovak Rodné číslo and extracts birth date + minor status.
 * Format: YYMMDD/XXXX  (slash required in UI, always 10 digits after stripping)
 * - Women: month + 50 (or +70 since 2004)
 * - Men: month as-is (or +20 since 2004)
 * - Must be exactly 10 digits (cleaned) and divisible by 11
 */
function parseRodneCislo(rc: string, gender: 'male' | 'female' | '') {
    const cleaned = rc.replace(/\//g, '').replace(/\s/g, '');

    if (!/^\d{10}$/.test(cleaned)) {
        return { error: 'invalidRcFormat' };
    }

    const yy = parseInt(cleaned.substring(0, 2), 10);
    let mm = parseInt(cleaned.substring(2, 4), 10);
    const dd = parseInt(cleaned.substring(4, 6), 10);

    // Modulo 11 check (always required now that 4-digit suffix is mandatory)
    const num = parseInt(cleaned, 10);
    if (num % 11 !== 0) {
        return { error: 'invalidRcChecksum' };
    }

    // Determine gender from month encoding
    let rcGender: 'male' | 'female';
    if (mm > 70) {
        rcGender = 'female';
        mm -= 70;
    } else if (mm > 50) {
        rcGender = 'female';
        mm -= 50;
    } else if (mm > 20) {
        rcGender = 'male';
        mm -= 20;
    } else {
        rcGender = 'male';
    }

    // Validate gender matches selected gender
    if (gender && rcGender !== gender) {
        return { error: 'rcGenderMismatch' };
    }

    // Validate month
    if (mm < 1 || mm > 12) {
        return { error: 'invalidRcFormat' };
    }

    // Determine full year
    // yy >= 54 → 1954–1999 | yy < 54 → 2000–2053
    // Same rule applies for both 9-digit (old) and 10-digit formats so that
    // e.g. yy=06 always resolves to 2006 instead of 1906.
    const year = yy >= 54 ? 1900 + yy : 2000 + yy;

    // Validate day
    const maxDay = new Date(year, mm, 0).getDate();
    if (dd < 1 || dd > maxDay) {
        return { error: 'invalidRcFormat' };
    }

    const birthDate = `${year}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;

    // Calculate age
    const today = new Date();
    const birth = new Date(year, mm - 1, dd);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return { birthDate, isMinor: age < 18, gender: rcGender };
}

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

    // Auto-compute birth date and is_minor from Rodné číslo + gender
    const rcParsed = useMemo(() => {
        if (!formData.rodne_cislo || !formData.gender) return null;
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
