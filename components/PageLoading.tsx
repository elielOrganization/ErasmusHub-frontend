"use client"
import { useTranslations } from "next-intl";

export default function PageLoading({ fullScreen = false }: { fullScreen?: boolean }) {
    const t = useTranslations("dashboard");

    return (
        <div className={`flex flex-col items-center justify-center gap-4 ${fullScreen ? 'h-screen w-screen bg-white' : 'min-h-[60vh]'}`}>
            <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-gray-400 text-sm animate-pulse">{t("loadingApp")}</p>
        </div>
    );
}
