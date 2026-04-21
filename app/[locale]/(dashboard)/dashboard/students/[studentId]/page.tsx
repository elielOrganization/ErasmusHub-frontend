"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useApi } from "@/hooks/useApi";
import { useRoleTheme } from "@/hooks/useRoleTheme";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import { GYMNASIUM_COURSES } from "../../documents/constants";

/* ── Types ─────────────────────────────────────────────────── */

interface UserPublic {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    birth_date?: string | null;
    is_minor: boolean;
    address?: string | null;
    phone?: string | null;
    year?: string | null;
    final_grade?: number | null;
    rodne_cislo?: string | null;
    role?: { name: string } | null;
    created_at: string;
}

interface ApplicationWithStudent {
    application_id: number;
    user_id: number;
    opportunity_id: number;
    opportunity_name: string;
    status: string;
}

interface DocumentRead {
    id: number;
    name: string;
    document_type?: string | null;
    state: "pending" | "approved" | "rejected";
}

/* ── Helpers ────────────────────────────────────────────────── */

function courseLabel(year?: string | null) {
    if (!year) return null;
    return GYMNASIUM_COURSES.find(c => c.value === year)?.label ?? year;
}

const AVATAR_PALETTES: [string, string][] = [
    ["#6366f1", "#8b5cf6"],
    ["#0ea5e9", "#6366f1"],
    ["#10b981", "#0ea5e9"],
    ["#f59e0b", "#ef4444"],
    ["#ec4899", "#8b5cf6"],
    ["#14b8a6", "#6366f1"],
];

function avatarGradient(name: string): [string, string] {
    const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
    return AVATAR_PALETTES[code % AVATAR_PALETTES.length];
}

/* ── Circular progress ─────────────────────────────────────── */

function Ring({ pct, color = "#10b981" }: { pct: number; color?: string }) {
    const r = 26;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    return (
        <svg width="68" height="68" className="-rotate-90">
            <circle cx="34" cy="34" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-gray-100 dark:text-gray-800" />
            <circle
                cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="5"
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.7s ease" }}
            />
        </svg>
    );
}

/* ── Status badge ───────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        pending:  "bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400",
        rejected: "bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400",
    };
    const t = useTranslations("documents");
    const label = status === "approved" ? t("state_approved")
                : status === "pending"  ? t("state_pending")
                : status === "rejected" ? t("state_rejected")
                : status;
    return (
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
            {label}
        </span>
    );
}

/* ── Page ───────────────────────────────────────────────────── */

