"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useRolePreview } from "@/context/RolePreviewContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AccessDenied from "@/components/ui/AccessDenied";
import { ReactNode } from "react";

export type AllowedRole = "admin" | "teacher" | "student" | "lector";

interface RoleGuardProps {
    allowed: AllowedRole[];
    children: ReactNode;
}

function getRole(roleName: string): AllowedRole {
    const r = roleName.toLowerCase();
    if (r.includes("admin")) return "admin";
    if (
        r.includes("teacher") ||
        r.includes("profesor") ||
        r.includes("professor") ||
        r.includes("coordinator") ||
        r.includes("coordinador") ||
        r.includes("tutor")
    ) return "teacher";
    if (r.includes("student")) return "student";
    return "lector";
}

export default function RoleGuard({ allowed, children }: RoleGuardProps) {
    const t = useTranslations("accessDenied");
    const { user, loading } = useAuth();
    const { effectiveRoleName } = useRolePreview();

    if (loading) return <LoadingSpinner />;

    const roleName = effectiveRoleName || user?.role?.name || "";
    const role = getRole(roleName);

    if (!allowed.includes(role)) {
        return (
            <AccessDenied
                title={t("title")}
                message={t("message")}
                backLabel={t("backLabel")}
                backHref="/dashboard"
            />
        );
    }

    return <>{children}</>;
}
