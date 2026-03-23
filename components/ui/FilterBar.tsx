'use client';

import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import type { RoleTheme } from '@/hooks/useRoleTheme';

/* ── Types ─────────────────────────────────────────────────── */

interface FilterBase {
    key: string;
    label: string;
    icon: ReactNode;
    iconColor?: string;
}

export interface FilterCheckboxConfig extends FilterBase {
    type: 'checkbox';
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}

export interface FilterPillsConfig extends FilterBase {
    type: 'pills';
    value: string[];
    onChange: (value: string[]) => void;
    options: { value: string; label: string; icon?: ReactNode }[];
}

export type FilterConfig = FilterCheckboxConfig | FilterPillsConfig;

export interface ActionButtonConfig {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
}

export interface FilterBarProps {
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    filters?: FilterConfig[];
    filterLabel?: string;
    clearLabel?: string;
    applyLabel?: string;
    actionButton?: ActionButtonConfig;
}

/* ── Icons ─────────────────────────────────────────────────── */

function SearchIcon() {
    return (
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}

function FilterIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
        </svg>
    );
}

/* ── Helpers ───────────────────────────────────────────────── */

function countActive(filters: FilterConfig[]): number {
    let n = 0;
    for (const f of filters) {
        if (f.type === 'checkbox' && f.value !== '') n++;
        if (f.type === 'pills' && f.value.length > 0) n++;
    }
    return n;
}

function clearAll(filters: FilterConfig[]) {
    for (const f of filters) {
        if (f.type === 'checkbox') f.onChange('');
        if (f.type === 'pills') f.onChange([]);
    }
}

/* ── Checkbox filter section ───────────────────────────────── */

