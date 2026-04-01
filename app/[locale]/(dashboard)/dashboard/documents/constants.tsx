import type { DocState } from "./types";

export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "application/pdf"];

/** Visual config for each document state returned by the API */
export const DOC_STATE_CONFIG: Record<
    DocState,
    { labelKey: string; className: string; dot: string }
> = {
    pending: {
        labelKey: "statePending",
        className:
            "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-700/40",
        dot: "bg-amber-400",
    },
    approved: {
        labelKey: "stateApproved",
        className:
            "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-700/40",
        dot: "bg-green-500",
    },
    rejected: {
        labelKey: "stateRejected",
        className:
            "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-700/40",
        dot: "bg-red-500",
    },
};
export const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export const DOC_TYPE_MAP: Record<string, string> = {
    id_front: "idDoc",
    id_back: "idDoc",
    grade_certificate: "grades",
    cover_letter: "coverLetter",
    disability_certificate: "disability",
};

export const CARD_CONFIG: Record<string, { icon: React.ReactNode; labelKey: string; descKey: string }> = {
    idDoc: {
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />,
        labelKey: "cardIdDoc",
        descKey: "cardIdDocDesc",
    },
    grades: {
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
        labelKey: "cardGrades",
        descKey: "cardGradesDesc",
    },
    coverLetter: {
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
        labelKey: "cardCoverLetter",
        descKey: "cardCoverLetterDesc",
    },
    disability: {
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />,
        labelKey: "cardDisability",
        descKey: "cardDisabilityDesc",
    },
};
