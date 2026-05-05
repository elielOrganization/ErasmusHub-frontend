"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
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

function mapRole(roleName: unknown): AllowedRole {
    if (typeof roleName !== "string") return "lector";
    const r = roleName.toLowerCase().trim();
    if (r.includes("admin")) return "admin";
    if (
        r.includes("teacher") ||
        r.includes("profesor") ||
        r.includes("professor") ||
        r.includes("coordinator") ||
        r.includes("coordinador") ||
        r.includes("tutor")
    ) return "teacher";
    if (
        r.includes("student") ||
        r.includes("alumno") ||
        r.includes("estudiante")
    ) return "student";
    return "lector";
}

/** Check whether role is in the allowed list without calling .includes() on the prop */
function roleIsAllowed(allowed: unknown, role: AllowedRole): boolean {
    if (!Array.isArray(allowed)) return false;
    for (let i = 0; i < allowed.length; i++) {
        if (allowed[i] === role) return true;
    }
    return false;
}

export default function RoleGuard(props: RoleGuardProps) {
    const { allowed, children } = props;
    const t = useTranslations("accessDenied");
    const { user, loading } = useAuth();
    const { effectiveRoleName } = useRolePreview();
    const router = useRouter();
    const locale = useLocale();

    // No session → redirect to login instead of showing "access denied"
    useEffect(() => {
        if (!loading && !user) {
            router.replace(`/${locale}/login`);
        }
    }, [loading, user, router, locale]);

    if (loading) return <LoadingSpinner />;
    if (!user)   return <LoadingSpinner />;

    const roleName = effectiveRoleName || user.role?.name || "";
    const role = mapRole(roleName);

    if (!roleIsAllowed(allowed, role)) {
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
