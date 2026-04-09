"use client"
import { useState, MouseEventHandler, ReactNode } from "react"; // <-- Añadido useState, MouseEventHandler y ReactNode
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useRolePreview } from "@/context/RolePreviewContext";
import { useApi } from "@/hooks/useApi";
import { Link } from "@/i18n/routing";
import { useRoleTheme } from "@/hooks/useRoleTheme";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import DashboardCalendar from "@/components/ui/DashboardCalendar";

type DashboardAction = {
    title: string;
    icon: ReactNode;
    color: string;
    href?: string;
    onClick?: MouseEventHandler<HTMLButtonElement>;
};

function useGreeting() {
    const t = useTranslations("dashboard");
    const hour = new Date().getHours();
    if (hour < 12) return t("greetingMorning");
    if (hour < 19) return t("greetingAfternoon");
    return t("greetingEvening");
}

export default function DashboardHome() {
    const t = useTranslations("dashboard");
    const { user, loading } = useAuth();
    const { effectiveRoleName } = useRolePreview();
    const greeting = useGreeting();
    const theme = useRoleTheme();



    // Use effective role name so admin previews work transparently
    const roleName = effectiveRoleName || user?.role?.name || "";
    const isStudent = roleName.includes("Student");
    const isAdmin = roleName.toLowerCase().includes("admin");
    const isTeacher = roleName.toLowerCase().includes("teacher") || roleName.toLowerCase().includes("profesor") || roleName.toLowerCase().includes("professor") || roleName.toLowerCase().includes("coordinator") || roleName.toLowerCase().includes("coordinador");
    const isLector = !isStudent && !isAdmin && !isTeacher;

    const { data: unreadData } = useApi<{ count: number }>("/notifications/me/unread-count");
    const unreadCount = unreadData?.count || 0;

    const studentActions: DashboardAction[] = [
        {
            title: t("myInternships"),
            href: "/dashboard/practicas",
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            ),
            color: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
        },
        {
            title: t("myTasks"),
            href: "/dashboard/tareas",
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            ),
            color: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
        },
        {
            title: t("myNotices"),
            href: "/dashboard/avisos",
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            ),
            color: "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
        },
        {
            title: t("requestExemption"),
            href: "/dashboard/exenciones",
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            ),
            color: "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400",
        },
    ];

    // Actions for admins: panel + students + documents
    const adminActions: DashboardAction[] = [
        {
            title: t("adminPanel"),
            href: "/dashboard/admin",
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            ),
            color: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400",
        },
        {
            title: t("manageStudents"),
            href: "/dashboard/students",
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            ),
            color: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
        },
        {
            title: t("manageDocuments"),
            href: "/dashboard/documents",
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            ),
            color: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
        },
    ];

    // Actions for teachers/coordinators: students + documents + revision
    const teacherActions: DashboardAction[] = [
        {
            title: t("manageStudents"),
            href: "/dashboard/students",
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            ),
            color: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
        },
        {
            title: t("manageDocuments"),
            href: "/dashboard/documents",
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            ),
            color: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
        },
        {
            title: t("revision"),
            href: "/dashboard/revision",
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            ),
            color: "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400",
        },
    ];

    // Actions for lectors (read-only): opportunities + scoring table
    const lectorActions: DashboardAction[] = [
        {
            title: t("opportunities"),
            href: "/dashboard/opportunities",
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            ),
            color: "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
        },
        {
            title: t("calificacion"),
            href: "/dashboard/calificacion",
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            ),
            color: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
        },
    ];

    const actions = isStudent ? studentActions
        : isAdmin ? adminActions
        : isTeacher ? teacherActions
        : lectorActions;

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            {/* Welcome header */}
            <div className="relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${theme.gradientFrom} ${theme.gradientTo}`} />
                <div className="flex items-center gap-5 px-8 py-7">
                    <div
                        className="hidden sm:flex w-14 h-14 rounded-2xl items-center justify-center text-white text-lg font-bold shrink-0 shadow-sm"
                        style={{ background: `linear-gradient(135deg, var(--tw-gradient-from, #7c3aed), var(--tw-gradient-to, #6d28d9))` }}
                    >
                        <span className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${theme.gradientFrom} ${theme.gradientTo}`}>
                            {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                        </span>
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 truncate">
                            {t("welcomeBack", { greeting, name: user?.first_name || "" })}
                        </h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            {t("welcomeSubtitle")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats cards - only for students */}
            {isStudent && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-3">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{t("activeInternships")}</p>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-3">
                            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{t("pendingTasks")}</p>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-3">
                            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{unreadCount}</p>
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{t("unreadNotices")}</p>
                    </div>
                </div>
            )}

            {/* Quick actions */}
            <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{t("quickActions")}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {actions.map((action, index) => {
                        // Contenido interno compartido entre enlace y botón
                        const actionContent = (
                            <>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${action.color} group-hover:scale-110 transition-transform duration-200`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        {action.icon}
                                    </svg>
                                </div>
                                <h3 className={`text-sm font-semibold text-gray-700 dark:text-gray-300 ${theme.actionHover} transition-colors`}>
                                    {action.title}
                                </h3>
                            </>
                        );

                        const commonClasses = "group w-full bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-200 flex flex-col items-center text-center";

                        // Si la acción tiene onClick, renderizamos un botón
                        if (action.onClick) {
                            return (
                                <button
                                    key={index}
                                    onClick={action.onClick}
                                    className={commonClasses}
                                >
                                    {actionContent}
                                </button>
                            );
                        }

                        // Si no, renderizamos el enlace
                        return (
                            <Link
                                key={action.href || index}
                                href={action.href!}
                                className={commonClasses}
                            >
                                {actionContent}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Calendar */}
            <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{t("calendar")}</h2>
                <DashboardCalendar />
            </div>

        </div>
    );
}