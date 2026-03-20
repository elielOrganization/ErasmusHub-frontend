"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useRoleTheme } from "@/hooks/useRoleTheme";
import { translateRole } from "@/lib/translateRole";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function UserProfilePage() {
    const t = useTranslations("userProfile");
    const tRoles = useTranslations("roles");
    const { user, loading } = useAuth();
    const theme = useRoleTheme();

    if (loading) return <LoadingSpinner />;

    if (!user) return null;

    const initials = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return t("notProvided");
        try {
            return new Date(dateStr).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
            {/* Header card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className={`h-32 bg-gradient-to-r ${theme.gradientFrom} ${theme.gradientTo}`} />
                <div className="px-6 sm:px-8 pb-8">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-14">
                        <div
                            className="w-28 h-28 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white shrink-0"
                            style={{
                                background: `linear-gradient(135deg, ${theme.avatarFrom} 0%, ${theme.avatarTo} 100%)`,
                            }}
                        >
                            {initials}
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between mt-4 gap-3">
                        <div className="text-center sm:text-left">
                            <h1 className="text-2xl font-bold text-gray-800">
                                {user.first_name} {user.last_name}
                            </h1>
                            <p className="text-gray-500 mt-0.5">{user.email}</p>
                        </div>
                        <span
                            className={`px-3 py-1.5 rounded-full text-sm font-semibold ${theme.pillBg} ${theme.pillText}`}
                        >
                            {user.role?.name ? translateRole(user.role.name, tRoles) : t("notProvided")}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">{t("personalInfo")}</h2>
                    </div>
                    <div className="space-y-4">
                        <InfoRow label={t("firstName")} value={user.first_name} />
                        <InfoRow label={t("lastName")} value={user.last_name} />
                        <InfoRow label={t("rodneCislo")} value={user.rodne_cislo} masked />
                        <InfoRow label={t("birthDate")} value={formatDate(user.birth_date)} />
                        <InfoRow
                            label={t("isMinor")}
                            value={user.is_minor ? t("yes") : t("no")}
                            badge={user.is_minor ? "amber" : "green"}
                        />
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">{t("contactInfo")}</h2>
                    </div>
                    <div className="space-y-4">
                        <InfoRow label={t("email")} value={user.email} />
                        <InfoRow label={t("phone")} value={user.phone} />
                        <InfoRow label={t("address")} value={user.address} />
                    </div>
                </div>
            </div>

            {/* Account Information */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">{t("accountInfo")}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow label={t("role")} value={user.role?.name ? translateRole(user.role.name, tRoles) : undefined} badge={
                        user.role?.name?.toLowerCase().includes("admin") ? "purple" : "green"
                    } />
                    <InfoRow label={t("memberSince")} value={formatDate(user.created_at)} />
                </div>
            </div>
        </div>
    );
}

function InfoRow({
    label,
    value,
    masked,
    badge,
}: {
    label: string;
    value?: string | null;
    masked?: boolean;
    badge?: "green" | "amber" | "purple";
}) {
    const t = useTranslations("userProfile");
    const displayValue = value || t("notProvided");
    const maskedValue = masked && value ? value.slice(0, 4) + "••••••" : displayValue;

    if (badge) {
        const colors = {
            green: "bg-emerald-100 text-emerald-700",
            amber: "bg-amber-100 text-amber-700",
            purple: "bg-purple-100 text-purple-700",
        };
        return (
            <div>
                <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${colors[badge]}`}>
                    {displayValue}
                </span>
            </div>
        );
    }

    return (
        <div>
            <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
            <p className="text-sm font-medium text-gray-700">{maskedValue}</p>
        </div>
    );
}
