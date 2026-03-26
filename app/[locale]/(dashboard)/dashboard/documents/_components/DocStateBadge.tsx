"use client";

import { useTranslations } from "next-intl";
import { DOC_STATE_CONFIG } from "../constants";
import type { DocState } from "../types";

interface DocStateBadgeProps {
    state: DocState;
    /** "sm" = texto más pequeño, default "md" */
    size?: "sm" | "md";
}

export default function DocStateBadge({ state, size = "md" }: DocStateBadgeProps) {
    const t = useTranslations("documents");
    const cfg = DOC_STATE_CONFIG[state];
    if (!cfg) return null;

    const textSize = size === "sm" ? "text-[10px]" : "text-[11px]";

    return (
        <span
            className={`inline-flex items-center gap-1 font-semibold rounded-full px-2 py-0.5 ${textSize} ${cfg.className}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
            {t(cfg.labelKey as Parameters<typeof t>[0])}
        </span>
    );
}
