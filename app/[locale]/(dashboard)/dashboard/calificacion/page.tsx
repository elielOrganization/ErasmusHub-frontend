"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useRoleTheme } from "@/hooks/useRoleTheme";
import { useApi } from "@/hooks/useApi";
import { API_URL } from "@/lib/api";
import Cookies from "js-cookie";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// ── Types ──────────────────────────────────────────────────────────────────────

interface OtroSubField { label: string; weight: number; }
interface OtrosData    { weight: number; subfields: OtroSubField[]; }

interface PonderacionData {
    id: number;
    interview: number;
    grade_certificate: number;
    motivation_letter: number;
    language_certificate: number;
    disability_certificate: number;
    otros: OtrosData | null;
    updated_at: string;
    updated_by: number | null;
}

type FixedField = "interview" | "grade_certificate" | "motivation_letter" | "language_certificate" | "disability_certificate";

interface FormValues {
    interview: string;
    grade_certificate: string;
    motivation_letter: string;
    language_certificate: string;
    disability_certificate: string;
}

interface SubFieldDraft { label: string; weight: string; }
interface OtrosDraft    { weight: string; open: boolean; subfields: SubFieldDraft[]; }

// ── Constants ──────────────────────────────────────────────────────────────────

const FIXED_FIELDS: FixedField[] = [
    "interview",
    "grade_certificate",
    "motivation_letter",
    "language_certificate",
    "disability_certificate",
];

