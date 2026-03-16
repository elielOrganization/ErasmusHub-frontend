import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { API_URL } from '@/lib/api';

export const useRegister = (translations?: { passwordsMatch?: string; genericError?: string; success?: string }) => {
    const router = useRouter();

    // State to control the current form step
    const [step, setStep] = useState(1);
    const totalSteps = 3;

    // State with the new requested fields
    const [formData, setFormData] = useState({
        first_name: '',    // Changed from name
        last_name: '',     // Changed from surname
        rodne_cislo: '',   // Changed from dni
        birth_date: '',    // Changed from birthdate
        email: '',
        address: '',
        password: '',
        confirmPassword: ''
});

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
                    rodne_cislo: formData.rodne_cislo,
                    email: formData.email,
                    password: formData.password,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    fecha_nacimiento: formData.birth_date || null,
                    direccion: formData.address || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || translations?.genericError || "Registration error");
            }

            alert(translations?.success || "Account created successfully!");
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