"use client";

// This page renders outside the locale/i18n context (root layout crash),
// so next-intl is unavailable. We use a minimal inline dictionary instead.
const MESSAGES: Record<string, { title: string; description: string; retry: string }> = {
    es: { title: "Algo salió mal", description: "Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.", retry: "Reintentar" },
    en: { title: "Something went wrong", description: "An unexpected error occurred. Please try again.", retry: "Try again" },
    cs: { title: "Něco se pokazilo", description: "Došlo k neočekávané chybě. Zkuste to prosím znovu.", retry: "Zkusit znovu" },
};

function getMessages() {
    if (typeof navigator === "undefined") return MESSAGES.en;
    const lang = navigator.language?.slice(0, 2).toLowerCase();
    return MESSAGES[lang] ?? MESSAGES.en;
}

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const m = getMessages();

    return (
        <html lang="en">
            <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
                <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
                    <div style={{ textAlign: "center", maxWidth: "400px", padding: "0 24px" }}>
                        <div style={{
                            width: "64px", height: "64px", borderRadius: "50%", background: "#fef2f2",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 24px", fontSize: "28px",
                        }}>
                            !
                        </div>
                        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#1f2937", margin: "0 0 8px" }}>
                            {m.title}
                        </h1>
                        <p style={{ color: "#6b7280", margin: "0 0 24px", fontSize: "14px", lineHeight: 1.5 }}>
                            {m.description}
                        </p>
                        <button
                            onClick={reset}
                            style={{
                                padding: "10px 24px", background: "#2563eb", color: "#fff",
                                border: "none", borderRadius: "16px", fontSize: "14px",
                                fontWeight: 600, cursor: "pointer",
                            }}
                        >
                            {m.retry}
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