export default function StudentProfilePage() {
    const params    = useParams<{ studentId: string; locale: string }>();
    const studentId = params.studentId;
    const locale    = params.locale || "en";
    const router    = useRouter();
    const theme     = useRoleTheme();
    const t         = useTranslations("studentProfile");
    const tUp       = useTranslations("userProfile");

    const { data: allUsers,  loading: lu } = useApi<UserPublic[]>("/users");
    const { data: allApps,   loading: la } = useApi<ApplicationWithStudent[]>("/applications/all");
    const { data: documents, loading: ld } = useApi<DocumentRead[]>(`/documents/user/${studentId}`);

    const student     = allUsers?.find(u => u.id === parseInt(studentId));
    const application = allApps?.find(a => a.user_id === parseInt(studentId));

    const approvedDocs = documents?.filter(d => d.state === "approved").length ?? 0;
    const pendingDocs  = documents?.filter(d => d.state === "pending").length  ?? 0;
    const totalDocs    = documents?.length ?? 0;
    const pct          = totalDocs ? Math.round((approvedDocs / totalDocs) * 100) : 0;

    const dateLocale = locale === "cs" ? "cs-CZ" : locale === "es" ? "es-ES" : "en-GB";
    const fmt = (d?: string | null) =>
        d ? new Date(d).toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric" }) : "—";

    if (lu || la || ld) return <LoadingSpinner />;

    if (!student) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
                <p className="text-gray-400 text-sm">{t("notFound")}</p>
                <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
                    {t("goBack")}
                </button>
            </div>
        );
    }

    const initials       = `${student.first_name[0] ?? ""}${student.last_name[0] ?? ""}`.toUpperCase();
    const [avFrom, avTo] = avatarGradient(student.first_name + student.last_name);
    const course         = courseLabel(student.year);

    // Score 1–10: higher = better
    const gradeColor =
        student.final_grade == null  ? "#6b7280"
        : student.final_grade >= 8   ? "#10b981"
        : student.final_grade >= 5   ? "#f59e0b"
        : "#ef4444";

    return (
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

            {/* Back */}
            <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                </svg>
                {t("back")}
            </button>

            {/* ── Bento row 1 ───────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

                {/* Identity — spans 2 cols */}
                <div className="col-span-2 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 flex items-center gap-4">
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0 shadow"
                        style={{ background: `linear-gradient(135deg, ${avFrom}, ${avTo})` }}
                    >
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate">
                            {student.first_name} {student.last_name}
                        </h1>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{student.email}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {course && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                    {course}
                                </span>
                            )}
                            {student.is_minor && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                                    {t("minor")}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Grade stat */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 flex flex-col items-center justify-center gap-1 relative overflow-hidden">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t("grade")}</span>
                    {student.final_grade != null ? (
                        <>
                            <span className="text-4xl font-black" style={{ color: gradeColor }}>
                                {student.final_grade}
                            </span>
                            <span className="text-[10px] text-gray-300 dark:text-gray-700">/ 10</span>
                        </>
                    ) : (
                        <span className="text-2xl font-bold text-gray-200 dark:text-gray-700">—</span>
                    )}
                    <div className="absolute inset-0 opacity-5 rounded-3xl" style={{ background: gradeColor }} />
                </div>

                {/* Docs stat */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 flex flex-col items-center justify-center gap-1">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t("docs")}</span>
                    <div className="relative flex items-center justify-center">
                        <Ring pct={pct} color="#10b981" />
                        <span className="absolute text-sm font-bold text-gray-700 dark:text-gray-200">{pct}%</span>
                    </div>
                    <span className="text-[11px] text-gray-400">{approvedDocs}/{totalDocs}</span>
                </div>
            </div>

            {/* ── Bento row 2 ───────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

                {/* Personal & Contact — 2 cols */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 space-y-1">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        {t("personalContact")}
                    </p>

                    {[
                        { label: tUp("firstName"),  val: student.first_name },
                        { label: tUp("lastName"),   val: student.last_name },
                        { label: tUp("birthDate"),  val: fmt(student.birth_date) },
                        { label: tUp("phone"),      val: student.phone },
                        { label: tUp("address"),    val: student.address },
                        ...(student.rodne_cislo
                            ? [{ label: tUp("rodneCislo"), val: student.rodne_cislo.slice(0, 4) + "••••••" }]
                            : []),
                    ].map(({ label, val }) =>
                        val ? (
                            <div key={label} className="flex items-baseline gap-2 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                                <span className="w-24 shrink-0 text-[11px] text-gray-400">{label}</span>
                                <span className="text-sm text-gray-700 dark:text-gray-200 font-medium break-all">{val}</span>
                            </div>
                        ) : null
                    )}
                </div>

                {/* Right column — 3 cols */}
                <div className="lg:col-span-3 flex flex-col gap-4">

                    {/* Opportunity */}
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            {t("assignedOpportunity")}
                        </p>
                        {application ? (
                            <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                                        {application.opportunity_name}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {t("applicationNumber", { id: application.application_id })}
                                    </p>
                                </div>
                                <StatusBadge status={application.status} />
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-gray-400 italic">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-300">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                                {t("noOpportunity")}
                            </div>
                        )}
                    </div>

                    {/* Documents */}
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 flex flex-col gap-4 flex-1">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                {t("documents")}
                            </p>
                            <span className="text-xs text-gray-300 dark:text-gray-600">
                                {totalDocs} {t("submitted")}
                            </span>
                        </div>

                        {totalDocs > 0 && (
                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 p-3 text-center">
                                    <span className="block text-xl font-black text-emerald-600 dark:text-emerald-400">{approvedDocs}</span>
                                    <span className="text-[10px] text-emerald-500/80 font-semibold uppercase tracking-wide">{t("approved")}</span>
                                </div>
                                <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 p-3 text-center">
                                    <span className="block text-xl font-black text-amber-500 dark:text-amber-400">{pendingDocs}</span>
                                    <span className="text-[10px] text-amber-500/80 font-semibold uppercase tracking-wide">{t("pending")}</span>
                                </div>
                                <div className="rounded-2xl bg-gray-50 dark:bg-gray-800 p-3 text-center">
                                    <span className="block text-xl font-black text-gray-500 dark:text-gray-300">{totalDocs - approvedDocs - pendingDocs}</span>
                                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{t("other")}</span>
                                </div>
                            </div>
                        )}

                        {totalDocs === 0 && (
                            <p className="text-sm text-gray-400 italic">{t("noDocs")}</p>
                        )}

                        <Link
                            href={`/${locale}/dashboard/revision/${studentId}`}
                            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[.98] ${theme.btnPrimary}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clipRule="evenodd" />
                            </svg>
                            {t("reviewDocuments")}
                        </Link>
                    </div>

                </div>
            </div>

        </div>
    );
}
