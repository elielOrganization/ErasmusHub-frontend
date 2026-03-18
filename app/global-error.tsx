"use client";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#fff',
                }}>
                    <div style={{
                        textAlign: 'center',
                        maxWidth: '400px',
                        padding: '0 24px',
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: '#fef2f2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            fontSize: '28px',
                        }}>
                            !
                        </div>

                        <h1 style={{
                            fontSize: '24px',
                            fontWeight: 700,
                            color: '#1f2937',
                            margin: '0 0 8px',
                        }}>
                            Something went wrong
                        </h1>

                        <p style={{
                            color: '#6b7280',
                            margin: '0 0 24px',
                            fontSize: '14px',
                            lineHeight: 1.5,
                        }}>
                            An unexpected error occurred. Please try again.
                        </p>

                        <button
                            onClick={reset}
                            style={{
                                padding: '10px 24px',
                                background: '#2563eb',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '16px',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
