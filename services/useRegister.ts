import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { API_URL } from '@/lib/api';

export const useRegister = (translations?: { passwordsMatch?: string; genericError?: string; success?: string }) => {
    const router = useRouter();

    // State to control the current form step
    const [step, setStep] = useState(1);
    const totalSteps = 3;

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        rodne_cislo: '',
        birth_date: '',
        email: '',
        address: '',
        phone: '',
        is_minor: false,
        password: '',
        confirmPassword: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, type, checked, value } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    // Functions to navigate between form steps
    const nextStep = () => {
        // You could add per-step validations here before advancing
        if (step < totalSteps) setStep(step + 1);
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError(translations?.passwordsMatch || "Passwords do not match");
            return;
        }

        setLoading(true);

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
                    birth_date: formData.birth_date || null,
                    is_minor: formData.is_minor,
                    address: formData.address || null,
                    phone: formData.phone || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || translations?.genericError || "Registration error");
            }

            router.push("/");

        } catch (err: any) {
            setError(err.message || translations?.genericError || "Connection error");
        } finally {
            setLoading(false);
        }
    };

    return {
        step,
        totalSteps,
        formData,
        loading,
        error,
        handleChange,
        nextStep,
        prevStep,
        handleSubmit,
        router
    };
};