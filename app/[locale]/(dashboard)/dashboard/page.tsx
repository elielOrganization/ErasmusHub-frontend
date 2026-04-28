"use client"
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useRolePreview } from "@/context/RolePreviewContext";
import { useApi } from "@/hooks/useApi";
import { Link } from "@/i18n/routing";
import { useRoleTheme } from "@/hooks/useRoleTheme";
import { translateRole } from "@/lib/translateRole";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import DashboardCalendar from "@/components/ui/DashboardCalendar";
import { ReactNode } from "react";

type QuickAction = {
    title: string;
    desc: string;
    icon: ReactNode;
    href: string;
    badge?: number;
};

function useGreeting() {
    const t = useTranslations("dashboard");
    const hour = new Date().getHours();
    if (hour < 12) return t("greetingMorning");
    if (hour < 19) return t("greetingAfternoon");
    return t("greetingEvening");
}

// SVG icon paths
const Icons = {
    settings: <><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>,
    users: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
    clipboard: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />,
    checklist: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
    document: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
    bell: <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
    briefcase: <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
    chart: <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    globe: <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />,
};

export default function DashboardHome() {
    const t = useTranslations("dashboard");
    const tRoles = useTranslations("roles");
    const { user, loading } = useAuth();
    const { effectiveRoleName } = useRolePreview();
    const greeting = useGreeting();
    const theme = useRoleTheme();

    const roleName = effectiveRoleName || user?.role?.name || "";
    const isStudent = roleName.includes("Student");
    const isAdmin = roleName.toLowerCase().includes("admin");
    const isTeacher =
        roleName.toLowerCase().includes("teacher") ||
        roleName.toLowerCase().includes("profesor") ||
        roleName.toLowerCase().includes("professor") ||
        roleName.toLowerCase().includes("coordinator") ||
        roleName.toLowerCase().includes("coordinador");
    const isLector = !isStudent && !isAdmin && !isTeacher;

    const { data: unreadData } = useApi<{ count: number }>("/notifications/me/unread-count");
    const unreadCount = unreadData?.count || 0;

    // Role-color helpers (inline styles to avoid Tailwind v4 dynamic class issues)
    const iconBg = theme.gradientFromHex + "18";  // ~10% opacity
    const iconColor = theme.gradientFromHex;

    const adminActions: QuickAction[] = [
        { title: t("adminPanel"),      desc: t("adminPanelDesc"),      href: "/dashboard/admin",        icon: Icons.settings  },
        { title: t("manageStudents"),  desc: t("manageStudentsDesc"),  href: "/dashboard/students",     icon: Icons.users     },
        { title: t("revision"),        desc: t("revisionDesc"),        href: "/dashboard/revision",     icon: Icons.clipboard },
        { title: t("listaFinal"),      desc: t("listaFinalDesc"),      href: "/dashboard/lista-final",  icon: Icons.checklist },
    ];

    const studentActions: QuickAction[] = [
        { title: t("myDocuments"),     desc: t("myDocumentsDesc"),     href: "/dashboard/documents",    icon: Icons.document  },
        { title: t("myNotices"),       desc: t("myNoticesDesc"),       href: "/dashboard/avisos",       icon: Icons.bell, badge: unreadCount },
        { title: t("myInternships"),   desc: t("myInternshipsDesc"),   href: "/dashboard/practicas",    icon: Icons.briefcase },
        { title: t("calificacion"),    desc: t("calificacionDesc"),    href: "/dashboard/calificacion", icon: Icons.chart     },
        { title: t("listaFinal"),      desc: t("listaFinalDesc"),      href: "/dashboard/lista-final",  icon: Icons.checklist },
    ];

    const teacherActions: QuickAction[] = [
        { title: t("manageStudents"),  desc: t("manageStudentsDesc"),  href: "/dashboard/students",     icon: Icons.users     },
        { title: t("revision"),        desc: t("revisionDesc"),        href: "/dashboard/revision",     icon: Icons.clipboard },
        { title: t("listaFinal"),      desc: t("listaFinalDesc"),      href: "/dashboard/lista-final",  icon: Icons.checklist },
        { title: t("calificacion"),    desc: t("calificacionDesc"),    href: "/dashboard/calificacion", icon: Icons.chart     },
    ];

    const lectorActions: QuickAction[] = [
        { title: t("listaFinal"),      desc: t("listaFinalDesc"),      href: "/dashboard/lista-final",  icon: Icons.checklist },
        { title: t("calificacion"),    desc: t("calificacionDesc"),    href: "/dashboard/calificacion", icon: Icons.chart     },
        { title: t("opportunities"),   desc: t("opportunitiesDesc"),   href: "/dashboard/opportunities",icon: Icons.globe     },
    ];

    const actions = isStudent ? studentActions
        : isAdmin    ? adminActions
        : isTeacher  ? teacherActions
        : lectorActions;

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6">

            {/* ── Welcome banner ── */}
            <div
                className="rounded-3xl overflow-hidden shadow-sm"
                style={{ background: `linear-gradient(135deg, ${theme.gradientFromHex}, ${theme.gradientToHex})` }}
            >
                <div className="px-7 py-6 flex items-center gap-5">
                    {/* Avatar */}
                    <div
                        className="hidden sm:flex w-14 h-14 rounded-2xl items-center justify-center text-white text-xl font-bold shrink-0 shadow-inner"
                        style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                    >
                        {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                    </div>

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                        <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                            {t("welcomeBack", { greeting, name: user?.first_name || "" })}
                        </h1>
                        <p className="text-white/70 text-sm mt-0.5">
                            {translateRole(user?.role?.name, tRoles)}
                        </p>
                    </div>

                    {/* Unread badge (all roles) */}
                    {unreadCount > 0 && (
                        <Link
                            href="/dashboard/avisos"
                            className="shrink-0 flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors rounded-xl px-3 py-2"
                        >
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                {Icons.bell}
                            </svg>
                            <span className="text-white font-bold text-sm">{unreadCount}</span>
                        </Link>
                    )}
                </div>
            </div>

            {/* ── Quick actions ── */}
            <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 px-1">
                    {t("quickActions")}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {actions.map((action) => (
                        <Link
                            key={action.href}
                            href={action.href}
                            className="group relative bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md transition-all duration-200 flex flex-col gap-3"
                        >
                            {/* Icon + arrow row */}
                            <div className="flex items-start justify-between">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                                    style={{ backgroundColor: iconBg, color: iconColor }}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        {action.icon}
                                    </svg>
                                </div>

                                {/* Badge or arrow */}
                                {action.badge ? (
                                    <span className="flex items-center justify-center min-w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5">
                                        {action.badge}
                                    </span>
                                ) : (
                                    <svg
                                        className="w-4 h-4 text-gray-200 dark:text-gray-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200"
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
                                    </svg>
                                )}
                            </div>

                            {/* Text */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">
                                    {action.title}
                                </h3>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">
                                    {action.desc}
                                </p>
                            </div>

                            {/* Bottom accent line on hover */}
                            <div
                                className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                style={{ backgroundColor: iconColor }}
                            />
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── Calendar ── */}
            <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 px-1">
                    {t("calendar")}
                </h2>
                <DashboardCalendar />
            </div>

        </div>
    );
}
