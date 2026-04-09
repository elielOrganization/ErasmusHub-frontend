"use client";

import { useState, useRef, ChangeEvent } from "react";
import { useNotificationPrefs } from "@/hooks/useNotificationPrefs";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useRoleTheme } from "@/hooks/useRoleTheme";
import { useTheme } from "@/context/ThemeContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Cookies from "js-cookie";
import { API_URL } from "@/lib/api";

type Section = "account" | "appearance" | "security" | "notifications" | "privacy";

const NAV_ITEMS: { key: Section; iconPath: React.ReactNode }[] = [
    {
        key: "account",
        iconPath: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
    },
    {
        key: "appearance",
        iconPath: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />,
    },
    {
        key: "security",
        iconPath: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
    },
    {
        key: "notifications",
        iconPath: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
    },
    {
        key: "privacy",
        iconPath: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
    },
];

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, accentColor }: { checked: boolean; onChange: (v: boolean) => void; accentColor?: string }) {
    const color = accentColor ?? "#3b82f6";
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className="relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none"
            style={{ background: checked ? color : "#6b7280" }}
        >
            <span
                className="inline-block w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: checked ? "translateX(1.375rem)" : "translateX(0.25rem)" }}
            />
        </button>
    );
}

// ─── Setting row ──────────────────────────────────────────────────────────────

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 py-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{label}</p>
                {description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>}
            </div>
            <div className="shrink-0">{children}</div>
        </div>
    );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ title, iconPath, iconBg, iconColor, children }: {
    title: string;
    iconPath: React.ReactNode;
    iconBg: string;
    iconColor: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                    <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {iconPath}
                    </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{title}</h2>
            </div>
            {children}
        </div>
    );
}

// ─── Read-only info row ───────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
    return (
        <div>
            <label className="block text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1.5 tracking-wide uppercase">{label}</label>
            <div className="flex items-center gap-3 rounded-xl px-4 py-3 border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{value || "—"}</span>
                <svg className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            </div>
        </div>
    );
}

// ─── ACCOUNT ──────────────────────────────────────────────────────────────────

function AccountSection({ t, theme }: { t: ReturnType<typeof useTranslations>; theme: ReturnType<typeof useRoleTheme> }) {
    const { user } = useAuth();
    const avatarRef = useRef<HTMLInputElement>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const initials = user
        ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
        : "??";

    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarPreview(URL.createObjectURL(file));
    };

    return (
        <div className="space-y-6">
            {/* Avatar */}
            <SectionCard
                title={t("profilePhoto")}
                iconBg="bg-blue-50 dark:bg-blue-900/30" iconColor="text-blue-600 dark:text-blue-400"
                iconPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />}
            >
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative shrink-0">
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="avatar" className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg" />
                        ) : (
                            <div
                                className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-white dark:border-gray-800 shadow-lg"
                                style={{ background: `linear-gradient(135deg, ${theme.avatarFrom} 0%, ${theme.avatarTo} 100%)` }}
                            >
                                {initials}
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => avatarRef.current?.click()}
                            className="absolute -bottom-1 -right-1 w-8 h-8 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-full flex items-center justify-center shadow hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                            <svg className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex-1 space-y-1.5 text-center sm:text-left">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{user?.first_name} {user?.last_name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{t("avatarHint")}</p>
                        <div className="flex items-center gap-2 justify-center sm:justify-start pt-1">
                            <button type="button" onClick={() => avatarRef.current?.click()}
                                className="px-4 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                {t("changePhoto")}
                            </button>
                            {avatarPreview && (
                                <button type="button" onClick={() => setAvatarPreview(null)}
                                    className="px-4 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                    {t("removePhoto")}
                                </button>
                            )}
                        </div>
                    </div>
                    <input ref={avatarRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAvatarChange} />
                </div>
            </SectionCard>

            {/* Personal info — read-only */}
            <SectionCard
                title={t("personalInfo")}
                iconBg="bg-emerald-50 dark:bg-emerald-900/30" iconColor="text-emerald-600 dark:text-emerald-400"
                iconPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow label={t("firstName")} value={user?.first_name} />
                    <InfoRow label={t("lastName")} value={user?.last_name} />
                    <InfoRow label={t("email")} value={user?.email} />
                    <InfoRow label={t("phone")} value={user?.phone} />
                    <div className="sm:col-span-2">
                        <InfoRow label={t("address")} value={user?.address} />
                    </div>
                    <InfoRow label={t("rodneCislo")} value={user?.rodne_cislo} />
                    <InfoRow label={t("role")} value={user?.role?.name} />
                </div>
                <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t("readOnlyNote")}
                </p>
            </SectionCard>
        </div>
    );
}