function CheckboxSection({ filter, theme }: { filter: FilterCheckboxConfig; theme: RoleTheme }) {
    return (
        <div className="space-y-1">
            {filter.options.map((opt) => {
                const selected = filter.value === opt.value;
                return (
                    <button
                        key={opt.value}
                        onClick={() => filter.onChange(selected ? '' : opt.value)}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors w-full text-left"
                    >
                        <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            selected ? theme.checkboxBg : 'border-gray-300 dark:border-gray-600'
                        }`}>
                            {selected && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

/* ── Pills filter section ──────────────────────────────────── */

function PillsSection({ filter, theme }: { filter: FilterPillsConfig; theme: RoleTheme }) {
    const toggle = (val: string) => {
        if (filter.value.includes(val)) {
            filter.onChange(filter.value.filter(v => v !== val));
        } else {
            filter.onChange([...filter.value, val]);
        }
    };

    return (
        <div className="flex flex-wrap gap-1.5">
            {filter.options.map((opt) => {
                const selected = filter.value.includes(opt.value);
                return (
                    <button
                        key={opt.value}
                        onClick={() => toggle(opt.value)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            selected
                                ? `${theme.pillBg} ${theme.pillText} ring-1 ${theme.borderLight}`
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        {opt.icon}
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}

/* ── Filter panel content (shared between dropdown & modal) ── */

function FilterPanelContent({
    filters,
    activeCount,
    clearLabel,
    theme,
}: {
    filters: FilterConfig[];
    activeCount: number;
    clearLabel: string;
    theme: RoleTheme;
}) {
    return (
        <>
            {filters.map((filter) => (
                <div key={filter.key}>
                    <div className="flex items-center gap-1.5 mb-2">
                        <span className={filter.iconColor || 'text-gray-400'}>{filter.icon}</span>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{filter.label}</span>
                    </div>
                    {filter.type === 'checkbox' ? (
                        <CheckboxSection filter={filter} theme={theme} />
                    ) : (
                        <PillsSection filter={filter} theme={theme} />
                    )}
                </div>
            ))}

            {/* Clear filters */}
            {activeCount > 0 && (
                <button
                    onClick={() => clearAll(filters)}
                    className="w-full py-1.5 rounded-lg text-xs font-medium text-white bg-red-500 hover:bg-red-600 cursor-pointer transition-colors"
                >
                    {clearLabel}
                </button>
            )}
        </>
    );
}

/* ── Close icon ───────────────────────────────────────────── */

function CloseIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

/* ── Main component ────────────────────────────────────────── */

export default function FilterBar({
    searchValue,
    onSearchChange,
    searchPlaceholder = '',
    filters = [],
    filterLabel: filterLabelProp,
    clearLabel: clearLabelProp,
    applyLabel: applyLabelProp,
    actionButton,
}: FilterBarProps) {
    const tCommon = useTranslations('common');
    const filterLabel = filterLabelProp ?? tCommon('filters');
    const clearLabel = clearLabelProp ?? tCommon('clearFilters');
    const applyLabel = applyLabelProp ?? tCommon('applyFilters');
    const theme = useRoleTheme();
    const [open, setOpen] = useState(false);
    const [visible, setVisible] = useState(false);   // keeps modal mounted during exit animation
    const [closing, setClosing] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const activeCount = countActive(filters);

    /* Open → show immediately */
    useEffect(() => {
        if (open) { setVisible(true); setClosing(false); }
    }, [open]);

    /* Animated close: play exit anim, then unmount */
    const closeModal = useCallback(() => {
        setClosing(true);
        const timer = setTimeout(() => {
            setOpen(false);
            setVisible(false);
            setClosing(false);
        }, 150);                // matches animate-modal-out / animate-fade-out duration
        return () => clearTimeout(timer);
    }, []);

    /* Click-outside to close (desktop only) */
    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    /* Lock body scroll when modal is open on mobile */
    useEffect(() => {
        if (!open) return;
        const original = document.body.style.overflow;
        const mq = window.matchMedia('(max-width: 639px)');
        if (mq.matches) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = original; };
    }, [open]);

    return (
        <div className="flex flex-wrap items-center gap-3 mb-5">
            {/* Search input */}
            {searchValue !== undefined && searchValue !== null && (
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <SearchIcon />
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                        placeholder={searchPlaceholder}
                        className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-9 pr-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 ${theme.focusRing} transition-colors`}
                    />
                </div>
            )}

            {/* Filter button */}
            {filters.length > 0 && (
                <div className="relative" ref={panelRef}>
                    <button
                        onClick={() => setOpen(o => !o)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                            activeCount > 0
                                ? `${theme.borderLight} ${theme.activeBg} ${theme.activeText}`
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                    >
                        <FilterIcon />
                        {filterLabel}
                        {activeCount > 0 && (
                            <span className={`ml-0.5 w-5 h-5 flex items-center justify-center rounded-full ${theme.badgeBg} text-white text-xs font-bold`}>
                                {activeCount}
                            </span>
                        )}
                    </button>

                    {/* Desktop dropdown (hidden on mobile) */}
                    {open && (
                        <div className="hidden sm:block absolute left-0 top-full mt-2 z-40 w-80 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg p-4 space-y-4">
                            <FilterPanelContent filters={filters} activeCount={activeCount} clearLabel={clearLabel} theme={theme} />
                        </div>
                    )}
                </div>
            )}

            {/* Mobile modal (visible only on <sm) */}
            {visible && filters.length > 0 && (
                <div className="sm:hidden fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className={`absolute inset-0 bg-black/40 ${closing ? 'animate-fade-out' : 'animate-fade-in'}`}
                        onClick={closeModal}
                    />

                    {/* Floating modal panel */}
                    <div className={`relative w-full max-w-sm max-h-[80vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col ${closing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">{filterLabel}</h3>
                            <button
                                onClick={closeModal}
                                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors cursor-pointer"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        {/* Scrollable content */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                            <FilterPanelContent filters={filters} activeCount={activeCount} clearLabel={clearLabel} theme={theme} />
                        </div>

                        {/* Apply button */}
                        <div className="px-5 pb-5 pt-3 border-t border-gray-100 dark:border-gray-800">
                            <button
                                onClick={closeModal}
                                className={`w-full py-2.5 rounded-xl text-sm font-semibold text-white ${theme.btnPrimary} ${theme.btnPrimaryHover} cursor-pointer transition-colors`}
                            >
                                {applyLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Spacer */}
            {actionButton && <div className="flex-1" />}

            {/* Action button */}
            {actionButton && (
                <button
                    onClick={actionButton.onClick}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white ${theme.btnPrimary} ${theme.btnPrimaryHover} transition-colors cursor-pointer`}
                >
                    {actionButton.icon}
                    {actionButton.label}
                </button>
            )}
        </div>
    );
}
