import { useTranslations } from "next-intl";

export default function DashboardHome() {
    const t = useTranslations("dashboard");

    return (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
                ¡Bienvenido a ErasmusHub!
            </h2>
            <p className="text-gray-500">
                Has iniciado sesión correctamente. Desde aquí podrás gestionar tus {t('students').toLowerCase()} y {t('documents').toLowerCase()}.
            </p>
        </div>
    );
}