// ─── APPEARANCE ───────────────────────────────────────────────────────────────

function AppearanceSection({ t }: { t: ReturnType<typeof useTranslations> }) {
    const { isDark, toggleTheme } = useTheme();

    return (
        <SectionCard
            title={t("appearance")}
            iconBg="bg-amber-50 dark:bg-amber-900/30" iconColor="text-amber-600 dark:text-amber-400"
            iconPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />}
        >
            <div className="grid grid-cols-2 gap-3 mb-6">
                {/* Light */}
                <button type="button" onClick={() => isDark && toggleTheme()}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${!isDark ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                    {!isDark && (
                        <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        </span>
                    )}
                    <div className="w-full h-16 rounded-xl bg-white border border-gray-200 overflow-hidden flex flex-col gap-1 p-1.5">
                        <div className="h-2 bg-gray-200 rounded w-3/4" />
                        <div className="h-2 bg-gray-100 rounded w-1/2" />
                        <div className="h-2 bg-gray-100 rounded w-2/3" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
                        {t("lightMode")}
                    </span>
                </button>

                {/* Dark */}
                <button type="button" onClick={() => !isDark && toggleTheme()}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${isDark ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                    {isDark && (
                        <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        </span>
                    )}
                    <div className="w-full h-16 rounded-xl bg-gray-900 border border-gray-700 overflow-hidden flex flex-col gap-1 p-1.5">
                        <div className="h-2 bg-gray-600 rounded w-3/4" />
                        <div className="h-2 bg-gray-700 rounded w-1/2" />
                        <div className="h-2 bg-gray-700 rounded w-2/3" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                        {t("darkMode")}
                    </span>
                </button>
            </div>

            <SettingRow label={t("darkModeToggle")} description={t("darkModeToggleDesc")}>
                <Toggle checked={isDark} onChange={toggleTheme} accentColor="#1d4ed8" />
            </SettingRow>
        </SectionCard>
    );
}

// ─── SECURITY ─────────────────────────────────────────────────────────────────

// Defined OUTSIDE SecuritySection so React doesn't recreate it on every render.
// If defined inside, each keystroke triggers a re-render which remounts the input and loses focus.
type PassForm = { current: string; newPass: string; confirm: string };
type ShowPass = { current: boolean; newPass: boolean; confirm: boolean };

function PasswordField({
    fieldKey, label, form, setForm, showPass, setShowPass,
}: {
    fieldKey: keyof PassForm;
    label: string;
    form: PassForm;
    setForm: React.Dispatch<React.SetStateAction<PassForm>>;
    showPass: ShowPass;
    setShowPass: React.Dispatch<React.SetStateAction<ShowPass>>;
}) {
    const visible = showPass[fieldKey];
    const [focused, setFocused] = useState(false);
    return (
        <div>
            <label className="block text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1.5 tracking-wide uppercase">{label}</label>
            <div className={`flex items-center gap-2 rounded-xl px-4 py-3.5 border-2 transition-all duration-200
                ${focused ? "border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/10" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"}
            `}>
                <svg className={`w-4 h-4 shrink-0 ${focused ? "text-blue-400" : "text-gray-300 dark:text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                    type={visible ? "text" : "password"}
                    value={form[fieldKey]}
                    onChange={(e) => setForm((p) => ({ ...p, [fieldKey]: e.target.value }))}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 outline-none placeholder-gray-300 dark:placeholder-gray-600"
                    placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPass((p) => ({ ...p, [fieldKey]: !p[fieldKey] }))}
                    className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {visible
                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />
                            : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                        }
                    </svg>
                </button>
            </div>
        </div>
    );
}

function SecuritySection({ t }: { t: ReturnType<typeof useTranslations> }) {
    const { user } = useAuth();
    const [form, setForm] = useState<PassForm>({ current: "", newPass: "", confirm: "" });
    const [showPass, setShowPass] = useState<ShowPass>({ current: false, newPass: false, confirm: false });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        setError(null);
        if (!form.current) { setError(t("currentPasswordRequired")); return; }
        if (form.newPass.length < 8) { setError(t("passwordTooShort")); return; }
        if (form.newPass !== form.confirm) { setError(t("passwordMismatch")); return; }
        setSaving(true);
        try {
            const authToken = Cookies.get("auth_token");

            // Step 1: verify current password via login endpoint
            const verifyRes = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rodne_cislo: user?.rodne_cislo, password: form.current }),
            });
            if (!verifyRes.ok) {
                setError(t("wrongCurrentPassword"));
                setSaving(false);
                return;
            }

            // Step 2: update password via PATCH /users/{id}
            const updateRes = await fetch(`${API_URL}/users/${user?.id}`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
                body: JSON.stringify({ password: form.newPass }),
            });
            if (!updateRes.ok) throw new Error(`${updateRes.status}`);

            setSaved(true);
            setForm({ current: "", newPass: "", confirm: "" });
            setTimeout(() => setSaved(false), 3000);
        } catch {
            setError(t("saveError"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <SectionCard
            title={t("security")}
            iconBg="bg-red-50 dark:bg-red-900/30" iconColor="text-red-600 dark:text-red-400"
            iconPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />}
        >
            <div className="space-y-4 max-w-md">
                <PasswordField fieldKey="current" label={t("currentPassword")} form={form} setForm={setForm} showPass={showPass} setShowPass={setShowPass} />
                <PasswordField fieldKey="newPass" label={t("newPassword")} form={form} setForm={setForm} showPass={showPass} setShowPass={setShowPass} />
                <PasswordField fieldKey="confirm" label={t("confirmPassword")} form={form} setForm={setForm} showPass={showPass} setShowPass={setShowPass} />
                {error && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {error}
                    </p>
                )}
                <div className="flex items-center gap-3 pt-1">
                    <button type="button" onClick={handleSave} disabled={saving}
                        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-60 flex items-center gap-2"
                        style={{ background: saving ? "#94a3b8" : "linear-gradient(135deg, #1d4ed8, #3b82f6)" }}>
                        {saving ? (<><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{t("saving")}</>) : t("changePassword")}
                    </button>
                    {saved && (
                        <span className="text-sm text-emerald-500 flex items-center gap-1 font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            {t("saved")}
                        </span>
                    )}
                </div>
            </div>
        </SectionCard>
    );
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

function NotificationsSection({ t }: { t: ReturnType<typeof useTranslations> }) {
    const { prefs, toggle } = useNotificationPrefs();

    return (
        <SectionCard
            title={t("notifications")}
            iconBg="bg-purple-50 dark:bg-purple-900/30" iconColor="text-purple-600 dark:text-purple-400"
            iconPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />}
        >
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">{t("channels")}</p>
            <SettingRow label={t("emailNotifs")} description={t("emailNotifsDesc")}>
                <Toggle checked={prefs.emailNotifs} onChange={() => toggle("emailNotifs")} accentColor="#8b5cf6" />
            </SettingRow>
            <SettingRow label={t("smsNotifs")} description={t("smsNotifsDesc")}>
                <Toggle checked={prefs.smsNotifs} onChange={() => toggle("smsNotifs")} accentColor="#8b5cf6" />
            </SettingRow>

            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-6 mb-2">{t("types")}</p>
            <SettingRow label={t("weeklyDigest")} description={t("weeklyDigestDesc")}>
                <Toggle checked={prefs.weeklyDigest} onChange={() => toggle("weeklyDigest")} accentColor="#8b5cf6" />
            </SettingRow>
            <SettingRow label={t("applicationUpdates")} description={t("applicationUpdatesDesc")}>
                <Toggle checked={prefs.applicationUpdates} onChange={() => toggle("applicationUpdates")} accentColor="#8b5cf6" />
            </SettingRow>
            <SettingRow label={t("taskReminders")} description={t("taskRemindersDesc")}>
                <Toggle checked={prefs.taskReminders} onChange={() => toggle("taskReminders")} accentColor="#8b5cf6" />
            </SettingRow>
        </SectionCard>
    );
}

// ─── PRIVACY ─────────────────────────────────────────────────────────────────

function PrivacySection({ t }: { t: ReturnType<typeof useTranslations> }) {
    const [prefs, setPrefs] = useState({ showEmail: false, showPhone: false, profileVisible: true, activityVisible: true });
    const toggle = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

    return (
        <div className="space-y-6">
            <SectionCard
                title={t("privacy")}
                iconBg="bg-emerald-50 dark:bg-emerald-900/30" iconColor="text-emerald-600 dark:text-emerald-400"
                iconPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />}
            >
                <SettingRow label={t("showEmail")} description={t("showEmailDesc")}><Toggle checked={prefs.showEmail} onChange={() => toggle("showEmail")} accentColor="#059669" /></SettingRow>
                <SettingRow label={t("showPhone")} description={t("showPhoneDesc")}><Toggle checked={prefs.showPhone} onChange={() => toggle("showPhone")} accentColor="#059669" /></SettingRow>
                <SettingRow label={t("profileVisible")} description={t("profileVisibleDesc")}><Toggle checked={prefs.profileVisible} onChange={() => toggle("profileVisible")} accentColor="#059669" /></SettingRow>
                <SettingRow label={t("activityVisible")} description={t("activityVisibleDesc")}><Toggle checked={prefs.activityVisible} onChange={() => toggle("activityVisible")} accentColor="#059669" /></SettingRow>
            </SectionCard>

            <SectionCard
                title={t("dangerZone")}
                iconBg="bg-red-50 dark:bg-red-900/30" iconColor="text-red-500 dark:text-red-400"
                iconPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />}
            >
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t("dangerZoneDesc")}</p>
                <button type="button" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 border-2 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    {t("requestDataDeletion")}
                </button>
            </SectionCard>
        </div>
    );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
    const t = useTranslations("settings");
    const { user, loading } = useAuth();
    const theme = useRoleTheme();
    const [active, setActive] = useState<Section>("account");

    if (loading) return <LoadingSpinner />;
    if (!user) return null;

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6">

            {/* Header */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mb-6">
                <div className={`h-24 bg-gradient-to-r ${theme.gradientFrom} ${theme.gradientTo} flex items-center px-8 gap-4`}>
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">{t("title")}</h1>
                        <p className={`text-sm ${theme.gradientSubtext}`}>{t("subtitle")}</p>
                    </div>
                </div>
            </div>

            {/* Mobile tabs */}
            <div className="md:hidden flex gap-1 overflow-x-auto pb-3 w-full -mx-4 px-4 mb-4">
                {NAV_ITEMS.map((item) => {
                    const isActive = active === item.key;
                    return (
                        <button key={item.key} type="button" onClick={() => setActive(item.key)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${isActive
                                ? `${theme.activeBg} ${theme.activeText}`
                                : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                                }`}>
                            <svg className={`w-3.5 h-3.5 ${isActive ? theme.activeIcon : "text-gray-400 dark:text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {item.iconPath}
                            </svg>
                            {t(item.key)}
                        </button>
                    );
                })}
            </div>

            <div className="flex gap-6 items-start">

                {/* Desktop sidebar */}
                <aside className="hidden md:flex flex-col w-52 shrink-0 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-3 sticky top-20">
                    {NAV_ITEMS.map((item) => {
                        const isActive = active === item.key;
                        return (
                            <button key={item.key} type="button" onClick={() => setActive(item.key)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${isActive
                                    ? `${theme.activeBg} ${theme.activeText} font-semibold`
                                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200"
                                    }`}>
                                <svg className={`w-4 h-4 shrink-0 ${isActive ? theme.activeIcon : "text-gray-400 dark:text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {item.iconPath}
                                </svg>
                                {t(item.key)}
                            </button>
                        );
                    })}
                </aside>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {active === "account" && <AccountSection t={t} theme={theme} />}
                    {active === "appearance" && <AppearanceSection t={t} />}
                    {active === "security" && <SecuritySection t={t} />}
                    {active === "notifications" && <NotificationsSection t={t} />}
                    {active === "privacy" && <PrivacySection t={t} />}
                </div>
            </div>
        </div>
    );
}