// ── Page ───────────────────────────────────────────────────────────────────────

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

    const [otros, setOtros] = useState<OtrosDraft>({
        weight: "",
        open: false,
        subfields: [],
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
            if (data.otros) {
                setOtros({
                    weight: String(data.otros.weight),
                    open: data.otros.subfields.length > 0,
                    subfields: data.otros.subfields.map(sf => ({ label: sf.label, weight: String(sf.weight) })),
                });
            } else {
                setOtros({ weight: "", open: false, subfields: [] });
            }
        }
    }, [data]);

    // ── Calculations ────────────────────────────────────────────────────────────

    const otrosWeight = parseFloat(otros.weight) || 0;
    const subTotal    = otros.subfields.reduce((acc, sf) => acc + (parseFloat(sf.weight) || 0), 0);

    const total =
        (parseFloat(form.interview) || 0) +
        (parseFloat(form.grade_certificate) || 0) +
        (parseFloat(form.motivation_letter) || 0) +
        (parseFloat(form.language_certificate) || 0) +
        (parseFloat(form.disability_certificate) || 0) +
        otrosWeight;

    const totalExact  = Math.abs(total - 100) < 0.01;
    const totalExceeds = total > 100.01;
    const subExceeds  = subTotal > otrosWeight + 0.01;
    const subExact    = otrosWeight === 0 || Math.abs(subTotal - otrosWeight) < 0.01;

    const handleOtrosWeightChange = (val: string) => {
        const num = parseFloat(val) || 0;
        setOtros(prev => ({ ...prev, weight: val, open: num > 0 ? true : prev.open }));
    };

    const addSubField = () =>
        setOtros(prev => ({ ...prev, subfields: [...prev.subfields, { label: "", weight: "" }] }));

    const updateSubField = (idx: number, patch: Partial<SubFieldDraft>) =>
        setOtros(prev => ({ ...prev, subfields: prev.subfields.map((sf, i) => i === idx ? { ...sf, ...patch } : sf) }));

    const removeSubField = (idx: number) =>
        setOtros(prev => ({ ...prev, subfields: prev.subfields.filter((_, i) => i !== idx) }));

    // ── Save ────────────────────────────────────────────────────────────────────

    async function handleSave() {
        setError(null);
        setSuccess(false);

        for (const key of FIXED_FIELDS) {
            if (!form[key] || parseFloat(form[key]) <= 0) {
                setError(t("errorRequired"));
                return;
            }
        }
        if (!totalExact) { setError(t("errorTotal")); return; }
        if (!subExact) {
            setError(subExceeds
                ? `La suma de subcampos (${subTotal.toFixed(1)}%) supera el peso de Otros (${otrosWeight.toFixed(1)}%)`
                : `La suma de subcampos (${subTotal.toFixed(1)}%) debe ser exactamente ${otrosWeight.toFixed(1)}%`
            );
            return;
        }

        const otrosPayload = otrosWeight > 0
            ? {
                weight: otrosWeight,
                subfields: otros.subfields
                    .filter(sf => sf.label.trim() && parseFloat(sf.weight) > 0)
                    .map(sf => ({ label: sf.label.trim(), weight: parseFloat(sf.weight) })),
              }
            : null;

        setSaving(true);
        try {
            const token = Cookies.get("auth_token");
            const res = await fetch(`${API_URL}/calificacion`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    interview: parseFloat(form.interview),
                    grade_certificate: parseFloat(form.grade_certificate),
                    motivation_letter: parseFloat(form.motivation_letter),
                    language_certificate: parseFloat(form.language_certificate),
                    disability_certificate: parseFloat(form.disability_certificate),
                    otros: otrosPayload,
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                // Pydantic devuelve detail como array de objetos; extraemos el primer mensaje legible
                let msg: string;
                if (Array.isArray(body?.detail)) {
                    msg = body.detail.map((e: { msg?: string }) => e.msg ?? JSON.stringify(e)).join(" | ");
                } else {
                    msg = body?.detail ?? `Error ${res.status}`;
                }
                throw new Error(msg);
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
        return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>;
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
                            <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">{t("colCriteria")}</th>
                            <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3 w-36">{t("colWeight")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">

                        {/* Fixed fields */}
                        {FIXED_FIELDS.map((key) => (
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
                                                type="number" min="0" max="100" step="0.1"
                                                value={form[key]}
                                                onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                                                placeholder="0"
                                                className="w-20 text-right text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        ) : (
                                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 w-20 text-right">{parseFloat(form[key]) || 0}</span>
                                        )}
                                        <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {/* Otros row */}
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Otros</span>
                                    <span className="text-[10px] text-gray-400 italic">(opcional)</span>
                                    {otrosWeight > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setOtros(p => ({ ...p, open: !p.open }))}
                                            className="ml-auto flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            {otros.open ? "Ocultar subcampos" : "Ver subcampos"}
                                            <svg className={`h-3.5 w-3.5 transition-transform ${otros.open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </td>
                            <td className="px-5 py-4">
                                <div className="flex items-center justify-end gap-1.5">
                                    {isAdmin ? (
                                        <input
                                            type="number" min="0" max="100" step="0.1"
                                            value={otros.weight}
                                            onChange={e => handleOtrosWeightChange(e.target.value)}
                                            placeholder="0"
                                            className="w-20 text-right text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    ) : (
                                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 w-20 text-right">{otrosWeight || 0}</span>
                                    )}
                                    <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                                </div>
                            </td>
                        </tr>

                        {/* Subcampos panel */}
                        {otrosWeight > 0 && otros.open && (
                            <tr>
                                <td colSpan={2} className="px-5 py-4 bg-gray-50 dark:bg-gray-800/40">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subcampos de Otros</p>
                                            <span className={`text-xs font-semibold ${subExceeds ? "text-red-500" : subExact ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}`}>
                                                {subTotal.toFixed(1)} / {otrosWeight.toFixed(1)} %
                                            </span>
                                        </div>

                                        {otros.subfields.length === 0 && (
                                            <p className="text-xs text-gray-400 italic">Sin subcampos aún. Pulsa "Añadir campo" para empezar.</p>
                                        )}

                                        {otros.subfields.map((sf, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                {isAdmin ? (
                                                    <>
                                                        <input
                                                            type="text" value={sf.label}
                                                            onChange={e => updateSubField(idx, { label: e.target.value })}
                                                            placeholder="Nombre del campo"
                                                            className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                        <input
                                                            type="number" min="0" max="100" step="0.1"
                                                            value={sf.weight}
                                                            onChange={e => updateSubField(idx, { weight: e.target.value })}
                                                            placeholder="0"
                                                            className="w-20 text-right text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                                                        <button type="button" onClick={() => removeSubField(idx)}
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{sf.label}</span>
                                                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 w-20 text-right">{parseFloat(sf.weight) || 0}</span>
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                                                    </>
                                                )}
                                            </div>
                                        ))}

                                        {isAdmin && (
                                            <button type="button" onClick={addSubField}
                                                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                Añadir campo
                                            </button>
                                        )}

                                        {subExceeds && (
                                            <p className="text-xs text-red-500 dark:text-red-400">⚠ La suma de subcampos ({subTotal.toFixed(1)}%) supera el peso de Otros ({otrosWeight.toFixed(1)}%)</p>
                                        )}
                                        {!subExceeds && !subExact && otrosWeight > 0 && (
                                            <p className="text-xs text-amber-500 dark:text-amber-400">⚠ Faltan {(otrosWeight - subTotal).toFixed(1)}% por distribuir entre los subcampos</p>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}

                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
                            <td className="px-5 py-3 text-sm font-bold text-gray-700 dark:text-gray-300">{t("total")}</td>
                            <td className="px-5 py-3 text-right">
                                <span className={`text-sm font-bold ${totalExceeds ? "text-red-600 dark:text-red-400" : total === 100 ? "text-green-600 dark:text-green-400" : "text-gray-800 dark:text-gray-200"}`}>
                                    {total.toFixed(1)} %
                                </span>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500">
                <span className="text-red-500 font-bold">* </span>{t("requiredNote")}
            </p>

            {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>
            )}
            {success && (
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400">{t("savedSuccess")}</div>
            )}

            {isAdmin && (
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving || !totalExact || !subExact}
                        className={`px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${theme.btnPrimary} ${theme.btnPrimaryHover} active:scale-95`}
                    >
                        {saving ? t("saving") : t("save")}
                    </button>
                </div>
            )}

            {data && data.updated_by && (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-right">
                    {t("lastUpdated", { date: new Date(data.updated_at).toLocaleDateString() })}
                </p>
            )}
        </div>
    );
}
