import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { API_URL } from '@/lib/api';

export const useRegister = () => {
    const router = useRouter();

    // Estado para controlar el paso actual del formulario
    const [step, setStep] = useState(1);
    const totalSteps = 3;

    // Estado con los nuevos campos solicitados
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        dni: '',
        birthdate: '',
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

    // Funciones para navegar entre los recuadros
    const nextStep = () => {
        // Aquí podrías agregar validaciones por paso antes de avanzar
        if (step < totalSteps) setStep(step + 1);
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/users/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dni: formData.dni,
                    email: formData.email,
                    password: formData.password,
                    name: formData.name,
                    surname: formData.surname,
                    birthdate: formData.birthdate,
                    address: formData.address
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Error en el registro");
            }

            alert("¡Cuenta creada con éxito!");
            router.push("/");

        } catch (err: any) {
            setError(err.message || "Error de conexión con el servidor");
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