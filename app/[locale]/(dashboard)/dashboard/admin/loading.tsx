export default function AdminLoading() {
    return (
        <>
            <style>{`
                @keyframes shimmer {
                    0%   { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .shimmer-block {
                    position: relative;
                    overflow: hidden;
                    background: #e5e7eb;
                    border-radius: 0.75rem;
                }
                .shimmer-block::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(90deg,
                        transparent 0%,
                        rgba(255,255,255,0.55) 50%,
                        transparent 100%);
                    animation: shimmer 1.4s infinite;
                }
                @media (prefers-color-scheme: dark) {
                    .shimmer-block { background: #1f2937; }
                    .shimmer-block::after {
                        background: linear-gradient(90deg,
                            transparent 0%,
                            rgba(255,255,255,0.07) 50%,
                            transparent 100%);
                    }
                }
                .dark .shimmer-block { background: #1f2937; }
                .dark .shimmer-block::after {
                    background: linear-gradient(90deg,
                        transparent 0%,
                        rgba(255,255,255,0.07) 50%,
                        transparent 100%);
                }
            `}</style>

            <div className="space-y-6">

                {/* Stat cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 flex items-center gap-4">
                            <div className="shimmer-block w-10 h-10 rounded-2xl shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="shimmer-block h-3 w-20" />
                                <div className="shimmer-block h-6 w-12" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Table card */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 sm:p-8">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="shimmer-block h-7 w-44" />
                        <div className="shimmer-block h-6 w-24 rounded-full" />
                    </div>

                    {/* Filter bar */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="shimmer-block h-9 flex-1 max-w-xs" />
                        <div className="shimmer-block h-9 w-24" />
                        <div className="shimmer-block h-9 w-28 ml-auto" />
                    </div>

                    {/* Desktop table rows */}
                    <div className="hidden lg:block space-y-0">
                        {/* Header row */}
                        <div className="flex gap-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                            {[140, 180, 100, 80].map((w, i) => (
                                <div key={i} className="shimmer-block h-3" style={{ width: w }} />
                            ))}
                        </div>
                        {/* Data rows */}
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-6 py-4 border-b border-gray-50 dark:border-gray-800 last:border-0"
                                style={{ animationDelay: `${i * 0.05}s` }}
                            >
                                <div className="shimmer-block h-4" style={{ width: 130 + (i % 3) * 20 }} />
                                <div className="shimmer-block h-4" style={{ width: 160 + (i % 2) * 30 }} />
                                <div className="shimmer-block h-4" style={{ width: 90 + (i % 4) * 10 }} />
                                <div className="shimmer-block h-6 w-16 rounded-lg" />
                                <div className="ml-auto flex gap-1">
                                    <div className="shimmer-block w-7 h-7 rounded-lg" />
                                    <div className="shimmer-block w-7 h-7 rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Mobile cards */}
                    <div className="lg:hidden space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="shimmer-block w-9 h-9 rounded-xl shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="shimmer-block h-4 w-32" />
                                        <div className="shimmer-block h-3 w-44" />
                                    </div>
                                    <div className="shimmer-block h-6 w-16 rounded-lg shrink-0" />
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-800">
                                    <div className="shimmer-block h-4 w-28" />
                                    <div className="flex gap-1">
                                        <div className="shimmer-block w-7 h-7 rounded-lg" />
                                        <div className="shimmer-block w-7 h-7 rounded-lg" />
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
