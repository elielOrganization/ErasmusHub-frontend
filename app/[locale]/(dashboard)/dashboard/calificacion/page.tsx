"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useRoleTheme } from "@/hooks/useRoleTheme";
import { useApi } from "@/hooks/useApi";
import { API_URL } from "@/lib/api";
import Cookies from "js-cookie";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface PonderacionData {
    id: number;
    interview: number;
    grade_certificate: number;
    motivation_letter: number;
    language_certificate: number;
    disability_certificate: number;
    updated_at: string;
    updated_by: number | null;
}

type Field = "interview" | "grade_certificate" | "motivation_letter" | "language_certificate" | "disability_certificate";

interface FormValues {
    interview: string;
    grade_certificate: string;
    motivation_letter: string;
    language_certificate: string;
    disability_certificate: string;
}

export default function CalificacionPage() {
    const t = useTranslations("calificacion");
    const { user } = useAuth();
    const theme = useRoleTheme();

    const roleName = user?.role?.name?.toLowerCase() || "";
    const isAdmin = roleName.includes("admin");

    const { data, loading, refetch } = useApi<PonderacionData>("/calificacion");

    const [form, setForm] = useState<FormValues>({
        interview: "",
        grade_certificate: "",
        motivation_letter: "",
        language_certificate: "",
        disability_certificate: "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (data) {
            setForm({
                interview: data.interview > 0 ? String(data.interview) : "",
                grade_certificate: data.grade_certificate > 0 ? String(data.grade_certificate) : "",
                motivation_letter: data.motivation_letter > 0 ? String(data.motivation_letter) : "",
                language_certificate: data.language_certificate > 0 ? String(data.language_certificate) : "",
                disability_certificate: data.disability_certificate > 0 ? String(data.disability_certificate) : "",
            });
        }
    }, [data]);

    const total =
        (parseFloat(form.interview) || 0) +
        (parseFloat(form.grade_certificate) || 0) +
        (parseFloat(form.motivation_letter) || 0) +
        (parseFloat(form.language_certificate) || 0) +
        (parseFloat(form.disability_certificate) || 0);

    const totalExact = Math.abs(total - 100) < 0.01;
    const totalExceeds = total > 100;

    const FIELDS: Field[] = [
        "interview",
        "grade_certificate",
        "motivation_letter",
        "language_certificate",
        "disability_certificate",
    ];

    async function handleSave() {
        setError(null);
        setSuccess(false);

        // Validate all fields filled
        for (const key of FIELDS) {
            if (!form[key] || parseFloat(form[key]) <= 0) {
                setError(t("errorRequired"));
                return;
            }
        }
        if (!totalExact) {
            setError(t("errorTotal"));
            return;
        }

        setSaving(true);
        try {
            const token = Cookies.get("auth_token");
            const res = await fetch(`${API_URL}/calificacion`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    interview: parseFloat(form.interview) || 0,
                    grade_certificate: parseFloat(form.grade_certificate) || 0,
                    motivation_letter: parseFloat(form.motivation_letter) || 0,
                    language_certificate: parseFloat(form.language_certificate) || 0,
                    disability_certificate: parseFloat(form.disability_certificate) || 0,
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.detail || `Error ${res.status}`);
            }
            await refetch();
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : t("errorGeneric"));
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">
                                {t("colCriteria")}
                            </th>
                            <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3 w-36">
                                {t("colWeight")}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {FIELDS.map((key) => (
                            <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="px-5 py-4">
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                        {(t as (k: string) => string)(`fields.${key}`)}
                                    </span>
                                    <span className="ml-1.5 text-red-500 text-xs font-bold">*</span>
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center justify-end gap-1.5">
                                        {isAdmin ? (
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.1"
                                                value={form[key]}
                                                onChange={(e) =>
                                                    setForm((prev) => ({ ...prev, [key]: e.target.value }))
                                                }
                                                placeholder="0"
                                                className="w-20 text-right text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                            />
                                        ) : (
                                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 w-20 text-right">
                                                {parseFloat(form[key]) || 0}
                                            </span>
                                        )}
                                        <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
                            <td className="px-5 py-3 text-sm font-bold text-gray-700 dark:text-gray-300">
                                {t("total")}
                            </td>
                            <td className="px-5 py-3 text-right">
                                <span
                                    className={`text-sm font-bold ${
                                        totalExceeds
                                            ? "text-red-600 dark:text-red-400"
                                            : total === 100
                                            ? "text-green-600 dark:text-green-400"
                                            : "text-gray-800 dark:text-gray-200"
                                    }`}
                                >
                                    {total.toFixed(1)} %
                                </span>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Info legend */}
            <p className="text-xs text-gray-400 dark:text-gray-500">
                <span className="text-red-500 font-bold">* </span>
                {t("requiredNote")}
            </p>

            {/* Feedback */}
            {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                    {error}
                </div>
            )}
            {success && (
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                    {t("savedSuccess")}
                </div>
            )}

            {/* Save button (admin only) */}
            {isAdmin && (
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving || !totalExact}
                        className={`px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${theme.activeBg} hover:opacity-90 active:scale-95`}
                    >
                        {saving ? t("saving") : t("save")}
                    </button>
                </div>
            )}

            {/* Last updated info */}
            {data && data.updated_by && (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-right">
                    {t("lastUpdated", {
                        date: new Date(data.updated_at).toLocaleDateString(),
                    })}
                </p>
            )}
        </div>
    );
}
