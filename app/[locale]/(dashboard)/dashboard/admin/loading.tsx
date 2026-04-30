export default function AdminLoading() {
    return (
        <>
            <style>{`
                @keyframes shimmer-slide {
                    0%   { transform: translateX(-150%); }
                    100% { transform: translateX(150%); }
                }
                .sk {
                    position: relative;
                    overflow: hidden;
                    border-radius: 0.75rem;
                    background-color: #e5e7eb;
                }
                .sk::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(
                        105deg,
                        transparent 30%,
                        rgba(255,255,255,0.6) 50%,
                        transparent 70%
                    );
                    animation: shimmer-slide 1.5s ease-in-out infinite;
                }
                .dark .sk {
                    background-color: #1f2937;
                }
                .dark .sk::after {
                    background: linear-gradient(
                        105deg,
                        transparent 30%,
                        rgba(255,255,255,0.06) 50%,
                        transparent 70%
                    );
                }
            `}</style>

            <div className="space-y-6">

                {/* ── Stat cards row 1 (4 items) ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm px-4 py-4 sm:px-5 sm:py-5 flex flex-col gap-2">
                            <div className="sk h-2.5 rounded" style={{ width: 48 + i * 12 }} />
                            <div className="sk h-7 w-10 rounded-lg" />
                        </div>
                    ))}
                </div>

                {/* ── Stat cards row 2 (6 items) ── */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm px-4 py-4 sm:px-5 sm:py-5 flex flex-col gap-2">
                            <div className="sk h-2.5 rounded" style={{ width: 52 + i * 10 }} />
                            <div className="sk h-7 w-10 rounded-lg" />
                        </div>
                    ))}
                </div>

                {/* ── Table card ── */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 sm:p-8">

                    {/* Card header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="sk h-7 w-48 rounded-xl" />
                        <div className="sk h-6 w-24 rounded-full" />
                    </div>

                    {/* Filter bar */}
                    <div className="flex items-center gap-3 mb-6 flex-wrap">
                        <div className="sk h-9 w-48 sm:w-64 rounded-xl" />
                        <div className="sk h-9 w-24 rounded-xl" />
                        <div className="sk h-9 w-28 ml-auto rounded-xl" />
                    </div>

                    {/* Desktop table */}
                    <div className="hidden lg:block">
                        {/* Header */}
                        <div className="flex gap-8 pb-4 border-b border-gray-100 dark:border-gray-800">
                            {[120, 180, 100, 60].map((w, i) => (
                                <div key={i} className="sk h-3 rounded" style={{ width: w }} />
                            ))}
                        </div>
                        {/* Rows */}
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-8 py-[18px] border-b border-gray-50 dark:border-gray-800/60 last:border-0"
                            >
                                <div className="sk h-4 rounded" style={{ width: 110 + (i % 4) * 18 }} />
                                <div className="sk h-4 rounded" style={{ width: 155 + (i % 3) * 22 }} />
                                <div className="sk h-4 rounded" style={{ width: 80 + (i % 2) * 20 }} />
                                <div className="sk h-6 w-16 rounded-lg" />
                                <div className="ml-auto flex gap-1.5">
                                    <div className="sk w-7 h-7 rounded-lg" />
                                    <div className="sk w-7 h-7 rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Mobile cards */}
                    <div className="lg:hidden space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="sk w-9 h-9 shrink-0 rounded-xl" />
                                    <div className="flex-1 space-y-2">
                                        <div className="sk h-4 rounded" style={{ width: 100 + i * 14 }} />
                                        <div className="sk h-3 rounded" style={{ width: 140 + i * 10 }} />
                                    </div>
                                    <div className="sk h-6 w-14 shrink-0 rounded-lg" />
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-800">
                                    <div className="sk h-4 w-24 rounded" />
                                    <div className="flex gap-1.5">
                                        <div className="sk w-7 h-7 rounded-lg" />
                                        <div className="sk w-7 h-7 rounded-lg" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </>
    );
}
